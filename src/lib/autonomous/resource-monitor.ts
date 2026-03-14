/**
 * Resource Monitor
 * 
 * Comprehensive system resource monitoring:
 * - CPU usage tracking and spike detection
 * - Memory consumption and leak detection
 * - Disk I/O monitoring
 * - Network activity tracking
 * - Resource exhaustion alerts
 * - Performance impact analysis
 * - Resource prediction and forecasting
 */

import { EventEmitter } from 'events'
import os from 'os'
import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// ============================================
// Types
// ============================================

export interface ResourceSnapshot {
  timestamp: string
  cpu: CPUInfo
  memory: MemoryInfo
  disk: DiskInfo
  network: NetworkInfo
  processes: ProcessInfo[]
  alerts: ResourceAlert[]
}

export interface CPUInfo {
  usage: number
  user: number
  system: number
  idle: number
  cores: number
  model: string
  speed: number
  loadAverage: number[]
  temperature?: number
  perCore?: CoreUsage[]
}

export interface CoreUsage {
  core: number
  usage: number
  idle: number
}

export interface MemoryInfo {
  total: number
  used: number
  free: number
  available: number
  cached: number
  buffers: number
  shared: number
  swapTotal: number
  swapUsed: number
  swapFree: number
  usagePercent: number
  heap?: HeapMemoryInfo
}

export interface HeapMemoryInfo {
  totalHeapSize: number
  totalHeapSizeExecutable: number
  totalPhysicalSize: number
  usedHeapSize: number
  heapSizeLimit: number
  mallocatedMemory: number
  peakMallocatedMemory: number
  externalMemory: number
}

export interface DiskInfo {
  total: number
  used: number
  free: number
  usagePercent: number
  reads: number
  writes: number
  readBytes: number
  writeBytes: number
  readTime: number
  writeTime: number
  mounts: DiskMount[]
  ioWait: number
}

export interface DiskMount {
  mount: string
  filesystem: string
  total: number
  used: number
  free: number
  usagePercent: number
  type: string
}

export interface NetworkInfo {
  interfaces: NetworkInterface[]
  connections: number
  bytesReceived: number
  bytesSent: number
  packetsIn: number
  packetsOut: number
  errors: number
  drops: number
  latency: NetworkLatency
  bandwidth: BandwidthUsage
}

export interface NetworkInterface {
  name: string
  address: string
  netmask: string
  family: string
  mac: string
  internal: boolean
  bytesReceived: number
  bytesSent: number
}

export interface NetworkLatency {
  local: number
  dns: number
  internet: number
  targets: LatencyTarget[]
}

export interface LatencyTarget {
  host: string
  latency: number
  status: 'reachable' | 'unreachable' | 'timeout'
}

export interface BandwidthUsage {
  download: number
  upload: number
  connections: number
  activeConnections: number
}

export interface ProcessInfo {
  pid: number
  name: string
  cpu: number
  memory: number
  memoryPercent: number
  state: string
  threads: number
  openFiles?: number
  command?: string
  user?: string
  startTime?: string
}

export interface ResourceAlert {
  id: string
  type: AlertType
  severity: AlertSeverity
  message: string
  value: number
  threshold: number
  timestamp: string
  recommendation: string
}

export type AlertType = 
  | 'cpu_high'
  | 'cpu_spike'
  | 'memory_high'
  | 'memory_leak'
  | 'disk_full'
  | 'disk_io_high'
  | 'network_error'
  | 'network_latency'
  | 'process_crash'
  | 'process_spawn'
  | 'resource_exhaustion'

export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency'

export interface ResourceThresholds {
  cpuHigh: number
  cpuCritical: number
  memoryHigh: number
  memoryCritical: number
  diskHigh: number
  diskCritical: number
  networkLatencyHigh: number
  networkLatencyCritical: number
  processCountHigh: number
}

export interface ResourceTrend {
  metric: string
  values: TrendPoint[]
  trend: 'increasing' | 'decreasing' | 'stable'
  changeRate: number
  prediction?: number
}

export interface TrendPoint {
  timestamp: string
  value: number
}

export interface ResourceReport {
  timestamp: string
  duration: number
  summary: ResourceSummary
  cpu: CPUReport
  memory: MemoryReport
  disk: DiskReport
  network: NetworkReport
  processes: ProcessReport
  alerts: ResourceAlert[]
  recommendations: string[]
}

export interface ResourceSummary {
  healthScore: number
  status: 'healthy' | 'degraded' | 'critical'
  cpuStatus: string
  memoryStatus: string
  diskStatus: string
  networkStatus: string
  topIssues: string[]
}

