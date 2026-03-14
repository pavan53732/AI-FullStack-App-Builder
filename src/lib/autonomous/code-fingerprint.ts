/**
 * Code Fingerprint Generator
 * 
 * Generates unique fingerprints for code blocks to enable:
 * - Duplicate code detection
 * - Code similarity matching
 * - Version tracking
 * - Change detection
 * - Code indexing
 * 
 * Mechanism #240 from the 520-mechanism checklist
 */

import { createHash } from 'crypto'

// ============================================================================
// Types
// ============================================================================

export interface CodeFingerprint {
  id: string
  hash: string
  semanticHash: string
  structuralHash: string
  content: string
  normalizedContent: string
  language: string
  type: FingerprintType
  metrics: FingerprintMetrics
  features: CodeFeatures
  createdAt: Date
  metadata?: Record<string, unknown>
}

export type FingerprintType = 
  | 'function'
  | 'class'
  | 'module'
  | 'file'
  | 'block'
  | 'expression'
  | 'statement'

export interface FingerprintMetrics {
  lineCount: number
  characterCount: number
  tokenCount: number
  cyclomaticComplexity: number
  nestingDepth: number
  parameterCount: number
  branchCount: number
  loopCount: number
  functionCallCount: number
}

export interface CodeFeatures {
  keywords: string[]
  identifiers: string[]
  operators: string[]
  literals: string[]
  comments: string[]
  imports: string[]
  exports: string[]
  dependencies: string[]
}

export interface FingerprintConfig {
  /** Hash algorithm to use */
  hashAlgorithm: 'md5' | 'sha256' | 'sha512'
  /** Include comments in fingerprint */
  includeComments: boolean
  /** Include whitespace in fingerprint */
  includeWhitespace: boolean
  /** Normalize identifiers for comparison */
  normalizeIdentifiers: boolean
  /** Minimum code length to fingerprint */
  minLength: number
  /** Extract semantic features */
  extractSemanticFeatures: boolean
  /** Languages to support */
  supportedLanguages: string[]
}

export interface FingerprintMatch {
  fingerprint1: CodeFingerprint
  fingerprint2: CodeFingerprint
  similarity: number
  matchType: 'exact' | 'structural' | 'semantic' | 'partial'
  commonFeatures: string[]
}

export interface FingerprintStats {
  totalGenerated: number
  exactMatches: number
  structuralMatches: number
  semanticMatches: number
  averageGenerationTime: number
  cacheHits: number
}

// ============================================================================
// Code Fingerprint Generator Class
// ============================================================================

export class CodeFingerprintGenerator {
  private config: FingerprintConfig
  private fingerprintCache: Map<string, CodeFingerprint> = new Map()
  private stats: FingerprintStats = {
    totalGenerated: 0,
    exactMatches: 0,
    structuralMatches: 0,
    semanticMatches: 0,
    averageGenerationTime: 0,
    cacheHits: 0
  }
  private generationTimes: number[] = []

  // Language patterns for feature extraction
  private readonly languagePatterns: Record<string, LanguagePattern> = {
    typescript: {
      keywords: ['function', 'const', 'let', 'var', 'class', 'interface', 'type', 'import', 'export', 'async', 'await', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 'extends', 'implements', 'private', 'public', 'protected', 'static', 'readonly', 'enum', 'namespace', 'module', 'declare', 'abstract', 'as', 'is', 'keyof', 'never', 'unknown', 'any', 'void', 'null', 'undefined', 'true', 'false'],
      commentPattern: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
      stringPattern: /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,
      importPattern: /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?["']([^"']+)["']/g,
      exportPattern: /export\s+(?:default\s+)?(?:(?:const|let|var|function|class|interface|type|enum)\s+)?(\w+)/g,
      functionPattern: /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(|(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{)/g,
      classPattern: /class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?/g
    },
    javascript: {
      keywords: ['function', 'const', 'let', 'var', 'class', 'import', 'export', 'async', 'await', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 'extends', 'null', 'undefined', 'true', 'false'],
      commentPattern: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
      stringPattern: /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,
      importPattern: /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?["']([^"']+)["']/g,
      exportPattern: /export\s+(?:default\s+)?(?:(?:const|let|var|function|class)\s+)?(\w+)/g,
      functionPattern: /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(|(\w+)\s*\([^)]*\)\s*\{)/g,
      classPattern: /class\s+(\w+)(?:\s+extends\s+(\w+))?/g
    },
    python: {
      keywords: ['def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'raise', 'with', 'as', 'lambda', 'yield', 'global', 'nonlocal', 'pass', 'break', 'continue', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is'],
      commentPattern: /#.*$|"""[\s\S]*?"""|'''[\s\S]*?'''/gm,
      stringPattern: /(["']{3}[\s\S]*?["']{3}|["'](?!["'])[^"']*["'])/g,
      importPattern: /(?:from\s+(\w+(?:\.\w+)*)\s+)?import\s+([\w,\s]+)/g,
      exportPattern: /__all__\s*=\s*\[([^\]]+)\]/g,
      functionPattern: /def\s+(\w+)\s*\(([^)]*)\)/g,
      classPattern: /class\s+(\w+)(?:\(([^)]+)\))?/g
    }
  }

