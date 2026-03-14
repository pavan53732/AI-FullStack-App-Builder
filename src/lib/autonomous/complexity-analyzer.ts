/**
 * Code Complexity Analyzer
 * 
 * Analyzes code complexity:
 * - Cyclomatic complexity
 * - Cognitive complexity
 * - Halstead metrics
 * - Maintainability index
 * - Code duplication
 * - Dead code detection
 */

import fs from 'fs/promises'
import path from 'path'

// Types
export interface ComplexityMetrics {
  file: string
  linesOfCode: number
  logicalLinesOfCode: number
  cyclomaticComplexity: number
  cognitiveComplexity: number
  maintainabilityIndex: number
  halstead: HalsteadMetrics
  nestingDepth: number
  functionCount: number
  classCount: number
  averageFunctionLength: number
  maxFunctionLength: number
  commentRatio: number
  duplicationScore: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  issues: ComplexityIssue[]
}

export interface HalsteadMetrics {
  vocabulary: number      // Unique operators + operands
  length: number          // Total operators + operands
  volume: number          // length * log2(vocabulary)
  difficulty: number      // (uniqueOperators/2) * (totalOperands/uniqueOperands)
  effort: number          // difficulty * volume
  time: number            // effort / 18 (seconds)
  bugs: number            // volume / 3000
}

export interface ComplexityIssue {
  type: 'high_complexity' | 'deep_nesting' | 'long_function' | 'many_parameters' | 'duplication' | 'dead_code'
  severity: 'info' | 'warning' | 'error'
  message: string
  line?: number
  suggestion: string
}

export interface FunctionComplexity {
  name: string
  startLine: number
  endLine: number
  linesOfCode: number
  cyclomaticComplexity: number
  cognitiveComplexity: number
  parameterCount: number
  nestingDepth: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
}

export interface ProjectComplexityReport {
  totalFiles: number
  totalLinesOfCode: number
  averageComplexity: number
  averageMaintainability: number
  filesByGrade: Record<string, number>
  topComplexFiles: ComplexityMetrics[]
  topComplexFunctions: FunctionComplexity[]
  duplicatedBlocks: DuplicatedBlock[]
  deadCodeLocations: DeadCodeLocation[]
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  recommendations: string[]
}

export interface DuplicatedBlock {
  hash: string
  content: string
  locations: { file: string; line: number }[]
  lines: number
}

export interface DeadCodeLocation {
  file: string
  type: 'unused_import' | 'unused_variable' | 'unused_function' | 'unreachable_code'
  name: string
  line: number
  suggestion: string
}

// Operators for Halstead metrics
const OPERATORS = new Set([
  '=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '>>>=', '&=', '|=', '^=',
  '+', '-', '*', '/', '%', '**', '++', '--',
  '==', '!=', '===', '!==', '>', '<', '>=', '<=',
  '&&', '||', '!', '??', '?',
  '&', '|', '^', '~', '<<', '>>', '>>>',
  'new', 'delete', 'typeof', 'instanceof', 'in', 'void',
  'await', 'yield',
  '.', '?.', '[', '(', '{',
  '=>', '...', ':', ';', ','
])

const OPERANDS = new Set([
  'identifier', 'literal', 'string', 'number', 'boolean', 'null', 'undefined'
])

/**
 * Code Complexity Analyzer
 */
export class CodeComplexityAnalyzer {
  private duplicationThreshold = 50  // minimum characters for duplication
  private maxFunctionLines = 50
  private maxCyclomaticComplexity = 10
  private maxNestingDepth = 4
  private maxParameters = 5

  /**
   * Analyze a single file
   */
  async analyzeFile(filePath: string): Promise<ComplexityMetrics> {
    const content = await fs.readFile(filePath, 'utf-8')
    return this.analyzeCode(content, filePath)
  }

