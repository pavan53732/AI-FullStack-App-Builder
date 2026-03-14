/**
 * Agent Negotiator
 * 
 * Handles negotiations and conflict resolution between agents:
 * - Multi-agent negotiation protocols
 * - Conflict detection and resolution
 * - Consensus building
 * - Trade-off analysis
 * - Compromise generation
 * 
 * Features:
 * - Structured negotiation process
 * - Multiple negotiation strategies
 * - Automatic conflict detection
 * - Win-win solution generation
 * - Agent preference learning
 */

import ZAI from 'z-ai-web-dev-sdk'
import { EventEmitter } from 'events'

// Types
export interface NegotiationSession {
  id: string
  topic: string
  participants: NegotiationParticipant[]
  status: NegotiationStatus
  proposals: Proposal[]
  currentRound: number
  maxRounds: number
  createdAt: string
  updatedAt: string
  result?: NegotiationResult
}

export interface NegotiationParticipant {
  agentId: string
  agentType: string
  position: Position
  preferences: Preference[]
  constraints: Constraint[]
  flexibility: number // 0-1, how flexible they are
  priority: 'primary' | 'secondary' | 'observer'
}

export interface Position {
  description: string
  rationale: string
  confidence: number
  nonNegotiable: boolean
}

export interface Preference {
  name: string
  value: any
  weight: number
  mustHave: boolean
}

export interface Constraint {
  type: 'hard' | 'soft'
  description: string
  impact: string
}

export type NegotiationStatus = 
  | 'pending'
  | 'in_progress'
  | 'consensus'
  | 'compromise'
  | 'impasse'
  | 'timeout'
  | 'escalated'

export interface Proposal {
  id: string
  proposerId: string
  content: any
  benefits: string[]
  costs: string[]
  acceptances: string[]
  rejections: string[]
  round: number
  score: number
}

export interface NegotiationResult {
  sessionId: string
  status: NegotiationStatus
  outcome: 'win_win' | 'compromise' | 'concession' | 'no_agreement'
  agreement?: Agreement
  roundsCompleted: number
  participantSatisfaction: Map<string, number>
  lessons: string[]
}

export interface Agreement {
  content: any
  contributors: string[]
  tradeOffs: TradeOff[]
  implementationPlan: string
}

export interface TradeOff {
  what: string
  who: string
  benefit: string
}

export interface Conflict {
  id: string
  type: ConflictType
  participants: string[]
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  detectedAt: string
  resolution?: ConflictResolution
}

export type ConflictType = 
  | 'resource_contention'
  | 'approach_disagreement'
  | 'priority_conflict'
  | 'dependency_conflict'
  | 'style_conflict'
  | 'knowledge_conflict'

export interface ConflictResolution {
  conflictId: string
  strategy: ResolutionStrategy
  resolution: string
  participantsAgreed: string[]
  implementedAt: string
}

export type ResolutionStrategy = 
  | 'compromise'
  | 'majority_vote'
  | 'priority_based'
  | 'expert_decision'
  | 'integration'
  | 'sequencing'

export interface NegotiationStrategy {
  name: string
  description: string
  applicable: (session: NegotiationSession) => boolean
  execute: (session: NegotiationSession) => Promise<Proposal>
}

/**
 * Agent Negotiator
 * 
 * Main class for handling negotiations between agents
 */
export class AgentNegotiator extends EventEmitter {
  private zai: any = null
  private sessions: Map<string, NegotiationSession> = new Map()
  private conflicts: Map<string, Conflict> = new Map()
  private strategies: Map<string, NegotiationStrategy> = new Map()
  private agentHistory: Map<string, NegotiationHistory> = new Map()

  constructor() {
    super()
    this.initializeStrategies()
  }

