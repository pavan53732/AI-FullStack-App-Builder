/**
 * Logical Inference Engine
 * 
 * Implements mechanisms #23, #29-30:
 * - Logical Inference Checker: Validate deduction chains, check premise-conclusion relationships,
 *   identify logical fallacies, validate conditional reasoning
 * - Reasoning Consistency Validator: Check for contradictions, verify temporal consistency,
 *   validate causal relationships, check scope consistency
 * - Reasoning Conflict Detector: Find contradictory statements, identify resource conflicts,
 *   detect goal conflicts, find assumption conflicts
 */

import ZAI from 'z-ai-web-dev-sdk'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Represents a single step in an inference chain
 */
export interface InferenceStep {
  /** Unique identifier for this step */
  id: string
  /** Type of inference step */
  type: InferenceStepType
  /** The statement or proposition being made */
  statement: string
  /** Confidence level for this step (0-1) */
  confidence: number
  /** IDs of steps this step depends on */
  dependencies: string[]
  /** Evidence supporting this step */
  evidence: InferenceEvidence[]
  /** Logical rule applied to derive this step */
  rule?: LogicalRule
  /** Whether this step is valid */
  isValid?: boolean
  /** Any validation issues */
  issues?: ValidationIssue[]
  /** Timestamp of creation */
  timestamp: string
}

/**
 * Types of inference steps
 */
export type InferenceStepType =
  | 'premise'
  | 'observation'
  | 'axiom'
  | 'deduction'
  | 'induction'
  | 'abduction'
  | 'hypothesis'
  | 'conclusion'
  | 'intermediate'
  | 'assumption'

/**
 * Evidence supporting an inference step
 */
export interface InferenceEvidence {
  /** Type of evidence */
  type: 'empirical' | 'logical' | 'testimonial' | 'statistical' | 'anecdotal'
  /** Content of the evidence */
  content: string
  /** Source of the evidence */
  source: string
  /** Weight/strength of the evidence (0-1) */
  weight: number
  /** Whether this evidence is contested */
  contested?: boolean
}

/**
 * Logical rule applied in inference
 */
export interface LogicalRule {
  /** Name of the rule */
  name: string
  /** Category of the rule */
  category: 'deductive' | 'inductive' | 'abductive' | 'heuristic'
  /** Formal representation if applicable */
  formal?: string
  /** Description of the rule */
  description: string
}

/**
 * Validation issue for an inference step
 */
export interface ValidationIssue {
  /** Type of issue */
  type: ValidationIssueType
  /** Severity of the issue */
  severity: 'low' | 'medium' | 'high' | 'critical'
  /** Description of the issue */
  description: string
  /** Suggested fix */
  suggestion?: string
}

/**
 * Types of validation issues
 */
export type ValidationIssueType =
  | 'invalid_deduction'
  | 'missing_premise'
  | 'circular_reasoning'
  | 'logical_fallacy'
  | 'insufficient_evidence'
  | 'contradiction'
  | 'scope_violation'
  | 'temporal_inconsistency'

/**
 * Represents a complete inference chain
 */
export interface InferenceChain {
  /** Unique identifier for this chain */
  id: string
  /** Goal or question being addressed */
  goal: string
  /** All steps in the chain */
  steps: InferenceStep[]
  /** Overall conclusion of the chain */
  conclusion: ChainConclusion
  /** Metadata about the chain */
  metadata: InferenceChainMetadata
  /** Overall validity of the chain */
  isValid: boolean
  /** Overall confidence of the chain */
  confidence: number
}

/**
 * Conclusion of an inference chain
 */
export interface ChainConclusion {
  /** The conclusion statement */
  statement: string
  /** Confidence in the conclusion */
  confidence: number
  /** How the conclusion was derived */
  derivation: string
  /** Key evidence supporting the conclusion */
  keyEvidence: string[]
  /** Assumptions made */
  assumptions: string[]
  /** Limitations of the conclusion */
  limitations: string[]
}

/**
 * Metadata for an inference chain
 */
export interface InferenceChainMetadata {
  /** When the chain was created */
  createdAt: string
  /** When the chain was last updated */
  updatedAt: string
  /** Total number of steps */
  totalSteps: number
  /** Number of premises */
  premiseCount: number
  /** Number of intermediate steps */
  intermediateCount: number
  /** Chain depth (longest path) */
  depth: number
  /** Total processing time in ms */
  processingTime: number
  /** Domain or context */
  domain?: string
}

/**
 * Result of a consistency validation
 */
export interface ConsistencyResult {
  /** Unique identifier */
  id: string
  /** ID of the inference chain checked */
  chainId: string
  /** Whether the chain is consistent */
  isConsistent: boolean
  /** Overall consistency score (0-1) */
  consistencyScore: number
  /** Detected contradictions */
  contradictions: Contradiction[]
  /** Temporal consistency issues */
  temporalIssues: TemporalIssue[]
  /** Causal relationship issues */
  causalIssues: CausalIssue[]
  /** Scope consistency issues */
  scopeIssues: ScopeIssue[]
  /** Overall recommendations */
  recommendations: string[]
  /** Timestamp of validation */
  timestamp: string
}

/**
 * Represents a contradiction between statements
 */
export interface Contradiction {
  /** Unique identifier */
  id: string
  /** Type of contradiction */
  type: ContradictionType
  /** Severity */
  severity: 'low' | 'medium' | 'high' | 'critical'
  /** First conflicting statement */
  statementA: string
  /** Second conflicting statement */
  statementB: string
  /** Step ID of first statement */
  stepIdA: string
  /** Step ID of second statement */
  stepIdB: string
  /** Explanation of the contradiction */
  explanation: string
  /** Resolution suggestion */
  resolution?: string
}

/**
 * Types of contradictions
 */
export type ContradictionType =
  | 'direct'
  | 'implicit'
  | 'conditional'
  | 'temporal'
  | 'scope'
  | 'semantic'

/**
 * Temporal consistency issue
 */
export interface TemporalIssue {
  /** Unique identifier */
  id: string
  /** Type of temporal issue */
  type: TemporalIssueType
  /** Description of the issue */
  description: string
  /** Affected step IDs */
  affectedSteps: string[]
  /** Temporal ordering that should exist */
  expectedOrder?: string[]
  /** Actual temporal ordering */
  actualOrder?: string[]
  /** Suggested resolution */
  resolution?: string
}

/**
 * Types of temporal issues
 */
export type TemporalIssueType =
  | 'ordering_violation'
  | 'impossible_sequence'
  | 'duration_conflict'
  | 'deadline_conflict'
  | 'temporal_gap'

/**
 * Causal relationship issue
 */
export interface CausalIssue {
  /** Unique identifier */
  id: string
  /** Type of causal issue */
  type: CausalIssueType
  /** Description of the issue */
  description: string
  /** The claimed cause */
  cause: string
  /** The claimed effect */
  effect: string
  /** Why the causal relationship is problematic */
  reason: string
  /** Affected step IDs */
  affectedSteps: string[]
  /** Suggested resolution */
  resolution?: string
}

/**
 * Types of causal issues
 */
export type CausalIssueType =
  | 'false_causality'
  | 'reverse_causality'
  | 'missing_cause'
  | 'insufficient_cause'
  | 'common_cause'
  | 'causal_oversimplification'

/**
 * Scope consistency issue
 */
export interface ScopeIssue {
  /** Unique identifier */
  id: string
  /** Type of scope issue */
  type: ScopeIssueType
  /** Description of the issue */
  description: string
  /** The scope that was violated */
  violatedScope: string
  /** The statement that violated the scope */
  violatingStatement: string
  /** Step ID of the violating statement */
  stepId: string
  /** Suggested resolution */
  resolution?: string
}

/**
 * Types of scope issues
 */
export type ScopeIssueType =
  | 'generalization_error'
  | 'scope_creep'
  | 'domain_mismatch'
  | 'context_violation'
  | 'quantifier_mismatch'

/**
 * Represents a detected conflict
 */
export interface Conflict {
  /** Unique identifier */
  id: string
  /** Type of conflict */
  type: ConflictType
  /** Severity of the conflict */
  severity: 'low' | 'medium' | 'high' | 'critical'
  /** Description of the conflict */
  description: string
  /** Parties involved in the conflict */
  parties: ConflictParty[]
  /** Impact of the conflict */
  impact: string
  /** Resolution options */
  resolutions: ConflictResolution[]
  /** Whether auto-resolution is possible */
  autoResolvable: boolean
  /** Detected at timestamp */
  detectedAt: string
}

