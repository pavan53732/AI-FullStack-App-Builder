/**
 * Verification Prompt Generator - Mechanism #58
 * 
 * Generates test prompts and verification scenarios to validate
 * AI outputs and ensure correctness before acceptance.
 * 
 * Features:
 * - Automated verification prompt generation
 * - Multiple verification strategies
 * - Test case generation
 * - Edge case detection
 * - Verification result analysis
 */

import ZAI from 'z-ai-web-dev-sdk'

// Types
export interface VerificationPrompt {
  id: string
  type: VerificationType
  prompt: string
  expectedOutcome: string
  category: VerificationCategory
  priority: 'critical' | 'high' | 'medium' | 'low'
  generatedFrom: string // What triggered this verification
}

export type VerificationType = 
  | 'correctness'     // Verify factual correctness
  | 'completeness'    // Verify all requirements met
  | 'consistency'     // Verify internal consistency
  | 'edge_case'       // Test edge cases
  | 'security'        // Security verification
  | 'performance'     // Performance verification
  | 'compatibility'   // Compatibility check
  | 'usability'       // Usability verification
  | 'accessibility'   // Accessibility check
  | 'compliance'      // Standard compliance

export type VerificationCategory = 
  | 'functional'
  | 'non_functional'
  | 'integration'
  | 'regression'
  | 'stress'
  | 'user_acceptance'

export interface VerificationResult {
  prompt: VerificationPrompt
  passed: boolean
  score: number // 0-1
  issues: VerificationIssue[]
  suggestions: string[]
  confidence: number
}

export interface VerificationIssue {
  severity: 'critical' | 'major' | 'minor' | 'suggestion'
  description: string
  location?: string
  impact: string
}

export interface PromptGenerationConfig {
  maxPrompts: number
  includeEdgeCases: boolean
  includeSecurityChecks: boolean
  includePerformanceChecks: boolean
  minPriority: 'critical' | 'high' | 'medium' | 'low'
}

const DEFAULT_CONFIG: PromptGenerationConfig = {
  maxPrompts: 20,
  includeEdgeCases: true,
  includeSecurityChecks: true,
  includePerformanceChecks: true,
  minPriority: 'medium'
}

/**
 * Verification Prompt Generator
 */
export class VerificationPromptGenerator {
  private zai: any = null
  private generatedPrompts: VerificationPrompt[] = []
  private verificationResults: VerificationResult[] = []
  private config: PromptGenerationConfig
  private initialized = false

