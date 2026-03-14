/**
 * Agent Collaboration Engine
 * 
 * Enables multiple agents to collaborate on complex tasks:
 * - Task delegation and handoff
 * - Shared knowledge synchronization
 * - Collaborative problem solving
 * - Consensus building
 * - Conflict mediation
 */

import { EventEmitter } from 'events'
import ZAI from 'z-ai-web-dev-sdk'
import type { AgentId } from './agent-message-bus'

// Types
export interface CollaborationSession {
  id: string
  name: string
  description: string
  participants: AgentId[]
  startTime: string
  status: 'active' | 'completed' | 'paused' | 'failed'
  sharedKnowledge: SharedKnowledgeItem[]
  decisions: CollaborativeDecision[]
  tasks: CollaborativeTask[]
  messages: CollaborationMessage[]
  result?: CollaborationResult
}

export interface SharedKnowledgeItem {
  id: string
  key: string
  value: any
  source: AgentId
  timestamp: string
  confidence: number
  tags: string[]
}

export interface CollaborativeDecision {
  id: string
  topic: string
  options: DecisionOption[]
  votes: Map<AgentId, string>
  consensus: boolean
  finalDecision?: string
  createdAt: string
  resolvedAt?: string
}

export interface DecisionOption {
  id: string
  description: string
  proposer: AgentId
  pros: string[]
  cons: string[]
  votes: AgentId[]
}

export interface CollaborativeTask {
  id: string
  description: string
  assignedTo: AgentId[]
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  dependencies: string[]
  progress: number
  result?: any
  blockedReason?: string
}

export interface CollaborationMessage {
  id: string
  from: AgentId
  to: AgentId | 'all'
  type: MessageType
  content: string
  timestamp: string
  metadata?: Record<string, any>
}

export type MessageType = 
  | 'proposal'      // Proposing an idea
  | 'feedback'      // Feedback on proposal
  | 'question'      // Asking for clarification
  | 'answer'        // Answering question
  | 'update'        // Status update
  | 'request'       // Request for help
  | 'handoff'       // Hand off task
  | 'consensus'     // Announce consensus
  | 'conflict'      // Report conflict
  | 'resolution'    // Resolve conflict

export interface CollaborationResult {
  success: boolean
  duration: number
  tasksCompleted: number
  decisionsMade: number
  knowledgeShared: number
  conflictsResolved: number
  summary: string
}

export interface CollaborationOptions {
  maxParticipants: number
  decisionTimeout: number      // ms
  consensusThreshold: number    // percentage
  enableAutoConflictResolution: boolean
  enableKnowledgeSharing: boolean
}

export interface ConflictReport {
  id: string
  type: 'resource' | 'opinion' | 'approach' | 'priority'
  parties: AgentId[]
  description: string
  impact: 'low' | 'medium' | 'high'
  resolution?: ConflictResolution
  status: 'pending' | 'resolved' | 'escalated'
}

export interface ConflictResolution {
  strategy: 'voting' | 'consensus' | 'arbitration' | 'priority'
  resolution: string
  resolver: AgentId
  timestamp: string
}

// Default options
const DEFAULT_OPTIONS: CollaborationOptions = {
  maxParticipants: 5,
  decisionTimeout: 30000,
  consensusThreshold: 60,
  enableAutoConflictResolution: true,
  enableKnowledgeSharing: true
}

// Agent capabilities
const AGENT_CAPABILITIES: Record<AgentId, string[]> = {
  orchestrator: ['coordination', 'planning', 'conflict_resolution'],
  planner: ['planning', 'requirements', 'architecture'],
  coder: ['implementation', 'coding', 'refactoring'],
  debugger: ['debugging', 'analysis', 'fixing'],
  reviewer: ['review', 'optimization', 'quality'],
  tester: ['testing', 'validation', 'coverage'],
  architect: ['architecture', 'design', 'scalability'],
  deployer: ['deployment', 'infrastructure', 'monitoring']
}

/**
 * Agent Collaboration Engine
 */
