-- -----------------------------------------------------------------------------
-- Admin-Benutzer für Lekkr (einmalig pro Person)
-- -----------------------------------------------------------------------------
-- 1) Supabase Dashboard → Authentication → Users → „Add user“ → E-Mail + Passwort
--    (mindestens 6 Zeichen, wie im Admin-Login).
-- 2) SQL Editor: unten die Platzhalter ersetzen und ausführen.
--
-- tenant_id muss zu deinem Mandanten in public.tenants passen (Demo-Seed):
--   00000000-0000-0000-0000-000000000001
-- -----------------------------------------------------------------------------

-- Deine Auth-User-ID (Dashboard → User anklicken → UUID kopieren)
-- ODER im SQL: select id, email from auth.users where email = 'deine@email.de';
-- :id und :email durch echte Werte ersetzen:

insert into public.users (id, email, tenant_id, role, name)
values (
  'HIER_AUTH_USER_UUID'::uuid,
  'deine@email.de',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin',
  'Admin'
)
on conflict (id) do update set
  tenant_id = excluded.tenant_id,
  role = excluded.role,
  email = excluded.email;
