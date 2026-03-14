/**
 * Skill Improver
 * 
 * Continuously improves agent skills through:
 * - Performance tracking
 * - Skill gap identification
 * - Targeted practice
 * - Knowledge transfer
 * - Adaptive learning
 * 
 * Features:
 * - Track agent performance over time
 * - Identify skill gaps
 * - Generate practice exercises
 * - Transfer knowledge between agents
 * - Adapt to changing requirements
 */

import ZAI from 'z-ai-web-dev-sdk'
import { EventEmitter } from 'events'

// Types
export interface AgentSkill {
  id: string
  name: string
  category: SkillCategory
  level: SkillLevel
  score: number // 0-100
  lastAssessed: string
  improvementHistory: SkillImprovement[]
  practiceCount: number
  successRate: number
}

export type SkillCategory = 
  | 'code_generation'
  | 'debugging'
  | 'testing'
  | 'architecture'
  | 'documentation'
  | 'security'
  | 'optimization'
  | 'communication'
  | 'planning'
  | 'analysis'

export type SkillLevel = 
  | 'novice'      // 0-20
  | 'beginner'    // 21-40
  | 'intermediate' // 41-60
  | 'advanced'    // 61-80
  | 'expert'      // 81-100

export interface SkillImprovement {
  timestamp: string
  previousScore: number
  newScore: number
  method: ImprovementMethod
  duration: number
  exercise?: PracticeExercise
}

export type ImprovementMethod = 
  | 'practice'
  | 'feedback'
  | 'knowledge_transfer'
  | 'self_study'
  | 'collaboration'

export interface PracticeExercise {
  id: string
  skillId: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  description: string
  input: any
  expectedOutput: any
  hints: string[]
  timeLimit: number
  createdAt: string
}

export interface PracticeResult {
  exerciseId: string
  agentId: string
  output: any
  correct: boolean
  score: number
  timeSpent: number
  feedback: string[]
  skillGains: SkillGain[]
}

export interface SkillGain {
  skillId: string
  gain: number
  reason: string
}

export interface SkillGap {
  skillId: string
  currentScore: number
  requiredScore: number
  gap: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
}

export interface LearningPlan {
  agentId: string
  skills: SkillGoal[]
  exercises: PracticeExercise[]
  estimatedTime: number
  createdAt: string
}

export interface SkillGoal {
  skillId: string
  currentScore: number
  targetScore: number
  exercises: string[]
  deadline?: string
}

export interface KnowledgeTransfer {
  fromAgentId: string
  toAgentId: string
  skillId: string
  method: 'direct' | 'documentation' | 'example'
  content: any
  success: boolean
  timestamp: string
}

export interface AgentSkillProfile {
  agentId: string
  agentType: string
  skills: Map<string, AgentSkill>
  totalSkillScore: number
  strongestSkill: string
  weakestSkill: string
  learningVelocity: number
  lastUpdated: string
}

/**
 * Skill Improver
 * 
 * Main class for improving agent skills
 */
export class SkillImprover extends EventEmitter {
  private zai: any = null
  private profiles: Map<string, AgentSkillProfile> = new Map()
  private exercises: Map<string, PracticeExercise> = new Map()
  private skillTemplates: Map<string, SkillTemplate> = new Map()
  private improvementHistory: SkillImprovement[] = []

  constructor() {
    super()
    this.initializeSkillTemplates()
  }

  /**
   * Initialize the skill improver
   */
  async initialize(): Promise<void> {
    this.zai = await ZAI.create()
  }

  /**
   * Assess an agent's current skills
   */
  async assessAgent(agentId: string, agentType: string): Promise<AgentSkillProfile> {
    let profile = this.profiles.get(agentId)
    
    if (!profile) {
      // Create new profile
      profile = await this.createProfile(agentId, agentType)
      this.profiles.set(agentId, profile)
    }

    // Re-assess skills
    for (const [skillId, skill] of profile.skills) {
      const template = this.skillTemplates.get(skillId)
      if (template) {
        const assessment = await this.assessSkill(skill, template)
        skill.score = assessment.score
        skill.level = this.scoreToLevel(assessment.score)
        skill.lastAssessed = new Date().toISOString()
      }
    }

    // Update profile stats
    this.updateProfileStats(profile)
    this.emit('agent_assessed', { profile })

    return profile
  }

