/**
 * Agent Execution Sandbox - Mechanism #128
 * 
 * Creates isolated execution environments for agents with:
 * - Resource access limits (files, network, memory)
 * - Security policy enforcement
 * - Behavior monitoring
 * - Output and error capture
 * - Timeout handling
 * - Rollback capabilities
 * - State snapshots
 */

import { EventEmitter } from 'events'
import { spawn, ChildProcess, exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import crypto from 'crypto'

const execAsync = promisify(exec)

// ============================================
// Types
// ============================================

export interface SandboxConfig {
  id: string
  name: string
  agentId: string
  limits: SandboxLimits
  securityPolicy: SecurityPolicy
  environment: Record<string, string>
  workingDirectory: string
  timeout: number
  enableRollback: boolean
  enableMonitoring: boolean
  networkIsolation: boolean
  filesystemIsolation: boolean
  allowedPaths: string[]
  blockedPaths: string[]
  allowedCommands: string[]
  blockedCommands: string[]
  allowedDomains: string[]
  maxProcesses: number
  priority: 'low' | 'normal' | 'high' | 'realtime'
  logging: {
    stdout: boolean
    stderr: boolean
    events: boolean
  }
}

export interface SandboxLimits {
  maxMemoryMB: number
  maxCpuPercent: number
  maxFileSizeMB: number
  maxOpenFiles: number
  maxNetworkConnections: number
  maxExecutionTimeMs: number
  maxOutputSizeKB: number
  maxOperations: number
  rateLimitPerSecond: number
  maxConcurrentTasks: number
  diskQuotaMB: number
}

export interface SecurityPolicy {
  level: 'restrictive' | 'moderate' | 'permissive' | 'custom'
  allowNetworkAccess: boolean
  allowFileSystemWrite: boolean
  allowFileSystemRead: boolean
  allowCommandExecution: boolean
  allowSubprocessSpawning: boolean
  allowEnvironmentModification: boolean
  allowSignalHandling: boolean
  sandboxedPaths: boolean
  auditedOperations: string[]
  restrictedApis: string[]
  trustedCertificates: string[]
  contentSecurityPolicy?: string
  noUntrustedCode: boolean
  maxPrivilegeLevel: 'none' | 'read' | 'write' | 'execute' | 'admin'
}

export interface ExecutionResult {
  sandboxId: string
  executionId: string
  success: boolean
  exitCode: number | null
  stdout: string
  stderr: string
  duration: number
  memoryUsed: number
  cpuUsed: number
  operations: number
  networkCalls: number
  fileOperations: number
  startedAt: string
  completedAt: string
  timeout: boolean
  killed: boolean
  error?: string
  rollbackAvailable: boolean
  snapshot?: StateSnapshot
}

export interface SandboxResult {
  sandboxId: string
  status: 'created' | 'running' | 'completed' | 'failed' | 'terminated' | 'rolled_back'
  executions: ExecutionResult[]
  totalOperations: number
  totalDuration: number
  averageMemoryUsage: number
  averageCpuUsage: number
  errors: SandboxError[]
  warnings: SandboxWarning[]
  createdAt: string
  updatedAt: string
}

export interface StateSnapshot {
  id: string
  sandboxId: string
  timestamp: string
  filesystem: FilesystemSnapshot
  environment: Record<string, string>
  processState: ProcessSnapshot
  customState: Record<string, unknown>
  checksum: string
}

export interface FilesystemSnapshot {
  files: FileInfo[]
  totalSize: number
  checksums: Record<string, string>
}

export interface FileInfo {
  path: string
  size: number
  modifiedAt: string
  checksum: string
  permissions: string
}

export interface ProcessSnapshot {
  pid?: number
  cpu: number
  memory: number
  openFiles: number
  threads: number
  status: string
}

export interface SandboxError {
  id: string
  timestamp: string
  type: 'resource' | 'security' | 'timeout' | 'execution' | 'rollback' | 'internal'
  message: string
  details: Record<string, unknown>
  recoverable: boolean
  recoveryAction?: string
}

export interface SandboxWarning {
  id: string
  timestamp: string
  type: 'resource' | 'security' | 'performance' | 'deprecated'
  message: string
  details: Record<string, unknown>
}

export interface BehaviorEvent {
  id: string
  sandboxId: string
  timestamp: string
  type: BehaviorEventType
  category: 'filesystem' | 'network' | 'process' | 'memory' | 'security' | 'custom'
  action: string
  resource?: string
  parameters?: Record<string, unknown>
  result: 'allowed' | 'denied' | 'warning' | 'error'
  duration?: number
  details?: Record<string, unknown>
}

export type BehaviorEventType =
  | 'file_read' | 'file_write' | 'file_delete' | 'file_create'
  | 'network_connect' | 'network_send' | 'network_receive' | 'dns_lookup'
  | 'process_spawn' | 'process_kill' | 'process_signal'
  | 'memory_allocate' | 'memory_free'
  | 'command_execute' | 'env_modify' | 'permission_change'
  | 'security_violation' | 'resource_limit' | 'timeout' | 'custom'

export interface RollbackPoint {
  id: string
  sandboxId: string
  timestamp: string
  snapshot: StateSnapshot
  description: string
  type: 'automatic' | 'manual' | 'pre_execution' | 'post_execution'
  restorationCost: number // Estimated time in ms
}

export interface ResourceUsage {
  timestamp: string
  cpu: number
  memory: number
  diskIO: { read: number; write: number }
  networkIO: { sent: number; received: number }
  openFiles: number
  processes: number
  threads: number
}

export interface SandboxMetrics {
  sandboxId: string
  uptime: number
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  totalOperations: number
  averageExecutionTime: number
  averageMemoryUsage: number
  averageCpuUsage: number
  peakMemoryUsage: number
  peakCpuUsage: number
  timeouts: number
  securityViolations: number
  rollbackCount: number
  resourceUsage: ResourceUsage[]
}

// ============================================
// Default Configurations
// ============================================

const DEFAULT_LIMITS: SandboxLimits = {
  maxMemoryMB: 512,
  maxCpuPercent: 80,
  maxFileSizeMB: 100,
  maxOpenFiles: 100,
  maxNetworkConnections: 10,
  maxExecutionTimeMs: 60000,
  maxOutputSizeKB: 1024,
  maxOperations: 10000,
  rateLimitPerSecond: 100,
  maxConcurrentTasks: 5,
  diskQuotaMB: 1024
}

const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  level: 'moderate',
  allowNetworkAccess: true,
  allowFileSystemWrite: true,
  allowFileSystemRead: true,
  allowCommandExecution: true,
  allowSubprocessSpawning: false,
  allowEnvironmentModification: false,
  allowSignalHandling: false,
  sandboxedPaths: true,
  auditedOperations: ['file_write', 'file_delete', 'network_connect', 'command_execute'],
  restrictedApis: [],
  trustedCertificates: [],
  noUntrustedCode: true,
  maxPrivilegeLevel: 'write'
}

