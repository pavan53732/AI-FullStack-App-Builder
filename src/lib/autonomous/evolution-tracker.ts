/**
 * Evolution Tracker
 * Mechanisms 364: Track architecture evolution and historical changes
 */

export interface EvolutionSnapshot {
  id: string;
  timestamp: Date;
  version: string;
  description: string;
  architecture: ArchitectureState;
  metrics: ArchitectureMetrics;
  changes: ChangeRecord[];
  triggers: EvolutionTrigger[];
}

export interface ArchitectureState {
  components: ComponentState[];
  connections: ConnectionState[];
  layers: LayerState[];
  patterns: PatternUsage[];
  technologies: TechnologyUsage[];
}

export interface ComponentState {
  id: string;
  name: string;
  type: ComponentType;
  layer: string;
  dependencies: string[];
  responsibilities: string[];
  linesOfCode: number;
  complexity: number;
}

export type ComponentType =
  | 'service'
  | 'controller'
  | 'repository'
  | 'model'
  | 'view'
  | 'utility'
  | 'middleware'
  | 'handler'
  | 'gateway'
  | 'client';

export interface ConnectionState {
  source: string;
  target: string;
  type: 'sync' | 'async' | 'event' | 'data';
  protocol: string;
  frequency: number;
}

export interface LayerState {
  name: string;
  components: string[];
  dependencies: string[];
  responsibility: string;
}

export interface PatternUsage {
  name: string;
  components: string[];
  implementation: string;
  compliance: number;
}

export interface TechnologyUsage {
  name: string;
  version: string;
  purpose: string;
  criticality: 'low' | 'medium' | 'high';
}

export interface ArchitectureMetrics {
  modularity: number;
  coupling: number;
  cohesion: number;
  complexity: number;
  testability: number;
  maintainability: number;
  performance: number;
  security: number;
}

export interface ChangeRecord {
  id: string;
  timestamp: Date;
  type: ChangeType;
  category: ChangeCategory;
  scope: string;
  description: string;
  impact: ChangeImpact;
  author: string;
  commitHash?: string;
}

export type ChangeType =
  | 'addition'
  | 'removal'
  | 'modification'
  | 'refactoring'
  | 'migration'
  | 'optimization';

export type ChangeCategory =
  | 'component'
  | 'connection'
  | 'layer'
  | 'pattern'
  | 'technology'
  | 'configuration';

export interface ChangeImpact {
  scope: 'local' | 'module' | 'layer' | 'system';
  severity: 'minor' | 'moderate' | 'major' | 'breaking';
  affectedComponents: string[];
  riskLevel: number;
}

export interface EvolutionTrigger {
  type: TriggerType;
  description: string;
  source: string;
  urgency: 'low' | 'medium' | 'high';
}

export type TriggerType =
  | 'requirement_change'
  | 'performance_issue'
  | 'security_concern'
  | 'technical_debt'
  | 'scalability_need'
  | 'dependency_update'
  | 'team_decision';

export interface EvolutionTrend {
  metric: string;
  direction: 'improving' | 'declining' | 'stable';
  rate: number;
  prediction: number;
  confidence: number;
  dataPoints: TrendPoint[];
}

export interface TrendPoint {
  timestamp: Date;
  value: number;
  snapshotId: string;
}

export interface EvolutionAnalysis {
  id: string;
  period: { start: Date; end: Date };
  snapshots: EvolutionSnapshot[];
  trends: EvolutionTrend[];
  patterns: EvolutionPattern[];
  predictions: EvolutionPrediction[];
  recommendations: EvolutionRecommendation[];
}

export interface EvolutionPattern {
  type: PatternType;
  description: string;
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
  examples: string[];
}

export type PatternType =
  | 'growth'
  | 'decay'
  | 'oscillation'
  | 'step_change'
  | 'seasonal'
  | 'anomaly';

export interface EvolutionPrediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  timeframe: string;
  confidence: number;
  factors: string[];
}

