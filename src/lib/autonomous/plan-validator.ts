/**
 * Plan Validator
 * 
 * Implements Mechanisms #19-20: Iterative Planning Refinement and Plan Completeness Validator
 * 
 * Features:
 * - Iterative plan refinement with weak area identification
 * - Plan completeness validation
 * - Dependency ordering verification
 * - Resource constraint checking
 * - Time estimate validation
 * - Missing prerequisite detection
 */

import ZAI from 'z-ai-web-dev-sdk'
import { EventEmitter } from 'events'

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Represents a single step in a plan
 */
export interface PlanStep {
  /** Unique identifier for the step */
  id: string
  /** Human-readable title */
  title: string
  /** Detailed description of what the step accomplishes */
  description: string
  /** Type of the step */
  type: StepType
  /** Priority level */
  priority: 'critical' | 'high' | 'medium' | 'low'
  /** Current status */
  status: 'pending' | 'ready' | 'in_progress' | 'blocked' | 'completed' | 'failed' | 'skipped'
  /** IDs of steps that must complete before this one */
  dependencies: string[]
  /** IDs of steps that depend on this one */
  dependents: string[]
  /** Estimated time in minutes */
  estimatedDuration: number
  /** Actual time spent in minutes (if completed) */
  actualDuration?: number
  /** Complexity score 1-10 */
  complexity: number
  /** Required resources for this step */
  requiredResources: ResourceRequirement[]
  /** Required capabilities/skills */
  requiredCapabilities: string[]
  /** Files that will be created or modified */
  affectedFiles: string[]
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  /** Notes and annotations */
  notes: string[]
  /** Metadata */
  metadata: PlanStepMetadata
}

/**
 * Step type enumeration
 */
export type StepType =
  | 'setup'           // Project initialization
  | 'configure'       // Configuration changes
  | 'create'          // Create new files/components
  | 'modify'          // Modify existing code
  | 'install'         // Install dependencies
  | 'test'            // Testing activities
  | 'debug'           // Debugging
  | 'deploy'          // Deployment
  | 'document'        // Documentation
  | 'review'          // Code review
  | 'security'        // Security checks
  | 'optimize'        // Performance optimization
  | 'validate'        // Validation checks
  | 'integrate'       // Integration tasks

/**
 * Resource requirement definition
 */
export interface ResourceRequirement {
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'api' | 'database' | 'external_service'
  amount?: number
  unit?: string
  mandatory: boolean
  description?: string
}

/**
 * Plan step metadata
 */
export interface PlanStepMetadata {
  createdAt: string
  updatedAt: string
  startedAt?: string
  completedAt?: string
  retries: number
  maxRetries: number
  tags: string[]
  assignee?: string
  milestone?: string
}

/**
 * Represents a complete plan
 */
export interface Plan {
  /** Unique plan identifier */
  id: string
  /** Plan name/title */
  name: string
  /** Detailed description of the plan goal */
  description: string
  /** Version number for tracking iterations */
  version: number
  /** All steps in the plan */
  steps: PlanStep[]
  /** Defined milestones */
  milestones: PlanMilestone[]
  /** Overall priority */
  priority: 'critical' | 'high' | 'medium' | 'low'
  /** Plan status */
  status: 'draft' | 'validating' | 'ready' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  /** Total estimated duration in minutes */
  estimatedDuration: number
  /** Requirements this plan addresses */
  requirements: PlanRequirement[]
  /** Constraints on the plan */
  constraints: PlanConstraint[]
  /** Risk assessment */
  risks: PlanRisk[]
  /** Creation timestamp */
  createdAt: string
  /** Last update timestamp */
  updatedAt: string
  /** Metrics about the plan */
  metrics: PlanMetrics
  /** Plan metadata */
  metadata: PlanMetadata
}

/**
 * Milestone definition
 */
export interface PlanMilestone {
  id: string
  name: string
  description: string
  stepIds: string[]
  dependencies: string[]
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  progress: number
  targetDate?: string
  completedAt?: string
}

/**
 * Requirement that the plan must satisfy
 */
export interface PlanRequirement {
  id: string
  type: 'functional' | 'non_functional' | 'security' | 'performance' | 'compatibility'
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  coveredBySteps: string[]
  verified: boolean
}

/**
 * Constraint on the plan
 */
export interface PlanConstraint {
  id: string
  type: 'time' | 'resource' | 'technical' | 'dependency' | 'budget'
  description: string
  value?: number | string
  mandatory: boolean
  satisfied: boolean
}

/**
 * Risk assessment for the plan
 */
export interface PlanRisk {
  id: string
  type: string
  description: string
  probability: number    // 0-1
  impact: number         // 0-1
  mitigation: string
  contingencyPlan?: string
  affectedSteps: string[]
}

/**
 * Plan metrics
 */
export interface PlanMetrics {
  totalSteps: number
  completedSteps: number
  pendingSteps: number
  blockedSteps: number
  failedSteps: number
  averageStepComplexity: number
  criticalPathLength: number
  parallelizableGroups: number
  resourceUtilization: Record<string, number>
  dependencyDepth: number
  estimatedTime: number
  actualTime: number
  progress: number
  efficiency: number
}

/**
 * Plan metadata
 */
export interface PlanMetadata {
  author?: string
  tags: string[]
  parentPlanId?: string
  derivedFrom?: string[]
  notes: string[]
  revisionHistory: PlanRevision[]
}

/**
 * Revision history entry
 */
export interface PlanRevision {
  version: number
  timestamp: string
  changes: string[]
  author?: string
}

/**
 * Result of plan validation
 */
export interface ValidationResult {
  /** Whether the plan passes validation */
  valid: boolean
  /** Overall validation score 0-100 */
  score: number
  /** Completeness check results */
  completeness: CompletenessCheck
  /** Issues found during validation */
  issues: ValidationIssue[]
  /** Warnings (non-blocking issues) */
  warnings: ValidationWarning[]
  /** Suggestions for improvement */
  suggestions: RefinementSuggestion[]
  /** Dependency analysis results */
  dependencyAnalysis: DependencyAnalysisResult
  /** Resource analysis results */
  resourceAnalysis: ResourceAnalysisResult
  /** Time estimate analysis */
  timeAnalysis: TimeAnalysisResult
  /** Validation timestamp */
  validatedAt: string
}

/**
 * Completeness check result
 */
export interface CompletenessCheck {
  /** Overall completeness percentage */
  completeness: number
  /** Requirements coverage */
  requirementsCoverage: {
    total: number
    covered: number
    uncovered: string[]
    partiallyCovered: string[]
  }
  /** Prerequisites check */
  prerequisites: {
    satisfied: string[]
    missing: string[]
    partial: string[]
  }
  /** Step completeness details */
  stepCompleteness: {
    complete: string[]
    incomplete: string[]
    missingInfo: Array<{ stepId: string; missingFields: string[] }>
  }
  /** Documentation completeness */
  documentation: {
    hasDescription: boolean
    hasMilestones: boolean
    hasRiskAssessment: boolean
    hasTimeEstimates: boolean
    hasResourceRequirements: boolean
  }
  /** Critical issues that must be addressed */
  criticalGaps: string[]
}

/**
 * Validation issue (blocking)
 */
export interface ValidationIssue {
  id: string
  type: 'dependency_cycle' | 'missing_prerequisite' | 'resource_conflict' | 
        'time_constraint' | 'requirement_gap' | 'step_invalid' | 'ordering_invalid'
  severity: 'critical' | 'high' | 'medium'
  description: string
  affectedSteps: string[]
  affectedRequirements: string[]
  impact: string
  suggestedFix: string
  autoFixable: boolean
}

/**
 * Validation warning (non-blocking)
 */
export interface ValidationWarning {
  id: string
  type: 'suboptimal_ordering' | 'resource_underutilized' | 'time_estimate_uncertain' |
        'dependency_weak' | 'risk_undocumented' | 'documentation_missing'
  description: string
  affectedSteps: string[]
  recommendation: string
}

/**
 * Refinement suggestion for plan improvement
 */
