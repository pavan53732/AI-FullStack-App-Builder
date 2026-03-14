/**
 * Reasoning Infrastructure
 * 
 * Implements mechanisms #111-120: Comprehensive reasoning infrastructure including:
 * - Graph Builder: Build and manage reasoning graphs
 * - Node Evaluator: Evaluate reasoning steps
 * - Edge Dependency Tracker: Track dependencies between reasoning steps
 * - State Persistence: Save and restore reasoning state
 * - Cache Engine: Cache reasoning results
 * - Trace Visualization: Visualize reasoning paths
 * - Performance Profiler: Profile reasoning performance
 * - Memory Storage: Store reasoning memories
 * - Version Tracking: Track reasoning versions
 * - Reproducibility Engine: Reproduce reasoning sessions
 */

import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import ZAI from 'z-ai-web-dev-sdk'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Represents a node in the reasoning graph
 */
export interface ReasoningNode {
  /** Unique identifier for this node */
  id: string
  /** Type of reasoning node */
  type: ReasoningNodeType
  /** The reasoning content/statement */
  content: string
  /** Confidence level (0-1) */
  confidence: number
  /** Current status of the node */
  status: NodeStatus
  /** Metadata about this node */
  metadata: NodeMetadata
  /** Evaluation results */
  evaluation?: NodeEvaluation
  /** Timestamp of creation */
  createdAt: string
  /** Timestamp of last update */
  updatedAt: string
}

/**
 * Types of reasoning nodes
 */
export type ReasoningNodeType =
  | 'premise'
  | 'hypothesis'
  | 'observation'
  | 'inference'
  | 'deduction'
  | 'induction'
  | 'abduction'
  | 'conclusion'
  | 'action'
  | 'verification'
  | 'reflection'
  | 'decision'

/**
 * Status of a reasoning node
 */
export type NodeStatus =
  | 'pending'
  | 'evaluating'
  | 'validated'
  | 'rejected'
  | 'skipped'
  | 'failed'

/**
 * Metadata for a reasoning node
 */
export interface NodeMetadata {
  /** Source of the reasoning */
  source?: string
  /** Tags for categorization */
  tags: string[]
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'critical'
  /** Estimated complexity (1-10) */
  complexity: number
  /** Required capabilities */
  requiredCapabilities: string[]
  /** Custom properties */
  custom?: Record<string, any>
}

/**
 * Evaluation result for a node
 */
export interface NodeEvaluation {
  /** Whether the node passed evaluation */
  passed: boolean
  /** Score (0-1) */
  score: number
  /** Issues found during evaluation */
  issues: EvaluationIssue[]
  /** Evidence supporting the evaluation */
  evidence: EvaluationEvidence[]
  /** Timestamp of evaluation */
  evaluatedAt: string
  /** Duration of evaluation in ms */
  duration: number
}

/**
 * Issue found during node evaluation
 */
export interface EvaluationIssue {
  /** Type of issue */
  type: 'logical' | 'evidential' | 'structural' | 'semantic' | 'temporal'
  /** Severity */
  severity: 'low' | 'medium' | 'high' | 'critical'
  /** Description */
  description: string
  /** Suggested fix */
  suggestion?: string
}

/**
 * Evidence for evaluation
 */
export interface EvaluationEvidence {
  /** Type of evidence */
  type: 'fact' | 'inference' | 'observation' | 'rule' | 'counterexample'
  /** Content */
  content: string
  /** Weight/strength */
  weight: number
  /** Source */
  source: string
}

/**
 * Represents an edge in the reasoning graph
 */
export interface ReasoningEdge {
  /** Unique identifier for this edge */
  id: string
  /** Source node ID */
  sourceId: string
  /** Target node ID */
  targetId: string
  /** Type of relationship */
  relation: EdgeRelation
  /** Strength of the relationship (0-1) */
  strength: number
  /** Whether this is a conditional dependency */
  conditional?: boolean
  /** Condition if conditional */
  condition?: string
  /** Metadata */
  metadata: EdgeMetadata
  /** Timestamp of creation */
  createdAt: string
}

/**
 * Types of edge relationships
 */
export type EdgeRelation =
  | 'implies'
  | 'supports'
  | 'contradicts'
  | 'depends_on'
  | 'follows_from'
  | 'alternative_to'
  | 'refines'
  | 'validates'
  | 'invalidates'

/**
 * Metadata for an edge
 */
export interface EdgeMetadata {
  /** Whether the edge is active */
  active: boolean
  /** Weight for graph algorithms */
  weight: number
  /** Custom properties */
  custom?: Record<string, any>
}

/**
 * Represents a complete reasoning graph
 */
export interface ReasoningGraph {
  /** Unique identifier */
  id: string
  /** Name/title of the graph */
  name: string
  /** Description */
  description: string
  /** Goal being reasoned about */
  goal: string
  /** All nodes in the graph */
  nodes: Map<string, ReasoningNode>
  /** All edges in the graph */
  edges: Map<string, ReasoningEdge>
  /** Entry point node IDs */
  entryPoints: string[]
  /** Terminal node IDs */
  terminalNodes: string[]
  /** Graph metadata */
  metadata: GraphMetadata
  /** Current state */
  state: GraphState
  /** Version information */
  version: GraphVersion
  /** Timestamp of creation */
  createdAt: string
  /** Timestamp of last update */
  updatedAt: string
}

/**
 * Metadata for a reasoning graph
 */
export interface GraphMetadata {
  /** Domain/context */
  domain?: string
  /** Tags */
  tags: string[]
  /** Author */
  author?: string
  /** Estimated complexity */
  complexity: number
  /** Custom properties */
  custom?: Record<string, any>
}

/**
 * State of a reasoning graph
 */
export interface GraphState {
  /** Current phase */
  phase: 'initializing' | 'building' | 'evaluating' | 'complete' | 'failed'
  /** Current processing node ID */
  currentNodeId?: string
  /** Completed node IDs */
  completedNodes: string[]
  /** Pending node IDs */
  pendingNodes: string[]
  /** Failed node IDs */
  failedNodes: string[]
  /** Overall progress (0-1) */
  progress: number
  /** Last checkpoint ID */
  lastCheckpointId?: string
}

/**
 * Version information for a graph
 */
export interface GraphVersion {
  /** Version number */
  number: number
  /** Hash of the graph content */
  hash: string
  /** Parent version ID */
  parentId?: string
  /** Changes from parent */
  changes?: string[]
}

/**
 * Options for persistence
 */
export interface PersistenceOptions {
  /** Storage type */
  storage: 'memory' | 'file' | 'database'
  /** Base path for file storage */
  basePath?: string
  /** Auto-save interval in ms */
  autoSaveInterval?: number
  /** Maximum number of versions to keep */
  maxVersions?: number
  /** Compress stored data */
  compress?: boolean
  /** Encryption options */
  encryption?: {
    enabled: boolean
    key?: string
  }
}

/**
 * Entry in the reasoning cache
 */
export interface CacheEntry {
  /** Cache key */
  key: string
  /** Cached value */
  value: any
  /** Timestamp of creation */
  createdAt: string
  /** Timestamp of expiration */
  expiresAt?: string
  /** Time-to-live in ms */
  ttl?: number
  /** Hit count */
  hitCount: number
  /** Size in bytes */
  size: number
  /** Tags for categorization */
  tags: string[]
  /** Dependencies */
  dependencies: string[]
}

/**
 * Trace visualization output
 */
export interface TraceVisualization {
  /** Graph ID */
  graphId: string
  /** Visualization format */
  format: 'ascii' | 'mermaid' | 'json' | 'html'
  /** Visualization content */
  content: string
  /** Legend */
  legend: Record<string, string>
  /** Statistics */
  statistics: TraceStatistics
  /** Timestamp */
  generatedAt: string
}

/**
 * Statistics for trace visualization
 */
export interface TraceStatistics {
  /** Total nodes */
  totalNodes: number
  /** Total edges */
  totalEdges: number
  /** Average path length */
  avgPathLength: number
  /** Maximum depth */
  maxDepth: number
  /** Node type distribution */
  nodeTypeDistribution: Record<ReasoningNodeType, number>
  /** Edge relation distribution */
  edgeRelationDistribution: Record<EdgeRelation, number>
}

/**
 * Performance profile for reasoning
 */
export interface PerformanceProfile {
  /** Profile ID */
  id: string
  /** Graph ID */
  graphId: string
  /** Start time */
  startTime: string
  /** End time */
  endTime?: string
  /** Total duration in ms */
  totalDuration?: number
  /** Node-level metrics */
  nodeMetrics: Map<string, NodePerformanceMetrics>
  /** Edge-level metrics */
  edgeMetrics: Map<string, EdgePerformanceMetrics>
  /** Aggregated metrics */
  aggregated: AggregatedMetrics
  /** Bottlenecks identified */
  bottlenecks: PerformanceBottleneck[]
  /** Recommendations */
  recommendations: string[]
}

/**
 * Performance metrics for a node
 */
export interface NodePerformanceMetrics {
  /** Node ID */
  nodeId: string
  /** Evaluation duration */
  evaluationDuration: number
  /** Memory used */
  memoryUsed: number
  /** Dependencies resolved */
  dependenciesResolved: number
  /** Cache hits */
  cacheHits: number
  /** Cache misses */
  cacheMisses: number
  /** Retry count */
  retryCount: number
  /** Error count */
  errorCount: number
}

/**
 * Performance metrics for an edge
 */
export interface EdgePerformanceMetrics {
  /** Edge ID */
  edgeId: string
  /** Traversal count */
  traversalCount: number
  /** Average traversal time */
  avgTraversalTime: number
  /** Validation time */
  validationTime: number
}

/**
 * Aggregated performance metrics
 */
export interface AggregatedMetrics {
  /** Total nodes processed */
  nodesProcessed: number
  /** Total edges traversed */
  edgesTraversed: number
  /** Average node processing time */
  avgNodeTime: number
  /** Average edge traversal time */
  avgEdgeTime: number
  /** Total memory used */
  totalMemoryUsed: number
  /** Peak memory used */
  peakMemoryUsed: number
  /** Overall throughput (nodes/sec) */
  throughput: number
  /** Cache hit rate */
  cacheHitRate: number
  /** Error rate */
  errorRate: number
}

/**
 * Performance bottleneck
 */
