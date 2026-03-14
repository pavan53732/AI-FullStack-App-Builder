/**
 * Performance Profiler
 * 
 * Profiles generated applications in real-time to detect:
 * - Slow functions and bottlenecks
 * - Memory leaks and allocation patterns
 * - CPU spikes and intensive operations
 * - I/O bottlenecks
 * - Network latency issues
 * - Render performance (for frontend)
 * 
 * Integrates with runtime-analyzer.ts for comprehensive monitoring
 */

import { EventEmitter } from 'events'
import { spawn, ChildProcess } from 'child_process'
import fs from 'fs/promises'
import path from 'path'

// ============================================
// Types
// ============================================

export interface PerformanceProfile {
  id: string
  timestamp: string
  duration: number
  metrics: PerformanceMetrics
  hotspots: PerformanceHotspot[]
  memoryProfile: MemoryProfile
  cpuProfile: CPUProfile
  ioProfile: IOProfile
  networkProfile: NetworkProfile
  renderProfile?: RenderProfile
  recommendations: PerformanceRecommendation[]
  score: PerformanceScore
}

export interface PerformanceMetrics {
  avgResponseTime: number
  p50ResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  throughput: number
  errorRate: number
  availability: number
}

export interface PerformanceHotspot {
  id: string
  type: 'function' | 'module' | 'api' | 'query' | 'render'
  name: string
  location: CodeLocation
  executionTime: number
  callCount: number
  totalTime: number
  percentage: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  suggestions: string[]
}

export interface CodeLocation {
  file: string
  line?: number
  column?: number
  function?: string
}

export interface MemoryProfile {
  heapUsed: number
  heapTotal: number
  external: number
  arrayBuffers: number
  rss: number
  peak: number
  growthRate: number
  leakSuspects: MemoryLeakSuspect[]
  allocationTimeline: AllocationPoint[]
}

export interface MemoryLeakSuspect {
  id: string
  type: string
  name: string
  retainedSize: number
  retainedCount: number
  growthRate: number
  likelihood: number
  stackTrace?: string[]
}

export interface AllocationPoint {
  timestamp: number
  size: number
  type: string
  location?: CodeLocation
}

export interface CPUProfile {
  usage: number
  userTime: number
  systemTime: number
  idleTime: number
  cores: number
  loadAverage: number[]
  intensiveOperations: CPUIntensiveOperation[]
}

export interface CPUIntensiveOperation {
  id: string
  name: string
  location: CodeLocation
  cpuTime: number
  percentage: number
  type: 'computation' | 'parsing' | 'encryption' | 'compression' | 'other'
}

export interface IOProfile {
  readOps: number
  writeOps: number
  readBytes: number
  writeBytes: number
  avgReadTime: number
  avgWriteTime: number
  slowFiles: SlowFileOperation[]
  diskUsage: number
}

export interface SlowFileOperation {
  path: string
  operation: 'read' | 'write' | 'stat' | 'readdir'
  duration: number
  bytes: number
  timestamp: string
}

export interface NetworkProfile {
  requests: NetworkRequest[]
  totalRequests: number
  failedRequests: number
  avgLatency: number
  totalBytes: number
  slowEndpoints: SlowEndpoint[]
}

export interface NetworkRequest {
  url: string
  method: string
  duration: number
  statusCode: number
  requestSize: number
  responseSize: number
  timestamp: string
}

export interface SlowEndpoint {
  url: string
  method: string
  avgDuration: number
  maxDuration: number
  callCount: number
  errorRate: number
}

export interface RenderProfile {
  fps: number
  avgFrameTime: number
  slowFrames: number
  layoutShifts: number
  longTasks: LongTask[]
  renderBlocking: RenderBlockingResource[]
}

export interface LongTask {
  name: string
  duration: number
  startTime: number
  attribution: string[]
}

export interface RenderBlockingResource {
  url: string
  type: 'script' | 'style' | 'font'
  delay: number
}

