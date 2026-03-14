/**
 * Infrastructure as Code (IaC) Generator
 * 
 * Generates deployment configurations:
 * - Dockerfile
 * - docker-compose.yml
 * - Kubernetes manifests
 * - CI/CD pipelines
 * - Cloud deployment configs
 */

import fs from 'fs/promises'
import path from 'path'
import ZAI from 'z-ai-web-dev-sdk'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')

export interface IaCConfig {
  type: 'dockerfile' | 'docker-compose' | 'kubernetes' | 'github-actions' | 'vercel' | 'netlify'
  path: string
  content: string
}

export interface ProjectAnalysis {
  framework: string
  language: string
  runtime: string
  buildCommand: string
  startCommand: string
  installCommand: string
  port: number
  envVars: string[]
  dependencies: string[]
  hasDatabase: boolean
  databaseType?: string
  needsRedis: boolean
  nodeVersion: string
}

// Common configurations
const RUNTIME_CONFIGS = {
  node: {
    baseImage: 'node:20-alpine',
    packageManager: 'npm',
    lockFile: 'package-lock.json'
  },
  bun: {
    baseImage: 'oven/bun:1',
    packageManager: 'bun',
    lockFile: 'bun.lockb'
  },
  pnpm: {
    baseImage: 'node:20-alpine',
    packageManager: 'pnpm',
    lockFile: 'pnpm-lock.yaml'
  }
}

/**
 * Analyze project for IaC generation
 */
export async function analyzeProject(projectPath: string): Promise<ProjectAnalysis> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  // Default values
  const analysis: ProjectAnalysis = {
    framework: 'unknown',
    language: 'typescript',
    runtime: 'node',
    buildCommand: 'npm run build',
    startCommand: 'npm start',
    installCommand: 'npm install',
    port: 3000,
    envVars: [],
    dependencies: [],
    hasDatabase: false,
    needsRedis: false,
    nodeVersion: '20'
  }
  
  try {
    // Read package.json
    const pkgJson = JSON.parse(await fs.readFile(path.join(fullPath, 'package.json'), 'utf-8'))
    
    analysis.dependencies = Object.keys(pkgJson.dependencies || {})
    
    // Detect framework
    if (analysis.dependencies.includes('next')) {
      analysis.framework = 'nextjs'
      analysis.buildCommand = 'npm run build'
      analysis.startCommand = 'npm run start'
      analysis.port = 3000
    } else if (analysis.dependencies.includes('react')) {
      analysis.framework = 'react'
      analysis.buildCommand = 'npm run build'
      analysis.startCommand = 'npm run preview'
      analysis.port = 4173
    } else if (analysis.dependencies.includes('express')) {
      analysis.framework = 'express'
      analysis.buildCommand = 'npm run build'
      analysis.startCommand = 'npm run start'
      analysis.port = 3000
    } else if (analysis.dependencies.includes('fastify')) {
      analysis.framework = 'fastify'
      analysis.buildCommand = 'npm run build'
      analysis.startCommand = 'npm run start'
      analysis.port = 3000
    } else if (analysis.dependencies.includes('vue')) {
      analysis.framework = 'vue'
      analysis.buildCommand = 'npm run build'
      analysis.startCommand = 'npm run preview'
      analysis.port = 4173
    }
    
    // Detect database
    if (analysis.dependencies.includes('prisma') || analysis.dependencies.includes('@prisma/client')) {
      analysis.hasDatabase = true
      analysis.databaseType = 'postgresql'
    } else if (analysis.dependencies.includes('mongoose')) {
      analysis.hasDatabase = true
      analysis.databaseType = 'mongodb'
    } else if (analysis.dependencies.includes('pg')) {
      analysis.hasDatabase = true
      analysis.databaseType = 'postgresql'
    } else if (analysis.dependencies.includes('mysql2')) {
      analysis.hasDatabase = true
      analysis.databaseType = 'mysql'
    }
    
    // Detect Redis
    if (analysis.dependencies.includes('ioredis') || analysis.dependencies.includes('redis')) {
      analysis.needsRedis = true
    }
    
    // Detect runtime
    if (analysis.dependencies.includes('bun') || await fileExists(path.join(fullPath, 'bun.lockb'))) {
      analysis.runtime = 'bun'
      analysis.installCommand = 'bun install'
      analysis.buildCommand = analysis.buildCommand.replace('npm', 'bun')
      analysis.startCommand = analysis.startCommand.replace('npm', 'bun')
    } else if (await fileExists(path.join(fullPath, 'pnpm-lock.yaml'))) {
      analysis.runtime = 'pnpm'
      analysis.installCommand = 'pnpm install'
      analysis.buildCommand = analysis.buildCommand.replace('npm', 'pnpm')
      analysis.startCommand = analysis.startCommand.replace('npm', 'pnpm')
    }
    
    // Read env example
    try {
      const envExample = await fs.readFile(path.join(fullPath, '.env.example'), 'utf-8')
      analysis.envVars = envExample
        .split('\n')
        .filter(line => line.includes('=') && !line.startsWith('#'))
        .map(line => line.split('=')[0].trim())
    } catch {}
    
  } catch {}
  
  return analysis
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path)
    return true
  } catch {
    return false
  }
}

