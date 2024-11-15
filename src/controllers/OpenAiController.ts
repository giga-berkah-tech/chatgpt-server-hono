import axios from 'axios';
import OpenAI from 'openai';


import { ServerWebSocket } from 'bun';
import { GPTTokens } from 'gpt-tokens'

import { clientRedis } from '..';
import { Tenant } from '../types/tenant';
import { API_URL, CHAT_GPT_MODEL } from '../utils/constants';
import { REDIS_TENANT, REDIS_TENANT_KEYS } from '../utils/key_types';


const verifyWebSocketUser = async (tenant: string,token: string) => {
    try {
        const response = await axios.get(`${API_URL}/member/memberInfo/getMemberByToken`, {
            headers: {
                'Authorization': token
            }
        });
        const getUserTenant = await clientRedis.get(`USER_DATA_${response.data.data.id}`) ?? "-"

        
        if (getUserTenant != "-") {
          
            let dataUser = {
                userId:response.data.data.id,
                totalCompletionTokenUsage:JSON.parse(getUserTenant).totalCompletionTokenUsage,
                totalPromptTokenUsage:JSON.parse(getUserTenant).totalPromptTokenUsage,
                tenant:tenant,
                token:token
            }
            await clientRedis.set("USER_DATA_" + dataUser.userId, JSON.stringify(dataUser), {
                EX: 60 * 60 * 1
            })
        }else{
            let dataUser = {
                userId:response.data.data.id,
                totalCompletionTokenUsage:0,
                totalPromptTokenUsage:0,
                tenant:tenant,
                token:token
            }
            await clientRedis.set("USER_DATA_" + dataUser.userId, JSON.stringify(dataUser), {
                EX: 60 * 60 * 1
            })
        }

        let dataToken = {
            authStatus:true,
            userId:response.data.data.id
        }

        await clientRedis.set("USER_TOKEN_" + token, JSON.stringify(dataToken), {
            EX: 60 * 60 * 1
        })

        return "true"
       
    } catch (error) {
        // clientRedis.set("USER_TOKEN_" + token, "false")
        let dataToken = {
            authStatus:false,
            userId:""
        }
        await clientRedis.set("USER_TOKEN_" + token, JSON.stringify(dataToken), {
            EX: 60 * 60 * 1
        })
        return "false"
    }
}

export const checkTenantVerifyUser = async (ws: ServerWebSocket, message: any) => {
    // if (!message) {

    // }
    // const tenant = await prisma.tenant.findFirst({
    //     where: { id: message.tenant.toString() },
    // })

    // if (tenant == null) {
    //     ws.send(JSON.stringify({
    //         status: 404,
    //         message: "Tenant not found in database, please create a new tenant"
    //     }))
    //     return
    // }
    // const getTenant = await clientRedis.get(REDIS_TENANT) ?? "-"

    // if (JSON.parse(getTenant).find((val: any) => val.id == tenant.id) == null) {
    //     ws.send(JSON.stringify({
    //         status: 404,
    //         message: "Tenant not found in redis"
    //     }))
    // }

    // let redisData = await clientRedis.get("USER_TOKEN_" + message.token)
    // if (!redisData) {
    //     redisData = await verifyWebSocketUser(message.token)
    // }
    // let isvalid = redisData ? redisData : await verifyWebSocketUser(message.token);

    let tenantTemp: Tenant[] = []

    const getTenants = await clientRedis.get(REDIS_TENANT) ?? null

    if (getTenants != null) {
        JSON.parse(getTenants).map((val: any) => {
            tenantTemp.push({
               ...val
            })
        })

        if (JSON.parse(getTenants).find((val: any) => val.id == message.tenant) == null) {
            ws.send(JSON.stringify({ status: 404, message: "Tenant not found, please create a new tenant" }));
            return false
        }
       
    }else{
        ws.send(JSON.stringify({ status: 404, message: "Tenant key not found in redis" }));
    }

    return await verifyWebSocketUser(message.tenant,message.token) === "true"
}

