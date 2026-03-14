/**
 * Crash Pattern Analyzer
 * 
 * Analyzes application crashes to:
 * - Parse crash logs and stack traces
 * - Identify common crash patterns
 * - Build crash pattern knowledge base
 * - Auto-suggest fixes for crashes
 * - Predict potential crash points
 * - Generate crash prevention strategies
 */

import { EventEmitter } from 'events'
import fs from 'fs/promises'
import path from 'path'

// ============================================
// Types
// ============================================

export interface CrashReport {
  id: string
  timestamp: string
  type: CrashType
  message: string
  stackTrace: StackTraceFrame[]
  context: CrashContext
  pattern?: CrashPattern
  suggestedFixes: CrashFix[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  recoverable: boolean
  relatedCrashes: string[]
}

export type CrashType = 
  | 'uncaught_exception'
  | 'unhandled_rejection'
  | 'type_error'
  | 'reference_error'
  | 'syntax_error'
  | 'range_error'
  | 'memory_error'
  | 'network_error'
  | 'timeout_error'
  | 'permission_error'
  | 'file_not_found'
  | 'database_error'
  | 'api_error'
  | 'validation_error'
  | 'unknown'

export interface StackTraceFrame {
  functionName: string
  fileName: string
  lineNumber: number
  columnNumber: number
  isNative: boolean
  isApplication: boolean
  source?: string
  context?: SourceContext
}

export interface SourceContext {
  before: string[]
  line: string
  after: string[]
}

export interface CrashContext {
  platform: string
  nodeVersion?: string
  browser?: string
  os: string
  timestamp: string
  request?: {
    url?: string
    method?: string
    headers?: Record<string, string>
    body?: any
  }
  user?: {
    id?: string
    session?: string
  }
  environment: Record<string, string>
  memory?: {
    heapUsed: number
    heapTotal: number
    rss: number
  }
  custom?: Record<string, any>
}

export interface CrashPattern {
  id: string
  name: string
  description: string
  category: CrashPatternCategory
  frequency: number
  lastSeen: string
  firstSeen: string
  signature: CrashSignature
  commonCauses: string[]
  solutions: CrashSolution[]
  preventionTips: string[]
  relatedPatterns: string[]
}

export type CrashPatternCategory =
  | 'null_reference'
  | 'type_mismatch'
  | 'async_error'
  | 'resource_exhaustion'
  | 'network_failure'
  | 'timeout'
  | 'permission_denied'
  | 'dependency_issue'
  | 'configuration_error'
  | 'logic_error'
  | 'concurrency_issue'
  | 'memory_leak'

export interface CrashSignature {
  type: CrashType
  messagePattern: RegExp
  stackPattern?: RegExp
  filePatterns?: string[]
  functionPatterns?: string[]
}

export interface CrashSolution {
  id: string
  title: string
  description: string
  code?: string
  effort: 'trivial' | 'easy' | 'moderate' | 'hard'
  successRate: number
  applicableConditions: string[]
}

export interface CrashFix {
  id: string
  type: 'code_change' | 'config_change' | 'dependency_update' | 'workaround' | 'documentation'
  priority: 'immediate' | 'high' | 'medium' | 'low'
  title: string
  description: string
  file?: string
  line?: number
  beforeCode?: string
  afterCode?: string
  explanation: string
  automated: boolean
  confidence: number
}

export interface CrashPrediction {
  id: string
  location: string
  type: CrashType
  probability: number
  reason: string
  preventionMeasures: string[]
}

export interface CrashStatistics {
  totalCrashes: number
  crashesByType: Record<CrashType, number>
  crashesByPattern: Record<string, number>
  crashesBySeverity: Record<string, number>
  avgRecoveryTime: number
  topCrashFiles: { file: string; count: number }[]
  crashTrend: CrashTrendPoint[]
}

export interface CrashTrendPoint {
  date: string
  count: number
  types: Record<CrashType, number>
}

// ============================================
// Known Crash Patterns Database
// ============================================

const KNOWN_PATTERNS: CrashPattern[] = [
  {
    id: 'null_undefined_access',
    name: 'Null/Undefined Property Access',
    description: 'Attempting to access properties on null or undefined values',
    category: 'null_reference',
    frequency: 0,
    lastSeen: '',
    firstSeen: '',
    signature: {
      type: 'type_error',
      messagePattern: /Cannot read properties of (null|undefined)|Cannot read .* of (null|undefined)/i,
      functionPatterns: []
    },
    commonCauses: [
      'Missing null checks before property access',
      'API returning unexpected null values',
      'Async operations completing before data is ready',
      'Destructuring without default values'
    ],
    solutions: [
      {
        id: 'sol_null_1',
        title: 'Add null check',
        description: 'Add explicit null/undefined check before accessing the property',
        code: `if (obj && obj.property) { ... }`,
        effort: 'trivial',
        successRate: 0.95,
        applicableConditions: ['Property access on potentially null object']
      },
      {
        id: 'sol_null_2',
        title: 'Use optional chaining',
        description: 'Use optional chaining operator to safely access nested properties',
        code: `obj?.property?.nestedProperty`,
        effort: 'trivial',
        successRate: 0.98,
        applicableConditions: ['Modern JavaScript/TypeScript environment']
      },
      {
        id: 'sol_null_3',
        title: 'Provide default values',
        description: 'Use nullish coalescing or default values in destructuring',
        code: `const { property = defaultValue } = obj || {}`,
        effort: 'trivial',
        successRate: 0.95,
        applicableConditions: ['Destructuring assignment']
      }
    ],
    preventionTips: [
      'Always validate API responses before use',
      'Use TypeScript strict null checks',
      'Implement input validation at API boundaries',
      'Add defensive programming practices'
    ],
    relatedPatterns: ['null_argument', 'missing_return']
  },
  {
    id: 'undefined_function',
    name: 'Undefined Function Call',
    description: 'Attempting to call a function that does not exist',
    category: 'type_mismatch',
    frequency: 0,
    lastSeen: '',
    firstSeen: '',
    signature: {
      type: 'type_error',
      messagePattern: /is not a function|TypeError: .+ is not a function/i
    },
    commonCauses: [
      'Import/export mismatch',
      'Function renamed or removed',
      'Calling method on wrong object type',
      'Incorrect this binding'
    ],
    solutions: [
      {
        id: 'sol_func_1',
        title: 'Verify import/export',
        description: 'Check that the function is properly imported and exported',
        effort: 'easy',
        successRate: 0.9,
        applicableConditions: ['Module import error']
      },
      {
        id: 'sol_func_2',
        title: 'Check object type',
        description: 'Verify the object type before calling the method',
        code: `if (typeof obj.method === 'function') { obj.method() }`,
        effort: 'trivial',
        successRate: 0.85,
        applicableConditions: ['Dynamic object types']
      }
    ],
    preventionTips: [
      'Use TypeScript for type checking',
      'Verify imports at build time',
      'Add runtime type checks for dynamic code'
    ],
    relatedPatterns: []
  },
  {
    id: 'async_unhandled_rejection',
    name: 'Unhandled Promise Rejection',
    description: 'Promise rejection not handled with catch',
    category: 'async_error',
    frequency: 0,
    lastSeen: '',
    firstSeen: '',
    signature: {
      type: 'unhandled_rejection',
      messagePattern: /.*/
    },
    commonCauses: [
      'Missing .catch() on Promise chains',
      'Async function without try/catch',
      'Forgotten await keyword',
      'Error in async callback'
    ],
    solutions: [
      {
        id: 'sol_async_1',
        title: 'Add try/catch block',
        description: 'Wrap async code in try/catch to handle errors',
        code: `try {
  await asyncOperation();
} catch (error) {
  console.error('Operation failed:', error);
}`,
        effort: 'easy',
        successRate: 0.95,
        applicableConditions: ['Async function']
      },
      {
        id: 'sol_async_2',
        title: 'Add .catch() handler',
        description: 'Add catch handler to Promise chain',
        code: `promise
  .then(result => { ... })
  .catch(error => { ... })`,
        effort: 'trivial',
        successRate: 0.98,
        applicableConditions: ['Promise chain']
      }
    ],
    preventionTips: [
      'Always handle promise rejections',
      'Use async/await with try/catch',
      'Add global unhandled rejection handler',
      'Configure linter to warn on unhandled promises'
    ],
    relatedPatterns: ['callback_hell', 'async_timeout']
  },
  {
    id: 'module_not_found',
    name: 'Module Not Found',
    description: 'Required module cannot be found',
    category: 'dependency_issue',
    frequency: 0,
    lastSeen: '',
    firstSeen: '',
    signature: {
      type: 'unknown',
      messagePattern: /Cannot find module|Module not found|ERR_MODULE_NOT_FOUND/i
    },
    commonCauses: [
      'Missing npm install',
      'Incorrect module path',
      'Case sensitivity mismatch',
      'Missing in package.json'
    ],
    solutions: [
      {
        id: 'sol_mod_1',
        title: 'Install missing dependency',
        description: 'Run npm install to install missing packages',
        code: `npm install <package-name>`,
        effort: 'trivial',
        successRate: 0.95,
        applicableConditions: ['Package exists in npm registry']
      },
      {
        id: 'sol_mod_2',
        title: 'Check import path',
        description: 'Verify the import path is correct and case-sensitive',
        effort: 'easy',
        successRate: 0.8,
        applicableConditions: ['Local module import']
      }
    ],
    preventionTips: [
      'Keep package.json and package-lock.json in sync',
      'Use exact versions for critical dependencies',
      'Run npm ci in CI/CD pipelines',
      'Check for typos in import statements'
    ],
    relatedPatterns: ['version_mismatch']
  },
  {
    id: 'json_parse_error',
    name: 'JSON Parse Error',
    description: 'Invalid JSON string cannot be parsed',
    category: 'type_mismatch',
    frequency: 0,
    lastSeen: '',
    firstSeen: '',
    signature: {
      type: 'syntax_error',
      messagePattern: /Unexpected token|JSON\.parse|is not valid JSON/i
    },
    commonCauses: [
      'Malformed JSON from API',
      'Empty string passed to JSON.parse',
      'Single quotes instead of double quotes',
      'Trailing commas in JSON'
    ],
    solutions: [
      {
        id: 'sol_json_1',
        title: 'Add try/catch around JSON.parse',
        description: 'Handle parse errors gracefully',
        code: `try {
  const data = JSON.parse(jsonString);
} catch (error) {
  console.error('Invalid JSON:', error);
  // Handle error
}`,
        effort: 'easy',
        successRate: 0.95,
        applicableConditions: ['Any JSON parsing']
      },
      {
        id: 'sol_json_2',
        title: 'Validate before parsing',
        description: 'Check if string is valid before parsing',
        code: `if (jsonString && typeof jsonString === 'string') {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return null;
  }
}`,
        effort: 'easy',
        successRate: 0.9,
        applicableConditions: ['Uncertain JSON source']
      }
    ],
    preventionTips: [
      'Validate API responses before parsing',
      'Use JSON schema validation',
      'Handle edge cases (empty string, null)'
    ],
    relatedPatterns: ['api_error']
  },
  {
    id: 'memory_limit_exceeded',
    name: 'Memory Limit Exceeded',
    description: 'Application ran out of memory',
    category: 'resource_exhaustion',
    frequency: 0,
    lastSeen: '',
    firstSeen: '',
    signature: {
      type: 'memory_error',
      messagePattern: /out of memory|heap out of memory|allocation failed|FATAL ERROR/i
    },
    commonCauses: [
      'Memory leak',
      'Processing large datasets',
      'Recursive function without exit',
      'Caching without limits'
    ],
    solutions: [
      {
        id: 'sol_mem_1',
        title: 'Increase memory limit',
        description: 'Increase Node.js heap size',
        code: `NODE_OPTIONS="--max-old-space-size=4096" node app.js`,
        effort: 'trivial',
        successRate: 0.7,
        applicableConditions: ['Adequate physical memory available']
      },
      {
        id: 'sol_mem_2',
        title: 'Fix memory leak',
        description: 'Identify and fix the source of memory leak',
        effort: 'hard',
        successRate: 0.95,
        applicableConditions: ['Memory leak identified']
      },
      {
        id: 'sol_mem_3',
        title: 'Use streaming',
        description: 'Process large data in streams instead of loading all into memory',
        effort: 'moderate',
        successRate: 0.85,
        applicableConditions: ['Processing large files/datasets']
      }
    ],
    preventionTips: [
      'Monitor memory usage',
      'Implement memory limits in code',
      'Use streaming for large data',
      'Profile for memory leaks regularly'
    ],
    relatedPatterns: ['memory_leak', 'infinite_loop']
  },
  {
    id: 'network_timeout',
    name: 'Network Request Timeout',
    description: 'Network request exceeded timeout limit',
    category: 'network_failure',
    frequency: 0,
    lastSeen: '',
    firstSeen: '',
    signature: {
      type: 'timeout_error',
      messagePattern: /ETIMEDOUT|timeout|request timeout|ECONNABORTED/i
    },
    commonCauses: [
      'Slow network connection',
      'Server not responding',
      'Request payload too large',
      'DNS resolution issues'
    ],
    solutions: [
      {
        id: 'sol_net_1',
        title: 'Add retry logic',
        description: 'Implement retry with exponential backoff',
        code: `async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}`,
        effort: 'easy',
        successRate: 0.85,
        applicableConditions: ['Transient network issues']
      },
      {
        id: 'sol_net_2',
        title: 'Increase timeout',
        description: 'Set appropriate timeout for the request',
        code: `fetch(url, { ...options, signal: AbortSignal.timeout(30000) })`,
        effort: 'trivial',
        successRate: 0.7,
        applicableConditions: ['Slow but reliable endpoint']
      }
    ],
    preventionTips: [
      'Set appropriate timeouts',
      'Implement circuit breaker pattern',
      'Cache responses when possible',
      'Use connection pooling'
    ],
    relatedPatterns: ['connection_refused', 'dns_error']
  },
  {
    id: 'file_not_found',
    name: 'File Not Found',
    description: 'Required file does not exist',
    category: 'permission_denied',
    frequency: 0,
    lastSeen: '',
    firstSeen: '',
    signature: {
      type: 'file_not_found',
      messagePattern: /ENOENT|no such file or directory|file not found/i
    },
    commonCauses: [
      'File deleted or moved',
      'Incorrect file path',
      'Working directory mismatch',
      'Race condition in file operations'
    ],
    solutions: [
      {
        id: 'sol_file_1',
        title: 'Check file exists before access',
        description: 'Verify file existence before operations',
        code: `import { access } from 'fs/promises';
try {
  await access(filePath);
  // File exists, proceed
} catch {
  // File doesn't exist, handle
}`,
        effort: 'easy',
        successRate: 0.9,
        applicableConditions: ['Any file operation']
      }
    ],
    preventionTips: [
      'Use path.resolve() for absolute paths',
      'Check file existence before critical operations',
      'Handle ENOENT errors gracefully',
      'Use file locking for concurrent access'
    ],
    relatedPatterns: ['permission_denied']
  }
]

// ============================================
// Crash Pattern Analyzer Class
// ============================================

export class CrashPatternAnalyzer extends EventEmitter {
  private crashHistory: CrashReport[] = []
  private patterns: Map<string, CrashPattern> = new Map()
  private maxHistorySize: number = 1000

