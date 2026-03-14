/**
 * Iterative Refiner
 * Mechanisms 82-90: Iterative refinement and improvement of outputs
 */

export interface RefinementContext {
  id: string;
  input: unknown;
  currentOutput: unknown;
  targetCriteria: RefinementCriteria[];
  constraints: RefinementConstraint[];
  history: RefinementStep[];
}

export interface RefinementCriteria {
  name: string;
  description: string;
  evaluator: string;
  targetValue: number | string | boolean;
  weight: number;
  current?: number | string | boolean;
}

export interface RefinementConstraint {
  type: 'hard' | 'soft';
  description: string;
  satisfied: boolean;
  penalty: number;
}

export interface RefinementStep {
  iteration: number;
  timestamp: Date;
  action: string;
  changes: ChangeDescription[];
  metrics: Record<string, number>;
  improvement: number;
}

export interface ChangeDescription {
  target: string;
  before: unknown;
  after: unknown;
  reason: string;
}

export interface RefinementResult {
  id: string;
  contextId: string;
  iterations: number;
  finalOutput: unknown;
  metrics: RefinementMetrics;
  convergenceStatus: ConvergenceStatus;
  recommendations: string[];
}

export interface RefinementMetrics {
  totalImprovement: number;
  averageImprovementPerIteration: number;
  convergenceRate: number;
  criteriaScores: Record<string, number>;
  constraintViolations: number;
}

export interface ConvergenceStatus {
  converged: boolean;
  reason: string;
  lastImprovement: number;
  plateauIterations: number;
}

export class IterativeRefiner {
  private config: RefinementConfig;
  private strategies: Map<string, RefinementStrategy>;
  private evaluators: Map<string, EvaluatorFunction>;

  constructor(config?: Partial<RefinementConfig>) {
    this.config = {
      maxIterations: 20,
      convergenceThreshold: 0.001,
      improvementThreshold: 0.01,
      plateauLimit: 5,
      parallelStrategies: 3,
      ...config,
    };
    this.strategies = this.initializeStrategies();
    this.evaluators = this.initializeEvaluators();
  }

  /**
   * Refine an output iteratively
   */
  async refine(context: RefinementContext): Promise<RefinementResult> {
    let currentOutput = context.currentOutput;
    let iterations = 0;
    let plateauCount = 0;
    let lastImprovement = 0;
    const stepHistory: RefinementStep[] = [];

    while (iterations < this.config.maxIterations) {
      iterations++;

      // Evaluate current state
      const currentMetrics = this.evaluate(currentOutput, context.targetCriteria);

      // Check convergence
      if (this.hasConverged(currentMetrics, context.targetCriteria)) {
        return this.createResult(
          context,
          iterations,
          currentOutput,
          stepHistory,
          { converged: true, reason: 'Target criteria met', lastImprovement, plateauIterations: plateauCount }
        );
      }

      // Select refinement strategy
      const strategy = this.selectStrategy(currentOutput, context, currentMetrics);

      // Apply refinement
      const refinement = await this.applyRefinement(
        currentOutput,
        context,
        strategy,
        currentMetrics
      );

      // Evaluate improvement
      const improvement = this.calculateImprovement(
        currentMetrics,
        refinement.metrics
      );

      // Record step
      stepHistory.push({
        iteration: iterations,
        timestamp: new Date(),
        action: strategy.name,
        changes: refinement.changes,
        metrics: refinement.metrics,
        improvement,
      });

      // Check for plateau
      if (improvement < this.config.improvementThreshold) {
        plateauCount++;
        if (plateauCount >= this.config.plateauLimit) {
          return this.createResult(
            context,
            iterations,
            currentOutput,
            stepHistory,
            { converged: true, reason: 'Plateau reached', lastImprovement, plateauIterations: plateauCount }
          );
        }
      } else {
        plateauCount = 0;
        lastImprovement = improvement;
      }

      // Update output if improved
      if (improvement > 0) {
        currentOutput = refinement.output;
      }
    }

    return this.createResult(
      context,
      iterations,
      currentOutput,
      stepHistory,
      { converged: false, reason: 'Max iterations reached', lastImprovement, plateauIterations: plateauCount }
    );
  }

  /**
   * Refine with multiple strategies in parallel
   */
  async parallelRefine(context: RefinementContext): Promise<RefinementResult> {
    const strategies = this.getTopStrategies(context, this.config.parallelStrategies);
    const results = await Promise.all(
      strategies.map(strategy =>
        this.refineWithStrategy(context, strategy)
      )
    );

    // Select best result
    const best = results.reduce((best, current) => {
      const bestScore = this.calculateOverallScore(best.metrics);
      const currentScore = this.calculateOverallScore(current.metrics);
      return currentScore > bestScore ? current : best;
    });

    return best;
  }

