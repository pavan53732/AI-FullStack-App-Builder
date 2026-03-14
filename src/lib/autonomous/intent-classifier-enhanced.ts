/**
 * Enhanced Intent Classification System
 * Mechanisms 1-10: Advanced intent understanding with multi-layer classification
 */

export interface IntentClassification {
  primaryIntent: IntentType;
  secondaryIntents: IntentType[];
  confidence: number;
  entities: ExtractedEntity[];
  context: IntentContext;
  metadata: IntentMetadata;
}

export type IntentType = 
  | 'code_generation'
  | 'code_modification'
  | 'code_analysis'
  | 'debugging'
  | 'refactoring'
  | 'testing'
  | 'documentation'
  | 'deployment'
  | 'architecture'
  | 'security'
  | 'optimization'
  | 'migration'
  | 'explanation'
  | 'question'
  | 'command'
  | 'collaboration'
  | 'learning'
  | 'monitoring'
  | 'unknown';

export interface ExtractedEntity {
  type: EntityType;
  value: string;
  confidence: number;
  position: { start: number; end: number };
  metadata?: Record<string, unknown>;
}

export type EntityType =
  | 'file_path'
  | 'function_name'
  | 'class_name'
  | 'variable_name'
  | 'api_endpoint'
  | 'database_table'
  | 'package_name'
  | 'error_code'
  | 'url'
  | 'version'
  | 'technology'
  | 'pattern'
  | 'concept';

export interface IntentContext {
  conversationHistory: ConversationTurn[];
  projectContext: ProjectContext;
  userPreferences: UserPreferences;
  temporalContext: TemporalContext;
}

export interface ConversationTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  intent?: IntentType;
}

export interface ProjectContext {
  language: string[];
  frameworks: string[];
  projectType: string;
  recentFiles: string[];
  activeBranch?: string;
}

export interface UserPreferences {
  codingStyle: string;
  verbosity: 'concise' | 'detailed' | 'comprehensive';
  explanationLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredPatterns: string[];
}

export interface TemporalContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  sessionDuration: number;
  interactionCount: number;
}

export interface IntentMetadata {
  complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  scope: 'local' | 'file' | 'module' | 'project' | 'system';
  estimatedEffort: number; // in minutes
  requiredCapabilities: string[];
  potentialRisks: string[];
}

export class EnhancedIntentClassifier {
  private patterns: Map<IntentType, RegExp[]>;
  private entityExtractors: Map<EntityType, EntityExtractor>;
  private contextAnalyzer: ContextAnalyzer;
  private confidenceThreshold = 0.7;

  constructor() {
    this.patterns = this.initializePatterns();
    this.entityExtractors = this.initializeEntityExtractors();
    this.contextAnalyzer = new ContextAnalyzer();
  }

  /**
   * Main classification method
   */
  async classifyIntent(
    prompt: string,
    context?: Partial<IntentContext>
  ): Promise<IntentClassification> {
    // Step 1: Pattern-based initial classification
    const patternResults = this.matchPatterns(prompt);
    
    // Step 2: Semantic understanding
    const semanticResults = await this.semanticClassification(prompt);
    
    // Step 3: Context-aware refinement
    const contextResults = this.contextAnalyzer.analyze(prompt, context);
    
    // Step 4: Combine results with confidence scoring
    const combinedIntent = this.combineResults(
      patternResults,
      semanticResults,
      contextResults
    );
    
    // Step 5: Extract entities
    const entities = await this.extractEntities(prompt);
    
    // Step 6: Calculate metadata
    const metadata = await this.calculateMetadata(prompt, combinedIntent, entities);
    
    return {
      primaryIntent: combinedIntent.primary,
      secondaryIntents: combinedIntent.secondary,
      confidence: combinedIntent.confidence,
      entities,
      context: this.buildContext(context),
      metadata,
    };
  }

  /**
   * Multi-pass classification for complex prompts
   */
  async classifyComplexIntent(
    prompt: string,
    context?: Partial<IntentContext>
  ): Promise<IntentClassification[]> {
    const sentences = this.splitIntoSentences(prompt);
    const classifications: IntentClassification[] = [];

    for (const sentence of sentences) {
      if (sentence.trim().length > 10) {
        const classification = await this.classifyIntent(sentence, context);
        classifications.push(classification);
      }
    }

    // Merge related intents
    return this.mergeRelatedIntents(classifications);
  }

