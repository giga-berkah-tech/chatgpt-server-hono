
import { Context } from "hono";
import { cors } from "hono/cors";
import * as jwt from 'jsonwebtoken';
import { failedDataResponse, failedResponse, successResponse } from "../helpers/response_json";
import { checkIp } from "../controllers/AuthController";
import { getTenantDetail } from "../controllers/TenantController";
import { JSONArray } from "hono/utils/types";
import { JWT_SECRET_KEY } from "../utils/constants";

export const corsAuth = cors({
    origin: ['http://localhost:3000'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    credentials: true,
})

export const checkValidToken =  (c: Context) => {
    try {
        const token = c.req.header('Authorization')
        console.log(token)
        console.log("JWT_SECRET_KEY ", JWT_SECRET_KEY)
        jwt.verify(token ?? "", JWT_SECRET_KEY ?? "IS_A_SECRET_KEY");
        return true
    } catch (error: any) {
        console.log(error)
        return false
    }
}

// export const checkValidToken =  (c: Context) => {
//     try {
//         const token = c.req.header('Authorization')
//         jwt.verify(token ?? "", "gigaBerkahTech");
//         return successResponse(c, "Token valid", 200)
//     } catch (error: any) {
//        return failedResponse(c, error, 401)
//     }
// }


// export const customAuth = async(c: Context, func?: ()=>JSON) => {
//     if (!checkValidToken(c)) {
//         return failedResponse(c, "Token not valid", 401)
//     }
//     if (!await checkIp(c)) {
//         return failedResponse(c, "You are not allowed", 403)
//     }
//     return func

// }



