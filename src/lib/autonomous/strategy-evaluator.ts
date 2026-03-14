/**
 * Strategy Evaluator Engine
 * 
 * Evaluates and compares reasoning strategies through:
 * - Strategy performance metrics
 * - Comparative analysis
 * - Success rate tracking
 * - Context-based recommendations
 * - A/B testing support
 */

import ZAI from 'z-ai-web-dev-sdk'

// Types
export interface ReasoningStrategy {
  id: string
  name: string
  description: string
  category: StrategyCategory
  parameters: StrategyParameter[]
 适用的场景: string[] // Applicable scenarios (Chinese variable name)
  expectedBenefits: string[]
  risks: string[]
  performanceMetrics: StrategyMetrics
}

export interface StrategyParameter {
  name: string
  type: 'number' | 'string' | 'boolean' | 'enum'
  defaultValue: any
  range?: { min: number; max: number }
  options?: string[]
  description: string
}

export interface StrategyMetrics {
  totalUses: number
  successCount: number
  failureCount: number
  averageExecutionTime: number
  averageQualityScore: number
  successRate: number
  lastUsed: string | null
  trendOverTime: 'improving' | 'stable' | 'declining'
}

export type StrategyCategory =
  | 'decomposition'
  | 'exploration'
  | 'optimization'
  | 'verification'
  | 'adaptation'
  | 'heuristic'
  | 'analytical'
  | 'creative'

export interface StrategyEvaluation {
  strategyId: string
  score: number // 0-1
  confidence: number // 0-1
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  contextFit: number // How well it fits the current context
  riskLevel: 'low' | 'medium' | 'high'
  estimatedOutcome: StrategyOutcome
}

export interface StrategyOutcome {
  expectedSuccessRate: number
  expectedQuality: number
  estimatedTime: number
  resourceRequirements: ResourceRequirement[]
  potentialIssues: string[]
}

export interface ResourceRequirement {
  type: 'memory' | 'cpu' | 'api_calls' | 'time'
  amount: number
  unit: string
}

export interface ComparisonResult {
  winner: string
  margin: number // 0-1
  comparison: StrategyComparison[]
  recommendation: string
  contextFactors: string[]
}

export interface StrategyComparison {
  strategyId: string
  metric: string
  value1: number
  value2: number
  winner: string
  significance: 'major' | 'minor' | 'negligible'
}

export interface StrategyContext {
  taskType?: string
  complexity?: 'low' | 'medium' | 'high'
  timeConstraint?: number // milliseconds
  qualityRequirement?: number // 0-1
  previousFailures?: string[]
  availableResources?: ResourceRequirement[]
  preferences?: Record<string, any>
}

export interface StrategyExecution {
  id: string
  strategyId: string
  context: StrategyContext
  startTime: string
  endTime?: string
  success: boolean
  qualityScore?: number
  error?: string
  lessons: string[]
}

