import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'
import { Preference, Payment } from 'mercadopago'
import { mp } from '../lib/mp.js'
import { supabase } from '../lib/supabase.js'

export const config = { runtime: 'edge' }

const PLANS: Record<string, { label: string; amount: number }> = {
  'bloque-de-tierra': { label: 'Bloque de Tierra', amount: 5000 },
  'diamante':         { label: 'Diamante',          amount: 10000 },
  'netherita':        { label: 'Netherita',          amount: 20000 },
}

const app = new Hono().basePath('/api')

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(o => o.trim())

app.use('*', cors({
  origin: (origin) => allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
}))

app.get('/health', (c) => c.json({ status: 'ok' }))

// Crea una preferencia de pago en MP y guarda la orden en Supabase
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

  const preference = new Preference(mp)
  const result = await preference.create({
    body: {
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
    },
  })

  await supabase
    .from('orders')
    .update({ mp_preference_id: result.id })
    .eq('id', order.id)

  return c.json({ init_point: result.init_point })
})

// Webhook de MercadoPago — dispara cuando se procesa un pago
app.post('/webhooks/mercadopago', async (c) => {
  const signature = c.req.header('x-signature') ?? ''
  const requestId = c.req.header('x-request-id') ?? ''
  const body = await c.req.json<{ type: string; data: { id: string } }>()

  // Validar firma
  const ts = signature.match(/ts=([^,]+)/)?.[1] ?? ''
  const v1 = signature.match(/v1=([^,]+)/)?.[1] ?? ''
  const message = `id:${body.data?.id};request-id:${requestId};ts:${ts};`
  const secret = process.env.MP_WEBHOOK_SECRET!

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  const expected = Buffer.from(signed).toString('hex')

  if (expected !== v1) return c.json({ error: 'Firma inválida' }, 401)

  if (body.type !== 'payment') return c.json({ ok: true })

  const payment = new Payment(mp)
  const paymentData = await payment.get({ id: body.data.id })

  if (!paymentData.external_reference) return c.json({ ok: true })

  await supabase
    .from('orders')
    .update({
      status: paymentData.status ?? 'unknown',
      mp_payment_id: String(body.data.id),
    })
    .eq('id', paymentData.external_reference)

  return c.json({ ok: true })
})

export default handle(app)
