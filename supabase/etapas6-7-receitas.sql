
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- O perfil farmacêutico é atribuído pelo administrador.
create table if not exists public.pharmacist_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.pharmacist_users enable row level security;
revoke all on table public.pharmacist_users from public, anon, authenticated;

create or replace function private.farmavida_has_pharmacist_role()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.pharmacist_users where user_id = auth.uid());
$$;
revoke all on function private.farmavida_has_pharmacist_role() from public, anon;
grant execute on function private.farmavida_has_pharmacist_role() to authenticated;

create or replace function public.farmavida_is_pharmacist()
returns boolean language sql stable security invoker set search_path = ''
as $$ select private.farmavida_has_pharmacist_role(); $$;
revoke all on function public.farmavida_is_pharmacist() from public, anon;
grant execute on function public.farmavida_is_pharmacist() to authenticated;

-- PDFs são armazenados em bucket privado.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('farmavida-receitas', 'farmavida-receitas', false, 10485760, array['application/pdf']::text[])
on conflict (id) do update set
  public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.receipt_documents (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  status text not null default 'aguardando_analise'
    check (status in ('aguardando_analise','aprovada','rejeitada')),
  review_note text not null default '',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists farmavida_receipts_owner_idx on public.receipt_documents (user_id, created_at desc);
create index if not exists farmavida_receipts_status_idx on public.receipt_documents (status, created_at desc);

create table if not exists public.receipt_events (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.receipt_documents(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  action text not null check (action in ('enviada','aprovada','rejeitada')),
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists farmavida_receipt_events_idx on public.receipt_events (receipt_id,created_at);

alter table public.receipt_documents enable row level security;
alter table public.receipt_events enable row level security;
revoke all on public.receipt_documents, public.receipt_events from public, anon, authenticated;
grant select on public.receipt_documents, public.receipt_events to authenticated;
drop policy if exists farmavida_receipts_read on public.receipt_documents;
create policy farmavida_receipts_read on public.receipt_documents for select to authenticated
 using (user_id = (select auth.uid()) or (select private.farmavida_has_pharmacist_role()));
drop policy if exists farmavida_receipt_events_read on public.receipt_events;
create policy farmavida_receipt_events_read on public.receipt_events for select to authenticated
 using (owner_id = (select auth.uid()) or (select private.farmavida_has_pharmacist_role()));

drop policy if exists farmavida_receipts_upload on storage.objects;
create policy farmavida_receipts_upload on storage.objects for insert to authenticated
 with check (bucket_id = 'farmavida-receitas'
   and owner_id = (select auth.uid())::text
   and (storage.foldername(name))[1] = (select auth.uid())::text
   and name ~ ('^' || (select auth.uid())::text || '/[0-9a-f-]{36}\.pdf$'));
drop policy if exists farmavida_receipts_download on storage.objects;
create policy farmavida_receipts_download on storage.objects for select to authenticated
 using (bucket_id = 'farmavida-receitas' and (
   owner_id = (select auth.uid())::text or
   ((select private.farmavida_has_pharmacist_role()) and exists (
       select 1 from public.receipt_documents rd where rd.storage_path = name
   ))
 ));
drop policy if exists farmavida_receipts_cleanup on storage.objects;
create policy farmavida_receipts_cleanup on storage.objects for delete to authenticated
 using (bucket_id = 'farmavida-receitas'
   and owner_id = (select auth.uid())::text
   and not exists(select 1 from public.receipt_documents rd where rd.storage_path = name));

-- Pedido e receita são vinculados na mesma transação.

create or replace function private.farmavida_create_order_with_receipt_internal(
  p_items jsonb,
  p_address_id uuid,
  p_payment text,
  p_observations text,
  p_expected_total numeric,
  p_receipt_path text,
  p_file_name text
) returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_address public.addresses%rowtype;
  v_product public.products%rowtype;
  v_order public.orders%rowtype;
  v_item jsonb;
  v_id bigint;
  v_quantity integer;
  v_ids bigint[] := '{}'::bigint[];
  v_items jsonb := '[]'::jsonb;
  v_subtotal numeric(10,2) := 0;
  v_delivery numeric(10,2);
  v_total numeric(10,2);
  v_receipt_id uuid;
begin
  if v_uid is null then
    raise exception 'Faça login para finalizar um pedido.';
  end if;
  if p_receipt_path is null or p_receipt_path !~ ('^' || v_uid::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$') then
    raise exception 'Caminho de receita inválido ou de outro usuário.';
  end if;
  if p_file_name is null or length(p_file_name) not between 5 and 160 or
     p_file_name !~* '\.pdf$' or p_file_name ~ '[[:cntrl:]]' or
     position('/' in p_file_name) > 0 or position(chr(92) in p_file_name) > 0 then
    raise exception 'Nome do arquivo PDF inválido.';
  end if;
  perform 1 from storage.objects so
    where so.bucket_id = 'farmavida-receitas'
      and so.name = p_receipt_path
      and so.owner_id = v_uid::text
      and so.metadata ->> 'mimetype' = 'application/pdf'
      and case when coalesce(so.metadata ->> 'size', '') ~ '^[0-9]{1,15}$'
        then (so.metadata ->> 'size')::bigint between 1 and 10485760
        else false end;
  if not found then
    raise exception 'Receita não encontrada no armazenamento privado ou inválida.';
  end if;

  if p_address_id is null then
    raise exception 'Escolha um endereço de entrega.';
  end if;
  if p_payment is null or p_payment not in ('pix', 'cartao', 'boleto', 'whatsapp') then
    raise exception 'Forma de pagamento inválida.';
  end if;
  if p_observations is null or length(p_observations) > 500 then
    raise exception 'Observações inválidas (máximo 500 caracteres).';
  end if;
  if p_items is null or jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'O pedido precisa ter itens válidos.';
  end if;
  if jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'Informe de 1 a 50 produtos.';
  end if;

  select * into v_address from public.addresses
   where id = p_address_id and user_id = v_uid;
  if not found then
    raise exception 'Endereço não encontrado ou sem permissão.';
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_item) is distinct from 'object' or
       jsonb_typeof(v_item -> 'id') is distinct from 'number' or
       jsonb_typeof(v_item -> 'qtd') is distinct from 'number' or
       (v_item ->> 'id') !~ '^[0-9]{1,18}$' or
       (v_item ->> 'qtd') !~ '^[0-9]{1,2}$' then
      raise exception 'Produto ou quantidade inválidos.';
    end if;

    v_id := (v_item ->> 'id')::bigint;
    v_quantity := (v_item ->> 'qtd')::integer;
    if v_id <= 0 or v_quantity < 1 or v_quantity > 99 then
      raise exception 'Quantidade permitida: 1 a 99 unidades por produto.';
    end if;
    if v_id = any(v_ids) then
      raise exception 'O pedido contém produtos repetidos.';
    end if;
    v_ids := array_append(v_ids, v_id);

    select * into v_product from public.products
     where id = v_id and active = true;
    if not found then
      raise exception 'Produto % não encontrado ou indisponível.', v_id;
    end if;
    v_subtotal := v_subtotal + v_product.price * v_quantity;
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'id', v_id, 'nome', v_product.name,
      'qtd', v_quantity, 'preco', v_product.price
    ));
  end loop;

  v_delivery := case when v_subtotal >= 100 then 0 else 12.90 end;
  v_total := v_subtotal + v_delivery;

  if p_expected_total is null or p_expected_total <> v_total then
    raise exception 'O preço do catálogo mudou. Atualize a página e adicione os produtos novamente antes de concluir.';
  end if;

  insert into public.orders (
    user_id, itens, subtotal, entrega, total, pagamento, status,
    endereco, observacoes, receita
  ) values (
    v_uid, v_items, v_subtotal, v_delivery, v_total, p_payment,
    'aguardando_analise',
    jsonb_build_object(
      'label', v_address.label, 'cep', v_address.cep,
      'endereco', v_address.endereco, 'numero', v_address.numero,
      'complemento', v_address.complemento,
      'bairro', v_address.bairro, 'cidade', v_address.cidade, 'estado', v_address.estado
    ),
    p_observations, p_file_name
  ) returning * into v_order;

  insert into public.receipt_documents (order_id, user_id, storage_path, file_name, status)
    values (v_order.id, v_uid, p_receipt_path, p_file_name, 'aguardando_analise')
    returning id into v_receipt_id;
  insert into public.receipt_events (receipt_id, owner_id, actor_id, action, note)
    values (v_receipt_id, v_uid, v_uid, 'enviada', 'Receita recebida, aguardando análise manual.');
  return v_order;
end;
$$;

revoke all on function private.farmavida_create_order_with_receipt_internal(jsonb,uuid,text,text,numeric,text,text)
  from public, anon;
grant execute on function private.farmavida_create_order_with_receipt_internal(jsonb,uuid,text,text,numeric,text,text)
  to authenticated;

create or replace function public.farmavida_create_order_with_receipt(
  p_items jsonb, p_address_id uuid, p_payment text, p_observations text,
  p_expected_total numeric, p_receipt_path text, p_file_name text
) returns public.orders language sql security invoker set search_path = ''
as $$
  select private.farmavida_create_order_with_receipt_internal($1,$2,$3,$4,$5,$6,$7);
$$;
revoke all on function public.farmavida_create_order_with_receipt(jsonb,uuid,text,text,numeric,text,text)
  from public, anon;
grant execute on function public.farmavida_create_order_with_receipt(jsonb,uuid,text,text,numeric,text,text)
  to authenticated;

-- A fila exige perfil farmacêutico.
create or replace function private.farmavida_review_queue_internal()
returns table(
 id uuid, order_id uuid, file_name text, storage_path text, status text,
 review_note text, created_at timestamptz, reviewed_at timestamptz, itens jsonb
) language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.farmavida_has_pharmacist_role() then
    raise exception 'Acesso restrito ao farmacêutico autorizado.';
  end if;
  return query
   select r.id,r.order_id,r.file_name,r.storage_path,r.status,r.review_note,
          r.created_at,r.reviewed_at,o.itens
   from public.receipt_documents r join public.orders o on o.id = r.order_id
   order by (r.status = 'aguardando_analise') desc, r.created_at desc
   limit 100;
end; $$;
revoke all on function private.farmavida_review_queue_internal() from public, anon;
grant execute on function private.farmavida_review_queue_internal() to authenticated;
create or replace function public.farmavida_review_queue()
returns table(id uuid, order_id uuid, file_name text, storage_path text, status text,
 review_note text, created_at timestamptz, reviewed_at timestamptz, itens jsonb)
language sql stable security invoker set search_path = ''
as $$ select * from private.farmavida_review_queue_internal(); $$;
revoke all on function public.farmavida_review_queue() from public, anon;
grant execute on function public.farmavida_review_queue() to authenticated;

-- O status é definido pelo servidor.
create or replace function private.farmavida_review_receipt_internal(
  p_receipt_id uuid, p_decision text, p_note text
) returns public.receipt_documents
language plpgsql security definer set search_path = ''
as $$
declare
 v_row public.receipt_documents%rowtype;
 v_reviewer uuid := auth.uid();
 v_note text := btrim(coalesce(p_note,''));
begin
 if v_reviewer is null or not private.farmavida_has_pharmacist_role() then
   raise exception 'Acesso restrito ao farmacêutico autorizado.';
 end if;
 if p_decision is null or p_decision not in ('aprovada','rejeitada') then
   raise exception 'Decisão inválida.';
 end if;
 if length(v_note) > 1000 or (p_decision = 'rejeitada' and v_note = '') then
   raise exception 'A rejeição exige justificativa de até 1.000 caracteres.';
 end if;
 select * into v_row from public.receipt_documents
   where id = p_receipt_id for update;
 if not found then raise exception 'Receita não encontrada.'; end if;
 if v_row.user_id = v_reviewer then
   raise exception 'O farmacêutico não pode analisar sua própria receita.';
 end if;
 if v_row.status <> 'aguardando_analise' then
   raise exception 'Esta receita já foi analisada e não pode ser reavaliada.';
 end if;
 if not exists (select 1 from public.orders where id=v_row.order_id
   and status='aguardando_analise') then
   raise exception 'O pedido não está aguardando análise.';
 end if;
 update public.receipt_documents set status = p_decision, review_note=v_note,
   reviewed_by=v_reviewer, reviewed_at=now() where id=v_row.id returning * into v_row;
 update public.orders set status = case when p_decision='aprovada'
   then 'receita_aprovada' else 'receita_rejeitada' end where id=v_row.order_id;
 insert into public.receipt_events(receipt_id,owner_id,actor_id,action,note)
   values (v_row.id,v_row.user_id,v_reviewer,p_decision,v_note);
 return v_row;
end;
$$;
revoke all on function private.farmavida_review_receipt_internal(uuid,text,text) from public, anon;
grant execute on function private.farmavida_review_receipt_internal(uuid,text,text) to authenticated;
create or replace function public.farmavida_review_receipt(
 p_receipt_id uuid, p_decision text, p_note text
) returns public.receipt_documents
language sql security invoker set search_path = ''
as $$ select private.farmavida_review_receipt_internal($1,$2,$3); $$;
revoke all on function public.farmavida_review_receipt(uuid,text,text) from public, anon;
grant execute on function public.farmavida_review_receipt(uuid,text,text) to authenticated;

select 'Etapas 6-7 criadas: bucket privado, documentos, eventos, permissões e RPCs' as resultado;
