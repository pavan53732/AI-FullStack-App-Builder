/**
 * RAG (Retrieval Augmented Generation) System
 * 
 * Provides grounding for AI to prevent hallucinations:
 * - Document knowledge base
 * - Code pattern library
 * - API documentation retrieval
 * - Best practices database
 * - Context-aware retrieval
 */

import fs from 'fs/promises'
import path from 'path'
import ZAI from 'z-ai-web-dev-sdk'

const KNOWLEDGE_DIR = path.join(process.cwd(), 'data', 'knowledge')

export interface KnowledgeDocument {
  id: string
  title: string
  content: string
  type: 'docs' | 'pattern' | 'api' | 'best-practice' | 'error-solution' | 'template'
  tags: string[]
  source?: string
  embedding?: number[]
  createdAt: string
  updatedAt: string
}

export interface RetrievedContext {
  documents: KnowledgeDocument[]
  query: string
  totalFound: number
  retrievalTime: number
}

export interface RAGResponse {
  answer: string
  sources: Array<{
    title: string
    snippet: string
    relevance: number
  }>
  confidence: number
}

// Framework knowledge base
const FRAMEWORK_DOCS: Record<string, string[]> = {
  react: [
    `React hooks must be called at the top level of a component. Never call hooks inside loops, conditions, or nested functions.`,
    `useEffect cleanup function runs before the component unmounts and before every re-render if dependencies change.`,
    `useState can be initialized with a function for lazy initialization: useState(() => computeExpensiveValue())`,
    `React keys should be stable and unique. Don't use array index as key if the list can reorder.`,
    `React.memo only does shallow comparison. Use useMemo for expensive computations.`,
    `Always return cleanup function from useEffect to prevent memory leaks.`,
    `Use useCallback for functions passed as props to prevent unnecessary re-renders.`,
    `React 18 automatic batching applies to updates in promises, setTimeout, and native events.`,
    `Suspense boundaries catch errors in data fetching and code splitting.`,
    `Server Components in React can directly access backend resources.`
  ],
  nextjs: [
    `Next.js App Router uses server components by default. Add 'use client' for client-side interactivity.`,
    `useSearchParams requires Suspense boundary in App Router.`,
    `Dynamic routes use [slug] syntax. Catch-all routes use [...slug].`,
    `getServerSideProps in Pages Router runs on every request. getStaticProps runs at build time.`,
    `API routes in App Router use Route Handlers (route.ts) with standard Request/Response.`,
    `Middleware runs before requests. It can rewrite, redirect, or set headers.`,
    `Image component automatically optimizes images. Use priority for above-fold images.`,
    `Font optimization with next/font eliminates external network requests.`,
    `usePathname gets current path, useSearchParams gets query params, useRouter for navigation.`,
    `Server Actions can be called directly from forms without creating API routes.`
  ],
  typescript: [
    `Use strict mode in tsconfig.json for maximum type safety.`,
    `Prefer interfaces for object shapes, types for unions and primitives.`,
    `Generic constraints: <T extends SomeType> ensures T has required properties.`,
    `Use unknown instead of any for values with unknown type. Type narrow before use.`,
    `Utility types: Partial<T>, Required<T>, Pick<T, K>, Omit<T, K>, Record<K, V>`,
    `Discriminated unions provide exhaustive type checking with switch statements.`,
    `Template literal types: type Color = \`#\${string}\` for pattern matching.`,
    `Infer keyword extracts types from generic parameters conditionally.`,
    `Const assertions: as const makes arrays readonly and literals their exact type.`,
    `Satisfies operator ensures expression matches type while preserving literal types.`
  ],
  nodejs: [
    `Always handle errors in async/await with try-catch or .catch()`,
    `Use process.exit() sparingly. Let the event loop empty naturally when possible.`,
    `Cluster module enables multi-core utilization for CPU-intensive tasks.`,
    `Stream.pipeline() handles errors and cleanup automatically unlike pipe().`,
    `Worker threads are for CPU-intensive tasks, child_process for external commands.`,
    `Use async local storage for request context without passing parameters.`,
    `Set keepAlive for long-running connections. Destroy sockets on errors.`,
    `Use fs.promises for async file operations, avoid sync methods in servers.`,
    `Environment variables should be validated on startup, not during requests.`,
    `Use pino or winston for structured logging. Console.log is blocking.`
  ],
  database: [
    `Always use parameterized queries to prevent SQL injection.`,
    `Index columns used in WHERE, JOIN, and ORDER BY clauses.`,
    `Use connection pooling for database connections in production.`,
    `Implement soft deletes for data that may need recovery.`,
    `Use transactions for operations that must succeed or fail together.`,
    `Monitor slow queries and optimize with EXPLAIN ANALYZE.`,
    `Set appropriate isolation levels based on consistency requirements.`,
    `Use database migrations for schema changes, never manual DDL.`,
    `Implement read replicas for scaling read-heavy applications.`,
    `Use batch inserts/updates for bulk operations.`
  ],
  security: [
    `Never trust user input. Validate, sanitize, and escape all inputs.`,
    `Use parameterized queries instead of string concatenation for database queries.`,
    `Store passwords using bcrypt, scrypt, or argon2 - never plain text or weak hashes.`,
    `Implement rate limiting to prevent brute force and DoS attacks.`,
    `Use HTTPS everywhere. Redirect HTTP to HTTPS.`,
    `Set secure cookie flags: HttpOnly, Secure, SameSite=Strict`,
    `Implement CORS properly - never use origin: "*" in production.`,
    `Use JWT with short expiration and refresh tokens, not long-lived tokens.`,
    `Implement Content Security Policy (CSP) headers to prevent XSS.`,
    `Never expose stack traces or internal errors to users.`
  ]
}

