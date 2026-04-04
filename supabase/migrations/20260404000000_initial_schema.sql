-- Lekkr: initiales Multitenant-Schema (tenant_id überall beachten; RLS folgt separat)
-- Reihenfolge wegen Fremdschlüsseln: tenants → settings/users/categories/products/coupons → orders → abhängige Tabellen

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  domain text unique,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.tenant_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id) on delete cascade,
  primary_color text default '#CC2A40',
  secondary_color text default '#183052',
  background_color text default '#F5EFE4',
  accent_color text default '#62E6BE',
  logo_url text,
  font_heading text default 'Playfair Display',
  font_body text default 'DM Sans',
  min_order_value decimal(10, 2) default 12.00,
  delivery_fee decimal(10, 2) default 1.99,
  free_delivery_from decimal(10, 2) default 30.00,
  created_at timestamptz default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid references public.tenants (id),
  email text not null,
  name text,
  phone text,
  role text default 'customer',
  referral_code text unique,
  referral_credits decimal(10, 2) default 0,
  birthday date,
  email_verified boolean default false,
  marketing_consent boolean default false,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id) on delete cascade,
  name text not null,
  name_tr text,
  name_en text,
  sort_order integer default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id) on delete cascade,
  category_id uuid references public.categories (id),
  name text not null,
  name_tr text,
  name_en text,
  description text,
  description_tr text,
  description_en text,
  price decimal(10, 2) not null,
  price_old decimal(10, 2),
  tax_rate decimal(5, 2) default 7.00,
  main_image_url text,
  image_2_url text,
  image_3_url text,
  image_4_url text,
  video_url text,
  allergens text[],
  calories integer,
  sort_order integer default 0,
  is_featured boolean default false,
  popularity_count integer default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id) on delete cascade,
  code text not null,
  name text not null,
  type text not null check (type in ('percent', 'fixed', 'bundle', 'free')),
  value decimal(10, 2),
  min_order_value decimal(10, 2) default 0,
  max_uses integer,
  used_count integer default 0,
  valid_from timestamptz,
  valid_until timestamptz,
  target text default 'all' check (target in ('all', 'new_customers', 'specific')),
  active boolean default true,
  created_at timestamptz default now()
);

create unique index if not exists coupons_tenant_code_key on public.coupons (tenant_id, code);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id) on delete cascade,
  user_id uuid references public.users (id),
  order_number text unique not null,
  type text not null check (type in ('delivery', 'pickup')),
  status text default 'new' check (
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
  discount_amount decimal(10, 2) default 0,
  delivery_fee decimal(10, 2) default 0,
  tip_amount decimal(10, 2) default 0,
  total decimal(10, 2) not null,
  payment_method text,
  payment_status text default 'pending',
  stripe_payment_intent text,
  coupon_id uuid references public.coupons (id),
  referral_credit_used decimal(10, 2) default 0,
  driver_id uuid references public.users (id),
  notes text,
  delivery_address jsonb,
  estimated_time integer,
  created_at timestamptz default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id),
  order_id uuid references public.orders (id) on delete cascade,
  product_id uuid references public.products (id),
  quantity integer not null,
  unit_price decimal(10, 2) not null,
  total_price decimal(10, 2) not null,
  modifications jsonb,
  created_at timestamptz default now()
);

create table if not exists public.coupon_usages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id),
  coupon_id uuid references public.coupons (id),
  order_id uuid references public.orders (id),
  user_id uuid references public.users (id),
  discount_amount decimal(10, 2),
  created_at timestamptz default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id),
  referrer_id uuid references public.users (id),
  referred_id uuid references public.users (id),
  order_id uuid references public.orders (id),
  credit_amount decimal(10, 2) default 2.00,
  status text default 'pending' check (status in ('pending', 'credited')),
  created_at timestamptz default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id),
  user_id uuid references public.users (id),
  name text,
  street text not null,
  city text not null,
  zip text not null,
  is_default boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id) on delete cascade,
  name text not null,
  url text not null,
  type text check (type in ('image', 'video')),
  size_bytes integer,
  created_at timestamptz default now()
);

-- Hinweis: Row Level Security & Policies mit tenant_id-Isolation separat aktivieren
