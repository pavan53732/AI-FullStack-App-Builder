/**
 * Risk Prediction Reasoning System
 * Mechanisms 101-103: Risk assessment and prediction for AI actions
 */

export interface RiskAssessment {
  id: string;
  timestamp: Date;
  action: ProposedAction;
  riskLevel: RiskLevel;
  riskScore: number;
  riskFactors: RiskFactor[];
  mitigations: MitigationStrategy[];
  recommendation: 'proceed' | 'proceed_with_caution' | 'review_required' | 'abort';
  confidence: number;
}

export type RiskLevel = 'minimal' | 'low' | 'medium' | 'high' | 'critical';

export interface ProposedAction {
  type: ActionType;
  description: string;
  target: string;
  changes: ChangeDescription[];
  dependencies: string[];
  reversibility: 'easy' | 'moderate' | 'difficult' | 'impossible';
  impactScope: 'local' | 'file' | 'module' | 'project' | 'system';
}

export type ActionType =
  | 'file_create'
  | 'file_modify'
  | 'file_delete'
  | 'code_refactor'
  | 'dependency_add'
  | 'dependency_remove'
  | 'dependency_update'
  | 'config_change'
  | 'database_migration'
  | 'api_change'
  | 'architecture_change'
  | 'deployment';

export interface ChangeDescription {
  file?: string;
  type: 'addition' | 'modification' | 'deletion';
  lines?: number;
  complexity?: number;
  description: string;
}

export interface RiskFactor {
  category: RiskCategory;
  name: string;
  description: string;
  severity: number;
  probability: number;
  impact: number;
  evidence: string[];
}

export type RiskCategory =
  | 'breaking_change'
  | 'security'
  | 'performance'
  | 'compatibility'
  | 'data_integrity'
  | 'code_quality'
  | 'dependency'
  | 'deployment'
  | 'operational'
  | 'compliance';

export interface MitigationStrategy {
  id: string;
  riskIds: string[];
  action: string;
  priority: 'low' | 'medium' | 'high';
  estimatedEffort: number;
  effectiveness: number;
}

export interface RiskPredictionModel {
  predict(action: ProposedAction, context: PredictionContext): Promise<RiskAssessment>;
}

export interface PredictionContext {
  projectMetadata: ProjectMetadata;
  recentChanges: RecentChange[];
  testCoverage: number;
  gitHistory: GitCommit[];
  dependencyHealth: DependencyHealth[];
}

export interface ProjectMetadata {
  language: string;
  framework: string;
  projectSize: number;
  fileCount: number;
  dependencyCount: number;
  lastDeployment?: Date;
}

export interface RecentChange {
  file: string;
  type: string;
  timestamp: Date;
  successful: boolean;
}

export interface GitCommit {
  hash: string;
  message: string;
  files: string[];
  timestamp: Date;
}

export interface DependencyHealth {
  name: string;
  version: string;
  vulnerabilities: number;
  outdated: boolean;
  abandoned: boolean;
}

export class RiskPredictionEngine {
  private riskPatterns: Map<RiskCategory, RiskPattern[]>;
  private historicalData: RiskHistoricalData;
  private thresholdConfig: RiskThresholdConfig;

  constructor() {
    this.riskPatterns = this.initializeRiskPatterns();
    this.historicalData = new RiskHistoricalData();
    this.thresholdConfig = this.getDefaultThresholds();
  }

  /**
   * Main risk prediction method
   */
  async predictRisk(
    action: ProposedAction,
    context: PredictionContext
  ): Promise<RiskAssessment> {
    // Step 1: Identify all potential risk factors
    const riskFactors = await this.identifyRiskFactors(action, context);
    
    // Step 2: Calculate risk scores for each factor
    const scoredFactors = this.scoreRiskFactors(riskFactors, context);
    
    // Step 3: Calculate overall risk score
    const riskScore = this.calculateOverallRisk(scoredFactors);
    
    // Step 4: Determine risk level
    const riskLevel = this.determineRiskLevel(riskScore);
    
    // Step 5: Generate mitigation strategies
    const mitigations = this.generateMitigations(scoredFactors, action);
    
    // Step 6: Make recommendation
    const recommendation = this.makeRecommendation(riskLevel, scoredFactors, mitigations);
    
    return {
      id: this.generateId(),
      timestamp: new Date(),
      action,
      riskLevel,
      riskScore,
      riskFactors: scoredFactors,
      mitigations,
      recommendation,
      confidence: this.calculateConfidence(scoredFactors, context),
    };
  }

