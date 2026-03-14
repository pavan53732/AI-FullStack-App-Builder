/**
 * Recovery Strategy Generator
 * 
 * Generates recovery strategies when errors, failures, or issues occur.
 * Mechanism #210 from the 520-mechanism checklist
 */

// ============================================================================
// Types
// ============================================================================

export interface RecoveryContext {
  id: string
  error: ErrorInfo
  state: SystemState
  history: ActionHistoryItem[]
  constraints: RecoveryConstraint[]
  createdAt: Date
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata: Record<string, unknown>
}

export interface ErrorInfo {
  type: ErrorType
  message: string
  stackTrace?: string
  code?: string
  timestamp: Date
  recoverable: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  context: Record<string, unknown>
}

export type ErrorType = 
  | 'runtime_error'
  | 'syntax_error'
  | 'logic_error'
  | 'resource_error'
  | 'timeout_error'
  | 'dependency_error'
  | 'validation_error'
  | 'network_error'
  | 'permission_error'
  | 'state_error'

export interface SystemState {
  currentStep: string
  completedSteps: string[]
  failedSteps: string[]
  pendingSteps: string[]
  resources: ResourceStatus
  context: Record<string, unknown>
  createdAt: Date
  lastUpdated: Date
}

export interface ResourceStatus {
  memory: number
  cpu: number
  disk: number
  network: boolean
  database: boolean
  external: boolean
}

export interface ActionHistoryItem {
  action: string
  timestamp: Date
  result: 'success' | 'failure' | 'partial'
  duration: number
  context: Record<string, unknown>
}

export interface RecoveryStrategy {
  id: string
  name: string
  description: string
  type: StrategyType
  steps: RecoveryStep[]
  estimatedTime: number
  successProbability: number
  requiredResources: string[]
  fallbackStrategies: string[]
  priority: number
  metadata: Record<string, unknown>
}

export type StrategyType = 
  | 'retry'
  | 'rollback'
  | 'skip'
  | 'alternative'
  | 'escalate'
  | 'restart'
  | 'reconfigure'
  | 'compensate'

export interface RecoveryStep {
  id: string
  action: string
  description: string
  preConditions: string[]
  postConditions: string[]
  rollbackAction?: string
  timeout: number
  retryCount: number
  dependencies: string[]
  critical: boolean
}

export interface RecoveryConstraint {
  type: 'time_limit' | 'resource_limit' | 'dependency' | 'policy'
  value: unknown
  description: string
  strict: boolean
}

export interface RecoveryResult {
  strategy: RecoveryStrategy
  success: boolean
  message: string
  stepsCompleted: string[]
  stepsFailed: string[]
  timeElapsed: number
  newState?: SystemState
  remainingIssues: string[]
}

export interface RecoveryStats {
  totalRecoveries: number
  successfulRecoveries: number
  failedRecoveries: number
  averageRecoveryTime: number
  byStrategy: Record<StrategyType, { attempts: number; successes: number }>
  commonErrors: { type: ErrorType; count: number }[]
  recoveryRate: number
}

// ============================================================================
// Recovery Strategy Generator Class
// ============================================================================

export class RecoveryStrategyGenerator {
  private strategyTemplates: Map<ErrorType, RecoveryStrategy[]> = new Map()
  private recoveryHistory: Map<string, RecoveryResult> = new Map()
  private stats: RecoveryStats
  private recoveryTimes: number[] = []
  private errorCounts: Map<ErrorType, number> = new Map()
  private customStrategies: Map<string, RecoveryStrategy> = new Map()

  constructor() {
    this.stats = this.initStats()
    this.initializeDefaultStrategies()
  }

  private initStats(): RecoveryStats {
    return {
      totalRecoveries: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0,
      averageRecoveryTime: 0,
      byStrategy: {} as Record<StrategyType, { attempts: number; successes: number }>,
      commonErrors: [],
      recoveryRate: 0
    }
  }

  generate(context: RecoveryContext): RecoveryStrategy {
    const strategies = this.findApplicableStrategies(context)
    const sorted = strategies.sort((a, b) => {
      const scoreA = a.priority * 0.5 + a.successProbability * 0.5
      const scoreB = b.priority * 0.5 + b.successProbability * 0.5
      return scoreB - scoreA
    })
    return this.customizeStrategy(sorted[0] || this.getDefaultStrategy(), context)
  }

  generateOptions(context: RecoveryContext, count: number = 3): RecoveryStrategy[] {
    const strategies = this.findApplicableStrategies(context)
    const sorted = strategies.sort((a, b) => {
      const scoreA = a.priority * 0.4 + a.successProbability * 0.4 + (100 - a.estimatedTime) * 0.2
      const scoreB = b.priority * 0.4 + b.successProbability * 0.4 + (100 - b.estimatedTime) * 0.2
      return scoreB - scoreA
    })
    return sorted.slice(0, count).map(s => this.customizeStrategy(s, context))
  }

