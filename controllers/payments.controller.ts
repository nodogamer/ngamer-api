import type { Context } from 'hono'
import { createPreference, confirmPayment } from '../services/payments.service.js'

export async function handleCreatePreference(c: Context) {
  const { email, plan } = await c.req.json<{ email: string; plan: number }>()
  const planId = Number(plan)

  if (!email || !planId) return c.json({ error: 'Email y plan son requeridos' }, 400)

  try {
    const init_point = await createPreference(email, planId)
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
