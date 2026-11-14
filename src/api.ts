import { API_URL } from './config'
export async function api<T = any>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const token = localStorage.getItem('yaki_token') || ''
  const r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action, token, ...body }) })
  const j = await r.json()
  if (!j.ok) throw new Error(j.error)
  return j.data
}
