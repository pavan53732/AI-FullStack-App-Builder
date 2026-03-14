/**
 * Documentation Intelligence System
 * 
 * Implements mechanisms #264-270: Documentation Intelligence systems.
 * 
 * Features:
 * - Code example generator - Generate examples from code
 * - Documentation consistency checker - Check doc-code alignment
 * - Documentation coverage analyzer - Analyze coverage metrics
 * - Doc-code mismatch detector - Detect discrepancies
 * - Inline explanation generator - Generate explanations
 * - Architecture doc generator - Generate architecture docs
 * - README synthesis engine - Synthesize README content
 */

import ZAI from 'z-ai-web-dev-sdk'
import { EventEmitter } from 'events'
import fs from 'fs/promises'
import path from 'path'

// ============================================================================
// Types
// ============================================================================

export interface CodeElement {
  name: string
  kind: 'function' | 'class' | 'interface' | 'type' | 'variable' | 'method' | 'property'
  filePath: string
  lineStart: number
  lineEnd: number
  signature: string
  documentation?: string
  parameters?: ParameterInfo[]
  returnType?: string
  exported: boolean
  deprecated?: boolean
  async?: boolean
}

export interface ParameterInfo {
  name: string
  type: string
  optional: boolean
  defaultValue?: string
  description?: string
}

export interface ExampleGeneration {
  id: string
  elementName: string
  elementKind: string
  code: string
  language: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  createdAt: string
}

export interface CoverageReport {
  totalElements: number
  documentedElements: number
  coveragePercentage: number
  byKind: Record<string, { total: number; documented: number; percentage: number }>
  byFile: Record<string, { total: number; documented: number; percentage: number }>
  undocumented: CodeElement[]
  suggestions: string[]
  generatedAt: string
}

export interface MismatchResult {
  id: string
  elementName: string
  filePath: string
  line: number
  mismatchType: MismatchType
  severity: 'error' | 'warning' | 'info'
  description: string
  codeSignature: string
  docSignature?: string
  suggestedFix?: string
}

export type MismatchType =
  | 'parameter_count_mismatch'
  | 'parameter_type_mismatch'
  | 'parameter_name_mismatch'
  | 'return_type_mismatch'
  | 'missing_parameter_doc'
  | 'missing_return_doc'
  | 'deprecated_not_marked'
  | 'async_not_documented'
  | 'signature_outdated'
  | 'description_outdated'

export interface ConsistencyCheckResult {
  passed: boolean
  score: number
  mismatches: MismatchResult[]
  statistics: {
    totalChecked: number
    passedCount: number
    failedCount: number
    warningCount: number
  }
  recommendations: string[]
}

export interface InlineExplanation {
  id: string
  code: string
  explanation: string
  language: string
  complexity: 'simple' | 'moderate' | 'complex'
  concepts: string[]
  relatedDocumentation?: string
}

export interface ArchitectureDoc {
  title: string
  description: string
  overview: string
  components: ArchitectureComponent[]
  dataFlow: DataFlowDiagram
  dependencies: DependencyGraph
  decisions: ArchitectureDecision[]
  diagrams: Diagram[]
}

export interface ArchitectureComponent {
  name: string
  type: 'module' | 'service' | 'database' | 'api' | 'ui' | 'util'
  description: string
  responsibilities: string[]
  interfaces: string[]
  dependencies: string[]
  file: string
}

export interface DataFlowDiagram {
  nodes: DataFlowNode[]
  edges: DataFlowEdge[]
  description: string
}

export interface DataFlowNode {
  id: string
  label: string
  type: 'source' | 'process' | 'storage' | 'sink'
}

export interface DataFlowEdge {
  from: string
  to: string
  label: string
  dataType: string
}

export interface DependencyGraph {
  nodes: string[]
  edges: Array<{ from: string; to: string; type: 'import' | 'extends' | 'implements' }>
  circularDependencies: string[][]
}

export interface ArchitectureDecision {
  id: string
  title: string
  status: 'proposed' | 'accepted' | 'deprecated' | 'superseded'
  context: string
  decision: string
  consequences: string
  alternatives: string[]
}

export interface Diagram {
  type: 'mermaid' | 'plantuml' | 'ascii'
  content: string
  caption: string
}

export interface READMESynthesis {
  title: string
  description: string
  badges: Badge[]
  installation: string
  usage: string
  api: string
  examples: string
  contributing: string
  license: string
  changelog?: string
  toc: TableOfContents
}

export interface Badge {
  label: string
  message: string
  color: string
  link?: string
}

export interface TableOfContents {
  items: TOCItem[]
}

export interface TOCItem {
  title: string
  anchor: string
  level: number
  children?: TOCItem[]
}

export interface DocumentationResult {
  success: boolean
  type: 'coverage' | 'consistency' | 'mismatch' | 'example' | 'explanation' | 'architecture' | 'readme'
  data: any
  warnings: string[]
  metadata: {
    processedFiles: number
    processingTime: number
    timestamp: string
  }
}

export interface DocumentationIntelligenceConfig {
  projectPath: string
  includePatterns: string[]
  excludePatterns: string[]
  minCoverageThreshold: number
  checkConsistency: boolean
  generateExamples: boolean
  exampleDifficulty: 'beginner' | 'intermediate' | 'advanced' | 'all'
  outputFormat: 'markdown' | 'json' | 'html'
}

// ============================================================================
// Documentation Intelligence Class
// ============================================================================

export class DocumentationIntelligence extends EventEmitter {
  private zai: any = null
  private config: DocumentationIntelligenceConfig
  private elementCache: Map<string, CodeElement[]> = new Map()
  private exampleCache: Map<string, ExampleGeneration> = new Map()
  private initialized: boolean = false

  constructor(config?: Partial<DocumentationIntelligenceConfig>) {
    super()
    this.config = {
      projectPath: process.cwd(),
      includePatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
      excludePatterns: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
      minCoverageThreshold: 80,
      checkConsistency: true,
      generateExamples: true,
      exampleDifficulty: 'all',
      outputFormat: 'markdown',
      ...config
    }
  }

  /**
   * Initialize the documentation intelligence system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      this.zai = await ZAI.create()
      await this.buildElementCache()
      this.initialized = true
      this.emit('initialized', { config: this.config })
    } catch (error: any) {
      this.emit('error', { phase: 'initialization', error: error.message })
      throw error
    }
  }

  /**
   * Build cache of code elements
   */
  private async buildElementCache(): Promise<void> {
    const files = await this.findSourceFiles()
    this.elementCache.clear()

    for (const file of files) {
      try {
        const elements = await this.extractElements(file)
        this.elementCache.set(file, elements)
      } catch (error) {
        // Skip files that can't be processed
      }
    }
  }

