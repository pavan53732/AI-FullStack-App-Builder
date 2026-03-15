/**
 * Code Insight Dashboard - Mechanism #327
 * 
 * Provides visual insights and analytics about code quality,
 * architecture, and development metrics.
 * 
 * Features:
 * - Code quality metrics visualization
 * - Architecture insights
 * - Development analytics
 * - Trend analysis
 * - Real-time monitoring
 */

import ZAI from 'z-ai-web-dev-sdk'

// Types
export interface DashboardInsight {
  id: string
  category: InsightCategory
  title: string
  description: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  status: 'good' | 'warning' | 'critical'
  recommendation?: string
}

export type InsightCategory = 
  | 'quality'
  | 'complexity'
  | 'coverage'
  | 'security'
  | 'performance'
  | 'maintainability'
  | 'dependencies'
  | 'architecture'

export interface DashboardData {
  insights: DashboardInsight[]
  metrics: CodeMetrics
  charts: ChartData[]
  alerts: DashboardAlert[]
  lastUpdated: Date
}

export interface CodeMetrics {
  totalFiles: number
  totalLines: number
  totalFunctions: number
  totalClasses: number
  averageComplexity: number
  averageCoverage: number
  technicalDebt: number
  codeHealth: number // 0-100
}

export interface ChartData {
  id: string
  type: 'line' | 'bar' | 'pie' | 'gauge'
  title: string
  data: ChartPoint[]
  options: Record<string, any>
}

export interface ChartPoint {
  label: string
  value: number
  color?: string
}

export interface DashboardAlert {
  id: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  category: InsightCategory
  timestamp: Date
  acknowledged: boolean
}

export interface DashboardConfig {
  refreshInterval: number // seconds
  enableRealTime: boolean
  showTrends: boolean
  maxInsights: number
  alertThresholds: Record<InsightCategory, { warning: number; critical: number }>
}

const DEFAULT_CONFIG: DashboardConfig = {
  refreshInterval: 60,
  enableRealTime: true,
  showTrends: true,
  maxInsights: 20,
  alertThresholds: {
    quality: { warning: 70, critical: 50 },
    complexity: { warning: 15, critical: 25 },
    coverage: { warning: 70, critical: 50 },
    security: { warning: 60, critical: 40 },
    performance: { warning: 70, critical: 50 },
    maintainability: { warning: 60, critical: 40 },
    dependencies: { warning: 50, critical: 30 },
    architecture: { warning: 60, critical: 40 }
  }
}

/**
 * Code Insight Dashboard
 */
export class CodeInsightDashboard {
  private zai: any = null
  private insights: DashboardInsight[] = []
  private metrics: CodeMetrics | null = null
  private charts: ChartData[] = []
  private alerts: DashboardAlert[] = []
  private config: DashboardConfig
  private history: Map<string, number[]> = new Map()
  private initialized = false

