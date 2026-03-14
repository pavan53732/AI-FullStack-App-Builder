/**
 * Dependency Compatibility Matrix
 * 
 * Implements mechanisms #461, #463-471:
 * - Version compatibility checking
 * - Container/Docker compatibility validation
 * - Runtime compatibility (Node/Bun versions)
 * - Architecture compatibility (x64/ARM)
 * - API breaking changes detection
 * - Semantic version validation
 * - Deprecation detection
 * - Migration assistance
 * - Auto-upgrade logic
 * 
 * Features:
 * - Comprehensive compatibility matrix
 * - Breaking change detection
 * - Migration path recommendations
 * - Automated upgrade strategies
 */

import { EventEmitter } from 'events'
import fs from 'fs/promises'
import path from 'path'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SemanticVersion {
  major: number
  minor: number
  patch: number
  prerelease: string | null
  build: string | null
  raw: string
}

export interface VersionRange {
  min: SemanticVersion | null
  max: SemanticVersion | null
  operator: '>' | '>=' | '<' | '<=' | '=' | '^' | '~' | '*'
}

export interface CompatibilityMatrix {
  id: string
  name: string
  version: string
  entries: CompatibilityEntry[]
  runtimeRequirements: RuntimeRequirement[]
  architectureSupport: ArchitectureSupport[]
  containerCompatibility: ContainerCompatibility[]
  apiVersionMatrix: ApiVersionMatrix[]
  lastUpdated: string
}

export interface CompatibilityEntry {
  packageId: string
  packageName: string
  versionRange: string
  compatibleVersions: VersionCompatibility[]
  peerDependencies: PeerDependencyCompatibility[]
  conflicts: ConflictInfo[]
  status: 'compatible' | 'partial' | 'incompatible' | 'unknown'
}

export interface VersionCompatibility {
  version: string
  status: 'full' | 'partial' | 'deprecated' | 'incompatible'
  features: string[]
  limitations: string[]
  breakingChanges: string[]
  migrationRequired: boolean
  migrationPath?: string
}

export interface PeerDependencyCompatibility {
  name: string
  supportedRanges: string[]
  incompatibleRanges: string[]
  recommendations: string[]
}

export interface ConflictInfo {
  conflictingPackage: string
  reason: string
  resolution: string
  severity: 'critical' | 'high' | 'medium' | 'low'
}

export interface RuntimeRequirement {
  runtime: 'node' | 'bun' | 'deno' | 'browser'
  minVersion: string
  maxVersion?: string
  recommendedVersion: string
  features: RuntimeFeature[]
  deprecatedFeatures: string[]
}

export interface RuntimeFeature {
  name: string
  minVersion: string
  description: string
  required: boolean
}

export interface ArchitectureSupport {
  architecture: 'x64' | 'arm64' | 'arm' | 'ia32' | 'universal'
  platforms: ('linux' | 'darwin' | 'win32' | 'freebsd')[]
  nativeModules: string[]
  limitations: string[]
  status: 'full' | 'partial' | 'none'
}

export interface ContainerCompatibility {
  baseImage: string
  tag: string
  runtime: string
  architecture: string
  size: number
  verified: boolean
  issues: string[]
  optimizations: string[]
}

export interface ApiVersionMatrix {
  apiName: string
  versions: ApiVersionInfo[]
  currentVersion: string
  deprecatedVersions: string[]
  breakingChanges: ApiBreakingChange[]
}

export interface ApiVersionInfo {
  version: string
  releaseDate: string
  status: 'stable' | 'beta' | 'alpha' | 'deprecated' | 'removed'
  changes: string[]
}

export interface ApiBreakingChange {
  fromVersion: string
  toVersion: string
  type: 'removed' | 'changed' | 'moved' | 'renamed'
  description: string
  affectedApis: string[]
  migration: string
  severity: 'critical' | 'high' | 'medium' | 'low'
}

export interface DeprecationInfo {
  package: string
  version: string
  deprecatedAt: string
  sunsetDate?: string
  reason: string
  replacement?: string
  migrationGuide?: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  affectsSecurity: boolean
}

export interface MigrationPath {
  id: string
  name: string
  fromVersion: string
  toVersion: string
  steps: MigrationStep[]
  breakingChanges: string[]
  estimatedEffort: 'low' | 'medium' | 'high' | 'critical'
  automated: boolean
  prerequisites: string[]
  postMigrationSteps: string[]
}

export interface MigrationStep {
  order: number
  type: 'install' | 'update' | 'remove' | 'config' | 'code' | 'test'
  description: string
  command?: string
  codeChanges?: CodeChangeInstruction[]
  automated: boolean
  estimatedTime: number // minutes
  riskLevel: 'low' | 'medium' | 'high'
}

export interface CodeChangeInstruction {
  file: string
  search: string
  replace: string
  description: string
}

export interface CompatibilityCheck {
  id: string
  timestamp: string
  context: CompatibilityContext
  results: CompatibilityCheckResult[]
  summary: CompatibilitySummary
  recommendations: Recommendation[]
}

export interface CompatibilityContext {
  projectPath: string
  packageJson: Record<string, any>
  lockFile: Record<string, any> | null
  runtime: {
    name: string
    version: string
  }
  architecture: string
  platform: string
  containerInfo?: ContainerInfo
}

export interface ContainerInfo {
  baseImage?: string
  dockerVersion?: string
  containerRuntime?: string
}

export interface CompatibilityCheckResult {
  type: 'version' | 'runtime' | 'architecture' | 'container' | 'api' | 'deprecation' | 'peer' | 'conflict'
  packageName: string
  status: 'pass' | 'warning' | 'fail' | 'skip'
  message: string
  details: Record<string, any>
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  fixAvailable: boolean
  fixDescription?: string
}

export interface CompatibilitySummary {
  totalChecks: number
  passed: number
  warnings: number
  failed: number
  skipped: number
  overallStatus: 'healthy' | 'degraded' | 'critical' | 'unknown'
  score: number // 0-100
}

export interface Recommendation {
  type: 'update' | 'migrate' | 'replace' | 'remove' | 'configure' | 'investigate'
  packageName: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  description: string
  action: string
  impact: string
  effort: 'low' | 'medium' | 'high'
  automated: boolean
}

export interface UpgradePlan {
  id: string
  name: string
  targetVersion: string
  currentVersion: string
  steps: UpgradeStep[]
  risks: UpgradeRisk[]
  rollbackPlan: string
  estimatedTime: number // minutes
  automated: boolean
}

export interface UpgradeStep {
  order: number
  action: string
  command?: string
  expectedOutcome: string
  validation: string
  rollback?: string
}

export interface UpgradeRisk {
  description: string
  likelihood: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  mitigation: string
}

// ============================================================================
// SEMANTIC VERSION UTILITIES
// ============================================================================

