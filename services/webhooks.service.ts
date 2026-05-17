import { MP_API, mpHeaders } from '../lib/mp.js'
import { updateOrderPayment } from '../repositories/orders.repository.js'
import type { OrderStatus } from '../types/index.js'

interface MpPaymentResponse {
  status: OrderStatus
  external_reference: string
}

export async function verifySignature(
  signature: string,
  requestId: string,
  paymentId: string
): Promise<boolean> {
  const ts = signature.match(/ts=([^,]+)/)?.[1] ?? ''
  const v1 = signature.match(/v1=([^,]+)/)?.[1] ?? ''
  const message = `id:${paymentId};request-id:${requestId};ts:${ts};`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(process.env.MP_WEBHOOK_SECRET!),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  const expected = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('')

  return expected === v1
}

export async function processPaymentNotification(paymentId: string) {
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: mpHeaders(),
  })

  if (!res.ok) return

  const payment = await res.json() as MpPaymentResponse

  if (!payment.external_reference) return

  await updateOrderPayment(payment.external_reference, payment.status, paymentId)
}
