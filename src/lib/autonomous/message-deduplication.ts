/**
 * Message Deduplication System
 * 
 * Prevents duplicate messages between agents in the multi-agent system.
 * Implements multiple deduplication strategies:
 * - Content-based hashing
 * - Semantic similarity detection
 * - Temporal windowing
 * - Agent-based tracking
 * 
 * Mechanism #148 from the 520-mechanism checklist
 */

import { createHash } from 'crypto'

// ============================================================================
// Types
// ============================================================================

export interface AgentMessage {
  id: string
  from: string
  to: string | string[]
  type: MessageType
  content: string
  metadata?: Record<string, unknown>
  timestamp: Date
  priority?: number
  ttl?: number // Time-to-live in milliseconds
}

export type MessageType = 
  | 'task'
  | 'result'
  | 'status'
  | 'error'
  | 'query'
  | 'response'
  | 'notification'
  | 'coordination'
  | 'knowledge'
  | 'feedback'

export interface DeduplicationConfig {
  /** Enable content-based deduplication */
  enableContentHash: boolean
  /** Enable semantic similarity deduplication */
  enableSemanticSimilarity: boolean
  /** Time window for deduplication in milliseconds */
  timeWindowMs: number
  /** Maximum messages to keep in history */
  maxHistorySize: number
  /** Similarity threshold (0-1) for semantic deduplication */
  similarityThreshold: number
  /** Enable cross-agent deduplication */
  enableCrossAgent: boolean
  /** Hash algorithm to use */
  hashAlgorithm: 'md5' | 'sha256' | 'sha512'
}

export interface DuplicateMessage {
  original: AgentMessage
  duplicate: AgentMessage
  similarity: number
  detectedAt: Date
  deduplicationType: 'exact' | 'semantic' | 'temporal'
}

export interface DeduplicationResult {
  isDuplicate: boolean
  originalMessage?: AgentMessage
  duplicateMessage?: AgentMessage
  similarity: number
  deduplicationType?: 'exact' | 'semantic' | 'temporal'
}

export interface MessageStats {
  totalMessages: number
  duplicatesDetected: number
  duplicatesPrevented: number
  deduplicationRate: number
  averageProcessingTime: number
  cacheHits: number
  cacheMisses: number
}

export interface MessageCache {
  hash: string
  message: AgentMessage
  timestamp: Date
  agentFrom: string
  agentTo: string | string[]
  type: MessageType
  semanticEmbedding?: number[]
}

// ============================================================================
// Message Deduplicator Class
// ============================================================================

export class MessageDeduplicator {
  private config: DeduplicationConfig
  private messageCache: Map<string, MessageCache> = new Map()
  private recentMessages: AgentMessage[] = []
  private duplicateLog: DuplicateMessage[] = []
  private stats: MessageStats = {
    totalMessages: 0,
    duplicatesDetected: 0,
    duplicatesPrevented: 0,
    deduplicationRate: 0,
    averageProcessingTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  }
  private processingTimes: number[] = []
  private cleanupInterval?: ReturnType<typeof setInterval>

