/**
 * Database Manager
 * 
 * Manages databases with migrations:
 * - PostgreSQL / SQLite support
 * - Schema migrations
 * - Database branching (like Git for DBs)
 * - Point-in-time recovery
 */

import fs from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')
const DB_STATE_DIR = path.join(process.cwd(), 'data', 'databases')

export interface DatabaseConfig {
  id: string
  projectId: string
  type: 'postgres' | 'sqlite' | 'mysql' | 'mongo'
  name: string
  host?: string
  port?: number
  user?: string
  password?: string
  path?: string // For SQLite
  status: 'creating' | 'running' | 'stopped' | 'error'
  createdAt: string
  migrations: Migration[]
  branches: DatabaseBranch[]
  currentBranch: string
}

export interface Migration {
  id: string
  name: string
  up: string
  down: string
  appliedAt?: string
  checksum: string
}

export interface DatabaseBranch {
  name: string
  createdAt: string
  migrations: string[]
  parentBranch?: string
  parentMigration?: string
}

export interface SchemaInfo {
  tables: TableInfo[]
  indexes: IndexInfo[]
  relations: RelationInfo[]
}

export interface TableInfo {
  name: string
  columns: ColumnInfo[]
  primaryKey?: string
}

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  default?: string
}

export interface IndexInfo {
  name: string
  table: string
  columns: string[]
  unique: boolean
}

export interface RelationInfo {
  name: string
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
}

/**
 * Create a new database
 */
export async function createDatabase(config: {
  projectId: string
  type: 'postgres' | 'sqlite' | 'mysql'
  name: string
  host?: string
  port?: number
}): Promise<DatabaseConfig> {
  const dbId = `db_${config.projectId}_${Date.now().toString(36)}`
  const dbPath = path.join(DB_STATE_DIR, config.projectId)
  
  await fs.mkdir(dbPath, { recursive: true })
  
  const dbConfig: DatabaseConfig = {
    id: dbId,
    projectId: config.projectId,
    type: config.type,
    name: config.name,
    host: config.host,
    port: config.port,
    status: 'creating',
    createdAt: new Date().toISOString(),
    migrations: [],
    branches: [{
      name: 'main',
      createdAt: new Date().toISOString(),
      migrations: []
    }],
    currentBranch: 'main'
  }
  
  if (config.type === 'sqlite') {
    dbConfig.path = path.join(dbPath, `${config.name}.db`)
    dbConfig.status = 'running'
    
    // Create SQLite file
    await fs.writeFile(dbConfig.path, '')
  }
  
  // Save config
  await fs.writeFile(
    path.join(dbPath, 'config.json'),
    JSON.stringify(dbConfig, null, 2)
  )
  
  return dbConfig
}

/**
 * Load database config
 */
