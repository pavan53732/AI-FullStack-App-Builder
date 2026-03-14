/**
 * Context Manager
 * 
 * Smart context management for AI:
 * - Determines which files are relevant to current task
 * - Manages token budgets
 * - Builds minimal but sufficient context
 */

import fs from 'fs/promises'
import path from 'path'
import { loadIndex, getRelevantFiles, findByExport, findByFunction, FileIndex } from './indexer'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')

export interface ContextOptions {
  maxTokens?: number
  includeFiles?: string[]
  excludeFiles?: string[]
  focusOnTask?: string
  includePackageJson?: boolean
  includeReadme?: boolean
  includeConfigFiles?: boolean
  maxFileSize?: number
}

export interface FileContext {
  path: string
  content: string
  importance: number // 0-10
  reason: string
  tokens: number
}

export interface BuildContextResult {
  files: FileContext[]
  totalTokens: number
  projectStructure: string
  relevantExports: string[]
  relevantFunctions: string[]
  summary: string
}

// Approximate tokens per character (rough estimate)
const CHARS_PER_TOKEN = 4

/**
 * Estimate tokens in a string
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

/**
 * Read file content with size limit
 */
async function readFileContent(
  filePath: string,
  maxSize = 50000
): Promise<string> {
  try {
    const fullPath = path.join(WORKSPACE_DIR, filePath)
    const content = await fs.readFile(fullPath, 'utf-8')
    
    if (content.length > maxSize) {
      // Return truncated with marker
      return content.slice(0, maxSize) + '\n... [TRUNCATED]'
    }
    
    return content
  } catch {
    return ''
  }
}

/**
 * Get project structure as string
 */
async function getProjectStructure(projectPath?: string): Promise<string> {
  const index = await loadIndex()
  if (!index) return 'No project indexed yet'
  
  const buildTree = (nodes: typeof index.fileTree, indent = 0): string => {
    return nodes.map(node => {
      const prefix = '  '.repeat(indent)
      const icon = node.type === 'folder' ? '📁' : '📄'
      let result = `${prefix}${icon} ${node.name}\n`
      if (node.children) {
        result += buildTree(node.children, indent + 1)
      }
      return result
    }).join('')
  }
  
  return buildTree(index.fileTree)
}

/**
 * Calculate file importance score
 */
function calculateImportance(
  file: FileIndex,
  taskKeywords: string[],
  options: ContextOptions
): number {
  let score = 5 // Base score
  
  // Check path relevance
  for (const keyword of taskKeywords) {
    if (file.path.toLowerCase().includes(keyword.toLowerCase())) {
      score += 2
    }
  }
  
  // Entry points are important
  const entryPoints = ['index', 'main', 'app', 'server']
  const fileName = file.path.split('/').pop()?.toLowerCase() || ''
  if (entryPoints.some(ep => fileName.includes(ep))) {
    score += 3
  }
  
  // Config files
  if (file.path.includes('config') || file.path.endsWith('.config.ts')) {
    score += 1
  }
  
  // Component files for UI tasks
  if (taskKeywords.some(k => ['ui', 'component', 'page', 'view'].includes(k))) {
    if (file.path.includes('component') || file.path.includes('page')) {
      score += 2
    }
  }
  
  // API files for backend tasks
  if (taskKeywords.some(k => ['api', 'backend', 'server', 'route'].includes(k))) {
    if (file.path.includes('api') || file.path.includes('route') || file.path.includes('server')) {
      score += 2
    }
  }
  
  // Excluded files get 0
  if (options.excludeFiles?.some(ex => file.path.includes(ex))) {
    score = 0
  }
  
  // Included files get boost
  if (options.includeFiles?.some(inc => file.path.includes(inc))) {
    score += 3
  }
  
  return Math.min(10, Math.max(0, score))
}

/**
 * Build context for AI
 */