export const chatsOpenAi = async (ws: ServerWebSocket, message: any) => {

    try {
        let chatsTemp = []
        let tenantTemp: Tenant[] = []
        let userTenantData:any
    
            let totalPrompt = 0
            let totalCompletion = 0
        
            const getTenants = await clientRedis.get(REDIS_TENANT) ?? "-"
            const getTenantKey = await clientRedis.get(REDIS_TENANT_KEYS) ?? "-"
            const getToken:any = await clientRedis.get(`USER_TOKEN_${message.token}`) ?? "-"
            
            const tenantData = JSON.parse(getTenants).find((val: any) => val.id == message.tenant)
            const tenantKeyData = JSON.parse(getTenantKey).find((val: any) => val.tenantName == message.tenant)

       

            if (getToken != "-") {
                const tokenData = JSON.parse(getToken)
                const getUserTenant = await clientRedis.get(`USER_DATA_${tokenData.userId}`) ?? "-"
                userTenantData =  JSON.parse(getUserTenant)
            }else{
                ws.send(JSON.stringify({ status: 401, message: "sorry, user not valid" }));
            }

            if ((userTenantData.totalPromptTokenUsage + userTenantData.totalCompletionTokenUsage) > tenantData.maxContext) {
                ws.send(JSON.stringify({ status: 403, message: "You have exceeded the tenant quota" }));
                ws.close();
            }

            //Get messages from client
            const getMessageInput = message.messages
    
            //Get length token
            const usageInfo = new GPTTokens({
                model   : "gpt-4o-mini",
                messages: [
                    ...getMessageInput.map((val: any) => {
                        return {
                            role: val.role,
                            content: val.content
                        }
                    })
                ],
            })

            console.log('Used tokens: ', usageInfo.usedTokens)
            
            if (usageInfo.usedTokens > tenantData.maxContext) {
                ///////////
            }


            //Send message to OpenAI
    
            let messagesOpenAi = [
                {
                    role: 'system',
                    content: `
                        if user request image,video please give only link but not giving search URL, just give a random url link but not from example.com !!!
       
                    `
                },
                ...getMessageInput.map((val: any) => {
                    return {
                        role: val.role,
                        content: val.content
                    }
                })
            ];
        
            const clientOpenAi = new OpenAI({
                apiKey: tenantKeyData.chatGptKey
            });
        
            const openAi = await clientOpenAi.chat.completions.create({
                messages: messagesOpenAi,
                model: CHAT_GPT_MODEL!,
                max_completion_tokens: 2048,
                // Number(JSON.parse(getTenants).find((val: any) => val.id == message.tenant).maxInput),
                stream: true,
                stream_options: {
                    include_usage: true
                }
            });
            let frameSize = 0;
            let frameTemp = [];
            let sendId = 0;
        
            for await (const chunk of openAi) {
                if (chunk.choices.length != 0) {
                    chatsTemp.push({
                        // role: chunk.choices[0].delta.role,
                        content: chunk.choices[0].delta.content
                    })
                    frameSize += 1;
                    frameTemp.push(chunk.choices[0].delta.content)
                    if (frameSize == 10) {
                        sendId += 1;
                        const data = {
                            uuid: message.uuid,
                            id: sendId,
                            msg: frameTemp
                        }
                        ws.send(JSON.stringify(data));
                        frameSize = 0;
                        frameTemp = [];
                    }
                } else {
                    totalPrompt = chunk.usage?.prompt_tokens ?? 0
                    totalCompletion = chunk.usage?.completion_tokens ?? 0
                }
            }
        
            if (frameTemp.length != 0) {
                sendId += 1;
                const data = {
                    uuid: message.uuid,
                    id: sendId,
                    msg: frameTemp
                }
                ws.send(JSON.stringify(data));
            }
        
        if (getTenants != null) {
            JSON.parse(getTenants).map((val: any) => {
                tenantTemp.push({
                    ...val
                })
            })
        
            if (JSON.parse(getTenants).find((val: any) => val.id == message.tenant) == null) {
                ws.send(JSON.stringify({ status: 404, message: "Tenant not found, please create a new tenant" }));
                return false
            }
           
        }else{
            ws.send(JSON.stringify({ status: 404, message: "Tenant key not found in redis" }));
        }

        if (userTenantData) {
            userTenantData.totalPromptTokenUsage += totalPrompt;
           userTenantData.totalCompletionTokenUsage += totalCompletion;
           await clientRedis.set(`USER_DATA_${userTenantData.userId}`, JSON.stringify(userTenantData));
       }
        
        tenantTemp = tenantTemp.map((val: any) => {
            if (val.id == message.tenant) {
                return {
                    ...val,
                    totalPromptTokenUsage:tenantData.totalPromptTokenUsage + totalPrompt, 
                    totalCompletionTokenUsage: tenantData.totalCompletionTokenUsage + totalCompletion
                }
            }else{
                return val
            }
        })

        
        await clientRedis.set(
            REDIS_TENANT,
            JSON.stringify([...tenantTemp]),
        )
        
       
    } catch (error:any) {
        ws.send(JSON.stringify({ status: error.status, message: error }));
    }
}


// =====================================================

// export const updateRedis = async () => {
//     let tenantTemp: any = []
//     let tenantKeyTemp: any = []

