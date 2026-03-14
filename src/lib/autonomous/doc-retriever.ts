/**
 * Documentation Retriever
 * 
 * Retrieves relevant documentation from multiple sources:
 * - Library/Framework documentation
 * - API references
 * - Code examples
 * - Best practices
 * - Pattern libraries
 */

import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs/promises'
import path from 'path'

// Types
export interface DocumentationSource {
  id: string
  name: string
  type: 'library' | 'framework' | 'api' | 'pattern' | 'best-practice'
  baseUrl?: string
  localPath?: string
  priority: number
  enabled: boolean
}

export interface RetrievedDocument {
  id: string
  source: string
  title: string
  content: string
  url?: string
  relevanceScore: number
  tags: string[]
  lastUpdated: string
  metadata?: Record<string, any>
}

export interface RetrievalQuery {
  query: string
  context?: string
  technologies?: string[]
  maxResults?: number
  minRelevance?: number
  sources?: string[]
  types?: DocumentationSource['type'][]
}

export interface RetrievalResult {
  documents: RetrievedDocument[]
  totalFound: number
  query: string
  expandedQuery?: string
  suggestions: string[]
}

export interface DocumentationCache {
  documents: Map<string, RetrievedDocument>
  lastRefresh: string
  hits: number
  misses: number
}

// Built-in documentation sources
const DEFAULT_SOURCES: DocumentationSource[] = [
  {
    id: 'react',
    name: 'React Documentation',
    type: 'library',
    baseUrl: 'https://react.dev',
    priority: 10,
    enabled: true
  },
  {
    id: 'nextjs',
    name: 'Next.js Documentation',
    type: 'framework',
    baseUrl: 'https://nextjs.org/docs',
    priority: 10,
    enabled: true
  },
  {
    id: 'typescript',
    name: 'TypeScript Handbook',
    type: 'language',
    priority: 9,
    enabled: true
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    type: 'framework',
    baseUrl: 'https://tailwindcss.com/docs',
    priority: 8,
    enabled: true
  },
  {
    id: 'prisma',
    name: 'Prisma Documentation',
    type: 'library',
    baseUrl: 'https://www.prisma.io/docs',
    priority: 7,
    enabled: true
  },
  {
    id: 'shadcn',
    name: 'shadcn/ui',
    type: 'library',
    baseUrl: 'https://ui.shadcn.com/docs',
    priority: 8,
    enabled: true
  },
  {
    id: 'mdn',
    name: 'MDN Web Docs',
    type: 'api',
    baseUrl: 'https://developer.mozilla.org',
    priority: 7,
    enabled: true
  },
  {
    id: 'nodejs',
    name: 'Node.js Documentation',
    type: 'api',
    baseUrl: 'https://nodejs.org/docs',
    priority: 6,
    enabled: true
  }
]

// Common patterns and examples database
const PATTERN_DATABASE: Map<string, RetrievedDocument> = new Map([
  ['react-component', {
    id: 'pattern-react-component',
    source: 'patterns',
    title: 'React Functional Component Pattern',
    content: `
// React Functional Component Pattern
import { useState, useEffect } from 'react'

interface Props {
  title: string
  initialCount?: number
  onCountChange?: (count: number) => void
}

export function Component({ title, initialCount = 0, onCountChange }: Props) {
  const [count, setCount] = useState(initialCount)
  
  useEffect(() => {
    // Side effect on mount
    return () => {
      // Cleanup on unmount
    }
  }, [])
  
  const handleIncrement = () => {
    setCount(prev => {
      const newCount = prev + 1
      onCountChange?.(newCount)
      return newCount
    })
  }
  
  return (
    <div>
      <h1>{title}</h1>
      <p>Count: {count}</p>
      <button onClick={handleIncrement}>Increment</button>
    </div>
  )
}
`,
    relevanceScore: 1,
    tags: ['react', 'component', 'hooks', 'typescript'],
    lastUpdated: new Date().toISOString()
  }],
  ['nextjs-api-route', {
    id: 'pattern-nextjs-api',
    source: 'patterns',
    title: 'Next.js API Route Pattern',
    content: `
// Next.js App Router API Route
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email()
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    // Fetch data
    const data = { id, message: 'Hello' }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = schema.parse(body)
    
    // Process data
    return NextResponse.json({ success: true, data: validated })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Validation Error' },
      { status: 400 }
    )
  }
}
`,
    relevanceScore: 1,
    tags: ['nextjs', 'api', 'route', 'typescript'],
    lastUpdated: new Date().toISOString()
  }],
  ['prisma-crud', {
    id: 'pattern-prisma-crud',
    source: 'patterns',
    title: 'Prisma CRUD Operations',
    content: `
// Prisma CRUD Operations Pattern
import { db } from '@/lib/db'

// Create
async function createRecord(data: any) {
  return await db.model.create({
    data: {
      name: data.name,
      email: data.email,
      // ... other fields
    }
  })
}

// Read
async function getRecord(id: string) {
  return await db.model.findUnique({
    where: { id },
    include: { related: true }
  })
}

// Update
async function updateRecord(id: string, data: any) {
  return await db.model.update({
    where: { id },
    data: {
      name: data.name,
      // ... other fields
    }
  })
}

// Delete
async function deleteRecord(id: string) {
  return await db.model.delete({
    where: { id }
  })
}

// List with pagination
async function listRecords(page = 1, limit = 10) {
  const skip = (page - 1) * limit
  
  const [records, total] = await Promise.all([
    db.model.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    db.model.count()
  ])
  
  return {
    records,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}
`,
    relevanceScore: 1,
    tags: ['prisma', 'database', 'crud', 'typescript'],
    lastUpdated: new Date().toISOString()
  }],
  ['tailwind-component', {
    id: 'pattern-tailwind-component',
    source: 'patterns',
    title: 'Tailwind CSS Component Styling',
    content: `
// Tailwind CSS Component Styling Pattern
// Using shadcn/ui with Tailwind CSS

// Card Component
<div className="rounded-lg border bg-card p-6 shadow-sm">
  <h3 className="text-lg font-semibold">Title</h3>
  <p className="text-sm text-muted-foreground">Description text</p>
</div>

// Button Variants
<button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
  Primary Button
</button>

<button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
  Secondary Button
</button>

// Form Input
<input 
  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  placeholder="Enter text..."
/>

// Responsive Grid
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {/* Items */}
</div>

// Flex Layout
<div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
  {/* Items */}
</div>
`,
    relevanceScore: 1,
    tags: ['tailwind', 'css', 'styling', 'responsive'],
    lastUpdated: new Date().toISOString()
  }]
])

