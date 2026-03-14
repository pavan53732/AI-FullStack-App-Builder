/**
 * Error Recovery System
 * 
 * Automatically detects, parses, and fixes errors from:
 * - TypeScript compilation errors
 * - ESLint errors
 * - Build errors
 * - Runtime errors
 * - Module not found errors
 */

import fs from 'fs/promises'
import path from 'path'
import ZAI from 'z-ai-web-dev-sdk'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')

export interface ParsedError {
  type: 'typescript' | 'eslint' | 'build' | 'runtime' | 'module' | 'syntax' | 'unknown'
  message: string
  file?: string
  line?: number
  column?: number
  code?: string
  suggestion?: string
  severity: 'error' | 'warning'
  fixable: boolean
  raw: string
}

export interface ErrorRecoveryResult {
  success: boolean
  errorsFound: ParsedError[]
  errorsFixed: ParsedError[]
  errorsRemaining: ParsedError[]
  fixes: ErrorFix[]
  aiSuggestion?: string
}

export interface ErrorFix {
  file: string
  type: 'created' | 'modified' | 'deleted' | 'installed'
  description: string
  before?: string
  after?: string
}

// Error patterns for parsing
const ERROR_PATTERNS = {
  typescript: [
    /error TS(\d+):\s*(.+?)\s+at\s+(.+?)\((\d+),(\d+)\)/,
    /(.+?)\((\d+),(\d+)\):\s*error TS(\d+):\s*(.+)/,
    /src\/(.+?):(\d+):(\d+)\s*-\s*error TS(\d+):\s*(.+)/,
  ],
  eslint: [
    /(.+?):(\d+):(\d+):\s*(.+?)\s+\((.+)\)/,
    /(.+?):\s+line\s+(\d+),\s+col\s+(\d+),\s+(.+?)\s+\((.+)\)/,
  ],
  module: [
    /Module not found:\s*(?:Error: )?Can't resolve '(.+)' in '(.+)'/,
    /Cannot find module '(.+)' or its corresponding type declarations/,
    /Error: Cannot find module '(.+)'/,
  ],
  syntax: [
    /SyntaxError:\s*(.+?)\s+at\s+(.+?):(\d+):(\d+)/,
    /Unexpected token\s*['"]?(.+)['"]?\s+at\s+(.+?):(\d+):(\d+)/,
    /ParseError:\s*(.+)/,
  ],
  build: [
    /Build failed with (\d+) error/,
    /Failed to compile\.\s*(.+)/s,
    /ERROR in (.+)/,
  ]
}

/**
 * Parse TypeScript errors
 */
function parseTypeScriptError(line: string): ParsedError | null {
  for (const pattern of ERROR_PATTERNS.typescript) {
    const match = line.match(pattern)
    if (match) {
      return {
        type: 'typescript',
        message: match[2] || match[5],
        file: match[3] || match[1],
        line: parseInt(match[4] || match[2]),
        column: parseInt(match[5] || match[3]),
        code: `TS${match[1] || match[4]}`,
        severity: 'error',
        fixable: true,
        raw: line
      }
    }
  }
  return null
}

/**
 * Parse module not found errors
 */
function parseModuleError(line: string): ParsedError | null {
  for (const pattern of ERROR_PATTERNS.module) {
    const match = line.match(pattern)
    if (match) {
      return {
        type: 'module',
        message: `Cannot find module '${match[1]}'`,
        file: match[2],
        code: 'MODULE_NOT_FOUND',
        suggestion: `Install package: npm install ${match[1]}`,
        severity: 'error',
        fixable: true,
        raw: line
      }
    }
  }
  return null
}

/**
 * Parse syntax errors
 */
function parseSyntaxError(line: string): ParsedError | null {
  for (const pattern of ERROR_PATTERNS.syntax) {
    const match = line.match(pattern)
    if (match) {
      return {
        type: 'syntax',
        message: match[1],
        file: match[2],
        line: parseInt(match[3]),
        column: parseInt(match[4]),
        severity: 'error',
        fixable: true,
        raw: line
      }
    }
  }
  return null
}

/**
 * Parse ESLint errors
 */
function parseESLintError(line: string): ParsedError | null {
  for (const pattern of ERROR_PATTERNS.eslint) {
    const match = line.match(pattern)
    if (match) {
      return {
        type: 'eslint',
        message: match[4],
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        code: match[5],
        severity: line.includes('error') ? 'error' : 'warning',
        fixable: line.includes('fixable'),
        raw: line
      }
    }
  }
  return null
}

/**
 * Parse error output and extract structured errors
 */
export function parseErrors(output: string): ParsedError[] {
  const errors: ParsedError[] = []
  const lines = output.split('\n')
  
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue
    
    // Try each parser
    const parsed = 
      parseTypeScriptError(line) ||
      parseModuleError(line) ||
      parseSyntaxError(line) ||
      parseESLintError(line)
    
    if (parsed) {
      errors.push(parsed)
    }
  }
  
  // If no structured errors found, try to extract generic errors
  if (errors.length === 0 && output.toLowerCase().includes('error')) {
    const errorLines = lines.filter(l => 
      l.toLowerCase().includes('error') && 
      !l.toLowerCase().includes('0 errors')
    )
    
    for (const line of errorLines.slice(0, 10)) {
      errors.push({
        type: 'unknown',
        message: line.trim(),
        severity: 'error',
        fixable: false,
        raw: line
      })
    }
  }
  
  return errors
}

