import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import ZAI from 'z-ai-web-dev-sdk'

const execAsync = promisify(exec)

// System prompt for AI with terminal access
const SYSTEM_PROMPT = `You are an AI Full-Stack App Builder with TERMINAL ACCESS. You can execute real commands to build, compile, and deploy applications.

## Your Capabilities:
1. **Generate Code** - Write complete, production-ready applications
2. **Execute Commands** - Run terminal commands to:
   - Install dependencies (npm install, bun install)
   - Build projects (npm run build, next build)
   - Add platforms (npx cap add android)
   - Build Android apps (npx cap build android)
   - Run development servers (npm run dev)

## Available Commands:
- npm, npx, bun, yarn, pnpm
- git, node, tsc, next
- capacitor/cap commands
- Basic file operations (ls, cat, mkdir, etc.)

## When to Execute Commands:
1. **After generating code** - Install dependencies automatically
2. **When building** - Run build commands
3. **For Android** - Execute Capacitor commands

## Response Format:
When you want to execute a command, respond with a JSON action:
\`\`\`json
{
  "action": "execute",
  "command": "npm install",
  "description": "Installing dependencies"
}
\`\`\`

For code generation:
\`\`\`json
{
  "action": "create_files",
  "files": {...},
  "description": "Creating project files"
}
\`\`\`

For chat responses:
\`\`\`json
{
  "action": "message",
  "content": "Your message here"
}
\`\`\`

Always be helpful and explain what you're doing. Execute commands proactively to build complete applications.`

// Allowed commands for security
const ALLOWED_COMMANDS = [
  'npm', 'npx', 'bun', 'yarn', 'pnpm',
  'git', 'node', 'tsc', 'next',
  'capacitor', 'cap',
  'ls', 'cat', 'pwd', 'mkdir', 'rm', 'cp', 'mv',
  'echo', 'which'
]

// Check if command is safe
function isCommandSafe(command: string): boolean {
  const baseCommand = command.trim().split(' ')[0]
  return ALLOWED_COMMANDS.some(allowed => 
    baseCommand === allowed || baseCommand.endsWith('/' + allowed)
  )
}

// Execute a terminal command
async function executeCommand(command: string, cwd?: string) {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: cwd || process.cwd(),
      timeout: 120000,
      maxBuffer: 1024 * 1024 * 10
    })
    
    return {
      success: true,
      stdout: stdout.toString(),
      stderr: stderr.toString()
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      stdout: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || ''
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, history = [], autoExecute = true } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Initialize AI
    const zai = await ZAI.create()

    // Build conversation
    const messages = [
      { role: 'assistant', content: SYSTEM_PROMPT },
      ...history.slice(-10).map((h: { role: string; content: string }) => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: h.content
      })),
      { role: 'user', content: message }
    ]

    // Get AI response
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' }
    })

    const aiResponse = completion.choices[0]?.message?.content || ''

    // Parse AI response for actions
    const actions: any[] = []
    const commandResults: any[] = []

    // Extract JSON actions from response
    const jsonMatches = aiResponse.match(/```json\n([\s\S]*?)\n```/g)
    if (jsonMatches) {
      for (const match of jsonMatches) {
        try {
          const jsonStr = match.replace(/```json\n|\n```/g, '')
          const action = JSON.parse(jsonStr)
          actions.push(action)
        } catch {
          // Invalid JSON, skip
        }
      }
    }

    // Execute actions if autoExecute is true
    if (autoExecute) {
      for (const action of actions) {
        if (action.action === 'execute' && action.command) {
          if (!isCommandSafe(action.command)) {
            commandResults.push({
              command: action.command,
              success: false,
              error: 'Command not allowed for security reasons'
            })
            continue
          }

          const result = await executeCommand(action.command)
          commandResults.push({
            command: action.command,
            description: action.description,
            ...result,
            timestamp: new Date().toISOString()
          })
        }
      }
    }

    // Auto-suggest commands
    const shouldAutoBuild = message.toLowerCase().includes('build') || 
                            message.toLowerCase().includes('install') ||
                            message.toLowerCase().includes('compile') ||
                            message.toLowerCase().includes('android') ||
                            message.toLowerCase().includes('apk')

    const suggestedCommands: string[] = []
    if (shouldAutoBuild && !actions.some((a: any) => a.action === 'execute')) {
      if (message.toLowerCase().includes('install')) {
        suggestedCommands.push('npm install')
      }
      if (message.toLowerCase().includes('build')) {
        suggestedCommands.push('npm run build')
      }
      if (message.toLowerCase().includes('android') || message.toLowerCase().includes('apk')) {
        suggestedCommands.push('npx cap add android')
        suggestedCommands.push('npx cap sync')
        suggestedCommands.push('npx cap build android')
      }
    }

    return NextResponse.json({
      response: aiResponse,
      actions,
      commandResults,
      suggestedCommands,
      canExecute: true,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('AI Agent error:', error)
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error.message 
    }, { status: 500 })
  }
}

// GET - Execute a specific command directly
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const command = searchParams.get('command')
  const cwd = searchParams.get('cwd')

  if (!command) {
    return NextResponse.json({ 
      error: 'Command parameter required',
      usage: '/api/ai/agent?command=npm%20install'
    }, { status: 400 })
  }

  if (!isCommandSafe(command)) {
    return NextResponse.json({ 
      error: 'Command not allowed',
      command,
      allowedCommands: ALLOWED_COMMANDS
    }, { status: 403 })
  }

  const result = await executeCommand(command, cwd || undefined)

  return NextResponse.json({
    command,
    ...result,
    timestamp: new Date().toISOString()
  })
}
