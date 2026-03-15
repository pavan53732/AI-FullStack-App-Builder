/**
 * Memory Retrieval Prioritizer - Mechanism #39
 * 
 * Prioritizes what information to remember and retrieve,
 * implementing intelligent memory management with relevance,
 * recency, and importance scoring.
 * 
 * Features:
 * - Relevance-based retrieval
 * - Importance scoring
 * - Memory decay modeling
 * - Context-aware prioritization
 * - Working memory management
 */

import ZAI from 'z-ai-web-dev-sdk'

// Types
export interface MemoryItem {
  id: string
  content: string
  type: MemoryType
  importance: number // 0-1
  createdAt: Date
  lastAccessed: Date
  accessCount: number
  embedding?: number[]
  metadata: Record<string, any>
  tags: string[]
  associations: string[] // Related memory IDs
}

export type MemoryType = 
  | 'fact'           // Static information
  | 'event'          // Time-based occurrence
  | 'procedure'      // How-to knowledge
  | 'preference'     // User/system preferences
  | 'context'        // Situational information
  | 'error'          // Error patterns
  | 'solution'       // Problem solutions
  | 'insight'        // Discovered insights
  | 'constraint'     // Limitations/rules
  | 'pattern'        // Observed patterns

export interface RetrievalContext {
  query: string
  taskType?: string
  recentMemories?: string[] // IDs of recently accessed memories
  currentGoal?: string
  constraints?: string[]
  priorityTypes?: MemoryType[]
  maxResults?: number
  minRelevance?: number
}

export interface PrioritizedMemory {
  memory: MemoryItem
  relevanceScore: number
  recencyScore: number
  importanceScore: number
  contextScore: number
  finalScore: number
  retrievalReason: string
}

export interface RetrievalResult {
  memories: PrioritizedMemory[]
  totalConsidered: number
  retrievalTime: number
  strategy: RetrievalStrategy
  memoryStats: MemoryStatistics
}

export type RetrievalStrategy = 
  | 'relevance_first'
  | 'recency_first'
  | 'importance_first'
  | 'balanced'
  | 'context_aware'
  | 'adaptive'

export interface MemoryStatistics {
  totalMemories: number
  byType: Record<MemoryType, number>
  avgAccessCount: number
  avgAge: number // in hours
  oldestMemory: Date
  newestMemory: Date
  hotMemories: number // Frequently accessed
  coldMemories: number // Rarely accessed
}

export interface DecayConfig {
  halfLife: number // Hours until importance halves
  minImportance: number // Minimum importance floor
  accessBoost: number // Boost per access
  recencyWeight: number
  importanceWeight: number
  relevanceWeight: number
}

const DEFAULT_DECAY: DecayConfig = {
  halfLife: 168, // 1 week
  minImportance: 0.1,
  accessBoost: 0.05,
  recencyWeight: 0.25,
  importanceWeight: 0.25,
  relevanceWeight: 0.5
}

/**
 * Memory Retrieval Prioritizer
 */
export class MemoryRetrievalPrioritizer {
  private zai: any = null
  private memories: Map<string, MemoryItem> = new Map()
  private typeIndex: Map<MemoryType, Set<string>> = new Map()
  private tagIndex: Map<string, Set<string>> = new Map()
  private decayConfig: DecayConfig
  private initialized = false
  private strategy: RetrievalStrategy = 'balanced'

  constructor(decayConfig?: Partial<DecayConfig>) {
    this.decayConfig = { ...DEFAULT_DECAY, ...decayConfig }
  }

  /**
   * Initialize the prioritizer
   */
  async init(): Promise<void> {
    if (this.initialized) return
    this.zai = await ZAI.create()
    this.initialized = true
  }

