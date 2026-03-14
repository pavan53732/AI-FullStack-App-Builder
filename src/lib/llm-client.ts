/**
 * Flexible LLM Client
 * 
 * OpenAI-compatible client that works with ANY provider:
 * - OpenAI
 * - DeepSeek
 * - Anthropic (via proxy)
 * - Groq
 * - Together AI
 * - Ollama (local)
 * - LM Studio (local)
 * - Any OpenAI-compatible API
 */

import { loadSettings, AISettings } from './ai-settings'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  messages: ChatMessage[]
  model?: string
  maxTokens?: number
  temperature?: number
  topP?: number
  stream?: boolean
  stop?: string[]
  responseFormat?: { type: 'text' | 'json_object' }
}

export interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: ChatMessage
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface StreamChunk {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: { role?: string; content?: string }
    finish_reason: string | null
  }>
}

/**
 * Flexible LLM Client Class
 */
export class FlexibleLLMClient {
  private settings: AISettings | null = null
  private settingsPromise: Promise<AISettings> | null = null

  /**
   * Get settings (cached)
   */
  private async getSettings(): Promise<AISettings> {
    if (this.settings) return this.settings
    
    if (this.settingsPromise) return this.settingsPromise
    
    this.settingsPromise = loadSettings()
    this.settings = await this.settingsPromise
    this.settingsPromise = null
    
    return this.settings
  }

  /**
   * Reload settings from disk
   */
  async reloadSettings(): Promise<void> {
    this.settings = null
    await this.getSettings()
  }

  /**
   * Create chat completion
   */
  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const settings = await this.getSettings()
    
    if (!settings.baseUrl) {
      throw new Error('AI not configured. Please set up your AI provider in Settings.')
    }
    
    const url = `${settings.baseUrl}/chat/completions`
    
    const body: Record<string, any> = {
      model: options.model || settings.model,
      messages: options.messages,
      max_tokens: options.maxTokens || settings.maxTokens,
      temperature: options.temperature ?? settings.temperature,
      top_p: options.topP ?? settings.topP,
      stream: false,
      ...(options.stop && { stop: options.stop }),
      ...(options.responseFormat && { response_format: options.responseFormat })
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    if (settings.apiKey) {
      headers['Authorization'] = `Bearer ${settings.apiKey}`
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(settings.timeout || 60000)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your settings.')
      }
      if (response.status === 429) {
        throw new Error('Rate limited. Please wait and try again.')
      }
      if (response.status === 404) {
        throw new Error(`Model '${body.model}' not found. Please check the model name.`)
      }
      if (response.status === 500 || response.status === 502 || response.status === 503) {
        throw new Error('API server error. Please try again later.')
      }
      
      throw new Error(`API Error (${response.status}): ${errorText.slice(0, 500)}`)
    }
    
    return response.json()
  }

  /**
   * Stream chat completion
   */
  async *chatStream(options: ChatCompletionOptions): AsyncGenerator<StreamChunk, void, unknown> {
    const settings = await this.getSettings()
    
    if (!settings.baseUrl) {
      throw new Error('AI not configured. Please set up your AI provider in Settings.')
    }
    
    const url = `${settings.baseUrl}/chat/completions`
    
    const body: Record<string, any> = {
      model: options.model || settings.model,
      messages: options.messages,
      max_tokens: options.maxTokens || settings.maxTokens,
      temperature: options.temperature ?? settings.temperature,
      top_p: options.topP ?? settings.topP,
      stream: true,
      ...(options.stop && { stop: options.stop }),
      ...(options.responseFormat && { response_format: options.responseFormat })
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    if (settings.apiKey) {
      headers['Authorization'] = `Bearer ${settings.apiKey}`
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(settings.timeout || 120000)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your settings.')
      }
      if (response.status === 429) {
        throw new Error('Rate limited. Please wait and try again.')
      }
      
      throw new Error(`API Error (${response.status}): ${errorText.slice(0, 500)}`)
    }
    
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }
    
    const decoder = new TextDecoder()
    let buffer = ''
    
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break
      
      buffer += decoder.decode(value, { stream: true })
      
      // Process SSE messages
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      for (const line of lines) {
        const trimmed = line.trim()
        
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        
        const data = trimmed.slice(6)
        
        if (data === '[DONE]') return
        
        try {
          const chunk: StreamChunk = JSON.parse(data)
          yield chunk
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }

  /**
   * Simple chat helper
   */
  async ask(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: ChatMessage[] = []
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    
    messages.push({ role: 'user', content: prompt })
    
    const response = await this.chat({ messages })
    
    return response.choices[0]?.message?.content || ''
  }

  /**
   * Simple streaming chat helper
   */
  async askStream(
    prompt: string,
    systemPrompt: string,
    onChunk: (text: string) => void
  ): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]
    
    let fullText = ''
    
    for await (const chunk of this.chatStream({ messages })) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        fullText += content
        onChunk(content)
      }
    }
    
    return fullText
  }

  /**
   * Get available models
   */
  async listModels(): Promise<string[]> {
    const settings = await this.getSettings()
    
    if (!settings.baseUrl) return []
    
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
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string; latency?: number }> {
    const settings = await this.getSettings()
    
    if (!settings.baseUrl) {
      return { success: false, error: 'Base URL not configured' }
    }
    
    const start = Date.now()
    
    try {
      await this.chat({
        messages: [{ role: 'user', content: 'Say "OK"' }],
        maxTokens: 5
      })
      
      return {
        success: true,
        latency: Date.now() - start
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// Singleton instance
let clientInstance: FlexibleLLMClient | null = null

/**
 * Get the LLM client instance
 */
export function getLLMClient(): FlexibleLLMClient {
  if (!clientInstance) {
    clientInstance = new FlexibleLLMClient()
  }
  return clientInstance
}

/**
 * Reset the client (reload settings)
 */
export function resetLLMClient(): void {
  clientInstance = null
}

// Export a create function for compatibility with existing code
export async function createLLM(): Promise<FlexibleLLMClient> {
  const client = getLLMClient()
  await client.reloadSettings()
  return client
}

// Default export for backward compatibility
export default FlexibleLLMClient
