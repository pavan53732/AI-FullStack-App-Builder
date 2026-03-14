/**
 * Dependency Auto-Manager
 * 
 * Automatically detects and installs missing dependencies from:
 * - Import statements in code
 * - Package.json requirements
 * - Framework-specific dependencies
 */

import fs from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')

export interface DependencyInfo {
  name: string
  version?: string
  type: 'production' | 'development'
  installed: boolean
  required: boolean
}

export interface PackageAnalysis {
  hasPackageJson: boolean
  dependencies: DependencyInfo[]
  devDependencies: DependencyInfo[]
  missingDependencies: string[]
  unusedDependencies: string[]
  outdatedDependencies: string[]
  suggestedDependencies: string[]
}

// Common package mappings for auto-detection
const PACKAGE_MAPPINGS: Record<string, string> = {
  // React ecosystem
  'react': 'react',
  'react-dom': 'react-dom',
  'react-router': 'react-router-dom',
  'react-router-dom': 'react-router-dom',
  'useState': 'react',
  'useEffect': 'react',
  'useContext': 'react',
  'useRef': 'react',
  'useMemo': 'react',
  'useCallback': 'react',
  
  // Next.js
  'next/router': 'next',
  'next/link': 'next',
  'next/image': 'next',
  'next/head': 'next',
  'next/navigation': 'next',
  
  // UI Libraries
  '@radix-ui': '@radix-ui/react-slot',
  'lucide-react': 'lucide-react',
  'framer-motion': 'framer-motion',
  'styled-components': 'styled-components',
  '@emotion': '@emotion/react',
  'tailwindcss': 'tailwindcss',
  
  // State Management
  'zustand': 'zustand',
  'jotai': 'jotai',
  'recoil': 'recoil',
  'redux': '@reduxjs/toolkit',
  'createSlice': '@reduxjs/toolkit',
  
  // Data Fetching
  '@tanstack/react-query': '@tanstack/react-query',
  'useQuery': '@tanstack/react-query',
  'useMutation': '@tanstack/react-query',
  'swr': 'swr',
  'axios': 'axios',
  
  // Forms
  'react-hook-form': 'react-hook-form',
  'useForm': 'react-hook-form',
  'zod': 'zod',
  'yup': 'yup',
  
  // Utilities
  'lodash': 'lodash',
  'date-fns': 'date-fns',
  'dayjs': 'dayjs',
  'moment': 'moment',
  'uuid': 'uuid',
  'clsx': 'clsx',
  'cn': 'clsx',
  'class-variance-authority': 'class-variance-authority',
  
  // Icons
  'lucide-react': 'lucide-react',
  'react-icons': 'react-icons',
  '@heroicons': '@heroicons/react',
  
  // Database
  '@prisma/client': '@prisma/client',
  'prisma': 'prisma',
  
  // Validation
  'zod': 'zod',
  'joi': 'joi',
  'yup': 'yup',
  
  // Testing
  '@testing-library/react': '@testing-library/react',
  'vitest': 'vitest',
  'jest': 'jest',
}

// Framework-specific dependencies
const FRAMEWORK_DEPS: Record<string, { deps: string[], devDeps: string[] }> = {
  'react-vite': {
    deps: ['react', 'react-dom'],
    devDeps: ['@types/react', '@types/react-dom', '@vitejs/plugin-react', 'typescript', 'vite']
  },
  'nextjs': {
    deps: ['next', 'react', 'react-dom'],
    devDeps: ['@types/react', '@types/react-dom', '@types/node', 'typescript']
  },
  'express': {
    deps: ['express'],
    devDeps: ['@types/express', 'typescript', 'ts-node']
  },
  'prisma': {
    deps: ['@prisma/client'],
    devDeps: ['prisma']
  },
  'tailwind': {
    deps: [],
    devDeps: ['tailwindcss', 'postcss', 'autoprefixer']
  },
  'shadcn': {
    deps: ['class-variance-authority', 'clsx', 'tailwind-merge', 'lucide-react'],
    devDeps: ['tailwindcss', '@radix-ui/react-slot']
  }
}

/**
 * Detect imports from code content
 */