  constructor() {
    super()
    this.initializePatterns()
  }

  private initializePatterns(): void {
    for (const pattern of KNOWN_PATTERNS) {
      this.patterns.set(pattern.id, pattern)
    }
  }

  /**
   * Analyze a crash and generate a report
   */
  async analyzeCrash(error: Error | string, context?: Partial<CrashContext>): Promise<CrashReport> {
    const crashReport = await this.createCrashReport(error, context)
    
    // Find matching pattern
    const pattern = this.findMatchingPattern(crashReport)
    if (pattern) {
      crashReport.pattern = pattern
      this.updatePatternStats(pattern.id)
    }

    // Generate suggested fixes
    crashReport.suggestedFixes = this.generateFixes(crashReport)

    // Find related crashes
    crashReport.relatedCrashes = this.findRelatedCrashes(crashReport)

    // Store in history
    this.crashHistory.push(crashReport)
    if (this.crashHistory.length > this.maxHistorySize) {
      this.crashHistory.shift()
    }

    this.emit('crash:analyzed', crashReport)

    return crashReport
  }

  /**
   * Parse stack trace
   */
  parseStackTrace(stack: string): StackTraceFrame[] {
    const frames: StackTraceFrame[] = []
    const lines = stack.split('\n')

    for (const line of lines) {
      const frame = this.parseStackLine(line)
      if (frame) {
        frames.push(frame)
      }
    }

    return frames
  }

