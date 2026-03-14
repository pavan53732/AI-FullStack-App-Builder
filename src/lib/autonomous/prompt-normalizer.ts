/**
 * Prompt Normalizer - Normalizes prompts and enriches context
 * 
 * Implements mechanisms #5-6:
 * - #5: Prompt Normalization Pipeline
 * - #6: Context Enrichment Engine
 * 
 * Features:
 * - Whitespace and formatting normalization
 * - Terminology standardization
 * - Abbreviation expansion
 * - Common typo correction
 * - Standard format conversion
 * - Domain detection
 * - Technology stack inference
 * - Key entity identification
 * - Constraint extraction
 * - Context enrichment
 */

import ZAI from 'z-ai-web-dev-sdk'

// ============================================================================
// Types
// ============================================================================

/**
 * Represents a normalized prompt with metadata about the normalization process
 */
export interface NormalizedPrompt {
  /** The normalized prompt text */
  text: string
  /** Original prompt before normalization */
  original: string
  /** List of transformations applied */
  transformations: PromptTransformation[]
  /** Overall quality score after normalization (0-100) */
  qualityScore: number
  /** Estimated token count */
  tokenCount: number
  /** Detected language of the prompt */
  detectedLanguage: string
  /** Confidence level of the normalization */
  confidence: number
  /** Timestamp of normalization */
  timestamp: string
}

/**
 * Represents a single transformation applied to a prompt
 */
export interface PromptTransformation {
  /** Type of transformation applied */
  type: TransformationType
  /** Description of what was changed */
  description: string
  /** Original text segment (if applicable) */
  original?: string
  /** Replacement text (if applicable) */
  replacement?: string
  /** Position in the original text */
  position?: { start: number; end: number }
  /** Impact score of this transformation (0-1) */
  impact: number
}

/**
 * Types of transformations that can be applied to prompts
 */
export type TransformationType =
  | 'whitespace_cleanup'
  | 'formatting_standardization'
  | 'terminology_standardization'
  | 'abbreviation_expansion'
  | 'typo_correction'
  | 'case_normalization'
  | 'punctuation_fix'
  | 'redundancy_removal'
  | 'structure_improvement'
  | 'clarity_enhancement'

/**
 * Represents context enrichment applied to a prompt
 */
export interface ContextEnrichment {
  /** Detected domain of the prompt */
  domain: DetectedDomain
  /** Inferred technology stack */
  technologyStack: TechnologyStack
  /** Key entities identified in the prompt */
  entities: IdentifiedEntity[]
  /** Constraints extracted from the prompt */
  constraints: ExtractedConstraint[]
  /** Additional context added */
  addedContext: EnrichmentContext[]
  /** Enrichment metadata */
  metadata: EnrichmentMetadata
}

/**
 * Detected domain information
 */
export interface DetectedDomain {
  /** Primary domain category */
  primary: DomainCategory
  /** Secondary domains if applicable */
  secondary: DomainCategory[]
  /** Confidence score for domain detection */
  confidence: number
  /** Domain-specific keywords detected */
  keywords: string[]
}

/**
 * Domain categories for prompt classification
 */
export type DomainCategory =
  | 'web_development'
  | 'mobile_development'
  | 'backend_development'
  | 'frontend_development'
  | 'database'
  | 'devops'
  | 'testing'
  | 'documentation'
  | 'api_development'
  | 'data_science'
  | 'machine_learning'
  | 'security'
  | 'performance'
  | 'architecture'
  | 'general'
  | 'unknown'

/**
 * Inferred technology stack
 */
export interface TechnologyStack {
  /** Programming languages detected or inferred */
  languages: TechnologyItem[]
  /** Frameworks detected or inferred */
  frameworks: TechnologyItem[]
  /** Libraries detected or inferred */
  libraries: TechnologyItem[]
  /** Tools detected or inferred */
  tools: TechnologyItem[]
  /** Overall confidence in stack inference */
  confidence: number
}

/**
 * Technology item with confidence score
 */
export interface TechnologyItem {
  /** Name of the technology */
  name: string
  /** Category of the technology */
  category: 'language' | 'framework' | 'library' | 'tool' | 'platform'
  /** Confidence score for this detection */
  confidence: number
  /** Source of the detection */
  source: 'explicit' | 'inferred' | 'contextual'
}

/**
 * Identified entity in the prompt
 */
export interface IdentifiedEntity {
  /** Entity text */
  text: string
  /** Type of entity */
  type: EntityType
  /** Position in the prompt */
  position: { start: number; end: number }
  /** Confidence score */
  confidence: number
  /** Related entities */
  relatedTo?: string[]
}

/**
 * Types of entities that can be identified
 */
export type EntityType =
  | 'function'
  | 'class'
  | 'variable'
  | 'file'
  | 'module'
  | 'api_endpoint'
  | 'database_table'
  | 'component'
  | 'config'
  | 'error'
  | 'concept'
  | 'requirement'

/**
 * Extracted constraint from the prompt
 */
export interface ExtractedConstraint {
  /** Constraint text */
  text: string
  /** Type of constraint */
  type: ConstraintType
  /** Severity or importance level */
  severity: 'critical' | 'important' | 'optional'
  /** Position in the prompt */
  position: { start: number; end: number }
  /** Parsed value if applicable */
  value?: string | number | boolean
}

/**
 * Types of constraints that can be extracted
 */
export type ConstraintType =
  | 'performance'
  | 'security'
  | 'compatibility'
  | 'resource'
  | 'time'
  | 'format'
  | 'style'
  | 'architecture'
  | 'testing'
  | 'deployment'

/**
 * Context added during enrichment
 */
export interface EnrichmentContext {
  /** Type of context added */
  type: EnrichmentType
  /** The context content */
  content: string
  /** Source of this context */
  source: EnrichmentSource
  /** Relevance score */
  relevance: number
}

/**
 * Types of enrichment that can be added
 */
export type EnrichmentType =
  | 'domain_context'
  | 'technology_context'
  | 'best_practices'
  | 'constraints'
  | 'examples'
  | 'references'

/**
 * Source of enrichment data
 */
export type EnrichmentSource =
  | 'builtin_knowledge'
  | 'detected_patterns'
  | 'ai_inference'
  | 'user_preferences'
  | 'project_context'

/**
 * Metadata about the enrichment process
 */
export interface EnrichmentMetadata {
  /** Time taken for enrichment in ms */
  processingTime: number
  /** Number of enrichments added */
  enrichmentCount: number
  /** Sources used for enrichment */
  sourcesUsed: EnrichmentSource[]
  /** Overall enrichment quality score */
  qualityScore: number
}

/**
 * Rule for prompt normalization
 */
export interface NormalizationRule {
  /** Unique identifier for the rule */
  id: string
  /** Name of the rule */
  name: string
  /** Description of what the rule does */
  description: string
  /** Type of transformation this rule applies */
  type: TransformationType
  /** Pattern to match (regex string) */
  pattern: string
  /** Replacement pattern */
  replacement: string
  /** Priority of this rule (higher = applied first) */
  priority: number
  /** Whether this rule is enabled */
  enabled: boolean
  /** Conditions for applying this rule */
  conditions?: RuleCondition[]
}

/**
 * Condition for applying a normalization rule
 */
export interface RuleCondition {
  /** Condition type */
  type: 'contains' | 'not_contains' | 'matches' | 'domain_is'
  /** Value to check against */
  value: string
}

/**
 * Options for prompt normalization
 */
export interface NormalizationOptions {
  /** Enable whitespace cleanup */
  cleanWhitespace?: boolean
  /** Enable terminology standardization */
  standardizeTerminology?: boolean
  /** Enable abbreviation expansion */
  expandAbbreviations?: boolean
  /** Enable typo correction */
  correctTypos?: boolean
  /** Enable format standardization */
  standardizeFormat?: boolean
  /** Use AI for advanced normalization */
  useAI?: boolean
  /** Maximum tokens for the normalized prompt */
  maxTokens?: number
  /** Preserve original formatting for code blocks */
  preserveCodeBlocks?: boolean
  /** Custom normalization rules to apply */
  customRules?: NormalizationRule[]
}

/**
 * Options for context enrichment
 */
export interface EnrichmentOptions {
  /** Enable domain detection */
  detectDomain?: boolean
  /** Enable technology stack inference */
  inferTechStack?: boolean
  /** Enable entity identification */
  identifyEntities?: boolean
  /** Enable constraint extraction */
  extractConstraints?: boolean
  /** Add relevant context */
  addContext?: boolean
  /** Use AI for enrichment */
  useAI?: boolean
  /** Include examples in enrichment */
  includeExamples?: boolean
  /** Maximum additional context tokens */
  maxContextTokens?: number
}

/**
 * Result of the full normalization and enrichment pipeline
 */
