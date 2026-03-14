/**
 * Context Deduplication System
 * 
 * Removes duplicate context items to optimize token usage and prevent
 * redundant information in AI prompts.
 * 
 * Implements:
 * - Content-based deduplication
 * - Semantic similarity detection
 * - Source-based deduplication
 * - Hierarchical deduplication
 * 
 * Mechanism #36 from the 520-mechanism checklist
 */

// ============================================================================
// Types
// ============================================================================

export interface ContextItem {
  id: string
  content: string
  type: ContextType
  source: string
  relevance: number
  timestamp: Date
  metadata?: Record<string, unknown>
  tokens?: number
  priority?: number
}

export type ContextType = 
  | 'code'
  | 'documentation'
  | 'error'
  | 'dependency'
  | 'pattern'
  | 'knowledge'
  | 'conversation'
  | 'file'
  | 'api'
  | 'config'

export interface ContextDeduplicationConfig {
  /** Enable exact content matching */
  enableExactMatch: boolean
  /** Enable semantic similarity detection */
  enableSemanticSimilarity: boolean
  /** Similarity threshold for deduplication (0-1) */
  similarityThreshold: number
  /** Maximum items to keep after deduplication */
  maxItems: number
  /** Preserve high-priority items even if similar */
  preserveHighPriority: boolean
  /** Priority threshold for preservation */
  priorityThreshold: number
  /** Enable cross-type deduplication */
  enableCrossType: boolean
  /** Minimum content length to consider */
  minContentLength: number
  /** Enable fuzzy matching */
  enableFuzzyMatch: boolean
  /** Fuzzy match threshold */
  fuzzyThreshold: number
}

export interface DeduplicationReport {
  originalCount: number
  deduplicatedCount: number
  removedCount: number
  removedItems: RemovedItem[]
  deduplicationRate: number
  tokensSaved: number
  processingTime: number
}

export interface RemovedItem {
  item: ContextItem
  reason: DeduplicationReason
  similarTo: string // ID of the item it was similar to
  similarity: number
}

export type DeduplicationReason = 
  | 'exact_match'
  | 'semantic_similarity'
  | 'fuzzy_match'
  | 'source_duplicate'
  | 'subset'
  | 'superseded'

export interface DeduplicationStats {
  totalProcessed: number
  totalRemoved: number
  exactMatchesRemoved: number
  semanticMatchesRemoved: number
  fuzzyMatchesRemoved: number
  averageSimilarity: number
  tokensSaved: number
}

// ============================================================================
// Context Deduplicator Class
// ============================================================================

export class ContextDeduplicator {
  private config: ContextDeduplicationConfig
  private contentHashes: Map<string, ContextItem> = new Map()
  private stats: DeduplicationStats = {
    totalProcessed: 0,
    totalRemoved: 0,
    exactMatchesRemoved: 0,
    semanticMatchesRemoved: 0,
    fuzzyMatchesRemoved: 0,
    averageSimilarity: 0,
    tokensSaved: 0
  }
  private similarityScores: number[] = []

  constructor(config?: Partial<ContextDeduplicationConfig>) {
    this.config = {
      enableExactMatch: true,
      enableSemanticSimilarity: true,
      similarityThreshold: 0.85,
      maxItems: 100,
      preserveHighPriority: true,
      priorityThreshold: 8,
      enableCrossType: false,
      minContentLength: 10,
      enableFuzzyMatch: true,
      fuzzyThreshold: 0.9,
      ...config
    }
  }

