-- LEH_CLOSETT GLOW — atualização incremental do painel administrativo.
-- Preserva os registros existentes e pode ser executada novamente.
create extension if not exists pgcrypto;

do $$ begin create type public.app_role as enum ('admin', 'moderator', 'user'); exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null, created_at timestamptz not null default now(), unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role from public.profiles where role = 'admin' and coalesce(is_active, true)
on conflict (user_id, role) do nothing;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
revoke all on function public.has_role(uuid, public.app_role) from public;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin'::public.app_role)
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;

drop policy if exists user_roles_read_own on public.user_roles;
create policy user_roles_read_own on public.user_roles for select to authenticated using (user_id = auth.uid());

-- Clientes podem alterar apenas seus dados básicos, nunca sua função de acesso.
revoke update on public.profiles from authenticated;
grant select, insert on public.profiles to authenticated;
grant update (full_name, cpf, phone) on public.profiles to authenticated;
grant all on public.profiles to service_role;

drop policy if exists admin_read_profiles on public.profiles;
create policy admin_read_profiles on public.profiles for select to authenticated using (public.is_admin());
drop policy if exists admin_read_addresses on public.addresses;
create policy admin_read_addresses on public.addresses for select to authenticated using (public.is_admin());

do $$ begin
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='categories' and column_name='is_active') then
    execute 'alter table public.categories add column if not exists active boolean not null default true';
    execute 'update public.categories set active = coalesce(is_active, true)';
  else execute 'alter table public.categories add column if not exists active boolean not null default true'; end if;
end $$;
alter table public.categories add column if not exists sort_order integer not null default 0;
alter table public.categories add column if not exists slug text;
alter table public.categories add column if not exists description text;
alter table public.categories add column if not exists image_url text;

alter table public.products add column if not exists active boolean not null default true;
alter table public.products add column if not exists featured boolean not null default false;
alter table public.products add column if not exists published boolean not null default false;
alter table public.products add column if not exists slug text;
alter table public.products add column if not exists description text;
alter table public.products add column if not exists price numeric(12,2) not null default 0;
alter table public.products add column if not exists compare_at_price numeric(12,2);
alter table public.products add column if not exists video_url text;

alter table public.product_variants add column if not exists sku text;
alter table public.product_variants add column if not exists size text;
alter table public.product_variants add column if not exists color text;
alter table public.product_variants add column if not exists price_override numeric(12,2);
alter table public.product_variants add column if not exists stock_quantity integer not null default 0;
alter table public.product_variants add column if not exists active boolean not null default true;

alter table public.product_images add column if not exists image_url text;
alter table public.product_images add column if not exists alt_text text;
alter table public.product_images add column if not exists sort_order integer not null default 0;
alter table public.product_images add column if not exists is_primary boolean not null default false;

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(), image_url text, title text, text text, link_url text,
  sort_order integer not null default 0, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
grant select on public.banners to anon, authenticated;
grant insert, update, delete on public.banners to authenticated;
grant all on public.banners to service_role;
alter table public.banners enable row level security;
alter table public.banners add column if not exists text text;
alter table public.banners add column if not exists link_url text;
alter table public.banners add column if not exists sort_order integer not null default 0;
alter table public.banners add column if not exists active boolean not null default true;

create table if not exists public.store_settings (
  id text primary key default 'default', appearance jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now()
);
grant select on public.store_settings to anon, authenticated;
grant insert, update, delete on public.store_settings to authenticated;
grant all on public.store_settings to service_role;
alter table public.store_settings enable row level security;
alter table public.store_settings add column if not exists appearance jsonb not null default '{}'::jsonb;
insert into public.store_settings(id, appearance) values ('default', '{}'::jsonb) on conflict(id) do nothing;

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(), name text not null, country text, internal_code text, is_active boolean not null default true,
  address text, city text, state text, postal_code text, contact_name text, contact_phone text, contact_email text,
  integration_type text, integration_identifier text, integration_status text not null default 'not_configured', last_synchronization timestamptz,
  supplier_order_data text, shipping_data text, internal_notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.suppliers to authenticated;
grant all on public.suppliers to service_role;
alter table public.suppliers enable row level security;

