/**
 * Pattern Retriever
 * 
 * Retrieves and manages code patterns from a pattern library:
 * - Design patterns (Singleton, Factory, Observer, etc.)
 * - Architecture patterns (MVC, Repository, Clean Architecture)
 * - Code templates (API routes, components, services)
 * - Best practices patterns
 * - Anti-pattern detection
 */

import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs/promises'
import path from 'path'
import { EventEmitter } from 'events'

// Types
export interface CodePattern {
  id: string
  name: string
  category: PatternCategory
  description: string
  tags: string[]
  code: string
  language: string
  framework?: string
  useCases: string[]
  antiPatterns: string[]
  relatedPatterns: string[]
  complexity: 'simple' | 'moderate' | 'complex'
  reliability: number       // 0-1 success rate when applied
  usageCount: number
  lastUsed?: string
  metadata?: Record<string, any>
}

export type PatternCategory = 
  | 'design'          // GoF design patterns
  | 'architectural'   // Architecture patterns
  | 'creational'      // Object creation patterns
  | 'behavioral'      // Behavior patterns
  | 'structural'      // Code structure patterns
  | 'concurrency'     // Async/concurrency patterns
  | 'data'            // Data access patterns
  | 'api'             // API patterns
  | 'testing'         // Test patterns
  | 'security'        // Security patterns
  | 'performance'     // Performance patterns
  | 'template'        // Code templates

export interface PatternQuery {
  query: string
  category?: PatternCategory
  tags?: string[]
  language?: string
  framework?: string
  complexity?: CodePattern['complexity'][]
  maxResults?: number
  minReliability?: number
}

export interface PatternMatch {
  pattern: CodePattern
  relevanceScore: number
  matchedTags: string[]
  matchedUseCases: string[]
  adaptationSuggestions: string[]
}

export interface PatternApplicationResult {
  success: boolean
  adaptedCode?: string
  modifications: string[]
  warnings: string[]
  appliedPattern: CodePattern
}

export interface PatternLibrary {
  patterns: Map<string, CodePattern>
  categories: Map<PatternCategory, string[]>
  tagIndex: Map<string, string[]>
  lastUpdated: string
}

// Storage
const STORAGE_DIR = path.join(process.cwd(), 'data', 'patterns')
const LIBRARY_FILE = path.join(STORAGE_DIR, 'pattern-library.json')

