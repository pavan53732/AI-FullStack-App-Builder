/**
 * Recommendation Engine
 * Mechanisms 398: AI-driven suggestions and recommendations
 */

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  context: RecommendationContext;
  priority: RecommendationPriority;
  confidence: number;
  impact: RecommendationImpact;
  actions: RecommendedAction[];
  alternatives: AlternativeRecommendation[];
  metadata: RecommendationMetadata;
}

export type RecommendationType =
  | 'code_improvement'
  | 'architecture_change'
  | 'dependency_update'
  | 'performance_optimization'
  | 'security_enhancement'
  | 'refactoring'
  | 'testing'
  | 'documentation'
  | 'error_prevention'
  | 'best_practice';

export interface RecommendationContext {
  scope: 'file' | 'module' | 'component' | 'project' | 'system';
  targets: string[];
  relatedCode?: string;
  relatedIssues?: string[];
  triggeredBy: TriggerSource;
}

export type TriggerSource =
  | 'static_analysis'
  | 'runtime_analysis'
  | 'pattern_matching'
  | 'ai_inference'
  | 'user_request'
  | 'scheduled_check';

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface RecommendationImpact {
  productivity: number;  // -1 to 1
  quality: number;       // -1 to 1
  performance: number;   // -1 to 1
  security: number;      // -1 to 1
  maintainability: number; // -1 to 1
}

export interface RecommendedAction {
  id: string;
  type: ActionType;
  description: string;
  code?: string;
  filePath?: string;
  lineNumber?: number;
  automated: boolean;
  estimatedTime: number; // minutes
  prerequisites?: string[];
}

export type ActionType =
  | 'replace_code'
  | 'insert_code'
  | 'delete_code'
  | 'create_file'
  | 'modify_file'
  | 'run_command'
  | 'install_package'
  | 'update_dependency'
  | 'review_manual';

export interface AlternativeRecommendation {
  id: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  confidence: number;
}

export interface RecommendationMetadata {
  createdAt: Date;
  expiresAt?: Date;
  source: string;
  version: string;
  tags: string[];
  feedback: FeedbackSummary;
}

export interface FeedbackSummary {
  positive: number;
  negative: number;
  neutral: number;
  comments: string[];
}

export interface RecommendationFilter {
  types?: RecommendationType[];
  priorities?: RecommendationPriority[];
  scopes?: RecommendationContext['scope'][];
  minConfidence?: number;
  maxAge?: number;
  automated?: boolean;
}

export interface RecommendationResult {
  recommendations: Recommendation[];
  summary: RecommendationSummary;
  personalized: boolean;
  context: ResultContext;
}

export interface RecommendationSummary {
  total: number;
  byPriority: Record<RecommendationPriority, number>;
  byType: Record<RecommendationType, number>;
  averageConfidence: number;
  actionableCount: number;
}

export interface ResultContext {
  analyzedFiles: number;
  analyzedLines: number;
  analysisDuration: number;
  model: string;
}

export class RecommendationEngine {
  private recommendations: Map<string, Recommendation>;
  private patterns: RecommendationPattern[];
  private contextAnalyzer: ContextAnalyzer;
  private learningModel: RecommendationLearningModel;
  private feedbackStore: FeedbackStore;

  constructor() {
    this.recommendations = new Map();
    this.patterns = this.initializePatterns();
    this.contextAnalyzer = new ContextAnalyzer();
    this.learningModel = new RecommendationLearningModel();
    this.feedbackStore = new FeedbackStore();
  }

  /**
   * Generate recommendations for code
   */
  async generateRecommendations(
    code: string,
    context?: AnalysisContext,
    filter?: RecommendationFilter
  ): Promise<RecommendationResult> {
    const startTime = Date.now();
    const recommendations: Recommendation[] = [];

    // Analyze code context
    const analyzedContext = await this.contextAnalyzer.analyze(code, context);

    // Pattern-based recommendations
    recommendations.push(...this.generatePatternBased(code, analyzedContext));

    // AI-inferred recommendations
    recommendations.push(...this.generateAIInferred(code, analyzedContext));

    // Apply filters
    const filtered = this.applyFilters(recommendations, filter);

    // Sort by priority and confidence
    const sorted = this.sortRecommendations(filtered);

    // Personalize based on learning
    const personalized = this.personalizeRecommendations(sorted);

    // Calculate summary
    const summary = this.calculateSummary(personalized);

    return {
      recommendations: personalized,
      summary,
      personalized: true,
      context: {
        analyzedFiles: context?.fileCount || 1,
        analyzedLines: code.split('\n').length,
        analysisDuration: Date.now() - startTime,
        model: 'recommendation-engine-v1',
      },
    };
  }

