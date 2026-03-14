/**
 * Agent Governance System
 * 
 * Provides governance for multi-agent systems:
 * - Permission management
 * - Safety constraints
 * - Action policies
 * - Escalation workflows
 * - Behavior monitoring
 * - Audit trails
 */

import { EventEmitter } from 'events'
import type { AgentId } from './agent-message-bus'

// Types
export type PermissionLevel = 'none' | 'read' | 'write' | 'execute' | 'admin' | 'super'
export type ConstraintType = 'file' | 'command' | 'network' | 'resource' | 'time' | 'custom'
export type PolicyDecision = 'allow' | 'deny' | 'ask' | 'rate_limit' | 'log_only'
export type EscalationLevel = 'agent' | 'supervisor' | 'admin' | 'human'

export interface Permission {
  id: string
  agentId: AgentId
  resource: string           // Resource pattern (e.g., "files:/src/**", "commands:npm:*")
  level: PermissionLevel
  conditions?: PermissionCondition[]
  grantedAt: string
  grantedBy: string
  expiresAt?: string
}

export interface PermissionCondition {
  type: 'time' | 'context' | 'rate' | 'approval'
  constraint: string
  value: any
}

export interface SafetyConstraint {
  id: string
  type: ConstraintType
  name: string
  description: string
  pattern: string | RegExp
  action: PolicyDecision
  severity: 'info' | 'warning' | 'error' | 'critical'
  exceptions?: string[]       // Agent IDs exempt from this constraint
  message?: string
  remediation?: string
}

export interface ActionPolicy {
  id: string
  name: string
  description: string
  rules: PolicyRule[]
  defaultDecision: PolicyDecision
  priority: number
}

export interface PolicyRule {
  condition: string           // Expression to evaluate
  decision: PolicyDecision
  reason?: string
}

export interface GovernanceContext {
  agentId: AgentId
  action: string
  resource?: string
  parameters?: Record<string, any>
  timestamp: string
  sessionId?: string
}

export interface GovernanceDecision {
  allowed: boolean
  decision: PolicyDecision
  reason: string
  conditions?: string[]
  escalation?: EscalationLevel
  auditId: string
  appliedPolicies: string[]
  appliedConstraints: string[]
}

export interface EscalationRequest {
  id: string
  agentId: AgentId
  action: string
  resource?: string
  reason: string
  level: EscalationLevel
  status: 'pending' | 'approved' | 'denied' | 'expired'
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
  notes?: string
}

export interface BehaviorAlert {
  id: string
  agentId: AgentId
  type: 'suspicious' | 'excessive' | 'unusual' | 'violation' | 'error'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details: Record<string, any>
  timestamp: string
  acknowledged: boolean
}

export interface GovernanceStats {
  totalActions: number
  allowedActions: number
  deniedActions: number
  escalations: number
  violations: number
  topDeniedAgents: Array<{ agentId: string; count: number }>
  topDeniedActions: Array<{ action: string; count: number }>
}

// Default safety constraints
const DEFAULT_SAFETY_CONSTRAINTS: SafetyConstraint[] = [
  {
    id: 'no_system_files',
    type: 'file',
    name: 'No System Files',
    description: 'Prevent access to system files',
    pattern: /^\/(etc|usr|bin|sbin|var|sys|proc)\//,
    action: 'deny',
    severity: 'critical',
    message: 'System file access is not allowed',
    remediation: 'Use project-relative paths'
  },
  {
    id: 'no_env_files',
    type: 'file',
    name: 'No Environment Files',
    description: 'Prevent access to environment files',
    pattern: /\.env(\.|$)/i,
    action: 'ask',
    severity: 'warning',
    message: 'Environment file access requires approval'
  },
  {
    id: 'no_secrets',
    type: 'file',
    name: 'No Secret Files',
    description: 'Prevent access to secret files',
    pattern: /(secret|key|password|token|credential|private).*\.(pem|key|p12)$/i,
    action: 'deny',
    severity: 'critical',
    message: 'Secret file access is not allowed'
  },
  {
    id: 'no_dangerous_commands',
    type: 'command',
    name: 'No Dangerous Commands',
    description: 'Block dangerous shell commands',
    pattern: /^(rm\s+-rf|mkfs|dd\s+if=|chmod\s+777|chown\s+root)/,
    action: 'deny',
    severity: 'critical',
    message: 'Dangerous command blocked',
    remediation: 'Use safer alternatives'
  },
  {
    id: 'no_network_access',
    type: 'network',
    name: 'Restricted Network Access',
    description: 'Restrict network access to allowed hosts',
    pattern: /^(?!localhost|127\.0\.0\.1|\.internal\.|\.local$)/,
    action: 'ask',
    severity: 'warning',
    message: 'External network access requires approval'
  },
  {
    id: 'no_executable_uploads',
    type: 'file',
    name: 'No Executable Uploads',
    description: 'Prevent uploading executable files',
    pattern: /\.(exe|bat|sh|ps1|app|dmg)$/i,
    action: 'deny',
    severity: 'high',
    message: 'Executable files are not allowed'
  },
  {
    id: 'rate_limit_commands',
    type: 'command',
    name: 'Command Rate Limit',
    description: 'Limit command execution rate',
    pattern: /.*/,  // All commands
    action: 'rate_limit',
    severity: 'info',
    message: 'Rate limiting applied'
  }
]

