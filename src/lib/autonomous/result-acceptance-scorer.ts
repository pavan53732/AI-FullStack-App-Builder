/**
 * Result Acceptance Scorer - Mechanism #60
 * 
 * Scores AI outputs to determine if they meet quality thresholds
 * for acceptance, enabling automated quality gates.
 * 
 * Features:
 * - Multi-dimensional scoring
 * - Acceptance threshold management
 * - Quality gate automation
 * - Confidence scoring
 * - Improvement suggestions
 */

import ZAI from 'z-ai-web-dev-sdk'

// Types
export interface AcceptanceScore {
  overall: number // 0-1
  passed: boolean
  dimensions: DimensionScore[]
  confidence: number
  recommendation: 'accept' | 'reject' | 'review' | 'improve'
  issues: AcceptanceIssue[]
  suggestions: string[]
}

export interface DimensionScore {
  dimension: ScoringDimension
  score: number // 0-1
  weight: number
  passed: boolean
  threshold: number
  details: string
}

export type ScoringDimension = 
  | 'correctness'      // Factual accuracy
  | 'completeness'     // All requirements met
  | 'relevance'        // Relevant to the task
  | 'clarity'          // Clear and understandable
  | 'efficiency'       // Efficient solution
  | 'security'         // Secure implementation
  | 'maintainability'  // Easy to maintain
  | 'testability'      // Easy to test
  | 'scalability'      // Handles growth
  | 'performance'      // Meets performance requirements

export interface AcceptanceIssue {
  dimension: ScoringDimension
  severity: 'critical' | 'major' | 'minor'
  description: string
  impact: string
}

export interface ScoringThresholds {
  accept: number      // Score >= this = accept
  improve: number     // Score >= this = needs improvement
  reject: number      // Score < this = reject
  review: number      // Score in this range = needs review
}

export interface ScoringConfig {
  thresholds: ScoringThresholds
  dimensionWeights: Record<ScoringDimension, number>
  dimensionThresholds: Record<ScoringDimension, number>
  strictMode: boolean
  requireAllDimensions: boolean
}

const DEFAULT_CONFIG: ScoringConfig = {
  thresholds: {
    accept: 0.8,
    improve: 0.6,
    reject: 0.4,
    review: 0.6
  },
  dimensionWeights: {
    correctness: 0.2,
    completeness: 0.15,
    relevance: 0.1,
    clarity: 0.1,
    efficiency: 0.1,
    security: 0.15,
    maintainability: 0.1,
    testability: 0.05,
    scalability: 0.05,
    performance: 0.1
  },
  dimensionThresholds: {
    correctness: 0.7,
    completeness: 0.6,
    relevance: 0.5,
    clarity: 0.6,
    efficiency: 0.5,
    security: 0.8,
    maintainability: 0.5,
    testability: 0.4,
    scalability: 0.4,
    performance: 0.5
  },
  strictMode: false,
  requireAllDimensions: false
}

/**
 * Result Acceptance Scorer
 */
export class ResultAcceptanceScorer {
  private zai: any = null
  private config: ScoringConfig
  private scoringHistory: AcceptanceScore[] = []
  private initialized = false

  constructor(config?: Partial<ScoringConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    
    // Normalize weights to sum to 1
    const weightSum = Object.values(this.config.dimensionWeights).reduce((a, b) => a + b, 0)
    for (const dim of Object.keys(this.config.dimensionWeights) as ScoringDimension[]) {
      this.config.dimensionWeights[dim] /= weightSum
    }
  }

  /**
   * Initialize the scorer
   */
  async init(): Promise<void> {
    if (this.initialized) return
    this.zai = await ZAI.create()
    this.initialized = true
  }

  /**
   * Score an output for acceptance
   */
  async score(
    output: string,
    requirements: string[],
    context?: string
  ): Promise<AcceptanceScore> {
    await this.init()

    // Score each dimension
    const dimensions = await this.scoreDimensions(output, requirements, context)

    // Calculate overall score
    const overall = this.calculateOverallScore(dimensions)

    // Determine if passed
    const passed = this.determinePass(dimensions, overall)

    // Generate recommendation
    const recommendation = this.generateRecommendation(overall, dimensions)

    // Identify issues
    const issues = this.identifyIssues(dimensions)

    // Generate suggestions
    const suggestions = this.generateSuggestions(dimensions, issues)

    // Calculate confidence
    const confidence = this.calculateConfidence(dimensions)

    const result: AcceptanceScore = {
      overall,
      passed,
      dimensions,
      confidence,
      recommendation,
      issues,
      suggestions
    }

    // Store in history
    this.scoringHistory.push(result)

    return result
  }