export interface RefinementSuggestion {
  id: string
  type: 'add_step' | 'remove_step' | 'reorder_steps' | 'merge_steps' | 
        'split_step' | 'add_dependency' | 'remove_dependency' | 'adjust_time' |
        'add_resource' | 'adjust_priority' | 'add_milestone' | 'improve_documentation'
  priority: 'critical' | 'high' | 'medium' | 'low'
  description: string
  rationale: string
  affectedSteps: string[]
  suggestedChanges: SuggestedChange[]
  expectedImpact: {
    timeChange: number
    complexityChange: number
    riskChange: number
    completenessChange: number
  }
  autoApplicable: boolean
}

/**
 * Suggested change for refinement
 */
export interface SuggestedChange {
  action: 'add' | 'remove' | 'modify' | 'reorder'
  target: 'step' | 'dependency' | 'resource' | 'time' | 'priority' | 'milestone'
  targetId?: string
  currentValue?: any
  newValue: any
  reason: string
}

/**
 * Dependency analysis result
 */
export interface DependencyAnalysisResult {
  /** Whether there are any cycles */
  hasCycles: boolean
  /** Detected cycles */
  cycles: string[][]
  /** Critical path through the plan */
  criticalPath: string[]
  /** Steps with no dependencies (can start immediately) */
  entryPoints: string[]
  /** Steps with no dependents (final steps) */
  exitPoints: string[]
  /** Parallel execution groups */
  parallelGroups: string[][]
  /** Dependency depth for each step */
  dependencyDepth: Record<string, number>
  /** Maximum dependency depth */
  maxDepth: number
  /** Steps that could be parallelized but aren't */
  parallelizationOpportunities: string[][]
  /** Unnecessary dependencies */
  redundantDependencies: Array<{ from: string; to: string; reason: string }>
}

/**
 * Resource analysis result
 */
export interface ResourceAnalysisResult {
  /** Resource requirements summary */
  resourceSummary: Record<string, {
    total: number
    peak: number
    average: number
    conflicts: number
  }>
  /** Resource conflicts */
  conflicts: Array<{
    step1: string
    step2: string
    resource: string
    reason: string
    resolution: string
  }>
  /** Underutilized resources */
  underutilized: Array<{
    resource: string
    utilization: number
    suggestion: string
  }>
  /** Resource bottlenecks */
  bottlenecks: Array<{
    resource: string
    demandSteps: string[]
    peakDemand: number
    available: number
    deficit: number
  }>
  /** Whether resources are sufficient */
  sufficient: boolean
  /** Recommendations */
  recommendations: string[]
}

/**
 * Time analysis result
 */
export interface TimeAnalysisResult {
  /** Total estimated time */
  totalTime: number
  /** Critical path duration */
  criticalPathDuration: number
  /** Parallel time savings */
  parallelSavings: number
  /** Time distribution by type */
  timeByType: Record<StepType, number>
  /** Time distribution by priority */
  timeByPriority: Record<string, number>
  /** Time buffer analysis */
  bufferAnalysis: {
    totalTime: number
    bufferTime: number
    bufferPercentage: number
    recommended: number
    adequate: boolean
  }
  /** Time estimate confidence */
  confidence: {
    overall: number
    byStep: Record<string, number>
    uncertainSteps: string[]
  }
  /** Schedule risks */
  scheduleRisks: Array<{
    step: string
    risk: string
    probability: number
    impact: number
  }>
  /** Whether time estimates are realistic */
  realistic: boolean
  /** Recommendations */
  recommendations: string[]
}

/**
 * Refinement result
 */
export interface RefinementResult {
  /** Original plan ID */
  originalPlanId: string
  /** New plan version */
  newVersion: number
  /** Refined plan */
  refinedPlan: Plan
  /** Changes made */
  changes: RefinementChange[]
  /** Improvements achieved */
  improvements: {
    completenessImprovement: number
    timeImprovement: number
    riskReduction: number
    dependencyOptimization: number
  }
  /** Remaining issues */
  remainingIssues: ValidationIssue[]
  /** Suggestions for further refinement */
  furtherSuggestions: RefinementSuggestion[]
  /** Refinement timestamp */
  refinedAt: string
}

/**
 * Individual refinement change
 */
export interface RefinementChange {
  type: 'step_added' | 'step_removed' | 'step_modified' | 'dependency_added' | 
        'dependency_removed' | 'time_adjusted' | 'priority_changed' | 
        'resource_added' | 'milestone_added'
  description: string
  affectedStep?: string
  previousValue?: any
  newValue: any
  rationale: string
}

/**
 * Refinement options
 */
export interface RefinementOptions {
  /** Maximum number of refinement iterations */
  maxIterations?: number
  /** Target completeness percentage */
  targetCompleteness?: number
  /** Focus areas for refinement */
  focusAreas?: ('completeness' | 'time' | 'risk' | 'dependencies' | 'resources')[]
  /** Whether to auto-apply suggestions */
  autoApply?: boolean
  /** Maximum changes per iteration */
  maxChangesPerIteration?: number
  /** Preserve specific steps (don't modify) */
  preserveSteps?: string[]
  /** Time budget constraint */
  timeBudget?: number
  /** Resource constraints */
  resourceConstraints?: Record<string, number>
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /** Check for dependency cycles */
  checkDependencyCycles?: boolean
  /** Validate time estimates */
  validateTimeEstimates?: boolean
  /** Check resource constraints */
  checkResourceConstraints?: boolean
  /** Validate requirement coverage */
  validateRequirementCoverage?: boolean
  /** Maximum validation depth */
  maxDepth?: number
  /** Use AI for enhanced analysis */
  useAI?: boolean
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_STEP_DURATION = 5 // minutes
const DEFAULT_STEP_COMPLEXITY = 3
const MAX_DEPENDENCY_DEPTH = 20
const MIN_COMPLETENESS_THRESHOLD = 80

const STEP_TYPE_PRIORITIES: Record<StepType, number> = {
  setup: 1,
  install: 2,
  configure: 3,
  create: 4,
  modify: 5,
  integrate: 6,
  test: 7,
  debug: 8,
  security: 9,
  optimize: 10,
  validate: 11,
  review: 12,
  document: 13,
  deploy: 14
}

const STEP_TYPE_RISKS: Record<StepType, 'low' | 'medium' | 'high' | 'critical'> = {
  setup: 'low',
  install: 'low',
  configure: 'medium',
  create: 'medium',
  modify: 'high',
  integrate: 'high',
  test: 'low',
  debug: 'medium',
  security: 'critical',
  optimize: 'medium',
  validate: 'low',
  review: 'low',
  document: 'low',
  deploy: 'critical'
}

// ============================================================================
// Plan Validator Class
// ============================================================================

/**
 * Plan Validator
 * 
 * Validates and refines plans for completeness, feasibility, and optimization.
 * Implements iterative planning refinement (Mechanism #19) and plan completeness
 * validation (Mechanism #20).
 */
export class PlanValidator extends EventEmitter {
  private zai: any = null
  private validationCache: Map<string, ValidationResult> = new Map()
  private refinementHistory: Map<string, RefinementResult[]> = new Map()

  constructor() {
    super()
  }

  /**
   * Initialize the validator with AI capabilities
   */
  async init(): Promise<void> {
    if (!this.zai) {
      this.zai = await ZAI.create()
    }
  }

  // =========================================================================
  // Main Validation Methods
  // =========================================================================

  /**
   * Validate a plan for completeness and correctness
   * @param plan The plan to validate
   * @param options Validation options
   * @returns Validation result
   */
  async validatePlan(plan: Plan, options: ValidationOptions = {}): Promise<ValidationResult> {
    await this.init()

    const {
      checkDependencyCycles = true,
      validateTimeEstimates = true,
      checkResourceConstraints = true,
      validateRequirementCoverage = true,
      maxDepth = 10,
      useAI = true
    } = options

    const issues: ValidationIssue[] = []
    const warnings: ValidationWarning[] = []
    const suggestions: RefinementSuggestion[] = []

    // Check for cached result
    const cacheKey = `${plan.id}_${plan.version}`
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!
    }

    this.emit('validation:started', { planId: plan.id })

    // 1. Completeness Check
    const completeness = await this.checkCompleteness(plan)

