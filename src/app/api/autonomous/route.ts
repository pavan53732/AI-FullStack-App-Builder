import { NextRequest } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs/promises'
import path from 'path'
import { spawn, ChildProcess } from 'child_process'

// Import all autonomous subsystems
import { 
  indexProject, loadIndex, getRelevantFiles,
  startIndexing, stopIndexing
} from '@/lib/autonomous/indexer'
import {
  analyzeDependencies, autoInstallMissing, detectFramework, detectImports
} from '@/lib/autonomous/dependency-manager'
import {
  parseErrors, recoverFromErrors, hasErrors, formatErrors
} from '@/lib/autonomous/error-recovery'
import {
  createTask, saveTask, loadTask, updateTask, recordAction,
  startTask, completeTask, failTask, pauseTask, resumeTask,
  getActiveTasks, getTaskHistory
} from '@/lib/autonomous/progress-persistence'
import {
  buildContext, formatContextForAI
} from '@/lib/autonomous/context-manager'
import {
  startServer, stopServer, restartServer, getAllServers,
  findAvailablePort, detectServerCommand, stopAllServers
} from '@/lib/autonomous/server-monitor'
import {
  quickVerify, runFullVerification, checkDeploymentReady
} from '@/lib/autonomous/build-verifier'
// New AI Systems
import { getCoTEngine, type ReasoningChain } from '@/lib/autonomous/chain-of-thought'
import { analyzeProject as analyzeProjectAST, type FileAnalysis } from '@/lib/autonomous/ast-parser'
import { messageBus, createAgentClient, type AgentMessage } from '@/lib/autonomous/agent-message-bus'
import { getArchitectureBuilder, type ArchitectureGraph } from '@/lib/autonomous/architecture-graph'
import { getCritiqueEngine, type CritiqueResult } from '@/lib/autonomous/self-critique'
import { scanProject, quickSecurityCheck } from '@/lib/autonomous/security-scanner'
import { audit, startAuditSession, type AuditEventType } from '@/lib/autonomous/audit-logger'
import { autoGenerateTests, runTests } from '@/lib/autonomous/test-generator'
import { searchKnowledge, generateAugmentedPrompt } from '@/lib/autonomous/rag-system'
import { createCheckpoint, listCheckpoints, restoreCheckpoint } from '@/lib/autonomous/checkpoint-manager'
import { isGitAvailable, initRepo, createCommit, generateCommitMessage, getStatus } from '@/lib/autonomous/git-manager'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')

// Maximum iterations for autonomous mode
const MAX_ITERATIONS = 50

// Active servers tracking (legacy)
const activeServers: Map<string, { process: ChildProcess; port: number; status: string; startTime: Date }> = new Map()

