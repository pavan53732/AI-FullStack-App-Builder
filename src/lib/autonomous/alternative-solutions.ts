/**
 * Alternative Solutions Engine
 * Mechanisms #26-27: Alternative Solution Generator and Reasoning Branch Explorer
 * 
 * This module provides:
 * 1. Alternative Solution Generation - explores different approaches, generates variations,
 *    considers trade-offs, and ranks alternatives by quality
 * 2. Reasoning Branch Exploration - creates reasoning trees, evaluates branch paths,
 *    prunes unproductive branches, and merges convergent paths
 */

import ZAI from 'z-ai-web-dev-sdk'

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Represents a solution to a problem
 */
export interface Solution {
  id: string
  name: string
  description: string
  approach: SolutionApproach
  implementation: string
  complexity: ComplexityLevel
  estimatedEffort: EffortEstimate
  tags: string[]
  metadata: Record<string, unknown>
  createdAt: Date
}

/**
 * Types of solution approaches
 */
export type SolutionApproach = 
  | 'direct'           // Straightforward implementation
  | 'iterative'        // Build incrementally
  | 'recursive'        // Divide and conquer
  | 'functional'       // Functional programming approach
  | 'object_oriented'  // OOP approach
  | 'event_driven'     // Event-based architecture
  | 'declarative'      // Declarative/config-based
  | 'hybrid'           // Combination of approaches

/**
 * Complexity levels
 */
export type ComplexityLevel = 'trivial' | 'low' | 'medium' | 'high' | 'very_high'

/**
 * Effort estimation
 */
export interface EffortEstimate {
  timeHours: number
  linesOfCode: number
  dependencies: number
  riskLevel: RiskLevel
}

export type RiskLevel = 'minimal' | 'low' | 'moderate' | 'significant' | 'high'

/**
 * An alternative solution with evaluation
 */
export interface SolutionAlternative {
  id: string
  solution: Solution
  variations: SolutionVariation[]
  tradeoffs: Tradeoff[]
  ranking: SolutionRanking
  pros: string[]
  cons: string[]
  confidence: number
  selectedReason?: string
}

/**
 * Variation of a base solution
 */
export interface SolutionVariation {
  id: string
  name: string
  description: string
  modifications: string[]
  differentialScore: number // How much better/worse than base
}

/**
 * Tradeoff between competing concerns
 */
export interface Tradeoff {
  id: string
  factor: string
  description: string
  giveUp: string    // What we sacrifice
  gain: string      // What we gain
  impact: 'minor' | 'moderate' | 'significant' | 'critical'
  reversible: boolean
  mitigationStrategy?: string
}

/**
 * Ranking of a solution
 */
export interface SolutionRanking {
  overall: number        // 0-100
  dimensions: Map<RankingDimension, number>
  percentile: number     // Position among all alternatives
  tier: SolutionTier
}

export type RankingDimension = 
  | 'correctness'
  | 'efficiency'
  | 'maintainability'
  | 'scalability'
  | 'security'
  | 'readability'
  | 'testability'
  | 'extensibility'

export type SolutionTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'F'

/**
 * A branch in the reasoning tree
 */
export interface ReasoningBranch {
  id: string
  parentId: string | null
  path: string          // The reasoning path taken
  hypothesis: string
  evidence: BranchEvidence[]
  conclusions: string[]
  children: ReasoningBranch[]
  status: BranchStatus
  evaluation?: BranchEvaluation
  depth: number
  createdAt: Date
  exploredAt?: Date
}

/**
 * Status of a reasoning branch
 */
export type BranchStatus = 
  | 'pending'      // Not yet explored
  | 'exploring'    // Currently being explored
  | 'completed'    // Fully explored
  | 'pruned'       // Cut off as unproductive
  | 'merged'       // Merged with another branch
  | 'failed'       // Exploration failed

/**
 * Evidence supporting a branch
 */
export interface BranchEvidence {
  type: 'fact' | 'inference' | 'observation' | 'rule' | 'counter_example'
  content: string
  source: string
  strength: number     // 0-1
  contradicts?: string // ID of contradicting evidence
}

/**
 * Evaluation of a reasoning branch
 */
export interface BranchEvaluation {
  branchId: string
  viability: number        // 0-1
  potential: number        // 0-1, estimated value of exploring further
  confidence: number       // 0-1
  issues: BranchIssue[]
  recommendations: string[]
  shouldPrune: boolean
  pruneReason?: string
}

/**
 * Issue found in a branch
 */
export interface BranchIssue {
  type: 'contradiction' | 'circular' | 'unsupported' | 'weak' | 'irrelevant'
  description: string
  severity: 'low' | 'medium' | 'high'
  location?: string
}

/**
 * Reasoning tree structure
 */
export interface ReasoningTree {
  id: string
  goal: string
  root: ReasoningBranch
  branches: Map<string, ReasoningBranch>
  depth: number
  totalNodes: number
  prunedNodes: number
  mergedNodes: number
  bestPath: string[]      // IDs of branches in best path
  createdAt: Date
  completedAt?: Date
}

/**
 * Configuration for alternative generation
 */
export interface AlternativeGenerationConfig {
  maxAlternatives: number
  exploreDepth: number
  includeVariations: boolean
  considerTradeoffs: boolean
  rankingWeights: Map<RankingDimension, number>
  aiEnhanced: boolean
}

/**
 * Configuration for branch exploration
 */
export interface BranchExplorationConfig {
  maxDepth: number
  maxBranches: number
  pruneThreshold: number   // Below this viability, prune
  mergeThreshold: number   // Similarity above this, merge
  explorationStrategy: 'breadth_first' | 'depth_first' | 'best_first' | 'beam'
}

/**
 * Result of alternative generation
 */
export interface AlternativeGenerationResult {
  problem: string
  alternatives: SolutionAlternative[]
  bestAlternative: SolutionAlternative
  comparison: AlternativeComparison
  recommendation: string
  generatedAt: Date
  processingTime: number
}

/**
 * Comparison between alternatives
 */
export interface AlternativeComparison {
  matrix: Map<string, Map<string, number>>  // alternativeId -> dimension -> score
  rankings: SolutionRanking[]
  tradeoffAnalysis: TradeoffAnalysis
  keyDifferentiators: string[]
}

/**
 * Tradeoff analysis result
 */
export interface TradeoffAnalysis {
  conflicts: TradeoffConflict[]
  synergies: TradeoffSynergy[]
  paretoOptimal: string[]  // IDs of Pareto-optimal solutions
}

/**
 * Conflicting tradeoffs
 */
export interface TradeoffConflict {
  factor1: string
  factor2: string
  description: string
  affectedAlternatives: string[]
  resolutionStrategy: string
}

/**
 * Synergistic tradeoffs
 */
export interface TradeoffSynergy {
  factors: string[]
  description: string
  benefit: string
  alternatives: string[]
}

/**
 * Result of branch exploration
 */
export interface BranchExplorationResult {
  tree: ReasoningTree
  bestBranches: ReasoningBranch[]
  insights: string[]
  conclusions: string[]
  statistics: ExplorationStatistics
}

/**
 * Statistics from exploration
 */
export interface ExplorationStatistics {
  totalBranches: number
  exploredBranches: number
  prunedBranches: number
  mergedBranches: number
  averageDepth: number
  maxDepth: number
  averageViability: number
  explorationEfficiency: number  // Useful branches / total
}

// ============================================================================
// Default Configurations
// ============================================================================

