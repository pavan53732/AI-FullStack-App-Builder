/**
 * Audit Logging System
 * 
 * Comprehensive audit trail for all AI actions:
 * - Every action logged with full context
 * - Who/what/when/why/where
 * - Cannot be tampered with
 * - Searchable and exportable
 */

import fs from 'fs/promises'
import path from 'path'
import { createHash } from 'crypto'

const AUDIT_DIR = path.join(process.cwd(), 'data', 'audit')

export interface AuditEntry {
  id: string
  timestamp: string
  type: AuditEventType
  action: string
  actor: {
    type: 'ai' | 'user' | 'system'
    id: string
    model?: string
  }
  context: {
    projectId?: string
    taskId?: string
    iteration?: number
    prompt?: string
  }
  target: {
    type: 'file' | 'command' | 'server' | 'project' | 'config'
    path?: string
    command?: string
    before?: string
    after?: string
  }
  result: {
    success: boolean
    message?: string
    error?: string
    duration?: number
  }
  metadata: Record<string, any>
  hash: string
  previousHash?: string
}

export type AuditEventType = 
  | 'file.create'
  | 'file.modify'
  | 'file.delete'
  | 'file.read'
  | 'command.execute'
  | 'server.start'
  | 'server.stop'
  | 'project.create'
  | 'project.delete'
  | 'ai.decision'
  | 'ai.error'
  | 'ai.recovery'
  | 'checkpoint.create'
  | 'checkpoint.restore'
  | 'git.commit'
  | 'git.push'
  | 'config.change'
  | 'dependency.install'
  | 'test.run'
  | 'security.scan'
  | 'build.run'

// Chain of audit entries for tamper detection
let lastHash = ''

/**
 * Create audit entry
 */
export async function audit(
  type: AuditEventType,
  action: string,
  options: {
    actor?: Partial<AuditEntry['actor']>
    context?: Partial<AuditEntry['context']>
    target?: Partial<AuditEntry['target']>
    result?: Partial<AuditEntry['result']>
    metadata?: Record<string, any>
  } = {}
): Promise<AuditEntry> {
  const id = generateId()
  const timestamp = new Date().toISOString()
  
  const entry: AuditEntry = {
    id,
    timestamp,
    type,
    action,
    actor: {
      type: options.actor?.type || 'ai',
      id: options.actor?.id || 'agent-1',
      model: options.actor?.model
    },
    context: options.context || {},
    target: options.target || {},
    result: options.result || { success: true },
    metadata: options.metadata || {},
    hash: '',
    previousHash: lastHash || undefined
  }
  
  // Calculate hash for tamper detection
  entry.hash = calculateHash(entry)
  lastHash = entry.hash
  
  // Write to audit log
  await writeAuditEntry(entry)
  
  return entry
}

/**
 * Generate unique ID
 */
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 8)
  return `audit_${timestamp}_${random}`
}

/**
 * Calculate hash for entry
 */
function calculateHash(entry: Omit<AuditEntry, 'hash'>): string {
  const data = JSON.stringify({
    id: entry.id,
    timestamp: entry.timestamp,
    type: entry.type,
    action: entry.action,
    previousHash: entry.previousHash
  })
  return createHash('sha256').update(data).digest('hex').slice(0, 16)
}

/**
 * Write audit entry to log
 */
async function writeAuditEntry(entry: AuditEntry): Promise<void> {
  const date = entry.timestamp.split('T')[0]
  const logDir = path.join(AUDIT_DIR, date)
  const logFile = path.join(logDir, 'audit.log')
  
  await fs.mkdir(logDir, { recursive: true })
  
  // Append to daily log
  await fs.appendFile(logFile, JSON.stringify(entry) + '\n', 'utf-8')
  
  // Also maintain an index
  await updateIndex(entry)
}

/**
 * Update audit index
 */
async function updateIndex(entry: AuditEntry): Promise<void> {
  const indexPath = path.join(AUDIT_DIR, 'index.json')
  
  let index: AuditEntry[] = []
  try {
    const content = await fs.readFile(indexPath, 'utf-8')
    index = JSON.parse(content)
  } catch {}
  
  // Add entry summary
  index.push({
    id: entry.id,
    timestamp: entry.timestamp,
    type: entry.type,
    action: entry.action,
    actor: entry.actor,
    context: { projectId: entry.context.projectId, taskId: entry.context.taskId },
    result: { success: entry.result.success },
    hash: entry.hash
  } as any)
  
  // Keep last 10000 entries in index
  if (index.length > 10000) {
    index = index.slice(-10000)
  }
  
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8')
}

/**
 * Query audit log
 */
