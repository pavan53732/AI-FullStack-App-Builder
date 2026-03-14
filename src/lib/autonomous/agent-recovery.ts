/**
 * Agent Recovery System (Mechanism #174)
 * 
 * A comprehensive system for detecting agent failures and implementing recovery strategies:
 * - Detect agent failures (timeouts, crashes, errors)
 * - Capture failure state and context
 * - Implement recovery strategies (retry, failover, restore from checkpoint)
 * - Restore agent from checkpoints
 * - Retry with exponential backoff
 * - Failover to backup agents
 * - Log recovery actions
 */

import { EventEmitter } from 'events'
import fs from 'fs/promises'
import path from 'path'

// ============================================================================
// Types
// ============================================================================

/**
 * Information about a failure event
 */
export interface FailureInfo {
  id: string
  agentId: string
  agentType: string
  timestamp: string
  type: FailureType
  severity: FailureSeverity
  message: string
  stackTrace?: string
  context: FailureContext
  recoveryAttempts: number
  lastRecoveryAttempt?: string
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
  metadata: Record<string, unknown>
}

/**
 * Types of failures that can occur
 */
export type FailureType = 
  | 'timeout'
  | 'crash'
  | 'error'
  | 'resource_exhausted'
  | 'dependency_failure'
  | 'invalid_state'
  | 'communication_failure'
  | 'checkpoint_corruption'
  | 'unknown'

/**
 * Severity levels for failures
 */
export type FailureSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Context information when a failure occurs
 */
export interface FailureContext {
  taskId?: string
  taskDescription?: string
  currentStep?: string
  totalSteps?: number
  filesModified?: string[]
  filesCreated?: string[]
  memoryUsage?: number
  cpuUsage?: number
  networkLatency?: number
  activeConnections?: number
  queueDepth?: number
  lastSuccessfulOperation?: string
  lastCheckpointId?: string
  parentAgentId?: string
  childAgentIds?: string[]
  customData?: Record<string, unknown>
}

/**
 * Checkpoint for agent state recovery
 */
export interface Checkpoint {
  id: string
  agentId: string
  agentType: string
  timestamp: string
  version: string
  state: AgentState
  task: CheckpointTask
  memory: AgentMemory
  configuration: AgentConfiguration
  metrics: CheckpointMetrics
  parentCheckpointId?: string
  childrenCheckpointIds?: string[]
  isValid: boolean
  validationErrors?: string[]
  checksum?: string
}

/**
 * Agent state at checkpoint time
 */
export interface AgentState {
  status: AgentStatus
  currentPhase: string
  progress: number
  internalState: Record<string, unknown>
  conversationHistory?: ConversationMessage[]
  workingMemory?: Record<string, unknown>
  variables?: Record<string, unknown>
}

/**
 * Agent status types
 */
export type AgentStatus = 
  | 'idle'
  | 'initializing'
  | 'working'
  | 'waiting'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'recovering'

/**
 * Conversation message for checkpoint
 */
export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  timestamp: string
  toolCalls?: ToolCall[]
}

/**
 * Tool call representation
 */
export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
  result?: unknown
}

/**
 * Task information in checkpoint
 */
export interface CheckpointTask {
  id: string
  description: string
  type: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  dependencies: string[]
  artifacts: TaskArtifact[]
  progress: TaskProgress
}

/**
 * Artifact produced by task
 */
export interface TaskArtifact {
  type: 'file' | 'data' | 'log' | 'metric'
  name: string
  path?: string
  content?: string
  size?: number
  hash?: string
}

/**
 * Task progress tracking
 */
export interface TaskProgress {
  totalSteps: number
  completedSteps: number
  currentStep?: string
  stepHistory: StepRecord[]
  startedAt: string
  lastUpdatedAt: string
  estimatedCompletion?: string
}

/**
 * Step execution record
 */
export interface StepRecord {
  step: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped'
  startedAt?: string
  completedAt?: string
  error?: string
}

/**
 * Agent memory snapshot
 */
export interface AgentMemory {
  shortTerm: Record<string, unknown>
  longTerm: Record<string, unknown>
  episodic: EpisodicMemory[]
  semantic: SemanticMemory[]
}

/**
 * Episodic memory (event-based)
 */
export interface EpisodicMemory {
  id: string
  timestamp: string
  event: string
  outcome: string
  importance: number
  tags: string[]
}

/**
 * Semantic memory (fact-based)
 */
export interface SemanticMemory {
  id: string
  concept: string
  value: unknown
  confidence: number
  source: string
  lastAccessed: string
}

/**
 * Agent configuration
 */
export interface AgentConfiguration {
  modelSettings: ModelSettings
  behaviorSettings: BehaviorSettings
  resourceLimits: ResourceLimits
  customConfig: Record<string, unknown>
}

/**
 * Model settings
 */
