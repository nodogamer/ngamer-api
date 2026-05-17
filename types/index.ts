export type PlanId = 'bloque-de-tierra' | 'diamante' | 'netherita'

export type OrderStatus = 'pending' | 'approved' | 'rejected' | 'in_process' | 'unknown'

export interface Order {
  id: string
  email: string
  plan: PlanId
  amount_ars: number
  status: OrderStatus
  mp_preference_id: string | null
  mp_payment_id: string | null
  created_at: string
}

export interface Plan {
  label: string
  amount: number
}

export const PLANS: Record<PlanId, Plan> = {
  'bloque-de-tierra': { label: 'Bloque de Tierra', amount: 5000 },
  'diamante':         { label: 'Diamante',          amount: 10000 },
  'netherita':        { label: 'Netherita',          amount: 20000 },
}
