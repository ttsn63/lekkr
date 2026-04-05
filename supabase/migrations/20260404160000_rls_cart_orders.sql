-- RLS: Warenkorb nur für eigenen auth.uid()
alter table public.cart_items enable row level security;

drop policy if exists "cart_items_select_own" on public.cart_items;
drop policy if exists "cart_items_insert_own" on public.cart_items;
drop policy if exists "cart_items_update_own" on public.cart_items;
drop policy if exists "cart_items_delete_own" on public.cart_items;

create policy "cart_items_select_own"
  on public.cart_items for select
  to authenticated
  using (auth.uid() = user_id);

create policy "cart_items_insert_own"
  on public.cart_items for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "cart_items_update_own"
  on public.cart_items for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "cart_items_delete_own"
  on public.cart_items for delete
  to authenticated
  using (auth.uid() = user_id);

-- Eigene Bestellungen lesen (Bestätigungsseite)
alter table public.orders enable row level security;

drop policy if exists "orders_select_own" on public.orders;

create policy "orders_select_own"
  on public.orders for select
  to authenticated
  using (auth.uid() = user_id);

-- order_items: nur über eigene Bestellung
alter table public.order_items enable row level security;

drop policy if exists "order_items_select_own_order" on public.order_items;

create policy "order_items_select_own_order"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );
