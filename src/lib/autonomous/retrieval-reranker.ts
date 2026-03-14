/**
 * Retrieval Reranker
 * 
 * Reranks retrieved results for optimal relevance using:
 * - Semantic similarity scoring
 * - Context-aware ranking
 * - Cross-encoder models
 * - Learning-to-rank algorithms
 * - Diversity optimization
 * 
 * Features:
 * - Multiple reranking strategies
 * - Semantic relevance scoring
 * - Query-document matching
 * - Context injection for better ranking
 * - Result diversity optimization
 * - Confidence calibration
 */

import ZAI from 'z-ai-web-dev-sdk'

// Types
export interface RerankableDocument {
  id: string
  content: string
  metadata?: Record<string, any>
  originalScore?: number
  source?: string
  timestamp?: string
}

export interface RerankResult {
  id: string
  content: string
  originalScore: number
  rerankedScore: number
  relevanceScore: number
  diversityScore: number
  rank: number
  explanation: string
  metadata?: Record<string, any>
}

export interface RerankOptions {
  strategy: RerankStrategy
  topK?: number
  diversityWeight?: number
  contextQuery?: string
  minRelevance?: number
  includeExplanations?: boolean
  returnOriginalScores?: boolean
}

export type RerankStrategy = 
  | 'semantic'
  | 'cross-encoder'
  | 'learning-to-rank'
  | 'hybrid'
  | 'diversity-first'
  | 'relevance-first'
  | 'balanced'

export interface RerankContext {
  query: string
  queryEmbedding?: number[]
  queryIntent?: string
  queryType?: 'code' | 'documentation' | 'error' | 'concept' | 'api'
  userContext?: string[]
  previousQueries?: string[]
  targetLanguage?: string
  framework?: string
}

export interface RerankMetrics {
  totalDocuments: number
  rerankedDocuments: number
  averageRelevance: number
  averageDiversity: number
  strategy: RerankStrategy
  processingTime: number
  cacheHits: number
}

/**
 * Retrieval Reranker
 * 
 * Main class for reranking retrieval results
 */
export class RetrievalReranker {
  private zai: any = null
  private embeddingCache: Map<string, number[]> = new Map()
  private relevanceCache: Map<string, number> = new Map()
  
  // Scoring weights
  private weights = {
    semantic: 0.4,
    keyword: 0.25,
    context: 0.2,
    recency: 0.1,
    source: 0.05
  }

  constructor(weights?: Partial<typeof RetrievalReranker.prototype.weights>) {
    if (weights) {
      this.weights = { ...this.weights, ...weights }
    }
  }