  /**
   * Real-time intent tracking during conversation
   */
  trackIntentEvolution(
    currentClassification: IntentClassification,
    history: IntentClassification[]
  ): IntentEvolution {
    const intentTransitions = this.analyzeTransitions(history);
    const contextShifts = this.detectContextShifts(history);
    const confidenceTrends = this.analyzeConfidenceTrends(history);

    return {
      currentIntent: currentClassification,
      evolutionPath: history.map(h => h.primaryIntent),
      transitions: intentTransitions,
      contextShifts,
      confidenceTrends,
      predictedNextIntent: this.predictNextIntent(history),
    };
  }

  private initializePatterns(): Map<IntentType, RegExp[]> {
    return new Map([
      ['code_generation', [
        /\b(create|generate|write|build|make|implement|develop)\b.*\b(component|function|class|module|api|service)\b/i,
        /\bnew\s+(file|component|feature|module)\b/i,
        /\bi\s+need\s+(a|an|to)\s+\w+/i,
      ]],
      ['code_modification', [
        /\b(change|modify|update|edit|alter|fix|patch)\b.*\b(code|file|function|class)\b/i,
        /\b(refactor|rewrite|restructure)\b/i,
        /\b(add|remove|delete)\s+(feature|code|line|function)\b/i,
      ]],
      ['debugging', [
        /\b(debug|fix|solve|resolve|troubleshoot|investigate)\b.*\b(error|bug|issue|problem)\b/i,
        /\bwhy\s+(is|does|doesn't|can't)\b/i,
        /\b(error|exception|bug|issue|crash|failure)\b/i,
      ]],
      ['code_analysis', [
        /\b(analyze|examine|review|inspect|check|audit)\b.*\b(code|file|project)\b/i,
        /\b(show|display|list|find)\s+(all|me\s+)?\w+\b/i,
        /\bwhat\s+(is|are|does)\s+(the\s+)?\w+\b/i,
      ]],
      ['refactoring', [
        /\b(refactor|clean\s+up|improve|optimize|restructure)\b/i,
        /\b(better|cleaner|more\s+efficient)\s+(way|approach|solution)\b/i,
        /\b(remove|eliminate)\s+(duplicate|redundant|dead)\s+code\b/i,
      ]],
      ['testing', [
        /\b(test|spec|coverage|unit\s+test|integration\s+test|e2e)\b/i,
        /\b(write|generate|create)\s+(tests?|specs?)\b/i,
        /\btest\s+(coverage|case|suite)\b/i,
      ]],
      ['documentation', [
        /\b(document|docs|documentation|readme|comment)\b/i,
        /\b(add|write|generate)\s+(documentation|docs|comments)\b/i,
        /\bexplain\s+(how|what|why)\b/i,
      ]],
      ['deployment', [
        /\b(deploy|release|publish|ship|launch)\b/i,
        /\b(build|bundle|compile|package)\b.*\b(for|to)\s+(production|staging|server)\b/i,
        /\b(ci|cd|pipeline|container|docker|kubernetes)\b/i,
      ]],
      ['architecture', [
        /\b(architecture|design|structure|pattern|system)\b/i,
        /\b(scalable|maintainable|extensible|modular)\b/i,
        /\b(microservice|monolith|layered|clean)\s*(architecture)?\b/i,
      ]],
      ['security', [
        /\b(security|vulnerability|exploit|attack|threat)\b/i,
        /\b(auth|authentication|authorization|permission|access)\b/i,
        /\b(encrypt|decrypt|hash|token|jwt)\b/i,
      ]],
      ['optimization', [
        /\b(optimize|improve|speed\s+up|faster|performance)\b/i,
        /\b(slow|bottleneck|latency|throughput)\b/i,
        /\b(memory|cpu|disk|network)\s+(usage|consumption)\b/i,
      ]],
      ['migration', [
        /\b(migrate|upgrade|convert|transform)\b/i,
        /\b(from|to)\s+(version|v\d+|legacy|new)\b/i,
        /\b(breaking\s+change|deprecation)\b/i,
      ]],
      ['explanation', [
        /\b(explain|describe|tell\s+me|what\s+is)\b/i,
        /\bhow\s+(does|do|can)\s+.+\s+work\b/i,
        /\b(understand|learn|clarify)\b/i,
      ]],
      ['question', [
        /\?$/,
        /\b(can|could|would|should|is|are|do|does|will|has|have)\s+(i|you|we|they)\b/i,
        /\bwhat|why|when|where|who|how\b/i,
      ]],
      ['command', [
        /^\s*(run|execute|start|stop|restart|kill|build|test)\s+/i,
        /\bgit\s+(commit|push|pull|checkout|branch|merge)\b/i,
        /\bnpm\s+|yarn\s+|bun\s+|pnpm\s+/i,
      ]],
      ['collaboration', [
        /\b(review|feedback|suggest|recommend|advise)\b/i,
        /\b(help|assist|support|guide)\b/i,
        /\b(together|collaborate|pair)\b/i,
      ]],
      ['learning', [
        /\b(learn|teach|tutorial|guide|course)\b/i,
        /\b(best\s+practice|pattern|principle)\b/i,
        /\b(example|demo|sample)\b/i,
      ]],
      ['monitoring', [
        /\b(monitor|track|observe|measure|metric)\b/i,
        /\b(log|alert|notification|dashboard)\b/i,
        /\b(health|status|uptime|availability)\b/i,
      ]],
    ]);
  }

