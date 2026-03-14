/**
 * Knowledge Reasoning Engine
 * 
 * Implements mechanisms #91-100: Knowledge Reasoning systems including:
 * - #91: Architecture Reasoning - Apply and validate architecture patterns
 * - #92: Best Practice Reasoning - Apply coding best practices
 * - #93: Performance Reasoning - Analyze performance implications
 * - #94: Security Reasoning - Identify security concerns
 * - #95: Scalability Reasoning - Evaluate scaling capabilities
 * - #96: Maintainability Reasoning - Assess maintainability
 * - #97: Cost Reasoning - Estimate costs and resources
 * - #98: Compatibility Reasoning - Check compatibility issues
 * - #99: Technology Tradeoff Reasoning - Analyze technology choices
 * - #100: Design Pattern Reasoning - Apply appropriate patterns
 */

import ZAI from 'z-ai-web-dev-sdk'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Knowledge domains for reasoning
 */
export type KnowledgeDomain =
  | 'architecture'
  | 'best_practice'
  | 'performance'
  | 'security'
  | 'scalability'
  | 'maintainability'
  | 'cost'
  | 'compatibility'
  | 'technology_tradeoff'
  | 'design_pattern'

/**
 * Domain expertise level
 */
export type DomainExpertise = 'novice' | 'intermediate' | 'expert' | 'master'

/**
 * Reasoning rule for knowledge application
 */
export interface ReasoningRule {
  id: string
  name: string
  domain: KnowledgeDomain
  description: string
  condition: RuleCondition
  recommendation: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  tags: string[]
  examples?: string[]
  counterExamples?: string[]
  references?: string[]
}

/**
 * Condition for rule application
 */
export interface RuleCondition {
  type: 'pattern' | 'threshold' | 'presence' | 'absence' | 'composite'
  pattern?: string | RegExp
  threshold?: { min?: number; max?: number; value?: number }
  presence?: string[]
  absence?: string[]
  composite?: { operator: 'and' | 'or' | 'not'; conditions: RuleCondition[] }
}

/**
 * Context for knowledge reasoning
 */
export interface KnowledgeContext {
  id: string
  domain: KnowledgeDomain
  subject: string
  description: string
  code?: string
  architecture?: ArchitectureContext
  constraints?: string[]
  requirements?: string[]
  environment?: EnvironmentContext
  metadata?: Record<string, any>
  timestamp: string
}

/**
 * Architecture-specific context
 */
export interface ArchitectureContext {
  type: 'monolith' | 'microservices' | 'serverless' | 'hybrid' | 'modular'
  components: string[]
  dependencies: string[]
  patterns: string[]
  dataFlow?: string[]
  deploymentModel?: string
}

/**
 * Environment context
 */
export interface EnvironmentContext {
  platform?: string
  runtime?: string
  frameworks?: string[]
  databases?: string[]
  cloudProvider?: string
  scale?: 'small' | 'medium' | 'large' | 'enterprise'
}

/**
 * Result of knowledge reasoning
 */
export interface ReasoningResult {
  id: string
  contextId: string
  domain: KnowledgeDomain
  rules: AppliedRule[]
  findings: Finding[]
  recommendations: Recommendation[]
  score: number
  confidence: number
  expertise: DomainExpertise
  summary: string
  details: string
  relatedDomains: KnowledgeDomain[]
  timestamp: string
}

/**
 * Applied rule with reasoning
 */
export interface AppliedRule {
  ruleId: string
  ruleName: string
  matched: boolean
  matchDetails?: string
  impact: 'positive' | 'negative' | 'neutral'
  score: number
  reasoning: string
}

/**
 * Finding from reasoning
 */
export interface Finding {
  id: string
  type: 'issue' | 'strength' | 'opportunity' | 'risk' | 'insight'
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  description: string
  location?: string
  evidence?: string[]
  relatedRules: string[]
}

/**
 * Recommendation from reasoning
 */
export interface Recommendation {
  id: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  rationale: string
  implementation?: string[]
  impact?: string
  effort?: 'trivial' | 'easy' | 'moderate' | 'difficult' | 'very_difficult'
  relatedFindings: string[]
}

// ============================================================================
// DOMAIN-SPECIFIC TYPES
// ============================================================================

/**
 * Architecture reasoning result
 */
export interface ArchitectureReasoningResult extends ReasoningResult {
  domain: 'architecture'
  architectureScore: number
  patternCompliance: PatternCompliance[]
  structuralIssues: StructuralIssue[]
  improvementOpportunities: ArchitectureImprovement[]
}

/**
 * Pattern compliance check
 */
export interface PatternCompliance {
  pattern: string
  compliant: boolean
  score: number
  gaps: string[]
  suggestions: string[]
}

/**
 * Structural issue in architecture
 */
export interface StructuralIssue {
  type: 'coupling' | 'cohesion' | 'complexity' | 'dependency' | 'layer_violation'
  severity: 'low' | 'medium' | 'high'
  description: string
  location: string
  suggestion: string
}

/**
 * Architecture improvement opportunity
 */
export interface ArchitectureImprovement {
  area: string
  currentState: string
  suggestedState: string
  benefit: string
  effort: string
}

/**
 * Best practice reasoning result
 */
export interface BestPracticeReasoningResult extends ReasoningResult {
  domain: 'best_practice'
  practiceScore: number
  followedPractices: PracticeAssessment[]
  violatedPractices: PracticeAssessment[]
  suggestedPractices: string[]
}

/**
 * Practice assessment
 */
export interface PracticeAssessment {
  practice: string
  category: string
  followed: boolean
  score: number
  details: string
  improvement?: string
}

/**
 * Performance reasoning result
 */
export interface PerformanceReasoningResult extends ReasoningResult {
  domain: 'performance'
  performanceScore: number
  bottlenecks: PerformanceBottleneck[]
  optimizations: PerformanceOptimization[]
  metrics: PerformanceMetric[]
}

/**
 * Performance bottleneck
 */
export interface PerformanceBottleneck {
  type: 'cpu' | 'memory' | 'io' | 'network' | 'database' | 'algorithm'
  location: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  estimatedImpact: string
  solution: string
}

/**
 * Performance optimization
 */
export interface PerformanceOptimization {
  type: 'caching' | 'lazy_loading' | 'parallelization' | 'indexing' | 'compression' | 'batching'
  description: string
  expectedGain: string
  implementation: string
  priority: 'low' | 'medium' | 'high'
}

/**
 * Performance metric
 */
export interface PerformanceMetric {
  name: string
  currentValue?: number
  targetValue?: number
  unit: string
  status: 'good' | 'warning' | 'critical'
}

/**
 * Security reasoning result
 */
export interface SecurityReasoningResult extends ReasoningResult {
  domain: 'security'
  securityScore: number
  vulnerabilities: SecurityVulnerability[]
  threats: ThreatAssessment[]
  mitigations: SecurityMitigation[]
}

/**
 * Security vulnerability
 */
export interface SecurityVulnerability {
  id: string
  type: 'injection' | 'xss' | 'auth' | 'data_exposure' | 'misconfiguration' | 'dependency'
  severity: 'low' | 'medium' | 'high' | 'critical'
  cvss?: number
  description: string
  location: string
  remediation: string
  references: string[]
}

/**
 * Threat assessment
 */
export interface ThreatAssessment {
  threat: string
  likelihood: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high' | 'critical'
  risk: string
  mitigation: string
}

/**
 * Security mitigation
 */
export interface SecurityMitigation {
  vulnerability: string
  mitigation: string
  status: 'implemented' | 'planned' | 'recommended'
  effectiveness: 'low' | 'medium' | 'high'
}

/**
 * Scalability reasoning result
 */
export interface ScalabilityReasoningResult extends ReasoningResult {
  domain: 'scalability'
  scalabilityScore: number
  scalingCapabilities: ScalingCapability[]
  limitations: ScalabilityLimitation[]
  strategies: ScalingStrategy[]
}

/**
 * Scaling capability
 */
export interface ScalingCapability {
  dimension: 'horizontal' | 'vertical' | 'data' | 'traffic' | 'users'
  currentLimit: string
  bottleneck: string
  headroom: string
}

/**
 * Scalability limitation
 */
export interface ScalabilityLimitation {
  area: string
  limitation: string
  impact: string
  workaround: string
  permanentFix: string
}

/**
 * Scaling strategy
 */
export interface ScalingStrategy {
  type: 'scale_out' | 'scale_up' | 'sharding' | 'caching' | 'cdn' | 'queue'
  description: string
  trigger: string
  cost: string
  implementation: string
}

/**
 * Maintainability reasoning result
 */
export interface MaintainabilityReasoningResult extends ReasoningResult {
  domain: 'maintainability'
  maintainabilityScore: number
  codeQuality: CodeQualityMetrics
  technicalDebt: TechnicalDebt[]
  improvementAreas: MaintainabilityImprovement[]
}

/**
 * Code quality metrics
 */
export interface CodeQualityMetrics {
  readability: number
  testability: number
  modularity: number
  documentation: number
  consistency: number
  complexity: number
}

/**
 * Technical debt item
 */
export interface TechnicalDebt {
  type: 'code' | 'architecture' | 'test' | 'documentation' | 'dependency'
  description: string
  impact: string
  effort: string
  priority: 'low' | 'medium' | 'high'
  interest: string
}

/**
 * Maintainability improvement
 */
export interface MaintainabilityImprovement {
  area: string
  current: string
  target: string
  benefit: string
  effort: string
}

/**
 * Cost reasoning result
 */
export interface CostReasoningResult extends ReasoningResult {
  domain: 'cost'
  costScore: number
  estimates: CostEstimate[]
  optimizations: CostOptimization[]
  tradeoffs: CostTradeoff[]
}

/**
 * Cost estimate
 */
export interface CostEstimate {
  category: 'compute' | 'storage' | 'network' | 'licensing' | 'development' | 'operations'
  item: string
  monthly?: number
  yearly?: number
  unit?: string
  confidence: 'low' | 'medium' | 'high'
}

/**
 * Cost optimization
 */
export interface CostOptimization {
  type: 'reserved' | 'spot' | 'right_sizing' | 'optimization' | 'elimination'
  description: string
  currentCost: number
  optimizedCost: number
  savings: number
  effort: string
}

/**
 * Cost tradeoff
 */
export interface CostTradeoff {
  decision: string
  costImpact: string
  otherBenefit: string
  recommendation: string
}

/**
 * Compatibility reasoning result
 */
export interface CompatibilityReasoningResult extends ReasoningResult {
  domain: 'compatibility'
  compatibilityScore: number
  compatibility: CompatibilityCheck[]
  breakingChanges: BreakingChange[]
  migrations: MigrationPath[]
}

/**
 * Compatibility check
 */
export interface CompatibilityCheck {
  component: string
  version: string
  compatible: boolean
  issues: string[]
  fixes: string[]
}

/**
 * Breaking change
 */
export interface BreakingChange {
  type: 'api' | 'behavior' | 'dependency' | 'configuration' | 'data'
  description: string
  impact: string
  migration: string
  effort: string
}

/**
 * Migration path
 */
export interface MigrationPath {
  from: string
  to: string
  steps: string[]
  risks: string[]
  effort: string
}

/**
 * Technology tradeoff reasoning result
 */
export interface TechnologyTradeoffReasoningResult extends ReasoningResult {
  domain: 'technology_tradeoff'
  tradeoffScore: number
  comparisons: TechnologyComparison[]
  decisions: TechnologyDecision[]
  alternatives: TechnologyAlternative[]
}

/**
 * Technology comparison
 */
export interface TechnologyComparison {
  technology: string
  pros: string[]
  cons: string[]
  fitScore: number
  useCases: string[]
  risks: string[]
}

/**
 * Technology decision
 */
export interface TechnologyDecision {
  decision: string
  rationale: string
  alternatives: string[]
  tradeoffs: string[]
  confidence: number
}

/**
 * Technology alternative
 */
export interface TechnologyAlternative {
  name: string
  reason: string
  advantages: string[]
  disadvantages: string[]
  transition: string
}

/**
 * Design pattern reasoning result
 */
export interface DesignPatternReasoningResult extends ReasoningResult {
  domain: 'design_pattern'
  patternScore: number
  appliedPatterns: AppliedPattern[]
  missingPatterns: MissingPattern[]
  antiPatterns: AntiPatternDetection[]
}

/**
 * Applied pattern
 */
export interface AppliedPattern {
  pattern: string
  location: string
  correct: boolean
  improvements: string[]
  benefits: string[]
}

/**
 * Missing pattern
 */
export interface MissingPattern {
  pattern: string
  benefit: string
  applicability: string
  implementation: string
  effort: string
}

/**
 * Anti-pattern detection
 */
export interface AntiPatternDetection {
  name: string
  type: string
  location: string
  severity: 'low' | 'medium' | 'high'
  description: string
  solution: string
}

// ============================================================================
// DEFAULT RULES FOR EACH DOMAIN
// ============================================================================

/**
 * Default architecture rules
 */