// Enhanced System prompt for autonomous AI with integrated systems
const AUTONOMOUS_SYSTEM_PROMPT = `You are an AUTONOMOUS AI Full-Stack App Builder with INTEGRATED AI REASONING.

## 🧠 CRITICAL: You have ADVANCED AI CAPABILITIES!

## 🤖 Your Integrated AI Systems:
1. **Chain-of-Thought Engine** - Deep reasoning for complex decisions
2. **AST Parser** - Code structure understanding
3. **Agent Message Bus** - Multi-agent coordination
4. **Architecture Graph** - Dependency visualization & impact analysis
5. **Self-Critique Engine** - Quality assurance & iterative improvement
6. **Security Scanner** - SAST vulnerability detection
7. **Auto Test Generator** - Unit, integration, and E2E tests
8. **RAG System** - Knowledge retrieval for patterns
9. **Git Integration** - Version control & checkpoints
10. **Audit Logging** - Complete action trail

## 🔧 Available Actions (respond with ONLY JSON):

### Create File
{"action": "create_file", "path": "my-app/src/App.tsx", "content": "..."}

### Create Folder
{"action": "create_folder", "path": "my-app/src/components"}

### Execute Command
{"action": "execute", "command": "npm install", "cwd": "my-app"}

### Read File
{"action": "read_file", "path": "my-app/package.json"}

### List Directory
{"action": "list_dir", "path": "my-app"}

### Delete
{"action": "delete", "path": "my-app/old-file.ts"}

### Start Dev Server (Auto port selection)
{"action": "start_server", "cwd": "my-app", "port": 3001}

### Stop Dev Server
{"action": "stop_server", "port": 3001}

### Build & Verify
{"action": "build_verify", "cwd": "my-app"}

### Install Missing Dependencies (AUTO!)
{"action": "auto_install", "cwd": "my-app"}

### Index Project (Background)
{"action": "index_project", "path": "my-app"}

### Security Scan
{"action": "security_scan", "cwd": "my-app"}

### Generate Tests
{"action": "generate_tests", "cwd": "my-app"}

### Create Checkpoint
{"action": "create_checkpoint", "path": "my-app", "description": "..."}

### Git Commit
{"action": "git_commit", "cwd": "my-app", "message": "..."}

### Critique Code (Self-improvement)
{"action": "critique_code", "code": "...", "path": "..."}

### Analyze with AST
{"action": "analyze_ast", "path": "my-app"}

### Task COMPLETE (ONLY when EVERYTHING works!)
{"action": "complete", "message": "App is ready!", "preview_url": "http://localhost:3001"}

### Need to Continue
{"action": "continue", "reason": "Need to fix errors..."}

## 📋 MANDATORY Workflow:
1. THINK: Use Chain-of-Thought for reasoning
2. CREATE: Write files with quality in mind
3. ANALYZE: Use AST to understand structure
4. CRITIQUE: Self-evaluate your output
5. FIX: Apply improvements
6. TEST: Generate and run tests
7. SECURE: Scan for vulnerabilities
8. VERIFY: Build and type-check
9. COMMIT: Save progress with Git
10. COMPLETE: Only when truly ready

## 🧠 Reasoning Framework:
Before major decisions, think through:
1. What is the goal?
2. What are the options?
3. What are the risks?
4. What is the best path?
5. How do I verify success?

## 🔁 Error Recovery Strategy:
- Module not found → Auto-install package
- TypeScript error → Fix types, rebuild
- Build error → Parse and fix
- Security issue → Auto-fix if possible
- Test failure → Analyze and fix
- ALWAYS verify after changes!
- ALWAYS critique your code!

## 🚀 For React + Vite Apps:
- package.json: react, react-dom, typescript, vite, @types/react, @types/react-dom, @vitejs/plugin-react
- vite.config.ts
- tsconfig.json, tsconfig.node.json
- index.html
- src/main.tsx, src/App.tsx, src/App.css

RESPOND WITH ONLY JSON ACTIONS. NO OTHER TEXT!`

interface ActionLog {
  action: string
  success: boolean
  result?: any
  error?: string
  timestamp: string
  duration?: number
  reasoning?: ReasoningChain
  critique?: CritiqueResult
}

interface AgentState {
  taskId: string | null
  iteration: number
  totalIterations: number
  actions: ActionLog[]
  complete: boolean
  message?: string
  previewUrl?: string
  apkUrl?: string
  currentProject?: string
  errors: string[]
  fixedErrors: string[]
  dependenciesInstalled: string[]
  buildVerified: boolean
  // New AI state
  reasoningChains: ReasoningChain[]
  critiques: CritiqueResult[]
  architectureGraph: ArchitectureGraph | null
  securityIssues: number
  testsGenerated: string[]
  auditSessionId: string | null
  checkpointId: string | null
}

