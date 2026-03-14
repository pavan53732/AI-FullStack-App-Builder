import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')

// POST - Execute any command with full access
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { command, cwd, timeout = 300000 } = body // 5 min default timeout

    if (!command) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 })
    }

    const workingDir = cwd 
      ? path.join(WORKSPACE_DIR, cwd)
      : WORKSPACE_DIR

    // Execute command with full access
    const result = await executeCommand(command, workingDir, timeout)

    return NextResponse.json({
      success: !result.error,
      ...result,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Terminal execution error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      stdout: '',
      stderr: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET - Execute command via URL (for quick testing)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const command = searchParams.get('command')
  const cwd = searchParams.get('cwd')
  const timeout = parseInt(searchParams.get('timeout') || '60000')

  if (!command) {
    return NextResponse.json({ 
      error: 'Command parameter required',
      usage: '/api/terminal?command=npm%20install&cwd=my-app'
    }, { status: 400 })
  }

  const workingDir = cwd 
    ? path.join(WORKSPACE_DIR, cwd)
    : WORKSPACE_DIR

  const result = await executeCommand(command, workingDir, timeout)

  return NextResponse.json({
    success: !result.error,
    ...result,
    timestamp: new Date().toISOString()
  })
}

// Execute command and return result
async function executeCommand(
  command: string, 
  cwd: string, 
  timeout: number
): Promise<{
  stdout: string
  stderr: string
  error?: string
  code: number | null
  signal: string | null
  duration: number
}> {
  return new Promise((resolve) => {
    const startTime = Date.now()
    
    // Use shell to execute command
    const child = spawn(command, [], {
      cwd,
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        FORCE_COLOR: '1',
        TERM: 'xterm-256color'
      },
      timeout
    })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code, signal) => {
      resolve({
        stdout,
        stderr,
        code,
        signal,
        duration: Date.now() - startTime,
        error: code !== 0 ? `Process exited with code ${code}` : undefined
      })
    })

    child.on('error', (error) => {
      resolve({
        stdout,
        stderr,
        error: error.message,
        code: null,
        signal: null,
        duration: Date.now() - startTime
      })
    })
  })
}
