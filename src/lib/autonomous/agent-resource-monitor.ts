/**
 * Agent Resource Monitor
 * Mechanisms 175-180: Real-time monitoring of agent resources and performance
 */

export interface AgentResourceMetrics {
  agentId: string;
  timestamp: Date;
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  network: NetworkMetrics;
  io: IOMetrics;
  tasks: TaskMetrics;
  health: HealthStatus;
}

export interface CPUMetrics {
  usage: number; // percentage
  userTime: number; // milliseconds
  systemTime: number;
  idleTime: number;
  loadAverage: number[];
}

export interface MemoryMetrics {
  heapUsed: number; // bytes
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  rss: number; // Resident Set Size
  peakUsage: number;
}

export interface NetworkMetrics {
  bytesReceived: number;
  bytesSent: number;
  requestsPerSecond: number;
  averageLatency: number;
  errorRate: number;
  activeConnections: number;
}

export interface IOMetrics {
  readOps: number;
  writeOps: number;
  readBytes: number;
  writeBytes: number;
  fsOperations: number;
}

export interface TaskMetrics {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  averageDuration: number;
  queueSize: number;
}

export interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
  score: number; // 0-100
  issues: HealthIssue[];
  lastCheck: Date;
  uptime: number; // seconds
}

export interface HealthIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  recommendation: string;
  timestamp: Date;
}

export interface MonitoringConfig {
  collectionInterval: number; // milliseconds
  retentionPeriod: number; // milliseconds
  alertThresholds: AlertThresholds;
  enabledMetrics: string[];
}

export interface AlertThresholds {
  cpu: { warning: number; critical: number };
  memory: { warning: number; critical: number };
  latency: { warning: number; critical: number };
  errorRate: { warning: number; critical: number };
  queueSize: { warning: number; critical: number };
}

export interface ResourceAlert {
  id: string;
  agentId: string;
  type: 'cpu' | 'memory' | 'network' | 'io' | 'task' | 'health';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
}

export class AgentResourceMonitor {
  private metrics: Map<string, AgentResourceMetrics[]>;
  private alerts: ResourceAlert[];
  private config: MonitoringConfig;
  private intervals: Map<string, NodeJS.Timeout>;
  private listeners: AlertListener[];

  constructor(config?: Partial<MonitoringConfig>) {
    this.metrics = new Map();
    this.alerts = [];
    this.intervals = new Map();
    this.listeners = [];
    this.config = {
      collectionInterval: 5000,
      retentionPeriod: 3600000, // 1 hour
      alertThresholds: {
        cpu: { warning: 70, critical: 90 },
        memory: { warning: 80, critical: 95 },
        latency: { warning: 1000, critical: 5000 },
        errorRate: { warning: 0.05, critical: 0.1 },
        queueSize: { warning: 50, critical: 100 },
      },
      enabledMetrics: ['cpu', 'memory', 'network', 'io', 'tasks', 'health'],
      ...config,
    };
  }

  /**
   * Start monitoring an agent
   */
  startMonitoring(agentId: string): void {
    if (this.intervals.has(agentId)) {
      console.warn(`Already monitoring agent: ${agentId}`);
      return;
    }

    // Initial collection
    this.collectMetrics(agentId);

    // Set up interval for continuous collection
    const interval = setInterval(() => {
      this.collectMetrics(agentId);
    }, this.config.collectionInterval);

    this.intervals.set(agentId, interval);
  }

  /**
   * Stop monitoring an agent
   */
  stopMonitoring(agentId: string): void {
    const interval = this.intervals.get(agentId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(agentId);
    }
  }

  /**
   * Get current metrics for an agent
   */
  getCurrentMetrics(agentId: string): AgentResourceMetrics | null {
    const agentMetrics = this.metrics.get(agentId);
    if (!agentMetrics || agentMetrics.length === 0) {
      return null;
    }
    return agentMetrics[agentMetrics.length - 1];
  }

