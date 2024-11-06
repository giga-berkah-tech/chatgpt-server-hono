
import { cors } from "hono/cors";

export const corsAuth = cors({
    origin: ['http://localhost:3000'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    credentials: true,
})