/**
 * Types of conflicts
 */
export type ConflictType =
  | 'contradictory_statement'
  | 'resource_contention'
  | 'goal_conflict'
  | 'assumption_conflict'
  | 'value_conflict'
  | 'priority_conflict'
  | 'dependency_conflict'

/**
 * Party involved in a conflict
 */
export interface ConflictParty {
  /** Type of party */
  type: 'statement' | 'resource' | 'goal' | 'assumption' | 'constraint'
  /** Identifier */
  id: string
  /** Name or description */
  name: string
  /** What this party requires or asserts */
  requirements: string[]
  /** Source step ID if applicable */
  sourceStepId?: string
}

/**
 * Resolution option for a conflict
 */
export interface ConflictResolution {
  /** Type of resolution */
  type: ResolutionType
  /** Description of how to resolve */
  description: string
  /** Impact of this resolution */
  impact: string
  /** Confidence this resolution will work (0-1) */
  confidence: number
  /** Steps to implement the resolution */
  implementationSteps?: string[]
}

/**
 * Types of conflict resolutions
 */
export type ResolutionType =
  | 'reorder'
  | 'merge'
  | 'eliminate'
  | 'negotiate'
  | 'compromise'
  | 'prioritize'
  | 'constraint_relaxation'
  | 'resource_allocation'

/**
 * Represents a logical fallacy
 */
export interface LogicalFallacy {
  /** Unique identifier */
  id: string
  /** Name of the fallacy */
  name: string
  /** Category of the fallacy */
  category: FallacyCategory
  /** Formal name if applicable */
  formalName?: string
  /** Description of the fallacy */
  description: string
  /** The problematic statement or reasoning */
  detectedIn: string
  /** Step ID where fallacy was detected */
  stepId: string
  /** Why this is a fallacy */
  reason: string
  /** Example of correct reasoning */
  correctReasoning?: string
  /** Severity */
  severity: 'low' | 'medium' | 'high'
}

/**
 * Categories of logical fallacies
 */
export type FallacyCategory =
  | 'relevance'
  | 'presumption'
  | 'ambiguity'
  | 'formal'
  | 'inductive'
  | 'causal'
  | 'statistical'

/**
 * Context for inference checking
 */
export interface InferenceContext {
  /** Domain of discourse */
  domain?: string
  /** Known facts to consider */
  knownFacts?: string[]
  /** Constraints to apply */
  constraints?: string[]
  /** Preferred reasoning style */
  reasoningStyle?: 'formal' | 'informal' | 'hybrid'
  /** Maximum chain depth */
  maxDepth?: number
  /** Whether to allow assumptions */
  allowAssumptions?: boolean
}

/**
 * Result of inference checking
 */
export interface InferenceCheckResult {
  /** Whether the inference is valid */
  isValid: boolean
  /** Overall confidence (0-1) */
  confidence: number
  /** Detected fallacies */
  fallacies: LogicalFallacy[]
  /** Validation issues */
  issues: ValidationIssue[]
  /** Suggestions for improvement */
  suggestions: string[]
  /** Strengths of the reasoning */
  strengths: string[]
}

/**
 * Options for conflict detection
 */
export interface ConflictDetectionOptions {
  /** Types of conflicts to detect */
  conflictTypes?: ConflictType[]
  /** Minimum severity to report */
  minSeverity?: 'low' | 'medium' | 'high' | 'critical'
  /** Whether to attempt auto-resolution */
  attemptAutoResolution?: boolean
  /** Context for conflict detection */
  context?: InferenceContext
}

// ============================================================================
// LOGICAL INFERENCE ENGINE
// ============================================================================

/**
 * Main Logical Inference Engine
 * 
 * Provides comprehensive logical inference checking, consistency validation,
 * and conflict detection for reasoning chains.
 */
export class LogicalInferenceEngine {
  private zai: any = null
  private chainStore: Map<string, InferenceChain> = new Map()
  private fallacyPatterns: Map<string, RegExp[]> = new Map()

  constructor() {
    this.initializeFallacyPatterns()
  }

  /**
   * Initialize the AI client
   */
  private async init(): Promise<void> {
    if (!this.zai) {
      this.zai = await ZAI.create()
    }
  }