export interface NormalizationResult {
  /** The fully processed prompt */
  prompt: NormalizedPrompt
  /** Context enrichment data */
  enrichment: ContextEnrichment
  /** Combined enriched prompt text */
  enrichedPrompt: string
  /** Total processing time in ms */
  processingTime: number
  /** Overall quality improvement */
  qualityImprovement: number
}

// ============================================================================
// Prompt Normalizer Class
// ============================================================================

/**
 * Prompt Normalizer class that handles prompt normalization and context enrichment
 * 
 * @example
 * ```typescript
 * const normalizer = await getPromptNormalizer();
 * const result = await normalizer.normalizeAndEnrich('create a rest api with nodejs');
 * console.log(result.enrichedPrompt);
 * ```
 */
export class PromptNormalizer {
  private zai: any = null
  private initialized: boolean = false
  private rules: Map<string, NormalizationRule> = new Map()
  private abbreviationMap: Map<string, string> = new Map()
  private terminologyMap: Map<string, string> = new Map()
  private typoCorrections: Map<string, string> = new Map()
  private domainKeywords: Map<DomainCategory, string[]> = new Map()
  private technologyPatterns: Map<string, TechnologyItem[]> = new Map()

  /**
   * Initialize the prompt normalizer
   */
  async initialize(): Promise<void> {
    if (this.initialized) return
    
    this.zai = await ZAI.create()
    this.loadBuiltInRules()
    this.loadAbbreviations()
    this.loadTerminology()
    this.loadTypoCorrections()
    this.loadDomainKeywords()
    this.loadTechnologyPatterns()
    
    this.initialized = true
  }

  /**
   * Load built-in normalization rules
   */
  private loadBuiltInRules(): void {
    const rules: NormalizationRule[] = [
      {
        id: 'multiple_spaces',
        name: 'Multiple Spaces',
        description: 'Replace multiple consecutive spaces with a single space',
        type: 'whitespace_cleanup',
        pattern: '  +',
        replacement: ' ',
        priority: 100,
        enabled: true
      },
      {
        id: 'leading_trailing_whitespace',
        name: 'Leading/Trailing Whitespace',
        description: 'Remove leading and trailing whitespace from lines',
        type: 'whitespace_cleanup',
        pattern: '^[ \\t]+|[ \\t]+$',
        replacement: '',
        priority: 99,
        enabled: true
      },
      {
        id: 'multiple_newlines',
        name: 'Multiple Newlines',
        description: 'Replace more than two consecutive newlines with two',
        type: 'whitespace_cleanup',
        pattern: '\\n{3,}',
        replacement: '\\n\\n',
        priority: 98,
        enabled: true
      },
      {
        id: 'space_before_punctuation',
        name: 'Space Before Punctuation',
        description: 'Remove spaces before punctuation marks',
        type: 'punctuation_fix',
        pattern: ' \\s*([.,!?;:])',
        replacement: '$1',
        priority: 90,
        enabled: true
      },
      {
        id: 'space_after_punctuation',
        name: 'Space After Punctuation',
        description: 'Ensure space after punctuation (except before closing quotes)',
        type: 'punctuation_fix',
        pattern: '([.,!?;:])(?=[A-Za-z])',
        replacement: '$1 ',
        priority: 89,
        enabled: true
      },
      {
        id: 'quote_normalization',
        name: 'Quote Normalization',
        description: 'Normalize curly quotes to straight quotes',
        type: 'formatting_standardization',
        pattern: "[\\u2018\\u2019\\u201C\\u201D]",
        replacement: '"',
        priority: 85,
        enabled: true
      },
      {
        id: 'dash_normalization',
        name: 'Dash Normalization',
        description: 'Normalize various dash types',
        type: 'formatting_standardization',
        pattern: "[\\u2013\\u2014]",
        replacement: '-',
        priority: 84,
        enabled: true
      },
      {
        id: 'ellipsis_normalization',
        name: 'Ellipsis Normalization',
        description: 'Normalize ellipsis characters',
        type: 'formatting_standardization',
        pattern: "\\u2026",
        replacement: '...',
        priority: 83,
        enabled: true
      },
      {
        id: 'sentence_case',
        name: 'Sentence Case Start',
        description: 'Capitalize first letter of sentences',
        type: 'case_normalization',
        pattern: '(^|[.!?]\\s+)([a-z])',
        replacement: '$1$2',
        priority: 70,
        enabled: false // Disabled by default as it may affect code
      },
      {
        id: 'remove_double_punctuation',
        name: 'Double Punctuation',
        description: 'Remove duplicate punctuation marks',
        type: 'punctuation_fix',
        pattern: '([.,!?;:])\\1+',
        replacement: '$1',
        priority: 88,
        enabled: true
      },
      {
        id: 'normalize_and',
        name: 'Normalize & to and',
        description: 'Replace ampersand with "and" in text',
        type: 'terminology_standardization',
        pattern: ' & ',
        replacement: ' and ',
        priority: 60,
        enabled: true,
        conditions: [{ type: 'not_contains', value: '```' }]
      }
    ]

    rules.forEach(rule => this.rules.set(rule.id, rule))
  }

  /**
   * Load abbreviation mappings
   */
  private loadAbbreviations(): void {
    const abbreviations: [string, string][] = [
      // Programming terms
      ['api', 'Application Programming Interface'],
      ['rest', 'Representational State Transfer'],
      ['graphql', 'Graph Query Language'],
      ['sql', 'Structured Query Language'],
      ['nosql', 'Not Only SQL'],
      ['orm', 'Object-Relational Mapping'],
      ['crud', 'Create, Read, Update, Delete'],
      ['jwt', 'JSON Web Token'],
      ['oauth', 'Open Authorization'],
      ['sdk', 'Software Development Kit'],
      ['cli', 'Command Line Interface'],
      ['gui', 'Graphical User Interface'],
      ['ui', 'User Interface'],
      ['ux', 'User Experience'],
      ['dom', 'Document Object Model'],
      ['html', 'HyperText Markup Language'],
      ['css', 'Cascading Style Sheets'],
      ['json', 'JavaScript Object Notation'],
      ['xml', 'Extensible Markup Language'],
      ['yaml', 'YAML Ain\'t Markup Language'],
      ['http', 'HyperText Transfer Protocol'],
      ['https', 'HTTP Secure'],
      ['ssl', 'Secure Sockets Layer'],
      ['tls', 'Transport Layer Security'],
      ['cdn', 'Content Delivery Network'],
      ['cicd', 'Continuous Integration/Continuous Deployment'],
      ['ci', 'Continuous Integration'],
      ['cd', 'Continuous Deployment'],
      ['tdd', 'Test-Driven Development'],
      ['bdd', 'Behavior-Driven Development'],
      ['ddd', 'Domain-Driven Design'],
      ['solid', 'Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion'],
      ['dry', 'Don\'t Repeat Yourself'],
      ['kiss', 'Keep It Simple, Stupid'],
      ['yagni', 'You Ain\'t Gonna Need It'],
      ['spa', 'Single Page Application'],
      ['ssr', 'Server-Side Rendering'],
      ['csr', 'Client-Side Rendering'],
      ['seo', 'Search Engine Optimization'],
      ['pr', 'Pull Request'],
      ['mr', 'Merge Request'],
      ['auth', 'Authentication'],
      ['db', 'Database'],
      ['env', 'Environment'],
      ['pkg', 'Package'],
      ['lib', 'Library'],
      ['fn', 'Function'],
      ['func', 'Function'],
      ['impl', 'Implementation'],
      ['init', 'Initialize'],
      ['config', 'Configuration'],
      ['doc', 'Documentation'],
      ['docs', 'Documentation'],
      ['ref', 'Reference'],
      ['dep', 'Dependency'],
      ['deps', 'Dependencies'],
      ['err', 'Error'],
      ['msg', 'Message'],
      ['params', 'Parameters'],
      ['args', 'Arguments'],
      ['ret', 'Return'],
      ['async', 'Asynchronous'],
      ['sync', 'Synchronous'],
      ['cpu', 'Central Processing Unit'],
      ['gpu', 'Graphics Processing Unit'],
      ['ram', 'Random Access Memory'],
      ['io', 'Input/Output'],
      ['url', 'Uniform Resource Locator'],
      ['uri', 'Uniform Resource Identifier'],
      ['uuid', 'Universally Unique Identifier'],
      ['id', 'Identifier'],
      ['tmp', 'Temporary'],
      ['temp', 'Temporary'],
      ['src', 'Source'],
      ['dest', 'Destination'],
      ['val', 'Value'],
      ['var', 'Variable'],
      ['const', 'Constant'],
      ['obj', 'Object'],
      ['arr', 'Array'],
      ['str', 'String'],
      ['num', 'Number'],
      ['int', 'Integer'],
      ['bool', 'Boolean'],
      ['null', 'Null'],
      ['undef', 'Undefined'],
      ['nan', 'Not a Number']
    ]

    abbreviations.forEach(([abbr, full]) => {
      this.abbreviationMap.set(abbr.toLowerCase(), full)
    })
  }

