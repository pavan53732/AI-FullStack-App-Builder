/**
 * Command Validation System
 * 
 * Validates AI-generated shell commands for security:
 * - Allowlist/blocklist for commands
 * - Pattern matching for dangerous operations
 * - Sandboxed execution paths
 * - Audit logging
 */

import fs from 'fs/promises'
import path from 'path'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')
const AUDIT_LOG = path.join(process.cwd(), 'data', 'audit.log')

// Command categories
export type CommandCategory = 
  | 'safe'
  | 'filesystem'
  | 'network'
  | 'package'
  | 'git'
  | 'database'
  | 'system'
  | 'dangerous'
  | 'blocked'

export interface CommandValidationResult {
  allowed: boolean
  category: CommandCategory
  reason: string
  sanitizedCommand?: string
  warnings: string[]
  risk: 'low' | 'medium' | 'high' | 'critical'
}

export interface AuditLogEntry {
  timestamp: string
  command: string
  category: CommandCategory
  allowed: boolean
  projectId?: string
  reason?: string
  user?: string
}

// Safe commands (always allowed)
const SAFE_COMMANDS = [
  'ls', 'dir', 'pwd', 'echo', 'cat', 'head', 'tail', 'less', 'more',
  'wc', 'sort', 'uniq', 'diff', 'find', 'grep', 'rg', 'fd',
  'node', 'npm', 'npx', 'yarn', 'pnpm', 'bun',
  'git', 'gh',
  'python', 'python3', 'pip', 'pip3',
  'go', 'cargo', 'rustc',
  'make', 'cmake',
  'tsc', 'typescript',
  'eslint', 'prettier',
  'jest', 'vitest', 'mocha',
  'vite', 'next', 'react-scripts',
  'mkdir', 'touch', 'cp', 'mv', 'rm'
]

// Blocked commands (never allowed)
const BLOCKED_COMMANDS = [
  'sudo', 'su', 'doas', 'pkexec',
  'chmod', 'chown', 'chgrp',
  'dd', 'mkfs', 'fdisk', 'parted',
  'iptables', 'ip6tables', 'ufw',
  'systemctl', 'service', 'journalctl',
  'crontab', 'at', 'batch',
  'shutdown', 'reboot', 'poweroff', 'halt',
  'init', 'telinit',
  'useradd', 'userdel', 'usermod', 'passwd',
  'groupadd', 'groupdel',
  'curl', 'wget', // Network - might want to allow with restrictions
  'nc', 'netcat', 'ncat',
  'ssh', 'scp', 'sftp', 'rsync',
  'eval', 'exec',
  'mount', 'umount',
  'kill', 'killall', 'pkill', 'xkill'
]