  /**
   * Get a specific recommendation
   */
  getRecommendation(id: string): Recommendation | undefined {
    return this.recommendations.get(id);
  }

  /**
   * Submit feedback for a recommendation
   */
  submitFeedback(
    recommendationId: string,
    feedback: RecommendationFeedback
  ): void {
    this.feedbackStore.record(recommendationId, feedback);
    this.learningModel.updateFromFeedback(recommendationId, feedback);
  }

  /**
   * Execute a recommendation action
   */
  async executeAction(
    recommendationId: string,
    actionId: string
  ): Promise<ActionResult> {
    const recommendation = this.recommendations.get(recommendationId);
    if (!recommendation) {
      throw new Error('Recommendation not found');
    }

    const action = recommendation.actions.find(a => a.id === actionId);
    if (!action) {
      throw new Error('Action not found');
    }

    if (!action.automated) {
      return {
        success: false,
        message: 'This action requires manual execution',
        requiresManual: true,
      };
    }

    // Execute the action
    const result = await this.performAction(action);

    // Record for learning
    this.learningModel.recordExecution(recommendationId, actionId, result.success);

    return result;
  }

  /**
   * Get recommendation history
   */
  getHistory(filter?: RecommendationFilter): Recommendation[] {
    let history = Array.from(this.recommendations.values());

    if (filter) {
      history = this.applyFilters(history, filter);
    }

    return history.sort((a, b) =>
      b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime()
    );
  }

  /**
   * Dismiss a recommendation
   */
  dismissRecommendation(
    recommendationId: string,
    reason?: string
  ): void {
    const recommendation = this.recommendations.get(recommendationId);
    if (recommendation) {
      this.feedbackStore.record(recommendationId, {
        type: 'dismissed',
        reason,
      });
      this.recommendations.delete(recommendationId);
    }
  }