export interface CPUReport {
  avgUsage: number
  maxUsage: number
  minUsage: number
  spikes: number
  avgLoad: number[]
  trend: ResourceTrend
}

export interface MemoryReport {
  avgUsed: number
  maxUsed: number
  minUsed: number
  avgPercent: number
  peakPercent: number
  leakDetected: boolean
  trend: ResourceTrend
}

export interface DiskReport {
  avgUsage: number
  totalReads: number
  totalWrites: number
  totalReadBytes: number
  totalWriteBytes: number
  avgIOWait: number
  trend: ResourceTrend
}

export interface NetworkReport {
  totalBytesReceived: number
  totalBytesSent: number
  avgLatency: number
  errors: number
  drops: number
  peakConnections: number
  trend: ResourceTrend
}

export interface ProcessReport {
  totalProcesses: number
  avgCpuUsage: number
  avgMemoryUsage: number
  topCpuProcesses: ProcessInfo[]
  topMemoryProcesses: ProcessInfo[]
  crashedProcesses: string[]
}

export interface MonitorConfig {
  interval: number
  historySize: number
  thresholds: ResourceThresholds
  enableAlerts: boolean
  enableForecasting: boolean
  monitoredProcesses: string[]
}

// ============================================
// Resource Monitor Class
// ============================================

export class ResourceMonitor extends EventEmitter {
  private config: MonitorConfig
  private history: ResourceSnapshot[] = []
  private monitoringInterval: NodeJS.Timeout | null = null
  private isMonitoring: boolean = false
  private lastNetworkStats: Map<string, { rx: number; tx: number }> = new Map()
  private lastDiskStats: { reads: number; writes: number } | null = null
  private lastCpuStats: { user: number; nice: number; system: number; idle: number; irq: number } | null = null

  private readonly DEFAULT_THRESHOLDS: ResourceThresholds = {
    cpuHigh: 70,
    cpuCritical: 90,
    memoryHigh: 80,
    memoryCritical: 95,
    diskHigh: 80,
    diskCritical: 95,
    networkLatencyHigh: 100,
    networkLatencyCritical: 500,
    processCountHigh: 500
  }

  private readonly DEFAULT_CONFIG: MonitorConfig = {
    interval: 5000,
    historySize: 1000,
    thresholds: this.DEFAULT_THRESHOLDS,
    enableAlerts: true,
    enableForecasting: true,
    monitoredProcesses: []
  }

  constructor(config?: Partial<MonitorConfig>) {
    super()
    this.config = { ...this.DEFAULT_CONFIG, ...config }
    if (config?.thresholds) {
      this.config.thresholds = { ...this.DEFAULT_THRESHOLDS, ...config.thresholds }
    }
  }

  /**
   * Start resource monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.emit('monitoring:started')

    this.monitoringInterval = setInterval(() => {
      this.collectSnapshot()
    }, this.config.interval)

    // Collect first snapshot immediately
    this.collectSnapshot()
  }

  /**
   * Stop resource monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    this.emit('monitoring:stopped')
  }

  /**
   * Get current resource snapshot
   */
  async getCurrentSnapshot(): Promise<ResourceSnapshot> {
    return this.collectSnapshot(true)
  }

  /**
   * Get resource history
   */
  getHistory(limit: number = 100): ResourceSnapshot[] {
    return this.history.slice(-limit)
  }

  /**
   * Get resource trends
   */
  getTrends(metric: string, duration: number = 3600000): ResourceTrend {
    const now = Date.now()
    const relevantHistory = this.history.filter(
      s => now - new Date(s.timestamp).getTime() <= duration
    )

    const values: TrendPoint[] = relevantHistory.map(s => {
      let value = 0
      switch (metric) {
        case 'cpu': value = s.cpu.usage; break
        case 'memory': value = s.memory.usagePercent; break
        case 'disk': value = s.disk.usagePercent; break
        case 'network': value = s.network.bytesReceived + s.network.bytesSent; break
      }
      return { timestamp: s.timestamp, value }
    })

    // Calculate trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    let changeRate = 0

    if (values.length >= 2) {
      const first = values[0].value
      const last = values[values.length - 1].value
      changeRate = first > 0 ? (last - first) / first : 0

      if (changeRate > 0.05) trend = 'increasing'
      else if (changeRate < -0.05) trend = 'decreasing'
    }

    // Simple prediction (linear extrapolation)
    let prediction: number | undefined
    if (values.length >= 3) {
      const recent = values.slice(-5)
      const avgChange = recent.reduce((sum, v, i) => {
        if (i === 0) return 0
        return sum + (v.value - recent[i - 1].value)
      }, 0) / (recent.length - 1)
      prediction = values[values.length - 1].value + avgChange * 10
    }

    return { metric, values, trend, changeRate, prediction }
  }

