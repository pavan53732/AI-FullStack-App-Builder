/**
 * Agent Message Bus
 * 
 * Real-time inter-agent communication system:
 * - Pub/sub messaging
 * - Event broadcasting
 * - Message queuing
 * - Agent discovery
 * - State synchronization
 * - Conflict resolution
 */

import { EventEmitter } from 'events'

// Message Types
export type MessageType = 
  | 'task.assigned'
  | 'task.completed'
  | 'task.failed'
  | 'task.delegated'
  | 'knowledge.shared'
  | 'knowledge.requested'
  | 'conflict.detected'
  | 'conflict.resolved'
  | 'state.updated'
  | 'status.heartbeat'
  | 'error.reported'
  | 'help.requested'
  | 'coordination.sync'
  | 'decision.proposed'
  | 'decision.voted'

export interface AgentMessage {
  id: string
  type: MessageType
  from: AgentId
  to: AgentId | 'broadcast' | AgentId[]
  priority: 'low' | 'normal' | 'high' | 'critical'
  payload: any
  metadata: {
    timestamp: string
    correlationId?: string
    replyTo?: string
    ttl?: number
    retries: number
    acknowledged: boolean
  }
}

export type AgentId = 'planner' | 'coder' | 'debugger' | 'reviewer' | 'tester' | 'architect' | 'deployer' | 'orchestrator'

export interface AgentInfo {
  id: AgentId
  type: string
  status: 'idle' | 'working' | 'waiting' | 'error' | 'offline'
  capabilities: string[]
  workload: number
  lastHeartbeat: string
  currentTask?: string
  queueLength: number
}

export interface MessageSubscription {
  id: string
  agentId: AgentId
  types: MessageType[]
  handler: (message: AgentMessage) => Promise<void> | void
}

export interface SharedState {
  projectId: string
  taskId: string
  context: Record<string, any>
  decisions: DecisionRecord[]
  knowledge: KnowledgeRecord[]
  conflicts: ConflictRecord[]
}

export interface DecisionRecord {
  id: string
  proposer: AgentId
  topic: string
  options: string[]
  votes: Record<AgentId, string>
  result?: string
  timestamp: string
}

export interface KnowledgeRecord {
  id: string
  agentId: AgentId
  type: 'fact' | 'inference' | 'rule' | 'pattern'
  content: string
  confidence: number
  timestamp: string
}

export interface ConflictRecord {
  id: string
  type: 'resource' | 'decision' | 'state' | 'knowledge'
  parties: AgentId[]
  description: string
  resolution?: string
  resolvedBy?: AgentId
  timestamp: string
}

// Priority queue for messages
class MessagePriorityQueue {
  private queues: Map<string, AgentMessage[]> = new Map([
    ['critical', []],
    ['high', []],
    ['normal', []],
    ['low', []]
  ])

  enqueue(message: AgentMessage): void {
    const queue = this.queues.get(message.priority)
    if (queue) {
      queue.push(message)
    }
  }

  dequeue(): AgentMessage | undefined {
    for (const priority of ['critical', 'high', 'normal', 'low']) {
      const queue = this.queues.get(priority)
      if (queue && queue.length > 0) {
        return queue.shift()
      }
    }
    return undefined
  }

  peek(): AgentMessage | undefined {
    for (const priority of ['critical', 'high', 'normal', 'low']) {
      const queue = this.queues.get(priority)
      if (queue && queue.length > 0) {
        return queue[0]
      }
    }
    return undefined
  }

  size(): number {
    let total = 0
    for (const queue of this.queues.values()) {
      total += queue.length
    }
    return total
  }

  clear(): void {
    for (const queue of this.queues.values()) {
      queue.length = 0
    }
  }
}

/**
 * Agent Message Bus - Main Class
 */
export class AgentMessageBus extends EventEmitter {
  private static instance: AgentMessageBus
  
  private agents: Map<AgentId, AgentInfo> = new Map()
  private subscriptions: Map<string, MessageSubscription> = new Map()
  private messageQueue: MessagePriorityQueue = new MessagePriorityQueue()
  private sharedState: Map<string, SharedState> = new Map()
  private messageHistory: AgentMessage[] = []
  private maxHistorySize = 1000
  
