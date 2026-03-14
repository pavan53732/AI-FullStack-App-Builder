/**
 * Project Indexing System
 * 
 * Automatically scans and indexes all project files in the background.
 * Builds semantic understanding of codebase for faster AI context retrieval.
 */

import fs from 'fs/promises'
import path from 'path'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')
const INDEX_FILE = path.join(process.cwd(), 'data', 'agent-state', 'project-index.json')

export interface FileIndex {
  path: string
  type: 'file' | 'folder'
  extension?: string
  size?: number
  lastModified?: string
  imports?: string[]
  exports?: string[]
  functions?: string[]
  classes?: string[]
  dependencies?: string[]
  hash?: string
}

export interface ProjectIndex {
  workspacePath: string
  projectName: string
  lastIndexed: string
  totalFiles: number
  totalFolders: number
  files: FileIndex[]
  dependencyGraph: Record<string, string[]>
  reverseDependencyGraph: Record<string, string[]>
  fileTree: TreeNode[]
  metadata: {
    frameworks: string[]
    languages: string[]
    packageManagers: string[]
    hasTypeScript: boolean
    hasReact: boolean
    hasNextJs: boolean
    hasTests: boolean
    mainEntry: string | null
  }
}

export interface TreeNode {
  name: string
  type: 'file' | 'folder'
  children?: TreeNode[]
}

// File patterns to ignore
const IGNORE_PATTERNS = [
  'node_modules', '.git', '.next', 'dist', 'build', '.cache',
  'coverage', '.DS_Store', 'Thumbs.db', '.env', '.env.local',
  '.env.development', '.env.production', '*.log', '*.lock',
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'
]

// Code patterns to extract
const IMPORT_PATTERNS = [
  /import\s+.*?from\s+['"]([^'"]+)['"]/g,
  /import\s+['"]([^'"]+)['"]/g,
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
]

const EXPORT_PATTERNS = [
  /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g,
  /export\s+\{\s*([^}]+)\s*\}/g,
]

const FUNCTION_PATTERN = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(|(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{)/g
const CLASS_PATTERN = /class\s+(\w+)/g

/**
 * Calculate simple hash for file content
 */
function simpleHash(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}

/**
 * Check if path should be ignored
 */
function shouldIgnore(name: string): boolean {
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.startsWith('*')) {
      return name.endsWith(pattern.slice(1))
    }
    return name === pattern
  })
}

/**
 * Extract code patterns from content
 */
function extractPatterns(content: string): {
  imports: string[]
  exports: string[]
  functions: string[]
  classes: string[]
} {
  const imports: string[] = []
  const exports: string[] = []
  const functions: string[] = []
  const classes: string[] = []

  // Extract imports
  for (const pattern of IMPORT_PATTERNS) {
    let match
    pattern.lastIndex = 0
    while ((match = pattern.exec(content)) !== null) {
      if (match[1] && !imports.includes(match[1])) {
        imports.push(match[1])
      }
    }
  }

  // Extract exports
  for (const pattern of EXPORT_PATTERNS) {
    let match
    pattern.lastIndex = 0
    while ((match = pattern.exec(content)) !== null) {
      if (match[1]) {
        const names = match[1].split(',').map(s => s.trim().split(/\s+as\s+/).pop()?.trim()).filter(Boolean)
        exports.push(...names.filter((n): n is string => n !== undefined))
      }
    }
  }

  // Extract functions
  let match
  FUNCTION_PATTERN.lastIndex = 0
  while ((match = FUNCTION_PATTERN.exec(content)) !== null) {
    const name = match[1] || match[2] || match[3]
    if (name && !functions.includes(name)) {
      functions.push(name)
    }
  }

  // Extract classes
  CLASS_PATTERN.lastIndex = 0
  while ((match = CLASS_PATTERN.exec(content)) !== null) {
    if (match[1] && !classes.includes(match[1])) {
      classes.push(match[1])
    }
  }

  return { imports, exports, functions, classes }
}

/**
 * Build file tree recursively
 */
async function buildFileTree(dir: string, maxDepth = 5, currentDepth = 0): Promise<TreeNode[]> {
  if (currentDepth >= maxDepth) return []

  const nodes: TreeNode[] = []
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      if (shouldIgnore(entry.name)) continue
      
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        const children = await buildFileTree(fullPath, maxDepth, currentDepth + 1)
        nodes.push({
          name: entry.name,
          type: 'folder',
          children
        })
      } else {
        nodes.push({
          name: entry.name,
          type: 'file'
        })
      }
    }
  } catch {}
  
  return nodes.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name)
    return a.type === 'folder' ? -1 : 1
  })
}

/**
 * Index a single file
 */