  private initializePatterns(): RecommendationPattern[] {
    return [
      // Code Improvement Patterns
      {
        type: 'code_improvement',
        pattern: /\.then\s*\([^)]*\)\.then\s*\(/,
        priority: 'medium',
        title: 'Chain promises for better readability',
        description: 'Consider using async/await instead of promise chains',
        impact: { productivity: 0.3, quality: 0.2, performance: 0, security: 0, maintainability: 0.4 },
        action: {
          type: 'replace_code',
          description: 'Convert promise chain to async/await',
          automated: true,
          estimatedTime: 5,
        },
      },
      {
        type: 'code_improvement',
        pattern: /var\s+\w+/,
        priority: 'low',
        title: 'Use const or let instead of var',
        description: 'var has function scope which can lead to bugs. Use const or let for block scope.',
        impact: { productivity: 0.1, quality: 0.3, performance: 0, security: 0.1, maintainability: 0.2 },
        action: {
          type: 'replace_code',
          description: 'Replace var with const or let',
          automated: true,
          estimatedTime: 2,
        },
      },
      {
        type: 'code_improvement',
        pattern: /==\s*(?:null|undefined|''|""|0|false)/,
        priority: 'medium',
        title: 'Use strict equality',
        description: 'Use === instead of == for type-safe comparison',
        impact: { productivity: 0.1, quality: 0.4, performance: 0, security: 0.2, maintainability: 0.2 },
        action: {
          type: 'replace_code',
          description: 'Replace == with ===',
          automated: true,
          estimatedTime: 1,
        },
      },

      // Security Patterns
      {
        type: 'security_enhancement',
        pattern: /eval\s*\(/,
        priority: 'critical',
        title: 'Avoid eval() for security',
        description: 'eval() can execute arbitrary code and is a security risk',
        impact: { productivity: 0, quality: 0.3, performance: 0, security: 0.8, maintainability: 0.2 },
        action: {
          type: 'replace_code',
          description: 'Replace eval with safer alternative',
          automated: false,
          estimatedTime: 15,
        },
      },
      {
        type: 'security_enhancement',
        pattern: /innerHTML\s*=/,
        priority: 'high',
        title: 'Potential XSS vulnerability',
        description: 'Setting innerHTML can lead to XSS attacks if content is not sanitized',
        impact: { productivity: 0, quality: 0.2, performance: 0, security: 0.7, maintainability: 0.1 },
        action: {
          type: 'replace_code',
          description: 'Use textContent or sanitize input',
          automated: false,
          estimatedTime: 10,
        },
      },
      {
        type: 'security_enhancement',
        pattern: /password|secret|api_key|token/i,
        priority: 'critical',
        title: 'Potential sensitive data exposure',
        description: 'Code may contain or reference sensitive credentials',
        impact: { productivity: 0, quality: 0.1, performance: 0, security: 0.9, maintainability: 0.1 },
        action: {
          type: 'review_manual',
          description: 'Review and move credentials to environment variables',
          automated: false,
          estimatedTime: 20,
        },
      },

      // Performance Patterns
      {
        type: 'performance_optimization',
        pattern: /\.map\s*\([^)]*\.map\s*\(/,
        priority: 'medium',
        title: 'Nested array operations',
        description: 'Consider combining array operations for better performance',
        impact: { productivity: 0, quality: 0.1, performance: 0.5, security: 0, maintainability: 0.2 },
        action: {
          type: 'replace_code',
          description: 'Combine array operations',
          automated: true,
          estimatedTime: 10,
        },
      },
      {
        type: 'performance_optimization',
        pattern: /while\s*\(\s*true\s*\)/,
        priority: 'high',
        title: 'Potential infinite loop',
        description: 'Ensure loop has proper termination condition',
        impact: { productivity: 0.1, quality: 0.3, performance: 0.4, security: 0.1, maintainability: 0.2 },
        action: {
          type: 'review_manual',
          description: 'Add termination condition',
          automated: false,
          estimatedTime: 5,
        },
      },
      {
        type: 'performance_optimization',
        pattern: /console\.log\s*\(/,
        priority: 'low',
        title: 'Remove console.log in production',
        description: 'Console statements should be removed or use a logging library',
        impact: { productivity: 0.1, quality: 0.1, performance: 0.2, security: 0.1, maintainability: 0.1 },
        action: {
          type: 'delete_code',
          description: 'Remove console.log',
          automated: true,
          estimatedTime: 1,
        },
      },

      // Error Prevention Patterns
      {
        type: 'error_prevention',
        pattern: /fetch\s*\([^)]+\)(?!\s*\.catch)/,
        priority: 'high',
        title: 'Unhandled promise rejection',
        description: 'Add .catch() or try/catch for error handling',
        impact: { productivity: 0.2, quality: 0.4, performance: 0, security: 0.1, maintainability: 0.3 },
        action: {
          type: 'insert_code',
          description: 'Add error handling',
          automated: true,
          estimatedTime: 5,
        },
      },
      {
        type: 'error_prevention',
        pattern: /JSON\.parse\s*\([^)]+\)(?!\s*(?:try|catch))/,
        priority: 'medium',
        title: 'JSON.parse without try/catch',
        description: 'Wrap JSON.parse in try/catch to handle invalid JSON',
        impact: { productivity: 0.1, quality: 0.3, performance: 0, security: 0, maintainability: 0.3 },
        action: {
          type: 'insert_code',
          description: 'Add try/catch wrapper',
          automated: true,
          estimatedTime: 3,
        },
      },

      // Best Practice Patterns
      {
        type: 'best_practice',
        pattern: /function\s+\w+\s*\([^)]*\)\s*\{(?![^}]*return)/,
        priority: 'low',
        title: 'Consider adding return type',
        description: 'Functions should have explicit return types in TypeScript',
        impact: { productivity: 0.1, quality: 0.2, performance: 0, security: 0, maintainability: 0.3 },
        action: {
          type: 'insert_code',
          description: 'Add return type annotation',
          automated: true,
          estimatedTime: 2,
        },
      },
      {
        type: 'best_practice',
        pattern: /any\s*[,\)\s=]/,
        priority: 'medium',
        title: 'Avoid any type',
        description: 'Use specific types instead of any for better type safety',
        impact: { productivity: 0.1, quality: 0.4, performance: 0, security: 0.1, maintainability: 0.4 },
        action: {
          type: 'replace_code',
          description: 'Replace any with specific type',
          automated: false,
          estimatedTime: 10,
        },
      },
    ];
  }

  private generatePatternBased(
    code: string,
    context: AnalyzedContext
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const pattern of this.patterns) {
      const matches = code.match(pattern.pattern);
      if (matches) {
        recommendations.push(this.createRecommendation(pattern, matches, context));
      }
    }

    return recommendations;
  }

  private generateAIInferred(
    code: string,
    context: AnalyzedContext
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // AI-inferred recommendations based on context
    if (context.complexityScore > 0.7) {
      recommendations.push({
        id: this.generateId(),
        type: 'refactoring',
        title: 'High code complexity detected',
        description: 'Consider breaking down complex code into smaller functions',
        context: {
          scope: 'file',
          targets: context.mainFunctions || [],
          triggeredBy: 'ai_inference',
        },
        priority: 'medium',
        confidence: 0.8,
        impact: {
          productivity: 0.3,
          quality: 0.5,
          performance: 0.1,
          security: 0,
          maintainability: 0.6,
        },
        actions: [
          {
            id: this.generateId(),
            type: 'review_manual',
            description: 'Review and refactor complex functions',
            automated: false,
            estimatedTime: 30,
          },
        ],
        alternatives: [],
        metadata: {
          createdAt: new Date(),
          source: 'ai-inference',
          version: '1.0',
          tags: ['complexity', 'refactoring'],
          feedback: { positive: 0, negative: 0, neutral: 0, comments: [] },
        },
      });
    }

    if (context.testCoverage < 0.5) {
      recommendations.push({
        id: this.generateId(),
        type: 'testing',
        title: 'Low test coverage',
        description: 'Add more tests to improve code reliability',
        context: {
          scope: 'module',
          targets: context.untestedFunctions || [],
          triggeredBy: 'ai_inference',
        },
        priority: 'medium',
        confidence: 0.9,
        impact: {
          productivity: -0.2,
          quality: 0.6,
          performance: 0,
          security: 0.1,
          maintainability: 0.5,
        },
        actions: [
          {
            id: this.generateId(),
            type: 'create_file',
            description: 'Generate unit tests',
            automated: true,
            estimatedTime: 15,
          },
        ],
        alternatives: [],
        metadata: {
          createdAt: new Date(),
          source: 'ai-inference',
          version: '1.0',
          tags: ['testing', 'coverage'],
          feedback: { positive: 0, negative: 0, neutral: 0, comments: [] },
        },
      });
    }

    return recommendations;
  }

  private createRecommendation(
    pattern: RecommendationPattern,
    matches: RegExpMatchArray,
    context: AnalyzedContext
  ): Recommendation {
    const id = this.generateId();
    const actionId = this.generateId();

    return {
      id,
      type: pattern.type,
      title: pattern.title,
      description: pattern.description,
      context: {
        scope: 'file',
        targets: [],
        relatedCode: matches[0],
        triggeredBy: 'pattern_matching',
      },
      priority: pattern.priority,
      confidence: 0.85,
      impact: pattern.impact,
      actions: [
        {
          id: actionId,
          type: pattern.action.type,
          description: pattern.action.description,
          automated: pattern.action.automated,
          estimatedTime: pattern.action.estimatedTime,
        },
      ],
      alternatives: [],
      metadata: {
        createdAt: new Date(),
        source: 'pattern-matching',
        version: '1.0',
        tags: [pattern.type],
        feedback: { positive: 0, negative: 0, neutral: 0, comments: [] },
      },
    };
  }

  private applyFilters(
    recommendations: Recommendation[],
    filter?: RecommendationFilter
  ): Recommendation[] {
    if (!filter) return recommendations;

    return recommendations.filter(rec => {
      if (filter.types && !filter.types.includes(rec.type)) return false;
      if (filter.priorities && !filter.priorities.includes(rec.priority)) return false;
      if (filter.scopes && !filter.scopes.includes(rec.context.scope)) return false;
      if (filter.minConfidence && rec.confidence < filter.minConfidence) return false;
      if (filter.maxAge) {
        const age = Date.now() - rec.metadata.createdAt.getTime();
        if (age > filter.maxAge) return false;
      }
      if (filter.automated !== undefined) {
        const hasAutomated = rec.actions.some(a => a.automated);
        if (filter.automated !== hasAutomated) return false;
      }

      return true;
    });
  }

  private sortRecommendations(
    recommendations: Recommendation[]
  ): Recommendation[] {
    const priorityOrder: Record<RecommendationPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
      info: 4,
    };

    return recommendations.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
  }

  private personalizeRecommendations(
    recommendations: Recommendation[]
  ): Recommendation[] {
    // Adjust based on user history and preferences
    return recommendations.map(rec => {
      const adjusted = { ...rec };
      const personalizationScore = this.learningModel.getPersonalizationScore(rec.type);

      // Adjust confidence based on user history
      adjusted.confidence = adjusted.confidence * (0.8 + personalizationScore * 0.2);

      return adjusted;
    });
  }

  private calculateSummary(
    recommendations: Recommendation[]
  ): RecommendationSummary {
    const summary: RecommendationSummary = {
      total: recommendations.length,
      byPriority: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
      byType: {} as Record<RecommendationType, number>,
      averageConfidence: 0,
      actionableCount: 0,
    };

    for (const rec of recommendations) {
      summary.byPriority[rec.priority]++;
      summary.byType[rec.type] = (summary.byType[rec.type] || 0) + 1;
      summary.averageConfidence += rec.confidence;
      if (rec.actions.some(a => a.automated)) {
        summary.actionableCount++;
      }
    }

    summary.averageConfidence /= recommendations.length || 1;

    return summary;
  }

  private async performAction(action: RecommendedAction): Promise<ActionResult> {
    // Simulate action execution
    return {
      success: true,
      message: `Action ${action.type} completed successfully`,
      changes: action.code ? [{ content: action.code, path: action.filePath || 'unknown' }] : [],
    };
  }

  private generateId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Supporting interfaces and classes