export interface EvolutionRecommendation {
  priority: 'high' | 'medium' | 'low';
  type: RecommendationType;
  description: string;
  rationale: string;
  effort: 'low' | 'medium' | 'high';
  impact: string;
}

export type RecommendationType =
  | 'refactor'
  | 'modernize'
  | 'consolidate'
  | 'split'
  | 'migrate'
  | 'optimize';

export class EvolutionTracker {
  private snapshots: Map<string, EvolutionSnapshot>;
  private changes: ChangeRecord[];
  private trends: Map<string, EvolutionTrend>;
  private config: EvolutionConfig;

  constructor(config?: Partial<EvolutionConfig>) {
    this.snapshots = new Map();
    this.changes = [];
    this.trends = new Map();
    this.config = {
      maxSnapshots: 100,
      snapshotInterval: 24 * 60 * 60 * 1000, // 24 hours
      trendAnalysisWindow: 30, // days
      ...config,
    };
  }

  /**
   * Create a new evolution snapshot
   */
  createSnapshot(
    architecture: ArchitectureState,
    description: string = 'Automated snapshot'
  ): EvolutionSnapshot {
    const metrics = this.calculateMetrics(architecture);
    const triggers = this.detectTriggers(architecture);
    
    const snapshot: EvolutionSnapshot = {
      id: this.generateId(),
      timestamp: new Date(),
      version: `v${this.snapshots.size + 1}`,
      description,
      architecture,
      metrics,
      changes: this.getRecentChanges(),
      triggers,
    };

    this.snapshots.set(snapshot.id, snapshot);
    this.updateTrends(snapshot);
    this.cleanOldSnapshots();

    return snapshot;
  }

  /**
   * Record a change
   */
  recordChange(change: Omit<ChangeRecord, 'id' | 'timestamp'>): ChangeRecord {
    const record: ChangeRecord = {
      ...change,
      id: this.generateId(),
      timestamp: new Date(),
    };

    this.changes.push(record);
    return record;
  }

  /**
   * Analyze evolution over a period
   */
  analyzeEvolution(
    startDate: Date,
    endDate: Date = new Date()
  ): EvolutionAnalysis {
    const relevantSnapshots = this.getSnapshotsInRange(startDate, endDate);
    const trends = this.analyzeTrends(relevantSnapshots);
    const patterns = this.detectPatterns(relevantSnapshots);
    const predictions = this.generatePredictions(trends);
    const recommendations = this.generateRecommendations(trends, patterns);

    return {
      id: this.generateId(),
      period: { start: startDate, end: endDate },
      snapshots: relevantSnapshots,
      trends,
      patterns,
      predictions,
      recommendations,
    };
  }

  /**
   * Compare two snapshots
   */
  compareSnapshots(
    snapshotId1: string,
    snapshotId2: string
  ): SnapshotComparison {
    const snapshot1 = this.snapshots.get(snapshotId1);
    const snapshot2 = this.snapshots.get(snapshotId2);

    if (!snapshot1 || !snapshot2) {
      throw new Error('Snapshot not found');
    }

    const componentDiff = this.compareComponents(
      snapshot1.architecture.components,
      snapshot2.architecture.components
    );

    const metricsDiff = this.compareMetrics(
      snapshot1.metrics,
      snapshot2.metrics
    );

    const connectionsDiff = this.compareConnections(
      snapshot1.architecture.connections,
      snapshot2.architecture.connections
    );

    return {
      snapshot1,
      snapshot2,
      timeDiff: snapshot2.timestamp.getTime() - snapshot1.timestamp.getTime(),
      componentDiff,
      metricsDiff,
      connectionsDiff,
      summary: this.generateComparisonSummary(componentDiff, metricsDiff),
    };
  }

