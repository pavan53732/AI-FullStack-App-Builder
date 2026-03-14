/**
 * Swarm Coordinator
 * 
 * Coordinates multiple agents working in parallel:
 * - Task distribution across agent swarms
 * - Parallel execution management
 * - Result aggregation
 * - Consensus building
 * - Conflict resolution
 * 
 * Features:
 * - Divide work across agent swarms
 * - Parallel execution with dependency handling
 * - Result merging and conflict resolution
 * - Progress tracking
 * - Fault tolerance with retries
 */

import ZAI from 'z-ai-web-dev-sdk'
import { EventEmitter } from 'events'

// Types
export interface SwarmTask {
  id: string
  type: SwarmTaskType
  description: string
  input: any
  priority: number
  dependencies: string[]
  assignedAgents: string[]
  status: SwarmTaskStatus
  result?: SwarmTaskResult
  retryCount: number
  maxRetries: number
  createdAt: string
  startedAt?: string
  completedAt?: string
}

export type SwarmTaskType = 
  | 'code_generation'
  | 'code_review'
  | 'test_generation'
  | 'debugging'
  | 'documentation'
  | 'analysis'
  | 'research'
  | 'validation'
  | 'optimization'

export type SwarmTaskStatus = 
  | 'pending'
  | 'ready'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface SwarmTaskResult {
  taskId: string
  agentId: string
  output: any
  confidence: number
  issues?: string[]
  suggestions?: string[]
  executionTime: number
}

export interface SwarmConfig {
  id: string
  name: string
  agentCount: number
  agentTypes: AgentType[]
  strategy: SwarmStrategy
  consensusThreshold: number
  maxParallelTasks: number
  timeout: number
  retryPolicy: RetryPolicy
}

export type AgentType = 
  | 'coder'
  | 'reviewer'
  | 'tester'
  | 'debugger'
  | 'analyst'
  | 'researcher'

export type SwarmStrategy = 
  | 'divide_and_conquer'  // Split work into chunks
  | 'redundant'           // Multiple agents on same task
  | 'specialized'         // Route to specialized agents
  | 'competitive'         // Best result wins
  | 'collaborative'       // Agents collaborate

export interface RetryPolicy {
  maxRetries: number
  backoffMultiplier: number
  initialDelay: number
}

export interface SwarmResult {
  swarmId: string
  success: boolean
  totalTasks: number
  completedTasks: number
  failedTasks: number
  results: SwarmTaskResult[]
  aggregatedResult: any
  consensusReached: boolean
  executionTime: number
  agentUtilization: Map<string, number>
}

export interface SwarmProgress {
  swarmId: string
  phase: SwarmPhase
  currentTask: number
  totalTasks: number
  activeAgents: number
  message: string
}

export type SwarmPhase = 
  | 'initialization'
  | 'task_distribution'
  | 'execution'
  | 'aggregation'
  | 'consensus'
  | 'completion'

export interface AgentWorkload {
  agentId: string
  agentType: AgentType
  currentTasks: number
  completedTasks: number
  averageExecutionTime: number
  reliability: number
}

/**
 * Swarm Coordinator
 * 
 * Main class for coordinating agent swarms
 */
export class SwarmCoordinator extends EventEmitter {
  private zai: any = null
  private swarms: Map<string, SwarmConfig> = new Map()
  private tasks: Map<string, SwarmTask> = new Map()
  private agentWorkloads: Map<string, AgentWorkload> = new Map()
  private taskQueue: SwarmTask[] = []
  private runningTasks: Map<string, Promise<SwarmTaskResult>> = new Map()
  
  private maxConcurrentTasks: number = 10
  private defaultTimeout: number = 120000 // 2 minutes

  constructor(options?: { maxConcurrentTasks?: number; defaultTimeout?: number }) {
    super()
    this.maxConcurrentTasks = options?.maxConcurrentTasks || 10
    this.defaultTimeout = options?.defaultTimeout || 120000
  }

