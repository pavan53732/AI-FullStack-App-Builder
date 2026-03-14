/**
 * Git Integration System
 * 
 * Full version control integration:
 * - Init repositories
 * - Commits with AI-generated messages
 * - Branch management
 * - Push to GitHub/GitLab
 * - Checkpoint creation
 */

import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')

export interface GitRepo {
  path: string
  remote?: string
  branch: string
  status: GitStatus
  commits: GitCommit[]
  branches: string[]
}

export interface GitStatus {
  staged: string[]
  modified: string[]
  untracked: string[]
  ahead: number
  behind: number
  clean: boolean
}

export interface GitCommit {
  hash: string
  shortHash: string
  message: string
  author: string
  date: string
  files: string[]
}

export interface GitBranch {
  name: string
  current: boolean
  remote?: string
  ahead: number
  behind: number
}

/**
 * Execute git command
 */
async function execGit(
  repoPath: string,
  args: string[],
  timeout = 30000
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const child = spawn('git', args, {
      cwd: repoPath,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
    })
    
    let stdout = ''
    let stderr = ''
    
    child.stdout?.on('data', (data) => { stdout += data.toString() })
    child.stderr?.on('data', (data) => { stderr += data.toString() })
    
    const timer = setTimeout(() => {
      child.kill()
      resolve({ stdout, stderr: stderr + '\nTimeout', exitCode: 124 })
    }, timeout)
    
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ stdout, stderr, exitCode: code ?? 1 })
    })
    
    child.on('error', (err) => {
      clearTimeout(timer)
      resolve({ stdout, stderr: err.message, exitCode: 1 })
    })
  })
}

/**
 * Check if git is available
 */
export async function isGitAvailable(): Promise<boolean> {
  try {
    const result = await execGit(process.cwd(), ['--version'], 5000)
    return result.exitCode === 0
  } catch {
    return false
  }
}

/**
 * Check if directory is a git repo
 */
export async function isGitRepo(repoPath: string): Promise<boolean> {
  const result = await execGit(repoPath, ['rev-parse', '--is-inside-work-tree'], 5000)
  return result.exitCode === 0 && result.stdout.trim() === 'true'
}

/**
 * Initialize a new git repository
 */
export async function initRepo(projectPath: string): Promise<boolean> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  // Check if already a repo
  if (await isGitRepo(fullPath)) {
    return true
  }
  
  // Initialize
  const result = await execGit(fullPath, ['init'], 10000)
  
  if (result.exitCode !== 0) {
    throw new Error(`Failed to init repo: ${result.stderr}`)
  }
  
  // Set default config
  await execGit(fullPath, ['config', 'user.email', 'ai-builder@local'])
  await execGit(fullPath, ['config', 'user.name', 'AI Builder'])
  
  // Create .gitignore
  const gitignore = `# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
.next/
out/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Cache
.cache/
.parcel-cache/

# Database
*.db
*.sqlite
*.sqlite3

# AI Builder state
.ai-builder/
checkpoints/
`
  
  await fs.writeFile(path.join(fullPath, '.gitignore'), gitignore)
  
  return true
}

/**
 * Get repository status
 */
export async function getStatus(projectPath: string): Promise<GitStatus> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  const result = await execGit(fullPath, ['status', '--porcelain', '-b'], 10000)
  
  const status: GitStatus = {
    staged: [],
    modified: [],
    untracked: [],
    ahead: 0,
    behind: 0,
    clean: true
  }
  
  if (result.exitCode !== 0) return status
  
  const lines = result.stdout.split('\n')
  
  for (const line of lines) {
    if (!line.trim()) continue
    
    // Branch info
    if (line.startsWith('## ')) {
      const match = line.match(/## (.+?)\.\.\.(.+?)?\s*\[ahead (\d+), behind (\d+)\]/)
      if (match) {
        status.ahead = parseInt(match[3]) || 0
        status.behind = parseInt(match[4]) || 0
      }
      continue
    }
    
    const code = line.slice(0, 2)
    const file = line.slice(3).trim()
    
    if (code.includes('M') || code.includes('A') || code.includes('D') || code.includes('R')) {
      status.staged.push(file)
      status.clean = false
    }
    
    if (code[1] === 'M' || code[1] === 'D') {
      status.modified.push(file)
      status.clean = false
    }
    
    if (code === '??') {
      status.untracked.push(file)
      status.clean = false
    }
  }
  
  return status
}

