/**
 * Checkpointing System
 * 
 * Saves and restores full application state:
 * - Code files
 * - Database state
 * - Environment variables
 * - Configuration
 * - Can restore to any previous point
 */

import fs from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')
const CHECKPOINTS_DIR = path.join(process.cwd(), 'data', 'checkpoints')

export interface Checkpoint {
  id: string
  projectId: string
  name: string
  description?: string
  createdAt: string
  size: number
  filesCount: number
  hasDatabase: boolean
  tags: string[]
  metadata: Record<string, any>
}

export interface CheckpointManifest {
  checkpoint: Checkpoint
  files: FileInfo[]
  database?: DatabaseSnapshot
  env?: Record<string, string>
  gitCommit?: string
  packageJson?: any
}

export interface FileInfo {
  path: string
  hash: string
  size: number
  modified: string
}

export interface DatabaseSnapshot {
  type: 'sqlite' | 'postgres' | 'mysql'
  path?: string
  size: number
  tables: string[]
}

/**
 * Generate checkpoint ID
 */
function generateCheckpointId(): string {
  return `cp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

/**
 * Calculate file hash
 */
async function calculateFileHash(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath)
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      hash = ((hash << 5) - hash) + content[i]
      hash = hash & hash
    }
    return Math.abs(hash).toString(16)
  } catch {
    return '0'
  }
}

/**
 * Get all files in directory recursively
 */
async function getAllFiles(dir: string, baseDir: string): Promise<FileInfo[]> {
  const files: FileInfo[] = []
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      // Skip common exclusions
      if (['node_modules', '.git', '.next', 'dist', 'build', '.cache'].includes(entry.name)) {
        continue
      }
      
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        files.push(...await getAllFiles(fullPath, baseDir))
      } else {
        const stats = await fs.stat(fullPath)
        const hash = await calculateFileHash(fullPath)
        
        files.push({
          path: path.relative(baseDir, fullPath),
          hash,
          size: stats.size,
          modified: stats.mtime.toISOString()
        })
      }
    }
  } catch {}
  
  return files
}

/**
 * Create a checkpoint
 */
export async function createCheckpoint(
  projectId: string,
  name: string,
  options: {
    description?: string
    includeDatabase?: boolean
    includeEnv?: boolean
    tags?: string[]
    metadata?: Record<string, any>
  } = {}
): Promise<Checkpoint> {
  const projectPath = path.join(WORKSPACE_DIR, projectId)
  const checkpointId = generateCheckpointId()
  const checkpointDir = path.join(CHECKPOINTS_DIR, checkpointId)
  
  // Create checkpoint directory
  await fs.mkdir(checkpointDir, { recursive: true })
  
  // Get all files
  const files = await getAllFiles(projectPath, projectPath)
  
  // Copy files to checkpoint
  const filesDir = path.join(checkpointDir, 'files')
  await fs.mkdir(filesDir, { recursive: true })
  
  for (const file of files) {
    const srcPath = path.join(projectPath, file.path)
    const destPath = path.join(filesDir, file.path)
    
    try {
      await fs.mkdir(path.dirname(destPath), { recursive: true })
      await fs.copyFile(srcPath, destPath)
    } catch {}
  }
  
  // Database snapshot
  let databaseSnapshot: DatabaseSnapshot | undefined
  
  if (options.includeDatabase) {
    const dbPath = path.join(projectPath, 'database.db')
    try {
      await fs.access(dbPath)
      const destDbPath = path.join(checkpointDir, 'database.db')
      await fs.copyFile(dbPath, destDbPath)
      
      databaseSnapshot = {
        type: 'sqlite',
        path: 'database.db',
        size: (await fs.stat(destDbPath)).size,
        tables: []
      }
    } catch {}
  }
  
  // Environment variables
  let env: Record<string, string> | undefined
  if (options.includeEnv) {
    try {
      const envPath = path.join(projectPath, '.env')
      const envContent = await fs.readFile(envPath, 'utf-8')
      env = parseEnv(envContent)
    } catch {}
  }
  
  // Get package.json
  let packageJson: any
  try {
    packageJson = JSON.parse(
      await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8')
    )
  } catch {}
  
  // Create checkpoint
  const checkpoint: Checkpoint = {
    id: checkpointId,
    projectId,
    name,
    description: options.description,
    createdAt: new Date().toISOString(),
    size: files.reduce((sum, f) => sum + f.size, 0),
    filesCount: files.length,
    hasDatabase: !!databaseSnapshot,
    tags: options.tags || [],
    metadata: options.metadata || {}
  }
  
  // Create manifest
  const manifest: CheckpointManifest = {
    checkpoint,
    files,
    database: databaseSnapshot,
    env,
    packageJson
  }
  
  // Save manifest
  await fs.writeFile(
    path.join(checkpointDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  )
  
  // Update checkpoint index
  await updateCheckpointIndex(projectId, checkpoint)
  
  return checkpoint
}

/**
 * Parse env file
 */
function parseEnv(content: string): Record<string, string> {
  const env: Record<string, string> = {}
  
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    
    const [key, ...valueParts] = trimmed.split('=')
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=')
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      env[key.trim()] = value
    }
  }
  
  return env
}

/**
 * Update checkpoint index
 */
async function updateCheckpointIndex(projectId: string, checkpoint: Checkpoint): Promise<void> {
  const indexPath = path.join(CHECKPOINTS_DIR, projectId, 'index.json')
  
  let index: Checkpoint[] = []
  
  try {
    const content = await fs.readFile(indexPath, 'utf-8')
    index = JSON.parse(content)
  } catch {}
  
  index.push(checkpoint)
  
  await fs.mkdir(path.dirname(indexPath), { recursive: true })
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2))
}

/**
 * List checkpoints for a project
 */
export async function listCheckpoints(projectId: string): Promise<Checkpoint[]> {
  const indexPath = path.join(CHECKPOINTS_DIR, projectId, 'index.json')
  
  try {
    const content = await fs.readFile(indexPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
}

/**
 * Get checkpoint details
 */
export async function getCheckpoint(checkpointId: string): Promise<{
  checkpoint: Checkpoint
  manifest: CheckpointManifest
} | null> {
  const checkpointDir = path.join(CHECKPOINTS_DIR, checkpointId)
  
  try {
    const manifest = JSON.parse(
      await fs.readFile(path.join(checkpointDir, 'manifest.json'), 'utf-8')
    )
    
    return {
      checkpoint: manifest.checkpoint,
      manifest
    }
  } catch {
    return null
  }
}

/**
 * Restore from checkpoint
 */
export async function restoreCheckpoint(
  checkpointId: string,
  options: {
    restoreDatabase?: boolean
    restoreEnv?: boolean
    overwriteExisting?: boolean
  } = {}
): Promise<{
  success: boolean
  filesRestored: number
  errors: string[]
}> {
  const result = {
    success: false,
    filesRestored: 0,
    errors: [] as string[]
  }
  
  const checkpointData = await getCheckpoint(checkpointId)
  if (!checkpointData) {
    result.errors.push('Checkpoint not found')
    return result
  }
  
  const { checkpoint, manifest } = checkpointData
  const projectPath = path.join(WORKSPACE_DIR, checkpoint.projectId)
  const checkpointDir = path.join(CHECKPOINTS_DIR, checkpointId)
  const filesDir = path.join(checkpointDir, 'files')
  
  // Backup current state if not overwriting
  if (!options.overwriteExisting) {
    try {
      await createCheckpoint(checkpoint.projectId, 'pre-restore-backup', {
        description: `Auto-backup before restoring ${checkpoint.name}`,
        tags: ['auto', 'pre-restore']
      })
    } catch {}
  }
  
  // Restore files
  for (const file of manifest.files) {
    const srcPath = path.join(filesDir, file.path)
    const destPath = path.join(projectPath, file.path)
    
    try {
      await fs.mkdir(path.dirname(destPath), { recursive: true })
      await fs.copyFile(srcPath, destPath)
      result.filesRestored++
    } catch (error: any) {
      result.errors.push(`${file.path}: ${error.message}`)
    }
  }
  
  // Restore database
  if (options.restoreDatabase && manifest.database) {
    const srcDbPath = path.join(checkpointDir, manifest.database.path!)
    const destDbPath = path.join(projectPath, 'database.db')
    
    try {
      await fs.copyFile(srcDbPath, destDbPath)
    } catch (error: any) {
      result.errors.push(`Database: ${error.message}`)
    }
  }
  
  // Restore environment
  if (options.restoreEnv && manifest.env) {
    const envContent = Object.entries(manifest.env)
      .map(([k, v]) => `${k}="${v}"`)
      .join('\n')
    
    try {
      await fs.writeFile(path.join(projectPath, '.env'), envContent)
    } catch (error: any) {
      result.errors.push(`Environment: ${error.message}`)
    }
  }
  
  result.success = result.filesRestored > 0
  
  return result
}

/**
 * Delete checkpoint
 */
export async function deleteCheckpoint(checkpointId: string): Promise<boolean> {
  const checkpointDir = path.join(CHECKPOINTS_DIR, checkpointId)
  
  try {
    // Get checkpoint info first
    const manifest = JSON.parse(
      await fs.readFile(path.join(checkpointDir, 'manifest.json'), 'utf-8')
    )
    
    // Remove checkpoint directory
    await fs.rm(checkpointDir, { recursive: true })
    
    // Update index
    const projectId = manifest.checkpoint.projectId
    const indexPath = path.join(CHECKPOINTS_DIR, projectId, 'index.json')
    
    try {
      const content = await fs.readFile(indexPath, 'utf-8')
      const index: Checkpoint[] = JSON.parse(content)
      const filtered = index.filter(c => c.id !== checkpointId)
      await fs.writeFile(indexPath, JSON.stringify(filtered, null, 2))
    } catch {}
    
    return true
  } catch {
    return false
  }
}

/**
 * Compare two checkpoints
 */
export async function compareCheckpoints(
  checkpointId1: string,
  checkpointId2: string
): Promise<{
  added: string[]
  removed: string[]
  modified: string[]
}> {
  const cp1 = await getCheckpoint(checkpointId1)
  const cp2 = await getCheckpoint(checkpointId2)
  
  if (!cp1 || !cp2) {
    throw new Error('One or both checkpoints not found')
  }
  
  const files1 = new Map(cp1.manifest.files.map(f => [f.path, f]))
  const files2 = new Map(cp2.manifest.files.map(f => [f.path, f]))
  
  const added: string[] = []
  const removed: string[] = []
  const modified: string[] = []
  
  // Find added and modified
  for (const [path, file] of files2) {
    const existing = files1.get(path)
    if (!existing) {
      added.push(path)
    } else if (existing.hash !== file.hash) {
      modified.push(path)
    }
  }
  
  // Find removed
  for (const path of files1.keys()) {
    if (!files2.has(path)) {
      removed.push(path)
    }
  }
  
  return { added, removed, modified }
}

/**
 * Get checkpoint statistics
 */
export async function getCheckpointStats(projectId: string): Promise<{
  totalCheckpoints: number
  totalSize: number
  oldestCheckpoint?: string
  newestCheckpoint?: string
  checkpointsByTag: Record<string, number>
}> {
  const checkpoints = await listCheckpoints(projectId)
  
  const stats = {
    totalCheckpoints: checkpoints.length,
    totalSize: checkpoints.reduce((sum, c) => sum + c.size, 0),
    oldestCheckpoint: undefined as string | undefined,
    newestCheckpoint: undefined as string | undefined,
    checkpointsByTag: {} as Record<string, number>
  }
  
  if (checkpoints.length > 0) {
    const sorted = [...checkpoints].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    
    stats.oldestCheckpoint = sorted[0].createdAt
    stats.newestCheckpoint = sorted[sorted.length - 1].createdAt
    
    // Count by tag
    for (const checkpoint of checkpoints) {
      for (const tag of checkpoint.tags) {
        stats.checkpointsByTag[tag] = (stats.checkpointsByTag[tag] || 0) + 1
      }
    }
  }
  
  return stats
}

/**
 * Prune old checkpoints
 */
export async function pruneCheckpoints(
  projectId: string,
  options: {
    keepLast?: number
    keepDays?: number
    keepTags?: string[]
  } = {}
): Promise<string[]> {
  const checkpoints = await listCheckpoints(projectId)
  const deleted: string[] = []
  
  const { keepLast = 10, keepDays, keepTags = [] } = options
  
  // Sort by date
  const sorted = [...checkpoints].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  
  const cutoffDate = keepDays 
    ? new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000)
    : null
  
  for (let i = 0; i < sorted.length; i++) {
    const checkpoint = sorted[i]
    
    // Keep if in keepLast
    if (i < keepLast) continue
    
    // Keep if has protected tag
    if (checkpoint.tags.some(t => keepTags.includes(t))) continue
    
    // Keep if within keepDays
    if (cutoffDate && new Date(checkpoint.createdAt) >= cutoffDate) continue
    
    // Delete
    await deleteCheckpoint(checkpoint.id)
    deleted.push(checkpoint.id)
  }
  
  return deleted
}

/**
 * Export checkpoint as tarball
 */
export async function exportCheckpoint(
  checkpointId: string,
  outputPath: string
): Promise<string> {
  const checkpointDir = path.join(CHECKPOINTS_DIR, checkpointId)
  
  return new Promise((resolve, reject) => {
    const child = spawn('tar', [
      '-czf', outputPath,
      '-C', checkpointDir,
      '.'
    ])
    
    child.on('close', (code) => {
      if (code === 0) resolve(outputPath)
      else reject(new Error(`tar exited with code ${code}`))
    })
    
    child.on('error', reject)
  })
}

/**
 * Import checkpoint from tarball
 */
export async function importCheckpoint(
  tarballPath: string
): Promise<Checkpoint> {
  const checkpointId = generateCheckpointId()
  const checkpointDir = path.join(CHECKPOINTS_DIR, checkpointId)
  
  await fs.mkdir(checkpointDir, { recursive: true })
  
  return new Promise((resolve, reject) => {
    const child = spawn('tar', [
      '-xzf', tarballPath,
      '-C', checkpointDir
    ])
    
    child.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error(`tar exited with code ${code}`))
        return
      }
      
      try {
        const manifest = JSON.parse(
          await fs.readFile(path.join(checkpointDir, 'manifest.json'), 'utf-8')
        )
        
        await updateCheckpointIndex(manifest.checkpoint.projectId, manifest.checkpoint)
        
        resolve(manifest.checkpoint)
      } catch (error) {
        reject(error)
      }
    })
    
    child.on('error', reject)
  })
}
