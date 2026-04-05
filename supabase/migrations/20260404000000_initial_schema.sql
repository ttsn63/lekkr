-- Lekkr: Multitenant-Schema (alle Kern-Tabellen)
-- Kernregel: Abfragen immer mit tenant_id filtern. RLS-Policies separat aktivieren.

-- ---------------------------------------------------------------------------
-- tenants & Einstellungen
-- ---------------------------------------------------------------------------

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  domain text unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  primary_color text not null default '#CC2A40',
  secondary_color text not null default '#183052',
  background_color text not null default '#F5EFE4',
  accent_color text not null default '#62E6BE',
  logo_url text,
  font_heading text not null default 'Playfair Display',
  font_body text not null default 'DM Sans',
  min_order_value decimal(10, 2) not null default 12.00,
  delivery_fee decimal(10, 2) not null default 1.99,
  free_delivery_from decimal(10, 2) not null default 30.00,
  created_at timestamptz not null default now(),
  unique (tenant_id)
);

create index if not exists idx_tenant_settings_tenant_id on public.tenant_settings (tenant_id);

-- ---------------------------------------------------------------------------
-- users (1:1 mit auth.users)
-- ---------------------------------------------------------------------------

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid references public.tenants (id) on delete set null,
  email text not null,
  name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin', 'kitchen', 'driver')),
  referral_code text unique,
  referral_credits decimal(10, 2) not null default 0,
  birthday date,
  email_verified boolean not null default false,
  marketing_consent boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_tenant_id on public.users (tenant_id);
create index if not exists idx_users_email on public.users (email);

-- ---------------------------------------------------------------------------
-- Katalog
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  name_tr text,
  name_en text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_categories_tenant_id on public.categories (tenant_id);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  name_tr text,
  name_en text,
  description text,
  description_tr text,
  description_en text,
  price decimal(10, 2) not null,
  price_old decimal(10, 2),
  tax_rate decimal(5, 2) not null default 7.00,
  main_image_url text,
  image_2_url text,
  image_3_url text,
  image_4_url text,
  video_url text,
  allergens text[],
  calories integer,
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  popularity_count integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_tenant_id on public.products (tenant_id);
create index if not exists idx_products_category_id on public.products (category_id);

-- ---------------------------------------------------------------------------
-- Coupons
-- ---------------------------------------------------------------------------

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  code text not null,
  name text not null,
  type text not null check (type in ('percent', 'fixed', 'bundle', 'free')),
  value decimal(10, 2),
  min_order_value decimal(10, 2) not null default 0,
  max_uses integer,
  used_count integer not null default 0,
  valid_from timestamptz,
  valid_until timestamptz,
  target text not null default 'all' check (target in ('all', 'new_customers', 'specific')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create index if not exists idx_coupons_tenant_id on public.coupons (tenant_id);

-- ---------------------------------------------------------------------------
-- Bestellungen
-- ---------------------------------------------------------------------------

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid references public.users (id) on delete set null,
  order_number text not null unique,
  type text not null check (type in ('delivery', 'pickup')),
  status text not null default 'new' check (
    status in (
      'new',
      'confirmed',
      'preparing',
      'ready',
      'delivering',
      'delivered',
      'cancelled'
    )
  ),
  subtotal decimal(10, 2) not null,
  discount_amount decimal(10, 2) not null default 0,
  delivery_fee decimal(10, 2) not null default 0,
  tip_amount decimal(10, 2) not null default 0,
  total decimal(10, 2) not null,
  payment_method text,
  payment_status text not null default 'pending',
  stripe_payment_intent text,
  coupon_id uuid references public.coupons (id) on delete set null,
  referral_credit_used decimal(10, 2) not null default 0,
  driver_id uuid references public.users (id) on delete set null,
  notes text,
  delivery_address jsonb,
  estimated_time integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_tenant_id on public.orders (tenant_id);
create index if not exists idx_orders_user_id on public.orders (user_id);
create index if not exists idx_orders_created_at on public.orders (tenant_id, created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price decimal(10, 2) not null,
  total_price decimal(10, 2) not null,
  modifications jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order_id on public.order_items (order_id);
create index if not exists idx_order_items_tenant_id on public.order_items (tenant_id);

create table if not exists public.coupon_usages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  coupon_id uuid references public.coupons (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  user_id uuid references public.users (id) on delete set null,
  discount_amount decimal(10, 2),
  created_at timestamptz not null default now()
);

create index if not exists idx_coupon_usages_tenant_id on public.coupon_usages (tenant_id);

-- ---------------------------------------------------------------------------
-- Referrals & Adressen & Medien
-- ---------------------------------------------------------------------------

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  referrer_id uuid references public.users (id) on delete set null,
  referred_id uuid references public.users (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  credit_amount decimal(10, 2) not null default 2.00,
  status text not null default 'pending' check (status in ('pending', 'credited')),
  created_at timestamptz not null default now()
);

create index if not exists idx_referrals_tenant_id on public.referrals (tenant_id);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  label text,
  street text not null,
  city text not null,
  zip text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_addresses_tenant_user on public.addresses (tenant_id, user_id);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  name text not null,
  url text not null,
  type text check (type in ('image', 'video')),
  size_bytes integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_media_tenant_id on public.media (tenant_id);
create index if not exists idx_media_product_id on public.media (product_id);

-- Row Level Security: später aktivieren; erst Policies mit tenant_id testen.
-- alter table public.tenants enable row level security;
-- ...
