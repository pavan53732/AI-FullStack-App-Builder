import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')

// Ensure workspace exists
async function ensureWorkspace() {
  try {
    await fs.access(WORKSPACE_DIR)
  } catch {
    await fs.mkdir(WORKSPACE_DIR, { recursive: true })
  }
}

// GET - List files/folders or read file content
export async function GET(request: NextRequest) {
  try {
    await ensureWorkspace()
    
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'
    const targetPath = searchParams.get('path') || ''
    
    const fullPath = path.join(WORKSPACE_DIR, targetPath)
    
    // Security: Prevent path traversal
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    switch (action) {
      case 'list': {
        const entries = await fs.readdir(fullPath, { withFileTypes: true })
        const items = await Promise.all(entries.map(async (entry) => {
          const itemPath = path.join(fullPath, entry.name)
          const stats = await fs.stat(itemPath)
          return {
            name: entry.name,
            type: entry.isDirectory() ? 'folder' : 'file',
            size: stats.size,
            modified: stats.mtime,
            path: path.relative(WORKSPACE_DIR, itemPath)
          }
        }))
        return NextResponse.json({ success: true, items, path: targetPath })
      }
      
      case 'read': {
        const content = await fs.readFile(fullPath, 'utf-8')
        return NextResponse.json({ success: true, content, path: targetPath })
      }
      
      case 'exists': {
        try {
          await fs.access(fullPath)
          return NextResponse.json({ success: true, exists: true })
        } catch {
          return NextResponse.json({ success: true, exists: false })
        }
      }
      
      case 'tree': {
        const buildTree = async (dir: string, depth = 0): Promise<any[]> => {
          if (depth > 10) return []
          const entries = await fs.readdir(dir, { withFileTypes: true })
          const tree = await Promise.all(entries.map(async (entry) => {
            const itemPath = path.join(dir, entry.name)
            if (entry.isDirectory()) {
              return {
                name: entry.name,
                type: 'folder',
                children: await buildTree(itemPath, depth + 1)
              }
            } else {
              return { name: entry.name, type: 'file' }
            }
          }))
          return tree
        }
        const tree = await buildTree(fullPath)
        return NextResponse.json({ success: true, tree })
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create file or folder
export async function POST(request: NextRequest) {
  try {
    await ensureWorkspace()
    
    const body = await request.json()
    const { action, path: relativePath, content, type = 'file' } = body
    
    const fullPath = path.join(WORKSPACE_DIR, relativePath)
    
    // Security: Prevent path traversal
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    switch (action) {
      case 'create': {
        if (type === 'folder') {
          await fs.mkdir(fullPath, { recursive: true })
          return NextResponse.json({ success: true, message: `Folder created: ${relativePath}` })
        } else {
          // Ensure parent directory exists
          await fs.mkdir(path.dirname(fullPath), { recursive: true })
          await fs.writeFile(fullPath, content || '', 'utf-8')
          return NextResponse.json({ success: true, message: `File created: ${relativePath}` })
        }
      }
      
      case 'write': {
        await fs.mkdir(path.dirname(fullPath), { recursive: true })
        await fs.writeFile(fullPath, content || '', 'utf-8')
        return NextResponse.json({ success: true, message: `File written: ${relativePath}` })
      }
      
      case 'mkdir': {
        await fs.mkdir(fullPath, { recursive: true })
        return NextResponse.json({ success: true, message: `Directory created: ${relativePath}` })
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update/rename file or folder
export async function PUT(request: NextRequest) {
  try {
    await ensureWorkspace()
    
    const body = await request.json()
    const { action, path: relativePath, content, newPath } = body
    
    const fullPath = path.join(WORKSPACE_DIR, relativePath)
    
    // Security: Prevent path traversal
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    switch (action) {
      case 'update': {
        await fs.writeFile(fullPath, content, 'utf-8')
        return NextResponse.json({ success: true, message: `File updated: ${relativePath}` })
      }
      
      case 'rename': {
        const newFullPath = path.join(WORKSPACE_DIR, newPath)
        if (!newFullPath.startsWith(WORKSPACE_DIR)) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
        await fs.rename(fullPath, newFullPath)
        return NextResponse.json({ success: true, message: `Renamed to: ${newPath}` })
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete file or folder
export async function DELETE(request: NextRequest) {
  try {
    await ensureWorkspace()
    
    const { searchParams } = new URL(request.url)
    const relativePath = searchParams.get('path')
    
    if (!relativePath) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 })
    }
    
    const fullPath = path.join(WORKSPACE_DIR, relativePath)
    
    // Security: Prevent path traversal
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Check if exists and get stats
    const stats = await fs.stat(fullPath)
    
    if (stats.isDirectory()) {
      await fs.rm(fullPath, { recursive: true })
      return NextResponse.json({ success: true, message: `Folder deleted: ${relativePath}` })
    } else {
      await fs.unlink(fullPath)
      return NextResponse.json({ success: true, message: `File deleted: ${relativePath}` })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
