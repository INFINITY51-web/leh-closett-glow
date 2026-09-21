create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= 0),
  active boolean not null default true,
  featured boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  size text,
  color text,
  price_override numeric(12,2) check (price_override is null or price_override >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_active_published_idx on public.products(active, published);
create index if not exists product_variants_product_id_idx on public.product_variants(product_id);
create index if not exists product_variants_active_idx on public.product_variants(active);
create index if not exists product_images_product_id_idx on public.product_images(product_id);
create index if not exists product_images_primary_idx on public.product_images(product_id, is_primary);
create index if not exists categories_active_idx on public.categories(active);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;

create policy "Public can view active categories" on public.categories for select to anon, authenticated using (active = true);
create policy "Public can view published products" on public.products for select to anon, authenticated using (active = true and published = true);
create policy "Public can view active variants of published products" on public.product_variants for select to anon, authenticated using (active = true and exists (select 1 from public.products p where p.id = product_id and p.active = true and p.published = true));
create policy "Public can view images of published products" on public.product_images for select to anon, authenticated using (exists (select 1 from public.products p where p.id = product_id and p.active = true and p.published = true));