  async execute(
    strategy: RecoveryStrategy,
    context: RecoveryContext,
    executor: (step: RecoveryStep) => Promise<boolean>
  ): Promise<RecoveryResult> {
    const startTime = Date.now()
    const stepsCompleted: string[] = []
    const stepsFailed: string[] = []
    const remainingIssues: string[] = []

    this.stats.totalRecoveries++
    this.recordErrorType(context.error.type)

    for (const step of strategy.steps) {
      try {
        const success = await this.executeWithRetry(step, executor)
        if (success) {
          stepsCompleted.push(step.id)
        } else {
          stepsFailed.push(step.id)
          if (step.critical) break
        }
      } catch (error) {
        stepsFailed.push(step.id)
        remainingIssues.push(`Step ${step.action} failed: ${error}`)
        if (step.critical) break
      }
    }

    const timeElapsed = Date.now() - startTime
    const success = stepsFailed.length === 0

    this.recoveryTimes.push(timeElapsed)
    this.stats.averageRecoveryTime = 
      this.recoveryTimes.reduce((a, b) => a + b, 0) / this.recoveryTimes.length

    if (success) this.stats.successfulRecoveries++
    else this.stats.failedRecoveries++

    this.updateStrategyStats(strategy.type, success)
    this.stats.recoveryRate = this.stats.totalRecoveries > 0
      ? this.stats.successfulRecoveries / this.stats.totalRecoveries
      : 0

    const result: RecoveryResult = {
      strategy,
      success,
      message: success 
        ? `Recovery completed in ${timeElapsed}ms`
        : `Recovery failed. ${stepsFailed.length} steps failed.`,
      stepsCompleted,
      stepsFailed,
      timeElapsed,
      remainingIssues
    }

    this.recoveryHistory.set(context.id, result)
    return result
  }