/**
 * Stage files
 */
export async function stageFiles(
  projectPath: string,
  files: string[] | '.'
): Promise<boolean> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  const args = ['add']
  if (files === '.') {
    args.push('.')
  } else {
    args.push(...files)
  }
  
  const result = await execGit(fullPath, args, 30000)
  return result.exitCode === 0
}

/**
 * Create a commit
 */
export async function createCommit(
  projectPath: string,
  message: string,
  files?: string[]
): Promise<GitCommit | null> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  // Stage files if specified
  if (files && files.length > 0) {
    await stageFiles(projectPath, files)
  } else {
    await stageFiles(projectPath, '.')
  }
  
  // Create commit
  const result = await execGit(fullPath, ['commit', '-m', message], 30000)
  
  if (result.exitCode !== 0) {
    // Check if nothing to commit
    if (result.stdout.includes('nothing to commit')) {
      return null
    }
    throw new Error(`Failed to commit: ${result.stderr}`)
  }
  
  // Get commit hash
  const hashResult = await execGit(fullPath, ['rev-parse', 'HEAD'], 5000)
  const hash = hashResult.stdout.trim()
  
  // Get commit info
  return getCommit(projectPath, hash)
}

/**
 * Get commit info
 */
export async function getCommit(projectPath: string, hash: string): Promise<GitCommit | null> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  const result = await execGit(fullPath, [
    'log', '-1',
    '--format=%H%n%h%n%s%n%an%n%ai',
    hash
  ], 5000)
  
  if (result.exitCode !== 0) return null
  
  const lines = result.stdout.split('\n')
  
  // Get files changed
  const filesResult = await execGit(fullPath, [
    'diff-tree', '--no-commit-id', '--name-only', '-r', hash
  ], 5000)
  
  const files = filesResult.stdout.split('\n').filter(Boolean)
  
  return {
    hash: lines[0]?.trim() || '',
    shortHash: lines[1]?.trim() || '',
    message: lines[2]?.trim() || '',
    author: lines[3]?.trim() || '',
    date: lines[4]?.trim() || '',
    files
  }
}

/**
 * Get commit history
 */
export async function getCommitHistory(
  projectPath: string,
  limit = 50
): Promise<GitCommit[]> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  const result = await execGit(fullPath, [
    'log',
    `--max-count=${limit}`,
    '--format=%H%n%h%n%s%n%an%n%ai%n---'
  ], 30000)
  
  if (result.exitCode !== 0) return []
  
  const commits: GitCommit[] = []
  const blocks = result.stdout.split('---\n')
  
  for (const block of blocks) {
    if (!block.trim()) continue
    
    const lines = block.split('\n')
    
    commits.push({
      hash: lines[0]?.trim() || '',
      shortHash: lines[1]?.trim() || '',
      message: lines[2]?.trim() || '',
      author: lines[3]?.trim() || '',
      date: lines[4]?.trim() || '',
      files: []
    })
  }
  
  return commits
}

/**
 * Create a branch
 */
export async function createBranch(
  projectPath: string,
  branchName: string,
  checkout = true
): Promise<boolean> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  if (checkout) {
    const result = await execGit(fullPath, ['checkout', '-b', branchName], 10000)
    return result.exitCode === 0
  } else {
    const result = await execGit(fullPath, ['branch', branchName], 10000)
    return result.exitCode === 0
  }
}

