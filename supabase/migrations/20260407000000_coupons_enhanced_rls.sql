-- Woche 7: Coupons erweitert, RLS, Trigger used_count

alter table public.coupons
  add column if not exists description text,
  add column if not exists bundle_config jsonb,
  add column if not exists free_product_id uuid references public.products (id) on delete set null,
  add column if not exists birthday_auto boolean not null default false,
  add column if not exists max_uses_per_user integer not null default 1;

create index if not exists idx_coupons_free_product on public.coupons (free_product_id)
  where free_product_id is not null;

-- ---------------------------------------------------------------------------
-- Trigger: used_count bei coupon_usages erhöhen
-- ---------------------------------------------------------------------------
create or replace function public.increment_coupon_used_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.coupon_id is not null then
    update public.coupons
    set used_count = used_count + 1
    where id = new.coupon_id;
  end if;
  return new;
end;
$$;

create unique index if not exists coupon_usages_one_per_order
  on public.coupon_usages (order_id)
  where order_id is not null;

drop trigger if exists tr_coupon_usages_increment_used on public.coupon_usages;
create trigger tr_coupon_usages_increment_used
  after insert on public.coupon_usages
  for each row
  execute function public.increment_coupon_used_count();

-- ---------------------------------------------------------------------------
-- RLS: Coupons (öffentlich lesbar wenn aktiv)
-- ---------------------------------------------------------------------------
alter table public.coupons enable row level security;

drop policy if exists "coupons_select_active" on public.coupons;
drop policy if exists "coupons_admin_all" on public.coupons;

create policy "coupons_select_active"
  on public.coupons for select
  to anon, authenticated
  using (active = true);

create policy "coupons_admin_all"
  on public.coupons for all
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.tenant_id = coupons.tenant_id
    )
  )
  with check (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.tenant_id = coupons.tenant_id
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: coupon_usages (nur Admin liest Statistiken)
-- ---------------------------------------------------------------------------
alter table public.coupon_usages enable row level security;

drop policy if exists "coupon_usages_select_admin" on public.coupon_usages;
drop policy if exists "coupon_usages_select_own" on public.coupon_usages;

create policy "coupon_usages_select_own"
  on public.coupon_usages for select
  to authenticated
  using (user_id = auth.uid());

create policy "coupon_usages_select_admin"
  on public.coupon_usages for select
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.tenant_id = coupon_usages.tenant_id
    )
  );
