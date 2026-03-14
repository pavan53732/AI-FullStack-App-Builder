/**
 * Query Rewriter
 * 
 * Expands and rewrites queries for better retrieval:
 * - Query expansion with synonyms and related terms
 * - Query decomposition for complex queries
 * - Query simplification for ambiguous queries
 * - Spelling correction
 * - Query intent detection
 * 
 * Features:
 * - Multi-strategy query rewriting
 * - Synonym expansion
 * - Technical term handling
 * - Framework-specific query enhancement
 * - Query difficulty estimation
 */

import ZAI from 'z-ai-web-dev-sdk'

// Types
export interface OriginalQuery {
  text: string
  language?: string
  context?: QueryContext
}

export interface QueryContext {
  framework?: string
  targetLanguage?: string
  previousQueries?: string[]
  userIntent?: string
  domain?: string
  codeSnippet?: string
  error?: string
}

export interface RewrittenQuery {
  original: string
  rewritten: string
  expansions: QueryExpansion[]
  decompositions: QueryDecomposition[]
  strategy: RewriteStrategy
  confidence: number
  metadata: QueryMetadata
}

export interface QueryExpansion {
  term: string
  synonyms: string[]
  related: string[]
  technical: string[]
}

export interface QueryDecomposition {
  subQuery: string
  intent: string
  priority: number
  dependencies: string[]
}

export interface QueryMetadata {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  specificity: number
  ambiguity: number
  technicality: number
  estimatedResults: number
  suggestedSources: string[]
}

export type RewriteStrategy = 
  | 'expand'
  | 'decompose'
  | 'simplify'
  | 'correct'
  | 'enhance'
  | 'hybrid'
  | 'technical'

export interface RewriteOptions {
  strategies?: RewriteStrategy[]
  maxExpansions?: number
  maxDecompositions?: number
  preserveOriginal?: boolean
  includeMetadata?: boolean
  enhanceTechnical?: boolean
}

// Technical term mappings
const TECHNICAL_TERMS: Record<string, string[]> = {
  // Web Development
  'api': ['interface', 'endpoint', 'rest', 'graphql', 'http'],
  'component': ['widget', 'element', 'module', 'ui', 'view'],
  'hook': ['lifecycle', 'effect', 'state', 'callback', 'react hook'],
  'state': ['data', 'store', 'context', 'redux', 'zustand'],
  'prop': ['property', 'attribute', 'parameter', 'argument'],
  
  // Database
  'query': ['sql', 'find', 'filter', 'search', 'select'],
  'migration': ['schema', 'database change', 'alter', 'upgrade'],
  'model': ['schema', 'entity', 'table', 'document'],
  'orm': ['prisma', 'sequelize', 'typeorm', 'drizzle'],
  
  // Frontend
  'css': ['style', 'stylesheet', 'tailwind', 'styling'],
  'responsive': ['mobile', 'adaptive', 'breakpoint', 'media query'],
  'animation': ['transition', 'motion', 'framer', 'css animation'],
  
  // Backend
  'middleware': ['interceptor', 'filter', 'handler', 'plugin'],
  'auth': ['authentication', 'login', 'jwt', 'session', 'oauth'],
  'api route': ['endpoint', 'handler', 'controller', 'server function'],
  
  // Testing
  'test': ['spec', 'unit test', 'integration', 'e2e', 'vitest', 'jest'],
  'mock': ['stub', 'fake', 'spy', 'double'],
  
  // Build
  'bundle': ['pack', 'build', 'compile', 'webpack', 'vite'],
  'deploy': ['publish', 'release', 'ship', 'ci/cd']
}