/**
 * Documentation Retriever
 */
export class DocumentationRetriever {
  private zai: any = null
  private sources: Map<string, DocumentationSource> = new Map()
  private cache: DocumentationCache = {
    documents: new Map(),
    lastRefresh: new Date().toISOString(),
    hits: 0,
    misses: 0
  }

  constructor(customSources?: DocumentationSource[]) {
    // Initialize with default sources
    for (const source of DEFAULT_SOURCES) {
      this.sources.set(source.id, source)
    }

    // Add custom sources
    if (customSources) {
      for (const source of customSources) {
        this.sources.set(source.id, source)
      }
    }

    // Initialize pattern database in cache
    for (const [key, doc] of PATTERN_DATABASE) {
      this.cache.documents.set(key, doc)
    }
  }

  /**
   * Initialize AI
   */
  async init(): Promise<void> {
    if (!this.zai) {
      this.zai = await ZAI.create()
    }
  }

  /**
   * Retrieve relevant documentation
   */
  async retrieve(query: RetrievalQuery): Promise<RetrievalResult> {
    await this.init()

    const maxResults = query.maxResults || 10
    const minRelevance = query.minRelevance || 0.3

    // Expand query with synonyms and related terms
    const expandedQuery = await this.expandQuery(query.query)

    // Search patterns first
    const patternResults = this.searchPatterns(expandedQuery, query)

    // Search documentation sources
    const sourceResults = await this.searchSources(expandedQuery, query)

    // Combine and rank results
    const allResults = [...patternResults, ...sourceResults]
      .filter(doc => doc.relevanceScore >= minRelevance)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults)

    // Generate suggestions for further exploration
    const suggestions = await this.generateSuggestions(query.query, allResults)

