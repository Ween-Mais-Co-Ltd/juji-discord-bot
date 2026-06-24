import type { Context, Next } from 'hono'
import { verify } from 'hono/jwt'
import { supabaseUrl } from '../../config'
import type { SupabaseJwtPayload } from '../types'

let cachedKey: CryptoKey | null = null

async function getJwksKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey
  const res = await fetch(`${supabaseUrl}/auth/v1/.well-known/jwks.json`)
  if (!res.ok) throw new Error(`Failed to fetch Supabase JWKS: ${res.status}`)
  const jwks = (await res.json()) as { keys: JsonWebKey[] }
  cachedKey = await crypto.subtle.importKey(
    'jwk',
    jwks.keys[0],
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify'],
  )
  return cachedKey
}

export async function initJwks(): Promise<void> {
  await getJwksKey()
  console.log('JWKS public key loaded from Supabase')
}

export const authMiddleware = async (c: Context, next: Next): Promise<Response | undefined> => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401)
  }
  try {
    const payload = await verifySupabaseJwt(authHeader.slice(7))
    c.set('jwtPayload', payload)
    await next()
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
}

export async function verifySupabaseJwt(token: string): Promise<SupabaseJwtPayload> {
  const key = await getJwksKey()
  return (await verify(token, key, 'ES256')) as unknown as SupabaseJwtPayload
}