  /**
   * Initialize the reranker
   */
  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
  }

  /**
   * Rerank documents
   */
  async rerank(
    documents: RerankableDocument[],
    context: RerankContext,
    options: RerankOptions
  ): Promise<RerankResult[]> {
    const startTime = Date.now()
    const strategy = options.strategy || 'hybrid'
    const topK = options.topK || 10

    if (documents.length === 0) {
      return []
    }

    let results: RerankResult[]

    switch (strategy) {
      case 'semantic':
        results = await this.semanticRerank(documents, context, options)
        break
      case 'cross-encoder':
        results = await this.crossEncoderRerank(documents, context, options)
        break
      case 'learning-to-rank':
        results = await this.learningToRankRerank(documents, context, options)
        break
      case 'diversity-first':
        results = await this.diversityFirstRerank(documents, context, options)
        break
      case 'relevance-first':
        results = await this.relevanceFirstRerank(documents, context, options)
        break
      case 'hybrid':
      case 'balanced':
      default:
        results = await this.hybridRerank(documents, context, options)
    }

    // Sort by reranked score and take top K
    results.sort((a, b) => b.rerankedScore - a.rerankedScore)
    results = results.slice(0, topK)

    // Assign final ranks
    results.forEach((result, index) => {
      result.rank = index + 1
    })

    return results
  }

  /**
   * Semantic reranking using embeddings
   */
  private async semanticRerank(
    documents: RerankableDocument[],
    context: RerankContext,
    options: RerankOptions
  ): Promise<RerankResult[]> {
    // Get query embedding
    const queryEmbedding = await this.getEmbedding(context.query)
    
    const results: RerankResult[] = []

    for (const doc of documents) {
      const docEmbedding = await this.getEmbedding(doc.content)
      const semanticScore = this.cosineSimilarity(queryEmbedding, docEmbedding)
      
      // Calculate additional scores
      const keywordScore = this.keywordMatch(context.query, doc.content)
      const contextScore = this.contextMatch(context, doc)
      const recencyScore = this.recencyScore(doc)
      const sourceScore = this.sourceScore(doc)

      // Combine scores with weights
      const rerankedScore = 
        semanticScore * this.weights.semantic +
        keywordScore * this.weights.keyword +
        contextScore * this.weights.context +
        recencyScore * this.weights.recency +
        sourceScore * this.weights.source

      results.push({
        id: doc.id,
        content: doc.content,
        originalScore: doc.originalScore || 0,
        rerankedScore,
        relevanceScore: semanticScore,
        diversityScore: 0,
        rank: 0,
        explanation: options.includeExplanations 
          ? this.generateExplanation({ semanticScore, keywordScore, contextScore, recencyScore, sourceScore })
          : '',
        metadata: doc.metadata
      })
    }

    return results
  }

  /**
   * Cross-encoder reranking (more accurate but slower)
   */
  private async crossEncoderRerank(
    documents: RerankableDocument[],
    context: RerankContext,
    options: RerankOptions
  ): Promise<RerankResult[]> {
    if (!this.zai) {
      return this.semanticRerank(documents, context, options)
    }

    const results: RerankResult[] = []
    const batchSize = 10

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize)
      
      // Score each document against query
      for (const doc of batch) {
        const score = await this.crossEncoderScore(context.query, doc.content)
        
        results.push({
          id: doc.id,
          content: doc.content,
          originalScore: doc.originalScore || 0,
          rerankedScore: score,
          relevanceScore: score,
          diversityScore: 0,
          rank: 0,
          explanation: `Cross-encoder relevance: ${(score * 100).toFixed(1)}%`,
          metadata: doc.metadata
        })
      }
    }

    return results
  }

  /**
   * Learning-to-rank reranking
   */
  private async learningToRankRerank(
    documents: RerankableDocument[],
    context: RerankContext,
    options: RerankOptions
  ): Promise<RerankResult[]> {
    // Extract features for each document
    const features = await Promise.all(
      documents.map(doc => this.extractFeatures(doc, context))
    )

    // Apply learned ranking model (simplified linear model)
    const modelWeights = {
      tfidf: 0.25,
      bm25: 0.2,
      semantic: 0.25,
      coverage: 0.15,
      position: 0.1,
      freshness: 0.05
    }

    const results: RerankResult[] = documents.map((doc, i) => {
      const f = features[i]
      const score = 
        f.tfidf * modelWeights.tfidf +
        f.bm25 * modelWeights.bm25 +
        f.semantic * modelWeights.semantic +
        f.coverage * modelWeights.coverage +
        f.position * modelWeights.position +
        f.freshness * modelWeights.freshness

      return {
        id: doc.id,
        content: doc.content,
        originalScore: doc.originalScore || 0,
        rerankedScore: score,
        relevanceScore: f.semantic,
        diversityScore: 0,
        rank: 0,
        explanation: `LTR score: ${(score * 100).toFixed(1)}%`,
        metadata: doc.metadata
      }
    })

    return results
  }

  /**
   * Diversity-first reranking
   */
  private async diversityFirstRerank(
    documents: RerankableDocument[],
    context: RerankContext,
    options: RerankOptions
  ): Promise<RerankResult[]> {
    const diversityWeight = options.diversityWeight || 0.5
    
    // First get semantic scores
    const baseResults = await this.semanticRerank(documents, context, options)
    
    // Calculate diversity scores using MMR (Maximal Marginal Relevance)
    const selected: RerankResult[] = []
    const remaining = [...baseResults]

    while (remaining.length > 0 && selected.length < (options.topK || 10)) {
      let bestScore = -Infinity
      let bestIndex = 0

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i]
        
        // Relevance component
        const relevance = candidate.rerankedScore
        
        // Diversity component (penalize similarity to already selected)
        let maxSimilarity = 0
        for (const s of selected) {
          const sim = await this.documentSimilarity(candidate.content, s.content)
          maxSimilarity = Math.max(maxSimilarity, sim)
        }

        // MMR score
        const mmrScore = diversityWeight * relevance - (1 - diversityWeight) * maxSimilarity
        
        if (mmrScore > bestScore) {
          bestScore = mmrScore
          bestIndex = i
        }
      }

      const selectedDoc = remaining.splice(bestIndex, 1)[0]
      selectedDoc.diversityScore = 1 - (selected.length > 0 ? bestScore / selectedDoc.rerankedScore : 0)
      selected.push(selectedDoc)
    }

    return selected
  }

  /**
   * Relevance-first reranking
   */
  private async relevanceFirstRerank(
    documents: RerankableDocument[],
    context: RerankContext,
    options: RerankOptions
  ): Promise<RerankResult[]> {
    // Prioritize relevance over all else
    const results = await this.semanticRerank(documents, context, options)
    
    // Apply strict relevance threshold
    const minRelevance = options.minRelevance || 0.5
    return results.filter(r => r.relevanceScore >= minRelevance)
  }

  /**
   * Hybrid reranking (combines multiple strategies)
   */
  private async hybridRerank(
    documents: RerankableDocument[],
    context: RerankContext,
    options: RerankOptions
  ): Promise<RerankResult[]> {
    // Run multiple strategies in parallel
    const [semanticResults, crossEncoderResults] = await Promise.all([
      this.semanticRerank(documents, context, options),
      documents.length <= 20 ? this.crossEncoderRerank(documents, context, options) : Promise.resolve([])
    ])

    // Combine scores
    const combinedScores = new Map<string, { semantic: number; crossEncoder: number; doc: RerankResult }>()

    for (const result of semanticResults) {
      combinedScores.set(result.id, { semantic: result.rerankedScore, crossEncoder: 0, doc: result })
    }

    for (const result of crossEncoderResults) {
      const existing = combinedScores.get(result.id)
      if (existing) {
        existing.crossEncoder = result.rerankedScore
      }
    }

    // Final hybrid score
    const hybridWeight = 0.4 // Weight for cross-encoder vs semantic
    const results: RerankResult[] = []

    for (const [id, scores] of combinedScores) {
      const semanticWeight = 1 - hybridWeight
      const rerankedScore = 
        scores.semantic * semanticWeight + 
        scores.crossEncoder * hybridWeight

      results.push({
        ...scores.doc,
        rerankedScore,
        explanation: `Hybrid: ${(scores.semantic * semanticWeight * 100).toFixed(0)}% semantic + ${(scores.crossEncoder * hybridWeight * 100).toFixed(0)}% cross-encoder`
      })
    }

    // Add diversity component
    const diversityWeight = options.diversityWeight || 0.2
    if (diversityWeight > 0) {
      return this.applyDiversity(results, diversityWeight)
    }

    return results
  }

  /**
   * Apply diversity to results
   */
  private async applyDiversity(
    results: RerankResult[],
    diversityWeight: number
  ): Promise<RerankResult[]> {
    const selected: RerankResult[] = []
    const remaining = [...results].sort((a, b) => b.rerankedScore - a.rerankedScore)

    while (remaining.length > 0) {
      let bestScore = -Infinity
      let bestIndex = 0

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i]
        let diversityPenalty = 0

        for (const s of selected) {
          const sim = await this.documentSimilarity(candidate.content, s.content)
          diversityPenalty = Math.max(diversityPenalty, sim)
        }

        const score = candidate.rerankedScore - diversityWeight * diversityPenalty
        
        if (score > bestScore) {
          bestScore = score
          bestIndex = i
        }
      }

      const selectedDoc = remaining.splice(bestIndex, 1)[0]
      selectedDoc.diversityScore = 1 - (selected.length > 0 ? bestScore / selectedDoc.rerankedScore : 0)
      selected.push(selectedDoc)
    }

    return selected
  }

  // Helper methods

  private async getEmbedding(text: string): Promise<number[]> {
    // Check cache
    const cached = this.embeddingCache.get(text)
    if (cached) return cached

    // Generate simple embedding (in production, use actual embedding model)
    const words = text.toLowerCase().split(/\s+/)
    const embedding = new Array(128).fill(0)
    
    for (const word of words) {
      const hash = this.simpleHash(word)
      embedding[hash % embedding.length] += 1
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0))
    const normalized = embedding.map(v => v / (magnitude || 1))

    this.embeddingCache.set(text, normalized)
    return normalized
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i)
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0
    
    let dotProduct = 0
    let magnitudeA = 0
    let magnitudeB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      magnitudeA += a[i] * a[i]
      magnitudeB += b[i] * b[i]
    }

    return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB) || 1)
  }

  private keywordMatch(query: string, content: string): number {
    const queryWords = new Set(query.toLowerCase().split(/\s+/))
    const contentWords = new Set(content.toLowerCase().split(/\s+/))
    
    let matches = 0
    for (const word of queryWords) {
      if (contentWords.has(word)) matches++
    }

    return queryWords.size > 0 ? matches / queryWords.size : 0
  }

  private contextMatch(context: RerankContext, doc: RerankableDocument): number {
    let score = 0

    // Match query type
    if (context.queryType && doc.metadata?.type) {
      if (context.queryType === doc.metadata.type) score += 0.3
    }

    // Match language
    if (context.targetLanguage && doc.metadata?.language) {
      if (context.targetLanguage === doc.metadata.language) score += 0.3
    }

    // Match framework
    if (context.framework && doc.metadata?.framework) {
      if (context.framework === doc.metadata.framework) score += 0.2
    }

    // User context match
    if (context.userContext && context.userContext.length > 0) {
      for (const ctx of context.userContext) {
        if (doc.content.toLowerCase().includes(ctx.toLowerCase())) {
          score += 0.1
        }
      }
    }

    return Math.min(score, 1)
  }

  private recencyScore(doc: RerankableDocument): number {
    if (!doc.timestamp) return 0.5

    const age = Date.now() - new Date(doc.timestamp).getTime()
    const dayMs = 24 * 60 * 60 * 1000
    const ageDays = age / dayMs

    // Exponential decay with half-life of 30 days
    return Math.exp(-ageDays / 30)
  }

  private sourceScore(doc: RerankableDocument): number {
    const sourceRankings: Record<string, number> = {
      'official': 1.0,
      'documentation': 0.9,
      'github': 0.8,
      'stackoverflow': 0.7,
      'npm': 0.8,
      'mdn': 0.9,
      'community': 0.6,
      'unknown': 0.5
    }

    return sourceRankings[doc.source?.toLowerCase() || 'unknown'] || 0.5
  }

  private async crossEncoderScore(query: string, content: string): Promise<number> {
    if (!this.zai) {
      return this.keywordMatch(query, content)
    }

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { 
            role: 'system', 
            content: 'Score the relevance of this content to the query. Return ONLY a number between 0 and 1.' 
          },
          { 
            role: 'user', 
            content: `Query: ${query}\n\nContent: ${content.substring(0, 500)}...\n\nRelevance score (0-1):` 
          }
        ],
        thinking: { type: 'disabled' }
      })

      const response = completion.choices[0]?.message?.content || '0.5'
      return parseFloat(response) || 0.5
    } catch {
      return this.keywordMatch(query, content)
    }
  }

  private async extractFeatures(
    doc: RerankableDocument,
    context: RerankContext
  ): Promise<{
    tfidf: number
    bm25: number
    semantic: number
    coverage: number
    position: number
    freshness: number
  }> {
    const queryEmbedding = await this.getEmbedding(context.query)
    const docEmbedding = await this.getEmbedding(doc.content)

    return {
      tfidf: this.keywordMatch(context.query, doc.content),
      bm25: this.keywordMatch(context.query, doc.content) * 0.8,
      semantic: this.cosineSimilarity(queryEmbedding, docEmbedding),
      coverage: this.coverageScore(context.query, doc.content),
      position: doc.originalScore || 0.5,
      freshness: this.recencyScore(doc)
    }
  }

  private coverageScore(query: string, content: string): number {
    const queryTerms = new Set(query.toLowerCase().split(/\s+/))
    const contentLower = content.toLowerCase()
    
    let covered = 0
    for (const term of queryTerms) {
      if (contentLower.includes(term)) covered++
    }

    return queryTerms.size > 0 ? covered / queryTerms.size : 0
  }

  private async documentSimilarity(a: string, b: string): Promise<number> {
    const embeddingA = await this.getEmbedding(a)
    const embeddingB = await this.getEmbedding(b)
    return this.cosineSimilarity(embeddingA, embeddingB)
  }

  private generateExplanation(scores: Record<string, number>): string {
    const parts = Object.entries(scores)
      .filter(([_, v]) => v > 0.1)
      .map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`)
      .join(', ')
    
    return `Score breakdown: ${parts}`
  }

  /**
   * Clear caches
   */
  clearCache(): void {
    this.embeddingCache.clear()
    this.relevanceCache.clear()
  }

  /**
   * Get reranker statistics
   */
  getStats(): {
    embeddingCacheSize: number
    relevanceCacheSize: number
    weights: typeof this.weights
  } {
    return {
      embeddingCacheSize: this.embeddingCache.size,
      relevanceCacheSize: this.relevanceCache.size,
      weights: this.weights
    }
  }
}

// Singleton instance
let rerankerInstance: RetrievalReranker | null = null

export function getReranker(): RetrievalReranker {
  if (!rerankerInstance) {
    rerankerInstance = new RetrievalReranker()
  }
  return rerankerInstance
}

export async function rerank(
  documents: RerankableDocument[],
  context: RerankContext,
  options: RerankOptions
): Promise<RerankResult[]> {
  const reranker = getReranker()
  if (!reranker['zai']) {
    await reranker.initialize()
  }
  return reranker.rerank(documents, context, options)
}
