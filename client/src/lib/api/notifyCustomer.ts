import { postNetlifyFunction } from '@/lib/api/netlify'

export async function notifyCustomerSms(
  tenantId: string,
  orderId: string,
  event: 'pickup_ready' | 'driver_en_route',
  accessToken: string,
): Promise<void> {
  const res = await postNetlifyFunction(
    'notify-customer',
    { tenantId, orderId, event },
    accessToken,
  )
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string }
    console.warn('[notify-customer]', j.error ?? res.status)
  }
}