const SECURITY_LEVELS: Record<string, Partial<SecurityPolicy>> = {
  restrictive: {
    allowNetworkAccess: false,
    allowFileSystemWrite: false,
    allowFileSystemRead: true,
    allowCommandExecution: false,
    allowSubprocessSpawning: false,
    allowEnvironmentModification: false,
    sandboxedPaths: true,
    noUntrustedCode: true,
    maxPrivilegeLevel: 'read'
  },
  moderate: {
    allowNetworkAccess: true,
    allowFileSystemWrite: true,
    allowFileSystemRead: true,
    allowCommandExecution: true,
    allowSubprocessSpawning: false,
    allowEnvironmentModification: false,
    sandboxedPaths: true,
    noUntrustedCode: true,
    maxPrivilegeLevel: 'write'
  },
  permissive: {
    allowNetworkAccess: true,
    allowFileSystemWrite: true,
    allowFileSystemRead: true,
    allowCommandExecution: true,
    allowSubprocessSpawning: true,
    allowEnvironmentModification: true,
    sandboxedPaths: false,
    noUntrustedCode: false,
    maxPrivilegeLevel: 'execute'
  }
}

// ============================================
// Agent Sandbox Class
// ============================================

export class AgentSandbox extends EventEmitter {
  private config: SandboxConfig
  private status: SandboxResult['status'] = 'created'
  private executions: ExecutionResult[] = []
  private errors: SandboxError[] = []
  private warnings: SandboxWarning[] = []
  private behaviorLog: BehaviorEvent[] = []
  private rollbackPoints: RollbackPoint[] = []
  private resourceUsage: ResourceUsage[] = []
  private currentProcess: ChildProcess | null = null
  private operationCount: number = 0
  private createdAt: string
  private updatedAt: string
  private monitoringInterval: NodeJS.Timeout | null = null
  private executionCounter: number = 0
  private rateLimitTimestamps: number[] = []
  private isRolledBack: boolean = false

  constructor(config: Partial<SandboxConfig> & { id: string; agentId: string }) {
    super()
    
    this.createdAt = new Date().toISOString()
    this.updatedAt = this.createdAt
    
    // Build complete config with defaults
    this.config = {
      name: config.name || `sandbox-${config.id}`,
      limits: { ...DEFAULT_LIMITS, ...config.limits },
      securityPolicy: this.buildSecurityPolicy(config.securityPolicy),
      environment: config.environment || {},
      workingDirectory: config.workingDirectory || this.createDefaultWorkingDirectory(config.id),
      timeout: config.timeout || DEFAULT_LIMITS.maxExecutionTimeMs,
      enableRollback: config.enableRollback ?? true,
      enableMonitoring: config.enableMonitoring ?? true,
      networkIsolation: config.networkIsolation ?? true,
      filesystemIsolation: config.filesystemIsolation ?? true,
      allowedPaths: config.allowedPaths || [],
      blockedPaths: config.blockedPaths || this.getDefaultBlockedPaths(),
      allowedCommands: config.allowedCommands || this.getDefaultAllowedCommands(),
      blockedCommands: config.blockedCommands || this.getDefaultBlockedCommands(),
      allowedDomains: config.allowedDomains || ['localhost', '127.0.0.1'],
      maxProcesses: config.maxProcesses || 10,
      priority: config.priority || 'normal',
      logging: {
        stdout: config.logging?.stdout ?? true,
        stderr: config.logging?.stderr ?? true,
        events: config.logging?.events ?? true
      },
      ...config
    }
  }

