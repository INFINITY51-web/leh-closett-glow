create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_full_name text not null,
  customer_cpf text not null,
  customer_phone text not null,
  customer_email text not null,
  shipping_address text not null,
  shipping_cep text not null,
  shipping_city text not null,
  shipping_state text not null,
  subtotal numeric(12,2) not null check (subtotal >= 0),
  shipping numeric(12,2) not null default 0 check (shipping >= 0),
  total numeric(12,2) not null check (total >= 0),
  status text not null default 'preparando' check (status in ('preparando','enviado','entregue','cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  product_image text,
  variation text,
  size text not null,
  color text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "public can create orders" on public.orders for insert to anon, authenticated with check (true);
create policy "public can read orders by number" on public.orders for select to anon, authenticated using (true);
create policy "public can create order items" on public.order_items for insert to anon, authenticated with check (true);
create policy "public can read order items" on public.order_items for select to anon, authenticated using (true);

create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists orders_order_number_idx on public.orders(order_number);