  private messageCounter = 0
  private heartbeatInterval: NodeJS.Timeout | null = null
  private processingInterval: NodeJS.Timeout | null = null

  private constructor() {
    super()
    this.initialize()
  }

  static getInstance(): AgentMessageBus {
    if (!AgentMessageBus.instance) {
      AgentMessageBus.instance = new AgentMessageBus()
    }
    return AgentMessageBus.instance
  }

  /**
   * Initialize the message bus
   */
  private initialize(): void {
    // Start heartbeat monitoring
    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeats()
    }, 5000)
    
    // Start message processing
    this.processingInterval = setInterval(() => {
      this.processMessages()
    }, 100)
    
    // Initialize default agents
    this.initializeAgents()
  }

  /**
   * Initialize default agent types
   */
  private initializeAgents(): void {
    const defaultAgents: AgentId[] = ['planner', 'coder', 'debugger', 'reviewer', 'tester', 'architect', 'deployer', 'orchestrator']
    
    for (const id of defaultAgents) {
      this.agents.set(id, {
        id,
        type: id,
        status: 'idle',
        capabilities: this.getDefaultCapabilities(id),
        workload: 0,
        lastHeartbeat: new Date().toISOString(),
        queueLength: 0
      })
    }
  }

  /**
   * Get default capabilities for agent type
   */
  private getDefaultCapabilities(agentId: AgentId): string[] {
    const capabilities: Record<AgentId, string[]> = {
      planner: ['task-decomposition', 'milestone-planning', 'priority-ranking'],
      coder: ['file-creation', 'code-generation', 'implementation'],
      debugger: ['error-analysis', 'bug-fixing', 'root-cause-analysis'],
      reviewer: ['code-review', 'quality-check', 'best-practices'],
      tester: ['test-generation', 'test-execution', 'coverage-analysis'],
      architect: ['architecture-design', 'pattern-selection', 'technology-choice'],
      deployer: ['deployment', 'infrastructure', 'monitoring'],
      orchestrator: ['coordination', 'delegation', 'conflict-resolution']
    }
    return capabilities[agentId] || []
  }

  /**
   * Register an agent
   */
  registerAgent(agentId: AgentId, capabilities: string[]): void {
    this.agents.set(agentId, {
      id: agentId,
      type: agentId,
      status: 'idle',
      capabilities,
      workload: 0,
      lastHeartbeat: new Date().toISOString(),
      queueLength: 0
    })
    
    this.emit('agent:registered', { agentId, capabilities })
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: AgentId): void {
    this.agents.delete(agentId)
    
    // Remove subscriptions
    for (const [subId, sub] of this.subscriptions) {
      if (sub.agentId === agentId) {
        this.subscriptions.delete(subId)
      }
    }
    
    this.emit('agent:unregistered', { agentId })
  }

  /**
   * Subscribe to messages
   */
  subscribe(
    agentId: AgentId,
    types: MessageType[],
    handler: (message: AgentMessage) => Promise<void> | void
  ): string {
    const subscriptionId = `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
    
    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      agentId,
      types,
      handler
    })
    
    return subscriptionId
  }

  /**
   * Unsubscribe from messages
   */
  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId)
  }

  /**
   * Send a message
   */
  send(
    from: AgentId,
    to: AgentId | 'broadcast' | AgentId[],
    type: MessageType,
    payload: any,
    options: {
      priority?: AgentMessage['priority']
      correlationId?: string
      replyTo?: string
      ttl?: number
    } = {}
  ): string {
    const messageId = `msg_${++this.messageCounter}_${Date.now().toString(36)}`
    
    const message: AgentMessage = {
      id: messageId,
      type,
      from,
      to,
      priority: options.priority || 'normal',
      payload,
      metadata: {
        timestamp: new Date().toISOString(),
        correlationId: options.correlationId,
        replyTo: options.replyTo,
        ttl: options.ttl,
        retries: 0,
        acknowledged: false
      }
    }
    
    this.messageQueue.enqueue(message)
    this.emit('message:queued', message)
    
    return messageId
  }

  /**
   * Send and wait for reply
   */
  async sendAndWait(
    from: AgentId,
    to: AgentId,
    type: MessageType,
    payload: any,
    timeout = 30000
  ): Promise<AgentMessage | null> {
    return new Promise((resolve) => {
      const correlationId = `corr_${Date.now().toString(36)}`
      
      // Set up listener for reply
      const replyHandler = (message: AgentMessage) => {
        if (message.metadata.correlationId === correlationId) {
          this.off('message:delivered', replyHandler)
          resolve(message)
        }
      }
      
      this.on('message:delivered', replyHandler)
      
      // Send message
      this.send(from, to, type, payload, { correlationId })
      
      // Set timeout
      setTimeout(() => {
        this.off('message:delivered', replyHandler)
        resolve(null)
      }, timeout)
    })
  }

  /**
   * Broadcast to all agents
   */
  broadcast(from: AgentId, type: MessageType, payload: any): void {
    this.send(from, 'broadcast', type, payload, { priority: 'high' })
  }

  /**
   * Process queued messages
   */
  private async processMessages(): Promise<void> {
    while (this.messageQueue.size() > 0) {
      const message = this.messageQueue.dequeue()
      if (!message) break
      
      await this.deliverMessage(message)
    }
  }

  /**
   * Deliver message to recipients
   */
  private async deliverMessage(message: AgentMessage): Promise<void> {
    const recipients = this.getRecipients(message.to)
    
    for (const recipientId of recipients) {
      // Find matching subscriptions
      for (const subscription of this.subscriptions.values()) {
        if (subscription.agentId === recipientId && 
            (subscription.types.includes(message.type) || subscription.types.length === 0)) {
          try {
            await subscription.handler(message)
            message.metadata.acknowledged = true
          } catch (error) {
            console.error(`Failed to deliver message ${message.id} to ${recipientId}:`, error)
            // Could implement retry logic here
          }
        }
      }
    }
    
    // Store in history
    this.messageHistory.push(message)
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.shift()
    }
    
    this.emit('message:delivered', message)
  }

  /**
   * Get message recipients
   */
  private getRecipients(to: AgentId | 'broadcast' | AgentId[]): AgentId[] {
    if (to === 'broadcast') {
      return Array.from(this.agents.keys())
    }
    
    if (Array.isArray(to)) {
      return to
    }
    
    return [to]
  }

  /**
   * Update agent heartbeat
   */
  heartbeat(agentId: AgentId, status?: AgentInfo['status'], currentTask?: string): void {
    const agent = this.agents.get(agentId)
    if (agent) {
      agent.lastHeartbeat = new Date().toISOString()
      if (status) agent.status = status
      if (currentTask !== undefined) agent.currentTask = currentTask
      
      this.emit('agent:heartbeat', { agentId, status: agent.status })
    }
  }

  /**
   * Check for dead agents
   */
  private checkHeartbeats(): void {
    const now = Date.now()
    const timeout = 30000 // 30 seconds
    
    for (const [agentId, agent] of this.agents) {
      const lastHeartbeat = new Date(agent.lastHeartbeat).getTime()
      if (now - lastHeartbeat > timeout && agent.status !== 'offline') {
        agent.status = 'offline'
        this.emit('agent:timeout', { agentId })
      }
    }
  }

  /**
   * Get agent info
   */
  getAgentInfo(agentId: AgentId): AgentInfo | undefined {
    return this.agents.get(agentId)
  }

  /**
   * Get all agents
   */
  getAllAgents(): AgentInfo[] {
    return Array.from(this.agents.values())
  }

  /**
   * Get available agents (idle or low workload)
   */
  getAvailableAgents(): AgentInfo[] {
    return this.getAllAgents().filter(
      agent => agent.status === 'idle' && agent.workload < 5
    )
  }

  /**
   * Find agent with capability
   */
  findAgentWithCapability(capability: string): AgentInfo | undefined {
    return this.getAllAgents().find(
      agent => agent.capabilities.includes(capability) && agent.status === 'idle'
    )
  }

  /**
   * Update shared state
   */
  updateSharedState(projectId: string, updates: Partial<SharedState>): void {
    const current = this.sharedState.get(projectId) || {
      projectId,
      taskId: '',
      context: {},
      decisions: [],
      knowledge: [],
      conflicts: []
    }
    
    this.sharedState.set(projectId, { ...current, ...updates })
    this.broadcast('orchestrator', 'state.updated', { projectId, updates })
  }

  /**
   * Get shared state
   */
  getSharedState(projectId: string): SharedState | undefined {
    return this.sharedState.get(projectId)
  }

  /**
   * Propose a decision
   */
  proposeDecision(
    projectId: string,
    proposer: AgentId,
    topic: string,
    options: string[]
  ): string {
    const decisionId = `dec_${Date.now().toString(36)}`
    
    const decision: DecisionRecord = {
      id: decisionId,
      proposer,
      topic,
      options,
      votes: {},
      timestamp: new Date().toISOString()
    }
    
    const state = this.sharedState.get(projectId)
    if (state) {
      state.decisions.push(decision)
    }
    
    // Request votes from relevant agents
    this.broadcast(proposer, 'decision.proposed', { projectId, decisionId, topic, options })
    
    return decisionId
  }

  /**
   * Vote on a decision
   */
  vote(
    projectId: string,
    decisionId: string,
    agentId: AgentId,
    choice: string
  ): void {
    const state = this.sharedState.get(projectId)
    if (!state) return
    
    const decision = state.decisions.find(d => d.id === decisionId)
    if (!decision) return
    
    decision.votes[agentId] = choice
    
    // Check if all votes collected
    if (Object.keys(decision.votes).length >= 3) {
      this.resolveDecision(projectId, decisionId)
    }
  }

  /**
   * Resolve a decision
   */
  private resolveDecision(projectId: string, decisionId: string): void {
    const state = this.sharedState.get(projectId)
    if (!state) return
    
    const decision = state.decisions.find(d => d.id === decisionId)
    if (!decision || decision.result) return
    
    // Count votes
    const voteCounts: Record<string, number> = {}
    for (const vote of Object.values(decision.votes)) {
      voteCounts[vote] = (voteCounts[vote] || 0) + 1
    }
    
    // Find winner (simple majority)
    let maxVotes = 0
    let winner = ''
    for (const [option, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count
        winner = option
      }
    }
    
    decision.result = winner
    
    // Broadcast result
    this.broadcast('orchestrator', 'decision.voted', { projectId, decisionId, result: winner })
  }

  /**
   * Share knowledge
   */
  shareKnowledge(
    projectId: string,
    agentId: AgentId,
    type: KnowledgeRecord['type'],
    content: string,
    confidence: number
  ): void {
    const knowledgeId = `know_${Date.now().toString(36)}`
    
    const knowledge: KnowledgeRecord = {
      id: knowledgeId,
      agentId,
      type,
      content,
      confidence,
      timestamp: new Date().toISOString()
    }
    
    const state = this.sharedState.get(projectId)
    if (state) {
      state.knowledge.push(knowledge)
    }
    
    this.broadcast(agentId, 'knowledge.shared', { projectId, knowledge })
  }

  /**
   * Report conflict
   */
  reportConflict(
    projectId: string,
    type: ConflictRecord['type'],
    parties: AgentId[],
    description: string
  ): string {
    const conflictId = `conf_${Date.now().toString(36)}`
    
    const conflict: ConflictRecord = {
      id: conflictId,
      type,
      parties,
      description,
      timestamp: new Date().toISOString()
    }
    
    const state = this.sharedState.get(projectId)
    if (state) {
      state.conflicts.push(conflict)
    }
    
    // Notify orchestrator
    this.broadcast('orchestrator', 'conflict.detected', { projectId, conflict })
    
    return conflictId
  }

  /**
   * Resolve conflict
   */
  resolveConflict(
    projectId: string,
    conflictId: string,
    resolvedBy: AgentId,
    resolution: string
  ): void {
    const state = this.sharedState.get(projectId)
    if (!state) return
    
    const conflict = state.conflicts.find(c => c.id === conflictId)
    if (!conflict) return
    
    conflict.resolution = resolution
    conflict.resolvedBy = resolvedBy
    
    // Broadcast resolution
    this.broadcast(resolvedBy, 'conflict.resolved', { projectId, conflictId, resolution })
  }

  /**
   * Request help
   */
  requestHelp(
    from: AgentId,
    issue: string,
    requiredCapability?: string
  ): void {
    // Find agent with required capability
    let helper: AgentInfo | undefined
    
    if (requiredCapability) {
      helper = this.findAgentWithCapability(requiredCapability)
    } else {
      helper = this.getAvailableAgents()[0]
    }
    
    if (helper) {
      this.send(from, helper.id, 'help.requested', { issue, requiredCapability }, { priority: 'high' })
    } else {
      // Broadcast to all
      this.broadcast(from, 'help.requested', { issue, requiredCapability })
    }
  }

  /**
   * Get message history
   */
  getMessageHistory(filter?: {
    from?: AgentId
    to?: AgentId | 'broadcast'
    type?: MessageType
    limit?: number
  }): AgentMessage[] {
    let messages = [...this.messageHistory]
    
    if (filter) {
      if (filter.from) {
        messages = messages.filter(m => m.from === filter.from)
      }
      if (filter.to) {
        messages = messages.filter(m => m.to === filter.to)
      }
      if (filter.type) {
        messages = messages.filter(m => m.type === filter.type)
      }
      if (filter.limit) {
        messages = messages.slice(-filter.limit)
      }
    }
    
    return messages
  }

  /**
   * Get statistics
   */
  getStats(): {
    agents: { total: number; active: number; idle: number; offline: number }
    messages: { queued: number; historySize: number; todayCount: number }
    projects: number
  } {
    const agents = this.getAllAgents()
    
    return {
      agents: {
        total: agents.length,
        active: agents.filter(a => a.status === 'working').length,
        idle: agents.filter(a => a.status === 'idle').length,
        offline: agents.filter(a => a.status === 'offline').length
      },
      messages: {
        queued: this.messageQueue.size(),
        historySize: this.messageHistory.length,
        todayCount: this.messageHistory.filter(
          m => new Date(m.metadata.timestamp).toDateString() === new Date().toDateString()
        ).length
      },
      projects: this.sharedState.size
    }
  }

  /**
   * Shutdown the message bus
   */
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
    }
    
    this.messageQueue.clear()
    this.subscriptions.clear()
    this.removeAllListeners()
  }
}

// Export singleton
export const messageBus = AgentMessageBus.getInstance()

/**
 * Create a message bus client for an agent
 */
export function createAgentClient(agentId: AgentId) {
  return {
    id: agentId,
    
    subscribe: (types: MessageType[], handler: (message: AgentMessage) => Promise<void> | void) => {
      return messageBus.subscribe(agentId, types, handler)
    },
    
    unsubscribe: (subscriptionId: string) => {
      messageBus.unsubscribe(subscriptionId)
    },
    
    send: (to: AgentId | AgentId[], type: MessageType, payload: any, options?: any) => {
      return messageBus.send(agentId, to, type, payload, options)
    },
    
    broadcast: (type: MessageType, payload: any) => {
      messageBus.broadcast(agentId, type, payload)
    },
    
    sendAndWait: (to: AgentId, type: MessageType, payload: any, timeout?: number) => {
      return messageBus.sendAndWait(agentId, to, type, payload, timeout)
    },
    
    heartbeat: (status?: AgentInfo['status'], currentTask?: string) => {
      messageBus.heartbeat(agentId, status, currentTask)
    },
    
    shareKnowledge: (projectId: string, type: KnowledgeRecord['type'], content: string, confidence: number) => {
      messageBus.shareKnowledge(projectId, agentId, type, content, confidence)
    },
    
    requestHelp: (issue: string, requiredCapability?: string) => {
      messageBus.requestHelp(agentId, issue, requiredCapability)
    },
    
    proposeDecision: (projectId: string, topic: string, options: string[]) => {
      return messageBus.proposeDecision(projectId, agentId, topic, options)
    },
    
    vote: (projectId: string, decisionId: string, choice: string) => {
      messageBus.vote(projectId, decisionId, agentId, choice)
    },
    
    reportConflict: (projectId: string, type: ConflictRecord['type'], parties: AgentId[], description: string) => {
      return messageBus.reportConflict(projectId, type, parties, description)
    },
    
    resolveConflict: (projectId: string, conflictId: string, resolution: string) => {
      messageBus.resolveConflict(projectId, conflictId, agentId, resolution)
    },
    
    getSharedState: (projectId: string) => {
      return messageBus.getSharedState(projectId)
    },
    
    updateSharedState: (projectId: string, updates: Partial<SharedState>) => {
      messageBus.updateSharedState(projectId, updates)
    }
  }
}