  /**
   * Load terminology standardization mappings
   */
  private loadTerminology(): void {
    const terminology: [string, string][] = [
      // Spelling variations
      ['color', 'colour'],
      ['center', 'centre'],
      ['analyze', 'analyse'],
      ['optimize', 'optimise'],
      ['organize', 'organise'],
      ['realize', 'realise'],
      ['recognize', 'recognise'],
      ['specialize', 'specialise'],
      
      // Common synonyms to standardize
      ['make a', 'create'],
      ['build a', 'create'],
      ['develop a', 'create'],
      ['implement a', 'create'],
      ['write a', 'create'],
      ['generate a', 'create'],
      ['fix the', 'fix'],
      ['solve the', 'resolve'],
      ['help me', ''],
      ['please', ''],
      ['can you', ''],
      ['could you', ''],
      ['would you', ''],
      ['i want to', ''],
      ['i need to', ''],
      ['i would like to', ''],
      
      // Technical terminology standardization
      ['js', 'JavaScript'],
      ['ts', 'TypeScript'],
      ['node', 'Node.js'],
      ['reactjs', 'React'],
      ['vuejs', 'Vue'],
      ['nextjs', 'Next.js'],
      ['nestjs', 'NestJS'],
      ['expressjs', 'Express'],
      ['postgres', 'PostgreSQL'],
      ['mongo', 'MongoDB'],
      ['redis', 'Redis'],
      ['docker', 'Docker'],
      ['kubernetes', 'Kubernetes'],
      ['k8s', 'Kubernetes'],
      ['aws', 'AWS'],
      ['gcp', 'Google Cloud Platform'],
      ['azure', 'Microsoft Azure']
    ]

    terminology.forEach(([from, to]) => {
      this.terminologyMap.set(from.toLowerCase(), to)
    })
  }

  /**
   * Load common typo corrections
   */
  private loadTypoCorrections(): void {
    const typos: [string, string][] = [
      // Common programming typos
      ['fucntion', 'function'],
      ['functon', 'function'],
      ['functin', 'function'],
      ['funciton', 'function'],
      ['funtion', 'function'],
      ['retrun', 'return'],
      ['retrn', 'return'],
      ['reurn', 'return'],
      ['retun', 'return'],
      ['impotr', 'import'],
      ['improt', 'import'],
      ['exprt', 'export'],
      ['expotr', 'export'],
      ['exprot', 'export'],
      ['conts', 'const'],
      ['conts', 'const'],
      ['vairable', 'variable'],
      ['varible', 'variable'],
      ['variabel', 'variable'],
      ['strign', 'string'],
      ['stirng', 'string'],
      ['numbre', 'number'],
      ['numbr', 'number'],
      ['boleean', 'boolean'],
      ['boolen', 'boolean'],
      ['boolan', 'boolean'],
      ['arrray', 'array'],
      ['aray', 'array'],
      ['objetc', 'object'],
      ['objcet', 'object'],
      ['obejct', 'object'],
      ['calss', 'class'],
      ['clas', 'class'],
      ['inteface', 'interface'],
      ['inerface', 'interface'],
      ['inreface', 'interface'],
      ['compnent', 'component'],
      ['componet', 'component'],
      ['componnent', 'component'],
      ['modlue', 'module'],
      ['moduel', 'module'],
      ['pakcage', 'package'],
      ['pacakge', 'package'],
      ['packge', 'package'],
      ['depndency', 'dependency'],
      ['dependancy', 'dependency'],
      ['dependecy', 'dependency'],
      ['databse', 'database'],
      ['databae', 'database'],
      ['databas', 'database'],
      ['querry', 'query'],
      ['qury', 'query'],
      ['queyr', 'query'],
      ['requeest', 'request'],
      ['reqeust', 'request'],
      ['requets', 'request'],
      ['resposne', 'response'],
      ['reponse', 'response'],
      ['responce', 'response'],
      ['endpoitn', 'endpoint'],
      ['endpont', 'endpoint'],
      ['endpoing', 'endpoint'],
      ['authenication', 'authentication'],
      ['authenticaion', 'authentication'],
      ['authetication', 'authentication'],
      ['authroization', 'authorization'],
      ['autorization', 'authorization'],
      ['authorizaton', 'authorization'],
      ['serverr', 'server'],
      ['sever', 'server'],
      ['clinet', 'client'],
      ['cliient', 'client'],
      ['frotend', 'frontend'],
      ['forntend', 'frontend'],
      ['backned', 'backend'],
      ['bakcend', 'backend'],
      ['deployemnt', 'deployment'],
      ['depolyment', 'deployment'],
      ['deployent', 'deployment'],
      ['contianer', 'container'],
      ['continer', 'container'],
      ['contaier', 'container'],
      ['documnet', 'document'],
      ['docment', 'document'],
      ['documant', 'document'],
      ['documnetation', 'documentation'],
      ['documentaion', 'documentation'],
      ['documentaton', 'documentation'],
      ['perfromance', 'performance'],
      ['performace', 'performance'],
      ['performence', 'performance'],
      ['optmization', 'optimization'],
      ['optimzation', 'optimization'],
      ['optimisation', 'optimization'],
      ['optimsation', 'optimization'],
      
      // General English typos
      ['teh', 'the'],
      ['hte', 'the'],
      ['taht', 'that'],
      ['thta', 'that'],
      ['htis', 'this'],
      ['tihs', 'this'],
      ['wiht', 'with'],
      ['wtih', 'with'],
      ['form', 'from'],
      ['form', 'from'],
      ['whihc', 'which'],
      ['whcih', 'which'],
      ['shoudl', 'should'],
      ['shoud', 'should'],
      ['woudl', 'would'],
      ['woud', 'would'],
      ['culd', 'could'],
      ['coudl', 'could'],
      ['becuase', 'because'],
      ['becasue', 'because'],
      ['beacuse', 'because'],
      ['togheter', 'together'],
      ['togethr', 'together'],
      ['togehter', 'together'],
      ['infomration', 'information'],
      ['infromation', 'information'],
      ['informaton', 'information'],
      ['enviroment', 'environment'],
      ['envrionment', 'environment'],
      ['environemnt', 'environment'],
      ['varialbe', 'variable'],
      ['varables', 'variables'],
      ['varibale', 'variable'],
      ['probelm', 'problem'],
      ['probem', 'problem'],
      ['prolem', 'problem'],
      ['soultion', 'solution'],
      ['solutoin', 'solution'],
      ['soluton', 'solution'],
      ['exmaple', 'example'],
      ['examle', 'example'],
      ['exaple', 'example'],
      ['errror', 'error'],
      ['eror', 'error'],
      ['erorr', 'error'],
      ['mesage', 'message'],
      ['messgae', 'message'],
      ['messsage', 'message'],
      ['chagne', 'change'],
      ['chnage', 'change'],
      ['chang', 'change'],
      ['udpate', 'update'],
      ['upadte', 'update'],
      ['updae', 'update'],
      ['delet', 'delete'],
      ['deltete', 'delete'],
      ['delte', 'delete'],
      ['inster', 'insert'],
      ['insrt', 'insert'],
      ['iserst', 'insert'],
      ['selec', 'select'],
      ['seelct', 'select'],
      ['slect', 'select'],
      ['connnect', 'connect'],
      ['connet', 'connect'],
      ['conect', 'connect'],
      ['dissconnect', 'disconnect'],
      ['diconnect', 'disconnect'],
      ['disconect', 'disconnect']
    ]

    typos.forEach(([typo, correct]) => {
      this.typoCorrections.set(typo.toLowerCase(), correct)
    })
  }

