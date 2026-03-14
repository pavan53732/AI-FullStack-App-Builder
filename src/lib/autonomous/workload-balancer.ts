/**
 * Workload Balancer for Multi-Agent System
 * 
 * Provides:
 * - Agent load distribution
 * - Task queue management
 * - Parallel task orchestration
 * - Agent performance tracking
 * - Dynamic rebalancing
 */

import { EventEmitter } from 'events'
import type { AgentId } from './agent-message-bus'

// Types
export interface AgentLoad {
  agentId: AgentId
  currentTasks: number
  maxCapacity: number
  loadPercentage: number
  avgTaskDuration: number
  successRate: number
  specialties: string[]
  currentPriority: 'idle' | 'low' | 'medium' | 'high' | 'overloaded'
}

export interface TaskAssignment {
  taskId: string
  agentId: AgentId
  priority: 'critical' | 'high' | 'medium' | 'low'
  estimatedDuration: number
  requiredCapabilities: string[]
  assignedAt: string
  deadline?: string
}

export interface BalancingStrategy {
  name: string
  description: string
  selectAgent: (agents: AgentLoad[], task: TaskInfo) => AgentId | null
}

export interface TaskInfo {
  id: string
  type: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  estimatedDuration: number
  requiredCapabilities: string[]
  dependencies: string[]
}

export interface BalancerMetrics {
  totalTasksAssigned: number
  totalTasksCompleted: number
  avgAssignmentTime: number
  rebalancingCount: number
  agentUtilization: Record<AgentId, number>
  queueWaitTimes: number[]
}

// Default agent capacities
const AGENT_CAPACITIES: Record<AgentId, { maxCapacity: number; specialties: string[] }> = {
  orchestrator: { maxCapacity: 10, specialties: ['coordination', 'planning', 'delegation'] },
  planner: { maxCapacity: 3, specialties: ['planning', 'task-decomposition', 'architecture'] },
  coder: { maxCapacity: 5, specialties: ['code-generation', 'implementation', 'refactoring'] },
  debugger: { maxCapacity: 4, specialties: ['debugging', 'error-analysis', 'fixing'] },
  reviewer: { maxCapacity: 4, specialties: ['code-review', 'quality-check', 'best-practices'] },
  tester: { maxCapacity: 4, specialties: ['test-generation', 'test-execution', 'coverage'] },
  architect: { maxCapacity: 3, specialties: ['architecture', 'design-patterns', 'scalability'] },
  deployer: { maxCapacity: 2, specialties: ['deployment', 'infrastructure', 'monitoring'] }
}

// Balancing Strategies
const STRATEGIES: Record<string, BalancingStrategy> = {
  leastLoaded: {
    name: 'Least Loaded',
    description: 'Assign to agent with lowest current load',
    selectAgent: (agents, task) => {
      const capable = agents.filter(a => 
        a.loadPercentage < 100 && 
        task.requiredCapabilities.some(cap => a.specialties.includes(cap))
      )
      if (capable.length === 0) return null
      return capable.sort((a, b) => a.loadPercentage - b.loadPercentage)[0].agentId
    }
  },
  
  specialtyMatch: {
    name: 'Best Specialty Match',
    description: 'Assign to agent with best matching specialty',
    selectAgent: (agents, task) => {
      const capable = agents.filter(a => a.loadPercentage < 100)
      if (capable.length === 0) return null
      
      // Score by specialty match
      const scored = capable.map(a => {
        const matchCount = task.requiredCapabilities.filter(cap => 
          a.specialties.includes(cap)
        ).length
        return { agent: a, score: matchCount * 10 - a.loadPercentage }
      })
      
      return scored.sort((a, b) => b.score - a.score)[0].agent.agentId
    }
  },
  
  fastestAgent: {
    name: 'Fastest Agent',
    description: 'Assign to agent with best performance history',
    selectAgent: (agents, task) => {
      const capable = agents.filter(a => 
        a.loadPercentage < 100 && 
        a.successRate > 0.5
      )
      if (capable.length === 0) return null
      
      return capable.sort((a, b) => 
        (b.successRate / (b.avgTaskDuration + 1)) - 
        (a.successRate / (a.avgTaskDuration + 1))
      )[0].agentId
    }
  },
  
  priorityBased: {
    name: 'Priority Based',
    description: 'Assign critical/high priority tasks to best agents',
    selectAgent: (agents, task) => {
      const capable = agents.filter(a => a.loadPercentage < 100)
      if (capable.length === 0) return null
      
      if (task.priority === 'critical' || task.priority === 'high') {
        // Use best performing agent for high priority
        return capable.sort((a, b) => b.successRate - a.successRate)[0].agentId
      }
      
      // Use least loaded for lower priority
      return capable.sort((a, b) => a.loadPercentage - b.loadPercentage)[0].agentId
    }
  },
  
  roundRobin: {
    name: 'Round Robin',
    description: 'Distribute tasks evenly in rotation',
    selectAgent: (agents, task) => {
      const capable = agents.filter(a => a.loadPercentage < 100)
      if (capable.length === 0) return null
      
      // State tracked externally via lastAssignedIndex
      return capable[0].agentId
    }
  }
}

