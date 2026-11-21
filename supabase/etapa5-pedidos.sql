-- FarmaVida | ETAPA 5 | Checkout validado no PostgreSQL
-- Execute no Supabase > SQL Editor > New query > Run.
-- Script idempotente: NAO apaga nem altera pedidos existentes.
-- Pre-requisito: executar etapa2-enderecos.sql e etapa3-catalogo.sql.
-- ATENCAO: constantes do frete (R$ 100 / R$ 12,90) devem acompanhar src/config.js.
-- Ambiente ACADEMICO: pagamentos sao somente simulados.

-- Para bases que ainda nao criaram a tabela de pedidos (preserva tabelas existentes).
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  itens jsonb not null,
  subtotal numeric(10,2) not null,
  entrega numeric(10,2) not null,
  total numeric(10,2) not null,
  pagamento text not null,
  status text not null default 'pendente',
  endereco jsonb not null,
  observacoes text default '',
  receita text default '',
  created_at timestamptz not null default now()
);
create index if not exists farmavida_orders_by_user_created
  on public.orders (user_id, created_at desc);

-- Mantem linhas antigas para nao quebrar a historico, mas valida TODAS as novas linhas.
-- NOT VALID apenas ignora a verificacao retroativa dos pedidos ja registrados.
do $$
begin
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.orders'::regclass and conname = 'farmavida_order_payment_valid') then
    alter table public.orders add constraint farmavida_order_payment_valid
      check (pagamento in ('pix', 'cartao', 'boleto', 'whatsapp')) not valid;
  end if;
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.orders'::regclass and conname = 'farmavida_order_status_valid') then
    alter table public.orders add constraint farmavida_order_status_valid
      check (status in (
        'pendente', 'aguardando_pagamento', 'pago', 'aguardando_analise',
        'receita_aprovada', 'receita_rejeitada', 'cancelado', 'enviado', 'entregue'
      )) not valid;
  end if;
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.orders'::regclass and conname = 'farmavida_order_totals_valid') then
    alter table public.orders add constraint farmavida_order_totals_valid
      check (subtotal >= 0 and entrega >= 0 and total = subtotal + entrega) not valid;
  end if;
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.orders'::regclass and conname = 'farmavida_order_items_valid') then
    alter table public.orders add constraint farmavida_order_items_valid
      check (jsonb_typeof(itens) = 'array' and jsonb_array_length(itens) between 1 and 50) not valid;
  end if;
end $$;

-- Clientes somente LEEM pedidos proprios. Ninguem grava pedidos diretamente via REST.
alter table public.orders enable row level security;
drop policy if exists "pedidos: dono cria" on public.orders;
drop policy if exists "pedidos: dono le" on public.orders;
create policy "pedidos: dono le" on public.orders
  for select to authenticated using ((select auth.uid()) = user_id);
revoke all on table public.orders from public, anon, authenticated;
grant select on table public.orders to authenticated;

-- A rotina privilegiada fica FORA dos schemas expostos na Data API.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.farmavida_create_order_internal(
  p_items jsonb,
  p_address_id uuid,
  p_payment text,
  p_observations text,
  p_expected_total numeric
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
begin
  if v_uid is null then
    raise exception 'Faça login para finalizar um pedido.';
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

  -- Nunca usar endereço de outra conta, mesmo que seja enviado um UUID conhecido.
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

    -- A tabela e a fonte de verdade para nome, preco, disponibilidade e receita.
    select * into v_product from public.products
     where id = v_id and active = true;
    if not found then
      raise exception 'Produto % não encontrado ou indisponível.', v_id;
    end if;
    if v_product.requires_prescription then
      raise exception 'Este produto exige receita: aguarde o fluxo de análise farmacêutica (etapa 6).';
    end if;
    v_subtotal := v_subtotal + v_product.price * v_quantity;
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'id', v_id, 'nome', v_product.name,
      'qtd', v_quantity, 'preco', v_product.price
    ));
  end loop;

  -- Frete decidido pelo servidor, independentemente dos dados do navegador.
  v_delivery := case when v_subtotal >= 100 then 0 else 12.90 end;
  v_total := v_subtotal + v_delivery;

  -- Se o preço mudou enquanto o carrinho estava aberto, nao finalizar silenciosamente.
  if p_expected_total is null or p_expected_total <> v_total then
    raise exception 'O preço do catálogo mudou. Atualize a página e adicione os produtos novamente antes de concluir.';
  end if;

  insert into public.orders (
    user_id, itens, subtotal, entrega, total, pagamento, status,
    endereco, observacoes, receita
  ) values (
    v_uid, v_items, v_subtotal, v_delivery, v_total, p_payment,
    case when p_payment = 'whatsapp' then 'pendente' else 'aguardando_pagamento' end,
    jsonb_build_object(
      'label', v_address.label, 'cep', v_address.cep,
      'endereco', v_address.endereco, 'numero', v_address.numero,
      'complemento', v_address.complemento,
      'bairro', v_address.bairro, 'cidade', v_address.cidade, 'estado', v_address.estado
    ),
    p_observations, ''
  ) returning * into v_order;

  return v_order;
end;
$$;
revoke all on function private.farmavida_create_order_internal(jsonb,uuid,text,text,numeric)
  from public, anon;
grant execute on function private.farmavida_create_order_internal(jsonb,uuid,text,text,numeric)
  to authenticated;

-- RPC publico sem privilegios extras, chamando a funcao privada protegida.
create or replace function public.farmavida_create_order(
  p_items jsonb,
  p_address_id uuid,
  p_payment text,
  p_observations text,
  p_expected_total numeric
) returns public.orders
language sql
security invoker
set search_path = ''
as $$
  select private.farmavida_create_order_internal($1, $2, $3, $4, $5);
$$;
revoke all on function public.farmavida_create_order(jsonb,uuid,text,text,numeric)
  from public, anon;
grant execute on function public.farmavida_create_order(jsonb,uuid,text,text,numeric)
  to authenticated;

-- Conferencia sem vazar pedidos: ver apenas a existencia e permissoes das funcoes.
select routine_schema, routine_name, security_type
from information_schema.routines
where routine_name in ('farmavida_create_order', 'farmavida_create_order_internal')
order by routine_schema;