export function detectImports(content: string): string[] {
  const imports: string[] = []
  
  // ES6 imports
  const es6Pattern = /import\s+(?:[\w*{}\s,]+)\s+from\s+['"]([^'"]+)['"]/g
  let match
  while ((match = es6Pattern.exec(content)) !== null) {
    imports.push(match[1])
  }
  
  // Dynamic imports
  const dynamicPattern = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  while ((match = dynamicPattern.exec(content)) !== null) {
    imports.push(match[1])
  }
  
  // CommonJS requires
  const requirePattern = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  while ((match = requirePattern.exec(content)) !== null) {
    imports.push(match[1])
  }
  
  return [...new Set(imports)]
}

/**
 * Resolve import to package name
 */
export function resolvePackageName(importPath: string): string | null {
  // Skip relative imports
  if (importPath.startsWith('.') || importPath.startsWith('/')) {
    return null
  }
  
  // Check direct mappings first
  if (PACKAGE_MAPPINGS[importPath]) {
    return PACKAGE_MAPPINGS[importPath]
  }
  
  // Scoped packages (@org/package)
  if (importPath.startsWith('@')) {
    const parts = importPath.split('/')
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : importPath
  }
  
  // Regular packages - take first segment
  const firstSegment = importPath.split('/')[0]
  
  // Check if it's a mapped keyword
  if (PACKAGE_MAPPINGS[firstSegment]) {
    return PACKAGE_MAPPINGS[firstSegment]
  }
  
  return firstSegment
}

/**
 * Read package.json from project
 */
async function readPackageJson(projectPath: string): Promise<{
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
} | null> {
  try {
    const pkgPath = path.join(WORKSPACE_DIR, projectPath, 'package.json')
    const content = await fs.readFile(pkgPath, 'utf-8')
    const pkg = JSON.parse(content)
    
    return {
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {}
    }
  } catch {
    return null
  }
}

/**
 * Analyze project dependencies
 */
export async function analyzeDependencies(projectPath: string): Promise<PackageAnalysis> {
  const analysis: PackageAnalysis = {
    hasPackageJson: false,
    dependencies: [],
    devDependencies: [],
    missingDependencies: [],
    unusedDependencies: [],
    outdatedDependencies: [],
    suggestedDependencies: []
  }
  
  // Read package.json
  const pkg = await readPackageJson(projectPath)
  if (!pkg) {
    return analysis
  }
  
  analysis.hasPackageJson = true
  
  // List installed dependencies
  for (const [name, version] of Object.entries(pkg.dependencies)) {
    analysis.dependencies.push({
      name,
      version,
      type: 'production',
      installed: true,
      required: false
    })
  }
  
  for (const [name, version] of Object.entries(pkg.devDependencies)) {
    analysis.devDependencies.push({
      name,
      version,
      type: 'development',
      installed: true,
      required: false
    })
  }
  
  // Scan all source files to detect required imports
  const requiredPackages = new Set<string>()
  const projectDir = path.join(WORKSPACE_DIR, projectPath)
  
  try {
    const files = await scanSourceFiles(projectDir)
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8')
      const imports = detectImports(content)
      
      for (const imp of imports) {
        const pkgName = resolvePackageName(imp)
        if (pkgName) {
          requiredPackages.add(pkgName)
        }
      }
    }
  } catch {}
  
  // Check for missing dependencies
  const installedNames = new Set([
    ...Object.keys(pkg.dependencies),
    ...Object.keys(pkg.devDependencies)
  ])
  
  for (const required of requiredPackages) {
    if (!installedNames.has(required)) {
      analysis.missingDependencies.push(required)
    }
  }
  
  // Check for unused dependencies (basic check)
  for (const installed of installedNames) {
    // Skip common packages that might not have obvious imports
    const alwaysUsed = ['typescript', 'vite', 'next', 'tailwindcss', 'autoprefixer', 'postcss']
    if (alwaysUsed.includes(installed)) continue
    
    if (!requiredPackages.has(installed)) {
      analysis.unusedDependencies.push(installed)
    }
  }
  
  // Suggest framework-specific dependencies
  const suggestions = suggestDependencies(analysis, requiredPackages)
  analysis.suggestedDependencies = suggestions
  
  return analysis
}

/**
 * Scan source files recursively
 */
async function scanSourceFiles(dir: string): Promise<string[]> {
  const files: string[] = []
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        files.push(...await scanSourceFiles(fullPath))
      } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        files.push(fullPath)
      }
    }
  } catch {}
  
  return files
}

