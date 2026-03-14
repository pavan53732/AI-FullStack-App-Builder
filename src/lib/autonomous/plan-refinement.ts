/**
 * Plan Refinement Loop Engine
 * 
 * Iteratively refines plans through:
 * - Multi-pass refinement cycles
 * - Feedback integration
 * - Quality scoring at each iteration
 * - Convergence detection
 * - Adaptive refinement strategies
 */

import ZAI from 'z-ai-web-dev-sdk'

// Types
export interface Plan {
  id: string
  version: number
  description: string
  goals: PlanGoal[]
  steps: PlanStep[]
  constraints: PlanConstraint[]
  resources: ResourceAllocation[]
  timeline: Timeline
  dependencies: Dependency[]
  metadata: PlanMetadata
}

export interface PlanGoal {
  id: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  measurable: boolean
  successCriteria: string[]
  weight: number // 0-1
}

export interface PlanStep {
  id: string
  order: number
  description: string
  type: StepType
  estimatedDuration: number // milliseconds
  dependencies: string[] // step IDs
  resources: string[]
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped'
  outputs: string[]
  risks: string[]
  alternatives: string[] // alternative step IDs
}

export type StepType = 
  | 'analysis'
  | 'design'
  | 'implementation'
  | 'testing'
  | 'deployment'
  | 'review'
  | 'integration'
  | 'optimization'

export interface PlanConstraint {
  id: string
  type: 'time' | 'resource' | 'quality' | 'dependency' | 'technical'
  description: string
  value: any
  hard: boolean // hard vs soft constraint
  penalty: number // penalty for violating soft constraint
}

export interface ResourceAllocation {
  id: string
  type: string
  amount: number
  unit: string
  allocated: boolean
  constraints: string[]
}

export interface Timeline {
  startTime: string | null
  estimatedEndTime: string | null
  actualEndTime: string | null
  milestones: Milestone[]
  buffer: number // percentage buffer
}

export interface Milestone {
  id: string
  name: string
  targetDate: string
  steps: string[] // step IDs
  status: 'pending' | 'reached' | 'missed'
}

export interface Dependency {
  from: string // step or goal ID
  to: string
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish'
  lag: number // time offset in ms
}

export interface PlanMetadata {
  createdAt: string
  updatedAt: string
  createdBy: string
  iterationCount: number
  lastRefinementType: string | null
  qualityScore: number
  confidenceLevel: number
  tags: string[]
}

export interface RefinementContext {
  feedback?: RefinementFeedback[]
  previousIterations?: PlanIteration[]
  constraints?: PlanConstraint[]
  availableResources?: ResourceAllocation[]
  timeLimit?: number
  qualityTarget?: number
  maxIterations?: number
}

export interface RefinementFeedback {
  source: 'user' | 'system' | 'agent' | 'validation'
  type: 'positive' | 'negative' | 'neutral' | 'suggestion'
  aspect: FeedbackAspect
  message: string
  severity: 'critical' | 'major' | 'minor' | 'suggestion'
  actionable: boolean
  suggestedAction?: string
}

export type FeedbackAspect = 
  | 'completeness'
  | 'feasibility'
  | 'clarity'
  | 'priority'
  | 'timeline'
  | 'resources'
  | 'risks'
  | 'dependencies'
  | 'quality'

export interface PlanIteration {
  version: number
  plan: Plan
  score: PlanScore
  refinements: RefinementAction[]
  timestamp: string
}

export interface PlanScore {
  overall: number // 0-1
  completeness: number
  feasibility: number
  clarity: number
  efficiency: number
  robustness: number
  alignment: number // alignment with goals
  details: ScoreDetail[]
}

export interface ScoreDetail {
  aspect: string
  score: number
  weight: number
  reasoning: string
  improvement: string | null
}

export interface RefinementAction {
  type: RefinementType
  description: string
  target: string // what was changed
  before: any
  after: any
  reason: string
  impact: 'positive' | 'negative' | 'neutral'
  estimatedImprovement: number
}