export async function loadDatabaseConfig(projectId: string): Promise<DatabaseConfig | null> {
  try {
    const configPath = path.join(DB_STATE_DIR, projectId, 'config.json')
    const content = await fs.readFile(configPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

/**
 * Save database config
 */
async function saveDatabaseConfig(config: DatabaseConfig): Promise<void> {
  const dbPath = path.join(DB_STATE_DIR, config.projectId)
  await fs.mkdir(dbPath, { recursive: true })
  await fs.writeFile(
    path.join(dbPath, 'config.json'),
    JSON.stringify(config, null, 2)
  )
}

/**
 * Generate migration ID
 */
function generateMigrationId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

/**
 * Calculate checksum
 */
function calculateChecksum(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) - hash) + content.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

/**
 * Create a migration
 */
export async function createMigration(
  projectId: string,
  name: string,
  upSql: string,
  downSql: string
): Promise<Migration> {
  const config = await loadDatabaseConfig(projectId)
  if (!config) throw new Error('Database not found')
  
  const migration: Migration = {
    id: generateMigrationId(),
    name,
    up: upSql,
    down: downSql,
    checksum: calculateChecksum(upSql + downSql)
  }
  
  config.migrations.push(migration)
  await saveDatabaseConfig(config)
  
  // Save migration file
  const migrationsDir = path.join(WORKSPACE_DIR, projectId, 'migrations')
  await fs.mkdir(migrationsDir, { recursive: true })
  await fs.writeFile(
    path.join(migrationsDir, `${migration.id}_${name}.sql`),
    `-- Migration: ${name}\n-- Up\n${upSql}\n\n-- Down\n${downSql}\n`
  )
  
  return migration
}

/**
 * Run pending migrations
 */
export async function runMigrations(projectId: string): Promise<{
  applied: string[]
  errors: string[]
}> {
  const config = await loadDatabaseConfig(projectId)
  if (!config) throw new Error('Database not found')
  
  const result = { applied: [] as string[], errors: [] as string[] }
  
  const pending = config.migrations.filter(m => !m.appliedAt)
  
  for (const migration of pending) {
    try {
      await executeSql(projectId, migration.up)
      migration.appliedAt = new Date().toISOString()
      result.applied.push(migration.id)
    } catch (error: any) {
      result.errors.push(`${migration.id}: ${error.message}`)
      break
    }
  }
  
  await saveDatabaseConfig(config)
  
  return result
}

/**
 * Rollback last migration
 */
export async function rollbackMigration(projectId: string): Promise<{
  rolledBack: string | null
  error?: string
}> {
  const config = await loadDatabaseConfig(projectId)
  if (!config) throw new Error('Database not found')
  
  // Find last applied migration
  const applied = config.migrations
    .filter(m => m.appliedAt)
    .sort((a, b) => new Date(b.appliedAt!).getTime() - new Date(a.appliedAt!).getTime())
  
  if (applied.length === 0) {
    return { rolledBack: null }
  }
  
  const lastMigration = applied[0]
  
  try {
    await executeSql(projectId, lastMigration.down)
    lastMigration.appliedAt = undefined
    await saveDatabaseConfig(config)
    return { rolledBack: lastMigration.id }
  } catch (error: any) {
    return { rolledBack: null, error: error.message }
  }
}

/**
 * Execute SQL (basic implementation for SQLite)
 */
async function executeSql(projectId: string, sql: string): Promise<void> {
  const config = await loadDatabaseConfig(projectId)
  if (!config) throw new Error('Database not found')
  
  if (config.type === 'sqlite' && config.path) {
    // Use sqlite3 CLI if available
    return new Promise((resolve, reject) => {
      const child = spawn('sqlite3', [config.path!, sql], {
        env: process.env
      })
      
      let stderr = ''
      child.stderr?.on('data', (data) => { stderr += data.toString() })
      
      child.on('close', (code) => {
        if (code === 0) resolve()
        else reject(new Error(stderr || 'SQLite error'))
      })
      
      child.on('error', (err) => reject(err))
    })
  }
  
  // For other DBs, we'd use proper clients
  // This is a placeholder - in production you'd use pg, mysql2, etc.
  console.log(`[DB] Would execute SQL on ${config.type}:`, sql.slice(0, 100))
}

/**
 * Create database branch
 */
export async function createBranch(
  projectId: string,
  branchName: string,
  parentBranch = 'main'
): Promise<DatabaseBranch> {
  const config = await loadDatabaseConfig(projectId)
  if (!config) throw new Error('Database not found')
  
  const parent = config.branches.find(b => b.name === parentBranch)
  if (!parent) throw new Error(`Parent branch ${parentBranch} not found`)
  
  // Get latest migration on parent
  const lastMigration = config.migrations
    .filter(m => parent.migrations.includes(m.id) || m.appliedAt)
    .pop()
  
  const branch: DatabaseBranch = {
    name: branchName,
    createdAt: new Date().toISOString(),
    migrations: [...parent.migrations],
    parentBranch,
    parentMigration: lastMigration?.id
  }
  
  config.branches.push(branch)
  await saveDatabaseConfig(config)
  
  // For SQLite, copy the database file
  if (config.type === 'sqlite' && config.path) {
    const branchPath = config.path.replace('.db', `_${branchName}.db`)
    await fs.copyFile(config.path, branchPath)
  }
  
  return branch
}

/**
 * Switch to a branch
 */
export async function switchBranch(projectId: string, branchName: string): Promise<void> {
  const config = await loadDatabaseConfig(projectId)
  if (!config) throw new Error('Database not found')
  
  const branch = config.branches.find(b => b.name === branchName)
  if (!branch) throw new Error(`Branch ${branchName} not found`)
  
  config.currentBranch = branchName
  
  // For SQLite, switch the database file
  if (config.type === 'sqlite' && config.path) {
    const branchPath = config.path.replace('.db', `_${branchName}.db`)
    const mainPath = config.path
    
    // Save current state
    await fs.copyFile(mainPath, mainPath.replace('.db', `_${config.currentBranch}.db`))
    
    // Load branch state
    try {
      await fs.copyFile(branchPath, mainPath)
    } catch {
      // Branch file doesn't exist, create fresh
      await fs.writeFile(mainPath, '')
    }
  }
  
  await saveDatabaseConfig(config)
}

/**
 * Merge branch (apply migrations from branch to main)
 */
export async function mergeBranch(
  projectId: string,
  branchName: string
): Promise<{ merged: string[]; conflicts: string[] }> {
  const config = await loadDatabaseConfig(projectId)
  if (!config) throw new Error('Database not found')
  
  const branch = config.branches.find(b => b.name === branchName)
  if (!branch) throw new Error(`Branch ${branchName} not found`)
  
  const mainBranch = config.branches.find(b => b.name === 'main')!
  
  const result = { merged: [] as string[], conflicts: [] as string[] }
  
  // Find migrations unique to branch
  const branchMigrations = branch.migrations.filter(
    m => !mainBranch.migrations.includes(m)
  )
  
  for (const migrationId of branchMigrations) {
    const migration = config.migrations.find(m => m.id === migrationId)
    if (migration) {
      try {
        await executeSql(projectId, migration.up)
        mainBranch.migrations.push(migrationId)
        result.merged.push(migrationId)
      } catch {
        result.conflicts.push(migrationId)
      }
    }
  }
  
  await saveDatabaseConfig(config)
  
  return result
}

/**
 * Get schema info
 */
export async function getSchema(projectId: string): Promise<SchemaInfo> {
  const config = await loadDatabaseConfig(projectId)
  if (!config) throw new Error('Database not found')
  
  const schema: SchemaInfo = { tables: [], indexes: [], relations: [] }
  
  if (config.type === 'sqlite' && config.path) {
    // Query SQLite for schema
    try {
      const tablesResult = await querySqlite(config.path, 
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      )
      
      for (const table of tablesResult) {
        const columns = await querySqlite(config.path, `PRAGMA table_info(${table.name})`)
        
        schema.tables.push({
          name: table.name,
          columns: columns.map((c: any) => ({
            name: c.name,
            type: c.type,
            nullable: c.notnull === 0,
            default: c.dflt_value
          })),
          primaryKey: columns.find((c: any) => c.pk === 1)?.name
        })
      }
    } catch (error) {
      console.error('[DB] Error getting schema:', error)
    }
  }
  
  return schema
}

/**
 * Query SQLite
 */
async function querySqlite(dbPath: string, sql: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const child = spawn('sqlite3', [dbPath, '-json', sql], {
      env: process.env
    })
    
    let stdout = ''
    let stderr = ''
    
    child.stdout?.on('data', (data) => { stdout += data.toString() })
    child.stderr?.on('data', (data) => { stderr += data.toString() })
    
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || 'SQLite error'))
      } else {
        try {
          resolve(stdout.trim() ? JSON.parse(stdout) : [])
        } catch {
          resolve([])
        }
      }
    })
    
    child.on('error', reject)
  })
}