  /**
   * Get historical metrics for an agent
   */
  getHistoricalMetrics(
    agentId: string,
    duration: number
  ): AgentResourceMetrics[] {
    const agentMetrics = this.metrics.get(agentId) || [];
    const cutoff = Date.now() - duration;
    return agentMetrics.filter(m => m.timestamp.getTime() > cutoff);
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): ResourceAlert[] {
    return this.alerts.filter(a => !a.acknowledged);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  /**
   * Register an alert listener
   */
  onAlert(listener: AlertListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Get aggregated metrics across all agents
   */
  getAggregatedMetrics(): AggregatedMetrics {
    const allMetrics = Array.from(this.metrics.values())
      .flatMap(m => m[m.length - 1])
      .filter(Boolean);

    if (allMetrics.length === 0) {
      return this.getEmptyAggregatedMetrics();
    }

    return {
      totalAgents: this.intervals.size,
      averageCPU: this.average(allMetrics.map(m => m.cpu.usage)),
      averageMemory: this.average(allMetrics.map(m => m.memory.heapUsed / m.memory.heapTotal * 100)),
      totalNetworkIn: allMetrics.reduce((sum, m) => sum + m.network.bytesReceived, 0),
      totalNetworkOut: allMetrics.reduce((sum, m) => sum + m.network.bytesSent, 0),
      totalTasks: allMetrics.reduce((sum, m) => sum + m.tasks.total, 0),
      totalFailures: allMetrics.reduce((sum, m) => sum + m.tasks.failed, 0),
      healthyAgents: allMetrics.filter(m => m.health.overall === 'healthy').length,
      degradedAgents: allMetrics.filter(m => m.health.overall === 'degraded').length,
      unhealthyAgents: allMetrics.filter(m => m.health.overall === 'unhealthy').length,
    };
  }

  /**
   * Predict resource needs based on historical data
   */
  predictResourceNeeds(
    agentId: string,
    horizon: number = 300000 // 5 minutes
  ): ResourcePrediction {
    const historical = this.getHistoricalMetrics(agentId, 3600000); // Last hour
    if (historical.length < 10) {
      return { confidence: 0, predictions: [] };
    }

    const cpuTrend = this.analyzeTrend(historical.map(m => m.cpu.usage));
    const memoryTrend = this.analyzeTrend(historical.map(m => m.memory.heapUsed));
    const taskTrend = this.analyzeTrend(historical.map(m => m.tasks.total));

    const currentTime = Date.now();
    const predictions: PredictionPoint[] = [];

    for (let t = 0; t <= horizon; t += 60000) {
      predictions.push({
        timestamp: new Date(currentTime + t),
        cpu: this.extrapolate(cpuTrend, t),
        memory: this.extrapolate(memoryTrend, t),
        tasks: this.extrapolate(taskTrend, t),
      });
    }

    return {
      confidence: this.calculateConfidence(historical.length),
      predictions,
      willExceedThresholds: this.checkThresholdPredictions(predictions),
    };
  }

  private collectMetrics(agentId: string): void {
    const metrics: AgentResourceMetrics = {
      agentId,
      timestamp: new Date(),
      cpu: this.collectCPUMetrics(),
      memory: this.collectMemoryMetrics(),
      network: this.collectNetworkMetrics(),
      io: this.collectIOMetrics(),
      tasks: this.collectTaskMetrics(agentId),
      health: this.calculateHealth(agentId),
    };

    // Store metrics
    if (!this.metrics.has(agentId)) {
      this.metrics.set(agentId, []);
    }
    const agentMetrics = this.metrics.get(agentId)!;
    agentMetrics.push(metrics);

    // Clean old metrics
    this.cleanOldMetrics(agentId);

    // Check thresholds and generate alerts
    this.checkThresholds(metrics);
  }

  private collectCPUMetrics(): CPUMetrics {
    const usage = process.cpuUsage();
    const loadAvg = process.loadavg ? process.loadavg() : [0, 0, 0];
    
    return {
      usage: (usage.user + usage.system) / 1000000, // Convert to seconds
      userTime: usage.user,
      systemTime: usage.system,
      idleTime: 0,
      loadAverage: loadAvg,
    };
  }

  private collectMemoryMetrics(): MemoryMetrics {
    const memUsage = process.memoryUsage();
    
    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers || 0,
      rss: memUsage.rss,
      peakUsage: memUsage.rss, // Would need tracking for actual peak
    };
  }

  private collectNetworkMetrics(): NetworkMetrics {
    // Simulated network metrics (would use actual monitoring in production)
    return {
      bytesReceived: 0,
      bytesSent: 0,
      requestsPerSecond: 0,
      averageLatency: 0,
      errorRate: 0,
      activeConnections: 0,
    };
  }

  private collectIOMetrics(): IOMetrics {
    // Simulated IO metrics
    return {
      readOps: 0,
      writeOps: 0,
      readBytes: 0,
      writeBytes: 0,
      fsOperations: 0,
    };
  }

  private collectTaskMetrics(agentId: string): TaskMetrics {
    // Would integrate with actual task queue
    const agentMetrics = this.metrics.get(agentId) || [];
    const lastMetrics = agentMetrics[agentMetrics.length - 1];
    
    return {
      total: lastMetrics?.tasks?.total || 0,
      pending: lastMetrics?.tasks?.pending || 0,
      running: lastMetrics?.tasks?.running || 0,
      completed: (lastMetrics?.tasks?.completed || 0) + 1,
      failed: lastMetrics?.tasks?.failed || 0,
      averageDuration: 0,
      queueSize: 0,
    };
  }

  private calculateHealth(agentId: string): HealthStatus {
    const issues: HealthIssue[] = [];
    const metrics = this.getCurrentMetrics(agentId);
    
    if (!metrics) {
      return {
        overall: 'healthy',
        score: 100,
        issues: [],
        lastCheck: new Date(),
        uptime: process.uptime(),
      };
    }

    // Check CPU
    if (metrics.cpu.usage > this.config.alertThresholds.cpu.critical) {
      issues.push({
        severity: 'critical',
        category: 'cpu',
        description: `CPU usage is critically high: ${metrics.cpu.usage.toFixed(1)}%`,
        recommendation: 'Scale horizontally or optimize CPU-intensive operations',
        timestamp: new Date(),
      });
    } else if (metrics.cpu.usage > this.config.alertThresholds.cpu.warning) {
      issues.push({
        severity: 'high',
        category: 'cpu',
        description: `CPU usage is elevated: ${metrics.cpu.usage.toFixed(1)}%`,
        recommendation: 'Monitor for sustained high usage',
        timestamp: new Date(),
      });
    }

    // Check Memory
    const memoryUsage = metrics.memory.heapUsed / metrics.memory.heapTotal * 100;
    if (memoryUsage > this.config.alertThresholds.memory.critical) {
      issues.push({
        severity: 'critical',
        category: 'memory',
        description: `Memory usage is critically high: ${memoryUsage.toFixed(1)}%`,
        recommendation: 'Clear caches or increase memory allocation',
        timestamp: new Date(),
      });
    } else if (memoryUsage > this.config.alertThresholds.memory.warning) {
      issues.push({
        severity: 'high',
        category: 'memory',
        description: `Memory usage is elevated: ${memoryUsage.toFixed(1)}%`,
        recommendation: 'Monitor memory usage trend',
        timestamp: new Date(),
      });
    }

    // Check Task Queue
    if (metrics.tasks.queueSize > this.config.alertThresholds.queueSize.critical) {
      issues.push({
        severity: 'critical',
        category: 'tasks',
        description: `Task queue is critically backed up: ${metrics.tasks.queueSize} tasks`,
        recommendation: 'Increase agent capacity or reduce incoming load',
        timestamp: new Date(),
      });
    }

    // Calculate health score
    const score = Math.max(0, 100 - issues.reduce((sum, issue) => {
      const severityScores = { low: 5, medium: 15, high: 30, critical: 50 };
      return sum + severityScores[issue.severity];
    }, 0));

    // Determine overall health
    let overall: HealthStatus['overall'] = 'healthy';
    if (score < 30) overall = 'critical';
    else if (score < 50) overall = 'unhealthy';
    else if (score < 70) overall = 'degraded';

    return {
      overall,
      score,
      issues,
      lastCheck: new Date(),
      uptime: process.uptime(),
    };
  }

  private checkThresholds(metrics: AgentResourceMetrics): void {
    const thresholds = this.config.alertThresholds;

    // CPU check
    if (metrics.cpu.usage > thresholds.cpu.critical) {
      this.createAlert(metrics.agentId, 'cpu', 'critical', metrics.cpu.usage, thresholds.cpu.critical);
    } else if (metrics.cpu.usage > thresholds.cpu.warning) {
      this.createAlert(metrics.agentId, 'cpu', 'warning', metrics.cpu.usage, thresholds.cpu.warning);
    }

    // Memory check
    const memoryUsage = metrics.memory.heapUsed / metrics.memory.heapTotal * 100;
    if (memoryUsage > thresholds.memory.critical) {
      this.createAlert(metrics.agentId, 'memory', 'critical', memoryUsage, thresholds.memory.critical);
    } else if (memoryUsage > thresholds.memory.warning) {
      this.createAlert(metrics.agentId, 'memory', 'warning', memoryUsage, thresholds.memory.warning);
    }

    // Network latency check
    if (metrics.network.averageLatency > thresholds.latency.critical) {
      this.createAlert(metrics.agentId, 'network', 'critical', metrics.network.averageLatency, thresholds.latency.critical);
    } else if (metrics.network.averageLatency > thresholds.latency.warning) {
      this.createAlert(metrics.agentId, 'network', 'warning', metrics.network.averageLatency, thresholds.latency.warning);
    }

    // Error rate check
    if (metrics.network.errorRate > thresholds.errorRate.critical) {
      this.createAlert(metrics.agentId, 'network', 'critical', metrics.network.errorRate, thresholds.errorRate.critical);
    } else if (metrics.network.errorRate > thresholds.errorRate.warning) {
      this.createAlert(metrics.agentId, 'network', 'warning', metrics.network.errorRate, thresholds.errorRate.warning);
    }

    // Task queue check
    if (metrics.tasks.queueSize > thresholds.queueSize.critical) {
      this.createAlert(metrics.agentId, 'task', 'critical', metrics.tasks.queueSize, thresholds.queueSize.critical);
    } else if (metrics.tasks.queueSize > thresholds.queueSize.warning) {
      this.createAlert(metrics.agentId, 'task', 'warning', metrics.tasks.queueSize, thresholds.queueSize.warning);
    }
  }

  private createAlert(
    agentId: string,
    type: ResourceAlert['type'],
    severity: ResourceAlert['severity'],
    value: number,
    threshold: number
  ): void {
    const alert: ResourceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      type,
      severity,
      message: `${type} ${severity === 'critical' ? 'critically' : 'warning'} exceeded: ${value.toFixed(2)} > ${threshold}`,
      value,
      threshold,
      timestamp: new Date(),
      acknowledged: false,
    };

    this.alerts.push(alert);

    // Notify listeners
    for (const listener of this.listeners) {
      try {
        listener(alert);
      } catch (error) {
        console.error('Alert listener error:', error);
      }
    }
  }

