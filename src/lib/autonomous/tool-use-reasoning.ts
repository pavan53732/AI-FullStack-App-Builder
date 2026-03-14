/**
 * Tool Use Reasoning Engine
 * 
 * Provides intelligent tool selection and usage:
 * - Tool capability matching
 * - Parameter inference
 * - Tool chaining/orchestration
 * - Cost awareness
 * - Fallback planning
 * - Reliability tracking
 */

import ZAI from 'z-ai-web-dev-sdk'

// Types
export interface Tool {
  id: string
  name: string
  description: string
  category: ToolCategory
  capabilities: string[]
  parameters: ToolParameter[]
  returns: ToolReturn
  cost: {
    tokens?: number
    time?: number  // estimated seconds
    money?: number // estimated cost in dollars
  }
  reliability: number  // 0-1 success rate
  dependencies?: string[] // tool IDs this depends on
  sideEffects: boolean
}

export interface ToolParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file'
  required: boolean
  description: string
  default?: any
  validation?: {
    pattern?: string
    min?: number
    max?: number
    options?: string[]
  }
}

export interface ToolReturn {
  type: 'string' | 'object' | 'file' | 'void'
  description: string
  schema?: Record<string, any>
}

export type ToolCategory = 
  | 'file'           // File operations
  | 'code'           // Code generation/modification
  | 'execution'      // Command execution
  | 'analysis'       // Code analysis
  | 'testing'        // Test generation/running
  | 'deployment'     // Deployment operations
  | 'ai'             // AI operations
  | 'database'       // Database operations
  | 'git'            // Version control
  | 'utility'        // General utilities

export interface ToolSelectionContext {
  goal: string
  currentFiles?: string[]
  availableTools: string[]
  constraints: {
    maxCost?: number
    maxTime?: number
    requireReliability?: number
    allowSideEffects?: boolean
  }
  previousTools: string[]
  outputRequirements?: {
    format?: string
    type?: string
  }
}

export interface ToolSelection {
  tool: Tool
  parameters: Record<string, any>
  confidence: number
  reasoning: string
  alternatives: Tool[]
  estimatedCost: {
    tokens: number
    time: number
    money: number
  }
}

export interface ToolChain {
  id: string
  name: string
  description: string
  steps: ToolChainStep[]
  totalCost: {
    tokens: number
    time: number
    money: number
  }
  estimatedSuccess: number
}

export interface ToolChainStep {
  tool: Tool
  parameters: Record<string, any>
  inputFrom?: string[] // step IDs to get input from
  condition?: string   // Condition to execute this step
  onFailure: 'skip' | 'retry' | 'abort' | 'fallback'
  fallback?: string    // Fallback tool ID
}

export interface ToolExecutionResult {
  toolId: string
  success: boolean
  output?: any
  error?: string
  duration: number
  cost: {
    tokens: number
    time: number
    money: number
  }
}

export interface ToolReliabilityRecord {
  toolId: string
  totalUses: number
  successes: number
  failures: number
  avgDuration: number
  commonErrors: string[]
  lastUsed: string
}