  /**
   * Generate resource report
   */
  async generateReport(duration: number = 3600000): Promise<ResourceReport> {
    const now = Date.now()
    const relevantHistory = this.history.filter(
      s => now - new Date(s.timestamp).getTime() <= duration
    )

    if (relevantHistory.length === 0) {
      return this.createEmptyReport(duration)
    }

    // CPU Report
    const cpuUsages = relevantHistory.map(s => s.cpu.usage)
    const cpuReport: CPUReport = {
      avgUsage: cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length,
      maxUsage: Math.max(...cpuUsages),
      minUsage: Math.min(...cpuUsages),
      spikes: cpuUsages.filter(u => u > this.config.thresholds.cpuHigh).length,
      avgLoad: relevantHistory[relevantHistory.length - 1].cpu.loadAverage,
      trend: this.getTrends('cpu', duration)
    }

    // Memory Report
    const memUsages = relevantHistory.map(s => s.memory.usagePercent)
    const memoryReport: MemoryReport = {
      avgUsed: relevantHistory.reduce((a, s) => a + s.memory.used, 0) / relevantHistory.length,
      maxUsed: Math.max(...relevantHistory.map(s => s.memory.used)),
      minUsed: Math.min(...relevantHistory.map(s => s.memory.used)),
      avgPercent: memUsages.reduce((a, b) => a + b, 0) / memUsages.length,
      peakPercent: Math.max(...memUsages),
      leakDetected: this.detectMemoryLeak(relevantHistory),
      trend: this.getTrends('memory', duration)
    }

    // Disk Report
    const diskReport: DiskReport = {
      avgUsage: relevantHistory.reduce((a, s) => a + s.disk.usagePercent, 0) / relevantHistory.length,
      totalReads: relevantHistory[relevantHistory.length - 1].disk.reads - relevantHistory[0].disk.reads,
      totalWrites: relevantHistory[relevantHistory.length - 1].disk.writes - relevantHistory[0].disk.writes,
      totalReadBytes: relevantHistory[relevantHistory.length - 1].disk.readBytes - relevantHistory[0].disk.readBytes,
      totalWriteBytes: relevantHistory[relevantHistory.length - 1].disk.writeBytes - relevantHistory[0].disk.writeBytes,
      avgIOWait: relevantHistory.reduce((a, s) => a + s.disk.ioWait, 0) / relevantHistory.length,
      trend: this.getTrends('disk', duration)
    }

    // Network Report
    const networkReport: NetworkReport = {
      totalBytesReceived: relevantHistory[relevantHistory.length - 1].network.bytesReceived - relevantHistory[0].network.bytesReceived,
      totalBytesSent: relevantHistory[relevantHistory.length - 1].network.bytesSent - relevantHistory[0].network.bytesSent,
      avgLatency: relevantHistory.reduce((a, s) => a + s.network.latency.internet, 0) / relevantHistory.length,
      errors: relevantHistory.reduce((a, s) => a + s.network.errors, 0),
      drops: relevantHistory.reduce((a, s) => a + s.network.drops, 0),
      peakConnections: Math.max(...relevantHistory.map(s => s.network.connections)),
      trend: this.getTrends('network', duration)
    }

    // Process Report
    const allProcesses = relevantHistory.flatMap(s => s.processes)
    const processReport: ProcessReport = {
      totalProcesses: relevantHistory[relevantHistory.length - 1].processes.length,
      avgCpuUsage: allProcesses.reduce((a, p) => a + p.cpu, 0) / allProcesses.length,
      avgMemoryUsage: allProcesses.reduce((a, p) => a + p.memory, 0) / allProcesses.length,
      topCpuProcesses: this.getTopProcesses(allProcesses, 'cpu', 5),
      topMemoryProcesses: this.getTopProcesses(allProcesses, 'memory', 5),
      crashedProcesses: []
    }

    // Collect all alerts
    const alerts = relevantHistory.flatMap(s => s.alerts)

    // Generate summary
    const summary = this.generateSummary(cpuReport, memoryReport, diskReport, networkReport, alerts)

    // Generate recommendations
    const recommendations = this.generateRecommendations(cpuReport, memoryReport, diskReport, networkReport, alerts)

    return {
      timestamp: new Date().toISOString(),
      duration,
      summary,
      cpu: cpuReport,
      memory: memoryReport,
      disk: diskReport,
      network: networkReport,
      processes: processReport,
      alerts,
      recommendations
    }
  }