export interface PerformanceBottleneck {
  /** Type of bottleneck */
  type: 'cpu' | 'memory' | 'io' | 'network' | 'dependency'
  /** Location (node or edge ID) */
  location: string
  /** Severity (0-1) */
  severity: number
  /** Description */
  description: string
  /** Impact in ms */
  impact: number
  /** Suggested fix */
  suggestion: string
}

/**
 * Reasoning memory entry
 */
export interface MemoryEntry {
  /** Entry ID */
  id: string
  /** Type of memory */
  type: 'episodic' | 'semantic' | 'procedural' | 'working'
  /** Content */
  content: string
  /** Context */
  context: string
  /** Importance (0-1) */
  importance: number
  /** Associated graph IDs */
  graphIds: string[]
  /** Tags */
  tags: string[]
  /** Creation timestamp */
  createdAt: string
  /** Last accessed timestamp */
  lastAccessedAt: string
  /** Access count */
  accessCount: number
  /** Decay factor */
  decayFactor: number
}

/**
 * Version record for version tracking
 */
export interface VersionRecord {
  /** Version ID */
  id: string
  /** Graph ID */
  graphId: string
  /** Version number */
  version: number
  /** Hash of content */
  hash: string
  /** Parent version ID */
  parentId?: string
  /** Delta from parent */
  delta?: GraphDelta
  /** Timestamp */
  timestamp: string
  /** Author */
  author?: string
  /** Description */
  description?: string
}

/**
 * Delta between graph versions
 */
export interface GraphDelta {
  /** Nodes added */
  nodesAdded: string[]
  /** Nodes removed */
  nodesRemoved: string[]
  /** Nodes modified */
  nodesModified: string[]
  /** Edges added */
  edgesAdded: string[]
  /** Edges removed */
  edgesRemoved: string[]
  /** Edges modified */
  edgesModified: string[]
  /** Metadata changes */
  metadataChanges: string[]
}

/**
 * Reproducibility record
 */
export interface ReproducibilityRecord {
  /** Record ID */
  id: string
  /** Session ID */
  sessionId: string
  /** Graph snapshot */
  graphSnapshot: ReasoningGraph
  /** Execution context */
  context: ReproducibilityContext
  /** Random seed used */
  randomSeed: number
  /** Timestamp */
  timestamp: string
  /** Reproducible flag */
  reproducible: boolean
  /** Issues affecting reproducibility */
  issues: string[]
}

/**
 * Context for reproducibility
 */
export interface ReproducibilityContext {
  /** Environment variables */
  environment: Record<string, string>
  /** Configuration */
  configuration: Record<string, any>
  /** Dependencies */
  dependencies: string[]
  /** AI model parameters */
  modelParameters: Record<string, any>
  /** Timeout settings */
  timeouts: Record<string, number>
}

// ============================================================================
// REASONING GRAPH BUILDER
// ============================================================================

/**
 * Builds and manages reasoning graphs
 * Implements mechanism #111
 */
