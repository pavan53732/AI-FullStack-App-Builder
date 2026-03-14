/**
 * Failure Mode Analyzer
 * Mechanisms 104: Anticipates failure scenarios and provides prevention strategies
 */

export interface FailureModeAnalysis {
  id: string;
  timestamp: Date;
  context: string;
  failureModes: FailureMode[];
  riskMatrix: RiskMatrix;
  preventionStrategies: PreventionStrategy[];
  detectionMechanisms: DetectionMechanism[];
  recoveryPlans: RecoveryPlan[];
  overallRiskScore: number;
}

export interface FailureMode {
  id: string;
  name: string;
  category: FailureCategory;
  description: string;
  causes: RootCause[];
  effects: FailureEffect[];
  probability: number;
  severity: number;
  detectability: number;
  rpn: number; // Risk Priority Number = P × S × D
  relatedModes: string[];
}

export type FailureCategory =
  | 'syntax_error'
  | 'runtime_error'
  | 'logic_error'
  | 'resource_exhaustion'
  | 'dependency_failure'
  | 'network_failure'
  | 'security_breach'
  | 'data_corruption'
  | 'performance_degradation'
  | 'integration_failure'
  | 'configuration_error'
  | 'timeout'
  | 'deadlock'
  | 'race_condition'
  | 'memory_leak';

export interface RootCause {
  id: string;
  description: string;
  category: 'human' | 'system' | 'environment' | 'dependency' | 'design';
  likelihood: number;
  preventionPossible: boolean;
}

export interface FailureEffect {
  id: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical' | 'catastrophic';
  scope: 'local' | 'component' | 'system' | 'user' | 'business';
  recoveryTime: number; // minutes
}

export interface RiskMatrix {
  cells: RiskCell[];
  threshold: { probability: number; severity: number };
}

export interface RiskCell {
  probability: number;
  severity: number;
  count: number;
  modes: string[];
  action: 'monitor' | 'review' | 'mitigate' | 'eliminate';
}

export interface PreventionStrategy {
  id: string;
  failureModeIds: string[];
  type: 'design' | 'process' | 'testing' | 'monitoring' | 'documentation';
  description: string;
  implementation: string;
  effort: 'low' | 'medium' | 'high';
  effectiveness: number;
  status: 'recommended' | 'planned' | 'implemented';
}

export interface DetectionMechanism {
  id: string;
  failureModeIds: string[];
  type: 'static' | 'runtime' | 'testing' | 'monitoring' | 'logging';
  description: string;
  detectionTime: 'compile' | 'deploy' | 'runtime' | 'post-mortem';
  accuracy: number;
  falsePositiveRate: number;
}

export interface RecoveryPlan {
  id: string;
  failureModeIds: string[];
  name: string;
  steps: RecoveryStep[];
  estimatedTime: number;
  automationLevel: 'manual' | 'semi-automatic' | 'automatic';
  prerequisites: string[];
}

export interface RecoveryStep {
  order: number;
  action: string;
  command?: string;
  verification: string;
  rollbackAction?: string;
}

export class FailureModeAnalyzer {
  private failurePatterns: Map<FailureCategory, FailurePattern[]>;
  private historicalData: FailureHistoricalData;
  private knowledgeBase: FailureKnowledgeBase;

  constructor() {
    this.failurePatterns = this.initializeFailurePatterns();
    this.historicalData = new FailureHistoricalData();
    this.knowledgeBase = new FailureKnowledgeBase();
  }

  /**
   * Analyze code or action for potential failure modes
   */
  async analyze(context: {
    code?: string;
    action?: string;
    files?: string[];
    dependencies?: string[];
  }): Promise<FailureModeAnalysis> {
    // Step 1: Identify potential failure modes
    const failureModes = await this.identifyFailureModes(context);
    
    // Step 2: Calculate Risk Priority Numbers
    const modesWithRPN = this.calculateRPNs(failureModes);
    
    // Step 3: Build risk matrix
    const riskMatrix = this.buildRiskMatrix(modesWithRPN);
    
    // Step 4: Generate prevention strategies
    const preventionStrategies = this.generatePreventionStrategies(modesWithRPN);
    
    // Step 5: Create detection mechanisms
    const detectionMechanisms = this.createDetectionMechanisms(modesWithRPN);
    
    // Step 6: Develop recovery plans
    const recoveryPlans = this.developRecoveryPlans(modesWithRPN);
    
    // Step 7: Calculate overall risk
    const overallRiskScore = this.calculateOverallRisk(modesWithRPN);

    return {
      id: this.generateId(),
      timestamp: new Date(),
      context: context.action || context.code || 'Unknown context',
      failureModes: modesWithRPN,
      riskMatrix,
      preventionStrategies,
      detectionMechanisms,
      recoveryPlans,
      overallRiskScore,
    };
  }