const DEFAULT_GENERATION_CONFIG: AlternativeGenerationConfig = {
  maxAlternatives: 5,
  exploreDepth: 3,
  includeVariations: true,
  considerTradeoffs: true,
  rankingWeights: new Map([
    ['correctness', 25],
    ['efficiency', 15],
    ['maintainability', 15],
    ['scalability', 10],
    ['security', 15],
    ['readability', 10],
    ['testability', 5],
    ['extensibility', 5]
  ]),
  aiEnhanced: true
}

const DEFAULT_EXPLORATION_CONFIG: BranchExplorationConfig = {
  maxDepth: 5,
  maxBranches: 20,
  pruneThreshold: 0.3,
  mergeThreshold: 0.85,
  explorationStrategy: 'best_first'
}

// ============================================================================
// Alternative Solutions Engine Class
// ============================================================================

/**
 * Main engine for generating alternative solutions and exploring reasoning branches
 */
export class AlternativeSolutionsEngine {
  private zai: any = null
  private solutions: Map<string, Solution> = new Map()
  private alternatives: Map<string, SolutionAlternative> = new Map()
  private trees: Map<string, ReasoningTree> = new Map()
  private generationConfig: AlternativeGenerationConfig
  private explorationConfig: BranchExplorationConfig
  private branchCounter = 0
  private solutionCounter = 0

  constructor(
    generationConfig?: Partial<AlternativeGenerationConfig>,
    explorationConfig?: Partial<BranchExplorationConfig>
  ) {
    this.generationConfig = { ...DEFAULT_GENERATION_CONFIG, ...generationConfig }
    this.explorationConfig = { ...DEFAULT_EXPLORATION_CONFIG, ...explorationConfig }
  }

  /**
   * Initialize the AI client
   */
  async initialize(): Promise<void> {
    if (!this.zai) {
      this.zai = await ZAI.create()
    }
  }

  // ==========================================================================
  // Alternative Solution Generation
  // ==========================================================================

  /**
   * Generate alternative solutions for a problem
   */
  async generateAlternatives(
    problem: string,
    context?: {
      constraints?: string[]
      existingCode?: string
      preferences?: Record<string, unknown>
    }
  ): Promise<AlternativeGenerationResult> {
    const startTime = Date.now()
    
    if (this.generationConfig.aiEnhanced) {
      await this.initialize()
    }

    // Step 1: Understand the problem
    const problemAnalysis = await this.analyzeProblem(problem, context)

    // Step 2: Generate base solutions using different approaches
    const baseSolutions = await this.generateBaseSolutions(problemAnalysis, context)

    // Step 3: Create variations for each solution
    const alternatives: SolutionAlternative[] = []
    for (const solution of baseSolutions) {
      const alternative = await this.createAlternative(solution, problemAnalysis, context)
      alternatives.push(alternative)
      this.alternatives.set(alternative.id, alternative)
    }

    // Step 4: Rank alternatives
    const rankedAlternatives = this.rankAlternatives(alternatives, problemAnalysis)

    // Step 5: Generate comparison and tradeoff analysis
    const comparison = this.generateComparison(rankedAlternatives)

    // Step 6: Select best alternative and generate recommendation
    const bestAlternative = rankedAlternatives[0]
    const recommendation = await this.generateRecommendation(
      bestAlternative,
      rankedAlternatives,
      problemAnalysis
    )

    return {
      problem,
      alternatives: rankedAlternatives,
      bestAlternative,
      comparison,
      recommendation,
      generatedAt: new Date(),
      processingTime: Date.now() - startTime
    }
  }

