/**
 * Dev Server Monitor
 * 
 * Monitors and manages development servers:
 * - Health checks
 * - Auto-restart on crash
 * - Port conflict resolution
 * - Process management
 */

import { spawn, ChildProcess } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import http from 'http'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')
const SERVERS_FILE = path.join(process.cwd(), 'data', 'agent-state', 'servers.json')

export interface ServerInfo {
  id: string
  port: number
  projectId: string
  command: string
  pid?: number
  status: 'starting' | 'running' | 'stopped' | 'crashed' | 'unknown'
  startedAt: string
  lastHealthCheck?: string
  healthCheckFailures: number
  restartCount: number
  logs: LogEntry[]
  url: string
}

export interface LogEntry {
  timestamp: string
  type: 'stdout' | 'stderr' | 'system'
  message: string
}

// Active servers in memory
const activeServers = new Map<string, { process: ChildProcess; info: ServerInfo }>()

// Health check interval
let healthCheckInterval: NodeJS.Timeout | null = null

/**
 * Generate server ID
 */
function generateServerId(): string {
  return `srv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

/**
 * Check if port is in use
 */
async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = http.createServer()
    
    server.once('error', () => resolve(true))
    server.once('listening', () => {
      server.close()
      resolve(false)
    })
    
    server.listen(port)
  })
}

/**
 * Find available port
 */
export async function findAvailablePort(startPort = 3001, maxAttempts = 10): Promise<number> {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    if (!(await isPortInUse(port))) {
      return port
    }
  }
  throw new Error(`No available port found in range ${startPort}-${startPort + maxAttempts}`)
}

/**
 * Health check for a server
 */
async function checkServerHealth(url: string): Promise<{
  healthy: boolean
  responseTime?: number
  statusCode?: number
  error?: string
}> {
  return new Promise((resolve) => {
    const startTime = Date.now()
    
    const req = http.request(`${url}/health`, {
      method: 'GET',
      timeout: 5000
    }, (res) => {
      resolve({
        healthy: res.statusCode ? res.statusCode < 500 : false,
        responseTime: Date.now() - startTime,
        statusCode: res.statusCode
      })
    })
    
    req.on('error', (err) => {
      // Try root path as fallback
      const req2 = http.request(url, {
        method: 'HEAD',
        timeout: 5000
      }, (res) => {
        resolve({
          healthy: res.statusCode ? res.statusCode < 500 : false,
          responseTime: Date.now() - startTime,
          statusCode: res.statusCode
        })
      })
      
      req2.on('error', () => {
        resolve({
          healthy: false,
          error: err.message
        })
      })
      
      req2.end()
    })
    
    req.on('timeout', () => {
      req.destroy()
      resolve({
        healthy: false,
        error: 'Timeout'
      })
    })
    
    req.end()
  })
}

/**
 * Start a development server
 */
export async function startServer(
  projectPath: string,
  command: string,
  preferredPort?: number,
  autoRestart = true
): Promise<ServerInfo> {
  // Find available port
  const port = preferredPort || await findAvailablePort()
  
  const projectId = projectPath.split('/')[0] || projectPath
  
  const info: ServerInfo = {
    id: generateServerId(),
    port,
    projectId,
    command,
    status: 'starting',
    startedAt: new Date().toISOString(),
    healthCheckFailures: 0,
    restartCount: 0,
    logs: [],
    url: `http://localhost:${port}`
  }
  
  const cwd = path.join(WORKSPACE_DIR, projectPath)
  
  // Check if directory exists
  try {
    await fs.access(cwd)
  } catch {
    throw new Error(`Project directory not found: ${projectPath}`)
  }
  
  // Start the process
  const serverProcess = spawn(command, [], {
    cwd,
    shell: true,
    env: {
      ...process.env,
      PORT: port.toString(),
      NODE_ENV: 'development'
    },
    detached: false // Keep it attached so we can monitor
  })
  
  info.pid = serverProcess.pid
  
  // Handle stdout
  serverProcess.stdout?.on('data', (data) => {
    const message = data.toString()
    info.logs.push({
      timestamp: new Date().toISOString(),
      type: 'stdout',
      message: message.slice(0, 500)
    })
    
    // Keep only last 100 logs
    if (info.logs.length > 100) {
      info.logs = info.logs.slice(-100)
    }
    
    // Detect if server is ready
    if (
      message.includes('ready') ||
      message.includes('started') ||
      message.includes('listening') ||
      message.includes('Local: http://localhost')
    ) {
      info.status = 'running'
    }
  })
  
  // Handle stderr
  serverProcess.stderr?.on('data', (data) => {
    const message = data.toString()
    info.logs.push({
      timestamp: new Date().toISOString(),
      type: 'stderr',
      message: message.slice(0, 500)
    })
    
    if (info.logs.length > 100) {
      info.logs = info.logs.slice(-100)
    }
  })
  
  // Handle process exit
  serverProcess.on('close', (code, signal) => {
    info.status = code === 0 ? 'stopped' : 'crashed'
    
    info.logs.push({
      timestamp: new Date().toISOString(),
      type: 'system',
      message: `Process exited with code ${code}, signal ${signal}`
    })
    
    // Auto-restart if enabled
    if (autoRestart && info.restartCount < 3 && code !== 0) {
      setTimeout(() => {
        restartServer(info.id)
      }, 3000)
    }
  })
  
  // Handle process error
  serverProcess.on('error', (err) => {
    info.status = 'crashed'
    info.logs.push({
      timestamp: new Date().toISOString(),
      type: 'system',
      message: `Process error: ${err.message}`
    })
  })
  
  // Store in memory
  activeServers.set(info.id, { process: serverProcess, info })
  
  // Save to disk
  await saveServersState()
  
  // Wait for server to be ready
  await waitForServer(info.url, 30000)
  
  return info
}

