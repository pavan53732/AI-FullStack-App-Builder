/**
 * Function Purpose Inference
 * Mechanisms 251: AI-powered understanding of code intent and purpose
 */

export interface FunctionPurpose {
  id: string;
  functionName: string;
  filePath: string;
  purpose: PurposeAnalysis;
  behavior: BehaviorAnalysis;
  dependencies: DependencyAnalysis;
  quality: QualityAssessment;
  documentation: GeneratedDocumentation;
  confidence: number;
}

export interface PurposeAnalysis {
  primaryPurpose: string;
  secondaryPurposes: string[];
  category: FunctionCategory;
  abstractionLevel: 'low' | 'medium' | 'high';
  businessDomain?: string;
  intentKeywords: string[];
}

export type FunctionCategory =
  | 'data_transformation'
  | 'data_access'
  | 'business_logic'
  | 'validation'
  | 'orchestration'
  | 'communication'
  | 'presentation'
  | 'utility'
  | 'initialization'
  | 'lifecycle'
  | 'event_handling'
  | 'error_handling'
  | 'testing'
  | 'configuration';

export interface BehaviorAnalysis {
  inputs: ParameterAnalysis[];
  outputs: OutputAnalysis[];
  sideEffects: SideEffect[];
  stateMutations: StateMutation[];
  errorHandling: ErrorHandlingPattern[];
  asyncBehavior: AsyncBehavior | null;
}

export interface ParameterAnalysis {
  name: string;
  type: string;
  purpose: string;
  constraints: string[];
  required: boolean;
  defaultValue?: unknown;
}

export interface OutputAnalysis {
  type: string;
  description: string;
  possibleValues?: string[];
}

export interface SideEffect {
  type: 'io' | 'network' | 'database' | 'state' | 'logging' | 'dom' | 'timer' | 'other';
  description: string;
  impact: 'low' | 'medium' | 'high';
  reversible: boolean;
}

export interface StateMutation {
  target: string;
  operation: 'read' | 'write' | 'delete' | 'update';
  description: string;
}

export interface ErrorHandlingPattern {
  errorType: string;
  handlingMethod: 'throws' | 'catches' | 'ignores' | 'logs' | 'returns';
  recoveryAction?: string;
}

export interface AsyncBehavior {
  type: 'callback' | 'promise' | 'async_await' | 'stream' | 'event';
  concurrency: 'sequential' | 'parallel' | 'race' | 'mixed';
  cancellable: boolean;
}

export interface DependencyAnalysis {
  internalDependencies: Dependency[];
  externalDependencies: Dependency[];
  implicitDependencies: string[];
  couplingScore: number;
}

export interface Dependency {
  name: string;
  type: 'function' | 'class' | 'module' | 'package' | 'api' | 'database';
  usage: 'calls' | 'extends' | 'implements' | 'imports' | 'queries';
  criticality: 'low' | 'medium' | 'high';
}

export interface QualityAssessment {
  complexity: ComplexityMetrics;
  testability: TestabilityAnalysis;
  maintainability: number;
  securityConsiderations: SecurityConsideration[];
  performanceConsiderations: PerformanceConsideration[];
}

export interface ComplexityMetrics {
  cyclomatic: number;
  cognitive: number;
  linesOfCode: number;
  nestingLevel: number;
  parameterCount: number;
}

export interface TestabilityAnalysis {
  score: number;
  challenges: string[];
  recommendations: string[];
}

