/**
 * Architecture Decision Scorer
 * Scores and evaluates architecture decisions against multiple criteria
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ArchitectureDecision {
  id: string;
  title: string;
  description: string;
  context: string;
  decision: string;
  consequences: string[];
  alternatives: AlternativeOption[];
  status: 'proposed' | 'accepted' | 'deprecated' | 'superseded';
  createdAt: Date;
  updatedAt: Date;
  author?: string;
  tags: string[];
}

export interface AlternativeOption {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  score: number;
}

export interface ScoringCriteria {
  name: string;
  description: string;
  weight: number; // 0-1
  scoreFunction: (decision: ArchitectureDecision) => number; // 0-100
}

export interface DecisionScore {
  decisionId: string;
  overallScore: number;
  criteriaScores: Map<string, number>;
  weightedScores: Map<string, number>;
  confidence: number;
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface DecisionRelationship {
  fromDecisionId: string;
  toDecisionId: string;
  relationshipType: 'supersedes' | 'amends' | 'conflicts' | 'complements' | 'depends_on';
  description: string;
}

export interface ScoringReport {
  totalDecisions: number;
  averageScore: number;
  scoreDistribution: Map<string, number>;
  topDecisions: DecisionScore[];
  lowScoringDecisions: DecisionScore[];
  trends: DecisionTrend[];
  recommendations: string[];
}

export interface DecisionTrend {
  category: string;
  direction: 'improving' | 'declining' | 'stable';
  changeRate: number;
  dataPoints: { date: Date; score: number }[];
}

// ============================================================================
// Default Scoring Criteria
// ============================================================================

const DEFAULT_SCORING_CRITERIA: ScoringCriteria[] = [
  {
    name: 'clarity',
    description: 'How clear and understandable is the decision',
    weight: 0.15,
    scoreFunction: (decision) => {
      let score = 50;
      if (decision.title.length > 10 && decision.title.length < 100) score += 10;
      if (decision.description.length > 50) score += 15;
      if (decision.context.length > 30) score += 10;
      if (decision.consequences.length > 0) score += 15;
      return Math.min(100, score);
    }
  },
  {
    name: 'alternatives_considered',
    description: 'Quality and number of alternatives evaluated',
    weight: 0.15,
    scoreFunction: (decision) => {
      const altCount = decision.alternatives.length;
      if (altCount >= 3) return 100;
      if (altCount === 2) return 75;
      if (altCount === 1) return 50;
      return 25;
    }
  },
  {
    name: 'documentation_quality',
    description: 'Quality of documentation and reasoning',
    weight: 0.12,
    scoreFunction: (decision) => {
      let score = 30;
      if (decision.context.includes('because') || decision.context.includes('due to')) score += 20;
      if (decision.consequences.length >= 2) score += 20;
      if (decision.tags.length >= 2) score += 15;
      if (decision.alternatives.every(a => a.pros.length > 0 && a.cons.length > 0)) score += 15;
      return Math.min(100, score);
    }
  },
  {
    name: 'reversibility',
    description: 'How easy is it to reverse this decision',
    weight: 0.10,
    scoreFunction: (decision) => {
      const text = (decision.context + ' ' + decision.decision).toLowerCase();
      if (text.includes('easy to reverse') || text.includes('reversible')) return 90;
      if (text.includes('hard to reverse') || text.includes('irreversible')) return 20;
      if (text.includes('migration') || text.includes('refactor')) return 50;
      return 60;
    }
  },
  {
    name: 'impact_scope',
    description: 'Breadth of impact on the system',
    weight: 0.12,
    scoreFunction: (decision) => {
      const text = (decision.context + ' ' + decision.decision).toLowerCase();
      if (text.includes('critical') || text.includes('system-wide')) return 30;
      if (text.includes('module') || text.includes('component')) return 60;
      if (text.includes('local') || text.includes('isolated')) return 90;
      return 50;
    }
  },
  {
    name: 'risk_mitigation',
    description: 'How well risks are identified and mitigated',
    weight: 0.12,
    scoreFunction: (decision) => {
      const consequenceCount = decision.consequences.length;
      const negativeConsequences = decision.consequences.filter(c => 
        c.toLowerCase().includes('risk') || 
        c.toLowerCase().includes('drawback') ||
        c.toLowerCase().includes('limitation')
      ).length;
      
      if (consequenceCount >= 3 && negativeConsequences > 0) return 90;
      if (consequenceCount >= 2) return 70;
      if (consequenceCount === 1) return 50;
      return 30;
    }
  },
  {
    name: 'alignment',
    description: 'Alignment with project goals and constraints',
    weight: 0.12,
    scoreFunction: (decision) => {
      const text = (decision.context + ' ' + decision.decision).toLowerCase();
      let score = 50;
      if (text.includes('performance')) score += 10;
      if (text.includes('scalability')) score += 10;
      if (text.includes('maintainability')) score += 10;
      if (text.includes('security')) score += 10;
      if (text.includes('cost')) score += 10;
      return Math.min(100, score);
    }
  },
  {
    name: 'timeliness',
    description: 'Decision made at appropriate time',
    weight: 0.12,
    scoreFunction: (decision) => {
      const ageDays = (Date.now() - decision.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (decision.status === 'deprecated') return 30;
      if (decision.status === 'superseded') return 20;
      if (ageDays < 30) return 100;
      if (ageDays < 90) return 90;
      if (ageDays < 180) return 70;
      return 50;
    }
  }
];

// ============================================================================
// Architecture Decision Scorer Class
// ============================================================================

export class ArchitectureDecisionScorer {
  private decisions: Map<string, ArchitectureDecision> = new Map();
  private relationships: DecisionRelationship[] = [];
  private scoringCriteria: ScoringCriteria[];
  private scoreHistory: Map<string, DecisionScore[]> = new Map();
  private customCriteria: Map<string, ScoringCriteria> = new Map();

  constructor(criteria?: ScoringCriteria[]) {
    this.scoringCriteria = criteria || DEFAULT_SCORING_CRITERIA;
  }

  // --------------------------------------------------------------------------
  // Decision Management
  // --------------------------------------------------------------------------

  addDecision(decision: ArchitectureDecision): void {
    this.decisions.set(decision.id, decision);
  }

  updateDecision(id: string, updates: Partial<ArchitectureDecision>): boolean {
    const existing = this.decisions.get(id);
    if (!existing) return false;

    const updated: ArchitectureDecision = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    this.decisions.set(id, updated);
    return true;
  }

  removeDecision(id: string): boolean {
    return this.decisions.delete(id);
  }

  getDecision(id: string): ArchitectureDecision | undefined {
    return this.decisions.get(id);
  }

  getAllDecisions(): ArchitectureDecision[] {
    return Array.from(this.decisions.values());
  }

  // --------------------------------------------------------------------------
  // Relationship Management
  // --------------------------------------------------------------------------

  addRelationship(relationship: DecisionRelationship): void {
    this.relationships.push(relationship);
  }

  getRelatedDecisions(decisionId: string): ArchitectureDecision[] {
    const relatedIds = new Set<string>();
    
    for (const rel of this.relationships) {
      if (rel.fromDecisionId === decisionId) {
        relatedIds.add(rel.toDecisionId);
      }
      if (rel.toDecisionId === decisionId) {
        relatedIds.add(rel.fromDecisionId);
      }
    }

    return Array.from(relatedIds)
      .map(id => this.decisions.get(id))
      .filter((d): d is ArchitectureDecision => d !== undefined);
  }

  // --------------------------------------------------------------------------
  // Scoring Functions
  // --------------------------------------------------------------------------

  scoreDecision(decisionId: string): DecisionScore | null {
    const decision = this.decisions.get(decisionId);
    if (!decision) return null;

    const criteriaScores = new Map<string, number>();
    const weightedScores = new Map<string, number>();
    let totalWeight = 0;
    let weightedSum = 0;

    for (const criteria of this.scoringCriteria) {
      const score = criteria.scoreFunction(decision);
      criteriaScores.set(criteria.name, score);
      weightedScores.set(criteria.name, score * criteria.weight);
      weightedSum += score * criteria.weight;
      totalWeight += criteria.weight;
    }

    // Apply custom criteria
    for (const [, criteria] of this.customCriteria) {
      const score = criteria.scoreFunction(decision);
      criteriaScores.set(criteria.name, score);
      weightedScores.set(criteria.name, score * criteria.weight);
      weightedSum += score * criteria.weight;
      totalWeight += criteria.weight;
    }

    const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    // Calculate confidence based on data quality
    let confidence = 0.8;
    if (decision.alternatives.length < 2) confidence -= 0.2;
    if (decision.consequences.length < 2) confidence -= 0.1;
    if (!decision.context || decision.context.length < 30) confidence -= 0.1;

    // Generate recommendations
    const recommendations = this.generateRecommendations(decision, criteriaScores);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(overallScore, decision);

    const score: DecisionScore = {
      decisionId,
      overallScore,
      criteriaScores,
      weightedScores,
      confidence: Math.max(0, Math.min(1, confidence)),
      recommendations,
      riskLevel
    };

    // Store in history
    const history = this.scoreHistory.get(decisionId) || [];
    history.push(score);
    this.scoreHistory.set(decisionId, history);

    return score;
  }

  scoreAllDecisions(): DecisionScore[] {
    const scores: DecisionScore[] = [];
    for (const decisionId of this.decisions.keys()) {
      const score = this.scoreDecision(decisionId);
      if (score) scores.push(score);
    }
    return scores;
  }

  generateReport(): ScoringReport {
    const scores = this.scoreAllDecisions();
    
    const averageScore = scores.length > 0
      ? scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length
      : 0;

    // Score distribution
    const distribution = new Map<string, number>();
    distribution.set('excellent (90-100)', scores.filter(s => s.overallScore >= 90).length);
    distribution.set('good (70-89)', scores.filter(s => s.overallScore >= 70 && s.overallScore < 90).length);
    distribution.set('fair (50-69)', scores.filter(s => s.overallScore >= 50 && s.overallScore < 70).length);
    distribution.set('poor (0-49)', scores.filter(s => s.overallScore < 50).length);

    // Top and low scoring
    const sorted = [...scores].sort((a, b) => b.overallScore - a.overallScore);
    const topDecisions = sorted.slice(0, 5);
    const lowScoringDecisions = sorted.slice(-5).reverse();

    // Analyze trends
    const trends = this.analyzeTrends();

    // Generate overall recommendations
    const recommendations = this.generateOverallRecommendations(scores);

    return {
      totalDecisions: this.decisions.size,
      averageScore,
      scoreDistribution: distribution,
      topDecisions,
      lowScoringDecisions,
      trends,
      recommendations
    };
  }

  // --------------------------------------------------------------------------
  // Custom Criteria Management
  // --------------------------------------------------------------------------

  addCustomCriteria(criteria: ScoringCriteria): void {
    this.customCriteria.set(criteria.name, criteria);
  }

  removeCustomCriteria(name: string): boolean {
    return this.customCriteria.delete(name);
  }

  // --------------------------------------------------------------------------
  // Private Helper Methods
  // --------------------------------------------------------------------------

  private generateRecommendations(
    decision: ArchitectureDecision,
    scores: Map<string, number>
  ): string[] {
    const recommendations: string[] = [];

    // Check each criteria
    if ((scores.get('alternatives_considered') || 0) < 50) {
      recommendations.push('Consider evaluating more alternatives before finalizing');
    }

    if ((scores.get('documentation_quality') || 0) < 60) {
      recommendations.push('Improve documentation with more context and reasoning');
    }

    if ((scores.get('risk_mitigation') || 0) < 50) {
      recommendations.push('Identify and document potential risks and mitigation strategies');
    }

    if (decision.consequences.length < 2) {
      recommendations.push('Document more consequences, both positive and negative');
    }

    if (decision.status === 'proposed') {
      recommendations.push('Decision is still pending acceptance review');
    }

    if (decision.status === 'deprecated') {
      recommendations.push('Consider creating a superseding decision if still relevant');
    }

    return recommendations;
  }

  private determineRiskLevel(score: number, decision: ArchitectureDecision): 'low' | 'medium' | 'high' | 'critical' {
    // Check for critical keywords
    const text = (decision.context + ' ' + decision.decision).toLowerCase();
    
    if (text.includes('security') || text.includes('compliance')) {
      return score < 70 ? 'critical' : 'high';
    }

    if (text.includes('data migration') || text.includes('breaking change')) {
      return score < 60 ? 'high' : 'medium';
    }

    if (decision.status === 'deprecated' || decision.status === 'superseded') {
      return 'low';
    }

    if (score < 40) return 'high';
    if (score < 60) return 'medium';
    return 'low';
  }

  private analyzeTrends(): DecisionTrend[] {
    const trends: DecisionTrend[] = [];
    const categories = new Set<string>();

    // Extract categories from tags
    for (const decision of this.decisions.values()) {
      for (const tag of decision.tags) {
        categories.add(tag);
      }
    }

    for (const category of categories) {
      const categoryDecisions = Array.from(this.decisions.values())
        .filter(d => d.tags.includes(category));

      if (categoryDecisions.length < 2) continue;

      const dataPoints = categoryDecisions.map(d => ({
        date: d.createdAt,
        score: this.scoreDecision(d.id)?.overallScore || 0
      })).sort((a, b) => a.date.getTime() - b.date.getTime());

      // Calculate trend direction
      if (dataPoints.length >= 2) {
        const recentAvg = dataPoints.slice(-3).reduce((s, d) => s + d.score, 0) / Math.min(3, dataPoints.length);
        const olderAvg = dataPoints.slice(0, -3).reduce((s, d) => s + d.score, 0) / Math.max(1, dataPoints.length - 3);
        
        const changeRate = recentAvg - olderAvg;
        const direction = changeRate > 5 ? 'improving' : changeRate < -5 ? 'declining' : 'stable';

        trends.push({
          category,
          direction,
          changeRate,
          dataPoints
        });
      }
    }

    return trends;
  }

  private generateOverallRecommendations(scores: DecisionScore[]): string[] {
    const recommendations: string[] = [];
    
    const avgScore = scores.reduce((s, sc) => s + sc.overallScore, 0) / Math.max(1, scores.length);
    
    if (avgScore < 60) {
      recommendations.push('Overall decision quality is below acceptable threshold. Review scoring criteria.');
    }

    const lowRiskDecisions = scores.filter(s => s.riskLevel === 'high' || s.riskLevel === 'critical');
    if (lowRiskDecisions.length > 0) {
      recommendations.push(`${lowRiskDecisions.length} decisions have elevated risk levels requiring attention.`);
    }

    const oldProposed = Array.from(this.decisions.values())
      .filter(d => {
        const daysOld = (Date.now() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return d.status === 'proposed' && daysOld > 7;
      });
    
    if (oldProposed.length > 0) {
      recommendations.push(`${oldProposed.length} decisions have been in 'proposed' state for over a week.`);
    }

    return recommendations;
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  compareDecisions(id1: string, id2: string): {
    decision1: ArchitectureDecision | null;
    decision2: ArchitectureDecision | null;
    score1: DecisionScore | null;
    score2: DecisionScore | null;
    comparison: string;
  } {
    const decision1 = this.decisions.get(id1);
    const decision2 = this.decisions.get(id2);
    const score1 = decision1 ? this.scoreDecision(id1) : null;
    const score2 = decision2 ? this.scoreDecision(id2) : null;

    let comparison = 'Unable to compare';
    
    if (score1 && score2) {
      if (score1.overallScore > score2.overallScore + 10) {
        comparison = `Decision "${decision1?.title}" is significantly better scored`;
      } else if (score2.overallScore > score1.overallScore + 10) {
        comparison = `Decision "${decision2?.title}" is significantly better scored`;
      } else {
        comparison = 'Both decisions have similar scores';
      }
    }

    return { decision1: decision1 || null, decision2: decision2 || null, score1, score2, comparison };
  }

  getDecisionHistory(decisionId: string): DecisionScore[] {
    return this.scoreHistory.get(decisionId) || [];
  }

  exportDecisions(): ArchitectureDecision[] {
    return Array.from(this.decisions.values());
  }

  importDecisions(decisions: ArchitectureDecision[]): void {
    for (const decision of decisions) {
      this.decisions.set(decision.id, decision);
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createDecisionScorer(criteria?: ScoringCriteria[]): ArchitectureDecisionScorer {
  return new ArchitectureDecisionScorer(criteria);
}

export function createArchitectureDecision(
  title: string,
  description: string,
  context: string,
  decision: string
): ArchitectureDecision {
  return {
    id: `adr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    description,
    context,
    decision,
    consequences: [],
    alternatives: [],
    status: 'proposed',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: []
  };
}

export function createQuickScore(
  title: string,
  context: string,
  decision: string
): number {
  const scorer = new ArchitectureDecisionScorer();
  const adr = createArchitectureDecision(title, '', context, decision);
  scorer.addDecision(adr);
  const score = scorer.scoreDecision(adr.id);
  return score?.overallScore || 0;
}