  /**
   * Store a memory
   */
  storeMemory(memory: MemoryItem): void {
    this.memories.set(memory.id, memory)

    // Update type index
    if (!this.typeIndex.has(memory.type)) {
      this.typeIndex.set(memory.type, new Set())
    }
    this.typeIndex.get(memory.type)!.add(memory.id)

    // Update tag index
    for (const tag of memory.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set())
      }
      this.tagIndex.get(tag)!.add(memory.id)
    }
  }

  /**
   * Retrieve prioritized memories
   */
  async retrieve(context: RetrievalContext): Promise<RetrievalResult> {
    await this.init()
    const startTime = Date.now()

    // Apply memory decay
    this.applyDecay()

    // Get candidate memories
    const candidates = this.getCandidates(context)
    
    // Score and rank memories
    const scored = await this.scoreMemories(candidates, context)
    
    // Sort by final score
    scored.sort((a, b) => b.finalScore - a.finalScore)

    // Apply minimum relevance filter
    const filtered = scored.filter(
      m => m.relevanceScore >= (context.minRelevance || 0.1)
    )

    // Limit results
    const maxResults = context.maxResults || 10
    const results = filtered.slice(0, maxResults)

    // Update access counts for retrieved memories
    for (const result of results) {
      const memory = this.memories.get(result.memory.id)
      if (memory) {
        memory.lastAccessed = new Date()
        memory.accessCount++
      }
    }

    return {
      memories: results,
      totalConsidered: candidates.length,
      retrievalTime: Date.now() - startTime,
      strategy: this.strategy,
      memoryStats: this.getStatistics()
    }
  }

  /**
   * Get candidate memories based on context
   */
  private getCandidates(context: RetrievalContext): MemoryItem[] {
    let candidates = new Set<string>()

    // If priority types specified, start with those
    if (context.priorityTypes && context.priorityTypes.length > 0) {
      for (const type of context.priorityTypes) {
        const typeMemories = this.typeIndex.get(type)
        if (typeMemories) {
          for (const id of typeMemories) {
            candidates.add(id)
          }
        }
      }
    } else {
      // Include all memories
      for (const id of this.memories.keys()) {
        candidates.add(id)
      }
    }

    // Include recently accessed memories
    if (context.recentMemories) {
      for (const id of context.recentMemories) {
        if (this.memories.has(id)) {
          candidates.add(id)
        }
      }
    }

    // Convert to memory items
    return Array.from(candidates)
      .map(id => this.memories.get(id)!)
      .filter(Boolean)
  }

  /**
   * Score memories based on context
   */
  private async scoreMemories(
    memories: MemoryItem[],
    context: RetrievalContext
  ): Promise<PrioritizedMemory[]> {
    return Promise.all(memories.map(memory => this.scoreMemory(memory, context)))
  }

  /**
   * Score a single memory
   */
  private async scoreMemory(
    memory: MemoryItem,
    context: RetrievalContext
  ): Promise<PrioritizedMemory> {
    // Calculate individual scores
    const relevanceScore = await this.calculateRelevance(memory, context)
    const recencyScore = this.calculateRecency(memory)
    const importanceScore = this.calculateImportance(memory)
    const contextScore = this.calculateContextFit(memory, context)

    // Calculate final score based on strategy
    const finalScore = this.calculateFinalScore(
      relevanceScore,
      recencyScore,
      importanceScore,
      contextScore
    )

    // Determine retrieval reason
    const retrievalReason = this.determineRetrievalReason(
      relevanceScore,
      recencyScore,
      importanceScore,
      contextScore
    )

    return {
      memory,
      relevanceScore,
      recencyScore,
      importanceScore,
      contextScore,
      finalScore,
      retrievalReason
    }
  }

  /**
   * Calculate relevance score
   */
  private async calculateRelevance(
    memory: MemoryItem,
    context: RetrievalContext
  ): Promise<number> {
    // Semantic similarity with query
    const querySimilarity = this.calculateTextSimilarity(
      context.query.toLowerCase(),
      memory.content.toLowerCase()
    )

    // Goal relevance
    let goalRelevance = 0
    if (context.currentGoal) {
      goalRelevance = this.calculateTextSimilarity(
        context.currentGoal.toLowerCase(),
        memory.content.toLowerCase()
      )
    }

    // Tag matching
    const queryWords = context.query.toLowerCase().split(/\s+/)
    const tagMatch = memory.tags.filter(tag => 
      queryWords.some(word => tag.toLowerCase().includes(word))
    ).length / Math.max(memory.tags.length, 1)

    // Combine scores
    return (querySimilarity * 0.5 + goalRelevance * 0.3 + tagMatch * 0.2)
  }

  /**
   * Calculate text similarity (Jaccard)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/))
    const words2 = new Set(text2.split(/\s+/))

    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])

    return union.size > 0 ? intersection.size / union.size : 0
  }

  /**
   * Calculate recency score (exponential decay)
   */
  private calculateRecency(memory: MemoryItem): number {
    const ageHours = (Date.now() - memory.lastAccessed.getTime()) / (1000 * 60 * 60)
    return Math.exp(-ageHours / this.decayConfig.halfLife)
  }

  /**
   * Calculate importance score
   */
  private calculateImportance(memory: MemoryItem): number {
    // Base importance
    let importance = memory.importance

    // Boost for access count
    importance += Math.min(memory.accessCount * this.decayConfig.accessBoost, 0.5)

    // Cap at 1.0
    return Math.min(importance, 1.0)
  }

  /**
   * Calculate context fit score
   */
  private calculateContextFit(
    memory: MemoryItem,
    context: RetrievalContext
  ): number {
    let score = 0.5 // Base score

    // Task type match
    if (context.taskType && memory.metadata.taskTypes) {
      if (memory.metadata.taskTypes.includes(context.taskType)) {
        score += 0.3
      }
    }

    // Constraint relevance
    if (context.constraints && context.constraints.length > 0) {
      const constraintMatch = context.constraints.some(c =>
        memory.content.toLowerCase().includes(c.toLowerCase())
      )
      if (constraintMatch) {
        score += 0.2
      }
    }

    // Memory type priority
    if (context.priorityTypes && context.priorityTypes.includes(memory.type)) {
      score += 0.2
    }

    return Math.min(score, 1.0)
  }

  /**
   * Calculate final score based on strategy
   */
  private calculateFinalScore(
    relevance: number,
    recency: number,
    importance: number,
    context: number
  ): number {
    const weights = this.getStrategyWeights()

    return (
      relevance * weights.relevance +
      recency * weights.recency +
      importance * weights.importance +
      context * weights.context
    )
  }

  /**
   * Get weights based on current strategy
   */
  private getStrategyWeights(): {
    relevance: number
    recency: number
    importance: number
    context: number
  } {
    switch (this.strategy) {
      case 'relevance_first':
        return { relevance: 0.6, recency: 0.1, importance: 0.1, context: 0.2 }
      case 'recency_first':
        return { relevance: 0.2, recency: 0.5, importance: 0.1, context: 0.2 }
      case 'importance_first':
        return { relevance: 0.2, recency: 0.1, importance: 0.5, context: 0.2 }
      case 'context_aware':
        return { relevance: 0.2, recency: 0.2, importance: 0.2, context: 0.4 }
      case 'adaptive':
        // Dynamically adjust based on query characteristics
        return { relevance: 0.4, recency: 0.2, importance: 0.2, context: 0.2 }
      case 'balanced':
      default:
        return { relevance: 0.35, recency: 0.2, importance: 0.25, context: 0.2 }
    }
  }

  /**
   * Determine retrieval reason
   */
  private determineRetrievalReason(
    relevance: number,
    recency: number,
    importance: number,
    context: number
  ): string {
    const max = Math.max(relevance, recency, importance, context)

    if (max === relevance && relevance > 0.5) {
      return 'Highly relevant to current query'
    } else if (max === recency && recency > 0.7) {
      return 'Recently accessed'
    } else if (max === importance && importance > 0.7) {
      return 'High importance score'
    } else if (max === context && context > 0.7) {
      return 'Strong context match'
    } else {
      return 'Balanced retrieval score'
    }
  }

  /**
   * Apply decay to all memories
   */
  private applyDecay(): void {
    for (const [id, memory] of this.memories) {
      const ageHours = (Date.now() - memory.createdAt.getTime()) / (1000 * 60 * 60)
      const decayFactor = Math.exp(-ageHours / this.decayConfig.halfLife)
      
      memory.importance = Math.max(
        memory.importance * decayFactor,
        this.decayConfig.minImportance
      )
    }
  }

  /**
   * Set retrieval strategy
   */
  setStrategy(strategy: RetrievalStrategy): void {
    this.strategy = strategy
  }

  /**
   * Get memory statistics
   */
  getStatistics(): MemoryStatistics {
    const memories = Array.from(this.memories.values())
    
    const byType: Record<MemoryType, number> = {} as Record<MemoryType, number>
    for (const type of this.typeIndex.keys()) {
      byType[type] = this.typeIndex.get(type)?.size || 0
    }

    const now = Date.now()
    const avgAge = memories.reduce((sum, m) => 
      sum + (now - m.createdAt.getTime()) / (1000 * 60 * 60), 0) / 
      (memories.length || 1)

    const avgAccessCount = memories.reduce((sum, m) => 
      sum + m.accessCount, 0) / (memories.length || 1)

    const sortedByDate = [...memories].sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime())

    return {
      totalMemories: memories.length,
      byType,
      avgAccessCount,
      avgAge,
      oldestMemory: sortedByDate[0]?.createdAt || new Date(),
      newestMemory: sortedByDate[sortedByDate.length - 1]?.createdAt || new Date(),
      hotMemories: memories.filter(m => m.accessCount > 5).length,
      coldMemories: memories.filter(m => m.accessCount === 0).length
    }
  }

  /**
   * Forget memories below importance threshold
   */
  forgetUnimportant(threshold: number = 0.1): number {
    let forgotten = 0

    for (const [id, memory] of this.memories) {
      if (memory.importance < threshold && memory.accessCount === 0) {
        this.memories.delete(id)
        
        // Clean up indexes
        this.typeIndex.get(memory.type)?.delete(id)
        for (const tag of memory.tags) {
          this.tagIndex.get(tag)?.delete(id)
        }
        
        forgotten++
      }
    }

    return forgotten
  }

  /**
   * Get memory by ID
   */
  getMemory(id: string): MemoryItem | undefined {
    return this.memories.get(id)
  }

  /**
   * Get memories by type
   */
  getByType(type: MemoryType): MemoryItem[] {
    const ids = this.typeIndex.get(type)
    if (!ids) return []
    return Array.from(ids).map(id => this.memories.get(id)!).filter(Boolean)
  }

  /**
   * Get memories by tag
   */
  getByTag(tag: string): MemoryItem[] {
    const ids = this.tagIndex.get(tag)
    if (!ids) return []
    return Array.from(ids).map(id => this.memories.get(id)!).filter(Boolean)
  }

  /**
   * Clear all memories
   */
  clear(): void {
    this.memories.clear()
    this.typeIndex.clear()
    this.tagIndex.clear()
  }

  /**
   * Export memories
   */
  export(): MemoryItem[] {
    return Array.from(this.memories.values())
  }

  /**
   * Import memories
   */
  import(memories: MemoryItem[]): void {
    for (const memory of memories) {
      this.storeMemory(memory)
    }
  }
}

