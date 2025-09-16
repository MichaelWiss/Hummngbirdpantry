// Service-related type definitions
import type { Barcode, RecipeId } from './core'
import type { PantryItem } from './pantry'

// First, let's define Recipe since it's referenced but not defined yet
export interface Recipe {
  id: RecipeId
  title: string
  description?: string
  ingredients: string[]
  instructions: string[]
  prepTime?: number
  cookTime?: number
  servings: number
}

// ============================================================================
// SERVICE TYPES
// ============================================================================

// API service interfaces for external integrations
export interface BarcodeService {
  lookup(barcode: Barcode): Promise<PantryItem | null>
  search(query: string): Promise<PantryItem[]>
}

export interface RecipeService {
  searchRecipes(ingredients: string[]): Promise<Recipe[]>
  getRecipe(id: RecipeId): Promise<Recipe>
  getRecipeByIngredients(ingredients: string[]): Promise<Recipe[]>
}

export interface StorageService {
  save<T>(key: string, data: T): Promise<void>
  load<T>(key: string): Promise<T | null>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  keys(): Promise<string[]>
}