export class SemVerParser {
  /**
   * Parse a semantic version string
   */
  static parse(version: string): SemanticVersion | null {
    const cleanVersion = version.replace(/^[\^~>=<]+/, '').trim()
    
    const match = cleanVersion.match(
      /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/
    )
    
    if (!match) return null
    
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4] || null,
      build: match[5] || null,
      raw: cleanVersion
    }
  }

  /**
   * Compare two semantic versions
   */
  static compare(a: SemanticVersion, b: SemanticVersion): number {
    if (a.major !== b.major) return a.major - b.major
    if (a.minor !== b.minor) return a.minor - b.minor
    if (a.patch !== b.patch) return a.patch - b.patch
    
    // Handle prerelease
    if (a.prerelease && !b.prerelease) return -1
    if (!a.prerelease && b.prerelease) return 1
    if (a.prerelease && b.prerelease) {
      return a.prerelease.localeCompare(b.prerelease)
    }
    
    return 0
  }

  /**
   * Check if version satisfies a range
   */
  static satisfies(version: SemanticVersion, range: string): boolean {
    const rangePattern = range.trim()
    
    // Handle special cases
    if (rangePattern === '*' || rangePattern === 'latest') return true
    if (rangePattern === 'x' || rangePattern === 'x.x.x') return true
    
    // Extract operator and version
    const operatorMatch = rangePattern.match(/^([~^]|>=?|<=?)?(.+)$/)
    if (!operatorMatch) return false
    
    const operator = operatorMatch[1] || '='
    const rangeVersion = this.parse(operatorMatch[2])
    if (!rangeVersion) return false
    
    switch (operator) {
      case '=':
        return this.compare(version, rangeVersion) === 0
      case '>':
        return this.compare(version, rangeVersion) > 0
      case '>=':
        return this.compare(version, rangeVersion) >= 0
      case '<':
        return this.compare(version, rangeVersion) < 0
      case '<=':
        return this.compare(version, rangeVersion) <= 0
      case '^':
        // Caret: allows changes that do not modify the left-most non-zero element
        if (rangeVersion.major > 0) {
          return version.major === rangeVersion.major && 
                 this.compare(version, rangeVersion) >= 0
        } else if (rangeVersion.minor > 0) {
          return version.major === 0 && 
                 version.minor === rangeVersion.minor && 
                 this.compare(version, rangeVersion) >= 0
        } else {
          return this.compare(version, rangeVersion) === 0
        }
      case '~':
        // Tilde: allows patch-level changes
        return version.major === rangeVersion.major && 
               version.minor === rangeVersion.minor && 
               this.compare(version, rangeVersion) >= 0
      default:
        return false
    }
  }

  /**
   * Get the type of version change
   */
  static getChangeType(from: SemanticVersion, to: SemanticVersion): 'major' | 'minor' | 'patch' | 'none' {
    if (to.major !== from.major) return 'major'
    if (to.minor !== from.minor) return 'minor'
    if (to.patch !== from.patch) return 'patch'
    return 'none'
  }

  /**
   * Bump version
   */
  static bump(version: SemanticVersion, type: 'major' | 'minor' | 'patch'): SemanticVersion {
    const newVersion = { ...version }
    
    switch (type) {
      case 'major':
        newVersion.major++
        newVersion.minor = 0
        newVersion.patch = 0
        break
      case 'minor':
        newVersion.minor++
        newVersion.patch = 0
        break
      case 'patch':
        newVersion.patch++
        break
    }
    
    newVersion.prerelease = null
    newVersion.build = null
    newVersion.raw = `${newVersion.major}.${newVersion.minor}.${newVersion.patch}`
    
    return newVersion
  }

  /**
   * Format version to string
   */
  static format(version: SemanticVersion): string {
    let str = `${version.major}.${version.minor}.${version.patch}`
    if (version.prerelease) str += `-${version.prerelease}`
    if (version.build) str += `+${version.build}`
    return str
  }
}

// ============================================================================
// DEPENDENCY COMPATIBILITY MATRIX CLASS
// ============================================================================

export class DependencyCompatibilityMatrix extends EventEmitter {
  private matrices: Map<string, CompatibilityMatrix> = new Map()
  private deprecationRegistry: Map<string, DeprecationInfo[]> = new Map()
  private migrationPaths: Map<string, MigrationPath[]> = new Map()
  private cachedChecks: Map<string, CompatibilityCheck> = new Map()

  // Known compatibility data
  private knownCompatibilities: Map<string, CompatibilityEntry[]> = new Map()
  private runtimeCompatibilityMap: Map<string, RuntimeRequirement[]> = new Map()
  private architectureCompatibilityMap: Map<string, ArchitectureSupport[]> = new Map()

  constructor() {
    super()
    this.initializeKnownData()
  }

  /**
   * Initialize known compatibility data
   */
  private initializeKnownData(): void {
    // Node.js runtime compatibility
    this.runtimeCompatibilityMap.set('node', [
      {
        runtime: 'node',
        minVersion: '16.0.0',
        maxVersion: '22.0.0',
        recommendedVersion: '20.10.0',
        features: [
          { name: 'ESM', minVersion: '12.0.0', description: 'ECMAScript modules', required: false },
          { name: 'Top-level await', minVersion: '14.8.0', description: 'Top-level await support', required: false },
          { name: 'Native fetch', minVersion: '18.0.0', description: 'Native fetch API', required: false },
          { name: 'Built-in test runner', minVersion: '20.0.0', description: 'Node.js test runner', required: false }
        ],
        deprecatedFeatures: [
          'Legacy URL API (use global URL instead)',
          'domain module (use async_hooks instead)',
          'util.isArray (use Array.isArray instead)'
        ]
      }
    ])

    // Bun runtime compatibility
    this.runtimeCompatibilityMap.set('bun', [
      {
        runtime: 'bun',
        minVersion: '0.5.0',
        maxVersion: '1.2.0',
        recommendedVersion: '1.0.0',
        features: [
          { name: 'Bun.serve', minVersion: '0.1.0', description: 'HTTP server', required: false },
          { name: 'Bun.sql', minVersion: '0.5.0', description: 'Built-in SQLite', required: false },
          { name: 'Bun.broadcast', minVersion: '0.6.0', description: 'Broadcast channel', required: false }
        ],
        deprecatedFeatures: []
      }
    ])

    // Initialize known package compatibilities
    this.initializePackageCompatibilities()
    
    // Initialize deprecation registry
    this.initializeDeprecationRegistry()
    
    // Initialize migration paths
    this.initializeMigrationPaths()
  }

  /**
   * Initialize known package compatibilities
   */
  private initializePackageCompatibilities(): void {
    // React ecosystem
    this.knownCompatibilities.set('react', [
      {
        packageId: 'react',
        packageName: 'react',
        versionRange: '^18.0.0',
        compatibleVersions: [
          {
            version: '18.2.0',
            status: 'full',
            features: ['Concurrent rendering', 'Suspense', 'useId', 'useTransition'],
            limitations: [],
            breakingChanges: [],
            migrationRequired: false
          },
          {
            version: '18.0.0',
            status: 'full',
            features: ['Concurrent rendering', 'Suspense'],
            limitations: ['Missing useId hook'],
            breakingChanges: ['Automatic batching', 'Strict mode changes'],
            migrationRequired: true,
            migrationPath: 'react-17-to-18'
          },
          {
            version: '17.0.2',
            status: 'deprecated',
            features: ['Legacy root API'],
            limitations: ['No concurrent features'],
            breakingChanges: [],
            migrationRequired: true,
            migrationPath: 'react-17-to-18'
          }
        ],
        peerDependencies: [
          {
            name: 'react-dom',
            supportedRanges: ['^18.0.0'],
            incompatibleRanges: ['^17.0.0', '^16.0.0'],
            recommendations: ['Use matching versions of react and react-dom']
          }
        ],
        conflicts: [],
        status: 'compatible'
      }
    ])

    // Next.js ecosystem
    this.knownCompatibilities.set('next', [
      {
        packageId: 'next',
        packageName: 'next',
        versionRange: '^14.0.0',
        compatibleVersions: [
          {
            version: '14.0.0',
            status: 'full',
            features: ['App Router', 'Server Components', 'Turbopack', 'Partial Prerendering'],
            limitations: [],
            breakingChanges: [],
            migrationRequired: false
          },
          {
            version: '13.5.0',
            status: 'partial',
            features: ['App Router', 'Server Components'],
            limitations: ['No Turbopack', 'No Partial Prerendering'],
            breakingChanges: [],
            migrationRequired: true,
            migrationPath: 'nextjs-13-to-14'
          },
          {
            version: '12.3.0',
            status: 'deprecated',
            features: ['Pages Router'],
            limitations: ['No App Router'],
            breakingChanges: [],
            migrationRequired: true,
            migrationPath: 'nextjs-12-to-13'
          }
        ],
        peerDependencies: [
          {
            name: 'react',
            supportedRanges: ['^18.0.0'],
            incompatibleRanges: ['^17.0.0', '^16.0.0'],
            recommendations: ['Next.js 14 requires React 18+']
          },
          {
            name: 'react-dom',
            supportedRanges: ['^18.0.0'],
            incompatibleRanges: ['^17.0.0', '^16.0.0'],
            recommendations: ['Use matching React versions']
          }
        ],
        conflicts: [],
        status: 'compatible'
      }
    ])

    // TypeScript
    this.knownCompatibilities.set('typescript', [
      {
        packageId: 'typescript',
        packageName: 'typescript',
        versionRange: '^5.0.0',
        compatibleVersions: [
          {
            version: '5.3.0',
            status: 'full',
            features: ['All modern TypeScript features', 'Improved type inference'],
            limitations: [],
            breakingChanges: [],
            migrationRequired: false
          },
          {
            version: '5.0.0',
            status: 'full',
            features: ['const type parameters', 'extends multiple arrays'],
            limitations: ['Missing recent improvements'],
            breakingChanges: [],
            migrationRequired: false
          },
          {
            version: '4.9.0',
            status: 'partial',
            features: ['satisfies operator'],
            limitations: ['Missing TS 5 features'],
            breakingChanges: [],
            migrationRequired: true,
            migrationPath: 'typescript-4-to-5'
          }
        ],
        peerDependencies: [],
        conflicts: [],
        status: 'compatible'
      }
    ])

    // Prisma
    this.knownCompatibilities.set('@prisma/client', [
      {
        packageId: '@prisma/client',
        packageName: '@prisma/client',
        versionRange: '^5.0.0',
        compatibleVersions: [
          {
            version: '5.7.0',
            status: 'full',
            features: ['All Prisma features', 'TypedSQL', 'Prisma Optimize'],
            limitations: [],
            breakingChanges: [],
            migrationRequired: false
          },
          {
            version: '5.0.0',
            status: 'full',
            features: ['Core Prisma features'],
            limitations: [],
            breakingChanges: ['Removed deprecated APIs'],
            migrationRequired: true,
            migrationPath: 'prisma-4-to-5'
          }
        ],
        peerDependencies: [
          {
            name: 'prisma',
            supportedRanges: ['^5.0.0'],
            incompatibleRanges: ['^4.0.0', '^3.0.0'],
            recommendations: ['Keep prisma CLI and @prisma/client in sync']
          }
        ],
        conflicts: [],
        status: 'compatible'
      }
    ])

    // Tailwind CSS
    this.knownCompatibilities.set('tailwindcss', [
      {
        packageId: 'tailwindcss',
        packageName: 'tailwindcss',
        versionRange: '^3.4.0',
        compatibleVersions: [
          {
            version: '3.4.0',
            status: 'full',
            features: ['All utility classes', 'JIT mode', 'Container queries'],
            limitations: [],
            breakingChanges: [],
            migrationRequired: false
          },
          {
            version: '3.0.0',
            status: 'partial',
            features: ['JIT mode'],
            limitations: ['Missing newer utilities'],
            breakingChanges: [],
            migrationRequired: false
          }
        ],
        peerDependencies: [
          {
            name: 'postcss',
            supportedRanges: ['^8.0.0'],
            incompatibleRanges: ['^7.0.0'],
            recommendations: ['Use PostCSS 8 for best compatibility']
          }
        ],
        conflicts: [],
        status: 'compatible'
      }
    ])

    // Initialize architecture compatibility
    this.architectureCompatibilityMap.set('node', [
      {
        architecture: 'x64',
        platforms: ['linux', 'darwin', 'win32', 'freebsd'],
        nativeModules: ['sharp', 'bcrypt', 'better-sqlite3', 'esbuild'],
        limitations: [],
        status: 'full'
      },
      {
        architecture: 'arm64',
        platforms: ['linux', 'darwin'],
        nativeModules: ['sharp', 'bcrypt', 'better-sqlite3', 'esbuild'],
        limitations: ['Some native modules may require compilation'],
        status: 'full'
      },
      {
        architecture: 'arm',
        platforms: ['linux'],
        nativeModules: ['sharp', 'esbuild'],
        limitations: ['Limited native module support'],
        status: 'partial'
      }
    ])
  }