// Built-in patterns
const BUILTIN_PATTERNS: CodePattern[] = [
  // Design Patterns
  {
    id: 'singleton',
    name: 'Singleton Pattern',
    category: 'design',
    description: 'Ensure a class has only one instance and provide a global point of access',
    tags: ['creational', 'singleton', 'global-state', 'single-instance'],
    code: `
class Singleton {
  private static instance: Singleton | null = null
  
  private constructor() {
    // Private constructor prevents direct instantiation
  }
  
  static getInstance(): Singleton {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton()
    }
    return Singleton.instance
  }
  
  // Instance methods
  doSomething(): void {
    // Implementation
  }
}

// Usage
const singleton = Singleton.getInstance()
`,
    language: 'typescript',
    useCases: ['Database connections', 'Logging services', 'Configuration managers', 'Cache services'],
    antiPatterns: ['Using global variables', 'Multiple instances'],
    relatedPatterns: ['factory', 'dependency-injection'],
    complexity: 'simple',
    reliability: 0.95,
    usageCount: 0
  },
  {
    id: 'factory',
    name: 'Factory Pattern',
    category: 'design',
    description: 'Define an interface for creating objects, letting subclasses decide which class to instantiate',
    tags: ['creational', 'factory', 'object-creation', 'decoupling'],
    code: `
interface Product {
  operation(): string
}

class ConcreteProductA implements Product {
  operation(): string {
    return 'Result of ConcreteProductA'
  }
}

class ConcreteProductB implements Product {
  operation(): string {
    return 'Result of ConcreteProductB'
  }
}

abstract class Creator {
  abstract factoryMethod(): Product
  
  someOperation(): string {
    const product = this.factoryMethod()
    return \`Creator: Using \${product.operation()}\`
  }
}

class ConcreteCreatorA extends Creator {
  factoryMethod(): Product {
    return new ConcreteProductA()
  }
}

class ConcreteCreatorB extends Creator {
  factoryMethod(): Product {
    return new ConcreteProductB()
  }
}
`,
    language: 'typescript',
    useCases: ['Creating objects without specifying exact class', 'Decoupling object creation', 'Plugin architectures'],
    antiPatterns: ['Overusing factories for simple objects', 'Factory returning wrong types'],
    relatedPatterns: ['abstract-factory', 'builder', 'prototype'],
    complexity: 'moderate',
    reliability: 0.9,
    usageCount: 0
  },
  {
    id: 'observer',
    name: 'Observer Pattern',
    category: 'design',
    description: 'Define a one-to-many dependency so that when one object changes state, all dependents are notified',
    tags: ['behavioral', 'observer', 'event', 'pub-sub', 'notification'],
    code: `
interface Observer<T> {
  update(data: T): void
}

interface Subject<T> {
  attach(observer: Observer<T>): void
  detach(observer: Observer<T>): void
  notify(data: T): void
}

class ConcreteSubject<T> implements Subject<T> {
  private observers: Set<Observer<T>> = new Set()
  private state: T | null = null
  
  attach(observer: Observer<T>): void {
    this.observers.add(observer)
  }
  
  detach(observer: Observer<T>): void {
    this.observers.delete(observer)
  }
  
  notify(data: T): void {
    for (const observer of this.observers) {
      observer.update(data)
    }
  }
  
  setState(state: T): void {
    this.state = state
    this.notify(state)
  }
}

class ConcreteObserver<T> implements Observer<T> {
  constructor(private name: string) {}
  
  update(data: T): void {
    console.log(\`\${this.name} received update: \${JSON.stringify(data)}\`)
  }
}
`,
    language: 'typescript',
    useCases: ['Event handling systems', 'Data binding', 'Publish-subscribe systems', 'State monitoring'],
    antiPatterns: ['Too many observers', 'Observers causing side effects', 'Circular notifications'],
    relatedPatterns: ['pub-sub', 'mediator', 'command'],
    complexity: 'moderate',
    reliability: 0.9,
    usageCount: 0
  },
  // Repository Pattern
  {
    id: 'repository',
    name: 'Repository Pattern',
    category: 'architectural',
    description: 'Mediates between the domain and data mapping layers using a collection-like interface',
    tags: ['data-access', 'repository', 'ddd', 'persistence', 'decoupling'],
    code: `
interface Repository<T, ID> {
  findById(id: ID): Promise<T | null>
  findAll(): Promise<T[]>
  save(entity: T): Promise<T>
  delete(id: ID): Promise<void>
}

interface User {
  id: string
  email: string
  name: string
  createdAt: Date
}

class UserRepository implements Repository<User, string> {
  constructor(private db: Database) {}
  
  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } })
  }
  
  async findAll(): Promise<User[]> {
    return this.db.user.findMany()
  }
  
  async save(user: User): Promise<User> {
    return this.db.user.upsert({
      where: { id: user.id },
      update: user,
      create: user
    })
  }
  
  async delete(id: string): Promise<void> {
    await this.db.user.delete({ where: { id } })
  }
  
  // Custom methods
  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { email } })
  }
}
`,
    language: 'typescript',
    framework: 'prisma',
    useCases: ['Data access abstraction', 'Unit testing with mock repositories', 'CQRS implementations', 'Multi-database support'],
    antiPatterns: ['Business logic in repositories', 'N+1 query problems', 'Returning raw database types'],
    relatedPatterns: ['unit-of-work', 'specification', 'query-object'],
    complexity: 'moderate',
    reliability: 0.95,
    usageCount: 0
  },
  // API Route Pattern
  {
    id: 'api-route-crud',
    name: 'CRUD API Route Pattern',
    category: 'api',
    description: 'Standard CRUD operations for Next.js App Router API routes',
    tags: ['api', 'crud', 'nextjs', 'rest', 'route-handler'],
    code: `
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schemas
const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

const updateSchema = createSchema.partial()

// GET /api/resource
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const [items, total] = await Promise.all([
      db.resource.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      db.resource.count()
    ])
    
    return NextResponse.json({
      success: true,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resources' },
      { status: 500 }
    )
  }
}

// POST /api/resource
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createSchema.parse(body)
    
    const resource = await db.resource.create({
      data: validated
    })
    
    return NextResponse.json({ success: true, data: resource }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create resource' },
      { status: 500 }
    )
  }
}
`,
    language: 'typescript',
    framework: 'nextjs',
    useCases: ['REST API endpoints', 'Resource management', 'CRUD operations', 'API development'],
    antiPatterns: ['Missing validation', 'No error handling', 'Returning sensitive data', 'Missing pagination'],
    relatedPatterns: ['api-route-single', 'api-middleware', 'validation-pattern'],
    complexity: 'moderate',
    reliability: 0.95,
    usageCount: 0
  },
  // React Hook Pattern
  {
    id: 'custom-hook',
    name: 'Custom Hook Pattern',
    category: 'template',
    description: 'Reusable custom React hook with loading, error, and data states',
    tags: ['react', 'hook', 'custom-hook', 'state-management', 'typescript'],
    code: `
import { useState, useEffect, useCallback } from 'react'

interface UseDataResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

function useData<T>(
  fetcher: () => Promise<T>,
  dependencies: any[] = []
): UseDataResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await fetcher()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [fetcher])
  
  useEffect(() => {
    fetchData()
  }, [...dependencies, fetchData])
  
  return { data, loading, error, refetch: fetchData }
}

// Usage
function MyComponent() {
  const { data, loading, error, refetch } = useData(
    () => fetch('/api/users').then(r => r.json()),
    []
  )
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      {/* Render data */}
    </div>
  )
}
`,
    language: 'typescript',
    framework: 'react',
    useCases: ['Data fetching', 'API integration', 'State management', 'Reusable logic'],
    antiPatterns: ['Side effects in render', 'Missing cleanup', 'Stale closures', 'Missing dependencies'],
    relatedPatterns: ['context-pattern', 'compound-component', 'render-props'],
    complexity: 'simple',
    reliability: 0.95,
    usageCount: 0
  },
  // Clean Architecture Service
  {
    id: 'service-layer',
    name: 'Service Layer Pattern',
    category: 'architectural',
    description: 'Business logic service with dependency injection and separation of concerns',
    tags: ['service', 'business-logic', 'clean-architecture', 'dependency-injection', 'ddd'],
    code: `
interface UserServiceDeps {
  userRepository: UserRepository
  emailService: EmailService
  logger: Logger
}

interface CreateUserDTO {
  email: string
  name: string
  password: string
}

interface UserDTO {
  id: string
  email: string
  name: string
  createdAt: Date
}

class UserService {
  constructor(private deps: UserServiceDeps) {}
  
  async createUser(dto: CreateUserDTO): Promise<UserDTO> {
    const { userRepository, emailService, logger } = this.deps
    
    // Check if user exists
    const existing = await userRepository.findByEmail(dto.email)
    if (existing) {
      throw new ConflictError('User already exists')
    }
    
    // Create user
    const hashedPassword = await this.hashPassword(dto.password)
    const user = await userRepository.save({
      id: generateId(),
      email: dto.email,
      name: dto.name,
      password: hashedPassword,
      createdAt: new Date()
    })
    
    // Send welcome email (non-blocking)
    emailService.sendWelcome(user.email, user.name).catch(error => {
      logger.error('Failed to send welcome email', { error, userId: user.id })
    })
    
    logger.info('User created', { userId: user.id })
    
    return this.toDTO(user)
  }
  
  async getUser(id: string): Promise<UserDTO | null> {
    const user = await this.deps.userRepository.findById(id)
    return user ? this.toDTO(user) : null
  }
  
  private toDTO(user: User): UserDTO {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    }
  }
  
  private async hashPassword(password: string): Promise<string> {
    // Use bcrypt or similar
    return hash(password, 10)
  }
}
`,
    language: 'typescript',
    useCases: ['Business logic encapsulation', 'API controllers', 'Clean architecture', 'Testable services'],
    antiPatterns: ['Database logic in services', 'Fat services', 'God services', 'Direct external calls'],
    relatedPatterns: ['repository', 'unit-of-work', 'dependency-injection', 'use-case'],
    complexity: 'moderate',
    reliability: 0.9,
    usageCount: 0
  },
  // Concurrency Pattern
  {
    id: 'async-queue',
    name: 'Async Queue Pattern',
    category: 'concurrency',
    description: 'Queue for managing asynchronous tasks with concurrency control',
    tags: ['async', 'queue', 'concurrency', 'task-management', 'rate-limiting'],
    code: `
interface QueueTask<T> {
  id: string
  fn: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
}

class AsyncQueue<T = any> {
  private queue: QueueTask<T>[] = []
  private running = 0
  private taskId = 0
  
  constructor(
    private concurrency: number = 5,
    private timeout: number = 30000
  ) {}
  
  async add<R = T>(fn: () => Promise<R>): Promise<R> {
    return new Promise((resolve, reject) => {
      const task: QueueTask<R> = {
        id: \`task_\${++this.taskId}\`,
        fn: fn as () => Promise<T>,
        resolve: resolve as (value: T) => void,
        reject
      }
      
      this.queue.push(task as QueueTask<T>)
      this.process()
    })
  }
  
  private async process(): Promise<void> {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return
    }
    
    this.running++
    const task = this.queue.shift()!
    
    try {
      const result = await Promise.race([
        task.fn(),
        this.createTimeout(task.id)
      ])
      task.resolve(result)
    } catch (error) {
      task.reject(error instanceof Error ? error : new Error(String(error)))
    } finally {
      this.running--
      this.process()
    }
  }
  
  private createTimeout(taskId: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(\`Task \${taskId} timed out\`))
      }, this.timeout)
    })
  }
  
  get stats() {
    return {
      pending: this.queue.length,
      running: this.running,
      concurrency: this.concurrency
    }
  }
}

// Usage
const queue = new AsyncQueue(3) // Max 3 concurrent tasks

const results = await Promise.all([
  queue.add(() => fetchData(1)),
  queue.add(() => fetchData(2)),
  queue.add(() => fetchData(3)),
])
`,
    language: 'typescript',
    useCases: ['Rate limiting', 'API throttling', 'Background jobs', 'Concurrent task management'],
    antiPatterns: ['Unbounded concurrency', 'No timeout handling', 'Memory leaks from pending tasks'],
    relatedPatterns: ['worker-pool', 'rate-limiter', 'circuit-breaker'],
    complexity: 'moderate',
    reliability: 0.85,
    usageCount: 0
  },
  // Security Pattern
  {
    id: 'input-validation',
    name: 'Input Validation Pattern',
    category: 'security',
    description: 'Comprehensive input validation with sanitization and type safety',
    tags: ['security', 'validation', 'sanitization', 'zod', 'input'],
    code: `
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// Base schemas with sanitization
const sanitizedString = z.string().transform(val => 
  DOMPurify.sanitize(val.trim())
)

const emailSchema = z.string()
  .email('Invalid email format')
  .toLowerCase()
  .max(255)

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(100)
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character')

// User registration schema
const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: sanitizedString.min(2).max(100),
  bio: sanitizedString.max(500).optional(),
  website: z.string().url().optional().or(z.literal('')),
  age: z.number().int().min(13).max(120).optional()
})

type UserRegistration = z.infer<typeof userRegistrationSchema>

// Validation helper
function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError['errors'] } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  // Format errors for API response
  const errors = result.error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }))
  
  return { success: false, errors }
}

// Usage in API route
async function handleRegistration(request: Request) {
  const body = await request.json()
  const validation = validateInput(userRegistrationSchema, body)
  
  if (!validation.success) {
    return Response.json(
      { success: false, errors: validation.errors },
      { status: 400 }
    )
  }
  
  // validation.data is now typed and sanitized
  const user = await createUser(validation.data)
  return Response.json({ success: true, user })
}
`,
    language: 'typescript',
    framework: 'zod',
    useCases: ['API input validation', 'Form validation', 'Data sanitization', 'Type-safe parsing'],
    antiPatterns: ['No validation', 'Client-side only validation', 'No sanitization', 'Accepting raw input'],
    relatedPatterns: ['error-handling', 'rate-limiting', 'authentication'],
    complexity: 'simple',
    reliability: 0.98,
    usageCount: 0
  }
]

