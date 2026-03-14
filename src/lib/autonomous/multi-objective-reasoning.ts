/**
 * Multi-Objective Reasoning Engine
 * Mechanisms 110: Balance competing goals and find optimal solutions
 */

export interface Objective {
  id: string;
  name: string;
  description: string;
  type: ObjectiveType;
  direction: 'minimize' | 'maximize';
  weight: number;
  target?: number;
  threshold?: { lower: number; upper: number };
  constraints: ObjectiveConstraint[];
}

export type ObjectiveType =
  | 'performance'
  | 'cost'
  | 'quality'
  | 'time'
  | 'resource'
  | 'risk'
  | 'user_experience'
  | 'maintainability'
  | 'security'
  | 'scalability';

export interface ObjectiveConstraint {
  type: 'hard' | 'soft';
  condition: string;
  penalty?: number;
}

export interface Solution {
  id: string;
  variables: Record<string, unknown>;
  objectiveValues: Record<string, number>;
  normalizedScores: Record<string, number>;
  overallScore: number;
  rank: number;
  isParetoOptimal: boolean;
  tradeoffs: Tradeoff[];
}

export interface Tradeoff {
  fromObjective: string;
  toObjective: string;
  fromValue: number;
  toValue: number;
  sacrifice: number;
  gain: number;
  ratio: number;
}

export interface OptimizationResult {
  id: string;
  objectives: Objective[];
  solutions: Solution[];
  paretoFrontier: Solution[];
  bestOverall: Solution | null;
  recommendations: OptimizationRecommendation[];
  tradeoffAnalysis: TradeoffAnalysis;
  confidence: number;
}

export interface OptimizationRecommendation {
  type: 'best_overall' | 'best_for_objective' | 'best_tradeoff' | 'balanced';
  solutionId: string;
  reason: string;
  objectives: string[];
}

export interface TradeoffAnalysis {
  conflicts: ObjectiveConflict[];
  synergies: ObjectiveSynergy[];
  sensitivityMatrix: number[][];
}

export interface ObjectiveConflict {
  objective1: string;
  objective2: string;
  correlation: number;
  description: string;
  tradeoffSuggestion: string;
}

export interface ObjectiveSynergy {
  objective1: string;
  objective2: string;
  correlation: number;
  description: string;
  leverageSuggestion: string;
}

export interface SearchSpace {
  variables: DecisionVariable[];
  constraints: SearchConstraint[];
}

export interface DecisionVariable {
  name: string;
  type: 'continuous' | 'discrete' | 'categorical';
  domain: number[] | string[];
  currentValue?: unknown;
}

export interface SearchConstraint {
  expression: string;
  type: 'equality' | 'inequality';
}

export class MultiObjectiveReasoningEngine {
  private objectives: Map<string, Objective>;
  private solutions: Solution[];
  private searchSpace: SearchSpace | null;
  private evaluationFunction: EvaluationFunction | null;

  constructor() {
    this.objectives = new Map();
    this.solutions = [];
    this.searchSpace = null;
    this.evaluationFunction = null;
  }