  /**
   * Get refinement suggestions without applying
   */
  getSuggestions(context: RefinementContext): RefinementSuggestion[] {
    const currentMetrics = this.evaluate(context.currentOutput, context.targetCriteria);
    const suggestions: RefinementSuggestion[] = [];

    for (const [name, strategy] of this.strategies) {
      const applicability = strategy.isApplicable(context, currentMetrics);
      if (applicability.applicable) {
        suggestions.push({
          strategy: name,
          description: applicability.description,
          estimatedImprovement: applicability.estimatedImprovement,
          effort: applicability.effort,
          priority: applicability.priority,
        });
      }
    }

    return suggestions.sort((a, b) => b.estimatedImprovement - a.estimatedImprovement);
  }

  /**
   * Register custom evaluator
   */
  registerEvaluator(name: string, evaluator: EvaluatorFunction): void {
    this.evaluators.set(name, evaluator);
  }

  /**
   * Register custom strategy
   */
  registerStrategy(name: string, strategy: RefinementStrategy): void {
    this.strategies.set(name, strategy);
  }

  private initializeStrategies(): Map<string, RefinementStrategy> {
    return new Map([
      ['quality_improvement', {
        name: 'quality_improvement',
        isApplicable: (context, metrics) => ({
          applicable: true,
          description: 'Improve overall quality metrics',
          estimatedImprovement: 0.1,
          effort: 'medium',
          priority: 'high',
        }),
        apply: async (output, context, metrics) => ({
          output,
          changes: [],
          metrics,
        }),
      }],
      ['performance_optimization', {
        name: 'performance_optimization',
        isApplicable: (context, metrics) => ({
          applicable: metrics['performance'] !== undefined && metrics['performance'] < 0.8,
          description: 'Optimize performance metrics',
          estimatedImprovement: 0.15,
          effort: 'medium',
          priority: 'high',
        }),
        apply: async (output, context, metrics) => ({
          output,
          changes: [],
          metrics,
        }),
      }],
      ['error_reduction', {
        name: 'error_reduction',
        isApplicable: (context, metrics) => ({
          applicable: metrics['errorRate'] !== undefined && metrics['errorRate'] > 0.1,
          description: 'Reduce error rate',
          estimatedImprovement: 0.2,
          effort: 'low',
          priority: 'critical',
        }),
        apply: async (output, context, metrics) => ({
          output,
          changes: [],
          metrics,
        }),
      }],
      ['simplification', {
        name: 'simplification',
        isApplicable: (context, metrics) => ({
          applicable: metrics['complexity'] !== undefined && metrics['complexity'] > 0.7,
          description: 'Simplify complex output',
          estimatedImprovement: 0.1,
          effort: 'medium',
          priority: 'medium',
        }),
        apply: async (output, context, metrics) => ({
          output,
          changes: [],
          metrics,
        }),
      }],
    ]);
  }

  private initializeEvaluators(): Map<string, EvaluatorFunction> {
    return new Map([
      ['default', (output, criteria) => criteria.weight],
      ['quality', (output, criteria) => {
        // Quality evaluation logic
        return 0.8;
      }],
      ['performance', (output, criteria) => {
        // Performance evaluation logic
        return 0.7;
      }],
    ]);
  }

  private evaluate(
    output: unknown,
    criteria: RefinementCriteria[]
  ): Record<string, number> {
    const metrics: Record<string, number> = {};

    for (const criterion of criteria) {
      const evaluator = this.evaluators.get(criterion.evaluator) ||
        this.evaluators.get('default')!;

      const value = evaluator(output, criterion);
      metrics[criterion.name] = typeof value === 'number' ? value :
        typeof value === 'boolean' ? (value ? 1 : 0) : 0;
    }

    return metrics;
  }

  private hasConverged(
    metrics: Record<string, number>,
    criteria: RefinementCriteria[]
  ): boolean {
    for (const criterion of criteria) {
      const current = metrics[criterion.name];
      const target = criterion.targetValue;

      if (typeof target === 'number' && typeof current === 'number') {
        if (Math.abs(current - target) > this.config.convergenceThreshold) {
          return false;
        }
      } else if (current !== target) {
        return false;
      }
    }

    return true;
  }

  private selectStrategy(
    output: unknown,
    context: RefinementContext,
    metrics: Record<string, number>
  ): RefinementStrategy {
    let bestStrategy: RefinementStrategy | null = null;
    let bestScore = -1;

    for (const [, strategy] of this.strategies) {
      const applicability = strategy.isApplicable(context, metrics);
      if (applicability.applicable) {
        const score = applicability.estimatedImprovement *
          (applicability.priority === 'critical' ? 2 :
            applicability.priority === 'high' ? 1.5 : 1);

        if (score > bestScore) {
          bestScore = score;
          bestStrategy = strategy;
        }
      }
    }

    return bestStrategy || this.strategies.get('quality_improvement')!;
  }