const DEFAULT_ARCHITECTURE_RULES: ReasoningRule[] = [
  {
    id: 'arch-001',
    name: 'Separation of Concerns',
    domain: 'architecture',
    description: 'Each module should have a single, well-defined responsibility',
    condition: { type: 'pattern', pattern: /class|module|component/i },
    recommendation: 'Ensure modules have clear boundaries and single responsibilities',
    priority: 'high',
    tags: ['modularity', 'cohesion'],
    examples: ['UserService handles only user-related operations', 'PaymentController manages payment workflows'],
    references: ['SOLID principles', 'Clean Architecture']
  },
  {
    id: 'arch-002',
    name: 'Dependency Inversion',
    domain: 'architecture',
    description: 'High-level modules should not depend on low-level modules',
    condition: { type: 'pattern', pattern: /import|require|from/i },
    recommendation: 'Use interfaces or abstractions to invert dependencies',
    priority: 'high',
    tags: ['dependency', 'coupling'],
    examples: ['Inject database interfaces instead of concrete implementations'],
    references: ['Dependency Injection', 'Inversion of Control']
  },
  {
    id: 'arch-003',
    name: 'Layered Architecture',
    domain: 'architecture',
    description: 'Organize code into distinct layers with clear responsibilities',
    condition: { type: 'presence', presence: ['controller', 'service', 'repository'] },
    recommendation: 'Maintain clear separation between presentation, business, and data layers',
    priority: 'medium',
    tags: ['layering', 'organization']
  },
  {
    id: 'arch-004',
    name: 'API Gateway Pattern',
    domain: 'architecture',
    description: 'Use a single entry point for all client requests in microservices',
    condition: { type: 'pattern', pattern: /microservice|service/i },
    recommendation: 'Implement API Gateway for routing, authentication, and rate limiting',
    priority: 'high',
    tags: ['microservices', 'gateway'],
    references: ['Microservices Patterns']
  },
  {
    id: 'arch-005',
    name: 'Event-Driven Architecture',
    domain: 'architecture',
    description: 'Use events for decoupled communication between components',
    condition: { type: 'pattern', pattern: /async|event|message|queue/i },
    recommendation: 'Consider event-driven patterns for scalability and loose coupling',
    priority: 'medium',
    tags: ['events', 'async', 'decoupling']
  }
]

/**
 * Default best practice rules
 */
