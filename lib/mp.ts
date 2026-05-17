export const MP_API = 'https://api.mercadopago.com'

export function mpHeaders(): HeadersInit {
  return {
    'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  }
}