async function indexFile(filePath: string, basePath: string): Promise<FileIndex | null> {
  try {
    const stats = await fs.stat(filePath)
    
    if (stats.isDirectory()) {
      return {
        path: path.relative(basePath, filePath),
        type: 'folder',
        lastModified: stats.mtime.toISOString()
      }
    }

    const ext = path.extname(filePath)
    const relativePath = path.relative(basePath, filePath)
    
    const index: FileIndex = {
      path: relativePath,
      type: 'file',
      extension: ext,
      size: stats.size,
      lastModified: stats.mtime.toISOString()
    }

    // Only parse code files
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte', '.py', '.go', '.java', '.rb']
    
    if (codeExtensions.includes(ext) && stats.size < 100000) {
      const content = await fs.readFile(filePath, 'utf-8')
      index.hash = simpleHash(content)
      
      const patterns = extractPatterns(content)
      index.imports = patterns.imports
      index.exports = patterns.exports
      index.functions = patterns.functions
      index.classes = patterns.classes
    }

    // For package.json, extract dependencies
    if (relativePath === 'package.json') {
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const pkg = JSON.parse(content)
        index.dependencies = [
          ...Object.keys(pkg.dependencies || {}),
          ...Object.keys(pkg.devDependencies || {})
        ]
      } catch {}
    }

    return index
  } catch {
    return null
  }
}

/**
 * Recursively scan directory and index all files
 */
async function scanDirectory(dir: string, basePath: string): Promise<FileIndex[]> {
  const indices: FileIndex[] = []
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      if (shouldIgnore(entry.name)) continue
      
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        indices.push({
          path: path.relative(basePath, fullPath),
          type: 'folder'
        })
        indices.push(...await scanDirectory(fullPath, basePath))
      } else {
        const index = await indexFile(fullPath, basePath)
        if (index) indices.push(index)
      }
    }
  } catch {}
  
  return indices
}

/**
 * Build dependency graph from file indices
 */
function buildDependencyGraph(files: FileIndex[]): {
  graph: Record<string, string[]>
  reverse: Record<string, string[]>
} {
  const graph: Record<string, string[]> = {}
  const reverse: Record<string, string[]> = {}

  for (const file of files) {
    if (file.type === 'folder' || !file.imports) continue
    
    const deps: string[] = []
    
    for (const imp of file.imports) {
      // Resolve relative imports
      if (imp.startsWith('.')) {
        const resolved = path.normalize(path.join(path.dirname(file.path), imp))
        deps.push(resolved)
      } else {
        deps.push(imp)
      }
    }
    
    graph[file.path] = deps
    
    // Build reverse graph
    for (const dep of deps) {
      if (!reverse[dep]) reverse[dep] = []
      reverse[dep].push(file.path)
    }
  }

  return { graph, reverse }
}

/**
 * Detect project metadata
 */
function detectMetadata(files: FileIndex[]): ProjectIndex['metadata'] {
  const metadata: ProjectIndex['metadata'] = {
    frameworks: [],
    languages: [],
    packageManagers: [],
    hasTypeScript: false,
    hasReact: false,
    hasNextJs: false,
    hasTests: false,
    mainEntry: null
  }

  for (const file of files) {
    // Detect languages
    if (file.extension) {
      const langMap: Record<string, string> = {
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript React',
        '.js': 'JavaScript',
        '.jsx': 'JavaScript React',
        '.vue': 'Vue',
        '.svelte': 'Svelte',
        '.py': 'Python',
        '.go': 'Go',
        '.java': 'Java',
        '.rb': 'Ruby',
        '.css': 'CSS',
        '.scss': 'SCSS',
        '.html': 'HTML'
      }
      
      const lang = langMap[file.extension]
      if (lang && !metadata.languages.includes(lang)) {
        metadata.languages.push(lang)
      }
    }

    // Detect TypeScript
    if (file.extension === '.ts' || file.extension === '.tsx') {
      metadata.hasTypeScript = true
    }

    // Detect React
    if (file.extension === '.tsx' || file.extension === '.jsx') {
      metadata.hasReact = true
    }

    // Detect Next.js
    if (file.path.includes('pages/') || file.path.includes('app/')) {
      metadata.hasNextJs = true
    }

    // Detect tests
    if (file.path.includes('.test.') || file.path.includes('.spec.') || file.path.includes('__tests__')) {
      metadata.hasTests = true
    }

    // Find main entry
    if (file.path === 'index.ts' || file.path === 'index.js' || 
        file.path === 'src/index.ts' || file.path === 'src/index.js' ||
        file.path === 'src/main.ts' || file.path === 'src/main.js') {
      metadata.mainEntry = file.path
    }
  }

  // Detect frameworks from dependencies
  const pkgFile = files.find(f => f.path === 'package.json')
  if (pkgFile?.dependencies) {
    const deps = pkgFile.dependencies
    
    if (deps.includes('next')) metadata.frameworks.push('Next.js')
    if (deps.includes('react')) metadata.frameworks.push('React')
    if (deps.includes('vue')) metadata.frameworks.push('Vue')
    if (deps.includes('svelte')) metadata.frameworks.push('Svelte')
    if (deps.includes('express')) metadata.frameworks.push('Express')
    if (deps.includes('fastify')) metadata.frameworks.push('Fastify')
    if (deps.includes('vite')) metadata.frameworks.push('Vite')
    if (deps.includes('tailwindcss')) metadata.frameworks.push('Tailwind CSS')
  }

  return metadata
}