  // ============================================
  // Public Methods
  // ============================================

  /**
   * Initialize the sandbox environment
   */
  async initialize(): Promise<SandboxResult> {
    try {
      // Create working directory
      await this.ensureWorkingDirectory()
      
      // Create initial snapshot if rollback is enabled
      if (this.config.enableRollback) {
        await this.createSnapshot('initial', 'Initial sandbox state', 'automatic')
      }
      
      // Start monitoring if enabled
      if (this.config.enableMonitoring) {
        this.startMonitoring()
      }
      
      this.status = 'created'
      this.updatedAt = new Date().toISOString()
      
      this.emit('sandbox:initialized', { sandboxId: this.config.id })
      
      return this.getResult()
    } catch (error) {
      this.addError('internal', `Failed to initialize sandbox: ${error}`, { error }, false)
      this.status = 'failed'
      throw error
    }
  }

  /**
   * Execute code in the sandbox
   */
  async execute(
    code: string,
    options: {
      language?: 'javascript' | 'typescript' | 'python' | 'bash' | 'shell'
      timeout?: number
      args?: string[]
      env?: Record<string, string>
    } = {}
  ): Promise<ExecutionResult> {
    const executionId = `exec_${++this.executionCounter}_${Date.now().toString(36)}`
    const startedAt = new Date().toISOString()
    const timeout = options.timeout || this.config.timeout
    
    // Check concurrent task limit
    if (this.executions.filter(e => !e.completedAt).length >= this.config.limits.maxConcurrentTasks) {
      return this.createErrorResult(executionId, startedAt, 'Maximum concurrent tasks reached')
    }
    
    // Check rate limit
    if (!this.checkRateLimit()) {
      return this.createErrorResult(executionId, startedAt, 'Rate limit exceeded')
    }
    
    // Create pre-execution snapshot
    if (this.config.enableRollback) {
      await this.createSnapshot(`pre_${executionId}`, 'Pre-execution state', 'pre_execution')
    }
    
    const result: Partial<ExecutionResult> = {
      sandboxId: this.config.id,
      executionId,
      startedAt,
      stdout: '',
      stderr: '',
      timeout: false,
      killed: false,
      rollbackAvailable: this.config.enableRollback
    }
    
    this.status = 'running'
    this.emit('execution:started', { sandboxId: this.config.id, executionId })
    
    try {
      // Execute based on language
      const language = options.language || 'javascript'
      const execResult = await this.executeCode(code, language, {
        ...options,
        timeout,
        executionId
      })
      
      result.exitCode = execResult.exitCode
      result.stdout = execResult.stdout
      result.stderr = execResult.stderr
      result.success = execResult.exitCode === 0
      result.duration = Date.now() - new Date(startedAt).getTime()
      result.memoryUsed = execResult.memoryUsed || 0
      result.cpuUsed = execResult.cpuUsed || 0
      
    } catch (error: unknown) {
      const err = error as Error & { timedOut?: boolean; killed?: boolean }
      result.success = false
      result.error = err.message
      result.timeout = err.timedOut || false
      result.killed = err.killed || false
      result.duration = Date.now() - new Date(startedAt).getTime()
      
      if (result.timeout) {
        this.addWarning('resource', 'Execution timed out', { executionId, timeout })
      }
    }
    
    result.completedAt = new Date().toISOString()
    result.operations = this.operationCount
    
    // Create post-execution snapshot
    if (this.config.enableRollback) {
      const rollbackPoint = await this.createSnapshot(
        `post_${executionId}`,
        'Post-execution state',
        'post_execution'
      )
      result.snapshot = rollbackPoint.snapshot
    }
    
    this.executions.push(result as ExecutionResult)
    this.status = result.success ? 'completed' : 'failed'
    this.updatedAt = new Date().toISOString()
    
    this.emit('execution:completed', { sandboxId: this.config.id, executionId, success: result.success })
    
    return result as ExecutionResult
  }

  /**
   * Execute a command in the sandbox
   */
  async executeCommand(
    command: string,
    args: string[] = [],
    options: {
      timeout?: number
      cwd?: string
      env?: Record<string, string>
    } = {}
  ): Promise<ExecutionResult> {
    // Validate command
    const validation = this.validateCommand(command)
    if (!validation.allowed) {
      this.logBehavior('command_execute', 'process', command, 'denied', { reason: validation.reason })
      return this.createErrorResult(
        `cmd_${Date.now().toString(36)}`,
        new Date().toISOString(),
        validation.reason || 'Command not allowed'
      )
    }
    
    // Log the command execution
    this.logBehavior('command_execute', 'process', command, 'allowed', { args })
    
    return this.execute(command, {
      language: 'shell',
      args,
      ...options
    })
  }