    return {
      documents: allResults,
      totalFound: allResults.length,
      query: query.query,
      expandedQuery,
      suggestions
    }
  }

  /**
   * Expand query with related terms
   */
  private async expandQuery(query: string): Promise<string> {
    // Simple expansion based on common patterns
    const expansions: Record<string, string[]> = {
      'component': ['react', 'jsx', 'tsx', 'props', 'state'],
      'api': ['route', 'endpoint', 'request', 'response', 'http'],
      'database': ['prisma', 'schema', 'model', 'query', 'migration'],
      'style': ['css', 'tailwind', 'className', 'responsive'],
      'form': ['input', 'validation', 'submit', 'zod'],
      'auth': ['login', 'session', 'token', 'nextauth'],
      'test': ['jest', 'vitest', 'unit', 'integration']
    }

    const keywords = query.toLowerCase().split(' ')
    const expanded = [...keywords]

    for (const keyword of keywords) {
      if (expansions[keyword]) {
        expanded.push(...expansions[keyword])
      }
    }

    return [...new Set(expanded)].join(' ')
  }

  /**
   * Search pattern database
   */
  private searchPatterns(
    expandedQuery: string,
    query: RetrievalQuery
  ): RetrievedDocument[] {
    const results: RetrievedDocument[] = []
    const queryTerms = expandedQuery.toLowerCase().split(' ')

    for (const [key, doc] of this.cache.documents) {
      // Skip if not from patterns source
      if (doc.source !== 'patterns') continue

      // Check if tags match
      const tagMatches = doc.tags.filter(tag => 
        queryTerms.some(term => tag.includes(term))
      ).length

      // Check if content matches
      const contentLower = doc.content.toLowerCase()
      const contentMatches = queryTerms.filter(term => 
        contentLower.includes(term)
      ).length

      // Calculate relevance
      const relevance = (tagMatches * 0.5 + contentMatches * 0.1) / queryTerms.length

      if (relevance > 0) {
        results.push({
          ...doc,
          relevanceScore: Math.min(1, relevance)
        })
      }
    }

    return results
  }

  /**
   * Search documentation sources
   */
  private async searchSources(
    expandedQuery: string,
    query: RetrievalQuery
  ): Promise<RetrievedDocument[]> {
    const results: RetrievedDocument[] = []

    // Filter enabled sources
    const enabledSources = Array.from(this.sources.values())
      .filter(s => s.enabled)
      .filter(s => !query.sources || query.sources.includes(s.id))
      .filter(s => !query.types || query.types.includes(s.type))
      .sort((a, b) => b.priority - a.priority)

    for (const source of enabledSources) {
      // Check cache first
      const cacheKey = `${source.id}:${expandedQuery}`
      if (this.cache.documents.has(cacheKey)) {
        this.cache.hits++
        results.push(this.cache.documents.get(cacheKey)!)
        continue
      }

      this.cache.misses++

      // Generate documentation based on source and query
      const doc = await this.generateDocumentation(source, expandedQuery, query)
      if (doc) {
        this.cache.documents.set(cacheKey, doc)
        results.push(doc)
      }
    }

    return results
  }

  /**
   * Generate documentation for a source
   */
  private async generateDocumentation(
    source: DocumentationSource,
    expandedQuery: string,
    query: RetrievalQuery
  ): Promise<RetrievedDocument | null> {
    try {
      const prompt = `Generate concise documentation for ${source.name} about: ${query.query}

Context: ${query.context || 'General usage'}
Technologies: ${query.technologies?.join(', ') || 'Not specified'}

Include:
1. Brief explanation
2. Code example (TypeScript preferred)
3. Best practices

Keep response focused and practical.`

      const completion = await this.zai.chat.completions.create({
        messages: [
          { 
            role: 'assistant', 
            content: `You are a documentation expert for ${source.name}. Provide accurate, concise documentation with code examples.` 
          },
          { role: 'user', content: prompt }
        ],
        thinking: { type: 'disabled' }
      })

      const content = completion.choices[0]?.message?.content || ''

      return {
        id: `doc_${source.id}_${Date.now().toString(36)}`,
        source: source.id,
        title: `${source.name}: ${query.query}`,
        content,
        url: source.baseUrl ? `${source.baseUrl}/search?q=${encodeURIComponent(query.query)}` : undefined,
        relevanceScore: 0.8,
        tags: [source.type, ...expandedQuery.split(' ').slice(0, 3)],
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error(`[DocRetriever] Error generating doc for ${source.id}:`, error)
      return null
    }
  }

  /**
   * Generate suggestions for further exploration
   */
  private async generateSuggestions(
    query: string,
    results: RetrievedDocument[]
  ): Promise<string[]> {
    if (results.length === 0) {
      return [
        `Search for "${query} tutorial"`,
        `Search for "${query} examples"`,
        `Check official ${query} documentation`
      ]
    }

    // Extract topics from results
    const allTags = results.flatMap(r => r.tags)
    const uniqueTags = [...new Set(allTags)]

    return uniqueTags.slice(0, 5).map(tag => 
      `Explore more about "${tag}"`
    )
  }

  /**
   * Add a custom documentation source
   */
  addSource(source: DocumentationSource): void {
    this.sources.set(source.id, source)
  }

  /**
   * Remove a documentation source
   */
  removeSource(sourceId: string): boolean {
    return this.sources.delete(sourceId)
  }

  /**
   * Get all sources
   */
  getSources(): DocumentationSource[] {
    return Array.from(this.sources.values())
  }

  /**
   * Add a custom pattern to the database
   */
  addPattern(key: string, document: RetrievedDocument): void {
    document.source = 'patterns'
    PATTERN_DATABASE.set(key, document)
    this.cache.documents.set(key, document)
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { hits: number; misses: number; hitRate: number; size: number } {
    const total = this.cache.hits + this.cache.misses
    return {
      hits: this.cache.hits,
      misses: this.cache.misses,
      hitRate: total > 0 ? this.cache.hits / total : 0,
      size: this.cache.documents.size
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.documents.clear()
    this.cache.hits = 0
    this.cache.misses = 0
    
    // Re-add patterns
    for (const [key, doc] of PATTERN_DATABASE) {
      this.cache.documents.set(key, doc)
    }
  }
}

// Singleton
let retrieverInstance: DocumentationRetriever | null = null

export function getDocRetriever(): DocumentationRetriever {
  if (!retrieverInstance) {
    retrieverInstance = new DocumentationRetriever()
  }
  return retrieverInstance
}

/**
 * Quick documentation retrieval
 */
export async function retrieveDocs(
  query: string,
  options?: Partial<RetrievalQuery>
): Promise<RetrievalResult> {
  const retriever = getDocRetriever()
  return retriever.retrieve({
    query,
    ...options
  })
}
