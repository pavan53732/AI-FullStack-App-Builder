/**
 * Architecture Drift Detector
 * 
 * Detects when codebase deviates from planned architecture:
 * - Layer violations (UI calling DB directly)
 * - Dependency violations (circular deps, wrong direction)
 * - Pattern violations (anti-patterns)
 * - Structure drift (missing/extra modules)
 * - Naming convention violations
 * - API contract violations
 */

import fs from 'fs/promises'
import path from 'path'

// Types
export type ArchitectureLayer = 
  | 'presentation'   // UI components, pages
  | 'application'    // Business logic, services
  | 'domain'         // Core domain models
  | 'infrastructure' // DB, external APIs, utilities
  | 'shared'         // Common utilities, types

export type ViolationSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface ArchitectureRule {
  id: string
  name: string
  description: string
  sourceLayer: ArchitectureLayer
  targetLayer: ArchitectureLayer
  allowed: boolean
  reason?: string
}

export interface DriftViolation {
  id: string
  type: 'layer_violation' | 'dependency_violation' | 'pattern_violation' | 'structure_drift' | 'naming_violation' | 'contract_violation'
  severity: ViolationSeverity
  rule: string
  source: {
    file: string
    layer: ArchitectureLayer
    line?: number
    code?: string
  }
  target: {
    file?: string
    layer?: ArchitectureLayer
    module?: string
  }
  message: string
  suggestion: string
  impact: string
  detectedAt: string
}

export interface ArchitectureSnapshot {
  timestamp: string
  layers: Record<ArchitectureLayer, {
    files: string[]
    dependencies: string[]
    exports: string[]
  }>
  rules: ArchitectureRule[]
  metrics: ArchitectureMetrics
}

export interface ArchitectureMetrics {
  totalFiles: number
  layerDistribution: Record<ArchitectureLayer, number>
  crossLayerDependencies: number
  circularDependencies: number
  violationCount: number
  cohesionScore: number        // 0-100, higher = better
  couplingScore: number        // 0-100, lower = better
  architectureHealth: number   // 0-100, overall score
}

export interface DriftReport {
  violations: DriftViolation[]
  metrics: ArchitectureMetrics
  trends: {
    violationsIncreasing: boolean
    healthTrend: 'improving' | 'stable' | 'declining'
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  }
  recommendations: string[]
  snapshot: ArchitectureSnapshot
}

// Default architecture rules (can be customized)
const DEFAULT_RULES: ArchitectureRule[] = [
  // Layer dependency rules (Clean Architecture)
  {
    id: 'rule_1',
    name: 'Presentation → Application',
    description: 'UI can call application services',
    sourceLayer: 'presentation',
    targetLayer: 'application',
    allowed: true
  },
  {
    id: 'rule_2',
    name: 'Presentation → Domain',
    description: 'UI should not directly access domain models',
    sourceLayer: 'presentation',
    targetLayer: 'domain',
    allowed: false,
    reason: 'Use application services to interact with domain'
  },
  {
    id: 'rule_3',
    name: 'Presentation → Infrastructure',
    description: 'UI should not directly access infrastructure',
    sourceLayer: 'presentation',
    targetLayer: 'infrastructure',
    allowed: false,
    reason: 'Inject infrastructure through application layer'
  },
  {
    id: 'rule_4',
    name: 'Application → Domain',
    description: 'Application services can use domain models',
    sourceLayer: 'application',
    targetLayer: 'domain',
    allowed: true
  },
  {
    id: 'rule_5',
    name: 'Application → Infrastructure',
    description: 'Application services can use infrastructure (via interfaces)',
    sourceLayer: 'application',
    targetLayer: 'infrastructure',
    allowed: true
  },
  {
    id: 'rule_6',
    name: 'Domain → Infrastructure',
    description: 'Domain should not depend on infrastructure',
    sourceLayer: 'domain',
    targetLayer: 'infrastructure',
    allowed: false,
    reason: 'Domain should be infrastructure-agnostic'
  },
  {
    id: 'rule_7',
    name: 'Domain → Application',
    description: 'Domain should not depend on application layer',
    sourceLayer: 'domain',
    targetLayer: 'application',
    allowed: false,
    reason: 'Domain is the core, should not have outward dependencies'
  },
  {
    id: 'rule_8',
    name: 'Infrastructure → Domain',
    description: 'Infrastructure can implement domain interfaces',
    sourceLayer: 'infrastructure',
    targetLayer: 'domain',
    allowed: true
  }
]

