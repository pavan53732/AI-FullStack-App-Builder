/**
 * Prompt Optimizer Engine
 * 
 * Optimizes prompts for better AI results through:
 * - Prompt clarity analysis
 * - Ambiguity reduction
 * - Context enrichment
 * - Example injection
 * - Constraint specification
 * - Template-based optimization
 */

import ZAI from 'z-ai-web-dev-sdk'

// Types
export interface PromptAnalysis {
  originalPrompt: string
  clarity: number // 0-1
  completeness: number // 0-1
  specificity: number // 0-1
  ambiguity: string[]
  missingContext: string[]
  suggestions: PromptSuggestion[]
  estimatedEffectiveness: number
}

export interface PromptSuggestion {
  type: 'clarity' | 'specificity' | 'context' | 'example' | 'constraint' | 'structure'
  description: string
  improvement: string
  priority: 'high' | 'medium' | 'low'
  estimatedImpact: number // 0-1
}

export interface OptimizedPrompt {
  original: string
  optimized: string
  changes: PromptChange[]
  improvementMetrics: {
    clarityImprovement: number
    specificityImprovement: number
    estimatedEffectiveness: number
  }
  template?: PromptTemplate
}

export interface PromptChange {
  type: 'added' | 'modified' | 'removed' | 'restructured'
  section: string
  before: string
  after: string
  reason: string
}

export interface PromptTemplate {
  id: string
  name: string
  category: PromptCategory
  template: string
  variables: TemplateVariable[]
  examples: TemplateExample[]
  effectiveness: number
}

export interface TemplateVariable {
  name: string
  description: string
  required: boolean
  defaultValue?: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
}

export interface TemplateExample {
  input: Record<string, any>
  output: string
}

export type PromptCategory = 
  | 'code_generation'
  | 'debugging'
  | 'refactoring'
  | 'testing'
  | 'documentation'
  | 'architecture'
  | 'optimization'
  | 'security'
  | 'general'

export interface OptimizationContext {
  taskType?: PromptCategory
  targetModel?: string
  maxTokens?: number
  preferredStyle?: 'concise' | 'detailed' | 'balanced'
  includeExamples?: boolean
  language?: string
  framework?: string
}