// Execute a single action with enhanced capabilities
async function executeAction(action: any, state: AgentState): Promise<ActionLog> {
  const timestamp = new Date().toISOString()
  const startTime = Date.now()
  
  try {
    switch (action.action) {
      case 'create_file': {
        const fullPath = path.join(WORKSPACE_DIR, action.path)
        await fs.mkdir(path.dirname(fullPath), { recursive: true })
        await fs.writeFile(fullPath, action.content || '', 'utf-8')
        
        // Track project
        if (!state.currentProject) {
          state.currentProject = action.path.split('/')[0]
        }
        
        // Critique the code if enabled
        let critique: CritiqueResult | undefined
        if (action.content && action.content.length > 50) {
          try {
            const critiqueEngine = getCritiqueEngine()
            critique = await critiqueEngine.critiqueCode(action.content)
            state.critiques.push(critique)
            
            // Audit
            if (state.auditSessionId) {
              await audit({
                type: 'file_create' as AuditEventType,
                projectId: state.currentProject || '',
                action: 'create_file',
                details: { path: action.path, score: critique.overallScore },
                result: critique.overallScore >= 70 ? 'success' : 'warning'
              })
            }
          } catch {}
        }
        
        return { action: 'create_file', success: true, result: `Created: ${action.path}`, timestamp, duration: Date.now() - startTime, critique }
      }

      case 'create_folder': {
        const fullPath = path.join(WORKSPACE_DIR, action.path)
        await fs.mkdir(fullPath, { recursive: true })
        return { action: 'create_folder', success: true, result: `Created folder: ${action.path}`, timestamp, duration: Date.now() - startTime }
      }

      case 'execute': {
        const cwd = action.cwd ? path.join(WORKSPACE_DIR, action.cwd) : WORKSPACE_DIR
        
        return new Promise((resolve) => {
          const child = spawn(action.command, [], {
            cwd,
            shell: true,
            env: { ...process.env, NODE_ENV: 'development', CI: 'true' }
          })
          
          let stdout = ''
          let stderr = ''
          
          child.stdout?.on('data', (data) => { stdout += data.toString() })
          child.stderr?.on('data', (data) => { stderr += data.toString() })
          
          const timeout = setTimeout(() => {
            child.kill()
            resolve({
              action: 'execute',
              success: false,
              error: 'Command timed out',
              result: { command: action.command, stdout: stdout.slice(0, 3000), stderr: stderr.slice(0, 2000) },
              timestamp,
              duration: Date.now() - startTime
            })
          }, action.timeout || 120000)
          
          child.on('close', (code) => {
            clearTimeout(timeout)
            const hasError = code !== 0 || (stderr.toLowerCase().includes('error') && !stderr.includes('0 errors'))
            
            resolve({
              action: 'execute',
              success: !hasError,
              error: hasError ? `Exit code: ${code}` : undefined,
              result: {
                command: action.command,
                cwd: action.cwd,
                stdout: stdout.slice(0, 3000),
                stderr: stderr.slice(0, 2000),
                exitCode: code
              },
              timestamp,
              duration: Date.now() - startTime
            })
          })
          
          child.on('error', (err) => {
            clearTimeout(timeout)
            resolve({
              action: 'execute',
              success: false,
              error: err.message,
              timestamp,
              duration: Date.now() - startTime
            })
          })
        })
      }

      case 'read_file': {
        const fullPath = path.join(WORKSPACE_DIR, action.path)
        const content = await fs.readFile(fullPath, 'utf-8')
        return { action: 'read_file', success: true, result: { path: action.path, content }, timestamp, duration: Date.now() - startTime }
      }

      case 'list_dir': {
        const fullPath = path.join(WORKSPACE_DIR, action.path || '')
        const entries = await fs.readdir(fullPath, { withFileTypes: true })
        const items = entries.map(e => ({ name: e.name, type: e.isDirectory() ? 'folder' : 'file' }))
        return { action: 'list_dir', success: true, result: { path: action.path, items }, timestamp, duration: Date.now() - startTime }
      }

      case 'delete': {
        const fullPath = path.join(WORKSPACE_DIR, action.path)
        const stats = await fs.stat(fullPath)
        if (stats.isDirectory()) {
          await fs.rm(fullPath, { recursive: true })
        } else {
          await fs.unlink(fullPath)
        }
        return { action: 'delete', success: true, result: `Deleted: ${action.path}`, timestamp, duration: Date.now() - startTime }
      }

      case 'start_server': {
        const cwd = action.cwd ? path.join(WORKSPACE_DIR, action.cwd) : WORKSPACE_DIR
        const port = action.port || await findAvailablePort(3001)
        
        // Kill existing server on same port
        const existing = activeServers.get(port.toString())
        if (existing) {
          existing.process.kill()
          activeServers.delete(port.toString())
        }
        
        const command = await detectServerCommand(action.cwd || '')
        const serverProcess = spawn(command, [], {
          cwd,
          shell: true,
          env: { ...process.env, PORT: port.toString() },
          detached: true
        })
        
        serverProcess.unref()
        activeServers.set(port.toString(), { process: serverProcess, port, status: 'running', startTime: new Date() })
        
        // Wait for server to start
        await new Promise(r => setTimeout(r, 5000))
        
        return { 
          action: 'start_server', 
          success: true, 
          result: { port, pid: serverProcess.pid, url: `http://localhost:${port}` },
          timestamp,
          duration: Date.now() - startTime
        }
      }

      case 'stop_server': {
        const port = action.port?.toString()
        const server = activeServers.get(port || '')
        if (server) {
          server.process.kill()
          activeServers.delete(port || '')
          return { action: 'stop_server', success: true, result: `Server stopped on port ${port}`, timestamp, duration: Date.now() - startTime }
        }
        return { action: 'stop_server', success: false, error: 'Server not found', timestamp, duration: Date.now() - startTime }
      }

      // NEW: Auto-install missing dependencies
      case 'auto_install': {
        const projectPath = action.cwd || action.path || state.currentProject || ''
        if (!projectPath) {
          return { action: 'auto_install', success: false, error: 'No project path specified', timestamp, duration: Date.now() - startTime }
        }
        
        // Analyze dependencies
        const analysis = await analyzeDependencies(projectPath)
        
        if (analysis.missingDependencies.length === 0) {
          return { 
            action: 'auto_install', 
            success: true, 
            result: { message: 'All dependencies are installed', analysis },
            timestamp,
            duration: Date.now() - startTime
          }
        }
        
        // Auto-install missing
        const result = await autoInstallMissing(projectPath)
        state.dependenciesInstalled.push(...result.installed)
        
        return { 
          action: 'auto_install', 
          success: result.failed.length === 0,
          result: {
            installed: result.installed,
            failed: result.failed,
            output: result.output.slice(0, 1000)
          },
          timestamp,
          duration: Date.now() - startTime
        }
      }

      // NEW: Build and verify
      case 'build_verify': {
        const projectPath = action.cwd || state.currentProject || ''
        if (!projectPath) {
          return { action: 'build_verify', success: false, error: 'No project path', timestamp, duration: Date.now() - startTime }
        }
        
        const verification = await runFullVerification(projectPath, {
          typescript: true,
          lint: false, // Skip lint for faster builds
          build: true,
          test: false,
          preview: false
        })
        
        state.buildVerified = verification.success
        
        return {
          action: 'build_verify',
          success: verification.success,
          result: {
            typescript: verification.typescript?.success,
            build: verification.build?.success,
            errors: verification.errors.length,
            warnings: verification.warnings.length,
            duration: verification.totalDuration
          },
          error: verification.success ? undefined : formatErrors(verification.errors),
          timestamp,
          duration: Date.now() - startTime
        }
      }

      // NEW: Index project for context
      case 'index_project': {
        const projectPath = action.path || state.currentProject || ''
        
        const index = await indexProject(projectPath || undefined)
        
        return {
          action: 'index_project',
          success: !!index,
          result: index ? {
            files: index.totalFiles,
            folders: index.totalFolders,
            frameworks: index.metadata.frameworks,
            hasTypeScript: index.metadata.hasTypeScript,
            hasReact: index.metadata.hasReact
          } : null,
          timestamp,
          duration: Date.now() - startTime
        }
      }

      // NEW: Analyze dependencies
      case 'analyze_deps': {
        const projectPath = action.cwd || state.currentProject || ''
        
        const analysis = await analyzeDependencies(projectPath)
        
        return {
          action: 'analyze_deps',
          success: true,
          result: analysis,
          timestamp,
          duration: Date.now() - startTime
        }
      }

      // NEW: Security scan
      case 'security_scan': {
        const projectPath = action.cwd || state.currentProject || ''
        const fullPath = path.join(WORKSPACE_DIR, projectPath)
        
        const scanResult = await scanProject(fullPath)
        state.securityIssues = scanResult.issues.length
        
        return {
          action: 'security_scan',
          success: scanResult.issues.filter(i => i.severity === 'critical').length === 0,
          result: {
            issues: scanResult.issues.length,
            critical: scanResult.issues.filter(i => i.severity === 'critical').length,
            warnings: scanResult.issues.filter(i => i.severity === 'warning').length,
            summary: scanResult.summary
          },
          error: scanResult.issues.some(i => i.severity === 'critical') 
            ? `Found ${scanResult.issues.filter(i => i.severity === 'critical').length} critical security issues`
            : undefined,
          timestamp,
          duration: Date.now() - startTime
        }
      }

      // NEW: Generate tests
      case 'generate_tests': {
        const projectPath = action.cwd || state.currentProject || ''
        const fullPath = path.join(WORKSPACE_DIR, projectPath)
        
        const testResult = await autoGenerateTests(fullPath)
        state.testsGenerated.push(...testResult.files.map(f => f.path))
        
        return {
          action: 'generate_tests',
          success: testResult.files.length > 0,
          result: {
            files: testResult.files.map(f => f.path),
            framework: testResult.framework,
            testCount: testResult.files.reduce((sum, f) => sum + f.tests.length, 0)
          },
          timestamp,
          duration: Date.now() - startTime
        }
      }

      // NEW: Create checkpoint
      case 'create_checkpoint': {
        const projectPath = action.path || state.currentProject || ''
        
        const checkpoint = await createCheckpoint(projectPath, action.description || 'Manual checkpoint')
        state.checkpointId = checkpoint.id
        
        return {
          action: 'create_checkpoint',
          success: true,
          result: { id: checkpoint.id, files: checkpoint.files.length },
          timestamp,
          duration: Date.now() - startTime
        }
      }

      // NEW: Git commit
      case 'git_commit': {
        const projectPath = action.cwd || state.currentProject || ''
        const fullPath = path.join(WORKSPACE_DIR, projectPath)
        
        if (!await isGitAvailable()) {
          return { action: 'git_commit', success: false, error: 'Git not available', timestamp, duration: Date.now() - startTime }
        }
        
        const message = action.message || await generateCommitMessage(fullPath)
        const commit = await createCommit(fullPath, message)
        
        return {
          action: 'git_commit',
          success: !!commit,
          result: { hash: commit?.hash, message },
          timestamp,
          duration: Date.now() - startTime
        }
      }

      // NEW: Critique code
      case 'critique_code': {
        if (!action.code && !action.path) {
          return { action: 'critique_code', success: false, error: 'No code or path provided', timestamp, duration: Date.now() - startTime }
        }
        
        let code = action.code
        if (!code && action.path) {
          const fullPath = path.join(WORKSPACE_DIR, action.path)
          code = await fs.readFile(fullPath, 'utf-8')
        }
        
        const critiqueEngine = getCritiqueEngine()
        const critique = await critiqueEngine.critiqueCode(code || '')
        state.critiques.push(critique)
        
        return {
          action: 'critique_code',
          success: true,
          result: {
            score: critique.overallScore,
            issues: critique.issues.length,
            improvements: critique.improvements.length
          },
          critique,
          timestamp,
          duration: Date.now() - startTime
        }
      }

      // NEW: Analyze with AST
      case 'analyze_ast': {
        const projectPath = action.path || state.currentProject || ''
        const fullPath = path.join(WORKSPACE_DIR, projectPath)
        
        const analysis = await analyzeProjectAST(fullPath)
        
        return {
          action: 'analyze_ast',
          success: true,
          result: {
            files: Object.keys(analysis.files).length,
            functions: analysis.stats.totalFunctions,
            classes: analysis.stats.totalClasses,
            patterns: analysis.patterns
          },
          timestamp,
          duration: Date.now() - startTime
        }
      }

      case 'complete':
        return { action: 'complete', success: true, result: action.message, timestamp, duration: Date.now() - startTime }

      case 'continue':
        return { action: 'continue', success: true, result: action.reason, timestamp, duration: Date.now() - startTime }

      default:
        return { action: action.action || 'unknown', success: false, error: 'Unknown action', timestamp, duration: Date.now() - startTime }
    }
  } catch (error: any) {
    return { action: action.action || 'unknown', success: false, error: error.message, timestamp, duration: Date.now() - startTime }
  }
}