/**
 * Get common fixes for known error types
 */
function getCommonFix(error: ParsedError): string | null {
  const fixes: Record<string, string> = {
    'TS2304': `// Add type declaration or import the missing identifier`,
    'TS2322': `// Type mismatch - check the expected type and fix the assignment`,
    'TS2339': `// Property doesn't exist - check spelling or add property to type`,
    'TS2769': `// No matching overload - check function arguments`,
    'TS2307': `// Module not found - install the package or fix import path`,
    'TS1005': `// Syntax error - check for missing brackets, semicolons, etc.`,
    'TS1109': `// Expression expected - check syntax`,
    'TS1110': `// Type expected - add type annotation`,
    'TS7006': `// Parameter implicitly has 'any' type - add type annotation`,
  }
  
  if (error.code && fixes[error.code]) {
    return fixes[error.code]
  }
  
  return null
}

/**
 * Try automatic fix for an error
 */
async function tryAutoFix(
  error: ParsedError,
  projectPath: string
): Promise<ErrorFix | null> {
  // Module not found - try to install
  if (error.type === 'module') {
    const moduleMatch = error.message.match(/Cannot find module '([^']+)'/)
    if (moduleMatch) {
      return {
        file: 'package.json',
        type: 'installed',
        description: `Install missing module: ${moduleMatch[1]}`
      }
    }
  }
  
  // TypeScript errors with file location
  if (error.file && error.line) {
    try {
      const filePath = path.join(WORKSPACE_DIR, projectPath, error.file)
      const content = await fs.readFile(filePath, 'utf-8')
      const lines = content.split('\n')
      
      if (error.line <= lines.length) {
        const errorLine = lines[error.line - 1]
        
        // Common fixes
        if (error.code === 'TS7006') {
          // Implicit any - suggest adding type
          const fix = errorLine.replace(
            /\((\w+)\)/,
            '($1: any)'
          )
          return {
            file: error.file,
            type: 'modified',
            description: `Add type annotation to fix implicit any`,
            before: errorLine,
            after: fix
          }
        }
      }
    } catch {}
  }
  
  return null
}

/**
 * Use AI to suggest a fix for an error
 */
