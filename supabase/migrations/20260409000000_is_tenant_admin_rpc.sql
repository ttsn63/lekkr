-- Admin-Erkennung für das Frontend: zuverlässige Prüfung trotz RLS/Tenant-Kantenfällen.
-- Wird von useIsAdmin via supabase.rpc aufgerufen (nur auth.uid(), kein Datenleck).

create or replace function public.is_tenant_admin(p_tenant_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and lower(trim(u.role::text)) = 'admin'
      and (u.tenant_id is null or u.tenant_id = p_tenant_id)
  );
$$;

comment on function public.is_tenant_admin(uuid) is
  'True wenn der angemeldete Nutzer in public.users Admin ist und dem Mandanten zugeordnet ist (tenant_id NULL oder gleich p_tenant_id).';

revoke all on function public.is_tenant_admin(uuid) from public;
grant execute on function public.is_tenant_admin(uuid) to authenticated;
