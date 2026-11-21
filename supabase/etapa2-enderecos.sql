
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text not null default 'Casa',
  cep text not null,
  endereco text not null,
  numero text not null,
  complemento text default '',
  bairro text not null,
  cidade text not null,
  estado text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.addresses enable row level security;

drop policy if exists "enderecos: dono le" on public.addresses;
drop policy if exists "enderecos: dono cria" on public.addresses;
drop policy if exists "enderecos: dono edita" on public.addresses;
drop policy if exists "enderecos: dono apaga" on public.addresses;

create policy "enderecos: dono le" on public.addresses
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "enderecos: dono cria" on public.addresses
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "enderecos: dono edita" on public.addresses
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "enderecos: dono apaga" on public.addresses
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.addresses to authenticated;

with extras as (
  select id, row_number() over (
    partition by user_id order by created_at, id
  ) as seq
  from public.addresses where is_default
)
update public.addresses a set is_default = false
from extras e where a.id = e.id and e.seq > 1;

with missing as (
  select distinct on (user_id) id
  from public.addresses a
  where not exists (
    select 1 from public.addresses principal
    where principal.user_id = a.user_id and principal.is_default
  )
  order by user_id, created_at, id
)
update public.addresses a set is_default = true
from missing m where a.id = m.id;

create unique index if not exists farmavida_one_default_address_per_user
  on public.addresses (user_id) where is_default;
create index if not exists farmavida_addresses_user_order
  on public.addresses (user_id, created_at, id);

create or replace function public.farmavida_save_address(
  p_address jsonb,
  p_id uuid default null
)
returns public.addresses
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_result public.addresses;
  v_main boolean;
begin
  if v_user is null then
    raise exception 'Faca login para gerenciar enderecos.' using errcode = '42501';
  end if;
  if p_address is null or jsonb_typeof(p_address) <> 'object' then
    raise exception 'Dados de endereco invalidos.' using errcode = '22023';
  end if;
  if length(regexp_replace(coalesce(p_address->>'cep', ''), '[^0-9]', '', 'g')) <> 8
      or btrim(coalesce(p_address->>'endereco', '')) = ''
      or btrim(coalesce(p_address->>'numero', '')) = ''
      or btrim(coalesce(p_address->>'bairro', '')) = ''
      or btrim(coalesce(p_address->>'cidade', '')) = ''
      or length(btrim(coalesce(p_address->>'estado', ''))) <> 2 then
    raise exception 'Preencha corretamente CEP, rua, numero, bairro, cidade e UF.' using errcode = '22023';
  end if;

  -- Evita alterações simultâneas do endereço principal.
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  v_main := coalesce((p_address->>'is_default')::boolean, false);

  if p_id is null then
    if not exists (select 1 from public.addresses where user_id = v_user) then
      v_main := true;
    end if;
    if v_main then
      update public.addresses set is_default = false
      where user_id = v_user and is_default;
    end if;
    insert into public.addresses (
      user_id, label, cep, endereco, numero, complemento, bairro, cidade, estado, is_default
    ) values (
      v_user, coalesce(nullif(btrim(p_address->>'label'), ''), 'Casa'),
      btrim(p_address->>'cep'), btrim(p_address->>'endereco'),
      btrim(p_address->>'numero'), coalesce(btrim(p_address->>'complemento'), ''),
      btrim(p_address->>'bairro'), btrim(p_address->>'cidade'),
      upper(btrim(p_address->>'estado')), v_main
    ) returning * into v_result;
  else
    select * into v_result from public.addresses
    where id = p_id and user_id = v_user for update;
    if not found then
      raise exception 'Endereco nao encontrado ou sem permissao.' using errcode = 'P0002';
    end if;
    v_main := v_main or v_result.is_default;
    if v_main then
      update public.addresses set is_default = false
      where user_id = v_user and id <> p_id and is_default;
    end if;
    update public.addresses set
      label = coalesce(nullif(btrim(p_address->>'label'), ''), 'Casa'),
      cep = btrim(p_address->>'cep'),
      endereco = btrim(p_address->>'endereco'),
      numero = btrim(p_address->>'numero'),
      complemento = coalesce(btrim(p_address->>'complemento'), ''),
      bairro = btrim(p_address->>'bairro'),
      cidade = btrim(p_address->>'cidade'),
      estado = upper(btrim(p_address->>'estado')),
      is_default = v_main
    where id = p_id and user_id = v_user
    returning * into v_result;
  end if;
  return v_result;
end;
$$;

create or replace function public.farmavida_set_default_address(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'Faca login para gerenciar enderecos.' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  if not exists (select 1 from public.addresses where id = p_id and user_id = v_user) then
    raise exception 'Endereco nao encontrado ou sem permissao.' using errcode = 'P0002';
  end if;
  update public.addresses set is_default = false
  where user_id = v_user and is_default and id <> p_id;
  update public.addresses set is_default = true
  where user_id = v_user and id = p_id;
end;
$$;

create or replace function public.farmavida_remove_address(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_was_default boolean;
  v_next uuid;
begin
  if v_user is null then
    raise exception 'Faca login para gerenciar enderecos.' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  delete from public.addresses
  where id = p_id and user_id = v_user
  returning is_default into v_was_default;
  if not found then
    raise exception 'Endereco nao encontrado ou sem permissao.' using errcode = 'P0002';
  end if;
  if v_was_default then
    select id into v_next from public.addresses
    where user_id = v_user order by created_at, id limit 1;
    if v_next is not null then
      update public.addresses set is_default = true
      where id = v_next and user_id = v_user;
    end if;
  end if;
end;
$$;

-- Restringe a execução das funções aos usuários autenticados.
revoke all on function public.farmavida_save_address(jsonb, uuid) from public;
revoke all on function public.farmavida_set_default_address(uuid) from public;
revoke all on function public.farmavida_remove_address(uuid) from public;
grant execute on function public.farmavida_save_address(jsonb, uuid) to authenticated;
grant execute on function public.farmavida_set_default_address(uuid) to authenticated;
grant execute on function public.farmavida_remove_address(uuid) to authenticated;
