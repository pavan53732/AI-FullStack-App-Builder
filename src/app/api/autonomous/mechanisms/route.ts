/**
 * API Route: Autonomous Mechanisms
 * 
 * Exposes all 86 autonomous AI mechanisms to the frontend.
 * Provides endpoints for:
 * - Listing all available mechanisms
 * - Executing specific mechanisms
 * - Getting mechanism status and statistics
 */

import { NextRequest, NextResponse } from 'next/server'

// Import all autonomous modules
import * as Autonomous from '@/lib/autonomous'

// Mechanism Categories with descriptions
const MECHANISM_CATEGORIES = {
  core_infrastructure: {
    name: 'Core Infrastructure',
    description: 'Foundation systems for project management and indexing',
    modules: ['indexer', 'dependency-manager', 'error-recovery', 'progress-persistence', 'context-manager', 'server-monitor', 'build-verifier', 'command-validator']
  },
  advanced_systems: {
    name: 'Advanced Systems',
    description: 'Docker, database, multi-agent, git, checkpoint, test generation, IaC',
    modules: ['docker-manager', 'database-manager', 'multi-agent', 'git-manager', 'checkpoint-manager', 'test-generator', 'iac-generator']
  },
  ai_reasoning: {
    name: 'AI Reasoning Layer',
    description: 'Chain-of-thought, AST parsing, message bus, architecture analysis',
    modules: ['chain-of-thought', 'ast-parser', 'agent-message-bus', 'architecture-graph', 'self-critique', 'intent-classifier', 'task-decomposer', 'workload-balancer', 'complexity-analyzer']
  },
  quality_security: {
    name: 'Quality & Security',
    description: 'Security scanning, audit logging, RAG system, architecture drift',
    modules: ['security-scanner', 'audit-logger', 'rag-system', 'architecture-drift']
  },
  advanced_ai: {
    name: 'Advanced AI Systems',
    description: 'Self-improving reasoning, tool use, governance, integrated workflow',
    modules: ['self-improving-reasoning', 'tool-use-reasoning', 'agent-governance', 'integrated-workflow']
  },
  monitoring_retrieval: {
    name: 'Monitoring & Retrieval',
    description: 'Agent metrics, doc retrieval, feasibility checking, runtime analysis',
    modules: ['agent-metrics', 'doc-retriever', 'feasibility-checker', 'runtime-analyzer']
  },
  planning_validation: {
    name: 'Planning & Validation',
    description: 'Pattern retrieval, constraint solving, requirement validation, collaboration',
    modules: ['pattern-retriever', 'constraint-solver', 'requirement-validator', 'agent-collaboration']
  },
  runtime_intelligence: {
    name: 'Runtime Intelligence',
    description: 'Performance profiling, crash analysis, resource monitoring',
    modules: ['performance-profiler', 'crash-analyzer', 'resource-monitor']
  },
  retrieval_intelligence: {
    name: 'Retrieval Intelligence',
    description: 'API reference retrieval, reranking, query rewriting, knowledge validation',
    modules: ['api-reference-retriever', 'retrieval-reranker', 'query-rewriter', 'knowledge-validator']
  },
  agent_enhancement: {
    name: 'Agent Enhancement',
    description: 'Dynamic agent spawning, swarm coordination, negotiation, skill improvement',
    modules: ['dynamic-agent-spawner', 'swarm-coordinator', 'agent-negotiator', 'skill-improver']
  },
  code_intelligence: {
    name: 'Code Intelligence',
    description: 'Code querying, rewriting, refactoring, migration',
    modules: ['code-query-engine', 'code-rewrite-engine', 'refactoring-engine', 'migration-engine']
  },
  architecture_simulation: {
    name: 'Architecture Simulation',
    description: 'Traffic, failure, scaling simulation, capacity planning',
    modules: ['architecture-simulator']
  },
  documentation_intelligence: {
    name: 'Documentation Intelligence',
    description: 'Documentation generation, component docs, README synthesis',
    modules: ['documentation-generator', 'documentation-intelligence']
  },
  code_embeddings: {
    name: 'Code Embeddings',
    description: 'Code embedding generation, semantic similarity, clustering',
    modules: ['code-embedding-generator']
  },
  dependency_health: {
    name: 'Dependency Health',
    description: 'Vulnerability scanning, license compliance, dependency scoring',
    modules: ['dependency-health-monitor', 'dependency-compatibility-matrix', 'dependency-optimization', 'dependency-upgrade-system', 'package-registry-scanner']
  },
  architecture_reasoning: {
    name: 'Architecture Reasoning',
    description: 'Decision scoring, tradeoff analysis, scenario planning',
    modules: ['architecture-decision-scorer', 'architecture-tradeoff-analyzer', 'architecture-scenario-planner']
  },
  code_infrastructure: {
    name: 'Code Infrastructure',
    description: 'Intelligent caching, LRU/LFU eviction, cache invalidation',
    modules: ['code-cache-manager']
  },
  ai_reasoning_enhancement: {
    name: 'AI Reasoning Enhancement',
    description: 'Prompt optimization, strategy evaluation, plan refinement, reasoning replay',
    modules: ['prompt-optimizer', 'strategy-evaluator', 'plan-refinement', 'reasoning-replay']
  },
  knowledge_reasoning: {
    name: 'Knowledge Reasoning',
    description: 'Knowledge-based reasoning systems',
    modules: ['knowledge-reasoning']
  },
  codebase_intelligence: {
    name: 'Codebase Intelligence',
    description: 'Repository structure analysis, service boundary inference',
    modules: ['codebase-intelligence']
  },
  logical_inference: {
    name: 'Logical Inference',
    description: 'Inference chains, consistency validation, conflict detection',
    modules: ['logical-inference']
  },
  prompt_normalization: {
    name: 'Prompt Normalization',
    description: 'Prompt standardization and context enrichment',
    modules: ['prompt-normalizer']
  },
  alternative_solutions: {
    name: 'Alternative Solutions',
    description: 'Solution generation, branch exploration, tradeoff analysis',
    modules: ['alternative-solutions']
  },
  multi_language_parser: {
    name: 'Multi-Language Parser',
    description: 'Parse TypeScript, JavaScript, Python, Go, Rust, Java, and more',
    modules: ['multi-language-parser']
  },
  agent_sandbox: {
    name: 'Agent Sandbox',
    description: 'Isolated execution environments with security policies',
    modules: ['agent-sandbox']
  },
  code_quality_intelligence: {
    name: 'Code Quality Intelligence',
    description: 'Style enforcement, lint rule management, quality trends',
    modules: ['code-quality-intelligence']
  },
  coordination_infrastructure: {
    name: 'Coordination Infrastructure',
    description: 'Multi-agent coordination and communication',
    modules: ['coordination-infrastructure']
  },
  reasoning_infrastructure: {
    name: 'Reasoning Infrastructure',
    description: 'Core reasoning support systems',
    modules: ['reasoning-infrastructure']
  },
  reasoning_pattern_library: {
    name: 'Reasoning Pattern Library',
    description: 'Reusable reasoning patterns',
    modules: ['reasoning-pattern-library']
  },
  plan_validator: {
    name: 'Plan Validator',
    description: 'Validate and verify plans before execution',
    modules: ['plan-validator']
  },
  agent_recovery: {
    name: 'Agent Recovery',
    description: 'Agent failure detection and recovery',
    modules: ['agent-recovery']
  },
  // Quick Win Mechanisms (NEW - 8 Critical Features)
  message_deduplication: {
    name: 'Message Deduplication',
    description: 'Prevent duplicate messages between agents with content hashing and semantic similarity',
    modules: ['message-deduplication']
  },
  context_deduplication: {
    name: 'Context Deduplication',
    description: 'Remove duplicate context items to optimize token usage',
    modules: ['context-deduplication']
  },
  code_fingerprint: {
    name: 'Code Fingerprint Generator',
    description: 'Generate unique fingerprints for code blocks for duplicate detection',
    modules: ['code-fingerprint']
  },
  dependency_abandonment: {
    name: 'Dependency Abandonment Detection',
    description: 'Detect abandoned, deprecated, and unmaintained npm packages',
    modules: ['dependency-abandonment']
  },
  architecture_patterns: {
    name: 'Architecture Pattern Detector',
    description: 'Detect architecture patterns: microservices, monolith, CQRS, DDD, etc.',
    modules: ['architecture-patterns']
  },
  dead_end_detection: {
    name: 'Dead-End Detection',
    description: 'Detect unproductive reasoning paths and infinite loops',
    modules: ['dead-end-detection']
  },
  self_verification: {
    name: 'Self-Verification Loops',
    description: 'Verify AI outputs with constraint checking and confidence scoring',
    modules: ['self-verification']
  },
  recovery_strategies: {
    name: 'Recovery Strategy Generator',
    description: 'Generate recovery strategies when errors or failures occur',
    modules: ['recovery-strategies']
  }
}