// Built-in strategies
const BUILTIN_STRATEGIES: ReasoningStrategy[] = [
  {
    id: 'divide-and-conquer',
    name: 'Divide and Conquer',
    description: 'Break down complex problems into smaller, manageable sub-problems',
    category: 'decomposition',
    parameters: [
      { name: 'maxDepth', type: 'number', defaultValue: 3, range: { min: 1, max: 5 }, description: 'Maximum recursion depth' },
      { name: 'minSubproblemSize', type: 'number', defaultValue: 1, range: { min: 1, max: 10 }, description: 'Minimum size of subproblems' }
    ],
    适用的场景: ['complex problems', 'multi-step tasks', 'hierarchical structures'],
    expectedBenefits: ['reduced complexity', 'parallelizable', 'clear progress tracking'],
    risks: ['overhead for simple problems', 'potential for infinite recursion'],
    performanceMetrics: {
      totalUses: 0,
      successCount: 0,
      failureCount: 0,
      averageExecutionTime: 0,
      averageQualityScore: 0,
      successRate: 0,
      lastUsed: null,
      trendOverTime: 'stable'
    }
  },
  {
    id: 'iterative-refinement',
    name: 'Iterative Refinement',
    description: 'Start with a basic solution and iteratively improve it',
    category: 'optimization',
    parameters: [
      { name: 'maxIterations', type: 'number', defaultValue: 5, range: { min: 1, max: 20 }, description: 'Maximum improvement iterations' },
      { name: 'improvementThreshold', type: 'number', defaultValue: 0.1, range: { min: 0.01, max: 0.5 }, description: 'Minimum improvement to continue' },
      { name: 'qualityTarget', type: 'number', defaultValue: 0.9, range: { min: 0, max: 1 }, description: 'Target quality score' }
    ],
    适用的场景: ['quality-sensitive tasks', 'optimization problems', 'creative tasks'],
    expectedBenefits: ['continuous improvement', 'adaptive to feedback', 'can achieve high quality'],
    risks: ['can be slow', 'may get stuck in local optima', 'resource intensive'],
    performanceMetrics: {
      totalUses: 0,
      successCount: 0,
      failureCount: 0,
      averageExecutionTime: 0,
      averageQualityScore: 0,
      successRate: 0,
      lastUsed: null,
      trendOverTime: 'stable'
    }
  },
  {
    id: 'parallel-exploration',
    name: 'Parallel Exploration',
    description: 'Explore multiple solution paths simultaneously',
    category: 'exploration',
    parameters: [
      { name: 'maxPaths', type: 'number', defaultValue: 3, range: { min: 2, max: 10 }, description: 'Number of parallel paths' },
      { name: 'explorationDepth', type: 'number', defaultValue: 2, range: { min: 1, max: 5 }, description: 'Depth of exploration' }
    ],
    适用的场景: ['uncertain domains', 'creative problems', 'time-critical tasks'],
    expectedBenefits: ['diverse solutions', 'faster results', 'reduced risk of bad paths'],
    risks: ['higher resource usage', 'result selection complexity'],
    performanceMetrics: {
      totalUses: 0,
      successCount: 0,
      failureCount: 0,
      averageExecutionTime: 0,
      averageQualityScore: 0,
      successRate: 0,
      lastUsed: null,
      trendOverTime: 'stable'
    }
  },
  {
    id: 'constraint-propagation',
    name: 'Constraint Propagation',
    description: 'Use constraints to narrow down solution space',
    category: 'analytical',
    parameters: [
      { name: 'propagationStrength', type: 'enum', defaultValue: 'medium', options: ['weak', 'medium', 'strong'], description: 'Strength of constraint propagation' },
      { name: 'conflictResolution', type: 'enum', defaultValue: 'backtrack', options: ['backtrack', 'relax', 'prioritize'], description: 'How to handle conflicts' }
    ],
    适用的场景: ['constraint satisfaction', 'planning problems', 'scheduling'],
    expectedBenefits: ['efficient pruning', 'guaranteed validity', 'clear constraints'],
    risks: ['may over-constrain', 'requires good constraint definition'],
    performanceMetrics: {
      totalUses: 0,
      successCount: 0,
      failureCount: 0,
      averageExecutionTime: 0,
      averageQualityScore: 0,
      successRate: 0,
      lastUsed: null,
      trendOverTime: 'stable'
    }
  },
  {
    id: 'hypothesis-testing',
    name: 'Hypothesis Testing',
    description: 'Generate and test hypotheses systematically',
    category: 'verification',
    parameters: [
      { name: 'maxHypotheses', type: 'number', defaultValue: 5, range: { min: 1, max: 20 }, description: 'Maximum hypotheses to test' },
      { name: 'confidenceThreshold', type: 'number', defaultValue: 0.8, range: { min: 0.5, max: 1 }, description: 'Confidence threshold to accept' }
    ],
    适用的场景: ['debugging', 'root cause analysis', 'scientific reasoning'],
    expectedBenefits: ['systematic approach', 'evidence-based', 'reproducible'],
    risks: ['can be slow', 'may miss unconventional solutions'],
    performanceMetrics: {
      totalUses: 0,
      successCount: 0,
      failureCount: 0,
      averageExecutionTime: 0,
      averageQualityScore: 0,
      successRate: 0,
      lastUsed: null,
      trendOverTime: 'stable'
    }
  },
  {
    id: 'adaptive-learning',
    name: 'Adaptive Learning',
    description: 'Learn and adapt strategy based on past experiences',
    category: 'adaptation',
    parameters: [
      { name: 'learningRate', type: 'number', defaultValue: 0.1, range: { min: 0.01, max: 0.5 }, description: 'Rate of adaptation' },
      { name: 'memorySize', type: 'number', defaultValue: 100, range: { min: 10, max: 1000 }, description: 'Number of past experiences to remember' }
    ],
    适用的场景: ['repeated similar tasks', 'long-running systems', 'personalized solutions'],
    expectedBenefits: ['improves over time', 'context-aware', 'efficient for known patterns'],
    risks: ['cold start problem', 'may overfit to past data'],
    performanceMetrics: {
      totalUses: 0,
      successCount: 0,
      failureCount: 0,
      averageExecutionTime: 0,
      averageQualityScore: 0,
      successRate: 0,
      lastUsed: null,
      trendOverTime: 'improving'
    }
  },
  {
    id: 'heuristic-guided',
    name: 'Heuristic-Guided Search',
    description: 'Use heuristics to guide the search process',
    category: 'heuristic',
    parameters: [
      { name: 'heuristicWeight', type: 'number', defaultValue: 0.7, range: { min: 0, max: 1 }, description: 'Weight given to heuristic vs exploration' },
      { name: 'beamWidth', type: 'number', defaultValue: 3, range: { min: 1, max: 10 }, description: 'Number of top candidates to consider' }
    ],
    适用的场景: ['large search spaces', 'time-constrained problems', 'well-understood domains'],
    expectedBenefits: ['efficient search', 'good for large spaces', 'configurable'],
    risks: ['dependent on heuristic quality', 'may miss optimal solutions'],
    performanceMetrics: {
      totalUses: 0,
      successCount: 0,
      failureCount: 0,
      averageExecutionTime: 0,
      averageQualityScore: 0,
      successRate: 0,
      lastUsed: null,
      trendOverTime: 'stable'
    }
  },
  {
    id: 'creative-combination',
    name: 'Creative Combination',
    description: 'Combine ideas from different domains creatively',
    category: 'creative',
    parameters: [
      { name: 'combinationDepth', type: 'number', defaultValue: 2, range: { min: 1, max: 5 }, description: 'Depth of combination' },
      { name: 'diversityWeight', type: 'number', defaultValue: 0.5, range: { min: 0, max: 1 }, description: 'Weight given to diverse ideas' }
    ],
    适用的场景: ['innovative solutions', 'novel problems', 'design tasks'],
    expectedBenefits: ['novel solutions', 'cross-domain insights', 'creative output'],
    risks: ['unpredictable results', 'may produce impractical solutions'],
    performanceMetrics: {
      totalUses: 0,
      successCount: 0,
      failureCount: 0,
      averageExecutionTime: 0,
      averageQualityScore: 0,
      successRate: 0,
      lastUsed: null,
      trendOverTime: 'stable'
    }
  }
]