// Default tools registry
const DEFAULT_TOOLS: Tool[] = [
  {
    id: 'create_file',
    name: 'Create File',
    description: 'Create a new file with content',
    category: 'file',
    capabilities: ['file-creation', 'code-generation'],
    parameters: [
      { name: 'path', type: 'string', required: true, description: 'File path' },
      { name: 'content', type: 'string', required: true, description: 'File content' }
    ],
    returns: { type: 'string', description: 'Created file path' },
    cost: { tokens: 0, time: 0.1, money: 0 },
    reliability: 0.99,
    sideEffects: true
  },
  {
    id: 'read_file',
    name: 'Read File',
    description: 'Read file contents',
    category: 'file',
    capabilities: ['file-reading', 'analysis'],
    parameters: [
      { name: 'path', type: 'string', required: true, description: 'File path' }
    ],
    returns: { type: 'string', description: 'File content' },
    cost: { tokens: 0, time: 0.1, money: 0 },
    reliability: 0.99,
    sideEffects: false
  },
  {
    id: 'execute_command',
    name: 'Execute Command',
    description: 'Run a shell command',
    category: 'execution',
    capabilities: ['command-execution', 'installation', 'build'],
    parameters: [
      { name: 'command', type: 'string', required: true, description: 'Command to run' },
      { name: 'cwd', type: 'string', required: false, description: 'Working directory' },
      { name: 'timeout', type: 'number', required: false, description: 'Timeout in ms', default: 60000 }
    ],
    returns: { type: 'object', description: 'Command result with stdout/stderr' },
    cost: { tokens: 0, time: 5, money: 0 },
    reliability: 0.85,
    sideEffects: true
  },
  {
    id: 'generate_code',
    name: 'Generate Code',
    description: 'Generate code using AI',
    category: 'ai',
    capabilities: ['code-generation', 'ai-reasoning'],
    parameters: [
      { name: 'prompt', type: 'string', required: true, description: 'What to generate' },
      { name: 'language', type: 'string', required: false, description: 'Programming language', default: 'typescript' },
      { name: 'context', type: 'string', required: false, description: 'Additional context' }
    ],
    returns: { type: 'string', description: 'Generated code' },
    cost: { tokens: 2000, time: 5, money: 0.01 },
    reliability: 0.9,
    sideEffects: false
  },
  {
    id: 'analyze_code',
    name: 'Analyze Code',
    description: 'Analyze code for issues and patterns',
    category: 'analysis',
    capabilities: ['code-analysis', 'security-scan', 'complexity-analysis'],
    parameters: [
      { name: 'code', type: 'string', required: true, description: 'Code to analyze' },
      { name: 'checks', type: 'array', required: false, description: 'Types of checks to run' }
    ],
    returns: { type: 'object', description: 'Analysis results' },
    cost: { tokens: 500, time: 2, money: 0 },
    reliability: 0.95,
    sideEffects: false
  },
  {
    id: 'run_tests',
    name: 'Run Tests',
    description: 'Execute test suite',
    category: 'testing',
    capabilities: ['test-execution', 'coverage-analysis'],
    parameters: [
      { name: 'path', type: 'string', required: false, description: 'Test path' },
      { name: 'coverage', type: 'boolean', required: false, description: 'Generate coverage', default: true }
    ],
    returns: { type: 'object', description: 'Test results' },
    cost: { tokens: 0, time: 10, money: 0 },
    reliability: 0.9,
    sideEffects: false
  },
  {
    id: 'git_commit',
    name: 'Git Commit',
    description: 'Create a git commit',
    category: 'git',
    capabilities: ['version-control', 'checkpoint'],
    parameters: [
      { name: 'message', type: 'string', required: true, description: 'Commit message' },
      { name: 'files', type: 'array', required: false, description: 'Files to commit' }
    ],
    returns: { type: 'string', description: 'Commit hash' },
    cost: { tokens: 0, time: 0.5, money: 0 },
    reliability: 0.95,
    sideEffects: true
  },
  {
    id: 'install_deps',
    name: 'Install Dependencies',
    description: 'Install npm packages',
    category: 'execution',
    capabilities: ['dependency-management'],
    parameters: [
      { name: 'packages', type: 'array', required: true, description: 'Packages to install' },
      { name: 'dev', type: 'boolean', required: false, description: 'Install as dev dependency', default: false }
    ],
    returns: { type: 'string', description: 'Installation output' },
    cost: { tokens: 0, time: 15, money: 0 },
    reliability: 0.9,
    sideEffects: true
  },
  {
    id: 'search_web',
    name: 'Search Web',
    description: 'Search the web for information',
    category: 'ai',
    capabilities: ['web-search', 'information-retrieval'],
    parameters: [
      { name: 'query', type: 'string', required: true, description: 'Search query' },
      { name: 'limit', type: 'number', required: false, description: 'Max results', default: 5 }
    ],
    returns: { type: 'object', description: 'Search results' },
    cost: { tokens: 1000, time: 3, money: 0.005 },
    reliability: 0.85,
    sideEffects: false
  }
]

/**
 * Tool Use Reasoning Engine
 */
export class ToolUseReasoningEngine {
  private zai: any = null
  private tools: Map<string, Tool> = new Map()
  private reliability: Map<string, ToolReliabilityRecord> = new Map()
  private toolHistory: ToolExecutionResult[] = []

  constructor(customTools?: Tool[]) {
    // Initialize with default tools
    for (const tool of DEFAULT_TOOLS) {
      this.tools.set(tool.id, tool)
      this.reliability.set(tool.id, {
        toolId: tool.id,
        totalUses: 0,
        successes: 0,
        failures: 0,
        avgDuration: tool.cost.time || 1,
        commonErrors: [],
        lastUsed: new Date().toISOString()
      })
    }
    
    // Add custom tools
    if (customTools) {
      for (const tool of customTools) {
        this.tools.set(tool.id, tool)
      }
    }
  }

  /**
   * Initialize AI
   */
  async init(): Promise<void> {
    if (!this.zai) {
      this.zai = await ZAI.create()
    }
  }

