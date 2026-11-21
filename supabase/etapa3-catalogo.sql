
create table if not exists public.product_categories (
  id text primary key,
  label text not null check (length(btrim(label)) > 0),
  sort_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.products (
  id bigint primary key,
  category_id text not null references public.product_categories(id),
  name text not null check (length(btrim(name)) > 0),
  price numeric(10,2) not null check (price >= 0),
  image text not null default '',
  badge text check (badge is null or badge in ('new', 'sale', 'bestseller', 'outlet')),
  description text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  requires_prescription boolean not null default false
);

create index if not exists farmavida_products_category_order
  on public.products (category_id, sort_order, id) where active;

alter table public.product_categories enable row level security;
alter table public.products enable row level security;
revoke all on table public.product_categories from anon, authenticated;
revoke all on table public.products from anon, authenticated;
grant select on table public.product_categories to anon, authenticated;
grant select on table public.products to anon, authenticated;

drop policy if exists "catalogo: categorias publicas" on public.product_categories;
create policy "catalogo: categorias publicas"
  on public.product_categories for select to anon, authenticated using (active = true);
drop policy if exists "catalogo: produtos publicos" on public.products;
create policy "catalogo: produtos publicos"
  on public.products for select to anon, authenticated using (active = true);

-- Preserva produtos já cadastrados ao executar novamente.
insert into public.product_categories (id, label, sort_order) values
  ('medicamentos', 'Medicamentos', 0),
  ('genericos', 'Genéricos', 1),
  ('vitaminas', 'Vitaminas e Suplementos', 2),
  ('higiene', 'Higiene e Beleza', 3),
  ('cuidados', 'Cuidados com a Saúde', 4),
  ('ofertas', 'Ofertas Especiais', 5)
on conflict (id) do nothing;

insert into public.products (id, category_id, name, price, image, badge, description, sort_order) values
  (1, 'medicamentos', 'Dipirona 500mg', '8.90', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', 'bestseller', 'Analgésico e antitérmico genérico', 0),
  (4, 'medicamentos', 'Paracetamol 750mg', '6.90', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', null, 'Analgésico e antitérmico', 1),
  (7, 'medicamentos', 'Ibuprofeno 600mg', '15.90', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', 'sale', 'Anti-inflamatório não esteroidal', 2),
  (9, 'medicamentos', 'Dorflex 35mg', '12.90', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', 'bestseller', 'Relaxante muscular e analgésico', 3),
  (10, 'medicamentos', 'Buscopan 10mg', '18.50', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', null, 'Antiespasmódico para cólicas', 4),
  (11, 'medicamentos', 'Tylenol 750mg', '22.90', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', 'new', 'Paracetamol de liberação prolongada', 5),
  (12, 'genericos', 'Amoxicilina 500mg (Genérico)', '14.90', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', 'bestseller', 'Antibiótico de amplo espectro', 0),
  (13, 'genericos', 'Losartana 50mg (Genérico)', '9.90', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', null, 'Para hipertensão arterial', 1),
  (14, 'genericos', 'Metformina 850mg (Genérico)', '7.50', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', 'sale', 'Diabetes tipo 2', 2),
  (15, 'genericos', 'Omeprazol 20mg (Genérico)', '11.90', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', null, 'Protetor gástrico', 3),
  (16, 'genericos', 'Sinvastatina 20mg (Genérico)', '8.90', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', 'bestseller', 'Controle de colesterol', 4),
  (17, 'genericos', 'Atenolol 25mg (Genérico)', '6.50', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', null, 'Betabloqueador para pressão', 5),
  (2, 'vitaminas', 'Vitamina C 1g', '12.50', 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&q=80', 'new', 'Suplemento vitamínico efervescente', 0),
  (5, 'vitaminas', 'Ômega 3 1000mg', '38.90', 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&q=80', 'bestseller', 'Ácidos graxos essenciais', 1),
  (8, 'vitaminas', 'Colágeno Hidrolisado', '55.90', 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&q=80', 'new', 'Pele, cabelo e unhas', 2),
  (18, 'vitaminas', 'Vitamina D3 2000UI', '28.90', 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&q=80', 'bestseller', 'Imunidade e ossos', 3),
  (19, 'vitaminas', 'Magnésio Quelato', '32.90', 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&q=80', null, 'Relaxamento muscular', 4),
  (20, 'vitaminas', 'Complexo B', '19.90', 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&q=80', 'sale', 'Energia e metabolismo', 5),
  (3, 'higiene', 'Protetor Solar FPS 50', '45.90', '/products/higiene/protetor-solar.svg', 'sale', 'UVA/UVB resistente à água', 0),
  (6, 'higiene', 'Shampoo Anticaspa', '28.90', '/products/higiene/shampoo-anticaspa.svg', null, 'Caspa e seborreia', 1),
  (21, 'higiene', 'Hidratante Corporal', '35.90', '/products/higiene/hidratante-corporal.svg', 'new', 'Pele seca e sensível', 2),
  (22, 'higiene', 'Sabonete Líquido Neutro', '18.90', '/products/higiene/sabonete-liquido.svg', null, 'Limpeza suave diária', 3),
  (23, 'higiene', 'Creme Dental Clareador', '14.90', '/products/higiene/creme-dental.svg', 'bestseller', 'Branqueamento gradual', 4),
  (24, 'higiene', 'Desodorante Roll-on 48h', '22.90', '/products/higiene/desodorante-roll-on.svg', null, 'Proteção prolongada', 5),
  (25, 'cuidados', 'Termômetro Digital', '24.90', 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=300&q=80', 'bestseller', 'Leitura rápida e precisa', 0),
  (26, 'cuidados', 'Monitor Pressão Braço', '189.90', 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=300&q=80', null, 'Automático com memória', 1),
  (27, 'cuidados', 'Glicosímetro + Tiras', '89.90', 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=300&q=80', 'sale', 'Diabetes - kit completo', 2),
  (28, 'cuidados', 'Nebulizador Ultrassônico', '159.90', 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=300&q=80', 'new', 'Silencioso e portátil', 3),
  (29, 'cuidados', 'Oxímetro de Dedo', '69.90', 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=300&q=80', 'bestseller', 'Saturação e batimentos', 4),
  (30, 'cuidados', 'Bolsa Térmica Gel', '19.90', 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=300&q=80', null, 'Quente/frio para dores', 5),
  (31, 'ofertas', 'Kit Higiene Bucal', '29.90', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d79b?w=300&q=80', 'sale', 'Escova + pasta + fio dental', 0),
  (32, 'ofertas', 'Kit Primeiros Socorros', '49.90', 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=300&q=80', 'bestseller', 'Curativos, antisséptico, tesoura', 1),
  (33, 'ofertas', 'Protetor Solar + Pós-sol', '59.90', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d79b?w=300&q=80', 'sale', 'Dupla proteção verão', 2),
  (34, 'ofertas', 'Vitamina C + Zinco', '34.90', 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&q=80', 'new', 'Imunidade reforçada', 3),
  (35, 'ofertas', 'Shampoo + Condicionador', '42.90', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d79b?w=300&q=80', null, 'Cabelos saudáveis', 4),
  (36, 'ofertas', 'Kit Bebê Completo', '79.90', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d79b?w=300&q=80', 'bestseller', 'Sabonete, shampoo, pomada, óleo', 5)
on conflict (id) do nothing;

select (select count(*) from public.product_categories) as categorias,
       (select count(*) from public.products) as produtos;
