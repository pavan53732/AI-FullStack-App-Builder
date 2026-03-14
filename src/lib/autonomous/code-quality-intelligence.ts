/**
 * Code Quality Intelligence
 * 
 * Implements mechanisms #287-290: Code Quality Intelligence systems
 * 
 * Features:
 * 1. Code Style Analyzer - Analyze code style compliance
 * 2. Lint Rule Generator - Generate lint rules
 * 3. Code Formatting System - Format code automatically
 * 4. Quality Trend Tracker - Track quality over time
 */

import * as fs from 'fs/promises'
import * as path from 'path'

// ============================================================================
// Types
// ============================================================================

export interface QualityReport {
  id: string
  timestamp: Date
  filePath: string
  overallScore: number
  styleScore: number
  lintScore: number
  formatScore: number
  complexityScore: number
  issues: StyleIssue[]
  suggestions: QualitySuggestion[]
  metadata: {
    linesOfCode: number
    language: string
    framework?: string
    analysisTime: number
  }
}

export interface StyleIssue {
  id: string
  type: StyleIssueType
  severity: 'error' | 'warning' | 'info'
  message: string
  line: number
  column: number
  endLine?: number
  endColumn?: number
  rule: string
  suggestion: string
  autoFixable: boolean
}

export type StyleIssueType =
  | 'naming_convention'
  | 'indentation'
  | 'spacing'
  | 'line_length'
  | 'import_order'
  | 'unused_import'
  | 'unused_variable'
  | 'comment_style'
  | 'brace_style'
  | 'quote_style'
  | 'semicolon'
  | 'trailing_comma'
  | 'empty_line'
  | 'duplicate_code'
  | 'magic_number'
  | 'todo_comment'
  | 'console_statement'
  | 'any_type'
  | 'missing_return_type'
  | 'explicit_any'

export interface QualitySuggestion {
  id: string
  priority: 'high' | 'medium' | 'low'
  category: string
  description: string
  impact: string
  effort: 'small' | 'medium' | 'large'
  relatedIssues: string[]
}

export interface LintRule {
  id: string
  name: string
  category: LintRuleCategory
  description: string
  severity: 'error' | 'warn' | 'off'
  options?: Record<string, any>
  autoFix: boolean
  recommended: boolean
  rationale: string
  examples: LintRuleExample[]
}

export type LintRuleCategory =
  | 'possible_errors'
  | 'best_practices'
  | 'strict_mode'
  | 'variables'
  | 'nodejs'
  | 'stylistic'
  | 'ecmascript_6'
  | 'typescript'
  | 'react'
  | 'import'
  | 'performance'
  | 'security'

export interface LintRuleExample {
  valid: string
  invalid: string
  explanation: string
}

export interface LintConfig {
  extends: string[]
  rules: Record<string, LintRuleConfig>
  plugins?: string[]
  parser?: string
  parserOptions?: Record<string, any>
  env?: Record<string, boolean>
  ignorePatterns?: string[]
}

export interface LintRuleConfig {
  severity: 'error' | 'warn' | 'off'
  options?: any[]
}

export interface FormattingResult {
  id: string
  filePath: string
  original: string
  formatted: string
  changed: boolean
  changes: FormattingChange[]
  appliedRules: string[]
  error?: string
}

export interface FormattingChange {
  type: FormattingChangeType
  line: number
  column: number
  description: string
  before: string
  after: string
}

export type FormattingChangeType =
  | 'indentation'
  | 'spacing'
  | 'line_break'
  | 'quote_conversion'
  | 'semicolon'
  | 'trailing_comma'
  | 'import_sort'
  | 'brace_style'
  | 'empty_line'
  | 'comment_format'

export interface FormattingOptions {
  indentSize: number
  indentStyle: 'space' | 'tab'
  semi: boolean
  singleQuote: boolean
  trailingComma: 'none' | 'es5' | 'all'
  printWidth: number
  tabWidth: number
  useTabs: boolean
  bracketSpacing: boolean
  arrowParens: 'avoid' | 'always'
  endOfLine: 'lf' | 'crlf' | 'cr' | 'auto'
  importSort: boolean
  sortImportsCaseInsensitive: boolean
}

export interface QualityTrend {
  id: string
  projectId: string
  period: 'daily' | 'weekly' | 'monthly'
  dataPoints: TrendDataPoint[]
  metrics: TrendMetrics
  predictions: TrendPrediction[]
  insights: TrendInsight[]
}

export interface TrendDataPoint {
  timestamp: Date
  overallScore: number
  styleScore: number
  lintScore: number
  formatScore: number
  complexityScore: number
  issueCount: number
  fileCount: number
  linesOfCode: number
}

export interface TrendMetrics {
  averageScore: number
  scoreChange: number
  scoreTrend: 'improving' | 'declining' | 'stable'
  issueReduction: number
  topImprovements: string[]
  topRegressions: string[]
  velocity: number // Score change per period
}

export interface TrendPrediction {
  metric: string
  currentValue: number
  predictedValue: number
  confidence: number
  timeframe: string
  factors: string[]
}

export interface TrendInsight {
  id: string
  type: 'positive' | 'negative' | 'neutral'
  title: string
  description: string
  impact: string
  recommendation?: string
}

// ============================================================================
// Code Style Analyzer
// ============================================================================

/**
 * Code Style Analyzer
 * Analyzes code style compliance against best practices
 */
class CodeStyleAnalyzer {
  private namingPatterns = {
    className: /^[A-Z][a-zA-Z0-9]*$/,
    interfaceName: /^I[A-Z][a-zA-Z0-9]*$|^[A-Z][a-zA-Z0-9]*$/,
    functionName: /^[a-z][a-zA-Z0-9]*$/,
    variableName: /^[a-z][a-zA-Z0-9]*$/,
    constantName: /^[A-Z][A-Z0-9_]*$|^[a-z][a-zA-Z0-9]*$/,
    privateMember: /^_[a-z][a-zA-Z0-9]*$/,
    enumName: /^[A-Z][a-zA-Z0-9]*$/,
    enumMember: /^[A-Z][A-Z0-9_]*$|^[a-z][a-zA-Z0-9]*$/
  }

  /**
   * Analyze code style in a file
   */
  async analyzeFile(filePath: string): Promise<QualityReport> {
    const startTime = Date.now()
    const content = await fs.readFile(filePath, 'utf-8')
    return this.analyzeCode(content, filePath)
  }

