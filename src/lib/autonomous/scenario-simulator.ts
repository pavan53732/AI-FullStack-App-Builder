/**
 * Scenario Simulator
 * Mechanisms 102: Simulates scenarios to predict outcomes before execution
 */

export interface Scenario {
  id: string;
  name: string;
  description: string;
  initialState: SimulationState;
  actions: SimulationAction[];
  expectedOutcomes: ExpectedOutcome[];
  constraints: SimulationConstraint[];
  duration: number; // simulated time in milliseconds
}

export interface SimulationState {
  variables: Record<string, unknown>;
  resources: ResourceState[];
  agents: AgentSimulationState[];
  environment: EnvironmentState;
}

export interface ResourceState {
  name: string;
  available: number;
  maxCapacity: number;
  unit: string;
}

export interface AgentSimulationState {
  id: string;
  type: string;
  status: 'idle' | 'working' | 'waiting' | 'failed';
  currentTask?: string;
  capabilities: string[];
  load: number; // 0-1
}

export interface EnvironmentState {
  network: NetworkCondition;
  systemLoad: number;
  errorRate: number;
  latency: number;
}

export interface NetworkCondition {
  bandwidth: number; // Mbps
  latency: number; // ms
  packetLoss: number; // 0-1
  reliability: number; // 0-1
}

export interface SimulationAction {
  id: string;
  type: ActionType;
  actor: string;
  target?: string;
  parameters: Record<string, unknown>;
  preconditions: Precondition[];
  effects: Effect[];
  probability: number;
  duration: number;
}

export type ActionType =
  | 'create'
  | 'modify'
  | 'delete'
  | 'execute'
  | 'communicate'
  | 'allocate'
  | 'release'
  | 'wait'
  | 'branch'
  | 'merge';

export interface Precondition {
  type: 'resource' | 'state' | 'agent' | 'time';
  condition: string;
  required: boolean;
}

export interface Effect {
  type: 'state_change' | 'resource_change' | 'agent_change' | 'event';
  target: string;
  transformation: string;
  probability: number;
}

export interface ExpectedOutcome {
  metric: string;
  expectedValue: number | string | boolean;
  tolerance: number;
  importance: 'critical' | 'high' | 'medium' | 'low';
}

export interface SimulationConstraint {
  type: 'time' | 'resource' | 'state' | 'safety';
  description: string;
  condition: string;
  penalty: number;
}

export interface SimulationResult {
  id: string;
  scenarioId: string;
  timestamp: Date;
  status: 'success' | 'partial' | 'failed' | 'timeout';
  duration: number;
  steps: SimulationStepResult[];
  finalState: SimulationState;
  metrics: SimulationMetrics;
  issues: SimulationIssue[];
  recommendations: string[];
  confidence: number;
}

export interface SimulationStepResult {
  actionId: string;
  executed: boolean;
  actualEffects: Effect[];
  timeElapsed: number;
  stateSnapshot: SimulationState;
  issues: string[];
}

export interface SimulationMetrics {
  resourceUtilization: Record<string, number>;
  agentUtilization: Record<string, number>;
  throughput: number;
  latency: number;
  errorRate: number;
  successRate: number;
  costEstimate: number;
}

export interface SimulationIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'constraint_violation' | 'resource_exhaustion' | 'deadlock' | 'timeout' | 'error';
  description: string;
  timestamp: number;
  affectedActions: string[];
  suggestion: string;
}

export class ScenarioSimulator {
  private scenarios: Map<string, Scenario>;
  private results: Map<string, SimulationResult[]>;
  private defaultEnvironment: EnvironmentState;

  constructor() {
    this.scenarios = new Map();
    this.results = new Map();
    this.defaultEnvironment = {
      network: {
        bandwidth: 1000,
        latency: 50,
        packetLoss: 0.001,
        reliability: 0.999,
      },
      systemLoad: 0.5,
      errorRate: 0.001,
      latency: 100,
    };
  }

  /**
   * Create and validate a scenario
   */
  createScenario(config: Omit<Scenario, 'id'>): Scenario {
    const scenario: Scenario = {
      ...config,
      id: this.generateId(),
    };

    this.validateScenario(scenario);
    this.scenarios.set(scenario.id, scenario);
    return scenario;
  }

