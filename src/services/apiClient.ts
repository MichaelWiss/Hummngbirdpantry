export interface ApiClientOptions {
  baseUrl?: string
}

const getBaseUrl = () => {
  const envVal = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined
  if (envVal) return envVal
  try {
    const ls = typeof localStorage !== 'undefined' ? localStorage.getItem('API_BASE_URL') || undefined : undefined
    if (ls) return ls
  } catch { /* ignore */ }
  try {
    const meta = typeof document !== 'undefined' ? document.querySelector('meta[name="api-base-url"]')?.getAttribute('content') || undefined : undefined
    if (meta) return meta
  } catch { /* ignore */ }
  try {
    const win = (globalThis as any)
    if (win && win.__API_BASE_URL__) return win.__API_BASE_URL__ as string
  } catch { /* ignore */ }
  return undefined
}

export const getApiBaseUrl = getBaseUrl

const generateIdempotencyKey = () => {
  try {
    return crypto.randomUUID()
  } catch {
    // Fallback for older browsers
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export const apiClient = {
  async request(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', endpoint: string, payload?: any, opts: ApiClientOptions = {}) {
    const base = opts.baseUrl || getBaseUrl()
    if (!base) throw new Error('API base URL not configured')
    const url = new URL(endpoint, base).toString()
    
    const maxRetries = 3
    const baseDelay = 500 // 500ms
    const needsIdempotency = ['POST', 'PUT', 'PATCH'].includes(method)
    const idempotencyKey = needsIdempotency ? generateIdempotencyKey() : undefined
    
    let lastError: Error | undefined
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
        
        if (idempotencyKey) {
          headers['x-idempotency-key'] = idempotencyKey
        }
        
        const res = await fetch(url, {
          method,
          mode: 'cors',
          cache: 'no-store',
          headers,
          ...(payload !== undefined ? { body: JSON.stringify(payload) } : {})
        })
        
        if (!res.ok) {
          let detail: string | undefined
          try {
            const text = await res.text()
            if (text) {
              try { const data = JSON.parse(text); detail = data.error || data.message || text }
              catch { detail = text }
            }
          } catch { /* ignore */ }
          
          const error = new Error(`API ${method} ${endpoint} failed: ${res.status}${detail ? ` - ${detail}` : ''}`)
          
          // Don't retry client errors (4xx) except 408 (timeout)
          if (res.status >= 400 && res.status < 500 && res.status !== 408) {
            throw error
          }
          
          // Retry server errors (5xx) and network issues
          if (attempt < maxRetries) {
            lastError = error
            const delay = baseDelay * Math.pow(2, attempt - 1) // Exponential backoff
            console.warn(`API retry ${attempt}/${maxRetries} after ${delay}ms:`, error.message)
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
          
          throw error
        }
        
        // Success - return response
        const text = await res.text()
        if (!text) return undefined
        try {
          return JSON.parse(text)
        } catch {
          return undefined
        }
      } catch (error) {
        // Network error or fetch failed
        if (attempt < maxRetries) {
          lastError = error as Error
          const delay = baseDelay * Math.pow(2, attempt - 1)
          console.warn(`API retry ${attempt}/${maxRetries} after ${delay}ms:`, (error as Error).message)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        throw error
      }
    }
    
    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Max retries exceeded')
  },
  async get<T = any>(endpoint: string, opts: ApiClientOptions = {}) {
    return this.request('GET', endpoint, undefined, opts) as Promise<T>
  },
  async post(endpoint: string, payload: any, opts: ApiClientOptions = {}) {
    return this.request('POST', endpoint, payload, opts)
  },
  async put(endpoint: string, payload: any, opts: ApiClientOptions = {}) {
    return this.request('PUT', endpoint, payload, opts)
  },
  async patch(endpoint: string, payload: any, opts: ApiClientOptions = {}) {
    return this.request('PATCH', endpoint, payload, opts)
  },
  async delete(endpoint: string, opts: ApiClientOptions = {}) {
    return this.request('DELETE', endpoint, undefined, opts)
  }
}