  /**
   * Find source files matching patterns
   */
  private async findSourceFiles(): Promise<string[]> {
    const files: string[] = []
    
    const scan = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          
          // Check exclude patterns
          if (this.config.excludePatterns.some(p => 
            fullPath.includes(p.replace('**/', '').replace('/**', ''))
          )) {
            continue
          }
          
          if (entry.isDirectory()) {
            await scan(fullPath)
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name)
            if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
              files.push(fullPath)
            }
          }
        }
      } catch {
        // Skip directories that can't be read
      }
    }

    await scan(this.config.projectPath)
    return files
  }

  /**
   * Extract code elements from a file
   */
  private async extractElements(filePath: string): Promise<CodeElement[]> {
    const content = await fs.readFile(filePath, 'utf-8')
    const elements: CodeElement[] = []
    
    // Extract functions
    elements.push(...this.extractFunctions(content, filePath))
    
    // Extract classes
    elements.push(...this.extractClasses(content, filePath))
    
    // Extract interfaces
    elements.push(...this.extractInterfaces(content, filePath))
    
    // Extract types
    elements.push(...this.extractTypes(content, filePath))
    
    // Extract variables
    elements.push(...this.extractVariables(content, filePath))

    return elements
  }

  /**
   * Extract functions from code
   */
  private extractFunctions(content: string, filePath: string): CodeElement[] {
    const elements: CodeElement[] = []
    
    // Regular functions
    const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^\{]+))?\s*\{/g
    let match

    while ((match = funcRegex.exec(content)) !== null) {
      const name = match[1]
      const params = this.parseParameters(match[2])
      const returnType = match[3]?.trim()
      
      const lineStart = content.slice(0, match.index).split('\n').length
      const lineEnd = this.findClosingBraceLine(content, match.index)
      
      const docs = this.extractJSDoc(content, match.index)
      const exported = match[0].includes('export')
      const deprecated = docs?.includes('@deprecated') || false
      const async = match[0].includes('async')

      elements.push({
        name,
        kind: 'function',
        filePath,
        lineStart,
        lineEnd,
        signature: match[0].slice(0, match[0].indexOf('{')).trim(),
        documentation: docs,
        parameters: params,
        returnType,
        exported,
        deprecated,
        async
      })
    }

    // Arrow functions
    const arrowRegex = /(?:export\s+)?(?:const|let)\s+(\w+)\s*(?::\s*[^=]+)?\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=])\s*=>\s*/g
    
    while ((match = arrowRegex.exec(content)) !== null) {
      const name = match[1]
      const lineStart = content.slice(0, match.index).split('\n').length
      const docs = this.extractJSDoc(content, match.index)
      
      elements.push({
        name,
        kind: 'function',
        filePath,
        lineStart,
        lineEnd: lineStart + 5,
        signature: match[0].trim(),
        documentation: docs,
        exported: match[0].includes('export'),
        deprecated: docs?.includes('@deprecated') || false,
        async: match[0].includes('async')
      })
    }

    return elements
  }

  /**
   * Extract classes from code
   */
  private extractClasses(content: string, filePath: string): CodeElement[] {
    const elements: CodeElement[] = []
    
    const classRegex = /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?\s*\{/g
    let match

    while ((match = classRegex.exec(content)) !== null) {
      const name = match[1]
      const lineStart = content.slice(0, match.index).split('\n').length
      const lineEnd = this.findClosingBraceLine(content, match.index)
      const docs = this.extractJSDoc(content, match.index)

      elements.push({
        name,
        kind: 'class',
        filePath,
        lineStart,
        lineEnd,
        signature: match[0].slice(0, match[0].indexOf('{')).trim(),
        documentation: docs,
        exported: match[0].includes('export'),
        deprecated: docs?.includes('@deprecated') || false
      })

      // Extract methods
      const classBody = this.extractClassBody(content, match.index)
      const methodRegex = /(?:public|private|protected)?\s*(?:static\s+)?(?:async\s+)?(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^\{]+))?\s*\{/g
      let methodMatch

      while ((methodMatch = methodRegex.exec(classBody)) !== null) {
        if (methodMatch[1] === 'constructor') continue
        
        elements.push({
          name: `${name}.${methodMatch[1]}`,
          kind: 'method',
          filePath,
          lineStart: lineStart + this.countLines(classBody.slice(0, methodMatch.index)),
          lineEnd: lineStart + this.countLines(classBody),
          signature: methodMatch[0].slice(0, methodMatch[0].indexOf('{')).trim(),
          documentation: this.extractJSDoc(classBody, methodMatch.index),
          parameters: this.parseParameters(methodMatch[2]),
          returnType: methodMatch[3]?.trim(),
          exported: false,
          async: methodMatch[0].includes('async')
        })
      }
    }

    return elements
  }

  /**
   * Extract interfaces from code
   */
  private extractInterfaces(content: string, filePath: string): CodeElement[] {
    const elements: CodeElement[] = []
    
    const interfaceRegex = /(?:export\s+)?interface\s+(\w+)(?:\s+extends\s+([^{]+))?\s*\{/g
    let match

    while ((match = interfaceRegex.exec(content)) !== null) {
      const name = match[1]
      const lineStart = content.slice(0, match.index).split('\n').length
      const lineEnd = this.findClosingBraceLine(content, match.index)
      const docs = this.extractJSDoc(content, match.index)

      elements.push({
        name,
        kind: 'interface',
        filePath,
        lineStart,
        lineEnd,
        signature: match[0].slice(0, match[0].indexOf('{')).trim(),
        documentation: docs,
        exported: match[0].includes('export'),
        deprecated: docs?.includes('@deprecated') || false
      })
    }

    return elements
  }

  /**
   * Extract types from code
   */
  private extractTypes(content: string, filePath: string): CodeElement[] {
    const elements: CodeElement[] = []
    
    const typeRegex = /(?:export\s+)?type\s+(\w+)(?:<[^>]+>)?\s*=\s*[^;]+;/g
    let match

    while ((match = typeRegex.exec(content)) !== null) {
      const name = match[1]
      const lineStart = content.slice(0, match.index).split('\n').length
      const docs = this.extractJSDoc(content, match.index)

      elements.push({
        name,
        kind: 'type',
        filePath,
        lineStart,
        lineEnd: lineStart,
        signature: match[0].trim(),
        documentation: docs,
        exported: match[0].includes('export'),
        deprecated: docs?.includes('@deprecated') || false
      })
    }

    return elements
  }

  /**
   * Extract variables from code
   */
  private extractVariables(content: string, filePath: string): CodeElement[] {
    const elements: CodeElement[] = []
    
    const varRegex = /(?:export\s+)?(?:const|let)\s+(\w+)(?:\s*:\s*([^=;]+))?\s*=/g
    let match

    while ((match = varRegex.exec(content)) !== null) {
      const name = match[1]
      const lineStart = content.slice(0, match.index).split('\n').length
      const docs = this.extractJSDoc(content, match.index)

      // Skip arrow functions (already captured)
      const afterMatch = content.slice(match.index + match[0].length).trimStart()
      if (afterMatch.startsWith('=>') || afterMatch.startsWith('async')) continue

      elements.push({
        name,
        kind: 'variable',
        filePath,
        lineStart,
        lineEnd: lineStart,
        signature: match[0].trim(),
        documentation: docs,
        exported: match[0].includes('export'),
        deprecated: docs?.includes('@deprecated') || false
      })
    }

    return elements
  }

  /**
   * Parse parameters from string
   */
  private parseParameters(paramStr: string): ParameterInfo[] {
    const params: ParameterInfo[] = []
    
    if (!paramStr.trim()) return params

    const parts = paramStr.split(',')
    
    for (const part of parts) {
      const trimmed = part.trim()
      if (!trimmed) continue

      const optional = trimmed.includes('?')
      const [nameRest, defaultValue] = trimmed.split('=')
      const [name, type] = nameRest.replace('?', '').split(':').map(s => s.trim())

      params.push({
        name: name || trimmed,
        type: type || 'any',
        optional,
        defaultValue: defaultValue?.trim()
      })
    }

    return params
  }

  /**
   * Extract JSDoc comment before position
   */
  private extractJSDoc(content: string, pos: number): string | undefined {
    const beforeContent = content.slice(0, pos)
    const lastNewline = beforeContent.lastIndexOf('\n')
    const prevNewline = beforeContent.lastIndexOf('\n', lastNewline - 1)
    const lastLines = beforeContent.slice(Math.max(0, prevNewline - 100))
    
    const jsdocMatch = lastLines.match(/\/\*\*[\s\S]*?\*\//)
    return jsdocMatch?.[0]
  }

  /**
   * Find closing brace line number
   */
  private findClosingBraceLine(content: string, startPos: number): number {
    let braceCount = 1
    let pos = content.indexOf('{', startPos) + 1

    while (braceCount > 0 && pos < content.length) {
      if (content[pos] === '{') braceCount++
      if (content[pos] === '}') braceCount--
      pos++
    }

    return content.slice(0, pos).split('\n').length
  }

  /**
   * Extract class body
   */
  private extractClassBody(content: string, startPos: number): string {
    const openBrace = content.indexOf('{', startPos)
    let braceCount = 1
    let pos = openBrace + 1

    while (braceCount > 0 && pos < content.length) {
      if (content[pos] === '{') braceCount++
      if (content[pos] === '}') braceCount--
      pos++
    }

    return content.slice(openBrace + 1, pos - 1)
  }

  /**
   * Count lines in string
   */
  private countLines(str: string): number {
    return str.split('\n').length
  }

  // ==========================================================================
  // Feature 1: Code Example Generator
  // ==========================================================================

  /**
   * Generate code examples for a given element
   */
  async generateCodeExample(element: CodeElement): Promise<ExampleGeneration> {
    if (!this.zai) await this.initialize()

    const cacheKey = `${element.filePath}:${element.name}`
    if (this.exampleCache.has(cacheKey)) {
      return this.exampleCache.get(cacheKey)!
    }

    const prompt = `Generate a practical, runnable code example for this ${element.kind}:

Name: ${element.name}
Signature: ${element.signature}
${element.documentation ? `Documentation: ${element.documentation}` : ''}
${element.parameters ? `Parameters: ${element.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}` : ''}
${element.returnType ? `Returns: ${element.returnType}` : ''}

Requirements:
1. Show realistic usage scenario
2. Include necessary imports
3. Demonstrate key features
4. Include comments explaining the example
5. Keep it concise but complete

Return ONLY the example code, no explanations outside the code.`

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert code documentation writer. Generate clear, practical code examples.' },
          { role: 'user', content: prompt }
        ],
        thinking: { type: 'disabled' }
      })

      const code = completion.choices[0]?.message?.content?.trim() || ''
      
      const example: ExampleGeneration = {
        id: `example-${Date.now().toString(36)}`,
        elementName: element.name,
        elementKind: element.kind,
        code,
        language: element.filePath.endsWith('.ts') ? 'typescript' : 'javascript',
        description: `Example usage of ${element.name}`,
        difficulty: this.determineDifficulty(element),
        tags: this.extractTags(element),
        createdAt: new Date().toISOString()
      }

      this.exampleCache.set(cacheKey, example)
      this.emit('example_generated', { element, example })
      
      return example
    } catch (error: any) {
      this.emit('error', { phase: 'example_generation', error: error.message })
      throw error
    }
  }

  /**
   * Generate examples for multiple elements
   */
  async generateExamples(elements: CodeElement[]): Promise<ExampleGeneration[]> {
    const examples: ExampleGeneration[] = []
    
    for (const element of elements) {
      try {
        const example = await this.generateCodeExample(element)
        examples.push(example)
      } catch {
        // Continue with other elements
      }
    }

    return examples
  }

  /**
   * Determine example difficulty based on element complexity
   */
  private determineDifficulty(element: CodeElement): 'beginner' | 'intermediate' | 'advanced' {
    const sig = element.signature
    
    if (element.kind === 'variable' || (element.parameters?.length || 0) <= 1) {
      return 'beginner'
    }
    
    if (element.kind === 'class' || sig.includes('Promise') || sig.includes('async')) {
      return 'intermediate'
    }
    
    if (sig.includes('generic') || (element.parameters?.length || 0) > 3) {
      return 'advanced'
    }

    return 'intermediate'
  }

  /**
   * Extract tags from element
   */
  private extractTags(element: CodeElement): string[] {
    const tags: string[] = [element.kind]
    
    if (element.async) tags.push('async')
    if (element.exported) tags.push('exported')
    if (element.deprecated) tags.push('deprecated')
    
    if (element.returnType) {
      if (element.returnType.includes('Promise')) tags.push('promise')
      if (element.returnType.includes('void')) tags.push('side-effect')
    }
    
    return tags
  }

  // ==========================================================================
  // Feature 2: Documentation Consistency Checker
  // ==========================================================================

  /**
   * Check documentation consistency across the project
   */
  async checkConsistency(): Promise<ConsistencyCheckResult> {
    if (!this.initialized) await this.initialize()

    const mismatches: MismatchResult[] = []
    let totalChecked = 0
    let passedCount = 0

    for (const [filePath, elements] of this.elementCache) {
      for (const element of elements) {
        totalChecked++
        
        const elementMismatches = this.checkElementConsistency(element)
        mismatches.push(...elementMismatches)
        
        if (elementMismatches.length === 0) {
          passedCount++
        }
      }
    }

    const failedCount = mismatches.filter(m => m.severity === 'error').length
    const warningCount = mismatches.filter(m => m.severity === 'warning').length
    const score = totalChecked > 0 ? (passedCount / totalChecked) * 100 : 0

    const result: ConsistencyCheckResult = {
      passed: failedCount === 0,
      score,
      mismatches,
      statistics: {
        totalChecked,
        passedCount,
        failedCount,
        warningCount
      },
      recommendations: this.generateConsistencyRecommendations(mismatches)
    }

    this.emit('consistency_checked', result)
    return result
  }

  /**
   * Check consistency for a single element
   */
  private checkElementConsistency(element: CodeElement): MismatchResult[] {
    const mismatches: MismatchResult[] = []
    
    // Skip if no documentation
    if (!element.documentation) {
      return mismatches
    }

    const docParams = this.extractDocParams(element.documentation)
    const docReturns = this.extractDocReturns(element.documentation)

    // Check parameter count
    const codeParams = element.parameters || []
    if (docParams.length !== codeParams.length) {
      mismatches.push({
        id: `mismatch-${Date.now().toString(36)}`,
        elementName: element.name,
        filePath: element.filePath,
        line: element.lineStart,
        mismatchType: 'parameter_count_mismatch',
        severity: 'error',
        description: `Documentation has ${docParams.length} parameters but code has ${codeParams.length}`,
        codeSignature: `(${codeParams.map(p => p.name).join(', ')})`,
        docSignature: `(${docParams.join(', ')})`,
        suggestedFix: this.suggestParamCountFix(element, docParams, codeParams)
      })
    }

    // Check parameter names and types
    for (let i = 0; i < Math.min(docParams.length, codeParams.length); i++) {
      const docParam = docParams[i]
      const codeParam = codeParams[i]

      if (docParam !== codeParam.name) {
        mismatches.push({
          id: `mismatch-${Date.now().toString(36)}-${i}`,
          elementName: element.name,
          filePath: element.filePath,
          line: element.lineStart,
          mismatchType: 'parameter_name_mismatch',
          severity: 'warning',
          description: `Parameter ${i + 1}: doc says "${docParam}" but code says "${codeParam.name}"`,
          codeSignature: codeParam.name,
          docSignature: docParam,
          suggestedFix: `Rename in documentation to "${codeParam.name}"`
        })
      }
    }

    // Check return type
    if (element.returnType && element.returnType !== 'void') {
      if (!docReturns) {
        mismatches.push({
          id: `mismatch-${Date.now().toString(36)}-ret`,
          elementName: element.name,
          filePath: element.filePath,
          line: element.lineStart,
          mismatchType: 'missing_return_doc',
          severity: 'warning',
          description: 'Function has a return type but no @returns documentation',
          codeSignature: element.returnType,
          suggestedFix: `Add @returns {${element.returnType}} to documentation`
        })
      }
    }

    // Check for deprecated marking
    if (element.deprecated && !element.documentation.includes('@deprecated')) {
      mismatches.push({
        id: `mismatch-${Date.now().toString(36)}-dep`,
        elementName: element.name,
        filePath: element.filePath,
        line: element.lineStart,
        mismatchType: 'deprecated_not_marked',
        severity: 'info',
        description: 'Element appears deprecated but is not marked in documentation',
        codeSignature: element.signature,
        suggestedFix: 'Add @deprecated tag to documentation'
      })
    }

    // Check async documentation
    if (element.async && !element.documentation.includes('Promise') && !element.documentation.includes('async')) {
      mismatches.push({
        id: `mismatch-${Date.now().toString(36)}-async`,
        elementName: element.name,
        filePath: element.filePath,
        line: element.lineStart,
        mismatchType: 'async_not_documented',
        severity: 'info',
        description: 'Async function but documentation does not mention Promise or async behavior',
        codeSignature: element.signature,
        suggestedFix: 'Add note about Promise behavior or async nature'
      })
    }

    return mismatches
  }

  /**
   * Extract parameter names from documentation
   */
  private extractDocParams(doc: string): string[] {
    const params: string[] = []
    const paramRegex = /@param\s+(?:\{[^}]+\}\s+)?(\w+)/g
    let match

    while ((match = paramRegex.exec(doc)) !== null) {
      params.push(match[1])
    }

    return params
  }

  /**
   * Extract return type from documentation
   */
  private extractDocReturns(doc: string): string | null {
    const match = doc.match(/@returns?\s+(?:\{([^}]+)\})?/)
    return match ? match[1] || 'unknown' : null
  }

  /**
   * Suggest fix for parameter count mismatch
   */
  private suggestParamCountFix(
    element: CodeElement,
    docParams: string[],
    codeParams: ParameterInfo[]
  ): string {
    const missing = codeParams.filter(p => !docParams.includes(p.name))
    const extra = docParams.filter(p => !codeParams.some(cp => cp.name === p))

    let fix = ''
    if (missing.length > 0) {
      fix += `Add documentation for: ${missing.map(p => p.name).join(', ')}. `
    }
    if (extra.length > 0) {
      fix += `Remove documentation for: ${extra.join(', ')}.`
    }

    return fix.trim() || 'Update parameter documentation to match code signature'
  }

  /**
   * Generate recommendations based on mismatches
   */
  private generateConsistencyRecommendations(mismatches: MismatchResult[]): string[] {
    const recommendations: string[] = []
    
    const errorsByType = new Map<MismatchType, number>()
    for (const m of mismatches) {
      errorsByType.set(m.mismatchType, (errorsByType.get(m.mismatchType) || 0) + 1)
    }

    if (errorsByType.get('parameter_count_mismatch') || 0 > 5) {
      recommendations.push('Consider running documentation sync to update parameter counts')
    }
    
    if (errorsByType.get('missing_return_doc') || 0 > 3) {
      recommendations.push('Add @returns documentation to functions with return values')
    }

    if (errorsByType.get('signature_outdated') || 0 > 3) {
      recommendations.push('Review and update outdated function signatures in documentation')
    }

    if (mismatches.filter(m => m.severity === 'error').length > 10) {
      recommendations.push('Consider automated documentation regeneration for accuracy')
    }

    return recommendations
  }

  // ==========================================================================
  // Feature 3: Documentation Coverage Analyzer
  // ==========================================================================

  /**
   * Analyze documentation coverage
   */
  async analyzeCoverage(): Promise<CoverageReport> {
    if (!this.initialized) await this.initialize()

    let totalElements = 0
    let documentedElements = 0
    const byKind: Record<string, { total: number; documented: number; percentage: number }> = {}
    const byFile: Record<string, { total: number; documented: number; percentage: number }> = {}
    const undocumented: CodeElement[] = []

    for (const [filePath, elements] of this.elementCache) {
      for (const element of elements) {
        totalElements++
        
        // Initialize byKind entry
        if (!byKind[element.kind]) {
          byKind[element.kind] = { total: 0, documented: 0, percentage: 0 }
        }
        byKind[element.kind].total++

        // Initialize byFile entry
        if (!byFile[filePath]) {
          byFile[filePath] = { total: 0, documented: 0, percentage: 0 }
        }
        byFile[filePath].total++

        const hasDocs = !!element.documentation && element.documentation.length > 10

        if (hasDocs) {
          documentedElements++
          byKind[element.kind].documented++
          byFile[filePath].documented++
        } else {
          undocumented.push(element)
        }
      }
    }

    // Calculate percentages
    for (const kind of Object.keys(byKind)) {
      byKind[kind].percentage = byKind[kind].total > 0
        ? Math.round((byKind[kind].documented / byKind[kind].total) * 100)
        : 0
    }

    for (const file of Object.keys(byFile)) {
      byFile[file].percentage = byFile[file].total > 0
        ? Math.round((byFile[file].documented / byFile[file].total) * 100)
        : 0
    }

    const coveragePercentage = totalElements > 0
      ? Math.round((documentedElements / totalElements) * 100)
      : 0

    const report: CoverageReport = {
      totalElements,
      documentedElements,
      coveragePercentage,
      byKind,
      byFile,
      undocumented,
      suggestions: this.generateCoverageSuggestions(coveragePercentage, byKind, undocumented),
      generatedAt: new Date().toISOString()
    }

    this.emit('coverage_analyzed', report)
    return report
  }

  /**
   * Generate suggestions for improving coverage
   */
  private generateCoverageSuggestions(
    coverage: number,
    byKind: Record<string, { total: number; documented: number; percentage: number }>,
    undocumented: CodeElement[]
  ): string[] {
    const suggestions: string[] = []

    if (coverage < this.config.minCoverageThreshold) {
      suggestions.push(
        `Documentation coverage (${coverage}%) is below threshold (${this.config.minCoverageThreshold}%). ` +
        `Document ${undocumented.length} more elements to reach target.`
      )
    }

    // Find kinds with low coverage
    for (const [kind, stats] of Object.entries(byKind)) {
      if (stats.percentage < 50 && stats.total > 0) {
        suggestions.push(
          `${kind} documentation is at ${stats.percentage}%. ` +
          `Consider documenting ${stats.total - stats.documented} ${kind} elements.`
        )
      }
    }

    // Prioritize exported items
    const undocumentedExported = undocumented.filter(e => e.exported)
    if (undocumentedExported.length > 0) {
      suggestions.push(
        `Priority: Document ${undocumentedExported.length} exported items that are currently undocumented.`
      )
    }

    // Prioritize public classes
    const undocumentedClasses = undocumented.filter(e => e.kind === 'class')
    if (undocumentedClasses.length > 0) {
      suggestions.push(
        `Consider documenting ${undocumentedClasses.length} classes for better API documentation.`
      )
    }

    return suggestions
  }

  // ==========================================================================
  // Feature 4: Doc-Code Mismatch Detector
  // ==========================================================================

  /**
   * Detect discrepancies between documentation and code
   */
  async detectMismatches(): Promise<MismatchResult[]> {
    if (!this.initialized) await this.initialize()

    const allMismatches: MismatchResult[] = []

    for (const [filePath, elements] of this.elementCache) {
      for (const element of elements) {
        if (!element.documentation) continue

        const mismatches = await this.detectElementMismatches(element)
        allMismatches.push(...mismatches)
      }
    }

    // Use AI for complex mismatch detection
    if (this.zai && allMismatches.length > 0) {
      const aiMismatches = await this.aiDetectMismatches()
      allMismatches.push(...aiMismatches)
    }

    this.emit('mismatches_detected', { count: allMismatches.length })
    return allMismatches
  }

  /**
   * Detect mismatches for a single element
   */
  private async detectElementMismatches(element: CodeElement): Promise<MismatchResult[]> {
    const mismatches: MismatchResult[] = []
    const doc = element.documentation!

    // Parse documentation for comparison
    const docDescription = this.extractDocDescription(doc)
    
    // Check if description mentions parameters that don't exist
    if (element.parameters) {
      for (const param of element.parameters) {
        const paramInDoc = doc.includes(`@param`) && doc.includes(param.name)
        if (!paramInDoc && element.exported) {
          mismatches.push({
            id: `mismatch-${element.name}-${param.name}`,
            elementName: element.name,
            filePath: element.filePath,
            line: element.lineStart,
            mismatchType: 'missing_parameter_doc',
            severity: 'warning',
            description: `Parameter "${param.name}" is not documented`,
            codeSignature: param.name,
            suggestedFix: `Add @param {${param.type}} ${param.name} - Description`
          })
        }
      }
    }

    // Check for outdated descriptions
    if (docDescription && element.signature) {
      const sigKeywords = element.signature.match(/\b\w+\b/g) || []
      const descMentionsSig = sigKeywords.slice(0, 3).some(kw => 
        kw.length > 3 && docDescription.toLowerCase().includes(kw.toLowerCase())
      )

      if (!descMentionsSig && element.exported) {
        mismatches.push({
          id: `mismatch-${element.name}-desc`,
          elementName: element.name,
          filePath: element.filePath,
          line: element.lineStart,
          mismatchType: 'description_outdated',
          severity: 'info',
          description: 'Description may not reflect current implementation',
          codeSignature: element.signature,
          suggestedFix: 'Review and update description to match current behavior'
        })
      }
    }

    return mismatches
  }

  /**
   * Use AI to detect complex mismatches
   */
  private async aiDetectMismatches(): Promise<MismatchResult[]> {
    if (!this.zai) return []

    const mismatches: MismatchResult[] = []

    // Sample a few elements for AI analysis
    const sampledElements: CodeElement[] = []
    for (const elements of this.elementCache.values()) {
      if (sampledElements.length >= 5) break
      const withDocs = elements.filter(e => e.documentation && e.exported)
      sampledElements.push(...withDocs.slice(0, 1))
    }

    for (const element of sampledElements) {
      try {
        const prompt = `Analyze if this documentation accurately describes the code:

Code signature: ${element.signature}
Documentation: ${element.documentation}

Look for:
1. Incorrect parameter descriptions
2. Outdated return value descriptions  
3. Missing error handling documentation
4. Misleading descriptions

Return JSON: { "mismatch": boolean, "type": string, "description": string, "suggestion": string }
If no mismatch, return: { "mismatch": false }`

        const completion = await this.zai.chat.completions.create({
          messages: [
            { role: 'system', content: 'You are a documentation accuracy analyzer. Respond only with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          thinking: { type: 'disabled' }
        })

        const response = completion.choices[0]?.message?.content?.trim() || '{}'
        const analysis = JSON.parse(response)

        if (analysis.mismatch) {
          mismatches.push({
            id: `ai-mismatch-${element.name}`,
            elementName: element.name,
            filePath: element.filePath,
            line: element.lineStart,
            mismatchType: 'description_outdated',
            severity: 'warning',
            description: analysis.description || 'AI detected mismatch',
            codeSignature: element.signature,
            docSignature: element.documentation,
            suggestedFix: analysis.suggestion
          })
        }
      } catch {
        // Skip on AI errors
      }
    }

    return mismatches
  }

  /**
   * Extract description from JSDoc
   */
  private extractDocDescription(doc: string): string {
    const lines = doc.split('\n')
    const descriptionLines: string[] = []
    
    for (const line of lines) {
      const trimmed = line.replace(/^\s*\*\s?/, '').trim()
      if (trimmed.startsWith('@')) break
      if (trimmed) descriptionLines.push(trimmed)
    }

    return descriptionLines.join(' ')
  }

  // ==========================================================================
  // Feature 5: Inline Explanation Generator
  // ==========================================================================

  /**
   * Generate inline explanation for code
   */
  async generateExplanation(code: string, language: string = 'typescript'): Promise<InlineExplanation> {
    if (!this.zai) await this.initialize()

    const prompt = `Explain this code concisely for inline documentation:

\`\`\`${language}
${code}
\`\`\`

Provide:
1. A clear, one-paragraph explanation
2. Key concepts used (comma-separated)
3. Complexity level: simple, moderate, or complex

Return JSON: { "explanation": string, "concepts": string[], "complexity": "simple"|"moderate"|"complex" }`

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a code explanation expert. Provide clear, concise explanations. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        thinking: { type: 'disabled' }
      })

      const response = completion.choices[0]?.message?.content?.trim() || '{}'
      const analysis = JSON.parse(response)

      const explanation: InlineExplanation = {
        id: `explanation-${Date.now().toString(36)}`,
        code,
        explanation: analysis.explanation || 'Unable to generate explanation',
        language,
        complexity: analysis.complexity || 'moderate',
        concepts: analysis.concepts || []
      }

      this.emit('explanation_generated', explanation)
      return explanation
    } catch (error: any) {
      this.emit('error', { phase: 'explanation_generation', error: error.message })
      throw error
    }
  }

  /**
   * Generate explanations for multiple code blocks
   */
  async generateExplanations(
    codeBlocks: Array<{ code: string; language?: string }>
  ): Promise<InlineExplanation[]> {
    const explanations: InlineExplanation[] = []

    for (const block of codeBlocks) {
      try {
        const explanation = await this.generateExplanation(block.code, block.language)
        explanations.push(explanation)
      } catch {
        // Continue with other blocks
      }
    }

    return explanations
  }

  // ==========================================================================
  // Feature 6: Architecture Doc Generator
  // ==========================================================================

  /**
   * Generate architecture documentation
   */
  async generateArchitectureDoc(): Promise<ArchitectureDoc> {
    if (!this.initialized) await this.initialize()

    const components = await this.analyzeComponents()
    const dataFlow = await this.analyzeDataFlow()
    const dependencies = await this.analyzeDependencies()
    const decisions = await this.extractArchitectureDecisions()

    const overview = await this.generateArchitectureOverview(components, dependencies)

    const doc: ArchitectureDoc = {
      title: 'Architecture Documentation',
      description: `Auto-generated architecture documentation for ${path.basename(this.config.projectPath)}`,
      overview,
      components,
      dataFlow,
      dependencies,
      decisions,
      diagrams: this.generateDiagrams(components, dataFlow, dependencies)
    }

    this.emit('architecture_doc_generated', doc)
    return doc
  }

  /**
   * Analyze project components
   */
  private async analyzeComponents(): Promise<ArchitectureComponent[]> {
    const components: ArchitectureComponent[] = []
    const dirComponents = new Map<string, string[]>()

    // Group elements by directory
    for (const [filePath, elements] of this.elementCache) {
      const dir = path.dirname(filePath)
      const dirName = path.basename(dir)
      
      if (!dirComponents.has(dirName)) {
        dirComponents.set(dirName, [])
      }
      dirComponents.get(dirName)!.push(...elements.map(e => e.name))
    }

    // Create components from directories
    for (const [dirName, elementNames] of dirComponents) {
      if (['lib', 'src', 'app', 'components', 'utils', 'services', 'api'].includes(dirName)) {
        continue // Skip common top-level directories
      }

      components.push({
        name: dirName,
        type: this.inferComponentType(dirName),
        description: `${dirName} module with ${elementNames.length} exported elements`,
        responsibilities: this.inferResponsibilities(dirName, elementNames),
        interfaces: elementNames.slice(0, 5),
        dependencies: [],
        file: dirName
      })
    }

    // Add main application components
    const exportedElements = this.getExportedElements()
    components.push({
      name: 'Core',
      type: 'module',
      description: 'Core application logic',
      responsibilities: ['Main application functionality', 'Entry points'],
      interfaces: exportedElements.slice(0, 10),
      dependencies: [],
      file: 'index'
    })

    return components
  }

  /**
   * Infer component type from directory name
   */
  private inferComponentType(dirName: string): ArchitectureComponent['type'] {
    const typeMap: Record<string, ArchitectureComponent['type']> = {
      'components': 'ui',
      'ui': 'ui',
      'pages': 'ui',
      'app': 'ui',
      'api': 'api',
      'routes': 'api',
      'lib': 'service',
      'services': 'service',
      'utils': 'util',
      'helpers': 'util',
      'db': 'database',
      'prisma': 'database',
      'models': 'database'
    }

    return typeMap[dirName.toLowerCase()] || 'module'
  }

  /**
   * Infer responsibilities from name and elements
   */
  private inferResponsibilities(dirName: string, elements: string[]): string[] {
    const responsibilities: string[] = []

    // Add based on naming patterns
    if (elements.some(e => e.includes('create'))) responsibilities.push('Data creation')
    if (elements.some(e => e.includes('update'))) responsibilities.push('Data modification')
    if (elements.some(e => e.includes('delete'))) responsibilities.push('Data deletion')
    if (elements.some(e => e.includes('get') || e.includes('fetch'))) responsibilities.push('Data retrieval')
    if (elements.some(e => e.includes('validate'))) responsibilities.push('Input validation')
    if (elements.some(e => e.includes('transform'))) responsibilities.push('Data transformation')

    // Default
    if (responsibilities.length === 0) {
      responsibilities.push(`${dirName} functionality`)
    }

    return responsibilities
  }

  /**
   * Get all exported elements
   */
  private getExportedElements(): string[] {
    const exported: string[] = []
    
    for (const elements of this.elementCache.values()) {
      for (const element of elements) {
        if (element.exported) {
          exported.push(element.name)
        }
      }
    }

    return [...new Set(exported)]
  }

  /**
   * Analyze data flow
   */
  private async analyzeDataFlow(): Promise<DataFlowDiagram> {
    const nodes: DataFlowNode[] = []
    const edges: DataFlowEdge[] = []

    // Create nodes from elements
    const exportedElements = this.getExportedElements()
    
    nodes.push({
      id: 'input',
      label: 'User Input',
      type: 'source'
    })

    nodes.push({
      id: 'output',
      label: 'Response',
      type: 'sink'
    })

    // Add process nodes
    for (const element of exportedElements.slice(0, 10)) {
      nodes.push({
        id: `process-${element}`,
        label: element,
        type: 'process'
      })
    }

    // Create sample edges
    edges.push({
      from: 'input',
      to: 'process-main',
      label: 'Request',
      dataType: 'Request'
    })

    edges.push({
      from: 'process-main',
      to: 'output',
      label: 'Response',
      dataType: 'Response'
    })

    return {
      nodes,
      edges,
      description: 'Data flows from user input through processing to output response'
    }
  }

  /**
   * Analyze dependencies
   */
  private async analyzeDependencies(): Promise<DependencyGraph> {
    const nodes: string[] = []
    const edges: Array<{ from: string; to: string; type: 'import' | 'extends' | 'implements' }> = []
    const circularDependencies: string[][] = []

    // Extract import relationships
    for (const [filePath, elements] of this.elementCache) {
      const fileName = path.basename(filePath, path.extname(filePath))
      if (!nodes.includes(fileName)) {
        nodes.push(fileName)
      }

      // Check for extends/implements
      for (const element of elements) {
        if (element.kind === 'class' && element.signature) {
          const extendsMatch = element.signature.match(/extends\s+(\w+)/)
          if (extendsMatch) {
            edges.push({
              from: fileName,
              to: extendsMatch[1],
              type: 'extends'
            })
          }

          const implementsMatch = element.signature.match(/implements\s+([\w,\s]+)/)
          if (implementsMatch) {
            const interfaces = implementsMatch[1].split(',').map(s => s.trim())
            for (const iface of interfaces) {
              edges.push({
                from: fileName,
                to: iface,
                type: 'implements'
              })
            }
          }
        }
      }
    }

    return {
      nodes,
      edges,
      circularDependencies
    }
  }

  /**
   * Extract architecture decisions from code
   */
  private async extractArchitectureDecisions(): Promise<ArchitectureDecision[]> {
    const decisions: ArchitectureDecision[] = []
    
    // Look for ADR (Architecture Decision Records) files
    try {
      const adrDir = path.join(this.config.projectPath, 'docs', 'adr')
      const entries = await fs.readdir(adrDir)
      
      for (const entry of entries) {
        if (entry.endsWith('.md')) {
          const content = await fs.readFile(path.join(adrDir, entry), 'utf-8')
          decisions.push({
            id: entry.replace('.md', ''),
            title: content.match(/#\s*(.+)/)?.[1] || entry,
            status: content.includes('Accepted') ? 'accepted' : 'proposed',
            context: this.extractSection(content, 'Context'),
            decision: this.extractSection(content, 'Decision'),
            consequences: this.extractSection(content, 'Consequences'),
            alternatives: []
          })
        }
      }
    } catch {
      // No ADR directory
    }

    return decisions
  }

  /**
   * Extract section from markdown
   */
  private extractSection(content: string, sectionName: string): string {
    const regex = new RegExp(`##\\s*${sectionName}[\\s\\S]*?(?=##|$)`, 'i')
    const match = content.match(regex)
    return match ? match[0].replace(new RegExp(`##\\s*${sectionName}`, 'i'), '').trim() : ''
  }

  /**
   * Generate architecture overview using AI
   */
  private async generateArchitectureOverview(
    components: ArchitectureComponent[],
    dependencies: DependencyGraph
  ): Promise<string> {
    if (this.zai) {
      try {
        const prompt = `Generate a concise architecture overview for a project with:

Components: ${components.map(c => `${c.name} (${c.type})`).join(', ')}
Dependencies: ${dependencies.edges.length} relationships
Key Files: ${dependencies.nodes.slice(0, 10).join(', ')}

Write 2-3 paragraphs describing the architecture, main components, and how they interact.`

        const completion = await this.zai.chat.completions.create({
          messages: [
            { role: 'system', content: 'You are a technical documentation writer.' },
            { role: 'user', content: prompt }
          ],
          thinking: { type: 'disabled' }
        })

        return completion.choices[0]?.message?.content?.trim() || ''
      } catch {
        // Fall back to default
      }
    }

    return `This project consists of ${components.length} main components: ${components.map(c => c.name).join(', ')}. ` +
      `The architecture follows a modular design with clear separation of concerns. ` +
      `There are ${dependencies.edges.length} dependency relationships between modules.`
  }

  /**
   * Generate architecture diagrams
   */
  private generateDiagrams(
    components: ArchitectureComponent[],
    dataFlow: DataFlowDiagram,
    dependencies: DependencyGraph
  ): Diagram[] {
    const diagrams: Diagram[] = []

    // Generate component diagram
    diagrams.push({
      type: 'mermaid',
      content: this.generateMermaidComponentDiagram(components),
      caption: 'Component Architecture'
    })

    // Generate data flow diagram
    diagrams.push({
      type: 'mermaid',
      content: this.generateMermaidDataFlowDiagram(dataFlow),
      caption: 'Data Flow'
    })

    // Generate dependency diagram
    diagrams.push({
      type: 'mermaid',
      content: this.generateMermaidDependencyDiagram(dependencies),
      caption: 'Module Dependencies'
    })

    return diagrams
  }

  /**
   * Generate Mermaid component diagram
   */
  private generateMermaidComponentDiagram(components: ArchitectureComponent[]): string {
    let diagram = 'graph TB\n'
    
    for (const comp of components) {
      const type = comp.type.charAt(0).toUpperCase() + comp.type.slice(1)
      diagram += `    ${comp.name}[${comp.name}<br/>${type}]\n`
    }

    // Add sample relationships
    for (let i = 0; i < components.length - 1; i++) {
      diagram += `    ${components[i].name} --> ${components[i + 1].name}\n`
    }

    return diagram
  }

  /**
   * Generate Mermaid data flow diagram
   */
  private generateMermaidDataFlowDiagram(dataFlow: DataFlowDiagram): string {
    let diagram = 'flowchart LR\n'
    
    for (const node of dataFlow.nodes) {
      const shape = node.type === 'source' ? '((' : node.type === 'sink' ? '))' : '['
      const closeShape = node.type === 'source' ? '))' : node.type === 'sink' ? '((' : ']'
      diagram += `    ${node.id}${shape}${node.label}${closeShape}\n`
    }

    for (const edge of dataFlow.edges) {
      diagram += `    ${edge.from} -->|${edge.label}| ${edge.to}\n`
    }

    return diagram
  }

  /**
   * Generate Mermaid dependency diagram
   */
  private generateMermaidDependencyDiagram(dependencies: DependencyGraph): string {
    let diagram = 'graph LR\n'
    
    for (const node of dependencies.nodes.slice(0, 15)) {
      diagram += `    ${node}\n`
    }

    for (const edge of dependencies.edges.slice(0, 20)) {
      const label = edge.type === 'extends' ? 'extends' : edge.type === 'implements' ? 'implements' : 'imports'
      diagram += `    ${edge.from} -->|${label}| ${edge.to}\n`
    }

    return diagram
  }

  // ==========================================================================
  // Feature 7: README Synthesis Engine
  // ==========================================================================

  /**
   * Synthesize README content
   */
  async synthesizeREADME(): Promise<READMESynthesis> {
    if (!this.initialized) await this.initialize()

    const packageJson = await this.readPackageJson()
    const coverage = await this.analyzeCoverage()
    const exportedElements = this.getExportedElements()

    const title = packageJson?.name || path.basename(this.config.projectPath)
    const description = packageJson?.description || await this.generateDescription()

    const readme: READMESynthesis = {
      title,
      description,
      badges: this.generateBadges(packageJson, coverage),
      installation: await this.generateInstallation(packageJson),
      usage: await this.generateUsage(exportedElements),
      api: this.generateAPISection(exportedElements),
      examples: await this.generateExamplesSection(exportedElements.slice(0, 5)),
      contributing: this.generateContributing(),
      license: packageJson?.license || 'MIT',
      toc: this.generateTOC()
    }

    this.emit('readme_synthesized', readme)
    return readme
  }

  /**
   * Read package.json
   */
  private async readPackageJson(): Promise<any> {
    try {
      const content = await fs.readFile(path.join(this.config.projectPath, 'package.json'), 'utf-8')
      return JSON.parse(content)
    } catch {
      return null
    }
  }

  /**
   * Generate project description using AI
   */
  private async generateDescription(): Promise<string> {
    if (this.zai) {
      try {
        const exportedElements = this.getExportedElements().slice(0, 10)
        
        const prompt = `Generate a one-sentence description for a project with these exported elements:
${exportedElements.join(', ')}`

        const completion = await this.zai.chat.completions.create({
          messages: [
            { role: 'system', content: 'You are a technical writer. Generate concise descriptions.' },
            { role: 'user', content: prompt }
          ],
          thinking: { type: 'disabled' }
        })

        return completion.choices[0]?.message?.content?.trim() || 'A software project.'
      } catch {
        // Fall back
      }
    }

    return 'A software project.'
  }

  /**
   * Generate badges for README
   */
  private generateBadges(packageJson: any, coverage: CoverageReport): Badge[] {
    const badges: Badge[] = []

    badges.push({
      label: 'Documentation',
      message: `${coverage.coveragePercentage}%`,
      color: coverage.coveragePercentage >= 80 ? 'brightgreen' : coverage.coveragePercentage >= 50 ? 'yellow' : 'red'
    })

    if (packageJson?.version) {
      badges.push({
        label: 'Version',
        message: packageJson.version,
        color: 'blue'
      })
    }

    if (packageJson?.license) {
      badges.push({
        label: 'License',
        message: packageJson.license,
        color: 'green'
      })
    }

    badges.push({
      label: 'TypeScript',
      message: 'Strict',
      color: 'blue'
    })

    return badges
  }

  /**
   * Generate installation section
   */
  private async generateInstallation(packageJson: any): Promise<string> {
    let section = '```bash\n'
    
    if (packageJson?.name) {
      section += `npm install ${packageJson.name}\n`
      section += '# or\n'
      section += `yarn add ${packageJson.name}\n`
      section += '# or\n'
      section += `pnpm add ${packageJson.name}\n`
    } else {
      section += 'npm install\n'
    }
    
    section += '```\n'
    
    return section
  }

  /**
   * Generate usage section
   */
  private async generateUsage(exportedElements: string[]): Promise<string> {
    const mainExport = exportedElements[0] || 'main'
    
    return `## Usage

\`\`\`typescript
import { ${mainExport} } from 'package-name'

// Basic usage
const result = await ${mainExport}({
  // configuration options
})
\`\`\`

See the [API Reference](#api-reference) for detailed documentation.`
  }

  /**
   * Generate API section
   */
  private generateAPISection(exportedElements: string[]): string {
    let section = '## API Reference\n\n'

    for (const element of exportedElements.slice(0, 10)) {
      section += `### \`${element}\`\n\n`
      section += `See source for detailed documentation.\n\n`
    }

    if (exportedElements.length > 10) {
      section += `\n... and ${exportedElements.length - 10} more exports.\n`
    }

    return section
  }

  /**
   * Generate examples section
   */
  private async generateExamplesSection(elements: string[]): Promise<string> {
    let section = '## Examples\n\n'

    for (const element of elements) {
      const elementData = this.findElement(element)
      if (elementData) {
        try {
          const example = await this.generateCodeExample(elementData)
          section += `### ${element}\n\n`
          section += `\`\`\`${example.language}\n${example.code}\n\`\`\`\n\n`
        } catch {
          section += `### ${element}\n\nSee documentation for examples.\n\n`
        }
      }
    }

    return section
  }

  /**
   * Find element by name
   */
  private findElement(name: string): CodeElement | undefined {
    for (const elements of this.elementCache.values()) {
      for (const element of elements) {
        if (element.name === name) {
          return element
        }
      }
    }
    return undefined
  }

  /**
   * Generate contributing section
   */
  private generateContributing(): string {
    return `## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

Please ensure all tests pass and maintain code coverage.`
  }

  /**
   * Generate table of contents
   */
  private generateTOC(): TableOfContents {
    return {
      items: [
        { title: 'Installation', anchor: 'installation', level: 2 },
        { title: 'Usage', anchor: 'usage', level: 2 },
        { title: 'API Reference', anchor: 'api-reference', level: 2 },
        { title: 'Examples', anchor: 'examples', level: 2 },
        { title: 'Contributing', anchor: 'contributing', level: 2 },
        { title: 'License', anchor: 'license', level: 2 }
      ]
    }
  }

  /**
   * Convert README synthesis to markdown
   */
  toMarkdown(readme: READMESynthesis): string {
    let md = `# ${readme.title}\n\n`
    
    // Badges
    md += readme.badges.map(b => 
      `![${b.label}](https://img.shields.io/badge/${b.label}-${b.message}-${b.color})`
    ).join(' ') + '\n\n'
    
    // Description
    md += `${readme.description}\n\n`
    
    // TOC
    md += '## Table of Contents\n\n'
    for (const item of readme.toc.items) {
      md += `- [${item.title}](#${item.anchor})\n`
    }
    md += '\n'
    
    // Installation
    md += `## Installation\n\n${readme.installation}\n\n`
    
    // Usage
    md += `${readme.usage}\n\n`
    
    // API
    md += `${readme.api}\n`
    
    // Examples
    md += `${readme.examples}\n`
    
    // Contributing
    md += `${readme.contributing}\n\n`
    
    // License
    md += `## License\n\nThis project is licensed under the ${readme.license} License.\n`

    return md
  }

  // ==========================================================================
  // Convenience Methods
  // ==========================================================================

  /**
   * Generate all documentation
   */
  async generateDocumentation(): Promise<DocumentationResult[]> {
    const results: DocumentationResult[] = []
    const startTime = Date.now()

    // Coverage analysis
    results.push({
      success: true,
      type: 'coverage',
      data: await this.analyzeCoverage(),
      warnings: [],
      metadata: {
        processedFiles: this.elementCache.size,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    })

    // Consistency check
    if (this.config.checkConsistency) {
      results.push({
        success: true,
        type: 'consistency',
        data: await this.checkConsistency(),
        warnings: [],
        metadata: {
          processedFiles: this.elementCache.size,
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      })
    }

    // Architecture docs
    results.push({
      success: true,
      type: 'architecture',
      data: await this.generateArchitectureDoc(),
      warnings: [],
      metadata: {
        processedFiles: this.elementCache.size,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    })

    // README
    results.push({
      success: true,
      type: 'readme',
      data: await this.synthesizeREADME(),
      warnings: [],
      metadata: {
        processedFiles: this.elementCache.size,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    })

    return results
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.elementCache.clear()
    this.exampleCache.clear()
    this.initialized = false
  }
}

// ============================================================================
// Singleton and Convenience Functions
// ============================================================================

let instance: DocumentationIntelligence | null = null

/**
 * Get documentation intelligence singleton
 */
export function getDocumentationIntelligence(
  config?: Partial<DocumentationIntelligenceConfig>
): DocumentationIntelligence {
  if (!instance) {
    instance = new DocumentationIntelligence(config)
  }
  return instance
}

/**
 * Convenience function to generate documentation
 */
export async function generateDocumentation(
  projectPath: string,
  options?: Partial<DocumentationIntelligenceConfig>
): Promise<DocumentationResult[]> {
  const intelligence = new DocumentationIntelligence({
    projectPath,
    ...options
  })
  
  await intelligence.initialize()
  return intelligence.generateDocumentation()
}