export class AgentCollaborationEngine extends EventEmitter {
  private zai: any = null
  private sessions: Map<string, CollaborationSession> = new Map()
  private options: CollaborationOptions
  private sharedKnowledge: Map<string, SharedKnowledgeItem> = new Map()
  private pendingDecisions: Map<string, CollaborativeDecision> = new Map()

  constructor(options?: Partial<CollaborationOptions>) {
    super()
    this.options = { ...DEFAULT_OPTIONS, ...options }
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
   * Start a collaboration session
   */
  async startSession(
    name: string,
    description: string,
    participants: AgentId[]
  ): Promise<CollaborationSession> {
    // Validate participants
    const validParticipants = participants.slice(0, this.options.maxParticipants)
    
    const session: CollaborationSession = {
      id: `session_${Date.now().toString(36)}`,
      name,
      description,
      participants: validParticipants,
      startTime: new Date().toISOString(),
      status: 'active',
      sharedKnowledge: [],
      decisions: [],
      tasks: [],
      messages: []
    }

    this.sessions.set(session.id, session)
    this.emit('session:started', session)

    // Send invitation messages to participants
    for (const agentId of validParticipants) {
      this.addMessage(session.id, 'orchestrator', agentId, 'request', 
        `You have been invited to collaborate on: ${name}`)
    }

    return session
  }

  /**
   * End a collaboration session
   */
  async endSession(sessionId: string): Promise<CollaborationResult> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    // Calculate result
    const startTime = new Date(session.startTime).getTime()
    const duration = Date.now() - startTime

    const result: CollaborationResult = {
      success: session.tasks.filter(t => t.status === 'completed').length > 0,
      duration,
      tasksCompleted: session.tasks.filter(t => t.status === 'completed').length,
      decisionsMade: session.decisions.filter(d => d.consensus).length,
      knowledgeShared: session.sharedKnowledge.length,
      conflictsResolved: session.messages.filter(m => m.type === 'resolution').length,
      summary: await this.generateSummary(session)
    }

    session.result = result
    session.status = 'completed'

    this.emit('session:ended', { session, result })

    return result
  }

  /**
   * Add a collaborative task
   */
  addTask(
    sessionId: string,
    description: string,
    assignedTo: AgentId[],
    dependencies: string[] = []
  ): CollaborativeTask {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const task: CollaborativeTask = {
      id: `task_${Date.now().toString(36)}`,
      description,
      assignedTo,
      status: 'pending',
      dependencies,
      progress: 0
    }

    session.tasks.push(task)
    this.emit('task:added', { sessionId, task })

    // Notify assigned agents
    for (const agentId of assignedTo) {
      this.addMessage(sessionId, 'orchestrator', agentId, 'request',
        `New task assigned: ${description}`)
    }

    return task
  }

  /**
   * Update task status
   */
  updateTask(
    sessionId: string,
    taskId: string,
    status: CollaborativeTask['status'],
    progress?: number,
    result?: any
  ): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const task = session.tasks.find(t => t.id === taskId)
    if (!task) return

    task.status = status
    if (progress !== undefined) task.progress = progress
    if (result !== undefined) task.result = result

    this.emit('task:updated', { sessionId, task })