  /**
   * Run a simulation
   */
  async simulate(
    scenarioId: string,
    options?: SimulationOptions
  ): Promise<SimulationResult> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }

    const state = this.initializeState(scenario, options);
    const stepResults: SimulationStepResult[] = [];
    const issues: SimulationIssue[] = [];
    let currentTime = 0;

    for (const action of scenario.actions) {
      const stepResult = await this.executeAction(action, state, currentTime, scenario);
      stepResults.push(stepResult);
      currentTime += stepResult.timeElapsed;

      // Check for issues
      issues.push(...this.detectIssues(stepResult, scenario));

      // Check for early termination conditions
      if (this.shouldTerminate(stepResult, issues, scenario)) {
        break;
      }
    }

    const metrics = this.calculateMetrics(stepResults, state, scenario);
    const result: SimulationResult = {
      id: this.generateId(),
      scenarioId,
      timestamp: new Date(),
      status: this.determineStatus(stepResults, issues),
      duration: currentTime,
      steps: stepResults,
      finalState: state,
      metrics,
      issues,
      recommendations: this.generateRecommendations(issues, metrics),
      confidence: this.calculateConfidence(stepResults, issues),
    };

    // Store result
    if (!this.results.has(scenarioId)) {
      this.results.set(scenarioId, []);
    }
    this.results.get(scenarioId)!.push(result);

    return result;
  }

  /**
   * Run Monte Carlo simulation
   */
  async monteCarloSimulate(
    scenarioId: string,
    iterations: number = 100,
    options?: SimulationOptions
  ): Promise<MonteCarloResult> {
    const results: SimulationResult[] = [];

    for (let i = 0; i < iterations; i++) {
      const result = await this.simulate(scenarioId, options);
      results.push(result);
    }

    return this.analyzeMonteCarloResults(results);
  }

  /**
   * Simulate what-if scenarios
   */
  async whatIf(
    scenarioId: string,
    variations: WhatIfVariation[]
  ): Promise<WhatIfResult[]> {
    const results: WhatIfResult[] = [];

    for (const variation of variations) {
      const modifiedScenario = this.applyVariation(scenarioId, variation);
      const result = await this.simulate(modifiedScenario.id);
      
      results.push({
        variation: variation.name,
        result,
        difference: this.calculateDifference(scenarioId, result),
      });
    }

    return results;
  }

  /**
   * Predict potential failures
   */
  async predictFailures(
    scenarioId: string,
    sensitivity: number = 0.8
  ): Promise<FailurePrediction[]> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      return [];
    }

    const predictions: FailurePrediction[] = [];

    // Stress test resources
    for (const resource of scenario.initialState.resources) {
      const stressTest = await this.stressTestResource(scenario, resource.name, sensitivity);
      if (stressTest.failurePoint) {
        predictions.push({
          type: 'resource_exhaustion',
          target: resource.name,
          probability: stressTest.failureProbability,
          trigger: `Resource ${resource.name} exhausted at ${(stressTest.failurePoint * 100).toFixed(0)}% capacity`,
          mitigation: `Increase ${resource.name} capacity or optimize usage`,
        });
      }
    }

    // Test action dependencies
    for (const action of scenario.actions) {
      const depTest = await this.testActionDependencies(scenario, action);
      if (depTest.riskLevel > 0.5) {
        predictions.push({
          type: 'dependency_failure',
          target: action.id,
          probability: depTest.riskLevel,
          trigger: `Action ${action.type} has ${depTest.unmetPreconditions.length} risky preconditions`,
          mitigation: 'Add fallback actions or relax preconditions',
        });
      }
    }

    // Test agent failures
    for (const agent of scenario.initialState.agents) {
      const agentTest = await this.testAgentFailure(scenario, agent.id);
      if (agentTest.impactLevel > 0.3) {
        predictions.push({
          type: 'agent_failure',
          target: agent.id,
          probability: agentTest.failureProbability,
          trigger: `Agent ${agent.id} failure would impact ${(agentTest.impactLevel * 100).toFixed(0)}% of actions`,
          mitigation: 'Add redundant agents or backup strategies',
        });
      }
    }

    return predictions;
  }

  private initializeState(
    scenario: Scenario,
    options?: SimulationOptions
  ): SimulationState {
    return {
      variables: { ...scenario.initialState.variables },
      resources: scenario.initialState.resources.map(r => ({ ...r })),
      agents: scenario.initialState.agents.map(a => ({ ...a })),
      environment: options?.environment || { ...this.defaultEnvironment },
    };
  }

  private async executeAction(
    action: SimulationAction,
    state: SimulationState,
    currentTime: number,
    scenario: Scenario
  ): Promise<SimulationStepResult> {
    const issues: string[] = [];
    const actualEffects: Effect[] = [];

    // Check preconditions
    const preconditionsMet = this.checkPreconditions(action, state);
    if (!preconditionsMet.met) {
      issues.push(`Preconditions not met: ${preconditionsMet.failed.join(', ')}`);
      return {
        actionId: action.id,
        executed: false,
        actualEffects: [],
        timeElapsed: 0,
        stateSnapshot: { ...state },
        issues,
      };
    }

    // Simulate probabilistic effects
    for (const effect of action.effects) {
      if (Math.random() < effect.probability) {
        this.applyEffect(effect, state);
        actualEffects.push(effect);
      }
    }

    // Simulate potential errors
    if (Math.random() < state.environment.errorRate) {
      issues.push('Simulated error occurred during action execution');
    }

    return {
      actionId: action.id,
      executed: true,
      actualEffects,
      timeElapsed: action.duration * (1 + state.environment.latency / 1000),
      stateSnapshot: { ...state },
      issues,
    };
  }

  private checkPreconditions(
    action: SimulationAction,
    state: SimulationState
  ): { met: boolean; failed: string[] } {
    const failed: string[] = [];

    for (const precondition of action.preconditions) {
      const met = this.evaluatePrecondition(precondition, state);
      if (!met && precondition.required) {
        failed.push(precondition.condition);
      }
    }

    return { met: failed.length === 0, failed };
  }

  private evaluatePrecondition(
    precondition: Precondition,
    state: SimulationState
  ): boolean {
    // Simple evaluation - would be more sophisticated in production
    const condition = precondition.condition;
    
    // Check resource conditions
    if (condition.includes('resource.')) {
      const [, resourceName, operator, value] = condition.split(/[.\s]+/);
      const resource = state.resources.find(r => r.name === resourceName);
      if (resource) {
        const threshold = parseFloat(value);
        switch (operator) {
          case '>=': return resource.available >= threshold;
          case '<=': return resource.available <= threshold;
          case '>': return resource.available > threshold;
          case '<': return resource.available < threshold;
        }
      }
    }

    // Check variable conditions
    if (condition.includes('var.')) {
      const [, varName, operator, value] = condition.split(/[.\s]+/);
      const currentValue = state.variables[varName];
      return this.compareValues(currentValue, operator, value);
    }

    // Check agent conditions
    if (condition.includes('agent.')) {
      const [, agentId, property, operator, value] = condition.split(/[.\s]+/);
      const agent = state.agents.find(a => a.id === agentId);
      if (agent) {
        const currentValue = (agent as Record<string, unknown>)[property];
        return this.compareValues(currentValue, operator, value);
      }
    }

    return true; // Default to true if condition cannot be evaluated
  }

  private compareValues(
    current: unknown,
    operator: string,
    expected: string
  ): boolean {
    if (typeof current === 'number') {
      const expectedNum = parseFloat(expected);
      switch (operator) {
        case '>=': return current >= expectedNum;
        case '<=': return current <= expectedNum;
        case '>': return current > expectedNum;
        case '<': return current < expectedNum;
        case '==': return current === expectedNum;
      }
    }
    if (typeof current === 'string') {
      switch (operator) {
        case '==': return current === expected;
        case '!=': return current !== expected;
        case 'contains': return current.includes(expected);
      }
    }
    return false;
  }

  private applyEffect(effect: Effect, state: SimulationState): void {
    switch (effect.type) {
      case 'resource_change':
        const resource = state.resources.find(r => r.name === effect.target);
        if (resource) {
          const delta = parseFloat(effect.transformation);
          resource.available = Math.max(0, Math.min(resource.maxCapacity, resource.available + delta));
        }
        break;

      case 'state_change':
        state.variables[effect.target] = this.evaluateTransformation(
          state.variables[effect.target],
          effect.transformation
        );
        break;

      case 'agent_change':
        const agent = state.agents.find(a => a.id === effect.target);
        if (agent) {
          this.applyAgentChange(agent, effect.transformation);
        }
        break;

      case 'event':
        // Events would trigger additional actions in a full implementation
        break;
    }
  }

  private evaluateTransformation(
    currentValue: unknown,
    transformation: string
  ): unknown {
    if (typeof currentValue === 'number') {
      if (transformation.startsWith('+')) {
        return currentValue + parseFloat(transformation.slice(1));
      }
      if (transformation.startsWith('-')) {
        return currentValue - parseFloat(transformation.slice(1));
      }
      if (transformation.startsWith('*')) {
        return currentValue * parseFloat(transformation.slice(1));
      }
      if (transformation.startsWith('=')) {
        return parseFloat(transformation.slice(1));
      }
    }
    if (transformation.startsWith('=')) {
      return transformation.slice(1);
    }
    return currentValue;
  }

  private applyAgentChange(
    agent: AgentSimulationState,
    transformation: string
  ): void {
    if (transformation.includes('status=')) {
      agent.status = transformation.split('=')[1] as AgentSimulationState['status'];
    }
    if (transformation.includes('load=')) {
      agent.load = parseFloat(transformation.split('=')[1]);
    }
    if (transformation.includes('task=')) {
      agent.currentTask = transformation.split('=')[1];
    }
  }

  private detectIssues(
    stepResult: SimulationStepResult,
    scenario: Scenario
  ): SimulationIssue[] {
    const issues: SimulationIssue[] = [];
    const state = stepResult.stateSnapshot;

    // Check resource exhaustion
    for (const resource of state.resources) {
      if (resource.available / resource.maxCapacity < 0.1) {
        issues.push({
          severity: 'high',
          type: 'resource_exhaustion',
          description: `Resource ${resource.name} critically low: ${(resource.available / resource.maxCapacity * 100).toFixed(1)}%`,
          timestamp: stepResult.timeElapsed,
          affectedActions: [stepResult.actionId],
          suggestion: `Allocate more ${resource.name} or optimize usage`,
        });
      }
    }

    // Check constraint violations
    for (const constraint of scenario.constraints) {
      if (!this.evaluateConstraint(constraint, state)) {
        issues.push({
          severity: 'medium',
          type: 'constraint_violation',
          description: `Constraint violated: ${constraint.description}`,
          timestamp: stepResult.timeElapsed,
          affectedActions: [stepResult.actionId],
          suggestion: 'Adjust actions to meet constraint',
        });
      }
    }

    // Check agent issues
    for (const agent of state.agents) {
      if (agent.status === 'failed') {
        issues.push({
          severity: 'high',
          type: 'error',
          description: `Agent ${agent.id} failed`,
          timestamp: stepResult.timeElapsed,
          affectedActions: [stepResult.actionId],
          suggestion: 'Check agent logs and restart or use backup',
        });
      }
    }

    return issues;
  }

  private evaluateConstraint(
    constraint: SimulationConstraint,
    state: SimulationState
  ): boolean {
    // Simplified constraint evaluation
    return true;
  }

  private shouldTerminate(
    stepResult: SimulationStepResult,
    issues: SimulationIssue[],
    scenario: Scenario
  ): boolean {
    // Check for critical failures
    if (issues.some(i => i.severity === 'critical')) {
      return true;
    }

    // Check for complete resource exhaustion
    const state = stepResult.stateSnapshot;
    if (state.resources.some(r => r.available <= 0)) {
      return true;
    }

    // Check for all agents failed
    if (state.agents.every(a => a.status === 'failed')) {
      return true;
    }

    return false;
  }

  private calculateMetrics(
    steps: SimulationStepResult[],
    finalState: SimulationState,
    scenario: Scenario
  ): SimulationMetrics {
    const resourceUtilization: Record<string, number> = {};
    for (const resource of scenario.initialState.resources) {
      const final = finalState.resources.find(r => r.name === resource.name);
      if (final) {
        resourceUtilization[resource.name] = 
          1 - (final.available / resource.available);
      }
    }

    const agentUtilization: Record<string, number> = {};
    for (const agent of finalState.agents) {
      agentUtilization[agent.id] = agent.load;
    }

    const successfulSteps = steps.filter(s => s.executed);
    const totalTime = steps.reduce((sum, s) => sum + s.timeElapsed, 0);

    return {
      resourceUtilization,
      agentUtilization,
      throughput: successfulSteps.length / (totalTime / 1000 || 1),
      latency: totalTime / (steps.length || 1),
      errorRate: steps.filter(s => s.issues.length > 0).length / (steps.length || 1),
      successRate: successfulSteps.length / (steps.length || 1),
      costEstimate: this.estimateCost(steps, finalState),
    };
  }

  private estimateCost(
    steps: SimulationStepResult[],
    state: SimulationState
  ): number {
    // Simplified cost estimation
    let cost = 0;
    cost += steps.length * 0.01; // Action cost
    cost += state.agents.reduce((sum, a) => sum + a.load * 0.1, 0); // Agent cost
    return cost;
  }

  private determineStatus(
    steps: SimulationStepResult[],
    issues: SimulationIssue[]
  ): SimulationResult['status'] {
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');
    const executedSteps = steps.filter(s => s.executed);

    if (criticalIssues.length > 0 || executedSteps.length === 0) {
      return 'failed';
    }
    if (highIssues.length > 0 || executedSteps.length < steps.length * 0.8) {
      return 'partial';
    }
    return 'success';
  }

  private generateRecommendations(
    issues: SimulationIssue[],
    metrics: SimulationMetrics
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.errorRate > 0.1) {
      recommendations.push('Consider adding error handling and retry logic');
    }

    for (const issue of issues) {
      if (!recommendations.includes(issue.suggestion)) {
        recommendations.push(issue.suggestion);
      }
    }

    for (const [resource, utilization] of Object.entries(metrics.resourceUtilization)) {
      if (utilization > 0.9) {
        recommendations.push(`Consider increasing ${resource} capacity to prevent bottlenecks`);
      }
    }

    return recommendations;
  }

  private calculateConfidence(
    steps: SimulationStepResult[],
    issues: SimulationIssue[]
  ): number {
    const baseConfidence = 0.9;
    const issuePenalty = issues.reduce((sum, i) => {
      const penalties = { low: 0.02, medium: 0.05, high: 0.1, critical: 0.2 };
      return sum + penalties[i.severity];
    }, 0);

    return Math.max(0.1, baseConfidence - issuePenalty);
  }

  private validateScenario(scenario: Scenario): void {
    if (!scenario.actions || scenario.actions.length === 0) {
      throw new Error('Scenario must have at least one action');
    }
    if (!scenario.initialState.resources || scenario.initialState.resources.length === 0) {
      throw new Error('Scenario must have at least one resource');
    }
    if (!scenario.initialState.agents || scenario.initialState.agents.length === 0) {
      throw new Error('Scenario must have at least one agent');
    }
  }

  private async stressTestResource(
    scenario: Scenario,
    resourceName: string,
    sensitivity: number
  ): Promise<{ failurePoint: number | null; failureProbability: number }> {
    const resource = scenario.initialState.resources.find(r => r.name === resourceName);
    if (!resource) {
      return { failurePoint: null, failureProbability: 0 };
    }

    // Simulate at different capacity levels
    for (let capacity = 1; capacity >= 0.1; capacity -= 0.1) {
      const modifiedScenario = {
        ...scenario,
        id: `${scenario.id}_stress_${resourceName}_${capacity}`,
        initialState: {
          ...scenario.initialState,
          resources: scenario.initialState.resources.map(r =>
            r.name === resourceName
              ? { ...r, available: r.available * capacity, maxCapacity: r.maxCapacity * capacity }
              : r
          ),
        },
      };

      this.scenarios.set(modifiedScenario.id, modifiedScenario);
      const result = await this.simulate(modifiedScenario.id);

      if (result.status === 'failed') {
        return {
          failurePoint: capacity + 0.1,
          failureProbability: 1 - capacity,
        };
      }
    }

    return { failurePoint: null, failureProbability: 0 };
  }

  private async testActionDependencies(
    scenario: Scenario,
    action: SimulationAction
  ): Promise<{ riskLevel: number; unmetPreconditions: string[] }> {
    const unmetPreconditions: string[] = [];
    let riskLevel = 0;

    for (const precon of action.preconditions) {
      if (!this.canAlwaysSatisfyPrecondition(precon, scenario)) {
        unmetPreconditions.push(precon.condition);
        riskLevel += precon.required ? 0.3 : 0.1;
      }
    }

    return { riskLevel: Math.min(1, riskLevel), unmetPreconditions };
  }

  private canAlwaysSatisfyPrecondition(
    precondition: Precondition,
    scenario: Scenario
  ): boolean {
    // Check if precondition can always be satisfied by scenario resources
    return true; // Simplified - would need detailed analysis
  }

  private async testAgentFailure(
    scenario: Scenario,
    agentId: string
  ): Promise<{ failureProbability: number; impactLevel: number }> {
    const agentActions = scenario.actions.filter(a => a.actor === agentId);
    const impactLevel = agentActions.length / scenario.actions.length;

    return {
      failureProbability: 0.1, // Default probability
      impactLevel,
    };
  }

  private analyzeMonteCarloResults(results: SimulationResult[]): MonteCarloResult {
    const successCount = results.filter(r => r.status === 'success').length;
    const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const averageCost = results.reduce((sum, r) => sum + r.metrics.costEstimate, 0) / results.length;

    const metricsDistributions: Record<string, { mean: number; std: number; min: number; max: number }> = {};
    const metricKeys = ['throughput', 'latency', 'errorRate', 'successRate'] as const;

    for (const key of metricKeys) {
      const values = results.map(r => r.metrics[key]);
      metricsDistributions[key] = {
        mean: values.reduce((a, b) => a + b, 0) / values.length,
        std: this.standardDeviation(values),
        min: Math.min(...values),
        max: Math.max(...values),
      };
    }

    return {
      iterations: results.length,
      successRate: successCount / results.length,
      averageDuration,
      averageCost,
      metricsDistributions,
      confidenceInterval: this.calculateConfidenceInterval(results),
    };
  }

  private standardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
  }

  private calculateConfidenceInterval(results: SimulationResult[]): { lower: number; upper: number } {
    const successValues = results.map(r => r.metrics.successRate);
    const mean = successValues.reduce((a, b) => a + b, 0) / successValues.length;
    const std = this.standardDeviation(successValues);
    const margin = 1.96 * std / Math.sqrt(successValues.length);

    return {
      lower: Math.max(0, mean - margin),
      upper: Math.min(1, mean + margin),
    };
  }

  private applyVariation(scenarioId: string, variation: WhatIfVariation): Scenario {
    const original = this.scenarios.get(scenarioId);
    if (!original) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }

    const modified = JSON.parse(JSON.stringify(original)) as Scenario;
    modified.id = `${scenarioId}_${variation.name}`;

    // Apply variation changes
    if (variation.resourceChanges) {
      for (const [name, change] of Object.entries(variation.resourceChanges)) {
        const resource = modified.initialState.resources.find(r => r.name === name);
        if (resource) {
          resource.available *= change.multiplier || 1;
          resource.maxCapacity *= change.multiplier || 1;
        }
      }
    }

    if (variation.actionChanges) {
      for (const [id, change] of Object.entries(variation.actionChanges)) {
        const action = modified.actions.find(a => a.id === id);
        if (action) {
          Object.assign(action, change);
        }
      }
    }

    this.scenarios.set(modified.id, modified);
    return modified;
  }

  private calculateDifference(
    originalScenarioId: string,
    newResult: SimulationResult
  ): SimulationDifference {
    const originalResults = this.results.get(originalScenarioId);
    if (!originalResults || originalResults.length === 0) {
      return { durationDiff: 0, costDiff: 0, successRateDiff: 0 };
    }

    const original = originalResults[originalResults.length - 1];
    return {
      durationDiff: newResult.duration - original.duration,
      costDiff: newResult.metrics.costEstimate - original.metrics.costEstimate,
      successRateDiff: newResult.metrics.successRate - original.metrics.successRate,
    };
  }

  private generateId(): string {
    return `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Supporting interfaces
interface SimulationOptions {
  environment?: EnvironmentState;
  speedMultiplier?: number;
  recordSnapshots?: boolean;
}

interface MonteCarloResult {
  iterations: number;
  successRate: number;
  averageDuration: number;
  averageCost: number;
  metricsDistributions: Record<string, { mean: number; std: number; min: number; max: number }>;
  confidenceInterval: { lower: number; upper: number };
}

interface WhatIfVariation {
  name: string;
  resourceChanges?: Record<string, { multiplier?: number; absolute?: number }>;
  actionChanges?: Record<string, Partial<SimulationAction>>;
}

interface WhatIfResult {
  variation: string;
  result: SimulationResult;
  difference: SimulationDifference;
}

interface SimulationDifference {
  durationDiff: number;
  costDiff: number;
  successRateDiff: number;
}

interface FailurePrediction {
  type: 'resource_exhaustion' | 'dependency_failure' | 'agent_failure' | 'constraint_violation';
  target: string;
  probability: number;
  trigger: string;
  mitigation: string;
}

// Singleton instance
let simulatorInstance: ScenarioSimulator | null = null;

export function getScenarioSimulator(): ScenarioSimulator {
  if (!simulatorInstance) {
    simulatorInstance = new ScenarioSimulator();
  }
  return simulatorInstance;
}
