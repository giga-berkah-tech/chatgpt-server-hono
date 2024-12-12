export interface Tenant {
    id: string,
    name: string,
    maxContext: number,
    maxConsumptionToken: number,
    totalPromptTokenUsage: number
    totalCompletionTokenUsage: number,
    status: boolean
    // tenantKey:TenantKey
}

export interface TenantKeys {
    // id: string,
    chatGptKey: string,
    tenantName: number
}

export interface UserTenant {
    userId: String
    tenant: String
    totalPromptTokenUsage: number
    totalCompletionTokenUsage: number
    token: string
}