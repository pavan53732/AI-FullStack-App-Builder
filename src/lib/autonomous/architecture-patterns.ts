/**
 * Architecture Pattern Detector
 * 
 * Detects architecture patterns in codebases to understand the system architecture
 * and provide recommendations for improvement or migration.
 * 
 * Supports detection of:
 * - Microservices
 * - Monolith
 * - Layered Architecture
 * - Event-Driven
 * - CQRS
 * - Clean Architecture
 * - Domain-Driven Design
 * - Serverless
 */

// ============================================================================
// Types
// ============================================================================

export interface ArchitecturePattern {
  name: string
  type: PatternType
  confidence: number // 0-1
  components: ComponentInfo[]
  connections: ConnectionInfo[]
  indicators: PatternIndicator[]
  metadata: PatternMetadata
}

export type PatternType = 
  | 'microservice'
  | 'monolith'
  | 'layered'
  | 'event_driven'
  | 'cqrs'
  | 'clean'
  | 'domain_driven'
  | 'serverless'
  | 'hexagonal'
  | 'mvc'
  | 'mvvm'
  | 'unknown'

export interface ComponentInfo {
  name: string
  type: ComponentType
  path: string
  dependencies: string[]
  responsibilities: string[]
}

export type ComponentType = 'service' | 'api' | 'data' | 'ui' | 'core' | 'infrastructure' | 'domain' | 'handler' | 'consumer' | 'producer'

export interface ConnectionInfo {
  from: string
  to: string
  type: ConnectionType
  description: string
}

export type ConnectionType = 'sync' | 'async' | 'event' | 'http' | 'grpc' | 'message_queue' | 'database' | 'file'

export interface PatternIndicator {
  type: IndicatorType
  description: string
  evidence: string
  confidence: number
}

export type IndicatorType = 'file_structure' | 'dependency' | 'naming_convention' | 'communication_pattern' | 'data_flow' | 'code_organization' | 'configuration'

export interface PatternMetadata {
  detectedAt: Date
  analyzedFiles: number
  analysisTime: number
  version: string
}

export interface DetectionConfig {
  /** Minimum confidence threshold for pattern detection */
  confidenceThreshold: number
  /** Include analysis of data flow */
  analyzeDataFlow: boolean
  /** Include analysis of communication patterns */
  analyzeCommunication: boolean
  /** Custom pattern rules */
  customPatterns: PatternRule[]
}

export interface PatternRule {
  pattern: PatternType
  indicators: IndicatorRule[]
  required: boolean
}

export interface IndicatorRule {
  pattern: string
  type: IndicatorType
  weight: number
}

export interface DetectionResult {
  patterns: ArchitecturePattern[]
  primaryPattern: PatternType
  confidence: number
  recommendations: PatternRecommendation[]
  summary: string
  metadata: PatternMetadata
}

export interface PatternRecommendation {
  type: 'continue' | 'refactor' | 'migrate' | 'modernize'
  description: string
  priority: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
}

export interface DetectionStats {
  totalAnalyses: number
  patternsDetected: number
  averageConfidence: number
  byType: Record<PatternType, number>
  averageAnalysisTime: number
}

// ============================================================================
// Architecture Pattern Detector Class
// ============================================================================

export class ArchitecturePatternDetector {
  private config: DetectionConfig
  private stats: DetectionStats = {
    totalAnalyses: 0,
    patternsDetected: 0,
    averageConfidence: 0,
    byType: {} as Record<PatternType, number>,
    averageAnalysisTime: 0
  }
  private confidenceHistory: number[] = []
  private analysisTimes: number[] = []