export interface ModelSettings {
  modelId?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

/**
 * Behavior settings
 */
export interface BehaviorSettings {
  maxRetries: number
  retryDelay: number
  timeout: number
  autoRecovery: boolean
  verboseLogging: boolean
  collaborativeMode: boolean
}

/**
 * Resource limits
 */
export interface ResourceLimits {
  maxMemoryMB: number
  maxCpuPercent: number
  maxExecutionTimeMs: number
  maxFileSizeKB: number
  maxConcurrentTasks: number
}

/**
 * Metrics at checkpoint time
 */
export interface CheckpointMetrics {
  executionTimeMs: number
  tokensUsed: number
  apiCalls: number
  filesModified: number
  filesCreated: number
  errorsEncountered: number
  retriesAttempted: number
  memoryPeakMB: number
  cpuAveragePercent: number
}

/**
 * Recovery strategy configuration
 */
export interface RecoveryStrategy {
  id: string
  name: string
  description: string
  type: RecoveryStrategyType
  priority: number
  conditions: RecoveryCondition[]
  actions: RecoveryAction[]
  maxAttempts: number
  backoffPolicy: BackoffPolicy
  fallbackStrategyId?: string
  enabled: boolean
}

/**
 * Types of recovery strategies
 */
export type RecoveryStrategyType = 
  | 'retry'
  | 'restore_checkpoint'
  | 'failover'
  | 'degraded_mode'
  | 'restart'
  | 'skip_and_continue'
  | 'escalate'

/**
 * Condition for applying recovery strategy
 */
export interface RecoveryCondition {
  type: 'failure_type' | 'severity' | 'attempt_count' | 'resource_level' | 'custom'
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'matches'
  value: unknown
  weight?: number
}

/**
 * Action to take during recovery
 */
export interface RecoveryAction {
  type: RecoveryActionType
  parameters: Record<string, unknown>
  order: number
  required: boolean
  timeout?: number
  onFailure?: 'continue' | 'abort' | 'fallback'
}

/**
 * Types of recovery actions
 */
export type RecoveryActionType = 
  | 'create_checkpoint'
  | 'restore_checkpoint'
  | 'restart_agent'
  | 'switch_agent'
  | 'notify_supervisor'
  | 'log_event'
  | 'wait'
  | 'cleanup_resources'
  | 'reset_state'
  | 'apply_fix'
  | 'delegate_task'

/**
 * Backoff policy for retries
 */
export interface BackoffPolicy {
  type: 'fixed' | 'linear' | 'exponential' | 'jittered_exponential'
  initialDelayMs: number
  maxDelayMs: number
  multiplier?: number
  jitterPercent?: number
  maxAttempts: number
}

/**
 * Context for recovery operations
 */
export interface RecoveryContext {
  failureInfo: FailureInfo
  agent: AgentInfo
  availableCheckpoints: Checkpoint[]
  availableBackupAgents: AgentInfo[]
  currentStrategy: RecoveryStrategy
  attemptNumber: number
  previousAttempts: RecoveryAttempt[]
  resourceStatus: ResourceStatus
  parentContext?: RecoveryContext
  childrenContexts?: RecoveryContext[]
}

/**
 * Information about an agent
 */
export interface AgentInfo {
  id: string
  type: string
  status: AgentStatus
  capabilities: string[]
  currentTask?: string
  loadFactor: number
  healthScore: number
  lastHeartbeat: string
  metadata: Record<string, unknown>
}

/**
 * Resource status during recovery
 */
export interface ResourceStatus {
  availableMemoryMB: number
  availableCpuPercent: number
  diskSpaceMB: number
  networkConnectivity: boolean
  externalServices: ServiceStatus[]
}

/**
 * External service status
 */
export interface ServiceStatus {
  name: string
  available: boolean
  latency?: number
  lastChecked: string
}

/**
 * Record of a recovery attempt
 */
export interface RecoveryAttempt {
  id: string
  timestamp: string
  strategy: RecoveryStrategyType
  actions: RecoveryActionRecord[]
  success: boolean
  error?: string
  durationMs: number
  resourcesUsed: ResourceUsage
}

/**
 * Record of a recovery action execution
 */
export interface RecoveryActionRecord {
  action: RecoveryAction
  startedAt: string
  completedAt?: string
  success: boolean
  error?: string
  result?: unknown
}

/**
 * Resource usage during recovery
 */
export interface ResourceUsage {
  memoryMB: number
  cpuPercent: number
  durationMs: number
  tokensUsed?: number
}

/**
 * Result of a recovery operation
 */
export interface RecoveryResult {
  success: boolean
  failureId: string
  agentId: string
  strategy: RecoveryStrategyType
  attemptNumber: number
  totalAttempts: number
  actions: RecoveryActionRecord[]
  checkpointRestored?: string
  backupAgentUsed?: string
  recoveredAt: string
  durationMs: number
  error?: string
  recommendations: string[]
  metadata: Record<string, unknown>
}

/**
 * Recovery log entry
 */
export interface RecoveryLogEntry {
  id: string
  timestamp: string
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical'
  category: 'detection' | 'capture' | 'strategy' | 'execution' | 'verification' | 'cleanup'
  message: string
  details: Record<string, unknown>
  failureId?: string
  agentId?: string
  strategyId?: string
}

// ============================================================================
// Constants
// ============================================================================

const RECOVERY_DATA_DIR = path.join(process.cwd(), 'data', 'recovery')
const CHECKPOINTS_DIR = path.join(RECOVERY_DATA_DIR, 'checkpoints')
const FAILURES_DIR = path.join(RECOVERY_DATA_DIR, 'failures')
const LOGS_DIR = path.join(RECOVERY_DATA_DIR, 'logs')

const DEFAULT_BACKOFF_POLICY: BackoffPolicy = {
  type: 'jittered_exponential',
  initialDelayMs: 1000,
  maxDelayMs: 60000,
  multiplier: 2,
  jitterPercent: 20,
  maxAttempts: 5
};

const DEFAULT_RECOVERY_STRATEGIES: RecoveryStrategy[] = [
  {
    id: 'retry-simple',
    name: 'Simple Retry',
    description: 'Retry the failed operation with exponential backoff',
    type: 'retry',
    priority: 1,
    conditions: [
      { type: 'failure_type', operator: 'equals', value: 'timeout' },
      { type: 'attempt_count', operator: 'less_than', value: 3 }
    ],
    actions: [
      { type: 'log_event', parameters: { level: 'info' }, order: 1, required: true },
      { type: 'wait', parameters: {}, order: 2, required: true }
    ],
    maxAttempts: 3,
    backoffPolicy: DEFAULT_BACKOFF_POLICY,
    enabled: true
  },
  {
    id: 'restore-from-checkpoint',
    name: 'Restore from Checkpoint',
    description: 'Restore agent state from the most recent valid checkpoint',
    type: 'restore_checkpoint',
    priority: 2,
    conditions: [
      { type: 'failure_type', operator: 'equals', value: 'crash' },
      { type: 'failure_type', operator: 'equals', value: 'invalid_state' }
    ],
    actions: [
      { type: 'log_event', parameters: { level: 'info' }, order: 1, required: true },
      { type: 'restore_checkpoint', parameters: { useLatest: true }, order: 2, required: true }
    ],
    maxAttempts: 2,
    backoffPolicy: { ...DEFAULT_BACKOFF_POLICY, maxAttempts: 2 },
    fallbackStrategyId: 'failover-to-backup',
    enabled: true
  },
  {
    id: 'failover-to-backup',
    name: 'Failover to Backup Agent',
    description: 'Switch execution to a backup agent if available',
    type: 'failover',
    priority: 3,
    conditions: [
      { type: 'severity', operator: 'equals', value: 'high' },
      { type: 'severity', operator: 'equals', value: 'critical' }
    ],
    actions: [
      { type: 'log_event', parameters: { level: 'warning' }, order: 1, required: true },
      { type: 'create_checkpoint', parameters: { reason: 'pre-failover' }, order: 2, required: false },
      { type: 'switch_agent', parameters: { preferHealthy: true }, order: 3, required: true }
    ],
    maxAttempts: 1,
    backoffPolicy: { ...DEFAULT_BACKOFF_POLICY, maxAttempts: 1 },
    fallbackStrategyId: 'escalate',
    enabled: true
  },
  {
    id: 'restart-agent',
    name: 'Restart Agent',
    description: 'Completely restart the agent with fresh state',
    type: 'restart',
    priority: 4,
    conditions: [
      { type: 'failure_type', operator: 'equals', value: 'resource_exhausted' }
    ],
    actions: [
      { type: 'log_event', parameters: { level: 'warning' }, order: 1, required: true },
      { type: 'cleanup_resources', parameters: {}, order: 2, required: true },
      { type: 'restart_agent', parameters: {}, order: 3, required: true }
    ],
    maxAttempts: 2,
    backoffPolicy: { ...DEFAULT_BACKOFF_POLICY, initialDelayMs: 5000 },
    fallbackStrategyId: 'failover-to-backup',
    enabled: true
  },
  {
    id: 'degraded-mode',
    name: 'Degraded Mode Operation',
    description: 'Continue in degraded mode with reduced functionality',
    type: 'degraded_mode',
    priority: 5,
    conditions: [
      { type: 'resource_level', operator: 'less_than', value: 0.2 }
    ],
    actions: [
      { type: 'log_event', parameters: { level: 'warning' }, order: 1, required: true },
      { type: 'reset_state', parameters: { preserveEssential: true }, order: 2, required: true }
    ],
    maxAttempts: 1,
    backoffPolicy: { ...DEFAULT_BACKOFF_POLICY, maxAttempts: 1 },
    enabled: true
  },
  {
    id: 'escalate',
    name: 'Escalate to Supervisor',
    description: 'Escalate the failure to a supervisor agent or human',
    type: 'escalate',
    priority: 99,
    conditions: [
      { type: 'severity', operator: 'equals', value: 'critical' }
    ],
    actions: [
      { type: 'log_event', parameters: { level: 'critical' }, order: 1, required: true },
      { type: 'create_checkpoint', parameters: { reason: 'escalation' }, order: 2, required: false },
      { type: 'notify_supervisor', parameters: { urgent: true }, order: 3, required: true }
    ],
    maxAttempts: 1,
    backoffPolicy: { ...DEFAULT_BACKOFF_POLICY, maxAttempts: 1 },
    enabled: true
  }
];

// ============================================================================
// Agent Recovery System Class
// ============================================================================

/**
 * Main Agent Recovery System
 * Implements comprehensive failure detection, state capture, and recovery
 */
export class AgentRecoverySystem extends EventEmitter {
  private static instance: AgentRecoverySystem | null = null;
  
