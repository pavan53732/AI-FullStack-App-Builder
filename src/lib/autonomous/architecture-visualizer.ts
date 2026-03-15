/**
 * Architecture Visualizer - Mechanism #407
 * 
 * Creates visual representations of software architecture,
 * including component diagrams, dependency graphs, and system views.
 * 
 * Features:
 * - Component diagram generation
 * - Dependency visualization
 * - System architecture views
 * - Interactive diagrams
 * - Multiple output formats
 */

import ZAI from 'z-ai-web-dev-sdk'

// Types
export interface ArchitectureVisualization {
  id: string
  name: string
  type: VisualizationType
  nodes: VisualNode[]
  edges: VisualEdge[]
  groups: VisualGroup[]
  metadata: Record<string, any>
  createdAt: Date
}

export type VisualizationType = 
  | 'component'
  | 'dependency'
  | 'sequence'
  | 'deployment'
  | 'layered'
  | 'microservice'
  | 'dataflow'
  | 'event'

export interface VisualNode {
  id: string
  label: string
  type: NodeType
  x: number
  y: number
  width: number
  height: number
  color: string
  properties: Record<string, any>
}

export type NodeType = 
  | 'component'
  | 'service'
  | 'database'
  | 'api'
  | 'queue'
  | 'cache'
  | 'external'
  | 'ui'
  | 'function'
  | 'module'
  | 'package'

export interface VisualEdge {
  id: string
  from: string
  to: string
  type: EdgeType
  label?: string
  style: EdgeStyle
}

export type EdgeType = 
  | 'dependency'
  | 'dataflow'
  | 'api_call'
  | 'event'
  | 'sync'
  | 'async'

export type EdgeStyle = 
  | 'solid'
  | 'dashed'
  | 'dotted'
  | 'bold'

export interface VisualGroup {
  id: string
  label: string
  nodeIds: string[]
  color: string
  collapsed: boolean
}

export interface LayoutOptions {
  type: 'hierarchical' | 'force' | 'circular' | 'tree' | 'grid'
  direction: 'top-bottom' | 'left-right' | 'bottom-top' | 'right-left'
  spacing: number
  padding: number
}

export interface VisualizationOptions {
  format: 'svg' | 'html' | 'mermaid' | 'plantuml' | 'dot' | 'json'
  layout: LayoutOptions
  showLabels: boolean
  showTypes: boolean
  interactive: boolean
  theme: 'light' | 'dark'
  maxNodes: number
}

const DEFAULT_OPTIONS: VisualizationOptions = {
  format: 'svg',
  layout: {
    type: 'hierarchical',
    direction: 'top-bottom',
    spacing: 100,
    padding: 50
  },
  showLabels: true,
  showTypes: true,
  interactive: true,
  theme: 'light',
  maxNodes: 100
}

// Node colors by type
const NODE_COLORS: Record<NodeType, string> = {
  component: '#3b82f6',
  service: '#10b981',
  database: '#f59e0b',
  api: '#8b5cf6',
  queue: '#ec4899',
  cache: '#06b6d4',
  external: '#6b7280',
  ui: '#f472b6',
  function: '#a78bfa',
  module: '#34d399',
  package: '#fbbf24'
}

/**
 * Architecture Visualizer
 */
export class ArchitectureVisualizer {
  private zai: any = null
  private visualizations: Map<string, ArchitectureVisualization> = new Map()
  private initialized = false

  constructor() {}

  /**
   * Initialize the visualizer
   */
  async init(): Promise<void> {
    if (this.initialized) return
    this.zai = await ZAI.create()
    this.initialized = true
  }