  /**
   * Batch risk prediction for multiple actions
   */
  async predictBatch(
    actions: ProposedAction[],
    context: PredictionContext
  ): Promise<RiskAssessment[]> {
    const assessments: RiskAssessment[] = [];
    
    for (const action of actions) {
      const assessment = await this.predictRisk(action, context);
      assessments.push(assessment);
    }
    
    return this.analyzeDependencies(assessments);
  }

  /**
   * Real-time risk monitoring during execution
   */
  monitorRisk(
    action: ProposedAction,
    assessment: RiskAssessment,
    executionEvents: ExecutionEvent[]
  ): RiskUpdate {
    const newFactors = this.detectEmergingRisks(executionEvents, assessment);
    const updatedScore = this.recalculateRisk(assessment.riskFactors, newFactors);
    const recommendation = this.updateRecommendation(assessment, newFactors);

    return {
      originalAssessment: assessment,
      newRiskFactors: newFactors,
      updatedRiskScore: updatedScore,
      currentRecommendation: recommendation,
      shouldPause: this.shouldPauseExecution(newFactors),
    };
  }

  private initializeRiskPatterns(): Map<RiskCategory, RiskPattern[]> {
    return new Map([
      ['breaking_change', [
        {
          pattern: /export\s+(function|class|const|interface)/,
          riskType: 'api_change',
          baseSeverity: 0.7,
          description: 'Modifying exported API surface',
        },
        {
          pattern: /interface\s+\w+\s*\{[^}]*\}/,
          riskType: 'type_change',
          baseSeverity: 0.6,
          description: 'Modifying type definitions',
        },
        {
          pattern: /DELETE\s+FROM|DROP\s+TABLE/i,
          riskType: 'data_deletion',
          baseSeverity: 0.9,
          description: 'Destructive database operation',
        },
      ]],
      ['security', [
        {
          pattern: /eval\s*\(|Function\s*\(|new\s+Function/i,
          riskType: 'code_injection',
          baseSeverity: 0.95,
          description: 'Dynamic code execution',
        },
        {
          pattern: /password|secret|api[_-]?key|token/i,
          riskType: 'sensitive_data',
          baseSeverity: 0.85,
          description: 'Potential sensitive data exposure',
        },
        {
          pattern: /sql.*\$\{|`\$\{|concat\s*\(/i,
          riskType: 'sql_injection',
          baseSeverity: 0.9,
          description: 'Potential SQL injection',
        },
        {
          pattern: /innerHTML|dangerouslySetInnerHTML/i,
          riskType: 'xss',
          baseSeverity: 0.8,
          description: 'Potential XSS vulnerability',
        },
      ]],
      ['performance', [
        {
          pattern: /while\s*\(\s*true|for\s*\(\s*;\s*;/,
          riskType: 'infinite_loop',
          baseSeverity: 0.85,
          description: 'Potential infinite loop',
        },
        {
          pattern: /setTimeout\s*\(\s*\w+\s*,\s*0|setImmediate/i,
          riskType: 'timing_issue',
          baseSeverity: 0.5,
          description: 'Potential timing issues',
        },
        {
          pattern: /\.map\s*\([^)]*\.map\s*\(/i,
          riskType: 'nested_iteration',
          baseSeverity: 0.6,
          description: 'Nested iterations detected',
        },
      ]],
      ['compatibility', [
        {
          pattern: /@typescript-eslint|tsconfig/i,
          riskType: 'typescript_config',
          baseSeverity: 0.4,
          description: 'TypeScript configuration change',
        },
        {
          pattern: /\.babelrc|babel\.config/i,
          riskType: 'babel_config',
          baseSeverity: 0.5,
          description: 'Babel configuration change',
        },
        {
          pattern: /package\.json/i,
          riskType: 'dependency_change',
          baseSeverity: 0.6,
          description: 'Dependency modification',
        },
      ]],
      ['data_integrity', [
        {
          pattern: /DELETE\s+FROM|TRUNCATE/i,
          riskType: 'data_deletion',
          baseSeverity: 0.9,
          description: 'Data deletion operation',
        },
        {
          pattern: /migration|ALTER\s+TABLE/i,
          riskType: 'schema_change',
          baseSeverity: 0.7,
          description: 'Database schema change',
        },
        {
          pattern: /\.write\s*\(|fs\.write/i,
          riskType: 'file_write',
          baseSeverity: 0.5,
          description: 'File write operation',
        },
      ]],
      ['dependency', [
        {
          pattern: /npm\s+install|yarn\s+add|bun\s+add/i,
          riskType: 'new_dependency',
          baseSeverity: 0.5,
          description: 'Adding new dependency',
        },
        {
          pattern: /npm\s+update|yarn\s+upgrade/i,
          riskType: 'dependency_update',
          baseSeverity: 0.6,
          description: 'Updating dependencies',
        },
        {
          pattern: /npm\s+uninstall|yarn\s+remove/i,
          riskType: 'dependency_removal',
          baseSeverity: 0.7,
          description: 'Removing dependency',
        },
      ]],
      ['deployment', [
        {
          pattern: /deploy|publish|release/i,
          riskType: 'production_change',
          baseSeverity: 0.8,
          description: 'Production deployment',
        },
        {
          pattern: /docker\s+(build|push|run)/i,
          riskType: 'container_operation',
          baseSeverity: 0.6,
          description: 'Container operation',
        },
        {
          pattern: /kubectl|kubernetes/i,
          riskType: 'k8s_operation',
          baseSeverity: 0.7,
          description: 'Kubernetes operation',
        },
      ]],
    ]);
  }

  private async identifyRiskFactors(
    action: ProposedAction,
    context: PredictionContext
  ): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];

    // Check against risk patterns
    for (const [category, patterns] of this.riskPatterns) {
      for (const pattern of patterns) {
        for (const change of action.changes) {
          if (pattern.pattern.test(change.description)) {
            factors.push({
              category,
              name: pattern.riskType,
              description: pattern.description,
              severity: pattern.baseSeverity,
              probability: this.calculateProbability(pattern, context),
              impact: this.calculateImpact(pattern, action),
              evidence: [change.description],
            });
          }
        }
      }
    }

    // Add context-based risks
    factors.push(...this.analyzeContextRisks(action, context));

    // Add dependency risks
    factors.push(...this.analyzeDependencyRisks(action, context));

    // Add historical risks
    factors.push(...await this.analyzeHistoricalRisks(action, context));

    return this.deduplicateFactors(factors);
  }

  private scoreRiskFactors(
    factors: RiskFactor[],
    context: PredictionContext
  ): RiskFactor[] {
    return factors.map(factor => ({
      ...factor,
      severity: this.adjustSeverity(factor, context),
      impact: this.adjustImpact(factor, context),
    }));
  }

  private calculateOverallRisk(factors: RiskFactor[]): number {
    if (factors.length === 0) return 0;

    // Weighted average with maximum consideration
    const weights = factors.map(f => f.probability * f.impact);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    const weightedSum = factors.reduce((sum, f, i) => {
      return sum + f.severity * weights[i];
    }, 0);

    const avgRisk = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    // Consider maximum risk factor
    const maxRisk = Math.max(...factors.map(f => f.severity * f.probability));
    
    // Combine average and max with bias towards max
    return avgRisk * 0.4 + maxRisk * 0.6;
  }

  private determineRiskLevel(score: number): RiskLevel {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    if (score >= 0.2) return 'low';
    return 'minimal';
  }

  private generateMitigations(
    factors: RiskFactor[],
    action: ProposedAction
  ): MitigationStrategy[] {
    const mitigations: MitigationStrategy[] = [];

    for (const factor of factors) {
      const strategy = this.createMitigation(factor, action);
      if (strategy) {
        mitigations.push(strategy);
      }
    }

    return this.prioritizeMitigations(mitigations);
  }

  private createMitigation(
    factor: RiskFactor,
    action: ProposedAction
  ): MitigationStrategy | null {
    const mitigationMap: Record<string, () => MitigationStrategy> = {
      'api_change': () => ({
        id: this.generateId(),
        riskIds: [factor.name],
        action: 'Create deprecated version and migration guide before removing API',
        priority: 'high',
        estimatedEffort: 30,
        effectiveness: 0.8,
      }),
      'code_injection': () => ({
        id: this.generateId(),
        riskIds: [factor.name],
        action: 'Use safe alternatives and input validation',
        priority: 'high',
        estimatedEffort: 15,
        effectiveness: 0.95,
      }),
      'sql_injection': () => ({
        id: this.generateId(),
        riskIds: [factor.name],
        action: 'Use parameterized queries or ORM methods',
        priority: 'high',
        estimatedEffort: 20,
        effectiveness: 0.98,
      }),
      'xss': () => ({
        id: this.generateId(),
        riskIds: [factor.name],
        action: 'Sanitize input and use React\'s default escaping',
        priority: 'high',
        estimatedEffort: 15,
        effectiveness: 0.95,
      }),
      'infinite_loop': () => ({
        id: this.generateId(),
        riskIds: [factor.name],
        action: 'Add termination condition and timeout mechanism',
        priority: 'high',
        estimatedEffort: 10,
        effectiveness: 0.9,
      }),
      'data_deletion': () => ({
        id: this.generateId(),
        riskIds: [factor.name],
        action: 'Create backup before deletion and use soft delete',
        priority: 'high',
        estimatedEffort: 20,
        effectiveness: 0.85,
      }),
      'schema_change': () => ({
        id: this.generateId(),
        riskIds: [factor.name],
        action: 'Create reversible migration and test on staging',
        priority: 'high',
        estimatedEffort: 45,
        effectiveness: 0.9,
      }),
      'new_dependency': () => ({
        id: this.generateId(),
        riskIds: [factor.name],
        action: 'Audit dependency for security and maintenance status',
        priority: 'medium',
        estimatedEffort: 15,
        effectiveness: 0.85,
      }),
      'production_change': () => ({
        id: this.generateId(),
        riskIds: [factor.name],
        action: 'Deploy to staging first and implement rollback plan',
        priority: 'high',
        estimatedEffort: 30,
        effectiveness: 0.9,
      }),
    };

    const creator = mitigationMap[factor.name];
    return creator ? creator() : null;
  }

  private makeRecommendation(
    level: RiskLevel,
    factors: RiskFactor[],
    mitigations: MitigationStrategy[]
  ): RiskAssessment['recommendation'] {
    const criticalFactors = factors.filter(f => f.severity >= 0.9);
    const unmitigatedHigh = factors.filter(
      f => f.severity >= 0.7 && !mitigations.some(m => m.riskIds.includes(f.name))
    );

    if (level === 'critical' || criticalFactors.length > 0) {
      return 'abort';
    }

    if (level === 'high' || unmitigatedHigh.length > 0) {
      return 'review_required';
    }

    if (level === 'medium') {
      return 'proceed_with_caution';
    }

    return 'proceed';
  }

  private calculateConfidence(
    factors: RiskFactor[],
    context: PredictionContext
  ): number {
    // Base confidence on amount of evidence and historical data
    const evidenceCount = factors.reduce((sum, f) => sum + f.evidence.length, 0);
    const historicalMatches = this.historicalData.getMatchCount(factors);
    const contextQuality = this.assessContextQuality(context);

    const baseConfidence = Math.min(0.95, 0.5 + evidenceCount * 0.05);
    const historicalBoost = Math.min(0.2, historicalMatches * 0.02);
    const contextBoost = contextQuality * 0.15;

    return Math.min(0.95, baseConfidence + historicalBoost + contextBoost);
  }

  private calculateProbability(
    pattern: RiskPattern,
    context: PredictionContext
  ): number {
    let probability = pattern.baseSeverity;

    // Adjust based on test coverage
    if (context.testCoverage > 0.8) {
      probability *= 0.7;
    } else if (context.testCoverage < 0.3) {
      probability *= 1.3;
    }

    // Adjust based on recent failures
    const recentFailures = context.recentChanges.filter(c => !c.successful).length;
    probability *= 1 + recentFailures * 0.05;

    return Math.min(1, probability);
  }

  private calculateImpact(
    pattern: RiskPattern,
    action: ProposedAction
  ): number {
    let impact = pattern.baseSeverity;

    // Adjust based on impact scope
    const scopeMultiplier: Record<string, number> = {
      'local': 0.3,
      'file': 0.5,
      'module': 0.7,
      'project': 0.9,
      'system': 1.0,
    };

    impact *= scopeMultiplier[action.impactScope] || 0.5;

    // Adjust based on reversibility
    const reversibilityMultiplier: Record<string, number> = {
      'easy': 0.5,
      'moderate': 0.7,
      'difficult': 0.9,
      'impossible': 1.0,
    };

    impact *= reversibilityMultiplier[action.reversibility] || 0.7;

    return Math.min(1, impact);
  }

  private analyzeContextRisks(
    action: ProposedAction,
    context: PredictionContext
  ): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Low test coverage risk
    if (context.testCoverage < 0.5) {
      factors.push({
        category: 'code_quality',
        name: 'low_test_coverage',
        description: `Test coverage is only ${(context.testCoverage * 100).toFixed(0)}%`,
        severity: 0.6,
        probability: 0.7,
        impact: 0.5,
        evidence: [`Test coverage: ${context.testCoverage}`],
      });
    }

    // Recent failure risk
    const recentFailures = context.recentChanges.filter(c => !c.successful);
    if (recentFailures.length > 2) {
      factors.push({
        category: 'operational',
        name: 'recent_failures',
        description: `${recentFailures.length} recent failures detected`,
        severity: 0.5,
        probability: 0.6,
        impact: 0.6,
        evidence: recentFailures.map(f => `Failed: ${f.file}`),
      });
    }

    return factors;
  }

  private analyzeDependencyRisks(
    action: ProposedAction,
    context: PredictionContext
  ): RiskFactor[] {
    const factors: RiskFactor[] = [];

    for (const dep of context.dependencyHealth) {
      if (dep.vulnerabilities > 0) {
        factors.push({
          category: 'security',
          name: 'vulnerable_dependency',
          description: `${dep.name} has ${dep.vulnerabilities} vulnerabilities`,
          severity: 0.8,
          probability: 0.9,
          impact: 0.7,
          evidence: [`${dep.name}@${dep.version}`],
        });
      }

      if (dep.abandoned) {
        factors.push({
          category: 'dependency',
          name: 'abandoned_dependency',
          description: `${dep.name} appears to be abandoned`,
          severity: 0.6,
          probability: 0.8,
          impact: 0.5,
          evidence: [`${dep.name}@${dep.version}`],
        });
      }
    }

    return factors;
  }

  private async analyzeHistoricalRisks(
    action: ProposedAction,
    context: PredictionContext
  ): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];

    // Analyze git history for similar changes
    const similarChanges = context.gitHistory.filter(commit =>
      commit.files.some(f => action.changes.some(c => c.file === f))
    );

    if (similarChanges.length > 3) {
      factors.push({
        category: 'operational',
        name: 'frequent_changes',
        description: `${similarChanges.length} recent changes to affected files`,
        severity: 0.4,
        probability: 0.5,
        impact: 0.4,
        evidence: similarChanges.map(c => c.message),
      });
    }

    return factors;
  }

  private adjustSeverity(factor: RiskFactor, context: PredictionContext): number {
    let severity = factor.severity;

    // Higher severity for production actions
    if (context.projectMetadata.lastDeployment) {
      const daysSinceDeployment = Math.floor(
        (Date.now() - context.projectMetadata.lastDeployment.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceDeployment < 7) {
        severity *= 1.2;
      }
    }

    return Math.min(1, severity);
  }

  private adjustImpact(factor: RiskFactor, context: PredictionContext): number {
    let impact = factor.impact;

    // Higher impact for larger projects
    if (context.projectMetadata.fileCount > 100) {
      impact *= 1.2;
    }

    return Math.min(1, impact);
  }

  private deduplicateFactors(factors: RiskFactor[]): RiskFactor[] {
    const seen = new Set<string>();
    return factors.filter(f => {
      const key = `${f.category}:${f.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private prioritizeMitigations(mitigations: MitigationStrategy[]): MitigationStrategy[] {
    return mitigations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private analyzeDependencies(assessments: RiskAssessment[]): RiskAssessment[] {
    // Analyze cascade risks between actions
    for (let i = 1; i < assessments.length; i++) {
      const prev = assessments[i - 1];
      const curr = assessments[i];

      // Check if current action depends on previous high-risk action
      if (curr.action.dependencies.some(d => d === prev.action.target)) {
        if (prev.riskLevel === 'high' || prev.riskLevel === 'critical') {
          curr.riskScore = Math.min(1, curr.riskScore * 1.2);
          curr.riskLevel = this.determineRiskLevel(curr.riskScore);
        }
      }
    }

    return assessments;
  }

  private detectEmergingRisks(
    events: ExecutionEvent[],
    assessment: RiskAssessment
  ): RiskFactor[] {
    const newFactors: RiskFactor[] = [];

    for (const event of events) {
      if (event.type === 'error' || event.type === 'warning') {
        newFactors.push({
          category: 'operational',
          name: 'execution_error',
          description: event.message,
          severity: event.type === 'error' ? 0.8 : 0.5,
          probability: 1,
          impact: 0.7,
          evidence: [event.message],
        });
      }
    }

    return newFactors;
  }

  private recalculateRisk(
    originalFactors: RiskFactor[],
    newFactors: RiskFactor[]
  ): number {
    const allFactors = [...originalFactors, ...newFactors];
    return this.calculateOverallRisk(allFactors);
  }

  private updateRecommendation(
    assessment: RiskAssessment,
    newFactors: RiskFactor[]
  ): RiskAssessment['recommendation'] {
    const hasNewHighRisk = newFactors.some(f => f.severity >= 0.8);

    if (hasNewHighRisk) {
      return 'abort';
    }

    if (newFactors.some(f => f.severity >= 0.6)) {
      return 'review_required';
    }

    return assessment.recommendation;
  }

  private shouldPauseExecution(newFactors: RiskFactor[]): boolean {
    return newFactors.some(f => f.severity >= 0.7);
  }

  private assessContextQuality(context: PredictionContext): number {
    let quality = 0;

    if (context.projectMetadata) quality += 0.2;
    if (context.recentChanges.length > 0) quality += 0.2;
    if (context.gitHistory.length > 0) quality += 0.2;
    if (context.testCoverage > 0) quality += 0.2;
    if (context.dependencyHealth.length > 0) quality += 0.2;

    return quality;
  }

  private getDefaultThresholds(): RiskThresholdConfig {
    return {
      minimal: { min: 0, max: 0.2 },
      low: { min: 0.2, max: 0.4 },
      medium: { min: 0.4, max: 0.6 },
      high: { min: 0.6, max: 0.8 },
      critical: { min: 0.8, max: 1.0 },
    };
  }

  private generateId(): string {
    return `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Supporting interfaces and classes
interface RiskPattern {
  pattern: RegExp;
  riskType: string;
  baseSeverity: number;
  description: string;
}

interface RiskThresholdConfig {
  [level: string]: { min: number; max: number };
}

interface ExecutionEvent {
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: Date;
}

interface RiskUpdate {
  originalAssessment: RiskAssessment;
  newRiskFactors: RiskFactor[];
  updatedRiskScore: number;
  currentRecommendation: RiskAssessment['recommendation'];
  shouldPause: boolean;
}

class RiskHistoricalData {
  private data: Map<string, number> = new Map();

  getMatchCount(factors: RiskFactor[]): number {
    return factors.reduce((sum, f) => {
      return sum + (this.data.get(f.name) || 0);
    }, 0);
  }

  recordOutcome(factor: string, occurred: boolean): void {
    const current = this.data.get(factor) || 0;
    this.data.set(factor, current + (occurred ? 1 : 0));
  }
}

// Singleton instance
let engineInstance: RiskPredictionEngine | null = null;

export function getRiskPredictionEngine(): RiskPredictionEngine {
  if (!engineInstance) {
    engineInstance = new RiskPredictionEngine();
  }
  return engineInstance;
}