  // Pattern detection rules
  private readonly patternRules: Map<PatternType, PatternRule> = new Map([
    ['microservice', {
      pattern: 'microservice',
      required: true,
      indicators: [
        { pattern: 'api/', type: 'file_structure', weight: 1.0 },
        { pattern: 'services/', type: 'file_structure', weight: 1.0 },
        { pattern: 'docker-compose', type: 'configuration', weight: 0.8 },
        { pattern: 'kubernetes', type: 'file_structure', weight: 0.7 },
        { pattern: 'api-gateway', type: 'communication_pattern', weight: 0.8 },
        { pattern: 'service-discovery', type: 'configuration', weight: 0.6 }
      ]
    }],
    ['monolith', {
      pattern: 'monolith',
      required: true,
      indicators: [
        { pattern: 'single_entry_point', type: 'code_organization', weight: 1.0 },
        { pattern: 'services/', type: 'file_structure', weight: 0.6 },
        { pattern: 'shared_database', type: 'data_flow', weight: 0.8 },
        { pattern: 'single_repository', type: 'file_structure', weight: 0.9 }
      ]
    }],
    ['layered', {
      pattern: 'layered',
      required: true,
      indicators: [
        { pattern: 'controllers/', type: 'file_structure', weight: 0.9 },
        { pattern: 'services/', type: 'file_structure', weight: 0.8 },
        { pattern: 'models/', type: 'file_structure', weight: 0.8 },
        { pattern: 'repositories/', type: 'file_structure', weight: 0.7 },
        { pattern: 'data/', type: 'file_structure', weight: 0.6 }
      ]
    }],
    ['event_driven', {
      pattern: 'event_driven',
      required: true,
      indicators: [
        { pattern: 'events/', type: 'file_structure', weight: 0.9 },
        { pattern: 'handlers/', type: 'file_structure', weight: 0.8 },
        { pattern: 'producers/', type: 'file_structure', weight: 0.8 },
        { pattern: 'consumers/', type: 'file_structure', weight: 0.8 },
        { pattern: 'message', type: 'communication_pattern', weight: 0.9 },
        { pattern: 'event_bus', type: 'dependency', weight: 0.9 },
        { pattern: 'kafka', type: 'dependency', weight: 0.9 }
      ]
    }],
    ['cqrs', {
      pattern: 'cqrs',
      required: true,
      indicators: [
        { pattern: 'commands/', type: 'file_structure', weight: 1.0 },
        { pattern: 'queries/', type: 'file_structure', weight: 1.0 },
        { pattern: 'command_handler', type: 'naming_convention', weight: 0.9 },
        { pattern: 'query_handler', type: 'naming_convention', weight: 0.9 },
        { pattern: 'event_store', type: 'data_flow', weight: 0.8 }
      ]
    }],
    ['clean', {
      pattern: 'clean',
      required: true,
      indicators: [
        { pattern: 'domain/', type: 'file_structure', weight: 1.0 },
        { pattern: 'application/', type: 'file_structure', weight: 0.9 },
        { pattern: 'infrastructure/', type: 'file_structure', weight: 0.8 },
        { pattern: 'entities/', type: 'file_structure', weight: 0.8 },
        { pattern: 'use_cases', type: 'file_structure', weight: 0.9 },
        { pattern: 'gateways', type: 'naming_convention', weight: 0.7 }
      ]
    }],
    ['domain_driven', {
      pattern: 'domain_driven',
      required: true,
      indicators: [
        { pattern: 'domain/', type: 'file_structure', weight: 0.9 },
        { pattern: 'aggregates/', type: 'file_structure', weight: 1.0 },
        { pattern: 'entities/', type: 'file_structure', weight: 0.9 },
        { pattern: 'value_objects/', type: 'file_structure', weight: 0.9 },
        { pattern: 'repositories/', type: 'file_structure', weight: 0.7 },
        { pattern: 'domain_events', type: 'file_structure', weight: 0.8 },
        { pattern: 'bounded_context', type: 'code_organization', weight: 0.9 }
      ]
    }],
    ['serverless', {
      pattern: 'serverless',
      required: true,
      indicators: [
        { pattern: 'functions/', type: 'file_structure', weight: 1.0 },
        { pattern: 'serverless.yml', type: 'configuration', weight: 1.0 },
        { pattern: 'lambda', type: 'dependency', weight: 0.9 },
        { pattern: 'aws-lambda', type: 'dependency', weight: 0.9 },
        { pattern: 'function_handler', type: 'naming_convention', weight: 0.8 }
      ]
    }],
    ['hexagonal', {
      pattern: 'hexagonal',
      required: true,
      indicators: [
        { pattern: 'ports/', type: 'file_structure', weight: 1.0 },
        { pattern: 'adapters/', type: 'file_structure', weight: 1.0 },
        { pattern: 'core/', type: 'file_structure', weight: 0.8 },
        { pattern: 'port', type: 'naming_convention', weight: 0.9 },
        { pattern: 'adapter', type: 'naming_convention', weight: 0.9 }
      ]
    }],
    ['mvc', {
      pattern: 'mvc',
      required: true,
      indicators: [
        { pattern: 'controllers/', type: 'file_structure', weight: 1.0 },
        { pattern: 'views/', type: 'file_structure', weight: 1.0 },
        { pattern: 'models/', type: 'file_structure', weight: 1.0 },
        { pattern: 'controller', type: 'naming_convention', weight: 0.9 }
      ]
    }],
    ['mvvm', {
      pattern: 'mvvm',
      required: true,
      indicators: [
        { pattern: 'viewmodel', type: 'naming_convention', weight: 1.0 },
        { pattern: 'models/', type: 'file_structure', weight: 0.8 },
        { pattern: 'views/', type: 'file_structure', weight: 0.9 },
        { pattern: 'state_management', type: 'dependency', weight: 0.8 }
      ]
    }]
  ])

