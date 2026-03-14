/**
 * Domain Knowledge System
 * Mechanisms 91-100: Domain-specific knowledge integration and reasoning
 */

export interface DomainKnowledge {
  id: string;
  domain: string;
  concepts: DomainConcept[];
  relationships: ConceptRelationship[];
  rules: DomainRule[];
  patterns: DomainPattern[];
  vocabulary: DomainVocabulary;
  metadata: KnowledgeMetadata;
}

export interface DomainConcept {
  id: string;
  name: string;
  description: string;
  type: ConceptType;
  attributes: ConceptAttribute[];
  examples: string[];
  aliases: string[];
}

export type ConceptType =
  | 'entity'
  | 'process'
  | 'artifact'
  | 'principle'
  | 'pattern'
  | 'tool'
  | 'metric'
  | 'constraint';

export interface ConceptAttribute {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: unknown;
}

export interface ConceptRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationType;
  strength: number;
  bidirectional: boolean;
  description: string;
}

export type RelationType =
  | 'is_a'
  | 'has_a'
  | 'uses'
  | 'implements'
  | 'depends_on'
  | 'conflicts_with'
  | 'enhances'
  | 'replaces'
  | 'precedes'
  | 'follows';

export interface DomainRule {
  id: string;
  name: string;
  condition: RuleCondition;
  consequence: RuleConsequence;
  priority: number;
  exceptions: string[];
}

export interface RuleCondition {
  type: 'and' | 'or' | 'not' | 'comparison';
  operands: (RuleCondition | string)[];
  operator?: 'equals' | 'contains' | 'matches' | 'greater_than' | 'less_than';
  value?: unknown;
}

export interface RuleConsequence {
  action: 'allow' | 'forbid' | 'suggest' | 'warn' | 'require';
  message: string;
  relatedConcepts: string[];
}

export interface DomainPattern {
  id: string;
  name: string;
  description: string;
  context: string;
  problem: string;
  solution: string;
  consequences: string[];
  applicability: string[];
  relatedPatterns: string[];
}

export interface DomainVocabulary {
  terms: Map<string, TermDefinition>;
  synonyms: Map<string, string[]>;
  abbreviations: Map<string, string>;
}

export interface TermDefinition {
  term: string;
  definition: string;
  category: string;
  relatedTerms: string[];
  examples: string[];
}

export interface KnowledgeMetadata {
  version: string;
  source: string;
  lastUpdated: Date;
  confidence: number;
  coverage: number;
}

export interface KnowledgeQuery {
  domain: string;
  query: string;
  context?: QueryContext;
  depth?: number;
}

export interface QueryContext {
  focus?: string[];
  exclude?: string[];
  includeRelationships?: boolean;
  includeExamples?: boolean;
}

export interface KnowledgeResult {
  query: string;
  matches: KnowledgeMatch[];
  inferences: KnowledgeInference[];
  suggestions: string[];
  confidence: number;
}

export interface KnowledgeMatch {
  concept: DomainConcept;
  relevance: number;
  matchedAttributes: string[];
  context: string;
}

export interface KnowledgeInference {
  conclusion: string;
  basis: string[];
  confidence: number;
  reasoning: string;
}

export class DomainKnowledgeSystem {
  private domains: Map<string, DomainKnowledge>;
  private conceptIndex: Map<string, DomainConcept>;
  private ruleEngine: RuleEngine;
  private inferenceEngine: InferenceEngine;

  constructor() {
    this.domains = new Map();
    this.conceptIndex = new Map();
    this.ruleEngine = new RuleEngine();
    this.inferenceEngine = new InferenceEngine();
    this.initializeDefaultDomains();
  }

  /**
   * Load domain knowledge
   */
  loadDomain(knowledge: Omit<DomainKnowledge, 'id'>): string {
    const id = this.generateId();
    const domain: DomainKnowledge = { ...knowledge, id };

    this.domains.set(domain.domain, domain);

    // Index concepts
    for (const concept of domain.concepts) {
      this.conceptIndex.set(concept.id, concept);
    }

    // Register rules
    for (const rule of domain.rules) {
      this.ruleEngine.registerRule(rule);
    }

    return id;
  }

  /**
   * Query domain knowledge
   */
  query(query: KnowledgeQuery): KnowledgeResult {
    const domain = this.domains.get(query.domain);
    if (!domain) {
      return {
        query: query.query,
        matches: [],
        inferences: [],
        suggestions: [`Domain '${query.domain}' not found`],
        confidence: 0,
      };
    }

    // Find matching concepts
    const matches = this.findMatches(query, domain);

    // Generate inferences
    const inferences = this.inferenceEngine.infer(matches, domain, query.depth || 3);

    // Generate suggestions
    const suggestions = this.generateSuggestions(matches, domain);

    return {
      query: query.query,
      matches,
      inferences,
      suggestions,
      confidence: this.calculateConfidence(matches),
    };
  }

