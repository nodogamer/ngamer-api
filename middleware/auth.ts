import type { Context, Next } from 'hono'
import { supabase } from '../lib/supabase.js'

export async function authMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'No autorizado', detail: 'missing header' }, 401)
    }

    const token = authHeader.slice(7)
    const { data, error } = await supabase.auth.getUser(token)

    if (error) {
      console.error('[auth] getUser error:', error.message)
      return c.json({ error: 'Token inválido', detail: error.message }, 401)
    }

    if (!data.user) {
      return c.json({ error: 'Token inválido', detail: 'no user' }, 401)
    }

    c.set('user', data.user)
    await next()
  } catch (err) {
    console.error('[auth] unexpected error:', err)
    return c.json({ error: 'Error interno en auth', detail: String(err) }, 500)
  }
}
