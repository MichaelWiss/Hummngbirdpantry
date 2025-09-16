// Services barrel export
// Following style.md: Feature-based imports

// API services
export { apiService } from './api.service'
export { apiClient } from './apiClient'

// Specialized services
export { processScanResult } from './scanService'
export { checkServerHealth } from './healthService'
export * from './productLookup'