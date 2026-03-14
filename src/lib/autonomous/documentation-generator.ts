/**
 * Documentation Generator
 * 
 * Automatically generates documentation from code:
 * - API documentation
 * - Code comments
 * - README files
 * - Architecture docs
 * 
 * Features:
 * - JSDoc extraction
 * - Type inference
 * - Example generation
 * - Markdown output
 */

import ZAI from 'z-ai-web-dev-sdk'
import { EventEmitter } from 'events'
import fs from 'fs/promises'
import path from 'path'

// Types
export interface DocumentationRequest {
  id: string
  type: DocumentationType
  target: DocumentationTarget
  options: DocumentationOptions
  createdAt: string
}

export type DocumentationType = 
  | 'api'
  | 'readme'
  | 'architecture'
  | 'component'
  | 'function'
  | 'module'
  | 'changelog'

export interface DocumentationTarget {
  path: string
  files?: string[]
  modules?: string[]
  functions?: string[]
  classes?: string[]
}

export interface DocumentationOptions {
  format: 'markdown' | 'html' | 'json'
  includePrivate: boolean
  includeExamples: boolean
  includeTypes: boolean
  includeUsage: boolean
  depth: number
  language: string
}

export interface DocumentationResult {
  requestId: string
  success: boolean
  type: DocumentationType
  content: string
  sections: DocumentationSection[]
  metadata: DocumentationMetadata
  warnings: string[]
  generatedFiles: GeneratedFile[]
}

export interface DocumentationSection {
  id: string
  title: string
  content: string
  level: number
  order: number
}

export interface DocumentationMetadata {
  filesProcessed: number
  symbolsDocumented: number
  examplesGenerated: number
  typesExtracted: number
  generationTime: number
}

export interface GeneratedFile {
  path: string
  content: string
  type: 'markdown' | 'html' | 'json'
}

export interface APIDocument {
  name: string
  kind: 'function' | 'class' | 'interface' | 'type' | 'variable' | 'module'
  description: string
  signature: string
  parameters: ParameterDoc[]
  returns: ReturnDoc
  examples: ExampleDoc[]
  since?: string
  deprecated?: boolean
  deprecationMessage?: string
  see: string[]
  throws: string[]
}

export interface ParameterDoc {
  name: string
  type: string
  description: string
  optional: boolean
  defaultValue?: string
}

export interface ReturnDoc {
  type: string
  description: string
}

export interface ExampleDoc {
  code: string
  description: string
  language: string
}

export interface ComponentDoc {
  name: string
  description: string
  props: PropDoc[]
  slots: SlotDoc[]
  events: EventDoc[]
  examples: ExampleDoc[]
}

export interface PropDoc {
  name: string
  type: string
  description: string
  required: boolean
  defaultValue?: string
}

export interface SlotDoc {
  name: string
  description: string
}

export interface EventDoc {
  name: string
  description: string
  payload: string
}

/**
 * Documentation Generator
 * 
 * Main class for generating documentation
 */
export class DocumentationGenerator extends EventEmitter {
  private zai: any = null
  private cache: Map<string, APIDocument> = new Map()
  private templates: Map<string, string> = new Map()

  constructor() {
    super()
    this.loadTemplates()
  }

