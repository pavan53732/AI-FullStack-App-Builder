/**
 * Feasibility Checker
 * 
 * Evaluates whether a plan or task is feasible:
 * - Resource availability
 * - Time constraints
 * - Technical feasibility
 * - Dependency resolution
 * - Risk assessment
 */

import ZAI from 'z-ai-web-dev-sdk'

// Types
export interface FeasibilityContext {
  plan: string
  tasks: string[]
  constraints: FeasibilityConstraint[]
  resources: ResourceAvailability
  timeframe?: number  // hours
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface FeasibilityConstraint {
  type: 'time' | 'resource' | 'technical' | 'dependency' | 'skill' | 'budget'
  description: string
  value?: number | string
  mandatory: boolean
}

export interface ResourceAvailability {
  cpu: number           // 0-1 utilization
  memory: number        // MB available
  diskSpace: number     // MB available
  networkAccess: boolean
  aiApiAvailable: boolean
  gitAvailable: boolean
  dockerAvailable: boolean
  databaseAvailable: boolean
}

export interface FeasibilityResult {
  feasible: boolean
  confidence: number    // 0-1
  score: number         // 0-100
  issues: FeasibilityIssue[]
  risks: FeasibilityRisk[]
  recommendations: string[]
  alternatives: string[]
  estimatedTime: number // hours
  requiredResources: string[]
  dependencies: string[]
}

export interface FeasibilityIssue {
  type: 'blocker' | 'warning' | 'info'
  description: string
  impact: string
  suggestion: string
}

export interface FeasibilityRisk {
  type: string
  probability: number   // 0-1
  impact: number        // 0-1
  description: string
  mitigation: string
}

// Technical capability requirements for common tasks
const TASK_REQUIREMENTS: Record<string, {
  resources: string[]
  skills: string[]
  avgTime: number      // hours
  dependencies: string[]
  risks: string[]
}> = {
  'create_component': {
    resources: ['ai_api'],
    skills: ['react', 'typescript'],
    avgTime: 0.5,
    dependencies: [],
    risks: ['incompatible_styles']
  },
  'create_api_route': {
    resources: ['ai_api'],
    skills: ['nextjs', 'typescript'],
    avgTime: 0.3,
    dependencies: [],
    risks: ['route_conflict']
  },
  'setup_database': {
    resources: ['database', 'ai_api'],
    skills: ['prisma', 'sql'],
    avgTime: 1,
    dependencies: ['prisma_schema'],
    risks: ['migration_failure', 'data_loss']
  },
  'implement_auth': {
    resources: ['ai_api', 'database'],
    skills: ['nextauth', 'security'],
    avgTime: 2,
    dependencies: ['database', 'env_config'],
    risks: ['security_vulnerability', 'session_issues']
  },
  'deploy_application': {
    resources: ['network', 'git'],
    skills: ['devops', 'docker'],
    avgTime: 1,
    dependencies: ['build_success', 'tests_pass'],
    risks: ['deployment_failure', 'runtime_errors']
  },
  'write_tests': {
    resources: ['ai_api'],
    skills: ['testing', 'jest'],
    avgTime: 0.5,
    dependencies: ['code_exists'],
    risks: ['flaky_tests', 'low_coverage']
  },
  'setup_ci_cd': {
    resources: ['git', 'network'],
    skills: ['github_actions', 'devops'],
    avgTime: 1.5,
    dependencies: ['tests_exist'],
    risks: ['pipeline_failure', 'secrets_exposure']
  }
}

/**
 * Feasibility Checker
 */
export class FeasibilityChecker {
  private zai: any = null

  constructor() {}

  /**
   * Initialize AI
   */
  async init(): Promise<void> {
    if (!this.zai) {
      this.zai = await ZAI.create()
    }
  }

