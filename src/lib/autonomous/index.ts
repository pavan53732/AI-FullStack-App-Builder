/**
 * Autonomous AI System - Main Entry Point
 * 
 * This module exports all autonomous subsystems:
 * - Indexer: Project file indexing
 * - DependencyManager: Auto dependency management
 * - ErrorRecovery: Error detection and fixing
 * - ProgressPersistence: Task state persistence
 * - ContextManager: Smart context for AI
 * - ServerMonitor: Dev server management
 * - BuildVerifier: Build verification
 * - DockerManager: Container isolation (NEW)
 * - DatabaseManager: Database with migrations (NEW)
 * - MultiAgent: Agent orchestration (NEW)
 * - GitManager: Version control (NEW)
 * - CheckpointManager: State snapshots (NEW)
 * - CommandValidator: Security (NEW)
 */

// Project Indexing
export {
  indexProject,
  loadIndex,
  findFiles,
  findByExport,
  findByFunction,
  getDependents,
  getDependencies,
  startIndexing,
  stopIndexing,
  getRelevantFiles,
  type FileIndex,
  type ProjectIndex,
  type TreeNode
} from './indexer'

// Dependency Management
export {
  analyzeDependencies,
  installDependencies,
  autoInstallMissing,
  detectFramework,
  getStarterDeps,
  detectImports,
  resolvePackageName,
  type DependencyInfo,
  type PackageAnalysis
} from './dependency-manager'

// Error Recovery
export {
  parseErrors,
  recoverFromErrors,
  hasErrors,
  getErrorStats,
  formatErrors,
  type ParsedError,
  type ErrorRecoveryResult,
  type ErrorFix
} from './error-recovery'

// Progress Persistence
export {
  createTask,
  saveTask,
  loadTask,
  updateTask,
  recordAction,
  recordError,
  recordRecovery,
  startTask,
  completeTask,
  failTask,
  pauseTask,
  resumeTask,
  getActiveTasks,
  getTaskHistory,
  getTaskStats,
  cleanupOldTasks,
  exportTask,
  generateTaskId,
  type TaskProgress,
  type ActionRecord,
  type ErrorRecord,
  type RecoveryRecord
} from './progress-persistence'

// Context Management
export {
  buildContext,
  getMinimalContext,
  getLineContext,
  findRelatedFiles,
  formatContextForAI,
  type ContextOptions,
  type FileContext,
  type BuildContextResult
} from './context-manager'

// Server Monitoring
export {
  startServer,
  stopServer,
  restartServer,
  getServerInfo,
  getAllServers,
  getServerByPort,
  runHealthChecks,
  startHealthChecks,
  stopHealthChecks,
  stopAllServers,
  getServerLogs,
  detectServerCommand,
  findAvailablePort,
  type ServerInfo,
  type LogEntry
} from './server-monitor'

// Build Verification
export {
  verifyTypeScript,
  verifyLint,
  verifyBuild,
  verifyTests,
  verifyPreview,
  runFullVerification,
  quickVerify,
  verifyFileExists,
  verifyPackageJson,
  checkDeploymentReady,
  type VerificationResult,
  type FullVerificationResult
} from './build-verifier'

// Docker Container Management (NEW)
export {
  isDockerAvailable,
  ensureNetwork,
  createContainer,
  createDevContainer,
  createDatabaseContainer,
  getContainerInfo,
  stopContainer,
  startContainer,
  removeContainer,
  execInContainer,
  getContainerLogs,
  listContainers,
  getProjectContainers,
  stopProjectContainers,
  removeProjectContainers,
  getContainerStats,
  pruneDocker,
  type ContainerInfo,
  type ContainerCreateOptions
} from './docker-manager'

// Database Management (NEW)
export {
  createDatabase,
  loadDatabaseConfig,
  createMigration,
  runMigrations,
  rollbackMigration,
  createBranch,
  switchBranch,
  mergeBranch,
  getSchema,
  createCheckpoint as createDbCheckpoint,
  restoreCheckpoint as restoreDbCheckpoint,
  listCheckpoints as listDbCheckpoints,
  generateMigrationFromSchema,
  type DatabaseConfig,
  type Migration,
  type DatabaseBranch,
  type SchemaInfo,
  type TableInfo,
  type ColumnInfo
} from './database-manager'

// Multi-Agent Orchestration (NEW)
export {
  MultiAgentOrchestrator,
  createOrchestrator,
  type AgentType,
  type AgentMessage,
  type AgentTask,
  type AgentContext
} from './multi-agent'

// Git Integration (NEW)
export {
  isGitAvailable,
  isGitRepo,
  initRepo,
  getStatus,
  stageFiles,
  createCommit,
  getCommit,
  getCommitHistory,
  createBranch as createGitBranch,
  switchBranch as switchGitBranch,
  getCurrentBranch,
  listBranches,
  mergeBranch as mergeGitBranch,
  addRemote,
  getRemotes,
  push,
  pull,
  createCheckpoint as createGitCheckpoint,
  restoreCheckpoint as restoreGitCheckpoint,
  generateCommitMessage,
  getDiff,
  rollback,
  type GitRepo,
  type GitStatus,
  type GitCommit,
  type GitBranch
} from './git-manager'

// Checkpoint Management (NEW)
export {
  createCheckpoint,
  listCheckpoints,
  getCheckpoint,
  restoreCheckpoint,
  deleteCheckpoint,
  compareCheckpoints,
  getCheckpointStats,
  pruneCheckpoints,
  exportCheckpoint,
  importCheckpoint,
  type Checkpoint,
  type CheckpointManifest,
  type FileInfo,
  type DatabaseSnapshot
} from './checkpoint-manager'

// Command Validation (NEW)
export {
  validateCommand,
  validatePath,
  validateCommandSequence,
  getCommandCategory,
  auditLog,
  createSafeContext,
  parseCommand,
  getCommandSuggestions,
  type CommandCategory,
  type CommandValidationResult,
  type AuditLogEntry
} from './command-validator'

// Auto Test Generation (NEW)
export {
  detectTestFramework,
  generateUnitTests,
  generateIntegrationTests,
  generateE2ETests,
  generateContractTests,
  autoGenerateTests,
  writeTestFiles,
  runTests,
  ensureTestDependencies,
  type TestFile,
  type TestResult,
  type TestFailure
} from './test-generator'

// Security Scanner (SAST) (NEW)
export {
  scanFile,
  scanProject,
  quickSecurityCheck,
  generateSecurityReport,
  autoFixIssues,
  type SecurityIssue,
  type ScanResult
} from './security-scanner'

// Audit Logging (NEW)
export {
  audit,
  queryAuditLog,
  getAuditEntry,
  getProjectTrail,
  getTaskTrail,
  verifyAuditIntegrity,
  exportAuditLog,
  pruneAuditLogs,
  withAudit,
  startAuditSession,
  getAuditStats,
  type AuditEntry,
  type AuditEventType
} from './audit-logger'

// RAG/Grounding System (NEW)
export {
  initializeKnowledgeBase,
  addDocument,
  searchKnowledge,
  findErrorSolution,
  getPatternsForTask,
  generateAugmentedPrompt,
  validateOutput,
  getLibraryDocs,
  type KnowledgeDocument,
  type RetrievedContext,
  type RAGResponse
} from './rag-system'

// IaC Generator (NEW)
export {
  analyzeProject,
  generateDockerfile,
  generateDockerCompose,
  generateKubernetes,
  generateGitHubActions,
  generateVercelConfig,
  generateAllIaC,
  writeIaCConfigs,
  generateEnvTemplate,
  aiGenerateIaC,
  type IaCConfig,
  type ProjectAnalysis
} from './iac-generator'

// Chain-of-Thought Reasoning (NEW)
export {
  ChainOfThoughtEngine,
  getCoTEngine,
  quickReason,
  type ReasoningStep,
  type ReasoningChain,
  type ReasoningConclusion
} from './chain-of-thought'

// AST Parser (NEW)
export {
  parseTypeScript,
  analyzeProject as analyzeProjectAST,
  findFunction,
  findCallers,
  detectPatterns,
  generateCodeEmbedding,
  calculateSimilarity,
  type ASTNode,
  type FunctionInfo,
  type ClassInfo,
  type FileAnalysis,
  type ProjectAnalysis as ASTProjectAnalysis
} from './ast-parser'

// Agent Message Bus (NEW)
export {
  AgentMessageBus,
  messageBus,
  createAgentClient,
  type AgentMessage,
  type AgentId,
  type AgentInfo,
  type SharedState,
  type MessageType
} from './agent-message-bus'

// Architecture Graph (NEW)
export {
  ArchitectureGraphBuilder,
  getArchitectureBuilder,
  type ArchitectureNode,
  type ArchitectureEdge,
  type ArchitectureGraph,
  type ArchitectureViolation,
  type ImpactAnalysis,
  type SimulationResult
} from './architecture-graph'

// Self-Critique Engine (NEW)
export {
  SelfCritiqueEngine,
  getCritiqueEngine,
  quickCritique,
  type CritiqueResult,
  type CritiqueDimension,
  type CritiqueIssue,
  type CritiqueImprovement
} from './self-critique'

// Integrated Autonomous Workflow (NEW)
export {
  IntegratedAutonomousWorkflow,
  createIntegratedWorkflow,
  type WorkflowConfig,
  type WorkflowState,
  type WorkflowError,
  type WorkflowResult,
  type WorkflowEvent
} from './integrated-workflow'

// Prompt Intent Classifier (NEW)
export {
  PromptIntentClassifier,
  getIntentClassifier,
  classifyIntent,
  type IntentType,
  type IntentClassification,
  type PromptAnalysis,
  type Entity
} from './intent-classifier'

// Task Decomposer (NEW)
export {
  TaskDecomposer,
  getTaskDecomposer,
  decomposeTask,
  type DecomposedTask,
  type Milestone,
  type GoalNode,
  type DecompositionResult,
  type TaskPriority,
  type TaskStatus,
  type TaskType
} from './task-decomposer'

// Workload Balancer (NEW)
export {
  WorkloadBalancer,
  getWorkloadBalancer,
  balanceTask,
  type AgentLoad,
  type TaskAssignment,
  type BalancingStrategy,
  type TaskInfo,
  type BalancerMetrics
} from './workload-balancer'

// Code Complexity Analyzer (NEW)
export {
  CodeComplexityAnalyzer,
  getComplexityAnalyzer,
  analyzeComplexity,
  type ComplexityMetrics,
  type HalsteadMetrics,
  type ComplexityIssue,
  type FunctionComplexity,
  type ProjectComplexityReport,
  type DuplicatedBlock,
  type DeadCodeLocation
} from './complexity-analyzer'

// Architecture Drift Detector (NEW)
export {
  ArchitectureDriftDetector,
  getDriftDetector,
  detectDrift,
  type ArchitectureLayer,
  type ViolationSeverity,
  type ArchitectureRule,
  type DriftViolation,
  type ArchitectureSnapshot,
  type ArchitectureMetrics,
  type DriftReport
} from './architecture-drift'

// Self-Improving Reasoning Engine (NEW)
export {
  SelfImprovingReasoningEngine,
  getSelfImprovingEngine,
  reasonWithImprovement,
  type ReasoningAttempt,
  type ReasoningStep,
  type FailurePattern,
  type SolutionRecord,
  type AdaptationStrategy,
  type ReasoningContext,
  type LearningFeedback,
  type ImprovementMetrics
} from './self-improving-reasoning'

// Tool Use Reasoning Engine (NEW)
export {
  ToolUseReasoningEngine,
  getToolUseEngine,
  selectToolForGoal,
  type Tool,
  type ToolParameter,
  type ToolReturn,
  type ToolCategory,
  type ToolSelectionContext,
  type ToolSelection,
  type ToolChain,
  type ToolChainStep,
  type ToolExecutionResult,
  type ToolReliabilityRecord
} from './tool-use-reasoning'

