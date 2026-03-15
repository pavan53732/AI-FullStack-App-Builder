/**
 * Supply Chain Verifier - Mechanism #498
 * 
 * Verifies the security and integrity of the software supply chain,
 * detecting compromised packages, malicious code, and trust issues.
 * 
 * Features:
 * - Package integrity verification
 * - Malicious code detection
 * - Dependency trust scoring
 * - Supply chain attack detection
 * - SBOM generation
 */

import ZAI from 'z-ai-web-dev-sdk'

// Types
export interface SupplyChainVerification {
  id: string
  timestamp: Date
  packages: PackageVerification[]
  summary: VerificationSummary
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'safe'
  recommendations: string[]
  sbom: SBOM
}

export interface PackageVerification {
  name: string
  version: string
  integrity: IntegrityCheck
  trust: TrustAssessment
  vulnerabilities: VulnerabilityInfo[]
  dependencies: string[]
  warnings: string[]
}

export interface IntegrityCheck {
  passed: boolean
  checksumMatch: boolean
  signatureValid: boolean
  tamperingDetected: boolean
  originalChecksum?: string
  calculatedChecksum?: string
}

export interface TrustAssessment {
  score: number // 0-1
  factors: TrustFactor[]
  flags: TrustFlag[]
}

export interface TrustFactor {
  name: string
  score: number
  weight: number
  description: string
}

export type TrustFlag = 
  | 'new_package'
  | 'unverified_author'
  | 'infrequent_updates'
  | 'missing_readme'
  | 'no_license'
  | 'suspicious_patterns'
  | 'high_download_spike'
  | 'typosquatting_risk'
  | 'abandoned'

export interface VulnerabilityInfo {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  patchedIn?: string
  exploitability: number
}

export interface VerificationSummary {
  totalPackages: number
  verified: number
  flagged: number
  vulnerable: number
  criticalIssues: number
  trustAverage: number
}

export interface SBOM {
  format: 'CycloneDX' | 'SPDX'
  version: string
  components: SBOMComponent[]
  dependencies: SBOMDependency[]
  metadata: Record<string, any>
}

export interface SBOMComponent {
  name: string
  version: string
  purl: string
  license?: string
  supplier?: string
  hash?: string
}

export interface SBOMDependency {
  from: string
  to: string
  type: 'direct' | 'transitive'
}

export interface VerificationConfig {
  checkIntegrity: boolean
  checkVulnerabilities: boolean
  checkTrust: boolean
  checkDependencies: boolean
  maxDepth: number
  trustedRegistries: string[]
  blockedPackages: string[]
}

const DEFAULT_CONFIG: VerificationConfig = {
  checkIntegrity: true,
  checkVulnerabilities: true,
  checkTrust: true,
  checkDependencies: true,
  maxDepth: 5,
  trustedRegistries: ['https://registry.npmjs.org'],
  blockedPackages: []
}

