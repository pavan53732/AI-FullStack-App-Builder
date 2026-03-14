/**
 * Multi-Agent Orchestration System
 * 
 * Coordinates multiple specialized AI agents:
 * - Planner Agent: Analyzes requirements, creates execution plan
 * - Coder Agent: Writes and modifies code
 * - Debugger Agent: Fixes errors
 * - Reviewer Agent: Reviews code quality
 * - Tester Agent: Writes and runs tests
 */

import ZAI from 'z-ai-web-dev-sdk'

// Agent types
export type AgentType = 'planner' | 'coder' | 'debugger' | 'reviewer' | 'tester' | 'architect' | 'deployer'

export interface AgentMessage {
  from: AgentType
  to: AgentType | 'orchestrator'
  type: 'task' | 'result' | 'question' | 'error' | 'handoff'
  content: string
  artifacts?: Record<string, any>
  timestamp: string
}

export interface AgentTask {
  id: string
  type: AgentType
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  assignedTo?: AgentType
  result?: any
  error?: string
  dependencies?: string[]
  createdAt: string
  completedAt?: string
}

export interface AgentContext {
  projectId: string
  projectPath: string
  conversationHistory: AgentMessage[]
  taskQueue: AgentTask[]
  currentTask: AgentTask | null
  memory: Record<string, any>
  filesCreated: string[]
  filesModified: string[]
  errors: string[]
}

// Agent prompts
const AGENT_PROMPTS: Record<AgentType, string> = {
  planner: `You are the PLANNER AGENT - an expert at breaking down complex projects.

Your job:
1. Analyze user requirements
2. Identify all components needed (frontend, backend, database, APIs)
3. Break down into specific, actionable tasks
4. Order tasks by dependencies
5. Estimate complexity

Output format:
\`\`\`json
{
  "analysis": "Brief analysis of requirements",
  "architecture": {
    "components": ["frontend", "backend", "database"],
    "frameworks": {"frontend": "React", "backend": "Express"},
    "dataFlow": "Description of data flow"
  },
  "tasks": [
    {"id": "1", "type": "coder", "description": "Create project structure", "dependencies": []},
    {"id": "2", "type": "coder", "description": "Set up database schema", "dependencies": ["1"]},
    {"id": "3", "type": "coder", "description": "Create API endpoints", "dependencies": ["2"]}
  ],
  "estimatedSteps": 10
}
\`\`\`

Be thorough but realistic. Think step by step.`,

  coder: `You are the CODER AGENT - an expert developer who writes clean, working code.

Your job:
1. Implement tasks assigned to you
2. Write complete, working code
3. Follow best practices
4. Include error handling
5. Add comments for complex logic

Output format for file creation:
\`\`\`json
{
  "action": "create_file",
  "path": "src/App.tsx",
  "content": "// Your complete code here"
}
\`\`\`

Output format for command execution:
\`\`\`json
{
  "action": "execute",
  "command": "npm install express",
  "cwd": "project-folder"
}
\`\`\`

Always write COMPLETE code, not placeholders. Test your logic mentally before outputting.`,

  debugger: `You are the DEBUGGER AGENT - an expert at fixing errors and bugs.

Your job:
1. Analyze error messages
2. Identify root cause
3. Propose fix
4. Implement fix
5. Verify fix works

When you see an error:
1. Parse the error message
2. Find the problematic code
3. Understand WHY it's failing
4. Fix the specific issue
5. Don't change unrelated code

Output format:
\`\`\`json
{
  "errorAnalysis": "What's wrong and why",
  "rootCause": "The specific issue",
  "fix": {
    "file": "src/App.tsx",
    "line": 42,
    "originalCode": "...",
    "fixedCode": "..."
  }
}
\`\`\`

Be precise. Fix only what's broken.`,

  reviewer: `You are the REVIEWER AGENT - an expert code reviewer.

Your job:
1. Review code for bugs
2. Check for security issues
3. Verify best practices
4. Suggest improvements
5. Approve or request changes

Output format:
\`\`\`json
{
  "overallScore": 8,
  "issues": [
    {"severity": "warning", "file": "src/App.tsx", "line": 10, "message": "Consider using useMemo here"}
  ],
  "security": ["No SQL injection vulnerabilities found"],
  "suggestions": ["Add error boundary for better error handling"],
  "approved": true
}
\`\`\`

Be thorough but practical. Focus on real issues, not style nitpicks.`,

  tester: `You are the TESTER AGENT - an expert at testing software.

Your job:
1. Write unit tests
2. Write integration tests
3. Run tests and analyze results
4. Report coverage
5. Identify edge cases

Output format:
\`\`\`json
{
  "testFile": "App.test.tsx",
  "tests": [
    {"name": "renders correctly", "code": "test('renders correctly', () => {...})"}
  ],
  "coverage": {"lines": 85, "branches": 70, "functions": 90}
}
\`\`\`

Test edge cases, error scenarios, and happy paths.`,

  architect: `You are the ARCHITECT AGENT - an expert at system design.

Your job:
1. Design system architecture
2. Define data models
3. Plan API contracts
4. Choose technologies
5. Document decisions

Output format:
\`\`\`json
{
  "architecture": {
    "layers": ["presentation", "business", "data"],
    "patterns": ["Repository", "Factory", "Observer"],
    "database": {"type": "postgres", "schema": "..."},
    "api": {"style": "REST", "endpoints": [...]}
  },
  "decisions": [
    {"decision": "Use PostgreSQL", "rationale": "Need relational data and ACID guarantees"}
  ]
}
\`\`\`

Think long-term. Design for maintainability and scalability.`,

  deployer: `You are the DEPLOYER AGENT - an expert at deploying applications.

Your job:
1. Build production artifacts
2. Configure environments
3. Deploy to target platform
4. Verify deployment
5. Monitor for issues

Output format:
\`\`\`json
{
  "platform": "docker",
  "steps": [
    {"action": "build", "command": "npm run build"},
    {"action": "dockerize", "dockerfile": "..."}
  ],
  "environment": {
    "NODE_ENV": "production",
    "PORT": "3000"
  },
  "healthCheck": "/api/health"
}
\`\`\`

Ensure zero-downtime deployments and proper monitoring.`
}

