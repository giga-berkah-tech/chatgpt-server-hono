import type { ServerWebSocket } from 'bun'
import { Hono } from 'hono'
import { createBunWebSocket } from 'hono/bun'
import { createClient } from 'redis'

import { AuthRoutes, DateInDbRoutes, TenantKeyRoutes, TenantRoutes } from './routes'
import { corsAuth } from './services/AuthService'
// import { websocketOptions } from './services/WebSocketService'
import { REDIS_PASS, REDIS_URL } from './utils/constants'
import { Seeding } from './seed/seed'
import { checkIp } from './controllers/AuthController'
import { chatsOpenAi, checkTenantVerifyUser } from './controllers/OpenAiController'

// Initialize the Hono app
const app = new Hono()

export const clientRedis = createClient({
  url: REDIS_URL,
  password: "",
})

const websocketOptions = {

    open: (ws: ServerWebSocket) => {
      console.log("WS => Client connected");
    },
    message: async(ws: ServerWebSocket, message: any) => {

      try {
        let messageData = JSON.parse(message)
        if (!messageData || !messageData.token || !messageData.tenant || !messageData.messages  || !messageData.uuid) {
          ws.send(JSON.stringify({ status: 422, message: "input invalid" }))
          console.log("WS error => input invalid")
          return;
        }
    
        // console.log("Message Received:",messageData)
        // let isvalid = await checkTenantVerifyUser(ws, messageData)
          if (! await checkTenantVerifyUser(ws, messageData)) {
            console.log("WS error =>", message)
            ws.send(JSON.stringify({ status: 401, message: "user not valid" }))
            ws.close();
            return;
          };
          chatsOpenAi(ws,messageData)
      } catch (error) {
        ws.send(JSON.stringify({ status: 500, message: "Connection Error" }))
        // ws.close();
        return;
      }
   
    },
    close: (ws: ServerWebSocket) => {
      console.log("WS => Client close/disconnected");
    },
  };

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
  return c.text('Hello from chatgpt service! v1.0.7')
}))
app.route(`${routePath}`, TenantRoutes)
app.route(`${routePath}`, AuthRoutes)
app.route(`${routePath}`, TenantKeyRoutes)
app.route(`${routePath}`, DateInDbRoutes)

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
console.log(`The server is running....`)



export default app