  constructor(config?: Partial<DetectionConfig>) {
    this.config = {
      confidenceThreshold: 0.6,
      analyzeDataFlow: true,
      analyzeCommunication: true,
      customPatterns: [],
      ...config
    }
  }

  /**
   * Detect architecture pattern from file structure
   */
  detectFromFiles(files: string[]): DetectionResult {
    const startTime = Date.now()
    const patterns: ArchitecturePattern[] = []

    // Analyze each pattern
    for (const [patternType, rule] of this.patternRules) {
      const pattern = this.analyzePattern(patternType, rule, files)
      if (pattern && pattern.confidence >= this.config.confidenceThreshold) {
        patterns.push(pattern)
      }
    }

    // Add custom patterns
    for (const custom of this.stats.customPatterns) {
      const pattern = this.analyzePattern(custom.pattern, custom, files)
      if (pattern && pattern.confidence >= this.config.conf_for(this.stats).confidenceThreshold) {
        patterns.push(pattern)
      }
    }

    // Find primary pattern
    const primaryPattern = this.determinePrimaryPattern(patterns)
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(primaryPattern, patterns)

    const analysisTime = Date.now() - startTime
    const metadata: PatternMetadata = {
      detectedAt: new Date(),
      analyzedFiles: files.length,
      analysisTime,
      version: '1.0.0'
    }

    // Update stats
    this.updateStats(patterns, analysisTime)

    return {
      patterns,
      primaryPattern,
      confidence: patterns.find(p => p.type === primaryPattern)?.confidence || 0,
      recommendations,
      summary: this.generateSummary(patterns, primaryPattern),
      metadata
    }
  }

  /**
   * Analyze a specific pattern
   */
  private analyzePattern(patternType: PatternType, rule: PatternRule, files: string[]): ArchitecturePattern | null {
    const matchedIndicators: PatternIndicator[] = []
    let totalWeight = 0
    let matchedWeight = 0

    for (const indicator of rule.indicators) {
      const matches = files.some(file => 
        file.toLowerCase().includes(indicator.pattern.toLowerCase())
      )

      if (matches) {
        matchedIndicators.push({
          type: indicator.type,
          description: `Found ${indicator.pattern} in project structure`,
          evidence: files.filter(f => 
            f.toLowerCase().includes(indicator.pattern.toLowerCase())
          ).slice(0, 3).join(', '),
          confidence: 1.0
        })
        matchedWeight += indicator.weight
      }
      totalWeight += indicator.weight
    }

    const confidence = totalWeight > 0 ? matchedWeight / totalWeight : 0

    if (matchedIndicators.length === 0) {
      return null
    }

    return {
      name: this.getPatternName(patternType),
      type: patternType,
      confidence,
      components: this.extractComponents(patternType, files),
      connections: this.extractConnections(patternType, files),
      indicators: matchedIndicators,
      metadata: {
        detectedAt: new Date(),
        analyzedFiles: files.length,
        analysisTime: 0,
        version: '1.0.0'
      }
    }
  }

  /**
   * Determine the primary pattern
   */
  private determinePrimaryPattern(patterns: ArchitecturePattern[]): PatternType {
    if (patterns.length === 0) return 'unknown'
    
    // Sort by confidence
    const sorted = [...patterns].sort((a, b) => b.confidence - a.confidence)
    return sorted[0].type
  }

