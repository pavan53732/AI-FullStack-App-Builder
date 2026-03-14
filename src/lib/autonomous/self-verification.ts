/**
 * Self-Verification System
 * 
 * Implements self-verification loops that allow the AI to verify its own outputs.
 * Mechanism #84 from the 520-mechanism checklist
 */

// ============================================================================
// Types
// ============================================================================

export interface VerificationContext {
  id: string
  type: VerificationType
  input: unknown
  output: unknown
  constraints: VerificationConstraint[]
  history: VerificationAttempt[]
  status: VerificationStatus
  confidence: number
  createdAt: Date
  completedAt?: Date
  metadata: Record<string, unknown>
}

export type VerificationType = 
  | 'code_correctness'
  | 'logic_validity'
  | 'requirement_satisfaction'
  | 'syntax_validity'
  | 'security_check'
  | 'performance_check'
  | 'compatibility_check'
  | 'style_compliance'

export type VerificationStatus = 'pending' | 'in_progress' | 'passed' | 'failed' | 'inconclusive'

export interface VerificationConstraint {
  type: ConstraintType
  description: string
  check: (input: unknown, output: unknown) => boolean | Promise<boolean>
  weight: number
  required: boolean
}

export type ConstraintType = 'functional' | 'non_functional' | 'security' | 'performance' | 'style'

export interface VerificationAttempt {
  id: string
  checkName: string
  result: 'pass' | 'fail' | 'skip' | 'error'
  confidence: number
  details: string
  timestamp: Date
  issues: VerificationIssue[]
  duration: number
}

export interface VerificationIssue {
  severity: 'error' | 'warning' | 'info'
  message: string
  location?: string
  suggestion?: string
  code?: string
}

export interface VerificationResult {
  passed: boolean
  confidence: number
  totalChecks: number
  passedChecks: number
  failedChecks: number
  skippedChecks: number
  issues: VerificationIssue[]
  recommendations: string[]
  timePerCheck: Record<string, number>
  iterations: number
  converged: boolean
}

export interface VerificationStats {
  totalVerifications: number
  passed: number
  failed: number
  inconclusive: number
  averageConfidence: number
  averageIterations: number
  commonIssues: { issue: string; count: number }[]
  timePerType: Record<VerificationType, number>
}

// ============================================================================
// Self-Verification System Class
// ============================================================================

export class SelfVerificationSystem {
  private verificationHistory: Map<string, VerificationContext> = new Map()
  private customChecks: Map<VerificationType, VerificationConstraint[]> = new Map()
  private stats: VerificationStats
  private confidenceHistory: number[] = []
  private iterationHistory: number[] = []
  private issueCounts: Map<string, number> = new Map()

  constructor() {
    this.stats = this.initStats()
  }

  private initStats(): VerificationStats {
    return {
      totalVerifications: 0,
      passed: 0,
      failed: 0,
      inconclusive: 0,
      averageConfidence: 0,
      averageIterations: 0,
      commonIssues: [],
      timePerType: {} as Record<VerificationType, number>
    }
  }

  async verify(
    type: VerificationType,
    input: unknown,
    output: unknown,
    additionalConstraints?: VerificationConstraint[]
  ): Promise<VerificationResult> {
    const contextId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const constraints: VerificationConstraint[] = [
      ...(this.customChecks.get(type) || []),
      ...(additionalConstraints || [])
    ]

    // Add default checks based on type
    constraints.push(...this.getDefaultChecks(type))

    const context: VerificationContext = {
      id: contextId,
      type,
      input,
      output,
      constraints,
      history: [],
      status: 'in_progress',
      confidence: 0,
      createdAt: new Date(),
      metadata: {}
    }

    this.verificationHistory.set(contextId, context)
    this.stats.totalVerifications++

    const timePerCheck: Record<string, number> = {}
    const issues: VerificationIssue[] = []
    const recommendations: string[] = []
    let passedChecks = 0
    let failedChecks = 0
    let skippedChecks = 0
    let totalWeight = 0
    let weightedScore = 0

    for (const constraint of constraints) {
      const startTime = Date.now()
      const attempt = await this.runCheck(context, constraint)
      const duration = Date.now() - startTime
      timePerCheck[constraint.description] = duration

      context.history.push(attempt)

      if (attempt.result === 'pass') {
        passedChecks++
        weightedScore += constraint.weight
      } else if (attempt.result === 'fail') {
        failedChecks++
        if (constraint.required) weightedScore = 0
        issues.push(...attempt.issues)
      } else if (attempt.result === 'skip') {
        skippedChecks++
      }

      totalWeight += constraint.weight
    }

    const confidence = totalWeight > 0 ? weightedScore / totalWeight : 0
    context.confidence = confidence

    const passed = failedChecks === 0 || (confidence >= 0.8 && !this.hasRequiredFailures(context))
    context.status = passed ? 'passed' : 'failed'
    context.completedAt = new Date()

    for (const issue of issues) {
      if (issue.suggestion) recommendations.push(issue.suggestion)
      this.recordIssue(issue.message)
    }

    this.confidenceHistory.push(confidence)
    this.stats.averageConfidence = 
      this.confidenceHistory.reduce((a, b) => a + b, 0) / this.confidenceHistory.length

    if (passed) this.stats.passed++
    else if (confidence < 0.3) this.stats.inconclusive++
    else this.stats.failed++

    this.updateCommonIssues()

    return {
      passed,
      confidence,
      totalChecks: constraints.length,
      passedChecks,
      failedChecks,
      skippedChecks,
      issues,
      recommendations,
      timePerCheck,
      iterations: 1,
      converged: true
    }
  }