  /**
   * Analyze the problem to understand requirements
   */
  private async analyzeProblem(
    problem: string,
    context?: { constraints?: string[]; existingCode?: string; preferences?: Record<string, unknown> }
  ): Promise<{
    requirements: string[]
    constraints: string[]
    objectives: string[]
    complexity: ComplexityLevel
    suggestedApproaches: SolutionApproach[]
  }> {
    if (!this.zai) {
      return this.defaultProblemAnalysis(problem, context)
    }

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a software architecture expert. Analyze the given problem and extract:
1. Requirements (what needs to be done)
2. Constraints (limitations and restrictions)
3. Objectives (goals to achieve)
4. Complexity level (trivial/low/medium/high/very_high)
5. Suggested approaches (direct/iterative/recursive/functional/object_oriented/event_driven/declarative/hybrid)

Respond in JSON format:
{
  "requirements": ["req1", "req2"],
  "constraints": ["const1"],
  "objectives": ["obj1"],
  "complexity": "medium",
  "suggestedApproaches": ["direct", "iterative"]
}`
          },
          {
            role: 'user',
            content: `Problem: ${problem}
Context: ${JSON.stringify(context || {})}`
          }
        ],
        thinking: { type: 'disabled' }
      })

      const content = completion.choices[0]?.message?.content || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('Problem analysis failed:', error)
    }

    return this.defaultProblemAnalysis(problem, context)
  }

  /**
   * Default problem analysis without AI
   */
  private defaultProblemAnalysis(
    problem: string,
    context?: { constraints?: string[]; existingCode?: string; preferences?: Record<string, unknown> }
  ): {
    requirements: string[]
    constraints: string[]
    objectives: string[]
    complexity: ComplexityLevel
    suggestedApproaches: SolutionApproach[]
  } {
    return {
      requirements: [`Solve: ${problem}`],
      constraints: context?.constraints || [],
      objectives: ['Working solution', 'Maintainable code'],
      complexity: 'medium',
      suggestedApproaches: ['direct', 'iterative']
    }
  }

  /**
   * Generate base solutions using different approaches
   */
  private async generateBaseSolutions(
    problemAnalysis: {
      requirements: string[]
      constraints: string[]
      objectives: string[]
      complexity: ComplexityLevel
      suggestedApproaches: SolutionApproach[]
    },
    context?: { constraints?: string[]; existingCode?: string; preferences?: Record<string, unknown> }
  ): Promise<Solution[]> {
    const solutions: Solution[] = []
    const approaches = problemAnalysis.suggestedApproaches.slice(0, this.generationConfig.maxAlternatives)

    for (const approach of approaches) {
      const solution = await this.generateSolution(approach, problemAnalysis, context)
      solutions.push(solution)
      this.solutions.set(solution.id, solution)
    }

    return solutions
  }

  /**
   * Generate a single solution for a given approach
   */
  private async generateSolution(
    approach: SolutionApproach,
    problemAnalysis: {
      requirements: string[]
      constraints: string[]
      objectives: string[]
      complexity: ComplexityLevel
    },
    context?: { constraints?: string[]; existingCode?: string; preferences?: Record<string, unknown> }
  ): Promise<Solution> {
    const id = `sol-${++this.solutionCounter}-${Date.now().toString(36)}`

    if (!this.zai) {
      return this.createDefaultSolution(id, approach, problemAnalysis)
    }

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a code architect. Generate a solution using the specified approach.
Provide a JSON response with:
{
  "name": "Solution name",
  "description": "Brief description",
  "implementation": "Code or pseudocode",
  "estimatedEffort": { "timeHours": N, "linesOfCode": N, "dependencies": N, "riskLevel": "low/moderate/high" },
  "tags": ["tag1", "tag2"]
}`
          },
          {
            role: 'user',
            content: `Approach: ${approach}
Requirements: ${problemAnalysis.requirements.join(', ')}
Constraints: ${problemAnalysis.constraints.join(', ')}
Objectives: ${problemAnalysis.objectives.join(', ')}
Complexity: ${problemAnalysis.complexity}
Existing code: ${context?.existingCode || 'None'}`
          }
        ],
        thinking: { type: 'disabled' }
      })

      const content = completion.choices[0]?.message?.content || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          id,
          name: parsed.name || `${approach} solution`,
          description: parsed.description || '',
          approach,
          implementation: parsed.implementation || '',
          complexity: problemAnalysis.complexity,
          estimatedEffort: parsed.estimatedEffort || this.estimateEffort(problemAnalysis.complexity),
          tags: parsed.tags || [approach],
          metadata: {},
          createdAt: new Date()
        }
      }
    } catch (error) {
      console.error('Solution generation failed:', error)
    }

    return this.createDefaultSolution(id, approach, problemAnalysis)
  }

  /**
   * Create a default solution without AI
   */
  private createDefaultSolution(
    id: string,
    approach: SolutionApproach,
    problemAnalysis: {
      requirements: string[]
      constraints: string[]
      objectives: string[]
      complexity: ComplexityLevel
    }
  ): Solution {
    return {
      id,
      name: `${approach.charAt(0).toUpperCase() + approach.slice(1)} Approach`,
      description: `Solution using ${approach} approach for: ${problemAnalysis.requirements[0]}`,
      approach,
      implementation: `// Implementation using ${approach} approach\n// TODO: Add implementation`,
      complexity: problemAnalysis.complexity,
      estimatedEffort: this.estimateEffort(problemAnalysis.complexity),
      tags: [approach, problemAnalysis.complexity],
      metadata: {},
      createdAt: new Date()
    }
  }

  /**
   * Estimate effort based on complexity
   */
  private estimateEffort(complexity: ComplexityLevel): EffortEstimate {
    const estimates: Record<ComplexityLevel, EffortEstimate> = {
      trivial: { timeHours: 1, linesOfCode: 50, dependencies: 0, riskLevel: 'minimal' },
      low: { timeHours: 4, linesOfCode: 150, dependencies: 1, riskLevel: 'low' },
      medium: { timeHours: 16, linesOfCode: 500, dependencies: 3, riskLevel: 'moderate' },
      high: { timeHours: 40, linesOfCode: 1500, dependencies: 5, riskLevel: 'significant' },
      very_high: { timeHours: 100, linesOfCode: 5000, dependencies: 10, riskLevel: 'high' }
    }
    return estimates[complexity]
  }

  /**
   * Create an alternative with variations and tradeoffs
   */
  private async createAlternative(
    solution: Solution,
    problemAnalysis: {
      requirements: string[]
      constraints: string[]
      objectives: string[]
    },
    context?: { constraints?: string[]; existingCode?: string; preferences?: Record<string, unknown> }
  ): Promise<SolutionAlternative> {
    const id = `alt-${Date.now().toString(36)}`

    // Generate variations if enabled
    const variations: SolutionVariation[] = []
    if (this.generationConfig.includeVariations) {
      const generatedVariations = await this.generateVariations(solution, problemAnalysis)
      variations.push(...generatedVariations)
    }

    // Generate tradeoffs if enabled
    const tradeoffs: Tradeoff[] = []
    if (this.generationConfig.considerTradeoffs) {
      const generatedTradeoffs = this.generateTradeoffs(solution)
      tradeoffs.push(...generatedTradeoffs)
    }

    // Generate pros and cons
    const { pros, cons } = this.analyzeProsAndCons(solution, tradeoffs)

    // Create initial ranking (will be updated later)
    const ranking: SolutionRanking = {
      overall: 0,
      dimensions: new Map(),
      percentile: 0,
      tier: 'C'
    }

    return {
      id,
      solution,
      variations,
      tradeoffs,
      ranking,
      pros,
      cons,
      confidence: 0.7
    }
  }

  /**
   * Generate variations of a solution
   */
  private async generateVariations(
    solution: Solution,
    problemAnalysis: { requirements: string[]; constraints: string[]; objectives: string[] }
  ): Promise<SolutionVariation[]> {
    const variations: SolutionVariation[] = []

    // Built-in variation strategies
    const strategies = [
      {
        name: 'Optimized',
        description: 'Performance-optimized version',
        modifications: ['Add caching', 'Reduce complexity', 'Optimize data structures']
      },
      {
        name: 'Simplified',
        description: 'Simplified version with fewer features',
        modifications: ['Remove edge cases', 'Simplify logic', 'Reduce dependencies']
      },
      {
        name: 'Extended',
        description: 'Extended version with more features',
        modifications: ['Add error handling', 'Add logging', 'Add configuration options']
      }
    ]

    for (const strategy of strategies) {
      variations.push({
        id: `var-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        name: `${solution.name} - ${strategy.name}`,
        description: strategy.description,
        modifications: strategy.modifications,
        differentialScore: Math.random() * 20 - 10 // -10 to +10
      })
    }

    return variations
  }

  /**
   * Generate tradeoffs for a solution
   */
  private generateTradeoffs(solution: Solution): Tradeoff[] {
    const tradeoffs: Tradeoff[] = []

    // Approach-specific tradeoffs
    const approachTradeoffs: Record<SolutionApproach, Tradeoff[]> = {
      direct: [
        {
          id: `to-${Date.now()}-1`,
          factor: 'Simplicity vs Flexibility',
          description: 'Direct approach trades flexibility for simplicity',
          giveUp: 'Ability to easily modify behavior',
          gain: 'Clear, straightforward implementation',
          impact: 'minor',
          reversible: true
        }
      ],
      iterative: [
        {
          id: `to-${Date.now()}-2`,
          factor: 'Speed vs Correctness',
          description: 'Iterative approach may have edge case bugs initially',
          giveUp: 'Immediate correctness',
          gain: 'Faster initial delivery and feedback',
          impact: 'moderate',
          reversible: true
        }
      ],
      recursive: [
        {
          id: `to-${Date.now()}-3`,
          factor: 'Elegance vs Performance',
          description: 'Recursive solutions may have stack depth issues',
          giveUp: 'Performance on large inputs',
          gain: 'Elegant, mathematical solution',
          impact: 'moderate',
          reversible: true,
          mitigationStrategy: 'Use tail recursion or convert to iterative for large inputs'
        }
      ],
      functional: [
        {
          id: `to-${Date.now()}-4`,
          factor: 'Purity vs Practicality',
          description: 'Pure functions may require more memory',
          giveUp: 'Memory efficiency',
          gain: 'Testability and predictability',
          impact: 'minor',
          reversible: true
        }
      ],
      object_oriented: [
        {
          id: `to-${Date.now()}-5`,
          factor: 'Structure vs Simplicity',
          description: 'OOP adds class hierarchies',
          giveUp: 'Simplicity',
          gain: 'Extensibility and encapsulation',
          impact: 'moderate',
          reversible: false
        }
      ],
      event_driven: [
        {
          id: `to-${Date.now()}-6`,
          factor: 'Responsiveness vs Complexity',
          description: 'Event-driven adds async complexity',
          giveUp: 'Debugging simplicity',
          gain: 'Responsiveness and scalability',
          impact: 'significant',
          reversible: true
        }
      ],
      declarative: [
        {
          id: `to-${Date.now()}-7`,
          factor: 'Clarity vs Control',
          description: 'Declarative style hides implementation details',
          giveUp: 'Fine-grained control',
          gain: 'Readability and maintainability',
          impact: 'minor',
          reversible: true
        }
      ],
      hybrid: [
        {
          id: `to-${Date.now()}-8`,
          factor: 'Flexibility vs Consistency',
          description: 'Hybrid approaches mix paradigms',
          giveUp: 'Consistent style',
          gain: 'Best of multiple approaches',
          impact: 'moderate',
          reversible: true
        }
      ]
    }

    tradeoffs.push(...(approachTradeoffs[solution.approach] || []))

    // Complexity-based tradeoffs
    if (solution.complexity === 'high' || solution.complexity === 'very_high') {
      tradeoffs.push({
        id: `to-${Date.now()}-complexity`,
        factor: 'Features vs Complexity',
        description: 'High complexity solution',
        giveUp: 'Maintainability',
        gain: 'Rich functionality',
        impact: 'significant',
        reversible: false,
        mitigationStrategy: 'Add comprehensive documentation and tests'
      })
    }

    return tradeoffs
  }

  /**
   * Analyze pros and cons of a solution
   */
  private analyzeProsAndCons(
    solution: Solution,
    tradeoffs: Tradeoff[]
  ): { pros: string[]; cons: string[] } {
    const pros: string[] = []
    const cons: string[] = []

    // Approach-based pros/cons
    const approachAnalysis: Record<SolutionApproach, { pros: string[]; cons: string[] }> = {
      direct: {
        pros: ['Simple to understand', 'Quick to implement', 'Easy to debug'],
        cons: ['May not be flexible', 'Can violate DRY principle']
      },
      iterative: {
        pros: ['Incremental value delivery', 'Easy to adjust course', 'Early feedback'],
        cons: ['May need refactoring', 'Can accumulate technical debt']
      },
      recursive: {
        pros: ['Elegant solution', 'Matches problem structure', 'Easy to prove correct'],
        cons: ['Stack overflow risk', 'May be slower', 'Harder to debug']
      },
      functional: {
        pros: ['Easy to test', 'Predictable', 'Thread-safe'],
        cons: ['May use more memory', 'Learning curve', 'Not always natural fit']
      },
      object_oriented: {
        pros: ['Good for complex domains', 'Encapsulation', 'Extensibility'],
        cons: ['Boilerplate code', 'Can be over-engineered', 'Inheritance issues']
      },
      event_driven: {
        pros: ['Responsive', 'Scalable', 'Loose coupling'],
        cons: ['Debugging difficulty', 'Callback hell risk', 'Complex flow']
      },
      declarative: {
        pros: ['Readable', 'Concise', 'Self-documenting'],
        cons: ['Less control', 'Performance hidden', 'Debugging challenges']
      },
      hybrid: {
        pros: ['Flexible', 'Best of both worlds', 'Adaptable'],
        cons: ['Inconsistent style', 'Complex to understand', 'Hard to maintain']
      }
    }

    const analysis = approachAnalysis[solution.approach] || { pros: [], cons: [] }
    pros.push(...analysis.pros)
    cons.push(...analysis.cons)

    // Add tradeoff-based pros/cons
    for (const tradeoff of tradeoffs) {
      if (tradeoff.impact === 'minor' || tradeoff.impact === 'moderate') {
        pros.push(`Good ${tradeoff.factor.toLowerCase()}`)
      } else {
        cons.push(`${tradeoff.factor} tradeoff`)
      }
    }

    // Add effort-based pros/cons
    if (solution.estimatedEffort.riskLevel === 'minimal' || solution.estimatedEffort.riskLevel === 'low') {
      pros.push('Low implementation risk')
    } else if (solution.estimatedEffort.riskLevel === 'high') {
      cons.push('High implementation risk')
    }

    return { pros, cons }
  }

  /**
   * Rank alternatives by quality
   */
  private rankAlternatives(
    alternatives: SolutionAlternative[],
    problemAnalysis: {
      requirements: string[]
      constraints: string[]
      objectives: string[]
    }
  ): SolutionAlternative[] {
    // Calculate scores for each alternative
    for (const alternative of alternatives) {
      const scores = this.calculateRankingScores(alternative, problemAnalysis)
      alternative.ranking = scores
    }

    // Sort by overall score
    const sorted = [...alternatives].sort((a, b) => b.ranking.overall - a.ranking.overall)

    // Update percentiles
    sorted.forEach((alt, index) => {
      alt.ranking.percentile = ((sorted.length - index) / sorted.length) * 100
    })

    return sorted
  }

  /**
   * Calculate ranking scores for an alternative
   */
  private calculateRankingScores(
    alternative: SolutionAlternative,
    problemAnalysis: { requirements: string[]; constraints: string[]; objectives: string[] }
  ): SolutionRanking {
    const dimensions = new Map<RankingDimension, number>()
    const solution = alternative.solution

    // Calculate dimension scores
    dimensions.set('correctness', this.scoreCorrectness(solution, problemAnalysis))
    dimensions.set('efficiency', this.scoreEfficiency(solution))
    dimensions.set('maintainability', this.scoreMaintainability(solution))
    dimensions.set('scalability', this.scoreScalability(solution))
    dimensions.set('security', this.scoreSecurity(solution))
    dimensions.set('readability', this.scoreReadability(solution))
    dimensions.set('testability', this.scoreTestability(solution))
    dimensions.set('extensibility', this.scoreExtensibility(solution))

    // Calculate weighted overall score
    let overall = 0
    let totalWeight = 0

    for (const [dimension, score] of dimensions) {
      const weight = this.generationConfig.rankingWeights.get(dimension) || 10
      overall += score * weight
      totalWeight += weight
    }

    overall = totalWeight > 0 ? overall / totalWeight : 50

    // Determine tier
    let tier: SolutionTier
    if (overall >= 90) tier = 'S'
    else if (overall >= 80) tier = 'A'
    else if (overall >= 70) tier = 'B'
    else if (overall >= 60) tier = 'C'
    else if (overall >= 50) tier = 'D'
    else tier = 'F'

    return {
      overall,
      dimensions,
      percentile: 0, // Set later
      tier
    }
  }

  /**
   * Score solution correctness
   */
  private scoreCorrectness(
    solution: Solution,
    problemAnalysis: { requirements: string[]; constraints: string[] }
  ): number {
    let score = 70 // Base score

    // Check if constraints are addressed
    const constraintMatches = problemAnalysis.constraints.filter(c =>
      solution.description.toLowerCase().includes(c.toLowerCase()) ||
      solution.implementation.toLowerCase().includes(c.toLowerCase())
    ).length

    score += Math.min(constraintMatches * 5, 20)

    // Approach affects correctness
    if (solution.approach === 'direct') score += 5 // Direct is often more correct
    if (solution.approach === 'iterative') score += 3 // Allows refinement

    return Math.min(score, 100)
  }

  /**
   * Score solution efficiency
   */
  private scoreEfficiency(solution: Solution): number {
    let score = 70

    // Complexity affects efficiency
    const complexityScores: Record<ComplexityLevel, number> = {
      trivial: 100,
      low: 90,
      medium: 75,
      high: 55,
      very_high: 40
    }
    score = complexityScores[solution.complexity] || 70

    // Approach affects efficiency
    if (solution.approach === 'direct') score += 5
    if (solution.approach === 'recursive') score -= 10

    // Effort estimation affects efficiency
    if (solution.estimatedEffort.linesOfCode < 100) score += 5
    if (solution.estimatedEffort.linesOfCode > 1000) score -= 5

    return Math.min(Math.max(score, 0), 100)
  }

  /**
   * Score solution maintainability
   */
  private scoreMaintainability(solution: Solution): number {
    let score = 70

    // Approach affects maintainability
    const approachScores: Record<SolutionApproach, number> = {
      direct: 75,
      iterative: 70,
      recursive: 60,
      functional: 85,
      object_oriented: 80,
      event_driven: 65,
      declarative: 90,
      hybrid: 60
    }
    score = approachScores[solution.approach] || 70

    // Complexity affects maintainability
    if (solution.complexity === 'trivial' || solution.complexity === 'low') score += 10
    if (solution.complexity === 'high' || solution.complexity === 'very_high') score -= 15

    return Math.min(Math.max(score, 0), 100)
  }

  /**
   * Score solution scalability
   */
  private scoreScalability(solution: Solution): number {
    let score = 70

    // Approach affects scalability
    const approachScores: Record<SolutionApproach, number> = {
      direct: 60,
      iterative: 75,
      recursive: 50,
      functional: 85,
      object_oriented: 80,
      event_driven: 95,
      declarative: 75,
      hybrid: 70
    }
    score = approachScores[solution.approach] || 70

    return Math.min(Math.max(score, 0), 100)
  }

  /**
   * Score solution security
   */
  private scoreSecurity(solution: Solution): number {
    let score = 75

    // Check for security-related tags
    if (solution.tags.includes('security')) score += 15

    // Approach affects security
    if (solution.approach === 'functional') score += 10 // Pure functions are safer
    if (solution.approach === 'event_driven') score += 5

    // High complexity often has more security issues
    if (solution.complexity === 'high' || solution.complexity === 'very_high') score -= 10

    return Math.min(Math.max(score, 0), 100)
  }

  /**
   * Score solution readability
   */
  private scoreReadability(solution: Solution): number {
    let score = 70

    // Approach affects readability
    const approachScores: Record<SolutionApproach, number> = {
      direct: 90,
      iterative: 80,
      recursive: 60,
      functional: 75,
      object_oriented: 70,
      event_driven: 55,
      declarative: 95,
      hybrid: 50
    }
    score = approachScores[solution.approach] || 70

    // Complexity affects readability
    if (solution.complexity === 'trivial' || solution.complexity === 'low') score += 10
    if (solution.complexity === 'high' || solution.complexity === 'very_high') score -= 15

    return Math.min(Math.max(score, 0), 100)
  }

  /**
   * Score solution testability
   */
  private scoreTestability(solution: Solution): number {
    let score = 70

    // Approach affects testability
    const approachScores: Record<SolutionApproach, number> = {
      direct: 85,
      iterative: 80,
      recursive: 70,
      functional: 95,
      object_oriented: 85,
      event_driven: 60,
      declarative: 80,
      hybrid: 65
    }
    score = approachScores[solution.approach] || 70

    return Math.min(Math.max(score, 0), 100)
  }

  /**
   * Score solution extensibility
   */
  private scoreExtensibility(solution: Solution): number {
    let score = 70

    // Approach affects extensibility
    const approachScores: Record<SolutionApproach, number> = {
      direct: 50,
      iterative: 75,
      recursive: 65,
      functional: 80,
      object_oriented: 95,
      event_driven: 85,
      declarative: 70,
      hybrid: 80
    }
    score = approachScores[solution.approach] || 70

    // High complexity solutions often have more extension points
    if (solution.complexity === 'high') score += 5

    return Math.min(Math.max(score, 0), 100)
  }

  /**
   * Generate comparison between alternatives
   */
  private generateComparison(alternatives: SolutionAlternative[]): AlternativeComparison {
    const matrix = new Map<string, Map<string, number>>()
    const rankings: SolutionRanking[] = []

    // Build comparison matrix
    for (const alt of alternatives) {
      const altScores = new Map<string, number>()
      
      for (const [dimension, score] of alt.ranking.dimensions) {
        altScores.set(dimension, score)
      }
      
      matrix.set(alt.id, altScores)
      rankings.push(alt.ranking)
    }

    // Identify tradeoffs
    const tradeoffAnalysis = this.analyzeTradeoffs(alternatives)

    // Find key differentiators
    const keyDifferentiators = this.findKeyDifferentiators(alternatives)

    return {
      matrix,
      rankings,
      tradeoffAnalysis,
      keyDifferentiators
    }
  }

  /**
   * Analyze tradeoffs between alternatives
   */
  private analyzeTradeoffs(alternatives: SolutionAlternative[]): TradeoffAnalysis {
    const conflicts: TradeoffConflict[] = []
    const synergies: TradeoffSynergy[] = []
    const paretoOptimal: string[] = []

    // Find common tradeoff factors
    const allFactors = new Map<string, Tradeoff[]>()
    for (const alt of alternatives) {
      for (const tradeoff of alt.tradeoffs) {
        const existing = allFactors.get(tradeoff.factor) || []
        existing.push(tradeoff)
        allFactors.set(tradeoff.factor, existing)
      }
    }

    // Identify conflicts (same factor with different solutions)
    for (const [factor, tradeoffs] of allFactors) {
      if (tradeoffs.length > 1) {
        const alternativeIds = [...new Set(
          alternatives
            .filter(a => a.tradeoffs.some(t => t.factor === factor))
            .map(a => a.id)
        )]

        if (alternativeIds.length > 1) {
          conflicts.push({
            factor1: factor,
            factor2: 'Alternative approaches',
            description: `Different approaches handle "${factor}" differently`,
            affectedAlternatives: alternativeIds,
            resolutionStrategy: 'Evaluate based on project priorities'
          })
        }
      }
    }

    // Identify synergies (factors that work well together)
    for (const alt of alternatives) {
      const positiveTradeoffs = alt.tradeoffs.filter(t => t.impact === 'minor')
      if (positiveTradeoffs.length >= 2) {
        synergies.push({
          factors: positiveTradeoffs.map(t => t.factor),
          description: `${alt.solution.approach} approach has synergistic benefits`,
          benefit: 'Combined advantages',
          alternatives: [alt.id]
        })
      }
    }

    // Find Pareto-optimal solutions (not dominated by any other)
    for (const alt of alternatives) {
      let isDominated = false
      
      for (const other of alternatives) {
        if (alt.id === other.id) continue
        
        // Check if other dominates alt
        let dominatesInAll = true
        let strictlyBetterInOne = false
        
        for (const [dim, score] of alt.ranking.dimensions) {
          const otherScore = other.ranking.dimensions.get(dim) || 0
          if (otherScore < score) {
            dominatesInAll = false
            break
          }
          if (otherScore > score) {
            strictlyBetterInOne = true
          }
        }
        
        if (dominatesInAll && strictlyBetterInOne) {
          isDominated = true
          break
        }
      }
      
      if (!isDominated) {
        paretoOptimal.push(alt.id)
      }
    }

    return { conflicts, synergies, paretoOptimal }
  }

  /**
   * Find key differentiators between alternatives
   */
  private findKeyDifferentiators(alternatives: SolutionAlternative[]): string[] {
    const differentiators: string[] = []

    if (alternatives.length < 2) return differentiators

    // Find dimensions with highest variance
    const dimensionVariance = new Map<RankingDimension, number>()
    
    for (const dimension of alternatives[0].ranking.dimensions.keys()) {
      const scores = alternatives.map(a => a.ranking.dimensions.get(dimension) || 0)
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length
      const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length
      dimensionVariance.set(dimension, variance)
    }

    // Sort by variance and take top differentiators
    const sorted = [...dimensionVariance.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    for (const [dimension, variance] of sorted) {
      if (variance > 100) { // Significant variance
        differentiators.push(`${dimension} varies significantly between alternatives`)
      }
    }

    // Add approach differences
    const approaches = [...new Set(alternatives.map(a => a.solution.approach))]
    if (approaches.length > 1) {
      differentiators.push(`Different approaches: ${approaches.join(', ')}`)
    }

    return differentiators
  }

  /**
   * Generate recommendation for best alternative
   */
  private async generateRecommendation(
    best: SolutionAlternative,
    all: SolutionAlternative[],
    problemAnalysis: { requirements: string[]; objectives: string[] }
  ): Promise<string> {
    if (!this.zai) {
      return this.defaultRecommendation(best, all)
    }

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a software architecture advisor. Provide a concise recommendation explaining why a particular solution is best suited for the given problem.'
          },
          {
            role: 'user',
            content: `Problem: ${problemAnalysis.requirements.join(', ')}
Objectives: ${problemAnalysis.objectives.join(', ')}

Best Solution: ${best.solution.name} (${best.solution.approach} approach)
Score: ${best.ranking.overall.toFixed(1)} (Tier ${best.ranking.tier})
Pros: ${best.pros.join(', ')}
Cons: ${best.cons.join(', ')}

Other alternatives considered: ${all.slice(1).map(a => a.solution.name).join(', ')}

Provide a brief recommendation (2-3 sentences) explaining why this solution is recommended.`
          }
        ],
        thinking: { type: 'disabled' }
      })

      return completion.choices[0]?.message?.content || this.defaultRecommendation(best, all)
    } catch (error) {
      return this.defaultRecommendation(best, all)
    }
  }

  /**
   * Default recommendation without AI
   */
  private defaultRecommendation(best: SolutionAlternative, all: SolutionAlternative[]): string {
    const diff = all.length > 1 ? best.ranking.overall - all[1].ranking.overall : 0
    
    if (diff > 15) {
      return `${best.solution.name} is strongly recommended due to its superior ${best.ranking.tier}-tier score of ${best.ranking.overall.toFixed(1)}. The ${best.solution.approach} approach offers the best balance of ${best.pros.slice(0, 2).join(' and ')}.`
    } else if (diff > 5) {
      return `${best.solution.name} is recommended with a score of ${best.ranking.overall.toFixed(1)}. Consider ${all[1]?.solution.name} as an alternative if ${all[1]?.pros[0]} is a priority.`
    } else {
      return `Both ${best.solution.name} and ${all[1]?.solution.name} are viable options. ${best.solution.name} is slightly preferred for its ${best.pros[0]}.`
    }
  }

  // ==========================================================================
  // Reasoning Branch Exploration
  // ==========================================================================

  /**
   * Explore reasoning branches for a problem
   */
  async exploreBranches(
    problem: string,
    initialHypotheses?: string[]
  ): Promise<BranchExplorationResult> {
    await this.initialize()

    // Create reasoning tree
    const treeId = `tree-${Date.now().toString(36)}`
    const rootBranch = this.createRootBranch(problem, initialHypotheses)
    
    const tree: ReasoningTree = {
      id: treeId,
      goal: problem,
      root: rootBranch,
      branches: new Map([[rootBranch.id, rootBranch]]),
      depth: 0,
      totalNodes: 1,
      prunedNodes: 0,
      mergedNodes: 0,
      bestPath: [],
      createdAt: new Date()
    }

    this.trees.set(treeId, tree)

    // Explore branches based on strategy
    await this.exploreTree(tree)

    // Find best branches
    const bestBranches = this.findBestBranches(tree)

    // Extract insights and conclusions
    const insights = this.extractInsights(tree)
    const conclusions = this.extractConclusions(tree, bestBranches)

    // Calculate statistics
    const statistics = this.calculateStatistics(tree)

    tree.completedAt = new Date()

    return {
      tree,
      bestBranches,
      insights,
      conclusions,
      statistics
    }
  }

  /**
   * Create root branch for reasoning tree
   */
  private createRootBranch(problem: string, initialHypotheses?: string[]): ReasoningBranch {
    const id = `branch-${++this.branchCounter}`

    const hypotheses = initialHypotheses || [
      'Direct implementation approach',
      'Alternative architectural pattern',
      'Incremental refinement approach'
    ]

    return {
      id,
      parentId: null,
      path: 'root',
      hypothesis: `Exploring solutions for: ${problem}`,
      evidence: [{
        type: 'fact',
        content: problem,
        source: 'user_input',
        strength: 1.0
      }],
      conclusions: hypotheses,
      children: [],
      status: 'exploring',
      depth: 0,
      createdAt: new Date()
    }
  }

  /**
   * Explore the reasoning tree
   */
  private async exploreTree(tree: ReasoningTree): Promise<void> {
    const queue: ReasoningBranch[] = [tree.root]
    let explored = 0

    while (queue.length > 0 && explored < this.explorationConfig.maxBranches) {
      // Select next branch based on strategy
      const branch = this.selectNextBranch(queue, tree)
      
      if (!branch || branch.depth >= this.explorationConfig.maxDepth) {
        continue
      }

      // Evaluate branch before exploring
      const evaluation = await this.evaluateBranch(branch, tree)
      branch.evaluation = evaluation

      // Prune if not viable
      if (evaluation.shouldPrune) {
        branch.status = 'pruned'
        tree.prunedNodes++
        continue
      }

      // Explore branch
      branch.status = 'exploring'
      branch.exploredAt = new Date()

      // Generate child branches
      const children = await this.generateChildBranches(branch, tree)
      
      for (const child of children) {
        // Check for merge opportunities
        const merged = this.checkForMerge(child, tree)
        
        if (merged) {
          child.status = 'merged'
          tree.mergedNodes++
        }
        
        branch.children.push(child)
        tree.branches.set(child.id, child)
        tree.totalNodes++
        
        if (child.status !== 'merged') {
          queue.push(child)
        }
        
        tree.depth = Math.max(tree.depth, child.depth)
      }

      branch.status = 'completed'
      explored++
    }
  }

  /**
   * Select next branch to explore based on strategy
   */
  private selectNextBranch(queue: ReasoningBranch[], tree: ReasoningTree): ReasoningBranch | null {
    if (queue.length === 0) return null

    switch (this.explorationConfig.explorationStrategy) {
      case 'breadth_first':
        return queue.shift() || null

      case 'depth_first':
        return queue.pop() || null

      case 'best_first':
        // Select branch with highest potential
        queue.sort((a, b) => {
          const aPotential = a.evaluation?.potential || 0.5
          const bPotential = b.evaluation?.potential || 0.5
          return bPotential - aPotential
        })
        return queue.shift() || null

      case 'beam':
        // Keep only top N branches
        if (queue.length > 3) {
          queue.sort((a, b) => {
            const aPotential = a.evaluation?.potential || 0.5
            const bPotential = b.evaluation?.potential || 0.5
            return bPotential - aPotential
          })
          queue.splice(3)
        }
        return queue.shift() || null

      default:
        return queue.shift() || null
    }
  }

  /**
   * Evaluate a reasoning branch
   */
  private async evaluateBranch(branch: ReasoningBranch, tree: ReasoningTree): Promise<BranchEvaluation> {
    if (!this.zai) {
      return this.defaultBranchEvaluation(branch)
    }

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a reasoning evaluator. Analyze the given reasoning branch and provide:
1. Viability (0-1): How likely is this path to lead to a valid conclusion?
2. Potential (0-1): How valuable would exploring this further be?
3. Confidence (0-1): How confident are you in this evaluation?
4. Issues: Any problems found (contradictions, circular reasoning, unsupported claims)
5. Recommendations: Should this branch be explored further or pruned?

Respond in JSON format:
{
  "viability": 0.8,
  "potential": 0.7,
  "confidence": 0.85,
  "issues": [],
  "recommendations": ["Continue exploration"],
  "shouldPrune": false,
  "pruneReason": null
}`
          },
          {
            role: 'user',
            content: `Branch path: ${branch.path}
Hypothesis: ${branch.hypothesis}
Evidence: ${JSON.stringify(branch.evidence)}
Conclusions so far: ${branch.conclusions.join(', ')}
Depth: ${branch.depth}`
          }
        ],
        thinking: { type: 'disabled' }
      })

      const content = completion.choices[0]?.message?.content || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('Branch evaluation failed:', error)
    }

    return this.defaultBranchEvaluation(branch)
  }

  /**
   * Default branch evaluation without AI
   */
  private defaultBranchEvaluation(branch: ReasoningBranch): BranchEvaluation {
    let viability = 0.7
    let potential = 0.6

    // Check evidence strength
    const avgStrength = branch.evidence.reduce((sum, e) => sum + e.strength, 0) / Math.max(branch.evidence.length, 1)
    viability *= avgStrength

    // Depth affects potential
    potential *= Math.max(0.3, 1 - branch.depth * 0.15)

    // Check for issues
    const issues: BranchIssue[] = []
    
    // Check for contradictions
    const hasContradiction = branch.evidence.some(e1 => 
      branch.evidence.some(e2 => e1.contradicts === e2.source || e2.contradicts === e1.source)
    )
    if (hasContradiction) {
      issues.push({
        type: 'contradiction',
        description: 'Conflicting evidence found',
        severity: 'high'
      })
      viability *= 0.5
    }

    // Check for weak evidence
    if (avgStrength < 0.4) {
      issues.push({
        type: 'weak',
        description: 'Evidence is weak',
        severity: 'medium'
      })
      potential *= 0.7
    }

    const shouldPrune = viability < this.explorationConfig.pruneThreshold

    return {
      branchId: branch.id,
      viability,
      potential,
      confidence: 0.7,
      issues,
      recommendations: shouldPrune ? ['Prune this branch'] : ['Continue exploration'],
      shouldPrune,
      pruneReason: shouldPrune ? 'Low viability score' : undefined
    }
  }

  /**
   * Generate child branches from a branch
   */
  private async generateChildBranches(
    branch: ReasoningBranch,
    tree: ReasoningTree
  ): Promise<ReasoningBranch[]> {
    const children: ReasoningBranch[] = []

    if (!this.zai) {
      return this.defaultChildBranches(branch, tree)
    }

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a reasoning explorer. Generate child reasoning paths from the current branch.
For each conclusion, create a new reasoning direction to explore.

Respond in JSON format:
{
  "branches": [
    {
      "hypothesis": "Next hypothesis to explore",
      "path": "direction_name",
      "evidence": [{"type": "inference", "content": "reasoning", "source": "analysis", "strength": 0.8}],
      "conclusions": ["intermediate conclusion"]
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Current branch:
Path: ${branch.path}
Hypothesis: ${branch.hypothesis}
Evidence: ${JSON.stringify(branch.evidence)}
Conclusions: ${branch.conclusions.join('; ')}
Depth: ${branch.depth}

Generate 2-3 child branches exploring different directions.`
          }
        ],
        thinking: { type: 'disabled' }
      })

      const content = completion.choices[0]?.message?.content || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        
        for (const childData of parsed.branches || []) {
          const child: ReasoningBranch = {
            id: `branch-${++this.branchCounter}`,
            parentId: branch.id,
            path: `${branch.path}/${childData.path || 'unknown'}`,
            hypothesis: childData.hypothesis || '',
            evidence: childData.evidence || [],
            conclusions: childData.conclusions || [],
            children: [],
            status: 'pending',
            depth: branch.depth + 1,
            createdAt: new Date()
          }
          children.push(child)
        }
      }
    } catch (error) {
      console.error('Child branch generation failed:', error)
    }

    if (children.length === 0) {
      return this.defaultChildBranches(branch, tree)
    }

    return children
  }

  /**
   * Default child branches without AI
   */
  private defaultChildBranches(branch: ReasoningBranch, tree: ReasoningTree): ReasoningBranch[] {
    const children: ReasoningBranch[] = []
    
    for (const conclusion of branch.conclusions.slice(0, 3)) {
      const child: ReasoningBranch = {
        id: `branch-${++this.branchCounter}`,
        parentId: branch.id,
        path: `${branch.path}/${conclusion.slice(0, 20).toLowerCase().replace(/\s+/g, '-')}`,
        hypothesis: `Exploring: ${conclusion}`,
        evidence: [{
          type: 'inference',
          content: `Derived from parent branch: ${branch.hypothesis}`,
          source: 'branching',
          strength: 0.7
        }],
        conclusions: [],
        children: [],
        status: 'pending',
        depth: branch.depth + 1,
        createdAt: new Date()
      }
      children.push(child)
    }

    return children
  }

  /**
   * Check if a branch should be merged with existing branches
   */
  private checkForMerge(branch: ReasoningBranch, tree: ReasoningTree): boolean {
    for (const [id, existing] of tree.branches) {
      if (id === branch.id || existing.status === 'merged') continue

      // Calculate similarity
      const similarity = this.calculateBranchSimilarity(branch, existing)
      
      if (similarity > this.explorationConfig.mergeThreshold) {
        // Merge: add conclusions from new branch to existing
        for (const conclusion of branch.conclusions) {
          if (!existing.conclusions.includes(conclusion)) {
            existing.conclusions.push(conclusion)
          }
        }
        return true
      }
    }

    return false
  }

  /**
   * Calculate similarity between two branches
   */
  private calculateBranchSimilarity(a: ReasoningBranch, b: ReasoningBranch): number {
    // Compare hypotheses
    const hypothesisSimilarity = this.textSimilarity(a.hypothesis, b.hypothesis)

    // Compare paths
    const pathSimilarity = a.path === b.path ? 1 : 0

    // Compare conclusions
    const conclusionsA = new Set(a.conclusions)
    const conclusionsB = new Set(b.conclusions)
    const intersection = [...conclusionsA].filter(c => conclusionsB.has(c)).length
    const union = conclusionsA.size + conclusionsB.size - intersection
    const conclusionSimilarity = union > 0 ? intersection / union : 0

    return (hypothesisSimilarity * 0.5 + pathSimilarity * 0.2 + conclusionSimilarity * 0.3)
  }

  /**
   * Calculate text similarity using word overlap
   */
  private textSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/))
    const wordsB = new Set(b.toLowerCase().split(/\s+/))
    
    const intersection = [...wordsA].filter(w => wordsB.has(w)).length
    const union = wordsA.size + wordsB.size - intersection
    
    return union > 0 ? intersection / union : 0
  }

  /**
   * Find the best branches in the tree
   */
  private findBestBranches(tree: ReasoningTree): ReasoningBranch[] {
    const branches = Array.from(tree.branches.values())
      .filter(b => b.status === 'completed' && b.evaluation)

    return branches
      .sort((a, b) => {
        const aScore = (a.evaluation?.viability || 0) + (a.evaluation?.potential || 0)
        const bScore = (b.evaluation?.viability || 0) + (b.evaluation?.potential || 0)
        return bScore - aScore
      })
      .slice(0, 5)
  }

  /**
   * Extract insights from the reasoning tree
   */
  private extractInsights(tree: ReasoningTree): string[] {
    const insights: string[] = []

    // Find common evidence across branches
    const evidenceFrequency = new Map<string, number>()
    
    for (const branch of tree.branches.values()) {
      for (const evidence of branch.evidence) {
        const key = evidence.content.slice(0, 50)
        evidenceFrequency.set(key, (evidenceFrequency.get(key) || 0) + 1)
      }
    }

    // Evidence appearing in multiple branches is likely important
    for (const [evidence, count] of evidenceFrequency) {
      if (count >= 2) {
        insights.push(`Common evidence: ${evidence}... (appears in ${count} branches)`)
      }
    }

    // Find contradictions
    for (const branch of tree.branches.values()) {
      if (branch.evaluation?.issues.some(i => i.type === 'contradiction')) {
        insights.push(`Contradiction found in path: ${branch.path}`)
      }
    }

    // Pruning insights
    if (tree.prunedNodes > 0) {
      insights.push(`${tree.prunedNodes} branches were pruned as unproductive`)
    }

    return insights
  }

  /**
   * Extract conclusions from the tree
   */
  private extractConclusions(tree: ReasoningTree, bestBranches: ReasoningBranch[]): string[] {
    const conclusions: string[] = []

    // Conclusions from best branches
    for (const branch of bestBranches) {
      for (const conclusion of branch.conclusions) {
        if (!conclusions.includes(conclusion)) {
          conclusions.push(conclusion)
        }
      }
    }

    // Build best path
    if (bestBranches.length > 0) {
      tree.bestPath = this.buildBestPath(bestBranches[0], tree)
    }

    return conclusions
  }

  /**
   * Build the best path from a branch to root
   */
  private buildBestPath(branch: ReasoningBranch, tree: ReasoningTree): string[] {
    const path: string[] = [branch.id]
    let current = branch

    while (current.parentId) {
      path.unshift(current.parentId)
      current = tree.branches.get(current.parentId)!
    }

    return path
  }

  /**
   * Calculate exploration statistics
   */
  private calculateStatistics(tree: ReasoningTree): ExplorationStatistics {
    const branches = Array.from(tree.branches.values())
    const explored = branches.filter(b => b.status === 'completed')
    const evaluations = branches.filter(b => b.evaluation)

    const avgViability = evaluations.length > 0
      ? evaluations.reduce((sum, b) => sum + (b.evaluation?.viability || 0), 0) / evaluations.length
      : 0

    return {
      totalBranches: tree.totalNodes,
      exploredBranches: explored.length,
      prunedBranches: tree.prunedNodes,
      mergedBranches: tree.mergedNodes,
      averageDepth: branches.reduce((sum, b) => sum + b.depth, 0) / Math.max(branches.length, 1),
      maxDepth: tree.depth,
      averageViability: avgViability,
      explorationEfficiency: explored.length / Math.max(tree.totalNodes, 1)
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get stored solution by ID
   */
  getSolution(id: string): Solution | undefined {
    return this.solutions.get(id)
  }

  /**
   * Get stored alternative by ID
   */
  getAlternative(id: string): SolutionAlternative | undefined {
    return this.alternatives.get(id)
  }

  /**
   * Get stored reasoning tree by ID
   */
  getTree(id: string): ReasoningTree | undefined {
    return this.trees.get(id)
  }

  /**
   * Get all stored solutions
   */
  getAllSolutions(): Solution[] {
    return Array.from(this.solutions.values())
  }

  /**
   * Get all stored alternatives
   */
  getAllAlternatives(): SolutionAlternative[] {
    return Array.from(this.alternatives.values())
  }

  /**
   * Get all stored reasoning trees
   */
  getAllTrees(): ReasoningTree[] {
    return Array.from(this.trees.values())
  }

  /**
   * Clear all stored data
   */
  clear(): void {
    this.solutions.clear()
    this.alternatives.clear()
    this.trees.clear()
    this.branchCounter = 0
    this.solutionCounter = 0
  }

  /**
   * Update generation configuration
   */
  setGenerationConfig(config: Partial<AlternativeGenerationConfig>): void {
    this.generationConfig = { ...this.generationConfig, ...config }
  }

  /**
   * Update exploration configuration
   */
  setExplorationConfig(config: Partial<BranchExplorationConfig>): void {
    this.explorationConfig = { ...this.explorationConfig, ...config }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let engineInstance: AlternativeSolutionsEngine | null = null

/**
 * Get the singleton instance of the Alternative Solutions Engine
 */
export async function getAlternativeEngine(): Promise<AlternativeSolutionsEngine> {
  if (!engineInstance) {
    engineInstance = new AlternativeSolutionsEngine()
    await engineInstance.initialize()
  }
  return engineInstance
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Generate alternatives for a problem (convenience function)
 */
export async function generateAlternatives(
  problem: string,
  context?: {
    constraints?: string[]
    existingCode?: string
    preferences?: Record<string, unknown>
  }
): Promise<AlternativeGenerationResult> {
  const engine = await getAlternativeEngine()
  return engine.generateAlternatives(problem, context)
}

/**
 * Explore reasoning branches for a problem (convenience function)
 */
export async function exploreBranches(
  problem: string,
  initialHypotheses?: string[]
): Promise<BranchExplorationResult> {
  const engine = await getAlternativeEngine()
  return engine.exploreBranches(problem, initialHypotheses)
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new solution
 */
export function createSolution(
  name: string,
  description: string,
  approach: SolutionApproach,
  options?: {
    implementation?: string
    complexity?: ComplexityLevel
    tags?: string[]
  }
): Solution {
  return {
    id: `sol-${Date.now().toString(36)}`,
    name,
    description,
    approach,
    implementation: options?.implementation || '',
    complexity: options?.complexity || 'medium',
    estimatedEffort: {
      timeHours: 8,
      linesOfCode: 200,
      dependencies: 2,
      riskLevel: 'moderate'
    },
    tags: options?.tags || [],
    metadata: {},
    createdAt: new Date()
  }
}

/**
 * Create a new tradeoff
 */
export function createTradeoff(
  factor: string,
  giveUp: string,
  gain: string,
  impact: Tradeoff['impact'] = 'moderate'
): Tradeoff {
  return {
    id: `to-${Date.now().toString(36)}`,
    factor,
    description: `Trading ${giveUp} for ${gain}`,
    giveUp,
    gain,
    impact,
    reversible: true
  }
}

/**
 * Create a reasoning branch
 */
export function createReasoningBranch(
  hypothesis: string,
  evidence: BranchEvidence[] = [],
  conclusions: string[] = []
): ReasoningBranch {
  return {
    id: `branch-${Date.now().toString(36)}`,
    parentId: null,
    path: 'custom',
    hypothesis,
    evidence,
    conclusions,
    children: [],
    status: 'pending',
    depth: 0,
    createdAt: new Date()
  }
}