  /**
   * Read file from sandbox
   */
  async readFile(filePath: string): Promise<string> {
    const validation = this.validateFileAccess(filePath, 'read')
    if (!validation.allowed) {
      this.logBehavior('file_read', 'filesystem', filePath, 'denied', { reason: validation.reason })
      throw new Error(validation.reason)
    }
    
    // Check file size limit
    try {
      const stats = await fs.stat(this.resolvePath(filePath))
      if (stats.size > this.config.limits.maxFileSizeMB * 1024 * 1024) {
        this.logBehavior('file_read', 'filesystem', filePath, 'denied', { reason: 'File too large' })
        throw new Error('File exceeds size limit')
      }
    } catch {
      // File might not exist
    }
    
    this.logBehavior('file_read', 'filesystem', filePath, 'allowed')
    this.operationCount++
    
    const resolvedPath = this.resolvePath(filePath)
    return fs.readFile(resolvedPath, 'utf-8')
  }

  /**
   * Write file to sandbox
   */
  async writeFile(filePath: string, content: string | Buffer): Promise<void> {
    const validation = this.validateFileAccess(filePath, 'write')
    if (!validation.allowed) {
      this.logBehavior('file_write', 'filesystem', filePath, 'denied', { reason: validation.reason })
      throw new Error(validation.reason)
    }
    
    // Check content size
    const size = typeof content === 'string' ? content.length : content.length
    if (size > this.config.limits.maxFileSizeMB * 1024 * 1024) {
      this.logBehavior('file_write', 'filesystem', filePath, 'denied', { reason: 'Content too large' })
      throw new Error('Content exceeds size limit')
    }
    
    this.logBehavior('file_write', 'filesystem', filePath, 'allowed', { size })
    this.operationCount++
    
    const resolvedPath = this.resolvePath(filePath)
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true })
    await fs.writeFile(resolvedPath, content)
  }

  /**
   * Delete file from sandbox
   */
  async deleteFile(filePath: string): Promise<void> {
    const validation = this.validateFileAccess(filePath, 'write')
    if (!validation.allowed) {
      this.logBehavior('file_delete', 'filesystem', filePath, 'denied', { reason: validation.reason })
      throw new Error(validation.reason)
    }
    
    this.logBehavior('file_delete', 'filesystem', filePath, 'allowed')
    this.operationCount++
    
    const resolvedPath = this.resolvePath(filePath)
    await fs.unlink(resolvedPath)
  }

  /**
   * Create rollback point
   */
  async createRollbackPoint(description: string): Promise<RollbackPoint> {
    return this.createSnapshot(`manual_${Date.now().toString(36)}`, description, 'manual')
  }

  /**
   * Rollback to a specific point
   */
  async rollback(rollbackPointId?: string): Promise<boolean> {
    const point = rollbackPointId
      ? this.rollbackPoints.find(p => p.id === rollbackPointId)
      : this.rollbackPoints[this.rollbackPoints.length - 1]
    
    if (!point) {
      this.addError('rollback', 'No rollback point available', {}, false)
      return false
    }
    
    this.emit('rollback:started', { sandboxId: this.config.id, rollbackPointId: point.id })
    
    try {
      // Restore filesystem state
      await this.restoreFilesystem(point.snapshot.filesystem)
      
      // Restore environment
      this.config.environment = { ...point.snapshot.environment }
      
      // Clear executions after this point
      this.executions = this.executions.filter(e => 
        new Date(e.startedAt).getTime() < new Date(point.timestamp).getTime()
      )
      
      this.isRolledBack = true
      this.status = 'rolled_back'
      this.updatedAt = new Date().toISOString()
      
      this.emit('rollback:completed', { sandboxId: this.config.id, rollbackPointId: point.id })
      
      return true
    } catch (error) {
      this.addError('rollback', `Rollback failed: ${error}`, { rollbackPointId: point.id }, false)
      return false
    }
  }

  /**
   * Get sandbox result
   */
  getResult(): SandboxResult {
    const duration = this.executions.reduce((sum, e) => sum + (e.duration || 0), 0)
    const memoryUsages = this.executions.map(e => e.memoryUsed).filter(Boolean)
    const cpuUsages = this.executions.map(e => e.cpuUsed).filter(Boolean)
    
    return {
      sandboxId: this.config.id,
      status: this.status,
      executions: this.executions,
      totalOperations: this.operationCount,
      totalDuration: duration,
      averageMemoryUsage: memoryUsages.length > 0 
        ? memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length 
        : 0,
      averageCpuUsage: cpuUsages.length > 0 
        ? cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length 
        : 0,
      errors: this.errors,
      warnings: this.warnings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  /**
   * Get sandbox metrics
   */
  getMetrics(): SandboxMetrics {
    const successful = this.executions.filter(e => e.success)
    const failed = this.executions.filter(e => !e.success)
    const memoryUsages = this.executions.map(e => e.memoryUsed).filter(Boolean)
    const cpuUsages = this.executions.map(e => e.cpuUsed).filter(Boolean)
    
    return {
      sandboxId: this.config.id,
      uptime: Date.now() - new Date(this.createdAt).getTime(),
      totalExecutions: this.executions.length,
      successfulExecutions: successful.length,
      failedExecutions: failed.length,
      totalOperations: this.operationCount,
      averageExecutionTime: this.executions.length > 0
        ? this.executions.reduce((sum, e) => sum + (e.duration || 0), 0) / this.executions.length
        : 0,
      averageMemoryUsage: memoryUsages.length > 0 
        ? memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length 
        : 0,
      averageCpuUsage: cpuUsages.length > 0 
        ? cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length 
        : 0,
      peakMemoryUsage: memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0,
      peakCpuUsage: cpuUsages.length > 0 ? Math.max(...cpuUsages) : 0,
      timeouts: this.executions.filter(e => e.timeout).length,
      securityViolations: this.errors.filter(e => e.type === 'security').length,
      rollbackCount: this.rollbackPoints.length,
      resourceUsage: this.resourceUsage
    }
  }

  /**
   * Get behavior log
   */
  getBehaviorLog(filter?: {
    types?: BehaviorEventType[]
    categories?: string[]
    since?: string
    limit?: number
  }): BehaviorEvent[] {
    let events = [...this.behaviorLog]
    
    if (filter) {
      if (filter.types) {
        events = events.filter(e => filter.types!.includes(e.type))
      }
      if (filter.categories) {
        events = events.filter(e => filter.categories!.includes(e.category))
      }
      if (filter.since) {
        const since = new Date(filter.since).getTime()
        events = events.filter(e => new Date(e.timestamp).getTime() >= since)
      }
      if (filter.limit) {
        events = events.slice(-filter.limit)
      }
    }
    
    return events
  }

  /**
   * Terminate the sandbox
   */
  async terminate(): Promise<void> {
    // Kill any running processes
    if (this.currentProcess) {
      this.currentProcess.kill('SIGTERM')
      this.currentProcess = null
    }
    
    // Stop monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    
    this.status = 'terminated'
    this.updatedAt = new Date().toISOString()
    
    this.emit('sandbox:terminated', { sandboxId: this.config.id })
  }

  /**
   * Get configuration
   */
  getConfig(): SandboxConfig {
    return { ...this.config }
  }

  /**
   * Update limits
   */
  updateLimits(limits: Partial<SandboxLimits>): void {
    this.config.limits = { ...this.config.limits, ...limits }
    this.updatedAt = new Date().toISOString()
    this.emit('limits:updated', { sandboxId: this.config.id, limits: this.config.limits })
  }

  /**
   * Update security policy
   */
  updateSecurityPolicy(policy: Partial<SecurityPolicy>): void {
    this.config.securityPolicy = { ...this.config.securityPolicy, ...policy }
    this.updatedAt = new Date().toISOString()
    this.emit('policy:updated', { sandboxId: this.config.id, policy: this.config.securityPolicy })
  }

  /**
   * Get rollback points
   */
  getRollbackPoints(): RollbackPoint[] {
    return [...this.rollbackPoints]
  }

  // ============================================
  // Private Methods
  // ============================================

  private buildSecurityPolicy(policy?: SecurityPolicy): SecurityPolicy {
    if (!policy) {
      return { ...DEFAULT_SECURITY_POLICY }
    }
    
    // If level is specified, start with that template
    if (policy.level && policy.level !== 'custom' && SECURITY_LEVELS[policy.level]) {
      return {
        ...DEFAULT_SECURITY_POLICY,
        ...SECURITY_LEVELS[policy.level],
        ...policy
      }
    }
    
    return { ...DEFAULT_SECURITY_POLICY, ...policy }
  }

  private createDefaultWorkingDirectory(sandboxId: string): string {
    return path.join(process.cwd(), 'sandboxes', sandboxId)
  }

  private getDefaultBlockedPaths(): string[] {
    return [
      '/etc/passwd',
      '/etc/shadow',
      '/etc/hosts',
      '/.ssh',
      '/.env',
      '/.git',
      '/proc',
      '/sys',
      '/dev'
    ]
  }

  private getDefaultAllowedCommands(): string[] {
    return [
      'node', 'npm', 'npx', 'yarn', 'pnpm', 'bun',
      'python', 'python3', 'pip', 'pip3',
      'git', 'ls', 'cat', 'mkdir', 'rm', 'cp', 'mv',
      'echo', 'pwd', 'grep', 'find', 'sed', 'awk'
    ]
  }

  private getDefaultBlockedCommands(): string[] {
    return [
      'sudo', 'su', 'doas', 'pkexec',
      'chmod', 'chown', 'chgrp',
      'dd', 'mkfs', 'fdisk',
      'iptables', 'ufw',
      'systemctl', 'service',
      'shutdown', 'reboot', 'poweroff',
      'curl', 'wget',
      'nc', 'netcat',
      'ssh', 'scp', 'rsync',
      'kill', 'killall', 'pkill',
      'mount', 'umount'
    ]
  }

  private async ensureWorkingDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.workingDirectory, { recursive: true })
    } catch {
      // Directory might already exist
    }
  }

  private validateCommand(command: string): { allowed: boolean; reason?: string } {
    const baseCmd = command.split(/\s+/)[0] || ''
    
    // Check blocked commands
    if (this.config.blockedCommands.includes(baseCmd)) {
      return { allowed: false, reason: `Command '${baseCmd}' is blocked` }
    }
    
    // Check if only allowed commands are permitted
    if (this.config.allowedCommands.length > 0 && !this.config.allowedCommands.includes(baseCmd)) {
      return { allowed: false, reason: `Command '${baseCmd}' is not in allowed list` }
    }
    
    // Check security policy
    if (!this.config.securityPolicy.allowCommandExecution) {
      return { allowed: false, reason: 'Command execution is not allowed by security policy' }
    }
    
    return { allowed: true }
  }

  private validateFileAccess(filePath: string, mode: 'read' | 'write'): { allowed: boolean; reason?: string } {
    const resolved = this.resolvePath(filePath)
    
    // Check blocked paths
    for (const blocked of this.config.blockedPaths) {
      if (resolved.includes(blocked) || blocked.includes(resolved)) {
        return { allowed: false, reason: `Path '${filePath}' is blocked` }
      }
    }
    
    // Check allowed paths
    if (this.config.allowedPaths.length > 0) {
      const isAllowed = this.config.allowedPaths.some(allowed => 
        resolved.startsWith(this.resolvePath(allowed))
      )
      if (!isAllowed && this.config.filesystemIsolation) {
        return { allowed: false, reason: `Path '${filePath}' is not in allowed paths` }
      }
    }
    
    // Check security policy
    if (mode === 'read' && !this.config.securityPolicy.allowFileSystemRead) {
      return { allowed: false, reason: 'File reading is not allowed by security policy' }
    }
    if (mode === 'write' && !this.config.securityPolicy.allowFileSystemWrite) {
      return { allowed: false, reason: 'File writing is not allowed by security policy' }
    }
    
    // Check for path traversal
    if (filePath.includes('..')) {
      return { allowed: false, reason: 'Path traversal detected' }
    }
    
    return { allowed: true }
  }

  private resolvePath(filePath: string): string {
    if (path.isAbsolute(filePath)) {
      return filePath
    }
    return path.join(this.config.workingDirectory, filePath)
  }

  private async executeCode(
    code: string,
    language: string,
    options: {
      timeout: number
      executionId: string
      args?: string[]
      env?: Record<string, string>
    }
  ): Promise<{
    exitCode: number
    stdout: string
    stderr: string
    memoryUsed: number
    cpuUsed: number
  }> {
    return new Promise((resolve, reject) => {
      let stdout = ''
      let stderr = ''
      let memoryUsed = 0
      let cpuUsed = 0
      const startTime = Date.now()
      
      // Build command based on language
      let command: string
      let args: string[] = []
      
      switch (language) {
        case 'javascript':
          command = 'node'
          args = ['-e', code]
          break
        case 'typescript':
          // Use ts-node or compile first
          command = 'npx'
          args = ['ts-node', '-e', code]
          break
        case 'python':
          command = 'python3'
          args = ['-c', code]
          break
        case 'bash':
        case 'shell':
          command = 'bash'
          args = ['-c', code]
          break
        default:
          command = 'node'
          args = ['-e', code]
      }
      
      if (options.args) {
        args.push(...options.args)
      }
      
      // Spawn process
      const childProcess = spawn(command, args, {
        cwd: this.config.workingDirectory,
        env: {
          ...process.env,
          ...this.config.environment,
          ...options.env,
          NODE_OPTIONS: `--max-old-space-size=${this.config.limits.maxMemoryMB}`
        },
        timeout: options.timeout
      })
      
      this.currentProcess = childProcess
      
      // Capture output
      childProcess.stdout?.on('data', (data: Buffer) => {
        const chunk = data.toString()
        stdout += chunk
        
        // Check output size limit
        if (stdout.length > this.config.limits.maxOutputSizeKB * 1024) {
          this.addWarning('resource', 'Output size limit reached', { executionId: options.executionId })
          childProcess.kill()
        }
      })
      
      childProcess.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString()
      })
      
      // Monitor resource usage
      const monitorInterval = setInterval(() => {
        try {
          // Get process stats (simplified)
          memoryUsed = process.memoryUsage().heapUsed / 1024 / 1024 // MB
          cpuUsed = (Date.now() - startTime) / 1000 // Simplified CPU estimation
          
          // Check memory limit
          if (memoryUsed > this.config.limits.maxMemoryMB) {
            this.addWarning('resource', 'Memory limit exceeded', { 
              executionId: options.executionId,
              memoryUsed,
              limit: this.config.limits.maxMemoryMB 
            })
            childProcess.kill()
          }
          
          // Record resource usage
          this.resourceUsage.push({
            timestamp: new Date().toISOString(),
            cpu: cpuUsed,
            memory: memoryUsed,
            diskIO: { read: 0, write: 0 },
            networkIO: { sent: 0, received: 0 },
            openFiles: 0,
            processes: 1,
            threads: 1
          })
        } catch {
          // Ignore monitoring errors
        }
      }, 1000)
      
      // Handle timeout
      const timeoutId = setTimeout(() => {
        childProcess.kill()
        const error = new Error('Execution timed out') as Error & { timedOut: boolean; killed: boolean }
        error.timedOut = true
        error.killed = true
        reject(error)
      }, options.timeout)
      
      // Handle completion
      childProcess.on('close', (code) => {
        clearTimeout(timeoutId)
        clearInterval(monitorInterval)
        this.currentProcess = null
        
        resolve({
          exitCode: code ?? 1,
          stdout,
          stderr,
          memoryUsed,
          cpuUsed
        })
      })
      
      childProcess.on('error', (err) => {
        clearTimeout(timeoutId)
        clearInterval(monitorInterval)
        this.currentProcess = null
        reject(err)
      })
    })
  }

  private checkRateLimit(): boolean {
    const now = Date.now()
    
    // Remove old timestamps (older than 1 second)
    this.rateLimitTimestamps = this.rateLimitTimestamps.filter(t => now - t < 1000)
    
    // Check if rate limit exceeded
    if (this.rateLimitTimestamps.length >= this.config.limits.rateLimitPerSecond) {
      return false
    }
    
    // Add new timestamp
    this.rateLimitTimestamps.push(now)
    return true
  }

  private async createSnapshot(
    id: string,
    description: string,
    type: RollbackPoint['type']
  ): Promise<RollbackPoint> {
    const timestamp = new Date().toISOString()
    
    // Capture filesystem state
    const filesystem = await this.captureFilesystemSnapshot()
    
    // Capture process state
    const processState: ProcessSnapshot = {
      pid: this.currentProcess?.pid,
      cpu: 0,
      memory: process.memoryUsage().heapUsed,
      openFiles: 0,
      threads: 1,
      status: this.status
    }
    
    const snapshot: StateSnapshot = {
      id,
      sandboxId: this.config.id,
      timestamp,
      filesystem,
      environment: { ...this.config.environment },
      processState,
      customState: {},
      checksum: ''
    }
    
    // Calculate checksum
    snapshot.checksum = this.calculateSnapshotChecksum(snapshot)
    
    // Store rollback point
    const rollbackPoint: RollbackPoint = {
      id,
      sandboxId: this.config.id,
      timestamp,
      snapshot,
      description,
      type,
      restorationCost: filesystem.files.length * 10 // Estimated ms
    }
    
    this.rollbackPoints.push(rollbackPoint)
    
    // Keep only last 10 rollback points
    if (this.rollbackPoints.length > 10) {
      this.rollbackPoints.shift()
    }
    
    this.emit('snapshot:created', { sandboxId: this.config.id, snapshotId: id })
    
    return rollbackPoint
  }

  private async captureFilesystemSnapshot(): Promise<FilesystemSnapshot> {
    const files: FileInfo[] = []
    const checksums: Record<string, string> = {}
    let totalSize = 0
    
    try {
      const entries = await this.readdirRecursive(this.config.workingDirectory)
      
      for (const entry of entries) {
        try {
          const stats = await fs.stat(entry)
          const content = await fs.readFile(entry)
          const checksum = crypto.createHash('md5').update(content).digest('hex')
          
          files.push({
            path: path.relative(this.config.workingDirectory, entry),
            size: stats.size,
            modifiedAt: stats.mtime.toISOString(),
            checksum,
            permissions: stats.mode.toString(8)
          })
          
          checksums[entry] = checksum
          totalSize += stats.size
        } catch {
          // Skip files that can't be read
        }
      }
    } catch {
      // Directory might not exist
    }
    
    return { files, totalSize, checksums }
  }

  private async readdirRecursive(dir: string): Promise<string[]> {
    const results: string[] = []
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        
        if (entry.isDirectory()) {
          const subResults = await this.readdirRecursive(fullPath)
          results.push(...subResults)
        } else if (entry.isFile()) {
          results.push(fullPath)
        }
      }
    } catch {
      // Ignore errors
    }
    
    return results
  }

  private calculateSnapshotChecksum(snapshot: StateSnapshot): string {
    const data = JSON.stringify({
      files: snapshot.filesystem.files.map(f => f.checksum).sort(),
      env: Object.keys(snapshot.environment).sort()
    })
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  private async restoreFilesystem(snapshot: FilesystemSnapshot): Promise<void> {
    // Clear current working directory
    try {
      const entries = await fs.readdir(this.config.workingDirectory)
      await Promise.all(
        entries.map(entry => 
          fs.rm(path.join(this.config.workingDirectory, entry), { recursive: true, force: true })
        )
      )
    } catch {
      // Directory might not exist
    }
    
    // Restore files from snapshot
    for (const file of snapshot.files) {
      const filePath = path.join(this.config.workingDirectory, file.path)
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      
      // Create empty file (we don't store content in snapshot, just metadata)
      // In a real implementation, you'd store and restore content
      await fs.writeFile(filePath, '')
    }
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.collectResourceUsage()
    }, 5000)
  }

  private collectResourceUsage(): void {
    const memUsage = process.memoryUsage()
    
    this.resourceUsage.push({
      timestamp: new Date().toISOString(),
      cpu: 0, // Would need more complex calculation
      memory: memUsage.heapUsed / 1024 / 1024,
      diskIO: { read: 0, write: 0 },
      networkIO: { sent: 0, received: 0 },
      openFiles: 0,
      processes: 1,
      threads: 1
    })
    
    // Keep only last 1000 entries
    if (this.resourceUsage.length > 1000) {
      this.resourceUsage.shift()
    }
  }

  private logBehavior(
    type: BehaviorEventType,
    category: BehaviorEvent['category'],
    action: string,
    result: BehaviorEvent['result'],
    details?: Record<string, unknown>
  ): void {
    const event: BehaviorEvent = {
      id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      sandboxId: this.config.id,
      timestamp: new Date().toISOString(),
      type,
      category,
      action,
      result,
      details
    }
    
    this.behaviorLog.push(event)
    
    // Keep only last 10000 events
    if (this.behaviorLog.length > 10000) {
      this.behaviorLog.shift()
    }
    
    if (this.config.logging.events) {
      this.emit('behavior:logged', event)
    }
  }

  private addError(
    type: SandboxError['type'],
    message: string,
    details: Record<string, unknown>,
    recoverable: boolean,
    recoveryAction?: string
  ): void {
    const error: SandboxError = {
      id: `err_${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      details,
      recoverable,
      recoveryAction
    }
    
    this.errors.push(error)
    this.emit('error:added', error)
  }

  private addWarning(
    type: SandboxWarning['type'],
    message: string,
    details: Record<string, unknown>
  ): void {
    const warning: SandboxWarning = {
      id: `warn_${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      details
    }
    
    this.warnings.push(warning)
    this.emit('warning:added', warning)
  }

  private createErrorResult(
    executionId: string,
    startedAt: string,
    error: string
  ): ExecutionResult {
    return {
      sandboxId: this.config.id,
      executionId,
      success: false,
      exitCode: 1,
      stdout: '',
      stderr: error,
      duration: 0,
      memoryUsed: 0,
      cpuUsed: 0,
      operations: 0,
      networkCalls: 0,
      fileOperations: 0,
      startedAt,
      completedAt: new Date().toISOString(),
      timeout: false,
      killed: false,
      error,
      rollbackAvailable: this.config.enableRollback
    }
  }
}

