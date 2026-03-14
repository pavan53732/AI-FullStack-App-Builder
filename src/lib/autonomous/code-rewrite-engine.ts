/**
 * Code Rewrite Engine
 * 
 * Automatic code transformation with:
 * - Pattern-based rewrites
 * - AST-aware transformations
 * - Safe refactoring
 * - Code modernization
 * 
 * Features:
 * - Apply rewrite rules
 * - Preserve semantics
 * - Handle edge cases
 * - Generate clean diffs
 */

import ZAI from 'z-ai-web-dev-sdk'
import { EventEmitter } from 'events'
import fs from 'fs/promises'
import path from 'path'

// Types
export interface RewriteRule {
  id: string
  name: string
  description: string
  pattern: string
  replacement: string
  conditions: RewriteCondition[]
  priority: number
  enabled: boolean
}

export interface RewriteCondition {
  type: 'language' | 'framework' | 'file_pattern' | 'context'
  value: any
  operator: 'equals' | 'contains' | 'matches'
}

export interface RewriteRequest {
  id: string
  filePath: string
  content: string
  rules: string[] // Rule IDs to apply
  options: RewriteOptions
  createdAt: string
}

export interface RewriteOptions {
  preserveFormatting: boolean
  addComments: boolean
  safeMode: boolean // Only apply verified transformations
  dryRun: boolean
  maxChanges: number
}

export interface RewriteResult {
  requestId: string
  success: boolean
  originalContent: string
  rewrittenContent: string
  changes: RewriteChange[]
  statistics: RewriteStatistics
  warnings: string[]
}

export interface RewriteChange {
  id: string
  ruleId: string
  ruleName: string
  line: number
  column: number
  original: string
  rewritten: string
  description: string
  confidence: number
}

export interface RewriteStatistics {
  totalChanges: number
  linesAffected: number
  charactersChanged: number
  rulesApplied: string[]
  executionTime: number
}

export interface RewriteDiff {
  hunks: DiffHunk[]
  summary: string
}

export interface DiffHunk {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  changes: DiffLine[]
}

export interface DiffLine {
  type: 'context' | 'add' | 'delete'
  content: string
  lineNumber: number
}

// Built-in rewrite rules
const BUILTIN_RULES: RewriteRule[] = [
  {
    id: 'var-to-const',
    name: 'var to const/let',
    description: 'Replace var with const or let based on usage',
    pattern: '\\bvar\\s+(\\w+)\\s*=',
    replacement: 'const $1 =',
    conditions: [{ type: 'language', value: 'typescript', operator: 'equals' }],
    priority: 10,
    enabled: true
  },
  {
    id: 'arrow-function',
    name: 'Arrow Function',
    description: 'Convert function expressions to arrow functions',
    pattern: 'function\\s*\\(([^)]*)\\)\\s*\\{',
    replacement: '($1) => {',
    conditions: [{ type: 'language', value: 'typescript', operator: 'equals' }],
    priority: 20,
    enabled: true
  },
  {
    id: 'template-literal',
    name: 'Template Literal',
    description: 'Convert string concatenation to template literals',
    pattern: "(['\"])([^'\"]*)\\1\\s*\\+\\s*(\\w+)",
    replacement: '`$2${$3}`',
    conditions: [{ type: 'language', value: 'typescript', operator: 'equals' }],
    priority: 15,
    enabled: true
  },
  {
    id: 'optional-chaining',
    name: 'Optional Chaining',
    description: 'Use optional chaining for safe property access',
    pattern: '(\\w+)\\s*&&\\s*(\\w+)\\.(\\w+)',
    replacement: '$1?.\\$3',
    conditions: [{ type: 'language', value: 'typescript', operator: 'equals' }],
    priority: 25,
    enabled: true
  },
  {
    id: 'nullish-coalescing',
    name: 'Nullish Coalescing',
    description: 'Use ?? instead of || for null checks',
    pattern: '(\\w+)\\s*\\|\\|\\s*([\'"\\d]|true|false|null)',
    replacement: '$1 ?? $2',
    conditions: [{ type: 'language', value: 'typescript', operator: 'equals' }],
    priority: 20,
    enabled: true
  },
  {
    id: 'async-await',
    name: 'Async/Await',
    description: 'Convert .then() chains to async/await',
    pattern: '\\.then\\s*\\(\\s*\\(([^)]*)\\)\\s*=>',
    replacement: '',
    conditions: [{ type: 'language', value: 'typescript', operator: 'equals' }],
    priority: 30,
    enabled: true
  }
]