  /**
   * Initialize deprecation registry
   */
  private initializeDeprecationRegistry(): void {
    this.deprecationRegistry.set('request', [
      {
        package: 'request',
        version: '2.88.2',
        deprecatedAt: '2020-02-11',
        reason: 'Package is deprecated and no longer maintained',
        replacement: 'axios',
        migrationGuide: 'https://github.com/axios/axios/blob/main/MIGRATION.md',
        severity: 'critical',
        affectsSecurity: true
      }
    ])

    this.deprecationRegistry.set('express-session', [
      {
        package: 'express-session',
        version: '1.17.3',
        deprecatedAt: '2022-01-01',
        reason: 'MemoryStore is not designed for production',
        replacement: 'connect-redis',
        migrationGuide: 'https://github.com/tj/connect-redis',
        severity: 'medium',
        affectsSecurity: false
      }
    ])

    this.deprecationRegistry.set('colors', [
      {
        package: 'colors',
        version: '1.4.0',
        deprecatedAt: '2021-10-27',
        reason: 'Package has security issues and is unmaintained',
        replacement: 'chalk',
        migrationGuide: 'https://github.com/chalk/chalk',
        severity: 'high',
        affectsSecurity: true
      }
    ])

    this.deprecationRegistry.set('node-fetch@2', [
      {
        package: 'node-fetch',
        version: '2.x',
        deprecatedAt: '2023-01-01',
        reason: 'Use native fetch (Node 18+) or undici',
        replacement: 'undici',
        migrationGuide: 'https://github.com/nodejs/undici',
        severity: 'low',
        affectsSecurity: false
      }
    ])

    this.deprecationRegistry.set('moment', [
      {
        package: 'moment',
        version: '2.29.4',
        deprecatedAt: '2020-09-15',
        reason: 'Consider using modern alternatives with better tree-shaking',
        replacement: 'date-fns',
        migrationGuide: 'https://date-fns.org/',
        severity: 'low',
        affectsSecurity: false
      }
    ])

    this.deprecationRegistry.set('lodash', [
      {
        package: 'lodash',
        version: '4.17.21',
        deprecatedAt: '2021-01-01',
        reason: 'Consider using native ES features or lodash-es for tree-shaking',
        replacement: 'lodash-es',
        migrationGuide: 'https://github.com/lodash/lodash/tree/es',
        severity: 'low',
        affectsSecurity: false
      }
    ])
  }

  /**
   * Initialize migration paths
   */
  private initializeMigrationPaths(): void {
    this.migrationPaths.set('react-17-to-18', [
      {
        id: 'react-17-to-18',
        name: 'React 17 to React 18',
        fromVersion: '17.0.0',
        toVersion: '18.2.0',
        steps: [
          {
            order: 1,
            type: 'install',
            description: 'Update React and React DOM',
            command: 'npm install react@18 react-dom@18',
            automated: true,
            estimatedTime: 2,
            riskLevel: 'low'
          },
          {
            order: 2,
            type: 'code',
            description: 'Update root render method',
            codeChanges: [
              {
                file: 'src/index.tsx',
                search: "ReactDOM.render(<App />, document.getElementById('root'))",
                replace: "const root = ReactDOM.createRoot(document.getElementById('root'));\nroot.render(<App />)",
                description: 'Use createRoot API'
              }
            ],
            automated: true,
            estimatedTime: 5,
            riskLevel: 'medium'
          },
          {
            order: 3,
            type: 'test',
            description: 'Run tests to verify compatibility',
            command: 'npm test',
            automated: true,
            estimatedTime: 10,
            riskLevel: 'low'
          }
        ],
        breakingChanges: [
          'Automatic batching of state updates',
          'Stricter Strict Mode behavior',
          'No more componentWillMount warnings - errors instead'
        ],
        estimatedEffort: 'low',
        automated: true,
        prerequisites: ['Node.js 14+'],
        postMigrationSteps: ['Update React Testing Library if used', 'Review Strict Mode warnings']
      }
    ])

    this.migrationPaths.set('nextjs-12-to-13', [
      {
        id: 'nextjs-12-to-13',
        name: 'Next.js 12 to Next.js 13',
        fromVersion: '12.0.0',
        toVersion: '13.5.0',
        steps: [
          {
            order: 1,
            type: 'install',
            description: 'Update Next.js',
            command: 'npm install next@13 react@18 react-dom@18',
            automated: true,
            estimatedTime: 2,
            riskLevel: 'low'
          },
          {
            order: 2,
            type: 'code',
            description: 'Update Link components',
            codeChanges: [
              {
                file: '**/*.tsx',
                search: '<Link href="#"><a>',
                replace: '<Link href="#">',
                description: 'Remove nested <a> tags'
              }
            ],
            automated: true,
            estimatedTime: 15,
            riskLevel: 'medium'
          },
          {
            order: 3,
            type: 'config',
            description: 'Update next.config.js',
            automated: false,
            estimatedTime: 10,
            riskLevel: 'low'
          },
          {
            order: 4,
            type: 'test',
            description: 'Run tests',
            command: 'npm run build && npm test',
            automated: true,
            estimatedTime: 15,
            riskLevel: 'low'
          }
        ],
        breakingChanges: [
          'Link component no longer requires <a> child',
          'Image component changes',
          'Font optimization changes'
        ],
        estimatedEffort: 'medium',
        automated: false,
        prerequisites: ['React 18'],
        postMigrationSteps: ['Consider migrating to App Router', 'Update font imports']
      }
    ])

    this.migrationPaths.set('nextjs-13-to-14', [
      {
        id: 'nextjs-13-to-14',
        name: 'Next.js 13 to Next.js 14',
        fromVersion: '13.0.0',
        toVersion: '14.0.0',
        steps: [
          {
            order: 1,
            type: 'install',
            description: 'Update Next.js',
            command: 'npm install next@14',
            automated: true,
            estimatedTime: 2,
            riskLevel: 'low'
          },
          {
            order: 2,
            type: 'test',
            description: 'Verify build',
            command: 'npm run build',
            automated: true,
            estimatedTime: 10,
            riskLevel: 'low'
          }
        ],
        breakingChanges: [
          'Minimum Node.js version is 18.17',
          'Server Actions are stable',
          'Partial Prerendering available'
        ],
        estimatedEffort: 'low',
        automated: true,
        prerequisites: ['Node.js 18.17+'],
        postMigrationSteps: ['Consider enabling Server Actions', 'Review Partial Prerendering']
      }
    ])

    this.migrationPaths.set('prisma-4-to-5', [
      {
        id: 'prisma-4-to-5',
        name: 'Prisma 4 to Prisma 5',
        fromVersion: '4.0.0',
        toVersion: '5.7.0',
        steps: [
          {
            order: 1,
            type: 'install',
            description: 'Update Prisma packages',
            command: 'npm install prisma@5 @prisma/client@5',
            automated: true,
            estimatedTime: 2,
            riskLevel: 'low'
          },
          {
            order: 2,
            type: 'code',
            description: 'Update deprecated API usage',
            automated: false,
            estimatedTime: 30,
            riskLevel: 'medium'
          },
          {
            order: 3,
            type: 'config',
            description: 'Run Prisma generate',
            command: 'npx prisma generate',
            automated: true,
            estimatedTime: 5,
            riskLevel: 'low'
          },
          {
            order: 4,
            type: 'test',
            description: 'Run migrations and tests',
            command: 'npx prisma migrate dev && npm test',
            automated: true,
            estimatedTime: 15,
            riskLevel: 'low'
          }
        ],
        breakingChanges: [
          'Some deprecated APIs removed',
          'Changes to query logging',
          'Stricter type checking'
        ],
        estimatedEffort: 'medium',
        automated: false,
        prerequisites: [],
        postMigrationSteps: ['Review query performance', 'Update logging configuration']
      }
    ])
  }