  /**
   * Initialize patterns for detecting common logical fallacies
   */
  private initializeFallacyPatterns(): void {
    this.fallacyPatterns.set('ad_hominem', [
      /you('| a)re\s+(stupid|wrong|ignorant)/i,
      /attack\s+the\s+person/i
    ])
    this.fallacyPatterns.set('straw_man', [
      /so\s+you('| a)re\s+saying\s+that/i,
      /you\s+claim\s+that\s+all/i
    ])
    this.fallacyPatterns.set('false_dichotomy', [
      /either\s+.+\s+or\s+.+/i,
      /only\s+two\s+(options|choices)/i
    ])
    this.fallacyPatterns.set('slippery_slope', [
      /this\s+will\s+(inevitably|ultimately)\s+lead\s+to/i,
      /one\s+thing\s+will\s+lead\s+to\s+another/i
    ])
    this.fallacyPatterns.set('circular_reasoning', [
      /because\s+it\s+is\s+true/i,
      /therefore\s+it\s+is\s+(true|correct|right)/i
    ])
    this.fallacyPatterns.set('appeal_to_authority', [
      /experts\s+say/i,
      /according\s+to\s+(experts|authorities|scientists)/i
    ])
    this.fallacyPatterns.set('hasty_generalization', [
      /all\s+\w+\s+are/i,
      /every\s+\w+\s+is/i
    ])
    this.fallacyPatterns.set('post_hoc', [
      /after\s+.+,\s+therefore/i,
      /since\s+.+\s+happened\s+after/i
    ])
  }

  // ===========================================================================
  // INFERENCE CHECKING
  // ===========================================================================

  /**
   * Check the validity of an inference chain
   * 
   * @param chain - The inference chain to check
   * @param context - Optional context for checking
   * @returns Result of the inference check
   */
  async checkInference(
    chain: InferenceChain,
    context?: InferenceContext
  ): Promise<InferenceCheckResult> {
    await this.init()

    const fallacies: LogicalFallacy[] = []
    const issues: ValidationIssue[] = []
    const suggestions: string[] = []
    const strengths: string[] = []

    // 1. Validate deduction chains
    const deductionIssues = await this.validateDeductionChains(chain)
    issues.push(...deductionIssues)

    // 2. Check premise-conclusion relationships
    const relationshipIssues = await this.checkPremiseConclusionRelationships(chain)
    issues.push(...relationshipIssues)

    // 3. Identify logical fallacies
    const detectedFallacies = await this.identifyFallacies(chain, context)
    fallacies.push(...detectedFallacies)

    // 4. Validate conditional reasoning
    const conditionalIssues = await this.validateConditionalReasoning(chain)
    issues.push(...conditionalIssues)

    // 5. Identify strengths
    const identifiedStrengths = this.identifyStrengths(chain)
    strengths.push(...identifiedStrengths)

    // Calculate overall validity and confidence
    const criticalIssues = issues.filter(i => i.severity === 'critical').length
    const highIssues = issues.filter(i => i.severity === 'high').length
    const fallacyCount = fallacies.length

    let confidence = chain.confidence
    confidence -= criticalIssues * 0.3
    confidence -= highIssues * 0.15
    confidence -= fallacyCount * 0.1
    confidence = Math.max(0, Math.min(1, confidence))

    const isValid = criticalIssues === 0 && highIssues === 0 && fallacyCount === 0

    // Generate suggestions
    if (!isValid) {
      suggestions.push(...this.generateSuggestions(issues, fallacies))
    }

    return {
      isValid,
      confidence,
      fallacies,
      issues,
      suggestions,
      strengths
    }
  }

  /**
   * Validate deduction chains within an inference chain
   */
  private async validateDeductionChains(
    chain: InferenceChain
  ): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = []

    for (const step of chain.steps) {
      if (step.type === 'deduction') {
        // Check if all dependencies exist
        for (const depId of step.dependencies) {
          const depStep = chain.steps.find(s => s.id === depId)
          if (!depStep) {
            issues.push({
              type: 'missing_premise',
              severity: 'high',
              description: `Deduction step "${step.id}" depends on non-existent step "${depId}"`,
              suggestion: `Add the missing premise step or correct the dependency reference`
            })
          }
        }

        // Check for circular dependencies
        const circularDeps = this.detectCircularDependencies(chain, step.id)
        if (circularDeps.length > 0) {
          issues.push({
            type: 'circular_reasoning',
            severity: 'critical',
            description: `Circular dependency detected: ${circularDeps.join(' -> ')}`,
            suggestion: 'Restructure the reasoning to eliminate circular dependencies'
          })
        }

        // Validate the deduction using AI
        const deductionValidation = await this.validateSingleDeduction(step, chain)
        if (!deductionValidation.isValid) {
          issues.push(...deductionValidation.issues)
        }
      }
    }

    return issues
  }

  /**
   * Detect circular dependencies starting from a step
   */
  private detectCircularDependencies(chain: InferenceChain, startStepId: string): string[] {
    const visited = new Set<string>()
    const path: string[] = []

    const dfs = (stepId: string): string[] | null => {
      if (visited.has(stepId)) {
        const cycleStart = path.indexOf(stepId)
        if (cycleStart !== -1) {
          return [...path.slice(cycleStart), stepId]
        }
        return null
      }

      visited.add(stepId)
      path.push(stepId)

      const step = chain.steps.find(s => s.id === stepId)
      if (step) {
        for (const depId of step.dependencies) {
          const cycle = dfs(depId)
          if (cycle) return cycle
        }
      }

      path.pop()
      return null
    }

    const cycle = dfs(startStepId)
    return cycle || []
  }

  /**
   * Validate a single deduction step
   */
  private async validateSingleDeduction(
    step: InferenceStep,
    chain: InferenceChain
  ): Promise<{ isValid: boolean; issues: ValidationIssue[] }> {
    const issues: ValidationIssue[] = []

    // Get all dependency steps
    const depSteps = step.dependencies
      .map(id => chain.steps.find(s => s.id === id))
      .filter(Boolean) as InferenceStep[]

    if (depSteps.length === 0) {
      return { isValid: true, issues: [] }
    }

    // Build the reasoning context
    const premises = depSteps.map(s => s.statement).join('\n')
    const conclusion = step.statement

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a logic validator. Given premises and a conclusion, determine if the conclusion logically follows from the premises. 
                      Respond with VALID or INVALID followed by a brief explanation. Be strict about logical validity.`
          },
          {
            role: 'user',
            content: `Premises:\n${premises}\n\nConclusion: ${conclusion}\n\nDoes the conclusion logically follow?`
          }
        ],
        thinking: { type: 'disabled' }
      })

      const response = completion.choices[0]?.message?.content || ''
      const isInvalid = response.toLowerCase().includes('invalid')

      if (isInvalid) {
        issues.push({
          type: 'invalid_deduction',
          severity: 'high',
          description: `Deduction may not logically follow: ${response}`,
          suggestion: 'Review the logical connection between premises and conclusion'
        })
      }
    } catch (error) {
      // If AI validation fails, do basic syntactic check
      if (step.dependencies.length === 0 && step.type === 'deduction') {
        issues.push({
          type: 'missing_premise',
          severity: 'medium',
          description: 'Deduction step has no premises to derive from',
          suggestion: 'Add premises or change the step type'
        })
      }
    }

    return { isValid: issues.length === 0, issues }
  }

  /**
   * Check premise-conclusion relationships
   */
  private async checkPremiseConclusionRelationships(
    chain: InferenceChain
  ): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = []

    // Find all premises and the conclusion
    const premises = chain.steps.filter(s => s.type === 'premise')
    const conclusion = chain.steps.find(s => s.type === 'conclusion')

    if (!conclusion) {
      issues.push({
        type: 'missing_premise',
        severity: 'medium',
        description: 'No conclusion step found in the inference chain',
        suggestion: 'Add a conclusion step to complete the reasoning'
      })
      return issues
    }

    if (premises.length === 0) {
      issues.push({
        type: 'missing_premise',
        severity: 'high',
        description: 'No premise steps found in the inference chain',
        suggestion: 'Add premises to support the conclusion'
      })
      return issues
    }

    // Check if conclusion is reachable from premises
    const reachable = this.isReachableFromPremises(chain, conclusion.id)
    if (!reachable) {
      issues.push({
        type: 'missing_premise',
        severity: 'high',
        description: 'Conclusion is not reachable from any premises',
        suggestion: 'Add intermediate steps to connect premises to conclusion'
      })
    }

    return issues
  }

  /**
   * Check if a step is reachable from any premise
   */
  private isReachableFromPremises(chain: InferenceChain, targetStepId: string): boolean {
    const premises = chain.steps.filter(s => s.type === 'premise').map(s => s.id)
    const visited = new Set<string>()

    const dfs = (stepId: string): boolean => {
      if (premises.includes(stepId)) return true
      if (visited.has(stepId)) return false
      visited.add(stepId)

      const step = chain.steps.find(s => s.id === stepId)
      if (!step || step.dependencies.length === 0) return false

      return step.dependencies.some(depId => dfs(depId))
    }

    return dfs(targetStepId)
  }

  /**
   * Identify logical fallacies in the inference chain
   */
  private async identifyFallacies(
    chain: InferenceChain,
    context?: InferenceContext
  ): Promise<LogicalFallacy[]> {
    const fallacies: LogicalFallacy[] = []

    for (const step of chain.steps) {
      // Check against known fallacy patterns
      for (const [fallacyName, patterns] of this.fallacyPatterns) {
        for (const pattern of patterns) {
          if (pattern.test(step.statement)) {
            fallacies.push(this.createFallacy(fallacyName, step))
          }
        }
      }

      // Use AI for more sophisticated fallacy detection
      if (step.type === 'conclusion' || step.type === 'intermediate') {
        const aiFallacies = await this.detectFallaciesWithAI(step, chain, context)
        fallacies.push(...aiFallacies)
      }
    }

    return this.deduplicateFallacies(fallacies)
  }

  /**
   * Create a fallacy object from a detected pattern
   */
  private createFallacy(fallacyType: string, step: InferenceStep): LogicalFallacy {
    const fallacyInfo: Record<string, { name: string; category: FallacyCategory; description: string }> = {
      ad_hominem: {
        name: 'Ad Hominem',
        category: 'relevance',
        description: 'Attacking the person instead of the argument'
      },
      straw_man: {
        name: 'Straw Man',
        category: 'relevance',
        description: 'Misrepresenting an argument to make it easier to attack'
      },
      false_dichotomy: {
        name: 'False Dichotomy',
        category: 'presumption',
        description: 'Presenting only two options when more exist'
      },
      slippery_slope: {
        name: 'Slippery Slope',
        category: 'causal',
        description: 'Assuming a small step will lead to an extreme outcome'
      },
      circular_reasoning: {
        name: 'Circular Reasoning',
        category: 'presumption',
        description: 'Using the conclusion to prove the conclusion'
      },
      appeal_to_authority: {
        name: 'Appeal to Authority',
        category: 'relevance',
        description: 'Using authority as evidence without proper support'
      },
      hasty_generalization: {
        name: 'Hasty Generalization',
        category: 'inductive',
        description: 'Drawing a conclusion from insufficient evidence'
      },
      post_hoc: {
        name: 'Post Hoc Ergo Propter Hoc',
        category: 'causal',
        description: 'Assuming causation from mere correlation'
      }
    }

    const info = fallacyInfo[fallacyType] || {
      name: fallacyType,
      category: 'formal' as FallacyCategory,
      description: 'A logical fallacy was detected'
    }

    return {
      id: `fallacy_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      name: info.name,
      category: info.category,
      formalName: fallacyType,
      description: info.description,
      detectedIn: step.statement,
      stepId: step.id,
      reason: `Pattern match for ${info.name}`,
      severity: 'medium'
    }
  }

