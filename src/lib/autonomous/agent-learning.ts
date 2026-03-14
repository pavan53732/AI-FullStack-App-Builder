/**
 * Agent Learning System
 * Mechanisms 191-200: Continuous learning and skill acquisition for agents
 */

export interface LearningExperience {
  id: string;
  agentId: string;
  timestamp: Date;
  type: ExperienceType;
  context: LearningContext;
  action: LearningAction;
  outcome: LearningOutcome;
  lessons: LearnedLesson[];
  embeddings?: number[];
}

export type ExperienceType =
  | 'task_success'
  | 'task_failure'
  | 'error_recovery'
  | 'optimization'
  | 'collaboration'
  | 'discovery'
  | 'feedback';

export interface LearningContext {
  taskType: string;
  environment: string;
  constraints: string[];
  resources: string[];
  previousAttempts: number;
  relatedExperiences: string[];
}

export interface LearningAction {
  type: string;
  parameters: Record<string, unknown>;
  strategy: string;
  tools: string[];
  reasoning: string;
}

export interface LearningOutcome {
  success: boolean;
  quality: number; // 0-1
  efficiency: number; // 0-1
  sideEffects: string[];
  feedback?: Feedback;
}

export interface Feedback {
  source: 'user' | 'system' | 'peer_agent' | 'self';
  type: 'positive' | 'negative' | 'neutral' | 'constructive';
  content: string;
  rating?: number;
  suggestions?: string[];
}

export interface LearnedLesson {
  id: string;
  category: LessonCategory;
  description: string;
  applicability: string[];
  confidence: number;
  importance: number;
}

export type LessonCategory =
  | 'strategy'
  | 'tool_selection'
  | 'parameter_tuning'
  | 'error_avoidance'
  | 'optimization'
  | 'collaboration'
  | 'context_awareness';

export interface SkillModel {
  id: string;
  agentId: string;
  skillName: string;
  proficiency: number; // 0-1
  experience: number; // count
  lastUpdated: Date;
  strategies: StrategyKnowledge[];
  parameters: ParameterKnowledge[];
  associatedLessons: string[];
}

export interface StrategyKnowledge {
  name: string;
  successRate: number;
  contexts: string[];
  parameters: Record<string, unknown>;
}

export interface ParameterKnowledge {
  name: string;
  optimalValue: unknown;
  range: { min: number; max: number };
  contextAdjustments: ContextAdjustment[];
}

export interface ContextAdjustment {
  context: string;
  adjustment: number;
}

export interface LearningPolicy {
  learningRate: number;
  explorationRate: number;
  discountFactor: number;
  batchSize: number;
  updateFrequency: number;
  retentionPeriod: number;
}

export interface AdaptationResult {
  skillId: string;
  adaptations: SkillAdaptation[];
  newProficiency: number;
  confidence: number;
}

export interface SkillAdaptation {
  type: 'strategy' | 'parameter' | 'knowledge';
  description: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string;
}

export class AgentLearningSystem {
  private experiences: Map<string, LearningExperience[]>;
  private skills: Map<string, SkillModel>;
  private policy: LearningPolicy;
  private knowledgeBase: LearningKnowledgeBase;
  private listeners: LearningListener[];

  constructor(policy?: Partial<LearningPolicy>) {
    this.experiences = new Map();
    this.skills = new Map();
    this.policy = {
      learningRate: 0.1,
      explorationRate: 0.2,
      discountFactor: 0.95,
      batchSize: 32,
      updateFrequency: 100,
      retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
      ...policy,
    };
    this.knowledgeBase = new LearningKnowledgeBase();
    this.listeners = [];
  }

  /**
   * Record a learning experience
   */
  recordExperience(experience: Omit<LearningExperience, 'id' | 'timestamp'>): LearningExperience {
    const fullExperience: LearningExperience = {
      ...experience,
      id: this.generateId(),
      timestamp: new Date(),
    };

    // Store experience
    if (!this.experiences.has(experience.agentId)) {
      this.experiences.set(experience.agentId, []);
    }
    this.experiences.get(experience.agentId)!.push(fullExperience);

    // Extract lessons
    const lessons = this.extractLessons(fullExperience);
    fullExperience.lessons = lessons;

    // Update skill model
    this.updateSkillModel(fullExperience, lessons);

    // Clean old experiences
    this.cleanOldExperiences(experience.agentId);

    // Notify listeners
    this.notifyListeners('experience_recorded', fullExperience);

    return fullExperience;
  }

