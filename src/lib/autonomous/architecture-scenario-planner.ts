/**
 * Architecture Scenario Planner
 * Plans and simulates architecture scenarios for future growth and scaling
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ArchitectureScenario {
  id: string;
  name: string;
  description: string;
  type: ScenarioType;
  status: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  assumptions: ScenarioAssumption[];
  components: ScenarioComponent[];
  timeline: ScenarioTimeline;
  risks: ScenarioRisk[];
  metrics: ScenarioMetric[];
  dependencies: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export type ScenarioType = 
  | 'scaling' 
  | 'migration' 
  | 'disaster_recovery' 
  | 'cost_optimization' 
  | 'performance' 
  | 'security' 
  | 'growth'
  | 'modernization';

export interface ScenarioAssumption {
  id: string;
  description: string;
  probability: number; // 0-1
  impact: 'low' | 'medium' | 'high';
  validated: boolean;
  validationMethod?: string;
}

export interface ScenarioComponent {
  id: string;
  name: string;
  type: 'service' | 'database' | 'cache' | 'queue' | 'storage' | 'cdn' | 'lb' | 'other';
  currentState: ComponentState;
  futureState: ComponentState;
  changes: ComponentChange[];
  estimatedCost: number;
}

export interface ComponentState {
  configuration: Record<string, unknown>;
  capacity: number;
  utilization: number;
  cost: number;
}

export interface ComponentChange {
  type: 'add' | 'modify' | 'remove' | 'scale_up' | 'scale_down' | 'migrate';
  description: string;
  effort: number; // person-days
  risk: number; // 0-1
  prerequisites: string[];
}

export interface ScenarioTimeline {
  startDate: Date;
  endDate: Date;
  phases: ScenarioPhase[];
  criticalPath: string[];
}

export interface ScenarioPhase {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  tasks: ScenarioTask[];
  dependencies: string[];
  milestone: boolean;
}

export interface ScenarioTask {
  id: string;
  name: string;
  description: string;
  assignee?: string;
  estimatedHours: number;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  dependencies: string[];
}

export interface ScenarioRisk {
  id: string;
  description: string;
  probability: number;
  impact: number;
  mitigation: string;
  contingency: string;
  owner?: string;
}

export interface ScenarioMetric {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  measurementMethod: string;
}

export interface ScenarioSimulationResult {
  scenarioId: string;
  timestamp: Date;
  success: boolean;
  duration: number;
  finalState: Record<string, unknown>;
  metrics: Map<string, { before: number; after: number; change: number }>;
  bottlenecks: string[];
  recommendations: string[];
  riskScore: number;
  costProjection: CostProjection;
}

export interface CostProjection {
  currentMonthly: number;
  projectedMonthly: number;
  oneTimeCosts: number;
  roi: number;
  paybackPeriod: number; // months
}

export interface ScenarioComparison {
  scenario1: ArchitectureScenario;
  scenario2: ArchitectureScenario;
  differences: Map<string, { field: string; value1: unknown; value2: unknown }>;
  recommendation: string;
}

// ============================================================================
// Default Scenario Templates
// ============================================================================

const SCENARIO_TEMPLATES: Partial<ArchitectureScenario>[] = [
  {
    type: 'scaling',
    name: 'Horizontal Scaling',
    description: 'Scale out services to handle increased load',
    assumptions: [
      { id: 'as-1', description: 'Load will increase by 2x in next quarter', probability: 0.8, impact: 'high', validated: false }
    ],
    priority: 'high'
  },
  {
    type: 'migration',
    name: 'Database Migration',
    description: 'Migrate from current database to new system',
    assumptions: [
      { id: 'as-2', description: 'Downtime window available', probability: 0.6, impact: 'high', validated: false }
    ],
    priority: 'high'
  },
  {
    type: 'disaster_recovery',
    name: 'Disaster Recovery Setup',
    description: 'Implement disaster recovery capabilities',
    assumptions: [
      { id: 'as-3', description: 'Budget approved for DR infrastructure', probability: 0.7, impact: 'high', validated: false }
    ],
    priority: 'critical'
  },
  {
    type: 'cost_optimization',
    name: 'Cost Optimization',
    description: 'Reduce infrastructure costs',
    assumptions: [
      { id: 'as-4', description: 'Performance SLAs can be maintained', probability: 0.9, impact: 'medium', validated: false }
    ],
    priority: 'medium'
  }
];

// ============================================================================
// Architecture Scenario Planner Class
// ============================================================================

export class ArchitectureScenarioPlanner {
  private scenarios: Map<string, ArchitectureScenario> = new Map();
  private templates: Map<string, Partial<ArchitectureScenario>> = new Map();
  private simulationResults: Map<string, ScenarioSimulationResult[]> = new Map();

  constructor() {
    // Initialize with default templates
    for (const template of SCENARIO_TEMPLATES) {
      if (template.type) {
        this.templates.set(template.type, template);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Scenario Management
  // --------------------------------------------------------------------------

  createScenario(
    name: string,
    type: ScenarioType,
    description: string
  ): ArchitectureScenario {
    const template = this.templates.get(type);
    
    const scenario: ArchitectureScenario = {
      id: `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      type,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      assumptions: template?.assumptions || [],
      components: [],
      timeline: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days default
        phases: [],
        criticalPath: []
      },
      risks: [],
      metrics: [],
      dependencies: [],
      priority: template?.priority || 'medium'
    };

    this.scenarios.set(scenario.id, scenario);
    return scenario;
  }

  updateScenario(id: string, updates: Partial<ArchitectureScenario>): boolean {
    const existing = this.scenarios.get(id);
    if (!existing) return false;

    const updated: ArchitectureScenario = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    this.scenarios.set(id, updated);
    return true;
  }

  deleteScenario(id: string): boolean {
    return this.scenarios.delete(id);
  }

  getScenario(id: string): ArchitectureScenario | undefined {
    return this.scenarios.get(id);
  }

  getAllScenarios(): ArchitectureScenario[] {
    return Array.from(this.scenarios.values());
  }

  getScenariosByType(type: ScenarioType): ArchitectureScenario[] {
    return Array.from(this.scenarios.values()).filter(s => s.type === type);
  }

  getScenariosByStatus(status: ArchitectureScenario['status']): ArchitectureScenario[] {
    return Array.from(this.scenarios.values()).filter(s => s.status === status);
  }

  // --------------------------------------------------------------------------
  // Component Management
  // --------------------------------------------------------------------------

  addComponent(scenarioId: string, component: ScenarioComponent): boolean {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) return false;

    scenario.components.push(component);
    scenario.updatedAt = new Date();
    return true;
  }

  updateComponent(
    scenarioId: string,
    componentId: string,
    updates: Partial<ScenarioComponent>
  ): boolean {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) return false;

    const index = scenario.components.findIndex(c => c.id === componentId);
    if (index === -1) return false;

    scenario.components[index] = { ...scenario.components[index], ...updates };
    scenario.updatedAt = new Date();
    return true;
  }

  removeComponent(scenarioId: string, componentId: string): boolean {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) return false;

    const index = scenario.components.findIndex(c => c.id === componentId);
    if (index === -1) return false;

    scenario.components.splice(index, 1);
    scenario.updatedAt = new Date();
    return true;
  }

  // --------------------------------------------------------------------------
  // Phase and Task Management
  // --------------------------------------------------------------------------

  addPhase(scenarioId: string, phase: ScenarioPhase): boolean {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) return false;

    scenario.timeline.phases.push(phase);
    scenario.updatedAt = new Date();
    return true;
  }

  addTask(scenarioId: string, phaseId: string, task: ScenarioTask): boolean {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) return false;

    const phase = scenario.timeline.phases.find(p => p.id === phaseId);
    if (!phase) return false;

    phase.tasks.push(task);
    scenario.updatedAt = new Date();
    return true;
  }

  updateTaskStatus(
    scenarioId: string,
    phaseId: string,
    taskId: string,
    status: ScenarioTask['status']
  ): boolean {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) return false;

    const phase = scenario.timeline.phases.find(p => p.id === phaseId);
    if (!phase) return false;

    const task = phase.tasks.find(t => t.id === taskId);
    if (!task) return false;

    task.status = status;
    scenario.updatedAt = new Date();
    return true;
  }

  // --------------------------------------------------------------------------
  // Risk Management
  // --------------------------------------------------------------------------

  addRisk(scenarioId: string, risk: ScenarioRisk): boolean {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) return false;

    scenario.risks.push(risk);
    scenario.updatedAt = new Date();
    return true;
  }

  assessRisks(scenarioId: string): {
    overallRisk: number;
    riskBreakdown: Map<string, number>;
    highRisks: ScenarioRisk[];
    mitigations: string[];
  } {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      return { overallRisk: 0, riskBreakdown: new Map(), highRisks: [], mitigations: [] };
    }

    const riskBreakdown = new Map<string, number>();
    let totalRisk = 0;

    for (const risk of scenario.risks) {
      const score = risk.probability * risk.impact;
      riskBreakdown.set(risk.id, score);
      totalRisk += score;
    }

    const overallRisk = scenario.risks.length > 0 
      ? totalRisk / scenario.risks.length 
      : 0;

    const highRisks = scenario.risks
      .filter(r => r.probability * r.impact > 0.5)
      .sort((a, b) => (b.probability * b.impact) - (a.probability * a.impact));

    const mitigations = highRisks.map(r => r.mitigation).filter(Boolean);

    return { overallRisk, riskBreakdown, highRisks, mitigations };
  }

  // --------------------------------------------------------------------------
  // Simulation
  // --------------------------------------------------------------------------

  simulateScenario(scenarioId: string): ScenarioSimulationResult {
    const scenario = this.scenarios.get(scenarioId);
    const startTime = Date.now();

    if (!scenario) {
      return {
        scenarioId,
        timestamp: new Date(),
        success: false,
        duration: 0,
        finalState: {},
        metrics: new Map(),
        bottlenecks: ['Scenario not found'],
        recommendations: ['Create a valid scenario first'],
        riskScore: 1,
        costProjection: {
          currentMonthly: 0,
          projectedMonthly: 0,
          oneTimeCosts: 0,
          roi: 0,
          paybackPeriod: 0
        }
      };
    }

    // Calculate metrics changes
    const metrics = new Map<string, { before: number; after: number; change: number }>();
    for (const metric of scenario.metrics) {
      const change = ((metric.targetValue - metric.currentValue) / metric.currentValue) * 100;
      metrics.set(metric.name, {
        before: metric.currentValue,
        after: metric.targetValue,
        change
      });
    }

    // Identify bottlenecks
    const bottlenecks = this.identifyBottlenecks(scenario);

    // Calculate risk score
    const riskAssessment = this.assessRisks(scenarioId);
    const riskScore = riskAssessment.overallRisk;

    // Calculate cost projection
    const costProjection = this.calculateCostProjection(scenario);

    // Generate recommendations
    const recommendations = this.generateRecommendations(scenario, bottlenecks, riskAssessment);

    // Determine success based on multiple factors
    const success = riskScore < 0.5 && bottlenecks.length < 3 && costProjection.roi > 0;

    const result: ScenarioSimulationResult = {
      scenarioId,
      timestamp: new Date(),
      success,
      duration: Date.now() - startTime,
      finalState: this.calculateFinalState(scenario),
      metrics,
      bottlenecks,
      recommendations,
      riskScore,
      costProjection
    };

    // Store simulation result
    const history = this.simulationResults.get(scenarioId) || [];
    history.push(result);
    this.simulationResults.set(scenarioId, history);

    return result;
  }

  // --------------------------------------------------------------------------
  // Comparison and Analysis
  // --------------------------------------------------------------------------

  compareScenarios(id1: string, id2: string): ScenarioComparison | null {
    const scenario1 = this.scenarios.get(id1);
    const scenario2 = this.scenarios.get(id2);

    if (!scenario1 || !scenario2) return null;

    const differences = new Map<string, { field: string; value1: unknown; value2: unknown }>();

    // Compare basic fields
    const fieldsToCompare = ['priority', 'type', 'status'] as const;
    for (const field of fieldsToCompare) {
      if (scenario1[field] !== scenario2[field]) {
        differences.set(field, {
          field,
          value1: scenario1[field],
          value2: scenario2[field]
        });
      }
    }

    // Compare costs
    const cost1 = scenario1.components.reduce((sum, c) => sum + c.estimatedCost, 0);
    const cost2 = scenario2.components.reduce((sum, c) => sum + c.estimatedCost, 0);
    if (cost1 !== cost2) {
      differences.set('totalCost', {
        field: 'totalCost',
        value1: cost1,
        value2: cost2
      });
    }

    // Compare risks
    if (scenario1.risks.length !== scenario2.risks.length) {
      differences.set('riskCount', {
        field: 'riskCount',
        value1: scenario1.risks.length,
        value2: scenario2.risks.length
      });
    }

    // Compare duration
    const duration1 = scenario1.timeline.endDate.getTime() - scenario1.timeline.startDate.getTime();
    const duration2 = scenario2.timeline.endDate.getTime() - scenario2.timeline.startDate.getTime();
    if (Math.abs(duration1 - duration2) > 24 * 60 * 60 * 1000) { // More than 1 day difference
      differences.set('duration', {
        field: 'duration',
        value1: duration1,
        value2: duration2
      });
    }

    // Generate recommendation
    let recommendation: string;
    if (cost1 < cost2 && scenario1.risks.length <= scenario2.risks.length) {
      recommendation = `${scenario1.name} is recommended (lower cost, equal or fewer risks)`;
    } else if (cost2 < cost1 && scenario2.risks.length <= scenario1.risks.length) {
      recommendation = `${scenario2.name} is recommended (lower cost, equal or fewer risks)`;
    } else {
      recommendation = 'Both scenarios have tradeoffs. Consider simulation results for detailed comparison.';
    }

    return { scenario1, scenario2, differences, recommendation };
  }

  getSimulationHistory(scenarioId: string): ScenarioSimulationResult[] {
    return this.simulationResults.get(scenarioId) || [];
  }

  // --------------------------------------------------------------------------
  // Template Management
  // --------------------------------------------------------------------------

  addTemplate(type: ScenarioType, template: Partial<ArchitectureScenario>): void {
    this.templates.set(type, template);
  }

  getTemplate(type: ScenarioType): Partial<ArchitectureScenario> | undefined {
    return this.templates.get(type);
  }

  // --------------------------------------------------------------------------
  // Private Helper Methods
  // --------------------------------------------------------------------------

  private identifyBottlenecks(scenario: ArchitectureScenario): string[] {
    const bottlenecks: string[] = [];

    // Check for components with high utilization
    for (const component of scenario.components) {
      if (component.currentState.utilization > 0.8) {
        bottlenecks.push(`${component.name} is at ${Math.round(component.currentState.utilization * 100)}% utilization`);
      }
      if (component.changes.some(c => c.risk > 0.7)) {
        bottlenecks.push(`${component.name} has high-risk changes planned`);
      }
    }

    // Check for tight timeline
    const duration = scenario.timeline.endDate.getTime() - scenario.timeline.startDate.getTime();
    const totalEffort = scenario.components.reduce(
      (sum, c) => sum + c.changes.reduce((s, ch) => s + ch.effort, 0),
      0
    );
    const availableDays = duration / (24 * 60 * 60 * 1000);
    if (totalEffort > availableDays * 0.8) { // More than 80% of available time
      bottlenecks.push(`Timeline is tight: ${totalEffort} person-days needed in ${Math.round(availableDays)} days`);
    }

    // Check for dependencies without resolution
    if (scenario.dependencies.length > 0) {
      const unresolvedDeps = scenario.dependencies.filter(d => 
        !Array.from(this.scenarios.values()).some(s => 
          s.status === 'completed' && s.id === d
        )
      );
      if (unresolvedDeps.length > 0) {
        bottlenecks.push(`${unresolvedDeps.length} unresolved dependencies`);
      }
    }

    // Check for critical path issues
    if (scenario.timeline.criticalPath.length > 5) {
      bottlenecks.push(`Long critical path with ${scenario.timeline.criticalPath.length} items`);
    }

    return bottlenecks;
  }

  private calculateCostProjection(scenario: ArchitectureScenario): CostProjection {
    const currentMonthly = scenario.components.reduce(
      (sum, c) => sum + c.currentState.cost,
      0
    );
    const projectedMonthly = scenario.components.reduce(
      (sum, c) => sum + c.futureState.cost,
      0
    );
    const oneTimeCosts = scenario.components.reduce(
      (sum, c) => sum + c.changes.reduce((s, ch) => s + ch.effort * 500, 0), // Assume $500/day
      0
    );

    const monthlySavings = currentMonthly - projectedMonthly;
    const roi = monthlySavings > 0 ? (monthlySavings * 12) / oneTimeCosts : 0;
    const paybackPeriod = monthlySavings > 0 ? oneTimeCosts / monthlySavings : Infinity;

    return {
      currentMonthly,
      projectedMonthly,
      oneTimeCosts,
      roi,
      paybackPeriod: Math.round(paybackPeriod * 10) / 10
    };
  }

  private calculateFinalState(scenario: ArchitectureScenario): Record<string, unknown> {
    const finalState: Record<string, unknown> = {};

    for (const component of scenario.components) {
      finalState[component.id] = {
        name: component.name,
        type: component.type,
        capacity: component.futureState.capacity,
        utilization: component.futureState.utilization,
        cost: component.futureState.cost
      };
    }

    finalState['metrics'] = scenario.metrics.map(m => ({
      name: m.name,
      value: m.targetValue,
      unit: m.unit
    }));

    return finalState;
  }

  private generateRecommendations(
    scenario: ArchitectureScenario,
    bottlenecks: string[],
    riskAssessment: { overallRisk: number; highRisks: ScenarioRisk[] }
  ): string[] {
    const recommendations: string[] = [];

    // Risk-based recommendations
    if (riskAssessment.overallRisk > 0.5) {
      recommendations.push('High overall risk score. Consider adding more mitigations.');
    }

    for (const risk of riskAssessment.highRisks) {
      if (risk.mitigation) {
        recommendations.push(`Implement mitigation for: ${risk.description}`);
      }
    }

    // Bottleneck-based recommendations
    for (const bottleneck of bottlenecks) {
      if (bottleneck.includes('utilization')) {
        recommendations.push('Consider scaling or optimizing high-utilization components');
      }
      if (bottleneck.includes('Timeline')) {
        recommendations.push('Consider extending timeline or reducing scope');
      }
      if (bottleneck.includes('dependencies')) {
        recommendations.push('Resolve dependencies before proceeding');
      }
    }

    // Timeline recommendations
    const hasIncompletePhases = scenario.timeline.phases.some(p => 
      p.tasks.some(t => t.status !== 'done')
    );
    if (hasIncompletePhases && scenario.status === 'in_progress') {
      recommendations.push('Complete all tasks before marking scenario as done');
    }

    // Cost recommendations
    const costProjection = this.calculateCostProjection(scenario);
    if (costProjection.roi < 0) {
      recommendations.push('Negative ROI. Re-evaluate cost projections or benefits.');
    }

    // Assumption validation
    const unvalidatedAssumptions = scenario.assumptions.filter(a => !a.validated);
    if (unvalidatedAssumptions.length > 0) {
      recommendations.push(`${unvalidatedAssumptions.length} assumptions need validation`);
    }

    return recommendations;
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  exportScenario(id: string): ArchitectureScenario | null {
    return this.scenarios.get(id) || null;
  }

  importScenario(scenario: ArchitectureScenario): void {
    this.scenarios.set(scenario.id, scenario);
  }

  exportAll(): ArchitectureScenario[] {
    return Array.from(this.scenarios.values());
  }

  clearScenarios(): void {
    this.scenarios.clear();
    this.simulationResults.clear();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createScenarioPlanner(): ArchitectureScenarioPlanner {
  return new ArchitectureScenarioPlanner();
}

export function createScenarioComponent(
  name: string,
  type: ScenarioComponent['type'],
  currentCost: number,
  futureCost: number
): ScenarioComponent {
  return {
    id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    type,
    currentState: {
      configuration: {},
      capacity: 100,
      utilization: 0.5,
      cost: currentCost
    },
    futureState: {
      configuration: {},
      capacity: 100,
      utilization: 0.5,
      cost: futureCost
    },
    changes: [],
    estimatedCost: futureCost - currentCost
  };
}

export function createScenarioPhase(
  name: string,
  description: string,
  durationDays: number
): ScenarioPhase {
  const startDate = new Date();
  return {
    id: `phase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    startDate,
    endDate: new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000),
    tasks: [],
    dependencies: [],
    milestone: false
  };
}

export function quickScenario(
  name: string,
  type: ScenarioType,
  description: string
): ArchitectureScenario {
  const planner = new ArchitectureScenarioPlanner();
  return planner.createScenario(name, type, description);
}
