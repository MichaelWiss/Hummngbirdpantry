// Pantry components barrel export
export { default as PantryView } from './PantryView'
export { default as CategoryList } from './CategoryList'
export { default as CategoryItems } from './CategoryItems'
// Note: AddItemModal is lazily loaded in App.tsx, so not exported here to avoid conflicts
// export { AddItemModal } from './AddItemModal'

// Export component types
export type { 
  // Component prop types will be exported from individual component files
} from '../../../types'