  /**
   * Check resource availability
   */
  async checkAvailability(requirements: ResourceRequirements): Promise<ResourceAvailabilityCheck> {
    const snapshot = await this.getCurrentSnapshot()
    const issues: string[] = []
    let available = true

    // Check CPU
    if (requirements.minCpuCores && snapshot.cpu.cores < requirements.minCpuCores) {
      issues.push(`Insufficient CPU cores: ${snapshot.cpu.cores} < ${requirements.minCpuCores}`)
      available = false
    }
    if (requirements.maxCpuUsage && snapshot.cpu.usage > requirements.maxCpuUsage) {
      issues.push(`CPU usage too high: ${snapshot.cpu.usage}% > ${requirements.maxCpuUsage}%`)
      available = false
    }

    // Check Memory
    if (requirements.minMemoryMB && snapshot.memory.available < requirements.minMemoryMB * 1024 * 1024) {
      issues.push(`Insufficient memory: ${(snapshot.memory.available / 1024 / 1024).toFixed(0)}MB < ${requirements.minMemoryMB}MB`)
      available = false
    }
    if (requirements.maxMemoryUsage && snapshot.memory.usagePercent > requirements.maxMemoryUsage) {
      issues.push(`Memory usage too high: ${snapshot.memory.usagePercent}% > ${requirements.maxMemoryUsage}%`)
      available = false
    }

    // Check Disk
    if (requirements.minDiskGB && snapshot.disk.free < requirements.minDiskGB * 1024 * 1024 * 1024) {
      issues.push(`Insufficient disk space: ${(snapshot.disk.free / 1024 / 1024 / 1024).toFixed(2)}GB < ${requirements.minDiskGB}GB`)
      available = false
    }
    if (requirements.maxDiskUsage && snapshot.disk.usagePercent > requirements.maxDiskUsage) {
      issues.push(`Disk usage too high: ${snapshot.disk.usagePercent}% > ${requirements.maxDiskUsage}%`)
      available = false
    }

    return {
      available,
      issues,
      snapshot,
      requirements
    }
  }

  /**
   * Get top resource consumers
   */
  async getTopConsumers(type: 'cpu' | 'memory' | 'io', limit: number = 10): Promise<ProcessInfo[]> {
    const snapshot = await this.getCurrentSnapshot()
    return this.getTopProcesses(snapshot.processes, type, limit)
  }

  /**
   * Get monitor statistics
   */
  getStats(): {
    isMonitoring: boolean
    historySize: number
    config: MonitorConfig
  } {
    return {
      isMonitoring: this.isMonitoring,
      historySize: this.history.length,
      config: this.config
    }
  }

  // ============================================
  // Private Methods
  // ============================================

  private async collectSnapshot(isManual: boolean = false): Promise<ResourceSnapshot> {
    const timestamp = new Date().toISOString()

    // Collect all metrics in parallel
    const [cpu, memory, disk, network, processes] = await Promise.all([
      this.collectCPUInfo(),
      this.collectMemoryInfo(),
      this.collectDiskInfo(),
      this.collectNetworkInfo(),
      this.collectProcessInfo()
    ])

    // Generate alerts
    const alerts = this.generateAlerts({ timestamp, cpu, memory, disk, network, processes, alerts: [] })

    const snapshot: ResourceSnapshot = {
      timestamp,
      cpu,
      memory,
      disk,
      network,
      processes,
      alerts
    }

    // Store in history
    this.history.push(snapshot)
    if (this.history.length > this.config.historySize) {
      this.history.shift()
    }

    // Emit events
    if (!isManual) {
      this.emit('snapshot:collected', snapshot)
      for (const alert of alerts) {
        this.emit('alert:raised', alert)
      }
    }

    return snapshot
  }

  private async collectCPUInfo(): Promise<CPUInfo> {
    const cpus = os.cpus()
    const loadAvg = os.loadavg()

    // Calculate CPU usage
    const currentStats = this.getCPUStats()
    let usage = 0
    let user = 0
    let system = 0
    let idle = 0

    if (this.lastCpuStats && currentStats) {
      const totalDiff = 
        (currentStats.user - this.lastCpuStats.user) +
        (currentStats.nice - this.lastCpuStats.nice) +
        (currentStats.system - this.lastCpuStats.system) +
        (currentStats.idle - this.lastCpuStats.idle) +
        (currentStats.irq - this.lastCpuStats.irq)

      if (totalDiff > 0) {
        idle = ((currentStats.idle - this.lastCpuStats.idle) / totalDiff) * 100
        user = ((currentStats.user - this.lastCpuStats.user) / totalDiff) * 100
        system = ((currentStats.system - this.lastCpuStats.system) / totalDiff) * 100
        usage = 100 - idle
      }
    }

    if (currentStats) {
      this.lastCpuStats = currentStats
    }

    return {
      usage,
      user,
      system,
      idle,
      cores: cpus.length,
      model: cpus[0]?.model || 'Unknown',
      speed: cpus[0]?.speed || 0,
      loadAverage: loadAvg,
      perCore: cpus.map((cpu, i) => ({
        core: i,
        usage: this.calculateCoreUsage(cpu),
        idle: cpu.times.idle
      }))
    }
  }

