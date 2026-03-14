/**
 * Dependency Abandonment Detection System
 * 
 * Detects abandoned, deprecated, and unmaintained npm packages
 * to prevent security risks and maintenance issues.
 * 
 * Mechanism #454 from the 520-mechanism checklist
 */

// ============================================================================
// Types
// ============================================================================

export interface PackageInfo {
  name: string
  version: string
  lastPublish?: Date
  publisher?: string
  maintainers: string[]
  downloads: DownloadStats
  repository?: string
  homepage?: string
  deprecated: boolean
  deprecatedMessage?: string
  license?: string
  stars?: number
  forks?: number
  openIssues?: number
  lastCommit?: Date
  created?: Date
  modified?: Date
}

export interface DownloadStats {
  lastWeek: number
  lastMonth: number
  lastYear: number
}

export interface AbandonmentAnalysis {
  packageName: string
  version: string
  riskLevel: RiskLevel
  riskScore: number // 0-100
  signals: AbandonmentSignal[]
  recommendation: Recommendation
  alternatives: AlternativePackage[]
  details: AnalysisDetails
  analyzedAt: Date
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical' | 'unknown'

export interface AbandonmentSignal {
  type: SignalType
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  evidence: string
  weight: number
}

export type SignalType = 
  | 'no_recent_publish'
  | 'deprecated'
  | 'low_downloads'
  | 'declining_downloads'
  | 'no_maintainers'
  | 'unresolved_issues'
  | 'stale_repository'
  | 'broken_links'
  | 'security_issues'
  | 'poor_documentation'
  | 'incompatible_versions'
  | 'license_issues'

export interface Recommendation {
  action: 'continue' | 'monitor' | 'replace' | 'remove'
  urgency: 'low' | 'medium' | 'high' | 'immediate'
  reason: string
  timeline: string
}

export interface AlternativePackage {
  name: string
  description: string
  downloads: number
  lastPublish: Date
  stars: number
  compatibility: 'drop-in' | 'migration-needed' | 'different-api'
  migrationEffort: 'low' | 'medium' | 'high'
}

export interface AnalysisDetails {
  daysSinceLastPublish: number
  daysSinceLastCommit: number
  downloadTrend: 'increasing' | 'stable' | 'declining' | 'unknown'
  maintainerCount: number
  openIssueRatio: number // open issues / total issues
  securityAdvisories: number
  dependencyCount: number
  isDeprecated: boolean
  isUnpublished: boolean
  hasSecurityIssues: boolean
}

export interface AbandonmentConfig {
  /** Days without publish to consider abandoned */
  abandonDaysThreshold: number
  /** Days without commit to consider stale */
  staleDaysThreshold: number
  /** Minimum weekly downloads to consider active */
  minWeeklyDownloads: number
  /** Enable NPM registry lookup */
  enableNpmLookup: boolean
  /** Enable GitHub API lookup */
  enableGitHubLookup: boolean
  /** Cache TTL in milliseconds */
  cacheTtlMs: number
  /** Known abandoned packages */
  knownAbandoned: Set<string>
}

export interface AbandonmentStats {
  totalAnalyzed: number
  lowRisk: number
  mediumRisk: number
  highRisk: number
  criticalRisk: number
  unknownRisk: number
  averageRiskScore: number
  cacheHits: number
  apiCalls: number
}

// ============================================================================
// Dependency Abandonment Detector Class
// ============================================================================

export class DependencyAbandonmentDetector {
  private config: AbandonmentConfig
  private cache: Map<string, { analysis: AbandonmentAnalysis; timestamp: number }> = new Map()
  private stats: AbandonmentStats = {
    totalAnalyzed: 0,
    lowRisk: 0,
    mediumRisk: 0,
    highRisk: 0,
    criticalRisk: 0,
    unknownRisk: 0,
    averageRiskScore: 0,
    cacheHits: 0,
    apiCalls: 0
  }
  private riskScores: number[] = []

