/**
 * Docker Container Manager
 * 
 * Manages isolated Docker containers for each project:
 * - Creates containers per project
 * - Sets up networking between containers
 * - Manages container lifecycle
 * - Provides subdomain routing
 */

import { spawn, ChildProcess } from 'child_process'
import fs from 'fs/promises'
import path from 'path'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')
const DOCKER_NETWORK = 'ai-builder-network'

export interface ContainerInfo {
  id: string
  name: string
  projectId: string
  image: string
  status: 'creating' | 'running' | 'stopped' | 'error'
  port: number
  url: string
  createdAt: string
  volumes: string[]
  env: Record<string, string>
}

export interface ContainerCreateOptions {
  projectId: string
  image: string
  port?: number
  env?: Record<string, string>
  volumes?: { host: string; container: string }[]
  command?: string
  networkAliases?: string[]
}

// In-memory container tracking
const containers = new Map<string, { info: ContainerInfo; process?: ChildProcess }>()

/**
 * Execute docker command
 */
async function execDocker(args: string[], timeout = 60000): Promise<{
  stdout: string
  stderr: string
  exitCode: number
}> {
  return new Promise((resolve) => {
    const child = spawn('docker', args, {
      env: process.env
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
 * Check if Docker is available
 */
export async function isDockerAvailable(): Promise<boolean> {
  try {
    const result = await execDocker(['--version'], 5000)
    return result.exitCode === 0
  } catch {
    return false
  }
}

/**
 * Create Docker network if not exists
 */
export async function ensureNetwork(): Promise<boolean> {
  try {
    // Check if network exists
    const inspect = await execDocker(['network', 'inspect', DOCKER_NETWORK], 5000)
    if (inspect.exitCode === 0) return true
    
    // Create network
    const result = await execDocker([
      'network', 'create',
      '--driver', 'bridge',
      DOCKER_NETWORK
    ], 10000)
    
    return result.exitCode === 0
  } catch {
    return false
  }
}

/**
 * Find available port
 */
async function findAvailablePort(startPort = 3001): Promise<number> {
  for (let port = startPort; port < startPort + 100; port++) {
    try {
      const result = await execDocker(['ps', '--filter', `publish=${port}`, '-q'], 5000)
      if (!result.stdout.trim()) return port
    } catch {
      return port
    }
  }
  return startPort + 100
}

/**
 * Create a container for a project
 */
export async function createContainer(options: ContainerCreateOptions): Promise<ContainerInfo> {
  await ensureNetwork()
  
  const port = options.port || await findAvailablePort()
  const containerName = `ai-builder-${options.projectId}-${Date.now()}`
  
  const info: ContainerInfo = {
    id: '',
    name: containerName,
    projectId: options.projectId,
    image: options.image,
    status: 'creating',
    port,
    url: `http://localhost:${port}`,
    createdAt: new Date().toISOString(),
    volumes: [],
    env: options.env || {}
  }
  
  // Build docker run args
  const args = [
    'run',
    '-d',
    '--name', containerName,
    '--network', DOCKER_NETWORK,
    '-p', `${port}:${options.port || 3000}`,
    '--label', `ai-builder.project=${options.projectId}`,
    '--label', 'ai-builder.managed=true'
  ]
  
  // Add environment variables
  if (options.env) {
    for (const [key, value] of Object.entries(options.env)) {
      args.push('-e', `${key}=${value}`)
    }
  }
  
  // Add volumes
  if (options.volumes) {
    for (const vol of options.volumes) {
      args.push('-v', `${vol.host}:${vol.container}`)
      info.volumes.push(vol.container)
    }
  }
  
  // Add network aliases
  if (options.networkAliases) {
    for (const alias of options.networkAliases) {
      args.push('--network-alias', alias)
    }
  }
  
  // Add image
  args.push(options.image)
  
  // Add command if specified
  if (options.command) {
    args.push('sh', '-c', options.command)
  }
  
  const result = await execDocker(args, 120000)
  
  if (result.exitCode !== 0) {
    info.status = 'error'
    throw new Error(`Failed to create container: ${result.stderr}`)
  }
  
  info.id = result.stdout.trim().slice(0, 12)
  info.status = 'running'
  
  containers.set(info.id, { info })
  
  return info
}

/**
 * Create a full development environment container
 */
export async function createDevContainer(
  projectId: string,
  framework: 'node' | 'python' | 'go' | 'rust' = 'node'
): Promise<ContainerInfo> {
  const projectPath = path.join(WORKSPACE_DIR, projectId)
  
  const imageMap = {
    node: 'node:20-slim',
    python: 'python:3.11-slim',
    go: 'golang:1.21-alpine',
    rust: 'rust:1.74-slim'
  }
  
  const installCmdMap = {
    node: 'npm install && npm run dev',
    python: 'pip install -r requirements.txt && python main.py',
    go: 'go mod download && go run .',
    rust: 'cargo run'
  }
  
  return createContainer({
    projectId,
    image: imageMap[framework],
    port: 3000,
    volumes: [
      { host: projectPath, container: '/app' }
    ],
    env: {
      NODE_ENV: 'development',
      PORT: '3000'
    },
    command: `cd /app && ${installCmdMap[framework]}`,
    networkAliases: [projectId]
  })
}

/**
 * Create database container
 */
export async function createDatabaseContainer(
  projectId: string,
  dbType: 'postgres' | 'mysql' | 'redis' | 'mongo' = 'postgres'
): Promise<ContainerInfo> {
  const configs = {
    postgres: {
      image: 'postgres:16-alpine',
      port: 5432,
      env: {
        POSTGRES_USER: 'ai_builder',
        POSTGRES_PASSWORD: 'ai_builder_pass',
        POSTGRES_DB: projectId.replace(/[^a-z0-9]/gi, '_')
      }
    },
    mysql: {
      image: 'mysql:8',
      port: 3306,
      env: {
        MYSQL_ROOT_PASSWORD: 'root_pass',
        MYSQL_DATABASE: projectId.replace(/[^a-z0-9]/gi, '_')
      }
    },
    redis: {
      image: 'redis:7-alpine',
      port: 6379,
      env: {}
    },
    mongo: {
      image: 'mongo:7',
      port: 27017,
      env: {
        MONGO_INITDB_DATABASE: projectId.replace(/[^a-z0-9]/gi, '_')
      }
    }
  }
  
  const config = configs[dbType]
  const containerName = `ai-builder-db-${projectId}-${dbType}`
  
  const result = await execDocker([
    'run', '-d',
    '--name', containerName,
    '--network', DOCKER_NETWORK,
    '-p', `${config.port}:${config.port}`,
    '--network-alias', `${projectId}-db`,
    '--label', `ai-builder.project=${projectId}`,
    '--label', 'ai-builder.managed=true',
    '--label', `ai-builder.type=${dbType}`,
    ...Object.entries(config.env).flatMap(([k, v]) => ['-e', `${k}=${v}`]),
    config.image
  ], 60000)
  
  if (result.exitCode !== 0) {
    throw new Error(`Failed to create database container: ${result.stderr}`)
  }
  
  const info: ContainerInfo = {
    id: result.stdout.trim().slice(0, 12),
    name: containerName,
    projectId,
    image: config.image,
    status: 'running',
    port: config.port,
    url: `${dbType}://${projectId}-db:${config.port}`,
    createdAt: new Date().toISOString(),
    volumes: [],
    env: config.env
  }
  
  containers.set(info.id, { info })
  
  return info
}

/**
 * Get container info
 */
export async function getContainerInfo(containerId: string): Promise<ContainerInfo | null> {
  // Check memory first
  const cached = containers.get(containerId)
  if (cached) return cached.info
  
  // Query docker
  const result = await execDocker([
    'inspect',
    '--format', '{{json .}}',
    containerId
  ], 10000)
  
  if (result.exitCode !== 0) return null
  
  try {
    const data = JSON.parse(result.stdout)
    const labels = data.Config?.Labels || {}
    
    const info: ContainerInfo = {
      id: data.Id?.slice(0, 12),
      name: data.Name?.replace(/^\//, ''),
      projectId: labels['ai-builder.project'] || 'unknown',
      image: data.Config?.Image,
      status: data.State?.Running ? 'running' : 'stopped',
      port: data.NetworkSettings?.Ports ? Object.keys(data.NetworkSettings.Ports)[0]?.split('/')[0] : 0,
      url: `http://localhost:${Object.keys(data.NetworkSettings?.Ports || {})[0]?.split('/')[0] || 3000}`,
      createdAt: data.Created,
      volumes: data.Mounts?.map((m: any) => m.Destination) || [],
      env: {}
    }
    
    // Parse env
    for (const env of data.Config?.Env || []) {
      const [key, ...valueParts] = env.split('=')
      info.env[key] = valueParts.join('=')
    }
    
    return info
  } catch {
    return null
  }
}

/**
 * Stop a container
 */
export async function stopContainer(containerId: string): Promise<boolean> {
  const result = await execDocker(['stop', containerId], 30000)
  
  if (result.exitCode === 0) {
    const cached = containers.get(containerId)
    if (cached) cached.info.status = 'stopped'
  }
  
  return result.exitCode === 0
}

/**
 * Start a stopped container
 */
export async function startContainer(containerId: string): Promise<boolean> {
  const result = await execDocker(['start', containerId], 30000)
  
  if (result.exitCode === 0) {
    const cached = containers.get(containerId)
    if (cached) cached.info.status = 'running'
  }
  
  return result.exitCode === 0
}

/**
 * Remove a container
 */
export async function removeContainer(containerId: string, force = false): Promise<boolean> {
  const args = ['rm']
  if (force) args.push('-f')
  args.push(containerId)
  
  const result = await execDocker(args, 30000)
  
  if (result.exitCode === 0) {
    containers.delete(containerId)
  }
  
  return result.exitCode === 0
}

/**
 * Execute command in container
 */
export async function execInContainer(
  containerId: string,
  command: string,
  timeout = 60000
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return execDocker([
    'exec',
    containerId,
    'sh', '-c', command
  ], timeout)
}

/**
 * Get logs from container
 */
export async function getContainerLogs(
  containerId: string,
  tail = 100
): Promise<string> {
  const result = await execDocker(['logs', '--tail', String(tail), containerId], 10000)
  return result.stdout + result.stderr
}

/**
 * List all AI Builder managed containers
 */
export async function listContainers(): Promise<ContainerInfo[]> {
  const result = await execDocker([
    'ps', '-a',
    '--filter', 'label=ai-builder.managed=true',
    '--format', '{{.ID}}'
  ], 10000)
  
  if (result.exitCode !== 0) return []
  
  const ids = result.stdout.trim().split('\n').filter(Boolean)
  const infos: ContainerInfo[] = []
  
  for (const id of ids) {
    const info = await getContainerInfo(id)
    if (info) infos.push(info)
  }
  
  return infos
}

/**
 * Get containers for a project
 */
export async function getProjectContainers(projectId: string): Promise<ContainerInfo[]> {
  const result = await execDocker([
    'ps', '-a',
    '--filter', `label=ai-builder.project=${projectId}`,
    '--format', '{{.ID}}'
  ], 10000)
  
  if (result.exitCode !== 0) return []
  
  const ids = result.stdout.trim().split('\n').filter(Boolean)
  const infos: ContainerInfo[] = []
  
  for (const id of ids) {
    const info = await getContainerInfo(id)
    if (info) infos.push(info)
  }
  
  return infos
}

/**
 * Stop all containers for a project
 */
export async function stopProjectContainers(projectId: string): Promise<void> {
  const containers = await getProjectContainers(projectId)
  await Promise.all(containers.map(c => stopContainer(c.id)))
}

/**
 * Remove all containers for a project
 */
export async function removeProjectContainers(projectId: string): Promise<void> {
  const containers = await getProjectContainers(projectId)
  await Promise.all(containers.map(c => removeContainer(c.id, true)))
}

/**
 * Get container stats (CPU, memory, etc.)
 */
export async function getContainerStats(containerId: string): Promise<{
  cpu: number
  memory: { used: number; total: number; percent: number }
  network: { rx: number; tx: number }
} | null> {
  const result = await execDocker([
    'stats',
    '--no-stream',
    '--format', '{{json .}}',
    containerId
  ], 10000)
  
  if (result.exitCode !== 0) return null
  
  try {
    const data = JSON.parse(result.stdout)
    
    const parsePercent = (str: string) => parseFloat(str.replace('%', ''))
    const parseMemory = (str: string) => {
      const match = str.match(/([\d.]+)([GMK]?i?B)/)
      if (!match) return 0
      const [, num, unit] = match
      const mult: Record<string, number> = { 'B': 1, 'KB': 1024, 'MB': 1024**2, 'GB': 1024**3, 'GiB': 1024**3, 'MiB': 1024**2, 'KiB': 1024 }
      return parseFloat(num) * (mult[unit] || 1)
    }
    
    return {
      cpu: parsePercent(data.CPUPerc || '0%'),
      memory: {
        used: parseMemory(data.MemUsage?.split('/')[0] || '0'),
        total: parseMemory(data.MemUsage?.split('/')[1] || '0'),
        percent: parsePercent(data.MemPerc || '0%')
      },
      network: {
        rx: parseMemory(data.NetIO?.split('/')[0] || '0'),
        tx: parseMemory(data.NetIO?.split('/')[1] || '0')
      }
    }
  } catch {
    return null
  }
}

/**
 * Prune unused containers, images, volumes
 */
export async function pruneDocker(): Promise<{
  containers: number
  images: number
  volumes: number
  spaceReclaimed: string
}> {
  const result = await execDocker([
    'system', 'prune', '-f', '--volumes'
  ], 120000)
  
  // Parse output
  const containers = (result.stdout.match(/Deleted Containers:.*?(\d+)/)?.[1] || '0')
  const images = (result.stdout.match(/Deleted Images:.*?(\d+)/)?.[1] || '0')
  const space = (result.stdout.match(/Total reclaimed space: ([\d.]+[GMK]?B)/)?.[1] || '0B')
  
  return {
    containers: parseInt(containers),
    images: parseInt(images),
    volumes: 0,
    spaceReclaimed: space
  }
}
