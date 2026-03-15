/**
 * Context Expansion Trigger - Mechanism #40
 * 
 * Determines when additional context is needed and triggers
 * intelligent context expansion to improve AI reasoning quality.
 * 
 * Features:
 * - Automatic context need detection
 * - Multi-source context expansion
 * - Token budget optimization
 * - Quality-based triggers
 * - Context expansion strategies
 */

import ZAI from 'z-ai-web-dev-sdk'

// Types
export interface ExpansionTrigger {
  type: TriggerType
  confidence: number
  reason: string
  suggestedSources: ContextSource[]
  priority: 'high' | 'medium' | 'low'
}

export type TriggerType = 
  | 'insufficient_context'   // Not enough information
  | 'ambiguity_detected'      // Multiple interpretations
  | 'domain_knowledge_needed' // Domain-specific context
  | 'code_context_missing'    // Missing code references
  | 'dependency_context'      // Need dependency info
  | 'error_context'           // Need error context
  | 'user_intent_unclear'     // Need clarification
  | 'cross_reference_needed'  // Need linked context
  | 'temporal_context'        // Need time-based context
  | 'constraint_violation'    // Need constraint context

export interface ContextSource {
  type: SourceType
  identifier: string
  priority: number
  estimatedTokens: number
  relevanceScore: number
}

export type SourceType = 
  | 'file'
  | 'function'
  | 'class'
  | 'module'
  | 'documentation'
  | 'api_reference'
  | 'error_log'
  | 'dependency'
  | 'git_history'
  | 'test_file'
  | 'config'
  | 'external_doc'

export interface ExpansionResult {
  triggered: boolean
  triggers: ExpansionTrigger[]
  expandedContext: ContextChunk[]
  totalTokensAdded: number
  expansionStrategy: ExpansionStrategy
  qualityImprovement: number
}

export interface ContextChunk {
  id: string
  source: ContextSource
  content: string
  tokens: number
  relevance: number
  addedAt: Date
}

export type ExpansionStrategy = 
  | 'incremental'     // Add small chunks
  | 'comprehensive'   // Add all relevant context
  | 'targeted'        // Add specific context
  | 'progressive'     // Gradually expand
  | 'adaptive'        // Based on need

export interface TriggerConfig {
  minConfidence: number
  maxExpansionTokens: number
  enableAutoExpansion: boolean
  triggerThresholds: TriggerThresholds
}

export interface TriggerThresholds {
  contextCoverageMin: number // Minimum context coverage
  ambiguityMax: number        // Maximum ambiguity before trigger
  domainDepthMin: number      // Minimum domain knowledge depth
  codeContextMin: number      // Minimum code context
}

const DEFAULT_CONFIG: TriggerConfig = {
  minConfidence: 0.5,
  maxExpansionTokens: 4000,
  enableAutoExpansion: true,
  triggerThresholds: {
    contextCoverageMin: 0.6,
    ambiguityMax: 0.5,
    domainDepthMin: 0.4,
    codeContextMin: 0.5
  }
}

/**
 * Context Expansion Trigger
 */
export class ContextExpansionTriggerEngine {
  private zai: any = null
  private currentContext: ContextChunk[] = []
  private triggerHistory: ExpansionTrigger[] = []
  private config: TriggerConfig
  private strategy: ExpansionStrategy = 'adaptive'
  private initialized = false

