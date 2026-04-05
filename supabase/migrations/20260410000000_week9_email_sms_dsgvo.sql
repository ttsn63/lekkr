-- Woche 9: Kommunikation, DSGVO-Felder, Versand-Log (tenant_id überall)

-- ---------------------------------------------------------------------------
-- tenant_settings: Rechtstexte (optional, sonst Fallback im Frontend)
-- ---------------------------------------------------------------------------
alter table public.tenant_settings
  add column if not exists legal_impressum text,
  add column if not exists legal_privacy text,
  add column if not exists legal_terms text,
  add column if not exists company_display_name text;

comment on column public.tenant_settings.legal_impressum is 'HTML oder Plaintext – Impressum';
comment on column public.tenant_settings.legal_privacy is 'HTML oder Plaintext – Datenschutz';
comment on column public.tenant_settings.legal_terms is 'HTML oder Plaintext – AGB';

-- ---------------------------------------------------------------------------
-- users: Telefon (SMS), Willkommen, Marketing Double-Opt-In
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists phone text,
  add column if not exists welcome_email_sent_at timestamptz,
  add column if not exists marketing_confirm_token text,
  add column if not exists marketing_confirmed_at timestamptz;

create index if not exists idx_users_marketing_token on public.users (marketing_confirm_token)
  where marketing_confirm_token is not null;

-- ---------------------------------------------------------------------------
-- Idempotenz für E-Mail/SMS pro Bestellung (nur serverseitig, Service Role)
-- ---------------------------------------------------------------------------
create table if not exists public.notification_dispatch_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  order_id uuid references public.orders (id) on delete cascade,
  user_id uuid references public.users (id) on delete set null,
  kind text not null,
  channel text not null default 'email',
  created_at timestamptz not null default now()
);

create unique index if not exists notification_dispatch_unique_order_kind
  on public.notification_dispatch_log (tenant_id, order_id, kind)
  where order_id is not null;

create index if not exists notification_dispatch_tenant on public.notification_dispatch_log (tenant_id);

-- Falls die Tabelle schon ohne user_id existierte
alter table public.notification_dispatch_log
  add column if not exists user_id uuid references public.users (id) on delete set null;

alter table public.notification_dispatch_log enable row level security;
