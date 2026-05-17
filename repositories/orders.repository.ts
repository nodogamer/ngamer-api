import { supabase } from '../lib/supabase.js'
import type { OrderStatus, PlanId } from '../types/index.js'

export async function createOrder(email: string, plan: PlanId, amount_ars: number) {
  const { data, error } = await supabase
    .from('orders')
    .insert({ email, plan, amount_ars, status: 'pending' })
    .select('id')
    .single()

  if (error) throw new Error(`Error creando orden: ${error.message}`)
  return data.id as string
}

export async function updateOrderPreference(id: string, mp_preference_id: string) {
  const { error } = await supabase
    .from('orders')
    .update({ mp_preference_id })
    .eq('id', id)

  if (error) throw new Error(`Error actualizando preferencia: ${error.message}`)
}

export async function updateOrderPayment(id: string, status: OrderStatus, mp_payment_id: string) {
  const { error } = await supabase
    .from('orders')
    .update({ status, mp_payment_id })
    .eq('id', id)

  if (error) throw new Error(`Error actualizando pago: ${error.message}`)
}