  // ========================================================================
  // COMPATIBILITY CHECKING METHODS
  // ========================================================================

  /**
   * Build compatibility matrix for a project
   */
  async buildCompatibilityMatrix(
    projectPath: string,
    options?: { includeDevDependencies?: boolean }
  ): Promise<CompatibilityMatrix> {
    const matrixId = `matrix-${Date.now().toString(36)}`
    const entries: CompatibilityEntry[] = []

    try {
      // Read package.json
      const packageJson = await this.readPackageJson(projectPath)
      
      // Process dependencies
      const deps = { ...packageJson.dependencies }
      if (options?.includeDevDependencies !== false) {
        Object.assign(deps, packageJson.devDependencies || {})
      }

      for (const [name, version] of Object.entries(deps)) {
        const entry = await this.buildCompatibilityEntry(name, version as string)
        entries.push(entry)
      }

      // Build runtime requirements
      const runtimeRequirements = this.getRuntimeRequirements(packageJson)
      
      // Build architecture support
      const architectureSupport = this.getArchitectureSupport(packageJson)
      
      // Build container compatibility
      const containerCompatibility = await this.getContainerCompatibility(projectPath)
      
      // Build API version matrix
      const apiVersionMatrix = this.getApiVersionMatrix(packageJson)

      const matrix: CompatibilityMatrix = {
        id: matrixId,
        name: packageJson.name || 'unnamed-project',
        version: packageJson.version || '0.0.0',
        entries,
        runtimeRequirements,
        architectureSupport,
        containerCompatibility,
        apiVersionMatrix,
        lastUpdated: new Date().toISOString()
      }

      this.matrices.set(matrixId, matrix)
      this.emit('matrix_built', { matrixId, projectPath })

      return matrix

    } catch (error: any) {
      // Return empty matrix on error
      return {
        id: matrixId,
        name: 'error',
        version: '0.0.0',
        entries: [],
        runtimeRequirements: [],
        architectureSupport: [],
        containerCompatibility: [],
        apiVersionMatrix: [],
        lastUpdated: new Date().toISOString()
      }
    }
  }

  /**
   * Build compatibility entry for a single package
   */
  private async buildCompatibilityEntry(
    packageName: string,
    versionRange: string
  ): Promise<CompatibilityEntry> {
    // Check known compatibilities first
    const known = this.knownCompatibilities.get(packageName)
    if (known && known.length > 0) {
      return known[0]
    }

    // Build entry from analysis
    const parsedVersion = SemVerParser.parse(versionRange)
    
    return {
      packageId: packageName,
      packageName,
      versionRange,
      compatibleVersions: [
        {
          version: parsedVersion?.raw || versionRange,
          status: 'full',
          features: [],
          limitations: [],
          breakingChanges: [],
          migrationRequired: false
        }
      ],
      peerDependencies: [],
      conflicts: [],
      status: 'compatible'
    }
  }

  /**
   * Get runtime requirements for a project
   */
  private getRuntimeRequirements(packageJson: any): RuntimeRequirement[] {
    const requirements: RuntimeRequirement[] = []
    
    // Check engines field
    if (packageJson.engines) {
      if (packageJson.engines.node) {
        const nodeReqs = this.runtimeCompatibilityMap.get('node') || []
        requirements.push(...nodeReqs)
      }
    }
    
    // Detect runtime from dependencies
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
    if (deps['next'] || deps['react']) {
      requirements.push(...(this.runtimeCompatibilityMap.get('node') || []))
    }
    
    return requirements
  }

  /**
   * Get architecture support for a project
   */
  private getArchitectureSupport(packageJson: any): ArchitectureSupport[] {
    return this.architectureCompatibilityMap.get('node') || []
  }

  /**
   * Get container compatibility
   */
  private async getContainerCompatibility(projectPath: string): Promise<ContainerCompatibility[]> {
    const compatibilities: ContainerCompatibility[] = []

    // Check for Dockerfile
    try {
      const dockerfile = await fs.readFile(
        path.join(projectPath, 'Dockerfile'),
        'utf-8'
      ).catch(() => null)

      if (dockerfile) {
        // Parse Dockerfile for base image
        const fromMatch = dockerfile.match(/FROM\s+([^\s]+)/i)
        if (fromMatch) {
          compatibilities.push({
            baseImage: fromMatch[1],
            tag: 'latest',
            runtime: 'node',
            architecture: 'x64',
            size: 0,
            verified: false,
            issues: [],
            optimizations: this.getContainerOptimizations(fromMatch[1])
          })
        }
      }
    } catch {
      // No Dockerfile
    }

    // Add recommended container images
    compatibilities.push({
      baseImage: 'node',
      tag: '20-alpine',
      runtime: 'node',
      architecture: 'x64',
      size: 180 * 1024 * 1024, // ~180MB
      verified: true,
      issues: [],
      optimizations: ['Small image size', 'Security-focused', 'Fast startup']
    })

    compatibilities.push({
      baseImage: 'node',
      tag: '20-slim',
      runtime: 'node',
      architecture: 'x64',
      size: 250 * 1024 * 1024, // ~250MB
      verified: true,
      issues: [],
      optimizations: ['Balanced size and features']
    })

    return compatibilities
  }

  /**
   * Get container optimizations for an image
   */
  private getContainerOptimizations(baseImage: string): string[] {
    const optimizations: string[] = []

    if (baseImage.includes('alpine')) {
      optimizations.push('Minimal image size')
      optimizations.push('Consider musl compatibility for native modules')
    } else if (baseImage.includes('slim')) {
      optimizations.push('Debian-based with reduced size')
      optimizations.push('Better glibc compatibility')
    }

    optimizations.push('Use multi-stage builds')
    optimizations.push('Cache npm dependencies separately')

    return optimizations
  }

