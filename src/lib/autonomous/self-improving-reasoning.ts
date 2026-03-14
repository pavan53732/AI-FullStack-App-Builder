/**
 * Self-Improving Reasoning Engine
 * 
 * Enables the AI to:
 * - Learn from failures and successes
 * - Adapt strategies based on outcomes
 * - Build a pattern library of solutions
 * - Self-correct reasoning paths
 * - Improve over time through feedback
 */

import fs from 'fs/promises'
import path from 'path'
import ZAI from 'z-ai-web-dev-sdk'

// Types
export interface ReasoningAttempt {
  id: string
  timestamp: string
  goal: string
  approach: string
  steps: ReasoningStep[]
  outcome: 'success' | 'partial' | 'failure'
  confidence: number
  duration: number
  error?: string
  context: Record<string, any>
  lessons: string[]
}

export interface ReasoningStep {
  type: 'observation' | 'hypothesis' | 'action' | 'verification' | 'reflection'
  content: string
  success: boolean
  timestamp: string
}

export interface FailurePattern {
  id: string
  pattern: string
  frequency: number
  contexts: string[]
  solutions: SolutionRecord[]
  lastOccurrence: string
}

export interface SolutionRecord {
  id: string
  problem: string
  solution: string
  successRate: number
  usageCount: number
  context: string[]
  createdAt: string
}

export interface AdaptationStrategy {
  id: string
  name: string
  description: string
  condition: (context: ReasoningContext) => boolean
  apply: (attempt: ReasoningAttempt) => ReasoningAttempt
  successRate: number
  usageCount: number
}

export interface ReasoningContext {
  goal: string
  previousAttempts: ReasoningAttempt[]
  availableTools: string[]
  constraints: string[]
  preferences: Record<string, any>
  timeLimit?: number
}

export interface LearningFeedback {
  attemptId: string
  rating: 1 | 2 | 3 | 4 | 5
  notes?: string
  suggestedImprovement?: string
}

export interface ImprovementMetrics {
  totalAttempts: number
  successRate: number
  averageConfidence: number
  averageDuration: number
  failurePatternsLearned: number
  solutionsDiscovered: number
  improvementTrend: 'improving' | 'stable' | 'declining'
}

// Storage paths
const STORAGE_DIR = path.join(process.cwd(), 'data', 'reasoning-memory')
const ATTEMPTS_FILE = path.join(STORAGE_DIR, 'attempts.json')
const PATTERNS_FILE = path.join(STORAGE_DIR, 'patterns.json')
const SOLUTIONS_FILE = path.join(STORAGE_DIR, 'solutions.json')

/**
 * Self-Improving Reasoning Engine
 */
export class SelfImprovingReasoningEngine {
  private zai: any = null
  private attempts: ReasoningAttempt[] = []
  private failurePatterns: Map<string, FailurePattern> = new Map()
  private solutions: Map<string, SolutionRecord> = new Map()
  private strategies: AdaptationStrategy[] = []
  private initialized = false

  constructor() {
    this.initializeStrategies()
  }

  /**
   * Initialize the engine
   */
  async init(): Promise<void> {
    if (this.initialized) return
    
    this.zai = await ZAI.create()
    
    // Ensure storage directory exists
    await fs.mkdir(STORAGE_DIR, { recursive: true })
    
    // Load existing data
    await this.loadMemory()
    
    this.initialized = true
  }

  /**
   * Reason with self-improvement
   */
  async reason(goal: string, context: ReasoningContext): Promise<ReasoningAttempt> {
    await this.init()
    
    const startTime = Date.now()
    const attemptId = `attempt_${Date.now().toString(36)}`
    
    // Check for similar past attempts
    const similarAttempts = this.findSimilarAttempts(goal)
    
    // Check for known failure patterns
    const knownPatterns = this.identifyFailurePatterns(context)
    
    // Select best strategy based on history
    const strategy = this.selectStrategy(context, similarAttempts, knownPatterns)
    
    // Generate reasoning steps
    const steps = await this.generateReasoningSteps(goal, context, strategy, similarAttempts)
    
    // Calculate confidence based on history
    const confidence = this.calculateConfidence(steps, similarAttempts, knownPatterns)
    
    // Determine outcome
    const outcome = this.determineOutcome(steps)
    
    // Extract lessons
    const lessons = this.extractLessons(steps, outcome)
    
    const attempt: ReasoningAttempt = {
      id: attemptId,
      timestamp: new Date().toISOString(),
      goal,
      approach: strategy?.name || 'default',
      steps,
      outcome,
      confidence,
      duration: Date.now() - startTime,
      context: {
        constraints: context.constraints,
        tools: context.availableTools
      },
      lessons
    }
    
    // Store attempt
    this.attempts.push(attempt)
    await this.saveMemory()
    
    // Learn from this attempt
    await this.learn(attempt)
    
    return attempt
  }