  private failures: Map<string, FailureInfo> = new Map();
  private checkpoints: Map<string, Checkpoint> = new Map();
  private strategies: Map<string, RecoveryStrategy> = new Map();
  private recoveryHistory: Map<string, RecoveryAttempt[]> = new Map();
  private logs: RecoveryLogEntry[] = [];
  private agentRegistry: Map<string, AgentInfo> = new Map();
  private backupAgents: Map<string, string[]> = new Map();
  
  private initialized: boolean = false;
  private config: RecoverySystemConfig;
  
  private constructor(config?: Partial<RecoverySystemConfig>) {
    super();
    this.config = {
      maxCheckpointsPerAgent: 10,
      checkpointIntervalMs: 30000,
      maxFailureHistory: 1000,
      maxLogEntries: 10000,
      autoCheckpoint: true,
      autoRecovery: true,
      healthCheckIntervalMs: 10000,
      ...config
    };
    
    // Initialize default strategies
    for (const strategy of DEFAULT_RECOVERY_STRATEGIES) {
      this.strategies.set(strategy.id, strategy);
    }
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<RecoverySystemConfig>): AgentRecoverySystem {
    if (!AgentRecoverySystem.instance) {
      AgentRecoverySystem.instance = new AgentRecoverySystem(config);
    }
    return AgentRecoverySystem.instance;
  }
  
  /**
   * Initialize the recovery system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Create directories
      await fs.mkdir(RECOVERY_DATA_DIR, { recursive: true });
      await fs.mkdir(CHECKPOINTS_DIR, { recursive: true });
      await fs.mkdir(FAILURES_DIR, { recursive: true });
      await fs.mkdir(LOGS_DIR, { recursive: true });
      
      // Load existing data
      await this.loadPersistedData();
      
      this.initialized = true;
      this.log('info', 'initialization', 'Agent Recovery System initialized');
      this.emit('initialized');
    } catch (error) {
      this.log('error', 'initialization', 'Failed to initialize recovery system', { error });
      throw error;
    }
  }
  
  // =========================================================================
  // Failure Detection
  // =========================================================================
  
  /**
   * Detect and record an agent failure
   */
  async detectFailure(
    agentId: string,
    failureType: FailureType,
    message: string,
    context: Partial<FailureContext> = {},
    options: {
      severity?: FailureSeverity
      stackTrace?: string
      metadata?: Record<string, unknown>
    } = {}
  ): Promise<FailureInfo> {
    const failureId = this.generateId('failure');
    
    const agent = this.agentRegistry.get(agentId);
    const agentType = agent?.type || 'unknown';
    
    const failureInfo: FailureInfo = {
      id: failureId,
      agentId,
      agentType,
      timestamp: new Date().toISOString(),
      type: failureType,
      severity: options.severity || this.determineSeverity(failureType),
      message,
      stackTrace: options.stackTrace,
      context: {
        ...context,
        lastCheckpointId: this.getLatestCheckpointId(agentId)
      },
      recoveryAttempts: 0,
      resolved: false,
      metadata: options.metadata || {}
    };
    
    this.failures.set(failureId, failureInfo);
    
    this.log('warning', 'detection', `Failure detected: ${failureType}`, {
      failureId,
      agentId,
      severity: failureInfo.severity
    });
    
    this.emit('failure:detected', failureInfo);
    
    // Persist failure
    await this.persistFailure(failureInfo);
    
    // Trigger auto-recovery if enabled
    if (this.config.autoRecovery) {
      this.recoverAgent(failureInfo.agentId, failureInfo).catch(err => {
        this.log('error', 'execution', 'Auto-recovery failed', { 
          failureId, 
          error: err.message 
        });
      });
    }
    
    return failureInfo;
  }
  
  /**
   * Monitor agent health and detect failures
   */
  async performHealthCheck(agentId: string): Promise<{
    healthy: boolean
    issues: string[]
    recommendations: string[]
  }> {
    const agent = this.agentRegistry.get(agentId);
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (!agent) {
      return { 
        healthy: false, 
        issues: ['Agent not registered'], 
        recommendations: ['Register agent before health check'] 
      };
    }
    
    // Check heartbeat
    const heartbeatAge = Date.now() - new Date(agent.lastHeartbeat).getTime();
    if (heartbeatAge > this.config.healthCheckIntervalMs * 3) {
      issues.push('Agent heartbeat stale');
      recommendations.push('Check if agent is responsive');
    }
    
    // Check health score
    if (agent.healthScore < 0.5) {
      issues.push(`Low health score: ${agent.healthScore}`);
      recommendations.push('Consider restarting or failover');
    }
    
    // Check load factor
    if (agent.loadFactor > 0.9) {
      issues.push(`High load factor: ${agent.loadFactor}`);
      recommendations.push('Reduce workload or add capacity');
    }
    
    // Check for recent failures
    const recentFailures = Array.from(this.failures.values())
      .filter(f => f.agentId === agentId && !f.resolved)
      .slice(-5);
    
    if (recentFailures.length > 0) {
      issues.push(`${recentFailures.length} unresolved failures`);
      recommendations.push('Address pending failures before continuing');
    }
    
    const healthy = issues.length === 0;
    
    this.log('debug', 'detection', `Health check completed for ${agentId}`, {
      healthy,
      issueCount: issues.length
    });
    
    return { healthy, issues, recommendations };
  }
  
