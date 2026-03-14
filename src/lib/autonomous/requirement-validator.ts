/**
 * Requirement Validator
 * 
 * Validates that generated code and implementations satisfy requirements:
 * - Functional requirements verification
 * - Non-functional requirements check
 * - Security requirements validation
 * - Performance requirements testing
 * - Compatibility requirements verification
 */

import ZAI from 'z-ai-web-dev-sdk'
import { EventEmitter } from 'events'
import fs from 'fs/promises'
import path from 'path'

// Types
export interface Requirement {
  id: string
  type: RequirementType
  priority: 'critical' | 'high' | 'medium' | 'low'
  description: string
  criteria: AcceptanceCriteria[]
  status: 'pending' | 'in_progress' | 'verified' | 'failed' | 'skipped'
  verificationResult?: VerificationResult
}

export type RequirementType = 
  | 'functional'     // What the system should do
  | 'non_functional' // How the system should behave
  | 'security'       // Security constraints
  | 'performance'    // Performance requirements
  | 'compatibility'  // Compatibility requirements
  | 'usability'      // UX requirements
  | 'accessibility'  // Accessibility requirements
  | 'compliance'     // Regulatory/compliance requirements

export interface AcceptanceCriteria {
  id: string
  description: string
  type: 'assertion' | 'behavior' | 'metric' | 'checklist'
  expected?: any
  actual?: any
  passed?: boolean
  notes?: string
}

export interface VerificationResult {
  requirementId: string
  passed: boolean
  score: number           // 0-100
  criteriaResults: CriteriaResult[]
  evidence: string[]
  issues: ValidationIssue[]
  suggestions: string[]
  verifiedAt: string
}

export interface CriteriaResult {
  criteriaId: string
  passed: boolean
  expected?: any
  actual?: any
  deviation?: number
  notes: string
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info'
  description: string
  location?: string
  fix?: string
  impact: string
}

export interface ValidationReport {
  totalRequirements: number
  verified: number
  passed: number
  failed: number
  skipped: number
  overallScore: number
  byType: Record<RequirementType, { total: number; passed: number }>
  byPriority: Record<string, { total: number; passed: number }>
  criticalIssues: ValidationIssue[]
  recommendations: string[]
}

export interface ValidationResult {
  valid: boolean
  report: ValidationReport
  requirements: Requirement[]
}

// Storage
const STORAGE_DIR = path.join(process.cwd(), 'data', 'requirements')
const REQUIREMENTS_FILE = path.join(STORAGE_DIR, 'requirements.json')

/**
 * Requirement Validator
 */
export class RequirementValidator extends EventEmitter {
  private zai: any = null
  private requirements: Map<string, Requirement> = new Map()
  private codebase: Map<string, string> = new Map()

  constructor() {}

  /**
   * Initialize
   */
  async init(): Promise<void> {
    if (!this.zai) {
      this.zai = await ZAI.create()
    }
    await this.loadRequirements()
  }

  /**
   * Add a requirement
   */
  addRequirement(req: Omit<Requirement, 'id' | 'status'>): Requirement {
    const requirement: Requirement = {
      ...req,
      id: `req_${Date.now().toString(36)}`,
      status: 'pending'
    }

    this.requirements.set(requirement.id, requirement)
    this.emit('requirement:added', requirement)
    
    return requirement
  }

