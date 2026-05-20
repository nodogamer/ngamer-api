import type { Context } from 'hono'
import { getOrdersByUserId } from '../repositories/orders.repository.js'

export async function handleGetOrders(c: Context) {
  try {
    const user = c.get('user') as { id: string }
    const orders = await getOrdersByUserId(user.id)
    return c.json({ orders })
  } catch (err) {
    console.error('[orders] error:', err)
    const message = err instanceof Error ? err.message : 'Error interno'
    return c.json({ error: message }, 500)
  }
}
