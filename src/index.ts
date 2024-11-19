import type { ServerWebSocket } from 'bun'
import { Hono } from 'hono'
import { createBunWebSocket } from 'hono/bun'
import { createClient } from 'redis'

import { AuthRoutes, TenantKeyRoutes, TenantRoutes } from './routes'
import { corsAuth } from './services/AuthService'
import { websocketOptions } from './services/WebSocketService'
import { REDIS_PASS, REDIS_URL } from './utils/constants'
import { Seeding } from './seed/seed'

// Initialize the Hono app
const app = new Hono()

export const clientRedis = createClient({
  url: REDIS_URL,
  password: "",
})

const checkConnRedis = async () => {
  try {
    clientRedis
      .on('error', (err) => console.log('Redis Failed to connect with error: ', err))
      .connect().then(() => Seeding().then(() => console.log('Successfully seeded to redis')))

  } catch (e: any) {
    console.log('Failed connection to redis check with error: ', e)
  }
}



app.use('/api/*', corsAuth)

//Api Routes
const routePath = '/api'
app.route(`${routePath}`, TenantRoutes)
app.route(`${routePath}`, AuthRoutes)
app.route(`${routePath}`, TenantKeyRoutes)

//Websocket
const { upgradeWebSocket, websocket } =
  createBunWebSocket<ServerWebSocket>()

app.get(
  '/ws',
  upgradeWebSocket((c) => {
    return {
      // onMessage(event, ws) {
      //   console.log(`Message from client: ${event.data}`)
      //   ws.send('Hello from server1!')
      // },
      // onClose: () => {
      //   console.log('Connection closed')
      // },
    }
  })
)

Bun.serve({
  port: 3001,
  websocket: websocketOptions,
  fetch: app.fetch,
});

checkConnRedis()

console.log('Server started on port 3001')
console.log('====================================================')
console.log('====================================================')
console.log('====================================================')
console.log('====================================================')
console.log('====================================================')
console.log('====================================================')
console.log('The server is running...')

export default app
