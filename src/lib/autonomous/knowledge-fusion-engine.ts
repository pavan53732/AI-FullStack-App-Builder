/**
 * Knowledge Fusion Engine - Mechanism #38
 * 
 * Merges and reconciles knowledge from multiple sources to create
 * a unified, consistent knowledge base. Handles conflicts, deduplication,
 * and confidence-weighted merging.
 * 
 * Features:
 * - Multi-source knowledge integration
 * - Conflict detection and resolution
 * - Confidence-weighted merging
 * - Temporal consistency checking
 * - Semantic deduplication
 * - Knowledge graph construction
 */

import ZAI from 'z-ai-web-dev-sdk'

// Types
export interface KnowledgeSource {
  id: string
  name: string
  type: 'documentation' | 'code' | 'api' | 'user' | 'external' | 'inferred'
  reliability: number // 0-1
  freshness: Date
  metadata: Record<string, any>
}

export interface KnowledgeItem {
  id: string
  content: string
  type: KnowledgeType
  source: KnowledgeSource
  confidence: number // 0-1
  timestamp: Date
  embedding?: number[]
  relationships: KnowledgeRelationship[]
  metadata: Record<string, any>
}

export type KnowledgeType = 
  | 'fact'           // Verifiable information
  | 'rule'           // Conditional logic
  | 'pattern'        // Repeated structures
  | 'concept'        // Abstract ideas
  | 'procedure'      // Step-by-step instructions
  | 'relationship'   // Connections between entities
  | 'constraint'     // Limitations or requirements
  | 'preference'     // User or system preferences
  | 'context'        // Situational information
  | 'evidence'       // Supporting data

export interface KnowledgeRelationship {
  type: 'depends_on' | 'contradicts' | 'supports' | 'extends' | 'refines' | 'supersedes'
  targetId: string
  strength: number // 0-1
}

export interface FusionConflict {
  id: string
  items: KnowledgeItem[]
  conflictType: 'contradiction' | 'overlap' | 'temporal' | 'confidence'
  severity: 'low' | 'medium' | 'high'
  resolution?: ConflictResolution
}

export interface ConflictResolution {
  strategy: 'most_reliable' | 'most_recent' | 'highest_confidence' | 'merge' | 'vote' | 'ai_resolved'
  winningItem: string
  reasoning: string
  mergedContent?: string
}

export interface FusionResult {
  fusedKnowledge: KnowledgeItem[]
  conflicts: FusionConflict[]
  statistics: FusionStatistics
  knowledgeGraph: KnowledgeGraph
}

export interface FusionStatistics {
  totalInputs: number
  duplicatesRemoved: number
  conflictsDetected: number
  conflictsResolved: number
  finalCount: number
  averageConfidence: number
  coverageBySource: Record<string, number>
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
}

export interface KnowledgeNode {
  id: string
  label: string
  type: KnowledgeType
  confidence: number
  sources: string[]
}

export interface KnowledgeEdge {
  from: string
  to: string
  type: KnowledgeRelationship['type']
  strength: number
}

export interface FusionConfig {
  conflictStrategy: 'auto' | 'conservative' | 'aggressive' | 'interactive'
  minConfidence: number
  deduplicationThreshold: number // Similarity threshold for deduplication
  weightByReliability: boolean
  weightByFreshness: boolean
  maxItems: number
  enableSemanticMerge: boolean
}

const DEFAULT_CONFIG: FusionConfig = {
  conflictStrategy: 'auto',
  minConfidence: 0.3,
  deduplicationThreshold: 0.85,
  weightByReliability: true,
  weightByFreshness: true,
  maxItems: 10000,
  enableSemanticMerge: true
}

/**
 * Knowledge Fusion Engine
 */
export class KnowledgeFusionEngine {
  private zai: any = null
  private knowledgeBase: Map<string, KnowledgeItem> = new Map()
  private sources: Map<string, KnowledgeSource> = new Map()
  private conflicts: FusionConflict[] = []
  private config: FusionConfig
  private initialized = false

