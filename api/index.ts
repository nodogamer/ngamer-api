import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'
import payments from '../routes/payments.js'
import webhooks from '../routes/webhooks.js'
import plans from '../routes/plans.js'

export const config = { runtime: 'edge' }

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(o => o.trim())

const app = new Hono().basePath('/api')

app.use('*', cors({
  origin: (origin) => allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
}))

app.get('/health', (c) => c.json({ status: 'ok' }))
app.route('/payments', payments)
app.route('/webhooks', webhooks)
app.route('/plans', plans)

export default handle(app)
