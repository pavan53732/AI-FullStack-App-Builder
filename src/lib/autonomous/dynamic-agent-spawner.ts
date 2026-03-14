/**
 * Dynamic Agent Spawner
 * 
 * Creates and destroys agents on demand based on workload:
 * - Agent pool management
 * - Dynamic scaling based on task complexity
 * - Resource-aware spawning
 * - Agent lifecycle management
 * - Cost optimization
 * 
 * Features:
 * - Scale up/down agents based on workload
 * - Agent templates for quick spawning
 * - Resource budgeting
 * - Agent specialization on spawn
 * - Graceful shutdown handling
 */

import ZAI from 'z-ai-web-dev-sdk'
import { EventEmitter } from 'events'

// Types
export interface AgentTemplate {
  id: string
  type: AgentType
  capabilities: AgentCapability[]
  baseConfig: AgentConfig
  resourceRequirements: ResourceRequirements
  spawnTime: number // ms
  specializationPrompt?: string
}

export type AgentType = 
  | 'orchestrator'
  | 'planner'
  | 'coder'
  | 'debugger'
  | 'reviewer'
  | 'tester'
  | 'architect'
  | 'deployer'
  | 'analyst'
  | 'researcher'
  | 'validator'
  | 'optimizer'

export interface AgentCapability {
  name: string
  description: string
  skillLevel: 'beginner' | 'intermediate' | 'expert'
  maxConcurrency: number
}

export interface AgentConfig {
  modelId?: string
  temperature?: number
  maxTokens?: number
  timeout?: number
  retryAttempts?: number
  memoryBudget?: number // MB
}

export interface ResourceRequirements {
  minMemory: number // MB
  preferredMemory: number // MB
  cpuCores: number
  estimatedDuration: number // ms
}

export interface SpawnedAgent {
  id: string
  templateId: string
  type: AgentType
  status: AgentStatus
  createdAt: string
  lastActivity: string
  tasksCompleted: number
  currentTask: string | null
  resourceUsage: ResourceUsage
  config: AgentConfig
  capabilities: AgentCapability[]
  specialization?: string
  parentAgentId?: string
}

export type AgentStatus = 
  | 'spawning'
  | 'idle'
  | 'busy'
  | 'error'
  | 'terminating'
  | 'terminated'

export interface ResourceUsage {
  memoryUsed: number
  cpuPercent: number
  tokensUsed: number
  lastUpdated: string
}

export interface SpawnRequest {
  type: AgentType
  capabilities?: Partial<AgentCapability>[]
  specialization?: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  taskContext?: string
  parentAgentId?: string
  resourceBudget?: Partial<ResourceRequirements>
  ttl?: number // Time to live in ms
}

export interface SpawnResult {
  success: boolean
  agent?: SpawnedAgent
  error?: string
  spawnTime: number
  resourceAllocated: ResourceRequirements
}

export interface SpawnMetrics {
  totalSpawned: number
  totalTerminated: number
  currentlyActive: number
  averageSpawnTime: number
  averageLifetime: number
  resourceEfficiency: number
  spawningErrors: number
}