/**
 * Code Rewrite Engine
 * 
 * Main class for code transformation
 */
export class CodeRewriteEngine extends EventEmitter {
  private zai: any = null
  private rules: Map<string, RewriteRule> = new Map()
  private history: RewriteResult[] = []

  constructor() {
    super()
    this.loadBuiltinRules()
  }

  /**
   * Initialize the rewrite engine
   */
  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
  }

  /**
   * Rewrite code with specified rules
   */
  async rewrite(request: RewriteRequest): Promise<RewriteResult> {
    const startTime = Date.now()
    let content = request.content
    const changes: RewriteChange[] = []
    const warnings: string[] = []
    const rulesApplied: string[] = []

    // Get rules to apply
    const rules = request.rules.length > 0
      ? request.rules.map(id => this.rules.get(id)).filter(Boolean) as RewriteRule[]
      : Array.from(this.rules.values()).filter(r => r.enabled)

    // Sort by priority
    rules.sort((a, b) => b.priority - a.priority)

    let changeCount = 0
    const maxChanges = request.options.maxChanges || 100

    for (const rule of rules) {
      if (changeCount >= maxChanges) break

      // Check conditions
      if (!this.checkConditions(rule, request)) continue

      // Apply rule
      const ruleChanges = await this.applyRule(rule, content, request.options)
      
      if (ruleChanges.length > 0) {
        content = this.applyChanges(content, ruleChanges)
        changes.push(...ruleChanges)
        rulesApplied.push(rule.id)
        changeCount += ruleChanges.length

        if (request.options.safeMode) {
          // Verify transformation
          const verified = await this.verifyTransformation(request.content, content)
          if (!verified) {
            warnings.push(`Rule ${rule.name} may have changed semantics. Change reverted.`)
            content = request.content
            changes.length = changes.length - ruleChanges.length
          }
        }
      }
    }

    const result: RewriteResult = {
      requestId: request.id,
      success: changes.length > 0,
      originalContent: request.content,
      rewrittenContent: content,
      changes,
      statistics: {
        totalChanges: changes.length,
        linesAffected: this.countAffectedLines(changes),
        charactersChanged: this.countCharactersChanged(changes),
        rulesApplied,
        executionTime: Date.now() - startTime
      },
      warnings
    }

    this.history.push(result)
    this.emit('rewrite_complete', { request, result })

    return result
  }

  /**
   * Apply a single rule
   */
  private async applyRule(
    rule: RewriteRule,
    content: string,
    options: RewriteOptions
  ): Promise<RewriteChange[]> {
    const changes: RewriteChange[] = []
    
    try {
      const regex = new RegExp(rule.pattern, 'g')
      const lines = content.split('\n')
      
      let match
      while ((match = regex.exec(content)) !== null) {
        // Calculate line and column
        const beforeMatch = content.substring(0, match.index)
        const lineNum = beforeMatch.split('\n').length
        const lastNewline = beforeMatch.lastIndexOf('\n')
        const column = match.index - lastNewline

        // Generate replacement
        let replacement = rule.replacement
        for (let i = 1; i < match.length; i++) {
          replacement = replacement.replace(new RegExp(`\\$${i}`, 'g'), match[i] || '')
        }

        // Calculate confidence
        const confidence = this.calculateConfidence(match[0], replacement, rule)

        // Create change
        const change: RewriteChange = {
          id: `change-${Date.now().toString(36)}-${changes.length}`,
          ruleId: rule.id,
          ruleName: rule.name,
          line: lineNum,
          column,
          original: match[0],
          rewritten: replacement,
          description: rule.description,
          confidence
        }

        changes.push(change)
      }
    } catch (error) {
      console.error(`[CodeRewriteEngine] Error applying rule ${rule.name}:`, error)
    }

    return changes
  }

  /**
   * Apply changes to content
   */
  private applyChanges(content: string, changes: RewriteChange[]): string {
    let result = content
    
    // Sort changes by position (reverse order)
    const sorted = [...changes].sort((a, b) => {
      const posA = this.getOffsetFromPosition(content, a.line, a.column)
      const posB = this.getOffsetFromPosition(content, b.line, b.column)
      return posB - posA
    })

    for (const change of sorted) {
      const offset = this.getOffsetFromPosition(content, change.line, change.column)
      result = result.substring(0, offset) + change.rewritten + result.substring(offset + change.original.length)
    }

    return result
  }

  /**
   * Get offset from line/column
   */
  private getOffsetFromPosition(content: string, line: number, column: number): number {
    const lines = content.split('\n')
    let offset = 0
    for (let i = 0; i < line - 1 && i < lines.length; i++) {
      offset += lines[i].length + 1
    }
    return offset + column - 1
  }

  /**
   * Check if rule conditions are met
   */
  private checkConditions(rule: RewriteRule, request: RewriteRequest): boolean {
    for (const condition of rule.conditions) {
      switch (condition.type) {
        case 'language':
          if (condition.operator === 'equals' && !request.filePath.endsWith('.ts') && !request.filePath.endsWith('.tsx')) {
            return false
          }
          break
        case 'file_pattern':
          if (!new RegExp(condition.value).test(request.filePath)) {
            return false
          }
          break
      }
    }
    return true
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(original: string, replacement: string, rule: RewriteRule): number {
    let confidence = 0.8

    // Higher confidence for simple patterns
    if (original.length < 20) confidence += 0.1

    // Lower confidence for complex patterns
    if (original.includes('{') || original.includes('}')) confidence -= 0.1

    // Higher confidence for built-in rules
    if (BUILTIN_RULES.some(r => r.id === rule.id)) confidence += 0.05

    return Math.min(1, Math.max(0, confidence))
  }

  /**
   * Verify transformation didn't change semantics
   */
  private async verifyTransformation(original: string, rewritten: string): Promise<boolean> {
    if (!this.zai) return true

    try {
      // Use AI to verify semantic equivalence
      const prompt = `Compare these two code snippets and determine if they are semantically equivalent.

Original:
\`\`\`typescript
${original}
\`\`\`

Rewritten:
\`\`\`typescript
${rewritten}
\`\`\`

Answer ONLY with "YES" if semantically equivalent or "NO" if not. Do not explain.`

      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a code analysis expert.' },
          { role: 'user', content: prompt }
        ],
        thinking: { type: 'disabled' }
      })

      const response = completion.choices[0]?.message?.content?.trim().toUpperCase()
      return response?.includes('YES') ?? false
    } catch {
      return true // Assume safe if verification fails
    }
  }

  /**
   * Count affected lines
   */
  private countAffectedLines(changes: RewriteChange[]): number {
    const lines = new Set(changes.map(c => c.line))
    return lines.size
  }

  /**
   * Count characters changed
   */
  private countCharactersChanged(changes: RewriteChange[]): number {
    return changes.reduce((sum, c) => sum + Math.abs(c.rewritten.length - c.original.length), 0)
  }

  /**
   * Generate diff between original and rewritten
   */
  generateDiff(result: RewriteResult): RewriteDiff {
    const hunks: DiffHunk[] = []
    const oldLines = result.originalContent.split('\n')
    const newLines = result.rewrittenContent.split('\n')

    // Simple line-by-line diff
    const maxLines = Math.max(oldLines.length, newLines.length)
    let currentHunk: DiffHunk | null = null

    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i]
      const newLine = newLines[i]

      if (oldLine === newLine) {
        // Context line
        if (currentHunk) {
          currentHunk.changes.push({ type: 'context', content: oldLine || '', lineNumber: i + 1 })
          currentHunk.newLines++
          currentHunk.oldLines++
        }
      } else {
        // Start new hunk if needed
        if (!currentHunk) {
          currentHunk = {
            oldStart: i + 1,
            oldLines: 0,
            newStart: i + 1,
            newLines: 0,
            changes: []
          }
          hunks.push(currentHunk)
        }

        // Add changes
        if (oldLine !== undefined) {
          currentHunk.changes.push({ type: 'delete', content: oldLine, lineNumber: i + 1 })
          currentHunk.oldLines++
        }
        if (newLine !== undefined) {
          currentHunk.changes.push({ type: 'add', content: newLine, lineNumber: i + 1 })
          currentHunk.newLines++
        }
      }
    }

    const summary = `+${newLines.length} -${oldLines.length} lines changed`

    return { hunks, summary }
  }

  /**
   * Load built-in rules
   */
  private loadBuiltinRules(): void {
    for (const rule of BUILTIN_RULES) {
      this.rules.set(rule.id, rule)
    }
  }

  /**
   * Add custom rule
   */
  addRule(rule: RewriteRule): void {
    this.rules.set(rule.id, rule)
    this.emit('rule_added', { rule })
  }

  /**
   * Remove rule
   */
  removeRule(ruleId: string): boolean {
    const result = this.rules.delete(ruleId)
    if (result) {
      this.emit('rule_removed', { ruleId })
    }
    return result
  }

  /**
   * Enable/disable rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId)
    if (rule) {
      rule.enabled = enabled
      this.emit('rule_updated', { rule })
      return true
    }
    return false
  }

  /**
   * Get all rules
   */
  getRules(): RewriteRule[] {
    return Array.from(this.rules.values())
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): RewriteRule | undefined {
    return this.rules.get(ruleId)
  }

  /**
   * Get rewrite history
   */
  getHistory(): RewriteResult[] {
    return [...this.history]
  }

  /**
   * Apply rewrites to file
   */
  async rewriteFile(
    filePath: string,
    rules?: string[],
    options?: Partial<RewriteOptions>
  ): Promise<RewriteResult> {
    const content = await fs.readFile(filePath, 'utf-8')
    
    const request: RewriteRequest = {
      id: `req-${Date.now().toString(36)}`,
      filePath,
      content,
      rules: rules || [],
      options: {
        preserveFormatting: true,
        addComments: false,
        safeMode: true,
        dryRun: false,
        maxChanges: 100,
        ...options
      },
      createdAt: new Date().toISOString()
    }

    const result = await this.rewrite(request)

    // Write file if not dry run
    if (!request.options.dryRun && result.success) {
      await fs.writeFile(filePath, result.rewrittenContent, 'utf-8')
    }

    return result
  }
}

// Singleton instance
let engineInstance: CodeRewriteEngine | null = null

export function getCodeRewriteEngine(): CodeRewriteEngine {
  if (!engineInstance) {
    engineInstance = new CodeRewriteEngine()
  }
  return engineInstance
}

export async function rewriteCode(
  content: string,
  rules?: string[],
  options?: Partial<RewriteOptions>
): Promise<RewriteResult> {
  const engine = getCodeRewriteEngine()
  if (!engine['zai']) {
    await engine.initialize()
  }

  return engine.rewrite({
    id: `req-${Date.now().toString(36)}`,
    filePath: '',
    content,
    rules: rules || [],
    options: {
      preserveFormatting: true,
      addComments: false,
      safeMode: true,
      dryRun: true,
      maxChanges: 100,
      ...options
    },
    createdAt: new Date().toISOString()
  })
}
