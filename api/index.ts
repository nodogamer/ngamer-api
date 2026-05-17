import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'
import { supabase } from '../lib/supabase.js'

export const config = { runtime: 'edge' }

const MP_API = 'https://api.mercadopago.com'

const PLANS: Record<string, { label: string; amount: number }> = {
  'bloque-de-tierra': { label: 'Bloque de Tierra', amount: 5000 },
  'diamante':         { label: 'Diamante',          amount: 10000 },
  'netherita':        { label: 'Netherita',          amount: 20000 },
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(o => o.trim())

const app = new Hono().basePath('/api')

app.use('*', cors({
  origin: (origin) => allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
}))

app.get('/health', (c) => c.json({ status: 'ok' }))

app.post('/payments/create-preference', async (c) => {
  const { email, plan } = await c.req.json<{ email: string; plan: string }>()

  const planData = PLANS[plan]
  if (!planData) return c.json({ error: 'Plan inválido' }, 400)

  const { data: order, error } = await supabase
    .from('orders')
    .insert({ email, plan, amount_ars: planData.amount, status: 'pending' })
    .select('id')
    .single()

  if (error) return c.json({ error: 'Error al crear la orden' }, 500)

  const mpRes = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      external_reference: order.id,
      items: [{
        id: plan,
        title: `NodoGamer — Plan ${planData.label}`,
        quantity: 1,
        unit_price: planData.amount,
        currency_id: 'ARS',
      }],
      payer: { email },
      back_urls: {
        success: `${process.env.LANDING_URL}/gracias`,
        failure: `${process.env.LANDING_URL}/planes`,
        pending: `${process.env.LANDING_URL}/gracias`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.API_URL}/api/webhooks/mercadopago`,
    }),
  })

  if (!mpRes.ok) {
    const err = await mpRes.json()
    console.error('MP error:', err)
    return c.json({ error: 'Error al crear preferencia de pago' }, 500)
  }

  const { id: mp_preference_id, init_point } = await mpRes.json() as { id: string; init_point: string }

  await supabase
    .from('orders')
    .update({ mp_preference_id })
    .eq('id', order.id)

  return c.json({ init_point })
})

app.post('/webhooks/mercadopago', async (c) => {
  const signature = c.req.header('x-signature') ?? ''
  const requestId = c.req.header('x-request-id') ?? ''
  const body = await c.req.json<{ type: string; data: { id: string } }>()

  const ts = signature.match(/ts=([^,]+)/)?.[1] ?? ''
  const v1 = signature.match(/v1=([^,]+)/)?.[1] ?? ''
  const message = `id:${body.data?.id};request-id:${requestId};ts:${ts};`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(process.env.MP_WEBHOOK_SECRET!),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  const expected = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('')

  if (expected !== v1) return c.json({ error: 'Firma inválida' }, 401)
  if (body.type !== 'payment') return c.json({ ok: true })

  const payRes = await fetch(`${MP_API}/v1/payments/${body.data.id}`, {
    headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  })

  if (!payRes.ok) return c.json({ ok: true })

  const payment = await payRes.json() as { status: string; external_reference: string }

  if (!payment.external_reference) return c.json({ ok: true })

  await supabase
    .from('orders')
    .update({
      status: payment.status,
      mp_payment_id: String(body.data.id),
    })
    .eq('id', payment.external_reference)

  return c.json({ ok: true })
})

export default handle(app)