/**
 * Workload Balancer
 */
export class WorkloadBalancer extends EventEmitter {
  private agentLoads: Map<AgentId, AgentLoad> = new Map()
  private taskQueue: TaskInfo[] = []
  private assignments: Map<string, TaskAssignment> = new Map()
  private completedTasks: Map<string, { agentId: AgentId; duration: number; success: boolean }> = new Map()
  private strategy: BalancingStrategy
  private lastAssignedIndex = 0
  private metrics: BalancerMetrics
  private rebalanceInterval: NodeJS.Timeout | null = null

  constructor(strategyName: string = 'specialtyMatch') {
    super()
    this.strategy = STRATEGIES[strategyName] || STRATEGIES.specialtyMatch
    this.metrics = this.initMetrics()
    this.initializeAgents()
  }

  /**
   * Initialize agent load tracking
   */
  private initializeAgents(): void {
    for (const [agentId, config] of Object.entries(AGENT_CAPACITIES)) {
      this.agentLoads.set(agentId as AgentId, {
        agentId: agentId as AgentId,
        currentTasks: 0,
        maxCapacity: config.maxCapacity,
        loadPercentage: 0,
        avgTaskDuration: 5,
        successRate: 0.95,
        specialties: config.specialties,
        currentPriority: 'idle'
      })
    }
  }

  /**
   * Initialize metrics
   */
  private initMetrics(): BalancerMetrics {
    return {
      totalTasksAssigned: 0,
      totalTasksCompleted: 0,
      avgAssignmentTime: 0,
      rebalancingCount: 0,
      agentUtilization: {} as Record<AgentId, number>,
      queueWaitTimes: []
    }
  }

  /**
   * Add task to queue
   */
  enqueueTask(task: TaskInfo): number {
    // Insert based on priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    const insertIndex = this.taskQueue.findIndex(t => 
      priorityOrder[t.priority] > priorityOrder[task.priority]
    )
    
    if (insertIndex === -1) {
      this.taskQueue.push(task)
    } else {
      this.taskQueue.splice(insertIndex, 0, task)
    }

    this.emit('task:queued', { task, queueLength: this.taskQueue.length })
    
    // Try to assign immediately
    this.processQueue()
    