// Agent Governance System (NEW)
export {
  AgentGovernanceSystem,
  getGovernanceSystem,
  checkGovernance,
  type PermissionLevel,
  type ConstraintType,
  type PolicyDecision,
  type EscalationLevel,
  type Permission,
  type PermissionCondition,
  type SafetyConstraint,
  type ActionPolicy,
  type PolicyRule,
  type GovernanceContext,
  type GovernanceDecision,
  type EscalationRequest,
  type BehaviorAlert,
  type GovernanceStats
} from './agent-governance'

// Agent Metrics Collector (NEW)
export {
  AgentMetricsCollector,
  getMetricsCollector,
  initMetrics,
  type AgentMetricSnapshot,
  type ResourceUsage,
  type AgentPerformanceRecord,
  type AgentReliabilityScore,
  type MetricsAlert,
  type MetricsSummary
} from './agent-metrics'

// Documentation Retriever (NEW)
export {
  DocumentationRetriever,
  getDocRetriever,
  retrieveDocs,
  type DocumentationSource,
  type RetrievedDocument,
  type RetrievalQuery,
  type RetrievalResult,
  type DocumentationCache
} from './doc-retriever'

// Feasibility Checker (NEW)
export {
  FeasibilityChecker,
  getFeasibilityChecker,
  checkFeasibility,
  type FeasibilityContext,
  type FeasibilityConstraint,
  type ResourceAvailability,
  type FeasibilityResult,
  type FeasibilityIssue,
  type FeasibilityRisk
} from './feasibility-checker'

// Runtime Trace Analyzer (NEW)
export {
  RuntimeTraceAnalyzer,
  getRuntimeAnalyzer,
  initRuntimeAnalyzer,
  recordTrace,
  type RuntimeTrace,
  type StackFrame,
  type ParsedStackTrace,
  type PerformanceMetric,
  type MemorySnapshot,
  type ErrorPattern,
  type Anomaly,
  type RuntimeAnalysis
} from './runtime-analyzer'

// Pattern Retriever (NEW)
export {
  PatternRetriever,
  getPatternRetriever,
  findPatterns,
  type CodePattern,
  type PatternCategory,
  type PatternQuery,
  type PatternMatch,
  type PatternApplicationResult,
  type PatternLibrary
} from './pattern-retriever'

// Planning Constraint Solver (NEW)
export {
  PlanningConstraintSolver,
  getConstraintSolver,
  solveConstraints,
  type PlanningConstraint,
  type ConstraintType,
  type ConstraintSolution,
  type ConstraintViolation,
  type TaskSchedule,
  type SolverOptions,
  type SolverResult,
  type Resource
} from './constraint-solver'

// Requirement Validator (NEW)
export {
  RequirementValidator,
  getRequirementValidator,
  validateRequirements,
  parseAndAddRequirements,
  type Requirement,
  type RequirementType,
  type AcceptanceCriteria,
  type VerificationResult,
  type CriteriaResult,
  type ValidationIssue,
  type ValidationReport,
  type ValidationResult
} from './requirement-validator'

// Agent Collaboration Engine (NEW)
export {
  AgentCollaborationEngine,
  getCollaborationEngine,
  startCollaboration,
  type CollaborationSession,
  type SharedKnowledgeItem,
  type CollaborativeDecision,
  type DecisionOption,
  type CollaborativeTask,
  type CollaborationMessage,
  type MessageType,
  type CollaborationResult,
  type CollaborationOptions,
  type ConflictReport,
  type ConflictResolution
} from './agent-collaboration'

// Performance Profiler (NEW)
export {
  PerformanceProfiler,
  getPerformanceProfiler,
  profileApplication,
  profileFunction,
  type PerformanceProfile,
  type PerformanceMetrics,
  type PerformanceHotspot,
  type MemoryProfile,
  type CPUProfile,
  type IOProfile,
  type NetworkProfile,
  type RenderProfile,
  type PerformanceRecommendation,
  type PerformanceScore,
  type ProfilerConfig,
  type ProfilingSession,
  type ProfilingTarget,
  type FunctionProfileResult,
  type QuickPerformanceCheck,
  type PerformanceIssue
} from './performance-profiler'

// Crash Pattern Analyzer (NEW)
export {
  CrashPatternAnalyzer,
  getCrashAnalyzer,
  analyzeCrash,
  predictCrashes,
  type CrashReport,
  type CrashType,
  type StackTraceFrame,
  type CrashContext,
  type CrashPattern,
  type CrashPatternCategory,
  type CrashSignature,
  type CrashSolution,
  type CrashFix,
  type CrashPrediction,
  type CrashStatistics
} from './crash-analyzer'

// Resource Monitor (NEW)
export {
  ResourceMonitor,
  getResourceMonitor,
  startResourceMonitoring,
  getResourceSnapshot,
  type ResourceSnapshot,
  type CPUInfo,
  type MemoryInfo,
  type DiskInfo,
  type NetworkInfo,
  type ProcessInfo,
  type ResourceAlert,
  type AlertType,
  type AlertSeverity,
  type ResourceThresholds,
  type ResourceTrend,
  type ResourceReport,
  type ResourceSummary,
  type MonitorConfig,
  type ResourceRequirements,
  type ResourceAvailabilityCheck
} from './resource-monitor'

// API Reference Retriever (NEW)
export {
  APIReferenceRetriever,
  getAPIRetriever,
  retrieveAPI,
  type APIReference,
  type APISignature,
  type APIParameter,
  type APIReturn,
  type APIExample,
  type APISource,
  type APIRetrievalQuery,
  type APIRetrievalResult,
  type APIIndex
} from './api-reference-retriever'

// Retrieval Reranker (NEW)
export {
  RetrievalReranker,
  getReranker,
  rerank,
  type RerankableDocument,
  type RerankResult,
  type RerankOptions,
  type RerankStrategy,
  type RerankContext,
  type RerankMetrics
} from './retrieval-reranker'

// Query Rewriter (NEW)
export {
  QueryRewriter,
  getQueryRewriter,
  rewriteQuery,
  type OriginalQuery,
  type QueryContext,
  type RewrittenQuery,
  type QueryExpansion,
  type QueryDecomposition,
  type QueryMetadata,
  type RewriteStrategy,
  type RewriteOptions
} from './query-rewriter'

