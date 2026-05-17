export type OrderStatus = 'pending' | 'approved' | 'rejected' | 'in_process' | 'unknown'

export interface Plan {
  id: number
  label: string
  amount: number
  amount_annual: number | null
  tagline: string
  features: string[]
  popular: boolean
}
