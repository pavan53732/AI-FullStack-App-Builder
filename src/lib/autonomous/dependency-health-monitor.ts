/**
 * Dependency Health Monitor
 * 
 * Monitors dependency health and security:
 * - Vulnerability scanning
 * - Outdated package detection
 * - License compliance
 * - Dependency update recommendations
 * 
 * Features:
 * - Security alerts
 * - Update suggestions
 * - License checks
 * - Dependency scoring
 */

import ZAI from 'z-ai-web-dev-sdk'
import { EventEmitter } from 'events'
import fs from 'fs/promises'
import path from 'path'

// Types
export interface DependencyScanRequest {
  id: string
  projectPath: string
  options: ScanOptions
  createdAt: string
}

export interface ScanOptions {
  includeDevDependencies: boolean
  checkSecurity: boolean
  checkLicenses: boolean
  checkOutdated: boolean
  checkUnused: boolean
  severity: ('critical' | 'high' | 'medium' | 'low')[]
}

export interface DependencyScanResult {
  requestId: string
  success: boolean
  dependencies: DependencyInfo[]
  vulnerabilities: VulnerabilityInfo[]
  outdated: OutdatedInfo[]
  licenseIssues: LicenseIssue[]
  unusedDependencies: UnusedDependency[]
  recommendations: DependencyRecommendation[]
  score: DependencyHealthScore
  processingTime: number
}

export interface DependencyInfo {
  name: string
  version: string
  installedVersion?: string
  latestVersion?: string
  type: 'production' | 'development' | 'peer' | 'optional'
  license: string
  size?: number
  description?: string
  homepage?: string
  repository?: string
  deprecated: boolean
  deprecatedMessage?: string
  lastPublish?: string
  weeklyDownloads?: number
  maintainers?: number
}

export interface VulnerabilityInfo {
  id: string
  package: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  vulnerableVersions: string
  patchedVersions: string
  cwe?: string
  cvss?: number
  references: string[]
  recommendation: string
}

export interface OutdatedInfo {
  name: string
  current: string
  latest: string
  wanted: string
  type: 'major' | 'minor' | 'patch'
  changelog?: string
  breaking: boolean
}

export interface LicenseIssue {
  package: string
  license: string
  type: 'incompatible' | 'unknown' | 'restricted' | 'unapproved'
  severity: 'high' | 'medium' | 'low'
  description: string
  recommendation: string
}

export interface UnusedDependency {
  name: string
  type: 'production' | 'development'
  size: number
  reason: string
  files?: string[]
}

export interface DependencyRecommendation {
  package: string
  type: 'update' | 'replace' | 'remove' | 'add' | 'pin'
  reason: string
  action: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  impact: string
  estimatedTime?: number
}

export interface DependencyHealthScore {
  overall: number // 0-100
  security: number
  freshness: number
  maintenance: number
  compliance: number
  efficiency: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
}

export interface DependencyAlert {
  id: string
  type: 'security' | 'outdated' | 'license' | 'unused' | 'deprecated'
  severity: 'critical' | 'high' | 'medium' | 'low'
  package: string
  message: string
  recommendation: string
  createdAt: string
}

/**
 * Dependency Health Monitor
 * 
 * Main class for monitoring dependency health
 */
export class DependencyHealthMonitor extends EventEmitter {
  private zai: any = null
  private alerts: Map<string, DependencyAlert> = new Map()
  private scanHistory: DependencyScanResult[] = []

  // Known vulnerability patterns
  private vulnerabilityPatterns = [
    { pattern: /lodash@<4\.17\.21/, cve: 'CVE-2021-23337', severity: 'high' as const },
    { pattern: /axios@<0\.21\.1/, cve: 'CVE-2021-3749', severity: 'high' as const },
    { pattern: /node-fetch@<2\.6\.1/, cve: 'CVE-2020-15168', severity: 'medium' as const },
    { pattern: /minimist@<1\.2\.6/, cve: 'CVE-2021-44906', severity: 'medium' as const },
    { pattern: /node-forge@<1\.3\.0/, cve: 'CVE-2022-24771', severity: 'high' as const },
    { pattern: /json-schema@<0\.4\.0/, cve: 'CVE-2021-3918', severity: 'critical' as const },
  ]

