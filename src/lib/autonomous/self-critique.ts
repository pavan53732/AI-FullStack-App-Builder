/**
 * Self-Critique Engine
 * 
 * AI self-evaluation and improvement system:
 * - Output validation
 * - Error detection
 * - Quality scoring
 * - Improvement suggestions
 * - Iterative refinement
 * - Confidence calibration
 */

import ZAI from 'z-ai-web-dev-sdk'

export interface CritiqueResult {
  id: string
  targetType: 'code' | 'plan' | 'decision' | 'architecture' | 'output'
  target: string
  overallScore: number
  dimensions: CritiqueDimension[]
  issues: CritiqueIssue[]
  improvements: CritiqueImprovement[]
  confidence: number
  metadata: {
    duration: number
    modelUsed: string
    iterations: number
  }
}

export interface CritiqueDimension {
  name: string
  score: number
  weight: number
  feedback: string
  subScores: Record<string, number>
}

export interface CritiqueIssue {
  id: string
  severity: 'critical' | 'major' | 'minor' | 'suggestion'
  category: string
  location?: string
  description: string
  impact: string
  fix?: string
}

export interface CritiqueImprovement {
  id: string
  priority: 'high' | 'medium' | 'low'
  category: string
  current: string
  suggested: string
  rationale: string
  effort: 'small' | 'medium' | 'large'
}

export interface RefinementIteration {
  iteration: number
  input: string
  output: string
  critique: CritiqueResult
  changes: string[]
}

// Dimension configurations
const CODE_DIMENSIONS = [
  { name: 'correctness', weight: 0.3, subDimensions: ['syntax', 'logic', 'types'] },
  { name: 'quality', weight: 0.2, subDimensions: ['readability', 'maintainability', 'patterns'] },
  { name: 'security', weight: 0.2, subDimensions: ['injection', 'auth', 'data-protection'] },
  { name: 'performance', weight: 0.15, subDimensions: ['algorithms', 'memory', 'async'] },
  { name: 'completeness', weight: 0.15, subDimensions: ['edge-cases', 'error-handling', 'tests'] }
]

const PLAN_DIMENSIONS = [
  { name: 'feasibility', weight: 0.3, subDimensions: ['resources', 'timeline', 'dependencies'] },
  { name: 'completeness', weight: 0.25, subDimensions: ['requirements', 'edge-cases', 'documentation'] },
  { name: 'clarity', weight: 0.2, subDimensions: ['steps', 'owners', 'criteria'] },
  { name: 'risk-management', weight: 0.15, subDimensions: ['identification', 'mitigation', 'contingency'] },
  { name: 'alignment', weight: 0.1, subDimensions: ['goals', 'constraints', 'priorities'] }
]

const DECISION_DIMENSIONS = [
  { name: 'rationale', weight: 0.3, subDimensions: ['evidence', 'reasoning', 'alternatives'] },
  { name: 'impact', weight: 0.25, subDimensions: ['positive', 'negative', 'tradeoffs'] },
  { name: 'reversibility', weight: 0.2, subDimensions: ['rollback', 'migration', 'dependencies'] },
  { name: 'timing', weight: 0.15, subDimensions: ['urgency', 'opportunity', 'readiness'] },
  { name: 'stakeholder', weight: 0.1, subDimensions: ['buy-in', 'communication', 'support'] }
]

/**
 * Self-Critique Engine
 */
