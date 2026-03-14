/**
 * Convergence Detector
 * Mechanisms 83-90: Detect convergence in iterative processes
 */

export interface ConvergenceCheck {
  id: string;
  timestamp: Date;
  sequenceId: string;
  converged: boolean;
  reason: ConvergenceReason;
  metrics: ConvergenceMetrics;
  state: ConvergenceState;
  prediction: ConvergencePrediction;
}

export type ConvergenceReason =
  | 'threshold_met'
  | 'plateau_detected'
  | 'oscillation_detected'
  | 'diminishing_returns'
  | 'max_iterations_reached'
  | 'manual_stop'
  | 'error_detected';

export interface ConvergenceMetrics {
  currentValue: number;
  previousValue: number;
  delta: number;
  relativeDelta: number;
  rollingAverage: number;
  variance: number;
  trend: 'improving' | 'declining' | 'stable' | 'oscillating';
}

export interface ConvergenceState {
  iteration: number;
  history: number[];
  plateaus: number[];
  oscillations: Oscillation[];
  bestValue: number;
  bestIteration: number;
}

export interface Oscillation {
  startIteration: number;
  endIteration: number;
  amplitude: number;
  frequency: number;
}

export interface ConvergencePrediction {
  estimatedIterationsRemaining: number;
  confidenceInterval: { lower: number; upper: number };
  willConverge: boolean;
  finalValueEstimate: number;
}

export interface ConvergenceConfig {
  threshold: number;
  relativeThreshold: number;
  plateauWindow: number;
  plateauThreshold: number;
  oscillationThreshold: number;
  minIterations: number;
  maxIterations: number;
}

export class ConvergenceDetector {
  private sequences: Map<string, ConvergenceState>;
  private config: ConvergenceConfig;

  constructor(config?: Partial<ConvergenceConfig>) {
    this.sequences = new Map();
    this.config = {
      threshold: 0.001,
      relativeThreshold: 0.01,
      plateauWindow: 5,
      plateauThreshold: 0.001,
      oscillationThreshold: 0.3,
      minIterations: 3,
      maxIterations: 100,
      ...config,
    };
  }

  /**
   * Check if a sequence has converged
   */
  check(sequenceId: string, value: number): ConvergenceCheck {
    let state = this.sequences.get(sequenceId);

    if (!state) {
      state = this.createInitialState();
      this.sequences.set(sequenceId, state);
    }

    // Update state
    state.iteration++;
    state.history.push(value);

    if (value > state.bestValue) {
      state.bestValue = value;
      state.bestIteration = state.iteration;
    }

    // Calculate metrics
    const metrics = this.calculateMetrics(state, value);

    // Check for convergence
    const { converged, reason } = this.detectConvergence(state, metrics);

    // Update state with patterns
    this.updatePatterns(state, value);

    // Make prediction
    const prediction = this.predictConvergence(state, metrics);

    return {
      id: this.generateId(),
      timestamp: new Date(),
      sequenceId,
      converged,
      reason,
      metrics,
      state,
      prediction,
    };
  }

  /**
   * Batch check multiple sequences
   */
  batchCheck(
    sequences: Array<{ id: string; value: number }>
  ): ConvergenceCheck[] {
    return sequences.map(s => this.check(s.id, s.value));
  }

  /**
   * Reset a sequence
   */
  reset(sequenceId: string): void {
    this.sequences.delete(sequenceId);
  }

  /**
   * Get state of a sequence
   */
  getState(sequenceId: string): ConvergenceState | undefined {
    return this.sequences.get(sequenceId);
  }