  /**
   * Get learned skills for an agent
   */
  getSkills(agentId: string): SkillModel[] {
    const skills: SkillModel[] = [];
    for (const skill of this.skills.values()) {
      if (skill.agentId === agentId) {
        skills.push(skill);
      }
    }
    return skills;
  }

  /**
   * Get a specific skill
   */
  getSkill(agentId: string, skillName: string): SkillModel | undefined {
    return this.skills.get(`${agentId}:${skillName}`);
  }

  /**
   * Recommend strategy for a task
   */
  recommendStrategy(
    agentId: string,
    taskType: string,
    context: LearningContext
  ): StrategyRecommendation {
    const skills = this.getSkills(agentId);
    const relevantSkills = skills.filter(s =>
      s.strategies.some(strat => strat.contexts.includes(taskType))
    );

    if (relevantSkills.length === 0) {
      return this.getDefaultStrategy(taskType);
    }

    // Find best strategy based on success rate and context match
    let bestStrategy: StrategyKnowledge | null = null;
    let bestScore = 0;
    let bestSkill: SkillModel | null = null;

    for (const skill of relevantSkills) {
      for (const strategy of skill.strategies) {
        const score = this.scoreStrategy(strategy, taskType, context);
        if (score > bestScore) {
          bestScore = score;
          bestStrategy = strategy;
          bestSkill = skill;
        }
      }
    }

    if (!bestStrategy || !bestSkill) {
      return this.getDefaultStrategy(taskType);
    }

    return {
      strategyName: bestStrategy.name,
      parameters: this.adjustParameters(bestStrategy.parameters, context, bestSkill),
      confidence: bestScore,
      reasoning: `Selected based on ${(bestStrategy.successRate * 100).toFixed(0)}% success rate in similar contexts`,
      alternatives: this.getAlternativeStrategies(relevantSkills, bestStrategy.name),
    };
  }

  /**
   * Learn from batch experiences
   */
  async batchLearn(experiences: LearningExperience[]): Promise<BatchLearningResult> {
    const results: AdaptationResult[] = [];

    for (const experience of experiences) {
      const result = this.adaptFromExperience(experience);
      if (result) {
        results.push(result);
      }
    }

    // Update knowledge base
    await this.knowledgeBase.update(experiences);

    return {
      totalExperiences: experiences.length,
      adaptations: results,
      newKnowledge: this.knowledgeBase.extractNewKnowledge(experiences),
    };
  }

  /**
   * Transfer learning from one agent to another
   */
  transferLearning(
    sourceAgentId: string,
    targetAgentId: string,
    skillNames?: string[]
  ): TransferResult {
    const sourceSkills = this.getSkills(sourceAgentId);
    const skillsToTransfer = skillNames
      ? sourceSkills.filter(s => skillNames.includes(s.skillName))
      : sourceSkills;

    const transferred: SkillModel[] = [];
    const conflicts: TransferConflict[] = [];

    for (const skill of skillsToTransfer) {
      const existingSkill = this.getSkill(targetAgentId, skill.skillName);
      
      if (existingSkill) {
        // Merge skills
        const merged = this.mergeSkills(existingSkill, skill);
        this.skills.set(`${targetAgentId}:${skill.skillName}`, merged);
        conflicts.push({
          skillName: skill.skillName,
          resolution: 'merged',
          details: 'Merged with existing skill knowledge',
        });
      } else {
        // Copy skill
        const newSkill: SkillModel = {
          ...skill,
          id: this.generateId(),
          agentId: targetAgentId,
          proficiency: skill.proficiency * 0.8, // Slightly reduced for transfer
        };
        this.skills.set(`${targetAgentId}:${skill.skillName}`, newSkill);
        transferred.push(newSkill);
      }
    }

    return {
      sourceAgentId,
      targetAgentId,
      transferredSkills: transferred.length + conflicts.length,
      conflicts,
    };
  }

