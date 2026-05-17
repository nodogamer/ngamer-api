import type { Context } from 'hono'
import { verifySignature, processPaymentNotification } from '../services/webhooks.service.js'

export async function handleMercadoPagoWebhook(c: Context) {
  const signature = c.req.header('x-signature') ?? ''
  const requestId = c.req.header('x-request-id') ?? ''
  const body = await c.req.json<{ type: string; data: { id: string } }>()

  const isValid = await verifySignature(signature, requestId, body.data?.id)
  if (!isValid) return c.json({ error: 'Firma inválida' }, 401)

  if (body.type !== 'payment') return c.json({ ok: true })

  await processPaymentNotification(body.data.id)

  return c.json({ ok: true })
}
