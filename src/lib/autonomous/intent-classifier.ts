/**
 * Prompt Intent Classifier
 * 
 * Classifies user prompts to understand:
 * - Intent type (create, modify, debug, explain, etc.)
 * - Ambiguity level
 * - Feature requests extraction
 * - Goal reconstruction
 * - Confidence scoring
 */

import ZAI from 'z-ai-web-dev-sdk'

// Intent Types
export type IntentType = 
  | 'create_app'        // Build a new application
  | 'create_feature'    // Add a feature to existing app
  | 'modify_code'       // Modify existing code
  | 'fix_bug'           // Debug and fix issues
  | 'explain_code'      // Explain how code works
  | 'refactor'          // Improve code structure
  | 'optimize'          // Improve performance
  | 'test'              // Generate or run tests
  | 'deploy'            // Deploy application
  | 'document'          // Generate documentation
  | 'security_audit'    // Security analysis
  | 'unknown'           // Unclear intent

// Intent Classification Result
export interface IntentClassification {
  primaryIntent: IntentType
  secondaryIntents: IntentType[]
  confidence: number
  ambiguityScore: number         // 0-1, higher = more ambiguous
  extractedFeatures: string[]    // Features requested
  extractedEntities: Entity[]    // Named entities found
  goalReconstruction: string     // Reconstructed user goal
  suggestedClarifications: string[]  // Questions if ambiguous
  constraints: string[]          // Implied constraints
  technologyHints: string[]      // Technology mentions
  complexityEstimate: 'simple' | 'moderate' | 'complex' | 'very_complex'
  estimatedSteps: number         // Estimated implementation steps
}

export interface Entity {
  type: 'component' | 'page' | 'api' | 'database' | 'service' | 'library' | 'pattern'
  name: string
  context?: string
}

export interface PromptAnalysis {
  classification: IntentClassification
  keywords: string[]
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent'
  urgency: 'low' | 'medium' | 'high'
  domain: string[]
}

// Intent patterns for classification
const INTENT_PATTERNS: Record<IntentType, {
  patterns: RegExp[]
  keywords: string[]
  priority: number
}> = {
  create_app: {
    patterns: [
      /create\s+(a\s+)?(new\s+)?(app|application|website|project)/i,
      /build\s+(a\s+)?(new\s+)?(app|application|website)/i,
      /make\s+(me\s+)?(a\s+)?(app|application)/i,
      /I\s+want\s+(to\s+)?(create|build|make)/i,
      /develop\s+(a\s+)?(new\s+)?/i
    ],
    keywords: ['create', 'build', 'make', 'new app', 'new project', 'develop'],
    priority: 10
  },
  create_feature: {
    patterns: [
      /add\s+(a\s+)?(new\s+)?(feature|functionality|capability)/i,
      /implement\s+(a\s+)?(new\s+)?/i,
      /I\s+need\s+(a\s+)?/i,
      /include\s+(a\s+)?/i
    ],
    keywords: ['add', 'feature', 'implement', 'include', 'integrate'],
    priority: 9
  },
  modify_code: {
    patterns: [
      /change\s+(the\s+)?/i,
      /modify\s+(the\s+)?/i,
      /update\s+(the\s+)?/i,
      /edit\s+(the\s+)?/i,
      /alter\s+/i
    ],
    keywords: ['change', 'modify', 'update', 'edit', 'alter', 'replace'],
    priority: 8
  },
  fix_bug: {
    patterns: [
      /fix\s+(the\s+)?(bug|error|issue|problem)/i,
      /debug\s+/i,
      /not\s+working/i,
      /broken/i,
      /error\s+(in|when)/i,
      /crash/i,
      /exception/i
    ],
    keywords: ['fix', 'bug', 'error', 'debug', 'issue', 'problem', 'broken', 'crash'],
    priority: 9
  },
  explain_code: {
    patterns: [
      /explain\s+(how|what|why)/i,
      /what\s+does\s+/i,
      /how\s+does\s+/i,
      /tell\s+me\s+about/i,
      /describe\s+/i
    ],
    keywords: ['explain', 'how', 'what', 'why', 'describe', 'tell me'],
    priority: 5
  },
  refactor: {
    patterns: [
      /refactor\s+/i,
      /improve\s+(the\s+)?(code|structure)/i,
      /clean\s+up\s+/i,
      /restructure/i,
      /reorganize/i
    ],
    keywords: ['refactor', 'improve', 'clean', 'restructure', 'reorganize', 'optimize'],
    priority: 6
  },
  optimize: {
    patterns: [
      /optimize\s+/i,
      /speed\s+up/i,
      /make\s+(it\s+)?faster/i,
      /improve\s+performance/i,
      /reduce\s+(load\s+)?time/i
    ],
    keywords: ['optimize', 'performance', 'faster', 'speed', 'efficient'],
    priority: 7
  },
  test: {
    patterns: [
      /(write|create|generate)\s+(tests?|test\s+cases)/i,
      /test\s+(the\s+)?/i,
      /unit\s+test/i,
      /integration\s+test/i
    ],
    keywords: ['test', 'testing', 'unit test', 'integration test', 'coverage'],
    priority: 6
  },
  deploy: {
    patterns: [
      /deploy\s+/i,
      /publish\s+/i,
      /release\s+/i,
      /ship\s+/i,
      /host\s+/i
    ],
    keywords: ['deploy', 'publish', 'release', 'ship', 'host', 'production'],
    priority: 8
  },
  document: {
    patterns: [
      /document\s+/i,
      /generate\s+(docs|documentation)/i,
      /add\s+comments/i,
      /create\s+(api\s+)?docs/i
    ],
    keywords: ['document', 'docs', 'documentation', 'comments', 'readme'],
    priority: 4
  },
  security_audit: {
    patterns: [
      /security\s+(audit|check|scan)/i,
      /vulnerability\s+/i,
      /secure\s+/i,
      /penetration\s+test/i
    ],
    keywords: ['security', 'vulnerability', 'secure', 'audit', 'penetration'],
    priority: 8
  },
  unknown: {
    patterns: [],
    keywords: [],
    priority: 0
  }
}