export class SelfCritiqueEngine {
  private zai: any = null
  private critiqueHistory: Map<string, CritiqueResult[]> = new Map()
  private refinementHistory: Map<string, RefinementIteration[]> = new Map()

  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
  }

  /**
   * Critique code
   */
  async critiqueCode(code: string, context?: {
    language?: string
    framework?: string
    requirements?: string[]
  }): Promise<CritiqueResult> {
    if (!this.zai) await this.initialize()
    
    const startTime = Date.now()
    const id = `critique_${Date.now().toString(36)}`
    
    // Generate critique using AI
    const critiquePrompt = this.buildCodeCritiquePrompt(code, context)
    
    const completion = await this.zai.chat.completions.create({
      messages: [
        { 
          role: 'assistant', 
          content: `You are an expert code reviewer. Critique the provided code thoroughly.
Return your analysis in JSON format with:
1. dimensions: Array of {name, score (0-100), feedback, subScores}
2. issues: Array of {severity, category, location, description, impact, fix}
3. improvements: Array of {priority, category, current, suggested, rationale, effort}
4. overallScore: Number 0-100
5. confidence: Number 0-1

Be critical but constructive. Focus on actionable feedback.`
        },
        { role: 'user', content: critiquePrompt }
      ],
      thinking: { type: 'disabled' }
    })
    
    const response = completion.choices[0]?.message?.content || ''
    
    // Parse the response
    const parsed = this.parseCritiqueResponse(response, CODE_DIMENSIONS)
    
    const result: CritiqueResult = {
      id,
      targetType: 'code',
      target: code.slice(0, 500),
      overallScore: parsed.overallScore,
      dimensions: parsed.dimensions,
      issues: parsed.issues,
      improvements: parsed.improvements,
      confidence: parsed.confidence,
      metadata: {
        duration: Date.now() - startTime,
        modelUsed: 'z-ai',
        iterations: 1
      }
    }
    
    // Store in history
    this.addToHistory(id, result)
    
    return result
  }

  /**
   * Critique a plan
   */
  async critiquePlan(plan: string, requirements?: string[]): Promise<CritiqueResult> {
    if (!this.zai) await this.initialize()
    
    const startTime = Date.now()
    const id = `critique_${Date.now().toString(36)}`
    
    const completion = await this.zai.chat.completions.create({
      messages: [
        { 
          role: 'assistant', 
          content: `You are an expert project planner. Critique the provided plan.
Return JSON with dimensions, issues, improvements, overallScore, and confidence.

Focus on:
- Missing steps
- Dependency issues
- Unrealistic estimates
- Risk factors
- Missing requirements`
        },
        { 
          role: 'user', 
          content: `Plan to critique:\n${plan}\n\nRequirements to satisfy:\n${requirements?.join('\n') || 'Not specified'}`
        }
      ],
      thinking: { type: 'disabled' }
    })
    
    const response = completion.choices[0]?.message?.content || ''
    const parsed = this.parseCritiqueResponse(response, PLAN_DIMENSIONS)
    
    return {
      id,
      targetType: 'plan',
      target: plan.slice(0, 500),
      overallScore: parsed.overallScore,
      dimensions: parsed.dimensions,
      issues: parsed.issues,
      improvements: parsed.improvements,
      confidence: parsed.confidence,
      metadata: {
        duration: Date.now() - startTime,
        modelUsed: 'z-ai',
        iterations: 1
      }
    }
  }

  /**
   * Critique a decision
   */
  async critiqueDecision(
    decision: string,
    context: {
      options?: string[]
      constraints?: string[]
      goals?: string[]
    }
  ): Promise<CritiqueResult> {
    if (!this.zai) await this.initialize()
    
    const startTime = Date.now()
    const id = `critique_${Date.now().toString(36)}`
    
    const completion = await this.zai.chat.completions.create({
      messages: [
        { 
          role: 'assistant', 
          content: `You are a decision analyst. Critique the provided decision.
Consider:
- Is the reasoning sound?
- Were alternatives considered?
- What are the risks?
- Is the decision reversible?
- What are the tradeoffs?`
        },
        { 
          role: 'user', 
          content: `Decision: ${decision}\n\nOptions: ${context.options?.join(', ') || 'N/A'}\nConstraints: ${context.constraints?.join(', ') || 'N/A'}\nGoals: ${context.goals?.join(', ') || 'N/A'}`
        }
      ],
      thinking: { type: 'disabled' }
    })
    
    const response = completion.choices[0]?.message?.content || ''
    const parsed = this.parseCritiqueResponse(response, DECISION_DIMENSIONS)
    
    return {
      id,
      targetType: 'decision',
      target: decision.slice(0, 500),
      overallScore: parsed.overallScore,
      dimensions: parsed.dimensions,
      issues: parsed.issues,
      improvements: parsed.improvements,
      confidence: parsed.confidence,
      metadata: {
        duration: Date.now() - startTime,
        modelUsed: 'z-ai',
        iterations: 1
      }
    }
  }

  /**
   * Iterative refinement loop
   */
  async refineIteratively(
    initialInput: string,
    type: 'code' | 'plan' | 'decision',
    options: {
      maxIterations?: number
      targetScore?: number
      onIteration?: (iteration: RefinementIteration) => void
    } = {}
  ): Promise<{
    finalOutput: string
    iterations: RefinementIteration[]
    improvement: number
  }> {
    const maxIterations = options.maxIterations || 5
    const targetScore = options.targetScore || 80
    
    const iterations: RefinementIteration[] = []
    let currentInput = initialInput
    let currentScore = 0
    
    for (let i = 0; i < maxIterations; i++) {
      // Get critique
      const critique = type === 'code' 
        ? await this.critiqueCode(currentInput)
        : type === 'plan'
        ? await this.critiquePlan(currentInput)
        : await this.critiqueDecision(currentInput, {})
      
      currentScore = critique.overallScore
      
      // Record iteration
      const iteration: RefinementIteration = {
        iteration: i + 1,
        input: currentInput.slice(0, 500),
        output: '',
        critique,
        changes: []
      }
      
      // If score is good enough, stop
      if (currentScore >= targetScore) {
        iterations.push(iteration)
        break
      }
      
      // Generate improved version
      const improved = await this.generateImprovement(currentInput, critique)
      
      iteration.output = improved.slice(0, 500)
      iteration.changes = this.extractChanges(currentInput, improved)
      
      iterations.push(iteration)
      options.onIteration?.(iteration)
      
      currentInput = improved
    }
    
    const initialScore = iterations[0]?.critique.overallScore || 0
    
    return {
      finalOutput: currentInput,
      iterations,
      improvement: currentScore - initialScore
    }
  }

  /**
   * Generate improvement based on critique
   */
  private async generateImprovement(input: string, critique: CritiqueResult): Promise<string> {
    if (!this.zai) await this.initialize()
    
    // Prioritize critical and major issues
    const criticalIssues = critique.issues
      .filter(i => i.severity === 'critical' || i.severity === 'major')
      .map(i => `- ${i.description}${i.fix ? ` Fix: ${i.fix}` : ''}`)
      .join('\n')
    
    const improvements = critique.improvements
      .filter(i => i.priority === 'high')
      .map(i => `- ${i.suggested}`)
      .join('\n')
    
    const completion = await this.zai.chat.completions.create({
      messages: [
        { 
          role: 'assistant', 
          content: `You are an expert at improving code/plans. Apply the suggested improvements while maintaining functionality.`
        },
        { 
          role: 'user', 
          content: `Original:\n${input}\n\nIssues to fix:\n${criticalIssues}\n\nImprovements to apply:\n${improvements}\n\nProvide the improved version:`
        }
      ],
      thinking: { type: 'disabled' }
    })
    
    return completion.choices[0]?.message?.content || input
  }

  /**
   * Build code critique prompt
   */
  private buildCodeCritiquePrompt(code: string, context?: any): string {
    return `Code to critique:
\`\`\`
${code}
\`\`\`

Context:
- Language: ${context?.language || 'auto-detect'}
- Framework: ${context?.framework || 'unknown'}
- Requirements: ${context?.requirements?.join(', ') || 'general quality'}

Provide a thorough critique focusing on correctness, quality, security, performance, and completeness.`
  }

  /**
   * Parse critique response from AI
   */
  private parseCritiqueResponse(response: string, dimensionConfig: any[]): {
    overallScore: number
    dimensions: CritiqueDimension[]
    issues: CritiqueIssue[]
    improvements: CritiqueImprovement[]
    confidence: number
  } {
    // Try to parse JSON from response
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        
        return {
          overallScore: parsed.overallScore || 70,
          dimensions: parsed.dimensions || this.buildDefaultDimensions(dimensionConfig),
          issues: (parsed.issues || []).map((i: any, idx: number) => ({
            id: `issue_${idx}`,
            ...i
          })),
          improvements: (parsed.improvements || []).map((i: any, idx: number) => ({
            id: `improvement_${idx}`,
            ...i
          })),
          confidence: parsed.confidence || 0.7
        }
      }
    } catch {}
    
    // Fallback: extract from text
    return {
      overallScore: this.extractScore(response),
      dimensions: this.buildDefaultDimensions(dimensionConfig),
      issues: this.extractIssues(response),
      improvements: this.extractImprovements(response),
      confidence: 0.6
    }
  }

  /**
   * Build default dimensions
   */
  private buildDefaultDimensions(config: any[]): CritiqueDimension[] {
    return config.map(d => ({
      name: d.name,
      score: 70,
      weight: d.weight,
      feedback: 'Needs review',
      subScores: d.subDimensions.reduce((acc: any, sub: string) => {
        acc[sub] = 70
        return acc
      }, {})
    }))
  }

  /**
   * Extract score from text
   */
  private extractScore(text: string): number {
    const match = text.match(/(?:score|rating)[:\s]+(\d+)/i)
    return match ? parseInt(match[1]) : 70
  }

  /**
   * Extract issues from text
   */
  private extractIssues(text: string): CritiqueIssue[] {
    const issues: CritiqueIssue[] = []
    const lines = text.split('\n')
    
    for (const line of lines) {
      if (line.match(/(?:issue|problem|bug|error)[:\s]+/i)) {
        issues.push({
          id: `issue_${issues.length}`,
          severity: line.toLowerCase().includes('critical') ? 'critical' 
            : line.toLowerCase().includes('major') ? 'major' 
            : 'minor',
          category: 'general',
          description: line.replace(/.*?:\s*/, '').trim(),
          impact: 'Unknown'
        })
      }
    }
    
    return issues
  }

  /**
   * Extract improvements from text
   */
  private extractImprovements(text: string): CritiqueImprovement[] {
    const improvements: CritiqueImprovement[] = []
    const lines = text.split('\n')
    
    for (const line of lines) {
      if (line.match(/(?:suggest|recommend|improve|should)[:\s]+/i)) {
        improvements.push({
          id: `improvement_${improvements.length}`,
          priority: 'medium',
          category: 'general',
          current: 'Current implementation',
          suggested: line.replace(/.*?:\s*/, '').trim(),
          rationale: 'Identified during critique',
          effort: 'medium'
        })
      }
    }
    
    return improvements
  }

  /**
   * Extract changes between two versions
   */
  private extractChanges(original: string, improved: string): string[] {
    const changes: string[] = []
    
    // Simple line comparison
    const originalLines = original.split('\n')
    const improvedLines = improved.split('\n')
    
    for (let i = 0; i < Math.max(originalLines.length, improvedLines.length); i++) {
      if (originalLines[i] !== improvedLines[i]) {
        if (originalLines[i] && improvedLines[i]) {
          changes.push(`Line ${i + 1}: Modified`)
        } else if (!originalLines[i]) {
          changes.push(`Line ${i + 1}: Added`)
        } else {
          changes.push(`Line ${i + 1}: Removed`)
        }
      }
    }
    
    return changes
  }

  /**
   * Add to history
   */
  private addToHistory(id: string, result: CritiqueResult): void {
    const existing = this.critiqueHistory.get(id) || []
    existing.push(result)
    this.critiqueHistory.set(id, existing)
  }

  /**
   * Quick validation check
   */
  async quickValidate(code: string): Promise<{
    valid: boolean
    score: number
    criticalIssues: number
  }> {
    const critique = await this.critiqueCode(code)
    
    return {
      valid: critique.overallScore >= 60 && !critique.issues.some(i => i.severity === 'critical'),
      score: critique.overallScore,
      criticalIssues: critique.issues.filter(i => i.severity === 'critical').length
    }
  }

  /**
   * Compare two code versions
   */
  async compareVersions(code1: string, code2: string): Promise<{
    version1Score: number
    version2Score: number
    improvement: number
    regressionAreas: string[]
    improvementAreas: string[]
  }> {
    const [critique1, critique2] = await Promise.all([
      this.critiqueCode(code1),
      this.critiqueCode(code2)
    ])
    
    const regressionAreas: string[] = []
    const improvementAreas: string[] = []
    
    for (const dim1 of critique1.dimensions) {
      const dim2 = critique2.dimensions.find(d => d.name === dim1.name)
      if (dim2) {
        if (dim2.score < dim1.score - 5) {
          regressionAreas.push(dim1.name)
        } else if (dim2.score > dim1.score + 5) {
          improvementAreas.push(dim1.name)
        }
      }
    }
    
    return {
      version1Score: critique1.overallScore,
      version2Score: critique2.overallScore,
      improvement: critique2.overallScore - critique1.overallScore,
      regressionAreas,
      improvementAreas
    }
  }

  /**
   * Generate critique report
   */
  generateReport(critique: CritiqueResult): string {
    const lines: string[] = [
      `# Critique Report`,
      ``,
      `**Target Type**: ${critique.targetType}`,
      `**Overall Score**: ${critique.overallScore}/100`,
      `**Confidence**: ${(critique.confidence * 100).toFixed(0)}%`,
      ``,
      `## Dimensions`,
      ``
    ]
    
    for (const dim of critique.dimensions) {
      const bar = '█'.repeat(Math.round(dim.score / 5)) + '░'.repeat(20 - Math.round(dim.score / 5))
      lines.push(`### ${dim.name} (${dim.score}/100)`)
      lines.push(`\`${bar}\``)
      lines.push(dim.feedback)
      lines.push(``)
    }
    
    if (critique.issues.length > 0) {
      lines.push(`## Issues (${critique.issues.length})`)
      lines.push(``)
      
      for (const issue of critique.issues) {
        const severity = issue.severity.toUpperCase()
        lines.push(`### [${severity}] ${issue.category}`)
        lines.push(`- **Location**: ${issue.location || 'N/A'}`)
        lines.push(`- **Description**: ${issue.description}`)
        lines.push(`- **Impact**: ${issue.impact}`)
        if (issue.fix) {
          lines.push(`- **Fix**: ${issue.fix}`)
        }
        lines.push(``)
      }
    }
    
    if (critique.improvements.length > 0) {
      lines.push(`## Improvements (${critique.improvements.length})`)
      lines.push(``)
      
      for (const imp of critique.improvements) {
        lines.push(`### [${imp.priority.toUpperCase()}] ${imp.category}`)
        lines.push(`- **Current**: ${imp.current}`)
        lines.push(`- **Suggested**: ${imp.suggested}`)
        lines.push(`- **Rationale**: ${imp.rationale}`)
        lines.push(`- **Effort**: ${imp.effort}`)
        lines.push(``)
      }
    }
    
    return lines.join('\n')
  }

  /**
   * Get critique history
   */
  getHistory(id?: string): CritiqueResult[] {
    if (id) {
      return this.critiqueHistory.get(id) || []
    }
    return Array.from(this.critiqueHistory.values()).flat()
  }

  /**
   * Get refinement history
   */
  getRefinementHistory(id: string): RefinementIteration[] {
    return this.refinementHistory.get(id) || []
  }
}

// Singleton
let critiqueEngine: SelfCritiqueEngine | null = null

export function getCritiqueEngine(): SelfCritiqueEngine {
  if (!critiqueEngine) {
    critiqueEngine = new SelfCritiqueEngine()
  }
  return critiqueEngine
}

/**
 * Quick critique function
 */
export async function quickCritique(
  target: string,
  type: 'code' | 'plan' | 'decision' = 'code'
): Promise<CritiqueResult> {
  const engine = getCritiqueEngine()
  
  switch (type) {
    case 'code':
      return engine.critiqueCode(target)
    case 'plan':
      return engine.critiquePlan(target)
    case 'decision':
      return engine.critiqueDecision(target, {})
  }
}
