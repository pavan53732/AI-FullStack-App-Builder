/**
 * Architecture Graph Builder
 * 
 * Builds and analyzes architecture graphs:
 * - Component dependency graphs
 * - Service topology
 * - Data flow visualization
 * - API communication patterns
 * - Architecture simulation
 * - Impact analysis
 */

import fs from 'fs/promises'
import path from 'path'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')

// Graph Types
export interface ArchitectureNode {
  id: string
  type: 'service' | 'component' | 'api' | 'database' | 'cache' | 'queue' | 'storage' | 'external' | 'frontend' | 'backend'
  name: string
  layer: 'presentation' | 'application' | 'domain' | 'infrastructure'
  metadata: {
    file?: string
    technology?: string
    port?: number
    endpoint?: string
    description?: string
    health?: 'healthy' | 'degraded' | 'down'
    metrics?: NodeMetrics
  }
}

export interface NodeMetrics {
  requestCount?: number
  errorRate?: number
  latency?: number
  cpuUsage?: number
  memoryUsage?: number
}

export interface ArchitectureEdge {
  id: string
  source: string
  target: string
  type: 'dependency' | 'data-flow' | 'api-call' | 'event' | 'sync' | 'async'
  label?: string
  metadata: {
    protocol?: string
    frequency?: 'high' | 'medium' | 'low'
    critical?: boolean
    latency?: number
  }
}

export interface ArchitectureGraph {
  id: string
  projectId: string
  nodes: ArchitectureNode[]
  edges: ArchitectureEdge[]
  layers: ArchitectureLayer[]
  metadata: {
    createdAt: string
    updatedAt: string
    version: string
    complexity: number
    health: number
  }
}

export interface ArchitectureLayer {
  name: string
  nodes: string[]
  allowedDependencies: string[]
}

export interface ArchitectureViolation {
  type: 'layer-violation' | 'circular-dependency' | 'missing-dependency' | 'deprecated-pattern' | 'security-risk'
  severity: 'error' | 'warning' | 'info'
  source: string
  target?: string
  message: string
  suggestion?: string
}

export interface ImpactAnalysis {
  change: {
    nodeId: string
    changeType: 'add' | 'modify' | 'remove'
    description: string
  }
  affectedNodes: Array<{
    nodeId: string
    impact: 'breaking' | 'compatible' | 'unknown'
    reason: string
  }>
  risks: string[]
  recommendations: string[]
}

export interface SimulationResult {
  scenario: string
  success: boolean
  metrics: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    avgLatency: number
    p99Latency: number
  }
  bottlenecks: string[]
  failures: Array<{ node: string; reason: string }>
}

/**
 * Architecture Graph Builder
 */
export class ArchitectureGraphBuilder {
  private graphs: Map<string, ArchitectureGraph> = new Map()

  /**
   * Build architecture graph from project
   */
  async buildGraph(projectPath: string): Promise<ArchitectureGraph> {
    const fullPath = path.join(WORKSPACE_DIR, projectPath)
    
    const nodes: ArchitectureNode[] = []
    const edges: ArchitectureEdge[] = []
    
    // Analyze project structure
    const projectInfo = await this.analyzeProjectStructure(fullPath)
    
    // Build frontend nodes
    if (projectInfo.hasFrontend) {
      nodes.push(...await this.buildFrontendNodes(fullPath, projectInfo))
    }
    
    // Build backend nodes
    if (projectInfo.hasBackend) {
      nodes.push(...await this.buildBackendNodes(fullPath, projectInfo))
    }
    
    // Build API nodes
    nodes.push(...await this.buildAPINodes(fullPath, projectInfo))
    
    // Build database nodes
    if (projectInfo.hasDatabase) {
      nodes.push(...this.buildDatabaseNodes(projectInfo))
    }
    
    // Build external service nodes
    nodes.push(...this.buildExternalNodes(projectInfo))
    
    // Build edges (dependencies)
    edges.push(...await this.buildEdges(fullPath, nodes, projectInfo))
    
    // Build layers
    const layers = this.buildLayers(nodes)
    
    // Calculate metrics
    const complexity = this.calculateComplexity(nodes, edges)
    const health = this.calculateHealth(nodes)
    
    const graph: ArchitectureGraph = {
      id: `arch_${Date.now().toString(36)}`,
      projectId: projectPath,
      nodes,
      edges,
      layers,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0',
        complexity,
        health
      }
    }
    
    this.graphs.set(projectPath, graph)
    
