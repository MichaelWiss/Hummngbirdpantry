export interface ApiClientOptions {
  baseUrl?: string
}

const getBaseUrl = () => (import.meta as any).env?.VITE_API_BASE_URL as string | undefined

export const apiClient = {
  async post(endpoint: string, payload: any, opts: ApiClientOptions = {}) {
    const base = opts.baseUrl || getBaseUrl()
    if (!base) throw new Error('API base URL not configured')
    const res = await fetch(new URL(endpoint, base).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(`API ${endpoint} failed: ${res.status}`)
    return res.json().catch(() => ({}))
  }
}