  constructor(config?: Partial<FusionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Initialize the engine
   */
  async init(): Promise<void> {
    if (this.initialized) return
    this.zai = await ZAI.create()
    this.initialized = true
  }

  /**
   * Register a knowledge source
   */
  registerSource(source: KnowledgeSource): void {
    this.sources.set(source.id, source)
  }

  /**
   * Add knowledge items from multiple sources
   */
  async addKnowledge(items: KnowledgeItem[]): Promise<void> {
    await this.init()

    for (const item of items) {
      // Validate source exists
      if (!this.sources.has(item.source.id)) {
        this.sources.set(item.source.id, item.source)
      }

      // Check for duplicates
      const duplicate = await this.findDuplicate(item)
      if (duplicate) {
        // Merge with existing
        await this.mergeKnowledge(duplicate, item)
        continue
      }

      // Check for conflicts
      const conflicts = await this.detectConflicts(item)
      if (conflicts.length > 0) {
        for (const conflict of conflicts) {
          this.conflicts.push(conflict)
        }
      }

      // Add to knowledge base
      this.knowledgeBase.set(item.id, item)
    }
  }

  /**
   * Fuse all knowledge into a unified knowledge base
   */
  async fuse(): Promise<FusionResult> {
    await this.init()

    const startTime = Date.now()
    const statistics: FusionStatistics = {
      totalInputs: this.knowledgeBase.size,
      duplicatesRemoved: 0,
      conflictsDetected: this.conflicts.length,
      conflictsResolved: 0,
      finalCount: 0,
      averageConfidence: 0,
      coverageBySource: {}
    }

    // Step 1: Deduplication
    const deduplicated = await this.deduplicateKnowledge()
    statistics.duplicatesRemoved = this.knowledgeBase.size - deduplicated.size

    // Step 2: Resolve conflicts
    const resolved = await this.resolveAllConflicts()
    statistics.conflictsResolved = resolved

    // Step 3: Build knowledge graph
    const knowledgeGraph = await this.buildKnowledgeGraph()

    // Step 4: Calculate statistics
    const finalItems = Array.from(this.knowledgeBase.values())
    statistics.finalCount = finalItems.length
    statistics.averageConfidence = finalItems.reduce((sum, item) => 
      sum + this.calculateWeightedConfidence(item), 0) / (finalItems.length || 1)

    // Coverage by source
    for (const [sourceId] of this.sources) {
      const count = finalItems.filter(item => item.source.id === sourceId).length
      statistics.coverageBySource[sourceId] = count / (finalItems.length || 1)
    }

    return {
      fusedKnowledge: finalItems,
      conflicts: this.conflicts,
      statistics,
      knowledgeGraph
    }
  }

  /**
   * Find duplicate knowledge item
   */
  private async findDuplicate(item: KnowledgeItem): Promise<KnowledgeItem | null> {
    for (const [_, existing] of this.knowledgeBase) {
      // Check type match
      if (existing.type !== item.type) continue

      // Check semantic similarity if embeddings available
      if (existing.embedding && item.embedding) {
        const similarity = this.cosineSimilarity(existing.embedding, item.embedding)
        if (similarity > this.config.deduplicationThreshold) {
          return existing
        }
      }

      // Check content similarity
      const contentSimilarity = this.calculateContentSimilarity(existing.content, item.content)
      if (contentSimilarity > this.config.deduplicationThreshold) {
        return existing
      }
    }

    return null
  }

  /**
   * Merge two knowledge items
   */
  private async mergeKnowledge(existing: KnowledgeItem, incoming: KnowledgeItem): Promise<void> {
    // Weight by confidence and source reliability
    const existingWeight = this.calculateWeightedConfidence(existing)
    const incomingWeight = this.calculateWeightedConfidence(incoming)

    if (incomingWeight > existingWeight) {
      // Incoming is more reliable, but preserve relationships
      incoming.relationships = this.mergeRelationships(existing.relationships, incoming.relationships)
      this.knowledgeBase.set(existing.id, incoming)
    } else {
      // Keep existing but add relationships
      existing.relationships = this.mergeRelationships(existing.relationships, incoming.relationships)
      // Update confidence if incoming provides additional support
      existing.confidence = Math.min(1, existing.confidence + incoming.confidence * 0.1)
    }
  }

  /**
   * Merge relationship arrays
   */
  private mergeRelationships(
    existing: KnowledgeRelationship[], 
    incoming: KnowledgeRelationship[]
  ): KnowledgeRelationship[] {
    const merged = [...existing]
    
    for (const inc of incoming) {
      const exists = merged.some(e => 
        e.type === inc.type && e.targetId === inc.targetId
      )
      if (!exists) {
        merged.push(inc)
      }
    }

    return merged
  }

  /**
   * Detect conflicts with existing knowledge
   */
  private async detectConflicts(item: KnowledgeItem): Promise<FusionConflict[]> {
    const conflicts: FusionConflict[] = []

    for (const [_, existing] of this.knowledgeBase) {
      // Check for explicit contradiction relationships
      const hasContradiction = item.relationships.some(r => 
        r.type === 'contradicts' && r.targetId === existing.id
      ) || existing.relationships.some(r => 
        r.type === 'contradicts' && r.targetId === item.id
      )

      if (hasContradiction) {
        conflicts.push({
          id: `conflict_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          items: [existing, item],
          conflictType: 'contradiction',
          severity: 'high'
        })
        continue
      }

      // Check for semantic contradiction
      if (existing.type === item.type && existing.type === 'fact') {
        const isContradictory = await this.checkSemanticContradiction(existing.content, item.content)
        if (isContradictory) {
          conflicts.push({
            id: `conflict_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            items: [existing, item],
            conflictType: 'contradiction',
            severity: 'medium'
          })
        }
      }

      // Check for temporal conflicts
      if (existing.type === 'fact' && item.type === 'fact') {
        const temporalConflict = await this.checkTemporalConflict(existing, item)
        if (temporalConflict) {
          conflicts.push({
            id: `conflict_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            items: [existing, item],
            conflictType: 'temporal',
            severity: 'low'
          })
        }
      }
    }

    return conflicts
  }

  /**
   * Check if two pieces of content contradict each other
   */
  private async checkSemanticContradiction(content1: string, content2: string): Promise<boolean> {
    try {
      const response = await this.zai.chat.completions.create({
        messages: [
          { 
            role: 'system', 
            content: 'Determine if these two statements contradict each other. Respond with only "yes" or "no".' 
          },
          { 
            role: 'user', 
            content: `Statement 1: ${content1}\nStatement 2: ${content2}` 
          }
        ],
        thinking: { type: 'disabled' }
      })

      return response.choices[0]?.message?.content?.toLowerCase().includes('yes')
    } catch {
      return false
    }
  }

  /**
   * Check for temporal conflicts
   */
  private async checkTemporalConflict(item1: KnowledgeItem, item2: KnowledgeItem): Promise<boolean> {
    // If both items are from the same source and one is significantly newer
    if (item1.source.id === item2.source.id) {
      const timeDiff = Math.abs(item1.timestamp.getTime() - item2.timestamp.getTime())
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24)
      
      // If more than 30 days apart and same source, might be temporal conflict
      if (daysDiff > 30) {
        return true
      }
    }
    return false
  }

  /**
   * Resolve all detected conflicts
   */
  private async resolveAllConflicts(): Promise<number> {
    let resolved = 0

    for (const conflict of this.conflicts) {
      if (!conflict.resolution) {
        conflict.resolution = await this.resolveConflict(conflict)
        resolved++
      }
    }

    return resolved
  }

  /**
   * Resolve a single conflict
   */
  private async resolveConflict(conflict: FusionConflict): Promise<ConflictResolution> {
    const [item1, item2] = conflict.items

    switch (conflict.conflictType) {
      case 'contradiction':
        return this.resolveContradiction(item1, item2)
      case 'temporal':
        return this.resolveTemporalConflict(item1, item2)
      case 'confidence':
        return this.resolveConfidenceConflict(item1, item2)
      default:
        return this.resolveOverlap(item1, item2)
    }
  }

  /**
   * Resolve contradiction using configured strategy
   */
  private resolveContradiction(item1: KnowledgeItem, item2: KnowledgeItem): ConflictResolution {
    switch (this.config.conflictStrategy) {
      case 'most_reliable':
        const winner = item1.source.reliability > item2.source.reliability ? item1 : item2
        return {
          strategy: 'most_reliable',
          winningItem: winner.id,
          reasoning: `Source "${winner.source.name}" has higher reliability (${winner.source.reliability})`
        }

      case 'most_recent':
        const recent = item1.timestamp > item2.timestamp ? item1 : item2
        return {
          strategy: 'most_recent',
          winningItem: recent.id,
          reasoning: `Item from ${recent.timestamp.toISOString()} is more recent`
        }

      case 'highest_confidence':
        const confident = item1.confidence > item2.confidence ? item1 : item2
        return {
          strategy: 'highest_confidence',
          winningItem: confident.id,
          reasoning: `Confidence ${confident.confidence} is higher`
        }

      default:
        // Auto: combine reliability, freshness, and confidence
        const score1 = this.calculateWeightedConfidence(item1)
        const score2 = this.calculateWeightedConfidence(item2)
        const autoWinner = score1 > score2 ? item1 : item2
        return {
          strategy: 'ai_resolved',
          winningItem: autoWinner.id,
          reasoning: `Combined score ${(score1 > score2 ? score1 : score2).toFixed(3)} is higher`
        }
    }
  }

  /**
   * Resolve temporal conflict - prefer newer information
   */
  private resolveTemporalConflict(item1: KnowledgeItem, item2: KnowledgeItem): ConflictResolution {
    const newer = item1.timestamp > item2.timestamp ? item1 : item2
    return {
      strategy: 'most_recent',
      winningItem: newer.id,
      reasoning: `Newer information from ${newer.timestamp.toISOString()} supersedes older data`
    }
  }

  /**
   * Resolve confidence-based conflict
   */
  private resolveConfidenceConflict(item1: KnowledgeItem, item2: KnowledgeItem): ConflictResolution {
    const confident = item1.confidence > item2.confidence ? item1 : item2
    return {
      strategy: 'highest_confidence',
      winningItem: confident.id,
      reasoning: `Higher confidence (${confident.confidence}) wins`
    }
  }

  /**
   * Resolve overlap by merging content
   */
  private resolveOverlap(item1: KnowledgeItem, item2: KnowledgeItem): ConflictResolution {
    // Simply keep both but note the overlap
    return {
      strategy: 'merge',
      winningItem: item1.id,
      reasoning: 'Items overlap but both retained for completeness',
      mergedContent: `${item1.content}\n[ALTERNATIVE] ${item2.content}`
    }
  }

  /**
   * Deduplicate knowledge base
   */
  private async deduplicateKnowledge(): Promise<Map<string, KnowledgeItem>> {
    const deduplicated = new Map<string, KnowledgeItem>()
    const processed = new Set<string>()

    for (const [id, item] of this.knowledgeBase) {
      if (processed.has(id)) continue

      let isDuplicate = false
      for (const [existingId, existing] of deduplicated) {
        const similarity = this.calculateContentSimilarity(item.content, existing.content)
        if (similarity > this.config.deduplicationThreshold) {
          isDuplicate = true
          processed.add(id)
          break
        }
      }

      if (!isDuplicate) {
        deduplicated.set(id, item)
        processed.add(id)
      }
    }

    this.knowledgeBase = deduplicated
    return deduplicated
  }

  /**
   * Build knowledge graph from fused knowledge
   */
  private async buildKnowledgeGraph(): Promise<KnowledgeGraph> {
    const nodes: KnowledgeNode[] = []
    const edges: KnowledgeEdge[] = []

    for (const [id, item] of this.knowledgeBase) {
      // Add node
      nodes.push({
        id,
        label: item.content.slice(0, 100),
        type: item.type,
        confidence: this.calculateWeightedConfidence(item),
        sources: [item.source.name]
      })

      // Add edges from relationships
      for (const rel of item.relationships) {
        if (this.knowledgeBase.has(rel.targetId)) {
          edges.push({
            from: id,
            to: rel.targetId,
            type: rel.type,
            strength: rel.strength
          })
        }
      }
    }

    return { nodes, edges }
  }

  /**
   * Calculate weighted confidence based on source reliability and freshness
   */
  private calculateWeightedConfidence(item: KnowledgeItem): number {
    let confidence = item.confidence

    if (this.config.weightByReliability) {
      confidence *= item.source.reliability
    }

    if (this.config.weightByFreshness) {
      const ageDays = (Date.now() - item.timestamp.getTime()) / (1000 * 60 * 60 * 24)
      const freshnessFactor = Math.max(0.1, 1 - (ageDays / 365)) // Decay over a year
      confidence *= freshnessFactor
    }

    return confidence
  }

  /**
   * Calculate content similarity
   */
  private calculateContentSimilarity(content1: string, content2: string): number {
    const words1 = new Set(content1.toLowerCase().split(/\s+/))
    const words2 = new Set(content2.toLowerCase().split(/\s+/))

    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])

    return intersection.size / union.size // Jaccard similarity
  }

  /**
   * Calculate cosine similarity between embeddings
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  /**
   * Query fused knowledge
   */
  async query(query: string, limit: number = 10): Promise<KnowledgeItem[]> {
    await this.init()

    const queryWords = new Set(query.toLowerCase().split(/\s+/))
    const scored: Array<{ item: KnowledgeItem; score: number }> = []

    for (const item of this.knowledgeBase.values()) {
      const itemWords = new Set(item.content.toLowerCase().split(/\s+/))
      const overlap = new Set([...queryWords].filter(x => itemWords.has(x)))
      const score = overlap.size / Math.max(queryWords.size, 1)
      
      if (score > 0) {
        scored.push({ item, score: score * this.calculateWeightedConfidence(item) })
      }
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.item)
  }

  /**
   * Get knowledge by type
   */
  getByType(type: KnowledgeType): KnowledgeItem[] {
    return Array.from(this.knowledgeBase.values())
      .filter(item => item.type === type)
  }

  /**
   * Get knowledge by source
   */
  getBySource(sourceId: string): KnowledgeItem[] {
    return Array.from(this.knowledgeBase.values())
      .filter(item => item.source.id === sourceId)
  }

  /**
   * Get all conflicts
   */
  getConflicts(): FusionConflict[] {
    return this.conflicts
  }

  /**
   * Get statistics
   */
  getStatistics(): FusionStatistics {
    const items = Array.from(this.knowledgeBase.values())
    const coverageBySource: Record<string, number> = {}

    for (const [sourceId] of this.sources) {
      const count = items.filter(item => item.source.id === sourceId).length
      coverageBySource[sourceId] = items.length > 0 ? count / items.length : 0
    }

    return {
      totalInputs: items.length,
      duplicatesRemoved: 0,
      conflictsDetected: this.conflicts.length,
      conflictsResolved: this.conflicts.filter(c => c.resolution).length,
      finalCount: items.length,
      averageConfidence: items.length > 0 
        ? items.reduce((sum, item) => sum + this.calculateWeightedConfidence(item), 0) / items.length 
        : 0,
      coverageBySource
    }
  }

  /**
   * Clear knowledge base
   */
  clear(): void {
    this.knowledgeBase.clear()
    this.conflicts = []
  }

  /**
   * Export knowledge base
   */
  export(): { items: KnowledgeItem[]; sources: KnowledgeSource[] } {
    return {
      items: Array.from(this.knowledgeBase.values()),
      sources: Array.from(this.sources.values())
    }
  }

  /**
   * Import knowledge base
   */
  async import(data: { items: KnowledgeItem[]; sources: KnowledgeSource[] }): Promise<void> {
    for (const source of data.sources) {
      this.sources.set(source.id, source)
    }
    await this.addKnowledge(data.items)
  }
}

// Singleton
let fusionEngineInstance: KnowledgeFusionEngine | null = null

export function getKnowledgeFusionEngine(config?: Partial<FusionConfig>): KnowledgeFusionEngine {
  if (!fusionEngineInstance) {
    fusionEngineInstance = new KnowledgeFusionEngine(config)
  }
  return fusionEngineInstance
}

/**
 * Quick fusion function
 */
export async function fuseKnowledge(
  items: KnowledgeItem[],
  config?: Partial<FusionConfig>
): Promise<FusionResult> {
  const engine = new KnowledgeFusionEngine(config)
  await engine.addKnowledge(items)
  return engine.fuse()
}