  /**
   * Find matching crash pattern
   */
  findMatchingPattern(crash: CrashReport): CrashPattern | null {
    for (const pattern of this.patterns.values()) {
      if (this.matchesPattern(crash, pattern)) {
        return pattern
      }
    }
    return null
  }

  /**
   * Generate fixes for a crash
   */
  generateFixes(crash: CrashReport): CrashFix[] {
    const fixes: CrashFix[] = []

    if (crash.pattern) {
      for (const solution of crash.pattern.solutions) {
        fixes.push(this.solutionToFix(solution, crash))
      }
    }

    // Generate type-specific fixes
    switch (crash.type) {
      case 'type_error':
        fixes.push(...this.generateTypeErrorFixes(crash))
        break
      case 'reference_error':
        fixes.push(...this.generateReferenceErrorFixes(crash))
        break
      case 'unhandled_rejection':
        fixes.push(...this.generateUnhandledRejectionFixes(crash))
        break
      case 'syntax_error':
        fixes.push(...this.generateSyntaxErrorFixes(crash))
        break
    }

    // Sort by confidence and priority
    fixes.sort((a, b) => {
      if (a.confidence !== b.confidence) return b.confidence - a.confidence
      const priorityOrder = { immediate: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    return fixes.slice(0, 5) // Return top 5 fixes
  }

  /**
   * Predict potential crash points
   */
  async predictCrashes(code: string, filePath: string): Promise<CrashPrediction[]> {
    const predictions: CrashPrediction[] = []
    const lines = code.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineNumber = i + 1

      // Check for potential null access
      if (this.hasPotentialNullAccess(line)) {
        predictions.push({
          id: `pred_${predictions.length}`,
          location: `${filePath}:${lineNumber}`,
          type: 'type_error',
          probability: 0.7,
          reason: 'Potential null/undefined property access without null check',
          preventionMeasures: [
            'Add null check before property access',
            'Use optional chaining (?.) operator',
            'Provide default values'
          ]
        })
      }

      // Check for unhandled async
      if (this.hasUnhandledAsync(line)) {
        predictions.push({
          id: `pred_${predictions.length}`,
          location: `${filePath}:${lineNumber}`,
          type: 'unhandled_rejection',
          probability: 0.6,
          reason: 'Async operation without proper error handling',
          preventionMeasures: [
            'Add try/catch around async code',
            'Add .catch() handler to promises',
            'Use await with error handling'
          ]
        })
      }

      // Check for potential JSON parse issues
      if (this.hasUnsafeJSONParse(line)) {
        predictions.push({
          id: `pred_${predictions.length}`,
          location: `${filePath}:${lineNumber}`,
          type: 'syntax_error',
          probability: 0.5,
          reason: 'JSON.parse without error handling',
          preventionMeasures: [
            'Wrap JSON.parse in try/catch',
            'Validate string before parsing',
            'Use safe JSON parsing utility'
          ]
        })
      }
    }

    return predictions
  }

  /**
   * Get crash statistics
   */
  getStatistics(): CrashStatistics {
    const stats: CrashStatistics = {
      totalCrashes: this.crashHistory.length,
      crashesByType: {} as Record<CrashType, number>,
      crashesByPattern: {},
      crashesBySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      avgRecoveryTime: 0,
      topCrashFiles: [],
      crashTrend: []
    }

    // Initialize type counts
    const crashTypes: CrashType[] = [
      'uncaught_exception', 'unhandled_rejection', 'type_error', 'reference_error',
      'syntax_error', 'range_error', 'memory_error', 'network_error', 'timeout_error',
      'permission_error', 'file_not_found', 'database_error', 'api_error', 
      'validation_error', 'unknown'
    ]
    for (const type of crashTypes) {
      stats.crashesByType[type] = 0
    }

    // Count crashes
    const fileCounts = new Map<string, number>()
    for (const crash of this.crashHistory) {
      stats.crashesByType[crash.type]++
      stats.crashesBySeverity[crash.severity]++
      
      if (crash.pattern) {
        stats.crashesByPattern[crash.pattern.name] = 
          (stats.crashesByPattern[crash.pattern.name] || 0) + 1
      }

      // Count files
      for (const frame of crash.stackTrace) {
        if (frame.isApplication) {
          fileCounts.set(frame.fileName, (fileCounts.get(frame.fileName) || 0) + 1)
        }
      }
    }

    // Top crash files
    stats.topCrashFiles = Array.from(fileCounts.entries())
      .map(([file, count]) => ({ file, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return stats
  }

  /**
   * Add custom crash pattern
   */
  addPattern(pattern: CrashPattern): void {
    this.patterns.set(pattern.id, pattern)
    this.emit('pattern:added', pattern)
  }

  /**
   * Get all patterns
   */
  getPatterns(): CrashPattern[] {
    return Array.from(this.patterns.values())
  }

  /**
   * Get crash history
   */
  getHistory(limit: number = 50): CrashReport[] {
    return this.crashHistory.slice(-limit)
  }

  /**
   * Export crash data for analysis
   */
  async exportData(outputPath: string): Promise<void> {
    const data = {
      crashes: this.crashHistory,
      patterns: Array.from(this.patterns.values()),
      statistics: this.getStatistics(),
      exportedAt: new Date().toISOString()
    }

    await fs.writeFile(outputPath, JSON.stringify(data, null, 2))
  }

  // ============================================
  // Private Methods
  // ============================================

  private async createCrashReport(error: Error | string, context?: Partial<CrashContext>): Promise<CrashReport> {
    const errorMessage = typeof error === 'string' ? error : error.message
    const errorStack = typeof error === 'string' ? '' : error.stack || ''
    const errorName = typeof error === 'string' ? 'Error' : error.name

    const crashType = this.determineCrashType(errorName, errorMessage)
    const stackTrace = this.parseStackTrace(errorStack)
    const severity = this.determineSeverity(crashType, errorMessage)

    return {
      id: `crash_${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      type: crashType,
      message: errorMessage,
      stackTrace,
      context: {
        platform: 'node',
        os: process.platform,
        timestamp: new Date().toISOString(),
        environment: {},
        ...context
      },
      suggestedFixes: [],
      severity,
      recoverable: this.isRecoverable(crashType),
      relatedCrashes: []
    }
  }

  private determineCrashType(errorName: string, message: string): CrashType {
    const lowerMessage = message.toLowerCase()

    if (errorName === 'TypeError' || lowerMessage.includes('type')) return 'type_error'
    if (errorName === 'ReferenceError') return 'reference_error'
    if (errorName === 'SyntaxError') return 'syntax_error'
    if (errorName === 'RangeError') return 'range_error'
    if (lowerMessage.includes('unhandled rejection')) return 'unhandled_rejection'
    if (lowerMessage.includes('out of memory') || lowerMessage.includes('heap')) return 'memory_error'
    if (lowerMessage.includes('network') || lowerMessage.includes('econnrefused')) return 'network_error'
    if (lowerMessage.includes('timeout') || lowerMessage.includes('etimedout')) return 'timeout_error'
    if (lowerMessage.includes('permission') || lowerMessage.includes('eacces')) return 'permission_error'
    if (lowerMessage.includes('enoent') || lowerMessage.includes('not found')) return 'file_not_found'
    if (lowerMessage.includes('database') || lowerMessage.includes('sql')) return 'database_error'
    if (lowerMessage.includes('api') || lowerMessage.includes('request')) return 'api_error'
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) return 'validation_error'

    return 'unknown'
  }

  private determineSeverity(type: CrashType, message: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalTypes: CrashType[] = ['memory_error', 'uncaught_exception']
    const highTypes: CrashType[] = ['unhandled_rejection', 'database_error']
    const mediumTypes: CrashType[] = ['network_error', 'timeout_error', 'api_error']

    if (criticalTypes.includes(type)) return 'critical'
    if (highTypes.includes(type)) return 'high'
    if (mediumTypes.includes(type)) return 'medium'
    return 'low'
  }

  private isRecoverable(type: CrashType): boolean {
    const unrecoverable: CrashType[] = ['memory_error', 'syntax_error']
    return !unrecoverable.includes(type)
  }

  private parseStackLine(line: string): StackTraceFrame | null {
    // Match patterns like:
    // at functionName (file:line:col)
    // at file:line:col
    // at Object.functionName (file:line:col)
    const match = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?/)
    
    if (!match) return null

    const [, functionName, fileName, lineNumber, columnNumber] = match

    return {
      functionName: functionName || '<anonymous>',
      fileName,
      lineNumber: parseInt(lineNumber, 10),
      columnNumber: parseInt(columnNumber, 10),
      isNative: fileName.includes('node:'),
      isApplication: !fileName.includes('node:') && !fileName.includes('node_modules')
    }
  }

  private matchesPattern(crash: CrashReport, pattern: CrashPattern): boolean {
    const { signature } = pattern

    // Check type match
    if (signature.type !== crash.type && signature.type !== 'unknown') {
      return false
    }

    // Check message pattern
    if (signature.messagePattern && !signature.messagePattern.test(crash.message)) {
      return false
    }

    // Check stack pattern
    if (signature.stackPattern && crash.stackTrace.length > 0) {
      const stackString = crash.stackTrace.map(f => `${f.functionName}@${f.fileName}`).join('\n')
      if (!signature.stackPattern.test(stackString)) {
        return false
      }
    }

    return true
  }

  private updatePatternStats(patternId: string): void {
    const pattern = this.patterns.get(patternId)
    if (pattern) {
      pattern.frequency++
      if (!pattern.firstSeen) {
        pattern.firstSeen = new Date().toISOString()
      }
      pattern.lastSeen = new Date().toISOString()
    }
  }

  private findRelatedCrashes(crash: CrashReport): string[] {
    const related: string[] = []

    for (const historical of this.crashHistory) {
      if (historical.id === crash.id) continue

      // Same type and similar message
      if (historical.type === crash.type && this.similarMessage(crash.message, historical.message)) {
        related.push(historical.id)
      }

      // Same pattern
      if (crash.pattern && historical.pattern?.id === crash.pattern?.id) {
        if (!related.includes(historical.id)) {
          related.push(historical.id)
        }
      }
    }

    return related.slice(0, 10)
  }

  private similarMessage(msg1: string, msg2: string): boolean {
    // Simple similarity check
    const words1 = msg1.toLowerCase().split(/\W+/)
    const words2 = msg2.toLowerCase().split(/\W+/)
    const common = words1.filter(w => words2.includes(w))
    return common.length / Math.max(words1.length, words2.length) > 0.5
  }

  private solutionToFix(solution: CrashSolution, crash: CrashReport): CrashFix {
    return {
      id: `fix_${solution.id}`,
      type: solution.code ? 'code_change' : 'documentation',
      priority: solution.successRate > 0.9 ? 'immediate' : solution.successRate > 0.7 ? 'high' : 'medium',
      title: solution.title,
      description: solution.description,
      afterCode: solution.code,
      explanation: solution.description,
      automated: solution.effort === 'trivial',
      confidence: solution.successRate
    }
  }

  private generateTypeErrorFixes(crash: CrashReport): CrashFix[] {
    const fixes: CrashFix[] = []

    if (crash.message.includes('Cannot read')) {
      fixes.push({
        id: 'fix_te_1',
        type: 'code_change',
        priority: 'immediate',
        title: 'Add optional chaining',
        description: 'Use optional chaining operator to prevent null reference errors',
        afterCode: 'obj?.property?.nestedProperty',
        explanation: 'Optional chaining safely accesses nested properties without throwing if intermediate values are null/undefined',
        automated: true,
        confidence: 0.95
      })
    }

    if (crash.message.includes('is not a function')) {
      fixes.push({
        id: 'fix_te_2',
        type: 'code_change',
        priority: 'high',
        title: 'Add type check before calling',
        description: 'Verify the value is a function before calling it',
        afterCode: `if (typeof obj.method === 'function') {\n  obj.method();\n}`,
        explanation: 'Runtime type checking prevents calling non-function values',
        automated: true,
        confidence: 0.85
      })
    }

    return fixes
  }

  private generateReferenceErrorFixes(crash: CrashReport): CrashFix[] {
    const fixes: CrashFix[] = []

    // Extract variable name from error
    const match = crash.message.match(/(\w+) is not defined/)
    if (match) {
      const varName = match[1]
      fixes.push({
        id: 'fix_re_1',
        type: 'code_change',
        priority: 'immediate',
        title: `Define or import '${varName}'`,
        description: `The variable '${varName}' is used but not defined or imported`,
        explanation: `Check if '${varName}' needs to be declared, imported, or is a typo`,
        automated: false,
        confidence: 0.9
      })
    }

    return fixes
  }

  private generateUnhandledRejectionFixes(crash: CrashReport): CrashFix[] {
    return [
      {
        id: 'fix_ur_1',
        type: 'code_change',
        priority: 'high',
        title: 'Add try/catch block',
        description: 'Wrap async operations in try/catch to handle rejections',
        afterCode: `try {\n  await asyncOperation();\n} catch (error) {\n  console.error('Operation failed:', error);\n}`,
        explanation: 'Try/catch blocks catch promise rejections in async functions',
        automated: true,
        confidence: 0.95
      },
      {
        id: 'fix_ur_2',
        type: 'code_change',
        priority: 'high',
        title: 'Add global rejection handler',
        description: 'Add a global handler for uncaught promise rejections',
        afterCode: `process.on('unhandledRejection', (reason, promise) => {\n  console.error('Unhandled Rejection:', reason);\n});`,
        explanation: 'Global handlers prevent crashes from unhandled promise rejections',
        automated: true,
        confidence: 0.85
      }
    ]
  }

  private generateSyntaxErrorFixes(crash: CrashReport): CrashFix[] {
    const fixes: CrashFix[] = []

    if (crash.message.includes('Unexpected token')) {
      fixes.push({
        id: 'fix_se_1',
        type: 'code_change',
        priority: 'immediate',
        title: 'Fix syntax error',
        description: 'Review the code for syntax issues such as missing brackets, quotes, or commas',
        explanation: 'Syntax errors prevent code from parsing and must be fixed before execution',
        automated: false,
        confidence: 0.7
      })
    }

    if (crash.message.includes('JSON')) {
      fixes.push({
        id: 'fix_se_2',
        type: 'code_change',
        priority: 'high',
        title: 'Add JSON parse error handling',
        description: 'Wrap JSON.parse in try/catch to handle malformed JSON',
        afterCode: `try {\n  const data = JSON.parse(jsonString);\n} catch (error) {\n  console.error('Invalid JSON:', error);\n}`,
        explanation: 'JSON parsing can fail with malformed input and should be handled',
        automated: true,
        confidence: 0.95
      })
    }

    return fixes
  }

  private hasPotentialNullAccess(line: string): boolean {
    // Check for property access patterns that might fail
    return /\.\w+/.test(line) && 
           !line.includes('?.') && 
           !line.includes('if (') &&
           !line.includes('&&')
  }

  private hasUnhandledAsync(line: string): boolean {
    // Check for async operations without error handling
    return (line.includes('await ') || line.includes('.then(')) && 
           !line.includes('try') && 
           !line.includes('.catch(')
  }

  private hasUnsafeJSONParse(line: string): boolean {
    return line.includes('JSON.parse') && 
           !line.includes('try') && 
           !line.includes('catch')
  }
}

// ============================================
// Singleton Instance
// ============================================

let analyzerInstance: CrashPatternAnalyzer | null = null

export function getCrashAnalyzer(): CrashPatternAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new CrashPatternAnalyzer()
  }
  return analyzerInstance
}

export async function analyzeCrash(
  error: Error | string,
  context?: Partial<CrashContext>
): Promise<CrashReport> {
  const analyzer = getCrashAnalyzer()
  return analyzer.analyzeCrash(error, context)
}

export async function predictCrashes(
  code: string,
  filePath: string
): Promise<CrashPrediction[]> {
  const analyzer = getCrashAnalyzer()
  return analyzer.predictCrashes(code, filePath)
}

export default CrashPatternAnalyzer