  /**
   * Generate reasoning steps
   */
  private async generateReasoningSteps(
    goal: string,
    context: ReasoningContext,
    strategy: AdaptationStrategy | null,
    similarAttempts: ReasoningAttempt[]
  ): Promise<ReasoningStep[]> {
    const steps: ReasoningStep[] = []
    
    // Step 1: Observation
    steps.push({
      type: 'observation',
      content: await this.observe(goal, context),
      success: true,
      timestamp: new Date().toISOString()
    })
    
    // Step 2: Hypothesis
    const hypothesis = await this.hypothesize(goal, context, similarAttempts)
    steps.push({
      type: 'hypothesis',
      content: hypothesis.content,
      success: hypothesis.valid,
      timestamp: new Date().toISOString()
    })
    
    // Step 3: Action
    const action = await this.planAction(goal, hypothesis, context)
    steps.push({
      type: 'action',
      content: action.content,
      success: action.feasible,
      timestamp: new Date().toISOString()
    })
    
    // Step 4: Verification
    const verification = await this.verify(action, context)
    steps.push({
      type: 'verification',
      content: verification.content,
      success: verification.passed,
      timestamp: new Date().toISOString()
    })
    
    // Step 5: Reflection
    if (!verification.passed) {
      steps.push({
        type: 'reflection',
        content: await this.reflect(steps, goal),
        success: false,
        timestamp: new Date().toISOString()
      })
    }
    
    return steps
  }

  /**
   * Observe the current state
   */
  private async observe(goal: string, context: ReasoningContext): Promise<string> {
    const observations: string[] = []
    
    observations.push(`Goal: ${goal}`)
    observations.push(`Constraints: ${context.constraints.join(', ') || 'none'}`)
    observations.push(`Available tools: ${context.availableTools.join(', ')}`)
    
    // Check for past failures with similar goals
    const pastFailures = this.attempts.filter(a => 
      a.goal.toLowerCase().includes(goal.toLowerCase().split(' ')[0]) &&
      a.outcome === 'failure'
    )
    
    if (pastFailures.length > 0) {
      observations.push(`Note: ${pastFailures.length} similar past attempts failed`)
      const commonFailures = this.analyzeCommonFailures(pastFailures)
      if (commonFailures) {
        observations.push(`Common failure: ${commonFailures}`)
      }
    }
    
    return observations.join('\n')
  }

