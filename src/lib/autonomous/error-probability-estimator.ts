/**
 * Error Probability Estimator - Mechanism #59
 * 
 * Predicts the likelihood of errors in AI outputs before execution,
 * enabling proactive error prevention and risk mitigation.
 * 
 * Features:
 * - Error probability scoring
 * - Risk factor identification
 * - Historical error analysis
 * - Predictive error detection
 * - Mitigation recommendations
 */

import ZAI from 'z-ai-web-dev-sdk'

// Types
export interface ErrorProbability {
  id: string
  type: ErrorType
  probability: number // 0-1
  severity: 'critical' | 'major' | 'minor'
  description: string
  location?: string
  mitigation: string[]
  riskFactors: RiskFactor[]
}

export type ErrorType = 
  | 'syntax_error'
  | 'type_error'
  | 'runtime_error'
  | 'logic_error'
  | 'security_error'
  | 'performance_error'
  | 'integration_error'
  | 'dependency_error'
  | 'configuration_error'
  | 'resource_error'
  | 'timeout_error'
  | 'memory_error'
  | 'network_error'
  | 'validation_error'
  | 'authentication_error'

export interface RiskFactor {
  name: string
  weight: number
  present: boolean
  description: string
}

export interface ErrorEstimationResult {
  overallProbability: number
  errorProbabilities: ErrorProbability[]
  riskLevel: 'high' | 'medium' | 'low'
  confidence: number
  recommendations: string[]
  historicalContext?: HistoricalContext
}

export interface HistoricalContext {
  similarCases: number
  errorRate: number
  commonErrorTypes: ErrorType[]
}

export interface ErrorPattern {
  pattern: string
  errorType: ErrorType
  frequency: number
  contexts: string[]
}

export interface EstimationConfig {
  confidenceThreshold: number
  historyWeight: number
  staticAnalysisWeight: number
  semanticAnalysisWeight: number
}

const DEFAULT_CONFIG: EstimationConfig = {
  confidenceThreshold: 0.7,
  historyWeight: 0.3,
  staticAnalysisWeight: 0.4,
  semanticAnalysisWeight: 0.3
}

/**
 * Error Probability Estimator
 */
export class ErrorProbabilityEstimator {
  private zai: any = null
  private errorHistory: Map<string, ErrorPattern> = new Map()
  private config: EstimationConfig
  private initialized = false