    return graph
  }

  /**
   * Analyze project structure
   */
  private async analyzeProjectStructure(fullPath: string): Promise<{
    hasFrontend: boolean
    hasBackend: boolean
    hasDatabase: boolean
    framework: string
    backendFramework?: string
    database?: string
    apis: string[]
    externalServices: string[]
  }> {
    const info = {
      hasFrontend: false,
      hasBackend: false,
      hasDatabase: false,
      framework: 'unknown',
      backendFramework: undefined as string | undefined,
      database: undefined as string | undefined,
      apis: [] as string[],
      externalServices: [] as string[]
    }
    
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(fullPath, 'package.json'), 'utf-8'))
      const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies }
      
      // Detect frontend
      if (deps.react || deps.vue || deps.svelte || deps.next || deps.nuxt) {
        info.hasFrontend = true
        info.framework = deps.next ? 'nextjs' : deps.nuxt ? 'nuxt' : deps.react ? 'react' : deps.vue ? 'vue' : 'svelte'
      }
      
      // Detect backend
      if (deps.express || deps.fastify || deps.nestjs || deps.hono) {
        info.hasBackend = true
        info.backendFramework = deps.nestjs ? 'nestjs' : deps.express ? 'express' : deps.fastify ? 'fastify' : 'hono'
      }
      
      // Next.js is fullstack
      if (deps.next) {
        info.hasBackend = true
        info.backendFramework = 'nextjs-api'
      }
      
      // Detect database
      if (deps.prisma || deps['@prisma/client']) {
        info.hasDatabase = true
        info.database = 'postgresql'
      } else if (deps.mongoose) {
        info.hasDatabase = true
        info.database = 'mongodb'
      } else if (deps.pg || deps.postgres) {
        info.hasDatabase = true
        info.database = 'postgresql'
      } else if (deps.mysql || deps.mysql2) {
        info.hasDatabase = true
        info.database = 'mysql'
      }
      
      // Detect APIs
      if (deps.stripe) info.apis.push('stripe')
      if (deps.openai) info.apis.push('openai')
      if (deps['@anthropic-ai/sdk']) info.apis.push('anthropic')
      if (deps.twilio) info.apis.push('twilio')
      if (deps['aws-sdk']) info.apis.push('aws')
      if (deps['@google-cloud/storage']) info.apis.push('gcp')
      
      // Detect external services
      if (deps.redis || deps.ioredis) info.externalServices.push('redis')
      if (deps['@bullmq/redis']) info.externalServices.push('bullmq')
      if (deps.elasticsearch) info.externalServices.push('elasticsearch')
      
    } catch {}
    
    return info
  }

  /**
   * Build frontend nodes
   */
  private async buildFrontendNodes(fullPath: string, projectInfo: any): Promise<ArchitectureNode[]> {
    const nodes: ArchitectureNode[] = []
    
    nodes.push({
      id: 'frontend-app',
      type: 'frontend',
      name: 'Frontend Application',
      layer: 'presentation',
      metadata: {
        technology: projectInfo.framework,
        description: `Main ${projectInfo.framework} application`,
        health: 'healthy'
      }
    })
    
    // Add component nodes
    try {
      const componentsDir = path.join(fullPath, 'src/components')
      const entries = await fs.readdir(componentsDir).catch(() => [])
      
      for (const entry of entries.slice(0, 10)) {
        if (entry.endsWith('.tsx') || entry.endsWith('.jsx')) {
          nodes.push({
            id: `component-${entry.replace(/\.[^.]+$/, '')}`,
            type: 'component',
            name: entry.replace(/\.[^.]+$/, ''),
            layer: 'presentation',
            metadata: {
              file: `src/components/${entry}`,
              technology: 'react'
            }
          })
        }
      }
    } catch {}
    
    return nodes
  }

  /**
   * Build backend nodes
   */
  private async buildBackendNodes(fullPath: string, projectInfo: any): Promise<ArchitectureNode[]> {
    const nodes: ArchitectureNode[] = []
    
    if (projectInfo.backendFramework && projectInfo.backendFramework !== 'nextjs-api') {
      nodes.push({
        id: 'backend-server',
        type: 'backend',
        name: 'Backend Server',
        layer: 'application',
        metadata: {
          technology: projectInfo.backendFramework,
          port: 3001,
          description: `${projectInfo.backendFramework} backend server`,
          health: 'healthy'
        }
      })
    }
    
    // Add service nodes
    try {
      const servicesDir = path.join(fullPath, 'src/services')
      const entries = await fs.readdir(servicesDir).catch(() => [])
      
      for (const entry of entries.slice(0, 10)) {
        if (entry.endsWith('.ts') || entry.endsWith('.js')) {
          nodes.push({
            id: `service-${entry.replace(/\.[^.]+$/, '')}`,
            type: 'service',
            name: entry.replace(/\.[^.]+$/, ''),
            layer: 'domain',
            metadata: {
              file: `src/services/${entry}`,
              technology: 'typescript'
            }
          })
        }
      }
    } catch {}
    
    return nodes
  }

  /**
   * Build API nodes
   */
  private async buildAPINodes(fullPath: string, projectInfo: any): Promise<ArchitectureNode[]> {
    const nodes: ArchitectureNode[] = []
    
    // Next.js API routes
    if (projectInfo.framework === 'nextjs') {
      try {
        const apiDir = path.join(fullPath, 'src/app/api')
        const entries = await fs.readdir(apiDir).catch(() => [])
        
        for (const entry of entries.slice(0, 15)) {
          nodes.push({
            id: `api-${entry}`,
            type: 'api',
            name: `/api/${entry}`,
            layer: 'application',
            metadata: {
              endpoint: `/api/${entry}`,
              technology: 'nextjs-api'
            }
          })
        }
      } catch {}
    }
    
    return nodes
  }

  /**
   * Build database nodes
   */
  private buildDatabaseNodes(projectInfo: any): ArchitectureNode[] {
    const nodes: ArchitectureNode[] = []
    
    nodes.push({
      id: 'database',
      type: 'database',
      name: `${projectInfo.database?.toUpperCase() || 'Database'}`,
      layer: 'infrastructure',
      metadata: {
        technology: projectInfo.database,
        description: 'Primary database',
        health: 'healthy'
      }
    })
    
    return nodes
  }

  /**
   * Build external service nodes
   */
  private buildExternalNodes(projectInfo: any): ArchitectureNode[] {
    const nodes: ArchitectureNode[] = []
    
    for (const api of projectInfo.apis) {
      nodes.push({
        id: `external-${api}`,
        type: 'external',
        name: api.charAt(0).toUpperCase() + api.slice(1),
        layer: 'infrastructure',
        metadata: {
          technology: api,
          description: `External ${api} API`
        }
      })
    }
    
    for (const service of projectInfo.externalServices) {
      nodes.push({
        id: `service-${service}`,
        type: service === 'redis' ? 'cache' : 'queue',
        name: service.charAt(0).toUpperCase() + service.slice(1),
        layer: 'infrastructure',
        metadata: {
          technology: service
        }
      })
    }
    
    return nodes
  }

  /**
   * Build edges (dependencies)
   */
  private async buildEdges(fullPath: string, nodes: ArchitectureNode[], projectInfo: any): Promise<ArchitectureEdge[]> {
    const edges: ArchitectureEdge[] = []
    
    // Frontend -> Backend
    const frontendApp = nodes.find(n => n.id === 'frontend-app')
    const backendServer = nodes.find(n => n.id === 'backend-server')
    
    if (frontendApp && backendServer) {
      edges.push({
        id: 'edge-frontend-backend',
        source: frontendApp.id,
        target: backendServer.id,
        type: 'api-call',
        label: 'API Requests',
        metadata: {
          protocol: 'HTTP/REST',
          frequency: 'high',
          critical: true
        }
      })
    }
    
    // Frontend -> API routes
    if (frontendApp) {
      const apiNodes = nodes.filter(n => n.type === 'api')
      for (const api of apiNodes) {
        edges.push({
          id: `edge-${frontendApp.id}-${api.id}`,
          source: frontendApp.id,
          target: api.id,
          type: 'api-call',
          metadata: {
            protocol: 'HTTP',
            frequency: 'high'
          }
        })
      }
    }
    
    // Backend/API -> Database
    const database = nodes.find(n => n.type === 'database')
    const appNodes = nodes.filter(n => n.type === 'backend' || n.type === 'api')
    
    for (const app of appNodes) {
      if (database) {
        edges.push({
          id: `edge-${app.id}-database`,
          source: app.id,
          target: database.id,
          type: 'data-flow',
          label: 'Queries',
          metadata: {
            protocol: projectInfo.database === 'mongodb' ? 'MongoDB' : 'SQL',
            frequency: 'high',
            critical: true
          }
        })
      }
    }
    
    // Services -> External APIs
    const externalNodes = nodes.filter(n => n.type === 'external')
    for (const ext of externalNodes) {
      for (const app of appNodes) {
        edges.push({
          id: `edge-${app.id}-${ext.id}`,
          source: app.id,
          target: ext.id,
          type: 'api-call',
          label: 'External API',
          metadata: {
            protocol: 'HTTPS',
            frequency: 'medium'
          }
        })
      }
    }
    
    // Services -> Cache
    const cacheNodes = nodes.filter(n => n.type === 'cache')
    for (const cache of cacheNodes) {
      for (const app of appNodes) {
        edges.push({
          id: `edge-${app.id}-${cache.id}`,
          source: app.id,
          target: cache.id,
          type: 'data-flow',
          label: 'Cache',
          metadata: {
            protocol: 'Redis',
            frequency: 'high'
          }
        })
      }
    }
    
    // Components -> Frontend
    const components = nodes.filter(n => n.type === 'component')
    if (frontendApp) {
      for (const comp of components) {
        edges.push({
          id: `edge-${comp.id}-${frontendApp.id}`,
          source: comp.id,
          target: frontendApp.id,
          type: 'dependency',
          metadata: {
            frequency: 'low'
          }
        })
      }
    }
    
    return edges
  }

  /**
   * Build layers
   */
  private buildLayers(nodes: ArchitectureNode[]): ArchitectureLayer[] {
    const layers: ArchitectureLayer[] = [
      {
        name: 'presentation',
        nodes: nodes.filter(n => n.layer === 'presentation').map(n => n.id),
        allowedDependencies: ['application', 'domain']
      },
      {
        name: 'application',
        nodes: nodes.filter(n => n.layer === 'application').map(n => n.id),
        allowedDependencies: ['domain', 'infrastructure']
      },
      {
        name: 'domain',
        nodes: nodes.filter(n => n.layer === 'domain').map(n => n.id),
        allowedDependencies: ['infrastructure']
      },
      {
        name: 'infrastructure',
        nodes: nodes.filter(n => n.layer === 'infrastructure').map(n => n.id),
        allowedDependencies: []
      }
    ]
    
    return layers
  }

  /**
   * Calculate complexity score
   */
  private calculateComplexity(nodes: ArchitectureNode[], edges: ArchitectureEdge[]): number {
    const nodeComplexity = nodes.length * 1
    const edgeComplexity = edges.length * 0.5
    const criticalEdges = edges.filter(e => e.metadata.critical).length * 2
    const externalDeps = nodes.filter(n => n.type === 'external').length * 3
    
    return Math.min(100, nodeComplexity + edgeComplexity + criticalEdges + externalDeps)
  }

  /**
   * Calculate health score
   */
  private calculateHealth(nodes: ArchitectureNode[]): number {
    const healthNodes = nodes.filter(n => n.metadata.health === 'healthy')
    const degradedNodes = nodes.filter(n => n.metadata.health === 'degraded')
    const downNodes = nodes.filter(n => n.metadata.health === 'down')
    
    if (nodes.length === 0) return 100
    
    return Math.round(
      ((healthNodes.length * 100) + (degradedNodes.length * 50) + (downNodes.length * 0)) / nodes.length
    )
  }

  /**
   * Detect architecture violations
   */
  detectViolations(graph: ArchitectureGraph): ArchitectureViolation[] {
    const violations: ArchitectureViolation[] = []
    
    // Check layer violations
    for (const edge of graph.edges) {
      const sourceNode = graph.nodes.find(n => n.id === edge.source)
      const targetNode = graph.nodes.find(n => n.id === edge.target)
      
      if (!sourceNode || !targetNode) continue
      
      const sourceLayer = graph.layers.find(l => l.name === sourceNode.layer)
      if (sourceLayer && !sourceLayer.allowedDependencies.includes(targetNode.layer)) {
        violations.push({
          type: 'layer-violation',
          severity: 'warning',
          source: edge.source,
          target: edge.target,
          message: `${sourceNode.layer} layer cannot depend on ${targetNode.layer} layer`,
          suggestion: `Move ${targetNode.name} to an allowed layer for ${sourceNode.layer}`
        })
      }
    }
    
    // Check circular dependencies
    const cycles = this.detectCycles(graph)
    for (const cycle of cycles) {
      violations.push({
        type: 'circular-dependency',
        severity: 'error',
        source: cycle.join(' -> '),
        message: `Circular dependency detected: ${cycle.join(' -> ')}`,
        suggestion: 'Break the cycle by introducing an interface or extracting shared logic'
      })
    }
    
    return violations
  }

  /**
   * Detect cycles in graph
   */
  private detectCycles(graph: ArchitectureGraph): string[][] {
    const cycles: string[][] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    
    const dfs = (nodeId: string, path: string[]): boolean => {
      visited.add(nodeId)
      recursionStack.add(nodeId)
      
      const outgoingEdges = graph.edges.filter(e => e.source === nodeId)
      
      for (const edge of outgoingEdges) {
        if (!visited.has(edge.target)) {
          if (dfs(edge.target, [...path, edge.target])) {
            return true
          }
        } else if (recursionStack.has(edge.target)) {
          const cycleStart = path.indexOf(edge.target)
          if (cycleStart !== -1) {
            cycles.push([...path.slice(cycleStart), edge.target])
          }
        }
      }
      
      recursionStack.delete(nodeId)
      return false
    }
    
    for (const node of graph.nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id, [node.id])
      }
    }
    
    return cycles
  }

  /**
   * Analyze impact of changes
   */
  analyzeImpact(graph: ArchitectureGraph, change: ImpactAnalysis['change']): ImpactAnalysis {
    const affectedNodes: ImpactAnalysis['affectedNodes'] = []
    const risks: string[] = []
    const recommendations: string[] = []
    
    // Find all nodes that depend on the changed node
    const dependents = this.findDependents(graph, change.nodeId)
    
    for (const dep of dependents) {
      const node = graph.nodes.find(n => n.id === dep)
      if (!node) continue
      
      const edge = graph.edges.find(e => e.source === dep && e.target === change.nodeId)
      
      affectedNodes.push({
        nodeId: dep,
        impact: edge?.metadata.critical ? 'breaking' : 'compatible',
        reason: `Depends on ${change.nodeId} via ${edge?.type || 'unknown'}`
      })
      
      if (edge?.metadata.critical) {
        risks.push(`Critical dependency from ${node.name} may break`)
      }
    }
    
    // Generate recommendations
    if (affectedNodes.some(a => a.impact === 'breaking')) {
      recommendations.push('Create backward-compatible interface before changing')
      recommendations.push('Update all dependent components simultaneously')
    }
    
    if (change.changeType === 'remove') {
      recommendations.push('Verify no active traffic to this component before removal')
    }
    
    return {
      change,
      affectedNodes,
      risks,
      recommendations
    }
  }

  /**
   * Find all nodes that depend on a given node
   */
  private findDependents(graph: ArchitectureGraph, nodeId: string): string[] {
    const dependents = new Set<string>()
    
    const findDependentsRecursive = (id: string) => {
      const incomingEdges = graph.edges.filter(e => e.target === id)
      
      for (const edge of incomingEdges) {
        if (!dependents.has(edge.source)) {
          dependents.add(edge.source)
          findDependentsRecursive(edge.source)
        }
      }
    }
    
    findDependentsRecursive(nodeId)
    
    return Array.from(dependents)
  }

  /**
   * Simulate architecture scenario
   */
  simulateScenario(
    graph: ArchitectureGraph,
    scenario: 'high-load' | 'node-failure' | 'network-latency' | 'database-slow',
    options: { failedNode?: string; latency?: number } = {}
  ): SimulationResult {
    const result: SimulationResult = {
      scenario,
      success: true,
      metrics: {
        totalRequests: 10000,
        successfulRequests: 10000,
        failedRequests: 0,
        avgLatency: 50,
        p99Latency: 150
      },
      bottlenecks: [],
      failures: []
    }
    
    switch (scenario) {
      case 'high-load':
        result.metrics.totalRequests = 100000
        result.metrics.successfulRequests = 95000
        result.metrics.failedRequests = 5000
        result.metrics.avgLatency = 200
        result.metrics.p99Latency = 800
        
        // Find bottlenecks (nodes with most incoming edges)
        const incomingCount = new Map<string, number>()
        for (const edge of graph.edges) {
          incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1)
        }
        
        for (const [nodeId, count] of incomingCount) {
          if (count > 3) {
            const node = graph.nodes.find(n => n.id === nodeId)
            if (node) {
              result.bottlenecks.push(`${node.name} (${count} incoming connections)`)
            }
          }
        }
        break
        
      case 'node-failure':
        if (options.failedNode) {
          const failedNode = graph.nodes.find(n => n.id === options.failedNode)
          if (failedNode) {
            result.failures.push({ node: options.failedNode, reason: 'Simulated failure' })
            
            // Find all dependent nodes that would fail
            const dependents = this.findDependents(graph, options.failedNode)
            for (const dep of dependents) {
              const node = graph.nodes.find(n => n.id === dep)
              const edge = graph.edges.find(e => e.source === dep && e.target === options.failedNode)
              
              if (edge?.metadata.critical) {
                result.failures.push({ node: dep, reason: `Critical dependency on ${options.failedNode}` })
              }
            }
            
            result.metrics.successfulRequests = 10000 - (result.failures.length * 1000)
            result.metrics.failedRequests = result.failures.length * 1000
          }
        }
        break
        
      case 'network-latency':
        result.metrics.avgLatency = 200 + (options.latency || 100)
        result.metrics.p99Latency = 500 + (options.latency || 100) * 3
        
        // Find nodes with most external calls
        for (const node of graph.nodes.filter(n => n.type === 'external')) {
          result.bottlenecks.push(`${node.name} (external API latency)`)
        }
        break
        
      case 'database-slow':
        result.metrics.avgLatency = 500
        result.metrics.p99Latency = 2000
        
        const dbNode = graph.nodes.find(n => n.type === 'database')
        if (dbNode) {
          result.bottlenecks.push(dbNode.name)
        }
        break
    }
    
    result.success = result.metrics.failedRequests < result.metrics.totalRequests * 0.5
    
    return result
  }

  /**
   * Generate architecture diagram (ASCII)
   */
  generateDiagram(graph: ArchitectureGraph): string {
    const lines: string[] = []
    
    lines.push('┌─────────────────────────────────────────────────────────────────┐')
    lines.push('│                    ARCHITECTURE DIAGRAM                         │')
    lines.push('├─────────────────────────────────────────────────────────────────┤')
    lines.push('')
    
    // Group by layer
    for (const layer of ['presentation', 'application', 'domain', 'infrastructure']) {
      const layerNodes = graph.nodes.filter(n => n.layer === layer)
      
      if (layerNodes.length > 0) {
        lines.push(`│ ${layer.toUpperCase()} LAYER`)
        lines.push('│ ┌───────────────────────────────────────────────────────────┐')
        
        for (const node of layerNodes) {
          const icon = this.getNodeIcon(node.type)
          const health = node.metadata.health === 'healthy' ? '✓' : node.metadata.health === 'degraded' ? '⚠' : '✗'
          lines.push(`│ │ ${icon} ${node.name.padEnd(30)} ${health}`)
        }
        
        lines.push('│ └───────────────────────────────────────────────────────────┘')
        lines.push('│')
      }
    }
    
    // Show connections
    lines.push('│ DEPENDENCIES')
    lines.push('│ ┌───────────────────────────────────────────────────────────┐')
    
    for (const edge of graph.edges.slice(0, 15)) {
      const source = graph.nodes.find(n => n.id === edge.source)?.name || edge.source
      const target = graph.nodes.find(n => n.id === edge.target)?.name || edge.target
      const critical = edge.metadata.critical ? ' [CRITICAL]' : ''
      lines.push(`│ │ ${source.slice(0, 15).padEnd(15)} → ${target.slice(0, 15).padEnd(15)}${critical}`)
    }
    
    lines.push('│ └───────────────────────────────────────────────────────────┘')
    lines.push('')
    lines.push(`│ Complexity: ${graph.metadata.complexity}/100    Health: ${graph.metadata.health}%`)
    lines.push('└─────────────────────────────────────────────────────────────────┘')
    
    return lines.join('\n')
  }

  /**
   * Get icon for node type
   */
  private getNodeIcon(type: ArchitectureNode['type']): string {
    const icons: Record<ArchitectureNode['type'], string> = {
      service: '⚙️',
      component: '🧩',
      api: '🔌',
      database: '🗄️',
      cache: '⚡',
      queue: '📬',
      storage: '📁',
      external: '🌐',
      frontend: '🖥️',
      backend: '⚙️'
    }
    return icons[type] || '📦'
  }

  /**
   * Get stored graph
   */
  getGraph(projectPath: string): ArchitectureGraph | undefined {
    return this.graphs.get(projectPath)
  }

  /**
   * Get all graphs
   */
  getAllGraphs(): ArchitectureGraph[] {
    return Array.from(this.graphs.values())
  }
}

// Singleton
let builder: ArchitectureGraphBuilder | null = null

export function getArchitectureBuilder(): ArchitectureGraphBuilder {
  if (!builder) {
    builder = new ArchitectureGraphBuilder()
  }
  return builder
}
