/**
 * Coupling Analyzer
 * Mechanisms 344: Analyze code coupling and cohesion metrics
 */

export interface CouplingAnalysis {
  id: string;
  timestamp: Date;
  scope: AnalysisScope;
  modules: ModuleCouplingInfo[];
  dependencies: DependencyEdge[];
  metrics: CouplingMetrics;
  issues: CouplingIssue[];
  recommendations: CouplingRecommendation[];
  visualization: CouplingGraph;
}

export interface AnalysisScope {
  type: 'file' | 'module' | 'package' | 'project';
  paths: string[];
  excludePatterns: string[];
}

export interface ModuleCouplingInfo {
  id: string;
  name: string;
  path: string;
  type: 'module' | 'class' | 'function' | 'file';
  afferentCoupling: number;  // Incoming dependencies
  efferentCoupling: number;  // Outgoing dependencies
  instability: number;       // efferent / (afferent + efferent)
  abstractness: number;      // Abstract elements / Total elements
  distanceFromMain: number;  // Distance from ideal line
  cohesion: number;          // Internal cohesion score
  responsibilities: string[];
}

export interface DependencyEdge {
  source: string;
  target: string;
  type: DependencyType;
  strength: number;
  reason: string;
}

export type DependencyType =
  | 'import'
  | 'inheritance'
  | 'composition'
  | 'aggregation'
  | 'association'
  | 'dependency'
  | 'interface_implementation';

export interface CouplingMetrics {
  totalCoupling: number;
  averageCoupling: number;
  maxCoupling: number;
  tightlyCoupled: number;
  looselyCoupled: number;
  averageCohesion: number;
  martinMetrics: MartinMetrics;
}

export interface MartinMetrics {
  mainSequenceDistance: number;
  abstractness: number;
  instability: number;
  packageCount: number;
  abstractCount: number;
}

export interface CouplingIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: CouplingIssueType;
  module: string;
  description: string;
  impact: string;
  suggestion: string;
}

export type CouplingIssueType =
  | 'high_coupling'
  | 'low_cohesion'
  | 'circular_dependency'
  | 'god_object'
  | 'feature_envy'
  | 'inappropriate_intimacy'
  | 'middle_man'
  | 'divergent_change';

export interface CouplingRecommendation {
  priority: 'high' | 'medium' | 'low';
  type: 'refactor' | 'extract' | 'move' | 'introduce_interface' | 'break_dependency';
  modules: string[];
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
}

export interface CouplingGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: GraphCluster[];
  layout: 'hierarchical' | 'force-directed' | 'circular';
}

export interface GraphNode {
  id: string;
  label: string;
  size: number;
  color: string;
  group: string;
  metrics: Record<string, number>;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  type: DependencyType;
}

export interface GraphCluster {
  id: string;
  label: string;
  nodes: string[];
  color: string;
}

export class CouplingAnalyzer {
  private moduleRegistry: Map<string, ModuleCouplingInfo>;
  private dependencyGraph: Map<string, Set<string>>;
  private thresholds: CouplingThresholds;

  constructor() {
    this.moduleRegistry = new Map();
    this.dependencyGraph = new Map();
    this.thresholds = {
      highCoupling: 10,
      lowCohesion: 0.3,
      circularDependencyPenalty: 5,
      godObjectThreshold: 15,
    };
  }

  /**
   * Analyze coupling for given scope
   */
  async analyze(scope: AnalysisScope): Promise<CouplingAnalysis> {
    // Step 1: Parse and register modules
    await this.parseModules(scope);
    
    // Step 2: Build dependency graph
    this.buildDependencyGraph();
    
    // Step 3: Calculate coupling metrics
    const modules = this.calculateModuleMetrics();
    
    // Step 4: Detect issues
    const issues = this.detectIssues(modules);
    
    // Step 5: Generate recommendations
    const recommendations = this.generateRecommendations(modules, issues);
    
    // Step 6: Calculate overall metrics
    const metrics = this.calculateOverallMetrics(modules);
    
    // Step 7: Build visualization
    const visualization = this.buildVisualization(modules);

    return {
      id: this.generateId(),
      timestamp: new Date(),
      scope,
      modules,
      dependencies: this.getDependencyEdges(),
      metrics,
      issues,
      recommendations,
      visualization,
    };
  }