/**
 * Strategy Evaluator Engine
 */
export class StrategyEvaluator {
  private zai: any = null
  private strategies: Map<string, ReasoningStrategy> = new Map()
  private executions: Map<string, StrategyExecution[]> = new Map()
  private comparisonHistory: ComparisonResult[] = []

  constructor() {
    // Load built-in strategies
    BUILTIN_STRATEGIES.forEach(strategy => {
      this.strategies.set(strategy.id, { ...strategy })
    })
  }

  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
  }

  /**
   * Evaluate a single strategy for a given context
   */
  async evaluateStrategy(
    strategyId: string,
    context: StrategyContext
  ): Promise<StrategyEvaluation> {
    const strategy = this.strategies.get(strategyId)
    if (!strategy) {
      throw new Error(`Strategy not found: ${strategyId}`)
    }

    // Calculate base score from historical performance
    const metrics = strategy.performanceMetrics
    const baseScore = metrics.totalUses > 0
      ? (metrics.successRate * 0.4 + metrics.averageQualityScore * 0.6)
      : 0.5 // Default for unused strategies

    // Adjust score based on context fit
    const contextFit = this.calculateContextFit(strategy, context)

    // Calculate final score
    const score = baseScore * 0.5 + contextFit * 0.5

    // Identify strengths and weaknesses
    const strengths = this.identifyStrengths(strategy, context)
    const weaknesses = this.identifyWeaknesses(strategy, context)

    // Generate recommendations
    const recommendations = this.generateRecommendations(strategy, context, score)

    // Estimate outcome
    const estimatedOutcome = this.estimateOutcome(strategy, context)

    // Determine risk level
    const riskLevel = this.determineRiskLevel(strategy, context)

    // Calculate confidence based on historical data
    const confidence = metrics.totalUses > 10
      ? Math.min(0.95, 0.5 + metrics.totalUses * 0.01)
      : 0.3 + metrics.totalUses * 0.05

    return {
      strategyId,
      score,
      confidence,
      strengths,
      weaknesses,
      recommendations,
      contextFit,
      riskLevel,
      estimatedOutcome
    }
  }

  /**
   * Compare two strategies
   */
  async compareStrategies(
    strategy1Id: string,
    strategy2Id: string,
    context: StrategyContext
  ): Promise<ComparisonResult> {
    const evaluation1 = await this.evaluateStrategy(strategy1Id, context)
    const evaluation2 = await this.evaluateStrategy(strategy2Id, context)

    const strategy1 = this.strategies.get(strategy1Id)!
    const strategy2 = this.strategies.get(strategy2Id)!

    const comparison: StrategyComparison[] = []

    // Compare success rates
    comparison.push({
      strategyId: strategy1Id,
      metric: 'successRate',
      value1: strategy1.performanceMetrics.successRate,
      value2: strategy2.performanceMetrics.successRate,
      winner: strategy1.performanceMetrics.successRate >= strategy2.performanceMetrics.successRate ? strategy1Id : strategy2Id,
      significance: Math.abs(strategy1.performanceMetrics.successRate - strategy2.performanceMetrics.successRate) > 0.2 ? 'major' : 'minor'
    })

    // Compare quality scores
    comparison.push({
      strategyId: strategy1Id,
      metric: 'qualityScore',
      value1: strategy1.performanceMetrics.averageQualityScore,
      value2: strategy2.performanceMetrics.averageQualityScore,
      winner: strategy1.performanceMetrics.averageQualityScore >= strategy2.performanceMetrics.averageQualityScore ? strategy1Id : strategy2Id,
      significance: Math.abs(strategy1.performanceMetrics.averageQualityScore - strategy2.performanceMetrics.averageQualityScore) > 0.2 ? 'major' : 'minor'
    })

    // Compare context fit
    comparison.push({
      strategyId: strategy1Id,
      metric: 'contextFit',
      value1: evaluation1.contextFit,
      value2: evaluation2.contextFit,
      winner: evaluation1.contextFit >= evaluation2.contextFit ? strategy1Id : strategy2Id,
      significance: Math.abs(evaluation1.contextFit - evaluation2.contextFit) > 0.2 ? 'major' : 'minor'
    })

    // Compare estimated success
    comparison.push({
      strategyId: strategy1Id,
      metric: 'estimatedSuccess',
      value1: evaluation1.estimatedOutcome.expectedSuccessRate,
      value2: evaluation2.estimatedOutcome.expectedSuccessRate,
      winner: evaluation1.estimatedOutcome.expectedSuccessRate >= evaluation2.estimatedOutcome.expectedSuccessRate ? strategy1Id : strategy2Id,
      significance: Math.abs(evaluation1.estimatedOutcome.expectedSuccessRate - evaluation2.estimatedOutcome.expectedSuccessRate) > 0.2 ? 'major' : 'minor'
    })

    // Compare execution time
    comparison.push({
      strategyId: strategy1Id,
      metric: 'executionTime',
      value1: strategy1.performanceMetrics.averageExecutionTime,
      value2: strategy2.performanceMetrics.averageExecutionTime,
      winner: strategy1.performanceMetrics.averageExecutionTime <= strategy2.performanceMetrics.averageExecutionTime ? strategy1Id : strategy2Id,
      significance: Math.abs(strategy1.performanceMetrics.averageExecutionTime - strategy2.performanceMetrics.averageExecutionTime) > 1000 ? 'major' : 'minor'
    })

    // Determine winner
    const wins1 = comparison.filter(c => c.winner === strategy1Id).length
    const wins2 = comparison.filter(c => c.winner === strategy2Id).length
    const winner = wins1 >= wins2 ? strategy1Id : strategy2Id
    const margin = Math.abs(wins1 - wins2) / comparison.length

    // Generate recommendation
    let recommendation: string
    if (margin > 0.4) {
      recommendation = `Strongly recommend using ${this.strategies.get(winner)!.name} for this context.`
    } else if (margin > 0.2) {
      recommendation = `Recommend ${this.strategies.get(winner)!.name}, but both strategies are viable.`
    } else {
      recommendation = 'Both strategies perform similarly. Consider other factors like resource availability.'
    }

    // Identify context factors that influenced the decision
    const contextFactors: string[] = []
    if (context.complexity === 'high') {
      contextFactors.push('High task complexity favors decomposition strategies')
    }
    if (context.timeConstraint && context.timeConstraint < 5000) {
      contextFactors.push('Time constraint favors faster strategies')
    }
    if (context.qualityRequirement && context.qualityRequirement > 0.8) {
      contextFactors.push('High quality requirement favors thorough strategies')
    }
    if (context.previousFailures && context.previousFailures.length > 0) {
      contextFactors.push('Previous failures suggest trying alternative approaches')
    }

    const result: ComparisonResult = {
      winner,
      margin,
      comparison,
      recommendation,
      contextFactors
    }

    // Store in history
    this.comparisonHistory.push(result)

    return result
  }

  /**
   * Get best strategy for a context
   */
  async getBestStrategy(context: StrategyContext): Promise<{
    strategy: ReasoningStrategy
    evaluation: StrategyEvaluation
    alternatives: { strategy: ReasoningStrategy; evaluation: StrategyEvaluation }[]
  }> {
    const evaluations: { strategy: ReasoningStrategy; evaluation: StrategyEvaluation }[] = []

    for (const strategy of this.strategies.values()) {
      const evaluation = await this.evaluateStrategy(strategy.id, context)
      evaluations.push({ strategy, evaluation })
    }

    // Sort by score
    evaluations.sort((a, b) => b.evaluation.score - a.evaluation.score)

    const [best, ...alternatives] = evaluations

    return {
      strategy: best.strategy,
      evaluation: best.evaluation,
      alternatives: alternatives.slice(0, 3) // Top 3 alternatives
    }
  }

  /**
   * Record a strategy execution
   */
  recordExecution(execution: StrategyExecution): void {
    const strategy = this.strategies.get(execution.strategyId)
    if (!strategy) return

    // Update strategy metrics
    const metrics = strategy.performanceMetrics
    metrics.totalUses++
    metrics.lastUsed = execution.startTime

    if (execution.success) {
      metrics.successCount++
    } else {
      metrics.failureCount++
    }

    metrics.successRate = metrics.successCount / metrics.totalUses

    if (execution.qualityScore !== undefined) {
      // Update average quality score
      metrics.averageQualityScore = 
        (metrics.averageQualityScore * (metrics.totalUses - 1) + execution.qualityScore) / 
        metrics.totalUses
    }

    if (execution.endTime && execution.startTime) {
      const executionTime = new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime()
      metrics.averageExecutionTime = 
        (metrics.averageExecutionTime * (metrics.totalUses - 1) + executionTime) / 
        metrics.totalUses
    }

    // Update trend
    if (metrics.totalUses >= 10) {
      const recentSuccessRate = this.calculateRecentSuccessRate(execution.strategyId, 10)
      const olderSuccessRate = this.calculateRecentSuccessRate(execution.strategyId, 20, 10)
      
      if (recentSuccessRate > olderSuccessRate + 0.1) {
        metrics.trendOverTime = 'improving'
      } else if (recentSuccessRate < olderSuccessRate - 0.1) {
        metrics.trendOverTime = 'declining'
      } else {
        metrics.trendOverTime = 'stable'
      }
    }

    // Store execution
    if (!this.executions.has(execution.strategyId)) {
      this.executions.set(execution.strategyId, [])
    }
    this.executions.get(execution.strategyId)!.push(execution)
  }

  /**
   * Calculate context fit score
   */
  private calculateContextFit(strategy: ReasoningStrategy, context: StrategyContext): number {
    let fit = 0.5 // Base fit

    // Check if task type matches applicable scenarios
    if (context.taskType) {
      const matchesScenario = strategy.适用的场景.some(s => 
        context.taskType!.toLowerCase().includes(s.toLowerCase()) ||
        s.toLowerCase().includes(context.taskType!.toLowerCase())
      )
      if (matchesScenario) {
        fit += 0.2
      }
    }

    // Complexity consideration
    if (context.complexity) {
      if (context.complexity === 'high' && strategy.category === 'decomposition') {
        fit += 0.15
      } else if (context.complexity === 'low' && strategy.category === 'heuristic') {
        fit += 0.1
      }
    }

    // Time constraint consideration
    if (context.timeConstraint) {
      if (context.timeConstraint < 5000 && strategy.performanceMetrics.averageExecutionTime < 3000) {
        fit += 0.1
      } else if (context.timeConstraint < 5000 && strategy.performanceMetrics.averageExecutionTime > 10000) {
        fit -= 0.2
      }
    }

    // Quality requirement consideration
    if (context.qualityRequirement) {
      if (context.qualityRequirement > 0.8 && strategy.category === 'optimization') {
        fit += 0.15
      }
    }

    // Previous failures consideration
    if (context.previousFailures && context.previousFailures.length > 0) {
      const previousStrategyIds = context.previousFailures
      if (previousStrategyIds.includes(strategy.id)) {
        fit -= 0.3
      }
    }

    return Math.max(0, Math.min(1, fit))
  }

  /**
   * Identify strategy strengths
   */
  private identifyStrengths(strategy: ReasoningStrategy, context: StrategyContext): string[] {
    const strengths: string[] = [...strategy.expectedBenefits]

    // Add context-specific strengths
    if (strategy.category === 'decomposition' && context.complexity === 'high') {
      strengths.push('Excellent for complex problems')
    }
    if (strategy.category === 'verification' && context.qualityRequirement && context.qualityRequirement > 0.8) {
      strengths.push('High quality output expected')
    }
    if (strategy.performanceMetrics.trendOverTime === 'improving') {
      strengths.push('Performance improving over time')
    }
    if (strategy.performanceMetrics.successRate > 0.8) {
      strengths.push('High historical success rate')
    }

    return strengths
  }

  /**
   * Identify strategy weaknesses
   */
  private identifyWeaknesses(strategy: ReasoningStrategy, context: StrategyContext): string[] {
    const weaknesses: string[] = [...strategy.risks]

    // Add context-specific weaknesses
    if (context.timeConstraint && strategy.performanceMetrics.averageExecutionTime > context.timeConstraint * 0.8) {
      weaknesses.push('May exceed time constraint')
    }
    if (strategy.performanceMetrics.totalUses < 5) {
      weaknesses.push('Limited historical data')
    }
    if (strategy.performanceMetrics.trendOverTime === 'declining') {
      weaknesses.push('Performance declining over time')
    }
    if (strategy.performanceMetrics.successRate < 0.5 && strategy.performanceMetrics.totalUses > 5) {
      weaknesses.push('Low success rate')
    }

    return weaknesses
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    strategy: ReasoningStrategy,
    context: StrategyContext,
    score: number
  ): string[] {
    const recommendations: string[] = []

    if (score < 0.5) {
      recommendations.push('Consider alternative strategies for this context')
    }

    if (strategy.performanceMetrics.totalUses < 5) {
      recommendations.push('Try this strategy to gather more performance data')
    }

    // Parameter recommendations
    if (strategy.category === 'optimization' && context.qualityRequirement) {
      const qualityParam = strategy.parameters.find(p => p.name === 'qualityTarget')
      if (qualityParam && qualityParam.defaultValue < context.qualityRequirement) {
        recommendations.push(`Increase qualityTarget parameter to ${context.qualityRequirement}`)
      }
    }

    if (context.timeConstraint && strategy.parameters.some(p => p.name === 'maxIterations')) {
      recommendations.push('Reduce maxIterations to meet time constraint')
    }

    return recommendations
  }

  /**
   * Estimate outcome
   */
  private estimateOutcome(strategy: ReasoningStrategy, context: StrategyContext): StrategyOutcome {
    const metrics = strategy.performanceMetrics

    return {
      expectedSuccessRate: metrics.totalUses > 0 
        ? metrics.successRate * 0.7 + 0.3 * (context.complexity === 'high' ? 0.5 : 0.8)
        : 0.6,
      expectedQuality: metrics.totalUses > 0
        ? metrics.averageQualityScore
        : 0.7,
      estimatedTime: metrics.totalUses > 0
        ? metrics.averageExecutionTime
        : 5000,
      resourceRequirements: [
        { type: 'api_calls', amount: 3, unit: 'calls' },
        { type: 'time', amount: metrics.averageExecutionTime || 5000, unit: 'ms' }
      ],
      potentialIssues: strategy.risks.slice(0, 2)
    }
  }

  /**
   * Determine risk level
   */
  private determineRiskLevel(strategy: ReasoningStrategy, context: StrategyContext): 'low' | 'medium' | 'high' {
    const metrics = strategy.performanceMetrics

    if (metrics.totalUses < 3) return 'high'
    if (metrics.successRate < 0.5) return 'high'
    if (context.previousFailures?.includes(strategy.id)) return 'high'
    if (metrics.successRate < 0.7) return 'medium'
    if (strategy.risks.length > 3) return 'medium'

    return 'low'
  }

  /**
   * Calculate recent success rate
   */
  private calculateRecentSuccessRate(
    strategyId: string,
    count: number,
    skip: number = 0
  ): number {
    const executions = this.executions.get(strategyId) || []
    const relevant = executions.slice(skip, skip + count)
    
    if (relevant.length === 0) return 0.5

    const successes = relevant.filter(e => e.success).length
    return successes / relevant.length
  }

  /**
   * Add a custom strategy
   */
  addStrategy(strategy: ReasoningStrategy): void {
    this.strategies.set(strategy.id, strategy)
  }

  /**
   * Get all strategies
   */
  getStrategies(): ReasoningStrategy[] {
    return Array.from(this.strategies.values())
  }

  /**
   * Get strategies by category
   */
  getStrategiesByCategory(category: StrategyCategory): ReasoningStrategy[] {
    return Array.from(this.strategies.values()).filter(s => s.category === category)
  }

  /**
   * Get strategy by ID
   */
  getStrategy(id: string): ReasoningStrategy | undefined {
    return this.strategies.get(id)
  }

  /**
   * Get execution history
   */
  getExecutionHistory(strategyId?: string): StrategyExecution[] {
    if (strategyId) {
      return this.executions.get(strategyId) || []
    }

    const allExecutions: StrategyExecution[] = []
    this.executions.forEach(execs => {
      allExecutions.push(...execs)
    })
    return allExecutions.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )
  }

  /**
   * Get comparison history
   */
  getComparisonHistory(): ComparisonResult[] {
    return this.comparisonHistory
  }

  /**
   * Get strategy performance summary
   */
  getPerformanceSummary(): {
    strategyId: string
    name: string
    successRate: number
    averageQuality: number
    totalUses: number
    trend: string
  }[] {
    return Array.from(this.strategies.values()).map(s => ({
      strategyId: s.id,
      name: s.name,
      successRate: s.performanceMetrics.successRate,
      averageQuality: s.performanceMetrics.averageQualityScore,
      totalUses: s.performanceMetrics.totalUses,
      trend: s.performanceMetrics.trendOverTime
    }))
  }
}

// Singleton instance
let evaluatorInstance: StrategyEvaluator | null = null

export async function getStrategyEvaluator(): Promise<StrategyEvaluator> {
  if (!evaluatorInstance) {
    evaluatorInstance = new StrategyEvaluator()
    await evaluatorInstance.initialize()
  }
  return evaluatorInstance
}

// Export types
export type {
  ReasoningStrategy,
  StrategyParameter,
  StrategyMetrics,
  StrategyCategory,
  StrategyEvaluation,
  StrategyOutcome,
  ResourceRequirement,
  ComparisonResult,
  StrategyComparison,
  StrategyContext,
  StrategyExecution
}
