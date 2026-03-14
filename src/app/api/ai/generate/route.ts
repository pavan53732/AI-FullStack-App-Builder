import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// System prompt for AI code generation
const SYSTEM_PROMPT = `You are an expert full-stack developer AI assistant specialized in generating complete, production-ready web applications. 

When users describe an app, you should:
1. Understand their requirements
2. Generate a complete, working application
3. Provide clear explanations

You can generate apps using:
- React with TypeScript
- Tailwind CSS for styling
- Modern best practices

Always respond with helpful information and when generating code, structure your response to include:
1. A brief explanation of what you'll build
2. The complete code
3. Instructions for running the app

Be concise but thorough. Focus on creating beautiful, functional apps that work out of the box.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, projectId, history = [] } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Initialize ZAI
    const zai = await ZAI.create()

    // Build conversation history
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

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

    // Check if this is a code generation request
    const isCodeRequest = message.toLowerCase().includes('create') || 
                          message.toLowerCase().includes('build') ||
                          message.toLowerCase().includes('make') ||
                          message.toLowerCase().includes('generate')

    // Generate project if needed
    let project = null
    if (isCodeRequest && !projectId) {
      const appName = extractAppName(message)
      
      project = await db.project.create({
        data: {
          name: appName,
          description: message,
          status: 'building',
          files: generateDefaultFiles(appName)
        }
      })

      await db.message.create({
        data: {
          projectId: project.id,
          role: 'user',
          content: message
        }
      })

      await db.message.create({
        data: {
          projectId: project.id,
          role: 'assistant',
          content: response
        }
      })

      await db.project.update({
        where: { id: project.id },
        data: { status: 'ready' }
      })
    } else if (projectId) {
      await db.message.create({
        data: {
          projectId,
          role: 'user',
          content: message
        }
      })

      await db.message.create({
        data: {
          projectId,
          role: 'assistant',
          content: response
        }
      })
    }

    const files = isCodeRequest ? generateFilesFromResponse(response, message) : null

    return NextResponse.json({
      response,
      project,
      files
    })

  } catch (error) {
    console.error('AI Generation Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}

function extractAppName(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('todo')) return 'Todo App'
  if (lowerMessage.includes('e-commerce') || lowerMessage.includes('ecommerce') || lowerMessage.includes('store')) return 'E-Commerce Store'
  if (lowerMessage.includes('notes') || lowerMessage.includes('note')) return 'Notes App'
  if (lowerMessage.includes('dashboard')) return 'Dashboard'
  if (lowerMessage.includes('weather')) return 'Weather App'
  if (lowerMessage.includes('chat')) return 'Chat App'
  if (lowerMessage.includes('calculator')) return 'Calculator'
  if (lowerMessage.includes('expense') || lowerMessage.includes('budget')) return 'Expense Tracker'
  
  return 'My App'
}

function generateDefaultFiles(appName: string) {
  return {
    'package.json': JSON.stringify({
      name: appName.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      private: true
    }, null, 2)
  }
}

function generateFilesFromResponse(response: string, message: string) {
  const appName = extractAppName(message)
  
  return [
    {
      name: 'src',
      type: 'folder',
      children: [
        {
          name: 'app',
          type: 'folder',
          children: [
            {
              name: 'page.tsx',
              type: 'file',
              language: 'typescript',
              content: generateAppCode(appName, message)
            },
            {
              name: 'layout.tsx',
              type: 'file',
              language: 'typescript',
              content: `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '${appName}',
  description: 'Generated by AI App Builder',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`
            },
            {
              name: 'globals.css',
              type: 'file',
              language: 'css',
              content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body { font-family: system-ui, sans-serif; }`
            }
          ]
        }
      ]
    },
    {
      name: 'package.json',
      type: 'file',
      language: 'json',
      content: JSON.stringify({
        name: appName.toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        scripts: { dev: 'next dev', build: 'next build' },
        dependencies: { next: '^14.0.0', react: '^18.0.0', 'react-dom': '^18.0.0' }
      }, null, 2)
    },
    {
      name: 'README.md',
      type: 'file',
      language: 'markdown',
      content: `# ${appName}\n\nGenerated by AI App Builder Studio\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`
    }
  ]
}

function generateAppCode(appName: string, message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('todo')) {
    return `'use client'

import { useState } from 'react'

interface Todo {
  id: number
  text: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')

  const addTodo = () => {
    if (!input.trim()) return
    setTodos([...todos, { id: Date.now(), text: input, completed: false, priority }])
    setInput('')
  }

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo))
  }

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">✅ ${appName}</h1>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex gap-2 mb-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              placeholder="Add a new task..."
              className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
              className="p-3 border rounded-lg"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button onClick={addTodo} className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
              Add
            </button>
          </div>

          <div className="space-y-2">
            {todos.map(todo => (
              <div key={todo.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo.id)} className="w-5 h-5" />
                <span className={\`flex-1 \${todo.completed ? 'line-through text-gray-400' : ''}\`}>{todo.text}</span>
                <span className={\`px-2 py-1 rounded text-xs \${priorityColors[todo.priority]}\`}>{todo.priority}</span>
                <button onClick={() => deleteTodo(todo.id)} className="text-red-500">✕</button>
              </div>
            ))}
            {todos.length === 0 && <p className="text-center text-gray-400 py-4">No tasks yet. Add one above!</p>}
          </div>
        </div>
      </div>
    </div>
  )
}`
  }

  if (lowerMessage.includes('notes') || lowerMessage.includes('note')) {
    return `'use client'

import { useState } from 'react'

interface Note {
  id: number
  title: string
  content: string
  createdAt: Date
  color: string
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedColor, setSelectedColor] = useState('#fef3c7')
  const colors = ['#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#f3e8ff']

  const addNote = () => {
    if (!title.trim() && !content.trim()) return
    setNotes([{ id: Date.now(), title, content, createdAt: new Date(), color: selectedColor }, ...notes])
    setTitle('')
    setContent('')
  }

  const deleteNote = (id: number) => setNotes(notes.filter(note => note.id !== id))

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">📝 ${appName}</h1>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title..." className="w-full p-3 text-xl font-semibold border-b" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your note..." className="w-full p-3 min-h-[100px] resize-none" />
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              {colors.map(color => (
                <button key={color} onClick={() => setSelectedColor(color)} className={\`w-6 h-6 rounded-full border-2 \${selectedColor === color ? 'border-gray-400' : 'border-transparent'}\`} style={{ backgroundColor: color }} />
              ))}
            </div>
            <button onClick={addNote} className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">Add Note</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map(note => (
            <div key={note.id} className="p-4 rounded-xl shadow-md relative group" style={{ backgroundColor: note.color }}>
              <button onClick={() => deleteNote(note.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500">✕</button>
              <h3 className="font-semibold text-lg mb-2">{note.title}</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}`
  }

  return `'use client'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">${appName}</h1>
        <p className="text-gray-600">Generated by AI App Builder Studio</p>
      </div>
    </div>
  )
}`
}