  /**
   * Visualize architecture from code analysis
   */
  async visualize(
    analysis: {
      components: Array<{ name: string; type: string; dependencies: string[] }>
      relationships?: Array<{ from: string; to: string; type: string }>
    },
    options?: Partial<VisualizationOptions>
  ): Promise<ArchitectureVisualization> {
    await this.init()

    const opts = { ...DEFAULT_OPTIONS, ...options }
    const nodes: VisualNode[] = []
    const edges: VisualEdge[] = []
    const groups: VisualGroup[] = []

    // Limit nodes
    const components = analysis.components.slice(0, opts.maxNodes)

    // Create nodes
    const nodeMap = new Map<string, string>()
    for (let i = 0; i < components.length; i++) {
      const comp = components[i]
      const nodeId = `node_${i}`
      nodeMap.set(comp.name, nodeId)

      const nodeType = this.mapToNodeType(comp.type)
      const pos = this.calculatePosition(i, components.length, opts.layout)

      nodes.push({
        id: nodeId,
        label: comp.name,
        type: nodeType,
        x: pos.x,
        y: pos.y,
        width: 150,
        height: 60,
        color: NODE_COLORS[nodeType],
        properties: {
          dependencies: comp.dependencies.length
        }
      })
    }

    // Create edges from dependencies
    let edgeId = 0
    for (const comp of components) {
      for (const dep of comp.dependencies) {
        const fromId = nodeMap.get(comp.name)
        const toId = nodeMap.get(dep)

        if (fromId && toId) {
          edges.push({
            id: `edge_${edgeId++}`,
            from: fromId,
            to: toId,
            type: 'dependency',
            style: 'solid'
          })
        }
      }
    }

    // Add explicit relationships
    if (analysis.relationships) {
      for (const rel of analysis.relationships) {
        const fromId = nodeMap.get(rel.from)
        const toId = nodeMap.get(rel.to)

        if (fromId && toId) {
          edges.push({
            id: `edge_${edgeId++}`,
            from: fromId,
            to: toId,
            type: this.mapToEdgeType(rel.type),
            style: rel.type === 'async' ? 'dashed' : 'solid'
          })
        }
      }
    }

    // Auto-group by type
    const typeGroups = new Map<NodeType, string[]>()
    for (const node of nodes) {
      if (!typeGroups.has(node.type)) {
        typeGroups.set(node.type, [])
      }
      typeGroups.get(node.type)!.push(node.id)
    }

    let groupId = 0
    for (const [type, nodeIds] of typeGroups) {
      if (nodeIds.length > 1) {
        groups.push({
          id: `group_${groupId++}`,
          label: `${type}s`,
          nodeIds,
          color: NODE_COLORS[type] + '20', // 20% opacity
          collapsed: false
        })
      }
    }

    const visualization: ArchitectureVisualization = {
      id: `viz_${Date.now()}`,
      name: 'Architecture Visualization',
      type: 'component',
      nodes,
      edges,
      groups,
      metadata: {
        componentCount: components.length,
        edgeCount: edges.length
      },
      createdAt: new Date()
    }

    this.visualizations.set(visualization.id, visualization)
    return visualization
  }

  /**
   * Map string type to NodeType
   */
  private mapToNodeType(type: string): NodeType {
    const typeMap: Record<string, NodeType> = {
      'component': 'component',
      'service': 'service',
      'api': 'api',
      'database': 'database',
      'db': 'database',
      'queue': 'queue',
      'cache': 'cache',
      'external': 'external',
      'ui': 'ui',
      'frontend': 'ui',
      'function': 'function',
      'module': 'module',
      'package': 'package'
    }

    return typeMap[type.toLowerCase()] || 'component'
  }

  /**
   * Map string type to EdgeType
   */
  private mapToEdgeType(type: string): EdgeType {
    const typeMap: Record<string, EdgeType> = {
      'dependency': 'dependency',
      'dataflow': 'dataflow',
      'api': 'api_call',
      'api_call': 'api_call',
      'event': 'event',
      'sync': 'sync',
      'async': 'async'
    }

    return typeMap[type.toLowerCase()] || 'dependency'
  }

  /**
   * Calculate node position
   */
  private calculatePosition(
    index: number,
    total: number,
    layout: LayoutOptions
  ): { x: number; y: number } {
    const spacing = layout.spacing
    const padding = layout.padding

    switch (layout.type) {
      case 'hierarchical': {
        const cols = Math.ceil(Math.sqrt(total))
        const row = Math.floor(index / cols)
        const col = index % cols
        return {
          x: padding + col * spacing,
          y: padding + row * spacing
        }
      }

      case 'grid': {
        const cols = Math.ceil(Math.sqrt(total))
        const row = Math.floor(index / cols)
        const col = index % cols
        return {
          x: padding + col * spacing * 1.5,
          y: padding + row * spacing
        }
      }

      case 'circular': {
        const angle = (2 * Math.PI * index) / total
        const radius = spacing * Math.sqrt(total) / 2
        return {
          x: padding + radius * Math.cos(angle) + radius,
          y: padding + radius * Math.sin(angle) + radius
        }
      }

      case 'tree': {
        const level = Math.floor(Math.log2(index + 1))
        const posInLevel = index - (Math.pow(2, level) - 1)
        const nodesInLevel = Math.pow(2, level)
        const x = padding + (posInLevel + 0.5) * (spacing * 2 / nodesInLevel)
        const y = padding + level * spacing
        return { x: x * total / 5, y }
      }

      default:
        return {
          x: padding + (index % 5) * spacing,
          y: padding + Math.floor(index / 5) * spacing
        }
    }
  }