// Extract JSON actions from AI response
function extractActions(response: string): any[] {
  const actions: any[] = []
  
  // Try to parse entire response as JSON
  try {
    const parsed = JSON.parse(response.trim())
    if (parsed.action) {
      actions.push(parsed)
      return actions
    }
  } catch {}
  
  // Match JSON code blocks
  const jsonMatches = response.match(/```json\s*([\s\S]*?)\s*```/g)
  if (jsonMatches) {
    for (const match of jsonMatches) {
      try {
        const jsonStr = match.replace(/```json\s*|\s*```/g, '')
        const action = JSON.parse(jsonStr)
        if (action.action) actions.push(action)
      } catch {}
    }
  }
  
  // Match inline JSON objects with action field
  const inlineMatches = response.match(/\{[^{}]*"action"\s*:\s*"[^"]+?"[^{}]*\}/g)
  if (inlineMatches) {
    for (const match of inlineMatches) {
      try {
        const action = JSON.parse(match)
        if (action.action && !actions.find(a => JSON.stringify(a) === match)) {
          actions.push(action)
        }
      } catch {}
    }
  }
  
  return actions
}

// SSE Stream Encoder
const encoder = new TextEncoder()
function createSSEMessage(data: any) {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
}

// POST - Run autonomous agent with FULL autonomous capabilities and INTEGRATED AI
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { prompt, maxIterations = MAX_ITERATIONS, resumeTaskId } = body

  if (!prompt && !resumeTaskId) {
    return new Response(JSON.stringify({ error: 'Prompt or resumeTaskId is required' }), { status: 400 })
  }

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Initialize AI
        const zai = await ZAI.create()
        
        // Initialize Chain-of-Thought Engine
        const cotEngine = await getCoTEngine()
        
        // Initialize Self-Critique Engine
        const critiqueEngine = getCritiqueEngine()
        await critiqueEngine.initialize()
        
        // Initialize Architecture Builder
        const archBuilder = getArchitectureBuilder()
        
        // Initialize or resume state
        const state: AgentState = {
          taskId: null,
          iteration: 0,
          totalIterations: 0,
          actions: [],
          complete: false,
          errors: [],
          fixedErrors: [],
          dependenciesInstalled: [],
          buildVerified: false,
          reasoningChains: [],
          critiques: [],
          architectureGraph: null,
          securityIssues: 0,
          testsGenerated: [],
          auditSessionId: null,
          checkpointId: null
        }
        
        // Create or load task
        if (resumeTaskId) {
          const task = await loadTask(resumeTaskId)
          if (task) {
            state.taskId = task.id
            state.actions = task.actions.map(a => ({
              action: a.type,
              success: a.success,
              result: a.details,
              error: a.error,
              timestamp: a.timestamp,
              duration: a.duration
            }))
            state.currentProject = task.projectId
            state.iteration = task.iteration
            state.complete = task.status === 'completed'
          }
        } else {
          const task = await createTask(prompt, 'workspace', maxIterations)
          state.taskId = task.id
        }
        
        // Start audit session
        state.auditSessionId = await startAuditSession(state.currentProject || 'workspace', 'autonomous_run')
        
        // Send initial status
        controller.enqueue(createSSEMessage({ 
          type: 'status', 
          status: 'starting', 
          message: '🤖 Autonomous AI Agent starting with INTEGRATED AI SYSTEMS...',
          taskId: state.taskId,
          systems: {
            chainOfThought: true,
            astParser: true,
            messageBus: true,
            architectureGraph: true,
            selfCritique: true,
            securityScanner: true,
            autoTestGenerator: true,
            ragSystem: true,
            gitIntegration: true,
            auditLogging: true
          }
        }))
        
        // Start task
        if (state.taskId) {
          await startTask(state.taskId)
        }
        
        // === MAIN AUTONOMOUS LOOP with ALL AI SYSTEMS ===
        while (!state.complete && state.totalIterations < maxIterations) {
          state.totalIterations++
          state.iteration++
          
          // Build conversation history (last 10 actions)
          const conversationHistory = state.actions.slice(-10).map(a => ({
            role: 'user' as const,
            content: `[${a.action}] Success: ${a.success}${a.error ? ` Error: ${a.error}` : ''} Result: ${JSON.stringify(a.result).slice(0, 300)}${a.critique ? ` (Quality: ${a.critique.overallScore}/100)` : ''}`
          }))
          
          // Build context using context manager
          let contextStr = ''
          if (state.currentProject) {
            try {
              const context = await buildContext(prompt, state.currentProject, {
                maxTokens: 3000,
                includePackageJson: true
              })
              contextStr = '\n\n## Project Context:\n' + formatContextForAI(context)
            } catch {}
          }
          
          // Use Chain-of-Thought for reasoning
          let reasoningContext = ''
          try {
            const reasoning = await cotEngine.reason(
              `What should I do next for: ${prompt}? Current iteration: ${state.totalIterations}/${maxIterations}`,
              {
                existingCode: contextStr,
                constraints: ['Must make progress', 'Must be correct'],
                preferences: { qualityOverSpeed: true }
              }
            )
            state.reasoningChains.push(reasoning)
            reasoningContext = `\n\n## My Reasoning:\n${reasoning.conclusion.decision}\nConfidence: ${(reasoning.conclusion.confidence * 100).toFixed(0)}%`
            
            controller.enqueue(createSSEMessage({ 
              type: 'reasoning', 
              chain: reasoning,
              conclusion: reasoning.conclusion.decision
            }))
          } catch {}
          
          // Search knowledge base for patterns
          let knowledgeContext = ''
          try {
            const knowledge = await searchKnowledge(prompt, 3)
            if (knowledge.documents.length > 0) {
              knowledgeContext = `\n\n## Relevant Patterns:\n${knowledge.documents.map(d => d.content.slice(0, 200)).join('\n')}`
            }
          } catch {}
          
          // Build messages
          const messages = [
            { role: 'assistant', content: AUTONOMOUS_SYSTEM_PROMPT },
            { role: 'user', content: prompt + `\n\nIteration: ${state.totalIterations}/${maxIterations}\nDependencies Installed: ${state.dependenciesInstalled.join(', ') || 'none'}\nBuild Verified: ${state.buildVerified}\nSecurity Issues: ${state.securityIssues}\nTests Generated: ${state.testsGenerated.length}\nQuality Score: ${state.critiques.length > 0 ? Math.round(state.critiques.reduce((s, c) => s + c.overallScore, 0) / state.critiques.length) : 'N/A'}${contextStr}${reasoningContext}${knowledgeContext}` },
            ...conversationHistory
          ]
          
          // Send iteration status
          controller.enqueue(createSSEMessage({ 
            type: 'iteration', 
            iteration: state.totalIterations, 
            maxIterations,
            message: `Working with AI reasoning... (${state.totalIterations}/${maxIterations})`
          }))
          
          // Get AI response
          const completion = await zai.chat.completions.create({
            messages,
            thinking: { type: 'disabled' }
          })
          
          const aiResponse = completion.choices[0]?.message?.content || ''
          
          // Send AI thought
          controller.enqueue(createSSEMessage({ type: 'thought', content: aiResponse.slice(0, 500) }))
          
          // Extract actions
          const actions = extractActions(aiResponse)
          
          if (actions.length === 0) {
            controller.enqueue(createSSEMessage({ type: 'warning', message: 'No actions found, asking AI again...' }))
            continue
          }
          
          // Execute each action
          for (const action of actions) {
            if (state.complete) break
            
            controller.enqueue(createSSEMessage({ type: 'action', action: action.action, details: action }))
            
            const result = await executeAction(action, state)
            state.actions.push(result)
            
            // Record action
            if (state.taskId) {
              await recordAction(state.taskId, {
                type: action.action,
                details: action,
                success: result.success,
                error: result.error,
                duration: result.duration
              })
            }
            
            // Track errors
            if (!result.success) {
              state.errors.push(result.error || 'Unknown error')
              controller.enqueue(createSSEMessage({ type: 'error', error: result.error, result }))
              
              // Try auto-recovery for certain errors
              if (result.error?.includes('Cannot find module') || result.error?.includes('Module not found')) {
                controller.enqueue(createSSEMessage({ type: 'recovery', message: '🔄 Auto-recovering: Installing missing module...' }))
                
                // Auto-install
                const installResult = await executeAction({ action: 'auto_install', cwd: state.currentProject }, state)
                if (installResult.success) {
                  controller.enqueue(createSSEMessage({ type: 'success', result: installResult.result }))
                }
              }
              
              // Use Chain-of-Thought for error recovery
              if (result.error && state.totalIterations < maxIterations - 5) {
                try {
                  const recoveryReasoning = await cotEngine.reason(
                    `How to fix this error: ${result.error}`,
                    { constraints: ['Safe fix', 'Minimal changes'] }
                  )
                  controller.enqueue(createSSEMessage({ 
                    type: 'recovery', 
                    message: `🧠 AI Recovery Analysis: ${recoveryReasoning.conclusion.decision.slice(0, 200)}...` 
                  }))
                } catch {}
              }
            } else {
              controller.enqueue(createSSEMessage({ type: 'success', result }))
              
              // If critique was done and score is low, try to improve
              if (result.critique && result.critique.overallScore < 70) {
                controller.enqueue(createSSEMessage({ 
                  type: 'improvement', 
                  message: `⚠️ Quality score: ${result.critique.overallScore}/100. Attempting improvement...` 
                }))
                
                // Let AI know it should improve
                state.actions.push({
                  action: 'improve_quality',
                  success: true,
                  result: `Noted: code quality is ${result.critique.overallScore}/100`,
                  timestamp: new Date().toISOString()
                })
              }
            }
            
            // Check if complete
            if (action.action === 'complete') {
              state.complete = true
              state.message = action.message
              if (action.preview_url) state.previewUrl = action.preview_url
              
              // Verify build before completing
              if (state.currentProject && !state.buildVerified) {
                controller.enqueue(createSSEMessage({ type: 'status', message: '🔍 Final build verification...' }))
                const verify = await executeAction({ action: 'build_verify', cwd: state.currentProject }, state)
                if (!verify.success) {
                  state.complete = false
                  controller.enqueue(createSSEMessage({ type: 'warning', message: 'Build verification failed, continuing...' }))
                }
              }
              
              // Security scan before complete
              if (state.complete && state.currentProject) {
                controller.enqueue(createSSEMessage({ type: 'status', message: '🔒 Final security scan...' }))
                const security = await executeAction({ action: 'security_scan', cwd: state.currentProject }, state)
                if (!security.success) {
                  controller.enqueue(createSSEMessage({ type: 'warning', message: `Security issues found: ${security.result?.critical || 0} critical` }))
                }
              }
              
              // Git commit on complete
              if (state.complete && state.currentProject && await isGitAvailable()) {
                controller.enqueue(createSSEMessage({ type: 'status', message: '📝 Creating final commit...' }))
                await executeAction({ action: 'git_commit', cwd: state.currentProject, message: `Complete: ${action.message}` }, state)
              }
              
              break
            }
            
            // Small delay between actions
            await new Promise(r => setTimeout(r, 200))
          }
          
          // If we have errors but not complete, the loop will continue and AI will try to fix
          if (!state.complete && state.actions.some(a => !a.success)) {
            controller.enqueue(createSSEMessage({ 
              type: 'recovery', 
              message: '🔄 Errors detected, AI will attempt to fix in next iteration...'
            }))
          }
          
          // Update task progress
          if (state.taskId) {
            await updateTask(state.taskId, {
              iteration: state.iteration,
              progress: (state.totalIterations / maxIterations) * 100
            })
          }
        }
        
        // Get file tree
        let fileTree = null
        try {
          const entries = await fs.readdir(WORKSPACE_DIR, { withFileTypes: true })
          fileTree = await Promise.all(entries.map(async (entry) => {
            if (entry.isDirectory()) {
              const subPath = path.join(WORKSPACE_DIR, entry.name)
              const subEntries = await fs.readdir(subPath, { withFileTypes: true })
              return {
                name: entry.name,
                type: 'folder',
                children: subEntries.slice(0, 30).map(e => ({
                  name: e.name,
                  type: e.isDirectory() ? 'folder' : 'file'
                }))
              }
            }
            return { name: entry.name, type: 'file' }
          }))
        } catch {}
        
        // Complete task
        if (state.taskId) {
          if (state.complete) {
            await completeTask(state.taskId, {
              success: true,
              message: state.message || 'Task completed',
              previewUrl: state.previewUrl
            })
          } else {
            await failTask(state.taskId, state.totalIterations >= maxIterations ? 'Max iterations reached' : 'Task failed')
          }
        }
        
        // Calculate final quality score
        const finalQualityScore = state.critiques.length > 0
          ? Math.round(state.critiques.reduce((s, c) => s + c.overallScore, 0) / state.critiques.length)
          : 0
        
        // Send final result
        controller.enqueue(createSSEMessage({
          type: 'complete',
          success: state.complete,
          message: state.complete 
            ? `✅ ${state.message}` 
            : state.totalIterations >= maxIterations 
              ? `⚠️ Reached max iterations (${maxIterations})`
              : 'Task completed',
          previewUrl: state.previewUrl,
          apkUrl: state.apkUrl,
          fileTree,
          totalIterations: state.totalIterations,
          errors: state.errors,
          fixedErrors: state.fixedErrors,
          dependenciesInstalled: state.dependenciesInstalled,
          buildVerified: state.buildVerified,
          actions: state.actions.slice(-20),
          // New AI metrics
          aiMetrics: {
            reasoningChains: state.reasoningChains.length,
            critiques: state.critiques.length,
            qualityScore: finalQualityScore,
            securityIssues: state.securityIssues,
            testsGenerated: state.testsGenerated.length
          }
        }))
        
      } catch (error: any) {
        controller.enqueue(createSSEMessage({ type: 'error', error: error.message }))
      } finally {
        controller.close()
      }
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}