  /**
   * Analyze code string
   */
  analyzeCode(code: string, filePath: string = 'unknown'): QualityReport {
    const startTime = Date.now()
    const id = `quality_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
    const lines = code.split('\n')

    const issues: StyleIssue[] = []

    // Run all style checks
    issues.push(...this.checkNamingConventions(code, lines))
    issues.push(...this.checkIndentation(code, lines))
    issues.push(...this.checkSpacing(code, lines))
    issues.push(...this.checkLineLength(code, lines))
    issues.push(...this.checkImportOrder(code, lines))
    issues.push(...this.checkUnusedImports(code, lines))
    issues.push(...this.checkUnusedVariables(code, lines))
    issues.push(...this.checkCommentStyle(code, lines))
    issues.push(...this.checkBraceStyle(code, lines))
    issues.push(...this.checkQuoteStyle(code, lines))
    issues.push(...this.checkSemicolons(code, lines))
    issues.push(...this.checkTrailingCommas(code, lines))
    issues.push(...this.checkMagicNumbers(code, lines))
    issues.push(...this.checkTodoComments(code, lines))
    issues.push(...this.checkConsoleStatements(code, lines))
    issues.push(...this.checkAnyTypes(code, lines))
    issues.push(...this.checkMissingReturnTypes(code, lines))

    // Calculate scores
    const styleScore = this.calculateStyleScore(issues, lines.length)
    const lintScore = this.calculateLintScore(issues)
    const formatScore = this.calculateFormatScore(issues)
    const complexityScore = 85 // Would be calculated by complexity analyzer
    const overallScore = Math.round((styleScore * 0.3 + lintScore * 0.3 + formatScore * 0.2 + complexityScore * 0.2))

    // Generate suggestions
    const suggestions = this.generateSuggestions(issues)

    return {
      id,
      timestamp: new Date(),
      filePath,
      overallScore,
      styleScore,
      lintScore,
      formatScore,
      complexityScore,
      issues,
      suggestions,
      metadata: {
        linesOfCode: lines.length,
        language: this.detectLanguage(filePath),
        analysisTime: Date.now() - startTime
      }
    }
  }

  /**
   * Check naming conventions
   */
  private checkNamingConventions(code: string, lines: string[]): StyleIssue[] {
    const issues: StyleIssue[] = []

    // Check class names
    const classPattern = /\bclass\s+([a-zA-Z_][a-zA-Z0-9_]*)/g
    let match
    while ((match = classPattern.exec(code)) !== null) {
      if (!this.namingPatterns.className.test(match[1])) {
        const line = this.getLineNumber(code, match.index)
        issues.push({
          id: `naming_${issues.length}`,
          type: 'naming_convention',
          severity: 'warning',
          message: `Class name '${match[1]}' should be PascalCase`,
          line,
          column: lines[line - 1]?.indexOf(match[1]) + 1 || 1,
          rule: 'naming-convention/class',
          suggestion: `Rename to ${this.toPascalCase(match[1])}`,
          autoFixable: false
        })
      }
    }

    // Check interface names
    const interfacePattern = /\binterface\s+([a-zA-Z_][a-zA-Z0-9_]*)/g
    while ((match = interfacePattern.exec(code)) !== null) {
      if (!this.namingPatterns.interfaceName.test(match[1])) {
        const line = this.getLineNumber(code, match.index)
        issues.push({
          id: `naming_${issues.length}`,
          type: 'naming_convention',
          severity: 'warning',
          message: `Interface name '${match[1]}' should be PascalCase`,
          line,
          column: lines[line - 1]?.indexOf(match[1]) + 1 || 1,
          rule: 'naming-convention/interface',
          suggestion: `Rename to ${this.toPascalCase(match[1])}`,
          autoFixable: false
        })
      }
    }

    // Check function names
    const functionPattern = /\b(?:function|async\s+function)\s+([a-zA-Z_][a-zA-Z0-9_]*)|const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:async\s*)?\(/g
    while ((match = functionPattern.exec(code)) !== null) {
      const name = match[1] || match[2]
      if (name && !this.namingPatterns.functionName.test(name) && !name.startsWith('_')) {
        const line = this.getLineNumber(code, match.index)
        issues.push({
          id: `naming_${issues.length}`,
          type: 'naming_convention',
          severity: 'warning',
          message: `Function name '${name}' should be camelCase`,
          line,
          column: lines[line - 1]?.indexOf(name) + 1 || 1,
          rule: 'naming-convention/function',
          suggestion: `Rename to ${this.toCamelCase(name)}`,
          autoFixable: false
        })
      }
    }

    // Check private member naming
    const privatePattern = /private\s+(\w+)\s*[;:=(]/g
    while ((match = privatePattern.exec(code)) !== null) {
      if (!match[1].startsWith('_') && !this.namingPatterns.privateMember.test(match[1])) {
        const line = this.getLineNumber(code, match.index)
        issues.push({
          id: `naming_${issues.length}`,
          type: 'naming_convention',
          severity: 'info',
          message: `Private member '${match[1]}' should be prefixed with underscore`,
          line,
          column: lines[line - 1]?.indexOf(match[1]) + 1 || 1,
          rule: 'naming-convention/private',
          suggestion: `Rename to _${match[1]}`,
          autoFixable: false
        })
      }
    }

    return issues
  }

  /**
   * Check indentation consistency
   */
  private checkIndentation(code: string, lines: string[]): StyleIssue[] {
    const issues: StyleIssue[] = []
    let expectedIndent = 0
    let indentStyle: 'space' | 'tab' | null = null
    const indentSize = 2 // Default

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trimStart()
      if (trimmed.length === 0) continue

      const leadingWhitespace = line.slice(0, line.length - trimmed.length)

      // Detect indent style
      if (indentStyle === null && leadingWhitespace.length > 0) {
        indentStyle = leadingWhitespace[0] === '\t' ? 'tab' : 'space'
      }

      // Check for mixed tabs and spaces
      if (leadingWhitespace.includes('\t') && leadingWhitespace.includes(' ')) {
        issues.push({
          id: `indent_${issues.length}`,
          type: 'indentation',
          severity: 'error',
          message: 'Mixed tabs and spaces in indentation',
          line: i + 1,
          column: 1,
          rule: 'indent/mixed',
          suggestion: `Use ${indentStyle === 'tab' ? 'tabs' : 'spaces'} consistently`,
          autoFixable: true
        })
      }

      // Calculate expected indent based on brackets
      const openBrackets = (trimmed.match(/[{[(]/g) || []).length
      const closeBrackets = (trimmed.match(/[}\])]/g) || []).length
      const newExpectedIndent = Math.max(0, expectedIndent + openBrackets - closeBrackets)

      // Check indent level (simplified)
      const currentIndent = indentStyle === 'tab'
        ? leadingWhitespace.split('\t').length - 1
        : Math.floor(leadingWhitespace.length / indentSize)

      if (indentStyle === 'space' && leadingWhitespace.length % indentSize !== 0) {
        issues.push({
          id: `indent_${issues.length}`,
          type: 'indentation',
          severity: 'warning',
          message: `Indentation should be ${indentSize} spaces`,
          line: i + 1,
          column: 1,
          rule: 'indent/size',
          suggestion: `Fix indentation to be multiple of ${indentSize}`,
          autoFixable: true
        })
      }

      expectedIndent = newExpectedIndent
    }

    return issues
  }

  /**
   * Check spacing issues
   */
  private checkSpacing(code: string, lines: string[]): StyleIssue[] {
    const issues: StyleIssue[] = []

    // Check for missing spaces around operators
    const operatorPattern = /([a-zA-Z0-9_)])([+\-*/=<>!&|?])([a-zA-Z0-9_(])/g
    let match
    while ((match = operatorPattern.exec(code)) !== null) {
      if (match[2] !== '!' && match[2] !== '+' && match[2] !== '-') {
        const line = this.getLineNumber(code, match.index + 1)
        issues.push({
          id: `spacing_${issues.length}`,
          type: 'spacing',
          severity: 'info',
          message: `Missing spaces around '${match[2]}' operator`,
          line,
          column: this.getColumnNumber(code, match.index + 1),
          rule: 'spacing/operator',
          suggestion: `Add spaces: '${match[1]} ${match[2]} ${match[3]}'`,
          autoFixable: true
        })
      }
    }

    // Check for multiple spaces
    const multiSpacePattern = /[^\s]  +[^\s]/g
    while ((match = multiSpacePattern.exec(code)) !== null) {
      const line = this.getLineNumber(code, match.index)
      const lineContent = lines[line - 1]
      // Skip if it's indentation
      if (!lineContent.slice(0, match.index - code.lastIndexOf('\n', match.index) - 1).trim()) {
        continue
      }
      issues.push({
        id: `spacing_${issues.length}`,
        type: 'spacing',
        severity: 'info',
        message: 'Multiple consecutive spaces',
        line,
        column: this.getColumnNumber(code, match.index),
        rule: 'spacing/multiple',
        suggestion: 'Use single space',
        autoFixable: true
      })
    }

    // Check for space after comma
    const commaPattern = /,\S/g
    while ((match = commaPattern.exec(code)) !== null) {
      const line = this.getLineNumber(code, match.index)
      issues.push({
        id: `spacing_${issues.length}`,
        type: 'spacing',
        severity: 'info',
        message: 'Missing space after comma',
        line,
        column: this.getColumnNumber(code, match.index),
        rule: 'spacing/comma',
        suggestion: 'Add space after comma',
        autoFixable: true
      })
    }

    // Check for space after keywords
    const keywordPattern = /\b(if|for|while|switch|catch)\(/g
    while ((match = keywordPattern.exec(code)) !== null) {
      const line = this.getLineNumber(code, match.index)
      issues.push({
        id: `spacing_${issues.length}`,
        type: 'spacing',
        severity: 'info',
        message: `Missing space after '${match[1]}' keyword`,
        line,
        column: this.getColumnNumber(code, match.index),
        rule: 'spacing/keyword',
        suggestion: `Add space: '${match[1]} ('`,
        autoFixable: true
      })
    }

    return issues
  }

  /**
   * Check line length
   */
  private checkLineLength(code: string, lines: string[]): StyleIssue[] {
    const issues: StyleIssue[] = []
    const maxLength = 100
    const warnLength = 80

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.length > maxLength) {
        issues.push({
          id: `line_${issues.length}`,
          type: 'line_length',
          severity: 'warning',
          message: `Line exceeds ${maxLength} characters (${line.length})`,
          line: i + 1,
          column: maxLength,
          endColumn: line.length,
          rule: 'max-len',
          suggestion: 'Break line into multiple lines',
          autoFixable: false
        })
      } else if (line.length > warnLength) {
        issues.push({
          id: `line_${issues.length}`,
          type: 'line_length',
          severity: 'info',
          message: `Line is long (${line.length} characters, max ${maxLength})`,
          line: i + 1,
          column: warnLength,
          endColumn: line.length,
          rule: 'max-len-warn',
          suggestion: 'Consider breaking line',
          autoFixable: false
        })
      }
    }

    return issues
  }

  /**
   * Check import order
   */
  private checkImportOrder(code: string, lines: string[]): StyleIssue[] {
    const issues: StyleIssue[] = []
    const importLines: { line: number; import: string; path: string }[] = []

    const importPattern = /^import\s+(?:(\{[^}]+\})|(\w+)(?:\s*,\s*\{([^}]+)\})?)\s+from\s+['"]([^'"]+)['"]/gm

    let match
    while ((match = importPattern.exec(code)) !== null) {
      const line = this.getLineNumber(code, match.index)
      importLines.push({
        line,
        import: match[0],
        path: match[4]
      })
    }

    // Check if imports are sorted
    for (let i = 1; i < importLines.length; i++) {
      const prev = importLines[i - 1]
      const curr = importLines[i]

      // Check alphabetical order
      if (prev.path.localeCompare(curr.path) > 0) {
        issues.push({
          id: `import_${issues.length}`,
          type: 'import_order',
          severity: 'info',
          message: `Imports are not sorted: '${curr.path}' should come before '${prev.path}'`,
          line: curr.line,
          column: 1,
          rule: 'import/order',
          suggestion: 'Sort imports alphabetically',
          autoFixable: true
        })
      }
    }

    return issues
  }

  /**
   * Check for unused imports
   */
  private checkUnusedImports(code: string, lines: string[]): StyleIssue[] {
    const issues: StyleIssue[] = []
    const importPattern = /import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/g

    let match
    while ((match = importPattern.exec(code)) !== null) {
      const imports = match[1]
        ? match[1].split(',').map(s => s.trim().split(' as ').pop()!.trim())
        : [match[2]]

      for (const imp of imports) {
        if (!imp) continue

        // Check if import is used elsewhere in the file
        const afterImport = code.slice(match.index + match[0].length)
        const importName = imp.split(' as ').pop()?.trim() || imp

        // Simple usage check (not perfect but good enough)
        const usagePattern = new RegExp(`\\b${this.escapeRegex(importName)}\\b`, 'g')
        const usages = afterImport.match(usagePattern)

        if (!usages || usages.length === 0) {
          const line = this.getLineNumber(code, match.index)
          issues.push({
            id: `unused_${issues.length}`,
            type: 'unused_import',
            severity: 'warning',
            message: `Unused import: '${importName}'`,
            line,
            column: lines[line - 1]?.indexOf(importName) + 1 || 1,
            rule: 'no-unused-vars',
            suggestion: `Remove unused import '${importName}'`,
            autoFixable: true
          })
        }
      }
    }

    return issues
  }

  /**
   * Check for unused variables
   */
  private checkUnusedVariables(code: string, lines: string[]): StyleIssue[] {
    const issues: StyleIssue[] = []

    // Skip for simplicity - this would require more sophisticated AST analysis
    // Basic pattern matching for unused const/let
    const varPattern = /(?:const|let|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g

    let match
    while ((match = varPattern.exec(code)) !== null) {
      const varName = match[1]
      const line = this.getLineNumber(code, match.index)

      // Skip if variable name starts with _ (convention for intentionally unused)
      if (varName.startsWith('_')) continue

      // Check usage after declaration
      const afterDeclaration = code.slice(match.index + match[0].length)
      const usagePattern = new RegExp(`\\b${this.escapeRegex(varName)}\\b`, 'g')
      const usages = afterDeclaration.match(usagePattern)

      // Skip exported variables
      const lineContent = lines[line - 1] || ''
      if (lineContent.includes('export ')) continue

      if (!usages || usages.length === 0) {
        issues.push({
          id: `unused_var_${issues.length}`,
          type: 'unused_variable',
          severity: 'warning',
          message: `Unused variable: '${varName}'`,
          line,
          column: lines[line - 1]?.indexOf(varName) + 1 || 1,
          rule: 'no-unused-vars',
          suggestion: `Remove unused variable or prefix with '_' if intentionally unused`,
          autoFixable: true
        })
      }
    }

    return issues
  }

  /**
   * Check comment style
   */
  private checkCommentStyle(code: string, lines: string[]): StyleIssue[] {
    const issues: StyleIssue[] = []

    // Check for TODO/FIXME comments
    const todoPattern = /\/\/\s*(TODO|FIXME|HACK|XXX)(?::\s*(.+))?/gi
    let match
    while ((match = todoPattern.exec(code)) !== null) {
      const line = this.getLineNumber(code, match.index)
      issues.push({
        id: `todo_${issues.length}`,
        type: 'todo_comment',
        severity: 'info',
        message: `${match[1]} comment found: ${match[2] || 'no description'}`,
        line,
        column: this.getColumnNumber(code, match.index),
        rule: 'no-todo',
        suggestion: 'Resolve or create an issue for this item',
        autoFixable: false
      })
    }

    // Check for missing JSDoc on public functions
    const functionPattern = /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_][a-zA-Z0-9_]*)/g
    while ((match = functionPattern.exec(code)) !== null) {
      const line = this.getLineNumber(code, match.index)
      const prevLine = lines[line - 2]

      if (!prevLine?.trim().startsWith('*') && !prevLine?.trim().startsWith('/**')) {
        // Only warn for exported functions
        if (lines[line - 1]?.includes('export ')) {
          issues.push({
            id: `jsdoc_${issues.length}`,
            type: 'comment_style',
            severity: 'info',
            message: `Missing JSDoc for exported function '${match[1]}'`,
            line,
            column: 1,
            rule: 'jsdoc/require',
            suggestion: 'Add JSDoc comment for better documentation',
            autoFixable: false
          })
        }
      }
    }

    return issues
  }

  /**
   * Check brace style
   */
  private checkBraceStyle(code: string, lines: string[]): StyleIssue[] {
    const issues: StyleIssue[] = []

    // Check for same-line brace style (Stroustrup/OTBS)
    const braceOnNewLine = /^\s*\{\s*$/gm
    let match
    while ((match = braceOnNewLine.exec(code)) !== null) {
      const line = this.getLineNumber(code, match.index)
      const prevLine = lines[line - 2]?.trim()

      // Check if previous line ends with ) or else
      if (prevLine && (prevLine.endsWith(')') || prevLine.endsWith('else'))) {
        issues.push({
          id: `brace_${issues.length}`,
          type: 'brace_style',
          severity: 'info',
          message: 'Opening brace should be on same line as statement',
          line,
          column: 1,
          rule: 'brace-style',
          suggestion: 'Move opening brace to previous line',
          autoFixable: true
        })
      }
    }

    return issues
  }

  /**
   * Check quote style consistency
   */
  private checkQuoteStyle(code: string, lines: string[]): StyleIssue[] {
    const issues: StyleIssue[] = []

    // Count single vs double quotes
    const singleQuotes = (code.match(/'(?:[^'\\]|\\.)*'/g) || []).length
    const doubleQuotes = (code.match(/"(?:[^"\\]|\\.)*"/g) || []).length
    const templateLiterals = (code.match(/`(?:[^`\\]|\\.)*`/g) || []).length

    // Recommend single quotes if more common
    if (doubleQuotes > singleQuotes && singleQuotes > 0) {
      // Find double quote usages
      const doubleQuotePattern = /"([^'"]*)"/g
      let match
      let count = 0
      while ((match = doubleQuotePattern.exec(code)) !== null && count < 5) {
        const line = this.getLineNumber(code, match.index)
        // Skip if the string contains a single quote
        if (!match[1].includes("'")) {
          issues.push({
            id: `quote_${issues.length}`,
            type: 'quote_style',
            severity: 'info',
            message: "Prefer single quotes for consistency",
            line,
            column: this.getColumnNumber(code, match.index),
            rule: 'quotes',
            suggestion: `Use single quotes: '${match[1]}'`,
            autoFixable: true
          })
          count++
        }
      }
    }

    return issues
  }

  /**
   * Check semicolon usage
   */
  private checkSemicolons(code: string, lines: string[]): StyleIssue[] {
    const issues: StyleIssue[] = []

    // Check for missing semicolons after statements
    const statementPattern = /^(\s*(?:const|let|var|return|throw|break|continue)\s+.*)$/gm
    let match
    while ((match = statementPattern.exec(code)) !== null) {
      const statement = match[1]
      if (!statement.trim().endsWith(';') && !statement.trim().endsWith('{') && !statement.trim().endsWith('}')) {
        const line = this.getLineNumber(code, match.index)
        issues.push({
          id: `semi_${issues.length}`,
          type: 'semicolon',
          severity: 'warning',
          message: 'Missing semicolon',
          line,
          column: lines[line - 1]?.length || 1,
          rule: 'semi',
          suggestion: 'Add semicolon at end of statement',
          autoFixable: true
        })
      }
    }

    return issues
  }

  /**
   * Check trailing commas
   */
  private checkTrailingCommas(code: string, lines: string[]): StyleIssue[] {
    const issues: StyleIssue[] = []

    // Check for missing trailing commas in multi-line arrays/objects
    const multilinePattern = /(?:\[|\{)\s*\n([^[\]]*?)\s*(?:\]|\})/g
    let match
    while ((match = multilinePattern.exec(code)) !== null) {
      const content = match[1]
      const lines_inBlock = content.split('\n')

      if (lines_inBlock.length > 1) {
        // Check if last non-whitespace line has a trailing comma
        const lastLine = lines_inBlock.filter(l => l.trim()).pop()
        if (lastLine && !lastLine.trim().endsWith(',') && !lastLine.trim().endsWith('{') && !lastLine.trim().endsWith('[')) {
          const line = this.getLineNumber(code, match.index + match[0].lastIndexOf(lastLine))
          issues.push({
            id: `comma_${issues.length}`,
            type: 'trailing_comma',
            severity: 'info',
            message: 'Missing trailing comma in multi-line structure',
            line,
            column: lines[line - 1]?.length || 1,
            rule: 'comma-dangle',
            suggestion: 'Add trailing comma for cleaner diffs',
            autoFixable: true
          })
        }
      }
    }

    return issues
  }

  /**
   * Check for magic numbers
   */
  private checkMagicNumbers(code: string, lines: string[]): StyleIssue[] {
    const issues: StyleIssue[] = []

    // Find numeric literals that aren't 0, 1, or 2
    const numberPattern = /\b(\d{3,})\b/g
    let match
    while ((match = numberPattern.exec(code)) !== null) {
      const line = this.getLineNumber(code, match.index)
      const lineContent = lines[line - 1] || ''

      // Skip if it's part of an import or export
      if (lineContent.includes('import') || lineContent.includes('export')) continue
      // Skip if it's a port number
      if (lineContent.includes('port') || lineContent.includes('PORT')) continue

      issues.push({
        id: `magic_${issues.length}`,
        type: 'magic_number',
        severity: 'info',
        message: `Magic number: ${match[1]}. Consider using a named constant`,
        line,
        column: this.getColumnNumber(code, match.index),
        rule: 'no-magic-numbers',
        suggestion: 'Extract to a named constant for better readability',
        autoFixable: false
      })
    }

    return issues
  }

  /**
   * Check for TODO comments (duplicate with comment style - keeping separate for categorization)
   */
  private checkTodoComments(code: string, lines: string[]): StyleIssue[] {
    // Already handled in checkCommentStyle
    return []
  }

  /**
   * Check for console statements
   */
  private checkConsoleStatements(code: string, lines: string[]): StyleIssue[] {
    const issues: StyleIssue[] = []

    const consolePattern = /console\.(log|debug|info|warn|error|trace)\s*\(/g
    let match
    while ((match = consolePattern.exec(code)) !== null) {
      const line = this.getLineNumber(code, match.index)
      const lineContent = lines[line - 1] || ''

      // Skip if in a comment
      if (lineContent.trim().startsWith('//')) continue

      issues.push({
        id: `console_${issues.length}`,
        type: 'console_statement',
        severity: 'warning',
        message: `Unexpected console statement: console.${match[1]}`,
        line,
        column: this.getColumnNumber(code, match.index),
        rule: 'no-console',
        suggestion: 'Remove console statement or use a proper logging library',
        autoFixable: true
      })
    }

    return issues
  }

  /**
   * Check for 'any' type usage
   */
  private checkAnyTypes(code: string, lines: string[]): StyleIssue[] {
    const issues: StyleIssue[] = []

    const anyPattern = /:\s*any\b/g
    let match
    while ((match = anyPattern.exec(code)) !== null) {
      const line = this.getLineNumber(code, match.index)
      const lineContent = lines[line - 1] || ''

      // Skip if it's in a comment
      if (lineContent.trim().startsWith('//') || lineContent.trim().startsWith('*')) continue

      issues.push({
        id: `any_${issues.length}`,
        type: 'any_type',
        severity: 'warning',
        message: "Unexpected 'any' type. Use a more specific type",
        line,
        column: this.getColumnNumber(code, match.index),
        rule: '@typescript-eslint/no-explicit-any',
        suggestion: 'Replace with a specific type or use unknown',
        autoFixable: false
      })
    }

    return issues
  }

  /**
   * Check for missing return types
   */
  private checkMissingReturnTypes(code: string, lines: string[]): StyleIssue[] {
    const issues: StyleIssue[] = []

    // Match functions without return type annotations
    const functionPattern = /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*\{/g
    let match
    while ((match = functionPattern.exec(code)) !== null) {
      const functionSignature = match[0]
      const line = this.getLineNumber(code, match.index)

      // Check if there's a return type annotation
      if (!functionSignature.includes('):')) {
        issues.push({
          id: `return_${issues.length}`,
          type: 'missing_return_type',
          severity: 'info',
          message: `Missing return type for function '${match[1]}'`,
          line,
          column: this.getColumnNumber(code, match.index + functionSignature.indexOf(match[1])),
          rule: '@typescript-eslint/explicit-function-return-type',
          suggestion: 'Add explicit return type annotation',
          autoFixable: false
        })
      }
    }

    return issues
  }

  /**
   * Calculate style score
   */
  private calculateStyleScore(issues: StyleIssue[], lineCount: number): number {
    if (lineCount === 0) return 100

    const styleIssues = issues.filter(i =>
      i.type === 'naming_convention' ||
      i.type === 'indentation' ||
      i.type === 'spacing' ||
      i.type === 'quote_style' ||
      i.type === 'brace_style' ||
      i.type === 'semicolon' ||
      i.type === 'trailing_comma'
    )

    const errorCount = styleIssues.filter(i => i.severity === 'error').length
    const warningCount = styleIssues.filter(i => i.severity === 'warning').length

    // Deduct points based on issue density
    const errorDeduction = Math.min(errorCount * 5, 40)
    const warningDeduction = Math.min(warningCount * 2, 20)

    return Math.max(0, 100 - errorDeduction - warningDeduction)
  }

  /**
   * Calculate lint score
   */
  private calculateLintScore(issues: StyleIssue[]): number {
    const lintIssues = issues.filter(i =>
      i.type === 'unused_import' ||
      i.type === 'unused_variable' ||
      i.type === 'any_type' ||
      i.type === 'console_statement' ||
      i.type === 'missing_return_type'
    )

    const errorCount = lintIssues.filter(i => i.severity === 'error' || i.severity === 'warning').length

    return Math.max(0, 100 - errorCount * 3)
  }

  /**
   * Calculate format score
   */
  private calculateFormatScore(issues: StyleIssue[]): number {
    const formatIssues = issues.filter(i =>
      i.type === 'indentation' ||
      i.type === 'line_length' ||
      i.type === 'import_order'
    )

    return Math.max(0, 100 - formatIssues.length * 2)
  }

  /**
   * Generate suggestions based on issues
   */
  private generateSuggestions(issues: StyleIssue[]): QualitySuggestion[] {
    const suggestions: QualitySuggestion[] = []
    const issueCounts = new Map<string, number>()

    // Count issues by type
    for (const issue of issues) {
      const count = issueCounts.get(issue.type) || 0
      issueCounts.set(issue.type, count + 1)
    }

    // Generate suggestions for common issues
    if (issueCounts.get('any_type') && issueCounts.get('any_type')! > 3) {
      suggestions.push({
        id: `sug_${suggestions.length}`,
        priority: 'high',
        category: 'TypeScript',
        description: 'Replace multiple any types with specific types',
        impact: 'Improves type safety and IDE support',
        effort: 'medium',
        relatedIssues: issues.filter(i => i.type === 'any_type').map(i => i.id)
      })
    }

    if (issueCounts.get('unused_import') && issueCounts.get('unused_import')! > 5) {
      suggestions.push({
        id: `sug_${suggestions.length}`,
        priority: 'medium',
        category: 'Imports',
        description: 'Clean up unused imports',
        impact: 'Reduces bundle size and improves code clarity',
        effort: 'small',
        relatedIssues: issues.filter(i => i.type === 'unused_import').map(i => i.id)
      })
    }

    if (issueCounts.get('console_statement') && issueCounts.get('console_statement')! > 3) {
      suggestions.push({
        id: `sug_${suggestions.length}`,
        priority: 'medium',
        category: 'Logging',
        description: 'Replace console statements with proper logging',
        impact: 'Better production logging and debugging',
        effort: 'medium',
        relatedIssues: issues.filter(i => i.type === 'console_statement').map(i => i.id)
      })
    }

    return suggestions
  }

  /**
   * Helper: Get line number from index
   */
  private getLineNumber(code: string, index: number): number {
    return code.slice(0, index).split('\n').length
  }

  /**
   * Helper: Get column number from index
   */
  private getColumnNumber(code: string, index: number): number {
    const lineStart = code.lastIndexOf('\n', index - 1) + 1
    return index - lineStart + 1
  }

  /**
   * Helper: Escape regex special characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * Helper: Convert to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (_, c) => c.toUpperCase())
  }

  /**
   * Helper: Convert to camelCase
   */
  private toCamelCase(str: string): string {
    return str
      .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (_, c) => c.toLowerCase())
  }

  /**
   * Helper: Detect language from file path
   */
  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath)
    const languageMap: Record<string, string> = {
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript React',
      '.js': 'JavaScript',
      '.jsx': 'JavaScript React',
      '.py': 'Python',
      '.java': 'Java',
      '.go': 'Go',
      '.rs': 'Rust',
      '.rb': 'Ruby',
      '.php': 'PHP',
      '.c': 'C',
      '.cpp': 'C++',
      '.cs': 'C#',
      '.swift': 'Swift',
      '.kt': 'Kotlin'
    }
    return languageMap[ext] || 'Unknown'
  }
}