  /**
   * Check feasibility of a plan
   */
  async checkFeasibility(context: FeasibilityContext): Promise<FeasibilityResult> {
    await this.init()

    const issues: FeasibilityIssue[] = []
    const risks: FeasibilityRisk[] = []
    const recommendations: string[] = []
    const requiredResources: string[] = []
    const dependencies: string[] = []

    // Check resource availability
    const resourceIssues = this.checkResources(context)
    issues.push(...resourceIssues.issues)
    requiredResources.push(...resourceIssues.required)

    // Check time constraints
    const timeIssues = this.checkTimeConstraints(context)
    issues.push(...timeIssues.issues)
    const estimatedTime = timeIssues.estimatedTime

    // Check technical feasibility
    const techIssues = await this.checkTechnicalFeasibility(context)
    issues.push(...techIssues.issues)
    risks.push(...techIssues.risks)
    dependencies.push(...techIssues.dependencies)

    // Check mandatory constraints
    const constraintIssues = this.checkConstraints(context)
    issues.push(...constraintIssues.issues)

    // Calculate overall score
    const blockerCount = issues.filter(i => i.type === 'blocker').length
    const warningCount = issues.filter(i => i.type === 'warning').length
    const avgRisk = risks.length > 0 
      ? risks.reduce((sum, r) => sum + r.probability * r.impact, 0) / risks.length 
      : 0

    let score = 100
    score -= blockerCount * 30
    score -= warningCount * 10
    score -= avgRisk * 20

    // Determine feasibility
    const feasible = blockerCount === 0 && score >= 40

    // Calculate confidence
    const confidence = Math.max(0, Math.min(1, score / 100))

    // Generate recommendations
    if (!feasible) {
      recommendations.push(...this.generateRecommendations(issues, risks))
    }

    // Generate alternatives
    const alternatives = feasible ? [] : await this.generateAlternatives(context, issues)

    return {
      feasible,
      confidence,
      score: Math.round(score),
      issues,
      risks,
      recommendations,
      alternatives,
      estimatedTime,
      requiredResources: [...new Set(requiredResources)],
      dependencies: [...new Set(dependencies)]
    }
  }

  /**
   * Check resource availability
   */
  private checkResources(context: FeasibilityContext): {
    issues: FeasibilityIssue[]
    required: string[]
  } {
    const issues: FeasibilityIssue[] = []
    const required: string[] = []

    // Check each task's resource requirements
    for (const task of context.tasks) {
      const requirements = this.getTaskRequirements(task)
      
      for (const resource of requirements.resources) {
        required.push(resource)

        switch (resource) {
          case 'ai_api':
            if (!context.resources.aiApiAvailable) {
              issues.push({
                type: 'blocker',
                description: 'AI API is required but not available',
                impact: 'Cannot generate code or perform AI reasoning',
                suggestion: 'Configure AI API in settings'
              })
            }
            break

          case 'database':
            if (!context.resources.databaseAvailable) {
              issues.push({
                type: context.constraints.some(c => c.type === 'dependency' && c.mandatory)
                  ? 'blocker' : 'warning',
                description: 'Database is required but not configured',
                impact: 'Cannot persist data',
                suggestion: 'Set up database connection'
              })
            }
            break

          case 'git':
            if (!context.resources.gitAvailable) {
              issues.push({
                type: 'warning',
                description: 'Git is not available',
                impact: 'Cannot commit changes or deploy',
                suggestion: 'Initialize git repository'
              })
            }
            break

          case 'docker':
            if (!context.resources.dockerAvailable) {
              issues.push({
                type: 'warning',
                description: 'Docker is not available',
                impact: 'Cannot use containerization',
                suggestion: 'Install Docker'
              })
            }
            break

          case 'network':
            if (!context.resources.networkAccess) {
              issues.push({
                type: context.constraints.some(c => c.type === 'resource' && c.mandatory)
                  ? 'blocker' : 'warning',
                description: 'Network access is required but unavailable',
                impact: 'Cannot fetch packages or deploy',
                suggestion: 'Enable network access'
              })
            }
            break
        }
      }
    }

    // Check system resources
    if (context.resources.memory < 256) {
      issues.push({
        type: 'warning',
        description: 'Low memory available',
        impact: 'May cause slow performance or crashes',
        suggestion: 'Free up memory or increase allocation'
      })
    }

    if (context.resources.diskSpace < 100) {
      issues.push({
        type: 'warning',
        description: 'Low disk space',
        impact: 'May not be able to write files',
        suggestion: 'Free up disk space'
      })
    }

    if (context.resources.cpu > 0.9) {
      issues.push({
        type: 'warning',
        description: 'High CPU utilization',
        impact: 'Slow processing and response times',
        suggestion: 'Wait for CPU load to decrease'
      })
    }

    return { issues, required }
  }