    return this.taskQueue.length
  }

  /**
   * Process the task queue
   */
  private processQueue(): void {
    const assigned: string[] = []

    for (const task of this.taskQueue) {
      // Check if dependencies are met
      const depsMet = task.dependencies.every(dep => 
        this.completedTasks.has(dep) || !this.taskQueue.find(t => t.id === dep)
      )
      
      if (!depsMet) continue

      const agentId = this.assignTask(task)
      if (agentId) {
        assigned.push(task.id)
      }
    }

    // Remove assigned tasks from queue
    this.taskQueue = this.taskQueue.filter(t => !assigned.includes(t.id))
  }

  /**
   * Assign task to best agent
   */
  assignTask(task: TaskInfo): AgentId | null {
    const agents = Array.from(this.agentLoads.values())
    const agentId = this.strategy.selectAgent(agents, task)

    if (!agentId) {
      this.emit('task:unassigned', { task, reason: 'No available agent' })
      return null
    }

    // Create assignment
    const assignment: TaskAssignment = {
      taskId: task.id,
      agentId,
      priority: task.priority,
      estimatedDuration: task.estimatedDuration,
      requiredCapabilities: task.requiredCapabilities,
      assignedAt: new Date().toISOString()
    }

    this.assignments.set(task.id, assignment)

    // Update agent load
    const agentLoad = this.agentLoads.get(agentId)!
    agentLoad.currentTasks++
    agentLoad.loadPercentage = (agentLoad.currentTasks / agentLoad.maxCapacity) * 100
    agentLoad.currentPriority = this.calculatePriority(agentLoad)

    // Update metrics
    this.metrics.totalTasksAssigned++

    this.emit('task:assigned', { task, agentId, assignment })

    return agentId
  }

  /**
   * Complete a task
   */
  completeTask(taskId: string, success: boolean, duration: number): void {
    const assignment = this.assignments.get(taskId)
    if (!assignment) return

    // Record completion
    this.completedTasks.set(taskId, {
      agentId: assignment.agentId,
      duration,
      success
    })

    // Update agent stats
    const agentLoad = this.agentLoads.get(assignment.agentId)
    if (agentLoad) {
      agentLoad.currentTasks--
      agentLoad.loadPercentage = (agentLoad.currentTasks / agentLoad.maxCapacity) * 100
      
      // Update rolling average
      agentLoad.avgTaskDuration = (agentLoad.avgTaskDuration * 0.9) + (duration * 0.1)
      
      // Update success rate
      const completed = Array.from(this.completedTasks.values())
        .filter(c => c.agentId === assignment.agentId)
      const successful = completed.filter(c => c.success).length
      agentLoad.successRate = successful / completed.length
      
      agentLoad.currentPriority = this.calculatePriority(agentLoad)
    }

    // Remove assignment
    this.assignments.delete(taskId)

    // Update metrics
    this.metrics.totalTasksCompleted++

    this.emit('task:completed', { taskId, success, duration, agentId: assignment.agentId })

    // Process queue for new tasks
    this.processQueue()
  }

  /**
   * Calculate agent priority level
   */
  private calculatePriority(load: AgentLoad): 'idle' | 'low' | 'medium' | 'high' | 'overloaded' {
    if (load.loadPercentage === 0) return 'idle'
    if (load.loadPercentage < 30) return 'low'
    if (load.loadPercentage < 60) return 'medium'
    if (load.loadPercentage < 100) return 'high'
    return 'overloaded'
  }

  /**
   * Rebalance workloads
   */
  rebalance(): void {
    this.metrics.rebalancingCount++
    
    // Find overloaded agents
    const overloaded = Array.from(this.agentLoads.values())
      .filter(a => a.loadPercentage > 80)
    
    // Find underutilized agents
    const underutilized = Array.from(this.agentLoads.values())
      .filter(a => a.loadPercentage < 30)

    if (overloaded.length === 0 || underutilized.length === 0) {
      return
    }

    // Try to reassign tasks from overloaded to underutilized
    for (const agent of overloaded) {
      const agentAssignments = Array.from(this.assignments.values())
        .filter(a => a.agentId === agent.agentId && a.priority !== 'critical')
      
      for (const assignment of agentAssignments) {
        // Check if task can be reassigned
        const task: TaskInfo = {
          id: assignment.taskId,
          type: 'general',
          priority: assignment.priority,
          estimatedDuration: assignment.estimatedDuration,
          requiredCapabilities: assignment.requiredCapabilities,
          dependencies: []
        }

        // Find suitable underutilized agent
        for (const targetAgent of underutilized) {
          const hasCapability = task.requiredCapabilities.some(cap => 
            targetAgent.specialties.includes(cap)
          )
          
          if (hasCapability && targetAgent.loadPercentage < 50) {
            // Reassign
            this.assignments.set(assignment.taskId, {
              ...assignment,
              agentId: targetAgent.agentId,
              assignedAt: new Date().toISOString()
            })

            // Update loads
            agent.currentTasks--
            agent.loadPercentage = (agent.currentTasks / agent.maxCapacity) * 100
            
            targetAgent.currentTasks++
            targetAgent.loadPercentage = (targetAgent.currentTasks / targetAgent.maxCapacity) * 100

            this.emit('task:rebalanced', {
              taskId: assignment.taskId,
              fromAgent: agent.agentId,
              toAgent: targetAgent.agentId
            })

            break
          }
        }
      }
    }

    // Update priority levels
    for (const agent of this.agentLoads.values()) {
      agent.currentPriority = this.calculatePriority(agent)
    }
  }

  /**
   * Get parallel task groups
   */
  getParallelGroups(): TaskInfo[][] {
    const groups: TaskInfo[][] = []
    const assigned = new Set<string>()

    // Group tasks that can run in parallel
    for (const task of this.taskQueue) {
      if (assigned.has(task.id)) continue

      // Find tasks with same priority that can run together
      const parallelGroup = this.taskQueue.filter(t => 
        t.id !== task.id &&
        !assigned.has(t.id) &&
        t.priority === task.priority &&
        !t.dependencies.includes(task.id) &&
        !task.dependencies.includes(t.id)
      )

      if (parallelGroup.length > 0) {
        const group = [task, ...parallelGroup.slice(0, 3)]
        groups.push(group)
        group.forEach(t => assigned.add(t.id))
      }
    }

    return groups
  }

  /**
   * Get agent load status
   */
  getAgentLoad(agentId: AgentId): AgentLoad | undefined {
    return this.agentLoads.get(agentId)
  }

  /**
   * Get all agent loads
   */
  getAllLoads(): AgentLoad[] {
    return Array.from(this.agentLoads.values())
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    queueLength: number
    queuedTasks: TaskInfo[]
    assignedTasks: TaskAssignment[]
  } {
    return {
      queueLength: this.taskQueue.length,
      queuedTasks: [...this.taskQueue],
      assignedTasks: Array.from(this.assignments.values())
    }
  }

  /**
   * Get metrics
   */
  getMetrics(): BalancerMetrics {
    // Update agent utilization
    for (const [agentId, load] of this.agentLoads) {
      this.metrics.agentUtilization[agentId] = load.loadPercentage
    }
    
    return { ...this.metrics }
  }

  /**
   * Set balancing strategy
   */
  setStrategy(strategyName: string): void {
    if (STRATEGIES[strategyName]) {
      this.strategy = STRATEGIES[strategyName]
      this.emit('strategy:changed', { strategy: strategyName })
    }
  }

  /**
   * Start automatic rebalancing
   */
  startAutoRebalance(intervalMs: number = 30000): void {
    if (this.rebalanceInterval) {
      clearInterval(this.rebalanceInterval)
    }
    
    this.rebalanceInterval = setInterval(() => {
      this.rebalance()
    }, intervalMs)
  }

  /**
   * Stop automatic rebalancing
   */
  stopAutoRebalance(): void {
    if (this.rebalanceInterval) {
      clearInterval(this.rebalanceInterval)
      this.rebalanceInterval = null
    }
  }

  /**
   * Check if agent is available
   */
  isAgentAvailable(agentId: AgentId): boolean {
    const load = this.agentLoads.get(agentId)
    return load ? load.loadPercentage < 100 : false
  }

  /**
   * Get recommended agent for task
   */
  getRecommendedAgent(task: TaskInfo): AgentId | null {
    const agents = Array.from(this.agentLoads.values())
    return this.strategy.selectAgent(agents, task)
  }

  /**
   * Estimate completion time
   */
  estimateCompletion(taskId: string): number {
    const assignment = this.assignments.get(taskId)
    if (!assignment) {
      // Task is in queue
      const task = this.taskQueue.find(t => t.id === taskId)
      if (task) {
        const queuePosition = this.taskQueue.indexOf(task)
        const avgWaitPerTask = 5 // minutes
        return queuePosition * avgWaitPerTask + task.estimatedDuration
      }
      return 0
    }

    const agentLoad = this.agentLoads.get(assignment.agentId)
    if (!agentLoad) return assignment.estimatedDuration

    // Account for current load
    const queueMultiplier = 1 + (agentLoad.currentTasks * 0.2)
    return Math.ceil(assignment.estimatedDuration * queueMultiplier)
  }

  /**
   * Clear completed tasks history
   */
  clearHistory(): void {
    this.completedTasks.clear()
  }

  /**
   * Reset all loads
   */
  reset(): void {
    this.taskQueue = []
    this.assignments.clear()
    this.completedTasks.clear()
    this.initializeAgents()
    this.metrics = this.initMetrics()
  }
}

// Singleton
let balancerInstance: WorkloadBalancer | null = null

export function getWorkloadBalancer(): WorkloadBalancer {
  if (!balancerInstance) {
    balancerInstance = new WorkloadBalancer()
  }
  return balancerInstance
}

/**
 * Quick balance function
 */
export function balanceTask(task: TaskInfo): AgentId | null {
  const balancer = getWorkloadBalancer()
  return balancer.assignTask(task)
}