export interface PerformanceRecommendation {
  id: string
  category: 'speed' | 'memory' | 'cpu' | 'io' | 'network' | 'render'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  impact: string
  effort: 'trivial' | 'easy' | 'moderate' | 'hard'
  location?: CodeLocation
  beforeCode?: string
  afterCode?: string
  estimatedImprovement: string
}

export interface PerformanceScore {
  overall: number
  speed: number
  memory: number
  cpu: number
  io: number
  network: number
  render?: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
}

export interface ProfilerConfig {
  samplingInterval: number
  profileDuration: number
  enableMemoryProfiling: boolean
  enableCPUProfiling: boolean
  enableIOProfiling: boolean
  enableNetworkProfiling: boolean
  enableRenderProfiling: boolean
  thresholds: PerformanceThresholds
}

export interface PerformanceThresholds {
  slowFunctionMs: number
  criticalFunctionMs: number
  highMemoryMB: number
  criticalMemoryMB: number
  highCpuPercent: number
  criticalCpuPercent: number
  slowIOMs: number
  slowNetworkMs: number
}

export interface ProfilingSession {
  id: string
  startTime: string
  endTime?: string
  status: 'running' | 'completed' | 'failed'
  target: ProfilingTarget
  profiles: PerformanceProfile[]
}

export interface ProfilingTarget {
  type: 'application' | 'api' | 'function' | 'module'
  path: string
  port?: number
  command?: string
}

// ============================================
// Performance Profiler Class
// ============================================

export class PerformanceProfiler extends EventEmitter {
  private config: ProfilerConfig
  private activeSessions: Map<string, ProfilingSession> = new Map()
  private profileHistory: PerformanceProfile[] = []
  private samplingInterval: NodeJS.Timeout | null = null
  private targetProcess: ChildProcess | null = null

  private readonly DEFAULT_THRESHOLDS: PerformanceThresholds = {
    slowFunctionMs: 100,
    criticalFunctionMs: 500,
    highMemoryMB: 100,
    criticalMemoryMB: 500,
    highCpuPercent: 70,
    criticalCpuPercent: 90,
    slowIOMs: 50,
    slowNetworkMs: 200
  }

  private readonly DEFAULT_CONFIG: ProfilerConfig = {
    samplingInterval: 100,
    profileDuration: 30000,
    enableMemoryProfiling: true,
    enableCPUProfiling: true,
    enableIOProfiling: true,
    enableNetworkProfiling: true,
    enableRenderProfiling: false,
    thresholds: this.DEFAULT_THRESHOLDS
  }

  constructor(config?: Partial<ProfilerConfig>) {
    super()
    this.config = { ...this.DEFAULT_CONFIG, ...config }
    if (config?.thresholds) {
      this.config.thresholds = { ...this.DEFAULT_THRESHOLDS, ...config.thresholds }
    }
  }

  /**
   * Start profiling a target
   */
  async startProfiling(target: ProfilingTarget): Promise<ProfilingSession> {
    const sessionId = `session_${Date.now().toString(36)}`
    
    const session: ProfilingSession = {
      id: sessionId,
      startTime: new Date().toISOString(),
      status: 'running',
      target,
      profiles: []
    }

    this.activeSessions.set(sessionId, session)
    this.emit('session:started', { sessionId, target })

    // Start sampling
    this.startSampling(sessionId)

    // If profiling an application, start monitoring its process
    if (target.type === 'application' && target.command) {
      await this.startApplicationMonitoring(sessionId, target)
    }

    // Auto-stop after duration
    setTimeout(() => {
      this.stopProfiling(sessionId)
    }, this.config.profileDuration)

    return session
  }

  /**
   * Stop profiling and generate report
   */
  async stopProfiling(sessionId: string): Promise<PerformanceProfile | null> {
    const session = this.activeSessions.get(sessionId)
    if (!session) return null

    session.status = 'completed'
    session.endTime = new Date().toISOString()

    // Stop sampling
    if (this.samplingInterval) {
      clearInterval(this.samplingInterval)
      this.samplingInterval = null
    }

    // Generate final profile
    const profile = await this.generateProfile(session)
    session.profiles.push(profile)
    this.profileHistory.push(profile)

    this.emit('session:completed', { sessionId, profile })
    this.activeSessions.delete(sessionId)

    return profile
  }