  /**
   * Get API version matrix for a project
   */
  private getApiVersionMatrix(packageJson: any): ApiVersionMatrix[] {
    const matrix: ApiVersionMatrix[] = []
    const deps = { ...packageJson.dependencies }

    // Add known API matrices for common packages
    if (deps['next']) {
      matrix.push({
        apiName: 'Next.js',
        versions: [
          { version: '14.0', releaseDate: '2023-10-26', status: 'stable', changes: ['Server Actions stable', 'Partial Prerendering'] },
          { version: '13.5', releaseDate: '2023-09-04', status: 'stable', changes: ['Turbopack beta', 'Improved performance'] },
          { version: '13.4', releaseDate: '2023-06-22', status: 'stable', changes: ['App Router stable'] }
        ],
        currentVersion: '14.0',
        deprecatedVersions: ['12.x'],
        breakingChanges: [
          {
            fromVersion: '12',
            toVersion: '13',
            type: 'changed',
            description: 'Link component API changed',
            affectedApis: ['next/link'],
            migration: 'Remove nested <a> tag',
            severity: 'medium'
          }
        ]
      })
    }

    if (deps['react'] || deps['react-dom']) {
      matrix.push({
        apiName: 'React',
        versions: [
          { version: '18.2', releaseDate: '2022-06-14', status: 'stable', changes: ['Bug fixes'] },
          { version: '18.0', releaseDate: '2022-03-29', status: 'stable', changes: ['Concurrent rendering', 'Suspense improvements'] }
        ],
        currentVersion: '18.2',
        deprecatedVersions: ['17.x', '16.x'],
        breakingChanges: [
          {
            fromVersion: '17',
            toVersion: '18',
            type: 'changed',
            description: 'Root API changed to createRoot',
            affectedApis: ['ReactDOM.render'],
            migration: 'Use ReactDOM.createRoot instead',
            severity: 'high'
          }
        ]
      })
    }

    return matrix
  }

  // ========================================================================
  // COMPATIBILITY VALIDATION METHODS
  // ========================================================================

  /**
   * Check version compatibility
   */
  checkVersionCompatibility(
    packageName: string,
    version: string,
    range: string
  ): CompatibilityCheckResult {
    const parsedVersion = SemVerParser.parse(version)
    const satisfies = parsedVersion ? SemVerParser.satisfies(parsedVersion, range) : false

    return {
      type: 'version',
      packageName,
      status: satisfies ? 'pass' : 'fail',
      message: satisfies
        ? `Version ${version} satisfies range ${range}`
        : `Version ${version} does not satisfy range ${range}`,
      details: { version, range, parsed: parsedVersion },
      severity: satisfies ? 'info' : 'high',
      fixAvailable: !satisfies,
      fixDescription: !satisfies ? `Update to a version matching ${range}` : undefined
    }
  }

  /**
   * Validate container compatibility
   */
  async validateContainerCompatibility(
    containerInfo: ContainerInfo,
    requirements: RuntimeRequirement[]
  ): Promise<CompatibilityCheckResult[]> {
    const results: CompatibilityCheckResult[] = []

    for (const req of requirements) {
      const runtimeMatch = containerInfo.baseImage?.toLowerCase().includes(req.runtime)
      
      results.push({
        type: 'container',
        packageName: req.runtime,
        status: runtimeMatch ? 'pass' : 'warning',
        message: runtimeMatch
          ? `Container uses compatible runtime: ${req.runtime}`
          : `Container may not have correct runtime: ${req.runtime}`,
        details: {
          containerImage: containerInfo.baseImage,
          requiredRuntime: req.runtime,
          minVersion: req.minVersion,
          recommendedVersion: req.recommendedVersion
        },
        severity: runtimeMatch ? 'info' : 'medium',
        fixAvailable: true,
        fixDescription: `Use base image with ${req.runtime} ${req.recommendedVersion}`
      })
    }

    return results
  }

  /**
   * Check runtime compatibility
   */
  checkRuntimeCompatibility(
    runtimeName: string,
    runtimeVersion: string,
    requirements: RuntimeRequirement[]
  ): CompatibilityCheckResult[] {
    const results: CompatibilityCheckResult[] = []
    const parsedRuntimeVersion = SemVerParser.parse(runtimeVersion)

    for (const req of requirements) {
      if (req.runtime !== runtimeName.toLowerCase()) continue

      const minVersion = SemVerParser.parse(req.minVersion)
      const maxVersion = req.maxVersion ? SemVerParser.parse(req.maxVersion) : null
      const recommendedVersion = SemVerParser.parse(req.recommendedVersion)

      let status: 'pass' | 'warning' | 'fail' = 'pass'
      let message = ''
      let severity: 'critical' | 'high' | 'medium' | 'low' | 'info' = 'info'

      if (minVersion && parsedRuntimeVersion) {
        if (SemVerParser.compare(parsedRuntimeVersion, minVersion) < 0) {
          status = 'fail'
          message = `${runtimeName} ${runtimeVersion} is below minimum required ${req.minVersion}`
          severity = 'critical'
        } else if (maxVersion && SemVerParser.compare(parsedRuntimeVersion, maxVersion) > 0) {
          status = 'warning'
          message = `${runtimeName} ${runtimeVersion} is above tested maximum ${req.maxVersion}`
          severity = 'medium'
        } else if (recommendedVersion && SemVerParser.compare(parsedRuntimeVersion, recommendedVersion) < 0) {
          status = 'warning'
          message = `${runtimeName} ${runtimeVersion} is below recommended ${req.recommendedVersion}`
          severity = 'low'
        } else {
          message = `${runtimeName} ${runtimeVersion} is compatible`
        }
      }

      results.push({
        type: 'runtime',
        packageName: runtimeName,
        status,
        message,
        details: {
          current: runtimeVersion,
          min: req.minVersion,
          max: req.maxVersion,
          recommended: req.recommendedVersion,
          features: req.features
        },
        severity,
        fixAvailable: status !== 'pass',
        fixDescription: status !== 'pass' ? `Upgrade to ${runtimeName} ${req.recommendedVersion}` : undefined
      })
    }

    return results
  }

  /**
   * Validate architecture compatibility
   */
  validateArchitectureCompatibility(
    targetArchitecture: string,
    dependencies: string[]
  ): CompatibilityCheckResult[] {
    const results: CompatibilityCheckResult[] = []
    const archSupport = this.architectureCompatibilityMap.get('node') || []

    const matchingArch = archSupport.find(a => a.architecture === targetArchitecture)

    if (!matchingArch) {
      results.push({
        type: 'architecture',
        packageName: 'system',
        status: 'fail',
        message: `Architecture ${targetArchitecture} is not supported`,
        details: { architecture: targetArchitecture },
        severity: 'critical',
        fixAvailable: false
      })
      return results
    }

    // Check native modules compatibility
    const nativeModules = matchingArch.nativeModules
    for (const dep of dependencies) {
      if (this.isNativeModule(dep) && !nativeModules.includes(dep)) {
        results.push({
          type: 'architecture',
          packageName: dep,
          status: 'warning',
          message: `${dep} may have limited support on ${targetArchitecture}`,
          details: {
            architecture: targetArchitecture,
            module: dep,
            supportedModules: nativeModules,
            limitations: matchingArch.limitations
          },
          severity: 'medium',
          fixAvailable: true,
          fixDescription: 'Consider using a pure JavaScript alternative or verify native module support'
        })
      }
    }

    // Check platform support
    const currentPlatform = process.platform
    if (!matchingArch.platforms.includes(currentPlatform as any)) {
      results.push({
        type: 'architecture',
        packageName: 'system',
        status: 'warning',
        message: `${targetArchitecture} on ${currentPlatform} may have limited support`,
        details: {
          architecture: targetArchitecture,
          platform: currentPlatform,
          supportedPlatforms: matchingArch.platforms
        },
        severity: 'medium',
        fixAvailable: false
      })
    }

    return results
  }

  /**
   * Check if a module is a native module
   */
  private isNativeModule(packageName: string): boolean {
    const nativeModules = [
      'sharp', 'bcrypt', 'better-sqlite3', 'esbuild', 'node-gyp',
      'node-pre-gyp', 'nan', 'ffi-napi', 'ref-napi', 'canvas',
      'node-canvas', 'puppeteer', 'playwright'
    ]
    return nativeModules.includes(packageName)
  }

