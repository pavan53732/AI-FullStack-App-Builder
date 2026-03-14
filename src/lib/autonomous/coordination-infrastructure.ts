/**
 * Coordination Infrastructure
 * 
 * Implements mechanisms #211-220: Comprehensive coordination infrastructure including:
 * - Coordination Graph Builder: Build coordination graphs
 * - Coordination Policy Engine: Enforce coordination policies
 * - Coordination Metrics Tracker: Track coordination metrics
 * - Coordination Replay Engine: Replay coordination sessions
 * - Coordination Simulation System: Simulate coordination scenarios
 * - Coordination Debugging Tools: Debug coordination issues
 * - Coordination Visualization Engine: Visualize coordination state
 * - Coordination Trace Logging: Log coordination traces
 * - Coordination Consistency Checker: Check coordination consistency
 * - Coordination Audit System: Audit coordination actions
 */

import { EventEmitter } from 'events'
import crypto from 'crypto'
import ZAI from 'z-ai-web-dev-sdk'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Represents a node in the coordination graph
 */
export interface CoordinationNode {
  /** Unique identifier for this node */
  id: string
  /** Type of coordination node */
  type: CoordinationNodeType
  /** The coordination content/action */
  content: string
  /** Agent responsible for this node */
  agentId: string
  /** Current status of the node */
  status: CoordinationStatus
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'critical'
  /** Dependencies on other nodes */
  dependencies: string[]
  /** Timestamp of creation */
  createdAt: string
  /** Timestamp of last update */
  updatedAt: string
  /** Result of coordination action */
  result?: CoordinationResult
  /** Metadata */
  metadata: Record<string, any>
}

/**
 * Types of coordination nodes
 */
export type CoordinationNodeType =
  | 'task'
  | 'decision'
  | 'sync_point'
  | 'barrier'
  | 'message'
  | 'resource'
  | 'event'
  | 'condition'
  | 'fork'
  | 'join'
  | 'loop'
  | 'parallel'
  | 'sequential'

/**
 * Status of a coordination node
 */
export type CoordinationStatus =
  | 'pending'
  | 'waiting'
  | 'ready'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout'

/**
 * Result of a coordination action
 */
export interface CoordinationResult {
  /** Whether the action succeeded */
  success: boolean
  /** Output data */
  output?: any
  /** Error message if failed */
  error?: string
  /** Duration in ms */
  duration: number
  /** Timestamp of completion */
  completedAt: string
}

/**
 * Represents an edge in the coordination graph
 */
export interface CoordinationEdge {
  /** Unique identifier for this edge */
  id: string
  /** Source node ID */
  sourceId: string
  /** Target node ID */
  targetId: string
  /** Type of relationship */
  relation: CoordinationRelation
  /** Whether the edge is conditional */
  conditional?: boolean
  /** Condition for the edge */
  condition?: string
  /** Weight/priority of the edge */
  weight: number
  /** Timestamp of creation */
  createdAt: string
}

/**
 * Types of coordination relations
 */
export type CoordinationRelation =
  | 'depends_on'
  | 'triggers'
  | 'enables'
  | 'disables'
  | 'synchronizes'
  | 'communicates'
  | 'forks_to'
  | 'joins_from'
  | 'alternatives'

/**
 * Complete coordination graph
 */
export interface CoordinationGraph {
  /** Unique identifier */
  id: string
  /** Name/title of the coordination */
  name: string
  /** Description */
  description: string
  /** Objective of the coordination */
  objective: string
  /** All nodes in the graph */
  nodes: Map<string, CoordinationNode>
  /** All edges in the graph */
  edges: Map<string, CoordinationEdge>
  /** Entry point node IDs */
  entryPoints: string[]
  /** Exit point node IDs */
  exitPoints: string[]
  /** Current state of the graph */
  state: GraphExecutionState
  /** Metadata */
  metadata: CoordinationGraphMetadata
  /** Timestamp of creation */
  createdAt: string
  /** Timestamp of last update */
  updatedAt: string
}

/**
 * Execution state of a coordination graph
 */
export interface GraphExecutionState {
  /** Current phase */
  phase: 'idle' | 'initializing' | 'running' | 'paused' | 'completed' | 'failed'
  /** Currently executing node IDs */
  activeNodes: string[]
  /** Completed node IDs */
  completedNodes: string[]
  /** Failed node IDs */
  failedNodes: string[]
  /** Overall progress (0-1) */
  progress: number
  /** Start time */
  startedAt?: string
  /** End time */
  endedAt?: string
  /** Total duration in ms */
  duration?: number
}

/**
 * Metadata for coordination graph
 */
export interface CoordinationGraphMetadata {
  /** Tags for categorization */
  tags: string[]
  /** Estimated complexity (1-10) */
  complexity: number
  /** Version */
  version: number
  /** Author */
  author?: string
  /** Custom properties */
  custom?: Record<string, any>
}

/**
 * Coordination policy definition
 */
export interface CoordinationPolicy {
  /** Unique identifier */
  id: string
  /** Policy name */
  name: string
  /** Policy description */
  description: string
  /** Policy rules */
  rules: PolicyRule[]
  /** Default decision */
  defaultDecision: PolicyDecision
  /** Priority (higher = evaluated first) */
  priority: number
  /** Whether the policy is enabled */
  enabled: boolean
  /** Creation timestamp */
  createdAt: string
  /** Last update timestamp */
  updatedAt: string
}

/**
 * Rule within a coordination policy
 */
export interface PolicyRule {
  /** Rule identifier */
  id: string
  /** Condition expression */
  condition: string
  /** Decision when condition matches */
  decision: PolicyDecision
  /** Reason for the decision */
  reason: string
  /** Actions to take */
  actions?: string[]
}

/**
 * Policy decision types
 */
export type PolicyDecision = 'allow' | 'deny' | 'defer' | 'escalate' | 'retry'

/**
 * Policy evaluation context
 */
export interface PolicyContext {
  /** Graph being evaluated */
  graphId: string
  /** Node being evaluated */
  nodeId: string
  /** Agent requesting the action */
  agentId: string
  /** Action being performed */
  action: string
  /** Resources involved */
  resources?: string[]
  /** Additional parameters */
  parameters?: Record<string, any>
  /** Timestamp */
  timestamp: string
}

/**
 * Policy evaluation result
 */
export interface PolicyEvaluationResult {
  /** Final decision */
  decision: PolicyDecision
  /** Reason for the decision */
  reason: string
  /** Rules that were applied */
  appliedRules: string[]
  /** Actions to take */
  actions: string[]
  /** Whether escalation is required */
  escalate: boolean
  /** Escalation level if required */
  escalationLevel?: 'supervisor' | 'admin' | 'human'
  /** Evaluation timestamp */
  evaluatedAt: string
}

/**
 * Coordination metrics
 */
export interface CoordinationMetrics {
  /** Metrics identifier */
  id: string
  /** Graph being measured */
  graphId: string
  /** Timestamp of measurement */
  timestamp: string
  /** Execution metrics */
  execution: ExecutionMetrics
  /** Performance metrics */
  performance: PerformanceMetrics
  /** Resource metrics */
  resources: ResourceMetrics
  /** Quality metrics */
  quality: QualityMetrics
  /** Agent participation metrics */
  agents: AgentParticipationMetrics
}

/**
 * Execution metrics
 */
export interface ExecutionMetrics {
  /** Total nodes */
  totalNodes: number
  /** Completed nodes */
  completedNodes: number
  /** Failed nodes */
  failedNodes: number
  /** Success rate (0-1) */
  successRate: number
  /** Average execution time per node (ms) */
  avgNodeTime: number
  /** Total execution time (ms) */
  totalTime: number
  /** Throughput (nodes/second) */
  throughput: number
  /** Retry count */
  retryCount: number
  /** Timeout count */
  timeoutCount: number
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Peak memory usage (MB) */
  peakMemoryMB: number
  /** Average CPU utilization (%) */
  avgCpuPercent: number
  /** I/O operations count */
  ioOperations: number
  /** Network calls count */
  networkCalls: number
  /** Cache hit rate (0-1) */
  cacheHitRate: number
  /** Average latency (ms) */
  avgLatencyMs: number
  /** P95 latency (ms) */
  p95LatencyMs: number
  /** P99 latency (ms) */
  p99LatencyMs: number
}

/**
 * Resource metrics
 */
export interface ResourceMetrics {
  /** Resources allocated */
  allocated: number
  /** Resources used */
  used: number
  /** Utilization rate (0-1) */
  utilizationRate: number
  /** Resource conflicts */
  conflicts: number
  /** Deadlocks detected */
  deadlocks: number
  /** Wait time for resources (ms) */
  waitTimeMs: number
}

/**
 * Quality metrics
 */
export interface QualityMetrics {
  /** Coordination correctness score (0-1) */
  correctnessScore: number
  /** Consistency score (0-1) */
  consistencyScore: number
  /** Completeness score (0-1) */
  completenessScore: number
  /** Error rate (0-1) */
  errorRate: number
  /** Warning count */
  warningCount: number
  /** Policy violations */
  policyViolations: number
}

/**
 * Agent participation metrics
 */
export interface AgentParticipationMetrics {
  /** Number of participating agents */
  activeAgents: number
  /** Agent workload distribution */
  workloadDistribution: Record<string, number>
  /** Inter-agent message count */
  messageCount: number
  /** Collaboration score (0-1) */
  collaborationScore: number
  /** Agent response times */
  agentResponseTimes: Record<string, number>
}

/**
 * Coordination trace entry
 */
export interface CoordinationTrace {
  /** Trace identifier */
  id: string
  /** Graph ID */
  graphId: string
  /** Sequence number */
  sequence: number
  /** Timestamp */
  timestamp: string
  /** Event type */
  eventType: TraceEventType
  /** Node involved */
  nodeId?: string
  /** Agent involved */
  agentId?: string
  /** Event description */
  description: string
  /** Event details */
  details: Record<string, any>
  /** Duration of the event (ms) */
  duration?: number
  /** Parent trace ID for nesting */
  parentId?: string
}

/**
 * Types of trace events
 */
export type TraceEventType =
  | 'graph_created'
  | 'graph_started'
  | 'graph_completed'
  | 'graph_failed'
  | 'node_created'
  | 'node_started'
  | 'node_completed'
  | 'node_failed'
  | 'edge_added'
  | 'sync_reached'
  | 'barrier_passed'
  | 'message_sent'
  | 'message_received'
  | 'resource_acquired'
  | 'resource_released'
  | 'decision_made'
  | 'condition_evaluated'
  | 'error_occurred'
  | 'policy_applied'
  | 'checkpoint_created'

/**
 * Audit entry for coordination actions
 */
export interface AuditEntry {
  /** Audit entry identifier */
  id: string
  /** Timestamp */
  timestamp: string
  /** Action type */
  action: AuditAction
  /** Actor (agent or system) */
  actor: string
  /** Target of the action */
  target: string
  /** Action details */
  details: Record<string, any>
  /** Result of the action */
  result: 'success' | 'failure' | 'pending'
  /** Error message if failed */
  error?: string
  /** Related entries */
  relatedEntries: string[]
  /** Session/Graph ID */
  contextId: string
}

/**
 * Types of auditable actions
 */
export type AuditAction =
  | 'create_graph'
  | 'delete_graph'
  | 'start_graph'
  | 'pause_graph'
  | 'resume_graph'
  | 'cancel_graph'
  | 'add_node'
  | 'remove_node'
  | 'update_node'
  | 'add_edge'
  | 'remove_edge'
  | 'apply_policy'
  | 'override_policy'
  | 'create_checkpoint'
  | 'restore_checkpoint'
  | 'simulate'
  | 'debug'
  | 'escalate'
  | 'resolve_conflict'

/**
 * Replay session for coordination
 */
export interface ReplaySession {
  /** Session identifier */
  id: string
  /** Graph ID being replayed */
  graphId: string
  /** Start timestamp */
  startedAt: string
  /** End timestamp */
  endedAt?: string
  /** Current position in trace */
  currentPosition: number
  /** Replay speed (1 = normal) */
  speed: number
  /** Breakpoints set */
  breakpoints: string[]
  /** Replay status */
  status: 'idle' | 'playing' | 'paused' | 'completed' | 'failed'
  /** Recorded traces */
  traces: CoordinationTrace[]
  /** Snapshot of initial state */
  initialState: CoordinationGraph
}

/**
 * Simulation result
 */