// ============================================================================
// Lint Rule Generator
// ============================================================================

/**
 * Lint Rule Generator
 * Generates lint rules and configurations
 */
class LintRuleGenerator {
  private ruleDatabase: Map<string, LintRule> = new Map()

  constructor() {
    this.initializeDefaultRules()
  }

  /**
   * Initialize default lint rules
   */
  private initializeDefaultRules(): void {
    // Possible Errors
    this.addRule({
      id: 'no-console',
      name: 'no-console',
      category: 'possible_errors',
      description: 'Disallow console statements',
      severity: 'warn',
      autoFix: false,
      recommended: true,
      rationale: 'Console statements are typically left in code accidentally and should be removed before production',
      examples: [
        {
          valid: '// Use a proper logging library\nlogger.info("message")',
          invalid: 'console.log("message")',
          explanation: 'Use a logging library instead of console for better control'
        }
      ]
    })

    this.addRule({
      id: 'no-debugger',
      name: 'no-debugger',
      category: 'possible_errors',
      description: 'Disallow debugger statements',
      severity: 'error',
      autoFix: false,
      recommended: true,
      rationale: 'Debugger statements should not be committed to production code',
      examples: [
        {
          valid: '// Use proper debugging tools',
          invalid: 'debugger;',
          explanation: 'Remove debugger statements before committing'
        }
      ]
    })

    // Best Practices
    this.addRule({
      id: 'no-explicit-any',
      name: '@typescript-eslint/no-explicit-any',
      category: 'typescript',
      description: 'Disallow the any type',
      severity: 'warn',
      autoFix: false,
      recommended: true,
      rationale: 'Using any defeats TypeScript type checking and can lead to runtime errors',
      examples: [
        {
          valid: 'function greet(name: string): string { return name; }',
          invalid: 'function greet(name: any): any { return name; }',
          explanation: 'Use specific types instead of any'
        }
      ]
    })

    this.addRule({
      id: 'prefer-const',
      name: 'prefer-const',
      category: 'best_practices',
      description: 'Prefer const for variables that are never reassigned',
      severity: 'warn',
      autoFix: true,
      recommended: true,
      rationale: 'Using const makes code more predictable and can help catch bugs',
      examples: [
        {
          valid: 'const x = 1;',
          invalid: 'let x = 1;',
          explanation: 'Use const when the variable is never reassigned'
        }
      ]
    })

    // Stylistic
    this.addRule({
      id: 'indent',
      name: 'indent',
      category: 'stylistic',
      description: 'Enforce consistent indentation',
      severity: 'error',
      options: { SwitchCase: 1 },
      autoFix: true,
      recommended: true,
      rationale: 'Consistent indentation improves code readability',
      examples: [
        {
          valid: 'if (true) {\n  doSomething();\n}',
          invalid: 'if (true) {\ndoSomething();\n}',
          explanation: 'Use consistent 2-space indentation'
        }
      ]
    })

    this.addRule({
      id: 'quotes',
      name: 'quotes',
      category: 'stylistic',
      description: 'Enforce consistent quote style',
      severity: 'warn',
      options: { single: true, avoidEscape: true },
      autoFix: true,
      recommended: true,
      rationale: 'Consistent quote style improves code readability',
      examples: [
        {
          valid: "const name = 'John';",
          invalid: 'const name = "John";',
          explanation: 'Prefer single quotes for strings'
        }
      ]
    })

    this.addRule({
      id: 'semi',
      name: 'semi',
      category: 'stylistic',
      description: 'Require semicolons',
      severity: 'error',
      autoFix: true,
      recommended: true,
      rationale: 'Semicolons prevent subtle bugs and improve code clarity',
      examples: [
        {
          valid: 'const x = 1;',
          invalid: 'const x = 1',
          explanation: 'Always add semicolons at the end of statements'
        }
      ]
    })

    // TypeScript specific
    this.addRule({
      id: 'explicit-return-type',
      name: '@typescript-eslint/explicit-function-return-type',
      category: 'typescript',
      description: 'Require explicit return types on functions',
      severity: 'warn',
      autoFix: false,
      recommended: false,
      rationale: 'Explicit return types improve code documentation and catch type errors',
      examples: [
        {
          valid: 'function add(a: number, b: number): number { return a + b; }',
          invalid: 'function add(a: number, b: number) { return a + b; }',
          explanation: 'Add explicit return type annotations'
        }
      ]
    })

    // Import rules
    this.addRule({
      id: 'import-order',
      name: 'import/order',
      category: 'import',
      description: 'Enforce a convention in module import order',
      severity: 'warn',
      autoFix: true,
      recommended: true,
      rationale: 'Consistent import ordering improves code organization',
      examples: [
        {
          valid: "import fs from 'fs';\nimport { useState } from 'react';\nimport { Button } from './Button';",
          invalid: "import { Button } from './Button';\nimport fs from 'fs';\nimport { useState } from 'react';",
          explanation: 'Order imports: built-in, external, internal, relative'
        }
      ]
    })

    this.addRule({
      id: 'no-unused-vars',
      name: 'no-unused-vars',
      category: 'variables',
      description: 'Disallow unused variables',
      severity: 'warn',
      autoFix: true,
      recommended: true,
      rationale: 'Unused variables indicate incomplete code or mistakes',
      examples: [
        {
          valid: 'const x = 1;\nconsole.log(x);',
          invalid: 'const x = 1;\n// x is never used',
          explanation: 'Remove variables that are not used'
        }
      ]
    })

    // Performance
    this.addRule({
      id: 'react-hooks-exhaustive-deps',
      name: 'react-hooks/exhaustive-deps',
      category: 'performance',
      description: 'Enforce exhaustive deps rule for React hooks',
      severity: 'error',
      autoFix: false,
      recommended: true,
      rationale: 'Missing dependencies can cause stale closures and bugs',
      examples: [
        {
          valid: 'useEffect(() => { fetchData(id); }, [id]);',
          invalid: 'useEffect(() => { fetchData(id); }, []);',
          explanation: 'Include all dependencies in the dependency array'
        }
      ]
    })
  }