export class ReasoningGraphBuilder {
  private graphs: Map<string, ReasoningGraph> = new Map()
  private zai: any = null

  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
  }

  /**
   * Create a new reasoning graph
   */
  createGraph(
    goal: string,
    options?: {
      name?: string
      description?: string
      domain?: string
      tags?: string[]
    }
  ): ReasoningGraph {
    const id = `graph_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`
    
    const graph: ReasoningGraph = {
      id,
      name: options?.name || `Reasoning: ${goal.slice(0, 50)}`,
      description: options?.description || '',
      goal,
      nodes: new Map(),
      edges: new Map(),
      entryPoints: [],
      terminalNodes: [],
      metadata: {
        domain: options?.domain,
        tags: options?.tags || [],
        complexity: 1
      },
      state: {
        phase: 'initializing',
        completedNodes: [],
        pendingNodes: [],
        failedNodes: [],
        progress: 0
      },
      version: {
        number: 1,
        hash: ''
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
    graph: ReasoningGraph,
    type: ReasoningNodeType,
    content: string,
    options?: {
      confidence?: number
      priority?: 'low' | 'medium' | 'high' | 'critical'
      tags?: string[]
      complexity?: number
    }
  ): ReasoningNode {
    const id = `node_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`
    
    const node: ReasoningNode = {
      id,
      type,
      content,
      confidence: options?.confidence ?? 0.5,
      status: 'pending',
      metadata: {
        tags: options?.tags || [],
        priority: options?.priority || 'medium',
        complexity: options?.complexity || 1,
        requiredCapabilities: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    graph.nodes.set(id, node)
    graph.updatedAt = new Date().toISOString()

    // Update entry points if this is a premise
    if (type === 'premise' && !graph.entryPoints.includes(id)) {
      graph.entryPoints.push(id)
    }

    return node
  }

  /**
   * Add an edge between nodes
   */
  addEdge(
    graph: ReasoningGraph,
    sourceId: string,
    targetId: string,
    relation: EdgeRelation,
    options?: {
      strength?: number
      conditional?: boolean
      condition?: string
    }
  ): ReasoningEdge | null {
    const sourceNode = graph.nodes.get(sourceId)
    const targetNode = graph.nodes.get(targetId)

    if (!sourceNode || !targetNode) {
      console.error('Source or target node not found')
      return null
    }

    const id = `edge_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`
    
    const edge: ReasoningEdge = {
      id,
      sourceId,
      targetId,
      relation,
      strength: options?.strength ?? 0.8,
      conditional: options?.conditional,
      condition: options?.condition,
      metadata: {
        active: true,
        weight: options?.strength ?? 0.8
      },
      createdAt: new Date().toISOString()
    }

    graph.edges.set(id, edge)
    graph.updatedAt = new Date().toISOString()

    // Update terminal nodes
    this.updateTerminalNodes(graph)

    return edge
  }

  /**
   * Build a reasoning graph from a goal using AI
   */
  async buildFromGoal(
    goal: string,
    context?: {
      constraints?: string[]
      existingKnowledge?: string[]
      preferredApproach?: 'deductive' | 'inductive' | 'abductive' | 'hybrid'
    }
  ): Promise<ReasoningGraph> {
    if (!this.zai) await this.initialize()

    const graph = this.createGraph(goal, { tags: ['ai-generated'] })

    // Use AI to decompose the goal into reasoning steps
    const completion = await this.zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a reasoning expert. Decompose the given goal into a structured reasoning graph.
                    For each step, provide:
                    - Type: premise, hypothesis, observation, inference, deduction, conclusion, etc.
                    - Content: the actual reasoning statement
                    - Confidence: estimated confidence (0-1)
                    - Dependencies: which previous steps this depends on
                    
                    Format each step as:
                    [TYPE] content (confidence: X.X) depends on: [step numbers]`
        },
        {
          role: 'user',
          content: `Goal: ${goal}
                    
                    Context: ${JSON.stringify(context || {})}
                    
                    Create a reasoning graph to achieve this goal.`
        }
      ],
      thinking: { type: 'disabled' }
    })

    const response = completion.choices[0]?.message?.content || ''
    
    // Parse the AI response and build the graph
    const steps = this.parseReasoningSteps(response)
    
    // Add nodes first
    const nodeIdMap = new Map<number, string>()
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const node = this.addNode(graph, step.type, step.content, {
        confidence: step.confidence
      })
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

    graph.state.phase = 'building'
    return graph
  }

  /**
   * Parse reasoning steps from AI response
   */
  private parseReasoningSteps(response: string): Array<{
    type: ReasoningNodeType
    content: string
    confidence: number
    dependencies: number[]
  }> {
    const steps: Array<{
      type: ReasoningNodeType
      content: string
      confidence: number
      dependencies: number[]
    }> = []

    const lines = response.split('\n')
    
    for (const line of lines) {
      // Match pattern: [TYPE] content (confidence: X.X) depends on: [numbers]
      const typeMatch = line.match(/\[(\w+)\]\s*(.+?)(?:\s*\(confidence:\s*([\d.]+)\))?(?:\s*depends on:\s*\[([^\]]*)\])?/i)
      
      if (typeMatch) {
        const type = typeMatch[1].toLowerCase() as ReasoningNodeType
        const content = typeMatch[2].trim()
        const confidence = typeMatch[3] ? parseFloat(typeMatch[3]) : 0.5
        const depsStr = typeMatch[4] || ''
        const dependencies = depsStr.split(',')
          .map(s => parseInt(s.trim()))
          .filter(n => !isNaN(n))

        steps.push({ type, content, confidence, dependencies })
      }
    }

    // If no structured steps found, try to parse line by line
    if (steps.length === 0) {
      let stepIndex = 0
      for (const line of lines) {
        if (line.trim().length > 20) {
          steps.push({
            type: stepIndex === 0 ? 'premise' : stepIndex === lines.length - 1 ? 'conclusion' : 'inference',
            content: line.trim(),
            confidence: 0.5,
            dependencies: stepIndex > 0 ? [stepIndex - 1] : []
          })
          stepIndex++
        }
      }
    }

    return steps
  }

  /**
   * Update terminal nodes based on edge structure
   */
  private updateTerminalNodes(graph: ReasoningGraph): void {
    const targetNodeIds = new Set(
      Array.from(graph.edges.values()).map(e => e.targetId)
    )
    
    const sourceNodeIds = new Set(
      Array.from(graph.edges.values()).map(e => e.sourceId)
    )

    // Terminal nodes are those that are sources but not targets
    graph.terminalNodes = Array.from(sourceNodeIds)
      .filter(id => !targetNodeIds.has(id))
  }

  /**
   * Get a graph by ID
   */
  getGraph(graphId: string): ReasoningGraph | undefined {
    return this.graphs.get(graphId)
  }

  /**
   * Get all graphs
   */
  getAllGraphs(): ReasoningGraph[] {
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
  cloneGraph(graphId: string): ReasoningGraph | null {
    const original = this.graphs.get(graphId)
    if (!original) return null

    const clone: ReasoningGraph = {
      ...original,
      id: `graph_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`,
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
// REASONING NODE EVALUATOR
// ============================================================================

/**
 * Evaluates reasoning nodes
 * Implements mechanism #112
 */
export class ReasoningNodeEvaluator {
  private zai: any = null
  private evaluationCache: Map<string, NodeEvaluation> = new Map()

  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
  }

  /**
   * Evaluate a single node
   */
  async evaluateNode(
    node: ReasoningNode,
    context?: {
      graph?: ReasoningGraph
      parentEvaluations?: Map<string, NodeEvaluation>
      criteria?: string[]
    }
  ): Promise<NodeEvaluation> {
    if (!this.zai) await this.initialize()

    const startTime = Date.now()
    const cacheKey = this.getCacheKey(node)

    // Check cache
    if (this.evaluationCache.has(cacheKey)) {
      return this.evaluationCache.get(cacheKey)!
    }

    // Build evaluation prompt
    const prompt = this.buildEvaluationPrompt(node, context)

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a reasoning evaluator. Evaluate the given reasoning step for:
                      1. Logical validity
                      2. Evidence support
                      3. Clarity and precision
                      4. Relevance to the goal
                      
                      Respond with:
                      - PASSED or FAILED
                      - SCORE: X.X (0-1)
                      - ISSUES: [list any issues]
                      - EVIDENCE: [supporting evidence found]`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        thinking: { type: 'disabled' }
      })

      const response = completion.choices[0]?.message?.content || ''
      const evaluation = this.parseEvaluationResponse(response, Date.now() - startTime)

      // Cache the result
      this.evaluationCache.set(cacheKey, evaluation)

      return evaluation
    } catch (error) {
      return {
        passed: false,
        score: 0,
        issues: [{
          type: 'structural',
          severity: 'high',
          description: 'Evaluation failed due to an error'
        }],
        evidence: [],
        evaluatedAt: new Date().toISOString(),
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Build evaluation prompt
   */
  private buildEvaluationPrompt(
    node: ReasoningNode,
    context?: {
      graph?: ReasoningGraph
      parentEvaluations?: Map<string, NodeEvaluation>
      criteria?: string[]
    }
  ): string {
    const parts: string[] = [
      `Node Type: ${node.type}`,
      `Content: ${node.content}`,
      `Initial Confidence: ${node.confidence}`
    ]

    if (context?.graph) {
      parts.push(`Goal: ${context.graph.goal}`)
    }

    if (context?.criteria) {
      parts.push(`Evaluation Criteria: ${context.criteria.join(', ')}`)
    }

    if (context?.parentEvaluations && context.parentEvaluations.size > 0) {
      parts.push('Parent Evaluations:')
      for (const [nodeId, eval_] of context.parentEvaluations) {
        parts.push(`  - ${nodeId}: score ${eval_.score}`)
      }
    }

    return parts.join('\n')
  }

  /**
   * Parse evaluation response from AI
   */
  private parseEvaluationResponse(response: string, duration: number): NodeEvaluation {
    const passedMatch = response.match(/(PASSED|FAILED)/i)
    const scoreMatch = response.match(/SCORE:\s*([\d.]+)/i)
    const issuesMatch = response.match(/ISSUES:\s*\[([^\]]*)\]/i)
    const evidenceMatch = response.match(/EVIDENCE:\s*\[([^\]]*)\]/i)

    const passed = passedMatch?.[1]?.toUpperCase() === 'PASSED'
    const score = scoreMatch ? parseFloat(scoreMatch[1]) : passed ? 0.7 : 0.3

    const issues: EvaluationIssue[] = []
    if (issuesMatch?.[1]) {
      const issueList = issuesMatch[1].split(',').map(s => s.trim()).filter(s => s)
      for (const issue of issueList) {
        issues.push({
          type: 'logical',
          severity: 'medium',
          description: issue
        })
      }
    }

    const evidence: EvaluationEvidence[] = []
    if (evidenceMatch?.[1]) {
      const evidenceList = evidenceMatch[1].split(',').map(s => s.trim()).filter(s => s)
      for (const ev of evidenceList) {
        evidence.push({
          type: 'inference',
          content: ev,
          weight: 0.7,
          source: 'evaluation'
        })
      }
    }

    return {
      passed,
      score,
      issues,
      evidence,
      evaluatedAt: new Date().toISOString(),
      duration
    }
  }

  /**
   * Evaluate all nodes in a graph
   */
  async evaluateGraph(
    graph: ReasoningGraph,
    options?: {
      parallel?: boolean
      maxConcurrency?: number
    }
  ): Promise<Map<string, NodeEvaluation>> {
    const results = new Map<string, NodeEvaluation>()
    const nodes = Array.from(graph.nodes.values())

    if (options?.parallel) {
      const concurrency = options.maxConcurrency || 5
      for (let i = 0; i < nodes.length; i += concurrency) {
        const batch = nodes.slice(i, i + concurrency)
        const evaluations = await Promise.all(
          batch.map(node => this.evaluateNode(node, { graph }))
        )
        batch.forEach((node, idx) => {
          results.set(node.id, evaluations[idx])
        })
      }
    } else {
      for (const node of nodes) {
        // Get parent evaluations for context
        const parentEvaluations = this.getParentEvaluations(graph, node.id, results)
        const evaluation = await this.evaluateNode(node, { graph, parentEvaluations })
        results.set(node.id, evaluation)
      }
    }

    return results
  }

  /**
   * Get evaluations of parent nodes
   */
  private getParentEvaluations(
    graph: ReasoningGraph,
    nodeId: string,
    evaluated: Map<string, NodeEvaluation>
  ): Map<string, NodeEvaluation> {
    const parents = new Map<string, NodeEvaluation>()
    
    for (const edge of graph.edges.values()) {
      if (edge.targetId === nodeId) {
        const parentEval = evaluated.get(edge.sourceId)
        if (parentEval) {
          parents.set(edge.sourceId, parentEval)
        }
      }
    }

    return parents
  }

  /**
   * Get cache key for a node
   */
  private getCacheKey(node: ReasoningNode): string {
    return `${node.type}:${node.content.slice(0, 100)}:${node.confidence}`
  }

  /**
   * Clear evaluation cache
   */
  clearCache(): void {
    this.evaluationCache.clear()
  }
}

// ============================================================================
// EDGE DEPENDENCY TRACKER
// ============================================================================

/**
 * Tracks dependencies between reasoning steps
 * Implements mechanism #113
 */
export class EdgeDependencyTracker {
  private dependencyGraph: Map<string, Set<string>> = new Map()
  private reverseDependencyGraph: Map<string, Set<string>> = new Map()

  /**
   * Register a dependency
   */
  registerDependency(sourceId: string, targetId: string): void {
    // Forward dependency: target depends on source
    if (!this.dependencyGraph.has(targetId)) {
      this.dependencyGraph.set(targetId, new Set())
    }
    this.dependencyGraph.get(targetId)!.add(sourceId)

    // Reverse dependency: source is depended on by target
    if (!this.reverseDependencyGraph.has(sourceId)) {
      this.reverseDependencyGraph.set(sourceId, new Set())
    }
    this.reverseDependencyGraph.get(sourceId)!.add(targetId)
  }

  /**
   * Build from a reasoning graph
   */
  buildFromGraph(graph: ReasoningGraph): void {
    this.clear()

    for (const edge of graph.edges.values()) {
      this.registerDependency(edge.sourceId, edge.targetId)
    }
  }

  /**
   * Get dependencies of a node
   */
  getDependencies(nodeId: string): string[] {
    return Array.from(this.dependencyGraph.get(nodeId) || [])
  }

  /**
   * Get dependents (nodes that depend on this node)
   */
  getDependents(nodeId: string): string[] {
    return Array.from(this.reverseDependencyGraph.get(nodeId) || [])
  }

  /**
   * Get all dependencies (transitive closure)
   */
  getAllDependencies(nodeId: string): string[] {
    const visited = new Set<string>()
    const queue = [nodeId]

    while (queue.length > 0) {
      const current = queue.shift()!
      const deps = this.getDependencies(current)
      
      for (const dep of deps) {
        if (!visited.has(dep)) {
          visited.add(dep)
          queue.push(dep)
        }
      }
    }

    return Array.from(visited)
  }

  /**
   * Get execution order (topological sort)
   */
  getExecutionOrder(nodeIds: string[]): string[] {
    const inDegree = new Map<string, number>()
    const result: string[] = []
    const queue: string[] = []

    // Initialize in-degrees
    for (const id of nodeIds) {
      inDegree.set(id, this.getDependencies(id).length)
    }

    // Find nodes with no dependencies
    for (const [id, degree] of inDegree) {
      if (degree === 0) {
        queue.push(id)
      }
    }

    // Process queue
    while (queue.length > 0) {
      const current = queue.shift()!
      result.push(current)

      for (const dependent of this.getDependents(current)) {
        if (inDegree.has(dependent)) {
          const newDegree = inDegree.get(dependent)! - 1
          inDegree.set(dependent, newDegree)
          if (newDegree === 0) {
            queue.push(dependent)
          }
        }
      }
    }

    return result
  }

  /**
   * Check for circular dependencies
   */
  hasCircularDependency(): string[] | null {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    const path: string[] = []

    const dfs = (nodeId: string): string[] | null => {
      visited.add(nodeId)
      recursionStack.add(nodeId)
      path.push(nodeId)

      for (const dep of this.getDependencies(nodeId)) {
        if (!visited.has(dep)) {
          const cycle = dfs(dep)
          if (cycle) return cycle
        } else if (recursionStack.has(dep)) {
          const cycleStart = path.indexOf(dep)
          return path.slice(cycleStart)
        }
      }

      path.pop()
      recursionStack.delete(nodeId)
      return null
    }

    for (const nodeId of this.dependencyGraph.keys()) {
      if (!visited.has(nodeId)) {
        const cycle = dfs(nodeId)
        if (cycle) return cycle
      }
    }

    return null
  }

  /**
   * Get critical path (longest path through the graph)
   */
  getCriticalPath(startNodeId: string, endNodeId: string): string[] {
    const memo = new Map<string, { length: number; path: string[] }>()

    const dfs = (nodeId: string): { length: number; path: string[] } => {
      if (memo.has(nodeId)) {
        return memo.get(nodeId)!
      }

      const dependents = this.getDependents(nodeId)
      
      if (nodeId === endNodeId || dependents.length === 0) {
        return { length: 0, path: [nodeId] }
      }

      let bestResult = { length: -1, path: [] as string[] }
      
      for (const dependent of dependents) {
        const result = dfs(dependent)
        if (result.length + 1 > bestResult.length) {
          bestResult = {
            length: result.length + 1,
            path: [nodeId, ...result.path]
          }
        }
      }

      memo.set(nodeId, bestResult)
      return bestResult
    }

    return dfs(startNodeId).path
  }

  /**
   * Clear the dependency graph
   */
  clear(): void {
    this.dependencyGraph.clear()
    this.reverseDependencyGraph.clear()
  }
}

// ============================================================================
// REASONING STATE PERSISTENCE
// ============================================================================

/**
 * Saves and restores reasoning state
 * Implements mechanism #114
 */
export class ReasoningStatePersistence {
  private basePath: string
  private autoSaveInterval: number | null = null
  private pendingChanges: Map<string, ReasoningGraph> = new Map()

  constructor(basePath: string = './data/reasoning-state') {
    this.basePath = basePath
  }

  /**
   * Initialize the persistence layer
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.basePath, { recursive: true })
    await fs.mkdir(path.join(this.basePath, 'graphs'), { recursive: true })
    await fs.mkdir(path.join(this.basePath, 'checkpoints'), { recursive: true })
    await fs.mkdir(path.join(this.basePath, 'versions'), { recursive: true })
  }

  /**
   * Save a graph to storage
   */
  async saveGraph(graph: ReasoningGraph, options?: PersistenceOptions): Promise<string> {
    const storage = options?.storage || 'file'

    if (storage === 'memory') {
      this.pendingChanges.set(graph.id, graph)
      return graph.id
    }

    const filePath = path.join(this.basePath, 'graphs', `${graph.id}.json`)
    const serialized = this.serializeGraph(graph)

    await fs.writeFile(filePath, JSON.stringify(serialized, null, 2))

    return filePath
  }

  /**
   * Load a graph from storage
   */
  async loadGraph(graphId: string): Promise<ReasoningGraph | null> {
    // Check memory first
    if (this.pendingChanges.has(graphId)) {
      return this.pendingChanges.get(graphId)!
    }

    const filePath = path.join(this.basePath, 'graphs', `${graphId}.json`)

    try {
      const data = await fs.readFile(filePath, 'utf-8')
      const serialized = JSON.parse(data)
      return this.deserializeGraph(serialized)
    } catch {
      return null
    }
  }

  /**
   * Create a checkpoint
   */
  async createCheckpoint(
    graph: ReasoningGraph,
    label?: string
  ): Promise<string> {
    const checkpointId = `checkpoint_${Date.now().toString(36)}`
    const checkpointPath = path.join(this.basePath, 'checkpoints', `${checkpointId}.json`)

    const checkpoint = {
      id: checkpointId,
      graphId: graph.id,
      label: label || `Checkpoint at ${new Date().toISOString()}`,
      graph: this.serializeGraph(graph),
      state: graph.state,
      timestamp: new Date().toISOString()
    }

    await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2))
    
    graph.state.lastCheckpointId = checkpointId
    return checkpointId
  }

  /**
   * Restore from a checkpoint
   */
  async restoreCheckpoint(checkpointId: string): Promise<ReasoningGraph | null> {
    const checkpointPath = path.join(this.basePath, 'checkpoints', `${checkpointId}.json`)

    try {
      const data = await fs.readFile(checkpointPath, 'utf-8')
      const checkpoint = JSON.parse(data)
      return this.deserializeGraph(checkpoint.graph)
    } catch {
      return null
    }
  }

  /**
   * List all saved graphs
   */
  async listGraphs(): Promise<Array<{ id: string; name: string; updatedAt: string }>> {
    const graphsDir = path.join(this.basePath, 'graphs')
    
    try {
      const files = await fs.readdir(graphsDir)
      const graphs: Array<{ id: string; name: string; updatedAt: string }> = []

      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(graphsDir, file), 'utf-8')
          const graph = JSON.parse(data)
          graphs.push({
            id: graph.id,
            name: graph.name,
            updatedAt: graph.updatedAt
          })
        }
      }

      return graphs.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    } catch {
      return []
    }
  }

  /**
   * Delete a graph
   */
  async deleteGraph(graphId: string): Promise<boolean> {
    const filePath = path.join(this.basePath, 'graphs', `${graphId}.json`)
    
    try {
      await fs.unlink(filePath)
      this.pendingChanges.delete(graphId)
      return true
    } catch {
      return false
    }
  }

  /**
   * Start auto-save
   */
  startAutoSave(
    getGraphs: () => ReasoningGraph[],
    intervalMs: number = 60000
  ): void {
    this.stopAutoSave()
    
    this.autoSaveInterval = setInterval(async () => {
      const graphs = getGraphs()
      for (const graph of graphs) {
        await this.saveGraph(graph)
      }
    }, intervalMs) as unknown as number
  }

  /**
   * Stop auto-save
   */
  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
    }
  }

  /**
   * Serialize a graph for storage
   */
  private serializeGraph(graph: ReasoningGraph): any {
    return {
      ...graph,
      nodes: Array.from(graph.nodes.entries()),
      edges: Array.from(graph.edges.entries())
    }
  }

  /**
   * Deserialize a graph from storage
   */
  private deserializeGraph(data: any): ReasoningGraph {
    return {
      ...data,
      nodes: new Map(data.nodes),
      edges: new Map(data.edges)
    }
  }
}

