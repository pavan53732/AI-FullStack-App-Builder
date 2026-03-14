/**
 * Planning Constraint Solver
 * 
 * Solves planning constraints including:
 * - Task scheduling with time constraints
 * - Resource allocation
 * - Dependency ordering
 * - Conflict resolution
 * - Optimization of execution order
 */

import ZAI from 'z-ai-web-dev-sdk'
import { EventEmitter } from 'events'

import type { DecomposedTask } from './task-decomposer'

// Types
export interface PlanningConstraint {
  id: string
  type: ConstraintType
  description: string
  weight: number        // Importance of this constraint (1-10)
  mandatory: boolean   // Must be satisfied
  parameters: Record<string, any>
}

export type ConstraintType = 
  | 'dependency'    // Task depends on another
  | 'time'          // Time-related constraints
  | 'resource'      // Resource limitations
  | 'ordering'      // Order requirements
  | 'conflict'      // Mutually exclusive tasks
  | 'capacity'      // Parallel execution limits
  | 'deadline'      // Hard deadline
  | 'priority'      // Priority ordering
  | 'skill'         // Required skills/agents

export interface ConstraintSolution {
  valid: boolean
  violations: ConstraintViolation[]
  satisfied: PlanningConstraint[]
  unsatisfied: PlanningConstraint[]
  score: number
  executionOrder: string[]       // Task IDs in execution order
  parallelGroups: string[][]      // Tasks that can run in parallel
  estimatedDuration: number        // Total time in minutes
  resourceAllocation: Map<string, string[]>  // Resource -> Task IDs
}

export interface ConstraintViolation {
  constraint: PlanningConstraint
  reason: string
  severity: 'error' | 'warning'
  suggestion: string
}

export interface TaskSchedule {
  taskId: string
  startTime: Date
  endTime: Date
  assignedResources: string[]
  dependencies: string[]
  dependents: string[]
}

export interface SolverOptions {
  maxIterations: number
  optimizationGoal: 'speed' | 'reliability' | 'balanced'
  allowPartialSolution: boolean
  considerHistoricalData: boolean
}

export interface SolverResult {
  success: boolean
  solution?: ConstraintSolution
  alternatives: ConstraintSolution[]
  reasoning: string
  iterations: number
  solvedAt: string
}

// Resource types
export interface Resource {
  id: string
  type: 'agent' | 'tool' | 'api' | 'compute'
  capacity: number
  available: boolean
  skills: string[]
  currentLoad: number
}

/**
 * Planning Constraint Solver
 */
export class PlanningConstraintSolver extends EventEmitter {
  private zai: any = null
  private resources: Map<string, Resource> = new Map()
  private historicalSolutions: ConstraintSolution[] = []
  private constraints: Map<string, PlanningConstraint> = new Map()

  constructor() {
    super()
    this.initializeResources()
  }

  /**
   * Initialize AI
   */
  async init(): Promise<void> {
    if (!this.zai) {
      this.zai = await ZAI.create()
    }
  }

  /**
   * Initialize default resources
   */
  private initializeResources(): void {
    // Default agents
    const agents = ['planner', 'coder', 'debugger', 'reviewer', 'tester', 'architect', 'deployer', 'orchestrator']
    
    for (const agent of agents) {
      this.resources.set(agent, {
        id: agent,
        type: 'agent',
        capacity: 1,
        available: true,
        skills: this.getAgentSkills(agent),
        currentLoad: 0
      })
    }
  }

  /**
   * Get agent skills
   */
  private getAgentSkills(agentId: string): string[] {
    const skillMap: Record<string, string[]> = {
      planner: ['planning', 'architecture', 'requirements'],
      coder: ['coding', 'implementation', 'refactoring'],
      debugger: ['debugging', 'error-analysis', 'fixing'],
      reviewer: ['review', 'optimization', 'best-practices'],
      tester: ['testing', 'validation', 'coverage'],
      architect: ['architecture', 'design', 'scalability'],
      deployer: ['deployment', 'infrastructure', 'monitoring'],
      orchestrator: ['coordination', 'management', 'optimization']
    }
    return skillMap[agentId] || []
  }