  /**
   * Get concept by name
   */
  getConcept(domain: string, conceptName: string): DomainConcept | undefined {
    const domainKnowledge = this.domains.get(domain);
    if (!domainKnowledge) return undefined;

    return domainKnowledge.concepts.find(
      c => c.name.toLowerCase() === conceptName.toLowerCase() ||
        c.aliases.some(a => a.toLowerCase() === conceptName.toLowerCase())
    );
  }

  /**
   * Get related concepts
   */
  getRelatedConcepts(
    domain: string,
    conceptId: string,
    relationTypes?: RelationType[]
  ): Array<{ concept: DomainConcept; relationship: ConceptRelationship }> {
    const domainKnowledge = this.domains.get(domain);
    if (!domainKnowledge) return [];

    const related: Array<{ concept: DomainConcept; relationship: ConceptRelationship }> = [];

    for (const rel of domainKnowledge.relationships) {
      if (rel.sourceId === conceptId || rel.targetId === conceptId) {
        if (relationTypes && !relationTypes.includes(rel.type)) continue;

        const relatedId = rel.sourceId === conceptId ? rel.targetId : rel.sourceId;
        const relatedConcept = this.conceptIndex.get(relatedId);

        if (relatedConcept) {
          related.push({ concept: relatedConcept, relationship: rel });
        }
      }
    }

    return related;
  }

  /**
   * Apply domain rules
   */
  applyRules(context: RuleContext): RuleResult {
    return this.ruleEngine.evaluate(context);
  }

  /**
   * Get domain patterns
   */
  getPatterns(domain: string, context?: string): DomainPattern[] {
    const domainKnowledge = this.domains.get(domain);
    if (!domainKnowledge) return [];

    if (!context) return domainKnowledge.patterns;

    return domainKnowledge.patterns.filter(
      p => p.context.toLowerCase().includes(context.toLowerCase()) ||
        p.applicability.some(a => a.toLowerCase().includes(context.toLowerCase()))
    );
  }

  /**
   * Resolve term to concept
   */
  resolveTerm(domain: string, term: string): DomainConcept | null {
    const domainKnowledge = this.domains.get(domain);
    if (!domainKnowledge) return null;

    // Check direct match
    const directMatch = domainKnowledge.concepts.find(
      c => c.name.toLowerCase() === term.toLowerCase()
    );
    if (directMatch) return directMatch;

    // Check aliases
    const aliasMatch = domainKnowledge.concepts.find(
      c => c.aliases.some(a => a.toLowerCase() === term.toLowerCase())
    );
    if (aliasMatch) return aliasMatch;

    // Check vocabulary
    const normalizedTerm = domainKnowledge.vocabulary.terms.get(term.toLowerCase());
    if (normalizedTerm) {
      return this.getConcept(domain, normalizedTerm.term);
    }

    // Check synonyms
    for (const [mainTerm, synonyms] of domainKnowledge.vocabulary.synonyms) {
      if (synonyms.some(s => s.toLowerCase() === term.toLowerCase())) {
        return this.getConcept(domain, mainTerm);
      }
    }

    return null;
  }

  /**
   * Explain concept
   */
  explainConcept(domain: string, conceptId: string): ConceptExplanation {
    const concept = this.conceptIndex.get(conceptId);
    const domainKnowledge = this.domains.get(domain);

    if (!concept || !domainKnowledge) {
      return { found: false, explanation: 'Concept not found' };
    }

    const related = this.getRelatedConcepts(domain, conceptId);
    const applicablePatterns = domainKnowledge.patterns.filter(
      p => p.relatedPatterns.includes(conceptId) ||
        p.solution.toLowerCase().includes(concept.name.toLowerCase())
    );

    return {
      found: true,
      concept,
      explanation: this.generateExplanation(concept, related),
      relatedConcepts: related,
      applicablePatterns,
      rules: domainKnowledge.rules.filter(
        r => r.consequence.relatedConcepts.includes(conceptId)
      ),
    };
  }