// Default action policies
const DEFAULT_POLICIES: ActionPolicy[] = [
  {
    id: 'file_operations',
    name: 'File Operations Policy',
    description: 'Rules for file read/write operations',
    defaultDecision: 'allow',
    priority: 10,
    rules: [
      { condition: 'action === "delete" && resource.match(/^\/src/)', decision: 'ask', reason: 'Deleting source files requires approval' },
      { condition: 'action === "write" && resource.match(/package\.json$/)', decision: 'log_only' }
    ]
  },
  {
    id: 'command_execution',
    name: 'Command Execution Policy',
    description: 'Rules for command execution',
    defaultDecision: 'allow',
    priority: 20,
    rules: [
      { condition: 'action === "execute" && parameters.command.match(/npm publish/)', decision: 'ask', reason: 'Publishing requires approval' },
      { condition: 'action === "execute" && parameters.command.match(/git push/)', decision: 'log_only' }
    ]
  },
  {
    id: 'agent_coordination',
    name: 'Agent Coordination Policy',
    description: 'Rules for inter-agent communication',
    defaultDecision: 'allow',
    priority: 5,
    rules: [
      { condition: 'agentId === "orchestrator"', decision: 'allow', reason: 'Orchestrator has elevated permissions' }
    ]
  }
]

// Agent capability levels
const AGENT_LEVELS: Record<AgentId, PermissionLevel> = {
  orchestrator: 'admin',
  planner: 'write',
  coder: 'write',
  debugger: 'execute',
  reviewer: 'read',
  tester: 'execute',
  architect: 'write',
  deployer: 'admin'
}

/**
 * Agent Governance System
 */
export class AgentGovernanceSystem extends EventEmitter {
  private permissions: Map<string, Permission[]> = new Map()
  private constraints: Map<string, SafetyConstraint> = new Map()
  private policies: Map<string, ActionPolicy> = new Map()
  private escalations: Map<string, EscalationRequest> = new Map()
  private alerts: BehaviorAlert[] = []
  private actionHistory: Array<{ context: GovernanceContext; decision: GovernanceDecision }> = []
  private rateLimits: Map<string, number[]> = new Map() // agentId -> timestamps
  
  private auditCounter = 0

  constructor() {
    super()
    this.initializeDefaults()
  }

  /**
   * Initialize default constraints and policies
   */
  private initializeDefaults(): void {
    // Add default constraints
    for (const constraint of DEFAULT_SAFETY_CONSTRAINTS) {
      this.constraints.set(constraint.id, constraint)
    }
    
    // Add default policies
    for (const policy of DEFAULT_POLICIES) {
      this.policies.set(policy.id, policy)
    }
    
    // Set default permissions for agents
    for (const [agentId, level] of Object.entries(AGENT_LEVELS)) {
      this.grantPermission({
        agentId: agentId as AgentId,
        resource: '*',
        level,
        grantedBy: 'system'
      })
    }
  }