  private initializeEntityExtractors(): Map<EntityType, EntityExtractor> {
    return new Map([
      ['file_path', new FilePathExtractor()],
      ['function_name', new FunctionNameExtractor()],
      ['class_name', new ClassNameExtractor()],
      ['variable_name', new VariableNameExtractor()],
      ['api_endpoint', new APIEndpointExtractor()],
      ['database_table', new DatabaseTableExtractor()],
      ['package_name', new PackageNameExtractor()],
      ['error_code', new ErrorCodeExtractor()],
      ['url', new URLExtractor()],
      ['version', new VersionExtractor()],
      ['technology', new TechnologyExtractor()],
      ['pattern', new PatternExtractor()],
      ['concept', new ConceptExtractor()],
    ]);
  }

  private matchPatterns(prompt: string): PatternMatchResult[] {
    const results: PatternMatchResult[] = [];

    for (const [intent, patterns] of this.patterns) {
      for (const pattern of patterns) {
        const match = prompt.match(pattern);
        if (match) {
          results.push({
            intent,
            pattern,
            match: match[0],
            confidence: 0.8,
          });
        }
      }
    }

    return results;
  }

  private async semanticClassification(prompt: string): Promise<SemanticResult> {
    // Semantic analysis using embeddings and context
    const keywords = this.extractKeywords(prompt);
    const semanticVectors = await this.computeSemanticVectors(keywords);
    
    return {
      vectors: semanticVectors,
      keywords,
      confidence: 0.75,
    };
  }

