/**
 * Reasoning Pattern Library
 * Implements mechanisms #66-70: Reasoning Pattern Library and Adaptive Reasoning Strategies
 * 
 * Features:
 * - Pattern library management - Store and manage reasoning patterns
 * - Pattern retrieval - Find matching patterns for given contexts
 * - Pattern adaptation - Adapt patterns to specific contexts
 * - Pattern learning - Learn new patterns from observations
 * - Adaptive strategy selection - Select best strategy for reasoning
 * - Strategy evaluation - Evaluate effectiveness of strategies
 * - Pattern versioning - Version control for patterns
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Reasoning context for pattern matching
 */
export interface ReasoningContext {
  /** Domain of the problem */
  domain: string;
  /** Problem type classification */
  problemType: ProblemType;
  /** Complexity level (0-1) */
  complexity: number;
  /** Available resources */
  resources: ResourceConstraints;
  /** Time pressure (0-1, higher = more pressure) */
  timePressure: number;
  /** Certainty of information (0-1) */
  informationCertainty: number;
  /** Stakeholder preferences */
  stakeholderPreferences?: Record<string, unknown>;
  /** Historical outcomes for similar problems */
  historicalOutcomes?: HistoricalOutcome[];
  /** Additional context metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Resource constraints for reasoning
 */
export interface ResourceConstraints {
  /** Maximum time in milliseconds */
  maxTime: number;
  /** Maximum memory in MB */
  maxMemory: number;
  /** Maximum computational steps */
  maxSteps: number;
  /** Available tools/APIs */
  availableTools: string[];
}

/**
 * Historical outcome for learning
 */
export interface HistoricalOutcome {
  /** Pattern used */
  patternId: string;
  /** Outcome success (0-1) */
  success: number;
  /** Time taken in ms */
  timeTaken: number;
  /** Resources used */
  resourcesUsed: number;
  /** Feedback notes */
  feedback?: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Problem type classification
 */
export type ProblemType = 
  | 'diagnostic'
  | 'planning'
  | 'optimization'
  | 'prediction'
  | 'classification'
  | 'generation'
  | 'analysis'
  | 'synthesis'
  | 'evaluation'
  | 'decision'
  | 'creative'
  | 'debugging';

/**
 * Reasoning pattern definition
 */
export interface ReasoningPattern {
  /** Unique pattern identifier */
  id: string;
  /** Pattern name */
  name: string;
  /** Pattern description */
  description: string;
  /** Problem types this pattern applies to */
  applicableProblemTypes: ProblemType[];
  /** Domains this pattern is optimized for */
  domains: string[];
  /** Pattern category */
  category: PatternCategory;
  /** Pattern steps/algorithm */
  steps: ReasoningStep[];
  /** Preconditions for using this pattern */
  preconditions: PatternCondition[];
  /** Expected outcomes */
  expectedOutcomes: ExpectedOutcome[];
  /** Performance metrics */
  performance: PatternPerformance;
  /** Usage statistics */
  usageStats: PatternUsageStats;
  /** Pattern version */
  version: number;
  /** Parent pattern ID (if adapted from another) */
  parentPatternId?: string;
  /** Tags for searchability */
  tags: string[];
  /** Creation timestamp */
  createdAt: number;
  /** Last updated timestamp */
  updatedAt: number;
  /** Pattern author/source */
  source: PatternSource;
}

/**
 * Reasoning step within a pattern
 */
export interface ReasoningStep {
  /** Step identifier */
  id: string;
  /** Step name */
  name: string;
  /** Step description */
  description: string;
  /** Step type */
  type: StepType;
  /** Input requirements */
  inputs: StepInput[];
  /** Expected outputs */
  outputs: StepOutput[];
  /** Sub-steps (for composite steps) */
  subSteps?: ReasoningStep[];
  /** Conditional branching */
  conditions?: StepCondition[];
  /** Estimated time in ms */
  estimatedTime: number;
  /** Required tools */
  requiredTools?: string[];
  /** Retry configuration */
  retryConfig?: RetryConfig;
}

/**
 * Step type classification
 */
export type StepType = 
  | 'analysis'
  | 'synthesis'
  | 'evaluation'
  | 'decision'
  | 'iteration'
  | 'parallel'
  | 'sequential'
  | 'conditional'
  | 'loop'
  | 'recursive'
  | 'external_call';

/**
 * Step input definition
 */
export interface StepInput {
  /** Input name */
  name: string;
  /** Input type */
  type: 'data' | 'context' | 'state' | 'external';
  /** Whether input is required */
  required: boolean;
  /** Default value */
  defaultValue?: unknown;
  /** Validation schema */
  validation?: ValidationSchema;
}

/**
 * Step output definition
 */
export interface StepOutput {
  /** Output name */
  name: string;
  /** Output type */
  type: 'result' | 'state' | 'decision' | 'intermediate';
  /** Output description */
  description: string;
}

/**
 * Step condition for branching
 */
export interface StepCondition {
  /** Condition expression */
  expression: string;
  /** Target step ID if condition is true */
  trueTarget?: string;
  /** Target step ID if condition is false */
  falseTarget?: string;
  /** Priority for evaluation */
  priority: number;
}

/**
 * Retry configuration for steps
 */
export interface RetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number;
  /** Backoff strategy */
  backoffStrategy: 'fixed' | 'linear' | 'exponential';
  /** Initial delay in ms */
  initialDelay: number;
  /** Maximum delay in ms */
  maxDelay: number;
}

/**
 * Pattern condition for applicability
 */
export interface PatternCondition {
  /** Condition type */
  type: 'precondition' | 'invariant' | 'postcondition';
  /** Condition expression */
  expression: string;
  /** Description of condition */
  description: string;
  /** Whether condition is required */
  required: boolean;
}

/**
 * Expected outcome from pattern
 */
export interface ExpectedOutcome {
  /** Outcome description */
  description: string;
  /** Probability of occurrence (0-1) */
  probability: number;
  /** Quality metrics */
  qualityMetrics?: QualityMetric[];
}

/**
 * Quality metric definition
 */
export interface QualityMetric {
  /** Metric name */
  name: string;
  /** Target value */
  targetValue: number;
  /** Acceptable range */
  acceptableRange: [number, number];
  /** Weight in overall quality score */
  weight: number;
}

/**
 * Pattern performance metrics
 */
export interface PatternPerformance {
  /** Average execution time in ms */
  avgExecutionTime: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Resource efficiency (0-1) */
  resourceEfficiency: number;
  /** Quality score (0-1) */
  qualityScore: number;
  /** Scalability score (0-1) */
  scalabilityScore: number;
  /** Robustness score (0-1) */
  robustnessScore: number;
  /** Last performance update */
  lastUpdated: number;
}

/**
 * Pattern usage statistics
 */
export interface PatternUsageStats {
  /** Total usage count */
  totalUses: number;
  /** Successful uses */
  successfulUses: number;
  /** Failed uses */
  failedUses: number;
  /** Average time to completion */
  avgTimeToCompletion: number;
  /** User satisfaction ratings */
  satisfactionRatings: number[];
  /** Most common use contexts */
  commonContexts: Array<{
    context: string;
    count: number;
  }>;
}

/**
 * Pattern category classification
 */
export type PatternCategory = 
  | 'analytical'
  | 'creative'
  | 'systematic'
  | 'heuristic'
  | 'algorithmic'
  | 'hybrid'
  | 'meta';

/**
 * Pattern source information
 */
export interface PatternSource {
  /** Source type */
  type: 'builtin' | 'learned' | 'imported' | 'adapted' | 'user_defined';
  /** Source identifier */
  sourceId: string;
  /** Confidence in source quality (0-1) */
  confidence: number;
}

/**
 * Pattern match result
 */
export interface PatternMatch {
  /** Matched pattern */
  pattern: ReasoningPattern;
  /** Match score (0-1) */
  score: number;
  /** Matched elements */
  matchedElements: MatchedElement[];
  /** Unmatched elements */
  unmatchedElements: UnmatchedElement[];
  /** Adaptations needed */
  adaptationsNeeded: PatternAdaptation[];
  /** Confidence in match (0-1) */
  confidence: number;
  /** Reasoning for match score */
  matchReasoning: string;
}

/**
 * Matched element in pattern
 */
export interface MatchedElement {
  /** Element type */
  type: 'problem_type' | 'domain' | 'step' | 'condition' | 'resource';
  /** Element identifier */
  elementId: string;
  /** Match quality (0-1) */
  quality: number;
  /** Match details */
  details: string;
}

/**
 * Unmatched element in pattern
 */
export interface UnmatchedElement {
  /** Element type */
  type: 'problem_type' | 'domain' | 'step' | 'condition' | 'resource';
  /** Element identifier or requirement */
  element: string;
  /** Impact on match (0-1) */
  impact: number;
  /** Reason for not matching */
  reason: string;
}

/**
 * Pattern adaptation definition
 */
export interface PatternAdaptation {
  /** Adaptation type */
  type: 'parameter_adjustment' | 'step_modification' | 'step_insertion' | 'step_removal' | 'step_reorder' | 'condition_modification';
  /** Target element ID */
  targetElement: string;
  /** Adaptation description */
  description: string;
  /** Adaptation parameters */
  parameters: Record<string, unknown>;
  /** Expected impact */
  expectedImpact: string;
  /** Risk level (0-1) */
  riskLevel: number;
}

/**
 * Strategy evaluation result
 */
export interface StrategyEvaluation {
  /** Evaluated strategy ID */
  strategyId: string;
  /** Overall effectiveness score (0-1) */
  effectiveness: number;
  /** Efficiency score (0-1) */
  efficiency: number;
  /** Quality score (0-1) */
  quality: number;
  /** Robustness score (0-1) */
  robustness: number;
  /** Detailed metrics */
  detailedMetrics: StrategyMetric[];
  /** Strengths identified */
  strengths: string[];
  /** Weaknesses identified */
  weaknesses: string[];
  /** Improvement suggestions */
  improvements: string[];
  /** Comparison with alternatives */
  comparison: StrategyComparison[];
  /** Evaluation timestamp */
  timestamp: number;
  /** Confidence in evaluation (0-1) */
  confidence: number;
}

/**
 * Strategy metric detail
 */
export interface StrategyMetric {
  /** Metric name */
  name: string;
  /** Metric value */
  value: number;
  /** Benchmark value */
  benchmark?: number;
  /** Trend direction */
  trend: 'improving' | 'declining' | 'stable';
  /** Significance (0-1) */
  significance: number;
}

/**
 * Strategy comparison with alternative
 */
export interface StrategyComparison {
  /** Alternative strategy ID */
  alternativeId: string;
  /** Alternative name */
  alternativeName: string;
  /** Comparison dimension */
  dimension: string;
  /** Relative performance (-1 to 1) */
  relativePerformance: number;
  /** Significant difference */
  significantDifference: boolean;
}

/**
 * Pattern version information
 */
export interface PatternVersion {
  /** Version number */
  version: number;
  /** Pattern ID */
  patternId: string;
  /** Pattern snapshot at this version */
  snapshot: ReasoningPattern;
  /** Change description */
  changes: VersionChange[];
  /** Version author */
  author: string;
  /** Creation timestamp */
  createdAt: number;
  /** Whether this version is deprecated */
  deprecated: boolean;
  /** Deprecation reason if applicable */
  deprecationReason?: string;
  /** Performance metrics at this version */
  performance: PatternPerformance;
  /** Tags for this version */
  tags: string[];
}

/**
 * Version change record
 */
export interface VersionChange {
  /** Change type */
  type: 'addition' | 'modification' | 'removal' | 'optimization' | 'bugfix';
  /** Changed element */
  element: string;
  /** Change description */
  description: string;
  /** Rationale for change */
  rationale: string;
}

/**
 * Validation schema definition
 */
export interface ValidationSchema {
  /** Schema type */
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  /** Required properties (for objects) */
  required?: string[];
  /** Property schemas (for objects) */
  properties?: Record<string, ValidationSchema>;
  /** Items schema (for arrays) */
  items?: ValidationSchema;
  /** Minimum value/length */
  minimum?: number;
  /** Maximum value/length */
  maximum?: number;
  /** Pattern (for strings) */
  pattern?: string;
  /** Enum values */
  enum?: unknown[];
}

/**
 * Strategy selection options
 */
export interface StrategySelectionOptions {
  /** Weights for different factors */
  weights?: {
    effectiveness?: number;
    efficiency?: number;
    quality?: number;
    robustness?: number;
    familiarity?: number;
  };
  /** Maximum number of strategies to return */
  maxStrategies?: number;
  /** Minimum score threshold */
  minScore?: number;
  /** Include experimental strategies */
  includeExperimental?: boolean;
  /** Prefer recent patterns */
  preferRecent?: boolean;
  /** Context-specific preferences */
  contextPreferences?: Record<string, number>;
}

/**
 * Learning configuration
 */
export interface LearningConfig {
  /** Learning mode */
  mode: 'supervised' | 'unsupervised' | 'reinforcement' | 'hybrid';
  /** Minimum observations required */
  minObservations: number;
  /** Confidence threshold for learning */
  confidenceThreshold: number;
  /** Whether to adapt existing patterns */
  adaptExisting: boolean;
  /** Whether to create new patterns */
  createNew: boolean;
  /** Validation strategy */
  validationStrategy: 'holdout' | 'cross_validation' | 'bootstrap';
  /** Feature importance weights */
  featureWeights?: Record<string, number>;
}

/**
 * Pattern learning result
 */
export interface PatternLearningResult {
  /** Whether learning was successful */
  success: boolean;
  /** Learned pattern (if successful) */
  pattern?: ReasoningPattern;
  /** Confidence in learned pattern (0-1) */
  confidence: number;
  /** Observations used */
  observationsUsed: number;
  /** Features identified as important */
  importantFeatures: Array<{
    feature: string;
    importance: number;
  }>;
  /** Validation metrics */
  validationMetrics?: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  /** Learning errors/warnings */
  errors: string[];
  /** Warnings during learning */
  warnings: string[];
}

/**
 * Pattern library statistics
 */
export interface PatternLibraryStats {
  /** Total patterns */
  totalPatterns: number;
  /** Patterns by category */
  patternsByCategory: Record<PatternCategory, number>;
  /** Patterns by domain */
  patternsByDomain: Record<string, number>;
  /** Average pattern quality */
  avgQuality: number;
  /** Total usage count */
  totalUsage: number;
  /** Success rate across all patterns */
  overallSuccessRate: number;
  /** Most used patterns */
  mostUsedPatterns: Array<{
    patternId: string;
    patternName: string;
    usageCount: number;
  }>;
  /** Recently added patterns */
  recentPatterns: Array<{
    patternId: string;
    patternName: string;
    addedAt: number;
  }>;
  /** Library health score (0-1) */
  healthScore: number;
}

// ============================================================================
// ReasoningPatternLibrary Class
// ============================================================================

/**
 * Reasoning Pattern Library
 * Manages reasoning patterns, retrieval, adaptation, learning, and versioning
 */
export class ReasoningPatternLibrary {
  private patterns: Map<string, ReasoningPattern> = new Map();
  private versions: Map<string, PatternVersion[]> = new Map();
  private evaluations: Map<string, StrategyEvaluation[]> = new Map();
  private learningHistory: PatternLearningResult[] = [];
  private config: LibraryConfig;