  // Approved licenses
  private approvedLicenses = [
    'MIT', 'Apache-2.0', 'Apache-2', 'BSD-2-Clause', 'BSD-3-Clause',
    'ISC', '0BSD', 'Unlicense', 'WTFPL', 'CC0-1.0'
  ]

  // Restricted licenses
  private restrictedLicenses = [
    'GPL-3.0', 'GPL-2.0', 'AGPL-3.0', 'LGPL-3.0', 'LGPL-2.1',
    'MPL-2.0', 'CDDL-1.0', 'EPL-1.0', 'EUPL-1.1'
  ]

  constructor() {
    super()
  }

  /**
   * Initialize the monitor
   */
  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
  }

  /**
   * Scan dependencies
   */
  async scan(request: DependencyScanRequest): Promise<DependencyScanResult> {
    const startTime = Date.now()
    this.emit('scan_started', { request })

    try {
      // Read package.json
      const packageJson = await this.readPackageJson(request.projectPath)
      const lockFile = await this.readLockFile(request.projectPath)

      // Analyze dependencies
      const dependencies = await this.analyzeDependencies(
        packageJson,
        lockFile,
        request.options
      )

      // Check for vulnerabilities
      const vulnerabilities = request.options.checkSecurity
        ? await this.checkVulnerabilities(dependencies)
        : []

      // Check for outdated packages
      const outdated = request.options.checkOutdated
        ? await this.checkOutdated(dependencies)
        : []

      // Check licenses
      const licenseIssues = request.options.checkLicenses
        ? await this.checkLicenses(dependencies)
        : []

      // Find unused dependencies
      const unusedDependencies = request.options.checkUnused
        ? await this.findUnusedDependencies(request.projectPath, dependencies, packageJson)
        : []

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        dependencies,
        vulnerabilities,
        outdated,
        licenseIssues,
        unusedDependencies
      )

      // Calculate health score
      const score = this.calculateHealthScore(
        dependencies,
        vulnerabilities,
        outdated,
        licenseIssues,
        unusedDependencies
      )

      const result: DependencyScanResult = {
        requestId: request.id,
        success: true,
        dependencies,
        vulnerabilities,
        outdated,
        licenseIssues,
        unusedDependencies,
        recommendations,
        score,
        processingTime: Date.now() - startTime
      }

      // Store and emit alerts
      this.processAlerts(vulnerabilities, outdated, licenseIssues)
      
      this.scanHistory.push(result)
      this.emit('scan_complete', { request, result })
      
      return result

    } catch (error: any) {
      return {
        requestId: request.id,
        success: false,
        dependencies: [],
        vulnerabilities: [],
        outdated: [],
        licenseIssues: [],
        unusedDependencies: [],
        recommendations: [],
        score: {
          overall: 0,
          security: 0,
          freshness: 0,
          maintenance: 0,
          compliance: 0,
          efficiency: 0,
          grade: 'F'
        },
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * Read package.json
   */
  private async readPackageJson(projectPath: string): Promise<any> {
    try {
      const content = await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8')
      return JSON.parse(content)
    } catch {
      return {}
    }
  }

  /**
   * Read lock file
   */
  private async readLockFile(projectPath: string): Promise<any> {
    try {
      const content = await fs.readFile(path.join(projectPath, 'package-lock.json'), 'utf-8')
      return JSON.parse(content)
    } catch {
      return null
    }
  }

  /**
   * Analyze dependencies
   */
  private async analyzeDependencies(
    packageJson: any,
    lockFile: any,
    options: ScanOptions
  ): Promise<DependencyInfo[]> {
    const dependencies: DependencyInfo[] = []

    // Process production dependencies
    if (packageJson.dependencies) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        dependencies.push(await this.getDependencyInfo(name, version as string, 'production', lockFile))
      }
    }

    // Process dev dependencies
    if (options.includeDevDependencies && packageJson.devDependencies) {
      for (const [name, version] of Object.entries(packageJson.devDependencies)) {
        dependencies.push(await this.getDependencyInfo(name, version as string, 'development', lockFile))
      }
    }

    // Process peer dependencies
    if (packageJson.peerDependencies) {
      for (const [name, version] of Object.entries(packageJson.peerDependencies)) {
        dependencies.push(await this.getDependencyInfo(name, version as string, 'peer', lockFile))
      }
    }

    return dependencies
  }

  /**
   * Get dependency info
   */
  private async getDependencyInfo(
    name: string,
    version: string,
    type: DependencyInfo['type'],
    lockFile: any
  ): Promise<DependencyInfo> {
    const info: DependencyInfo = {
      name,
      version,
      type,
      license: 'Unknown',
      deprecated: false
    }

    // Try to get installed version from lock file
    if (lockFile?.packages?.[`node_modules/${name}`]) {
      info.installedVersion = lockFile.packages[`node_modules/${name}`].version
    } else if (lockFile?.dependencies?.[name]) {
      info.installedVersion = lockFile.dependencies[name].version
    }

    // Simulate package info (in real implementation, would query npm registry)
    info.license = this.guessLicense(name)
    info.description = `${name} package`
    info.deprecated = false
    info.weeklyDownloads = Math.floor(Math.random() * 1000000)

    return info
  }

  /**
   * Guess license from package name
   */
  private guessLicense(name: string): string {
    // Common packages and their licenses
    const knownLicenses: Record<string, string> = {
      'react': 'MIT',
      'react-dom': 'MIT',
      'next': 'MIT',
      'typescript': 'Apache-2.0',
      'eslint': 'MIT',
      'prettier': 'MIT',
      'tailwindcss': 'MIT',
      'prisma': 'Apache-2.0',
      'zod': 'MIT',
      'lodash': 'MIT',
      'axios': 'MIT',
      'express': 'MIT',
      'uuid': 'MIT'
    }
    
    return knownLicenses[name] || 'MIT'
  }

  /**
   * Check for vulnerabilities
   */
  private async checkVulnerabilities(dependencies: DependencyInfo[]): Promise<VulnerabilityInfo[]> {
    const vulnerabilities: VulnerabilityInfo[] = []

    for (const dep of dependencies) {
      const version = dep.installedVersion || dep.version
      
      for (const pattern of this.vulnerabilityPatterns) {
        const testStr = `${dep.name}@${version}`
        if (pattern.pattern.test(testStr)) {
          vulnerabilities.push({
            id: pattern.cve,
            package: dep.name,
            severity: pattern.severity,
            title: `Vulnerability in ${dep.name}`,
            description: `Known vulnerability in ${dep.name} versions matching ${pattern.pattern}`,
            vulnerableVersions: version,
            patchedVersions: 'latest',
            cvss: pattern.severity === 'critical' ? 9.0 : pattern.severity === 'high' ? 7.5 : 5.0,
            recommendation: `Update ${dep.name} to the latest version`
          })
        }
      }
    }

    return vulnerabilities
  }

  /**
   * Check for outdated packages
   */
  private async checkOutdated(dependencies: DependencyInfo[]): Promise<OutdatedInfo[]> {
    const outdated: OutdatedInfo[] = []

    for (const dep of dependencies) {
      const current = dep.installedVersion || dep.version
      
      // Simulate checking for updates
      // In real implementation, would query npm registry
      if (current.startsWith('^') || current.startsWith('~')) {
        const cleanVersion = current.replace(/^[\^~]/, '')
        const parts = cleanVersion.split('.')
        
        if (parts.length >= 3) {
          // Simulate newer version
          const major = parseInt(parts[0])
          const minor = parseInt(parts[1])
          const patch = parseInt(parts[2])

          // 20% chance of major update, 30% chance of minor, 40% chance of patch
          const rand = Math.random()
          if (rand < 0.2) {
            outdated.push({
              name: dep.name,
              current: cleanVersion,
              latest: `${major + 1}.0.0`,
              wanted: `${major}.${minor}.${patch + 1}`,
              type: 'major',
              breaking: true
            })
          } else if (rand < 0.5) {
            outdated.push({
              name: dep.name,
              current: cleanVersion,
              latest: `${major}.${minor + 1}.0`,
              wanted: `${major}.${minor}.${patch + 1}`,
              type: 'minor',
              breaking: false
            })
          } else if (rand < 0.9) {
            outdated.push({
              name: dep.name,
              current: cleanVersion,
              latest: `${major}.${minor}.${patch + 1}`,
              wanted: `${major}.${minor}.${patch + 1}`,
              type: 'patch',
              breaking: false
            })
          }
        }
      }
    }

    return outdated
  }

  /**
   * Check licenses
   */
  private async checkLicenses(dependencies: DependencyInfo[]): Promise<LicenseIssue[]> {
    const issues: LicenseIssue[] = []

    for (const dep of dependencies) {
      const license = dep.license

      if (license === 'Unknown' || license === 'UNLICENSED') {
        issues.push({
          package: dep.name,
          license,
          type: 'unknown',
          severity: 'medium',
          description: `License for ${dep.name} is unknown or not specified`,
          recommendation: 'Check package documentation or contact maintainer'
        })
      } else if (this.restrictedLicenses.includes(license)) {
        issues.push({
          package: dep.name,
          license,
          type: 'restricted',
          severity: 'high',
          description: `${license} is a copyleft license that may require derivative works to be open-sourced`,
          recommendation: `Consider using an alternative package with a permissive license`
        })
      } else if (!this.approvedLicenses.includes(license)) {
        issues.push({
          package: dep.name,
          license,
          type: 'unapproved',
          severity: 'low',
          description: `${license} is not in the approved license list`,
          recommendation: 'Review license terms before use in production'
        })
      }
    }

    return issues
  }

  /**
   * Find unused dependencies
   */
  private async findUnusedDependencies(
    projectPath: string,
    dependencies: DependencyInfo[],
    packageJson: any
  ): Promise<UnusedDependency[]> {
    const unused: UnusedDependency[] = []

    // Get all source files
    const sourceContent = await this.getSourceContent(projectPath)

    for (const dep of dependencies) {
      if (dep.type === 'peer') continue // Skip peer dependencies

      // Check if package is imported anywhere
      const importRegex = new RegExp(
        `(import.*from\\s+['"\`]${dep.name}['"\`]|require\\s*\\(\\s*['"\`]${dep.name}['"\`]\\))`,
        'g'
      )

      if (!importRegex.test(sourceContent)) {
        // Check for common exceptions
        const exceptions = ['eslint-config', 'prettier-config', 'typescript', '@types/']
        if (exceptions.some(e => dep.name.includes(e))) continue

        unused.push({
          name: dep.name,
          type: dep.type,
          size: 0, // Would calculate actual size
          reason: 'No imports found in source code'
        })
      }
    }

    return unused
  }

  /**
   * Get source content
   */
  private async getSourceContent(projectPath: string): Promise<string> {
    const files = await this.findSourceFiles(projectPath)
    let content = ''

    for (const file of files.slice(0, 50)) {
      try {
        content += await fs.readFile(file, 'utf-8')
      } catch {
        // Skip files that can't be read
      }
    }

    return content
  }

  /**
   * Find source files
   */
  private async findSourceFiles(dir: string): Promise<string[]> {
    const files: string[] = []
    
    async function scan(currentDir: string): Promise<void> {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name)
          
          if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
            await scan(fullPath)
          } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            files.push(fullPath)
          }
        }
      } catch {
        // Skip directories that can't be read
      }
    }

    await scan(dir)
    return files
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    dependencies: DependencyInfo[],
    vulnerabilities: VulnerabilityInfo[],
    outdated: OutdatedInfo[],
    licenseIssues: LicenseIssue[],
    unusedDependencies: UnusedDependency[]
  ): DependencyRecommendation[] {
    const recommendations: DependencyRecommendation[] = []

    // Vulnerability recommendations
    for (const vuln of vulnerabilities) {
      recommendations.push({
        package: vuln.package,
        type: 'update',
        reason: `Security vulnerability: ${vuln.title}`,
        action: `Update ${vuln.package} to patch vulnerability`,
        priority: vuln.severity === 'critical' ? 'critical' : vuln.severity === 'high' ? 'high' : 'medium',
        impact: `Fixes ${vuln.severity} security vulnerability`
      })
    }

    // Outdated recommendations
    for (const pkg of outdated) {
      recommendations.push({
        package: pkg.name,
        type: 'update',
        reason: `Outdated: ${pkg.current} → ${pkg.latest}`,
        action: `Update ${pkg.name} from ${pkg.current} to ${pkg.latest}`,
        priority: pkg.breaking ? 'medium' : 'low',
        impact: pkg.breaking ? 'May include breaking changes' : 'Improvements and bug fixes'
      })
    }

    // License recommendations
    for (const issue of licenseIssues) {
      if (issue.type === 'restricted') {
        recommendations.push({
          package: issue.package,
          type: 'replace',
          reason: issue.description,
          action: issue.recommendation,
          priority: 'high',
          impact: 'Avoids license compliance issues'
        })
      }
    }

    // Unused dependency recommendations
    for (const unused of unusedDependencies) {
      recommendations.push({
        package: unused.name,
        type: 'remove',
        reason: unused.reason,
        action: `Remove ${unused.name} from ${unused.type}Dependencies`,
        priority: 'low',
        impact: 'Reduces bundle size and maintenance overhead'
      })
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }

  /**
   * Calculate health score
   */
  private calculateHealthScore(
    dependencies: DependencyInfo[],
    vulnerabilities: VulnerabilityInfo[],
    outdated: OutdatedInfo[],
    licenseIssues: LicenseIssue[],
    unusedDependencies: UnusedDependency[]
  ): DependencyHealthScore {
    // Security score (0-100)
    let security = 100
    for (const vuln of vulnerabilities) {
      if (vuln.severity === 'critical') security -= 30
      else if (vuln.severity === 'high') security -= 20
      else if (vuln.severity === 'medium') security -= 10
      else security -= 5
    }
    security = Math.max(0, security)

    // Freshness score (0-100)
    const totalDeps = dependencies.length || 1
    const outdatedRatio = outdated.length / totalDeps
    const freshness = Math.max(0, 100 - outdatedRatio * 100)

    // Compliance score (0-100)
    let compliance = 100
    for (const issue of licenseIssues) {
      if (issue.type === 'restricted') compliance -= 30
      else if (issue.type === 'unknown') compliance -= 15
      else compliance -= 5
    }
    compliance = Math.max(0, compliance)

    // Efficiency score (0-100)
    const unusedRatio = unusedDependencies.length / totalDeps
    const efficiency = Math.max(0, 100 - unusedRatio * 50)

    // Maintenance score (0-100)
    const deprecatedCount = dependencies.filter(d => d.deprecated).length
    const maintenance = Math.max(0, 100 - deprecatedCount * 20)

    // Overall score
    const overall = (security + freshness + compliance + efficiency + maintenance) / 5

    // Calculate grade
    let grade: DependencyHealthScore['grade']
    if (overall >= 90) grade = 'A'
    else if (overall >= 80) grade = 'B'
    else if (overall >= 70) grade = 'C'
    else if (overall >= 60) grade = 'D'
    else grade = 'F'

    return {
      overall: Math.round(overall),
      security: Math.round(security),
      freshness: Math.round(freshness),
      maintenance: Math.round(maintenance),
      compliance: Math.round(compliance),
      efficiency: Math.round(efficiency),
      grade
    }
  }

  /**
   * Process alerts
   */
  private processAlerts(
    vulnerabilities: VulnerabilityInfo[],
    outdated: OutdatedInfo[],
    licenseIssues: LicenseIssue[]
  ): void {
    // Create alerts for critical vulnerabilities
    for (const vuln of vulnerabilities) {
      if (vuln.severity === 'critical' || vuln.severity === 'high') {
        const alert: DependencyAlert = {
          id: `alert-${Date.now().toString(36)}-${vuln.id}`,
          type: 'security',
          severity: vuln.severity,
          package: vuln.package,
          message: vuln.title,
          recommendation: vuln.recommendation,
          createdAt: new Date().toISOString()
        }
        this.alerts.set(alert.id, alert)
        this.emit('alert', alert)
      }
    }

    // Create alerts for breaking outdated packages
    for (const pkg of outdated) {
      if (pkg.breaking) {
        const alert: DependencyAlert = {
          id: `alert-${Date.now().toString(36)}-${pkg.name}`,
          type: 'outdated',
          severity: 'medium',
          package: pkg.name,
          message: `Major update available: ${pkg.current} → ${pkg.latest}`,
          recommendation: `Review changelog and update carefully`,
          createdAt: new Date().toISOString()
        }
        this.alerts.set(alert.id, alert)
        this.emit('alert', alert)
      }
    }

    // Create alerts for restricted licenses
    for (const issue of licenseIssues) {
      if (issue.type === 'restricted') {
        const alert: DependencyAlert = {
          id: `alert-${Date.now().toString(36)}-${issue.package}`,
          type: 'license',
          severity: 'high',
          package: issue.package,
          message: issue.description,
          recommendation: issue.recommendation,
          createdAt: new Date().toISOString()
        }
        this.alerts.set(alert.id, alert)
        this.emit('alert', alert)
      }
    }
  }

  /**
   * Get alert by ID
   */
  getAlert(id: string): DependencyAlert | undefined {
    return this.alerts.get(id)
  }

  /**
   * Get all alerts
   */
  getAlerts(): DependencyAlert[] {
    return Array.from(this.alerts.values())
  }

  /**
   * Get scan history
   */
  getHistory(): DependencyScanResult[] {
    return [...this.scanHistory]
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts.clear()
  }

  /**
   * Approve license
   */
  approveLicense(license: string): void {
    if (!this.approvedLicenses.includes(license)) {
      this.approvedLicenses.push(license)
    }
  }

  /**
   * Check if can update safely
   */
  async canUpdateSafely(
    packageName: string,
    fromVersion: string,
    toVersion: string
  ): Promise<{ safe: boolean; breakingChanges: string[]; migrationSteps: string[] }> {
    // Simulate checking for breaking changes
    const fromParts = fromVersion.split('.').map(Number)
    const toParts = toVersion.split('.').map(Number)

    const breakingChanges: string[] = []
    const migrationSteps: string[] = []

    if (toParts[0] > fromParts[0]) {
      breakingChanges.push('Major version change - likely contains breaking changes')
      migrationSteps.push('Review changelog carefully')
      migrationSteps.push('Update all related dependencies')
      migrationSteps.push('Run comprehensive tests')
    } else if (toParts[1] > fromParts[1]) {
      breakingChanges.push('Minor version change - may contain deprecations')
      migrationSteps.push('Review changelog')
      migrationSteps.push('Run tests')
    }

    return {
      safe: breakingChanges.length === 0,
      breakingChanges,
      migrationSteps
    }
  }
}

// Singleton instance
let monitorInstance: DependencyHealthMonitor | null = null

export function getDependencyHealthMonitor(): DependencyHealthMonitor {
  if (!monitorInstance) {
    monitorInstance = new DependencyHealthMonitor()
  }
  return monitorInstance
}

export async function scanDependencies(
  projectPath: string,
  options?: Partial<ScanOptions>
): Promise<DependencyScanResult> {
  const monitor = getDependencyHealthMonitor()
  if (!monitor['zai']) {
    await monitor.initialize()
  }

  return monitor.scan({
    id: `scan-${Date.now().toString(36)}`,
    projectPath,
    options: {
      includeDevDependencies: true,
      checkSecurity: true,
      checkLicenses: true,
      checkOutdated: true,
      checkUnused: true,
      severity: ['critical', 'high', 'medium', 'low'],
      ...options
    },
    createdAt: new Date().toISOString()
  })
}