  /**
   * Use AI to detect more subtle fallacies
   */
  private async detectFallaciesWithAI(
    step: InferenceStep,
    chain: InferenceChain,
    context?: InferenceContext
  ): Promise<LogicalFallacy[]> {
    const fallacies: LogicalFallacy[] = []

    // Get the reasoning path to this step
    const path = this.getReasoningPath(chain, step.id)
    const pathStatements = path.map(s => s.statement).join('\n')

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are an expert at detecting logical fallacies. Analyze the reasoning and identify any fallacies.
                      For each fallacy found, respond with:
                      FALLACY: [name]
                      REASON: [why it's a fallacy]
                      SEVERITY: [low/medium/high]`
          },
          {
            role: 'user',
            content: `Analyze this reasoning path for logical fallacies:\n\n${pathStatements}\n\nCurrent step: ${step.statement}`
          }
        ],
        thinking: { type: 'disabled' }
      })

      const response = completion.choices[0]?.message?.content || ''
      const parsedFallacies = this.parseFallaciesFromResponse(response, step)
      fallacies.push(...parsedFallacies)
    } catch (error) {
      // Silent fail for AI-based detection
    }

    return fallacies
  }

  /**
   * Parse fallacies from AI response
   */
  private parseFallaciesFromResponse(response: string, step: InferenceStep): LogicalFallacy[] {
    const fallacies: LogicalFallacy[] = []
    const lines = response.split('\n')
    
    let currentFallacy: Partial<LogicalFallacy> | null = null

    for (const line of lines) {
      if (line.startsWith('FALLACY:')) {
        if (currentFallacy && currentFallacy.name) {
          fallacies.push(this.completeFallacy(currentFallacy, step))
        }
        currentFallacy = {
          name: line.replace('FALLACY:', '').trim()
        }
      } else if (line.startsWith('REASON:') && currentFallacy) {
        currentFallacy.reason = line.replace('REASON:', '').trim()
      } else if (line.startsWith('SEVERITY:') && currentFallacy) {
        const severity = line.replace('SEVERITY:', '').trim().toLowerCase()
        currentFallacy.severity = ['low', 'medium', 'high'].includes(severity) 
          ? severity as 'low' | 'medium' | 'high' 
          : 'medium'
      }
    }

    if (currentFallacy && currentFallacy.name) {
      fallacies.push(this.completeFallacy(currentFallacy, step))
    }

    return fallacies
  }

  /**
   * Complete a fallacy object
   */
  private completeFallacy(partial: Partial<LogicalFallacy>, step: InferenceStep): LogicalFallacy {
    return {
      id: `fallacy_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      name: partial.name || 'Unknown Fallacy',
      category: partial.category || 'formal',
      description: partial.description || 'A logical fallacy was detected',
      detectedIn: step.statement,
      stepId: step.id,
      reason: partial.reason || 'Detected during analysis',
      severity: partial.severity || 'medium'
    }
  }

