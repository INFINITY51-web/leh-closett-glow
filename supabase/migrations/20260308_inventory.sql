create table if not exists public.inventory_stock (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  sku text not null unique,
  product_name text not null,
  size text,
  color text,
  quantity integer not null default 0 check (quantity >= 0),
  minimum_quantity integer not null default 0 check (minimum_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  stock_id uuid not null references public.inventory_stock(id) on delete cascade,
  sku text not null,
  movement_type text not null check (movement_type in ('entry', 'exit', 'adjustment')),
  quantity integer not null,
  reason text not null,
  responsible text not null,
  created_at timestamptz not null default now()
);

alter table public.inventory_stock enable row level security;
alter table public.inventory_movements enable row level security;
create policy "admin inventory access" on public.inventory_stock for all to authenticated using (true) with check (true);
create policy "admin movement access" on public.inventory_movements for all to authenticated using (true) with check (true);

create or replace function public.apply_inventory_movement() returns trigger language plpgsql security definer as $$
begin
  update public.inventory_stock set quantity = case when new.movement_type = 'entry' then quantity + new.quantity when new.movement_type = 'exit' then quantity - new.quantity else new.quantity end, updated_at = now() where id = new.stock_id;
  return new;
end; $$;

drop trigger if exists inventory_movement_apply on public.inventory_movements;
create trigger inventory_movement_apply after insert on public.inventory_movements for each row execute function public.apply_inventory_movement();