// Knowledge Validator (NEW)
export {
  KnowledgeValidator,
  getKnowledgeValidator,
  validateKnowledge,
  type KnowledgeItem,
  type KnowledgeSource,
  type ValidationResult,
  type ValidationCheck,
  type ValidationCheckType,
  type ValidationIssue,
  type ValidationOptions,
  type SourceCredibility,
  type CredibilityFactor
} from './knowledge-validator'

// Dynamic Agent Spawner (NEW)
export {
  DynamicAgentSpawner,
  getAgentSpawner,
  spawnAgent,
  type AgentTemplate,
  type AgentType,
  type AgentCapability,
  type AgentConfig,
  type ResourceRequirements,
  type SpawnedAgent,
  type AgentStatus,
  type ResourceUsage,
  type SpawnRequest,
  type SpawnResult,
  type SpawnMetrics
} from './dynamic-agent-spawner'

// Swarm Coordinator (NEW)
export {
  SwarmCoordinator,
  getSwarmCoordinator,
  executeSwarm,
  type SwarmTask,
  type SwarmTaskType,
  type SwarmTaskStatus,
  type SwarmTaskResult,
  type SwarmConfig,
  type SwarmStrategy,
  type RetryPolicy,
  type SwarmResult,
  type SwarmProgress,
  type SwarmPhase,
  type AgentWorkload
} from './swarm-coordinator'

// Agent Negotiator (NEW)
export {
  AgentNegotiator,
  getAgentNegotiator,
  negotiate,
  type NegotiationSession,
  type NegotiationParticipant,
  type Position,
  type Preference,
  type Constraint,
  type NegotiationStatus,
  type Proposal,
  type NegotiationResult,
  type Agreement,
  type TradeOff,
  type Conflict,
  type ConflictType,
  type ConflictResolution,
  type ResolutionStrategy
} from './agent-negotiator'

// Skill Improver (NEW)
export {
  SkillImprover,
  getSkillImprover,
  assessAgent,
  type AgentSkill,
  type SkillCategory,
  type SkillLevel,
  type SkillImprovement,
  type ImprovementMethod,
  type PracticeExercise,
  type PracticeResult,
  type SkillGain,
  type SkillGap,
  type LearningPlan,
  type SkillGoal,
  type KnowledgeTransfer,
  type AgentSkillProfile
} from './skill-improver'

// Code Query Engine (NEW)
export {
  CodeQueryEngine,
  getCodeQueryEngine,
  queryCode,
  type CodeQuery,
  type QueryType,
  type QueryFilter,
  type QueryOptions,
  type QueryResult,
  type QueryMatch,
  type MatchMetadata,
  type QueryHistory,
  type QuerySuggestion
} from './code-query-engine'

// Code Rewrite Engine (NEW)
export {
  CodeRewriteEngine,
  getCodeRewriteEngine,
  rewriteCode,
  type RewriteRule,
  type RewriteCondition,
  type RewriteRequest,
  type RewriteOptions,
  type RewriteResult,
  type RewriteChange,
  type RewriteStatistics,
  type RewriteDiff,
  type DiffHunk,
  type DiffLine
} from './code-rewrite-engine'

// Refactoring Engine (NEW)
export {
  RefactoringEngine,
  getRefactoringEngine,
  refactorCode,
  type RefactoringRequest,
  type RefactoringType,
  type CodeSelection,
  type RefactoringOptions,
  type RefactoringResult,
  type FileChange,
  type ChangeHunk,
  type RefactoringStatistics,
  type RefactoringPreview,
  type SymbolReference
} from './refactoring-engine'

// Migration Engine (NEW)
export {
  MigrationEngine,
  getMigrationEngine,
  migrateProject,
  type Migration,
  type MigrationRule,
  type RuleCondition,
  type BreakingChange,
  type MigrationRequest,
  type MigrationOptions,
  type MigrationResult,
  type FileMigrationResult,
  type CodeChange,
  type DetectedBreakingChange,
  type MigrationStatistics,
  type MigrationReport
} from './migration-engine'

// Architecture Simulator (NEW)
export {
  ArchitectureSimulator,
  getArchitectureSimulator,
  runSimulation,
  type SimulationRequest,
  type SimulationType,
  type ArchitectureSnapshot,
  type ArchitectureNode,
  type NodeCapacity,
  type ArchitectureEdge,
  type ServiceDefinition,
  type EndpointDefinition,
  type DatabaseDefinition,
  type CacheDefinition,
  type QueueDefinition,
  type SimulationScenario,
  type SimulationParameter,
  type SimulationEvent,
  type SimulationResult,
  type SimulationMetrics,
  type ResourceUtilization,
  type SaturationPoint,
  type SimulationTimelinePoint,
  type NodeState,
  type Bottleneck,
  type SimulationRecommendation,
  type SimulationRisk,
  type CostEstimate,
  type CostBreakdown
} from './architecture-simulator'

// Documentation Generator (NEW)
export {
  DocumentationGenerator,
  getDocumentationGenerator,
  generateDocs,
  type DocumentationRequest,
  type DocumentationType,
  type DocumentationTarget,
  type DocumentationOptions,
  type DocumentationResult,
  type DocumentationSection,
  type DocumentationMetadata,
  type GeneratedFile,
  type APIDocument,
  type ParameterDoc,
  type ReturnDoc,
  type ExampleDoc,
  type ComponentDoc,
  type PropDoc,
  type SlotDoc,
  type EventDoc
} from './documentation-generator'

// Code Embedding Generator (NEW)
export {
  CodeEmbeddingGenerator,
  getCodeEmbeddingGenerator,
  generateCodeEmbedding,
  findSimilarCode,
  type EmbeddingRequest,
  type EmbeddingType,
  type EmbeddingMetadata,
  type EmbeddingOptions,
  type EmbeddingResult,
  type CodeEmbedding,
  type SimilarityResult,
  type ClusterResult,
  type DuplicateResult,
  type SearchOptions,
  type SearchFilter
} from './code-embedding-generator'