  /**
   * Identify skill gaps
   */
  identifyGaps(
    profile: AgentSkillProfile,
    requirements: { skillId: string; minScore: number }[]
  ): SkillGap[] {
    const gaps: SkillGap[] = []

    for (const req of requirements) {
      const skill = profile.skills.get(req.skillId)
      const currentScore = skill?.score || 0
      
      if (currentScore < req.minScore) {
        gaps.push({
          skillId: req.skillId,
          currentScore,
          requiredScore: req.minScore,
          gap: req.minScore - currentScore,
          priority: this.calculateGapPriority(currentScore, req.minScore),
          recommendation: this.generateRecommendation(req.skillId, currentScore, req.minScore)
        })
      }
    }

    // Sort by priority and gap size
    return gaps.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }

  /**
   * Create a learning plan
   */
  async createLearningPlan(
    agentId: string,
    gaps: SkillGap[]
  ): Promise<LearningPlan> {
    const profile = this.profiles.get(agentId)
    if (!profile) {
      throw new Error(`Agent not found: ${agentId}`)
    }

    const goals: SkillGoal[] = []
    const exercises: PracticeExercise[] = []

    for (const gap of gaps) {
      const skill = profile.skills.get(gap.skillId)
      if (!skill) continue

      // Generate exercises for this skill
      const skillExercises = await this.generateExercises(gap.skillId, skill.level, 3)
      exercises.push(...skillExercises)

      goals.push({
        skillId: gap.skillId,
        currentScore: gap.currentScore,
        targetScore: gap.requiredScore,
        exercises: skillExercises.map(e => e.id),
        deadline: this.estimateDeadline(gap, profile.learningVelocity)
      })
    }

    const plan: LearningPlan = {
      agentId,
      skills: goals,
      exercises,
      estimatedTime: this.calculateTotalTime(exercises),
      createdAt: new Date().toISOString()
    }

    this.emit('learning_plan_created', { plan })
    return plan
  }

  /**
   * Run a practice exercise
   */
  async practice(
    agentId: string,
    exerciseId: string
  ): Promise<PracticeResult> {
    const exercise = this.exercises.get(exerciseId)
    const profile = this.profiles.get(agentId)
    
    if (!exercise || !profile) {
      throw new Error('Exercise or agent not found')
    }

    const skill = profile.skills.get(exercise.skillId)
    if (!skill) {
      throw new Error('Skill not found')
    }

    const startTime = Date.now()

    // Simulate or run actual practice
    const output = await this.runExercise(exercise, profile)
    
    const endTime = Date.now()
    const timeSpent = endTime - startTime

    // Evaluate result
    const evaluation = await this.evaluateResult(exercise, output)
    
    // Calculate skill gains
    const skillGains = this.calculateSkillGains(skill, evaluation.score, exercise.difficulty)

    const result: PracticeResult = {
      exerciseId,
      agentId,
      output,
      correct: evaluation.correct,
      score: evaluation.score,
      timeSpent,
      feedback: evaluation.feedback,
      skillGains
    }

    // Apply skill gains
    for (const gain of skillGains) {
      const s = profile.skills.get(gain.skillId)
      if (s) {
        const previousScore = s.score
        s.score = Math.min(100, s.score + gain.gain)
        s.level = this.scoreToLevel(s.score)
        s.practiceCount++
        s.successRate = (s.successRate * (s.practiceCount - 1) + (evaluation.correct ? 1 : 0)) / s.practiceCount

        // Record improvement
        const improvement: SkillImprovement = {
          timestamp: new Date().toISOString(),
          previousScore,
          newScore: s.score,
          method: 'practice',
          duration: timeSpent,
          exercise
        }
        s.improvementHistory.push(improvement)
        this.improvementHistory.push(improvement)
      }
    }

    this.updateProfileStats(profile)
    this.emit('practice_completed', { result })

    return result
  }