  /**
   * Initialize the generator
   */
  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
  }

  /**
   * Generate documentation
   */
  async generate(request: DocumentationRequest): Promise<DocumentationResult> {
    const startTime = Date.now()
    this.emit('generation_started', { request })

    try {
      let result: DocumentationResult

      switch (request.type) {
        case 'api':
          result = await this.generateAPIDocs(request)
          break
        case 'readme':
          result = await this.generateREADME(request)
          break
        case 'architecture':
          result = await this.generateArchitectureDocs(request)
          break
        case 'component':
          result = await this.generateComponentDocs(request)
          break
        case 'function':
          result = await this.generateFunctionDocs(request)
          break
        case 'module':
          result = await this.generateModuleDocs(request)
          break
        case 'changelog':
          result = await this.generateChangelog(request)
          break
        default:
          result = await this.generateAPIDocs(request)
      }

      result.metadata.generationTime = Date.now() - startTime
      this.emit('generation_complete', { request, result })
      return result

    } catch (error: any) {
      return {
        requestId: request.id,
        success: false,
        type: request.type,
        content: '',
        sections: [],
        metadata: {
          filesProcessed: 0,
          symbolsDocumented: 0,
          examplesGenerated: 0,
          typesExtracted: 0,
          generationTime: Date.now() - startTime
        },
        warnings: [error.message],
        generatedFiles: []
      }
    }
  }

  /**
   * Generate API documentation
   */
  private async generateAPIDocs(request: DocumentationRequest): Promise<DocumentationResult> {
    const { target, options } = request
    const sections: DocumentationSection[] = []
    const warnings: string[] = []
    const generatedFiles: GeneratedFile[] = []
    let symbolsDocumented = 0
    let examplesGenerated = 0
    let typesExtracted = 0

    // Find files to document
    const files = await this.findSourceFiles(target.path)
    const documents: APIDocument[] = []

    for (const file of files.slice(0, options.depth * 10)) {
      try {
        const content = await fs.readFile(file, 'utf-8')
        const fileDocs = await this.extractDocuments(file, content, options)
        documents.push(...fileDocs)
        symbolsDocumented += fileDocs.length
      } catch (error) {
        warnings.push(`Could not process file: ${file}`)
      }
    }

    // Generate sections
    sections.push({
      id: 'overview',
      title: 'Overview',
      content: this.generateOverviewSection(documents),
      level: 1,
      order: 1
    })

    // Group by kind
    const grouped = this.groupByKind(documents)

    for (const [kind, docs] of Object.entries(grouped)) {
      sections.push({
        id: kind,
        title: this.capitalizeKind(kind),
        content: this.generateKindSection(docs, kind, options),
        level: 2,
        order: 2 + Object.keys(grouped).indexOf(kind)
      })
    }

    // Generate examples
    if (options.includeExamples) {
      const exampleSection = await this.generateExamplesSection(documents)
      sections.push(exampleSection)
      examplesGenerated = exampleSection.content.split('```').length / 2
    }

    // Generate main content
    const content = this.renderMarkdown(sections, options)

    // Generate output file
    generatedFiles.push({
      path: path.join(target.path, 'docs', 'API.md'),
      content,
      type: 'markdown'
    })

    return {
      requestId: request.id,
      success: true,
      type: 'api',
      content,
      sections,
      metadata: {
        filesProcessed: files.length,
        symbolsDocumented,
        examplesGenerated,
        typesExtracted: documents.filter(d => d.kind === 'type' || d.kind === 'interface').length,
        generationTime: 0
      },
      warnings,
      generatedFiles
    }
  }

  /**
   * Generate README documentation
   */
  private async generateREADME(request: DocumentationRequest): Promise<DocumentationResult> {
    const { target, options } = request
    const sections: DocumentationSection[] = []
    const warnings: string[] = []
    const generatedFiles: GeneratedFile[] = []

    // Analyze project
    const packageJson = await this.readPackageJson(target.path)
    const structure = await this.analyzeStructure(target.path)

    // Title and description
    sections.push({
      id: 'title',
      title: packageJson?.name || 'Project',
      content: `# ${packageJson?.name || 'Project'}\n\n${packageJson?.description || 'A software project.'}\n`,
      level: 1,
      order: 1
    })

    // Installation
    sections.push({
      id: 'installation',
      title: 'Installation',
      content: this.generateInstallationSection(packageJson),
      level: 2,
      order: 2
    })

    // Usage
    sections.push({
      id: 'usage',
      title: 'Usage',
      content: await this.generateUsageSection(target.path, options),
      level: 2,
      order: 3
    })

    // Features
    sections.push({
      id: 'features',
      title: 'Features',
      content: this.generateFeaturesSection(structure),
      level: 2,
      order: 4
    })

    // API Reference
    if (options.includeUsage) {
      sections.push({
        id: 'api-reference',
        title: 'API Reference',
        content: await this.generateAPIReferenceSection(target.path, options),
        level: 2,
        order: 5
      })
    }

    // Contributing
    sections.push({
      id: 'contributing',
      title: 'Contributing',
      content: this.generateContributingSection(),
      level: 2,
      order: 6
    })

    // License
    sections.push({
      id: 'license',
      title: 'License',
      content: `This project is licensed under the ${packageJson?.license || 'MIT'} License.\n`,
      level: 2,
      order: 7
    })

    const content = this.renderMarkdown(sections, options)

    generatedFiles.push({
      path: path.join(target.path, 'README.md'),
      content,
      type: 'markdown'
    })

    return {
      requestId: request.id,
      success: true,
      type: 'readme',
      content,
      sections,
      metadata: {
        filesProcessed: structure.files,
        symbolsDocumented: structure.symbols,
        examplesGenerated: 1,
        typesExtracted: 0,
        generationTime: 0
      },
      warnings,
      generatedFiles
    }
  }

  /**
   * Generate architecture documentation
   */
  private async generateArchitectureDocs(request: DocumentationRequest): Promise<DocumentationResult> {
    const { target, options } = request
    const sections: DocumentationSection[] = []
    const generatedFiles: GeneratedFile[] = []

    // Analyze architecture
    const architecture = await this.analyzeArchitecture(target.path)

    sections.push({
      id: 'overview',
      title: 'Architecture Overview',
      content: this.generateArchitectureOverview(architecture),
      level: 1,
      order: 1
    })

    sections.push({
      id: 'components',
      title: 'Components',
      content: this.generateComponentsSection(architecture),
      level: 2,
      order: 2
    })

    sections.push({
      id: 'data-flow',
      title: 'Data Flow',
      content: this.generateDataFlowSection(architecture),
      level: 2,
      order: 3
    })

    sections.push({
      id: 'dependencies',
      title: 'Dependencies',
      content: this.generateDependenciesSection(architecture),
      level: 2,
      order: 4
    })

    const content = this.renderMarkdown(sections, options)

    generatedFiles.push({
      path: path.join(target.path, 'docs', 'ARCHITECTURE.md'),
      content,
      type: 'markdown'
    })

    return {
      requestId: request.id,
      success: true,
      type: 'architecture',
      content,
      sections,
      metadata: {
        filesProcessed: architecture.files,
        symbolsDocumented: architecture.components.length,
        examplesGenerated: 0,
        typesExtracted: 0,
        generationTime: 0
      },
      warnings: [],
      generatedFiles
    }
  }

  /**
   * Generate component documentation
   */
  private async generateComponentDocs(request: DocumentationRequest): Promise<DocumentationResult> {
    const { target, options } = request
    const sections: DocumentationSection[] = []
    const generatedFiles: GeneratedFile[] = []

    // Find component files
    const componentFiles = await this.findComponentFiles(target.path)
    const components: ComponentDoc[] = []

    for (const file of componentFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8')
        const componentDoc = await this.extractComponentDoc(file, content, options)
        if (componentDoc) {
          components.push(componentDoc)
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    for (const component of components) {
      sections.push({
        id: component.name,
        title: component.name,
        content: this.renderComponentDoc(component, options),
        level: 2,
        order: components.indexOf(component) + 1
      })
    }

    const content = this.renderMarkdown(sections, options)

    return {
      requestId: request.id,
      success: true,
      type: 'component',
      content,
      sections,
      metadata: {
        filesProcessed: componentFiles.length,
        symbolsDocumented: components.length,
        examplesGenerated: components.reduce((sum, c) => sum + c.examples.length, 0),
        typesExtracted: components.reduce((sum, c) => sum + c.props.length, 0),
        generationTime: 0
      },
      warnings: [],
      generatedFiles
    }
  }

  /**
   * Generate function documentation
   */
  private async generateFunctionDocs(request: DocumentationRequest): Promise<DocumentationResult> {
    return this.generateAPIDocs(request)
  }

  /**
   * Generate module documentation
   */
  private async generateModuleDocs(request: DocumentationRequest): Promise<DocumentationResult> {
    const { target, options } = request
    const sections: DocumentationSection[] = []
    const generatedFiles: GeneratedFile[] = []

    // Find modules
    const moduleFiles = await this.findModuleFiles(target.path)

    for (const file of moduleFiles.slice(0, options.depth * 10)) {
      try {
        const content = await fs.readFile(file, 'utf-8')
        const moduleName = path.basename(file, path.extname(file))
        const moduleDoc = await this.extractModuleDoc(file, content, options)

        sections.push({
          id: moduleName,
          title: moduleName,
          content: moduleDoc,
          level: 2,
          order: sections.length + 1
        })
      } catch (error) {
        // Skip files that can't be read
      }
    }

    const content = this.renderMarkdown(sections, options)

    return {
      requestId: request.id,
      success: true,
      type: 'module',
      content,
      sections,
      metadata: {
        filesProcessed: moduleFiles.length,
        symbolsDocumented: sections.length,
        examplesGenerated: 0,
        typesExtracted: 0,
        generationTime: 0
      },
      warnings: [],
      generatedFiles
    }
  }

  /**
   * Generate changelog
   */
  private async generateChangelog(request: DocumentationRequest): Promise<DocumentationResult> {
    const { target, options } = request
    const sections: DocumentationSection[] = []
    const generatedFiles: GeneratedFile[] = []

    // Try to get git history
    const commits = await this.getGitHistory(target.path)

    // Group by version/tag
    const versions = this.groupCommitsByVersion(commits)

    sections.push({
      id: 'changelog',
      title: 'Changelog',
      content: 'All notable changes to this project will be documented in this file.\n\n',
      level: 1,
      order: 1
    })

    for (const [version, versionCommits] of Object.entries(versions)) {
      sections.push({
        id: version,
        title: version,
        content: this.renderVersionSection(version, versionCommits),
        level: 2,
        order: sections.length + 1
      })
    }

    const content = this.renderMarkdown(sections, options)

    generatedFiles.push({
      path: path.join(target.path, 'CHANGELOG.md'),
      content,
      type: 'markdown'
    })

    return {
      requestId: request.id,
      success: true,
      type: 'changelog',
      content,
      sections,
      metadata: {
        filesProcessed: 1,
        symbolsDocumented: commits.length,
        examplesGenerated: 0,
        typesExtracted: 0,
        generationTime: 0
      },
      warnings: [],
      generatedFiles
    }
  }

  // Helper methods

  private async findSourceFiles(dir: string): Promise<string[]> {
    const files: string[] = []
    
    async function scan(currentDir: string): Promise<void> {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name)
          
          if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
            await scan(fullPath)
          } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            files.push(fullPath)
          }
        }
      } catch {
        // Skip directories that can't be read
      }
    }

    await scan(dir)
    return files
  }

  private async findComponentFiles(dir: string): Promise<string[]> {
    const files = await this.findSourceFiles(dir)
    return files.filter(f => 
      f.includes('component') || 
      f.includes('Component') || 
      /\.(tsx|jsx)$/.test(f)
    )
  }

  private async findModuleFiles(dir: string): Promise<string[]> {
    const files = await this.findSourceFiles(dir)
    return files.filter(f => path.basename(f).match(/^[A-Z]/))
  }

  private async extractDocuments(
    file: string, 
    content: string, 
    options: DocumentationOptions
  ): Promise<APIDocument[]> {
    const documents: APIDocument[] = []
    
    // Extract JSDoc comments
    const jsdocRegex = /\/\*\*[\s\S]*?\*\/\s*(?:export\s+)?(?:async\s+)?(?:function|class|interface|type|const)\s+(\w+)/g
    let match

    while ((match = jsdocRegex.exec(content)) !== null) {
      const jsdoc = match[0]
      const name = match[1]
      
      const doc = this.parseJSDoc(jsdoc, name, content)
      if (doc && (options.includePrivate || !jsdoc.includes('@private'))) {
        documents.push(doc)
      }
    }

    // Use AI to enhance documentation
    if (this.zai && documents.length > 0 && options.includeExamples) {
      for (const doc of documents.slice(0, 10)) {
        if (doc.examples.length === 0) {
          doc.examples = await this.generateExamples(doc)
        }
      }
    }

    return documents
  }

  private parseJSDoc(jsdoc: string, name: string, content: string): APIDocument {
    const lines = jsdoc.split('\n').map(l => l.replace(/^\s*\*\s?/, '').trim())
    
    let description = ''
    const params: ParameterDoc[] = []
    let returns: ReturnDoc = { type: 'void', description: '' }
    const examples: ExampleDoc[] = []
    const see: string[] = []
    const throws: string[] = []
    let deprecated = false
    let deprecationMessage = ''
    let since: string | undefined

    for (const line of lines) {
      if (line.startsWith('@param')) {
        const match = line.match(/@param\s+(?:\{([^}]+)\}\s+)?(\w+)\s*-?\s*(.*)/)
        if (match) {
          params.push({
            name: match[2],
            type: match[1] || 'any',
            description: match[3] || '',
            optional: false
          })
        }
      } else if (line.startsWith('@returns') || line.startsWith('@return')) {
        const match = line.match(/@returns?\s+(?:\{([^}]+)\}\s*)?-?\s*(.*)/)
        if (match) {
          returns = { type: match[1] || 'any', description: match[2] || '' }
        }
      } else if (line.startsWith('@example')) {
        // Collect example code
        const exampleCode = lines.slice(lines.indexOf(line) + 1)
          .filter(l => !l.startsWith('@'))
          .join('\n')
          .trim()
        if (exampleCode) {
          examples.push({ code: exampleCode, description: '', language: 'typescript' })
        }
      } else if (line.startsWith('@see')) {
        see.push(line.replace('@see', '').trim())
      } else if (line.startsWith('@throws') || line.startsWith('@throw')) {
        throws.push(line.replace(/@throws?\s*/, '').trim())
      } else if (line.startsWith('@deprecated')) {
        deprecated = true
        deprecationMessage = line.replace('@deprecated', '').trim()
      } else if (line.startsWith('@since')) {
        since = line.replace('@since', '').trim()
      } else if (line && !line.startsWith('@')) {
        description += (description ? ' ' : '') + line
      }
    }

    // Determine kind
    let kind: APIDocument['kind'] = 'function'
    if (content.includes(`class ${name}`)) kind = 'class'
    else if (content.includes(`interface ${name}`)) kind = 'interface'
    else if (content.includes(`type ${name}`)) kind = 'type'
    else if (content.includes(`const ${name}`)) kind = 'variable'

    // Extract signature
    const signatureMatch = content.match(new RegExp(`(?:export\\s+)?(?:async\\s+)?function\\s+${name}\\s*\\([^)]*\\)`))
    const signature = signatureMatch ? signatureMatch[0] : name

    return {
      name,
      kind,
      description,
      signature,
      parameters: params,
      returns,
      examples,
      since,
      deprecated,
      deprecationMessage,
      see,
      throws
    }
  }

  private async generateExamples(doc: APIDocument): Promise<ExampleDoc[]> {
    if (!this.zai) return []

    try {
      const prompt = `Generate a practical usage example for this ${doc.kind}:

Name: ${doc.name}
Description: ${doc.description}
Signature: ${doc.signature}
Parameters: ${doc.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}
Returns: ${doc.returns.type}

Return ONLY the example code, no explanation. Keep it simple and practical.`

      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a code documentation expert.' },
          { role: 'user', content: prompt }
        ],
        thinking: { type: 'disabled' }
      })

      const code = completion.choices[0]?.message?.content?.trim() || ''
      
      return [{
        code,
        description: `Example usage of ${doc.name}`,
        language: 'typescript'
      }]
    } catch {
      return []
    }
  }

  private groupByKind(docs: APIDocument[]): Record<string, APIDocument[]> {
    const grouped: Record<string, APIDocument[]> = {}
    for (const doc of docs) {
      if (!grouped[doc.kind]) {
        grouped[doc.kind] = []
      }
      grouped[doc.kind].push(doc)
    }
    return grouped
  }

  private capitalizeKind(kind: string): string {
    return kind.charAt(0).toUpperCase() + kind.slice(1) + 's'
  }

  private generateOverviewSection(docs: APIDocument[]): string {
    const kinds = this.groupByKind(docs)
    let content = '## API Overview\n\n'
    content += `This API contains ${docs.length} documented symbols:\n\n`
    
    for (const [kind, kindDocs] of Object.entries(kinds)) {
      content += `- **${this.capitalizeKind(kind)}**: ${kindDocs.length}\n`
    }
    
    return content + '\n'
  }

  private generateKindSection(docs: APIDocument[], kind: string, options: DocumentationOptions): string {
    let content = ''
    
    for (const doc of docs) {
      content += `### ${doc.name}\n\n`
      
      if (doc.deprecated) {
        content += `> ⚠️ **Deprecated**: ${doc.deprecationMessage || 'This item is deprecated.'}\n\n`
      }
      
      content += `${doc.description}\n\n`
      
      if (options.includeTypes) {
        content += '```typescript\n' + doc.signature + '\n```\n\n'
      }
      
      if (doc.parameters.length > 0) {
        content += '**Parameters:**\n\n'
        content += '| Name | Type | Description |\n'
        content += '|------|------|-------------|\n'
        for (const param of doc.parameters) {
          content += `| ${param.name} | \`${param.type}\` | ${param.description} |\n`
        }
        content += '\n'
      }
      
      if (doc.returns.type !== 'void') {
        content += `**Returns:** \`${doc.returns.type}\` - ${doc.returns.description}\n\n`
      }
      
      if (options.includeExamples && doc.examples.length > 0) {
        content += '**Example:**\n\n'
        for (const example of doc.examples) {
          content += `\`\`\`${example.language}\n${example.code}\n\`\`\`\n\n`
        }
      }
      
      if (doc.see.length > 0) {
        content += `**See also:** ${doc.see.join(', ')}\n\n`
      }
      
      if (doc.throws.length > 0) {
        content += `**Throws:** ${doc.throws.join(', ')}\n\n`
      }
    }
    
    return content
  }

  private async generateExamplesSection(docs: APIDocument[]): Promise<DocumentationSection> {
    let content = '## Examples\n\n'
    
    const functionsWithExamples = docs.filter(d => d.examples.length > 0).slice(0, 10)
    
    for (const doc of functionsWithExamples) {
      content += `### ${doc.name}\n\n`
      for (const example of doc.examples) {
        content += `\`\`\`${example.language}\n${example.code}\n\`\`\`\n\n`
      }
    }
    
    return {
      id: 'examples',
      title: 'Examples',
      content,
      level: 2,
      order: 100
    }
  }

  private renderMarkdown(sections: DocumentationSection[], options: DocumentationOptions): string {
    return sections
      .sort((a, b) => a.order - b.order)
      .map(s => `${'#'.repeat(s.level)} ${s.title}\n\n${s.content}`)
      .join('\n')
  }

  private async readPackageJson(dir: string): Promise<any> {
    try {
      const content = await fs.readFile(path.join(dir, 'package.json'), 'utf-8')
      return JSON.parse(content)
    } catch {
      return null
    }
  }

  private async analyzeStructure(dir: string): Promise<{ files: number; symbols: number; features: string[] }> {
    const files = await this.findSourceFiles(dir)
    let symbols = 0
    const features: string[] = []

    for (const file of files.slice(0, 20)) {
      try {
        const content = await fs.readFile(file, 'utf-8')
        symbols += (content.match(/(?:function|class|interface|type|const)\s+\w+/g) || []).length
        
        // Detect features
        if (content.includes('React') || content.includes('react')) features.push('React')
        if (content.includes('Next.js') || content.includes('next')) features.push('Next.js')
        if (content.includes('TypeScript')) features.push('TypeScript')
        if (content.includes('Prisma')) features.push('Prisma')
      } catch {
        // Skip
      }
    }

    return { files: files.length, symbols, features: [...new Set(features)] }
  }

  private generateInstallationSection(packageJson: any): string {
    let content = '## Installation\n\n'
    
    if (packageJson?.name) {
      content += '```bash\n'
      content += `npm install ${packageJson.name}\n`
      content += '# or\n'
      content += `yarn add ${packageJson.name}\n`
      content += '# or\n'
      content += `pnpm add ${packageJson.name}\n`
      content += '```\n\n'
    }
    
    return content
  }

  private async generateUsageSection(dir: string, options: DocumentationOptions): Promise<string> {
    let content = '## Usage\n\n'
    
    // Find main entry
    try {
      const files = await this.findSourceFiles(dir)
      const mainFile = files.find(f => f.includes('index.ts') || f.includes('main.ts'))
      
      if (mainFile) {
        const mainContent = await fs.readFile(mainFile, 'utf-8')
        const exports = mainContent.match(/export\s+(?:default\s+)?(?:function|class|const)\s+\w+/g) || []
        
        content += '```typescript\n'
        content += `import { ${exports[0]?.split(/\s+/).pop() || 'main'} } from '${path.basename(dir)}'\n`
        content += '// Usage example\n'
        content += '```\n\n'
      }
    } catch {
      // Fallback
    }
    
    return content
  }

  private generateFeaturesSection(structure: { features: string[] }): string {
    let content = '## Features\n\n'
    
    if (structure.features.length > 0) {
      for (const feature of structure.features) {
        content += `- ${feature}\n`
      }
    } else {
      content += '- Modern JavaScript/TypeScript\n'
      content += '- Well-documented API\n'
      content += '- Comprehensive test coverage\n'
    }
    
    return content + '\n'
  }

  private async generateAPIReferenceSection(dir: string, options: DocumentationOptions): Promise<string> {
    return 'See the [API Documentation](./docs/API.md) for detailed reference.\n\n'
  }

  private generateContributingSection(): string {
    return `## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

`
  }

  private async analyzeArchitecture(dir: string): Promise<any> {
    const files = await this.findSourceFiles(dir)
    const components: string[] = []
    
    for (const file of files.slice(0, 30)) {
      const basename = path.basename(file, path.extname(file))
      if (!['index', 'types', 'utils'].includes(basename)) {
        components.push(basename)
      }
    }
    
    return {
      files: files.length,
      components,
      dependencies: [],
      dataFlows: []
    }
  }

  private generateArchitectureOverview(architecture: any): string {
    return `This system consists of ${architecture.components.length} main components working together.\n\n`
  }

  private generateComponentsSection(architecture: any): string {
    let content = ''
    for (const comp of architecture.components) {
      content += `- **${comp}**: Core component\n`
    }
    return content + '\n'
  }

  private generateDataFlowSection(architecture: any): string {
    return 'Data flows through the system via well-defined interfaces.\n\n'
  }

  private generateDependenciesSection(architecture: any): string {
    return 'See package.json for the complete list of dependencies.\n\n'
  }

  private async extractComponentDoc(file: string, content: string, options: DocumentationOptions): Promise<ComponentDoc | null> {
    const name = path.basename(file, path.extname(file))
    
    // Extract props from interface
    const propsMatch = content.match(/interface\s+(\w+Props)\s*\{([^}]+)\}/)
    const props: PropDoc[] = []
    
    if (propsMatch) {
      const propsContent = propsMatch[2]
      const propLines = propsContent.split('\n').filter(l => l.trim())
      
      for (const line of propLines) {
        const propMatch = line.match(/(\w+)(\?)?:\s*([^;]+)/)
        if (propMatch) {
          props.push({
            name: propMatch[1],
            type: propMatch[3].trim(),
            description: '',
            required: !propMatch[2]
          })
        }
      }
    }
    
    return {
      name,
      description: `${name} component`,
      props,
      slots: [],
      events: [],
      examples: []
    }
  }

  private renderComponentDoc(component: ComponentDoc, options: DocumentationOptions): string {
    let content = `${component.description}\n\n`
    
    if (component.props.length > 0) {
      content += '**Props:**\n\n'
      content += '| Prop | Type | Required |\n'
      content += '|------|------|----------|\n'
      for (const prop of component.props) {
        content += `| ${prop.name} | \`${prop.type}\` | ${prop.required ? 'Yes' : 'No'} |\n`
      }
      content += '\n'
    }
    
    return content
  }

  private async extractModuleDoc(file: string, content: string, options: DocumentationOptions): Promise<string> {
    const name = path.basename(file, path.extname(file))
    
    // Extract exports
    const exports = content.match(/export\s+(?:default\s+)?(?:function|class|const|interface|type)\s+\w+/g) || []
    
    let doc = `${name} module\n\n`
    doc += '**Exports:**\n\n'
    for (const exp of exports) {
      doc += `- ${exp.replace(/export\s+(?:default\s+)?/, '')}\n`
    }
    
    return doc + '\n'
  }

  private async getGitHistory(dir: string): Promise<any[]> {
    // Return empty for now - would need to implement git log parsing
    return []
  }

  private groupCommitsByVersion(commits: any[]): Record<string, any[]> {
    return { 'Unreleased': commits }
  }

  private renderVersionSection(version: string, commits: any[]): string {
    return `### ${version}\n\nChanges:\n- Initial release\n\n`
  }

  private loadTemplates(): void {
    this.templates.set('api', '# API Documentation\n\n{{content}}')
    this.templates.set('readme', '{{content}}')
    this.templates.set('component', '# Components\n\n{{content}}')
  }

  /**
   * Write generated files to disk
   */
  async writeFiles(files: GeneratedFile[]): Promise<void> {
    for (const file of files) {
      await fs.mkdir(path.dirname(file.path), { recursive: true })
      await fs.writeFile(file.path, file.content, 'utf-8')
    }
  }
}

// Singleton instance
let generatorInstance: DocumentationGenerator | null = null

export function getDocumentationGenerator(): DocumentationGenerator {
  if (!generatorInstance) {
    generatorInstance = new DocumentationGenerator()
  }
  return generatorInstance
}

export async function generateDocs(
  type: DocumentationType,
  targetPath: string,
  options?: Partial<DocumentationOptions>
): Promise<DocumentationResult> {
  const generator = getDocumentationGenerator()
  if (!generator['zai']) {
    await generator.initialize()
  }

  return generator.generate({
    id: `doc-${Date.now().toString(36)}`,
    type,
    target: { path: targetPath },
    options: {
      format: 'markdown',
      includePrivate: false,
      includeExamples: true,
      includeTypes: true,
      includeUsage: true,
      depth: 3,
      language: 'typescript',
      ...options
    },
    createdAt: new Date().toISOString()
  })
}