// Built-in templates
const BUILTIN_TEMPLATES: PromptTemplate[] = [
  {
    id: 'code-generation-basic',
    name: 'Basic Code Generation',
    category: 'code_generation',
    template: `Create a {{type}} with the following requirements:
- Name: {{name}}
- Purpose: {{purpose}}
- Features: {{features}}
{{#if constraints}}- Constraints: {{constraints}}{{/if}}
{{#if examples}}- Reference examples: {{examples}}{{/if}}

Please provide:
1. Complete implementation
2. Type definitions
3. Usage example`,
    variables: [
      { name: 'type', description: 'Component/function/class type', required: true, type: 'string' },
      { name: 'name', description: 'Name of the item to create', required: true, type: 'string' },
      { name: 'purpose', description: 'Purpose and functionality', required: true, type: 'string' },
      { name: 'features', description: 'List of features', required: true, type: 'array' },
      { name: 'constraints', description: 'Any constraints or limitations', required: false, type: 'string' },
      { name: 'examples', description: 'Reference examples', required: false, type: 'string' }
    ],
    examples: [
      {
        input: { type: 'React component', name: 'UserCard', purpose: 'Display user profile', features: ['avatar', 'name', 'email'] },
        output: 'Create a React component with the following requirements...'
      }
    ],
    effectiveness: 0.85
  },
  {
    id: 'debugging-focused',
    name: 'Debugging Assistant',
    category: 'debugging',
    template: `Analyze and fix the following issue:

**Error Description:**
{{errorDescription}}

**Error Message:**
\`\`\`
{{errorMessage}}
\`\`\`

**Code Context:**
\`\`\`{{language}}
{{codeContext}}
\`\`\`

**Expected Behavior:**
{{expectedBehavior}}

Please provide:
1. Root cause analysis
2. Step-by-step fix
3. Prevention recommendations
4. Updated code`,
    variables: [
      { name: 'errorDescription', description: 'Description of the error', required: true, type: 'string' },
      { name: 'errorMessage', description: 'The error message', required: true, type: 'string' },
      { name: 'language', description: 'Programming language', required: true, type: 'string' },
      { name: 'codeContext', description: 'Relevant code snippet', required: true, type: 'string' },
      { name: 'expectedBehavior', description: 'What should happen', required: true, type: 'string' }
    ],
    examples: [],
    effectiveness: 0.88
  },
  {
    id: 'architecture-design',
    name: 'Architecture Design',
    category: 'architecture',
    template: `Design an architecture for:

**System Name:** {{systemName}}
**Primary Purpose:** {{purpose}}

**Requirements:**
{{requirements}}

**Constraints:**
{{constraints}}

**Existing Systems:**
{{existingSystems}}

Please provide:
1. High-level architecture diagram (describe in text)
2. Component breakdown with responsibilities
3. Data flow description
4. API contracts
5. Technology recommendations
6. Scalability considerations
7. Security considerations`,
    variables: [
      { name: 'systemName', description: 'Name of the system', required: true, type: 'string' },
      { name: 'purpose', description: 'Primary purpose', required: true, type: 'string' },
      { name: 'requirements', description: 'Functional requirements', required: true, type: 'array' },
      { name: 'constraints', description: 'Technical constraints', required: false, type: 'array', defaultValue: 'None specified' },
      { name: 'existingSystems', description: 'Systems to integrate with', required: false, type: 'array', defaultValue: 'None' }
    ],
    examples: [],
    effectiveness: 0.82
  },
  {
    id: 'refactoring-request',
    name: 'Refactoring Request',
    category: 'refactoring',
    template: `Refactor the following code:

**Current Code:**
\`\`\`{{language}}
{{currentCode}}
\`\`\`

**Refactoring Goals:**
{{goals}}

**Constraints:**
- Maintain existing functionality
- {{additionalConstraints}}

Please provide:
1. Refactored code
2. Explanation of changes
3. Benefits achieved
4. Any breaking changes (if applicable)`,
    variables: [
      { name: 'language', description: 'Programming language', required: true, type: 'string' },
      { name: 'currentCode', description: 'Code to refactor', required: true, type: 'string' },
      { name: 'goals', description: 'Refactoring goals', required: true, type: 'array' },
      { name: 'additionalConstraints', description: 'Additional constraints', required: false, type: 'string', defaultValue: 'No additional constraints' }
    ],
    examples: [],
    effectiveness: 0.84
  }
]

// Ambiguity patterns to detect
const AMBIGUITY_PATTERNS = [
  { pattern: /\b(some|any|few|many|several|various)\b/gi, type: 'quantifier', suggestion: 'Specify exact number or range' },
  { pattern: /\b(good|bad|better|worse|nice|simple|complex)\b/gi, type: 'subjective', suggestion: 'Use specific, measurable criteria' },
  { pattern: /\b(fast|slow|efficient|optimized)\b/gi, type: 'performance', suggestion: 'Specify performance requirements numerically' },
  { pattern: /\b(properly|correctly|appropriately)\b/gi, type: 'manner', suggestion: 'Describe specific expected behavior' },
  { pattern: /\b(it|this|that|these|those)\b/gi, type: 'reference', suggestion: 'Use specific names instead of pronouns' },
  { pattern: /\b(etc|and so on|and more|among others)\b/gi, type: 'incomplete', suggestion: 'List all items explicitly' }
]

/**
 * Prompt Optimizer Engine
 */
export class PromptOptimizer {
  private zai: any = null
  private templates: Map<string, PromptTemplate> = new Map()
  private optimizationHistory: Map<string, OptimizedPrompt[]> = new Map()