/**
 * Switch branch
 */
export async function switchBranch(projectPath: string, branchName: string): Promise<boolean> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  const result = await execGit(fullPath, ['checkout', branchName], 10000)
  return result.exitCode === 0
}

/**
 * Get current branch
 */
export async function getCurrentBranch(projectPath: string): Promise<string> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  const result = await execGit(fullPath, ['branch', '--show-current'], 5000)
  return result.stdout.trim()
}

/**
 * List branches
 */
export async function listBranches(projectPath: string): Promise<GitBranch[]> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  const result = await execGit(fullPath, [
    'branch', '-vv',
    '--format=%(refname:short)%(HEAD)%(upstream:short)%(upstream:track)'
  ], 10000)
  
  if (result.exitCode !== 0) return []
  
  const branches: GitBranch[] = []
  
  for (const line of result.stdout.split('\n')) {
    if (!line.trim()) continue
    
    const parts = line.trim().split(/\s+/)
    const name = parts[0]?.replace('*', '').trim()
    const current = line.includes('*')
    
    let ahead = 0, behind = 0
    const aheadMatch = line.match(/ahead (\d+)/)
    const behindMatch = line.match(/behind (\d+)/)
    
    if (aheadMatch) ahead = parseInt(aheadMatch[1])
    if (behindMatch) behind = parseInt(behindMatch[1])
    
    branches.push({
      name,
      current,
      ahead,
      behind
    })
  }
  
  return branches
}

/**
 * Merge branch
 */
export async function mergeBranch(
  projectPath: string,
  branchName: string,
  noFastForward = false
): Promise<{ success: boolean; conflicts?: string[] }> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  const args = ['merge', branchName]
  if (noFastForward) args.push('--no-ff')
  
  const result = await execGit(fullPath, args, 30000)
  
  if (result.exitCode !== 0) {
    // Check for conflicts
    if (result.stdout.includes('CONFLICT')) {
      const conflicts: string[] = []
      const conflictMatch = result.stdout.matchAll(/CONFLICT \(.*\): (.+)/g)
      for (const match of conflictMatch) {
        conflicts.push(match[1])
      }
      return { success: false, conflicts }
    }
    throw new Error(`Merge failed: ${result.stderr}`)
  }
  
  return { success: true }
}

/**
 * Add remote
 */
export async function addRemote(
  projectPath: string,
  name: string,
  url: string
): Promise<boolean> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  const result = await execGit(fullPath, ['remote', 'add', name, url], 10000)
  return result.exitCode === 0
}

/**
 * Get remotes
 */
export async function getRemotes(projectPath: string): Promise<Record<string, string>> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  const result = await execGit(fullPath, ['remote', '-v'], 5000)
  
  const remotes: Record<string, string> = {}
  
  for (const line of result.stdout.split('\n')) {
    const match = line.match(/^(\w+)\s+(.+?)\s+\(fetch\)$/)
    if (match) {
      remotes[match[1]] = match[2]
    }
  }
  
  return remotes
}

/**
 * Push to remote
 */
export async function push(
  projectPath: string,
  remote = 'origin',
  branch?: string,
  setUpstream = false
): Promise<{ success: boolean; output: string }> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  const currentBranch = branch || await getCurrentBranch(projectPath)
  
  const args = ['push', remote]
  if (setUpstream) {
    args.push('-u', remote, currentBranch)
  } else {
    args.push(currentBranch)
  }
  
  const result = await execGit(fullPath, args, 60000)
  
  return {
    success: result.exitCode === 0,
    output: result.stdout + result.stderr
  }
}

/**
 * Pull from remote
 */
export async function pull(
  projectPath: string,
  remote = 'origin',
  branch?: string
): Promise<{ success: boolean; output: string }> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  const currentBranch = branch || await getCurrentBranch(projectPath)
  
  const result = await execGit(fullPath, ['pull', remote, currentBranch], 60000)
  
  return {
    success: result.exitCode === 0,
    output: result.stdout + result.stderr
  }
}

