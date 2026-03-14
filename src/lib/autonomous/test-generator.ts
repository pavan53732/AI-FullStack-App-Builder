/**
 * Auto Test Generator
 * 
 * Automatically generates comprehensive tests for generated code:
 * - Unit tests
 * - Integration tests
 * - E2E tests
 * - API contract tests
 */

import fs from 'fs/promises'
import path from 'path'
import ZAI from 'z-ai-web-dev-sdk'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')

export interface TestFile {
  path: string
  content: string
  type: 'unit' | 'integration' | 'e2e' | 'contract'
  framework: 'jest' | 'vitest' | 'playwright' | 'cypress'
}

export interface TestResult {
  passed: number
  failed: number
  skipped: number
  coverage: number
  duration: number
  failures: TestFailure[]
}

export interface TestFailure {
  test: string
  error: string
  stack?: string
}

const TEST_SYSTEM_PROMPT = `You are an expert test engineer. Generate comprehensive tests for the given code.

RULES:
1. Test all functions and components
2. Include edge cases
3. Test error handling
4. Use descriptive test names
5. Mock external dependencies
6. Aim for 80%+ coverage

FRAMEWORK DETECTION:
- React components → React Testing Library + Vitest
- API routes → Supertest + Jest
- Node.js backend → Jest
- TypeScript → Vitest

OUTPUT FORMAT - Return ONLY the test file content, no explanations.`

/**
 * Detect test framework from project
 */
export async function detectTestFramework(projectPath: string): Promise<string> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  try {
    const pkgJson = JSON.parse(await fs.readFile(path.join(fullPath, 'package.json'), 'utf-8'))
    
    if (pkgJson.devDependencies?.vitest) return 'vitest'
    if (pkgJson.devDependencies?.jest) return 'jest'
    if (pkgJson.devDependencies?.playwright) return 'playwright'
    if (pkgJson.devDependencies?.cypress) return 'cypress'
    
    // Default based on project type
    if (pkgJson.dependencies?.react) return 'vitest'
    return 'jest'
  } catch {
    return 'vitest'
  }
}

/**
 * Generate unit tests for a file
 */
export async function generateUnitTests(
  projectPath: string,
  filePath: string,
  fileContent: string
): Promise<TestFile> {
  const zai = await ZAI.create()
  const framework = await detectTestFramework(projectPath)
  
  const testFileName = filePath.replace(/\.(tsx?|jsx?)$/, '.test.$1')
  
  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: TEST_SYSTEM_PROMPT },
      { role: 'user', content: `Generate ${framework} unit tests for this file:\n\nFile: ${filePath}\n\n\`\`\`\n${fileContent}\n\`\`\`\n\nGenerate complete, runnable tests.` }
    ],
    thinking: { type: 'disabled' }
  })
  
  let testContent = completion.choices[0]?.message?.content || ''
  
  // Clean up - remove markdown code blocks if present
  testContent = testContent.replace(/```(?:typescript|javascript|tsx|jsx)?\n?/g, '').replace(/```/g, '')
  
  return {
    path: testFileName,
    content: testContent.trim(),
    type: 'unit',
    framework: framework as any
  }
}

/**
 * Generate integration tests for API routes
 */
export async function generateIntegrationTests(
  projectPath: string,
  apiFiles: Array<{ path: string; content: string }>
): Promise<TestFile> {
  const zai = await ZAI.create()
  const framework = await detectTestFramework(projectPath)
  
  const apiSummary = apiFiles.map(f => `// ${f.path}\n${f.content.slice(0, 500)}`).join('\n\n')
  
  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: TEST_SYSTEM_PROMPT },
      { role: 'user', content: `Generate integration tests for these API endpoints:\n\n${apiSummary}\n\nTest all endpoints with various inputs, auth scenarios, and error cases.` }
    ],
    thinking: { type: 'disabled' }
  })
  
  let testContent = completion.choices[0]?.message?.content || ''
  testContent = testContent.replace(/```(?:typescript|javascript)?\n?/g, '').replace(/```/g, '')
  
  return {
    path: 'tests/api.integration.test.ts',
    content: testContent.trim(),
    type: 'integration',
    framework: framework as any
  }
}

/**
 * Generate E2E tests for the app
 */
