'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Send, Sparkles, Code2, Smartphone, Download, Loader2, Plus, FolderOpen,
  Copy, Check, Monitor, Tablet, Play, Settings, Zap, LayoutTemplate,
  MessageSquare, Eye, FileCode, Folder, Terminal as TerminalIcon,
  PlayCircle, CheckCircle, XCircle, Clock, Bot, RefreshCw, Rocket,
  AlertCircle, ExternalLink, StopCircle, Database, Package, Wrench,
  Activity, Server, GitBranch, Layers, Cpu, Sliders
} from 'lucide-react'
import { AISettingsDialog } from '@/components/ai-settings/ai-settings-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Types
interface ActionLog {
  action: string
  success: boolean
  result?: any
  error?: string
  timestamp: string
  duration?: number
}

interface FileNode {
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
}

interface SSEMessage {
  type: string
  [key: string]: any
}

interface WorkspaceState {
  projects: Array<{ name: string }>
  activeTasks: Array<{ id: string; status: string; prompt: string }>
  servers: Array<{ port: number; status: string; url: string }>
  index?: {
    totalFiles: number
    frameworks: string[]
    lastIndexed: string
  }
}

// Templates
const templates = [
  { id: '1', name: 'Todo App', icon: '✅', prompt: 'Create a React Todo app with TypeScript. Features: add/edit/delete tasks, priorities, dark mode, local storage. Create ALL files, install dependencies, and run dev server.' },
  { id: '2', name: 'Notes App', icon: '📝', prompt: 'Create a React Notes app with TypeScript. Features: create/edit notes, markdown support, folders. Create ALL files, install deps, run dev server.' },
  { id: '3', name: 'Calculator', icon: '🧮', prompt: 'Create a React Calculator with TypeScript. Features: basic math, scientific functions, history. Create ALL files, install deps, run dev server.' },
  { id: '4', name: 'Weather App', icon: '🌤️', prompt: 'Create a React Weather app with TypeScript. Features: current weather, forecast, search by city. Create ALL files, install deps, run dev server.' },
]

