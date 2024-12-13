import { Context } from "hono"
import { DateInDb } from "../types/date_in_db"
import { clientRedis } from ".."
import { REDIS_DATE_IN_DB } from "../utils/key_types"
import { failedResponse, successDataResponse, successResponse } from "../helpers/response_json"

export const getDateInDb = async (c: Context) => {
    let dateInDb: DateInDb
    const getDateInDb = await clientRedis.get(REDIS_DATE_IN_DB) ?? null
    if (getDateInDb != null) {
        dateInDb = JSON.parse(getDateInDb)
        return successDataResponse(c, dateInDb)
    }else{
        return failedResponse(c, 'date_in_db key not found in redis', 404)
    }
}

export const updateDateNow = async (c: Context) => {

    const getDateInDb = await clientRedis.get(REDIS_DATE_IN_DB) ?? null
    if (getDateInDb != null) {
        let dateNow = new Date()
        
        await clientRedis.set(
            REDIS_DATE_IN_DB,
            JSON.stringify({
                "second": dateNow.getSeconds(),
                "minutes": dateNow.getMinutes(),
                "hours": dateNow.getHours(),
                "day": dateNow.getDay(),
                "month": dateNow.getMonth() + 1,
                "year": dateNow.getFullYear()
            }),
        );
        return successResponse(c, "Success update date now", 200)
    }else{
        return failedResponse(c, 'date_in_db key not found in redis', 404)
    }
}