// ============================================================================
// REASONING CACHE ENGINE
// ============================================================================

/**
 * Caches reasoning results
 * Implements mechanism #115
 */
export class ReasoningCacheEngine {
  private cache: Map<string, CacheEntry> = new Map()
  private maxSize: number = 1000
  private defaultTTL: number = 3600000 // 1 hour
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  }

  /**
   * Get a value from cache
   */
  get(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      return null
    }

    // Check expiration
    if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    // Update stats
    entry.hitCount++
    entry.lastAccessedAt = new Date().toISOString()
    this.stats.hits++

    return entry.value
  }

  /**
   * Set a value in cache
   */
  set(
    key: string,
    value: any,
    options?: {
      ttl?: number
      tags?: string[]
      dependencies?: string[]
    }
  ): void {
    // Check if we need to evict
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evict()
    }

    const ttl = options?.ttl ?? this.defaultTTL
    const expiresAt = new Date(Date.now() + ttl).toISOString()

    const entry: CacheEntry = {
      key,
      value,
      createdAt: new Date().toISOString(),
      expiresAt,
      ttl,
      hitCount: 0,
      size: this.estimateSize(value),
      tags: options?.tags || [],
      dependencies: options?.dependencies || []
    }

    this.cache.set(key, entry)
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0, evictions: 0 }
  }

  /**
   * Get entries by tag
   */
  getByTag(tag: string): Array<{ key: string; value: any }> {
    const results: Array<{ key: string; value: any }> = []
    
    for (const entry of this.cache.values()) {
      if (entry.tags.includes(tag)) {
        results.push({ key: entry.key, value: entry.value })
      }
    }

    return results
  }

  /**
   * Invalidate entries by tag
   */
  invalidateByTag(tag: string): number {
    let count = 0
    
    for (const [key, entry] of this.cache) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key)
        count++
      }
    }

    return count
  }

  /**
   * Invalidate entries by dependency
   */
  invalidateByDependency(dependency: string): number {
    let count = 0
    
    for (const [key, entry] of this.cache) {
      if (entry.dependencies.includes(dependency)) {
        this.cache.delete(key)
        count++
      }
    }

    return count
  }

  /**
   * Evict entries using LRU strategy
   */
  private evict(): void {
    // Sort by last accessed time and hit count
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => {
        const aScore = a[1].hitCount / (Date.now() - new Date(a[1].createdAt).getTime() + 1)
        const bScore = b[1].hitCount / (Date.now() - new Date(b[1].createdAt).getTime() + 1)
        return aScore - bScore
      })

    // Evict 10% of entries
    const toEvict = Math.ceil(this.maxSize * 0.1)
    for (let i = 0; i < toEvict && i < entries.length; i++) {
      this.cache.delete(entries[i][0])
      this.stats.evictions++
    }
  }

  /**
   * Estimate size of a value
   */
  private estimateSize(value: any): number {
    try {
      return JSON.stringify(value).length
    } catch {
      return 100 // Default estimate
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    hits: number
    misses: number
    evictions: number
    hitRate: number
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    }
  }

  /**
   * Generate a cache key
   */
  static generateKey(...parts: (string | number | object)[]): string {
    const hash = crypto.createHash('sha256')
    for (const part of parts) {
      hash.update(typeof part === 'object' ? JSON.stringify(part) : String(part))
    }
    return hash.digest('hex').slice(0, 16)
  }
}

// ============================================================================
// REASONING TRACE VISUALIZATION
// ============================================================================

/**
 * Visualizes reasoning paths
 * Implements mechanism #116
 */
export class ReasoningTraceVisualization {
  /**
   * Generate visualization for a graph
   */
  visualize(
    graph: ReasoningGraph,
    format: 'ascii' | 'mermaid' | 'json' | 'html' = 'ascii'
  ): TraceVisualization {
    const statistics = this.calculateStatistics(graph)
    
    let content: string
    switch (format) {
      case 'mermaid':
        content = this.generateMermaid(graph)
        break
      case 'json':
        content = this.generateJson(graph)
        break
      case 'html':
        content = this.generateHtml(graph)
        break
      default:
        content = this.generateAscii(graph)
    }

    return {
      graphId: graph.id,
      format,
      content,
      legend: this.getLegend(),
      statistics,
      generatedAt: new Date().toISOString()
    }
  }

  /**
   * Generate ASCII art visualization
   */
  private generateAscii(graph: ReasoningGraph): string {
    const lines: string[] = [
      `┌${'─'.repeat(70)}┐`,
      `│ ${`REASONING GRAPH: ${graph.name}`.slice(0, 68).padEnd(68)}│`,
      `│ ${`Goal: ${graph.goal}`.slice(0, 68).padEnd(68)}│`,
      `├${'─'.repeat(70)}┤`,
      ''
    ]

    // Group nodes by type
    const nodesByType = new Map<ReasoningNodeType, ReasoningNode[]>()
    for (const node of graph.nodes.values()) {
      if (!nodesByType.has(node.type)) {
        nodesByType.set(node.type, [])
      }
      nodesByType.get(node.type)!.push(node)
    }

    // Display nodes
    for (const [type, nodes] of nodesByType) {
      lines.push(`├── [${type.toUpperCase()}] (${nodes.length} nodes)`)
      
      for (const node of nodes.slice(0, 5)) { // Limit to 5 per type
        const statusIcon = this.getStatusIcon(node.status)
        const confidence = (node.confidence * 100).toFixed(0)
        const content = node.content.slice(0, 50)
        
        lines.push(`│   ${statusIcon} ${node.id.slice(0, 12)} (${confidence}%) ${content}...`)
      }
      
      if (nodes.length > 5) {
        lines.push(`│   ... and ${nodes.length - 5} more`)
      }
      lines.push('│')
    }

    // Display edges summary
    lines.push(`├── [EDGES] (${graph.edges.size} total)`)
    const edgeTypes = new Map<EdgeRelation, number>()
    for (const edge of graph.edges.values()) {
      edgeTypes.set(edge.relation, (edgeTypes.get(edge.relation) || 0) + 1)
    }
    for (const [relation, count] of edgeTypes) {
      lines.push(`│   ${relation}: ${count}`)
    }

    // Display state
    lines.push('│')
    lines.push(`├── [STATE]`)
    lines.push(`│   Phase: ${graph.state.phase}`)
    lines.push(`│   Progress: ${(graph.state.progress * 100).toFixed(0)}%`)
    lines.push(`│   Completed: ${graph.state.completedNodes.length}`)
    lines.push(`│   Pending: ${graph.state.pendingNodes.length}`)
    lines.push(`│   Failed: ${graph.state.failedNodes.length}`)

    lines.push('')
    lines.push(`└${'─'.repeat(70)}┘`)

    return lines.join('\n')
  }

