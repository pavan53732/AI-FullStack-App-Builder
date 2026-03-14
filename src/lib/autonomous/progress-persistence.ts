/**
 * Progress Persistence System
 * 
 * Saves task progress to disk so the AI can:
 * - Resume interrupted tasks
 * - Track completion percentage
 * - Remember previous decisions
 * - Build knowledge from past work
 */

import fs from 'fs/promises'
import path from 'path'

const STATE_DIR = path.join(process.cwd(), 'data', 'agent-state')
const TASKS_DIR = path.join(STATE_DIR, 'tasks')
const HISTORY_DIR = path.join(STATE_DIR, 'history')

export interface TaskProgress {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused'
  prompt: string
  projectId: string
  createdAt: string
  updatedAt: string
  startedAt?: string
  completedAt?: string
  
  // Progress tracking
  iteration: number
  maxIterations: number
  progress: number // 0-100
  
  // Actions
  totalActions: number
  successfulActions: number
  failedActions: number
  actions: ActionRecord[]
  
  // Files
  filesCreated: string[]
  filesModified: string[]
  filesDeleted: string[]
  
  // Errors & Recovery
  errors: ErrorRecord[]
  recoveries: RecoveryRecord[]
  
  // State for resumption
  currentStep?: string
  nextSteps?: string[]
  context: Record<string, any>
  
  // Results
  result?: {
    success: boolean
    message: string
    previewUrl?: string
    apkUrl?: string
  }
}

export interface ActionRecord {
  timestamp: string
  type: string
  details: Record<string, any>
  success: boolean
  duration?: number
  error?: string
}

export interface ErrorRecord {
  timestamp: string
  error: string
  type: string
  file?: string
  line?: number
  resolved: boolean
  resolution?: string
}

export interface RecoveryRecord {
  timestamp: string
  error: string
  attempt: number
  success: boolean
  fix: string
}

// Ensure directories exist
async function ensureDirs() {
  await fs.mkdir(TASKS_DIR, { recursive: true })
  await fs.mkdir(HISTORY_DIR, { recursive: true })
}

/**
 * Generate unique task ID
 */
export function generateTaskId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 6)
  return `task_${timestamp}_${random}`
}

/**
 * Create new task progress
 */
export async function createTask(
  prompt: string,
  projectId: string,
  maxIterations = 50
): Promise<TaskProgress> {
  await ensureDirs()
  
  const task: TaskProgress = {
    id: generateTaskId(),
    status: 'pending',
    prompt,
    projectId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    iteration: 0,
    maxIterations,
    progress: 0,
    totalActions: 0,
    successfulActions: 0,
    failedActions: 0,
    actions: [],
    filesCreated: [],
    filesModified: [],
    filesDeleted: [],
    errors: [],
    recoveries: [],
    context: {}
  }
  
  await saveTask(task)
  return task
}

/**
 * Save task to disk
 */
export async function saveTask(task: TaskProgress): Promise<void> {
  await ensureDirs()
  const filePath = path.join(TASKS_DIR, `${task.id}.json`)
  await fs.writeFile(filePath, JSON.stringify(task, null, 2))
}

/**
 * Load task from disk
 */