/**
 * Create checkpoint (stash + tag)
 */
export async function createCheckpoint(
  projectPath: string,
  name: string,
  message?: string
): Promise<{ tag: string; stash?: string }> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  const result: { tag: string; stash?: string } = { tag: '' }
  
  // Stash any uncommitted changes
  const status = await getStatus(projectPath)
  if (!status.clean) {
    const stashResult = await execGit(fullPath, [
      'stash', 'push', '-m', message || `Checkpoint: ${name}`
    ], 30000)
    
    if (stashResult.exitCode === 0) {
      const stashList = await execGit(fullPath, ['stash', 'list', '-1'], 5000)
      const match = stashList.stdout.match(/stash@\{(\d+)\}/)
      if (match) {
        result.stash = `stash@{${match[1]}}`
      }
    }
  }
  
  // Create tag
  const tagName = `checkpoint-${name}-${Date.now()}`
  const tagResult = await execGit(fullPath, [
    'tag', '-a', tagName, '-m', message || `Checkpoint: ${name}`
  ], 10000)
  
  if (tagResult.exitCode === 0) {
    result.tag = tagName
  }
  
  return result
}

/**
 * Restore to checkpoint
 */
export async function restoreCheckpoint(
  projectPath: string,
  tagName: string,
  stashRef?: string
): Promise<boolean> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  // Checkout the tag
  const checkoutResult = await execGit(fullPath, ['checkout', tagName], 10000)
  
  if (checkoutResult.exitCode !== 0) {
    return false
  }
  
  // Apply stash if provided
  if (stashRef) {
    await execGit(fullPath, ['stash', 'apply', stashRef], 30000)
  }
  
  return true
}

/**
 * Generate commit message using AI
 */
export function generateCommitMessage(
  files: string[],
  diff?: string
): string {
  const added = files.filter(f => f.startsWith('A ') || f.includes('new file'))
  const modified = files.filter(f => f.startsWith('M ') || f.includes('modified'))
  const deleted = files.filter(f => f.startsWith('D ') || f.includes('deleted'))
  
  let message = ''
  
  if (added.length > 0 && modified.length === 0 && deleted.length === 0) {
    message = `feat: Add ${added.length} new file${added.length > 1 ? 's' : ''}`
    if (added.length === 1) {
      const fileName = added[0].split('/').pop()
      message = `feat: Add ${fileName}`
    }
  } else if (modified.length > 0 && added.length === 0 && deleted.length === 0) {
    message = `refactor: Update ${modified.length} file${modified.length > 1 ? 's' : ''}`
    if (modified.length === 1) {
      const fileName = modified[0].split('/').pop()
      message = `refactor: Update ${fileName}`
    }
  } else if (deleted.length > 0 && added.length === 0 && modified.length === 0) {
    message = `chore: Remove ${deleted.length} file${deleted.length > 1 ? 's' : ''}`
  } else {
    message = `chore: Update ${files.length} file${files.length > 1 ? 's' : ''}`
  }
  
  // Add file list in body if many files
  if (files.length > 3) {
    message += `\n\nFiles changed:\n${files.map(f => `- ${f}`).join('\n')}`
  }
  
  return message
}

/**
 * Get diff
 */
export async function getDiff(
  projectPath: string,
  staged = false
): Promise<string> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  const args = ['diff']
  if (staged) args.push('--staged')
  
  const result = await execGit(fullPath, args, 30000)
  return result.stdout
}

/**
 * Rollback to previous commit
 */
export async function rollback(
  projectPath: string,
  commitHash: string,
  soft = false
): Promise<boolean> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  const args = ['reset']
  if (soft) {
    args.push('--soft')
  } else {
    args.push('--hard')
  }
  args.push(commitHash)
  
  const result = await execGit(fullPath, args, 10000)
  return result.exitCode === 0
}