  /**
   * Deduplicate fallacies by name and step
   */
  private deduplicateFallacies(fallacies: LogicalFallacy[]): LogicalFallacy[] {
    const seen = new Set<string>()
    return fallacies.filter(f => {
      const key = `${f.name}_${f.stepId}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  /**
   * Validate conditional reasoning (if-then statements)
   */
  private async validateConditionalReasoning(
    chain: InferenceChain
  ): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = []

    for (const step of chain.steps) {
      const statement = step.statement.toLowerCase()
      
      // Check for conditional statements
      if (statement.includes('if ') && (statement.includes(' then ') || statement.includes(', '))) {
        const conditionalValidation = await this.validateConditionalStatement(step, chain)
        issues.push(...conditionalValidation)
      }

      // Check for modus ponens / modus tollens validity
      if (step.type === 'deduction') {
        const modusIssues = await this.validateModusPatterns(step, chain)
        issues.push(...modusIssues)
      }
    }

    return issues
  }

  /**
   * Validate a conditional statement
   */
  private async validateConditionalStatement(
    step: InferenceStep,
    chain: InferenceChain
  ): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = []

    // Parse the conditional
    const statement = step.statement
    const ifMatch = statement.match(/if\s+(.+?)(?:\s+then|\s*,)\s+(.+)/i)

    if (ifMatch) {
      const antecedent = ifMatch[1].trim()
      const consequent = ifMatch[2].trim()

      // Check if antecedent is actually established
      const antecedentEstablished = await this.isStatementEstablished(antecedent, chain, step.id)
      
      if (step.type === 'conclusion' && !antecedentEstablished) {
        issues.push({
          type: 'insufficient_evidence',
          severity: 'medium',
          description: `Antecedent "${antecedent}" is not established in the reasoning`,
          suggestion: 'Provide evidence for the antecedent before drawing the conclusion'
        })
      }
    }

    return issues
  }

  /**
   * Check if a statement is established in the chain before a given step
   */
  private async isStatementEstablished(
    statement: string,
    chain: InferenceChain,
    beforeStepId: string
  ): Promise<boolean> {
    const beforeIndex = chain.steps.findIndex(s => s.id === beforeStepId)
    
    for (let i = 0; i < beforeIndex; i++) {
      const step = chain.steps[i]
      if (step.statement.toLowerCase().includes(statement.toLowerCase())) {
        return true
      }
    }

    return false
  }

  /**
   * Validate modus ponens and modus tollens patterns
   */
  private async validateModusPatterns(
    step: InferenceStep,
    chain: InferenceChain
  ): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = []
    
    // Get dependency steps
    const depSteps = step.dependencies
      .map(id => chain.steps.find(s => s.id === id))
      .filter(Boolean) as InferenceStep[]

    // Look for modus ponens: If P then Q, P, therefore Q
    for (const dep of depSteps) {
      const depLower = dep.statement.toLowerCase()
      const stepLower = step.statement.toLowerCase()

      if (depLower.includes('if ') && depLower.includes('then ')) {
        // This is a conditional - check if we're applying modus ponens correctly
        const ifMatch = dep.statement.match(/if\s+(.+?)\s+then\s+(.+)/i)
        
        if (ifMatch) {
          const antecedent = ifMatch[1].toLowerCase().trim()
          const consequent = ifMatch[2].toLowerCase().trim()

          // Check if another dependency establishes the antecedent
          const otherDeps = depSteps.filter(d => d.id !== dep.id)
          const hasAntecedent = otherDeps.some(d => 
            d.statement.toLowerCase().includes(antecedent)
          )

          // If we have the antecedent, check if the conclusion matches the consequent
          if (hasAntecedent && !stepLower.includes(consequent)) {
            issues.push({
              type: 'invalid_deduction',
              severity: 'medium',
              description: 'Modus ponens not applied correctly - conclusion should match consequent',
              suggestion: `The conclusion should be: "${consequent}"`
            })
          }
        }
      }
    }

    return issues
  }

  /**
   * Get the reasoning path to a step
   */
  private getReasoningPath(chain: InferenceChain, stepId: string): InferenceStep[] {
    const path: InferenceStep[] = []
    const visited = new Set<string>()

    const collect = (id: string) => {
      if (visited.has(id)) return
      visited.add(id)

      const step = chain.steps.find(s => s.id === id)
      if (!step) return

      // First collect dependencies
      for (const depId of step.dependencies) {
        collect(depId)
      }

      path.push(step)
    }

    collect(stepId)
    return path
  }

  /**
   * Identify strengths in the reasoning
   */
  private identifyStrengths(chain: InferenceChain): string[] {
    const strengths: string[] = []

    // Check for strong evidence
    const strongEvidence = chain.steps.filter(s => 
      s.evidence.length > 0 && 
      s.evidence.every(e => e.weight >= 0.7)
    )
    if (strongEvidence.length > 0) {
      strengths.push(`${strongEvidence.length} steps have strong supporting evidence`)
    }

    // Check for clear premises
    const premises = chain.steps.filter(s => s.type === 'premise')
    if (premises.length >= 2) {
      strengths.push('Multiple premises provide a solid foundation')
    }

    // Check for high confidence
    if (chain.confidence >= 0.8) {
      strengths.push('High overall confidence in the reasoning')
    }

    // Check for proper structure
    const hasConclusion = chain.steps.some(s => s.type === 'conclusion')
    if (hasConclusion) {
      strengths.push('Clear conclusion derived from premises')
    }

    return strengths
  }

  /**
   * Generate suggestions based on issues and fallacies
   */
  private generateSuggestions(issues: ValidationIssue[], fallacies: LogicalFallacy[]): string[] {
    const suggestions: string[] = []

    for (const issue of issues.filter(i => i.severity === 'critical' || i.severity === 'high')) {
      if (issue.suggestion) {
        suggestions.push(issue.suggestion)
      }
    }

    for (const fallacy of fallacies) {
      suggestions.push(`Address the ${fallacy.name} fallacy in step ${fallacy.stepId}`)
    }

    return [...new Set(suggestions)]
  }

  // ===========================================================================
  // CONSISTENCY VALIDATION
  // ===========================================================================

  /**
   * Validate the consistency of an inference chain
   * 
   * @param chain - The inference chain to validate
   * @param context - Optional context for validation
   * @returns Consistency validation result
   */
  async validateConsistency(
    chain: InferenceChain,
    context?: InferenceContext
  ): Promise<ConsistencyResult> {
    await this.init()

    const contradictions: Contradiction[] = []
    const temporalIssues: TemporalIssue[] = []
    const causalIssues: CausalIssue[] = []
    const scopeIssues: ScopeIssue[] = []

    // 1. Check for contradictions
    const detectedContradictions = await this.detectContradictions(chain)
    contradictions.push(...detectedContradictions)

    // 2. Verify temporal consistency
    const detectedTemporal = await this.verifyTemporalConsistency(chain)
    temporalIssues.push(...detectedTemporal)

    // 3. Validate causal relationships
    const detectedCausal = await this.validateCausalRelationships(chain)
    causalIssues.push(...detectedCausal)

    // 4. Check scope consistency
    const detectedScope = await this.checkScopeConsistency(chain, context)
    scopeIssues.push(...detectedScope)

    // Calculate consistency score
    const criticalCount = contradictions.filter(c => c.severity === 'critical').length
    const highCount = contradictions.filter(c => c.severity === 'high').length +
                      temporalIssues.filter(t => t.type === 'impossible_sequence').length +
                      causalIssues.length

    let score = 1.0
    score -= criticalCount * 0.3
    score -= highCount * 0.15
    score -= temporalIssues.length * 0.05
    score -= scopeIssues.length * 0.05
    score = Math.max(0, score)

    const isConsistent = criticalCount === 0 && highCount === 0

    // Generate recommendations
    const recommendations = this.generateConsistencyRecommendations(
      contradictions,
      temporalIssues,
      causalIssues,
      scopeIssues
    )

    return {
      id: `consistency_${Date.now().toString(36)}`,
      chainId: chain.id,
      isConsistent,
      consistencyScore: score,
      contradictions,
      temporalIssues,
      causalIssues,
      scopeIssues,
      recommendations,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Detect contradictions in the inference chain
   */
  private async detectContradictions(chain: InferenceChain): Promise<Contradiction[]> {
    const contradictions: Contradiction[] = []

    for (let i = 0; i < chain.steps.length; i++) {
      for (let j = i + 1; j < chain.steps.length; j++) {
        const stepA = chain.steps[i]
        const stepB = chain.steps[j]

        // Check for direct contradiction using pattern matching
        const directContradiction = this.checkDirectContradiction(stepA, stepB)
        if (directContradiction) {
          contradictions.push(directContradiction)
          continue
        }

        // Check for semantic contradiction using AI
        const semanticContradiction = await this.checkSemanticContradiction(stepA, stepB)
        if (semanticContradiction) {
          contradictions.push(semanticContradiction)
        }
      }
    }

    return contradictions
  }

  /**
   * Check for direct contradiction between two statements
   */
  private checkDirectContradiction(stepA: InferenceStep, stepB: InferenceStep): Contradiction | null {
    const statementA = stepA.statement.toLowerCase()
    const statementB = stepB.statement.toLowerCase()

    // Check for negation patterns
    const negationPatterns = [
      { pattern: /^(not|isn't|are not|cannot|can't|won't|doesn't|don't)\s+/i, base: '' }
    ]

    for (const { pattern } of negationPatterns) {
      const aNegated = pattern.test(statementA)
      const bNegated = pattern.test(statementB)

      if (aNegated !== bNegated) {
        // One is negated, check if they're talking about the same thing
        const aBase = statementA.replace(pattern, '').trim()
        const bBase = statementB.replace(pattern, '').trim()

        if (aBase === bBase || this.similarMeaning(aBase, bBase)) {
          return {
            id: `contradiction_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
            type: 'direct',
            severity: 'high',
            statementA: stepA.statement,
            statementB: stepB.statement,
            stepIdA: stepA.id,
            stepIdB: stepB.id,
            explanation: 'One statement affirms while the other negates the same proposition',
            resolution: 'Resolve by determining which statement is correct or if context differs'
          }
        }
      }
    }

    // Check for opposite terms
    const opposites: Array<[string, string]> = [
      ['always', 'never'],
      ['must', 'must not'],
      ['should', 'should not'],
      ['true', 'false'],
      ['correct', 'incorrect'],
      ['valid', 'invalid'],
      ['possible', 'impossible'],
      ['required', 'forbidden']
    ]

    for (const [term1, term2] of opposites) {
      if (statementA.includes(term1) && statementB.includes(term2)) {
        // Check if they're talking about the same subject
        const subjectA = this.extractSubject(statementA, term1)
        const subjectB = this.extractSubject(statementB, term2)

        if (subjectA === subjectB) {
          return {
            id: `contradiction_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
            type: 'direct',
            severity: 'high',
            statementA: stepA.statement,
            statementB: stepB.statement,
            stepIdA: stepA.id,
            stepIdB: stepB.id,
            explanation: `Opposite qualifiers "${term1}" and "${term2}" applied to the same subject`,
            resolution: 'Clarify the conditions under which each statement applies'
          }
        }
      }
    }

    return null
  }

  /**
   * Check if two phrases have similar meaning
   */
  private similarMeaning(phraseA: string, phraseB: string): boolean {
    // Simple similarity check
    const wordsA = new Set(phraseA.toLowerCase().split(/\s+/))
    const wordsB = new Set(phraseB.toLowerCase().split(/\s+/))
    
    const intersection = [...wordsA].filter(w => wordsB.has(w)).length
    const union = wordsA.size + wordsB.size - intersection
    
    return union > 0 && intersection / union > 0.7
  }

  /**
   * Extract the subject from a statement before a term
   */
  private extractSubject(statement: string, term: string): string {
    const index = statement.indexOf(term)
    if (index === -1) return statement
    return statement.substring(0, index).trim()
  }

  /**
   * Check for semantic contradiction using AI
   */
  private async checkSemanticContradiction(
    stepA: InferenceStep,
    stepB: InferenceStep
  ): Promise<Contradiction | null> {
    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a logic expert. Determine if these two statements contradict each other.
                      Respond with CONTRADICTS or CONSISTENT followed by a brief explanation.`
          },
          {
            role: 'user',
            content: `Statement A: ${stepA.statement}\nStatement B: ${stepB.statement}\n\nDo these statements contradict?`
          }
        ],
        thinking: { type: 'disabled' }
      })

      const response = completion.choices[0]?.message?.content || ''
      
      if (response.toLowerCase().includes('contradicts')) {
        return {
          id: `contradiction_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
          type: 'semantic',
          severity: 'medium',
          statementA: stepA.statement,
          statementB: stepB.statement,
          stepIdA: stepA.id,
          stepIdB: stepB.id,
          explanation: response,
          resolution: 'Review both statements for potential resolution'
        }
      }
    } catch (error) {
      // Silent fail for AI-based detection
    }

    return null
  }

  /**
   * Verify temporal consistency in the chain
   */
  private async verifyTemporalConsistency(chain: InferenceChain): Promise<TemporalIssue[]> {
    const issues: TemporalIssue[] = []

    // Look for temporal markers
    const temporalMarkers = ['before', 'after', 'during', 'while', 'when', 'then', 'next', 'finally', 'first', 'last']
    
    const stepsWithTemporal = chain.steps.filter(s =>
      temporalMarkers.some(m => s.statement.toLowerCase().includes(m))
    )

    // Check ordering violations
    for (let i = 0; i < stepsWithTemporal.length; i++) {
      for (let j = i + 1; j < stepsWithTemporal.length; j++) {
        const stepA = stepsWithTemporal[i]
        const stepB = stepsWithTemporal[j]

        const orderingIssue = this.checkTemporalOrdering(stepA, stepB, chain)
        if (orderingIssue) {
          issues.push(orderingIssue)
        }
      }
    }

    return issues
  }

  /**
   * Check temporal ordering between steps
   */
  private checkTemporalOrdering(
    stepA: InferenceStep,
    stepB: InferenceStep,
    chain: InferenceChain
  ): TemporalIssue | null {
    const statementA = stepA.statement.toLowerCase()
    const statementB = stepB.statement.toLowerCase()

    // Check for "after" mentions
    if (statementA.includes('after')) {
      const afterMatch = statementA.match(/after\s+(.+)/)
      if (afterMatch) {
        const reference = afterMatch[1].trim()
        // Check if the referenced event comes after stepA in the chain
        const referencedStep = chain.steps.find(s =>
          s.id !== stepA.id && s.statement.toLowerCase().includes(reference)
        )
        
        if (referencedStep) {
          const indexA = chain.steps.findIndex(s => s.id === stepA.id)
          const indexRef = chain.steps.findIndex(s => s.id === referencedStep.id)
          
          if (indexA < indexRef) {
            return {
              id: `temporal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
              type: 'ordering_violation',
              description: `Step mentions "after ${reference}" but the referenced step appears later in the chain`,
              affectedSteps: [stepA.id, referencedStep.id],
              expectedOrder: [referencedStep.id, stepA.id],
              actualOrder: [stepA.id, referencedStep.id],
              resolution: 'Reorder steps to match temporal requirements'
            }
          }
        }
      }
    }

    return null
  }

  /**
   * Validate causal relationships in the chain
   */
  private async validateCausalRelationships(chain: InferenceChain): Promise<CausalIssue[]> {
    const issues: CausalIssue[] = []

    const causalMarkers = ['because', 'causes', 'leads to', 'results in', 'due to', 'therefore', 'so']

    for (const step of chain.steps) {
      const statement = step.statement.toLowerCase()

      for (const marker of causalMarkers) {
        if (statement.includes(marker)) {
          const issue = await this.validateCausalStatement(step, marker, chain)
          if (issue) {
            issues.push(issue)
          }
        }
      }
    }

    return issues
  }

  /**
   * Validate a single causal statement
   */
  private async validateCausalStatement(
    step: InferenceStep,
    marker: string,
    chain: InferenceChain
  ): Promise<CausalIssue | null> {
    const statement = step.statement

    // Parse cause and effect
    let cause = ''
    let effect = ''

    if (marker === 'because') {
      const parts = statement.split(/because/i)
      if (parts.length === 2) {
        effect = parts[0].trim()
        cause = parts[1].trim()
      }
    } else if (marker === 'therefore' || marker === 'so') {
      const parts = statement.split(new RegExp(marker, 'i'))
      if (parts.length === 2) {
        cause = parts[0].trim()
        effect = parts[1].trim()
      }
    } else {
      const parts = statement.split(new RegExp(marker, 'i'))
      if (parts.length === 2) {
        cause = parts[0].trim()
        effect = parts[1].trim()
      }
    }

    if (!cause || !effect) return null

    // Check for potential issues
    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a causal reasoning expert. Analyze whether this causal relationship is valid:
                      Cause: ${cause}
                      Effect: ${effect}
                      
                      Check for:
                      1. Is the cause sufficient for the effect?
                      2. Is this correlation being mistaken for causation?
                      3. Is there a reverse causality issue?
                      4. Is the causation oversimplified?
                      
                      Respond with VALID or INVALID followed by a brief reason.`
          },
          {
            role: 'user',
            content: `Analyze the causal relationship: ${statement}`
          }
        ],
        thinking: { type: 'disabled' }
      })

      const response = completion.choices[0]?.message?.content || ''
      
      if (response.toLowerCase().includes('invalid')) {
        let issueType: CausalIssueType = 'false_causality'
        
        if (response.toLowerCase().includes('reverse')) {
          issueType = 'reverse_causality'
        } else if (response.toLowerCase().includes('oversimpl')) {
          issueType = 'causal_oversimplification'
        } else if (response.toLowerCase().includes('insufficient')) {
          issueType = 'insufficient_cause'
        }

        return {
          id: `causal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
          type: issueType,
          description: `Potential causal reasoning issue: ${response}`,
          cause,
          effect,
          reason: response,
          affectedSteps: [step.id],
          resolution: 'Provide additional evidence for the causal relationship'
        }
      }
    } catch (error) {
      // Silent fail for AI-based validation
    }

    return null
  }

  /**
   * Check scope consistency
   */
  private async checkScopeConsistency(
    chain: InferenceChain,
    context?: InferenceContext
  ): Promise<ScopeIssue[]> {
    const issues: ScopeIssue[] = []

    // Check for generalization errors
    for (const step of chain.steps) {
      const statement = step.statement.toLowerCase()

      // Check for hasty generalizations
      const generalizationPatterns = [
        /all\s+\w+\s+are/i,
        /every\s+\w+\s+is/i,
        /always\s+/i,
        /never\s+/i
      ]

      for (const pattern of generalizationPatterns) {
        if (pattern.test(statement)) {
          // Check if this is supported by evidence
          const hasEvidence = step.evidence.length > 0
          const isPremise = step.type === 'premise' || step.type === 'axiom'

          if (!hasEvidence && !isPremise) {
            issues.push({
              id: `scope_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
              type: 'generalization_error',
              description: 'Broad generalization without supporting evidence',
              violatedScope: 'individual to universal',
              violatingStatement: step.statement,
              stepId: step.id,
              resolution: 'Provide specific instances as evidence or qualify the statement'
            })
          }
        }
      }

      // Check for context violations if context is provided
      if (context?.domain) {
        const domainKeywords = this.getDomainKeywords(context.domain)
        const statementHasDomainRelevance = domainKeywords.some(kw =>
          statement.includes(kw.toLowerCase())
        )

        if (!statementHasDomainRelevance && step.type !== 'premise') {
          issues.push({
            id: `scope_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
            type: 'domain_mismatch',
            description: `Statement may be outside the domain of "${context.domain}"`,
            violatedScope: context.domain,
            violatingStatement: step.statement,
            stepId: step.id,
            resolution: 'Verify relevance to the current domain or expand the scope'
          })
        }
      }
    }

    return issues
  }

  /**
   * Get domain-specific keywords
   */
  private getDomainKeywords(domain: string): string[] {
    const domainKeywords: Record<string, string[]> = {
      'software': ['code', 'function', 'variable', 'class', 'method', 'module', 'api', 'test'],
      'business': ['revenue', 'cost', 'profit', 'customer', 'market', 'strategy'],
      'science': ['hypothesis', 'experiment', 'data', 'result', 'theory', 'observation'],
      'default': []
    }

    return domainKeywords[domain.toLowerCase()] || domainKeywords['default']
  }

  /**
   * Generate consistency recommendations
   */
  private generateConsistencyRecommendations(
    contradictions: Contradiction[],
    temporalIssues: TemporalIssue[],
    causalIssues: CausalIssue[],
    scopeIssues: ScopeIssue[]
  ): string[] {
    const recommendations: string[] = []

    if (contradictions.length > 0) {
      recommendations.push('Resolve contradictions by clarifying context or correcting statements')
    }

    if (temporalIssues.some(t => t.type === 'ordering_violation')) {
      recommendations.push('Reorder steps to respect temporal dependencies')
    }

    if (causalIssues.length > 0) {
      recommendations.push('Strengthen causal claims with additional evidence')
    }

    if (scopeIssues.some(s => s.type === 'generalization_error')) {
      recommendations.push('Support generalizations with specific evidence or qualify statements')
    }

    return recommendations
  }

  // ===========================================================================
  // CONFLICT DETECTION
  // ===========================================================================

  /**
   * Detect conflicts in an inference chain
   * 
   * @param chain - The inference chain to analyze
   * @param options - Options for conflict detection
   * @returns Array of detected conflicts
   */
  async detectConflicts(
    chain: InferenceChain,
    options?: ConflictDetectionOptions
  ): Promise<Conflict[]> {
    await this.init()

    const conflicts: Conflict[] = []
    const minSeverity = options?.minSeverity || 'low'
    const severityOrder = ['low', 'medium', 'high', 'critical']

    // 1. Find contradictory statements
    const statementConflicts = await this.findContradictoryStatementConflicts(chain)
    conflicts.push(...statementConflicts)

    // 2. Identify resource conflicts
    const resourceConflicts = await this.identifyResourceConflicts(chain)
    conflicts.push(...resourceConflicts)

    // 3. Detect goal conflicts
    const goalConflicts = await this.detectGoalConflicts(chain)
    conflicts.push(...goalConflicts)

    // 4. Find assumption conflicts
    const assumptionConflicts = await this.findAssumptionConflicts(chain)
    conflicts.push(...assumptionConflicts)

    // Filter by minimum severity
    const minIndex = severityOrder.indexOf(minSeverity)
    const filteredConflicts = conflicts.filter(c => 
      severityOrder.indexOf(c.severity) >= minIndex
    )

    // Attempt auto-resolution if requested
    if (options?.attemptAutoResolution) {
      for (const conflict of filteredConflicts) {
        if (conflict.autoResolvable) {
          await this.attemptAutoResolution(conflict, chain)
        }
      }
    }

    return filteredConflicts
  }

  /**
   * Find conflicts from contradictory statements
   */
  private async findContradictoryStatementConflicts(chain: InferenceChain): Promise<Conflict[]> {
    const conflicts: Conflict[] = []

    // Get contradictions from consistency check
    const contradictions = await this.detectContradictions(chain)

    for (const contradiction of contradictions) {
      const conflict: Conflict = {
        id: `conflict_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
        type: 'contradictory_statement',
        severity: contradiction.severity,
        description: contradiction.explanation,
        parties: [
          {
            type: 'statement',
            id: contradiction.stepIdA,
            name: contradiction.statementA,
            requirements: [contradiction.statementA],
            sourceStepId: contradiction.stepIdA
          },
          {
            type: 'statement',
            id: contradiction.stepIdB,
            name: contradiction.statementB,
            requirements: [contradiction.statementB],
            sourceStepId: contradiction.stepIdB
          }
        ],
        impact: 'Undermines the validity of the reasoning chain',
        resolutions: this.generateStatementConflictResolutions(contradiction),
        autoResolvable: contradiction.severity !== 'critical',
        detectedAt: new Date().toISOString()
      }

      conflicts.push(conflict)
    }

    return conflicts
  }

  /**
   * Generate resolutions for statement conflicts
   */
  private generateStatementConflictResolutions(contradiction: Contradiction): ConflictResolution[] {
    const resolutions: ConflictResolution[] = []

    if (contradiction.resolution) {
      resolutions.push({
        type: 'compromise',
        description: contradiction.resolution,
        impact: 'Resolves the contradiction',
        confidence: 0.7,
        implementationSteps: [
          `Review statement: "${contradiction.statementA}"`,
          `Review statement: "${contradiction.statementB}"`,
          'Determine which is correct or if context differs'
        ]
      })
    }

    resolutions.push({
      type: 'eliminate',
      description: 'Remove or qualify one of the contradictory statements',
      impact: 'Eliminates the conflict but may affect reasoning completeness',
      confidence: 0.6
    })

    return resolutions
  }

  /**
   * Identify resource conflicts in the chain
   */
  private async identifyResourceConflicts(chain: InferenceChain): Promise<Conflict[]> {
    const conflicts: Conflict[] = []

    // Look for resource requirements in statements
    const resourcePatterns = [
      /requires?\s+(.+?)(?:\s+to|\s+for|\.|$)/i,
      /needs?\s+(.+?)(?:\s+to|\s+for|\.|$)/i,
      /uses?\s+(.+?)(?:\s+to|\s+for|\.|$)/i,
      /consumes?\s+(.+?)(?:\s+to|\s+for|\.|$)/i
    ]

    const resourceRequirements: Map<string, InferenceStep[]> = new Map()

    for (const step of chain.steps) {
      for (const pattern of resourcePatterns) {
        const match = step.statement.match(pattern)
        if (match) {
          const resource = match[1].trim().toLowerCase()
          const existing = resourceRequirements.get(resource) || []
          existing.push(step)
          resourceRequirements.set(resource, existing)
        }
      }
    }

    // Find conflicts where multiple steps need the same exclusive resource
    for (const [resource, steps] of resourceRequirements) {
      if (steps.length > 1) {
        const exclusiveResources = ['database', 'file', 'port', 'lock', 'connection']
        const isExclusive = exclusiveResources.some(r => resource.includes(r))

        if (isExclusive) {
          conflicts.push({
            id: `conflict_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
            type: 'resource_contention',
            severity: 'high',
            description: `Multiple steps require exclusive access to "${resource}"`,
            parties: steps.map(s => ({
              type: 'resource' as const,
              id: s.id,
              name: s.statement.slice(0, 50),
              requirements: [resource],
              sourceStepId: s.id
            })),
            impact: 'May cause race conditions or deadlock',
            resolutions: [
              {
                type: 'reorder',
                description: 'Execute steps sequentially to avoid resource contention',
                impact: 'Increases total execution time but ensures safe access',
                confidence: 0.9,
                implementationSteps: ['Order steps that use this resource', 'Add synchronization if needed']
              },
              {
                type: 'resource_allocation',
                description: 'Allocate separate instances of the resource',
                impact: 'Requires additional resources but allows parallel execution',
                confidence: 0.7
              }
            ],
            autoResolvable: true,
            detectedAt: new Date().toISOString()
          })
        }
      }
    }

    return conflicts
  }

  /**
   * Detect goal conflicts in the chain
   */
  private async detectGoalConflicts(chain: InferenceChain): Promise<Conflict[]> {
    const conflicts: Conflict[] = []

    // Look for goal-related statements
    const goalPatterns = [
      /goal\s+(?:is\s+)?(?:to\s+)?(.+)/i,
      /objective\s+(?:is\s+)?(?:to\s+)?(.+)/i,
      /aim\s+(?:is\s+)?(?:to\s+)?(.+)/i,
      /want\s+(?:to\s+)?(.+)/i,
      /trying\s+(?:to\s+)?(.+)/i
    ]

    const goals: Array<{ statement: string; step: InferenceStep }> = []

    for (const step of chain.steps) {
      for (const pattern of goalPatterns) {
        const match = step.statement.match(pattern)
        if (match) {
          goals.push({
            statement: match[1].trim(),
            step
          })
        }
      }
    }

    // Check for conflicting goals
    for (let i = 0; i < goals.length; i++) {
      for (let j = i + 1; j < goals.length; j++) {
        const goalA = goals[i]
        const goalB = goals[j]

        const conflict = await this.checkGoalConflict(goalA, goalB)
        if (conflict) {
          conflicts.push(conflict)
        }
      }
    }

    return conflicts
  }

  /**
   * Check if two goals conflict
   */
  private async checkGoalConflict(
    goalA: { statement: string; step: InferenceStep },
    goalB: { statement: string; step: InferenceStep }
  ): Promise<Conflict | null> {
    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a goal conflict analyzer. Determine if these two goals conflict:
                      Goal A: ${goalA.statement}
                      Goal B: ${goalB.statement}
                      
                      Goals conflict if:
                      1. Achieving one prevents achieving the other
                      2. They require mutually exclusive resources
                      3. They have opposing success criteria
                      
                      Respond with CONFLICTS or COMPATIBLE followed by a brief reason.`
          },
          {
            role: 'user',
            content: 'Do these goals conflict?'
          }
        ],
        thinking: { type: 'disabled' }
      })

      const response = completion.choices[0]?.message?.content || ''
      
      if (response.toLowerCase().includes('conflicts')) {
        return {
          id: `conflict_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
          type: 'goal_conflict',
          severity: 'high',
          description: `Goals conflict: ${response}`,
          parties: [
            {
              type: 'goal',
              id: goalA.step.id,
              name: goalA.statement,
              requirements: [goalA.statement],
              sourceStepId: goalA.step.id
            },
            {
              type: 'goal',
              id: goalB.step.id,
              name: goalB.statement,
              requirements: [goalB.statement],
              sourceStepId: goalB.step.id
            }
          ],
          impact: 'May prevent successful completion of the reasoning chain',
          resolutions: [
            {
              type: 'prioritize',
              description: 'Prioritize one goal over the other',
              impact: 'One goal may not be fully achieved',
              confidence: 0.7
            },
            {
              type: 'compromise',
              description: 'Find a compromise that partially satisfies both goals',
              impact: 'Both goals may be partially achieved',
              confidence: 0.6
            }
          ],
          autoResolvable: false,
          detectedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      // Silent fail for AI-based detection
    }

    return null
  }

  /**
   * Find assumption conflicts
   */
  private async findAssumptionConflicts(chain: InferenceChain): Promise<Conflict[]> {
    const conflicts: Conflict[] = []

    // Find all assumption steps
    const assumptions = chain.steps.filter(s => s.type === 'assumption')

    for (let i = 0; i < assumptions.length; i++) {
      for (let j = i + 1; j < assumptions.length; j++) {
        const assumptionA = assumptions[i]
        const assumptionB = assumptions[j]

        const conflict = await this.checkAssumptionConflict(assumptionA, assumptionB)
        if (conflict) {
          conflicts.push(conflict)
        }
      }
    }

    // Check if assumptions contradict known facts
    const premises = chain.steps.filter(s => s.type === 'premise')
    for (const assumption of assumptions) {
      for (const premise of premises) {
        const conflict = await this.checkAssumptionPremiseConflict(assumption, premise)
        if (conflict) {
          conflicts.push(conflict)
        }
      }
    }

    return conflicts
  }

  /**
   * Check if two assumptions conflict
   */
  private async checkAssumptionConflict(
    assumptionA: InferenceStep,
    assumptionB: InferenceStep
  ): Promise<Conflict | null> {
    // Check for direct negation
    const statementA = assumptionA.statement.toLowerCase()
    const statementB = assumptionB.statement.toLowerCase()

    // Simple check for opposite assumptions
    const opposites: Array<[RegExp, RegExp]> = [
      [/assume\s+(.+\s+)?exists/i, /assume\s+(.+\s+)?does\s+not\s+exist/i],
      [/assume\s+(.+\s+)?is\s+true/i, /assume\s+(.+\s+)?is\s+false/i],
      [/assume\s+(.+\s+)?works/i, /assume\s+(.+\s+)?fails/i]
    ]

    for (const [patternA, patternB] of opposites) {
      if ((patternA.test(statementA) && patternB.test(statementB)) ||
          (patternB.test(statementA) && patternA.test(statementB))) {
        return {
          id: `conflict_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
          type: 'assumption_conflict',
          severity: 'high',
          description: 'Conflicting assumptions detected',
          parties: [
            {
              type: 'assumption',
              id: assumptionA.id,
              name: assumptionA.statement,
              requirements: [assumptionA.statement],
              sourceStepId: assumptionA.id
            },
            {
              type: 'assumption',
              id: assumptionB.id,
              name: assumptionB.statement,
              requirements: [assumptionB.statement],
              sourceStepId: assumptionB.id
            }
          ],
          impact: 'Invalidates reasoning that depends on both assumptions',
          resolutions: [
            {
              type: 'eliminate',
              description: 'Remove one of the conflicting assumptions',
              impact: 'Reasoning will be based on consistent assumptions',
              confidence: 0.8
            }
          ],
          autoResolvable: true,
          detectedAt: new Date().toISOString()
        }
      }
    }

    return null
  }

  /**
   * Check if an assumption conflicts with a premise
   */
  private async checkAssumptionPremiseConflict(
    assumption: InferenceStep,
    premise: InferenceStep
  ): Promise<Conflict | null> {
    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a logic analyzer. Determine if this assumption contradicts this premise:
                      Premise: ${premise.statement}
                      Assumption: ${assumption.statement}
                      
                      Respond with CONFLICTS or COMPATIBLE followed by a brief reason.`
          },
          {
            role: 'user',
            content: 'Do these conflict?'
          }
        ],
        thinking: { type: 'disabled' }
      })

      const response = completion.choices[0]?.message?.content || ''
      
      if (response.toLowerCase().includes('conflicts')) {
        return {
          id: `conflict_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
          type: 'assumption_conflict',
          severity: 'critical',
          description: `Assumption contradicts known premise: ${response}`,
          parties: [
            {
              type: 'assumption',
              id: assumption.id,
              name: assumption.statement,
              requirements: [assumption.statement],
              sourceStepId: assumption.id
            },
            {
              type: 'statement',
              id: premise.id,
              name: premise.statement,
              requirements: [premise.statement],
              sourceStepId: premise.id
            }
          ],
          impact: 'Invalidates the reasoning chain',
          resolutions: [
            {
              type: 'eliminate',
              description: 'Remove the contradictory assumption',
              impact: 'Restores consistency with known facts',
              confidence: 0.9
            }
          ],
          autoResolvable: true,
          detectedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      // Silent fail for AI-based detection
    }

    return null
  }

  /**
   * Attempt to auto-resolve a conflict
   */
  private async attemptAutoResolution(conflict: Conflict, chain: InferenceChain): Promise<void> {
    // This would integrate with the chain modification logic
    // For now, we just mark that auto-resolution was attempted
    console.log(`[LogicalInference] Auto-resolution attempted for conflict ${conflict.id}`)
  }

  // ===========================================================================
  // CHAIN MANAGEMENT
  // ===========================================================================

  /**
   * Create a new inference chain
   */
  async createChain(
    goal: string,
    premises: string[],
    context?: InferenceContext
  ): Promise<InferenceChain> {
    const chainId = `chain_${Date.now().toString(36)}`
    const steps: InferenceStep[] = []

    // Create premise steps
    for (let i = 0; i < premises.length; i++) {
      steps.push({
        id: `step_${i + 1}`,
        type: 'premise',
        statement: premises[i],
        confidence: 1.0,
        dependencies: [],
        evidence: [],
        timestamp: new Date().toISOString()
      })
    }

    const chain: InferenceChain = {
      id: chainId,
      goal,
      steps,
      conclusion: {
        statement: '',
        confidence: 0,
        derivation: '',
        keyEvidence: [],
        assumptions: [],
        limitations: []
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalSteps: steps.length,
        premiseCount: premises.length,
        intermediateCount: 0,
        depth: 1,
        processingTime: 0,
        domain: context?.domain
      },
      isValid: true,
      confidence: 1.0
    }

    this.chainStore.set(chainId, chain)
    return chain
  }

  /**
   * Add a step to an inference chain
   */
  addStep(
    chainId: string,
    type: InferenceStepType,
    statement: string,
    dependencies: string[] = [],
    evidence: InferenceEvidence[] = [],
    confidence: number = 0.8
  ): InferenceStep | null {
    const chain = this.chainStore.get(chainId)
    if (!chain) return null

    const step: InferenceStep = {
      id: `step_${chain.steps.length + 1}_${Date.now().toString(36)}`,
      type,
      statement,
      confidence,
      dependencies,
      evidence,
      timestamp: new Date().toISOString()
    }

    chain.steps.push(step)
    chain.metadata.totalSteps++
    chain.metadata.updatedAt = new Date().toISOString()

    if (type === 'intermediate') {
      chain.metadata.intermediateCount++
    }

    return step
  }

  /**
   * Get a stored inference chain
   */
  getChain(chainId: string): InferenceChain | undefined {
    return this.chainStore.get(chainId)
  }

  /**
   * Get all stored chains
   */
  getAllChains(): InferenceChain[] {
    return Array.from(this.chainStore.values())
  }
}

// ============================================================================
// SINGLETON AND CONVENIENCE FUNCTIONS
// ============================================================================

let inferenceEngineInstance: LogicalInferenceEngine | null = null

/**
 * Get the singleton inference engine instance
 */
export function getInferenceEngine(): LogicalInferenceEngine {
  if (!inferenceEngineInstance) {
    inferenceEngineInstance = new LogicalInferenceEngine()
  }
  return inferenceEngineInstance
}

/**
 * Convenience function to check inference validity
 */
export async function checkInference(
  chain: InferenceChain,
  context?: InferenceContext
): Promise<InferenceCheckResult> {
  const engine = getInferenceEngine()
  return engine.checkInference(chain, context)
}

/**
 * Convenience function to validate consistency
 */
export async function validateConsistency(
  chain: InferenceChain,
  context?: InferenceContext
): Promise<ConsistencyResult> {
  const engine = getInferenceEngine()
  return engine.validateConsistency(chain, context)
}

/**
 * Convenience function to detect conflicts
 */
export async function detectConflicts(
  chain: InferenceChain,
  options?: ConflictDetectionOptions
): Promise<Conflict[]> {
  const engine = getInferenceEngine()
  return engine.detectConflicts(chain, options)
}