/**
 * Generate Dockerfile
 */
export function generateDockerfile(analysis: ProjectAnalysis): IaCConfig {
  const runtime = RUNTIME_CONFIGS[analysis.runtime as keyof typeof RUNTIME_CONFIGS] || RUNTIME_CONFIGS.node
  
  let dockerfile = `# Generated Dockerfile for ${analysis.framework}
FROM ${runtime.baseImage} AS base

WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
${analysis.runtime === 'bun' ? 'COPY bun.lockb ./' : ''}
RUN ${analysis.installCommand}

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
`

  // Add prisma generate if needed
  if (analysis.hasDatabase && analysis.databaseType === 'postgresql') {
    dockerfile += `RUN npx prisma generate
`
  }

  dockerfile += `RUN ${analysis.buildCommand}

# Production
FROM ${runtime.baseImage} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=${analysis.port}

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 ${analysis.framework}

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

${analysis.hasDatabase ? `# Copy prisma schema for migrations
COPY --from=builder /app/prisma ./prisma` : ''}

USER ${analysis.framework}

EXPOSE ${analysis.port}

CMD ["node", "server.js"]
`

  return {
    type: 'dockerfile',
    path: 'Dockerfile',
    content: dockerfile
  }
}

/**
 * Generate docker-compose.yml
 */
export function generateDockerCompose(analysis: ProjectAnalysis): IaCConfig {
  const services: string[] = []
  
  // Main app service
  services.push(`  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "${analysis.port}:${analysis.port}"
    environment:
      - NODE_ENV=production
${analysis.envVars.map(v => `      - ${v}=\${${v}}`).join('\n')}
    depends_on:
${analysis.hasDatabase ? '      - db\n' : ''}${analysis.needsRedis ? '      - redis\n' : ''}    restart: unless-stopped`)

  // Database service
  if (analysis.hasDatabase) {
    if (analysis.databaseType === 'postgresql') {
      services.push(`
  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=\${DB_USER:-postgres}
      - POSTGRES_PASSWORD=\${DB_PASSWORD:-postgres}
      - POSTGRES_DB=\${DB_NAME:-app}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped`)
    } else if (analysis.databaseType === 'mongodb') {
      services.push(`
  db:
    image: mongo:7
    environment:
      - MONGO_INITDB_ROOT_USERNAME=\${DB_USER:-mongo}
      - MONGO_INITDB_ROOT_PASSWORD=\${DB_PASSWORD:-mongo}
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"
    restart: unless-stopped`)
    } else if (analysis.databaseType === 'mysql') {
      services.push(`
  db:
    image: mysql:8
    environment:
      - MYSQL_ROOT_PASSWORD=\${DB_PASSWORD:-mysql}
      - MYSQL_DATABASE=\${DB_NAME:-app}
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    restart: unless-stopped`)
    }
  }

  // Redis service
  if (analysis.needsRedis) {
    services.push(`
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped`)
  }

  // Volumes
  const volumes: string[] = []
  if (analysis.hasDatabase) {
    if (analysis.databaseType === 'postgresql') volumes.push('  postgres_data:')
    if (analysis.databaseType === 'mongodb') volumes.push('  mongo_data:')
    if (analysis.databaseType === 'mysql') volumes.push('  mysql_data:')
  }
  if (analysis.needsRedis) volumes.push('  redis_data:')

  const compose = `version: '3.8'

services:
${services.join('\n')}

${volumes.length > 0 ? `volumes:\n${volumes.join('\n')}` : ''}
`

  return {
    type: 'docker-compose',
    path: 'docker-compose.yml',
    content: compose
  }
}