  /**
   * Add a lint rule
   */
  addRule(rule: LintRule): void {
    this.ruleDatabase.set(rule.id, rule)
  }

  /**
   * Get rule by ID
   */
  getRule(id: string): LintRule | undefined {
    return this.ruleDatabase.get(id)
  }

  /**
   * Get all rules
   */
  getAllRules(): LintRule[] {
    return Array.from(this.ruleDatabase.values())
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: LintRuleCategory): LintRule[] {
    return this.getAllRules().filter(r => r.category === category)
  }

  /**
   * Get recommended rules
   */
  getRecommendedRules(): LintRule[] {
    return this.getAllRules().filter(r => r.recommended)
  }

  /**
   * Generate ESLint configuration
   */
  generateESLintConfig(options: {
    typescript?: boolean
    react?: boolean
    node?: boolean
    strict?: boolean
  } = {}): LintConfig {
    const config: LintConfig = {
      extends: ['eslint:recommended'],
      rules: {},
      plugins: [],
      env: {
        es2022: true,
        node: options.node ?? true
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    }

    // Add TypeScript support
    if (options.typescript) {
      config.extends.push('plugin:@typescript-eslint/recommended')
      config.plugins?.push('@typescript-eslint')
      config.parser = '@typescript-eslint/parser'
      config.parserOptions = {
        ...config.parserOptions,
        ecmaFeatures: {
          jsx: options.react
        }
      }
    }

    // Add React support
    if (options.react) {
      config.extends.push('plugin:react/recommended', 'plugin:react-hooks/recommended')
      config.plugins?.push('react', 'react-hooks')
      config.env!.browser = true
      ;(config as any).settings = {
        react: {
          version: 'detect'
        }
      }
    }

    // Add import plugin
    config.plugins?.push('import')
    config.extends.push('plugin:import/recommended')
    if (options.typescript) {
      config.extends.push('plugin:import/typescript')
    }

    // Add rules
    const rules = this.getRecommendedRules()
    for (const rule of rules) {
      config.rules[rule.name] = { 
        severity: rule.severity, 
        ...(rule.options && { options: [rule.options] })
      }
    }

    // Add strict rules if requested
    if (options.strict) {
      const strictRules = [
        ['no-implicit-coercion', 'error'],
        ['no-magic-numbers', ['warn', { ignore: [0, 1, 2] }]],
        ['@typescript-eslint/strict-boolean-expressions', 'warn']
      ]

      for (const [name, severity] of strictRules) {
        config.rules[name as string] = { severity: severity as 'error' | 'warn' }
      }
    }

    return config
  }

  /**
   * Generate custom rule based on pattern
   */
  generateCustomRule(pattern: {
    name: string
    pattern: string | RegExp
    message: string
    severity: 'error' | 'warn'
  }): LintRule {
    return {
      id: `custom-${pattern.name}`,
      name: pattern.name,
      category: 'best_practices',
      description: `Custom rule: ${pattern.message}`,
      severity: pattern.severity,
      autoFix: false,
      recommended: false,
      rationale: 'Project-specific requirement',
      examples: [
        {
          valid: '// Code following the pattern',
          invalid: '// Code violating the pattern',
          explanation: pattern.message
        }
      ]
    }
  }

  /**
   * Export rules to JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.getAllRules(), null, 2)
  }
}

// ============================================================================
// Code Formatting System
// ============================================================================

/**
 * Code Formatting System
 * Formats code automatically
 */
class CodeFormatter {
  private defaultOptions: FormattingOptions = {
    indentSize: 2,
    indentStyle: 'space',
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    bracketSpacing: true,
    arrowParens: 'always',
    endOfLine: 'lf',
    importSort: true,
    sortImportsCaseInsensitive: false
  }

  /**
   * Format code string
   */
  format(code: string, options: Partial<FormattingOptions> = {}): FormattingResult {
    const opts = { ...this.defaultOptions, ...options }
    const id = `format_${Date.now().toString(36)}`
    const changes: FormattingChange[] = []
    let formatted = code
    const appliedRules: string[] = []

    try {
      // Apply formatting transformations
      const result1 = this.normalizeIndentation(formatted, opts)
      if (result1.changed) {
        changes.push(...result1.changes)
        formatted = result1.code
        appliedRules.push('indentation')
      }

      const result2 = this.normalizeQuotes(formatted, opts)
      if (result2.changed) {
        changes.push(...result2.changes)
        formatted = result2.code
        appliedRules.push('quotes')
      }

      const result3 = this.normalizeSemicolons(formatted, opts)
      if (result3.changed) {
        changes.push(...result3.changes)
        formatted = result3.code
        appliedRules.push('semicolons')
      }

      const result4 = this.normalizeTrailingCommas(formatted, opts)
      if (result4.changed) {
        changes.push(...result4.changes)
        formatted = result4.code
        appliedRules.push('trailing-commas')
      }

      const result5 = this.sortImports(formatted, opts)
      if (result5.changed) {
        changes.push(...result5.changes)
        formatted = result5.code
        appliedRules.push('import-sort')
      }

      const result6 = this.normalizeSpacing(formatted, opts)
      if (result6.changed) {
        changes.push(...result6.changes)
        formatted = result6.code
        appliedRules.push('spacing')
      }

      const result7 = this.normalizeLineEndings(formatted, opts)
      if (result7.changed) {
        formatted = result7.code
        appliedRules.push('line-endings')
      }

      return {
        id,
        filePath: 'formatted',
        original: code,
        formatted,
        changed: formatted !== code,
        changes,
        appliedRules
      }
    } catch (error) {
      return {
        id,
        filePath: 'formatted',
        original: code,
        formatted: code,
        changed: false,
        changes: [],
        appliedRules: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Format file
   */
  async formatFile(filePath: string, options: Partial<FormattingOptions> = {}): Promise<FormattingResult> {
    const content = await fs.readFile(filePath, 'utf-8')
    const result = this.format(content, options)
    result.filePath = filePath
    return result
  }

  /**
   * Normalize indentation
   */
  private normalizeIndentation(code: string, options: FormattingOptions): { code: string; changed: boolean; changes: FormattingChange[] } {
    const changes: FormattingChange[] = []
    const lines = code.split('\n')
    const indentChar = options.useTabs ? '\t' : ' '.repeat(options.indentSize)

    let inString = false
    let stringChar = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trimStart()

      // Skip empty lines
      if (trimmed.length === 0) continue

      // Simple string detection (not perfect but good enough)
      if (!inString) {
        for (const char of line) {
          if ((char === '"' || char === "'" || char === '`') && !inString) {
            inString = true
            stringChar = char
          } else if (char === stringChar && inString) {
            inString = false
          }
        }
      }

      if (inString) continue

      // Count leading tabs and spaces
      const leadingWhitespace = line.match(/^[\t ]*/)?.[0] || ''
      const tabCount = (leadingWhitespace.match(/\t/g) || []).length
      const spaceCount = (leadingWhitespace.match(/ /g) || []).length

      // Convert to target indentation
      const totalIndent = tabCount * (options.tabWidth || 2) + spaceCount
      const indentLevel = Math.floor(totalIndent / options.indentSize)
      const newIndent = indentChar.repeat(indentLevel)

      if (leadingWhitespace !== newIndent) {
        changes.push({
          type: 'indentation',
          line: i + 1,
          column: 1,
          description: `Fix indentation to ${indentLevel} level(s)`,
          before: leadingWhitespace,
          after: newIndent
        })
        lines[i] = newIndent + trimmed
      }
    }

    return {
      code: lines.join('\n'),
      changed: changes.length > 0,
      changes
    }
  }

  /**
   * Normalize quotes
   */
  private normalizeQuotes(code: string, options: FormattingOptions): { code: string; changed: boolean; changes: FormattingChange[] } {
    const changes: FormattingChange[] = []
    let result = code

    if (options.singleQuote) {
      // Convert double quotes to single where safe
      const doubleQuotePattern = /"([^"'\n]*)"/g
      let match
      let offset = 0

      while ((match = doubleQuotePattern.exec(code)) !== null) {
        const content = match[1]
        // Only convert if content doesn't contain single quotes
        if (!content.includes("'")) {
          const newQuote = `'${content}'`
          const startIdx = match.index + offset
          const line = code.slice(0, match.index).split('\n').length

          result = result.slice(0, startIdx) + newQuote + result.slice(startIdx + match[0].length)
          offset += newQuote.length - match[0].length

          changes.push({
            type: 'quote_conversion',
            line,
            column: match.index - code.lastIndexOf('\n', match.index - 1),
            description: 'Convert double quotes to single quotes',
            before: match[0],
            after: newQuote
          })
        }
      }
    }

    return {
      code: result,
      changed: changes.length > 0,
      changes
    }
  }

  /**
   * Normalize semicolons
   */
  private normalizeSemicolons(code: string, options: FormattingOptions): { code: string; changed: boolean; changes: FormattingChange[] } {
    const changes: FormattingChange[] = []
    const lines = code.split('\n')

    if (options.semi) {
      // Add missing semicolons
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trimEnd()
        const trimmed = line.trim()

        // Skip empty lines, comments, and lines that end with proper characters
        if (!trimmed ||
            trimmed.startsWith('//') ||
            trimmed.startsWith('/*') ||
            trimmed.endsWith('{') ||
            trimmed.endsWith('}') ||
            trimmed.endsWith(';') ||
            trimmed.endsWith(',') ||
            trimmed.endsWith(':') ||
            trimmed.startsWith('@') ||
            trimmed.startsWith('import') ||
            trimmed.startsWith('export') ||
            trimmed.includes('function') ||
            trimmed.includes('class ')) {
          continue
        }

        // Check if it's a statement that needs a semicolon
        if (/^(const|let|var|return|throw|break|continue|yield)\s/.test(trimmed) ||
            /^[a-zA-Z_][a-zA-Z0-9_]*\s*[=+*/-]?=/.test(trimmed) ||
            /^[a-zA-Z_][a-zA-Z0-9_]*\s*\(/.test(trimmed)) {
          const originalLine = lines[i]
          lines[i] = line + ';'

          changes.push({
            type: 'semicolon',
            line: i + 1,
            column: line.length,
            description: 'Add missing semicolon',
            before: originalLine,
            after: lines[i]
          })
        }
      }
    }

    return {
      code: lines.join('\n'),
      changed: changes.length > 0,
      changes
    }
  }

  /**
   * Normalize trailing commas
   */
  private normalizeTrailingCommas(code: string, options: FormattingOptions): { code: string; changed: boolean; changes: FormattingChange[] } {
    const changes: FormattingChange[] = []

    if (options.trailingComma === 'all' || options.trailingComma === 'es5') {
      // Add trailing commas in multi-line arrays/objects
      const multilinePattern = /(?:\[|\{)\s*\n([\s\S]*?)\n\s*(?:\]|\})/g
      let match
      let offset = 0

      while ((match = multilinePattern.exec(code)) !== null) {
        const content = match[1]
        const lines = content.split('\n')

        // Find last non-empty line
        let lastLineIdx = lines.length - 1
        while (lastLineIdx >= 0 && !lines[lastLineIdx].trim()) {
          lastLineIdx--
        }

        if (lastLineIdx >= 0) {
          const lastLine = lines[lastLineIdx].trim()
          // Check if line ends with comma (not in a nested structure)
          if (!lastLine.endsWith(',') &&
              !lastLine.endsWith('{') &&
              !lastLine.endsWith('[') &&
              !lastLine.endsWith('(')) {
            // Add trailing comma
            const originalLastLine = lines[lastLineIdx]
            const lastWhitespace = originalLastLine.match(/^(\s*)/)?.[1] || ''
            lines[lastLineIdx] = lastWhitespace + lastLine + ','

            changes.push({
              type: 'trailing_comma',
              line: match.index.toString().split('\n').length + lastLineIdx + 1,
              column: 1,
              description: 'Add trailing comma in multi-line structure',
              before: originalLastLine,
              after: lines[lastLineIdx]
            })
          }
        }
      }
    }

    return {
      code,
      changed: changes.length > 0,
      changes
    }
  }

  /**
   * Sort imports
   */
  private sortImports(code: string, options: FormattingOptions): { code: string; changed: boolean; changes: FormattingChange[] } {
    const changes: FormattingChange[] = []

    if (!options.importSort) {
      return { code, changed: false, changes }
    }

    const lines = code.split('\n')
    const importLines: { line: number; import: string }[] = []
    const importStartLine: number[] = []

    // Collect all import lines
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ') && !lines[i].includes('import type')) {
        importLines.push({ line: i, import: lines[i] })
        importStartLine.push(i)
      }
    }

    if (importLines.length < 2) {
      return { code, changed: false, changes }
    }

    // Group imports by type
    const nodeImports: typeof importLines = []
    const externalImports: typeof importLines = []
    const internalImports: typeof importLines = []
    const relativeImports: typeof importLines = []

    for (const imp of importLines) {
      const importPath = imp.import.match(/from\s+['"]([^'"]+)['"]/)?.[1] || ''
      if (importPath.startsWith('.')) {
        relativeImports.push(imp)
      } else if (importPath.startsWith('@/') || importPath.startsWith('~') || importPath.startsWith('#')) {
        internalImports.push(imp)
      } else if (importPath.startsWith('node:')) {
        nodeImports.push(imp)
      } else {
        externalImports.push(imp)
      }
    }

    // Sort each group
    const sorter = options.sortImportsCaseInsensitive
      ? (a: typeof importLines[0], b: typeof importLines[0]) =>
          a.import.toLowerCase().localeCompare(b.import.toLowerCase())
      : (a: typeof importLines[0], b: typeof importLines[0]) =>
          a.import.localeCompare(b.import)

    nodeImports.sort(sorter)
    externalImports.sort(sorter)
    internalImports.sort(sorter)
    relativeImports.sort(sorter)

    // Check if order changed
    const sortedImports = [...nodeImports, ...externalImports, ...internalImports, ...relativeImports]
    const orderChanged = importLines.some((imp, idx) => imp.line !== sortedImports[idx]?.line)

    if (orderChanged) {
      // Reorder import lines
      const newImportLines = sortedImports.map(imp => imp.import)

      for (let i = 0; i < importStartLine.length; i++) {
        const lineIdx = importStartLine[i]
        const oldLine = lines[lineIdx]
        const newLine = newImportLines[i]

        if (oldLine !== newLine) {
          changes.push({
            type: 'import_sort',
            line: lineIdx + 1,
            column: 1,
            description: 'Sort import order',
            before: oldLine,
            after: newLine
          })
          lines[lineIdx] = newLine
        }
      }
    }

    return {
      code: lines.join('\n'),
      changed: changes.length > 0,
      changes
    }
  }

  /**
   * Normalize spacing
   */
  private normalizeSpacing(code: string, options: FormattingOptions): { code: string; changed: boolean; changes: FormattingChange[] } {
    const changes: FormattingChange[] = []
    let result = code
    let offset = 0

    // Add space after keywords
    const keywordPattern = /\b(if|for|while|switch|catch)\(/g
    let match
    const originalCode = code

    while ((match = keywordPattern.exec(originalCode)) !== null) {
      const keyword = match[1]
      const insertPos = match.index + keyword.length + offset
      result = result.slice(0, insertPos) + ' ' + result.slice(insertPos)
      offset += 1

      changes.push({
        type: 'spacing',
        line: code.slice(0, match.index).split('\n').length,
        column: match.index - code.lastIndexOf('\n', match.index - 1) + keyword.length + 1,
        description: `Add space after '${keyword}' keyword`,
        before: `${keyword}(`,
        after: `${keyword} (`
      })
    }

    return {
      code: result,
      changed: changes.length > 0,
      changes
    }
  }

  /**
   * Normalize line endings
   */
  private normalizeLineEndings(code: string, options: FormattingOptions): { code: string; changed: boolean } {
    if (options.endOfLine === 'lf') {
      const normalized = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      return { code: normalized, changed: normalized !== code }
    } else if (options.endOfLine === 'crlf') {
      const normalized = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\r\n')
      return { code: normalized, changed: normalized !== code }
    }
    return { code, changed: false }
  }
}

// ============================================================================
// Quality Trend Tracker
// ============================================================================

/**
 * Quality Trend Tracker
 * Tracks code quality metrics over time
 */
class QualityTrendTracker {
  private dataPoints: Map<string, TrendDataPoint[]> = new Map()
  private maxDataPoints = 1000

  /**
   * Record a quality measurement
   */
  recordMeasurement(projectId: string, report: QualityReport): void {
    const point: TrendDataPoint = {
      timestamp: report.timestamp,
      overallScore: report.overallScore,
      styleScore: report.styleScore,
      lintScore: report.lintScore,
      formatScore: report.formatScore,
      complexityScore: report.complexityScore,
      issueCount: report.issues.length,
      fileCount: 1,
      linesOfCode: report.metadata.linesOfCode
    }

    if (!this.dataPoints.has(projectId)) {
      this.dataPoints.set(projectId, [])
    }

    const points = this.dataPoints.get(projectId)!
    points.push(point)

    // Trim old data points
    if (points.length > this.maxDataPoints) {
      points.splice(0, points.length - this.maxDataPoints)
    }
  }

  /**
   * Get trend analysis for a project
   */
  getTrend(projectId: string, period: 'daily' | 'weekly' | 'monthly' = 'weekly'): QualityTrend | null {
    const points = this.dataPoints.get(projectId)
    if (!points || points.length < 2) {
      return null
    }

    // Aggregate by period
    const aggregatedPoints = this.aggregateByPeriod(points, period)

    // Calculate metrics
    const metrics = this.calculateTrendMetrics(aggregatedPoints)

    // Generate predictions
    const predictions = this.generatePredictions(aggregatedPoints)

    // Generate insights
    const insights = this.generateInsights(aggregatedPoints, metrics)

    return {
      id: `trend_${projectId}_${Date.now().toString(36)}`,
      projectId,
      period,
      dataPoints: aggregatedPoints,
      metrics,
      predictions,
      insights
    }
  }

  /**
   * Aggregate data points by period
   */
  private aggregateByPeriod(points: TrendDataPoint[], period: 'daily' | 'weekly' | 'monthly'): TrendDataPoint[] {
    const aggregated: Map<string, TrendDataPoint> = new Map()

    for (const point of points) {
      const key = this.getPeriodKey(point.timestamp, period)

      if (!aggregated.has(key)) {
        aggregated.set(key, {
          timestamp: point.timestamp,
          overallScore: 0,
          styleScore: 0,
          lintScore: 0,
          formatScore: 0,
          complexityScore: 0,
          issueCount: 0,
          fileCount: 0,
          linesOfCode: 0
        })
      }

      const agg = aggregated.get(key)!
      agg.overallScore += point.overallScore
      agg.styleScore += point.styleScore
      agg.lintScore += point.lintScore
      agg.formatScore += point.formatScore
      agg.complexityScore += point.complexityScore
      agg.issueCount += point.issueCount
      agg.fileCount += point.fileCount
      agg.linesOfCode += point.linesOfCode
    }

    // Average the scores
    const result = Array.from(aggregated.values())
    for (const agg of result) {
      if (agg.fileCount > 1) {
        agg.overallScore = Math.round(agg.overallScore / agg.fileCount)
        agg.styleScore = Math.round(agg.styleScore / agg.fileCount)
        agg.lintScore = Math.round(agg.lintScore / agg.fileCount)
        agg.formatScore = Math.round(agg.formatScore / agg.fileCount)
        agg.complexityScore = Math.round(agg.complexityScore / agg.fileCount)
      }
    }

    return result
  }

  /**
   * Get period key for grouping
   */
  private getPeriodKey(date: Date, period: 'daily' | 'weekly' | 'monthly'): string {
    const d = new Date(date)
    if (period === 'daily') {
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
    } else if (period === 'weekly') {
      const week = this.getWeekNumber(d)
      return `${d.getFullYear()}-W${week.toString().padStart(2, '0')}`
    } else {
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`
    }
  }

  /**
   * Get week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  /**
   * Calculate trend metrics
   */
  private calculateTrendMetrics(points: TrendDataPoint[]): TrendMetrics {
    if (points.length < 2) {
      return {
        averageScore: points[0]?.overallScore || 0,
        scoreChange: 0,
        scoreTrend: 'stable',
        issueReduction: 0,
        topImprovements: [],
        topRegressions: [],
        velocity: 0
      }
    }

    const avgScore = Math.round(points.reduce((sum, p) => sum + p.overallScore, 0) / points.length)
    const scoreChange = points[points.length - 1].overallScore - points[0].overallScore
    const issueChange = points[0].issueCount - points[points.length - 1].issueCount

    // Determine trend
    let trend: 'improving' | 'declining' | 'stable' = 'stable'
    if (scoreChange > 5) trend = 'improving'
    else if (scoreChange < -5) trend = 'declining'

    // Calculate velocity (points per period)
    const periodsElapsed = points.length - 1
    const velocity = periodsElapsed > 0 ? scoreChange / periodsElapsed : 0

    // Find improvements and regressions
    const scoreChanges: { metric: string; change: number }[] = []
    const metrics = ['overallScore', 'styleScore', 'lintScore', 'formatScore', 'complexityScore'] as const

    for (const metric of metrics) {
      const change = points[points.length - 1][metric] - points[0][metric]
      scoreChanges.push({ metric, change })
    }

    const topImprovements = scoreChanges
      .filter(s => s.change > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, 3)
      .map(s => s.metric)

    const topRegressions = scoreChanges
      .filter(s => s.change < 0)
      .sort((a, b) => a.change - b.change)
      .slice(0, 3)
      .map(s => s.metric)

    return {
      averageScore: avgScore,
      scoreChange,
      scoreTrend: trend,
      issueReduction: issueChange,
      topImprovements,
      topRegressions,
      velocity
    }
  }

  /**
   * Generate predictions
   */
  private generatePredictions(points: TrendDataPoint[]): TrendPrediction[] {
    if (points.length < 3) return []

    const predictions: TrendPrediction[] = []
    const metrics = ['overallScore', 'styleScore', 'lintScore', 'formatScore'] as const

    for (const metric of metrics) {
      const values = points.slice(-10).map(p => p[metric as keyof TrendDataPoint] as number)
      const predicted = this.linearExtrapolate(values)
      const current = values[values.length - 1]

      if (Math.abs(predicted - current) > 2) {
        predictions.push({
          metric,
          currentValue: current,
          predictedValue: Math.round(predicted),
          confidence: Math.max(0.5, 1 - (values.length / 20)), // More points = lower confidence in extrapolation
          timeframe: 'next period',
          factors: this.identifyFactors(values)
        })
      }
    }

    return predictions
  }

  /**
   * Linear extrapolation
   */
  private linearExtrapolate(values: number[]): number {
    if (values.length < 2) return values[0] || 0

    // Simple linear regression
    const n = values.length
    const xMean = (n - 1) / 2
    const yMean = values.reduce((a, b) => a + b, 0) / n

    let numerator = 0
    let denominator = 0

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean)
      denominator += (i - xMean) ** 2
    }

    const slope = denominator !== 0 ? numerator / denominator : 0
    const intercept = yMean - slope * xMean

    // Predict next value
    return intercept + slope * n
  }

  /**
   * Identify factors affecting trend
   */
  private identifyFactors(values: number[]): string[] {
    const factors: string[] = []
    const trend = values[values.length - 1] - values[0]

    if (trend > 0) {
      factors.push('Consistent improvements in code quality')
      if (values.every((v, i) => i === 0 || v >= values[i - 1])) {
        factors.push('Steady improvement without regressions')
      }
    } else if (trend < 0) {
      factors.push('Recent changes may have introduced issues')
      if (values.every((v, i) => i === 0 || v <= values[i - 1])) {
        factors.push('Consistent decline requires attention')
      }
    } else {
      factors.push('Quality has remained stable')
    }

    return factors
  }

  /**
   * Generate insights
   */
  private generateInsights(points: TrendDataPoint[], metrics: TrendMetrics): TrendInsight[] {
    const insights: TrendInsight[] = []

    // Trend insight
    if (metrics.scoreTrend === 'improving') {
      insights.push({
        id: `insight_${insights.length}`,
        type: 'positive',
        title: 'Quality improving',
        description: `Code quality has improved by ${metrics.scoreChange} points`,
        impact: 'Better maintainability and fewer bugs',
        recommendation: 'Continue current practices and share learnings with team'
      })
    } else if (metrics.scoreTrend === 'declining') {
      insights.push({
        id: `insight_${insights.length}`,
        type: 'negative',
        title: 'Quality declining',
        description: `Code quality has declined by ${Math.abs(metrics.scoreChange)} points`,
        impact: 'May lead to increased technical debt',
        recommendation: 'Review recent changes and address quality issues'
      })
    }

    // Issue reduction insight
    if (metrics.issueReduction > 10) {
      insights.push({
        id: `insight_${insights.length}`,
        type: 'positive',
        title: 'Significant issue reduction',
        description: `Reduced ${metrics.issueReduction} code issues`,
        impact: 'Cleaner, more maintainable codebase'
      })
    }

    // Velocity insight
    if (Math.abs(metrics.velocity) > 2) {
      insights.push({
        id: `insight_${insights.length}`,
        type: metrics.velocity > 0 ? 'positive' : 'negative',
        title: metrics.velocity > 0 ? 'Rapid improvement' : 'Rapid decline',
        description: `Quality changing at ${Math.abs(metrics.velocity).toFixed(1)} points per period`,
        impact: metrics.velocity > 0 ? 'Fast progress' : 'Quick degradation',
        recommendation: metrics.velocity > 0 ? undefined : 'Address issues promptly'
      })
    }

    return insights
  }

  /**
   * Export trend data
   */
  exportData(projectId: string): string {
    const points = this.dataPoints.get(projectId) || []
    return JSON.stringify(points, null, 2)
  }

  /**
   * Import trend data
   */
  importData(projectId: string, data: string): void {
    try {
      const points = JSON.parse(data) as TrendDataPoint[]
      this.dataPoints.set(projectId, points.map(p => ({
        ...p,
        timestamp: new Date(p.timestamp)
      })))
    } catch (error) {
      console.error('Failed to import trend data:', error)
    }
  }

  /**
   * Clear trend data
   */
  clearData(projectId?: string): void {
    if (projectId) {
      this.dataPoints.delete(projectId)
    } else {
      this.dataPoints.clear()
    }
  }
}

// ============================================================================
// Code Quality Intelligence - Main Class
// ============================================================================

/**
 * Code Quality Intelligence
 * Main orchestrator for code quality analysis
 */
export class CodeQualityIntelligence {
  private styleAnalyzer: CodeStyleAnalyzer
  private lintGenerator: LintRuleGenerator
  private formatter: CodeFormatter
  private trendTracker: QualityTrendTracker

  constructor() {
    this.styleAnalyzer = new CodeStyleAnalyzer()
    this.lintGenerator = new LintRuleGenerator()
    this.formatter = new CodeFormatter()
    this.trendTracker = new QualityTrendTracker()
  }

  /**
   * Analyze code quality
   */
  async analyzeQuality(filePath: string): Promise<QualityReport>
  async analyzeQuality(code: string, filePath?: string): Promise<QualityReport>
  async analyzeQuality(codeOrPath: string, filePath?: string): Promise<QualityReport> {
    if (filePath) {
      // First argument is code
      return this.styleAnalyzer.analyzeCode(codeOrPath, filePath)
    } else {
      // First argument is file path
      return this.styleAnalyzer.analyzeFile(codeOrPath)
    }
  }

  /**
   * Analyze code string
   */
  analyzeCode(code: string, filePath: string = 'unknown'): QualityReport {
    return this.styleAnalyzer.analyzeCode(code, filePath)
  }

  /**
   * Analyze project directory
   */
  async analyzeProject(projectPath: string): Promise<{
    reports: QualityReport[]
    summary: {
      totalFiles: number
      averageScore: number
      totalIssues: number
      topIssues: { type: string; count: number }[]
      recommendations: string[]
    }
  }> {
    const files = await this.getProjectFiles(projectPath)
    const reports: QualityReport[] = []

    for (const file of files) {
      try {
        const report = await this.styleAnalyzer.analyzeFile(file)
        reports.push(report)

        // Record for trend tracking
        this.trendTracker.recordMeasurement(projectPath, report)
      } catch (error) {
        // Skip files that can't be analyzed
      }
    }

    // Calculate summary
    const totalFiles = reports.length
    const averageScore = reports.reduce((sum, r) => sum + r.overallScore, 0) / totalFiles || 0
    const totalIssues = reports.reduce((sum, r) => sum + r.issues.length, 0)

    // Count issue types
    const issueCounts = new Map<string, number>()
    for (const report of reports) {
      for (const issue of report.issues) {
        const count = issueCounts.get(issue.type) || 0
        issueCounts.set(issue.type, count + 1)
      }
    }

    const topIssues = Array.from(issueCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Generate recommendations
    const recommendations = this.generateProjectRecommendations(reports)

    return {
      reports,
      summary: {
        totalFiles,
        averageScore: Math.round(averageScore),
        totalIssues,
        topIssues,
        recommendations
      }
    }
  }

  /**
   * Generate lint configuration
   */
  generateLintConfig(options?: {
    typescript?: boolean
    react?: boolean
    node?: boolean
    strict?: boolean
  }): LintConfig {
    return this.lintGenerator.generateESLintConfig(options)
  }

  /**
   * Get lint rules
   */
  getLintRules(): LintRule[] {
    return this.lintGenerator.getAllRules()
  }

  /**
   * Add custom lint rule
   */
  addLintRule(rule: LintRule): void {
    this.lintGenerator.addRule(rule)
  }

  /**
   * Format code
   */
  formatCode(code: string, options?: Partial<FormattingOptions>): FormattingResult {
    return this.formatter.format(code, options)
  }

  /**
   * Format file
   */
  async formatFile(filePath: string, options?: Partial<FormattingOptions>): Promise<FormattingResult> {
    return this.formatter.formatFile(filePath, options)
  }

  /**
   * Get quality trend
   */
  getQualityTrend(projectId: string, period?: 'daily' | 'weekly' | 'monthly'): QualityTrend | null {
    return this.trendTracker.getTrend(projectId, period)
  }

  /**
   * Get trend data
   */
  getTrendData(projectId: string): TrendDataPoint[] {
    return this.trendTracker['dataPoints'].get(projectId) || []
  }

  /**
   * Generate quality report
   */
  generateReport(report: QualityReport): string {
    const lines: string[] = [
      `# Code Quality Report`,
      ``,
      `**File**: ${report.filePath}`,
      `**Timestamp**: ${report.timestamp.toISOString()}`,
      `**Language**: ${report.metadata.language}`,
      `**Lines of Code**: ${report.metadata.linesOfCode}`,
      ``,
      `## Scores`,
      ``,
      `| Metric | Score |`,
      `|--------|-------|`,
      `| Overall | ${report.overallScore}/100 |`,
      `| Style | ${report.styleScore}/100 |`,
      `| Lint | ${report.lintScore}/100 |`,
      `| Format | ${report.formatScore}/100 |`,
      `| Complexity | ${report.complexityScore}/100 |`,
      ``,
      `## Issues (${report.issues.length})`,
      ``
    ]

    // Group issues by severity
    const errors = report.issues.filter(i => i.severity === 'error')
    const warnings = report.issues.filter(i => i.severity === 'warning')
    const infos = report.issues.filter(i => i.severity === 'info')

    if (errors.length > 0) {
      lines.push(`### Errors (${errors.length})`)
      lines.push('')
      for (const issue of errors) {
        lines.push(`- [Line ${issue.line}] ${issue.message}`)
      }
      lines.push('')
    }

    if (warnings.length > 0) {
      lines.push(`### Warnings (${warnings.length})`)
      lines.push('')
      for (const issue of warnings.slice(0, 20)) {
        lines.push(`- [Line ${issue.line}] ${issue.message}`)
      }
      if (warnings.length > 20) {
        lines.push(`- ... and ${warnings.length - 20} more`)
      }
      lines.push('')
    }

    if (infos.length > 0) {
      lines.push(`### Info (${infos.length})`)
      lines.push('')
      lines.push(`${infos.length} informational messages`)
      lines.push('')
    }

    if (report.suggestions.length > 0) {
      lines.push(`## Suggestions`)
      lines.push('')
      for (const suggestion of report.suggestions) {
        lines.push(`### [${suggestion.priority.toUpperCase()}] ${suggestion.category}`)
        lines.push(`- **Description**: ${suggestion.description}`)
        lines.push(`- **Impact**: ${suggestion.impact}`)
        lines.push(`- **Effort**: ${suggestion.effort}`)
        lines.push('')
      }
    }

    return lines.join('\n')
  }

  /**
   * Get project files
   */
  private async getProjectFiles(projectPath: string): Promise<string[]> {
    const files: string[] = []

    const scan = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          if (!['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(entry.name)) {
            await scan(fullPath)
          }
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          files.push(fullPath)
        }
      }
    }

    await scan(projectPath)
    return files
  }

  /**
   * Generate project recommendations
   */
  private generateProjectRecommendations(reports: QualityReport[]): string[] {
    const recommendations: string[] = []

    // Check average score
    const avgScore = reports.reduce((sum, r) => sum + r.overallScore, 0) / reports.length
    if (avgScore < 70) {
      recommendations.push('Overall code quality is below target. Focus on addressing high-priority issues.')
    }

    // Check for common issues
    const issueCounts = new Map<string, number>()
    for (const report of reports) {
      for (const issue of report.issues) {
        const count = issueCounts.get(issue.type) || 0
        issueCounts.set(issue.type, count + 1)
      }
    }

    if ((issueCounts.get('any_type') || 0) > 5) {
      recommendations.push('Replace `any` types with specific types for better type safety.')
    }

    if ((issueCounts.get('console_statement') || 0) > 10) {
      recommendations.push('Replace console statements with a proper logging library.')
    }

    if ((issueCounts.get('unused_import') || 0) > 10) {
      recommendations.push('Clean up unused imports to improve code clarity.')
    }

    if ((issueCounts.get('naming_convention') || 0) > 20) {
      recommendations.push('Establish consistent naming conventions across the codebase.')
    }

    if ((issueCounts.get('missing_return_type') || 0) > 15) {
      recommendations.push('Add explicit return type annotations to exported functions.')
    }

    // Format recommendations
    const lowFormatScore = reports.filter(r => r.formatScore < 80).length
    if (lowFormatScore > reports.length * 0.3) {
      recommendations.push('Run a code formatter (e.g., Prettier) to standardize code style.')
    }

    return recommendations
  }
}

// ============================================================================
// Singleton and Convenience Functions
// ============================================================================

let codeQualityInstance: CodeQualityIntelligence | null = null

/**
 * Get Code Quality Intelligence singleton
 */
export function getCodeQualityIntelligence(): CodeQualityIntelligence {
  if (!codeQualityInstance) {
    codeQualityInstance = new CodeQualityIntelligence()
  }
  return codeQualityInstance
}

/**
 * Analyze quality convenience function
 */
export async function analyzeQuality(
  codeOrPath: string,
  filePath?: string
): Promise<QualityReport> {
  const instance = getCodeQualityIntelligence()
  if (filePath) {
    return instance.analyzeCode(codeOrPath, filePath)
  }
  return instance.analyzeQuality(codeOrPath)
}
