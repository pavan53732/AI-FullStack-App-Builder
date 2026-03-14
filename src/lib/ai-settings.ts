/**
 * AI Settings Configuration
 * 
 * Stores user's AI provider settings:
 * - Base URL (OpenAI, DeepSeek, Ollama, etc.)
 * - API Key
 * - Model Name
 * - Provider presets
 */

import fs from 'fs/promises'
import path from 'path'

const SETTINGS_DIR = path.join(process.cwd(), 'data')
const SETTINGS_FILE = path.join(SETTINGS_DIR, 'ai-settings.json')

export interface AISettings {
  provider: string           // 'openai' | 'deepseek' | 'ollama' | 'custom'
  baseUrl: string           // API endpoint URL
  apiKey: string            // API key (encrypted in storage)
  model: string             // Model name
  maxTokens: number         // Max tokens for completion
  temperature: number       // Temperature 0-2
  topP: number              // Top-p sampling
  streamEnabled: boolean    // Enable streaming
  timeout: number           // Request timeout in ms
  createdAt: string
  updatedAt: string
}

export interface AIProviderPreset {
  id: string
  name: string
  baseUrl: string
  models: string[]
  requiresApiKey: boolean
  icon: string
  description: string
}

// Provider presets
export const PROVIDER_PRESETS: AIProviderPreset[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini'],
    requiresApiKey: true,
    icon: '🤖',
    description: 'OpenAI GPT models - Most capable general-purpose AI'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
    requiresApiKey: true,
    icon: '🧠',
    description: 'DeepSeek - Great for coding and reasoning'
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    requiresApiKey: true,
    icon: '🎭',
    description: 'Claude - Excellent for analysis and writing'
  },
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    requiresApiKey: true,
    icon: '⚡',
    description: 'Groq - Fastest inference with Llama models'
  },
  {
    id: 'together',
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    models: ['meta-llama/Llama-3-70b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1', 'Qwen/Qwen2.5-72B-Instruct'],
    requiresApiKey: true,
    icon: '🤝',
    description: 'Together AI - Open-source models at scale'
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434/v1',
    models: ['llama3.2', 'llama3.1', 'qwen2.5', 'codellama', 'deepseek-coder-v2', 'mistral'],
    requiresApiKey: false,
    icon: '🏠',
    description: 'Ollama - Run models locally on your machine'
  },
  {
    id: 'lmstudio',
    name: 'LM Studio (Local)',
    baseUrl: 'http://localhost:1234/v1',
    models: ['local-model'],
    requiresApiKey: false,
    icon: '💻',
    description: 'LM Studio - Local model server'
  },
  {
    id: 'custom',
    name: 'Custom Provider',
    baseUrl: '',
    models: [],
    requiresApiKey: true,
    icon: '⚙️',
    description: 'Use any OpenAI-compatible API'
  }
]

/**
 * Default settings
 */
const DEFAULT_SETTINGS: AISettings = {
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o',
  maxTokens: 4096,
  temperature: 0.7,
  topP: 1,
  streamEnabled: true,
  timeout: 60000,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

/**
 * Load AI settings from disk
 */
export async function loadSettings(): Promise<AISettings> {
  try {
    const content = await fs.readFile(SETTINGS_FILE, 'utf-8')
    const settings = JSON.parse(content)
    
    // Decrypt API key (simple base64 for now, can be improved)
    if (settings.apiKey) {
      settings.apiKey = decryptApiKey(settings.apiKey)
    }
    
    return { ...DEFAULT_SETTINGS, ...settings }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

/**
 * Save AI settings to disk
 */
export async function saveSettings(settings: Partial<AISettings>): Promise<AISettings> {
  const current = await loadSettings()
  
  const updated: AISettings = {
    ...current,
    ...settings,
    updatedAt: new Date().toISOString()
  }
  
  // Encrypt API key before saving
  const toSave = { ...updated }
  if (toSave.apiKey) {
    toSave.apiKey = encryptApiKey(toSave.apiKey)
  }
  
  await fs.mkdir(SETTINGS_DIR, { recursive: true })
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(toSave, null, 2))
  
  return updated
}

/**
 * Simple encryption (base64 - can be improved with proper encryption)
 */
function encryptApiKey(key: string): string {
  return Buffer.from(key).toString('base64')
}

function decryptApiKey(encrypted: string): string {
  try {
    return Buffer.from(encrypted, 'base64').toString('utf-8')
  } catch {
    return encrypted
  }
}

/**
 * Validate API credentials by making a test request
 */
export async function validateCredentials(settings: AISettings): Promise<{
  valid: boolean
  error?: string
  models?: string[]
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}> {
  try {
    const response = await fetch(`${settings.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(settings.apiKey && { 'Authorization': `Bearer ${settings.apiKey}` })
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [{ role: 'user', content: 'Say "OK" if you can read this.' }],
        max_tokens: 10
      }),
      signal: AbortSignal.timeout(settings.timeout || 30000)
    })
    
    if (!response.ok) {
      const error = await response.text()
      
      if (response.status === 401) {
        return { valid: false, error: 'Invalid API key' }
      }
      if (response.status === 404) {
        return { valid: false, error: 'Model not found or endpoint not available' }
      }
      if (response.status === 429) {
        return { valid: false, error: 'Rate limited - please wait' }
      }
      
      return { valid: false, error: `API error: ${response.status} - ${error.slice(0, 200)}` }
    }
    
    const data = await response.json()
    
    return {
      valid: true,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      }
    }
  } catch (error: any) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return { valid: false, error: 'Connection timeout - check if the base URL is correct' }
    }
    if (error.code === 'ECONNREFUSED') {
      return { valid: false, error: 'Connection refused - is the server running?' }
    }
    return { valid: false, error: error.message || 'Unknown error' }
  }
}

/**
 * List available models from the provider
 */
export async function listModels(settings: AISettings): Promise<string[]> {
  try {
    const response = await fetch(`${settings.baseUrl}/models`, {
      headers: {
        ...(settings.apiKey && { 'Authorization': `Bearer ${settings.apiKey}` })
      },
      signal: AbortSignal.timeout(10000)
    })
    
    if (!response.ok) return []
    
    const data = await response.json()
    return data.data?.map((m: any) => m.id).sort() || []
  } catch {
    return []
  }
}

/**
 * Get provider preset by ID
 */
export function getProviderPreset(providerId: string): AIProviderPreset | undefined {
  return PROVIDER_PRESETS.find(p => p.id === providerId)
}

/**
 * Check if settings are configured
 */
export async function isConfigured(): Promise<boolean> {
  const settings = await loadSettings()
  return !!(settings.baseUrl && settings.model)
}
