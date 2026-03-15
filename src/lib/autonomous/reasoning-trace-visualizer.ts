/**
 * Reasoning Trace Visualizer - Mechanism #116
 * 
 * Creates visual representations of AI reasoning processes,
 * enabling debugging and understanding of decision paths.
 * 
 * Features:
 * - Visual trace generation
 * - Decision tree visualization
 * - Step-by-step reasoning display
 * - HTML/SVG/ASCII output formats
 * - Interactive trace exploration
 */

import ZAI from 'z-ai-web-dev-sdk'

// Types
export interface ReasoningTrace {
  id: string
  task: string
  startTime: Date
  endTime: Date
  steps: ReasoningStep[]
  branches: ReasoningBranch[]
  decisions: ReasoningDecision[]
  outcome: ReasoningOutcome
  metadata: Record<string, any>
}

export interface ReasoningStep {
  id: string
  sequence: number
  type: StepType
  description: string
  input: string
  output: string
  confidence: number
  duration: number
  dependencies: string[]
  status: 'success' | 'failed' | 'skipped'
}

export type StepType = 
  | 'observation'
  | 'hypothesis'
  | 'action'
  | 'verification'
  | 'reflection'
  | 'decision'
  | 'iteration'
  | 'branch'
  | 'merge'
  | 'terminate'

export interface ReasoningBranch {
  id: string
  parentStep: string
  condition: string
  steps: string[]
  outcome: 'explored' | 'abandoned' | 'selected'
}

export interface ReasoningDecision {
  id: string
  stepId: string
  options: DecisionOption[]
  selected: string
  reasoning: string
  confidence: number
}

export interface DecisionOption {
  id: string
  description: string
  pros: string[]
  cons: string[]
  score: number
}

export interface ReasoningOutcome {
  success: boolean
  result: string
  confidence: number
  iterations: number
  branchesExplored: number
}

export interface VisualizationOptions {
  format: 'html' | 'svg' | 'ascii' | 'mermaid' | 'json'
  maxDepth: number
  showConfidence: boolean
  showDurations: boolean
  showBranches: boolean
  compact: boolean
  interactive: boolean
}

const DEFAULT_OPTIONS: VisualizationOptions = {
  format: 'html',
  maxDepth: 10,
  showConfidence: true,
  showDurations: true,
  showBranches: true,
  compact: false,
  interactive: true
}

/**
 * Reasoning Trace Visualizer
 */
export class ReasoningTraceVisualizer {
  private zai: any = null
  private traces: Map<string, ReasoningTrace> = new Map()
  private currentTrace: ReasoningTrace | null = null
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
   * Start a new reasoning trace
   */
  startTrace(task: string): string {
    const id = `trace_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    
    this.currentTrace = {
      id,
      task,
      startTime: new Date(),
      endTime: new Date(),
      steps: [],
      branches: [],
      decisions: [],
      outcome: {
        success: false,
        result: '',
        confidence: 0,
        iterations: 0,
        branchesExplored: 0
      },
      metadata: {}
    }

    this.traces.set(id, this.currentTrace)
    return id
  }

  /**
   * Add a step to current trace
   */
  addStep(step: Omit<ReasoningStep, 'id' | 'sequence'>): string {
    if (!this.currentTrace) return ''

    const id = `step_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const newStep: ReasoningStep = {
      ...step,
      id,
      sequence: this.currentTrace.steps.length + 1
    }

    this.currentTrace.steps.push(newStep)
    return id
  }

