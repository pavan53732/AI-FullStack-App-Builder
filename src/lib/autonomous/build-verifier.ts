/**
 * Build Verification System
 * 
 * Verifies builds and generated apps:
 * - TypeScript compilation check
 * - Lint check
 * - Build check
 * - Test execution
 * - Output validation
 */

import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { parseErrors, hasErrors, ParsedError } from './error-recovery'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')

export interface VerificationResult {
  success: boolean
  type: 'typescript' | 'lint' | 'build' | 'test' | 'preview' | 'full'
  timestamp: string
  duration: number
  errors: ParsedError[]
  warnings: ParsedError[]
  output: string
  stats?: {
    filesChecked?: number
    errorsFound?: number
    warningsFound?: number
    testsPassed?: number
    testsFailed?: number
    coverage?: number
  }
}

export interface FullVerificationResult {
  success: boolean
  typescript?: VerificationResult
  lint?: VerificationResult
  build?: VerificationResult
  test?: VerificationResult
  preview?: VerificationResult
  totalDuration: number
  errors: ParsedError[]
  warnings: ParsedError[]
  recommendations: string[]
}

/**
 * Run a command and capture output
 */
async function runCommand(
  command: string,
  cwd: string,
  timeout = 120000
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const child = spawn(command, [], {
      cwd,
      shell: true,
      env: { ...process.env, CI: 'true', NODE_ENV: 'development' }
    })
    
    let stdout = ''
    let stderr = ''
    
    child.stdout?.on('data', (data) => {
      stdout += data.toString()
    })
    
    child.stderr?.on('data', (data) => {
      stderr += data.toString()
    })
    
    const timer = setTimeout(() => {
      child.kill()
      resolve({
        stdout: stdout + '\n[TIMEOUT]',
        stderr,
        exitCode: 124 // Timeout exit code
      })
    }, timeout)
    
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 1
      })
    })
    
    child.on('error', (err) => {
      clearTimeout(timer)
      resolve({
        stdout,
        stderr: err.message,
        exitCode: 1
      })
    })
  })
}

/**
 * Verify TypeScript compilation
 */
export async function verifyTypeScript(
  projectPath: string
): Promise<VerificationResult> {
  const startTime = Date.now()
  const cwd = path.join(WORKSPACE_DIR, projectPath)
  
  const result = await runCommand('npx tsc --noEmit', cwd, 60000)
  
  const output = result.stdout + '\n' + result.stderr
  const errors = parseErrors(output)
  
  return {
    success: result.exitCode === 0 && !hasErrors(output),
    type: 'typescript',
    timestamp: new Date().toISOString(),
    duration: Date.now() - startTime,
    errors: errors.filter(e => e.severity === 'error'),
    warnings: errors.filter(e => e.severity === 'warning'),
    output,
    stats: {
      errorsFound: errors.filter(e => e.severity === 'error').length,
      warningsFound: errors.filter(e => e.severity === 'warning').length
    }
  }
}

/**
 * Verify lint
 */
export async function verifyLint(
  projectPath: string
): Promise<VerificationResult> {
  const startTime = Date.now()
  const cwd = path.join(WORKSPACE_DIR, projectPath)
  
  // Check if ESLint is configured
  try {
    await fs.access(path.join(cwd, '.eslintrc.json'))
  } catch {
    try {
      await fs.access(path.join(cwd, '.eslintrc.js'))
    } catch {
      try {
        await fs.access(path.join(cwd, 'eslint.config.js'))
      } catch {
        // No ESLint config, skip
        return {
          success: true,
          type: 'lint',
          timestamp: new Date().toISOString(),
          duration: 0,
          errors: [],
          warnings: [],
          output: 'No ESLint configuration found, skipping lint check'
        }
      }
    }
  }
  
  const result = await runCommand('npx eslint . --ext .ts,.tsx,.js,.jsx', cwd, 60000)
  
  const output = result.stdout + '\n' + result.stderr
  const errors = parseErrors(output)
  
  return {
    success: result.exitCode === 0,
    type: 'lint',
    timestamp: new Date().toISOString(),
    duration: Date.now() - startTime,
    errors: errors.filter(e => e.severity === 'error'),
    warnings: errors.filter(e => e.severity === 'warning'),
    output,
    stats: {
      errorsFound: errors.filter(e => e.severity === 'error').length,
      warningsFound: errors.filter(e => e.severity === 'warning').length
    }
  }
}

/**
 * Verify build
 */