/**
 * Multi-Agent Orchestrator
 */
export class MultiAgentOrchestrator {
  private zai: any = null
  private context: AgentContext
  private onMessage?: (msg: AgentMessage) => void
  private agents: Map<AgentType, AgentState> = new Map()

  constructor(projectId: string, projectPath: string) {
    this.context = {
      projectId,
      projectPath,
      conversationHistory: [],
      taskQueue: [],
      currentTask: null,
      memory: {},
      filesCreated: [],
      filesModified: [],
      errors: []
    }
    
    // Initialize agent states
    const agentTypes: AgentType[] = ['planner', 'coder', 'debugger', 'reviewer', 'tester', 'architect', 'deployer']
    for (const type of agentTypes) {
      this.agents.set(type, {
        type,
        status: 'idle',
        tasksCompleted: 0,
        lastActivity: new Date().toISOString()
      })
    }
  }

  /**
   * Initialize AI
   */
  async init(): Promise<void> {
    this.zai = await ZAI.create()
  }

  /**
   * Set message callback
   */
  onMessageReceived(callback: (msg: AgentMessage) => void): void {
    this.onMessage = callback
  }

  /**
   * Send message to orchestrator
   */
  private async sendToOrchestrator(message: AgentMessage): Promise<void> {
    this.context.conversationHistory.push(message)
    this.onMessage?.(message)
  }