// Dependency Health Monitor (NEW)
export {
  DependencyHealthMonitor,
  getDependencyHealthMonitor,
  scanDependencies,
  type DependencyScanRequest,
  type ScanOptions,
  type DependencyScanResult,
  type DependencyInfo,
  type VulnerabilityInfo,
  type OutdatedInfo,
  type LicenseIssue,
  type UnusedDependency,
  type DependencyRecommendation,
  type DependencyHealthScore,
  type DependencyAlert
} from './dependency-health-monitor'

// Architecture Decision Scorer (NEW)
export {
  ArchitectureDecisionScorer,
  createDecisionScorer,
  createArchitectureDecision,
  createQuickScore,
  type ArchitectureDecision,
  type AlternativeOption,
  type ScoringCriteria,
  type DecisionScore,
  type DecisionRelationship,
  type ScoringReport,
  type DecisionTrend
} from './architecture-decision-scorer'

// Architecture Tradeoff Analyzer (NEW)
export {
  ArchitectureTradeoffAnalyzer,
  createTradeoffAnalyzer,
  createTradeoffOption,
  createTradeoffFactor,
  quickTradeoffAnalysis,
  type TradeoffFactor,
  type TradeoffOption,
  type TradeoffConstraint,
  type TradeoffAnalysis,
  type TradeoffResult,
  type SensitivityResult,
  type TradeoffVisualization
} from './architecture-tradeoff-analyzer'

// Architecture Scenario Planner (NEW)
export {
  ArchitectureScenarioPlanner,
  createScenarioPlanner,
  createScenarioComponent,
  createScenarioPhase,
  quickScenario,
  type ArchitectureScenario,
  type ScenarioType,
  type ScenarioAssumption,
  type ScenarioComponent,
  type ComponentState,
  type ComponentChange,
  type ScenarioTimeline,
  type ScenarioPhase,
  type ScenarioTask,
  type ScenarioRisk,
  type ScenarioMetric,
  type ScenarioSimulationResult,
  type CostProjection,
  type ScenarioComparison
} from './architecture-scenario-planner'

// Code Cache Manager (NEW)
export {
  CodeCacheManager,
  CodeAnalysisCache,
  EmbeddingCache,
  createCacheManager,
  createCodeAnalysisCache,
  createEmbeddingCache,
  type CacheEntry,
  type CacheStats,
  type CachePolicy,
  type CacheQuery,
  type CacheInvalidationRule,
  type CacheDependency
} from './code-cache-manager'

// Prompt Optimizer (NEW)
export {
  PromptOptimizer,
  getPromptOptimizer,
  type PromptAnalysis,
  type PromptSuggestion,
  type OptimizedPrompt,
  type PromptChange,
  type PromptTemplate,
  type TemplateVariable,
  type TemplateExample,
  type PromptCategory,
  type OptimizationContext
} from './prompt-optimizer'

// Strategy Evaluator (NEW)
export {
  StrategyEvaluator,
  getStrategyEvaluator,
  type ReasoningStrategy,
  type StrategyParameter,
  type StrategyMetrics,
  type StrategyCategory,
  type StrategyEvaluation,
  type StrategyOutcome,
  type ResourceRequirement,
  type ComparisonResult,
  type StrategyComparison,
  type StrategyContext,
  type StrategyExecution
} from './strategy-evaluator'

// Plan Refinement Loop (NEW)
export {
  PlanRefinementLoop,
  getPlanRefinementLoop,
  type Plan,
  type PlanGoal,
  type PlanStep,
  type StepType,
  type PlanConstraint,
  type ResourceAllocation,
  type Timeline,
  type Milestone,
  type Dependency,
  type PlanMetadata,
  type RefinementContext,
  type RefinementFeedback,
  type FeedbackAspect,
  type PlanIteration,
  type PlanScore,
  type ScoreDetail,
  type RefinementAction,
  type RefinementType,
  type RefinementResult,
  type ConvergenceStatus
} from './plan-refinement'

// Reasoning Replay System (NEW)
export {
  ReasoningReplaySystem,
  getReasoningReplay,
  type ReasoningTrace,
  type TaskDescription,
  type TaskType as ReplayTaskType,
  type ReasoningStep as ReplayReasoningStep,
  type StepType as ReplayStepType,
  type AlternativePath,
  type DecisionPoint,
  type DecisionOption,
  type StepError,
  type TraceDecision,
  type TraceOutcome,
  type TraceMetadata,
  type ReplayConfig,
  type ReplaySession,
  type ReplayDeviation,
  type ReplayMetrics,
  type LearningResult,
  type LearnedPattern,
  type PatternType,
  type PatternExample,
  type SuggestedImprovement,
  type Generalization
} from './reasoning-replay'

// Logical Inference Engine (NEW) - Mechanisms #23, #29-30
export {
  LogicalInferenceEngine,
  getInferenceEngine,
  checkInference,
  validateConsistency,
  detectConflicts,
  type InferenceChain,
  type InferenceStep,
  type InferenceStepType,
  type InferenceEvidence,
  type LogicalRule,
  type ValidationIssue,
  type ValidationIssueType,
  type ChainConclusion,
  type InferenceChainMetadata,
  type ConsistencyResult,
  type Contradiction,
  type ContradictionType,
  type TemporalIssue,
  type TemporalIssueType,
  type CausalIssue,
  type CausalIssueType,
  type ScopeIssue,
  type ScopeIssueType,
  type Conflict,
  type ConflictType,
  type ConflictParty,
  type ConflictResolution,
  type ResolutionType,
  type LogicalFallacy,
  type FallacyCategory,
  type InferenceContext,
  type InferenceCheckResult,
  type ConflictDetectionOptions
} from './logical-inference'