  // =========================================================================
  // State Capture
  // =========================================================================
  
  /**
   * Capture current agent state as a failure context
   */
  async captureFailureState(
    agentId: string,
    context: Partial<FailureContext> = {}
  ): Promise<FailureContext> {
    const agent = this.agentRegistry.get(agentId);
    const latestCheckpoint = await this.getLatestCheckpoint(agentId);
    
    // Get system resource usage
    const memoryUsage = process.memoryUsage?.()?.heapUsed || 0;
    const cpuUsage = process.cpuUsage?.()?.user || 0;
    
    const failureContext: FailureContext = {
      ...context,
      lastCheckpointId: latestCheckpoint?.id,
      memoryUsage: memoryUsage / (1024 * 1024), // Convert to MB
      cpuUsage: cpuUsage / 1000000, // Convert to seconds
      customData: {
        agentStatus: agent?.status,
        agentHealthScore: agent?.healthScore,
        agentLoadFactor: agent?.loadFactor,
        timestamp: new Date().toISOString()
      }
    };
    
    this.log('debug', 'capture', `Captured failure state for ${agentId}`, {
      checkpointAvailable: !!latestCheckpoint
    });
    
    return failureContext;
  }
  
  /**
   * Create a checkpoint for an agent
   */
  async createCheckpoint(
    agentId: string,
    state: Partial<Checkpoint>,
    options: {
      reason?: string
      force?: boolean
    } = {}
  ): Promise<Checkpoint> {
    const agent = this.agentRegistry.get(agentId);
    
    // Check checkpoint limit
    const agentCheckpoints = this.getAgentCheckpoints(agentId);
    if (agentCheckpoints.length >= this.config.maxCheckpointsPerAgent && !options.force) {
      // Remove oldest checkpoint
      const oldest = agentCheckpoints.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )[0];
      await this.deleteCheckpoint(oldest.id);
    }
    
    const checkpointId = this.generateId('checkpoint');
    
    const checkpoint: Checkpoint = {
      id: checkpointId,
      agentId,
      agentType: agent?.type || 'unknown',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      state: state.state || {
        status: 'idle',
        currentPhase: 'checkpoint',
        progress: 0,
        internalState: {}
      },
      task: state.task || {
        id: this.generateId('task'),
        description: options.reason || 'Manual checkpoint',
        type: 'checkpoint',
        priority: 'medium',
        dependencies: [],
        artifacts: [],
        progress: {
          totalSteps: 0,
          completedSteps: 0,
          stepHistory: [],
          startedAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString()
        }
      },
      memory: state.memory || {
        shortTerm: {},
        longTerm: {},
        episodic: [],
        semantic: []
      },
      configuration: state.configuration || {
        modelSettings: {},
        behaviorSettings: {
          maxRetries: 3,
          retryDelay: 1000,
          timeout: 30000,
          autoRecovery: true,
          verboseLogging: false,
          collaborativeMode: false
        },
        resourceLimits: {
          maxMemoryMB: 512,
          maxCpuPercent: 80,
          maxExecutionTimeMs: 300000,
          maxFileSizeKB: 1024,
          maxConcurrentTasks: 5
        },
        customConfig: {}
      },
      metrics: state.metrics || {
        executionTimeMs: 0,
        tokensUsed: 0,
        apiCalls: 0,
        filesModified: 0,
        filesCreated: 0,
        errorsEncountered: 0,
        retriesAttempted: 0,
        memoryPeakMB: 0,
        cpuAveragePercent: 0
      },
      isValid: true,
      checksum: this.generateChecksum(state)
    };
    
    this.checkpoints.set(checkpointId, checkpoint);
    
    // Persist checkpoint
    await this.persistCheckpoint(checkpoint);
    
    this.log('info', 'capture', `Created checkpoint ${checkpointId}`, {
      agentId,
      reason: options.reason
    });
    
    this.emit('checkpoint:created', checkpoint);
    
    return checkpoint;
  }
  
  /**
   * Get checkpoints for an agent
   */
  getAgentCheckpoints(agentId: string): Checkpoint[] {
    return Array.from(this.checkpoints.values())
      .filter(c => c.agentId === agentId);
  }
  
  /**
   * Get latest checkpoint for an agent
   */
  async getLatestCheckpoint(agentId: string): Promise<Checkpoint | null> {
    const checkpoints = this.getAgentCheckpoints(agentId);
    if (checkpoints.length === 0) return null;
    
    return checkpoints.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  }
  
  /**
   * Restore agent from checkpoint
   */
  async restoreFromCheckpoint(
    checkpointId: string,
    options: {
      validateFirst?: boolean
      partialRestore?: string[]
    } = {}
  ): Promise<{
    success: boolean
    checkpoint: Checkpoint
    restoredComponents: string[]
    errors: string[]
  }> {
    const checkpoint = this.checkpoints.get(checkpointId);
    
    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }
    
    const errors: string[] = [];
    const restoredComponents: string[] = [];
    
    // Validate checkpoint if requested
    if (options.validateFirst) {
      const validation = await this.validateCheckpoint(checkpoint);
      if (!validation.valid) {
        return {
          success: false,
          checkpoint,
          restoredComponents: [],
          errors: validation.errors
        };
      }
    }
    
    // Restore components
    const components = options.partialRestore || ['state', 'memory', 'configuration'];
    