/**
 * Create checkpoint (full DB backup)
 */
export async function createCheckpoint(projectId: string, name: string): Promise<string> {
  const config = await loadDatabaseConfig(projectId)
  if (!config) throw new Error('Database not found')
  
  const checkpointDir = path.join(DB_STATE_DIR, projectId, 'checkpoints')
  await fs.mkdir(checkpointDir, { recursive: true })
  
  const checkpointId = `${Date.now().toString(36)}_${name}`
  
  if (config.type === 'sqlite' && config.path) {
    await fs.copyFile(config.path, path.join(checkpointDir, `${checkpointId}.db`))
  }
  
  // Save metadata
  await fs.writeFile(
    path.join(checkpointDir, `${checkpointId}.json`),
    JSON.stringify({
      id: checkpointId,
      name,
      createdAt: new Date().toISOString(),
      migrations: config.migrations.map(m => ({
        id: m.id,
        name: m.name,
        appliedAt: m.appliedAt
      })),
      branch: config.currentBranch
    }, null, 2)
  )
  
  return checkpointId
}

/**
 * Restore from checkpoint
 */
export async function restoreCheckpoint(projectId: string, checkpointId: string): Promise<void> {
  const config = await loadDatabaseConfig(projectId)
  if (!config) throw new Error('Database not found')
  
  const checkpointDir = path.join(DB_STATE_DIR, projectId, 'checkpoints')
  
  // Load metadata
  const meta = JSON.parse(
    await fs.readFile(path.join(checkpointDir, `${checkpointId}.json`), 'utf-8')
  )
  
  // Restore database file
  if (config.type === 'sqlite' && config.path) {
    await fs.copyFile(
      path.join(checkpointDir, `${checkpointId}.db`),
      config.path
    )
  }
  
  // Update migration state
  for (const migration of config.migrations) {
    migration.appliedAt = meta.migrations.find((m: any) => m.id === migration.id)?.appliedAt
  }
  
  config.currentBranch = meta.branch
  
  await saveDatabaseConfig(config)
}