/**
 * Main indexing function - Index entire workspace
 */
export async function indexProject(projectPath?: string): Promise<ProjectIndex | null> {
  const targetDir = projectPath ? path.join(WORKSPACE_DIR, projectPath) : WORKSPACE_DIR
  
  try {
    // Check if directory exists
    await fs.access(targetDir)
  } catch {
    return null
  }

  const startTime = Date.now()
  
  // Scan all files
  const files = await scanDirectory(targetDir, targetDir)
  
  // Build dependency graph
  const { graph, reverse } = buildDependencyGraph(files)
  
  // Build file tree
  const fileTree = await buildFileTree(targetDir)
  
  // Detect metadata
  const metadata = detectMetadata(files)
  
  const projectIndex: ProjectIndex = {
    workspacePath: targetDir,
    projectName: projectPath || 'workspace',
    lastIndexed: new Date().toISOString(),
    totalFiles: files.filter(f => f.type === 'file').length,
    totalFolders: files.filter(f => f.type === 'folder').length,
    files,
    dependencyGraph: graph,
    reverseDependencyGraph: reverse,
    fileTree,
    metadata
  }

  // Save index to disk
  try {
    await fs.mkdir(path.dirname(INDEX_FILE), { recursive: true })
    await fs.writeFile(INDEX_FILE, JSON.stringify(projectIndex, null, 2))
  } catch {}

  console.log(`[Indexer] Indexed ${projectIndex.totalFiles} files in ${Date.now() - startTime}ms`)
  
  return projectIndex
}

/**
 * Load saved index
 */
export async function loadIndex(): Promise<ProjectIndex | null> {
  try {
    const content = await fs.readFile(INDEX_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

/**
 * Find files matching a pattern
 */
export async function findFiles(
  pattern: string | RegExp,
  projectPath?: string
): Promise<FileIndex[]> {
  const index = await loadIndex()
  if (!index) return []

  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern
  
  return index.files.filter(f => {
    if (f.type === 'folder') return false
    return regex.test(f.path) || regex.test(f.path.split('/').pop() || '')
  })
}

/**
 * Find files by export name
 */
export async function findByExport(exportName: string): Promise<FileIndex[]> {
  const index = await loadIndex()
  if (!index) return []

  return index.files.filter(f => 
    f.exports?.includes(exportName)
  )
}

/**
 * Find files by function name
 */
export async function findByFunction(functionName: string): Promise<FileIndex[]> {
  const index = await loadIndex()
  if (!index) return []

  return index.files.filter(f => 
    f.functions?.includes(functionName)
  )
}

/**
 * Get files that depend on a given file
 */
export async function getDependents(filePath: string): Promise<string[]> {
  const index = await loadIndex()
  if (!index) return []

  return index.reverseDependencyGraph[filePath] || []
}

/**
 * Get dependencies of a given file
 */
export async function getDependencies(filePath: string): Promise<string[]> {
  const index = await loadIndex()
  if (!index) return []

  return index.dependencyGraph[filePath] || []
}

/**
 * Start background indexing with interval
 */
let indexingInterval: NodeJS.Timeout | null = null

export function startIndexing(projectPath?: string, intervalMs = 30000): void {
  if (indexingInterval) {
    clearInterval(indexingInterval)
  }

  // Initial index
  indexProject(projectPath)

  // Periodic re-index
  indexingInterval = setInterval(() => {
    indexProject(projectPath)
  }, intervalMs)

  console.log(`[Indexer] Started background indexing every ${intervalMs}ms`)
}

export function stopIndexing(): void {
  if (indexingInterval) {
    clearInterval(indexingInterval)
    indexingInterval = null
  }
}

/**
 * Get relevant files for a given task/query
 */
export async function getRelevantFiles(query: string, limit = 10): Promise<FileIndex[]> {
  const index = await loadIndex()
  if (!index) return []

  const queryLower = query.toLowerCase()
  const keywords = queryLower.split(/\s+/).filter(w => w.length > 2)

  // Score each file
  const scored = index.files
    .filter(f => f.type === 'file')
    .map(file => {
      let score = 0

      // Check path match
      for (const keyword of keywords) {
        if (file.path.toLowerCase().includes(keyword)) {
          score += 10
        }
      }

      // Check function names
      for (const fn of file.functions || []) {
        for (const keyword of keywords) {
          if (fn.toLowerCase().includes(keyword)) {
            score += 5
          }
        }
      }

      // Check exports
      for (const exp of file.exports || []) {
        for (const keyword of keywords) {
          if (exp.toLowerCase().includes(keyword)) {
            score += 5
          }
        }
      }

      return { file, score }
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return scored.map(s => s.file)
}
