import type { ServerWebSocket } from 'bun'
import { Hono } from 'hono'
import { createBunWebSocket } from 'hono/bun'
import { createClient } from 'redis'

import { AuthRoutes, TenantRoutes } from './routes'
import { corsAuth } from './services/AuthService'
import { websocketOptions } from './services/WebSocketService'
import { REDIS_URL } from './utils/constants'

// Initialize the Hono app
const app = new Hono().basePath('/api')

export const clientRedis = createClient({
  url: REDIS_URL,
  password: '',
})

const checkConnRedis = async () => {
  try {
      clientRedis
      .on('error', (err) => console.log('Redis Failed to connect with error: ', err))
      .connect()
      console.log('Connection to Redis is successful')
  } catch (e: any) {
      console.log('Failed connection to redis check with error: ', e)
  }
}

app.use('/api/*', corsAuth)

//Api Routes
app.route('/', TenantRoutes)
app.route('/', AuthRoutes)

//Websocket
const { upgradeWebSocket,websocket } =
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
    // port: 3001,
    websocket: websocketOptions,
    fetch: app.fetch,
  });

  checkConnRedis()

export default app