  /**
   * Check time constraints
   */
  private checkTimeConstraints(context: FeasibilityContext): {
    issues: FeasibilityIssue[]
    estimatedTime: number
  } {
    const issues: FeasibilityIssue[] = []
    
    // Calculate estimated time
    let estimatedTime = 0
    for (const task of context.tasks) {
      const requirements = this.getTaskRequirements(task)
      estimatedTime += requirements.avgTime
    }

    // Add buffer for AI generation and verification
    estimatedTime *= 1.5

    // Check against timeframe
    if (context.timeframe && estimatedTime > context.timeframe) {
      issues.push({
        type: 'warning',
        description: `Estimated time (${estimatedTime.toFixed(1)}h) exceeds timeframe (${context.timeframe}h)`,
        impact: 'Plan may not complete in time',
        suggestion: 'Reduce scope or increase timeframe'
      })
    }

    // Check for time constraints
    const timeConstraints = context.constraints.filter(c => c.type === 'time')
    for (const constraint of timeConstraints) {
      if (constraint.value && estimatedTime > Number(constraint.value)) {
        issues.push({
          type: constraint.mandatory ? 'blocker' : 'warning',
          description: `Time constraint violated: ${constraint.description}`,
          impact: 'Cannot meet deadline',
          suggestion: 'Replan or negotiate constraint'
        })
      }
    }

    return { issues, estimatedTime }
  }

  /**
   * Check technical feasibility
   */
  private async checkTechnicalFeasibility(context: FeasibilityContext): Promise<{
    issues: FeasibilityIssue[]
    risks: FeasibilityRisk[]
    dependencies: string[]
  }> {
    const issues: FeasibilityIssue[] = []
    const risks: FeasibilityRisk[] = []
    const dependencies: string[] = []

    for (const task of context.tasks) {
      const requirements = this.getTaskRequirements(task)

      // Add dependencies
      dependencies.push(...requirements.dependencies)

      // Add risks
      for (const risk of requirements.risks) {
        risks.push({
          type: risk,
          probability: 0.3,
          impact: 0.5,
          description: this.getRiskDescription(risk),
          mitigation: this.getRiskMitigation(risk)
        })
      }

      // Check for conflicting requirements
      if (requirements.skills.includes('nextauth') && !context.resources.databaseAvailable) {
        issues.push({
          type: 'warning',
          description: 'Auth implementation requires database',
          impact: 'Session storage may not work',
          suggestion: 'Configure database or use JWT-only auth'
        })
      }
    }

    // Use AI for advanced technical analysis
    try {
      const analysis = await this.analyzeTechnicalFeasibility(context)
      issues.push(...analysis.issues)
      risks.push(...analysis.risks)
    } catch (error) {
      // AI analysis failed, use basic analysis
    }

    return { issues, risks, dependencies }
  }

  /**
   * Check mandatory constraints
   */
  private checkConstraints(context: FeasibilityContext): { issues: FeasibilityIssue[] } {
    const issues: FeasibilityIssue[] = []

    for (const constraint of context.constraints) {
      if (!constraint.mandatory) continue

      // Resource constraints
      if (constraint.type === 'resource') {
        if (constraint.description.toLowerCase().includes('ai') && !context.resources.aiApiAvailable) {
          issues.push({
            type: 'blocker',
            description: `Mandatory constraint violated: ${constraint.description}`,
            impact: 'Cannot proceed without required resource',
            suggestion: 'Configure required resource'
          })
        }
      }

      // Skill constraints
      if (constraint.type === 'skill') {
        // Check if required skills are available (would need skill registry)
        // For now, assume AI has all common skills
      }
    }

    return { issues }
  }

  /**
   * Get task requirements
   */
  private getTaskRequirements(task: string): typeof TASK_REQUIREMENTS[string] {
    // Match task to requirements
    const taskLower = task.toLowerCase()

    for (const [key, requirements] of Object.entries(TASK_REQUIREMENTS)) {
      if (taskLower.includes(key.replace('_', ' '))) {
        return requirements
      }
    }

    // Default requirements for unknown tasks
    return {
      resources: ['ai_api'],
      skills: [],
      avgTime: 1,
      dependencies: [],
      risks: ['unknown_complexity']
    }
  }

  /**
   * Get risk description
   */
  private getRiskDescription(risk: string): string {
    const descriptions: Record<string, string> = {
      incompatible_styles: 'Generated styles may conflict with existing design system',
      route_conflict: 'API route may conflict with existing routes',
      migration_failure: 'Database migration may fail',
      data_loss: 'Data may be lost during migration',
      security_vulnerability: 'Implementation may have security issues',
      session_issues: 'Authentication sessions may not work correctly',
      deployment_failure: 'Deployment to production may fail',
      runtime_errors: 'Application may have runtime errors',
      flaky_tests: 'Tests may be unreliable',
      low_coverage: 'Test coverage may be insufficient',
      pipeline_failure: 'CI/CD pipeline may fail',
      secrets_exposure: 'Secrets may be accidentally exposed',
      unknown_complexity: 'Task complexity is unknown'
    }
    return descriptions[risk] || `Risk: ${risk}`
  }

