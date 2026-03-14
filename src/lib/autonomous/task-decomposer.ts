/**
 * Task Decomposer Engine
 * 
 * Breaks down complex tasks into:
 * - Subtasks with dependencies
 * - Goal hierarchy
 * - Milestone planning
 * - Priority ranking
 * - Feasibility checking
 */

import ZAI from 'z-ai-web-dev-sdk'

// Task Types
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low'
export type TaskStatus = 'pending' | 'ready' | 'in_progress' | 'blocked' | 'completed' | 'failed'
export type TaskType = 
  | 'setup'          // Project setup
  | 'create'         // Create new files/components
  | 'modify'         // Modify existing code
  | 'install'        // Install dependencies
  | 'configure'      // Configuration
  | 'test'           // Testing
  | 'debug'          // Debugging
  | 'deploy'         // Deployment
  | 'document'       // Documentation
  | 'review'         // Code review
  | 'security'       // Security check
  | 'optimize'       // Performance optimization

// Decomposed Task
export interface DecomposedTask {
  id: string
  title: string
  description: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  dependencies: string[]           // Task IDs this depends on
  dependents: string[]             // Task IDs that depend on this
  estimatedComplexity: number      // 1-10 scale
  estimatedDuration: number        // In minutes
  requiredCapabilities: string[]   // What skills/agents needed
  files?: string[]                 // Files involved
  agent?: string                   // Assigned agent
  milestone?: string               // Which milestone this belongs to
  metadata: {
    createdAt: string
    startedAt?: string
    completedAt?: string
    retries: number
    notes: string[]
  }
}

// Milestone
export interface Milestone {
  id: string
  name: string
  description: string
  tasks: string[]                  // Task IDs
  dependencies: string[]           // Milestone IDs
  status: 'pending' | 'in_progress' | 'completed'
  progress: number                 // 0-100
  estimatedDuration: number        // In minutes
}

// Goal Hierarchy
export interface GoalNode {
  id: string
  goal: string
  type: 'root' | 'milestone' | 'task' | 'subtask'
  parent?: string
  children: string[]
  status: TaskStatus
  progress: number
}

// Decomposition Result
export interface DecompositionResult {
  rootGoal: string
  tasks: DecomposedTask[]
  milestones: Milestone[]
  goalHierarchy: GoalNode[]
  criticalPath: string[]           // Task IDs on critical path
  totalEstimatedDuration: number   // In minutes
  parallelizableGroups: string[][] // Groups of tasks that can run in parallel
  riskFactors: string[]
  recommendations: string[]
}

// Decomposition Options
export interface DecompositionOptions {
  maxDepth?: number                // Max decomposition depth
  granularity?: 'coarse' | 'medium' | 'fine'
  includeTesting?: boolean
  includeDocumentation?: boolean
  includeSecurityChecks?: boolean
  targetMilestones?: string[]      // Custom milestone names
}

// Known task templates
const TASK_TEMPLATES: Record<string, Partial<DecomposedTask>[]> = {
  'react-app': [
    { type: 'setup', title: 'Initialize React project', priority: 'critical', estimatedComplexity: 2 },
    { type: 'configure', title: 'Configure TypeScript', priority: 'high', estimatedComplexity: 2 },
    { type: 'create', title: 'Create App component', priority: 'high', estimatedComplexity: 3 },
    { type: 'create', title: 'Create component structure', priority: 'medium', estimatedComplexity: 4 },
    { type: 'install', title: 'Install dependencies', priority: 'high', estimatedComplexity: 1 },
    { type: 'test', title: 'Setup testing framework', priority: 'medium', estimatedComplexity: 2 },
    { type: 'document', title: 'Create README', priority: 'low', estimatedComplexity: 1 }
  ],
  'api': [
    { type: 'setup', title: 'Initialize API project', priority: 'critical', estimatedComplexity: 2 },
    { type: 'create', title: 'Create route handlers', priority: 'high', estimatedComplexity: 4 },
    { type: 'create', title: 'Define data models', priority: 'high', estimatedComplexity: 3 },
    { type: 'create', title: 'Implement middleware', priority: 'medium', estimatedComplexity: 3 },
    { type: 'test', title: 'Create API tests', priority: 'medium', estimatedComplexity: 3 },
    { type: 'document', title: 'Generate API documentation', priority: 'medium', estimatedComplexity: 2 }
  ],
  'database': [
    { type: 'configure', title: 'Setup database connection', priority: 'critical', estimatedComplexity: 2 },
    { type: 'create', title: 'Define schema', priority: 'high', estimatedComplexity: 4 },
    { type: 'create', title: 'Create migrations', priority: 'high', estimatedComplexity: 3 },
    { type: 'create', title: 'Implement seeders', priority: 'medium', estimatedComplexity: 2 },
    { type: 'test', title: 'Test database operations', priority: 'medium', estimatedComplexity: 2 }
  ]
}

