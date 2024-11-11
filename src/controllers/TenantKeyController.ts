import { Context } from "hono"
import { TenantKeys } from "../types/tenant"
import { clientRedis } from ".."
import { REDIS_TENANT_KEYS } from "../utils/key_types"
import { failedResponse, successDataResponse } from "../helpers/response_json"

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