  /**
   * Get evolution history
   */
  getHistory(limit: number = 50): EvolutionSnapshot[] {
    return Array.from(this.snapshots.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get current architecture state
   */
  getCurrentState(): EvolutionSnapshot | null {
    const snapshots = this.getHistory(1);
    return snapshots.length > 0 ? snapshots[0] : null;
  }

  /**
   * Predict future evolution
   */
  predictEvolution(horizon: number = 30): EvolutionPrediction[] {
    const trends = Array.from(this.trends.values());
    const predictions: EvolutionPrediction[] = [];

    for (const trend of trends) {
      if (trend.dataPoints.length < 2) continue;

      const lastPoint = trend.dataPoints[trend.dataPoints.length - 1];
      const predictedValue = this.extrapolateValue(trend, horizon);

      predictions.push({
        metric: trend.metric,
        currentValue: lastPoint.value,
        predictedValue,
        timeframe: `${horizon} days`,
        confidence: trend.confidence,
        factors: this.identifyFactors(trend),
      });
    }

    return predictions;
  }

  private calculateMetrics(architecture: ArchitectureState): ArchitectureMetrics {
    const components = architecture.components;

    // Calculate modularity
    const modularity = this.calculateModularity(architecture);

    // Calculate coupling
    const coupling = this.calculateCoupling(architecture);

    // Calculate cohesion
    const cohesion = this.calculateCohesion(architecture);

    // Calculate complexity
    const complexity = this.calculateComplexity(components);

    // Calculate testability (inverse of coupling, simplified)
    const testability = 1 - coupling * 0.5;

    // Calculate maintainability
    const maintainability = (modularity + cohesion + testability) / 3;

    return {
      modularity,
      coupling,
      cohesion,
      complexity,
      testability,
      maintainability,
      performance: 0.8, // Would need runtime data
      security: 0.8,    // Would need security analysis
    };
  }

  private calculateModularity(architecture: ArchitectureState): number {
    const components = architecture.components;
    if (components.length === 0) return 1;

    // Higher modularity with more independent components
    const avgDependencies = components.reduce(
      (sum, c) => sum + c.dependencies.length,
      0
    ) / components.length;

    return Math.max(0, 1 - avgDependencies / 10);
  }

  private calculateCoupling(architecture: ArchitectureState): number {
    const connections = architecture.connections;
    const components = architecture.components;

    if (components.length === 0) return 0;

    // Higher connections = higher coupling
    const avgConnections = connections.length / components.length;
    return Math.min(1, avgConnections / 5);
  }

  private calculateCohesion(architecture: ArchitectureState): number {
    const components = architecture.components;
    if (components.length === 0) return 1;

    // Higher cohesion with focused responsibilities
    const avgResponsibilities = components.reduce(
      (sum, c) => sum + c.responsibilities.length,
      0
    ) / components.length;

    // Ideal is 1-3 responsibilities per component
    const idealRange = avgResponsibilities >= 1 && avgResponsibilities <= 3;
    return idealRange ? 1 : Math.max(0, 1 - Math.abs(avgResponsibilities - 2) / 5);
  }

  private calculateComplexity(components: ComponentState[]): number {
    if (components.length === 0) return 0;

    const avgComplexity = components.reduce(
      (sum, c) => sum + c.complexity,
      0
    ) / components.length;

    return Math.min(1, avgComplexity / 20);
  }

  private detectTriggers(architecture: ArchitectureState): EvolutionTrigger[] {
    const triggers: EvolutionTrigger[] = [];

    // Check for technical debt
    const highComplexity = architecture.components.filter(c => c.complexity > 15);
    if (highComplexity.length > 0) {
      triggers.push({
        type: 'technical_debt',
        description: `${highComplexity.length} components with high complexity`,
        source: 'complexity_analysis',
        urgency: 'medium',
      });
    }

    // Check for outdated technologies
    for (const tech of architecture.technologies) {
      if (this.isOutdated(tech.version)) {
        triggers.push({
          type: 'dependency_update',
          description: `${tech.name} version ${tech.version} may need updating`,
          source: 'dependency_analysis',
          urgency: tech.criticality === 'high' ? 'high' : 'medium',
        });
      }
    }

    return triggers;
  }

  private isOutdated(version: string): boolean {
    // Simplified - would check against latest versions
    return false;
  }

  private getRecentChanges(): ChangeRecord[] {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return this.changes.filter(c => c.timestamp.getTime() > oneDayAgo);
  }

  private updateTrends(snapshot: EvolutionSnapshot): void {
    const metrics = snapshot.metrics;
    const metricEntries: Array<[keyof ArchitectureMetrics, number]> = [
      ['modularity', metrics.modularity],
      ['coupling', metrics.coupling],
      ['cohesion', metrics.cohesion],
      ['complexity', metrics.complexity],
      ['testability', metrics.testability],
      ['maintainability', metrics.maintainability],
    ];

    for (const [metric, value] of metricEntries) {
      let trend = this.trends.get(metric);

      if (!trend) {
        trend = {
          metric,
          direction: 'stable',
          rate: 0,
          prediction: value,
          confidence: 0.5,
          dataPoints: [],
        };
      }

      trend.dataPoints.push({
        timestamp: snapshot.timestamp,
        value,
        snapshotId: snapshot.id,
      });

      // Keep only recent data points
      if (trend.dataPoints.length > this.config.trendAnalysisWindow) {
        trend.dataPoints.shift();
      }

      // Update trend direction and rate
      this.updateTrendDirection(trend);

      this.trends.set(metric, trend);
    }
  }

  private updateTrendDirection(trend: EvolutionTrend): void {
    const points = trend.dataPoints;
    if (points.length < 2) return;

    const recent = points.slice(-5);
    const older = points.slice(0, -5);

    if (older.length === 0) return;

    const recentAvg = recent.reduce((sum, p) => sum + p.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, p) => sum + p.value, 0) / older.length;

    const change = (recentAvg - olderAvg) / olderAvg;
    trend.rate = change;

    if (Math.abs(change) < 0.05) {
      trend.direction = 'stable';
    } else if (change > 0) {
      trend.direction = this.isMetricImprovement(trend.metric, true) ? 'improving' : 'declining';
    } else {
      trend.direction = this.isMetricImprovement(trend.metric, false) ? 'improving' : 'declining';
    }

    trend.confidence = Math.min(0.95, 0.5 + points.length * 0.03);
  }

  private isMetricImprovement(metric: string, increasing: boolean): boolean {
    // Metrics where increase is improvement
    const improvingOnIncrease = ['modularity', 'cohesion', 'testability', 'maintainability', 'performance', 'security'];
    // Metrics where decrease is improvement
    const improvingOnDecrease = ['coupling', 'complexity'];

    if (increasing) {
      return improvingOnIncrease.includes(metric);
    } else {
      return improvingOnDecrease.includes(metric);
    }
  }

  private cleanOldSnapshots(): void {
    if (this.snapshots.size <= this.config.maxSnapshots) return;

    const sorted = Array.from(this.snapshots.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Keep recent snapshots and important milestones
    const toKeep = new Set<string>();
    sorted.slice(0, this.config.maxSnapshots - 10).forEach(s => toKeep.add(s.id));

    // Always keep monthly snapshots
    const monthlySnapshots = new Map<string, EvolutionSnapshot>();
    for (const snapshot of sorted) {
      const monthKey = `${snapshot.timestamp.getFullYear()}-${snapshot.timestamp.getMonth()}`;
      if (!monthlySnapshots.has(monthKey)) {
        monthlySnapshots.set(monthKey, snapshot);
        toKeep.add(snapshot.id);
      }
    }

    for (const [id] of this.snapshots) {
      if (!toKeep.has(id)) {
        this.snapshots.delete(id);
      }
    }
  }

  private getSnapshotsInRange(start: Date, end: Date): EvolutionSnapshot[] {
    return Array.from(this.snapshots.values())
      .filter(s => s.timestamp >= start && s.timestamp <= end)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private analyzeTrends(snapshots: EvolutionSnapshot[]): EvolutionTrend[] {
    // Return relevant trends for the period
    return Array.from(this.trends.values());
  }

  private detectPatterns(snapshots: EvolutionSnapshot[]): EvolutionPattern[] {
    const patterns: EvolutionPattern[] = [];

    if (snapshots.length < 3) return patterns;

    // Detect growth pattern
    const componentGrowth = this.detectComponentGrowth(snapshots);
    if (componentGrowth > 0.1) {
      patterns.push({
        type: 'growth',
        description: 'Architecture is growing steadily',
        frequency: snapshots.length,
        impact: 'neutral',
        examples: [`Components increased by ${(componentGrowth * 100).toFixed(0)}%`],
      });
    }

    // Detect complexity pattern
    const complexityTrend = this.trends.get('complexity');
    if (complexityTrend && complexityTrend.rate > 0.1) {
      patterns.push({
        type: 'decay',
        description: 'Complexity is increasing over time',
        frequency: snapshots.length,
        impact: 'negative',
        examples: ['Consider refactoring to reduce complexity'],
      });
    }

    return patterns;
  }

  private detectComponentGrowth(snapshots: EvolutionSnapshot[]): number {
    if (snapshots.length < 2) return 0;

    const first = snapshots[0].architecture.components.length;
    const last = snapshots[snapshots.length - 1].architecture.components.length;

    return (last - first) / (first || 1);
  }

  private generatePredictions(trends: EvolutionTrend[]): EvolutionPrediction[] {
    const predictions: EvolutionPrediction[] = [];

    for (const trend of trends) {
      if (trend.dataPoints.length < 2) continue;

      const lastPoint = trend.dataPoints[trend.dataPoints.length - 1];
      const predictedValue = trend.prediction;

      predictions.push({
        metric: trend.metric,
        currentValue: lastPoint.value,
        predictedValue,
        timeframe: '30 days',
        confidence: trend.confidence,
        factors: this.identifyFactors(trend),
      });
    }

    return predictions;
  }

  private generateRecommendations(
    trends: EvolutionTrend[],
    patterns: EvolutionPattern[]
  ): EvolutionRecommendation[] {
    const recommendations: EvolutionRecommendation[] = [];

    for (const trend of trends) {
      if (trend.direction === 'declining') {
        if (trend.metric === 'maintainability') {
          recommendations.push({
            priority: 'high',
            type: 'refactor',
            description: 'Address declining maintainability',
            rationale: `Maintainability has declined by ${(Math.abs(trend.rate) * 100).toFixed(0)}%`,
            effort: 'high',
            impact: 'Improved long-term development velocity',
          });
        }

        if (trend.metric === 'cohesion') {
          recommendations.push({
            priority: 'medium',
            type: 'consolidate',
            description: 'Improve component cohesion',
            rationale: 'Components are becoming less focused',
            effort: 'medium',
            impact: 'Better code organization and testability',
          });
        }
      }
    }

    for (const pattern of patterns) {
      if (pattern.type === 'decay' && pattern.impact === 'negative') {
        recommendations.push({
          priority: 'high',
          type: 'modernize',
          description: 'Address architectural decay',
          rationale: pattern.description,
          effort: 'high',
          impact: 'Prevent further degradation',
        });
      }
    }

    return recommendations;
  }

  private compareComponents(
    components1: ComponentState[],
    components2: ComponentState[]
  ): ComponentDiff {
    const added = components2.filter(
      c2 => !components1.some(c1 => c1.id === c2.id)
    );
    const removed = components1.filter(
      c1 => !components2.some(c2 => c2.id === c1.id)
    );
    const modified = components2.filter(c2 => {
      const c1 = components1.find(c => c.id === c2.id);
      if (!c1) return false;
      return (
        c1.linesOfCode !== c2.linesOfCode ||
        c1.complexity !== c2.complexity ||
        c1.dependencies.length !== c2.dependencies.length
      );
    });

    return {
      added: added.map(c => c.name),
      removed: removed.map(c => c.name),
      modified: modified.map(c => c.name),
      totalChange: added.length + removed.length + modified.length,
    };
  }

  private compareMetrics(
    metrics1: ArchitectureMetrics,
    metrics2: ArchitectureMetrics
  ): MetricsDiff {
    const diffs: Record<string, { before: number; after: number; change: number }> = {};

    for (const key of Object.keys(metrics1) as Array<keyof ArchitectureMetrics>) {
      diffs[key] = {
        before: metrics1[key],
        after: metrics2[key],
        change: metrics2[key] - metrics1[key],
      };
    }

    return { metrics: diffs };
  }

  private compareConnections(
    connections1: ConnectionState[],
    connections2: ConnectionState[]
  ): ConnectionsDiff {
    const added = connections2.filter(
      c2 => !connections1.some(c1 =>
        c1.source === c2.source && c1.target === c2.target
      )
    );
    const removed = connections1.filter(
      c1 => !connections2.some(c2 =>
        c2.source === c1.source && c2.target === c1.target
      )
    );

    return {
      added: added.map(c => `${c.source} -> ${c.target}`),
      removed: removed.map(c => `${c.source} -> ${c.target}`),
      totalChange: added.length + removed.length,
    };
  }

  private generateComparisonSummary(
    componentDiff: ComponentDiff,
    metricsDiff: MetricsDiff
  ): string {
    const parts: string[] = [];

    if (componentDiff.totalChange > 0) {
      parts.push(`${componentDiff.totalChange} component changes`);
    }

    const improving = Object.entries(metricsDiff.metrics)
      .filter(([_, v]) => v.change > 0)
      .map(([k]) => k);
    const declining = Object.entries(metricsDiff.metrics)
      .filter(([_, v]) => v.change < 0)
      .map(([k]) => k);

    if (improving.length > 0) {
      parts.push(`${improving.length} metrics improving`);
    }
    if (declining.length > 0) {
      parts.push(`${declining.length} metrics declining`);
    }

    return parts.join(', ') || 'No significant changes';
  }

  private extrapolateValue(trend: EvolutionTrend, horizon: number): number {
    if (trend.dataPoints.length < 2) {
      return trend.dataPoints[trend.dataPoints.length - 1]?.value || 0;
    }

    const lastValue = trend.dataPoints[trend.dataPoints.length - 1].value;
    const rate = trend.rate;

    return lastValue * (1 + rate * horizon / 30);
  }

  private identifyFactors(trend: EvolutionTrend): string[] {
    const factors: string[] = [];

    if (trend.metric === 'complexity') {
      factors.push('Code changes', 'New features', 'Technical debt');
    } else if (trend.metric === 'coupling') {
      factors.push('New dependencies', 'Architectural decisions', 'Refactoring');
    } else if (trend.metric === 'maintainability') {
      factors.push('Code quality', 'Documentation', 'Test coverage');
    }

    return factors;
  }

  private generateId(): string {
    return `evo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Supporting interfaces
interface EvolutionConfig {
  maxSnapshots: number;
  snapshotInterval: number;
  trendAnalysisWindow: number;
}

interface SnapshotComparison {
  snapshot1: EvolutionSnapshot;
  snapshot2: EvolutionSnapshot;
  timeDiff: number;
  componentDiff: ComponentDiff;
  metricsDiff: MetricsDiff;
  connectionsDiff: ConnectionsDiff;
  summary: string;
}

interface ComponentDiff {
  added: string[];
  removed: string[];
  modified: string[];
  totalChange: number;
}

interface MetricsDiff {
  metrics: Record<string, { before: number; after: number; change: number }>;
}

interface ConnectionsDiff {
  added: string[];
  removed: string[];
  totalChange: number;
}

// Singleton instance
let trackerInstance: EvolutionTracker | null = null;

export function getEvolutionTracker(): EvolutionTracker {
  if (!trackerInstance) {
    trackerInstance = new EvolutionTracker();
  }
  return trackerInstance;
}
