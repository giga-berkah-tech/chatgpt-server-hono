export interface Tenant {
    id: string,
    name: string,
    maxContext: number,
    maxCompletionToken: number,
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
    id:String,
    tenantId: String
    tenant?: Tenant,
    userCode: string,
    totalPromptTokenUsage: number
    totalCompletionTokenUsage: number
}