export async function generateE2ETests(
  projectPath: string,
  appDescription: string,
  routes: string[]
): Promise<TestFile> {
  const zai = await ZAI.create()
  
  const completion = await zai.chat.completions.create({
    messages: [
      { 
        role: 'assistant', 
        content: `You are an E2E test expert using Playwright. Generate comprehensive end-to-end tests.

RULES:
1. Test critical user flows
2. Test page navigation
3. Test form submissions
4. Test error states
5. Use proper waits and assertions
6. Make tests resilient

OUTPUT: Complete Playwright test file content only.`
      },
      { 
        role: 'user', 
        content: `Generate E2E tests for this app:\n\nDescription: ${appDescription}\n\nRoutes: ${routes.join(', ')}\n\nGenerate complete Playwright tests.` 
      }
    ],
    thinking: { type: 'disabled' }
  })
  
  let testContent = completion.choices[0]?.message?.content || ''
  testContent = testContent.replace(/```(?:typescript|javascript)?\n?/g, '').replace(/```/g, '')
  
  return {
    path: 'e2e/app.spec.ts',
    content: testContent.trim(),
    type: 'e2e',
    framework: 'playwright'
  }
}

/**
 * Generate contract tests for API
 */
export async function generateContractTests(
  projectPath: string,
  apiSpec: {
    endpoints: Array<{
      method: string
      path: string
      request?: any
      response?: any
    }>
  }
): Promise<TestFile> {
  const zai = await ZAI.create()
  
  const completion = await zai.chat.completions.create({
    messages: [
      { 
        role: 'assistant', 
        content: `You are a contract testing expert. Generate API contract tests that verify:
1. Request/response schemas
2. Status codes
3. Headers
4. Data types

Use Jest/Vitest with supertest.`
      },
      { 
        role: 'user', 
        content: `Generate contract tests for these endpoints:\n\n${JSON.stringify(apiSpec, null, 2)}` 
      }
    ],
    thinking: { type: 'disabled' }
  })
  
  let testContent = completion.choices[0]?.message?.content || ''
  testContent = testContent.replace(/```(?:typescript|javascript)?\n?/g, '').replace(/```/g, '')
  
  return {
    path: 'tests/contract/api.contract.test.ts',
    content: testContent.trim(),
    type: 'contract',
    framework: 'jest'
  }
}

/**
 * Auto-generate all tests for a project
 */
export async function autoGenerateTests(
  projectPath: string,
  options: {
    unit?: boolean
    integration?: boolean
    e2e?: boolean
    contract?: boolean
    appDescription?: string
  } = {}
): Promise<{
  generated: TestFile[]
  errors: string[]
}> {
  const result = {
    generated: [] as TestFile[],
    errors: [] as string[]
  }
  
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  try {
    // Get all source files
    const sourceFiles = await getSourceFiles(fullPath)
    
    // Generate unit tests
    if (options.unit !== false) {
      for (const file of sourceFiles.filter(f => !f.path.includes('.test.') && !f.path.includes('.spec.'))) {
        try {
          const test = await generateUnitTests(projectPath, file.path, file.content)
          result.generated.push(test)
        } catch (e: any) {
          result.errors.push(`Unit test for ${file.path}: ${e.message}`)
        }
      }
    }
    
    // Generate integration tests for API routes
    if (options.integration !== false) {
      const apiFiles = sourceFiles.filter(f => 
        f.path.includes('/api/') || f.path.includes('routes/')
      )
      
      if (apiFiles.length > 0) {
        try {
          const test = await generateIntegrationTests(projectPath, apiFiles)
          result.generated.push(test)
        } catch (e: any) {
          result.errors.push(`Integration tests: ${e.message}`)
        }
      }
    }
    
    // Generate E2E tests
    if (options.e2e !== false && options.appDescription) {
      try {
        const routes = sourceFiles
          .filter(f => f.path.includes('pages/') || f.path.includes('app/'))
          .map(f => f.path)
        
        const test = await generateE2ETests(projectPath, options.appDescription, routes)
        result.generated.push(test)
      } catch (e: any) {
        result.errors.push(`E2E tests: ${e.message}`)
      }
    }
    
  } catch (e: any) {
    result.errors.push(e.message)
  }
  
  return result
}

/**
 * Get all source files recursively
 */
