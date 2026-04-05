-- Warenkorb (eingeloggte Nutzer; tenant_id Pflicht)
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id, product_id)
);

create index if not exists idx_cart_items_tenant_user on public.cart_items (tenant_id, user_id);

-- Stripe Checkout Session → Bestellung (Webhook / Bestätigung)
alter table public.orders
  add column if not exists stripe_checkout_session_id text;

create unique index if not exists orders_stripe_checkout_session_id_key
  on public.orders (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