  /**
   * Transfer knowledge between agents
   */
  async transferKnowledge(
    fromAgentId: string,
    toAgentId: string,
    skillId: string
  ): Promise<KnowledgeTransfer> {
    const fromProfile = this.profiles.get(fromAgentId)
    const toProfile = this.profiles.get(toAgentId)
    
    if (!fromProfile || !toProfile) {
      throw new Error('Agent not found')
    }

    const fromSkill = fromProfile.skills.get(skillId)
    const toSkill = toProfile.skills.get(skillId)
    
    if (!fromSkill || !toSkill) {
      throw new Error('Skill not found')
    }

    // Only transfer if source is more skilled
    if (fromSkill.score <= toSkill.score) {
      return {
        fromAgentId,
        toAgentId,
        skillId,
        method: 'direct',
        content: {},
        success: false,
        timestamp: new Date().toISOString()
      }
    }

    // Generate transfer content
    const content = await this.generateTransferContent(fromSkill, toSkill)

    // Apply knowledge transfer
    const skillGain = (fromSkill.score - toSkill.score) * 0.3 // 30% of gap
    toSkill.score = Math.min(100, toSkill.score + skillGain)
    toSkill.level = this.scoreToLevel(toSkill.score)

    const transfer: KnowledgeTransfer = {
      fromAgentId,
      toAgentId,
      skillId,
      method: 'direct',
      content,
      success: true,
      timestamp: new Date().toISOString()
    }

    this.emit('knowledge_transferred', { transfer, skillGain })
    return transfer
  }

  /**
   * Get skill recommendations for an agent
   */
  getRecommendations(agentId: string): {
    focus: string[]
    practice: PracticeExercise[]
    transfer: { fromAgentId: string; skillId: string }[]
  } {
    const profile = this.profiles.get(agentId)
    if (!profile) {
      throw new Error('Agent not found')
    }

    // Find weakest skills
    const sortedSkills = Array.from(profile.skills.values())
      .sort((a, b) => a.score - b.score)
    
    const focus = sortedSkills.slice(0, 3).map(s => s.name)

    // Generate practice exercises
    const practice = sortedSkills.slice(0, 2).flatMap(s => 
      this.generateExercisesSync(s.id, s.level, 2)
    )

    // Find transfer opportunities
    const transfer: { fromAgentId: string; skillId: string }[] = []
    for (const [otherId, otherProfile] of this.profiles) {
      if (otherId === agentId) continue
      
      for (const [skillId, otherSkill] of otherProfile.skills) {
        const mySkill = profile.skills.get(skillId)
        if (mySkill && otherSkill.score > mySkill.score + 20) {
          transfer.push({ fromAgentId: otherId, skillId })
        }
      }
    }

    return { focus, practice, transfer }
  }

  // Private helper methods

  private async createProfile(agentId: string, agentType: string): Promise<AgentSkillProfile> {
    const skills = new Map<string, AgentSkill>()

    for (const [skillId, template] of this.skillTemplates) {
      const skill: AgentSkill = {
        id: skillId,
        name: template.name,
        category: template.category,
        level: 'novice',
        score: template.baseScore,
        lastAssessed: new Date().toISOString(),
        improvementHistory: [],
        practiceCount: 0,
        successRate: 0
      }
      skills.set(skillId, skill)
    }

    const profile: AgentSkillProfile = {
      agentId,
      agentType,
      skills,
      totalSkillScore: 0,
      strongestSkill: '',
      weakestSkill: '',
      learningVelocity: 1,
      lastUpdated: new Date().toISOString()
    }

    this.updateProfileStats(profile)
    return profile
  }

  private async assessSkill(skill: AgentSkill, template: SkillTemplate): Promise<{ score: number }> {
    // In production, would run actual assessment
    const baseVariance = 10
    const variance = (Math.random() - 0.5) * baseVariance
    
    return {
      score: Math.max(0, Math.min(100, skill.score + variance))
    }
  }

  private scoreToLevel(score: number): SkillLevel {
    if (score <= 20) return 'novice'
    if (score <= 40) return 'beginner'
    if (score <= 60) return 'intermediate'
    if (score <= 80) return 'advanced'
    return 'expert'
  }