  /**
   * Real-time failure prediction during execution
   */
  async predictFailure(
    currentStep: string,
    executionContext: ExecutionContext
  ): Promise<FailurePrediction> {
    const imminentFailures = this.detectImminentFailures(currentStep, executionContext);
    const earlyWarnings = this.generateEarlyWarnings(imminentFailures);
    const preventiveActions = this.suggestPreventiveActions(imminentFailures);

    return {
      step: currentStep,
      predictions: imminentFailures,
      earlyWarnings,
      preventiveActions,
      confidence: this.calculatePredictionConfidence(imminentFailures),
    };
  }

  /**
   * Learn from actual failures
   */
  learnFromFailure(failure: ActualFailure): void {
    this.historicalData.recordFailure(failure);
    this.knowledgeBase.updatePatterns(failure);
  }

  private initializeFailurePatterns(): Map<FailureCategory, FailurePattern[]> {
    return new Map([
      ['syntax_error', [
        {
          pattern: /(?:^|\n)\s*[{[()}]\s*(?:$|\n)/,
          name: 'unmatched_bracket',
          probability: 0.1,
          severity: 0.8,
          detectability: 0.99,
        },
        {
          pattern: /;\s*;|,\s*,/,
          name: 'double_delimiter',
          probability: 0.05,
          severity: 0.3,
          detectability: 0.95,
        },
        {
          pattern: /=>\s*{[^}]*$/,
          name: 'incomplete_arrow_function',
          probability: 0.08,
          severity: 0.7,
          detectability: 0.9,
        },
      ]],
      ['runtime_error', [
        {
          pattern: /\bnull\s*\.\s*\w+|\bundefined\s*\.\s*\w+/,
          name: 'null_pointer_access',
          probability: 0.3,
          severity: 0.9,
          detectability: 0.7,
        },
        {
          pattern: /\[\s*[\d.]+\s*\]\s*\[/,
          name: 'array_index_out_of_bounds',
          probability: 0.15,
          severity: 0.7,
          detectability: 0.6,
        },
        {
          pattern: /parseInt\s*\(\s*\w+\s*\)(?!\s*,\s*10)/,
          name: 'missing_radix',
          probability: 0.2,
          severity: 0.4,
          detectability: 0.8,
        },
      ]],
      ['logic_error', [
        {
          pattern: /if\s*\(\s*\w+\s*=\s*[^=]/,
          name: 'assignment_in_condition',
          probability: 0.25,
          severity: 0.8,
          detectability: 0.6,
        },
        {
          pattern: /for\s*\(\s*let\s+\w+\s+in\s+/,
          name: 'for_in_without_hasOwnProperty',
          probability: 0.35,
          severity: 0.5,
          detectability: 0.4,
        },
        {
          pattern: /===\s*(?:''|""|0|false)\s*\|\|/,
          name: 'incorrect_short_circuit',
          probability: 0.2,
          severity: 0.6,
          detectability: 0.5,
        },
      ]],
      ['resource_exhaustion', [
        {
          pattern: /while\s*\(\s*true\s*\)\s*\{(?![^}]*break)/,
          name: 'infinite_loop',
          probability: 0.4,
          severity: 0.95,
          detectability: 0.5,
        },
        {
          pattern: /new\s+Array\s*\(\s*[\d{5,}]+\s*\)/,
          name: 'large_array_allocation',
          probability: 0.3,
          severity: 0.7,
          detectability: 0.6,
        },
        {
          pattern: /\.map\s*\([^)]*=>\s*[^}]*\.map\s*\(/,
          name: 'nested_iteration',
          probability: 0.35,
          severity: 0.6,
          detectability: 0.7,
        },
      ]],
      ['dependency_failure', [
        {
          pattern: /import\s+.*\s+from\s+['"][^'"]+['"]/,
          name: 'missing_import',
          probability: 0.15,
          severity: 0.8,
          detectability: 0.95,
        },
        {
          pattern: /require\s*\(\s*['"][^'"]+['"]\s*\)/,
          name: 'missing_require',
          probability: 0.12,
          severity: 0.8,
          detectability: 0.95,
        },
        {
          pattern: /@\d+\.\d+\.\d+/,
          name: 'version_mismatch',
          probability: 0.1,
          severity: 0.6,
          detectability: 0.7,
        },
      ]],
      ['network_failure', [
        {
          pattern: /fetch\s*\([^)]+\)(?!\s*\.catch)/,
          name: 'unhandled_fetch_error',
          probability: 0.4,
          severity: 0.7,
          detectability: 0.6,
        },
        {
          pattern: /axios\.[get|post|put|delete]+\s*\([^)]+\)(?!\s*\.catch)/,
          name: 'unhandled_axios_error',
          probability: 0.35,
          severity: 0.7,
          detectability: 0.6,
        },
        {
          pattern: /XMLHttpRequest/,
          name: 'xhr_timeout',
          probability: 0.2,
          severity: 0.5,
          detectability: 0.5,
        },
      ]],
      ['security_breach', [
        {
          pattern: /eval\s*\(|new\s+Function\s*\(/,
          name: 'code_injection',
          probability: 0.5,
          severity: 0.99,
          detectability: 0.9,
        },
        {
          pattern: /innerHTML\s*=|dangerouslySetInnerHTML/,
          name: 'xss_vulnerability',
          probability: 0.4,
          severity: 0.9,
          detectability: 0.7,
        },
        {
          pattern: /password\s*[=:]\s*['"][^'"]+['"]/,
          name: 'hardcoded_credentials',
          probability: 0.3,
          severity: 0.95,
          detectability: 0.8,
        },
      ]],
      ['performance_degradation', [
        {
          pattern: /\.forEach\s*\([^)]*=>\s*\{[^}]{500,}/,
          name: 'expensive_iteration',
          probability: 0.25,
          severity: 0.5,
          detectability: 0.4,
        },
        {
          pattern: /JSON\.parse\s*\(\s*\w+\s*\)\s*(?:\.|\[)/,
          name: 'repeated_json_parse',
          probability: 0.2,
          severity: 0.4,
          detectability: 0.5,
        },
        {
          pattern: /document\.querySelector\s*\(/,
          name: 'dom_query_in_loop',
          probability: 0.3,
          severity: 0.6,
          detectability: 0.5,
        },
      ]],
      ['race_condition', [
        {
          pattern: /async\s+\w+\s*\([^)]*\)\s*\{[^}]*await[^}]*await/,
          name: 'sequential_awaits',
          probability: 0.2,
          severity: 0.5,
          detectability: 0.3,
        },
        {
          pattern: /Promise\.race\s*\(/,
          name: 'unhandled_race',
          probability: 0.25,
          severity: 0.6,
          detectability: 0.4,
        },
        {
          pattern: /\.then\s*\([^)]*\)\.then\s*\(/,
          name: 'promise_chain_timing',
          probability: 0.15,
          severity: 0.4,
          detectability: 0.3,
        },
      ]],
      ['memory_leak', [
        {
          pattern: /setInterval\s*\((?![^}]*clearInterval)/,
          name: 'uncleared_interval',
          probability: 0.35,
          severity: 0.7,
          detectability: 0.4,
        },
        {
          pattern: /addEventListener\s*\((?![^}]*removeEventListener)/,
          name: 'unremoved_listener',
          probability: 0.3,
          severity: 0.6,
          detectability: 0.5,
        },
        {
          pattern: /new\s+Map\s*\(\)\s*;(?![^;]*\.clear|\.delete)/,
          name: 'growing_map',
          probability: 0.25,
          severity: 0.5,
          detectability: 0.3,
        },
      ]],
    ]);
  }

  private async identifyFailureModes(context: {
    code?: string;
    action?: string;
    files?: string[];
    dependencies?: string[];
  }): Promise<FailureMode[]> {
    const modes: FailureMode[] = [];
    const code = context.code || '';

    // Pattern-based detection
    for (const [category, patterns] of this.failurePatterns) {
      for (const pattern of patterns) {
        const matches = code.match(pattern.pattern);
        if (matches) {
          modes.push(this.createFailureMode(pattern, category, matches));
        }
      }
    }

    // Context-based analysis
    if (context.dependencies) {
      modes.push(...this.analyzeDependencyRisks(context.dependencies));
    }

    if (context.action) {
      modes.push(...this.analyzeActionRisks(context.action));
    }

    // Historical data analysis
    modes.push(...await this.analyzeHistoricalPatterns());

    return this.deduplicateModes(modes);
  }

  private createFailureMode(
    pattern: FailurePattern,
    category: FailureCategory,
    matches: RegExpMatchArray
  ): FailureMode {
    return {
      id: this.generateId(),
      name: pattern.name,
      category,
      description: this.generateDescription(pattern, matches),
      causes: this.identifyCauses(pattern),
      effects: this.identifyEffects(pattern),
      probability: pattern.probability,
      severity: pattern.severity,
      detectability: pattern.detectability,
      rpn: 0, // Will be calculated later
      relatedModes: [],
    };
  }

  private generateDescription(pattern: FailurePattern, matches: RegExpMatchArray): string {
    const descriptions: Record<string, string> = {
      null_pointer_access: 'Attempting to access property of null or undefined value',
      assignment_in_condition: 'Assignment operator used in conditional, likely intended comparison',
      infinite_loop: 'Loop without proper termination condition detected',
      code_injection: 'Dynamic code execution creates security vulnerability',
      xss_vulnerability: 'Unsanitized HTML injection creates XSS vulnerability',
      hardcoded_credentials: 'Hardcoded credentials in source code',
      unhandled_fetch_error: 'Fetch promise without error handling',
      uncleared_interval: 'setInterval without corresponding clearInterval',
    };

    return descriptions[pattern.name] || `Potential ${pattern.name} detected`;
  }

  private identifyCauses(pattern: FailurePattern): RootCause[] {
    const causesMap: Record<string, RootCause[]> = {
      null_pointer_access: [
        { id: 'rc1', description: 'Missing null check before property access', category: 'design', likelihood: 0.6, preventionPossible: true },
        { id: 'rc2', description: 'API returned unexpected null value', category: 'dependency', likelihood: 0.4, preventionPossible: true },
      ],
      infinite_loop: [
        { id: 'rc3', description: 'Incorrect loop termination condition', category: 'human', likelihood: 0.5, preventionPossible: true },
        { id: 'rc4', description: 'Loop variable not updated correctly', category: 'human', likelihood: 0.4, preventionPossible: true },
      ],
      code_injection: [
        { id: 'rc5', description: 'User input not sanitized', category: 'design', likelihood: 0.7, preventionPossible: true },
        { id: 'rc6', description: 'Unsafe dynamic code execution pattern', category: 'design', likelihood: 0.5, preventionPossible: true },
      ],
    };

    return causesMap[pattern.name] || [
      { id: 'rc_default', description: 'Unknown cause', category: 'system', likelihood: 0.5, preventionPossible: true },
    ];
  }

  private identifyEffects(pattern: FailurePattern): FailureEffect[] {
    const effectsMap: Record<string, FailureEffect[]> = {
      null_pointer_access: [
        { id: 'fe1', description: 'Application crash with TypeError', severity: 'major', scope: 'system', recoveryTime: 5 },
        { id: 'fe2', description: 'User sees error page', severity: 'moderate', scope: 'user', recoveryTime: 2 },
      ],
      infinite_loop: [
        { id: 'fe3', description: 'Browser/page becomes unresponsive', severity: 'critical', scope: 'user', recoveryTime: 10 },
        { id: 'fe4', description: 'High CPU usage', severity: 'major', scope: 'system', recoveryTime: 5 },
      ],
      code_injection: [
        { id: 'fe5', description: 'Arbitrary code execution', severity: 'catastrophic', scope: 'business', recoveryTime: 60 },
        { id: 'fe6', description: 'Data breach', severity: 'catastrophic', scope: 'business', recoveryTime: 120 },
      ],
    };

    return effectsMap[pattern.name] || [
      { id: 'fe_default', description: 'Unexpected behavior', severity: 'moderate', scope: 'local', recoveryTime: 10 },
    ];
  }

  private calculateRPNs(modes: FailureMode[]): FailureMode[] {
    return modes.map(mode => ({
      ...mode,
      rpn: mode.probability * mode.severity * (1 - mode.detectability) * 1000,
    }));
  }

  private buildRiskMatrix(modes: FailureMode[]): RiskMatrix {
    const cells: RiskCell[] = [];
    const gridSize = 5;
    const step = 1 / gridSize;

    for (let p = 0; p < gridSize; p++) {
      for (let s = 0; s < gridSize; s++) {
        const probMin = p * step;
        const probMax = (p + 1) * step;
        const sevMin = s * step;
        const sevMax = (s + 1) * step;

        const matchingModes = modes.filter(
          m => m.probability >= probMin && m.probability < probMax &&
               m.severity >= sevMin && m.severity < sevMax
        );

        const avgProb = (probMin + probMax) / 2;
        const avgSev = (sevMin + sevMax) / 2;

        cells.push({
          probability: avgProb,
          severity: avgSev,
          count: matchingModes.length,
          modes: matchingModes.map(m => m.id),
          action: this.determineAction(avgProb, avgSev),
        });
      }
    }

    return {
      cells,
      threshold: { probability: 0.6, severity: 0.6 },
    };
  }

  private determineAction(probability: number, severity: number): RiskCell['action'] {
    const risk = probability * severity;

    if (risk >= 0.6) return 'eliminate';
    if (risk >= 0.4) return 'mitigate';
    if (risk >= 0.2) return 'review';
    return 'monitor';
  }

  private generatePreventionStrategies(modes: FailureMode[]): PreventionStrategy[] {
    const strategies: PreventionStrategy[] = [];

    for (const mode of modes) {
      if (mode.rpn > 50) {
        strategies.push(...this.createPreventionStrategies(mode));
      }
    }

    return this.prioritizeStrategies(strategies);
  }

  private createPreventionStrategies(mode: FailureMode): PreventionStrategy[] {
    const strategyMap: Record<string, PreventionStrategy[]> = {
      null_pointer_access: [
        {
          id: 'ps1',
          failureModeIds: [mode.id],
          type: 'design',
          description: 'Add null checks before property access',
          implementation: 'Use optional chaining (?.) and nullish coalescing (??)',
          effort: 'low',
          effectiveness: 0.95,
          status: 'recommended',
        },
        {
          id: 'ps2',
          failureModeIds: [mode.id],
          type: 'testing',
          description: 'Add unit tests for null input scenarios',
          implementation: 'Create test cases with null, undefined, and empty inputs',
          effort: 'medium',
          effectiveness: 0.8,
          status: 'recommended',
        },
      ],
      infinite_loop: [
        {
          id: 'ps3',
          failureModeIds: [mode.id],
          type: 'design',
          description: 'Add maximum iteration limit',
          implementation: 'Include counter with upper bound in all loops',
          effort: 'low',
          effectiveness: 0.9,
          status: 'recommended',
        },
        {
          id: 'ps4',
          failureModeIds: [mode.id],
          type: 'monitoring',
          description: 'Add execution timeout detection',
          implementation: 'Use setTimeout wrapper with timeout handler',
          effort: 'medium',
          effectiveness: 0.85,
          status: 'recommended',
        },
      ],
      code_injection: [
        {
          id: 'ps5',
          failureModeIds: [mode.id],
          type: 'design',
          description: 'Remove dynamic code execution',
          implementation: 'Replace eval/Function with safe alternatives',
          effort: 'high',
          effectiveness: 0.99,
          status: 'recommended',
        },
        {
          id: 'ps6',
          failureModeIds: [mode.id],
          type: 'testing',
          description: 'Add security testing for injection attacks',
          implementation: 'Use OWASP ZAP or similar security scanner',
          effort: 'medium',
          effectiveness: 0.9,
          status: 'recommended',
        },
      ],
    };

    return strategyMap[mode.name] || [];
  }

  private createDetectionMechanisms(modes: FailureMode[]): DetectionMechanism[] {
    const mechanisms: DetectionMechanism[] = [];

    const generalMechanisms: DetectionMechanism[] = [
      {
        id: 'dm1',
        failureModeIds: modes.filter(m => m.category === 'syntax_error').map(m => m.id),
        type: 'static',
        description: 'ESLint static analysis',
        detectionTime: 'compile',
        accuracy: 0.95,
        falsePositiveRate: 0.05,
      },
      {
        id: 'dm2',
        failureModeIds: modes.filter(m => m.category === 'runtime_error').map(m => m.id),
        type: 'runtime',
        description: 'Error boundary and exception handlers',
        detectionTime: 'runtime',
        accuracy: 0.9,
        falsePositiveRate: 0.1,
      },
      {
        id: 'dm3',
        failureModeIds: modes.filter(m => m.category === 'security_breach').map(m => m.id),
        type: 'testing',
        description: 'Security vulnerability scanner',
        detectionTime: 'deploy',
        accuracy: 0.85,
        falsePositiveRate: 0.15,
      },
      {
        id: 'dm4',
        failureModeIds: modes.filter(m => m.category === 'performance_degradation').map(m => m.id),
        type: 'monitoring',
        description: 'Application performance monitoring (APM)',
        detectionTime: 'runtime',
        accuracy: 0.8,
        falsePositiveRate: 0.2,
      },
      {
        id: 'dm5',
        failureModeIds: modes.filter(m => m.category === 'memory_leak').map(m => m.id),
        type: 'monitoring',
        description: 'Memory usage monitoring and alerts',
        detectionTime: 'runtime',
        accuracy: 0.75,
        falsePositiveRate: 0.15,
      },
    ];

    mechanisms.push(...generalMechanisms.filter(m => m.failureModeIds.length > 0));

    return mechanisms;
  }

  private developRecoveryPlans(modes: FailureMode[]): RecoveryPlan[] {
    return modes
      .filter(m => m.severity >= 0.7)
      .map(mode => this.createRecoveryPlan(mode));
  }

  private createRecoveryPlan(mode: FailureMode): RecoveryPlan {
    const planMap: Record<string, Omit<RecoveryPlan, 'id' | 'failureModeIds'>> = {
      null_pointer_access: {
        name: 'TypeError Recovery',
        steps: [
          { order: 1, action: 'Log error details', verification: 'Error logged in monitoring system', rollbackAction: 'None' },
          { order: 2, action: 'Notify error boundary', verification: 'Error boundary caught exception', rollbackAction: 'None' },
          { order: 3, action: 'Display fallback UI', verification: 'User sees error message', rollbackAction: 'None' },
          { order: 4, action: 'Report to error tracking', verification: 'Error reported to Sentry/LogRocket', rollbackAction: 'None' },
        ],
        estimatedTime: 5,
        automationLevel: 'automatic',
        prerequisites: ['Error boundary configured', 'Error tracking setup'],
      },
      infinite_loop: {
        name: 'Hang Recovery',
        steps: [
          { order: 1, action: 'Detect unresponsive state', verification: 'Timeout triggered', rollbackAction: 'None' },
          { order: 2, action: 'Terminate execution', verification: 'Process killed', rollbackAction: 'None' },
          { order: 3, action: 'Clear stuck resources', verification: 'Memory freed', rollbackAction: 'None' },
          { order: 4, action: 'Restart affected component', verification: 'Component running', rollbackAction: 'Revert to previous state' },
        ],
        estimatedTime: 30,
        automationLevel: 'semi-automatic',
        prerequisites: ['Health check configured', 'Restart procedure documented'],
      },
      security_breach: {
        name: 'Security Incident Response',
        steps: [
          { order: 1, action: 'Isolate affected system', verification: 'System isolated from network', rollbackAction: 'Reconnect to network' },
          { order: 2, action: 'Preserve evidence', verification: 'Logs and state captured', rollbackAction: 'None' },
          { order: 3, action: 'Notify security team', verification: 'Team alerted', rollbackAction: 'None' },
          { order: 4, action: 'Patch vulnerability', verification: 'Vulnerability fixed', rollbackAction: 'None' },
          { order: 5, action: 'Audit for data exposure', verification: 'Audit complete', rollbackAction: 'None' },
        ],
        estimatedTime: 240,
        automationLevel: 'manual',
        prerequisites: ['Incident response plan', 'Security team contacts'],
      },
    };

    const plan = planMap[mode.name] || {
      name: `${mode.name} Recovery`,
      steps: [
        { order: 1, action: 'Identify root cause', verification: 'Cause identified', rollbackAction: 'None' },
        { order: 2, action: 'Implement fix', verification: 'Fix applied', rollbackAction: 'Revert changes' },
        { order: 3, action: 'Verify resolution', verification: 'Issue resolved', rollbackAction: 'None' },
      ],
      estimatedTime: 30,
      automationLevel: 'semi-automatic',
      prerequisites: [],
    };

    return {
      id: this.generateId(),
      failureModeIds: [mode.id],
      ...plan,
    };
  }

  private calculateOverallRisk(modes: FailureMode[]): number {
    if (modes.length === 0) return 0;

    const maxRPN = Math.max(...modes.map(m => m.rpn));
    const avgRPN = modes.reduce((sum, m) => sum + m.rpn, 0) / modes.length;

    return Math.min(1, (maxRPN * 0.7 + avgRPN * 0.3) / 100);
  }

  private analyzeDependencyRisks(dependencies: string[]): FailureMode[] {
    const modes: FailureMode[] = [];

    for (const dep of dependencies) {
      modes.push({
        id: this.generateId(),
        name: 'dependency_failure',
        category: 'dependency_failure',
        description: `Potential failure from dependency: ${dep}`,
        causes: [{ id: 'dep_cause', description: 'Dependency may have bugs or breaking changes', category: 'dependency', likelihood: 0.2, preventionPossible: true }],
        effects: [{ id: 'dep_effect', description: 'Application may crash or behave unexpectedly', severity: 'major', scope: 'system', recoveryTime: 30 }],
        probability: 0.1,
        severity: 0.6,
        detectability: 0.5,
        rpn: 0,
        relatedModes: [],
      });
    }

    return modes;
  }

  private analyzeActionRisks(action: string): FailureMode[] {
    const modes: FailureMode[] = [];

    // Check for high-risk actions
    if (/delete|remove|drop/i.test(action)) {
      modes.push({
        id: this.generateId(),
        name: 'data_loss',
        category: 'data_corruption',
        description: 'Action may result in data loss',
        causes: [{ id: 'action_cause', description: 'Destructive action without backup', category: 'human', likelihood: 0.3, preventionPossible: true }],
        effects: [{ id: 'action_effect', description: 'Permanent data loss', severity: 'catastrophic', scope: 'business', recoveryTime: 120 }],
        probability: 0.2,
        severity: 0.9,
        detectability: 0.3,
        rpn: 0,
        relatedModes: [],
      });
    }

    return modes;
  }

  private async analyzeHistoricalPatterns(): Promise<FailureMode[]> {
    const recentFailures = this.historicalData.getRecentFailures();
    const modes: FailureMode[] = [];

    for (const failure of recentFailures) {
      modes.push({
        id: this.generateId(),
        name: failure.type,
        category: this.mapFailureType(failure.type),
        description: `Recurring failure: ${failure.message}`,
        causes: [{ id: 'hist_cause', description: 'Historical pattern', category: 'system', likelihood: 0.3, preventionPossible: true }],
        effects: [{ id: 'hist_effect', description: 'Similar to past failures', severity: 'major', scope: 'system', recoveryTime: 15 }],
        probability: 0.4,
        severity: 0.7,
        detectability: 0.6,
        rpn: 0,
        relatedModes: [],
      });
    }

    return modes;
  }

  private mapFailureType(type: string): FailureCategory {
    const mapping: Record<string, FailureCategory> = {
      'TypeError': 'runtime_error',
      'ReferenceError': 'runtime_error',
      'SyntaxError': 'syntax_error',
      'RangeError': 'runtime_error',
      'NetworkError': 'network_failure',
      'TimeoutError': 'timeout',
    };
    return mapping[type] || 'runtime_error';
  }

  private deduplicateModes(modes: FailureMode[]): FailureMode[] {
    const seen = new Set<string>();
    return modes.filter(mode => {
      const key = `${mode.category}:${mode.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private prioritizeStrategies(strategies: PreventionStrategy[]): PreventionStrategy[] {
    return strategies.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const statusOrder = { recommended: 0, planned: 1, implemented: 2 };
      
      if (a.status !== b.status) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      
      return priorityOrder[a.effort] - priorityOrder[b.effort];
    });
  }

  private detectImminentFailures(
    currentStep: string,
    context: ExecutionContext
  ): ImminentFailure[] {
    const imminent: ImminentFailure[] = [];

    // Check for warning signs
    if (context.memoryUsage > 0.9) {
      imminent.push({
        failureMode: 'memory_exhaustion',
        probability: 0.8,
        timeToFailure: 60,
        indicators: ['High memory usage'],
      });
    }

    if (context.errorRate > 0.1) {
      imminent.push({
        failureMode: 'cascading_failure',
        probability: 0.6,
        timeToFailure: 30,
        indicators: ['Elevated error rate'],
      });
    }

    if (context.responseTime > 5000) {
      imminent.push({
        failureMode: 'timeout',
        probability: 0.5,
        timeToFailure: 120,
        indicators: ['Slow response times'],
      });
    }

    return imminent;
  }

  private generateEarlyWarnings(failures: ImminentFailure[]): EarlyWarning[] {
    return failures.map(f => ({
      level: f.probability > 0.7 ? 'critical' : f.probability > 0.5 ? 'warning' : 'info',
      message: `Potential ${f.failureMode} detected. Indicators: ${f.indicators.join(', ')}`,
      timeRemaining: f.timeToFailure,
      suggestedAction: `Investigate ${f.indicators[0]}`,
    }));
  }

  private suggestPreventiveActions(failures: ImminentFailure[]): PreventiveAction[] {
    const actions: PreventiveAction[] = [];

    for (const f of failures) {
      if (f.failureMode === 'memory_exhaustion') {
        actions.push({
          action: 'Clear caches and run garbage collection',
          priority: 'high',
          estimatedImpact: 0.8,
        });
      }
      if (f.failureMode === 'cascading_failure') {
        actions.push({
          action: 'Enable circuit breaker and reduce load',
          priority: 'critical',
          estimatedImpact: 0.9,
        });
      }
      if (f.failureMode === 'timeout') {
        actions.push({
          action: 'Scale horizontally or optimize slow queries',
          priority: 'high',
          estimatedImpact: 0.7,
        });
      }
    }

    return actions;
  }

  private calculatePredictionConfidence(failures: ImminentFailure[]): number {
    if (failures.length === 0) return 1;
    return Math.min(0.95, 1 - failures.reduce((sum, f) => sum + (1 - f.probability), 0) / failures.length);
  }

  private generateId(): string {
    return `fm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Supporting interfaces
interface FailurePattern {
  pattern: RegExp;
  name: string;
  probability: number;
  severity: number;
  detectability: number;
}

interface ExecutionContext {
  memoryUsage: number;
  cpuUsage: number;
  errorRate: number;
  responseTime: number;
  activeConnections: number;
}

interface ImminentFailure {
  failureMode: string;
  probability: number;
  timeToFailure: number; // seconds
  indicators: string[];
}

interface EarlyWarning {
  level: 'info' | 'warning' | 'critical';
  message: string;
  timeRemaining: number;
  suggestedAction: string;
}

interface PreventiveAction {
  action: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedImpact: number;
}

interface FailurePrediction {
  step: string;
  predictions: ImminentFailure[];
  earlyWarnings: EarlyWarning[];
  preventiveActions: PreventiveAction[];
  confidence: number;
}

interface ActualFailure {
  type: string;
  message: string;
  stack?: string;
  timestamp: Date;
  context: Record<string, unknown>;
}

class FailureHistoricalData {
  private failures: ActualFailure[] = [];

  recordFailure(failure: ActualFailure): void {
    this.failures.push(failure);
    // Keep only last 100 failures
    if (this.failures.length > 100) {
      this.failures.shift();
    }
  }

  getRecentFailures(): ActualFailure[] {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.failures.filter(f => f.timestamp > oneHourAgo);
  }
}

class FailureKnowledgeBase {
  updatePatterns(failure: ActualFailure): void {
    // Update knowledge base with new failure patterns
    console.log(`Learning from failure: ${failure.type}`);
  }
}

// Singleton instance
let analyzerInstance: FailureModeAnalyzer | null = null;

export function getFailureModeAnalyzer(): FailureModeAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new FailureModeAnalyzer();
  }
  return analyzerInstance;
}