export interface SimulationResult {
  /** Simulation identifier */
  id: string
  /** Graph being simulated */
  graphId: string
  /** Timestamp */
  timestamp: string
  /** Whether simulation completed successfully */
  success: boolean
  /** Simulated execution path */
  executionPath: string[]
  /** Simulated metrics */
  metrics: CoordinationMetrics
  /** Predicted issues */
  predictedIssues: SimulationIssue[]
  /** Recommendations */
  recommendations: string[]
  /** Confidence level (0-1) */
  confidence: number
  /** Simulation duration (ms) */
  duration: number
}

/**
 * Issue predicted by simulation
 */
export interface SimulationIssue {
  /** Issue identifier */
  id: string
  /** Type of issue */
  type: 'deadlock' | 'race_condition' | 'resource_starvation' | 'timeout' | 'bottleneck'
  /** Severity */
  severity: 'low' | 'medium' | 'high' | 'critical'
  /** Description */
  description: string
  /** Affected nodes */
  affectedNodes: string[]
  /** Suggested resolution */
  suggestion: string
  /** Likelihood (0-1) */
  likelihood: number
}

/**
 * Debug session for coordination
 */
export interface DebugSession {
  /** Session identifier */
  id: string
  /** Graph being debugged */
  graphId: string
  /** Start timestamp */
  startedAt: string
  /** Debug configuration */
  config: DebugConfig
  /** Current state */
  state: DebugState
  /** Found issues */
  issues: DebugIssue[]
  /** Debug history */
  history: DebugAction[]
}

/**
 * Debug configuration
 */
export interface DebugConfig {
  /** Breakpoints */
  breakpoints: string[]
  /** Watch expressions */
  watchExpressions: string[]
  /** Trace level */
  traceLevel: 'minimal' | 'normal' | 'verbose'
  /** Auto-stop on errors */
  stopOnError: boolean
  /** Capture snapshots */
  captureSnapshots: boolean
  /** Timeout for debug session (ms) */
  timeout: number
}

/**
 * Debug state
 */
export interface DebugState {
  /** Current status */
  status: 'idle' | 'running' | 'paused' | 'stepping' | 'completed'
  /** Current node being debugged */
  currentNodeId?: string
  /** Current step number */
  stepNumber: number
  /** Last evaluated expressions */
  watchValues: Record<string, any>
  /** Call stack */
  callStack: string[]
}

/**
 * Issue found during debugging
 */
export interface DebugIssue {
  /** Issue identifier */
  id: string
  /** Issue type */
  type: 'error' | 'warning' | 'info'
  /** Node where issue was found */
  nodeId: string
  /** Issue description */
  description: string
  /** Stack trace if error */
  stackTrace?: string
  /** Suggested fix */
  suggestion?: string
  /** Timestamp */
  timestamp: string
}

/**
 * Debug action record
 */
export interface DebugAction {
  /** Action identifier */
  id: string
  /** Action type */
  type: 'step' | 'continue' | 'pause' | 'inspect' | 'evaluate' | 'set_breakpoint'
  /** Timestamp */
  timestamp: string
  /** Action details */
  details: Record<string, any>
  /** Result of the action */
  result?: any
}

/**
 * Visualization output
 */
export interface VisualizationOutput {
  /** Visualization identifier */
  id: string
  /** Graph being visualized */
  graphId: string
  /** Timestamp */
  timestamp: string
  /** Output format */
  format: 'mermaid' | 'json' | 'ascii' | 'svg' | 'html'
  /** Visualization content */
  content: string
  /** Legend */
  legend: Record<string, string>
  /** Statistics */
  statistics: VisualizationStatistics
}

/**
 * Statistics for visualization
 */
export interface VisualizationStatistics {
  /** Node count */
  nodeCount: number
  /** Edge count */
  edgeCount: number
  /** Depth of the graph */
  maxDepth: number
  /** Width of the graph (max parallel nodes) */
  maxWidth: number
  /** Critical path length */
  criticalPathLength: number
  /** Node type distribution */
  nodeTypeDistribution: Record<string, number>
}

/**
 * Consistency check result
 */
export interface ConsistencyCheckResult {
  /** Check identifier */
  id: string
  /** Graph being checked */
  graphId: string
  /** Timestamp */
  timestamp: string
  /** Whether the graph is consistent */
  consistent: boolean
  /** Issues found */
  issues: ConsistencyIssue[]
  /** Warnings */
  warnings: ConsistencyWarning[]
  /** Score (0-1) */
  score: number
  /** Recommendations */
  recommendations: string[]
}

/**
 * Consistency issue
 */
export interface ConsistencyIssue {
  /** Issue identifier */
  id: string
  /** Issue type */
  type: 'cycle' | 'orphan' | 'unreachable' | 'conflict' | 'missing_dependency'
  /** Severity */
  severity: 'error' | 'warning'
  /** Affected node IDs */
  affectedNodes: string[]
  /** Description */
  description: string
  /** Suggested fix */
  suggestion: string
}

/**
 * Consistency warning
 */
export interface ConsistencyWarning {
  /** Warning identifier */
  id: string
  /** Warning type */
  type: 'performance' | 'design' | 'best_practice'
  /** Description */
  description: string
  /** Affected nodes */
  affectedNodes: string[]
  /** Suggestion */
  suggestion: string
}

// ============================================================================
// COORDINATION GRAPH BUILDER
// Implements mechanism #211
// ============================================================================

/**
 * Builds and manages coordination graphs
 */