  /**
   * Get coupling between two specific modules
   */
  getCouplingBetween(module1: string, module2: string): ModulePairCoupling {
    const info1 = this.moduleRegistry.get(module1);
    const info2 = this.moduleRegistry.get(module2);

    if (!info1 || !info2) {
      throw new Error('Module not found');
    }

    const directCoupling = this.calculateDirectCoupling(module1, module2);
    const indirectCoupling = this.calculateIndirectCoupling(module1, module2);
    const sharedDependencies = this.findSharedDependencies(module1, module2);

    return {
      module1,
      module2,
      directCoupling,
      indirectCoupling,
      sharedDependencies,
      couplingScore: directCoupling + indirectCoupling * 0.5,
      recommendations: this.generatePairRecommendations(module1, module2),
    };
  }

  /**
   * Find circular dependencies
   */
  findCircularDependencies(): CircularDependency[] {
    const cycles: CircularDependency[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    for (const [module] of this.dependencyGraph) {
      this.detectCycles(module, visited, recursionStack, path, cycles);
    }

    return cycles;
  }

  /**
   * Calculate impact of changes
   */
  calculateChangeImpact(moduleId: string): ChangeImpact {
    const directDependents = this.getDirectDependents(moduleId);
    const indirectDependents = this.getIndirectDependents(moduleId);
    const affectedModules = [...new Set([...directDependents, ...indirectDependents])];

    return {
      sourceModule: moduleId,
      directDependents,
      indirectDependents,
      totalAffected: affectedModules.length,
      riskLevel: this.calculateRiskLevel(affectedModules.length),
      suggestedTests: this.suggestTestCoverage(moduleId, affectedModules),
    };
  }

  private async parseModules(scope: AnalysisScope): Promise<void> {
    // In production, this would parse actual files
    // For now, we'll work with the registry
  }

  private buildDependencyGraph(): void {
    for (const [moduleId, info] of this.moduleRegistry) {
      if (!this.dependencyGraph.has(moduleId)) {
        this.dependencyGraph.set(moduleId, new Set());
      }
    }
  }

  private calculateModuleMetrics(): ModuleCouplingInfo[] {
    const modules: ModuleCouplingInfo[] = [];

    for (const [id, info] of this.moduleRegistry) {
      // Calculate afferent coupling (incoming)
      const afferent = this.countAfferentCoupling(id);

      // Calculate efferent coupling (outgoing)
      const efferent = this.dependencyGraph.get(id)?.size || 0;

      // Calculate instability
      const total = afferent + efferent;
      const instability = total > 0 ? efferent / total : 0;

      // Calculate distance from main sequence
      const distance = Math.abs(info.abstractness + instability - 1);

      // Calculate cohesion (LCOM approximation)
      const cohesion = this.calculateCohesion(id);

      modules.push({
        ...info,
        afferentCoupling: afferent,
        efferentCoupling: efferent,
        instability,
        distanceFromMain: distance,
        cohesion,
      });
    }

    return modules;
  }

  private countAfferentCoupling(moduleId: string): number {
    let count = 0;
    for (const [, deps] of this.dependencyGraph) {
      if (deps.has(moduleId)) {
        count++;
      }
    }
    return count;
  }

  private calculateCohesion(moduleId: string): number {
    // Simplified LCOM calculation
    const info = this.moduleRegistry.get(moduleId);
    if (!info) return 1;

    // More responsibilities = lower cohesion
    const responsibilityCount = info.responsibilities.length;
    if (responsibilityCount <= 1) return 1;
    if (responsibilityCount >= 10) return 0.1;

    return 1 - (responsibilityCount - 1) / 9;
  }

  private detectIssues(modules: ModuleCouplingInfo[]): CouplingIssue[] {
    const issues: CouplingIssue[] = [];

    for (const mod of modules) {
      // High coupling
      const totalCoupling = mod.afferentCoupling + mod.efferentCoupling;
      if (totalCoupling > this.thresholds.highCoupling) {
        issues.push({
          severity: totalCoupling > 20 ? 'critical' : 'high',
          type: 'high_coupling',
          module: mod.name,
          description: `Module has high coupling (${totalCoupling} connections)`,
          impact: 'Changes to this module will have widespread impact',
          suggestion: 'Consider extracting responsibilities or introducing interfaces',
        });
      }

      // Low cohesion
      if (mod.cohesion < this.thresholds.lowCohesion) {
        issues.push({
          severity: 'medium',
          type: 'low_cohesion',
          module: mod.name,
          description: `Module has low cohesion (${(mod.cohesion * 100).toFixed(0)}%)`,
          impact: 'Module does too many unrelated things',
          suggestion: 'Split into smaller, focused modules',
        });
      }

      // God object
      if (totalCoupling > this.thresholds.godObjectThreshold) {
        issues.push({
          severity: 'critical',
          type: 'god_object',
          module: mod.name,
          description: 'Module appears to be a God Object',
          impact: 'Violates single responsibility principle',
          suggestion: 'Break down into smaller, specialized modules',
        });
      }

      // Instability issues
      if (mod.instability > 0.8 && mod.abstractness < 0.3) {
        issues.push({
          severity: 'medium',
          type: 'divergent_change',
          module: mod.name,
          description: 'Unstable concrete module',
          impact: 'Hard to maintain and test',
          suggestion: 'Extract interfaces or abstract classes',
        });
      }
    }

    // Circular dependencies
    const cycles = this.findCircularDependencies();
    for (const cycle of cycles) {
      issues.push({
        severity: 'high',
        type: 'circular_dependency',
        module: cycle.modules.join(' -> '),
        description: `Circular dependency detected: ${cycle.modules.join(' -> ')}`,
        impact: 'Creates tight coupling and makes testing difficult',
        suggestion: 'Introduce interface or mediator to break cycle',
      });
    }

    return issues;
  }

  private generateRecommendations(
    modules: ModuleCouplingInfo[],
    issues: CouplingIssue[]
  ): CouplingRecommendation[] {
    const recommendations: CouplingRecommendation[] = [];

    for (const issue of issues) {
      switch (issue.type) {
        case 'high_coupling':
          recommendations.push({
            priority: issue.severity === 'critical' ? 'high' : 'medium',
            type: 'introduce_interface',
            modules: [issue.module],
            description: `Introduce interface for ${issue.module} to reduce coupling`,
            impact: 'Reduces direct dependencies',
            effort: 'medium',
          });
          break;

        case 'low_cohesion':
          recommendations.push({
            priority: 'medium',
            type: 'extract',
            modules: [issue.module],
            description: `Extract responsibilities from ${issue.module}`,
            impact: 'Improves maintainability and testability',
            effort: 'high',
          });
          break;

        case 'circular_dependency':
          recommendations.push({
            priority: 'high',
            type: 'break_dependency',
            modules: issue.module.split(' -> '),
            description: 'Introduce mediator or interface to break circular dependency',
            impact: 'Eliminates tight coupling cycle',
            effort: 'medium',
          });
          break;

        case 'god_object':
          recommendations.push({
            priority: 'high',
            type: 'extract',
            modules: [issue.module],
            description: `Decompose ${issue.module} into smaller modules`,
            impact: 'Improves architecture significantly',
            effort: 'high',
          });
          break;
      }
    }

    return this.deduplicateRecommendations(recommendations);
  }

  private calculateOverallMetrics(modules: ModuleCouplingInfo[]): CouplingMetrics {
    if (modules.length === 0) {
      return this.getEmptyMetrics();
    }

    const totalCoupling = modules.reduce(
      (sum, m) => sum + m.afferentCoupling + m.efferentCoupling,
      0
    );
    const avgCoupling = totalCoupling / modules.length;
    const maxCoupling = Math.max(
      ...modules.map(m => m.afferentCoupling + m.efferentCoupling)
    );
    const avgCohesion = modules.reduce((sum, m) => sum + m.cohesion, 0) / modules.length;

    const tightlyCoupled = modules.filter(
      m => m.afferentCoupling + m.efferentCoupling > this.thresholds.highCoupling
    ).length;

    const martinMetrics: MartinMetrics = {
      mainSequenceDistance: modules.reduce((sum, m) => sum + m.distanceFromMain, 0) / modules.length,
      abstractness: modules.reduce((sum, m) => sum + m.abstractness, 0) / modules.length,
      instability: modules.reduce((sum, m) => sum + m.instability, 0) / modules.length,
      packageCount: modules.length,
      abstractCount: modules.filter(m => m.abstractness > 0.5).length,
    };

    return {
      totalCoupling,
      averageCoupling: avgCoupling,
      maxCoupling,
      tightlyCoupled,
      looselyCoupled: modules.length - tightlyCoupled,
      averageCohesion: avgCohesion,
      martinMetrics,
    };
  }

  private buildVisualization(modules: ModuleCouplingInfo[]): CouplingGraph {
    const nodes: GraphNode[] = modules.map(m => ({
      id: m.id,
      label: m.name,
      size: m.afferentCoupling + m.efferentCoupling + 1,
      color: this.getNodeColor(m),
      group: m.path.split('/')[0] || 'root',
      metrics: {
        coupling: m.afferentCoupling + m.efferentCoupling,
        cohesion: m.cohesion,
        instability: m.instability,
      },
    }));

    const edges: GraphEdge[] = this.getDependencyEdges().map(d => ({
      source: d.source,
      target: d.target,
      weight: d.strength,
      type: d.type,
    }));

    const clusters = this.detectClusters(modules);

    return {
      nodes,
      edges,
      clusters,
      layout: 'force-directed',
    };
  }

  private getNodeColor(mod: ModuleCouplingInfo): string {
    const coupling = mod.afferentCoupling + mod.efferentCoupling;
    if (coupling > 15) return '#ef4444'; // red
    if (coupling > 10) return '#f97316'; // orange
    if (coupling > 5) return '#eab308';  // yellow
    return '#22c55e'; // green
  }

  private detectClusters(modules: ModuleCouplingInfo[]): GraphCluster[] {
    const clusterMap = new Map<string, string[]>();

    for (const mod of modules) {
      const group = mod.path.split('/')[0] || 'root';
      if (!clusterMap.has(group)) {
        clusterMap.set(group, []);
      }
      clusterMap.get(group)!.push(mod.id);
    }

    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'];
    let colorIndex = 0;

    return Array.from(clusterMap.entries()).map(([label, nodes]) => ({
      id: label,
      label,
      nodes,
      color: colors[colorIndex++ % colors.length],
    }));
  }

  private getDependencyEdges(): DependencyEdge[] {
    const edges: DependencyEdge[] = [];

    for (const [source, targets] of this.dependencyGraph) {
      for (const target of targets) {
        edges.push({
          source,
          target,
          type: 'import',
          strength: 1,
          reason: 'Import dependency',
        });
      }
    }

    return edges;
  }

  private calculateDirectCoupling(module1: string, module2: string): number {
    const deps1 = this.dependencyGraph.get(module1);
    const deps2 = this.dependencyGraph.get(module2);

    let coupling = 0;
    if (deps1?.has(module2)) coupling++;
    if (deps2?.has(module1)) coupling++;

    return coupling;
  }

  private calculateIndirectCoupling(module1: string, module2: string): number {
    // Count shared dependencies
    const deps1 = this.dependencyGraph.get(module1) || new Set();
    const deps2 = this.dependencyGraph.get(module2) || new Set();

    let shared = 0;
    for (const dep of deps1) {
      if (deps2.has(dep)) shared++;
    }

    return shared;
  }

  private findSharedDependencies(module1: string, module2: string): string[] {
    const deps1 = this.dependencyGraph.get(module1) || new Set();
    const deps2 = this.dependencyGraph.get(module2) || new Set();

    const shared: string[] = [];
    for (const dep of deps1) {
      if (deps2.has(dep)) {
        shared.push(dep);
      }
    }

    return shared;
  }

  private generatePairRecommendations(module1: string, module2: string): string[] {
    const recommendations: string[] = [];
    const coupling = this.calculateDirectCoupling(module1, module2);

    if (coupling > 1) {
      recommendations.push('Consider introducing an interface to decouple these modules');
    }

    const shared = this.findSharedDependencies(module1, module2);
    if (shared.length > 2) {
      recommendations.push('Extract shared dependencies into a common module');
    }

    return recommendations;
  }

  private detectCycles(
    module: string,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[],
    cycles: CircularDependency[]
  ): void {
    visited.add(module);
    recursionStack.add(module);
    path.push(module);

    const dependencies = this.dependencyGraph.get(module) || new Set();
    for (const dep of dependencies) {
      if (!visited.has(dep)) {
        this.detectCycles(dep, visited, recursionStack, path, cycles);
      } else if (recursionStack.has(dep)) {
        // Found cycle
        const cycleStart = path.indexOf(dep);
        if (cycleStart !== -1) {
          cycles.push({
            modules: [...path.slice(cycleStart), dep],
            severity: path.length - cycleStart > 3 ? 'high' : 'medium',
          });
        }
      }
    }

    path.pop();
    recursionStack.delete(module);
  }

  private getDirectDependents(moduleId: string): string[] {
    const dependents: string[] = [];
    for (const [source, deps] of this.dependencyGraph) {
      if (deps.has(moduleId)) {
        dependents.push(source);
      }
    }
    return dependents;
  }

  private getIndirectDependents(moduleId: string): string[] {
    const direct = this.getDirectDependents(moduleId);
    const indirect = new Set<string>();

    for (const dep of direct) {
      const subDeps = this.getDirectDependents(dep);
      for (const subDep of subDeps) {
        if (!direct.includes(subDep) && subDep !== moduleId) {
          indirect.add(subDep);
        }
      }
    }

    return Array.from(indirect);
  }

  private calculateRiskLevel(affectedCount: number): 'low' | 'medium' | 'high' {
    if (affectedCount > 10) return 'high';
    if (affectedCount > 5) return 'medium';
    return 'low';
  }

  private suggestTestCoverage(moduleId: string, affectedModules: string[]): string[] {
    return [moduleId, ...affectedModules.slice(0, 3)];
  }

  private deduplicateRecommendations(
    recommendations: CouplingRecommendation[]
  ): CouplingRecommendation[] {
    const seen = new Set<string>();
    return recommendations.filter(r => {
      const key = `${r.type}:${r.modules.join(',')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private getEmptyMetrics(): CouplingMetrics {
    return {
      totalCoupling: 0,
      averageCoupling: 0,
      maxCoupling: 0,
      tightlyCoupled: 0,
      looselyCoupled: 0,
      averageCohesion: 0,
      martinMetrics: {
        mainSequenceDistance: 0,
        abstractness: 0,
        instability: 0,
        packageCount: 0,
        abstractCount: 0,
      },
    };
  }

  private generateId(): string {
    return `coupling_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Register a module for analysis
   */
  registerModule(info: Omit<ModuleCouplingInfo, 'afferentCoupling' | 'efferentCoupling' | 'instability' | 'distanceFromMain' | 'cohesion'>): void {
    this.moduleRegistry.set(info.id, {
      ...info,
      afferentCoupling: 0,
      efferentCoupling: 0,
      instability: 0,
      distanceFromMain: 0,
      cohesion: 1,
    });
  }

  /**
   * Add a dependency
   */
  addDependency(source: string, target: string): void {
    if (!this.dependencyGraph.has(source)) {
      this.dependencyGraph.set(source, new Set());
    }
    this.dependencyGraph.get(source)!.add(target);
  }
}

// Supporting interfaces
interface CouplingThresholds {
  highCoupling: number;
  lowCohesion: number;
  circularDependencyPenalty: number;
  godObjectThreshold: number;
}

interface ModulePairCoupling {
  module1: string;
  module2: string;
  directCoupling: number;
  indirectCoupling: number;
  sharedDependencies: string[];
  couplingScore: number;
  recommendations: string[];
}

interface CircularDependency {
  modules: string[];
  severity: 'low' | 'medium' | 'high';
}

interface ChangeImpact {
  sourceModule: string;
  directDependents: string[];
  indirectDependents: string[];
  totalAffected: number;
  riskLevel: 'low' | 'medium' | 'high';
  suggestedTests: string[];
}

// Singleton instance
let analyzerInstance: CouplingAnalyzer | null = null;

export function getCouplingAnalyzer(): CouplingAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new CouplingAnalyzer();
  }
  return analyzerInstance;
}