  /**
   * Add a constraint
   */
  addConstraint(constraint: Omit<PlanningConstraint, 'id'>): PlanningConstraint {
    const fullConstraint: PlanningConstraint = {
      ...constraint,
      id: `constraint_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
    }
    
    this.constraints.set(fullConstraint.id, fullConstraint)
    this.emit('constraint:added', fullConstraint)
    
    return fullConstraint
  }

  /**
   * Remove a constraint
   */
  removeConstraint(id: string): boolean {
    const existed = this.constraints.delete(id)
    if (existed) {
      this.emit('constraint:removed', id)
    }
    return existed
  }

  /**
   * Solve constraints for a set of tasks
   */
  async solve(
    tasks: DecomposedTask[],
    options?: Partial<SolverOptions>
  ): Promise<SolverResult> {
    await this.init()
    
    const opts: SolverOptions = {
      maxIterations: 100,
      optimizationGoal: 'balanced',
      allowPartialSolution: true,
      considerHistoricalData: true,
      ...options
    }

    const startTime = Date.now()
    let iterations = 0
    let bestSolution: ConstraintSolution | null = null
    const alternatives: ConstraintSolution[] = []

    // Build initial constraints from tasks
    const allConstraints = this.buildTaskConstraints(tasks)

    // Try to find valid solution
    while (iterations < opts.maxIterations) {
      iterations++
      
      // Generate a candidate solution
      const candidate = await this.generateSolution(tasks, allConstraints, opts)
      
      // Evaluate the solution
      const evaluation = this.evaluateSolution(candidate, tasks, allConstraints)
      
      if (evaluation.valid) {
        if (!bestSolution || evaluation.score > bestSolution.score) {
          bestSolution = candidate
          
          // Store for future reference
          if (opts.considerHistoricalData) {
            this.historicalSolutions.push(candidate)
            if (this.historicalSolutions.length > 100) {
              this.historicalSolutions.shift()
            }
          }
        }
        
        alternatives.push(candidate)
        
        // Stop if we found a good enough solution
        if (evaluation.score >= 90) {
          break
        }
      }
    }

    // If no valid solution found, try to find best partial solution
    if (!bestSolution && opts.allowPartialSolution) {
      bestSolution = this.findBestPartialSolution(tasks, allConstraints)
    }

    // Generate reasoning
    const reasoning = await this.generateReasoning(bestSolution, tasks, allConstraints)

    return {
      success: bestSolution?.valid ?? false,
      solution: bestSolution ?? undefined,
      alternatives: alternatives.slice(0, 5),
      reasoning,
      iterations,
      solvedAt: new Date().toISOString()
    }
  }

  /**
   * Build constraints from tasks
   */
  private buildTaskConstraints(tasks: DecomposedTask[]): PlanningConstraint[] {
    const constraints: PlanningConstraint[] = []

    for (const task of tasks) {
      // Dependency constraints
      for (const depId of task.dependencies) {
        constraints.push({
          id: `dep_${task.id}_${depId}`,
          type: 'dependency',
          description: `Task ${task.title} depends on ${depId}`,
          weight: 10,
          mandatory: true,
          parameters: { task: task.id, dependsOn: depId }
        })
      }

      // Priority constraint
      constraints.push({
        id: `priority_${task.id}`,
        type: 'priority',
        description: `Task ${task.title} has priority ${task.priority}`,
        weight: task.priority === 'critical' ? 10 : task.priority === 'high' ? 7 : 4,
        mandatory: task.priority === 'critical',
        parameters: { task: task.id, priority: task.priority }
      })

      // Estimated duration constraint
      constraints.push({
        id: `time_${task.id}`,
        type: 'time',
        description: `Task ${task.title} estimated to take ${task.estimatedDuration} minutes`,
        weight: 3,
        mandatory: false,
        parameters: { task: task.id, duration: task.estimatedDuration }
      })
    }

    // Add conflict constraints for tasks with same required resources
    const resourceMap = new Map<string, string[]>()
    for (const task of tasks) {
      for (const skill of this.getRequiredSkills(task)) {
        const existing = resourceMap.get(skill) || []
        existing.push(task.id)
        resourceMap.set(skill, existing)
      }
    }

    for (const [skill, taskIds] of resourceMap) {
      if (taskIds.length > 1) {
        constraints.push({
          id: `conflict_${skill}`,
          type: 'conflict',
          description: `Tasks ${taskIds.join(', ')} all require ${skill}`,
          weight: 5,
          mandatory: false,
          parameters: { tasks: taskIds, resource: skill }
        })
      }
    }

    // Capacity constraint (max 3 parallel tasks)
    constraints.push({
      id: 'capacity_parallel',
      type: 'capacity',
      description: 'Maximum 3 tasks can run in parallel',
      weight: 6,
      mandatory: true,
      parameters: { maxParallel: 3 }
    })

    return constraints
  }

  /**
   * Get required skills for a task
   */
  private getRequiredSkills(task: DecomposedTask): string[] {
    const skillMap: Record<string, string[]> = {
      'create': ['coding'],
      'implement': ['coding'],
      'fix': ['debugging'],
      'debug': ['debugging'],
      'test': ['testing'],
      'review': ['review'],
      'deploy': ['deployment'],
      'plan': ['planning'],
      'design': ['architecture', 'design']
    }

    const skills: string[] = []
    const titleLower = task.title.toLowerCase()
    
    for (const [keyword, required] of Object.entries(skillMap)) {
      if (titleLower.includes(keyword)) {
        skills.push(...required)
      }
    }

    return [...new Set(skills)]
  }

  /**
   * Generate a candidate solution
   */
  private async generateSolution(
    tasks: DecomposedTask[],
    constraints: PlanningConstraint[],
    options: SolverOptions
  ): Promise<ConstraintSolution> {
    // Build dependency graph
    const graph = this.buildDependencyGraph(tasks)
    
    // Topological sort for execution order
    const executionOrder = this.topologicalSort(tasks, graph)
    
    // Identify parallel groups
    const parallelGroups = this.identParallelGroups(tasks, graph)
    
    // Allocate resources
    const resourceAllocation = this.allocateResources(tasks, constraints)
    
    // Calculate estimated duration
    const estimatedDuration = this.calculateDuration(tasks, parallelGroups)

    return {
      valid: true,
      violations: [],
      satisfied: constraints,
      unsatisfied: [],
      score: 0, // Will be calculated in evaluation
      executionOrder,
      parallelGroups,
      estimatedDuration,
      resourceAllocation
    }
  }

  /**
   * Build dependency graph
   */
  private buildDependencyGraph(tasks: DecomposedTask[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>()
    
    for (const task of tasks) {
      graph.set(task.id, new Set(task.dependencies))
    }
    
    return graph
  }

  /**
   * Topological sort for execution order
   */
  private topologicalSort(
    tasks: DecomposedTask[],
    graph: Map<string, Set<string>>
  ): string[] {
    const result: string[] = []
    const visited = new Set<string>()
    const temp = new Set<string>()

    const visit = (taskId: string) => {
      if (temp.has(taskId)) {
        // Cycle detected, skip
        return
      }
      if (visited.has(taskId)) {
        return
      }

      temp.add(taskId)
      
      const deps = graph.get(taskId) || new Set()
      for (const dep of deps) {
        visit(dep)
      }

      temp.delete(taskId)
      visited.add(taskId)
      result.push(taskId)
    }

    // Sort by priority first
    const sortedTasks = [...tasks].sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
    })

    for (const task of sortedTasks) {
      visit(task.id)
    }

    return result
  }

  /**
   * Identify groups of tasks that can run in parallel
   */
  private identifyParallelGroups(
    tasks: DecomposedTask[],
    graph: Map<string, Set<string>>
  ): string[][] {
    const groups: string[][] = []
    const assigned = new Set<string>()

    // Find tasks with no dependencies to each other
    const available = new Set(tasks.map(t => t.id))

    while (assigned.size < tasks.length) {
      const group: string[] = []

      for (const taskId of available) {
        if (assigned.has(taskId)) continue

        // Check if all dependencies are satisfied
        const deps = graph.get(taskId) || new Set()
        const allDepsMet = Array.from(deps).every(d => assigned.has(d))

        if (allDepsMet) {
          // Check if this task conflicts with others in current group
          const task = tasks.find(t => t.id === taskId)!
          const conflicts = this.findConflicts(task, group.map(id => tasks.find(t => t.id === id)!))
          
          if (!conflicts && group.length < 3) { // Max 3 parallel
            group.push(taskId)
            assigned.add(taskId)
          }
        }
      }

      if (group.length === 0) {
        // No more tasks can be added, break cycle
        for (const taskId of available) {
          if (!assigned.has(taskId)) {
            group.push(taskId)
            assigned.add(taskId)
            break
          }
        }
      }

      if (group.length > 0) {
        groups.push(group)
      }
    }

    return groups
  }

  /**
   * Find conflicts between tasks
   */
  private findConflicts(task: DecomposedTask, otherTasks: DecomposedTask[]): boolean {
    const taskSkills = this.getRequiredSkills(task)
    
    for (const other of otherTasks) {
      const otherSkills = this.getRequiredSkills(other)
      
      // Check if they need the same exclusive resource
      const overlap = taskSkills.some(s => otherSkills.includes(s))
      if (overlap) {
        return true
      }
    }

    return false
  }

  /**
   * Allocate resources to tasks
   */
  private allocateResources(
    tasks: DecomposedTask[],
    constraints: PlanningConstraint[]
  ): Map<string, string[]> {
    const allocation = new Map<string, string[]>()

    // Initialize resource allocations
    for (const [resourceId, resource] of this.resources) {
      if (resource.available) {
        allocation.set(resourceId, [])
      }
    }

    // Allocate tasks to resources
    for (const task of tasks) {
      const requiredSkills = this.getRequiredSkills(task)
      
      for (const [resourceId, resource] of this.resources) {
        const hasSkills = requiredSkills.some(s => resource.skills.includes(s))
        
        if (hasSkills && resource.currentLoad < resource.capacity) {
          const currentAllocations = allocation.get(resourceId) || []
          currentAllocations.push(task.id)
          allocation.set(resourceId, currentAllocations)
          break
        }
      }
    }

    return allocation
  }

  /**
   * Calculate total duration
   */
  private calculateDuration(
    tasks: DecomposedTask[],
    parallelGroups: string[][]
  ): number {
    let totalDuration = 0

    for (const group of parallelGroups) {
      // Duration of a parallel group is the max task duration
      const groupDuration = Math.max(
        ...group.map(taskId => {
          const task = tasks.find(t => t.id === taskId)
          return task?.estimatedDuration || 10
        })
      )
      totalDuration += groupDuration
    }

    return totalDuration
  }

  /**
   * Evaluate a solution
   */
  private evaluateSolution(
    solution: ConstraintSolution,
    tasks: DecomposedTask[],
    constraints: PlanningConstraint[]
  ): { valid: boolean; score: number } {
    const violations: ConstraintViolation[] = []
    const satisfied: PlanningConstraint[] = []
    const unsatisfied: PlanningConstraint[] = []

    let score = 100

    for (const constraint of constraints) {
      const result = this.checkConstraint(constraint, solution, tasks)
      
      if (result.satisfied) {
        satisfied.push(constraint)
        score += constraint.weight
      } else {
        unsatisfied.push(constraint)
        
        if (constraint.mandatory) {
          violations.push({
            constraint,
            reason: result.reason,
            severity: 'error',
            suggestion: result.suggestion
          })
          score -= constraint.weight * 3
        } else {
          score -= constraint.weight
        }
      }
    }

    // Update solution
    solution.violations = violations
    solution.satisfied = satisfied
    solution.unsatisfied = unsatisfied
    solution.score = Math.max(0, score)

    return {
      valid: violations.length === 0,
      score: solution.score
    }
  }

  /**
   * Check if a constraint is satisfied
   */
  private checkConstraint(
    constraint: PlanningConstraint,
    solution: ConstraintSolution,
    tasks: DecomposedTask[]
  ): { satisfied: boolean; reason: string; suggestion: string } {
    switch (constraint.type) {
      case 'dependency': {
        const { task, dependsOn } = constraint.parameters
        const taskIndex = solution.executionOrder.indexOf(task)
        const depIndex = solution.executionOrder.indexOf(depOn)
        
        if (depIndex === -1) {
          return {
            satisfied: false,
            reason: `Dependency ${depOn} not found in execution order`,
            suggestion: 'Include all required tasks in the plan'
          }
        }
        
        if (taskIndex <= depIndex) {
          return {
            satisfied: false,
            reason: `Task ${task} must come after ${depOn}`,
            suggestion: 'Reorder tasks to respect dependencies'
          }
        }
        
        return { satisfied: true, reason: '', suggestion: '' }
      }

      case 'capacity': {
        const maxParallel = constraint.parameters.maxParallel
        const exceeded = solution.parallelGroups.some(g => g.length > maxParallel)
        
        if (exceeded) {
          return {
            satisfied: false,
            reason: `More than ${maxParallel} tasks running in parallel`,
            suggestion: 'Reduce parallelism to respect capacity limits'
          }
        }
        
        return { satisfied: true, reason: '', suggestion: '' }
      }

      case 'conflict': {
        const taskIds = constraint.parameters.tasks as string[]
        
        for (const group of solution.parallelGroups) {
          const conflictingTasks = taskIds.filter(id => group.includes(id))
          if (conflictingTasks.length > 1) {
            return {
              satisfied: false,
              reason: `Tasks ${conflictingTasks.join(', ')} are scheduled in parallel but conflict`,
              suggestion: 'Schedule conflicting tasks sequentially'
            }
          }
        }
        
        return { satisfied: true, reason: '', suggestion: '' }
      }

      default:
        return { satisfied: true, reason: '', suggestion: '' }
    }
  }

  /**
   * Find best partial solution
   */
  private findBestPartialSolution(
    tasks: DecomposedTask[],
    constraints: PlanningConstraint[]
  ): ConstraintSolution {
    // Create a simple sequential solution
    const executionOrder = tasks.map(t => t.id)
    const parallelGroups = tasks.map(t => [t.id])
    const resourceAllocation = new Map<string, string[]>()
    const estimatedDuration = tasks.reduce((sum, t) => sum + (t.estimatedDuration || 10), 0)

    return {
      valid: false,
      violations: [],
      satisfied: [],
      unsatisfied: constraints,
      score: 20,
      executionOrder,
      parallelGroups,
      estimatedDuration,
      resourceAllocation
    }
  }

  /**
   * Generate reasoning for solution
   */
  private async generateReasoning(
    solution: ConstraintSolution | null,
    tasks: DecomposedTask[],
    constraints: PlanningConstraint[]
  ): Promise<string> {
    if (!solution) {
      return 'No valid solution could be found for the given constraints.'
    }

    const parts: string[] = []
    
    parts.push(`Solution found with score ${solution.score}`)
    parts.push(`Execution will proceed in ${solution.executionOrder.length} steps`)
    parts.push(`Tasks can be parallelized in ${solution.parallelGroups.length} groups`)
    parts.push(`Estimated total duration: ${solution.estimatedDuration} minutes`)
    
    if (solution.violations.length > 0) {
      parts.push(`\nViolations (${solution.violations.length}):`)
      for (const v of solution.violations) {
        parts.push(`- ${v.reason}`)
      }
    }

    return parts.join('\n')
  }

  /**
   * Get all constraints
   */
  getConstraints(): PlanningConstraint[] {
    return Array.from(this.constraints.values())
  }

  /**
   * Get available resources
   */
  getAvailableResources(): Resource[] {
    return Array.from(this.resources.values()).filter(r => r.available)
  }

  /**
   * Add a resource
   */
  addResource(resource: Resource): void {
    this.resources.set(resource.id, resource)
    this.emit('resource:added', resource)
  }
}

// Singleton
let solverInstance: PlanningConstraintSolver | null = null

export function getConstraintSolver(): PlanningConstraintSolver {
  if (!solverInstance) {
    solverInstance = new PlanningConstraintSolver()
  }
  return solverInstance
}

/**
 * Quick constraint solving
 */
export async function solveConstraints(
  tasks: DecomposedTask[],
  options?: Partial<SolverOptions>
): Promise<SolverResult> {
  const solver = getConstraintSolver()
  return solver.solve(tasks, options)
}