  private getCPUStats(): { user: number; nice: number; system: number; idle: number; irq: number } | null {
    const cpus = os.cpus()
    if (cpus.length === 0) return null

    let user = 0, nice = 0, system = 0, idle = 0, irq = 0

    for (const cpu of cpus) {
      user += cpu.times.user
      nice += cpu.times.nice
      system += cpu.times.system
      idle += cpu.times.idle
      irq += cpu.times.irq
    }

    return { user, nice, system, idle, irq }
  }

  private calculateCoreUsage(cpu: os.CpuInfo): number {
    const total = Object.values(cpu.times).reduce((a, b) => a + b, 0)
    return ((total - cpu.times.idle) / total) * 100
  }

  private async collectMemoryInfo(): Promise<MemoryInfo> {
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem

    // Get process memory info
    const processMemory = process.memoryUsage()

    return {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      available: freeMem, // Approximation
      cached: 0, // Would need platform-specific code
      buffers: 0,
      shared: 0,
      swapTotal: 0,
      swapUsed: 0,
      swapFree: 0,
      usagePercent: (usedMem / totalMem) * 100,
      heap: {
        totalHeapSize: processMemory.heapTotal,
        totalHeapSizeExecutable: 0,
        totalPhysicalSize: processMemory.rss,
        usedHeapSize: processMemory.heapUsed,
        heapSizeLimit: 4 * 1024 * 1024 * 1024, // Default V8 limit
        mallocatedMemory: processMemory.external,
        peakMallocatedMemory: 0,
        externalMemory: processMemory.external
      }
    }
  }

  private async collectDiskInfo(): Promise<DiskInfo> {
    // Platform-specific disk stats
    let reads = 0, writes = 0, readBytes = 0, writeBytes = 0, readTime = 0, writeTime = 0, ioWait = 0

    try {
      if (process.platform === 'linux') {
        const diskStats = await fs.readFile('/proc/diskstats', 'utf-8')
        const lines = diskStats.trim().split('\n')
        for (const line of lines) {
          const parts = line.trim().split(/\s+/)
          if (parts.length >= 11) {
            reads += parseInt(parts[3], 10) || 0
            writes += parseInt(parts[7], 10) || 0
            readBytes += (parseInt(parts[5], 10) || 0) * 512
            writeBytes += (parseInt(parts[9], 10) || 0) * 512
          }
        }
      }
    } catch {
      // Unable to read disk stats
    }

    // Get mount info
    const mounts: DiskMount[] = []
    try {
      const { stdout } = await execAsync('df -B1 --output=source,size,used,avail,target,fstype 2>/dev/null | tail -n +2')
      const lines = stdout.trim().split('\n')
      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        if (parts.length >= 6) {
          const total = parseInt(parts[1], 10) || 0
          const used = parseInt(parts[2], 10) || 0
          const free = parseInt(parts[3], 10) || 0
          mounts.push({
            filesystem: parts[0],
            total,
            used,
            free,
            usagePercent: total > 0 ? (used / total) * 100 : 0,
            mount: parts[4],
            type: parts[5]
          })
        }
      }
    } catch {
      // Unable to get mount info
    }

    // Calculate totals from mounts
    const rootMount = mounts.find(m => m.mount === '/') || mounts[0]
    const total = rootMount?.total || 0
    const used = rootMount?.used || 0
    const free = rootMount?.free || 0