/**
 * Suggest dependencies based on code patterns
 */
function suggestDependencies(
  analysis: PackageAnalysis,
  requiredPackages: Set<string>
): string[] {
  const suggestions: string[] = []
  
  // Check for React without types
  if (requiredPackages.has('react') && !hasDep(analysis, '@types/react')) {
    suggestions.push('@types/react')
  }
  
  // Check for Tailwind usage without the package
  // (detected by class names like className, tw, etc.)
  
  // Check for async patterns without data fetching lib
  // Could suggest react-query or swr
  
  return suggestions
}

function hasDep(analysis: PackageAnalysis, name: string): boolean {
  return analysis.dependencies.some(d => d.name === name) ||
         analysis.devDependencies.some(d => d.name === name)
}

/**
 * Install missing dependencies
 */
export async function installDependencies(
  projectPath: string,
  packages: string[],
  isDev = false
): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const cwd = path.join(WORKSPACE_DIR, projectPath)
    const flags = isDev ? '-D' : ''
    const command = `bun add ${flags} ${packages.join(' ')}`
    
    const child = spawn(command, [], {
      cwd,
      shell: true,
      env: { ...process.env, NODE_ENV: 'development' }
    })
    
    let output = ''
    
    child.stdout?.on('data', (data) => {
      output += data.toString()
    })
    
    child.stderr?.on('data', (data) => {
      output += data.toString()
    })
    
    const timeout = setTimeout(() => {
      child.kill()
      resolve({ success: false, output: output + '\nTimeout' })
    }, 120000)
    
    child.on('close', (code) => {
      clearTimeout(timeout)
      resolve({
        success: code === 0,
        output
      })
    })
    
    child.on('error', (err) => {
      clearTimeout(timeout)
      resolve({ success: false, output: err.message })
    })
  })
}

/**
 * Auto-install all missing dependencies
 */
export async function autoInstallMissing(projectPath: string): Promise<{
  installed: string[]
  failed: string[]
  output: string
}> {
  const analysis = await analyzeDependencies(projectPath)
  const result = {
    installed: [] as string[],
    failed: [] as string[],
    output: ''
  }
  
  if (analysis.missingDependencies.length === 0) {
    result.output = 'No missing dependencies found'
    return result
  }
  
  // Install production dependencies
  const prodDeps = analysis.missingDependencies.filter(pkg => {
    const devOnly = ['@types/', 'typescript', 'vite', 'tailwindcss', 'eslint', 'prettier']
    return !devOnly.some(d => pkg.startsWith(d) || pkg === d)
  })
  
  if (prodDeps.length > 0) {
    const res = await installDependencies(projectPath, prodDeps, false)
    result.output += res.output
    
    if (res.success) {
      result.installed.push(...prodDeps)
    } else {
      result.failed.push(...prodDeps)
    }
  }
  
  // Install dev dependencies
  const devDeps = analysis.missingDependencies.filter(pkg => !prodDeps.includes(pkg))
  
  if (devDeps.length > 0) {
    const res = await installDependencies(projectPath, devDeps, true)
    result.output += '\n' + res.output
    
    if (res.success) {
      result.installed.push(...devDeps)
    } else {
      result.failed.push(...devDeps)
    }
  }
  
  return result
}

/**
 * Detect framework from project
 */
export async function detectFramework(projectPath: string): Promise<string[]> {
  const pkg = await readPackageJson(projectPath)
  if (!pkg) return []
  
  const frameworks: string[] = []
  const allDeps = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.devDependencies)]
  
  if (allDeps.includes('next')) frameworks.push('nextjs')
  if (allDeps.includes('vite')) frameworks.push('vite')
  if (allDeps.includes('react')) frameworks.push('react')
  if (allDeps.includes('vue')) frameworks.push('vue')
  if (allDeps.includes('svelte')) frameworks.push('svelte')
  if (allDeps.includes('express')) frameworks.push('express')
  if (allDeps.includes('tailwindcss')) frameworks.push('tailwind')
  if (allDeps.includes('@prisma/client')) frameworks.push('prisma')
  
  return frameworks
}

/**
 * Get suggested starter dependencies for a framework
 */
export function getStarterDeps(framework: string): { deps: string[], devDeps: string[] } {
  return FRAMEWORK_DEPS[framework] || { deps: [], devDeps: [] }
}