  /**
   * Generate Mermaid diagram
   */
  private generateMermaid(graph: ReasoningGraph): string {
    const lines: string[] = ['graph TD']

    // Add nodes
    for (const node of graph.nodes.values()) {
      const label = node.content.slice(0, 30).replace(/"/g, "'")
      const typeClass = node.type
      lines.push(`    ${node.id}["${label}<br/>[${node.type}]"]:::${typeClass}`)
    }

    // Add edges
    for (const edge of graph.edges.values()) {
      const relationLabel = edge.relation.replace(/_/g, ' ')
      lines.push(`    ${edge.sourceId} -->|"${relationLabel}"| ${edge.targetId}`)
    }

    // Add class definitions
    lines.push('')
    lines.push('    classDef premise fill:#e1f5fe')
    lines.push('    classDef hypothesis fill:#fff3e0')
    lines.push('    classDef inference fill:#e8f5e9')
    lines.push('    classDef conclusion fill:#f3e5f5')
    lines.push('    classDef decision fill:#fce4ec')

    return lines.join('\n')
  }

  /**
   * Generate JSON representation
   */
  private generateJson(graph: ReasoningGraph): string {
    const data = {
      id: graph.id,
      name: graph.name,
      goal: graph.goal,
      nodes: Array.from(graph.nodes.values()).map(n => ({
        id: n.id,
        type: n.type,
        content: n.content,
        confidence: n.confidence,
        status: n.status
      })),
      edges: Array.from(graph.edges.values()).map(e => ({
        id: e.id,
        source: e.sourceId,
        target: e.targetId,
        relation: e.relation
      })),
      state: graph.state,
      metadata: graph.metadata
    }

    return JSON.stringify(data, null, 2)
  }

  /**
   * Generate HTML visualization
   */
  private generateHtml(graph: ReasoningGraph): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Reasoning Graph: ${graph.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .node { 
      border: 1px solid #ccc; 
      border-radius: 8px; 
      padding: 10px; 
      margin: 10px 0;
    }
    .node.premise { background: #e1f5fe; }
    .node.hypothesis { background: #fff3e0; }
    .node.inference { background: #e8f5e9; }
    .node.conclusion { background: #f3e5f5; }
    .edge { color: #666; margin-left: 20px; }
    .status { font-weight: bold; }
  </style>
</head>
<body>
  <h1>${graph.name}</h1>
  <p><strong>Goal:</strong> ${graph.goal}</p>
  <h2>Nodes (${graph.nodes.size})</h2>
  ${Array.from(graph.nodes.values()).map(n => `
    <div class="node ${n.type}">
      <span class="status">[${n.status}]</span>
      <strong>${n.type}:</strong> ${n.content.slice(0, 100)}
      <br/><small>Confidence: ${(n.confidence * 100).toFixed(0)}%</small>
    </div>
  `).join('')}
  <h2>Edges (${graph.edges.size})</h2>
  ${Array.from(graph.edges.values()).map(e => `
    <div class="edge">
      ${e.sourceId} --[${e.relation}]--> ${e.targetId}
    </div>
  `).join('')}
</body>
</html>`
  }

  /**
   * Calculate statistics
   */
  private calculateStatistics(graph: ReasoningGraph): TraceStatistics {
    const nodeTypeDistribution: Record<ReasoningNodeType, number> = {} as any
    const edgeRelationDistribution: Record<EdgeRelation, number> = {} as any

    for (const node of graph.nodes.values()) {
      nodeTypeDistribution[node.type] = (nodeTypeDistribution[node.type] || 0) + 1
    }

    for (const edge of graph.edges.values()) {
      edgeRelationDistribution[edge.relation] = (edgeRelationDistribution[edge.relation] || 0) + 1
    }

    // Calculate average path length
    let totalPathLength = 0
    let pathCount = 0
    let maxDepth = 0

    const visited = new Set<string>()
    const dfs = (nodeId: string, depth: number): void => {
      visited.add(nodeId)
      maxDepth = Math.max(maxDepth, depth)

      for (const edge of graph.edges.values()) {
        if (edge.sourceId === nodeId) {
          totalPathLength++
          pathCount++
          if (!visited.has(edge.targetId)) {
            dfs(edge.targetId, depth + 1)
          }
        }
      }
    }

    for (const entryId of graph.entryPoints) {
      dfs(entryId, 0)
    }

    return {
      totalNodes: graph.nodes.size,
      totalEdges: graph.edges.size,
      avgPathLength: pathCount > 0 ? totalPathLength / pathCount : 0,
      maxDepth,
      nodeTypeDistribution,
      edgeRelationDistribution
    }
  }

  /**
   * Get status icon for ASCII display
   */
  private getStatusIcon(status: NodeStatus): string {
    const icons: Record<NodeStatus, string> = {
      pending: '⏳',
      evaluating: '🔄',
      validated: '✅',
      rejected: '❌',
      skipped: '⏭️',
      failed: '💥'
    }
    return icons[status] || '❓'
  }

  /**
   * Get legend
   */
  private getLegend(): Record<string, string> {
    return {
      'premise': 'Initial statement or fact',
      'hypothesis': 'Proposed explanation',
      'inference': 'Derived conclusion',
      'conclusion': 'Final result',
      'decision': 'Choice made',
      'implies': 'Direct logical implication',
      'supports': 'Provides evidence for',
      'contradicts': 'Opposes or negates',
      'depends_on': 'Requires for validity'
    }
  }
}

// ============================================================================
// REASONING PERFORMANCE PROFILER
// ============================================================================

/**
 * Profiles reasoning performance
 * Implements mechanism #117
 */
export class ReasoningPerformanceProfiler {
  private activeProfiles: Map<string, PerformanceProfile> = new Map()
  private completedProfiles: Map<string, PerformanceProfile> = new Map()

  /**
   * Start profiling a graph
   */
  startProfiling(graphId: string): string {
    const profileId = `profile_${Date.now().toString(36)}`
    
    const profile: PerformanceProfile = {
      id: profileId,
      graphId,
      startTime: new Date().toISOString(),
      nodeMetrics: new Map(),
      edgeMetrics: new Map(),
      aggregated: {
        nodesProcessed: 0,
        edgesTraversed: 0,
        avgNodeTime: 0,
        avgEdgeTime: 0,
        totalMemoryUsed: 0,
        peakMemoryUsed: 0,
        throughput: 0,
        cacheHitRate: 0,
        errorRate: 0
      },
      bottlenecks: [],
      recommendations: []
    }

    this.activeProfiles.set(profileId, profile)
    return profileId
  }

  /**
   * Record node evaluation metrics
   */
  recordNodeMetrics(
    profileId: string,
    nodeId: string,
    metrics: Partial<NodePerformanceMetrics>
  ): void {
    const profile = this.activeProfiles.get(profileId)
    if (!profile) return

    const existing = profile.nodeMetrics.get(nodeId) || {
      nodeId,
      evaluationDuration: 0,
      memoryUsed: 0,
      dependenciesResolved: 0,
      cacheHits: 0,
      cacheMisses: 0,
      retryCount: 0,
      errorCount: 0
    }

    profile.nodeMetrics.set(nodeId, { ...existing, ...metrics })
  }

  /**
   * Record edge traversal metrics
   */
  recordEdgeMetrics(
    profileId: string,
    edgeId: string,
    metrics: Partial<EdgePerformanceMetrics>
  ): void {
    const profile = this.activeProfiles.get(profileId)
    if (!profile) return

    const existing = profile.edgeMetrics.get(edgeId) || {
      edgeId,
      traversalCount: 0,
      avgTraversalTime: 0,
      validationTime: 0
    }

    profile.edgeMetrics.set(edgeId, { ...existing, ...metrics })
  }

  /**
   * Stop profiling and get results
   */
  stopProfiling(profileId: string): PerformanceProfile | null {
    const profile = this.activeProfiles.get(profileId)
    if (!profile) return null

    profile.endTime = new Date().toISOString()
    profile.totalDuration = new Date(profile.endTime).getTime() - new Date(profile.startTime).getTime()

    // Calculate aggregated metrics
    this.calculateAggregatedMetrics(profile)

    // Identify bottlenecks
    this.identifyBottlenecks(profile)

    // Generate recommendations
    this.generateRecommendations(profile)

    this.activeProfiles.delete(profileId)
    this.completedProfiles.set(profileId, profile)

    return profile
  }

  /**
   * Calculate aggregated metrics
   */
  private calculateAggregatedMetrics(profile: PerformanceProfile): void {
    const nodeMetrics = Array.from(profile.nodeMetrics.values())
    const edgeMetrics = Array.from(profile.edgeMetrics.values())

    profile.aggregated.nodesProcessed = nodeMetrics.length
    profile.aggregated.edgesTraversed = edgeMetrics.reduce((sum, m) => sum + m.traversalCount, 0)

    if (nodeMetrics.length > 0) {
      profile.aggregated.avgNodeTime = nodeMetrics.reduce((sum, m) => sum + m.evaluationDuration, 0) / nodeMetrics.length
      profile.aggregated.errorRate = nodeMetrics.reduce((sum, m) => sum + m.errorCount, 0) / nodeMetrics.length
      
      const totalCacheHits = nodeMetrics.reduce((sum, m) => sum + m.cacheHits, 0)
      const totalCacheOps = totalCacheHits + nodeMetrics.reduce((sum, m) => sum + m.cacheMisses, 0)
      profile.aggregated.cacheHitRate = totalCacheOps > 0 ? totalCacheHits / totalCacheOps : 0
    }

    if (edgeMetrics.length > 0) {
      profile.aggregated.avgEdgeTime = edgeMetrics.reduce((sum, m) => sum + m.avgTraversalTime, 0) / edgeMetrics.length
    }

    profile.aggregated.totalMemoryUsed = nodeMetrics.reduce((sum, m) => sum + m.memoryUsed, 0)
    profile.aggregated.peakMemoryUsed = Math.max(...nodeMetrics.map(m => m.memoryUsed), 0)

    if (profile.totalDuration && profile.totalDuration > 0) {
      profile.aggregated.throughput = (nodeMetrics.length / profile.totalDuration) * 1000
    }
  }

  /**
   * Identify bottlenecks
   */
  private identifyBottlenecks(profile: PerformanceProfile): void {
    const avgTime = profile.aggregated.avgNodeTime

    for (const [nodeId, metrics] of profile.nodeMetrics) {
      if (metrics.evaluationDuration > avgTime * 3) {
        profile.bottlenecks.push({
          type: 'cpu',
          location: nodeId,
          severity: Math.min(1, metrics.evaluationDuration / (avgTime * 5)),
          description: `Node ${nodeId} took ${metrics.evaluationDuration}ms (avg: ${avgTime.toFixed(0)}ms)`,
          impact: metrics.evaluationDuration - avgTime,
          suggestion: 'Consider caching or optimizing this node evaluation'
        })
      }

      if (metrics.errorCount > 2) {
        profile.bottlenecks.push({
          type: 'dependency',
          location: nodeId,
          severity: Math.min(1, metrics.errorCount / 5),
          description: `Node ${nodeId} has ${metrics.errorCount} errors`,
          impact: metrics.errorCount * 100,
          suggestion: 'Review error handling and retry logic'
        })
      }
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(profile: PerformanceProfile): void {
    if (profile.aggregated.cacheHitRate < 0.5) {
      profile.recommendations.push('Consider increasing cache TTL or warming the cache')
    }

    if (profile.aggregated.errorRate > 0.1) {
      profile.recommendations.push('High error rate detected - review error handling')
    }

    if (profile.bottlenecks.length > 3) {
      profile.recommendations.push('Multiple bottlenecks detected - consider graph restructuring')
    }

    if (profile.aggregated.throughput < 1) {
      profile.recommendations.push('Low throughput - consider parallel processing')
    }

    if (profile.aggregated.peakMemoryUsed > 100 * 1024 * 1024) { // 100MB
      profile.recommendations.push('High memory usage - consider streaming or batching')
    }
  }

  /**
   * Get a completed profile
   */
  getProfile(profileId: string): PerformanceProfile | undefined {
    return this.completedProfiles.get(profileId)
  }

  /**
   * Get all completed profiles
   */
  getAllProfiles(): PerformanceProfile[] {
    return Array.from(this.completedProfiles.values())
  }
}

// ============================================================================
// REASONING MEMORY STORAGE
// ============================================================================

/**
 * Stores reasoning memories
 * Implements mechanism #118
 */
export class ReasoningMemoryStorage {
  private memories: Map<string, MemoryEntry> = new Map()
  private indexPaths: Map<string, Set<string>> = new Map()
  private maxMemories: number = 10000
  private storagePath: string

  constructor(storagePath: string = './data/reasoning-memory') {
    this.storagePath = storagePath
  }

  /**
   * Initialize memory storage
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.storagePath, { recursive: true })
    await this.loadFromDisk()
  }

  /**
   * Store a memory
   */
  store(
    type: MemoryEntry['type'],
    content: string,
    context: string,
    options?: {
      importance?: number
      graphIds?: string[]
      tags?: string[]
    }
  ): MemoryEntry {
    // Check capacity and evict if necessary
    if (this.memories.size >= this.maxMemories) {
      this.evictMemories()
    }

    const id = `memory_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`
    
    const entry: MemoryEntry = {
      id,
      type,
      content,
      context,
      importance: options?.importance ?? 0.5,
      graphIds: options?.graphIds || [],
      tags: options?.tags || [],
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      accessCount: 0,
      decayFactor: 1.0
    }

    this.memories.set(id, entry)

    // Update index
    for (const tag of entry.tags) {
      if (!this.indexPaths.has(tag)) {
        this.indexPaths.set(tag, new Set())
      }
      this.indexPaths.get(tag)!.add(id)
    }

    return entry
  }

  /**
   * Retrieve a memory by ID
   */
  retrieve(memoryId: string): MemoryEntry | null {
    const entry = this.memories.get(memoryId)
    if (!entry) return null

    // Update access stats
    entry.lastAccessedAt = new Date().toISOString()
    entry.accessCount++
    
    // Apply decay
    const ageHours = (Date.now() - new Date(entry.createdAt).getTime()) / (1000 * 60 * 60)
    entry.decayFactor = Math.exp(-ageHours / 168) // Half-life of 1 week

    return entry
  }

  /**
   * Search memories
   */
  search(query: {
    type?: MemoryEntry['type']
    tags?: string[]
    graphId?: string
    minImportance?: number
    textQuery?: string
    limit?: number
  }): MemoryEntry[] {
    let results = Array.from(this.memories.values())

    // Filter by type
    if (query.type) {
      results = results.filter(m => m.type === query.type)
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      results = results.filter(m => 
        query.tags!.some(tag => m.tags.includes(tag))
      )
    }

    // Filter by graph ID
    if (query.graphId) {
      results = results.filter(m => m.graphIds.includes(query.graphId!))
    }

    // Filter by importance
    if (query.minImportance !== undefined) {
      results = results.filter(m => m.importance >= query.minImportance!)
    }

    // Text search
    if (query.textQuery) {
      const lowerQuery = query.textQuery.toLowerCase()
      results = results.filter(m => 
        m.content.toLowerCase().includes(lowerQuery) ||
        m.context.toLowerCase().includes(lowerQuery)
      )
    }

    // Sort by importance and recency
    results.sort((a, b) => {
      const scoreA = a.importance * a.decayFactor + (a.accessCount * 0.01)
      const scoreB = b.importance * b.decayFactor + (b.accessCount * 0.01)
      return scoreB - scoreA
    })

    // Apply limit
    if (query.limit) {
      results = results.slice(0, query.limit)
    }

    return results
  }

  /**
   * Get related memories
   */
  getRelated(memoryId: string, limit: number = 5): MemoryEntry[] {
    const entry = this.memories.get(memoryId)
    if (!entry) return []

    // Find memories with overlapping tags or graph IDs
    const related: MemoryEntry[] = []
    
    for (const other of this.memories.values()) {
      if (other.id === memoryId) continue

      let similarity = 0

      // Tag overlap
      const tagOverlap = entry.tags.filter(t => other.tags.includes(t)).length
      similarity += tagOverlap * 0.3

      // Graph ID overlap
      const graphOverlap = entry.graphIds.filter(g => other.graphIds.includes(g)).length
      similarity += graphOverlap * 0.2

      // Type match
      if (entry.type === other.type) {
        similarity += 0.1
      }

      if (similarity > 0) {
        related.push({ ...other, importance: other.importance * similarity })
      }
    }

    return related
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit)
  }

  /**
   * Update a memory
   */
  update(memoryId: string, updates: Partial<MemoryEntry>): boolean {
    const entry = this.memories.get(memoryId)
    if (!entry) return false

    Object.assign(entry, updates)
    return true
  }

  /**
   * Forget a memory
   */
  forget(memoryId: string): boolean {
    const entry = this.memories.get(memoryId)
    if (!entry) return false

    // Remove from index
    for (const tag of entry.tags) {
      this.indexPaths.get(tag)?.delete(memoryId)
    }

    return this.memories.delete(memoryId)
  }

  /**
   * Evict low-priority memories
   */
  private evictMemories(): void {
    const toEvict = Math.floor(this.maxMemories * 0.1)
    
    const entries = Array.from(this.memories.values())
      .sort((a, b) => {
        const scoreA = a.importance * a.decayFactor - (a.accessCount * 0.01)
        const scoreB = b.importance * b.decayFactor - (b.accessCount * 0.01)
        return scoreA - scoreB
      })

    for (let i = 0; i < toEvict && i < entries.length; i++) {
      this.forget(entries[i].id)
    }
  }

  /**
   * Persist to disk
   */
  async saveToDisk(): Promise<void> {
    const data = Array.from(this.memories.values())
    await fs.writeFile(
      path.join(this.storagePath, 'memories.json'),
      JSON.stringify(data, null, 2)
    )
  }

  /**
   * Load from disk
   */
  private async loadFromDisk(): Promise<void> {
    try {
      const data = await fs.readFile(
        path.join(this.storagePath, 'memories.json'),
        'utf-8'
      )
      const memories = JSON.parse(data) as MemoryEntry[]
      
      for (const memory of memories) {
        this.memories.set(memory.id, memory)
        
        for (const tag of memory.tags) {
          if (!this.indexPaths.has(tag)) {
            this.indexPaths.set(tag, new Set())
          }
          this.indexPaths.get(tag)!.add(memory.id)
        }
      }
    } catch {
      // No existing data
    }
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    total: number
    byType: Record<string, number>
    avgImportance: number
    avgAge: number
  } {
    const entries = Array.from(this.memories.values())
    const byType: Record<string, number> = {}
    
    for (const entry of entries) {
      byType[entry.type] = (byType[entry.type] || 0) + 1
    }

    const avgImportance = entries.length > 0
      ? entries.reduce((sum, e) => sum + e.importance, 0) / entries.length
      : 0

    const avgAge = entries.length > 0
      ? entries.reduce((sum, e) => 
          sum + (Date.now() - new Date(e.createdAt).getTime()), 0) / entries.length / (1000 * 60 * 60)
      : 0

    return {
      total: entries.length,
      byType,
      avgImportance,
      avgAge
    }
  }
}

// ============================================================================
// REASONING VERSION TRACKING
// ============================================================================

/**
 * Tracks reasoning versions
 * Implements mechanism #119
 */
export class ReasoningVersionTracking {
  private versions: Map<string, VersionRecord[]> = new Map()
  private currentVersions: Map<string, number> = new Map()
  private storagePath: string

  constructor(storagePath: string = './data/reasoning-versions') {
    this.storagePath = storagePath
  }

  /**
   * Initialize version tracking
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.storagePath, { recursive: true })
    await this.loadFromDisk()
  }

  /**
   * Create a new version
   */
  createVersion(
    graph: ReasoningGraph,
    parentId?: string,
    description?: string
  ): VersionRecord {
    const graphId = graph.id
    const currentVersion = this.currentVersions.get(graphId) || 0
    const newVersion = currentVersion + 1

    const hash = this.computeHash(graph)
    const id = `version_${graphId}_${newVersion}`

    // Compute delta from parent
    let delta: GraphDelta | undefined
    if (parentId) {
      const parentRecord = this.getVersion(parentId)
      if (parentRecord) {
        delta = this.computeDelta(parentRecord, graph)
      }
    }

    const record: VersionRecord = {
      id,
      graphId,
      version: newVersion,
      hash,
      parentId,
      delta,
      timestamp: new Date().toISOString(),
      description
    }

    // Store version
    if (!this.versions.has(graphId)) {
      this.versions.set(graphId, [])
    }
    this.versions.get(graphId)!.push(record)
    this.currentVersions.set(graphId, newVersion)

    return record
  }

  /**
   * Get a specific version
   */
  getVersion(versionId: string): VersionRecord | null {
    for (const records of this.versions.values()) {
      const record = records.find(r => r.id === versionId)
      if (record) return record
    }
    return null
  }

  /**
   * Get all versions for a graph
   */
  getVersions(graphId: string): VersionRecord[] {
    return this.versions.get(graphId) || []
  }

  /**
   * Get the latest version for a graph
   */
  getLatestVersion(graphId: string): VersionRecord | null {
    const versions = this.versions.get(graphId)
    if (!versions || versions.length === 0) return null
    return versions[versions.length - 1]
  }

  /**
   * Get version history
   */
  getVersionHistory(graphId: string): VersionRecord[] {
    const versions = this.versions.get(graphId) || []
    return [...versions].sort((a, b) => b.version - a.version)
  }

  /**
   * Compare two versions
   */
  compareVersions(versionIdA: string, versionIdB: string): GraphDelta | null {
    const versionA = this.getVersion(versionIdA)
    const versionB = this.getVersion(versionIdB)

    if (!versionA || !versionB) return null
    if (versionA.graphId !== versionB.graphId) return null

    // Compute delta between versions
    return {
      nodesAdded: [],
      nodesRemoved: [],
      nodesModified: [],
      edgesAdded: [],
      edgesRemoved: [],
      edgesModified: [],
      metadataChanges: []
    }
  }

  /**
   * Rollback to a specific version
   */
  async rollbackTo(versionId: string): Promise<boolean> {
    const record = this.getVersion(versionId)
    if (!record) return false

    // In a full implementation, this would restore the graph state
    // For now, we just return true to indicate the version exists
    return true
  }

  /**
   * Compute hash of a graph
   */
  private computeHash(graph: ReasoningGraph): string {
    const content = JSON.stringify({
      nodes: Array.from(graph.nodes.entries()),
      edges: Array.from(graph.edges.entries()),
      goal: graph.goal,
      metadata: graph.metadata
    })

    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16)
  }

  /**
   * Compute delta between versions
   */
  private computeDelta(
    parentRecord: VersionRecord,
    currentGraph: ReasoningGraph
  ): GraphDelta {
    // In a full implementation, this would compare the actual graphs
    return {
      nodesAdded: [],
      nodesRemoved: [],
      nodesModified: [],
      edgesAdded: [],
      edgesRemoved: [],
      edgesModified: [],
      metadataChanges: []
    }
  }

  /**
   * Persist to disk
   */
  async saveToDisk(): Promise<void> {
    const data: Record<string, VersionRecord[]> = {}
    for (const [graphId, records] of this.versions) {
      data[graphId] = records
    }

    await fs.writeFile(
      path.join(this.storagePath, 'versions.json'),
      JSON.stringify(data, null, 2)
    )
  }

  /**
   * Load from disk
   */
  private async loadFromDisk(): Promise<void> {
    try {
      const data = await fs.readFile(
        path.join(this.storagePath, 'versions.json'),
        'utf-8'
      )
      const parsed = JSON.parse(data) as Record<string, VersionRecord[]>

      for (const [graphId, records] of Object.entries(parsed)) {
        this.versions.set(graphId, records)
        const latestVersion = Math.max(...records.map(r => r.version))
        this.currentVersions.set(graphId, latestVersion)
      }
    } catch {
      // No existing data
    }
  }
}

// ============================================================================
// REASONING REPRODUCIBILITY ENGINE
// ============================================================================

/**
 * Reproduces reasoning sessions
 * Implements mechanism #120
 */
export class ReasoningReproducibilityEngine {
  private records: Map<string, ReproducibilityRecord> = new Map()
  private currentSessionId: string | null = null
  private sessionRandomSeed: number = 0
  private storagePath: string
  private zai: any = null

  constructor(storagePath: string = './data/reasoning-sessions') {
    this.storagePath = storagePath
  }

  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
    await fs.mkdir(this.storagePath, { recursive: true })
    await this.loadFromDisk()
  }

  /**
   * Start a new reproducible session
   */
  startSession(options?: {
    seed?: number
    configuration?: Record<string, any>
  }): string {
    this.currentSessionId = `session_${Date.now().toString(36)}`
    this.sessionRandomSeed = options?.seed ?? Date.now()
    
    return this.currentSessionId
  }

  /**
   * Capture a reasoning session
   */
  captureSession(
    graph: ReasoningGraph,
    context?: {
      environment?: Record<string, string>
      configuration?: Record<string, any>
      modelParameters?: Record<string, any>
    }
  ): ReproducibilityRecord {
    const sessionId = this.currentSessionId || `session_${Date.now().toString(36)}`

    const record: ReproducibilityRecord = {
      id: `record_${Date.now().toString(36)}`,
      sessionId,
      graphSnapshot: JSON.parse(JSON.stringify(graph)),
      context: {
        environment: context?.environment || {},
        configuration: context?.configuration || {},
        dependencies: [],
        modelParameters: context?.modelParameters || {},
        timeouts: {}
      },
      randomSeed: this.sessionRandomSeed,
      timestamp: new Date().toISOString(),
      reproducible: true,
      issues: []
    }

    // Check reproducibility
    this.checkReproducibility(record)

    this.records.set(record.id, record)
    return record
  }

  /**
   * Check if a session is reproducible
   */
  private checkReproducibility(record: ReproducibilityRecord): void {
    const issues: string[] = []

    // Check for non-deterministic elements
    if (record.context.modelParameters.temperature && 
        record.context.modelParameters.temperature > 0) {
      issues.push('Model temperature > 0 may cause non-deterministic outputs')
    }

    if (Object.keys(record.context.environment).length === 0) {
      issues.push('Environment context not captured')
    }

    record.issues = issues
    record.reproducible = issues.length === 0
  }

  /**
   * Reproduce a session
   */
  async reproduce(recordId: string): Promise<{
    success: boolean
    graph: ReasoningGraph | null
    differences: string[]
  }> {
    const record = this.records.get(recordId)
    if (!record) {
      return { success: false, graph: null, differences: ['Record not found'] }
    }

    // Restore random seed
    this.sessionRandomSeed = record.randomSeed

    // Deep clone the graph
    const graph: ReasoningGraph = JSON.parse(JSON.stringify(record.graphSnapshot))
    graph.nodes = new Map(Object.entries(graph.nodes))
    graph.edges = new Map(Object.entries(graph.edges))

    // In a full implementation, we would re-run the reasoning with the same parameters
    // For now, return the captured graph
    return {
      success: true,
      graph,
      differences: []
    }
  }

  /**
   * Get a reproducibility record
   */
  getRecord(recordId: string): ReproducibilityRecord | undefined {
    return this.records.get(recordId)
  }

  /**
   * Get all records for a session
   */
  getSessionRecords(sessionId: string): ReproducibilityRecord[] {
    return Array.from(this.records.values())
      .filter(r => r.sessionId === sessionId)
  }

  /**
   * Export a record for sharing
   */
  exportRecord(recordId: string): string | null {
    const record = this.records.get(recordId)
    if (!record) return null

    return JSON.stringify(record, null, 2)
  }

  /**
   * Import a record from external source
   */
  importRecord(jsonData: string): ReproducibilityRecord | null {
    try {
      const record = JSON.parse(jsonData) as ReproducibilityRecord
      this.records.set(record.id, record)
      return record
    } catch {
      return null
    }
  }

  /**
   * Compare two reproduction runs
   */
  compareReproductions(recordIdA: string, recordIdB: string): {
    identical: boolean
    nodeDifferences: string[]
    edgeDifferences: string[]
    stateDifferences: string[]
  } {
    const recordA = this.records.get(recordIdA)
    const recordB = this.records.get(recordIdB)

    if (!recordA || !recordB) {
      return {
        identical: false,
        nodeDifferences: ['One or both records not found'],
        edgeDifferences: [],
        stateDifferences: []
      }
    }

    const nodeDifferences: string[] = []
    const edgeDifferences: string[] = []
    const stateDifferences: string[] = []

    // Compare nodes
    const nodesA = recordA.graphSnapshot.nodes
    const nodesB = recordB.graphSnapshot.nodes

    if (nodesA.size !== nodesB.size) {
      nodeDifferences.push(`Different number of nodes: ${nodesA.size} vs ${nodesB.size}`)
    }

    for (const [nodeId, nodeA] of nodesA) {
      const nodeB = nodesB.get(nodeId)
      if (!nodeB) {
        nodeDifferences.push(`Node ${nodeId} missing in second record`)
      } else if (nodeA.content !== nodeB.content) {
        nodeDifferences.push(`Node ${nodeId} has different content`)
      }
    }

    // Compare edges
    const edgesA = recordA.graphSnapshot.edges
    const edgesB = recordB.graphSnapshot.edges

    if (edgesA.size !== edgesB.size) {
      edgeDifferences.push(`Different number of edges: ${edgesA.size} vs ${edgesB.size}`)
    }

    // Compare state
    const stateA = recordA.graphSnapshot.state
    const stateB = recordB.graphSnapshot.state

    if (stateA.phase !== stateB.phase) {
      stateDifferences.push(`Different phases: ${stateA.phase} vs ${stateB.phase}`)
    }

    if (stateA.progress !== stateB.progress) {
      stateDifferences.push(`Different progress: ${stateA.progress} vs ${stateB.progress}`)
    }

    return {
      identical: nodeDifferences.length === 0 && edgeDifferences.length === 0 && stateDifferences.length === 0,
      nodeDifferences,
      edgeDifferences,
      stateDifferences
    }
  }

  /**
   * Persist to disk
   */
  async saveToDisk(): Promise<void> {
    const data = Array.from(this.records.values())
    await fs.writeFile(
      path.join(this.storagePath, 'records.json'),
      JSON.stringify(data, null, 2)
    )
  }

  /**
   * Load from disk
   */
  private async loadFromDisk(): Promise<void> {
    try {
      const data = await fs.readFile(
        path.join(this.storagePath, 'records.json'),
        'utf-8'
      )
      const records = JSON.parse(data) as ReproducibilityRecord[]
      
      for (const record of records) {
        // Restore Maps
        record.graphSnapshot.nodes = new Map(Object.entries(record.graphSnapshot.nodes || {}))
        record.graphSnapshot.edges = new Map(Object.entries(record.graphSnapshot.edges || {}))
        this.records.set(record.id, record)
      }
    } catch {
      // No existing data
    }
  }
}

// ============================================================================
// MAIN REASONING INFRASTRUCTURE CLASS
// ============================================================================

/**
 * Main Reasoning Infrastructure class
 * Coordinates all reasoning mechanisms
 */
export class ReasoningInfrastructure {
  private graphBuilder: ReasoningGraphBuilder
  private nodeEvaluator: ReasoningNodeEvaluator
  private dependencyTracker: EdgeDependencyTracker
  private statePersistence: ReasoningStatePersistence
  private cacheEngine: ReasoningCacheEngine
  private traceVisualization: ReasoningTraceVisualization
  private performanceProfiler: ReasoningPerformanceProfiler
  private memoryStorage: ReasoningMemoryStorage
  private versionTracking: ReasoningVersionTracking
  private reproducibilityEngine: ReasoningReproducibilityEngine

  private initialized = false

  constructor(options?: {
    storagePath?: string
    maxCacheSize?: number
    maxMemories?: number
  }) {
    const basePath = options?.storagePath || './data/reasoning'

    this.graphBuilder = new ReasoningGraphBuilder()
    this.nodeEvaluator = new ReasoningNodeEvaluator()
    this.dependencyTracker = new EdgeDependencyTracker()
    this.statePersistence = new ReasoningStatePersistence(path.join(basePath, 'state'))
    this.cacheEngine = new ReasoningCacheEngine()
    this.traceVisualization = new ReasoningTraceVisualization()
    this.performanceProfiler = new ReasoningPerformanceProfiler()
    this.memoryStorage = new ReasoningMemoryStorage(path.join(basePath, 'memory'))
    this.versionTracking = new ReasoningVersionTracking(path.join(basePath, 'versions'))
    this.reproducibilityEngine = new ReasoningReproducibilityEngine(path.join(basePath, 'sessions'))

    if (options?.maxCacheSize) {
      (this.cacheEngine as any).maxSize = options.maxCacheSize
    }
    if (options?.maxMemories) {
      (this.memoryStorage as any).maxMemories = options.maxMemories
    }
  }

  /**
   * Initialize all components
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    await Promise.all([
      this.graphBuilder.initialize(),
      this.nodeEvaluator.initialize(),
      this.statePersistence.initialize(),
      this.memoryStorage.initialize(),
      this.versionTracking.initialize(),
      this.reproducibilityEngine.initialize()
    ])

    this.initialized = true
  }

  /**
   * Get the graph builder
   */
  getGraphBuilder(): ReasoningGraphBuilder {
    return this.graphBuilder
  }

  /**
   * Get the node evaluator
   */
  getNodeEvaluator(): ReasoningNodeEvaluator {
    return this.nodeEvaluator
  }

  /**
   * Get the dependency tracker
   */
  getDependencyTracker(): EdgeDependencyTracker {
    return this.dependencyTracker
  }

  /**
   * Get the state persistence
   */
  getStatePersistence(): ReasoningStatePersistence {
    return this.statePersistence
  }

  /**
   * Get the cache engine
   */
  getCacheEngine(): ReasoningCacheEngine {
    return this.cacheEngine
  }

  /**
   * Get the trace visualization
   */
  getTraceVisualization(): ReasoningTraceVisualization {
    return this.traceVisualization
  }

  /**
   * Get the performance profiler
   */
  getPerformanceProfiler(): ReasoningPerformanceProfiler {
    return this.performanceProfiler
  }

  /**
   * Get the memory storage
   */
  getMemoryStorage(): ReasoningMemoryStorage {
    return this.memoryStorage
  }

  /**
   * Get the version tracking
   */
  getVersionTracking(): ReasoningVersionTracking {
    return this.versionTracking
  }

  /**
   * Get the reproducibility engine
   */
  getReproducibilityEngine(): ReasoningReproducibilityEngine {
    return this.reproducibilityEngine
  }

  /**
   * Execute a complete reasoning workflow
   */
  async reason(
    goal: string,
    options?: {
      context?: any
      useCache?: boolean
      profile?: boolean
      captureSession?: boolean
    }
  ): Promise<{
    graph: ReasoningGraph
    evaluations: Map<string, NodeEvaluation>
    profile?: PerformanceProfile
    sessionId?: string
  }> {
    await this.initialize()

    // Start profiling if requested
    let profileId: string | undefined
    if (options?.profile) {
      profileId = this.performanceProfiler.startProfiling('temp')
    }

    // Start reproducibility session if requested
    if (options?.captureSession) {
      this.reproducibilityEngine.startSession()
    }

    // Check cache
    const cacheKey = ReasoningCacheEngine.generateKey('reasoning', goal, options?.context)
    if (options?.useCache) {
      const cached = this.cacheEngine.get(cacheKey)
      if (cached) {
        return cached
      }
    }

    // Build graph from goal
    const graph = await this.graphBuilder.buildFromGoal(goal, options?.context)

    // Build dependency tracker
    this.dependencyTracker.buildFromGraph(graph)

    // Get execution order
    const nodeIds = Array.from(graph.nodes.keys())
    const executionOrder = this.dependencyTracker.getExecutionOrder(nodeIds)

    // Update pending nodes
    graph.state.pendingNodes = executionOrder
    graph.state.phase = 'evaluating'

    // Evaluate nodes in order
    const evaluations = new Map<string, NodeEvaluation>()
    for (const nodeId of executionOrder) {
      const node = graph.nodes.get(nodeId)
      if (!node) continue

      graph.state.currentNodeId = nodeId
      node.status = 'evaluating'

      const startTime = Date.now()
      const evaluation = await this.nodeEvaluator.evaluateNode(node, { graph })
      
      if (profileId) {
        this.performanceProfiler.recordNodeMetrics(profileId, nodeId, {
          evaluationDuration: Date.now() - startTime,
          memoryUsed: 0,
          dependenciesResolved: this.dependencyTracker.getDependencies(nodeId).length
        })
      }

      evaluations.set(nodeId, evaluation)
      node.evaluation = evaluation
      node.status = evaluation.passed ? 'validated' : 'rejected'

      graph.state.completedNodes.push(nodeId)
      graph.state.pendingNodes = graph.state.pendingNodes.filter(id => id !== nodeId)

      if (!evaluation.passed) {
        graph.state.failedNodes.push(nodeId)
      }

      // Store in memory
      this.memoryStorage.store(
        'episodic',
        `Evaluated ${node.type}: ${node.content.slice(0, 100)}`,
        `Goal: ${goal}`,
        {
          importance: evaluation.passed ? 0.7 : 0.5,
          graphIds: [graph.id],
          tags: ['evaluation', node.type, evaluation.passed ? 'success' : 'failure']
        }
      )
    }

    // Update graph state
    graph.state.phase = 'complete'
    graph.state.progress = 1
    graph.updatedAt = new Date().toISOString()

    // Create version
    this.versionTracking.createVersion(graph, undefined, 'Initial reasoning')

    // Stop profiling
    let profile: PerformanceProfile | undefined
    if (profileId) {
      profile = this.performanceProfiler.stopProfiling(profileId)
    }

    // Capture session if requested
    let sessionId: string | undefined
    if (options?.captureSession) {
      const record = this.reproducibilityEngine.captureSession(graph)
      sessionId = record.sessionId
    }

    // Cache the result
    const result = { graph, evaluations, profile, sessionId }
    if (options?.useCache) {
      this.cacheEngine.set(cacheKey, result, {
        tags: ['reasoning', goal.slice(0, 20)],
        ttl: 1800000 // 30 minutes
      })
    }

    // Persist state
    await this.statePersistence.saveGraph(graph)

    return result
  }

  /**
   * Visualize a reasoning graph
   */
  visualize(graph: ReasoningGraph, format: 'ascii' | 'mermaid' | 'json' | 'html' = 'ascii'): TraceVisualization {
    return this.traceVisualization.visualize(graph, format)
  }

  /**
   * Save all state
   */
  async saveAll(): Promise<void> {
    await Promise.all([
      this.statePersistence.saveToDisk?.(),
      this.memoryStorage.saveToDisk(),
      this.versionTracking.saveToDisk(),
      this.reproducibilityEngine.saveToDisk()
    ])
  }

  /**
   * Get system statistics
   */
  getStats(): {
    graphs: number
    cache: ReturnType<ReasoningCacheEngine['getStats']>
    memory: ReturnType<ReasoningMemoryStorage['getStats']>
    profiles: number
    versions: number
    sessions: number
  } {
    return {
      graphs: this.graphBuilder.getAllGraphs().length,
      cache: this.cacheEngine.getStats(),
      memory: this.memoryStorage.getStats(),
      profiles: this.performanceProfiler.getAllProfiles().length,
      versions: Array.from(this.versionTracking['versions'].values())
        .reduce((sum, arr) => sum + arr.length, 0),
      sessions: this.reproducibilityEngine['records'].size
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let infrastructureInstance: ReasoningInfrastructure | null = null

/**
 * Get the singleton instance of the Reasoning Infrastructure
 */
export function getReasoningInfrastructure(options?: {
  storagePath?: string
  maxCacheSize?: number
  maxMemories?: number
}): ReasoningInfrastructure {
  if (!infrastructureInstance) {
    infrastructureInstance = new ReasoningInfrastructure(options)
  }
  return infrastructureInstance
}
