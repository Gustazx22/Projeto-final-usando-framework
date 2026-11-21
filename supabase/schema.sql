
create table if not exists public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label       text not null default 'Casa',
  cep         text not null,
  endereco    text not null,
  numero      text not null,
  complemento text default '',
  bairro      text not null,
  cidade      text not null,
  estado      text not null,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  itens       jsonb not null,
  subtotal    numeric(10,2) not null,
  entrega     numeric(10,2) not null,
  total       numeric(10,2) not null,
  pagamento   text not null,               -- pix | cartao | boleto | whatsapp
  status      text not null default 'pendente',
  endereco    jsonb not null,
  observacoes text default '',
  receita     text default '',             -- nome do arquivo da receita (PDF)
  created_at  timestamptz not null default now()
);

alter table public.addresses enable row level security;
alter table public.orders    enable row level security;

create policy "enderecos: dono le"      on public.addresses for select using (auth.uid() = user_id);
create policy "enderecos: dono cria"    on public.addresses for insert with check (auth.uid() = user_id);
create policy "enderecos: dono edita"   on public.addresses for update using (auth.uid() = user_id);
create policy "enderecos: dono apaga"   on public.addresses for delete using (auth.uid() = user_id);

create policy "pedidos: dono le"        on public.orders for select using (auth.uid() = user_id);
create policy "pedidos: dono cria"      on public.orders for insert with check (auth.uid() = user_id);