  private cleanOldMetrics(agentId: string): void {
    const agentMetrics = this.metrics.get(agentId);
    if (!agentMetrics) return;

    const cutoff = Date.now() - this.config.retentionPeriod;
    const filtered = agentMetrics.filter(m => m.timestamp.getTime() > cutoff);
    this.metrics.set(agentId, filtered);
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private analyzeTrend(values: number[]): TrendAnalysis {
    if (values.length < 2) {
      return { direction: 'stable', slope: 0, r2: 0 };
    }

    // Simple linear regression
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((sum, v) => sum + v, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // Calculate R-squared
    let ssTotal = 0;
    let ssResidual = 0;
    for (let i = 0; i < n; i++) {
      const predicted = slope * i + intercept;
      ssTotal += Math.pow(values[i] - yMean, 2);
      ssResidual += Math.pow(values[i] - predicted, 2);
    }
    const r2 = ssTotal !== 0 ? 1 - ssResidual / ssTotal : 0;

    let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (Math.abs(slope) > 0.01) {
      direction = slope > 0 ? 'increasing' : 'decreasing';
    }

    return { direction, slope, r2, intercept };
  }

  private extrapolate(trend: TrendAnalysis, timeMs: number): number {
    const timeSteps = timeMs / this.config.collectionInterval;
    return trend.intercept + trend.slope * timeSteps;
  }

  private calculateConfidence(dataPoints: number): number {
    return Math.min(0.95, 0.5 + dataPoints * 0.01);
  }

  private checkThresholdPredictions(predictions: PredictionPoint[]): ThresholdWarning[] {
    const warnings: ThresholdWarning[] = [];
    const thresholds = this.config.alertThresholds;

    for (const pred of predictions) {
      if (pred.cpu > thresholds.cpu.warning) {
        warnings.push({
          metric: 'cpu',
          predictedValue: pred.cpu,
          threshold: thresholds.cpu.warning,
          timestamp: pred.timestamp,
        });
      }
      if (pred.memory > thresholds.memory.warning) {
        warnings.push({
          metric: 'memory',
          predictedValue: pred.memory,
          threshold: thresholds.memory.warning,
          timestamp: pred.timestamp,
        });
      }
    }

    return warnings;
  }

  private getEmptyAggregatedMetrics(): AggregatedMetrics {
    return {
      totalAgents: 0,
      averageCPU: 0,
      averageMemory: 0,
      totalNetworkIn: 0,
      totalNetworkOut: 0,
      totalTasks: 0,
      totalFailures: 0,
      healthyAgents: 0,
      degradedAgents: 0,
      unhealthyAgents: 0,
    };
  }
}

// Supporting interfaces
interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  slope: number;
  r2: number;
  intercept?: number;
}

interface ResourcePrediction {
  confidence: number;
  predictions: PredictionPoint[];
  willExceedThresholds: ThresholdWarning[];
}

interface PredictionPoint {
  timestamp: Date;
  cpu: number;
  memory: number;
  tasks: number;
}

interface ThresholdWarning {
  metric: string;
  predictedValue: number;
  threshold: number;
  timestamp: Date;
}

interface AggregatedMetrics {
  totalAgents: number;
  averageCPU: number;
  averageMemory: number;
  totalNetworkIn: number;
  totalNetworkOut: number;
  totalTasks: number;
  totalFailures: number;
  healthyAgents: number;
  degradedAgents: number;
  unhealthyAgents: number;
}

type AlertListener = (alert: ResourceAlert) => void;

// Singleton instance
let monitorInstance: AgentResourceMonitor | null = null;

export function getAgentResourceMonitor(): AgentResourceMonitor {
  if (!monitorInstance) {
    monitorInstance = new AgentResourceMonitor();
  }
  return monitorInstance;
}