  /**
   * Call a specific agent
   */
  async callAgent(
    agentType: AgentType,
    task: string,
    context?: Record<string, any>
  ): Promise<string> {
    if (!this.zai) await this.init()

    // Update agent state
    const state = this.agents.get(agentType)
    if (state) {
      state.status = 'working'
      state.lastActivity = new Date().toISOString()
    }

    // Build messages
    const messages = [
      { role: 'assistant' as const, content: AGENT_PROMPTS[agentType] },
      { 
        role: 'user' as const, 
        content: `Task: ${task}\n\nProject Context:\n- Project: ${this.context.projectId}\n- Files created: ${this.context.filesCreated.join(', ') || 'none'}\n- Files modified: ${this.context.filesModified.join(', ') || 'none'}\n- Current errors: ${this.context.errors.join('; ') || 'none'}\n${context ? `\nAdditional Context:\n${JSON.stringify(context, null, 2)}` : ''}`
      }
    ]

    // Add relevant conversation history
    const relevantHistory = this.context.conversationHistory
      .filter(m => m.to === agentType || m.from === agentType)
      .slice(-5)
    
    for (const msg of relevantHistory) {
      messages.push({
        role: msg.from === agentType ? 'assistant' : 'user',
        content: `[${msg.from}]: ${msg.content}`
      })
    }

    // Get response
    const completion = await this.zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' }
    })

    const response = completion.choices[0]?.message?.content || ''

    // Update agent state
    if (state) {
      state.status = 'idle'
      state.tasksCompleted++
      state.lastActivity = new Date().toISOString()
    }

    // Send message to orchestrator
    await this.sendToOrchestrator({
      from: agentType,
      to: 'orchestrator',
      type: 'result',
      content: response,
      timestamp: new Date().toISOString()
    })

    return response
  }

  /**
   * Plan a project
   */
  async planProject(requirements: string): Promise<{
    tasks: AgentTask[]
    architecture: any
  }> {
    const response = await this.callAgent('planner', `Plan this project: ${requirements}`)
    
    // Parse response
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        const plan = JSON.parse(jsonMatch[1])
        
        const tasks: AgentTask[] = (plan.tasks || []).map((t: any) => ({
          id: t.id || Date.now().toString(),
          type: t.type || 'coder',
          description: t.description,
          status: 'pending',
          dependencies: t.dependencies || [],
          createdAt: new Date().toISOString()
        }))
        
        this.context.taskQueue = tasks
        
        return { tasks, architecture: plan.architecture }
      }
    } catch (error) {
      console.error('[MultiAgent] Failed to parse plan:', error)
    }
    
    // Fallback: create basic task list
    const tasks: AgentTask[] = [
      { id: '1', type: 'coder', description: requirements, status: 'pending', dependencies: [], createdAt: new Date().toISOString() }
    ]
    this.context.taskQueue = tasks
    
    return { tasks, architecture: {} }
  }

  /**
   * Execute next task in queue
   */
  async executeNextTask(): Promise<AgentTask | null> {
    // Find next pending task with satisfied dependencies
    const task = this.context.taskQueue.find(t => 
      t.status === 'pending' &&
      (!t.dependencies || t.dependencies.every(depId => 
        this.context.taskQueue.find(d => d.id === depId && d.status === 'completed')
      ))
    )

    if (!task) return null

    task.status = 'in_progress'
    this.context.currentTask = task

    try {
      const response = await this.callAgent(task.type, task.description)
      
      // Parse artifacts from response
      const artifacts = this.parseArtifacts(response)
      
      task.status = 'completed'
      task.result = artifacts
      task.completedAt = new Date().toISOString()
      
      // Update context
      if (artifacts.filesCreated) {
        this.context.filesCreated.push(...artifacts.filesCreated)
      }
      if (artifacts.filesModified) {
        this.context.filesModified.push(...artifacts.filesModified)
      }
      
      return task
    } catch (error: any) {
      task.status = 'failed'
      task.error = error.message
      this.context.errors.push(error.message)
      return task
    } finally {
      this.context.currentTask = null
    }
  }

  /**
   * Execute all tasks
   */
  async executeAllTasks(
    onProgress?: (task: AgentTask, completed: number, total: number) => void
  ): Promise<AgentTask[]> {
    const results: AgentTask[] = []
    const total = this.context.taskQueue.length
    let completed = 0

    while (true) {
      const task = await this.executeNextTask()
      if (!task) break
      
      completed++
      results.push(task)
      onProgress?.(task, completed, total)
      
      if (task.status === 'failed' && this.shouldRetry(task)) {
        // Retry with debugger agent
        const debugTask: AgentTask = {
          id: `${task.id}_debug`,
          type: 'debugger',
          description: `Fix error: ${task.error}`,
          status: 'pending',
          dependencies: [],
          createdAt: new Date().toISOString()
        }
        this.context.taskQueue.push(debugTask)
      }
    }

    return results
  }

  /**
   * Check if task should be retried
   */
  private shouldRetry(task: AgentTask): boolean {
    // Don't retry more than 3 times
    const retries = this.context.taskQueue.filter(t => t.id.startsWith(task.id)).length
    return retries < 3
  }

  /**
   * Parse artifacts from agent response
   */
  private parseArtifacts(response: string): Record<string, any> {
    const artifacts: Record<string, any> = {}
    
    // Extract JSON blocks
    const jsonMatches = response.matchAll(/```json\s*([\s\S]*?)\s*```/g)
    for (const match of jsonMatches) {
      try {
        const json = JSON.parse(match[1])
        Object.assign(artifacts, json)
      } catch {}
    }
    
    return artifacts
  }

  /**
   * Debug an error
   */
  async debugError(error: string, fileContent?: string): Promise<{
    analysis: string
    fix: any
  }> {
    const response = await this.callAgent('debugger', `Debug this error:\n${error}`, {
      fileContent
    })
    
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1])
      }
    } catch {}
    
    return { analysis: response, fix: null }
  }

  /**
   * Review code
   */
  async reviewCode(files: Record<string, string>): Promise<{
    score: number
    issues: any[]
    approved: boolean
  }> {
    const response = await this.callAgent('reviewer', 'Review this code', { files })
    
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        const review = JSON.parse(jsonMatch[1])
        return {
          score: review.overallScore || 0,
          issues: review.issues || [],
          approved: review.approved ?? false
        }
      }
    } catch {}
    
    return { score: 0, issues: [], approved: false }
  }

  /**
   * Get agent states
   */
  getAgentStates(): AgentState[] {
    return Array.from(this.agents.values())
  }

  /**
   * Get context
   */
  getContext(): AgentContext {
    return this.context
  }
}

interface AgentState {
  type: AgentType
  status: 'idle' | 'working' | 'error'
  tasksCompleted: number
  lastActivity: string
}

/**
 * Create a multi-agent orchestrator
 */
export function createOrchestrator(projectId: string, projectPath: string): MultiAgentOrchestrator {
  return new MultiAgentOrchestrator(projectId, projectPath)
}