  /**
   * Check API compatibility for breaking changes
   */
  checkApiCompatibility(
    apiMatrix: ApiVersionMatrix[],
    currentVersions: Record<string, string>
  ): CompatibilityCheckResult[] {
    const results: CompatibilityCheckResult[] = []

    for (const api of apiMatrix) {
      const currentVersion = currentVersions[api.apiName.toLowerCase()]
      if (!currentVersion) continue

      // Check for deprecated API usage
      if (api.deprecatedVersions.some(v => currentVersion.startsWith(v.split('.')[0]))) {
        results.push({
          type: 'api',
          packageName: api.apiName,
          status: 'warning',
          message: `Using deprecated API version ${currentVersion}`,
          details: {
            currentVersion,
            deprecatedVersions: api.deprecatedVersions,
            currentStableVersion: api.currentVersion
          },
          severity: 'medium',
          fixAvailable: true,
          fixDescription: `Upgrade to ${api.apiName} ${api.currentVersion}`
        })
      }

      // Check for breaking changes
      for (const breaking of api.breakingChanges) {
        if (currentVersion.startsWith(breaking.fromVersion.split('.')[0])) {
          results.push({
            type: 'api',
            packageName: api.apiName,
            status: 'warning',
            message: `Potential breaking change: ${breaking.description}`,
            details: {
              breakingChange: breaking,
              affectedApis: breaking.affectedApis,
              severity: breaking.severity
            },
            severity: breaking.severity as any,
            fixAvailable: true,
            fixDescription: breaking.migration
          })
        }
      }
    }

    return results
  }

  /**
   * Validate semantic versions
   */
  validateSemanticVersions(
    dependencies: Record<string, string>
  ): CompatibilityCheckResult[] {
    const results: CompatibilityCheckResult[] = []

    for (const [name, version] of Object.entries(dependencies)) {
      // Check for invalid version specifiers
      if (version === 'latest' || version === '*' || version === 'x') {
        results.push({
          type: 'version',
          packageName: name,
          status: 'warning',
          message: `Using unstable version specifier: ${version}`,
          details: { version },
          severity: 'medium',
          fixAvailable: true,
          fixDescription: 'Pin to a specific version range'
        })
        continue
      }

      // Check for complex ranges
      if (version.includes('||') || version.includes(' - ')) {
        results.push({
          type: 'version',
          packageName: name,
          status: 'warning',
          message: `Complex version range may cause unexpected behavior: ${version}`,
          details: { version },
          severity: 'low',
          fixAvailable: true,
          fixDescription: 'Simplify version range'
        })
      }

      // Validate semver format
      const parsed = SemVerParser.parse(version)
      if (!parsed) {
        results.push({
          type: 'version',
          packageName: name,
          status: 'warning',
          message: `Invalid semantic version: ${version}`,
          details: { version },
          severity: 'low',
          fixAvailable: true,
          fixDescription: 'Use valid semantic versioning'
        })
      }

      // Check for very old versions
      if (parsed && parsed.major < 1) {
        results.push({
          type: 'version',
          packageName: name,
          status: 'warning',
          message: `Using pre-release version: ${version}`,
          details: { version, parsed },
          severity: 'low',
          fixAvailable: true,
          fixDescription: 'Consider using a stable release'
        })
      }
    }

    return results
  }

  /**
   * Detect deprecated packages
   */
  detectDeprecation(
    dependencies: Record<string, string>
  ): CompatibilityCheckResult[] {
    const results: CompatibilityCheckResult[] = []

    for (const [name, version] of Object.entries(dependencies)) {
      const deprecations = this.deprecationRegistry.get(name)
      
      if (deprecations) {
        for (const deprecation of deprecations) {
          results.push({
            type: 'deprecation',
            packageName: name,
            status: deprecation.affectsSecurity ? 'fail' : 'warning',
            message: deprecation.reason,
            details: {
              deprecatedAt: deprecation.deprecatedAt,
              sunsetDate: deprecation.sunsetDate,
              replacement: deprecation.replacement,
              migrationGuide: deprecation.migrationGuide,
              affectsSecurity: deprecation.affectsSecurity
            },
            severity: deprecation.severity as any,
            fixAvailable: !!deprecation.replacement,
            fixDescription: deprecation.replacement
              ? `Migrate to ${deprecation.replacement}`
              : undefined
          })
        }
      }
    }

    return results
  }

  /**
   * Check peer dependency compatibility
   */
  checkPeerDependencyCompatibility(
    packageJson: any,
    lockFile: any
  ): CompatibilityCheckResult[] {
    const results: CompatibilityCheckResult[] = []
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

    // Common peer dependency issues
    const peerDependencyRules = [
      {
        packages: ['react', 'react-dom'],
        shouldBeSame: true,
        message: 'React and React DOM versions should match'
      },
      {
        packages: ['@prisma/client', 'prisma'],
        shouldBeSame: true,
        message: 'Prisma CLI and client versions should match'
      },
      {
        packages: ['typescript'],
        related: ['@types/node', '@types/react'],
        message: 'TypeScript and @types versions should be compatible'
      }
    ]

    for (const rule of peerDependencyRules) {
      if (rule.shouldBeSame && rule.packages.length === 2) {
        const v1 = dependencies[rule.packages[0]]
        const v2 = dependencies[rule.packages[1]]

        if (v1 && v2) {
          const parsed1 = SemVerParser.parse(v1)
          const parsed2 = SemVerParser.parse(v2)

          if (parsed1 && parsed2) {
            const sameMajor = parsed1.major === parsed2.major
            const sameMinor = parsed1.minor === parsed2.minor

            if (!sameMajor) {
              results.push({
                type: 'peer',
                packageName: rule.packages[0],
                status: 'fail',
                message: rule.message,
                details: {
                  versions: { [rule.packages[0]]: v1, [rule.packages[1]]: v2 }
                },
                severity: 'high',
                fixAvailable: true,
                fixDescription: `Update both packages to the same version`
              })
            } else if (!sameMinor) {
              results.push({
                type: 'peer',
                packageName: rule.packages[0],
                status: 'warning',
                message: `${rule.packages[0]} and ${rule.packages[1]} have different minor versions`,
                details: {
                  versions: { [rule.packages[0]]: v1, [rule.packages[1]]: v2 }
                },
                severity: 'medium',
                fixAvailable: true,
                fixDescription: 'Consider using matching minor versions'
              })
            }
          }
        }
      }
    }

    return results
  }

  /**
   * Detect conflicts between dependencies
   */
  detectConflicts(
    dependencies: Record<string, string>
  ): CompatibilityCheckResult[] {
    const results: CompatibilityCheckResult[] = []

    // Known conflicts
    const knownConflicts = [
      {
        packages: ['moment', 'date-fns'],
        severity: 'low' as const,
        message: 'Both moment and date-fns are installed - consider using one',
        resolution: 'Remove one and use only one date library'
      },
      {
        packages: ['lodash', 'lodash-es'],
        severity: 'low' as const,
        message: 'Both lodash and lodash-es are installed',
        resolution: 'Use only lodash-es for better tree-shaking'
      },
      {
        packages: ['axios', 'node-fetch'],
        severity: 'low' as const,
        message: 'Multiple HTTP clients installed',
        resolution: 'Consider using one HTTP client for consistency'
      },
      {
        packages: ['jest', 'vitest'],
        severity: 'medium' as const,
        message: 'Both Jest and Vitest are installed - they may conflict',
        resolution: 'Use only one test framework'
      },
      {
        packages: ['eslint', '@biomejs/biome'],
        severity: 'medium' as const,
        message: 'Both ESLint and Biome are installed',
        resolution: 'Use one linter/formatter for consistency'
      }
    ]

    for (const conflict of knownConflicts) {
      const installed = conflict.packages.filter(p => dependencies[p])
      if (installed.length > 1) {
        results.push({
          type: 'conflict',
          packageName: installed[0],
          status: 'warning',
          message: conflict.message,
          details: {
            conflictingPackages: installed,
            severity: conflict.severity,
            resolution: conflict.resolution
          },
          severity: conflict.severity,
          fixAvailable: true,
          fixDescription: conflict.resolution
        })
      }
    }

    return results
  }

  // ========================================================================
  // MAIN COMPATIBILITY CHECK METHOD
  // ========================================================================