  /**
   * Analyze code string
   */
  analyzeCode(code: string, filePath: string = 'unknown'): ComplexityMetrics {
    const lines = code.split('\n')
    const linesOfCode = lines.length
    const logicalLinesOfCode = this.countLogicalLines(code)
    
    // Calculate cyclomatic complexity
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(code)
    
    // Calculate cognitive complexity
    const cognitiveComplexity = this.calculateCognitiveComplexity(code)
    
    // Calculate Halstead metrics
    const halstead = this.calculateHalsteadMetrics(code)
    
    // Calculate nesting depth
    const nestingDepth = this.calculateMaxNestingDepth(code)
    
    // Count functions and classes
    const { functionCount, classCount } = this.countFunctionsAndClasses(code)
    
    // Calculate function lengths
    const { avgLength, maxLength } = this.calculateFunctionLengths(code)
    
    // Calculate comment ratio
    const commentRatio = this.calculateCommentRatio(code)
    
    // Calculate duplication
    const duplicationScore = this.calculateDuplicationScore(code)
    
    // Calculate maintainability index
    const maintainabilityIndex = this.calculateMaintainabilityIndex(
      cyclomaticComplexity,
      halstead.volume,
      logicalLinesOfCode
    )
    
    // Find issues
    const issues = this.findComplexityIssues(code, {
      cyclomaticComplexity,
      nestingDepth,
      avgLength,
      maxLength
    })
    
    // Calculate grade
    const grade = this.calculateGrade(cyclomaticComplexity, cognitiveComplexity, maintainabilityIndex)

    return {
      file: filePath,
      linesOfCode,
      logicalLinesOfCode,
      cyclomaticComplexity,
      cognitiveComplexity,
      maintainabilityIndex,
      halstead,
      nestingDepth,
      functionCount,
      classCount,
      averageFunctionLength: avgLength,
      maxFunctionLength: maxLength,
      commentRatio,
      duplicationScore,
      grade,
      issues
    }
  }

  /**
   * Analyze entire project
   */
  async analyzeProject(projectPath: string): Promise<ProjectComplexityReport> {
    const files = await this.getProjectFiles(projectPath)
    const metrics: ComplexityMetrics[] = []
    const allFunctions: FunctionComplexity[] = []
    const duplicatedBlocks: DuplicatedBlock[] = []
    const deadCodeLocations: DeadCodeLocation[] = []

    for (const file of files) {
      try {
        const fileMetrics = await this.analyzeFile(file)
        metrics.push(fileMetrics)
        
        // Extract function complexities
        const functions = await this.analyzeFunctions(file)
        allFunctions.push(...functions)
        
        // Find duplicated code
        const duplications = await this.findDuplications(file, files)
        duplicatedBlocks.push(...duplications)
        
        // Find dead code
        const deadCode = await this.findDeadCode(file)
        deadCodeLocations.push(...deadCode)
      } catch (error) {
        // Skip files that can't be analyzed
      }
    }

    // Calculate aggregates
    const totalLinesOfCode = metrics.reduce((sum, m) => sum + m.linesOfCode, 0)
    const averageComplexity = metrics.reduce((sum, m) => sum + m.cyclomaticComplexity, 0) / metrics.length || 0
    const averageMaintainability = metrics.reduce((sum, m) => sum + m.maintainabilityIndex, 0) / metrics.length || 0

    // Count by grade
    const filesByGrade: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }
    for (const m of metrics) {
      filesByGrade[m.grade]++
    }

