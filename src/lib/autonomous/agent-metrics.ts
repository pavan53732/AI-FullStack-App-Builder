/**
 * Agent Metrics Collector
 * 
 * Tracks and analyzes agent performance metrics:
 * - Task completion rates
 * - Error rates and patterns
 * - Latency measurements
 * - Resource utilization
 * - Reliability scoring
 * - Performance trending
 */

import { EventEmitter } from 'events'
import fs from 'fs/promises'
import path from 'path'
import type { AgentId } from './agent-message-bus'

// Types
export interface AgentMetricSnapshot {
  agentId: AgentId
  timestamp: string
  metrics: {
    tasksCompleted: number
    tasksFailed: number
    tasksInProgress: number
    averageLatency: number
    averageConfidence: number
    errorRate: number
    successRate: number
    throughput: number          // tasks per minute
    resourceUsage: ResourceUsage
  }
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    score: number               // 0-100
    issues: string[]
  }
  trends: {
    latencyTrend: 'improving' | 'stable' | 'degrading'
    successTrend: 'improving' | 'stable' | 'degrading'
    loadTrend: 'increasing' | 'stable' | 'decreasing'
  }
}

export interface ResourceUsage {
  memoryMB: number
  cpuPercent: number
  openConnections: number
  queuedTasks: number
}

export interface AgentPerformanceRecord {
  id: string
  agentId: AgentId
  taskId: string
  action: string
  startTime: string
  endTime?: string
  duration?: number
  status: 'started' | 'completed' | 'failed' | 'timeout'
  error?: string
  confidence?: number
  metadata?: Record<string, any>
}

export interface AgentReliabilityScore {
  agentId: AgentId
  overallScore: number          // 0-100
  consistencyScore: number      // How consistent is performance
  recoveryScore: number         // How well does agent recover from errors
  speedScore: number            // Relative speed compared to other agents
  qualityScore: number          // Quality of outputs
  lastUpdated: string
  trend: 'improving' | 'stable' | 'declining'
}

export interface MetricsAlert {
  id: string
  agentId: AgentId
  type: 'high_latency' | 'high_error_rate' | 'low_throughput' | 'resource_exhaustion' | 'anomaly'
  severity: 'warning' | 'critical'
  message: string
  value: number
  threshold: number
  timestamp: string
  acknowledged: boolean
}

export interface MetricsSummary {
  totalAgents: number
  healthyAgents: number
  degradedAgents: number
  unhealthyAgents: number
  totalTasksCompleted: number
  totalTasksFailed: number
  overallSuccessRate: number
  averageLatency: number
  topPerformers: AgentId[]
  underPerformers: AgentId[]
  alerts: MetricsAlert[]
}

// Configuration
const METRICS_DIR = path.join(process.cwd(), 'data', 'metrics')
const RECORDS_FILE = path.join(METRICS_DIR, 'agent-records.json')
const SCORES_FILE = path.join(METRICS_DIR, 'reliability-scores.json')

// Default thresholds
const DEFAULT_THRESHOLDS = {
  latencyWarning: 30000,        // 30 seconds
  latencyCritical: 60000,       // 60 seconds
  errorRateWarning: 0.1,        // 10%
  errorRateCritical: 0.25,      // 25%
  throughputWarning: 0.5,       // 0.5 tasks per minute
  memoryWarningMB: 500,
  memoryCriticalMB: 1000
}

/**
 * Agent Metrics Collector
 */
export class AgentMetricsCollector extends EventEmitter {
  private records: AgentPerformanceRecord[] = []
  private reliabilityScores: Map<AgentId, AgentReliabilityScore> = new Map()
  private alerts: MetricsAlert[] = []
  private thresholds = DEFAULT_THRESHOLDS
  private initialized = false

  // Agent type capabilities for relative scoring
  private agentCapabilities: Record<AgentId, { expectedSpeed: number; expectedQuality: number }> = {
    orchestrator: { expectedSpeed: 0.9, expectedQuality: 0.9 },
    planner: { expectedSpeed: 0.7, expectedQuality: 0.95 },
    coder: { expectedSpeed: 0.5, expectedQuality: 0.85 },
    debugger: { expectedSpeed: 0.6, expectedQuality: 0.9 },
    reviewer: { expectedSpeed: 0.7, expectedQuality: 0.95 },
    tester: { expectedSpeed: 0.6, expectedQuality: 0.9 },
    architect: { expectedSpeed: 0.6, expectedQuality: 0.95 },
    deployer: { expectedSpeed: 0.8, expectedQuality: 0.9 }
  }

  constructor() {
    super()
  }