  private updateProfileStats(profile: AgentSkillProfile): void {
    const skills = Array.from(profile.skills.values())
    
    profile.totalSkillScore = skills.reduce((sum, s) => sum + s.score, 0) / skills.length
    
    const sorted = [...skills].sort((a, b) => a.score - b.score)
    profile.weakestSkill = sorted[0]?.id || ''
    profile.strongestSkill = sorted[sorted.length - 1]?.id || ''
    
    // Calculate learning velocity
    const totalImprovement = skills.reduce((sum, s) => {
      if (s.improvementHistory.length === 0) return sum
      const lastImprovement = s.improvementHistory[s.improvementHistory.length - 1]
      return sum + (lastImprovement.newScore - lastImprovement.previousScore)
    }, 0)
    profile.learningVelocity = totalImprovement / Math.max(skills.length, 1)
    
    profile.lastUpdated = new Date().toISOString()
  }

  private calculateGapPriority(current: number, required: number): 'low' | 'medium' | 'high' | 'critical' {
    const gap = required - current
    if (gap <= 10) return 'low'
    if (gap <= 25) return 'medium'
    if (gap <= 40) return 'high'
    return 'critical'
  }

  private generateRecommendation(skillId: string, current: number, target: number): string {
    const gap = target - current
    
    if (gap <= 10) {
      return `Minor improvement needed. Practice recommended.`
    } else if (gap <= 25) {
      return `Focus on practical exercises and seek feedback.`
    } else if (gap <= 40) {
      return `Significant skill gap. Intensive training recommended.`
    } else {
      return `Critical skill gap. Consider knowledge transfer from expert agent.`
    }
  }

  private async generateExercises(
    skillId: string,
    level: SkillLevel,
    count: number
  ): Promise<PracticeExercise[]> {
    const template = this.skillTemplates.get(skillId)
    if (!template) return []

    const exercises: PracticeExercise[] = []
    const difficulty = this.levelToDifficulty(level)

    for (let i = 0; i < count; i++) {
      const exercise: PracticeExercise = {
        id: `ex-${Date.now().toString(36)}-${i}`,
        skillId,
        difficulty,
        description: `Practice exercise for ${template.name}`,
        input: {},
        expectedOutput: {},
        hints: [`Focus on ${template.keyConcepts[i % template.keyConcepts.length]}`],
        timeLimit: 300000,
        createdAt: new Date().toISOString()
      }
      
      this.exercises.set(exercise.id, exercise)
      exercises.push(exercise)
    }

    return exercises
  }

  private generateExercisesSync(skillId: string, level: SkillLevel, count: number): PracticeExercise[] {
    // Sync version for recommendations
    const exercises: PracticeExercise[] = []
    for (let i = 0; i < count; i++) {
      exercises.push({
        id: `ex-rec-${Date.now().toString(36)}-${i}`,
        skillId,
        difficulty: this.levelToDifficulty(level),
        description: `Recommended practice`,
        input: {},
        expectedOutput: {},
        hints: [],
        timeLimit: 300000,
        createdAt: new Date().toISOString()
      })
    }
    return exercises
  }

  private levelToDifficulty(level: SkillLevel): 'easy' | 'medium' | 'hard' | 'expert' {
    switch (level) {
      case 'novice':
      case 'beginner':
        return 'easy'
      case 'intermediate':
        return 'medium'
      case 'advanced':
        return 'hard'
      case 'expert':
        return 'expert'
    }
  }

  private async runExercise(exercise: PracticeExercise, profile: AgentSkillProfile): Promise<any> {
    // In production, would run actual exercise
    return { completed: true, timestamp: Date.now() }
  }

  private async evaluateResult(
    exercise: PracticeExercise,
    output: any
  ): Promise<{ correct: boolean; score: number; feedback: string[] }> {
    // In production, would do actual evaluation
    const score = 0.5 + Math.random() * 0.5
    
    return {
      correct: score > 0.7,
      score,
      feedback: score > 0.7 ? ['Well done!'] : ['Keep practicing']
    }
  }

  private calculateSkillGains(
    skill: AgentSkill,
    score: number,
    difficulty: string
  ): SkillGain[] {
    const difficultyMultiplier = { easy: 1, medium: 2, hard: 3, expert: 4 }
    const baseGain = score * difficultyMultiplier[difficulty as keyof typeof difficultyMultiplier]
    
    // Diminishing returns at higher levels
    const levelMultiplier = Math.max(0.1, 1 - skill.score / 200)
    const gain = baseGain * levelMultiplier

    return [{
      skillId: skill.id,
      gain: Math.round(gain * 10) / 10,
      reason: `Practice exercise completed with score ${score.toFixed(2)}`
    }]
  }