  /**
   * Define objectives for optimization
   */
  defineObjective(config: Omit<Objective, 'id'>): Objective {
    const objective: Objective = {
      ...config,
      id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    this.objectives.set(objective.id, objective);
    return objective;
  }

  /**
   * Define search space for solutions
   */
  defineSearchSpace(space: SearchSpace): void {
    this.searchSpace = space;
  }

  /**
   * Set custom evaluation function
   */
  setEvaluationFunction(fn: EvaluationFunction): void {
    this.evaluationFunction = fn;
  }

  /**
   * Find optimal solutions
   */
  async optimize(options?: OptimizationOptions): Promise<OptimizationResult> {
    const objectives = Array.from(this.objectives.values());
    
    if (objectives.length === 0) {
      throw new Error('No objectives defined');
    }

    // Generate candidate solutions
    const candidates = await this.generateCandidates(options?.populationSize || 100);
    
    // Evaluate candidates against objectives
    const evaluated = await this.evaluateCandidates(candidates, objectives);
    
    // Apply Pareto optimization
    const paretoFrontier = this.findParetoFrontier(evaluated);
    
    // Rank solutions
    const ranked = this.rankSolutions(evaluated, objectives);
    
    // Analyze tradeoffs
    const tradeoffAnalysis = this.analyzeTradeoffs(ranked, objectives);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(ranked, paretoFrontier, objectives);
    
    // Find best overall solution
    const bestOverall = this.findBestOverall(ranked, objectives);

    return {
      id: `opt_${Date.now()}`,
      objectives,
      solutions: ranked,
      paretoFrontier,
      bestOverall,
      recommendations,
      tradeoffAnalysis,
      confidence: this.calculateConfidence(ranked, objectives),
    };
  }

  /**
   * Compare two solutions
   */
  compareSolutions(solution1: Solution, solution2: Solution): ComparisonResult {
    const objectives = Array.from(this.objectives.values());
    let wins = 0;
    let losses = 0;
    const details: ComparisonDetail[] = [];

    for (const objective of objectives) {
      const v1 = solution1.objectiveValues[objective.id];
      const v2 = solution2.objectiveValues[objective.id];
      
      let winner: 'solution1' | 'solution2' | 'tie';
      if (objective.direction === 'maximize') {
        if (v1 > v2) { wins++; winner = 'solution1'; }
        else if (v2 > v1) { losses++; winner = 'solution2'; }
        else { winner = 'tie'; }
      } else {
        if (v1 < v2) { wins++; winner = 'solution1'; }
        else if (v2 < v1) { losses++; winner = 'solution2'; }
        else { winner = 'tie'; }
      }

      details.push({
        objective: objective.name,
        value1: v1,
        value2: v2,
        winner,
        weight: objective.weight,
      });
    }

    return {
      solution1Id: solution1.id,
      solution2Id: solution2.id,
      solution1Wins: wins,
      solution2Wins: losses,
      ties: objectives.length - wins - losses,
      dominant: wins > losses ? 'solution1' : losses > wins ? 'solution2' : 'neither',
      details,
    };
  }

  /**
   * Find solutions near a specific tradeoff point
   */
  findNearTradeoff(
    target: Record<string, number>,
    tolerance: number = 0.1
  ): Solution[] {
    return this.solutions.filter(solution => {
      for (const [objId, targetValue] of Object.entries(target)) {
        const actualValue = solution.normalizedScores[objId];
        if (actualValue === undefined) continue;
        
        const diff = Math.abs(actualValue - targetValue);
        if (diff > tolerance) return false;
      }
      return true;
    });
  }

  /**
   * Suggest objective weight adjustments
   */
  suggestWeightAdjustments(
    currentWeights: Record<string, number>,
    desiredOutcome: DesiredOutcome
  ): WeightAdjustment[] {
    const adjustments: WeightAdjustment[] = [];
    const objectives = Array.from(this.objectives.values());

    for (const objective of objectives) {
      const currentWeight = currentWeights[objective.id] || objective.weight;
      let suggestedWeight = currentWeight;
      let reason = '';

      if (desiredOutcome.priority === objective.type) {
        suggestedWeight = Math.min(1, currentWeight * 1.5);
        reason = `Increasing weight to prioritize ${objective.name}`;
      } else if (desiredOutcome.sacrifices?.includes(objective.type)) {
        suggestedWeight = Math.max(0.1, currentWeight * 0.5);
        reason = `Reducing weight to allow sacrifice of ${objective.name}`;
      }

      adjustments.push({
        objectiveId: objective.id,
        objectiveName: objective.name,
        currentWeight,
        suggestedWeight,
        reason,
      });
    }

    return this.normalizeWeights(adjustments);
  }

  private async generateCandidates(count: number): Promise<Solution[]> {
    const candidates: Solution[] = [];

    if (this.searchSpace) {
      // Generate candidates based on search space
      for (let i = 0; i < count; i++) {
        const variables: Record<string, unknown> = {};
        
        for (const variable of this.searchSpace.variables) {
          if (variable.type === 'continuous') {
            const [min, max] = variable.domain as number[];
            variables[variable.name] = min + Math.random() * (max - min);
          } else if (variable.type === 'discrete') {
            const values = variable.domain as number[];
            variables[variable.name] = values[Math.floor(Math.random() * values.length)];
          } else if (variable.type === 'categorical') {
            const values = variable.domain as string[];
            variables[variable.name] = values[Math.floor(Math.random() * values.length)];
          }
        }

        candidates.push({
          id: `sol_${i}`,
          variables,
          objectiveValues: {},
          normalizedScores: {},
          overallScore: 0,
          rank: 0,
          isParetoOptimal: false,
          tradeoffs: [],
        });
      }
    } else {
      // Generate random candidates
      for (let i = 0; i < count; i++) {
        candidates.push({
          id: `sol_${i}`,
          variables: { x: Math.random(), y: Math.random() },
          objectiveValues: {},
          normalizedScores: {},
          overallScore: 0,
          rank: 0,
          isParetoOptimal: false,
          tradeoffs: [],
        });
      }
    }

    return candidates;
  }

  private async evaluateCandidates(
    candidates: Solution[],
    objectives: Objective[]
  ): Promise<Solution[]> {
    return candidates.map(candidate => {
      const objectiveValues: Record<string, number> = {};
      
      for (const objective of objectives) {
        if (this.evaluationFunction) {
          objectiveValues[objective.id] = this.evaluationFunction(
            candidate.variables,
            objective
          );
        } else {
          // Default evaluation - simple linear combination
          objectiveValues[objective.id] = this.defaultEvaluation(
            candidate.variables,
            objective
          );
        }
      }

      return {
        ...candidate,
        objectiveValues,
      };
    });
  }

  private defaultEvaluation(
    variables: Record<string, unknown>,
    objective: Objective
  ): number {
    // Simple default evaluation
    const values = Object.values(variables).filter(
      (v): v is number => typeof v === 'number'
    );
    if (values.length === 0) return 0;

    switch (objective.type) {
      case 'cost':
        return values.reduce((sum, v) => sum + v * 100, 0);
      case 'performance':
        return values.reduce((sum, v) => sum + v * 1000, 0);
      case 'time':
        return values.reduce((sum, v) => sum + v * 10, 0);
      case 'quality':
        return values.reduce((sum, v) => sum + v, 0) / values.length * 100;
      default:
        return values.reduce((sum, v) => sum + v, 0) / values.length * 50;
    }
  }

  private findParetoFrontier(solutions: Solution[]): Solution[] {
    const pareto: Solution[] = [];

    for (const solution of solutions) {
      let dominated = false;

      for (const other of solutions) {
        if (solution.id === other.id) continue;
        
        if (this.dominates(other, solution)) {
          dominated = true;
          break;
        }
      }

      if (!dominated) {
        solution.isParetoOptimal = true;
        pareto.push(solution);
      }
    }

    return pareto;
  }

  private dominates(s1: Solution, s2: Solution): boolean {
    const objectives = Array.from(this.objectives.values());
    let atLeastOneBetter = false;

    for (const objective of objectives) {
      const v1 = s1.objectiveValues[objective.id];
      const v2 = s2.objectiveValues[objective.id];

      if (objective.direction === 'maximize') {
        if (v1 < v2) return false;
        if (v1 > v2) atLeastOneBetter = true;
      } else {
        if (v1 > v2) return false;
        if (v1 < v2) atLeastOneBetter = true;
      }
    }

    return atLeastOneBetter;
  }

  private rankSolutions(
    solutions: Solution[],
    objectives: Objective[]
  ): Solution[] {
    // Normalize objective values
    const normalized = this.normalizeSolutions(solutions, objectives);

    // Calculate weighted scores
    for (const solution of normalized) {
      let score = 0;
      
      for (const objective of objectives) {
        const normalizedValue = solution.normalizedScores[objective.id];
        const weight = objective.weight / objectives.reduce((sum, o) => sum + o.weight, 0);
        score += normalizedValue * weight;
      }

      solution.overallScore = score;
    }

    // Sort by overall score
    const sorted = normalized.sort((a, b) => b.overallScore - a.overallScore);
    
    // Assign ranks
    sorted.forEach((solution, index) => {
      solution.rank = index + 1;
    });

    // Calculate tradeoffs for top solutions
    for (let i = 0; i < Math.min(10, sorted.length); i++) {
      sorted[i].tradeoffs = this.calculateTradeoffs(sorted[i], objectives);
    }

    return sorted;
  }

  private normalizeSolutions(
    solutions: Solution[],
    objectives: Objective[]
  ): Solution[] {
    // Find min and max for each objective
    const ranges: Record<string, { min: number; max: number }> = {};

    for (const objective of objectives) {
      const values = solutions.map(s => s.objectiveValues[objective.id]);
      ranges[objective.id] = {
        min: Math.min(...values),
        max: Math.max(...values),
      };
    }

    // Normalize values
    return solutions.map(solution => {
      const normalizedScores: Record<string, number> = {};

      for (const objective of objectives) {
        const value = solution.objectiveValues[objective.id];
        const { min, max } = ranges[objective.id];
        const range = max - min || 1;

        // Normalize to 0-1 range, considering direction
        if (objective.direction === 'maximize') {
          normalizedScores[objective.id] = (value - min) / range;
        } else {
          normalizedScores[objective.id] = (max - value) / range;
        }
      }

      return {
        ...solution,
        normalizedScores,
      };
    });
  }

  private calculateTradeoffs(
    solution: Solution,
    objectives: Objective[]
  ): Tradeoff[] {
    const tradeoffs: Tradeoff[] = [];
    const paretoSolutions = this.solutions.filter(s => s.isParetoOptimal);

    for (let i = 0; i < objectives.length; i++) {
      for (let j = i + 1; j < objectives.length; j++) {
        const obj1 = objectives[i];
        const obj2 = objectives[j];

        // Find solutions that trade off between these objectives
        const relevantSolutions = paretoSolutions.filter(
          s => Math.abs(s.normalizedScores[obj1.id] - solution.normalizedScores[obj1.id]) < 0.2 ||
               Math.abs(s.normalizedScores[obj2.id] - solution.normalizedScores[obj2.id]) < 0.2
        );

        if (relevantSolutions.length > 1) {
          tradeoffs.push({
            fromObjective: obj1.name,
            toObjective: obj2.name,
            fromValue: solution.objectiveValues[obj1.id],
            toValue: solution.objectiveValues[obj2.id],
            sacrifice: 0,
            gain: 0,
            ratio: solution.normalizedScores[obj1.id] / (solution.normalizedScores[obj2.id] || 0.1),
          });
        }
      }
    }

    return tradeoffs;
  }

  private analyzeTradeoffs(
    solutions: Solution[],
    objectives: Objective[]
  ): TradeoffAnalysis {
    const conflicts: ObjectiveConflict[] = [];
    const synergies: ObjectiveSynergy[] = [];

    // Calculate correlation matrix
    const n = objectives.length;
    const sensitivityMatrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          sensitivityMatrix[i][j] = 1;
          continue;
        }

        const correlation = this.calculateCorrelation(
          solutions.map(s => s.normalizedScores[objectives[i].id]),
          solutions.map(s => s.normalizedScores[objectives[j].id])
        );

        sensitivityMatrix[i][j] = correlation;

        if (i < j) {
          if (correlation < -0.3) {
            conflicts.push({
              objective1: objectives[i].name,
              objective2: objectives[j].name,
              correlation,
              description: `${objectives[i].name} and ${objectives[j].name} are in conflict`,
              tradeoffSuggestion: `Balance between ${objectives[i].name} and ${objectives[j].name} requires careful consideration`,
            });
          } else if (correlation > 0.3) {
            synergies.push({
              objective1: objectives[i].name,
              objective2: objectives[j].name,
              correlation,
              description: `${objectives[i].name} and ${objectives[j].name} are synergistic`,
              leverageSuggestion: `Improving ${objectives[i].name} will also improve ${objectives[j].name}`,
            });
          }
        }
      }
    }

    return { conflicts, synergies, sensitivityMatrix };
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n === 0) return 0;

    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    const denominator = Math.sqrt(denomX * denomY);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private generateRecommendations(
    solutions: Solution[],
    paretoFrontier: Solution[],
    objectives: Objective[]
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    if (solutions.length === 0) return recommendations;

    // Best overall
    recommendations.push({
      type: 'best_overall',
      solutionId: solutions[0].id,
      reason: 'Highest weighted score across all objectives',
      objectives: objectives.map(o => o.name),
    });

    // Best for each objective
    for (const objective of objectives) {
      const best = solutions.reduce((best, current) => {
        const bestValue = best.objectiveValues[objective.id];
        const currentValue = current.objectiveValues[objective.id];
        
        if (objective.direction === 'maximize') {
          return currentValue > bestValue ? current : best;
        } else {
          return currentValue < bestValue ? current : best;
        }
      });

      recommendations.push({
        type: 'best_for_objective',
        solutionId: best.id,
        reason: `Optimizes ${objective.name}`,
        objectives: [objective.name],
      });
    }

    // Most balanced (closest to center of normalized space)
    const balanced = solutions.reduce((closest, current) => {
      const currentDist = this.distanceFromCenter(current, objectives);
      const closestDist = this.distanceFromCenter(closest, objectives);
      return currentDist < closestDist ? current : closest;
    });

    recommendations.push({
      type: 'balanced',
      solutionId: balanced.id,
      reason: 'Most balanced across all objectives',
      objectives: objectives.map(o => o.name),
    });

    return recommendations;
  }

  private distanceFromCenter(solution: Solution, objectives: Objective[]): number {
    let sumSquares = 0;
    for (const objective of objectives) {
      const value = solution.normalizedScores[objective.id];
      sumSquares += Math.pow(value - 0.5, 2); // Distance from center (0.5)
    }
    return Math.sqrt(sumSquares);
  }

  private findBestOverall(
    solutions: Solution[],
    objectives: Objective[]
  ): Solution | null {
    if (solutions.length === 0) return null;
    return solutions[0]; // Already ranked by overall score
  }

  private calculateConfidence(
    solutions: Solution[],
    objectives: Objective[]
  ): number {
    if (solutions.length === 0) return 0;
    if (solutions.length < 10) return 0.5;

    // Higher confidence with more solutions and clear Pareto frontier
    const paretoCount = solutions.filter(s => s.isParetoOptimal).length;
    const spread = this.calculateSpread(solutions, objectives);

    return Math.min(0.95, 0.7 + paretoCount * 0.02 + spread * 0.1);
  }

  private calculateSpread(solutions: Solution[], objectives: Objective[]): number {
    if (solutions.length === 0) return 0;

    let totalSpread = 0;
    for (const objective of objectives) {
      const values = solutions.map(s => s.normalizedScores[objective.id]);
      const spread = Math.max(...values) - Math.min(...values);
      totalSpread += spread;
    }

    return totalSpread / objectives.length;
  }

  private normalizeWeights(adjustments: WeightAdjustment[]): WeightAdjustment[] {
    const total = adjustments.reduce((sum, a) => sum + a.suggestedWeight, 0);
    
    return adjustments.map(a => ({
      ...a,
      suggestedWeight: a.suggestedWeight / total,
    }));
  }
}