  /**
   * Generate SVG output
   */
  generateSvg(visualization: ArchitectureVisualization, options?: Partial<VisualizationOptions>): string {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    
    // Calculate bounds
    const maxX = Math.max(...visualization.nodes.map(n => n.x + n.width)) + 100
    const maxY = Math.max(...visualization.nodes.map(n => n.y + n.height)) + 100

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${maxX}" height="${maxY}" viewBox="0 0 ${maxX} ${maxY}">
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
    </marker>
    <style>
      .node { fill: white; stroke-width: 2; rx: 8; }
      .node-label { font-family: Arial, sans-serif; font-size: 12px; fill: #1e293b; font-weight: 600; }
      .node-type { font-family: Arial, sans-serif; font-size: 10px; fill: #64748b; }
      .edge { stroke: #94a3b8; stroke-width: 1.5; fill: none; }
      .edge.dashed { stroke-dasharray: 5, 5; }
      .group { fill-opacity: 0.1; stroke-width: 1; stroke-dasharray: 5, 5; rx: 10; }
      .group-label { font-family: Arial, sans-serif; font-size: 11px; fill: #64748b; font-style: italic; }
    </style>
  </defs>
`

    // Draw groups
    for (const group of visualization.groups) {
      const groupNodes = group.nodeIds
        .map(id => visualization.nodes.find(n => n.id === id))
        .filter(Boolean) as VisualNode[]

      if (groupNodes.length === 0) continue

      const minX = Math.min(...groupNodes.map(n => n.x)) - 20
      const minY = Math.min(...groupNodes.map(n => n.y)) - 30
      const maxX = Math.max(...groupNodes.map(n => n.x + n.width)) + 20
      const maxY = Math.max(...groupNodes.map(n => n.y + n.height)) + 20

      svg += `  <rect x="${minX}" y="${minY}" width="${maxX - minX}" height="${maxY - minY}" 
            fill="${group.color}" stroke="${group.color.replace('20', '')}" class="group" />
    <text x="${minX + 10}" y="${minY + 20}" class="group-label">${group.label}</text>
`
    }

    // Draw edges
    for (const edge of visualization.edges) {
      const fromNode = visualization.nodes.find(n => n.id === edge.from)
      const toNode = visualization.nodes.find(n => n.id === edge.to)

      if (!fromNode || !toNode) continue

      const x1 = fromNode.x + fromNode.width / 2
      const y1 = fromNode.y + fromNode.height
      const x2 = toNode.x + toNode.width / 2
      const y2 = toNode.y

      const dashed = edge.style === 'dashed' ? ' dashed' : ''
      const marker = ' marker-end="url(#arrowhead)"'

      svg += `  <path d="M ${x1} ${y1} L ${x2} ${y2}" class="edge${dashed}"${marker} />
`
    }

    // Draw nodes
    for (const node of visualization.nodes) {
      svg += `  <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" 
            fill="white" stroke="${node.color}" class="node" />
    <text x="${node.x + node.width / 2}" y="${node.y + 25}" text-anchor="middle" class="node-label">${node.label}</text>
`
      if (opts.showTypes) {
        svg += `    <text x="${node.x + node.width / 2}" y="${node.y + 45}" text-anchor="middle" class="node-type">${node.type}</text>
`
      }
    }

    svg += `</svg>`
    return svg
  }

  /**
   * Generate Mermaid output
   */
  generateMermaid(visualization: ArchitectureVisualization): string {
    const lines: string[] = ['```mermaid', 'flowchart TD']

    // Add nodes
    for (const node of visualization.nodes) {
      const shape = this.getMermaidShape(node.type)
      lines.push(`    ${node.id}${shape.start}${node.label}${shape.end}`)
    }

    // Add edges
    for (const edge of visualization.edges) {
      const arrow = edge.style === 'dashed' ? '-.->' : '-->'
      const label = edge.label ? `|${edge.label}|` : ''
      lines.push(`    ${edge.from} ${arrow}${label} ${edge.to}`)
    }

    // Add styles
    for (const node of visualization.nodes) {
      lines.push(`    style ${node.id} stroke:${node.color}`)
    }

    lines.push('```')
    return lines.join('\n')
  }

  /**
   * Get Mermaid shape for node type
   */
  private getMermaidShape(type: NodeType): { start: string; end: string } {
    switch (type) {
      case 'database':
        return { start: '[(', end: ')]' }
      case 'queue':
        return { start: '>', end: ']' }
      case 'external':
        return { start: '[[', end: ']]' }
      default:
        return { start: '[', end: ']' }
    }
  }

  /**
   * Generate HTML output
   */
  generateHtml(visualization: ArchitectureVisualization): string {
    const svg = this.generateSvg(visualization)

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${visualization.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #1e293b; margin-bottom: 20px; }
    .metadata { color: #64748b; font-size: 0.875rem; margin-bottom: 20px; }
    .visualization { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: auto; }
    .legend { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 20px; }
    .legend-item { display: flex; align-items: center; gap: 5px; font-size: 0.875rem; }
    .legend-color { width: 16px; height: 16px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🏗️ ${visualization.name}</h1>
    <div class="metadata">
      ${visualization.metadata.componentCount} components • ${visualization.metadata.edgeCount} connections
    </div>
    <div class="visualization">
      ${svg}
    </div>
    <div class="legend">
      ${Object.entries(NODE_COLORS).map(([type, color]) => `
        <div class="legend-item">
          <div class="legend-color" style="background: ${color}"></div>
          <span>${type}</span>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>
`
  }

  /**
   * Generate PlantUML output
   */
  generatePlantUml(visualization: ArchitectureVisualization): string {
    const lines: string[] = ['@startuml', 'skinparam componentStyle rectangle']

    // Add nodes
    for (const node of visualization.nodes) {
      const stereotype = `<<${node.type}>>`
      lines.push(`component "${node.label}" as ${node.id} ${stereotype}`)
    }

    // Add edges
    for (const edge of visualization.edges) {
      const arrow = edge.style === 'dashed' ? '..>' : '-->'
      lines.push(`${edge.from} ${arrow} ${edge.to}`)
    }

    lines.push('@enduml')
    return lines.join('\n')
  }

  /**
   * Generate DOT output
   */
  generateDot(visualization: ArchitectureVisualization): string {
    const lines: string[] = [
      'digraph Architecture {',
      '  rankdir=TB;',
      '  node [shape=box, style="rounded,filled", fillcolor=white];',
      ''
    ]

    // Add nodes
    for (const node of visualization.nodes) {
      lines.push(`  "${node.id}" [label="${node.label}\\n(${node.type})", color="${node.color}"];`)
    }

    lines.push('')

    // Add edges
    for (const edge of visualization.edges) {
      const style = edge.style === 'dashed' ? ' [style=dashed]' : ''
      lines.push(`  "${edge.from}" -> "${edge.to}"${style};`)
    }

    lines.push('}')
    return lines.join('\n')
  }

  /**
   * Get visualization by ID
   */
  getVisualization(id: string): ArchitectureVisualization | undefined {
    return this.visualizations.get(id)
  }

  /**
   * Get all visualizations
   */
  getAllVisualizations(): ArchitectureVisualization[] {
    return Array.from(this.visualizations.values())
  }

  /**
   * Clear visualizations
   */
  clear(): void {
    this.visualizations.clear()
  }
}

// Singleton
let visualizerInstance: ArchitectureVisualizer | null = null

export function getArchitectureVisualizer(): ArchitectureVisualizer {
  if (!visualizerInstance) {
    visualizerInstance = new ArchitectureVisualizer()
  }
  return visualizerInstance
}

/**
 * Quick architecture visualization
 */
export async function visualizeArchitecture(
  components: Array<{ name: string; type: string; dependencies: string[] }>,
  format: 'svg' | 'mermaid' | 'html' = 'svg'
): Promise<string> {
  const visualizer = new ArchitectureVisualizer()
  await visualizer.init()
  
  const viz = await visualizer.visualize({ components })
  
  switch (format) {
    case 'mermaid':
      return visualizer.generateMermaid(viz)
    case 'html':
      return visualizer.generateHtml(viz)
    default:
      return visualizer.generateSvg(viz)
  }
}