    // Top complex files
    const topComplexFiles = [...metrics]
      .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)
      .slice(0, 10)

    // Top complex functions
    const topComplexFunctions = [...allFunctions]
      .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)
      .slice(0, 20)

    // Overall grade
    const overallGrade = this.calculateOverallGrade(averageComplexity, averageMaintainability)

    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics, allFunctions, duplicatedBlocks, deadCodeLocations)

    return {
      totalFiles: files.length,
      totalLinesOfCode,
      averageComplexity,
      averageMaintainability,
      filesByGrade,
      topComplexFiles,
      topComplexFunctions,
      duplicatedBlocks,
      deadCodeLocations,
      overallGrade,
      recommendations
    }
  }

  /**
   * Analyze functions in a file
   */
  private async analyzeFunctions(filePath: string): Promise<FunctionComplexity[]> {
    const content = await fs.readFile(filePath, 'utf-8')
    const functions: FunctionComplexity[] = []
    
    // Match function declarations
    const functionPatterns = [
      /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:function|\([^)]*\)\s*=>))/g,
      /(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/g
    ]
    
    for (const pattern of functionPatterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1] || match[2] || 'anonymous'
        const startLine = content.substring(0, match.index).split('\n').length
        
        // Find function body
        const bodyStart = match.index + match[0].length
        const body = this.extractFunctionBody(content.substring(bodyStart))
        const endLine = startLine + body.split('\n').length
        
        const linesOfCode = body.split('\n').length
        const cyclomaticComplexity = this.calculateCyclomaticComplexity(body)
        const cognitiveComplexity = this.calculateCognitiveComplexity(body)
        const parameterCount = (match[0].match(/,/g) || []).length + 1
        const nestingDepth = this.calculateMaxNestingDepth(body)
        
        functions.push({
          name,
          startLine,
          endLine,
          linesOfCode,
          cyclomaticComplexity,
          cognitiveComplexity,
          parameterCount,
          nestingDepth,
          grade: this.calculateFunctionGrade(cyclomaticComplexity, linesOfCode)
        })
      }
    }
    
    return functions
  }

  /**
   * Extract function body (balanced braces)
   */
  private extractFunctionBody(code: string): string {
    let depth = 0
    let body = ''
    
    for (const char of code) {
      if (char === '{') depth++
      if (char === '}') depth--
      if (depth > 0) body += char
      if (depth === 0 && body.length > 0) break
    }
    
    return body
  }

  /**
   * Count logical lines of code
   */
  private countLogicalLines(code: string): number {
    const lines = code.split('\n')
    let count = 0
    
    for (const line of lines) {
      const trimmed = line.trim()
      // Skip empty lines and comments
      if (trimmed.length === 0 || 
          trimmed.startsWith('//') || 
          trimmed.startsWith('/*') ||
          trimmed.startsWith('*')) {
        continue
      }
      count++
    }
    
    return count
  }

  /**
   * Calculate cyclomatic complexity
   * McCabe's cyclomatic complexity: M = E - N + 2P
   * Simplified: count decision points + 1
   */
  private calculateCyclomaticComplexity(code: string): number {
    let complexity = 1  // Base complexity
    
    // Decision points
    const decisionPatterns = [
      /\bif\b/g,
      /\belse\s+if\b/g,
      /\bfor\b/g,
      /\bwhile\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\?\s*:/g,           // Ternary
      /&&/g,               // Logical AND
      /\|\|/g,             // Logical OR
      /\?\?/g              // Nullish coalescing
    ]
    
    for (const pattern of decisionPatterns) {
      const matches = code.match(pattern)
      if (matches) {
        complexity += matches.length
      }
    }
    
    return complexity
  }

  /**
   * Calculate cognitive complexity
   * Adds weight for nesting
   */
  private calculateCognitiveComplexity(code: string): number {
    let complexity = 0
    let nestingLevel = 0
    
    const lines = code.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      // Increase nesting
      if (trimmed.includes('{')) {
        nestingLevel += (trimmed.match(/{/g) || []).length
      }
      
      // Decrease nesting
      if (trimmed.includes('}')) {
        nestingLevel -= (trimmed.match(/}/g) || []).length
        nestingLevel = Math.max(0, nestingLevel)
      }
      
      // Add complexity for control structures
      const controlPatterns = [
        /\bif\b/,
        /\belse\s+if\b/,
        /\bfor\b/,
        /\bwhile\b/,
        /\bswitch\b/,
        /\bcatch\b/
      ]
      
      for (const pattern of controlPatterns) {
        if (pattern.test(trimmed)) {
          complexity += 1 + nestingLevel  // Add nesting penalty
        }
      }
      
      // Add for logical operators
      if (/&&|\|\||\?\?/.test(trimmed)) {
        complexity += 1
      }
    }
    
    return complexity
  }

  /**
   * Calculate Halstead metrics
   */
  private calculateHalsteadMetrics(code: string): HalsteadMetrics {
    // Simplified token counting
    const tokens = this.tokenize(code)
    
    const uniqueOperators = new Set<string>()
    const uniqueOperands = new Set<string>()
    let totalOperators = 0
    let totalOperands = 0
    
    for (const token of tokens) {
      if (OPERATORS.has(token.value)) {
        uniqueOperators.add(token.value)
        totalOperators++
      } else if (token.type === 'identifier' || token.type === 'literal') {
        uniqueOperands.add(token.value)
        totalOperands++
      }
    }
    
    const vocabulary = uniqueOperators.size + uniqueOperands.size
    const length = totalOperators + totalOperands
    const volume = vocabulary > 0 ? length * Math.log2(vocabulary) : 0
    const difficulty = uniqueOperands.size > 0 
      ? (uniqueOperators.size / 2) * (totalOperands / uniqueOperands.size) 
      : 0
    const effort = difficulty * volume
    const time = effort / 18
    const bugs = volume / 3000
    
    return {
      vocabulary,
      length,
      volume,
      difficulty,
      effort,
      time,
      bugs
    }
  }

  /**
   * Simple tokenizer
   */
  private tokenize(code: string): { type: string; value: string }[] {
    const tokens: { type: string; value: string }[] = []
    
    // Match identifiers and literals
    const patterns = [
      { pattern: /[a-zA-Z_$][a-zA-Z0-9_$]*/g, type: 'identifier' },
      { pattern: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`([^`\\]|\\.)*`/g, type: 'literal' },
      { pattern: /\d+\.?\d*/g, type: 'literal' },
      { pattern: /===|!==|==|!=|<=|>=|=>|&&|\|\||\?\?|\+\+|--|<<=|>>=|>>>=|\.\.\.|[+\-*/%=<>!&|^~?:;,.\[\]{}()]/g, type: 'operator' }
    ]
    
    for (const { pattern, type } of patterns) {
      let match
      const regex = new RegExp(pattern.source, pattern.flags)
      while ((match = regex.exec(code)) !== null) {
        tokens.push({ type, value: match[0] })
      }
    }
    
    return tokens
  }

  /**
   * Calculate max nesting depth
   */
  private calculateMaxNestingDepth(code: string): number {
    let maxDepth = 0
    let currentDepth = 0
    
    for (const char of code) {
      if (char === '{') {
        currentDepth++
        maxDepth = Math.max(maxDepth, currentDepth)
      } else if (char === '}') {
        currentDepth--
      }
    }
    
    return maxDepth
  }

  /**
   * Count functions and classes
   */
  private countFunctionsAndClasses(code: string): { functionCount: number; classCount: number } {
    const functionMatches = code.match(/(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?(?:function|\()/g)
    const classMatches = code.match(/\bclass\s+\w+/g)
    
    return {
      functionCount: functionMatches ? functionMatches.length : 0,
      classCount: classMatches ? classMatches.length : 0
    }
  }

  /**
   * Calculate function lengths
   */
  private calculateFunctionLengths(code: string): { avgLength: number; maxLength: number } {
    const functionBodies: string[] = []
    
    // Extract function bodies
    const pattern = /(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?(?:function|\([^)]*\)\s*=>))[^{]*\{/g
    let match
    
    while ((match = pattern.exec(code)) !== null) {
      const bodyStart = match.index + match[0].length
      const body = this.extractFunctionBody(code.substring(bodyStart))
      functionBodies.push(body)
    }
    
    if (functionBodies.length === 0) {
      return { avgLength: 0, maxLength: 0 }
    }
    
    const lengths = functionBodies.map(b => b.split('\n').length)
    
    return {
      avgLength: Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length),
      maxLength: Math.max(...lengths)
    }
  }

  /**
   * Calculate comment ratio
   */
  private calculateCommentRatio(code: string): number {
    const lines = code.split('\n')
    let commentLines = 0
    let codeLines = 0
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        commentLines++
      } else if (trimmed.length > 0) {
        codeLines++
      }
    }
    
    return codeLines > 0 ? commentLines / codeLines : 0
  }

  /**
   * Calculate duplication score
   */
  private calculateDuplicationScore(code: string): number {
    const lines = code.split('\n')
    const seen = new Map<string, number>()
    let duplicatedLines = 0
    
    for (const line of lines) {
      const normalized = line.trim().replace(/\s+/g, ' ')
      if (normalized.length < 10) continue
      
      if (seen.has(normalized)) {
        duplicatedLines++
      } else {
        seen.set(normalized, 1)
      }
    }
    
    return lines.length > 0 ? duplicatedLines / lines.length : 0
  }

  /**
   * Calculate maintainability index
   * MI = 171 - 5.2 * ln(V) - 0.23 * G - 16.2 * ln(LOC)
   * Where V = Halstead Volume, G = Cyclomatic Complexity, LOC = Lines of Code
   */
  private calculateMaintainabilityIndex(
    cyclomaticComplexity: number,
    halsteadVolume: number,
    linesOfCode: number
  ): number {
    if (linesOfCode === 0) return 100
    
    const ln = Math.log
    let mi = 171 - 5.2 * ln(halsteadVolume + 1) - 0.23 * cyclomaticComplexity - 16.2 * ln(linesOfCode)
    
    // Normalize to 0-100
    mi = Math.max(0, Math.min(100, mi))
    
    return Math.round(mi)
  }

  /**
   * Find complexity issues
   */
  private findComplexityIssues(
    code: string,
    metrics: { cyclomaticComplexity: number; nestingDepth: number; avgLength: number; maxLength: number }
  ): ComplexityIssue[] {
    const issues: ComplexityIssue[] = []
    
    if (metrics.cyclomaticComplexity > this.maxCyclomaticComplexity) {
      issues.push({
        type: 'high_complexity',
        severity: 'warning',
        message: `High cyclomatic complexity (${metrics.cyclomaticComplexity}). Consider breaking into smaller functions.`,
        suggestion: 'Extract complex logic into separate functions'
      })
    }
    
    if (metrics.nestingDepth > this.maxNestingDepth) {
      issues.push({
        type: 'deep_nesting',
        severity: 'warning',
        message: `Deep nesting detected (${metrics.nestingDepth} levels). Consider early returns or extracting functions.`,
        suggestion: 'Use guard clauses or extract nested logic'
      })
    }
    
    if (metrics.maxLength > this.maxFunctionLines) {
      issues.push({
        type: 'long_function',
        severity: 'info',
        message: `Long function detected (${metrics.maxLength} lines). Consider splitting.`,
        suggestion: 'Break into smaller, focused functions'
      })
    }
    
    return issues
  }

  /**
   * Calculate grade
   */
  private calculateGrade(
    cyclomatic: number,
    cognitive: number,
    maintainability: number
  ): 'A' | 'B' | 'C' | 'D' | 'F' {
    const score = (maintainability * 0.4) + 
                  ((10 - Math.min(cyclomatic, 10)) * 3) + 
                  ((10 - Math.min(cognitive, 10)) * 3)
    
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  /**
   * Calculate function grade
   */
  private calculateFunctionGrade(complexity: number, lines: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    let score = 100
    score -= Math.min(complexity, 20) * 3
    score -= Math.max(0, lines - 30) * 0.5
    
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  /**
   * Calculate overall grade
   */
  private calculateOverallGrade(avgComplexity: number, avgMaintainability: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    return this.calculateGrade(avgComplexity, avgComplexity, avgMaintainability)
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
          if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
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
   * Find duplicated code blocks
   */
  private async findDuplications(filePath: string, allFiles: string[]): Promise<DuplicatedBlock[]> {
    // Simplified duplication detection
    const content = await fs.readFile(filePath, 'utf-8')
    const blocks: DuplicatedBlock[] = []
    
    // Look for repeated patterns
    const lines = content.split('\n')
    const chunks: Map<string, { file: string; line: number }[]> = new Map()
    
    for (let i = 0; i < lines.length - 5; i++) {
      const chunk = lines.slice(i, i + 5).join('\n')
      const hash = this.simpleHash(chunk)
      
      if (!chunks.has(hash)) {
        chunks.set(hash, [])
      }
      chunks.get(hash)!.push({ file: filePath, line: i + 1 })
    }
    
    // Find duplicates
    for (const [hash, locations] of chunks) {
      if (locations.length > 1) {
        blocks.push({
          hash,
          content: lines.slice(locations[0].line - 1, locations[0].line + 4).join('\n'),
          locations,
          lines: 5
        })
      }
    }
    
    return blocks
  }

  /**
   * Find dead code
   */
  private async findDeadCode(filePath: string): Promise<DeadCodeLocation[]> {
    const content = await fs.readFile(filePath, 'utf-8')
    const deadCode: DeadCodeLocation[] = []
    
    // Find unused imports (simplified)
    const importPattern = /import\s+(?:\{([^}]+)\}|(\w+))\s+from/g
    let match
    
    while ((match = importPattern.exec(content)) !== null) {
      const imports = match[1] ? match[1].split(',').map(s => s.trim()) : [match[2]]
      
      for (const imp of imports) {
        if (imp && !content.includes(imp.split(' as ')[0], match.index + match[0].length)) {
          deadCode.push({
            file: filePath,
            type: 'unused_import',
            name: imp,
            line: content.substring(0, match.index).split('\n').length,
            suggestion: `Remove unused import: ${imp}`
          })
        }
      }
    }
    
    return deadCode.slice(0, 10)  // Limit results
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(16)
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    metrics: ComplexityMetrics[],
    functions: FunctionComplexity[],
    duplications: DuplicatedBlock[],
    deadCode: DeadCodeLocation[]
  ): string[] {
    const recommendations: string[] = []
    
    // High complexity files
    const highComplexityFiles = metrics.filter(m => m.cyclomaticComplexity > 15)
    if (highComplexityFiles.length > 0) {
      recommendations.push(`Consider refactoring ${highComplexityFiles.length} files with high complexity`)
    }
    
    // Long functions
    const longFunctions = functions.filter(f => f.linesOfCode > 50)
    if (longFunctions.length > 0) {
      recommendations.push(`Break down ${longFunctions.length} functions that exceed 50 lines`)
    }
    
    // Deep nesting
    const deeplyNested = functions.filter(f => f.nestingDepth > 4)
    if (deeplyNested.length > 0) {
      recommendations.push(`Reduce nesting in ${deeplyNested.length} functions using guard clauses`)
    }
    
    // Duplications
    if (duplications.length > 5) {
      recommendations.push(`Extract duplicated code into reusable functions (${duplications.length} duplications found)`)
    }
    
    // Dead code
    if (deadCode.length > 0) {
      recommendations.push(`Remove ${deadCode.length} unused imports/variables`)
    }
    
    // Comment ratio
    const lowCommentFiles = metrics.filter(m => m.commentRatio < 0.1)
    if (lowCommentFiles.length > metrics.length * 0.5) {
      recommendations.push('Add more code comments for better documentation')
    }
    
    return recommendations
  }
}

// Singleton
let analyzerInstance: CodeComplexityAnalyzer | null = null

export function getComplexityAnalyzer(): CodeComplexityAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new CodeComplexityAnalyzer()
  }
  return analyzerInstance
}

/**
 * Quick analysis function
 */
export async function analyzeComplexity(code: string, filePath?: string): Promise<ComplexityMetrics> {
  const analyzer = getComplexityAnalyzer()
  return analyzer.analyzeCode(code, filePath)
}