  constructor(config?: Partial<DeduplicationConfig>) {
    this.config = {
      enableContentHash: true,
      enableSemanticSimilarity: false, // Requires embedding model
      timeWindowMs: 60000, // 1 minute default
      maxHistorySize: 10000,
      similarityThreshold: 0.95,
      enableCrossAgent: true,
      hashAlgorithm: 'sha256',
      ...config
    }

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  /**
   * Check if a message is a duplicate
   */
  checkDuplicate(message: AgentMessage): DeduplicationResult {
    const startTime = Date.now()
    this.stats.totalMessages++

    // Generate hash for the message
    const hash = this.generateHash(message)
    
    // Check exact duplicate via hash
    if (this.config.enableContentHash) {
      const cached = this.messageCache.get(hash)
      if (cached) {
        const age = Date.now() - cached.timestamp.getTime()
        if (age < this.config.timeWindowMs) {
          this.recordDuplicate(cached.message, message, 1.0, 'exact')
          this.stats.cacheHits++
          this.recordProcessingTime(Date.now() - startTime)
          return {
            isDuplicate: true,
            originalMessage: cached.message,
            duplicateMessage: message,
            similarity: 1.0,
            deduplicationType: 'exact'
          }
        }
      }
    }

    // Check semantic similarity
    if (this.config.enableSemanticSimilarity) {
      const semanticMatch = this.findSemanticMatch(message)
      if (semanticMatch) {
        this.recordDuplicate(semanticMatch.original, message, semanticMatch.similarity, 'semantic')
        this.stats.cacheHits++
        this.recordProcessingTime(Date.now() - startTime)
        return {
          isDuplicate: true,
          originalMessage: semanticMatch.original,
          duplicateMessage: message,
          similarity: semanticMatch.similarity,
          deduplicationType: 'semantic'
        }
      }
    }

    // Check temporal duplicate (same agent, similar content within time window)
    const temporalMatch = this.findTemporalMatch(message)
    if (temporalMatch) {
      this.recordDuplicate(temporalMatch.original, message, temporalMatch.similarity, 'temporal')
      this.stats.cacheHits++
      this.recordProcessingTime(Date.now() - startTime)
      return {
        isDuplicate: true,
        originalMessage: temporalMatch.original,
        duplicateMessage: message,
        similarity: temporalMatch.similarity,
        deduplicationType: 'temporal'
      }
    }

    // Not a duplicate - add to cache
    this.addToCache(hash, message)
    this.stats.cacheMisses++
    this.recordProcessingTime(Date.now() - startTime)
    
    return {
      isDuplicate: false,
      similarity: 0
    }
  }

  /**
   * Process message through deduplication filter
   * Returns the message if unique, or undefined if duplicate
   */
  process(message: AgentMessage): AgentMessage | undefined {
    const result = this.checkDuplicate(message)
    
    if (result.isDuplicate) {
      this.stats.duplicatesPrevented++
      this.updateStats()
      return undefined
    }

    // Add to recent messages
    this.recentMessages.push(message)
    if (this.recentMessages.length > this.config.maxHistorySize) {
      this.recentMessages.shift()
    }

    return message
  }

  /**
   * Batch process multiple messages
   */
  processBatch(messages: AgentMessage[]): AgentMessage[] {
    return messages
      .map(msg => this.process(msg))
      .filter((msg): msg is AgentMessage => msg !== undefined)
  }

  /**
   * Generate a unique hash for a message
   */
  private generateHash(message: AgentMessage): string {
    // Create a normalized representation for hashing
    const normalized = this.normalizeForHashing(message)
    const content = JSON.stringify(normalized)
    
    return createHash(this.config.hashAlgorithm)
      .update(content)
      .digest('hex')
  }

  /**
   * Normalize message for consistent hashing
   */
  private normalizeForHashing(message: AgentMessage): Record<string, unknown> {
    return {
      from: message.from,
      to: typeof message.to === 'string' ? message.to : [...message.to].sort(),
      type: message.type,
      content: this.normalizeContent(message.content),
      // Exclude timestamp and id from hash for duplicate detection
    }
  }

  /**
   * Normalize content for comparison
   */
  private normalizeContent(content: string): string {
    return content
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim()
  }

  /**
   * Find a semantic match in the cache
   */
  private findSemanticMatch(message: AgentMessage): { original: AgentMessage; similarity: number } | null {
    // This would require an embedding model for full implementation
    // For now, use a simplified token-based similarity
    const messageTokens = this.tokenize(message.content)
    
    for (const cached of this.messageCache.values()) {
      if (cached.agentFrom === message.from && !this.config.enableCrossAgent) {
        continue
      }

      const age = Date.now() - cached.timestamp.getTime()
      if (age > this.config.timeWindowMs) {
        continue
      }

      const cachedTokens = this.tokenize(cached.message.content)
      const similarity = this.calculateJaccardSimilarity(messageTokens, cachedTokens)
      
      if (similarity >= this.config.similarityThreshold) {
        return { original: cached.message, similarity }
      }
    }

    return null
  }

  /**
   * Find a temporal match (same agent, similar content)
   */
  private findTemporalMatch(message: AgentMessage): { original: AgentMessage; similarity: number } | null {
    const cutoffTime = Date.now() - this.config.timeWindowMs
    
    for (const recent of this.recentMessages) {
      // Skip if too old
      if (recent.timestamp.getTime() < cutoffTime) {
        continue
      }

      // Check if same sender and similar content
      if (recent.from === message.from) {
        const similarity = this.calculateContentSimilarity(recent.content, message.content)
        if (similarity >= 0.8) { // Higher threshold for temporal matches
          return { original: recent, similarity }
        }
      }
    }

    return null
  }

  /**
   * Tokenize content for similarity comparison
   */
  private tokenize(content: string): Set<string> {
    return new Set(
      content
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(token => token.length > 2)
    )
  }

  /**
   * Calculate Jaccard similarity between token sets
   */
  private calculateJaccardSimilarity(tokens1: Set<string>, tokens2: Set<string>): number {
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)))
    const union = new Set([...tokens1, ...tokens2])
    
    if (union.size === 0) return 0
    return intersection.size / union.size
  }

  /**
   * Calculate content similarity
   */
  private calculateContentSimilarity(content1: string, content2: string): number {
    const tokens1 = this.tokenize(content1)
    const tokens2 = this.tokenize(content2)
    return this.calculateJaccardSimilarity(tokens1, tokens2)
  }

  /**
   * Add message to cache
   */
  private addToCache(hash: string, message: AgentMessage): void {
    this.messageCache.set(hash, {
      hash,
      message,
      timestamp: new Date(),
      agentFrom: message.from,
      agentTo: message.to,
      type: message.type
    })
  }

  /**
   * Record a duplicate detection
   */
  private recordDuplicate(
    original: AgentMessage,
    duplicate: AgentMessage,
    similarity: number,
    type: 'exact' | 'semantic' | 'temporal'
  ): void {
    this.stats.duplicatesDetected++
    this.duplicateLog.push({
      original,
      duplicate,
      similarity,
      detectedAt: new Date(),
      deduplicationType: type
    })

    // Keep log manageable
    if (this.duplicateLog.length > 1000) {
      this.duplicateLog.shift()
    }
  }

  /**
   * Record processing time
   */
  private recordProcessingTime(time: number): void {
    this.processingTimes.push(time)
    if (this.processingTimes.length > 1000) {
      this.processingTimes.shift()
    }
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    if (this.stats.totalMessages > 0) {
      this.stats.deduplicationRate = this.stats.duplicatesDetected / this.stats.totalMessages
    }
    
    if (this.processingTimes.length > 0) {
      this.stats.averageProcessingTime = 
        this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length
    }
  }

  /**
   * Clean up old cache entries
   */
  private cleanup(): void {
    const cutoff = Date.now() - this.config.timeWindowMs * 2
    
    for (const [hash, cached] of this.messageCache) {
      if (cached.timestamp.getTime() < cutoff) {
        this.messageCache.delete(hash)
      }
    }

    // Clean old recent messages
    this.recentMessages = this.recentMessages.filter(
      msg => msg.timestamp.getTime() >= cutoff
    )
  }

  /**
   * Get deduplication statistics
   */
  getStats(): MessageStats {
    this.updateStats()
    return { ...this.stats }
  }

  /**
   * Get recent duplicates
   */
  getRecentDuplicates(limit: number = 50): DuplicateMessage[] {
    return this.duplicateLog.slice(-limit)
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.messageCache.clear()
    this.recentMessages = []
    this.duplicateLog = []
    this.processingTimes = []
    this.stats = {
      totalMessages: 0,
      duplicatesDetected: 0,
      duplicatesPrevented: 0,
      deduplicationRate: 0,
      averageProcessingTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DeduplicationConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Destroy the deduplicator
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.clearCache()
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let deduplicatorInstance: MessageDeduplicator | null = null

export function getMessageDeduplicator(config?: Partial<DeduplicationConfig>): MessageDeduplicator {
  if (!deduplicatorInstance) {
    deduplicatorInstance = new MessageDeduplicator(config)
  }
  return deduplicatorInstance
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick check if message is duplicate
 */
export function isDuplicate(message: AgentMessage): boolean {
  return getMessageDeduplicator().checkDuplicate(message).isDuplicate
}

/**
 * Process message through deduplication
 */
export function deduplicate(message: AgentMessage): AgentMessage | undefined {
  return getMessageDeduplicator().process(message)
}

/**
 * Process batch of messages
 */
export function deduplicateBatch(messages: AgentMessage[]): AgentMessage[] {
  return getMessageDeduplicator().processBatch(messages)
}

/**
 * Get deduplication statistics
 */
export function getDeduplicationStats(): MessageStats {
  return getMessageDeduplicator().getStats()
}