export default function Home() {
  // State
  const [activeTab, setActiveTab] = useState('chat')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showTemplates, setShowTemplates] = useState(true)
  
  // Chat
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([
    { role: 'assistant', content: '🤖 **FULLY AUTONOMOUS AI** - I now have enhanced capabilities:\n\n✨ **NEW Features:**\n- 📚 Project Indexing - Semantic understanding of codebase\n- 📦 Auto Dependencies - Detects & installs missing packages\n- 🔧 Error Recovery - Auto-fixes errors\n- 💾 Progress Persistence - Can resume interrupted tasks\n- 🧠 Smart Context - Knows which files are relevant\n- 🖥️ Server Management - Health checks & auto-restart\n- ✅ Build Verification - Verifies builds work\n\nJust describe your app and I\'ll work autonomously until it\'s DONE!' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Autonomous state
  const [isRunning, setIsRunning] = useState(false)
  const [iteration, setIteration] = useState(0)
  const [maxIterations, setMaxIterations] = useState(50)
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([])
  const [currentAction, setCurrentAction] = useState<string>('')
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [taskId, setTaskId] = useState<string>('')
  
  // Enhanced state
  const [dependenciesInstalled, setDependenciesInstalled] = useState<string[]>([])
  const [buildVerified, setBuildVerified] = useState(false)
  const [errorsFixed, setErrorsFixed] = useState<string[]>([])
  
  // Workspace state
  const [workspace, setWorkspace] = useState<WorkspaceState>({
    projects: [],
    activeTasks: [],
    servers: [],
    index: undefined
  })
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [selectedFile, setSelectedFile] = useState<{name: string; content?: string} | null>(null)
  
  // Terminal
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '╔═══════════════════════════════════════════════════════════════╗',
    '║     🤖 FULLY AUTONOMOUS AI - ENHANCED MODE                   ║',
    '║     ✓ Project Indexing   ✓ Auto Dependencies                 ║',
    '║     ✓ Error Recovery     ✓ Progress Persistence              ║',
    '║     ✓ Smart Context      ✓ Server Management                 ║',
    '║     ✓ Build Verification                                      ║',
    '╚═══════════════════════════════════════════════════════════════╝',
    ''
  ])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const terminalEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [terminalOutput])

  // Fetch workspace on mount
  useEffect(() => {
    fetchWorkspace()
    const interval = setInterval(fetchWorkspace, 5000) // Refresh every 5s
    return () => clearInterval(interval)
  }, [])

  const fetchWorkspace = async () => {
    try {
      const res = await fetch('/api/autonomous')
      const data = await res.json()
      if (data.success) {
        setWorkspace({
          projects: data.projects || [],
          activeTasks: data.activeTasks || [],
          servers: data.servers || data.activeServers || [],
          index: data.index
        })
      }
    } catch {}
  }

  // === MAIN AUTONOMOUS FUNCTION - Uses SSE Streaming ===
  const runAutonomousAgent = async (prompt: string) => {
    if (isRunning) return
    
    setIsRunning(true)
    setIsLoading(true)
    setIsComplete(false)
    setActionLogs([])
    setIteration(0)
    setProgress(0)
    setDependenciesInstalled([])
    setBuildVerified(false)
    setErrorsFixed([])
    setTerminalOutput(prev => [...prev, '', `🚀 Starting FULLY AUTONOMOUS agent...`, `📝 Task: "${prompt.slice(0, 60)}..."`])
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: prompt }])
    
    try {
      // Use SSE for streaming
      const response = await fetch('/api/autonomous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, maxIterations })
      })
      
      if (!response.ok) throw new Error('Failed to start agent')
      
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) throw new Error('No reader available')
      
      let buffer = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        
        // Process SSE messages
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: SSEMessage = JSON.parse(line.slice(6))
              handleSSEMessage(data)
            } catch {}
          }
        }
      }
      
    } catch (error: any) {
      setTerminalOutput(prev => [...prev, `❌ Error: ${error.message}`])
      toast.error(error.message)
    } finally {
      setIsRunning(false)
      setIsLoading(false)
    }
  }

  // Handle SSE messages
  const handleSSEMessage = (data: SSEMessage) => {
    switch (data.type) {
      case 'status':
        setTerminalOutput(prev => [...prev, `📡 ${data.message}`])
        if (data.taskId) setTaskId(data.taskId)
        break
        
      case 'iteration':
        setIteration(data.iteration)
        setMaxIterations(data.maxIterations)
        setProgress((data.iteration / data.maxIterations) * 100)
        setTerminalOutput(prev => [...prev, `🔄 Iteration ${data.iteration}/${data.maxIterations}`])
        break
        
      case 'thought':
        setTerminalOutput(prev => [...prev, `🤔 AI: ${data.content.slice(0, 100)}...`])
        break
        
      case 'action':
        setCurrentAction(data.action)
        setTerminalOutput(prev => [...prev, `⚡ Action: ${data.action}`])
        break
        
      case 'success':
        setActionLogs(prev => [...prev, { action: currentAction, success: true, result: data.result, timestamp: new Date().toISOString() }])
        setTerminalOutput(prev => [...prev, `✅ Success: ${JSON.stringify(data.result).slice(0, 80)}`])
        
        // Track installed dependencies
        if (data.result?.installed) {
          setDependenciesInstalled(prev => [...prev, ...data.result.installed])
        }
        break
        
      case 'error':
        setActionLogs(prev => [...prev, { action: currentAction, success: false, error: data.error, timestamp: new Date().toISOString() }])
        setTerminalOutput(prev => [...prev, `❌ Error: ${data.error}`])
        break
        
      case 'recovery':
        setTerminalOutput(prev => [...prev, `🔧 ${data.message}`])
        if (data.message?.includes('fixed')) {
          setErrorsFixed(prev => [...prev, data.message])
        }
        break
        
      case 'complete':
        setIsComplete(true)
        setProgress(100)
        if (data.success) {
          setMessages(prev => [...prev, { role: 'assistant', content: data.message || 'Task complete!' }])
          if (data.previewUrl) {
            setPreviewUrl(data.previewUrl)
            setTerminalOutput(prev => [...prev, `🌐 Preview: ${data.previewUrl}`])
          }
          if (data.dependenciesInstalled) {
            setDependenciesInstalled(data.dependenciesInstalled)
          }
          if (data.buildVerified !== undefined) {
            setBuildVerified(data.buildVerified)
          }
          toast.success(data.message)
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: data.message || 'Task stopped' }])
          toast.warning(data.message)
        }
        if (data.fileTree) setFileTree(data.fileTree)
        fetchWorkspace()
        break
    }
  }

  // Stop agent
  const stopAgent = () => {
    setIsRunning(false)
    setIsLoading(false)
    setTerminalOutput(prev => [...prev, '⏹️ Stopped by user'])
    toast.info('Agent stopped')
  }

  // Send message
  const sendMessage = () => {
    if (!input.trim() || isRunning) return
    const prompt = input.trim()
    setInput('')
    setShowTemplates(false)
    runAutonomousAgent(prompt)
  }

  // Use template
  const selectTemplate = (template: typeof templates[0]) => {
    setInput(template.prompt)
    setShowTemplates(false)
    inputRef.current?.focus()
  }

  // Quick commands
  const quickCommands = [
    { label: 'npm install', cmd: 'npm install', icon: Package },
    { label: 'npm run dev', cmd: 'npm run dev', icon: Play },
    { label: 'npm run build', cmd: 'npm run build', icon: Wrench },
    { label: 'Index Project', cmd: '__index__', icon: Database },
  ]

  const executeQuickCommand = async (cmd: string) => {
    if (cmd === '__index__') {
      setTerminalOutput(prev => [...prev, '', '📚 Indexing project...'])
      try {
        const res = await fetch('/api/autonomous', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: 'Index the current project structure' })
        })
        setTerminalOutput(prev => [...prev, '✅ Project indexed'])
        fetchWorkspace()
      } catch {}
      return
    }
    
    setTerminalOutput(prev => [...prev, '', `$ ${cmd}`])
    try {
      const res = await fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      })
      const data = await res.json()
      if (data.stdout) setTerminalOutput(prev => [...prev, data.stdout])
      if (data.stderr) setTerminalOutput(prev => [...prev, data.stderr])
    } catch {}
  }

  // Render file tree
  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node, i) => (
      <div key={i}>
        <div
          className={cn("flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-muted rounded text-sm")}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {node.type === 'folder' ? (
            <Folder className="h-4 w-4 text-yellow-500" />
          ) : (
            <FileCode className="h-4 w-4 text-blue-500" />
          )}
          <span>{node.name}</span>
        </div>
        {node.children && renderFileTree(node.children, depth + 1)}
      </div>
    ))
  }

  // Stats
  const successRate = actionLogs.length > 0 
    ? Math.round((actionLogs.filter(a => a.success).length / actionLogs.length) * 100)
    : 0

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Fully Autonomous AI Builder</h1>
              <div className="flex items-center gap-2">
                <Badge variant={isRunning ? "default" : "outline"} className="text-xs">
                  {isRunning ? (
                    <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Working...</>
                  ) : isComplete ? (
                    <><CheckCircle className="h-3 w-3 mr-1 text-green-500" /> Complete</>
                  ) : (
                    <><Zap className="h-3 w-3 mr-1" /> Ready</>
                  )}
                </Badge>
                {isRunning && (
                  <Badge variant="secondary" className="text-xs">
                    {iteration}/{maxIterations} iterations
                  </Badge>
                )}
                {dependenciesInstalled.length > 0 && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                    <Package className="h-3 w-3 mr-1" /> {dependenciesInstalled.length} deps
                  </Badge>
                )}
                {buildVerified && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                    <CheckCircle className="h-3 w-3 mr-1" /> Build OK
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* AI Settings - PROMINENT */}
            <AISettingsDialog 
              trigger={
                <Button 
                  size="sm" 
                  className="gap-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white shadow-md"
                >
                  <Sliders className="h-4 w-4" />
                  <span className="hidden sm:inline">AI Settings</span>
                  <Sparkles className="h-3 w-3" />
                </Button>
              }
              onSettingsChange={() => {
                toast.success('AI settings updated!')
              }}
            />
            
            {/* System Status */}
            <div className="flex items-center gap-2 text-sm">
              {workspace.index && (
                <Badge variant="outline" className="text-xs">
                  <Database className="h-3 w-3 mr-1" />
                  {workspace.index.totalFiles} files indexed
                </Badge>
              )}
              {workspace.servers.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Server className="h-3 w-3 mr-1" />
                  {workspace.servers.length} server{workspace.servers.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            {previewUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(previewUrl, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Open Preview
              </Button>
            )}
            {isRunning && (
              <Button variant="destructive" size="sm" onClick={stopAgent}>
                <StopCircle className="h-4 w-4 mr-1" />
                Stop
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => {
              setMessages([messages[0]])
              setActionLogs([])
              setIsComplete(false)
              setProgress(0)
              setDependenciesInstalled([])
              setBuildVerified(false)
              setShowTemplates(true)
            }}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        {isRunning && (
          <div className="px-4 pb-2">
            <Progress value={progress} className="h-1" />
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r bg-card flex flex-col">
          {/* Enhanced Status */}
          <div className="p-4 border-b">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Autonomous Status
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Iterations</span>
                <span>{iteration}/{maxIterations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Actions</span>
                <span>{actionLogs.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Success Rate</span>
                <span className={successRate >= 80 ? 'text-green-500' : successRate >= 50 ? 'text-yellow-500' : 'text-red-500'}>
                  {successRate}%
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Package className="h-3 w-3" /> Deps Installed
                </span>
                <span className="text-green-500">{dependenciesInstalled.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Wrench className="h-3 w-3" /> Build Status
                </span>
                <span className={buildVerified ? 'text-green-500' : 'text-muted-foreground'}>
                  {buildVerified ? '✓ Verified' : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Errors Fixed
                </span>
                <span className="text-blue-500">{errorsFixed.length}</span>
              </div>
            </div>
          </div>
          
          {/* Projects */}
          <div className="p-4 border-b">
            <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Projects ({workspace.projects.length})
            </h2>
            <ScrollArea className="h-28">
              {workspace.projects.map((p, i) => (
                <div key={i} className="flex items-center gap-2 p-1 text-sm">
                  <Folder className="h-4 w-4 text-yellow-500" />
                  <span>{p.name}</span>
                </div>
              ))}
            </ScrollArea>
          </div>
          
          {/* Servers */}
          <div className="p-4 border-b">
            <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Server className="h-4 w-4" />
              Active Servers ({workspace.servers.length})
            </h2>
            <ScrollArea className="h-20">
              {workspace.servers.length > 0 ? workspace.servers.map((s, i) => (
                <div key={i} className="flex items-center gap-2 p-1 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="truncate">:{s.port}</span>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground">No servers running</p>
              )}
            </ScrollArea>
          </div>
          
          {/* Quick Actions */}
          <div className="p-4">
            <h2 className="text-sm font-semibold mb-2">Quick Commands</h2>
            <div className="space-y-1">
              {quickCommands.map((q, i) => (
                <Button key={i} variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => executeQuickCommand(q.cmd)}>
                  <q.icon className="h-3 w-3 mr-2" />
                  {q.label}
                </Button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="border-b px-4">
                <TabsList className="bg-transparent">
                  <TabsTrigger value="chat" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="terminal" className="gap-2">
                    <TerminalIcon className="h-4 w-4" />
                    Terminal
                  </TabsTrigger>
                  <TabsTrigger value="files" className="gap-2">
                    <FileCode className="h-4 w-4" />
                    Files
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Chat Tab */}
              <TabsContent value="chat" className="flex-1 flex flex-col m-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {messages.map((msg, i) => (
                      <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}>
                        {msg.role === 'assistant' && (
                          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <div className={cn("rounded-lg px-4 py-2 max-w-[80%]", msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted")}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Templates */}
                  {showTemplates && !isRunning && (
                    <div className="mt-6 max-w-3xl mx-auto">
                      <h3 className="text-sm font-semibold mb-3">Quick Templates</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {templates.map(t => (
                          <Card key={t.id} className="cursor-pointer hover:border-primary" onClick={() => selectTemplate(t)}>
                            <CardHeader className="p-3">
                              <div className="text-2xl mb-1">{t.icon}</div>
                              <CardTitle className="text-sm">{t.name}</CardTitle>
                            </CardHeader>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="border-t p-4">
                  <div className="max-w-3xl mx-auto flex gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Describe your app... Fully autonomous AI will work until DONE"
                      className="flex-1 h-12"
                      disabled={isRunning}
                    />
                    <Button onClick={sendMessage} disabled={isRunning || !input.trim()} className="h-12 px-6 bg-gradient-to-r from-purple-600 to-pink-500">
                      {isRunning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Terminal Tab */}
              <TabsContent value="terminal" className="flex-1 m-0 flex flex-col">
                <div className="flex-1 bg-zinc-950 text-green-400 font-mono text-sm p-4 overflow-auto">
                  {terminalOutput.map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap">{line}</div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>
              </TabsContent>

              {/* Files Tab */}
              <TabsContent value="files" className="flex-1 m-0 flex">
                <div className="w-64 border-r p-2">
                  <div className="text-sm font-medium p-2">Workspace</div>
                  <ScrollArea className="h-full">
                    {fileTree.length > 0 ? renderFileTree(fileTree) : (
                      <p className="text-sm text-muted-foreground p-4">No files yet. Start by describing your app!</p>
                    )}
                  </ScrollArea>
                </div>
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <FileCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Select a file to view</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          <div className="w-[350px] border-l flex flex-col bg-card">
            <div className="border-b p-2 flex items-center justify-between">
              <span className="text-sm font-medium">Preview</span>
              <div className="flex gap-1">
                <Button variant={previewDevice === 'desktop' ? 'default' : 'ghost'} size="sm" className="h-8 w-8 p-0" onClick={() => setPreviewDevice('desktop')}>
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button variant={previewDevice === 'tablet' ? 'default' : 'ghost'} size="sm" className="h-8 w-8 p-0" onClick={() => setPreviewDevice('tablet')}>
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button variant={previewDevice === 'mobile' ? 'default' : 'ghost'} size="sm" className="h-8 w-8 p-0" onClick={() => setPreviewDevice('mobile')}>
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-4 bg-muted/30">
              <div className={cn(
                "bg-white rounded-xl shadow-xl overflow-hidden border transition-all duration-300",
                previewDevice === 'desktop' && "w-full h-full",
                previewDevice === 'tablet' && "w-[90%] h-[80%]",
                previewDevice === 'mobile' && "w-[240px] h-[400px]"
              )}>
                {previewUrl ? (
                  <iframe src={previewUrl} className="w-full h-full border-0" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
                    <div className="text-center p-6">
                      <Play className="h-10 w-10 mx-auto mb-3 text-purple-500" />
                      <p className="text-sm text-muted-foreground">Preview will appear here</p>
                      <p className="text-xs text-muted-foreground mt-1">AI will start server automatically</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* System Info */}
            <div className="border-t p-4">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                System Status
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Project Index</span>
                  <Badge variant="outline" className="text-xs">
                    {workspace.index ? `${workspace.index.totalFiles} files` : 'Empty'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Frameworks</span>
                  <span className="text-xs">
                    {workspace.index?.frameworks?.join(', ') || 'None detected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