  private async applyRefinement(
    output: unknown,
    context: RefinementContext,
    strategy: RefinementStrategy,
    currentMetrics: Record<string, number>
  ): Promise<{ output: unknown; changes: ChangeDescription[]; metrics: Record<string, number> }> {
    return strategy.apply(output, context, currentMetrics);
  }

  private calculateImprovement(
    before: Record<string, number>,
    after: Record<string, number>
  ): number {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    let totalImprovement = 0;
    let count = 0;

    for (const key of keys) {
      const beforeValue = before[key] || 0;
      const afterValue = after[key] || 0;

      totalImprovement += afterValue - beforeValue;
      count++;
    }

    return count > 0 ? totalImprovement / count : 0;
  }

  private calculateOverallScore(metrics: RefinementMetrics): number {
    const scores = Object.values(metrics.criteriaScores);
    return scores.reduce((sum, score) => sum + score, 0) / (scores.length || 1);
  }

  private async refineWithStrategy(
    context: RefinementContext,
    strategyName: string
  ): Promise<RefinementResult> {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Strategy not found: ${strategyName}`);
    }

    // Clone context with specific strategy
    const strategyContext = { ...context };

    return this.refine(strategyContext);
  }

  private getTopStrategies(
    context: RefinementContext,
    count: number
  ): string[] {
    const currentMetrics = this.evaluate(context.currentOutput, context.targetCriteria);
    const applicable: Array<{ name: string; score: number }> = [];

    for (const [name, strategy] of this.strategies) {
      const applicability = strategy.isApplicable(context, currentMetrics);
      if (applicability.applicable) {
        applicable.push({
          name,
          score: applicability.estimatedImprovement,
        });
      }
    }

    return applicable
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(s => s.name);
  }

  private createResult(
    context: RefinementContext,
    iterations: number,
    finalOutput: unknown,
    history: RefinementStep[],
    convergence: ConvergenceStatus
  ): RefinementResult {
    const finalMetrics = this.evaluate(finalOutput, context.targetCriteria);
    const criteriaScores: Record<string, number> = {};

    for (const criterion of context.targetCriteria) {
      criteriaScores[criterion.name] = finalMetrics[criterion.name] || 0;
    }

    const totalImprovement = history.reduce((sum, step) => sum + step.improvement, 0);

    return {
      id: this.generateId(),
      contextId: context.id,
      iterations,
      finalOutput,
      metrics: {
        totalImprovement,
        averageImprovementPerIteration: totalImprovement / (iterations || 1),
        convergenceRate: convergence.converged ? 1 : iterations / this.config.maxIterations,
        criteriaScores,
        constraintViolations: context.constraints.filter(c => !c.satisfied).length,
      },
      convergenceStatus: convergence,
      recommendations: this.generateRecommendations(finalMetrics, convergence),
    };
  }

  private generateRecommendations(
    metrics: Record<string, number>,
    convergence: ConvergenceStatus
  ): string[] {
    const recommendations: string[] = [];

    if (!convergence.converged) {
      recommendations.push('Consider increasing max iterations or adjusting criteria');
    }

    for (const [name, value] of Object.entries(metrics)) {
      if (value < 0.5) {
        recommendations.push(`Improve ${name} score for better results`);
      }
    }

    return recommendations;
  }

  private generateId(): string {
    return `refine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Supporting interfaces
interface RefinementConfig {
  maxIterations: number;
  convergenceThreshold: number;
  improvementThreshold: number;
  plateauLimit: number;
  parallelStrategies: number;
}

interface RefinementStrategy {
  name: string;
  isApplicable: (context: RefinementContext, metrics: Record<string, number>) => {
    applicable: boolean;
    description: string;
    estimatedImprovement: number;
    effort: 'low' | 'medium' | 'high';
    priority: 'critical' | 'high' | 'medium' | 'low';
  };
  apply: (
    output: unknown,
    context: RefinementContext,
    metrics: Record<string, number>
  ) => Promise<{
    output: unknown;
    changes: ChangeDescription[];
    metrics: Record<string, number>;
  }>;
}

interface RefinementSuggestion {
  strategy: string;
  description: string;
  estimatedImprovement: number;
  effort: 'low' | 'medium' | 'high';
  priority: 'critical' | 'high' | 'medium' | 'low';
}

type EvaluatorFunction = (
  output: unknown,
  criteria: RefinementCriteria
) => number | boolean;

// Singleton instance
let refinerInstance: IterativeRefiner | null = null;

export function getIterativeRefiner(): IterativeRefiner {
  if (!refinerInstance) {
    refinerInstance = new IterativeRefiner();
  }
  return refinerInstance;
}