  /**
   * Select best tool for a goal
   */
  async selectTool(context: ToolSelectionContext): Promise<ToolSelection> {
    await this.init()
    
    // Filter available tools
    const availableTools = context.availableTools
      .map(id => this.tools.get(id))
      .filter(Boolean) as Tool[]
    
    // Score each tool
    const scored = await Promise.all(
      availableTools.map(async tool => ({
        tool,
        score: await this.scoreTool(tool, context)
      }))
    )
    
    // Sort by score
    scored.sort((a, b) => b.score - a.score)
    
    const best = scored[0]
    if (!best) {
      throw new Error('No suitable tool found')
    }
    
    // Infer parameters
    const parameters = await this.inferParameters(best.tool, context)
    
    // Calculate confidence
    const confidence = this.calculateConfidence(best.tool, context)
    
    // Generate reasoning
    const reasoning = await this.generateReasoning(best.tool, context, scored.slice(1, 4))
    
    // Calculate estimated cost
    const estimatedCost = {
      tokens: best.tool.cost.tokens || 0,
      time: best.tool.cost.time || 0,
      money: best.tool.cost.money || 0
    }
    
    return {
      tool: best.tool,
      parameters,
      confidence,
      reasoning,
      alternatives: scored.slice(1, 4).map(s => s.tool),
      estimatedCost
    }
  }

  /**
   * Score a tool for the given context
   */
  private async scoreTool(tool: Tool, context: ToolSelectionContext): Promise<number> {
    let score = 0
    
    // Capability match (most important)
    const goalKeywords = context.goal.toLowerCase().split(' ')
    const capabilityMatch = tool.capabilities.filter(cap =>
      goalKeywords.some(kw => cap.toLowerCase().includes(kw))
    ).length
    score += capabilityMatch * 20
    
    // Reliability
    const reliabilityRecord = this.reliability.get(tool.id)
    const reliability = reliabilityRecord 
      ? reliabilityRecord.successes / Math.max(1, reliabilityRecord.totalUses)
      : tool.reliability
    score += reliability * 30
    
    // Cost efficiency (lower is better)
    if (context.constraints.maxCost !== undefined) {
      const costScore = Math.max(0, 20 - (tool.cost.money || 0) * 1000)
      score += costScore
    }
    
    // Time efficiency
    if (context.constraints.maxTime !== undefined) {
      const timeScore = Math.max(0, 15 - (tool.cost.time || 0))
      score += timeScore
    }
    
    // Side effects constraint
    if (context.constraints.allowSideEffects === false && tool.sideEffects) {
      score -= 50
    }
    
    // Category match
    if (this.categoryMatchesGoal(tool.category, context.goal)) {
      score += 15
    }
    
    // Previous success with similar goals
    const pastSuccesses = this.toolHistory.filter(r => 
      r.toolId === tool.id && r.success
    ).length
    score += Math.min(pastSuccesses * 2, 10)
    
    return score
  }

  /**
   * Check if category matches goal
   */
  private categoryMatchesGoal(category: ToolCategory, goal: string): boolean {
    const categoryKeywords: Record<ToolCategory, string[]> = {
      file: ['file', 'create', 'write', 'read', 'folder'],
      code: ['code', 'function', 'class', 'component', 'implement'],
      execution: ['run', 'execute', 'command', 'install', 'build'],
      analysis: ['analyze', 'check', 'scan', 'detect', 'find'],
      testing: ['test', 'spec', 'coverage', 'jest', 'vitest'],
      deployment: ['deploy', 'publish', 'release', 'ship'],
      ai: ['generate', 'create', 'ai', 'suggest'],
      database: ['database', 'db', 'query', 'migration', 'schema'],
      git: ['git', 'commit', 'push', 'branch', 'version'],
      utility: ['format', 'convert', 'parse']
    }
    
    const keywords = categoryKeywords[category] || []
    return keywords.some(kw => goal.toLowerCase().includes(kw))
  }

  /**
   * Infer parameters for a tool
   */
  private async inferParameters(
    tool: Tool,
    context: ToolSelectionContext
  ): Promise<Record<string, any>> {
    const parameters: Record<string, any> = {}
    
    for (const param of tool.parameters) {
      if (param.required) {
        // Try to infer required parameter
        const inferred = await this.inferParameter(param, context)
        parameters[param.name] = inferred
      } else if (param.default !== undefined) {
        parameters[param.name] = param.default
      }
    }
    
    return parameters
  }

