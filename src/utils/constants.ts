import 'dotenv/config'

export const CHAT_GPT_API_KEY = process.env.CHAT_GPT_API_KEY
export const CHAT_GPT_MODEL = process.env.CHAT_GPT_MODEL
export const CHAT_GPT_MAX_COMPLETION_TOKENS = process.env.CHAT_GPT_MAX_COMPLETION_TOKENS

export const API_URL = process.env.API_URL

export const REDIS_URL = process.env.REDIS_URL
export const REDIS_PASS = process.env.REDIS_PASS

export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY

export type supportModelType = 'gpt-3.5-turbo' | 'gpt-3.5-turbo-16k' | 'gpt-4' | 'gpt-4-32k' | 'gpt-4-turbo-preview' | 'gpt-3.5-turbo-0301' | 'gpt-3.5-turbo-0613' | 'gpt-3.5-turbo-1106' | 'gpt-3.5-turbo-0125' | 'gpt-3.5-turbo-16k-0613' | 'gpt-4-0314' | 'gpt-4-0613' | 'gpt-4-32k-0314' | 'gpt-4-32k-0613' | 'gpt-4-1106-preview' | 'gpt-4-0125-preview' | 'gpt-4-turbo-2024-04-09' | 'gpt-4-turbo' | 'gpt-4o' | 'gpt-4o-2024-05-13' | 'gpt-4o-2024-08-06' | 'gpt-4o-mini' | 'gpt-4o-mini-2024-07-18' | 'o1-preview' | 'o1-preview-2024-09-12' | 'o1-mini' | 'o1-mini-2024-09-12' | 'chatgpt-4o-latest';