  private async extractEntities(prompt: string): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];

    for (const [type, extractor] of this.entityExtractors) {
      const extracted = await extractor.extract(prompt);
      entities.push(...extracted.map(e => ({ ...e, type })));
    }

    return this.deduplicateEntities(entities);
  }

  private async calculateMetadata(
    prompt: string,
    intent: CombinedIntent,
    entities: ExtractedEntity[]
  ): Promise<IntentMetadata> {
    const complexity = this.assessComplexity(prompt, entities);
    const urgency = this.assessUrgency(prompt);
    const scope = this.assessScope(prompt, entities);
    const effort = this.estimateEffort(prompt, intent, entities);
    const capabilities = this.identifyRequiredCapabilities(intent, entities);
    const risks = this.identifyRisks(intent, entities);

    return {
      complexity,
      urgency,
      scope,
      estimatedEffort: effort,
      requiredCapabilities: capabilities,
      potentialRisks: risks,
    };
  }

  private assessComplexity(
    prompt: string,
    entities: ExtractedEntity[]
  ): IntentMetadata['complexity'] {
    const wordCount = prompt.split(/\s+/).length;
    const entityCount = entities.length;
    const hasMultipleFiles = entities.filter(e => e.type === 'file_path').length > 1;
    const hasComplexKeywords = /\b(complex|advanced|sophisticated|multi|integrate)\b/i.test(prompt);

    if (wordCount > 100 || entityCount > 10 || (hasMultipleFiles && hasComplexKeywords)) {
      return 'very_complex';
    } else if (wordCount > 50 || entityCount > 5 || hasMultipleFiles) {
      return 'complex';
    } else if (wordCount > 20 || entityCount > 2) {
      return 'moderate';
    }
    return 'simple';
  }

  private assessUrgency(prompt: string): IntentMetadata['urgency'] {
    if (/\b(urgent|critical|asap|immediately|emergency|production)\b/i.test(prompt)) {
      return 'critical';
    } else if (/\b(important|priority|quickly|soon)\b/i.test(prompt)) {
      return 'high';
    } else if (/\b(when\s+possible|eventually|later)\b/i.test(prompt)) {
      return 'low';
    }
    return 'medium';
  }

  private assessScope(
    prompt: string,
    entities: ExtractedEntity[]
  ): IntentMetadata['scope'] {
    const filePaths = entities.filter(e => e.type === 'file_path');
    
    if (/\b(project|entire|all|whole|system|architecture)\b/i.test(prompt)) {
      return 'project';
    } else if (/\b(module|package|folder|directory)\b/i.test(prompt)) {
      return 'module';
    } else if (filePaths.length > 1) {
      return 'module';
    } else if (filePaths.length === 1) {
      return 'file';
    }
    return 'local';
  }

  private estimateEffort(
    prompt: string,
    intent: CombinedIntent,
    entities: ExtractedEntity[]
  ): number {
    let baseEffort = 5; // 5 minutes base

    // Adjust for intent type
    const intentEffort: Record<IntentType, number> = {
      code_generation: 30,
      code_modification: 15,
      code_analysis: 10,
      debugging: 25,
      refactoring: 45,
      testing: 20,
      documentation: 15,
      deployment: 30,
      architecture: 60,
      security: 40,
      optimization: 35,
      migration: 60,
      explanation: 5,
      question: 3,
      command: 2,
      collaboration: 10,
      learning: 10,
      monitoring: 15,
      unknown: 10,
    };

    baseEffort = intentEffort[intent.primary] || 10;

    // Adjust for complexity
    const complexityMultiplier = {
      simple: 1,
      moderate: 1.5,
      complex: 2.5,
      very_complex: 4,
    };

    return Math.round(baseEffort * complexityMultiplier[this.assessComplexity(prompt, entities)]);
  }

  private identifyRequiredCapabilities(
    intent: CombinedIntent,
    entities: ExtractedEntity[]
  ): string[] {
    const capabilities = new Set<string>();

    // Intent-based capabilities
    const intentCapabilities: Partial<Record<IntentType, string[]>> = {
      code_generation: ['code_writer', 'syntax_checker', 'formatter'],
      code_modification: ['code_editor', 'diff_generator', 'refactorer'],
      debugging: ['error_analyzer', 'stack_trace_parser', 'debugger'],
      refactoring: ['code_analyzer', 'refactorer', 'test_runner'],
      testing: ['test_generator', 'coverage_analyzer', 'test_runner'],
      architecture: ['dependency_analyzer', 'graph_builder', 'visualizer'],
      security: ['vulnerability_scanner', 'security_auditor', 'compliance_checker'],
      optimization: ['profiler', 'benchmark_runner', 'optimizer'],
    };

    const caps = intentCapabilities[intent.primary];
    if (caps) {
      caps.forEach(c => capabilities.add(c));
    }

    // Entity-based capabilities
    for (const entity of entities) {
      if (entity.type === 'file_path') {
        capabilities.add('file_reader');
        capabilities.add('file_writer');
      }
      if (entity.type === 'api_endpoint') {
        capabilities.add('api_tester');
      }
      if (entity.type === 'database_table') {
        capabilities.add('database_manager');
      }
    }

    return Array.from(capabilities);
  }

  private identifyRisks(
    intent: CombinedIntent,
    entities: ExtractedEntity[]
  ): string[] {
    const risks: string[] = [];

    if (intent.primary === 'code_modification') {
      risks.push('potential_regression');
      risks.push('breaking_changes');
    }

    if (intent.primary === 'deployment') {
      risks.push('downtime');
      risks.push('rollback_needed');
    }

    if (intent.primary === 'migration') {
      risks.push('data_loss');
      risks.push('compatibility_issues');
    }

    if (intent.primary === 'security') {
      risks.push('vulnerability_exposure');
      risks.push('privilege_escalation');
    }

    return risks;
  }

  private combineResults(
    patternResults: PatternMatchResult[],
    semanticResults: SemanticResult,
    contextResults: ContextAnalysisResult
  ): CombinedIntent {
    // Count pattern matches
    const intentCounts = new Map<IntentType, number>();
    for (const result of patternResults) {
      intentCounts.set(result.intent, (intentCounts.get(result.intent) || 0) + 1);
    }

    // Get primary intent
    let primary: IntentType = 'unknown';
    let maxCount = 0;
    for (const [intent, count] of intentCounts) {
      if (count > maxCount) {
        maxCount = count;
        primary = intent;
      }
    }

    // Get secondary intents
    const secondary: IntentType[] = [];
    for (const [intent, count] of intentCounts) {
      if (intent !== primary && count >= 1) {
        secondary.push(intent);
      }
    }

    // Calculate confidence
    const totalMatches = patternResults.length;
    const confidence = totalMatches > 0 ? Math.min(0.95, maxCount / totalMatches + 0.3) : 0.5;

    return { primary, secondary, confidence };
  }

  private buildContext(partial?: Partial<IntentContext>): IntentContext {
    return {
      conversationHistory: partial?.conversationHistory || [],
      projectContext: partial?.projectContext || {
        language: [],
        frameworks: [],
        projectType: 'unknown',
        recentFiles: [],
      },
      userPreferences: partial?.userPreferences || {
        codingStyle: 'standard',
        verbosity: 'detailed',
        explanationLevel: 'intermediate',
        preferredPatterns: [],
      },
      temporalContext: partial?.temporalContext || {
        timeOfDay: 'morning',
        sessionDuration: 0,
        interactionCount: 0,
      },
    };
  }

  private splitIntoSentences(prompt: string): string[] {
    return prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }

  private mergeRelatedIntents(
    classifications: IntentClassification[]
  ): IntentClassification[] {
    // Group by intent and merge similar ones
    const merged = new Map<IntentType, IntentClassification>();

    for (const classification of classifications) {
      const existing = merged.get(classification.primaryIntent);
      if (existing) {
        // Merge entities
        existing.entities.push(...classification.entities);
        // Update confidence (average)
        existing.confidence = (existing.confidence + classification.confidence) / 2;
      } else {
        merged.set(classification.primaryIntent, classification);
      }
    }

    return Array.from(merged.values());
  }

  private analyzeTransitions(history: IntentClassification[]): IntentTransition[] {
    const transitions: IntentTransition[] = [];

    for (let i = 1; i < history.length; i++) {
      transitions.push({
        from: history[i - 1].primaryIntent,
        to: history[i].primaryIntent,
        confidence: history[i].confidence,
      });
    }

    return transitions;
  }

  private detectContextShifts(history: IntentClassification[]): ContextShift[] {
    const shifts: ContextShift[] = [];

    for (let i = 1; i < history.length; i++) {
      if (history[i].primaryIntent !== history[i - 1].primaryIntent) {
        shifts.push({
          position: i,
          from: history[i - 1].primaryIntent,
          to: history[i].primaryIntent,
          reason: 'intent_change',
        });
      }
    }

    return shifts;
  }

  private analyzeConfidenceTrends(history: IntentClassification[]): ConfidenceTrend {
    if (history.length === 0) {
      return { direction: 'stable', average: 0, variance: 0 };
    }

    const confidences = history.map(h => h.confidence);
    const average = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const variance = confidences.reduce((a, b) => a + Math.pow(b - average, 2), 0) / confidences.length;

    const recent = confidences.slice(-3);
    const earlier = confidences.slice(0, -3);

    let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (earlier.length > 0) {
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
      
      if (recentAvg > earlierAvg + 0.1) direction = 'increasing';
      else if (recentAvg < earlierAvg - 0.1) direction = 'decreasing';
    }

    return { direction, average, variance };
  }

  private predictNextIntent(history: IntentClassification[]): IntentType | null {
    if (history.length < 2) return null;

    // Simple Markov chain prediction
    const transitions = this.analyzeTransitions(history);
    const transitionCounts = new Map<IntentType, Map<IntentType, number>>();

    for (const t of transitions) {
      if (!transitionCounts.has(t.from)) {
        transitionCounts.set(t.from, new Map());
      }
      const fromMap = transitionCounts.get(t.from)!;
      fromMap.set(t.to, (fromMap.get(t.to) || 0) + 1);
    }

    const lastIntent = history[history.length - 1].primaryIntent;
    const nextTransitions = transitionCounts.get(lastIntent);

    if (!nextTransitions) return null;

    let maxCount = 0;
    let predicted: IntentType | null = null;

    for (const [intent, count] of nextTransitions) {
      if (count > maxCount) {
        maxCount = count;
        predicted = intent;
      }
    }

    return predicted;
  }

  private extractKeywords(prompt: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once']);
    
    return prompt
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .filter(word => /^[a-z]+$/.test(word));
  }

  private async computeSemanticVectors(keywords: string[]): Promise<number[]> {
    // Simple semantic vector computation (would use embeddings in production)
    const vector = new Array(100).fill(0);
    for (let i = 0; i < keywords.length; i++) {
      const hash = this.simpleHash(keywords[i]);
      vector[hash % vector.length] += 1;
    }
    return vector;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private deduplicateEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
    const seen = new Set<string>();
    return entities.filter(e => {
      const key = `${e.type}:${e.value}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

// Supporting interfaces and classes
interface PatternMatchResult {
  intent: IntentType;
  pattern: RegExp;
  match: string;
  confidence: number;
}

interface SemanticResult {
  vectors: number[];
  keywords: string[];
  confidence: number;
}

interface ContextAnalysisResult {
  relevantContext: string[];
  confidence: number;
}

interface CombinedIntent {
  primary: IntentType;
  secondary: IntentType[];
  confidence: number;
}

interface IntentTransition {
  from: IntentType;
  to: IntentType;
  confidence: number;
}

interface ContextShift {
  position: number;
  from: IntentType;
  to: IntentType;
  reason: string;
}

interface ConfidenceTrend {
  direction: 'increasing' | 'decreasing' | 'stable';
  average: number;
  variance: number;
}

interface IntentEvolution {
  currentIntent: IntentClassification;
  evolutionPath: IntentType[];
  transitions: IntentTransition[];
  contextShifts: ContextShift[];
  confidenceTrends: ConfidenceTrend;
  predictedNextIntent: IntentType | null;
}

abstract class EntityExtractor {
  abstract extract(text: string): Promise<Omit<ExtractedEntity, 'type'>[]>;
}

class FilePathExtractor extends EntityExtractor {
  async extract(text: string): Promise<Omit<ExtractedEntity, 'type'>[]> {
    // Pattern matches file paths with extensions
    const pattern = /(?:^|\s|['"()])([./]?[\w-]+(?:[/][\w-]+)*(?:\.[\w]+)?)(?:\s|['"() ]|$)/g;
    const entities: Omit<ExtractedEntity, 'type'>[] = [];
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const path = match[1];
      if (this.isValidPath(path)) {
        entities.push({
          value: path,
          confidence: 0.85,
          position: { start: match.index, end: match.index + path.length },
        });
      }
    }

    return entities;
  }

  private isValidPath(path: string): boolean {
    return path.includes('/') || /\.[a-zA-Z]{1,10}$/.test(path);
  }
}

class FunctionNameExtractor extends EntityExtractor {
  async extract(text: string): Promise<Omit<ExtractedEntity, 'type'>[]> {
    const patterns = [
      /(?:function\s+|def\s+|func\s+|fn\s+)([a-zA-Z_][a-zA-Z0-9_]*)/g,
      /([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*\{/g,
      /\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
    ];

    const entities: Omit<ExtractedEntity, 'type'>[] = [];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          value: match[1],
          confidence: 0.75,
          position: { start: match.index + match[0].indexOf(match[1]), end: match.index + match[0].indexOf(match[1]) + match[1].length },
        });
      }
    }

    return entities;
  }
}

class ClassNameExtractor extends EntityExtractor {
  async extract(text: string): Promise<Omit<ExtractedEntity, 'type'>[]> {
    const pattern = /(?:class\s+|interface\s+|type\s+)([A-Z][a-zA-Z0-9_]*)/g;
    const entities: Omit<ExtractedEntity, 'type'>[] = [];
    let match;

    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        value: match[1],
        confidence: 0.85,
        position: { start: match.index, end: match.index + match[1].length },
      });
    }

    return entities;
  }
}

class VariableNameExtractor extends EntityExtractor {
  async extract(text: string): Promise<Omit<ExtractedEntity, 'type'>[]> {
    const pattern = /(?:const|let|var|int|string|bool)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
    const entities: Omit<ExtractedEntity, 'type'>[] = [];
    let match;

    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        value: match[1],
        confidence: 0.7,
        position: { start: match.index, end: match.index + match[1].length },
      });
    }

    return entities;
  }
}

class APIEndpointExtractor extends EntityExtractor {
  async extract(text: string): Promise<Omit<ExtractedEntity, 'type'>[]> {
    const pattern = /(\/api\/[a-zA-Z0-9_\-/:]+|['"][A-Z]+\s+\/[a-zA-Z0-9_\-/:]+['"])/g;
    const entities: Omit<ExtractedEntity, 'type'>[] = [];
    let match;

    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        value: match[1],
        confidence: 0.9,
        position: { start: match.index, end: match.index + match[1].length },
      });
    }

    return entities;
  }
}

class DatabaseTableExtractor extends EntityExtractor {
  async extract(text: string): Promise<Omit<ExtractedEntity, 'type'>[]> {
    const patterns = [
      /(?:table|from|into)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
      /(?:CREATE\s+TABLE|ALTER\s+TABLE)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
    ];

    const entities: Omit<ExtractedEntity, 'type'>[] = [];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          value: match[1],
          confidence: 0.8,
          position: { start: match.index, end: match.index + match[1].length },
        });
      }
    }

    return entities;
  }
}

class PackageNameExtractor extends EntityExtractor {
  async extract(text: string): Promise<Omit<ExtractedEntity, 'type'>[]> {
    const patterns = [
      /@[\w-]+\/[\w-]+/g,
      /(?:npm\s+install|yarn\s+add|pip\s+install|go\s+get)\s+([\w-]+)/g,
    ];

    const entities: Omit<ExtractedEntity, 'type'>[] = [];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          value: match[1] || match[0],
          confidence: 0.9,
          position: { start: match.index, end: match.index + match[0].length },
        });
      }
    }

    return entities;
  }
}

class ErrorCodeExtractor extends EntityExtractor {
  async extract(text: string): Promise<Omit<ExtractedEntity, 'type'>[]> {
    const patterns = [
      /E[A-Z]+[0-9]+/g,
      /0x[0-9A-Fa-f]+/g,
      /Error:\s*([A-Za-z0-9_]+)/g,
    ];

    const entities: Omit<ExtractedEntity, 'type'>[] = [];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          value: match[1] || match[0],
          confidence: 0.85,
          position: { start: match.index, end: match.index + match[0].length },
        });
      }
    }

    return entities;
  }
}

class URLExtractor extends EntityExtractor {
  async extract(text: string): Promise<Omit<ExtractedEntity, 'type'>[]> {
    const pattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
    const entities: Omit<ExtractedEntity, 'type'>[] = [];
    let match;

    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        value: match[0],
        confidence: 0.95,
        position: { start: match.index, end: match.index + match[0].length },
      });
    }

    return entities;
  }
}

class VersionExtractor extends EntityExtractor {
  async extract(text: string): Promise<Omit<ExtractedEntity, 'type'>[]> {
    const patterns = [
      /v?\d+\.\d+\.\d+(?:-[a-zA-Z0-9]+)?/g,
      /version\s*[:=]?\s*['"]?(\d+\.\d+\.\d+)/gi,
    ];

    const entities: Omit<ExtractedEntity, 'type'>[] = [];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          value: match[1] || match[0],
          confidence: 0.85,
          position: { start: match.index, end: match.index + match[0].length },
        });
      }
    }

    return entities;
  }
}

class TechnologyExtractor extends EntityExtractor {
  private technologies = [
    'react', 'vue', 'angular', 'svelte', 'nextjs', 'next.js',
    'typescript', 'javascript', 'python', 'java', 'rust', 'go', 'ruby',
    'nodejs', 'node.js', 'express', 'fastapi', 'django', 'rails',
    'postgres', 'postgresql', 'mysql', 'mongodb', 'redis', 'sqlite',
    'docker', 'kubernetes', 'k8s', 'aws', 'azure', 'gcp',
    'graphql', 'rest', 'grpc', 'websocket',
    'tailwind', 'bootstrap', 'sass', 'css',
    'prisma', 'typeorm', 'sequelize', 'mongoose',
    'jest', 'vitest', 'cypress', 'playwright',
    'webpack', 'vite', 'esbuild', 'rollup',
    'eslint', 'prettier', 'typescript-eslint',
  ];

  async extract(text: string): Promise<Omit<ExtractedEntity, 'type'>[]> {
    const entities: Omit<ExtractedEntity, 'type'>[] = [];
    const lowerText = text.toLowerCase();

    for (const tech of this.technologies) {
      const index = lowerText.indexOf(tech);
      if (index !== -1) {
        entities.push({
          value: tech,
          confidence: 0.9,
          position: { start: index, end: index + tech.length },
        });
      }
    }

    return entities;
  }
}

class PatternExtractor extends EntityExtractor {
  private patterns = [
    'singleton', 'factory', 'observer', 'strategy', 'decorator',
    'adapter', 'facade', 'proxy', 'command', 'iterator',
    'mediator', 'memento', 'prototype', 'state', 'template',
    'visitor', 'builder', 'chain of responsibility', 'composite',
    'mvc', 'mvvm', 'mvc', 'clean architecture', 'hexagonal',
    'microservices', 'monolith', 'serverless', 'event-driven',
    'cqrs', 'event sourcing', 'saga', 'repository', 'unit of work',
  ];

  async extract(text: string): Promise<Omit<ExtractedEntity, 'type'>[]> {
    const entities: Omit<ExtractedEntity, 'type'>[] = [];
    const lowerText = text.toLowerCase();

    for (const pattern of this.patterns) {
      const index = lowerText.indexOf(pattern);
      if (index !== -1) {
        entities.push({
          value: pattern,
          confidence: 0.85,
          position: { start: index, end: index + pattern.length },
        });
      }
    }

    return entities;
  }
}

class ConceptExtractor extends EntityExtractor {
  private concepts = [
    'authentication', 'authorization', 'encryption', 'decryption',
    'validation', 'sanitization', 'serialization', 'deserialization',
    'caching', 'pagination', 'filtering', 'sorting',
    'rate limiting', 'throttling', 'queuing', 'scheduling',
    'logging', 'monitoring', 'tracing', 'debugging',
    'testing', 'mocking', 'stubbing', 'faking',
    'dependency injection', 'inversion of control', 'aspect oriented',
    'concurrency', 'parallelism', 'asynchronous', 'synchronous',
  ];

  async extract(text: string): Promise<Omit<ExtractedEntity, 'type'>[]> {
    const entities: Omit<ExtractedEntity, 'type'>[] = [];
    const lowerText = text.toLowerCase();

    for (const concept of this.concepts) {
      const index = lowerText.indexOf(concept);
      if (index !== -1) {
        entities.push({
          value: concept,
          confidence: 0.8,
          position: { start: index, end: index + concept.length },
        });
      }
    }

    return entities;
  }
}

class ContextAnalyzer {
  analyze(prompt: string, context?: Partial<IntentContext>): ContextAnalysisResult {
    const relevantContext: string[] = [];

    if (context?.projectContext) {
      relevantContext.push(`project type: ${context.projectContext.projectType}`);
      relevantContext.push(`languages: ${context.projectContext.language.join(', ')}`);
    }

    if (context?.userPreferences) {
      relevantContext.push(`style: ${context.userPreferences.codingStyle}`);
    }

    return {
      relevantContext,
      confidence: 0.7,
    };
  }
}

// Singleton instance
let classifierInstance: EnhancedIntentClassifier | null = null;

export function getEnhancedIntentClassifier(): EnhancedIntentClassifier {
  if (!classifierInstance) {
    classifierInstance = new EnhancedIntentClassifier();
  }
  return classifierInstance;
}
