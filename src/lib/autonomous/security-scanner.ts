/**
 * Security Scanner (SAST)
 * 
 * Static Application Security Testing for generated code:
 * - SQL injection detection
 * - XSS vulnerability detection
 * - Hardcoded secrets detection
 * - Insecure dependencies
 * - OWASP Top 10 checks
 */

import fs from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')

export interface SecurityIssue {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  category: string
  title: string
  description: string
  file: string
  line?: number
  column?: number
  code?: string
  fix?: string
  cwe?: string
  owasp?: string
}

export interface ScanResult {
  passed: boolean
  issues: SecurityIssue[]
  summary: {
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }
  duration: number
}

// Security patterns to detect
const SECURITY_PATTERNS = [
  // SQL Injection
  {
    id: 'SQL-INJECTION-001',
    severity: 'critical' as const,
    category: 'Injection',
    title: 'Potential SQL Injection',
    pattern: /(?:query|execute|exec)\s*\(\s*[`'"]\s*SELECT.*\$\{|SELECT.*\+|SELECT.*\$\s*\w+/gi,
    description: 'SQL query constructed with user input without parameterization',
    fix: 'Use parameterized queries or prepared statements',
    cwe: 'CWE-89',
    owasp: 'A03:2021'
  },
  {
    id: 'SQL-INJECTION-002',
    severity: 'critical' as const,
    category: 'Injection',
    title: 'SQL Injection via string concatenation',
    pattern: /(?:query|execute)\s*\([^)]*\+\s*[^)]*\)/gi,
    description: 'SQL query uses string concatenation with potentially unsafe data',
    fix: 'Use parameterized queries instead of string concatenation',
    cwe: 'CWE-89',
    owasp: 'A03:2021'
  },
  
  // XSS
  {
    id: 'XSS-001',
    severity: 'high' as const,
    category: 'XSS',
    title: 'Potential XSS via innerHTML',
    pattern: /\.innerHTML\s*=\s*[^;]*(?:\$\{|`[^`]*\$\{|request\.|params\.|body\.)/gi,
    description: 'innerHTML used with potentially unsanitized input',
    fix: 'Use textContent or sanitize HTML with DOMPurify',
    cwe: 'CWE-79',
    owasp: 'A03:2021'
  },
  {
    id: 'XSS-002',
    severity: 'high' as const,
    category: 'XSS',
    title: 'React dangerouslySetInnerHTML',
    pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/gi,
    description: 'dangerouslySetInnerHTML can lead to XSS if content is not sanitized',
    fix: 'Sanitize HTML content before using dangerouslySetInnerHTML',
    cwe: 'CWE-79',
    owasp: 'A03:2021'
  },
  {
    id: 'XSS-003',
    severity: 'medium' as const,
    category: 'XSS',
    title: 'document.write usage',
    pattern: /document\.write\s*\(/gi,
    description: 'document.write can lead to XSS vulnerabilities',
    fix: 'Use DOM manipulation methods instead of document.write',
    cwe: 'CWE-79',
    owasp: 'A03:2021'
  },
  
  // Hardcoded Secrets
  {
    id: 'SECRET-001',
    severity: 'critical' as const,
    category: 'Secrets',
    title: 'Hardcoded API Key',
    pattern: /(?:api[_-]?key|apikey)\s*[=:]\s*['""][a-zA-Z0-9]{20,}['""]/gi,
    description: 'API key appears to be hardcoded in source',
    fix: 'Store API keys in environment variables or secret manager',
    cwe: 'CWE-798',
    owasp: 'A07:2021'
  },
  {
    id: 'SECRET-002',
    severity: 'critical' as const,
    category: 'Secrets',
    title: 'Hardcoded Password',
    pattern: /(?:password|passwd|pwd)\s*[=:]\s*['""][^'""]+['""]/gi,
    description: 'Password appears to be hardcoded in source',
    fix: 'Store passwords securely, never in source code',
    cwe: 'CWE-798',
    owasp: 'A07:2021'
  },
  {
    id: 'SECRET-003',
    severity: 'critical' as const,
    category: 'Secrets',
    title: 'Hardcoded JWT Secret',
    pattern: /(?:jwt[_-]?secret|secret[_-]?key)\s*[=:]\s*['""][^'""]+['""]/gi,
    description: 'JWT secret appears to be hardcoded',
    fix: 'Store JWT secret in environment variables',
    cwe: 'CWE-798',
    owasp: 'A07:2021'
  },
  {
    id: 'SECRET-004',
    severity: 'high' as const,
    category: 'Secrets',
    title: 'AWS Access Key',
    pattern: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/g,
    description: 'AWS access key detected in code',
    fix: 'Use IAM roles or environment variables for AWS credentials',
    cwe: 'CWE-798',
    owasp: 'A07:2021'
  },
  {
    id: 'SECRET-005',
    severity: 'high' as const,
    category: 'Secrets',
    title: 'Private Key',
    pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g,
    description: 'Private key found in source code',
    fix: 'Store private keys securely outside of source code',
    cwe: 'CWE-798',
    owasp: 'A07:2021'
  },
  
  // Authentication/Authorization
  {
    id: 'AUTH-001',
    severity: 'high' as const,
    category: 'Authentication',
    title: 'Weak Password Hashing',
    pattern: /(?:md5|sha1)\s*\(\s*(?:password|passwd|pwd)/gi,
    description: 'Weak hashing algorithm used for passwords',
    fix: 'Use bcrypt, argon2, or scrypt for password hashing',
    cwe: 'CWE-328',
    owasp: 'A02:2021'
  },
  {
    id: 'AUTH-002',
    severity: 'medium' as const,
    category: 'Authentication',
    title: 'JWT Algorithm None',
    pattern: /algorithm\s*:\s*['""]none['""]/gi,
    description: 'JWT with "none" algorithm is insecure',
    fix: 'Use strong algorithms like RS256 or ES256',
    cwe: 'CWE-327',
    owasp: 'A02:2021'
  },
  {
    id: 'AUTH-003',
    severity: 'high' as const,
    category: 'Authentication',
    title: 'No Auth Required',
    pattern: /(?:app\.use|router\.(?:get|post|put|delete))\s*\(\s*['""]\/api\/(?!auth|login|register|public)/gi,
    description: 'API endpoint may lack authentication',
    fix: 'Ensure proper authentication middleware is applied',
    cwe: 'CWE-306',
    owasp: 'A01:2021'
  },
  
  // SSRF
  {
    id: 'SSRF-001',
    severity: 'high' as const,
    category: 'SSRF',
    title: 'Potential SSRF',
    pattern: /(?:fetch|axios|request|http\.get)\s*\(\s*(?:req\.|request\.|params\.|body\.)/gi,
    description: 'URL from user input used in HTTP request',
    fix: 'Validate and whitelist allowed URLs',
    cwe: 'CWE-918',
    owasp: 'A10:2021'
  },
  
  // Path Traversal
  {
    id: 'PATH-001',
    severity: 'high' as const,
    category: 'Path Traversal',
    title: 'Potential Path Traversal',
    pattern: /(?:readFile|writeFile|fs\.read|fs\.write)\s*\(\s*(?:req\.|params\.|body\.)/gi,
    description: 'File path from user input without validation',
    fix: 'Validate and sanitize file paths, use allowlists',
    cwe: 'CWE-22',
    owasp: 'A01:2021'
  },
  
  // Command Injection
  {
    id: 'CMD-001',
    severity: 'critical' as const,
    category: 'Injection',
    title: 'Command Injection',
    pattern: /(?:exec|spawn)\s*\(\s*(?:`[^`]*\$\{|['""][^'""]*\+|req\.|params\.)/gi,
    description: 'System command with potentially unsafe input',
    fix: 'Avoid shell commands with user input, use safe alternatives',
    cwe: 'CWE-78',
    owasp: 'A03:2021'
  },
  
  // Eval
  {
    id: 'EVAL-001',
    severity: 'high' as const,
    category: 'Injection',
    title: 'eval() usage',
    pattern: /eval\s*\(\s*(?:req\.|params\.|body\.|`[^`]*\$\{)/gi,
    description: 'eval() with potentially unsafe input',
    fix: 'Never use eval() with user input',
    cwe: 'CWE-95',
    owasp: 'A03:2021'
  },
  
  // CORS
  {
    id: 'CORS-001',
    severity: 'medium' as const,
    category: 'Configuration',
    title: 'Overly Permissive CORS',
    pattern: /cors\s*\(\s*\{\s*origin\s*:\s*['""]\*['""]/gi,
    description: 'CORS allows all origins',
    fix: 'Restrict CORS to trusted origins only',
    cwe: 'CWE-942',
    owasp: 'A05:2021'
  },
  
  // Insecure Dependencies
  {
    id: 'DEPS-001',
    severity: 'high' as const,
    category: 'Dependencies',
    title: 'Known Vulnerable Package',
    pattern: /"event-stream":|"express-jsdoc-swagger":|"lodash":\s*"0\./g,
    description: 'Package with known vulnerabilities',
    fix: 'Update to a secure version or find alternative',
    cwe: 'CWE-1035',
    owasp: 'A06:2021'
  },
  
  // Debug in Production
  {
    id: 'DEBUG-001',
    severity: 'low' as const,
    category: 'Configuration',
    title: 'Debug Mode Enabled',
    pattern: /debug\s*[=:]\s*true|DEBUG\s*=\s*['""]*true/gi,
    description: 'Debug mode may be enabled in production',
    fix: 'Disable debug mode in production',
    cwe: 'CWE-489',
    owasp: 'A05:2021'
  },
  
  // Error Exposure
  {
    id: 'ERROR-001',
    severity: 'medium' as const,
    category: 'Information Disclosure',
    title: 'Stack Trace Exposure',
    pattern: /res\.send\s*\(\s*(?:err|error)\.stack|console\.log\s*\(\s*(?:err|error)\.stack/gi,
    description: 'Stack traces may be exposed to users',
    fix: 'Log errors internally, show generic messages to users',
    cwe: 'CWE-209',
    owasp: 'A05:2021'
  },
  
  // NoSQL Injection
  {
    id: 'NOSQL-001',
    severity: 'critical' as const,
    category: 'Injection',
    title: 'NoSQL Injection',
    pattern: /\$where\s*:|\$regex\s*:.*req\.|\$gt\s*:.*req\./gi,
    description: 'NoSQL query with potentially unsafe input',
    fix: 'Validate and sanitize MongoDB operators',
    cwe: 'CWE-943',
    owasp: 'A03:2021'
  }
]

/**
 * Scan a single file for security issues
 */
export async function scanFile(
  filePath: string,
  content: string
): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = []
  const lines = content.split('\n')
  
  for (const pattern of SECURITY_PATTERNS) {
    const matches = content.matchAll(pattern.pattern)
    
    for (const match of matches) {
      // Find line number
      let lineNumber = 1
      let colNumber = 1
      const beforeMatch = content.slice(0, match.index)
      const lineBreaks = beforeMatch.match(/\n/g)
      if (lineBreaks) {
        lineNumber = lineBreaks.length + 1
        const lastLineBreak = beforeMatch.lastIndexOf('\n')
        colNumber = match.index - lastLineBreak
      }
      
      issues.push({
        id: pattern.id,
        severity: pattern.severity,
        category: pattern.category,
        title: pattern.title,
        description: pattern.description,
        file: filePath,
        line: lineNumber,
        column: colNumber,
        code: lines[lineNumber - 1]?.trim(),
        fix: pattern.fix,
        cwe: pattern.cwe,
        owasp: pattern.owasp
      })
    }
  }
  
  return issues
}

/**
 * Scan entire project for security issues
 */
export async function scanProject(projectPath: string): Promise<ScanResult> {
  const startTime = Date.now()
  const issues: SecurityIssue[] = []
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  // Get all source files
  const files = await getSourceFiles(fullPath)
  
  // Scan each file
  for (const file of files) {
    const fileIssues = await scanFile(file.path, file.content)
    issues.push(...fileIssues)
  }
  
  // Run npm audit for dependency vulnerabilities
  const depIssues = await runNpmAudit(projectPath)
  issues.push(...depIssues)
  
  // Calculate summary
  const summary = {
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length,
    info: issues.filter(i => i.severity === 'info').length
  }
  
  return {
    passed: summary.critical === 0 && summary.high === 0,
    issues,
    summary,
    duration: Date.now() - startTime
  }
}

/**
 * Get all source files recursively
 */
async function getSourceFiles(dir: string): Promise<Array<{ path: string; content: string }>> {
  const files: Array<{ path: string; content: string }> = []
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      if (['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(entry.name)) {
        continue
      }
      
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        files.push(...await getSourceFiles(fullPath))
      } else if (entry.name.match(/\.(tsx?|jsx?|vue|py|go|rs)$/)) {
        const content = await fs.readFile(fullPath, 'utf-8')
        files.push({
          path: fullPath,
          content
        })
      }
    }
  } catch {}
  
  return files
}

/**
 * Run npm audit for dependency vulnerabilities
 */
async function runNpmAudit(projectPath: string): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = []
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  try {
    const result = await new Promise<string>((resolve) => {
      const child = spawn('npm', ['audit', '--json'], {
        cwd: fullPath,
        shell: true
      })
      
      let stdout = ''
      child.stdout?.on('data', (data) => { stdout += data.toString() })
      child.on('close', () => resolve(stdout))
      child.on('error', () => resolve(''))
      
      setTimeout(() => {
        child.kill()
        resolve('')
      }, 30000)
    })
    
    const audit = JSON.parse(result)
    
    if (audit.vulnerabilities) {
      for (const [name, vuln] of Object.entries(audit.vulnerabilities)) {
        const v = vuln as any
        issues.push({
          id: `NPM-AUDIT-${name}`,
          severity: v.severity || 'medium',
          category: 'Dependencies',
          title: `Vulnerable dependency: ${name}`,
          description: v.via?.[0]?.title || 'Known vulnerability in package',
          file: 'package.json',
          fix: `Update ${name} to version ${v.fixAvailable?.name || 'latest'}`
        })
      }
    }
  } catch {}
  
  return issues
}

/**
 * Quick security check for critical issues only
 */
export async function quickSecurityCheck(projectPath: string): Promise<{
  safe: boolean
  criticalIssues: number
  highIssues: number
}> {
  const result = await scanProject(projectPath)
  
  return {
    safe: result.summary.critical === 0 && result.summary.high === 0,
    criticalIssues: result.summary.critical,
    highIssues: result.summary.high
  }
}

/**
 * Generate security report
 */
export function generateSecurityReport(result: ScanResult): string {
  const lines: string[] = [
    '# Security Scan Report',
    '',
    `**Status**: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`,
    `**Duration**: ${result.duration}ms`,
    '',
    '## Summary',
    '',
    `| Severity | Count |`,
    `|----------|-------|`,
    `| 🔴 Critical | ${result.summary.critical} |`,
    `| 🟠 High | ${result.summary.high} |`,
    `| 🟡 Medium | ${result.summary.medium} |`,
    `| 🟢 Low | ${result.summary.low} |`,
    `| ℹ️ Info | ${result.summary.info} |`,
    ''
  ]
  
  if (result.issues.length > 0) {
    lines.push('## Issues', '')
    
    const grouped = groupBy(result.issues, 'severity')
    
    for (const severity of ['critical', 'high', 'medium', 'low', 'info']) {
      const issues = grouped[severity] || []
      if (issues.length === 0) continue
      
      lines.push(`### ${severity.toUpperCase()}`, '')
      
      for (const issue of issues) {
        lines.push(`#### ${issue.title}`)
        lines.push(`- **File**: ${issue.file}${issue.line ? `:${issue.line}` : ''}`)
        lines.push(`- **Category**: ${issue.category}`)
        lines.push(`- **Description**: ${issue.description}`)
        if (issue.code) lines.push(`- **Code**: \`${issue.code}\``)
        if (issue.fix) lines.push(`- **Fix**: ${issue.fix}`)
        if (issue.cwe) lines.push(`- **CWE**: ${issue.cwe}`)
        if (issue.owasp) lines.push(`- **OWASP**: ${issue.owasp}`)
        lines.push('')
      }
    }
  }
  
  return lines.join('\n')
}

/**
 * Group array by key
 */
function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const group = String(item[key])
    acc[group] = acc[group] || []
    acc[group].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

/**
 * Auto-fix common security issues
 */
export async function autoFixIssues(
  projectPath: string,
  issues: SecurityIssue[]
): Promise<{
  fixed: number
  remaining: SecurityIssue[]
}> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  let fixed = 0
  const remaining: SecurityIssue[] = []
  
  for (const issue of issues) {
    if (!issue.file || !issue.code) {
      remaining.push(issue)
      continue
    }
    
    try {
      const filePath = path.join(fullPath, issue.file)
      let content = await fs.readFile(filePath, 'utf-8')
      let modified = false
      
      // Auto-fix specific issues
      switch (issue.id) {
        case 'SECRET-001':
        case 'SECRET-002':
        case 'SECRET-003':
          // Replace hardcoded secrets with env vars
          content = content.replace(
            /(api[_-]?key|password|secret[_-]?key)\s*[=:]\s*['""][^'""]+['""]/gi,
            '$1 = process.env.$1.toUpperCase()'
          )
          modified = true
          break
          
        case 'CORS-001':
          // Fix overly permissive CORS
          content = content.replace(
            /cors\s*\(\s*\{\s*origin\s*:\s*['""]\*['""]/gi,
            "cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']"
          )
          modified = true
          break
          
        case 'DEBUG-001':
          // Fix debug mode
          content = content.replace(
            /debug\s*[=:]\s*true/gi,
            'debug: process.env.NODE_ENV === "development"'
          )
          modified = true
          break
      }
      
      if (modified) {
        await fs.writeFile(filePath, content, 'utf-8')
        fixed++
      } else {
        remaining.push(issue)
      }
    } catch {
      remaining.push(issue)
    }
  }
  
  return { fixed, remaining }
}
