// Voice, speech recognition and chat-related type definitions
import type { ID } from './core'

// ============================================================================
// VOICE AND SPEECH RECOGNITION TYPES
// ============================================================================

// Voice command structure
export interface VoiceCommand {
  command: string
  intent: VoiceIntent
  entities: VoiceEntity[]
  confidence: number
}

export type VoiceIntent =
  | 'add-item'
  | 'remove-item'
  | 'find-item'
  | 'check-stock'
  | 'get-recipe'
  | 'add-to-shopping'
  | 'unknown'

export interface VoiceEntity {
  type: 'item' | 'quantity' | 'category' | 'recipe'
  value: string
  confidence: number
}

// Voice recognition state
export interface VoiceState {
  isListening: boolean
  isProcessing: boolean
  transcript: string
  error?: string
  lastCommand?: VoiceCommand
}

// ============================================================================
// CHAT AND AI ASSISTANT TYPES
// ============================================================================

// Chat message structure
export interface ChatMessage {
  id: ID
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: Date

  // Message metadata
  type: 'text' | 'voice' | 'image' | 'suggestion'
  attachments?: ChatAttachment[]

  // AI-specific metadata
  confidence?: number
  intents?: string[]
  entities?: ChatEntity[]
}

export interface ChatAttachment {
  type: 'image' | 'voice' | 'receipt'
  url: string
  metadata?: Record<string, any>
}

export interface ChatEntity {
  type: string
  value: string
  start: number
  end: number
  confidence: number
}

// Chat conversation state
export interface ChatState {
  messages: ChatMessage[]
  isTyping: boolean
  error?: string
  suggestions: ChatSuggestion[]
}

// Quick action suggestions from AI
export interface ChatSuggestion {
  id: string
  type: 'add-to-pantry' | 'add-to-shopping' | 'find-recipe' | 'check-stock'
  title: string
  description?: string
  action: () => void
  confidence: number
}

// ============================================================================
// HOOK TYPES
// ============================================================================

export interface UseVoiceReturn {
  isListening: boolean
  transcript: string
  startListening: () => Promise<void>
  stopListening: () => void
  error?: string
  lastCommand?: VoiceCommand
  supported: boolean
}

export interface UseChatReturn {
  messages: ChatMessage[]
  isTyping: boolean
  suggestions: ChatSuggestion[]
  sendMessage: (content: string, type?: ChatMessage['type']) => Promise<void>
  addAttachment: (attachment: ChatAttachment) => void
  clearMessages: () => void
  error?: string
}