// Prompt Normalizer (NEW) - Mechanisms #5-6
export {
  PromptNormalizer,
  getPromptNormalizer,
  normalizePrompt,
  enrichContext,
  normalizeAndEnrich,
  type NormalizedPrompt,
  type PromptTransformation,
  type TransformationType,
  type ContextEnrichment,
  type DetectedDomain,
  type DomainCategory,
  type TechnologyStack,
  type TechnologyItem,
  type IdentifiedEntity,
  type EntityType,
  type ExtractedConstraint,
  type ConstraintType,
  type EnrichmentContext,
  type EnrichmentType,
  type EnrichmentSource,
  type EnrichmentMetadata,
  type NormalizationRule,
  type RuleCondition,
  type NormalizationOptions,
  type EnrichmentOptions,
  type NormalizationResult
} from './prompt-normalizer'

// Alternative Solutions Engine (NEW) - Mechanisms #26-27
export {
  AlternativeSolutionsEngine,
  getAlternativeEngine,
  generateAlternatives,
  exploreBranches,
  createSolution,
  createTradeoff,
  createReasoningBranch,
  type Solution,
  type SolutionAlternative,
  type SolutionApproach,
  type SolutionVariation,
  type ComplexityLevel,
  type EffortEstimate,
  type RiskLevel,
  type Tradeoff,
  type SolutionRanking,
  type RankingDimension,
  type SolutionTier,
  type ReasoningBranch,
  type BranchStatus,
  type BranchEvidence,
  type BranchEvaluation,
  type BranchIssue,
  type ReasoningTree,
  type AlternativeGenerationConfig,
  type BranchExplorationConfig,
  type AlternativeGenerationResult,
  type AlternativeComparison,
  type TradeoffAnalysis,
  type TradeoffConflict,
  type TradeoffSynergy,
  type BranchExplorationResult,
  type ExplorationStatistics
} from './alternative-solutions'

// Multi-Language Parser (NEW) - Mechanism #221
export {
  MultiLanguageParser,
  getMultiLanguageParser,
  parseCode,
  detectLanguageFromExtension,
  detectLanguageFromContent,
  invalidateCache,
  clearCache,
  compareASTs,
  extractIdentifiers,
  findReferences,
  generateSymbolTable,
  validateSyntax,
  type ParseResult,
  type LanguageAST,
  type CodeElement,
  type ParseError,
  type LanguageType,
  type NormalizedASTNode,
  type NormalizedNodeType,
  type SourceLocation,
  type FunctionInfo,
  type ParameterInfo,
  type TypeInfo,
  type TypeParameterInfo,
  type ClassInfo,
  type PropertyInfo,
  type DecoratorInfo,
  type ImportInfo,
  type ImportSpecifier,
  type ExportInfo,
  type VariableInfo,
  type CodeElementType,
  type CommentInfo,
  type TokenInfo,
  type IncrementalParseContext,
  type ParserOptions
} from './multi-language-parser'

// Agent Execution Sandbox (NEW) - Mechanism #128
export {
  AgentSandbox,
  getAgentSandbox,
  createSandbox,
  getAllSandboxes,
  terminateSandbox,
  terminateAllSandboxes,
  getSandboxStatistics,
  type SandboxConfig,
  type SandboxLimits,
  type SandboxResult,
  type SecurityPolicy,
  type ExecutionResult,
  type StateSnapshot,
  type FilesystemSnapshot,
  type FileInfo,
  type ProcessSnapshot,
  type SandboxError,
  type SandboxWarning,
  type BehaviorEvent,
  type BehaviorEventType,
  type RollbackPoint,
  type ResourceUsage,
  type SandboxMetrics
} from './agent-sandbox'

// Code Quality Intelligence (NEW) - Mechanisms #287-290
export {
  CodeQualityIntelligence,
  getCodeQualityIntelligence,
  analyzeQuality,
  type QualityReport,
  type StyleIssue,
  type StyleIssueType,
  type QualitySuggestion,
  type LintRule,
  type LintRuleCategory,
  type LintRuleExample,
  type LintConfig,
  type LintRuleConfig,
  type FormattingResult,
  type FormattingChange,
  type FormattingChangeType,
  type FormattingOptions,
  type QualityTrend,
  type TrendDataPoint,
  type TrendMetrics,
  type TrendPrediction,
  type TrendInsight
} from './code-quality-intelligence'

// Documentation Intelligence (NEW) - Mechanisms #264-270
export {
  DocumentationIntelligence,
  getDocumentationIntelligence,
  generateDocumentation,
  type CodeElement,
  type ParameterInfo,
  type ExampleGeneration,
  type CoverageReport,
  type MismatchResult,
  type MismatchType,
  type ConsistencyCheckResult,
  type InlineExplanation,
  type ArchitectureDoc,
  type ArchitectureComponent,
  type DataFlowDiagram,
  type DataFlowNode,
  type DataFlowEdge,
  type DependencyGraph,
  type ArchitectureDecision,
  type Diagram,
  type READMESynthesis,
  type Badge,
  type TableOfContents,
  type TOCItem,
  type DocumentationResult,
  type DocumentationIntelligenceConfig
} from './documentation-intelligence'

// Package Registry Scanner (NEW) - Mechanism #432
export {
  PackageRegistryScanner,
  getPackageRegistryScanner,
  scanPackage,
  checkPackageAvailability,
  getSecurityAdvisoriesForPackage,
  analyzePackagePopularity,
  getPackageVersions,
  type RegistryInfo,
  type PackageMetadata,
  type DownloadStats,
  type PackageQuality,
  type PackageLinks,
  type VersionInfo,
  type SecurityAdvisory,
  type SecurityPatch,
  type PopularityAnalysis,
  type ScanOptions,
  type ScanResult,
  type PackageRecommendation,
  type RegistryScanRequest,
  type RegistryScanResult
} from './package-registry-scanner'

// Message Deduplication (NEW) - Mechanism #148
export {
  MessageDeduplicator,
  getMessageDeduplicator,
  isDuplicate,
  deduplicate,
  deduplicateBatch,
  getDeduplicationStats,
  type AgentMessage,
  type MessageType,
  type DeduplicationConfig,
  type DuplicateMessage,
  type DeduplicationResult,
  type MessageStats,
  type MessageCache
} from './message-deduplication'