  /**
   * Evaluate an action request
   */
  evaluate(context: GovernanceContext): GovernanceDecision {
    const auditId = `audit_${++this.auditCounter}_${Date.now().toString(36)}`
    const appliedPolicies: string[] = []
    const appliedConstraints: string[] = []
    const conditions: string[] = []
    
    // Check permissions first
    const hasPermission = this.checkPermission(context)
    if (!hasPermission.allowed) {
      return {
        allowed: false,
        decision: 'deny',
        reason: hasPermission.reason,
        auditId,
        appliedPolicies: [],
        appliedConstraints: []
      }
    }
    
    // Check safety constraints
    for (const [id, constraint] of this.constraints) {
      if (this.matchesConstraint(context, constraint)) {
        appliedConstraints.push(id)
        
        if (constraint.action === 'deny') {
          this.emit('constraint:violated', { constraint, context })
          return {
            allowed: false,
            decision: 'deny',
            reason: constraint.message || `Constraint violated: ${constraint.name}`,
            conditions: constraint.exceptions?.includes(context.agentId) ? ['Exception applied'] : undefined,
            auditId,
            appliedPolicies,
            appliedConstraints
          }
        }
        
        if (constraint.action === 'ask') {
          conditions.push(constraint.message || constraint.name)
        }
        
        if (constraint.action === 'rate_limit') {
          if (this.isRateLimited(context)) {
            return {
              allowed: false,
              decision: 'rate_limit',
              reason: 'Rate limit exceeded',
              auditId,
              appliedPolicies,
              appliedConstraints
            }
          }
        }
      }
    }
    
    // Apply policies
    const sortedPolicies = Array.from(this.policies.values())
      .sort((a, b) => b.priority - a.priority)
    
    for (const policy of sortedPolicies) {
      for (const rule of policy.rules) {
        if (this.evaluateCondition(rule.condition, context)) {
          appliedPolicies.push(policy.id)
          
          if (rule.decision === 'deny') {
            return {
              allowed: false,
              decision: 'deny',
              reason: rule.reason || `Policy rule: ${policy.name}`,
              auditId,
              appliedPolicies,
              appliedConstraints
            }
          }
          
          if (rule.decision === 'ask') {
            conditions.push(rule.reason || 'Approval required')
          }
          
          break
        }
      }
    }
    
    // Record action for rate limiting
    this.recordAction(context)
    
    // Determine final decision
    const decision: PolicyDecision = conditions.length > 0 ? 'ask' : 'allow'
    
    // Create governance decision
    const result: GovernanceDecision = {
      allowed: decision === 'allow' || decision === 'log_only',
      decision,
      reason: conditions.length > 0 ? conditions.join('; ') : 'Action allowed',
      conditions: conditions.length > 0 ? conditions : undefined,
      escalation: decision === 'ask' ? 'supervisor' : undefined,
      auditId,
      appliedPolicies,
      appliedConstraints
    }
    
    // Store in history
    this.actionHistory.push({ context, decision: result })
    
    // Emit event
    this.emit('action:evaluated', { context, decision: result })
    
    return result
  }

  /**
   * Check if agent has permission
   */
  private checkPermission(context: GovernanceContext): { allowed: boolean; reason: string } {
    const agentPermissions = this.permissions.get(context.agentId) || []
    
    // Check for wildcard permission
    const wildcard = agentPermissions.find(p => p.resource === '*')
    if (wildcard) {
      // Check level hierarchy
      const requiredLevel = this.getRequiredLevel(context.action)
      if (this.hasSufficientLevel(wildcard.level, requiredLevel)) {
        return { allowed: true, reason: 'Has wildcard permission' }
      }
    }
    
    // Check specific resource permissions
    for (const permission of agentPermissions) {
      if (this.matchesResource(permission.resource, context.resource)) {
        const requiredLevel = this.getRequiredLevel(context.action)
        if (this.hasSufficientLevel(permission.level, requiredLevel)) {
          return { allowed: true, reason: 'Has specific permission' }
        }
      }
    }
    
    return { allowed: false, reason: `No permission for ${context.action}` }
  }