  constructor(config?: Partial<PromptGenerationConfig>) {
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
   * Generate verification prompts for output
   */
  async generatePrompts(
    output: string,
    requirements: string[],
    context?: string
  ): Promise<VerificationPrompt[]> {
    await this.init()

    const prompts: VerificationPrompt[] = []
    const promptId = Date.now()

    // 1. Correctness verification
    prompts.push(...await this.generateCorrectnessPrompts(output, requirements))

    // 2. Completeness verification
    prompts.push(...await this.generateCompletenessPrompts(output, requirements))

    // 3. Consistency verification
    prompts.push(...await this.generateConsistencyPrompts(output))

    // 4. Edge case verification
    if (this.config.includeEdgeCases) {
      prompts.push(...await this.generateEdgeCasePrompts(output, requirements))
    }

    // 5. Security verification
    if (this.config.includeSecurityChecks) {
      prompts.push(...await this.generateSecurityPrompts(output))
    }

    // 6. Performance verification
    if (this.config.includePerformanceChecks) {
      prompts.push(...await this.generatePerformancePrompts(output))
    }

    // Filter by minimum priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    const minPriorityLevel = priorityOrder[this.config.minPriority]
    
    const filtered = prompts.filter(p => priorityOrder[p.priority] <= minPriorityLevel)

    // Sort by priority and limit
    filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    const limited = filtered.slice(0, this.config.maxPrompts)

    this.generatedPrompts = limited
    return limited
  }

  /**
   * Generate correctness verification prompts
   */
  private async generateCorrectnessPrompts(
    output: string,
    requirements: string[]
  ): Promise<VerificationPrompt[]> {
    const prompts: VerificationPrompt[] = []

    for (const req of requirements) {
      prompts.push({
        id: `correct_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'correctness',
        prompt: `Verify that the output correctly implements: "${req}". Check for any factual errors, incorrect logic, or missing functionality.`,
        expectedOutcome: `All aspects of "${req}" are correctly implemented`,
        category: 'functional',
        priority: 'critical',
        generatedFrom: `Requirement: ${req}`
      })
    }

    return prompts
  }

  /**
   * Generate completeness verification prompts
   */
  private async generateCompletenessPrompts(
    output: string,
    requirements: string[]
  ): Promise<VerificationPrompt[]> {
    const prompts: VerificationPrompt[] = []

    prompts.push({
      id: `complete_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'completeness',
      prompt: `Check if all requirements have been addressed. Requirements: ${requirements.join(', ')}. Identify any missing or incomplete implementations.`,
      expectedOutcome: 'All requirements are fully implemented',
      category: 'functional',
      priority: 'high',
      generatedFrom: 'Completeness check for all requirements'
    })

    prompts.push({
      id: `complete_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'completeness',
      prompt: 'Verify that error handling is complete. Check for unhandled edge cases, missing error messages, and proper fallback behavior.',
      expectedOutcome: 'Complete error handling with proper messages',
      category: 'non_functional',
      priority: 'medium',
      generatedFrom: 'Error handling completeness check'
    })

    return prompts
  }

  /**
   * Generate consistency verification prompts
   */
  private async generateConsistencyPrompts(
    output: string
  ): Promise<VerificationPrompt[]> {
    const prompts: VerificationPrompt[] = []

    prompts.push({
      id: `consist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'consistency',
      prompt: 'Check for internal consistency in the output. Verify naming conventions, coding style, patterns, and architectural decisions are consistent throughout.',
      expectedOutcome: 'Consistent style and patterns throughout',
      category: 'non_functional',
      priority: 'medium',
      generatedFrom: 'Internal consistency check'
    })

    prompts.push({
      id: `consist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'consistency',
      prompt: 'Verify that there are no contradictions in the output. Check for conflicting logic, contradictory statements, or incompatible patterns.',
      expectedOutcome: 'No contradictions or conflicts',
      category: 'functional',
      priority: 'high',
      generatedFrom: 'Contradiction detection'
    })

    return prompts
  }

  /**
   * Generate edge case verification prompts
   */
  private async generateEdgeCasePrompts(
    output: string,
    requirements: string[]
  ): Promise<VerificationPrompt[]> {
    const prompts: VerificationPrompt[] = []

    const edgeCases = [
      'empty input',
      'null/undefined values',
      'extremely large inputs',
      'special characters',
      'concurrent access',
      'network failures',
      'timeout scenarios',
      'boundary conditions'
    ]

    for (const edgeCase of edgeCases) {
      prompts.push({
        id: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'edge_case',
        prompt: `Test edge case: ${edgeCase}. Verify the output handles this case gracefully with appropriate error handling or default behavior.`,
        expectedOutcome: `Graceful handling of ${edgeCase}`,
        category: 'stress',
        priority: 'medium',
        generatedFrom: `Edge case: ${edgeCase}`
      })
    }

    return prompts
  }

  /**
   * Generate security verification prompts
   */
  private async generateSecurityPrompts(
    output: string
  ): Promise<VerificationPrompt[]> {
    const prompts: VerificationPrompt[] = []

    const securityChecks = [
      { check: 'SQL injection vulnerabilities', desc: 'Check for unparameterized queries' },
      { check: 'XSS vulnerabilities', desc: 'Check for unescaped user input in output' },
      { check: 'authentication bypass', desc: 'Verify all protected routes require auth' },
      { check: 'authorization issues', desc: 'Verify proper permission checks' },
      { check: 'sensitive data exposure', desc: 'Check for exposed secrets or PII' },
      { check: 'CSRF vulnerabilities', desc: 'Verify CSRF tokens are used' }
    ]

    for (const { check, desc } of securityChecks) {
      prompts.push({
        id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'security',
        prompt: `Security check: ${check}. ${desc}. Verify the output does not have this vulnerability.`,
        expectedOutcome: `No ${check} found`,
        category: 'non_functional',
        priority: 'critical',
        generatedFrom: `Security: ${check}`
      })
    }

    return prompts
  }

  /**
   * Generate performance verification prompts
   */
  private async generatePerformancePrompts(
    output: string
  ): Promise<VerificationPrompt[]> {
    const prompts: VerificationPrompt[] = []

    prompts.push({
      id: `perf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'performance',
      prompt: 'Check for potential performance issues: N+1 queries, unnecessary loops, memory leaks, blocking operations, unoptimized algorithms.',
      expectedOutcome: 'No obvious performance anti-patterns',
      category: 'non_functional',
      priority: 'medium',
      generatedFrom: 'Performance anti-pattern check'
    })

    prompts.push({
      id: `perf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'performance',
      prompt: 'Verify scalability: Will the output handle increased load? Check for bottlenecks, resource limitations, and scaling issues.',
      expectedOutcome: 'Scalable implementation',
      category: 'stress',
      priority: 'low',
      generatedFrom: 'Scalability check'
    })

    return prompts
  }

  /**
   * Run verification using generated prompts
   */
  async verify(
    output: string,
    prompts?: VerificationPrompt[]
  ): Promise<VerificationResult[]> {
    await this.init()

    const promptsToUse = prompts || this.generatedPrompts
    const results: VerificationResult[] = []

    for (const prompt of promptsToUse) {
      const result = await this.runVerification(output, prompt)
      results.push(result)
    }

    this.verificationResults = results
    return results
  }

  /**
   * Run single verification
   */
  private async runVerification(
    output: string,
    prompt: VerificationPrompt
  ): Promise<VerificationResult> {
    try {
      const response = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a verification engine. Analyze the output against the verification prompt and respond with:
1. PASSED or FAILED
2. A score from 0-1
3. Any issues found (with severity)
4. Suggestions for improvement

Format your response as JSON:
{
  "passed": boolean,
  "score": number,
  "issues": [{"severity": "critical|major|minor|suggestion", "description": "string", "impact": "string"}],
  "suggestions": ["string"],
  "confidence": number
}`
          },
          {
            role: 'user',
            content: `Output to verify:\n${output.slice(0, 2000)}\n\nVerification prompt:\n${prompt.prompt}`
          }
        ],
        thinking: { type: 'disabled' }
      })

      const content = response.choices[0]?.message?.content || ''
      
      // Parse JSON response
      try {
        const parsed = JSON.parse(content)
        return {
          prompt,
          passed: parsed.passed ?? false,
          score: parsed.score ?? 0,
          issues: parsed.issues || [],
          suggestions: parsed.suggestions || [],
          confidence: parsed.confidence ?? 0.5
        }
      } catch {
        // Fallback if JSON parsing fails
        const passed = content.toLowerCase().includes('passed')
        return {
          prompt,
          passed,
          score: passed ? 0.8 : 0.4,
          issues: passed ? [] : [{
            severity: 'major',
            description: 'Verification failed',
            impact: 'Output may not meet requirements'
          }],
          suggestions: ['Review and fix identified issues'],
          confidence: 0.6
        }
      }
    } catch (error) {
      return {
        prompt,
        passed: false,
        score: 0,
        issues: [{
          severity: 'critical',
          description: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          impact: 'Could not complete verification'
        }],
        suggestions: ['Retry verification'],
        confidence: 0
      }
    }
  }

  /**
   * Get verification summary
   */
  getVerificationSummary(): {
    total: number
    passed: number
    failed: number
    averageScore: number
    criticalIssues: number
    overallPassed: boolean
  } {
    const total = this.verificationResults.length
    const passed = this.verificationResults.filter(r => r.passed).length
    const failed = total - passed
    const averageScore = total > 0 
      ? this.verificationResults.reduce((sum, r) => sum + r.score, 0) / total 
      : 0
    const criticalIssues = this.verificationResults.reduce(
      (sum, r) => sum + r.issues.filter(i => i.severity === 'critical').length, 
      0
    )

    return {
      total,
      passed,
      failed,
      averageScore,
      criticalIssues,
      overallPassed: passed === total && criticalIssues === 0
    }
  }

  /**
   * Get all generated prompts
   */
  getPrompts(): VerificationPrompt[] {
    return this.generatedPrompts
  }

  /**
   * Get verification results
   */
  getResults(): VerificationResult[] {
    return this.verificationResults
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.generatedPrompts = []
    this.verificationResults = []
  }
}

// Singleton
let verificationGeneratorInstance: VerificationPromptGenerator | null = null

export function getVerificationPromptGenerator(
  config?: Partial<PromptGenerationConfig>
): VerificationPromptGenerator {
  if (!verificationGeneratorInstance) {
    verificationGeneratorInstance = new VerificationPromptGenerator(config)
  }
  return verificationGeneratorInstance
}

/**
 * Quick verification prompt generation
 */
export async function generateVerificationPrompts(
  output: string,
  requirements: string[]
): Promise<VerificationPrompt[]> {
  const generator = new VerificationPromptGenerator()
  await generator.init()
  return generator.generatePrompts(output, requirements)
}

/**
 * Quick verification
 */
export async function verifyOutput(
  output: string,
  requirements: string[]
): Promise<{
  passed: boolean
  results: VerificationResult[]
  summary: ReturnType<VerificationPromptGenerator['getVerificationSummary']>
}> {
  const generator = new VerificationPromptGenerator()
  await generator.init()
  
  const prompts = await generator.generatePrompts(output, requirements)
  const results = await generator.verify(output, prompts)
  const summary = generator.getVerificationSummary()

  return {
    passed: summary.overallPassed,
    results,
    summary
  }
}