// Dangerous patterns
const DANGEROUS_PATTERNS = [
  { pattern: /rm\s+-rf\s+\//, reason: 'Recursive delete from root' },
  { pattern: /rm\s+-rf\s+\*/, reason: 'Recursive delete all' },
  { pattern: />\s*\/dev\/(sda|hda|nvme|disk)/, reason: 'Writing to disk device' },
  { pattern: /mkfs/, reason: 'Format filesystem' },
  { pattern: /dd\s+if=.*of=\/dev/, reason: 'DD to device' },
  { pattern: /:(){ :|:& };:/, reason: 'Fork bomb' },
  { pattern: />\s*\/etc\/passwd/, reason: 'Modifying passwd file' },
  { pattern: />\s*\/etc\/shadow/, reason: 'Modifying shadow file' },
  { pattern: /chmod\s+777/, reason: 'Insecure permissions' },
  { pattern: /curl.*\|\s*(ba)?sh/, reason: 'Remote code execution' },
  { pattern: /wget.*\|\s*(ba)?sh/, reason: 'Remote code execution' },
  { pattern: /eval\s+\$/, reason: 'Dynamic eval' },
  { pattern: /\$\(/, reason: 'Command substitution - review needed' },
  { pattern: /`/, reason: 'Backtick command substitution - review needed' },
  { pattern: /&&\s*rm/, reason: 'Conditional delete - review needed' },
  { pattern: /\|\s*rm/, reason: 'Piped delete - review needed' }
]

// Network commands (require review)
const NETWORK_COMMANDS = ['curl', 'wget', 'nc', 'netcat', 'ncat', 'telnet', 'ftp']

// System commands (require review)
const SYSTEM_COMMANDS = ['ps', 'top', 'htop', 'kill', 'pkill', 'killall', 'lsof', 'netstat', 'ss']

/**
 * Validate a command
 */
export function validateCommand(
  command: string,
  options: {
    projectId?: string
    cwd?: string
    allowNetwork?: boolean
    allowSystem?: boolean
  } = {}
): CommandValidationResult {
  const result: CommandValidationResult = {
    allowed: true,
    category: 'safe',
    reason: '',
    warnings: [],
    risk: 'low'
  }
  
  // Parse command
  const trimmedCmd = command.trim()
  const baseCmd = getBaseCommand(trimmedCmd)
  
  // Check blocked commands
  if (BLOCKED_COMMANDS.includes(baseCmd)) {
    result.allowed = false
    result.category = 'blocked'
    result.reason = `Command '${baseCmd}' is blocked for security`
    result.risk = 'critical'
    return result
  }
  
  // Check dangerous patterns
  for (const { pattern, reason } of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmedCmd)) {
      result.allowed = false
      result.category = 'dangerous'
      result.reason = reason
      result.risk = 'critical'
      return result
    }
  }
  
  // Check network commands
  if (NETWORK_COMMANDS.includes(baseCmd)) {
    result.category = 'network'
    result.risk = 'medium'
    
    if (!options.allowNetwork) {
      result.warnings.push('Network command detected - review recommended')
    }
  }
  
  // Check system commands
  if (SYSTEM_COMMANDS.includes(baseCmd)) {
    result.category = 'system'
    result.risk = 'medium'
    
    if (!options.allowSystem) {
      result.warnings.push('System command detected - review recommended')
    }
  }
  
  // Categorize command
  if (baseCmd === 'npm' || baseCmd === 'yarn' || baseCmd === 'pnpm' || baseCmd === 'bun') {
    result.category = 'package'
    result.risk = 'low'
  } else if (baseCmd === 'git') {
    result.category = 'git'
    result.risk = 'low'
  } else if (['mkdir', 'touch', 'cp', 'mv', 'rm'].includes(baseCmd)) {
    result.category = 'filesystem'
    result.risk = 'medium'
    
    // Extra validation for rm
    if (baseCmd === 'rm') {
      if (trimmedCmd.includes('-rf') || trimmedCmd.includes('-r -f')) {
        result.warnings.push('Recursive force delete - be careful')
      }
    }
  } else if (['psql', 'mysql', 'sqlite3', 'mongo'].includes(baseCmd)) {
    result.category = 'database'
    result.risk = 'medium'
  }
  
  // Check for path traversal
  if (trimmedCmd.includes('../') || trimmedCmd.includes('..\\')) {
    result.warnings.push('Path traversal detected - verify paths are safe')
    result.risk = 'medium'
  }
  
  // Check for environment variable manipulation
  if (trimmedCmd.includes('export ') && trimmedCmd.includes('=')) {
    result.warnings.push('Environment variable modification')
  }
  
  // Sanitize command (basic)
  result.sanitizedCommand = sanitizeCommand(trimmedCmd)
  
  return result
}

/**
 * Get base command from command string
 */
function getBaseCommand(command: string): string {
  // Remove sudo if present
  let cmd = command.replace(/^sudo\s+/, '')
  
  // Get first word
  const parts = cmd.split(/\s+/)
  return parts[0] || ''
}

/**
 * Sanitize command
 */
function sanitizeCommand(command: string): string {
  let sanitized = command
  
  // Remove potential shell injection attempts
  sanitized = sanitized.replace(/\$\([^)]+\)/g, '<removed>')
  sanitized = sanitized.replace(/`[^`]+`/g, '<removed>')
  
  return sanitized
}

/**
 * Log command execution
 */
export async function logCommand(
  command: string,
  result: CommandValidationResult,
  options: { projectId?: string; user?: string } = {}
): Promise<void> {
  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    command,
    category: result.category,
    allowed: result.allowed,
    projectId: options.projectId,
    reason: result.reason,
    user: options.user
  }
  
  try {
    await fs.mkdir(path.dirname(AUDIT_LOG), { recursive: true })
    await fs.appendFile(AUDIT_LOG, JSON.stringify(entry) + '\n')
  } catch {}
}

/**
 * Get audit log
 */
export async function getAuditLog(limit = 100): Promise<AuditLogEntry[]> {
  try {
    const content = await fs.readFile(AUDIT_LOG, 'utf-8')
    const lines = content.trim().split('\n').slice(-limit)
    return lines.map(line => JSON.parse(line))
  } catch {
    return []
  }
}

/**
 * Clear audit log
 */
export async function clearAuditLog(): Promise<void> {
  try {
    await fs.unlink(AUDIT_LOG)
  } catch {}
}

/**
 * Validate file path
 */
export function validatePath(
  filePath: string,
  options: {
    projectId?: string
    allowOutsideWorkspace?: boolean
    allowHidden?: boolean
  } = {}
): { allowed: boolean; reason?: string } {
  // Check for path traversal
  if (filePath.includes('..')) {
    return { allowed: false, reason: 'Path traversal detected' }
  }
  
  // Check for absolute path outside workspace
  if (path.isAbsolute(filePath) && !options.allowOutsideWorkspace) {
    const normalized = path.normalize(filePath)
    if (!normalized.startsWith(WORKSPACE_DIR)) {
      return { allowed: false, reason: 'Path outside workspace' }
    }
  }
  
  // Check for hidden files
  if (!options.allowHidden && path.basename(filePath).startsWith('.')) {
    return { allowed: false, reason: 'Hidden files not allowed' }
  }
  
  return { allowed: true }
}

/**
 * Create safe execution context
 */
export function createSafeContext(projectId: string): {
  cwd: string
  env: Record<string, string>
  allowedCommands: string[]
  blockedCommands: string[]
} {
  const cwd = path.join(WORKSPACE_DIR, projectId)
  
  return {
    cwd,
    env: {
      NODE_ENV: 'development',
      HOME: process.env.HOME || '/tmp',
      PATH: process.env.PATH || '',
      // Project-specific
      PROJECT_ID: projectId,
      PROJECT_PATH: cwd
    },
    allowedCommands: SAFE_COMMANDS,
    blockedCommands: BLOCKED_COMMANDS
  }
}

/**
 * Parse command into structured parts
 */
export function parseCommand(command: string): {
  baseCommand: string
  args: string[]
  flags: string[]
  paths: string[]
  hasPipe: boolean
  hasRedirect: boolean
  hasSubstitution: boolean
} {
  const parts = command.trim().split(/\s+/)
  const baseCommand = parts[0] || ''
  
  const args: string[] = []
  const flags: string[] = []
  const paths: string[] = []
  
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i]
    
    if (part.startsWith('-')) {
      flags.push(part)
    } else if (part.includes('/') || part.includes('\\') || part.includes('.')) {
      paths.push(part)
    } else {
      args.push(part)
    }
  }
  
  return {
    baseCommand,
    args,
    flags,
    paths,
    hasPipe: command.includes('|'),
    hasRedirect: command.includes('>') || command.includes('<'),
    hasSubstitution: command.includes('$(') || command.includes('`')
  }
}

/**
 * Get command suggestions
 */
export function getCommandSuggestions(partialCommand: string): string[] {
  const suggestions: string[] = []
  
  const commonCommands = [
    'npm install',
    'npm run dev',
    'npm run build',
    'npm test',
    'npx create-react-app',
    'npx create-next-app',
    'git init',
    'git add .',
    'git commit -m "message"',
    'git push',
    'bun install',
    'bun run dev',
    'ls -la',
    'cat package.json',
    'mkdir src',
    'touch src/index.ts'
  ]
  
  const lowerPartial = partialCommand.toLowerCase()
  
  for (const cmd of commonCommands) {
    if (cmd.toLowerCase().startsWith(lowerPartial)) {
      suggestions.push(cmd)
    }
  }
  
  return suggestions
}
