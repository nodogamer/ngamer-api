import { supabase } from '../lib/supabase.js'
import type { Plan } from '../types/index.js'

const FIELDS = 'id, label, amount, amount_annual, tagline, features, popular'

export async function getPlans(): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select(FIELDS)
    .eq('active', true)
    .order('id')

  if (error) throw new Error(`Error obteniendo planes: ${error.message}`)
  return data as Plan[]
}

export async function getPlan(id: number): Promise<Plan> {
  const { data, error } = await supabase
    .from('plans')
    .select(FIELDS)
    .eq('id', id)
    .eq('active', true)
    .single()

  if (error || !data) throw new Error('Plan no encontrado')
  return data as Plan
}