  /**
   * Deduplicate an array of context items
   */
  deduplicate(items: ContextItem[]): { items: ContextItem[]; report: DeduplicationReport } {
    const startTime = Date.now()
    const removedItems: RemovedItem[] = []
    const kept: ContextItem[] = []
    const seen = new Set<string>()

    // Sort by priority and relevance
    const sorted = this.sortByPriority(items)

    for (const item of sorted) {
      // Skip short content
      if (item.content.length < this.config.minContentLength) {
        continue
      }

      // Check if already seen (exact match)
      if (this.config.enableExactMatch) {
        const hash = this.hashContent(item.content)
        if (seen.has(hash)) {
          removedItems.push({
            item,
            reason: 'exact_match',
            similarTo: this.contentHashes.get(hash)?.id || '',
            similarity: 1.0
          })
          this.updateStats('exact_match', item, 1.0)
          continue
        }
      }

      // Check semantic similarity
      if (this.config.enableSemanticSimilarity) {
        const similarItem = this.findSimilarItem(item, kept)
        if (similarItem) {
          // Check if high priority should be preserved
          if (this.config.preserveHighPriority && 
              item.priority && 
              item.priority >= this.config.priorityThreshold) {
            // Keep both but mark relationship
            kept.push(item)
          } else {
            removedItems.push({
              item,
              reason: 'semantic_similarity',
              similarTo: similarItem.item.id,
              similarity: similarItem.similarity
            })
            this.updateStats('semantic_similarity', item, similarItem.similarity)
            continue
          }
        }
      }

      // Check fuzzy match
      if (this.config.enableFuzzyMatch) {
        const fuzzyMatch = this.findFuzzyMatch(item, kept)
        if (fuzzyMatch) {
          removedItems.push({
            item,
            reason: 'fuzzy_match',
            similarTo: fuzzyMatch.item.id,
            similarity: fuzzyMatch.similarity
          })
          this.updateStats('fuzzy_match', item, fuzzyMatch.similarity)
          continue
        }
      }

      // Check for subset/superseded
      const supersededBy = this.findSuperseding(item, kept)
      if (supersededBy) {
        removedItems.push({
          item,
          reason: 'superseded',
          similarTo: supersededBy.id,
          similarity: 1.0
        })
        this.updateStats('superseded', item, 1.0)
        continue
      }

      // Item is unique - keep it
      kept.push(item)
      seen.add(this.hashContent(item.content))
      this.contentHashes.set(this.hashContent(item.content), item)
    }

    // Trim to max items if needed
    const finalItems = kept.slice(0, this.config.maxItems)

    const processingTime = Date.now() - startTime
    const tokensSaved = this.calculateTokensSaved(items, finalItems)

    const report: DeduplicationReport = {
      originalCount: items.length,
      deduplicatedCount: finalItems.length,
      removedCount: removedItems.length,
      removedItems,
      deduplicationRate: items.length > 0 ? removedItems.length / items.length : 0,
      tokensSaved,
      processingTime
    }

    return { items: finalItems, report }
  }

  /**
   * Sort items by priority and relevance
   */
  private sortByPriority(items: ContextItem[]): ContextItem[] {
    return [...items].sort((a, b) => {
      // Higher priority first
      const priorityA = a.priority || 5
      const priorityB = b.priority || 5
      if (priorityA !== priorityB) {
        return priorityB - priorityA
      }
      // Higher relevance first
      return b.relevance - a.relevance
    })
  }

  /**
   * Generate hash for content
   */
  private hashContent(content: string): string {
    // Simple hash function for content
    let hash = 0
    const normalized = content.toLowerCase().trim()
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }

  /**
   * Find a similar item in the kept list
   */
  private findSimilarItem(
    item: ContextItem, 
    kept: ContextItem[]
  ): { item: ContextItem; similarity: number } | null {
    for (const keptItem of kept) {
      // Skip cross-type check if disabled
      if (!this.config.enableCrossType && item.type !== keptItem.type) {
        continue
      }

      const similarity = this.calculateSimilarity(item.content, keptItem.content)
      if (similarity >= this.config.similarityThreshold) {
        return { item: keptItem, similarity }
      }
    }
    return null
  }

  /**
   * Find fuzzy match
   */
  private findFuzzyMatch(
    item: ContextItem, 
    kept: ContextItem[]
  ): { item: ContextItem; similarity: number } | null {
    for (const keptItem of kept) {
      if (!this.config.enableCrossType && item.type !== keptItem.type) {
        continue
      }

      const similarity = this.calculateFuzzySimilarity(item.content, keptItem.content)
      if (similarity >= this.config.fuzzyThreshold) {
        return { item: keptItem, similarity }
      }
    }
    return null
  }

  /**
   * Find if item is superseded by another
   */
  private findSuperseding(item: ContextItem, kept: ContextItem[]): ContextItem | null {
    for (const keptItem of kept) {
      // Check if kept item contains all information from current item
      if (this.isSubset(item.content, keptItem.content)) {
        return keptItem
      }
    }
    return null
  }