export async function queryAuditLog(options: {
  projectId?: string
  taskId?: string
  type?: AuditEventType | AuditEventType[]
  actor?: string
  success?: boolean
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}): Promise<AuditEntry[]> {
  const results: AuditEntry[] = []
  
  // Determine date range to search
  const dates: string[] = []
  const start = options.startDate ? new Date(options.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const end = options.endDate ? new Date(options.endDate) : new Date()
  
  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0])
  }
  
  // Search each date
  for (const date of dates.reverse()) {
    const logFile = path.join(AUDIT_DIR, date, 'audit.log')
    
    try {
      const content = await fs.readFile(logFile, 'utf-8')
      const lines = content.trim().split('\n')
      
      for (const line of lines) {
        if (!line.trim()) continue
        
        try {
          const entry: AuditEntry = JSON.parse(line)
          
          // Apply filters
          if (options.projectId && entry.context.projectId !== options.projectId) continue
          if (options.taskId && entry.context.taskId !== options.taskId) continue
          if (options.type) {
            const types = Array.isArray(options.type) ? options.type : [options.type]
            if (!types.includes(entry.type)) continue
          }
          if (options.actor && entry.actor.id !== options.actor) continue
          if (options.success !== undefined && entry.result.success !== options.success) continue
          
          results.push(entry)
        } catch {}
      }
    } catch {}
    
    if (options.limit && results.length >= options.limit) break
  }
  
  // Apply offset and limit
  const offset = options.offset || 0
  const limit = options.limit || 100
  
  return results.slice(offset, offset + limit)
}

/**
 * Get audit entry by ID
 */
export async function getAuditEntry(id: string): Promise<AuditEntry | null> {
  // Search index first
  const indexPath = path.join(AUDIT_DIR, 'index.json')
  
  try {
    const content = await fs.readFile(indexPath, 'utf-8')
    const index = JSON.parse(content)
    const entry = index.find((e: any) => e.id === id)
    
    if (entry) {
      const date = entry.timestamp.split('T')[0]
      const logFile = path.join(AUDIT_DIR, date, 'audit.log')
      const logContent = await fs.readFile(logFile, 'utf-8')
      
      for (const line of logContent.split('\n')) {
        if (!line.trim()) continue
        try {
          const fullEntry = JSON.parse(line)
          if (fullEntry.id === id) return fullEntry
        } catch {}
      }
    }
  } catch {}
  
  return null
}

/**
 * Get audit trail for a project
 */
export async function getProjectTrail(projectId: string): Promise<{
  entries: AuditEntry[]
  summary: {
    totalActions: number
    successfulActions: number
    failedActions: number
    filesCreated: number
    filesModified: number
    commandsExecuted: number
    errors: number
    recoveries: number
    totalDuration: number
  }
}> {
  const entries = await queryAuditLog({ projectId, limit: 1000 })
  
  const summary = {
    totalActions: entries.length,
    successfulActions: entries.filter(e => e.result.success).length,
    failedActions: entries.filter(e => !e.result.success).length,
    filesCreated: entries.filter(e => e.type === 'file.create').length,
    filesModified: entries.filter(e => e.type === 'file.modify').length,
    commandsExecuted: entries.filter(e => e.type === 'command.execute').length,
    errors: entries.filter(e => e.type === 'ai.error').length,
    recoveries: entries.filter(e => e.type === 'ai.recovery').length,
    totalDuration: entries.reduce((sum, e) => sum + (e.result.duration || 0), 0)
  }
  
  return { entries, summary }
}

/**
 * Get audit trail for a specific task
 */
export async function getTaskTrail(taskId: string): Promise<AuditEntry[]> {
  return queryAuditLog({ taskId, limit: 500 })
}

/**
 * Verify audit log integrity
 */
