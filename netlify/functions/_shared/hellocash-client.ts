/**
 * helloCash REST-Integration (Bearer-Token).
 * Endpunkte per Umgebung überschreibbar, falls sich die API-URL unterscheidet.
 * Ohne HELLOCASH_API_KEY / Base-URL: No-Op (ok: true, skipped: true).
 */

type HellocashLine = {
  name: string
  quantity: number
  unitPrice: number
  total: number
  articleId?: string | null
}

export type HellocashInvoicePayload = {
  orderNumber: string
  tenantId: string
  orderId: string
  total: number
  lines: HellocashLine[]
  customerEmail?: string | null
}

function baseUrl(): string | null {
  const raw =
    process.env.HELLOCASH_API_BASE_URL ?? process.env.HELLOCASH_API_URL ?? ''
  const t = raw.replace(/\/$/, '')
  return t.length > 0 ? t : null
}

function authHeaders(): Record<string, string> {
  const key = process.env.HELLOCASH_API_KEY ?? ''
  if (!key) return {}
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

export async function hellocashCreateInvoice(
  payload: HellocashInvoicePayload,
): Promise<{ ok: boolean; skipped?: boolean; externalId?: string; error?: string }> {
  const base = baseUrl()
  const headers = authHeaders()
  if (!base || !headers.Authorization) {
    return { ok: true, skipped: true }
  }

  const path = process.env.HELLOCASH_INVOICE_PATH ?? '/v1/invoices'
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`

  const body = {
    reference: payload.orderId,
    order_number: payload.orderNumber,
    tenant_id: payload.tenantId,
    total: payload.total,
    lines: payload.lines.map((l) => ({
      name: l.name,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      total: l.total,
      article_id: l.articleId ?? undefined,
    })),
    customer_email: payload.customerEmail ?? undefined,
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, error: `helloCash Rechnung ${res.status}: ${text.slice(0, 200)}` }
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string }
    return { ok: true, externalId: data.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

export type StockLine = {
  articleId: string
  delta: number
}

/**
 * Bestandsbewegungen (negative delta = Abgang).
 */
export async function hellocashSyncStock(
  tenantId: string,
  lines: StockLine[],
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const base = baseUrl()
  const headers = authHeaders()
  if (!base || !headers.Authorization || lines.length === 0) {
    return { ok: true, skipped: true }
  }

  const path = process.env.HELLOCASH_STOCK_PATH ?? '/v1/inventory/movements'
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tenant_id: tenantId,
        movements: lines.map((l) => ({
          article_id: l.articleId,
          quantity_delta: l.delta,
        })),
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, error: `helloCash Bestand ${res.status}: ${text.slice(0, 200)}` }
    }
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}