const DEFAULT_BEST_PRACTICE_RULES: ReasoningRule[] = [
  {
    id: 'bp-001',
    name: 'DRY Principle',
    domain: 'best_practice',
    description: 'Do not repeat yourself - avoid code duplication',
    condition: { type: 'pattern', pattern: /duplicate|copy|similar/i },
    recommendation: 'Extract common code into reusable functions or modules',
    priority: 'medium',
    tags: ['maintainability', 'duplication']
  },
  {
    id: 'bp-002',
    name: 'Meaningful Naming',
    domain: 'best_practice',
    description: 'Use clear, descriptive names for variables, functions, and classes',
    condition: { type: 'pattern', pattern: /(var x|let y|const z|function f\(|class A\s*{)/i },
    recommendation: 'Use descriptive names that reveal intent',
    priority: 'medium',
    tags: ['readability', 'naming'],
    examples: ['getUserById instead of gub', 'calculateTotalPrice instead of calc']
  },
  {
    id: 'bp-003',
    name: 'Function Size',
    domain: 'best_practice',
    description: 'Functions should be small and focused',
    condition: { type: 'threshold', threshold: { max: 50 } },
    recommendation: 'Break down large functions into smaller, focused ones',
    priority: 'medium',
    tags: ['complexity', 'readability']
  },
  {
    id: 'bp-004',
    name: 'Error Handling',
    domain: 'best_practice',
    description: 'Handle errors gracefully and provide meaningful messages',
    condition: { type: 'pattern', pattern: /try\s*{[\s\S]*}\s*catch/i },
    recommendation: 'Implement comprehensive error handling with logging and recovery',
    priority: 'high',
    tags: ['reliability', 'error-handling']
  },
  {
    id: 'bp-005',
    name: 'Type Safety',
    domain: 'best_practice',
    description: 'Use TypeScript types and interfaces for type safety',
    condition: { type: 'pattern', pattern: /:\s*any|as\s+any/i },
    recommendation: 'Avoid any type and use proper TypeScript types',
    priority: 'high',
    tags: ['typescript', 'type-safety']
  },
  {
    id: 'bp-006',
    name: 'Immutable Data',
    domain: 'best_practice',
    description: 'Prefer immutable data structures and const declarations',
    condition: { type: 'pattern', pattern: /let\s+\w+\s*=\s*{|var\s+\w+\s*=\s*\[/i },
    recommendation: 'Use const and immutable patterns for predictable state',
    priority: 'medium',
    tags: ['immutability', 'functional']
  },
  {
    id: 'bp-007',
    name: 'Code Comments',
    domain: 'best_practice',
    description: 'Write meaningful comments for complex logic',
    condition: { type: 'pattern', pattern: /\/\*[\s\S]*?\*\/|\/\/.*/ },
    recommendation: 'Document complex logic, but prefer self-documenting code',
    priority: 'low',
    tags: ['documentation', 'readability']
  }
]

/**
 * Default performance rules
 */
const DEFAULT_PERFORMANCE_RULES: ReasoningRule[] = [
  {
    id: 'perf-001',
    name: 'N+1 Query Problem',
    domain: 'performance',
    description: 'Avoid N+1 database queries in loops',
    condition: { type: 'pattern', pattern: /for\s*\([\s\S]*?\)\s*{[\s\S]*?await.*find|forEach[\s\S]*?await/i },
    recommendation: 'Use eager loading, batching, or joins to avoid N+1 queries',
    priority: 'high',
    tags: ['database', 'query', 'optimization']
  },
  {
    id: 'perf-002',
    name: 'Large Bundle Size',
    domain: 'performance',
    description: 'Keep JavaScript bundle sizes small',
    condition: { type: 'threshold', threshold: { max: 500000 } },
    recommendation: 'Use code splitting, tree shaking, and lazy loading',
    priority: 'high',
    tags: ['bundle', 'javascript', 'loading']
  },
  {
    id: 'perf-003',
    name: 'Memory Leaks',
    domain: 'performance',
    description: 'Prevent memory leaks from unclosed resources',
    condition: { type: 'pattern', pattern: /setInterval|setTimeout|addEventListener/i },
    recommendation: 'Clean up intervals, timeouts, and event listeners',
    priority: 'high',
    tags: ['memory', 'cleanup', 'leaks']
  },
  {
    id: 'perf-004',
    name: 'Inefficient Loops',
    domain: 'performance',
    description: 'Optimize loop performance',
    condition: { type: 'pattern', pattern: /\.filter\([\s\S]*?\.map\(|\.map\([\s\S]*?\.filter\(/i },
    recommendation: 'Combine array operations and avoid nested iterations',
    priority: 'medium',
    tags: ['algorithm', 'iteration']
  },
  {
    id: 'perf-005',
    name: 'Caching Strategy',
    domain: 'performance',
    description: 'Implement caching for frequently accessed data',
    condition: { type: 'absence', absence: ['cache', 'memoize', 'redis'] },
    recommendation: 'Implement appropriate caching for hot data paths',
    priority: 'medium',
    tags: ['caching', 'optimization']
  }
]

/**
 * Default security rules
 */
const DEFAULT_SECURITY_RULES: ReasoningRule[] = [
  {
    id: 'sec-001',
    name: 'SQL Injection Prevention',
    domain: 'security',
    description: 'Prevent SQL injection attacks',
    condition: { type: 'pattern', pattern: /\$\{.*\}.*SELECT|`\$\{.*\}.*FROM|concat.*SELECT/i },
    recommendation: 'Use parameterized queries and prepared statements',
    priority: 'critical',
    tags: ['injection', 'database', 'sql'],
    references: ['OWASP Top 10', 'CWE-89']
  },
  {
    id: 'sec-002',
    name: 'XSS Prevention',
    domain: 'security',
    description: 'Prevent cross-site scripting attacks',
    condition: { type: 'pattern', pattern: /dangerouslySetInnerHTML|innerHTML|document\.write/i },
    recommendation: 'Sanitize user input and use safe rendering methods',
    priority: 'critical',
    tags: ['xss', 'frontend', 'sanitization'],
    references: ['OWASP Top 10', 'CWE-79']
  },
  {
    id: 'sec-003',
    name: 'Authentication Security',
    domain: 'security',
    description: 'Implement secure authentication',
    condition: { type: 'pattern', pattern: /password|token|auth|login/i },
    recommendation: 'Use secure password hashing, JWT with proper expiration, and MFA',
    priority: 'critical',
    tags: ['auth', 'password', 'token']
  },
  {
    id: 'sec-004',
    name: 'Sensitive Data Exposure',
    domain: 'security',
    description: 'Protect sensitive data in transit and at rest',
    condition: { type: 'pattern', pattern: /password|secret|api_key|token/i },
    recommendation: 'Encrypt sensitive data and never log credentials',
    priority: 'critical',
    tags: ['encryption', 'data-protection'],
    references: ['GDPR', 'PCI-DSS']
  },
  {
    id: 'sec-005',
    name: 'Input Validation',
    domain: 'security',
    description: 'Validate all user input',
    condition: { type: 'pattern', pattern: /req\.(body|params|query)/i },
    recommendation: 'Implement input validation schemas and sanitization',
    priority: 'high',
    tags: ['validation', 'input', 'sanitization']
  },
  {
    id: 'sec-006',
    name: 'Dependency Security',
    domain: 'security',
    description: 'Keep dependencies secure and updated',
    condition: { type: 'presence', presence: ['package.json'] },
    recommendation: 'Regularly audit dependencies and update vulnerable packages',
    priority: 'high',
    tags: ['dependencies', 'vulnerabilities']
  }
]

/**
 * Default scalability rules
 */
const DEFAULT_SCALABILITY_RULES: ReasoningRule[] = [
  {
    id: 'scale-001',
    name: 'Stateless Design',
    domain: 'scalability',
    description: 'Design stateless services for horizontal scaling',
    condition: { type: 'pattern', pattern: /session|state|global/i },
    recommendation: 'Store state externally in Redis, database, or client-side',
    priority: 'high',
    tags: ['stateless', 'horizontal-scaling']
  },
  {
    id: 'scale-002',
    name: 'Database Scaling',
    domain: 'scalability',
    description: 'Plan for database scaling strategies',
    condition: { type: 'pattern', pattern: /database|db|sql|mongodb/i },
    recommendation: 'Consider read replicas, sharding, and connection pooling',
    priority: 'high',
    tags: ['database', 'sharding', 'replication']
  },
  {
    id: 'scale-003',
    name: 'Asynchronous Processing',
    domain: 'scalability',
    description: 'Use async processing for scalability',
    condition: { type: 'pattern', pattern: /queue|worker|async|background/i },
    recommendation: 'Offload heavy processing to background workers',
    priority: 'medium',
    tags: ['async', 'queue', 'workers']
  },
  {
    id: 'scale-004',
    name: 'CDN Usage',
    domain: 'scalability',
    description: 'Use CDN for static assets',
    condition: { type: 'pattern', pattern: /static|assets|images|css|js/i },
    recommendation: 'Serve static assets through CDN for global distribution',
    priority: 'medium',
    tags: ['cdn', 'static', 'performance']
  },
  {
    id: 'scale-005',
    name: 'Rate Limiting',
    domain: 'scalability',
    description: 'Implement rate limiting for API protection',
    condition: { type: 'absence', absence: ['rateLimit', 'throttle', 'rate-limit'] },
    recommendation: 'Add rate limiting to prevent abuse and ensure fair usage',
    priority: 'high',
    tags: ['rate-limiting', 'api', 'protection']
  }
]

/**
 * Default maintainability rules
 */
const DEFAULT_MAINTAINABILITY_RULES: ReasoningRule[] = [
  {
    id: 'maint-001',
    name: 'Test Coverage',
    domain: 'maintainability',
    description: 'Maintain adequate test coverage',
    condition: { type: 'absence', absence: ['test', 'spec', '__tests__'] },
    recommendation: 'Add unit, integration, and e2e tests',
    priority: 'high',
    tags: ['testing', 'coverage', 'quality']
  },
  {
    id: 'maint-002',
    name: 'Code Documentation',
    domain: 'maintainability',
    description: 'Document public APIs and complex logic',
    condition: { type: 'pattern', pattern: /export\s+(function|class|const)/i },
    recommendation: 'Add JSDoc comments for exported functions and classes',
    priority: 'medium',
    tags: ['documentation', 'api']
  },
  {
    id: 'maint-003',
    name: 'Consistent Code Style',
    domain: 'maintainability',
    description: 'Use consistent code formatting',
    condition: { type: 'presence', presence: ['.eslintrc', '.prettierrc'] },
    recommendation: 'Configure and enforce linting and formatting rules',
    priority: 'medium',
    tags: ['style', 'linting', 'formatting']
  },
  {
    id: 'maint-004',
    name: 'Dependency Management',
    domain: 'maintainability',
    description: 'Keep dependencies up to date',
    condition: { type: 'presence', presence: ['package.json'] },
    recommendation: 'Regularly update dependencies and remove unused ones',
    priority: 'medium',
    tags: ['dependencies', 'maintenance']
  },
  {
    id: 'maint-005',
    name: 'Error Messages',
    domain: 'maintainability',
    description: 'Provide helpful error messages',
    condition: { type: 'pattern', pattern: /throw\s+new\s+Error|reject\(/i },
    recommendation: 'Include context and guidance in error messages',
    priority: 'medium',
    tags: ['errors', 'debugging']
  }
]

/**
 * Default cost rules
 */
const DEFAULT_COST_RULES: ReasoningRule[] = [
  {
    id: 'cost-001',
    name: 'Resource Right-Sizing',
    domain: 'cost',
    description: 'Match resources to actual needs',
    condition: { type: 'presence', presence: ['docker', 'kubernetes', 'aws', 'gcp', 'azure'] },
    recommendation: 'Right-size instances based on actual usage metrics',
    priority: 'high',
    tags: ['resources', 'optimization']
  },
  {
    id: 'cost-002',
    name: 'Reserved Instances',
    domain: 'cost',
    description: 'Use reserved capacity for predictable workloads',
    condition: { type: 'pattern', pattern: /production|prod/i },
    recommendation: 'Purchase reserved instances for stable workloads',
    priority: 'medium',
    tags: ['reserved', 'savings']
  },
  {
    id: 'cost-003',
    name: 'Storage Optimization',
    domain: 'cost',
    description: 'Optimize storage costs',
    condition: { type: 'pattern', pattern: /s3|storage|database|db/i },
    recommendation: 'Use lifecycle policies and appropriate storage tiers',
    priority: 'medium',
    tags: ['storage', 'lifecycle']
  },
  {
    id: 'cost-004',
    name: 'Serverless Optimization',
    domain: 'cost',
    description: 'Optimize serverless function costs',
    condition: { type: 'pattern', pattern: /lambda|function|serverless/i },
    recommendation: 'Optimize memory, timeout, and cold start strategies',
    priority: 'medium',
    tags: ['serverless', 'lambda']
  }
]

/**
 * Default compatibility rules
 */
const DEFAULT_COMPATIBILITY_RULES: ReasoningRule[] = [
  {
    id: 'compat-001',
    name: 'Browser Compatibility',
    domain: 'compatibility',
    description: 'Ensure cross-browser compatibility',
    condition: { type: 'pattern', pattern: /fetch|Promise|async\s+function/i },
    recommendation: 'Add polyfills for older browsers and test across browsers',
    priority: 'medium',
    tags: ['browser', 'polyfill']
  },
  {
    id: 'compat-002',
    name: 'Node Version Compatibility',
    domain: 'compatibility',
    description: 'Support required Node.js versions',
    condition: { type: 'presence', presence: ['package.json'] },
    recommendation: 'Specify engines in package.json and test on required versions',
    priority: 'medium',
    tags: ['node', 'version']
  },
  {
    id: 'compat-003',
    name: 'API Versioning',
    domain: 'compatibility',
    description: 'Version APIs for backward compatibility',
    condition: { type: 'pattern', pattern: /api|route|endpoint/i },
    recommendation: 'Implement API versioning for breaking changes',
    priority: 'high',
    tags: ['api', 'versioning']
  },
  {
    id: 'compat-004',
    name: 'Database Migration',
    domain: 'compatibility',
    description: 'Plan database schema migrations',
    condition: { type: 'pattern', pattern: /schema|migration|prisma/i },
    recommendation: 'Use migration tools and plan backward-compatible changes',
    priority: 'high',
    tags: ['database', 'migration']
  }
]

/**
 * Default technology tradeoff rules
 */
const DEFAULT_TECHNOLOGY_TRADEOFF_RULES: ReasoningRule[] = [
  {
    id: 'tech-001',
    name: 'Build vs Buy',
    domain: 'technology_tradeoff',
    description: 'Evaluate building vs buying solutions',
    condition: { type: 'composite', composite: { operator: 'and', conditions: [] } },
    recommendation: 'Consider build for core differentiators, buy for commodities',
    priority: 'high',
    tags: ['build-vs-buy', 'decision']
  },
  {
    id: 'tech-002',
    name: 'SQL vs NoSQL',
    domain: 'technology_tradeoff',
    description: 'Choose appropriate database type',
    condition: { type: 'pattern', pattern: /database|storage|data/i },
    recommendation: 'SQL for structured data and complex queries, NoSQL for flexibility and scale',
    priority: 'high',
    tags: ['database', 'sql', 'nosql']
  },
  {
    id: 'tech-003',
    name: 'Monolith vs Microservices',
    domain: 'technology_tradeoff',
    description: 'Choose appropriate architecture',
    condition: { type: 'pattern', pattern: /architecture|service/i },
    recommendation: 'Start with monolith, evolve to microservices when needed',
    priority: 'high',
    tags: ['architecture', 'monolith', 'microservices']
  }
]

/**
 * Default design pattern rules
 */
const DEFAULT_DESIGN_PATTERN_RULES: ReasoningRule[] = [
  {
    id: 'dp-001',
    name: 'Singleton Pattern',
    domain: 'design_pattern',
    description: 'Ensure single instance when needed',
    condition: { type: 'pattern', pattern: /getInstance|private\s+static\s+instance/i },
    recommendation: 'Use singleton for global state, but prefer dependency injection',
    priority: 'low',
    tags: ['creational', 'singleton']
  },
  {
    id: 'dp-002',
    name: 'Factory Pattern',
    domain: 'design_pattern',
    description: 'Use factory for object creation',
    condition: { type: 'pattern', pattern: /create|factory|build/i },
    recommendation: 'Use factory pattern for complex object creation',
    priority: 'medium',
    tags: ['creational', 'factory']
  },
  {
    id: 'dp-003',
    name: 'Observer Pattern',
    domain: 'design_pattern',
    description: 'Implement reactive data flow',
    condition: { type: 'pattern', pattern: /subscribe|emit|on\(|addEventListener/i },
    recommendation: 'Use observer for event-driven architectures',
    priority: 'medium',
    tags: ['behavioral', 'observer']
  },
  {
    id: 'dp-004',
    name: 'Strategy Pattern',
    domain: 'design_pattern',
    description: 'Encapsulate algorithms',
    condition: { type: 'pattern', pattern: /strategy|algorithm/i },
    recommendation: 'Use strategy for interchangeable algorithms',
    priority: 'medium',
    tags: ['behavioral', 'strategy']
  },
  {
    id: 'dp-005',
    name: 'Repository Pattern',
    domain: 'design_pattern',
    description: 'Abstract data access',
    condition: { type: 'pattern', pattern: /repository|find|save|delete/i },
    recommendation: 'Use repository to abstract data access layer',
    priority: 'high',
    tags: ['structural', 'repository']
  },
  {
    id: 'dp-006',
    name: 'Decorator Pattern',
    domain: 'design_pattern',
    description: 'Add behavior dynamically',
    condition: { type: 'pattern', pattern: /@decorator|@\w+\s*\(/i },
    recommendation: 'Use decorators for cross-cutting concerns',
    priority: 'medium',
    tags: ['structural', 'decorator']
  }
]

// ============================================================================
// KNOWLEDGE REASONING ENGINE
// ============================================================================

/**
 * Main Knowledge Reasoning Engine
 * 
 * Provides domain-specific reasoning capabilities for software development
 * decisions across architecture, best practices, performance, security,
 * scalability, maintainability, cost, compatibility, technology tradeoffs,
 * and design patterns.
 */
export class KnowledgeReasoningEngine {
  private zai: any = null
  private rules: Map<KnowledgeDomain, Map<string, ReasoningRule>> = new Map()
  private contextCache: Map<string, KnowledgeContext> = new Map()
  private resultCache: Map<string, ReasoningResult> = new Map()

  constructor() {
    this.initializeDefaultRules()
  }

  /**
   * Initialize the AI client
   */
  private async init(): Promise<void> {
    if (!this.zai) {
      this.zai = await ZAI.create()
    }
  }

  /**
   * Initialize default rules for all domains
   */
  private initializeDefaultRules(): void {
    // Architecture rules
    const archRules = new Map<string, ReasoningRule>()
    DEFAULT_ARCHITECTURE_RULES.forEach(rule => archRules.set(rule.id, rule))
    this.rules.set('architecture', archRules)

    // Best practice rules
    const bpRules = new Map<string, ReasoningRule>()
    DEFAULT_BEST_PRACTICE_RULES.forEach(rule => bpRules.set(rule.id, rule))
    this.rules.set('best_practice', bpRules)

    // Performance rules
    const perfRules = new Map<string, ReasoningRule>()
    DEFAULT_PERFORMANCE_RULES.forEach(rule => perfRules.set(rule.id, rule))
    this.rules.set('performance', perfRules)

    // Security rules
    const secRules = new Map<string, ReasoningRule>()
    DEFAULT_SECURITY_RULES.forEach(rule => secRules.set(rule.id, rule))
    this.rules.set('security', secRules)

    // Scalability rules
    const scaleRules = new Map<string, ReasoningRule>()
    DEFAULT_SCALABILITY_RULES.forEach(rule => scaleRules.set(rule.id, rule))
    this.rules.set('scalability', scaleRules)

    // Maintainability rules
    const maintRules = new Map<string, ReasoningRule>()
    DEFAULT_MAINTAINABILITY_RULES.forEach(rule => maintRules.set(rule.id, rule))
    this.rules.set('maintainability', maintRules)

    // Cost rules
    const costRules = new Map<string, ReasoningRule>()
    DEFAULT_COST_RULES.forEach(rule => costRules.set(rule.id, rule))
    this.rules.set('cost', costRules)

    // Compatibility rules
    const compatRules = new Map<string, ReasoningRule>()
    DEFAULT_COMPATIBILITY_RULES.forEach(rule => compatRules.set(rule.id, rule))
    this.rules.set('compatibility', compatRules)

    // Technology tradeoff rules
    const techRules = new Map<string, ReasoningRule>()
    DEFAULT_TECHNOLOGY_TRADEOFF_RULES.forEach(rule => techRules.set(rule.id, rule))
    this.rules.set('technology_tradeoff', techRules)

    // Design pattern rules
    const dpRules = new Map<string, ReasoningRule>()
    DEFAULT_DESIGN_PATTERN_RULES.forEach(rule => dpRules.set(rule.id, rule))
    this.rules.set('design_pattern', dpRules)
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  /**
   * Add a custom reasoning rule
   */
  addRule(rule: ReasoningRule): void {
    const domainRules = this.rules.get(rule.domain) || new Map()
    domainRules.set(rule.id, rule)
    this.rules.set(rule.domain, domainRules)
  }

  /**
   * Remove a reasoning rule
   */
  removeRule(ruleId: string, domain: KnowledgeDomain): boolean {
    const domainRules = this.rules.get(domain)
    if (!domainRules) return false
    return domainRules.delete(ruleId)
  }

  /**
   * Get all rules for a domain
   */
  getRules(domain: KnowledgeDomain): ReasoningRule[] {
    const domainRules = this.rules.get(domain)
    return domainRules ? Array.from(domainRules.values()) : []
  }

  /**
   * Create a reasoning context
   */
  createContext(
    domain: KnowledgeDomain,
    subject: string,
    description: string,
    options?: Partial<KnowledgeContext>
  ): KnowledgeContext {
    const context: KnowledgeContext = {
      id: `ctx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      domain,
      subject,
      description,
      constraints: options?.constraints || [],
      requirements: options?.requirements || [],
      code: options?.code,
      architecture: options?.architecture,
      environment: options?.environment,
      metadata: options?.metadata,
      timestamp: new Date().toISOString()
    }
    this.contextCache.set(context.id, context)
    return context
  }

  /**
   * Perform reasoning on a context
   */
  async reason(context: KnowledgeContext): Promise<ReasoningResult> {
    await this.init()

    // Check cache
    const cached = this.resultCache.get(context.id)
    if (cached) return cached

    // Domain-specific reasoning
    let result: ReasoningResult

    switch (context.domain) {
      case 'architecture':
        result = await this.reasonAboutArchitecture(context)
        break
      case 'best_practice':
        result = await this.reasonAboutBestPractices(context)
        break
      case 'performance':
        result = await this.reasonAboutPerformance(context)
        break
      case 'security':
        result = await this.reasonAboutSecurity(context)
        break
      case 'scalability':
        result = await this.reasonAboutScalability(context)
        break
      case 'maintainability':
        result = await this.reasonAboutMaintainability(context)
        break
      case 'cost':
        result = await this.reasonAboutCost(context)
        break
      case 'compatibility':
        result = await this.reasonAboutCompatibility(context)
        break
      case 'technology_tradeoff':
        result = await this.reasonAboutTechnologyTradeoffs(context)
        break
      case 'design_pattern':
        result = await this.reasonAboutDesignPatterns(context)
        break
      default:
        result = await this.genericReasoning(context)
    }

    // Cache result
    this.resultCache.set(context.id, result)
    return result
  }

  /**
   * Multi-domain reasoning
   */
  async multiDomainReason(
    contexts: KnowledgeContext[]
  ): Promise<Map<string, ReasoningResult>> {
    const results = new Map<string, ReasoningResult>()
    
    for (const context of contexts) {
      const result = await this.reason(context)
      results.set(context.id, result)
    }

    return results
  }

  // ===========================================================================
  // DOMAIN-SPECIFIC REASONING IMPLEMENTATIONS
  // ===========================================================================

  /**
   * #91: Architecture Reasoning
   * Apply and validate architecture patterns
   */
  private async reasonAboutArchitecture(
    context: KnowledgeContext
  ): Promise<ArchitectureReasoningResult> {
    const rules = this.getRules('architecture')
    const appliedRules: AppliedRule[] = []
    const findings: Finding[] = []
    const recommendations: Recommendation[] = []
    const patternCompliance: PatternCompliance[] = []
    const structuralIssues: StructuralIssue[] = []

    // Analyze code for architecture patterns
    const code = context.code || context.description

    for (const rule of rules) {
      const applied = await this.applyRule(rule, code, context)
      appliedRules.push(applied)

      if (!applied.matched && applied.impact === 'negative') {
        findings.push({
          id: `finding_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
          type: 'issue',
          severity: rule.priority === 'critical' ? 'critical' : rule.priority === 'high' ? 'error' : 'warning',
          title: `Architecture Issue: ${rule.name}`,
          description: rule.description,
          evidence: [applied.matchDetails || ''],
          relatedRules: [rule.id]
        })
      }
    }

    // Check for common architecture patterns
    const archPatterns = [
      'MVC', 'MVVM', 'Clean Architecture', 'Hexagonal', 'Layered',
      'Microservices', 'Monolith', 'Serverless', 'Event-Driven'
    ]

    for (const pattern of archPatterns) {
      const compliance = await this.checkPatternCompliance(pattern, code, context)
      patternCompliance.push(compliance)
    }

    // Identify structural issues
    if (code) {
      const couplingIssues = this.detectCouplingIssues(code)
      structuralIssues.push(...couplingIssues)

      const cohesionIssues = this.detectCohesionIssues(code)
      structuralIssues.push(...cohesionIssues)
    }

    // Generate architecture recommendations
    recommendations.push(...this.generateArchitectureRecommendations(
      appliedRules, patternCompliance, structuralIssues
    ))

    // Calculate scores
    const architectureScore = this.calculateArchitectureScore(
      appliedRules, patternCompliance, structuralIssues
    )
    const overallScore = architectureScore
    const confidence = this.calculateConfidence(appliedRules)

    return {
      id: `result_${Date.now().toString(36)}`,
      contextId: context.id,
      domain: 'architecture',
      rules: appliedRules,
      findings,
      recommendations,
      score: overallScore,
      confidence,
      expertise: this.determineExpertise(overallScore, appliedRules.length),
      summary: this.generateArchitectureSummary(architectureScore, structuralIssues),
      details: this.generateDetailedAnalysis(appliedRules, findings),
      relatedDomains: ['scalability', 'maintainability', 'design_pattern'],
      timestamp: new Date().toISOString(),
      architectureScore,
      patternCompliance,
      structuralIssues,
      improvementOpportunities: this.identifyArchitectureImprovements(
        patternCompliance, structuralIssues
      )
    }
  }

  /**
   * #92: Best Practice Reasoning
   * Apply coding best practices
   */
  private async reasonAboutBestPractices(
    context: KnowledgeContext
  ): Promise<BestPracticeReasoningResult> {
    const rules = this.getRules('best_practice')
    const appliedRules: AppliedRule[] = []
    const findings: Finding[] = []
    const recommendations: Recommendation[] = []
    const followedPractices: PracticeAssessment[] = []
    const violatedPractices: PracticeAssessment[] = []

    const code = context.code || context.description

    for (const rule of rules) {
      const applied = await this.applyRule(rule, code, context)
      appliedRules.push(applied)

      const practice: PracticeAssessment = {
        practice: rule.name,
        category: rule.tags[0] || 'general',
        followed: applied.matched,
        score: applied.score,
        details: applied.reasoning,
        improvement: applied.matched ? undefined : rule.recommendation
      }

      if (applied.matched) {
        followedPractices.push(practice)
      } else {
        violatedPractices.push(practice)
        
        findings.push({
          id: `finding_${Date.now().toString(36)}`,
          type: 'issue',
          severity: rule.priority === 'high' ? 'error' : 'warning',
          title: `Best Practice Violation: ${rule.name}`,
          description: rule.description,
          relatedRules: [rule.id]
        })
      }
    }

    // Generate recommendations for violated practices
    for (const violated of violatedPractices) {
      recommendations.push({
        id: `rec_${Date.now().toString(36)}`,
        priority: 'medium',
        title: `Follow ${violated.practice}`,
        description: violated.improvement || 'Apply this best practice',
        rationale: violated.details,
        relatedFindings: findings.filter(f => f.title.includes(violated.practice)).map(f => f.id)
      })
    }

    const practiceScore = this.calculatePracticeScore(followedPractices, violatedPractices)
    const overallScore = practiceScore
    const confidence = this.calculateConfidence(appliedRules)

    return {
      id: `result_${Date.now().toString(36)}`,
      contextId: context.id,
      domain: 'best_practice',
      rules: appliedRules,
      findings,
      recommendations,
      score: overallScore,
      confidence,
      expertise: this.determineExpertise(overallScore, appliedRules.length),
      summary: `Best practices score: ${(practiceScore * 100).toFixed(0)}%. ${followedPractices.length} followed, ${violatedPractices.length} violations.`,
      details: this.generateDetailedAnalysis(appliedRules, findings),
      relatedDomains: ['maintainability', 'security', 'performance'],
      timestamp: new Date().toISOString(),
      practiceScore,
      followedPractices,
      violatedPractices,
      suggestedPractices: this.suggestMissingPractices(code, context)
    }
  }

  /**
   * #93: Performance Reasoning
   * Analyze performance implications
   */
  private async reasonAboutPerformance(
    context: KnowledgeContext
  ): Promise<PerformanceReasoningResult> {
    const rules = this.getRules('performance')
    const appliedRules: AppliedRule[] = []
    const findings: Finding[] = []
    const recommendations: Recommendation[] = []
    const bottlenecks: PerformanceBottleneck[] = []
    const optimizations: PerformanceOptimization[] = []
    const metrics: PerformanceMetric[] = []

    const code = context.code || context.description

    // Apply performance rules
    for (const rule of rules) {
      const applied = await this.applyRule(rule, code, context)
      appliedRules.push(applied)

      if (!applied.matched) {
        findings.push({
          id: `finding_${Date.now().toString(36)}`,
          type: 'risk',
          severity: 'warning',
          title: `Performance: ${rule.name}`,
          description: rule.description,
          relatedRules: [rule.id]
        })
      }
    }

    // Detect performance bottlenecks
    if (code) {
      const detectedBottlenecks = await this.detectPerformanceBottlenecks(code, context)
      bottlenecks.push(...detectedBottlenecks)
    }

    // Suggest optimizations
    optimizations.push(...this.suggestPerformanceOptimizations(code, bottlenecks))

    // Generate performance recommendations
    for (const bottleneck of bottlenecks) {
      recommendations.push({
        id: `rec_${Date.now().toString(36)}`,
        priority: bottleneck.severity === 'critical' ? 'critical' : 'high',
        title: `Fix Performance Bottleneck: ${bottleneck.type}`,
        description: bottleneck.description,
        rationale: `Estimated impact: ${bottleneck.estimatedImpact}`,
        implementation: [bottleneck.solution],
        relatedFindings: []
      })
    }

    const performanceScore = this.calculatePerformanceScore(bottlenecks, appliedRules)
    const overallScore = performanceScore
    const confidence = this.calculateConfidence(appliedRules)

    return {
      id: `result_${Date.now().toString(36)}`,
      contextId: context.id,
      domain: 'performance',
      rules: appliedRules,
      findings,
      recommendations,
      score: overallScore,
      confidence,
      expertise: this.determineExpertise(overallScore, appliedRules.length),
      summary: `Performance score: ${(performanceScore * 100).toFixed(0)}%. ${bottlenecks.length} bottlenecks identified.`,
      details: this.generateDetailedAnalysis(appliedRules, findings),
      relatedDomains: ['scalability', 'architecture', 'cost'],
      timestamp: new Date().toISOString(),
      performanceScore,
      bottlenecks,
      optimizations,
      metrics
    }
  }

  /**
   * #94: Security Reasoning
   * Identify security concerns
   */
  private async reasonAboutSecurity(
    context: KnowledgeContext
  ): Promise<SecurityReasoningResult> {
    const rules = this.getRules('security')
    const appliedRules: AppliedRule[] = []
    const findings: Finding[] = []
    const recommendations: Recommendation[] = []
    const vulnerabilities: SecurityVulnerability[] = []
    const threats: ThreatAssessment[] = []
    const mitigations: SecurityMitigation[] = []

    const code = context.code || context.description

    // Apply security rules
    for (const rule of rules) {
      const applied = await this.applyRule(rule, code, context)
      appliedRules.push(applied)

      if (applied.matched && applied.impact === 'negative') {
        const vuln: SecurityVulnerability = {
          id: `vuln_${Date.now().toString(36)}`,
          type: this.mapRuleToVulnType(rule),
          severity: this.mapPriorityToSeverity(rule.priority),
          description: rule.description,
          location: applied.matchDetails || 'Unknown location',
          remediation: rule.recommendation,
          references: rule.references || []
        }
        vulnerabilities.push(vuln)

        findings.push({
          id: `finding_${Date.now().toString(36)}`,
          type: 'risk',
          severity: 'critical',
          title: `Security Vulnerability: ${rule.name}`,
          description: rule.description,
          evidence: [applied.matchDetails || ''],
          relatedRules: [rule.id]
        })
      }
    }

    // Perform threat modeling
    threats.push(...await this.performThreatModeling(code, context))

    // Generate security recommendations
    for (const vuln of vulnerabilities) {
      recommendations.push({
        id: `rec_${Date.now().toString(36)}`,
        priority: vuln.severity === 'critical' ? 'critical' : 'high',
        title: `Fix Security Vulnerability: ${vuln.type}`,
        description: vuln.description,
        rationale: 'Security vulnerabilities can lead to data breaches and system compromise',
        implementation: [vuln.remediation],
        relatedFindings: findings.filter(f => f.title.includes(vuln.type)).map(f => f.id)
      })

      mitigations.push({
        vulnerability: vuln.type,
        mitigation: vuln.remediation,
        status: 'recommended',
        effectiveness: 'high'
      })
    }

    const securityScore = this.calculateSecurityScore(vulnerabilities, appliedRules)
    const overallScore = securityScore
    const confidence = this.calculateConfidence(appliedRules)

    return {
      id: `result_${Date.now().toString(36)}`,
      contextId: context.id,
      domain: 'security',
      rules: appliedRules,
      findings,
      recommendations,
      score: overallScore,
      confidence,
      expertise: this.determineExpertise(overallScore, appliedRules.length),
      summary: `Security score: ${(securityScore * 100).toFixed(0)}%. ${vulnerabilities.length} vulnerabilities found.`,
      details: this.generateDetailedAnalysis(appliedRules, findings),
      relatedDomains: ['architecture', 'compatibility'],
      timestamp: new Date().toISOString(),
      securityScore,
      vulnerabilities,
      threats,
      mitigations
    }
  }

  /**
   * #95: Scalability Reasoning
   * Evaluate scaling capabilities
   */
  private async reasonAboutScalability(
    context: KnowledgeContext
  ): Promise<ScalabilityReasoningResult> {
    const rules = this.getRules('scalability')
    const appliedRules: AppliedRule[] = []
    const findings: Finding[] = []
    const recommendations: Recommendation[] = []
    const scalingCapabilities: ScalingCapability[] = []
    const limitations: ScalabilityLimitation[] = []
    const strategies: ScalingStrategy[] = []

    const code = context.code || context.description

    // Apply scalability rules
    for (const rule of rules) {
      const applied = await this.applyRule(rule, code, context)
      appliedRules.push(applied)
    }

    // Analyze scaling capabilities
    scalingCapabilities.push(...this.analyzeScalingCapabilities(code, context))

    // Identify limitations
    limitations.push(...this.identifyScalabilityLimitations(code, context))

    // Suggest scaling strategies
    strategies.push(...this.suggestScalingStrategies(limitations, context))

    // Generate findings
    for (const limitation of limitations) {
      findings.push({
        id: `finding_${Date.now().toString(36)}`,
        type: 'risk',
        severity: 'warning',
        title: `Scalability Limitation: ${limitation.area}`,
        description: limitation.limitation,
        evidence: [`Impact: ${limitation.impact}`],
        relatedRules: []
      })
    }

    // Generate recommendations
    for (const strategy of strategies) {
      recommendations.push({
        id: `rec_${Date.now().toString(36)}`,
        priority: 'medium',
        title: `Implement ${strategy.type} Strategy`,
        description: strategy.description,
        rationale: `Trigger: ${strategy.trigger}, Cost: ${strategy.cost}`,
        implementation: [strategy.implementation],
        relatedFindings: []
      })
    }

    const scalabilityScore = this.calculateScalabilityScore(
      scalingCapabilities, limitations, appliedRules
    )
    const overallScore = scalabilityScore
    const confidence = this.calculateConfidence(appliedRules)

    return {
      id: `result_${Date.now().toString(36)}`,
      contextId: context.id,
      domain: 'scalability',
      rules: appliedRules,
      findings,
      recommendations,
      score: overallScore,
      confidence,
      expertise: this.determineExpertise(overallScore, appliedRules.length),
      summary: `Scalability score: ${(scalabilityScore * 100).toFixed(0)}%. ${limitations.length} limitations identified.`,
      details: this.generateDetailedAnalysis(appliedRules, findings),
      relatedDomains: ['architecture', 'performance', 'cost'],
      timestamp: new Date().toISOString(),
      scalabilityScore,
      scalingCapabilities,
      limitations,
      strategies
    }
  }

  /**
   * #96: Maintainability Reasoning
   * Assess maintainability
   */
  private async reasonAboutMaintainability(
    context: KnowledgeContext
  ): Promise<MaintainabilityReasoningResult> {
    const rules = this.getRules('maintainability')
    const appliedRules: AppliedRule[] = []
    const findings: Finding[] = []
    const recommendations: Recommendation[] = []
    const technicalDebt: TechnicalDebt[] = []
    const improvementAreas: MaintainabilityImprovement[] = []

    const code = context.code || context.description

    // Apply maintainability rules
    for (const rule of rules) {
      const applied = await this.applyRule(rule, code, context)
      appliedRules.push(applied)
    }

    // Analyze code quality
    const codeQuality = this.analyzeCodeQuality(code)

    // Identify technical debt
    technicalDebt.push(...this.identifyTechnicalDebt(code, context))

    // Identify improvement areas
    improvementAreas.push(...this.identifyMaintainabilityImprovements(codeQuality, technicalDebt))

    // Generate findings
    for (const debt of technicalDebt) {
      findings.push({
        id: `finding_${Date.now().toString(36)}`,
        type: 'issue',
        severity: 'warning',
        title: `Technical Debt: ${debt.type}`,
        description: debt.description,
        evidence: [`Impact: ${debt.impact}`],
        relatedRules: []
      })
    }

    // Generate recommendations
    for (const improvement of improvementAreas) {
      recommendations.push({
        id: `rec_${Date.now().toString(36)}`,
        priority: 'medium',
        title: `Improve ${improvement.area}`,
        description: `From: ${improvement.current}\nTo: ${improvement.target}`,
        rationale: `Benefit: ${improvement.benefit}`,
        effort: improvement.effort as any,
        relatedFindings: []
      })
    }

    const maintainabilityScore = this.calculateMaintainabilityScore(codeQuality, technicalDebt)
    const overallScore = maintainabilityScore
    const confidence = this.calculateConfidence(appliedRules)

    return {
      id: `result_${Date.now().toString(36)}`,
      contextId: context.id,
      domain: 'maintainability',
      rules: appliedRules,
      findings,
      recommendations,
      score: overallScore,
      confidence,
      expertise: this.determineExpertise(overallScore, appliedRules.length),
      summary: `Maintainability score: ${(maintainabilityScore * 100).toFixed(0)}%. ${technicalDebt.length} debt items.`,
      details: this.generateDetailedAnalysis(appliedRules, findings),
      relatedDomains: ['best_practice', 'architecture', 'design_pattern'],
      timestamp: new Date().toISOString(),
      maintainabilityScore,
      codeQuality,
      technicalDebt,
      improvementAreas
    }
  }

  /**
   * #97: Cost Reasoning
   * Estimate costs and resources
   */
  private async reasonAboutCost(
    context: KnowledgeContext
  ): Promise<CostReasoningResult> {
    const rules = this.getRules('cost')
    const appliedRules: AppliedRule[] = []
    const findings: Finding[] = []
    const recommendations: Recommendation[] = []
    const estimates: CostEstimate[] = []
    const optimizations: CostOptimization[] = []
    const tradeoffs: CostTradeoff[] = []

    // Apply cost rules
    for (const rule of rules) {
      const applied = await this.applyRule(rule, context.description, context)
      appliedRules.push(applied)
    }

    // Generate cost estimates
    estimates.push(...this.estimateCosts(context))

    // Identify cost optimizations
    optimizations.push(...this.identifyCostOptimizations(context, estimates))

    // Analyze cost tradeoffs
    tradeoffs.push(...this.analyzeCostTradeoffs(context))

    // Generate findings and recommendations
    for (const opt of optimizations) {
      recommendations.push({
        id: `rec_${Date.now().toString(36)}`,
        priority: 'medium',
        title: `Cost Optimization: ${opt.type}`,
        description: opt.description,
        rationale: `Save $${opt.savings.toFixed(2)}/month`,
        impact: `Current: $${opt.currentCost.toFixed(2)}, Optimized: $${opt.optimizedCost.toFixed(2)}`,
        relatedFindings: []
      })
    }

    const costScore = this.calculateCostScore(estimates, optimizations)
    const overallScore = costScore
    const confidence = this.calculateConfidence(appliedRules)

    return {
      id: `result_${Date.now().toString(36)}`,
      contextId: context.id,
      domain: 'cost',
      rules: appliedRules,
      findings,
      recommendations,
      score: overallScore,
      confidence,
      expertise: this.determineExpertise(overallScore, appliedRules.length),
      summary: `Cost efficiency score: ${(costScore * 100).toFixed(0)}%. ${optimizations.length} optimizations available.`,
      details: this.generateDetailedAnalysis(appliedRules, findings),
      relatedDomains: ['scalability', 'performance', 'architecture'],
      timestamp: new Date().toISOString(),
      costScore,
      estimates,
      optimizations,
      tradeoffs
    }
  }

  /**
   * #98: Compatibility Reasoning
   * Check compatibility issues
   */
  private async reasonAboutCompatibility(
    context: KnowledgeContext
  ): Promise<CompatibilityReasoningResult> {
    const rules = this.getRules('compatibility')
    const appliedRules: AppliedRule[] = []
    const findings: Finding[] = []
    const recommendations: Recommendation[] = []
    const compatibility: CompatibilityCheck[] = []
    const breakingChanges: BreakingChange[] = []
    const migrations: MigrationPath[] = []

    const code = context.code || context.description

    // Apply compatibility rules
    for (const rule of rules) {
      const applied = await this.applyRule(rule, code, context)
      appliedRules.push(applied)
    }

    // Check compatibility
    compatibility.push(...this.checkCompatibility(code, context))

    // Identify breaking changes
    breakingChanges.push(...this.identifyBreakingChanges(code, context))

    // Suggest migration paths
    migrations.push(...this.suggestMigrationPaths(breakingChanges))

    // Generate findings
    for (const bc of breakingChanges) {
      findings.push({
        id: `finding_${Date.now().toString(36)}`,
        type: 'risk',
        severity: 'warning',
        title: `Breaking Change: ${bc.type}`,
        description: bc.description,
        evidence: [`Impact: ${bc.impact}`],
        relatedRules: []
      })
    }

    // Generate recommendations
    for (const migration of migrations) {
      recommendations.push({
        id: `rec_${Date.now().toString(36)}`,
        priority: 'high',
        title: `Migrate from ${migration.from} to ${migration.to}`,
        description: migration.steps.join('\n'),
        rationale: 'Ensure compatibility and future-proofing',
        effort: migration.effort as any,
        relatedFindings: []
      })
    }

    const compatibilityScore = this.calculateCompatibilityScore(
      compatibility, breakingChanges, appliedRules
    )
    const overallScore = compatibilityScore
    const confidence = this.calculateConfidence(appliedRules)

    return {
      id: `result_${Date.now().toString(36)}`,
      contextId: context.id,
      domain: 'compatibility',
      rules: appliedRules,
      findings,
      recommendations,
      score: overallScore,
      confidence,
      expertise: this.determineExpertise(overallScore, appliedRules.length),
      summary: `Compatibility score: ${(compatibilityScore * 100).toFixed(0)}%. ${breakingChanges.length} breaking changes.`,
      details: this.generateDetailedAnalysis(appliedRules, findings),
      relatedDomains: ['architecture', 'security', 'technology_tradeoff'],
      timestamp: new Date().toISOString(),
      compatibilityScore,
      compatibility,
      breakingChanges,
      migrations
    }
  }

  /**
   * #99: Technology Tradeoff Reasoning
   * Analyze technology choices
   */
  private async reasonAboutTechnologyTradeoffs(
    context: KnowledgeContext
  ): Promise<TechnologyTradeoffReasoningResult> {
    const rules = this.getRules('technology_tradeoff')
    const appliedRules: AppliedRule[] = []
    const findings: Finding[] = []
    const recommendations: Recommendation[] = []
    const comparisons: TechnologyComparison[] = []
    const decisions: TechnologyDecision[] = []
    const alternatives: TechnologyAlternative[] = []

    // Apply tradeoff rules
    for (const rule of rules) {
      const applied = await this.applyRule(rule, context.description, context)
      appliedRules.push(applied)
    }

    // Compare technologies
    comparisons.push(...await this.compareTechnologies(context))

    // Make decisions
    decisions.push(...this.makeTechnologyDecisions(comparisons, context))

    // Suggest alternatives
    alternatives.push(...this.suggestTechnologyAlternatives(context))

    // Generate findings and recommendations
    for (const decision of decisions) {
      recommendations.push({
        id: `rec_${Date.now().toString(36)}`,
        priority: 'high',
        title: `Technology Decision: ${decision.decision}`,
        description: decision.rationale,
        rationale: `Tradeoffs: ${decision.tradeoffs.join(', ')}`,
        relatedFindings: []
      })
    }

    const tradeoffScore = this.calculateTradeoffScore(comparisons, decisions)
    const overallScore = tradeoffScore
    const confidence = this.calculateConfidence(appliedRules)

    return {
      id: `result_${Date.now().toString(36)}`,
      contextId: context.id,
      domain: 'technology_tradeoff',
      rules: appliedRules,
      findings,
      recommendations,
      score: overallScore,
      confidence,
      expertise: this.determineExpertise(overallScore, appliedRules.length),
      summary: `Technology fit score: ${(tradeoffScore * 100).toFixed(0)}%. ${decisions.length} decisions analyzed.`,
      details: this.generateDetailedAnalysis(appliedRules, findings),
      relatedDomains: ['architecture', 'compatibility', 'cost'],
      timestamp: new Date().toISOString(),
      tradeoffScore,
      comparisons,
      decisions,
      alternatives
    }
  }

  /**
   * #100: Design Pattern Reasoning
   * Apply appropriate patterns
   */
  private async reasonAboutDesignPatterns(
    context: KnowledgeContext
  ): Promise<DesignPatternReasoningResult> {
    const rules = this.getRules('design_pattern')
    const appliedRules: AppliedRule[] = []
    const findings: Finding[] = []
    const recommendations: Recommendation[] = []
    const appliedPatterns: AppliedPattern[] = []
    const missingPatterns: MissingPattern[] = []
    const antiPatterns: AntiPatternDetection[] = []

    const code = context.code || context.description

    // Apply design pattern rules
    for (const rule of rules) {
      const applied = await this.applyRule(rule, code, context)
      appliedRules.push(applied)
    }

    // Detect applied patterns
    appliedPatterns.push(...this.detectAppliedPatterns(code))

    // Identify missing patterns
    missingPatterns.push(...this.identifyMissingPatterns(code, context))

    // Detect anti-patterns
    antiPatterns.push(...this.detectAntiPatterns(code))

    // Generate findings
    for (const anti of antiPatterns) {
      findings.push({
        id: `finding_${Date.now().toString(36)}`,
        type: 'issue',
        severity: anti.severity === 'high' ? 'error' : 'warning',
        title: `Anti-pattern: ${anti.name}`,
        description: anti.description,
        location: anti.location,
        evidence: [],
        relatedRules: []
      })
    }

    // Generate recommendations
    for (const missing of missingPatterns) {
      recommendations.push({
        id: `rec_${Date.now().toString(36)}`,
        priority: 'medium',
        title: `Apply ${missing.pattern} Pattern`,
        description: missing.benefit,
        rationale: missing.applicability,
        implementation: [missing.implementation],
        effort: missing.effort as any,
        relatedFindings: []
      })
    }

    const patternScore = this.calculatePatternScore(appliedPatterns, antiPatterns)
    const overallScore = patternScore
    const confidence = this.calculateConfidence(appliedRules)

    return {
      id: `result_${Date.now().toString(36)}`,
      contextId: context.id,
      domain: 'design_pattern',
      rules: appliedRules,
      findings,
      recommendations,
      score: overallScore,
      confidence,
      expertise: this.determineExpertise(overallScore, appliedRules.length),
      summary: `Design pattern score: ${(patternScore * 100).toFixed(0)}%. ${antiPatterns.length} anti-patterns detected.`,
      details: this.generateDetailedAnalysis(appliedRules, findings),
      relatedDomains: ['architecture', 'best_practice', 'maintainability'],
      timestamp: new Date().toISOString(),
      patternScore,
      appliedPatterns,
      missingPatterns,
      antiPatterns
    }
  }

  /**
   * Generic reasoning for unknown domains
   */
  private async genericReasoning(context: KnowledgeContext): Promise<ReasoningResult> {
    const rules = this.getRules(context.domain)
    const appliedRules: AppliedRule[] = []
    const findings: Finding[] = []
    const recommendations: Recommendation[] = []

    for (const rule of rules) {
      const applied = await this.applyRule(rule, context.description, context)
      appliedRules.push(applied)
    }

    const score = this.calculateOverallScore(appliedRules)
    const confidence = this.calculateConfidence(appliedRules)

    return {
      id: `result_${Date.now().toString(36)}`,
      contextId: context.id,
      domain: context.domain,
      rules: appliedRules,
      findings,
      recommendations,
      score,
      confidence,
      expertise: this.determineExpertise(score, appliedRules.length),
      summary: `Analysis completed for ${context.domain}`,
      details: this.generateDetailedAnalysis(appliedRules, findings),
      relatedDomains: [],
      timestamp: new Date().toISOString()
    }
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  /**
   * Apply a rule to content
   */
  private async applyRule(
    rule: ReasoningRule,
    content: string,
    context: KnowledgeContext
  ): Promise<AppliedRule> {
    const applied: AppliedRule = {
      ruleId: rule.id,
      ruleName: rule.name,
      matched: false,
      impact: 'neutral',
      score: 0.5,
      reasoning: ''
    }

    try {
      const condition = rule.condition
      
      switch (condition.type) {
        case 'pattern':
          if (condition.pattern) {
            const regex = condition.pattern instanceof RegExp 
              ? condition.pattern 
              : new RegExp(condition.pattern, 'gi')
            const matches = content.match(regex)
            applied.matched = matches !== null && matches.length > 0
            applied.matchDetails = matches?.slice(0, 3).join(', ')
          }
          break

        case 'presence':
          if (condition.presence) {
            const found = condition.presence.filter(p => 
              content.toLowerCase().includes(p.toLowerCase())
            )
            applied.matched = found.length === condition.presence.length
            applied.matchDetails = `Found: ${found.join(', ')}`
          }
          break

        case 'absence':
          if (condition.absence) {
            const found = condition.absence.filter(p => 
              content.toLowerCase().includes(p.toLowerCase())
            )
            applied.matched = found.length === 0
            applied.matchDetails = found.length > 0 ? `Found: ${found.join(', ')}` : 'All absent'
          }
          break

        case 'threshold':
          // Threshold checks would need specific metrics
          applied.matched = true
          applied.matchDetails = 'Threshold check (requires metrics)'
          break

        case 'composite':
          if (condition.composite) {
            applied.matched = this.evaluateCompositeCondition(condition.composite, content)
          }
          break
      }

      // Set impact and score
      applied.impact = applied.matched ? 'positive' : 'negative'
      applied.score = applied.matched ? 0.8 : 0.3
      applied.reasoning = applied.matched 
        ? `Rule ${rule.name} conditions satisfied` 
        : `Rule ${rule.name} conditions not met`

    } catch (error) {
      applied.reasoning = `Error applying rule: ${error}`
      applied.score = 0.5
    }

    return applied
  }

  /**
   * Evaluate composite condition
   */
  private evaluateCompositeCondition(
    composite: { operator: 'and' | 'or' | 'not'; conditions: RuleCondition[] },
    content: string
  ): boolean {
    switch (composite.operator) {
      case 'and':
        return composite.conditions.every(c => this.evaluateCondition(c, content))
      case 'or':
        return composite.conditions.some(c => this.evaluateCondition(c, content))
      case 'not':
        return !this.evaluateCondition(composite.conditions[0], content)
      default:
        return false
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: RuleCondition, content: string): boolean {
    switch (condition.type) {
      case 'pattern':
        if (condition.pattern) {
          const regex = condition.pattern instanceof RegExp 
            ? condition.pattern 
            : new RegExp(condition.pattern, 'gi')
          return regex.test(content)
        }
        return false
      case 'presence':
        return condition.presence?.every(p => 
          content.toLowerCase().includes(p.toLowerCase())
        ) ?? false
      case 'absence':
        return condition.absence?.every(p => 
          !content.toLowerCase().includes(p.toLowerCase())
        ) ?? true
      default:
        return false
    }
  }

  /**
   * Check pattern compliance
   */
  private async checkPatternCompliance(
    pattern: string,
    code: string,
    context: KnowledgeContext
  ): Promise<PatternCompliance> {
    const compliance: PatternCompliance = {
      pattern,
      compliant: false,
      score: 0.5,
      gaps: [],
      suggestions: []
    }

    // Pattern-specific checks
    const patternChecks: Record<string, () => void> = {
      'MVC': () => {
        const hasModel = /model|entity|schema/i.test(code)
        const hasView = /view|template|component|page/i.test(code)
        const hasController = /controller|handler|route|api/i.test(code)
        compliance.compliant = hasModel && hasView && hasController
        compliance.score = (Number(hasModel) + Number(hasView) + Number(hasController)) / 3
        if (!hasModel) compliance.gaps.push('Missing model layer')
        if (!hasView) compliance.gaps.push('Missing view layer')
        if (!hasController) compliance.gaps.push('Missing controller layer')
      },
      'Clean Architecture': () => {
        const hasEntities = /entity|domain/i.test(code)
        const hasUseCases = /usecase|use-case|service/i.test(code)
        const hasInterface = /interface|port|gateway/i.test(code)
        compliance.compliant = hasEntities && hasUseCases
        compliance.score = (Number(hasEntities) + Number(hasUseCases) + Number(hasInterface)) / 3
      },
      'Microservices': () => {
        const hasServiceBoundary = /service|microservice|module/i.test(code)
        const hasAPIGateway = /gateway|proxy|router/i.test(code)
        const hasServiceDiscovery = /discovery|registry|consul/i.test(code)
        compliance.score = (Number(hasServiceBoundary) + Number(hasAPIGateway) + Number(hasServiceDiscovery)) / 3
        compliance.compliant = compliance.score > 0.5
      }
    }

    const check = patternChecks[pattern]
    if (check) {
      check()
    } else {
      compliance.suggestions.push(`Pattern ${pattern} detection not implemented`)
    }

    return compliance
  }

  /**
   * Detect coupling issues
   */
  private detectCouplingIssues(code: string): StructuralIssue[] {
    const issues: StructuralIssue[] = []

    // Check for tight coupling patterns
    const couplingPatterns = [
      { pattern: /new\s+\w+\(\)/gi, type: 'direct instantiation' },
      { pattern: /import\s+.*\s+from\s+['"].*\/src\//gi, type: 'internal import' },
      { pattern: /\.prototype\./gi, type: 'prototype access' }
    ]

    for (const { pattern, type } of couplingPatterns) {
      const matches = code.match(pattern)
      if (matches && matches.length > 3) {
        issues.push({
          type: 'coupling',
          severity: 'medium',
          description: `Potential tight coupling: ${type} detected ${matches.length} times`,
          location: 'Multiple locations',
          suggestion: 'Consider dependency injection or interface abstraction'
        })
      }
    }

    return issues
  }

  /**
   * Detect cohesion issues
   */
  private detectCohesionIssues(code: string): StructuralIssue[] {
    const issues: StructuralIssue[] = []

    // Check for low cohesion (many responsibilities)
    const classMatches = code.match(/class\s+\w+[\s\S]*?{/g) || []
    
    for (const classMatch of classMatches) {
      const methods = classMatch.match(/(?:async\s+)?\w+\s*\([^)]*\)\s*{/g) || []
      if (methods.length > 10) {
        const className = classMatch.match(/class\s+(\w+)/)?.[1] || 'Unknown'
        issues.push({
          type: 'cohesion',
          severity: 'low',
          description: `Class ${className} has ${methods.length} methods, may violate SRP`,
          location: className,
          suggestion: 'Consider splitting into smaller, focused classes'
        })
      }
    }

    return issues
  }

  /**
   * Generate architecture recommendations
   */
  private generateArchitectureRecommendations(
    appliedRules: AppliedRule[],
    patternCompliance: PatternCompliance[],
    structuralIssues: StructuralIssue[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = []

    for (const issue of structuralIssues) {
      recommendations.push({
        id: `rec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
        priority: issue.severity === 'high' ? 'high' : 'medium',
        title: `Fix ${issue.type} issue`,
        description: issue.description,
        rationale: 'Improve architectural quality',
        implementation: [issue.suggestion],
        relatedFindings: []
      })
    }

    for (const compliance of patternCompliance.filter(c => !c.compliant && c.score > 0.3)) {
      recommendations.push({
        id: `rec_${Date.now().toString(36)}`,
        priority: 'medium',
        title: `Improve ${compliance.pattern} compliance`,
        description: compliance.gaps.join(', '),
        rationale: 'Better adherence to architectural patterns',
        implementation: compliance.suggestions,
        relatedFindings: []
      })
    }

    return recommendations
  }

  /**
   * Identify architecture improvements
   */
  private identifyArchitectureImprovements(
    patternCompliance: PatternCompliance[],
    structuralIssues: StructuralIssue[]
  ): ArchitectureImprovement[] {
    const improvements: ArchitectureImprovement[] = []

    for (const compliance of patternCompliance.filter(c => !c.compliant)) {
      improvements.push({
        area: compliance.pattern,
        currentState: `${(compliance.score * 100).toFixed(0)}% compliance`,
        suggestedState: 'Full pattern compliance',
        benefit: 'Better architectural integrity',
        effort: compliance.gaps.length > 2 ? 'High' : 'Medium'
      })
    }

    return improvements
  }

  /**
   * Calculate architecture score
   */
  private calculateArchitectureScore(
    appliedRules: AppliedRule[],
    patternCompliance: PatternCompliance[],
    structuralIssues: StructuralIssue[]
  ): number {
    let score = 1.0

    // Penalize for structural issues
    score -= structuralIssues.length * 0.05

    // Consider pattern compliance
    const avgCompliance = patternCompliance.reduce((sum, c) => sum + c.score, 0) / 
      (patternCompliance.length || 1)
    score = (score + avgCompliance) / 2

    // Consider rule matches
    const positiveRules = appliedRules.filter(r => r.impact === 'positive').length
    score = (score + positiveRules / (appliedRules.length || 1)) / 2

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Calculate practice score
   */
  private calculatePracticeScore(
    followed: PracticeAssessment[],
    violated: PracticeAssessment[]
  ): number {
    const total = followed.length + violated.length
    if (total === 0) return 0.5
    return followed.length / total
  }

  /**
   * Suggest missing practices
   */
  private suggestMissingPractices(code: string, context: KnowledgeContext): string[] {
    const suggestions: string[] = []

    if (!/test|spec/i.test(code)) {
      suggestions.push('Add unit tests')
    }
    if (!/typescript|\.ts/i.test(code)) {
      suggestions.push('Consider TypeScript for type safety')
    }
    if (!/eslint|prettier/i.test(code)) {
      suggestions.push('Add linting and formatting tools')
    }

    return suggestions
  }

  /**
   * Detect performance bottlenecks
   */
  private async detectPerformanceBottlenecks(
    code: string,
    context: KnowledgeContext
  ): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = []

    // N+1 Query detection
    if (/for\s*\([\s\S]*?\)\s*{[\s\S]*?(?:await.*find|\.query)/i.test(code)) {
      bottlenecks.push({
        type: 'database',
        location: 'Loop with database query',
        severity: 'high',
        description: 'Potential N+1 query problem detected',
        estimatedImpact: 'Linear query growth with data size',
        solution: 'Use eager loading or batch queries'
      })
    }

    // Large array operations
    if (/\.map\([\s\S]*?\.filter\(|\.filter\([\s\S]*?\.map\(/i.test(code)) {
      bottlenecks.push({
        type: 'algorithm',
        location: 'Array operations',
        severity: 'medium',
        description: 'Multiple array iterations',
        estimatedImpact: 'O(n) multiple times over same data',
        solution: 'Combine operations or use single iteration'
      })
    }

    // Synchronous heavy operations
    if (/JSON\.parse|JSON\.stringify|crypto\./i.test(code)) {
      bottlenecks.push({
        type: 'cpu',
        location: 'Heavy synchronous operations',
        severity: 'medium',
        description: 'CPU-intensive synchronous operations',
        estimatedImpact: 'Block event loop',
        solution: 'Move to worker threads or async processing'
      })
    }

    return bottlenecks
  }

  /**
   * Suggest performance optimizations
   */
  private suggestPerformanceOptimizations(
    code: string,
    bottlenecks: PerformanceBottleneck[]
  ): PerformanceOptimization[] {
    const optimizations: PerformanceOptimization[] = []

    for (const bottleneck of bottlenecks) {
      switch (bottleneck.type) {
        case 'database':
          optimizations.push({
            type: 'indexing',
            description: 'Add database indexes for frequently queried fields',
            expectedGain: '50-90% query time reduction',
            implementation: 'Analyze query patterns and add appropriate indexes',
            priority: 'high'
          })
          break
        case 'cpu':
          optimizations.push({
            type: 'parallelization',
            description: 'Move CPU-intensive work to worker threads',
            expectedGain: 'Non-blocking main thread',
            implementation: 'Use worker_threads or offload to queue',
            priority: 'medium'
          })
          break
        case 'algorithm':
          optimizations.push({
            type: 'batching',
            description: 'Batch operations to reduce iterations',
            expectedGain: 'Reduced time complexity',
            implementation: 'Use single-pass algorithms where possible',
            priority: 'medium'
          })
          break
      }
    }

    // General optimizations
    if (!/cache|memoize/i.test(code)) {
      optimizations.push({
        type: 'caching',
        description: 'Implement caching for frequently accessed data',
        expectedGain: 'Variable based on cache hit rate',
        implementation: 'Use Redis, in-memory cache, or CDN as appropriate',
        priority: 'high'
      })
    }

    return optimizations
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(
    bottlenecks: PerformanceBottleneck[],
    appliedRules: AppliedRule[]
  ): number {
    let score = 1.0

    for (const bottleneck of bottlenecks) {
      score -= bottleneck.severity === 'critical' ? 0.3 :
               bottleneck.severity === 'high' ? 0.2 :
               bottleneck.severity === 'medium' ? 0.1 : 0.05
    }

    const positiveRules = appliedRules.filter(r => r.impact === 'positive').length
    const ruleScore = appliedRules.length > 0 ? positiveRules / appliedRules.length : 0.5

    return Math.max(0, Math.min(1, (score + ruleScore) / 2))
  }

  /**
   * Map rule to vulnerability type
   */
  private mapRuleToVulnType(rule: ReasoningRule): SecurityVulnerability['type'] {
    const mapping: Record<string, SecurityVulnerability['type']> = {
      'sql': 'injection',
      'xss': 'xss',
      'auth': 'auth',
      'data': 'data_exposure',
      'config': 'misconfiguration',
      'dependency': 'dependency'
    }

    const tag = rule.tags.find(t => mapping[t])
    return tag ? mapping[tag] : 'misconfiguration'
  }

  /**
   * Map priority to severity
   */
  private mapPriorityToSeverity(priority: string): SecurityVulnerability['severity'] {
    switch (priority) {
      case 'critical': return 'critical'
      case 'high': return 'high'
      case 'medium': return 'medium'
      default: return 'low'
    }
  }

  /**
   * Perform threat modeling
   */
  private async performThreatModeling(
    code: string,
    context: KnowledgeContext
  ): Promise<ThreatAssessment[]> {
    const threats: ThreatAssessment[] = [
      {
        threat: 'Unauthorized Access',
        likelihood: 'medium',
        impact: 'high',
        risk: 'Authentication bypass or insufficient authorization',
        mitigation: 'Implement robust auth/authz with proper session management'
      },
      {
        threat: 'Data Breach',
        likelihood: 'medium',
        impact: 'critical',
        risk: 'Sensitive data exposure through API or storage',
        mitigation: 'Encrypt data at rest and in transit, implement access controls'
      },
      {
        threat: 'Denial of Service',
        likelihood: 'low',
        impact: 'high',
        risk: 'Service availability compromised',
        mitigation: 'Implement rate limiting, circuit breakers, and scaling'
      }
    ]

    return threats
  }

  /**
   * Calculate security score
   */
  private calculateSecurityScore(
    vulnerabilities: SecurityVulnerability[],
    appliedRules: AppliedRule[]
  ): number {
    let score = 1.0

    for (const vuln of vulnerabilities) {
      score -= vuln.severity === 'critical' ? 0.3 :
               vuln.severity === 'high' ? 0.2 :
               vuln.severity === 'medium' ? 0.1 : 0.05
    }

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Analyze scaling capabilities
   */
  private analyzeScalingCapabilities(
    code: string,
    context: KnowledgeContext
  ): ScalingCapability[] {
    const capabilities: ScalingCapability[] = []

    // Check for stateless design
    const isStateless = !/session|global\s+state|static\s+\w+\s*=/i.test(code)
    capabilities.push({
      dimension: 'horizontal',
      currentLimit: isStateless ? 'Limited by infrastructure' : 'Stateful - limited',
      bottleneck: isStateless ? 'None identified' : 'Application state',
      headroom: isStateless ? 'High' : 'Low'
    })

    // Check database scaling
    const hasConnectionPool = /pool|connection.*limit/i.test(code)
    capabilities.push({
      dimension: 'data',
      currentLimit: hasConnectionPool ? 'Connection pool size' : 'Single connection',
      bottleneck: hasConnectionPool ? 'Pool configuration' : 'Database connections',
      headroom: hasConnectionPool ? 'Medium' : 'Low'
    })

    return capabilities
  }

  /**
   * Identify scalability limitations
   */
  private identifyScalabilityLimitations(
    code: string,
    context: KnowledgeContext
  ): ScalabilityLimitation[] {
    const limitations: ScalabilityLimitation[] = []

    if (/localStorage|sessionStorage|memory/i.test(code)) {
      limitations.push({
        area: 'Session Storage',
        limitation: 'Client-side storage limits scalability',
        impact: 'Session data lost on scale-out',
        workaround: 'Use distributed cache',
        permanentFix: 'Implement server-side session store'
      })
    }

    if (!/queue|worker|async/i.test(code)) {
      limitations.push({
        area: 'Synchronous Processing',
        limitation: 'No async processing for heavy operations',
        impact: 'Limited throughput under load',
        workaround: 'Scale vertically',
        permanentFix: 'Implement message queue and workers'
      })
    }

    return limitations
  }

  /**
   * Suggest scaling strategies
   */
  private suggestScalingStrategies(
    limitations: ScalabilityLimitation[],
    context: KnowledgeContext
  ): ScalingStrategy[] {
    const strategies: ScalingStrategy[] = []

    for (const limitation of limitations) {
      if (limitation.area === 'Session Storage') {
        strategies.push({
          type: 'scale_out',
          description: 'Implement distributed session storage',
          trigger: 'Multiple instances needed',
          cost: 'Medium - Redis or similar',
          implementation: 'Configure Redis session store'
        })
      }

      if (limitation.area === 'Synchronous Processing') {
        strategies.push({
          type: 'queue',
          description: 'Implement async processing queue',
          trigger: 'Request latency exceeds threshold',
          cost: 'Medium - Queue service',
          implementation: 'Add message queue and worker processes'
        })
      }
    }

    // Add general strategies
    strategies.push({
      type: 'caching',
      description: 'Implement multi-layer caching',
      trigger: 'High read load',
      cost: 'Low to Medium',
      implementation: 'Add CDN, Redis cache, application cache'
    })

    return strategies
  }

  /**
   * Calculate scalability score
   */
  private calculateScalabilityScore(
    capabilities: ScalingCapability[],
    limitations: ScalabilityLimitation[],
    appliedRules: AppliedRule[]
  ): number {
    let score = 1.0

    for (const limitation of limitations) {
      score -= 0.1
    }

    for (const cap of capabilities) {
      if (cap.headroom === 'Low') score -= 0.1
      if (cap.headroom === 'High') score += 0.05
    }

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Analyze code quality metrics
   */
  private analyzeCodeQuality(code: string): CodeQualityMetrics {
    return {
      readability: this.assessReadability(code),
      testability: this.assessTestability(code),
      modularity: this.assessModularity(code),
      documentation: this.assessDocumentation(code),
      consistency: this.assessConsistency(code),
      complexity: this.assessComplexity(code)
    }
  }

  /**
   * Assess code readability
   */
  private assessReadability(code: string): number {
    let score = 0.5

    // Check for meaningful names
    const meaningfulNames = !/(var x|let y|const z|function f\()/i.test(code)
    if (meaningfulNames) score += 0.2

    // Check for consistent indentation
    const consistentIndent = /^(?:  |\t)[^\s]/m.test(code)
    if (consistentIndent) score += 0.1

    // Check for appropriate length
    const lines = code.split('\n').length
    if (lines < 500) score += 0.1
    else if (lines > 1000) score -= 0.1

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Assess testability
   */
  private assessTestability(code: string): number {
    let score = 0.5

    // Check for dependency injection
    if (/inject|constructor.*\(|parameter/i.test(code)) score += 0.2

    // Check for pure functions
    if (/export\s+(function|const)/i.test(code)) score += 0.1

    // Check for interface definitions
    if (/interface\s+\w+/i.test(code)) score += 0.1

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Assess modularity
   */
  private assessModularity(code: string): number {
    let score = 0.5

    const imports = (code.match(/import|require/g) || []).length
    const exports = (code.match(/export/g) || []).length

    if (imports > 0 && imports < 20) score += 0.2
    if (exports > 0 && exports < 20) score += 0.2

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Assess documentation
   */
  private assessDocumentation(code: string): number {
    const docComments = (code.match(/\/\*\*[\s\S]*?\*\//g) || []).length
    const inlineComments = (code.match(/\/\/.*/g) || []).length
    const totalLines = code.split('\n').length

    const docRatio = (docComments + inlineComments) / totalLines
    return Math.min(1, docRatio * 10)
  }

  /**
   * Assess consistency
   */
  private assessConsistency(code: string): number {
    let score = 0.7

    // Check for mixed quotes
    const singleQuotes = (code.match(/'/g) || []).length
    const doubleQuotes = (code.match(/"/g) || []).length
    if (singleQuotes > 0 && doubleQuotes > 0) {
      const ratio = Math.min(singleQuotes, doubleQuotes) / Math.max(singleQuotes, doubleQuotes)
      if (ratio < 0.3) score -= 0.1
    }

    // Check for consistent semicolons
    const hasSemicolons = /;\s*\n/g.test(code)
    const noSemicolons = /\n\s*\n/g.test(code) && !hasSemicolons
    if (!hasSemicolons && !noSemicolons) score -= 0.1

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Assess complexity
   */
  private assessComplexity(code: string): number {
    const cyclomaticIndicators = (code.match(/if|else|for|while|switch|case|catch|\?/g) || []).length
    const lines = code.split('\n').length
    
    const complexityPerLine = cyclomaticIndicators / lines
    // Lower is better for complexity
    return Math.max(0, 1 - complexityPerLine * 2)
  }

  /**
   * Identify technical debt
   */
  private identifyTechnicalDebt(code: string, context: KnowledgeContext): TechnicalDebt[] {
    const debt: TechnicalDebt[] = []

    // TODO comments
    const todos = code.match(/TODO|FIXME|HACK|XXX/gi) || []
    if (todos.length > 0) {
      debt.push({
        type: 'code',
        description: `${todos.length} TODO/FIXME comments pending`,
        impact: 'May indicate incomplete features',
        effort: 'Variable',
        priority: 'low',
        interest: 'Accumulates as codebase grows'
      })
    }

    // Long functions
    const functions = code.match(/function\s+\w+[\s\S]{500,}?}/g) || []
    if (functions.length > 0) {
      debt.push({
        type: 'code',
        description: `${functions.length} functions exceed 500 characters`,
        impact: 'Harder to understand and test',
        effort: 'Medium',
        priority: 'medium',
        interest: 'Increases bug likelihood'
      })
    }

    // Any types
    const anyTypes = (code.match(/:\s*any|as\s+any/g) || []).length
    if (anyTypes > 3) {
      debt.push({
        type: 'code',
        description: `${anyTypes} uses of 'any' type`,
        impact: 'Reduced type safety',
        effort: 'Medium',
        priority: 'medium',
        interest: 'Type errors may go undetected'
      })
    }

    return debt
  }

  /**
   * Identify maintainability improvements
   */
  private identifyMaintainabilityImprovements(
    codeQuality: CodeQualityMetrics,
    technicalDebt: TechnicalDebt[]
  ): MaintainabilityImprovement[] {
    const improvements: MaintainabilityImprovement[] = []

    if (codeQuality.readability < 0.6) {
      improvements.push({
        area: 'Readability',
        current: `${(codeQuality.readability * 100).toFixed(0)}%`,
        target: '80%',
        benefit: 'Easier code reviews and onboarding',
        effort: 'Low'
      })
    }

    if (codeQuality.testability < 0.6) {
      improvements.push({
        area: 'Testability',
        current: `${(codeQuality.testability * 100).toFixed(0)}%`,
        target: '80%',
        benefit: 'Better test coverage and reliability',
        effort: 'Medium'
      })
    }

    if (technicalDebt.length > 5) {
      improvements.push({
        area: 'Technical Debt',
        current: `${technicalDebt.length} items`,
        target: '< 3 items',
        benefit: 'Reduced maintenance burden',
        effort: 'High'
      })
    }

    return improvements
  }

  /**
   * Calculate maintainability score
   */
  private calculateMaintainabilityScore(
    codeQuality: CodeQualityMetrics,
    technicalDebt: TechnicalDebt[]
  ): number {
    const qualityScore = (
      codeQuality.readability +
      codeQuality.testability +
      codeQuality.modularity +
      codeQuality.documentation +
      codeQuality.consistency +
      codeQuality.complexity
    ) / 6

    const debtPenalty = technicalDebt.length * 0.03

    return Math.max(0, Math.min(1, qualityScore - debtPenalty))
  }

  /**
   * Estimate costs
   */
  private estimateCosts(context: KnowledgeContext): CostEstimate[] {
    const estimates: CostEstimate[] = []

    // Basic cost estimation based on architecture
    if (context.architecture) {
      estimates.push({
        category: 'compute',
        item: 'Application servers',
        monthly: 100,
        confidence: 'low'
      })

      estimates.push({
        category: 'storage',
        item: 'Database storage',
        monthly: 50,
        confidence: 'low'
      })

      estimates.push({
        category: 'network',
        item: 'Data transfer',
        monthly: 20,
        confidence: 'low'
      })
    }

    return estimates
  }

  /**
   * Identify cost optimizations
   */
  private identifyCostOptimizations(
    context: KnowledgeContext,
    estimates: CostEstimate[]
  ): CostOptimization[] {
    const optimizations: CostOptimization[] = []

    const totalMonthly = estimates.reduce((sum, e) => sum + (e.monthly || 0), 0)

    if (totalMonthly > 200) {
      optimizations.push({
        type: 'reserved',
        description: 'Purchase reserved instances for stable workloads',
        currentCost: totalMonthly,
        optimizedCost: totalMonthly * 0.7,
        savings: totalMonthly * 0.3,
        effort: 'Low'
      })
    }

    return optimizations
  }

  /**
   * Analyze cost tradeoffs
   */
  private analyzeCostTradeoffs(context: KnowledgeContext): CostTradeoff[] {
    return [
      {
        decision: 'Managed vs Self-hosted',
        costImpact: 'Managed services cost more but reduce operations',
        otherBenefit: 'Reduced maintenance and better reliability',
        recommendation: 'Use managed services for non-core functionality'
      },
      {
        decision: 'Spot vs On-demand instances',
        costImpact: 'Spot instances up to 90% cheaper',
        otherBenefit: 'Cost savings',
        recommendation: 'Use spot for fault-tolerant, flexible workloads'
      }
    ]
  }

  /**
   * Calculate cost score
   */
  private calculateCostScore(
    estimates: CostEstimate[],
    optimizations: CostOptimization[]
  ): number {
    if (estimates.length === 0) return 0.5

    const potentialSavings = optimizations.reduce((sum, o) => sum + o.savings, 0)
    const currentCost = estimates.reduce((sum, e) => sum + (e.monthly || 0), 0)

    if (currentCost === 0) return 0.5

    const efficiency = 1 - (potentialSavings / currentCost)
    return Math.max(0, Math.min(1, efficiency))
  }

  /**
   * Check compatibility
   */
  private checkCompatibility(code: string, context: KnowledgeContext): CompatibilityCheck[] {
    const checks: CompatibilityCheck[] = []

    // Node.js version check
    checks.push({
      component: 'Node.js',
      version: '18.x',
      compatible: true,
      issues: [],
      fixes: []
    })

    // Browser compatibility
    const usesNewFeatures = /optional\s+chaining|nullish\s+coalescing|\?\.|??/i.test(code)
    checks.push({
      component: 'Browser',
      version: 'Modern',
      compatible: true,
      issues: usesNewFeatures ? ['New ES features may need transpilation for older browsers'] : [],
      fixes: usesNewFeatures ? ['Configure Babel for target browsers'] : []
    })

    return checks
  }

  /**
   * Identify breaking changes
   */
  private identifyBreakingChanges(code: string, context: KnowledgeContext): BreakingChange[] {
    const changes: BreakingChange[] = []

    // API versioning check
    if (/api\/v1|api\/v2/i.test(code)) {
      changes.push({
        type: 'api',
        description: 'Multiple API versions detected',
        impact: 'Need to maintain backward compatibility',
        migration: 'Document deprecation timeline for old versions',
        effort: 'Medium'
      })
    }

    return changes
  }

  /**
   * Suggest migration paths
   */
  private suggestMigrationPaths(breakingChanges: BreakingChange[]): MigrationPath[] {
    return breakingChanges.map(bc => ({
      from: 'Current',
      to: 'Target',
      steps: ['Assess impact', 'Create migration plan', 'Implement changes', 'Test thoroughly'],
      risks: ['Potential downtime', 'Breaking client integrations'],
      effort: bc.effort
    }))
  }

  /**
   * Calculate compatibility score
   */
  private calculateCompatibilityScore(
    compatibility: CompatibilityCheck[],
    breakingChanges: BreakingChange[],
    appliedRules: AppliedRule[]
  ): number {
    let score = 1.0

    for (const check of compatibility) {
      if (!check.compatible) score -= 0.2
      score -= check.issues.length * 0.05
    }

    score -= breakingChanges.length * 0.1

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Compare technologies
   */
  private async compareTechnologies(context: KnowledgeContext): Promise<TechnologyComparison[]> {
    return [
      {
        technology: 'React',
        pros: ['Large ecosystem', 'Component reusability', 'Virtual DOM'],
        cons: ['Learning curve', 'Bundle size'],
        fitScore: 0.8,
        useCases: ['SPAs', 'Dashboards', 'Interactive UIs'],
        risks: ['Over-engineering for simple pages']
      },
      {
        technology: 'Next.js',
        pros: ['SSR/SSG', 'File-based routing', 'API routes'],
        cons: ['Framework lock-in', 'Build complexity'],
        fitScore: 0.9,
        useCases: ['Content sites', 'E-commerce', 'Hybrid apps'],
        risks: ['Complex caching strategies']
      }
    ]
  }

  /**
   * Make technology decisions
   */
  private makeTechnologyDecisions(
    comparisons: TechnologyComparison[],
    context: KnowledgeContext
  ): TechnologyDecision[] {
    const decisions: TechnologyDecision[] = []

    // Sort by fit score and make recommendation
    const sorted = [...comparisons].sort((a, b) => b.fitScore - a.fitScore)
    
    if (sorted.length > 0) {
      decisions.push({
        decision: `Recommended: ${sorted[0].technology}`,
        rationale: `Best fit score: ${sorted[0].fitScore}. Suitable for: ${sorted[0].useCases.join(', ')}`,
        alternatives: sorted.slice(1).map(t => t.technology),
        tradeoffs: sorted[0].cons,
        confidence: sorted[0].fitScore
      })
    }

    return decisions
  }

  /**
   * Suggest technology alternatives
   */
  private suggestTechnologyAlternatives(context: KnowledgeContext): TechnologyAlternative[] {
    return [
      {
        name: 'Vue.js',
        reason: 'Simpler learning curve',
        advantages: ['Gentle learning curve', 'Good documentation'],
        disadvantages: ['Smaller ecosystem than React'],
        transition: 'Rewrite components in Vue syntax'
      },
      {
        name: 'Svelte',
        reason: 'Better performance',
        advantages: ['No virtual DOM', 'Smaller bundles'],
        disadvantages: ['Smaller community', 'Fewer libraries'],
        transition: 'Convert to Svelte components'
      }
    ]
  }

  /**
   * Calculate tradeoff score
   */
  private calculateTradeoffScore(
    comparisons: TechnologyComparison[],
    decisions: TechnologyDecision[]
  ): number {
    if (comparisons.length === 0) return 0.5
    return comparisons.reduce((sum, c) => sum + c.fitScore, 0) / comparisons.length
  }

  /**
   * Detect applied patterns
   */
  private detectAppliedPatterns(code: string): AppliedPattern[] {
    const patterns: AppliedPattern[] = []

    // Singleton detection
    if (/getInstance|private\s+static\s+instance/i.test(code)) {
      patterns.push({
        pattern: 'Singleton',
        location: 'getInstance method',
        correct: true,
        improvements: [],
        benefits: ['Global access point', 'Single instance guarantee']
      })
    }

    // Factory detection
    if (/create\w+|factory/i.test(code)) {
      patterns.push({
        pattern: 'Factory',
        location: 'Factory methods',
        correct: true,
        improvements: [],
        benefits: ['Encapsulated object creation', 'Flexible instantiation']
      })
    }

    // Observer detection
    if (/subscribe|emit|addEventListener|on\s*\(/i.test(code)) {
      patterns.push({
        pattern: 'Observer',
        location: 'Event handling',
        correct: true,
        improvements: [],
        benefits: ['Decoupled event handling', 'Reactive updates']
      })
    }

    // Repository detection
    if (/repository|find.*By|save|delete/i.test(code)) {
      patterns.push({
        pattern: 'Repository',
        location: 'Data access layer',
        correct: true,
        improvements: [],
        benefits: ['Abstracted data access', 'Testable data layer']
      })
    }

    return patterns
  }

  /**
   * Identify missing patterns
   */
  private identifyMissingPatterns(code: string, context: KnowledgeContext): MissingPattern[] {
    const missing: MissingPattern[] = []

    // Check for missing dependency injection
    if (/new\s+\w+\(/.test(code) && !/inject|container/i.test(code)) {
      missing.push({
        pattern: 'Dependency Injection',
        benefit: 'Better testability and loose coupling',
        applicability: 'Classes with external dependencies',
        implementation: 'Use DI container or constructor injection',
        effort: 'Medium'
      })
    }

    // Check for missing strategy pattern
    if (/if.*type.*===.*['"]\w+['"]|switch.*type/i.test(code)) {
      missing.push({
        pattern: 'Strategy',
        benefit: 'Eliminate conditional logic for behaviors',
        applicability: 'Multiple algorithm variants',
        implementation: 'Extract strategies into separate classes',
        effort: 'Medium'
      })
    }

    return missing
  }

  /**
   * Detect anti-patterns
   */
  private detectAntiPatterns(code: string): AntiPatternDetection[] {
    const antiPatterns: AntiPatternDetection[] = []

    // God object
    const classMatches = code.match(/class\s+\w+[\s\S]*?{/g) || []
    for (const match of classMatches) {
      const methods = match.match(/(?:async\s+)?\w+\s*\([^)]*\)\s*{/g) || []
      if (methods.length > 15) {
        const className = match.match(/class\s+(\w+)/)?.[1] || 'Unknown'
        antiPatterns.push({
          name: 'God Object',
          type: 'Structural',
          location: className,
          severity: 'high',
          description: `Class ${className} has ${methods.length} methods`,
          solution: 'Split into smaller, focused classes'
        })
      }
    }

    // Spaghetti code - long functions
    const functionMatches = code.match(/function\s+\w+[\s\S]{1000,}?}/g) || []
    if (functionMatches.length > 0) {
      antiPatterns.push({
        name: 'Long Method',
        type: 'Code Smell',
        location: 'Multiple functions',
        severity: 'medium',
        description: `${functionMatches.length} functions exceed 1000 characters`,
        solution: 'Extract methods and reduce function length'
      })
    }

    // Copy-paste programming
    const lines = code.split('\n').map(l => l.trim()).filter(l => l.length > 20)
    const uniqueLines = new Set(lines)
    if (lines.length - uniqueLines.size > lines.length * 0.1) {
      antiPatterns.push({
        name: 'Duplicate Code',
        type: 'Code Smell',
        location: 'Multiple locations',
        severity: 'medium',
        description: 'Significant code duplication detected',
        solution: 'Extract common code into reusable functions'
      })
    }

    return antiPatterns
  }

  /**
   * Calculate pattern score
   */
  private calculatePatternScore(
    appliedPatterns: AppliedPattern[],
    antiPatterns: AntiPatternDetection[]
  ): number {
    let score = 0.5

    score += appliedPatterns.filter(p => p.correct).length * 0.1
    score -= antiPatterns.filter(a => a.severity === 'high').length * 0.2
    score -= antiPatterns.filter(a => a.severity === 'medium').length * 0.1

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(appliedRules: AppliedRule[]): number {
    if (appliedRules.length === 0) return 0.5
    
    const positiveRules = appliedRules.filter(r => r.impact === 'positive').length
    return positiveRules / appliedRules.length
  }

  /**
   * Calculate confidence
   */
  private calculateConfidence(appliedRules: AppliedRule[]): number {
    if (appliedRules.length === 0) return 0.3
    if (appliedRules.length < 3) return 0.5
    if (appliedRules.length < 5) return 0.7
    return 0.85
  }

  /**
   * Determine expertise level
   */
  private determineExpertise(score: number, rulesApplied: number): DomainExpertise {
    if (score >= 0.9 && rulesApplied >= 10) return 'master'
    if (score >= 0.75 && rulesApplied >= 5) return 'expert'
    if (score >= 0.5 && rulesApplied >= 3) return 'intermediate'
    return 'novice'
  }

  /**
   * Generate architecture summary
   */
  private generateArchitectureSummary(
    score: number,
    issues: StructuralIssue[]
  ): string {
    const scoreText = score >= 0.8 ? 'Excellent' : score >= 0.6 ? 'Good' : score >= 0.4 ? 'Fair' : 'Needs Improvement'
    const issueText = issues.length === 0 ? 'No structural issues' : `${issues.length} structural issues identified`
    
    return `Architecture score: ${(score * 100).toFixed(0)}% (${scoreText}). ${issueText}.`
  }

  /**
   * Generate detailed analysis
   */
  private generateDetailedAnalysis(
    appliedRules: AppliedRule[],
    findings: Finding[]
  ): string {
    const parts: string[] = []

    parts.push(`Rules Applied: ${appliedRules.length}`)
    parts.push(`Findings: ${findings.length}`)

    const positiveRules = appliedRules.filter(r => r.impact === 'positive')
    const negativeRules = appliedRules.filter(r => r.impact === 'negative')
    
    parts.push(`Positive Patterns: ${positiveRules.length}`)
    parts.push(`Issues Identified: ${negativeRules.length}`)

    return parts.join('\n')
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.contextCache.clear()
    this.resultCache.clear()
  }

  /**
   * Get engine statistics
   */
  getStats(): {
    rulesCount: number
    contextCacheSize: number
    resultCacheSize: number
  } {
    let rulesCount = 0
    for (const domainRules of this.rules.values()) {
      rulesCount += domainRules.size
    }

    return {
      rulesCount,
      contextCacheSize: this.contextCache.size,
      resultCacheSize: this.resultCache.size
    }
  }

  /**
   * Export rules configuration
   */
  exportRules(): Map<KnowledgeDomain, ReasoningRule[]> {
    const exported = new Map<KnowledgeDomain, ReasoningRule[]>()
    for (const [domain, rules] of this.rules) {
      exported.set(domain, Array.from(rules.values()))
    }
    return exported
  }

  /**
   * Import rules configuration
   */
  importRules(rules: Map<KnowledgeDomain, ReasoningRule[]>): void {
    for (const [domain, domainRules] of rules) {
      const domainMap = this.rules.get(domain) || new Map()
      for (const rule of domainRules) {
        domainMap.set(rule.id, rule)
      }
      this.rules.set(domain, domainMap)
    }
  }
}

// ============================================================================
// SINGLETON AND CONVENIENCE FUNCTIONS
// ============================================================================

let engineInstance: KnowledgeReasoningEngine | null = null

/**
 * Get the singleton instance of the Knowledge Reasoning Engine
 */
export function getKnowledgeReasoningEngine(): KnowledgeReasoningEngine {
  if (!engineInstance) {
    engineInstance = new KnowledgeReasoningEngine()
  }
  return engineInstance
}

/**
 * Convenience function for quick knowledge reasoning
 */
export async function reasonAboutKnowledge(
  domain: KnowledgeDomain,
  subject: string,
  description: string,
  code?: string,
  options?: Partial<KnowledgeContext>
): Promise<ReasoningResult> {
  const engine = getKnowledgeReasoningEngine()
  const context = engine.createContext(domain, subject, description, { code, ...options })
  return engine.reason(context)
}
