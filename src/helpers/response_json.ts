import { Context } from 'hono'
import { StatusCode } from 'hono/utils/http-status'

export const successResponse = (c: Context, message?: string, status?: StatusCode) => {
     return c.json({
          status: status ?? 200,
          message: message ?? 'success'
     }, status ?? 200)
}

export const successDataResponse = (c: Context, data: any, extras?: any, message?: string, status?: StatusCode) => {
     return c.json({
          status: status ?? 200,
          message: message ?? 'Success',
          data,
          extras
     }, status ?? 200)
}

export const failedResponse = (c: Context, message?: string, status?: StatusCode) => {
     return c.json({
          status: status ?? 500,
          message: message ?? 'failed'
     }, status ?? 500)
}

export const failedDataResponse = (c: Context, data: any, message?: string, status?: StatusCode) => {
     return c.json({
          status: status ?? 500,
          message: message ?? 'failed',
          data
     }, status ?? 500)
}