  /**
   * Load domain-specific keywords
   */
  private loadDomainKeywords(): void {
    const domains: [DomainCategory, string[]][] = [
      ['web_development', [
        'html', 'css', 'javascript', 'typescript', 'react', 'vue', 'angular', 'svelte',
        'next.js', 'nuxt', 'gatsby', 'website', 'webpage', 'frontend', 'browser',
        'dom', 'responsive', 'accessibility', 'seo', 'web', 'http', 'https'
      ]],
      ['mobile_development', [
        'mobile', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin',
        'xamarin', 'cordova', 'phonegap', 'app store', 'play store', 'mobile app',
        'smartphone', 'tablet', 'pwa', 'native app'
      ]],
      ['backend_development', [
        'server', 'api', 'backend', 'node.js', 'express', 'django', 'flask',
        'spring', 'rails', 'laravel', 'rest', 'graphql', 'microservice',
        'endpoint', 'middleware', 'authentication', 'authorization'
      ]],
      ['frontend_development', [
        'frontend', 'ui', 'ux', 'component', 'props', 'state', 'hooks',
        'render', 'virtual dom', 'css-in-js', 'styled-components', 'tailwind',
        'bootstrap', 'material-ui', 'antd', 'chakra'
      ]],
      ['database', [
        'database', 'sql', 'nosql', 'mysql', 'postgresql', 'mongodb', 'redis',
        'sqlite', 'oracle', 'sqlserver', 'query', 'schema', 'migration',
        'index', 'transaction', 'join', 'table', 'collection', 'document'
      ]],
      ['devops', [
        'docker', 'kubernetes', 'ci', 'cd', 'pipeline', 'deploy', 'deployment',
        'container', 'k8s', 'terraform', 'ansible', 'jenkins', 'github actions',
        'gitlab ci', 'aws', 'azure', 'gcp', 'cloud', 'infrastructure'
      ]],
      ['testing', [
        'test', 'testing', 'unit test', 'integration test', 'e2e', 'end-to-end',
        'jest', 'mocha', 'cypress', 'selenium', 'playwright', 'testing library',
        'coverage', 'mock', 'spy', 'fixture', 'snapshot', 'tdd', 'bdd'
      ]],
      ['documentation', [
        'documentation', 'readme', 'docs', 'api docs', 'swagger', 'openapi',
        'jsdoc', 'typescript docs', 'story', 'storybook', 'markdown', 'mdx',
        'comment', 'annotation', 'javadoc'
      ]],
      ['api_development', [
        'api', 'rest', 'graphql', 'grpc', 'websocket', 'endpoint', 'route',
        'controller', 'handler', 'request', 'response', 'status code',
        'middleware', 'rate limiting', 'cors', 'webhook', 'api gateway'
      ]],
      ['data_science', [
        'data', 'analysis', 'analytics', 'pandas', 'numpy', 'jupyter',
        'notebook', 'visualization', 'matplotlib', 'seaborn', 'plotly',
        'statistics', 'regression', 'classification', 'clustering'
      ]],
      ['machine_learning', [
        'machine learning', 'ml', 'ai', 'neural network', 'deep learning',
        'tensorflow', 'pytorch', 'keras', 'model', 'training', 'inference',
        'prediction', 'classification', 'regression', 'nlp', 'computer vision'
      ]],
      ['security', [
        'security', 'authentication', 'authorization', 'jwt', 'oauth', 'saml',
        'encryption', 'decryption', 'hash', 'salt', 'csrf', 'xss', 'sql injection',
        'vulnerability', 'penetration', 'https', 'ssl', 'tls', 'firewall'
      ]],
      ['performance', [
        'performance', 'optimization', 'speed', 'latency', 'throughput',
        'benchmark', 'profiling', 'caching', 'memoization', 'lazy loading',
        'code splitting', 'bundle size', 'memory leak', 'cpu', 'gpu'
      ]],
      ['architecture', [
        'architecture', 'design pattern', 'microservice', 'monolith', 'serverless',
        'event-driven', 'cqrs', 'event sourcing', 'ddd', 'clean architecture',
        'hexagonal', 'onion', 'layered', 'mvc', 'mvvm', 'solid'
      ]]
    ]

    domains.forEach(([domain, keywords]) => {
      this.domainKeywords.set(domain, keywords)
    })
  }

  /**
   * Load technology patterns for detection
   */
  private loadTechnologyPatterns(): void {
    // Map patterns to technology items
    const patterns: [string, TechnologyItem[]][] = [
      ['react|reactjs|react.js', [
        { name: 'React', category: 'framework', confidence: 0.9, source: 'explicit' }
      ]],
      ['vue|vuejs|vue.js', [
        { name: 'Vue', category: 'framework', confidence: 0.9, source: 'explicit' }
      ]],
      ['angular', [
        { name: 'Angular', category: 'framework', confidence: 0.9, source: 'explicit' }
      ]],
      ['next|nextjs|next.js', [
        { name: 'Next.js', category: 'framework', confidence: 0.9, source: 'explicit' }
      ]],
      ['typescript|\\bts\\b', [
        { name: 'TypeScript', category: 'language', confidence: 0.95, source: 'explicit' }
      ]],
      ['javascript|\\bjs\\b', [
        { name: 'JavaScript', category: 'language', confidence: 0.95, source: 'explicit' }
      ]],
      ['python', [
        { name: 'Python', category: 'language', confidence: 0.95, source: 'explicit' }
      ]],
      ['node|nodejs|node.js', [
        { name: 'Node.js', category: 'platform', confidence: 0.9, source: 'explicit' }
      ]],
      ['express|expressjs', [
        { name: 'Express', category: 'framework', confidence: 0.9, source: 'explicit' }
      ]],
      ['tailwind', [
        { name: 'Tailwind CSS', category: 'library', confidence: 0.9, source: 'explicit' }
      ]],
      ['prisma', [
        { name: 'Prisma', category: 'library', confidence: 0.9, source: 'explicit' }
      ]],
      ['mongodb|mongo', [
        { name: 'MongoDB', category: 'tool', confidence: 0.9, source: 'explicit' }
      ]],
      ['postgres|postgresql', [
        { name: 'PostgreSQL', category: 'tool', confidence: 0.9, source: 'explicit' }
      ]],
      ['docker', [
        { name: 'Docker', category: 'tool', confidence: 0.9, source: 'explicit' }
      ]],
      ['kubernetes|k8s', [
        { name: 'Kubernetes', category: 'tool', confidence: 0.9, source: 'explicit' }
      ]],
      ['graphql', [
        { name: 'GraphQL', category: 'library', confidence: 0.9, source: 'explicit' }
      ]],
      ['rest|restful', [
        { name: 'REST API', category: 'tool', confidence: 0.7, source: 'inferred' }
      ]],
      ['api', [
        { name: 'API Development', category: 'tool', confidence: 0.6, source: 'inferred' }
      ]]
    ]

    patterns.forEach(([pattern, techs]) => {
      this.technologyPatterns.set(pattern, techs)
    })
  }