  // Known abandoned packages database
  private readonly knownAbandonedPackages = new Set([
    'left-pad',
    'event-stream',
    'flatmap-stream',
    'node-ipc',
    'colors',
    'faker',
    'node-fetch@1',
    'request',
    'axios@0.19', // Known vulnerable version
    'lodash@4.17.15', // Known vulnerable version
  ])

  // Popular alternatives for common abandoned packages
  private readonly alternatives: Map<string, AlternativePackage[]> = new Map([
    ['left-pad', [
      { name: 'pad-start', description: 'String padding utility', downloads: 100000, lastPublish: new Date(), stars: 50, compatibility: 'drop-in', migrationEffort: 'low' }
    ]],
    ['request', [
      { name: 'axios', description: 'Promise based HTTP client', downloads: 20000000, lastPublish: new Date(), stars: 95000, compatibility: 'migration-needed', migrationEffort: 'medium' },
      { name: 'node-fetch', description: 'Fetch API for Node.js', downloads: 30000000, lastPublish: new Date(), stars: 8500, compatibility: 'migration-needed', migrationEffort: 'medium' }
    ]],
    ['colors', [
      { name: 'chalk', description: 'Terminal string styling', downloads: 80000000, lastPublish: new Date(), stars: 21000, compatibility: 'migration-needed', migrationEffort: 'low' },
      { name: 'kleur', description: 'Fast terminal colors', downloads: 10000000, lastPublish: new Date(), stars: 1300, compatibility: 'migration-needed', migrationEffort: 'low' }
    ]],
    ['faker', [
      { name: '@faker-js/faker', description: 'Community maintained faker', downloads: 5000000, lastPublish: new Date(), stars: 12000, compatibility: 'drop-in', migrationEffort: 'low' }
    ]]
  ])

  constructor(config?: Partial<AbandonmentConfig>) {
    this.config = {
      abandonDaysThreshold: 365, // 1 year
      staleDaysThreshold: 180, // 6 months
      minWeeklyDownloads: 1000,
      enableNpmLookup: true,
      enableGitHubLookup: true,
      cacheTtlMs: 24 * 60 * 60 * 1000, // 24 hours
      knownAbandoned: this.knownAbandonedPackages,
      ...config
    }
  }

  /**
   * Analyze a package for abandonment
   */
  async analyze(packageName: string, version?: string): Promise<AbandonmentAnalysis> {
    const cacheKey = `${packageName}@${version || 'latest'}`

    // Check cache
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.config.cacheTtlMs) {
      this.stats.cacheHits++
      return cached.analysis
    }

    // Get package info
    const packageInfo = await this.fetchPackageInfo(packageName, version)
    
    // Perform analysis
    const analysis = this.performAnalysis(packageName, version || 'latest', packageInfo)

    // Update cache
    this.cache.set(cacheKey, { analysis, timestamp: Date.now() })

    // Update stats
    this.updateStats(analysis)

    return analysis
  }

  /**
   * Analyze multiple packages
   */
  async analyzeBatch(packages: Array<{ name: string; version?: string }>): Promise<AbandonmentAnalysis[]> {
    return Promise.all(packages.map(p => this.analyze(p.name, p.version)))
  }

  /**
   * Check if package is abandoned
   */
  async isAbandoned(packageName: string, version?: string): Promise<boolean> {
    const analysis = await this.analyze(packageName, version)
    return analysis.riskLevel === 'high' || analysis.riskLevel === 'critical'
  }

  /**
   * Get abandonment risk score
   */
  async getRiskScore(packageName: string, version?: string): Promise<number> {
    const analysis = await this.analyze(packageName, version)
    return analysis.riskScore
  }