    // Check if all tasks completed
    if (session.tasks.every(t => t.status === 'completed')) {
      this.emit('session:all_tasks_completed', session)
    }
  }

  /**
   * Share knowledge
   */
  shareKnowledge(
    sessionId: string,
    key: string,
    value: any,
    source: AgentId,
    confidence: number = 1,
    tags: string[] = []
  ): SharedKnowledgeItem {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const item: SharedKnowledgeItem = {
      id: `knowledge_${Date.now().toString(36)}`,
      key,
      value,
      source,
      timestamp: new Date().toISOString(),
      confidence,
      tags
    }

    session.sharedKnowledge.push(item)
    this.sharedKnowledge.set(`${sessionId}:${key}`, item)
    
    this.emit('knowledge:shared', { sessionId, item })

    // Notify all participants
    this.addMessage(sessionId, source, 'all', 'update',
      `Shared knowledge: ${key} (confidence: ${confidence})`)

    return item
  }

  /**
   * Get shared knowledge
   */
  getKnowledge(sessionId: string, key?: string): SharedKnowledgeItem | SharedKnowledgeItem[] {
    const session = this.sessions.get(sessionId)
    if (!session) return []

    if (key) {
      return session.sharedKnowledge.find(k => k.key === key) || 
        this.sharedKnowledge.get(`${sessionId}:${key}`)
    }

    return session.sharedKnowledge
  }

  /**
   * Propose a decision
   */
  proposeDecision(
    sessionId: string,
    topic: string,
    options: Omit<DecisionOption, 'votes'>[],
    proposer: AgentId
  ): CollaborativeDecision {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const decision: CollaborativeDecision = {
      id: `decision_${Date.now().toString(36)}`,
      topic,
      options: options.map(o => ({ ...o, votes: [] })),
      votes: new Map(),
      consensus: false,
      createdAt: new Date().toISOString()
    }

    session.decisions.push(decision)
    this.pendingDecisions.set(decision.id, decision)
    
    this.emit('decision:proposed', { sessionId, decision, proposer })

    // Request votes from all participants
    for (const agentId of session.participants) {
      if (agentId !== proposer) {
        this.addMessage(sessionId, proposer, agentId, 'proposal',
          `Please vote on: ${topic}\nOptions: ${options.map(o => o.description).join(', ')}`)
      }
    }

    // Set timeout for decision
    setTimeout(() => {
      this.checkConsensus(sessionId, decision.id)
    }, this.options.decisionTimeout)

    return decision
  }

  /**
   * Vote on a decision
   */
  vote(
    sessionId: string,
    decisionId: string,
    agentId: AgentId,
    optionId: string
  ): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const decision = session.decisions.find(d => d.id === decisionId)
    if (!decision) return

    // Record vote
    decision.votes.set(agentId, optionId)

    // Update option votes
    const option = decision.options.find(o => o.id === optionId)
    if (option) {
      if (!option.votes.includes(agentId)) {
        option.votes.push(agentId)
      }
    }

    this.emit('decision:voted', { sessionId, decisionId, agentId, optionId })

    // Check if all voted
    if (decision.votes.size >= session.participants.length) {
      this.checkConsensus(sessionId, decisionId)
    }
  }

  /**
   * Check for consensus
   */
  private checkConsensus(sessionId: string, decisionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const decision = session.decisions.find(d => d.id === decisionId)
    if (!decision || decision.consensus) return

    // Find option with most votes
    let maxVotes = 0
    let winningOption: DecisionOption | null = null

    for (const option of decision.options) {
      if (option.votes.length > maxVotes) {
        maxVotes = option.votes.length
        winningOption = option
      }
    }

    // Check if threshold met
    const totalVotes = decision.votes.size
    const threshold = totalVotes * (this.options.consensusThreshold / 100)

    if (winningOption && maxVotes >= threshold) {
      decision.consensus = true
      decision.finalDecision = winningOption.id
      decision.resolvedAt = new Date().toISOString()

      this.pendingDecisions.delete(decisionId)
      
      this.emit('decision:consensus', { sessionId, decision })

      // Announce to all
      this.addMessage(sessionId, 'orchestrator', 'all', 'consensus',
        `Decision reached: ${decision.topic} -> ${winningOption.description}`)
    }
  }

  /**
   * Report a conflict
   */
  reportConflict(
    sessionId: string,
    type: ConflictReport['type'],
    parties: AgentId[],
    description: string,
    impact: ConflictReport['impact']
  ): ConflictReport {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const conflict: ConflictReport = {
      id: `conflict_${Date.now().toString(36)}`,
      type,
      parties,
      description,
      impact,
      status: 'pending'
    }

    this.emit('conflict:reported', { sessionId, conflict })

    // Auto-resolve if enabled
    if (this.options.enableAutoConflictResolution) {
      this.resolveConflict(sessionId, conflict.id)
    }

    return conflict
  }

  /**
   * Resolve a conflict
   */
  async resolveConflict(
    sessionId: string,
    conflictId: string
  ): Promise<ConflictResolution | null> {
    await this.init()

    const session = this.sessions.get(sessionId)
    if (!session) return null

    // Analyze conflict with AI
    const analysis = await this.analyzeConflict(session, conflictId)
    
    const resolution: ConflictResolution = {
      strategy: analysis.strategy,
      resolution: analysis.resolution,
      resolver: 'orchestrator',
      timestamp: new Date().toISOString()
    }

    this.emit('conflict:resolved', { sessionId, conflictId, resolution })

    // Announce resolution
    this.addMessage(sessionId, 'orchestrator', 'all', 'resolution',
      `Conflict resolved: ${resolution.resolution}`)

    return resolution
  }

  /**
   * Analyze conflict with AI
   */
  private async analyzeConflict(
    session: CollaborationSession,
    conflictId: string
  ): Promise<{ strategy: ConflictResolution['strategy']; resolution: string }> {
    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { 
            role: 'assistant', 
            content: 'You are a mediator for multi-agent collaboration. Suggest conflict resolutions.' 
          },
          { 
            role: 'user', 
            content: `Analyze this conflict in collaboration "${session.name}":
            
Conflict ID: ${conflictId}
Participants: ${session.participants.join(', ')}

Suggest:
1. Resolution strategy (voting, consensus, arbitration, or priority)
2. Specific resolution text

Format as JSON: { "strategy": "...", "resolution": "..." }`
          }
        ],
        thinking: { type: 'disabled' }
      })

      const response = completion.choices[0]?.message?.content || '{}'
      return JSON.parse(response)
    } catch {
      return {
        strategy: 'priority',
        resolution: 'Priority-based resolution: proceed with highest priority agent\'s approach'
      }
    }
  }

  /**
   * Add a message
   */
  private addMessage(
    sessionId: string,
    from: AgentId,
    to: AgentId | 'all',
    type: MessageType,
    content: string,
    metadata?: Record<string, any>
  ): CollaborationMessage {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const message: CollaborationMessage = {
      id: `msg_${Date.now().toString(36)}`,
      from,
      to,
      type,
      content,
      timestamp: new Date().toISOString(),
      metadata
    }

    session.messages.push(message)
    this.emit('message:sent', { sessionId, message })

    return message
  }

  /**
   * Generate session summary
   */
  private async generateSummary(session: CollaborationSession): Promise<string> {
    const parts: string[] = []
    
    parts.push(`Collaboration "${session.name}" completed.`)
    parts.push(`Duration: ${Math.round((Date.now() - new Date(session.startTime).getTime()) / 60000)} minutes`)
    parts.push(`Participants: ${session.participants.join(', ')}`)
    parts.push(`Tasks completed: ${session.tasks.filter(t => t.status === 'completed').length}/${session.tasks.length}`)
    parts.push(`Decisions made: ${session.decisions.filter(d => d.consensus).length}`)
    parts.push(`Knowledge items shared: ${session.sharedKnowledge.length}`)

    return parts.join('\n')
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): CollaborationSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values()).filter(s => s.status === 'active')
  }

  /**
   * Get agent's sessions
   */
  getAgentSessions(agentId: AgentId): CollaborationSession[] {
    return Array.from(this.sessions.values())
      .filter(s => s.participants.includes(agentId) && s.status === 'active')
  }
}

// Singleton
let engineInstance: AgentCollaborationEngine | null = null

export function getCollaborationEngine(): AgentCollaborationEngine {
  if (!engineInstance) {
    engineInstance = new AgentCollaborationEngine()
  }
  return engineInstance
}

/**
 * Quick collaboration start
 */
export async function startCollaboration(
  name: string,
  description: string,
  participants: AgentId[]
): Promise<CollaborationSession> {
  const engine = getCollaborationEngine()
  return engine.startSession(name, description, participants)
}
