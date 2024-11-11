import { Context } from "hono"
import { getConnInfo } from "hono/bun"
import { failedResponse, successDataResponse, successResponse } from "../helpers/response_json"
import { Tenant, TenantKeys } from "../types/tenant"
import { clientRedis } from ".."
import { REDIS_TENANT, REDIS_TENANT_KEYS } from "../utils/key_types"

export const getTenants = async (c: Context) => {
    let tenantTemp: Tenant[] = []
    const getTenants = await clientRedis.get(REDIS_TENANT) ?? null
    const getTenantKey = await clientRedis.get(REDIS_TENANT_KEYS) ?? null
    if (getTenants != null && getTenantKey != null) {
        JSON.parse(getTenants).map((val: any) => {
            tenantTemp.push({
                ...val,
                chatGptKey: JSON.parse(getTenantKey).find((valTenantKey: any) => valTenantKey.tenantName == val.id)?.chatGptKey
            })
        })
        return successDataResponse(c, tenantTemp)
    }else{
        return failedResponse(c, 'Tenants_keys not found in redis', 404)
    }
}

export const getTenantDetail = async (c: Context) => {
    const getTenants = await clientRedis.get(REDIS_TENANT) ?? null
    const getTenantKey = await clientRedis.get(REDIS_TENANT_KEYS) ?? null
    if (getTenants != null && getTenantKey != null) {
        if (JSON.parse(getTenants).find((val: any) => val.id == c.req.param('tenant_id')) != null) {
            var result = {
                ...JSON.parse(getTenants).find((val: any) => val.id == c.req.param('tenant_id')),
                chatGptKey: JSON.parse(getTenantKey).find((val: any) => val.tenantName == c.req.param('tenant_id').toString())?.chatGptKey,
            }
            return successDataResponse(c,result)
        }else{
            return failedResponse(c, 'Tenant or tenant_key not found', 404)
        }
    }else{
        return failedResponse(c, 'Tenants_keys or tenants_key key not found in redis', 404)
    }
}

export const createTenant = async (c: Context) => {

    let tenantTemp: Tenant[] = []
    let tenantKeyTemp: TenantKeys[] = []

    const body = await c.req.json()

    if (body.name == null || body.max_completion_token == null || body.chat_gpt_key == null || body.name == '' || body.max_completion_token == '' || body.chat_gpt_key == '') {
        return failedResponse(c, 'Name tenant, max completion token and chat gpt key is required', 422)
    }

    const getTenants = await clientRedis.get(REDIS_TENANT) ?? null
    const getTenant_keys = await clientRedis.get(REDIS_TENANT_KEYS) ?? null

    if (getTenants != null && getTenant_keys != null) {
        JSON.parse(getTenants).map((val: any) => {
            tenantTemp.push({
                id: val.id,
                name: val.name,
                maxCompletionToken: val.maxCompletionToken,
                totalPromptTokenUsage: val.totalPromptTokenUsage,
                totalCompletionTokenUsage: val.totalCompletionTokenUsage,
                status: false
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
            id: body.name.toString(),
            name: body.name.toString(),
            maxCompletionToken: parseInt(body.max_completion_token),
            totalPromptTokenUsage: 0,
            totalCompletionTokenUsage: 0,
            status: false
        })

        tenantKeyTemp.push({
            tenantName: body.name.toString(),
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

    if (body.tenant_name == null || body.tenant_name == '') {
        return failedResponse(c, 'Tenant name is required', 422)
    }

    const getTenants = await clientRedis.get(REDIS_TENANT) ?? null
    const gettenant_keys = await clientRedis.get(REDIS_TENANT_KEYS) ?? null

    if (getTenants != null && gettenant_keys != null) {
        JSON.parse(getTenants).map((val: any) => {
            tenantTemp.push({
                id: val.id,
                name: val.name,
                maxCompletionToken: val.maxCompletionToken,
                totalPromptTokenUsage: val.totalPromptTokenUsage,
                totalCompletionTokenUsage: val.totalCompletionTokenUsage,
                status: val.status
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
    let tenantKeyTemp: TenantKeys[] = []

    const body = await c.req.json()

    if (body.tenant_name == null || body.max_completion_token == null || body.chat_gpt_key == null || body.tenant_name == '' || body.max_completion_token == '' || body.chat_gpt_key == '') {
        return failedResponse(c, 'Name token, max completion token and chat gpt key is required', 422)
    }

    const getTenants = await clientRedis.get(REDIS_TENANT) ?? null
    const getTenantKeys = await clientRedis.get(REDIS_TENANT_KEYS) ?? null

    if (getTenants != null && getTenantKeys != null) {
        JSON.parse(getTenants).map((val: any) => {
            tenantTemp.push({
                id: val.id,
                name: val.name,
                maxCompletionToken: val.maxCompletionToken,
                totalPromptTokenUsage: val.totalPromptTokenUsage,
                totalCompletionTokenUsage: val.totalCompletionTokenUsage,
                status: val.status
            })
        })

        JSON.parse(getTenantKeys).map((val: any) => {
            tenantKeyTemp.push({
                // id: val.id,
                tenantName: val.tenantName,
                chatGptKey: val.chatGptKey,
            })
        })

        if (JSON.parse(getTenants).find((val: any) => val.id == body.tenant_name) == null) {
            return failedResponse(c, 'Tenant not found', 404)
        }

        if (JSON.parse(getTenantKeys).find((val: any) => val.tenantName == body.tenant_name) == null) {
            return failedResponse(c, 'Tenant key not found', 404)
        }

        tenantTemp = tenantTemp.map((val: any) => {
            if (val.id == body.tenant_name) {
                return {
                    ...val,
                    maxCompletionToken: parseInt(body.max_completion_token),
                    status:body.status,
                    // totalPromptTokenUsage: 0,
                    // totalCompletionTokenUsage: 0
                }
            } else {
                return val
            }
        })

        tenantKeyTemp = tenantKeyTemp.map((val: any) => {
            if (val.tenantName == body.tenant_name) {
                return {
                    ...val,
                    chatGptKey: body.chat_gpt_key
                }
            } else {
                return val
            }
        })

        await clientRedis.set(
            REDIS_TENANT,
            JSON.stringify([...tenantTemp]),
        )

        await clientRedis.set(
            REDIS_TENANT_KEYS,
            JSON.stringify([...tenantKeyTemp]),
        )

        return successResponse(c, 'Success edit tenant', 200)
    } else {
        return failedResponse(c, 'Tenant not found in redis', 404)
    }

}

// export const deleteAllTenant = async (c: Context) => {

//     const getTenants = await clientRedis.get(REDIS_TENANT) ?? null
//     const getTenantKeys = await clientRedis.get(REDIS_TENANT_KEYS) ?? null

//     if (getTenants != null && getTenantKeys != null) {
//         await clientRedis.del(REDIS_TENANT)
//         await clientRedis.del(REDIS_TENANT_KEYS)
//         return successResponse(c, 'Success delete all tenant', 200)
//     } else {
        
//     }

// c
// }