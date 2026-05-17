import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

app.get('/api/health', (c) => c.json({ status: 'ok' }))

serve({ fetch: app.fetch, port: 3001 }, () => {
  console.log('API corriendo en http://localhost:3001')
})
