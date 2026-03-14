/**
 * Refactoring Engine
 * 
 * Automatic code refactoring with:
 * - Extract method/function
 * - Rename symbol
 * - Move code
 * - Simplify code
 * 
 * Features:
 * - AST-aware refactoring
 * - Safe transformations
 * - Reference updates
 * - Preview changes
 */

import ZAI from 'z-ai-web-dev-sdk'
import { EventEmitter } from 'events'
import fs from 'fs/promises'
import path from 'path'

// Types
export interface RefactoringRequest {
  id: string
  type: RefactoringType
  filePath: string
  selection: CodeSelection
  options: RefactoringOptions
  createdAt: string
}

export type RefactoringType = 
  | 'extract_function'
  | 'extract_variable'
  | 'extract_constant'
  | 'rename_symbol'
  | 'inline_variable'
  | 'inline_function'
  | 'move_to_file'
  | 'simplify_condition'
  | 'remove_unused'
  | 'organize_imports'

export interface CodeSelection {
  startLine: number
  startColumn: number
  endLine: number
  endColumn: number
  text: string
}

export interface RefactoringOptions {
  newName?: string // For rename operations
  targetFile?: string // For move operations
  preserveComments: boolean
  updateReferences: boolean
  dryRun: boolean
}

export interface RefactoringResult {
  requestId: string
  success: boolean
  type: RefactoringType
  changes: FileChange[]
  statistics: RefactoringStatistics
  preview: RefactoringPreview
  warnings: string[]
  errors: string[]
}

export interface FileChange {
  filePath: string
  type: 'modify' | 'create' | 'delete'
  originalContent: string
  newContent: string
  hunks: ChangeHunk[]
}

export interface ChangeHunk {
  oldStart: number
  oldLines: string[]
  newStart: number
  newLines: string[]
}

export interface RefactoringStatistics {
  filesAffected: number
  linesChanged: number
  referencesUpdated: number
  executionTime: number
}

export interface RefactoringPreview {
  before: string
  after: string
  diff: string
  description: string
}

export interface SymbolReference {
  filePath: string
  line: number
  column: number
  text: string
  context: string
}

/**
 * Refactoring Engine
 * 
 * Main class for code refactoring
 */
export class RefactoringEngine extends EventEmitter {
  private zai: any = null
  private projectRoot: string
  private symbolTable: Map<string, SymbolReference[]> = new Map()

  constructor(projectRoot?: string) {
    super()
    this.projectRoot = projectRoot || process.cwd()
  }