// Context Deduplication (NEW) - Mechanism #36
export {
  ContextDeduplicator,
  getContextDeduplicator,
  deduplicateContext,
  dedupContext,
  getContextDeduplicationStats,
  createContextItem,
  type ContextItem,
  type ContextType,
  type ContextDeduplicationConfig,
  type DeduplicationReport,
  type RemovedItem,
  type DeduplicationReason,
  type DeduplicationStats
} from './context-deduplication'

// Code Fingerprint Generator (NEW) - Mechanism #240
export {
  CodeFingerprintGenerator,
  getCodeFingerprintGenerator,
  generateFingerprint,
  compareCode,
  isDuplicateCode,
  getFingerprintStats,
  type CodeFingerprint,
  type FingerprintType,
  type FingerprintMetrics,
  type CodeFeatures,
  type FingerprintConfig,
  type FingerprintMatch,
  type FingerprintStats
} from './code-fingerprint'

// Dependency Abandonment Detection (NEW) - Mechanism #454
export {
  DependencyAbandonmentDetector,
  getDependencyAbandonmentDetector,
  isPackageAbandoned,
  analyzePackage,
  getPackageRiskScore,
  generateAbandonmentReport,
  getAbandonmentStats,
  type PackageInfo,
  type DownloadStats,
  type AbandonmentAnalysis,
  type RiskLevel,
  type AbandonmentSignal,
  type SignalType,
  type Recommendation,
  type AlternativePackage,
  type AnalysisDetails,
  type AbandonmentConfig,
  type AbandonmentStats
} from './dependency-abandonment'

// Architecture Pattern Detector (NEW) - Mechanisms #361-370
export {
  ArchitecturePatternDetector,
  getArchitecturePatternDetector,
  detectArchitecturePattern,
  getPatternDetectionStats,
  addArchitecturePattern,
  type ArchitecturePattern,
  type PatternType,
  type ComponentInfo,
  type ComponentType,
  type ConnectionInfo,
  type ConnectionType,
  type PatternIndicator,
  type IndicatorType,
  type PatternMetadata,
  type DetectionConfig,
  type PatternRule,
  type IndicatorRule,
  type DetectionResult,
  type PatternRecommendation,
  type DetectionStats
} from './architecture-patterns'

// Dead-End Detection (NEW) - Mechanism #89
export {
  DeadEndDetector,
  getDeadEndDetector,
  startReasoningPath,
  addReasoningStep,
  isDeadEnd,
  detectDeadEnd,
  getDeadEndDetectionStats,
  type ReasoningPath,
  type PathStatus,
  type ReasoningStep,
  type DeadEnd,
  type DeadEndType,
  type RecoveryOption,
  type RecoveryType,
  type DetectionConfig,
  type DetectionResult,
  type DetectionStats
} from './dead-end-detection'

// Self-Verification System (NEW) - Mechanism #84
export {
  SelfVerificationSystem,
  getSelfVerificationSystem,
  type VerificationContext,
  type VerificationType,
  type VerificationStatus,
  type VerificationConstraint,
  type ConstraintType,
  type VerificationAttempt,
  type VerificationIssue,
  type VerificationResult,
  type VerificationStats
} from './self-verification'

// Recovery Strategy Generator (NEW) - Mechanism #210
export {
  RecoveryStrategyGenerator,
  getRecoveryStrategyGenerator,
  generateRecoveryStrategy,
  generateRecoveryOptions,
  executeRecoveryStrategy,
  createRecoveryContext,
  getRecoveryStats,
  type RecoveryContext,
  type ErrorInfo,
  type ErrorType,
  type SystemState,
  type ResourceStatus,
  type ActionHistoryItem,
  type RecoveryStrategy,
  type StrategyType,
  type RecoveryStep,
  type RecoveryConstraint,
  type RecoveryResult,
  type RecoveryStats
} from './recovery-strategies'

// Knowledge Fusion Engine (NEW) - Mechanism #38
export {
  KnowledgeFusionEngine,
  getKnowledgeFusionEngine,
  fuseKnowledge,
  type KnowledgeSource,
  type KnowledgeItem,
  type KnowledgeType,
  type KnowledgeRelationship,
  type FusionConflict,
  type ConflictResolution,
  type FusionResult,
  type FusionStatistics,
  type KnowledgeGraph,
  type KnowledgeNode,
  type KnowledgeEdge,
  type FusionConfig
} from './knowledge-fusion-engine'

// Source Attribution Generator (NEW) - Mechanism #57
export {
  SourceAttributionGenerator,
  getSourceAttributionGenerator,
  generateAttributions,
  createSource,
  type Source,
  type SourceType,
  type Attribution,
  type ContributionType,
  type SourceLocation,
  type AttributionResult,
  type Citation,
  type CitationFormat,
  type ProvenanceNode,
  type AttributionConfig
} from './source-attribution-generator'

// Memory Retrieval Prioritizer (NEW) - Mechanism #39
export {
  MemoryRetrievalPrioritizer,
  getMemoryPrioritizer,
  prioritizeMemoryRetrieval,
  createMemory,
  type MemoryItem,
  type MemoryType,
  type RetrievalContext,
  type PrioritizedMemory,
  type RetrievalResult,
  type RetrievalStrategy,
  type MemoryStatistics,
  type DecayConfig
} from './memory-retrieval-prioritizer'

// Context Expansion Trigger (NEW) - Mechanism #40
export {
  ContextExpansionTriggerEngine,
  getContextExpansionTrigger,
  checkContextExpansion,
  type ExpansionTrigger,
  type TriggerType,
  type ContextSource,
  type SourceType,
  type ExpansionResult,
  type ContextChunk,
  type ExpansionStrategy,
  type TriggerConfig,
  type TriggerThresholds
} from './context-expansion-trigger'

// Verification Prompt Generator (NEW) - Mechanism #58
export {
  VerificationPromptGenerator,
  getVerificationPromptGenerator,
  generateVerificationPrompts,
  verifyOutput,
  type VerificationPrompt,
  type VerificationType,
  type VerificationCategory,
  type VerificationResult,
  type VerificationIssue,
  type PromptGenerationConfig
} from './verification-prompt-generator'