  /**
   * Initialize the negotiator
   */
  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
  }

  /**
   * Start a negotiation session
   */
  async startNegotiation(
    topic: string,
    participants: Omit<NegotiationParticipant, 'flexibility'>[],
    options?: { maxRounds?: number }
  ): Promise<NegotiationSession> {
    const sessionId = `neg-${Date.now().toString(36)}`
    
    // Calculate flexibility based on history
    const participantsWithFlexibility = participants.map(p => ({
      ...p,
      flexibility: this.calculateFlexibility(p.agentId)
    }))

    const session: NegotiationSession = {
      id: sessionId,
      topic,
      participants: participantsWithFlexibility,
      status: 'pending',
      proposals: [],
      currentRound: 0,
      maxRounds: options?.maxRounds || 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.sessions.set(sessionId, session)
    this.emit('negotiation_started', { session })

    return session
  }

  /**
   * Run negotiation to completion
   */
  async runNegotiation(sessionId: string): Promise<NegotiationResult> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    session.status = 'in_progress'
    this.emit('negotiation_progress', { sessionId, round: 0 })

    // Run negotiation rounds
    while (session.currentRound < session.maxRounds) {
      session.currentRound++
      this.emit('negotiation_progress', { sessionId, round: session.currentRound })

      // Check for conflicts
      const conflicts = this.detectConflicts(session)
      if (conflicts.length > 0) {
        await this.resolveConflicts(conflicts)
      }

      // Generate proposals
      const proposal = await this.generateProposal(session)
      session.proposals.push(proposal)

      // Evaluate proposal
      const evaluations = await this.evaluateProposal(session, proposal)
      
      // Check for consensus
      if (this.checkConsensus(proposal, session.participants.length)) {
        return this.finalizeNegotiation(session, 'consensus', proposal)
      }

      // Update positions
      await this.updatePositions(session, evaluations)
    }

    // Check if we can reach compromise
    const bestProposal = this.findBestProposal(session)
    if (bestProposal && bestProposal.score > 0.5) {
      return this.finalizeNegotiation(session, 'compromise', bestProposal)
    }

    // No agreement
    return this.finalizeNegotiation(session, 'impasse')
  }

  /**
   * Detect conflicts in a session
   */
  private detectConflicts(session: NegotiationSession): Conflict[] {
    const conflicts: Conflict[] = []
    const participants = session.participants

    // Check for position conflicts
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const p1 = participants[i]
        const p2 = participants[j]

        // Check if positions are incompatible
        if (this.arePositionsIncompatible(p1.position, p2.position)) {
          conflicts.push({
            id: `conflict-${Date.now().toString(36)}`,
            type: this.inferConflictType(p1, p2),
            participants: [p1.agentId, p2.agentId],
            description: `Position conflict between ${p1.agentId} and ${p2.agentId}`,
            severity: this.calculateSeverity(p1, p2),
            detectedAt: new Date().toISOString()
          })
        }
      }
    }

    // Store conflicts
    for (const conflict of conflicts) {
      this.conflicts.set(conflict.id, conflict)
    }

    return conflicts
  }

  /**
   * Resolve conflicts
   */
  private async resolveConflicts(conflicts: Conflict[]): Promise<void> {
    for (const conflict of conflicts) {
      const strategy = this.selectResolutionStrategy(conflict)
      
      const resolution: ConflictResolution = {
        conflictId: conflict.id,
        strategy,
        resolution: await this.generateResolution(conflict, strategy),
        participantsAgreed: [],
        implementedAt: new Date().toISOString()
      }

      conflict.resolution = resolution
      this.emit('conflict_resolved', { conflict, resolution })
    }
  }

  /**
   * Generate a proposal
   */
  private async generateProposal(session: NegotiationSession): Promise<Proposal> {
    const participants = session.participants
    
    // Find common ground
    const commonPrefs = this.findCommonPreferences(participants)
    const tradeOffs = this.identifyTradeOffs(participants)

    // Use AI to generate proposal
    const proposalContent = await this.aiGenerateProposal(session, commonPrefs, tradeOffs)

    const proposal: Proposal = {
      id: `prop-${Date.now().toString(36)}`,
      proposerId: 'negotiator',
      content: proposalContent,
      benefits: this.identifyBenefits(proposalContent, participants),
      costs: this.identifyCosts(proposalContent, participants),
      acceptances: [],
      rejections: [],
      round: session.currentRound,
      score: 0
    }

    return proposal
  }

  /**
   * Evaluate a proposal
   */
  private async evaluateProposal(
    session: NegotiationSession,
    proposal: Proposal
  ): Promise<Map<string, { accepted: boolean; satisfaction: number }>> {
    const evaluations = new Map<string, { accepted: boolean; satisfaction: number }>()

    for (const participant of session.participants) {
      const satisfaction = this.calculateSatisfaction(proposal, participant)
      const accepted = satisfaction >= (1 - participant.flexibility / 2)

      evaluations.set(participant.agentId, { accepted, satisfaction })

      if (accepted) {
        proposal.acceptances.push(participant.agentId)
      } else {
        proposal.rejections.push(participant.agentId)
      }
    }

    // Calculate proposal score
    proposal.score = proposal.acceptances.length / session.participants.length

    return evaluations
  }

  /**
   * Check if consensus is reached
   */
  private checkConsensus(proposal: Proposal, totalParticipants: number): boolean {
    return proposal.acceptances.length === totalParticipants
  }

  /**
   * Update positions based on evaluations
   */
  private async updatePositions(
    session: NegotiationSession,
    evaluations: Map<string, { accepted: boolean; satisfaction: number }>
  ): Promise<void> {
    for (const participant of session.participants) {
      const eval_ = evaluations.get(participant.agentId)
      if (eval_ && !eval_.accepted) {
        // Adjust position slightly
        participant.flexibility = Math.min(1, participant.flexibility + 0.1)
      }
    }
  }

  /**
   * Finalize negotiation
   */
  private finalizeNegotiation(
    session: NegotiationSession,
    status: NegotiationStatus,
    proposal?: Proposal
  ): NegotiationResult {
    session.status = status
    session.updatedAt = new Date().toISOString()

    const result: NegotiationResult = {
      sessionId: session.id,
      status,
      outcome: this.determineOutcome(status),
      agreement: proposal ? {
        content: proposal.content,
        contributors: proposal.acceptances,
        tradeOffs: this.extractTradeOffs(proposal),
        implementationPlan: this.generateImplementationPlan(proposal)
      } : undefined,
      roundsCompleted: session.currentRound,
      participantSatisfaction: new Map(),
      lessons: this.extractLessons(session)
    }

    session.result = result

    // Update agent history
    for (const participant of session.participants) {
      this.updateAgentHistory(participant.agentId, result)
    }

    this.emit('negotiation_completed', { session, result })

    return result
  }

  /**
   * Select resolution strategy
   */
  private selectResolutionStrategy(conflict: Conflict): ResolutionStrategy {
    switch (conflict.type) {
      case 'resource_contention':
        return 'priority_based'
      case 'approach_disagreement':
        return 'compromise'
      case 'priority_conflict':
        return 'expert_decision'
      case 'dependency_conflict':
        return 'sequencing'
      case 'style_conflict':
        return 'integration'
      default:
        return 'compromise'
    }
  }

  /**
   * Generate resolution
   */
  private async generateResolution(
    conflict: Conflict,
    strategy: ResolutionStrategy
  ): Promise<string> {
    // In production, would use AI
    const resolutions: Record<ResolutionStrategy, string> = {
      compromise: 'Both parties agree to partial concessions',
      majority_vote: 'Decision by majority preference',
      priority_based: 'Higher priority task takes precedence',
      expert_decision: 'Expert agent makes final decision',
      integration: 'Integrate both approaches where possible',
      sequencing: 'Execute in optimal sequence'
    }

    return resolutions[strategy]
  }

  // Helper methods

  private calculateFlexibility(agentId: string): number {
    const history = this.agentHistory.get(agentId)
    if (!history) return 0.5
    
    // Calculate based on past negotiation success
    return history.successfulCompromises / Math.max(history.totalNegotiations, 1)
  }

  private arePositionsIncompatible(p1: Position, p2: Position): boolean {
    if (p1.nonNegotiable && p2.nonNegotiable) {
      return p1.description !== p2.description
    }
    return false
  }

  private inferConflictType(p1: NegotiationParticipant, p2: NegotiationParticipant): ConflictType {
    // Simple heuristic
    if (p1.constraints.some(c => c.type === 'hard') && 
        p2.constraints.some(c => c.type === 'hard')) {
      return 'resource_contention'
    }
    return 'approach_disagreement'
  }

  private calculateSeverity(p1: NegotiationParticipant, p2: NegotiationParticipant): 'low' | 'medium' | 'high' | 'critical' {
    if (p1.position.nonNegotiable && p2.position.nonNegotiable) return 'critical'
    if (p1.position.nonNegotiable || p2.position.nonNegotiable) return 'high'
    if (p1.flexibility < 0.3 || p2.flexibility < 0.3) return 'medium'
    return 'low'
  }

  private findCommonPreferences(participants: NegotiationParticipant[]): Preference[] {
    const allPrefs = participants.flatMap(p => p.preferences)
    const prefCounts = new Map<string, number>()

    for (const pref of allPrefs) {
      prefCounts.set(pref.name, (prefCounts.get(pref.name) || 0) + 1)
    }

    return allPrefs.filter(p => prefCounts.get(p.name) === participants.length)
  }

  private identifyTradeOffs(participants: NegotiationParticipant[]): TradeOff[] {
    const tradeOffs: TradeOff[] = []

    for (const p of participants) {
      const softConstraints = p.constraints.filter(c => c.type === 'soft')
      for (const constraint of softConstraints) {
        tradeOffs.push({
          what: constraint.description,
          who: p.agentId,
          benefit: constraint.impact
        })
      }
    }

    return tradeOffs
  }

  private async aiGenerateProposal(
    session: NegotiationSession,
    commonPrefs: Preference[],
    tradeOffs: TradeOff[]
  ): Promise<any> {
    if (!this.zai) {
      return { commonGround: commonPrefs, tradeOffs }
    }

    try {
      const prompt = `Generate a negotiation proposal for:
Topic: ${session.topic}
Participants: ${session.participants.map(p => `${p.agentId} (${p.agentType})`).join(', ')}
Common preferences: ${JSON.stringify(commonPrefs)}
Available trade-offs: ${JSON.stringify(tradeOffs)}

Provide a JSON object with:
- approach: the proposed solution
- rationale: why this works
- benefits: who benefits and how
- tradeOffsMade: what concessions are made`

      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a skilled negotiator creating fair proposals.' },
          { role: 'user', content: prompt }
        ],
        thinking: { type: 'disabled' }
      })

      const response = completion.choices[0]?.message?.content || '{}'
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { commonGround: commonPrefs }
    } catch {
      return { commonGround: commonPrefs, tradeOffs }
    }
  }

  private identifyBenefits(content: any, participants: NegotiationParticipant[]): string[] {
    return participants.map(p => `Benefits ${p.agentId}: addresses ${p.preferences.filter(pref => !pref.mustHave).length} preferences`)
  }

  private identifyCosts(content: any, participants: NegotiationParticipant[]): string[] {
    return participants.map(p => `Costs ${p.agentId}: may need to adjust ${p.constraints.filter(c => c.type === 'soft').length} soft constraints`)
  }

  private calculateSatisfaction(proposal: Proposal, participant: NegotiationParticipant): number {
    // Simple satisfaction calculation
    let score = 0
    
    // Check if preferences are met
    for (const pref of participant.preferences) {
      if (proposal.content.commonGround?.some((p: Preference) => p.name === pref.name)) {
        score += pref.weight
      }
    }
    
    // Adjust for flexibility
    score *= (1 - participant.flexibility * 0.5)
    
    return Math.min(1, score)
  }

  private findBestProposal(session: NegotiationSession): Proposal | null {
    return session.proposals.reduce((best, p) => 
      (!best || p.score > best.score) ? p : best
    , null as Proposal | null)
  }

  private determineOutcome(status: NegotiationStatus): 'win_win' | 'compromise' | 'concession' | 'no_agreement' {
    switch (status) {
      case 'consensus': return 'win_win'
      case 'compromise': return 'compromise'
      case 'impasse': return 'no_agreement'
      default: return 'concession'
    }
  }

  private extractTradeOffs(proposal: Proposal): TradeOff[] {
    return proposal.costs.map(cost => ({
      what: cost,
      who: 'participants',
      benefit: 'enables agreement'
    }))
  }

  private generateImplementationPlan(proposal: Proposal): string {
    return `1. Execute agreed approach\n2. Monitor for issues\n3. Adjust as needed`
  }

  private extractLessons(session: NegotiationSession): string[] {
    const lessons: string[] = []
    
    if (session.currentRound > 3) {
      lessons.push('Consider setting clearer initial positions')
    }
    
    if (session.proposals.some(p => p.rejections.length > p.acceptances.length)) {
      lessons.push('Improve proposal generation to better balance interests')
    }
    
    return lessons
  }

  private updateAgentHistory(agentId: string, result: NegotiationResult): void {
    const history = this.agentHistory.get(agentId) || {
      totalNegotiations: 0,
      successfulCompromises: 0
    }
    
    history.totalNegotiations++
    if (result.outcome === 'win_win' || result.outcome === 'compromise') {
      history.successfulCompromises++
    }
    
    this.agentHistory.set(agentId, history)
  }

  private initializeStrategies(): void {
    // Default strategies
    this.strategies.set('compromise', {
      name: 'Compromise',
      description: 'Find middle ground',
      applicable: () => true,
      execute: async (session) => this.generateProposal(session)
    })
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): NegotiationSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Get conflict by ID
   */
  getConflict(conflictId: string): Conflict | undefined {
    return this.conflicts.get(conflictId)
  }
}

interface NegotiationHistory {
  totalNegotiations: number
  successfulCompromises: number
}

// Singleton instance
let negotiatorInstance: AgentNegotiator | null = null

export function getAgentNegotiator(): AgentNegotiator {
  if (!negotiatorInstance) {
    negotiatorInstance = new AgentNegotiator()
  }
  return negotiatorInstance
}

export async function negotiate(
  topic: string,
  participants: Omit<NegotiationParticipant, 'flexibility'>[]
): Promise<NegotiationResult> {
  const negotiator = getAgentNegotiator()
  if (!negotiator['zai']) {
    await negotiator.initialize()
  }
  const session = await negotiator.startNegotiation(topic, participants)
  return negotiator.runNegotiation(session.id)
}