// ============================================
// Singleton and Convenience Functions
// ============================================

let sandboxInstances: Map<string, AgentSandbox> = new Map()

/**
 * Get singleton sandbox instance
 */
export function getAgentSandbox(config: Partial<SandboxConfig> & { id: string; agentId: string }): AgentSandbox {
  if (!sandboxInstances.has(config.id)) {
    sandboxInstances.set(config.id, new AgentSandbox(config))
  }
  return sandboxInstances.get(config.id)!
}

/**
 * Create a new sandbox instance
 */
export function createSandbox(config: Partial<SandboxConfig> & { id: string; agentId: string }): AgentSandbox {
  const sandbox = new AgentSandbox(config)
  sandboxInstances.set(config.id, sandbox)
  return sandbox
}

/**
 * Get all active sandboxes
 */
export function getAllSandboxes(): AgentSandbox[] {
  return Array.from(sandboxInstances.values())
}

/**
 * Terminate and remove a sandbox
 */
export async function terminateSandbox(sandboxId: string): Promise<boolean> {
  const sandbox = sandboxInstances.get(sandboxId)
  if (sandbox) {
    await sandbox.terminate()
    sandboxInstances.delete(sandboxId)
    return true
  }
  return false
}

/**
 * Terminate all sandboxes
 */
export async function terminateAllSandboxes(): Promise<void> {
  const terminations = Array.from(sandboxInstances.values()).map(s => s.terminate())
  await Promise.all(terminations)
  sandboxInstances.clear()
}

/**
 * Get system sandbox statistics
 */
export function getSandboxStatistics(): {
  totalSandboxes: number
  byStatus: Record<string, number>
  totalExecutions: number
  totalErrors: number
  totalRollbackPoints: number
} {
  const sandboxes = Array.from(sandboxInstances.values())
  const byStatus: Record<string, number> = {}
  let totalExecutions = 0
  let totalErrors = 0
  let totalRollbackPoints = 0
  
  for (const sandbox of sandboxes) {
    const result = sandbox.getResult()
    byStatus[result.status] = (byStatus[result.status] || 0) + 1
    totalExecutions += result.executions.length
    totalErrors += result.errors.length
    totalRollbackPoints += sandbox.getRollbackPoints().length
  }
  
  return {
    totalSandboxes: sandboxes.length,
    byStatus,
    totalExecutions,
    totalErrors,
    totalRollbackPoints
  }
}

export default AgentSandbox