export async function loadTask(taskId: string): Promise<TaskProgress | null> {
  try {
    const filePath = path.join(TASKS_DIR, `${taskId}.json`)
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

/**
 * Update task progress
 */
export async function updateTask(
  taskId: string,
  updates: Partial<TaskProgress>
): Promise<TaskProgress | null> {
  const task = await loadTask(taskId)
  if (!task) return null
  
  const updated = {
    ...task,
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  // Calculate progress
  if (updates.iteration !== undefined) {
    updated.progress = (updates.iteration / task.maxIterations) * 100
  }
  
  await saveTask(updated)
  return updated
}

/**
 * Record action in task
 */
export async function recordAction(
  taskId: string,
  action: Omit<ActionRecord, 'timestamp'>
): Promise<void> {
  const task = await loadTask(taskId)
  if (!task) return
  
  const record: ActionRecord = {
    ...action,
    timestamp: new Date().toISOString()
  }
  
  task.actions.push(record)
  task.totalActions++
  
  if (action.success) {
    task.successfulActions++
  } else {
    task.failedActions++
  }
  
  // Track file changes
  if (action.type === 'create_file' && action.details.path) {
    if (!task.filesCreated.includes(action.details.path)) {
      task.filesCreated.push(action.details.path)
    }
  }
  if (action.type === 'modify_file' && action.details.path) {
    if (!task.filesModified.includes(action.details.path)) {
      task.filesModified.push(action.details.path)
    }
  }
  if (action.type === 'delete' && action.details.path) {
    task.filesDeleted.push(action.details.path)
  }
  
  await saveTask(task)
}

/**
 * Record error in task
 */
export async function recordError(
  taskId: string,
  error: Omit<ErrorRecord, 'timestamp' | 'resolved'>
): Promise<void> {
  const task = await loadTask(taskId)
  if (!task) return
  
  task.errors.push({
    ...error,
    timestamp: new Date().toISOString(),
    resolved: false
  })
  
  await saveTask(task)
}

/**
 * Record recovery attempt
 */
export async function recordRecovery(
  taskId: string,
  recovery: Omit<RecoveryRecord, 'timestamp'>
): Promise<void> {
  const task = await loadTask(taskId)
  if (!task) return
  
  task.recoveries.push({
    ...recovery,
    timestamp: new Date().toISOString()
  })
  
  await saveTask(task)
}

/**
 * Mark task as started
 */
export async function startTask(taskId: string): Promise<void> {
  await updateTask(taskId, {
    status: 'running',
    startedAt: new Date().toISOString()
  })
}

/**
 * Mark task as completed
 */
export async function completeTask(
  taskId: string,
  result: TaskProgress['result']
): Promise<void> {
  const task = await loadTask(taskId)
  if (!task) return
  
  await updateTask(taskId, {
    status: 'completed',
    completedAt: new Date().toISOString(),
    progress: 100,
    result
  })
  
  // Move to history
  await archiveTask(taskId)
}

/**
 * Mark task as failed
 */
export async function failTask(
  taskId: string,
  error: string
): Promise<void> {
  await updateTask(taskId, {
    status: 'failed',
    completedAt: new Date().toISOString(),
    result: {
      success: false,
      message: error
    }
  })
  
  await archiveTask(taskId)
}

/**
 * Pause task for resumption later
 */
export async function pauseTask(
  taskId: string,
  currentStep?: string,
  nextSteps?: string[]
): Promise<void> {
  await updateTask(taskId, {
    status: 'paused',
    currentStep,
    nextSteps
  })
}

/**
 * Resume a paused task
 */
export async function resumeTask(taskId: string): Promise<TaskProgress | null> {
  const task = await loadTask(taskId)
  if (!task || task.status !== 'paused') return null
  
  await updateTask(taskId, {
    status: 'running'
  })
  
  return task
}

/**
 * Archive completed task to history
 */
async function archiveTask(taskId: string): Promise<void> {
  try {
    const task = await loadTask(taskId)
    if (!task) return
    
    // Save to history
    const historyPath = path.join(HISTORY_DIR, `${taskId}.json`)
    await fs.writeFile(historyPath, JSON.stringify(task, null, 2))
    
    // Remove from active tasks after a delay
    // (keep for a bit in case user wants to check)
    setTimeout(async () => {
      try {
        const taskPath = path.join(TASKS_DIR, `${taskId}.json`)
        await fs.unlink(taskPath)
      } catch {}
    }, 60000)
  } catch {}
}

/**
 * Get all active tasks
 */
export async function getActiveTasks(): Promise<TaskProgress[]> {
  await ensureDirs()
  
  try {
    const files = await fs.readdir(TASKS_DIR)
    const tasks: TaskProgress[] = []
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      try {
        const content = await fs.readFile(path.join(TASKS_DIR, file), 'utf-8')
        const task = JSON.parse(content)
        if (task.status === 'running' || task.status === 'paused') {
          tasks.push(task)
        }
      } catch {}
    }
    
    return tasks.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  } catch {
    return []
  }
}

/**
 * Get task history
 */
export async function getTaskHistory(limit = 50): Promise<TaskProgress[]> {
  await ensureDirs()
  
  try {
    const files = await fs.readdir(HISTORY_DIR)
    const tasks: TaskProgress[] = []
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      try {
        const content = await fs.readFile(path.join(HISTORY_DIR, file), 'utf-8')
        tasks.push(JSON.parse(content))
      } catch {}
    }
    
    return tasks
      .sort((a, b) => 
        new Date(b.completedAt || b.createdAt).getTime() - 
        new Date(a.completedAt || a.createdAt).getTime()
      )
      .slice(0, limit)
  } catch {
    return []
  }
}

/**
 * Get statistics about tasks
 */
export async function getTaskStats(): Promise<{
  total: number
  completed: number
  failed: number
  paused: number
  running: number
  avgDuration: number
  avgActions: number
  successRate: number
}> {
  const history = await getTaskHistory(100)
  
  const stats = {
    total: history.length,
    completed: history.filter(t => t.status === 'completed').length,
    failed: history.filter(t => t.status === 'failed').length,
    paused: history.filter(t => t.status === 'paused').length,
    running: history.filter(t => t.status === 'running').length,
    avgDuration: 0,
    avgActions: 0,
    successRate: 0
  }
  
  if (history.length > 0) {
    // Average duration
    const durations = history
      .filter(t => t.startedAt && t.completedAt)
      .map(t => 
        new Date(t.completedAt!).getTime() - new Date(t.startedAt!).getTime()
      )
    
    if (durations.length > 0) {
      stats.avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
    }
    
    // Average actions
    stats.avgActions = history.reduce((sum, t) => sum + t.totalActions, 0) / history.length
    
    // Success rate
    stats.successRate = (stats.completed / history.length) * 100
  }
  
  return stats
}

/**
 * Clean up old tasks
 */
export async function cleanupOldTasks(daysOld = 7): Promise<number> {
  const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000)
  let deleted = 0
  
  try {
    const files = await fs.readdir(HISTORY_DIR)
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      
      try {
        const content = await fs.readFile(path.join(HISTORY_DIR, file), 'utf-8')
        const task = JSON.parse(content)
        
        const taskDate = new Date(task.completedAt || task.createdAt).getTime()
        if (taskDate < cutoff) {
          await fs.unlink(path.join(HISTORY_DIR, file))
          deleted++
        }
      } catch {}
    }
  } catch {}
  
  return deleted
}

/**
 * Export task for debugging
 */
export async function exportTask(taskId: string): Promise<string> {
  const task = await loadTask(taskId)
  if (!task) return 'Task not found'
  
  return JSON.stringify(task, null, 2)
}