export interface SecurityConsideration {
  type: 'input_validation' | 'output_encoding' | 'authentication' | 'authorization' | 'data_exposure' | 'injection' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export interface PerformanceConsideration {
  type: 'time_complexity' | 'space_complexity' | 'io' | 'network' | 'memory';
  description: string;
  impact: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface GeneratedDocumentation {
  summary: string;
  description: string;
  parameters: Record<string, string>;
  returns: string;
  examples: CodeExample[];
  notes: string[];
}

export interface CodeExample {
  code: string;
  description: string;
  output?: string;
}

export interface InferenceOptions {
  includeExamples?: boolean;
  analyzeDeepDependencies?: boolean;
  inferBusinessContext?: boolean;
  generateTests?: boolean;
}

export class FunctionPurposeInferrer {
  private patterns: Map<FunctionCategory, PurposePattern[]>;
  private namingConventions: NamingConvention[];
  private contextCache: Map<string, ContextInfo>;

  constructor() {
    this.patterns = this.initializePatterns();
    this.namingConventions = this.initializeNamingConventions();
    this.contextCache = new Map();
  }

  /**
   * Infer purpose of a function from its code
   */
  async inferPurpose(
    code: string,
    context?: FunctionContext,
    options?: InferenceOptions
  ): Promise<FunctionPurpose> {
    // Step 1: Parse the function
    const parsed = this.parseFunction(code);
    
    // Step 2: Analyze naming
    const namingAnalysis = this.analyzeNaming(parsed.name);
    
    // Step 3: Analyze structure
    const structureAnalysis = this.analyzeStructure(parsed);
    
    // Step 4: Analyze behavior
    const behaviorAnalysis = this.analyzeBehavior(parsed, context);
    
    // Step 5: Analyze dependencies
    const dependencyAnalysis = this.analyzeDependencies(parsed, context, options);
    
    // Step 6: Assess quality
    const qualityAssessment = this.assessQuality(parsed, behaviorAnalysis);
    
    // Step 7: Determine purpose
    const purposeAnalysis = this.determinePurpose(
      parsed,
      namingAnalysis,
      structureAnalysis,
      behaviorAnalysis,
      context
    );
    
    // Step 8: Generate documentation
    const documentation = this.generateDocumentation(
      parsed,
      purposeAnalysis,
      behaviorAnalysis,
      options
    );

    return {
      id: this.generateId(),
      functionName: parsed.name,
      filePath: context?.filePath || 'unknown',
      purpose: purposeAnalysis,
      behavior: behaviorAnalysis,
      dependencies: dependencyAnalysis,
      quality: qualityAssessment,
      documentation,
      confidence: this.calculateConfidence(parsed, purposeAnalysis),
    };
  }

  /**
   * Batch inference for multiple functions
   */
  async batchInfer(
    functions: Array<{ code: string; context?: FunctionContext }>
  ): Promise<FunctionPurpose[]> {
    return Promise.all(
      functions.map(f => this.inferPurpose(f.code, f.context))
    );
  }

  /**
   * Explain why a function has a particular purpose
   */
  explainPurpose(purpose: FunctionPurpose): PurposeExplanation {
    const reasons: PurposeReason[] = [];

    // Explain naming-based reasoning
    if (purpose.purpose.intentKeywords.length > 0) {
      reasons.push({
        type: 'naming',
        description: `Function name contains keywords: ${purpose.purpose.intentKeywords.join(', ')}`,
        confidence: 0.8,
      });
    }

    // Explain structure-based reasoning
    if (purpose.behavior.sideEffects.length > 0) {
      reasons.push({
        type: 'side_effects',
        description: `Has ${purpose.behavior.sideEffects.length} side effects indicating ${purpose.purpose.category}`,
        confidence: 0.7,
      });
    }

    // Explain dependency-based reasoning
    if (purpose.dependencies.externalDependencies.length > 0) {
      reasons.push({
        type: 'dependencies',
        description: `Uses ${purpose.dependencies.externalDependencies.length} external dependencies`,
        confidence: 0.6,
      });
    }

    return {
      purpose: purpose.purpose.primaryPurpose,
      category: purpose.purpose.category,
      reasons,
      alternativePurposes: purpose.purpose.secondaryPurposes,
      confidence: purpose.confidence,
    };
  }

  /**
   * Suggest improvements for a function
   */
  suggestImprovements(purpose: FunctionPurpose): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    // Complexity suggestions
    if (purpose.quality.complexity.cyclomatic > 10) {
      suggestions.push({
        type: 'complexity',
        priority: 'high',
        description: 'Function has high cyclomatic complexity',
        suggestion: 'Consider breaking down into smaller functions',
        impact: 'Improves maintainability and testability',
      });
    }

    // Testability suggestions
    if (purpose.quality.testability.score < 0.5) {
      suggestions.push({
        type: 'testability',
        priority: 'medium',
        description: 'Function is difficult to test',
        suggestion: purpose.quality.testability.recommendations[0] || 'Reduce side effects and dependency coupling',
        impact: 'Enables comprehensive testing',
      });
    }

    // Security suggestions
    for (const security of purpose.quality.securityConsiderations) {
      if (security.severity === 'high' || security.severity === 'critical') {
        suggestions.push({
          type: 'security',
          priority: 'critical',
          description: security.description,
          suggestion: security.recommendation,
          impact: 'Addresses security vulnerability',
        });
      }
    }

    // Documentation suggestions
    if (purpose.documentation.summary.length < 20) {
      suggestions.push({
        type: 'documentation',
        priority: 'low',
        description: 'Function lacks adequate documentation',
        suggestion: 'Add JSDoc comments with purpose description and parameters',
        impact: 'Improves code understanding',
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private initializePatterns(): Map<FunctionCategory, PurposePattern[]> {
    return new Map([
      ['data_transformation', [
        { pattern: /map|transform|convert|parse|stringify|serialize|deserialize/i, weight: 0.8 },
        { pattern: /\.map\(|\.reduce\(|\.filter\(/i, weight: 0.7 },
        { pattern: /return\s+\{.*\}/, weight: 0.5 },
      ]],
      ['data_access', [
        { pattern: /get|fetch|find|query|select|read|load/i, weight: 0.8 },
        { pattern: /database|db|sql|mongo|redis/i, weight: 0.7 },
        { pattern: /api|endpoint|request|response/i, weight: 0.6 },
      ]],
      ['validation', [
        { pattern: /valid|check|verify|assert|ensure|validate/i, weight: 0.9 },
        { pattern: /if\s*\(.+\)\s*(return|throw)/, weight: 0.6 },
        { pattern: /\.test\(|\.match\(|typeof|instanceof/i, weight: 0.5 },
      ]],
      ['business_logic', [
        { pattern: /calculat|comput|process|execute|perform|apply/i, weight: 0.7 },
        { pattern: /rule|policy|strategy|algorithm/i, weight: 0.8 },
        { pattern: /business|domain|entity/i, weight: 0.6 },
      ]],
      ['orchestration', [
        { pattern: /orchestrat|coordinate|manag|control|schedule/i, weight: 0.8 },
        { pattern: /Promise\.all|Promise\.race|async.*await/i, weight: 0.6 },
        { pattern: /workflow|pipeline|chain/i, weight: 0.7 },
      ]],
      ['communication', [
        { pattern: /send|receive|emit|broadcast|publish|subscribe/i, weight: 0.8 },
        { pattern: /socket|websocket|http|fetch|axios/i, weight: 0.7 },
        { pattern: /event|message|notification/i, weight: 0.6 },
      ]],
      ['presentation', [
        { pattern: /render|display|show|hide|format|style/i, weight: 0.8 },
        { pattern: /component|view|template|ui/i, weight: 0.7 },
        { pattern: /className|css|style|jsx/i, weight: 0.6 },
      ]],
      ['utility', [
        { pattern: /util|helper|common|shared|format/i, weight: 0.7 },
        { pattern: /isFunction|isObject|isArray|isEmpty/i, weight: 0.8 },
        { pattern: /return\s+[^;]+/, weight: 0.3 },
      ]],
      ['initialization', [
        { pattern: /init|setup|configure|bootstrap|start|create/i, weight: 0.8 },
        { pattern: /constructor|useEffect|componentDidMount/i, weight: 0.7 },
        { pattern: /new\s+\w+\(/, weight: 0.5 },
      ]],
      ['error_handling', [
        { pattern: /error|exception|fail|catch|throw/i, weight: 0.9 },
        { pattern: /try\s*\{[\s\S]*catch/i, weight: 0.8 },
        { pattern: /\.catch\s*\(/i, weight: 0.7 },
      ]],
      ['event_handling', [
        { pattern: /on[A-Z]|handle|listener|callback/i, weight: 0.8 },
        { pattern: /addEventListener|on\s*\(/i, weight: 0.9 },
        { pattern: /event\.preventDefault|event\.stopPropagation/i, weight: 0.7 },
      ]],
      ['testing', [
        { pattern: /test|spec|mock|stub|assert|expect/i, weight: 0.9 },
        { pattern: /describe\s*\(|it\s*\(|beforeEach/i, weight: 0.9 },
        { pattern: /jest\.|vitest\.|cypress\./i, weight: 0.8 },
      ]],
    ]);
  }

  private initializeNamingConventions(): NamingConvention[] {
    return [
      { pattern: /^is[A-Z]/, category: 'validation', purpose: 'Boolean check' },
      { pattern: /^has[A-Z]/, category: 'validation', purpose: 'Boolean check' },
      { pattern: /^can[A-Z]/, category: 'validation', purpose: 'Permission check' },
      { pattern: /^should[A-Z]/, category: 'validation', purpose: 'Condition check' },
      { pattern: /^get[A-Z]/, category: 'data_access', purpose: 'Retrieve data' },
      { pattern: /^set[A-Z]/, category: 'data_access', purpose: 'Set data' },
      { pattern: /^fetch[A-Z]/, category: 'data_access', purpose: 'Fetch from source' },
      { pattern: /^load[A-Z]/, category: 'data_access', purpose: 'Load data' },
      { pattern: /^save[A-Z]/, category: 'data_access', purpose: 'Save data' },
      { pattern: /^create[A-Z]/, category: 'initialization', purpose: 'Create new entity' },
      { pattern: /^update[A-Z]/, category: 'business_logic', purpose: 'Update entity' },
      { pattern: /^delete[A-Z]/, category: 'business_logic', purpose: 'Delete entity' },
      { pattern: /^handle[A-Z]/, category: 'event_handling', purpose: 'Handle event' },
      { pattern: /^on[A-Z]/, category: 'event_handling', purpose: 'Event handler' },
      { pattern: /^validate[A-Z]/, category: 'validation', purpose: 'Validate input' },
      { pattern: /^transform[A-Z]/, category: 'data_transformation', purpose: 'Transform data' },
      { pattern: /^parse[A-Z]/, category: 'data_transformation', purpose: 'Parse data' },
      { pattern: /^format[A-Z]/, category: 'presentation', purpose: 'Format for display' },
      { pattern: /^render[A-Z]/, category: 'presentation', purpose: 'Render UI' },
      { pattern: /^calculate[A-Z]/, category: 'business_logic', purpose: 'Calculate value' },
      { pattern: /^compute[A-Z]/, category: 'business_logic', purpose: 'Compute result' },
      { pattern: /^process[A-Z]/, category: 'orchestration', purpose: 'Process data' },
      { pattern: /^execute[A-Z]/, category: 'orchestration', purpose: 'Execute operation' },
    ];
  }

  private parseFunction(code: string): ParsedFunction {
    // Extract function name
    const nameMatch = code.match(/(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=.*?(?:function|\([^)]*\)\s*=>)|(\w+)\s*\([^)]*\)\s*\{)/);
    const name = nameMatch?.[1] || nameMatch?.[2] || nameMatch?.[3] || 'anonymous';

    // Extract parameters
    const paramsMatch = code.match(/\(([^)]*)\)/);
    const params = paramsMatch?.[1]?.split(',').map(p => p.trim()).filter(Boolean) || [];

    // Extract body
    const bodyMatch = code.match(/\{([\s\S]*)\}/);
    const body = bodyMatch?.[1] || '';

    // Determine if async
    const isAsync = /\basync\b/.test(code);

    return {
      name,
      params,
      body,
      isAsync,
      raw: code,
    };
  }

  private analyzeNaming(name: string): NamingAnalysis {
    const keywords: string[] = [];
    let convention: NamingConvention | null = null;

    for (const conv of this.namingConventions) {
      if (conv.pattern.test(name)) {
        convention = conv;
        break;
      }
    }

    // Extract keywords from camelCase/snake_case
    const parts = name.split(/(?=[A-Z])|_/);
    keywords.push(...parts.filter(p => p.length > 2));

    return {
      name,
      convention,
      keywords,
    };
  }

  private analyzeStructure(parsed: ParsedFunction): StructureAnalysis {
    const lines = parsed.body.split('\n').length;
    const nestingLevel = this.calculateNestingLevel(parsed.body);
    const hasLoops = /\b(for|while|do)\s*\(/.test(parsed.body);
    const hasConditionals = /\bif\s*\(/.test(parsed.body);
    const hasTryCatch = /\btry\s*\{/.test(parsed.body);
    const returnCount = (parsed.body.match(/\breturn\b/g) || []).length;

    return {
      linesOfCode: lines,
      nestingLevel,
      hasLoops,
      hasConditionals,
      hasTryCatch,
      returnCount,
    };
  }

  private calculateNestingLevel(code: string): number {
    let maxNesting = 0;
    let currentNesting = 0;

    for (const char of code) {
      if (char === '{') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      }
      if (char === '}') {
        currentNesting--;
      }
    }

    return maxNesting;
  }

  private analyzeBehavior(
    parsed: ParsedFunction,
    context?: FunctionContext
  ): BehaviorAnalysis {
    // Analyze inputs
    const inputs = parsed.params.map(param => this.analyzeParameter(param, parsed.body));

    // Analyze outputs
    const outputs = this.analyzeOutputs(parsed.body);

    // Detect side effects
    const sideEffects = this.detectSideEffects(parsed.body);

    // Detect state mutations
    const stateMutations = this.detectStateMutations(parsed.body);

    // Analyze error handling
    const errorHandling = this.analyzeErrorHandling(parsed.body);

    // Analyze async behavior
    const asyncBehavior = parsed.isAsync ? this.analyzeAsyncBehavior(parsed.body) : null;

    return {
      inputs,
      outputs,
      sideEffects,
      stateMutations,
      errorHandling,
      asyncBehavior,
    };
  }

  private analyzeParameter(name: string, body: string): ParameterAnalysis {
    // Detect type from usage
    let type = 'unknown';
    if (body.includes(`${name}.length`)) type = 'array | string';
    else if (body.includes(`${name}.then`) || body.includes(`await ${name}`)) type = 'Promise';
    else if (body.includes(`${name}?.`) || body.includes(`${name}.`)) type = 'object';
    else if (body.includes(`${name}(`)) type = 'function';

    // Detect purpose from usage
    let purpose = 'input parameter';
    if (body.includes(`JSON.parse(${name})`)) purpose = 'JSON string to parse';
    if (body.includes(`${name}.map`) || body.includes(`${name}.filter`)) purpose = 'collection to process';
    if (body.includes(`fetch(${name})`) || body.includes(`axios.${name}`)) purpose = 'URL or endpoint';

    return {
      name,
      type,
      purpose,
      constraints: [],
      required: !name.includes('?') && !name.includes('='),
    };
  }

  private analyzeOutputs(body: string): OutputAnalysis[] {
    const outputs: OutputAnalysis[] = [];
    const returnMatches = body.matchAll(/return\s+([^;]+)/g);

    for (const match of returnMatches) {
      const value = match[1].trim();
      let type = 'unknown';

      if (value.startsWith('{')) type = 'object';
      else if (value.startsWith('[')) type = 'array';
      else if (value.startsWith("'") || value.startsWith('"')) type = 'string';
      else if (/^\d/.test(value)) type = 'number';
      else if (value === 'true' || value === 'false') type = 'boolean';
      else if (value === 'null') type = 'null';
      else if (value === 'undefined') type = 'undefined';

      outputs.push({
        type,
        description: `Returns ${type}`,
      });
    }

    return outputs;
  }

  private detectSideEffects(body: string): SideEffect[] {
    const effects: SideEffect[] = [];

    if (/console\.(log|warn|error|info)/.test(body)) {
      effects.push({
        type: 'logging',
        description: 'Writes to console',
        impact: 'low',
        reversible: false,
      });
    }

    if (/fetch\(|axios\.|http\.|request\(/.test(body)) {
      effects.push({
        type: 'network',
        description: 'Makes network requests',
        impact: 'medium',
        reversible: false,
      });
    }

    if (/fs\.|readFile|writeFile|\.write\(|\.read\(/.test(body)) {
      effects.push({
        type: 'io',
        description: 'Performs file I/O',
        impact: 'medium',
        reversible: false,
      });
    }

    if (/\.save\(|\.update\(|\.delete\(|INSERT|UPDATE|DELETE/i.test(body)) {
      effects.push({
        type: 'database',
        description: 'Modifies database',
        impact: 'high',
        reversible: false,
      });
    }

    if (/localStorage|sessionStorage|cookie/i.test(body)) {
      effects.push({
        type: 'state',
        description: 'Modifies browser storage',
        impact: 'low',
        reversible: true,
      });
    }

    if (/document\.|\.innerHTML|\.appendChild|\.removeChild/i.test(body)) {
      effects.push({
        type: 'dom',
        description: 'Modifies DOM',
        impact: 'medium',
        reversible: true,
      });
    }

    if (/setTimeout|setInterval|requestAnimationFrame/i.test(body)) {
      effects.push({
        type: 'timer',
        description: 'Sets timers',
        impact: 'low',
        reversible: true,
      });
    }

    return effects;
  }

  private detectStateMutations(body: string): StateMutation[] {
    const mutations: StateMutation[] = [];
    const assignmentMatches = body.matchAll(/(\w+)\s*=\s*([^;]+)/g);

    for (const match of assignmentMatches) {
      mutations.push({
        target: match[1],
        operation: 'write',
        description: `Assigns value to ${match[1]}`,
      });
    }

    return mutations;
  }

  private analyzeErrorHandling(body: string): ErrorHandlingPattern[] {
    const patterns: ErrorHandlingPattern[] = [];

    if (/try\s*\{[\s\S]*catch/.test(body)) {
      patterns.push({
        errorType: 'unknown',
        handlingMethod: 'catches',
        recoveryAction: 'handled in catch block',
      });
    }

    if (/throw\s+new\s+\w+Error/.test(body)) {
      patterns.push({
        errorType: 'custom',
        handlingMethod: 'throws',
      });
    }

    if (/\.catch\s*\(/.test(body)) {
      patterns.push({
        errorType: 'promise_rejection',
        handlingMethod: 'catches',
      });
    }

    return patterns;
  }

  private analyzeAsyncBehavior(body: string): AsyncBehavior {
    let type: AsyncBehavior['type'] = 'promise';
    if (/await\s+/.test(body)) type = 'async_await';
    if (/\.then\s*\(/.test(body)) type = 'promise';
    if (/\.on\s*\(|\.subscribe\s*\(/.test(body)) type = 'event';
    if (/\.pipe\s*\(|\.subscribe\s*\(/.test(body)) type = 'stream';

    let concurrency: AsyncBehavior['concurrency'] = 'sequential';
    if (/Promise\.all/.test(body)) concurrency = 'parallel';
    if (/Promise\.race/.test(body)) concurrency = 'race';

    return {
      type,
      concurrency,
      cancellable: /AbortController|cancel|abort/i.test(body),
    };
  }

  private analyzeDependencies(
    parsed: ParsedFunction,
    context?: FunctionContext,
    options?: InferenceOptions
  ): DependencyAnalysis {
    const internalDependencies: Dependency[] = [];
    const externalDependencies: Dependency[] = [];

    // Detect function calls
    const callMatches = parsed.body.matchAll(/(\w+)\s*\(/g);
    for (const match of callMatches) {
      const name = match[1];
      if (['if', 'for', 'while', 'switch', 'return', 'console', 'JSON', 'Object', 'Array', 'String', 'Number', 'Math', 'Date'].includes(name)) {
        continue;
      }
      internalDependencies.push({
        name,
        type: 'function',
        usage: 'calls',
        criticality: 'medium',
      });
    }

    // Detect imports/external dependencies
    if (context?.imports) {
      for (const imp of context.imports) {
        externalDependencies.push({
          name: imp,
          type: 'module',
          usage: 'imports',
          criticality: 'high',
        });
      }
    }

    return {
      internalDependencies,
      externalDependencies,
      implicitDependencies: [],
      couplingScore: (internalDependencies.length + externalDependencies.length) / 10,
    };
  }

  private assessQuality(
    parsed: ParsedFunction,
    behavior: BehaviorAnalysis
  ): QualityAssessment {
    const complexity = this.calculateComplexity(parsed);
    const testability = this.assessTestability(parsed, behavior);
    const maintainability = this.calculateMaintainability(complexity, testability);
    const securityConsiderations = this.assessSecurity(parsed, behavior);
    const performanceConsiderations = this.assessPerformance(parsed, behavior);

    return {
      complexity,
      testability,
      maintainability,
      securityConsiderations,
      performanceConsiderations,
    };
  }

  private calculateComplexity(parsed: ParsedFunction): ComplexityMetrics {
    const body = parsed.body;
    
    // Cyclomatic complexity approximation
    const decisionPoints = (body.match(/\b(if|else|for|while|case|catch|&&|\|\|)\b/g) || []).length;
    const cyclomatic = decisionPoints + 1;

    // Cognitive complexity approximation
    const nestingPenalty = this.calculateNestingLevel(body) * 2;
    const cognitive = cyclomatic + nestingPenalty;

    return {
      cyclomatic,
      cognitive,
      linesOfCode: body.split('\n').length,
      nestingLevel: this.calculateNestingLevel(body),
      parameterCount: parsed.params.length,
    };
  }

  private assessTestability(
    parsed: ParsedFunction,
    behavior: BehaviorAnalysis
  ): TestabilityAnalysis {
    let score = 1.0;
    const challenges: string[] = [];
    const recommendations: string[] = [];

    // Deduct for side effects
    const sideEffectCount = behavior.sideEffects.length;
    score -= sideEffectCount * 0.1;
    if (sideEffectCount > 0) {
      challenges.push(`Has ${sideEffectCount} side effects`);
      recommendations.push('Use dependency injection for external dependencies');
    }

    // Deduct for complexity
    const complexity = this.calculateComplexity(parsed);
    if (complexity.cyclomatic > 10) {
      score -= 0.2;
      challenges.push('High cyclomatic complexity');
      recommendations.push('Break down into smaller functions');
    }

    // Deduct for parameter count
    if (parsed.params.length > 4) {
      score -= 0.1;
      challenges.push('Many parameters');
      recommendations.push('Consider using an options object');
    }

    return {
      score: Math.max(0, score),
      challenges,
      recommendations,
    };
  }

  private calculateMaintainability(
    complexity: ComplexityMetrics,
    testability: TestabilityAnalysis
  ): number {
    const complexityScore = Math.max(0, 1 - complexity.cyclomatic / 20);
    return (complexityScore + testability.score) / 2;
  }

  private assessSecurity(
    parsed: ParsedFunction,
    behavior: BehaviorAnalysis
  ): SecurityConsideration[] {
    const considerations: SecurityConsideration[] = [];
    const body = parsed.body;

    if (/eval\s*\(|new\s+Function\s*\(/.test(body)) {
      considerations.push({
        type: 'injection',
        description: 'Uses eval or Function constructor - potential code injection',
        severity: 'critical',
        recommendation: 'Avoid dynamic code execution',
      });
    }

    if (/innerHTML\s*=|dangerouslySetInnerHTML/.test(body)) {
      considerations.push({
        type: 'injection',
        description: 'Sets innerHTML directly - potential XSS',
        severity: 'high',
        recommendation: 'Use textContent or sanitize input',
      });
    }

    if (/password|secret|api_key|token/i.test(body)) {
      considerations.push({
        type: 'data_exposure',
        description: 'May handle sensitive data',
        severity: 'medium',
        recommendation: 'Ensure sensitive data is encrypted and not logged',
      });
    }

    if (!behavior.errorHandling.length && behavior.sideEffects.length > 0) {
      considerations.push({
        type: 'other',
        description: 'No error handling for operations with side effects',
        severity: 'low',
        recommendation: 'Add try-catch blocks for error handling',
      });
    }

    return considerations;
  }

  private assessPerformance(
    parsed: ParsedFunction,
    behavior: BehaviorAnalysis
  ): PerformanceConsideration[] {
    const considerations: PerformanceConsideration[] = [];
    const body = parsed.body;

    if (/\.map\s*\([^)]*\.map\s*\(/.test(body)) {
      considerations.push({
        type: 'time_complexity',
        description: 'Nested array operations detected',
        impact: 'medium',
        suggestion: 'Consider flattening operations or using single iteration',
      });
    }

    if (/while\s*\(\s*true|for\s*\(\s*;\s*;/.test(body)) {
      considerations.push({
        type: 'time_complexity',
        description: 'Potential infinite loop',
        impact: 'high',
        suggestion: 'Add termination condition',
      });
    }

    if (/new\s+Array\s*\(\s*\d{6,}/.test(body)) {
      considerations.push({
        type: 'space_complexity',
        description: 'Large array allocation',
        impact: 'medium',
        suggestion: 'Consider streaming or chunking data',
      });
    }

    return considerations;
  }

  private determinePurpose(
    parsed: ParsedFunction,
    naming: NamingAnalysis,
    structure: StructureAnalysis,
    behavior: BehaviorAnalysis,
    context?: FunctionContext
  ): PurposeAnalysis {
    // Score each category
    const scores: Record<FunctionCategory, number> = {} as Record<FunctionCategory, number>;

    for (const [category, patterns] of this.patterns) {
      scores[category] = 0;
      for (const pattern of patterns) {
        if (pattern.pattern.test(parsed.raw)) {
          scores[category] += pattern.weight;
        }
      }
    }

    // Apply naming convention boost
    if (naming.convention) {
      scores[naming.convention.category] += 0.5;
    }

    // Apply behavior-based scoring
    if (behavior.sideEffects.some(e => e.type === 'network')) {
      scores['communication'] += 0.3;
      scores['data_access'] += 0.2;
    }
    if (behavior.sideEffects.some(e => e.type === 'database')) {
      scores['data_access'] += 0.4;
    }
    if (behavior.outputs.some(o => o.type === 'boolean')) {
      scores['validation'] += 0.3;
    }

    // Find primary category
    let primaryCategory: FunctionCategory = 'utility';
    let maxScore = 0;
    for (const [category, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        primaryCategory = category as FunctionCategory;
      }
    }

    // Generate purpose description
    const primaryPurpose = this.generatePurposeDescription(
      parsed.name,
      primaryCategory,
      naming,
      behavior
    );

    // Find secondary purposes
    const secondaryPurposes = Object.entries(scores)
      .filter(([cat, score]) => cat !== primaryCategory && score > 0.3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([cat]) => this.getCategoryDescription(cat as FunctionCategory));

    return {
      primaryPurpose,
      secondaryPurposes,
      category: primaryCategory,
      abstractionLevel: this.determineAbstractionLevel(structure, behavior),
      businessDomain: context?.domain,
      intentKeywords: naming.keywords,
    };
  }

  private generatePurposeDescription(
    name: string,
    category: FunctionCategory,
    naming: NamingAnalysis,
    behavior: BehaviorAnalysis
  ): string {
    const templates: Record<FunctionCategory, string> = {
      data_transformation: `Transforms and processes data`,
      data_access: `Retrieves or stores data`,
      business_logic: `Implements business logic`,
      validation: `Validates input or state`,
      orchestration: `Coordinates multiple operations`,
      communication: `Handles communication with external systems`,
      presentation: `Handles presentation logic`,
      utility: `Provides utility functionality`,
      initialization: `Initializes or configures resources`,
      lifecycle: `Manages component lifecycle`,
      event_handling: `Handles events or callbacks`,
      error_handling: `Handles errors and exceptions`,
      testing: `Provides testing functionality`,
      configuration: `Manages configuration`,
    };

    let description = templates[category];

    // Add detail from naming
    if (naming.convention) {
      description = naming.convention.purpose;
    }

    // Add detail from behavior
    if (behavior.sideEffects.length > 0) {
      const mainEffect = behavior.sideEffects[0];
      description += ` with ${mainEffect.type} side effects`;
    }

    return description;
  }

  private getCategoryDescription(category: FunctionCategory): string {
    const descriptions: Record<FunctionCategory, string> = {
      data_transformation: 'Data transformation',
      data_access: 'Data access',
      business_logic: 'Business logic',
      validation: 'Validation',
      orchestration: 'Orchestration',
      communication: 'Communication',
      presentation: 'Presentation',
      utility: 'Utility',
      initialization: 'Initialization',
      lifecycle: 'Lifecycle management',
      event_handling: 'Event handling',
      error_handling: 'Error handling',
      testing: 'Testing',
      configuration: 'Configuration',
    };
    return descriptions[category];
  }

  private determineAbstractionLevel(
    structure: StructureAnalysis,
    behavior: BehaviorAnalysis
  ): PurposeAnalysis['abstractionLevel'] {
    if (structure.linesOfCode < 10 && behavior.sideEffects.length === 0) {
      return 'low';
    }
    if (structure.linesOfCode > 50 || behavior.sideEffects.length > 2) {
      return 'high';
    }
    return 'medium';
  }

  private generateDocumentation(
    parsed: ParsedFunction,
    purpose: PurposeAnalysis,
    behavior: BehaviorAnalysis,
    options?: InferenceOptions
  ): GeneratedDocumentation {
    const summary = purpose.primaryPurpose;
    
    let description = `${parsed.name} - ${summary}.`;
    if (purpose.secondaryPurposes.length > 0) {
      description += ` Also handles ${purpose.secondaryPurposes.join(' and ')}.`;
    }

    const parameters: Record<string, string> = {};
    for (const input of behavior.inputs) {
      parameters[input.name] = `${input.purpose}. Type: ${input.type}.`;
    }

    const returns = behavior.outputs.length > 0
      ? `Returns ${behavior.outputs.map(o => o.type).join(' or ')}.`
      : 'No return value.';

    const examples: CodeExample[] = [];
    if (options?.includeExamples) {
      examples.push(this.generateExample(parsed, behavior));
    }

    const notes: string[] = [];
    if (behavior.sideEffects.length > 0) {
      notes.push(`Side effects: ${behavior.sideEffects.map(e => e.description).join(', ')}`);
    }
    if (behavior.asyncBehavior) {
      notes.push(`This is an async function using ${behavior.asyncBehavior.type}.`);
    }

    return {
      summary,
      description,
      parameters,
      returns,
      examples,
      notes,
    };
  }

  private generateExample(parsed: ParsedFunction, behavior: BehaviorAnalysis): CodeExample {
    const params = behavior.inputs.map(i => {
      if (i.type.includes('string')) return `'example'`;
      if (i.type.includes('number')) return '42';
      if (i.type.includes('boolean')) return 'true';
      if (i.type.includes('array')) return '[]';
      if (i.type.includes('object')) return '{}';
      return 'null';
    }).join(', ');

    const call = `${parsed.name}(${params})`;
    let code = call;
    
    if (behavior.asyncBehavior) {
      code = `await ${call}`;
    }

    if (behavior.outputs.length > 0) {
      code = `const result = ${code};`;
    }

    return {
      code,
      description: `Example usage of ${parsed.name}`,
      output: behavior.outputs[0]?.type || 'void',
    };
  }

  private calculateConfidence(
    parsed: ParsedFunction,
    purpose: PurposeAnalysis
  ): number {
    let confidence = 0.5;

    // Higher confidence for clear naming
    if (purpose.intentKeywords.length > 0) {
      confidence += 0.2;
    }

    // Higher confidence for clear behavior
    if (parsed.params.length > 0) {
      confidence += 0.1;
    }

    // Lower confidence for anonymous functions
    if (parsed.name === 'anonymous' || parsed.name === '') {
      confidence -= 0.2;
    }

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  private generateId(): string {
    return `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Supporting interfaces
interface ParsedFunction {
  name: string;
  params: string[];
  body: string;
  isAsync: boolean;
  raw: string;
}

interface FunctionContext {
  filePath?: string;
  imports?: string[];
  domain?: string;
  surroundingCode?: string;
}

interface PurposePattern {
  pattern: RegExp;
  weight: number;
}

interface NamingConvention {
  pattern: RegExp;
  category: FunctionCategory;
  purpose: string;
}

interface NamingAnalysis {
  name: string;
  convention: NamingConvention | null;
  keywords: string[];
}

interface StructureAnalysis {
  linesOfCode: number;
  nestingLevel: number;
  hasLoops: boolean;
  hasConditionals: boolean;
  hasTryCatch: boolean;
  returnCount: number;
}

interface ContextInfo {
  domain?: string;
  relatedFunctions?: string[];
}

interface PurposeExplanation {
  purpose: string;
  category: FunctionCategory;
  reasons: PurposeReason[];
  alternativePurposes: string[];
  confidence: number;
}

interface PurposeReason {
  type: 'naming' | 'structure' | 'side_effects' | 'dependencies' | 'context';
  description: string;
  confidence: number;
}

interface ImprovementSuggestion {
  type: 'complexity' | 'testability' | 'security' | 'documentation' | 'performance';
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
  impact: string;
}

// Singleton instance
let inferrerInstance: FunctionPurposeInferrer | null = null;

export function getFunctionPurposeInferrer(): FunctionPurposeInferrer {
  if (!inferrerInstance) {
    inferrerInstance = new FunctionPurposeInferrer();
  }
  return inferrerInstance;
}