export async function verifyBuild(
  projectPath: string
): Promise<VerificationResult> {
  const startTime = Date.now()
  const cwd = path.join(WORKSPACE_DIR, projectPath)
  
  // Determine build command
  let buildCommand = 'npm run build'
  
  try {
    const pkgContent = await fs.readFile(path.join(cwd, 'package.json'), 'utf-8')
    const pkg = JSON.parse(pkgContent)
    
    if (!pkg.scripts?.build) {
      // No build script, check framework
      if (pkg.dependencies?.next) {
        buildCommand = 'next build'
      } else if (pkg.devDependencies?.vite) {
        buildCommand = 'vite build'
      } else {
        // No build needed
        return {
          success: true,
          type: 'build',
          timestamp: new Date().toISOString(),
          duration: 0,
          errors: [],
          warnings: [],
          output: 'No build script found, assuming static project'
        }
      }
    }
  } catch {}
  
  const result = await runCommand(buildCommand, cwd, 180000)
  
  const output = result.stdout + '\n' + result.stderr
  const errors = parseErrors(output)
  
  // Check if output directory was created
  let outputCreated = false
  try {
    const entries = await fs.readdir(cwd)
    outputCreated = entries.some(e => 
      ['dist', 'build', 'out', '.next'].includes(e)
    )
  } catch {}
  
  return {
    success: result.exitCode === 0 && (outputCreated || !hasErrors(output)),
    type: 'build',
    timestamp: new Date().toISOString(),
    duration: Date.now() - startTime,
    errors: errors.filter(e => e.severity === 'error'),
    warnings: errors.filter(e => e.severity === 'warning'),
    output,
    stats: {
      errorsFound: errors.filter(e => e.severity === 'error').length,
      warningsFound: errors.filter(e => e.severity === 'warning').length
    }
  }
}

/**
 * Verify tests
 */
export async function verifyTests(
  projectPath: string
): Promise<VerificationResult> {
  const startTime = Date.now()
  const cwd = path.join(WORKSPACE_DIR, projectPath)
  
  // Determine test command
  let testCommand = 'npm test'
  
  try {
    const pkgContent = await fs.readFile(path.join(cwd, 'package.json'), 'utf-8')
    const pkg = JSON.parse(pkgContent)
    
    if (!pkg.scripts?.test) {
      // No test script
      return {
        success: true,
        type: 'test',
        timestamp: new Date().toISOString(),
        duration: 0,
        errors: [],
        warnings: [],
        output: 'No test script found, skipping tests'
      }
    }
    
    // Prefer vitest or jest
    if (pkg.devDependencies?.vitest) {
      testCommand = 'npx vitest run'
    } else if (pkg.devDependencies?.jest) {
      testCommand = 'npx jest'
    }
  } catch {}
  
  const result = await runCommand(testCommand, cwd, 120000)
  
  const output = result.stdout + '\n' + result.stderr
  const errors = parseErrors(output)
  
  // Parse test results
  const testsPassed = (output.match(/(\d+) passed/g) || [])[0]?.match(/\d+/)?.[0]
  const testsFailed = (output.match(/(\d+) failed/g) || [])[0]?.match(/\d+/)?.[0]
  
  return {
    success: result.exitCode === 0 && !testsFailed,
    type: 'test',
    timestamp: new Date().toISOString(),
    duration: Date.now() - startTime,
    errors: errors.filter(e => e.severity === 'error'),
    warnings: errors.filter(e => e.severity === 'warning'),
    output,
    stats: {
      testsPassed: testsPassed ? parseInt(testsPassed) : undefined,
      testsFailed: testsFailed ? parseInt(testsFailed) : undefined
    }
  }
}

/**
 * Verify preview server
 */
export async function verifyPreview(
  projectPath: string,
  port: number,
  timeout = 10000
): Promise<VerificationResult> {
  const startTime = Date.now()
  
  // Try to connect to the server
  const url = `http://localhost:${port}`
  
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(timeout)
    })
    
    return {
      success: response.ok,
      type: 'preview',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      errors: [],
      warnings: [],
      output: `Server responded with status ${response.status}`,
      stats: {
        filesChecked: 1
      }
    }
  } catch (error: any) {
    return {
      success: false,
      type: 'preview',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      errors: [{
        type: 'unknown',
        message: error.message,
        severity: 'error',
        fixable: false,
        raw: error.message
      }],
      warnings: [],
      output: `Failed to connect to ${url}: ${error.message}`
    }
  }
}

/**
 * Run full verification
 */
