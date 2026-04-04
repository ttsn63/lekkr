import type { Handler } from '@netlify/functions'

export const handler: Handler = async () => {
  return {
    statusCode: 501,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: false, message: 'helloCash – noch nicht implementiert' }),
  }
}