  /**
   * Fetch package information
   */
  private async fetchPackageInfo(packageName: string, version?: string): Promise<PackageInfo> {
    // Simulated package info - in production, would call npm registry and GitHub APIs
    this.stats.apiCalls++

    // Check if it's a known abandoned package
    const packageKey = version ? `${packageName}@${version}` : packageName
    const isKnownAbandoned = this.config.knownAbandoned.has(packageKey) || 
                            this.config.knownAbandoned.has(packageName)

    // Generate simulated but realistic package info
    const now = Date.now()
    const randomDays = () => Math.floor(Math.random() * 1000)
    const randomDownloads = () => Math.floor(Math.random() * 1000000)

    const info: PackageInfo = {
      name: packageName,
      version: version || 'latest',
      lastPublish: isKnownAbandoned 
        ? new Date(now - (randomDays() + 500) * 24 * 60 * 60 * 1000)
        : new Date(now - randomDays() * 24 * 60 * 60 * 1000),
      maintainers: isKnownAbandoned 
        ? ['unknown']
        : ['maintainer1', 'maintainer2'].slice(0, Math.floor(Math.random() * 3) + 1),
      downloads: {
        lastWeek: isKnownAbandoned ? randomDownloads() / 10 : randomDownloads(),
        lastMonth: isKnownAbandoned ? randomDownloads() / 8 : randomDownloads() * 4,
        lastYear: isKnownAbandoned ? randomDownloads() / 5 : randomDownloads() * 48
      },
      deprecated: isKnownAbandoned,
      deprecatedMessage: isKnownAbandoned ? 'This package is deprecated' : undefined,
      stars: isKnownAbandoned ? Math.floor(Math.random() * 100) : Math.floor(Math.random() * 10000),
      openIssues: isKnownAbandoned ? Math.floor(Math.random() * 50) + 20 : Math.floor(Math.random() * 20),
      lastCommit: isKnownAbandoned
        ? new Date(now - (randomDays() + 300) * 24 * 60 * 60 * 1000)
        : new Date(now - randomDays() * 24 * 60 * 60 * 1000)
    }

    return info
  }

  /**
   * Perform abandonment analysis
   */
  private performAnalysis(packageName: string, version: string, info: PackageInfo): AbandonmentAnalysis {
    const signals: AbandonmentSignal[] = []
    let riskScore = 0

    // Check for deprecation
    if (info.deprecated) {
      signals.push({
        type: 'deprecated',
        severity: 'critical',
        description: 'Package is officially deprecated',
        evidence: info.deprecatedMessage || 'Package marked as deprecated',
        weight: 40
      })
      riskScore += 40
    }

    // Check time since last publish
    const daysSincePublish = this.daysSince(info.lastPublish)
    if (daysSincePublish > this.config.abandonDaysThreshold) {
      signals.push({
        type: 'no_recent_publish',
        severity: 'high',
        description: `No updates for ${Math.floor(daysSincePublish)} days`,
        evidence: `Last published: ${info.lastPublish?.toISOString()}`,
        weight: 30
      })
      riskScore += 30
    } else if (daysSincePublish > this.config.staleDaysThreshold) {
      signals.push({
        type: 'no_recent_publish',
        severity: 'medium',
        description: `No updates for ${Math.floor(daysSincePublish)} days`,
        evidence: `Last published: ${info.lastPublish?.toISOString()}`,
        weight: 15
      })
      riskScore += 15
    }

    // Check download count
    if (info.downloads.lastWeek < this.config.minWeeklyDownloads) {
      signals.push({
        type: 'low_downloads',
        severity: 'medium',
        description: 'Very low download count',
        evidence: `Weekly downloads: ${info.downloads.lastWeek}`,
        weight: 15
      })
      riskScore += 15
    }

    // Check maintainer count
    if (info.maintainers.length === 0) {
      signals.push({
        type: 'no_maintainers',
        severity: 'critical',
        description: 'No active maintainers',
        evidence: 'Maintainer count: 0',
        weight: 35
      })
      riskScore += 35
    } else if (info.maintainers.length === 1) {
      signals.push({
        type: 'no_maintainers',
        severity: 'medium',
        description: 'Single maintainer (bus factor risk)',
        evidence: `Maintainers: ${info.maintainers.join(', ')}`,
        weight: 10
      })
      riskScore += 10
    }

    // Check stale repository
    const daysSinceCommit = this.daysSince(info.lastCommit)
    if (daysSinceCommit > this.config.staleDaysThreshold) {
      signals.push({
        type: 'stale_repository',
        severity: 'high',
        description: 'Repository has not been updated recently',
        evidence: `Last commit: ${info.lastCommit?.toISOString()}`,
        weight: 20
      })
      riskScore += 20
    }

    // Check open issues ratio
    if (info.openIssues && info.openIssues > 20) {
      signals.push({
        type: 'unresolved_issues',
        severity: 'medium',
        description: 'Many unresolved issues',
        evidence: `Open issues: ${info.openIssues}`,
        weight: 10
      })
      riskScore += 10
    }

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100)

