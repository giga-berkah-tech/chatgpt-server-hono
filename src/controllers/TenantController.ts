import { Context } from "hono"
import { getConnInfo } from "hono/bun"
import { failedResponse, successResponse } from "../helpers/response_json"
import { Tenant, TenantKeys } from "../types/tenant"
import { clientRedis } from ".."
import { REDIS_TENANT, REDIS_TENANT_KEYS } from "../utils/key_types"

export const getTenant = async (c: Context) => {
    const info = getConnInfo(c)
    // const body = await c.req

    // console.log("data",body.header)
    console.log("info",info.remote.address)
    return successResponse(c, 'success', 200)
}

export const createTenant = async (c: Context) => {

    const originHeader = c.req.header;

  // Do something with the origin header, e.g., log it
  console.log(originHeader);

    let tenantTemp: Tenant[] = []
    let tenantKeyTemp: TenantKeys[] = []

    const body = await c.req.json()

    const getTenants = await clientRedis.get(REDIS_TENANT) ?? null
    const getTenant_keys = await clientRedis.get(REDIS_TENANT_KEYS) ?? null

    if (getTenants != null && getTenant_keys != null) {
        JSON.parse(getTenants).map((val: any) => {
            tenantTemp.push({
                id: val.id,
                name: val.name,
                maxCompletionToken: val.maxCompletionToken,
                totalPromptTokenUsage: val.totalPromptTokenUsage,
                totalCompletionTokenUsage: val.totalCompletionTokenUsage
            })
        })
        JSON.parse(getTenant_keys).map((val: any) => {
            tenantKeyTemp.push({
                // id: val.id,
                tenantName: val.tenantName,
                chatGptKey: val.chatGptKey,
            })
        })
        if (JSON.parse(getTenants).find((val: any) => val.id == body.name) != null) {
            return failedResponse(c, 'Tenants already exists', 409)
        }

        if (JSON.parse(getTenant_keys).find((val: any) => val.tenantName == body.name) != null) {
            return failedResponse(c, 'Tenant_key already exists', 409)
        }
        tenantTemp.push({
           id: body.name,
           name: body.name,
           maxCompletionToken: body.max_completion_token,
           totalPromptTokenUsage: 0,
           totalCompletionTokenUsage: 0
        })

        tenantKeyTemp.push({
            tenantName: body.name,
            chatGptKey: body.chat_gpt_key,
        })

        await clientRedis.set(
            REDIS_TENANT,
            JSON.stringify([...tenantTemp]),
        )

        await clientRedis.set(
            REDIS_TENANT_KEYS,
            JSON.stringify([...tenantKeyTemp]),
        )
        
        return successResponse(c, 'Success add new tenant', 200)
    } else {
        return failedResponse(c, 'Tenant or tenant key not found in redis', 404)
    }
}

export const deleteTenantWithTenantKey = async (c: Context) => {

    let tenantTemp: Tenant[] = []
    let tenantKeyTemp: TenantKeys[] = []

    const body = await c.req.json()

    const getTenants = await clientRedis.get(REDIS_TENANT) ?? null
    const gettenant_keys = await clientRedis.get(REDIS_TENANT_KEYS) ?? null

    if (getTenants != null && gettenant_keys != null) {
        JSON.parse(getTenants).map((val: any) => {
            tenantTemp.push({
                id: val.id,
                name: val.name,
                maxCompletionToken: val.maxCompletionToken,
                totalPromptTokenUsage: val.totalPromptTokenUsage,
                totalCompletionTokenUsage: val.totalCompletionTokenUsage
            })
        })
        JSON.parse(gettenant_keys).map((val: any) => {
            tenantKeyTemp.push({
                // id: val.id,
                tenantName: val.tenantName,
                chatGptKey: val.chatGptKey,
            })
        })

        if (JSON.parse(getTenants).find((val: any) => val.id == body.tenant_name) == null) {
            return failedResponse(c, 'Tenant not found', 404)
        }

        if (JSON.parse(gettenant_keys).find((val: any) => val.tenantName == body.tenant_name) == null) {
            return failedResponse(c, 'Tenant key not found', 404)
        }

        tenantTemp = tenantTemp.filter((val: any) => val.id != body.tenant_name)
        tenantKeyTemp = tenantKeyTemp.filter((val: any) => val.tenantName != body.tenant_name)

        await clientRedis.set(
            REDIS_TENANT,
            JSON.stringify([...tenantTemp]),
        )

        await clientRedis.set(
            REDIS_TENANT_KEYS,
            JSON.stringify([...tenantKeyTemp]),
        )
        
        return successResponse(c, 'Success delete tenant', 200)
    } else {
        return failedResponse(c, 'Tenant or tenant key not found in redis', 404)
    }
}

export const editTenant = async (c: Context) => {

    let tenantTemp: Tenant[] = []

    const body = await c.req.json()

    const getTenants = await clientRedis.get(REDIS_TENANT) ?? null

    if (getTenants != null) {
        JSON.parse(getTenants).map((val: any) => {
            tenantTemp.push({
                id: val.id,
                name: val.name,
                maxCompletionToken: val.maxCompletionToken,
                totalPromptTokenUsage: val.totalPromptTokenUsage,
                totalCompletionTokenUsage: val.totalCompletionTokenUsage
            })
        })

        if (JSON.parse(getTenants).find((val: any) => val.id == body.tenant_name) == null) {
            return failedResponse(c, 'Tenant not found', 404)
        }

        tenantTemp = tenantTemp.map((val: any) => {
            if (val.id == body.tenant_name) {
                return {
                    ...val,
                    maxCompletionToken: body.max_completion_token,
                    totalPromptTokenUsage: 0,
                    totalCompletionTokenUsage: 0
                }
            }else{
                return val
            }
        })
        
        await clientRedis.set(
            REDIS_TENANT,
            JSON.stringify([...tenantTemp]),
        )
        return successResponse(c, 'Success edit tenant', 200)
    } else {
        return failedResponse(c, 'Tenant not found in redis', 404)
    }

}