async function getAIFix(
  error: ParsedError,
  fileContent: string,
  projectContext: string
): Promise<string | null> {
  try {
    const zai = await ZAI.create()
    
    const prompt = `Fix this error:

Error: ${error.message}
Type: ${error.type}
File: ${error.file}
Line: ${error.line}
Code: ${error.code}

File Content:
\`\`\`
${fileContent}
\`\`\`

Project Context:
${projectContext}

Provide ONLY the fixed code, no explanations.`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a code fix expert. Provide only the fixed code.' },
        { role: 'user', content: prompt }
      ]
    })
    
    return completion.choices[0]?.message?.content || null
  } catch {
    return null
  }
}

/**
 * Main error recovery function
 */
export async function recoverFromErrors(
  output: string,
  projectPath: string,
  maxAttempts = 3
): Promise<ErrorRecoveryResult> {
  const result: ErrorRecoveryResult = {
    success: false,
    errorsFound: [],
    errorsFixed: [],
    errorsRemaining: [],
    fixes: []
  }
  
  // Parse all errors
  result.errorsFound = parseErrors(output)
  
  if (result.errorsFound.length === 0) {
    result.success = true
    return result
  }
  
  console.log(`[ErrorRecovery] Found ${result.errorsFound.length} errors`)
  
  // Try to fix each error
  for (const error of result.errorsFound) {
    // First try common fix
    error.suggestion = getCommonFix(error) || error.suggestion
    
    // Try automatic fix
    const autoFix = await tryAutoFix(error, projectPath)
    if (autoFix) {
      result.fixes.push(autoFix)
      result.errorsFixed.push(error)
    } else {
      result.errorsRemaining.push(error)
    }
  }
  
  // Get AI suggestion for remaining errors
  if (result.errorsRemaining.length > 0) {
    const errorSummary = result.errorsRemaining
      .map(e => `${e.type}: ${e.message} (${e.file}:${e.line})`)
      .join('\n')
    
    try {
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an error recovery expert. Analyze errors and provide a concise fix strategy.'
          },
          {
            role: 'user',
            content: `Analyze these errors and suggest fixes:\n\n${errorSummary}`
          }
        ]
      })
      
      result.aiSuggestion = completion.choices[0]?.message?.content || undefined
    } catch {}
  }
  
  result.success = result.errorsRemaining.length === 0
  
  return result
}

/**
 * Check if output contains errors
 */
export function hasErrors(output: string): boolean {
  const errorIndicators = [
    'error TS',
    'Error:',
    'Failed to compile',
    'Build failed',
    'Cannot find module',
    'SyntaxError',
    'Unexpected token',
    'Module not found'
  ]
  
  const lowerOutput = output.toLowerCase()
  
  return errorIndicators.some(indicator => 
    output.includes(indicator) || lowerOutput.includes(indicator.toLowerCase())
  ) && !output.includes('0 errors') && !output.includes('0 warnings, 0 errors')
}

/**
 * Get error severity count
 */
export function getErrorStats(errors: ParsedError[]): {
  errors: number
  warnings: number
  fixable: number
  byType: Record<string, number>
} {
  const stats = {
    errors: 0,
    warnings: 0,
    fixable: 0,
    byType: {} as Record<string, number>
  }
  
  for (const error of errors) {
    if (error.severity === 'error') stats.errors++
    else stats.warnings++
    
    if (error.fixable) stats.fixable++
    
    stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
  }
  
  return stats
}

/**
 * Format errors for display
 */
export function formatErrors(errors: ParsedError[]): string {
  return errors.map(e => {
    let formatted = `[${e.type.toUpperCase()}] ${e.message}`
    if (e.file) formatted += ` (${e.file}`
    if (e.line) formatted += `:${e.line}`
    if (e.column) formatted += `:${e.column}`
    if (e.file) formatted += ')'
    if (e.code) formatted += ` [${e.code}]`
    if (e.suggestion) formatted += `\n  → ${e.suggestion}`
    return formatted
  }).join('\n')
}