// Singleton
let prioritizerInstance: MemoryRetrievalPrioritizer | null = null

export function getMemoryPrioritizer(
  decayConfig?: Partial<DecayConfig>
): MemoryRetrievalPrioritizer {
  if (!prioritizerInstance) {
    prioritizerInstance = new MemoryRetrievalPrioritizer(decayConfig)
  }
  return prioritizerInstance
}

/**
 * Quick retrieval function
 */
export async function prioritizeMemoryRetrieval(
  query: string,
  memories: MemoryItem[],
  maxResults: number = 10
): Promise<PrioritizedMemory[]> {
  const prioritizer = new MemoryRetrievalPrioritizer()
  await prioritizer.init()
  
  for (const memory of memories) {
    prioritizer.storeMemory(memory)
  }

  const result = await prioritizer.retrieve({ query, maxResults })
  return result.memories
}

/**
 * Create a memory item
 */
export function createMemory(
  content: string,
  type: MemoryType,
  options: Partial<MemoryItem> = {}
): MemoryItem {
  return {
    id: options.id || `mem_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    content,
    type,
    importance: options.importance ?? 0.5,
    createdAt: options.createdAt || new Date(),
    lastAccessed: options.lastAccessed || new Date(),
    accessCount: options.accessCount || 0,
    embedding: options.embedding,
    metadata: options.metadata || {},
    tags: options.tags || [],
    associations: options.associations || []
  }
}