export async function buildContext(
  task: string,
  projectPath?: string,
  options: ContextOptions = {}
): Promise<BuildContextResult> {
  const {
    maxTokens = 8000,
    includeFiles = [],
    excludeFiles = ['node_modules', '.next', 'dist', 'build', '.git'],
    includePackageJson = true,
    includeReadme = true,
    includeConfigFiles = true,
    maxFileSize = 30000
  } = options
  
  const result: BuildContextResult = {
    files: [],
    totalTokens: 0,
    projectStructure: '',
    relevantExports: [],
    relevantFunctions: [],
    summary: ''
  }
  
  // Get project structure
  result.projectStructure = await getProjectStructure(projectPath)
  result.totalTokens += estimateTokens(result.projectStructure)
  
  // Extract keywords from task
  const taskKeywords = task
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2)
  
  // Get file index
  const index = await loadIndex()
  
  if (index) {
    // Find relevant files using the indexer
    const relevantFiles = await getRelevantFiles(task, 20)
    
    // Calculate importance for all files
    const scoredFiles = index.files
      .filter(f => f.type === 'file')
      .map(file => ({
        file,
        importance: calculateImportance(file, taskKeywords, options)
      }))
      .sort((a, b) => b.importance - a.importance)
    
    // Always include certain files
    const alwaysInclude = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'next.config.js',
      'README.md'
    ]
    
    // Build file context within token budget
    for (const { file, importance } of scoredFiles) {
      if (result.totalTokens >= maxTokens) break
      
      // Skip low importance files
      if (importance < 3 && !alwaysInclude.some(ai => file.path.includes(ai))) {
        continue
      }
      
      // Skip excluded
      if (excludeFiles.some(ex => file.path.includes(ex))) {
        continue
      }
      
      // Read content
      const content = await readFileContent(file.path, maxFileSize)
      if (!content) continue
      
      const tokens = estimateTokens(content)
      
      // Check if adding would exceed budget
      if (result.totalTokens + tokens > maxTokens) {
        // Try to include a truncated version
        const remaining = maxTokens - result.totalTokens
        if (remaining > 500) {
          const truncated = content.slice(0, remaining * CHARS_PER_TOKEN)
          result.files.push({
            path: file.path,
            content: truncated + '\n... [TRUNCATED]',
            importance,
            reason: `Matched task keywords: ${taskKeywords.filter(k => file.path.toLowerCase().includes(k)).join(', ')}`,
            tokens: estimateTokens(truncated)
          })
          result.totalTokens += estimateTokens(truncated)
        }
        break
      }
      
      result.files.push({
        path: file.path,
        content,
        importance,
        reason: `Score: ${importance}/10`,
        tokens
      })
      result.totalTokens += tokens
    }
  }
  
  // Build summary
  result.summary = buildSummary(result, task)
  
  return result
}

/**
 * Build a summary of the context
 */
function buildSummary(context: BuildContextResult, task: string): string {
  const lines: string[] = []
  
  lines.push('## Project Context Summary')
  lines.push('')
  lines.push(`Task: ${task}`)
  lines.push('')
  lines.push(`Total Files in Context: ${context.files.length}`)
  lines.push(`Estimated Tokens: ${context.totalTokens}`)
  lines.push('')
  
  if (context.files.length > 0) {
    lines.push('### Files Included:')
    for (const file of context.files.slice(0, 10)) {
      lines.push(`- ${file.path} (importance: ${file.importance}/10)`)
    }
    if (context.files.length > 10) {
      lines.push(`- ... and ${context.files.length - 10} more files`)
    }
  }
  
  return lines.join('\n')
}

/**
 * Get minimal context for a quick action
 */
export async function getMinimalContext(
  filePath: string,
  includeImports = true
): Promise<string> {
  const content = await readFileContent(filePath)
  
  if (!includeImports) {
    // Remove import statements
    return content.replace(/^import.*?;?\s*$/gm, '').trim()
  }
  
  return content
}

/**
 * Get context around a specific line in a file
 */
export async function getLineContext(
  filePath: string,
  lineNumber: number,
  contextLines = 10
): Promise<string> {
  const content = await readFileContent(filePath)
  const lines = content.split('\n')
  
  const start = Math.max(0, lineNumber - contextLines - 1)
  const end = Math.min(lines.length, lineNumber + contextLines)
  
  return lines.slice(start, end)
    .map((line, i) => `${start + i + 1}: ${line}`)
    .join('\n')
}

/**
 * Find related files based on imports
 */
export async function findRelatedFiles(
  filePath: string,
  depth = 1
): Promise<string[]> {
  const index = await loadIndex()
  if (!index) return []
  
  const related = new Set<string>()
  const queue: { path: string; level: number }[] = [{ path: filePath, level: 0 }]
  
  while (queue.length > 0) {
    const { path: currentPath, level } = queue.shift()!
    
    if (level >= depth) continue
    
    // Get dependencies
    const deps = index.dependencyGraph[currentPath] || []
    
    for (const dep of deps) {
      if (!related.has(dep)) {
        related.add(dep)
        queue.push({ path: dep, level: level + 1 })
      }
    }
    
    // Get dependents
    const dependents = index.reverseDependencyGraph[currentPath] || []
    
    for (const dep of dependents) {
      if (!related.has(dep)) {
        related.add(dep)
        queue.push({ path: dep, level: level + 1 })
      }
    }
  }
  
  return Array.from(related)
}

/**
 * Format context for AI prompt
 */
export function formatContextForAI(context: BuildContextResult): string {
  const sections: string[] = []
  
  // Project structure
  sections.push('## Project Structure')
  sections.push('```')
  sections.push(context.projectStructure)
  sections.push('```')
  sections.push('')
  
  // Relevant files
  if (context.files.length > 0) {
    sections.push('## Relevant Files')
    sections.push('')
    
    for (const file of context.files) {
      sections.push(`### ${file.path}`)
      sections.push(`_${file.reason}_`)
      sections.push('```')
      sections.push(file.content)
      sections.push('```')
      sections.push('')
    }
  }
  
  return sections.join('\n')
}
