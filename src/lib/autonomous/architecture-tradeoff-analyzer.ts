/**
 * Architecture Tradeoff Analyzer
 * Analyzes tradeoffs between architecture options and decisions
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface TradeoffFactor {
  id: string;
  name: string;
  description: string;
  category: 'performance' | 'cost' | 'complexity' | 'reliability' | 'security' | 'scalability' | 'maintainability';
  importance: number; // 1-10
  unit?: string;
}

export interface TradeoffOption {
  id: string;
  name: string;
  description: string;
  factorScores: Map<string, number>; // factorId -> score (0-100)
  constraints: TradeoffConstraint[];
}

export interface TradeoffConstraint {
  factorId: string;
  type: 'minimum' | 'maximum' | 'exact';
  value: number;
  description?: string;
}

export interface TradeoffAnalysis {
  id: string;
  timestamp: Date;
  options: TradeoffOption[];
  factors: TradeoffFactor[];
  results: TradeoffResult[];
  optimalOption: string;
  confidence: number;
  sensitivityAnalysis: SensitivityResult[];
  recommendations: string[];
}

export interface TradeoffResult {
  optionId: string;
  optionName: string;
  weightedScore: number;
  normalizedScore: number;
  factorBreakdown: Map<string, number>;
  rank: number;
  strengths: string[];
  weaknesses: string[];
}

export interface SensitivityResult {
  factorId: string;
  factorName: string;
  impact: number; // How much the optimal choice changes with factor weight changes
  criticalRange: { min: number; max: number };
  currentWeight: number;
}

export interface TradeoffVisualization {
  radarChart: { factor: string; values: Map<string, number> }[];
  barChart: { option: string; score: number }[];
  decisionMatrix: { factor: string; options: Map<string, number> }[];
}

// ============================================================================
// Default Tradeoff Factors
// ============================================================================

const DEFAULT_FACTORS: TradeoffFactor[] = [
  {
    id: 'perf-response-time',
    name: 'Response Time',
    description: 'System response latency',
    category: 'performance',
    importance: 8,
    unit: 'ms'
  },
  {
    id: 'perf-throughput',
    name: 'Throughput',
    description: 'Requests handled per second',
    category: 'performance',
    importance: 7,
    unit: 'req/s'
  },
  {
    id: 'cost-infrastructure',
    name: 'Infrastructure Cost',
    description: 'Monthly infrastructure expenses',
    category: 'cost',
    importance: 7,
    unit: '$/month'
  },
  {
    id: 'cost-development',
    name: 'Development Cost',
    description: 'Initial development effort',
    category: 'cost',
    importance: 6,
    unit: 'person-days'
  },
  {
    id: 'complexity-arch',
    name: 'Architectural Complexity',
    description: 'Complexity of the architecture',
    category: 'complexity',
    importance: 6
  },
  {
    id: 'complexity-code',
    name: 'Code Complexity',
    description: 'Complexity of the codebase',
    category: 'complexity',
    importance: 5
  },
  {
    id: 'reliability-availability',
    name: 'Availability',
    description: 'System uptime percentage',
    category: 'reliability',
    importance: 9,
    unit: '%'
  },
  {
    id: 'reliability-fault',
    name: 'Fault Tolerance',
    description: 'Ability to handle failures',
    category: 'reliability',
    importance: 8
  },
  {
    id: 'security-data',
    name: 'Data Security',
    description: 'Protection of sensitive data',
    category: 'security',
    importance: 9
  },
  {
    id: 'security-access',
    name: 'Access Control',
    description: 'Authorization and authentication',
    category: 'security',
    importance: 8
  },
  {
    id: 'scale-horizontal',
    name: 'Horizontal Scaling',
    description: 'Ability to scale out',
    category: 'scalability',
    importance: 7
  },
  {
    id: 'scale-vertical',
    name: 'Vertical Scaling',
    description: 'Ability to scale up',
    category: 'scalability',
    importance: 5
  },
  {
    id: 'maintain-testability',
    name: 'Testability',
    description: 'Ease of testing',
    category: 'maintainability',
    importance: 7
  },
  {
    id: 'maintain-debug',
    name: 'Debuggability',
    description: 'Ease of debugging',
    category: 'maintainability',
    importance: 6
  },
  {
    id: 'maintain-modify',
    name: 'Modifiability',
    description: 'Ease of making changes',
    category: 'maintainability',
    importance: 7
  }
];

// ============================================================================
// Architecture Tradeoff Analyzer Class
// ============================================================================

export class ArchitectureTradeoffAnalyzer {
  private factors: Map<string, TradeoffFactor> = new Map();
  private options: Map<string, TradeoffOption> = new Map();
  private analysisHistory: TradeoffAnalysis[] = [];

  constructor(factors?: TradeoffFactor[]) {
    const initialFactors = factors || DEFAULT_FACTORS;
    for (const factor of initialFactors) {
      this.factors.set(factor.id, factor);
    }
  }

  // --------------------------------------------------------------------------
  // Factor Management
  // --------------------------------------------------------------------------

  addFactor(factor: TradeoffFactor): void {
    this.factors.set(factor.id, factor);
  }

  updateFactor(id: string, updates: Partial<TradeoffFactor>): boolean {
    const existing = this.factors.get(id);
    if (!existing) return false;
    this.factors.set(id, { ...existing, ...updates });
    return true;
  }

  removeFactor(id: string): boolean {
    return this.factors.delete(id);
  }

  getFactor(id: string): TradeoffFactor | undefined {
    return this.factors.get(id);
  }

  getAllFactors(): TradeoffFactor[] {
    return Array.from(this.factors.values());
  }

  getFactorsByCategory(category: TradeoffFactor['category']): TradeoffFactor[] {
    return Array.from(this.factors.values()).filter(f => f.category === category);
  }

  // --------------------------------------------------------------------------
  // Option Management
  // --------------------------------------------------------------------------

  addOption(option: TradeoffOption): void {
    this.options.set(option.id, option);
  }

  updateOption(id: string, updates: Partial<TradeoffOption>): boolean {
    const existing = this.options.get(id);
    if (!existing) return false;
    this.options.set(id, { ...existing, ...updates });
    return true;
  }

  removeOption(id: string): boolean {
    return this.options.delete(id);
  }

  getOption(id: string): TradeoffOption | undefined {
    return this.options.get(id);
  }

  getAllOptions(): TradeoffOption[] {
    return Array.from(this.options.values());
  }

  // --------------------------------------------------------------------------
  // Analysis Functions
  // --------------------------------------------------------------------------

  analyze(): TradeoffAnalysis {
    const options = Array.from(this.options.values());
    const factors = Array.from(this.factors.values());

    // Calculate results for each option
    const results: TradeoffResult[] = options.map(option => this.analyzeOption(option, factors));

    // Rank results
    const sortedResults = [...results].sort((a, b) => b.weightedScore - a.weightedScore);
    sortedResults.forEach((result, index) => {
      result.rank = index + 1;
    });

    // Normalize scores
    const maxScore = Math.max(...results.map(r => r.weightedScore), 1);
    for (const result of results) {
      result.normalizedScore = (result.weightedScore / maxScore) * 100;
    }

    // Find optimal option
    const optimalOption = sortedResults[0]?.optionId || '';
    
    // Calculate confidence
    const confidence = this.calculateConfidence(sortedResults);

    // Perform sensitivity analysis
    const sensitivityAnalysis = this.performSensitivityAnalysis(options, factors);

    // Generate recommendations
    const recommendations = this.generateRecommendations(results, factors);

    const analysis: TradeoffAnalysis = {
      id: `analysis-${Date.now()}`,
      timestamp: new Date(),
      options,
      factors,
      results: sortedResults,
      optimalOption,
      confidence,
      sensitivityAnalysis,
      recommendations
    };

    this.analysisHistory.push(analysis);
    return analysis;
  }

  compareOptions(optionId1: string, optionId2: string): {
    option1: TradeoffOption | null;
    option2: TradeoffOption | null;
    differences: Map<string, { factor: string; diff: number; winner: string }>;
    summary: string;
  } {
    const option1 = this.options.get(optionId1);
    const option2 = this.options.get(optionId2);

    if (!option1 || !option2) {
      return {
        option1: option1 || null,
        option2: option2 || null,
        differences: new Map(),
        summary: 'One or both options not found'
      };
    }

    const differences = new Map<string, { factor: string; diff: number; winner: string }>();
    let option1Wins = 0;
    let option2Wins = 0;

    for (const [factorId, score1] of option1.factorScores) {
      const score2 = option2.factorScores.get(factorId) || 0;
      const factor = this.factors.get(factorId);
      const diff = score1 - score2;

      if (Math.abs(diff) > 5) {
        differences.set(factorId, {
          factor: factor?.name || factorId,
          diff,
          winner: diff > 0 ? option1.name : option2.name
        });

        if (diff > 0) option1Wins++;
        else option2Wins++;
      }
    }

    let summary: string;
    if (option1Wins > option2Wins) {
      summary = `${option1.name} is better in ${option1Wins} factors vs ${option2Wins}`;
    } else if (option2Wins > option1Wins) {
      summary = `${option2.name} is better in ${option2Wins} factors vs ${option1Wins}`;
    } else {
      summary = `Both options are evenly matched (${option1Wins} factors each)`;
    }

    return { option1, option2, differences, summary };
  }

  // --------------------------------------------------------------------------
  // Visualization
  // --------------------------------------------------------------------------

  generateVisualization(): TradeoffVisualization {
    const options = Array.from(this.options.values());
    const factors = Array.from(this.factors.values());

    // Radar chart data
    const radarChart = factors.map(factor => {
      const values = new Map<string, number>();
      for (const option of options) {
        values.set(option.name, option.factorScores.get(factor.id) || 0);
      }
      return { factor: factor.name, values };
    });

    // Bar chart data
    const barChart = options.map(option => {
      const score = this.calculateWeightedScore(option, factors);
      return { option: option.name, score };
    });

    // Decision matrix
    const decisionMatrix = factors.map(factor => {
      const optionsMap = new Map<string, number>();
      for (const option of options) {
        optionsMap.set(option.name, option.factorScores.get(factor.id) || 0);
      }
      return { factor: factor.name, options: optionsMap };
    });

    return { radarChart, barChart, decisionMatrix };
  }

  // --------------------------------------------------------------------------
  // Private Helper Methods
  // --------------------------------------------------------------------------

  private analyzeOption(option: TradeoffOption, factors: TradeoffFactor[]): TradeoffResult {
    const weightedScore = this.calculateWeightedScore(option, factors);
    const factorBreakdown = new Map<string, number>();

    for (const factor of factors) {
      const score = option.factorScores.get(factor.id) || 50;
      factorBreakdown.set(factor.name, score * (factor.importance / 10));
    }

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    for (const factor of factors) {
      const score = option.factorScores.get(factor.id) || 50;
      if (score >= 80) {
        strengths.push(`Excellent ${factor.name.toLowerCase()} (${score})`);
      } else if (score < 40) {
        weaknesses.push(`Poor ${factor.name.toLowerCase()} (${score})`);
      }
    }

    return {
      optionId: option.id,
      optionName: option.name,
      weightedScore,
      normalizedScore: 0, // Set later
      factorBreakdown,
      rank: 0, // Set later
      strengths,
      weaknesses
    };
  }

  private calculateWeightedScore(option: TradeoffOption, factors: TradeoffFactor[]): number {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const factor of factors) {
      const score = option.factorScores.get(factor.id) || 50;
      const weight = factor.importance;
      weightedSum += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private calculateConfidence(results: TradeoffResult[]): number {
    if (results.length < 2) return 0.5;

    // Higher confidence when top option is clearly better
    const topScore = results[0]?.weightedScore || 0;
    const secondScore = results[1]?.weightedScore || 0;
    const gap = topScore - secondScore;

    // Base confidence on gap size
    if (gap > 20) return 0.9;
    if (gap > 10) return 0.8;
    if (gap > 5) return 0.7;
    if (gap > 2) return 0.6;
    return 0.5;
  }

  private performSensitivityAnalysis(
    options: TradeoffOption[],
    factors: TradeoffFactor[]
  ): SensitivityResult[] {
    const results: SensitivityResult[] = [];

    for (const factor of factors) {
      // Test how much the optimal choice changes when this factor's weight changes
      const originalWeight = factor.importance;
      let flipCount = 0;
      const tests = 20;

      for (let i = 0; i < tests; i++) {
        const testWeight = (i + 1) * 0.5; // 0.5 to 10
        factor.importance = testWeight;

        const analysis = this.analyzeWithCurrentState(options, factors);
        const originalAnalysis = this.analyzeWithCurrentState(options, factors);

        if (analysis.optimalOption !== originalAnalysis.optimalOption) {
          flipCount++;
        }
      }

      factor.importance = originalWeight;

      // Calculate critical range where the optimal choice changes
      let criticalMin = 0;
      let criticalMax = 10;
      
      for (let w = 1; w <= 10; w++) {
        factor.importance = w;
        const analysis = this.analyzeWithCurrentState(options, factors);
        // Simplified check - in production would be more sophisticated
      }

      factor.importance = originalWeight;

      results.push({
        factorId: factor.id,
        factorName: factor.name,
        impact: flipCount / tests,
        criticalRange: { min: criticalMin, max: criticalMax },
        currentWeight: originalWeight
      });
    }

    return results.sort((a, b) => b.impact - a.impact);
  }

  private analyzeWithCurrentState(
    options: TradeoffOption[],
    factors: TradeoffFactor[]
  ): { optimalOption: string } {
    let bestScore = -1;
    let optimalOption = '';

    for (const option of options) {
      const score = this.calculateWeightedScore(option, factors);
      if (score > bestScore) {
        bestScore = score;
        optimalOption = option.id;
      }
    }

    return { optimalOption };
  }

  private generateRecommendations(results: TradeoffResult[], factors: TradeoffFactor[]): string[] {
    const recommendations: string[] = [];
    
    if (results.length === 0) {
      recommendations.push('Add options to perform tradeoff analysis');
      return recommendations;
    }

    const top = results[0];
    const worst = results[results.length - 1];

    recommendations.push(`Recommended option: ${top.optionName} (score: ${top.normalizedScore.toFixed(1)})`);

    if (top.weaknesses.length > 0) {
      recommendations.push(`Address weaknesses in ${top.optionName}: ${top.weaknesses.join(', ')}`);
    }

    // Check for close competition
    if (results.length > 1) {
      const gap = top.weightedScore - results[1].weightedScore;
      if (gap < 5) {
        recommendations.push(`Close competition with ${results[1].optionName}. Consider additional factors.`);
      }
    }

    // Category-specific recommendations
    const categoryScores = new Map<string, number[]>();
    for (const factor of factors) {
      const scores = results.map(r => r.factorBreakdown.get(factor.name) || 0);
      const catScores = categoryScores.get(factor.category) || [];
      catScores.push(...scores);
      categoryScores.set(factor.category, catScores);
    }

    for (const [category, scores] of categoryScores) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avgScore < 40) {
        recommendations.push(`Warning: Low scores in ${category} category across all options`);
      }
    }

    return recommendations;
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  getAnalysisHistory(): TradeoffAnalysis[] {
    return [...this.analysisHistory];
  }

  exportConfig(): { factors: TradeoffFactor[]; options: TradeoffOption[] } {
    return {
      factors: Array.from(this.factors.values()),
      options: Array.from(this.options.values())
    };
  }

  importConfig(config: { factors: TradeoffFactor[]; options: TradeoffOption[] }): void {
    for (const factor of config.factors) {
      this.factors.set(factor.id, factor);
    }
    for (const option of config.options) {
      this.options.set(option.id, option);
    }
  }

  clearOptions(): void {
    this.options.clear();
  }

  clearFactors(): void {
    this.factors.clear();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createTradeoffAnalyzer(factors?: TradeoffFactor[]): ArchitectureTradeoffAnalyzer {
  return new ArchitectureTradeoffAnalyzer(factors);
}

export function createTradeoffOption(
  name: string,
  description: string,
  factorScores?: Map<string, number>
): TradeoffOption {
  return {
    id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    factorScores: factorScores || new Map(),
    constraints: []
  };
}

export function createTradeoffFactor(
  name: string,
  category: TradeoffFactor['category'],
  importance: number,
  description?: string
): TradeoffFactor {
  return {
    id: `factor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: description || name,
    category,
    importance
  };
}

export function quickTradeoffAnalysis(
  options: { name: string; scores: Record<string, number> }[]
): TradeoffAnalysis {
  const analyzer = new ArchitectureTradeoffAnalyzer();
  
  for (const opt of options) {
    const option = createTradeoffOption(opt.name, '');
    for (const [factor, score] of Object.entries(opt.scores)) {
      option.factorScores.set(factor, score);
    }
    analyzer.addOption(option);
  }
  
  return analyzer.analyze();
}