/**
 * Pattern Retriever
 */
export class PatternRetriever extends EventEmitter {
  private zai: any = null
  private library: PatternLibrary = {
    patterns: new Map(),
    categories: new Map(),
    tagIndex: new Map(),
    lastUpdated: new Date().toISOString()
  }
  private initialized = false

  constructor() {
    super()
  }

  /**
   * Initialize pattern retriever
   */
  async init(): Promise<void> {
    if (this.initialized) return

    await fs.mkdir(STORAGE_DIR, { recursive: true })
    
    // Load built-in patterns
    for (const pattern of BUILTIN_PATTERNS) {
      this.addPattern(pattern)
    }

    // Load custom patterns from storage
    await this.loadLibrary()
    
    this.initialized = true
  }

  /**
   * Retrieve patterns matching query
   */
  async retrieve(query: PatternQuery): Promise<PatternMatch[]> {
    await this.init()

    const results: PatternMatch[] = []
    const queryLower = query.query.toLowerCase()
    const queryTerms = queryLower.split(/\s+/)

    for (const [id, pattern] of this.library.patterns) {
      // Filter by category
      if (query.category && pattern.category !== query.category) continue

      // Filter by language
      if (query.language && pattern.language !== query.language) continue

      // Filter by framework
      if (query.framework && pattern.framework !== query.framework) continue

      // Filter by complexity
      if (query.complexity && !query.complexity.includes(pattern.complexity)) continue

      // Filter by reliability
      if (query.minReliability && pattern.reliability < query.minReliability) continue

      // Filter by tags
      if (query.tags && !query.tags.some(tag => pattern.tags.includes(tag))) continue

      // Calculate relevance
      const relevance = this.calculateRelevance(pattern, queryTerms, query)
      
      if (relevance.score > 0) {
        results.push({
          pattern,
          relevanceScore: relevance.score,
          matchedTags: relevance.matchedTags,
          matchedUseCases: relevance.matchedUseCases,
          adaptationSuggestions: relevance.suggestions
        })
      }
    }

    // Sort by relevance and return top results
    const maxResults = query.maxResults || 10
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults)
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevance(
    pattern: CodePattern,
    queryTerms: string[],
    query: PatternQuery
  ): {
    score: number
    matchedTags: string[]
    matchedUseCases: string[]
    suggestions: string[]
  } {
    let score = 0
    const matchedTags: string[] = []
    const matchedUseCases: string[] = []
    const suggestions: string[] = []

    // Name matching
    const nameLower = pattern.name.toLowerCase()
    for (const term of queryTerms) {
      if (nameLower.includes(term)) {
        score += 30
      }
    }

    // Tag matching
    for (const tag of pattern.tags) {
      if (queryTerms.some(term => tag.includes(term))) {
        score += 20
        matchedTags.push(tag)
      }
    }

    // Use case matching
    for (const useCase of pattern.useCases) {
      const useCaseLower = useCase.toLowerCase()
      if (queryTerms.some(term => useCaseLower.includes(term))) {
        score += 15
        matchedUseCases.push(useCase)
      }
    }

    // Description matching
    const descLower = pattern.description.toLowerCase()
    for (const term of queryTerms) {
      if (descLower.includes(term)) {
        score += 10
      }
    }

    // Category bonus
    if (query.category === pattern.category) {
      score += 25
    }

    // Reliability bonus
    score += pattern.reliability * 10

    // Usage bonus (popular patterns get slight boost)
    score += Math.min(pattern.usageCount * 0.1, 5)

    // Generate adaptation suggestions
    if (matchedTags.length > 0 || matchedUseCases.length > 0) {
      suggestions.push(`Consider adapting for ${pattern.framework || pattern.language} environment`)
      
      if (pattern.antiPatterns.length > 0) {
        suggestions.push(`Avoid: ${pattern.antiPatterns.slice(0, 2).join(', ')}`)
      }
      
      if (pattern.relatedPatterns.length > 0) {
        suggestions.push(`Related patterns: ${pattern.relatedPatterns.slice(0, 3).join(', ')}`)
      }
    }

    return { score, matchedTags, matchedUseCases, suggestions }
  }