  /**
   * Get learning insights for an agent
   */
  getInsights(agentId: string): LearningInsight[] {
    const experiences = this.experiences.get(agentId) || [];
    const insights: LearningInsight[] = [];

    // Success pattern insights
    const successes = experiences.filter(e => e.outcome.success);
    const failures = experiences.filter(e => !e.outcome.success);

    if (successes.length > 0) {
      const successPatterns = this.findPatterns(successes);
      for (const pattern of successPatterns) {
        insights.push({
          type: 'success_pattern',
          description: pattern.description,
          frequency: pattern.frequency,
          recommendation: `Continue using ${pattern.description} strategy`,
        });
      }
    }

    if (failures.length > 0) {
      const failurePatterns = this.findPatterns(failures);
      for (const pattern of failurePatterns) {
        insights.push({
          type: 'failure_pattern',
          description: pattern.description,
          frequency: pattern.frequency,
          recommendation: `Avoid ${pattern.description} in similar contexts`,
        });
      }
    }

    // Skill improvement insights
    const skills = this.getSkills(agentId);
    for (const skill of skills) {
      if (skill.proficiency < 0.5 && skill.experience > 5) {
        insights.push({
          type: 'skill_improvement',
          description: `Skill ${skill.skillName} needs improvement`,
          frequency: skill.experience,
          recommendation: 'Seek more practice or mentor guidance',
        });
      }
    }

    return insights;
  }

