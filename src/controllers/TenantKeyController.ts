import { Context } from "hono"
import { TenantKeys } from "../types/tenant"
import { clientRedis } from ".."
import { REDIS_TENANT_KEYS } from "../utils/key_types"
import { failedResponse, successDataResponse, successResponse } from "../helpers/response_json"

export const getTenantKey = async (c: Context) => {
    let tenantKeyTemp: TenantKeys[] = []
    const getTenantKey = await clientRedis.get(REDIS_TENANT_KEYS) ?? null
    if (getTenantKey != null) {
        JSON.parse(getTenantKey).map((val: any) => {
            tenantKeyTemp.push({
                ...val
            })
        })
        return successDataResponse(c, tenantKeyTemp)
    }else{
        return failedResponse(c, 'Tenants_keys not found in redis', 404)
    }
}

export const editTenantKey = async (c: Context) => {

    let tenantKeyTemp: TenantKeys[] = []

    const body = await c.req.json()

    if (body.chat_gpt_key == null || body.chat_gpt_key == '' || body.chat_gpt_key == undefined || body.tenant_name == null || body.tenant_name == '') {
        return failedResponse(c, 'Tenant name and Chat gpt key is required', 422)
    }

    const getTenantKeys = await clientRedis.get(REDIS_TENANT_KEYS) ?? null

    if (getTenantKeys != null) {

        JSON.parse(getTenantKeys).map((val: any) => {
            tenantKeyTemp.push({
                ...val
            })
        })

        if (JSON.parse(getTenantKeys).find((val: any) => val.tenantName == body.tenant_name) == null) {
            return failedResponse(c, 'Tenant name not found', 404)
        }

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
            REDIS_TENANT_KEYS,
            JSON.stringify([...tenantKeyTemp]),
        )

        return successResponse(c, 'Success edit tenant key', 200)
    } else {
        return failedResponse(c, 'Tenant not found in redis', 404)
    }

}