  /**
   * Normalize a prompt according to the specified options
   * 
   * @param prompt - The prompt to normalize
   * @param options - Normalization options
   * @returns Normalized prompt with metadata
   */
  async normalizePrompt(
    prompt: string,
    options: NormalizationOptions = {}
  ): Promise<NormalizedPrompt> {
    await this.initialize()

    const {
      cleanWhitespace = true,
      standardizeTerminology = true,
      expandAbbreviations = false,
      correctTypos = true,
      standardizeFormat = true,
      useAI = false,
      maxTokens,
      preserveCodeBlocks = true,
      customRules = []
    } = options

    const startTime = Date.now()
    const transformations: PromptTransformation[] = []
    let normalizedText = prompt
    let codeBlocks: { placeholder: string; content: string }[] = []

    // Preserve code blocks if requested
    if (preserveCodeBlocks) {
      const codeBlockRegex = /```[\s\S]*?```|`[^`]+`/g
      let match
      let counter = 0
      while ((match = codeBlockRegex.exec(prompt)) !== null) {
        const placeholder = `__CODE_BLOCK_${counter}__`
        codeBlocks.push({ placeholder, content: match[0] })
        normalizedText = normalizedText.replace(match[0], placeholder)
        counter++
      }
    }

    // Apply built-in rules
    const applicableRules = Array.from(this.rules.values())
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority)

    // Add custom rules
    applicableRules.push(...customRules.filter(r => r.enabled).sort((a, b) => b.priority - a.priority))

    for (const rule of applicableRules) {
      // Check conditions
      if (rule.conditions) {
        const shouldApply = rule.conditions.every(cond => {
          const textToCheck = normalizedText.toLowerCase()
          switch (cond.type) {
            case 'contains':
              return textToCheck.includes(cond.value.toLowerCase())
            case 'not_contains':
              return !textToCheck.includes(cond.value.toLowerCase())
            case 'matches':
              return new RegExp(cond.value, 'i').test(normalizedText)
            case 'domain_is':
              return true // Domain check happens separately
            default:
              return true
          }
        })
        if (!shouldApply) continue
      }

      // Apply the rule
      try {
        const regex = new RegExp(rule.pattern, 'gm')
        const matches = normalizedText.match(regex)
        
        if (matches && matches.length > 0) {
          const before = normalizedText
          normalizedText = normalizedText.replace(regex, rule.replacement)
          
          if (before !== normalizedText) {
            transformations.push({
              type: rule.type,
              description: rule.description,
              impact: matches.length * 0.1
            })
          }
        }
      } catch (e) {
        // Skip invalid regex patterns
      }
    }

    // Clean whitespace
    if (cleanWhitespace) {
      normalizedText = this.cleanWhitespace(normalizedText, transformations)
    }

    // Correct typos
    if (correctTypos) {
      normalizedText = this.correctTyposInText(normalizedText, transformations)
    }

    // Standardize terminology
    if (standardizeTerminology) {
      normalizedText = this.standardizeTerminologyInText(normalizedText, transformations)
    }

    // Expand abbreviations (only if explicitly requested and context allows)
    if (expandAbbreviations) {
      normalizedText = this.expandAbbreviationsInText(normalizedText, transformations)
    }

    // Standardize format
    if (standardizeFormat) {
      normalizedText = this.standardizeFormatInText(normalizedText, transformations)
    }

    // Restore code blocks
    for (const { placeholder, content } of codeBlocks) {
      normalizedText = normalizedText.replace(placeholder, content)
    }

    // Use AI for advanced normalization if requested
    if (useAI && normalizedText.length > 20) {
      try {
        const aiNormalized = await this.aiNormalize(normalizedText)
        if (aiNormalized && aiNormalized !== normalizedText) {
          transformations.push({
            type: 'clarity_enhancement',
            description: 'AI-powered clarity enhancement',
            impact: 0.3
          })
          normalizedText = aiNormalized
        }
      } catch (e) {
        // Continue with rule-based normalization
      }
    }

    // Apply max tokens constraint
    let tokenCount = this.estimateTokens(normalizedText)
    if (maxTokens && tokenCount > maxTokens) {
      const maxChars = maxTokens * 4
      normalizedText = normalizedText.slice(0, maxChars) + '...'
      tokenCount = this.estimateTokens(normalizedText)
      transformations.push({
        type: 'structure_improvement',
        description: `Truncated to fit ${maxTokens} token limit`,
        impact: 0.1
      })
    }

    const qualityScore = this.calculateQualityScore(normalizedText, prompt)
    const detectedLanguage = this.detectLanguage(normalizedText)
    const confidence = this.calculateConfidence(transformations)

    return {
      text: normalizedText,
      original: prompt,
      transformations,
      qualityScore,
      tokenCount,
      detectedLanguage,
      confidence,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Enrich context for a prompt
   * 
   * @param prompt - The prompt to enrich
   * @param options - Enrichment options
   * @returns Context enrichment data
   */
  async enrichContext(
    prompt: string,
    options: EnrichmentOptions = {}
  ): Promise<ContextEnrichment> {
    await this.initialize()

    const {
      detectDomain = true,
      inferTechStack = true,
      identifyEntities = true,
      extractConstraints = true,
      addContext = true,
      useAI = false,
      includeExamples = false,
      maxContextTokens = 500
    } = options

    const startTime = Date.now()
    const sourcesUsed: EnrichmentSource[] = ['builtin_knowledge', 'detected_patterns']

    // Detect domain
    const domain = detectDomain
      ? this.detectDomainFromPrompt(prompt)
      : this.getDefaultDomain()

    // Infer technology stack
    const technologyStack = inferTechStack
      ? this.inferTechnologyStack(prompt)
      : this.getDefaultTechStack()

    // Identify entities
    const entities = identifyEntities
      ? this.identifyEntitiesInPrompt(prompt)
      : []

    // Extract constraints
    const constraints = extractConstraints
      ? this.extractConstraintsFromPrompt(prompt)
      : []

    // Add relevant context
    const addedContext: EnrichmentContext[] = []
    
    if (addContext) {
      addedContext.push(...this.generateContextEnrichments(
        prompt,
        domain,
        technologyStack,
        constraints,
        maxContextTokens
      ))
    }

    // Use AI for advanced enrichment
    if (useAI) {
      try {
        const aiEnrichment = await this.aiEnrich(prompt, domain, technologyStack)
        if (aiEnrichment) {
          addedContext.push(...aiEnrichment)
          sourcesUsed.push('ai_inference')
        }
      } catch (e) {
        // Continue with rule-based enrichment
      }
    }

    // Add examples if requested
    if (includeExamples) {
      const examples = this.generateExamples(domain, technologyStack)
      if (examples) {
        addedContext.push({
          type: 'examples',
          content: examples,
          source: 'builtin_knowledge',
          relevance: 0.8
        })
      }
    }

    const processingTime = Date.now() - startTime
    const qualityScore = this.calculateEnrichmentQuality(
      domain,
      technologyStack,
      entities,
      constraints,
      addedContext
    )

    return {
      domain,
      technologyStack,
      entities,
      constraints,
      addedContext,
      metadata: {
        processingTime,
        enrichmentCount: addedContext.length,
        sourcesUsed,
        qualityScore
      }
    }
  }

  /**
   * Normalize and enrich a prompt in one operation
   * 
   * @param prompt - The prompt to process
   * @param normOptions - Normalization options
   * @param enrichOptions - Enrichment options
   * @returns Complete normalization and enrichment result
   */
  async normalizeAndEnrich(
    prompt: string,
    normOptions: NormalizationOptions = {},
    enrichOptions: EnrichmentOptions = {}
  ): Promise<NormalizationResult> {
    const startTime = Date.now()

    const [normalizedPrompt, enrichment] = await Promise.all([
      this.normalizePrompt(prompt, normOptions),
      this.enrichContext(prompt, enrichOptions)
    ])

    // Build enriched prompt
    const enrichedPrompt = this.buildEnrichedPrompt(normalizedPrompt, enrichment)

    const processingTime = Date.now() - startTime
    const qualityImprovement = normalizedPrompt.qualityScore - 
      this.calculateQualityScore(prompt, prompt)

    return {
      prompt: normalizedPrompt,
      enrichment,
      enrichedPrompt,
      processingTime,
      qualityImprovement
    }
  }

  // ========================================================================
  // Private Helper Methods
  // ========================================================================

  /**
   * Clean whitespace in text
   */
  private cleanWhitespace(text: string, transformations: PromptTransformation[]): string {
    let cleaned = text
    
    // Multiple spaces to single
    const beforeSpaces = cleaned
    cleaned = cleaned.replace(/  +/g, ' ')
    if (beforeSpaces !== cleaned) {
      transformations.push({
        type: 'whitespace_cleanup',
        description: 'Removed multiple consecutive spaces',
        impact: 0.05
      })
    }

    // Multiple newlines to double
    const beforeNewlines = cleaned
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
    if (beforeNewlines !== cleaned) {
      transformations.push({
        type: 'whitespace_cleanup',
        description: 'Normalized multiple newlines',
        impact: 0.05
      })
    }

    // Trim
    cleaned = cleaned.trim()

    return cleaned
  }

  /**
   * Correct typos in text
   */
  private correctTyposInText(text: string, transformations: PromptTransformation[]): string {
    let corrected = text
    let correctionCount = 0

    // Split into words and check each
    const words = corrected.split(/(\s+|(?=[.,!?;:])|(?<=[.,!?;:]))/)
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase().replace(/[.,!?;:]/g, '')
      const punctuation = words[i].match(/[.,!?;:]+$/)?.[0] || ''
      
      if (this.typoCorrections.has(word)) {
        const correction = this.typoCorrections.get(word)!
        // Preserve case
        if (words[i][0] === words[i][0].toUpperCase()) {
          words[i] = correction.charAt(0).toUpperCase() + correction.slice(1) + punctuation
        } else {
          words[i] = correction + punctuation
        }
        correctionCount++
      }
    }

    corrected = words.join('')
    
    if (correctionCount > 0) {
      transformations.push({
        type: 'typo_correction',
        description: `Corrected ${correctionCount} typo(s)`,
        impact: correctionCount * 0.15
      })
    }

    return corrected
  }

  /**
   * Standardize terminology in text
   */
  private standardizeTerminologyInText(text: string, transformations: PromptTransformation[]): string {
    let standardized = text
    let standardizationCount = 0

    for (const [from, to] of this.terminologyMap) {
      if (to === '') {
        // Remove the phrase
        const regex = new RegExp(`\\b${from}\\b`, 'gi')
        if (regex.test(standardized)) {
          standardized = standardized.replace(regex, '').replace(/  +/g, ' ')
          standardizationCount++
        }
      } else {
        // Replace with standard term
        const regex = new RegExp(`\\b${from}\\b`, 'gi')
        if (regex.test(standardized)) {
          standardized = standardized.replace(regex, to)
          standardizationCount++
        }
      }
    }

    if (standardizationCount > 0) {
      transformations.push({
        type: 'terminology_standardization',
        description: `Standardized ${standardizationCount} term(s)`,
        impact: standardizationCount * 0.1
      })
    }

    return standardized.trim()
  }

  /**
   * Expand abbreviations in text
   */
  private expandAbbreviationsInText(text: string, transformations: PromptTransformation[]): string {
    let expanded = text
    let expansionCount = 0

    // Only expand abbreviations that are standalone (not part of code)
    for (const [abbr, full] of this.abbreviationMap) {
      // Match abbreviation as standalone word, not in code context
      const regex = new RegExp(`\\b${abbr}\\b(?![^\\s]*[\\[\\(\\{<])`, 'gi')
      const matches = expanded.match(regex)
      
      if (matches && matches.length > 0) {
        // Only expand if it seems to be used as a term, not as code
        expanded = expanded.replace(regex, full)
        expansionCount += matches.length
      }
    }

    if (expansionCount > 0) {
      transformations.push({
        type: 'abbreviation_expansion',
        description: `Expanded ${expansionCount} abbreviation(s)`,
        impact: expansionCount * 0.08
      })
    }

    return expanded
  }

  /**
   * Standardize format in text
   */
  private standardizeFormatInText(text: string, transformations: PromptTransformation[]): string {
    let formatted = text

    // Normalize list formatting
    const beforeLists = formatted
    formatted = formatted.replace(/^[-–—]\s*/gm, '- ')
    formatted = formatted.replace(/^\*\s*/gm, '* ')
    formatted = formatted.replace(/^\d+[.)]\s*/gm, (match) => {
      const num = match.match(/\d+/)?.[0] || '1'
      return `${num}. `
    })
    
    if (beforeLists !== formatted) {
      transformations.push({
        type: 'formatting_standardization',
        description: 'Standardized list formatting',
        impact: 0.05
      })
    }

    // Normalize heading formatting
    const beforeHeadings = formatted
    formatted = formatted.replace(/^(#{1,6})\s*(.+)$/gm, '$1 $2')
    
    if (beforeHeadings !== formatted) {
      transformations.push({
        type: 'formatting_standardization',
        description: 'Standardized heading formatting',
        impact: 0.05
      })
    }

    return formatted
  }

  /**
   * Use AI for advanced normalization
   */
  private async aiNormalize(text: string): Promise<string | null> {
    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a prompt normalization assistant. Improve the clarity and structure of the given prompt while preserving its exact meaning. 
Do not add new information. Only improve readability, fix grammar, and enhance structure.
Output only the normalized prompt, nothing else.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: Math.min(1000, text.length * 2)
      })

      return completion.choices[0]?.message?.content?.trim() || null
    } catch {
      return null
    }
  }

  /**
   * Detect domain from prompt
   */
  private detectDomainFromPrompt(prompt: string): DetectedDomain {
    const promptLower = prompt.toLowerCase()
    const domainScores: Map<DomainCategory, { score: number; keywords: string[] }> = new Map()

    // Score each domain
    for (const [domain, keywords] of this.domainKeywords) {
      const matchedKeywords: string[] = []
      let score = 0

      for (const keyword of keywords) {
        if (promptLower.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword)
          score += keyword.length > 5 ? 2 : 1 // Longer keywords are more specific
        }
      }

      if (score > 0) {
        domainScores.set(domain, { score, keywords: matchedKeywords })
      }
    }

    // Find primary domain
    let primary: DomainCategory = 'general'
    let maxScore = 0
    const secondary: DomainCategory[] = []

    for (const [domain, data] of domainScores) {
      if (data.score > maxScore) {
        if (primary !== 'general') {
          secondary.push(primary)
        }
        maxScore = data.score
        primary = domain
      } else if (data.score > 0) {
        secondary.push(domain)
      }
    }

    const keywords = domainScores.get(primary)?.keywords || []
    const confidence = Math.min(0.95, 0.5 + (maxScore * 0.05))

    return {
      primary,
      secondary: secondary.slice(0, 3),
      confidence,
      keywords
    }
  }

  /**
   * Get default domain
   */
  private getDefaultDomain(): DetectedDomain {
    return {
      primary: 'unknown',
      secondary: [],
      confidence: 0,
      keywords: []
    }
  }

  /**
   * Infer technology stack from prompt
   */
  private inferTechnologyStack(prompt: string): TechnologyStack {
    const promptLower = prompt.toLowerCase()
    const languages: TechnologyItem[] = []
    const frameworks: TechnologyItem[] = []
    const libraries: TechnologyItem[] = []
    const tools: TechnologyItem[] = []

    // Check each pattern
    for (const [pattern, items] of this.technologyPatterns) {
      try {
        const regex = new RegExp(`\\b${pattern}\\b`, 'gi')
        if (regex.test(promptLower)) {
          for (const item of items) {
            const techItem: TechnologyItem = {
              name: item.name,
              category: item.category,
              confidence: item.confidence,
              source: item.source
            }

            switch (item.category) {
              case 'language':
                languages.push(techItem)
                break
              case 'framework':
                frameworks.push(techItem)
                break
              case 'library':
                libraries.push(techItem)
                break
              case 'tool':
              case 'platform':
                tools.push(techItem)
                break
            }
          }
        }
      } catch {
        // Skip invalid patterns
      }
    }

    // Deduplicate and sort by confidence
    const dedupeAndSort = (items: TechnologyItem[]): TechnologyItem[] => {
      const seen = new Set<string>()
      return items
        .filter(item => {
          if (seen.has(item.name)) return false
          seen.add(item.name)
          return true
        })
        .sort((a, b) => b.confidence - a.confidence)
    }

    // Calculate overall confidence
    const totalItems = languages.length + frameworks.length + libraries.length + tools.length
    const confidence = totalItems > 0 ? Math.min(0.95, 0.3 + totalItems * 0.1) : 0.2

    return {
      languages: dedupeAndSort(languages),
      frameworks: dedupeAndSort(frameworks),
      libraries: dedupeAndSort(libraries),
      tools: dedupeAndSort(tools),
      confidence
    }
  }

  /**
   * Get default tech stack
   */
  private getDefaultTechStack(): TechnologyStack {
    return {
      languages: [],
      frameworks: [],
      libraries: [],
      tools: [],
      confidence: 0
    }
  }

  /**
   * Identify entities in prompt
   */
  private identifyEntitiesInPrompt(prompt: string): IdentifiedEntity[] {
    const entities: IdentifiedEntity[] = []

    // Function names pattern
    const functionPattern = /\b([a-z][a-zA-Z0-9]*)\s*\(|function\s+([a-zA-Z][a-zA-Z0-9]*)|def\s+([a-zA-Z][a-zA-Z0-9_]*)|const\s+([a-zA-Z][a-zA-Z0-9]*)\s*=\s*(?:async\s*)?\(/gi
    let match
    while ((match = functionPattern.exec(prompt)) !== null) {
      const name = match[1] || match[2] || match[3] || match[4]
      if (name) {
        entities.push({
          text: name,
          type: 'function',
          position: { start: match.index, end: match.index + match[0].length },
          confidence: 0.8
        })
      }
    }

    // Class names pattern
    const classPattern = /\bclass\s+([A-Z][a-zA-Z0-9]*)|interface\s+([A-Z][a-zA-Z0-9]*)|type\s+([A-Z][a-zA-Z0-9]*)/g
    while ((match = classPattern.exec(prompt)) !== null) {
      const name = match[1] || match[2] || match[3]
      if (name) {
        entities.push({
          text: name,
          type: 'class',
          position: { start: match.index, end: match.index + match[0].length },
          confidence: 0.85
        })
      }
    }

    // File paths pattern
    const filePattern = /['"`]([a-zA-Z0-9_\-/.]+\.[a-zA-Z]{1,10})['"`]/g
    while ((match = filePattern.exec(prompt)) !== null) {
      entities.push({
        text: match[1],
        type: 'file',
        position: { start: match.index, end: match.index + match[0].length },
        confidence: 0.9
      })
    }

    // API endpoints pattern
    const apiPattern = /['"`](\/api\/[a-zA-Z0-9_\-/]+)['"`]|['"`](GET|POST|PUT|DELETE|PATCH)\s+([a-zA-Z0-9_\-./]+)['"`]/gi
    while ((match = apiPattern.exec(prompt)) !== null) {
      entities.push({
        text: match[1] || `${match[2]} ${match[3]}`,
        type: 'api_endpoint',
        position: { start: match.index, end: match.index + match[0].length },
        confidence: 0.9
      })
    }

    // Variable names pattern
    const variablePattern = /\b([a-zA-Z][a-zA-Z0-9_]*)\s*[=:]/g
    while ((match = variablePattern.exec(prompt)) !== null) {
      const name = match[1]
      // Skip common keywords
      if (!['if', 'else', 'for', 'while', 'return', 'const', 'let', 'var', 'function', 'class'].includes(name.toLowerCase())) {
        entities.push({
          text: name,
          type: 'variable',
          position: { start: match.index, end: match.index + match[0].length },
          confidence: 0.6
        })
      }
    }

    // Error types pattern
    const errorPattern = /\b([A-Z][a-zA-Z]*Error|Error:\s*[a-zA-Z]+)/g
    while ((match = errorPattern.exec(prompt)) !== null) {
      entities.push({
        text: match[1],
        type: 'error',
        position: { start: match.index, end: match.index + match[0].length },
        confidence: 0.85
      })
    }

    return entities
  }

  /**
   * Extract constraints from prompt
   */
  private extractConstraintsFromPrompt(prompt: string): ExtractedConstraint[] {
    const constraints: ExtractedConstraint[] = []
    const promptLower = prompt.toLowerCase()

    // Performance constraints
    const performancePattern = /\b(fast|slow|performant|optimize|performance|latency|throughput|response time|load time|under\s+(\d+)\s*(ms|seconds?|minutes?))\b/gi
    let match
    while ((match = performancePattern.exec(prompt)) !== null) {
      constraints.push({
        text: match[0],
        type: 'performance',
        severity: 'important',
        position: { start: match.index, end: match.index + match[0].length },
        value: match[2] ? parseInt(match[2]) : undefined
      })
    }

    // Security constraints
    const securityPattern = /\b(secure|security|encrypt|auth|authentication|authorization|jwt|oauth|password|token|ssl|https|vulnerability|xss|csrf|injection)\b/gi
    while ((match = securityPattern.exec(prompt)) !== null) {
      constraints.push({
        text: match[0],
        type: 'security',
        severity: 'critical',
        position: { start: match.index, end: match.index + match[0].length }
      })
    }

    // Compatibility constraints
    const compatPattern = /\b(compatible|compatibility|support[s]?\s+(browser|node|ios|android|version)|cross-platform|browser support|ie\d+|safari|chrome|firefox|edge)\b/gi
    while ((match = compatPattern.exec(prompt)) !== null) {
      constraints.push({
        text: match[0],
        type: 'compatibility',
        severity: 'important',
        position: { start: match.index, end: match.index + match[0].length }
      })
    }

    // Time constraints
    const timePattern = /\b(by\s+(tomorrow|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|end\s+of\s+(day|week|month))|deadline|urgent|asap|immediately|within\s+(\d+)\s*(hours?|days?|weeks?))\b/gi
    while ((match = timePattern.exec(prompt)) !== null) {
      constraints.push({
        text: match[0],
        type: 'time',
        severity: match[0].toLowerCase().includes('urgent') || match[0].toLowerCase().includes('asap') ? 'critical' : 'important',
        position: { start: match.index, end: match.index + match[0].length }
      })
    }

    // Format constraints
    const formatPattern = /\b(json|xml|yaml|csv|markdown|html|css|typescript|javascript|format|output\s+as|return\s+(a|an)\s+\w+)\b/gi
    while ((match = formatPattern.exec(prompt)) !== null) {
      constraints.push({
        text: match[0],
        type: 'format',
        severity: 'optional',
        position: { start: match.index, end: match.index + match[0].length },
        value: match[1] || match[0]
      })
    }

    // Style constraints
    const stylePattern = /\b(clean|readable|maintainable|modular|scalable|dry|solid|best\s+practice[s]?)\b/gi
    while ((match = stylePattern.exec(prompt)) !== null) {
      constraints.push({
        text: match[0],
        type: 'style',
        severity: 'optional',
        position: { start: match.index, end: match.index + match[0].length }
      })
    }

    // Architecture constraints
    const archPattern = /\b(microservice[s]?|monolith|serverless|layered|hexagonal|clean\s+architecture|event-driven|cqrs|ddd)\b/gi
    while ((match = archPattern.exec(prompt)) !== null) {
      constraints.push({
        text: match[0],
        type: 'architecture',
        severity: 'important',
        position: { start: match.index, end: match.index + match[0].length }
      })
    }

    // Testing constraints
    const testPattern = /\b(test[s]?|testing|unit\s+test|integration\s+test|e2e|coverage|test-driven|tdd|bdd)\b/gi
    while ((match = testPattern.exec(prompt)) !== null) {
      constraints.push({
        text: match[0],
        type: 'testing',
        severity: 'important',
        position: { start: match.index, end: match.index + match[0].length }
      })
    }

    // Resource constraints
    const resourcePattern = /\b(memory|cpu|ram|storage|bandwidth|limited\s+resource[s]?|resource\s+constraint|size\s+limit)\b/gi
    while ((match = resourcePattern.exec(prompt)) !== null) {
      constraints.push({
        text: match[0],
        type: 'resource',
        severity: 'important',
        position: { start: match.index, end: match.index + match[0].length }
      })
    }

    return constraints
  }

  /**
   * Generate context enrichments
   */
  private generateContextEnrichments(
    prompt: string,
    domain: DetectedDomain,
    techStack: TechnologyStack,
    constraints: ExtractedConstraint[],
    maxTokens: number
  ): EnrichmentContext[] {
    const enrichments: EnrichmentContext[] = []
    let currentTokens = 0

    // Add domain context
    if (domain.confidence > 0.5 && domain.primary !== 'general') {
      const domainContext = this.getDomainContext(domain.primary)
      if (domainContext && currentTokens + domainContext.length / 4 < maxTokens) {
        enrichments.push({
          type: 'domain_context',
          content: domainContext,
          source: 'builtin_knowledge',
          relevance: domain.confidence
        })
        currentTokens += domainContext.length / 4
      }
    }

    // Add technology context
    if (techStack.frameworks.length > 0 || techStack.languages.length > 0) {
      const techContext = this.getTechnologyContext(techStack)
      if (techContext && currentTokens + techContext.length / 4 < maxTokens) {
        enrichments.push({
          type: 'technology_context',
          content: techContext,
          source: 'builtin_knowledge',
          relevance: techStack.confidence
        })
        currentTokens += techContext.length / 4
      }
    }

    // Add constraint context
    if (constraints.length > 0) {
      const constraintContext = this.getConstraintContext(constraints)
      if (constraintContext && currentTokens + constraintContext.length / 4 < maxTokens) {
        enrichments.push({
          type: 'constraints',
          content: constraintContext,
          source: 'detected_patterns',
          relevance: 0.9
        })
        currentTokens += constraintContext.length / 4
      }
    }

    return enrichments
  }

  /**
   * Get domain-specific context
   */
  private getDomainContext(domain: DomainCategory): string {
    const contexts: Record<DomainCategory, string> = {
      web_development: 'Web development context: Consider responsive design, accessibility (WCAG), SEO best practices, and browser compatibility. Use semantic HTML and efficient CSS.',
      mobile_development: 'Mobile development context: Consider platform-specific guidelines (iOS HIG, Material Design), offline functionality, battery optimization, and responsive layouts for various screen sizes.',
      backend_development: 'Backend development context: Focus on API design, database optimization, security (input validation, authentication), error handling, and scalability.',
      frontend_development: 'Frontend development context: Prioritize user experience, component reusability, state management, performance optimization, and accessibility.',
      database: 'Database context: Consider query optimization, indexing strategies, data integrity, transaction management, and backup/recovery procedures.',
      devops: 'DevOps context: Implement CI/CD pipelines, infrastructure as code, monitoring, logging, and automated testing. Consider containerization and orchestration.',
      testing: 'Testing context: Ensure comprehensive test coverage including unit, integration, and end-to-end tests. Follow testing best practices and use appropriate testing frameworks.',
      documentation: 'Documentation context: Create clear, comprehensive documentation including API docs, user guides, and code comments. Use consistent formatting and examples.',
      api_development: 'API development context: Follow REST or GraphQL best practices, implement proper error handling, rate limiting, authentication, and versioning.',
      data_science: 'Data science context: Focus on data quality, feature engineering, model validation, and reproducibility. Consider ethical implications of data usage.',
      machine_learning: 'Machine learning context: Consider model selection, training data quality, overfitting prevention, and model deployment. Monitor for bias and fairness.',
      security: 'Security context: Implement defense in depth, input validation, secure authentication, encryption, and regular security audits. Follow OWASP guidelines.',
      performance: 'Performance context: Profile and optimize bottlenecks, implement caching strategies, minimize bundle sizes, and optimize database queries.',
      architecture: 'Architecture context: Follow architectural patterns appropriate for the scale. Consider separation of concerns, modularity, and maintainability.',
      general: '',
      unknown: ''
    }

    return contexts[domain] || ''
  }

  /**
   * Get technology-specific context
   */
  private getTechnologyContext(techStack: TechnologyStack): string {
    const contexts: string[] = []

    if (techStack.languages.some(l => l.name === 'TypeScript')) {
      contexts.push('TypeScript: Use strict type checking, define interfaces for data structures, and leverage type inference.')
    }

    if (techStack.frameworks.some(f => f.name === 'React')) {
      contexts.push('React: Use functional components with hooks, follow component composition patterns, and optimize re-renders.')
    }

    if (techStack.frameworks.some(f => f.name === 'Next.js')) {
      contexts.push('Next.js: Leverage server-side rendering, static generation, and API routes. Use the App Router for modern patterns.')
    }

    if (techStack.libraries.some(l => l.name === 'Prisma')) {
      contexts.push('Prisma: Use the Prisma Client for type-safe database access, define clear schema models, and use migrations.')
    }

    if (techStack.tools.some(t => t.name === 'Docker')) {
      contexts.push('Docker: Use multi-stage builds for smaller images, define clear container boundaries, and manage secrets securely.')
    }

    return contexts.join(' ')
  }

  /**
   * Get constraint-specific context
   */
  private getConstraintContext(constraints: ExtractedConstraint[]): string {
    const criticalConstraints = constraints.filter(c => c.severity === 'critical')
    const importantConstraints = constraints.filter(c => c.severity === 'important')

    const parts: string[] = []

    if (criticalConstraints.length > 0) {
      parts.push(`Critical constraints: ${criticalConstraints.map(c => c.text).join(', ')}.`)
    }

    if (importantConstraints.length > 0) {
      parts.push(`Important constraints: ${importantConstraints.map(c => c.text).join(', ')}.`)
    }

    return parts.join(' ')
  }

  /**
   * Use AI for advanced enrichment
   */
  private async aiEnrich(
    prompt: string,
    domain: DetectedDomain,
    techStack: TechnologyStack
  ): Promise<EnrichmentContext[]> {
    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a context enrichment assistant. Add relevant context that would help an AI assistant better understand and complete the task. 
Consider the detected domain (${domain.primary}) and technology stack.
Output only the additional context as a brief paragraph, nothing else.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200
      })

      const content = completion.choices[0]?.message?.content?.trim()
      if (content) {
        return [{
          type: 'domain_context',
          content,
          source: 'ai_inference',
          relevance: 0.85
        }]
      }
    } catch {
      // Continue without AI enrichment
    }

    return []
  }