  constructor() {
    // Load built-in templates
    BUILTIN_TEMPLATES.forEach(template => {
      this.templates.set(template.id, template)
    })
  }

  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
  }

  /**
   * Analyze a prompt for optimization opportunities
   */
  async analyzePrompt(prompt: string): Promise<PromptAnalysis> {
    const analysis: PromptAnalysis = {
      originalPrompt: prompt,
      clarity: 0,
      completeness: 0,
      specificity: 0,
      ambiguity: [],
      missingContext: [],
      suggestions: [],
      estimatedEffectiveness: 0
    }

    // Check for ambiguity
    for (const { pattern, type, suggestion } of AMBIGUITY_PATTERNS) {
      const matches = prompt.match(pattern)
      if (matches) {
        matches.forEach(match => {
          analysis.ambiguity.push(`"${match}" - ${suggestion}`)
        })
      }
    }

    // Check for missing context
    const hasLanguage = /\b(typescript|javascript|python|java|go|rust|react|vue|angular)\b/i.test(prompt)
    if (!hasLanguage) {
      analysis.missingContext.push('Programming language/framework not specified')
    }

    const hasGoal = /\b(create|build|implement|fix|refactor|optimize|design)\b/i.test(prompt)
    if (!hasGoal) {
      analysis.missingContext.push('Clear action/goal not specified')
    }

    const hasConstraints = /\b(must|should|constraint|requirement|limitation|budget)\b/i.test(prompt)
    if (!hasConstraints) {
      analysis.missingContext.push('Constraints or requirements not specified')
    }

    const hasOutput = /\b(provide|return|output|result|deliverable)\b/i.test(prompt)
    if (!hasOutput) {
      analysis.missingContext.push('Expected output format not specified')
    }

    // Calculate metrics
    const wordCount = prompt.split(/\s+/).length
    const sentenceCount = prompt.split(/[.!?]+/).filter(s => s.trim()).length
    
    // Clarity: inversely related to ambiguity
    analysis.clarity = Math.max(0, 1 - (analysis.ambiguity.length * 0.1))
    
    // Completeness: based on missing context
    analysis.completeness = Math.max(0, 1 - (analysis.missingContext.length * 0.15))
    
    // Specificity: based on details present
    const specificityIndicators = [
      /\d+/, // numbers
      /\b[A-Z][a-z]+[A-Z]/, // camelCase
      /```/, // code blocks
      /\[.*\]/, // lists
      /\{.*\}/ // objects
    ]
    const specificityMatches = specificityIndicators.filter(p => p.test(prompt)).length
    analysis.specificity = Math.min(1, specificityMatches * 0.2 + (wordCount > 50 ? 0.2 : 0))

    // Generate suggestions
    if (analysis.ambiguity.length > 0) {
      analysis.suggestions.push({
        type: 'clarity',
        description: 'Remove ambiguous terms',
        improvement: 'Replace vague terms with specific values',
        priority: 'high',
        estimatedImpact: 0.2
      })
    }

    if (analysis.missingContext.length > 0) {
      analysis.suggestions.push({
        type: 'context',
        description: 'Add missing context',
        improvement: 'Specify language, framework, and constraints',
        priority: 'high',
        estimatedImpact: 0.25
      })
    }

    if (wordCount < 30) {
      analysis.suggestions.push({
        type: 'structure',
        description: 'Expand the prompt',
        improvement: 'Add more details about requirements and expected output',
        priority: 'medium',
        estimatedImpact: 0.15
      })
    }

    if (!prompt.includes('```') && prompt.length > 100) {
      analysis.suggestions.push({
        type: 'example',
        description: 'Add code examples',
        improvement: 'Include example inputs/outputs or reference code',
        priority: 'medium',
        estimatedImpact: 0.2
      })
    }

    // Calculate estimated effectiveness
    analysis.estimatedEffectiveness = 
      (analysis.clarity * 0.35) +
      (analysis.completeness * 0.35) +
      (analysis.specificity * 0.30)

    return analysis
  }

  /**
   * Optimize a prompt using AI and templates
   */
  async optimizePrompt(
    prompt: string,
    context?: OptimizationContext
  ): Promise<OptimizedPrompt> {
    const analysis = await this.analyzePrompt(prompt)
    const changes: PromptChange[] = []
    let optimized = prompt

    // Apply template if applicable
    const matchingTemplate = this.findMatchingTemplate(prompt, context?.taskType)
    
    if (matchingTemplate && context?.taskType) {
      const templateResult = this.applyTemplate(prompt, matchingTemplate)
      if (templateResult) {
        changes.push({
          type: 'restructured',
          section: 'structure',
          before: prompt,
          after: templateResult,
          reason: `Applied ${matchingTemplate.name} template for better structure`
        })
        optimized = templateResult
      }
    } else {
      // Apply individual optimizations
      
      // Fix ambiguity
      if (analysis.ambiguity.length > 0) {
        const clarified = await this.clarifyPrompt(optimized, analysis.ambiguity)
        if (clarified !== optimized) {
          changes.push({
            type: 'modified',
            section: 'clarity',
            before: optimized,
            after: clarified,
            reason: 'Removed ambiguous terms'
          })
          optimized = clarified
        }
      }

      // Add missing context
      if (context) {
        const enriched = this.enrichContext(optimized, context)
        if (enriched !== optimized) {
          changes.push({
            type: 'added',
            section: 'context',
            before: optimized,
            after: enriched,
            reason: 'Added missing context information'
          })
          optimized = enriched
        }
      }

      // Add structure if missing
      if (!optimized.includes('\n\n') && optimized.length > 100) {
        const structured = this.addStructure(optimized)
        changes.push({
          type: 'restructured',
          section: 'format',
          before: optimized,
          after: structured,
          reason: 'Added structure for better AI understanding'
        })
        optimized = structured
      }

      // Add output specification
      if (!analysis.missingContext.includes('Expected output format not specified')) {
        const withOutput = this.addOutputSpec(optimized)
        if (withOutput !== optimized) {
          changes.push({
            type: 'added',
            section: 'output',
            before: optimized,
            after: withOutput,
            reason: 'Added output specification'
          })
          optimized = withOutput
        }
      }
    }

    const result: OptimizedPrompt = {
      original: prompt,
      optimized,
      changes,
      improvementMetrics: {
        clarityImprovement: 0,
        specificityImprovement: 0,
        estimatedEffectiveness: 0
      },
      template: matchingTemplate
    }

    // Re-analyze optimized prompt
    const newAnalysis = await this.analyzePrompt(optimized)
    result.improvementMetrics = {
      clarityImprovement: newAnalysis.clarity - analysis.clarity,
      specificityImprovement: newAnalysis.specificity - analysis.specificity,
      estimatedEffectiveness: newAnalysis.estimatedEffectiveness
    }

    // Store in history
    const historyKey = prompt.slice(0, 50)
    if (!this.optimizationHistory.has(historyKey)) {
      this.optimizationHistory.set(historyKey, [])
    }
    this.optimizationHistory.get(historyKey)!.push(result)

    return result
  }

  /**
   * Find a matching template for the prompt
   */
  private findMatchingTemplate(prompt: string, taskType?: PromptCategory): PromptTemplate | undefined {
    if (taskType) {
      const templates = Array.from(this.templates.values())
        .filter(t => t.category === taskType)
        .sort((a, b) => b.effectiveness - a.effectiveness)
      return templates[0]
    }

    // Try to infer category from prompt
    const lowerPrompt = prompt.toLowerCase()
    
    if (lowerPrompt.includes('create') || lowerPrompt.includes('build') || lowerPrompt.includes('implement')) {
      return this.templates.get('code-generation-basic')
    }
    if (lowerPrompt.includes('debug') || lowerPrompt.includes('fix') || lowerPrompt.includes('error')) {
      return this.templates.get('debugging-focused')
    }
    if (lowerPrompt.includes('refactor') || lowerPrompt.includes('improve') || lowerPrompt.includes('clean')) {
      return this.templates.get('refactoring-request')
    }
    if (lowerPrompt.includes('architecture') || lowerPrompt.includes('design') || lowerPrompt.includes('system')) {
      return this.templates.get('architecture-design')
    }

    return undefined
  }

  /**
   * Apply a template to a prompt
   */
  private applyTemplate(prompt: string, template: PromptTemplate): string | null {
    // Extract variables from prompt
    const variables: Record<string, any> = {}
    
    // Simple extraction based on common patterns
    const words = prompt.split(/\s+/)
    
    // Try to extract type
    const typeMatch = prompt.match(/(?:create|build|implement)\s+(?:a\s+)?(\w+(?:\s+\w+)?)/i)
    if (typeMatch) {
      variables.type = typeMatch[1]
      variables.name = typeMatch[1]
    }

    // Extract purpose (everything after "that" or "for" or "to")
    const purposeMatch = prompt.match(/(?:that|for|to)\s+(.+?)(?:\.|with|using|$)/i)
    if (purposeMatch) {
      variables.purpose = purposeMatch[1]
    }

    // Extract features if listed
    const featuresMatch = prompt.match(/(?:features?|with|including):\s*(.+?)(?:\.|$)/i)
    if (featuresMatch) {
      variables.features = featuresMatch[1].split(/,\s*|\s+and\s+/)
    }

    // If we have enough variables, apply template
    if (Object.keys(variables).length >= 2) {
      let result = template.template
      
      // Replace variables
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
        result = result.replace(regex, String(value))
      }

      // Remove unreplaced required variable markers
      result = result.replace(/\{\{[^}]+\}\}/g, '[specify]')
      
      // Clean up conditional blocks
      result = result.replace(/\{\{#if[^}]+\}\}[\s\S]*?\{\{\/if\}\}/g, '')

      return result
    }

    return null
  }

  /**
   * Clarify ambiguous terms in prompt
   */
  private async clarifyPrompt(prompt: string, ambiguities: string[]): Promise<string> {
    let clarified = prompt

    // Simple replacements for common ambiguities
    const replacements: [RegExp, string][] = [
      [/\bsome\b/gi, 'specific'],
      [/\bmany\b/gi, 'multiple'],
      [/\bfew\b/gi, '3-5'],
      [/\bfast\b/gi, 'high-performance'],
      [/\bsimple\b/gi, 'straightforward'],
      [/\bgood\b/gi, 'well-implemented'],
      [/\bproperly\b/gi, 'according to specifications'],
      [/\betc\b/gi, 'and others']
    ]

    for (const [pattern, replacement] of replacements) {
      if (pattern.test(clarified)) {
        clarified = clarified.replace(pattern, replacement)
      }
    }

    return clarified
  }

  /**
   * Enrich prompt with context
   */
  private enrichContext(prompt: string, context: OptimizationContext): string {
    const additions: string[] = []

    if (context.language && !prompt.toLowerCase().includes(context.language.toLowerCase())) {
      additions.push(`Language/Framework: ${context.language}`)
    }

    if (context.framework && !prompt.toLowerCase().includes(context.framework.toLowerCase())) {
      additions.push(`Framework: ${context.framework}`)
    }

    if (context.maxTokens) {
      additions.push(`Response length: approximately ${context.maxTokens} tokens`)
    }

    if (context.preferredStyle) {
      additions.push(`Style: ${context.preferredStyle}`)
    }

    if (additions.length === 0) {
      return prompt
    }

    return `${prompt}\n\nContext:\n${additions.join('\n')}`
  }

  /**
   * Add structure to a prompt
   */
  private addStructure(prompt: string): string {
    // Split into sentences
    const sentences = prompt.match(/[^.!?]+[.!?]+/g) || [prompt]
    
    if (sentences.length < 2) {
      return prompt
    }

    // Identify different parts
    const goalSentence = sentences.find(s => 
      /\b(create|build|implement|fix|refactor|optimize|design)\b/i.test(s)
    )
    const constraintSentences = sentences.filter(s =>
      /\b(must|should|need|require|constraint|limitation)\b/i.test(s)
    )
    const otherSentences = sentences.filter(s => 
      s !== goalSentence && !constraintSentences.includes(s)
    )

    // Reconstruct with structure
    const parts: string[] = []
    
    if (goalSentence) {
      parts.push(`**Task:**\n${goalSentence.trim()}`)
    }
    
    if (otherSentences.length > 0) {
      parts.push(`**Details:**\n${otherSentences.map(s => s.trim()).join('\n')}`)
    }
    
    if (constraintSentences.length > 0) {
      parts.push(`**Requirements:**\n${constraintSentences.map(s => `- ${s.trim()}`).join('\n')}`)
    }

    return parts.join('\n\n')
  }

  /**
   * Add output specification to prompt
   */
  private addOutputSpec(prompt: string): string {
    if (/\b(provide|return|output|result|deliverable)\b/i.test(prompt)) {
      return prompt
    }

    const outputSpec = `

**Expected Output:**
- Complete implementation
- Code comments where necessary
- Usage example`

    return prompt + outputSpec
  }

  /**
   * Add a custom template
   */
  addTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template)
  }

  /**
   * Get all templates
   */
  getTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: PromptCategory): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category)
  }

  /**
   * Get optimization history
   */
  getHistory(prompt?: string): OptimizedPrompt[] {
    if (prompt) {
      const key = prompt.slice(0, 50)
      return this.optimizationHistory.get(key) || []
    }
    
    const allHistory: OptimizedPrompt[] = []
    this.optimizationHistory.forEach(prompts => {
      allHistory.push(...prompts)
    })
    return allHistory
  }

  /**
   * Generate prompt from requirements
   */
  generateFromRequirements(requirements: {
    task: string
    type?: string
    features?: string[]
    constraints?: string[]
    language?: string
    framework?: string
  }): string {
    const parts: string[] = []

    parts.push(`${requirements.task}`)

    if (requirements.type) {
      parts[0] = `Create a ${requirements.type} that ${requirements.task.toLowerCase()}`
    }

    if (requirements.features && requirements.features.length > 0) {
      parts.push(`\nFeatures:\n${requirements.features.map(f => `- ${f}`).join('\n')}`)
    }

    if (requirements.constraints && requirements.constraints.length > 0) {
      parts.push(`\nConstraints:\n${requirements.constraints.map(c => `- ${c}`).join('\n')}`)
    }

    if (requirements.language || requirements.framework) {
      const tech: string[] = []
      if (requirements.language) tech.push(requirements.language)
      if (requirements.framework) tech.push(requirements.framework)
      parts.push(`\nTechnology: ${tech.join(' with ')}`)
    }

    parts.push(`\nPlease provide complete implementation with comments and usage example.`)

    return parts.join('\n')
  }

  /**
   * Compare two prompts for effectiveness
   */
  async comparePrompts(prompt1: string, prompt2: string): Promise<{
    prompt1: PromptAnalysis
    prompt2: PromptAnalysis
    recommendation: string
  }> {
    const analysis1 = await this.analyzePrompt(prompt1)
    const analysis2 = await this.analyzePrompt(prompt2)

    const effectiveness1 = analysis1.estimatedEffectiveness
    const effectiveness2 = analysis2.estimatedEffectiveness

    let recommendation: string
    if (effectiveness1 > effectiveness2 + 0.1) {
      recommendation = 'Prompt 1 is significantly better structured and more likely to produce good results.'
    } else if (effectiveness2 > effectiveness1 + 0.1) {
      recommendation = 'Prompt 2 is significantly better structured and more likely to produce good results.'
    } else if (effectiveness1 > effectiveness2) {
      recommendation = 'Prompt 1 is slightly better, but both should work well.'
    } else if (effectiveness2 > effectiveness1) {
      recommendation = 'Prompt 2 is slightly better, but both should work well.'
    } else {
      recommendation = 'Both prompts have similar quality and should produce comparable results.'
    }

    return {
      prompt1: analysis1,
      prompt2: analysis2,
      recommendation
    }
  }
}

// Singleton instance
let optimizerInstance: PromptOptimizer | null = null

export async function getPromptOptimizer(): Promise<PromptOptimizer> {
  if (!optimizerInstance) {
    optimizerInstance = new PromptOptimizer()
    await optimizerInstance.initialize()
  }
  return optimizerInstance
}

// Export types
export type {
  PromptAnalysis,
  PromptSuggestion,
  OptimizedPrompt,
  PromptChange,
  PromptTemplate,
  TemplateVariable,
  TemplateExample,
  PromptCategory,
  OptimizationContext
}
