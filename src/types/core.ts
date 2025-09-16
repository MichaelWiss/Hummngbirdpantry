// Core type definitions for HummingbirdPantry application
// Base types used across all features

// ============================================================================
// BASIC DATA TYPES
// ============================================================================

// Unique identifier type for all entities
export type ID = string & { readonly __brand: 'ID' }

// Branded types for domain safety
export type Barcode = string & { readonly __brand: 'Barcode' }
export type UserId = string & { readonly __brand: 'UserId' }
export type RecipeId = string & { readonly __brand: 'RecipeId' }

// Common status types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'
export type ItemStatus = 'fresh' | 'expiring-soon' | 'expired' | 'consumed'
export type SyncStatus = 'synced' | 'pending' | 'failed'

// Measurement units for quantities
export type MeasurementUnit =
  | 'pieces' | 'lbs' | 'kg' | 'oz' | 'g'
  | 'cups' | 'tbsp' | 'tsp' | 'ml' | 'l'
  | 'cans' | 'bottles' | 'packages'

// Item categories for organization
export type ItemCategory =
  | 'dairy' | 'meat' | 'produce' | 'bakery'
  | 'pantry' | 'frozen' | 'beverages' | 'snacks'
  | 'spices' | 'condiments' | 'canned' | 'other'

// Permission states for browser APIs
export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unknown'

// ============================================================================
// UTILITY TYPES
// ============================================================================

// Generic API response wrapper with better type safety
export interface ApiResponse<T> {
  data: T
  error?: string
  loading: boolean
  timestamp: Date
}

// Strict API result type for server operations
export type ApiResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: string
}

// Generic pagination type
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasNext: boolean
  hasPrev: boolean
}

// Form validation types
export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface FormState<T> {
  data: T
  errors: ValidationError[]
  touched: Record<keyof T, boolean>
  isValid: boolean
  isSubmitting: boolean
}

// Generic action type for reducers
export interface Action<T = string, P = any> {
  type: T
  payload?: P
  meta?: Record<string, any>
  error?: boolean
}