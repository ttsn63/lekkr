-- Öffentliches Lesen der Shop-Einstellungen (Mindestbestellwert, Liefergebühr)
alter table public.tenant_settings enable row level security;

drop policy if exists "tenant_settings_select_public" on public.tenant_settings;

create policy "tenant_settings_select_public"
  on public.tenant_settings for select
  to anon, authenticated
  using (true);