// File patterns for layer detection
const LAYER_PATTERNS: Record<ArchitectureLayer, RegExp[]> = {
  presentation: [
    /\/components\//,
    /\/pages?\//,
    /\/views?\//,
    /\/ui\//,
    /\/screens?\//,
    /\.tsx?$/,  // React components
    /\.vue$/
  ],
  application: [
    /\/services?\//,
    /\/useCases?\//,
    /\/handlers?\//,
    /\/controllers?\//,
    /\/application\//
  ],
  domain: [
    /\/domain\//,
    /\/models?\//,
    /\/entities?\//,
    /\/valueObjects?\//,
    /\/aggregates?\//
  ],
  infrastructure: [
    /\/infrastructure\//,
    /\/db\//,
    /\/database\//,
    /\/api\//,
    /\/repositories?\//,
    /\/external\//,
    /\/adapters?\//
  ],
  shared: [
    /\/shared\//,
    /\/common\//,
    /\/utils?\//,
    /\/lib\//,
    /\/types?\//,
    /\/constants?\//
  ]
}

/**
 * Architecture Drift Detector
 */
export class ArchitectureDriftDetector {
  private rules: ArchitectureRule[]
  private snapshots: ArchitectureSnapshot[] = []
  private baseline: ArchitectureSnapshot | null = null

  constructor(customRules?: ArchitectureRule[]) {
    this.rules = customRules || DEFAULT_RULES
  }

  /**
   * Detect architecture drift in a project
   */
  async detect(projectPath: string): Promise<DriftReport> {
    // Analyze current architecture
    const currentSnapshot = await this.createSnapshot(projectPath)
    
    // Detect violations
    const violations = await this.detectViolations(projectPath, currentSnapshot)
    
    // Calculate metrics
    const metrics = this.calculateMetrics(currentSnapshot, violations)
    
    // Analyze trends
    const trends = this.analyzeTrends(violations, metrics)
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(violations, metrics)
    
    // Store snapshot
    this.snapshots.push(currentSnapshot)
    
    return {
      violations,
      metrics,
      trends,
      recommendations,
      snapshot: currentSnapshot
    }
  }

  /**
   * Create architecture snapshot
   */
  private async createSnapshot(projectPath: string): Promise<ArchitectureSnapshot> {
    const layers: Record<ArchitectureLayer, {
      files: string[]
      dependencies: string[]
      exports: string[]
    }> = {
      presentation: { files: [], dependencies: [], exports: [] },
      application: { files: [], dependencies: [], exports: [] },
      domain: { files: [], dependencies: [], exports: [] },
      infrastructure: { files: [], dependencies: [], exports: [] },
      shared: { files: [], dependencies: [], exports: [] }
    }

    // Scan files and assign to layers
    const files = await this.getProjectFiles(projectPath)
    
    for (const file of files) {
      const layer = this.detectLayer(file)
      layers[layer].files.push(file)
      
      // Extract dependencies
      try {
        const content = await fs.readFile(file, 'utf-8')
        const deps = this.extractDependencies(content)
        layers[layer].dependencies.push(...deps)
        
        const exports = this.extractExports(content)
        layers[layer].exports.push(...exports)
      } catch {}
    }

    return {
      timestamp: new Date().toISOString(),
      layers,
      rules: this.rules,
      metrics: {
        totalFiles: files.length,
        layerDistribution: {
          presentation: layers.presentation.files.length,
          application: layers.application.files.length,
          domain: layers.domain.files.length,
          infrastructure: layers.infrastructure.files.length,
          shared: layers.shared.files.length
        },
        crossLayerDependencies: 0,
        circularDependencies: 0,
        violationCount: 0,
        cohesionScore: 0,
        couplingScore: 0,
        architectureHealth: 0
      }
    }
  }

  /**
   * Detect layer violations
   */
  private async detectViolations(
    projectPath: string,
    snapshot: ArchitectureSnapshot
  ): Promise<DriftViolation[]> {
    const violations: DriftViolation[] = []

    for (const [layerName, layerData] of Object.entries(snapshot.layers)) {
      for (const file of layerData.files) {
        try {
          const content = await fs.readFile(file, 'utf-8')
          const fileViolations = await this.detectFileViolations(
            file,
            content,
            layerName as ArchitectureLayer,
            snapshot
          )
          violations.push(...fileViolations)
        } catch {}
      }
    }

    // Detect circular dependencies
    const circularViolations = this.detectCircularDependencies(snapshot)
    violations.push(...circularViolations)

    // Detect pattern violations
    const patternViolations = await this.detectPatternViolations(projectPath, snapshot)
    violations.push(...patternViolations)

    // Detect structure drift
    const structureViolations = this.detectStructureDrift(snapshot)
    violations.push(...structureViolations)

    return violations
  }