// Framework-specific enhancements
const FRAMEWORK_ENHANCEMENTS: Record<string, Record<string, string[]>> = {
  'react': {
    'state': ['useState', 'useReducer', 'context'],
    'effect': ['useEffect', 'useLayoutEffect', 'useCallback'],
    'form': ['controlled component', 'uncontrolled component', 'react-hook-form'],
    'routing': ['react-router', 'next.js router', 'navigation']
  },
  'next.js': {
    'page': ['app router', 'page router', 'route handler'],
    'api': ['api route', 'route handler', 'server action'],
    'data': ['server component', 'client component', 'fetching'],
    'image': ['next/image', 'image optimization', 'loader']
  },
  'vue': {
    'state': ['ref', 'reactive', 'pinia', 'vuex'],
    'component': ['sfc', 'setup', 'composition api'],
    'directive': ['v-bind', 'v-on', 'v-model', 'v-if']
  },
  'tailwind': {
    'style': ['utility class', 'responsive', 'dark mode'],
    'layout': ['flex', 'grid', 'container', 'spacing'],
    'color': ['text color', 'background', 'border']
  }
}

/**
 * Query Rewriter
 * 
 * Main class for rewriting and expanding queries
 */
export class QueryRewriter {
  private zai: any = null
  private expansionCache: Map<string, QueryExpansion> = new Map()
  private decompositionCache: Map<string, QueryDecomposition[]> = new Map()