// GET - Get workspace state with enhanced info
export async function GET() {
  try {
    const entries = await fs.readdir(WORKSPACE_DIR, { withFileTypes: true })
    const projects = entries.filter(e => e.isDirectory()).map(e => ({ name: e.name, type: 'project' }))
    
    // Get active tasks
    const activeTasks = await getActiveTasks()
    
    // Get all servers
    const servers = getAllServers()
    
    // Get project index
    const index = await loadIndex()
    
    // Get message bus stats
    const messageBusStats = messageBus.getStats()
    
    return Response.json({
      success: true,
      workspace: WORKSPACE_DIR,
      projects,
      activeTasks,
      servers,
      index: index ? {
        totalFiles: index.totalFiles,
        frameworks: index.metadata.frameworks,
        lastIndexed: index.lastIndexed
      } : null,
      activeServers: Array.from(activeServers.entries()).map(([port, info]) => ({
        port,
        status: info.status,
        startTime: info.startTime,
        url: `http://localhost:${port}`
      })),
      // New AI systems status
      aiSystems: {
        messageBus: messageBusStats,
        chainOfThought: 'active',
        astParser: 'active',
        architectureGraph: 'active',
        selfCritique: 'active',
        securityScanner: 'active',
        autoTestGenerator: 'active',
        ragSystem: 'active',
        gitIntegration: await isGitAvailable(),
        auditLogging: 'active'
      }
    })
  } catch {
    return Response.json({ success: true, workspace: WORKSPACE_DIR, projects: [], activeServers: [] })
  }
}

// DELETE - Stop all servers and cleanup
export async function DELETE() {
  await stopAllServers()
  
  for (const [port, server] of activeServers.entries()) {
    try {
      server.process.kill()
      activeServers.delete(port)
    } catch {}
  }
  
  return Response.json({ success: true, message: 'All servers stopped' })
}