  /**
   * Initialize the metrics collector
   */
  async init(): Promise<void> {
    if (this.initialized) return

    await fs.mkdir(METRICS_DIR, { recursive: true })
    await this.loadRecords()
    await this.loadScores()
    
    this.initialized = true
  }

  /**
   * Record task start
   */
  recordTaskStart(
    agentId: AgentId,
    taskId: string,
    action: string,
    metadata?: Record<string, any>
  ): AgentPerformanceRecord {
    const record: AgentPerformanceRecord = {
      id: `record_${Date.now().toString(36)}`,
      agentId,
      taskId,
      action,
      startTime: new Date().toISOString(),
      status: 'started',
      metadata
    }

    this.records.push(record)
    this.emit('task:started', { agentId, taskId, action })

    return record
  }

  /**
   * Record task completion
   */
  recordTaskCompletion(
    agentId: AgentId,
    taskId: string,
    confidence?: number,
    metadata?: Record<string, any>
  ): void {
    const record = this.records.find(r => 
      r.agentId === agentId && 
      r.taskId === taskId && 
      r.status === 'started'
    )

    if (record) {
      record.endTime = new Date().toISOString()
      record.duration = new Date(record.endTime).getTime() - new Date(record.startTime).getTime()
      record.status = 'completed'
      record.confidence = confidence
      record.metadata = { ...record.metadata, ...metadata }

      this.emit('task:completed', { agentId, taskId, duration: record.duration })

      // Check for alerts
      this.checkThresholds(agentId, record)

      // Update reliability score
      this.updateReliabilityScore(agentId)
    }
  }

  /**
   * Record task failure
   */
  recordTaskFailure(
    agentId: AgentId,
    taskId: string,
    error: string,
    metadata?: Record<string, any>
  ): void {
    const record = this.records.find(r => 
      r.agentId === agentId && 
      r.taskId === taskId && 
      r.status === 'started'
    )

    if (record) {
      record.endTime = new Date().toISOString()
      record.duration = new Date(record.endTime).getTime() - new Date(record.startTime).getTime()
      record.status = 'failed'
      record.error = error
      record.metadata = { ...record.metadata, ...metadata }

      this.emit('task:failed', { agentId, taskId, error })

      // Check for alerts
      this.checkThresholds(agentId, record)

      // Update reliability score
      this.updateReliabilityScore(agentId)
    }
  }

  /**
   * Record task timeout
   */
  recordTaskTimeout(agentId: AgentId, taskId: string): void {
    const record = this.records.find(r => 
      r.agentId === agentId && 
      r.taskId === taskId && 
      r.status === 'started'
    )

    if (record) {
      record.endTime = new Date().toISOString()
      record.duration = new Date(record.endTime).getTime() - new Date(record.startTime).getTime()
      record.status = 'timeout'

      this.emit('task:timeout', { agentId, taskId })

      // Update reliability score
      this.updateReliabilityScore(agentId)
    }
  }

  /**
   * Get metrics snapshot for an agent
   */
  getAgentMetrics(agentId: AgentId): AgentMetricSnapshot {
    const agentRecords = this.records.filter(r => r.agentId === agentId)
    
    // Calculate time window (last hour)
    const oneHourAgo = Date.now() - 3600000
    const recentRecords = agentRecords.filter(r => 
      new Date(r.startTime).getTime() > oneHourAgo
    )

    const completed = recentRecords.filter(r => r.status === 'completed')
    const failed = recentRecords.filter(r => r.status === 'failed' || r.status === 'timeout')
    const inProgress = recentRecords.filter(r => r.status === 'started')

    const totalTasks = completed.length + failed.length
    const successRate = totalTasks > 0 ? completed.length / totalTasks : 0
    const errorRate = totalTasks > 0 ? failed.length / totalTasks : 0

    const durations = completed
      .map(r => r.duration || 0)
      .filter(d => d > 0)
    const averageLatency = durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0

    const confidences = completed
      .map(r => r.confidence || 0)
      .filter(c => c > 0)
    const averageConfidence = confidences.length > 0 
      ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length 
      : 0

    // Calculate throughput (tasks per minute)
    const throughput = recentRecords.length / 60

    // Determine health status
    const health = this.calculateHealth(agentId, successRate, errorRate, averageLatency)

    // Calculate trends
    const trends = this.calculateTrends(agentId, recentRecords)

    return {
      agentId,
      timestamp: new Date().toISOString(),
      metrics: {
        tasksCompleted: completed.length,
        tasksFailed: failed.length,
        tasksInProgress: inProgress.length,
        averageLatency,
        averageConfidence,
        errorRate,
        successRate,
        throughput,
        resourceUsage: {
          memoryMB: process.memoryUsage().heapUsed / 1024 / 1024,
          cpuPercent: 0, // Would need actual CPU monitoring
          openConnections: 0,
          queuedTasks: inProgress.length
        }
      },
      health,
      trends
    }
  }