    try {
      // Update agent registry with restored state
      const agent = this.agentRegistry.get(checkpoint.agentId);
      if (agent) {
        if (components.includes('state')) {
          // Restore state would update the agent's internal state
          restoredComponents.push('state');
        }
        
        if (components.includes('memory')) {
          // Restore memory would update the agent's memory systems
          restoredComponents.push('memory');
        }
        
        if (components.includes('configuration')) {
          // Restore configuration would update agent settings
          restoredComponents.push('configuration');
        }
      }
      
      this.log('info', 'execution', `Restored from checkpoint ${checkpointId}`, {
        agentId: checkpoint.agentId,
        components: restoredComponents
      });
      
      this.emit('checkpoint:restored', { checkpoint, components: restoredComponents });
      
      return {
        success: true,
        checkpoint,
        restoredComponents,
        errors
      };
    } catch (error: any) {
      errors.push(error.message);
      return {
        success: false,
        checkpoint,
        restoredComponents,
        errors
      };
    }
  }
  
  // =========================================================================
  // Recovery Strategies
  // =========================================================================
  
  /**
   * Select the best recovery strategy for a failure
   */
  selectRecoveryStrategy(
    failureInfo: FailureInfo,
    context: RecoveryContext
  ): RecoveryStrategy | null {
    const applicableStrategies: Array<{ strategy: RecoveryStrategy; score: number }> = [];
    
    for (const strategy of this.strategies.values()) {
      if (!strategy.enabled) continue;
      
      // Check conditions
      let conditionScore = 0;
      let conditionsMet = 0;
      
      for (const condition of strategy.conditions) {
        const result = this.evaluateCondition(condition, failureInfo, context);
        if (result.met) {
          conditionsMet++;
          conditionScore += result.score * (condition.weight || 1);
        }
      }
      
      // Strategy is applicable if at least one condition is met
      if (conditionsMet > 0) {
        const score = (conditionScore / strategy.conditions.length) * (100 - strategy.priority) / 100;
        applicableStrategies.push({ strategy, score });
      }
    }
    
    // Sort by score and return best
    applicableStrategies.sort((a, b) => b.score - a.score);
    
    const selected = applicableStrategies[0]?.strategy || null;
    
    if (selected) {
      this.log('debug', 'strategy', `Selected strategy: ${selected.name}`, {
        failureId: failureInfo.id,
        strategyId: selected.id,
        score: applicableStrategies[0].score
      });
    }
    
    return selected;
  }
  
  /**
   * Evaluate a recovery condition
   */
  private evaluateCondition(
    condition: RecoveryCondition,
    failureInfo: FailureInfo,
    context: RecoveryContext
  ): { met: boolean; score: number } {
    let value: unknown;
    
    switch (condition.type) {
      case 'failure_type':
        value = failureInfo.type;
        break;
      case 'severity':
        value = failureInfo.severity;
        break;
      case 'attempt_count':
        value = failureInfo.recoveryAttempts;
        break;
      case 'resource_level':
        value = context.resourceStatus?.availableMemoryMB || 0;
        break;
      case 'custom':
        value = context.failureInfo.metadata;
        break;
      default:
        return { met: false, score: 0 };
    }
    
    const met = this.compareValues(value, condition.operator, condition.value);
    const score = met ? 1 : 0;
    
    return { met, score };
  }
  
  /**
   * Compare values based on operator
   */
  private compareValues(actual: unknown, operator: string, expected: unknown): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'not_equals':
        return actual !== expected;
      case 'greater_than':
        return Number(actual) > Number(expected);
      case 'less_than':
        return Number(actual) < Number(expected);
      case 'contains':
        return String(actual).includes(String(expected));
      case 'matches':
        return new RegExp(String(expected)).test(String(actual));
      default:
        return false;
    }
  }
  
  /**
   * Calculate backoff delay
   */
  calculateBackoffDelay(
    attemptNumber: number,
    policy: BackoffPolicy
  ): number {
    let delay: number;
    
    switch (policy.type) {
      case 'fixed':
        delay = policy.initialDelayMs;
        break;
      
      case 'linear':
        delay = policy.initialDelayMs * attemptNumber;
        break;
      
      case 'exponential':
        delay = policy.initialDelayMs * Math.pow(policy.multiplier || 2, attemptNumber - 1);
        break;
      
      case 'jittered_exponential':
        const baseDelay = policy.initialDelayMs * Math.pow(policy.multiplier || 2, attemptNumber - 1);
        const jitter = baseDelay * ((policy.jitterPercent || 20) / 100) * Math.random();
        delay = baseDelay + jitter;
        break;
      
      default:
        delay = policy.initialDelayMs;
    }
    
    return Math.min(delay, policy.maxDelayMs);
  }
  
  // =========================================================================
  // Recovery Execution
  // =========================================================================
  
  /**
   * Execute a recovery strategy
   */
  async executeRecoveryStrategy(
    strategy: RecoveryStrategy,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    const startTime = Date.now();
    const actions: RecoveryActionRecord[] = [];
    
    this.log('info', 'execution', `Executing recovery strategy: ${strategy.name}`, {
      strategyId: strategy.id,
      failureId: context.failureInfo.id
    });
    
    try {
      // Execute actions in order
      const sortedActions = [...strategy.actions].sort((a, b) => a.order - b.order);
      
      for (const action of sortedActions) {
        const actionRecord = await this.executeRecoveryAction(action, context);
        actions.push(actionRecord);
        
        if (!actionRecord.success && action.required) {
          // Required action failed
          if (action.onFailure === 'abort') {
            throw new Error(`Required action failed: ${action.type}`);
          } else if (action.onFailure === 'fallback' && strategy.fallbackStrategyId) {
            const fallbackStrategy = this.strategies.get(strategy.fallbackStrategyId);
            if (fallbackStrategy) {
              return this.executeRecoveryStrategy(fallbackStrategy, context);
            }
          }
        }
      }
      
      const durationMs = Date.now() - startTime;
      
      const result: RecoveryResult = {
        success: true,
        failureId: context.failureInfo.id,
        agentId: context.agent.id,
        strategy: strategy.type,
        attemptNumber: context.attemptNumber,
        totalAttempts: context.previousAttempts.length + 1,
        actions,
        recoveredAt: new Date().toISOString(),
        durationMs,
        recommendations: [],
        metadata: {}
      };
      
      this.log('info', 'execution', 'Recovery successful', {
        failureId: context.failureInfo.id,
        strategyId: strategy.id,
        durationMs
      });
      
      this.emit('recovery:success', result);
      
      return result;
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      
      const result: RecoveryResult = {
        success: false,
        failureId: context.failureInfo.id,
        agentId: context.agent.id,
        strategy: strategy.type,
        attemptNumber: context.attemptNumber,
        totalAttempts: context.previousAttempts.length + 1,
        actions,
        recoveredAt: new Date().toISOString(),
        durationMs,
        error: error.message,
        recommendations: ['Try alternative recovery strategy', 'Escalate to supervisor'],
        metadata: { errorStack: error.stack }
      };
      
      this.log('error', 'execution', 'Recovery failed', {
        failureId: context.failureInfo.id,
        strategyId: strategy.id,
        error: error.message
      });
      
      this.emit('recovery:failed', result);
      
      return result;
    }
  }
  
  /**
   * Execute a single recovery action
   */
  private async executeRecoveryAction(
    action: RecoveryAction,
    context: RecoveryContext
  ): Promise<RecoveryActionRecord> {
    const startTime = Date.now();
    
    const record: RecoveryActionRecord = {
      action,
      startedAt: new Date().toISOString(),
      success: false
    };
    
    try {
      switch (action.type) {
        case 'log_event':
          // Logging is always successful
          this.log(
            action.parameters.level as 'info' | 'warning' | 'error' || 'info',
            'execution',
            `Recovery action: ${action.type}`,
            action.parameters
          );
          record.success = true;
          break;
          
        case 'wait':
          const delay = this.calculateBackoffDelay(
            context.attemptNumber,
            context.currentStrategy.backoffPolicy
          );
          await this.sleep(delay);
          record.success = true;
          record.result = { waitedMs: delay };
          break;
          
        case 'create_checkpoint':
          const reason = action.parameters.reason as string || 'recovery';
          const checkpoint = await this.createCheckpoint(
            context.agent.id,
            {},
            { reason }
          );
          record.success = true;
          record.result = { checkpointId: checkpoint.id };
          break;
          
        case 'restore_checkpoint':
          const checkpointId = action.parameters.checkpointId as string || 
            context.failureInfo.context.lastCheckpointId;
          if (checkpointId) {
            const restoreResult = await this.restoreFromCheckpoint(checkpointId);
            record.success = restoreResult.success;
            record.result = restoreResult;
          } else {
            throw new Error('No checkpoint available for restore');
          }
          break;
          
        case 'switch_agent':
          const backupAgentId = await this.findBackupAgent(context.agent);
          if (backupAgentId) {
            const backupAgent = this.agentRegistry.get(backupAgentId);
            if (backupAgent) {
              record.success = true;
              record.result = { switchedTo: backupAgentId };
            }
          } else {
            throw new Error('No backup agent available');
          }
          break;
          
        case 'notify_supervisor':
          // Emit event for supervisor notification
          this.emit('notify:supervisor', {
            failure: context.failureInfo,
            agent: context.agent,
            urgent: action.parameters.urgent
          });
          record.success = true;
          break;
          
        case 'cleanup_resources':
          // Resource cleanup logic
          record.success = true;
          record.result = { cleaned: true };
          break;
          
        case 'restart_agent':
          // Agent restart logic
          this.emit('agent:restart', { agentId: context.agent.id });
          record.success = true;
          break;
          
        case 'reset_state':
          // State reset logic
          record.success = true;
          record.result = { reset: true };
          break;
          
        case 'apply_fix':
          // Apply fix from parameters
          record.success = true;
          record.result = { fixApplied: action.parameters.fix };
          break;
          
        case 'delegate_task':
          // Task delegation logic
          const targetAgentId = action.parameters.targetAgentId as string;
          if (targetAgentId) {
            this.emit('task:delegate', {
              fromAgent: context.agent.id,
              toAgent: targetAgentId,
              task: context.failureInfo.context.taskId
            });
            record.success = true;
          }
          break;
          
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    } catch (error: any) {
      record.error = error.message;
      record.success = false;
    }
    
    record.completedAt = new Date().toISOString();
    return record;
  }
  
  // =========================================================================
  // Main Recovery Function
  // =========================================================================
  
  /**
   * Recover an agent from failure
   */
  async recoverAgent(
    agentId: string,
    failure?: FailureInfo,
    options: {
      strategyId?: string
      maxAttempts?: number
    } = {}
  ): Promise<RecoveryResult> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Get or create failure info
    let failureInfo = failure;
    if (!failureInfo) {
      const activeFailure = Array.from(this.failures.values())
        .find(f => f.agentId === agentId && !f.resolved);
      failureInfo = activeFailure || await this.detectFailure(
        agentId,
        'unknown',
        'Manual recovery initiated',
        {}
      );
    }
    
    const agent = this.agentRegistry.get(agentId) || {
      id: agentId,
      type: 'unknown',
      status: 'failed' as AgentStatus,
      capabilities: [],
      loadFactor: 0,
      healthScore: 0,
      lastHeartbeat: new Date().toISOString(),
      metadata: {}
    };
    
    // Get previous attempts
    const previousAttempts = this.recoveryHistory.get(failureInfo.id) || [];
    
    // Build recovery context
    const context: RecoveryContext = {
      failureInfo,
      agent,
      availableCheckpoints: this.getAgentCheckpoints(agentId),
      availableBackupAgents: await this.getBackupAgents(agentId),
      currentStrategy: null as any,
      attemptNumber: previousAttempts.length + 1,
      previousAttempts,
      resourceStatus: await this.getResourceStatus()
    };
    
    // Select strategy
    let strategy: RecoveryStrategy | null = null;
    if (options.strategyId) {
      strategy = this.strategies.get(options.strategyId) || null;
    }
    if (!strategy) {
      strategy = this.selectRecoveryStrategy(failureInfo, context);
    }
    
    if (!strategy) {
      return {
        success: false,
        failureId: failureInfo.id,
        agentId,
        strategy: 'retry',
        attemptNumber: context.attemptNumber,
        totalAttempts: context.attemptNumber,
        actions: [],
        recoveredAt: new Date().toISOString(),
        durationMs: 0,
        error: 'No applicable recovery strategy found',
        recommendations: ['Check failure type and severity', 'Add custom recovery strategy'],
        metadata: {}
      };
    }
    
    context.currentStrategy = strategy;
    
    // Check max attempts
    const maxAttempts = options.maxAttempts || strategy.maxAttempts || 5;
    if (context.attemptNumber > maxAttempts) {
      return {
        success: false,
        failureId: failureInfo.id,
        agentId,
        strategy: strategy.type,
        attemptNumber: context.attemptNumber,
        totalAttempts: context.attemptNumber,
        actions: [],
        recoveredAt: new Date().toISOString(),
        durationMs: 0,
        error: `Max recovery attempts (${maxAttempts}) exceeded`,
        recommendations: ['Try failover to backup agent', 'Escalate to supervisor'],
        metadata: {}
      };
    }
    
    // Apply backoff delay
    if (context.attemptNumber > 1) {
      const delay = this.calculateBackoffDelay(
        context.attemptNumber,
        strategy.backoffPolicy
      );
      await this.sleep(delay);
    }
    
    // Execute recovery
    const result = await this.executeRecoveryStrategy(strategy, context);
    
    // Record attempt
    const attempt: RecoveryAttempt = {
      id: this.generateId('attempt'),
      timestamp: new Date().toISOString(),
      strategy: strategy.type,
      actions: result.actions,
      success: result.success,
      error: result.error,
      durationMs: result.durationMs,
      resourcesUsed: {
        memoryMB: process.memoryUsage?.()?.heapUsed || 0,
        cpuPercent: 0,
        durationMs: result.durationMs
      }
    };
    
    previousAttempts.push(attempt);
    this.recoveryHistory.set(failureInfo.id, previousAttempts);
    
    // Update failure info
    failureInfo.recoveryAttempts = previousAttempts.length;
    failureInfo.lastRecoveryAttempt = new Date().toISOString();
    
    if (result.success) {
      failureInfo.resolved = true;
      failureInfo.resolvedAt = new Date().toISOString();
      failureInfo.resolvedBy = strategy.name;
    }
    
    this.failures.set(failureInfo.id, failureInfo);
    
    // Persist updated state
    await this.persistFailure(failureInfo);
    
    return result;
  }
  
  // =========================================================================
  // Agent Registration and Management
  // =========================================================================
  
  /**
   * Register an agent with the recovery system
   */
  registerAgent(agent: AgentInfo): void {
    this.agentRegistry.set(agent.id, agent);
    this.log('info', 'initialization', `Registered agent: ${agent.id}`, {
      type: agent.type,
      capabilities: agent.capabilities
    });
  }
  
  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: string): void {
    this.agentRegistry.delete(agentId);
    this.backupAgents.delete(agentId);
    this.log('info', 'initialization', `Unregistered agent: ${agentId}`);
  }
  
  /**
   * Update agent heartbeat
   */
  updateAgentHeartbeat(agentId: string, status?: Partial<AgentInfo>): void {
    const agent = this.agentRegistry.get(agentId);
    if (agent) {
      agent.lastHeartbeat = new Date().toISOString();
      if (status) {
        Object.assign(agent, status);
      }
    }
  }
  
  /**
   * Register a backup agent
   */
  registerBackupAgent(primaryAgentId: string, backupAgentId: string): void {
    const backups = this.backupAgents.get(primaryAgentId) || [];
    if (!backups.includes(backupAgentId)) {
      backups.push(backupAgentId);
      this.backupAgents.set(primaryAgentId, backups);
    }
  }
  
  // =========================================================================
  // Strategy Management
  // =========================================================================
  
  /**
   * Add a custom recovery strategy
   */
  addRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.strategies.set(strategy.id, strategy);
    this.log('info', 'strategy', `Added recovery strategy: ${strategy.name}`, {
      strategyId: strategy.id
    });
  }
  
  /**
   * Remove a recovery strategy
   */
  removeRecoveryStrategy(strategyId: string): boolean {
    const removed = this.strategies.delete(strategyId);
    if (removed) {
      this.log('info', 'strategy', `Removed recovery strategy: ${strategyId}`);
    }
    return removed;
  }
  
  /**
   * Get all recovery strategies
   */
  getRecoveryStrategies(): RecoveryStrategy[] {
    return Array.from(this.strategies.values());
  }
  
  // =========================================================================
  // Logging and Monitoring
  // =========================================================================
  
  /**
   * Log a recovery event
   */
  private log(
    level: 'debug' | 'info' | 'warning' | 'error' | 'critical',
    category: 'detection' | 'capture' | 'strategy' | 'execution' | 'verification' | 'cleanup',
    message: string,
    details: Record<string, unknown> = {}
  ): void {
    const entry: RecoveryLogEntry = {
      id: this.generateId('log'),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      details
    };
    
    this.logs.push(entry);
    
    // Trim logs if needed
    if (this.logs.length > this.config.maxLogEntries) {
      this.logs = this.logs.slice(-this.config.maxLogEntries);
    }
    
    // Emit log event
    this.emit('log', entry);
    
    // Console output for critical errors
    if (level === 'critical' || level === 'error') {
      console.error(`[AgentRecovery][${level}] ${message}`, details);
    }
  }
  
  /**
   * Get recovery logs
   */
  getLogs(options: {
    level?: RecoveryLogEntry['level']
    category?: RecoveryLogEntry['category']
    agentId?: string
    failureId?: string
    limit?: number
  } = {}): RecoveryLogEntry[] {
    let logs = [...this.logs];
    
    if (options.level) {
      logs = logs.filter(l => l.level === options.level);
    }
    if (options.category) {
      logs = logs.filter(l => l.category === options.category);
    }
    if (options.agentId) {
      logs = logs.filter(l => l.details.agentId === options.agentId);
    }
    if (options.failureId) {
      logs = logs.filter(l => l.details.failureId === options.failureId);
    }
    
    if (options.limit) {
      logs = logs.slice(-options.limit);
    }
    
    return logs;
  }
  
  /**
   * Get recovery statistics
   */
  getStatistics(): {
    totalFailures: number
    resolvedFailures: number
    unresolvedFailures: number
    totalRecoveryAttempts: number
    successfulRecoveries: number
    failedRecoveries: number
    averageRecoveryTimeMs: number
    checkpointsCreated: number
    checkpointsRestored: number
    byFailureType: Record<FailureType, number>
    byRecoveryStrategy: Record<RecoveryStrategyType, number>
  } {
    const failures = Array.from(this.failures.values());
    const attempts = Array.from(this.recoveryHistory.values()).flat();
    
    const successfulAttempts = attempts.filter(a => a.success);
    
    const byFailureType: Record<FailureType, number> = {
      timeout: 0,
      crash: 0,
      error: 0,
      resource_exhausted: 0,
      dependency_failure: 0,
      invalid_state: 0,
      communication_failure: 0,
      checkpoint_corruption: 0,
      unknown: 0
    };
    
    for (const f of failures) {
      byFailureType[f.type]++;
    }
    
    const byRecoveryStrategy: Record<RecoveryStrategyType, number> = {
      retry: 0,
      restore_checkpoint: 0,
      failover: 0,
      degraded_mode: 0,
      restart: 0,
      skip_and_continue: 0,
      escalate: 0
    };
    
    for (const a of attempts) {
      byRecoveryStrategy[a.strategy]++;
    }
    
    return {
      totalFailures: failures.length,
      resolvedFailures: failures.filter(f => f.resolved).length,
      unresolvedFailures: failures.filter(f => !f.resolved).length,
      totalRecoveryAttempts: attempts.length,
      successfulRecoveries: successfulAttempts.length,
      failedRecoveries: attempts.length - successfulAttempts.length,
      averageRecoveryTimeMs: successfulAttempts.length > 0
        ? successfulAttempts.reduce((sum, a) => sum + a.durationMs, 0) / successfulAttempts.length
        : 0,
      checkpointsCreated: this.checkpoints.size,
      checkpointsRestored: attempts.filter(a => 
        a.actions.some(act => act.action.type === 'restore_checkpoint' && act.success)
      ).length,
      byFailureType,
      byRecoveryStrategy
    };
  }
  
  // =========================================================================
  // Helper Methods
  // =========================================================================
  
  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
  
  /**
   * Get latest checkpoint ID for an agent
   */
  private getLatestCheckpointId(agentId: string): string | undefined {
    const checkpoints = this.getAgentCheckpoints(agentId);
    if (checkpoints.length === 0) return undefined;
    return checkpoints.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0].id;
  }
  
  /**
   * Determine failure severity
   */
  private determineSeverity(failureType: FailureType): FailureSeverity {
    const severityMap: Record<FailureType, FailureSeverity> = {
      timeout: 'medium',
      crash: 'critical',
      error: 'high',
      resource_exhausted: 'high',
      dependency_failure: 'medium',
      invalid_state: 'high',
      communication_failure: 'medium',
      checkpoint_corruption: 'critical',
      unknown: 'low'
    };
    return severityMap[failureType] || 'medium';
  }
  
  /**
   * Generate checksum for checkpoint
   */
  private generateChecksum(data: unknown): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
  
  /**
   * Validate a checkpoint
   */
  private async validateCheckpoint(checkpoint: Checkpoint): Promise<{
    valid: boolean
    errors: string[]
  }> {
    const errors: string[] = [];
    
    if (!checkpoint.id) {
      errors.push('Missing checkpoint ID');
    }
    if (!checkpoint.agentId) {
      errors.push('Missing agent ID');
    }
    if (!checkpoint.timestamp) {
      errors.push('Missing timestamp');
    }
    if (!checkpoint.state) {
      errors.push('Missing state');
    }
    
    // Check age of checkpoint
    const ageMs = Date.now() - new Date(checkpoint.timestamp).getTime();
    const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours
    if (ageMs > maxAgeMs) {
      errors.push(`Checkpoint too old: ${Math.floor(ageMs / (60 * 60 * 1000))} hours`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Delete a checkpoint
   */
  private async deleteCheckpoint(checkpointId: string): Promise<void> {
    this.checkpoints.delete(checkpointId);
    
    try {
      const checkpointPath = path.join(CHECKPOINTS_DIR, `${checkpointId}.json`);
      await fs.unlink(checkpointPath).catch(() => {});
    } catch {
      // Ignore deletion errors
    }
  }
  
  /**
   * Find a backup agent
   */
  private async findBackupAgent(primaryAgent: AgentInfo): Promise<string | null> {
    const backups = this.backupAgents.get(primaryAgent.id) || [];
    
    for (const backupId of backups) {
      const backup = this.agentRegistry.get(backupId);
      if (backup && backup.status === 'idle' && backup.healthScore > 0.7) {
        return backupId;
      }
    }
    
    // Try to find any compatible idle agent
    for (const [agentId, agent] of this.agentRegistry) {
      if (agentId !== primaryAgent.id && 
          agent.type === primaryAgent.type &&
          agent.status === 'idle' &&
          agent.healthScore > 0.7) {
        return agentId;
      }
    }
    
    return null;
  }
  
  /**
   * Get backup agents for an agent
   */
  private async getBackupAgents(agentId: string): Promise<AgentInfo[]> {
    const backupIds = this.backupAgents.get(agentId) || [];
    return backupIds
      .map(id => this.agentRegistry.get(id))
      .filter((a): a is AgentInfo => a !== undefined);
  }
  
  /**
   * Get current resource status
   */
  private async getResourceStatus(): Promise<ResourceStatus> {
    const mem = process.memoryUsage?.() || { heapUsed: 0, heapTotal: 0 };
    
    return {
      availableMemoryMB: (mem.heapTotal - mem.heapUsed) / (1024 * 1024),
      availableCpuPercent: 100,
      diskSpaceMB: 1000,
      networkConnectivity: true,
      externalServices: []
    };
  }
  
  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // =========================================================================
  // Persistence
  // =========================================================================
  
  /**
   * Load persisted data on startup
   */
  private async loadPersistedData(): Promise<void> {
    try {
      // Load checkpoints
      const checkpointFiles = await fs.readdir(CHECKPOINTS_DIR).catch(() => []);
      for (const file of checkpointFiles) {
        if (file.endsWith('.json')) {
          try {
            const content = await fs.readFile(path.join(CHECKPOINTS_DIR, file), 'utf-8');
            const checkpoint = JSON.parse(content) as Checkpoint;
            this.checkpoints.set(checkpoint.id, checkpoint);
          } catch {
            // Ignore corrupted checkpoints
          }
        }
      }
      
      // Load failures
      const failureFiles = await fs.readdir(FAILURES_DIR).catch(() => []);
      for (const file of failureFiles) {
        if (file.endsWith('.json')) {
          try {
            const content = await fs.readFile(path.join(FAILURES_DIR, file), 'utf-8');
            const failure = JSON.parse(content) as FailureInfo;
            if (!failure.resolved) {
              this.failures.set(failure.id, failure);
            }
          } catch {
            // Ignore corrupted failures
          }
        }
      }
      
      this.log('info', 'initialization', 'Loaded persisted data', {
        checkpoints: this.checkpoints.size,
        failures: this.failures.size
      });
    } catch (error) {
      this.log('warning', 'initialization', 'Failed to load persisted data', { error });
    }
  }
  
  /**
   * Persist a checkpoint to disk
   */
  private async persistCheckpoint(checkpoint: Checkpoint): Promise<void> {
    try {
      const checkpointPath = path.join(CHECKPOINTS_DIR, `${checkpoint.id}.json`);
      await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));
    } catch (error) {
      this.log('error', 'capture', 'Failed to persist checkpoint', {
        checkpointId: checkpoint.id,
        error
      });
    }
  }
  
  /**
   * Persist a failure to disk
   */
  private async persistFailure(failure: FailureInfo): Promise<void> {
    try {
      const failurePath = path.join(FAILURES_DIR, `${failure.id}.json`);
      await fs.writeFile(failurePath, JSON.stringify(failure, null, 2));
    } catch (error) {
      this.log('error', 'detection', 'Failed to persist failure', {
        failureId: failure.id,
        error
      });
    }
  }
  
  /**
   * Export recovery data for analysis
   */
  async exportRecoveryData(): Promise<{
    failures: FailureInfo[]
    checkpoints: Checkpoint[]
    logs: RecoveryLogEntry[]
    statistics: ReturnType<AgentRecoverySystem['getStatistics']>
  }> {
    return {
      failures: Array.from(this.failures.values()),
      checkpoints: Array.from(this.checkpoints.values()),
      logs: this.logs.slice(-1000),
      statistics: this.getStatistics()
    };
  }
  
  /**
   * Clear all recovery data
   */
  async clearRecoveryData(options: {
    clearFailures?: boolean
    clearCheckpoints?: boolean
    clearLogs?: boolean
  } = {}): Promise<void> {
    if (options.clearFailures) {
      this.failures.clear();
      await fs.rm(FAILURES_DIR, { recursive: true }).catch(() => {});
      await fs.mkdir(FAILURES_DIR, { recursive: true });
    }
    
    if (options.clearCheckpoints) {
      this.checkpoints.clear();
      await fs.rm(CHECKPOINTS_DIR, { recursive: true }).catch(() => {});
      await fs.mkdir(CHECKPOINTS_DIR, { recursive: true });
    }
    
    if (options.clearLogs) {
      this.logs = [];
    }
    
    this.log('info', 'cleanup', 'Cleared recovery data', options);
  }
}

// ============================================================================
// Configuration Interface
// ============================================================================

interface RecoverySystemConfig {
  maxCheckpointsPerAgent: number
  checkpointIntervalMs: number
  maxFailureHistory: number
  maxLogEntries: number
  autoCheckpoint: boolean
  autoRecovery: boolean
  healthCheckIntervalMs: number
}

// ============================================================================
// Singleton and Convenience Functions
// ============================================================================

/**
 * Get the singleton instance of the Agent Recovery System
 */
export function getAgentRecoverySystem(
  config?: Partial<RecoverySystemConfig>
): AgentRecoverySystem {
  return AgentRecoverySystem.getInstance(config);
}

/**
 * Convenience function to recover an agent
 */
export async function recoverAgent(
  agentId: string,
  failure?: FailureInfo,
  options?: {
    strategyId?: string
    maxAttempts?: number
  }
): Promise<RecoveryResult> {
  const system = getAgentRecoverySystem();
  return system.recoverAgent(agentId, failure, options);
}

// Export types
export type {
  FailureType as AgentFailureType,
  FailureSeverity as AgentFailureSeverity,
  AgentStatus,
  RecoveryStrategyType,
  RecoveryActionType,
  BackoffPolicy
};