  /**
   * Perform comprehensive compatibility check
   */
  async checkCompatibility(
    projectPath: string,
    options?: {
      checkVersion?: boolean
      checkRuntime?: boolean
      checkArchitecture?: boolean
      checkContainer?: boolean
      checkApi?: boolean
      checkDeprecation?: boolean
      checkPeerDeps?: boolean
      checkConflicts?: boolean
    }
  ): Promise<CompatibilityCheck> {
    const checkId = `check-${Date.now().toString(36)}`
    const startTime = Date.now()

    const opts = {
      checkVersion: true,
      checkRuntime: true,
      checkArchitecture: true,
      checkContainer: true,
      checkApi: true,
      checkDeprecation: true,
      checkPeerDeps: true,
      checkConflicts: true,
      ...options
    }

    try {
      // Read project files
      const packageJson = await this.readPackageJson(projectPath)
      const lockFile = await this.readLockFile(projectPath)

      // Build context
      const context: CompatibilityContext = {
        projectPath,
        packageJson,
        lockFile,
        runtime: {
          name: process.release?.name || 'node',
          version: process.version.replace(/^v/, '')
        },
        architecture: process.arch,
        platform: process.platform
      }

      const results: CompatibilityCheckResult[] = []
      const dependencies = { 
        ...packageJson.dependencies, 
        ...packageJson.devDependencies 
      }

      // Build matrix
      const matrix = await this.buildCompatibilityMatrix(projectPath)

      // Run checks
      if (opts.checkVersion) {
        for (const [name, version] of Object.entries(packageJson.dependencies || {})) {
          results.push(this.checkVersionCompatibility(name, version as string, version as string))
        }
        results.push(...this.validateSemanticVersions(dependencies))
      }

      if (opts.checkRuntime) {
        results.push(...this.checkRuntimeCompatibility(
          context.runtime.name,
          context.runtime.version,
          matrix.runtimeRequirements
        ))
      }

      if (opts.checkArchitecture) {
        results.push(...this.validateArchitectureCompatibility(
          context.architecture,
          Object.keys(dependencies)
        ))
      }

      if (opts.checkContainer && context.containerInfo) {
        results.push(...await this.validateContainerCompatibility(
          context.containerInfo,
          matrix.runtimeRequirements
        ))
      }

      if (opts.checkApi) {
        results.push(...this.checkApiCompatibility(
          matrix.apiVersionMatrix,
          dependencies
        ))
      }

      if (opts.checkDeprecation) {
        results.push(...this.detectDeprecation(dependencies))
      }

      if (opts.checkPeerDeps) {
        results.push(...this.checkPeerDependencyCompatibility(packageJson, lockFile))
      }

      if (opts.checkConflicts) {
        results.push(...this.detectConflicts(dependencies))
      }

      // Generate summary
      const summary = this.generateSummary(results)

      // Generate recommendations
      const recommendations = this.generateRecommendations(results, matrix)

      const check: CompatibilityCheck = {
        id: checkId,
        timestamp: new Date().toISOString(),
        context,
        results,
        summary,
        recommendations
      }

      this.cachedChecks.set(checkId, check)
      this.emit('check_complete', { checkId, summary, processingTime: Date.now() - startTime })

      return check

    } catch (error: any) {
      return {
        id: checkId,
        timestamp: new Date().toISOString(),
        context: {
          projectPath,
          packageJson: {},
          lockFile: null,
          runtime: { name: 'node', version: process.version },
          architecture: process.arch,
          platform: process.platform
        },
        results: [{
          type: 'version',
          packageName: 'system',
          status: 'fail',
          message: `Compatibility check failed: ${error.message}`,
          details: { error: error.message },
          severity: 'critical',
          fixAvailable: false
        }],
        summary: {
          totalChecks: 1,
          passed: 0,
          warnings: 0,
          failed: 1,
          skipped: 0,
          overallStatus: 'unknown',
          score: 0
        },
        recommendations: []
      }
    }
  }

  /**
   * Generate summary from results
   */
  private generateSummary(results: CompatibilityCheckResult[]): CompatibilitySummary {
    const totalChecks = results.length
    const passed = results.filter(r => r.status === 'pass').length
    const warnings = results.filter(r => r.status === 'warning').length
    const failed = results.filter(r => r.status === 'fail').length
    const skipped = results.filter(r => r.status === 'skip').length

    // Calculate score
    const passRate = totalChecks > 0 ? passed / totalChecks : 0
    const warningPenalty = warnings * 0.05
    const failPenalty = failed * 0.2
    const score = Math.max(0, Math.round((passRate - warningPenalty - failPenalty) * 100))

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'critical' | 'unknown'
    if (score >= 80) overallStatus = 'healthy'
    else if (score >= 50) overallStatus = 'degraded'
    else if (score > 0) overallStatus = 'critical'
    else overallStatus = 'unknown'

    return {
      totalChecks,
      passed,
      warnings,
      failed,
      skipped,
      overallStatus,
      score
    }
  }

  /**
   * Generate recommendations from results
   */
  private generateRecommendations(
    results: CompatibilityCheckResult[],
    matrix: CompatibilityMatrix
  ): Recommendation[] {
    const recommendations: Recommendation[] = []

    for (const result of results) {
      if (result.status === 'pass') continue

      const priority = this.getPriorityFromSeverity(result.severity)
      
      recommendations.push({
        type: this.getRecommendationType(result),
        packageName: result.packageName,
        priority,
        description: result.message,
        action: result.fixDescription || 'Review and address the issue',
        impact: this.getImpactDescription(result),
        effort: this.getEffortEstimate(result),
        automated: result.fixAvailable
      })
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return recommendations.sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    )
  }