  /**
   * Calculate health status
   */
  private calculateHealth(
    agentId: AgentId,
    successRate: number,
    errorRate: number,
    avgLatency: number
  ): AgentMetricSnapshot['health'] {
    const issues: string[] = []
    let score = 100

    // Check success rate
    if (successRate < 0.5) {
      issues.push(`Low success rate: ${(successRate * 100).toFixed(0)}%`)
      score -= 30
    } else if (successRate < 0.8) {
      issues.push(`Moderate success rate: ${(successRate * 100).toFixed(0)}%`)
      score -= 15
    }

    // Check error rate
    if (errorRate > 0.25) {
      issues.push(`High error rate: ${(errorRate * 100).toFixed(0)}%`)
      score -= 25
    } else if (errorRate > 0.1) {
      issues.push(`Moderate error rate: ${(errorRate * 100).toFixed(0)}%`)
      score -= 10
    }

    // Check latency
    if (avgLatency > this.thresholds.latencyCritical) {
      issues.push(`Critical latency: ${(avgLatency / 1000).toFixed(1)}s`)
      score -= 20
    } else if (avgLatency > this.thresholds.latencyWarning) {
      issues.push(`High latency: ${(avgLatency / 1000).toFixed(1)}s`)
      score -= 10
    }

    // Determine status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (score < 50) {
      status = 'unhealthy'
    } else if (score < 80) {
      status = 'degraded'
    }