// API Actions Map - Using explicit function type
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const API_ACTIONS: Record<string, Function> = {
  // Core Infrastructure
  'index_project': Autonomous.indexProject,
  'find_files': Autonomous.findFiles,
  'analyze_dependencies': Autonomous.analyzeDependencies,
  'detect_framework': Autonomous.detectFramework,
  'parse_errors': Autonomous.parseErrors,
  'create_task': Autonomous.createTask,
  'build_context': Autonomous.buildContext,
  'get_server_info': Autonomous.getServerInfo,
  'verify_build': Autonomous.verifyBuild,
  'validate_command': Autonomous.validateCommand,
  
  // Advanced Systems
  'is_docker_available': Autonomous.isDockerAvailable,
  'create_container': Autonomous.createContainer,
  'create_database': Autonomous.createDatabase,
  'run_migrations': Autonomous.runMigrations,
  'get_status': Autonomous.getStatus,
  'create_commit': Autonomous.createCommit,
  'create_checkpoint': Autonomous.createCheckpoint,
  'generate_unit_tests': Autonomous.generateUnitTests,
  'generate_dockerfile': Autonomous.generateDockerfile,
  
  // AI Reasoning
  'quick_reason': Autonomous.quickReason,
  'analyze_project_ast': Autonomous.analyzeProjectAST,
  'quick_critique': Autonomous.quickCritique,
  'classify_intent': Autonomous.classifyIntent,
  'decompose_task': Autonomous.decomposeTask,
  'balance_task': Autonomous.balanceTask,
  'analyze_complexity': Autonomous.analyzeComplexity,
  
  // Quality & Security
  'scan_project': Autonomous.scanProject,
  'query_audit_log': Autonomous.queryAuditLog,
  'search_knowledge': Autonomous.searchKnowledge,
  'detect_drift': Autonomous.detectDrift,
  
  // Monitoring & Retrieval
  'init_metrics': Autonomous.initMetrics,
  'retrieve_docs': Autonomous.retrieveDocs,
  'check_feasibility': Autonomous.checkFeasibility,
  'init_runtime_analyzer': Autonomous.initRuntimeAnalyzer,
  
  // Planning & Validation
  'find_patterns': Autonomous.findPatterns,
  'solve_constraints': Autonomous.solveConstraints,
  'validate_requirements': Autonomous.validateRequirements,
  'start_collaboration': Autonomous.startCollaboration,
  
  // Runtime Intelligence
  'profile_application': Autonomous.profileApplication,
  'analyze_crash': Autonomous.analyzeCrash,
  'start_resource_monitoring': Autonomous.startResourceMonitoring,
  
  // Retrieval Intelligence
  'retrieve_api': Autonomous.retrieveAPI,
  'rerank': Autonomous.rerank,
  'rewrite_query': Autonomous.rewriteQuery,
  'validate_knowledge': Autonomous.validateKnowledge,
  
  // Agent Enhancement
  'spawn_agent': Autonomous.spawnAgent,
  'execute_swarm': Autonomous.executeSwarm,
  'negotiate': Autonomous.negotiate,
  'assess_agent': Autonomous.assessAgent,
  
  // Code Intelligence
  'query_code': Autonomous.queryCode,
  'rewrite_code': Autonomous.rewriteCode,
  'refactor_code': Autonomous.refactorCode,
  'migrate_project': Autonomous.migrateProject,
  
  // Architecture & Advanced
  'run_simulation': Autonomous.runSimulation,
  'generate_docs': Autonomous.generateDocs,
  'generate_code_embedding': Autonomous.generateCodeEmbedding,
  'scan_dependencies': Autonomous.scanDependencies,
  'create_quick_score': Autonomous.createQuickScore,
  'quick_tradeoff_analysis': Autonomous.quickTradeoffAnalysis,
  'quick_scenario': Autonomous.quickScenario,
  
  // Reasoning Enhancement
  'check_inference': Autonomous.checkInference,
  'normalize_prompt': Autonomous.normalizePrompt,
  'generate_alternatives': Autonomous.generateAlternatives,
  'parse_code': Autonomous.parseCode,
  'create_sandbox': Autonomous.createSandbox,
  'analyze_quality': Autonomous.analyzeQuality,
  
  // Quick Win Mechanisms (NEW - 8 Critical Features)
  // Mechanism #148: Message Deduplication
  'is_duplicate_message': Autonomous.isDuplicate,
  'deduplicate_messages': Autonomous.deduplicate,
  'deduplicate_message_batch': Autonomous.deduplicateBatch,
  'get_message_deduplication_stats': Autonomous.getDeduplicationStats,
  
  // Mechanism #36: Context Deduplication
  'deduplicate_context': Autonomous.deduplicateContext,
  'dedup_context_quick': Autonomous.dedupContext,
  'get_context_deduplication_stats': Autonomous.getContextDeduplicationStats,
  
  // Mechanism #240: Code Fingerprint Generator
  'generate_fingerprint': Autonomous.generateFingerprint,
  'compare_code': Autonomous.compareCode,
  'is_duplicate_code': Autonomous.isDuplicateCode,
  'get_fingerprint_stats': Autonomous.getFingerprintStats,
  
  // Mechanism #454: Dependency Abandonment Detection
  'is_package_abandoned': Autonomous.isPackageAbandoned,
  'analyze_package_abandonment': Autonomous.analyzePackage,
  'get_package_risk_score': Autonomous.getPackageRiskScore,
  'generate_abandonment_report': Autonomous.generateAbandonmentReport,
  
  // Mechanism #361-370: Architecture Pattern Detector
  'detect_architecture_pattern': Autonomous.detectArchitecturePattern,
  'get_pattern_detection_stats': Autonomous.getPatternDetectionStats,
  'add_architecture_pattern': Autonomous.addArchitecturePattern,
  
  // Mechanism #89: Dead-End Detection
  'start_reasoning_path': Autonomous.startReasoningPath,
  'add_reasoning_step': Autonomous.addReasoningStep,
  'detect_dead_end': Autonomous.detectDeadEnd,
  'get_dead_end_stats': Autonomous.getDeadEndDetectionStats,
  
  // Mechanism #84: Self-Verification Loops
  'get_self_verification_system': Autonomous.getSelfVerificationSystem,
  
  // Mechanism #210: Recovery Strategy Generator
  'generate_recovery_strategy': Autonomous.generateRecoveryStrategy,
  'generate_recovery_options': Autonomous.generateRecoveryOptions,
  'create_recovery_context': Autonomous.createRecoveryContext,
  'get_recovery_stats': Autonomous.getRecoveryStats,
  
  // System Status
  'get_system_status': Autonomous.getSystemStatus,
  'initialize_autonomous': Autonomous.initializeAutonomous
}

