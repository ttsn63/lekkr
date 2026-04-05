import { supabase } from '@/lib/supabase'

export type StaffInvitationRow = {
  id: string
  tenant_id: string
  email: string
  role: 'kitchen' | 'driver'
  token: string
  invited_by: string | null
  expires_at: string
  accepted_at: string | null
  created_at: string
}

export async function fetchStaffInvitations(tenantId: string): Promise<StaffInvitationRow[]> {
  const { data, error } = await supabase
    .from('staff_invitations')
    .select('id, tenant_id, email, role, token, invited_by, expires_at, accepted_at, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as StaffInvitationRow[]
}

export async function createStaffInvitation(
  tenantId: string,
  email: string,
  role: 'kitchen' | 'driver',
  invitedBy: string,
) {
  const { data, error } = await supabase
    .from('staff_invitations')
    .insert({
      tenant_id: tenantId,
      email: email.trim().toLowerCase(),
      role,
      invited_by: invitedBy,
    })
    .select('id, token')
    .maybeSingle()

  if (error) throw error
  return data
}

export async function revokeStaffInvitation(tenantId: string, invitationId: string) {
  const { error } = await supabase
    .from('staff_invitations')
    .delete()
    .eq('id', invitationId)
    .eq('tenant_id', tenantId)

  if (error) throw error
}
