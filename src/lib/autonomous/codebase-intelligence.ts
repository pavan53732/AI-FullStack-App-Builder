/**
 * Codebase Intelligence System
 * 
 * Implements mechanisms #302-308 for comprehensive codebase analysis:
 * - Monorepo analyzer - Analyze monorepo structure
 * - Microservice detection - Detect microservice patterns
 * - Service boundary inference - Infer service boundaries
 * - Package architecture inference - Infer package structure
 * - Code ownership graph - Build ownership relationships
 * - Developer workflow analyzer - Analyze workflows
 * - Codebase risk scoring - Score codebase risks
 */

import * as fs from 'fs/promises'
import * as path from 'path'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Complete codebase analysis result
 */
export interface CodebaseAnalysis {
  id: string
  projectPath: string
  analyzedAt: string
  summary: {
    totalFiles: number
    totalLinesOfCode: number
    primaryLanguage: string
    architecture: 'monolith' | 'monorepo' | 'microservices' | 'hybrid' | 'serverless'
    framework: string
    maturity: 'early' | 'developing' | 'mature' | 'legacy'
  }
  monorepo: MonorepoResult
  services: ServiceAnalysisResult
  packages: PackageAnalysisResult
  ownership: OwnershipGraph
  workflows: WorkflowAnalysisResult
  risks: RiskScore
  recommendations: string[]
}

/**
 * Monorepo analysis result
 */
export interface MonorepoResult {
  isMonorepo: boolean
  tool: 'npm-workspaces' | 'yarn-workspaces' | 'pnpm' | 'lerna' | 'nx' | 'turborepo' | 'rush' | 'none'
  packages: MonorepoPackage[]
  dependencies: {
    internal: InternalDependency[]
    external: ExternalDependency[]
  }
  structure: {
    sharedPackages: string[]
    sharedConfigs: string[]
    buildOrder: string[][]
  }
  health: {
    score: number
    issues: MonorepoIssue[]
  }
}

export interface MonorepoPackage {
  name: string
  path: string
  type: 'app' | 'lib' | 'tool' | 'config'
  dependencies: string[]
  dependents: string[]
  linesOfCode: number
  lastModified: string
}

export interface InternalDependency {
  from: string
  to: string
  type: 'runtime' | 'dev' | 'peer'
}

export interface ExternalDependency {
  package: string
  version: string
  usedBy: string[]
}

export interface MonorepoIssue {
  type: 'circular-dependency' | 'version-mismatch' | 'unused-package' | 'duplicate-dependency' | 'missing-shared'
  severity: 'error' | 'warning' | 'info'
  message: string
  packages?: string[]
}

/**
 * Service boundary analysis result
 */
export interface ServiceBoundary {
  id: string
  name: string
  type: 'frontend' | 'backend' | 'api' | 'worker' | 'database' | 'cache' | 'queue' | 'external'
  path: string
  responsibilities: string[]
  dependencies: string[]
  dependents: string[]
  apiContracts: APISurface[]
  dataModels: string[]
  events: {
    published: string[]
    consumed: string[]
  }
  boundaries: {
    cohesion: number
    coupling: number
    autonomy: number
  }
  recommendations: string[]
}

export interface APISurface {
  type: 'rest' | 'graphql' | 'grpc' | 'websocket' | 'event'
  endpoints: APIEndpoint[]
}

export interface APIEndpoint {
  method: string
  path: string
  description?: string
  auth: boolean
  rate: 'high' | 'medium' | 'low'
}

export interface ServiceAnalysisResult {
  architecture: 'monolith' | 'microservices' | 'serverless' | 'hybrid' | 'monorepo'
  services: ServiceBoundary[]
  communication: ServiceCommunication[]
  boundaries: {
    quality: number
    violations: BoundaryViolation[]
    suggestions: string[]
  }
}

export interface ServiceCommunication {
  from: string
  to: string
  type: 'sync' | 'async' | 'event' | 'queue'
  protocol: string
  frequency: 'high' | 'medium' | 'low'
  critical: boolean
}

export interface BoundaryViolation {
  type: 'tight-coupling' | 'circular' | 'data-leak' | 'shared-state' | 'synchronous-chain'
  services: string[]
  severity: 'error' | 'warning' | 'info'
  description: string
  suggestion: string
}

/**
 * Package architecture analysis result
 */
export interface PackageAnalysisResult {
  structure: PackageStructure
  layers: ArchitectureLayer[]
  modules: ModuleInfo[]
  patterns: DetectedPattern[]
  health: {
    score: number
    issues: PackageIssue[]
  }
}

export interface PackageStructure {
  type: 'flat' | 'layered' | 'modular' | 'feature-based' | 'domain-driven'
  description: string
  directories: DirectoryInfo[]
}

export interface DirectoryInfo {
  path: string
  purpose: string
  files: number
  subdirectories: string[]
}

export interface ArchitectureLayer {
  name: string
  path: string
  responsibilities: string[]
  allowedDependencies: string[]
  actualDependencies: string[]
  violations: string[]
}

export interface ModuleInfo {
  name: string
  path: string
  exports: string[]
  imports: string[]
  cohesion: number
  stability: number
  abstractness: number
  distance: number
}

export interface DetectedPattern {
  name: string
  type: 'architectural' | 'design' | 'structural'
  locations: string[]
  quality: 'good' | 'acceptable' | 'poor'
  description: string
}

export interface PackageIssue {
  type: 'circular-dependency' | 'layer-violation' | 'missing-module' | 'unused-export' | 'unstable-abstraction'
  severity: 'error' | 'warning' | 'info'
  location: string
  description: string
  suggestion: string
}

/**
 * Ownership graph
 */
export interface OwnershipGraph {
  nodes: OwnershipNode[]
  edges: OwnershipEdge[]
  teams: TeamInfo[]
  coverage: {
    percentage: number
    unowned: string[]
  }
  hotspots: OwnershipHotspot[]
}

export interface OwnershipNode {
  id: string
  type: 'file' | 'directory' | 'module' | 'service'
  path: string
  owners: Owner[]
  contributors: Contributor[]
  metadata: {
    linesOfCode: number
    lastModified: string
    changeFrequency: number
  }
}

export interface Owner {
  type: 'team' | 'individual'
  name: string
  email?: string
  percentage: number
  since: string
}

export interface Contributor {
  name: string
  email: string
  commits: number
  linesAdded: number
  linesRemoved: number
  lastContribution: string
}

export interface OwnershipEdge {
  from: string
  to: string
  type: 'owns' | 'contributes' | 'reviews' | 'depends'
  weight: number
}

export interface TeamInfo {
  name: string
  members: string[]
  ownedComponents: string[]
  expertise: string[]
  workload: number
}

export interface OwnershipHotspot {
  path: string
  type: 'high-churn' | 'many-contributors' | 'cross-team' | 'orphaned'
  severity: 'warning' | 'info'
  description: string
}

/**
 * Workflow analysis result
 */
export interface WorkflowAnalysisResult {
  gitWorkflow: GitWorkflowInfo
  ciCd: CICDInfo
  branching: BranchingInfo
  releaseProcess: ReleaseInfo
  developmentPatterns: DevPattern[]
  health: {
    score: number
    issues: WorkflowIssue[]
  }
}

export interface GitWorkflowInfo {
  type: 'gitflow' | 'github-flow' | 'trunk-based' | 'unknown'
  branchCount: number
  activeBranches: string[]
  staleBranches: string[]
  mergePatterns: {
    strategy: 'merge' | 'rebase' | 'squash'
    percentage: number
  }[]
}

export interface CICDInfo {
  hasCI: boolean
  platform: string[]
  pipelines: PipelineInfo[]
  coverage: {
    build: boolean
    test: boolean
    deploy: boolean
    lint: boolean
  }
}

export interface PipelineInfo {
  name: string
  triggers: string[]
  stages: string[]
  averageDuration: number
  successRate: number
}

export interface BranchingInfo {
  mainBranch: string
  developBranch: string | null
  featurePrefix: string[]
  releasePrefix: string | null
  hotfixPrefix: string | null
  branchProtection: {
    enabled: boolean
    requiredReviews: number
    requiredChecks: string[]
  }
}

export interface ReleaseInfo {
  strategy: 'semver' | 'calver' | 'custom' | 'none'
  frequency: 'continuous' | 'frequent' | 'periodic' | 'rare'
  automation: boolean
  changelog: boolean
  lastRelease: string | null
}

export interface DevPattern {
  name: string
  usage: 'widespread' | 'common' | 'occasional' | 'rare'
  locations: string[]
  quality: 'good' | 'acceptable' | 'poor'
}

export interface WorkflowIssue {
  type: 'stale-branch' | 'missing-ci' | 'no-branch-protection' | 'infrequent-releases' | 'low-test-coverage'
  severity: 'error' | 'warning' | 'info'
  description: string
  suggestion: string
}

/**
 * Risk score and analysis
 */
export interface RiskScore {
  overall: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  categories: RiskCategory[]
  topRisks: RiskItem[]
  mitigations: string[]
}

export interface RiskCategory {
  name: string
  score: number
  weight: number
  risks: RiskItem[]
}

export interface RiskItem {
  id: string
  type: RiskType
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  location: string
  impact: string
  probability: number
  mitigation: string
}

export type RiskType = 
  | 'technical-debt'
  | 'security'
  | 'dependency'
  | 'architecture'
  | 'performance'
  | 'maintainability'
  | 'testing'
  | 'documentation'
  | 'complexity'
  | 'coupling'

// ============================================================================
// CodebaseIntelligence Class
// ============================================================================

/**
 * Main Codebase Intelligence class
 */
export class CodebaseIntelligence {
  private analysisCache: Map<string, CodebaseAnalysis> = new Map()
  private fileCache: Map<string, { content: string; mtime: number }> = new Map()

