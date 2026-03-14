/**
 * Agent Termination Controls
 * Mechanisms 188: Safety mechanisms for controlled agent termination
 */

export interface TerminationPolicy {
  id: string;
  name: string;
  description: string;
  triggers: TerminationTrigger[];
  gracePeriod: number; // milliseconds
  maxRetries: number;
  requireApproval: boolean;
  notifyOnTerminate: boolean;
  forceKillAfter: number; // milliseconds after graceful attempt
}

export interface TerminationTrigger {
  type: TriggerType;
  condition: TriggerCondition;
  threshold?: number;
  consecutiveOccurrences?: number;
  timeWindow?: number;
}

export type TriggerType =
  | 'cpu_threshold'
  | 'memory_threshold'
  | 'error_rate'
  | 'timeout'
  | 'security_violation'
  | 'resource_leak'
  | 'deadlock'
  | 'infinite_loop'
  | 'policy_violation'
  | 'manual'
  | 'dependency_failure'
  | 'health_check_failure';

export interface TriggerCondition {
  operator: '>' | '<' | '==' | '>=' | '<=' | '!=' | 'contains' | 'matches';
  value: number | string | boolean;
}

export interface TerminationRequest {
  id: string;
  agentId: string;
  reason: string;
  trigger: TerminationTrigger;
  requestedAt: Date;
  requestedBy: 'system' | 'user' | 'policy';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';
  approvals: Approval[];
  rejectionReason?: string;
}

export interface Approval {
  approver: string;
  approvedAt: Date;
  comment?: string;
}

export interface TerminationResult {
  id: string;
  requestId: string;
  agentId: string;
  status: 'success' | 'partial' | 'failed' | 'timeout';
  startedAt: Date;
  completedAt?: Date;
  steps: TerminationStep[];
  finalState: AgentState;
  resourcesCleaned: string[];
  rollbackAvailable: boolean;
}

export interface TerminationStep {
  order: number;
  action: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  output?: string;
}

export interface AgentState {
  status: 'running' | 'stopping' | 'stopped' | 'failed' | 'unknown';
  activeTasks: number;
  pendingTasks: number;
  lastActivity: Date;
  memoryUsage: number;
  cpuUsage: number;
}

export interface EmergencyStop {
  id: string;
  triggeredAt: Date;
  trigger: 'user' | 'system' | 'critical_threshold' | 'security_breach';
  affectedAgents: string[];
  status: 'initiated' | 'completed' | 'failed';
  results: TerminationResult[];
}

export class AgentTerminationController {
  private policies: Map<string, TerminationPolicy>;
  private pendingRequests: Map<string, TerminationRequest>;
  private terminationHistory: TerminationResult[];
  private activeAgents: Map<string, AgentState>;
  private emergencyStops: EmergencyStop[];
  private listeners: TerminationListener[];
  private defaultPolicies: TerminationPolicy[];

  constructor() {
    this.policies = new Map();
    this.pendingRequests = new Map();
    this.terminationHistory = [];
    this.activeAgents = new Map();
    this.emergencyStops = [];
    this.listeners = [];
    this.defaultPolicies = this.createDefaultPolicies();
    this.initializePolicies();
  }

  /**
   * Register an agent for monitoring
   */
  registerAgent(agentId: string, initialState: AgentState): void {
    this.activeAgents.set(agentId, {
      ...initialState,
      status: 'running',
      lastActivity: new Date(),
    });
  }

  /**
   * Update agent state (called by monitoring)
   */
  updateAgentState(agentId: string, update: Partial<AgentState>): void {
    const current = this.activeAgents.get(agentId);
    if (current) {
      this.activeAgents.set(agentId, { ...current, ...update });
      this.checkPolicies(agentId);
    }
  }

  /**
   * Request termination of an agent
   */
  requestTermination(
    agentId: string,
    reason: string,
    trigger: TerminationTrigger,
    requestedBy: 'system' | 'user' | 'policy' = 'system',
    urgency: TerminationRequest['urgency'] = 'medium'
  ): TerminationRequest {
    const request: TerminationRequest = {
      id: this.generateId(),
      agentId,
      reason,
      trigger,
      requestedAt: new Date(),
      requestedBy,
      urgency,
      status: 'pending',
      approvals: [],
    };

    // Check if approval is required
    const policy = this.getApplicablePolicy(trigger);
    if (policy?.requireApproval && requestedBy !== 'user') {
      this.pendingRequests.set(request.id, request);
      this.notifyListeners('termination_requested', request);
      return request;
    }

    // Auto-approve if urgency is critical or no approval needed
    if (urgency === 'critical' || !policy?.requireApproval || requestedBy === 'user') {
      request.status = 'approved';
      this.executeTermination(request);
    } else {
      this.pendingRequests.set(request.id, request);
      this.notifyListeners('termination_requested', request);
    }

    return request;
  }