/**
 * Wait for server to be ready
 */
async function waitForServer(url: string, timeout = 30000): Promise<boolean> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    const health = await checkServerHealth(url)
    if (health.healthy) {
      return true
    }
    await new Promise(r => setTimeout(r, 500))
  }
  
  return false
}

/**
 * Stop a server
 */
export async function stopServer(serverId: string): Promise<boolean> {
  const server = activeServers.get(serverId)
  
  if (!server) {
    return false
  }
  
  try {
    server.process.kill('SIGTERM')
    server.info.status = 'stopped'
    
    // Wait for process to exit
    await new Promise<void>((resolve) => {
      server.process.on('close', () => resolve())
      setTimeout(() => {
        server.process.kill('SIGKILL')
        resolve()
      }, 5000)
    })
    
    activeServers.delete(serverId)
    await saveServersState()
    
    return true
  } catch {
    return false
  }
}

/**
 * Restart a server
 */
export async function restartServer(serverId: string): Promise<ServerInfo | null> {
  const server = activeServers.get(serverId)
  
  if (!server) {
    return null
  }
  
  const { info } = server
  
  // Stop existing
  await stopServer(serverId)
  
  // Start new
  const newInfo = await startServer(
    info.projectId,
    info.command,
    info.port,
    true
  )
  
  newInfo.restartCount = info.restartCount + 1
  
  return newInfo
}

/**
 * Get server info
 */
export function getServerInfo(serverId: string): ServerInfo | null {
  return activeServers.get(serverId)?.info || null
}

/**
 * Get all active servers
 */
export function getAllServers(): ServerInfo[] {
  return Array.from(activeServers.values()).map(s => s.info)
}

/**
 * Get server by port
 */
export function getServerByPort(port: number): ServerInfo | null {
  for (const [, server] of activeServers) {
    if (server.info.port === port) {
      return server.info
    }
  }
  return null
}

/**
 * Run health check on all servers
 */
export async function runHealthChecks(): Promise<Record<string, {
  healthy: boolean
  responseTime?: number
  error?: string
}>> {
  const results: Record<string, any> = {}
  
  for (const [id, server] of activeServers) {
    const health = await checkServerHealth(server.info.url)
    
    results[id] = health
    
    // Update server info
    server.info.lastHealthCheck = new Date().toISOString()
    
    if (!health.healthy) {
      server.info.healthCheckFailures++
      
      // Auto-restart after 3 failures
      if (server.info.healthCheckFailures >= 3 && server.info.restartCount < 3) {
        await restartServer(id)
      }
    } else {
      server.info.healthCheckFailures = 0
    }
  }
  
  return results
}

/**
 * Start health check loop
 */
export function startHealthChecks(intervalMs = 30000): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval)
  }
  
  healthCheckInterval = setInterval(() => {
    runHealthChecks()
  }, intervalMs)
  
  console.log(`[ServerMonitor] Health checks started (every ${intervalMs}ms)`)
}

/**
 * Stop health check loop
 */
export function stopHealthChecks(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval)
    healthCheckInterval = null
  }
}

/**
 * Save servers state to disk
 */
async function saveServersState(): Promise<void> {
  try {
    const state = Array.from(activeServers.values()).map(s => s.info)
    await fs.mkdir(path.dirname(SERVERS_FILE), { recursive: true })
    await fs.writeFile(SERVERS_FILE, JSON.stringify(state, null, 2))
  } catch {}
}

/**
 * Load servers state from disk
 */
async function loadServersState(): Promise<ServerInfo[]> {
  try {
    const content = await fs.readFile(SERVERS_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
}

/**
 * Stop all servers
 */
export async function stopAllServers(): Promise<void> {
  for (const [id] of activeServers) {
    await stopServer(id)
  }
}

/**
 * Get server logs
 */
export function getServerLogs(serverId: string, limit = 50): LogEntry[] {
  const server = activeServers.get(serverId)
  if (!server) return []
  
  return server.info.logs.slice(-limit)
}

/**
 * Detect framework from project
 */
export async function detectServerCommand(projectPath: string): Promise<string> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  try {
    const pkgContent = await fs.readFile(path.join(fullPath, 'package.json'), 'utf-8')
    const pkg = JSON.parse(pkgContent)
    
    // Check scripts
    if (pkg.scripts?.dev) return 'npm run dev'
    if (pkg.scripts?.start) return 'npm run start'
    
    // Check for Next.js
    if (pkg.dependencies?.next) return 'next dev'
    
    // Check for Vite
    if (pkg.devDependencies?.vite) return 'vite'
    
    // Check for React Scripts
    if (pkg.dependencies?.['react-scripts']) return 'react-scripts start'
    
    // Default
    return 'npm run dev'
  } catch {
    return 'npm run dev'
  }
}