    // 2. Dependency Analysis
    const dependencyAnalysis = this.analyzeDependencies(plan.steps)
    if (checkDependencyCycles && dependencyAnalysis.hasCycles) {
      for (const cycle of dependencyAnalysis.cycles) {
        issues.push({
          id: `issue_cycle_${Date.now().toString(36)}`,
          type: 'dependency_cycle',
          severity: 'critical',
          description: `Dependency cycle detected: ${cycle.join(' → ')}`,
          affectedSteps: cycle,
          affectedRequirements: [],
          impact: 'Cannot execute plan due to circular dependencies',
          suggestedFix: 'Remove or redirect dependencies to break the cycle',
          autoFixable: true
        })
      }
    }

    // 3. Resource Analysis
    const resourceAnalysis = this.analyzeResources(plan.steps)
    if (checkResourceConstraints && !resourceAnalysis.sufficient) {
      for (const bottleneck of resourceAnalysis.bottlenecks) {
        issues.push({
          id: `issue_resource_${Date.now().toString(36)}`,
          type: 'resource_conflict',
          severity: bottleneck.deficit > 50 ? 'high' : 'medium',
          description: `Resource bottleneck: ${bottleneck.resource}`,
          affectedSteps: bottleneck.demandSteps,
          affectedRequirements: [],
          impact: `Deficit of ${bottleneck.deficit} ${bottleneck.resource}`,
          suggestedFix: bottleneck.available > 0 
            ? 'Redistribute resource usage or add resources'
            : 'Add required resource before execution',
          autoFixable: false
        })
      }
    }

    // 4. Time Analysis
    const timeAnalysis = this.analyzeTime(plan.steps, plan.constraints)
    if (validateTimeEstimates && !timeAnalysis.realistic) {
      for (const risk of timeAnalysis.scheduleRisks) {
        if (risk.probability > 0.5) {
          warnings.push({
            id: `warning_time_${Date.now().toString(36)}`,
            type: 'time_estimate_uncertain',
            description: `Time estimate uncertainty for step: ${risk.step}`,
            affectedSteps: [risk.step],
            recommendation: risk.risk
          })
        }
      }
    }

    // 5. Requirement Coverage
    if (validateRequirementCoverage) {
      const coverageIssues = this.checkRequirementCoverage(plan)
      issues.push(...coverageIssues)
    }

    // 6. Check for missing prerequisites
    const prerequisiteIssues = await this.checkPrerequisites(plan)
    issues.push(...prerequisiteIssues)

    // 7. Generate refinement suggestions
    suggestions.push(...this.generateRefinementSuggestions(
      plan, 
      completeness, 
      dependencyAnalysis, 
      resourceAnalysis, 
      timeAnalysis
    ))

    // 8. AI-enhanced analysis if enabled
    if (useAI) {
      const aiSuggestions = await this.getAIValidationInsights(plan, {
        issues,
        completeness,
        dependencyAnalysis,
        resourceAnalysis,
        timeAnalysis
      })
      suggestions.push(...aiSuggestions)
    }

    // Calculate overall score
    const score = this.calculateValidationScore(
      completeness,
      issues,
      warnings,
      dependencyAnalysis,
      resourceAnalysis,
      timeAnalysis
    )

    const result: ValidationResult = {
      valid: issues.filter(i => i.severity === 'critical').length === 0 && 
             completeness.completeness >= MIN_COMPLETENESS_THRESHOLD,
      score,
      completeness,
      issues,
      warnings,
      suggestions,
      dependencyAnalysis,
      resourceAnalysis,
      timeAnalysis,
      validatedAt: new Date().toISOString()
    }

    // Cache the result
    this.validationCache.set(cacheKey, result)
    this.emit('validation:completed', { planId: plan.id, valid: result.valid, score })

    return result
  }

  /**
   * Iteratively refine a plan
   * @param plan The plan to refine
   * @param options Refinement options
   * @returns Refinement result
   */
  async refinePlan(plan: Plan, options: RefinementOptions = {}): Promise<RefinementResult> {
    await this.init()

    const {
      maxIterations = 3,
      targetCompleteness = 95,
      focusAreas = ['completeness', 'time', 'risk', 'dependencies'],
      autoApply = true,
      maxChangesPerIteration = 5,
      preserveSteps = [],
      timeBudget,
      resourceConstraints
    } = options

    this.emit('refinement:started', { planId: plan.id })

    let currentPlan = { ...plan, steps: [...plan.steps], version: plan.version }
    const allChanges: RefinementChange[] = []
    let iteration = 0
    let currentValidation = await this.validatePlan(currentPlan)

    const history: RefinementResult[] = []

    while (iteration < maxIterations) {
      iteration++
      this.emit('refinement:iteration', { planId: plan.id, iteration })

      // Check if target completeness is reached
      if (currentValidation.completeness.completeness >= targetCompleteness) {
        break
      }

      // Get prioritized suggestions for current focus areas
      const relevantSuggestions = currentValidation.suggestions
        .filter(s => this.isRelevantToFocusAreas(s, focusAreas))
        .filter(s => !s.affectedSteps.some(stepId => preserveSteps.includes(stepId)))
        .sort((a, b) => {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        })
        .slice(0, maxChangesPerIteration)

      if (relevantSuggestions.length === 0) {
        break
      }

      // Apply suggestions
      const iterationChanges: RefinementChange[] = []
      for (const suggestion of relevantSuggestions) {
        if (autoApply || suggestion.autoApplicable) {
          const { plan: updatedPlan, changes } = this.applySuggestion(currentPlan, suggestion)
          currentPlan = updatedPlan
          iterationChanges.push(...changes)
        }
      }

      if (iterationChanges.length === 0) {
        break
      }

      allChanges.push(...iterationChanges)
      currentPlan.version++
      currentPlan.updatedAt = new Date().toISOString()

      // Re-validate after changes
      currentValidation = await this.validatePlan(currentPlan)

      // Record history
      history.push({
        originalPlanId: plan.id,
        newVersion: currentPlan.version,
        refinedPlan: currentPlan,
        changes: iterationChanges,
        improvements: this.calculateImprovements(plan, currentPlan),
        remainingIssues: currentValidation.issues,
        furtherSuggestions: currentValidation.suggestions,
        refinedAt: new Date().toISOString()
      })
    }

    // Store refinement history
    if (!this.refinementHistory.has(plan.id)) {
      this.refinementHistory.set(plan.id, [])
    }
    this.refinementHistory.get(plan.id)!.push(...history)

    const result: RefinementResult = {
      originalPlanId: plan.id,
      newVersion: currentPlan.version,
      refinedPlan: currentPlan,
      changes: allChanges,
      improvements: this.calculateImprovements(plan, currentPlan),
      remainingIssues: currentValidation.issues,
      furtherSuggestions: currentValidation.suggestions,
      refinedAt: new Date().toISOString()
    }

    this.emit('refinement:completed', { 
      planId: plan.id, 
      iterations: iteration,
      improvements: result.improvements 
    })

    return result
  }

  // =========================================================================
  // Completeness Checking
  // =========================================================================

  /**
   * Check plan completeness
   */
  private async checkCompleteness(plan: Plan): Promise<CompletenessCheck> {
    const requirementsCoverage = this.checkRequirementsCoverage(plan)
    const prerequisites = this.checkPrerequisitesComplete(plan)
    const stepCompleteness = this.checkStepCompleteness(plan.steps)
    const documentation = this.checkDocumentationCompleteness(plan)
    const criticalGaps = this.identifyCriticalGaps(
      requirementsCoverage,
      prerequisites,
      stepCompleteness,
      documentation
    )

    // Calculate overall completeness score
    const scores = [
      requirementsCoverage.total > 0 
        ? (requirementsCoverage.covered / requirementsCoverage.total) * 100 
        : 100,
      prerequisites.missing.length === 0 ? 100 : 
        (prerequisites.satisfied.length / (prerequisites.satisfied.length + prerequisites.missing.length)) * 100,
      stepCompleteness.complete.length / Math.max(plan.steps.length, 1) * 100,
      Object.values(documentation).filter(Boolean).length / 5 * 100
    ]

    const completeness = scores.reduce((sum, score) => sum + score, 0) / scores.length

    return {
      completeness,
      requirementsCoverage,
      prerequisites,
      stepCompleteness,
      documentation,
      criticalGaps
    }
  }