  /**
   * Generate examples for the domain/tech stack
   */
  private generateExamples(domain: DetectedDomain, techStack: TechnologyStack): string {
    // Generate domain-specific example hints
    if (domain.primary === 'api_development' && techStack.frameworks.some(f => f.name === 'Next.js')) {
      return 'Example pattern: Use Next.js API routes in app/api/ directory, implement proper error handling with try-catch, and return typed responses.'
    }

    if (domain.primary === 'frontend_development' && techStack.frameworks.some(f => f.name === 'React')) {
      return 'Example pattern: Create reusable components with TypeScript props interface, use custom hooks for state logic, and implement proper error boundaries.'
    }

    return ''
  }

  /**
   * Build enriched prompt from normalized prompt and enrichment
   */
  private buildEnrichedPrompt(
    normalizedPrompt: NormalizedPrompt,
    enrichment: ContextEnrichment
  ): string {
    const parts: string[] = []

    // Add context if available
    if (enrichment.addedContext.length > 0) {
      parts.push('## Context')
      for (const ctx of enrichment.addedContext) {
        parts.push(ctx.content)
      }
      parts.push('')
    }

    // Add the normalized prompt
    parts.push('## Request')
    parts.push(normalizedPrompt.text)

    // Add constraints summary if available
    const criticalConstraints = enrichment.constraints.filter(c => c.severity === 'critical')
    if (criticalConstraints.length > 0) {
      parts.push('')
      parts.push('## Critical Requirements')
      for (const constraint of criticalConstraints) {
        parts.push(`- ${constraint.text}`)
      }
    }

    return parts.join('\n')
  }