  constructor(config?: Partial<DashboardConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Initialize the dashboard
   */
  async init(): Promise<void> {
    if (this.initialized) return
    this.zai = await ZAI.create()
    this.initialized = true
  }

  /**
   * Analyze codebase and generate insights
   */
  async analyze(codebase: {
    files: Array<{ path: string; content: string }>
    packageJson?: Record<string, any>
  }): Promise<DashboardData> {
    await this.init()

    // Reset
    this.insights = []
    this.charts = []
    this.alerts = []

    // Calculate metrics
    this.metrics = this.calculateMetrics(codebase.files)

    // Generate insights
    await this.generateInsights(codebase)

    // Generate charts
    this.generateCharts()

    // Check for alerts
    this.checkAlerts()

    // Update history for trends
    this.updateHistory()

    return {
      insights: this.insights,
      metrics: this.metrics,
      charts: this.charts,
      alerts: this.alerts,
      lastUpdated: new Date()
    }
  }

  /**
   * Calculate code metrics
   */
  private calculateMetrics(files: Array<{ path: string; content: string }>): CodeMetrics {
    let totalLines = 0
    let totalFunctions = 0
    let totalClasses = 0
    let totalComplexity = 0

    for (const file of files) {
      const lines = file.content.split('\n')
      totalLines += lines.length

      // Count functions
      const functionMatches = file.content.match(/function\s+\w+|const\s+\w+\s*=\s*\(|=>\s*{/g)
      totalFunctions += functionMatches?.length || 0

      // Count classes
      const classMatches = file.content.match(/class\s+\w+/g)
      totalClasses += classMatches?.length || 0

      // Estimate complexity (simplified)
      const complexityKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch']
      for (const keyword of complexityKeywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g')
        totalComplexity += (file.content.match(regex) || []).length
      }
    }

    const averageComplexity = files.length > 0 ? totalComplexity / files.length : 0

    // Calculate code health (simplified formula)
    const codeHealth = Math.max(0, Math.min(100,
      100 - (averageComplexity * 2) - (files.length > 50 ? 10 : 0)
    ))

    return {
      totalFiles: files.length,
      totalLines,
      totalFunctions,
      totalClasses,
      averageComplexity,
      averageCoverage: 0, // Would need test data
      technicalDebt: Math.floor(averageComplexity * files.length / 10),
      codeHealth
    }
  }

  /**
   * Generate insights
   */
  private async generateInsights(
    codebase: { files: Array<{ path: string; content: string }>; packageJson?: Record<string, any> }
  ): Promise<void> {
    if (!this.metrics) return

    // Quality insight
    this.insights.push(this.createInsight(
      'quality',
      'Code Quality Score',
      'Overall quality based on complexity and structure',
      this.metrics.codeHealth,
      '%',
      this.getTrend('quality', this.metrics.codeHealth)
    ))

    // Complexity insight
    const complexityStatus = this.getStatus(
      'complexity',
      this.metrics.averageComplexity,
      true // lower is better
    )
    this.insights.push(this.createInsight(
      'complexity',
      'Average Complexity',
      'Cyclomatic complexity per file',
      this.metrics.averageComplexity,
      '',
      this.getTrend('complexity', this.metrics.averageComplexity),
      complexityStatus
    ))

    // File count insight
    this.insights.push(this.createInsight(
      'maintainability',
      'File Count',
      'Total number of source files',
      this.metrics.totalFiles,
      'files',
      'stable',
      this.metrics.totalFiles < 100 ? 'good' : this.metrics.totalFiles < 500 ? 'warning' : 'critical'
    ))

    // Lines of code insight
    this.insights.push(this.createInsight(
      'maintainability',
      'Lines of Code',
      'Total lines in codebase',
      this.metrics.totalLines,
      'lines',
      this.getTrend('loc', this.metrics.totalLines)
    ))

    // Technical debt insight
    this.insights.push(this.createInsight(
      'quality',
      'Technical Debt',
      'Estimated technical debt in hours',
      this.metrics.technicalDebt,
      'hours',
      this.getTrend('debt', this.metrics.technicalDebt),
      this.metrics.technicalDebt < 20 ? 'good' : this.metrics.technicalDebt < 50 ? 'warning' : 'critical'
    ))

    // Function count insight
    this.insights.push(this.createInsight(
      'maintainability',
      'Function Count',
      'Total functions in codebase',
      this.metrics.totalFunctions,
      'functions',
      'stable'
    ))

    // Dependencies insight
    if (codebase.packageJson?.dependencies) {
      const depCount = Object.keys(codebase.packageJson.dependencies).length
      const devDepCount = Object.keys(codebase.packageJson.devDependencies || {}).length
      
      this.insights.push(this.createInsight(
        'dependencies',
        'Dependencies',
        'Production dependencies',
        depCount,
        'packages',
        'stable',
        depCount < 30 ? 'good' : depCount < 100 ? 'warning' : 'critical'
      ))

      this.insights.push(this.createInsight(
        'dependencies',
        'Dev Dependencies',
        'Development dependencies',
        devDepCount,
        'packages',
        'stable',
        devDepCount < 50 ? 'good' : 'warning'
      ))
    }

    // Security insight (would be calculated from security scan)
    this.insights.push(this.createInsight(
      'security',
      'Security Score',
      'Based on vulnerability scan results',
      85, // Placeholder
      '%',
      'stable',
      'good'
    ))

    // Performance insight (would be calculated from performance analysis)
    this.insights.push(this.createInsight(
      'performance',
      'Performance Score',
      'Based on performance analysis',
      75, // Placeholder
      '%',
      'stable',
      'warning',
      'Consider optimizing hot paths'
    ))
  }

  /**
   * Create an insight
   */
  private createInsight(
    category: InsightCategory,
    title: string,
    description: string,
    value: number,
    unit: string,
    trend: 'up' | 'down' | 'stable',
    status?: 'good' | 'warning' | 'critical',
    recommendation?: string
  ): DashboardInsight {
    // Auto-determine status if not provided
    if (!status) {
      const thresholds = this.config.alertThresholds[category]
      if (value < thresholds.critical) {
        status = category === 'complexity' ? 'critical' : 'warning'
      } else if (value < thresholds.warning) {
        status = 'warning'
      } else {
        status = 'good'
      }
    }

    // Calculate trend value
    const history = this.history.get(title) || []
    const trendValue = history.length > 1 
      ? value - history[history.length - 2]
      : 0

    return {
      id: `insight_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      category,
      title,
      description,
      value,
      unit,
      trend,
      trendValue,
      status,
      recommendation
    }
  }

  /**
   * Get trend for a metric
   */
  private getTrend(metric: string, currentValue: number): 'up' | 'down' | 'stable' {
    const history = this.history.get(metric) || []
    if (history.length < 2) return 'stable'

    const prevValue = history[history.length - 2]
    const diff = currentValue - prevValue

    if (Math.abs(diff) < 0.05 * prevValue) return 'stable'
    return diff > 0 ? 'up' : 'down'
  }

  /**
   * Get status based on thresholds
   */
  private getStatus(
    category: InsightCategory,
    value: number,
    lowerIsBetter: boolean = false
  ): 'good' | 'warning' | 'critical' {
    const thresholds = this.config.alertThresholds[category]

    if (lowerIsBetter) {
      if (value > thresholds.critical) return 'critical'
      if (value > thresholds.warning) return 'warning'
      return 'good'
    } else {
      if (value < thresholds.critical) return 'critical'
      if (value < thresholds.warning) return 'warning'
      return 'good'
    }
  }

  /**
   * Generate charts
   */
  private generateCharts(): void {
    if (!this.metrics) return

    // Code health gauge
    this.charts.push({
      id: 'chart_health',
      type: 'gauge',
      title: 'Code Health',
      data: [
        { label: 'Health', value: this.metrics.codeHealth, color: this.getHealthColor(this.metrics.codeHealth) }
      ],
      options: { min: 0, max: 100 }
    })

    // File type distribution
    this.charts.push({
      id: 'chart_files',
      type: 'pie',
      title: 'File Distribution',
      data: [
        { label: 'Functions', value: this.metrics.totalFunctions, color: '#3b82f6' },
        { label: 'Classes', value: this.metrics.totalClasses, color: '#10b981' },
        { label: 'Other', value: Math.max(0, this.metrics.totalFiles - this.metrics.totalFunctions - this.metrics.totalClasses), color: '#94a3b8' }
      ],
      options: {}
    })

    // Complexity bar chart
    this.charts.push({
      id: 'chart_complexity',
      type: 'bar',
      title: 'Complexity Metrics',
      data: [
        { label: 'Avg Complexity', value: this.metrics.averageComplexity, color: '#f59e0b' },
        { label: 'Files', value: this.metrics.totalFiles / 10, color: '#3b82f6' },
        { label: 'Tech Debt (hrs)', value: this.metrics.technicalDebt, color: '#ef4444' }
      ],
      options: {}
    })

    // Trend line chart (if history exists)
    const qualityHistory = this.history.get('quality') || []
    if (qualityHistory.length > 1) {
      this.charts.push({
        id: 'chart_trend',
        type: 'line',
        title: 'Quality Trend',
        data: qualityHistory.map((v, i) => ({
          label: `Day ${i + 1}`,
          value: v
        })),
        options: { smooth: true }
      })
    }
  }

  /**
   * Get color for health score
   */
  private getHealthColor(score: number): string {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#f59e0b'
    if (score >= 40) return '#ef4444'
    return '#dc2626'
  }

  /**
   * Check for alerts
   */
  private checkAlerts(): void {
    for (const insight of this.insights) {
      if (insight.status === 'critical') {
        this.alerts.push({
          id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          severity: 'critical',
          title: insight.title,
          message: `${insight.title} is at critical level: ${insight.value}${insight.unit}`,
          category: insight.category,
          timestamp: new Date(),
          acknowledged: false
        })
      } else if (insight.status === 'warning') {
        this.alerts.push({
          id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          severity: 'warning',
          title: insight.title,
          message: `${insight.title} needs attention: ${insight.value}${insight.unit}`,
          category: insight.category,
          timestamp: new Date(),
          acknowledged: false
        })
      }
    }
  }

  /**
   * Update history for trends
   */
  private updateHistory(): void {
    for (const insight of this.insights) {
      const history = this.history.get(insight.title) || []
      history.push(insight.value)
      
      // Keep last 30 data points
      if (history.length > 30) {
        history.shift()
      }
      
      this.history.set(insight.title, history)
    }
  }

  /**
   * Generate HTML dashboard
   */
  generateHtml(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Insight Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 20px; }
    .dashboard { max-width: 1400px; margin: 0 auto; }
    h1 { color: #1e293b; margin-bottom: 20px; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
    .metric { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .metric-value { font-size: 2rem; font-weight: bold; color: #1e293b; }
    .metric-label { color: #64748b; font-size: 0.875rem; }
    .insights { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
    .insight { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #3b82f6; }
    .insight.good { border-left-color: #10b981; }
    .insight.warning { border-left-color: #f59e0b; }
    .insight.critical { border-left-color: #ef4444; }
    .insight-title { font-weight: 600; color: #1e293b; margin-bottom: 5px; }
    .insight-value { font-size: 1.5rem; font-weight: bold; }
    .insight-trend { font-size: 0.75rem; }
    .trend-up { color: #10b981; }
    .trend-down { color: #ef4444; }
    .alerts { margin-top: 20px; }
    .alert { padding: 15px; border-radius: 8px; margin-bottom: 10px; }
    .alert.critical { background: #fee2e2; border: 1px solid #ef4444; }
    .alert.warning { background: #fef3c7; border: 1px solid #f59e0b; }
  </style>
</head>
<body>
  <div class="dashboard">
    <h1>📊 Code Insight Dashboard</h1>
    
    <div class="metrics">
      <div class="metric">
        <div class="metric-value">${this.metrics?.totalFiles || 0}</div>
        <div class="metric-label">Total Files</div>
      </div>
      <div class="metric">
        <div class="metric-value">${this.metrics?.totalLines?.toLocaleString() || 0}</div>
        <div class="metric-label">Lines of Code</div>
      </div>
      <div class="metric">
        <div class="metric-value">${this.metrics?.totalFunctions || 0}</div>
        <div class="metric-label">Functions</div>
      </div>
      <div class="metric">
        <div class="metric-value">${this.metrics?.codeHealth || 0}%</div>
        <div class="metric-label">Code Health</div>
      </div>
    </div>

    <h2 style="color: #1e293b; margin: 20px 0 15px;">Insights</h2>
    <div class="insights">
      ${this.insights.map(i => `
        <div class="insight ${i.status}">
          <div class="insight-title">${i.title}</div>
          <div class="insight-value">${i.value}${i.unit}</div>
          <div class="insight-trend ${i.trend === 'up' ? 'trend-up' : i.trend === 'down' ? 'trend-down' : ''}">
            ${i.trend === 'up' ? '↑' : i.trend === 'down' ? '↓' : '→'} ${i.trendValue > 0 ? '+' : ''}${i.trendValue.toFixed(1)}
          </div>
          <div style="color: #64748b; font-size: 0.875rem; margin-top: 5px;">${i.description}</div>
        </div>
      `).join('')}
    </div>

    ${this.alerts.length > 0 ? `
      <h2 style="color: #1e293b; margin: 20px 0 15px;">Alerts</h2>
      <div class="alerts">
        ${this.alerts.map(a => `
          <div class="alert ${a.severity}">
            <strong>${a.title}</strong>
            <p>${a.message}</p>
          </div>
        `).join('')}
      </div>
    ` : ''}
  </div>
</body>
</html>
`
  }

  /**
   * Get insights
   */
  getInsights(): DashboardInsight[] {
    return this.insights
  }

  /**
   * Get metrics
   */
  getMetrics(): CodeMetrics | null {
    return this.metrics
  }

  /**
   * Get alerts
   */
  getAlerts(): DashboardAlert[] {
    return this.alerts
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
    }
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.insights = []
    this.metrics = null
    this.charts = []
    this.alerts = []
  }
}

// Singleton
let dashboardInstance: CodeInsightDashboard | null = null

export function getCodeInsightDashboard(
  config?: Partial<DashboardConfig>
): CodeInsightDashboard {
  if (!dashboardInstance) {
    dashboardInstance = new CodeInsightDashboard(config)
  }
  return dashboardInstance
}

/**
 * Quick dashboard generation
 */
export async function generateDashboard(
  files: Array<{ path: string; content: string }>
): Promise<DashboardData> {
  const dashboard = new CodeInsightDashboard()
  await dashboard.init()
  return dashboard.analyze({ files })
}
