/**
 * Runtime Trace Analyzer
 * 
 * Analyzes runtime behavior and traces:
 * - Stack trace interpretation
 * - Performance profiling
 * - Memory usage analysis
 * - Error pattern detection
 * - Resource monitoring
 * - Anomaly detection
 */

import { EventEmitter } from 'events'
import fs from 'fs/promises'
import path from 'path'

// Types
export interface RuntimeTrace {
  id: string
  timestamp: string
  type: 'request' | 'error' | 'performance' | 'memory' | 'custom'
  duration?: number
  operation: string
  metadata: Record<string, any>
  stackTrace?: string
  parentTraceId?: string
  children?: string[]
}

export interface StackFrame {
  functionName: string
  fileName: string
  lineNumber: number
  columnNumber: number
  isNative: boolean
  isApplication: boolean
  sourceCode?: string
}

export interface ParsedStackTrace {
  message: string
  errorType: string
  frames: StackFrame[]
  cause?: ParsedStackTrace
  applicationFrames: StackFrame[]
  relevantFrame?: StackFrame
}

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'percent'
  timestamp: string
  tags: Record<string, string>
}

export interface MemorySnapshot {
  timestamp: string
  heapUsed: number
  heapTotal: number
  external: number
  arrayBuffers: number
  rss: number
}

export interface ErrorPattern {
  id: string
  pattern: string
  errorType: string
  frequency: number
  lastOccurrence: string
  example: string
  resolution?: string
}

export interface Anomaly {
  id: string
  type: 'performance' | 'memory' | 'error' | 'behavior'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  value: number
  expectedRange: [number, number]
  timestamp: string
  context: Record<string, any>
}

export interface RuntimeAnalysis {
  health: 'healthy' | 'degraded' | 'unhealthy'
  performance: {
    averageResponseTime: number
    p95ResponseTime: number
    throughput: number
    slowOperations: string[]
  }
  memory: {
    current: MemorySnapshot
    trend: 'increasing' | 'stable' | 'decreasing'
    leakSuspected: boolean
    peakUsage: number
  }
  errors: {
    total: number
    errorRate: number
    patterns: ErrorPattern[]
    recentErrors: RuntimeTrace[]
  }
  anomalies: Anomaly[]
  recommendations: string[]
}

// Storage
const STORAGE_DIR = path.join(process.cwd(), 'data', 'runtime-traces')
const TRACES_FILE = path.join(STORAGE_DIR, 'traces.json')
const PATTERNS_FILE = path.join(STORAGE_DIR, 'error-patterns.json')

// Thresholds
const DEFAULT_THRESHOLDS = {
  responseTimeWarning: 1000,      // ms
  responseTimeCritical: 5000,     // ms
  memoryWarningMB: 500,
  memoryCriticalMB: 1000,
  errorRateWarning: 0.05,         // 5%
  errorRateCritical: 0.15         // 15%
}

/**
 * Runtime Trace Analyzer
 */
export class RuntimeTraceAnalyzer extends EventEmitter {
  private traces: RuntimeTrace[] = []
  private errorPatterns: Map<string, ErrorPattern> = new Map()
  private memoryHistory: MemorySnapshot[] = []
  private metrics: PerformanceMetric[] = []
  private thresholds = DEFAULT_THRESHOLDS
  private initialized = false

  constructor() {
    super()
  }

  /**
   * Initialize the analyzer
   */
  async init(): Promise<void> {
    if (this.initialized) return

    await fs.mkdir(STORAGE_DIR, { recursive: true })
    await this.loadTraces()
    await this.loadPatterns()
    
    this.initialized = true
  }