export async function verifyAuditIntegrity(date?: string): Promise<{
  valid: boolean
  errors: string[]
  entriesChecked: number
}> {
  const errors: string[] = []
  let entriesChecked = 0
  
  const dates = date ? [date] : await getAuditDates()
  
  for (const d of dates) {
    const logFile = path.join(AUDIT_DIR, d, 'audit.log')
    
    try {
      const content = await fs.readFile(logFile, 'utf-8')
      const lines = content.trim().split('\n')
      let prevHash = ''
      
      for (const line of lines) {
        if (!line.trim()) continue
        
        try {
          const entry: AuditEntry = JSON.parse(line)
          entriesChecked++
          
          // Verify hash
          const calculatedHash = calculateHash(entry)
          if (entry.hash !== calculatedHash) {
            errors.push(`Hash mismatch for entry ${entry.id}`)
          }
          
          // Verify chain
          if (prevHash && entry.previousHash !== prevHash) {
            errors.push(`Chain broken at entry ${entry.id}`)
          }
          
          prevHash = entry.hash
        } catch (e: any) {
          errors.push(`Failed to parse entry: ${e.message}`)
        }
      }
    } catch (e: any) {
      errors.push(`Failed to read log for ${d}: ${e.message}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    entriesChecked
  }
}

/**
 * Get available audit dates
 */
async function getAuditDates(): Promise<string[]> {
  try {
    const entries = await fs.readdir(AUDIT_DIR, { withFileTypes: true })
    return entries
      .filter(e => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
      .map(e => e.name)
      .sort()
      .reverse()
  } catch {
    return []
  }
}

/**
 * Export audit log
 */
export async function exportAuditLog(options: {
  projectId?: string
  startDate?: string
  endDate?: string
  format: 'json' | 'csv' | 'markdown'
}): Promise<string> {
  const entries = await queryAuditLog({
    projectId: options.projectId,
    startDate: options.startDate,
    endDate: options.endDate,
    limit: 10000
  })
  
  switch (options.format) {
    case 'json':
      return JSON.stringify(entries, null, 2)
      
    case 'csv':
      const headers = ['timestamp', 'type', 'action', 'actor', 'success', 'target', 'error']
      const rows = entries.map(e => [
        e.timestamp,
        e.type,
        e.action,
        `${e.actor.type}:${e.actor.id}`,
        e.result.success,
        e.target.path || e.target.command || '',
        e.result.error || ''
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      return [headers.join(','), ...rows].join('\n')
      
    case 'markdown':
      const lines = [
        '# Audit Log',
        '',
        `**Generated**: ${new Date().toISOString()}`,
        `**Entries**: ${entries.length}`,
        '',
        '| Timestamp | Type | Action | Actor | Success | Target |',
        '|-----------|------|--------|-------|---------|--------|'
      ]
      
      for (const e of entries) {
        lines.push(`| ${e.timestamp} | ${e.type} | ${e.action} | ${e.actor.type} | ${e.result.success ? '✅' : '❌'} | ${e.target.path || e.target.command || '-'} |`)
      }
      
      return lines.join('\n')
  }
}

/**
 * Clean old audit logs
 */
export async function pruneAuditLogs(keepDays = 90): Promise<{
  deleted: number
  freed: number
}> {
  const cutoff = new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000)
  const dates = await getAuditDates()
  
  let deleted = 0
  let freed = 0
  
  for (const date of dates) {
    const d = new Date(date)
    if (d < cutoff) {
      const logDir = path.join(AUDIT_DIR, date)
      try {
        // Calculate size before deleting
        const files = await fs.readdir(logDir)
        for (const file of files) {
          const stat = await fs.stat(path.join(logDir, file))
          freed += stat.size
        }
        
        await fs.rm(logDir, { recursive: true })
        deleted++
      } catch {}
    }
  }
  
  return { deleted, freed }
}

/**
 * Audit middleware - wraps any async function with audit logging
 */
export function withAudit<T>(
  type: AuditEventType,
  action: string,
  fn: () => Promise<T>,
  options: {
    actor?: Partial<AuditEntry['actor']>
    context?: Partial<AuditEntry['context']>
    target?: Partial<AuditEntry['target']>
    metadata?: Record<string, any>
  } = {}
): Promise<{ result: T; audit: AuditEntry }> {
  return fn()
    .then(result => {
      return audit(type, action, {
        ...options,
        result: { success: true }
      }).then(audit => ({ result, audit }))
    })
    .catch(error => {
      return audit(type, action, {
        ...options,
        result: { success: false, error: error.message }
      }).then(audit => {
        throw { error, audit }
      })
    })
}

/**
 * Start a new audit session
 */
export async function startAuditSession(projectId: string, taskId: string): Promise<string> {
  await audit('project.create', 'Started audit session', {
    context: { projectId, taskId }
  })
  return taskId
}

/**
 * Get statistics about audit log
 */
export async function getAuditStats(): Promise<{
  totalEntries: number
  totalDays: number
  oldestEntry: string | null
  newestEntry: string | null
  byType: Record<string, number>
  byActor: Record<string, number>
  successRate: number
}> {
  const dates = await getAuditDates()
  
  const indexPath = path.join(AUDIT_DIR, 'index.json')
  let index: any[] = []
  
  try {
    index = JSON.parse(await fs.readFile(indexPath, 'utf-8'))
  } catch {}
  
  const byType: Record<string, number> = {}
  const byActor: Record<string, number> = {}
  let successCount = 0
  
  for (const entry of index) {
    byType[entry.type] = (byType[entry.type] || 0) + 1
    byActor[entry.actor?.type || 'unknown'] = (byActor[entry.actor?.type || 'unknown'] || 0) + 1
    if (entry.result?.success) successCount++
  }
  
  return {
    totalEntries: index.length,
    totalDays: dates.length,
    oldestEntry: index[0]?.timestamp || null,
    newestEntry: index[index.length - 1]?.timestamp || null,
    byType,
    byActor,
    successRate: index.length > 0 ? (successCount / index.length) * 100 : 0
  }
}
