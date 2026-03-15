/**
 * Source Attribution Generator - Mechanism #57
 * 
 * Generates citations and attributions for AI outputs, tracking
 * where information came from and providing proper credit.
 * 
 * Features:
 * - Automatic source tracking
 * - Citation generation (multiple formats)
 * - Confidence-weighted attributions
 * - Provenance chains
 * - Verifiability scoring
 */

import ZAI from 'z-ai-web-dev-sdk'

// Types
export interface Source {
  id: string
  type: SourceType
  title: string
  url?: string
  author?: string
  date?: Date
  version?: string
  accessDate: Date
  reliability: number
  metadata: Record<string, any>
}

export type SourceType = 
  | 'documentation'
  | 'code'
  | 'api_reference'
  | 'tutorial'
  | 'paper'
  | 'book'
  | 'stackoverflow'
  | 'github'
  | 'npm_package'
  | 'internal_knowledge'
  | 'ai_generated'
  | 'user_input'

export interface Attribution {
  id: string
  source: Source
  relevanceScore: number // 0-1
  contributionType: ContributionType
  excerpt?: string
  location?: SourceLocation
  confidence: number
}

export type ContributionType = 
  | 'primary'       // Main source of information
  | 'supporting'    // Validates or supports main claim
  | 'contextual'    // Provides background context
  | 'derived'       // Information derived from this source
  | 'referenced'    // Directly referenced in output

export interface SourceLocation {
  lineStart?: number
  lineEnd?: number
  section?: string
  function?: string
  file?: string
  page?: number
}

export interface AttributionResult {
  attributions: Attribution[]
  citations: Citation[]
  provenanceChain: ProvenanceNode[]
  verifiabilityScore: number
  confidenceLevel: 'high' | 'medium' | 'low'
  disclaimer?: string
}

export interface Citation {
  format: CitationFormat
  text: string
  inText: string
  bibliography: string
}

export type CitationFormat = 
  | 'apa'
  | 'mla'
  | 'chicago'
  | 'ieee'
  | 'harvard'
  | 'vancouver'
  | 'inline'

export interface ProvenanceNode {
  id: string
  source: Source
  transformation: string // How the information was transformed
  children: string[] // Child node IDs
  parentIds: string[]
}

export interface AttributionConfig {
  defaultFormat: CitationFormat
  includeUrls: boolean
  includeDates: boolean
  minRelevanceScore: number
  maxAttributions: number
  generateFootnotes: boolean
  includeExcerpts: boolean
}

const DEFAULT_CONFIG: AttributionConfig = {
  defaultFormat: 'apa',
  includeUrls: true,
  includeDates: true,
  minRelevanceScore: 0.3,
  maxAttributions: 20,
  generateFootnotes: true,
  includeExcerpts: true
}

/**
 * Source Attribution Generator
 */
export class SourceAttributionGenerator {
  private zai: any = null
  private sources: Map<string, Source> = new Map()
  private attributions: Attribution[] = []
  private provenance: Map<string, ProvenanceNode> = new Map()
  private config: AttributionConfig
  private initialized = false

