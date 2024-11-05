export interface Tenant {
    id: string,
    name: string,
    maxCompletionToken: number
    totalPromptTokenUsage: number
    totalCompletionTokenUsage: number
    // tenantKey:TenantKey
}

export interface TenantKeys {
    // id: string,
    chatGptKey: string,
    tenantName: number
}

export interface UserTenant {
    id:String,
    tenantId: String
    tenant?: Tenant,
    userCode: string,
    totalPromptTokenUsage: number
    totalCompletionTokenUsage: number
}