  /**
   * Check if constraint matches context
   */
  private matchesConstraint(context: GovernanceContext, constraint: SafetyConstraint): boolean {
    // Check exception list
    if (constraint.exceptions?.includes(context.agentId)) {
      return false
    }
    
    const pattern = typeof constraint.pattern === 'string' 
      ? new RegExp(constraint.pattern) 
      : constraint.pattern
    
    switch (constraint.type) {
      case 'file':
        return context.resource ? pattern.test(context.resource) : false
      case 'command':
        return context.parameters?.command ? pattern.test(context.parameters.command) : false
      case 'network':
        return context.parameters?.url ? pattern.test(context.parameters.url) : false
      case 'resource':
        return pattern.test(context.resource || '')
      default:
        return false
    }
  }

  /**
   * Evaluate a condition expression
   */
  private evaluateCondition(condition: string, context: GovernanceContext): boolean {
    try {
      // Simple condition evaluation
      const fn = new Function(
        'agentId', 'action', 'resource', 'parameters',
        `return ${condition}`
      )
      return fn(context.agentId, context.action, context.resource, context.parameters)
    } catch {
      return false
    }
  }

  /**
   * Check rate limiting
   */
  private isRateLimited(context: GovernanceContext): boolean {
    const key = `${context.agentId}:${context.action}`
    const timestamps = this.rateLimits.get(key) || []
    const now = Date.now()
    
    // Remove old timestamps (older than 1 minute)
    const recent = timestamps.filter(t => now - t < 60000)
    
    // Check if exceeded limit (10 actions per minute)
    return recent.length >= 10
  }

  /**
   * Record action for rate limiting
   */
  private recordAction(context: GovernanceContext): void {
    const key = `${context.agentId}:${context.action}`
    const timestamps = this.rateLimits.get(key) || []
    timestamps.push(Date.now())
    
    // Keep only recent timestamps
    const now = Date.now()
    const recent = timestamps.filter(t => now - t < 60000)
    this.rateLimits.set(key, recent)
  }

  /**
   * Check if resource matches pattern
   */
  private matchesResource(pattern: string, resource?: string): boolean {
    if (!resource) return pattern === '*'
    
    // Simple glob matching
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$')
    return regex.test(resource)
  }

  /**
   * Get required permission level for action
   */
  private getRequiredLevel(action: string): PermissionLevel {
    const actionLevels: Record<string, PermissionLevel> = {
      'read': 'read',
      'write': 'write',
      'create': 'write',
      'update': 'write',
      'delete': 'write',
      'execute': 'execute',
      'admin': 'admin'
    }
    
    return actionLevels[action] || 'execute'
  }

  /**
   * Check if level is sufficient
   */
  private hasSufficientLevel(granted: PermissionLevel, required: PermissionLevel): boolean {
    const levels: PermissionLevel[] = ['none', 'read', 'write', 'execute', 'admin', 'super']
    return levels.indexOf(granted) >= levels.indexOf(required)
  }

  /**
   * Grant permission to agent
   */
  grantPermission(options: {
    agentId: AgentId
    resource: string
    level: PermissionLevel
    grantedBy: string
    conditions?: PermissionCondition[]
    expiresAt?: string
  }): Permission {
    const permission: Permission = {
      id: `perm_${Date.now().toString(36)}`,
      agentId: options.agentId,
      resource: options.resource,
      level: options.level,
      conditions: options.conditions,
      grantedAt: new Date().toISOString(),
      grantedBy: options.grantedBy,
      expiresAt: options.expiresAt
    }
    
    if (!this.permissions.has(options.agentId)) {
      this.permissions.set(options.agentId, [])
    }
    
    this.permissions.get(options.agentId)!.push(permission)
    
    this.emit('permission:granted', permission)
    
    return permission
  }

  /**
   * Revoke permission
   */
  revokePermission(permissionId: string): boolean {
    for (const [agentId, perms] of this.permissions) {
      const index = perms.findIndex(p => p.id === permissionId)
      if (index !== -1) {
        perms.splice(index, 1)
        this.emit('permission:revoked', { permissionId, agentId })
        return true
      }
    }
    return false
  }

  /**
   * Add safety constraint
   */
  addConstraint(constraint: SafetyConstraint): void {
    this.constraints.set(constraint.id, constraint)
    this.emit('constraint:added', constraint)
  }

  /**
   * Remove safety constraint
   */
  removeConstraint(constraintId: string): boolean {
    const existed = this.constraints.delete(constraintId)
    if (existed) {
      this.emit('constraint:removed', { constraintId })
    }
    return existed
  }

