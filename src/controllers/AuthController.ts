import { Context } from "hono"
import { getConnInfo } from "hono/bun"
import { clientRedis } from ".."
import { failedResponse, successDataResponse, successResponse } from "../helpers/response_json"

export const checkIp = async (c: Context) => {
    let ipAllowedTemp: any = []

    const getIp = getConnInfo(c).remote.address?.replaceAll('::ffff:', '')
    console.log(getIp)

    const getIpAllowed = await clientRedis.get("ip_allowed") ?? null

    if (getIpAllowed != null) {
        JSON.parse(getIpAllowed).map((val: any) => {
            ipAllowedTemp.push({
                ip: val.ip
            })
        })

        if (ipAllowedTemp.find((val: any) => val.ip == getIp) != null) {
            console.log("ip_allowed key found in redis")
            return true
        }

    } else {
        console.log("ip_allowed key not found in redis")
        return false
    }
}

export const addIpAllowed = async (c: Context) => {
    let ipAllowedTemp: any = []

    const body = await c.req.json()

    const getIpAllowed = await clientRedis.get("ip_allowed") ?? null

    if (getIpAllowed != null) {
        JSON.parse(getIpAllowed).map((val: any) => {
            ipAllowedTemp.push({
                ip: val.ip
            })
        })

        if (ipAllowedTemp.find((val: any) => val.ip == body.ip) == null) {
            ipAllowedTemp.push({
                ip: body.ip
            })

            await clientRedis.set("ip_allowed", JSON.stringify(ipAllowedTemp))

            return successResponse(c, 'Ip added', 200)
        } else {
            return failedResponse(c, 'Ip already exist', 400)
        }
    } else {
        return failedResponse(c, 'ip_allowed key not found in redis', 404)
    }
}

export const removeIpAllowed = async (c: Context) => {
    let ipAllowedTemp: any = []

    const body = await c.req.json()

    const getIpAllowed = await clientRedis.get("ip_allowed") ?? null

    if (getIpAllowed != null) {
        JSON.parse(getIpAllowed).map((val: any) => {
            ipAllowedTemp.push({
                ip: val.ip
            })
        })

        if (ipAllowedTemp.find((val: any) => val.ip == body.ip) != null) {
            ipAllowedTemp = ipAllowedTemp.filter((val: any) => val.ip != body.ip)

            await clientRedis.set("ip_allowed", JSON.stringify(ipAllowedTemp))
            return successResponse(c, 'Ip removed', 200)
        } else {
            return failedResponse(c, 'Ip not found', 404)
        }
    } else {
        return failedResponse(c, 'ip_allowed key not found in redis', 404)
    }
}

export const getMyIp = async (c: Context) => {
    const getIp = getConnInfo(c).remote.address?.replaceAll('::ffff:', '')
    return successDataResponse(c, {
        "myIp": getIp,
    })
}

export const getListIp = async (c: Context) => {
    let ipAllowedTemp: any = []

    const getIpAllowed = await clientRedis.get("ip_allowed") ?? null

    if (getIpAllowed != null) {
        JSON.parse(getIpAllowed).map((val: any) => {
            ipAllowedTemp.push({
                ip: val.ip
            })
        })

        return successDataResponse(c, ipAllowedTemp)
    } else {
        return failedResponse(c, 'ip_allowed key not found in redis', 404)
    }
}