// Default agent templates
const DEFAULT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'orchestrator-default',
    type: 'orchestrator',
    capabilities: [
      { name: 'coordination', description: 'Coordinate multiple agents', skillLevel: 'expert', maxConcurrency: 10 },
      { name: 'planning', description: 'Plan task execution', skillLevel: 'expert', maxConcurrency: 5 }
    ],
    baseConfig: { temperature: 0.3, maxTokens: 4000, timeout: 60000 },
    resourceRequirements: { minMemory: 512, preferredMemory: 1024, cpuCores: 2, estimatedDuration: 30000 },
    spawnTime: 2000
  },
  {
    id: 'coder-default',
    type: 'coder',
    capabilities: [
      { name: 'code_generation', description: 'Generate code', skillLevel: 'expert', maxConcurrency: 3 },
      { name: 'refactoring', description: 'Refactor code', skillLevel: 'intermediate', maxConcurrency: 2 }
    ],
    baseConfig: { temperature: 0.2, maxTokens: 8000, timeout: 120000 },
    resourceRequirements: { minMemory: 256, preferredMemory: 512, cpuCores: 1, estimatedDuration: 60000 },
    spawnTime: 1500
  },
  {
    id: 'debugger-default',
    type: 'debugger',
    capabilities: [
      { name: 'error_analysis', description: 'Analyze errors', skillLevel: 'expert', maxConcurrency: 5 },
      { name: 'fix_generation', description: 'Generate fixes', skillLevel: 'intermediate', maxConcurrency: 3 }
    ],
    baseConfig: { temperature: 0.1, maxTokens: 4000, timeout: 90000 },
    resourceRequirements: { minMemory: 256, preferredMemory: 512, cpuCores: 1, estimatedDuration: 45000 },
    spawnTime: 1200
  },
  {
    id: 'reviewer-default',
    type: 'reviewer',
    capabilities: [
      { name: 'code_review', description: 'Review code quality', skillLevel: 'expert', maxConcurrency: 5 },
      { name: 'best_practices', description: 'Enforce best practices', skillLevel: 'expert', maxConcurrency: 5 }
    ],
    baseConfig: { temperature: 0.2, maxTokens: 4000, timeout: 60000 },
    resourceRequirements: { minMemory: 128, preferredMemory: 256, cpuCores: 1, estimatedDuration: 30000 },
    spawnTime: 1000
  },
  {
    id: 'tester-default',
    type: 'tester',
    capabilities: [
      { name: 'test_generation', description: 'Generate tests', skillLevel: 'intermediate', maxConcurrency: 3 },
      { name: 'test_execution', description: 'Execute tests', skillLevel: 'expert', maxConcurrency: 5 }
    ],
    baseConfig: { temperature: 0.1, maxTokens: 6000, timeout: 120000 },
    resourceRequirements: { minMemory: 256, preferredMemory: 512, cpuCores: 2, estimatedDuration: 90000 },
    spawnTime: 1500
  },
  {
    id: 'analyst-default',
    type: 'analyst',
    capabilities: [
      { name: 'performance_analysis', description: 'Analyze performance', skillLevel: 'expert', maxConcurrency: 3 },
      { name: 'resource_monitoring', description: 'Monitor resources', skillLevel: 'intermediate', maxConcurrency: 5 }
    ],
    baseConfig: { temperature: 0.3, maxTokens: 3000, timeout: 45000 },
    resourceRequirements: { minMemory: 128, preferredMemory: 256, cpuCores: 1, estimatedDuration: 30000 },
    spawnTime: 800
  },
  {
    id: 'researcher-default',
    type: 'researcher',
    capabilities: [
      { name: 'documentation_search', description: 'Search documentation', skillLevel: 'expert', maxConcurrency: 10 },
      { name: 'api_discovery', description: 'Discover APIs', skillLevel: 'intermediate', maxConcurrency: 5 }
    ],
    baseConfig: { temperature: 0.4, maxTokens: 4000, timeout: 60000 },
    resourceRequirements: { minMemory: 128, preferredMemory: 256, cpuCores: 1, estimatedDuration: 45000 },
    spawnTime: 800
  }
]

/**
 * Dynamic Agent Spawner
 * 
 * Main class for spawning and managing agents on demand
 */
export class DynamicAgentSpawner extends EventEmitter {
  private zai: any = null
  private templates: Map<string, AgentTemplate> = new Map()
  private agents: Map<string, SpawnedAgent> = new Map()
  private resourcePool: ResourcePool
  private metrics: SpawnMetrics
  private agentCounter: number = 0
  private maxAgents: number
  private defaultTTL: number

  constructor(options?: { maxAgents?: number; defaultTTL?: number }) {
    super()
    this.maxAgents = options?.maxAgents || 20
    this.defaultTTL = options?.defaultTTL || 3600000 // 1 hour
    this.resourcePool = new ResourcePool()
    this.metrics = {
      totalSpawned: 0,
      totalTerminated: 0,
      currentlyActive: 0,
      averageSpawnTime: 0,
      averageLifetime: 0,
      resourceEfficiency: 1,
      spawningErrors: 0
    }

    // Load default templates
    for (const template of DEFAULT_TEMPLATES) {
      this.templates.set(template.id, template)
    }
  }