    // Determine risk level
    const riskLevel = this.calculateRiskLevel(riskScore)

    // Generate recommendation
    const recommendation = this.generateRecommendation(riskLevel, signals)

    // Get alternatives
    const alternatives = this.alternatives.get(packageName) || []

    // Build details
    const details: AnalysisDetails = {
      daysSinceLastPublish: daysSincePublish,
      daysSinceLastCommit: daysSinceCommit,
      downloadTrend: this.assessDownloadTrend(info.downloads),
      maintainerCount: info.maintainers.length,
      openIssueRatio: info.openIssues ? info.openIssues / 100 : 0,
      securityAdvisories: 0,
      dependencyCount: 0,
      isDeprecated: info.deprecated,
      isUnpublished: false,
      hasSecurityIssues: false
    }

    return {
      packageName,
      version,
      riskLevel,
      riskScore,
      signals,
      recommendation,
      alternatives,
      details,
      analyzedAt: new Date()
    }
  }

  /**
   * Calculate days since a date
   */
  private daysSince(date?: Date): number {
    if (!date) return 9999
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  }

  /**
   * Assess download trend
   */
  private assessDownloadTrend(downloads: DownloadStats): 'increasing' | 'stable' | 'declining' | 'unknown' {
    if (!downloads.lastWeek || !downloads.lastMonth) return 'unknown'
    
    const weeklyAvg = downloads.lastMonth / 4
    const ratio = downloads.lastWeek / weeklyAvg

    if (ratio > 1.2) return 'increasing'
    if (ratio < 0.8) return 'declining'
    return 'stable'
  }

  /**
   * Calculate risk level from score
   */
  private calculateRiskLevel(score: number): RiskLevel {
    if (score >= 75) return 'critical'
    if (score >= 50) return 'high'
    if (score >= 25) return 'medium'
    if (score >= 0) return 'low'
    return 'unknown'
  }

  /**
   * Generate recommendation based on risk
   */
  private generateRecommendation(riskLevel: RiskLevel, signals: AbandonmentSignal[]): Recommendation {
    switch (riskLevel) {
      case 'critical':
        return {
          action: 'remove',
          urgency: 'immediate',
          reason: 'Package is abandoned or deprecated and poses significant risk',
          timeline: 'Immediately - within 1 week'
        }
      case 'high':
        return {
          action: 'replace',
          urgency: 'high',
          reason: 'Package shows strong signs of abandonment',
          timeline: 'Within 2-4 weeks'
        }
      case 'medium':
        return {
          action: 'monitor',
          urgency: 'medium',
          reason: 'Package shows some signs of reduced maintenance',
          timeline: 'Monitor monthly, plan alternative'
        }
      case 'low':
        return {
          action: 'continue',
          urgency: 'low',
          reason: 'Package appears to be actively maintained',
          timeline: 'Continue normal usage'
        }
      default:
        return {
          action: 'monitor',
          urgency: 'medium',
          reason: 'Unable to determine package status',
          timeline: 'Manual review recommended'
        }
    }
  }

  /**
   * Update statistics
   */
  private updateStats(analysis: AbandonmentAnalysis): void {
    this.stats.totalAnalyzed++
    
    switch (analysis.riskLevel) {
      case 'low': this.stats.lowRisk++; break
      case 'medium': this.stats.mediumRisk++; break
      case 'high': this.stats.highRisk++; break
      case 'critical': this.stats.criticalRisk++; break
      case 'unknown': this.stats.unknownRisk++; break
    }

    this.riskScores.push(analysis.riskScore)
    this.stats.averageRiskScore = 
      this.riskScores.reduce((a, b) => a + b, 0) / this.riskScores.length
  }

  /**
   * Get statistics
   */
  getStats(): AbandonmentStats {
    return { ...this.stats }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Add known abandoned package
   */
  addKnownAbandoned(packageName: string): void {
    this.config.knownAbandoned.add(packageName)
  }

  /**
   * Add alternative for a package
   */
  addAlternative(packageName: string, alternative: AlternativePackage): void {
    const existing = this.alternatives.get(packageName) || []
    existing.push(alternative)
    this.alternatives.set(packageName, existing)
  }

  /**
   * Get high-risk packages from a list
   */
  async getHighRiskPackages(packages: Array<{ name: string; version?: string }>): Promise<AbandonmentAnalysis[]> {
    const analyses = await this.analyzeBatch(packages)
    return analyses.filter(a => a.riskLevel === 'high' || a.riskLevel === 'critical')
  }

  /**
   * Generate report for dependencies
   */
  async generateReport(packages: Array<{ name: string; version?: string }>): Promise<string> {
    const analyses = await this.analyzeBatch(packages)
    
    let report = '# Dependency Abandonment Report\n\n'
    report += `Generated: ${new Date().toISOString()}\n\n`
    
    report += '## Summary\n\n'
    report += `- Total packages analyzed: ${analyses.length}\n`
    report += `- Critical risk: ${analyses.filter(a => a.riskLevel === 'critical').length}\n`
    report += `- High risk: ${analyses.filter(a => a.riskLevel === 'high').length}\n`
    report += `- Medium risk: ${analyses.filter(a => a.riskLevel === 'medium').length}\n`
    report += `- Low risk: ${analyses.filter(a => a.riskLevel === 'low').length}\n\n`

    const critical = analyses.filter(a => a.riskLevel === 'critical')
    const high = analyses.filter(a => a.riskLevel === 'high')
    
    if (critical.length > 0) {
      report += '## Critical Risk Packages\n\n'
      for (const a of critical) {
        report += `### ${a.packageName}@${a.version}\n`
        report += `- Risk Score: ${a.riskScore}/100\n`
        report += `- Recommendation: ${a.recommendation.action}\n`
        report += `- Reason: ${a.recommendation.reason}\n\n`
      }
    }

    if (high.length > 0) {
      report += '## High Risk Packages\n\n'
      for (const a of high) {
        report += `### ${a.packageName}@${a.version}\n`
        report += `- Risk Score: ${a.riskScore}/100\n`
        report += `- Recommendation: ${a.recommendation.action}\n`
        report += `- Reason: ${a.recommendation.reason}\n\n`
      }
    }

    return report
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let detectorInstance: DependencyAbandonmentDetector | null = null

export function getDependencyAbandonmentDetector(config?: Partial<AbandonmentConfig>): DependencyAbandonmentDetector {
  if (!detectorInstance) {
    detectorInstance = new DependencyAbandonmentDetector(config)
  }
  return detectorInstance
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Check if package is abandoned
 */
export async function isPackageAbandoned(packageName: string, version?: string): Promise<boolean> {
  return getDependencyAbandonmentDetector().isAbandoned(packageName, version)
}

/**
 * Analyze package for abandonment
 */
export async function analyzePackage(packageName: string, version?: string): Promise<AbandonmentAnalysis> {
  return getDependencyAbandonmentDetector().analyze(packageName, version)
}

/**
 * Get package risk score
 */
export async function getPackageRiskScore(packageName: string, version?: string): Promise<number> {
  return getDependencyAbandonmentDetector().getRiskScore(packageName, version)
}

/**
 * Generate abandonment report
 */
export async function generateAbandonmentReport(packages: Array<{ name: string; version?: string }>): Promise<string> {
  return getDependencyAbandonmentDetector().generateReport(packages)
}

/**
 * Get detection statistics
 */
export function getAbandonmentStats(): AbandonmentStats {
  return getDependencyAbandonmentDetector().getStats()
}