  /**
   * Add a learning listener
   */
  onLearning(listener: LearningListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private extractLessons(experience: LearningExperience): LearnedLesson[] {
    const lessons: LearnedLesson[] = [];

    if (experience.outcome.success) {
      // Extract what worked
      lessons.push({
        id: this.generateId(),
        category: 'strategy',
        description: `${experience.action.strategy} strategy was effective for ${experience.context.taskType}`,
        applicability: [experience.context.taskType],
        confidence: 0.7,
        importance: experience.outcome.quality,
      });
    } else {
      // Extract what didn't work
      lessons.push({
        id: this.generateId(),
        category: 'error_avoidance',
        description: `Avoid ${experience.action.strategy} strategy for ${experience.context.taskType} in similar contexts`,
        applicability: [experience.context.taskType],
        confidence: 0.6,
        importance: 1 - experience.outcome.quality,
      });
    }

    // Extract parameter lessons
    for (const [param, value] of Object.entries(experience.action.parameters)) {
      if (typeof value === 'number') {
        const optimalRange = this.inferOptimalRange(
          param,
          value,
          experience.outcome.success
        );
        if (optimalRange) {
          lessons.push({
            id: this.generateId(),
            category: 'parameter_tuning',
            description: `Parameter ${param} optimal around ${value}`,
            applicability: [experience.context.taskType],
            confidence: 0.5,
            importance: 0.5,
          });
        }
      }
    }

    // Extract feedback-based lessons
    if (experience.outcome.feedback) {
      const feedback = experience.outcome.feedback;
      if (feedback.suggestions) {
        for (const suggestion of feedback.suggestions) {
          lessons.push({
            id: this.generateId(),
            category: 'optimization',
            description: suggestion,
            applicability: [experience.context.taskType],
            confidence: feedback.type === 'constructive' ? 0.8 : 0.5,
            importance: feedback.rating || 0.5,
          });
        }
      }
    }

    return lessons;
  }

  private updateSkillModel(
    experience: LearningExperience,
    lessons: LearnedLesson[]
  ): void {
    const skillKey = `${experience.agentId}:${experience.context.taskType}`;
    let skill = this.skills.get(skillKey);

    if (!skill) {
      skill = {
        id: this.generateId(),
        agentId: experience.agentId,
        skillName: experience.context.taskType,
        proficiency: 0,
        experience: 0,
        lastUpdated: new Date(),
        strategies: [],
        parameters: [],
        associatedLessons: [],
      };
      this.skills.set(skillKey, skill);
    }

    // Update experience count
    skill.experience += 1;

    // Update proficiency using exponential moving average
    const qualityScore = experience.outcome.success
      ? (experience.outcome.quality + experience.outcome.efficiency) / 2
      : 0;
    skill.proficiency = skill.proficiency * (1 - this.policy.learningRate) +
      qualityScore * this.policy.learningRate;

    // Update strategies
    this.updateStrategies(skill, experience);

    // Update parameters
    this.updateParameters(skill, experience);

    // Associate lessons
    skill.associatedLessons.push(...lessons.map(l => l.id));

    // Update timestamp
    skill.lastUpdated = new Date();
  }

  private updateStrategies(skill: SkillModel, experience: LearningExperience): void {
    const strategyName = experience.action.strategy;
    let strategy = skill.strategies.find(s => s.name === strategyName);

    if (!strategy) {
      strategy = {
        name: strategyName,
        successRate: 0,
        contexts: [],
        parameters: experience.action.parameters,
      };
      skill.strategies.push(strategy);
    }

    // Update success rate
    const successCount = experience.outcome.success ? 1 : 0;
    strategy.successRate = strategy.successRate * 0.9 + successCount * 0.1;

    // Add context if not present
    if (!strategy.contexts.includes(experience.context.taskType)) {
      strategy.contexts.push(experience.context.taskType);
    }
  }

  private updateParameters(skill: SkillModel, experience: LearningExperience): void {
    for (const [name, value] of Object.entries(experience.action.parameters)) {
      if (typeof value !== 'number') continue;

      let param = skill.parameters.find(p => p.name === name);

      if (!param) {
        param = {
          name,
          optimalValue: value,
          range: { min: value * 0.5, max: value * 1.5 },
          contextAdjustments: [],
        };
        skill.parameters.push(param);
      } else {
        // Update optimal value using weighted average
        const weight = experience.outcome.success ? 0.2 : 0.1;
        param.optimalValue = (param.optimalValue as number) * (1 - weight) +
          value * weight;

        // Adjust range
        param.range.min = Math.min(param.range.min, value * 0.8);
        param.range.max = Math.max(param.range.max, value * 1.2);
      }
    }
  }

  private cleanOldExperiences(agentId: string): void {
    const agentExperiences = this.experiences.get(agentId);
    if (!agentExperiences) return;

    const cutoff = Date.now() - this.policy.retentionPeriod;
    const filtered = agentExperiences.filter(e => e.timestamp.getTime() > cutoff);
    this.experiences.set(agentId, filtered);
  }

  private scoreStrategy(
    strategy: StrategyKnowledge,
    taskType: string,
    context: LearningContext
  ): number {
    let score = strategy.successRate;

    // Context match bonus
    if (strategy.contexts.includes(taskType)) {
      score += 0.2;
    }

    // Resource availability match
    const resourceMatch = context.resources.filter(r =>
      Object.values(strategy.parameters).some(p =>
        String(p).includes(r)
      )
    ).length / Math.max(context.resources.length, 1);
    score += resourceMatch * 0.1;

    return score;
  }

  private adjustParameters(
    parameters: Record<string, unknown>,
    context: LearningContext,
    skill: SkillModel
  ): Record<string, unknown> {
    const adjusted: Record<string, unknown> = { ...parameters };

    for (const param of skill.parameters) {
      if (adjusted[param.name] !== undefined) {
        // Apply context adjustments
        for (const adjustment of param.contextAdjustments) {
          if (context.constraints.includes(adjustment.context)) {
            adjusted[param.name] = (adjusted[param.name] as number) * (1 + adjustment.adjustment);
          }
        }

        // Ensure within range
        if (typeof adjusted[param.name] === 'number') {
          adjusted[param.name] = Math.max(
            param.range.min,
            Math.min(param.range.max, adjusted[param.name] as number)
          );
        }
      }
    }

    return adjusted;
  }

  private getDefaultStrategy(taskType: string): StrategyRecommendation {
    return {
      strategyName: 'default',
      parameters: {},
      confidence: 0.3,
      reasoning: 'No learned strategies available, using default approach',
      alternatives: [],
    };
  }

  private getAlternativeStrategies(
    skills: SkillModel[],
    excludeStrategy: string
  ): Array<{ name: string; confidence: number }> {
    const alternatives: Array<{ name: string; confidence: number }> = [];

    for (const skill of skills) {
      for (const strategy of skill.strategies) {
        if (strategy.name !== excludeStrategy && !alternatives.some(a => a.name === strategy.name)) {
          alternatives.push({
            name: strategy.name,
            confidence: strategy.successRate,
          });
        }
      }
    }

    return alternatives.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  private adaptFromExperience(experience: LearningExperience): AdaptationResult | null {
    const skill = this.skills.get(`${experience.agentId}:${experience.context.taskType}`);
    if (!skill) return null;

    const adaptations: SkillAdaptation[] = [];

    // Adapt strategy success rate
    for (const strategy of skill.strategies) {
      if (strategy.name === experience.action.strategy) {
        const oldRate = strategy.successRate;
        const delta = experience.outcome.success ? 0.1 : -0.1;
        strategy.successRate = Math.max(0, Math.min(1, oldRate + delta * this.policy.learningRate));

        adaptations.push({
          type: 'strategy',
          description: `Updated success rate for ${strategy.name}`,
          oldValue: oldRate,
          newValue: strategy.successRate,
          reason: experience.outcome.success ? 'Successful execution' : 'Failed execution',
        });
      }
    }

    return {
      skillId: skill.id,
      adaptations,
      newProficiency: skill.proficiency,
      confidence: Math.min(0.95, 0.5 + skill.experience * 0.02),
    };
  }

  private mergeSkills(existing: SkillModel, source: SkillModel): SkillModel {
    const merged: SkillModel = {
      ...existing,
      proficiency: (existing.proficiency + source.proficiency) / 2,
      experience: existing.experience + source.experience,
      lastUpdated: new Date(),
    };

    // Merge strategies
    for (const sourceStrategy of source.strategies) {
      const existingStrategy = merged.strategies.find(s => s.name === sourceStrategy.name);
      if (existingStrategy) {
        existingStrategy.successRate = (existingStrategy.successRate + sourceStrategy.successRate) / 2;
      } else {
        merged.strategies.push({ ...sourceStrategy });
      }
    }

    // Merge parameters
    for (const sourceParam of source.parameters) {
      const existingParam = merged.parameters.find(p => p.name === sourceParam.name);
      if (existingParam) {
        existingParam.optimalValue = ((existingParam.optimalValue as number) + (sourceParam.optimalValue as number)) / 2;
        existingParam.range = {
          min: Math.min(existingParam.range.min, sourceParam.range.min),
          max: Math.max(existingParam.range.max, sourceParam.range.max),
        };
      } else {
        merged.parameters.push({ ...sourceParam });
      }
    }

    return merged;
  }

  private findPatterns(experiences: LearningExperience[]): PatternResult[] {
    const patterns: Map<string, number> = new Map();

    for (const exp of experiences) {
      const key = `${exp.action.strategy}:${exp.context.taskType}`;
      patterns.set(key, (patterns.get(key) || 0) + 1);
    }

    return Array.from(patterns.entries())
      .map(([key, frequency]) => ({
        description: key,
        frequency,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }

  private inferOptimalRange(
    param: string,
    value: number,
    success: boolean
  ): { min: number; max: number } | null {
    // Simplified - would use more sophisticated analysis
    return {
      min: success ? value * 0.8 : value * 0.5,
      max: success ? value * 1.2 : value * 0.9,
    };
  }

  private notifyListeners(event: string, data: unknown): void {
    for (const listener of this.listeners) {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Learning listener error:', error);
      }
    }
  }

  private generateId(): string {
    return `learn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Supporting interfaces and classes
interface StrategyRecommendation {
  strategyName: string;
  parameters: Record<string, unknown>;
  confidence: number;
  reasoning: string;
  alternatives: Array<{ name: string; confidence: number }>;
}

interface BatchLearningResult {
  totalExperiences: number;
  adaptations: AdaptationResult[];
  newKnowledge: KnowledgeItem[];
}

interface TransferResult {
  sourceAgentId: string;
  targetAgentId: string;
  transferredSkills: number;
  conflicts: TransferConflict[];
}

interface TransferConflict {
  skillName: string;
  resolution: 'merged' | 'skipped' | 'overwritten';
  details: string;
}

interface LearningInsight {
  type: 'success_pattern' | 'failure_pattern' | 'skill_improvement' | 'optimization';
  description: string;
  frequency: number;
  recommendation: string;
}

interface PatternResult {
  description: string;
  frequency: number;
}

type LearningListener = (event: string, data: unknown) => void;

interface KnowledgeItem {
  type: string;
  content: string;
  confidence: number;
}

class LearningKnowledgeBase {
  private knowledge: KnowledgeItem[] = [];

  async update(experiences: LearningExperience[]): Promise<void> {
    for (const exp of experiences) {
      for (const lesson of exp.lessons) {
        this.knowledge.push({
          type: lesson.category,
          content: lesson.description,
          confidence: lesson.confidence,
        });
      }
    }
  }

  extractNewKnowledge(experiences: LearningExperience[]): KnowledgeItem[] {
    return experiences.flatMap(exp =>
      exp.lessons.map(lesson => ({
        type: lesson.category,
        content: lesson.description,
        confidence: lesson.confidence,
      }))
    );
  }
}

// Singleton instance
let learningInstance: AgentLearningSystem | null = null;

export function getAgentLearningSystem(): AgentLearningSystem {
  if (!learningInstance) {
    learningInstance = new AgentLearningSystem();
  }
  return learningInstance;
}