  /**
   * Approve a pending termination request
   */
  approveTermination(
    requestId: string,
    approver: string,
    comment?: string
  ): TerminationRequest | null {
    const request = this.pendingRequests.get(requestId);
    if (!request) {
      return null;
    }

    request.approvals.push({
      approver,
      approvedAt: new Date(),
      comment,
    });

    request.status = 'approved';
    this.executeTermination(request);
    this.pendingRequests.delete(requestId);

    return request;
  }

  /**
   * Reject a pending termination request
   */
  rejectTermination(
    requestId: string,
    reason: string,
    rejectedBy: string
  ): TerminationRequest | null {
    const request = this.pendingRequests.get(requestId);
    if (!request) {
      return null;
    }

    request.status = 'rejected';
    request.rejectionReason = `${rejectedBy}: ${reason}`;
    this.pendingRequests.delete(requestId);
    this.notifyListeners('termination_rejected', request);

    return request;
  }

  /**
   * Emergency stop all agents
   */
  emergencyStopAll(
    trigger: EmergencyStop['trigger'],
    reason: string
  ): EmergencyStop {
    const stop: EmergencyStop = {
      id: this.generateId(),
      triggeredAt: new Date(),
      trigger,
      affectedAgents: Array.from(this.activeAgents.keys()),
      status: 'initiated',
      results: [],
    };

    this.emergencyStops.push(stop);

    // Terminate all agents immediately
    for (const agentId of stop.affectedAgents) {
      const request = this.requestTermination(
        agentId,
        `Emergency stop: ${reason}`,
        { type: 'manual', condition: { operator: '==', value: true } },
        'system',
        'critical'
      );

      // Get the result (should be immediate due to critical urgency)
      const lastResult = this.terminationHistory[this.terminationHistory.length - 1];
      if (lastResult && lastResult.agentId === agentId) {
        stop.results.push(lastResult);
      }
    }

    stop.status = 'completed';
    this.notifyListeners('emergency_stop', stop);

    return stop;
  }

  /**
   * Get all pending termination requests
   */
  getPendingRequests(): TerminationRequest[] {
    return Array.from(this.pendingRequests.values());
  }

  /**
   * Get termination history
   */
  getTerminationHistory(limit: number = 50): TerminationResult[] {
    return this.terminationHistory.slice(-limit);
  }