  /**
   * Initialize the coordinator
   */
  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
  }

  /**
   * Create and execute a swarm
   */
  async executeSwarm(
    tasks: Omit<SwarmTask, 'id' | 'status' | 'retryCount' | 'createdAt'>[],
    config: Partial<SwarmConfig> & { name: string }
  ): Promise<SwarmResult> {
    const startTime = Date.now()
    const swarmId = `swarm-${Date.now().toString(36)}`
    
    // Create swarm config
    const swarmConfig: SwarmConfig = {
      id: swarmId,
      name: config.name,
      agentCount: config.agentCount || 4,
      agentTypes: config.agentTypes || ['coder', 'reviewer', 'tester'],
      strategy: config.strategy || 'divide_and_conquer',
      consensusThreshold: config.consensusThreshold || 0.7,
      maxParallelTasks: config.maxParallelTasks || 5,
      timeout: config.timeout || this.defaultTimeout,
      retryPolicy: config.retryPolicy || { maxRetries: 2, backoffMultiplier: 2, initialDelay: 1000 }
    }
    
    this.swarms.set(swarmId, swarmConfig)
    
    this.emit('swarm_started', { swarmId, config: swarmConfig })

    // Phase 1: Initialization
    this.emit('progress', { swarmId, phase: 'initialization', currentTask: 0, totalTasks: tasks.length, activeAgents: 0, message: 'Initializing swarm...' })
    
    // Create task objects
    const swarmTasks: SwarmTask[] = tasks.map((t, i) => ({
      ...t,
      id: `${swarmId}-task-${i}`,
      status: 'pending' as SwarmTaskStatus,
      retryCount: 0,
      maxRetries: swarmConfig.retryPolicy.maxRetries,
      createdAt: new Date().toISOString()
    }))
    
    for (const task of swarmTasks) {
      this.tasks.set(task.id, task)
    }

    // Phase 2: Task Distribution
    this.emit('progress', { swarmId, phase: 'task_distribution', currentTask: 0, totalTasks: tasks.length, activeAgents: 0, message: 'Distributing tasks...' })
    
    const distribution = await this.distributeTasks(swarmTasks, swarmConfig)

    // Phase 3: Execution
    this.emit('progress', { swarmId, phase: 'execution', currentTask: 0, totalTasks: tasks.length, activeAgents: 0, message: 'Executing tasks...' })
    
    const results = await this.executeTasks(swarmTasks, swarmConfig)

    // Phase 4: Aggregation
    this.emit('progress', { swarmId, phase: 'aggregation', currentTask: tasks.length, totalTasks: tasks.length, activeAgents: 0, message: 'Aggregating results...' })
    
    const aggregatedResult = await this.aggregateResults(results, swarmConfig)

    // Phase 5: Consensus
    this.emit('progress', { swarmId, phase: 'consensus', currentTask: tasks.length, totalTasks: tasks.length, activeAgents: 0, message: 'Building consensus...' })
    
    const consensusReached = this.checkConsensus(results, swarmConfig.consensusThreshold)

    // Phase 6: Completion
    this.emit('progress', { swarmId, phase: 'completion', currentTask: tasks.length, totalTasks: tasks.length, activeAgents: 0, message: 'Swarm complete!' })

    const result: SwarmResult = {
      swarmId,
      success: results.filter(r => r).length > 0,
      totalTasks: tasks.length,
      completedTasks: results.filter(r => r).length,
      failedTasks: results.filter(r => !r).length,
      results: results.filter((r): r is SwarmTaskResult => r !== null),
      aggregatedResult,
      consensusReached,
      executionTime: Date.now() - startTime,
      agentUtilization: this.calculateAgentUtilization(swarmTasks)
    }

    this.emit('swarm_completed', { swarmId, result })
    
    // Cleanup
    this.swarms.delete(swarmId)
    for (const task of swarmTasks) {
      this.tasks.delete(task.id)
    }

    return result
  }

  /**
   * Distribute tasks to agents
   */
  private async distributeTasks(
    tasks: SwarmTask[],
    config: SwarmConfig
  ): Promise<Map<string, string[]>> {
    const distribution = new Map<string, string[]>()
    
    switch (config.strategy) {
      case 'divide_and_conquer':
        // Split tasks evenly among agents
        const chunks = this.chunkArray(tasks, config.agentCount)
        chunks.forEach((chunk, i) => {
          const agentId = `agent-${config.id}-${i}`
          distribution.set(agentId, chunk.map(t => t.id))
          this.agentWorkloads.set(agentId, {
            agentId,
            agentType: this.inferAgentType(chunk[0]?.type),
            currentTasks: chunk.length,
            completedTasks: 0,
            averageExecutionTime: 0,
            reliability: 1
          })
        })
        break

      case 'redundant':
        // Assign each task to multiple agents
        tasks.forEach(task => {
          for (let i = 0; i < config.agentCount; i++) {
            const agentId = `agent-${config.id}-${i}`
            if (!distribution.has(agentId)) {
              distribution.set(agentId, [])
            }
            distribution.get(agentId)!.push(task.id)
          }
        })
        break

      case 'specialized':
        // Route to specialized agents
        tasks.forEach(task => {
          const agentType = this.inferAgentType(task.type)
          const agentId = `agent-${config.id}-${agentType}`
          if (!distribution.has(agentId)) {
            distribution.set(agentId, [])
            this.agentWorkloads.set(agentId, {
              agentId,
              agentType,
              currentTasks: 0,
              completedTasks: 0,
              averageExecutionTime: 0,
              reliability: 1
            })
          }
          distribution.get(agentId)!.push(task.id)
          const workload = this.agentWorkloads.get(agentId)!
          workload.currentTasks++
        })
        break

      case 'competitive':
        // All agents compete on all tasks
        for (let i = 0; i < config.agentCount; i++) {
          const agentId = `agent-${config.id}-${i}`
          distribution.set(agentId, tasks.map(t => t.id))
        }
        break

      case 'collaborative':
        // Tasks with dependencies go to same agent
        const groups = this.groupByDependencies(tasks)
        groups.forEach((group, i) => {
          const agentId = `agent-${config.id}-${i % config.agentCount}`
          if (!distribution.has(agentId)) {
            distribution.set(agentId, [])
          }
          distribution.get(agentId)!.push(...group.map(t => t.id))
        })
        break
    }

    // Update task assignments
    for (const [agentId, taskIds] of distribution) {
      for (const taskId of taskIds) {
        const task = this.tasks.get(taskId)
        if (task) {
          task.assignedAgents.push(agentId)
        }
      }
    }

    return distribution
  }

  /**
   * Execute tasks in parallel
   */
  private async executeTasks(
    tasks: SwarmTask[],
    config: SwarmConfig
  ): Promise<(SwarmTaskResult | null)[]> {
    const results: (SwarmTaskResult | null)[] = new Array(tasks.length).fill(null)
    
    // Build dependency graph
    const ready = tasks.filter(t => t.dependencies.length === 0)
    const waiting = new Set(tasks.filter(t => t.dependencies.length > 0).map(t => t.id))
    const completed = new Set<string>()

    // Execute in waves
    const executing: Promise<void>[] = []
    
    while (ready.length > 0 || waiting.size > 0) {
      // Start tasks up to concurrency limit
      while (ready.length > 0 && executing.length < config.maxParallelTasks) {
        const task = ready.shift()!
        
        const promise = this.executeTask(task, config)
          .then(result => {
            const index = tasks.findIndex(t => t.id === task.id)
            results[index] = result
            completed.add(task.id)
            
            // Check for newly ready tasks
            for (const waitingTaskId of waiting) {
              const waitingTask = this.tasks.get(waitingTaskId)
              if (waitingTask && waitingTask.dependencies.every(d => completed.has(d))) {
                waiting.delete(waitingTaskId)
                ready.push(waitingTask)
              }
            }
          })
          .catch(error => {
            const index = tasks.findIndex(t => t.id === task.id)
            const task = this.tasks.get(tasks[index].id)
            if (task && task.retryCount < task.maxRetries) {
              task.retryCount++
              ready.push(task) // Retry
            }
          })
        
        executing.push(promise)
      }

      // Wait for at least one task to complete
      if (executing.length > 0) {
        await Promise.race(executing.map(p => p.then(() => ({ done: true }))))
        
        // Remove completed promises
        for (let i = executing.length - 1; i >= 0; i--) {
          // Check if promise is settled by trying to await with race
        }
      }
    }

    // Wait for all remaining
    await Promise.all(executing)

    return results
  }

  /**
   * Execute a single task
   */
  private async executeTask(
    task: SwarmTask,
    config: SwarmConfig
  ): Promise<SwarmTaskResult> {
    const startTime = Date.now()
    task.status = 'running'
    task.startedAt = new Date().toISOString()

    this.emit('task_started', { taskId: task.id, type: task.type })

    try {
      // Simulate task execution (would call actual agent in production)
      const output = await this.simulateTaskExecution(task, config)
      
      task.status = 'completed'
      task.completedAt = new Date().toISOString()
      task.result = output

      this.emit('task_completed', { taskId: task.id, result: output })

      return output
    } catch (error: any) {
      task.status = 'failed'
      
      this.emit('task_failed', { taskId: task.id, error: error.message })
      
      throw error
    }
  }

  /**
   * Simulate task execution
   */
  private async simulateTaskExecution(
    task: SwarmTask,
    config: SwarmConfig
  ): Promise<SwarmTaskResult> {
    // In production, would call actual agent
    const executionTime = 1000 + Math.random() * 2000
    
    await new Promise(r => setTimeout(r, executionTime / 10))
    
    return {
      taskId: task.id,
      agentId: task.assignedAgents[0] || 'unknown',
      output: { completed: true, data: task.input },
      confidence: 0.7 + Math.random() * 0.3,
      executionTime
    }
  }

  /**
   * Aggregate results from multiple agents
   */
  private async aggregateResults(
    results: (SwarmTaskResult | null)[],
    config: SwarmConfig
  ): Promise<any> {
    const validResults = results.filter((r): r is SwarmTaskResult => r !== null)
    
    if (validResults.length === 0) {
      return null
    }

    // Group by task
    const byTask = new Map<string, SwarmTaskResult[]>()
    for (const result of validResults) {
      if (!byTask.has(result.taskId)) {
        byTask.set(result.taskId, [])
      }
      byTask.get(result.taskId)!.push(result)
    }

    // Aggregate each task's results
    const aggregated: Record<string, any> = {}
    
    for (const [taskId, taskResults] of byTask) {
      if (config.strategy === 'competitive') {
        // Take best result
        aggregated[taskId] = taskResults.reduce((best, r) => 
          r.confidence > best.confidence ? r : best
        ).output
      } else if (config.strategy === 'redundant') {
        // Merge results with voting
        aggregated[taskId] = this.voteOnResults(taskResults)
      } else {
        // Take first result
        aggregated[taskId] = taskResults[0].output
      }
    }

    return aggregated
  }

  /**
   * Vote on results from multiple agents
   */
  private voteOnResults(results: SwarmTaskResult[]): any {
    // Simple confidence-weighted voting
    const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0)
    
    return {
      voted: true,
      confidence: totalConfidence / results.length,
      contributorCount: results.length
    }
  }

  /**
   * Check if consensus is reached
   */
  private checkConsensus(
    results: (SwarmTaskResult | null)[],
    threshold: number
  ): boolean {
    const validResults = results.filter((r): r is SwarmTaskResult => r !== null)
    
    if (validResults.length < 2) return true
    
    const avgConfidence = validResults.reduce((sum, r) => sum + r.confidence, 0) / validResults.length
    
    return avgConfidence >= threshold
  }

  /**
   * Calculate agent utilization
   */
  private calculateAgentUtilization(tasks: SwarmTask[]): Map<string, number> {
    const utilization = new Map<string, number>()
    
    for (const task of tasks) {
      for (const agentId of task.assignedAgents) {
        utilization.set(agentId, (utilization.get(agentId) || 0) + 1)
      }
    }
    
    return utilization
  }

  /**
   * Infer agent type from task type
   */
  private inferAgentType(taskType: SwarmTaskType): AgentType {
    const mapping: Record<SwarmTaskType, AgentType> = {
      code_generation: 'coder',
      code_review: 'reviewer',
      test_generation: 'tester',
      debugging: 'debugger',
      documentation: 'researcher',
      analysis: 'analyst',
      research: 'researcher',
      validation: 'reviewer',
      optimization: 'coder'
    }
    
    return mapping[taskType] || 'coder'
  }

  /**
   * Chunk array into n pieces
   */
  private chunkArray<T>(array: T[], chunks: number): T[][] {
    const result: T[][] = []
    const chunkSize = Math.ceil(array.length / chunks)
    
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize))
    }
    
    return result
  }

  /**
   * Group tasks by dependencies
   */
  private groupByDependencies(tasks: SwarmTask[]): SwarmTask[][] {
    const groups: SwarmTask[][] = []
    const assigned = new Set<string>()
    
    // Build dependency graph
    const taskMap = new Map(tasks.map(t => [t.id, t]))
    
    // Topological sort
    while (assigned.size < tasks.length) {
      const group: SwarmTask[] = []
      
      for (const task of tasks) {
        if (!assigned.has(task.id) && task.dependencies.every(d => assigned.has(d))) {
          group.push(task)
        }
      }
      
      if (group.length === 0) break // Circular dependency
      
      for (const task of group) {
        assigned.add(task.id)
      }
      
      groups.push(group)
    }
    
    return groups
  }

  /**
   * Get current workload
   */
  getWorkload(): Map<string, AgentWorkload> {
    return new Map(this.agentWorkloads)
  }

  /**
   * Get active swarms
   */
  getActiveSwarms(): SwarmConfig[] {
    return Array.from(this.swarms.values())
  }
}

// Singleton instance
let coordinatorInstance: SwarmCoordinator | null = null

export function getSwarmCoordinator(): SwarmCoordinator {
  if (!coordinatorInstance) {
    coordinatorInstance = new SwarmCoordinator()
  }
  return coordinatorInstance
}

export async function executeSwarm(
  tasks: Omit<SwarmTask, 'id' | 'status' | 'retryCount' | 'createdAt'>[],
  config: Partial<SwarmConfig> & { name: string }
): Promise<SwarmResult> {
  const coordinator = getSwarmCoordinator()
  if (!coordinator['zai']) {
    await coordinator.initialize()
  }
  return coordinator.executeSwarm(tasks, config)
}