  /**
   * Generate hypothesis
   */
  private async hypothesize(
    goal: string,
    context: ReasoningContext,
    similarAttempts: ReasoningAttempt[]
  ): Promise<{ content: string; valid: boolean }> {
    // Look for successful patterns from similar attempts
    const successfulPatterns = similarAttempts
      .filter(a => a.outcome === 'success')
      .map(a => a.steps.map(s => s.content).join('\n'))
    
    if (successfulPatterns.length > 0) {
      // Use successful pattern as hypothesis
      return {
        content: `Based on ${successfulPatterns.length} successful attempts:\n${successfulPatterns[0].slice(0, 500)}`,
        valid: true
      }
    }
    
    // Check solution library
    const relevantSolutions = this.findRelevantSolutions(goal)
    if (relevantSolutions.length > 0) {
      return {
        content: `Known solution (success rate: ${relevantSolutions[0].successRate * 100}%):\n${relevantSolutions[0].solution}`,
        valid: true
      }
    }
    
    // Generate new hypothesis using AI
    const response = await this.zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'Generate a hypothesis for how to achieve this goal. Be concise.' },
        { role: 'user', content: `Goal: ${goal}\nContext: ${JSON.stringify(context)}` }
      ],
      thinking: { type: 'disabled' }
    })
    
    return {
      content: response.choices[0]?.message?.content || 'Unable to generate hypothesis',
      valid: true
    }
  }

  /**
   * Plan action based on hypothesis
   */
  private async planAction(
    goal: string,
    hypothesis: { content: string; valid: boolean },
    context: ReasoningContext
  ): Promise<{ content: string; feasible: boolean }> {
    const response = await this.zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'Create a concise action plan. Respond with steps.' },
        { role: 'user', content: `Goal: ${goal}\nHypothesis: ${hypothesis.content}\nTools: ${context.availableTools.join(', ')}` }
      ],
      thinking: { type: 'disabled' }
    })
    
    const plan = response.choices[0]?.message?.content || ''
    
    return {
      content: plan,
      feasible: plan.length > 10
    }
  }

  /**
   * Verify the action plan
   */
  private async verify(
    action: { content: string; feasible: boolean },
    context: ReasoningContext
  ): Promise<{ content: string; passed: boolean }> {
    // Check for known failure patterns in the action
    for (const [patternId, pattern] of this.failurePatterns) {
      if (action.content.toLowerCase().includes(pattern.pattern.toLowerCase())) {
        const successRate = pattern.solutions.reduce((avg, s) => avg + s.successRate, 0) / 
          (pattern.solutions.length || 1)
        
        if (successRate < 0.5) {
          return {
            content: `Warning: Action matches known failure pattern "${pattern.pattern}". Success rate: ${(successRate * 100).toFixed(0)}%`,
            passed: false
          }
        }
      }
    }
    
    return {
      content: 'Action plan verified against known patterns',
      passed: action.feasible
    }
  }

  /**
   * Reflect on failed reasoning
   */
  private async reflect(steps: ReasoningStep[], goal: string): Promise<string> {
    const failedSteps = steps.filter(s => !s.success)
    
    const response = await this.zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'Analyze the failure and suggest improvements.' },
        { role: 'user', content: `Goal: ${goal}\nFailed steps:\n${failedSteps.map(s => `- ${s.type}: ${s.content}`).join('\n')}` }
      ],
      thinking: { type: 'disabled' }
    })
    
    return response.choices[0]?.message?.content || 'Unable to reflect on failure'
  }

  /**
   * Learn from an attempt
   */
  private async learn(attempt: ReasoningAttempt): Promise<void> {
    // Learn from failures
    if (attempt.outcome === 'failure') {
      await this.learnFromFailure(attempt)
    }
    
    // Learn from successes
    if (attempt.outcome === 'success') {
      await this.learnFromSuccess(attempt)
    }
    
    // Update strategies
    this.updateStrategies(attempt)
  }

  /**
   * Learn from failure
   */
  private async learnFromFailure(attempt: ReasoningAttempt): Promise<void> {
    // Identify failure pattern
    const failurePoint = attempt.steps.find(s => !s.success)
    if (!failurePoint) return
    
    const patternKey = this.extractPatternKey(failurePoint.content)
    
    if (this.failurePatterns.has(patternKey)) {
      // Update existing pattern
      const pattern = this.failurePatterns.get(patternKey)!
      pattern.frequency++
      pattern.lastOccurrence = attempt.timestamp
      pattern.contexts.push(attempt.goal)
    } else {
      // Create new pattern
      this.failurePatterns.set(patternKey, {
        id: `pattern_${Date.now().toString(36)}`,
        pattern: patternKey,
        frequency: 1,
        contexts: [attempt.goal],
        solutions: [],
        lastOccurrence: attempt.timestamp
      })
    }
    
    // Generate solution suggestion using AI
    const solution = await this.generateSolution(attempt)
    if (solution) {
      const pattern = this.failurePatterns.get(patternKey)
      if (pattern) {
        pattern.solutions.push({
          id: `solution_${Date.now().toString(36)}`,
          problem: patternKey,
          solution,
          successRate: 0,
          usageCount: 0,
          context: [attempt.goal],
          createdAt: new Date().toISOString()
        })
      }
    }
  }

  /**
   * Learn from success
   */
  private async learnFromSuccess(attempt: ReasoningAttempt): Promise<void> {
    // Extract successful approach as solution
    const solutionKey = this.extractPatternKey(attempt.goal)
    
    const successfulSteps = attempt.steps
      .filter(s => s.success)
      .map(s => s.content)
      .join('\n')
    
    if (successfulSteps.length < 50) return // Too short to be useful
    
    if (this.solutions.has(solutionKey)) {
      // Update existing solution
      const existing = this.solutions.get(solutionKey)!
      existing.usageCount++
      existing.successRate = (existing.successRate * (existing.usageCount - 1) + 1) / existing.usageCount
    } else {
      // Create new solution
      this.solutions.set(solutionKey, {
        id: `solution_${Date.now().toString(36)}`,
        problem: attempt.goal,
        solution: successfulSteps,
        successRate: 1,
        usageCount: 1,
        context: attempt.context.constraints || [],
        createdAt: new Date().toISOString()
      })
    }
  }

  /**
   * Generate solution for a failure
   */
  private async generateSolution(attempt: ReasoningAttempt): Promise<string | null> {
    try {
      const response = await this.zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: 'Suggest a solution to prevent this failure. Be specific and actionable.' },
          { role: 'user', content: `Failed goal: ${attempt.goal}\nError: ${attempt.error || 'Unknown'}\nLessons: ${attempt.lessons.join('\n')}` }
        ],
        thinking: { type: 'disabled' }
      })
      
      return response.choices[0]?.message?.content || null
    } catch {
      return null
    }
  }

  /**
   * Initialize adaptation strategies
   */
  private initializeStrategies(): void {
    this.strategies = [
      {
        id: 'retry_with_variation',
        name: 'Retry with Variation',
        description: 'Try again with slightly modified approach',
        condition: (ctx) => ctx.previousAttempts.length < 3,
        apply: (attempt) => ({
          ...attempt,
          approach: 'retry_with_variation'
        }),
        successRate: 0.3,
        usageCount: 0
      },
      {
        id: 'break_down_goal',
        name: 'Break Down Goal',
        description: 'Split complex goal into smaller subgoals',
        condition: (ctx) => ctx.goal.split(' ').length > 10,
        apply: (attempt) => ({
          ...attempt,
          approach: 'break_down_goal'
        }),
        successRate: 0.6,
        usageCount: 0
      },
      {
        id: 'use_successful_pattern',
        name: 'Use Successful Pattern',
        description: 'Apply previously successful approach',
        condition: (ctx) => ctx.previousAttempts.some(a => a.outcome === 'success'),
        apply: (attempt) => ({
          ...attempt,
          approach: 'use_successful_pattern'
        }),
        successRate: 0.7,
        usageCount: 0
      },
      {
        id: 'simplify_constraints',
        name: 'Simplify Constraints',
        description: 'Remove non-essential constraints',
        condition: (ctx) => ctx.constraints.length > 3,
        apply: (attempt) => ({
          ...attempt,
          approach: 'simplify_constraints'
        }),
        successRate: 0.5,
        usageCount: 0
      }
    ]
  }

  /**
   * Select best strategy
   */
  private selectStrategy(
    context: ReasoningContext,
    similarAttempts: ReasoningAttempt[],
    knownPatterns: FailurePattern[]
  ): AdaptationStrategy | null {
    // Filter applicable strategies
    const applicable = this.strategies.filter(s => s.condition(context))
    
    if (applicable.length === 0) return null
    
    // Sort by success rate
    return applicable.sort((a, b) => b.successRate - a.successRate)[0]
  }

  /**
   * Find similar past attempts
   */
  private findSimilarAttempts(goal: string): ReasoningAttempt[] {
    const keywords = goal.toLowerCase().split(' ').filter(w => w.length > 3)
    
    return this.attempts.filter(a => {
      const attemptKeywords = a.goal.toLowerCase().split(' ')
      const overlap = keywords.filter(k => attemptKeywords.some(ak => ak.includes(k)))
      return overlap.length >= Math.floor(keywords.length * 0.5)
    })
  }

  /**
   * Identify failure patterns in context
   */
  private identifyFailurePatterns(context: ReasoningContext): FailurePattern[] {
    const patterns: FailurePattern[] = []
    
    for (const pattern of this.failurePatterns.values()) {
      const matchesGoal = context.goal.toLowerCase().includes(pattern.pattern.toLowerCase())
      const matchesConstraints = context.constraints.some(c => 
        c.toLowerCase().includes(pattern.pattern.toLowerCase())
      )
      
      if (matchesGoal || matchesConstraints) {
        patterns.push(pattern)
      }
    }
    
    return patterns
  }

  /**
   * Find relevant solutions
   */
  private findRelevantSolutions(goal: string): SolutionRecord[] {
    const keywords = goal.toLowerCase().split(' ')
    
    const relevant = Array.from(this.solutions.values()).filter(solution => {
      const solutionKeywords = solution.problem.toLowerCase().split(' ')
      const overlap = keywords.filter(k => solutionKeywords.some(sk => sk.includes(k)))
      return overlap.length >= 2
    })
    
    return relevant.sort((a, b) => b.successRate - a.successRate)
  }

  /**
   * Calculate confidence
   */
  private calculateConfidence(
    steps: ReasoningStep[],
    similarAttempts: ReasoningAttempt[],
    knownPatterns: FailurePattern[]
  ): number {
    let confidence = 0.7 // Base confidence
    
    // Adjust based on similar successes
    const similarSuccesses = similarAttempts.filter(a => a.outcome === 'success').length
    confidence += similarSuccesses * 0.05
    
    // Adjust based on known patterns
    const highRiskPatterns = knownPatterns.filter(p => 
      p.solutions.every(s => s.successRate < 0.5)
    ).length
    confidence -= highRiskPatterns * 0.1
    
    // Adjust based on step success
    const successfulSteps = steps.filter(s => s.success).length
    confidence *= successfulSteps / steps.length
    
    return Math.max(0.1, Math.min(0.99, confidence))
  }

  /**
   * Determine outcome
   */
  private determineOutcome(steps: ReasoningStep[]): 'success' | 'partial' | 'failure' {
    const successRate = steps.filter(s => s.success).length / steps.length
    
    if (successRate >= 0.8) return 'success'
    if (successRate >= 0.5) return 'partial'
    return 'failure'
  }

  /**
   * Extract lessons from attempt
   */
  private extractLessons(steps: ReasoningStep[], outcome: string): string[] {
    const lessons: string[] = []
    
    const failedSteps = steps.filter(s => !s.success)
    for (const step of failedSteps) {
      lessons.push(`${step.type} failed: ${step.content.slice(0, 100)}`)
    }
    
    if (outcome === 'success') {
      lessons.push('Approach was successful')
    }
    
    return lessons
  }

  /**
   * Extract pattern key
   */
  private extractPatternKey(content: string): string {
    // Extract meaningful keywords
    const words = content.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(' ')
      .filter(w => w.length > 3)
    
    return words.slice(0, 3).join('_')
  }

  /**
   * Analyze common failures
   */
  private analyzeCommonFailures(attempts: ReasoningAttempt[]): string | null {
    const failures: string[] = []
    
    for (const attempt of attempts) {
      const failedStep = attempt.steps.find(s => !s.success)
      if (failedStep) {
        failures.push(failedStep.content.slice(0, 100))
      }
    }
    
    if (failures.length === 0) return null
    
    // Find common words
    const wordCounts: Map<string, number> = new Map()
    for (const failure of failures) {
      for (const word of failure.split(' ')) {
        if (word.length > 3) {
          wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
        }
      }
    }
    
    const common = Array.from(wordCounts.entries())
      .filter(([, count]) => count >= attempts.length * 0.5)
      .map(([word]) => word)
    
    return common.length > 0 ? common.join(', ') : null
  }

  /**
   * Update strategies based on attempt
   */
  private updateStrategies(attempt: ReasoningAttempt): void {
    const strategy = this.strategies.find(s => s.name === attempt.approach)
    if (strategy) {
      strategy.usageCount++
      const outcomeWeight = attempt.outcome === 'success' ? 1 : attempt.outcome === 'partial' ? 0.5 : 0
      strategy.successRate = (strategy.successRate * (strategy.usageCount - 1) + outcomeWeight) / strategy.usageCount
    }
  }

  /**
   * Load memory from disk
   */
  private async loadMemory(): Promise<void> {
    try {
      const attemptsData = await fs.readFile(ATTEMPTS_FILE, 'utf-8')
      this.attempts = JSON.parse(attemptsData)
    } catch {}
    
    try {
      const patternsData = await fs.readFile(PATTERNS_FILE, 'utf-8')
      const patterns = JSON.parse(patternsData)
      this.failurePatterns = new Map(patterns.map((p: FailurePattern) => [p.pattern, p]))
    } catch {}
    
    try {
      const solutionsData = await fs.readFile(SOLUTIONS_FILE, 'utf-8')
      const solutions = JSON.parse(solutionsData)
      this.solutions = new Map(solutions.map((s: SolutionRecord) => [s.id, s]))
    } catch {}
  }

  /**
   * Save memory to disk
   */
  private async saveMemory(): Promise<void> {
    await fs.writeFile(ATTEMPTS_FILE, JSON.stringify(this.attempts.slice(-1000), null, 2))
    await fs.writeFile(PATTERNS_FILE, JSON.stringify(Array.from(this.failurePatterns.values()), null, 2))
    await fs.writeFile(SOLUTIONS_FILE, JSON.stringify(Array.from(this.solutions.values()), null, 2))
  }

  /**
   * Provide feedback on an attempt
   */
  async provideFeedback(feedback: LearningFeedback): Promise<void> {
    const attempt = this.attempts.find(a => a.id === feedback.attemptId)
    if (!attempt) return
    
    // Adjust confidence based on feedback
    const ratingNormalized = (feedback.rating - 1) / 4 // 0-1 scale
    
    if (ratingNormalized < 0.5) {
      // Poor rating - treat as learning opportunity
      attempt.lessons.push(`User feedback: ${feedback.notes || 'Low rating'}`)
      if (feedback.suggestedImprovement) {
        attempt.lessons.push(`Suggested improvement: ${feedback.suggestedImprovement}`)
      }
      await this.learnFromFailure(attempt)
    }
    
    await this.saveMemory()
  }

  /**
   * Get improvement metrics
   */
  getMetrics(): ImprovementMetrics {
    const totalAttempts = this.attempts.length
    const successes = this.attempts.filter(a => a.outcome === 'success').length
    const successRate = totalAttempts > 0 ? successes / totalAttempts : 0
    
    const avgConfidence = totalAttempts > 0 
      ? this.attempts.reduce((sum, a) => sum + a.confidence, 0) / totalAttempts 
      : 0
    
    const avgDuration = totalAttempts > 0
      ? this.attempts.reduce((sum, a) => sum + a.duration, 0) / totalAttempts
      : 0
    
    // Calculate trend
    const recentAttempts = this.attempts.slice(-10)
    const olderAttempts = this.attempts.slice(-20, -10)
    
    let improvementTrend: 'improving' | 'stable' | 'declining' = 'stable'
    if (olderAttempts.length > 0 && recentAttempts.length > 0) {
      const recentSuccess = recentAttempts.filter(a => a.outcome === 'success').length / recentAttempts.length
      const olderSuccess = olderAttempts.filter(a => a.outcome === 'success').length / olderAttempts.length
      
      if (recentSuccess > olderSuccess + 0.1) {
        improvementTrend = 'improving'
      } else if (recentSuccess < olderSuccess - 0.1) {
        improvementTrend = 'declining'
      }
    }
    
    return {
      totalAttempts,
      successRate,
      averageConfidence: avgConfidence,
      averageDuration: avgDuration,
      failurePatternsLearned: this.failurePatterns.size,
      solutionsDiscovered: this.solutions.size,
      improvementTrend
    }
  }

  /**
   * Get failure patterns
   */
  getFailurePatterns(): FailurePattern[] {
    return Array.from(this.failurePatterns.values())
      .sort((a, b) => b.frequency - a.frequency)
  }

  /**
   * Get solutions
   */
  getSolutions(): SolutionRecord[] {
    return Array.from(this.solutions.values())
      .sort((a, b) => b.successRate - a.successRate)
  }
}

// Singleton
let engineInstance: SelfImprovingReasoningEngine | null = null

export function getSelfImprovingEngine(): SelfImprovingReasoningEngine {
  if (!engineInstance) {
    engineInstance = new SelfImprovingReasoningEngine()
  }
  return engineInstance
}

/**
 * Quick reasoning with self-improvement
 */
export async function reasonWithImprovement(
  goal: string,
  context: ReasoningContext
): Promise<ReasoningAttempt> {
  const engine = getSelfImprovingEngine()
  await engine.init()
  return engine.reason(goal, context)
}