// Supporting interfaces
interface OptimizationOptions {
  populationSize?: number;
  maxIterations?: number;
  convergenceThreshold?: number;
}

interface EvaluationFunction {
  (variables: Record<string, unknown>, objective: Objective): number;
}

interface ComparisonResult {
  solution1Id: string;
  solution2Id: string;
  solution1Wins: number;
  solution2Wins: number;
  ties: number;
  dominant: 'solution1' | 'solution2' | 'neither';
  details: ComparisonDetail[];
}

interface ComparisonDetail {
  objective: string;
  value1: number;
  value2: number;
  winner: 'solution1' | 'solution2' | 'tie';
  weight: number;
}

interface DesiredOutcome {
  priority: ObjectiveType;
  sacrifices?: ObjectiveType[];
  constraints?: Record<string, { min?: number; max?: number }>;
}

interface WeightAdjustment {
  objectiveId: string;
  objectiveName: string;
  currentWeight: number;
  suggestedWeight: number;
  reason: string;
}

// Singleton instance
let engineInstance: MultiObjectiveReasoningEngine | null = null;

export function getMultiObjectiveReasoningEngine(): MultiObjectiveReasoningEngine {
  if (!engineInstance) {
    engineInstance = new MultiObjectiveReasoningEngine();
  }
  return engineInstance;
}