  /**
   * Calculate similarity between two strings
   */
  private calculateSimilarity(content1: string, content2: string): number {
    const tokens1 = this.tokenize(content1)
    const tokens2 = this.tokenize(content2)
    
    // Jaccard similarity
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)))
    const union = new Set([...tokens1, ...tokens2])
    
    if (union.size === 0) return 0
    return intersection.size / union.size
  }

  /**
   * Calculate fuzzy similarity (allows for minor differences)
   */
  private calculateFuzzySimilarity(content1: string, content2: string): number {
    const normalized1 = this.normalizeForComparison(content1)
    const normalized2 = this.normalizeForComparison(content2)
    
    // Levenshtein-based similarity
    const distance = this.levenshteinDistance(normalized1, normalized2)
    const maxLength = Math.max(normalized1.length, normalized2.length)
    
    if (maxLength === 0) return 1
    return 1 - (distance / maxLength)
  }

  /**
   * Check if content1 is a subset of content2
   */
  private isSubset(content1: string, content2: string): boolean {
    const tokens1 = this.tokenize(content1)
    const tokens2 = this.tokenize(content2)
    
    // All tokens from content1 should be in content2
    for (const token of tokens1) {
      if (!tokens2.has(token)) {
        return false
      }
    }
    return true
  }

  /**
   * Tokenize content
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
   * Normalize content for comparison
   */
  private normalizeForComparison(content: string): string {
    return content
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim()
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length
    const n = str2.length
    const dp: number[][] = []

    for (let i = 0; i <= m; i++) {
      dp[i] = []
      for (let j = 0; j <= n; j++) {
        if (i === 0) {
          dp[i][j] = j
        } else if (j === 0) {
          dp[i][j] = i
        } else if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1]
        } else {
          dp[i][j] = 1 + Math.min(
            dp[i - 1][j],
            dp[i][j - 1],
            dp[i - 1][j - 1]
          )
        }
      }
    }
    return dp[m][n]
  }

  /**
   * Calculate tokens saved
   */
  private calculateTokensSaved(original: ContextItem[], deduplicated: ContextItem[]): number {
    const originalTokens = original.reduce((sum, item) => sum + (item.tokens || this.estimateTokens(item.content)), 0)
    const deduplicatedTokens = deduplicated.reduce((sum, item) => sum + (item.tokens || this.estimateTokens(item.content)), 0)
    return originalTokens - deduplicatedTokens
  }

  /**
   * Estimate tokens from content
   */
  private estimateTokens(content: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(content.length / 4)
  }

  /**
   * Update statistics
   */
  private updateStats(reason: string, item: ContextItem, similarity: number): void {
    this.stats.totalProcessed++
    this.stats.totalRemoved++
    
    switch (reason) {
      case 'exact_match':
        this.stats.exactMatchesRemoved++
        break
      case 'semantic_similarity':
        this.stats.semanticMatchesRemoved++
        break
      case 'fuzzy_match':
        this.stats.fuzzyMatchesRemoved++
        break
    }

    this.similarityScores.push(similarity)
    this.stats.tokensSaved += item.tokens || this.estimateTokens(item.content)
    this.stats.averageSimilarity = 
      this.similarityScores.reduce((a, b) => a + b, 0) / this.similarityScores.length
  }

  /**
   * Get deduplication statistics
   */
  getStats(): DeduplicationStats {
    return { ...this.stats }
  }

  /**
   * Clear cache and reset stats
   */
  reset(): void {
    this.contentHashes.clear()
    this.stats = {
      totalProcessed: 0,
      totalRemoved: 0,
      exactMatchesRemoved: 0,
      semanticMatchesRemoved: 0,
      fuzzyMatchesRemoved: 0,
      averageSimilarity: 0,
      tokensSaved: 0
    }
    this.similarityScores = []
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ContextDeduplicationConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let deduplicatorInstance: ContextDeduplicator | null = null

export function getContextDeduplicator(config?: Partial<ContextDeduplicationConfig>): ContextDeduplicator {
  if (!deduplicatorInstance) {
    deduplicatorInstance = new ContextDeduplicator(config)
  }
  return deduplicatorInstance
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Deduplicate context items
 */
export function deduplicateContext(items: ContextItem[]): { items: ContextItem[]; report: DeduplicationReport } {
  return getContextDeduplicator().deduplicate(items)
}

/**
 * Quick deduplication returning only items
 */
export function dedupContext(items: ContextItem[]): ContextItem[] {
  return getContextDeduplicator().deduplicate(items).items
}

/**
 * Get deduplication statistics
 */
export function getContextDeduplicationStats(): DeduplicationStats {
  return getContextDeduplicator().getStats()
}

/**
 * Create a context item
 */
export function createContextItem(
  content: string,
  type: ContextType,
  source: string,
  options?: Partial<ContextItem>
): ContextItem {
  return {
    id: options?.id || generateId(),
    content,
    type,
    source,
    relevance: options?.relevance ?? 1.0,
    timestamp: options?.timestamp || new Date(),
    metadata: options?.metadata,
    tokens: options?.tokens,
    priority: options?.priority
  }
}

function generateId(): string {
  return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