  /**
   * Infer a single parameter value
   */
  private async inferParameter(
    param: ToolParameter,
    context: ToolSelectionContext
  ): Promise<any> {
    // Try to extract from goal
    const goalLower = context.goal.toLowerCase()
    
    if (param.name === 'path' || param.name === 'file') {
      // Extract file path from goal
      const pathMatch = context.goal.match(/(?:file|path)[:\s]+([^\s,]+)/i)
      if (pathMatch) return pathMatch[1]
      
      // Default to common paths
      if (goalLower.includes('component')) return 'src/components/NewComponent.tsx'
      if (goalLower.includes('page')) return 'src/app/page.tsx'
      if (goalLower.includes('api')) return 'src/app/api/route.ts'
      return 'src/index.ts'
    }
    
    if (param.name === 'content' || param.name === 'code') {
      return `// Generated content for: ${context.goal}`
    }
    
    if (param.name === 'command') {
      if (goalLower.includes('install')) return 'npm install'
      if (goalLower.includes('build')) return 'npm run build'
      if (goalLower.includes('test')) return 'npm test'
      return 'npm run dev'
    }
    
    if (param.name === 'packages') {
      // Extract package names from goal
      const packages: string[] = []
      const packagePatterns = [
        /install\s+([@\w/-]+)/gi,
        /add\s+([@\w/-]+)/gi,
        /([\w-]+)\s+package/gi
      ]
      
      for (const pattern of packagePatterns) {
        const matches = context.goal.matchAll(pattern)
        for (const match of matches) {
          if (match[1] && !packages.includes(match[1])) {
            packages.push(match[1])
          }
        }
      }
      
      return packages.length > 0 ? packages : ['unknown-package']
    }
    
    if (param.name === 'prompt' || param.name === 'query') {
      return context.goal
    }
    
    if (param.name === 'message') {
      return `Update: ${context.goal}`
    }
    
    // Default based on type
    switch (param.type) {
      case 'string': return ''
      case 'number': return 0
      case 'boolean': return false
      case 'array': return []
      case 'object': return {}
      default: return null
    }
  }

  /**
   * Calculate confidence for tool selection
   */
  private calculateConfidence(tool: Tool, context: ToolSelectionContext): number {
    let confidence = 0.5
    
    // Reliability contribution
    const reliabilityRecord = this.reliability.get(tool.id)
    if (reliabilityRecord && reliabilityRecord.totalUses > 0) {
      confidence += (reliabilityRecord.successes / reliabilityRecord.totalUses) * 0.3
    } else {
      confidence += tool.reliability * 0.2
    }
    
    // Capability match contribution
    const goalKeywords = context.goal.toLowerCase().split(' ')
    const matchedCapabilities = tool.capabilities.filter(cap =>
      goalKeywords.some(kw => cap.toLowerCase().includes(kw))
    ).length
    confidence += Math.min(matchedCapabilities * 0.1, 0.2)
    
    return Math.min(confidence, 0.99)
  }

  /**
   * Generate reasoning for tool selection
   */
  private async generateReasoning(
    tool: Tool,
    context: ToolSelectionContext,
    alternatives: { tool: Tool; score: number }[]
  ): Promise<string> {
    const reasons: string[] = []
    
    reasons.push(`Selected "${tool.name}" (${tool.category})`)
    reasons.push(`Capabilities: ${tool.capabilities.join(', ')}`)
    reasons.push(`Reliability: ${(tool.reliability * 100).toFixed(0)}%`)
    
    if (alternatives.length > 0) {
      reasons.push(`Alternatives considered: ${alternatives.map(a => a.tool.name).join(', ')}`)
    }
    
    return reasons.join('\n')
  }

  /**
   * Create a tool chain for complex goals
   */
  async createToolChain(context: ToolSelectionContext): Promise<ToolChain> {
    await this.init()
    
    const steps: ToolChainStep[] = []
    let remainingGoal = context.goal
    let stepCount = 0
    const maxSteps = 10
    
    // Break down goal into subtasks
    const subtasks = await this.decomposeGoal(context.goal)
    
    for (const subtask of subtasks) {
      if (stepCount >= maxSteps) break
      
      const subContext: ToolSelectionContext = {
        ...context,
        goal: subtask,
        previousTools: steps.map(s => s.tool.id)
      }
      
      const selection = await this.selectTool(subContext)
      
      steps.push({
        tool: selection.tool,
        parameters: selection.parameters,
        inputFrom: steps.length > 0 ? [steps[steps.length - 1].tool.id] : undefined,
        onFailure: 'fallback',
        fallback: selection.alternatives[0]?.id
      })
      
      stepCount++
    }
    
    // Calculate total cost
    const totalCost = steps.reduce((sum, step) => ({
      tokens: sum.tokens + (step.tool.cost.tokens || 0),
      time: sum.time + (step.tool.cost.time || 0),
      money: sum.money + (step.tool.cost.money || 0)
    }), { tokens: 0, time: 0, money: 0 })
    
    // Estimate success
    const estimatedSuccess = steps.reduce((product, step) => 
      product * step.tool.reliability, 1
    )
    
    return {
      id: `chain_${Date.now().toString(36)}`,
      name: `Chain for: ${context.goal.slice(0, 50)}`,
      description: `Tool chain with ${steps.length} steps`,
      steps,
      totalCost,
      estimatedSuccess
    }
  }