  /**
   * Get risk mitigation
   */
  private getRiskMitigation(risk: string): string {
    const mitigations: Record<string, string> = {
      incompatible_styles: 'Use CSS modules or scoped styles, follow existing patterns',
      route_conflict: 'Check existing routes before creating new ones',
      migration_failure: 'Create backup before migration, test in development first',
      data_loss: 'Create database backup, use transactions',
      security_vulnerability: 'Follow security best practices, use parameterized queries',
      session_issues: 'Test authentication flow thoroughly, use secure cookies',
      deployment_failure: 'Test build locally, check environment variables',
      runtime_errors: 'Run tests, check console for errors',
      flaky_tests: 'Use deterministic test data, avoid timing dependencies',
      low_coverage: 'Focus on critical paths, add edge case tests',
      pipeline_failure: 'Test pipeline locally, use caching',
      secrets_exposure: 'Use environment variables, never commit secrets',
      unknown_complexity: 'Break down into smaller tasks, estimate conservatively'
    }
    return mitigations[risk] || 'Monitor and adapt as needed'
  }

  /**
   * Analyze technical feasibility with AI
   */
  private async analyzeTechnicalFeasibility(context: FeasibilityContext): Promise<{
    issues: FeasibilityIssue[]
    risks: FeasibilityRisk[]
  }> {
    const prompt = `Analyze the technical feasibility of this plan:

Plan: ${context.plan}
Tasks: ${context.tasks.join(', ')}
Resources: AI=${context.resources.aiApiAvailable}, DB=${context.resources.databaseAvailable}, Git=${context.resources.gitAvailable}

Identify:
1. Any technical blockers
2. Risks and their probability (0-1) and impact (0-1)

Respond in JSON format:
{
  "issues": [{ "type": "warning|blocker", "description": "...", "impact": "...", "suggestion": "..." }],
  "risks": [{ "type": "...", "probability": 0.5, "impact": 0.5, "description": "...", "mitigation": "..." }]
}`

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: 'You are a technical feasibility analyst. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        thinking: { type: 'disabled' }
      })

      const response = completion.choices[0]?.message?.content || '{}'
      const parsed = JSON.parse(response)
      
      return {
        issues: parsed.issues || [],
        risks: parsed.risks || []
      }
    } catch {
      return { issues: [], risks: [] }
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(issues: FeasibilityIssue[], risks: FeasibilityRisk[]): string[] {
    const recommendations: string[] = []

    // From issues
    for (const issue of issues) {
      if (issue.suggestion) {
        recommendations.push(issue.suggestion)
      }
    }

    // From risks
    for (const risk of risks) {
      if (risk.probability * risk.impact > 0.3) {
        recommendations.push(`Mitigate ${risk.type}: ${risk.mitigation}`)
      }
    }

    return [...new Set(recommendations)]
  }

  /**
   * Generate alternatives
   */
  private async generateAlternatives(
    context: FeasibilityContext,
    issues: FeasibilityIssue[]
  ): Promise<string[]> {
    const blockers = issues.filter(i => i.type === 'blocker')

    if (blockers.length === 0) return []

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { 
            role: 'assistant', 
            content: 'You are a planning expert. Suggest alternative approaches.' 
          },
          { 
            role: 'user', 
            content: `Plan: ${context.plan}
Blockers: ${blockers.map(b => b.description).join(', ')}

Suggest 3 alternative approaches to achieve the same goal.`
          }
        ],
        thinking: { type: 'disabled' }
      })

      const response = completion.choices[0]?.message?.content || ''
      
      // Extract alternatives
      const alternatives = response.split('\n')
        .filter(line => line.match(/^[\d\-\*]/))
        .map(line => line.replace(/^[\d\-\*\s]+/, '').trim())
        .filter(line => line.length > 10)

      return alternatives.slice(0, 3)
    } catch {
      return ['Reduce scope', 'Add missing resources', 'Adjust timeline']
    }
  }
}

// Singleton
let checkerInstance: FeasibilityChecker | null = null

export function getFeasibilityChecker(): FeasibilityChecker {
  if (!checkerInstance) {
    checkerInstance = new FeasibilityChecker()
  }
  return checkerInstance
}

/**
 * Quick feasibility check
 */
export async function checkFeasibility(
  plan: string,
  tasks: string[],
  resources: ResourceAvailability
): Promise<FeasibilityResult> {
  const checker = getFeasibilityChecker()
  return checker.checkFeasibility({
    plan,
    tasks,
    constraints: [],
    resources,
    priority: 'medium'
  })
}
