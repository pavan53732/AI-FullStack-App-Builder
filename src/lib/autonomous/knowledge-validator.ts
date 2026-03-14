/**
 * Knowledge Validator
 * 
 * Validates knowledge sources and information for:
 * - Accuracy verification
 * - Source credibility assessment
 * - Information freshness
 * - Consistency checking
 * - Cross-reference validation
 * 
 * Features:
 * - Multi-source validation
 * - Fact-checking capabilities
 * - Outdated information detection
 * - Contradiction detection
 * - Confidence scoring
 */

import ZAI from 'z-ai-web-dev-sdk'

// Types
export interface KnowledgeItem {
  id: string
  content: string
  source: KnowledgeSource
  timestamp: string
  version?: string
  author?: string
  url?: string
  metadata?: Record<string, any>
}

export type KnowledgeSource = 
  | 'official'
  | 'npm'
  | 'github'
  | 'mdn'
  | 'stackoverflow'
  | 'documentation'
  | 'blog'
  | 'tutorial'
  | 'community'
  | 'unknown'

export interface ValidationResult {
  itemId: string
  valid: boolean
  confidence: number
  checks: ValidationCheck[]
  issues: ValidationIssue[]
  recommendations: string[]
  verifiedAt: string
}

export interface ValidationCheck {
  type: ValidationCheckType
  passed: boolean
  score: number
  details: string
}

export type ValidationCheckType = 
  | 'source_credibility'
  | 'content_accuracy'
  | 'freshness'
  | 'consistency'
  | 'cross_reference'
  | 'version_compatibility'
  | 'code_validity'
  | 'completeness'

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info'
  code: string
  message: string
  severity: number
  suggestion?: string
}

export interface ValidationOptions {
  checks?: ValidationCheckType[]
  strictMode?: boolean
  minConfidence?: number
  checkOutdated?: boolean
  validateCode?: boolean
  crossReferenceSources?: string[]
}

export interface SourceCredibility {
  source: KnowledgeSource
  score: number
  factors: CredibilityFactor[]
}

export interface CredibilityFactor {
  name: string
  score: number
  weight: number
  reason: string
}

// Source credibility ratings
const SOURCE_CREDIBILITY: Record<KnowledgeSource, number> = {
  'official': 0.95,
  'documentation': 0.9,
  'mdn': 0.9,
  'npm': 0.85,
  'github': 0.8,
  'stackoverflow': 0.7,
  'tutorial': 0.6,
  'blog': 0.5,
  'community': 0.4,
  'unknown': 0.3
}

// Freshness thresholds (in days)
const FRESHNESS_THRESHOLDS: Record<string, number> = {
  'api': 180,      // APIs change frequently
  'framework': 90, // Frameworks update often
  'library': 120,  // Libraries moderately
  'concept': 365,  // Concepts are stable
  'pattern': 365,  // Patterns are stable
  'default': 180
}

/**
 * Knowledge Validator
 * 
 * Main class for validating knowledge items
 */
export class KnowledgeValidator {
  private zai: any = null
  private validationCache: Map<string, ValidationResult> = new Map()
  private crossRefCache: Map<string, KnowledgeItem[]> = new Map()