  constructor(config?: Partial<TriggerConfig>) {
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
   * Set current context
   */
  setContext(chunks: ContextChunk[]): void {
    this.currentContext = chunks
  }

  /**
   * Add context chunk
   */
  addContext(chunk: ContextChunk): void {
    this.currentContext.push(chunk)
  }

  /**
   * Analyze if expansion is needed
   */
  async analyzeNeeds(query: string, task: string): Promise<ExpansionTrigger[]> {
    await this.init()

    const triggers: ExpansionTrigger[] = []

    // Check for insufficient context
    const coverageTrigger = await this.checkContextCoverage(query)
    if (coverageTrigger) triggers.push(coverageTrigger)

    // Check for ambiguity
    const ambiguityTrigger = await this.checkAmbiguity(query)
    if (ambiguityTrigger) triggers.push(ambiguityTrigger)

    // Check for domain knowledge needs
    const domainTrigger = await this.checkDomainKnowledge(query, task)
    if (domainTrigger) triggers.push(domainTrigger)

    // Check for code context needs
    const codeTrigger = await this.checkCodeContext(query, task)
    if (codeTrigger) triggers.push(codeTrigger)

    // Check for dependency context
    const depTrigger = await this.checkDependencyContext(query)
    if (depTrigger) triggers.push(depTrigger)

    // Check for user intent clarity
    const intentTrigger = await this.checkUserIntent(query)
    if (intentTrigger) triggers.push(intentTrigger)

    // Store triggers in history
    this.triggerHistory.push(...triggers)

    return triggers
  }

  /**
   * Check context coverage
   */
  private async checkContextCoverage(query: string): Promise<ExpansionTrigger | null> {
    const queryWords = new Set(query.toLowerCase().split(/\s+/))
    
    // Calculate what percentage of query is covered by current context
    let coveredWords = 0
    for (const chunk of this.currentContext) {
      const chunkWords = new Set(chunk.content.toLowerCase().split(/\s+/))
      for (const word of queryWords) {
        if (chunkWords.has(word)) coveredWords++
      }
    }

    const coverage = coveredWords / (queryWords.size || 1)

    if (coverage < this.config.triggerThresholds.contextCoverageMin) {
      return {
        type: 'insufficient_context',
        confidence: 1 - coverage,
        reason: `Only ${(coverage * 100).toFixed(0)}% of query terms covered by context`,
        suggestedSources: this.suggestSourcesForQuery(query),
        priority: coverage < 0.3 ? 'high' : 'medium'
      }
    }

    return null
  }

  /**
   * Check for ambiguity
   */
  private async checkAmbiguity(query: string): Promise<ExpansionTrigger | null> {
    // Detect ambiguous terms
    const ambiguousPatterns = [
      /\b(it|this|that|these|those)\b/gi,
      /\b(something|anything|everything)\b/gi,
      /\b(fix|handle|process|manage)\b/gi,
      /\b(the problem|the issue|the error)\b/gi
    ]

    let ambiguityScore = 0
    for (const pattern of ambiguousPatterns) {
      const matches = query.match(pattern)
      if (matches) {
        ambiguityScore += matches.length * 0.1
      }
    }

    // Check if query is a question without specifics
    if (query.includes('?') && query.split(' ').length < 8) {
      ambiguityScore += 0.2
    }

    if (ambiguityScore > this.config.triggerThresholds.ambiguityMax) {
      return {
        type: 'ambiguity_detected',
        confidence: Math.min(ambiguityScore, 1),
        reason: 'Ambiguous terms detected in query',
        suggestedSources: [
          { type: 'documentation', identifier: 'project_context', priority: 0.8, estimatedTokens: 500, relevanceScore: 0.7 }
        ],
        priority: 'medium'
      }
    }

    return null
  }

  /**
   * Check for domain knowledge needs
   */
  private async checkDomainKnowledge(
    query: string, 
    task: string
  ): Promise<ExpansionTrigger | null> {
    // Detect domain-specific terms
    const domainKeywords: Record<string, string[]> = {
      'security': ['auth', 'login', 'password', 'token', 'session', 'encrypt', 'secure'],
      'database': ['query', 'table', 'schema', 'migration', 'sql', 'nosql', 'model'],
      'api': ['endpoint', 'route', 'request', 'response', 'api', 'rest', 'graphql'],
      'frontend': ['component', 'render', 'state', 'props', 'hook', 'ui', 'css'],
      'testing': ['test', 'spec', 'coverage', 'mock', 'assert', 'jest', 'vitest']
    }

    const queryLower = query.toLowerCase()
    const taskLower = task.toLowerCase()
    const detectedDomains: string[] = []

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(kw => queryLower.includes(kw) || taskLower.includes(kw))) {
        detectedDomains.push(domain)
      }
    }

    // Check if current context has domain depth
    const domainContextExists = this.currentContext.some(chunk =>
      detectedDomains.some(domain => 
        chunk.content.toLowerCase().includes(domain)
      )
    )

    if (detectedDomains.length > 0 && !domainContextExists) {
      return {
        type: 'domain_knowledge_needed',
        confidence: 0.8,
        reason: `Domain knowledge needed for: ${detectedDomains.join(', ')}`,
        suggestedSources: detectedDomains.map(domain => ({
          type: 'documentation' as SourceType,
          identifier: `${domain}_docs`,
          priority: 0.9,
          estimatedTokens: 800,
          relevanceScore: 0.85
        })),
        priority: 'high'
      }
    }

