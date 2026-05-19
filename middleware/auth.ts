import type { Context, Next } from 'hono'
import { supabase } from '../lib/supabase.js'

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'No autorizado' }, 401)
  }

  const token = authHeader.slice(7)
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    return c.json({ error: 'Token inválido o expirado' }, 401)
  }

  c.set('user', data.user)
  await next()
}