  /**
   * Initialize the spawner
   */
  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
    await this.resourcePool.initialize()
  }

  /**
   * Spawn a new agent
   */
  async spawnAgent(request: SpawnRequest): Promise<SpawnResult> {
    const startTime = Date.now()
    
    // Check capacity
    if (this.agents.size >= this.maxAgents) {
      // Try to free up space
      const freed = await this.tryFreeAgent(request.priority)
      if (!freed) {
        return {
          success: false,
          error: 'Maximum agent capacity reached',
          spawnTime: Date.now() - startTime,
          resourceAllocated: { minMemory: 0, preferredMemory: 0, cpuCores: 0, estimatedDuration: 0 }
        }
      }
    }

    // Find or create template
    const template = this.findTemplate(request.type, request.capabilities)
    if (!template) {
      return {
        success: false,
        error: `No template found for type: ${request.type}`,
        spawnTime: Date.now() - startTime,
        resourceAllocated: { minMemory: 0, preferredMemory: 0, cpuCores: 0, estimatedDuration: 0 }
      }
    }

    // Allocate resources
    const resourceBudget = { ...template.resourceRequirements, ...request.resourceBudget }
    const allocated = await this.resourcePool.allocate(resourceBudget)
    
    if (!allocated) {
      return {
        success: false,
        error: 'Insufficient resources available',
        spawnTime: Date.now() - startTime,
        resourceAllocated: resourceBudget
      }
    }

    try {
      // Create agent
      const agentId = `agent-${++this.agentCounter}-${Date.now().toString(36)}`
      const config = { ...template.baseConfig }
      
      const agent: SpawnedAgent = {
        id: agentId,
        templateId: template.id,
        type: request.type,
        status: 'spawning',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        tasksCompleted: 0,
        currentTask: null,
        resourceUsage: {
          memoryUsed: resourceBudget.minMemory,
          cpuPercent: 0,
          tokensUsed: 0,
          lastUpdated: new Date().toISOString()
        },
        config,
        capabilities: template.capabilities.map(c => ({
          ...c,
          ...request.capabilities?.find(rc => rc.name === c.name)
        })),
        specialization: request.specialization,
        parentAgentId: request.parentAgentId
      }

      // Add to pool
      this.agents.set(agentId, agent)
      
      // Simulate spawn time
      await new Promise(r => setTimeout(r, template.spawnTime / 10))
      
      // Update status
      agent.status = 'idle'
      
      // Set TTL
      if (request.ttl || this.defaultTTL) {
        setTimeout(() => {
          this.terminateAgent(agentId, 'ttl_expired')
        }, request.ttl || this.defaultTTL)
      }

      // Update metrics
      this.updateMetrics('spawned', Date.now() - startTime)
      
      // Emit event
      this.emit('agent_spawned', { agent, request })

      return {
        success: true,
        agent,
        spawnTime: Date.now() - startTime,
        resourceAllocated: resourceBudget
      }
    } catch (error: any) {
      // Release allocated resources
      await this.resourcePool.release(resourceBudget)
      
      this.metrics.spawningErrors++
      
      return {
        success: false,
        error: error.message,
        spawnTime: Date.now() - startTime,
        resourceAllocated: resourceBudget
      }
    }
  }

  /**
   * Terminate an agent
   */
  async terminateAgent(
    agentId: string,
    reason: string = 'manual'
  ): Promise<boolean> {
    const agent = this.agents.get(agentId)
    if (!agent) return false

    agent.status = 'terminating'
    this.emit('agent_terminating', { agent, reason })

    // Wait for current task to complete (with timeout)
    const timeout = 5000
    const startWait = Date.now()
    while (agent.status === 'busy' && Date.now() - startWait < timeout) {
      await new Promise(r => setTimeout(r, 100))
    }

    // Release resources
    await this.resourcePool.release(agent.resourceUsage as ResourceRequirements)

    // Remove from pool
    agent.status = 'terminated'
    this.agents.delete(agentId)

    // Update metrics
    this.updateMetrics('terminated', Date.now() - new Date(agent.createdAt).getTime())

    this.emit('agent_terminated', { agent, reason })
    return true
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): SpawnedAgent | undefined {
    return this.agents.get(agentId)
  }

  /**
   * Get all active agents
   */
  getActiveAgents(): SpawnedAgent[] {
    return Array.from(this.agents.values()).filter(a => a.status !== 'terminated')
  }

  /**
   * Get agents by type
   */
  getAgentsByType(type: AgentType): SpawnedAgent[] {
    return this.getActiveAgents().filter(a => a.type === type)
  }

  /**
   * Find idle agent of type
   */
  findIdleAgent(type: AgentType): SpawnedAgent | undefined {
    return this.getAgentsByType(type).find(a => a.status === 'idle')
  }

  /**
   * Scale agents based on workload
   */
  async scaleAgents(
    requirements: { type: AgentType; count: number }[]
  ): Promise<SpawnResult[]> {
    const results: SpawnResult[] = []

    for (const req of requirements) {
      const current = this.getAgentsByType(req.type).length
      const diff = req.count - current

      if (diff > 0) {
        // Scale up
        for (let i = 0; i < diff; i++) {
          const result = await this.spawnAgent({
            type: req.type,
            priority: 'normal'
          })
          results.push(result)
        }
      } else if (diff < 0) {
        // Scale down
        const idleAgents = this.getAgentsByType(req.type)
          .filter(a => a.status === 'idle')
          .slice(0, Math.abs(diff))
        
        for (const agent of idleAgents) {
          await this.terminateAgent(agent.id, 'scale_down')
        }
      }
    }

    return results
  }

  /**
   * Update agent activity
   */
  updateAgentActivity(
    agentId: string,
    task?: string
  ): void {
    const agent = this.agents.get(agentId)
    if (agent) {
      agent.lastActivity = new Date().toISOString()
      agent.currentTask = task || null
      agent.status = task ? 'busy' : 'idle'
      if (!task) {
        agent.tasksCompleted++
      }
    }
  }

  /**
   * Get metrics
   */
  getMetrics(): SpawnMetrics {
    return { ...this.metrics, currentlyActive: this.agents.size }
  }

  /**
   * Add custom template
   */
  addTemplate(template: AgentTemplate): void {
    this.templates.set(template.id, template)
  }

  /**
   * Find appropriate template
   */
  private findTemplate(
    type: AgentType,
    capabilities?: Partial<AgentCapability>[]
  ): AgentTemplate | undefined {
    // Try to find exact match
    for (const template of this.templates.values()) {
      if (template.type === type) {
        // Check if capabilities match
        if (capabilities) {
          const hasAllCaps = capabilities.every(c => 
            template.capabilities.some(tc => tc.name === c.name)
          )
          if (hasAllCaps) return template
        } else {
          return template
        }
      }
    }
    
    // Return first matching type
    for (const template of this.templates.values()) {
      if (template.type === type) return template
    }
    
    return undefined
  }

  /**
   * Try to free an agent based on priority
   */
  private async tryFreeAgent(priority: SpawnRequest['priority']): Promise<boolean> {
    const priorityOrder = ['low', 'normal', 'high', 'critical']
    const minPriority = priorityOrder.indexOf(priority)
    
    // Find agents with lower priority work
    const candidates = this.getActiveAgents()
      .filter(a => a.status === 'idle')
      .sort((a, b) => {
        // Prefer older agents
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })

    if (candidates.length > 0) {
      await this.terminateAgent(candidates[0].id, 'capacity_pressure')
      return true
    }

    return false
  }

  /**
   * Update metrics
   */
  private updateMetrics(action: 'spawned' | 'terminated', duration: number): void {
    if (action === 'spawned') {
      this.metrics.totalSpawned++
      this.metrics.averageSpawnTime = 
        (this.metrics.averageSpawnTime * (this.metrics.totalSpawned - 1) + duration) / 
        this.metrics.totalSpawned
    } else {
      this.metrics.totalTerminated++
      this.metrics.averageLifetime = 
        (this.metrics.averageLifetime * (this.metrics.totalTerminated - 1) + duration) / 
        this.metrics.totalTerminated
    }
    
    this.metrics.resourceEfficiency = 
      this.agents.size > 0 
        ? Array.from(this.agents.values()).reduce((sum, a) => sum + (a.status === 'busy' ? 1 : 0), 0) / this.agents.size
        : 1
  }
}