/**
 * List checkpoints
 */
export async function listCheckpoints(projectId: string): Promise<Array<{
  id: string
  name: string
  createdAt: string
  branch: string
}>> {
  const checkpointDir = path.join(DB_STATE_DIR, projectId, 'checkpoints')
  
  try {
    const files = await fs.readdir(checkpointDir)
    const checkpoints = []
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const content = await fs.readFile(path.join(checkpointDir, file), 'utf-8')
          const meta = JSON.parse(content)
          checkpoints.push({
            id: meta.id,
            name: meta.name,
            createdAt: meta.createdAt,
            branch: meta.branch
          })
        } catch {}
      }
    }
    
    return checkpoints.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch {
    return []
  }
}

/**
 * Generate migration from schema diff
 */
export async function generateMigrationFromSchema(
  projectId: string,
  targetSchema: SchemaInfo
): Promise<Migration> {
  const currentSchema = await getSchema(projectId)
  
  const upStatements: string[] = []
  const downStatements: string[] = []
  
  // Find new tables
  for (const table of targetSchema.tables) {
    const existing = currentSchema.tables.find(t => t.name === table.name)
    
    if (!existing) {
      // Create table
      const columns = table.columns.map(c => {
        let col = `${c.name} ${c.type}`
        if (!c.nullable) col += ' NOT NULL'
        if (c.default) col += ` DEFAULT ${c.default}`
        return col
      }).join(', ')
      
      upStatements.push(`CREATE TABLE ${table.name} (${columns})`)
      downStatements.push(`DROP TABLE ${table.name}`)
    } else {
      // Check for new columns
      for (const column of table.columns) {
        const existingCol = existing.columns.find(c => c.name === column.name)
        
        if (!existingCol) {
          upStatements.push(`ALTER TABLE ${table.name} ADD COLUMN ${column.name} ${column.type}`)
          downStatements.push(`ALTER TABLE ${table.name} DROP COLUMN ${column.name}`)
        }
      }
    }
  }
  
  // Find removed tables
  for (const table of currentSchema.tables) {
    if (!targetSchema.tables.find(t => t.name === table.name)) {
      upStatements.push(`DROP TABLE ${table.name}`)
      downStatements.push(`-- Cannot restore dropped table ${table.name}`)
    }
  }
  
  const name = `schema_update_${Date.now().toString(36)}`
  
  return createMigration(
    projectId,
    name,
    upStatements.join(';\n'),
    downStatements.join(';\n')
  )
}