export async function runFullVerification(
  projectPath: string,
  options: {
    typescript?: boolean
    lint?: boolean
    build?: boolean
    test?: boolean
    preview?: { port: number }
  } = {}
): Promise<FullVerificationResult> {
  const startTime = Date.now()
  const result: FullVerificationResult = {
    success: true,
    totalDuration: 0,
    errors: [],
    warnings: [],
    recommendations: []
  }
  
  // TypeScript
  if (options.typescript !== false) {
    result.typescript = await verifyTypeScript(projectPath)
    if (!result.typescript.success) result.success = false
    result.errors.push(...result.typescript.errors)
    result.warnings.push(...result.typescript.warnings)
  }
  
  // Lint
  if (options.lint !== false) {
    result.lint = await verifyLint(projectPath)
    if (!result.lint.success) {
      // Lint errors don't fail the build
      result.recommendations.push('Fix lint errors for better code quality')
    }
    result.warnings.push(...result.lint.warnings)
  }
  
  // Build
  if (options.build !== false) {
    result.build = await verifyBuild(projectPath)
    if (!result.build.success) result.success = false
    result.errors.push(...result.build.errors)
    result.warnings.push(...result.build.warnings)
  }
  
  // Test
  if (options.test !== false) {
    result.test = await verifyTests(projectPath)
    if (!result.test.success) {
      result.recommendations.push('Fix failing tests')
    }
    result.errors.push(...result.test.errors)
  }
  
  // Preview
  if (options.preview) {
    result.preview = await verifyPreview(projectPath, options.preview.port)
    if (!result.preview.success) result.success = false
    result.errors.push(...result.preview.errors)
  }
  
  result.totalDuration = Date.now() - startTime
  
  // Add recommendations based on results
  if (result.errors.length > 0) {
    result.recommendations.push('Fix the errors before deployment')
  }
  
  if (result.warnings.length > 5) {
    result.recommendations.push('Consider addressing warnings to improve code quality')
  }
  
  return result
}

/**
 * Quick verification (TypeScript + Build only)
 */
export async function quickVerify(
  projectPath: string
): Promise<VerificationResult> {
  const typescript = await verifyTypeScript(projectPath)
  
  if (!typescript.success) {
    return typescript
  }
  
  const build = await verifyBuild(projectPath)
  
  return build
}

/**
 * Verify file exists and has content
 */
export async function verifyFileExists(
  projectPath: string,
  filePath: string
): Promise<{ exists: boolean; hasContent: boolean; size: number }> {
  try {
    const fullPath = path.join(WORKSPACE_DIR, projectPath, filePath)
    const stats = await fs.stat(fullPath)
    
    return {
      exists: true,
      hasContent: stats.size > 0,
      size: stats.size
    }
  } catch {
    return {
      exists: false,
      hasContent: false,
      size: 0
    }
  }
}

/**
 * Verify package.json is valid
 */
export async function verifyPackageJson(
  projectPath: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []
  
  try {
    const fullPath = path.join(WORKSPACE_DIR, projectPath, 'package.json')
    const content = await fs.readFile(fullPath, 'utf-8')
    const pkg = JSON.parse(content)
    
    if (!pkg.name) errors.push('Missing "name" field')
    if (!pkg.version) errors.push('Missing "version" field')
    if (!pkg.scripts && !pkg.dependencies) {
      errors.push('No scripts or dependencies defined')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  } catch (error: any) {
    return {
      valid: false,
      errors: [`Failed to parse package.json: ${error.message}`]
    }
  }
}

/**
 * Check if project is ready for deployment
 */
export async function checkDeploymentReady(
  projectPath: string
): Promise<{
  ready: boolean
  checks: { name: string; passed: boolean; message: string }[]
}> {
  const checks: { name: string; passed: boolean; message: string }[] = []
  
  // Check package.json
  const pkgCheck = await verifyPackageJson(projectPath)
  checks.push({
    name: 'package.json',
    passed: pkgCheck.valid,
    message: pkgCheck.valid ? 'Valid package.json' : pkgCheck.errors.join(', ')
  })
  
  // Check TypeScript
  const tsCheck = await verifyTypeScript(projectPath)
  checks.push({
    name: 'TypeScript',
    passed: tsCheck.success,
    message: tsCheck.success ? 'No TypeScript errors' : `${tsCheck.errors.length} errors found`
  })
  
  // Check build
  const buildCheck = await verifyBuild(projectPath)
  checks.push({
    name: 'Build',
    passed: buildCheck.success,
    message: buildCheck.success ? 'Build successful' : 'Build failed'
  })
  
  // Check for README
  const readmeCheck = await verifyFileExists(projectPath, 'README.md')
  checks.push({
    name: 'README',
    passed: readmeCheck.exists,
    message: readmeCheck.exists ? 'README.md exists' : 'Missing README.md'
  })
  
  // Check for .gitignore
  const gitignoreCheck = await verifyFileExists(projectPath, '.gitignore')
  checks.push({
    name: '.gitignore',
    passed: gitignoreCheck.exists,
    message: gitignoreCheck.exists ? '.gitignore exists' : 'Missing .gitignore'
  })
  
  return {
    ready: checks.every(c => c.passed || c.name === 'README' || c.name === '.gitignore'),
    checks
  }
}