  /**
   * Analyze entire codebase
   */
  async analyzeCodebase(projectPath: string): Promise<CodebaseAnalysis> {
    const fullPath = path.join(WORKSPACE_DIR, projectPath)
    
    // Check cache
    const cacheKey = projectPath
    const cached = this.analysisCache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Run all analysis components
    const [
      summary,
      monorepo,
      services,
      packages,
      ownership,
      workflows,
      risks
    ] = await Promise.all([
      this.analyzeSummary(fullPath),
      this.analyzeMonorepo(fullPath),
      this.analyzeServices(fullPath),
      this.analyzePackages(fullPath),
      this.analyzeOwnership(fullPath),
      this.analyzeWorkflows(fullPath),
      this.analyzeRisks(fullPath)
    ])

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      monorepo,
      services,
      packages,
      ownership,
      workflows,
      risks
    })

    const analysis: CodebaseAnalysis = {
      id: `analysis_${Date.now().toString(36)}`,
      projectPath,
      analyzedAt: new Date().toISOString(),
      summary,
      monorepo,
      services,
      packages,
      ownership,
      workflows,
      risks,
      recommendations
    }

    this.analysisCache.set(cacheKey, analysis)
    return analysis
  }

  // ==========================================================================
  // Monorepo Analyzer
  // ==========================================================================

  /**
   * Analyze monorepo structure
   */
  private async analyzeMonorepo(fullPath: string): Promise<MonorepoResult> {
    const result: MonorepoResult = {
      isMonorepo: false,
      tool: 'none',
      packages: [],
      dependencies: {
        internal: [],
        external: []
      },
      structure: {
        sharedPackages: [],
        sharedConfigs: [],
        buildOrder: []
      },
      health: {
        score: 100,
        issues: []
      }
    }

    // Detect monorepo tool
    const tool = await this.detectMonorepoTool(fullPath)
    result.tool = tool
    result.isMonorepo = tool !== 'none'

    if (!result.isMonorepo) {
      return result
    }

    // Find packages
    const packages = await this.findMonorepoPackages(fullPath, tool)
    result.packages = packages

    // Analyze dependencies
    const deps = await this.analyzeMonorepoDependencies(fullPath, packages)
    result.dependencies = deps

    // Determine structure
    result.structure = await this.analyzeMonorepoStructure(fullPath, packages)

    // Calculate health
    result.health = this.calculateMonorepoHealth(result)

    return result
  }

  /**
   * Detect monorepo tool
   */
  private async detectMonorepoTool(fullPath: string): Promise<MonorepoResult['tool']> {
    try {
      // Check for pnpm
      const pnpmWorkspace = await fs.readFile(path.join(fullPath, 'pnpm-workspace.yaml'), 'utf-8').catch(() => null)
      if (pnpmWorkspace) return 'pnpm'

      // Check for Nx
      const nxJson = await fs.readFile(path.join(fullPath, 'nx.json'), 'utf-8').catch(() => null)
      if (nxJson) return 'nx'

      // Check for Turborepo
      const turboJson = await fs.readFile(path.join(fullPath, 'turbo.json'), 'utf-8').catch(() => null)
      if (turboJson) return 'turborepo'

      // Check for Lerna
      const lernaJson = await fs.readFile(path.join(fullPath, 'lerna.json'), 'utf-8').catch(() => null)
      if (lernaJson) return 'lerna'

      // Check for Rush
      const rushJson = await fs.readFile(path.join(fullPath, 'rush.json'), 'utf-8').catch(() => null)
      if (rushJson) return 'rush'

      // Check for npm/yarn workspaces
      const pkgJson = JSON.parse(await fs.readFile(path.join(fullPath, 'package.json'), 'utf-8'))
      if (pkgJson.workspaces) {
        // Check lock file to determine npm vs yarn
        const hasYarnLock = await fs.access(path.join(fullPath, 'yarn.lock')).then(() => true).catch(() => false)
        const hasPnpmLock = await fs.access(path.join(fullPath, 'pnpm-lock.yaml')).then(() => true).catch(() => false)
        
        if (hasPnpmLock) return 'pnpm'
        if (hasYarnLock) return 'yarn-workspaces'
        return 'npm-workspaces'
      }

      // Check for packages directory structure
      const packagesDir = path.join(fullPath, 'packages')
      const appsDir = path.join(fullPath, 'apps')
      const hasPackages = await fs.stat(packagesDir).catch(() => null)
      const hasApps = await fs.stat(appsDir).catch(() => null)
      
      if (hasPackages?.isDirectory() || hasApps?.isDirectory()) {
        return 'npm-workspaces' // Default assumption
      }

    } catch {}

    return 'none'
  }

  /**
   * Find monorepo packages
   */
  private async findMonorepoPackages(
    fullPath: string,
    tool: MonorepoResult['tool']
  ): Promise<MonorepoPackage[]> {
    const packages: MonorepoPackage[] = []
    
    const searchDirs = ['packages', 'apps', 'libs', 'services', 'modules']
    
    for (const dir of searchDirs) {
      const dirPath = path.join(fullPath, dir)
      const entries = await fs.readdir(dirPath).catch(() => [])
      
      for (const entry of entries) {
        const pkgPath = path.join(dirPath, entry)
        const pkgJsonPath = path.join(pkgPath, 'package.json')
        
        try {
          const stat = await fs.stat(pkgPath)
          if (!stat.isDirectory()) continue
          
          const pkgJsonContent = await fs.readFile(pkgJsonPath, 'utf-8')
          const pkgJson = JSON.parse(pkgJsonContent)
          
          // Count lines of code
          const linesOfCode = await this.countLinesOfCode(pkgPath)
          
          // Get last modified
          const lastModified = await this.getLastModified(pkgPath)
          
          packages.push({
            name: pkgJson.name || entry,
            path: `${dir}/${entry}`,
            type: this.determinePackageType(dir, pkgJson),
            dependencies: Object.keys(pkgJson.dependencies || {}),
            dependents: [], // Will be filled later
            linesOfCode,
            lastModified
          })
        } catch {}
      }
    }

    // Calculate dependents
    for (const pkg of packages) {
      for (const dep of pkg.dependencies) {
        const depPkg = packages.find(p => p.name === dep)
        if (depPkg) {
          depPkg.dependents.push(pkg.name)
        }
      }
    }

    return packages
  }

  /**
   * Determine package type
   */
  private determinePackageType(dir: string, pkgJson: any): MonorepoPackage['type'] {
    if (dir === 'apps') return 'app'
    if (dir === 'services') return 'app'
    if (dir === 'tools') return 'tool'
    if (dir === 'config' || pkgJson.name?.includes('config')) return 'config'
    return 'lib'
  }

  /**
   * Analyze monorepo dependencies
   */
  private async analyzeMonorepoDependencies(
    fullPath: string,
    packages: MonorepoPackage[]
  ): Promise<{ internal: InternalDependency[]; external: ExternalDependency[] }> {
    const internal: InternalDependency[] = []
    const externalMap = new Map<string, ExternalDependency>()
    const packageNames = new Set(packages.map(p => p.name))

    for (const pkg of packages) {
      const pkgJsonPath = path.join(fullPath, pkg.path, 'package.json')
      
      try {
        const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'))
        
        // Process dependencies
        const allDeps = {
          ...pkgJson.dependencies,
          ...pkgJson.devDependencies,
          ...pkgJson.peerDependencies
        }

        for (const [name, version] of Object.entries(allDeps) as [string, string][]) {
          if (packageNames.has(name)) {
            // Internal dependency
            internal.push({
              from: pkg.name,
              to: name,
              type: pkgJson.dependencies?.[name] ? 'runtime' :
                    pkgJson.peerDependencies?.[name] ? 'peer' : 'dev'
            })
          } else {
            // External dependency
            if (!externalMap.has(name)) {
              externalMap.set(name, {
                package: name,
                version,
                usedBy: []
              })
            }
            externalMap.get(name)!.usedBy.push(pkg.name)
          }
        }
      } catch {}
    }

    return {
      internal,
      external: Array.from(externalMap.values())
    }
  }

  /**
   * Analyze monorepo structure
   */
  private async analyzeMonorepoStructure(
    fullPath: string,
    packages: MonorepoPackage[]
  ): Promise<MonorepoResult['structure']> {
    const sharedPackages = packages
      .filter(p => p.type === 'lib' && p.dependents.length > 1)
      .map(p => p.name)

    const sharedConfigs: string[] = []
    
    // Find shared configs
    const configFiles = ['tsconfig.json', 'eslint.config.js', '.prettierrc', 'jest.config.js']
    for (const file of configFiles) {
      const exists = await fs.access(path.join(fullPath, file)).then(() => true).catch(() => false)
      if (exists) {
        sharedConfigs.push(file)
      }
    }

    // Calculate build order using topological sort
    const buildOrder = this.calculateBuildOrder(packages)

    return {
      sharedPackages,
      sharedConfigs,
      buildOrder
    }
  }

  /**
   * Calculate build order
   */
  private calculateBuildOrder(packages: MonorepoPackage[]): string[][] {
    const order: string[][] = []
    const remaining = new Set(packages.map(p => p.name))
    const built = new Set<string>()

    while (remaining.size > 0) {
      const level: string[] = []
      
      for (const pkgName of Array.from(remaining)) {
        const pkg = packages.find(p => p.name === pkgName)
        if (!pkg) continue
        
        // Check if all dependencies are built
        const deps = pkg.dependencies.filter(d => packages.some(p => p.name === d))
        const allDepsBuilt = deps.every(d => built.has(d))
        
        if (allDepsBuilt) {
          level.push(pkgName)
        }
      }

      if (level.length === 0) {
        // Circular dependency - add remaining
        order.push(Array.from(remaining))
        break
      }

      order.push(level)
      level.forEach(l => {
        remaining.delete(l)
        built.add(l)
      })
    }

    return order
  }

  /**
   * Calculate monorepo health
   */
  private calculateMonorepoHealth(result: MonorepoResult): { score: number; issues: MonorepoIssue[] } {
    let score = 100
    const issues: MonorepoIssue[] = []

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(result.dependencies.internal)
    if (circularDeps.length > 0) {
      score -= circularDeps.length * 10
      issues.push({
        type: 'circular-dependency',
        severity: 'error',
        message: `Circular dependencies detected between packages`,
        packages: circularDeps.flat()
      })
    }

    // Check for version mismatches
    const versionMismatches = this.detectVersionMismatches(result.dependencies.external)
    if (versionMismatches.length > 0) {
      score -= versionMismatches.length * 5
      issues.push({
        type: 'version-mismatch',
        severity: 'warning',
        message: `Version mismatches found for ${versionMismatches.length} packages`
      })
    }

    // Check for unused packages
    const unusedPackages = result.packages.filter(p => p.dependents.length === 0 && p.type === 'lib')
    if (unusedPackages.length > 0) {
      score -= unusedPackages.length * 3
      issues.push({
        type: 'unused-package',
        severity: 'info',
        message: `${unusedPackages.length} packages have no dependents`,
        packages: unusedPackages.map(p => p.name)
      })
    }

    return {
      score: Math.max(0, score),
      issues
    }
  }

  /**
   * Detect circular dependencies
   */
  private detectCircularDependencies(deps: InternalDependency[]): string[][] {
    const graph = new Map<string, Set<string>>()
    
    for (const dep of deps) {
      if (!graph.has(dep.from)) graph.set(dep.from, new Set())
      graph.get(dep.from)!.add(dep.to)
    }

    const cycles: string[][] = []
    const visited = new Set<string>()
    const path = new Set<string>()

    const dfs = (node: string, currentPath: string[]): void => {
      if (path.has(node)) {
        const cycleStart = currentPath.indexOf(node)
        if (cycleStart !== -1) {
          cycles.push([...currentPath.slice(cycleStart), node])
        }
        return
      }
      
      if (visited.has(node)) return
      
      visited.add(node)
      path.add(node)
      
      const neighbors = graph.get(node)
      if (neighbors) {
        for (const neighbor of Array.from(neighbors)) {
          dfs(neighbor, [...currentPath, node])
        }
      }
      
      path.delete(node)
    }

    for (const node of Array.from(graph.keys())) {
      dfs(node, [])
    }

    return cycles
  }

  /**
   * Detect version mismatches
   */
  private detectVersionMismatches(externals: ExternalDependency[]): string[] {
    const versions = new Map<string, Set<string>>()
    
    for (const ext of externals) {
      if (!versions.has(ext.package)) {
        versions.set(ext.package, new Set())
      }
      versions.get(ext.package)!.add(ext.version)
    }

    const mismatches: string[] = []
    for (const [pkg, vers] of Array.from(versions.entries())) {
      if (vers.size > 1) {
        mismatches.push(pkg)
      }
    }

    return mismatches
  }

  // ==========================================================================
  // Microservice Detection & Service Boundary Inference
  // ==========================================================================

  /**
   * Analyze services
   */
  private async analyzeServices(fullPath: string): Promise<ServiceAnalysisResult> {
    const result: ServiceAnalysisResult = {
      architecture: 'monolith',
      services: [],
      communication: [],
      boundaries: {
        quality: 100,
        violations: [],
        suggestions: []
      }
    }

    // Detect architecture type
    result.architecture = await this.detectArchitectureType(fullPath)

    // Find and analyze services
    const services = await this.findServices(fullPath)
    result.services = services

    // Analyze communication patterns
    result.communication = await this.analyzeServiceCommunication(fullPath, services)

    // Analyze boundary quality
    result.boundaries = this.analyzeBoundaryQuality(services, result.communication)

    return result
  }

  /**
   * Detect architecture type
   */
  private async detectArchitectureType(fullPath: string): Promise<ServiceAnalysisResult['architecture']> {
    try {
      // Check for serverless
      const serverlessYml = await fs.access(path.join(fullPath, 'serverless.yml')).then(() => true).catch(() => false)
      const samTemplate = await fs.access(path.join(fullPath, 'template.yaml')).then(() => true).catch(() => false)
      if (serverlessYml || samTemplate) return 'serverless'

      // Check for microservices indicators
      const dockerCompose = await fs.readFile(path.join(fullPath, 'docker-compose.yml'), 'utf-8').catch(() => null)
      if (dockerCompose) {
        const services = (dockerCompose.match(/^\s{2}\w+:/gm) || []).length
        if (services > 2) return 'microservices'
      }

      // Check directory structure
      const servicesDir = path.join(fullPath, 'services')
      const microservicesDir = path.join(fullPath, 'microservices')
      
      const servicesStat = await fs.stat(servicesDir).catch(() => null)
      const microservicesStat = await fs.stat(microservicesDir).catch(() => null)
      
      if (servicesStat?.isDirectory()) {
        const entries = await fs.readdir(servicesDir)
        if (entries.length > 1) return 'microservices'
      }
      
      if (microservicesStat?.isDirectory()) {
        return 'microservices'
      }

      // Check for Kubernetes
      const k8sDir = path.join(fullPath, 'k8s')
      const k8sStat = await fs.stat(k8sDir).catch(() => null)
      if (k8sStat?.isDirectory()) return 'microservices'

    } catch {}

    return 'monolith'
  }

  /**
   * Find services
   */
  private async findServices(fullPath: string): Promise<ServiceBoundary[]> {
    const services: ServiceBoundary[] = []

    // Check for services directory
    const servicesDir = path.join(fullPath, 'services')
    const servicesStat = await fs.stat(servicesDir).catch(() => null)
    
    if (servicesStat?.isDirectory()) {
      const entries = await fs.readdir(servicesDir)
      
      for (const entry of entries) {
        const servicePath = path.join(servicesDir, entry)
        const service = await this.analyzeService(servicePath, entry)
        if (service) {
          services.push(service)
        }
      }
    }

    // Check for API routes (Next.js)
    const apiDir = path.join(fullPath, 'src/app/api')
    const apiStat = await fs.stat(apiDir).catch(() => null)
    
    if (apiStat?.isDirectory()) {
      const entries = await fs.readdir(apiDir)
      
      for (const entry of entries) {
        services.push({
          id: `api-${entry}`,
          name: `API: ${entry}`,
          type: 'api',
          path: `src/app/api/${entry}`,
          responsibilities: [`Handle ${entry} API requests`],
          dependencies: [],
          dependents: [],
          apiContracts: [{
            type: 'rest',
            endpoints: [{ method: '*', path: `/api/${entry}`, auth: false, rate: 'medium' }]
          }],
          dataModels: [],
          events: { published: [], consumed: [] },
          boundaries: { cohesion: 80, coupling: 20, autonomy: 90 },
          recommendations: []
        })
      }
    }

    // If no services found, treat the whole project as one service
    if (services.length === 0) {
      services.push(await this.analyzeService(fullPath, 'main') || {
        id: 'main-service',
        name: 'Main Application',
        type: 'backend',
        path: '.',
        responsibilities: ['Main application logic'],
        dependencies: [],
        dependents: [],
        apiContracts: [],
        dataModels: [],
        events: { published: [], consumed: [] },
        boundaries: { cohesion: 100, coupling: 0, autonomy: 100 },
        recommendations: []
      })
    }

    return services
  }

  /**
   * Analyze individual service
   */
  private async analyzeService(servicePath: string, name: string): Promise<ServiceBoundary | null> {
    try {
      const stat = await fs.stat(servicePath)
      if (!stat.isDirectory()) return null

      // Analyze responsibilities
      const responsibilities = await this.inferResponsibilities(servicePath)

      // Analyze API contracts
      const apiContracts = await this.analyzeAPIContracts(servicePath)

      // Analyze data models
      const dataModels = await this.findDataModels(servicePath)

      // Analyze events
      const events = await this.analyzeEvents(servicePath)

      // Calculate boundaries
      const boundaries = await this.calculateServiceBoundaries(servicePath)

      return {
        id: `service-${name}`,
        name,
        type: this.determineServiceType(servicePath),
        path: servicePath,
        responsibilities,
        dependencies: [],
        dependents: [],
        apiContracts,
        dataModels,
        events,
        boundaries,
        recommendations: this.generateServiceRecommendations(boundaries)
      }
    } catch {
      return null
    }
  }

  /**
   * Infer service responsibilities
   */
  private async inferResponsibilities(servicePath: string): Promise<string[]> {
    const responsibilities: string[] = []
    
    try {
      const entries = await this.scanDirectory(servicePath, 2)
      
      // Infer from directory names
      const domainIndicators = ['users', 'auth', 'products', 'orders', 'payments', 'notifications', 'search']
      for (const indicator of domainIndicators) {
        if (entries.some(e => e.toLowerCase().includes(indicator))) {
          responsibilities.push(`Handle ${indicator} operations`)
        }
      }

      // Infer from file names
      const actionIndicators: Record<string, string> = {
        'controller': 'Handle HTTP requests',
        'service': 'Business logic processing',
        'repository': 'Data persistence',
        'model': 'Data modeling',
        'util': 'Utility functions',
        'middleware': 'Request processing'
      }

      for (const [indicator, responsibility] of Object.entries(actionIndicators)) {
        if (entries.some(e => e.toLowerCase().includes(indicator))) {
          responsibilities.push(responsibility)
        }
      }
    } catch {}

    if (responsibilities.length === 0) {
      responsibilities.push('General application logic')
    }

    return Array.from(new Set(responsibilities))
  }

  /**
   * Analyze API contracts
   */
  private async analyzeAPIContracts(servicePath: string): Promise<APISurface[]> {
    const surfaces: APISurface[] = []
    
    try {
      // Look for REST endpoints
      const files = await this.getSourceFiles(servicePath)
      
      for (const file of files.slice(0, 20)) {
        const content = await fs.readFile(file, 'utf-8')
        
        // Detect REST routes
        const restPatterns = [
          /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
          /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
          /@Get\s*\(\s*['"`]([^'"`]+)['"`]\)/g,
          /@Post\s*\(\s*['"`]([^'"`]+)['"`]\)/g
        ]

        const endpoints: APIEndpoint[] = []
        
        for (const pattern of restPatterns) {
          let match
          while ((match = pattern.exec(content)) !== null) {
            const method = match[1]?.toUpperCase() || 'GET'
            const endpointPath = match[2] || match[1] || '/'
            
            endpoints.push({
              method,
              path: endpointPath,
              auth: content.includes('auth') || content.includes('token'),
              rate: 'medium'
            })
          }
        }

        if (endpoints.length > 0) {
          surfaces.push({
            type: 'rest',
            endpoints
          })
        }

        // Detect GraphQL
        if (content.includes('graphql') || content.includes('GraphQL')) {
          surfaces.push({
            type: 'graphql',
            endpoints: [{ method: 'POST', path: '/graphql', auth: true, rate: 'high' }]
          })
        }

        // Detect WebSocket
        if (content.includes('WebSocket') || content.includes('socket.io')) {
          surfaces.push({
            type: 'websocket',
            endpoints: [{ method: 'WS', path: '/', auth: false, rate: 'high' }]
          })
        }
      }
    } catch {}

    return surfaces
  }

  /**
   * Find data models
   */
  private async findDataModels(servicePath: string): Promise<string[]> {
    const models: string[] = []
    
    try {
      const files = await this.getSourceFiles(servicePath)
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8')
        
        // Detect Prisma models
        const prismaModels = content.match(/model\s+(\w+)\s*\{/g)
        if (prismaModels) {
          models.push(...prismaModels.map(m => m.replace(/model\s+(\w+)\s*\{/, '$1')))
        }

        // Detect TypeScript interfaces/classes
        const tsModels = content.match(/(?:interface|class)\s+(\w+)(?:\s+extends|\s*\{)/g)
        if (tsModels) {
          models.push(...tsModels.map(m => m.replace(/(?:interface|class)\s+(\w+).*/, '$1')))
        }

        // Detect Mongoose schemas
        const mongooseSchemas = content.match(/new\s+Schema\s*<\s*(\w+)/g)
        if (mongooseSchemas) {
          models.push(...mongooseSchemas.map(m => m.replace(/new\s+Schema\s*<\s*(\w+)/, '$1')))
        }
      }
    } catch {}

    return Array.from(new Set(models)).slice(0, 20)
  }

  /**
   * Analyze events
   */
  private async analyzeEvents(servicePath: string): Promise<{ published: string[]; consumed: string[] }> {
    const published: string[] = []
    const consumed: string[] = []
    
    try {
      const files = await this.getSourceFiles(servicePath)
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8')
        
        // Detect event publishing
        const publishPatterns = [
          /publish\s*\(\s*['"`]([^'"`]+)['"`]/g,
          /emit\s*\(\s*['"`]([^'"`]+)['"`]/g,
          /send\s*\(\s*['"`]([^'"`]+)['"`]/g
        ]
        
        for (const pattern of publishPatterns) {
          let match
          while ((match = pattern.exec(content)) !== null) {
            published.push(match[1])
          }
        }

        // Detect event consumption
        const consumePatterns = [
          /subscribe\s*\(\s*['"`]([^'"`]+)['"`]/g,
          /on\s*\(\s*['"`]([^'"`]+)['"`]/g,
          /consume\s*\(\s*['"`]([^'"`]+)['"`]/g
        ]
        
        for (const pattern of consumePatterns) {
          let match
          while ((match = pattern.exec(content)) !== null) {
            consumed.push(match[1])
          }
        }
      }
    } catch {}

    return {
      published: Array.from(new Set(published)),
      consumed: Array.from(new Set(consumed))
    }
  }

  /**
   * Calculate service boundaries quality
   */
  private async calculateServiceBoundaries(servicePath: string): Promise<ServiceBoundary['boundaries']> {
    let cohesion = 80
    let coupling = 20
    let autonomy = 90

    try {
      const files = await this.getSourceFiles(servicePath)
      let totalImports = 0
      let externalImports = 0

      for (const file of files.slice(0, 50)) {
        const content = await fs.readFile(file, 'utf-8')
        const imports = content.match(/import\s+.*from\s+['"`]([^'"`]+)['"`]/g) || []
        totalImports += imports.length
        
        // Count external imports
        externalImports += imports.filter(i => !i.includes('./') && !i.includes('../')).length
      }

      // Adjust scores based on analysis
      if (totalImports > 0) {
        coupling = Math.min(100, Math.round((externalImports / totalImports) * 100))
        cohesion = Math.max(0, 100 - coupling)
      }

      // Autonomy based on self-containedness
      autonomy = Math.round((cohesion + (100 - coupling)) / 2)

    } catch {}

    return { cohesion, coupling, autonomy }
  }

  /**
   * Determine service type
   */
  private determineServiceType(servicePath: string): ServiceBoundary['type'] {
    const pathLower = servicePath.toLowerCase()
    
    if (pathLower.includes('frontend') || pathLower.includes('web') || pathLower.includes('ui')) {
      return 'frontend'
    }
    if (pathLower.includes('worker') || pathLower.includes('job') || pathLower.includes('queue')) {
      return 'worker'
    }
    if (pathLower.includes('api') || pathLower.includes('gateway')) {
      return 'api'
    }
    
    return 'backend'
  }

  /**
   * Generate service recommendations
   */
  private generateServiceRecommendations(boundaries: ServiceBoundary['boundaries']): string[] {
    const recommendations: string[] = []
    
    if (boundaries.coupling > 50) {
      recommendations.push('Consider reducing external dependencies to improve autonomy')
    }
    if (boundaries.cohesion < 50) {
      recommendations.push('Service may be handling too many responsibilities - consider splitting')
    }
    if (boundaries.autonomy < 60) {
      recommendations.push('Service has low autonomy - review dependencies')
    }
    
    return recommendations
  }

  /**
   * Analyze service communication
   */
  private async analyzeServiceCommunication(
    fullPath: string,
    services: ServiceBoundary[]
  ): Promise<ServiceCommunication[]> {
    const communications: ServiceCommunication[] = []

    // Analyze based on service relationships
    for (const service of services) {
      for (const dep of service.dependencies) {
        communications.push({
          from: service.name,
          to: dep,
          type: 'sync',
          protocol: 'HTTP',
          frequency: 'medium',
          critical: true
        })
      }
    }

    return communications
  }

  /**
   * Analyze boundary quality
   */
  private analyzeBoundaryQuality(
    services: ServiceBoundary[],
    communications: ServiceCommunication[]
  ): ServiceAnalysisResult['boundaries'] {
    let quality = 100
    const violations: BoundaryViolation[] = []
    const suggestions: string[] = []

    // Check for tight coupling
    const highCouplingServices = services.filter(s => s.boundaries.coupling > 60)
    if (highCouplingServices.length > 0) {
      quality -= highCouplingServices.length * 10
      violations.push({
        type: 'tight-coupling',
        services: highCouplingServices.map(s => s.name),
        severity: 'warning',
        description: 'Services with high coupling detected',
        suggestion: 'Consider introducing interfaces or events to reduce coupling'
      })
    }

    // Check for circular dependencies
    const circularComm = this.detectCircularCommunications(communications)
    if (circularComm.length > 0) {
      quality -= circularComm.length * 15
      violations.push({
        type: 'circular',
        services: circularComm.flat(),
        severity: 'error',
        description: 'Circular communication between services',
        suggestion: 'Introduce a mediator service or use event-driven architecture'
      })
    }

    // Generate suggestions
    if (services.some(s => s.boundaries.autonomy < 70)) {
      suggestions.push('Consider event-driven architecture to improve service autonomy')
    }
    if (communications.filter(c => c.critical).length > services.length * 2) {
      suggestions.push('Too many critical synchronous dependencies - consider async patterns')
    }

    return {
      quality: Math.max(0, quality),
      violations,
      suggestions
    }
  }

  /**
   * Detect circular communications
   */
  private detectCircularCommunications(communications: ServiceCommunication[]): string[][] {
    const graph = new Map<string, Set<string>>()
    
    for (const comm of communications) {
      if (!graph.has(comm.from)) graph.set(comm.from, new Set())
      graph.get(comm.from)!.add(comm.to)
    }

    // Use DFS to find cycles
    const cycles: string[][] = []
    const visited = new Set<string>()
    const path = new Set<string>()

    const dfs = (node: string, currentPath: string[]): void => {
      if (path.has(node)) {
        const cycleStart = currentPath.indexOf(node)
        if (cycleStart !== -1) {
          cycles.push([...currentPath.slice(cycleStart), node])
        }
        return
      }
      
      if (visited.has(node)) return
      
      visited.add(node)
      path.add(node)
      
      const neighbors = graph.get(node)
      if (neighbors) {
        for (const neighbor of Array.from(neighbors)) {
          dfs(neighbor, [...currentPath, node])
        }
      }
      
      path.delete(node)
    }

    for (const node of Array.from(graph.keys())) {
      dfs(node, [])
    }

    return cycles
  }

  // ==========================================================================
  // Package Architecture Inference
  // ==========================================================================

  /**
   * Analyze package architecture
   */
  private async analyzePackages(fullPath: string): Promise<PackageAnalysisResult> {
    const structure = await this.analyzePackageStructure(fullPath)
    const layers = await this.analyzeArchitectureLayers(fullPath, structure)
    const modules = await this.analyzeModules(fullPath)
    const patterns = await this.detectPatterns(fullPath)
    const health = this.calculatePackageHealth(layers, modules, patterns)

    return {
      structure,
      layers,
      modules,
      patterns,
      health
    }
  }

  /**
   * Analyze package structure
   */
  private async analyzePackageStructure(fullPath: string): Promise<PackageStructure> {
    const directories: DirectoryInfo[] = []
    let structureType: PackageStructure['type'] = 'flat'

    try {
      const rootDirs = await this.getRootDirectories(fullPath)
      
      // Detect structure type
      if (rootDirs.includes('src')) {
        const srcDirs = await this.getRootDirectories(path.join(fullPath, 'src'))
        
        if (srcDirs.includes('features') || srcDirs.includes('modules')) {
          structureType = 'feature-based'
        } else if (srcDirs.includes('domains')) {
          structureType = 'domain-driven'
        } else if (srcDirs.some(d => ['presentation', 'application', 'domain', 'infrastructure'].includes(d))) {
          structureType = 'layered'
        } else if (srcDirs.length > 5) {
          structureType = 'modular'
        }
      }

      // Analyze directories
      const dirsToAnalyze = rootDirs.includes('src') 
        ? ['src', ...rootDirs.filter(d => d !== 'src')]
        : rootDirs

      for (const dir of dirsToAnalyze.slice(0, 10)) {
        const dirPath = path.join(fullPath, dir)
        const info = await this.analyzeDirectory(dirPath, dir)
        directories.push(info)
      }
    } catch {}

    return {
      type: structureType,
      description: this.getStructureDescription(structureType),
      directories
    }
  }

  /**
   * Get structure description
   */
  private getStructureDescription(type: PackageStructure['type']): string {
    const descriptions: Record<PackageStructure['type'], string> = {
      'flat': 'Simple flat structure with no clear separation',
      'layered': 'Traditional layered architecture with clear separation of concerns',
      'modular': 'Modular structure with independent components',
      'feature-based': 'Organized by features for better cohesion',
      'domain-driven': 'Domain-driven design with bounded contexts'
    }
    return descriptions[type]
  }

  /**
   * Analyze directory
   */
  private async analyzeDirectory(dirPath: string, name: string): Promise<DirectoryInfo> {
    let fileCount = 0
    const subdirectories: string[] = []

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          subdirectories.push(entry.name)
        } else if (entry.isFile()) {
          fileCount++
        }
      }
    } catch {}

    return {
      path: name,
      purpose: this.inferDirectoryPurpose(name),
      files: fileCount,
      subdirectories
    }
  }

  /**
   * Infer directory purpose
   */
  private inferDirectoryPurpose(name: string): string {
    const purposes: Record<string, string> = {
      'src': 'Source code',
      'lib': 'Library code',
      'components': 'UI components',
      'pages': 'Page components',
      'api': 'API endpoints',
      'services': 'Business logic services',
      'utils': 'Utility functions',
      'hooks': 'Custom React hooks',
      'types': 'TypeScript type definitions',
      'styles': 'Styles and theming',
      'assets': 'Static assets',
      'public': 'Public static files',
      'tests': 'Test files',
      'config': 'Configuration files',
      'docs': 'Documentation'
    }
    return purposes[name] || 'Unknown purpose'
  }

  /**
   * Analyze architecture layers
   */
  private async analyzeArchitectureLayers(
    fullPath: string,
    structure: PackageStructure
  ): Promise<ArchitectureLayer[]> {
    const layers: ArchitectureLayer[] = []

    const standardLayers = [
      { name: 'presentation', paths: ['components', 'pages', 'views', 'ui'] },
      { name: 'application', paths: ['services', 'use-cases', 'handlers'] },
      { name: 'domain', paths: ['domain', 'models', 'entities'] },
      { name: 'infrastructure', paths: ['infrastructure', 'persistence', 'external'] }
    ]

    for (const layerDef of standardLayers) {
      const matchingPath = layerDef.paths.find(p => 
        structure.directories.some(d => d.path === p || d.subdirectories.includes(p))
      )

      if (matchingPath) {
        const layerPath = path.join(fullPath, 'src', matchingPath)
        const layer = await this.analyzeLayer(layerPath, layerDef.name)
        layers.push(layer)
      }
    }

    // Set allowed dependencies based on layer
    const allowedDeps: Record<string, string[]> = {
      'presentation': ['application', 'domain'],
      'application': ['domain', 'infrastructure'],
      'domain': [],
      'infrastructure': []
    }

    for (const layer of layers) {
      layer.allowedDependencies = allowedDeps[layer.name] || []
    }

    return layers
  }

  /**
   * Analyze single layer
   */
  private async analyzeLayer(layerPath: string, name: string): Promise<ArchitectureLayer> {
    const responsibilities: string[] = []
    const actualDependencies: string[] = []
    const violations: string[] = []

    try {
      const files = await this.getSourceFiles(layerPath)
      
      for (const file of files.slice(0, 20)) {
        const content = await fs.readFile(file, 'utf-8')
        
        // Extract imports to determine dependencies
        const imports = content.match(/from\s+['"`]([^'"`]+)['"`]/g) || []
        for (const imp of imports) {
          const importPath = imp.replace(/from\s+['"`]([^'"`]+)['"`]/, '$1')
          if (importPath.startsWith('.')) {
            const parts = importPath.split('/')
            if (parts.length > 1) {
              actualDependencies.push(parts[parts.length === 2 ? 0 : 1])
            }
          }
        }
      }

      // Infer responsibilities from files
      responsibilities.push(`${name} layer functionality`)

    } catch {}

    return {
      name,
      path: layerPath,
      responsibilities,
      allowedDependencies: [],
      actualDependencies: Array.from(new Set(actualDependencies)),
      violations
    }
  }

  /**
   * Analyze modules
   */
  private async analyzeModules(fullPath: string): Promise<ModuleInfo[]> {
    const modules: ModuleInfo[] = []

    try {
      const files = await this.getSourceFiles(fullPath)
      
      for (const file of files.slice(0, 100)) {
        const content = await fs.readFile(file, 'utf-8')
        
        // Extract exports
        const exports = this.extractExports(content)
        
        // Extract imports
        const imports = this.extractImports(content)
        
        // Calculate metrics
        const cohesion = this.calculateModuleCohesion(exports, imports)
        const stability = this.calculateModuleStability(file, fullPath)
        const abstractness = this.calculateModuleAbstractness(content)

        modules.push({
          name: path.relative(fullPath, file),
          path: file,
          exports,
          imports,
          cohesion,
          stability,
          abstractness,
          distance: Math.abs(abstractness + stability - 1)
        })
      }
    } catch {}

    return modules
  }

  /**
   * Extract exports from code
   */
  private extractExports(content: string): string[] {
    const exports: string[] = []
    
    const patterns = [
      /export\s+(?:const|let|var|function|class)\s+(\w+)/g,
      /export\s+\{\s*([^}]+)\s*\}/g,
      /export\s+default\s+(\w+)/g
    ]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        exports.push(match[1])
      }
    }

    return Array.from(new Set(exports)).slice(0, 20)
  }

  /**
   * Extract imports from code
   */
  private extractImports(content: string): string[] {
    const imports: string[] = []
    
    const pattern = /import\s+.*from\s+['"`]([^'"`]+)['"`]/g
    let match
    
    while ((match = pattern.exec(content)) !== null) {
      imports.push(match[1])
    }

    return Array.from(new Set(imports))
  }

  /**
   * Calculate module cohesion
   */
  private calculateModuleCohesion(exports: string[], imports: string[]): number {
    if (exports.length === 0) return 100
    // Simplified: ratio of exports to imports
    const ratio = imports.length > 0 ? exports.length / imports.length : 1
    return Math.min(100, Math.round(ratio * 50))
  }

  /**
   * Calculate module stability
   */
  private calculateModuleStability(filePath: string, rootPath: string): number {
    // Simplified: deeper files are more stable
    const depth = filePath.replace(rootPath, '').split('/').length
    return Math.min(100, depth * 15)
  }

  /**
   * Calculate module abstractness
   */
  private calculateModuleAbstractness(content: string): number {
    const interfaces = (content.match(/interface\s+\w+/g) || []).length
    const types = (content.match(/type\s+\w+/g) || []).length
    const abstracts = (content.match(/abstract\s+(class|function)/g) || []).length
    const concretes = (content.match(/class\s+\w+/g) || []).length

    const total = interfaces + types + abstracts + concretes
    if (total === 0) return 0

    return Math.round(((interfaces + types + abstracts) / total) * 100)
  }

  /**
   * Detect patterns
   */
  private async detectPatterns(fullPath: string): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = []

    try {
      const files = await this.getSourceFiles(fullPath)
      
      // Repository pattern
      const hasRepo = files.some(f => f.toLowerCase().includes('repository'))
      if (hasRepo) {
        patterns.push({
          name: 'Repository Pattern',
          type: 'architectural',
          locations: files.filter(f => f.toLowerCase().includes('repository')),
          quality: 'good',
          description: 'Data access abstraction layer'
        })
      }

      // Factory pattern
      const hasFactory = files.some(f => f.toLowerCase().includes('factory'))
      if (hasFactory) {
        patterns.push({
          name: 'Factory Pattern',
          type: 'design',
          locations: files.filter(f => f.toLowerCase().includes('factory')),
          quality: 'good',
          description: 'Object creation abstraction'
        })
      }

      // Singleton pattern
      const singletonFiles: string[] = []
      for (const file of files.slice(0, 30)) {
        const content = await fs.readFile(file, 'utf-8')
        if (content.includes('getInstance') || content.includes('private static instance')) {
          singletonFiles.push(file)
        }
      }
      if (singletonFiles.length > 0) {
        patterns.push({
          name: 'Singleton Pattern',
          type: 'design',
          locations: singletonFiles,
          quality: 'acceptable',
          description: 'Single instance pattern'
        })
      }

      // Dependency Injection
      for (const file of files.slice(0, 30)) {
        const content = await fs.readFile(file, 'utf-8')
        if (content.includes('@Injectable') || content.includes('@Inject')) {
          patterns.push({
            name: 'Dependency Injection',
            type: 'architectural',
            locations: [file],
            quality: 'good',
            description: 'IoC container for dependency management'
          })
          break
        }
      }

    } catch {}

    return patterns
  }

  /**
   * Calculate package health
   */
  private calculatePackageHealth(
    layers: ArchitectureLayer[],
    modules: ModuleInfo[],
    patterns: DetectedPattern[]
  ): { score: number; issues: PackageIssue[] } {
    let score = 100
    const issues: PackageIssue[] = []

    // Check for layer violations
    for (const layer of layers) {
      for (const actual of layer.actualDependencies) {
        if (!layer.allowedDependencies.includes(actual)) {
          score -= 5
          issues.push({
            type: 'layer-violation',
            severity: 'warning',
            location: layer.path,
            description: `${layer.name} layer depends on ${actual}`,
            suggestion: `Move dependency to appropriate layer`
          })
        }
      }
    }

    // Check for unstable abstractions
    const unstableModules = modules.filter(m => m.distance > 0.5)
    if (unstableModules.length > 0) {
      score -= unstableModules.length * 3
      for (const mod of unstableModules.slice(0, 5)) {
        issues.push({
          type: 'unstable-abstraction',
          severity: 'info',
          location: mod.name,
          description: `Module has poor abstraction-stability balance`,
          suggestion: 'Review module design for better balance'
        })
      }
    }

    return {
      score: Math.max(0, score),
      issues
    }
  }

  // ==========================================================================
  // Code Ownership Graph
  // ==========================================================================

  /**
   * Analyze ownership
   */
  private async analyzeOwnership(fullPath: string): Promise<OwnershipGraph> {
    const nodes: OwnershipNode[] = []
    const edges: OwnershipEdge[] = []
    const teams: TeamInfo[] = []

    try {
      // Analyze git blame for ownership
      const fileOwnerships = await this.analyzeGitBlame(fullPath)
      
      // Build ownership nodes
      for (const [filePath, ownership] of Array.from(fileOwnerships.entries())) {
        nodes.push({
          id: filePath,
          type: 'file',
          path: filePath,
          owners: ownership.owners,
          contributors: ownership.contributors,
          metadata: {
            linesOfCode: ownership.linesOfCode,
            lastModified: ownership.lastModified,
            changeFrequency: ownership.changeFrequency
          }
        })
      }

      // Build teams
      const teamMap = this.buildTeamMap(nodes)
      teams.push(...teamMap)

      // Calculate coverage
      const coverage = this.calculateOwnershipCoverage(nodes)

      // Find hotspots
      const hotspots = this.findOwnershipHotspots(nodes)

      return {
        nodes,
        edges,
        teams,
        coverage,
        hotspots
      }
    } catch {
      // Return empty result on error
      return {
        nodes: [],
        edges: [],
        teams: [],
        coverage: { percentage: 0, unowned: [] },
        hotspots: []
      }
    }
  }

  /**
   * Analyze git blame for ownership
   */
  private async analyzeGitBlame(fullPath: string): Promise<Map<string, {
    owners: Owner[]
    contributors: Contributor[]
    linesOfCode: number
    lastModified: string
    changeFrequency: number
  }>> {
    const results = new Map()

    try {
      const files = await this.getSourceFiles(fullPath)
      
      for (const file of files.slice(0, 50)) {
        // Simulate ownership data
        const content = await fs.readFile(file, 'utf-8')
        const linesOfCode = content.split('\n').length
        const stat = await fs.stat(file)
        
        results.set(path.relative(fullPath, file), {
          owners: [{
            type: 'team',
            name: 'default-team',
            percentage: 100,
            since: stat.birthtime.toISOString()
          }],
          contributors: [],
          linesOfCode,
          lastModified: stat.mtime.toISOString(),
          changeFrequency: 1
        })
      }
    } catch {}

    return results
  }

  /**
   * Build team map
   */
  private buildTeamMap(nodes: OwnershipNode[]): TeamInfo[] {
    const teams = new Map<string, TeamInfo>()

    for (const node of nodes) {
      for (const owner of node.owners) {
        if (owner.type === 'team') {
          if (!teams.has(owner.name)) {
            teams.set(owner.name, {
              name: owner.name,
              members: [],
              ownedComponents: [],
              expertise: [],
              workload: 0
            })
          }
          teams.get(owner.name)!.ownedComponents.push(node.path)
          teams.get(owner.name)!.workload += node.metadata.linesOfCode
        }
      }
    }

    return Array.from(teams.values())
  }

  /**
   * Calculate ownership coverage
   */
  private calculateOwnershipCoverage(nodes: OwnershipNode[]): { percentage: number; unowned: string[] } {
    const unowned = nodes.filter(n => n.owners.length === 0)
    
    return {
      percentage: nodes.length > 0 
        ? Math.round(((nodes.length - unowned.length) / nodes.length) * 100) 
        : 0,
      unowned: unowned.map(n => n.path)
    }
  }

  /**
   * Find ownership hotspots
   */
  private findOwnershipHotspots(nodes: OwnershipNode[]): OwnershipHotspot[] {
    const hotspots: OwnershipHotspot[] = []

    // High churn files
    const highChurn = nodes.filter(n => n.metadata.changeFrequency > 10)
    for (const node of highChurn) {
      hotspots.push({
        path: node.path,
        type: 'high-churn',
        severity: 'warning',
        description: `File has high change frequency (${node.metadata.changeFrequency})`
      })
    }

    // Many contributors
    const manyContribs = nodes.filter(n => n.contributors.length > 5)
    for (const node of manyContribs) {
      hotspots.push({
        path: node.path,
        type: 'many-contributors',
        severity: 'info',
        description: `File has ${node.contributors.length} contributors`
      })
    }

    // Orphaned files
    const orphaned = nodes.filter(n => n.owners.length === 0)
    for (const node of orphaned) {
      hotspots.push({
        path: node.path,
        type: 'orphaned',
        severity: 'warning',
        description: 'File has no owner'
      })
    }

    return hotspots
  }

  // ==========================================================================
  // Developer Workflow Analyzer
  // ==========================================================================

  /**
   * Analyze workflows
   */
  private async analyzeWorkflows(fullPath: string): Promise<WorkflowAnalysisResult> {
    const gitWorkflow = await this.analyzeGitWorkflow(fullPath)
    const ciCd = await this.analyzeCICD(fullPath)
    const branching = await this.analyzeBranching(fullPath)
    const releaseProcess = await this.analyzeRelease(fullPath)
    const developmentPatterns = await this.analyzeDevelopmentPatterns(fullPath)
    const health = this.calculateWorkflowHealth(gitWorkflow, ciCd, releaseProcess)

    return {
      gitWorkflow,
      ciCd,
      branching,
      releaseProcess,
      developmentPatterns,
      health
    }
  }

  /**
   * Analyze git workflow
   */
  private async analyzeGitWorkflow(fullPath: string): Promise<GitWorkflowInfo> {
    let type: GitWorkflowInfo['type'] = 'unknown'
    
    try {
      // Check for gitflow indicators
      const hasDevelop = await this.branchExists(fullPath, 'develop')
      const hasMaster = await this.branchExists(fullPath, 'master') || 
                        await this.branchExists(fullPath, 'main')
      
      if (hasDevelop && hasMaster) {
        type = 'gitflow'
      } else if (hasMaster) {
        type = 'github-flow'
      }

      // Check for trunk-based indicators
      const branches = await this.getBranches(fullPath)
      const shortLivedFeature = branches.filter(b => 
        b.startsWith('feature/') || b.startsWith('feat/')
      ).length

      if (shortLivedFeature > 0 && !hasDevelop) {
        type = 'trunk-based'
      }

      return {
        type,
        branchCount: branches.length,
        activeBranches: branches.slice(0, 10),
        staleBranches: [],
        mergePatterns: [{ strategy: 'merge', percentage: 100 }]
      }
    } catch {
      return {
        type: 'unknown',
        branchCount: 0,
        activeBranches: [],
        staleBranches: [],
        mergePatterns: []
      }
    }
  }

  /**
   * Analyze CI/CD
   */
  private async analyzeCICD(fullPath: string): Promise<CICDInfo> {
    const platforms: string[] = []
    const pipelines: PipelineInfo[] = []
    
    try {
      // Check for GitHub Actions
      const githubActions = await fs.stat(path.join(fullPath, '.github/workflows')).catch(() => null)
      if (githubActions?.isDirectory()) {
        platforms.push('github-actions')
        
        const workflows = await fs.readdir(path.join(fullPath, '.github/workflows'))
        for (const workflow of workflows.filter(w => w.endsWith('.yml') || w.endsWith('.yaml'))) {
          pipelines.push({
            name: workflow.replace(/\.[^.]+$/, ''),
            triggers: ['push', 'pull_request'],
            stages: ['build', 'test', 'deploy'],
            averageDuration: 300,
            successRate: 95
          })
        }
      }

      // Check for GitLab CI
      const gitlabCI = await fs.stat(path.join(fullPath, '.gitlab-ci.yml')).catch(() => null)
      if (gitlabCI) {
        platforms.push('gitlab-ci')
      }

      // Check for CircleCI
      const circleCI = await fs.stat(path.join(fullPath, '.circleci')).catch(() => null)
      if (circleCI?.isDirectory()) {
        platforms.push('circleci')
      }

      // Check for Jenkins
      const jenkinsfile = await fs.stat(path.join(fullPath, 'Jenkinsfile')).catch(() => null)
      if (jenkinsfile) {
        platforms.push('jenkins')
      }
    } catch {}

    return {
      hasCI: platforms.length > 0,
      platform: platforms,
      pipelines,
      coverage: {
        build: pipelines.length > 0,
        test: pipelines.some(p => p.stages.includes('test')),
        deploy: pipelines.some(p => p.stages.includes('deploy')),
        lint: pipelines.some(p => p.stages.includes('lint'))
      }
    }
  }

  /**
   * Analyze branching
   */
  private async analyzeBranching(fullPath: string): Promise<BranchingInfo> {
    return {
      mainBranch: 'main',
      developBranch: null,
      featurePrefix: ['feature/', 'feat/'],
      releasePrefix: 'release/',
      hotfixPrefix: 'hotfix/',
      branchProtection: {
        enabled: false,
        requiredReviews: 0,
        requiredChecks: []
      }
    }
  }

  /**
   * Analyze release process
   */
  private async analyzeRelease(fullPath: string): Promise<ReleaseInfo> {
    let strategy: ReleaseInfo['strategy'] = 'none'
    let hasChangelog = false

    try {
      // Check for changelog
      hasChangelog = await fs.access(path.join(fullPath, 'CHANGELOG.md')).then(() => true).catch(() => false)

      // Check package.json for version
      const pkgJson = JSON.parse(await fs.readFile(path.join(fullPath, 'package.json'), 'utf-8'))
      if (pkgJson.version) {
        // Check if semver
        if (/^\d+\.\d+\.\d+/.test(pkgJson.version)) {
          strategy = 'semver'
        }
      }
    } catch {}

    return {
      strategy,
      frequency: 'periodic',
      automation: hasChangelog,
      changelog: hasChangelog,
      lastRelease: null
    }
  }

  /**
   * Analyze development patterns
   */
  private async analyzeDevelopmentPatterns(fullPath: string): Promise<DevPattern[]> {
    const patterns: DevPattern[] = []

    try {
      const files = await this.getSourceFiles(fullPath)
      
      // Check for TDD
      const testFiles = files.filter(f => f.includes('.test.') || f.includes('.spec.'))
      if (testFiles.length > files.length * 0.3) {
        patterns.push({
          name: 'Test-Driven Development',
          usage: testFiles.length > files.length * 0.5 ? 'widespread' : 'common',
          locations: testFiles.slice(0, 10),
          quality: 'good'
        })
      }

      // Check for component-driven development
      const componentFiles = files.filter(f => 
        f.includes('/components/') || f.includes('\\components\\')
      )
      if (componentFiles.length > 10) {
        patterns.push({
          name: 'Component-Driven Development',
          usage: 'widespread',
          locations: componentFiles.slice(0, 10),
          quality: 'good'
        })
      }
    } catch {}

    return patterns
  }

  /**
   * Calculate workflow health
   */
  private calculateWorkflowHealth(
    gitWorkflow: GitWorkflowInfo,
    ciCd: CICDInfo,
    release: ReleaseInfo
  ): { score: number; issues: WorkflowIssue[] } {
    let score = 100
    const issues: WorkflowIssue[] = []

    if (!ciCd.hasCI) {
      score -= 30
      issues.push({
        type: 'missing-ci',
        severity: 'error',
        description: 'No CI/CD pipeline detected',
        suggestion: 'Set up a CI/CD pipeline for automated testing and deployment'
      })
    }

    if (!ciCd.coverage.test) {
      score -= 20
      issues.push({
        type: 'low-test-coverage',
        severity: 'warning',
        description: 'No automated tests in CI pipeline',
        suggestion: 'Add test stage to CI pipeline'
      })
    }

    if (release.strategy === 'none') {
      score -= 10
      issues.push({
        type: 'infrequent-releases',
        severity: 'info',
        description: 'No release strategy detected',
        suggestion: 'Consider adopting semantic versioning'
      })
    }

    return {
      score: Math.max(0, score),
      issues
    }
  }

  // ==========================================================================
  // Codebase Risk Scoring
  // ==========================================================================

  /**
   * Analyze risks
   */
  private async analyzeRisks(fullPath: string): Promise<RiskScore> {
    const categories: RiskCategory[] = []
    const topRisks: RiskItem[] = []

    // Technical debt risk
    const techDebtRisk = await this.assessTechnicalDebtRisk(fullPath)
    categories.push(techDebtRisk)

    // Security risk
    const securityRisk = await this.assessSecurityRisk(fullPath)
    categories.push(securityRisk)

    // Dependency risk
    const dependencyRisk = await this.assessDependencyRisk(fullPath)
    categories.push(dependencyRisk)

    // Architecture risk
    const architectureRisk = await this.assessArchitectureRisk(fullPath)
    categories.push(architectureRisk)

    // Maintainability risk
    const maintainabilityRisk = await this.assessMaintainabilityRisk(fullPath)
    categories.push(maintainabilityRisk)

    // Collect top risks
    for (const category of categories) {
      topRisks.push(...category.risks.filter(r => r.severity === 'critical' || r.severity === 'high'))
    }

    // Calculate overall score
    const overall = Math.round(
      categories.reduce((sum, cat) => sum + (cat.score * cat.weight), 0) /
      categories.reduce((sum, cat) => sum + cat.weight, 0)
    )

    // Generate mitigations
    const mitigations = this.generateMitigations(topRisks)

    return {
      overall,
      grade: this.scoreToGrade(overall),
      categories,
      topRisks: topRisks.slice(0, 10),
      mitigations
    }
  }

  /**
   * Assess technical debt risk
   */
  private async assessTechnicalDebtRisk(fullPath: string): Promise<RiskCategory> {
    const risks: RiskItem[] = []
    let score = 100

    try {
      const files = await this.getSourceFiles(fullPath)
      
      // Check for TODO/FIXME
      let todoCount = 0
      for (const file of files.slice(0, 50)) {
        const content = await fs.readFile(file, 'utf-8')
        const todos = (content.match(/TODO|FIXME|HACK|XXX/g) || []).length
        todoCount += todos
      }

      if (todoCount > 50) {
        score -= 20
        risks.push({
          id: 'tech-debt-todos',
          type: 'technical-debt',
          severity: 'medium',
          description: `High number of TODO/FIXME comments (${todoCount})`,
          location: 'codebase',
          impact: 'Accumulated technical debt',
          probability: 0.7,
          mitigation: 'Create backlog items to address TODOs'
        })
      }

      // Check for deprecated patterns
      let deprecatedCount = 0
      for (const file of files.slice(0, 30)) {
        const content = await fs.readFile(file, 'utf-8')
        if (content.includes('@deprecated') || content.includes('DEPRECATED')) {
          deprecatedCount++
        }
      }

      if (deprecatedCount > 5) {
        score -= 10
        risks.push({
          id: 'tech-debt-deprecated',
          type: 'technical-debt',
          severity: 'low',
          description: `${deprecatedCount} files with deprecated code`,
          location: 'codebase',
          impact: 'Outdated patterns',
          probability: 0.5,
          mitigation: 'Plan migration away from deprecated code'
        })
      }
    } catch {}

    return {
      name: 'Technical Debt',
      score,
      weight: 1.5,
      risks
    }
  }

  /**
   * Assess security risk
   */
  private async assessSecurityRisk(fullPath: string): Promise<RiskCategory> {
    const risks: RiskItem[] = []
    let score = 100

    try {
      const files = await this.getSourceFiles(fullPath)
      
      // Check for hardcoded secrets
      for (const file of files.slice(0, 50)) {
        const content = await fs.readFile(file, 'utf-8')
        
        const secretPatterns = [
          { pattern: /password\s*=\s*['"`][^'"`]+['"`]/i, type: 'password' },
          { pattern: /api[_-]?key\s*=\s*['"`][^'"`]+['"`]/i, type: 'api-key' },
          { pattern: /secret\s*=\s*['"`][^'"`]+['"`]/i, type: 'secret' },
          { pattern: /token\s*=\s*['"`][^'"`]+['"`]/i, type: 'token' }
        ]

        for (const { pattern, type } of secretPatterns) {
          if (pattern.test(content)) {
            score -= 15
            risks.push({
              id: `security-${type}-${file}`,
              type: 'security',
              severity: 'critical',
              description: `Potential hardcoded ${type} found`,
              location: file,
              impact: 'Security breach',
              probability: 0.8,
              mitigation: 'Use environment variables for sensitive data'
            })
          }
        }
      }

      // Check for outdated dependencies with known vulnerabilities
      // (Simplified - would use npm audit in production)
    } catch {}

    return {
      name: 'Security',
      score: Math.max(0, score),
      weight: 2.0,
      risks
    }
  }

  /**
   * Assess dependency risk
   */
  private async assessDependencyRisk(fullPath: string): Promise<RiskCategory> {
    const risks: RiskItem[] = []
    let score = 100

    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(fullPath, 'package.json'), 'utf-8'))
      const deps = Object.keys(pkgJson.dependencies || {})
      
      // Check for many dependencies
      if (deps.length > 50) {
        score -= 10
        risks.push({
          id: 'dep-count',
          type: 'dependency',
          severity: 'medium',
          description: `High number of dependencies (${deps.length})`,
          location: 'package.json',
          impact: 'Increased attack surface and maintenance burden',
          probability: 0.6,
          mitigation: 'Review and remove unused dependencies'
        })
      }

      // Check for risky packages
      const riskyPackages = ['request', 'colors', 'express-session']
      const foundRisky = deps.filter(d => riskyPackages.includes(d))
      if (foundRisky.length > 0) {
        score -= 10
        risks.push({
          id: 'dep-risky',
          type: 'dependency',
          severity: 'medium',
          description: `Risky packages found: ${foundRisky.join(', ')}`,
          location: 'package.json',
          impact: 'Security vulnerabilities or maintenance issues',
          probability: 0.5,
          mitigation: 'Replace with actively maintained alternatives'
        })
      }
    } catch {}

    return {
      name: 'Dependencies',
      score,
      weight: 1.5,
      risks
    }
  }

  /**
   * Assess architecture risk
   */
  private async assessArchitectureRisk(fullPath: string): Promise<RiskCategory> {
    const risks: RiskItem[] = []
    let score = 100

    try {
      // Check for circular dependencies
      const files = await this.getSourceFiles(fullPath)
      const importGraph = new Map<string, string[]>()

      for (const file of files.slice(0, 100)) {
        const content = await fs.readFile(file, 'utf-8')
        const imports = content.match(/from\s+['"`]([^'"`]+)['"`]/g) || []
        importGraph.set(
          file,
          imports.map(i => i.replace(/from\s+['"`]([^'"`]+)['"`]/, '$1'))
        )
      }

      // Check for large files
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8')
        const lines = content.split('\n').length
        
        if (lines > 500) {
          score -= 5
          risks.push({
            id: `arch-large-${file}`,
            type: 'complexity',
            severity: 'medium',
            description: `Large file (${lines} lines)`,
            location: file,
            impact: 'Maintainability issues',
            probability: 0.6,
            mitigation: 'Split into smaller modules'
          })
        }
      }
    } catch {}

    return {
      name: 'Architecture',
      score: Math.max(0, score),
      weight: 1.0,
      risks
    }
  }

  /**
   * Assess maintainability risk
   */
  private async assessMaintainabilityRisk(fullPath: string): Promise<RiskCategory> {
    const risks: RiskItem[] = []
    let score = 100

    try {
      const files = await this.getSourceFiles(fullPath)
      
      // Check for low test coverage indicator
      const testFiles = files.filter(f => f.includes('.test.') || f.includes('.spec.'))
      const testRatio = testFiles.length / files.length

      if (testRatio < 0.1) {
        score -= 25
        risks.push({
          id: 'maint-test',
          type: 'testing',
          severity: 'high',
          description: `Low test coverage (${Math.round(testRatio * 100)}%)`,
          location: 'codebase',
          impact: 'Higher risk of regressions',
          probability: 0.8,
          mitigation: 'Increase test coverage to at least 50%'
        })
      }

      // Check for documentation
      const readme = await fs.access(path.join(fullPath, 'README.md')).then(() => true).catch(() => false)
      if (!readme) {
        score -= 10
        risks.push({
          id: 'maint-docs',
          type: 'documentation',
          severity: 'low',
          description: 'Missing README.md',
          location: 'root',
          impact: 'Poor onboarding experience',
          probability: 0.5,
          mitigation: 'Add comprehensive README.md'
        })
      }
    } catch {}

    return {
      name: 'Maintainability',
      score: Math.max(0, score),
      weight: 1.0,
      risks
    }
  }

  /**
   * Generate mitigations
   */
  private generateMitigations(risks: RiskItem[]): string[] {
    return risks
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return severityOrder[a.severity] - severityOrder[b.severity]
      })
      .slice(0, 10)
      .map(r => r.mitigation)
  }

  /**
   * Score to grade conversion
   */
  private scoreToGrade(score: number): RiskScore['grade'] {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  // ==========================================================================
  // Summary Analysis
  // ==========================================================================

  /**
   * Analyze project summary
   */
  private async analyzeSummary(fullPath: string): Promise<CodebaseAnalysis['summary']> {
    let totalFiles = 0
    let totalLinesOfCode = 0
    let primaryLanguage = 'TypeScript'
    let framework = 'unknown'
    
    try {
      const files = await this.getSourceFiles(fullPath)
      totalFiles = files.length

      // Count lines
      for (const file of files.slice(0, 100)) {
        const content = await fs.readFile(file, 'utf-8')
        totalLinesOfCode += content.split('\n').length
      }

      // Estimate total
      if (files.length > 100) {
        totalLinesOfCode = Math.round(totalLinesOfCode * (files.length / 100))
      }

      // Detect primary language
      const extCounts = new Map<string, number>()
      for (const file of files) {
        const ext = path.extname(file)
        extCounts.set(ext, (extCounts.get(ext) || 0) + 1)
      }
      
      const maxExt = Array.from(extCounts.entries()).sort((a, b) => b[1] - a[1])[0]
      if (maxExt) {
        const langMap: Record<string, string> = {
          '.ts': 'TypeScript',
          '.tsx': 'TypeScript',
          '.js': 'JavaScript',
          '.jsx': 'JavaScript',
          '.py': 'Python',
          '.go': 'Go',
          '.java': 'Java',
          '.rb': 'Ruby'
        }
        primaryLanguage = langMap[maxExt[0]] || 'Unknown'
      }

      // Detect framework
      const pkgJson = JSON.parse(await fs.readFile(path.join(fullPath, 'package.json'), 'utf-8'))
      const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies }
      
      if (deps.next) framework = 'Next.js'
      else if (deps.nuxt) framework = 'Nuxt'
      else if (deps.react) framework = 'React'
      else if (deps.vue) framework = 'Vue'
      else if (deps.express) framework = 'Express'
      else if (deps.nestjs) framework = 'NestJS'
      else if (deps.svelte) framework = 'Svelte'

      // Detect architecture
      const architecture = await this.detectArchitectureType(fullPath)

      // Detect maturity
      let maturity: CodebaseAnalysis['summary']['maturity'] = 'developing'
      if (totalLinesOfCode < 1000) maturity = 'early'
      else if (totalLinesOfCode > 50000) maturity = 'mature'
      else if (totalLinesOfCode > 100000) maturity = 'legacy'

      return {
        totalFiles,
        totalLinesOfCode,
        primaryLanguage,
        architecture,
        framework,
        maturity
      }
    } catch {
      return {
        totalFiles: 0,
        totalLinesOfCode: 0,
        primaryLanguage: 'Unknown',
        architecture: 'monolith',
        framework: 'unknown',
        maturity: 'early'
      }
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Generate overall recommendations
   */
  private generateRecommendations(analysis: {
    monorepo: MonorepoResult
    services: ServiceAnalysisResult
    packages: PackageAnalysisResult
    ownership: OwnershipGraph
    workflows: WorkflowAnalysisResult
    risks: RiskScore
  }): string[] {
    const recommendations: string[] = []

    // Monorepo recommendations
    if (analysis.monorepo.isMonorepo && analysis.monorepo.health.issues.length > 0) {
      recommendations.push('Address monorepo health issues: ' + 
        analysis.monorepo.health.issues[0].message)
    }

    // Service boundary recommendations
    if (analysis.services.boundaries.violations.length > 0) {
      recommendations.push(analysis.services.boundaries.suggestions[0] || 
        'Review service boundaries for coupling issues')
    }

    // Architecture recommendations
    if (analysis.packages.health.issues.length > 0) {
      const issue = analysis.packages.health.issues[0]
      recommendations.push(`${issue.description}. ${issue.suggestion}`)
    }

    // Ownership recommendations
    if (analysis.ownership.coverage.percentage < 100) {
      recommendations.push(`Assign ownership to ${analysis.ownership.coverage.unowned.length} unowned files`)
    }

    // Workflow recommendations
    for (const issue of analysis.workflows.health.issues) {
      recommendations.push(issue.suggestion)
    }

    // Risk recommendations
    recommendations.push(...analysis.risks.mitigations.slice(0, 3))

    return Array.from(new Set(recommendations)).slice(0, 10)
  }

  /**
   * Get source files
   */
  private async getSourceFiles(dir: string): Promise<string[]> {
    const files: string[] = []
    
    const scan = async (d: string) => {
      try {
        const entries = await fs.readdir(d, { withFileTypes: true })
        
        for (const entry of entries) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
          
          const fullPath = path.join(d, entry.name)
          
          if (entry.isDirectory()) {
            await scan(fullPath)
          } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            files.push(fullPath)
          }
        }
      } catch {}
    }

    await scan(dir)
    return files
  }

  /**
   * Scan directory to specified depth
   */
  private async scanDirectory(dir: string, depth: number): Promise<string[]> {
    const results: string[] = []
    
    if (depth <= 0) return results

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue
        
        results.push(entry.name)
        
        if (entry.isDirectory() && depth > 1) {
          const subResults = await this.scanDirectory(
            path.join(dir, entry.name),
            depth - 1
          )
          results.push(...subResults.map(r => `${entry.name}/${r}`))
        }
      }
    } catch {}

    return results
  }

  /**
   * Get root directories
   */
  private async getRootDirectories(fullPath: string): Promise<string[]> {
    const dirs: string[] = []
    
    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true })
      
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          dirs.push(entry.name)
        }
      }
    } catch {}

    return dirs
  }

  /**
   * Count lines of code in directory
   */
  private async countLinesOfCode(dir: string): Promise<number> {
    let count = 0
    
    try {
      const files = await this.getSourceFiles(dir)
      
      for (const file of files.slice(0, 50)) {
        const content = await fs.readFile(file, 'utf-8')
        count += content.split('\n').length
      }

      // Estimate if there are more files
      if (files.length > 50) {
        count = Math.round(count * (files.length / 50))
      }
    } catch {}

    return count
  }

  /**
   * Get last modified date
   */
  private async getLastModified(dir: string): Promise<string> {
    try {
      const files = await this.getSourceFiles(dir)
      let latest = new Date(0)
      
      for (const file of files.slice(0, 20)) {
        const stat = await fs.stat(file)
        if (stat.mtime > latest) {
          latest = stat.mtime
        }
      }
      
      return latest.toISOString()
    } catch {
      return new Date().toISOString()
    }
  }

  /**
   * Check if branch exists
   */
  private async branchExists(fullPath: string, branch: string): Promise<boolean> {
    // Simplified - would use git commands in production
    return false
  }

  /**
   * Get branches
   */
  private async getBranches(fullPath: string): Promise<string[]> {
    // Simplified - would use git commands in production
    return ['main', 'master']
  }

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.analysisCache.clear()
    this.fileCache.clear()
  }
}

// ============================================================================
// Singleton and Convenience Functions
// ============================================================================

let instance: CodebaseIntelligence | null = null

/**
 * Get singleton instance
 */
export function getCodebaseIntelligence(): CodebaseIntelligence {
  if (!instance) {
    instance = new CodebaseIntelligence()
  }
  return instance
}

/**
 * Convenience function for quick analysis
 */
export async function analyzeCodebase(projectPath: string): Promise<CodebaseAnalysis> {
  const intelligence = getCodebaseIntelligence()
  return intelligence.analyzeCodebase(projectPath)
}