  /**
   * Generate recommendations based on detected patterns
   */
  private generateRecommendations(primary: PatternType, patterns: ArchitecturePattern[]): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = []

    // Add recommendations based on pattern
    switch (primary) {
      case 'monolith':
        if (patterns.find(p => p.type === 'layered')?.confidence || 0 > 0.5) {
          recommendations.push({
            type: 'continue',
            description: 'Continue using layered monolith pattern for smaller applications',
            priority: 'low',
            effort: 'low'
          })
        }
        if (patterns.length > 5) {
          recommendations.push({
            type: 'refactor',
            description: 'Consider modularizing the monolith for better maintainability',
            priority: 'medium',
            effort: 'medium'
          })
        }
        break

      case 'microservice':
        recommendations.push({
          type: 'continue',
          description: 'Continue with microservice architecture for scalability',
          priority: 'low',
          effort: 'low'
        })
        break

      case 'event_driven':
        recommendations.push({
          type: 'monitor',
          description: 'Monitor event flow to ensure message reliability',
          priority: 'medium',
          effort: 'low'
        })
        break

      case 'clean':
      case 'domain_driven':
      case 'hexagonal':
        recommendations.push({
          type: 'continue',
          description: 'Follow the architecture guidelines for maintainability',
          priority: 'low',
          effort: 'low'
        })
        break

      default:
        recommendations.push({
          type: 'refactor',
          description: 'Consider establishing a clear architecture pattern',
          priority: 'medium',
          effort: 'high'
        })
    }