create table if not exists public.supplier_product_links (
  id uuid primary key default gen_random_uuid(), supplier_id uuid not null references public.suppliers(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade, variant_id uuid references public.product_variants(id) on delete cascade,
  external_product_id text, external_variant_id text, external_sku text, sync_enabled boolean not null default true,
  last_synced_at timestamptz, created_at timestamptz not null default now(), unique(supplier_id, variant_id)
);
grant select, insert, update, delete on public.supplier_product_links to authenticated;
grant all on public.supplier_product_links to service_role;
alter table public.supplier_product_links enable row level security;

create table if not exists public.supplier_sync_runs (
  id uuid primary key default gen_random_uuid(), supplier_id uuid references public.suppliers(id) on delete cascade,
  provider text not null, operation text not null, status text not null default 'pending', items_processed integer not null default 0,
  error_message text, started_at timestamptz not null default now(), finished_at timestamptz
);
grant select, insert, update, delete on public.supplier_sync_runs to authenticated;
grant all on public.supplier_sync_runs to service_role;
alter table public.supplier_sync_runs enable row level security;

grant select on public.categories, public.products, public.product_variants, public.product_images to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.product_variants, public.product_images to authenticated;
grant all on public.categories, public.products, public.product_variants, public.product_images to service_role;

do $$ declare t text; begin
  foreach t in array array['categories','products','product_variants','product_images','banners','store_settings','suppliers','supplier_product_links','supplier_sync_runs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists leh_admin_manage on public.%I', t);
    execute format('create policy leh_admin_manage on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

drop policy if exists leh_public_categories on public.categories;
create policy leh_public_categories on public.categories for select to anon, authenticated using(active = true);
drop policy if exists leh_public_products on public.products;
create policy leh_public_products on public.products for select to anon, authenticated using(active and published);
drop policy if exists leh_public_variants on public.product_variants;
create policy leh_public_variants on public.product_variants for select to anon, authenticated using(active and exists(select 1 from public.products p where p.id=product_id and p.active and p.published));
drop policy if exists leh_public_images on public.product_images;
create policy leh_public_images on public.product_images for select to anon, authenticated using(exists(select 1 from public.products p where p.id=product_id and p.active and p.published));
drop policy if exists leh_public_banners on public.banners;
create policy leh_public_banners on public.banners for select to anon, authenticated using(active);
drop policy if exists leh_public_settings on public.store_settings;
create policy leh_public_settings on public.store_settings for select to anon, authenticated using(id='default');

create or replace function public.admin_list_customers()
returns table(id uuid, email text, full_name text, cpf text, phone text, is_active boolean, created_at timestamptz, addresses jsonb, order_count bigint, total_spent numeric)
language plpgsql security definer set search_path=public,auth as $$ begin
  if not public.is_admin() then raise exception 'Forbidden'; end if;
  return query select u.id,u.email::text,p.full_name,p.cpf,p.phone,coalesce(p.is_active,true),u.created_at,
    coalesce((select jsonb_agg(to_jsonb(a) order by a.is_default desc,a.created_at desc) from public.addresses a where a.user_id=u.id),'[]'::jsonb),
    (select count(*) from public.orders o where o.user_id=u.id),
    coalesce((select sum(o.total) from public.orders o where o.user_id=u.id and lower(coalesce(o.payment_status,'')) in ('paid','approved','pago','confirmed')),0)
  from auth.users u left join public.profiles p on p.id=u.id order by u.created_at desc;
end $$;
revoke all on function public.admin_list_customers() from public;
grant execute on function public.admin_list_customers() to authenticated, service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-images','product-images',true,20971520,array['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/ogg'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists leh_media_public on storage.objects;
create policy leh_media_public on storage.objects for select to public using(bucket_id='product-images');
drop policy if exists leh_media_admin_insert on storage.objects;
create policy leh_media_admin_insert on storage.objects for insert to authenticated with check(bucket_id='product-images' and public.is_admin());
drop policy if exists leh_media_admin_update on storage.objects;
create policy leh_media_admin_update on storage.objects for update to authenticated using(bucket_id='product-images' and public.is_admin()) with check(bucket_id='product-images' and public.is_admin());
drop policy if exists leh_media_admin_delete on storage.objects;
create policy leh_media_admin_delete on storage.objects for delete to authenticated using(bucket_id='product-images' and public.is_admin());
