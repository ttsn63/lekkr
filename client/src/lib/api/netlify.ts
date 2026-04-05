import { getPublicSiteUrl } from '@/lib/site'

function apiBase(): string {
  return getPublicSiteUrl().replace(/\/$/, '')
}

export async function postNetlifyFunction(
  name: string,
  body: unknown,
  accessToken?: string | null,
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }
  return fetch(`${apiBase()}/api/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}