  /**
   * Add policy
   */
  addPolicy(policy: ActionPolicy): void {
    this.policies.set(policy.id, policy)
    this.emit('policy:added', policy)
  }

  /**
   * Request escalation
   */
  requestEscalation(
    agentId: AgentId,
    action: string,
    reason: string,
    level: EscalationLevel = 'supervisor',
    resource?: string
  ): EscalationRequest {
    const request: EscalationRequest = {
      id: `esc_${Date.now().toString(36)}`,
      agentId,
      action,
      resource,
      reason,
      level,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    
    this.escalations.set(request.id, request)
    this.emit('escalation:requested', request)
    
    return request
  }

  /**
   * Resolve escalation
   */
  resolveEscalation(
    escalationId: string,
    approved: boolean,
    resolvedBy: string,
    notes?: string
  ): EscalationRequest | null {
    const request = this.escalations.get(escalationId)
    if (!request || request.status !== 'pending') {
      return null
    }
    
    request.status = approved ? 'approved' : 'denied'
    request.resolvedAt = new Date().toISOString()
    request.resolvedBy = resolvedBy
    request.notes = notes
    
    this.emit('escalation:resolved', request)
    
    return request
  }

  /**
   * Create behavior alert
   */
  createAlert(
    agentId: AgentId,
    type: BehaviorAlert['type'],
    severity: BehaviorAlert['severity'],
    message: string,
    details: Record<string, any> = {}
  ): BehaviorAlert {
    const alert: BehaviorAlert = {
      id: `alert_${Date.now().toString(36)}`,
      agentId,
      type,
      severity,
      message,
      details,
      timestamp: new Date().toISOString(),
      acknowledged: false
    }
    
    this.alerts.push(alert)
    this.emit('alert:created', alert)
    
    return alert
  }

  /**
   * Get statistics
   */
  getStats(): GovernanceStats {
    const deniedByAgent: Map<string, number> = new Map()
    const deniedByAction: Map<string, number> = new Map()
    
    let denied = 0
    let allowed = 0
    
    for (const { decision } of this.actionHistory) {
      if (decision.allowed) {
        allowed++
      } else {
        denied++
      }
    }
    
    // Recent alerts for violations
    const violations = this.alerts.filter(a => a.type === 'violation').length
    
    // Top denied agents
    for (const { context, decision } of this.actionHistory) {
      if (!decision.allowed) {
        deniedByAgent.set(context.agentId, (deniedByAgent.get(context.agentId) || 0) + 1)
        deniedByAction.set(context.action, (deniedByAction.get(context.action) || 0) + 1)
      }
    }
    
    return {
      totalActions: this.actionHistory.length,
      allowedActions: allowed,
      deniedActions: denied,
      escalations: this.escalations.size,
      violations,
      topDeniedAgents: Array.from(deniedByAgent.entries())
        .map(([agentId, count]) => ({ agentId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      topDeniedActions: Array.from(deniedByAction.entries())
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    }
  }

  /**
   * Get pending escalations
   */
  getPendingEscalations(): EscalationRequest[] {
    return Array.from(this.escalations.values())
      .filter(e => e.status === 'pending')
  }

  /**
   * Get alerts
   */
  getAlerts(acknowledged?: boolean): BehaviorAlert[] {
    return this.alerts.filter(a => 
      acknowledged === undefined || a.acknowledged === acknowledged
    )
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      this.emit('alert:acknowledged', alert)
      return true
    }
    return false
  }

  /**
   * Get permissions for agent
   */
  getAgentPermissions(agentId: AgentId): Permission[] {
    return this.permissions.get(agentId) || []
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.actionHistory = []
    this.rateLimits.clear()
  }
}

// Singleton
let governanceInstance: AgentGovernanceSystem | null = null

export function getGovernanceSystem(): AgentGovernanceSystem {
  if (!governanceInstance) {
    governanceInstance = new AgentGovernanceSystem()
  }
  return governanceInstance
}

/**
 * Quick governance check
 */
export function checkGovernance(context: GovernanceContext): GovernanceDecision {
  const governance = getGovernanceSystem()
  return governance.evaluate(context)
}
