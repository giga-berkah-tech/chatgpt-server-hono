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
                chatGptKey: JSON.parse(getTenantKey).find((valTenantKey: any) => valTenantKey.tenantName == val.id)?.chatGptKey != null && JSON.parse(getTenantKey).find((valTenantKey: any) => valTenantKey.tenantName == val.id)?.chatGptKey != ""
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
                chatGptKey: JSON.parse(getTenantKey).find((val: any) => val.tenantName == c.req.param('tenant_id').toString())?.chatGptKey != null &&JSON.parse(getTenantKey).find((val: any) => val.tenantName == c.req.param('tenant_id').toString())?.chatGptKey != "" ,
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

    if (body.name == undefined || body.max_context == undefined || body.chat_gpt_key == undefined || body.name == null || body.max_context == null || body.chat_gpt_key == null || body.name == '' || body.max_context == '' || body.chat_gpt_key == '') {
        return failedResponse(c, 'Name tenant, max input token and chat gpt key is required', 422)
    }

    const getTenants = await clientRedis.get(REDIS_TENANT) ?? null
    const getTenant_keys = await clientRedis.get(REDIS_TENANT_KEYS) ?? null

    if (getTenants != null && getTenant_keys != null) {
        JSON.parse(getTenants).map((val: any) => {
            tenantTemp.push({
                ...val
            })
        })
        JSON.parse(getTenant_keys).map((val: any) => {
            tenantKeyTemp.push({
                // id: val.id,
               ...val
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
            maxContext: parseInt(body.max_context),
            maxConsumptionToken: body.max_consumption_token == undefined ? 1000000 : parseInt(body.max_consumption_token),
            totalPromptTokenUsage: 0,
            totalCompletionTokenUsage: 0,
            status: body.status ?? false
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
                ...val
            })
        })
        JSON.parse(gettenant_keys).map((val: any) => {
            tenantKeyTemp.push({
                // id: val.id,
                ...val
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

    if (body.tenant_name == null || body.max_context == null || body.tenant_name == '' || body.max_context == '' || body.status == null) {
        return failedResponse(c, 'Name tenant, max context & status must not be empty', 422)
    }

    const getTenants = await clientRedis.get(REDIS_TENANT) ?? null
    const getTenantKeys = await clientRedis.get(REDIS_TENANT_KEYS) ?? null

    if (getTenants != null && getTenantKeys != null) {
        JSON.parse(getTenants).map((val: any) => {
            tenantTemp.push({
                ...val
            })
        })

        JSON.parse(getTenantKeys).map((val: any) => {
            tenantKeyTemp.push({
                // id: val.id,
                ...val
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
                    name: body.tenant_name == undefined ? val.tenantName : body.tenant_name,
                    maxContext: body.max_context == undefined ? val.maxContext : parseInt(body.max_context),
                    maxConsumptionToken: body.max_consumption_token == undefined ? val.maxConsumptionToken : parseInt(body.max_consumption_token),
                    status: body.status == undefined ? val.status : body.status,
                }
            } else {
                return val
            }
        })

        tenantKeyTemp = tenantKeyTemp.map((val: any) => {
            if (val.tenantName == body.tenant_name) {
                return {
                    ...val,
                    chatGptKey: body.chat_gpt_key == undefined ? val.chatGptKey : body.chat_gpt_key
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

export const deleteAllTenant = async (c: Context) => {

    const getTenants = await clientRedis.get(REDIS_TENANT) ?? null
    const getTenantKeys = await clientRedis.get(REDIS_TENANT_KEYS) ?? null

    if (getTenants != null && getTenantKeys != null) {
        await clientRedis.set(
            REDIS_TENANT,
            JSON.stringify([]),
        )

        await clientRedis.set(
            REDIS_TENANT_KEYS,
            JSON.stringify([]),
        )
        return successResponse(c, 'Success delete all tenant', 200)
    } else {
       return failedResponse(c, 'Tenant or tenant key not found in redis', 404)     
    }
}

export const getTenantData = async (c: Context) => {
    const getTenants = await clientRedis.get(REDIS_TENANT) ?? null
    if (getTenants != null) {
        if (JSON.parse(getTenants).find((val: any) => val.id == c.req.param('tenant_id')) != null) {
            var result:Tenant = {
                ...JSON.parse(getTenants).find((val: any) => val.id == c.req.param('tenant_id'))
            }
            return successDataResponse(c,{
                maxContext: result.maxContext,
            })
        }else{
            return failedResponse(c, 'Tenant not found', 404)
        }
    }else{
        return failedResponse(c, 'Tenants_keys not found in redis', 404)
    }
}