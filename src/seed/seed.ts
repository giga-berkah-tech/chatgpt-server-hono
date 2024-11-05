import { clientRedis } from ".."
import { CHAT_GPT_API_KEY } from "../utils/constants"

const tenantData = [
    {
        id: "100",
        name: "100",
        maxCompletionToken: 2000,
        totalPromptTokenUsage: 0,
        totalCompletionTokenUsage: 0
    }
]

const tenantKeyData = [
    {
        // id: 1,
        tenantName: "100",
        chatGptKey: CHAT_GPT_API_KEY,
    }
]

const ipAllowed = [
    {
        ip: "127.0.0.1",
    },
    {
        ip: "localhost",
    }
]

async function main() {

    const getTenants = await clientRedis.get("tenants") ?? null
    const getTenantKeys = await clientRedis.get("tenant_keys") ?? null
    const getIpAllowed = await clientRedis.get("ip_allowed") ?? null

    if (getTenants == null) {
        await clientRedis.set("tenants", JSON.stringify(tenantData))
    }

    if (getTenantKeys == null) {
        await clientRedis.set("tenant_keys", JSON.stringify(tenantKeyData))
    }

    if (getIpAllowed == null) {
        await clientRedis.set("ip_allowed", JSON.stringify(ipAllowed))
    }

}

main()
    .then(async () => {
        console.log('Successfully seeded to redis')
    })
    .catch(async (e) => {
        console.log('Failed seeded to redis ', e)
        console.error(e)
        process.exit(1);
    });