  /**
   * Get pattern by ID
   */
  getPattern(id: string): CodePattern | undefined {
    return this.library.patterns.get(id)
  }

  /**
   * Add a new pattern
   */
  addPattern(pattern: CodePattern): void {
    this.library.patterns.set(pattern.id, pattern)

    // Update category index
    if (!this.library.categories.has(pattern.category)) {
      this.library.categories.set(pattern.category, [])
    }
    this.library.categories.get(pattern.category)!.push(pattern.id)

    // Update tag index
    for (const tag of pattern.tags) {
      if (!this.library.tagIndex.has(tag)) {
        this.library.tagIndex.set(tag, [])
      }
      this.library.tagIndex.get(tag)!.push(pattern.id)
    }

    this.library.lastUpdated = new Date().toISOString()
    this.emit('pattern:added', pattern)
  }

  /**
   * Update pattern usage
   */
  recordUsage(patternId: string): void {
    const pattern = this.library.patterns.get(patternId)
    if (pattern) {
      pattern.usageCount++
      pattern.lastUsed = new Date().toISOString()
      this.saveLibrary()
    }
  }

  /**
   * Get patterns by category
   */
  getByCategory(category: PatternCategory): CodePattern[] {
    const ids = this.library.categories.get(category) || []
    return ids.map(id => this.library.patterns.get(id)!).filter(Boolean)
  }