  /**
   * Decompose goal into subtasks
   */
  private async decomposeGoal(goal: string): Promise<string[]> {
    // Simple decomposition based on keywords
    const subtasks: string[] = []
    
    if (goal.toLowerCase().includes('create') || goal.toLowerCase().includes('build')) {
      subtasks.push('Setup project structure')
      subtasks.push('Create necessary files')
      subtasks.push('Install dependencies')
      subtasks.push('Verify build')
    } else if (goal.toLowerCase().includes('fix') || goal.toLowerCase().includes('debug')) {
      subtasks.push('Analyze the error')
      subtasks.push('Identify root cause')
      subtasks.push('Apply fix')
      subtasks.push('Verify fix works')
    } else if (goal.toLowerCase().includes('test')) {
      subtasks.push('Analyze code to test')
      subtasks.push('Generate test cases')
      subtasks.push('Run tests')
      subtasks.push('Verify coverage')
    } else {
      subtasks.push(goal)
    }
    
    return subtasks
  }

  /**
   * Record tool execution result
   */
  recordResult(result: ToolExecutionResult): void {
    this.toolHistory.push(result)
    
    // Update reliability record
    const record = this.reliability.get(result.toolId)
    if (record) {
      record.totalUses++
      if (result.success) {
        record.successes++
      } else {
        record.failures++
        if (result.error && !record.commonErrors.includes(result.error)) {
          record.commonErrors.push(result.error)
          if (record.commonErrors.length > 10) {
            record.commonErrors.shift()
          }
        }
      }
      record.avgDuration = (record.avgDuration + result.duration) / 2
      record.lastUsed = new Date().toISOString()
    }
  }

  /**
   * Get tool by ID
   */
  getTool(id: string): Tool | undefined {
    return this.tools.get(id)
  }

  /**
   * Get all tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values())
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: ToolCategory): Tool[] {
    return Array.from(this.tools.values()).filter(t => t.category === category)
  }

  /**
   * Get tools with capability
   */
  getToolsWithCapability(capability: string): Tool[] {
    return Array.from(this.tools.values()).filter(t => 
      t.capabilities.includes(capability)
    )
  }

  /**
   * Get reliability statistics
   */
  getReliabilityStats(): Map<string, ToolReliabilityRecord> {
    return new Map(this.reliability)
  }

  /**
   * Register a new tool
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.id, tool)
    if (!this.reliability.has(tool.id)) {
      this.reliability.set(tool.id, {
        toolId: tool.id,
        totalUses: 0,
        successes: 0,
        failures: 0,
        avgDuration: tool.cost.time || 1,
        commonErrors: [],
        lastUsed: new Date().toISOString()
      })
    }
  }

  /**
   * Suggest tools for a goal
   */
  async suggestTools(goal: string): Promise<Tool[]> {
    const context: ToolSelectionContext = {
      goal,
      availableTools: Array.from(this.tools.keys()),
      constraints: {},
      previousTools: []
    }
    
    const scored = await Promise.all(
      Array.from(this.tools.values()).map(async tool => ({
        tool,
        score: await this.scoreTool(tool, context)
      }))
    )
    
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.tool)
  }
}

// Singleton
let toolEngineInstance: ToolUseReasoningEngine | null = null

export function getToolUseEngine(): ToolUseReasoningEngine {
  if (!toolEngineInstance) {
    toolEngineInstance = new ToolUseReasoningEngine()
  }
  return toolEngineInstance
}

/**
 * Quick tool selection
 */
export async function selectToolForGoal(
  goal: string,
  availableTools?: string[]
): Promise<ToolSelection> {
  const engine = getToolUseEngine()
  return engine.selectTool({
    goal,
    availableTools: availableTools || Array.from(engine.getAllTools().map(t => t.id)),
    constraints: {},
    previousTools: []
  })
}
