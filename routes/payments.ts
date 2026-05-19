import { Hono } from 'hono'
import { handleCreatePreference, handleConfirmPayment } from '../controllers/payments.controller.js'
import { authMiddleware } from '../middleware/auth.js'

const payments = new Hono()

payments.post('/create-preference', authMiddleware, handleCreatePreference)
payments.post('/confirm', handleConfirmPayment)

export default payments