/**
 * Task Decomposer Engine
 */
export class TaskDecomposer {
  private zai: any = null
  private taskCounter = 0
  private milestoneCounter = 0

  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
  }

  /**
   * Decompose a user request into tasks
   */
  async decompose(
    request: string,
    options: DecompositionOptions = {}
  ): Promise<DecompositionResult> {
    const {
      maxDepth = 3,
      granularity = 'medium',
      includeTesting = true,
      includeDocumentation = true,
      includeSecurityChecks = true
    } = options

    // Identify request type and components
    const analysis = await this.analyzeRequest(request)
    
    // Generate tasks based on analysis
    let tasks = await this.generateTasks(request, analysis, granularity)
    
    // Add standard tasks
    if (includeTesting) {
      tasks.push(...this.generateTestingTasks(analysis))
    }
    if (includeDocumentation) {
      tasks.push(...this.generateDocumentationTasks(analysis))
    }
    if (includeSecurityChecks) {
      tasks.push(...this.generateSecurityTasks(analysis))
    }

    // Build dependencies
    tasks = this.buildDependencies(tasks, analysis)
    
    // Create milestones
    const milestones = this.createMilestones(tasks, analysis)
    
    // Build goal hierarchy
    const goalHierarchy = this.buildGoalHierarchy(request, tasks, milestones)
    
    // Calculate critical path
    const criticalPath = this.calculateCriticalPath(tasks)
    
    // Find parallelizable groups
    const parallelizableGroups = this.findParallelizableGroups(tasks)
    
    // Calculate total duration
    const totalDuration = this.calculateTotalDuration(tasks)
    
    // Identify risks
    const riskFactors = this.identifyRisks(tasks, analysis)
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(tasks, analysis)

    return {
      rootGoal: request,
      tasks,
      milestones,
      goalHierarchy,
      criticalPath,
      totalEstimatedDuration: totalDuration,
      parallelizableGroups,
      riskFactors,
      recommendations
    }
  }

  /**
   * Analyze the request
   */
  private async analyzeRequest(request: string): Promise<{
    type: string
    components: string[]
    complexity: number
    technologies: string[]
    features: string[]
  }> {
    const lowerRequest = request.toLowerCase()
    
    // Detect type
    let type = 'custom'
    if (lowerRequest.includes('react') || lowerRequest.includes('frontend')) {
      type = 'react-app'
    } else if (lowerRequest.includes('api') || lowerRequest.includes('backend')) {
      type = 'api'
    } else if (lowerRequest.includes('database') || lowerRequest.includes('schema')) {
      type = 'database'
    } else if (lowerRequest.includes('full') && lowerRequest.includes('stack')) {
      type = 'fullstack'
    }

    // Extract components
    const components: string[] = []
    const componentPatterns = [
      /(\w+)\s+(?:page|screen|view)/gi,
      /(\w+)\s+(?:component|widget)/gi,
      /(\w+)\s+(?:api|endpoint|route)/gi,
      /(\w+)\s+(?:model|schema|table)/gi
    ]
    
    for (const pattern of componentPatterns) {
      const matches = request.matchAll(pattern)
      for (const match of matches) {
        if (match[1].length > 2) {
          components.push(match[1].toLowerCase())
        }
      }
    }

    // Detect technologies
    const technologies: string[] = []
    const techPatterns: Record<string, RegExp> = {
      'React': /react/i,
      'TypeScript': /typescript|\bts\b/i,
      'Next.js': /next\.?js/i,
      'Node.js': /node\.?js|express/i,
      'Database': /database|sql|mongodb|postgres|mysql/i,
      'Authentication': /auth|login|oauth|jwt/i,
      'API': /api|rest|graphql/i
    }
    
    for (const [tech, pattern] of Object.entries(techPatterns)) {
      if (pattern.test(request)) {
        technologies.push(tech)
      }
    }

    // Extract features
    const features: string[] = []
    const featureKeywords = [
      'authentication', 'login', 'signup', 'logout',
      'search', 'filter', 'sort', 'pagination',
      'upload', 'download', 'export', 'import',
      'notification', 'email', 'sms',
      'payment', 'checkout', 'cart',
      'dashboard', 'analytics', 'reporting'
    ]
    
    for (const feature of featureKeywords) {
      if (lowerRequest.includes(feature)) {
        features.push(feature)
      }
    }

    // Estimate complexity
    let complexity = 3
    complexity += components.length
    complexity += features.length * 2
    complexity += Math.floor(request.split(' ').length / 20)
    complexity = Math.min(complexity, 10)

    return { type, components, complexity, technologies, features }
  }

  /**
   * Generate tasks based on analysis
   */
  private async generateTasks(
    request: string,
    analysis: { type: string; components: string[]; complexity: number; technologies: string[]; features: string[] },
    granularity: 'coarse' | 'medium' | 'fine'
  ): Promise<DecomposedTask[]> {
    const tasks: DecomposedTask[] = []
    
    // Start with template if available
    const template = TASK_TEMPLATES[analysis.type]
    if (template) {
      for (const t of template) {
        tasks.push(this.createTask(
          t.title || '',
          t.description || '',
          t.type || 'create',
          t.priority || 'medium',
          t.estimatedComplexity || 3
        ))
      }
    }

    // Add component-specific tasks
    for (const component of analysis.components) {
      if (granularity !== 'coarse') {
        tasks.push(this.createTask(
          `Create ${component} component`,
          `Implement the ${component} component with full functionality`,
          'create',
          'high',
          4
        ))
      }
      
      if (granularity === 'fine') {
        tasks.push(this.createTask(
          `Add styles for ${component}`,
          `Style the ${component} component`,
          'create',
          'medium',
          2
        ))
        tasks.push(this.createTask(
          `Add tests for ${component}`,
          `Unit tests for ${component}`,
          'test',
          'medium',
          2
        ))
      }
    }

    // Add feature-specific tasks
    for (const feature of analysis.features) {
      tasks.push(this.createTask(
        `Implement ${feature} feature`,
        `Add ${feature} functionality`,
        'create',
        'high',
        5
      ))
    }

    // Add technology-specific tasks
    for (const tech of analysis.technologies) {
      if (tech === 'Authentication') {
        tasks.push(this.createTask(
          'Setup authentication',
          'Configure authentication system',
          'configure',
          'critical',
          4
        ))
      } else if (tech === 'Database') {
        tasks.push(this.createTask(
          'Setup database',
          'Configure database connection and schema',
          'configure',
          'critical',
          3
        ))
      }
    }

    return tasks
  }

  /**
   * Generate testing tasks
   */
  private generateTestingTasks(analysis: { components: string[]; features: string[] }): DecomposedTask[] {
    const tasks: DecomposedTask[] = []
    
    tasks.push(this.createTask(
      'Setup testing framework',
      'Configure Jest/Vitest and testing utilities',
      'configure',
      'medium',
      2
    ))
    
    for (const component of analysis.components.slice(0, 5)) {
      tasks.push(this.createTask(
        `Test ${component}`,
        `Unit tests for ${component}`,
        'test',
        'medium',
        2
      ))
    }
    
    for (const feature of analysis.features.slice(0, 3)) {
      tasks.push(this.createTask(
        `Test ${feature} feature`,
        `Integration tests for ${feature}`,
        'test',
        'medium',
        3
      ))
    }
    
    tasks.push(this.createTask(
      'Run all tests',
      'Execute test suite and verify coverage',
      'test',
      'medium',
      1
    ))

    return tasks
  }

  /**
   * Generate documentation tasks
   */
  private generateDocumentationTasks(analysis: { components: string[]; features: string[] }): DecomposedTask[] {
    const tasks: DecomposedTask[] = []
    
    tasks.push(this.createTask(
      'Create README',
      'Document project setup and usage',
      'document',
      'low',
      1
    ))
    
    tasks.push(this.createTask(
      'Add code comments',
      'Document complex logic and APIs',
      'document',
      'low',
      2
    ))

    return tasks
  }

  /**
   * Generate security tasks
   */
  private generateSecurityTasks(analysis: { features: string[]; technologies: string[] }): DecomposedTask[] {
    const tasks: DecomposedTask[] = []
    
    tasks.push(this.createTask(
      'Security scan',
      'Run SAST security analysis',
      'security',
      'high',
      2
    ))
    
    if (analysis.features.includes('authentication') || analysis.technologies.includes('Authentication')) {
      tasks.push(this.createTask(
        'Auth security review',
        'Review authentication implementation for vulnerabilities',
        'security',
        'critical',
        3
      ))
    }

    return tasks
  }

  /**
   * Build task dependencies
   */
  private buildDependencies(
    tasks: DecomposedTask[],
    analysis: { components: string[]; features: string[] }
  ): DecomposedTask[] {
    // Find specific tasks
    const setupTasks = tasks.filter(t => t.type === 'setup')
    const configTasks = tasks.filter(t => t.type === 'configure')
    const createTasks = tasks.filter(t => t.type === 'create')
    const testTasks = tasks.filter(t => t.type === 'test')
    const securityTasks = tasks.filter(t => t.type === 'security')
    const docTasks = tasks.filter(t => t.type === 'document')

    // Setup depends on nothing
    // Config depends on setup
    for (const config of configTasks) {
      config.dependencies = setupTasks.map(t => t.id)
    }

    // Create depends on setup and config
    for (const create of createTasks) {
      create.dependencies = [
        ...setupTasks.map(t => t.id),
        ...configTasks.slice(0, 1).map(t => t.id) // First config only
      ]
    }

    // Test depends on create
    for (const test of testTasks) {
      test.dependencies = createTasks.map(t => t.id)
    }

    // Security depends on create
    for (const security of securityTasks) {
      security.dependencies = createTasks.map(t => t.id)
    }

    // Docs depend on everything
    for (const doc of docTasks) {
      doc.dependencies = [
        ...createTasks.map(t => t.id),
        ...testTasks.slice(0, 1).map(t => t.id)
      ]
    }

    // Update dependents
    for (const task of tasks) {
      for (const depId of task.dependencies) {
        const dep = tasks.find(t => t.id === depId)
        if (dep && !dep.dependents.includes(task.id)) {
          dep.dependents.push(task.id)
        }
      }
    }

    return tasks
  }

  /**
   * Create milestones
   */
  private createMilestones(
    tasks: DecomposedTask[],
    analysis: { components: string[]; features: string[] }
  ): Milestone[] {
    const milestones: Milestone[] = []

    // Milestone 1: Setup
    const setupTasks = tasks.filter(t => t.type === 'setup' || t.type === 'configure')
    milestones.push(this.createMilestone(
      'Project Setup',
      'Initialize project and configure dependencies',
      setupTasks.map(t => t.id)
    ))

    // Milestone 2: Core Development
    const coreTasks = tasks.filter(t => t.type === 'create')
    milestones.push(this.createMilestone(
      'Core Development',
      'Implement main features and components',
      coreTasks.map(t => t.id),
      [milestones[0].id]
    ))

    // Milestone 3: Testing & Security
    const testSecurityTasks = tasks.filter(t => t.type === 'test' || t.type === 'security')
    milestones.push(this.createMilestone(
      'Testing & Security',
      'Verify functionality and security',
      testSecurityTasks.map(t => t.id),
      [milestones[1].id]
    ))

    // Milestone 4: Documentation
    const docTasks = tasks.filter(t => t.type === 'document')
    if (docTasks.length > 0) {
      milestones.push(this.createMilestone(
        'Documentation',
        'Create documentation',
        docTasks.map(t => t.id),
        [milestones[2].id]
      ))
    }

    return milestones
  }

  /**
   * Build goal hierarchy
   */
  private buildGoalHierarchy(
    request: string,
    tasks: DecomposedTask[],
    milestones: Milestone[]
  ): GoalNode[] {
    const nodes: GoalNode[] = []

    // Root node
    const root: GoalNode = {
      id: 'goal_root',
      goal: request,
      type: 'root',
      children: milestones.map(m => `milestone_${m.id}`),
      status: 'pending',
      progress: 0
    }
    nodes.push(root)

    // Milestone nodes
    for (const milestone of milestones) {
      const milestoneNode: GoalNode = {
        id: `milestone_${milestone.id}`,
        goal: milestone.name,
        type: 'milestone',
        parent: root.id,
        children: milestone.tasks.map(t => `task_${t}`),
        status: milestone.status,
        progress: milestone.progress
      }
      nodes.push(milestoneNode)
    }

    // Task nodes
    for (const task of tasks) {
      const taskNode: GoalNode = {
        id: `task_${task.id}`,
        goal: task.title,
        type: 'task',
        parent: `milestone_${task.milestone || milestones[0].id}`,
        children: [],
        status: task.status,
        progress: task.status === 'completed' ? 100 : 0
      }
      nodes.push(taskNode)
    }

    return nodes
  }

  /**
   * Calculate critical path
   */
  private calculateCriticalPath(tasks: DecomposedTask[]): string[] {
    // Find tasks with most dependents (most blocking)
    const sorted = [...tasks].sort((a, b) => b.dependents.length - a.dependents.length)
    
    // Start with critical priority tasks
    const critical = tasks.filter(t => t.priority === 'critical')
    const high = tasks.filter(t => t.priority === 'high' && !critical.includes(t))
    
    // Build path
    const path: string[] = []
    
    // Add critical tasks first
    for (const task of critical) {
      path.push(task.id)
    }
    
    // Add blocking high priority tasks
    for (const task of high.slice(0, 5)) {
      if (!path.includes(task.id)) {
        path.push(task.id)
      }
    }

    return path
  }

  /**
   * Find parallelizable groups
   */
  private findParallelizableGroups(tasks: DecomposedTask[]): string[][] {
    const groups: string[][] = []
    const assigned = new Set<string>()

    // Group by dependency level
    const levels: DecomposedTask[][] = []
    let currentLevel = tasks.filter(t => t.dependencies.length === 0)
    let remaining = tasks.filter(t => t.dependencies.length > 0)

    while (currentLevel.length > 0) {
      levels.push(currentLevel)
      
      const currentIds = new Set(currentLevel.map(t => t.id))
      remaining = remaining.filter(t => !currentIds.has(t.id))
      
      currentLevel = remaining.filter(t => 
        t.dependencies.every(dep => currentIds.has(dep) || assigned.has(dep))
      )
    }

    // Convert levels to groups
    for (const level of levels) {
      const group = level.map(t => t.id).filter(id => !assigned.has(id))
      if (group.length > 1) {
        groups.push(group)
        group.forEach(id => assigned.add(id))
      }
    }

    return groups
  }

  /**
   * Calculate total duration
   */
  private calculateTotalDuration(tasks: DecomposedTask[]): number {
    // Sum of critical path + longest parallel branch
    const criticalPath = this.calculateCriticalPath(tasks)
    const criticalDuration = criticalPath.reduce((sum, id) => {
      const task = tasks.find(t => t.id === id)
      return sum + (task?.estimatedDuration || 5)
    }, 0)

    // Add some buffer
    return Math.ceil(criticalDuration * 1.2)
  }

  /**
   * Identify risks
   */
  private identifyRisks(
    tasks: DecomposedTask[],
    analysis: { complexity: number; features: string[] }
  ): string[] {
    const risks: string[] = []

    if (analysis.complexity > 7) {
      risks.push('High complexity may require more iterations')
    }

    if (tasks.filter(t => t.priority === 'critical').length > 3) {
      risks.push('Multiple critical tasks may cause bottlenecks')
    }

    const longDeps = tasks.filter(t => t.dependencies.length > 3)
    if (longDeps.length > 2) {
      risks.push('Long dependency chains may slow progress')
    }

    if (analysis.features.includes('authentication')) {
      risks.push('Authentication requires careful security review')
    }

    if (analysis.features.includes('payment')) {
      risks.push('Payment integration requires compliance checks')
    }

    return risks
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    tasks: DecomposedTask[],
    analysis: { complexity: number; technologies: string[] }
  ): string[] {
    const recommendations: string[] = []

    // Parallelize
    const parallel = this.findParallelizableGroups(tasks)
    if (parallel.length > 0) {
      recommendations.push(`Consider parallelizing ${parallel.length} task groups`)
    }

    // Technology specific
    if (analysis.technologies.includes('Authentication')) {
      recommendations.push('Consider using established auth providers (Auth0, Clerk)')
    }

    if (analysis.complexity > 6) {
      recommendations.push('Break down into smaller milestones for better tracking')
    }

    // Testing
    const testTasks = tasks.filter(t => t.type === 'test')
    if (testTasks.length < tasks.length * 0.2) {
      recommendations.push('Add more test coverage')
    }

    return recommendations
  }

  /**
   * Create a task
   */
  private createTask(
    title: string,
    description: string,
    type: TaskType,
    priority: TaskPriority,
    estimatedComplexity: number
  ): DecomposedTask {
    return {
      id: `task_${++this.taskCounter}_${Date.now().toString(36)}`,
      title,
      description,
      type,
      priority,
      status: 'pending',
      dependencies: [],
      dependents: [],
      estimatedComplexity,
      estimatedDuration: estimatedComplexity * 5, // 5 min per complexity point
      requiredCapabilities: this.getRequiredCapabilities(type),
      metadata: {
        createdAt: new Date().toISOString(),
        retries: 0,
        notes: []
      }
    }
  }

  /**
   * Create a milestone
   */
  private createMilestone(
    name: string,
    description: string,
    tasks: string[],
    dependencies: string[] = []
  ): Milestone {
    return {
      id: `ms_${++this.milestoneCounter}_${Date.now().toString(36)}`,
      name,
      description,
      tasks,
      dependencies,
      status: 'pending',
      progress: 0,
      estimatedDuration: tasks.length * 10
    }
  }

  /**
   * Get required capabilities for task type
   */
  private getRequiredCapabilities(type: TaskType): string[] {
    const capabilities: Record<TaskType, string[]> = {
      setup: ['project-setup', 'configuration'],
      create: ['code-generation', 'implementation'],
      modify: ['code-modification', 'refactoring'],
      install: ['dependency-management'],
      configure: ['configuration', 'setup'],
      test: ['test-generation', 'test-execution'],
      debug: ['error-analysis', 'debugging'],
      deploy: ['deployment', 'infrastructure'],
      document: ['documentation'],
      review: ['code-review', 'quality-check'],
      security: ['security-analysis', 'vulnerability-detection'],
      optimize: ['performance-analysis', 'optimization']
    }
    return capabilities[type] || []
  }

  /**
   * Get next ready tasks
   */
  getNextReadyTasks(tasks: DecomposedTask[]): DecomposedTask[] {
    return tasks.filter(t => 
      t.status === 'pending' &&
      t.dependencies.every(dep => 
        tasks.find(dt => dt.id === dep)?.status === 'completed'
      )
    ).sort((a, b) => {
      // Sort by priority
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }

  /**
   * Update task status
   */
  updateTaskStatus(
    tasks: DecomposedTask[],
    taskId: string,
    status: TaskStatus,
    note?: string
  ): DecomposedTask[] {
    return tasks.map(t => {
      if (t.id === taskId) {
        const updated = { ...t, status }
        if (status === 'in_progress') {
          updated.metadata.startedAt = new Date().toISOString()
        } else if (status === 'completed' || status === 'failed') {
          updated.metadata.completedAt = new Date().toISOString()
        }
        if (note) {
          updated.metadata.notes.push(note)
        }
        return updated
      }
      return t
    })
  }

  /**
   * Get progress percentage
   */
  getProgress(tasks: DecomposedTask[]): number {
    if (tasks.length === 0) return 0
    const completed = tasks.filter(t => t.status === 'completed').length
    return Math.round((completed / tasks.length) * 100)
  }
}

// Singleton
let decomposerInstance: TaskDecomposer | null = null

export function getTaskDecomposer(): TaskDecomposer {
  if (!decomposerInstance) {
    decomposerInstance = new TaskDecomposer()
  }
  return decomposerInstance
}

/**
 * Quick decompose function
 */
export async function decomposeTask(
  request: string,
  options?: DecompositionOptions
): Promise<DecompositionResult> {
  const decomposer = getTaskDecomposer()
  return decomposer.decompose(request, options)
}