  private async executeWithRetry(
    step: RecoveryStep,
    executor: (step: RecoveryStep) => Promise<boolean>
  ): Promise<boolean> {
    let attempts = 0
    const maxAttempts = step.retryCount + 1

    while (attempts < maxAttempts) {
      try {
        const result = await Promise.race([
          executor(step),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), step.timeout)
          )
        ])
        if (result) return true
      } catch {
        // Continue to retry
      }
      attempts++
    }
    return false
  }

  private findApplicableStrategies(context: RecoveryContext): RecoveryStrategy[] {
    const strategies: RecoveryStrategy[] = []
    const errorType = context.error.type

    const typeSpecific = this.strategyTemplates.get(errorType) || []
    strategies.push(...typeSpecific)

    const general = this.strategyTemplates.get('runtime_error') || []
    strategies.push(...general.filter(s => !strategies.find(st => st.id === s.id)))

    for (const [, strategy] of this.customStrategies) {
      if (this.isApplicable(strategy, context)) {
        strategies.push(strategy)
      }
    }

    return strategies.filter(s => this.meetsConstraints(s, context))
  }

  private isApplicable(strategy: RecoveryStrategy, context: RecoveryContext): boolean {
    for (const resource of strategy.requiredResources) {
      if (!this.hasResource(resource, context)) return false
    }
    return true
  }

  private meetsConstraints(strategy: RecoveryStrategy, context: RecoveryContext): boolean {
    for (const constraint of context.constraints) {
      if (constraint.type === 'time_limit') {
        if (strategy.estimatedTime > (constraint.value as number) && constraint.strict) {
          return false
        }
      }
    }
    return true
  }

  private customizeStrategy(strategy: RecoveryStrategy, context: RecoveryContext): RecoveryStrategy {
    const customized: RecoveryStrategy = {
      ...strategy,
      id: `${strategy.id}_${context.id}`,
      steps: strategy.steps.map(step => ({
        ...step,
        id: `${step.id}_${context.id}`
      }))
    }

    if (context.error.severity === 'critical') {
      customized.priority = Math.min(customized.priority + 2, 10)
    } else if (context.error.severity === 'high') {
      customized.priority = Math.min(customized.priority + 1, 10)
    }

    return customized
  }

  private hasResource(resource: string, context: RecoveryContext): boolean {
    switch (resource) {
      case 'network': return context.state.resources.network
      case 'database': return context.state.resources.database
      case 'disk': return context.state.resources.disk > 10
      case 'memory': return context.state.resources.memory > 100
      default: return true
    }
  }

  private getDefaultStrategy(): RecoveryStrategy {
    return {
      id: 'default_retry',
      name: 'Default Retry',
      description: 'Retry the failed operation',
      type: 'retry',
      steps: [{
        id: 'retry_step',
        action: 'retry',
        description: 'Retry the operation',
        preConditions: [],
        postConditions: ['operation.success'],
        timeout: 5000,
        retryCount: 2,
        dependencies: [],
        critical: true
      }],
      estimatedTime: 5000,
      successProbability: 0.5,
      requiredResources: [],
      fallbackStrategies: [],
      priority: 5,
      metadata: {}
    }
  }

  private recordErrorType(type: ErrorType): void {
    const count = this.errorCounts.get(type) || 0
    this.errorCounts.set(type, count + 1)
    this.updateCommonErrors()
  }

  private updateCommonErrors(): void {
    this.stats.commonErrors = Array.from(this.errorCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  private updateStrategyStats(type: StrategyType, success: boolean): void {
    if (!this.stats.byStrategy[type]) {
      this.stats.byStrategy[type] = { attempts: 0, successes: 0 }
    }
    this.stats.byStrategy[type].attempts++
    if (success) this.stats.byStrategy[type].successes++
  }

  private initializeDefaultStrategies(): void {
    this.strategyTemplates.set('runtime_error', [
      {
        id: 'retry_immediate',
        name: 'Immediate Retry',
        description: 'Retry the failed operation immediately',
        type: 'retry',
        steps: [{
          id: 'retry_step',
          action: 'retry',
          description: 'Retry the failed operation',
          preConditions: [],
          postConditions: ['operation.success'],
          timeout: 5000,
          retryCount: 2,
          dependencies: [],
          critical: true
        }],
        estimatedTime: 5000,
        successProbability: 0.7,
        requiredResources: [],
        fallbackStrategies: ['retry_delayed'],
        priority: 8,
        metadata: {}
      }
    ])

    this.strategyTemplates.set('network_error', [
      {
        id: 'reconnect',
        name: 'Reconnect and Retry',
        description: 'Reestablish connection and retry',
        type: 'retry',
        steps: [
          {
            id: 'disconnect',
            action: 'disconnect',
            description: 'Close existing connection',
            preConditions: [],
            postConditions: ['connection.closed'],
            timeout: 3000,
            retryCount: 0,
            dependencies: [],
            critical: false
          },
          {
            id: 'reconnect',
            action: 'connect',
            description: 'Establish new connection',
            preConditions: ['connection.closed'],
            postConditions: ['connection.established'],
            timeout: 10000,
            retryCount: 3,
            dependencies: ['disconnect'],
            critical: true
          }
        ],
        estimatedTime: 13000,
        successProbability: 0.85,
        requiredResources: ['network'],
        fallbackStrategies: ['skip_operation'],
        priority: 8,
        metadata: {}
      }
    ])

    this.strategyTemplates.set('timeout_error', [
      {
        id: 'extend_timeout',
        name: 'Extend Timeout',
        description: 'Increase timeout and retry',
        type: 'reconfigure',
        steps: [{
          id: 'adjust_timeout',
          action: 'set_timeout',
          description: 'Increase timeout value',
          preConditions: [],
          postConditions: ['timeout.increased'],
          timeout: 1000,
          retryCount: 0,
          dependencies: [],
          critical: true
        }],
        estimatedTime: 1000,
        successProbability: 0.75,
        requiredResources: [],
        fallbackStrategies: ['alternative_path'],
        priority: 7,
        metadata: {}
      }
    ])
  }

  addCustomStrategy(errorType: ErrorType, strategy: RecoveryStrategy): void {
    const existing = this.strategyTemplates.get(errorType) || []
    existing.push(strategy)
    this.strategyTemplates.set(errorType, existing)
  }

  getResult(contextId: string): RecoveryResult | undefined {
    return this.recoveryHistory.get(contextId)
  }

  getStats(): RecoveryStats { return { ...this.stats } }

  clear(): void {
    this.recoveryHistory.clear()
    this.recoveryTimes = []
    this.errorCounts.clear()
    this.customStrategies.clear()
    this.stats = this.initStats()
  }
}

let generatorInstance: RecoveryStrategyGenerator | null = null

export function getRecoveryStrategyGenerator(): RecoveryStrategyGenerator {
  if (!generatorInstance) generatorInstance = new RecoveryStrategyGenerator()
  return generatorInstance
}

export function generateRecoveryStrategy(context: RecoveryContext): RecoveryStrategy {
  return getRecoveryStrategyGenerator().generate(context)
}

export function generateRecoveryOptions(context: RecoveryContext, count?: number): RecoveryStrategy[] {
  return getRecoveryStrategyGenerator().generateOptions(context, count)
}

export async function executeRecoveryStrategy(
  strategy: RecoveryStrategy,
  context: RecoveryContext,
  executor: (step: RecoveryStep) => Promise<boolean>
): Promise<RecoveryResult> {
  return getRecoveryStrategyGenerator().execute(strategy, context, executor)
}

export function createRecoveryContext(
  error: ErrorInfo,
  state: SystemState,
  history: ActionHistoryItem[],
  constraints: RecoveryConstraint[],
  priority?: 'low' | 'medium' | 'high' | 'critical'
): RecoveryContext {
  return {
    id: `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    error,
    state,
    history,
    constraints,
    createdAt: new Date(),
    priority: priority || 'medium',
    metadata: {}
  }
}

export function getRecoveryStats(): RecoveryStats {
  return getRecoveryStrategyGenerator().getStats()
}