  /**
   * Profile a specific function
   */
  async profileFunction(
    fn: () => Promise<any>,
    name: string,
    location?: CodeLocation
  ): Promise<FunctionProfileResult> {
    const startTime = performance.now()
    const startMemory = process.memoryUsage()

    try {
      const result = await fn()
      const endTime = performance.now()
      const endMemory = process.memoryUsage()

      const executionTime = endTime - startTime
      const memoryDelta = endMemory.heapUsed - startMemory.heapUsed

      const profileResult: FunctionProfileResult = {
        name,
        location,
        executionTime,
        memoryUsed: memoryDelta,
        success: true,
        result,
        isSlow: executionTime > this.config.thresholds.slowFunctionMs,
        isCritical: executionTime > this.config.thresholds.criticalFunctionMs
      }

      this.emit('function:profiled', profileResult)
      return profileResult
    } catch (error: any) {
      const endTime = performance.now()

      return {
        name,
        location,
        executionTime: endTime - startTime,
        memoryUsed: 0,
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Detect performance hotspots
   */
  async detectHotspots(profile: PerformanceProfile): Promise<PerformanceHotspot[]> {
    const hotspots: PerformanceHotspot[] = []

    // CPU hotspots
    for (const op of profile.cpuProfile.intensiveOperations) {
      if (op.percentage > 5) {
        hotspots.push({
          id: `hotspot_${hotspots.length}`,
          type: 'function',
          name: op.name,
          location: op.location,
          executionTime: op.cpuTime,
          callCount: 1,
          totalTime: op.cpuTime,
          percentage: op.percentage,
          severity: this.getSeverity(op.percentage, 'cpu'),
          suggestions: this.generateCPUHotspotSuggestions(op)
        })
      }
    }

    // I/O hotspots
    for (const slowFile of profile.ioProfile.slowFiles) {
      if (slowFile.duration > this.config.thresholds.slowIOMs) {
        hotspots.push({
          id: `hotspot_${hotspots.length}`,
          type: 'module',
          name: slowFile.path,
          location: { file: slowFile.path },
          executionTime: slowFile.duration,
          callCount: 1,
          totalTime: slowFile.duration,
          percentage: (slowFile.duration / profile.duration) * 100,
          severity: this.getSeverity(slowFile.duration, 'io'),
          suggestions: this.generateIOHotspotSuggestions(slowFile)
        })
      }
    }

    // Network hotspots
    for (const endpoint of profile.networkProfile.slowEndpoints) {
      if (endpoint.avgDuration > this.config.thresholds.slowNetworkMs) {
        hotspots.push({
          id: `hotspot_${hotspots.length}`,
          type: 'api',
          name: `${endpoint.method} ${endpoint.url}`,
          location: { file: 'network' },
          executionTime: endpoint.avgDuration,
          callCount: endpoint.callCount,
          totalTime: endpoint.avgDuration * endpoint.callCount,
          percentage: (endpoint.avgDuration * endpoint.callCount / profile.duration) * 100,
          severity: this.getSeverity(endpoint.avgDuration, 'network'),
          suggestions: this.generateNetworkHotspotSuggestions(endpoint)
        })
      }
    }

    // Sort by severity and percentage
    hotspots.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity]
      }
      return b.percentage - a.percentage
    })

