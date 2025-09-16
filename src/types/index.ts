// Main types barrel export
// Clean feature-based exports following style.md

// Core types
export * from './core'

// Feature-based types
export * from './pantry'
export * from './shopping'  
export * from './camera'
export * from './voice'
export * from './services'

// Convenience aliases
export type {
  PantryItem as Item
} from './pantry'

export type {
  ShoppingItem as ShoppingListItem
} from './shopping'

export type {
  ChatMessage as Message,
  VoiceCommand as SpeechCommand
} from './voice'

export type {
  CameraMode as ScanMode
} from './camera'