  constructor(config?: Partial<LibraryConfig>) {
    this.config = {
      maxPatterns: 1000,
      maxVersions: 50,
      learningEnabled: true,
      autoVersioning: true,
      adaptationThreshold: 0.7,
      matchThreshold: 0.5,
      ...config
    };
    this.initializeBuiltinPatterns();
  }

  // ==========================================================================
  // Pattern Library Management
  // ==========================================================================

  /**
   * Add a new pattern to the library
   */
  addPattern(pattern: ReasoningPattern): PatternAddResult {
    // Validate pattern
    const validation = this.validatePattern(pattern);
    if (!validation.valid) {
      return {
        success: false,
        patternId: pattern.id,
        errors: validation.errors,
        warnings: validation.warnings
      };
    }

    // Check for duplicates
    if (this.patterns.has(pattern.id)) {
      return {
        success: false,
        patternId: pattern.id,
        errors: ['Pattern with this ID already exists'],
        warnings: []
      };
    }

    // Check capacity
    if (this.patterns.size >= this.config.maxPatterns) {
      return {
        success: false,
        patternId: pattern.id,
        errors: ['Pattern library has reached maximum capacity'],
        warnings: []
      };
    }

    // Add pattern
    this.patterns.set(pattern.id, { ...pattern });

    // Create initial version
    if (this.config.autoVersioning) {
      this.createVersion(pattern.id, 'Initial version', 'system');
    }

    return {
      success: true,
      patternId: pattern.id,
      errors: [],
      warnings: validation.warnings
    };
  }

  /**
   * Update an existing pattern
   */
  updatePattern(
    patternId: string,
    updates: Partial<ReasoningPattern>,
    author: string = 'system'
  ): PatternUpdateResult {
    const existingPattern = this.patterns.get(patternId);
    if (!existingPattern) {
      return {
        success: false,
        patternId,
        errors: ['Pattern not found'],
        warnings: []
      };
    }

    // Merge updates
    const updatedPattern: ReasoningPattern = {
      ...existingPattern,
      ...updates,
      id: patternId, // Ensure ID is not changed
      version: existingPattern.version + 1,
      updatedAt: Date.now()
    };

    // Validate updated pattern
    const validation = this.validatePattern(updatedPattern);
    if (!validation.valid) {
      return {
        success: false,
        patternId,
        errors: validation.errors,
        warnings: validation.warnings
      };
    }

    // Store updated pattern
    this.patterns.set(patternId, updatedPattern);

    // Create new version
    if (this.config.autoVersioning) {
      const changes = this.detectChanges(existingPattern, updatedPattern);
      this.createVersion(patternId, 'Pattern updated', author, changes);
    }

    return {
      success: true,
      patternId,
      newVersion: updatedPattern.version,
      errors: [],
      warnings: validation.warnings
    };
  }

  /**
   * Remove a pattern from the library
   */
  removePattern(patternId: string): PatternRemoveResult {
    if (!this.patterns.has(patternId)) {
      return {
        success: false,
        patternId,
        errors: ['Pattern not found']
      };
    }

    // Mark versions as deprecated instead of deleting
    const versions = this.versions.get(patternId) || [];
    for (const version of versions) {
      version.deprecated = true;
      version.deprecationReason = 'Pattern removed from library';
    }

    // Remove pattern
    this.patterns.delete(patternId);

    return {
      success: true,
      patternId,
      errors: []
    };
  }

  /**
   * Get a pattern by ID
   */
  getPattern(patternId: string): ReasoningPattern | null {
    return this.patterns.get(patternId) || null;
  }

  /**
   * Get all patterns
   */
  getAllPatterns(): ReasoningPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get patterns by filter
   */
  getPatternsByFilter(filter: PatternFilter): ReasoningPattern[] {
    return Array.from(this.patterns.values()).filter(pattern => {
      // Filter by category
      if (filter.category && pattern.category !== filter.category) {
        return false;
      }

      // Filter by domain
      if (filter.domain && !pattern.domains.includes(filter.domain)) {
        return false;
      }

      // Filter by problem type
      if (filter.problemType && !pattern.applicableProblemTypes.includes(filter.problemType)) {
        return false;
      }

      // Filter by minimum quality
      if (filter.minQuality !== undefined && pattern.performance.qualityScore < filter.minQuality) {
        return false;
      }

      // Filter by tags
      if (filter.tags && filter.tags.length > 0) {
        const hasTag = filter.tags.some(tag => pattern.tags.includes(tag));
        if (!hasTag) return false;
      }

      // Filter by search query
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const matchesName = pattern.name.toLowerCase().includes(query);
        const matchesDescription = pattern.description.toLowerCase().includes(query);
        if (!matchesName && !matchesDescription) return false;
      }

      return true;
    });
  }

