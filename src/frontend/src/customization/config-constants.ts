export const BASENAME = ''
export const PORT = 3000
export const PROXY_TARGET = 'http://157.180.124.76:7860'
export const API_ROUTES = ['^/api/v1/', '^/api/v2/', '/health']
export const BASE_URL_API = '/api/v1/'
export const BASE_URL_API_V2 = '/api/v2/'
export const HEALTH_CHECK_URL = '/health_check'
export const DOCS_LINK = 'https://docs.langflow.org'

// Read from environment variables (set at build time via .env file)
// These are used for Agent node defaults in Builder-Only Mode
// Safe access with nullish coalescing to handle undefined import.meta.env
export const DEFAULT_AGENT_API_KEY = typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_DEFAULT_AGENT_API_KEY ?? 'sk-default-api-key' : 'sk-default-api-key'

export const DEFAULT_AGENT_LLM_PROVIDER = typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_DEFAULT_AGENT_LLM_PROVIDER ?? 'OpenAI' : 'OpenAI'

export const DEFAULT_AGENT_MODEL_NAME = typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_DEFAULT_AGENT_MODEL_NAME ?? 'gpt-4o-mini' : 'gpt-4o-mini'

export default {
  DOCS_LINK,
  BASENAME,
  PORT,
  PROXY_TARGET,
  API_ROUTES,
  BASE_URL_API,
  BASE_URL_API_V2,
  HEALTH_CHECK_URL,
  DEFAULT_AGENT_API_KEY,
  DEFAULT_AGENT_LLM_PROVIDER,
  DEFAULT_AGENT_MODEL_NAME,
}