/**
 * Resource Pool Manager
 */
class ResourcePool {
  private totalMemory: number = 8192 // MB
  private availableMemory: number = 8192
  private totalCpuCores: number = 8
  private availableCpuCores: number = 8
  private allocations: Map<string, ResourceRequirements> = new Map()

  async initialize(): Promise<void> {
    // Could detect actual system resources here
  }

  async allocate(requirements: ResourceRequirements): Promise<boolean> {
    if (requirements.minMemory <= this.availableMemory && 
        requirements.cpuCores <= this.availableCpuCores) {
      this.availableMemory -= requirements.minMemory
      this.availableCpuCores -= requirements.cpuCores
      return true
    }
    return false
  }

  async release(requirements: ResourceRequirements): Promise<void> {
    this.availableMemory += requirements.minMemory
    this.availableCpuCores += requirements.cpuCores
    
    // Cap at max
    this.availableMemory = Math.min(this.availableMemory, this.totalMemory)
    this.availableCpuCores = Math.min(this.availableCpuCores, this.totalCpuCores)
  }

  getAvailable(): { memory: number; cpuCores: number } {
    return {
      memory: this.availableMemory,
      cpuCores: this.availableCpuCores
    }
  }
}

// Singleton instance
let spawnerInstance: DynamicAgentSpawner | null = null

export function getAgentSpawner(): DynamicAgentSpawner {
  if (!spawnerInstance) {
    spawnerInstance = new DynamicAgentSpawner()
  }
  return spawnerInstance
}

export async function spawnAgent(request: SpawnRequest): Promise<SpawnResult> {
  const spawner = getAgentSpawner()
  if (!spawner['zai']) {
    await spawner.initialize()
  }
  return spawner.spawnAgent(request)
}