// Technology detection patterns
const TECHNOLOGY_PATTERNS: Record<string, RegExp[]> = {
  'React': [/react/i, /reactjs/i, /jsx/i, /tsx/i],
  'Next.js': [/next\.?js/i, /nextjs/i],
  'Vue': [/vue\.?js/i, /vuejs/i],
  'Angular': [/angular/i],
  'TypeScript': [/typescript/i, /\bts\b/i],
  'JavaScript': [/javascript/i, /\bjs\b/i],
  'Node.js': [/node\.?js/i, /nodejs/i, /express/i],
  'Python': [/python/i, /django/i, /flask/i],
  'Database': [/database/i, /sql/i, /mongodb/i, /postgres/i, /mysql/i],
  'API': [/api/i, /rest/i, /graphql/i],
  'Authentication': [/auth/i, /login/i, /oauth/i, /jwt/i],
  'Docker': [/docker/i, /container/i],
  'AWS': [/aws/i, /amazon/i, /s3/i, /lambda/i],
  'Mobile': [/mobile/i, /ios/i, /android/i, /react native/i, /flutter/i]
}

/**
 * Prompt Intent Classifier
 */
export class PromptIntentClassifier {
  private zai: any = null
  private classificationHistory: Map<string, PromptAnalysis> = new Map()

  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
  }

  /**
   * Classify a prompt
   */
  async classify(prompt: string): Promise<PromptAnalysis> {
    // Check cache
    const cached = this.classificationHistory.get(prompt)
    if (cached) return cached

    // Pattern-based classification
    const patternResult = this.classifyByPatterns(prompt)
    
    // Extract entities
    const entities = this.extractEntities(prompt)
    
    // Extract features
    const features = this.extractFeatures(prompt)
    
    // Detect technologies
    const technologies = this.detectTechnologies(prompt)
    
    // Calculate ambiguity
    const ambiguity = this.calculateAmbiguity(prompt, patternResult)
    
    // Reconstruct goal
    const goal = await this.reconstructGoal(prompt, patternResult, features)
    
    // Estimate complexity
    const complexity = this.estimateComplexity(prompt, features, entities)
    
    // Generate clarifications if needed
    const clarifications = this.generateClarifications(prompt, ambiguity, patternResult)
    
    // Determine sentiment and urgency
    const sentiment = this.analyzeSentiment(prompt)
    const urgency = this.analyzeUrgency(prompt)
    
    // Detect domain
    const domain = this.detectDomain(prompt, technologies)

    const analysis: PromptAnalysis = {
      classification: {
        primaryIntent: patternResult.primary,
        secondaryIntents: patternResult.secondary,
        confidence: patternResult.confidence,
        ambiguityScore: ambiguity,
        extractedFeatures: features,
        extractedEntities: entities,
        goalReconstruction: goal,
        suggestedClarifications: clarifications,
        constraints: this.extractConstraints(prompt),
        technologyHints: technologies,
        complexityEstimate: complexity.level,
        estimatedSteps: complexity.steps
      },
      keywords: this.extractKeywords(prompt),
      sentiment,
      urgency,
      domain
    }

    // Cache result
    this.classificationHistory.set(prompt, analysis)

    return analysis
  }

  /**
   * Classify by pattern matching
   */
  private classifyByPatterns(prompt: string): {
    primary: IntentType
    secondary: IntentType[]
    confidence: number
  } {
    const scores: Map<IntentType, number> = new Map()
    
    for (const [intent, config] of Object.entries(INTENT_PATTERNS)) {
      if (intent === 'unknown') continue
      
      let score = 0
      
      // Check patterns
      for (const pattern of config.patterns) {
        if (pattern.test(prompt)) {
          score += config.priority
        }
      }
      
      // Check keywords
      const lowerPrompt = prompt.toLowerCase()
      for (const keyword of config.keywords) {
        if (lowerPrompt.includes(keyword.toLowerCase())) {
          score += 1
        }
      }
      
      if (score > 0) {
        scores.set(intent as IntentType, score)
      }
    }

    // Sort by score
    const sorted = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])

    if (sorted.length === 0) {
      return { primary: 'unknown', secondary: [], confidence: 0 }
    }

    const primary = sorted[0][0]
    const secondary = sorted.slice(1, 3).map(([intent]) => intent)
    
    // Calculate confidence
    const totalScore = sorted.reduce((sum, [, score]) => sum + score, 0)
    const confidence = Math.min(sorted[0][1] / (totalScore + 1), 1)

    return { primary, secondary, confidence }
  }

  /**
   * Extract entities from prompt
   */
  private extractEntities(prompt: string): Entity[] {
    const entities: Entity[] = []
    
    // Component patterns
    const componentMatches = prompt.matchAll(/(?:create|add|build)\s+(?:a\s+)?(?:new\s+)?(\w+)\s+(?:component|page|screen|modal|form|table|list|card|button|input)/gi)
    for (const match of componentMatches) {
      entities.push({ type: 'component', name: match[1], context: match[0] })
    }
    
    // API patterns
    const apiMatches = prompt.matchAll(/(?:api|endpoint|route)\s+(?:for\s+)?(\w+)/gi)
    for (const match of apiMatches) {
      entities.push({ type: 'api', name: match[1], context: match[0] })
    }
    
    // Database patterns
    const dbMatches = prompt.matchAll(/(?:database|table|schema|model)\s+(?:for\s+)?(\w+)/gi)
    for (const match of dbMatches) {
      entities.push({ type: 'database', name: match[1], context: match[0] })
    }
    
    // Page patterns
    const pageMatches = prompt.matchAll(/(?:page|screen|view)\s+(?:for\s+)?(\w+)/gi)
    for (const match of pageMatches) {
      entities.push({ type: 'page', name: match[1], context: match[0] })
    }

    return entities
  }

  /**
   * Extract features from prompt
   */
  private extractFeatures(prompt: string): string[] {
    const features: string[] = []
    
    // Feature patterns
    const patterns = [
      /(?:with|including|having)\s+(\w+(?:\s+\w+){0,3})/gi,
      /(?:add|include|implement)\s+(\w+(?:\s+\w+){0,3})/gi,
      /(\w+)\s+(?:functionality|feature|capability)/gi
    ]
    
    for (const pattern of patterns) {
      const matches = prompt.matchAll(pattern)
      for (const match of matches) {
        const feature = match[1].trim().toLowerCase()
        if (feature.length > 2 && !features.includes(feature)) {
          features.push(feature)
        }
      }
    }
    
    // Common feature keywords
    const featureKeywords = [
      'authentication', 'login', 'signup', 'logout',
      'search', 'filter', 'sort', 'pagination',
      'upload', 'download', 'export', 'import',
      'notification', 'email', 'sms',
      'payment', 'checkout', 'cart',
      'comment', 'review', 'rating',
      'share', 'like', 'bookmark',
      'profile', 'settings', 'dashboard',
      'analytics', 'reporting', 'charts',
      'dark mode', 'light mode', 'theme',
      'responsive', 'mobile', 'desktop'
    ]
    
    const lowerPrompt = prompt.toLowerCase()
    for (const keyword of featureKeywords) {
      if (lowerPrompt.includes(keyword) && !features.includes(keyword)) {
        features.push(keyword)
      }
    }

    return features
  }

  /**
   * Detect technologies mentioned
   */
  private detectTechnologies(prompt: string): string[] {
    const technologies: string[] = []
    
    for (const [tech, patterns] of Object.entries(TECHNOLOGY_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(prompt)) {
          if (!technologies.includes(tech)) {
            technologies.push(tech)
          }
          break
        }
      }
    }

    return technologies
  }

  /**
   * Calculate ambiguity score
   */
  private calculateAmbiguity(
    prompt: string,
    patternResult: { primary: IntentType; confidence: number }
  ): number {
    let ambiguity = 0

    // Low confidence = ambiguous
    ambiguity += (1 - patternResult.confidence) * 0.4

    // Short prompts are often ambiguous
    if (prompt.split(' ').length < 5) {
      ambiguity += 0.3
    }

    // Vague words
    const vagueWords = ['something', 'thing', 'stuff', 'it', 'that', 'similar', 'like']
    const lowerPrompt = prompt.toLowerCase()
    for (const word of vagueWords) {
      if (lowerPrompt.includes(word)) {
        ambiguity += 0.1
      }
    }

    // Questions without specifics
    if (prompt.includes('?') && !patternResult.extractedEntities) {
      ambiguity += 0.2
    }

    // Unknown intent
    if (patternResult.primary === 'unknown') {
      ambiguity += 0.4
    }

    return Math.min(ambiguity, 1)
  }

  /**
   * Reconstruct user goal using AI
   */
  private async reconstructGoal(
    prompt: string,
    patternResult: { primary: IntentType; secondary: IntentType[] },
    features: string[]
  ): Promise<string> {
    // Simple reconstruction without AI
    const intent = patternResult.primary.replace('_', ' ')
    const featureList = features.length > 0 ? ` with ${features.join(', ')}` : ''
    
    return `User wants to ${intent}${featureList}`
  }

  /**
   * Estimate complexity
   */
  private estimateComplexity(
    prompt: string,
    features: string[],
    entities: Entity[]
  ): { level: 'simple' | 'moderate' | 'complex' | 'very_complex'; steps: number } {
    let score = 0
    
    // Feature count
    score += features.length * 2
    
    // Entity count
    score += entities.length * 3
    
    // Prompt length
    score += Math.floor(prompt.split(' ').length / 10)
    
    // Complexity keywords
    const complexWords = ['integrate', 'connect', 'sync', 'real-time', 'multi', 'advanced', 'complex']
    const lowerPrompt = prompt.toLowerCase()
    for (const word of complexWords) {
      if (lowerPrompt.includes(word)) {
        score += 3
      }
    }

    // Determine level
    let level: 'simple' | 'moderate' | 'complex' | 'very_complex'
    let steps: number
    
    if (score < 5) {
      level = 'simple'
      steps = 3
    } else if (score < 15) {
      level = 'moderate'
      steps = 8
    } else if (score < 30) {
      level = 'complex'
      steps = 15
    } else {
      level = 'very_complex'
      steps = 25
    }

    return { level, steps }
  }

  /**
   * Generate clarification questions
   */
  private generateClarifications(
    prompt: string,
    ambiguity: number,
    patternResult: { primary: IntentType; secondary: IntentType[] }
  ): string[] {
    const questions: string[] = []

    if (ambiguity > 0.5) {
      questions.push('Could you provide more details about what you want to build?')
    }

    if (patternResult.primary === 'unknown') {
      questions.push('What specific action would you like me to perform?')
    }

    if (patternResult.primary === 'create_app' && !prompt.toLowerCase().includes('app') && !prompt.toLowerCase().includes('application')) {
      questions.push('What type of application are you looking to create?')
    }

    if (!prompt.toLowerCase().includes('style') && !prompt.toLowerCase().includes('design')) {
      questions.push('Do you have any specific design preferences?')
    }

    return questions.slice(0, 3)
  }

  /**
   * Extract constraints from prompt
   */
  private extractConstraints(prompt: string): string[] {
    const constraints: string[] = []
    
    const patterns = [
      /(?:must|should|need to|have to)\s+(\w+(?:\s+\w+){0,3})/gi,
      /(?:without|no|don't|avoid)\s+(\w+(?:\s+\w+){0,3})/gi,
      /(?:only|just|exclusively)\s+(\w+(?:\s+\w+){0,3})/gi
    ]
    
    for (const pattern of patterns) {
      const matches = prompt.matchAll(pattern)
      for (const match of matches) {
        constraints.push(match[1].trim())
      }
    }

    return constraints
  }

  /**
   * Extract keywords
   */
  private extractKeywords(prompt: string): string[] {
    // Remove stop words
    const stopWords = new Set(['a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of',
      'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then',
      'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more',
      'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
      'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while',
      'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours'])
    
    const words = prompt.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
    
    // Count frequency
    const freq: Map<string, number> = new Map()
    for (const word of words) {
      freq.set(word, (freq.get(word) || 0) + 1)
    }
    
    // Sort by frequency
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)
  }

  /**
   * Analyze sentiment
   */
  private analyzeSentiment(prompt: string): 'positive' | 'neutral' | 'negative' | 'urgent' {
    const positiveWords = ['great', 'awesome', 'love', 'excellent', 'amazing', 'wonderful', 'fantastic']
    const negativeWords = ['hate', 'terrible', 'awful', 'bad', 'poor', 'horrible', 'broken', 'error', 'fail']
    const urgentWords = ['urgent', 'asap', 'immediately', 'quickly', 'fast', 'now', 'emergency', 'critical']
    
    const lowerPrompt = prompt.toLowerCase()
    
    for (const word of urgentWords) {
      if (lowerPrompt.includes(word)) {
        return 'urgent'
      }
    }
    
    let positive = 0
    let negative = 0
    
    for (const word of positiveWords) {
      if (lowerPrompt.includes(word)) positive++
    }
    
    for (const word of negativeWords) {
      if (lowerPrompt.includes(word)) negative++
    }
    
    if (positive > negative) return 'positive'
    if (negative > positive) return 'negative'
    return 'neutral'
  }

  /**
   * Analyze urgency
   */
  private analyzeUrgency(prompt: string): 'low' | 'medium' | 'high' {
    const highUrgency = ['urgent', 'asap', 'immediately', 'now', 'critical', 'emergency', 'blocking']
    const mediumUrgency = ['soon', 'quickly', 'fast', 'priority', 'important']
    
    const lowerPrompt = prompt.toLowerCase()
    
    for (const word of highUrgency) {
      if (lowerPrompt.includes(word)) {
        return 'high'
      }
    }
    
    for (const word of mediumUrgency) {
      if (lowerPrompt.includes(word)) {
        return 'medium'
      }
    }
    
    return 'low'
  }

  /**
   * Detect domain
   */
  private detectDomain(prompt: string, technologies: string[]): string[] {
    const domains: string[] = []
    const lowerPrompt = prompt.toLowerCase()
    
    const domainPatterns: Record<string, string[]> = {
      'e-commerce': ['shop', 'store', 'cart', 'product', 'checkout', 'payment', 'order'],
      'social': ['social', 'post', 'comment', 'like', 'share', 'follow', 'friend'],
      'finance': ['banking', 'payment', 'transaction', 'account', 'finance', 'money'],
      'healthcare': ['health', 'medical', 'patient', 'doctor', 'appointment', 'hospital'],
      'education': ['education', 'learning', 'course', 'student', 'teacher', 'lesson'],
      'productivity': ['task', 'todo', 'project', 'manage', 'organize', 'schedule'],
      'entertainment': ['game', 'music', 'video', 'movie', 'entertainment'],
      'real-estate': ['property', 'real estate', 'listing', 'rent', 'house', 'apartment']
    }
    
    for (const [domain, keywords] of Object.entries(domainPatterns)) {
      for (const keyword of keywords) {
        if (lowerPrompt.includes(keyword)) {
          if (!domains.includes(domain)) {
            domains.push(domain)
          }
          break
        }
      }
    }
    
    // Add technologies as domains
    domains.push(...technologies.slice(0, 3))
    
    return domains
  }

  /**
   * Get classification history
   */
  getHistory(): Map<string, PromptAnalysis> {
    return this.classificationHistory
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.classificationHistory.clear()
  }
}

// Singleton
let classifierInstance: PromptIntentClassifier | null = null

export function getIntentClassifier(): PromptIntentClassifier {
  if (!classifierInstance) {
    classifierInstance = new PromptIntentClassifier()
  }
  return classifierInstance
}

/**
 * Quick classification function
 */
export async function classifyIntent(prompt: string): Promise<PromptAnalysis> {
  const classifier = getIntentClassifier()
  return classifier.classify(prompt)
}