  /**
   * Initialize the validator
   */
  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
  }

  /**
   * Validate a knowledge item
   */
  async validate(
    item: KnowledgeItem,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    const cacheKey = `${item.id}:${item.timestamp}`
    
    // Check cache
    const cached = this.validationCache.get(cacheKey)
    if (cached) return cached

    const checks: ValidationCheck[] = []
    const issues: ValidationIssue[] = []
    const recommendations: string[] = []
    
    const requestedChecks = options.checks || [
      'source_credibility',
      'content_accuracy',
      'freshness',
      'consistency',
      'cross_reference'
    ]

    // Run each validation check
    for (const checkType of requestedChecks) {
      const check = await this.runCheck(item, checkType, options)
      checks.push(check)

      // Collect issues from failed checks
      if (!check.passed) {
        issues.push({
          type: check.score < 0.5 ? 'error' : 'warning',
          code: `${checkType}_failed`,
          message: check.details,
          severity: 1 - check.score
        })
      }
    }

    // Calculate overall confidence
    const confidence = this.calculateConfidence(checks, options.strictMode)

    // Generate recommendations
    const failedChecks = checks.filter(c => !c.passed)
    for (const failed of failedChecks) {
      recommendations.push(this.generateRecommendation(failed.type, failed.details))
    }

    // Check for critical issues
    const hasErrors = issues.some(i => i.type === 'error')
    const valid = !hasErrors && confidence >= (options.minConfidence || 0.6)

    const result: ValidationResult = {
      itemId: item.id,
      valid,
      confidence,
      checks,
      issues,
      recommendations,
      verifiedAt: new Date().toISOString()
    }

    // Cache result
    this.validationCache.set(cacheKey, result)

    return result
  }

  /**
   * Validate multiple items
   */
  async validateBatch(
    items: KnowledgeItem[],
    options: ValidationOptions = {}
  ): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>()

    for (const item of items) {
      const result = await this.validate(item, options)
      results.set(item.id, result)
    }

    return results
  }

  /**
   * Check source credibility
   */
  private async checkSourceCredibility(
    item: KnowledgeItem
  ): Promise<ValidationCheck> {
    const baseScore = SOURCE_CREDIBILITY[item.source] || 0.3
    const factors: CredibilityFactor[] = []

    // Factor 1: Base credibility
    factors.push({
      name: 'source_type',
      score: baseScore,
      weight: 0.4,
      reason: `${item.source} sources have ${baseScore > 0.7 ? 'high' : baseScore > 0.5 ? 'moderate' : 'low'} credibility`
    })

    // Factor 2: Has URL
    const urlScore = item.url ? 0.1 : 0
    factors.push({
      name: 'verifiable',
      score: urlScore,
      weight: 0.1,
      reason: item.url ? 'Source is verifiable' : 'No URL provided'
    })

    // Factor 3: Has author
    const authorScore = item.author ? 0.1 : 0
    factors.push({
      name: 'attributed',
      score: authorScore,
      weight: 0.1,
      reason: item.author ? `Authored by ${item.author}` : 'No author attribution'
    })

    // Calculate weighted score
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0)
    const weightedScore = factors.reduce(
      (sum, f) => sum + f.score * f.weight,
      0
    ) / totalWeight

    return {
      type: 'source_credibility',
      passed: weightedScore >= 0.6,
      score: weightedScore,
      details: factors.map(f => f.reason).join('; ')
    }
  }

  /**
   * Check content accuracy
   */
  private async checkContentAccuracy(
    item: KnowledgeItem,
    options: ValidationOptions
  ): Promise<ValidationCheck> {
    // Basic heuristics
    const content = item.content
    let score = 0.5
    const factors: string[] = []

    // Check for code blocks (if applicable)
    const hasCode = /```[\s\S]*?```|`[^`]+`/.test(content)
    if (hasCode && options.validateCode) {
      const codeValid = await this.validateCodeInContent(content)
      if (codeValid) {
        score += 0.2
        factors.push('Code blocks appear valid')
      } else {
        score -= 0.1
        factors.push('Code blocks may have issues')
      }
    }

    // Check for references/links
    const hasReferences = /\[.*?\]\(.*?\)|https?:\/\//.test(content)
    if (hasReferences) {
      score += 0.1
      factors.push('Contains references')
    }

    // Check for completeness (length)
    if (content.length > 100) {
      score += 0.1
      factors.push('Sufficient detail')
    } else if (content.length < 50) {
      score -= 0.1
      factors.push('Content may be incomplete')
    }

    // Use AI for advanced accuracy check
    if (this.zai && options.strictMode) {
      const aiScore = await this.aiAccuracyCheck(content)
      score = (score + aiScore) / 2
    }

    return {
      type: 'content_accuracy',
      passed: score >= 0.5,
      score,
      details: factors.join('; ')
    }
  }

  /**
   * Check freshness
   */
  private async checkFreshness(
    item: KnowledgeItem,
    options: ValidationOptions
  ): Promise<ValidationCheck> {
    if (!options.checkOutdated) {
      return {
        type: 'freshness',
        passed: true,
        score: 1,
        details: 'Freshness check disabled'
      }
    }

    const itemDate = new Date(item.timestamp)
    const ageMs = Date.now() - itemDate.getTime()
    const ageDays = ageMs / (1000 * 60 * 60 * 24)

    // Determine threshold based on content type
    const contentType = item.metadata?.type || 'default'
    const threshold = FRESHNESS_THRESHOLDS[contentType] || FRESHNESS_THRESHOLDS.default

    // Calculate freshness score
    const freshnessScore = Math.max(0, 1 - (ageDays / threshold))

    let details = ''
    if (ageDays < 30) {
      details = 'Content is fresh (< 30 days old)'
    } else if (ageDays < threshold) {
      details = `Content is moderately fresh (${Math.round(ageDays)} days old)`
    } else {
      details = `Content may be outdated (${Math.round(ageDays)} days old, threshold: ${threshold})`
    }

    return {
      type: 'freshness',
      passed: ageDays < threshold,
      score: freshnessScore,
      details
    }
  }

  /**
   * Check consistency
   */
  private async checkConsistency(
    item: KnowledgeItem,
    options: ValidationOptions
  ): Promise<ValidationCheck> {
    const content = item.content
    let score = 1
    const issues: string[] = []

    // Check for contradictions in the content itself
    const contradictions = this.detectContradictions(content)
    if (contradictions.length > 0) {
      score -= contradictions.length * 0.2
      issues.push(`Found ${contradictions.length} potential contradictions`)
    }

    // Check for formatting consistency
    const headingPattern = /^#+\s+.+$/gm
    const headings = content.match(headingPattern) || []
    const inconsistentHeadings = headings.some(h => !h.startsWith('# '))
    if (inconsistentHeadings) {
      score -= 0.1
      issues.push('Inconsistent heading format')
    }

    // Check for broken internal references
    const internalRefs = content.match(/\[.*?\]\(#[^\)]+\)/g) || []
    for (const ref of internalRefs) {
      const id = ref.match(/#([^\)]+)/)?.[1]
      if (id && !content.includes(`id="${id}"`) && !content.includes(`name="${id}"`)) {
        score -= 0.05
        issues.push(`Broken internal reference: ${id}`)
      }
    }

    return {
      type: 'consistency',
      passed: score >= 0.7,
      score: Math.max(0, score),
      details: issues.length > 0 ? issues.join('; ') : 'Content is consistent'
    }
  }

  /**
   * Cross-reference with other sources
   */
  private async checkCrossReference(
    item: KnowledgeItem,
    options: ValidationOptions
  ): Promise<ValidationCheck> {
    const crossRefSources = options.crossReferenceSources || ['official', 'documentation']
    
    // Get related items from cache or simulate
    const relatedItems = this.crossRefCache.get(item.id) || []
    
    if (relatedItems.length === 0) {
      // No cross-references available
      return {
        type: 'cross_reference',
        passed: true,
        score: 0.7,
        details: 'No cross-references available for validation'
      }
    }

    // Compare content with related items
    let matchCount = 0
    const keyPoints = this.extractKeyPoints(item.content)

    for (const related of relatedItems) {
      const relatedPoints = this.extractKeyPoints(related.content)
      
      // Check overlap
      for (const point of keyPoints) {
        if (relatedPoints.some(rp => this.similarity(point, rp) > 0.7)) {
          matchCount++
        }
      }
    }

    const matchRatio = keyPoints.length > 0 ? matchCount / keyPoints.length : 0
    const score = Math.min(1, matchRatio * 1.2) // Allow some flexibility

    return {
      type: 'cross_reference',
      passed: score >= 0.5,
      score,
      details: `Cross-referenced with ${relatedItems.length} sources, ${(matchRatio * 100).toFixed(0)}% agreement`
    }
  }

  /**
   * Check version compatibility
   */
  private async checkVersionCompatibility(
    item: KnowledgeItem,
    options: ValidationOptions
  ): Promise<ValidationCheck> {
    const itemVersion = item.version || item.metadata?.version
    
    if (!itemVersion) {
      return {
        type: 'version_compatibility',
        passed: true,
        score: 0.8,
        details: 'No version specified'
      }
    }

    // Parse version
    const versionParts = itemVersion.split('.').map(Number)
    const isValidVersion = versionParts.length >= 2 && versionParts.every(v => !isNaN(v))

    if (!isValidVersion) {
      return {
        type: 'version_compatibility',
        passed: true,
        score: 0.7,
        details: `Non-standard version format: ${itemVersion}`
      }
    }

    // Check if version is recent
    const [major, minor] = versionParts
    const isRecent = major >= 1 && minor >= 0

    return {
      type: 'version_compatibility',
      passed: true,
      score: isRecent ? 0.9 : 0.7,
      details: `Version: ${itemVersion} (${isRecent ? 'recent' : 'potentially outdated'})`
    }
  }

  /**
   * Check code validity
   */
  private async checkCodeValidity(
    item: KnowledgeItem,
    options: ValidationOptions
  ): Promise<ValidationCheck> {
    if (!options.validateCode) {
      return {
        type: 'code_validity',
        passed: true,
        score: 1,
        details: 'Code validation disabled'
      }
    }

    const codeValid = await this.validateCodeInContent(item.content)

    return {
      type: 'code_validity',
      passed: codeValid,
      score: codeValid ? 1 : 0.5,
      details: codeValid ? 'Code appears valid' : 'Code may have syntax errors'
    }
  }

  /**
   * Check completeness
   */
  private async checkCompleteness(
    item: KnowledgeItem
  ): Promise<ValidationCheck> {
    const content = item.content
    let score = 1
    const missing: string[] = []

    // Check for essential elements
    if (item.source === 'api' || item.metadata?.type === 'api') {
      if (!content.includes('parameter') && !content.includes('param')) {
        missing.push('parameters')
        score -= 0.2
      }
      if (!content.includes('return') && !content.includes('result')) {
        missing.push('return value')
        score -= 0.2
      }
      if (!content.includes('example') && !content.includes('usage')) {
        missing.push('examples')
        score -= 0.1
      }
    }

    // Check for broken markdown
    const brokenLinks = (content.match(/\[([^\]]*)\]\(\s*\)/g) || []).length
    if (brokenLinks > 0) {
      missing.push(`${brokenLinks} empty links`)
      score -= brokenLinks * 0.1
    }

    return {
      type: 'completeness',
      passed: missing.length === 0,
      score: Math.max(0, score),
      details: missing.length > 0 ? `Missing: ${missing.join(', ')}` : 'Content is complete'
    }
  }

  /**
   * Run a specific validation check
   */
  private async runCheck(
    item: KnowledgeItem,
    checkType: ValidationCheckType,
    options: ValidationOptions
  ): Promise<ValidationCheck> {
    switch (checkType) {
      case 'source_credibility':
        return this.checkSourceCredibility(item)
      case 'content_accuracy':
        return this.checkContentAccuracy(item, options)
      case 'freshness':
        return this.checkFreshness(item, options)
      case 'consistency':
        return this.checkConsistency(item, options)
      case 'cross_reference':
        return this.checkCrossReference(item, options)
      case 'version_compatibility':
        return this.checkVersionCompatibility(item, options)
      case 'code_validity':
        return this.checkCodeValidity(item, options)
      case 'completeness':
        return this.checkCompleteness(item)
      default:
        return {
          type: checkType,
          passed: true,
          score: 0.5,
          details: 'Unknown check type'
        }
    }
  }

  /**
   * Validate code in content
   */
  private async validateCodeInContent(content: string): Promise<boolean> {
    const codeBlocks = content.match(/```[\s\S]*?```/g) || []
    
    for (const block of codeBlocks) {
      const code = block.replace(/```\w*\n?/g, '').trim()
      
      // Basic syntax checks
      const hasMatchingBraces = this.checkMatchingBraces(code)
      if (!hasMatchingBraces) return false

      // Check for obvious errors
      if (code.includes('undefined undefined') || code.includes('null null')) {
        return false
      }
    }

    return true
  }

  /**
   * Check matching braces in code
   */
  private checkMatchingBraces(code: string): boolean {
    const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' }
    const stack: string[] = []

    for (const char of code) {
      if (pairs[char]) {
        stack.push(char)
      } else {
        for (const [open, close] of Object.entries(pairs)) {
          if (char === close) {
            if (stack.pop() !== open) return false
          }
        }
      }
    }

    return stack.length === 0
  }

  /**
   * Detect contradictions in content
   */
  private detectContradictions(content: string): string[] {
    const contradictions: string[] = []
    
    // Pattern: "X is Y" followed by "X is not Y"
    const statements = content.match(/[A-Z][^.]+[.!?]/g) || []
    
    for (let i = 0; i < statements.length; i++) {
      for (let j = i + 1; j < statements.length; j++) {
        if (this.areContradictory(statements[i], statements[j])) {
          contradictions.push(`${statements[i]} vs ${statements[j]}`)
        }
      }
    }

    return contradictions
  }

  /**
   * Check if two statements are contradictory
   */
  private areContradictory(a: string, b: string): boolean {
    const negationWords = ['not', "don't", "doesn't", "isn't", "aren't", "wasn't", "weren't"]
    
    const aLower = a.toLowerCase()
    const bLower = b.toLowerCase()
    
    // Check if one statement has negation and other doesn't
    const aHasNegation = negationWords.some(n => aLower.includes(` ${n} `))
    const bHasNegation = negationWords.some(n => bLower.includes(` ${n} `))
    
    if (aHasNegation !== bHasNegation) {
      // Check if they're talking about the same thing
      const aWords = new Set(aLower.split(/\s+/).filter(w => w.length > 3))
      const bWords = new Set(bLower.split(/\s+/).filter(w => w.length > 3))
      
      let commonWords = 0
      for (const word of aWords) {
        if (bWords.has(word)) commonWords++
      }
      
      if (commonWords >= 2) return true
    }
    
    return false
  }

  /**
   * Extract key points from content
   */
  private extractKeyPoints(content: string): string[] {
    // Extract sentences that contain key information
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10)
    
    return sentences
      .filter(s => 
        /is|are|was|were|will|can|should|must|important|key|main|primary/.test(s.toLowerCase())
      )
      .map(s => s.trim())
  }

  /**
   * Calculate similarity between two strings
   */
  private similarity(a: string, b: string): number {
    const aWords = new Set(a.toLowerCase().split(/\s+/))
    const bWords = new Set(b.toLowerCase().split(/\s+/))
    
    const intersection = [...aWords].filter(w => bWords.has(w))
    const union = new Set([...aWords, ...bWords])
    
    return intersection.length / union.size
  }

  /**
   * AI-based accuracy check
   */
  private async aiAccuracyCheck(content: string): Promise<number> {
    if (!this.zai) return 0.7

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { 
            role: 'system', 
            content: 'Rate the accuracy of this content on a scale of 0-1. Return ONLY a number.' 
          },
          { role: 'user', content: content.substring(0, 500) }
        ],
        thinking: { type: 'disabled' }
      })

      const response = completion.choices[0]?.message?.content || '0.7'
      return parseFloat(response) || 0.7
    } catch {
      return 0.7
    }
  }

  /**
   * Calculate overall confidence
   */
  private calculateConfidence(
    checks: ValidationCheck[],
    strictMode?: boolean
  ): number {
    if (checks.length === 0) return 0.5

    const weights: Record<ValidationCheckType, number> = {
      source_credibility: 0.2,
      content_accuracy: 0.25,
      freshness: 0.15,
      consistency: 0.15,
      cross_reference: 0.1,
      version_compatibility: 0.05,
      code_validity: 0.05,
      completeness: 0.05
    }

    let totalWeight = 0
    let weightedSum = 0

    for (const check of checks) {
      const weight = weights[check.type] || 0.1
      
      if (strictMode && !check.passed) {
        // In strict mode, failed checks have higher impact
        weightedSum += check.score * weight * 0.5
      } else {
        weightedSum += check.score * weight
      }
      
      totalWeight += weight
    }

    return weightedSum / totalWeight
  }

  /**
   * Generate recommendation for failed check
   */
  private generateRecommendation(
    checkType: ValidationCheckType,
    details: string
  ): string {
    const recommendations: Record<ValidationCheckType, string> = {
      source_credibility: 'Consider using a more authoritative source',
      content_accuracy: 'Verify the information with official documentation',
      freshness: 'Look for more recent information on this topic',
      consistency: 'Review and fix inconsistencies in the content',
      cross_reference: 'Verify this information with other reliable sources',
      version_compatibility: 'Check if a more recent version is available',
      code_validity: 'Fix syntax errors in the code examples',
      completeness: 'Add missing information to make the content complete'
    }

    return recommendations[checkType] || 'Review and improve this content'
  }

  /**
   * Add cross-reference data
   */
  addCrossReference(itemId: string, related: KnowledgeItem[]): void {
    this.crossRefCache.set(itemId, related)
  }

  /**
   * Clear caches
   */
  clearCache(): void {
    this.validationCache.clear()
    this.crossRefCache.clear()
  }

  /**
   * Get validation statistics
   */
  getStats(): {
    validationCacheSize: number
    crossRefCacheSize: number
  } {
    return {
      validationCacheSize: this.validationCache.size,
      crossRefCacheSize: this.crossRefCache.size
    }
  }
}

// Singleton instance
let validatorInstance: KnowledgeValidator | null = null

export function getKnowledgeValidator(): KnowledgeValidator {
  if (!validatorInstance) {
    validatorInstance = new KnowledgeValidator()
  }
  return validatorInstance
}

export async function validateKnowledge(
  item: KnowledgeItem,
  options?: ValidationOptions
): Promise<ValidationResult> {
  const validator = getKnowledgeValidator()
  if (!validator['zai']) {
    await validator.initialize()
  }
  return validator.validate(item, options)
}
