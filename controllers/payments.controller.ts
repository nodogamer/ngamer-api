import type { Context } from 'hono'
import { createPreference, confirmPayment } from '../services/payments.service.js'
import type { User } from '@supabase/supabase-js'

export async function handleCreatePreference(c: Context) {
  const user = c.get('user') as User
  const { plan, annual } = await c.req.json<{ plan: number; annual?: boolean }>()
  const planId = Number(plan)

  if (!planId) return c.json({ error: 'Plan requerido' }, 400)
  if (!user.email) return c.json({ error: 'El usuario no tiene email asociado' }, 400)

  try {
    const init_point = await createPreference(user.email, user.id, planId, annual ?? false)
    return c.json({ init_point })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno'
    return c.json({ error: message }, 500)
  }
}

export async function handleConfirmPayment(c: Context) {
  const { payment_id, order_id } = await c.req.json<{ payment_id: string; order_id: string }>()

  if (!payment_id || !order_id) return c.json({ error: 'payment_id y order_id son requeridos' }, 400)

  try {
    const status = await confirmPayment(payment_id, order_id)
    return c.json({ status })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno'
    return c.json({ error: message }, 400)
  }
}