/**
 * GET /api/autonomous/mechanisms
 * Lists all available mechanisms with their descriptions
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const category = searchParams.get('category')
  
  // Return specific mechanism status
  if (action) {
    try {
      const status = await getMechanismStatus(action)
      return NextResponse.json({
        success: true,
        mechanism: action,
        status
      })
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: `Unknown mechanism: ${action}`
      }, { status: 404 })
    }
  }
  
  // Return mechanisms by category
  if (category) {
    const cat = MECHANISM_CATEGORIES[category as keyof typeof MECHANISM_CATEGORIES]
    if (cat) {
      return NextResponse.json({
        success: true,
        category: cat.name,
        description: cat.description,
        modules: cat.modules
      })
    }
    return NextResponse.json({
      success: false,
      error: `Unknown category: ${category}`
    }, { status: 404 })
  }
  
  // Return all mechanisms
  const totalModules = Object.values(MECHANISM_CATEGORIES).reduce(
    (sum, cat) => sum + cat.modules.length, 0
  )
  
  return NextResponse.json({
    success: true,
    statistics: {
      totalCategories: Object.keys(MECHANISM_CATEGORIES).length,
      totalModules,
      totalActions: Object.keys(API_ACTIONS).length,
      coverage: '86 autonomous modules',
      linesOfCode: '90,000+'
    },
    categories: Object.entries(MECHANISM_CATEGORIES).map(([key, cat]) => ({
      id: key,
      name: cat.name,
      description: cat.description,
      moduleCount: cat.modules.length,
      modules: cat.modules
    })),
    availableActions: Object.keys(API_ACTIONS)
  })
}

/**
 * POST /api/autonomous/mechanisms
 * Execute a specific mechanism with parameters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, params = {} } = body
    
    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: action'
      }, { status: 400 })
    }
    
    const handler = API_ACTIONS[action]
    if (!handler) {
      return NextResponse.json({
        success: false,
        error: `Unknown action: ${action}`,
        availableActions: Object.keys(API_ACTIONS)
      }, { status: 404 })
    }
    
    // Execute the mechanism
    const result = await handler(params)
    
    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Mechanisms API] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

/**
 * Get the status of a specific mechanism
 */
async function getMechanismStatus(mechanism: string): Promise<{
  available: boolean
  lastUsed?: Date
  usageCount?: number
  healthScore?: number
}> {
  // Check if the mechanism exists in our actions
  const available = mechanism in API_ACTIONS
  
  if (!available) {
    // Check categories
    for (const cat of Object.values(MECHANISM_CATEGORIES)) {
      if (cat.modules.includes(mechanism)) {
        return {
          available: true,
          healthScore: 1.0
        }
      }
    }
  }
  
  return {
    available,
    healthScore: available ? 1.0 : 0
  }
}
