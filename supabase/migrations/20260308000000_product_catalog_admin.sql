-- Estrutura do catálogo administrável. Execute após validar o schema atual do projeto.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id text,
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12,2) not null default 0,
  compare_at_price numeric(12,2),
  active boolean not null default true,
  featured boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null,
  size text,
  color text,
  stock_quantity integer not null default 0,
  price_override numeric(12,2),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;

create policy "catalogo publico de produtos publicados" on public.products for select using (active = true and published = true);
create policy "catalogo publico de variantes ativas" on public.product_variants for select using (active = true and exists (select 1 from public.products p where p.id = product_id and p.active = true and p.published = true));
create policy "catalogo publico de imagens" on public.product_images for select using (exists (select 1 from public.products p where p.id = product_id and p.active = true and p.published = true));
