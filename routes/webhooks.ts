import { Hono } from 'hono'
import { handleMercadoPagoWebhook } from '../controllers/webhooks.controller.js'

const webhooks = new Hono()

webhooks.post('/mercadopago', handleMercadoPagoWebhook)

export default webhooks