  private initializeDefaultDomains(): void {
    // Software Engineering Domain
    this.loadDomain({
      domain: 'software_engineering',
      concepts: [
        {
          id: 'se_component',
          name: 'Component',
          description: 'A modular, replaceable part of a system',
          type: 'entity',
          attributes: [
            { name: 'interface', type: 'string', required: true, description: 'Public interface' },
            { name: 'implementation', type: 'code', required: true, description: 'Implementation code' },
          ],
          examples: ['React Component', 'Microservice', 'DLL'],
          aliases: ['module', 'unit'],
        },
        {
          id: 'se_pattern',
          name: 'Design Pattern',
          description: 'Reusable solution to a common problem',
          type: 'pattern',
          attributes: [
            { name: 'context', type: 'string', required: true, description: 'When to apply' },
            { name: 'problem', type: 'string', required: true, description: 'Problem it solves' },
          ],
          examples: ['Singleton', 'Factory', 'Observer'],
          aliases: ['pattern'],
        },
        {
          id: 'se_api',
          name: 'API',
          description: 'Interface for software components to communicate',
          type: 'artifact',
          attributes: [
            { name: 'endpoints', type: 'array', required: true, description: 'Available endpoints' },
            { name: 'version', type: 'string', required: true, description: 'API version' },
          ],
          examples: ['REST API', 'GraphQL API', 'gRPC API'],
          aliases: ['interface', 'contract'],
        },
      ],
      relationships: [
        {
          id: 'rel_1',
          sourceId: 'se_component',
          targetId: 'se_api',
          type: 'has_a',
          strength: 0.8,
          bidirectional: false,
          description: 'Components can expose APIs',
        },
        {
          id: 'rel_2',
          sourceId: 'se_pattern',
          targetId: 'se_component',
          type: 'enhances',
          strength: 0.7,
          bidirectional: false,
          description: 'Patterns can enhance component design',
        },
      ],
      rules: [
        {
          id: 'rule_single_responsibility',
          name: 'Single Responsibility Principle',
          condition: { type: 'comparison', operands: ['component.responsibilities'], operator: 'greater_than', value: 1 },
          consequence: { action: 'warn', message: 'Component may have too many responsibilities', relatedConcepts: ['se_component'] },
          priority: 1,
          exceptions: [],
        },
      ],
      patterns: [
        {
          id: 'pattern_mvc',
          name: 'Model-View-Controller',
          description: 'Separates data, UI, and control logic',
          context: 'Web applications',
          problem: 'Mixed concerns in UI code',
          solution: 'Separate into Model, View, and Controller',
          consequences: ['Better separation of concerns', 'More files to manage'],
          applicability: ['web', 'desktop', 'mobile'],
          relatedPatterns: ['se_component'],
        },
      ],
      vocabulary: {
        terms: new Map([
          ['refactoring', { term: 'refactoring', definition: 'Restructuring code without changing behavior', category: 'process', relatedTerms: ['clean code', 'technical debt'], examples: ['Extract Method', 'Rename Variable'] }],
          ['technical debt', { term: 'technical debt', definition: 'Cost of additional rework from choosing an easy solution', category: 'concept', relatedTerms: ['refactoring', 'code quality'], examples: ['Quick hacks', 'Missing tests'] }],
        ]),
        synonyms: new Map([
          ['component', ['module', 'unit', 'element']],
          ['pattern', ['design pattern', 'architectural pattern']],
        ]),
        abbreviations: new Map([
          ['API', 'Application Programming Interface'],
          ['MVC', 'Model-View-Controller'],
          ['SOLID', 'Single responsibility, Open-closed, Liskov, Interface segregation, Dependency inversion'],
        ]),
      },
      metadata: {
        version: '1.0',
        source: 'builtin',
        lastUpdated: new Date(),
        confidence: 0.9,
        coverage: 0.8,
      },
    });

    // Database Domain
    this.loadDomain({
      domain: 'database',
      concepts: [
        {
          id: 'db_table',
          name: 'Table',
          description: 'Collection of related data organized in rows and columns',
          type: 'entity',
          attributes: [
            { name: 'columns', type: 'array', required: true, description: 'Column definitions' },
            { name: 'primary_key', type: 'string', required: true, description: 'Primary key column' },
          ],
          examples: ['Users table', 'Orders table'],
          aliases: ['relation', 'entity'],
        },
        {
          id: 'db_index',
          name: 'Index',
          description: 'Data structure for fast data retrieval',
          type: 'artifact',
          attributes: [
            { name: 'columns', type: 'array', required: true, description: 'Indexed columns' },
            { name: 'type', type: 'string', required: false, description: 'Index type (btree, hash, etc.)' },
          ],
          examples: ['Primary key index', 'Composite index'],
          aliases: ['key'],
        },
        {
          id: 'db_query',
          name: 'Query',
          description: 'Request for data or data manipulation',
          type: 'process',
          attributes: [
            { name: 'type', type: 'string', required: true, description: 'Query type (SELECT, INSERT, etc.)' },
            { name: 'sql', type: 'string', required: true, description: 'SQL statement' },
          ],
          examples: ['SELECT * FROM users', 'INSERT INTO orders'],
          aliases: ['statement', 'command'],
        },
      ],
      relationships: [
        {
          id: 'db_rel_1',
          sourceId: 'db_table',
          targetId: 'db_index',
          type: 'has_a',
          strength: 0.6,
          bidirectional: false,
          description: 'Tables can have indexes',
        },
        {
          id: 'db_rel_2',
          sourceId: 'db_query',
          targetId: 'db_table',
          type: 'uses',
          strength: 0.9,
          bidirectional: false,
          description: 'Queries operate on tables',
        },
      ],
      rules: [
        {
          id: 'db_rule_index',
          name: 'Index Foreign Keys',
          condition: { type: 'comparison', operands: ['table.foreign_keys'], operator: 'greater_than', value: 0 },
          consequence: { action: 'suggest', message: 'Consider indexing foreign key columns', relatedConcepts: ['db_index'] },
          priority: 2,
          exceptions: [],
        },
      ],
      patterns: [
        {
          id: 'db_pattern_acid',
          name: 'ACID',
          description: 'Atomicity, Consistency, Isolation, Durability',
          context: 'Transaction management',
          problem: 'Data integrity in concurrent environments',
          solution: 'Implement ACID properties',
          consequences: ['Data integrity', 'Potential performance impact'],
          applicability: ['transactions', 'concurrent access'],
          relatedPatterns: [],
        },
      ],
      vocabulary: {
        terms: new Map([
          ['normalization', { term: 'normalization', definition: 'Organizing data to reduce redundancy', category: 'process', relatedTerms: ['denormalization', 'schema'], examples: ['3NF', 'BCNF'] }],
          ['join', { term: 'join', definition: 'Combining rows from multiple tables', category: 'operation', relatedTerms: ['query', 'sql'], examples: ['INNER JOIN', 'LEFT JOIN'] }],
        ]),
        synonyms: new Map([
          ['row', ['record', 'tuple']],
          ['column', ['field', 'attribute']],
        ]),
        abbreviations: new Map([
          ['SQL', 'Structured Query Language'],
          ['ACID', 'Atomicity Consistency Isolation Durability'],
        ]),
      },
      metadata: {
        version: '1.0',
        source: 'builtin',
        lastUpdated: new Date(),
        confidence: 0.9,
        coverage: 0.7,
      },
    });
  }