// Common error patterns and solutions
const ERROR_SOLUTIONS: Record<string, { pattern: RegExp; solution: string }> = {
  'MODULE_NOT_FOUND': {
    pattern: /Cannot find module ['"](.+?)['"]/,
    solution: 'Install the missing package: npm install {package}'
  },
  'TYPE_ERROR': {
    pattern: /TypeError: (.+?) is not a function/,
    solution: 'Check if the object is properly initialized and the method exists.'
  },
  'NULL_POINTER': {
    pattern: /Cannot read properties of (null|undefined)/,
    solution: 'Add null check before accessing property: obj?.prop or if (obj) {...}'
  },
  'SYNTAX_ERROR': {
    pattern: /SyntaxError: Unexpected token/,
    solution: 'Check for missing brackets, parentheses, or invalid syntax near the error location.'
  },
  'IMPORT_ERROR': {
    pattern: /SyntaxError: Cannot use import statement outside a module/,
    solution: 'Add "type": "module" to package.json or use .mjs extension.'
  },
  'ASYNC_AWAIT': {
    pattern: /await is only valid in async function/,
    solution: 'Add async keyword before the function definition.'
  },
  'RENDER_ERROR': {
    pattern: /Objects are not valid as a React child/,
    solution: 'Render primitive values or use JSON.stringify() for debugging.'
  },
  'HOOKS_ERROR': {
    pattern: /Rendered more hooks than during the previous render/,
    solution: 'Ensure hooks are called unconditionally at the top level of the component.'
  }
}

/**
 * Initialize knowledge base
 */
export async function initializeKnowledgeBase(): Promise<void> {
  await fs.mkdir(KNOWLEDGE_DIR, { recursive: true })
  
  // Write framework docs
  for (const [framework, docs] of Object.entries(FRAMEWORK_DOCS)) {
    const docPath = path.join(KNOWLEDGE_DIR, 'frameworks', `${framework}.json`)
    await fs.mkdir(path.dirname(docPath), { recursive: true })
    
    const document: KnowledgeDocument = {
      id: `framework-${framework}`,
      title: `${framework.toUpperCase()} Best Practices`,
      content: docs.join('\n\n'),
      type: 'best-practice',
      tags: [framework, 'framework', 'best-practices'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await fs.writeFile(docPath, JSON.stringify(document, null, 2))
  }
}

/**
 * Add document to knowledge base
 */
export async function addDocument(doc: Omit<KnowledgeDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeDocument> {
  const id = `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
  
  const document: KnowledgeDocument = {
    ...doc,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  const docPath = path.join(KNOWLEDGE_DIR, `${doc.type}s`, `${id}.json`)
  await fs.mkdir(path.dirname(docPath), { recursive: true })
  await fs.writeFile(docPath, JSON.stringify(document, null, 2))
  
  return document
}

/**
 * Search knowledge base
 */
export async function searchKnowledge(
  query: string,
  options: {
    type?: KnowledgeDocument['type']
    tags?: string[]
    limit?: number
  } = {}
): Promise<RetrievedContext> {
  const startTime = Date.now()
  const limit = options.limit || 5
  const results: KnowledgeDocument[] = []
  
  // Search framework docs
  const frameworkMatch = Object.keys(FRAMEWORK_DOCS).find(f => 
    query.toLowerCase().includes(f)
  )
  
  if (frameworkMatch) {
    const docs = FRAMEWORK_DOCS[frameworkMatch]
    const relevantDocs = docs.filter(doc => 
      doc.toLowerCase().includes(query.toLowerCase().split(' ')[0])
    ).slice(0, limit)
    
    if (relevantDocs.length > 0) {
      results.push({
        id: `framework-${frameworkMatch}`,
        title: `${frameworkMatch.toUpperCase()} Context`,
        content: relevantDocs.join('\n\n'),
        type: 'best-practice',
        tags: [frameworkMatch],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
  }
  
  // Search custom documents
  try {
    const dirs = ['docs', 'patterns', 'apis', 'best-practices', 'error-solutions', 'templates']
    
    for (const dir of dirs) {
      if (options.type && dir !== `${options.type}s`) continue
      
      const dirPath = path.join(KNOWLEDGE_DIR, dir)
      
      try {
        const files = await fs.readdir(dirPath)
        
        for (const file of files) {
          if (!file.endsWith('.json')) continue
          
          try {
            const content = await fs.readFile(path.join(dirPath, file), 'utf-8')
            const doc: KnowledgeDocument = JSON.parse(content)
            
            // Check tags
            if (options.tags && !options.tags.some(t => doc.tags.includes(t))) continue
            
            // Simple relevance check
            const queryTerms = query.toLowerCase().split(/\s+/)
            const contentLower = doc.content.toLowerCase()
            const titleLower = doc.title.toLowerCase()
            
            const relevance = queryTerms.reduce((score, term) => {
              if (titleLower.includes(term)) return score + 2
              if (contentLower.includes(term)) return score + 1
              return score
            }, 0)
            
            if (relevance > 0) {
              results.push({ ...doc, _relevance: relevance } as any)
            }
          } catch {}
        }
      } catch {}
    }
  } catch {}
  
  // Sort by relevance
  results.sort((a: any, b: any) => (b._relevance || 0) - (a._relevance || 0))
  
  return {
    documents: results.slice(0, limit),
    query,
    totalFound: results.length,
    retrievalTime: Date.now() - startTime
  }
}

/**
 * Find solution for error
 */
export function findErrorSolution(errorMessage: string): {
  errorType: string
  solution: string
  match: string | null
} | null {
  for (const [errorType, config] of Object.entries(ERROR_SOLUTIONS)) {
    const match = errorMessage.match(config.pattern)
    if (match) {
      let solution = config.solution
      if (match[1]) {
        solution = solution.replace('{package}', match[1])
      }
      return {
        errorType,
        solution,
        match: match[0]
      }
    }
  }
  return null
}

/**
 * Get relevant patterns for a task
 */
export function getPatternsForTask(task: string): string[] {
  const patterns: string[] = []
  const taskLower = task.toLowerCase()
  
  if (taskLower.includes('auth') || taskLower.includes('login')) {
    patterns.push(
      'Use bcrypt for password hashing with salt rounds >= 12',
      'Implement JWT with short expiration (15-30 min) and refresh tokens',
      'Store tokens in httpOnly cookies, not localStorage',
      'Rate limit login attempts to prevent brute force'
    )
  }
  
  if (taskLower.includes('api') || taskLower.includes('rest')) {
    patterns.push(
      'Use proper HTTP methods: GET (read), POST (create), PUT (replace), PATCH (update), DELETE (remove)',
      'Return appropriate status codes: 200, 201, 400, 401, 403, 404, 500',
      'Validate input with schemas before processing',
      'Implement pagination for list endpoints'
    )
  }
  
  if (taskLower.includes('database') || taskLower.includes('db')) {
    patterns.push(
      'Use Prisma or Drizzle for type-safe database access',
      'Implement migrations for schema changes',
      'Use transactions for multi-step operations',
      'Add indexes for frequently queried columns'
    )
  }
  
  if (taskLower.includes('form')) {
    patterns.push(
      'Validate on both client and server side',
      'Use Zod or Yup for schema validation',
      'Show inline validation errors',
      'Disable submit button during submission'
    )
  }
  
  if (taskLower.includes('real-time') || taskLower.includes('websocket')) {
    patterns.push(
      'Use Socket.io for WebSocket with fallback to polling',
      'Implement reconnection logic with exponential backoff',
      'Handle connection authentication securely',
      'Use rooms for targeted message broadcasting'
    )
  }
  
  return patterns
}

/**
 * RAG-augmented prompt generation
 */
export async function generateAugmentedPrompt(
  basePrompt: string,
  context: {
    projectType?: string
    framework?: string
    taskDescription: string
    currentCode?: string
    error?: string
  }
): Promise<string> {
  // Retrieve relevant knowledge
  const knowledgeResults = await searchKnowledge(context.taskDescription, {
    type: 'best-practice',
    limit: 3
  })
  
  // Get patterns for task
  const patterns = getPatternsForTask(context.taskDescription)
  
  // Find error solution if error exists
  let errorSolution = ''
  if (context.error) {
    const solution = findErrorSolution(context.error)
    if (solution) {
      errorSolution = `\n## Error Solution\nThe error "${solution.match}" suggests: ${solution.solution}`
    }
  }
  
  // Build augmented prompt
  const sections: string[] = [
    basePrompt,
    '',
    '## Relevant Context (RAG)',
    ''
  ]
  
  if (knowledgeResults.documents.length > 0) {
    sections.push('### Knowledge Base')
    for (const doc of knowledgeResults.documents) {
      sections.push(`**${doc.title}**:`, doc.content.slice(0, 500))
    }
    sections.push('')
  }
  
  if (patterns.length > 0) {
    sections.push('### Applicable Patterns')
    patterns.forEach(p => sections.push(`- ${p}`))
    sections.push('')
  }
  
  if (errorSolution) {
    sections.push(errorSolution)
  }
  
  if (context.currentCode) {
    sections.push('', '## Current Code Context', '```', context.currentCode.slice(0, 2000), '```')
  }
  
  return sections.join('\n')
}

/**
 * Validate AI output against known patterns
 */
export function validateOutput(output: string): {
  valid: boolean
  issues: string[]
  suggestions: string[]
} {
  const issues: string[] = []
  const suggestions: string[] = []
  
  // Check for common anti-patterns
  if (output.includes('eval(') && !output.includes('eval() is dangerous')) {
    issues.push('Uses eval() which can lead to code injection')
    suggestions.push('Replace eval() with safer alternatives like JSON.parse() or Function constructor')
  }
  
  if (output.includes('innerHTML') && !output.includes('sanitize')) {
    issues.push('Uses innerHTML without sanitization')
    suggestions.push('Sanitize HTML content or use textContent instead')
  }
  
  if (output.includes('password') && output.includes('= "') && !output.includes('process.env')) {
    issues.push('May contain hardcoded password')
    suggestions.push('Use environment variables for sensitive data')
  }
  
  if (output.includes('SELECT *') && output.includes('+')) {
    issues.push('Potential SQL injection vulnerability')
    suggestions.push('Use parameterized queries instead of string concatenation')
  }
  
  if (output.includes('cors({ origin: "*"')) {
    issues.push('CORS allows all origins')
    suggestions.push('Restrict CORS to trusted domains')
  }
  
  return {
    valid: issues.length === 0,
    issues,
    suggestions
  }
}

/**
 * Get documentation for a specific library/framework
 */
export function getLibraryDocs(library: string): string {
  const docs: Record<string, string> = {
    'react': 'https://react.dev/reference/react',
    'next': 'https://nextjs.org/docs',
    'prisma': 'https://www.prisma.io/docs/reference',
    'tailwind': 'https://tailwindcss.com/docs',
    'typescript': 'https://www.typescriptlang.org/docs/',
    'zod': 'https://zod.dev/',
    'trpc': 'https://trpc.io/docs/',
    'shadcn': 'https://ui.shadcn.com/docs'
  }
  
  return docs[library.toLowerCase()] || `No documentation URL for ${library}`
}
