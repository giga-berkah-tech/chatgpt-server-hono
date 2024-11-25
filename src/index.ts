import type { ServerWebSocket } from 'bun'
import { Hono } from 'hono'
import { createBunWebSocket } from 'hono/bun'
import { createClient } from 'redis'

import { AuthRoutes, TenantKeyRoutes, TenantRoutes } from './routes'
import { corsAuth } from './services/AuthService'
import { websocketOptions } from './services/WebSocketService'
import { REDIS_PASS, REDIS_URL } from './utils/constants'
import { Seeding } from './seed/seed'
import { checkIp } from './controllers/AuthController'

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
app.route(`/`, app.get('/', (c) => {
  checkIp(c)
  return c.text('Hello from chatgpt service! v1.0.3')
}))
app.route(`${routePath}`, TenantRoutes)
app.route(`${routePath}`, AuthRoutes)
app.route(`${routePath}`, TenantKeyRoutes)

//Websocket
const { upgradeWebSocket } =
  createBunWebSocket<ServerWebSocket>()

app.get(
  '/ws',
  upgradeWebSocket((c) => {
    checkIp(c)
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

const server = Bun.serve({
  port: 3001,
  websocket: websocketOptions,
  fetch: app.fetch,
});

checkConnRedis()

console.log(`Server started on URL ${server.url} || port ${server.port}`)
console.log('The server is running...')



export default app
