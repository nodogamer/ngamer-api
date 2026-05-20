import { supabase } from '../lib/supabase.js'
import type { OrderStatus } from '../types/index.js'

export async function getOrdersByUserId(user_id: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, amount_ars, status, created_at, mp_init_point, plans(label)')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Error obteniendo pedidos: ${error.message}`)
  return data
}

export async function createOrder(email: string, user_id: string, plan_id: number, amount_ars: number) {
  const { data, error } = await supabase
    .from('orders')
    .insert({ email, user_id, plan_id, amount_ars, status: 'pending' })
    .select('id')
    .single()

  if (error) throw new Error(`Error creando orden: ${error.message}`)
  return data.id as string
}

export async function updateOrderPreference(id: string, mp_preference_id: string, mp_init_point: string) {
  const { error } = await supabase
    .from('orders')
    .update({ mp_preference_id, mp_init_point })
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
