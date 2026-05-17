import { Hono } from 'hono'
import { handleGetPlans } from '../controllers/plans.controller.js'

const plans = new Hono()

plans.get('/', handleGetPlans)

export default plans