interface RecommendationPattern {
  type: RecommendationType;
  pattern: RegExp;
  priority: RecommendationPriority;
  title: string;
  description: string;
  impact: RecommendationImpact;
  action: {
    type: ActionType;
    description: string;
    automated: boolean;
    estimatedTime: number;
  };
}

interface AnalysisContext {
  filePath?: string;
  fileCount?: number;
  projectType?: string;
  language?: string;
}

interface AnalyzedContext {
  complexityScore: number;
  testCoverage: number;
  mainFunctions: string[];
  untestedFunctions: string[];
}

interface RecommendationFeedback {
  type: 'positive' | 'negative' | 'neutral' | 'dismissed';
  reason?: string;
  details?: string;
}

interface ActionResult {
  success: boolean;
  message: string;
  requiresManual?: boolean;
  changes?: Array<{ content: string; path: string }>;
}

class ContextAnalyzer {
  async analyze(code: string, context?: AnalysisContext): Promise<AnalyzedContext> {
    const lines = code.split('\n').length;
    const functionCount = (code.match(/function\s+\w+|=>\s*{/g) || []).length;
    const complexityScore = Math.min(1, functionCount / 20);

    return {
      complexityScore,
      testCoverage: 0.5,
      mainFunctions: [],
      untestedFunctions: [],
    };
  }
}

class RecommendationLearningModel {
  private scores: Map<RecommendationType, number> = new Map();
  private executions: Map<string, boolean> = new Map();

  getPersonalizationScore(type: RecommendationType): number {
    return this.scores.get(type) || 0.5;
  }

  updateFromFeedback(recommendationId: string, feedback: RecommendationFeedback): void {
    // Update personalization scores
  }

  recordExecution(recommendationId: string, actionId: string, success: boolean): void {
    this.executions.set(`${recommendationId}:${actionId}`, success);
  }
}

class FeedbackStore {
  private feedback: Map<string, RecommendationFeedback[]> = new Map();

  record(recommendationId: string, feedback: RecommendationFeedback): void {
    if (!this.feedback.has(recommendationId)) {
      this.feedback.set(recommendationId, []);
    }
    this.feedback.get(recommendationId)!.push(feedback);
  }
}

// Singleton instance
let engineInstance: RecommendationEngine | null = null;

export function getRecommendationEngine(): RecommendationEngine {
  if (!engineInstance) {
    engineInstance = new RecommendationEngine();
  }
  return engineInstance;
}