  /**
   * Get patterns by tag
   */
  getByTag(tag: string): CodePattern[] {
    const ids = this.library.tagIndex.get(tag) || []
    return ids.map(id => this.library.patterns.get(id)!).filter(Boolean)
  }

  /**
   * Get all categories
   */
  getCategories(): PatternCategory[] {
    return Array.from(this.library.categories.keys())
  }

  /**
   * Get all tags
   */
  getTags(): string[] {
    return Array.from(this.library.tagIndex.keys())
  }

  /**
   * Generate custom pattern using AI
   */
  async generatePattern(
    description: string,
    category: PatternCategory,
    language: string = 'typescript'
  ): Promise<CodePattern> {
    await this.init()
    if (!this.zai) this.zai = await ZAI.create()

    const prompt = `Generate a code pattern for:
Description: ${description}
Category: ${category}
Language: ${language}

Provide:
1. Pattern name
2. Code implementation
3. Use cases (3-5)
4. Anti-patterns to avoid (2-3)
5. Related pattern names (2-3)
6. Tags (comma separated)

Format as JSON:
{
  "name": "...",
  "code": "...",
  "useCases": ["...", "..."],
  "antiPatterns": ["...", "..."],
  "relatedPatterns": ["...", "..."],
  "tags": ["...", "..."]
}`

    const completion = await this.zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are a software patterns expert. Generate production-ready code patterns.' },
        { role: 'user', content: prompt }
      ],
      thinking: { type: 'disabled' }
    })

    const response = completion.choices[0]?.message?.content || '{}'
    
    try {
      const parsed = JSON.parse(response)
      
      const pattern: CodePattern = {
        id: `generated_${Date.now().toString(36)}`,
        name: parsed.name || 'Generated Pattern',
        category,
        description,
        tags: parsed.tags || [],
        code: parsed.code || '',
        language,
        useCases: parsed.useCases || [],
        antiPatterns: parsed.antiPatterns || [],
        relatedPatterns: parsed.relatedPatterns || [],
        complexity: 'moderate',
        reliability: 0.7,
        usageCount: 0
      }

      this.addPattern(pattern)
      await this.saveLibrary()

      return pattern
    } catch (error) {
      throw new Error('Failed to generate pattern')
    }
  }

  /**
   * Load library from storage
   */
  private async loadLibrary(): Promise<void> {
    try {
      const data = await fs.readFile(LIBRARY_FILE, 'utf-8')
      const parsed = JSON.parse(data)
      
      for (const pattern of parsed.patterns || []) {
        // Don't override built-in patterns
        if (!this.library.patterns.has(pattern.id)) {
          this.addPattern(pattern)
        }
      }
    } catch {
      // File doesn't exist yet
    }
  }

  /**
   * Save library to storage
   */
  async saveLibrary(): Promise<void> {
    const data = {
      patterns: Array.from(this.library.patterns.values()).filter(p => 
        !BUILTIN_PATTERNS.find(b => b.id === p.id)
      ),
      lastUpdated: this.library.lastUpdated
    }
    
    await fs.writeFile(LIBRARY_FILE, JSON.stringify(data, null, 2))
  }

  /**
   * Get library stats
   */
  getStats(): {
    totalPatterns: number
    byCategory: Record<PatternCategory, number>
    topUsed: CodePattern[]
    recentUsed: CodePattern[]
  } {
    const byCategory: Record<PatternCategory, number> = {} as any
    
    for (const [category, ids] of this.library.categories) {
      byCategory[category] = ids.length
    }

    const patterns = Array.from(this.library.patterns.values())
    
    return {
      totalPatterns: this.library.patterns.size,
      byCategory,
      topUsed: patterns.sort((a, b) => b.usageCount - a.usageCount).slice(0, 5),
      recentUsed: patterns
        .filter(p => p.lastUsed)
        .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())
        .slice(0, 5)
    }
  }
}

// Singleton
let retrieverInstance: PatternRetriever | null = null

export function getPatternRetriever(): PatternRetriever {
  if (!retrieverInstance) {
    retrieverInstance = new PatternRetriever()
  }
  return retrieverInstance
}

/**
 * Quick pattern search
 */
export async function findPatterns(
  query: string,
  options?: Partial<PatternQuery>
): Promise<PatternMatch[]> {
  const retriever = getPatternRetriever()
  return retriever.retrieve({
    query,
    ...options
  })
}