export type RefinementType =
  | 'add_step'
  | 'remove_step'
  | 'reorder_steps'
  | 'modify_step'
  | 'add_constraint'
  | 'relax_constraint'
  | 'adjust_timeline'
  | 'add_resource'
  | 'remove_resource'
  | 'add_dependency'
  | 'remove_dependency'
  | 'add_alternative'
  | 'split_step'
  | 'merge_steps'
  | 'add_goal'
  | 'modify_goal'
  | 'add_milestone'
  | 'risk_mitigation'

export interface RefinementResult {
  success: boolean
  originalPlan: Plan
  refinedPlan: Plan
  iterations: PlanIteration[]
  finalScore: PlanScore
  refinements: RefinementAction[]
  convergence: ConvergenceStatus
  recommendations: string[]
}

export interface ConvergenceStatus {
  converged: boolean
  iterationsToConverge: number
  scoreImprovement: number
  stabilityScore: number // how stable the plan is
  remainingIssues: string[]
}

/**
 * Plan Refinement Loop Engine
 */
export class PlanRefinementLoop {
  private zai: any = null
  private refinementHistory: Map<string, PlanIteration[]> = new Map()
  private qualityThreshold: number = 0.8
  private maxIterations: number = 10
  private convergenceThreshold: number = 0.02

  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
  }

  /**
   * Refine a plan iteratively until quality target is met
   */
  async refinePlan(
    plan: Plan,
    context: RefinementContext = {}
  ): Promise<RefinementResult> {
    const maxIters = context.maxIterations || this.maxIterations
    const qualityTarget = context.qualityTarget || this.qualityThreshold
    
    const iterations: PlanIteration[] = []
    let currentPlan = this.clonePlan(plan)
    let previousScore: PlanScore | null = null
    let converged = false

    for (let i = 0; i < maxIters; i++) {
      // Score current plan
      const score = await this.scorePlan(currentPlan, context)
      
      // Check for convergence
      if (previousScore && this.isConverged(score, previousScore)) {
        converged = true
        break
      }

      // Check if target reached
      if (score.overall >= qualityTarget) {
        converged = true
        break
      }

      // Identify refinements
      const refinements = await this.identifyRefinements(
        currentPlan,
        score,
        context
      )

      if (refinements.length === 0) {
        // No more improvements possible
        break
      }

      // Apply refinements
      const refinedPlan = this.applyRefinements(currentPlan, refinements)
      refinedPlan.version = i + 2
      refinedPlan.metadata.iterationCount = i + 1
      refinedPlan.metadata.updatedAt = new Date().toISOString()

      // Store iteration
      const iteration: PlanIteration = {
        version: i + 1,
        plan: currentPlan,
        score,
        refinements,
        timestamp: new Date().toISOString()
      }
      iterations.push(iteration)

      previousScore = score
      currentPlan = refinedPlan
    }

    // Final score
    const finalScore = await this.scorePlan(currentPlan, context)

    // Calculate convergence status
    const convergence = this.calculateConvergenceStatus(
      iterations,
      finalScore.overall - plan.metadata.qualityScore
    )

    // Generate recommendations
    const recommendations = this.generateRecommendations(currentPlan, finalScore)

    return {
      success: finalScore.overall >= qualityTarget,
      originalPlan: plan,
      refinedPlan: currentPlan,
      iterations,
      finalScore,
      refinements: iterations.flatMap(i => i.refinements),
      convergence,
      recommendations
    }
  }

  /**
   * Score a plan comprehensively
   */
  async scorePlan(
    plan: Plan,
    context: RefinementContext
  ): Promise<PlanScore> {
    const details: ScoreDetail[] = []

    // Score completeness
    const completeness = this.scoreCompleteness(plan)
    details.push({
      aspect: 'completeness',
      score: completeness,
      weight: 0.2,
      reasoning: `Plan has ${plan.steps.length} steps and ${plan.goals.length} goals`,
      improvement: completeness < 0.8 ? 'Add missing steps or goals' : null
    })

    // Score feasibility
    const feasibility = this.scoreFeasibility(plan, context)
    details.push({
      aspect: 'feasibility',
      score: feasibility,
      weight: 0.2,
      reasoning: `Resource and constraint satisfaction analysis`,
      improvement: feasibility < 0.8 ? 'Address resource constraints' : null
    })

    // Score clarity
    const clarity = this.scoreClarity(plan)
    details.push({
      aspect: 'clarity',
      score: clarity,
      weight: 0.15,
      reasoning: `Step descriptions and dependencies clarity`,
      improvement: clarity < 0.8 ? 'Improve step descriptions' : null
    })

    // Score efficiency
    const efficiency = this.scoreEfficiency(plan)
    details.push({
      aspect: 'efficiency',
      score: efficiency,
      weight: 0.15,
      reasoning: `Timeline and resource utilization`,
      improvement: efficiency < 0.8 ? 'Optimize step ordering' : null
    })

    // Score robustness
    const robustness = this.scoreRobustness(plan)
    details.push({
      aspect: 'robustness',
      score: robustness,
      weight: 0.15,
      reasoning: `Risk mitigation and alternatives`,
      improvement: robustness < 0.8 ? 'Add risk mitigations' : null
    })

    // Score goal alignment
    const alignment = this.scoreGoalAlignment(plan)
    details.push({
      aspect: 'alignment',
      score: alignment,
      weight: 0.15,
      reasoning: `Step-goal alignment analysis`,
      improvement: alignment < 0.8 ? 'Better align steps with goals' : null
    })

    // Calculate overall score
    const overall = details.reduce((sum, d) => sum + d.score * d.weight, 0)

    return {
      overall,
      completeness,
      feasibility,
      clarity,
      efficiency,
      robustness,
      alignment,
      details
    }
  }

  /**
   * Identify refinements to improve the plan
   */
  private async identifyRefinements(
    plan: Plan,
    score: PlanScore,
    context: RefinementContext
  ): Promise<RefinementAction[]> {
    const refinements: RefinementAction[] = []

    // Check feedback for actionable items
    if (context.feedback) {
      for (const fb of context.feedback) {
        if (fb.actionable && fb.suggestedAction) {
          const action = this.feedbackToAction(fb, plan)
          if (action) {
            refinements.push(action)
          }
        }
      }
    }

    // Completeness improvements
    if (score.completeness < 0.8) {
      const missingSteps = this.identifyMissingSteps(plan)
      for (const step of missingSteps) {
        refinements.push({
          type: 'add_step',
          description: `Add missing step: ${step.description}`,
          target: 'steps',
          before: null,
          after: step,
          reason: 'Improve plan completeness',
          impact: 'positive',
          estimatedImprovement: 0.1
        })
      }
    }

    // Feasibility improvements
    if (score.feasibility < 0.8) {
      const constraintIssues = this.identifyConstraintIssues(plan)
      for (const issue of constraintIssues) {
        if (issue.relaxable) {
          refinements.push({
            type: 'relax_constraint',
            description: `Relax constraint: ${issue.constraintId}`,
            target: issue.constraintId,
            before: issue.currentValue,
            after: issue.suggestedValue,
            reason: 'Improve plan feasibility',
            impact: 'positive',
            estimatedImprovement: 0.08
          })
        }
      }
    }

    // Efficiency improvements
    if (score.efficiency < 0.8) {
      const reorderings = this.suggestReorderings(plan)
      for (const reorder of reorderings) {
        refinements.push({
          type: 'reorder_steps',
          description: reorder.description,
          target: 'steps',
          before: reorder.before,
          after: reorder.after,
          reason: 'Improve parallel execution',
          impact: 'positive',
          estimatedImprovement: 0.05
        })
      }
    }

    // Robustness improvements
    if (score.robustness < 0.8) {
      const mitigations = this.suggestRiskMitigations(plan)
      for (const mitigation of mitigations) {
        refinements.push({
          type: 'risk_mitigation',
          description: mitigation.description,
          target: mitigation.stepId,
          before: null,
          after: mitigation.mitigation,
          reason: 'Reduce risk',
          impact: 'positive',
          estimatedImprovement: 0.07
        })
      }

      // Add alternatives for high-risk steps
      const highRiskSteps = plan.steps.filter(s => s.risks.length > 2)
      for (const step of highRiskSteps) {
        if (step.alternatives.length === 0) {
          refinements.push({
            type: 'add_alternative',
            description: `Add alternative for high-risk step: ${step.id}`,
            target: step.id,
            before: [],
            after: ['alt_' + step.id],
            reason: 'Improve robustness',
            impact: 'positive',
            estimatedImprovement: 0.05
          })
        }
      }
    }

    // Clarity improvements
    if (score.clarity < 0.8) {
      const unclearSteps = this.identifyUnclearSteps(plan)
      for (const step of unclearSteps) {
        refinements.push({
          type: 'modify_step',
          description: `Clarify step description: ${step.id}`,
          target: step.id,
          before: step.description,
          after: step.description + ' [clarified]',
          reason: 'Improve clarity',
          impact: 'positive',
          estimatedImprovement: 0.03
        })
      }
    }

    // Sort by estimated improvement
    refinements.sort((a, b) => b.estimatedImprovement - a.estimatedImprovement)

    // Limit number of refinements per iteration
    return refinements.slice(0, 5)
  }

  /**
   * Apply refinements to a plan
   */
  private applyRefinements(
    plan: Plan,
    refinements: RefinementAction[]
  ): Plan {
    const refined = this.clonePlan(plan)

    for (const refinement of refinements) {
      switch (refinement.type) {
        case 'add_step':
          if (refinement.after) {
            refined.steps.push(refinement.after as PlanStep)
          }
          break

        case 'remove_step':
          refined.steps = refined.steps.filter(s => s.id !== refinement.target)
          break

        case 'reorder_steps':
          if (refinement.after) {
            refined.steps = refinement.after as PlanStep[]
          }
          break

        case 'modify_step':
          const stepToModify = refined.steps.find(s => s.id === refinement.target)
          if (stepToModify && refinement.after) {
            stepToModify.description = refinement.after as string
          }
          break

        case 'add_constraint':
          if (refinement.after) {
            refined.constraints.push(refinement.after as PlanConstraint)
          }
          break

        case 'relax_constraint':
          const constraintToRelax = refined.constraints.find(c => c.id === refinement.target)
          if (constraintToRelax && refinement.after !== undefined) {
            constraintToRelax.value = refinement.after
          }
          break

        case 'adjust_timeline':
          if (refinement.after) {
            refined.timeline = refinement.after as Timeline
          }
          break

        case 'add_alternative':
          const stepForAlt = refined.steps.find(s => s.id === refinement.target)
          if (stepForAlt && Array.isArray(refinement.after)) {
            stepForAlt.alternatives = refinement.after
          }
          break

        case 'split_step':
          const stepToSplit = refined.steps.find(s => s.id === refinement.target)
          if (stepToSplit && Array.isArray(refinement.after)) {
            const idx = refined.steps.indexOf(stepToSplit)
            refined.steps.splice(idx, 1, ...(refinement.after as PlanStep[]))
          }
          break

        case 'merge_steps':
          if (Array.isArray(refinement.target) && refinement.after) {
            const idsToMerge = refinement.target
            refined.steps = refined.steps.filter(s => !idsToMerge.includes(s.id))
            refined.steps.push(refinement.after as PlanStep)
          }
          break

        case 'risk_mitigation':
          const stepForRisk = refined.steps.find(s => s.id === refinement.target)
          if (stepForRisk) {
            stepForRisk.risks.push(refinement.after as string)
          }
          break

        default:
          break
      }
    }

    // Update metadata
    refined.metadata.updatedAt = new Date().toISOString()
    refined.metadata.lastRefinementType = refinements[0]?.type || null

    return refined
  }

  /**
   * Score completeness
   */
  private scoreCompleteness(plan: Plan): number {
    let score = 1.0

    // Check if all goals have corresponding steps
    for (const goal of plan.goals) {
      const hasSteps = plan.steps.some(s => 
        s.description.toLowerCase().includes(goal.description.toLowerCase().slice(0, 20))
      )
      if (!hasSteps) {
        score -= 0.15
      }
    }

    // Check for missing standard phases
    const hasImplementation = plan.steps.some(s => s.type === 'implementation')
    const hasTesting = plan.steps.some(s => s.type === 'testing')
    const hasReview = plan.steps.some(s => s.type === 'review')

    if (!hasImplementation) score -= 0.2
    if (!hasTesting) score -= 0.15
    if (!hasReview) score -= 0.1

    return Math.max(0, score)
  }

  /**
   * Score feasibility
   */
  private scoreFeasibility(plan: Plan, context: RefinementContext): number {
    let score = 1.0

    // Check resource availability
    for (const resource of plan.resources) {
      const available = context.availableResources?.find(
        r => r.type === resource.type && r.amount >= resource.amount
      )
      if (!available && !resource.allocated) {
        score -= 0.1
      }
    }

    // Check timeline feasibility
    const totalEstimated = plan.steps.reduce((sum, s) => sum + s.estimatedDuration, 0)
    const timeline = plan.timeline
    
    if (timeline.estimatedEndTime && timeline.startTime) {
      const availableTime = new Date(timeline.estimatedEndTime).getTime() - 
                           new Date(timeline.startTime).getTime()
      if (totalEstimated > availableTime * (1 + timeline.buffer / 100)) {
        score -= 0.2
      }
    }

    // Check dependency cycles
    if (this.hasDependencyCycles(plan)) {
      score -= 0.3
    }

    return Math.max(0, score)
  }

  /**
   * Score clarity
   */
  private scoreClarity(plan: Plan): number {
    let score = 1.0

    // Check step descriptions
    for (const step of plan.steps) {
      if (step.description.length < 20) {
        score -= 0.05
      }
      if (step.dependencies.length === 0 && step.order > 1) {
        // Steps without dependencies might be unclear
        score -= 0.02
      }
    }

    // Check goal descriptions
    for (const goal of plan.goals) {
      if (goal.successCriteria.length === 0) {
        score -= 0.05
      }
    }

    return Math.max(0, score)
  }

  /**
   * Score efficiency
   */
  private scoreEfficiency(plan: Plan): number {
    let score = 1.0

    // Check for parallel execution opportunities
    const sequentialRatio = this.calculateSequentialRatio(plan)
    if (sequentialRatio > 0.8) {
      score -= 0.2
    }

    // Check for redundant steps
    const redundancy = this.calculateRedundancy(plan)
    score -= redundancy * 0.3

    // Check resource utilization
    const utilization = this.calculateResourceUtilization(plan)
    if (utilization < 0.5) {
      score -= 0.1
    }

    return Math.max(0, score)
  }

  /**
   * Score robustness
   */
  private scoreRobustness(plan: Plan): number {
    let score = 1.0

    // Check for risk coverage
    const totalRisks = plan.steps.reduce((sum, s) => sum + s.risks.length, 0)
    const alternatives = plan.steps.filter(s => s.alternatives.length > 0).length

    if (totalRisks === 0) {
      // No risks identified might indicate poor analysis
      score -= 0.1
    }

    if (alternatives < plan.steps.length * 0.3) {
      score -= 0.15
    }

    // Check constraint handling
    const softConstraints = plan.constraints.filter(c => !c.hard).length
    if (softConstraints < plan.constraints.length * 0.5) {
      score -= 0.1
    }

    return Math.max(0, score)
  }

  /**
   * Score goal alignment
   */
  private scoreGoalAlignment(plan: Plan): number {
    let totalAlignment = 0

    for (const goal of plan.goals) {
      const relevantSteps = plan.steps.filter(s =>
        s.description.toLowerCase().includes(goal.description.toLowerCase().slice(0, 15)) ||
        s.outputs.some(o => goal.successCriteria.some(c => c.toLowerCase().includes(o.toLowerCase())))
      )

      const alignment = relevantSteps.length > 0 ? 1 : 0.3
      totalAlignment += alignment * goal.weight
    }

    const weightSum = plan.goals.reduce((sum, g) => sum + g.weight, 0)
    return weightSum > 0 ? totalAlignment / weightSum : 0.5
  }

  /**
   * Helper methods
   */
  private clonePlan(plan: Plan): Plan {
    return JSON.parse(JSON.stringify(plan))
  }

  private isConverged(current: PlanScore, previous: PlanScore): boolean {
    const improvement = Math.abs(current.overall - previous.overall)
    return improvement < this.convergenceThreshold
  }

  private calculateConvergenceStatus(
    iterations: PlanIteration[],
    scoreImprovement: number
  ): ConvergenceStatus {
    const lastThree = iterations.slice(-3)
    const stabilityScore = lastThree.length >= 2
      ? 1 - Math.abs(
          lastThree[lastThree.length - 1].score.overall - 
          lastThree[0].score.overall
        )
      : 1

    return {
      converged: iterations.length > 0 && stabilityScore > 0.9,
      iterationsToConverge: iterations.length,
      scoreImprovement,
      stabilityScore,
      remainingIssues: this.identifyRemainingIssues(
        iterations[iterations.length - 1]?.score
      )
    }
  }

  private identifyRemainingIssues(score?: PlanScore): string[] {
    if (!score) return ['No score available']

    const issues: string[] = []
    if (score.completeness < 0.8) issues.push('Plan completeness needs improvement')
    if (score.feasibility < 0.8) issues.push('Feasibility concerns remain')
    if (score.clarity < 0.8) issues.push('Some steps need clarification')
    if (score.efficiency < 0.8) issues.push('Efficiency can be improved')
    if (score.robustness < 0.8) issues.push('Risk mitigation needed')
    return issues
  }

  private generateRecommendations(plan: Plan, score: PlanScore): string[] {
    const recommendations: string[] = []

    if (score.completeness < 0.8) {
      recommendations.push('Add missing implementation steps')
    }
    if (score.feasibility < 0.8) {
      recommendations.push('Review resource constraints')
    }
    if (score.efficiency < 0.8) {
      recommendations.push('Consider parallel execution')
    }
    if (score.robustness < 0.8) {
      recommendations.push('Add risk mitigation strategies')
    }

    return recommendations
  }

  private identifyMissingSteps(plan: Plan): PlanStep[] {
    const missing: PlanStep[] = []

    // Check for standard missing phases
    if (!plan.steps.some(s => s.type === 'testing')) {
      missing.push({
        id: 'auto_test',
        order: plan.steps.length + 1,
        description: 'Automated testing phase',
        type: 'testing',
        estimatedDuration: 30000,
        dependencies: [plan.steps[plan.steps.length - 1]?.id || ''],
        resources: [],
        status: 'pending',
        outputs: ['test_results'],
        risks: ['Test failures'],
        alternatives: []
      })
    }

    return missing
  }

  private identifyConstraintIssues(plan: Plan): { constraintId: string; currentValue: any; suggestedValue: any; relaxable: boolean }[] {
    const issues: { constraintId: string; currentValue: any; suggestedValue: any; relaxable: boolean }[] = []

    for (const constraint of plan.constraints) {
      if (!constraint.hard && constraint.type === 'time') {
        issues.push({
          constraintId: constraint.id,
          currentValue: constraint.value,
          suggestedValue: constraint.value * 1.2,
          relaxable: true
        })
      }
    }

    return issues
  }

  private suggestReorderings(plan: Plan): { description: string; before: number[]; after: number[] }[] {
    // Simple reorder suggestion: identify steps that can be parallelized
    const reorderings: { description: string; before: number[]; after: number[] }[] = []

    for (let i = 0; i < plan.steps.length - 1; i++) {
      const step = plan.steps[i]
      const nextStep = plan.steps[i + 1]

      if (!nextStep.dependencies.includes(step.id)) {
        reorderings.push({
          description: `Steps ${i + 1} and ${i + 2} can be parallelized`,
          before: [i, i + 1],
          after: [i + 1, i]
        })
      }
    }

    return reorderings.slice(0, 2)
  }

  private suggestRiskMitigations(plan: Plan): { stepId: string; description: string; mitigation: string }[] {
    const mitigations: { stepId: string; description: string; mitigation: string }[] = []

    for (const step of plan.steps) {
      if (step.risks.length > 1 && step.alternatives.length === 0) {
        mitigations.push({
          stepId: step.id,
          description: `Add mitigation for step ${step.id}`,
          mitigation: 'Implement fallback strategy'
        })
      }
    }

    return mitigations
  }

  private identifyUnclearSteps(plan: Plan): PlanStep[] {
    return plan.steps.filter(s => 
      s.description.length < 30 || 
      !s.description.includes(' ') ||
      s.dependencies.length === 0 && s.order > 1
    )
  }

  private feedbackToAction(feedback: RefinementFeedback, plan: Plan): RefinementAction | null {
    if (!feedback.actionable || !feedback.suggestedAction) return null

    return {
      type: 'modify_step',
      description: feedback.suggestedAction,
      target: 'plan',
      before: null,
      after: feedback.suggestedAction,
      reason: feedback.message,
      impact: feedback.type === 'positive' ? 'positive' : 'neutral',
      estimatedImprovement: feedback.severity === 'critical' ? 0.2 : 0.1
    }
  }

  private hasDependencyCycles(plan: Plan): boolean {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const hasCycle = (stepId: string): boolean => {
      visited.add(stepId)
      recursionStack.add(stepId)

      const step = plan.steps.find(s => s.id === stepId)
      if (step) {
        for (const dep of step.dependencies) {
          if (!visited.has(dep)) {
            if (hasCycle(dep)) return true
          } else if (recursionStack.has(dep)) {
            return true
          }
        }
      }

      recursionStack.delete(stepId)
      return false
    }

    for (const step of plan.steps) {
      if (!visited.has(step.id)) {
        if (hasCycle(step.id)) return true
      }
    }

    return false
  }

  private calculateSequentialRatio(plan: Plan): number {
    let sequentialCount = 0
    for (let i = 1; i < plan.steps.length; i++) {
      if (plan.steps[i].dependencies.includes(plan.steps[i - 1].id)) {
        sequentialCount++
      }
    }
    return plan.steps.length > 1 ? sequentialCount / (plan.steps.length - 1) : 1
  }

  private calculateRedundancy(plan: Plan): number {
    const descriptions = plan.steps.map(s => s.description.toLowerCase())
    const unique = new Set(descriptions)
    return 1 - unique.size / descriptions.length
  }

  private calculateResourceUtilization(plan: Plan): number {
    const totalResources = plan.resources.length
    const allocatedResources = plan.resources.filter(r => r.allocated).length
    return totalResources > 0 ? allocatedResources / totalResources : 1
  }

  /**
   * Get refinement history for a plan
   */
  getRefinementHistory(planId: string): PlanIteration[] {
    return this.refinementHistory.get(planId) || []
  }

  /**
   * Set quality threshold
   */
  setQualityThreshold(threshold: number): void {
    this.qualityThreshold = threshold
  }

  /**
   * Set max iterations
   */
  setMaxIterations(max: number): void {
    this.maxIterations = max
  }
}

// Singleton instance
let refinementInstance: PlanRefinementLoop | null = null

export async function getPlanRefinementLoop(): Promise<PlanRefinementLoop> {
  if (!refinementInstance) {
    refinementInstance = new PlanRefinementLoop()
    await refinementInstance.initialize()
  }
  return refinementInstance
}

// Export types
export type {
  Plan,
  PlanGoal,
  PlanStep,
  StepType,
  PlanConstraint,
  ResourceAllocation,
  Timeline,
  Milestone,
  Dependency,
  PlanMetadata,
  RefinementContext,
  RefinementFeedback,
  FeedbackAspect,
  PlanIteration,
  PlanScore,
  ScoreDetail,
  RefinementAction,
  RefinementType,
  RefinementResult,
  ConvergenceStatus
}