  /**
   * Record a trace
   */
  recordTrace(trace: Omit<RuntimeTrace, 'id' | 'timestamp'>): RuntimeTrace {
    const fullTrace: RuntimeTrace = {
      id: `trace_${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      ...trace
    }

    this.traces.push(fullTrace)
    this.emit('trace:recorded', fullTrace)

    // Analyze if it's an error
    if (trace.type === 'error') {
      this.analyzeErrorTrace(fullTrace)
    }

    return fullTrace
  }

  /**
   * Record a memory snapshot
   */
  recordMemorySnapshot(): MemorySnapshot {
    const memUsage = process.memoryUsage()
    
    const snapshot: MemorySnapshot = {
      timestamp: new Date().toISOString(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      rss: memUsage.rss
    }

    this.memoryHistory.push(snapshot)

    // Keep only last 100 snapshots
    if (this.memoryHistory.length > 100) {
      this.memoryHistory.shift()
    }

    // Check for memory issues
    this.checkMemoryAnomalies(snapshot)

    this.emit('memory:snapshot', snapshot)

    return snapshot
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: PerformanceMetric['unit'],
    tags: Record<string, string> = {}
  ): PerformanceMetric {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags
    }

    this.metrics.push(metric)

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics.shift()
    }

    // Check for performance anomalies
    this.checkPerformanceAnomalies(metric)

    return metric
  }

  /**
   * Parse a stack trace
   */
  parseStackTrace(stackTrace: string): ParsedStackTrace {
    const lines = stackTrace.split('\n')
    const message = lines[0]
    
    // Extract error type
    const errorTypeMatch = message.match(/^(\w+Error|\w+Exception)/)
    const errorType = errorTypeMatch ? errorTypeMatch[1] : 'Error'

    // Parse frames
    const frames: StackFrame[] = []
    const frameRegex = /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/

    for (const line of lines.slice(1)) {
      const match = line.match(frameRegex)
      if (match) {
        const [, functionName, fileName, lineNumber, columnNumber] = match
        
        const frame: StackFrame = {
          functionName: functionName || '<anonymous>',
          fileName,
          lineNumber: parseInt(lineNumber, 10),
          columnNumber: parseInt(columnNumber, 10),
          isNative: fileName === 'native',
          isApplication: !fileName.includes('node_modules') && !fileName.startsWith('internal')
        }

        frames.push(frame)
      }
    }

    // Find application frames
    const applicationFrames = frames.filter(f => f.isApplication)

    // Find most relevant frame (first application frame)
    const relevantFrame = applicationFrames[0]

    return {
      message,
      errorType,
      frames,
      applicationFrames,
      relevantFrame
    }
  }

  /**
   * Analyze an error trace
   */
  private analyzeErrorTrace(trace: RuntimeTrace): void {
    if (!trace.stackTrace) return

    const parsed = this.parseStackTrace(trace.stackTrace)

    // Create pattern key
    const patternKey = `${parsed.errorType}:${parsed.relevantFrame?.functionName || 'unknown'}`

    if (this.errorPatterns.has(patternKey)) {
      // Update existing pattern
      const pattern = this.errorPatterns.get(patternKey)!
      pattern.frequency++
      pattern.lastOccurrence = trace.timestamp
    } else {
      // Create new pattern
      this.errorPatterns.set(patternKey, {
        id: `pattern_${Date.now().toString(36)}`,
        pattern: patternKey,
        errorType: parsed.errorType,
        frequency: 1,
        lastOccurrence: trace.timestamp,
        example: trace.stackTrace
      })
    }

    // Save patterns
    this.savePatterns()

    this.emit('error:analyzed', { trace, parsed, patternKey })
  }

  /**
   * Check for memory anomalies
   */
  private checkMemoryAnomalies(snapshot: MemorySnapshot): void {
    const heapMB = snapshot.heapUsed / 1024 / 1024

    if (heapMB > this.thresholds.memoryCriticalMB) {
      this.createAnomaly(
        'memory',
        'critical',
        `Critical memory usage: ${heapMB.toFixed(0)}MB`,
        heapMB,
        [0, this.thresholds.memoryCriticalMB],
        { snapshot }
      )
    } else if (heapMB > this.thresholds.memoryWarningMB) {
      this.createAnomaly(
        'memory',
        'high',
        `High memory usage: ${heapMB.toFixed(0)}MB`,
        heapMB,
        [0, this.thresholds.memoryWarningMB],
        { snapshot }
      )
    }

    // Check for memory leak (continuous increase)
    if (this.memoryHistory.length >= 10) {
      const recent = this.memoryHistory.slice(-10)
      const increasing = recent.every((snap, i) => 
        i === 0 || snap.heapUsed >= recent[i - 1].heapUsed
      )

      if (increasing) {
        this.createAnomaly(
          'memory',
          'medium',
          'Possible memory leak detected - continuous memory increase',
          heapMB,
          [0, this.thresholds.memoryWarningMB],
          { trend: 'increasing' }
        )
      }
    }
  }

  /**
   * Check for performance anomalies
   */
  private checkPerformanceAnomalies(metric: PerformanceMetric): void {
    if (metric.unit !== 'ms') return

    if (metric.value > this.thresholds.responseTimeCritical) {
      this.createAnomaly(
        'performance',
        'critical',
        `Critical response time: ${metric.value}ms for ${metric.name}`,
        metric.value,
        [0, this.thresholds.responseTimeCritical],
        { metric }
      )
    } else if (metric.value > this.thresholds.responseTimeWarning) {
      this.createAnomaly(
        'performance',
        'medium',
        `Slow response time: ${metric.value}ms for ${metric.name}`,
        metric.value,
        [0, this.thresholds.responseTimeWarning],
        { metric }
      )
    }
  }

  /**
   * Create an anomaly
   */
  private createAnomaly(
    type: Anomaly['type'],
    severity: Anomaly['severity'],
    description: string,
    value: number,
    expectedRange: [number, number],
    context: Record<string, any>
  ): Anomaly {
    const anomaly: Anomaly = {
      id: `anomaly_${Date.now().toString(36)}`,
      type,
      severity,
      description,
      value,
      expectedRange,
      timestamp: new Date().toISOString(),
      context
    }

    this.emit('anomaly:detected', anomaly)

    return anomaly
  }

  /**
   * Analyze runtime performance
   */
  async analyze(): Promise<RuntimeAnalysis> {
    await this.init()

    // Get recent traces (last hour)
    const oneHourAgo = Date.now() - 3600000
    const recentTraces = this.traces.filter(t => 
      new Date(t.timestamp).getTime() > oneHourAgo
    )

    // Performance analysis
    const requestTraces = recentTraces.filter(t => t.type === 'request' && t.duration)
    const durations = requestTraces.map(t => t.duration!).sort((a, b) => a - b)
    
    const averageResponseTime = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0

    const p95Index = Math.floor(durations.length * 0.95)
    const p95ResponseTime = durations[p95Index] || 0

    const throughput = requestTraces.length / 60 // per minute

    const slowOperations = requestTraces
      .filter(t => (t.duration || 0) > this.thresholds.responseTimeWarning)
      .map(t => t.operation)
      .slice(0, 10)

    // Memory analysis
    const currentMemory = this.memoryHistory[this.memoryHistory.length - 1] || {
      timestamp: new Date().toISOString(),
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0,
      rss: process.memoryUsage().rss
    }

    // Memory trend
    let memoryTrend: 'increasing' | 'stable' | 'decreasing' = 'stable'
    if (this.memoryHistory.length >= 5) {
      const recent = this.memoryHistory.slice(-5)
      const older = this.memoryHistory.slice(-10, -5)
      
      if (older.length > 0) {
        const recentAvg = recent.reduce((sum, m) => sum + m.heapUsed, 0) / recent.length
        const olderAvg = older.reduce((sum, m) => sum + m.heapUsed, 0) / older.length
        
        if (recentAvg > olderAvg * 1.1) {
          memoryTrend = 'increasing'
        } else if (recentAvg < olderAvg * 0.9) {
          memoryTrend = 'decreasing'
        }
      }
    }

    const peakUsage = Math.max(...this.memoryHistory.map(m => m.heapUsed), 0)

    // Leak detection
    const leakSuspected = memoryTrend === 'increasing' && 
      this.memoryHistory.length >= 10 &&
      currentMemory.heapUsed > this.thresholds.memoryWarningMB * 1024 * 1024

    // Error analysis
    const errorTraces = recentTraces.filter(t => t.type === 'error')
    const totalRequests = requestTraces.length + errorTraces.length
    const errorRate = totalRequests > 0 ? errorTraces.length / totalRequests : 0

    const patterns = Array.from(this.errorPatterns.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)

    const recentErrors = errorTraces.slice(-10)

    // Determine health
    let health: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    if (errorRate > this.thresholds.errorRateCritical || 
        averageResponseTime > this.thresholds.responseTimeCritical ||
        currentMemory.heapUsed > this.thresholds.memoryCriticalMB * 1024 * 1024) {
      health = 'unhealthy'
    } else if (errorRate > this.thresholds.errorRateWarning ||
               averageResponseTime > this.thresholds.responseTimeWarning ||
               currentMemory.heapUsed > this.thresholds.memoryWarningMB * 1024 * 1024) {
      health = 'degraded'
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      health,
      averageResponseTime,
      errorRate,
      memoryTrend,
      leakSuspected,
      slowOperations,
      patterns
    })

    return {
      health,
      performance: {
        averageResponseTime,
        p95ResponseTime,
        throughput,
        slowOperations
      },
      memory: {
        current: currentMemory,
        trend: memoryTrend,
        leakSuspected,
        peakUsage
      },
      errors: {
        total: errorTraces.length,
        errorRate,
        patterns,
        recentErrors
      },
      anomalies: [], // Would need to track these separately
      recommendations
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(analysis: Partial<RuntimeAnalysis>): string[] {
    const recommendations: string[] = []

    if (analysis.averageResponseTime && analysis.averageResponseTime > 1000) {
      recommendations.push('Optimize slow operations - consider caching or database indexing')
    }

    if (analysis.errorRate && analysis.errorRate > 0.05) {
      recommendations.push('Investigate and fix recurring errors')
    }

    if (analysis.memoryTrend === 'increasing') {
      recommendations.push('Monitor memory usage for potential leak')
    }

    if (analysis.leakSuspected) {
      recommendations.push('Memory leak detected - review object lifecycle and closures')
    }

    if (analysis.slowOperations && analysis.slowOperations.length > 0) {
      recommendations.push(`Review slow operations: ${analysis.slowOperations.slice(0, 3).join(', ')}`)
    }

    if (analysis.patterns && analysis.patterns.length > 0) {
      recommendations.push(`Address common error pattern: ${analysis.patterns[0].errorType}`)
    }

    return recommendations
  }

  /**
   * Load traces from storage
   */
  private async loadTraces(): Promise<void> {
    try {
      const data = await fs.readFile(TRACES_FILE, 'utf-8')
      this.traces = JSON.parse(data)
    } catch {
      this.traces = []
    }
  }

  /**
   * Save traces to storage
   */
  async saveTraces(): Promise<void> {
    // Keep only last 1000 traces
    const toSave = this.traces.slice(-1000)
    await fs.writeFile(TRACES_FILE, JSON.stringify(toSave, null, 2))
  }

  /**
   * Load error patterns
   */
  private async loadPatterns(): Promise<void> {
    try {
      const data = await fs.readFile(PATTERNS_FILE, 'utf-8')
      const patterns = JSON.parse(data)
      this.errorPatterns = new Map(patterns.map((p: ErrorPattern) => [p.pattern, p]))
    } catch {
      this.errorPatterns = new Map()
    }
  }

  /**
   * Save error patterns
   */
  private async savePatterns(): Promise<void> {
    const patterns = Array.from(this.errorPatterns.values())
    await fs.writeFile(PATTERNS_FILE, JSON.stringify(patterns, null, 2))
  }

  /**
   * Get traces
   */
  getTraces(limit = 100): RuntimeTrace[] {
    return this.traces.slice(-limit)
  }

  /**
   * Get memory history
   */
  getMemoryHistory(): MemorySnapshot[] {
    return [...this.memoryHistory]
  }

  /**
   * Get error patterns
   */
  getErrorPatterns(): ErrorPattern[] {
    return Array.from(this.errorPatterns.values())
      .sort((a, b) => b.frequency - a.frequency)
  }
}

// Singleton
let analyzerInstance: RuntimeTraceAnalyzer | null = null

export function getRuntimeAnalyzer(): RuntimeTraceAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new RuntimeTraceAnalyzer()
  }
  return analyzerInstance
}

/**
 * Initialize runtime analyzer
 */
export async function initRuntimeAnalyzer(): Promise<RuntimeTraceAnalyzer> {
  const analyzer = getRuntimeAnalyzer()
  await analyzer.init()
  return analyzer
}

/**
 * Quick trace recording
 */
export function recordTrace(
  type: RuntimeTrace['type'],
  operation: string,
  metadata: Record<string, any> = {},
  stackTrace?: string
): RuntimeTrace {
  const analyzer = getRuntimeAnalyzer()
  return analyzer.recordTrace({
    type,
    operation,
    metadata,
    stackTrace
  })
}
