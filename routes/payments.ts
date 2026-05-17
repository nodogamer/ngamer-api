import { Hono } from 'hono'
import { handleCreatePreference, handleConfirmPayment } from '../controllers/payments.controller.js'

const payments = new Hono()

payments.post('/create-preference', handleCreatePreference)
payments.post('/confirm', handleConfirmPayment)

export default payments