  private estimateDeadline(gap: SkillGap, velocity: number): string {
    if (velocity <= 0) velocity = 1
    
    const daysNeeded = Math.ceil(gap.gap / velocity)
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + daysNeeded)
    
    return deadline.toISOString()
  }

  private calculateTotalTime(exercises: PracticeExercise[]): number {
    return exercises.reduce((sum, e) => sum + e.timeLimit, 0)
  }

  private async generateTransferContent(fromSkill: AgentSkill, toSkill: AgentSkill): Promise<any> {
    return {
      keyInsights: fromSkill.improvementHistory.slice(-5).map(h => ({
        method: h.method,
        improvement: h.newScore - h.previousScore
      })),
      recommendations: [`Focus on ${fromSkill.name} fundamentals`]
    }
  }

  private initializeSkillTemplates(): void {
    const templates: SkillTemplate[] = [
      {
        id: 'code_generation',
        name: 'Code Generation',
        category: 'code_generation',
        baseScore: 30,
        keyConcepts: ['syntax', 'patterns', 'best practices', 'optimization']
      },
      {
        id: 'debugging',
        name: 'Debugging',
        category: 'debugging',
        baseScore: 25,
        keyConcepts: ['error analysis', 'root cause', 'fix strategies', 'prevention']
      },
      {
        id: 'testing',
        name: 'Testing',
        category: 'testing',
        baseScore: 20,
        keyConcepts: ['unit tests', 'integration', 'coverage', 'edge cases']
      },
      {
        id: 'architecture',
        name: 'Architecture Design',
        category: 'architecture',
        baseScore: 15,
        keyConcepts: ['patterns', 'scalability', 'trade-offs', 'documentation']
      },
      {
        id: 'documentation',
        name: 'Documentation',
        category: 'documentation',
        baseScore: 35,
        keyConcepts: ['clarity', 'completeness', 'examples', 'maintenance']
      },
      {
        id: 'security',
        name: 'Security',
        category: 'security',
        baseScore: 20,
        keyConcepts: ['vulnerabilities', 'best practices', 'auditing', 'compliance']
      },
      {
        id: 'optimization',
        name: 'Performance Optimization',
        category: 'optimization',
        baseScore: 15,
        keyConcepts: ['profiling', 'algorithms', 'caching', 'monitoring']
      },
      {
        id: 'communication',
        name: 'Communication',
        category: 'communication',
        baseScore: 40,
        keyConcepts: ['clarity', 'context', 'collaboration', 'feedback']
      },
      {
        id: 'planning',
        name: 'Planning',
        category: 'planning',
        baseScore: 30,
        keyConcepts: ['estimation', 'prioritization', 'dependencies', 'risk management']
      },
      {
        id: 'analysis',
        name: 'Analysis',
        category: 'analysis',
        baseScore: 35,
        keyConcepts: ['data interpretation', 'problem decomposition', 'insights', 'recommendations']
      }
    ]

    for (const template of templates) {
      this.skillTemplates.set(template.id, template)
    }
  }

  /**
   * Get profile by agent ID
   */
  getProfile(agentId: string): AgentSkillProfile | undefined {
    return this.profiles.get(agentId)
  }

  /**
   * Get all profiles
   */
  getAllProfiles(): AgentSkillProfile[] {
    return Array.from(this.profiles.values())
  }

  /**
   * Get improvement history
   */
  getImprovementHistory(skillId?: string): SkillImprovement[] {
    if (skillId) {
      return this.improvementHistory.filter(h => h.exercise?.skillId === skillId)
    }
    return [...this.improvementHistory]
  }
}

interface SkillTemplate {
  id: string
  name: string
  category: SkillCategory
  baseScore: number
  keyConcepts: string[]
}

// Singleton instance
let improverInstance: SkillImprover | null = null

export function getSkillImprover(): SkillImprover {
  if (!improverInstance) {
    improverInstance = new SkillImprover()
  }
  return improverInstance
}

export async function assessAgent(agentId: string, agentType: string): Promise<AgentSkillProfile> {
  const improver = getSkillImprover()
  if (!improver['zai']) {
    await improver.initialize()
  }
  return improver.assessAgent(agentId, agentType)
}