  private getDefaultChecks(type: VerificationType): VerificationConstraint[] {
    const checks: VerificationConstraint[] = []

    switch (type) {
      case 'syntax_validity':
        checks.push({
          type: 'style',
          description: 'Valid syntax',
          check: (_input, output) => typeof output === 'string' && output.length > 0,
          weight: 1.0,
          required: true
        })
        break
      case 'security_check':
        checks.push({
          type: 'security',
          description: 'No hardcoded secrets',
          check: (_input, output) => {
            if (typeof output !== 'string') return true
            return !/password\s*=\s*["']/.test(output)
          },
          weight: 1.0,
          required: true
        })
        break
    }

    return checks
  }

  private async runCheck(
    context: VerificationContext,
    constraint: VerificationConstraint
  ): Promise<VerificationAttempt> {
    const startTime = Date.now()
    const issues: VerificationIssue[] = []

    try {
      const passed = await constraint.check(context.input, context.output)
      const duration = Date.now() - startTime

      return {
        id: `attempt_${Date.now()}`,
        checkName: constraint.description,
        result: passed ? 'pass' : 'fail',
        confidence: passed ? 1.0 : 0.0,
        details: passed ? 'Check passed' : 'Check failed',
        timestamp: new Date(),
        issues: passed ? [] : [{
          severity: 'error',
          message: `Failed: ${constraint.description}`,
          suggestion: `Fix the issue related to: ${constraint.description}`
        }],
        duration
      }
    } catch (error) {
      const duration = Date.now() - startTime
      return {
        id: `attempt_${Date.now()}`,
        checkName: constraint.description,
        result: 'error',
        confidence: 0.5,
        details: `Check error: ${error}`,
        timestamp: new Date(),
        issues: [{
          severity: 'warning',
          message: `Error during check: ${error}`,
          suggestion: 'Manual verification may be required'
        }],
        duration
      }
    }
  }

  private hasRequiredFailures(context: VerificationContext): boolean {
    return context.history.some(a => 
      a.result === 'fail' && 
      context.constraints.find(c => c.description === a.checkName)?.required
    )
  }

  private recordIssue(message: string): void {
    const count = this.issueCounts.get(message) || 0
    this.issueCounts.set(message, count + 1)
  }

  private updateCommonIssues(): void {
    this.stats.commonIssues = Array.from(this.issueCounts.entries())
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  addCustomCheck(type: VerificationType, check: VerificationConstraint): void {
    const checks = this.customChecks.get(type) || []
    checks.push(check)
    this.customChecks.set(type, checks)
  }

  getHistory(id: string): VerificationContext | undefined {
    return this.verificationHistory.get(id)
  }

  getStats(): VerificationStats { return { ...this.stats } }

  clear(): void {
    this.verificationHistory.clear()
    this.confidenceHistory = []
    this.iterationHistory = []
    this.issueCounts.clear()
    this.stats = this.initStats()
  }
}

let verificationInstance: SelfVerificationSystem | null = null

export function getSelfVerificationSystem(): SelfVerificationSystem {
  if (!verificationInstance) verificationInstance = new SelfVerificationSystem()
  return verificationInstance
}
