/**
 * Dead-End Detection System
 * 
 * Detects unproductive reasoning paths, infinite loops, and dead-ends
 * in the reasoning process to improve efficiency and prevent wasted computation.
 * 
 * Mechanism #89 from the 520-mechanism checklist
 */

// ============================================================================
// Types
// ============================================================================

export interface ReasoningPath {
  id: string
  steps: ReasoningStep[]
  currentDepth: number
  maxDepth: number
  createdAt: Date
  status: PathStatus
  terminationReason?: string
  confidence: number
  metadata: Record<string, unknown>
}

export type PathStatus = 'active' | 'completed' | 'dead_end' | 'abandoned' | 'cycle_detected'

export interface ReasoningStep {
  id: string
  action: string
  result: unknown
  confidence: number
  timeToComplete: number
  dependencies: string[]
  generatedBranches: string[]
  stateChanges: Record<string, unknown>
  metadata: Record<string, unknown>
}

export interface DeadEnd {
  pathId: string
  stepId: string
  type: DeadEndType
  description: string
  detectedAt: Date
  recoverable: boolean
  recoveryOptions: RecoveryOption[]
  context: Record<string, unknown>
}

export type DeadEndType = 
  | 'infinite_loop'
  | 'circular_dependency'
  | 'impossible_goal'
  | 'insufficient_resources'
  | 'invalid_state'
  | 'timeout'
  | 'depth_limit'
  | 'no_progress'

export interface RecoveryOption {
  type: RecoveryType
  description: string
  estimatedEffort: 'low' | 'medium' | 'high'
  successProbability: number
  steps: string[]
}

export type RecoveryType = 'backtrack' | 'restart' | 'modify_goal' | 'change_strategy' | 'request_input'

export interface DetectionConfig {
  maxDepth: number
  maxRepetitions: number
  minProgressPerStep: number
  detectCycles: boolean
  detectStagnation: boolean
  historyWindow: number
  pathTimeout: number
}

export interface DetectionResult {
  isDeadEnd: boolean
  deadEndType?: DeadEndType
  confidence: number
  details: string
  historyLength: number
  repeatedPatterns: string[]
  cycleDetected: boolean
  recoveryOptions: RecoveryOption[]
}

export interface DetectionStats {
  totalPathsAnalyzed: number
  deadEndsDetected: number
  cyclesDetected: number
  stagnationDetected: number
  averagePathLength: number
  averageTimeToDetect: number
  recoverySuccessRate: number
  byType: Record<DeadEndType, number>
}

// ============================================================================
// Dead-End Detector Class
// ============================================================================

export class DeadEndDetector {
  private config: DetectionConfig
  private pathHistory: Map<string, ReasoningPath> = new Map()
  private stepHistory: Map<string, ReasoningStep[]> = new Map()
  private stateHistory: Map<string, unknown[]> = new Map()
  private deadEnds: Map<string, DeadEnd> = new Map()
  private stats: DetectionStats
  private pathLengths: number[] = []
  private detectionTimes: number[] = []
  private recoveredCount = 0
  private totalRecoveryAttempts = 0

  constructor(config?: Partial<DetectionConfig>) {
    this.config = {
      maxDepth: 100,
      maxRepetitions: 3,
      minProgressPerStep: 0.01,
      detectCycles: true,
      detectStagnation: true,
      historyWindow: 10,
      pathTimeout: 60000,
      ...config
    }
    this.stats = this.initStats()
  }

  private initStats(): DetectionStats {
    return {
      totalPathsAnalyzed: 0,
      deadEndsDetected: 0,
      cyclesDetected: 0,
      stagnationDetected: 0,
      averagePathLength: 0,
      averageTimeToDetect: 0,
      recoverySuccessRate: 0,
      byType: {} as Record<DeadEndType, number>
    }
  }