  /**
   * Score all dimensions
   */
  private async scoreDimensions(
    output: string,
    requirements: string[],
    context?: string
  ): Promise<DimensionScore[]> {
    const dimensions: DimensionScore[] = []

    for (const dimension of Object.keys(this.config.dimensionWeights) as ScoringDimension[]) {
      const score = await this.scoreDimension(dimension, output, requirements, context)
      const threshold = this.config.dimensionThresholds[dimension]
      const weight = this.config.dimensionWeights[dimension]

      dimensions.push({
        dimension,
        score,
        weight,
        passed: score >= threshold,
        threshold,
        details: this.getDimensionDetails(dimension, score)
      })
    }

    return dimensions
  }

  /**
   * Score a single dimension
   */
  private async scoreDimension(
    dimension: ScoringDimension,
    output: string,
    requirements: string[],
    context?: string
  ): Promise<number> {
    // Try AI-based scoring first
    try {
      const aiScore = await this.aiScoreDimension(dimension, output, requirements, context)
      if (aiScore !== null) return aiScore
    } catch {
      // Fall through to heuristic scoring
    }

    // Fall back to heuristic scoring
    return this.heuristicScoreDimension(dimension, output, requirements)
  }

  /**
   * AI-based dimension scoring
   */
  private async aiScoreDimension(
    dimension: ScoringDimension,
    output: string,
    requirements: string[],
    context?: string
  ): Promise<number | null> {
    const dimensionDescriptions: Record<ScoringDimension, string> = {
      correctness: 'factual accuracy and logical correctness',
      completeness: 'how completely all requirements are met',
      relevance: 'relevance to the stated requirements',
      clarity: 'clarity and understandability of the output',
      efficiency: 'efficiency of the solution',
      security: 'security of the implementation',
      maintainability: 'ease of maintaining the code',
      testability: 'ease of testing the implementation',
      scalability: 'ability to handle increased load',
      performance: 'performance characteristics'
    }

    const response = await this.zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Score the output on a scale of 0-1 for ${dimension} (${dimensionDescriptions[dimension]}).
Respond with only a number between 0 and 1.`
        },
        {
          role: 'user',
          content: `Output: ${output.slice(0, 1500)}
Requirements: ${requirements.join(', ')}
${context ? `Context: ${context.slice(0, 500)}` : ''}`
        }
      ],
      thinking: { type: 'disabled' }
    })

    const content = response.choices[0]?.message?.content || '0.5'
    const score = parseFloat(content)

    if (!isNaN(score) && score >= 0 && score <= 1) {
      return score
    }

    return null
  }

  /**
   * Heuristic-based dimension scoring
   */
  private heuristicScoreDimension(
    dimension: ScoringDimension,
    output: string,
    requirements: string[]
  ): number {
    switch (dimension) {
      case 'correctness':
        return this.scoreCorrectness(output)

      case 'completeness':
        return this.scoreCompleteness(output, requirements)

      case 'relevance':
        return this.scoreRelevance(output, requirements)

      case 'clarity':
        return this.scoreClarity(output)

      case 'efficiency':
        return this.scoreEfficiency(output)

      case 'security':
        return this.scoreSecurity(output)

      case 'maintainability':
        return this.scoreMaintainability(output)

      case 'testability':
        return this.scoreTestability(output)

      case 'scalability':
        return this.scoreScalability(output)

      case 'performance':
        return this.scorePerformance(output)

      default:
        return 0.5
    }
  }

  /**
   * Score correctness
   */
  private scoreCorrectness(output: string): number {
    let score = 0.8 // Start optimistic

    // Check for error indicators
    if (output.includes('error') || output.includes('Error')) score -= 0.2
    if (output.includes('undefined') && !output.includes('undefined?')) score -= 0.1
    if (output.includes('TODO') || output.includes('FIXME')) score -= 0.15
    if (output.includes('hack') || output.includes('workaround')) score -= 0.1

    // Check for good practices
    if (output.includes('try') && output.includes('catch')) score += 0.05
    if (output.includes('return') && !output.includes('return undefined')) score += 0.05

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Score completeness
   */
  private scoreCompleteness(output: string, requirements: string[]): number {
    if (requirements.length === 0) return 0.8

    let matchedRequirements = 0

    for (const req of requirements) {
      const keywords = req.toLowerCase().split(/\s+/).filter(w => w.length > 3)
      const matches = keywords.filter(kw => output.toLowerCase().includes(kw))
      if (matches.length >= keywords.length * 0.5) {
        matchedRequirements++
      }
    }

    return matchedRequirements / requirements.length
  }

  /**
   * Score relevance
   */
  private scoreRelevance(output: string, requirements: string[]): number {
    if (requirements.length === 0) return 0.8

    // Check how much of the output is relevant to requirements
    const reqWords = new Set(requirements.join(' ').toLowerCase().split(/\s+/))
    const outputWords = new Set(output.toLowerCase().split(/\s+/))

    const relevantWords = [...outputWords].filter(w => reqWords.has(w))
    const relevanceRatio = relevantWords.length / Math.max(outputWords.size, 1)

    // Penalize very short or very long outputs
    const lengthPenalty = output.length < 100 ? 0.2 : output.length > 5000 ? 0.1 : 0

    return Math.max(0, Math.min(1, relevanceRatio + 0.5 - lengthPenalty))
  }

  /**
   * Score clarity
   */
  private scoreClarity(output: string): number {
    let score = 0.7

    // Check for documentation
    if (output.includes('/**') || output.includes('//')) score += 0.1

    // Check for clear structure
    if (output.includes('function') || output.includes('class')) score += 0.05
    if (output.includes('export')) score += 0.05

    // Penalize complex lines
    const lines = output.split('\n')
    const avgLineLength = lines.reduce((sum, l) => sum + l.length, 0) / lines.length
    if (avgLineLength > 100) score -= 0.15

    // Penalize lack of structure
    if (!output.includes('\n\n')) score -= 0.1

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Score efficiency
   */
  private scoreEfficiency(output: string): number {
    let score = 0.7

    // Check for efficient patterns
    if (output.includes('Map') || output.includes('Set')) score += 0.1
    if (output.includes('memo') || output.includes('cache')) score += 0.1

    // Penalize inefficient patterns
    if (output.includes('for') && output.includes('await')) score -= 0.15 // Sequential async
    if ((output.match(/for/g) || []).length > 3) score -= 0.1 // Too many loops

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Score security
   */
  private scoreSecurity(output: string): number {
    let score = 0.8

    // Check for security issues
    if (output.includes('eval(')) score -= 0.3
    if (output.includes('innerHTML')) score -= 0.2
    if (output.includes('dangerouslySetInnerHTML')) score -= 0.25
    if (output.includes('password') && !output.includes('hash')) score -= 0.15
    if (output.includes('sql') && output.includes('+')) score -= 0.2 // SQL injection risk

    // Check for security practices
    if (output.includes('sanitize') || output.includes('validate')) score += 0.1
    if (output.includes('escape') || output.includes('encode')) score += 0.1

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Score maintainability
   */
  private scoreMaintainability(output: string): number {
    let score = 0.7

    // Check for good practices
    if (output.includes('const ') || output.includes('let ')) score += 0.05
    if (output.includes('interface ') || output.includes('type ')) score += 0.1
    if (output.includes('export ')) score += 0.05

    // Penalize bad practices
    if (output.includes('var ')) score -= 0.15
    if (output.includes('any')) score -= 0.1

    // Check for modularity
    const functions = (output.match(/function\s+\w+/g) || []).length
    const exports = (output.match(/export/g) || []).length
    if (functions > 0 && exports > 0) score += 0.05

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Score testability
   */
  private scoreTestability(output: string): number {
    let score = 0.6

    // Check for test-friendly patterns
    if (output.includes('export function')) score += 0.15
    if (output.includes('export const')) score += 0.1
    if (output.includes('return ')) score += 0.1

    // Penalize hard-to-test patterns
    if (output.includes('Date.now()')) score -= 0.1
    if (output.includes('Math.random()')) score -= 0.1
    if (output.includes('globalThis')) score -= 0.15

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Score scalability
   */
  private scoreScalability(output: string): number {
    let score = 0.6

    // Check for scalable patterns
    if (output.includes('async') || output.includes('Promise')) score += 0.1
    if (output.includes('batch') || output.includes('chunk')) score += 0.1
    if (output.includes('stream') || output.includes('Stream')) score += 0.15

    // Penalize non-scalable patterns
    if (output.includes('setTimeout') && !output.includes('clearTimeout')) score -= 0.1
    if (output.includes('sync') && !output.includes('async')) score -= 0.1

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Score performance
   */
  private scorePerformance(output: string): number {
    let score = 0.7

    // Check for performance optimizations
    if (output.includes('useMemo') || output.includes('useCallback')) score += 0.1
    if (output.includes('lazy') || output.includes('Lazy')) score += 0.1

    // Penalize performance issues
    if (output.includes('JSON.parse(JSON.stringify')) score -= 0.15
    if (output.includes('document.getElementById') && !output.includes('useRef')) score -= 0.1

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Get dimension details
   */
  private getDimensionDetails(dimension: ScoringDimension, score: number): string {
    const level = score >= 0.8 ? 'Excellent' : score >= 0.6 ? 'Good' : score >= 0.4 ? 'Fair' : 'Poor'
    return `${dimension}: ${level} (${(score * 100).toFixed(0)}%)`
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(dimensions: DimensionScore[]): number {
    return dimensions.reduce(
      (sum, dim) => sum + dim.score * dim.weight,
      0
    )
  }

  /**
   * Determine if passed
   */
  private determinePass(dimensions: DimensionScore[], overall: number): boolean {
    // Check if overall score meets threshold
    if (overall < this.config.thresholds.improve) return false

    // In strict mode, all dimensions must pass
    if (this.config.strictMode && this.config.requireAllDimensions) {
      return dimensions.every(d => d.passed)
    }

    // In strict mode, critical dimensions must pass
    if (this.config.strictMode) {
      const criticalDimensions: ScoringDimension[] = ['correctness', 'security']
      return criticalDimensions.every(
        dim => dimensions.find(d => d.dimension === dim)?.passed
      )
    }

    return overall >= this.config.thresholds.accept
  }

  /**
   * Generate recommendation
   */
  private generateRecommendation(overall: number, dimensions: DimensionScore[]): 'accept' | 'reject' | 'review' | 'improve' {
    if (overall >= this.config.thresholds.accept) {
      // Check if any critical dimension failed
      const criticalFailed = dimensions.filter(
        d => d.dimension === 'correctness' || d.dimension === 'security'
      ).some(d => !d.passed)

      return criticalFailed ? 'review' : 'accept'
    }

    if (overall >= this.config.thresholds.review) {
      return 'review'
    }

    if (overall >= this.config.thresholds.reject) {
      return 'improve'
    }

    return 'reject'
  }

  /**
   * Identify issues
   */
  private identifyIssues(dimensions: DimensionScore[]): AcceptanceIssue[] {
    const issues: AcceptanceIssue[] = []

    for (const dim of dimensions) {
      if (!dim.passed) {
        issues.push({
          dimension: dim.dimension,
          severity: dim.score < 0.3 ? 'critical' : dim.score < 0.5 ? 'major' : 'minor',
          description: `${dim.dimension} score (${(dim.score * 100).toFixed(0)}%) below threshold (${(dim.threshold * 100).toFixed(0)}%)`,
          impact: `May affect overall quality and user experience`
        })
      }
    }

    return issues
  }

  /**
   * Generate suggestions
   */
  private generateSuggestions(dimensions: DimensionScore[], issues: AcceptanceIssue[]): string[] {
    const suggestions: string[] = []

    for (const issue of issues) {
      switch (issue.dimension) {
        case 'correctness':
          suggestions.push('Review logic for errors and fix any issues')
          break
        case 'completeness':
          suggestions.push('Ensure all requirements are implemented')
          break
        case 'security':
          suggestions.push('Address security vulnerabilities')
          break
        case 'performance':
          suggestions.push('Optimize for better performance')
          break
        case 'maintainability':
          suggestions.push('Improve code structure and documentation')
          break
        case 'testability':
          suggestions.push('Make code more testable with dependency injection')
          break
        default:
          suggestions.push(`Improve ${issue.dimension}`)
      }
    }

    return [...new Set(suggestions)]
  }

  /**
   * Calculate confidence in scoring
   */
  private calculateConfidence(dimensions: DimensionScore[]): number {
    // Higher confidence when dimensions are consistent
    const scores = dimensions.map(d => d.score)
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length

    // Lower variance = higher confidence
    return Math.max(0.5, 1 - variance)
  }

  /**
   * Update thresholds
   */
  updateThresholds(thresholds: Partial<ScoringThresholds>): void {
    this.config.thresholds = { ...this.config.thresholds, ...thresholds }
  }

  /**
   * Get scoring history
   */
  getHistory(): AcceptanceScore[] {
    return this.scoringHistory
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    total: number
    accepted: number
    rejected: number
    needsReview: number
    needsImprovement: number
    averageScore: number
  } {
    const total = this.scoringHistory.length
    const accepted = this.scoringHistory.filter(s => s.recommendation === 'accept').length
    const rejected = this.scoringHistory.filter(s => s.recommendation === 'reject').length
    const needsReview = this.scoringHistory.filter(s => s.recommendation === 'review').length
    const needsImprovement = this.scoringHistory.filter(s => s.recommendation === 'improve').length
    const averageScore = total > 0
      ? this.scoringHistory.reduce((sum, s) => sum + s.overall, 0) / total
      : 0

    return { total, accepted, rejected, needsReview, needsImprovement, averageScore }
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.scoringHistory = []
  }
}

// Singleton
let scorerInstance: ResultAcceptanceScorer | null = null

export function getResultAcceptanceScorer(
  config?: Partial<ScoringConfig>
): ResultAcceptanceScorer {
  if (!scorerInstance) {
    scorerInstance = new ResultAcceptanceScorer(config)
  }
  return scorerInstance
}

/**
 * Quick acceptance scoring
 */
export async function scoreAcceptance(
  output: string,
  requirements: string[]
): Promise<AcceptanceScore> {
  const scorer = new ResultAcceptanceScorer()
  await scorer.init()
  return scorer.score(output, requirements)
}