//     const getTenant = await prisma.tenant.findMany({ include: { tenantKey: true } })
//     getTenant.map((val) => {
//         tenantTemp.push({
//             id: val.id,
//             name: val.name,
//             maxCompletionToken: val.maxCompletionToken,
//             totalPromptTokenUsage: val.totalPromptTokenUsage,
//             totalCompletionTokenUsage: val.totalCompletionTokenUsage,
//             tenant: val.tenantKey
//         })
//     })

//     const getTenantKey = await prisma.tenantKey.findMany()
//     getTenantKey.map((val) => {
//         tenantKeyTemp.push({
//             id: val.id,
//             tenantName: val.tenantName,
//             chatGptKey: val.chatGptKey
//         })
//     })

//     await clientRedis.set(
//         REDIS_TENANT,
//         JSON.stringify([...tenantTemp]),
//     )

//     await clientRedis.set(
//         REDIS_TENANT_KEYS,
//         JSON.stringify([...tenantKeyTemp]),
//     )
// }



// export const chatsLegacy = async (c: Context) => {


//     let tenantTemp: Tenant
//     const body = await c.req.json()

//     const tenant = await prisma.tenant.findFirst({
//         where: { id: body.tenant.to  String() },
//     })

//     if (tenant == null) {
//         return failedResponse(c, 'Tenant not found, please create a tenant', 404)
//     }

//     tenantTemp = tenant.

//     const user = await checkVerifyUser(body.token);
//     if (user != null) {
//         let userTenantTemp: UserTenant

//         const getUserTenant = await prisma.userTenant.findFirst({
//             include: {
//                 tenant: true
//             },
//             where: {
//                 id: user.id
//             }
//         })
//         if (getUserTenant == null) {
//             const createUserTenant = await prisma.userTenant.create({
//                 include: {
//                     tenant: true
//                 },
//                 data: {
//                     id: user.id,
//                     tenantId: tenantTemp!.id,
//                     userCode: user.code,
//                     totalPromptTokenUsage: 0,
//                     totalCompletionTokenUsage: 0
//                 }
//             });
//             userTenantTemp = createUserTenant;
//         } else {
//             userTenantTemp = getUserTenant;
//         }

//         try {
//             let chatsTemp = []
//             let messagesOpenAi = [
//                 {
//                     role: 'system',
//                     content: `
//                         if user request image,video,gif please give only link but not /search
//                     `
//                 },
//                 ...body.messages.map((val: any) => {
//                     return {
//                         role: val.role,
//                         content: val.content
//                     }
//                 })
//             ];

//             if (body.messages == undefined || body.messages.length == 0) {
//                 return failedResponse(c, 'Messages is required', 422)
//             }
//             const clientOpenAi = new OpenAI({
//                 apiKey: tenantTemp!.
//             }); 
//             const openAi = await clientOpenAi.chat.completions.create({
//                 messages: messagesOpenAi,
//                 model: CHAT_GPT_MODEL!,
//                 max_completion_tokens: Number(tenantTemp!.maxCompletionToken),
//                 stream: true
//             });

//             for await (const chunk of openAi) {
//                 // process.stdout.write(chunk.choices[0]?.delta?.content || '');

//                 chatsTemp.push({
//                     // role: chunk.choices[0].delta.role,
//                     content: chunk.choices[0].delta.content
//                 })

//                 //update usage user tenant
//                 await prisma.userTenant.update({
//                     where: {
//                         id: userTenantTemp.id.toString(),
//                     },
//                     data: {
//                         totalPromptTokenUsage: userTenantTemp.totalPromptTokenUsage + 1,
//                         totalCompletionTokenUsage: userTenantTemp.totalCompletionTokenUsage + 1
//                     }
//                 })

//                 //update usage tenant
//                 await prisma.tenant.update({
//                     where: {
//                         id: tenantTemp!.id,
//                     },
//                     data: {
//                         totalPromptTokenUsage: tenantTemp!.totalPromptTokenUsage + 1,
//                         totalCompletionTokenUsage: tenantTemp!.totalCompletionTokenUsage + 1
//                     }
//                 })
//             }
//             return successDataResponse(c, chatsTemp)




//         } catch (error: any) {
//             return failedResponse(c, error.message)
//         }
//     } else {
//         return failedResponse(c, 'Unauthorized user', 401)
//     }

// }

// const checkVerifyUser = async (token: string) => {
//     try {
//         const response = await axios.get(`${API_URL}/member/memberInfo/getMemberByToken`, {
//             headers: {
//                 'Authorization': token
//             }
//         });

//         return response.data.data
//     } catch (error) {
//         return null
//     }
// }