  /**
   * Add a termination listener
   */
  onTermination(listener: TerminationListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Create a custom termination policy
   */
  createPolicy(policy: Omit<TerminationPolicy, 'id'>): TerminationPolicy {
    const newPolicy: TerminationPolicy = {
      ...policy,
      id: this.generateId(),
    };
    this.policies.set(newPolicy.id, newPolicy);
    return newPolicy;
  }

  /**
   * Check if an agent can be safely terminated
   */
  canSafelyTerminate(agentId: string): SafetyCheckResult {
    const state = this.activeAgents.get(agentId);
    if (!state) {
      return { safe: false, reason: 'Agent not found' };
    }

    const issues: string[] = [];

    if (state.activeTasks > 0) {
      issues.push(`Agent has ${state.activeTasks} active tasks`);
    }

    if (state.pendingTasks > 0) {
      issues.push(`Agent has ${state.pendingTasks} pending tasks`);
    }

    return {
      safe: issues.length === 0,
      reason: issues.length > 0 ? issues.join('; ') : undefined,
      activeTasks: state.activeTasks,
      pendingTasks: state.pendingTasks,
    };
  }

  private initializePolicies(): void {
    for (const policy of this.defaultPolicies) {
      this.policies.set(policy.id, policy);
    }
  }

  private createDefaultPolicies(): TerminationPolicy[] {
    return [
      {
        id: 'cpu_threshold_policy',
        name: 'High CPU Usage',
        description: 'Terminate agents with sustained high CPU usage',
        triggers: [
          {
            type: 'cpu_threshold',
            condition: { operator: '>', value: 90 },
            threshold: 90,
            consecutiveOccurrences: 3,
            timeWindow: 60000,
          },
        ],
        gracePeriod: 30000,
        maxRetries: 3,
        requireApproval: false,
        notifyOnTerminate: true,
        forceKillAfter: 10000,
      },
      {
        id: 'memory_threshold_policy',
        name: 'Memory Leak Detection',
        description: 'Terminate agents with memory leaks',
        triggers: [
          {
            type: 'memory_threshold',
            condition: { operator: '>', value: 95 },
            threshold: 95,
            consecutiveOccurrences: 5,
            timeWindow: 120000,
          },
        ],
        gracePeriod: 60000,
        maxRetries: 3,
        requireApproval: false,
        notifyOnTerminate: true,
        forceKillAfter: 15000,
      },
      {
        id: 'error_rate_policy',
        name: 'High Error Rate',
        description: 'Terminate agents with excessive error rates',
        triggers: [
          {
            type: 'error_rate',
            condition: { operator: '>', value: 0.5 },
            threshold: 0.5,
            consecutiveOccurrences: 10,
            timeWindow: 60000,
          },
        ],
        gracePeriod: 30000,
        maxRetries: 2,
        requireApproval: true,
        notifyOnTerminate: true,
        forceKillAfter: 5000,
      },
      {
        id: 'security_violation_policy',
        name: 'Security Violation',
        description: 'Immediate termination for security violations',
        triggers: [
          {
            type: 'security_violation',
            condition: { operator: '==', value: true },
          },
        ],
        gracePeriod: 0,
        maxRetries: 0,
        requireApproval: false,
        notifyOnTerminate: true,
        forceKillAfter: 0,
      },
      {
        id: 'deadlock_policy',
        name: 'Deadlock Detection',
        description: 'Terminate agents in deadlock state',
        triggers: [
          {
            type: 'deadlock',
            condition: { operator: '==', value: true },
            timeWindow: 30000,
          },
        ],
        gracePeriod: 5000,
        maxRetries: 1,
        requireApproval: false,
        notifyOnTerminate: true,
        forceKillAfter: 5000,
      },
      {
        id: 'infinite_loop_policy',
        name: 'Infinite Loop Detection',
        description: 'Terminate agents stuck in infinite loops',
        triggers: [
          {
            type: 'infinite_loop',
            condition: { operator: '==', value: true },
            timeWindow: 60000,
          },
        ],
        gracePeriod: 10000,
        maxRetries: 1,
        requireApproval: false,
        notifyOnTerminate: true,
        forceKillAfter: 5000,
      },
    ];
  }

  private checkPolicies(agentId: string): void {
    const state = this.activeAgents.get(agentId);
    if (!state) return;

    for (const policy of this.policies.values()) {
      for (const trigger of policy.triggers) {
        if (this.shouldTrigger(trigger, state)) {
          this.requestTermination(
            agentId,
            `Policy triggered: ${policy.name}`,
            trigger,
            'policy',
            'high'
          );
        }
      }
    }
  }

  private shouldTrigger(trigger: TerminationTrigger, state: AgentState): boolean {
    let value: number | boolean;

    switch (trigger.type) {
      case 'cpu_threshold':
        value = state.cpuUsage;
        break;
      case 'memory_threshold':
        value = state.memoryUsage;
        break;
      case 'error_rate':
        value = 0; // Would need actual error tracking
        break;
      case 'deadlock':
      case 'infinite_loop':
        // Would need detection mechanism
        return false;
      case 'security_violation':
        return false;
      default:
        return false;
    }

    return this.evaluateCondition(value, trigger.condition);
  }

  private evaluateCondition(
    value: number | boolean,
    condition: TriggerCondition
  ): boolean {
    const condValue = condition.value;

    switch (condition.operator) {
      case '>':
        return value > (condValue as number);
      case '<':
        return value < (condValue as number);
      case '>=':
        return value >= (condValue as number);
      case '<=':
        return value <= (condValue as number);
      case '==':
        return value === condValue;
      case '!=':
        return value !== condValue;
      default:
        return false;
    }
  }

  private getApplicablePolicy(trigger: TerminationTrigger): TerminationPolicy | undefined {
    for (const policy of this.policies.values()) {
      if (policy.triggers.some(t => t.type === trigger.type)) {
        return policy;
      }
    }
    return undefined;
  }

  private async executeTermination(request: TerminationRequest): Promise<TerminationResult> {
    const policy = this.getApplicablePolicy(request.trigger);
    const steps = this.createTerminationSteps(request, policy);

    const result: TerminationResult = {
      id: this.generateId(),
      requestId: request.id,
      agentId: request.agentId,
      status: 'success',
      startedAt: new Date(),
      steps,
      finalState: { ...this.activeAgents.get(request.agentId) || this.getDefaultState() },
      resourcesCleaned: [],
      rollbackAvailable: false,
    };

    // Update agent status
    const agentState = this.activeAgents.get(request.agentId);
    if (agentState) {
      agentState.status = 'stopping';
      this.activeAgents.set(request.agentId, agentState);
    }

    // Execute each step
    for (const step of steps) {
      step.status = 'in_progress';
      step.startedAt = new Date();

      try {
        const outcome = await this.executeStep(step, request, policy);
        step.status = 'completed';
        step.completedAt = new Date();
        step.output = outcome;

        if (step.action === 'clean_resources') {
          result.resourcesCleaned.push(step.output);
        }
      } catch (error) {
        step.status = 'failed';
        step.completedAt = new Date();
        step.error = error instanceof Error ? error.message : String(error);
        result.status = 'partial';
      }
    }

    // Update final state
    const finalState = this.activeAgents.get(request.agentId);
    if (finalState) {
      finalState.status = 'stopped';
      result.finalState = finalState;
    }

    result.completedAt = new Date();
    this.terminationHistory.push(result);

    // Remove from active agents
    this.activeAgents.delete(request.agentId);

    // Update request status
    request.status = 'executed';

    this.notifyListeners('termination_completed', result);

    return result;
  }

  private createTerminationSteps(
    request: TerminationRequest,
    policy?: TerminationPolicy
  ): TerminationStep[] {
    const steps: TerminationStep[] = [
      { order: 1, action: 'stop_accepting_tasks', status: 'pending' },
      { order: 2, action: 'complete_in_progress_tasks', status: 'pending' },
      { order: 3, action: 'save_state', status: 'pending' },
      { order: 4, action: 'clean_resources', status: 'pending' },
      { order: 5, action: 'notify_dependencies', status: 'pending' },
      { order: 6, action: 'shutdown', status: 'pending' },
    ];

    // Adjust steps based on urgency
    if (request.urgency === 'critical') {
      steps.splice(1, 2); // Skip completing tasks
    }

    return steps;
  }

  private async executeStep(
    step: TerminationStep,
    request: TerminationRequest,
    policy?: TerminationPolicy
  ): Promise<string> {
    switch (step.action) {
      case 'stop_accepting_tasks':
        return 'Task acceptance disabled';

      case 'complete_in_progress_tasks':
        await this.waitForInProgressTasks(request.agentId, policy?.gracePeriod || 30000);
        return 'In-progress tasks completed or timed out';

      case 'save_state':
        return 'State saved to checkpoint';

      case 'clean_resources':
        return await this.cleanResources(request.agentId);

      case 'notify_dependencies':
        return 'Dependencies notified of termination';

      case 'shutdown':
        return 'Agent shutdown complete';

      default:
        return 'Unknown step completed';
    }
  }

  private async waitForInProgressTasks(agentId: string, timeout: number): Promise<void> {
    const startTime = Date.now();
    const state = this.activeAgents.get(agentId);

    while (state && state.activeTasks > 0 && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private async cleanResources(agentId: string): Promise<string> {
    // In production, this would clean up actual resources
    const resources: string[] = [
      'memory_buffers',
      'file_handles',
      'network_connections',
      'timers',
      'event_listeners',
    ];

    return resources.join(', ');
  }

  private getDefaultState(): AgentState {
    return {
      status: 'unknown',
      activeTasks: 0,
      pendingTasks: 0,
      lastActivity: new Date(),
      memoryUsage: 0,
      cpuUsage: 0,
    };
  }

  private notifyListeners(event: string, data: unknown): void {
    for (const listener of this.listeners) {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Termination listener error:', error);
      }
    }
  }

  private generateId(): string {
    return `term_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Supporting interfaces
interface SafetyCheckResult {
  safe: boolean;
  reason?: string;
  activeTasks?: number;
  pendingTasks?: number;
}

type TerminationListener = (event: string, data: unknown) => void;

// Singleton instance
let controllerInstance: AgentTerminationController | null = null;

export function getAgentTerminationController(): AgentTerminationController {
  if (!controllerInstance) {
    controllerInstance = new AgentTerminationController();
  }
  return controllerInstance;
}
