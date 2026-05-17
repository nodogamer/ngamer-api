import { MercadoPagoConfig } from 'mercadopago'

export function getMpClient() {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) throw new Error('MP_ACCESS_TOKEN no configurado')
  return new MercadoPagoConfig({ accessToken: token })
}
