/**
 * Code Query Engine
 * 
 * Advanced codebase querying with:
 * - Natural language queries
 * - Pattern-based search
 * - Structural queries
 * - Code relationships
 * 
 * Features:
 * - Query by function/class name
 * - Query by code pattern
 * - Query by dependency
 * - Query by complexity
 * - Query by author/time
 */

import ZAI from 'z-ai-web-dev-sdk'
import { EventEmitter } from 'events'
import fs from 'fs/promises'
import path from 'path'

// Types
export interface CodeQuery {
  id: string
  type: QueryType
  pattern: string
  filters: QueryFilter[]
  options: QueryOptions
  createdAt: string
}

export type QueryType = 
  | 'function_name'
  | 'class_name'
  | 'pattern'
  | 'dependency'
  | 'usage'
  | 'complexity'
  | 'author'
  | 'recent_changes'
  | 'similar_code'
  | 'natural_language'

export interface QueryFilter {
  type: 'file_pattern' | 'module' | 'complexity' | 'author' | 'date_range' | 'custom'
  value: any
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'regex'
}

export interface QueryOptions {
  maxResults: number
  includeContext: boolean
  contextLines: number
  sortBy: 'relevance' | 'complexity' | 'recency' | 'name'
  sortOrder: 'asc' | 'desc'
}

export interface QueryResult {
  queryId: string
  matches: QueryMatch[]
  totalMatches: number
  executionTime: number
  suggestions: string[]
}

export interface QueryMatch {
  id: string
  file: string
  line: number
  column: number
  code: string
  context: string
  relevance: number
  metadata: MatchMetadata
}

export interface MatchMetadata {
  type: 'function' | 'class' | 'variable' | 'import' | 'export' | 'comment' | 'other'
  name: string
  complexity?: number
  dependencies?: string[]
  dependents?: string[]
  lastModified?: string
}

export interface QueryHistory {
  queries: CodeQuery[]
  results: Map<string, QueryResult>
  frequentPatterns: Map<string, number>
}

export interface QuerySuggestion {
  type: 'refinement' | 'alternative' | 'expansion'
  query: string
  reason: string
  estimatedResults: number
}

/**
 * Code Query Engine
 * 
 * Main class for querying codebase
 */
export class CodeQueryEngine extends EventEmitter {
  private zai: any = null
  private index: Map<string, FileIndex> = new Map()
  private functionIndex: Map<string, FunctionIndex> = new Map()
  private classIndex: Map<string, ClassIndex> = new Map()
  private dependencyGraph: Map<string, Set<string>> = new Map()
  private queryHistory: QueryHistory
  private projectRoot: string

  constructor(projectRoot?: string) {
    super()
    this.projectRoot = projectRoot || process.cwd()
    this.queryHistory = {
      queries: [],
      results: new Map(),
      frequentPatterns: new Map()
    }
  }