  /**
   * Check requirements coverage
   */
  private checkRequirementsCoverage(plan: Plan): CompletenessCheck['requirementsCoverage'] {
    const covered: string[] = []
    const uncovered: string[] = []
    const partiallyCovered: string[] = []

    for (const req of plan.requirements) {
      if (req.coveredBySteps.length === 0) {
        uncovered.push(req.id)
      } else if (req.verified) {
        covered.push(req.id)
      } else {
        partiallyCovered.push(req.id)
      }
    }

    return {
      total: plan.requirements.length,
      covered: covered.length,
      uncovered,
      partiallyCovered
    }
  }

  /**
   * Check prerequisites completeness
   */
  private checkPrerequisitesComplete(plan: Plan): CompletenessCheck['prerequisites'] {
    const satisfied: string[] = []
    const missing: string[] = []
    const partial: string[] = []

    // Check each step's prerequisites
    for (const step of plan.steps) {
      if (step.dependencies.length === 0) {
        continue
      }

      for (const depId of step.dependencies) {
        const depStep = plan.steps.find(s => s.id === depId)
        if (!depStep) {
          missing.push(`${step.id} → ${depId}`)
        } else if (depStep.status === 'completed') {
          satisfied.push(`${step.id} → ${depId}`)
        } else {
          partial.push(`${step.id} → ${depId}`)
        }
      }
    }

    return { satisfied, missing, partial }
  }

  /**
   * Check individual step completeness
   */
  private checkStepCompleteness(steps: PlanStep[]): CompletenessCheck['stepCompleteness'] {
    const complete: string[] = []
    const incomplete: string[] = []
    const missingInfo: Array<{ stepId: string; missingFields: string[] }> = []

    const requiredFields: (keyof PlanStep)[] = [
      'title', 'description', 'type', 'priority', 
      'dependencies', 'estimatedDuration', 'complexity'
    ]

    for (const step of steps) {
      const missing: string[] = []
      
      for (const field of requiredFields) {
        const value = step[field]
        if (value === undefined || value === null || 
            (Array.isArray(value) && value.length === 0 && field !== 'dependencies') ||
            (typeof value === 'string' && value.trim() === '')) {
          missing.push(field)
        }
      }

      if (missing.length === 0) {
        complete.push(step.id)
      } else {
        incomplete.push(step.id)
        missingInfo.push({ stepId: step.id, missingFields: missing })
      }
    }

    return { complete, incomplete, missingInfo }
  }

  /**
   * Check documentation completeness
   */
  private checkDocumentationCompleteness(plan: Plan): CompletenessCheck['documentation'] {
    return {
      hasDescription: !!plan.description && plan.description.length > 10,
      hasMilestones: plan.milestones.length > 0,
      hasRiskAssessment: plan.risks.length > 0,
      hasTimeEstimates: plan.steps.every(s => s.estimatedDuration > 0),
      hasResourceRequirements: plan.steps.some(s => s.requiredResources.length > 0)
    }
  }

  /**
   * Identify critical gaps
   */
  private identifyCriticalGaps(
    requirementsCoverage: CompletenessCheck['requirementsCoverage'],
    prerequisites: CompletenessCheck['prerequisites'],
    stepCompleteness: CompletenessCheck['stepCompleteness'],
    documentation: CompletenessCheck['documentation']
  ): string[] {
    const gaps: string[] = []

    if (requirementsCoverage.uncovered.length > 0) {
      gaps.push(`${requirementsCoverage.uncovered.length} requirements not covered by any step`)
    }

    if (prerequisites.missing.length > 0) {
      gaps.push(`${prerequisites.missing.length} prerequisite dependencies are missing`)
    }

    if (stepCompleteness.incomplete.length > stepCompleteness.complete.length * 0.5) {
      gaps.push('More than 50% of steps are incomplete')
    }

    if (!documentation.hasDescription) {
      gaps.push('Plan lacks a meaningful description')
    }

    if (!documentation.hasTimeEstimates) {
      gaps.push('Steps missing time estimates')
    }

    return gaps
  }

  // =========================================================================
  // Dependency Analysis
  // =========================================================================

  /**
   * Analyze step dependencies
   */
  private analyzeDependencies(steps: PlanStep[]): DependencyAnalysisResult {
    const stepMap = new Map(steps.map(s => [s.id, s]))
    
    // Detect cycles using DFS
    const cycles = this.detectDependencyCycles(steps)
    
    // Calculate critical path
    const criticalPath = this.calculateCriticalPath(steps)
    
    // Find entry and exit points
    const entryPoints = steps.filter(s => s.dependencies.length === 0).map(s => s.id)
    const exitPoints = steps.filter(s => s.dependents.length === 0).map(s => s.id)
    
    // Calculate dependency depth
    const dependencyDepth = this.calculateDependencyDepth(steps)
    const maxDepth = Math.max(...Object.values(dependencyDepth), 0)
    
    // Find parallel groups
    const parallelGroups = this.findParallelGroups(steps)
    
    // Find parallelization opportunities
    const parallelizationOpportunities = this.findParallelizationOpportunities(steps, parallelGroups)
    
    // Find redundant dependencies
    const redundantDependencies = this.findRedundantDependencies(steps)

    return {
      hasCycles: cycles.length > 0,
      cycles,
      criticalPath,
      entryPoints,
      exitPoints,
      parallelGroups,
      dependencyDepth,
      maxDepth,
      parallelizationOpportunities,
      redundantDependencies
    }
  }