    return {
      status,
      score: Math.max(0, score),
      issues
    }
  }

  /**
   * Calculate performance trends
   */
  private calculateTrends(
    agentId: AgentId,
    recentRecords: AgentPerformanceRecord[]
  ): AgentMetricSnapshot['trends'] {
    // Compare recent (last 30 min) vs earlier (30-60 min ago)
    const now = Date.now()
    const thirtyMinAgo = now - 1800000
    const sixtyMinAgo = now - 3600000

    const veryRecent = recentRecords.filter(r => 
      new Date(r.startTime).getTime() > thirtyMinAgo
    )
    const earlier = recentRecords.filter(r => 
      new Date(r.startTime).getTime() > sixtyMinAgo &&
      new Date(r.startTime).getTime() <= thirtyMinAgo
    )

    // Latency trend
    const recentLatency = this.getAverageLatency(veryRecent)
    const earlierLatency = this.getAverageLatency(earlier)
    const latencyTrend: 'improving' | 'stable' | 'degrading' = 
      recentLatency < earlierLatency * 0.9 ? 'improving' :
      recentLatency > earlierLatency * 1.1 ? 'degrading' : 'stable'

    // Success trend
    const recentSuccess = this.getSuccessRate(veryRecent)
    const earlierSuccess = this.getSuccessRate(earlier)
    const successTrend: 'improving' | 'stable' | 'degrading' = 
      recentSuccess > earlierSuccess + 0.1 ? 'improving' :
      recentSuccess < earlierSuccess - 0.1 ? 'degrading' : 'stable'

    // Load trend
    const loadTrend: 'increasing' | 'stable' | 'decreasing' = 
      veryRecent.length > earlier.length * 1.2 ? 'increasing' :
      veryRecent.length < earlier.length * 0.8 ? 'decreasing' : 'stable'

    return { latencyTrend, successTrend, loadTrend }
  }

  private getAverageLatency(records: AgentPerformanceRecord[]): number {
    const completed = records.filter(r => r.status === 'completed' && r.duration)
    if (completed.length === 0) return 0
    return completed.reduce((sum, r) => sum + (r.duration || 0), 0) / completed.length
  }

  private getSuccessRate(records: AgentPerformanceRecord[]): number {
    const total = records.filter(r => r.status !== 'started').length
    if (total === 0) return 1
    const completed = records.filter(r => r.status === 'completed').length
    return completed / total
  }

  /**
   * Get reliability score for an agent
   */
  getReliabilityScore(agentId: AgentId): AgentReliabilityScore {
    if (this.reliabilityScores.has(agentId)) {
      return this.reliabilityScores.get(agentId)!
    }

    // Calculate new score
    return this.updateReliabilityScore(agentId)
  }

  /**
   * Update reliability score for an agent
   */
  private updateReliabilityScore(agentId: AgentId): AgentReliabilityScore {
    const agentRecords = this.records.filter(r => r.agentId === agentId)
    const capabilities = this.agentCapabilities[agentId] || { expectedSpeed: 0.7, expectedQuality: 0.85 }

    // Overall success rate
    const total = agentRecords.filter(r => r.status !== 'started').length
    const completed = agentRecords.filter(r => r.status === 'completed').length
    const overallScore = total > 0 ? (completed / total) * 100 : 50

    // Consistency score (variance in performance)
    const latencies = agentRecords
      .filter(r => r.duration)
      .map(r => r.duration!)
    const avgLatency = latencies.length > 0 
      ? latencies.reduce((sum, l) => sum + l, 0) / latencies.length 
      : 0
    const variance = latencies.length > 1
      ? latencies.reduce((sum, l) => sum + Math.pow(l - avgLatency, 2), 0) / latencies.length
      : 0
    const consistencyScore = Math.max(0, 100 - Math.sqrt(variance) / 100)

    // Recovery score (how well agent recovers from failures)
    const failures = agentRecords.filter(r => r.status === 'failed')
    const recoveries = failures.filter((f, i) => {
      const nextRecord = agentRecords[agentRecords.indexOf(f) + 1]
      return nextRecord && nextRecord.status === 'completed'
    })
    const recoveryScore = failures.length > 0 
      ? (recoveries.length / failures.length) * 100 
      : 100

    // Speed score (relative to expected)
    const speedScore = avgLatency > 0
      ? Math.min(100, (capabilities.expectedSpeed * 30000 / avgLatency) * 100)
      : 50

    // Quality score (based on confidence)
    const confidences = agentRecords
      .filter(r => r.confidence !== undefined)
      .map(r => r.confidence!)
    const qualityScore = confidences.length > 0
      ? (confidences.reduce((sum, c) => sum + c, 0) / confidences.length) * 100
      : capabilities.expectedQuality * 100

    // Calculate trend
    const recent = agentRecords.slice(-20)
    const older = agentRecords.slice(-40, -20)
    const recentSuccess = this.getSuccessRate(recent)
    const olderSuccess = this.getSuccessRate(older)
    const trend: 'improving' | 'stable' | 'declining' = 
      recentSuccess > olderSuccess + 0.1 ? 'improving' :
      recentSuccess < olderSuccess - 0.1 ? 'declining' : 'stable'

    const score: AgentReliabilityScore = {
      agentId,
      overallScore: Math.round(overallScore),
      consistencyScore: Math.round(consistencyScore),
      recoveryScore: Math.round(recoveryScore),
      speedScore: Math.round(speedScore),
      qualityScore: Math.round(qualityScore),
      lastUpdated: new Date().toISOString(),
      trend
    }

    this.reliabilityScores.set(agentId, score)
    this.saveScores()

    return score
  }

  /**
   * Check thresholds and create alerts
   */
  private checkThresholds(agentId: AgentId, record: AgentPerformanceRecord): void {
    // Check latency
    if (record.duration && record.duration > this.thresholds.latencyCritical) {
      this.createAlert(agentId, 'high_latency', 'critical', 
        `Task ${record.taskId} took ${(record.duration / 1000).toFixed(1)}s`,
        record.duration, this.thresholds.latencyCritical)
    } else if (record.duration && record.duration > this.thresholds.latencyWarning) {
      this.createAlert(agentId, 'high_latency', 'warning',
        `Task ${record.taskId} took ${(record.duration / 1000).toFixed(1)}s`,
        record.duration, this.thresholds.latencyWarning)
    }

    // Check error rate
    const metrics = this.getAgentMetrics(agentId)
    if (metrics.metrics.errorRate > this.thresholds.errorRateCritical) {
      this.createAlert(agentId, 'high_error_rate', 'critical',
        `Error rate is ${(metrics.metrics.errorRate * 100).toFixed(0)}%`,
        metrics.metrics.errorRate, this.thresholds.errorRateCritical)
    } else if (metrics.metrics.errorRate > this.thresholds.errorRateWarning) {
      this.createAlert(agentId, 'high_error_rate', 'warning',
        `Error rate is ${(metrics.metrics.errorRate * 100).toFixed(0)}%`,
        metrics.metrics.errorRate, this.thresholds.errorRateWarning)
    }

    // Check throughput
    if (metrics.metrics.throughput < this.thresholds.throughputWarning) {
      this.createAlert(agentId, 'low_throughput', 'warning',
        `Throughput is ${metrics.metrics.throughput.toFixed(2)} tasks/min`,
        metrics.metrics.throughput, this.thresholds.throughputWarning)
    }
  }

  /**
   * Create an alert
   */
  private createAlert(
    agentId: AgentId,
    type: MetricsAlert['type'],
    severity: MetricsAlert['severity'],
    message: string,
    value: number,
    threshold: number
  ): MetricsAlert {
    const alert: MetricsAlert = {
      id: `alert_${Date.now().toString(36)}`,
      agentId,
      type,
      severity,
      message,
      value,
      threshold,
      timestamp: new Date().toISOString(),
      acknowledged: false
    }

    this.alerts.push(alert)
    this.emit('alert:created', alert)

    return alert
  }

  /**
   * Get overall metrics summary
   */
  getSummary(): MetricsSummary {
    const agentIds = new Set(this.records.map(r => r.agentId))
    
    let healthyAgents = 0
    let degradedAgents = 0
    let unhealthyAgents = 0
    const performerScores: Array<{ agentId: AgentId; score: number }> = []

    for (const agentId of agentIds) {
      const metrics = this.getAgentMetrics(agentId)
      
      if (metrics.health.status === 'healthy') healthyAgents++
      else if (metrics.health.status === 'degraded') degradedAgents++
      else unhealthyAgents++

      performerScores.push({
        agentId,
        score: metrics.health.score
      })
    }

    // Sort by score
    performerScores.sort((a, b) => b.score - a.score)

    // Calculate totals
    const totalCompleted = this.records.filter(r => r.status === 'completed').length
    const totalFailed = this.records.filter(r => r.status === 'failed' || r.status === 'timeout').length
    const totalTasks = totalCompleted + totalFailed
    const overallSuccessRate = totalTasks > 0 ? totalCompleted / totalTasks : 0

    // Calculate average latency
    const durations = this.records
      .filter(r => r.duration)
      .map(r => r.duration!)
    const averageLatency = durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0

    return {
      totalAgents: agentIds.size,
      healthyAgents,
      degradedAgents,
      unhealthyAgents,
      totalTasksCompleted: totalCompleted,
      totalTasksFailed: totalFailed,
      overallSuccessRate,
      averageLatency,
      topPerformers: performerScores.slice(0, 3).map(p => p.agentId),
      underPerformers: performerScores.slice(-3).reverse().map(p => p.agentId),
      alerts: this.alerts.filter(a => !a.acknowledged)
    }
  }

  /**
   * Get all alerts
   */
  getAlerts(acknowledged?: boolean): MetricsAlert[] {
    return this.alerts.filter(a => 
      acknowledged === undefined || a.acknowledged === acknowledged
    )
  }

  /**
   * Acknowledge an alert
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
   * Get performance records
   */
  getRecords(agentId?: AgentId, limit = 100): AgentPerformanceRecord[] {
    let filtered = agentId 
      ? this.records.filter(r => r.agentId === agentId)
      : this.records
    
    return filtered.slice(-limit)
  }

  /**
   * Save records to disk
   */
  private async loadRecords(): Promise<void> {
    try {
      const data = await fs.readFile(RECORDS_FILE, 'utf-8')
      this.records = JSON.parse(data)
    } catch {
      this.records = []
    }
  }

  /**
   * Save records to disk
   */
  async saveRecords(): Promise<void> {
    // Keep only last 1000 records
    const toSave = this.records.slice(-1000)
    await fs.writeFile(RECORDS_FILE, JSON.stringify(toSave, null, 2))
  }

  /**
   * Load scores from disk
   */
  private async loadScores(): Promise<void> {
    try {
      const data = await fs.readFile(SCORES_FILE, 'utf-8')
      const scores = JSON.parse(data)
      this.reliabilityScores = new Map(scores.map((s: AgentReliabilityScore) => [s.agentId, s]))
    } catch {
      this.reliabilityScores = new Map()
    }
  }

  /**
   * Save scores to disk
   */
  private async saveScores(): Promise<void> {
    const scores = Array.from(this.reliabilityScores.values())
    await fs.writeFile(SCORES_FILE, JSON.stringify(scores, null, 2))
  }

  /**
   * Clear old records
   */
  async clearOldRecords(olderThanDays = 7): Promise<number> {
    const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000)
    const originalLength = this.records.length
    
    this.records = this.records.filter(r => 
      new Date(r.startTime).getTime() > cutoff
    )
    
    await this.saveRecords()
    
    return originalLength - this.records.length
  }
}

// Singleton
let metricsInstance: AgentMetricsCollector | null = null

export function getMetricsCollector(): AgentMetricsCollector {
  if (!metricsInstance) {
    metricsInstance = new AgentMetricsCollector()
  }
  return metricsInstance
}

/**
 * Initialize metrics collector
 */
export async function initMetrics(): Promise<AgentMetricsCollector> {
  const collector = getMetricsCollector()
  await collector.init()
  return collector
}