  /**
   * Initialize the query engine
   */
  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
    await this.buildIndex()
  }

  /**
   * Execute a code query
   */
  async query(input: string | CodeQuery): Promise<QueryResult> {
    const startTime = Date.now()

    // Parse input if string
    const query = typeof input === 'string' 
      ? await this.parseQuery(input)
      : input

    // Record query
    this.queryHistory.queries.push(query)

    // Execute based on type
    let matches: QueryMatch[] = []
    switch (query.type) {
      case 'function_name':
        matches = await this.queryByFunctionName(query)
        break
      case 'class_name':
        matches = await this.queryByClassName(query)
        break
      case 'pattern':
        matches = await this.queryByPattern(query)
        break
      case 'dependency':
        matches = await this.queryByDependency(query)
        break
      case 'usage':
        matches = await this.queryByUsage(query)
        break
      case 'complexity':
        matches = await this.queryByComplexity(query)
        break
      case 'natural_language':
        matches = await this.queryByNaturalLanguage(query)
        break
      default:
        matches = await this.queryByPattern(query)
    }

    // Apply filters
    matches = this.applyFilters(matches, query.filters)

    // Sort results
    matches = this.sortResults(matches, query.options)

    // Limit results
    const totalMatches = matches.length
    matches = matches.slice(0, query.options.maxResults)

    // Add context
    if (query.options.includeContext) {
      matches = await this.addContext(matches, query.options.contextLines)
    }

    // Generate suggestions
    const suggestions = await this.generateSuggestions(query, matches)

    const result: QueryResult = {
      queryId: query.id,
      matches,
      totalMatches,
      executionTime: Date.now() - startTime,
      suggestions
    }

    // Store result
    this.queryHistory.results.set(query.id, result)

    // Update frequent patterns
    this.updateFrequentPatterns(query)

    this.emit('query_executed', { query, result })
    return result
  }

  /**
   * Parse natural language query
   */
  private async parseQuery(input: string): Promise<CodeQuery> {
    // Try to determine query type from input
    const type = this.inferQueryType(input)
    
    // Extract pattern
    const pattern = await this.extractPattern(input, type)

    return {
      id: `query-${Date.now().toString(36)}`,
      type,
      pattern,
      filters: [],
      options: {
        maxResults: 50,
        includeContext: true,
        contextLines: 3,
        sortBy: 'relevance',
        sortOrder: 'desc'
      },
      createdAt: new Date().toISOString()
    }
  }

  /**
   * Infer query type from input
   */
  private inferQueryType(input: string): QueryType {
    const lower = input.toLowerCase()
    
    if (lower.includes('function') || lower.includes('method')) {
      return 'function_name'
    }
    if (lower.includes('class') || lower.includes('component')) {
      return 'class_name'
    }
    if (lower.includes('import') || lower.includes('depend')) {
      return 'dependency'
    }
    if (lower.includes('use') || lower.includes('call')) {
      return 'usage'
    }
    if (lower.includes('complex') || lower.includes('simple')) {
      return 'complexity'
    }
    if (lower.includes('similar') || lower.includes('like')) {
      return 'similar_code'
    }
    
    return 'natural_language'
  }

  /**
   * Extract pattern from input
   */
  private async extractPattern(input: string, type: QueryType): Promise<string> {
    // Remove common words
    const stopWords = ['find', 'show', 'get', 'all', 'the', 'a', 'an', 'where', 'which', 'that']
    let pattern = input.toLowerCase()
    
    for (const word of stopWords) {
      pattern = pattern.replace(new RegExp(`\\b${word}\\b`, 'g'), '')
    }
    
    // Extract identifiers (camelCase, PascalCase, snake_case)
    const identifiers = pattern.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || []
    
    if (identifiers.length > 0) {
      return identifiers.join('|')
    }
    
    return pattern.trim()
  }

  /**
   * Query by function name
   */
  private async queryByFunctionName(query: CodeQuery): Promise<QueryMatch[]> {
    const matches: QueryMatch[] = []
    const pattern = new RegExp(query.pattern, 'i')

    for (const [key, func] of this.functionIndex) {
      if (pattern.test(func.name)) {
        matches.push({
          id: `match-${Date.now().toString(36)}-${matches.length}`,
          file: func.file,
          line: func.line,
          column: func.column,
          code: func.code,
          context: '',
          relevance: this.calculateRelevance(func.name, query.pattern),
          metadata: {
            type: 'function',
            name: func.name,
            complexity: func.complexity,
            dependencies: func.dependencies,
            dependents: func.dependents
          }
        })
      }
    }

    return matches
  }

  /**
   * Query by class name
   */
  private async queryByClassName(query: CodeQuery): Promise<QueryMatch[]> {
    const matches: QueryMatch[] = []
    const pattern = new RegExp(query.pattern, 'i')

    for (const [key, cls] of this.classIndex) {
      if (pattern.test(cls.name)) {
        matches.push({
          id: `match-${Date.now().toString(36)}-${matches.length}`,
          file: cls.file,
          line: cls.line,
          column: cls.column,
          code: cls.code,
          context: '',
          relevance: this.calculateRelevance(cls.name, query.pattern),
          metadata: {
            type: 'class',
            name: cls.name,
            dependencies: cls.dependencies,
            dependents: cls.dependents
          }
        })
      }
    }

    return matches
  }

  /**
   * Query by pattern
   */
  private async queryByPattern(query: CodeQuery): Promise<QueryMatch[]> {
    const matches: QueryMatch[] = []
    const pattern = new RegExp(query.pattern, 'gi')

    for (const [file, index] of this.index) {
      const lines = index.content.split('\n')
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const match = pattern.exec(line)
        
        if (match) {
          matches.push({
            id: `match-${Date.now().toString(36)}-${matches.length}`,
            file,
            line: i + 1,
            column: match.index + 1,
            code: line.trim(),
            context: '',
            relevance: this.calculateRelevance(line, query.pattern),
            metadata: {
              type: this.inferTypeFromLine(line),
              name: match[0]
            }
          })
        }
        
        pattern.lastIndex = 0
      }
    }

    return matches
  }

  /**
   * Query by dependency
   */
  private async queryByDependency(query: CodeQuery): Promise<QueryMatch[]> {
    const matches: QueryMatch[] = []
    const pattern = new RegExp(query.pattern, 'i')

    for (const [dep, dependents] of this.dependencyGraph) {
      if (pattern.test(dep)) {
        for (const dependent of dependents) {
          const index = this.index.get(dependent)
          if (index) {
            matches.push({
              id: `match-${Date.now().toString(36)}-${matches.length}`,
              file: dependent,
              line: 1,
              column: 1,
              code: `import from '${dep}'`,
              context: '',
              relevance: 0.9,
              metadata: {
                type: 'import',
                name: dep,
                dependents: [dependent]
              }
            })
          }
        }
      }
    }

    return matches
  }

  /**
   * Query by usage
   */
  private async queryByUsage(query: CodeQuery): Promise<QueryMatch[]> {
    // Find all places where a symbol is used
    const matches: QueryMatch[] = []
    const symbol = query.pattern
    
    // Look for the symbol in function index
    for (const [key, func] of this.functionIndex) {
      if (func.dependencies?.includes(symbol)) {
        matches.push({
          id: `match-${Date.now().toString(36)}-${matches.length}`,
          file: func.file,
          line: func.line,
          column: func.column,
          code: func.code,
          context: '',
          relevance: 0.8,
          metadata: {
            type: 'function',
            name: func.name
          }
        })
      }
    }

    return matches
  }

  /**
   * Query by complexity
   */
  private async queryByComplexity(query: CodeQuery): Promise<QueryMatch[]> {
    const matches: QueryMatch[] = []
    const threshold = parseInt(query.pattern) || 10

    for (const [key, func] of this.functionIndex) {
      if (func.complexity && func.complexity >= threshold) {
        matches.push({
          id: `match-${Date.now().toString(36)}-${matches.length}`,
          file: func.file,
          line: func.line,
          column: func.column,
          code: func.code,
          context: '',
          relevance: func.complexity / 100,
          metadata: {
            type: 'function',
            name: func.name,
            complexity: func.complexity
          }
        })
      }
    }

    return matches.sort((a, b) => (b.metadata.complexity || 0) - (a.metadata.complexity || 0))
  }

  /**
   * Query by natural language
   */
  private async queryByNaturalLanguage(query: CodeQuery): Promise<QueryMatch[]> {
    if (!this.zai) {
      return this.queryByPattern(query)
    }

    try {
      // Use AI to expand the query
      const prompt = `Given this code search query: "${query.pattern}"

Generate search patterns to find relevant code. Return a JSON array of regex patterns.
Focus on: function names, class names, variable names, comments.`

      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a code search expert.' },
          { role: 'user', content: prompt }
        ],
        thinking: { type: 'disabled' }
      })

      const response = completion.choices[0]?.message?.content || '[]'
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      const patterns: string[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [query.pattern]

      // Execute each pattern
      const allMatches: QueryMatch[] = []
      for (const pattern of patterns) {
        const results = await this.queryByPattern({ ...query, pattern })
        allMatches.push(...results)
      }

      // Deduplicate and sort by relevance
      const unique = new Map<string, QueryMatch>()
      for (const match of allMatches) {
        const key = `${match.file}:${match.line}`
        if (!unique.has(key) || unique.get(key)!.relevance < match.relevance) {
          unique.set(key, match)
        }
      }

      return Array.from(unique.values())
    } catch {
      return this.queryByPattern(query)
    }
  }

  /**
   * Apply filters to results
   */
  private applyFilters(matches: QueryMatch[], filters: QueryFilter[]): QueryMatch[] {
    return matches.filter(match => {
      for (const filter of filters) {
        switch (filter.type) {
          case 'file_pattern':
            if (!new RegExp(filter.value).test(match.file)) return false
            break
          case 'complexity':
            if (filter.operator === 'greater_than' && (match.metadata.complexity || 0) <= filter.value) return false
            if (filter.operator === 'less_than' && (match.metadata.complexity || 0) >= filter.value) return false
            break
        }
      }
      return true
    })
  }

  /**
   * Sort results
   */
  private sortResults(matches: QueryMatch[], options: QueryOptions): QueryMatch[] {
    const sorted = [...matches]
    
    switch (options.sortBy) {
      case 'relevance':
        sorted.sort((a, b) => b.relevance - a.relevance)
        break
      case 'complexity':
        sorted.sort((a, b) => (b.metadata.complexity || 0) - (a.metadata.complexity || 0))
        break
      case 'name':
        sorted.sort((a, b) => (a.metadata.name || '').localeCompare(b.metadata.name || ''))
        break
    }
    
    if (options.sortOrder === 'asc') {
      sorted.reverse()
    }
    
    return sorted
  }

  /**
   * Add context to matches
   */
  private async addContext(matches: QueryMatch[], contextLines: number): Promise<QueryMatch[]> {
    const result: QueryMatch[] = []
    
    for (const match of matches) {
      const index = this.index.get(match.file)
      if (index) {
        const lines = index.content.split('\n')
        const start = Math.max(0, match.line - contextLines - 1)
        const end = Math.min(lines.length, match.line + contextLines)
        
        result.push({
          ...match,
          context: lines.slice(start, end).join('\n')
        })
      } else {
        result.push(match)
      }
    }
    
    return result
  }

  /**
   * Generate query suggestions
   */
  private async generateSuggestions(query: CodeQuery, matches: QueryMatch[]): Promise<string[]> {
    const suggestions: string[] = []
    
    // Suggest refinements if too many results
    if (matches.length > 100) {
      suggestions.push(`Add file filter to narrow results`)
      suggestions.push(`Use more specific pattern`)
    }
    
    // Suggest alternatives if no results
    if (matches.length === 0) {
      suggestions.push(`Try pattern without case sensitivity`)
      suggestions.push(`Check for typos in pattern`)
      suggestions.push(`Use broader search terms`)
    }
    
    // Add frequent patterns
    for (const [pattern, count] of this.queryHistory.frequentPatterns) {
      if (count > 2 && pattern !== query.pattern) {
        suggestions.push(`Related: ${pattern}`)
      }
    }
    
    return suggestions.slice(0, 5)
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevance(text: string, pattern: string): number {
    const lowerText = text.toLowerCase()
    const lowerPattern = pattern.toLowerCase()
    
    // Exact match
    if (lowerText === lowerPattern) return 1.0
    
    // Starts with
    if (lowerText.startsWith(lowerPattern)) return 0.9
    
    // Contains
    if (lowerText.includes(lowerPattern)) return 0.7
    
    // Fuzzy match
    return 0.5
  }

  /**
   * Infer type from line
   */
  private inferTypeFromLine(line: string): MatchMetadata['type'] {
    if (/function\s+\w+/.test(line)) return 'function'
    if (/class\s+\w+/.test(line)) return 'class'
    if (/import|require/.test(line)) return 'import'
    if (/export/.test(line)) return 'export'
    if (/\/\/|\/\*/.test(line)) return 'comment'
    if (/(const|let|var)\s+\w+/.test(line)) return 'variable'
    return 'other'
  }

  /**
   * Build file index
   */
  private async buildIndex(): Promise<void> {
    try {
      const files = await this.findCodeFiles(this.projectRoot)
      
      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8')
          
          // File index
          this.index.set(file, { content, file })
          
          // Extract functions
          const functions = this.extractFunctions(file, content)
          for (const func of functions) {
            this.functionIndex.set(`${file}:${func.name}`, func)
          }
          
          // Extract classes
          const classes = this.extractClasses(file, content)
          for (const cls of classes) {
            this.classIndex.set(`${file}:${cls.name}`, cls)
          }
          
          // Extract dependencies
          const deps = this.extractDependencies(file, content)
          for (const dep of deps) {
            if (!this.dependencyGraph.has(dep)) {
              this.dependencyGraph.set(dep, new Set())
            }
            this.dependencyGraph.get(dep)!.add(file)
          }
        } catch {
          // Skip files that can't be read
        }
      }
    } catch (error) {
      console.error('[CodeQueryEngine] Failed to build index:', error)
    }
  }

  /**
   * Find code files
   */
  private async findCodeFiles(dir: string): Promise<string[]> {
    const files: string[] = []
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        
        if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
          files.push(...await this.findCodeFiles(fullPath))
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          files.push(fullPath)
        }
      }
    } catch {
      // Skip directories that can't be read
    }
    
    return files
  }

  /**
   * Extract functions from content
   */
  private extractFunctions(file: string, content: string): FunctionIndex[] {
    const functions: FunctionIndex[] = []
    const lines = content.split('\n')
    
    // Match function declarations
    const funcPattern = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(|(\w+)\s*\([^)]*\)\s*(?:\{|=>))/g
    
    let match
    while ((match = funcPattern.exec(content)) !== null) {
      const name = match[1] || match[2] || match[3]
      if (name) {
        const lineNum = content.substring(0, match.index).split('\n').length
        
        functions.push({
          name,
          file,
          line: lineNum,
          column: match.index - content.lastIndexOf('\n', match.index - 1),
          code: lines[lineNum - 1]?.trim() || '',
          complexity: this.estimateComplexity(lines, lineNum)
        })
      }
    }
    
    return functions
  }

  /**
   * Extract classes from content
   */
  private extractClasses(file: string, content: string): ClassIndex[] {
    const classes: ClassIndex[] = []
    const lines = content.split('\n')
    
    const classPattern = /class\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{/g
    
    let match
    while ((match = classPattern.exec(content)) !== null) {
      const name = match[1]
      const lineNum = content.substring(0, match.index).split('\n').length
      
      classes.push({
        name,
        file,
        line: lineNum,
        column: match.index - content.lastIndexOf('\n', match.index - 1),
        code: lines[lineNum - 1]?.trim() || ''
      })
    }
    
    return classes
  }

  /**
   * Extract dependencies from content
   */
  private extractDependencies(file: string, content: string): string[] {
    const deps: string[] = []
    
    const importPattern = /import\s+.*?from\s+['"]([^'"]+)['"]/g
    const requirePattern = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    
    let match
    while ((match = importPattern.exec(content)) !== null) {
      deps.push(match[1])
    }
    while ((match = requirePattern.exec(content)) !== null) {
      deps.push(match[1])
    }
    
    return deps
  }

  /**
   * Estimate function complexity
   */
  private estimateComplexity(lines: string[], startLine: number): number {
    let complexity = 1
    const maxLines = Math.min(startLine + 50, lines.length)
    
    for (let i = startLine; i < maxLines; i++) {
      const line = lines[i]
      if (/if|else|for|while|case|catch|\?|&&|\|\|/.test(line)) {
        complexity++
      }
    }
    
    return complexity
  }

  /**
   * Update frequent patterns
   */
  private updateFrequentPatterns(query: CodeQuery): void {
    const pattern = query.pattern
    this.queryHistory.frequentPatterns.set(
      pattern,
      (this.queryHistory.frequentPatterns.get(pattern) || 0) + 1
    )
  }

  /**
   * Get query history
   */
  getHistory(): QueryHistory {
    return this.queryHistory
  }

  /**
   * Get function by name
   */
  getFunction(name: string): FunctionIndex | undefined {
    for (const [key, func] of this.functionIndex) {
      if (func.name === name) return func
    }
    return undefined
  }

  /**
   * Get class by name
   */
  getClass(name: string): ClassIndex | undefined {
    for (const [key, cls] of this.classIndex) {
      if (cls.name === name) return cls
    }
    return undefined
  }
}

// Index types
interface FileIndex {
  content: string
  file: string
}

interface FunctionIndex {
  name: string
  file: string
  line: number
  column: number
  code: string
  complexity?: number
  dependencies?: string[]
  dependents?: string[]
}

interface ClassIndex {
  name: string
  file: string
  line: number
  column: number
  code: string
  dependencies?: string[]
  dependents?: string[]
}

// Singleton instance
let engineInstance: CodeQueryEngine | null = null

export function getCodeQueryEngine(): CodeQueryEngine {
  if (!engineInstance) {
    engineInstance = new CodeQueryEngine()
  }
  return engineInstance
}

export async function queryCode(input: string | CodeQuery): Promise<QueryResult> {
  const engine = getCodeQueryEngine()
  if (!engine['zai']) {
    await engine.initialize()
  }
  return engine.query(input)
}