  /**
   * Configure detection parameters
   */
  configure(config: Partial<ConvergenceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private createInitialState(): ConvergenceState {
    return {
      iteration: 0,
      history: [],
      plateaus: [],
      oscillations: [],
      bestValue: -Infinity,
      bestIteration: 0,
    };
  }

  private calculateMetrics(
    state: ConvergenceState,
    currentValue: number
  ): ConvergenceMetrics {
    const previousValue = state.history[state.history.length - 2] || currentValue;
    const delta = currentValue - previousValue;
    const relativeDelta = previousValue !== 0 ? Math.abs(delta / previousValue) : Math.abs(delta);

    // Calculate rolling average
    const windowSize = Math.min(this.config.plateauWindow, state.history.length);
    const rollingAverage = state.history
      .slice(-windowSize)
      .reduce((sum, v) => sum + v, 0) / windowSize;

    // Calculate variance
    const variance = this.calculateVariance(state.history.slice(-windowSize));

    // Determine trend
    const trend = this.determineTrend(state.history);

    return {
      currentValue,
      previousValue,
      delta,
      relativeDelta,
      rollingAverage,
      variance,
      trend,
    };
  }

  private detectConvergence(
    state: ConvergenceState,
    metrics: ConvergenceMetrics
  ): { converged: boolean; reason: ConvergenceReason } {
    // Check min iterations
    if (state.iteration < this.config.minIterations) {
      return { converged: false, reason: 'threshold_met' };
    }

    // Check absolute threshold
    if (Math.abs(metrics.delta) < this.config.threshold) {
      return { converged: true, reason: 'threshold_met' };
    }

    // Check relative threshold
    if (metrics.relativeDelta < this.config.relativeThreshold) {
      return { converged: true, reason: 'threshold_met' };
    }

    // Check plateau
    if (this.isPlateau(state)) {
      return { converged: true, reason: 'plateau_detected' };
    }

    // Check oscillation
    if (this.isOscillating(state)) {
      return { converged: true, reason: 'oscillation_detected' };
    }

    // Check diminishing returns
    if (this.hasDiminishingReturns(state)) {
      return { converged: true, reason: 'diminishing_returns' };
    }

    // Check max iterations
    if (state.iteration >= this.config.maxIterations) {
      return { converged: true, reason: 'max_iterations_reached' };
    }

    return { converged: false, reason: 'threshold_met' };
  }

  private updatePatterns(state: ConvergenceState, value: number): void {
    // Detect plateau
    const recentValues = state.history.slice(-this.config.plateauWindow);
    if (recentValues.length >= this.config.plateauWindow) {
      const range = Math.max(...recentValues) - Math.min(...recentValues);
      if (range < this.config.plateauThreshold) {
        state.plateaus.push(state.iteration);
      }
    }

    // Detect oscillation
    if (state.history.length >= 4) {
      const last4 = state.history.slice(-4);
      const signs = [];
      for (let i = 1; i < last4.length; i++) {
        signs.push(Math.sign(last4[i] - last4[i - 1]));
      }
      const signChanges = signs.filter((s, i) => i > 0 && s !== signs[i - 1]).length;
      if (signChanges >= 2) {
        const amplitude = Math.max(...last4) - Math.min(...last4);
        state.oscillations.push({
          startIteration: state.iteration - 4,
          endIteration: state.iteration,
          amplitude,
          frequency: signChanges / 4,
        });
      }
    }
  }

  private predictConvergence(
    state: ConvergenceState,
    metrics: ConvergenceMetrics
  ): ConvergencePrediction {
    if (state.history.length < 3) {
      return {
        estimatedIterationsRemaining: this.config.maxIterations - state.iteration,
        confidenceInterval: { lower: 0, upper: 1 },
        willConverge: true,
        finalValueEstimate: metrics.currentValue,
      };
    }

    // Estimate remaining iterations using trend analysis
    const trend = this.fitLinearTrend(state.history);
    const remainingIterations = Math.max(
      0,
      Math.ceil((1 - metrics.currentValue) / trend.slope)
    );

    // Estimate final value
    const finalValueEstimate = metrics.currentValue + trend.slope * remainingIterations;

    return {
      estimatedIterationsRemaining: Math.min(
        remainingIterations,
        this.config.maxIterations - state.iteration
      ),
      confidenceInterval: {
        lower: finalValueEstimate - 0.1,
        upper: Math.min(1, finalValueEstimate + 0.1),
      },
      willConverge: trend.slope > 0,
      finalValueEstimate,
    };
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }

  private determineTrend(history: number[]): ConvergenceMetrics['trend'] {
    if (history.length < 3) return 'stable';

    const recent = history.slice(-5);
    const older = history.slice(-10, -5);

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    const olderAvg = older.reduce((sum, v) => sum + v, 0) / older.length;

    const change = recentAvg - olderAvg;
    const relativeChange = olderAvg !== 0 ? change / olderAvg : change;

    // Check for oscillation
    let signChanges = 0;
    for (let i = 1; i < recent.length; i++) {
      if (Math.sign(recent[i] - recent[i - 1]) !== Math.sign(recent[i - 1] - recent[i - 2])) {
        signChanges++;
      }
    }

    if (signChanges >= 2) return 'oscillating';
    if (Math.abs(relativeChange) < 0.01) return 'stable';
    return change > 0 ? 'improving' : 'declining';
  }

  private isPlateau(state: ConvergenceState): boolean {
    if (state.history.length < this.config.plateauWindow) return false;

    const recent = state.history.slice(-this.config.plateauWindow);
    const range = Math.max(...recent) - Math.min(...recent);

    return range < this.config.plateauThreshold;
  }

  private isOscillating(state: ConvergenceState): boolean {
    if (state.oscillations.length < 2) return false;

    const recentOscillations = state.oscillations.filter(
      o => o.endIteration > state.iteration - 10
    );

    return recentOscillations.length >= 2;
  }

  private hasDiminishingReturns(state: ConvergenceState): boolean {
    if (state.history.length < 10) return false;

    const firstHalf = state.history.slice(0, Math.floor(state.history.length / 2));
    const secondHalf = state.history.slice(Math.floor(state.history.length / 2));

    const firstImprovement = this.calculateTotalImprovement(firstHalf);
    const secondImprovement = this.calculateTotalImprovement(secondHalf);

    if (firstImprovement === 0) return false;

    return secondImprovement / firstImprovement < 0.1;
  }

  private calculateTotalImprovement(values: number[]): number {
    if (values.length < 2) return 0;
    return values[values.length - 1] - values[0];
  }

  private fitLinearTrend(values: number[]): { slope: number; intercept: number } {
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  private generateId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let detectorInstance: ConvergenceDetector | null = null;

export function getConvergenceDetector(): ConvergenceDetector {
  if (!detectorInstance) {
    detectorInstance = new ConvergenceDetector();
  }
  return detectorInstance;
}