  private getPriorityFromSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' {
    switch (severity) {
      case 'critical': return 'critical'
      case 'high': return 'high'
      case 'medium': return 'medium'
      default: return 'low'
    }
  }

  private getRecommendationType(result: CompatibilityCheckResult): Recommendation['type'] {
    switch (result.type) {
      case 'version': return 'update'
      case 'deprecation': return 'migrate'
      case 'conflict': return 'remove'
      case 'container': return 'configure'
      case 'api': return 'investigate'
      case 'peer': return 'update'
      default: return 'update'
    }
  }

  private getImpactDescription(result: CompatibilityCheckResult): string {
    switch (result.severity) {
      case 'critical': return 'May cause application failure or security vulnerabilities'
      case 'high': return 'May cause runtime errors or unexpected behavior'
      case 'medium': return 'May cause minor issues or performance degradation'
      default: return 'Minor improvement opportunity'
    }
  }

  private getEffortEstimate(result: CompatibilityCheckResult): 'low' | 'medium' | 'high' {
    if (result.type === 'deprecation') return 'high'
    if (result.type === 'api') return 'medium'
    if (result.fixAvailable) return 'low'
    return 'medium'
  }

  // ========================================================================
  // MIGRATION ASSISTANCE
  // ========================================================================

  /**
   * Assist migration between versions
   */
  async assistMigration(
    packageName: string,
    fromVersion: string,
    toVersion: string
  ): Promise<MigrationPath | null> {
    // Find existing migration path
    const migrationKey = `${packageName}-${fromVersion.split('.')[0]}-to-${toVersion.split('.')[0]}`
    const existingPaths = this.migrationPaths.get(migrationKey)
    
    if (existingPaths && existingPaths.length > 0) {
      return existingPaths[0]
    }

    // Generate migration path
    const fromParsed = SemVerParser.parse(fromVersion)
    const toParsed = SemVerParser.parse(toVersion)

    if (!fromParsed || !toParsed) return null

    const changeType = SemVerParser.getChangeType(fromParsed, toParsed)
    
    const migrationPath: MigrationPath = {
      id: `migration-${packageName}-${Date.now().toString(36)}`,
      name: `${packageName} ${fromVersion} to ${toVersion}`,
      fromVersion,
      toVersion,
      steps: this.generateMigrationSteps(packageName, fromVersion, toVersion, changeType),
      breakingChanges: this.estimateBreakingChanges(packageName, changeType),
      estimatedEffort: changeType === 'major' ? 'high' : changeType === 'minor' ? 'medium' : 'low',
      automated: changeType === 'patch',
      prerequisites: [],
      postMigrationSteps: ['Run tests', 'Check for deprecation warnings']
    }

    return migrationPath
  }

  /**
   * Generate migration steps
   */
  private generateMigrationSteps(
    packageName: string,
    fromVersion: string,
    toVersion: string,
    changeType: 'major' | 'minor' | 'patch' | 'none'
  ): MigrationStep[] {
    const steps: MigrationStep[] = []

    // Installation step
    steps.push({
      order: 1,
      type: 'install',
      description: `Update ${packageName} from ${fromVersion} to ${toVersion}`,
      command: `npm install ${packageName}@${toVersion}`,
      automated: true,
      estimatedTime: 2,
      riskLevel: changeType === 'major' ? 'high' : 'low'
    })

    // Configuration changes for major versions
    if (changeType === 'major') {
      steps.push({
        order: 2,
        type: 'config',
        description: `Review and update ${packageName} configuration`,
        automated: false,
        estimatedTime: 15,
        riskLevel: 'medium'
      })
    }

    // Testing step
    steps.push({
      order: steps.length + 1,
      type: 'test',
      description: 'Run tests to verify migration',
      command: 'npm test',
      automated: true,
      estimatedTime: 10,
      riskLevel: 'low'
    })

    return steps
  }

  /**
   * Estimate breaking changes
   */
  private estimateBreakingChanges(
    packageName: string,
    changeType: 'major' | 'minor' | 'patch' | 'none'
  ): string[] {
    if (changeType !== 'major') return []

    // Common breaking changes for major version updates
    return [
      'API changes may require code updates',
      'Configuration format may have changed',
      'Some features may be removed or deprecated',
      'Check the changelog for specific changes'
    ]
  }

  // ========================================================================
  // AUTO-UPGRADE LOGIC
  // ========================================================================

  /**
   * Automate upgrades
   */
  async automateUpgrades(
    projectPath: string,
    options?: {
      includeMajor?: boolean
      includeMinor?: boolean
      includePatch?: boolean
      dryRun?: boolean
      packages?: string[]
    }
  ): Promise<UpgradePlan[]> {
    const plans: UpgradePlan[] = []
    const opts = {
      includeMajor: false,
      includeMinor: true,
      includePatch: true,
      dryRun: true,
      ...options
    }

    try {
      const packageJson = await this.readPackageJson(projectPath)
      const dependencies = packageJson.dependencies || {}

      for (const [name, currentVersion] of Object.entries(dependencies)) {
        if (opts.packages && !opts.packages.includes(name)) continue

        const parsed = SemVerParser.parse(currentVersion as string)
        if (!parsed) continue

        // Determine upgrade type
        const upgradeType = opts.includeMajor ? 'major' 
          : opts.includeMinor ? 'minor' 
          : 'patch'

        const newVersion = SemVerParser.bump(parsed, upgradeType)
        const upgradePlan = this.createUpgradePlan(name, parsed, newVersion, opts.dryRun)

        if (upgradePlan) {
          plans.push(upgradePlan)
        }
      }

      this.emit('upgrade_plans_generated', { projectPath, planCount: plans.length })

    } catch (error: any) {
      this.emit('upgrade_error', { projectPath, error: error.message })
    }

    return plans
  }

  /**
   * Create upgrade plan
   */
  private createUpgradePlan(
    packageName: string,
    currentVersion: SemanticVersion,
    targetVersion: SemanticVersion,
    dryRun: boolean
  ): UpgradePlan {
    const changeType = SemVerParser.getChangeType(currentVersion, targetVersion)

    const steps: UpgradeStep[] = [
      {
        order: 1,
        action: 'Backup current installation',
        expectedOutcome: 'Backup created',
        validation: 'Backup file exists'
      },
      {
        order: 2,
        action: `Update ${packageName} to ${SemVerParser.format(targetVersion)}`,
        command: `npm install ${packageName}@${SemVerParser.format(targetVersion)}`,
        expectedOutcome: 'Package updated',
        validation: `${packageName}@${SemVerParser.format(targetVersion)} in package.json`,
        rollback: `npm install ${packageName}@${SemVerParser.format(currentVersion)}`
      },
      {
        order: 3,
        action: 'Run tests',
        command: 'npm test',
        expectedOutcome: 'All tests pass',
        validation: 'Exit code 0'
      }
    ]

    const risks: UpgradeRisk[] = []
    if (changeType === 'major') {
      risks.push({
        description: 'Major version may contain breaking changes',
        likelihood: 'high',
        impact: 'high',
        mitigation: 'Review changelog and run comprehensive tests'
      })
    }

    return {
      id: `upgrade-${packageName}-${Date.now().toString(36)}`,
      name: `Upgrade ${packageName}`,
      targetVersion: SemVerParser.format(targetVersion),
      currentVersion: SemVerParser.format(currentVersion),
      steps,
      risks,
      rollbackPlan: `npm install ${packageName}@${SemVerParser.format(currentVersion)}`,
      estimatedTime: changeType === 'major' ? 30 : changeType === 'minor' ? 15 : 5,
      automated: changeType === 'patch' && !dryRun
    }
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  /**
   * Read package.json
   */
  private async readPackageJson(projectPath: string): Promise<any> {
    try {
      const content = await fs.readFile(
        path.join(projectPath, 'package.json'),
        'utf-8'
      )
      return JSON.parse(content)
    } catch {
      return {}
    }
  }

  /**
   * Read lock file
   */
  private async readLockFile(projectPath: string): Promise<any> {
    try {
      const content = await fs.readFile(
        path.join(projectPath, 'package-lock.json'),
        'utf-8'
      )
      return JSON.parse(content)
    } catch {
      return null
    }
  }

  /**
   * Get cached check
   */
  getCachedCheck(checkId: string): CompatibilityCheck | undefined {
    return this.cachedChecks.get(checkId)
  }

  /**
   * Get all cached checks
   */
  getAllCachedChecks(): CompatibilityCheck[] {
    return Array.from(this.cachedChecks.values())
  }

  /**
   * Get deprecation info
   */
  getDeprecationInfo(packageName: string): DeprecationInfo[] {
    return this.deprecationRegistry.get(packageName) || []
  }

  /**
   * Get migration paths
   */
  getMigrationPaths(packageName?: string): MigrationPath[] {
    if (packageName) {
      const paths: MigrationPath[] = []
      for (const [, value] of this.migrationPaths) {
        paths.push(...value.filter(p => p.name.toLowerCase().includes(packageName.toLowerCase())))
      }
      return paths
    }
    
    const allPaths: MigrationPath[] = []
    for (const [, value] of this.migrationPaths) {
      allPaths.push(...value)
    }
    return allPaths
  }

  /**
   * Add custom compatibility entry
   */
  addCompatibilityEntry(packageName: string, entry: CompatibilityEntry): void {
    const existing = this.knownCompatibilities.get(packageName) || []
    existing.push(entry)
    this.knownCompatibilities.set(packageName, existing)
  }

  /**
   * Add deprecation info
   */
  addDeprecationInfo(packageName: string, info: DeprecationInfo): void {
    const existing = this.deprecationRegistry.get(packageName) || []
    existing.push(info)
    this.deprecationRegistry.set(packageName, existing)
  }

  /**
   * Add migration path
   */
  addMigrationPath(key: string, path: MigrationPath): void {
    const existing = this.migrationPaths.get(key) || []
    existing.push(path)
    this.migrationPaths.set(key, existing)
  }

  /**
   * Clear caches
   */
  clearCaches(): void {
    this.cachedChecks.clear()
  }
}

// ============================================================================
// SINGLETON AND CONVENIENCE FUNCTIONS
// ============================================================================

let matrixInstance: DependencyCompatibilityMatrix | null = null

/**
 * Get the singleton instance of DependencyCompatibilityMatrix
 */
export function getCompatibilityMatrix(): DependencyCompatibilityMatrix {
  if (!matrixInstance) {
    matrixInstance = new DependencyCompatibilityMatrix()
  }
  return matrixInstance
}

/**
 * Convenience function to check compatibility
 */
export async function checkCompatibility(
  projectPath: string,
  options?: {
    checkVersion?: boolean
    checkRuntime?: boolean
    checkArchitecture?: boolean
    checkContainer?: boolean
    checkApi?: boolean
    checkDeprecation?: boolean
    checkPeerDeps?: boolean
    checkConflicts?: boolean
  }
): Promise<CompatibilityCheck> {
  const matrix = getCompatibilityMatrix()
  return matrix.checkCompatibility(projectPath, options)
}

// Export additional utilities
export { SemVerParser }