async function getSourceFiles(dir: string): Promise<Array<{ path: string; content: string }>> {
  const files: Array<{ path: string; content: string }> = []
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      // Skip common exclusions
      if (['node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'tests', '__tests__'].includes(entry.name)) {
        continue
      }
      
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        files.push(...await getSourceFiles(fullPath))
      } else if (entry.name.match(/\.(tsx?|jsx?)$/)) {
        const content = await fs.readFile(fullPath, 'utf-8')
        files.push({
          path: path.relative(dir, fullPath),
          content
        })
      }
    }
  } catch {}
  
  return files
}

/**
 * Write test files to project
 */
export async function writeTestFiles(
  projectPath: string,
  testFiles: TestFile[]
): Promise<void> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  for (const test of testFiles) {
    const testPath = path.join(fullPath, test.path)
    await fs.mkdir(path.dirname(testPath), { recursive: true })
    await fs.writeFile(testPath, test.content, 'utf-8')
  }
}

/**
 * Run tests and get results
 */
export async function runTests(
  projectPath: string,
  testType?: 'unit' | 'integration' | 'e2e' | 'all'
): Promise<TestResult> {
  const { spawn } = await import('child_process')
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  return new Promise((resolve) => {
    const child = spawn('npm', ['test', '--', '--json', '--coverage'], {
      cwd: fullPath,
      shell: true,
      env: { ...process.env, CI: 'true' }
    })
    
    let stdout = ''
    let stderr = ''
    
    child.stdout?.on('data', (data) => { stdout += data.toString() })
    child.stderr?.on('data', (data) => { stderr += data.toString() })
    
    const timeout = setTimeout(() => {
      child.kill()
      resolve({
        passed: 0,
        failed: 0,
        skipped: 0,
        coverage: 0,
        duration: 0,
        failures: [{ test: 'timeout', error: 'Test execution timed out' }]
      })
    }, 120000)
    
    child.on('close', (code) => {
      clearTimeout(timeout)
      
      try {
        // Parse Jest/Vitest JSON output
        const jsonMatch = stdout.match(/\{[\s\S]*"success"[\s\S]*\}/)
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0])
          
          return resolve({
            passed: result.numPassedTests || 0,
            failed: result.numFailedTests || 0,
            skipped: result.numPendingTests || 0,
            coverage: result.coverageMap ? Object.values(result.coverageMap).reduce((sum: any, c: any) => {
              return sum + (c.lines?.pct || 0)
            }, 0) / Object.keys(result.coverageMap).length : 0,
            duration: result.startTime ? Date.now() - result.startTime : 0,
            failures: result.testResults?.flatMap((tr: any) => 
              tr.assertionResults?.filter((a: any) => a.status === 'failed').map((a: any) => ({
                test: a.fullName || a.title,
                error: a.failureMessages?.join('\n') || 'Unknown error'
              })) || []
            ) || []
          })
        }
      } catch {}
      
      // Fallback parsing
      const passed = (stdout.match(/(\d+) passed/g) || ['0 passed'])[0].match(/\d+/)?.[0] || '0'
      const failed = (stdout.match(/(\d+) failed/g) || ['0 failed'])[0].match(/\d+/)?.[0] || '0'
      
      resolve({
        passed: parseInt(passed),
        failed: parseInt(failed),
        skipped: 0,
        coverage: 0,
        duration: 0,
        failures: []
      })
    })
  })
}

/**
 * Ensure test dependencies are installed
 */
export async function ensureTestDependencies(projectPath: string): Promise<void> {
  const { spawn } = await import('child_process')
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  const framework = await detectTestFramework(projectPath)
  
  const deps = {
    vitest: ['vitest', '@testing-library/react', '@testing-library/jest-dom', 'jsdom'],
    jest: ['jest', '@types/jest', 'ts-jest', '@testing-library/react', '@testing-library/jest-dom'],
    playwright: ['@playwright/test'],
    cypress: ['cypress']
  }
  
  const packages = deps[framework as keyof typeof deps] || deps.vitest
  
  return new Promise((resolve) => {
    const child = spawn('npm', ['install', '-D', ...packages], {
      cwd: fullPath,
      shell: true
    })
    
    child.on('close', () => resolve())
    child.on('error', () => resolve())
  })
}