  /**
   * Detect violations in a single file
   */
  private async detectFileViolations(
    filePath: string,
    content: string,
    sourceLayer: ArchitectureLayer,
    snapshot: ArchitectureSnapshot
  ): Promise<DriftViolation[]> {
    const violations: DriftViolation[] = []
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Check import statements
      const importMatch = line.match(/import\s+.*from\s+['"]([^'"]+)['"]/)
      if (importMatch) {
        const importPath = importMatch[1]
        const targetLayer = this.detectLayerFromImport(importPath, filePath)
        
        if (targetLayer && targetLayer !== sourceLayer && targetLayer !== 'shared') {
          // Check if this violates a rule
          const rule = this.rules.find(r => 
            r.sourceLayer === sourceLayer && 
            r.targetLayer === targetLayer
          )
          
          if (rule && !rule.allowed) {
            violations.push({
              id: `violation_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              type: 'layer_violation',
              severity: 'error',
              rule: rule.id,
              source: {
                file: filePath,
                layer: sourceLayer,
                line: i + 1,
                code: line.trim()
              },
              target: {
                layer: targetLayer,
                module: importPath
              },
              message: `${sourceLayer} → ${targetLayer} dependency violation`,
              suggestion: rule.reason || 'Restructure to follow architecture rules',
              impact: 'Violates layer boundaries, increases coupling',
              detectedAt: new Date().toISOString()
            })
          }
        }
      }
    }

    return violations
  }

  /**
   * Detect circular dependencies
   */
  private detectCircularDependencies(snapshot: ArchitectureSnapshot): DriftViolation[] {
    const violations: DriftViolation[] = []
    
    // Build dependency graph
    const graph: Map<string, Set<string>> = new Map()
    
    for (const [layer, data] of Object.entries(snapshot.layers)) {
      for (const file of data.files) {
        if (!graph.has(file)) {
          graph.set(file, new Set())
        }
        
        for (const dep of data.dependencies) {
          graph.get(file)!.add(dep)
        }
      }
    }
    
    // Detect cycles using DFS
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    
    const detectCycle = (node: string, path: string[]): boolean => {
      visited.add(node)
      recursionStack.add(node)
      
      const neighbors = graph.get(node) || new Set()
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (detectCycle(neighbor, [...path, neighbor])) {
            return true
          }
        } else if (recursionStack.has(neighbor)) {
          // Found cycle
          violations.push({
            id: `violation_circular_${Date.now()}`,
            type: 'dependency_violation',
            severity: 'critical',
            rule: 'no-circular-dependencies',
            source: { file: node, layer: this.detectLayer(node) },
            target: { file: neighbor },
            message: `Circular dependency detected: ${[...path, neighbor].join(' → ')}`,
            suggestion: 'Break the cycle by extracting shared logic to a separate module',
            impact: 'Can cause import issues and makes code harder to understand',
            detectedAt: new Date().toISOString()
          })
          return true
        }
      }
      
      recursionStack.delete(node)
      return false
    }
    
    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        detectCycle(node, [node])
      }
    }

    return violations
  }

  /**
   * Detect pattern violations
   */
  private async detectPatternViolations(
    projectPath: string,
    snapshot: ArchitectureSnapshot
  ): Promise<DriftViolation[]> {
    const violations: DriftViolation[] = []
    
    // Anti-pattern detection
    const antiPatterns = [
      {
        pattern: /useState.*\[\]/g,
        name: 'array-in-useState',
        message: 'Mutable array in useState can cause issues',
        suggestion: 'Initialize with null and set in useEffect, or use useReducer'
      },
      {
        pattern: /useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*?\},\s*\[\]\s*\)/g,
        name: 'missing-dependencies',
        message: 'useEffect with empty deps might miss dependencies',
        suggestion: 'Check if all used variables should be in dependency array'
      },
      {
        pattern: /any\s*[;,=)]/g,
        name: 'explicit-any',
        message: 'Explicit use of "any" type loses type safety',
        suggestion: 'Use specific type or generic'
      },
      {
        pattern: /\.then\(/g,
        name: 'promise-then-chain',
        message: 'Promise .then() chain - consider async/await',
        suggestion: 'Use async/await for better readability'
      }
    ]
    
    for (const layerData of Object.values(snapshot.layers)) {
      for (const file of layerData.files) {
        try {
          const content = await fs.readFile(file, 'utf-8')
          
          for (const antiPattern of antiPatterns) {
            if (antiPattern.pattern.test(content)) {
              violations.push({
                id: `violation_pattern_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                type: 'pattern_violation',
                severity: 'warning',
                rule: `anti-pattern:${antiPattern.name}`,
                source: { file, layer: this.detectLayer(file) },
                target: {},
                message: antiPattern.message,
                suggestion: antiPattern.suggestion,
                impact: 'May lead to bugs or maintenance issues',
                detectedAt: new Date().toISOString()
              })
            }
          }
        } catch {}
      }
    }

    return violations
  }

  /**
   * Detect structure drift
   */
  private detectStructureDrift(snapshot: ArchitectureSnapshot): DriftViolation[] {
    const violations: DriftViolation[] = []
    
    // Check for empty layers (missing structure)
    for (const [layer, data] of Object.entries(snapshot.layers)) {
      if (layer !== 'shared' && data.files.length === 0) {
        violations.push({
          id: `violation_structure_${Date.now()}_${layer}`,
          type: 'structure_drift',
          severity: 'info',
          rule: 'required-layers',
          source: { file: '', layer: layer as ArchitectureLayer },
          target: {},
          message: `Layer "${layer}" has no files`,
          suggestion: `Add ${layer} layer files to maintain architecture`,
          impact: 'Missing layer may indicate architecture drift',
          detectedAt: new Date().toISOString()
        })
      }
    }
    
    // Check for unbalanced distribution
    const total = snapshot.metrics.totalFiles
    for (const [layer, count] of Object.entries(snapshot.metrics.layerDistribution)) {
      const percentage = total > 0 ? (count / total) * 100 : 0
      
      if (layer === 'domain' && percentage < 10 && total > 20) {
        violations.push({
          id: `violation_balance_domain`,
          type: 'structure_drift',
          severity: 'warning',
          rule: 'balanced-layers',
          source: { file: '', layer: 'domain' },
          target: {},
          message: 'Domain layer is too small relative to codebase',
          suggestion: 'Ensure business logic is properly extracted to domain layer',
          impact: 'May indicate anemic domain model',
          detectedAt: new Date().toISOString()
        })
      }
    }

    return violations
  }

  /**
   * Detect layer for a file path
   */
  private detectLayer(filePath: string): ArchitectureLayer {
    const normalized = filePath.replace(/\\/g, '/')
    
    for (const [layer, patterns] of Object.entries(LAYER_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(normalized)) {
          return layer as ArchitectureLayer
        }
      }
    }
    
    // Default to shared if no pattern matches
    return 'shared'
  }

  /**
   * Detect layer from import path
   */
  private detectLayerFromImport(importPath: string, sourceFile: string): ArchitectureLayer | null {
    // Skip external packages
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      return null
    }
    
    // Resolve relative path
    const sourceDir = path.dirname(sourceFile)
    const resolved = path.resolve(sourceDir, importPath)
    
    return this.detectLayer(resolved)
  }

  /**
   * Extract dependencies from code
   */
  private extractDependencies(content: string): string[] {
    const deps: string[] = []
    const importPattern = /import\s+.*from\s+['"]([^'"]+)['"]/g
    
    let match
    while ((match = importPattern.exec(content)) !== null) {
      deps.push(match[1])
    }
    
    return deps
  }

  /**
   * Extract exports from code
   */
  private extractExports(content: string): string[] {
    const exports: string[] = []
    const exportPatterns = [
      /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g,
      /export\s+\{\s*([^}]+)\s*\}/g
    ]
    
    for (const pattern of exportPatterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        if (match[1].includes(',')) {
          exports.push(...match[1].split(',').map(s => s.trim()))
        } else {
          exports.push(match[1])
        }
      }
    }
    
    return exports
  }

  /**
   * Calculate architecture metrics
   */
  private calculateMetrics(
    snapshot: ArchitectureSnapshot,
    violations: DriftViolation[]
  ): ArchitectureMetrics {
    const totalFiles = snapshot.metrics.totalFiles
    
    // Count cross-layer dependencies
    let crossLayerDeps = 0
    for (const [layer, data] of Object.entries(snapshot.layers)) {
      crossLayerDeps += data.dependencies.filter(d => {
        const targetLayer = this.detectLayer(d)
        return targetLayer !== layer && targetLayer !== 'shared'
      }).length
    }
    
    // Count violations by severity
    const errorCount = violations.filter(v => v.severity === 'error' || v.severity === 'critical').length
    
    // Calculate cohesion (higher = better)
    const layerBalance = Object.values(snapshot.metrics.layerDistribution)
    const avgFiles = totalFiles / 5
    const balanceVariance = layerBalance.reduce((sum, count) => 
      sum + Math.pow(count - avgFiles, 2), 0) / 5
    const cohesionScore = Math.max(0, 100 - (balanceVariance / totalFiles) * 100)
    
    // Calculate coupling (lower = better)
    const couplingScore = Math.min(100, (crossLayerDeps / Math.max(1, totalFiles)) * 20)
    
    // Calculate architecture health
    const violationPenalty = Math.min(50, errorCount * 5)
    const architectureHealth = Math.max(0, 
      (cohesionScore * 0.3) + 
      ((100 - couplingScore) * 0.4) + 
      (100 - violationPenalty) * 0.3
    )

    return {
      totalFiles,
      layerDistribution: snapshot.metrics.layerDistribution,
      crossLayerDependencies: crossLayerDeps,
      circularDependencies: violations.filter(v => v.type === 'dependency_violation').length,
      violationCount: violations.length,
      cohesionScore: Math.round(cohesionScore),
      couplingScore: Math.round(couplingScore),
      architectureHealth: Math.round(architectureHealth)
    }
  }

  /**
   * Analyze trends
   */
  private analyzeTrends(
    violations: DriftViolation[],
    metrics: ArchitectureMetrics
  ): DriftReport['trends'] {
    const previousViolations = this.snapshots.length > 1 
      ? this.snapshots[this.snapshots.length - 2].metrics.violationCount 
      : 0
    
    const violationsIncreasing = violations.length > previousViolations
    
    let healthTrend: 'improving' | 'stable' | 'declining' = 'stable'
    if (this.snapshots.length > 1) {
      const prevHealth = this.snapshots[this.snapshots.length - 2].metrics.architectureHealth
      if (metrics.architectureHealth > prevHealth + 5) {
        healthTrend = 'improving'
      } else if (metrics.architectureHealth < prevHealth - 5) {
        healthTrend = 'declining'
      }
    }
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (metrics.architectureHealth < 50 || violations.filter(v => v.severity === 'critical').length > 0) {
      riskLevel = 'critical'
    } else if (metrics.architectureHealth < 70 || violations.filter(v => v.severity === 'error').length > 5) {
      riskLevel = 'high'
    } else if (metrics.architectureHealth < 85 || violations.length > 10) {
      riskLevel = 'medium'
    }

    return {
      violationsIncreasing,
      healthTrend,
      riskLevel
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    violations: DriftViolation[],
    metrics: ArchitectureMetrics
  ): string[] {
    const recommendations: string[] = []
    
    // Based on violations
    const layerViolations = violations.filter(v => v.type === 'layer_violation')
    if (layerViolations.length > 0) {
      const sources = [...new Set(layerViolations.map(v => v.source.layer))]
      recommendations.push(`Review layer boundaries for: ${sources.join(', ')}`)
    }
    
    const circularViolations = violations.filter(v => v.type === 'dependency_violation')
    if (circularViolations.length > 0) {
      recommendations.push('Break circular dependencies by extracting shared modules')
    }
    
    // Based on metrics
    if (metrics.couplingScore > 50) {
      recommendations.push('Reduce coupling by introducing interfaces and dependency injection')
    }
    
    if (metrics.cohesionScore < 60) {
      recommendations.push('Improve layer balance by reorganizing code')
    }
    
    if (metrics.layerDistribution.domain < metrics.totalFiles * 0.1) {
      recommendations.push('Strengthen domain layer with proper entities and value objects')
    }
    
    return recommendations
  }

  /**
   * Get project files
   */
  private async getProjectFiles(projectPath: string): Promise<string[]> {
    const files: string[] = []
    
    const scan = async (dir: string) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          
          if (entry.isDirectory()) {
            if (!['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(entry.name)) {
              await scan(fullPath)
            }
          } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            files.push(fullPath)
          }
        }
      } catch {}
    }
    
    await scan(projectPath)
    return files
  }

  /**
   * Set baseline for comparison
   */
  setBaseline(snapshot: ArchitectureSnapshot): void {
    this.baseline = snapshot
  }

  /**
   * Get violation history
   */
  getViolationHistory(): ArchitectureSnapshot[] {
    return [...this.snapshots]
  }

  /**
   * Add custom rule
   */
  addRule(rule: ArchitectureRule): void {
    this.rules.push(rule)
  }
}

// Singleton
let detectorInstance: ArchitectureDriftDetector | null = null

export function getDriftDetector(): ArchitectureDriftDetector {
  if (!detectorInstance) {
    detectorInstance = new ArchitectureDriftDetector()
  }
  return detectorInstance
}

/**
 * Quick drift detection
 */
export async function detectDrift(projectPath: string): Promise<DriftReport> {
  const detector = getDriftDetector()
  return detector.detect(projectPath)
}