  private findMatches(query: KnowledgeQuery, domain: DomainKnowledge): KnowledgeMatch[] {
    const matches: KnowledgeMatch[] = [];
    const queryLower = query.query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/);

    for (const concept of domain.concepts) {
      let relevance = 0;
      const matchedAttributes: string[] = [];

      // Check name match
      if (concept.name.toLowerCase().includes(queryLower)) {
        relevance += 0.4;
        matchedAttributes.push('name');
      }

      // Check aliases
      for (const alias of concept.aliases) {
        if (alias.toLowerCase().includes(queryLower)) {
          relevance += 0.3;
          matchedAttributes.push('alias');
          break;
        }
      }

      // Check description
      if (concept.description.toLowerCase().includes(queryLower)) {
        relevance += 0.2;
        matchedAttributes.push('description');
      }

      // Check term matches
      for (const term of queryTerms) {
        if (concept.name.toLowerCase().includes(term) ||
          concept.aliases.some(a => a.toLowerCase().includes(term))) {
          relevance += 0.1;
        }
      }

      if (relevance > 0) {
        matches.push({
          concept,
          relevance: Math.min(1, relevance),
          matchedAttributes,
          context: query.context?.focus?.join(', ') || 'general',
        });
      }
    }

    return matches.sort((a, b) => b.relevance - a.relevance);
  }

  private generateSuggestions(matches: KnowledgeMatch[], domain: DomainKnowledge): string[] {
    const suggestions: string[] = [];

    if (matches.length === 0) {
      suggestions.push('Try searching for related terms');
      suggestions.push('Check domain vocabulary for correct terminology');
    }

    for (const match of matches.slice(0, 3)) {
      // Suggest related concepts
      const related = this.getRelatedConcepts(domain.domain, match.concept.id);
      for (const r of related.slice(0, 2)) {
        suggestions.push(`Explore related concept: ${r.concept.name}`);
      }

      // Suggest applicable patterns
      const patterns = domain.patterns.filter(
        p => p.relatedPatterns.includes(match.concept.id)
      );
      for (const p of patterns.slice(0, 1)) {
        suggestions.push(`Consider pattern: ${p.name}`);
      }
    }

    return [...new Set(suggestions)].slice(0, 5);
  }

  private calculateConfidence(matches: KnowledgeMatch[]): number {
    if (matches.length === 0) return 0;
    return matches.reduce((sum, m) => sum + m.relevance, 0) / matches.length;
  }

  private generateExplanation(
    concept: DomainConcept,
    related: Array<{ concept: DomainConcept; relationship: ConceptRelationship }>
  ): string {
    let explanation = `${concept.name}: ${concept.description}\n`;

    if (concept.examples.length > 0) {
      explanation += `Examples: ${concept.examples.join(', ')}\n`;
    }

    if (related.length > 0) {
      explanation += `Related to: ${related.map(r => `${r.concept.name} (${r.relationship.type})`).join(', ')}\n`;
    }

    return explanation;
  }

  private generateId(): string {
    return `domain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Supporting classes
interface RuleContext {
  domain: string;
  facts: Record<string, unknown>;
}

interface RuleResult {
  triggered: boolean;
  actions: Array<{ rule: string; action: string; message: string }>;
}

interface ConceptExplanation {
  found: boolean;
  concept?: DomainConcept;
  explanation: string;
  relatedConcepts?: Array<{ concept: DomainConcept; relationship: ConceptRelationship }>;
  applicablePatterns?: DomainPattern[];
  rules?: DomainRule[];
}

class RuleEngine {
  private rules: Map<string, DomainRule> = new Map();

  registerRule(rule: DomainRule): void {
    this.rules.set(rule.id, rule);
  }

  evaluate(context: RuleContext): RuleResult {
    const actions: Array<{ rule: string; action: string; message: string }> = [];
    let triggered = false;

    for (const rule of this.rules.values()) {
      if (this.evaluateCondition(rule.condition, context.facts)) {
        triggered = true;
        actions.push({
          rule: rule.name,
          action: rule.consequence.action,
          message: rule.consequence.message,
        });
      }
    }

    return { triggered, actions };
  }

  private evaluateCondition(condition: RuleCondition, facts: Record<string, unknown>): boolean {
    switch (condition.type) {
      case 'comparison':
        const value = this.resolvePath(condition.operands[0] as string, facts);
        switch (condition.operator) {
          case 'equals': return value === condition.value;
          case 'contains': return String(value).includes(String(condition.value));
          case 'greater_than': return Number(value) > Number(condition.value);
          case 'less_than': return Number(value) < Number(condition.value);
          default: return false;
        }
      case 'and':
        return condition.operands.every(op =>
          typeof op === 'string' ? false : this.evaluateCondition(op, facts)
        );
      case 'or':
        return condition.operands.some(op =>
          typeof op === 'string' ? false : this.evaluateCondition(op, facts)
        );
      default:
        return false;
    }
  }

  private resolvePath(path: string, facts: Record<string, unknown>): unknown {
    const parts = path.split('.');
    let current: unknown = facts;
    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return current;
  }
}

class InferenceEngine {
  infer(
    matches: KnowledgeMatch[],
    domain: DomainKnowledge,
    depth: number
  ): KnowledgeInference[] {
    const inferences: KnowledgeInference[] = [];

    for (const match of matches) {
      // Infer related concepts
      const related = domain.relationships
        .filter(r => r.sourceId === match.concept.id || r.targetId === match.concept.id)
        .slice(0, depth);

      for (const rel of related) {
        const relatedId = rel.sourceId === match.concept.id ? rel.targetId : rel.sourceId;
        const relatedConcept = domain.concepts.find(c => c.id === relatedId);

        if (relatedConcept) {
          inferences.push({
            conclusion: `${match.concept.name} ${rel.type.replace('_', ' ')} ${relatedConcept.name}`,
            basis: [rel.description],
            confidence: rel.strength * match.relevance,
            reasoning: `Relationship inference based on domain knowledge`,
          });
        }
      }
    }

    return inferences.sort((a, b) => b.confidence - a.confidence);
  }
}

// Singleton instance
let domainKnowledgeInstance: DomainKnowledgeSystem | null = null;

export function getDomainKnowledgeSystem(): DomainKnowledgeSystem {
  if (!domainKnowledgeInstance) {
    domainKnowledgeInstance = new DomainKnowledgeSystem();
  }
  return domainKnowledgeInstance;
}