/**
 * Generate Kubernetes manifests
 */
export function generateKubernetes(analysis: ProjectAnalysis): IaCConfig[] {
  const configs: IaCConfig[] = []
  
  // Deployment
  const deployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${analysis.framework}-app
  labels:
    app: ${analysis.framework}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${analysis.framework}
  template:
    metadata:
      labels:
        app: ${analysis.framework}
    spec:
      containers:
      - name: app
        image: ${analysis.framework}-app:latest
        ports:
        - containerPort: ${analysis.port}
        env:
${analysis.envVars.map(v => `        - name: ${v}\n          valueFrom:\n            secretKeyRef:\n              name: app-secrets\n              key: ${v}`).join('\n')}
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: ${analysis.port}
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: ${analysis.port}
          initialDelaySeconds: 5
          periodSeconds: 5
`

  configs.push({
    type: 'kubernetes',
    path: 'k8s/deployment.yaml',
    content: deployment
  })
  
  // Service
  const service = `apiVersion: v1
kind: Service
metadata:
  name: ${analysis.framework}-service
spec:
  selector:
    app: ${analysis.framework}
  ports:
  - port: 80
    targetPort: ${analysis.port}
  type: LoadBalancer
`

  configs.push({
    type: 'kubernetes',
    path: 'k8s/service.yaml',
    content: service
  })
  
  // Ingress
  const ingress = `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${analysis.framework}-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${analysis.framework}-service
            port:
              number: 80
`

  configs.push({
    type: 'kubernetes',
    path: 'k8s/ingress.yaml',
    content: ingress
  })
  
  return configs
}

/**
 * Generate GitHub Actions workflow
 */
export function generateGitHubActions(analysis: ProjectAnalysis): IaCConfig {
  const workflow = `name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '${analysis.nodeVersion}'
        cache: '${analysis.runtime === 'pnpm' ? 'pnpm' : 'npm'}'
    
    ${analysis.runtime === 'pnpm' ? `- name: Setup pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 8` : ''}
    
    - name: Install dependencies
      run: ${analysis.installCommand}
    
    - name: Run tests
      run: npm test
      continue-on-error: true
    
    - name: Build
      run: ${analysis.buildCommand}
    
    - name: Build Docker image
      run: docker build -t \${{ secrets.DOCKER_REGISTRY }}/${analysis.framework}-app:\${{ github.sha }} .
    
    - name: Push to registry
      if: github.ref == 'refs/heads/main'
      run: docker push \${{ secrets.DOCKER_REGISTRY }}/${analysis.framework}-app:\${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to production
      run: |
        echo "Deploying to production..."
        # Add your deployment commands here
`

  return {
    type: 'github-actions',
    path: '.github/workflows/deploy.yml',
    content: workflow
  }
}

/**
 * Generate Vercel config
 */
export function generateVercelConfig(analysis: ProjectAnalysis): IaCConfig {
  const config = {
    buildCommand: analysis.buildCommand,
    devCommand: `${analysis.runtime === 'bun' ? 'bun' : 'npm'} run dev`,
    installCommand: analysis.installCommand,
    framework: analysis.framework === 'nextjs' ? 'nextjs' : null,
    regions: ['iad1'],
    env: analysis.envVars.reduce((acc, v) => {
      acc[v] = `\${${v}}`
      return acc
    }, {} as Record<string, string>)
  }

  return {
    type: 'vercel',
    path: 'vercel.json',
    content: JSON.stringify(config, null, 2)
  }
}

/**
 * Generate all IaC configs for a project
 */
export async function generateAllIaC(
  projectPath: string,
  options: {
    docker?: boolean
    kubernetes?: boolean
    githubActions?: boolean
    vercel?: boolean
  } = {}
): Promise<IaCConfig[]> {
  const configs: IaCConfig[] = []
  
  // Analyze project
  const analysis = await analyzeProject(projectPath)
  
  // Generate requested configs
  if (options.docker !== false) {
    configs.push(generateDockerfile(analysis))
    configs.push(generateDockerCompose(analysis))
    
    // Add .dockerignore
    configs.push({
      type: 'dockerfile',
      path: '.dockerignore',
      content: `node_modules
.next
.git
.gitignore
*.md
.env*
!.env.example
dist
build
coverage
.DS_Store
`
    })
  }
  
  if (options.kubernetes) {
    configs.push(...generateKubernetes(analysis))
  }
  
  if (options.githubActions !== false) {
    configs.push(generateGitHubActions(analysis))
  }
  
  if (options.vercel && analysis.framework === 'nextjs') {
    configs.push(generateVercelConfig(analysis))
  }
  
  return configs
}

/**
 * Write IaC configs to project
 */
export async function writeIaCConfigs(
  projectPath: string,
  configs: IaCConfig[]
): Promise<void> {
  const fullPath = path.join(WORKSPACE_DIR, projectPath)
  
  for (const config of configs) {
    const configPath = path.join(fullPath, config.path)
    await fs.mkdir(path.dirname(configPath), { recursive: true })
    await fs.writeFile(configPath, config.content, 'utf-8')
  }
}

/**
 * Generate production .env template
 */
export function generateEnvTemplate(analysis: ProjectAnalysis): string {
  const lines = [
    '# Production Environment Variables',
    '# Copy to .env and fill in values',
    '',
    '# App',
    'NODE_ENV=production',
    `PORT=${analysis.port}`,
    ''
  ]
  
  if (analysis.hasDatabase) {
    if (analysis.databaseType === 'postgresql') {
      lines.push(
        '# PostgreSQL',
        'DATABASE_URL=postgresql://user:password@localhost:5432/dbname',
        'DB_USER=postgres',
        'DB_PASSWORD=your_password',
        'DB_NAME=app',
        ''
      )
    } else if (analysis.databaseType === 'mongodb') {
      lines.push(
        '# MongoDB',
        'MONGODB_URI=mongodb://user:password@localhost:27017/dbname',
        ''
      )
    }
  }
  
  if (analysis.needsRedis) {
    lines.push(
      '# Redis',
      'REDIS_URL=redis://localhost:6379',
      ''
    )
  }
  
  lines.push(
    '# Security',
    'JWT_SECRET=your-super-secret-jwt-key-change-this',
    'NEXTAUTH_SECRET=your-nextauth-secret-change-this',
    '',
    '# External Services',
    'API_KEY=your_api_key',
    ''
  )
  
  return lines.join('\n')
}

/**
 * AI-powered IaC generation (uses LLM for custom configs)
 */
export async function aiGenerateIaC(
  projectPath: string,
  requirement: string
): Promise<IaCConfig> {
  const zai = await ZAI.create()
  const analysis = await analyzeProject(projectPath)
  
  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'assistant',
        content: `You are a DevOps expert. Generate infrastructure configuration based on project requirements.
Return ONLY the configuration file content, no explanations.

Project: ${analysis.framework}
Runtime: ${analysis.runtime}
Database: ${analysis.databaseType || 'none'}`
      },
      {
        role: 'user',
        content: requirement
      }
    ],
    thinking: { type: 'disabled' }
  })
  
  let content = completion.choices[0]?.message?.content || ''
  content = content.replace(/```(?:yaml|yml|json)?\n?/g, '').replace(/```/g, '')
  
  // Determine file type from content
  let fileType = 'yaml'
  if (content.trim().startsWith('{')) fileType = 'json'
  
  return {
    type: 'docker-compose',
    path: `infrastructure/config.${fileType}`,
    content: content.trim()
  }
}