  /**
   * Initialize the rewriter
   */
  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
  }

  /**
   * Rewrite a query
   */
  async rewrite(
    query: OriginalQuery,
    options: RewriteOptions = {}
  ): Promise<RewrittenQuery> {
    const strategies = options.strategies || ['hybrid']
    const maxExpansions = options.maxExpansions || 5
    const maxDecompositions = options.maxDecompositions || 3

    let rewrittenText = query.text
    const expansions: QueryExpansion[] = []
    const decompositions: QueryDecomposition[] = []

    for (const strategy of strategies) {
      switch (strategy) {
        case 'expand':
          const expanded = await this.expandQuery(query.text, maxExpansions)
          expansions.push(...expanded)
          break

        case 'decompose':
          const decomposed = await this.decomposeQuery(query.text, maxDecompositions)
          decompositions.push(...decomposed)
          break

        case 'simplify':
          rewrittenText = await this.simplifyQuery(query.text)
          break

        case 'correct':
          rewrittenText = await this.correctQuery(query.text)
          break

        case 'enhance':
          rewrittenText = await this.enhanceQuery(query.text, query.context)
          break

        case 'technical':
          const techExpanded = await this.expandTechnicalTerms(query.text)
          expansions.push(...techExpanded)
          break

        case 'hybrid':
        default:
          const hybridResult = await this.hybridRewrite(query, options)
          return hybridResult
      }
    }

    // Build metadata
    const metadata = await this.buildMetadata(query.text, query.context)

    return {
      original: query.text,
      rewritten: rewrittenText,
      expansions,
      decompositions,
      strategy: strategies[0],
      confidence: this.calculateConfidence(rewrittenText, query.text),
      metadata
    }
  }

  /**
   * Expand query with synonyms and related terms
   */
  private async expandQuery(
    query: string,
    maxExpansions: number
  ): Promise<QueryExpansion[]> {
    const expansions: QueryExpansion[] = []
    const terms = query.toLowerCase().split(/\s+/)

    for (const term of terms) {
      // Check cache
      const cached = this.expansionCache.get(term)
      if (cached) {
        expansions.push(cached)
        continue
      }

      // Check technical terms
      const technical = TECHNICAL_TERMS[term]
      if (technical) {
        const expansion: QueryExpansion = {
          term,
          synonyms: technical.slice(0, 3),
          related: technical.slice(3),
          technical
        }
        this.expansionCache.set(term, expansion)
        expansions.push(expansion)
        continue
      }

      // Use AI for expansion
      if (this.zai && expansions.length < maxExpansions) {
        const aiExpansion = await this.aiExpandTerm(term)
        if (aiExpansion) {
          this.expansionCache.set(term, aiExpansion)
          expansions.push(aiExpansion)
        }
      }
    }

    return expansions.slice(0, maxExpansions)
  }

  /**
   * Expand technical terms
   */
  private async expandTechnicalTerms(query: string): Promise<QueryExpansion[]> {
    const expansions: QueryExpansion[] = []
    const terms = query.toLowerCase().split(/\s+/)

    for (const term of terms) {
      const technical = TECHNICAL_TERMS[term]
      if (technical) {
        expansions.push({
          term,
          synonyms: technical.slice(0, 3),
          related: technical.slice(3),
          technical
        })
      }
    }

    return expansions
  }

  /**
   * Decompose complex query into sub-queries
   */
  private async decomposeQuery(
    query: string,
    maxDecompositions: number
  ): Promise<QueryDecomposition[]> {
    // Check cache
    const cached = this.decompositionCache.get(query)
    if (cached) return cached

    const decompositions: QueryDecomposition[] = []

    // Detect complex patterns
    const patterns = [
      /how (?:do|can|to) i (.+?) (?:and|then) (.+)/i,
      /(.+?) (?:while|when|after) (.+)/i,
      /(.+?) (?:with|using) (.+)/i,
      /create (.+?) (?:that|which) (.+)/i
    ]

    for (const pattern of patterns) {
      const match = query.match(pattern)
      if (match) {
        match.slice(1).forEach((subQuery, index) => {
          if (subQuery && decompositions.length < maxDecompositions) {
            decompositions.push({
              subQuery: subQuery.trim(),
              intent: index === 0 ? 'primary' : 'secondary',
              priority: index + 1,
              dependencies: index > 0 ? [decompositions[0]?.subQuery || ''] : []
            })
          }
        })
        break
      }
    }

    // Use AI for complex decomposition
    if (decompositions.length === 0 && this.zai && query.split(' ').length > 10) {
      const aiDecomps = await this.aiDecompose(query, maxDecompositions)
      decompositions.push(...aiDecomps)
    }

    this.decompositionCache.set(query, decompositions)
    return decompositions
  }

  /**
   * Simplify ambiguous or complex query
   */
  private async simplifyQuery(query: string): Promise<string> {
    // Remove filler words
    const fillerWords = ['please', 'help', 'need', 'want', 'try', 'trying', 'just', 'basically', 'simply']
    let simplified = query

    for (const filler of fillerWords) {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi')
      simplified = simplified.replace(regex, '')
    }

    // Clean up
    simplified = simplified.replace(/\s+/g, ' ').trim()

    // If still complex, use AI
    if (simplified.split(' ').length > 15 && this.zai) {
      simplified = await this.aiSimplify(simplified)
    }

    return simplified || query
  }

  /**
   * Correct spelling and grammar
   */
  private async correctQuery(query: string): Promise<string> {
    if (!this.zai) return query

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { 
            role: 'system', 
            content: 'Correct spelling and grammar errors in the query. Return only the corrected query, nothing else.' 
          },
          { role: 'user', content: query }
        ],
        thinking: { type: 'disabled' }
      })

      return completion.choices[0]?.message?.content?.trim() || query
    } catch {
      return query
    }
  }

  /**
   * Enhance query with context
   */
  private async enhanceQuery(
    query: string,
    context?: QueryContext
  ): Promise<string> {
    if (!context) return query

    let enhanced = query

    // Add framework context
    if (context.framework) {
      const frameworkEnhancements = FRAMEWORK_ENHANCEMENTS[context.framework.toLowerCase()]
      if (frameworkEnhancements) {
        for (const [term, enhancements] of Object.entries(frameworkEnhancements)) {
          if (query.toLowerCase().includes(term)) {
            enhanced = `${enhanced} (${enhancements.join(' OR ')})`
            break
          }
        }
      }
    }

    // Add language context
    if (context.targetLanguage && !query.toLowerCase().includes(context.targetLanguage)) {
      enhanced = `${context.targetLanguage} ${enhanced}`
    }

    // Add error context
    if (context.error) {
      enhanced = `${enhanced} error:${context.error.substring(0, 50)}`
    }

    return enhanced
  }

  /**
   * Hybrid rewrite combining multiple strategies
   */
  private async hybridRewrite(
    query: OriginalQuery,
    options: RewriteOptions
  ): Promise<RewrittenQuery> {
    const maxExpansions = options.maxExpansions || 5
    const maxDecompositions = options.maxDecompositions || 3

    // Step 1: Correct spelling
    let corrected = await this.correctQuery(query.text)

    // Step 2: Simplify
    let simplified = await this.simplifyQuery(corrected)

    // Step 3: Expand
    const expansions = await this.expandQuery(simplified, maxExpansions)

    // Step 4: Technical expansion
    if (options.enhanceTechnical) {
      const techExpansions = await this.expandTechnicalTerms(simplified)
      expansions.push(...techExpansions)
    }

    // Step 5: Decompose if complex
    const decompositions = await this.decomposeQuery(simplified, maxDecompositions)

    // Step 6: Enhance with context
    const enhanced = await this.enhanceQuery(simplified, query.context)

    // Build rewritten query text with expansions
    const expansionTerms = expansions
      .flatMap(e => [...e.synonyms.slice(0, 2), ...e.related.slice(0, 1)])
      .filter(t => !enhanced.toLowerCase().includes(t.toLowerCase()))

    const finalRewritten = expansionTerms.length > 0
      ? `${enhanced} (${expansionTerms.slice(0, 5).join(' OR ')})`
      : enhanced

    const metadata = await this.buildMetadata(query.text, query.context)

    return {
      original: query.text,
      rewritten: finalRewritten,
      expansions,
      decompositions,
      strategy: 'hybrid',
      confidence: this.calculateConfidence(finalRewritten, query.text),
      metadata
    }
  }

  /**
   * AI-based term expansion
   */
  private async aiExpandTerm(term: string): Promise<QueryExpansion | null> {
    if (!this.zai) return null

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { 
            role: 'system', 
            content: `Expand this term with synonyms and related terms in JSON format:
{"synonyms": ["..."], "related": ["..."], "technical": ["..."]}` 
          },
          { role: 'user', content: term }
        ],
        thinking: { type: 'disabled' }
      })

      const response = completion.choices[0]?.message?.content || '{}'
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          term,
          synonyms: parsed.synonyms || [],
          related: parsed.related || [],
          technical: parsed.technical || []
        }
      }
    } catch {
      // Ignore errors
    }

    return null
  }

  /**
   * AI-based query decomposition
   */
  private async aiDecompose(
    query: string,
    maxDecompositions: number
  ): Promise<QueryDecomposition[]> {
    if (!this.zai) return []

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { 
            role: 'system', 
            content: `Decompose this complex query into sub-queries. Return JSON array:
[{"subQuery": "...", "intent": "...", "priority": 1, "dependencies": []}]` 
          },
          { role: 'user', content: query }
        ],
        thinking: { type: 'disabled' }
      })

      const response = completion.choices[0]?.message?.content || '[]'
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return parsed.slice(0, maxDecompositions)
      }
    } catch {
      // Ignore errors
    }

    return []
  }

  /**
   * AI-based query simplification
   */
  private async aiSimplify(query: string): Promise<string> {
    if (!this.zai) return query

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { 
            role: 'system', 
            content: 'Simplify this query to be more concise while preserving the core meaning. Return only the simplified query.' 
          },
          { role: 'user', content: query }
        ],
        thinking: { type: 'disabled' }
      })

      return completion.choices[0]?.message?.content?.trim() || query
    } catch {
      return query
    }
  }

  /**
   * Build query metadata
   */
  private async buildMetadata(
    query: string,
    context?: QueryContext
  ): Promise<QueryMetadata> {
    const words = query.split(/\s+/)
    const technicalTerms = words.filter(w => TECHNICAL_TERMS[w.toLowerCase()])

    // Estimate difficulty
    let difficulty: QueryMetadata['difficulty'] = 'easy'
    if (technicalTerms.length > 3 || words.length > 15) {
      difficulty = 'hard'
    } else if (technicalTerms.length > 1 || words.length > 8) {
      difficulty = 'medium'
    }
    if (context?.error || context?.codeSnippet) {
      difficulty = 'expert'
    }

    // Calculate specificity (how specific is the query)
    const specificity = Math.min(
      technicalTerms.length * 0.2 + 
      (query.includes('"') ? 0.2 : 0) +
      (/\d/.test(query) ? 0.1 : 0),
      1
    )

    // Calculate ambiguity
    const ambiguousTerms = ['thing', 'stuff', 'something', 'it', 'that', 'this']
    const ambiguity = words.filter(w => ambiguousTerms.includes(w.toLowerCase())).length / words.length

    // Estimate results
    const estimatedResults = Math.round(
      1000 * (1 - specificity) * (1 + technicalTerms.length * 0.5)
    )

    // Suggest sources
    const suggestedSources: string[] = []
    if (technicalTerms.some(t => ['api', 'endpoint', 'middleware'].includes(t.toLowerCase()))) {
      suggestedSources.push('official', 'github')
    }
    if (context?.error) {
      suggestedSources.push('stackoverflow')
    }
    if (technicalTerms.some(t => ['css', 'style', 'responsive'].includes(t.toLowerCase()))) {
      suggestedSources.push('mdn', 'tailwind')
    }
    if (suggestedSources.length === 0) {
      suggestedSources.push('official', 'npm', 'github')
    }

    return {
      difficulty,
      specificity,
      ambiguity,
      technicality: technicalTerms.length / words.length,
      estimatedResults,
      suggestedSources
    }
  }

  /**
   * Calculate confidence in rewrite
   */
  private calculateConfidence(rewritten: string, original: string): number {
    // Higher confidence if:
    // - Query was actually changed
    // - Technical terms were preserved
    // - Query is more specific

    const originalTerms = original.toLowerCase().split(/\s+/)
    const rewrittenTerms = rewritten.toLowerCase().split(/\s+/)

    // Check preservation of key terms
    const preservedTerms = originalTerms.filter(t => rewrittenTerms.includes(t))
    const preservationRatio = preservedTerms.length / originalTerms.length

    // Check for expansion
    const expansionRatio = rewrittenTerms.length / originalTerms.length

    // Check for technical term preservation
    const originalTechnical = originalTerms.filter(t => TECHNICAL_TERMS[t.toLowerCase()])
    const rewrittenTechnical = rewrittenTerms.filter(t => TECHNICAL_TERMS[t.toLowerCase()])
    const technicalPreservation = originalTechnical.length > 0
      ? rewrittenTechnical.length / originalTechnical.length
      : 1

    return (preservationRatio * 0.4 + 
            Math.min(expansionRatio, 1.5) / 1.5 * 0.3 + 
            technicalPreservation * 0.3)
  }

  /**
   * Generate alternative queries
   */
  async generateAlternatives(
    query: string,
    count: number = 3
  ): Promise<string[]> {
    const alternatives: string[] = []

    // Get base rewrite
    const rewritten = await this.rewrite({ text: query }, { strategies: ['expand'] })
    
    // Generate from expansions
    for (const expansion of rewritten.expansions.slice(0, count)) {
      const alt = query.replace(
        new RegExp(expansion.term, 'i'),
        expansion.synonyms[0] || expansion.related[0] || expansion.term
      )
      if (alt !== query) {
        alternatives.push(alt)
      }
    }

    // Generate from decomposition
    if (rewritten.decompositions.length > 0) {
      alternatives.push(...rewritten.decompositions.map(d => d.subQuery))
    }

    return alternatives.slice(0, count)
  }

  /**
   * Clear caches
   */
  clearCache(): void {
    this.expansionCache.clear()
    this.decompositionCache.clear()
  }
}

// Singleton instance
let rewriterInstance: QueryRewriter | null = null

export function getQueryRewriter(): QueryRewriter {
  if (!rewriterInstance) {
    rewriterInstance = new QueryRewriter()
  }
  return rewriterInstance
}

export async function rewriteQuery(
  query: OriginalQuery,
  options?: RewriteOptions
): Promise<RewrittenQuery> {
  const rewriter = getQueryRewriter()
  if (!rewriter['zai']) {
    await rewriter.initialize()
  }
  return rewriter.rewrite(query, options)
}
