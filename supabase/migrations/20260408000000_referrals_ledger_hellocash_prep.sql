-- Woche 8: Referral-Zuordnung, Ledger-Tabelle referral_credits, Tenant-Belohnung, RPCs, RLS

-- ---------------------------------------------------------------------------
-- users: Wer hat wen geworben?
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists referred_by_user_id uuid references public.users (id) on delete set null;

create index if not exists idx_users_referred_by on public.users (referred_by_user_id);

-- ---------------------------------------------------------------------------
-- tenant_settings: Standard-Belohnung für Empfehlung (€)
-- ---------------------------------------------------------------------------
alter table public.tenant_settings
  add column if not exists referral_reward_amount decimal(10, 2) not null default 2.00;

-- ---------------------------------------------------------------------------
-- Ledger: Einzelbuchungen (earn / redeem) — Tabelle referral_credits
-- ---------------------------------------------------------------------------
create table if not exists public.referral_credits (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  entry_type text not null check (entry_type in ('earn', 'redeem')),
  referral_id uuid references public.referrals (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_referral_credits_tenant_user
  on public.referral_credits (tenant_id, user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- products: optionale helloCash-Artikel-ID für Bestandssync
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists hellocash_article_id text;

-- ---------------------------------------------------------------------------
-- RPC: Empfehler anhand Code verknüpfen (nur wenn noch leer, gleicher tenant)
-- ---------------------------------------------------------------------------
create or replace function public.link_referrer_code(p_code text, p_tenant_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  ref_user uuid;
  code_norm text;
  updated_id uuid;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;
  if p_tenant_id is null then
    return jsonb_build_object('ok', false, 'error', 'tenant_required');
  end if;
  code_norm := upper(trim(coalesce(p_code, '')));
  if length(code_norm) < 4 then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  select id into ref_user
  from public.users
  where tenant_id = p_tenant_id
    and referral_code is not null
    and upper(trim(referral_code)) = code_norm
    and id <> uid
  limit 1;

  if ref_user is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  update public.users
  set
    referred_by_user_id = ref_user,
    tenant_id = coalesce(tenant_id, p_tenant_id)
  where id = uid
    and referred_by_user_id is null
    and (tenant_id is null or tenant_id = p_tenant_id)
  returning id into updated_id;

  if updated_id is null then
    return jsonb_build_object('ok', false, 'error', 'already_linked');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.link_referrer_code(text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: Eigenen Empfehlungscode erzeugen (8 Zeichen, eindeutig)
-- ---------------------------------------------------------------------------
create or replace function public.ensure_my_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_code text;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  select referral_code into new_code from public.users where id = uid;
  if new_code is not null and length(trim(new_code)) >= 4 then
    return upper(trim(new_code));
  end if;

  loop
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    exit when not exists (
      select 1 from public.users u where u.referral_code = new_code
    );
  end loop;

  update public.users set referral_code = new_code where id = uid;
  return new_code;
end;
$$;

grant execute on function public.ensure_my_referral_code() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: referral_credits (nur eigene Zeilen + Admin)
-- ---------------------------------------------------------------------------
alter table public.referral_credits enable row level security;

drop policy if exists "referral_credits_select_own" on public.referral_credits;
drop policy if exists "referral_credits_select_admin" on public.referral_credits;

create policy "referral_credits_select_own"
  on public.referral_credits for select
  to authenticated
  using (user_id = auth.uid());

create policy "referral_credits_select_admin"
  on public.referral_credits for select
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.tenant_id = referral_credits.tenant_id
        and u.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: referrals (Empfänger sieht eigene Zeile; Admin sieht Mandant)
-- ---------------------------------------------------------------------------
alter table public.referrals enable row level security;

drop policy if exists "referrals_select_participants" on public.referrals;
drop policy if exists "referrals_select_admin" on public.referrals;

create policy "referrals_select_participants"
  on public.referrals for select
  to authenticated
  using (referrer_id = auth.uid() or referred_id = auth.uid());

create policy "referrals_select_admin"
  on public.referrals for select
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.tenant_id = referrals.tenant_id
        and u.role = 'admin'
    )
  );
