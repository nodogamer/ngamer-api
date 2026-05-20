import { Hono } from 'hono'
import { handleGetOrders } from '../controllers/orders.controller.js'
import { authMiddleware } from '../middleware/auth.js'

const orders = new Hono()

orders.get('/', authMiddleware, handleGetOrders)

export default orders