    return {
      total,
      used,
      free,
      usagePercent: total > 0 ? (used / total) * 100 : 0,
      reads,
      writes,
      readBytes,
      writeBytes,
      readTime,
      writeTime,
      mounts,
      ioWait
    }
  }

  private async collectNetworkInfo(): Promise<NetworkInfo> {
    const interfaces = os.networkInterfaces()
    const networkInterfaces: NetworkInterface[] = []

    for (const [name, nets] of Object.entries(interfaces)) {
      if (!nets) continue
      for (const net of nets) {
        networkInterfaces.push({
          name,
          address: net.address,
          netmask: net.netmask,
          family: net.family,
          mac: net.mac,
          internal: net.internal,
          bytesReceived: 0,
          bytesSent: 0
        })
      }
    }

    // Get network stats
    let bytesReceived = 0, bytesSent = 0, packetsIn = 0, packetsOut = 0, errors = 0, drops = 0

    try {
      if (process.platform === 'linux') {
        const netDev = await fs.readFile('/proc/net/dev', 'utf-8')
        const lines = netDev.trim().split('\n').slice(2)
        for (const line of lines) {
          const parts = line.trim().split(/\s+/)
          if (parts.length >= 17) {
            bytesReceived += parseInt(parts[1], 10) || 0
            packetsIn += parseInt(parts[2], 10) || 0
            errors += parseInt(parts[3], 10) || 0
            drops += parseInt(parts[4], 10) || 0
            bytesSent += parseInt(parts[9], 10) || 0
            packetsOut += parseInt(parts[10], 10) || 0
          }
        }
      }
    } catch {
      // Unable to read network stats
    }

    // Get connections count
    let connections = 0
    try {
      const { stdout } = await execAsync('ss -s 2>/dev/null | grep "TCP:" | head -1')
      const match = stdout.match(/estab (\d+)/)
      if (match) {
        connections = parseInt(match[1], 10)
      }
    } catch {
      // Unable to get connections
    }

    // Measure latency
    const latency = await this.measureLatency()

    return {
      interfaces: networkInterfaces,
      connections,
      bytesReceived,
      bytesSent,
      packetsIn,
      packetsOut,
      errors,
      drops,
      latency,
      bandwidth: {
        download: 0,
        upload: 0,
        connections,
        activeConnections: connections
      }
    }
  }

  private async measureLatency(): Promise<NetworkLatency> {
    const targets = ['8.8.8.8', '1.1.1.1', 'google.com']
    const latencyTargets: LatencyTarget[] = []

    for (const target of targets) {
      try {
        const start = Date.now()
        await execAsync(`ping -c 1 -W 2 ${target} 2>/dev/null`)
        const latency = Date.now() - start
        latencyTargets.push({
          host: target,
          latency,
          status: 'reachable'
        })
      } catch {
        latencyTargets.push({
          host: target,
          latency: 9999,
          status: 'unreachable'
        })
      }
    }

    const reachable = latencyTargets.filter(t => t.status === 'reachable')
    const avgLatency = reachable.length > 0
      ? reachable.reduce((a, t) => a + t.latency, 0) / reachable.length
      : 9999

    return {
      local: 0,
      dns: 0,
      internet: avgLatency,
      targets: latencyTargets
    }
  }

  private async collectProcessInfo(): Promise<ProcessInfo[]> {
    const processes: ProcessInfo[] = []

    try {
      // Get process list
      const { stdout } = await execAsync('ps aux --sort=-%cpu 2>/dev/null | head -50')
      const lines = stdout.trim().split('\n').slice(1)

      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        if (parts.length >= 11) {
          processes.push({
            pid: parseInt(parts[1], 10),
            name: parts[10].split('/').pop() || parts[10],
            cpu: parseFloat(parts[2]) || 0,
            memory: parseFloat(parts[3]) * 1024 || 0,
            memoryPercent: parseFloat(parts[3]) || 0,
            state: parts[7],
            threads: 1,
            user: parts[0],
            command: parts.slice(10).join(' ')
          })
        }
      }
    } catch {
      // Unable to get process info
    }

    return processes
  }

  private generateAlerts(snapshot: ResourceSnapshot): ResourceAlert[] {
    const alerts: ResourceAlert[] = []
    const { thresholds } = this.config

    // CPU alerts
    if (snapshot.cpu.usage > thresholds.cpuCritical) {
      alerts.push({
        id: `alert_${Date.now()}_cpu_critical`,
        type: 'cpu_high',
        severity: 'critical',
        message: `CPU usage critical: ${snapshot.cpu.usage.toFixed(1)}%`,
        value: snapshot.cpu.usage,
        threshold: thresholds.cpuCritical,
        timestamp: snapshot.timestamp,
        recommendation: 'Identify and terminate CPU-intensive processes or scale resources'
      })
    } else if (snapshot.cpu.usage > thresholds.cpuHigh) {
      alerts.push({
        id: `alert_${Date.now()}_cpu_high`,
        type: 'cpu_high',
        severity: 'warning',
        message: `CPU usage high: ${snapshot.cpu.usage.toFixed(1)}%`,
        value: snapshot.cpu.usage,
        threshold: thresholds.cpuHigh,
        timestamp: snapshot.timestamp,
        recommendation: 'Monitor CPU usage and consider optimizing heavy processes'
      })
    }

    // Memory alerts
    if (snapshot.memory.usagePercent > thresholds.memoryCritical) {
      alerts.push({
        id: `alert_${Date.now()}_mem_critical`,
        type: 'memory_high',
        severity: 'critical',
        message: `Memory usage critical: ${snapshot.memory.usagePercent.toFixed(1)}%`,
        value: snapshot.memory.usagePercent,
        threshold: thresholds.memoryCritical,
        timestamp: snapshot.timestamp,
        recommendation: 'Free memory immediately or risk system instability'
      })
    } else if (snapshot.memory.usagePercent > thresholds.memoryHigh) {
      alerts.push({
        id: `alert_${Date.now()}_mem_high`,
        type: 'memory_high',
        severity: 'warning',
        message: `Memory usage high: ${snapshot.memory.usagePercent.toFixed(1)}%`,
        value: snapshot.memory.usagePercent,
        threshold: thresholds.memoryHigh,
        timestamp: snapshot.timestamp,
        recommendation: 'Monitor memory usage and consider clearing caches'
      })
    }

    // Disk alerts
    if (snapshot.disk.usagePercent > thresholds.diskCritical) {
      alerts.push({
        id: `alert_${Date.now()}_disk_critical`,
        type: 'disk_full',
        severity: 'critical',
        message: `Disk usage critical: ${snapshot.disk.usagePercent.toFixed(1)}%`,
        value: snapshot.disk.usagePercent,
        threshold: thresholds.diskCritical,
        timestamp: snapshot.timestamp,
        recommendation: 'Free disk space immediately to prevent system issues'
      })
    } else if (snapshot.disk.usagePercent > thresholds.diskHigh) {
      alerts.push({
        id: `alert_${Date.now()}_disk_high`,
        type: 'disk_full',
        severity: 'warning',
        message: `Disk usage high: ${snapshot.disk.usagePercent.toFixed(1)}%`,
        value: snapshot.disk.usagePercent,
        threshold: thresholds.diskHigh,
        timestamp: snapshot.timestamp,
        recommendation: 'Clean up unnecessary files to free disk space'
      })
    }

    // Network alerts
    if (snapshot.network.latency.internet > thresholds.networkLatencyCritical) {
      alerts.push({
        id: `alert_${Date.now()}_net_critical`,
        type: 'network_latency',
        severity: 'critical',
        message: `Network latency critical: ${snapshot.network.latency.internet.toFixed(0)}ms`,
        value: snapshot.network.latency.internet,
        threshold: thresholds.networkLatencyCritical,
        timestamp: snapshot.timestamp,
        recommendation: 'Check network connectivity and resolve connectivity issues'
      })
    }

    return alerts
  }

  private detectMemoryLeak(history: ResourceSnapshot[]): boolean {
    if (history.length < 10) return false

    const memUsages = history.map(s => s.memory.used)
    let increasing = 0

    for (let i = 1; i < memUsages.length; i++) {
      if (memUsages[i] > memUsages[i - 1]) {
        increasing++
      }
    }

    // If memory is consistently increasing (>80% of the time), likely a leak
    return increasing / (memUsages.length - 1) > 0.8
  }

  private getTopProcesses(processes: ProcessInfo[], type: 'cpu' | 'memory' | 'io', limit: number): ProcessInfo[] {
    const sorted = [...processes].sort((a, b) => {
      if (type === 'cpu') return b.cpu - a.cpu
      if (type === 'memory') return b.memory - a.memory
      return 0
    })
    return sorted.slice(0, limit)
  }

  private generateSummary(
    cpu: CPUReport,
    memory: MemoryReport,
    disk: DiskReport,
    network: NetworkReport,
    alerts: ResourceAlert[]
  ): ResourceSummary {
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'emergency')
    const warningAlerts = alerts.filter(a => a.severity === 'warning')

    let status: 'healthy' | 'degraded' | 'critical' = 'healthy'
    if (criticalAlerts.length > 0) status = 'critical'
    else if (warningAlerts.length > 0) status = 'degraded'

    const healthScore = Math.max(0, 100 - (criticalAlerts.length * 20) - (warningAlerts.length * 5))

    const topIssues: string[] = []
    if (cpu.avgUsage > 70) topIssues.push('High CPU usage')
    if (memory.avgPercent > 80) topIssues.push('High memory usage')
    if (disk.avgUsage > 80) topIssues.push('Low disk space')
    if (memory.leakDetected) topIssues.push('Potential memory leak')
    if (network.avgLatency > 100) topIssues.push('High network latency')

    return {
      healthScore,
      status,
      cpuStatus: cpu.avgUsage > 80 ? 'Critical' : cpu.avgUsage > 60 ? 'Warning' : 'Normal',
      memoryStatus: memory.avgPercent > 90 ? 'Critical' : memory.avgPercent > 75 ? 'Warning' : 'Normal',
      diskStatus: disk.avgUsage > 90 ? 'Critical' : disk.avgUsage > 80 ? 'Warning' : 'Normal',
      networkStatus: network.avgLatency > 200 ? 'Critical' : network.avgLatency > 100 ? 'Warning' : 'Normal',
      topIssues
    }
  }

  private generateRecommendations(
    cpu: CPUReport,
    memory: MemoryReport,
    disk: DiskReport,
    network: NetworkReport,
    alerts: ResourceAlert[]
  ): string[] {
    const recommendations: string[] = []

    if (cpu.avgUsage > 70) {
      recommendations.push('Consider scaling CPU resources or optimizing CPU-intensive operations')
    }

    if (memory.leakDetected) {
      recommendations.push('Investigate and fix memory leaks before they cause system instability')
    }

    if (memory.avgPercent > 80) {
      recommendations.push('Increase available memory or optimize memory usage')
    }

    if (disk.avgUsage > 80) {
      recommendations.push('Clean up disk space or expand storage capacity')
    }

    if (network.avgLatency > 100) {
      recommendations.push('Investigate network issues and optimize network calls')
    }

    if (alerts.filter(a => a.type === 'cpu_spike').length > 3) {
      recommendations.push('CPU spikes detected - consider load balancing or auto-scaling')
    }

    return recommendations
  }

  private createEmptyReport(duration: number): ResourceReport {
    return {
      timestamp: new Date().toISOString(),
      duration,
      summary: {
        healthScore: 100,
        status: 'healthy',
        cpuStatus: 'No data',
        memoryStatus: 'No data',
        diskStatus: 'No data',
        networkStatus: 'No data',
        topIssues: ['No monitoring data available']
      },
      cpu: {
        avgUsage: 0,
        maxUsage: 0,
        minUsage: 0,
        spikes: 0,
        avgLoad: [0, 0, 0],
        trend: { metric: 'cpu', values: [], trend: 'stable', changeRate: 0 }
      },
      memory: {
        avgUsed: 0,
        maxUsed: 0,
        minUsed: 0,
        avgPercent: 0,
        peakPercent: 0,
        leakDetected: false,
        trend: { metric: 'memory', values: [], trend: 'stable', changeRate: 0 }
      },
      disk: {
        avgUsage: 0,
        totalReads: 0,
        totalWrites: 0,
        totalReadBytes: 0,
        totalWriteBytes: 0,
        avgIOWait: 0,
        trend: { metric: 'disk', values: [], trend: 'stable', changeRate: 0 }
      },
      network: {
        totalBytesReceived: 0,
        totalBytesSent: 0,
        avgLatency: 0,
        errors: 0,
        drops: 0,
        peakConnections: 0,
        trend: { metric: 'network', values: [], trend: 'stable', changeRate: 0 }
      },
      processes: {
        totalProcesses: 0,
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
        topCpuProcesses: [],
        topMemoryProcesses: [],
        crashedProcesses: []
      },
      alerts: [],
      recommendations: ['Start monitoring to collect resource data']
    }
  }
}

// ============================================
// Supporting Types
// ============================================

export interface ResourceRequirements {
  minCpuCores?: number
  maxCpuUsage?: number
  minMemoryMB?: number
  maxMemoryUsage?: number
  minDiskGB?: number
  maxDiskUsage?: number
}

export interface ResourceAvailabilityCheck {
  available: boolean
  issues: string[]
  snapshot: ResourceSnapshot
  requirements: ResourceRequirements
}

// ============================================
// Singleton Instance
// ============================================

let monitorInstance: ResourceMonitor | null = null

export function getResourceMonitor(config?: Partial<MonitorConfig>): ResourceMonitor {
  if (!monitorInstance) {
    monitorInstance = new ResourceMonitor(config)
  }
  return monitorInstance
}

export function startResourceMonitoring(config?: Partial<MonitorConfig>): ResourceMonitor {
  const monitor = getResourceMonitor(config)
  monitor.startMonitoring()
  return monitor
}

export async function getResourceSnapshot(): Promise<ResourceSnapshot> {
  const monitor = getResourceMonitor()
  return monitor.getCurrentSnapshot()
}

export default ResourceMonitor