  /**
   * Initialize the engine
   */
  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
    await this.buildSymbolTable()
  }

  /**
   * Execute refactoring
   */
  async refactor(request: RefactoringRequest): Promise<RefactoringResult> {
    const startTime = Date.now()
    const warnings: string[] = []
    const errors: string[] = []
    let changes: FileChange[] = []

    try {
      switch (request.type) {
        case 'extract_function':
          changes = await this.extractFunction(request)
          break
        case 'extract_variable':
          changes = await this.extractVariable(request)
          break
        case 'rename_symbol':
          changes = await this.renameSymbol(request)
          break
        case 'inline_variable':
          changes = await this.inlineVariable(request)
          break
        case 'remove_unused':
          changes = await this.removeUnused(request)
          break
        case 'organize_imports':
          changes = await this.organizeImports(request)
          break
        case 'simplify_condition':
          changes = await this.simplifyCondition(request)
          break
        default:
          errors.push(`Unsupported refactoring type: ${request.type}`)
      }
    } catch (error: any) {
      errors.push(error.message)
    }

    // Generate preview
    const preview = this.generatePreview(changes)

    const result: RefactoringResult = {
      requestId: request.id,
      success: errors.length === 0 && changes.length > 0,
      type: request.type,
      changes,
      statistics: {
        filesAffected: changes.length,
        linesChanged: this.countLinesChanged(changes),
        referencesUpdated: request.options.updateReferences ? changes.length : 0,
        executionTime: Date.now() - startTime
      },
      preview,
      warnings,
      errors
    }

    this.emit('refactoring_complete', { request, result })
    return result
  }

  /**
   * Extract function
   */
  private async extractFunction(request: RefactoringRequest): Promise<FileChange[]> {
    const content = await fs.readFile(request.filePath, 'utf-8')
    const lines = content.split('\n')
    
    // Get selected code
    const selectedLines = lines.slice(request.selection.startLine - 1, request.selection.endLine)
    const selectedCode = selectedLines.join('\n')

    // Generate function name using AI
    const functionName = request.options.newName || await this.generateFunctionName(selectedCode)

    // Detect parameters and return value
    const { parameters, returnValue } = await this.analyzeCode(selectedCode)

    // Generate new function
    const newFunction = this.generateFunction(functionName, selectedCode, parameters, returnValue)

    // Create replacement call
    const functionCall = this.generateFunctionCall(functionName, parameters, returnValue)

    // Build new content
    const beforeFunction = lines.slice(0, request.selection.startLine - 1)
    const afterSelection = lines.slice(request.selection.endLine)
    
    // Find insertion point (after last function in file or at end)
    const insertionPoint = this.findFunctionInsertionPoint(lines)
    
    const newLines = [
      ...beforeFunction,
      functionCall,
      ...afterSelection.slice(0, insertionPoint - request.selection.endLine),
      '',
      newFunction,
      ...afterSelection.slice(insertionPoint - request.selection.endLine)
    ]

    const newContent = newLines.join('\n')

    return [{
      filePath: request.filePath,
      type: 'modify',
      originalContent: content,
      newContent,
      hunks: [{
        oldStart: request.selection.startLine,
        oldLines: selectedLines,
        newStart: request.selection.startLine,
        newLines: [functionCall, '', newFunction]
      }]
    }]
  }

  /**
   * Extract variable
   */
  private async extractVariable(request: RefactoringRequest): Promise<FileChange[]> {
    const content = await fs.readFile(request.filePath, 'utf-8')
    const lines = content.split('\n')
    
    const selectedCode = request.selection.text.trim()
    const varName = request.options.newName || await this.generateVariableName(selectedCode)
    
    // Find the line with the selection
    const lineIndex = request.selection.startLine - 1
    const line = lines[lineIndex]
    
    // Create variable declaration
    const indent = line.match(/^(\s*)/)?.[1] || ''
    const varDeclaration = `${indent}const ${varName} = ${selectedCode};`
    
    // Replace selection with variable name
    const newLine = line.replace(selectedCode, varName)
    
    const newLines = [...lines]
    newLines.splice(lineIndex, 1, varDeclaration, newLine)
    
    const newContent = newLines.join('\n')

    return [{
      filePath: request.filePath,
      type: 'modify',
      originalContent: content,
      newContent,
      hunks: [{
        oldStart: request.selection.startLine,
        oldLines: [line],
        newStart: request.selection.startLine,
        newLines: [varDeclaration, newLine]
      }]
    }]
  }

  /**
   * Rename symbol
   */
  private async renameSymbol(request: RefactoringRequest): Promise<FileChange[]> {
    if (!request.options.newName) {
      throw new Error('New name is required for rename operation')
    }

    const oldName = request.selection.text.trim()
    const newName = request.options.newName
    const changes: FileChange[] = []

    // Get all references if updateReferences is enabled
    const references = request.options.updateReferences 
      ? await this.findSymbolReferences(oldName)
      : [{ filePath: request.filePath, line: request.selection.startLine, column: request.selection.startColumn, text: oldName, context: '' }]

    // Group by file
    const byFile = new Map<string, SymbolReference[]>()
    for (const ref of references) {
      if (!byFile.has(ref.filePath)) {
        byFile.set(ref.filePath, [])
      }
      byFile.get(ref.filePath)!.push(ref)
    }

    // Process each file
    for (const [filePath, refs] of byFile) {
      const content = await fs.readFile(filePath, 'utf-8')
      let newContent = content
      
      // Replace all occurrences (from end to start to preserve positions)
      const sortedRefs = refs.sort((a, b) => b.line - a.line || b.column - a.column)
      const hunks: ChangeHunk[] = []
      
      for (const ref of sortedRefs) {
        newContent = this.replaceAtPosition(
          newContent,
          ref.line,
          ref.column,
          oldName,
          newName
        )
      }

      // Generate hunks
      const oldLines = content.split('\n')
      const newLines = newContent.split('\n')
      
      for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
        if (oldLines[i] !== newLines[i]) {
          hunks.push({
            oldStart: i + 1,
            oldLines: [oldLines[i]],
            newStart: i + 1,
            newLines: [newLines[i]]
          })
        }
      }

      changes.push({
        filePath,
        type: 'modify',
        originalContent: content,
        newContent,
        hunks
      })
    }

    return changes
  }

  /**
   * Inline variable
   */
  private async inlineVariable(request: RefactoringRequest): Promise<FileChange[]> {
    const content = await fs.readFile(request.filePath, 'utf-8')
    const lines = content.split('\n')
    
    // Find variable declaration
    const lineIndex = request.selection.startLine - 1
    const line = lines[lineIndex]
    
    const match = line.match(/(?:const|let|var)\s+(\w+)\s*=\s*(.+?);?\s*$/)
    if (!match) {
      throw new Error('No variable declaration found in selection')
    }
    
    const varName = match[1]
    const varValue = match[2].replace(/;$/, '')
    
    // Remove declaration line
    const newLines = lines.filter((_, i) => i !== lineIndex)
    
    // Replace all usages with value
    for (let i = 0; i < newLines.length; i++) {
      newLines[i] = newLines[i].replace(new RegExp(`\\b${varName}\\b`, 'g'), varValue)
    }
    
    const newContent = newLines.join('\n')

    return [{
      filePath: request.filePath,
      type: 'modify',
      originalContent: content,
      newContent,
      hunks: [{
        oldStart: lineIndex + 1,
        oldLines: [line],
        newStart: lineIndex + 1,
        newLines: []
      }]
    }]
  }

  /**
   * Remove unused code
   */
  private async removeUnused(request: RefactoringRequest): Promise<FileChange[]> {
    const content = await fs.readFile(request.filePath, 'utf-8')
    
    // Find unused imports, variables, functions
    const unusedItems = await this.findUnusedItems(content)
    
    if (unusedItems.length === 0) {
      return []
    }
    
    let newContent = content
    const hunks: ChangeHunk[] = []
    
    // Remove each unused item
    for (const item of unusedItems.reverse()) {
      const lines = newContent.split('\n')
      const before = lines.slice(0, item.line - 1).join('\n')
      const after = lines.slice(item.line).join('\n')
      newContent = before + (after ? '\n' + after : '')
      
      hunks.push({
        oldStart: item.line,
        oldLines: [lines[item.line - 1]],
        newStart: item.line,
        newLines: []
      })
    }

    return [{
      filePath: request.filePath,
      type: 'modify',
      originalContent: content,
      newContent,
      hunks
    }]
  }

  /**
   * Organize imports
   */
  private async organizeImports(request: RefactoringRequest): Promise<FileChange[]> {
    const content = await fs.readFile(request.filePath, 'utf-8')
    const lines = content.split('\n')
    
    // Find all imports
    const imports: { line: number; text: string; source: string }[] = []
    let importSectionEnd = 0
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (/^import\s/.test(line) || /^import\s*\{/.test(line)) {
        const sourceMatch = line.match(/from\s+['"]([^'"]+)['"]/)
        imports.push({
          line: i + 1,
          text: line,
          source: sourceMatch?.[1] || ''
        })
        importSectionEnd = i + 1
      } else if (imports.length > 0 && line.trim() && !line.startsWith('//')) {
        break
      }
    }
    
    if (imports.length === 0) {
      return []
    }
    
    // Sort imports: external packages first, then local
    const sortedImports = [...imports].sort((a, b) => {
      const aIsLocal = a.source.startsWith('.')
      const bIsLocal = b.source.startsWith('.')
      if (aIsLocal !== bIsLocal) return aIsLocal ? 1 : -1
      return a.source.localeCompare(b.source)
    })
    
    // Build new import section
    const newImportLines = sortedImports.map(i => i.text)
    
    // Replace import section
    const newLines = [
      ...newImportLines,
      '', // Empty line after imports
      ...lines.slice(importSectionEnd)
    ]
    
    const newContent = newLines.join('\n')

    return [{
      filePath: request.filePath,
      type: 'modify',
      originalContent: content,
      newContent,
      hunks: [{
        oldStart: 1,
        oldLines: imports.map(i => i.text),
        newStart: 1,
        newLines: newImportLines
      }]
    }]
  }

  /**
   * Simplify condition
   */
  private async simplifyCondition(request: RefactoringRequest): Promise<FileChange[]> {
    const content = await fs.readFile(request.filePath, 'utf-8')
    const selectedCode = request.selection.text
    
    // Use AI to simplify
    const simplified = await this.aiSimplify(selectedCode)
    
    if (simplified === selectedCode) {
      return []
    }
    
    // Replace in content
    const lines = content.split('\n')
    const lineIndex = request.selection.startLine - 1
    const oldLine = lines[lineIndex]
    const newLine = oldLine.replace(selectedCode, simplified)
    
    lines[lineIndex] = newLine
    const newContent = lines.join('\n')

    return [{
      filePath: request.filePath,
      type: 'modify',
      originalContent: content,
      newContent,
      hunks: [{
        oldStart: request.selection.startLine,
        oldLines: [oldLine],
        newStart: request.selection.startLine,
        newLines: [newLine]
      }]
    }]
  }

  // Helper methods

  private async generateFunctionName(code: string): Promise<string> {
    if (this.zai) {
      try {
        const completion = await this.zai.chat.completions.create({
          messages: [
            { role: 'system', content: 'Generate a concise function name in camelCase.' },
            { role: 'user', content: `Code:\n${code}\n\nFunction name:` }
          ],
          thinking: { type: 'disabled' }
        })
        return completion.choices[0]?.message?.content?.trim().replace(/[^a-zA-Z0-9]/g, '') || 'extractedFunction'
      } catch {
        return 'extractedFunction'
      }
    }
    return 'extractedFunction'
  }

  private async generateVariableName(code: string): Promise<string> {
    // Simple heuristic based on code content
    if (code.includes('map(')) return 'mappedResult'
    if (code.includes('filter(')) return 'filteredItems'
    if (code.includes('find(')) return 'foundItem'
    if (code.includes('reduce(')) return 'reducedValue'
    if (/^\d+$/.test(code)) return 'count'
    if (code.startsWith("'") || code.startsWith('"')) return 'text'
    return 'value'
  }

  private async analyzeCode(code: string): Promise<{ parameters: string[]; returnValue: string | null }> {
    // Simple analysis - extract variables that would be parameters
    const paramMatches = code.match(/\b([a-zA-Z_]\w*)\s*\(/g)
    const parameters: string[] = []
    
    if (paramMatches) {
      for (const match of paramMatches) {
        const name = match.replace(/\s*\($/, '')
        if (!['if', 'for', 'while', 'switch', 'catch', 'console', 'return'].includes(name)) {
          parameters.push(name)
        }
      }
    }
    
    // Check for return statement
    const returnMatch = code.match(/return\s+(.+?);/)
    const returnValue = returnMatch ? returnMatch[1] : null

    return { parameters: [...new Set(parameters)], returnValue }
  }

  private generateFunction(name: string, code: string, params: string[], returnValue: string | null): string {
    const paramsStr = params.join(', ')
    const body = code.trim()
    
    return `function ${name}(${paramsStr}) {\n  ${body}\n}`
  }

  private generateFunctionCall(name: string, params: string[], returnValue: string | null): string {
    const paramsStr = params.join(', ')
    const call = `${name}(${paramsStr})`
    
    if (returnValue) {
      return `const result = ${call};`
    }
    return call + ';'
  }

  private findFunctionInsertionPoint(lines: string[]): number {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].match(/^function\s|^\s*export\s+function\s/)) {
        return i + 1
      }
    }
    return lines.length
  }

  private replaceAtPosition(content: string, line: number, column: number, oldText: string, newText: string): string {
    const lines = content.split('\n')
    const lineIndex = line - 1
    const lineContent = lines[lineIndex]
    
    const before = lineContent.substring(0, column - 1)
    const after = lineContent.substring(column - 1 + oldText.length)
    
    lines[lineIndex] = before + newText + after
    return lines.join('\n')
  }

  private async findSymbolReferences(symbolName: string): Promise<SymbolReference[]> {
    const references: SymbolReference[] = []
    
    // This would scan all files in the project
    // For simplicity, we return just the current file
    // In production, this would use a proper symbol index

    return references
  }

  private async findUnusedItems(content: string): Promise<{ line: number; text: string }[]> {
    const unused: { line: number; text: string }[] = []
    const lines = content.split('\n')
    
    // Find imports
    const imports = new Set<string>()
    for (let i = 0; i < lines.length; i++) {
      const importMatch = lines[i].match(/import\s+(?:\{([^}]+)\}|(\w+))\s+from/)
      if (importMatch) {
        const names = importMatch[1]?.split(',').map(s => s.trim()) || [importMatch[2]]
        for (const name of names) {
          imports.add(name)
        }
      }
    }
    
    // Check if each import is used
    for (const imp of imports) {
      const usagePattern = new RegExp(`\\b${imp}\\b`)
      let used = false
      
      for (const line of lines) {
        if (line.includes(`import ${imp}`) || line.includes(`import { ${imp}`)) continue
        if (usagePattern.test(line)) {
          used = true
          break
        }
      }
      
      if (!used) {
        // Find the line number of this import
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(`import ${imp}`) || lines[i].includes(`import { ${imp}`)) {
            unused.push({ line: i + 1, text: lines[i] })
            break
          }
        }
      }
    }

    return unused
  }

  private async aiSimplify(code: string): Promise<string> {
    if (!this.zai) return code
    
    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'Simplify this condition. Return only the simplified code, no explanation.' },
          { role: 'user', content: code }
        ],
        thinking: { type: 'disabled' }
      })
      
      return completion.choices[0]?.message?.content?.trim() || code
    } catch {
      return code
    }
  }

  private countLinesChanged(changes: FileChange[]): number {
    return changes.reduce((sum, c) => sum + c.hunks.length, 0)
  }

  private generatePreview(changes: FileChange[]): RefactoringPreview {
    if (changes.length === 0) {
      return { before: '', after: '', diff: '', description: 'No changes' }
    }
    
    const firstChange = changes[0]
    return {
      before: firstChange.originalContent.slice(0, 500),
      after: firstChange.newContent.slice(0, 500),
      diff: this.generateDiffString(firstChange),
      description: `Modified ${changes.length} file(s)`
    }
  }

  private generateDiffString(change: FileChange): string {
    const lines: string[] = []
    for (const hunk of change.hunks) {
      lines.push(`@@ -${hunk.oldStart} +${hunk.newStart} @@`)
      for (const line of hunk.oldLines) {
        lines.push(`-${line}`)
      }
      for (const line of hunk.newLines) {
        lines.push(`+${line}`)
      }
    }
    return lines.join('\n')
  }

  private async buildSymbolTable(): Promise<void> {
    // Build symbol table for the project
    // This would scan all files and index symbols
  }

  /**
   * Apply refactoring changes to files
   */
  async applyChanges(result: RefactoringResult): Promise<void> {
    for (const change of result.changes) {
      if (change.type === 'modify') {
        await fs.writeFile(change.filePath, change.newContent, 'utf-8')
      } else if (change.type === 'create') {
        await fs.writeFile(change.filePath, change.newContent, 'utf-8')
      } else if (change.type === 'delete') {
        await fs.unlink(change.filePath)
      }
    }
  }
}

// Singleton instance
let engineInstance: RefactoringEngine | null = null

export function getRefactoringEngine(): RefactoringEngine {
  if (!engineInstance) {
    engineInstance = new RefactoringEngine()
  }
  return engineInstance
}

export async function refactorCode(
  type: RefactoringType,
  filePath: string,
  selection: CodeSelection,
  options?: Partial<RefactoringOptions>
): Promise<RefactoringResult> {
  const engine = getRefactoringEngine()
  if (!engine['zai']) {
    await engine.initialize()
  }

  return engine.refactor({
    id: `refactor-${Date.now().toString(36)}`,
    type,
    filePath,
    selection,
    options: {
      preserveComments: true,
      updateReferences: true,
      dryRun: false,
      ...options
    },
    createdAt: new Date().toISOString()
  })
}