    return recommendations
  }

  /**
   * Extract components for a pattern
   */
  private extractComponents(patternType: PatternType, files: string[]): ComponentInfo[] {
    const components: ComponentInfo[] = []
    
    // Extract based on pattern type
    const componentMap: Record<PatternType, string[]> = {
      'layered': ['controllers', 'services', 'models', 'repositories', 'data'],
      'clean': ['domain', 'application', 'infrastructure', 'entities', 'use_cases'],
      'cqrs': ['commands', 'queries', 'handlers'],
      'microservice': ['api', 'services', 'core', 'data'],
      'domain_driven': ['domain', 'aggregates', 'entities', 'value_objects', 'repositories'],
      'event_driven': ['events', 'handlers', 'producers', 'consumers'],
      'hexagonal': ['core', 'ports', 'adapters'],
      'serverless': ['functions', 'handlers'],
      'mvc': ['models', 'views', 'controllers'],
      'mvvm': ['models', 'viewmodels', 'views'],
      'monolith': ['app', 'src', 'lib'],
      'unknown': []
    }

    const expectedComponents = componentMap[patternType] || []
    
    for (const comp of expectedComponents) {
      const matchedFiles = files.filter(f => 
        f.toLowerCase().includes(comp.toLowerCase())
      )
      
      if (matchedFiles.length > 0) {
        components.push({
          name: comp,
          type: this.mapComponentType(comp),
          path: matchedFiles[0],
          dependencies: [],
          responsibilities: [comp]
        })
      }
    }

    return components
  }

  /**
   * Extract connections between components
   */
  private extractConnections(patternType: PatternType, files: string[]): ConnectionInfo[] {
    const connections: ConnectionInfo[] = []
    
    // Add typical connections based on pattern
    switch (patternType) {
      case 'layered':
        connections.push(
          { from: 'controllers', to: 'services', type: 'sync', description: 'Controller calls service layer' },
          { from: 'services', to: 'repositories', type: 'sync', description: 'Service calls repository' },
          { from: 'repositories', to: 'data', type: 'database', description: 'Repository accesses database' }
        )
        break
      case 'event_driven':
        connections.push(
          { from: 'producers', to: 'events', type: 'event', description: 'Producer emits events' },
          { from: 'events', to: 'consumers', type: 'async', description: 'Event delivered to consumers' }
        )
        break
      case 'microservice':
        connections.push(
          { from: 'api', to: 'services', type: 'http', description: 'API calls services' },
          { from: 'services', to: 'data', type: 'database', description: 'Service accesses data' }
        )
        break
    }

    return connections
  }

  /**
   * Map component type
   */
  private mapComponentType(comp: string): ComponentType {
    const mappings: Record<string, ComponentType> = {
      'controllers': 'api',
      'services': 'service',
      'models': 'domain',
      'repositories': 'data',
      'data': 'data',
      'domain': 'domain',
      'events': 'handler',
      'handlers': 'handler',
      'commands': 'handler',
      'queries': 'handler',
      'views': 'ui',
      'functions': 'handler'
    }
    return mappings[comp] || 'core'
  }

  /**
   * Get human-readable pattern name
   */
  private getPatternName(patternType: PatternType): string {
    const names: Record<PatternType, string> = {
      'microservice': 'Microservice Architecture',
      'monolith': 'Monolithic Architecture',
      'layered': 'Layered Architecture',
      'event_driven': 'Event-Driven Architecture',
      'cqr': 'CQRS Pattern',
      'clean': 'Clean Architecture',
      'domain_driven': 'Domain-Driven Design',
      'serverless': 'Serverless Architecture',
      'hexagonal': 'Hexagonal Architecture',
      'mvc': 'Model-View-Controller',
      'mvvm': 'Model-View-ViewModel',
      'unknown': 'Unknown Architecture'
    }
    return names[patternType] || patternType
  }

  /**
   * Generate summary
   */
  private generateSummary(patterns: ArchitecturePattern[], primary: PatternType): string {
    if (patterns.length === 0) {
      return 'No recognizable architecture pattern detected in the codebase.'
    }

    const primaryName = this.getPatternName(primary)
    const otherPatterns = patterns.filter(p => p.type !== primary)
    
    let summary = `The codebase primarily follows the ${primaryName} pattern.`
    
    if (otherPatterns.length > 0) {
      summary += ` There are also elements of ${otherPatterns.map(p => this.getPatternName(p.type)).join(', ')}.`
    }

    return summary
  }

  /**
   * Update statistics
   */
  private updateStats(patterns: PatternAnalysis[], analysisTime: number): void {
    this.stats.totalAnalyses++
    this.stats.patternsDetected += patterns.length
    this.analysisTimes.push(analysisTime)
    
    for (const pattern of patterns) {
      this.confidenceHistory.push(pattern.confidence)
      this.stats.byType[pattern.type] = (this.stats.byType[pattern.type] || 0) + 1
    }

    this.stats.averageConfidence = 
      this.confidenceHistory.reduce((a, b) => a + b, 0) / this.confidenceHistory.length
    this.stats.averageAnalysisTime =
      this.analysisTimes.reduce((a, b) => a + b, 0) / this.analysisTimes.length
  }

  /**
   * Get detection statistics
   */
  getStats(): DetectionStats {
    return { ...this.stats }
  }

  /**
   * Add custom pattern
   */
  addCustomPattern(pattern: PatternRule): void {
    this.config.customPatterns.push(pattern)
    this.patternRules.set(pattern.pattern, pattern)
  }

  /**
   * Reset the detector
   */
  reset(): void {
    this.stats = {
      totalAnalyses: 0,
      patternsDetected: 0,
      averageConfidence: 0,
      byType: {} as Record<PatternType, number>,
      averageAnalysisTime: 0
    }
    this.confidenceHistory = []
    this.analysisTimes = []
  }
}

// Type definition for internal use
interface PatternAnalysis {
  type: PatternType
  confidence: number
}

// ============================================================================
// Singleton Instance
// ============================================================================

let detectorInstance: ArchitecturePatternDetector | null = null

export function getArchitecturePatternDetector(config?: Partial<DetectionConfig>): ArchitecturePatternDetector {
  if (!detectorInstance) {
    detectorInstance = new ArchitecturePatternDetector(config)
  }
  return detectorInstance
}

// ============================================================================
// Convenience Functions
// */

/**
 * Detect architecture pattern from files
 */
export function detectArchitecturePattern(files: string[]): DetectionResult {
  return getArchitecturePatternDetector().detectFromFiles(files)
}

/**
 * Get detection statistics
 */
export function getPatternDetectionStats(): DetectionStats {
  return getArchitecturePatternDetector().getStats()
}

/**
 * Add custom pattern
 */
export function addArchitecturePattern(pattern: PatternRule): void {
  return getArchitecturePatternDetector().addCustomPattern(pattern)
}