  /**
   * Detect dependency cycles
   */
  private detectDependencyCycles(steps: PlanStep[]): string[][] {
    const cycles: string[][] = []
    const stepMap = new Map(steps.map(s => [s.id, s]))
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const dfs = (stepId: string, path: string[]): boolean => {
      if (recursionStack.has(stepId)) {
        // Found a cycle
        const cycleStart = path.indexOf(stepId)
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), stepId])
        }
        return true
      }

      if (visited.has(stepId)) {
        return false
      }

      visited.add(stepId)
      recursionStack.add(stepId)
      path.push(stepId)

      const step = stepMap.get(stepId)
      if (step) {
        for (const depId of step.dependencies) {
          dfs(depId, [...path])
        }
      }

      recursionStack.delete(stepId)
      return false
    }

    for (const step of steps) {
      if (!visited.has(step.id)) {
        dfs(step.id, [])
      }
    }

    return cycles
  }

  /**
   * Calculate critical path
   */
  private calculateCriticalPath(steps: PlanStep[]): string[] {
    const stepMap = new Map(steps.map(s => [s.id, s]))
    const longestPath = new Map<string, { length: number; path: string[] }>()

    const getLongestPath = (stepId: string): { length: number; path: string[] } => {
      if (longestPath.has(stepId)) {
        return longestPath.get(stepId)!
      }

      const step = stepMap.get(stepId)
      if (!step) {
        return { length: 0, path: [] }
      }

      let maxLength = step.estimatedDuration
      let maxPath: string[] = [stepId]

      for (const depId of step.dependencies) {
        const depPath = getLongestPath(depId)
        if (depPath.length + step.estimatedDuration > maxLength) {
          maxLength = depPath.length + step.estimatedDuration
          maxPath = [...depPath.path, stepId]
        }
      }

      const result = { length: maxLength, path: maxPath }
      longestPath.set(stepId, result)
      return result
    }

    // Find longest path from any exit point
    const exitPoints = steps.filter(s => s.dependents.length === 0)
    let criticalPath: string[] = []
    let maxLength = 0

    for (const exit of exitPoints) {
      const path = getLongestPath(exit.id)
      if (path.length > maxLength) {
        maxLength = path.length
        criticalPath = path.path
      }
    }

    return criticalPath
  }

  /**
   * Calculate dependency depth for each step
   */
  private calculateDependencyDepth(steps: PlanStep[]): Record<string, number> {
    const depth: Record<string, number> = {}
    const stepMap = new Map(steps.map(s => [s.id, s]))

    const getDepth = (stepId: string): number => {
      if (depth[stepId] !== undefined) {
        return depth[stepId]
      }

      const step = stepMap.get(stepId)
      if (!step || step.dependencies.length === 0) {
        depth[stepId] = 0
        return 0
      }

      const maxDepDepth = Math.max(
        ...step.dependencies.map(depId => getDepth(depId))
      )
      depth[stepId] = maxDepDepth + 1
      return depth[stepId]
    }

    for (const step of steps) {
      getDepth(step.id)
    }

    return depth
  }

  /**
   * Find groups of steps that can be executed in parallel
   */
  private findParallelGroups(steps: PlanStep[]): string[][] {
    const groups: string[][] = []
    const depth = this.calculateDependencyDepth(steps)
    const depthGroups = new Map<number, string[]>()

    for (const step of steps) {
      const d = depth[step.id] || 0
      if (!depthGroups.has(d)) {
        depthGroups.set(d, [])
      }
      depthGroups.get(d)!.push(step.id)
    }

    Array.from(depthGroups.values()).forEach(group => {
      if (group.length > 1) {
        groups.push(group)
      }
    })

    return groups
  }

  /**
   * Find parallelization opportunities
   */
  private findParallelizationOpportunities(
    steps: PlanStep[], 
    parallelGroups: string[][]
  ): string[][] {
    const opportunities: string[][] = []
    const stepMap = new Map(steps.map(s => [s.id, s]))

    // Find sequential steps that could be parallel
    for (const step of steps) {
      if (step.dependencies.length === 1) {
        const depId = step.dependencies[0]
        const depStep = stepMap.get(depId)
        
        if (depStep && depStep.dependents.length === 1) {
          // This step only depends on one step, and that step only has one dependent
          // They could potentially be merged or parallelized
          opportunities.push([depId, step.id])
        }
      }
    }

    return opportunities
  }

  /**
   * Find redundant dependencies
   */
  private findRedundantDependencies(steps: PlanStep[]): Array<{ from: string; to: string; reason: string }> {
    const redundant: Array<{ from: string; to: string; reason: string }> = []
    const stepMap = new Map(steps.map(s => [s.id, s]))

    for (const step of steps) {
      const transitiveDeps = new Set<string>()
      
      // Get all transitive dependencies
      const collectTransitive = (depId: string, visited: Set<string>) => {
        if (visited.has(depId)) return
        visited.add(depId)
        
        const dep = stepMap.get(depId)
        if (dep) {
          for (const d of dep.dependencies) {
            transitiveDeps.add(d)
            collectTransitive(d, visited)
          }
        }
      }

      for (const depId of step.dependencies) {
        collectTransitive(depId, new Set())
      }

      // Check if any direct dependency is already transitively covered
      for (const depId of step.dependencies) {
        if (transitiveDeps.has(depId)) {
          redundant.push({
            from: step.id,
            to: depId,
            reason: 'Dependency is already transitively satisfied'
          })
        }
      }
    }

    return redundant
  }

  // =========================================================================
  // Resource Analysis
  // =========================================================================

  /**
   * Analyze resource requirements and constraints
   */
  private analyzeResources(steps: PlanStep[]): ResourceAnalysisResult {
    const resourceSummary: Record<string, { total: number; peak: number; average: number; conflicts: number }> = {}
    const conflicts: ResourceAnalysisResult['conflicts'] = []
    const underutilized: ResourceAnalysisResult['underutilized'] = []
    const bottlenecks: ResourceAnalysisResult['bottlenecks'] = []
    const recommendations: string[] = []

    // Aggregate resource requirements
    for (const step of steps) {
      for (const resource of step.requiredResources) {
        if (!resourceSummary[resource.type]) {
          resourceSummary[resource.type] = { total: 0, peak: 0, average: 0, conflicts: 0 }
        }
        
        const amount = resource.amount || 1
        resourceSummary[resource.type].total += amount
      }
    }

    // Calculate averages
    for (const [type, summary] of Object.entries(resourceSummary)) {
      const stepsUsing = steps.filter(s => 
        s.requiredResources.some(r => r.type === type)
      ).length
      summary.average = stepsUsing > 0 ? summary.total / stepsUsing : 0
      summary.peak = summary.average * 1.5 // Estimate peak as 150% of average
    }

    // Detect conflicts (steps that use same resource at same time)
    const resourceUsers = new Map<string, PlanStep[]>()
    for (const step of steps) {
      for (const resource of step.requiredResources) {
        if (!resourceUsers.has(resource.type)) {
          resourceUsers.set(resource.type, [])
        }
        resourceUsers.get(resource.type)!.push(step)
      }
    }

    Array.from(resourceUsers.entries()).forEach(([resource, users]) => {
      // Check for parallel usage conflicts
      const parallelUsers = users.filter(u => 
        u.dependencies.length === 0 || 
        u.dependencies.every(d => !users.some(u2 => u2.id === d))
      )

      if (parallelUsers.length > 1) {
        for (let i = 0; i < parallelUsers.length; i++) {
          for (let j = i + 1; j < parallelUsers.length; j++) {
            conflicts.push({
              step1: parallelUsers[i].id,
              step2: parallelUsers[j].id,
              resource,
              reason: 'Both steps may execute concurrently',
              resolution: 'Add dependency or schedule sequentially'
            })
            resourceSummary[resource].conflicts++
          }
        }
      }
    })

    // Identify underutilized resources
    for (const [resource, summary] of Object.entries(resourceSummary)) {
      if (summary.average < 0.3 && summary.total > 0) {
        underutilized.push({
          resource,
          utilization: summary.average,
          suggestion: 'Consider consolidating resource usage'
        })
      }
    }

    // Check for bottlenecks
    Array.from(resourceUsers.entries()).forEach(([resource, users]) => {
      const mandatoryUsers = users.filter(u => 
        u.requiredResources.some(r => r.type === resource && r.mandatory)
      )
      
      const peakDemand = mandatoryUsers.length * (resourceSummary[resource]?.average || 1)
      
      if (peakDemand > 5) { // Arbitrary threshold
        bottlenecks.push({
          resource,
          demandSteps: mandatoryUsers.map(u => u.id),
          peakDemand,
          available: 3, // Default availability
          deficit: peakDemand - 3
        })
      }
    })

    // Generate recommendations
    if (conflicts.length > 0) {
      recommendations.push('Review resource conflicts to avoid contention')
    }
    if (bottlenecks.length > 0) {
      recommendations.push('Address resource bottlenecks before execution')
    }
    if (underutilized.length > 0) {
      recommendations.push('Optimize resource allocation for better utilization')
    }

    return {
      resourceSummary,
      conflicts,
      underutilized,
      bottlenecks,
      sufficient: bottlenecks.length === 0 && conflicts.filter(c => 
        steps.find(s => s.id === c.step1)?.priority === 'critical' ||
        steps.find(s => s.id === c.step2)?.priority === 'critical'
      ).length === 0,
      recommendations
    }
  }

  // =========================================================================
  // Time Analysis
  // =========================================================================

  /**
   * Analyze time estimates
   */
  private analyzeTime(steps: PlanStep[], constraints: PlanConstraint[]): TimeAnalysisResult {
    const criticalPath = this.calculateCriticalPath(steps)
    const criticalPathDuration = criticalPath.reduce((sum, id) => {
      const step = steps.find(s => s.id === id)
      return sum + (step?.estimatedDuration || 0)
    }, 0)

    const totalTime = steps.reduce((sum, s) => sum + s.estimatedDuration, 0)
    const parallelGroups = this.findParallelGroups(steps)
    const parallelSavings = parallelGroups.reduce((sum, group) => {
      const groupTime = group.reduce((s, id) => {
        const step = steps.find(s2 => s2.id === id)
        return s + (step?.estimatedDuration || 0)
      }, 0)
      const maxStepTime = Math.max(...group.map(id => 
        steps.find(s => s.id === id)?.estimatedDuration || 0
      ))
      return sum + (groupTime - maxStepTime)
    }, 0)

    // Time by type
    const timeByType: Record<StepType, number> = {} as Record<StepType, number>
    for (const step of steps) {
      timeByType[step.type] = (timeByType[step.type] || 0) + step.estimatedDuration
    }

    // Time by priority
    const timeByPriority: Record<string, number> = {}
    for (const step of steps) {
      timeByPriority[step.priority] = (timeByPriority[step.priority] || 0) + step.estimatedDuration
    }

    // Buffer analysis
    const bufferTime = totalTime * 0.2 // Standard 20% buffer
    const bufferPercentage = (bufferTime / totalTime) * 100
    const recommendedBuffer = Math.max(15, Math.min(30, totalTime / 60 * 2)) // 15-30%
    const bufferAdequate = bufferPercentage >= recommendedBuffer

    // Confidence calculation
    const uncertainSteps = steps.filter(s => 
      s.complexity > 7 || 
      s.riskLevel === 'high' || 
      s.riskLevel === 'critical' ||
      s.type === 'debug' ||
      s.type === 'integrate'
    )

    const overallConfidence = 1 - (uncertainSteps.length / Math.max(steps.length, 1)) * 0.3
    
    const confidenceByStep: Record<string, number> = {}
    for (const step of steps) {
      let confidence = 0.8 // Base confidence
      if (step.complexity > 7) confidence -= 0.2
      if (step.riskLevel === 'high') confidence -= 0.15
      if (step.riskLevel === 'critical') confidence -= 0.25
      if (step.type === 'debug') confidence -= 0.3
      confidenceByStep[step.id] = Math.max(0.2, confidence)
    }

    // Schedule risks
    const scheduleRisks = steps
      .filter(s => confidenceByStep[s.id] < 0.6)
      .map(s => ({
        step: s.id,
        risk: `Low confidence estimate for ${s.title}`,
        probability: 1 - confidenceByStep[s.id],
        impact: s.estimatedDuration * 0.5
      }))

    // Check time constraints
    const timeConstraints = constraints.filter(c => c.type === 'time')
    const realistic = timeConstraints.every(c => {
      const limit = typeof c.value === 'number' ? c.value : parseInt(String(c.value))
      return !limit || criticalPathDuration <= limit
    })

    const recommendations: string[] = []
    if (!bufferAdequate) {
      recommendations.push(`Add buffer time: current ${bufferPercentage.toFixed(0)}%, recommended ${recommendedBuffer}%`)
    }
    if (uncertainSteps.length > steps.length * 0.3) {
      recommendations.push('High uncertainty in time estimates - consider padding')
    }
    if (!realistic) {
      recommendations.push('Time constraints may not be achievable with current plan')
    }

    return {
      totalTime,
      criticalPathDuration,
      parallelSavings,
      timeByType,
      timeByPriority,
      bufferAnalysis: {
        totalTime,
        bufferTime,
        bufferPercentage,
        recommended: recommendedBuffer,
        adequate: bufferAdequate
      },
      confidence: {
        overall: overallConfidence,
        byStep: confidenceByStep,
        uncertainSteps: uncertainSteps.map(s => s.id)
      },
      scheduleRisks,
      realistic,
      recommendations
    }
  }

  // =========================================================================
  // Requirement Coverage Checking
  // =========================================================================

  /**
   * Check requirement coverage
   */
  private checkRequirementCoverage(plan: Plan): ValidationIssue[] {
    const issues: ValidationIssue[] = []

    for (const req of plan.requirements) {
      if (req.coveredBySteps.length === 0) {
        issues.push({
          id: `issue_req_${req.id}`,
          type: 'requirement_gap',
          severity: req.priority === 'critical' ? 'critical' : 'high',
          description: `Requirement not covered: ${req.description}`,
          affectedSteps: [],
          affectedRequirements: [req.id],
          impact: `Priority ${req.priority} requirement has no implementation steps`,
          suggestedFix: 'Add steps to implement this requirement',
          autoFixable: true
        })
      }
    }

    return issues
  }

  /**
   * Check prerequisites
   */
  private async checkPrerequisites(plan: Plan): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = []

    for (const step of plan.steps) {
      for (const depId of step.dependencies) {
        const depStep = plan.steps.find(s => s.id === depId)
        if (!depStep) {
          issues.push({
            id: `issue_prereq_${step.id}_${depId}`,
            type: 'missing_prerequisite',
            severity: 'high',
            description: `Missing prerequisite step: ${step.title} depends on non-existent step ${depId}`,
            affectedSteps: [step.id],
            affectedRequirements: [],
            impact: 'Step cannot be executed due to missing prerequisite',
            suggestedFix: 'Create the missing prerequisite step or remove the dependency',
            autoFixable: false
          })
        }
      }
    }

    return issues
  }

  // =========================================================================
  // Refinement Suggestions
  // =========================================================================

  /**
   * Generate refinement suggestions
   */
  private generateRefinementSuggestions(
    plan: Plan,
    completeness: CompletenessCheck,
    dependencyAnalysis: DependencyAnalysisResult,
    resourceAnalysis: ResourceAnalysisResult,
    timeAnalysis: TimeAnalysisResult
  ): RefinementSuggestion[] {
    const suggestions: RefinementSuggestion[] = []

    // Suggest adding missing steps for uncovered requirements
    for (const reqId of completeness.requirementsCoverage.uncovered) {
      const req = plan.requirements.find(r => r.id === reqId)
      if (req) {
        suggestions.push({
          id: `suggest_req_${reqId}`,
          type: 'add_step',
          priority: req.priority,
          description: `Add step to implement: ${req.description}`,
          rationale: 'Requirement is not covered by any step',
          affectedSteps: [],
          suggestedChanges: [{
            action: 'add',
            target: 'step',
            newValue: {
              title: `Implement: ${req.description.slice(0, 50)}`,
              type: 'create',
              priority: req.priority,
              description: req.description,
              requirementId: reqId
            },
            reason: 'Covers uncovered requirement'
          }],
          expectedImpact: {
            timeChange: 10,
            complexityChange: 1,
            riskChange: 0,
            completenessChange: 10
          },
          autoApplicable: true
        })
      }
    }

    // Suggest fixing dependency cycles
    if (dependencyAnalysis.hasCycles) {
      for (const cycle of dependencyAnalysis.cycles) {
        suggestions.push({
          id: `suggest_cycle_${cycle.join('_')}`,
          type: 'remove_dependency',
          priority: 'critical',
          description: `Break dependency cycle: ${cycle.join(' → ')}`,
          rationale: 'Circular dependencies prevent plan execution',
          affectedSteps: cycle,
          suggestedChanges: [{
            action: 'remove',
            target: 'dependency',
            targetId: cycle[cycle.length - 1],
            currentValue: cycle[0],
            newValue: null,
            reason: 'Breaks the dependency cycle'
          }],
          expectedImpact: {
            timeChange: 0,
            complexityChange: -2,
            riskChange: -10,
            completenessChange: 0
          },
          autoApplicable: true
        })
      }
    }

    // Suggest parallelization opportunities
    for (const opportunity of dependencyAnalysis.parallelizationOpportunities.slice(0, 3)) {
      suggestions.push({
        id: `suggest_parallel_${opportunity.join('_')}`,
        type: 'reorder_steps',
        priority: 'medium',
        description: 'Parallelize sequential steps',
        rationale: 'Steps can potentially run in parallel',
        affectedSteps: opportunity,
        suggestedChanges: [{
          action: 'remove',
          target: 'dependency',
          targetId: opportunity[1],
          currentValue: opportunity[0],
          newValue: null,
          reason: 'Removes unnecessary sequential dependency'
        }],
        expectedImpact: {
          timeChange: -5,
          complexityChange: 0,
          riskChange: 0,
          completenessChange: 0
        },
        autoApplicable: false
      })
    }

    // Suggest adding milestones if missing
    if (plan.milestones.length === 0 && plan.steps.length > 5) {
      suggestions.push({
        id: 'suggest_milestones',
        type: 'add_milestone',
        priority: 'low',
        description: 'Add milestones for better progress tracking',
        rationale: 'Plans with more than 5 steps benefit from milestones',
        affectedSteps: [],
        suggestedChanges: [{
          action: 'add',
          target: 'milestone',
          newValue: {
            name: 'Initial Setup',
            stepIds: plan.steps.slice(0, 3).map(s => s.id)
          },
          reason: 'Groups initial steps into a milestone'
        }],
        expectedImpact: {
          timeChange: 0,
          complexityChange: 0,
          riskChange: 0,
          completenessChange: 5
        },
        autoApplicable: true
      })
    }

    // Suggest resource optimization
    for (const conflict of resourceAnalysis.conflicts.slice(0, 2)) {
      suggestions.push({
        id: `suggest_resource_${conflict.step1}_${conflict.step2}`,
        type: 'add_dependency',
        priority: 'medium',
        description: `Resolve resource conflict: ${conflict.resource}`,
        rationale: conflict.reason,
        affectedSteps: [conflict.step1, conflict.step2],
        suggestedChanges: [{
          action: 'add',
          target: 'dependency',
          targetId: conflict.step2,
          newValue: conflict.step1,
          reason: conflict.resolution
        }],
        expectedImpact: {
          timeChange: 5,
          complexityChange: 1,
          riskChange: -5,
          completenessChange: 0
        },
        autoApplicable: false
      })
    }

    // Suggest time adjustments
    for (const risk of timeAnalysis.scheduleRisks.slice(0, 3)) {
      suggestions.push({
        id: `suggest_time_${risk.step}`,
        type: 'adjust_time',
        priority: 'medium',
        description: 'Increase time estimate for uncertain step',
        rationale: risk.risk,
        affectedSteps: [risk.step],
        suggestedChanges: [{
          action: 'modify',
          target: 'time',
          targetId: risk.step,
          currentValue: plan.steps.find(s => s.id === risk.step)?.estimatedDuration,
          newValue: Math.ceil((plan.steps.find(s => s.id === risk.step)?.estimatedDuration || 5) * 1.5),
          reason: 'Accounts for execution uncertainty'
        }],
        expectedImpact: {
          timeChange: risk.impact,
          complexityChange: 0,
          riskChange: -5,
          completenessChange: 0
        },
        autoApplicable: true
      })
    }

    return suggestions
  }

  // =========================================================================
  // AI-Enhanced Analysis
  // =========================================================================

  /**
   * Get AI-enhanced validation insights
   */
  private async getAIValidationInsights(
    plan: Plan,
    context: {
      issues: ValidationIssue[]
      completeness: CompletenessCheck
      dependencyAnalysis: DependencyAnalysisResult
      resourceAnalysis: ResourceAnalysisResult
      timeAnalysis: TimeAnalysisResult
    }
  ): Promise<RefinementSuggestion[]> {
    if (!this.zai) return []

    try {
      const prompt = `Analyze this execution plan and suggest improvements:

Plan: ${plan.name}
Description: ${plan.description}
Steps: ${plan.steps.length}
Completeness: ${context.completeness.completeness.toFixed(1)}%
Issues: ${context.issues.length}
Critical Path: ${context.dependencyAnalysis.criticalPath.length} steps

Current issues:
${context.issues.slice(0, 5).map(i => `- ${i.description}`).join('\n')}

Suggest 3 specific improvements in JSON format:
[
  {
    "type": "add_step|remove_step|reorder_steps|adjust_time|add_dependency",
    "priority": "critical|high|medium|low",
    "description": "what to do",
    "rationale": "why this helps",
    "expectedBenefit": "improvement description"
  }
]`

      const completion = await this.zai.chat.completions.create({
        messages: [
          { 
            role: 'assistant', 
            content: 'You are a planning expert. Analyze plans and suggest improvements in valid JSON format.' 
          },
          { role: 'user', content: prompt }
        ],
        thinking: { type: 'disabled' }
      })

      const response = completion.choices[0]?.message?.content || '[]'
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      
      if (!jsonMatch) return []

      const parsed = JSON.parse(jsonMatch[0])
      
      return parsed.map((s: any, i: number) => ({
        id: `ai_suggest_${Date.now().toString(36)}_${i}`,
        type: s.type || 'add_step',
        priority: s.priority || 'medium',
        description: s.description,
        rationale: s.rationale,
        affectedSteps: [],
        suggestedChanges: [],
        expectedImpact: {
          timeChange: 0,
          complexityChange: 0,
          riskChange: 0,
          completenessChange: 10
        },
        autoApplicable: false
      }))
    } catch (error) {
      console.error('AI validation insights failed:', error)
      return []
    }
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  /**
   * Calculate validation score
   */
  private calculateValidationScore(
    completeness: CompletenessCheck,
    issues: ValidationIssue[],
    warnings: ValidationWarning[],
    dependencyAnalysis: DependencyAnalysisResult,
    resourceAnalysis: ResourceAnalysisResult,
    timeAnalysis: TimeAnalysisResult
  ): number {
    let score = completeness.completeness * 0.4 // 40% weight on completeness

    // Deduct for issues
    for (const issue of issues) {
      const deduction = issue.severity === 'critical' ? 20 : 
                       issue.severity === 'high' ? 10 : 5
      score -= deduction
    }

    // Deduct for warnings
    score -= warnings.length * 2

    // Add for good dependency structure
    if (!dependencyAnalysis.hasCycles) {
      score += 10
    }
    if (dependencyAnalysis.parallelGroups.length > 0) {
      score += 5
    }

    // Add for resource sufficiency
    if (resourceAnalysis.sufficient) {
      score += 10
    }

    // Add for realistic time estimates
    if (timeAnalysis.realistic) {
      score += 10
    }
    if (timeAnalysis.confidence.overall > 0.7) {
      score += 5
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Check if suggestion is relevant to focus areas
   */
  private isRelevantToFocusAreas(
    suggestion: RefinementSuggestion, 
    focusAreas: string[]
  ): boolean {
    const areaMapping: Record<string, RefinementSuggestion['type'][]> = {
      completeness: ['add_step', 'remove_step', 'add_milestone', 'improve_documentation'],
      time: ['adjust_time', 'reorder_steps', 'merge_steps', 'split_step'],
      risk: ['add_dependency', 'remove_dependency', 'adjust_priority'],
      dependencies: ['add_dependency', 'remove_dependency', 'reorder_steps'],
      resources: ['add_resource', 'adjust_priority', 'reorder_steps']
    }

    for (const area of focusAreas) {
      const types = areaMapping[area]
      if (types && types.includes(suggestion.type)) {
        return true
      }
    }
    return false
  }

  /**
   * Apply a refinement suggestion
   */
  private applySuggestion(
    plan: Plan, 
    suggestion: RefinementSuggestion
  ): { plan: Plan; changes: RefinementChange[] } {
    const changes: RefinementChange[] = []
    const updatedSteps = [...plan.steps]
    const updatedMilestones = [...plan.milestones]

    for (const change of suggestion.suggestedChanges) {
      switch (change.action) {
        case 'add':
          if (change.target === 'step') {
            const newStep: PlanStep = {
              id: `step_${Date.now().toString(36)}`,
              title: change.newValue.title || 'New Step',
              description: change.newValue.description || '',
              type: change.newValue.type || 'create',
              priority: change.newValue.priority || 'medium',
              status: 'pending',
              dependencies: [],
              dependents: [],
              estimatedDuration: DEFAULT_STEP_DURATION,
              complexity: DEFAULT_STEP_COMPLEXITY,
              requiredResources: [],
              requiredCapabilities: [],
              affectedFiles: [],
              riskLevel: STEP_TYPE_RISKS[change.newValue.type || 'create'],
              notes: [],
              metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                retries: 0,
                maxRetries: 3,
                tags: []
              }
            }
            updatedSteps.push(newStep)
            changes.push({
              type: 'step_added',
              description: `Added step: ${newStep.title}`,
              affectedStep: newStep.id,
              newValue: newStep,
              rationale: change.reason
            })
          } else if (change.target === 'dependency') {
            const step = updatedSteps.find(s => s.id === change.targetId)
            if (step && !step.dependencies.includes(change.newValue)) {
              step.dependencies.push(change.newValue)
              const depStep = updatedSteps.find(s => s.id === change.newValue)
              if (depStep && !depStep.dependents.includes(step.id)) {
                depStep.dependents.push(step.id)
              }
              changes.push({
                type: 'dependency_added',
                description: `Added dependency: ${step.id} → ${change.newValue}`,
                affectedStep: step.id,
                newValue: change.newValue,
                rationale: change.reason
              })
            }
          } else if (change.target === 'milestone') {
            const newMilestone: PlanMilestone = {
              id: `ms_${Date.now().toString(36)}`,
              name: change.newValue.name || 'New Milestone',
              description: '',
              stepIds: change.newValue.stepIds || [],
              dependencies: [],
              status: 'pending',
              progress: 0
            }
            updatedMilestones.push(newMilestone)
            changes.push({
              type: 'milestone_added',
              description: `Added milestone: ${newMilestone.name}`,
              newValue: newMilestone,
              rationale: change.reason
            })
          }
          break

        case 'remove':
          if (change.target === 'dependency') {
            const step = updatedSteps.find(s => s.id === change.targetId)
            if (step) {
              const idx = step.dependencies.indexOf(change.currentValue)
              if (idx !== -1) {
                step.dependencies.splice(idx, 1)
                const depStep = updatedSteps.find(s => s.id === change.currentValue)
                if (depStep) {
                  const depIdx = depStep.dependents.indexOf(step.id)
                  if (depIdx !== -1) {
                    depStep.dependents.splice(depIdx, 1)
                  }
                }
                changes.push({
                  type: 'dependency_removed',
                  description: `Removed dependency: ${step.id} → ${change.currentValue}`,
                  affectedStep: step.id,
                  previousValue: change.currentValue,
                  newValue: null,
                  rationale: change.reason
                })
              }
            }
          }
          break

        case 'modify':
          if (change.target === 'time') {
            const step = updatedSteps.find(s => s.id === change.targetId)
            if (step) {
              const previousDuration = step.estimatedDuration
              step.estimatedDuration = change.newValue
              changes.push({
                type: 'time_adjusted',
                description: `Adjusted time for ${step.title}: ${previousDuration} → ${change.newValue}`,
                affectedStep: step.id,
                previousValue: previousDuration,
                newValue: change.newValue,
                rationale: change.reason
              })
            }
          }
          break

        case 'reorder':
          // Handle reordering logic
          break
      }
    }

    const updatedPlan: Plan = {
      ...plan,
      steps: updatedSteps,
      milestones: updatedMilestones,
      updatedAt: new Date().toISOString()
    }

    updatedPlan.metrics = this.calculatePlanMetrics(updatedPlan)

    return { plan: updatedPlan, changes }
  }

  /**
   * Calculate improvements between plan versions
   */
  private calculateImprovements(
    originalPlan: Plan, 
    refinedPlan: Plan
  ): RefinementResult['improvements'] {
    const originalMetrics = this.calculatePlanMetrics(originalPlan)
    const refinedMetrics = this.calculatePlanMetrics(refinedPlan)

    return {
      completenessImprovement: refinedMetrics.progress - originalMetrics.progress,
      timeImprovement: originalMetrics.estimatedTime - refinedMetrics.estimatedTime,
      riskReduction: 0, // Would need risk scoring
      dependencyOptimization: originalMetrics.dependencyDepth - refinedMetrics.dependencyDepth
    }
  }

  /**
   * Calculate plan metrics
   */
  private calculatePlanMetrics(plan: Plan): PlanMetrics {
    const steps = plan.steps
    const totalSteps = steps.length
    const completedSteps = steps.filter(s => s.status === 'completed').length
    const pendingSteps = steps.filter(s => s.status === 'pending').length
    const blockedSteps = steps.filter(s => s.status === 'blocked').length
    const failedSteps = steps.filter(s => s.status === 'failed').length

    const averageStepComplexity = totalSteps > 0
      ? steps.reduce((sum, s) => sum + s.complexity, 0) / totalSteps
      : 0

    const criticalPath = this.calculateCriticalPath(steps)
    const criticalPathLength = criticalPath.length

    const parallelGroups = this.findParallelGroups(steps)

    const dependencyDepth = this.calculateDependencyDepth(steps)
    const maxDepth = Math.max(...Object.values(dependencyDepth), 0)

    const estimatedTime = steps.reduce((sum, s) => sum + s.estimatedDuration, 0)
    const actualTime = steps
      .filter(s => s.actualDuration !== undefined)
      .reduce((sum, s) => sum + (s.actualDuration || 0), 0)

    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
    const efficiency = estimatedTime > 0 && actualTime > 0 
      ? estimatedTime / actualTime 
      : 1

    return {
      totalSteps,
      completedSteps,
      pendingSteps,
      blockedSteps,
      failedSteps,
      averageStepComplexity,
      criticalPathLength,
      parallelizableGroups: parallelGroups.length,
      resourceUtilization: {},
      dependencyDepth: maxDepth,
      estimatedTime,
      actualTime,
      progress,
      efficiency
    }
  }

  // =========================================================================
  // Utility Methods
  // =========================================================================

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.validationCache.clear()
    this.emit('cache:cleared')
  }

  /**
   * Get refinement history for a plan
   */
  getRefinementHistory(planId: string): RefinementResult[] {
    return this.refinementHistory.get(planId) || []
  }

  /**
   * Create a new plan
   */
  createPlan(
    name: string,
    description: string,
    options: Partial<Plan> = {}
  ): Plan {
    const now = new Date().toISOString()
    
    const plan: Plan = {
      id: `plan_${Date.now().toString(36)}`,
      name,
      description,
      version: 1,
      steps: [],
      milestones: [],
      priority: options.priority || 'medium',
      status: 'draft',
      estimatedDuration: 0,
      requirements: [],
      constraints: [],
      risks: [],
      createdAt: now,
      updatedAt: now,
      metrics: {
        totalSteps: 0,
        completedSteps: 0,
        pendingSteps: 0,
        blockedSteps: 0,
        failedSteps: 0,
        averageStepComplexity: 0,
        criticalPathLength: 0,
        parallelizableGroups: 0,
        resourceUtilization: {},
        dependencyDepth: 0,
        estimatedTime: 0,
        actualTime: 0,
        progress: 0,
        efficiency: 1
      },
      metadata: {
        tags: [],
        notes: [],
        revisionHistory: []
      },
      ...options
    }

    this.emit('plan:created', plan)
    return plan
  }

  /**
   * Add a step to a plan
   */
  addStep(
    plan: Plan,
    step: Omit<PlanStep, 'id' | 'status' | 'dependents' | 'metadata'>
  ): Plan {
    const now = new Date().toISOString()
    
    const newStep: PlanStep = {
      ...step,
      id: `step_${Date.now().toString(36)}`,
      status: 'pending',
      dependents: [],
      metadata: {
        createdAt: now,
        updatedAt: now,
        retries: 0,
        maxRetries: 3,
        tags: []
      }
    }

    plan.steps.push(newStep)

    // Update dependencies
    for (const depId of newStep.dependencies) {
      const depStep = plan.steps.find(s => s.id === depId)
      if (depStep && !depStep.dependents.includes(newStep.id)) {
        depStep.dependents.push(newStep.id)
      }
    }

    plan.metrics = this.calculatePlanMetrics(plan)
    plan.updatedAt = now

    this.emit('step:added', { planId: plan.id, stepId: newStep.id })
    return plan
  }
}

// ============================================================================
// Singleton and Convenience Functions
// ============================================================================

let validatorInstance: PlanValidator | null = null

/**
 * Get the PlanValidator singleton instance
 */
export function getPlanValidator(): PlanValidator {
  if (!validatorInstance) {
    validatorInstance = new PlanValidator()
  }
  return validatorInstance
}

/**
 * Convenience function to validate a plan
 */
export async function validatePlan(
  plan: Plan,
  options?: ValidationOptions
): Promise<ValidationResult> {
  const validator = getPlanValidator()
  return validator.validatePlan(plan, options)
}

/**
 * Convenience function to refine a plan
 */
export async function refinePlan(
  plan: Plan,
  options?: RefinementOptions
): Promise<RefinementResult> {
  const validator = getPlanValidator()
  return validator.refinePlan(plan, options)
}

// ============================================================================
// Additional Exports
// ============================================================================

export {
  DEFAULT_STEP_DURATION,
  DEFAULT_STEP_COMPLEXITY,
  MAX_DEPENDENCY_DEPTH,
  MIN_COMPLETENESS_THRESHOLD,
  STEP_TYPE_PRIORITIES,
  STEP_TYPE_RISKS
}
