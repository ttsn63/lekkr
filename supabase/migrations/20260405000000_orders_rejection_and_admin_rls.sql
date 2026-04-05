-- Ablehnung mit Begründung
alter table public.orders
  add column if not exists rejection_reason text;

-- ---------------------------------------------------------------------------
-- RLS: Tenant-Admin darf Katalog und Bestellungen des eigenen Mandanten verwalten
-- (Öffentliches Lesen aktiver Produkte bleibt über Policy „products_select_shop“ möglich.)
-- ---------------------------------------------------------------------------

alter table public.products enable row level security;
alter table public.categories enable row level security;

drop policy if exists "products_select_shop" on public.products;
drop policy if exists "products_admin_all" on public.products;
drop policy if exists "categories_select_shop" on public.categories;
drop policy if exists "categories_admin_all" on public.categories;

create policy "products_select_shop"
  on public.products for select
  to anon, authenticated
  using (active = true);

create policy "products_admin_all"
  on public.products for all
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.tenant_id = products.tenant_id
    )
  )
  with check (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.tenant_id = products.tenant_id
    )
  );

create policy "categories_select_shop"
  on public.categories for select
  to anon, authenticated
  using (active = true);

create policy "categories_admin_all"
  on public.categories for all
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.tenant_id = categories.tenant_id
    )
  )
  with check (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.tenant_id = categories.tenant_id
    )
  );

-- Bestellungen: Admin liest/aktualisiert Mandanten-Bestellungen
drop policy if exists "orders_select_tenant_admin" on public.orders;
drop policy if exists "orders_update_tenant_admin" on public.orders;

create policy "orders_select_tenant_admin"
  on public.orders for select
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.tenant_id = orders.tenant_id
    )
  );

create policy "orders_update_tenant_admin"
  on public.orders for update
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.tenant_id = orders.tenant_id
    )
  )
  with check (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.tenant_id = orders.tenant_id
    )
  );

drop policy if exists "order_items_select_tenant_admin" on public.order_items;

create policy "order_items_select_tenant_admin"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.tenant_id = order_items.tenant_id
    )
  );
