import type { Context } from 'hono'
import { getPlans } from '../repositories/plans.repository.js'

export async function handleGetPlans(c: Context) {
  try {
    const plans = await getPlans()
    return c.json(plans)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno'
    return c.json({ error: message }, 500)
  }
}
