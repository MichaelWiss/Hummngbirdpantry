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

export const apiClient = {
  async request(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', endpoint: string, payload?: any, opts: ApiClientOptions = {}) {
    const base = opts.baseUrl || getBaseUrl()
    if (!base) throw new Error('API base URL not configured')
    const url = new URL(endpoint, base).toString()
    const res = await fetch(url, {
      method,
      mode: 'cors',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
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
      const msg = `API ${method} ${endpoint} failed: ${res.status}${detail ? ` - ${detail}` : ''}`
      throw new Error(msg)
    }
    // Some endpoints may return no body (e.g., DELETE)
    const text = await res.text()
    if (!text) return undefined
    try {
      return JSON.parse(text)
    } catch {
      return undefined
    }
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