  constructor(config?: Partial<FingerprintConfig>) {
    this.config = {
      hashAlgorithm: 'sha256',
      includeComments: false,
      includeWhitespace: false,
      normalizeIdentifiers: true,
      minLength: 20,
      extractSemanticFeatures: true,
      supportedLanguages: ['typescript', 'javascript', 'python'],
      ...config
    }
  }

  /**
   * Generate fingerprint for code
   */
  generate(code: string, language: string = 'typescript', type: FingerprintType = 'block'): CodeFingerprint {
    const startTime = Date.now()

    // Check cache
    const cacheKey = this.getCacheKey(code, language)
    if (this.fingerprintCache.has(cacheKey)) {
      this.stats.cacheHits++
      return this.fingerprintCache.get(cacheKey)!
    }

    // Normalize content
    const normalizedContent = this.normalizeCode(code, language)

    // Generate hashes
    const hash = this.generateHash(normalizedContent)
    const structuralHash = this.generateStructuralHash(code, language)
    const semanticHash = this.generateSemanticHash(code, language)

    // Extract metrics
    const metrics = this.extractMetrics(code, language)

    // Extract features
    const features = this.extractFeatures(code, language)

    const fingerprint: CodeFingerprint = {
      id: `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      hash,
      semanticHash,
      structuralHash,
      content: code,
      normalizedContent,
      language,
      type,
      metrics,
      features,
      createdAt: new Date()
    }

    // Cache fingerprint
    this.fingerprintCache.set(cacheKey, fingerprint)

    // Update stats
    const generationTime = Date.now() - startTime
    this.generationTimes.push(generationTime)
    this.stats.totalGenerated++
    this.stats.averageGenerationTime = 
      this.generationTimes.reduce((a, b) => a + b, 0) / this.generationTimes.length

    return fingerprint
  }

  /**
   * Generate fingerprints for multiple code blocks
   */
  generateBatch(codeBlocks: Array<{ code: string; language?: string; type?: FingerprintType }>): CodeFingerprint[] {
    return codeBlocks.map(block => 
      this.generate(block.code, block.language, block.type)
    )
  }

  /**
   * Compare two fingerprints
   */
  compare(fp1: CodeFingerprint, fp2: CodeFingerprint): FingerprintMatch {
    let similarity = 0
    let matchType: 'exact' | 'structural' | 'semantic' | 'partial' = 'partial'
    const commonFeatures: string[] = []

    // Exact match
    if (fp1.hash === fp2.hash) {
      similarity = 1.0
      matchType = 'exact'
      this.stats.exactMatches++
      return { fingerprint1: fp1, fingerprint2: fp2, similarity, matchType, commonFeatures }
    }

    // Structural match
    if (fp1.structuralHash === fp2.structuralHash) {
      similarity = 0.9
      matchType = 'structural'
      this.stats.structuralMatches++
    } else {
      // Semantic similarity
      const semanticSimilarity = this.calculateSemanticSimilarity(fp1, fp2)
      if (semanticSimilarity > 0.7) {
        similarity = semanticSimilarity
        matchType = 'semantic'
        this.stats.semanticMatches++
      } else {
        // Partial match based on features
        similarity = this.calculateFeatureSimilarity(fp1, fp2, commonFeatures)
      }
    }

    return { fingerprint1: fp1, fingerprint2: fp2, similarity, matchType, commonFeatures }
  }

  /**
   * Find similar code in a collection
   */
  findSimilar(fingerprint: CodeFingerprint, collection: CodeFingerprint[], threshold: number = 0.7): FingerprintMatch[] {
    const matches: FingerprintMatch[] = []

    for (const other of collection) {
      if (other.id === fingerprint.id) continue

      const match = this.compare(fingerprint, other)
      if (match.similarity >= threshold) {
        matches.push(match)
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity)
  }

  /**
   * Normalize code for consistent fingerprinting
   */
  private normalizeCode(code: string, language: string): string {
    let normalized = code

    // Remove comments if configured
    if (!this.config.includeComments) {
      const patterns = this.languagePatterns[language]
      if (patterns) {
        normalized = normalized.replace(patterns.commentPattern, '')
      }
    }

    // Normalize whitespace if configured
    if (!this.config.includeWhitespace) {
      normalized = normalized
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n+/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .trim()
    }

    // Normalize identifiers if configured
    if (this.config.normalizeIdentifiers) {
      normalized = this.normalizeIdentifiersInCode(normalized)
    }

    return normalized
  }

  /**
   * Normalize identifiers to generic names
   */
  private normalizeIdentifiersInCode(code: string): string {
    let counter = 0
    const identifierMap = new Map<string, string>()

    // Replace identifiers with generic names
    return code.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match) => {
      // Skip keywords
      const allKeywords = Object.values(this.languagePatterns)
        .flatMap(p => p.keywords)
      if (allKeywords.includes(match)) {
        return match
      }

      // Map to generic identifier
      if (!identifierMap.has(match)) {
        identifierMap.set(match, `var_${counter++}`)
      }
      return identifierMap.get(match)!
    })
  }

  /**
   * Generate hash for content
   */
  private generateHash(content: string): string {
    return createHash(this.config.hashAlgorithm)
      .update(content)
      .digest('hex')
  }

  /**
   * Generate structural hash based on AST-like structure
   */
  private generateStructuralHash(code: string, language: string): string {
    // Extract structural elements
    const structure = {
      functions: this.countPattern(code, /function\s+\w+|=>\s*{|\w+\s*\([^)]*\)\s*{/g),
      classes: this.countPattern(code, /class\s+\w+/g),
      loops: this.countPattern(code, /for\s*\(|while\s*\(|forEach|map\s*\(/g),
      conditionals: this.countPattern(code, /if\s*\(|switch\s*\(|case\s+/g),
      tryCatch: this.countPattern(code, /try\s*{|catch\s*\(/g),
      imports: this.countPattern(code, /import\s+/g),
      exports: this.countPattern(code, /export\s+/g),
      asyncAwait: this.countPattern(code, /async\s+|await\s+/g)
    }

    return this.generateHash(JSON.stringify(structure))
  }

  /**
   * Generate semantic hash based on semantic features
   */
  private generateSemanticHash(code: string, language: string): string {
    const patterns = this.languagePatterns[language]
    if (!patterns) return this.generateHash(code)

    // Extract semantic elements
    const semantics = {
      keywords: this.extractKeywords(code, patterns.keywords),
      operators: this.extractOperators(code),
      constructs: this.extractConstructs(code)
    }

    return this.generateHash(JSON.stringify(semantics))
  }

  /**
   * Extract metrics from code
   */
  private extractMetrics(code: string, language: string): FingerprintMetrics {
    const lines = code.split('\n')
    
    return {
      lineCount: lines.length,
      characterCount: code.length,
      tokenCount: this.estimateTokenCount(code),
      cyclomaticComplexity: this.estimateCyclomaticComplexity(code),
      nestingDepth: this.estimateNestingDepth(code),
      parameterCount: this.countPattern(code, /function\s+\w+\s*\(([^)]*)\)|=>\s*\(([^)]*)\)|\w+\s*\(([^)]*)\)\s*{/g),
      branchCount: this.countPattern(code, /if\s*\(|else\s*{|else\s+if|switch\s*\(|case\s+/g),
      loopCount: this.countPattern(code, /for\s*\(|while\s*\(|do\s*{|forEach|map\s*\(|filter\s*\(/g),
      functionCallCount: this.countPattern(code, /\w+\s*\(/g)
    }
  }

  /**
   * Extract features from code
   */
  private extractFeatures(code: string, language: string): CodeFeatures {
    const patterns = this.languagePatterns[language] || this.languagePatterns.typescript

    return {
      keywords: this.extractKeywords(code, patterns.keywords),
      identifiers: this.extractIdentifiers(code),
      operators: this.extractOperators(code),
      literals: this.extractLiterals(code),
      comments: this.extractComments(code, patterns.commentPattern),
      imports: this.extractImports(code, patterns.importPattern),
      exports: this.extractExports(code, patterns.exportPattern),
      dependencies: this.extractDependencies(code)
    }
  }

  // Helper methods for feature extraction
  private extractKeywords(code: string, keywords: string[]): string[] {
    const found: string[] = []
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g')
      if (regex.test(code)) {
        found.push(keyword)
      }
    }
    return [...new Set(found)]
  }

  private extractIdentifiers(code: string): string[] {
    const matches = code.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g) || []
    return [...new Set(matches)].slice(0, 50)
  }

  private extractOperators(code: string): string[] {
    const operators = code.match(/[+\-*/%=<>!&|^~?:]+/g) || []
    return [...new Set(operators)]
  }

  private extractLiterals(code: string): string[] {
    const patterns = this.languagePatterns.typescript
    const strings = code.match(patterns.stringPattern) || []
    const numbers = code.match(/\b\d+(?:\.\d+)?\b/g) || []
    return [...new Set([...strings, ...numbers])].slice(0, 20)
  }

  private extractComments(code: string, pattern: RegExp): string[] {
    const matches = code.match(pattern) || []
    return matches.map(c => c.trim()).slice(0, 10)
  }

  private extractImports(code: string, pattern: RegExp): string[] {
    const imports: string[] = []
    let match
    const regex = new RegExp(pattern.source, pattern.flags)
    while ((match = regex.exec(code)) !== null) {
      if (match[1]) imports.push(match[1])
    }
    return [...new Set(imports)]
  }

  private extractExports(code: string, pattern: RegExp): string[] {
    const exports: string[] = []
    let match
    const regex = new RegExp(pattern.source, pattern.flags)
    while ((match = regex.exec(code)) !== null) {
      if (match[1]) exports.push(match[1])
    }
    return [...new Set(exports)]
  }

  private extractDependencies(code: string): string[] {
    const deps: string[] = []
    // Extract from imports
    const importMatch = code.matchAll(/from\s+["']([^"']+)["']/g)
    for (const match of importMatch) {
      deps.push(match[1])
    }
    return [...new Set(deps)]
  }

  private extractConstructs(code: string): string[] {
    const constructs: string[] = []
    if (/function\s+\w+/.test(code)) constructs.push('function')
    if (/class\s+\w+/.test(code)) constructs.push('class')
    if (/interface\s+\w+/.test(code)) constructs.push('interface')
    if (/type\s+\w+/.test(code)) constructs.push('type')
    if (/enum\s+\w+/.test(code)) constructs.push('enum')
    if (/async\s+/.test(code)) constructs.push('async')
    if (/=>\s*{/.test(code)) constructs.push('arrow_function')
    return constructs
  }

  private countPattern(code: string, pattern: RegExp): number {
    return (code.match(pattern) || []).length
  }

  private estimateTokenCount(code: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(code.length / 4)
  }

  private estimateCyclomaticComplexity(code: string): number {
    // Base complexity + 1 for each decision point
    let complexity = 1
    complexity += this.countPattern(code, /if\s*\(/g)
    complexity += this.countPattern(code, /else\s+if/g)
    complexity += this.countPattern(code, /case\s+/g)
    complexity += this.countPattern(code, /for\s*\(/g)
    complexity += this.countPattern(code, /while\s*\(/g)
    complexity += this.countPattern(code, /catch\s*\(/g)
    complexity += this.countPattern(code, /&&|\|\|/g)
    return complexity
  }

  private estimateNestingDepth(code: string): number {
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

  private calculateSemanticSimilarity(fp1: CodeFingerprint, fp2: CodeFingerprint): number {
    // Compare features
    const keywords1 = new Set(fp1.features.keywords)
    const keywords2 = new Set(fp2.features.keywords)
    const keywordSimilarity = this.jaccardSimilarity(keywords1, keywords2)

    const deps1 = new Set(fp1.features.dependencies)
    const deps2 = new Set(fp2.features.dependencies)
    const depSimilarity = this.jaccardSimilarity(deps1, deps2)

    // Compare metrics
    const metricsSimilarity = this.calculateMetricsSimilarity(fp1.metrics, fp2.metrics)

    // Weighted average
    return keywordSimilarity * 0.4 + depSimilarity * 0.3 + metricsSimilarity * 0.3
  }

  private calculateFeatureSimilarity(fp1: CodeFingerprint, fp2: CodeFingerprint, commonFeatures: string[]): number {
    const features1 = new Set([
      ...fp1.features.keywords,
      ...fp1.features.identifiers.slice(0, 10),
      ...fp1.features.dependencies
    ])
    const features2 = new Set([
      ...fp2.features.keywords,
      ...fp2.features.identifiers.slice(0, 10),
      ...fp2.features.dependencies
    ])

    const intersection = new Set([...features1].filter(x => features2.has(x)))
    commonFeatures.push(...intersection)

    return this.jaccardSimilarity(features1, features2)
  }

  private calculateMetricsSimilarity(m1: FingerprintMetrics, m2: FingerprintMetrics): number {
    const maxDiff = (a: number, b: number) => Math.max(a, b) === 0 ? 0 : Math.abs(a - b) / Math.max(a, b)
    
    const differences = [
      maxDiff(m1.lineCount, m2.lineCount),
      maxDiff(m1.cyclomaticComplexity, m2.cyclomaticComplexity),
      maxDiff(m1.nestingDepth, m2.nestingDepth),
      maxDiff(m1.branchCount, m2.branchCount),
      maxDiff(m1.loopCount, m2.loopCount)
    ]

    return 1 - (differences.reduce((a, b) => a + b, 0) / differences.length)
  }

  private jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
    if (set1.size === 0 && set2.size === 0) return 1
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    return intersection.size / union.size
  }

  private getCacheKey(code: string, language: string): string {
    return `${language}:${createHash('md5').update(code).digest('hex')}`
  }

  /**
   * Get statistics
   */
  getStats(): FingerprintStats {
    return { ...this.stats }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.fingerprintCache.clear()
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<FingerprintConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// ============================================================================
// Types for Language Patterns
// ============================================================================

interface LanguagePattern {
  keywords: string[]
  commentPattern: RegExp
  stringPattern: RegExp
  importPattern: RegExp
  exportPattern: RegExp
  functionPattern: RegExp
  classPattern: RegExp
}

// ============================================================================
// Singleton Instance
// ============================================================================

let generatorInstance: CodeFingerprintGenerator | null = null

export function getCodeFingerprintGenerator(config?: Partial<FingerprintConfig>): CodeFingerprintGenerator {
  if (!generatorInstance) {
    generatorInstance = new CodeFingerprintGenerator(config)
  }
  return generatorInstance
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Generate fingerprint for code
 */
export function generateFingerprint(code: string, language?: string, type?: FingerprintType): CodeFingerprint {
  return getCodeFingerprintGenerator().generate(code, language, type)
}

/**
 * Compare two code snippets
 */
export function compareCode(code1: string, code2: string, language?: string): FingerprintMatch {
  const generator = getCodeFingerprintGenerator()
  const fp1 = generator.generate(code1, language)
  const fp2 = generator.generate(code2, language)
  return generator.compare(fp1, fp2)
}

/**
 * Check if code is duplicate
 */
export function isDuplicateCode(code: string, existing: CodeFingerprint[], threshold?: number): FingerprintMatch | null {
  const generator = getCodeFingerprintGenerator()
  const fp = generator.generate(code)
  const matches = generator.findSimilar(fp, existing, threshold)
  return matches.length > 0 ? matches[0] : null
}

/**
 * Get fingerprint statistics
 */
export function getFingerprintStats(): FingerprintStats {
  return getCodeFingerprintGenerator().getStats()
}
