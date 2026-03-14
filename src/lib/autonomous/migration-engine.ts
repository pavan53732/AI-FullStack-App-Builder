/**
 * Migration Engine
 * 
 * Automatic code migration with:
 * - Framework upgrades
 * - API migrations
 * - Dependency updates
 * - Breaking change handling
 * 
 * Features:
 * - Migration rules
 * - Automatic adaptations
 * - Breaking change detection
 * - Migration reports
 */

import ZAI from 'z-ai-web-dev-sdk'
import { EventEmitter } from 'events'
import fs from 'fs/promises'
import path from 'path'

// Types
export interface Migration {
  id: string
  name: string
  version: string
  description: string
  sourceFramework: string
  targetFramework: string
  rules: MigrationRule[]
  breakingChanges: BreakingChange[]
  createdAt: string
}

export interface MigrationRule {
  id: string
  name: string
  pattern: string
  replacement: string
  filePattern: string
  priority: number
  conditions: RuleCondition[]
}

export interface RuleCondition {
  type: 'has_import' | 'has_function' | 'has_class' | 'version_range'
  value: any
}

export interface BreakingChange {
  id: string
  description: string
  detection: string
  migration: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface MigrationRequest {
  id: string
  migrationId: string
  projectPath: string
  options: MigrationOptions
  createdAt: string
}

export interface MigrationOptions {
  dryRun: boolean
  backupFiles: boolean
  generateReport: boolean
  skipBreakingChanges: boolean
  customRules: MigrationRule[]
}

export interface MigrationResult {
  requestId: string
  migrationId: string
  success: boolean
  filesProcessed: number
  filesChanged: FileMigrationResult[]
  breakingChangesDetected: DetectedBreakingChange[]
  statistics: MigrationStatistics
  report: MigrationReport
}

export interface FileMigrationResult {
  filePath: string
  originalContent: string
  migratedContent: string
  changes: CodeChange[]
  skipped: boolean
  reason?: string
}

export interface CodeChange {
  ruleId: string
  line: number
  before: string
  after: string
  description: string
}

export interface DetectedBreakingChange {
  breakingChangeId: string
  filePath: string
  line: number
  description: string
  severity: string
  suggestedFix: string
}

export interface MigrationStatistics {
  totalTime: number
  filesScanned: number
  filesModified: number
  rulesApplied: number
  breakingChangesFound: number
}

export interface MigrationReport {
  summary: string
  details: string[]
  recommendations: string[]
  warnings: string[]
}

// Predefined migrations
const MIGRATIONS: Migration[] = [
  {
    id: 'react-17-to-18',
    name: 'React 17 to React 18',
    version: '1.0.0',
    description: 'Migrate React 17 codebase to React 18 with new root API',
    sourceFramework: 'react@17',
    targetFramework: 'react@18',
    rules: [
      {
        id: 'root-api',
        name: 'Update Root API',
        pattern: "ReactDOM\\.render\\(([^,]+),\\s*document\\.getElementById\\(['\"]([^'\"]+)['\"]\\)\\)",
        replacement: "const root = ReactDOM.createRoot(document.getElementById('$2'));\nroot.render($1)",
        filePattern: '**/*.{tsx,jsx,ts,js}',
        priority: 10,
        conditions: [{ type: 'has_import', value: 'react-dom' }]
      },
      {
        id: 'use-effect-cleanup',
        name: 'Update useEffect cleanup',
        pattern: 'useEffect\\(\\s*\\(\\s*\\)\\s*=>\\s*\\{([^}]+)return\\s+\\(\\)',
        replacement: 'useEffect(() => {$1return undefined;',
        filePattern: '**/*.{tsx,jsx,ts,js}',
        priority: 20,
        conditions: []
      }
    ],
    breakingChanges: [
      {
        id: 'concurrent-mode',
        description: 'Concurrent mode is now default in React 18',
        detection: 'ReactDOM.render',
        migration: 'Use createRoot instead of render',
        severity: 'high'
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'nextjs-12-to-13',
    name: 'Next.js 12 to Next.js 13',
    version: '1.0.0',
    description: 'Migrate Next.js 12 to Next.js 13 with App Router',
    sourceFramework: 'next@12',
    targetFramework: 'next@13',
    rules: [
      {
        id: 'link-component',
        name: 'Update Link component',
        pattern: '<Link\\s+href=["\']([^"\']+)["\']><a([^>]*)>',
        replacement: '<Link href="$1"$2>',
        filePattern: '**/*.{tsx,jsx}',
        priority: 10,
        conditions: [{ type: 'has_import', value: 'next/link' }]
      },
      {
        id: 'image-component',
        name: 'Update Image component',
        pattern: '<Image\\s+src=["\']([^"\']+)["\']\\s+alt=["\']([^"\']+)["\']\\s*>',
        replacement: '<Image src="$1" alt="$2" width={500} height={300} />',
        filePattern: '**/*.{tsx,jsx}',
        priority: 20,
        conditions: [{ type: 'has_import', value: 'next/image' }]
      }
    ],
    breakingChanges: [
      {
        id: 'app-router',
        description: 'App Router requires new file structure',
        detection: 'pages/',
        migration: 'Migrate pages to app directory structure',
        severity: 'critical'
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'javascript-to-typescript',
    name: 'JavaScript to TypeScript',
    version: '1.0.0',
    description: 'Convert JavaScript files to TypeScript with type annotations',
    sourceFramework: 'javascript',
    targetFramework: 'typescript',
    rules: [
      {
        id: 'add-types',
        name: 'Add type annotations',
        pattern: 'function\\s+(\\w+)\\s*\\(([^)]*)\\)\\s*\\{',
        replacement: 'function $1($2): any {',
        filePattern: '**/*.{js,jsx}',
        priority: 30,
        conditions: []
      },
      {
        id: 'prop-types',
        name: 'Convert PropTypes to TypeScript',
        pattern: '\\w+\\.propTypes\\s*=\\s*\\{([^}]+)\\}',
        replacement: 'interface Props {$1}\n',
        filePattern: '**/*.{js,jsx}',
        priority: 20,
        conditions: [{ type: 'has_import', value: 'prop-types' }]
      }
    ],
    breakingChanges: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'class-to-hooks',
    name: 'Class Components to Hooks',
    version: '1.0.0',
    description: 'Convert React class components to functional components with hooks',
    sourceFramework: 'react-class',
    targetFramework: 'react-hooks',
    rules: [
      {
        id: 'state-to-usestate',
        name: 'Convert state to useState',
        pattern: 'this\\.state\\.([\\w]+)',
        replacement: '$1',
        filePattern: '**/*.{tsx,jsx}',
        priority: 10,
        conditions: []
      },
      {
        id: 'setstate',
        name: 'Convert setState',
        pattern: 'this\\.setState\\(\\s*\\{\\s*([\\w]+)\\s*:\\s*([^}]+)\\}\\s*\\)',
        replacement: 'set$1($2)',
        filePattern: '**/*.{tsx,jsx}',
        priority: 20,
        conditions: []
      }
    ],
    breakingChanges: [
      {
        id: 'lifecycle-methods',
        description: 'Lifecycle methods need to be converted to hooks',
        detection: 'componentDidMount|componentWillUnmount|componentDidUpdate',
        migration: 'Use useEffect hook instead',
        severity: 'high'
      }
    ],
    createdAt: new Date().toISOString()
  }
]

/**
 * Migration Engine
 * 
 * Main class for code migration
 */
export class MigrationEngine extends EventEmitter {
  private zai: any = null
  private migrations: Map<string, Migration> = new Map()
  private history: MigrationResult[] = []

  constructor() {
    super()
    this.loadMigrations()
  }

  /**
   * Initialize the engine
   */
  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
  }

  /**
   * Execute migration
   */
  async migrate(request: MigrationRequest): Promise<MigrationResult> {
    const startTime = Date.now()
    const migration = this.migrations.get(request.migrationId)
    
    if (!migration) {
      return this.createErrorResult(request, `Migration ${request.migrationId} not found`)
    }

    const filesChanged: FileMigrationResult[] = []
    const breakingChangesDetected: DetectedBreakingChange[] = []
    let filesProcessed = 0
    let rulesApplied = 0

    try {
      // Find all files to migrate
      const files = await this.findFiles(request.projectPath, migration.rules)
      filesProcessed = files.length

      // Process each file
      for (const file of files) {
        const result = await this.migrateFile(file, migration, request.options)
        filesChanged.push(result)
        rulesApplied += result.changes.length

        // Detect breaking changes
        const breaking = await this.detectBreakingChanges(file, result.migratedContent, migration)
        breakingChangesDetected.push(...breaking)
      }

      // Apply custom rules
      if (request.options.customRules.length > 0) {
        for (const file of filesChanged) {
          for (const rule of request.options.customRules) {
            const customResult = await this.applyRule(file.migratedContent, rule)
            file.migratedContent = customResult.content
            file.changes.push(...customResult.changes)
          }
        }
      }

    } catch (error: any) {
      return this.createErrorResult(request, error.message)
    }

    const statistics: MigrationStatistics = {
      totalTime: Date.now() - startTime,
      filesScanned: filesProcessed,
      filesModified: filesChanged.filter(f => !f.skipped).length,
      rulesApplied,
      breakingChangesFound: breakingChangesDetected.length
    }

    const report = this.generateReport(migration, filesChanged, breakingChangesDetected, statistics)

    const result: MigrationResult = {
      requestId: request.id,
      migrationId: request.migrationId,
      success: true,
      filesProcessed,
      filesChanged,
      breakingChangesDetected,
      statistics,
      report
    }

    this.history.push(result)
    this.emit('migration_complete', { request, result })

    return result
  }

  /**
   * Migrate single file
   */
  private async migrateFile(
    filePath: string,
    migration: Migration,
    options: MigrationOptions
  ): Promise<FileMigrationResult> {
    try {
      let content = await fs.readFile(filePath, 'utf-8')
      const originalContent = content
      const changes: CodeChange[] = []

      // Check if file matches any rule's file pattern
      const applicableRules = migration.rules.filter(rule => 
        this.matchesFilePattern(filePath, rule.filePattern)
      )

      if (applicableRules.length === 0) {
        return {
          filePath,
          originalContent,
          migratedContent: content,
          changes: [],
          skipped: true,
          reason: 'No applicable rules for this file'
        }
      }

      // Apply rules in priority order
      for (const rule of applicableRules.sort((a, b) => a.priority - b.priority)) {
        const result = await this.applyRule(content, rule)
        content = result.content
        changes.push(...result.changes)
      }

      // Use AI for advanced migrations
      if (this.zai && options.generateReport) {
        content = await this.aiEnhanceMigration(content, migration, filePath)
      }

      return {
        filePath,
        originalContent,
        migratedContent: content,
        changes,
        skipped: false
      }

    } catch (error: any) {
      return {
        filePath,
        originalContent: '',
        migratedContent: '',
        changes: [],
        skipped: true,
        reason: error.message
      }
    }
  }

  /**
   * Apply a migration rule
   */
  private async applyRule(
    content: string,
    rule: MigrationRule
  ): Promise<{ content: string; changes: CodeChange[] }> {
    const changes: CodeChange[] = []
    
    try {
      const regex = new RegExp(rule.pattern, 'g')
      const lines = content.split('\n')
      
      let match
      let newContent = content
      
      while ((match = regex.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length
        const original = match[0]
        
        // Generate replacement
        let replacement = rule.replacement
        for (let i = 1; i < match.length; i++) {
          replacement = replacement.replace(new RegExp(`\\$${i}`, 'g'), match[i] || '')
        }

        changes.push({
          ruleId: rule.id,
          line: lineNum,
          before: original,
          after: replacement,
          description: rule.name
        })

        newContent = newContent.replace(original, replacement)
      }

      return { content: newContent, changes }

    } catch (error) {
      return { content, changes: [] }
    }
  }

  /**
   * Detect breaking changes
   */
  private async detectBreakingChanges(
    filePath: string,
    content: string,
    migration: Migration
  ): Promise<DetectedBreakingChange[]> {
    const detected: DetectedBreakingChange[] = []

    for (const breaking of migration.breakingChanges) {
      const detectionPattern = new RegExp(breaking.detection, 'g')
      let match

      while ((match = detectionPattern.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length
        
        detected.push({
          breakingChangeId: breaking.id,
          filePath,
          line: lineNum,
          description: breaking.description,
          severity: breaking.severity,
          suggestedFix: breaking.migration
        })
      }
    }

    return detected
  }

  /**
   * AI-enhanced migration
   */
  private async aiEnhanceMigration(
    content: string,
    migration: Migration,
    filePath: string
  ): Promise<string> {
    if (!this.zai) return content

    try {
      const prompt = `You are a code migration expert. Migrate the following ${migration.sourceFramework} code to ${migration.targetFramework}.

File: ${filePath}

Code:
\`\`\`
${content}
\`\`\`

Apply migration best practices. Return only the migrated code.`

      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert code migration assistant.' },
          { role: 'user', content: prompt }
        ],
        thinking: { type: 'disabled' }
      })

      const migrated = completion.choices[0]?.message?.content || content
      
      // Extract code from markdown if present
      const codeMatch = migrated.match(/```[\s\S]*?\n([\s\S]*?)```/)
      return codeMatch ? codeMatch[1] : migrated

    } catch {
      return content
    }
  }

  /**
   * Find files matching patterns
   */
  private async findFiles(projectPath: string, rules: MigrationRule[]): Promise<string[]> {
    const files: string[] = []
    const patterns = [...new Set(rules.map(r => r.filePattern))]

    for (const pattern of patterns) {
      const found = await this.globFiles(projectPath, pattern)
      files.push(...found)
    }

    return [...new Set(files)]
  }

  /**
   * Simple glob implementation
   */
  private async globFiles(dir: string, pattern: string): Promise<string[]> {
    const files: string[] = []
    const patternParts = pattern.split('/')
    const extensionMatch = pattern.match(/\*\.\{?([\w,]+)\}?/)

    async function scan(currentDir: string): Promise<void> {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name)
          
          if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
            await scan(fullPath)
          } else if (entry.isFile()) {
            if (extensionMatch) {
              const extensions = extensionMatch[1].split(',')
              if (extensions.some(ext => fullPath.endsWith(`.${ext}`))) {
                files.push(fullPath)
              }
            }
          }
        }
      } catch {
        // Skip directories that can't be read
      }
    }