  // Common error patterns
  private readonly errorPatterns: Array<{
    pattern: RegExp
    type: ErrorType
    severity: 'critical' | 'major' | 'minor'
    description: string
  }> = [
    { pattern: /undefined\s+is\s+not/, type: 'type_error', severity: 'major', description: 'Undefined variable access' },
    { pattern: /cannot\s+read\s+property/, type: 'type_error', severity: 'major', description: 'Property access on null/undefined' },
    { pattern: /is\s+not\s+a\s+function/, type: 'type_error', severity: 'major', description: 'Calling non-function value' },
    { pattern: /unexpected\s+token/, type: 'syntax_error', severity: 'critical', description: 'Syntax error' },
    { pattern: /missing\s+\)/, type: 'syntax_error', severity: 'critical', description: 'Missing closing parenthesis' },
    { pattern: /missing\s+}/, type: 'syntax_error', severity: 'critical', description: 'Missing closing brace' },
    { pattern: /ReferenceError/, type: 'runtime_error', severity: 'major', description: 'Reference error' },
    { pattern: /TypeError/, type: 'type_error', severity: 'major', description: 'Type error' },
    { pattern: /SyntaxError/, type: 'syntax_error', severity: 'critical', description: 'Syntax error' },
    { pattern: /RangeError/, type: 'runtime_error', severity: 'minor', description: 'Range error' },
    { pattern: /JSON\.parse/, type: 'validation_error', severity: 'major', description: 'JSON parse error' },
    { pattern: /ENOENT/, type: 'resource_error', severity: 'major', description: 'File not found' },
    { pattern: /ECONNREFUSED/, type: 'network_error', severity: 'major', description: 'Connection refused' },
    { pattern: /ETIMEDOUT/, type: 'timeout_error', severity: 'minor', description: 'Timeout error' },
    { pattern: /ENOMEM/, type: 'memory_error', severity: 'critical', description: 'Out of memory' },
    { pattern: /401|Unauthorized/, type: 'authentication_error', severity: 'critical', description: 'Authentication error' },
    { pattern: /403|Forbidden/, type: 'authentication_error', severity: 'critical', description: 'Authorization error' },
    { pattern: /500|Internal Server Error/, type: 'runtime_error', severity: 'major', description: 'Server error' },
    { pattern: /eval\(/, type: 'security_error', severity: 'critical', description: 'Potential code injection' },
    { pattern: /innerHTML\s*=/, type: 'security_error', severity: 'major', description: 'Potential XSS' },
    { pattern: /SELECT\s+.*FROM/i, type: 'security_error', severity: 'major', description: 'Potential SQL injection' }
  ]

  // Risk factors
  private readonly riskFactors: RiskFactor[] = [
    { name: 'complex_nesting', weight: 0.15, present: false, description: 'Deeply nested code structures' },
    { name: 'missing_error_handling', weight: 0.2, present: false, description: 'Missing try-catch blocks' },
    { name: 'async_without_await', weight: 0.15, present: false, description: 'Async functions without await' },
    { name: 'unvalidated_input', weight: 0.2, present: false, description: 'Input not validated' },
    { name: 'external_dependencies', weight: 0.1, present: false, description: 'External API calls' },
    { name: 'state_mutations', weight: 0.1, present: false, description: 'Direct state mutations' },
    { name: 'circular_references', weight: 0.15, present: false, description: 'Potential circular references' },
    { name: 'resource_intensive', weight: 0.1, present: false, description: 'Resource-intensive operations' },
    { name: 'concurrent_access', weight: 0.15, present: false, description: 'Concurrent data access' },
    { name: 'dynamic_code', weight: 0.2, present: false, description: 'Dynamic code generation' }
  ]

  constructor(config?: Partial<EstimationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Initialize the estimator
   */
  async init(): Promise<void> {
    if (this.initialized) return
    this.zai = await ZAI.create()
    this.initialized = true
  }

  /**
   * Estimate error probability for output
   */
  async estimate(output: string, context?: string): Promise<ErrorEstimationResult> {
    await this.init()

    const errorProbabilities: ErrorProbability[] = []

    // 1. Static analysis
    const staticErrors = await this.staticAnalysis(output)
    errorProbabilities.push(...staticErrors)

    // 2. Pattern matching
    const patternErrors = this.patternMatching(output)
    errorProbabilities.push(...patternErrors)

    // 3. Risk factor analysis
    const riskFactors = this.analyzeRiskFactors(output)
    
    // 4. Semantic analysis
    const semanticErrors = await this.semanticAnalysis(output, context)
    errorProbabilities.push(...semanticErrors)

    // 5. Calculate overall probability
    const overallProbability = this.calculateOverallProbability(
      errorProbabilities,
      riskFactors
    )

    // 6. Determine risk level
    const riskLevel = this.determineRiskLevel(overallProbability)

    // 7. Generate recommendations
    const recommendations = this.generateRecommendations(errorProbabilities, riskFactors)

    // 8. Get historical context
    const historicalContext = this.getHistoricalContext(output)

    return {
      overallProbability,
      errorProbabilities,
      riskLevel,
      confidence: this.calculateConfidence(errorProbabilities),
      recommendations,
      historicalContext
    }
  }

  /**
   * Static analysis of output
   */
  private async staticAnalysis(output: string): Promise<ErrorProbability[]> {
    const errors: ErrorProbability[] = []

    // Check for syntax issues
    try {
      // Check for unmatched brackets
      const openBrackets = (output.match(/{/g) || []).length
      const closeBrackets = (output.match(/}/g) || []).length
      if (openBrackets !== closeBrackets) {
        errors.push({
          id: `err_${Date.now()}_bracket`,
          type: 'syntax_error',
          probability: 0.95,
          severity: 'critical',
          description: `Unmatched braces: ${openBrackets} opening, ${closeBrackets} closing`,
          mitigation: ['Add missing closing braces', 'Check for proper block structure']
        } as ErrorProbability & { mitigation: string[] })
      }

      // Check for unmatched parentheses
      const openParens = (output.match(/\(/g) || []).length
      const closeParens = (output.match(/\)/g) || []).length
      if (openParens !== closeParens) {
        errors.push({
          id: `err_${Date.now()}_paren`,
          type: 'syntax_error',
          probability: 0.9,
          severity: 'critical',
          description: `Unmatched parentheses: ${openParens} opening, ${closeParens} closing`,
          mitigation: ['Add missing closing parentheses', 'Check function calls and expressions']
        } as ErrorProbability & { mitigation: string[] })
      }

      // Check for common syntax errors
      if (output.includes(';;')) {
        errors.push({
          id: `err_${Date.now()}_double_semi`,
          type: 'syntax_error',
          probability: 0.4,
          severity: 'minor',
          description: 'Double semicolon detected',
          mitigation: ['Remove extra semicolons']
        } as ErrorProbability & { mitigation: string[] })
      }
    } catch (error) {
      // Analysis error
    }

    return errors
  }

  /**
   * Pattern matching for known errors
   */
  private patternMatching(output: string): ErrorProbability[] {
    const errors: ErrorProbability[] = []

    for (const { pattern, type, severity, description } of this.errorPatterns) {
      if (pattern.test(output)) {
        errors.push({
          id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type,
          probability: 0.85,
          severity,
          description,
          mitigation: this.getMitigationForType(type)
        } as ErrorProbability & { mitigation: string[] })
      }
    }

    return errors
  }

  /**
   * Analyze risk factors
   */
  private analyzeRiskFactors(output: string): RiskFactor[] {
    const factors = this.riskFactors.map(factor => {
      let present = false

      switch (factor.name) {
        case 'complex_nesting':
          present = this.checkDeepNesting(output)
          break
        case 'missing_error_handling':
          present = !output.includes('try') && !output.includes('catch')
          break
        case 'async_without_await':
          present = output.includes('async') && !output.includes('await')
          break
        case 'unvalidated_input':
          present = output.includes('params') && !output.includes('validate')
          break
        case 'external_dependencies':
          present = output.includes('fetch') || output.includes('axios')
          break
        case 'state_mutations':
          present = output.includes('=') && !output.includes('const')
          break
        case 'circular_references':
          present = this.checkPotentialCircularRef(output)
          break
        case 'resource_intensive':
          present = output.includes('while') || output.includes('for')
          break
        case 'concurrent_access':
          present = output.includes('Promise.all') || output.includes('Promise.race')
          break
        case 'dynamic_code':
          present = output.includes('eval') || output.includes('Function(')
          break
      }

      return { ...factor, present }
    })

    return factors
  }

  /**
   * Check for deep nesting
   */
  private checkDeepNesting(output: string): boolean {
    let maxIndent = 0
    let currentIndent = 0

    for (const char of output) {
      if (char === '{') {
        currentIndent++
        maxIndent = Math.max(maxIndent, currentIndent)
      } else if (char === '}') {
        currentIndent--
      }
    }

    return maxIndent > 5
  }

  /**
   * Check for potential circular references
   */
  private checkPotentialCircularRef(output: string): boolean {
    // Simple heuristic: check for mutual imports
    const imports = output.match(/import.*from\s+['"]([^'"]+)['"]/g) || []
    return imports.length > 10 // High number of imports might indicate circular deps
  }

  /**
   * Semantic analysis using AI
   */
  private async semanticAnalysis(
    output: string,
    context?: string
  ): Promise<ErrorProbability[]> {
    const errors: ErrorProbability[] = []

    try {
      const response = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `Analyze this code/output for potential errors. Respond with a JSON array of potential errors:
[{
  "type": "syntax_error|type_error|runtime_error|logic_error|security_error|performance_error|integration_error",
  "probability": 0.0-1.0,
  "severity": "critical|major|minor",
  "description": "description of the potential error",
  "mitigation": ["suggestion1", "suggestion2"]
}]

If no errors found, return [].`
          },
          {
            role: 'user',
            content: `Code:\n${output.slice(0, 2000)}${context ? `\n\nContext:\n${context.slice(0, 500)}` : ''}`
          }
        ],
        thinking: { type: 'disabled' }
      })

      const content = response.choices[0]?.message?.content || '[]'
      
      try {
        const parsed = JSON.parse(content)
        for (const err of parsed) {
          errors.push({
            id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            type: err.type,
            probability: err.probability,
            severity: err.severity,
            description: err.description,
            mitigation: err.mitigation || []
          } as ErrorProbability & { mitigation: string[] })
        }
      } catch {
        // Parse error, continue
      }
    } catch {
      // AI error, continue
    }

    return errors
  }

  /**
   * Get mitigation suggestions for error type
   */
  private getMitigationForType(type: ErrorType): string[] {
    const mitigations: Record<ErrorType, string[]> = {
      syntax_error: ['Fix syntax errors', 'Check for missing brackets', 'Validate code structure'],
      type_error: ['Add type checking', 'Validate variable types', 'Use type guards'],
      runtime_error: ['Add error handling', 'Check for null/undefined', 'Validate inputs'],
      logic_error: ['Review logic flow', 'Add unit tests', 'Use assertions'],
      security_error: ['Sanitize inputs', 'Use prepared statements', 'Escape output'],
      performance_error: ['Optimize queries', 'Use caching', 'Reduce complexity'],
      integration_error: ['Check API compatibility', 'Handle API errors', 'Validate responses'],
      dependency_error: ['Check dependency versions', 'Handle missing dependencies'],
      configuration_error: ['Validate config', 'Use defaults', 'Check environment'],
      resource_error: ['Check file existence', 'Handle missing resources'],
      timeout_error: ['Add timeouts', 'Implement retries', 'Use background jobs'],
      memory_error: ['Optimize memory usage', 'Use streaming', 'Clean up resources'],
      network_error: ['Add retry logic', 'Handle disconnections', 'Use fallbacks'],
      validation_error: ['Add input validation', 'Use schemas', 'Check constraints'],
      authentication_error: ['Check credentials', 'Handle token expiry', 'Implement refresh']
    }

    return mitigations[type] || ['Review and fix the error']
  }

  /**
   * Calculate overall probability
   */
  private calculateOverallProbability(
    errors: ErrorProbability[],
    riskFactors: RiskFactor[]
  ): number {
    // Start with average error probability
    let probability = 0
    if (errors.length > 0) {
      probability = errors.reduce((sum, e) => sum + e.probability, 0) / errors.length
    }

    // Add risk factor contribution
    const riskContribution = riskFactors
      .filter(f => f.present)
      .reduce((sum, f) => sum + f.weight, 0)

    // Combine
    return Math.min(probability * 0.7 + riskContribution, 1)
  }

  /**
   * Determine risk level
   */
  private determineRiskLevel(probability: number): 'high' | 'medium' | 'low' {
    if (probability >= 0.6) return 'high'
    if (probability >= 0.3) return 'medium'
    return 'low'
  }

  /**
   * Calculate confidence in estimation
   */
  private calculateConfidence(errors: ErrorProbability[]): number {
    if (errors.length === 0) return 0.5

    // More errors found = higher confidence in negative assessment
    // Fewer errors = lower confidence (might have missed something)
    const errorCount = errors.length
    const avgProbability = errors.reduce((sum, e) => sum + e.probability, 0) / errors.length

    if (avgProbability > 0.8) return 0.9
    if (avgProbability > 0.5) return 0.7
    if (errorCount > 5) return 0.8
    return 0.6
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    errors: ErrorProbability[],
    riskFactors: RiskFactor[]
  ): string[] {
    const recommendations: string[] = []

    // Add error-based recommendations
    const criticalErrors = errors.filter(e => e.severity === 'critical')
    if (criticalErrors.length > 0) {
      recommendations.push('⚠️ Critical errors detected - review before execution')
    }

    // Add risk factor recommendations
    const presentRisks = riskFactors.filter(f => f.present)
    if (presentRisks.some(f => f.name === 'missing_error_handling')) {
      recommendations.push('Add try-catch blocks for error handling')
    }
    if (presentRisks.some(f => f.name === 'unvalidated_input')) {
      recommendations.push('Validate all user inputs')
    }
    if (presentRisks.some(f => f.name === 'security_error')) {
      recommendations.push('Review security vulnerabilities')
    }

    // General recommendations
    if (errors.length > 3) {
      recommendations.push('Consider refactoring to reduce complexity')
    }

    return recommendations
  }

  /**
   * Get historical context
   */
  private getHistoricalContext(output: string): HistoricalContext {
    // Check for similar patterns in history
    let similarCases = 0
    let errorRate = 0
    const commonErrorTypes: ErrorType[] = []

    for (const [_, pattern] of this.errorHistory) {
      if (output.includes(pattern.pattern)) {
        similarCases++
        errorRate += pattern.frequency
        if (!commonErrorTypes.includes(pattern.errorType)) {
          commonErrorTypes.push(pattern.errorType)
        }
      }
    }

    return {
      similarCases,
      errorRate: similarCases > 0 ? errorRate / similarCases : 0,
      commonErrorTypes
    }
  }

  /**
   * Record an error occurrence
   */
  recordError(pattern: string, errorType: ErrorType, context: string): void {
    const existing = this.errorHistory.get(pattern)
    if (existing) {
      existing.frequency++
      if (!existing.contexts.includes(context)) {
        existing.contexts.push(context)
      }
    } else {
      this.errorHistory.set(pattern, {
        pattern,
        errorType,
        frequency: 1,
        contexts: [context]
      })
    }
  }

  /**
   * Get error history
   */
  getErrorHistory(): Map<string, ErrorPattern> {
    return this.errorHistory
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.errorHistory.clear()
  }
}

// Singleton
let estimatorInstance: ErrorProbabilityEstimator | null = null

export function getErrorProbabilityEstimator(
  config?: Partial<EstimationConfig>
): ErrorProbabilityEstimator {
  if (!estimatorInstance) {
    estimatorInstance = new ErrorProbabilityEstimator(config)
  }
  return estimatorInstance
}

/**
 * Quick error probability estimation
 */
export async function estimateErrorProbability(
  output: string
): Promise<ErrorEstimationResult> {
  const estimator = new ErrorProbabilityEstimator()
  await estimator.init()
  return estimator.estimate(output)
}