  constructor(config?: Partial<AttributionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Initialize the generator
   */
  async init(): Promise<void> {
    if (this.initialized) return
    this.zai = await ZAI.create()
    this.initialized = true
  }

  /**
   * Register a source
   */
  registerSource(source: Source): void {
    this.sources.set(source.id, source)
  }

  /**
   * Add attribution for content
   */
  addAttribution(attribution: Attribution): void {
    if (attribution.relevanceScore >= this.config.minRelevanceScore) {
      this.attributions.push(attribution)
      
      // Ensure source is registered
      if (!this.sources.has(attribution.source.id)) {
        this.sources.set(attribution.source.id, attribution.source)
      }
    }
  }

  /**
   * Generate attributions for AI output
   */
  async generateAttributions(
    output: string,
    inputContext: Array<{ content: string; source?: Source }>
  ): Promise<AttributionResult> {
    await this.init()

    // Clear previous attributions
    this.attributions = []

    // Analyze output and match to sources
    for (const context of inputContext) {
      if (!context.source) continue

      const relevanceScore = await this.calculateRelevance(output, context.content)
      
      if (relevanceScore >= this.config.minRelevanceScore) {
        const contributionType = await this.determineContributionType(output, context.content)
        const excerpt = this.findRelevantExcerpt(output, context.content)

        this.attributions.push({
          id: `attr_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          source: context.source,
          relevanceScore,
          contributionType,
          excerpt: this.config.includeExcerpts ? excerpt : undefined,
          confidence: context.source.reliability
        })
      }
    }

    // Sort by relevance and limit
    this.attributions.sort((a, b) => b.relevanceScore - a.relevanceScore)
    this.attributions = this.attributions.slice(0, this.config.maxAttributions)

    // Generate citations
    const citations = this.generateCitations()

    // Build provenance chain
    const provenanceChain = this.buildProvenanceChain()

    // Calculate verifiability score
    const verifiabilityScore = this.calculateVerifiabilityScore()

    // Determine confidence level
    const confidenceLevel = this.determineConfidenceLevel(verifiabilityScore)

    // Generate disclaimer if needed
    const disclaimer = this.generateDisclaimer(confidenceLevel)

    return {
      attributions: this.attributions,
      citations,
      provenanceChain,
      verifiabilityScore,
      confidenceLevel,
      disclaimer
    }
  }

  /**
   * Calculate relevance between output and source content
   */
  private async calculateRelevance(output: string, sourceContent: string): Promise<number> {
    // Simple keyword overlap
    const outputWords = new Set(output.toLowerCase().split(/\s+/))
    const sourceWords = new Set(sourceContent.toLowerCase().split(/\s+/))

    const intersection = new Set([...outputWords].filter(x => sourceWords.has(x)))
    const jaccardSimilarity = intersection.size / Math.max(outputWords.size, 1)

    // Use AI for semantic similarity if available
    try {
      const response = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'Rate how relevant the source content is to the output on a scale of 0-1. Respond with only a number.'
          },
          {
            role: 'user',
            content: `Output: ${output.slice(0, 500)}\n\nSource: ${sourceContent.slice(0, 500)}`
          }
        ],
        thinking: { type: 'disabled' }
      })

      const aiScore = parseFloat(response.choices[0]?.message?.content || '0')
      if (!isNaN(aiScore) && aiScore >= 0 && aiScore <= 1) {
        return (jaccardSimilarity + aiScore) / 2 // Blend both scores
      }
    } catch {}

    return jaccardSimilarity
  }

  /**
   * Determine type of contribution
   */
  private async determineContributionType(
    output: string, 
    sourceContent: string
  ): Promise<ContributionType> {
    const overlap = this.calculateOverlap(output, sourceContent)

    if (overlap > 0.5) {
      return 'primary'
    } else if (overlap > 0.3) {
      return 'derived'
    } else if (overlap > 0.1) {
      return 'supporting'
    } else {
      return 'contextual'
    }
  }

  /**
   * Calculate content overlap
   */
  private calculateOverlap(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))

    const intersection = new Set([...words1].filter(x => words2.has(x)))
    return intersection.size / Math.max(words1.size, 1)
  }

  /**
   * Find relevant excerpt from source
   */
  private findRelevantExcerpt(output: string, sourceContent: string): string {
    const outputWords = output.toLowerCase().split(/\s+/)
    const sourceSentences = sourceContent.split(/[.!?]+/)

    let bestSentence = ''
    let bestScore = 0

    for (const sentence of sourceSentences) {
      if (sentence.trim().length < 10) continue

      const sentenceWords = new Set(sentence.toLowerCase().split(/\s+/))
      const overlap = outputWords.filter(w => sentenceWords.has(w)).length

      if (overlap > bestScore) {
        bestScore = overlap
        bestSentence = sentence.trim()
      }
    }

    return bestSentence.slice(0, 200)
  }

  /**
   * Generate citations in multiple formats
   */
  private generateCitations(): Citation[] {
    const citations: Citation[] = []
    const formats: CitationFormat[] = ['apa', 'mla', 'ieee', 'inline']

    for (const format of formats) {
      for (const attr of this.attributions) {
        citations.push(this.formatCitation(attr, format))
      }
    }

    return citations
  }

  /**
   * Format a citation
   */
  private formatCitation(attribution: Attribution, format: CitationFormat): Citation {
    const source = attribution.source
    let text = ''
    let inText = ''
    let bibliography = ''

    const year = source.date?.getFullYear()?.toString() || 'n.d.'
    const author = source.author || 'Unknown'
    const title = source.title

    switch (format) {
      case 'apa':
        text = `(${author}, ${year})`
        inText = `${author} (${year})`
        bibliography = `${author} (${year}). ${title}.`
        if (source.url && this.config.includeUrls) {
          bibliography += ` Retrieved from ${source.url}`
        }
        break

      case 'mla':
        text = `(${author})`
        inText = `According to ${author}`
        bibliography = `${author}. "${title}." ${year}.`
        if (source.url && this.config.includeUrls) {
          bibliography += ` ${source.url}.`
        }
        break

      case 'ieee':
        text = `[${this.attributions.indexOf(attribution) + 1}]`
        inText = `[${this.attributions.indexOf(attribution) + 1}]`
        bibliography = `[${this.attributions.indexOf(attribution) + 1}] ${author}, "${title}," ${year}.`
        break

      case 'harvard':
        text = `(${author} ${year})`
        inText = `${author} (${year})`
        bibliography = `${author} (${year}) '${title}'.`
        break

      case 'vancouver':
        text = `(${this.attributions.indexOf(attribution) + 1})`
        inText = `(${this.attributions.indexOf(attribution) + 1})`
        bibliography = `${this.attributions.indexOf(attribution) + 1}. ${author}. ${title}. ${year}.`
        break

      case 'inline':
        text = `Source: ${title}`
        inText = `According to ${title}`
        bibliography = title
        break

      default:
        text = `(${author}, ${year})`
        inText = `${author} (${year})`
        bibliography = `${author}. ${title}. ${year}.`
    }

    return {
      format,
      text,
      inText,
      bibliography
    }
  }

  /**
   * Build provenance chain
   */
  private buildProvenanceChain(): ProvenanceNode[] {
    const nodes: ProvenanceNode[] = []

    for (const attr of this.attributions) {
      const node: ProvenanceNode = {
        id: `prov_${attr.id}`,
        source: attr.source,
        transformation: this.describeTransformation(attr.contributionType),
        children: [],
        parentIds: []
      }
      nodes.push(node)
      this.provenance.set(node.id, node)
    }

    return nodes
  }

  /**
   * Describe transformation based on contribution type
   */
  private describeTransformation(type: ContributionType): string {
    const descriptions: Record<ContributionType, string> = {
      primary: 'Directly incorporated into output',
      supporting: 'Used to validate or support claims',
      contextual: 'Provided background context',
      derived: 'Transformed and adapted for output',
      referenced: 'Directly referenced in output'
    }
    return descriptions[type]
  }

  /**
   * Calculate verifiability score
   */
  private calculateVerifiabilityScore(): number {
    if (this.attributions.length === 0) return 0

    // Factors:
    // 1. Number of sources
    const sourceScore = Math.min(this.attributions.length / 5, 1) * 0.3

    // 2. Average reliability of sources
    const reliabilityScore = this.attributions.reduce((sum, a) => 
      sum + a.source.reliability, 0) / this.attributions.length * 0.3

    // 3. Average relevance
    const relevanceScore = this.attributions.reduce((sum, a) => 
      sum + a.relevanceScore, 0) / this.attributions.length * 0.2

    // 4. Source type diversity
    const types = new Set(this.attributions.map(a => a.source.type))
    const diversityScore = Math.min(types.size / 4, 1) * 0.2

    return sourceScore + reliabilityScore + relevanceScore + diversityScore
  }

  /**
   * Determine confidence level
   */
  private determineConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.7) return 'high'
    if (score >= 0.4) return 'medium'
    return 'low'
  }

  /**
   * Generate disclaimer based on confidence
   */
  private generateDisclaimer(confidence: 'high' | 'medium' | 'low'): string | undefined {
    switch (confidence) {
      case 'low':
        return 'This output has limited source attribution. Please verify information independently.'
      case 'medium':
        return 'Some claims in this output may require additional verification.'
      default:
        return undefined
    }
  }

  /**
   * Generate formatted attribution text
   */
  generateAttributionText(format: CitationFormat = this.config.defaultFormat): string {
    if (this.attributions.length === 0) {
      return 'No sources were directly referenced in generating this output.'
    }

    const lines: string[] = ['\n---\n**Sources:**\n']

    for (let i = 0; i < this.attributions.length; i++) {
      const attr = this.attributions[i]
      const citation = this.formatCitation(attr, format)

      lines.push(`${i + 1}. ${citation.bibliography}`)

      if (this.config.includeExcerpts && attr.excerpt) {
        lines.push(`   > "${attr.excerpt}"`)
      }
    }

    return lines.join('\n')
  }

  /**
   * Generate in-text citations for content
   */
  insertInTextCitations(content: string, format: CitationFormat = this.config.defaultFormat): string {
    let result = content

    for (const attr of this.attributions) {
      if (attr.contributionType === 'primary' || attr.contributionType === 'referenced') {
        const citation = this.formatCitation(attr, format)
        // Insert citation at end of relevant sentences
        result = result.replace(/\.\s/g, ` ${citation.text}. `)
        break // Only insert once for primary source
      }
    }

    return result
  }

  /**
   * Get all registered sources
   */
  getSources(): Source[] {
    return Array.from(this.sources.values())
  }

  /**
   * Get attributions
   */
  getAttributions(): Attribution[] {
    return this.attributions
  }

  /**
   * Clear all attributions
   */
  clear(): void {
    this.attributions = []
    this.provenance.clear()
  }

  /**
   * Export attribution data
   */
  export(): { sources: Source[]; attributions: Attribution[] } {
    return {
      sources: Array.from(this.sources.values()),
      attributions: this.attributions
    }
  }
}

// Singleton
let attributionGeneratorInstance: SourceAttributionGenerator | null = null

export function getSourceAttributionGenerator(
  config?: Partial<AttributionConfig>
): SourceAttributionGenerator {
  if (!attributionGeneratorInstance) {
    attributionGeneratorInstance = new SourceAttributionGenerator(config)
  }
  return attributionGeneratorInstance
}

/**
 * Quick attribution generation
 */
export async function generateAttributions(
  output: string,
  inputContext: Array<{ content: string; source?: Source }>
): Promise<AttributionResult> {
  const generator = new SourceAttributionGenerator()
  await generator.init()
  return generator.generateAttributions(output, inputContext)
}

/**
 * Create a source from common formats
 */
export function createSource(
  type: SourceType,
  data: Partial<Source>
): Source {
  return {
    id: data.id || `src_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type,
    title: data.title || 'Untitled',
    author: data.author,
    url: data.url,
    date: data.date,
    version: data.version,
    accessDate: data.accessDate || new Date(),
    reliability: data.reliability ?? 0.5,
    metadata: data.metadata || {}
  }
}