    await scan(dir)
    return files
  }

  /**
   * Check if file matches pattern
   */
  private matchesFilePattern(filePath: string, pattern: string): boolean {
    const extensionMatch = pattern.match(/\*\.\{?([\w,]+)\}?/)
    if (extensionMatch) {
      const extensions = extensionMatch[1].split(',')
      return extensions.some(ext => filePath.endsWith(`.${ext}`))
    }
    return true
  }

  /**
   * Generate migration report
   */
  private generateReport(
    migration: Migration,
    filesChanged: FileMigrationResult[],
    breakingChanges: DetectedBreakingChange[],
    statistics: MigrationStatistics
  ): MigrationReport {
    const details: string[] = []
    const recommendations: string[] = []
    const warnings: string[] = []

    details.push(`Migration: ${migration.name}`)
    details.push(`Files scanned: ${statistics.filesScanned}`)
    details.push(`Files modified: ${statistics.filesModified}`)
    details.push(`Rules applied: ${statistics.rulesApplied}`)

    if (breakingChanges.length > 0) {
      warnings.push(`Detected ${breakingChanges.length} potential breaking changes`)
      
      for (const bc of breakingChanges) {
        if (bc.severity === 'critical' || bc.severity === 'high') {
          warnings.push(`  - ${bc.filePath}:${bc.line} - ${bc.description}`)
        }
      }

      recommendations.push('Review breaking changes before applying migration')
      recommendations.push('Test migrated code thoroughly')
    }

    const summary = `Successfully migrated ${statistics.filesModified} files from ${migration.sourceFramework} to ${migration.targetFramework}`

    return { summary, details, recommendations, warnings }
  }

  /**
   * Create error result
   */
  private createErrorResult(request: MigrationRequest, error: string): MigrationResult {
    return {
      requestId: request.id,
      migrationId: request.migrationId,
      success: false,
      filesProcessed: 0,
      filesChanged: [],
      breakingChangesDetected: [],
      statistics: {
        totalTime: 0,
        filesScanned: 0,
        filesModified: 0,
        rulesApplied: 0,
        breakingChangesFound: 0
      },
      report: {
        summary: 'Migration failed',
        details: [error],
        recommendations: ['Check error message and fix the issue'],
        warnings: []
      }
    }
  }

  /**
   * Load predefined migrations
   */
  private loadMigrations(): void {
    for (const migration of MIGRATIONS) {
      this.migrations.set(migration.id, migration)
    }
  }

  /**
   * Add custom migration
   */
  addMigration(migration: Migration): void {
    this.migrations.set(migration.id, migration)
    this.emit('migration_added', { migration })
  }

  /**
   * Get all migrations
   */
  getMigrations(): Migration[] {
    return Array.from(this.migrations.values())
  }

  /**
   * Get migration by ID
   */
  getMigration(id: string): Migration | undefined {
    return this.migrations.get(id)
  }

  /**
   * Apply migration changes to files
   */
  async applyChanges(result: MigrationResult, backup: boolean = true): Promise<void> {
    for (const file of result.filesChanged) {
      if (file.skipped) continue

      // Backup original file
      if (backup) {
        const backupPath = `${file.filePath}.backup`
        await fs.writeFile(backupPath, file.originalContent, 'utf-8')
      }

      // Write migrated content
      await fs.writeFile(file.filePath, file.migratedContent, 'utf-8')
    }
  }

  /**
   * Get migration history
   */
  getHistory(): MigrationResult[] {
    return [...this.history]
  }
}

// Singleton instance
let engineInstance: MigrationEngine | null = null

export function getMigrationEngine(): MigrationEngine {
  if (!engineInstance) {
    engineInstance = new MigrationEngine()
  }
  return engineInstance
}

export async function migrateProject(
  migrationId: string,
  projectPath: string,
  options?: Partial<MigrationOptions>
): Promise<MigrationResult> {
  const engine = getMigrationEngine()
  if (!engine['zai']) {
    await engine.initialize()
  }

  return engine.migrate({
    id: `migrate-${Date.now().toString(36)}`,
    migrationId,
    projectPath,
    options: {
      dryRun: false,
      backupFiles: true,
      generateReport: true,
      skipBreakingChanges: false,
      customRules: [],
      ...options
    },
    createdAt: new Date().toISOString()
  })
}