  /**
   * Get library statistics
   */
  getStats(): PatternLibraryStats {
    const patterns = Array.from(this.patterns.values());

    // Calculate patterns by category
    const patternsByCategory: Record<PatternCategory, number> = {
      analytical: 0,
      creative: 0,
      systematic: 0,
      heuristic: 0,
      algorithmic: 0,
      hybrid: 0,
      meta: 0
    };

    // Calculate patterns by domain
    const patternsByDomain: Record<string, number> = {};

    let totalQuality = 0;
    let totalUsage = 0;
    let successfulUses = 0;

    for (const pattern of patterns) {
      patternsByCategory[pattern.category]++;
      for (const domain of pattern.domains) {
        patternsByDomain[domain] = (patternsByDomain[domain] || 0) + 1;
      }
      totalQuality += pattern.performance.qualityScore;
      totalUsage += pattern.usageStats.totalUses;
      successfulUses += pattern.usageStats.successfulUses;
    }

    // Get most used patterns
    const mostUsedPatterns = patterns
      .sort((a, b) => b.usageStats.totalUses - a.usageStats.totalUses)
      .slice(0, 5)
      .map(p => ({
        patternId: p.id,
        patternName: p.name,
        usageCount: p.usageStats.totalUses
      }));

    // Get recent patterns
    const recentPatterns = patterns
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map(p => ({
        patternId: p.id,
        patternName: p.name,
        addedAt: p.createdAt
      }));

    // Calculate health score
    const coverageScore = Math.min(1, patterns.length / 100); // Assume 100 patterns for good coverage
    const qualityScore = patterns.length > 0 ? totalQuality / patterns.length : 0;
    const usageScore = Math.min(1, totalUsage / 1000); // Assume 1000 uses for good activity
    const healthScore = (coverageScore * 0.3) + (qualityScore * 0.4) + (usageScore * 0.3);

    return {
      totalPatterns: patterns.length,
      patternsByCategory,
      patternsByDomain,
      avgQuality: patterns.length > 0 ? totalQuality / patterns.length : 0,
      totalUsage,
      overallSuccessRate: totalUsage > 0 ? successfulUses / totalUsage : 0,
      mostUsedPatterns,
      recentPatterns,
      healthScore
    };
  }

  // ==========================================================================
  // Pattern Retrieval
  // ==========================================================================

  /**
   * Find patterns matching the given context
   */
  findMatchingPatterns(
    context: ReasoningContext,
    options?: StrategySelectionOptions
  ): PatternMatch[] {
    const matches: PatternMatch[] = [];
    const patterns = Array.from(this.patterns.values());

    for (const pattern of patterns) {
      const match = this.calculatePatternMatch(pattern, context);
      if (match.score >= (options?.minScore ?? this.config.matchThreshold)) {
        matches.push(match);
      }
    }

    // Sort by score
    matches.sort((a, b) => b.score - a.score);

    // Limit results
    const maxResults = options?.maxStrategies ?? 10;
    return matches.slice(0, maxResults);
  }