  startPath(metadata?: Record<string, unknown>): string {
    const id = `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const path: ReasoningPath = {
      id,
      steps: [],
      currentDepth: 0,
      maxDepth: this.config.maxDepth,
      createdAt: new Date(),
      status: 'active',
      confidence: 1.0,
      metadata: metadata || {}
    }
    
    this.pathHistory.set(id, path)
    this.stepHistory.set(id, [])
    this.stateHistory.set(id, [])
    this.stats.totalPathsAnalyzed++
    
    return id
  }

  addStep(
    pathId: string,
    action: string,
    result: unknown,
    confidence: number = 1.0,
    metadata?: Record<string, unknown>
  ): boolean {
    const path = this.pathHistory.get(pathId)
    if (!path) return false

    const step: ReasoningStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      result,
      confidence,
      timeToComplete: 0,
      dependencies: [],
      generatedBranches: [],
      stateChanges: {},
      metadata: metadata || {}
    }

    path.steps.push(step)
    path.currentDepth++
    
    const history = this.stepHistory.get(pathId) || []
    history.push(step)
    this.stepHistory.set(pathId, history)

    const states = this.stateHistory.get(pathId) || []
    states.push(result)
    this.stateHistory.set(pathId, states)

    const detection = this.detect(pathId)
    if (detection.isDeadEnd) {
      path.status = 'dead_end'
      this.recordDeadEnd(pathId, step.id, detection)
      return false
    }

    return true
  }

  detect(pathId: string): DetectionResult {
    const startTime = Date.now()
    const path = this.pathHistory.get(pathId)
    const history = this.stepHistory.get(pathId) || []
    const states = this.stateHistory.get(pathId) || []

    if (!path) {
      return {
        isDeadEnd: true,
        deadEndType: 'invalid_state',
        confidence: 1.0,
        details: 'Path not found',
        historyLength: 0,
        repeatedPatterns: [],
        cycleDetected: false,
        recoveryOptions: []
      }
    }

    if (path.currentDepth >= path.maxDepth) {
      return this.createDeadEndResult('depth_limit', 'Maximum path depth reached', 1.0, pathId, history)
    }

    const elapsed = Date.now() - path.createdAt.getTime()
    if (elapsed > this.config.pathTimeout) {
      return this.createDeadEndResult('timeout', 'Path exceeded time limit', 1.0, pathId, history)
    }

    if (this.config.detectCycles) {
      const cycleResult = this.detectCycles(states)
      if (cycleResult.hasCycle) {
        return this.createDeadEndResult('infinite_loop', `Cycle detected: ${cycleResult.cycleLength} steps`, 0.95, pathId, history)
      }
    }

    if (this.config.detectStagnation) {
      const stagnation = this.detectStagnation(history)
      if (stagnation.isStagnant) {
        return this.createDeadEndResult('no_progress', stagnation.reason, 0.9, pathId, history)
      }
    }

    const repetition = this.detectRepetition(history)
    if (repetition.hasRepetition) {
      return this.createDeadEndResult('circular_dependency', `Repeated action: ${repetition.action}`, 0.9, pathId, history)
    }

    const goalCheck = this.checkGoalFeasibility(path)
    if (!goalCheck.feasible) {
      return this.createDeadEndResult('impossible_goal', goalCheck.reason, 0.8, pathId, history)
    }

    this.detectionTimes.push(Date.now() - startTime)
    if (this.detectionTimes.length > 0) {
      this.stats.averageTimeToDetect = this.detectionTimes.reduce((a, b) => a + b, 0) / this.detectionTimes.length
    }

    return {
      isDeadEnd: false,
      confidence: path.confidence,
      details: 'Path is still productive',
      historyLength: history.length,
      repeatedPatterns: [],
      cycleDetected: false,
      recoveryOptions: []
    }
  }

  private detectCycles(states: unknown[]): { hasCycle: boolean; cycleLength: number } {
    if (states.length < 3) return { hasCycle: false, cycleLength: 0 }

    const hashes = states.map(s => this.hashState(s))
    
    for (let len = 2; len <= Math.min(5, Math.floor(hashes.length / 2)); len++) {
      const lastN = hashes.slice(-len)
      const prevN = hashes.slice(-2 * len, -len)
      if (JSON.stringify(lastN) === JSON.stringify(prevN)) {
        return { hasCycle: true, cycleLength: len }
      }
    }

    const uniqueHashes = new Set(hashes)
    if (uniqueHashes.size < hashes.length * 0.5) {
      return { hasCycle: true, cycleLength: 1 }
    }

    return { hasCycle: false, cycleLength: 0 }
  }

  private detectStagnation(history: ReasoningStep[]): { isStagnant: boolean; reason: string } {
    if (history.length < 3) return { isStagnant: false, reason: '' }

    const window = Math.min(this.config.historyWindow, history.length)
    const recentSteps = history.slice(-window)
    const confidences = recentSteps.map(s => s.confidence)
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length
    
    const firstHalf = confidences.slice(0, Math.floor(window / 2))
    const secondHalf = confidences.slice(Math.floor(window / 2))
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

    if (secondAvg < firstAvg * 0.8) {
      this.stats.stagnationDetected++
      return { isStagnant: true, reason: 'Confidence decreasing over time' }
    }

    if (avgConfidence < this.config.minProgressPerStep) {
      this.stats.stagnationDetected++
      return { isStagnant: true, reason: 'Progress below threshold' }
    }

    return { isStagnant: false, reason: '' }
  }

  private detectRepetition(history: ReasoningStep[]): { hasRepetition: boolean; action: string } {
    if (history.length < this.config.maxRepetitions) return { hasRepetition: false, action: '' }

    const recentActions = history.slice(-this.config.maxRepetitions).map(s => s.action)
    const uniqueActions = new Set(recentActions)

    if (uniqueActions.size === 1) {
      return { hasRepetition: true, action: recentActions[0] }
    }

    if (recentActions.length >= 4) {
      const a = recentActions[0]
      const b = recentActions[1]
      if (recentActions[2] === a && recentActions[3] === b) {
        return { hasRepetition: true, action: `${a} <-> ${b}` }
      }
    }

    return { hasRepetition: false, action: '' }
  }

  private checkGoalFeasibility(path: ReasoningPath): { feasible: boolean; reason: string } {
    if (path.confidence < 0.1) return { feasible: false, reason: 'Confidence too low' }
    if (path.currentDepth > path.maxDepth * 0.9 && path.confidence < 0.5) {
      return { feasible: false, reason: 'Low confidence at high depth' }
    }
    return { feasible: true, reason: '' }
  }

  private createDeadEndResult(
    type: DeadEndType,
    details: string,
    confidence: number,
    pathId: string,
    history: ReasoningStep[]
  ): DetectionResult {
    this.stats.deadEndsDetected++
    this.stats.byType[type] = (this.stats.byType[type] || 0) + 1

    const path = this.pathHistory.get(pathId)
    this.pathLengths.push(history.length)
    this.stats.averagePathLength = this.pathLengths.reduce((a, b) => a + b, 0) / this.pathLengths.length

    if (type === 'infinite_loop') this.stats.cyclesDetected++

    const recoveryOptions = this.generateRecoveryOptions(type, path)

    return {
      isDeadEnd: true,
      deadEndType: type,
      confidence,
      details,
      historyLength: history.length,
      repeatedPatterns: this.findRepeatedPatterns(history),
      cycleDetected: type === 'infinite_loop',
      recoveryOptions
    }
  }

  private generateRecoveryOptions(type: DeadEndType, _path: ReasoningPath | undefined): RecoveryOption[] {
    const options: RecoveryOption[] = []

    switch (type) {
      case 'infinite_loop':
        options.push({
          type: 'backtrack',
          description: 'Backtrack to a previous decision point',
          estimatedEffort: 'low',
          successProbability: 0.7,
          steps: ['Identify loop start', 'Select alternative', 'Continue']
        })
        break
      case 'impossible_goal':
        options.push({
          type: 'request_input',
          description: 'Request additional input',
          estimatedEffort: 'low',
          successProbability: 0.9,
          steps: ['Identify missing info', 'Request clarification', 'Continue']
        })
        break
      default:
        options.push({
          type: 'backtrack',
          description: 'Backtrack and try different approach',
          estimatedEffort: 'medium',
          successProbability: 0.6,
          steps: ['Go back', 'Try alternative']
        })
    }

    return options
  }

  private findRepeatedPatterns(history: ReasoningStep[]): string[] {
    const patterns: string[] = []
    const actionCounts = new Map<string, number>()

    for (const step of history) {
      const count = actionCounts.get(step.action) || 0
      actionCounts.set(step.action, count + 1)
    }

    for (const [action, count] of actionCounts) {
      if (count > 2) patterns.push(`${action} (x${count})`)
    }

    return patterns
  }

  private recordDeadEnd(pathId: string, stepId: string, result: DetectionResult): void {
    const deadEnd: DeadEnd = {
      pathId,
      stepId,
      type: result.deadEndType || 'invalid_state',
      description: result.details,
      detectedAt: new Date(),
      recoverable: result.recoveryOptions.length > 0,
      recoveryOptions: result.recoveryOptions,
      context: { confidence: result.confidence, historyLength: result.historyLength }
    }
    this.deadEnds.set(pathId, deadEnd)
  }

  markRecovered(pathId: string): void {
    const deadEnd = this.deadEnds.get(pathId)
    if (deadEnd) {
      this.recoveredCount++
      this.totalRecoveryAttempts++
      this.stats.recoverySuccessRate = this.recoveredCount / this.totalRecoveryAttempts
      const path = this.pathHistory.get(pathId)
      if (path) path.status = 'active'
    }
  }

  endPath(pathId: string, reason: 'completed' | 'abandoned'): void {
    const path = this.pathHistory.get(pathId)
    if (path) path.status = reason
  }

  private hashState(state: unknown): string {
    try {
      return JSON.stringify(state)
    } catch {
      return String(state)
    }
  }

  getStats(): DetectionStats { return { ...this.stats } }
  getPath(pathId: string): ReasoningPath | undefined { return this.pathHistory.get(pathId) }
  getDeadEnd(pathId: string): DeadEnd | undefined { return this.deadEnds.get(pathId) }
  getActivePaths(): ReasoningPath[] { return Array.from(this.pathHistory.values()).filter(p => p.status === 'active') }

  clear(): void {
    this.pathHistory.clear()
    this.stepHistory.clear()
    this.stateHistory.clear()
    this.deadEnds.clear()
    this.pathLengths = []
    this.detectionTimes = []
    this.recoveredCount = 0
    this.totalRecoveryAttempts = 0
    this.stats = this.initStats()
  }

  updateConfig(config: Partial<DetectionConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

let detectorInstance: DeadEndDetector | null = null

export function getDeadEndDetector(config?: Partial<DetectionConfig>): DeadEndDetector {
  if (!detectorInstance) detectorInstance = new DeadEndDetector(config)
  return detectorInstance
}

export function startReasoningPath(metadata?: Record<string, unknown>): string {
  return getDeadEndDetector().startPath(metadata)
}

export function addReasoningStep(
  pathId: string,
  action: string,
  result: unknown,
  confidence?: number,
  metadata?: Record<string, unknown>
): boolean {
  return getDeadEndDetector().addStep(pathId, action, result, confidence, metadata)
}

export function isDeadEnd(pathId: string): boolean {
  return getDeadEndDetector().detect(pathId).isDeadEnd
}

export function detectDeadEnd(pathId: string): DetectionResult {
  return getDeadEndDetector().detect(pathId)
}

export function getDeadEndDetectionStats(): DetectionStats {
  return getDeadEndDetector().getStats()
}