  /**
   * Add a decision to current trace
   */
  addDecision(decision: Omit<ReasoningDecision, 'id'>): void {
    if (!this.currentTrace) return

    this.currentTrace.decisions.push({
      ...decision,
      id: `dec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    })
  }

  /**
   * End current trace
   */
  endTrace(outcome: Partial<ReasoningOutcome>): void {
    if (!this.currentTrace) return

    this.currentTrace.endTime = new Date()
    this.currentTrace.outcome = {
      success: outcome.success ?? false,
      result: outcome.result ?? '',
      confidence: outcome.confidence ?? 0,
      iterations: this.currentTrace.steps.length,
      branchesExplored: this.currentTrace.branches.length
    }
  }

  /**
   * Visualize a trace
   */
  visualize(traceId?: string, options?: Partial<VisualizationOptions>): string {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    const trace = traceId ? this.traces.get(traceId) : this.currentTrace

    if (!trace) {
      return 'No trace found'
    }

    switch (opts.format) {
      case 'html':
        return this.generateHtmlVisualization(trace, opts)
      case 'svg':
        return this.generateSvgVisualization(trace, opts)
      case 'ascii':
        return this.generateAsciiVisualization(trace, opts)
      case 'mermaid':
        return this.generateMermaidVisualization(trace, opts)
      case 'json':
        return JSON.stringify(trace, null, 2)
      default:
        return this.generateHtmlVisualization(trace, opts)
    }
  }

  /**
   * Generate HTML visualization
   */
  private generateHtmlVisualization(
    trace: ReasoningTrace,
    options: VisualizationOptions
  ): string {
    const steps = trace.steps.slice(0, options.maxDepth)
    
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reasoning Trace: ${this.escapeHtml(trace.task)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 20px; }
    .container { max-width: 1000px; margin: 0 auto; }
    h1 { color: #1e293b; margin-bottom: 10px; font-size: 1.5rem; }
    .meta { color: #64748b; font-size: 0.875rem; margin-bottom: 20px; }
    .outcome { padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .outcome.success { background: #dcfce7; border: 1px solid #16a34a; }
    .outcome.failure { background: #fee2e2; border: 1px solid #dc2626; }
    .steps { display: flex; flex-direction: column; gap: 10px; }
    .step { background: white; border-radius: 8px; padding: 15px; border-left: 4px solid #3b82f6; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .step.success { border-left-color: #16a34a; }
    .step.failed { border-left-color: #dc2626; }
    .step.skipped { border-left-color: #94a3b8; opacity: 0.6; }
    .step-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .step-type { font-size: 0.75rem; text-transform: uppercase; color: #3b82f6; font-weight: 600; }
    .step-seq { background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; }
    .step-description { color: #1e293b; margin-bottom: 8px; }
    .step-details { font-size: 0.875rem; color: #64748b; }
    .confidence { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; }
    .confidence.high { background: #dcfce7; color: #16a34a; }
    .confidence.medium { background: #fef3c7; color: #d97706; }
    .confidence.low { background: #fee2e2; color: #dc2626; }
    .duration { color: #94a3b8; font-size: 0.75rem; }
    .decision { background: #f1f5f9; padding: 10px; border-radius: 6px; margin-top: 10px; }
    .decision-title { font-weight: 600; margin-bottom: 5px; }
    .options { display: flex; flex-wrap: wrap; gap: 5px; }
    .option { padding: 5px 10px; background: white; border-radius: 4px; font-size: 0.75rem; }
    .option.selected { background: #3b82f6; color: white; }
    .branch { border-left: 2px dashed #94a3b8; margin-left: 10px; padding-left: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧠 ${this.escapeHtml(trace.task)}</h1>
    <div class="meta">
      Duration: ${trace.endTime.getTime() - trace.startTime.getTime()}ms | 
      Steps: ${trace.steps.length} | 
      Confidence: ${(trace.outcome.confidence * 100).toFixed(0)}%
    </div>
    
    <div class="outcome ${trace.outcome.success ? 'success' : 'failure'}">
      <strong>${trace.outcome.success ? '✓ Success' : '✗ Failed'}</strong>
      <p>${this.escapeHtml(trace.outcome.result || 'No result')}</p>
    </div>

    <div class="steps">
`

    for (const step of steps) {
      const confidenceClass = step.confidence >= 0.8 ? 'high' : step.confidence >= 0.5 ? 'medium' : 'low'
      
      html += `
      <div class="step ${step.status}">
        <div class="step-header">
          <span class="step-type">${step.type}</span>
          <span class="step-seq">#${step.sequence}</span>
        </div>
        <div class="step-description">${this.escapeHtml(step.description)}</div>
        <div class="step-details">
          ${options.showConfidence ? `<span class="confidence ${confidenceClass}">${(step.confidence * 100).toFixed(0)}%</span>` : ''}
          ${options.showDurations ? `<span class="duration">${step.duration}ms</span>` : ''}
        </div>
      </div>
`
    }

    html += `
    </div>
  </div>
</body>
</html>
`

    return html
  }

  /**
   * Generate SVG visualization
   */
  private generateSvgVisualization(
    trace: ReasoningTrace,
    options: VisualizationOptions
  ): string {
    const steps = trace.steps.slice(0, options.maxDepth)
    const boxWidth = 200
    const boxHeight = 60
    const spacing = 30
    const width = 800
    const height = steps.length * (boxHeight + spacing) + 100

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>
    .step-box { fill: white; stroke: #3b82f6; stroke-width: 2; rx: 8; }
    .step-box.success { stroke: #16a34a; }
    .step-box.failed { stroke: #dc2626; }
    .step-text { font-family: Arial, sans-serif; font-size: 12px; fill: #1e293b; }
    .step-type { font-weight: bold; fill: #3b82f6; }
    .arrow { stroke: #94a3b8; stroke-width: 2; fill: none; marker-end: url(#arrowhead); }
  </style>
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
    </marker>
  </defs>
`

    let y = 50
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const x = (width - boxWidth) / 2

      // Draw box
      svg += `  <rect x="${x}" y="${y}" width="${boxWidth}" height="${boxHeight}" class="step-box ${step.status}" />\n`

      // Draw text
      svg += `  <text x="${x + 10}" y="${y + 20}" class="step-type">${step.type}</text>\n`
      svg += `  <text x="${x + 10}" y="${y + 40}" class="step-text">${this.escapeHtml(step.description.slice(0, 25))}${step.description.length > 25 ? '...' : ''}</text>\n`

      // Draw arrow to next step
      if (i < steps.length - 1) {
        svg += `  <line x1="${width / 2}" y1="${y + boxHeight}" x2="${width / 2}" y2="${y + boxHeight + spacing}" class="arrow" />\n`
      }

      y += boxHeight + spacing
    }

    svg += `</svg>`
    return svg
  }

  /**
   * Generate ASCII visualization
   */
  private generateAsciiVisualization(
    trace: ReasoningTrace,
    options: VisualizationOptions
  ): string {
    const steps = trace.steps.slice(0, options.maxDepth)
    const lines: string[] = []

    lines.push('═'.repeat(60))
    lines.push(`  Reasoning Trace: ${trace.task.slice(0, 50)}`)
    lines.push('═'.repeat(60))
    lines.push('')
    lines.push(`Outcome: ${trace.outcome.success ? '✓ SUCCESS' : '✗ FAILED'}`)
    lines.push(`Confidence: ${(trace.outcome.confidence * 100).toFixed(0)}%`)
    lines.push(`Duration: ${trace.endTime.getTime() - trace.startTime.getTime()}ms`)
    lines.push('')

    for (const step of steps) {
      const icon = step.status === 'success' ? '●' : step.status === 'failed' ? '○' : '○'
      const confidence = options.showConfidence ? ` [${(step.confidence * 100).toFixed(0)}%]` : ''
      
      lines.push(`  ${icon} Step ${step.sequence}: ${step.type.toUpperCase()}${confidence}`)
      lines.push(`    ${step.description.slice(0, 55)}`)
      
      if (options.showDurations && step.duration > 0) {
        lines.push(`    └─ ${step.duration}ms`)
      }
      lines.push('')
    }

    lines.push('═'.repeat(60))

    return lines.join('\n')
  }

  /**
   * Generate Mermaid visualization
   */
  private generateMermaidVisualization(
    trace: ReasoningTrace,
    options: VisualizationOptions
  ): string {
    const steps = trace.steps.slice(0, options.maxDepth)
    const lines: string[] = ['```mermaid', 'flowchart TD']

    // Add start node
    lines.push(`    Start[(${trace.task.slice(0, 30)})]`)

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const nodeId = `S${i}`
      const label = `${step.type}\\n${step.description.slice(0, 20)}`
      
      lines.push(`    ${nodeId}["${label}"]`)
      
      // Connect to previous
      if (i === 0) {
        lines.push(`    Start --> ${nodeId}`)
      } else {
        lines.push(`    S${i - 1} --> ${nodeId}`)
      }

      // Style based on status
      if (step.status === 'success') {
        lines.push(`    style ${nodeId} stroke:#16a34a`)
      } else if (step.status === 'failed') {
        lines.push(`    style ${nodeId} stroke:#dc2626`)
      }
    }

    // Add end node
    const result = trace.outcome.success ? 'Success' : 'Failed'
    lines.push(`    End[(${result})]`)
    lines.push(`    S${steps.length - 1} --> End`)

    lines.push('```')
    return lines.join('\n')
  }

  /**
   * Escape HTML entities
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  /**
   * Get trace by ID
   */
  getTrace(id: string): ReasoningTrace | undefined {
    return this.traces.get(id)
  }

  /**
   * Get all traces
   */
  getAllTraces(): ReasoningTrace[] {
    return Array.from(this.traces.values())
  }

  /**
   * Export trace to file
   */
  exportTrace(traceId: string, format: 'json' | 'html' = 'json'): string {
    const trace = this.traces.get(traceId)
    if (!trace) return ''

    if (format === 'json') {
      return JSON.stringify(trace, null, 2)
    }

    return this.generateHtmlVisualization(trace, DEFAULT_OPTIONS)
  }

  /**
   * Clear all traces
   */
  clearTraces(): void {
    this.traces.clear()
    this.currentTrace = null
  }

  /**
   * Analyze trace for patterns
   */
  analyzeTrace(traceId: string): {
    totalSteps: number
    avgConfidence: number
    successRate: number
    commonTypes: Record<StepType, number>
    bottlenecks: string[]
    recommendations: string[]
  } {
    const trace = this.traces.get(traceId)
    if (!trace) {
      return {
        totalSteps: 0,
        avgConfidence: 0,
        successRate: 0,
        commonTypes: {} as Record<StepType, number>,
        bottlenecks: [],
        recommendations: []
      }
    }

    const steps = trace.steps
    const successfulSteps = steps.filter(s => s.status === 'success')
    const avgConfidence = steps.reduce((sum, s) => sum + s.confidence, 0) / (steps.length || 1)

    // Count step types
    const commonTypes: Record<StepType, number> = {} as Record<StepType, number>
    for (const step of steps) {
      commonTypes[step.type] = (commonTypes[step.type] || 0) + 1
    }

    // Find bottlenecks (slow steps)
    const avgDuration = steps.reduce((sum, s) => sum + s.duration, 0) / (steps.length || 1)
    const bottlenecks = steps
      .filter(s => s.duration > avgDuration * 2)
      .map(s => `Step ${s.sequence}: ${s.type}`)

    // Generate recommendations
    const recommendations: string[] = []
    if (avgConfidence < 0.5) {
      recommendations.push('Consider adding more verification steps')
    }
    if (commonTypes['iteration'] > 5) {
      recommendations.push('High iteration count - consider optimizing reasoning')
    }
    if (successfulSteps.length < steps.length * 0.8) {
      recommendations.push('Many failed steps - review error handling')
    }

    return {
      totalSteps: steps.length,
      avgConfidence,
      successRate: successfulSteps.length / (steps.length || 1),
      commonTypes,
      bottlenecks,
      recommendations
    }
  }
}

// Singleton
let visualizerInstance: ReasoningTraceVisualizer | null = null

export function getReasoningTraceVisualizer(): ReasoningTraceVisualizer {
  if (!visualizerInstance) {
    visualizerInstance = new ReasoningTraceVisualizer()
  }
  return visualizerInstance
}

/**
 * Quick visualization function
 */
export function visualizeTrace(
  steps: Array<{ type: StepType; description: string; confidence: number }>,
  format: 'html' | 'ascii' | 'mermaid' = 'ascii'
): string {
  const visualizer = new ReasoningTraceVisualizer()
  const traceId = visualizer.startTrace('Quick visualization')

  for (const step of steps) {
    visualizer.addStep({
      type: step.type,
      description: step.description,
      confidence: step.confidence,
      input: '',
      output: '',
      duration: 0,
      dependencies: [],
      status: 'success'
    })
  }

  visualizer.endTrace({ success: true, confidence: steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length })

  return visualizer.visualize(traceId, { format })
}
