import { MP_API, mpHeaders } from '../lib/mp.js'
import { createOrder, updateOrderPreference, updateOrderPayment } from '../repositories/orders.repository.js'
import { PLANS } from '../types/index.js'
import type { OrderStatus, PlanId } from '../types/index.js'

interface MpPreferenceResponse {
  id: string
  init_point: string
}

interface MpPaymentResponse {
  status: OrderStatus
  external_reference: string
}

export async function createPreference(email: string, plan: PlanId) {
  const planData = PLANS[plan]
  if (!planData) throw new Error('Plan inválido')

  const orderId = await createOrder(email, plan, planData.amount)

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: mpHeaders(),
    body: JSON.stringify({
      external_reference: orderId,
      items: [{
        id: plan,
        title: `NodoGamer — Plan ${planData.label}`,
        quantity: 1,
        unit_price: planData.amount,
        currency_id: 'ARS',
      }],
      payer: { email },
      back_urls: {
        success: `${process.env.LANDING_URL}/gracias?order_id=${orderId}`,
        failure: `${process.env.LANDING_URL}/cancelado`,
        pending: `${process.env.LANDING_URL}/gracias?order_id=${orderId}`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.API_URL}/api/webhooks/mercadopago`,
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    console.error('MP error:', err)
    throw new Error('Error al crear preferencia en MercadoPago')
  }

  const { id: mp_preference_id, init_point } = await res.json() as MpPreferenceResponse

  await updateOrderPreference(orderId, mp_preference_id)

  return init_point
}

export async function confirmPayment(payment_id: string, order_id: string) {
  const res = await fetch(`${MP_API}/v1/payments/${payment_id}`, {
    headers: mpHeaders(),
  })

  if (!res.ok) throw new Error('No se pudo verificar el pago en MercadoPago')

  const payment = await res.json() as MpPaymentResponse

  if (payment.external_reference !== order_id) throw new Error('Referencia de pago inválida')

  await updateOrderPayment(order_id, payment.status, payment_id)

  return payment.status
}