    return null
  }

  /**
   * Check for code context needs
   */
  private async checkCodeContext(
    query: string, 
    task: string
  ): Promise<ExpansionTrigger | null> {
    // Detect code-related requests
    const codePatterns = [
      /function\s+\w+/gi,
      /class\s+\w+/gi,
      /import\s+.*from/gi,
      /\w+\.\w+\(/gi, // Method calls
      /const\s+\w+/gi,
      /interface\s+\w+/gi
    ]

    let hasCodeReference = false
    for (const pattern of codePatterns) {
      if (pattern.test(query) || pattern.test(task)) {
        hasCodeReference = true
        break
      }
    }

    // Check if code context exists
    const codeContextExists = this.currentContext.some(chunk =>
      chunk.source.type === 'file' || 
      chunk.source.type === 'function' ||
      chunk.source.type === 'class'
    )

    if (hasCodeReference && !codeContextExists) {
      return {
        type: 'code_context_missing',
        confidence: 0.9,
        reason: 'Query references code but no code context available',
        suggestedSources: [
          { type: 'file', identifier: 'relevant_files', priority: 0.95, estimatedTokens: 1500, relevanceScore: 0.9 }
        ],
        priority: 'high'
      }
    }

    return null
  }

  /**
   * Check for dependency context needs
   */
  private async checkDependencyContext(query: string): Promise<ExpansionTrigger | null> {
    // Detect package/library references
    const packagePatterns = [
      /from\s+['"]([^'"]+)['"]/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      /import\s+.*from\s+['"]([^'"]+)['"]/g,
      /npm\s+install\s+(\S+)/gi,
      /yarn\s+add\s+(\S+)/gi
    ]

    const mentionedPackages: string[] = []
    for (const pattern of packagePatterns) {
      const matches = query.matchAll(pattern)
      for (const match of matches) {
        if (match[1] && !mentionedPackages.includes(match[1])) {
          mentionedPackages.push(match[1])
        }
      }
    }

    // Check if dependency context exists
    const depContextExists = this.currentContext.some(chunk =>
      chunk.source.type === 'dependency'
    )

    if (mentionedPackages.length > 0 && !depContextExists) {
      return {
        type: 'dependency_context',
        confidence: 0.85,
        reason: `Dependencies mentioned: ${mentionedPackages.join(', ')}`,
        suggestedSources: mentionedPackages.map(pkg => ({
          type: 'dependency' as SourceType,
          identifier: pkg,
          priority: 0.8,
          estimatedTokens: 400,
          relevanceScore: 0.85
        })),
        priority: 'medium'
      }
    }

    return null
  }

  /**
   * Check user intent clarity
   */
  private async checkUserIntent(query: string): Promise<ExpansionTrigger | null> {
    // Very short queries often need expansion
    if (query.split(' ').length < 4) {
      return {
        type: 'user_intent_unclear',
        confidence: 0.6,
        reason: 'Query is too short to determine clear intent',
        suggestedSources: [
          { type: 'documentation', identifier: 'project_overview', priority: 0.7, estimatedTokens: 300, relevanceScore: 0.6 }
        ],
        priority: 'low'
      }
    }

    // Queries with multiple action verbs might need clarification
    const actionVerbs = ['create', 'update', 'delete', 'fix', 'add', 'remove', 'modify', 'implement']
    const foundActions = actionVerbs.filter(verb => 
      query.toLowerCase().includes(verb)
    )

    if (foundActions.length > 2) {
      return {
        type: 'user_intent_unclear',
        confidence: 0.5,
        reason: 'Multiple action verbs detected, intent may be unclear',
        suggestedSources: [
          { type: 'documentation', identifier: 'task_context', priority: 0.6, estimatedTokens: 200, relevanceScore: 0.5 }
        ],
        priority: 'low'
      }
    }

    return null
  }

  /**
   * Suggest sources for query
   */
  private suggestSourcesForQuery(query: string): ContextSource[] {
    const sources: ContextSource[] = []

    // Detect file references
    const fileMatch = query.match(/(\w+\.\w+)/g)
    if (fileMatch) {
      sources.push(...fileMatch.map(file => ({
        type: 'file' as SourceType,
        identifier: file,
        priority: 0.9,
        estimatedTokens: 500,
        relevanceScore: 0.9
      })))
    }

    // Add documentation source
    sources.push({
      type: 'documentation',
      identifier: 'relevant_docs',
      priority: 0.7,
      estimatedTokens: 600,
      relevanceScore: 0.75
    })

    // Add API reference if detected
    if (query.toLowerCase().includes('api') || query.toLowerCase().includes('endpoint')) {
      sources.push({
        type: 'api_reference',
        identifier: 'api_docs',
        priority: 0.85,
        estimatedTokens: 400,
        relevanceScore: 0.85
      })
    }

    return sources
  }

  /**
   * Execute context expansion
   */
  async expandContext(
    triggers: ExpansionTrigger[],
    contextRetriever: (source: ContextSource) => Promise<string | null>
  ): Promise<ExpansionResult> {
    if (!this.config.enableAutoExpansion) {
      return {
        triggered: false,
        triggers,
        expandedContext: [],
        totalTokensAdded: 0,
        expansionStrategy: this.strategy,
        qualityImprovement: 0
      }
    }

    // Prioritize triggers
    const prioritizedTriggers = triggers.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    const expandedContext: ContextChunk[] = []
    let totalTokens = 0

    for (const trigger of prioritizedTriggers) {
      if (totalTokens >= this.config.maxExpansionTokens) break

      for (const source of trigger.suggestedSources) {
        if (totalTokens + source.estimatedTokens > this.config.maxExpansionTokens) continue

        try {
          const content = await contextRetriever(source)
          if (content) {
            const chunk: ContextChunk = {
              id: `chunk_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              source,
              content,
              tokens: this.estimateTokens(content),
              relevance: source.relevanceScore,
              addedAt: new Date()
            }

            expandedContext.push(chunk)
            totalTokens += chunk.tokens
            this.currentContext.push(chunk)
          }
        } catch (error) {
          console.error(`Failed to retrieve context from ${source.identifier}:`, error)
        }
      }
    }

    // Calculate quality improvement estimate
    const qualityImprovement = this.estimateQualityImprovement(triggers, expandedContext)

    return {
      triggered: expandedContext.length > 0,
      triggers,
      expandedContext,
      totalTokensAdded: totalTokens,
      expansionStrategy: this.strategy,
      qualityImprovement
    }
  }

  /**
   * Estimate tokens for content
   */
  private estimateTokens(content: string): number {
    // Rough approximation: ~4 characters per token
    return Math.ceil(content.length / 4)
  }

  /**
   * Estimate quality improvement
   */
  private estimateQualityImprovement(
    triggers: ExpansionTrigger[],
    expandedContext: ContextChunk[]
  ): number {
    if (triggers.length === 0) return 0

    // Average trigger confidence weighted by expansion relevance
    const avgConfidence = triggers.reduce((sum, t) => sum + t.confidence, 0) / triggers.length
    const avgRelevance = expandedContext.length > 0
      ? expandedContext.reduce((sum, c) => sum + c.relevance, 0) / expandedContext.length
      : 0

    return (avgConfidence + avgRelevance) / 2
  }

  /**
   * Set expansion strategy
   */
  setStrategy(strategy: ExpansionStrategy): void {
    this.strategy = strategy
  }

  /**
   * Get current context
   */
  getContext(): ContextChunk[] {
    return this.currentContext
  }

  /**
   * Get trigger history
   */
  getTriggerHistory(): ExpansionTrigger[] {
    return this.triggerHistory
  }

  /**
   * Clear context and history
   */
  clear(): void {
    this.currentContext = []
    this.triggerHistory = []
  }

  /**
   * Get context statistics
   */
  getStatistics(): {
    totalChunks: number
    totalTokens: number
    bySource: Record<SourceType, number>
    avgRelevance: number
  } {
    const bySource: Record<SourceType, number> = {} as Record<SourceType, number>
    let totalTokens = 0
    let totalRelevance = 0

    for (const chunk of this.currentContext) {
      bySource[chunk.source.type] = (bySource[chunk.source.type] || 0) + 1
      totalTokens += chunk.tokens
      totalRelevance += chunk.relevance
    }

    return {
      totalChunks: this.currentContext.length,
      totalTokens,
      bySource,
      avgRelevance: this.currentContext.length > 0 
        ? totalRelevance / this.currentContext.length 
        : 0
    }
  }
}

// Singleton
let expansionTriggerInstance: ContextExpansionTriggerEngine | null = null

export function getContextExpansionTrigger(
  config?: Partial<TriggerConfig>
): ContextExpansionTriggerEngine {
  if (!expansionTriggerInstance) {
    expansionTriggerInstance = new ContextExpansionTriggerEngine(config)
  }
  return expansionTriggerInstance
}

/**
 * Quick context expansion check
 */
export async function checkContextExpansion(
  query: string,
  task: string,
  currentContext: string[]
): Promise<ExpansionTrigger[]> {
  const engine = new ContextExpansionTriggerEngine()
  await engine.init()
  
  engine.setContext(currentContext.map((content, i) => ({
    id: `ctx_${i}`,
    source: { type: 'file', identifier: `context_${i}`, priority: 0.5, estimatedTokens: content.length / 4, relevanceScore: 0.5 },
    content,
    tokens: Math.ceil(content.length / 4),
    relevance: 0.5,
    addedAt: new Date()
  })))

  return engine.analyzeNeeds(query, task)
}