    return hotspots
  }

  /**
   * Detect memory leaks
   */
  async detectMemoryLeaks(profile: PerformanceProfile): Promise<MemoryLeakSuspect[]> {
    const suspects: MemoryLeakSuspect[] = []

    // Check for continuous memory growth
    if (profile.memoryProfile.growthRate > 0.1) { // More than 10% growth
      // Analyze allocation timeline
      const allocationsByType = new Map<string, { count: number; size: number; growth: number }>()

      for (const alloc of profile.memoryProfile.allocationTimeline) {
        const existing = allocationsByType.get(alloc.type) || { count: 0, size: 0, growth: 0 }
        existing.count++
        existing.size += alloc.size
        existing.growth = existing.size / (existing.size - alloc.size || 1)
        allocationsByType.set(alloc.type, existing)
      }

      // Find types with high growth
      for (const [type, data] of allocationsByType) {
        if (data.growth > 1.5) { // 50% growth
          suspects.push({
            id: `leak_${suspects.length}`,
            type,
            name: type,
            retainedSize: data.size,
            retainedCount: data.count,
            growthRate: data.growth,
            likelihood: Math.min(1, data.growth / 3)
          })
        }
      }
    }

    // Sort by likelihood
    suspects.sort((a, b) => b.likelihood - a.likelihood)

    return suspects
  }

  /**
   * Generate performance recommendations
   */
  async generateRecommendations(profile: PerformanceProfile): Promise<PerformanceRecommendation[]> {
    const recommendations: PerformanceRecommendation[] = []

    // Speed recommendations
    if (profile.metrics.avgResponseTime > 200) {
      recommendations.push({
        id: `rec_${recommendations.length}`,
        category: 'speed',
        priority: 'high',
        title: 'Optimize average response time',
        description: `Average response time of ${profile.metrics.avgResponseTime.toFixed(0)}ms exceeds recommended 200ms threshold`,
        impact: 'Improve user experience and SEO ranking',
        effort: 'moderate',
        estimatedImprovement: '30-50% faster response times'
      })
    }

    // Memory recommendations
    if (profile.memoryProfile.leakSuspects.length > 0) {
      for (const suspect of profile.memoryProfile.leakSuspects.slice(0, 3)) {
        recommendations.push({
          id: `rec_${recommendations.length}`,
          category: 'memory',
          priority: suspect.likelihood > 0.7 ? 'critical' : 'high',
          title: `Fix potential memory leak in ${suspect.type}`,
          description: `Detected ${suspect.retainedCount} instances retaining ${(suspect.retainedSize / 1024 / 1024).toFixed(2)}MB with ${(suspect.growthRate * 100).toFixed(0)}% growth rate`,
          impact: 'Prevent memory exhaustion and crashes',
          effort: 'moderate',
          estimatedImprovement: 'Stable memory usage'
        })
      }
    }

    // CPU recommendations
    for (const op of profile.cpuProfile.intensiveOperations.filter(o => o.percentage > 10)) {
      recommendations.push({
        id: `rec_${recommendations.length}`,
        category: 'cpu',
        priority: op.percentage > 30 ? 'critical' : 'high',
        title: `Optimize CPU-intensive operation: ${op.name}`,
        description: `Operation uses ${op.percentage.toFixed(1)}% of CPU time`,
        impact: 'Reduce CPU load and improve responsiveness',
        effort: 'moderate',
        location: op.location,
        estimatedImprovement: `${(op.percentage * 0.5).toFixed(0)}% CPU reduction`
      })
    }

    // I/O recommendations
    if (profile.ioProfile.slowFiles.length > 0) {
      recommendations.push({
        id: `rec_${recommendations.length}`,
        category: 'io',
        priority: 'medium',
        title: 'Optimize slow file operations',
        description: `Found ${profile.ioProfile.slowFiles.length} slow file operations`,
        impact: 'Faster file I/O and reduced latency',
        effort: 'easy',
        estimatedImprovement: '50-70% I/O speedup'
      })
    }

    // Network recommendations
    if (profile.networkProfile.slowEndpoints.length > 0) {
      recommendations.push({
        id: `rec_${recommendations.length}`,
        category: 'network',
        priority: 'high',
        title: 'Optimize slow API endpoints',
        description: `${profile.networkProfile.slowEndpoints.length} endpoints exceed ${this.config.thresholds.slowNetworkMs}ms threshold`,
        impact: 'Faster API responses and better UX',
        effort: 'moderate',
        estimatedImprovement: '40-60% faster API calls'
      })
    }

    // Render recommendations (if applicable)
    if (profile.renderProfile && profile.renderProfile.fps < 55) {
      recommendations.push({
        id: `rec_${recommendations.length}`,
        category: 'render',
        priority: 'high',
        title: 'Improve render performance',
        description: `Current FPS is ${profile.renderProfile.fps.toFixed(1)}, target is 60 FPS`,
        impact: 'Smoother animations and better UX',
        effort: 'moderate',
        estimatedImprovement: 'Achieve 60 FPS'
      })
    }

    return recommendations
  }

  /**
   * Calculate performance score
   */
  calculateScore(profile: PerformanceProfile): PerformanceScore {
    // Speed score (0-100)
    let speedScore = 100
    if (profile.metrics.avgResponseTime > 100) {
      speedScore -= Math.min(50, (profile.metrics.avgResponseTime - 100) / 10)
    }
    if (profile.metrics.p95ResponseTime > 500) {
      speedScore -= Math.min(30, (profile.metrics.p95ResponseTime - 500) / 50)
    }

    // Memory score (0-100)
    let memoryScore = 100
    const memoryUsageMB = profile.memoryProfile.heapUsed / 1024 / 1024
    if (memoryUsageMB > this.config.thresholds.highMemoryMB) {
      memoryScore -= Math.min(40, (memoryUsageMB - this.config.thresholds.highMemoryMB) / 10)
    }
    if (profile.memoryProfile.leakSuspects.length > 0) {
      memoryScore -= Math.min(30, profile.memoryProfile.leakSuspects.length * 10)
    }

    // CPU score (0-100)
    let cpuScore = 100
    if (profile.cpuProfile.usage > this.config.thresholds.highCpuPercent) {
      cpuScore -= Math.min(50, (profile.cpuProfile.usage - this.config.thresholds.highCpuPercent) * 2)
    }

    // I/O score (0-100)
    let ioScore = 100
    if (profile.ioProfile.slowFiles.length > 0) {
      ioScore -= Math.min(30, profile.ioProfile.slowFiles.length * 5)
    }
    if (profile.ioProfile.avgReadTime > this.config.thresholds.slowIOMs) {
      ioScore -= Math.min(20, (profile.ioProfile.avgReadTime - this.config.thresholds.slowIOMs) / 10)
    }

    // Network score (0-100)
    let networkScore = 100
    if (profile.networkProfile.avgLatency > this.config.thresholds.slowNetworkMs) {
      networkScore -= Math.min(40, (profile.networkProfile.avgLatency - this.config.thresholds.slowNetworkMs) / 20)
    }
    if (profile.networkProfile.errorRate > 0.01) {
      networkScore -= Math.min(30, profile.networkProfile.errorRate * 1000)
    }

    // Overall score
    const overall = (speedScore + memoryScore + cpuScore + ioScore + networkScore) / 5

    // Determine grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F'
    if (overall >= 90) grade = 'A'
    else if (overall >= 80) grade = 'B'
    else if (overall >= 70) grade = 'C'
    else if (overall >= 60) grade = 'D'
    else grade = 'F'

    return {
      overall,
      speed: speedScore,
      memory: memoryScore,
      cpu: cpuScore,
      io: ioScore,
      network: networkScore,
      grade
    }
  }

  /**
   * Quick performance check
   */
  async quickCheck(projectPath: string): Promise<QuickPerformanceCheck> {
    const issues: PerformanceIssue[] = []

    // Check package.json for common performance issues
    try {
      const packageJsonPath = path.join(projectPath, 'package.json')
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))

      // Check for heavy dependencies
      const heavyDeps = ['lodash', 'moment', 'rxjs', '@angular/core', 'electron']
      for (const dep of heavyDeps) {
        if (packageJson.dependencies?.[dep]) {
          issues.push({
            severity: 'warning',
            category: 'bundle',
            message: `Heavy dependency detected: ${dep}`,
            suggestion: `Consider using lighter alternatives or tree-shaking`
          })
        }
      }

      // Check for missing performance optimizations
      if (!packageJson.dependencies?.next && packageJson.scripts?.build?.includes('next')) {
        // Next.js project - check for optimizations
      }
    } catch {
      // Package.json not found
    }

    // Check for large files
    try {
      const files = await this.findLargeFiles(projectPath)
      for (const file of files) {
        issues.push({
          severity: 'warning',
          category: 'io',
          message: `Large file detected: ${file.path} (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
          suggestion: 'Consider optimizing or chunking this file'
        })
      }
    } catch {
      // Ignore file scan errors
    }

    return {
      timestamp: new Date().toISOString(),
      projectPath,
      issues,
      score: Math.max(0, 100 - issues.length * 10)
    }
  }

  /**
   * Generate performance report
   */
  async generateReport(profile: PerformanceProfile): Promise<string> {
    const lines: string[] = [
      `# Performance Profile Report`,
      ``,
      `**Generated:** ${profile.timestamp}`,
      `**Duration:** ${profile.duration}ms`,
      `**Overall Score:** ${profile.score.overall.toFixed(1)}/100 (Grade: ${profile.score.grade})`,
      ``,
      `## 📊 Metrics Summary`,
      ``,
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Avg Response Time | ${profile.metrics.avgResponseTime.toFixed(2)}ms |`,
      `| P95 Response Time | ${profile.metrics.p95ResponseTime.toFixed(2)}ms |`,
      `| Throughput | ${profile.metrics.throughput.toFixed(2)} req/s |`,
      `| Error Rate | ${(profile.metrics.errorRate * 100).toFixed(2)}% |`,
      ``,
      `## 🔥 Performance Hotspots`,
      ``
    ]

    for (const hotspot of profile.hotspots.slice(0, 10)) {
      lines.push(`### ${hotspot.name}`)
      lines.push(`- **Type:** ${hotspot.type}`)
      lines.push(`- **Severity:** ${hotspot.severity}`)
      lines.push(`- **Time:** ${hotspot.executionTime.toFixed(2)}ms (${hotspot.percentage.toFixed(1)}%)`)
      if (hotspot.suggestions.length > 0) {
        lines.push(`- **Suggestions:**`)
        for (const suggestion of hotspot.suggestions) {
          lines.push(`  - ${suggestion}`)
        }
      }
      lines.push(``)
    }

    lines.push(`## 💾 Memory Profile`, ``)
    lines.push(`- **Heap Used:** ${(profile.memoryProfile.heapUsed / 1024 / 1024).toFixed(2)}MB`)
    lines.push(`- **Peak:** ${(profile.memoryProfile.peak / 1024 / 1024).toFixed(2)}MB`)
    lines.push(`- **Growth Rate:** ${(profile.memoryProfile.growthRate * 100).toFixed(1)}%`)
    
    if (profile.memoryProfile.leakSuspects.length > 0) {
      lines.push(`- **⚠️ Potential Leaks:** ${profile.memoryProfile.leakSuspects.length}`)
    }
    lines.push(``)

    lines.push(`## 📋 Recommendations`, ``)
    for (const rec of profile.recommendations) {
      const priorityEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }
      lines.push(`${priorityEmoji[rec.priority]} **${rec.title}**`)
      lines.push(`  - ${rec.description}`)
      lines.push(`  - Impact: ${rec.impact}`)
      lines.push(`  - Effort: ${rec.effort}`)
      lines.push(``)
    }

    return lines.join('\n')
  }

  // ============================================
  // Private Methods
  // ============================================

  private startSampling(sessionId: string): void {
    this.samplingInterval = setInterval(() => {
      this.collectSample(sessionId)
    }, this.config.samplingInterval)
  }

  private collectSample(sessionId: string): void {
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    // Collect memory sample
    const memoryUsage = process.memoryUsage()
    
    // Collect CPU sample
    const cpuUsage = process.cpuUsage()
    
    this.emit('sample:collected', {
      sessionId,
      timestamp: Date.now(),
      memory: memoryUsage,
      cpu: cpuUsage
    })
  }

  private async startApplicationMonitoring(sessionId: string, target: ProfilingTarget): Promise<void> {
    if (!target.command) return

    this.targetProcess = spawn(target.command, [], {
      cwd: target.path,
      shell: true,
      env: { ...process.env, NODE_ENV: 'development' }
    })

    this.targetProcess.stdout?.on('data', (data) => {
      this.emit('process:stdout', { sessionId, data: data.toString() })
    })

    this.targetProcess.stderr?.on('data', (data) => {
      this.emit('process:stderr', { sessionId, data: data.toString() })
    })

    this.targetProcess.on('close', (code) => {
      this.emit('process:closed', { sessionId, code })
    })
  }

  private async generateProfile(session: ProfilingSession): Promise<PerformanceProfile> {
    const duration = session.endTime 
      ? new Date(session.endTime).getTime() - new Date(session.startTime).getTime()
      : this.config.profileDuration

    // Generate memory profile
    const memoryUsage = process.memoryUsage()
    const memoryProfile: MemoryProfile = {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers,
      rss: memoryUsage.rss,
      peak: memoryUsage.heapUsed * 1.2, // Estimate
      growthRate: 0,
      leakSuspects: [],
      allocationTimeline: []
    }

    // Generate CPU profile
    const cpuProfile: CPUProfile = {
      usage: 0,
      userTime: 0,
      systemTime: 0,
      idleTime: 0,
      cores: 1,
      loadAverage: [0, 0, 0],
      intensiveOperations: []
    }

    // Generate I/O profile
    const ioProfile: IOProfile = {
      readOps: 0,
      writeOps: 0,
      readBytes: 0,
      writeBytes: 0,
      avgReadTime: 0,
      avgWriteTime: 0,
      slowFiles: [],
      diskUsage: 0
    }

    // Generate network profile
    const networkProfile: NetworkProfile = {
      requests: [],
      totalRequests: 0,
      failedRequests: 0,
      avgLatency: 0,
      totalBytes: 0,
      slowEndpoints: []
    }

    // Create initial profile
    const profile: PerformanceProfile = {
      id: `profile_${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      duration,
      metrics: {
        avgResponseTime: 0,
        p50ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        availability: 100
      },
      hotspots: [],
      memoryProfile,
      cpuProfile,
      ioProfile,
      networkProfile,
      recommendations: [],
      score: {
        overall: 100,
        speed: 100,
        memory: 100,
        cpu: 100,
        io: 100,
        network: 100,
        grade: 'A'
      }
    }

    // Detect hotspots
    profile.hotspots = await this.detectHotspots(profile)

    // Detect memory leaks
    profile.memoryProfile.leakSuspects = await this.detectMemoryLeaks(profile)

    // Generate recommendations
    profile.recommendations = await this.generateRecommendations(profile)

    // Calculate score
    profile.score = this.calculateScore(profile)

    return profile
  }

  private getSeverity(value: number, type: 'cpu' | 'io' | 'network' | 'memory'): 'low' | 'medium' | 'high' | 'critical' {
    const thresholds = {
      cpu: { low: 5, medium: 15, high: 30, critical: 50 },
      io: { low: 50, medium: 100, high: 200, critical: 500 },
      network: { low: 200, medium: 500, high: 1000, critical: 2000 },
      memory: { low: 50, medium: 100, high: 200, critical: 500 }
    }

    const t = thresholds[type]
    if (value >= t.critical) return 'critical'
    if (value >= t.high) return 'high'
    if (value >= t.medium) return 'medium'
    return 'low'
  }

  private generateCPUHotspotSuggestions(op: CPUIntensiveOperation): string[] {
    const suggestions: string[] = []

    switch (op.type) {
      case 'computation':
        suggestions.push('Consider memoization or caching results')
        suggestions.push('Move computation to a Web Worker')
        suggestions.push('Use more efficient algorithms')
        break
      case 'parsing':
        suggestions.push('Cache parsed results')
        suggestions.push('Use streaming parsers for large data')
        suggestions.push('Consider lazy parsing')
        break
      case 'encryption':
        suggestions.push('Use hardware acceleration if available')
        suggestions.push('Cache encrypted/decrypted data')
        break
      case 'compression':
        suggestions.push('Adjust compression level for speed vs size')
        suggestions.push('Consider streaming compression')
        break
      default:
        suggestions.push('Profile to identify optimization opportunities')
    }

    return suggestions
  }

  private generateIOHotspotSuggestions(slowFile: SlowFileOperation): string[] {
    return [
      'Use buffering for large file operations',
      'Consider async/await for non-blocking I/O',
      'Implement file caching for frequently accessed files',
      'Use streams instead of loading entire files',
      'Check disk health and I/O scheduler settings'
    ]
  }

  private generateNetworkHotspotSuggestions(endpoint: SlowEndpoint): string[] {
    return [
      'Implement request caching',
      'Use connection pooling',
      'Enable HTTP/2 for multiplexing',
      'Add request timeout handling',
      'Consider CDN for static assets',
      'Implement request batching for multiple calls'
    ]
  }

  private async findLargeFiles(projectPath: string, maxSizeMB: number = 5): Promise<{ path: string; size: number }[]> {
    const largeFiles: { path: string; size: number }[] = []
    const maxBytes = maxSizeMB * 1024 * 1024

    const scanDir = async (dir: string) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
              await scanDir(fullPath)
            }
          } else if (entry.isFile()) {
            try {
              const stats = await fs.stat(fullPath)
              if (stats.size > maxBytes) {
                largeFiles.push({ path: fullPath, size: stats.size })
              }
            } catch {
              // Ignore stat errors
            }
          }
        }
      } catch {
        // Ignore readdir errors
      }
    }

    await scanDir(projectPath)
    return largeFiles.sort((a, b) => b.size - a.size)
  }

  /**
   * Get profiler statistics
   */
  getStats(): {
    activeSessions: number
    totalProfiles: number
    config: ProfilerConfig
  } {
    return {
      activeSessions: this.activeSessions.size,
      totalProfiles: this.profileHistory.length,
      config: this.config
    }
  }

  /**
   * Get profile history
   */
  getHistory(limit: number = 10): PerformanceProfile[] {
    return this.profileHistory.slice(-limit)
  }
}

// ============================================
// Supporting Types
// ============================================

export interface FunctionProfileResult {
  name: string
  location?: CodeLocation
  executionTime: number
  memoryUsed: number
  success: boolean
  result?: any
  error?: string
  isSlow: boolean
  isCritical: boolean
}

export interface QuickPerformanceCheck {
  timestamp: string
  projectPath: string
  issues: PerformanceIssue[]
  score: number
}

export interface PerformanceIssue {
  severity: 'error' | 'warning' | 'info'
  category: 'bundle' | 'memory' | 'cpu' | 'io' | 'network' | 'render'
  message: string
  suggestion: string
}

// ============================================
// Singleton Instance
// ============================================

let profilerInstance: PerformanceProfiler | null = null

export function getPerformanceProfiler(config?: Partial<ProfilerConfig>): PerformanceProfiler {
  if (!profilerInstance) {
    profilerInstance = new PerformanceProfiler(config)
  }
  return profilerInstance
}

export async function profileApplication(
  target: ProfilingTarget,
  duration?: number
): Promise<PerformanceProfile> {
  const profiler = getPerformanceProfiler({ 
    profileDuration: duration || 30000 
  })
  const session = await profiler.startProfiling(target)
  return new Promise((resolve) => {
    profiler.on('session:completed', ({ profile }) => {
      resolve(profile)
    })
  })
}

export async function profileFunction<T>(
  fn: () => Promise<T>,
  name: string
): Promise<FunctionProfileResult> {
  const profiler = getPerformanceProfiler()
  return profiler.profileFunction(fn, name)
}

export default PerformanceProfiler