// Error Probability Estimator (NEW) - Mechanism #59
export {
  ErrorProbabilityEstimator,
  getErrorProbabilityEstimator,
  estimateErrorProbability,
  type ErrorProbability,
  type ErrorType,
  type RiskFactor,
  type ErrorEstimationResult,
  type HistoricalContext,
  type ErrorPattern,
  type EstimationConfig
} from './error-probability-estimator'

// Result Acceptance Scorer (NEW) - Mechanism #60
export {
  ResultAcceptanceScorer,
  getResultAcceptanceScorer,
  scoreAcceptance,
  type AcceptanceScore,
  type DimensionScore,
  type ScoringDimension,
  type AcceptanceIssue,
  type ScoringThresholds,
  type ScoringConfig
} from './result-acceptance-scorer'

// Reasoning Trace Visualizer (NEW) - Mechanism #116
export {
  ReasoningTraceVisualizer,
  getReasoningTraceVisualizer,
  visualizeTrace,
  type ReasoningTrace,
  type ReasoningStep,
  type StepType,
  type ReasoningBranch,
  type ReasoningDecision,
  type DecisionOption,
  type ReasoningOutcome,
  type VisualizationOptions
} from './reasoning-trace-visualizer'

// Supply Chain Verifier (NEW) - Mechanism #498
export {
  SupplyChainVerifier,
  getSupplyChainVerifier,
  verifySupplyChain,
  type SupplyChainVerification,
  type PackageVerification,
  type IntegrityCheck,
  type TrustAssessment,
  type TrustFactor,
  type TrustFlag,
  type VulnerabilityInfo,
  type VerificationSummary,
  type SBOM,
  type SBOMComponent,
  type SBOMDependency,
  type VerificationConfig
} from './supply-chain-verifier'

// Code Insight Dashboard (NEW) - Mechanism #327
export {
  CodeInsightDashboard,
  getCodeInsightDashboard,
  generateDashboard,
  type DashboardInsight,
  type InsightCategory,
  type DashboardData,
  type CodeMetrics,
  type ChartData,
  type ChartPoint,
  type DashboardAlert,
  type DashboardConfig
} from './code-insight-dashboard'

// Architecture Visualizer (NEW) - Mechanism #407
export {
  ArchitectureVisualizer,
  getArchitectureVisualizer,
  visualizeArchitecture,
  type ArchitectureVisualization,
  type VisualizationType,
  type VisualNode,
  type NodeType,
  type VisualEdge,
  type EdgeType,
  type EdgeStyle,
  type VisualGroup,
  type LayoutOptions,
  type VisualizationOptions
} from './architecture-visualizer'

/**
 * Initialize all autonomous subsystems
 */
export async function initializeAutonomous(): Promise<{
  indexing: boolean
  healthChecks: boolean
  docker: boolean
  git: boolean
}> {
  const result = {
    indexing: false,
    healthChecks: false,
    docker: false,
    git: false
  }
  
  try {
    // Start background indexing
    const { startIndexing } = await import('./indexer')
    startIndexing(undefined, 30000)
    result.indexing = true
  } catch (error) {
    console.error('[Autonomous] Failed to start indexing:', error)
  }
  
  try {
    // Start server health checks
    const { startHealthChecks } = await import('./server-monitor')
    startHealthChecks(30000)
    result.healthChecks = true
  } catch (error) {
    console.error('[Autonomous] Failed to start health checks:', error)
  }
  
  try {
    // Check Docker availability
    const { isDockerAvailable } = await import('./docker-manager')
    result.docker = await isDockerAvailable()
  } catch (error) {
    console.error('[Autonomous] Docker check failed:', error)
  }
  
  try {
    // Check Git availability
    const { isGitAvailable } = await import('./git-manager')
    result.git = await isGitAvailable()
  } catch (error) {
    console.error('[Autonomous] Git check failed:', error)
  }
  
  console.log('[Autonomous] Subsystems initialized:', result)
  
  return result
}

/**
 * Shutdown all autonomous subsystems
 */
export async function shutdownAutonomous(): Promise<void> {
  try {
    const { stopIndexing } = await import('./indexer')
    stopIndexing()
  } catch {}
  
  try {
    const { stopHealthChecks, stopAllServers } = await import('./server-monitor')
    stopHealthChecks()
    await stopAllServers()
  } catch {}
  
  console.log('[Autonomous] Subsystems shut down')
}

/**
 * Get system status
 */
export async function getSystemStatus(): Promise<{
  subsystems: Record<string, boolean>
  resources: {
    diskSpace: number
    memoryUsage: number
  }
  stats: {
    totalProjects: number
    totalCheckpoints: number
    activeServers: number
    activeContainers: number
  }
}> {
  const subsystems: Record<string, boolean> = {}
  
  // Check each subsystem
  try {
    const { isDockerAvailable } = await import('./docker-manager')
    subsystems.docker = await isDockerAvailable()
  } catch { subsystems.docker = false }
  
  try {
    const { isGitAvailable } = await import('./git-manager')
    subsystems.git = await isGitAvailable()
  } catch { subsystems.git = false }
  
  subsystems.indexing = true // Always available
  subsystems.healthChecks = true
  
  // Get stats
  let totalProjects = 0
  let totalCheckpoints = 0
  let activeServers = 0
  let activeContainers = 0
  
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    const workspace = path.join(process.cwd(), 'workspace')
    const entries = await fs.readdir(workspace, { withFileTypes: true })
    totalProjects = entries.filter(e => e.isDirectory()).length
  } catch {}
  
  try {
    const { getAllServers } = await import('./server-monitor')
    activeServers = getAllServers().length
  } catch {}
  
  try {
    const { listContainers } = await import('./docker-manager')
    const containers = await listContainers()
    activeContainers = containers.filter(c => c.status === 'running').length
  } catch {}
  
  return {
    subsystems,
    resources: {
      diskSpace: 0, // Would need actual implementation
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024
    },
    stats: {
      totalProjects,
      totalCheckpoints,
      activeServers,
      activeContainers
    }
  }
}