  /**
   * Estimate token count
   */
  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token on average
    return Math.ceil(text.length / 4)
  }

  /**
   * Detect language of the prompt
   */
  private detectLanguage(text: string): string {
    // Simple heuristic based on character patterns
    const englishPattern = /^[a-zA-Z0-9\s.,!?;:'"()\[\]{}\-]+$/
    if (englishPattern.test(text.slice(0, 200))) {
      return 'en'
    }
    
    // Could be extended with more sophisticated detection
    return 'unknown'
  }

  /**
   * Calculate quality score for normalized prompt
   */
  private calculateQualityScore(normalized: string, original: string): number {
    let score = 50 // Base score

    // Length improvement
    if (normalized.length >= 20 && normalized.length <= 1000) {
      score += 10
    }

    // Structure improvement
    if (normalized.includes('\n') && !original.includes('\n')) {
      score += 5
    }

    // Clear instruction indicators
    const instructionWords = ['create', 'build', 'implement', 'fix', 'add', 'remove', 'update', 'refactor']
    const hasInstruction = instructionWords.some(word => normalized.toLowerCase().includes(word))
    if (hasInstruction) {
      score += 10
    }

    // Has specific details
    if (/\d+|specific|exactly|following/.test(normalized)) {
      score += 5
    }

    // Penalty for very short prompts
    if (normalized.length < 20) {
      score -= 20
    }

    // Penalty for no clear action
    if (!hasInstruction) {
      score -= 5
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calculate confidence from transformations
   */
  private calculateConfidence(transformations: PromptTransformation[]): number {
    if (transformations.length === 0) return 0.5

    const totalImpact = transformations.reduce((sum, t) => sum + t.impact, 0)
    return Math.min(0.95, 0.5 + totalImpact * 0.1)
  }

  /**
   * Calculate enrichment quality
   */
  private calculateEnrichmentQuality(
    domain: DetectedDomain,
    techStack: TechnologyStack,
    entities: IdentifiedEntity[],
    constraints: ExtractedConstraint[],
    addedContext: EnrichmentContext[]
  ): number {
    let score = 0

    // Domain detection quality
    score += domain.confidence * 20

    // Tech stack inference quality
    score += techStack.confidence * 20

    // Entity identification
    score += Math.min(20, entities.length * 2)

    // Constraint extraction
    score += Math.min(20, constraints.length * 3)

    // Context added
    score += Math.min(20, addedContext.length * 5)

    return Math.min(100, score)
  }

  /**
   * Add a custom normalization rule
   */
  addRule(rule: NormalizationRule): void {
    this.rules.set(rule.id, rule)
  }

  /**
   * Remove a normalization rule
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId)
  }

  /**
   * Get all rules
   */
  getRules(): NormalizationRule[] {
    return Array.from(this.rules.values())
  }

  /**
   * Get rules by type
   */
  getRulesByType(type: TransformationType): NormalizationRule[] {
    return Array.from(this.rules.values()).filter(r => r.type === type)
  }

  /**
   * Add abbreviation mapping
   */
  addAbbreviation(abbr: string, full: string): void {
    this.abbreviationMap.set(abbr.toLowerCase(), full)
  }

  /**
   * Add terminology mapping
   */
  addTerminology(from: string, to: string): void {
    this.terminologyMap.set(from.toLowerCase(), to)
  }

  /**
   * Add typo correction
   */
  addTypoCorrection(typo: string, correct: string): void {
    this.typoCorrections.set(typo.toLowerCase(), correct)
  }

  /**
   * Get statistics about the normalizer
   */
  getStats(): {
    ruleCount: number
    abbreviationCount: number
    terminologyCount: number
    typoCorrectionCount: number
    domainCount: number
    technologyPatternCount: number
  } {
    return {
      ruleCount: this.rules.size,
      abbreviationCount: this.abbreviationMap.size,
      terminologyCount: this.terminologyMap.size,
      typoCorrectionCount: this.typoCorrections.size,
      domainCount: this.domainKeywords.size,
      technologyPatternCount: this.technologyPatterns.size
    }
  }
}

// ============================================================================
// Singleton and Convenience Functions
// ============================================================================

let normalizerInstance: PromptNormalizer | null = null

/**
 * Get the singleton instance of PromptNormalizer
 */
export async function getPromptNormalizer(): Promise<PromptNormalizer> {
  if (!normalizerInstance) {
    normalizerInstance = new PromptNormalizer()
    await normalizerInstance.initialize()
  }
  return normalizerInstance
}

/**
 * Convenience function to normalize a prompt
 */
export async function normalizePrompt(
  prompt: string,
  options?: NormalizationOptions
): Promise<NormalizedPrompt> {
  const normalizer = await getPromptNormalizer()
  return normalizer.normalizePrompt(prompt, options)
}

/**
 * Convenience function to enrich context
 */
export async function enrichContext(
  prompt: string,
  options?: EnrichmentOptions
): Promise<ContextEnrichment> {
  const normalizer = await getPromptNormalizer()
  return normalizer.enrichContext(prompt, options)
}

/**
 * Convenience function to normalize and enrich in one operation
 */
export async function normalizeAndEnrich(
  prompt: string,
  normOptions?: NormalizationOptions,
  enrichOptions?: EnrichmentOptions
): Promise<NormalizationResult> {
  const normalizer = await getPromptNormalizer()
  return normalizer.normalizeAndEnrich(prompt, normOptions, enrichOptions)
}