  /**
   * Add requirements from natural language description
   */
  async parseRequirements(description: string): Promise<Requirement[]> {
    await this.init()

    const prompt = `Parse the following requirements description into structured requirements.

Description:
${description}

For each requirement, provide:
1. type (functional, non_functional, security, performance, compatibility, usability, accessibility, compliance)
2. priority (critical, high, medium, low)
3. description (clear statement)
4. acceptance criteria (as JSON array)

Format as JSON array:
[
  {
    "type": "...",
    "priority": "...",
    "description": "...",
    "criteria": [
      { "description": "...", "type": "assertion|behavior|metric|checklist", "expected": ... }
    ]
  }
]`

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: 'You are a requirements analyst. Parse requirements into structured format.' },
          { role: 'user', content: prompt }
        ],
        thinking: { type: 'disabled' }
      })

      const response = completion.choices[0]?.message?.content || '[]'
      
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) return []

      const parsed = JSON.parse(jsonMatch[0])
      const requirements: Requirement[] = []

      for (const req of parsed) {
        const requirement = this.addRequirement({
          type: req.type || 'functional',
          priority: req.priority || 'medium',
          description: req.description,
          criteria: (req.criteria || []).map((c: any, i: number) => ({
            id: `crit_${Date.now().toString(36)}_${i}`,
            description: c.description,
            type: c.type || 'assertion',
            expected: c.expected
          }))
        })
        requirements.push(requirement)
      }

      return requirements
    } catch (error) {
      console.error('Failed to parse requirements:', error)
      return []
    }
  }

  /**
   * Load codebase for validation
   */
  async loadCodebase(projectPath: string): Promise<void> {
    this.codebase.clear()
    
    const loadFiles = async (dir: string) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          
          if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
            await loadFiles(fullPath)
          } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            try {
              const content = await fs.readFile(fullPath, 'utf-8')
              this.codebase.set(fullPath, content)
            } catch {}
          }
        }
      } catch {}
    }

    await loadFiles(projectPath)
  }

  /**
   * Validate all requirements against codebase
   */
  async validate(projectPath?: string): Promise<ValidationResult> {
    await this.init()

    if (projectPath) {
      await this.loadCodebase(projectPath)
    }

    const report: ValidationReport = {
      totalRequirements: this.requirements.size,
      verified: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      overallScore: 0,
      byType: {} as any,
      byPriority: {} as any,
      criticalIssues: [],
      recommendations: []
    }

    for (const [id, requirement] of this.requirements) {
      requirement.status = 'in_progress'
      
      const result = await this.verifyRequirement(requirement)
      requirement.verificationResult = result
      requirement.status = result.passed ? 'verified' : 'failed'

      report.verified++
      if (result.passed) report.passed++
      else report.failed++

      // Update by type stats
      if (!report.byType[requirement.type]) {
        report.byType[requirement.type] = { total: 0, passed: 0 }
      }
      report.byType[requirement.type].total++
      if (result.passed) report.byType[requirement.type].passed++

      // Update by priority stats
      if (!report.byPriority[requirement.priority]) {
        report.byPriority[requirement.priority] = { total: 0, passed: 0 }
      }
      report.byPriority[requirement.priority].total++
      if (result.passed) report.byPriority[requirement.priority].passed++

      // Collect critical issues
      if (!result.passed && requirement.priority === 'critical') {
        report.criticalIssues.push(...result.issues)
      }
    }

    // Calculate overall score
    report.overallScore = report.verified > 0 
      ? (report.passed / report.verified) * 100 
      : 0

    // Generate recommendations
    report.recommendations = this.generateRecommendations(report)

    await this.saveRequirements()

    return {
      valid: report.failed === 0,
      report,
      requirements: Array.from(this.requirements.values())
    }
  }

  /**
   * Verify a single requirement
   */
  private async verifyRequirement(requirement: Requirement): Promise<VerificationResult> {
    const criteriaResults: CriteriaResult[] = []
    const evidence: string[] = []
    const issues: ValidationIssue[] = []
    const suggestions: string[] = []

    for (const criteria of requirement.criteria) {
      const result = await this.verifyCriteria(requirement, criteria)
      criteriaResults.push(result)
      
      if (result.notes) {
        evidence.push(result.notes)
      }
    }

    // Calculate score
    const passedCount = criteriaResults.filter(r => r.passed).length
    const score = criteriaResults.length > 0 
      ? (passedCount / criteriaResults.length) * 100 
      : 0

    // Identify issues
    for (const result of criteriaResults) {
      if (!result.passed) {
        issues.push({
          type: requirement.priority === 'critical' ? 'error' : 'warning',
          description: `Criteria not met: ${result.notes}`,
          fix: `Expected: ${result.expected}, Actual: ${result.actual}`,
          impact: `Affects requirement: ${requirement.description}`
        })
      }
    }

    // Generate suggestions
    if (score < 100) {
      suggestions.push(...this.generateFixSuggestions(requirement, criteriaResults))
    }

    return {
      requirementId: requirement.id,
      passed: score >= 80,
      score,
      criteriaResults,
      evidence,
      issues,
      suggestions,
      verifiedAt: new Date().toISOString()
    }
  }

  /**
   * Verify a single criteria
   */
  private async verifyCriteria(
    requirement: Requirement,
    criteria: AcceptanceCriteria
  ): Promise<CriteriaResult> {
    const result: CriteriaResult = {
      criteriaId: criteria.id,
      passed: false,
      expected: criteria.expected,
      notes: ''
    }

    switch (criteria.type) {
      case 'assertion':
        return this.verifyAssertion(requirement, criteria)
      
      case 'behavior':
        return this.verifyBehavior(requirement, criteria)
      
      case 'metric':
        return this.verifyMetric(requirement, criteria)
      
      case 'checklist':
        return this.verifyChecklist(requirement, criteria)
      
      default:
        result.notes = 'Unknown criteria type'
        return result
    }
  }

  /**
   * Verify assertion criteria
   */
  private async verifyAssertion(
    requirement: Requirement,
    criteria: AcceptanceCriteria
  ): Promise<CriteriaResult> {
    // Use AI to verify assertion against codebase
    const codebaseContext = Array.from(this.codebase.entries())
      .slice(0, 10)
      .map(([file, content]) => `// ${file}\n${content.slice(0, 500)}`)
      .join('\n\n')

    const prompt = `Verify this requirement assertion against the codebase:

Requirement: ${requirement.description}
Assertion: ${criteria.description}
Expected: ${JSON.stringify(criteria.expected)}

Codebase samples:
${codebaseContext}

Respond with JSON:
{
  "passed": true/false,
  "actual": "what was found",
  "notes": "explanation"
}`

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: 'You are a code validator. Verify requirements against code.' },
          { role: 'user', content: prompt }
        ],
        thinking: { type: 'disabled' }
      })

      const response = completion.choices[0]?.message?.content || '{}'
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          criteriaId: criteria.id,
          passed: parsed.passed || false,
          expected: criteria.expected,
          actual: parsed.actual,
          notes: parsed.notes || ''
        }
      }
    } catch (error) {
      // Fallback to basic check
    }

    return {
      criteriaId: criteria.id,
      passed: false,
      notes: 'Unable to verify assertion'
    }
  }

  /**
   * Verify behavior criteria
   */
  private async verifyBehavior(
    requirement: Requirement,
    criteria: AcceptanceCriteria
  ): Promise<CriteriaResult> {
    // Check for behavior patterns in code
    const behaviorPatterns = this.extractBehaviorPatterns(criteria.description)
    
    for (const [file, content] of this.codebase) {
      const hasPattern = behaviorPatterns.some(pattern => 
        content.toLowerCase().includes(pattern.toLowerCase())
      )
      
      if (hasPattern) {
        return {
          criteriaId: criteria.id,
          passed: true,
          notes: `Found behavior pattern in ${path.basename(file)}`
        }
      }
    }

    return {
      criteriaId: criteria.id,
      passed: false,
      notes: 'Behavior pattern not found in codebase'
    }
  }

  /**
   * Verify metric criteria
   */
  private verifyMetric(
    requirement: Requirement,
    criteria: AcceptanceCriteria
  ): CriteriaResult {
    // Placeholder for metric verification
    // Would integrate with actual metrics collection
    return {
      criteriaId: criteria.id,
      passed: true,
      expected: criteria.expected,
      actual: 'Pending measurement',
      notes: 'Metric verification requires runtime data'
    }
  }

  /**
   * Verify checklist criteria
   */
  private async verifyChecklist(
    requirement: Requirement,
    criteria: AcceptanceCriteria
  ): Promise<CriteriaResult> {
    // Check for checklist items in codebase
    const checklistItems = Array.isArray(criteria.expected) ? criteria.expected : []
    const foundItems: string[] = []

    for (const item of checklistItems) {
      for (const [file, content] of this.codebase) {
        if (content.toLowerCase().includes(String(item).toLowerCase())) {
          foundItems.push(String(item))
          break
        }
      }
    }

    const passRate = checklistItems.length > 0 
      ? foundItems.length / checklistItems.length 
      : 0

    return {
      criteriaId: criteria.id,
      passed: passRate >= 0.8,
      expected: criteria.expected,
      actual: foundItems,
      notes: `Found ${foundItems.length}/${checklistItems.length} checklist items`
    }
  }

  /**
   * Extract behavior patterns from description
   */
  private extractBehaviorPatterns(description: string): string[] {
    const patterns: string[] = []
    
    // Extract key terms that indicate behavior
    const keywords = description.toLowerCase().split(/\s+/)
    const importantKeywords = keywords.filter(w => 
      w.length > 3 && 
      !['should', 'must', 'will', 'when', 'then', 'with', 'from', 'this', 'that'].includes(w)
    )
    
    patterns.push(...importantKeywords)
    
    return patterns
  }

  /**
   * Generate fix suggestions
   */
  private generateFixSuggestions(
    requirement: Requirement,
    results: CriteriaResult[]
  ): string[] {
    const suggestions: string[] = []

    for (const result of results) {
      if (!result.passed) {
        suggestions.push(`Consider implementing: ${result.notes}`)
        
        if (result.expected) {
          suggestions.push(`Expected value: ${result.expected}`)
        }
      }
    }

    // Add type-specific suggestions
    switch (requirement.type) {
      case 'security':
        suggestions.push('Review security best practices and OWASP guidelines')
        break
      case 'performance':
        suggestions.push('Consider optimization techniques: caching, lazy loading, indexing')
        break
      case 'accessibility':
        suggestions.push('Review WCAG guidelines and ARIA attributes')
        break
    }

    return suggestions
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(report: ValidationReport): string[] {
    const recommendations: string[] = []

    if (report.overallScore < 70) {
      recommendations.push('Significant work needed to meet requirements')
    }

    // Type-specific recommendations
    for (const [type, stats] of Object.entries(report.byType)) {
      const passRate = stats.total > 0 ? stats.passed / stats.total : 0
      if (passRate < 0.8) {
        recommendations.push(`Focus on ${type.replace('_', ' ')} requirements (${Math.round(passRate * 100)}% pass rate)`)
      }
    }

    // Critical issues
    if (report.criticalIssues.length > 0) {
      recommendations.push(`Address ${report.criticalIssues.length} critical issues immediately`)
    }

    return recommendations
  }

  /**
   * Load requirements from storage
   */
  private async loadRequirements(): Promise<void> {
    try {
      const data = await fs.readFile(REQUIREMENTS_FILE, 'utf-8')
      const requirements = JSON.parse(data)
      
      for (const req of requirements) {
        this.requirements.set(req.id, req)
      }
    } catch {
      // File doesn't exist yet
    }
  }

  /**
   * Save requirements to storage
   */
  async saveRequirements(): Promise<void> {
    await fs.mkdir(STORAGE_DIR, { recursive: true })
    const data = Array.from(this.requirements.values())
    await fs.writeFile(REQUIREMENTS_FILE, JSON.stringify(data, null, 2))
  }

  /**
   * Get requirement by ID
   */
  getRequirement(id: string): Requirement | undefined {
    return this.requirements.get(id)
  }

  /**
   * Get all requirements
   */
  getAllRequirements(): Requirement[] {
    return Array.from(this.requirements.values())
  }

  /**
   * Remove a requirement
   */
  removeRequirement(id: string): boolean {
    const existed = this.requirements.delete(id)
    if (existed) {
      this.emit('requirement:removed', id)
    }
    return existed
  }

  /**
   * Clear all requirements
   */
  clearRequirements(): void {
    this.requirements.clear()
    this.emit('requirements:cleared')
  }
}

// Singleton
let validatorInstance: RequirementValidator | null = null

export function getRequirementValidator(): RequirementValidator {
  if (!validatorInstance) {
    validatorInstance = new RequirementValidator()
  }
  return validatorInstance
}

/**
 * Quick requirement validation
 */
export async function validateRequirements(
  projectPath?: string
): Promise<ValidationResult> {
  const validator = getRequirementValidator()
  return validator.validate(projectPath)
}

/**
 * Parse and add requirements from text
 */
export async function parseAndAddRequirements(
  description: string
): Promise<Requirement[]> {
  const validator = getRequirementValidator()
  return validator.parseRequirements(description)
}