  /**
   * Get best pattern for context
   */
  getBestPattern(
    context: ReasoningContext,
    options?: StrategySelectionOptions
  ): PatternMatch | null {
    const matches = this.findMatchingPatterns(context, { ...options, maxStrategies: 1 });
    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * Calculate pattern match score
   */
  private calculatePatternMatch(
    pattern: ReasoningPattern,
    context: ReasoningContext
  ): PatternMatch {
    const matchedElements: MatchedElement[] = [];
    const unmatchedElements: UnmatchedElement[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // Check problem type match (weight: 30%)
    const problemTypeWeight = 0.3;
    maxScore += problemTypeWeight;
    if (pattern.applicableProblemTypes.includes(context.problemType)) {
      matchedElements.push({
        type: 'problem_type',
        elementId: context.problemType,
        quality: 1,
        details: `Pattern applies to problem type: ${context.problemType}`
      });
      totalScore += problemTypeWeight;
    } else {
      unmatchedElements.push({
        type: 'problem_type',
        element: context.problemType,
        impact: problemTypeWeight,
        reason: 'Pattern does not support this problem type'
      });
    }

    // Check domain match (weight: 25%)
    const domainWeight = 0.25;
    maxScore += domainWeight;
    const domainMatch = pattern.domains.includes(context.domain) || 
                        pattern.domains.includes('general');
    if (domainMatch) {
      matchedElements.push({
        type: 'domain',
        elementId: context.domain,
        quality: pattern.domains.includes(context.domain) ? 1 : 0.7,
        details: `Pattern applies to domain: ${context.domain}`
      });
      totalScore += domainWeight;
    } else {
      unmatchedElements.push({
        type: 'domain',
        element: context.domain,
        impact: domainWeight * 0.5,
        reason: 'Pattern not optimized for this domain'
      });
      totalScore += domainWeight * 0.5; // Partial credit for general applicability
    }

    // Check complexity compatibility (weight: 15%)
    const complexityWeight = 0.15;
    maxScore += complexityWeight;
    const avgPatternComplexity = pattern.steps.length / 10; // Normalize to 0-1
    const complexityMatch = 1 - Math.abs(context.complexity - avgPatternComplexity);
    if (complexityMatch > 0.5) {
      matchedElements.push({
        type: 'step',
        elementId: 'complexity',
        quality: complexityMatch,
        details: `Pattern complexity compatible with problem`
      });
      totalScore += complexityWeight * complexityMatch;
    } else {
      unmatchedElements.push({
        type: 'step',
        element: 'complexity',
        impact: complexityWeight * (1 - complexityMatch),
        reason: 'Complexity mismatch'
      });
    }

    // Check resource compatibility (weight: 15%)
    const resourceWeight = 0.15;
    maxScore += resourceWeight;
    const resourceScore = this.evaluateResourceCompatibility(pattern, context.resources);
    if (resourceScore > 0.5) {
      matchedElements.push({
        type: 'resource',
        elementId: 'resources',
        quality: resourceScore,
        details: 'Resources compatible with pattern requirements'
      });
      totalScore += resourceWeight * resourceScore;
    } else {
      unmatchedElements.push({
        type: 'resource',
        element: 'resources',
        impact: resourceWeight * (1 - resourceScore),
        reason: 'Insufficient resources for pattern'
      });
    }

    // Check historical performance (weight: 15%)
    const historyWeight = 0.15;
    maxScore += historyWeight;
    const historyScore = this.evaluateHistoricalPerformance(pattern, context);
    if (historyScore > 0) {
      matchedElements.push({
        type: 'condition',
        elementId: 'history',
        quality: historyScore,
        details: 'Historical performance supports pattern selection'
      });
      totalScore += historyWeight * historyScore;
    }

    // Calculate adaptations needed
    const adaptationsNeeded = this.determineAdaptations(pattern, context);

    // Calculate confidence
    const confidence = matchedElements.length / (matchedElements.length + unmatchedElements.length);

    // Generate match reasoning
    const matchReasoning = this.generateMatchReasoning(
      pattern,
      context,
      matchedElements,
      unmatchedElements,
      totalScore / maxScore
    );

    return {
      pattern,
      score: totalScore / maxScore,
      matchedElements,
      unmatchedElements,
      adaptationsNeeded,
      confidence,
      matchReasoning
    };
  }

  /**
   * Evaluate resource compatibility
   */
  private evaluateResourceCompatibility(
    pattern: ReasoningPattern,
    resources: ResourceConstraints
  ): number {
    let score = 1;

    // Check time constraints
    const estimatedTime = pattern.steps.reduce((sum, step) => sum + step.estimatedTime, 0);
    if (estimatedTime > resources.maxTime) {
      score *= 0.5;
    }

    // Check tool availability
    const requiredTools = pattern.steps
      .flatMap(step => step.requiredTools || []);
    const availableTools = new Set(resources.availableTools);
    const missingTools = requiredTools.filter(tool => !availableTools.has(tool));
    if (missingTools.length > 0) {
      score *= Math.max(0.3, 1 - (missingTools.length / requiredTools.length));
    }

    return score;
  }

  /**
   * Evaluate historical performance
   */
  private evaluateHistoricalPerformance(
    pattern: ReasoningPattern,
    context: ReasoningContext
  ): number {
    if (!context.historicalOutcomes || context.historicalOutcomes.length === 0) {
      return 0.5; // Neutral score when no history
    }

    const relevantOutcomes = context.historicalOutcomes.filter(
      outcome => outcome.patternId === pattern.id
    );

    if (relevantOutcomes.length === 0) {
      return 0.5; // Neutral score when no relevant history
    }

    // Calculate weighted average of success
    const avgSuccess = relevantOutcomes.reduce((sum, o) => sum + o.success, 0) / relevantOutcomes.length;
    
    // Consider recency
    const now = Date.now();
    const recencyWeight = relevantOutcomes.map(o => 
      Math.exp(-(now - o.timestamp) / (7 * 24 * 60 * 60 * 1000)) // Decay over 7 days
    );
    const weightedSuccess = relevantOutcomes.reduce((sum, o, i) => 
      sum + o.success * recencyWeight[i], 0
    ) / recencyWeight.reduce((a, b) => a + b, 0);

    return weightedSuccess;
  }

  /**
   * Determine adaptations needed for pattern in context
   */
  private determineAdaptations(
    pattern: ReasoningPattern,
    context: ReasoningContext
  ): PatternAdaptation[] {
    const adaptations: PatternAdaptation[] = [];

    // Check for time pressure adaptations
    if (context.timePressure > 0.7) {
      adaptations.push({
        type: 'step_modification',
        targetElement: 'all',
        description: 'Compress step execution for time pressure',
        parameters: { compressionFactor: 1 - context.timePressure * 0.3 },
        expectedImpact: 'Faster execution with potentially reduced depth',
        riskLevel: context.timePressure * 0.5
      });
    }

    // Check for uncertainty adaptations
    if (context.informationCertainty < 0.5) {
      adaptations.push({
        type: 'step_insertion',
        targetElement: 'beginning',
        description: 'Add information gathering step',
        parameters: { 
          stepType: 'analysis',
          purpose: 'gather_additional_information'
        },
        expectedImpact: 'Better decisions under uncertainty',
        riskLevel: 0.2
      });
    }

    // Check for complexity adaptations
    if (context.complexity > 0.8) {
      adaptations.push({
        type: 'step_modification',
        targetElement: 'all',
        description: 'Add iterative refinement loops',
        parameters: { 
          maxIterations: Math.ceil(context.complexity * 5),
          convergenceThreshold: 0.05
        },
        expectedImpact: 'Better handling of complex problems',
        riskLevel: 0.3
      });
    }

    return adaptations;
  }

  /**
   * Generate match reasoning explanation
   */
  private generateMatchReasoning(
    pattern: ReasoningPattern,
    context: ReasoningContext,
    matched: MatchedElement[],
    unmatched: UnmatchedElement[],
    score: number
  ): string {
    const parts: string[] = [];

    parts.push(`Pattern "${pattern.name}" matches with score ${(score * 100).toFixed(1)}%.`);

    if (matched.length > 0) {
      parts.push(`Matched: ${matched.map(m => m.details).join('; ')}.`);
    }

    if (unmatched.length > 0) {
      parts.push(`Limitations: ${unmatched.map(u => u.reason).join('; ')}.`);
    }

    return parts.join(' ');
  }

  // ==========================================================================
  // Pattern Adaptation
  // ==========================================================================

  /**
   * Adapt a pattern to specific context
   */
  adaptPattern(
    patternId: string,
    context: ReasoningContext,
    adaptations: PatternAdaptation[]
  ): ReasoningPattern | null {
    const originalPattern = this.patterns.get(patternId);
    if (!originalPattern) {
      return null;
    }

    // Create adapted copy
    const adaptedPattern: ReasoningPattern = {
      ...originalPattern,
      id: `${originalPattern.id}-adapted-${Date.now()}`,
      name: `${originalPattern.name} (Adapted)`,
      parentPatternId: patternId,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      source: {
        type: 'adapted',
        sourceId: patternId,
        confidence: originalPattern.source.confidence * 0.9
      }
    };

    // Apply adaptations
    for (const adaptation of adaptations) {
      this.applyAdaptation(adaptedPattern, adaptation);
    }

    return adaptedPattern;
  }

  /**
   * Apply a single adaptation to a pattern
   */
  private applyAdaptation(
    pattern: ReasoningPattern,
    adaptation: PatternAdaptation
  ): void {
    switch (adaptation.type) {
      case 'parameter_adjustment':
        this.applyParameterAdjustment(pattern, adaptation);
        break;
      case 'step_modification':
        this.applyStepModification(pattern, adaptation);
        break;
      case 'step_insertion':
        this.applyStepInsertion(pattern, adaptation);
        break;
      case 'step_removal':
        this.applyStepRemoval(pattern, adaptation);
        break;
      case 'step_reorder':
        this.applyStepReorder(pattern, adaptation);
        break;
      case 'condition_modification':
        this.applyConditionModification(pattern, adaptation);
        break;
    }
  }

  /**
   * Apply parameter adjustment adaptation
   */
  private applyParameterAdjustment(
    pattern: ReasoningPattern,
    adaptation: PatternAdaptation
  ): void {
    const step = pattern.steps.find(s => s.id === adaptation.targetElement);
    if (step && adaptation.parameters) {
      // Apply parameter changes to step inputs
      for (const input of step.inputs) {
        if (adaptation.parameters[input.name] !== undefined) {
          input.defaultValue = adaptation.parameters[input.name];
        }
      }
    }
  }

  /**
   * Apply step modification adaptation
   */
  private applyStepModification(
    pattern: ReasoningPattern,
    adaptation: PatternAdaptation
  ): void {
    if (adaptation.targetElement === 'all') {
      // Apply to all steps
      for (const step of pattern.steps) {
        if (adaptation.parameters.compressionFactor) {
          step.estimatedTime = Math.floor(
            step.estimatedTime * adaptation.parameters.compressionFactor
          );
        }
        if (adaptation.parameters.maxIterations) {
          step.retryConfig = {
            maxAttempts: adaptation.parameters.maxIterations,
            backoffStrategy: 'exponential',
            initialDelay: 100,
            maxDelay: 5000
          };
        }
      }
    } else {
      // Apply to specific step
      const step = pattern.steps.find(s => s.id === adaptation.targetElement);
      if (step) {
        Object.assign(step, adaptation.parameters);
      }
    }
  }

  /**
   * Apply step insertion adaptation
   */
  private applyStepInsertion(
    pattern: ReasoningPattern,
    adaptation: PatternAdaptation
  ): void {
    const newStep: ReasoningStep = {
      id: `inserted-${Date.now()}`,
      name: 'Inserted Step',
      description: adaptation.description,
      type: (adaptation.parameters.stepType as StepType) || 'analysis',
      inputs: [],
      outputs: [{
        name: 'result',
        type: 'intermediate',
        description: 'Step result'
      }],
      estimatedTime: 500,
      ...adaptation.parameters
    };

    if (adaptation.targetElement === 'beginning') {
      pattern.steps.unshift(newStep);
    } else if (adaptation.targetElement === 'end') {
      pattern.steps.push(newStep);
    } else {
      const index = pattern.steps.findIndex(s => s.id === adaptation.targetElement);
      if (index >= 0) {
        pattern.steps.splice(index + 1, 0, newStep);
      }
    }
  }

  /**
   * Apply step removal adaptation
   */
  private applyStepRemoval(
    pattern: ReasoningPattern,
    adaptation: PatternAdaptation
  ): void {
    const index = pattern.steps.findIndex(s => s.id === adaptation.targetElement);
    if (index >= 0) {
      pattern.steps.splice(index, 1);
    }
  }

  /**
   * Apply step reorder adaptation
   */
  private applyStepReorder(
    pattern: ReasoningPattern,
    adaptation: PatternAdaptation
  ): void {
    const { sourceIndex, targetIndex } = adaptation.parameters as {
      sourceIndex: number;
      targetIndex: number;
    };
    
    if (sourceIndex >= 0 && sourceIndex < pattern.steps.length &&
        targetIndex >= 0 && targetIndex < pattern.steps.length) {
      const [step] = pattern.steps.splice(sourceIndex, 1);
      pattern.steps.splice(targetIndex, 0, step);
    }
  }

  /**
   * Apply condition modification adaptation
   */
  private applyConditionModification(
    pattern: ReasoningPattern,
    adaptation: PatternAdaptation
  ): void {
    const condition = pattern.preconditions.find(c => c.type === adaptation.targetElement);
    if (condition) {
      condition.expression = adaptation.parameters.expression as string;
      condition.description = adaptation.description;
    }
  }

  // ==========================================================================
  // Pattern Learning
  // ==========================================================================

  /**
   * Learn new patterns from observations
   */
  learnFromObservations(
    observations: LearningObservation[],
    config?: Partial<LearningConfig>
  ): PatternLearningResult {
    const learningConfig: LearningConfig = {
      mode: 'hybrid',
      minObservations: 5,
      confidenceThreshold: 0.7,
      adaptExisting: true,
      createNew: true,
      validationStrategy: 'cross_validation',
      ...config
    };

    // Check minimum observations
    if (observations.length < learningConfig.minObservations) {
      return {
        success: false,
        confidence: 0,
        observationsUsed: observations.length,
        importantFeatures: [],
        errors: [`Insufficient observations: ${observations.length} < ${learningConfig.minObservations}`],
        warnings: []
      };
    }

    // Extract features from observations
    const features = this.extractFeatures(observations);
    const importantFeatures = this.identifyImportantFeatures(features, observations);

    // Check if we should adapt existing pattern or create new
    if (learningConfig.adaptExisting && observations[0]?.relatedPatternId) {
      return this.adaptExistingPattern(
        observations,
        features,
        importantFeatures,
        learningConfig
      );
    }

    if (learningConfig.createNew) {
      return this.createNewPattern(
        observations,
        features,
        importantFeatures,
        learningConfig
      );
    }

    return {
      success: false,
      confidence: 0,
      observationsUsed: observations.length,
      importantFeatures,
      errors: ['No learning action specified'],
      warnings: []
    };
  }

  /**
   * Extract features from observations
   */
  private extractFeatures(observations: LearningObservation[]): ExtractedFeatures {
    const features: ExtractedFeatures = {
      problemTypes: new Map(),
      domains: new Map(),
      stepSequences: new Map(),
      successFactors: new Map(),
      failureFactors: new Map(),
      contextPatterns: new Map()
    };

    for (const obs of observations) {
      // Count problem types
      const problemType = obs.context.problemType;
      features.problemTypes.set(problemType, (features.problemTypes.get(problemType) || 0) + 1);

      // Count domains
      const domain = obs.context.domain;
      features.domains.set(domain, (features.domains.get(domain) || 0) + 1);

      // Extract step sequences
      if (obs.steps) {
        const stepKey = obs.steps.map(s => s.type).join('->');
        features.stepSequences.set(stepKey, (features.stepSequences.get(stepKey) || 0) + 1);
      }

      // Extract success/failure factors
      if (obs.success > 0.7) {
        for (const factor of obs.factors || []) {
          features.successFactors.set(factor, (features.successFactors.get(factor) || 0) + 1);
        }
      } else if (obs.success < 0.3) {
        for (const factor of obs.factors || []) {
          features.failureFactors.set(factor, (features.failureFactors.get(factor) || 0) + 1);
        }
      }

      // Extract context patterns
      const contextPattern = this.summarizeContext(obs.context);
      features.contextPatterns.set(
        contextPattern,
        (features.contextPatterns.get(contextPattern) || 0) + 1
      );
    }

    return features;
  }

  /**
   * Identify important features
   */
  private identifyImportantFeatures(
    features: ExtractedFeatures,
    observations: LearningObservation[]
  ): Array<{ feature: string; importance: number }> {
    const importantFeatures: Array<{ feature: string; importance: number }> = [];
    const totalObs = observations.length;

    // Problem type importance
    for (const [type, count] of features.problemTypes) {
      if (count / totalObs > 0.3) {
        importantFeatures.push({
          feature: `problem_type:${type}`,
          importance: count / totalObs
        });
      }
    }

    // Domain importance
    for (const [domain, count] of features.domains) {
      if (count / totalObs > 0.3) {
        importantFeatures.push({
          feature: `domain:${domain}`,
          importance: count / totalObs
        });
      }
    }

    // Step sequence importance
    for (const [sequence, count] of features.stepSequences) {
      if (count / totalObs > 0.5) {
        importantFeatures.push({
          feature: `sequence:${sequence}`,
          importance: count / totalObs
        });
      }
    }

    // Success factors
    for (const [factor, count] of features.successFactors) {
      importantFeatures.push({
        feature: `success_factor:${factor}`,
        importance: count / totalObs
      });
    }

    return importantFeatures.sort((a, b) => b.importance - a.importance);
  }

  /**
   * Summarize context for pattern extraction
   */
  private summarizeContext(context: ReasoningContext): string {
    return `${context.domain}:${context.problemType}:${Math.round(context.complexity * 10)}`;
  }

  /**
   * Adapt existing pattern based on observations
   */
  private adaptExistingPattern(
    observations: LearningObservation[],
    features: ExtractedFeatures,
    importantFeatures: Array<{ feature: string; importance: number }>,
    config: LearningConfig
  ): PatternLearningResult {
    const relatedPatternId = observations[0]?.relatedPatternId;
    if (!relatedPatternId) {
      return {
        success: false,
        confidence: 0,
        observationsUsed: observations.length,
        importantFeatures,
        errors: ['No related pattern ID specified'],
        warnings: []
      };
    }

    const existingPattern = this.patterns.get(relatedPatternId);
    if (!existingPattern) {
      return {
        success: false,
        confidence: 0,
        observationsUsed: observations.length,
        importantFeatures,
        errors: ['Related pattern not found'],
        warnings: []
      };
    }

    // Calculate average success
    const avgSuccess = observations.reduce((sum, o) => sum + o.success, 0) / observations.length;

    // Determine adaptations
    const adaptations: PatternAdaptation[] = [];

    // Add step modifications based on successful observations
    const successfulObs = observations.filter(o => o.success > 0.7);
    if (successfulObs.length > observations.length * 0.5) {
      adaptations.push({
        type: 'parameter_adjustment',
        targetElement: 'all',
        description: 'Optimized based on successful observations',
        parameters: { 
          successRate: avgSuccess,
          observationCount: observations.length
        },
        expectedImpact: 'Improved performance based on historical data',
        riskLevel: 0.2
      });
    }

    // Create adapted pattern
    const adaptedPattern = this.adaptPattern(relatedPatternId, observations[0].context, adaptations);

    if (!adaptedPattern) {
      return {
        success: false,
        confidence: 0,
        observationsUsed: observations.length,
        importantFeatures,
        errors: ['Failed to create adapted pattern'],
        warnings: []
      };
    }

    // Add to library
    const addResult = this.addPattern(adaptedPattern);

    return {
      success: addResult.success,
      pattern: adaptedPattern,
      confidence: avgSuccess,
      observationsUsed: observations.length,
      importantFeatures,
      validationMetrics: {
        accuracy: avgSuccess,
        precision: avgSuccess,
        recall: avgSuccess,
        f1Score: avgSuccess
      },
      errors: addResult.errors,
      warnings: addResult.warnings
    };
  }

  /**
   * Create new pattern from observations
   */
  private createNewPattern(
    observations: LearningObservation[],
    features: ExtractedFeatures,
    importantFeatures: Array<{ feature: string; importance: number }>,
    config: LearningConfig
  ): PatternLearningResult {
    // Determine most common problem type and domain
    let mostCommonProblemType: ProblemType = 'analysis';
    let maxCount = 0;
    for (const [type, count] of features.problemTypes) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonProblemType = type;
      }
    }

    let mostCommonDomain = 'general';
    maxCount = 0;
    for (const [domain, count] of features.domains) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonDomain = domain;
      }
    }

    // Extract common step sequence
    let commonSteps: ReasoningStep[] = [];
    let bestSequence = '';
    maxCount = 0;
    for (const [sequence, count] of features.stepSequences) {
      if (count > maxCount) {
        maxCount = count;
        bestSequence = sequence;
      }
    }

    if (bestSequence) {
      const stepTypes = bestSequence.split('->');
      commonSteps = stepTypes.map((type, index) => ({
        id: `learned-step-${index}`,
        name: `Step ${index + 1}`,
        description: `Learned ${type} step`,
        type: type as StepType,
        inputs: [],
        outputs: [{ name: 'result', type: 'intermediate' as const, description: 'Step result' }],
        estimatedTime: 1000
      }));
    }

    // Calculate confidence
    const avgSuccess = observations.reduce((sum, o) => sum + o.success, 0) / observations.length;

    if (avgSuccess < config.confidenceThreshold) {
      return {
        success: false,
        confidence: avgSuccess,
        observationsUsed: observations.length,
        importantFeatures,
        errors: ['Observation success rate below threshold'],
        warnings: []
      };
    }

    // Create new pattern
    const newPattern: ReasoningPattern = {
      id: `learned-${Date.now()}`,
      name: `Learned Pattern for ${mostCommonProblemType}`,
      description: `Pattern learned from ${observations.length} observations`,
      applicableProblemTypes: [mostCommonProblemType],
      domains: [mostCommonDomain],
      category: 'heuristic',
      steps: commonSteps.length > 0 ? commonSteps : this.getDefaultSteps(mostCommonProblemType),
      preconditions: [],
      expectedOutcomes: [{
        description: 'Successful completion',
        probability: avgSuccess
      }],
      performance: {
        avgExecutionTime: observations.reduce((sum, o) => sum + (o.timeTaken || 0), 0) / observations.length,
        successRate: avgSuccess,
        resourceEfficiency: 0.5,
        qualityScore: avgSuccess,
        scalabilityScore: 0.5,
        robustnessScore: 0.5,
        lastUpdated: Date.now()
      },
      usageStats: {
        totalUses: 0,
        successfulUses: 0,
        failedUses: 0,
        avgTimeToCompletion: 0,
        satisfactionRatings: [],
        commonContexts: []
      },
      version: 1,
      tags: ['learned', mostCommonProblemType, mostCommonDomain],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      source: {
        type: 'learned',
        sourceId: 'observation-based',
        confidence: avgSuccess
      }
    };

    // Add to library
    const addResult = this.addPattern(newPattern);

    // Store in learning history
    const result: PatternLearningResult = {
      success: addResult.success,
      pattern: addResult.success ? newPattern : undefined,
      confidence: avgSuccess,
      observationsUsed: observations.length,
      importantFeatures,
      validationMetrics: {
        accuracy: avgSuccess,
        precision: avgSuccess,
        recall: avgSuccess,
        f1Score: avgSuccess
      },
      errors: addResult.errors,
      warnings: addResult.warnings
    };
    this.learningHistory.push(result);

    return result;
  }

  /**
   * Get default steps for a problem type
   */
  private getDefaultSteps(problemType: ProblemType): ReasoningStep[] {
    const defaultStepsByType: Partial<Record<ProblemType, ReasoningStep[]>> = {
      analysis: [
        { id: 'analyze-1', name: 'Gather Information', description: 'Collect relevant information', type: 'analysis', inputs: [], outputs: [{ name: 'data', type: 'intermediate', description: 'Collected data' }], estimatedTime: 1000 },
        { id: 'analyze-2', name: 'Process Data', description: 'Process and analyze data', type: 'analysis', inputs: [], outputs: [{ name: 'analysis', type: 'result', description: 'Analysis results' }], estimatedTime: 2000 }
      ],
      planning: [
        { id: 'plan-1', name: 'Define Goals', description: 'Define planning goals', type: 'analysis', inputs: [], outputs: [{ name: 'goals', type: 'intermediate', description: 'Defined goals' }], estimatedTime: 500 },
        { id: 'plan-2', name: 'Generate Options', description: 'Generate plan options', type: 'synthesis', inputs: [], outputs: [{ name: 'options', type: 'intermediate', description: 'Plan options' }], estimatedTime: 1500 },
        { id: 'plan-3', name: 'Evaluate Options', description: 'Evaluate plan options', type: 'evaluation', inputs: [], outputs: [{ name: 'plan', type: 'result', description: 'Selected plan' }], estimatedTime: 1000 }
      ],
      decision: [
        { id: 'decide-1', name: 'Identify Alternatives', description: 'Identify decision alternatives', type: 'analysis', inputs: [], outputs: [{ name: 'alternatives', type: 'intermediate', description: 'Decision alternatives' }], estimatedTime: 1000 },
        { id: 'decide-2', name: 'Evaluate Criteria', description: 'Evaluate against criteria', type: 'evaluation', inputs: [], outputs: [{ name: 'evaluation', type: 'intermediate', description: 'Criteria evaluation' }], estimatedTime: 1000 },
        { id: 'decide-3', name: 'Make Decision', description: 'Make final decision', type: 'decision', inputs: [], outputs: [{ name: 'decision', type: 'result', description: 'Final decision' }], estimatedTime: 500 }
      ]
    };

    return defaultStepsByType[problemType] || [
      { id: 'default-1', name: 'Execute', description: 'Default execution step', type: 'sequential', inputs: [], outputs: [{ name: 'result', type: 'result', description: 'Result' }], estimatedTime: 1000 }
    ];
  }

  /**
   * Get learning history
   */
  getLearningHistory(): PatternLearningResult[] {
    return [...this.learningHistory];
  }

  // ==========================================================================
  // Adaptive Strategy Selection
  // ==========================================================================

  /**
   * Select best strategy for context
   */
  selectStrategy(
    context: ReasoningContext,
    options?: StrategySelectionOptions
  ): StrategySelectionResult {
    // Find matching patterns
    const matches = this.findMatchingPatterns(context, options);

    if (matches.length === 0) {
      return {
        success: false,
        selectedPattern: null,
        alternatives: [],
        reasoning: 'No matching patterns found for the given context'
      };
    }

    // Apply custom weights if provided
    const weights = {
      effectiveness: 0.3,
      efficiency: 0.2,
      quality: 0.25,
      robustness: 0.15,
      familiarity: 0.1,
      ...options?.weights
    };

    // Score each match
    const scoredMatches = matches.map(match => {
      const pattern = match.pattern;
      
      const effectivenessScore = pattern.performance.successRate;
      const efficiencyScore = pattern.performance.resourceEfficiency;
      const qualityScore = pattern.performance.qualityScore;
      const robustnessScore = pattern.performance.robustnessScore;
      const familiarityScore = Math.min(1, pattern.usageStats.totalUses / 100);

      const weightedScore = 
        effectivenessScore * weights.effectiveness +
        efficiencyScore * weights.efficiency +
        qualityScore * weights.quality +
        robustnessScore * weights.robustness +
        familiarityScore * weights.familiarity;

      return {
        match,
        weightedScore,
        breakdown: {
          effectiveness: effectivenessScore,
          efficiency: efficiencyScore,
          quality: qualityScore,
          robustness: robustnessScore,
          familiarity: familiarityScore
        }
      };
    });

    // Sort by weighted score
    scoredMatches.sort((a, b) => b.weightedScore - a.weightedScore);

    // Apply context preferences
    if (options?.contextPreferences) {
      for (const scored of scoredMatches) {
        for (const [key, bonus] of Object.entries(options.contextPreferences)) {
          if (scored.match.pattern.tags.includes(key)) {
            scored.weightedScore += bonus;
          }
        }
      }
      // Re-sort after applying preferences
      scoredMatches.sort((a, b) => b.weightedScore - a.weightedScore);
    }

    const selected = scoredMatches[0];
    const alternatives = scoredMatches.slice(1, options?.maxStrategies ?? 5);

    return {
      success: true,
      selectedPattern: selected.match,
      alternatives: alternatives.map(a => a.match),
      reasoning: this.generateSelectionReasoning(selected, context),
      scoreBreakdown: selected.breakdown
    };
  }

  /**
   * Generate selection reasoning
   */
  private generateSelectionReasoning(
    selected: { match: PatternMatch; weightedScore: number; breakdown: Record<string, number> },
    context: ReasoningContext
  ): string {
    const parts: string[] = [];

    parts.push(`Selected pattern "${selected.match.pattern.name}" with overall score ${selected.weightedScore.toFixed(3)}.`);
    
    parts.push(`Score breakdown: effectiveness=${selected.breakdown.effectiveness.toFixed(2)}, ` +
      `efficiency=${selected.breakdown.efficiency.toFixed(2)}, ` +
      `quality=${selected.breakdown.quality.toFixed(2)}, ` +
      `robustness=${selected.breakdown.robustness.toFixed(2)}, ` +
      `familiarity=${selected.breakdown.familiarity.toFixed(2)}.`);

    if (selected.match.adaptationsNeeded.length > 0) {
      parts.push(`${selected.match.adaptationsNeeded.length} adaptations will be applied.`);
    }

    return parts.join(' ');
  }

  // ==========================================================================
  // Strategy Evaluation
  // ==========================================================================

  /**
   * Evaluate a strategy/pattern
   */
  evaluateStrategy(
    patternId: string,
    context?: ReasoningContext,
    executionResult?: ExecutionResult
  ): StrategyEvaluation | null {
    const pattern = this.patterns.get(patternId);
    if (!pattern) {
      return null;
    }

    // Get historical evaluations
    let evaluations = this.evaluations.get(patternId) || [];

    // Calculate metrics
    const detailedMetrics: StrategyMetric[] = [
      {
        name: 'success_rate',
        value: pattern.performance.successRate,
        benchmark: 0.8,
        trend: this.calculateTrend(evaluations, 'effectiveness'),
        significance: 0.9
      },
      {
        name: 'execution_time',
        value: pattern.performance.avgExecutionTime,
        benchmark: 5000,
        trend: this.calculateTrend(evaluations, 'efficiency'),
        significance: 0.7
      },
      {
        name: 'quality_score',
        value: pattern.performance.qualityScore,
        benchmark: 0.75,
        trend: this.calculateTrend(evaluations, 'quality'),
        significance: 0.85
      },
      {
        name: 'robustness',
        value: pattern.performance.robustnessScore,
        benchmark: 0.7,
        trend: this.calculateTrend(evaluations, 'robustness'),
        significance: 0.6
      }
    ];

    // If execution result provided, factor it in
    if (executionResult) {
      detailedMetrics.push({
        name: 'last_execution_success',
        value: executionResult.success ? 1 : 0,
        trend: 'stable',
        significance: 0.5
      });
    }

    // Calculate overall scores
    const effectiveness = pattern.performance.successRate;
    const efficiency = pattern.performance.resourceEfficiency;
    const quality = pattern.performance.qualityScore;
    const robustness = pattern.performance.robustnessScore;

    // Identify strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const improvements: string[] = [];

    if (effectiveness > 0.8) strengths.push('High success rate');
    else if (effectiveness < 0.5) weaknesses.push('Low success rate');

    if (efficiency > 0.8) strengths.push('Excellent resource efficiency');
    else if (efficiency < 0.5) weaknesses.push('Poor resource efficiency');

    if (quality > 0.8) strengths.push('High quality output');
    else if (quality < 0.5) weaknesses.push('Quality issues detected');

    if (robustness > 0.8) strengths.push('Highly robust');
    else if (robustness < 0.5) {
      weaknesses.push('Lacks robustness');
      improvements.push('Add error handling and fallback strategies');
    }

    // Compare with alternatives
    const comparison = this.compareWithAlternatives(pattern, effectiveness, efficiency, quality, robustness);

    const evaluation: StrategyEvaluation = {
      strategyId: patternId,
      effectiveness,
      efficiency,
      quality,
      robustness,
      detailedMetrics,
      strengths,
      weaknesses,
      improvements,
      comparison,
      timestamp: Date.now(),
      confidence: Math.min(1, pattern.usageStats.totalUses / 10)
    };

    // Store evaluation
    evaluations = [...evaluations, evaluation].slice(-50); // Keep last 50
    this.evaluations.set(patternId, evaluations);

    return evaluation;
  }

  /**
   * Calculate trend from historical evaluations
   */
  private calculateTrend(
    evaluations: StrategyEvaluation[],
    metric: keyof StrategyEvaluation
  ): 'improving' | 'declining' | 'stable' {
    if (evaluations.length < 2) return 'stable';

    const recent = evaluations.slice(-5);
    const values = recent.map(e => e[metric] as number).filter(v => typeof v === 'number');
    
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;
    if (diff > 0.05) return 'improving';
    if (diff < -0.05) return 'declining';
    return 'stable';
  }

  /**
   * Compare pattern with alternatives
   */
  private compareWithAlternatives(
    pattern: ReasoningPattern,
    effectiveness: number,
    efficiency: number,
    quality: number,
    robustness: number
  ): StrategyComparison[] {
    const comparisons: StrategyComparison[] = [];
    const alternatives = Array.from(this.patterns.values())
      .filter(p => p.id !== pattern.id && 
                   p.applicableProblemTypes.some(t => pattern.applicableProblemTypes.includes(t)))
      .slice(0, 5);

    for (const alt of alternatives) {
      comparisons.push(
        {
          alternativeId: alt.id,
          alternativeName: alt.name,
          dimension: 'effectiveness',
          relativePerformance: effectiveness - alt.performance.successRate,
          significantDifference: Math.abs(effectiveness - alt.performance.successRate) > 0.1
        },
        {
          alternativeId: alt.id,
          alternativeName: alt.name,
          dimension: 'efficiency',
          relativePerformance: efficiency - alt.performance.resourceEfficiency,
          significantDifference: Math.abs(efficiency - alt.performance.resourceEfficiency) > 0.1
        },
        {
          alternativeId: alt.id,
          alternativeName: alt.name,
          dimension: 'quality',
          relativePerformance: quality - alt.performance.qualityScore,
          significantDifference: Math.abs(quality - alt.performance.qualityScore) > 0.1
        }
      );
    }

    return comparisons;
  }

  /**
   * Get evaluations for a pattern
   */
  getEvaluations(patternId: string): StrategyEvaluation[] {
    return this.evaluations.get(patternId) || [];
  }

  // ==========================================================================
  // Pattern Versioning
  // ==========================================================================

  /**
   * Create a new version of a pattern
   */
  createVersion(
    patternId: string,
    description: string,
    author: string,
    changes: VersionChange[] = []
  ): PatternVersion | null {
    const pattern = this.patterns.get(patternId);
    if (!pattern) {
      return null;
    }

    const versions = this.versions.get(patternId) || [];
    
    // Check version limit
    if (versions.length >= this.config.maxVersions) {
      // Remove oldest non-deprecated version
      const oldestIndex = versions.findIndex(v => !v.deprecated);
      if (oldestIndex >= 0) {
        versions.splice(oldestIndex, 1);
      }
    }

    const newVersion: PatternVersion = {
      version: pattern.version,
      patternId,
      snapshot: { ...pattern },
      changes: changes.length > 0 ? changes : [{
        type: 'modification',
        element: 'pattern',
        description,
        rationale: 'Version created'
      }],
      author,
      createdAt: Date.now(),
      deprecated: false,
      performance: { ...pattern.performance },
      tags: [...pattern.tags]
    };

    versions.push(newVersion);
    this.versions.set(patternId, versions);

    return newVersion;
  }

  /**
   * Get version history for a pattern
   */
  getVersionHistory(patternId: string): PatternVersion[] {
    return this.versions.get(patternId) || [];
  }

  /**
   * Get specific version of a pattern
   */
  getVersion(patternId: string, version: number): PatternVersion | null {
    const versions = this.versions.get(patternId);
    if (!versions) return null;

    return versions.find(v => v.version === version) || null;
  }

  /**
   * Restore pattern to a previous version
   */
  restoreVersion(patternId: string, version: number, author: string = 'system'): boolean {
    const targetVersion = this.getVersion(patternId, version);
    if (!targetVersion) return false;

    const currentPattern = this.patterns.get(patternId);
    if (!currentPattern) return false;

    // Create version of current state before restoring
    this.createVersion(patternId, 'Pre-restore backup', author);

    // Restore from snapshot
    const restored: ReasoningPattern = {
      ...targetVersion.snapshot,
      version: currentPattern.version + 1,
      updatedAt: Date.now()
    };

    this.patterns.set(patternId, restored);

    return true;
  }

  /**
   * Deprecate a version
   */
  deprecateVersion(patternId: string, version: number, reason: string): boolean {
    const versions = this.versions.get(patternId);
    if (!versions) return false;

    const targetVersion = versions.find(v => v.version === version);
    if (!targetVersion) return false;

    targetVersion.deprecated = true;
    targetVersion.deprecationReason = reason;

    return true;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Validate a pattern
   */
  private validatePattern(pattern: ReasoningPattern): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!pattern.id) errors.push('Pattern ID is required');
    if (!pattern.name) errors.push('Pattern name is required');
    if (!pattern.description) errors.push('Pattern description is required');
    if (!pattern.steps || pattern.steps.length === 0) {
      errors.push('Pattern must have at least one step');
    }
    if (!pattern.applicableProblemTypes || pattern.applicableProblemTypes.length === 0) {
      warnings.push('Pattern should specify applicable problem types');
    }

    // Validate steps
    if (pattern.steps) {
      for (const step of pattern.steps) {
        if (!step.id) errors.push(`Step missing ID`);
        if (!step.type) errors.push(`Step ${step.id} missing type`);
        if (step.estimatedTime < 0) warnings.push(`Step ${step.id} has negative estimated time`);
      }
    }

    // Validate performance metrics
    if (pattern.performance) {
      if (pattern.performance.successRate < 0 || pattern.performance.successRate > 1) {
        errors.push('Success rate must be between 0 and 1');
      }
      if (pattern.performance.qualityScore < 0 || pattern.performance.qualityScore > 1) {
        errors.push('Quality score must be between 0 and 1');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Detect changes between two patterns
   */
  private detectChanges(old: ReasoningPattern, new_: ReasoningPattern): VersionChange[] {
    const changes: VersionChange[] = [];

    if (old.name !== new_.name) {
      changes.push({
        type: 'modification',
        element: 'name',
        description: `Name changed from "${old.name}" to "${new_.name}"`,
        rationale: 'Update to pattern name'
      });
    }

    if (old.description !== new_.description) {
      changes.push({
        type: 'modification',
        element: 'description',
        description: 'Description updated',
        rationale: 'Update to pattern description'
      });
    }

    if (old.steps.length !== new_.steps.length) {
      changes.push({
        type: old.steps.length < new_.steps.length ? 'addition' : 'removal',
        element: 'steps',
        description: `Step count changed from ${old.steps.length} to ${new_.steps.length}`,
        rationale: 'Steps modified'
      });
    }

    return changes;
  }

  /**
   * Initialize builtin patterns
   */
  private initializeBuiltinPatterns(): void {
    const builtinPatterns: ReasoningPattern[] = [
      this.createAnalyticalPattern(),
      this.createPlanningPattern(),
      this.createDecisionPattern(),
      this.createDiagnosticPattern(),
      this.createCreativePattern()
    ];

    for (const pattern of builtinPatterns) {
      this.patterns.set(pattern.id, pattern);
    }
  }

  /**
   * Create analytical reasoning pattern
   */
  private createAnalyticalPattern(): ReasoningPattern {
    return {
      id: 'builtin-analytical',
      name: 'Analytical Reasoning',
      description: 'Systematic analysis pattern for breaking down complex problems',
      applicableProblemTypes: ['analysis', 'evaluation', 'classification'],
      domains: ['general', 'scientific', 'business'],
      category: 'analytical',
      steps: [
        {
          id: 'analyze-1',
          name: 'Problem Decomposition',
          description: 'Break down the problem into components',
          type: 'analysis',
          inputs: [{ name: 'problem', type: 'data', required: true }],
          outputs: [{ name: 'components', type: 'intermediate', description: 'Problem components' }],
          estimatedTime: 2000
        },
        {
          id: 'analyze-2',
          name: 'Component Analysis',
          description: 'Analyze each component individually',
          type: 'iteration',
          inputs: [{ name: 'components', type: 'data', required: true }],
          outputs: [{ name: 'analysis', type: 'intermediate', description: 'Component analysis' }],
          estimatedTime: 5000
        },
        {
          id: 'analyze-3',
          name: 'Synthesis',
          description: 'Combine component analyses',
          type: 'synthesis',
          inputs: [{ name: 'analysis', type: 'data', required: true }],
          outputs: [{ name: 'result', type: 'result', description: 'Final analysis' }],
          estimatedTime: 2000
        }
      ],
      preconditions: [
        { type: 'precondition', expression: 'problem.isDefined', description: 'Problem must be defined', required: true }
      ],
      expectedOutcomes: [
        { description: 'Comprehensive analysis', probability: 0.85 }
      ],
      performance: {
        avgExecutionTime: 9000,
        successRate: 0.85,
        resourceEfficiency: 0.75,
        qualityScore: 0.8,
        scalabilityScore: 0.7,
        robustnessScore: 0.75,
        lastUpdated: Date.now()
      },
      usageStats: {
        totalUses: 0,
        successfulUses: 0,
        failedUses: 0,
        avgTimeToCompletion: 9000,
        satisfactionRatings: [],
        commonContexts: []
      },
      version: 1,
      tags: ['builtin', 'analytical', 'systematic'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      source: { type: 'builtin', sourceId: 'core', confidence: 1 }
    };
  }

  /**
   * Create planning reasoning pattern
   */
  private createPlanningPattern(): ReasoningPattern {
    return {
      id: 'builtin-planning',
      name: 'Strategic Planning',
      description: 'Goal-oriented planning pattern for creating actionable plans',
      applicableProblemTypes: ['planning', 'optimization', 'synthesis'],
      domains: ['general', 'business', 'project-management'],
      category: 'systematic',
      steps: [
        {
          id: 'plan-1',
          name: 'Goal Definition',
          description: 'Define clear objectives',
          type: 'analysis',
          inputs: [{ name: 'context', type: 'context', required: true }],
          outputs: [{ name: 'goals', type: 'intermediate', description: 'Defined goals' }],
          estimatedTime: 1500
        },
        {
          id: 'plan-2',
          name: 'Option Generation',
          description: 'Generate multiple approaches',
          type: 'creative',
          inputs: [{ name: 'goals', type: 'data', required: true }],
          outputs: [{ name: 'options', type: 'intermediate', description: 'Plan options' }],
          estimatedTime: 3000
        },
        {
          id: 'plan-3',
          name: 'Option Evaluation',
          description: 'Evaluate options against criteria',
          type: 'evaluation',
          inputs: [{ name: 'options', type: 'data', required: true }],
          outputs: [{ name: 'evaluation', type: 'intermediate', description: 'Option evaluation' }],
          estimatedTime: 2000
        },
        {
          id: 'plan-4',
          name: 'Plan Selection',
          description: 'Select best plan',
          type: 'decision',
          inputs: [{ name: 'evaluation', type: 'data', required: true }],
          outputs: [{ name: 'plan', type: 'result', description: 'Selected plan' }],
          estimatedTime: 1000
        }
      ],
      preconditions: [
        { type: 'precondition', expression: 'context.isDefined', description: 'Context must be provided', required: true }
      ],
      expectedOutcomes: [
        { description: 'Actionable plan created', probability: 0.82 }
      ],
      performance: {
        avgExecutionTime: 7500,
        successRate: 0.82,
        resourceEfficiency: 0.78,
        qualityScore: 0.85,
        scalabilityScore: 0.8,
        robustnessScore: 0.72,
        lastUpdated: Date.now()
      },
      usageStats: {
        totalUses: 0,
        successfulUses: 0,
        failedUses: 0,
        avgTimeToCompletion: 7500,
        satisfactionRatings: [],
        commonContexts: []
      },
      version: 1,
      tags: ['builtin', 'planning', 'strategic'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      source: { type: 'builtin', sourceId: 'core', confidence: 1 }
    };
  }

  /**
   * Create decision reasoning pattern
   */
  private createDecisionPattern(): ReasoningPattern {
    return {
      id: 'builtin-decision',
      name: 'Decision Making',
      description: 'Structured decision-making pattern for complex choices',
      applicableProblemTypes: ['decision', 'evaluation'],
      domains: ['general', 'business', 'management'],
      category: 'algorithmic',
      steps: [
        {
          id: 'decide-1',
          name: 'Alternative Identification',
          description: 'Identify all possible alternatives',
          type: 'analysis',
          inputs: [{ name: 'situation', type: 'data', required: true }],
          outputs: [{ name: 'alternatives', type: 'intermediate', description: 'Decision alternatives' }],
          estimatedTime: 2000
        },
        {
          id: 'decide-2',
          name: 'Criteria Definition',
          description: 'Define evaluation criteria',
          type: 'analysis',
          inputs: [{ name: 'goals', type: 'data', required: false }],
          outputs: [{ name: 'criteria', type: 'intermediate', description: 'Evaluation criteria' }],
          estimatedTime: 1500
        },
        {
          id: 'decide-3',
          name: 'Weighted Evaluation',
          description: 'Evaluate alternatives against criteria',
          type: 'evaluation',
          inputs: [
            { name: 'alternatives', type: 'data', required: true },
            { name: 'criteria', type: 'data', required: true }
          ],
          outputs: [{ name: 'scores', type: 'intermediate', description: 'Evaluation scores' }],
          estimatedTime: 2500
        },
        {
          id: 'decide-4',
          name: 'Decision',
          description: 'Make final decision',
          type: 'decision',
          inputs: [{ name: 'scores', type: 'data', required: true }],
          outputs: [{ name: 'decision', type: 'result', description: 'Final decision' }],
          estimatedTime: 500
        }
      ],
      preconditions: [
        { type: 'precondition', expression: 'situation.isDefined', description: 'Situation must be defined', required: true }
      ],
      expectedOutcomes: [
        { description: 'Clear decision made', probability: 0.88 }
      ],
      performance: {
        avgExecutionTime: 6500,
        successRate: 0.88,
        resourceEfficiency: 0.85,
        qualityScore: 0.82,
        scalabilityScore: 0.75,
        robustnessScore: 0.8,
        lastUpdated: Date.now()
      },
      usageStats: {
        totalUses: 0,
        successfulUses: 0,
        failedUses: 0,
        avgTimeToCompletion: 6500,
        satisfactionRatings: [],
        commonContexts: []
      },
      version: 1,
      tags: ['builtin', 'decision', 'structured'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      source: { type: 'builtin', sourceId: 'core', confidence: 1 }
    };
  }

  /**
   * Create diagnostic reasoning pattern
   */
  private createDiagnosticPattern(): ReasoningPattern {
    return {
      id: 'builtin-diagnostic',
      name: 'Diagnostic Analysis',
      description: 'Problem diagnosis pattern for identifying root causes',
      applicableProblemTypes: ['diagnostic', 'debugging', 'analysis'],
      domains: ['general', 'technical', 'medical'],
      category: 'heuristic',
      steps: [
        {
          id: 'diag-1',
          name: 'Symptom Collection',
          description: 'Collect all symptoms and observations',
          type: 'analysis',
          inputs: [{ name: 'observations', type: 'data', required: true }],
          outputs: [{ name: 'symptoms', type: 'intermediate', description: 'Collected symptoms' }],
          estimatedTime: 2000
        },
        {
          id: 'diag-2',
          name: 'Hypothesis Generation',
          description: 'Generate potential causes',
          type: 'creative',
          inputs: [{ name: 'symptoms', type: 'data', required: true }],
          outputs: [{ name: 'hypotheses', type: 'intermediate', description: 'Diagnostic hypotheses' }],
          estimatedTime: 3000
        },
        {
          id: 'diag-3',
          name: 'Hypothesis Testing',
          description: 'Test each hypothesis',
          type: 'iteration',
          inputs: [{ name: 'hypotheses', type: 'data', required: true }],
          outputs: [{ name: 'results', type: 'intermediate', description: 'Test results' }],
          estimatedTime: 5000,
          retryConfig: { maxAttempts: 3, backoffStrategy: 'exponential', initialDelay: 100, maxDelay: 1000 }
        },
        {
          id: 'diag-4',
          name: 'Root Cause Identification',
          description: 'Identify the root cause',
          type: 'decision',
          inputs: [{ name: 'results', type: 'data', required: true }],
          outputs: [{ name: 'diagnosis', type: 'result', description: 'Root cause diagnosis' }],
          estimatedTime: 1000
        }
      ],
      preconditions: [
        { type: 'precondition', expression: 'observations.isDefined', description: 'Observations must be provided', required: true }
      ],
      expectedOutcomes: [
        { description: 'Root cause identified', probability: 0.78 }
      ],
      performance: {
        avgExecutionTime: 11000,
        successRate: 0.78,
        resourceEfficiency: 0.7,
        qualityScore: 0.75,
        scalabilityScore: 0.65,
        robustnessScore: 0.82,
        lastUpdated: Date.now()
      },
      usageStats: {
        totalUses: 0,
        successfulUses: 0,
        failedUses: 0,
        avgTimeToCompletion: 11000,
        satisfactionRatings: [],
        commonContexts: []
      },
      version: 1,
      tags: ['builtin', 'diagnostic', 'root-cause'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      source: { type: 'builtin', sourceId: 'core', confidence: 1 }
    };
  }

  /**
   * Create creative reasoning pattern
   */
  private createCreativePattern(): ReasoningPattern {
    return {
      id: 'builtin-creative',
      name: 'Creative Synthesis',
      description: 'Creative pattern for generating novel solutions',
      applicableProblemTypes: ['creative', 'generation', 'synthesis'],
      domains: ['general', 'design', 'innovation'],
      category: 'creative',
      steps: [
        {
          id: 'creative-1',
          name: 'Inspiration Gathering',
          description: 'Gather diverse sources of inspiration',
          type: 'analysis',
          inputs: [{ name: 'domain', type: 'context', required: true }],
          outputs: [{ name: 'inspiration', type: 'intermediate', description: 'Gathered inspiration' }],
          estimatedTime: 3000
        },
        {
          id: 'creative-2',
          name: 'Idea Generation',
          description: 'Generate multiple creative ideas',
          type: 'creative',
          inputs: [{ name: 'inspiration', type: 'data', required: true }],
          outputs: [{ name: 'ideas', type: 'intermediate', description: 'Generated ideas' }],
          estimatedTime: 5000
        },
        {
          id: 'creative-3',
          name: 'Idea Refinement',
          description: 'Refine and develop ideas',
          type: 'synthesis',
          inputs: [{ name: 'ideas', type: 'data', required: true }],
          outputs: [{ name: 'refined', type: 'intermediate', description: 'Refined ideas' }],
          estimatedTime: 4000
        },
        {
          id: 'creative-4',
          name: 'Solution Synthesis',
          description: 'Synthesize final creative solution',
          type: 'synthesis',
          inputs: [{ name: 'refined', type: 'data', required: true }],
          outputs: [{ name: 'solution', type: 'result', description: 'Creative solution' }],
          estimatedTime: 2000
        }
      ],
      preconditions: [
        { type: 'precondition', expression: 'domain.isDefined', description: 'Domain must be specified', required: true }
      ],
      expectedOutcomes: [
        { description: 'Novel solution generated', probability: 0.72 }
      ],
      performance: {
        avgExecutionTime: 14000,
        successRate: 0.72,
        resourceEfficiency: 0.65,
        qualityScore: 0.78,
        scalabilityScore: 0.6,
        robustnessScore: 0.55,
        lastUpdated: Date.now()
      },
      usageStats: {
        totalUses: 0,
        successfulUses: 0,
        failedUses: 0,
        avgTimeToCompletion: 14000,
        satisfactionRatings: [],
        commonContexts: []
      },
      version: 1,
      tags: ['builtin', 'creative', 'innovation'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      source: { type: 'builtin', sourceId: 'core', confidence: 1 }
    };
  }
}

// ============================================================================
// Supporting Types and Interfaces
// ============================================================================

interface LibraryConfig {
  maxPatterns: number;
  maxVersions: number;
  learningEnabled: boolean;
  autoVersioning: boolean;
  adaptationThreshold: number;
  matchThreshold: number;
}

interface PatternAddResult {
  success: boolean;
  patternId: string;
  errors: string[];
  warnings: string[];
}

interface PatternUpdateResult {
  success: boolean;
  patternId: string;
  newVersion?: number;
  errors: string[];
  warnings: string[];
}

interface PatternRemoveResult {
  success: boolean;
  patternId: string;
  errors: string[];
}

interface PatternFilter {
  category?: PatternCategory;
  domain?: string;
  problemType?: ProblemType;
  minQuality?: number;
  tags?: string[];
  searchQuery?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface StrategySelectionResult {
  success: boolean;
  selectedPattern: PatternMatch | null;
  alternatives: PatternMatch[];
  reasoning: string;
  scoreBreakdown?: Record<string, number>;
}

interface LearningObservation {
  context: ReasoningContext;
  steps?: Array<{ type: StepType; result: unknown }>;
  success: number;
  timeTaken?: number;
  factors?: string[];
  relatedPatternId?: string;
}

interface ExtractedFeatures {
  problemTypes: Map<ProblemType, number>;
  domains: Map<string, number>;
  stepSequences: Map<string, number>;
  successFactors: Map<string, number>;
  failureFactors: Map<string, number>;
  contextPatterns: Map<string, number>;
}

interface ExecutionResult {
  success: boolean;
  timeTaken: number;
  quality?: number;
  error?: string;
}

// ============================================================================
// Singleton Instance
// ============================================================================

let libraryInstance: ReasoningPatternLibrary | null = null;

/**
 * Get the singleton instance of ReasoningPatternLibrary
 */
export function getReasoningPatternLibrary(): ReasoningPatternLibrary {
  if (!libraryInstance) {
    libraryInstance = new ReasoningPatternLibrary();
  }
  return libraryInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetReasoningPatternLibrary(): void {
  libraryInstance = null;
}