class CoordinationGraphBuilder {
  private graphs: Map<string, CoordinationGraph> = new Map()
  private zai: any = null

  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
  }

  /**
   * Create a new coordination graph
   */
  createGraph(
    objective: string,
    options?: {
      name?: string
      description?: string
      tags?: string[]
      author?: string
    }
  ): CoordinationGraph {
    const id = `coord_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`
    
    const graph: CoordinationGraph = {
      id,
      name: options?.name || `Coordination: ${objective.slice(0, 40)}`,
      description: options?.description || '',
      objective,
      nodes: new Map(),
      edges: new Map(),
      entryPoints: [],
      exitPoints: [],
      state: {
        phase: 'idle',
        activeNodes: [],
        completedNodes: [],
        failedNodes: [],
        progress: 0
      },
      metadata: {
        tags: options?.tags || [],
        complexity: 1,
        version: 1,
        author: options?.author
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.graphs.set(id, graph)
    return graph
  }

  /**
   * Add a node to the graph
   */
  addNode(
    graph: CoordinationGraph,
    type: CoordinationNodeType,
    content: string,
    agentId: string,
    options?: {
      priority?: 'low' | 'medium' | 'high' | 'critical'
      dependencies?: string[]
      metadata?: Record<string, any>
    }
  ): CoordinationNode {
    const id = `node_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`
    
    const node: CoordinationNode = {
      id,
      type,
      content,
      agentId,
      status: 'pending',
      priority: options?.priority || 'medium',
      dependencies: options?.dependencies || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: options?.metadata || {}
    }

    graph.nodes.set(id, node)
    graph.updatedAt = new Date().toISOString()

    // Update entry points if no dependencies
    if (node.dependencies.length === 0 && !graph.entryPoints.includes(id)) {
      graph.entryPoints.push(id)
    }

    return node
  }

  /**
   * Add an edge to the graph
   */
  addEdge(
    graph: CoordinationGraph,
    sourceId: string,
    targetId: string,
    relation: CoordinationRelation,
    options?: {
      conditional?: boolean
      condition?: string
      weight?: number
    }
  ): CoordinationEdge | null {
    const sourceNode = graph.nodes.get(sourceId)
    const targetNode = graph.nodes.get(targetId)

    if (!sourceNode || !targetNode) {
      console.error('Source or target node not found')
      return null
    }

    const id = `edge_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`
    
    const edge: CoordinationEdge = {
      id,
      sourceId,
      targetId,
      relation,
      conditional: options?.conditional,
      condition: options?.condition,
      weight: options?.weight ?? 1,
      createdAt: new Date().toISOString()
    }

    graph.edges.set(id, edge)
    
    // Update target node dependencies
    if (relation === 'depends_on' && !targetNode.dependencies.includes(sourceId)) {
      targetNode.dependencies.push(sourceId)
    }

    graph.updatedAt = new Date().toISOString()
    this.updateExitPoints(graph)

    return edge
  }

  /**
   * Build a coordination graph from a description using AI
   */
  async buildFromDescription(
    objective: string,
    context?: {
      agents?: string[]
      constraints?: string[]
      resources?: string[]
    }
  ): Promise<CoordinationGraph> {
    if (!this.zai) await this.initialize()

    const graph = this.createGraph(objective, { tags: ['ai-generated'] })

    const completion = await this.zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a coordination expert. Create a coordination graph for the given objective.
                    Specify nodes with:
                    - Type: task, decision, sync_point, barrier, message, resource, event, fork, join
                    - Content: description of the coordination action
                    - Agent: which agent handles this (orchestrator, planner, coder, etc.)
                    - Dependencies: which nodes this depends on
                    
                    Format:
                    [TYPE] content | agent: AGENT | deps: [node numbers]`
        },
        {
          role: 'user',
          content: `Objective: ${objective}
                    
                    Available agents: ${context?.agents?.join(', ') || 'orchestrator, planner, coder, reviewer'}
                    Constraints: ${context?.constraints?.join('; ') || 'none'}
                    
                    Create the coordination graph.`
        }
      ],
      thinking: { type: 'disabled' }
    })

    const response = completion.choices[0]?.message?.content || ''
    const steps = this.parseCoordinationSteps(response)
    
    // Add nodes
    const nodeIdMap = new Map<number, string>()
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const node = this.addNode(graph, step.type, step.content, step.agent)
      nodeIdMap.set(i, node.id)
    }

    // Add edges based on dependencies
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      for (const depIndex of step.dependencies) {
        const sourceId = nodeIdMap.get(depIndex)
        const targetId = nodeIdMap.get(i)
        if (sourceId && targetId) {
          this.addEdge(graph, sourceId, targetId, 'depends_on')
        }
      }
    }

    graph.metadata.complexity = Math.ceil(steps.length / 3)
    return graph
  }

  /**
   * Parse coordination steps from AI response
   */
  private parseCoordinationSteps(response: string): Array<{
    type: CoordinationNodeType
    content: string
    agent: string
    dependencies: number[]
  }> {
    const steps: Array<{
      type: CoordinationNodeType
      content: string
      agent: string
      dependencies: number[]
    }> = []

    const lines = response.split('\n')
    
    for (const line of lines) {
      const match = line.match(/\[(\w+)\]\s*(.+?)\s*\|\s*agent:\s*(\w+)\s*\|\s*deps:\s*\[([^\]]*)\]/i)
      
      if (match) {
        const type = match[1].toLowerCase() as CoordinationNodeType
        const content = match[2].trim()
        const agent = match[3].toLowerCase()
        const depsStr = match[4] || ''
        const dependencies = depsStr.split(',')
          .map(s => parseInt(s.trim()))
          .filter(n => !isNaN(n))

        steps.push({ type, content, agent, dependencies })
      }
    }

    // Fallback parsing
    if (steps.length === 0) {
      let stepIndex = 0
      for (const line of lines) {
        if (line.trim().length > 10) {
          steps.push({
            type: 'task',
            content: line.trim(),
            agent: 'orchestrator',
            dependencies: stepIndex > 0 ? [stepIndex - 1] : []
          })
          stepIndex++
        }
      }
    }

    return steps
  }

  /**
   * Update exit points based on edge structure
   */
  private updateExitPoints(graph: CoordinationGraph): void {
    const targetNodeIds = new Set(
      Array.from(graph.edges.values()).map(e => e.targetId)
    )
    
    const sourceNodeIds = new Set(
      Array.from(graph.edges.values()).map(e => e.sourceId)
    )

    // Exit points are targets that are not sources
    graph.exitPoints = Array.from(targetNodeIds)
      .filter(id => !sourceNodeIds.has(id))
    
    // Also include nodes with no outgoing edges
    for (const nodeId of graph.nodes.keys()) {
      const hasOutgoing = Array.from(graph.edges.values())
        .some(e => e.sourceId === nodeId)
      if (!hasOutgoing && !graph.exitPoints.includes(nodeId)) {
        graph.exitPoints.push(nodeId)
      }
    }
  }

  /**
   * Get a graph by ID
   */
  getGraph(graphId: string): CoordinationGraph | undefined {
    return this.graphs.get(graphId)
  }

  /**
   * Get all graphs
   */
  getAllGraphs(): CoordinationGraph[] {
    return Array.from(this.graphs.values())
  }

  /**
   * Delete a graph
   */
  deleteGraph(graphId: string): boolean {
    return this.graphs.delete(graphId)
  }

  /**
   * Clone a graph
   */
  cloneGraph(graphId: string): CoordinationGraph | null {
    const original = this.graphs.get(graphId)
    if (!original) return null

    const clone: CoordinationGraph = {
      ...original,
      id: `coord_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`,
      nodes: new Map(original.nodes),
      edges: new Map(original.edges),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.graphs.set(clone.id, clone)
    return clone
  }
}

// ============================================================================
// COORDINATION POLICY ENGINE
// Implements mechanism #212
// ============================================================================

/**
 * Enforces coordination policies
 */
class CoordinationPolicyEngine {
  private policies: Map<string, CoordinationPolicy> = new Map()
  private evaluationCache: Map<string, PolicyEvaluationResult> = new Map()

  constructor() {
    this.initializeDefaultPolicies()
  }

  /**
   * Initialize default coordination policies
   */
  private initializeDefaultPolicies(): void {
    // Maximum concurrent operations policy
    this.addPolicy({
      id: 'max_concurrent',
      name: 'Maximum Concurrent Operations',
      description: 'Limits the number of concurrent coordination operations',
      rules: [
        {
          id: 'rule_concurrent_1',
          condition: 'activeNodeCount > 10',
          decision: 'defer',
          reason: 'Too many concurrent operations',
          actions: ['queue_operation', 'notify_supervisor']
        }
      ],
      defaultDecision: 'allow',
      priority: 100,
      enabled: true
    })

    // Resource contention policy
    this.addPolicy({
      id: 'resource_contention',
      name: 'Resource Contention Prevention',
      description: 'Prevents resource contention issues',
      rules: [
        {
          id: 'rule_resource_1',
          condition: 'resourceLocks[resource] > 1',
          decision: 'defer',
          reason: 'Resource is already locked',
          actions: ['wait_for_resource', 'retry_later']
        },
        {
          id: 'rule_resource_2',
          condition: 'waitingForResource > 5',
          decision: 'escalate',
          reason: 'Resource contention detected',
          actions: ['notify_admin', 'log_event']
        }
      ],
      defaultDecision: 'allow',
      priority: 90,
      enabled: true
    })

    // Agent workload policy
    this.addPolicy({
      id: 'agent_workload',
      name: 'Agent Workload Management',
      description: 'Manages agent workload distribution',
      rules: [
        {
          id: 'rule_workload_1',
          condition: 'agentLoad[agentId] > 5',
          decision: 'defer',
          reason: 'Agent has too many active tasks',
          actions: ['redistribute_task', 'notify_agent']
        },
        {
          id: 'rule_workload_2',
          condition: 'agentLoad[agentId] > 10',
          decision: 'deny',
          reason: 'Agent overloaded',
          actions: ['reject_task', 'find_alternative']
        }
      ],
      defaultDecision: 'allow',
      priority: 80,
      enabled: true
    })

    // Circular dependency policy
    this.addPolicy({
      id: 'circular_dependency',
      name: 'Circular Dependency Prevention',
      description: 'Prevents circular dependencies in coordination',
      rules: [
        {
          id: 'rule_cycle_1',
          condition: 'hasCycle(edge)',
          decision: 'deny',
          reason: 'Would create circular dependency',
          actions: ['reject_edge', 'suggest_alternative']
        }
      ],
      defaultDecision: 'allow',
      priority: 95,
      enabled: true
    })

    // Timeout policy
    this.addPolicy({
      id: 'timeout_handling',
      name: 'Timeout Handling',
      description: 'Handles operation timeouts',
      rules: [
        {
          id: 'rule_timeout_1',
          condition: 'nodeExecutionTime > maxAllowedTime',
          decision: 'retry',
          reason: 'Operation timed out',
          actions: ['cancel_operation', 'retry_with_backoff']
        }
      ],
      defaultDecision: 'allow',
      priority: 70,
      enabled: true
    })
  }

  /**
   * Add a policy
   */
  addPolicy(policy: CoordinationPolicy): void {
    this.policies.set(policy.id, {
      ...policy,
      createdAt: policy.createdAt || new Date().toISOString(),
      updatedAt: policy.updatedAt || new Date().toISOString()
    })
  }

  /**
   * Remove a policy
   */
  removePolicy(policyId: string): boolean {
    return this.policies.delete(policyId)
  }

  /**
   * Evaluate a coordination action against policies
   */
  evaluate(
    context: PolicyContext,
    additionalData?: Record<string, any>
  ): PolicyEvaluationResult {
    const cacheKey = this.getCacheKey(context)
    
    // Check cache
    if (this.evaluationCache.has(cacheKey)) {
      return this.evaluationCache.get(cacheKey)!
    }

    const appliedRules: string[] = []
    const actions: string[] = []
    let finalDecision: PolicyDecision = 'allow'
    let finalReason = 'No policies triggered'
    let escalate = false
    let escalationLevel: 'supervisor' | 'admin' | 'human' | undefined

    // Sort policies by priority (highest first)
    const sortedPolicies = Array.from(this.policies.values())
      .filter(p => p.enabled)
      .sort((a, b) => b.priority - a.priority)

    for (const policy of sortedPolicies) {
      for (const rule of policy.rules) {
        if (this.evaluateCondition(rule.condition, context, additionalData)) {
          appliedRules.push(rule.id)
          
          // Update decision based on rule
          finalDecision = rule.decision
          finalReason = rule.reason
          
          if (rule.actions) {
            actions.push(...rule.actions)
          }

          if (rule.decision === 'escalate') {
            escalate = true
            escalationLevel = 'supervisor'
          }

          // Stop at first deny
          if (rule.decision === 'deny') {
            break
          }
        }
      }
      
      if (finalDecision === 'deny') {
        break
      }
    }

    const result: PolicyEvaluationResult = {
      decision: finalDecision,
      reason: finalReason,
      appliedRules,
      actions,
      escalate,
      escalationLevel,
      evaluatedAt: new Date().toISOString()
    }

    this.evaluationCache.set(cacheKey, result)
    return result
  }

  /**
   * Evaluate a condition expression
   */
  private evaluateCondition(
    condition: string,
    context: PolicyContext,
    additionalData?: Record<string, any>
  ): boolean {
    try {
      const fn = new Function(
        'graphId', 'nodeId', 'agentId', 'action', 'resources', 'parameters', 'data',
        `return ${condition}`
      )
      return fn(
        context.graphId,
        context.nodeId,
        context.agentId,
        context.action,
        context.resources,
        context.parameters,
        additionalData || {}
      )
    } catch {
      return false
    }
  }

  /**
   * Get cache key for a context
   */
  private getCacheKey(context: PolicyContext): string {
    return `${context.graphId}:${context.nodeId}:${context.action}`
  }

  /**
   * Get all policies
   */
  getPolicies(): CoordinationPolicy[] {
    return Array.from(this.policies.values())
  }

  /**
   * Get a policy by ID
   */
  getPolicy(policyId: string): CoordinationPolicy | undefined {
    return this.policies.get(policyId)
  }

  /**
   * Enable/disable a policy
   */
  setPolicyEnabled(policyId: string, enabled: boolean): boolean {
    const policy = this.policies.get(policyId)
    if (policy) {
      policy.enabled = enabled
      policy.updatedAt = new Date().toISOString()
      return true
    }
    return false
  }

  /**
   * Clear evaluation cache
   */
  clearCache(): void {
    this.evaluationCache.clear()
  }
}

// ============================================================================
// COORDINATION METRICS TRACKER
// Implements mechanism #213
// ============================================================================

/**
 * Tracks coordination metrics
 */
class CoordinationMetricsTracker {
  private metrics: Map<string, CoordinationMetrics[]> = new Map()
  private currentMeasurements: Map<string, {
    startTime: number
    nodeTimes: Map<string, { start: number; end?: number }>
    latencies: number[]
    memorySnapshots: number[]
  }> = new Map()

  /**
   * Start tracking metrics for a graph
   */
  startTracking(graphId: string): void {
    this.currentMeasurements.set(graphId, {
      startTime: Date.now(),
      nodeTimes: new Map(),
      latencies: [],
      memorySnapshots: [process.memoryUsage().heapUsed / 1024 / 1024]
    })
  }

  /**
   * Record node start
   */
  recordNodeStart(graphId: string, nodeId: string): void {
    const measurement = this.currentMeasurements.get(graphId)
    if (measurement) {
      measurement.nodeTimes.set(nodeId, { start: Date.now() })
    }
  }

  /**
   * Record node completion
   */
  recordNodeCompletion(graphId: string, nodeId: string, success: boolean): void {
    const measurement = this.currentMeasurements.get(graphId)
    if (measurement) {
      const nodeTime = measurement.nodeTimes.get(nodeId)
      if (nodeTime) {
        nodeTime.end = Date.now()
        measurement.latencies.push(nodeTime.end - nodeTime.start)
      }
      measurement.memorySnapshots.push(process.memoryUsage().heapUsed / 1024 / 1024)
    }
  }

  /**
   * Record a latency measurement
   */
  recordLatency(graphId: string, latencyMs: number): void {
    const measurement = this.currentMeasurements.get(graphId)
    if (measurement) {
      measurement.latencies.push(latencyMs)
    }
  }

  /**
   * Stop tracking and generate metrics
   */
  stopTracking(
    graphId: string,
    graph: CoordinationGraph,
    additionalData?: {
      retryCount?: number
      timeoutCount?: number
      resourceConflicts?: number
      deadlocks?: number
      waitTimeMs?: number
      messageCount?: number
    }
  ): CoordinationMetrics {
    const measurement = this.currentMeasurements.get(graphId)
    
    if (!measurement) {
      return this.createEmptyMetrics(graphId)
    }

    const endTime = Date.now()
    const totalTime = endTime - measurement.startTime
    const nodes = Array.from(graph.nodes.values())
    const completedNodes = nodes.filter(n => n.status === 'completed')
    const failedNodes = nodes.filter(n => n.status === 'failed')

    // Calculate node times
    const nodeTimes = Array.from(measurement.nodeTimes.values())
      .filter(t => t.end !== undefined)
      .map(t => t.end! - t.start)
    
    const avgNodeTime = nodeTimes.length > 0
      ? nodeTimes.reduce((a, b) => a + b, 0) / nodeTimes.length
      : 0

    // Calculate latency percentiles
    const sortedLatencies = [...measurement.latencies].sort((a, b) => a - b)
    const p95Index = Math.floor(sortedLatencies.length * 0.95)
    const p99Index = Math.floor(sortedLatencies.length * 0.99)

    const metrics: CoordinationMetrics = {
      id: `metrics_${Date.now().toString(36)}`,
      graphId,
      timestamp: new Date().toISOString(),
      execution: {
        totalNodes: nodes.length,
        completedNodes: completedNodes.length,
        failedNodes: failedNodes.length,
        successRate: nodes.length > 0 ? completedNodes.length / nodes.length : 0,
        avgNodeTime,
        totalTime,
        throughput: totalTime > 0 ? (completedNodes.length / totalTime) * 1000 : 0,
        retryCount: additionalData?.retryCount || 0,
        timeoutCount: additionalData?.timeoutCount || 0
      },
      performance: {
        peakMemoryMB: Math.max(...measurement.memorySnapshots),
        avgCpuPercent: 50, // Placeholder - would need actual measurement
        ioOperations: 0,
        networkCalls: 0,
        cacheHitRate: 0.8,
        avgLatencyMs: sortedLatencies.length > 0
          ? sortedLatencies.reduce((a, b) => a + b, 0) / sortedLatencies.length
          : 0,
        p95LatencyMs: sortedLatencies[p95Index] || 0,
        p99LatencyMs: sortedLatencies[p99Index] || 0
      },
      resources: {
        allocated: nodes.length,
        used: completedNodes.length,
        utilizationRate: nodes.length > 0 ? completedNodes.length / nodes.length : 0,
        conflicts: additionalData?.resourceConflicts || 0,
        deadlocks: additionalData?.deadlocks || 0,
        waitTimeMs: additionalData?.waitTimeMs || 0
      },
      quality: {
        correctnessScore: failedNodes.length > 0 ? 1 - (failedNodes.length / nodes.length) : 1,
        consistencyScore: 1,
        completenessScore: completedNodes.length / nodes.length || 0,
        errorRate: nodes.length > 0 ? failedNodes.length / nodes.length : 0,
        warningCount: 0,
        policyViolations: 0
      },
      agents: {
        activeAgents: new Set(nodes.map(n => n.agentId)).size,
        workloadDistribution: this.calculateWorkloadDistribution(nodes),
        messageCount: additionalData?.messageCount || 0,
        collaborationScore: 0.8,
        agentResponseTimes: {}
      }
    }

    // Store metrics
    if (!this.metrics.has(graphId)) {
      this.metrics.set(graphId, [])
    }
    this.metrics.get(graphId)!.push(metrics)

    this.currentMeasurements.delete(graphId)
    return metrics
  }

  /**
   * Calculate workload distribution
   */
  private calculateWorkloadDistribution(nodes: CoordinationNode[]): Record<string, number> {
    const distribution: Record<string, number> = {}
    for (const node of nodes) {
      distribution[node.agentId] = (distribution[node.agentId] || 0) + 1
    }
    return distribution
  }

  /**
   * Create empty metrics
   */
  private createEmptyMetrics(graphId: string): CoordinationMetrics {
    return {
      id: `metrics_${Date.now().toString(36)}`,
      graphId,
      timestamp: new Date().toISOString(),
      execution: {
        totalNodes: 0,
        completedNodes: 0,
        failedNodes: 0,
        successRate: 0,
        avgNodeTime: 0,
        totalTime: 0,
        throughput: 0,
        retryCount: 0,
        timeoutCount: 0
      },
      performance: {
        peakMemoryMB: 0,
        avgCpuPercent: 0,
        ioOperations: 0,
        networkCalls: 0,
        cacheHitRate: 0,
        avgLatencyMs: 0,
        p95LatencyMs: 0,
        p99LatencyMs: 0
      },
      resources: {
        allocated: 0,
        used: 0,
        utilizationRate: 0,
        conflicts: 0,
        deadlocks: 0,
        waitTimeMs: 0
      },
      quality: {
        correctnessScore: 0,
        consistencyScore: 0,
        completenessScore: 0,
        errorRate: 0,
        warningCount: 0,
        policyViolations: 0
      },
      agents: {
        activeAgents: 0,
        workloadDistribution: {},
        messageCount: 0,
        collaborationScore: 0,
        agentResponseTimes: {}
      }
    }
  }

  /**
   * Get metrics for a graph
   */
  getMetrics(graphId: string): CoordinationMetrics[] {
    return this.metrics.get(graphId) || []
  }

  /**
   * Get latest metrics
   */
  getLatestMetrics(graphId: string): CoordinationMetrics | undefined {
    const metrics = this.metrics.get(graphId)
    return metrics?.[metrics.length - 1]
  }

  /**
   * Get aggregated metrics across all graphs
   */
  getAggregatedMetrics(): {
    totalGraphs: number
    avgSuccessRate: number
    avgExecutionTime: number
    totalNodes: number
    totalErrors: number
  } {
    const allMetrics = Array.from(this.metrics.values()).flat()
    
    if (allMetrics.length === 0) {
      return {
        totalGraphs: 0,
        avgSuccessRate: 0,
        avgExecutionTime: 0,
        totalNodes: 0,
        totalErrors: 0
      }
    }

    return {
      totalGraphs: new Set(allMetrics.map(m => m.graphId)).size,
      avgSuccessRate: allMetrics.reduce((a, m) => a + m.execution.successRate, 0) / allMetrics.length,
      avgExecutionTime: allMetrics.reduce((a, m) => a + m.execution.totalTime, 0) / allMetrics.length,
      totalNodes: allMetrics.reduce((a, m) => a + m.execution.totalNodes, 0),
      totalErrors: allMetrics.reduce((a, m) => a + m.execution.failedNodes, 0)
    }
  }

  /**
   * Clear metrics history
   */
  clearHistory(graphId?: string): void {
    if (graphId) {
      this.metrics.delete(graphId)
    } else {
      this.metrics.clear()
    }
  }
}

// ============================================================================
// COORDINATION REPLAY ENGINE
// Implements mechanism #214
// ============================================================================

/**
 * Replays coordination sessions
 */
class CoordinationReplayEngine {
  private sessions: Map<string, ReplaySession> = new Map()

  /**
   * Create a replay session from traces
   */
  createSession(
    graphId: string,
    traces: CoordinationTrace[],
    initialState: CoordinationGraph
  ): ReplaySession {
    const session: ReplaySession = {
      id: `replay_${Date.now().toString(36)}`,
      graphId,
      startedAt: new Date().toISOString(),
      currentPosition: 0,
      speed: 1,
      breakpoints: [],
      status: 'idle',
      traces: [...traces].sort((a, b) => a.sequence - b.sequence),
      initialState: JSON.parse(JSON.stringify(initialState))
    }

    this.sessions.set(session.id, session)
    return session
  }

  /**
   * Start replay
   */
  startReplay(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    session.status = 'playing'
    session.startedAt = new Date().toISOString()
  }

  /**
   * Pause replay
   */
  pauseReplay(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    session.status = 'paused'
  }

  /**
   * Step to next trace event
   */
  stepNext(sessionId: string): CoordinationTrace | null {
    const session = this.sessions.get(sessionId)
    if (!session || session.currentPosition >= session.traces.length) {
      return null
    }

    const trace = session.traces[session.currentPosition]
    session.currentPosition++

    if (session.currentPosition >= session.traces.length) {
      session.status = 'completed'
      session.endedAt = new Date().toISOString()
    }

    return trace
  }

  /**
   * Step to previous trace event
   */
  stepPrevious(sessionId: string): CoordinationTrace | null {
    const session = this.sessions.get(sessionId)
    if (!session || session.currentPosition <= 0) {
      return null
    }

    session.currentPosition--
    const trace = session.traces[session.currentPosition]
    return trace
  }

  /**
   * Jump to a specific position
   */
  jumpTo(sessionId: string, position: number): CoordinationTrace | null {
    const session = this.sessions.get(sessionId)
    if (!session || position < 0 || position >= session.traces.length) {
      return null
    }

    session.currentPosition = position
    return session.traces[position]
  }

  /**
   * Set a breakpoint
   */
  setBreakpoint(sessionId: string, nodeId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    if (!session.breakpoints.includes(nodeId)) {
      session.breakpoints.push(nodeId)
    }
  }

  /**
   * Remove a breakpoint
   */
  removeBreakpoint(sessionId: string, nodeId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    session.breakpoints = session.breakpoints.filter(id => id !== nodeId)
  }

  /**
   * Play until breakpoint
   */
  playUntilBreakpoint(sessionId: string): CoordinationTrace[] {
    const session = this.sessions.get(sessionId)
    if (!session) return []

    const traces: CoordinationTrace[] = []
    session.status = 'playing'

    while (session.currentPosition < session.traces.length) {
      const trace = this.stepNext(sessionId)
      if (!trace) break

      traces.push(trace)

      // Check if trace involves a breakpoint node
      if (trace.nodeId && session.breakpoints.includes(trace.nodeId)) {
        session.status = 'paused'
        break
      }
    }

    return traces
  }

  /**
   * Set replay speed
   */
  setSpeed(sessionId: string, speed: number): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    session.speed = Math.max(0.1, Math.min(10, speed))
  }

  /**
   * Get session state
   */
  getSession(sessionId: string): ReplaySession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Close and delete a replay session
   */
  closeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId)
  }

  /**
   * Get all sessions for a graph
   */
  getSessionsForGraph(graphId: string): ReplaySession[] {
    return Array.from(this.sessions.values())
      .filter(s => s.graphId === graphId)
  }
}

// ============================================================================
// COORDINATION SIMULATION SYSTEM
// Implements mechanism #215
// ============================================================================

/**
 * Simulates coordination scenarios
 */
class CoordinationSimulationSystem {
  private zai: any = null
  private simulations: Map<string, SimulationResult> = new Map()

  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
  }

  /**
   * Run a simulation on a coordination graph
   */
  async simulate(
    graph: CoordinationGraph,
    options?: {
      scenario?: 'normal' | 'stress' | 'failure' | 'recovery'
      iterations?: number
      timeout?: number
    }
  ): Promise<SimulationResult> {
    if (!this.zai) await this.initialize()

    const startTime = Date.now()
    const scenario = options?.scenario || 'normal'
    const iterations = options?.iterations || 1

    // Analyze graph structure
    const analysis = this.analyzeGraphStructure(graph)
    
    // Simulate execution
    const executionPath = await this.simulateExecution(graph, scenario)
    
    // Predict issues
    const predictedIssues = await this.predictIssues(graph, scenario, analysis)
    
    // Generate recommendations
    const recommendations = await this.generateRecommendations(graph, predictedIssues)

    const result: SimulationResult = {
      id: `sim_${Date.now().toString(36)}`,
      graphId: graph.id,
      timestamp: new Date().toISOString(),
      success: predictedIssues.filter(i => i.severity === 'critical').length === 0,
      executionPath,
      metrics: this.generateSimulatedMetrics(graph, analysis),
      predictedIssues,
      recommendations,
      confidence: this.calculateConfidence(analysis, predictedIssues),
      duration: Date.now() - startTime
    }

    this.simulations.set(result.id, result)
    return result
  }

  /**
   * Analyze graph structure
   */
  private analyzeGraphStructure(graph: CoordinationGraph): {
    depth: number
    width: number
    parallelism: number
    complexity: number
  } {
    const nodes = Array.from(graph.nodes.values())
    const edges = Array.from(graph.edges.values())

    // Calculate depth using DFS
    const depths = new Map<string, number>()
    const visited = new Set<string>()
    
    const calculateDepth = (nodeId: string, depth: number): void => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)
      depths.set(nodeId, depth)
      
      const outgoingEdges = edges.filter(e => e.sourceId === nodeId)
      for (const edge of outgoingEdges) {
        calculateDepth(edge.targetId, depth + 1)
      }
    }

    for (const entryPoint of graph.entryPoints) {
      calculateDepth(entryPoint, 0)
    }

    const maxDepth = Math.max(...Array.from(depths.values()), 0)

    // Calculate width (max parallel nodes at any depth)
    const nodesByDepth = new Map<number, number>()
    for (const depth of depths.values()) {
      nodesByDepth.set(depth, (nodesByDepth.get(depth) || 0) + 1)
    }
    const maxWidth = Math.max(...Array.from(nodesByDepth.values()), 0)

    // Calculate parallelism ratio
    const parallelism = nodes.length > 0 ? maxWidth / nodes.length : 0

    return {
      depth: maxDepth,
      width: maxWidth,
      parallelism,
      complexity: nodes.length * (1 + edges.length / Math.max(nodes.length, 1))
    }
  }

  /**
   * Simulate execution path
   */
  private async simulateExecution(
    graph: CoordinationGraph,
    scenario: string
  ): Promise<string[]> {
    const path: string[] = []
    const nodes = Array.from(graph.nodes.values())
    const completed = new Set<string>()

    // Topological sort for execution order
    const sorted = this.topologicalSort(graph)
    
    for (const nodeId of sorted) {
      const node = graph.nodes.get(nodeId)
      if (!node) continue

      // Simulate based on scenario
      if (scenario === 'failure' && Math.random() < 0.1) {
        // Simulate random failure
        path.push(`${nodeId}:failed`)
      } else if (scenario === 'stress' && Math.random() < 0.2) {
        // Simulate timeout under stress
        path.push(`${nodeId}:timeout`)
      } else {
        path.push(`${nodeId}:completed`)
        completed.add(nodeId)
      }
    }

    return path
  }

  /**
   * Topological sort of graph nodes
   */
  private topologicalSort(graph: CoordinationGraph): string[] {
    const result: string[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (nodeId: string): boolean => {
      if (visited.has(nodeId)) return true
      if (visiting.has(nodeId)) return false // Cycle detected

      visiting.add(nodeId)

      const node = graph.nodes.get(nodeId)
      if (node) {
        for (const dep of node.dependencies) {
          if (!visit(dep)) return false
        }
      }

      visiting.delete(nodeId)
      visited.add(nodeId)
      result.push(nodeId)
      return true
    }

    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        visit(nodeId)
      }
    }

    return result
  }

  /**
   * Predict potential issues
   */
  private async predictIssues(
    graph: CoordinationGraph,
    scenario: string,
    analysis: ReturnType<typeof this.analyzeGraphStructure>
  ): Promise<SimulationIssue[]> {
    const issues: SimulationIssue[] = []
    const nodes = Array.from(graph.nodes.values())

    // Check for potential deadlocks
    if (analysis.parallelism > 0.5 && nodes.filter(n => n.type === 'barrier').length > 1) {
      issues.push({
        id: `issue_deadlock_${Date.now().toString(36)}`,
        type: 'deadlock',
        severity: 'high',
        description: 'Multiple barriers with high parallelism may cause deadlock',
        affectedNodes: nodes.filter(n => n.type === 'barrier').map(n => n.id),
        suggestion: 'Reduce parallelism or use timeout on barriers',
        likelihood: 0.3
      })
    }

    // Check for resource starvation
    const resourceNodes = nodes.filter(n => n.type === 'resource')
    if (resourceNodes.length > nodes.length * 0.3) {
      issues.push({
        id: `issue_starvation_${Date.now().toString(36)}`,
        type: 'resource_starvation',
        severity: 'medium',
        description: 'High resource contention may cause starvation',
        affectedNodes: resourceNodes.map(n => n.id),
        suggestion: 'Implement resource prioritization and fair scheduling',
        likelihood: 0.4
      })
    }

    // Check for bottlenecks
    if (analysis.width > 5 && analysis.depth > 10) {
      issues.push({
        id: `issue_bottleneck_${Date.now().toString(36)}`,
        type: 'bottleneck',
        severity: 'medium',
        description: 'Wide and deep graph may have synchronization bottlenecks',
        affectedNodes: [],
        suggestion: 'Consider restructuring to reduce synchronization points',
        likelihood: 0.5
      })
    }

    // Scenario-specific issues
    if (scenario === 'stress') {
      issues.push({
        id: `issue_timeout_${Date.now().toString(36)}`,
        type: 'timeout',
        severity: 'high',
        description: 'Under stress conditions, timeouts are more likely',
        affectedNodes: nodes.filter(n => n.priority === 'low').map(n => n.id),
        suggestion: 'Increase timeout values or implement adaptive timeouts',
        likelihood: 0.6
      })
    }

    return issues
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(
    graph: CoordinationGraph,
    issues: SimulationIssue[]
  ): Promise<string[]> {
    const recommendations: string[] = []

    if (issues.some(i => i.type === 'deadlock')) {
      recommendations.push('Implement deadlock detection and recovery mechanisms')
      recommendations.push('Use timeout-based barriers instead of blocking barriers')
    }

    if (issues.some(i => i.type === 'resource_starvation')) {
      recommendations.push('Implement fair resource scheduling algorithm')
      recommendations.push('Add resource usage monitoring and alerts')
    }

    if (issues.some(i => i.type === 'bottleneck')) {
      recommendations.push('Consider restructuring coordination graph for better parallelism')
      recommendations.push('Add caching for frequently accessed resources')
    }

    // General recommendations
    recommendations.push('Implement comprehensive logging for debugging')
    recommendations.push('Add health checks for long-running coordination')

    return recommendations
  }

  /**
   * Generate simulated metrics
   */
  private generateSimulatedMetrics(
    graph: CoordinationGraph,
    analysis: ReturnType<typeof this.analyzeGraphStructure>
  ): CoordinationMetrics {
    const nodes = Array.from(graph.nodes.values())
    
    return {
      id: `sim_metrics_${Date.now().toString(36)}`,
      graphId: graph.id,
      timestamp: new Date().toISOString(),
      execution: {
        totalNodes: nodes.length,
        completedNodes: nodes.length,
        failedNodes: 0,
        successRate: 1,
        avgNodeTime: 100 * analysis.complexity / nodes.length,
        totalTime: 100 * analysis.complexity,
        throughput: nodes.length / (100 * analysis.complexity / 1000),
        retryCount: 0,
        timeoutCount: 0
      },
      performance: {
        peakMemoryMB: 50 * analysis.width,
        avgCpuPercent: 30 + analysis.parallelism * 50,
        ioOperations: nodes.length * 2,
        networkCalls: Math.floor(nodes.length * 0.3),
        cacheHitRate: 0.8,
        avgLatencyMs: 50,
        p95LatencyMs: 150,
        p99LatencyMs: 300
      },
      resources: {
        allocated: nodes.length,
        used: nodes.length,
        utilizationRate: 0.85,
        conflicts: 0,
        deadlocks: 0,
        waitTimeMs: 20 * analysis.depth
      },
      quality: {
        correctnessScore: 0.95,
        consistencyScore: 1,
        completenessScore: 1,
        errorRate: 0,
        warningCount: 0,
        policyViolations: 0
      },
      agents: {
        activeAgents: new Set(nodes.map(n => n.agentId)).size,
        workloadDistribution: {},
        messageCount: nodes.length * 2,
        collaborationScore: 0.9,
        agentResponseTimes: {}
      }
    }
  }

  /**
   * Calculate confidence in simulation results
   */
  private calculateConfidence(
    analysis: ReturnType<typeof this.analyzeGraphStructure>,
    issues: SimulationIssue[]
  ): number {
    // Higher complexity reduces confidence
    let confidence = 1 - (analysis.complexity / 100)
    
    // More issues reduces confidence
    confidence -= issues.length * 0.05
    
    return Math.max(0.1, Math.min(1, confidence))
  }

  /**
   * Get simulation result
   */
  getSimulation(simulationId: string): SimulationResult | undefined {
    return this.simulations.get(simulationId)
  }

  /**
   * Get all simulations for a graph
   */
  getSimulationsForGraph(graphId: string): SimulationResult[] {
    return Array.from(this.simulations.values())
      .filter(s => s.graphId === graphId)
  }
}

// ============================================================================
// COORDINATION DEBUGGING TOOLS
// Implements mechanism #216
// ============================================================================

/**
 * Debugs coordination issues
 */
class CoordinationDebuggingTools {
  private sessions: Map<string, DebugSession> = new Map()

  /**
   * Start a debug session
   */
  startSession(
    graphId: string,
    config?: Partial<DebugConfig>
  ): DebugSession {
    const session: DebugSession = {
      id: `debug_${Date.now().toString(36)}`,
      graphId,
      startedAt: new Date().toISOString(),
      config: {
        breakpoints: config?.breakpoints || [],
        watchExpressions: config?.watchExpressions || [],
        traceLevel: config?.traceLevel || 'normal',
        stopOnError: config?.stopOnError ?? true,
        captureSnapshots: config?.captureSnapshots ?? true,
        timeout: config?.timeout || 60000
      },
      state: {
        status: 'idle',
        stepNumber: 0,
        watchValues: {},
        callStack: []
      },
      issues: [],
      history: []
    }

    this.sessions.set(session.id, session)
    return session
  }

  /**
   * Add a breakpoint
   */
  addBreakpoint(sessionId: string, nodeId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    if (!session.config.breakpoints.includes(nodeId)) {
      session.config.breakpoints.push(nodeId)
    }
    return true
  }

  /**
   * Remove a breakpoint
   */
  removeBreakpoint(sessionId: string, nodeId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    session.config.breakpoints = session.config.breakpoints.filter(id => id !== nodeId)
    return true
  }

  /**
   * Add a watch expression
   */
  addWatch(sessionId: string, expression: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    if (!session.config.watchExpressions.includes(expression)) {
      session.config.watchExpressions.push(expression)
    }
    return true
  }

  /**
   * Step forward in execution
   */
  step(sessionId: string): DebugAction {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    session.state.stepNumber++
    session.state.status = 'stepping'

    const action: DebugAction = {
      id: `action_${Date.now().toString(36)}`,
      type: 'step',
      timestamp: new Date().toISOString(),
      details: { stepNumber: session.state.stepNumber }
    }

    session.history.push(action)
    return action
  }

  /**
   * Continue execution
   */
  continue(sessionId: string): DebugAction {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    session.state.status = 'running'

    const action: DebugAction = {
      id: `action_${Date.now().toString(36)}`,
      type: 'continue',
      timestamp: new Date().toISOString(),
      details: {}
    }

    session.history.push(action)
    return action
  }

  /**
   * Pause execution
   */
  pause(sessionId: string): DebugAction {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    session.state.status = 'paused'

    const action: DebugAction = {
      id: `action_${Date.now().toString(36)}`,
      type: 'pause',
      timestamp: new Date().toISOString(),
      details: {}
    }

    session.history.push(action)
    return action
  }

  /**
   * Inspect a node
   */
  inspect(sessionId: string, nodeId: string, graph: CoordinationGraph): {
    node: CoordinationNode | undefined
    incomingEdges: CoordinationEdge[]
    outgoingEdges: CoordinationEdge[]
    dependencies: string[]
    dependents: string[]
  } {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    const node = graph.nodes.get(nodeId)
    const edges = Array.from(graph.edges.values())
    
    const incomingEdges = edges.filter(e => e.targetId === nodeId)
    const outgoingEdges = edges.filter(e => e.sourceId === nodeId)
    
    const dependencies = node?.dependencies || []
    const dependents = edges
      .filter(e => e.targetId === nodeId)
      .map(e => e.sourceId)

    const action: DebugAction = {
      id: `action_${Date.now().toString(36)}`,
      type: 'inspect',
      timestamp: new Date().toISOString(),
      details: { nodeId },
      result: { node, incomingEdges, outgoingEdges, dependencies, dependents }
    }

    session.history.push(action)

    return { node, incomingEdges, outgoingEdges, dependencies, dependents }
  }

  /**
   * Evaluate an expression in the current context
   */
  evaluate(sessionId: string, expression: string, context: Record<string, any>): any {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    let result: any
    try {
      const fn = new Function('context', `return ${expression}`)
      result = fn(context)
    } catch (error: any) {
      result = { error: error.message }
    }

    const action: DebugAction = {
      id: `action_${Date.now().toString(36)}`,
      type: 'evaluate',
      timestamp: new Date().toISOString(),
      details: { expression },
      result
    }

    session.history.push(action)
    return result
  }

  /**
   * Record an issue
   */
  recordIssue(
    sessionId: string,
    type: DebugIssue['type'],
    nodeId: string,
    description: string,
    suggestion?: string
  ): DebugIssue {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    const issue: DebugIssue = {
      id: `issue_${Date.now().toString(36)}`,
      type,
      nodeId,
      description,
      suggestion,
      timestamp: new Date().toISOString()
    }

    session.issues.push(issue)
    return issue
  }

  /**
   * Get session
   */
  getSession(sessionId: string): DebugSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Close session
   */
  closeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId)
  }

  /**
   * Generate debug report
   */
  generateReport(sessionId: string): string {
    const session = this.sessions.get(sessionId)
    if (!session) return 'Session not found'

    const lines: string[] = [
      `Debug Session: ${session.id}`,
      `Graph: ${session.graphId}`,
      `Started: ${session.startedAt}`,
      `Status: ${session.state.status}`,
      `Steps: ${session.state.stepNumber}`,
      '',
      `Breakpoints: ${session.config.breakpoints.length}`,
      `Watch Expressions: ${session.config.watchExpressions.length}`,
      '',
      `Issues Found: ${session.issues.length}`,
    ]

    for (const issue of session.issues) {
      lines.push(`  - [${issue.type}] ${issue.nodeId}: ${issue.description}`)
    }

    lines.push('')
    lines.push('Action History:')
    for (const action of session.history.slice(-10)) {
      lines.push(`  - ${action.type} at ${action.timestamp}`)
    }

    return lines.join('\n')
  }
}

// ============================================================================
// COORDINATION VISUALIZATION ENGINE
// Implements mechanism #217
// ============================================================================

/**
 * Visualizes coordination state
 */
class CoordinationVisualizationEngine {
  /**
   * Generate visualization output
   */
  visualize(
    graph: CoordinationGraph,
    format: 'mermaid' | 'json' | 'ascii' = 'mermaid'
  ): VisualizationOutput {
    let content: string
    const statistics = this.calculateStatistics(graph)

    switch (format) {
      case 'mermaid':
        content = this.generateMermaid(graph)
        break
      case 'json':
        content = this.generateJson(graph)
        break
      case 'ascii':
        content = this.generateAscii(graph)
        break
      default:
        content = this.generateMermaid(graph)
    }

    return {
      id: `viz_${Date.now().toString(36)}`,
      graphId: graph.id,
      timestamp: new Date().toISOString(),
      format,
      content,
      legend: this.generateLegend(),
      statistics
    }
  }

  /**
   * Generate Mermaid diagram
   */
  private generateMermaid(graph: CoordinationGraph): string {
    const lines: string[] = ['graph TD']
    
    // Add nodes
    for (const node of graph.nodes.values()) {
      const label = node.content.slice(0, 30)
      const status = this.getStatusColor(node.status)
      lines.push(`    ${node.id}["${node.type}<br/>${label}"]${status}`)
    }

    // Add edges
    for (const edge of graph.edges.values()) {
      const label = edge.relation.replace('_', ' ')
      if (edge.conditional) {
        lines.push(`    ${edge.sourceId} -->|${label} [cond]| ${edge.targetId}`)
      } else {
        lines.push(`    ${edge.sourceId} -->|${label}| ${edge.targetId}`)
      }
    }

    // Add styling
    lines.push('')
    lines.push('    classDef pending fill:#f9f,stroke:#333')
    lines.push('    classDef executing fill:#ff9,stroke:#333')
    lines.push('    classDef completed fill:#9f9,stroke:#333')
    lines.push('    classDef failed fill:#f99,stroke:#333')

    return lines.join('\n')
  }

  /**
   * Get Mermaid status color
   */
  private getStatusColor(status: CoordinationStatus): string {
    switch (status) {
      case 'pending':
      case 'waiting':
        return ':::pending'
      case 'executing':
      case 'ready':
        return ':::executing'
      case 'completed':
        return ':::completed'
      case 'failed':
      case 'cancelled':
      case 'timeout':
        return ':::failed'
      default:
        return ''
    }
  }

  /**
   * Generate JSON representation
   */
  private generateJson(graph: CoordinationGraph): string {
    const obj = {
      id: graph.id,
      name: graph.name,
      objective: graph.objective,
      state: graph.state,
      nodes: Array.from(graph.nodes.values()).map(n => ({
        id: n.id,
        type: n.type,
        content: n.content,
        agentId: n.agentId,
        status: n.status
      })),
      edges: Array.from(graph.edges.values()).map(e => ({
        id: e.id,
        source: e.sourceId,
        target: e.targetId,
        relation: e.relation
      }))
    }

    return JSON.stringify(obj, null, 2)
  }

  /**
   * Generate ASCII art representation
   */
  private generateAscii(graph: CoordinationGraph): string {
    const lines: string[] = []
    const nodes = Array.from(graph.nodes.values())
    const edges = Array.from(graph.edges.values())

    lines.push(`Coordination Graph: ${graph.name}`)
    lines.push(`Objective: ${graph.objective}`)
    lines.push('')
    lines.push('Nodes:')

    for (const node of nodes) {
      const icon = this.getNodeIcon(node.status)
      lines.push(`  ${icon} ${node.id} [${node.type}] ${node.content.slice(0, 40)}`)
    }

    lines.push('')
    lines.push('Edges:')

    for (const edge of edges) {
      lines.push(`  ${edge.sourceId} --[${edge.relation}]--> ${edge.targetId}`)
    }

    lines.push('')
    lines.push(`State: ${graph.state.phase} (${Math.round(graph.state.progress * 100)}% complete)`)

    return lines.join('\n')
  }

  /**
   * Get icon for node status
   */
  private getNodeIcon(status: CoordinationStatus): string {
    switch (status) {
      case 'pending':
      case 'waiting':
        return '○'
      case 'ready':
      case 'executing':
        return '◐'
      case 'completed':
        return '●'
      case 'failed':
      case 'cancelled':
      case 'timeout':
        return '✗'
      default:
        return '?'
    }
  }

  /**
   * Calculate statistics
   */
  private calculateStatistics(graph: CoordinationGraph): VisualizationStatistics {
    const nodes = Array.from(graph.nodes.values())
    const edges = Array.from(graph.edges.values())

    // Calculate node type distribution
    const nodeTypeDistribution: Record<string, number> = {}
    for (const node of nodes) {
      nodeTypeDistribution[node.type] = (nodeTypeDistribution[node.type] || 0) + 1
    }

    // Calculate depth
    const depths = new Map<string, number>()
    const visited = new Set<string>()
    
    const calculateDepth = (nodeId: string, depth: number): void => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)
      depths.set(nodeId, depth)
      
      for (const edge of edges.filter(e => e.sourceId === nodeId)) {
        calculateDepth(edge.targetId, depth + 1)
      }
    }

    for (const entry of graph.entryPoints) {
      calculateDepth(entry, 0)
    }

    const maxDepth = Math.max(...Array.from(depths.values()), 0)

    // Calculate width
    const nodesByDepth = new Map<number, number>()
    for (const depth of depths.values()) {
      nodesByDepth.set(depth, (nodesByDepth.get(depth) || 0) + 1)
    }
    const maxWidth = Math.max(...Array.from(nodesByDepth.values()), 0)

    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      maxDepth,
      maxWidth,
      criticalPathLength: maxDepth + 1,
      nodeTypeDistribution
    }
  }

  /**
   * Generate legend
   */
  private generateLegend(): Record<string, string> {
    return {
      '○': 'Pending',
      '◐': 'Executing',
      '●': 'Completed',
      '✗': 'Failed',
      '-->': 'Depends on',
      '--[triggers]-->': 'Triggers',
      '--[syncs]-->': 'Synchronizes'
    }
  }
}

// ============================================================================
// COORDINATION TRACE LOGGING
// Implements mechanism #218
// ============================================================================

/**
 * Logs coordination traces
 */
class CoordinationTraceLogging {
  private traces: Map<string, CoordinationTrace[]> = new Map()
  private sequenceCounters: Map<string, number> = new Map()

  /**
   * Log a trace event
   */
  log(
    graphId: string,
    eventType: TraceEventType,
    options?: {
      nodeId?: string
      agentId?: string
      description?: string
      details?: Record<string, any>
      duration?: number
      parentId?: string
    }
  ): CoordinationTrace {
    // Get or initialize sequence counter
    const sequence = (this.sequenceCounters.get(graphId) || 0) + 1
    this.sequenceCounters.set(graphId, sequence)

    const trace: CoordinationTrace = {
      id: `trace_${Date.now().toString(36)}_${sequence}`,
      graphId,
      sequence,
      timestamp: new Date().toISOString(),
      eventType,
      nodeId: options?.nodeId,
      agentId: options?.agentId,
      description: options?.description || this.getDefaultDescription(eventType),
      details: options?.details || {},
      duration: options?.duration,
      parentId: options?.parentId
    }

    // Store trace
    if (!this.traces.has(graphId)) {
      this.traces.set(graphId, [])
    }
    this.traces.get(graphId)!.push(trace)

    return trace
  }

  /**
   * Get default description for event type
   */
  private getDefaultDescription(eventType: TraceEventType): string {
    const descriptions: Record<TraceEventType, string> = {
      graph_created: 'Coordination graph created',
      graph_started: 'Coordination graph started',
      graph_completed: 'Coordination graph completed',
      graph_failed: 'Coordination graph failed',
      node_created: 'Node created',
      node_started: 'Node execution started',
      node_completed: 'Node execution completed',
      node_failed: 'Node execution failed',
      edge_added: 'Edge added to graph',
      sync_reached: 'Synchronization point reached',
      barrier_passed: 'Barrier passed',
      message_sent: 'Message sent',
      message_received: 'Message received',
      resource_acquired: 'Resource acquired',
      resource_released: 'Resource released',
      decision_made: 'Decision made',
      condition_evaluated: 'Condition evaluated',
      error_occurred: 'Error occurred',
      policy_applied: 'Policy applied',
      checkpoint_created: 'Checkpoint created'
    }
    return descriptions[eventType] || 'Unknown event'
  }

  /**
   * Get traces for a graph
   */
  getTraces(graphId: string, options?: {
    eventType?: TraceEventType
    nodeId?: string
    limit?: number
  }): CoordinationTrace[] {
    let traces = this.traces.get(graphId) || []

    if (options?.eventType) {
      traces = traces.filter(t => t.eventType === options.eventType)
    }

    if (options?.nodeId) {
      traces = traces.filter(t => t.nodeId === options.nodeId)
    }

    if (options?.limit) {
      traces = traces.slice(-options.limit)
    }

    return traces
  }

  /**
   * Get trace by ID
   */
  getTrace(traceId: string): CoordinationTrace | undefined {
    for (const traces of this.traces.values()) {
      const trace = traces.find(t => t.id === traceId)
      if (trace) return trace
    }
    return undefined
  }

  /**
   * Clear traces for a graph
   */
  clearTraces(graphId?: string): void {
    if (graphId) {
      this.traces.delete(graphId)
      this.sequenceCounters.delete(graphId)
    } else {
      this.traces.clear()
      this.sequenceCounters.clear()
    }
  }

  /**
   * Export traces to JSON
   */
  exportTraces(graphId: string): string {
    const traces = this.traces.get(graphId) || []
    return JSON.stringify(traces, null, 2)
  }

  /**
   * Import traces from JSON
   */
  importTraces(graphId: string, json: string): number {
    try {
      const traces: CoordinationTrace[] = JSON.parse(json)
      this.traces.set(graphId, traces)
      return traces.length
    } catch {
      return 0
    }
  }

  /**
   * Get trace statistics
   */
  getStatistics(graphId: string): {
    totalTraces: number
    eventCounts: Record<TraceEventType, number>
    nodeEventCounts: Record<string, number>
    agentEventCounts: Record<string, number>
    avgDuration: number
  } {
    const traces = this.traces.get(graphId) || []
    const eventCounts: Record<string, number> = {}
    const nodeEventCounts: Record<string, number> = {}
    const agentEventCounts: Record<string, number> = {}
    let totalDuration = 0
    let durationCount = 0

    for (const trace of traces) {
      eventCounts[trace.eventType] = (eventCounts[trace.eventType] || 0) + 1
      
      if (trace.nodeId) {
        nodeEventCounts[trace.nodeId] = (nodeEventCounts[trace.nodeId] || 0) + 1
      }
      
      if (trace.agentId) {
        agentEventCounts[trace.agentId] = (agentEventCounts[trace.agentId] || 0) + 1
      }
      
      if (trace.duration) {
        totalDuration += trace.duration
        durationCount++
      }
    }

    return {
      totalTraces: traces.length,
      eventCounts: eventCounts as Record<TraceEventType, number>,
      nodeEventCounts,
      agentEventCounts,
      avgDuration: durationCount > 0 ? totalDuration / durationCount : 0
    }
  }
}

// ============================================================================
// COORDINATION CONSISTENCY CHECKER
// Implements mechanism #219
// ============================================================================

/**
 * Checks coordination consistency
 */
class CoordinationConsistencyChecker {
  /**
   * Check consistency of a coordination graph
   */
  check(graph: CoordinationGraph): ConsistencyCheckResult {
    const issues: ConsistencyIssue[] = []
    const warnings: ConsistencyWarning[] = []
    const recommendations: string[] = []

    // Check for cycles
    const cycle = this.detectCycle(graph)
    if (cycle) {
      issues.push({
        id: `issue_cycle_${Date.now().toString(36)}`,
        type: 'cycle',
        severity: 'error',
        affectedNodes: cycle,
        description: 'Circular dependency detected in coordination graph',
        suggestion: 'Remove circular dependencies by restructuring the coordination flow'
      })
    }

    // Check for orphan nodes
    const orphans = this.findOrphanNodes(graph)
    for (const nodeId of orphans) {
      issues.push({
        id: `issue_orphan_${Date.now().toString(36)}_${nodeId}`,
        type: 'orphan',
        severity: 'warning',
        affectedNodes: [nodeId],
        description: `Node ${nodeId} is not connected to the graph`,
        suggestion: 'Connect the node to the coordination flow or remove it'
      })
    }

    // Check for unreachable nodes
    const unreachable = this.findUnreachableNodes(graph)
    for (const nodeId of unreachable) {
      issues.push({
        id: `issue_unreachable_${Date.now().toString(36)}_${nodeId}`,
        type: 'unreachable',
        severity: 'error',
        affectedNodes: [nodeId],
        description: `Node ${nodeId} is not reachable from entry points`,
        suggestion: 'Add edges to make the node reachable'
      })
    }

    // Check for missing dependencies
    const missingDeps = this.findMissingDependencies(graph)
    for (const { nodeId, dependency } of missingDeps) {
      issues.push({
        id: `issue_missing_dep_${Date.now().toString(36)}_${nodeId}`,
        type: 'missing_dependency',
        severity: 'error',
        affectedNodes: [nodeId],
        description: `Node ${nodeId} depends on non-existent node ${dependency}`,
        suggestion: 'Remove the dependency or create the missing node'
      })
    }

    // Check for conflicts
    const conflicts = this.findConflicts(graph)
    for (const conflict of conflicts) {
      warnings.push({
        id: `warning_conflict_${Date.now().toString(36)}`,
        type: 'design',
        description: conflict.description,
        affectedNodes: conflict.nodes,
        suggestion: conflict.suggestion
      })
    }

    // Performance warnings
    if (graph.nodes.size > 50) {
      warnings.push({
        id: `warning_size_${Date.now().toString(36)}`,
        type: 'performance',
        description: 'Large coordination graph may impact performance',
        affectedNodes: [],
        suggestion: 'Consider splitting into smaller sub-graphs'
      })
    }

    // Calculate score
    const errorCount = issues.filter(i => i.severity === 'error').length
    const warningCount = issues.filter(i => i.severity === 'warning').length + warnings.length
    const score = Math.max(0, 1 - (errorCount * 0.2) - (warningCount * 0.05))

    // Generate recommendations
    if (issues.some(i => i.type === 'cycle')) {
      recommendations.push('Restructure the graph to eliminate cycles')
    }
    if (orphans.length > 0) {
      recommendations.push('Review and connect or remove orphan nodes')
    }
    if (unreachable.length > 0) {
      recommendations.push('Ensure all nodes are reachable from entry points')
    }
    recommendations.push('Consider adding more synchronization points for complex flows')

    return {
      id: `check_${Date.now().toString(36)}`,
      graphId: graph.id,
      timestamp: new Date().toISOString(),
      consistent: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      warnings,
      score,
      recommendations
    }
  }

  /**
   * Detect cycles in the graph
   */
  private detectCycle(graph: CoordinationGraph): string[] | null {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    const path: string[] = []

    const dfs = (nodeId: string): string[] | null => {
      visited.add(nodeId)
      recursionStack.add(nodeId)
      path.push(nodeId)

      const outgoingEdges = Array.from(graph.edges.values())
        .filter(e => e.sourceId === nodeId)

      for (const edge of outgoingEdges) {
        if (!visited.has(edge.targetId)) {
          const cycle = dfs(edge.targetId)
          if (cycle) return cycle
        } else if (recursionStack.has(edge.targetId)) {
          const cycleStart = path.indexOf(edge.targetId)
          return path.slice(cycleStart)
        }
      }

      path.pop()
      recursionStack.delete(nodeId)
      return null
    }

    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        const cycle = dfs(nodeId)
        if (cycle) return cycle
      }
    }

    return null
  }

  /**
   * Find orphan nodes (no edges)
   */
  private findOrphanNodes(graph: CoordinationGraph): string[] {
    const connectedNodes = new Set<string>()
    
    for (const edge of graph.edges.values()) {
      connectedNodes.add(edge.sourceId)
      connectedNodes.add(edge.targetId)
    }

    const orphans: string[] = []
    for (const nodeId of graph.nodes.keys()) {
      if (!connectedNodes.has(nodeId)) {
        orphans.push(nodeId)
      }
    }

    return orphans
  }

  /**
   * Find unreachable nodes from entry points
   */
  private findUnreachableNodes(graph: CoordinationGraph): string[] {
    const reachable = new Set<string>()
    const queue = [...graph.entryPoints]

    while (queue.length > 0) {
      const nodeId = queue.shift()!
      if (reachable.has(nodeId)) continue
      reachable.add(nodeId)

      const outgoingEdges = Array.from(graph.edges.values())
        .filter(e => e.sourceId === nodeId)
      
      for (const edge of outgoingEdges) {
        if (!reachable.has(edge.targetId)) {
          queue.push(edge.targetId)
        }
      }
    }

    const unreachable: string[] = []
    for (const nodeId of graph.nodes.keys()) {
      if (!reachable.has(nodeId)) {
        unreachable.push(nodeId)
      }
    }

    return unreachable
  }

  /**
   * Find missing dependencies
   */
  private findMissingDependencies(graph: CoordinationGraph): Array<{ nodeId: string; dependency: string }> {
    const missing: Array<{ nodeId: string; dependency: string }> = []

    for (const node of graph.nodes.values()) {
      for (const dep of node.dependencies) {
        if (!graph.nodes.has(dep)) {
          missing.push({ nodeId: node.id, dependency: dep })
        }
      }
    }

    return missing
  }

  /**
   * Find potential conflicts
   */
  private findConflicts(graph: CoordinationGraph): Array<{
    description: string
    nodes: string[]
    suggestion: string
  }> {
    const conflicts: Array<{
      description: string
      nodes: string[]
      suggestion: string
    }> = []

    // Check for multiple writers to same resource
    const resourceNodes = Array.from(graph.nodes.values())
      .filter(n => n.type === 'resource')

    for (let i = 0; i < resourceNodes.length; i++) {
      for (let j = i + 1; j < resourceNodes.length; j++) {
        const node1 = resourceNodes[i]
        const node2 = resourceNodes[j]
        
        if (node1.content === node2.content && node1.agentId !== node2.agentId) {
          conflicts.push({
            description: `Multiple agents accessing same resource: ${node1.content}`,
            nodes: [node1.id, node2.id],
            suggestion: 'Add synchronization or use exclusive access patterns'
          })
        }
      }
    }

    return conflicts
  }
}

// ============================================================================
// COORDINATION AUDIT SYSTEM
// Implements mechanism #220
// ============================================================================

/**
 * Audits coordination actions
 */
class CoordinationAuditSystem extends EventEmitter {
  private entries: Map<string, AuditEntry[]> = new Map()
  private entryCounter = 0

  /**
   * Record an audit entry
   */
  record(
    action: AuditAction,
    actor: string,
    target: string,
    contextId: string,
    options?: {
      details?: Record<string, any>
      result?: 'success' | 'failure' | 'pending'
      error?: string
      relatedEntries?: string[]
    }
  ): AuditEntry {
    const entry: AuditEntry = {
      id: `audit_${++this.entryCounter}_${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      action,
      actor,
      target,
      details: options?.details || {},
      result: options?.result || 'success',
      error: options?.error,
      relatedEntries: options?.relatedEntries || [],
      contextId
    }

    if (!this.entries.has(contextId)) {
      this.entries.set(contextId, [])
    }
    this.entries.get(contextId)!.push(entry)

    this.emit('audit:recorded', entry)
    return entry
  }

  /**
   * Get audit entries for a context
   */
  getEntries(contextId: string, options?: {
    action?: AuditAction
    actor?: string
    limit?: number
    startDate?: Date
    endDate?: Date
  }): AuditEntry[] {
    let entries = this.entries.get(contextId) || []

    if (options?.action) {
      entries = entries.filter(e => e.action === options.action)
    }

    if (options?.actor) {
      entries = entries.filter(e => e.actor === options.actor)
    }

    if (options?.startDate) {
      entries = entries.filter(e => new Date(e.timestamp) >= options.startDate!)
    }

    if (options?.endDate) {
      entries = entries.filter(e => new Date(e.timestamp) <= options.endDate!)
    }

    if (options?.limit) {
      entries = entries.slice(-options.limit)
    }

    return entries
  }

  /**
   * Get entry by ID
   */
  getEntry(entryId: string): AuditEntry | undefined {
    for (const entries of this.entries.values()) {
      const entry = entries.find(e => e.id === entryId)
      if (entry) return entry
    }
    return undefined
  }

  /**
   * Get audit summary
   */
  getSummary(contextId: string): {
    totalEntries: number
    actionsByType: Record<AuditAction, number>
    successRate: number
    topActors: Array<{ actor: string; count: number }>
    recentFailures: AuditEntry[]
  } {
    const entries = this.entries.get(contextId) || []
    const actionsByType: Record<string, number> = {}
    const actorCounts: Record<string, number> = {}
    const failures = entries.filter(e => e.result === 'failure')
    const successes = entries.filter(e => e.result === 'success')

    for (const entry of entries) {
      actionsByType[entry.action] = (actionsByType[entry.action] || 0) + 1
      actorCounts[entry.actor] = (actorCounts[entry.actor] || 0) + 1
    }

    const topActors = Object.entries(actorCounts)
      .map(([actor, count]) => ({ actor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      totalEntries: entries.length,
      actionsByType: actionsByType as Record<AuditAction, number>,
      successRate: entries.length > 0 ? successes.length / entries.length : 0,
      topActors,
      recentFailures: failures.slice(-10)
    }
  }

  /**
   * Export audit log
   */
  exportAuditLog(contextId: string): string {
    const entries = this.entries.get(contextId) || []
    return JSON.stringify(entries, null, 2)
  }

  /**
   * Clear audit entries
   */
  clearEntries(contextId?: string): void {
    if (contextId) {
      this.entries.delete(contextId)
    } else {
      this.entries.clear()
    }
  }

  /**
   * Verify audit integrity
   */
  verifyIntegrity(contextId: string): {
    valid: boolean
    issues: string[]
  } {
    const entries = this.entries.get(contextId) || []
    const issues: string[] = []

    // Check for missing timestamps
    const missingTimestamps = entries.filter(e => !e.timestamp)
    if (missingTimestamps.length > 0) {
      issues.push(`${missingTimestamps.length} entries missing timestamps`)
    }

    // Check for missing actors
    const missingActors = entries.filter(e => !e.actor)
    if (missingActors.length > 0) {
      issues.push(`${missingActors.length} entries missing actor`)
    }

    // Check for broken references
    for (const entry of entries) {
      for (const relatedId of entry.relatedEntries) {
        if (!this.getEntry(relatedId)) {
          issues.push(`Entry ${entry.id} references non-existent entry ${relatedId}`)
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues
    }
  }
}

// ============================================================================
// MAIN COORDINATION INFRASTRUCTURE CLASS
// ============================================================================

/**
 * Main Coordination Infrastructure class
 * Coordinates all 10 subsystems
 */
export class CoordinationInfrastructure extends EventEmitter {
  private graphBuilder: CoordinationGraphBuilder
  private policyEngine: CoordinationPolicyEngine
  private metricsTracker: CoordinationMetricsTracker
  private replayEngine: CoordinationReplayEngine
  private simulationSystem: CoordinationSimulationSystem
  private debuggingTools: CoordinationDebuggingTools
  private visualizationEngine: CoordinationVisualizationEngine
  private traceLogging: CoordinationTraceLogging
  private consistencyChecker: CoordinationConsistencyChecker
  private auditSystem: CoordinationAuditSystem

  private zai: any = null
  private initialized = false

  constructor() {
    super()
    
    this.graphBuilder = new CoordinationGraphBuilder()
    this.policyEngine = new CoordinationPolicyEngine()
    this.metricsTracker = new CoordinationMetricsTracker()
    this.replayEngine = new CoordinationReplayEngine()
    this.simulationSystem = new CoordinationSimulationSystem()
    this.debuggingTools = new CoordinationDebuggingTools()
    this.visualizationEngine = new CoordinationVisualizationEngine()
    this.traceLogging = new CoordinationTraceLogging()
    this.consistencyChecker = new CoordinationConsistencyChecker()
    this.auditSystem = new CoordinationAuditSystem()

    // Wire up events
    this.auditSystem.on('audit:recorded', (entry: AuditEntry) => {
      this.emit('audit:recorded', entry)
    })
  }

  /**
   * Initialize the infrastructure
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    this.zai = await ZAI.create()
    await this.graphBuilder.initialize()
    await this.simulationSystem.initialize()
    
    this.initialized = true
    this.emit('initialized')
  }

  // =========================================================================
  // Graph Builder Methods (#211)
  // =========================================================================

  createGraph(
    objective: string,
    options?: {
      name?: string
      description?: string
      tags?: string[]
      author?: string
    }
  ): CoordinationGraph {
    const graph = this.graphBuilder.createGraph(objective, options)
    
    this.traceLogging.log(graph.id, 'graph_created', {
      description: `Created graph: ${graph.name}`
    })
    
    this.auditSystem.record(
      'create_graph',
      options?.author || 'system',
      graph.id,
      graph.id,
      { name: graph.name, objective }
    )
    
    return graph
  }

  async buildGraphFromDescription(
    objective: string,
    context?: {
      agents?: string[]
      constraints?: string[]
      resources?: string[]
    }
  ): Promise<CoordinationGraph> {
    await this.initialize()
    return this.graphBuilder.buildFromDescription(objective, context)
  }

  addNode(
    graph: CoordinationGraph,
    type: CoordinationNodeType,
    content: string,
    agentId: string,
    options?: {
      priority?: 'low' | 'medium' | 'high' | 'critical'
      dependencies?: string[]
      metadata?: Record<string, any>
    }
  ): CoordinationNode {
    const node = this.graphBuilder.addNode(graph, type, content, agentId, options)
    
    this.traceLogging.log(graph.id, 'node_created', {
      nodeId: node.id,
      agentId,
      description: `Created ${type} node`
    })
    
    return node
  }

  addEdge(
    graph: CoordinationGraph,
    sourceId: string,
    targetId: string,
    relation: CoordinationRelation,
    options?: {
      conditional?: boolean
      condition?: string
      weight?: number
    }
  ): CoordinationEdge | null {
    const edge = this.graphBuilder.addEdge(graph, sourceId, targetId, relation, options)
    
    if (edge) {
      this.traceLogging.log(graph.id, 'edge_added', {
        description: `Added ${relation} edge`
      })
    }
    
    return edge
  }

  getGraph(graphId: string): CoordinationGraph | undefined {
    return this.graphBuilder.getGraph(graphId)
  }

  getAllGraphs(): CoordinationGraph[] {
    return this.graphBuilder.getAllGraphs()
  }

  // =========================================================================
  // Policy Engine Methods (#212)
  // =========================================================================

  evaluatePolicy(
    context: PolicyContext,
    additionalData?: Record<string, any>
  ): PolicyEvaluationResult {
    return this.policyEngine.evaluate(context, additionalData)
  }

  addPolicy(policy: CoordinationPolicy): void {
    this.policyEngine.addPolicy(policy)
    this.emit('policy:added', policy)
  }

  removePolicy(policyId: string): boolean {
    const result = this.policyEngine.removePolicy(policyId)
    if (result) {
      this.emit('policy:removed', policyId)
    }
    return result
  }

  getPolicies(): CoordinationPolicy[] {
    return this.policyEngine.getPolicies()
  }

  // =========================================================================
  // Metrics Tracker Methods (#213)
  // =========================================================================

  startMetricsTracking(graphId: string): void {
    this.metricsTracker.startTracking(graphId)
  }

  recordNodeStart(graphId: string, nodeId: string): void {
    this.metricsTracker.recordNodeStart(graphId, nodeId)
    this.traceLogging.log(graphId, 'node_started', { nodeId })
  }

  recordNodeCompletion(graphId: string, nodeId: string, success: boolean): void {
    this.metricsTracker.recordNodeCompletion(graphId, nodeId, success)
    this.traceLogging.log(graphId, success ? 'node_completed' : 'node_failed', { nodeId })
  }

  stopMetricsTracking(
    graphId: string,
    graph: CoordinationGraph,
    additionalData?: {
      retryCount?: number
      timeoutCount?: number
      resourceConflicts?: number
      deadlocks?: number
      waitTimeMs?: number
      messageCount?: number
    }
  ): CoordinationMetrics {
    return this.metricsTracker.stopTracking(graphId, graph, additionalData)
  }

  getMetrics(graphId: string): CoordinationMetrics[] {
    return this.metricsTracker.getMetrics(graphId)
  }

  getLatestMetrics(graphId: string): CoordinationMetrics | undefined {
    return this.metricsTracker.getLatestMetrics(graphId)
  }

  getAggregatedMetrics(): {
    totalGraphs: number
    avgSuccessRate: number
    avgExecutionTime: number
    totalNodes: number
    totalErrors: number
  } {
    return this.metricsTracker.getAggregatedMetrics()
  }

  // =========================================================================
  // Replay Engine Methods (#214)
  // =========================================================================

  createReplaySession(
    graphId: string,
    traces: CoordinationTrace[],
    initialState: CoordinationGraph
  ): ReplaySession {
    return this.replayEngine.createSession(graphId, traces, initialState)
  }

  startReplay(sessionId: string): void {
    this.replayEngine.startReplay(sessionId)
  }

  pauseReplay(sessionId: string): void {
    this.replayEngine.pauseReplay(sessionId)
  }

  stepReplayNext(sessionId: string): CoordinationTrace | null {
    return this.replayEngine.stepNext(sessionId)
  }

  stepReplayPrevious(sessionId: string): CoordinationTrace | null {
    return this.replayEngine.stepPrevious(sessionId)
  }

  setReplayBreakpoint(sessionId: string, nodeId: string): void {
    this.replayEngine.setBreakpoint(sessionId, nodeId)
  }

  getReplaySession(sessionId: string): ReplaySession | undefined {
    return this.replayEngine.getSession(sessionId)
  }

  // =========================================================================
  // Simulation System Methods (#215)
  // =========================================================================

  async simulate(
    graph: CoordinationGraph,
    options?: {
      scenario?: 'normal' | 'stress' | 'failure' | 'recovery'
      iterations?: number
      timeout?: number
    }
  ): Promise<SimulationResult> {
    await this.initialize()
    return this.simulationSystem.simulate(graph, options)
  }

  getSimulation(simulationId: string): SimulationResult | undefined {
    return this.simulationSystem.getSimulation(simulationId)
  }

  // =========================================================================
  // Debugging Tools Methods (#216)
  // =========================================================================

  startDebugSession(
    graphId: string,
    config?: Partial<DebugConfig>
  ): DebugSession {
    return this.debuggingTools.startSession(graphId, config)
  }

  addDebugBreakpoint(sessionId: string, nodeId: string): boolean {
    return this.debuggingTools.addBreakpoint(sessionId, nodeId)
  }

  debugStep(sessionId: string): DebugAction {
    return this.debuggingTools.step(sessionId)
  }

  debugContinue(sessionId: string): DebugAction {
    return this.debuggingTools.continue(sessionId)
  }

  debugPause(sessionId: string): DebugAction {
    return this.debuggingTools.pause(sessionId)
  }

  inspectNode(sessionId: string, nodeId: string, graph: CoordinationGraph): {
    node: CoordinationNode | undefined
    incomingEdges: CoordinationEdge[]
    outgoingEdges: CoordinationEdge[]
    dependencies: string[]
    dependents: string[]
  } {
    return this.debuggingTools.inspect(sessionId, nodeId, graph)
  }

  evaluateExpression(sessionId: string, expression: string, context: Record<string, any>): any {
    return this.debuggingTools.evaluate(sessionId, expression, context)
  }

  getDebugSession(sessionId: string): DebugSession | undefined {
    return this.debuggingTools.getSession(sessionId)
  }

  generateDebugReport(sessionId: string): string {
    return this.debuggingTools.generateReport(sessionId)
  }

  // =========================================================================
  // Visualization Engine Methods (#217)
  // =========================================================================

  visualize(
    graph: CoordinationGraph,
    format?: 'mermaid' | 'json' | 'ascii'
  ): VisualizationOutput {
    return this.visualizationEngine.visualize(graph, format)
  }

  // =========================================================================
  // Trace Logging Methods (#218)
  // =========================================================================

  logTrace(
    graphId: string,
    eventType: TraceEventType,
    options?: {
      nodeId?: string
      agentId?: string
      description?: string
      details?: Record<string, any>
      duration?: number
      parentId?: string
    }
  ): CoordinationTrace {
    return this.traceLogging.log(graphId, eventType, options)
  }

  getTraces(
    graphId: string,
    options?: {
      eventType?: TraceEventType
      nodeId?: string
      limit?: number
    }
  ): CoordinationTrace[] {
    return this.traceLogging.getTraces(graphId, options)
  }

  exportTraces(graphId: string): string {
    return this.traceLogging.exportTraces(graphId)
  }

  getTraceStatistics(graphId: string): {
    totalTraces: number
    eventCounts: Record<TraceEventType, number>
    nodeEventCounts: Record<string, number>
    agentEventCounts: Record<string, number>
    avgDuration: number
  } {
    return this.traceLogging.getStatistics(graphId)
  }

  // =========================================================================
  // Consistency Checker Methods (#219)
  // =========================================================================

  checkConsistency(graph: CoordinationGraph): ConsistencyCheckResult {
    return this.consistencyChecker.check(graph)
  }

  // =========================================================================
  // Audit System Methods (#220)
  // =========================================================================

  recordAudit(
    action: AuditAction,
    actor: string,
    target: string,
    contextId: string,
    options?: {
      details?: Record<string, any>
      result?: 'success' | 'failure' | 'pending'
      error?: string
      relatedEntries?: string[]
    }
  ): AuditEntry {
    return this.auditSystem.record(action, actor, target, contextId, options)
  }

  getAuditEntries(
    contextId: string,
    options?: {
      action?: AuditAction
      actor?: string
      limit?: number
      startDate?: Date
      endDate?: Date
    }
  ): AuditEntry[] {
    return this.auditSystem.getEntries(contextId, options)
  }

  getAuditSummary(contextId: string): {
    totalEntries: number
    actionsByType: Record<AuditAction, number>
    successRate: number
    topActors: Array<{ actor: string; count: number }>
    recentFailures: AuditEntry[]
  } {
    return this.auditSystem.getSummary(contextId)
  }

  verifyAuditIntegrity(contextId: string): {
    valid: boolean
    issues: string[]
  } {
    return this.auditSystem.verifyIntegrity(contextId)
  }

  // =========================================================================
  // Utility Methods
  // =========================================================================

  /**
   * Execute a coordination graph
   */
  async executeGraph(
    graphId: string,
    options?: {
      timeout?: number
      onNodeStart?: (nodeId: string) => void
      onNodeComplete?: (nodeId: string, success: boolean) => void
    }
  ): Promise<CoordinationGraph> {
    const graph = this.graphBuilder.getGraph(graphId)
    if (!graph) {
      throw new Error(`Graph ${graphId} not found`)
    }

    // Start tracking
    this.startMetricsTracking(graphId)
    
    graph.state.phase = 'running'
    graph.state.startedAt = new Date().toISOString()
    
    this.traceLogging.log(graphId, 'graph_started')

    // Execute nodes in order
    const sortedNodes = this.topologicalSort(graph)
    
    for (const nodeId of sortedNodes) {
      const node = graph.nodes.get(nodeId)
      if (!node) continue

      // Check dependencies
      const depsReady = node.dependencies.every(depId => {
        const dep = graph.nodes.get(depId)
        return dep?.status === 'completed'
      })

      if (!depsReady) {
        node.status = 'waiting'
        continue
      }

      // Check policy
      const policyResult = this.evaluatePolicy({
        graphId,
        nodeId,
        agentId: node.agentId,
        action: 'execute',
        timestamp: new Date().toISOString()
      })

      if (policyResult.decision === 'deny') {
        node.status = 'failed'
        node.result = {
          success: false,
          error: policyResult.reason,
          duration: 0,
          completedAt: new Date().toISOString()
        }
        continue
      }

      // Execute node
      node.status = 'executing'
      graph.state.activeNodes.push(nodeId)
      
      this.recordNodeStart(graphId, nodeId)
      options?.onNodeStart?.(nodeId)

      // Simulate execution (in real implementation, this would call the agent)
      const startTime = Date.now()
      await new Promise(resolve => setTimeout(resolve, 10)) // Simulated work
      
      node.status = 'completed'
      node.result = {
        success: true,
        duration: Date.now() - startTime,
        completedAt: new Date().toISOString()
      }

      this.recordNodeCompletion(graphId, nodeId, true)
      options?.onNodeComplete?.(nodeId, true)

      graph.state.completedNodes.push(nodeId)
      graph.state.activeNodes = graph.state.activeNodes.filter(id => id !== nodeId)
    }

    // Finalize
    graph.state.phase = 'completed'
    graph.state.endedAt = new Date().toISOString()
    graph.state.progress = 1
    
    this.traceLogging.log(graphId, 'graph_completed')
    
    // Stop tracking
    this.stopMetricsTracking(graphId, graph)

    return graph
  }

  /**
   * Topological sort helper
   */
  private topologicalSort(graph: CoordinationGraph): string[] {
    const result: string[] = []
    const visited = new Set<string>()

    const visit = (nodeId: string): void => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)

      const node = graph.nodes.get(nodeId)
      if (node) {
        for (const dep of node.dependencies) {
          visit(dep)
        }
      }

      result.push(nodeId)
    }

    for (const nodeId of graph.nodes.keys()) {
      visit(nodeId)
    }

    return result
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    this.metricsTracker.clearHistory()
    this.traceLogging.clearTraces()
    this.auditSystem.clearEntries()
    this.policyEngine.clearCache()
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let infrastructureInstance: CoordinationInfrastructure | null = null

/**
 * Get the singleton CoordinationInfrastructure instance
 */
export function getCoordinationInfrastructure(): CoordinationInfrastructure {
  if (!infrastructureInstance) {
    infrastructureInstance = new CoordinationInfrastructure()
  }
  return infrastructureInstance
}

// Re-export types for convenience
export type {
  CoordinationNode,
  CoordinationNodeType,
  CoordinationStatus,
  CoordinationResult,
  CoordinationEdge,
  CoordinationRelation,
  CoordinationGraph,
  GraphExecutionState,
  CoordinationGraphMetadata,
  CoordinationPolicy,
  PolicyRule,
  PolicyDecision,
  PolicyContext,
  PolicyEvaluationResult,
  CoordinationMetrics,
  ExecutionMetrics,
  PerformanceMetrics,
  ResourceMetrics,
  QualityMetrics,
  AgentParticipationMetrics,
  CoordinationTrace,
  TraceEventType,
  AuditEntry,
  AuditAction,
  ReplaySession,
  SimulationResult,
  SimulationIssue,
  DebugSession,
  DebugConfig,
  DebugState,
  DebugIssue,
  DebugAction,
  VisualizationOutput,
  VisualizationStatistics,
  ConsistencyCheckResult,
  ConsistencyIssue,
  ConsistencyWarning
}