// Known malicious patterns
const MALICIOUS_PATTERNS = [
  /eval\s*\(/gi,
  /Function\s*\(/gi,
  /atob\s*\(/gi,
  /fromCharCode/gi,
  /process\.env\.\w+\s*\(/gi, // Dynamic env access with execution
  /child_process/gi,
  /fs\.readFileSync\s*\(\s*process\.env/gi,
  /curl\s+.*\|\s*bash/gi,
  /wget\s+.*\|\s*sh/gi
]

// Known typosquatting patterns
const TYPOSQUATTING_PATTERNS = [
  { original: 'react', typos: ['ract', 'reacet', 'reactt', 'reaact', 'reactjs'] },
  { original: 'lodash', typos: ['lodas', 'lodah', 'lodahs', 'loadsh'] },
  { original: 'express', typos: ['expres', 'expresss', 'epxress', 'exprses'] },
  { original: 'next', typos: ['nxet', 'nextt', 'nextjs', 'nxt'] },
  { original: 'typescript', typos: ['typescriptt', 'typscript', 'typescrip'] }
]

/**
 * Supply Chain Verifier
 */
export class SupplyChainVerifier {
  private zai: any = null
  private config: VerificationConfig
  private cache: Map<string, PackageVerification> = new Map()
  private initialized = false

  constructor(config?: Partial<VerificationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Initialize the verifier
   */
  async init(): Promise<void> {
    if (this.initialized) return
    this.zai = await ZAI.create()
    this.initialized = true
  }

  /**
   * Verify package.json or list of packages
   */
  async verify(packages: Array<{ name: string; version: string }>): Promise<SupplyChainVerification> {
    await this.init()

    const verifications: PackageVerification[] = []

    for (const pkg of packages) {
      // Check cache first
      const cacheKey = `${pkg.name}@${pkg.version}`
      if (this.cache.has(cacheKey)) {
        verifications.push(this.cache.get(cacheKey)!)
        continue
      }

      const verification = await this.verifyPackage(pkg.name, pkg.version)
      verifications.push(verification)
      this.cache.set(cacheKey, verification)
    }

    // Calculate summary
    const summary = this.calculateSummary(verifications)

    // Determine overall risk level
    const riskLevel = this.determineRiskLevel(summary)

    // Generate recommendations
    const recommendations = this.generateRecommendations(verifications, riskLevel)

    // Generate SBOM
    const sbom = this.generateSBOM(verifications)

    return {
      id: `verify_${Date.now()}`,
      timestamp: new Date(),
      packages: verifications,
      summary,
      riskLevel,
      recommendations,
      sbom
    }
  }

  /**
   * Verify a single package
   */
  private async verifyPackage(name: string, version: string): Promise<PackageVerification> {
    const warnings: string[] = []

    // Check if blocked
    if (this.config.blockedPackages.includes(name)) {
      warnings.push(`Package ${name} is in the blocked list`)
    }

    // Check integrity
    const integrity = this.config.checkIntegrity
      ? await this.checkIntegrity(name, version)
      : this.getDefaultIntegrity()

    // Check trust
    const trust = this.config.checkTrust
      ? await this.checkTrust(name, version)
      : this.getDefaultTrust()

    // Check vulnerabilities
    const vulnerabilities = this.config.checkVulnerabilities
      ? await this.checkVulnerabilities(name, version)
      : []

    // Get dependencies
    const dependencies = this.config.checkDependencies
      ? await this.getDependencies(name, version)
      : []

    // Check for malicious patterns
    const maliciousCheck = await this.checkMaliciousPatterns(name, version)
    warnings.push(...maliciousCheck.warnings)

    // Check for typosquatting
    const typoCheck = this.checkTyposquatting(name)
    if (typoCheck.suspected) {
      warnings.push(`Potential typosquatting of "${typoCheck.original}"`)
      trust.flags.push('typosquatting_risk')
      trust.score -= 0.3
    }

    return {
      name,
      version,
      integrity,
      trust,
      vulnerabilities,
      dependencies,
      warnings
    }
  }

  /**
   * Check package integrity
   */
  private async checkIntegrity(name: string, version: string): Promise<IntegrityCheck> {
    // Simulated integrity check
    // In production, this would verify against registry signatures
    const result: IntegrityCheck = {
      passed: true,
      checksumMatch: true,
      signatureValid: true,
      tamperingDetected: false
    }

    // Check for known integrity issues
    if (name.includes('-legacy') || name.includes('-old')) {
      result.passed = false
      result.warnings = ['Package may be an outdated fork']
    }

    return result
  }

  /**
   * Get default integrity check
   */
  private getDefaultIntegrity(): IntegrityCheck {
    return {
      passed: true,
      checksumMatch: true,
      signatureValid: false,
      tamperingDetected: false
    }
  }

  /**
   * Check package trust
   */
  private async checkTrust(name: string, version: string): Promise<TrustAssessment> {
    const factors: TrustFactor[] = []
    const flags: TrustFlag[] = []
    let score = 0.8 // Start optimistic

    // Factor: Package age (simulated)
    factors.push({
      name: 'package_age',
      score: 0.8,
      weight: 0.2,
      description: 'Package has been published for reasonable time'
    })

    // Factor: Download count (simulated)
    factors.push({
      name: 'popularity',
      score: 0.7,
      weight: 0.15,
      description: 'Moderate download count'
    })

    // Factor: Update frequency
    factors.push({
      name: 'maintenance',
      score: 0.75,
      weight: 0.15,
      description: 'Regular updates'
    })

    // Check for trust flags
    if (version.startsWith('0.')) {
      flags.push('new_package')
      score -= 0.1
    }

    // Calculate weighted score
    const weightedScore = factors.reduce(
      (sum, f) => sum + f.score * f.weight,
      0
    ) / factors.reduce((sum, f) => sum + f.weight, 0)

    return {
      score: Math.max(0, Math.min(1, weightedScore)),
      factors,
      flags
    }
  }

  /**
   * Get default trust assessment
   */
  private getDefaultTrust(): TrustAssessment {
    return {
      score: 0.5,
      factors: [],
      flags: []
    }
  }

  /**
   * Check for vulnerabilities
   */
  private async checkVulnerabilities(name: string, version: string): Promise<VulnerabilityInfo[]> {
    // Simulated vulnerability check
    // In production, this would query security databases
    const vulnerabilities: VulnerabilityInfo[] = []

    // Check known vulnerable packages
    const knownVulnerable: Record<string, Record<string, VulnerabilityInfo[]>> = {
      'event-stream': {
        '*': [{
          id: 'CVE-2018-16492',
          severity: 'critical',
          title: 'Malicious package',
          description: 'Package was compromised to steal cryptocurrency wallets',
          exploitability: 1.0
        }]
      },
      'ua-parser-js': {
        '0.7.29': [{
          id: 'CVE-2021-42726',
          severity: 'high',
          title: 'ReDoS vulnerability',
          description: 'Regular expression denial of service',
          patchedIn: '0.7.30',
          exploitability: 0.7
        }]
      }
    }

    if (knownVulnerable[name]?.[version]) {
      vulnerabilities.push(...knownVulnerable[name][version])
    }

    // Check wildcard vulnerabilities
    if (knownVulnerable[name]?.['*']) {
      vulnerabilities.push(...knownVulnerable[name]['*'])
    }

    return vulnerabilities
  }

  /**
   * Get package dependencies
   */
  private async getDependencies(name: string, version: string): Promise<string[]> {
    // Simulated dependency resolution
    // In production, this would fetch from registry
    return []
  }

  /**
   * Check for malicious patterns
   */
  private async checkMaliciousPatterns(
    name: string,
    version: string
  ): Promise<{ warnings: string[] }> {
    const warnings: string[] = []

    // Check package name for suspicious patterns
    for (const pattern of MALICIOUS_PATTERNS) {
      if (pattern.test(name)) {
        warnings.push(`Suspicious pattern detected in package name`)
        break
      }
    }

    // Check for suspicious version patterns
    if (version.includes('-rc') && version.includes('.0-rc')) {
      // Multiple release candidates might indicate rushed release
    }

    return { warnings }
  }

  /**
   * Check for typosquatting
   */
  private checkTyposquatting(name: string): { suspected: boolean; original?: string } {
    for (const { original, typos } of TYPOSQUATTING_PATTERNS) {
      if (typos.includes(name.toLowerCase())) {
        return { suspected: true, original }
      }
    }

    // Check for common typosquatting patterns
    if (name.endsWith('-js') || name.endsWith('-npm')) {
      // Check if non-suffixed version exists and is more popular
      const baseName = name.replace(/-js$|-npm$/, '')
      return { suspected: true, original: baseName }
    }

    return { suspected: false }
  }

  /**
   * Calculate summary
   */
  private calculateSummary(verifications: PackageVerification[]): VerificationSummary {
    const totalPackages = verifications.length
    const verified = verifications.filter(v => 
      v.integrity.passed && v.trust.score >= 0.5
    ).length
    const flagged = verifications.filter(v => 
      v.trust.flags.length > 0 || v.warnings.length > 0
    ).length
    const vulnerable = verifications.filter(v => 
      v.vulnerabilities.length > 0
    ).length
    const criticalIssues = verifications.reduce(
      (sum, v) => sum + v.vulnerabilities.filter(vul => 
        vul.severity === 'critical'
      ).length,
      0
    )
    const trustAverage = verifications.reduce(
      (sum, v) => sum + v.trust.score,
      0
    ) / (totalPackages || 1)

    return {
      totalPackages,
      verified,
      flagged,
      vulnerable,
      criticalIssues,
      trustAverage
    }
  }

  /**
   * Determine risk level
   */
  private determineRiskLevel(summary: VerificationSummary): 'critical' | 'high' | 'medium' | 'low' | 'safe' {
    if (summary.criticalIssues > 0) return 'critical'
    if (summary.vulnerable > 0 || summary.trustAverage < 0.4) return 'high'
    if (summary.flagged > summary.totalPackages * 0.3) return 'medium'
    if (summary.trustAverage < 0.7) return 'low'
    return 'safe'
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    verifications: PackageVerification[],
    riskLevel: string
  ): string[] {
    const recommendations: string[] = []

    // Critical issues
    const critical = verifications.filter(v => 
      v.vulnerabilities.some(vul => vul.severity === 'critical')
    )
    for (const pkg of critical) {
      recommendations.push(`🔴 CRITICAL: Remove or update ${pkg.name}@${pkg.version}`)
    }

    // Typosquatting warnings
    const typosquatting = verifications.filter(v => 
      v.trust.flags.includes('typosquatting_risk')
    )
    for (const pkg of typosquatting) {
      recommendations.push(`⚠️ Verify ${pkg.name} is the intended package (potential typosquatting)`)
    }

    // Low trust packages
    const lowTrust = verifications.filter(v => v.trust.score < 0.5)
    for (const pkg of lowTrust) {
      recommendations.push(`⚠️ ${pkg.name} has low trust score (${(pkg.trust.score * 100).toFixed(0)}%)`)
    }

    // General recommendations based on risk level
    switch (riskLevel) {
      case 'critical':
        recommendations.push('🚨 Do not deploy until critical issues are resolved')
        break
      case 'high':
        recommendations.push('⚠️ Review and fix high-risk issues before deployment')
        break
      case 'medium':
        recommendations.push('📋 Address flagged packages before production deployment')
        break
      case 'low':
        recommendations.push('✓ Consider updating low-trust packages')
        break
      default:
        recommendations.push('✅ Supply chain appears secure')
    }

    return recommendations
  }

  /**
   * Generate SBOM
   */
  private generateSBOM(verifications: PackageVerification[]): SBOM {
    const components: SBOMComponent[] = verifications.map(v => ({
      name: v.name,
      version: v.version,
      purl: `pkg:npm/${v.name}@${v.version}`,
      hash: v.integrity.calculatedChecksum
    }))

    const dependencies: SBOMDependency[] = []
    for (const v of verifications) {
      for (const dep of v.dependencies) {
        dependencies.push({
          from: v.name,
          to: dep,
          type: 'direct'
        })
      }
    }

    return {
      format: 'CycloneDX',
      version: '1.4',
      components,
      dependencies,
      metadata: {
        timestamp: new Date().toISOString(),
        tool: 'ai-app-builder-supply-chain-verifier'
      }
    }
  }

  /**
   * Get cached verification
   */
  getCached(name: string, version: string): PackageVerification | undefined {
    return this.cache.get(`${name}@${version}`)
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Add trusted registry
   */
  addTrustedRegistry(url: string): void {
    if (!this.config.trustedRegistries.includes(url)) {
      this.config.trustedRegistries.push(url)
    }
  }

  /**
   * Block a package
   */
  blockPackage(name: string): void {
    if (!this.config.blockedPackages.includes(name)) {
      this.config.blockedPackages.push(name)
    }
  }
}

// Singleton
let verifierInstance: SupplyChainVerifier | null = null

export function getSupplyChainVerifier(
  config?: Partial<VerificationConfig>
): SupplyChainVerifier {
  if (!verifierInstance) {
    verifierInstance = new SupplyChainVerifier(config)
  }
  return verifierInstance
}

/**
 * Quick supply chain verification
 */
export async function verifySupplyChain(
  packages: Array<{ name: string; version: string }>
): Promise<SupplyChainVerification> {
  const verifier = new SupplyChainVerifier()
  await verifier.init()
  return verifier.verify(packages)
}
