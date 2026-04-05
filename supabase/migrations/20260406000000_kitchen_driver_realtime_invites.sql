-- Woche 6: GPS für Fahrer, Einladungen, Realtime, RLS für Küche/Fahrer

-- ---------------------------------------------------------------------------
-- orders: letzte Fahrer-Position (aktive Lieferung)
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists driver_lat double precision,
  add column if not exists driver_lng double precision,
  add column if not exists driver_location_updated_at timestamptz;

-- ---------------------------------------------------------------------------
-- Mitarbeiter-Einladungen (Küche / Fahrer)
-- ---------------------------------------------------------------------------
create table if not exists public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  email text not null,
  role text not null check (role in ('kitchen', 'driver')),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid references public.users (id) on delete set null,
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_staff_invitations_tenant_id on public.staff_invitations (tenant_id);
create index if not exists idx_staff_invitations_token on public.staff_invitations (token);

create unique index if not exists staff_invitations_pending_email
  on public.staff_invitations (tenant_id, lower(email))
  where accepted_at is null;

-- ---------------------------------------------------------------------------
-- Realtime: Bestellungen für Küche/Fahrer/Admin
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: Einladung annehmen (nach Login, E-Mail muss übereinstimmen)
-- ---------------------------------------------------------------------------
create or replace function public.accept_staff_invitation(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.staff_invitations%rowtype;
  v_email text;
begin
  v_email := auth.jwt() ->> 'email';
  if v_email is null or length(trim(v_email)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select * into v_inv
  from public.staff_invitations
  where token = p_token
    and accepted_at is null
    and expires_at > now();

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid_or_expired');
  end if;

  if lower(trim(v_inv.email)) != lower(trim(v_email)) then
    return jsonb_build_object('ok', false, 'error', 'email_mismatch');
  end if;

  insert into public.users (id, email, tenant_id, role)
  values (auth.uid(), v_email, v_inv.tenant_id, v_inv.role)
  on conflict (id) do update set
    email = excluded.email,
    tenant_id = excluded.tenant_id,
    role = excluded.role;

  update public.staff_invitations
  set accepted_at = now()
  where id = v_inv.id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.accept_staff_invitation(text) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: users (eigene Zeile + Fahrer-Liste für Admin/Küche)
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_select_drivers_for_ops" on public.users;
drop policy if exists "users_insert_own" on public.users;
drop policy if exists "users_update_own" on public.users;

create policy "users_select_own"
  on public.users for select
  to authenticated
  using (id = auth.uid());

create policy "users_select_drivers_for_ops"
  on public.users for select
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.tenant_id = users.tenant_id
        and u.role in ('admin', 'kitchen')
    )
    and users.role = 'driver'
    and users.tenant_id is not null
  );

create policy "users_insert_own"
  on public.users for insert
  to authenticated
  with check (id = auth.uid());

create policy "users_update_own"
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS: staff_invitations (nur Admin des Mandanten)
-- ---------------------------------------------------------------------------
alter table public.staff_invitations enable row level security;

drop policy if exists "staff_invitations_admin_all" on public.staff_invitations;

create policy "staff_invitations_admin_all"
  on public.staff_invitations for all
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.tenant_id = staff_invitations.tenant_id
    )
  )
  with check (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.tenant_id = staff_invitations.tenant_id
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: orders – Küche lesen/aktualisieren (Kanban)
-- ---------------------------------------------------------------------------
drop policy if exists "orders_select_kitchen" on public.orders;
drop policy if exists "orders_update_kitchen" on public.orders;

create policy "orders_select_kitchen"
  on public.orders for select
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'kitchen'
        and u.tenant_id = orders.tenant_id
    )
  );

create policy "orders_update_kitchen"
  on public.orders for update
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'kitchen'
        and u.tenant_id = orders.tenant_id
    )
  )
  with check (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'kitchen'
        and u.tenant_id = orders.tenant_id
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: orders – Fahrer (eigene + freie Lieferungen „ready“)
-- ---------------------------------------------------------------------------
drop policy if exists "orders_select_driver" on public.orders;
drop policy if exists "orders_update_driver" on public.orders;

create policy "orders_select_driver"
  on public.orders for select
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'driver'
        and u.tenant_id = orders.tenant_id
    )
    and (
      orders.driver_id = auth.uid()
      or (
        orders.type = 'delivery'
        and orders.status in ('ready', 'delivering')
        and orders.driver_id is null
      )
    )
  );

create policy "orders_update_driver"
  on public.orders for update
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'driver'
        and u.tenant_id = orders.tenant_id
    )
    and (
      orders.driver_id is null
      or orders.driver_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'driver'
        and u.tenant_id = orders.tenant_id
    )
    and (
      driver_id is null
      or driver_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: order_items – Küche & Fahrer (über Mandant)
-- ---------------------------------------------------------------------------
drop policy if exists "order_items_select_kitchen" on public.order_items;
drop policy if exists "order_items_select_driver" on public.order_items;

create policy "order_items_select_kitchen"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'kitchen'
        and u.tenant_id = order_items.tenant_id
    )
  );

create policy "order_items_select_driver"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'driver'
        and u.tenant_id = order_items.tenant_id
    )
    and exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and o.tenant_id = order_items.tenant_id
        and (
          o.driver_id = auth.uid()
          or (
            o.type = 'delivery'
            and o.status in ('ready', 'delivering')
            and o.driver_id is null
          )
        )
    )
  );
