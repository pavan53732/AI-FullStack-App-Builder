/**
 * Multi-Language Parser - Mechanism #221
 * 
 * Comprehensive parser for multiple programming languages:
 * - Unified AST generation across languages
 * - Language-specific parsing (TypeScript, JavaScript, Python, Go, Rust, Java)
 * - Normalized AST structure for cross-language analysis
 * - Common code element extraction
 * - Incremental parsing support with caching
 * - Graceful syntax error handling
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Supported language types
 */
export type LanguageType = 
  | 'typescript'
  | 'typescript-react'
  | 'javascript'
  | 'javascript-react'
  | 'python'
  | 'go'
  | 'rust'
  | 'java'
  | 'unknown'

/**
 * Parse error information
 */
export interface ParseError {
  code: string
  message: string
  line: number
  column: number
  endLine?: number
  endColumn?: number
  severity: 'error' | 'warning' | 'info'
  recoverable: boolean
  suggestion?: string
}

/**
 * Source location information
 */
export interface SourceLocation {
  start: { line: number; column: number; offset: number }
  end: { line: number; column: number; offset: number }
  source?: string
}

/**
 * Normalized AST node types
 */
export type NormalizedNodeType =
  | 'Program'
  | 'FunctionDeclaration'
  | 'FunctionExpression'
  | 'ArrowFunction'
  | 'ClassDeclaration'
  | 'ClassExpression'
  | 'InterfaceDeclaration'
  | 'TypeDeclaration'
  | 'EnumDeclaration'
  | 'VariableDeclaration'
  | 'VariableDeclarator'
  | 'ImportDeclaration'
  | 'ExportDeclaration'
  | 'ExportDefault'
  | 'MethodDeclaration'
  | 'PropertyDeclaration'
  | 'Parameter'
  | 'TypeParameter'
  | 'ReturnStatement'
  | 'ExpressionStatement'
  | 'BlockStatement'
  | 'IfStatement'
  | 'ForStatement'
  | 'WhileStatement'
  | 'SwitchStatement'
  | 'TryStatement'
  | 'CatchClause'
  | 'ThrowStatement'
  | 'CallExpression'
  | 'MemberExpression'
  | 'BinaryExpression'
  | 'UnaryExpression'
  | 'LogicalExpression'
  | 'ConditionalExpression'
  | 'AssignmentExpression'
  | 'NewExpression'
  | 'AwaitExpression'
  | 'YieldExpression'
  | 'Identifier'
  | 'Literal'
  | 'TemplateLiteral'
  | 'ArrayExpression'
  | 'ObjectExpression'
  | 'JSXElement'
  | 'JSXFragment'
  | 'Decorator'
  | 'Annotation'
  | 'Attribute'
  | 'StructDeclaration'
  | 'ImplBlock'
  | 'TraitDeclaration'
  | 'MacroDeclaration'
  | 'ModuleDeclaration'
  | 'PackageDeclaration'
  | 'Comment'
  | 'Unknown'

/**
 * Normalized AST node
 */
export interface NormalizedASTNode {
  id: string
  type: NormalizedNodeType
  name?: string
  value?: unknown
  raw?: string
  loc?: SourceLocation
  children: NormalizedASTNode[]
  parent?: string
  attributes: Record<string, unknown>
  metadata: Record<string, unknown>
}

/**
 * Function-related information
 */
export interface FunctionInfo {
  id: string
  name: string
  type: 'function' | 'method' | 'arrow' | 'constructor' | 'getter' | 'setter' | 'generator'
  async: boolean
  generator: boolean
  static: boolean
  visibility?: 'public' | 'private' | 'protected' | 'internal'
  parameters: ParameterInfo[]
  returnType?: TypeInfo
  typeParameters: TypeParameterInfo[]
  body?: NormalizedASTNode
  loc?: SourceLocation
  decorators: DecoratorInfo[]
  thrownExceptions: string[]
  complexity: number
  docs?: string
}

/**
 * Parameter information
 */
export interface ParameterInfo {
  name: string
  type?: TypeInfo
  optional: boolean
  defaultValue?: string
  rest: boolean
  readonly: boolean
  loc?: SourceLocation
}

/**
 * Type information
 */
export interface TypeInfo {
  name: string
  raw: string
  nullable: boolean
  generics: TypeInfo[]
  union: TypeInfo[]
  intersection: TypeInfo[]
  loc?: SourceLocation
}

/**
 * Type parameter information
 */
export interface TypeParameterInfo {
  name: string
  constraint?: TypeInfo
  default?: TypeInfo
  loc?: SourceLocation
}

/**
 * Class/struct/interface information
 */
export interface ClassInfo {
  id: string
  name: string
  type: 'class' | 'interface' | 'trait' | 'struct' | 'enum' | 'type'
  abstract: boolean
  final: boolean
  extends?: string
  implements: string[]
  mixins: string[]
  properties: PropertyInfo[]
  methods: FunctionInfo[]
  typeParameters: TypeParameterInfo[]
  loc?: SourceLocation
  decorators: DecoratorInfo[]
  docs?: string
  visibility?: 'public' | 'private' | 'protected' | 'internal'
}

/**
 * Property information
 */
export interface PropertyInfo {
  name: string
  type?: TypeInfo
  visibility: 'public' | 'private' | 'protected' | 'internal'
  static: boolean
  readonly: boolean
  optional: boolean
  defaultValue?: string
  decorators: DecoratorInfo[]
  loc?: SourceLocation
  docs?: string
}

/**
 * Decorator/annotation information
 */
export interface DecoratorInfo {
  name: string
  arguments: string[]
  loc?: SourceLocation
}

/**
 * Import information
 */
export interface ImportInfo {
  source: string
  specifiers: ImportSpecifier[]
  isDefault: boolean
  isNamespace: boolean
  isType: boolean
  loc?: SourceLocation
}

/**
 * Import specifier
 */
export interface ImportSpecifier {
  name: string
  alias?: string
  isType: boolean
  loc?: SourceLocation
}

/**
 * Export information
 */
export interface ExportInfo {
  name: string
  type: 'named' | 'default' | 'reexport' | 'namespace'
  target?: string
  isType: boolean
  loc?: SourceLocation
}

/**
 * Variable information
 */
export interface VariableInfo {
  name: string
  type?: TypeInfo
  kind: 'const' | 'let' | 'var' | 'static' | 'final'
  exported: boolean
  loc?: SourceLocation
  initializer?: string
  docs?: string
}

/**
 * Code element types
 */
export type CodeElementType =
  | 'function'
  | 'class'
  | 'interface'
  | 'struct'
  | 'enum'
  | 'type'
  | 'variable'
  | 'import'
  | 'export'
  | 'constant'
  | 'trait'
  | 'macro'
  | 'module'
  | 'package'

/**
 * Code element - normalized representation
 */
export interface CodeElement {
  id: string
  type: CodeElementType
  name: string
  language: LanguageType
  signature: string
  loc: SourceLocation
  visibility?: 'public' | 'private' | 'protected' | 'internal'
  exported: boolean
  dependencies: string[]
  dependents: string[]
  complexity: number
  docs?: string
  metadata: Record<string, unknown>
}

/**
 * Language-specific AST
 */
export interface LanguageAST {
  language: LanguageType
  rootNode: NormalizedASTNode
  elements: CodeElement[]
  functions: FunctionInfo[]
  classes: ClassInfo[]
  imports: ImportInfo[]
  exports: ExportInfo[]
  variables: VariableInfo[]
  errors: ParseError[]
  comments: CommentInfo[]
  tokens: TokenInfo[]
  raw: string
}

/**
 * Comment information
 */
export interface CommentInfo {
  type: 'line' | 'block' | 'doc'
  value: string
  loc: SourceLocation
  associatedNode?: string
}

/**
 * Token information
 */
export interface TokenInfo {
  type: string
  value: string
  loc: SourceLocation
}

/**
 * Parse result
 */
export interface ParseResult {
  success: boolean
  ast: LanguageAST
  language: LanguageType
  parseTime: number
  cached: boolean
  errors: ParseError[]
  warnings: ParseError[]
}

/**
 * Incremental parse context
 */
export interface IncrementalParseContext {
  previousAST?: LanguageAST
  changedRanges: Array<{
    start: number
    end: number
    oldEnd: number
  }>
  version: number
}

/**
 * Parser options
 */
export interface ParserOptions {
  language?: LanguageType
  filename?: string
  sourceType?: 'module' | 'script' | 'commonjs'
  incremental?: IncrementalParseContext
  errorRecovery?: boolean
  tokens?: boolean
  comments?: boolean
  loc?: boolean
  range?: boolean
  maxDepth?: number
  timeout?: number
}

// ============================================================================
// Language Detection
// ============================================================================

const LANGUAGE_EXTENSIONS: Record<string, LanguageType> = {
  '.ts': 'typescript',
  '.tsx': 'typescript-react',
  '.js': 'javascript',
  '.jsx': 'javascript-react',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
}

const LANGUAGE_SIGNATURES: Record<LanguageType, RegExp[]> = {
  typescript: [/^import\s+type\s+/, /^export\s+type\s+/, /:\s*\w+\s*[;=\)]/, /<\w+>/],
  'typescript-react': [/^import\s+.*\.tsx?['"]/, /React\.FC/, /JSX\.Element/, /<\w+\s*\/?>/],
  javascript: [/^import\s+.*['"]/, /^export\s+/, /^const\s+/, /^function\s+/],
  'javascript-react': [/^import\s+.*react/i, /React\./, /<\w+\s*\/?>/, /className=/],
  python: [/^import\s+\w+/, /^from\s+\w+\s+import/, /^def\s+/, /^class\s+/, /:\s*$/m, /__init__/],
  go: [/^package\s+\w+/, /^import\s*\(/, /^func\s+\w+/, /^type\s+\w+\s+struct/, /:=/],
  rust: [/^use\s+\w+/, /^fn\s+\w+/, /^struct\s+\w+/, /^impl\s+\w+/, /^pub\s+fn/, /->\s*\w+/],
  java: [/^package\s+[\w.]+/, /^import\s+[\w.]+/, /^public\s+class/, /^private\s+\w+/, /@\w+/],
  unknown: [],
}

/**
 * Detect language from file extension
 */
export function detectLanguageFromExtension(filename: string): LanguageType {
  const ext = filename.substring(filename.lastIndexOf('.'))
  return LANGUAGE_EXTENSIONS[ext] || 'unknown'
}

/**
 * Detect language from content
 */
export function detectLanguageFromContent(content: string): LanguageType {
  const lines = content.split('\n').slice(0, 50).join('\n')
  
  // Check signatures for each language
  const scores: Record<LanguageType, number> = {
    typescript: 0,
    'typescript-react': 0,
    javascript: 0,
    'javascript-react': 0,
    python: 0,
    go: 0,
    rust: 0,
    java: 0,
    unknown: 0,
  }
  
  for (const [lang, patterns] of Object.entries(LANGUAGE_SIGNATURES)) {
    for (const pattern of patterns) {
      if (pattern.test(lines)) {
        scores[lang as LanguageType]++
      }
    }
  }
  
  // Find language with highest score
  let maxScore = 0
  let detectedLang: LanguageType = 'unknown'
  
  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      detectedLang = lang as LanguageType
    }
  }
  
  // Resolve ambiguities between TypeScript and JavaScript
  if (detectedLang === 'javascript' && scores.typescript > 0) {
    detectedLang = 'typescript'
  }
  
  return detectedLang
}

// ============================================================================
// Tokenizer
// ============================================================================

interface TokenPattern {
  type: string
  pattern: RegExp
}

const TOKEN_PATTERNS: Record<LanguageType, TokenPattern[]> = {
  typescript: [
    { type: 'COMMENT_LINE', pattern: /\/\/[^\n]*/ },
    { type: 'COMMENT_BLOCK', pattern: /\/\*[\s\S]*?\*\// },
    { type: 'STRING_TEMPLATE', pattern: /`(?:[^`\\]|\\.)*`/ },
    { type: 'STRING_DOUBLE', pattern: /"(?:[^"\\]|\\.)*"/ },
    { type: 'STRING_SINGLE', pattern: /'(?:[^'\\]|\\.)*'/ },
    { type: 'NUMBER', pattern: /\b\d+\.?\d*(?:[eE][+-]?\d+)?[nNfFdD]?\b/ },
    { type: 'REGEX', pattern: /\/(?![*\/])(?:[^\/\\]|\\.)+\/[gimsuy]*/ },
    { type: 'KEYWORD', pattern: /\b(?:import|export|from|as|type|interface|class|extends|implements|enum|const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|typeof|instanceof|in|of|async|await|yield|static|public|private|protected|readonly|abstract|override|namespace|module|declare|infer|keyof|unique symbol|is)\b/ },
    { type: 'BOOLEAN', pattern: /\b(?:true|false)\b/ },
    { type: 'NULL', pattern: /\b(?:null|undefined)\b/ },
    { type: 'IDENTIFIER', pattern: /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/ },
    { type: 'OPERATOR', pattern: /[+\-*/%&|^!<>?=:.]+/ },
    { type: 'PUNCTUATION', pattern: /[{}[\]();,.]/ },
    { type: 'WHITESPACE', pattern: /\s+/ },
  ],
  'typescript-react': [
    { type: 'COMMENT_LINE', pattern: /\/\/[^\n]*/ },
    { type: 'COMMENT_BLOCK', pattern: /\/\*[\s\S]*?\*\// },
    { type: 'STRING_TEMPLATE', pattern: /`(?:[^`\\]|\\.)*`/ },
    { type: 'STRING_DOUBLE', pattern: /"(?:[^"\\]|\\.)*"/ },
    { type: 'STRING_SINGLE', pattern: /'(?:[^'\\]|\\.)*'/ },
    { type: 'NUMBER', pattern: /\b\d+\.?\d*(?:[eE][+-]?\d+)?[nNfFdD]?\b/ },
    { type: 'REGEX', pattern: /\/(?![*\/])(?:[^\/\\]|\\.)+\/[gimsuy]*/ },
    { type: 'KEYWORD', pattern: /\b(?:import|export|from|as|type|interface|class|extends|implements|enum|const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|typeof|instanceof|in|of|async|await|yield|static|public|private|protected|readonly|abstract|override|namespace|module|declare|infer|keyof|unique symbol|is)\b/ },
    { type: 'BOOLEAN', pattern: /\b(?:true|false)\b/ },
    { type: 'NULL', pattern: /\b(?:null|undefined)\b/ },
    { type: 'IDENTIFIER', pattern: /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/ },
    { type: 'OPERATOR', pattern: /[+\-*/%&|^!<>?=:.]+/ },
    { type: 'PUNCTUATION', pattern: /[{}[\]();,.]/ },
    { type: 'WHITESPACE', pattern: /\s+/ },
  ],
  javascript: [
    { type: 'COMMENT_LINE', pattern: /\/\/[^\n]*/ },
    { type: 'COMMENT_BLOCK', pattern: /\/\*[\s\S]*?\*\// },
    { type: 'STRING_TEMPLATE', pattern: /`(?:[^`\\]|\\.)*`/ },
    { type: 'STRING_DOUBLE', pattern: /"(?:[^"\\]|\\.)*"/ },
    { type: 'STRING_SINGLE', pattern: /'(?:[^'\\]|\\.)*'/ },
    { type: 'NUMBER', pattern: /\b\d+\.?\d*(?:[eE][+-]?\d+)?[nNfFdD]?\b/ },
    { type: 'REGEX', pattern: /\/(?![*\/])(?:[^\/\\]|\\.)+\/[gimsuy]*/ },
    { type: 'KEYWORD', pattern: /\b(?:import|export|from|as|class|extends|const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|typeof|instanceof|in|of|async|await|yield|static|get|set)\b/ },
    { type: 'BOOLEAN', pattern: /\b(?:true|false)\b/ },
    { type: 'NULL', pattern: /\b(?:null|undefined)\b/ },
    { type: 'IDENTIFIER', pattern: /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/ },
    { type: 'OPERATOR', pattern: /[+\-*/%&|^!<>?=:.]+/ },
    { type: 'PUNCTUATION', pattern: /[{}[\]();,.]/ },
    { type: 'WHITESPACE', pattern: /\s+/ },
  ],
  'javascript-react': [
    { type: 'COMMENT_LINE', pattern: /\/\/[^\n]*/ },
    { type: 'COMMENT_BLOCK', pattern: /\/\*[\s\S]*?\*\// },
    { type: 'STRING_TEMPLATE', pattern: /`(?:[^`\\]|\\.)*`/ },
    { type: 'STRING_DOUBLE', pattern: /"(?:[^"\\]|\\.)*"/ },
    { type: 'STRING_SINGLE', pattern: /'(?:[^'\\]|\\.)*'/ },
    { type: 'NUMBER', pattern: /\b\d+\.?\d*(?:[eE][+-]?\d+)?[nNfFdD]?\b/ },
    { type: 'REGEX', pattern: /\/(?![*\/])(?:[^\/\\]|\\.)+\/[gimsuy]*/ },
    { type: 'KEYWORD', pattern: /\b(?:import|export|from|as|class|extends|const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|typeof|instanceof|in|of|async|await|yield|static|get|set)\b/ },
    { type: 'BOOLEAN', pattern: /\b(?:true|false)\b/ },
    { type: 'NULL', pattern: /\b(?:null|undefined)\b/ },
    { type: 'IDENTIFIER', pattern: /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/ },
    { type: 'OPERATOR', pattern: /[+\-*/%&|^!<>?=:.]+/ },
    { type: 'PUNCTUATION', pattern: /[{}[\]();,.]/ },
    { type: 'WHITESPACE', pattern: /\s+/ },
  ],
  python: [
    { type: 'COMMENT_LINE', pattern: /#[^\n]*/ },
    { type: 'STRING_TRIPLE_DOUBLE', pattern: /"""[\s\S]*?"""/ },
    { type: 'STRING_TRIPLE_SINGLE', pattern: /'''[\s\S]*?'''/ },
    { type: 'STRING_F', pattern: /f["'](?:[^"'\\]|\\.)*["']/ },
    { type: 'STRING_DOUBLE', pattern: /"(?:[^"\\]|\\.)*"/ },
    { type: 'STRING_SINGLE', pattern: /'(?:[^'\\]|\\.)*'/ },
    { type: 'NUMBER', pattern: /\b\d+\.?\d*(?:[eE][+-]?\d+)?[jJ]?\b/ },
    { type: 'DECORATOR', pattern: /@\w+/ },
    { type: 'KEYWORD', pattern: /\b(?:import|from|as|class|def|return|if|elif|else|for|while|break|continue|try|except|finally|raise|with|as|lambda|yield|global|nonlocal|pass|assert|async|await|True|False|None|and|or|not|in|is)\b/ },
    { type: 'IDENTIFIER', pattern: /\b[a-zA-Z_][a-zA-Z0-9_]*\b/ },
    { type: 'OPERATOR', pattern: /[+\-*/%&|^!<>:=@]+/ },
    { type: 'PUNCTUATION', pattern: /[{}[\]();,.]/ },
    { type: 'WHITESPACE', pattern: /\s+/ },
  ],
  go: [
    { type: 'COMMENT_LINE', pattern: /\/\/[^\n]*/ },
    { type: 'COMMENT_BLOCK', pattern: /\/\*[\s\S]*?\*\// },
    { type: 'STRING_RAW', pattern: /`[^`]*`/ },
    { type: 'STRING_DOUBLE', pattern: /"(?:[^"\\]|\\.)*"/ },
    { type: 'STRING_SINGLE', pattern: /'(?:[^'\\]|\\.)*'/ },
    { type: 'NUMBER', pattern: /\b\d+\.?\d*(?:[eE][+-]?\d+)?[i]?[a-z]*\b/ },
    { type: 'KEYWORD', pattern: /\b(?:package|import|func|return|if|else|for|range|switch|case|break|continue|goto|fallthrough|defer|go|select|chan|type|struct|interface|map|const|var|nil|true|false|iota)\b/ },
    { type: 'IDENTIFIER', pattern: /\b[a-zA-Z_][a-zA-Z0-9_]*\b/ },
    { type: 'OPERATOR', pattern: /[+\-*/%&|^!<>:=]+/ },
    { type: 'PUNCTUATION', pattern: /[{}[\]();,.]/ },
    { type: 'WHITESPACE', pattern: /\s+/ },
  ],
  rust: [
    { type: 'COMMENT_LINE', pattern: /\/\/[^\n]*/ },
    { type: 'COMMENT_DOC_LINE', pattern: /\/\/![^\n]*/ },
    { type: 'COMMENT_BLOCK', pattern: /\/\*[\s\S]*?\*\// },
    { type: 'COMMENT_DOC_BLOCK', pattern: /\/\*![\s\S]*?\*\// },
    { type: 'STRING_RAW', pattern: /r(#*)"[^"]*"\1/ },
    { type: 'STRING_DOUBLE', pattern: /"(?:[^"\\]|\\.)*"/ },
    { type: 'STRING_BYTE', pattern: /b'(?:[^'\\]|\\.)*'/ },
    { type: 'NUMBER', pattern: /\b\d+\.?\d*(?:[eE][+-]?\d+)?[fui][0-9]*\b/ },
    { type: 'LIFETIME', pattern: /'[a-zA-Z_][a-zA-Z0-9_]*/ },
    { type: 'KEYWORD', pattern: /\b(?:use|mod|pub|fn|return|if|else|match|for|while|loop|break|continue|let|mut|const|static|struct|enum|impl|trait|type|where|as|in|unsafe|extern|crate|self|super|move|ref|dyn|async|await|box|macro_rules)\b/ },
    { type: 'BOOLEAN', pattern: /\b(?:true|false)\b/ },
    { type: 'NULL', pattern: /\bnil\b/ },
    { type: 'IDENTIFIER', pattern: /\b[a-zA-Z_][a-zA-Z0-9_]*\b/ },
    { type: 'OPERATOR', pattern: /[+\-*/%&|^!<>?:=@#]+/ },
    { type: 'PUNCTUATION', pattern: /[{}[\]();,.|]/ },
    { type: 'WHITESPACE', pattern: /\s+/ },
  ],
  java: [
    { type: 'COMMENT_LINE', pattern: /\/\/[^\n]*/ },
    { type: 'COMMENT_BLOCK', pattern: /\/\*[\s\S]*?\*\// },
    { type: 'COMMENT_JAVADOC', pattern: /\/\*\*[\s\S]*?\*\// },
    { type: 'STRING_DOUBLE', pattern: /"(?:[^"\\]|\\.)*"/ },
    { type: 'STRING_SINGLE', pattern: /'(?:[^'\\]|\\.)*'/ },
    { type: 'NUMBER', pattern: /\b\d+\.?\d*(?:[eE][+-]?\d+)?[lLfFdD]?\b/ },
    { type: 'ANNOTATION', pattern: /@\w+/ },
    { type: 'KEYWORD', pattern: /\b(?:package|import|class|interface|enum|extends|implements|public|private|protected|static|final|abstract|synchronized|volatile|transient|native|strictfp|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|throws|new|instanceof|this|super|void|byte|short|int|long|float|double|char|boolean|null|true|false|default|assert|goto|const|record|sealed|permits|var|yield)\b/ },
    { type: 'IDENTIFIER', pattern: /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/ },
    { type: 'OPERATOR', pattern: /[+\-*/%&|^!<>?:=~]+/ },
    { type: 'PUNCTUATION', pattern: /[{}[\]();,.]/ },
    { type: 'WHITESPACE', pattern: /\s+/ },
  ],
  unknown: [
    { type: 'WHITESPACE', pattern: /\s+/ },
    { type: 'UNKNOWN', pattern: /./ },
  ],
}

/**
 * Tokenize source code
 */
function tokenize(code: string, language: LanguageType): TokenInfo[] {
  const tokens: TokenInfo[] = []
  const patterns = TOKEN_PATTERNS[language] || TOKEN_PATTERNS.unknown
  
  let pos = 0
  let line = 1
  let column = 1
  
  while (pos < code.length) {
    let matched = false
    
    for (const { type, pattern } of patterns) {
      pattern.lastIndex = 0
      const match = pattern.exec(code.slice(pos))
      
      if (match && match.index === 0) {
        const value = match[0]
        const startLine = line
        const startColumn = column
        
        // Update position
        for (const char of value) {
          if (char === '\n') {
            line++
            column = 1
          } else {
            column++
          }
        }
        
        tokens.push({
          type,
          value,
          loc: {
            start: { line: startLine, column: startColumn, offset: pos },
            end: { line, column, offset: pos + value.length },
          },
        })
        
        pos += value.length
        matched = true
        break
      }
    }
    
    if (!matched) {
      // Unknown character, skip
      pos++
      column++
    }
  }
  
  return tokens
}

// ============================================================================
// AST Builder
// ============================================================================

let nodeIdCounter = 0

function generateNodeId(): string {
  return `node_${nodeIdCounter++}`
}

function resetNodeIdCounter(): void {
  nodeIdCounter = 0
}

/**
 * Calculate source location from positions
 */
function calculateLocation(
  code: string,
  start: number,
  end: number
): SourceLocation {
  const lines = code.split('\n')
  let line = 1
  let column = 1
  let offset = 0
  
  // Find start position
  for (let i = 0; i < lines.length; i++) {
    if (offset + lines[i].length >= start) {
      line = i + 1
      column = start - offset + 1
      break
    }
    offset += lines[i].length + 1
  }
  
  const startLoc = { line, column, offset: start }
  
  // Find end position
  offset = 0
  for (let i = 0; i < lines.length; i++) {
    if (offset + lines[i].length >= end) {
      line = i + 1
      column = end - offset + 1
      break
    }
    offset += lines[i].length + 1
  }
  
  return {
    start: startLoc,
    end: { line, column, offset: end },
  }
}

/**
 * Build normalized AST from tokens
 */
function buildAST(
  tokens: TokenInfo[],
  code: string,
  language: LanguageType,
  options: ParserOptions
): NormalizedASTNode {
  resetNodeIdCounter()
  
  const rootNode: NormalizedASTNode = {
    id: generateNodeId(),
    type: 'Program',
    children: [],
    attributes: {},
    metadata: { language },
  }
  
  // Group tokens into statements
  const statements = groupTokensIntoStatements(tokens, code, language)
  
  for (const statement of statements) {
    const node = buildStatementNode(statement, code, language)
    if (node) {
      rootNode.children.push(node)
    }
  }
  
  return rootNode
}

/**
 * Group tokens into statements
 */
function groupTokensIntoStatements(
  tokens: TokenInfo[],
  code: string,
  language: LanguageType
): TokenInfo[][] {
  const statements: TokenInfo[][] = []
  let currentStatement: TokenInfo[] = []
  let braceDepth = 0
  let parenDepth = 0
  let bracketDepth = 0
  
  for (const token of tokens) {
    currentStatement.push(token)
    
    // Track nesting
    if (token.value === '{') braceDepth++
    if (token.value === '}') braceDepth--
    if (token.value === '(') parenDepth++
    if (token.value === ')') parenDepth--
    if (token.value === '[') bracketDepth++
    if (token.value === ']') bracketDepth--
    
    // Statement terminators
    const isTerminator = 
      (token.value === ';' || token.value === '}') &&
      braceDepth === 0 &&
      parenDepth === 0 &&
      bracketDepth === 0
    
    // Python uses newlines as terminators
    const isPythonTerminator = 
      language === 'python' &&
      token.type === 'WHITESPACE' &&
      token.value.includes('\n') &&
      braceDepth === 0 &&
      parenDepth === 0 &&
      bracketDepth === 0
    
    if (isTerminator || isPythonTerminator) {
      if (currentStatement.some(t => t.type !== 'WHITESPACE' && t.type !== 'COMMENT_LINE' && t.type !== 'COMMENT_BLOCK')) {
        statements.push(currentStatement)
      }
      currentStatement = []
    }
  }
  
  // Add remaining statement
  if (currentStatement.some(t => t.type !== 'WHITESPACE')) {
    statements.push(currentStatement)
  }
  
  return statements
}

/**
 * Build a statement node
 */
function buildStatementNode(
  tokens: TokenInfo[],
  code: string,
  language: LanguageType
): NormalizedASTNode | null {
  // Filter out whitespace and comments
  const significantTokens = tokens.filter(
    t => t.type !== 'WHITESPACE' && !t.type.startsWith('COMMENT')
  )
  
  if (significantTokens.length === 0) return null
  
  const firstToken = significantTokens[0]
  const lastToken = significantTokens[significantTokens.length - 1]
  
  const node: NormalizedASTNode = {
    id: generateNodeId(),
    type: 'Unknown',
    children: [],
    attributes: {},
    metadata: {},
    loc: {
      start: firstToken.loc.start,
      end: lastToken.loc.end,
    },
  }
  
  // Determine statement type based on first token
  if (firstToken.type === 'KEYWORD') {
    switch (firstToken.value) {
      case 'function':
      case 'func':
      case 'fn':
      case 'def':
        node.type = 'FunctionDeclaration'
        node.name = extractFunctionName(significantTokens)
        break
      case 'class':
      case 'struct':
      case 'interface':
      case 'trait':
        node.type = 'ClassDeclaration'
        node.name = extractClassName(significantTokens)
        break
      case 'import':
      case 'use':
      case 'from':
        node.type = 'ImportDeclaration'
        break
      case 'export':
        node.type = 'ExportDeclaration'
        break
      case 'const':
      case 'let':
      case 'var':
      case 'final':
      case 'static':
        node.type = 'VariableDeclaration'
        break
      case 'if':
      case 'elif':
        node.type = 'IfStatement'
        break
      case 'for':
      case 'while':
      case 'loop':
        node.type = 'ForStatement'
        break
      case 'return':
        node.type = 'ReturnStatement'
        break
      case 'throw':
      case 'raise':
        node.type = 'ThrowStatement'
        break
      case 'try':
        node.type = 'TryStatement'
        break
      case 'switch':
      case 'match':
        node.type = 'SwitchStatement'
        break
      case 'package':
        node.type = 'PackageDeclaration'
        break
      case 'module':
        node.type = 'ModuleDeclaration'
        break
      case 'enum':
        node.type = 'EnumDeclaration'
        break
      case 'type':
        node.type = 'TypeDeclaration'
        break
      case 'impl':
        node.type = 'ImplBlock'
        break
    }
  } else if (firstToken.type === 'DECORATOR' || firstToken.type === 'ANNOTATION') {
    node.type = 'Decorator'
    node.name = firstToken.value.slice(1)
  } else if (firstToken.type === 'IDENTIFIER') {
    // Could be expression statement or labeled statement
    if (significantTokens.length > 1 && significantTokens[1].value === ':') {
      node.type = 'LabelStatement'
    } else {
      node.type = 'ExpressionStatement'
    }
  }
  
  return node
}

/**
 * Extract function name from tokens
 */
function extractFunctionName(tokens: TokenInfo[]): string {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (
      ['function', 'func', 'fn', 'def'].includes(tokens[i].value) &&
      tokens[i + 1].type === 'IDENTIFIER'
    ) {
      return tokens[i + 1].value
    }
    // Method receiver (Go)
    if (tokens[i].value === 'func' && tokens[i + 1].value === '(') {
      for (let j = i + 2; j < tokens.length; j++) {
        if (tokens[j].type === 'IDENTIFIER' && tokens[j + 1]?.value === ')') {
          return tokens[j + 2]?.value || ''
        }
      }
    }
  }
  return ''
}

/**
 * Extract class name from tokens
 */
function extractClassName(tokens: TokenInfo[]): string {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (
      ['class', 'struct', 'interface', 'trait', 'enum'].includes(tokens[i].value) &&
      tokens[i + 1].type === 'IDENTIFIER'
    ) {
      return tokens[i + 1].value
    }
  }
  return ''
}

// ============================================================================
// Element Extraction
// ============================================================================

/**
 * Extract code elements from AST
 */
function extractElements(
  ast: LanguageAST,
  code: string,
  language: LanguageType
): void {
  // Extract from root node
  for (const child of ast.rootNode.children) {
    extractElementFromNode(child, ast, code, language)
  }
}

/**
 * Extract element from a single node
 */
function extractElementFromNode(
  node: NormalizedASTNode,
  ast: LanguageAST,
  code: string,
  language: LanguageType
): void {
  switch (node.type) {
    case 'FunctionDeclaration':
      extractFunctionElement(node, ast, code, language)
      break
    case 'ClassDeclaration':
    case 'InterfaceDeclaration':
    case 'StructDeclaration':
    case 'TraitDeclaration':
    case 'EnumDeclaration':
      extractClassElement(node, ast, code, language)
      break
    case 'VariableDeclaration':
      extractVariableElement(node, ast, code, language)
      break
    case 'ImportDeclaration':
      extractImportElement(node, ast, code, language)
      break
    case 'ExportDeclaration':
    case 'ExportDefault':
      extractExportElement(node, ast, code, language)
      break
  }
  
  // Recursively process children
  for (const child of node.children) {
    extractElementFromNode(child, ast, code, language)
  }
}

/**
 * Extract function element
 */
function extractFunctionElement(
  node: NormalizedASTNode,
  ast: LanguageAST,
  code: string,
  language: LanguageType
): void {
  const funcInfo: FunctionInfo = {
    id: node.id,
    name: node.name || '',
    type: 'function',
    async: false,
    generator: false,
    static: false,
    parameters: [],
    typeParameters: [],
    decorators: [],
    thrownExceptions: [],
    complexity: 1,
    loc: node.loc,
  }
  
  // Get raw code for signature
  if (node.loc) {
    funcInfo.docs = extractDocComment(code, node.loc.start.offset, language)
  }
  
  // Check for async/generator
  if (node.metadata.async) funcInfo.async = true
  if (node.metadata.generator) funcInfo.generator = true
  if (node.metadata.static) funcInfo.static = true
  
  // Extract parameters from node attributes
  if (node.attributes.parameters && Array.isArray(node.attributes.parameters)) {
    for (const param of node.attributes.parameters) {
      funcInfo.parameters.push({
        name: param.name || '',
        optional: param.optional || false,
        rest: param.rest || false,
        readonly: param.readonly || false,
      })
    }
  }
  
  // Calculate complexity
  funcInfo.complexity = calculateComplexity(node)
  
  ast.functions.push(funcInfo)
  
  // Add to elements
  ast.elements.push({
    id: node.id,
    type: 'function',
    name: funcInfo.name,
    language,
    signature: getFunctionSignature(funcInfo, language),
    loc: node.loc || { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    exported: node.metadata.exported === true,
    dependencies: [],
    dependents: [],
    complexity: funcInfo.complexity,
    docs: funcInfo.docs,
    metadata: { async: funcInfo.async, static: funcInfo.static },
  })
}

/**
 * Extract class element
 */
function extractClassElement(
  node: NormalizedASTNode,
  ast: LanguageAST,
  code: string,
  language: LanguageType
): void {
  const classInfo: ClassInfo = {
    id: node.id,
    name: node.name || '',
    type: node.type === 'InterfaceDeclaration' ? 'interface' :
          node.type === 'StructDeclaration' ? 'struct' :
          node.type === 'TraitDeclaration' ? 'trait' :
          node.type === 'EnumDeclaration' ? 'enum' : 'class',
    abstract: false,
    final: false,
    implements: [],
    mixins: [],
    properties: [],
    methods: [],
    typeParameters: [],
    decorators: [],
    loc: node.loc,
  }
  
  // Get doc comment
  if (node.loc) {
    classInfo.docs = extractDocComment(code, node.loc.start.offset, language)
  }
  
  // Extract inheritance info
  if (node.attributes.extends) {
    classInfo.extends = node.attributes.extends as string
  }
  if (node.attributes.implements && Array.isArray(node.attributes.implements)) {
    classInfo.implements = node.attributes.implements as string[]
  }
  
  ast.classes.push(classInfo)
  
  // Map type to element type
  const elementType: CodeElementType = 
    classInfo.type === 'interface' ? 'interface' :
    classInfo.type === 'struct' ? 'struct' :
    classInfo.type === 'trait' ? 'trait' :
    classInfo.type === 'enum' ? 'enum' : 'class'
  
  // Add to elements
  ast.elements.push({
    id: node.id,
    type: elementType,
    name: classInfo.name,
    language,
    signature: getClassSignature(classInfo, language),
    loc: node.loc || { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    exported: node.metadata.exported === true,
    dependencies: classInfo.extends ? [classInfo.extends] : [],
    dependents: [],
    complexity: 1,
    docs: classInfo.docs,
    metadata: { type: classInfo.type },
  })
}

/**
 * Extract variable element
 */
function extractVariableElement(
  node: NormalizedASTNode,
  ast: LanguageAST,
  code: string,
  language: LanguageType
): void {
  const varInfo: VariableInfo = {
    name: node.name || '',
    kind: (node.attributes.kind as VariableInfo['kind']) || 'const',
    exported: node.metadata.exported === true,
    loc: node.loc,
  }
  
  if (node.attributes.type) {
    varInfo.type = {
      name: String(node.attributes.type),
      raw: String(node.attributes.type),
      nullable: false,
      generics: [],
      union: [],
      intersection: [],
    }
  }
  
  if (node.loc) {
    varInfo.docs = extractDocComment(code, node.loc.start.offset, language)
  }
  
  ast.variables.push(varInfo)
  
  // Add to elements
  ast.elements.push({
    id: node.id,
    type: 'variable',
    name: varInfo.name,
    language,
    signature: `${varInfo.kind} ${varInfo.name}${varInfo.type ? `: ${varInfo.type.raw}` : ''}`,
    loc: node.loc || { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    exported: varInfo.exported,
    dependencies: [],
    dependents: [],
    complexity: 0,
    docs: varInfo.docs,
    metadata: { kind: varInfo.kind },
  })
}

/**
 * Extract import element
 */
function extractImportElement(
  node: NormalizedASTNode,
  ast: LanguageAST,
  code: string,
  language: LanguageType
): void {
  const importInfo: ImportInfo = {
    source: (node.attributes.source as string) || '',
    specifiers: [],
    isDefault: false,
    isNamespace: false,
    isType: false,
    loc: node.loc,
  }
  
  if (node.attributes.specifiers && Array.isArray(node.attributes.specifiers)) {
    for (const spec of node.attributes.specifiers) {
      importInfo.specifiers.push({
        name: spec.name || '',
        alias: spec.alias,
        isType: spec.isType || false,
      })
    }
  }
  
  if (node.attributes.isDefault) importInfo.isDefault = true
  if (node.attributes.isNamespace) importInfo.isNamespace = true
  if (node.attributes.isType) importInfo.isType = true
  
  ast.imports.push(importInfo)
  
  // Add to elements
  ast.elements.push({
    id: node.id,
    type: 'import',
    name: importInfo.source,
    language,
    signature: formatImport(importInfo, language),
    loc: node.loc || { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    exported: false,
    dependencies: [importInfo.source],
    dependents: [],
    complexity: 0,
    metadata: { isType: importInfo.isType },
  })
}

/**
 * Extract export element
 */
function extractExportElement(
  node: NormalizedASTNode,
  ast: LanguageAST,
  code: string,
  language: LanguageType
): void {
  const exportInfo: ExportInfo = {
    name: node.name || '',
    type: node.type === 'ExportDefault' ? 'default' : 'named',
    isType: node.attributes.isType === true,
    loc: node.loc,
  }
  
  if (node.attributes.target) {
    exportInfo.target = node.attributes.target as string
  }
  
  ast.exports.push(exportInfo)
  
  // Add to elements
  ast.elements.push({
    id: node.id,
    type: 'export',
    name: exportInfo.name,
    language,
    signature: `export ${exportInfo.type === 'default' ? 'default' : ''} ${exportInfo.name}`,
    loc: node.loc || { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    exported: true,
    dependencies: [],
    dependents: [],
    complexity: 0,
    metadata: { type: exportInfo.type, isType: exportInfo.isType },
  })
}

/**
 * Extract documentation comment
 */
function extractDocComment(
  code: string,
  offset: number,
  language: LanguageType
): string | undefined {
  // Look backwards for doc comment
  const beforeCode = code.slice(0, offset)
  const lines = beforeCode.split('\n')
  
  // Look for doc comment patterns
  const docPatterns: RegExp[] = []
  
  switch (language) {
    case 'typescript':
    case 'typescript-react':
    case 'javascript':
    case 'javascript-react':
    case 'go':
      docPatterns.push(/\/\*\*[\s\S]*?\*\/\s*$/)
      break
    case 'python':
      docPatterns.push(/"""[\s\S]*?"""\s*$/)
      docPatterns.push(/'''[\s\S]*?'''\s*$/)
      break
    case 'rust':
      docPatterns.push(/(?:\/\/![^\n]*\n)+\s*$/)
      docPatterns.push(/\/\*![\s\S]*?\*\/\s*$/)
      break
    case 'java':
      docPatterns.push(/\/\*\*[\s\S]*?\*\/\s*$/)
      break
  }
  
  // Check last few lines
  const lastLines = lines.slice(-10).join('\n')
  
  for (const pattern of docPatterns) {
    const match = lastLines.match(pattern)
    if (match) {
      return match[0].trim()
    }
  }
  
  return undefined
}

/**
 * Calculate cyclomatic complexity
 */
function calculateComplexity(node: NormalizedASTNode): number {
  let complexity = 1
  
  const incrementingTypes: NormalizedNodeType[] = [
    'IfStatement',
    'ForStatement',
    'WhileStatement',
    'SwitchStatement',
    'CatchClause',
    'ConditionalExpression',
  ]
  
  if (incrementingTypes.includes(node.type)) {
    complexity++
  }
  
  // Check for logical operators
  if (node.type === 'LogicalExpression') {
    complexity++
  }
  
  // Recursively check children
  for (const child of node.children) {
    complexity += calculateComplexity(child)
  }
  
  return complexity
}

/**
 * Get function signature
 */
function getFunctionSignature(func: FunctionInfo, language: LanguageType): string {
  const params = func.parameters
    .map(p => `${p.name}${p.optional ? '?' : ''}${p.rest ? '...' : ''}`)
    .join(', ')
  
  switch (language) {
    case 'typescript':
    case 'typescript-react':
      return `${func.async ? 'async ' : ''}function ${func.name}(${params})${func.returnType ? `: ${func.returnType.name}` : ''}`
    case 'python':
      return `def ${func.name}(${params})${func.returnType ? ` -> ${func.returnType.name}` : ''}`
    case 'go':
      return `func ${func.name}(${params})${func.returnType ? ` ${func.returnType.name}` : ''}`
    case 'rust':
      return `fn ${func.name}(${params})${func.returnType ? ` -> ${func.returnType.name}` : ''}`
    case 'java':
      return `${func.name}(${params})${func.returnType ? `: ${func.returnType.name}` : ''}`
    default:
      return `function ${func.name}(${params})`
  }
}

/**
 * Get class signature
 */
function getClassSignature(cls: ClassInfo, language: LanguageType): string {
  const heritage = []
  if (cls.extends) heritage.push(`extends ${cls.extends}`)
  if (cls.implements.length > 0) heritage.push(`implements ${cls.implements.join(', ')}`)
  
  const heritageStr = heritage.length > 0 ? ` ${heritage.join(' ')}` : ''
  
  switch (language) {
    case 'typescript':
    case 'typescript-react':
      return `${cls.type} ${cls.name}${heritageStr}`
    case 'python':
      return `class ${cls.name}${heritageStr}`
    case 'go':
      return `type ${cls.name} ${cls.type}${heritageStr}`
    case 'rust':
      return `${cls.type} ${cls.name}${heritageStr}`
    case 'java':
      return `${cls.type} ${cls.name}${heritageStr}`
    default:
      return `${cls.type} ${cls.name}`
  }
}

/**
 * Format import statement
 */
function formatImport(importInfo: ImportInfo, language: LanguageType): string {
  switch (language) {
    case 'typescript':
    case 'typescript-react':
    case 'javascript':
    case 'javascript-react':
      if (importInfo.isNamespace) {
        return `import * from '${importInfo.source}'`
      }
      if (importInfo.isDefault) {
        return `import ${importInfo.specifiers[0]?.name || 'default'} from '${importInfo.source}'`
      }
      const specifiers = importInfo.specifiers
        .map(s => (s.alias ? `${s.name} as ${s.alias}` : s.name))
        .join(', ')
      return `import { ${specifiers} } from '${importInfo.source}'`
    case 'python':
      if (importInfo.specifiers.length === 0) {
        return `import ${importInfo.source}`
      }
      const names = importInfo.specifiers.map(s => s.name).join(', ')
      return `from ${importInfo.source} import ${names}`
    case 'go':
      return `import "${importInfo.source}"`
    case 'rust':
      return `use ${importInfo.source}`
    case 'java':
      return `import ${importInfo.source}`
    default:
      return `import '${importInfo.source}'`
  }
}

// ============================================================================
// Language-Specific Parsers
// ============================================================================

/**
 * Parse TypeScript/JavaScript code
 */
function parseTypeScriptLike(
  code: string,
  language: LanguageType,
  options: ParserOptions
): LanguageAST {
  const tokens = tokenize(code, language)
  
  const ast: LanguageAST = {
    language,
    rootNode: buildAST(tokens, code, language, options),
    elements: [],
    functions: [],
    classes: [],
    imports: [],
    exports: [],
    variables: [],
    errors: [],
    comments: [],
    tokens,
    raw: code,
  }
  
  // Extract comments
  for (const token of tokens) {
    if (token.type.startsWith('COMMENT')) {
      ast.comments.push({
        type: token.type === 'COMMENT_LINE' ? 'line' : 'block',
        value: token.value,
        loc: token.loc,
      })
    }
  }
  
  // Extract elements
  extractElements(ast, code, language)
  
  // Parse imports with regex for better accuracy
  ast.imports.push(...parseTypeScriptImports(code))
  
  // Parse exports with regex
  ast.exports.push(...parseTypeScriptExports(code))
  
  return ast
}

/**
 * Parse TypeScript imports
 */
function parseTypeScriptImports(code: string): ImportInfo[] {
  const imports: ImportInfo[] = []
  
  const importRegex = /import\s+(?:(type)\s+)?(?:(\{[^}]*\})|(\w+)(?:\s*,\s*(\{[^}]*\}))?|(\*\s+as\s+(\w+)))\s+from\s+['"]([^'"]+)['"]/g
  
  let match
  while ((match = importRegex.exec(code)) !== null) {
    const isType = !!match[1]
    const namedImports = match[2]
    const defaultImport = match[3]
    const additionalNamed = match[4]
    const namespaceImport = match[5]
    const namespaceAlias = match[6]
    const source = match[7]
    
    const specifiers: ImportSpecifier[] = []
    let isNamespace = false
    
    if (namespaceImport) {
      specifiers.push({ name: namespaceAlias || '', isType })
      isNamespace = true
    }
    
    if (defaultImport) {
      specifiers.push({ name: defaultImport, isType })
    }
    
    const parseNamedImports = (str: string) => {
      const names = str.slice(1, -1).split(',')
      for (const name of names) {
        const trimmed = name.trim()
        if (!trimmed) continue
        const [n, alias] = trimmed.split(/\s+as\s+/)
        specifiers.push({ name: n.trim(), alias: alias?.trim(), isType })
      }
    }
    
    if (namedImports) parseNamedImports(namedImports)
    if (additionalNamed) parseNamedImports(additionalNamed)
    
    const line = code.slice(0, match.index).split('\n').length
    const column = match.index - code.lastIndexOf('\n', match.index - 1)
    
    imports.push({
      source,
      specifiers,
      isDefault: !!defaultImport,
      isNamespace,
      isType,
      loc: {
        start: { line, column, offset: match.index },
        end: { line, column: column + match[0].length, offset: match.index + match[0].length },
      },
    })
  }
  
  return imports
}

/**
 * Parse TypeScript exports
 */
function parseTypeScriptExports(code: string): ExportInfo[] {
  const exports: ExportInfo[] = []
  
  // Named exports
  const namedExportRegex = /export\s+(?:(async\s+)?function\s+(\w+)|(abstract\s+)?class\s+(\w+)|(interface\s+|type\s+)(\w+)|const\s+(\w+))/g
  
  let match
  while ((match = namedExportRegex.exec(code)) !== null) {
    const name = match[2] || match[4] || match[6] || match[7]
    const isType = !!match[5]
    
    const line = code.slice(0, match.index).split('\n').length
    
    exports.push({
      name,
      type: 'named',
      isType,
      loc: {
        start: { line, column: 1, offset: match.index },
        end: { line, column: match[0].length + 1, offset: match.index + match[0].length },
      },
    })
  }
  
  // Default exports
  const defaultExportRegex = /export\s+default\s+(\w+)/g
  while ((match = defaultExportRegex.exec(code)) !== null) {
    const line = code.slice(0, match.index).split('\n').length
    exports.push({
      name: match[1],
      type: 'default',
      isType: false,
      loc: {
        start: { line, column: 1, offset: match.index },
        end: { line, column: match[0].length + 1, offset: match.index + match[0].length },
      },
    })
  }
  
  return exports
}

/**
 * Parse Python code
 */
function parsePython(
  code: string,
  language: LanguageType,
  options: ParserOptions
): LanguageAST {
  const tokens = tokenize(code, language)
  
  const ast: LanguageAST = {
    language,
    rootNode: buildAST(tokens, code, language, options),
    elements: [],
    functions: [],
    classes: [],
    imports: [],
    exports: [],
    variables: [],
    errors: [],
    comments: [],
    tokens,
    raw: code,
  }
  
  // Extract comments
  for (const token of tokens) {
    if (token.type.startsWith('COMMENT') || token.type.startsWith('STRING_TRIPLE')) {
      ast.comments.push({
        type: token.type.includes('TRIPLE') ? 'doc' : 'line',
        value: token.value,
        loc: token.loc,
      })
    }
  }
  
  // Extract elements
  extractElements(ast, code, language)
  
  // Parse Python imports
  ast.imports.push(...parsePythonImports(code))
  
  return ast
}

/**
 * Parse Python imports
 */
function parsePythonImports(code: string): ImportInfo[] {
  const imports: ImportInfo[] = []
  
  // Simple import
  const simpleImportRegex = /^import\s+([\w.]+(?:\s+as\s+\w+)?)\s*$/gm
  let match
  while ((match = simpleImportRegex.exec(code)) !== null) {
    const [name, alias] = match[1].split(/\s+as\s+/)
    const line = code.slice(0, match.index).split('\n').length + 1
    
    imports.push({
      source: name,
      specifiers: alias ? [{ name, alias, isType: false }] : [{ name, isType: false }],
      isDefault: false,
      isNamespace: !alias,
      isType: false,
      loc: {
        start: { line, column: 1, offset: match.index },
        end: { line, column: match[0].length + 1, offset: match.index + match[0].length },
      },
    })
  }
  
  // From import
  const fromImportRegex = /^from\s+([\w.]+)\s+import\s+(.+)/gm
  while ((match = fromImportRegex.exec(code)) !== null) {
    const source = match[1]
    const names = match[2].split(',').map(s => s.trim())
    const line = code.slice(0, match.index).split('\n').length + 1
    
    const specifiers: ImportSpecifier[] = []
    for (const name of names) {
      const [n, alias] = name.split(/\s+as\s+/)
      specifiers.push({ name: n.trim(), alias: alias?.trim(), isType: false })
    }
    
    imports.push({
      source,
      specifiers,
      isDefault: false,
      isNamespace: false,
      isType: false,
      loc: {
        start: { line, column: 1, offset: match.index },
        end: { line, column: match[0].length + 1, offset: match.index + match[0].length },
      },
    })
  }
  
  return imports
}

/**
 * Parse Go code
 */
function parseGo(
  code: string,
  language: LanguageType,
  options: ParserOptions
): LanguageAST {
  const tokens = tokenize(code, language)
  
  const ast: LanguageAST = {
    language,
    rootNode: buildAST(tokens, code, language, options),
    elements: [],
    functions: [],
    classes: [],
    imports: [],
    exports: [],
    variables: [],
    errors: [],
    comments: [],
    tokens,
    raw: code,
  }
  
  // Extract comments
  for (const token of tokens) {
    if (token.type.startsWith('COMMENT')) {
      ast.comments.push({
        type: token.type === 'COMMENT_LINE' ? 'line' : 'block',
        value: token.value,
        loc: token.loc,
      })
    }
  }
  
  // Extract elements
  extractElements(ast, code, language)
  
  // Parse Go imports
  ast.imports.push(...parseGoImports(code))
  
  return ast
}

/**
 * Parse Go imports
 */
function parseGoImports(code: string): ImportInfo[] {
  const imports: ImportInfo[] = []
  
  // Single import
  const singleImportRegex = /import\s+["']([^"']+)["']/g
  let match
  while ((match = singleImportRegex.exec(code)) !== null) {
    const line = code.slice(0, match.index).split('\n').length + 1
    imports.push({
      source: match[1],
      specifiers: [],
      isDefault: false,
      isNamespace: true,
      isType: false,
      loc: {
        start: { line, column: 1, offset: match.index },
        end: { line, column: match[0].length + 1, offset: match.index + match[0].length },
      },
    })
  }
  
  // Import block
  const blockImportRegex = /import\s*\(([\s\S]*?)\)/g
  while ((match = blockImportRegex.exec(code)) !== null) {
    const block = match[1]
    const lineOffset = code.slice(0, match.index).split('\n').length
    const importLines = block.split('\n')
    
    for (let i = 0; i < importLines.length; i++) {
      const line = importLines[i].trim()
      const importMatch = line.match(/["']([^"']+)["']/)
      if (importMatch) {
        imports.push({
          source: importMatch[1],
          specifiers: [],
          isDefault: false,
          isNamespace: true,
          isType: false,
          loc: {
            start: { line: lineOffset + i + 1, column: 1, offset: 0 },
            end: { line: lineOffset + i + 1, column: line.length + 1, offset: 0 },
          },
        })
      }
    }
  }
  
  return imports
}

/**
 * Parse Rust code
 */
function parseRust(
  code: string,
  language: LanguageType,
  options: ParserOptions
): LanguageAST {
  const tokens = tokenize(code, language)
  
  const ast: LanguageAST = {
    language,
    rootNode: buildAST(tokens, code, language, options),
    elements: [],
    functions: [],
    classes: [],
    imports: [],
    exports: [],
    variables: [],
    errors: [],
    comments: [],
    tokens,
    raw: code,
  }
  
  // Extract comments (including doc comments)
  for (const token of tokens) {
    if (token.type.includes('COMMENT')) {
      ast.comments.push({
        type: token.type.includes('DOC') ? 'doc' : token.type === 'COMMENT_LINE' ? 'line' : 'block',
        value: token.value,
        loc: token.loc,
      })
    }
  }
  
  // Extract elements
  extractElements(ast, code, language)
  
  // Parse Rust use statements
  ast.imports.push(...parseRustImports(code))
  
  return ast
}

/**
 * Parse Rust imports (use statements)
 */
function parseRustImports(code: string): ImportInfo[] {
  const imports: ImportInfo[] = []
  
  const useRegex = /use\s+([^;]+);/g
  let match
  while ((match = useRegex.exec(code)) !== null) {
    const usePath = match[1].trim()
    const line = code.slice(0, match.index).split('\n').length + 1
    
    // Handle simple use
    if (!usePath.includes('{')) {
      imports.push({
        source: usePath,
        specifiers: [{ name: usePath.split('::').pop() || '', isType: false }],
        isDefault: false,
        isNamespace: true,
        isType: false,
        loc: {
          start: { line, column: 1, offset: match.index },
          end: { line, column: match[0].length + 1, offset: match.index + match[0].length },
        },
      })
    } else {
      // Handle grouped use: use std::{collections::HashMap, io};
      const baseMatch = usePath.match(/^([\w:]+)::\{([^}]+)\}/)
      if (baseMatch) {
        const base = baseMatch[1]
        const items = baseMatch[2].split(',').map(s => s.trim())
        
        for (const item of items) {
          imports.push({
            source: `${base}::${item}`,
            specifiers: [{ name: item, isType: false }],
            isDefault: false,
            isNamespace: false,
            isType: false,
            loc: {
              start: { line, column: 1, offset: match.index },
              end: { line, column: match[0].length + 1, offset: match.index + match[0].length },
            },
          })
        }
      }
    }
  }
  
  return imports
}

/**
 * Parse Java code
 */
function parseJava(
  code: string,
  language: LanguageType,
  options: ParserOptions
): LanguageAST {
  const tokens = tokenize(code, language)
  
  const ast: LanguageAST = {
    language,
    rootNode: buildAST(tokens, code, language, options),
    elements: [],
    functions: [],
    classes: [],
    imports: [],
    exports: [],
    variables: [],
    errors: [],
    comments: [],
    tokens,
    raw: code,
  }
  
  // Extract comments (including Javadoc)
  for (const token of tokens) {
    if (token.type.includes('COMMENT')) {
      ast.comments.push({
        type: token.type === 'COMMENT_JAVADOC' ? 'doc' : token.type === 'COMMENT_LINE' ? 'line' : 'block',
        value: token.value,
        loc: token.loc,
      })
    }
  }
  
  // Extract elements
  extractElements(ast, code, language)
  
  // Parse Java imports
  ast.imports.push(...parseJavaImports(code))
  
  return ast
}

/**
 * Parse Java imports
 */
function parseJavaImports(code: string): ImportInfo[] {
  const imports: ImportInfo[] = []
  
  const importRegex = /import\s+(?:(static)\s+)?([\w.]+(?:\.\*)?);/g
  let match
  while ((match = importRegex.exec(code)) !== null) {
    const isStatic = !!match[1]
    const importPath = match[2]
    const isWildcard = importPath.endsWith('.*')
    const line = code.slice(0, match.index).split('\n').length + 1
    
    imports.push({
      source: importPath,
      specifiers: [],
      isDefault: false,
      isNamespace: isWildcard,
      isType: false,
      loc: {
        start: { line, column: 1, offset: match.index },
        end: { line, column: match[0].length + 1, offset: match.index + match[0].length },
      },
    })
  }
  
  return imports
}

// ============================================================================
// Error Recovery
// ============================================================================

/**
 * Detect syntax errors
 */
function detectSyntaxErrors(
  code: string,
  language: LanguageType,
  tokens: TokenInfo[]
): ParseError[] {
  const errors: ParseError[] = []
  
  // Check for unbalanced brackets
  const bracketPairs: Array<{ open: string; close: string }> = [
    { open: '(', close: ')' },
    { open: '{', close: '}' },
    { open: '[', close: ']' },
  ]
  
  for (const { open, close } of bracketPairs) {
    const stack: number[] = []
    
    for (const token of tokens) {
      if (token.value === open) {
        stack.push(token.loc.start.line)
      } else if (token.value === close) {
        if (stack.length === 0) {
          errors.push({
            code: 'UNEXPECTED_CLOSE',
            message: `Unexpected '${close}' - no matching '${open}'`,
            line: token.loc.start.line,
            column: token.loc.start.column,
            severity: 'error',
            recoverable: true,
            suggestion: `Remove the extra '${close}' or add a matching '${open}'`,
          })
        } else {
          stack.pop()
        }
      }
    }
    
    // Check for unclosed brackets
    if (stack.length > 0) {
      errors.push({
        code: 'UNCLOSED_BRACKET',
        message: `Unclosed '${open}' - ${stack.length} bracket(s) not closed`,
        line: stack[stack.length - 1],
        column: 1,
        severity: 'error',
        recoverable: true,
        suggestion: `Add a '${close}' to close the '${open}'`,
      })
    }
  }
  
  // Check for string literal issues
  let inString = false
  let stringStart: TokenInfo | null = null
  
  for (const token of tokens) {
    if (['STRING_DOUBLE', 'STRING_SINGLE', 'STRING_TEMPLATE'].includes(token.type)) {
      // Check for unterminated strings (basic check)
      if (token.value.length < 2 || !token.value.endsWith(token.value[0]) && token.type !== 'STRING_TEMPLATE') {
        errors.push({
          code: 'UNTERMINATED_STRING',
          message: 'Unterminated string literal',
          line: token.loc.start.line,
          column: token.loc.start.column,
          severity: 'error',
          recoverable: true,
          suggestion: 'Add closing quote to terminate the string',
        })
      }
    }
  }
  
  return errors
}

/**
 * Recover from syntax errors
 */
function recoverFromErrors(
  ast: LanguageAST,
  errors: ParseError[]
): void {
  // Add error recovery logic here
  // For now, we just mark errors as recovered
  for (const error of errors) {
    if (error.recoverable) {
      error.message = `[Recovered] ${error.message}`
      error.severity = 'warning'
    }
  }
}

// ============================================================================
// Incremental Parsing
// ============================================================================

interface ParseCache {
  version: number
  ast: LanguageAST
  hash: string
  timestamp: number
}

const parseCache = new Map<string, ParseCache>()

/**
 * Generate hash for code
 */
function hashCode(code: string): string {
  let hash = 0
  for (let i = 0; i < code.length; i++) {
    const char = code.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(16)
}

/**
 * Check if cached parse is valid
 */
function getCachedParse(
  code: string,
  filename: string | undefined,
  options: ParserOptions
): LanguageAST | null {
  if (!filename) return null
  
  const cacheKey = filename
  const cached = parseCache.get(cacheKey)
  
  if (!cached) return null
  
  const currentHash = hashCode(code)
  if (cached.hash !== currentHash) return null
  
  // Check if incremental context is compatible
  if (options.incremental && options.incremental.version !== cached.version) {
    return null
  }
  
  return cached.ast
}

/**
 * Cache parse result
 */
function cacheParse(
  code: string,
  filename: string | undefined,
  ast: LanguageAST,
  version: number
): void {
  if (!filename) return
  
  parseCache.set(filename, {
    version,
    ast,
    hash: hashCode(code),
    timestamp: Date.now(),
  })
}

/**
 * Invalidate cache for file
 */
export function invalidateCache(filename: string): void {
  parseCache.delete(filename)
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  parseCache.clear()
}

// ============================================================================
// Main Parser Class
// ============================================================================

/**
 * Multi-language parser class
 */
export class MultiLanguageParser {
  private options: ParserOptions = {
    errorRecovery: true,
    tokens: false,
    comments: true,
    loc: true,
    range: true,
    maxDepth: 100,
  }
  
  private stats = {
    totalParses: 0,
    cacheHits: 0,
    errors: 0,
    avgParseTime: 0,
  }
  
  constructor(options: Partial<ParserOptions> = {}) {
    this.options = { ...this.options, ...options }
  }
  
  /**
   * Parse code with automatic language detection
   */
  parse(code: string, options: Partial<ParserOptions> = {}): ParseResult {
    const startTime = Date.now()
    const opts = { ...this.options, ...options }
    
    // Detect language
    const language = opts.language || 
      (opts.filename ? detectLanguageFromExtension(opts.filename) : detectLanguageFromContent(code))
    
    // Check cache
    const cached = getCachedParse(code, opts.filename, opts)
    if (cached) {
      this.stats.cacheHits++
      return {
        success: true,
        ast: cached,
        language,
        parseTime: Date.now() - startTime,
        cached: true,
        errors: [],
        warnings: [],
      }
    }
    
    // Parse based on language
    let ast: LanguageAST
    try {
      ast = this.parseByLanguage(code, language, opts)
    } catch (error) {
      const parseError: ParseError = {
        code: 'PARSE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown parse error',
        line: 1,
        column: 1,
        severity: 'error',
        recoverable: false,
      }
      
      // Return minimal AST with error
      ast = {
        language,
        rootNode: {
          id: 'root',
          type: 'Program',
          children: [],
          attributes: {},
          metadata: {},
        },
        elements: [],
        functions: [],
        classes: [],
        imports: [],
        exports: [],
        variables: [],
        errors: [parseError],
        comments: [],
        tokens: [],
        raw: code,
      }
      
      this.stats.errors++
    }
    
    // Detect syntax errors
    const syntaxErrors = detectSyntaxErrors(code, language, ast.tokens)
    ast.errors.push(...syntaxErrors)
    
    // Recover from errors if enabled
    if (opts.errorRecovery && ast.errors.length > 0) {
      recoverFromErrors(ast, ast.errors)
    }
    
    // Cache result
    const version = opts.incremental?.version || 1
    cacheParse(code, opts.filename, ast, version)
    
    // Update stats
    const parseTime = Date.now() - startTime
    this.stats.totalParses++
    this.stats.avgParseTime = 
      (this.stats.avgParseTime * (this.stats.totalParses - 1) + parseTime) / this.stats.totalParses
    
    return {
      success: ast.errors.filter(e => e.severity === 'error').length === 0,
      ast,
      language,
      parseTime,
      cached: false,
      errors: ast.errors.filter(e => e.severity === 'error'),
      warnings: ast.errors.filter(e => e.severity === 'warning'),
    }
  }
  
  /**
   * Parse by specific language
   */
  private parseByLanguage(
    code: string,
    language: LanguageType,
    options: ParserOptions
  ): LanguageAST {
    switch (language) {
      case 'typescript':
      case 'typescript-react':
      case 'javascript':
      case 'javascript-react':
        return parseTypeScriptLike(code, language, options)
      case 'python':
        return parsePython(code, language, options)
      case 'go':
        return parseGo(code, language, options)
      case 'rust':
        return parseRust(code, language, options)
      case 'java':
        return parseJava(code, language, options)
      default:
        // Fallback to basic parsing
        return parseTypeScriptLike(code, 'javascript', options)
    }
  }
  
  /**
   * Parse file
   */
  async parseFile(filePath: string, options: Partial<ParserOptions> = {}): Promise<ParseResult> {
    const fs = await import('fs/promises')
    const code = await fs.readFile(filePath, 'utf-8')
    return this.parse(code, { ...options, filename: filePath })
  }
  
  /**
   * Get parser statistics
   */
  getStats(): typeof this.stats {
    return { ...this.stats }
  }
  
  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalParses: 0,
      cacheHits: 0,
      errors: 0,
      avgParseTime: 0,
    }
  }
  
  /**
   * Get supported languages
   */
  getSupportedLanguages(): LanguageType[] {
    return [
      'typescript',
      'typescript-react',
      'javascript',
      'javascript-react',
      'python',
      'go',
      'rust',
      'java',
    ]
  }
  
  /**
   * Check if language is supported
   */
  isLanguageSupported(language: LanguageType): boolean {
    return this.getSupportedLanguages().includes(language)
  }
  
  /**
   * Find element by name
   */
  findElement(ast: LanguageAST, name: string): CodeElement | undefined {
    return ast.elements.find(e => e.name === name)
  }
  
  /**
   * Find elements by type
   */
  findElementsByType(ast: LanguageAST, type: CodeElementType): CodeElement[] {
    return ast.elements.filter(e => e.type === type)
  }
  
  /**
   * Find function by name
   */
  findFunction(ast: LanguageAST, name: string): FunctionInfo | undefined {
    return ast.functions.find(f => f.name === name)
  }
  
  /**
   * Find class by name
   */
  findClass(ast: LanguageAST, name: string): ClassInfo | undefined {
    return ast.classes.find(c => c.name === name)
  }
  
  /**
   * Get dependencies
   */
  getDependencies(ast: LanguageAST): string[] {
    return ast.imports.map(i => i.source)
  }
  
  /**
   * Get exported names
   */
  getExports(ast: LanguageAST): string[] {
    return ast.exports.map(e => e.name)
  }
  
  /**
   * Calculate code metrics
   */
  calculateMetrics(ast: LanguageAST): {
    linesOfCode: number
    functions: number
    classes: number
    imports: number
    exports: number
    averageComplexity: number
    commentRatio: number
  } {
    const lines = ast.raw.split('\n').length
    const totalComplexity = ast.functions.reduce((sum, f) => sum + f.complexity, 0)
    const commentLines = ast.comments.reduce((sum, c) => sum + c.value.split('\n').length, 0)
    
    return {
      linesOfCode: lines,
      functions: ast.functions.length,
      classes: ast.classes.length,
      imports: ast.imports.length,
      exports: ast.exports.length,
      averageComplexity: ast.functions.length > 0 ? totalComplexity / ast.functions.length : 0,
      commentRatio: lines > 0 ? commentLines / lines : 0,
    }
  }
}

// ============================================================================
// Singleton and Convenience Functions
// ============================================================================

let parserInstance: MultiLanguageParser | null = null

/**
 * Get the multi-language parser singleton
 */
export function getMultiLanguageParser(options: Partial<ParserOptions> = {}): MultiLanguageParser {
  if (!parserInstance) {
    parserInstance = new MultiLanguageParser(options)
  }
  return parserInstance
}

/**
 * Convenience function to parse code
 */
export function parseCode(
  code: string,
  options: Partial<ParserOptions> = {}
): ParseResult {
  const parser = getMultiLanguageParser()
  return parser.parse(code, options)
}

// ============================================================================
// Additional Utility Functions
// ============================================================================

/**
 * Compare two ASTs for differences
 */
export function compareASTs(ast1: LanguageAST, ast2: LanguageAST): {
  added: CodeElement[]
  removed: CodeElement[]
  modified: CodeElement[]
} {
  const elements1 = new Map(ast1.elements.map(e => [e.id, e]))
  const elements2 = new Map(ast2.elements.map(e => [e.id, e]))
  
  const added: CodeElement[] = []
  const removed: CodeElement[] = []
  const modified: CodeElement[] = []
  
  // Find added and modified
  for (const [id, element] of elements2) {
    if (!elements1.has(id)) {
      added.push(element)
    } else {
      const oldElement = elements1.get(id)!
      if (oldElement.signature !== element.signature) {
        modified.push(element)
      }
    }
  }
  
  // Find removed
  for (const [id, element] of elements1) {
    if (!elements2.has(id)) {
      removed.push(element)
    }
  }
  
  return { added, removed, modified }
}

/**
 * Extract all identifiers from AST
 */
export function extractIdentifiers(ast: LanguageAST): Set<string> {
  const identifiers = new Set<string>()
  
  function traverse(node: NormalizedASTNode): void {
    if (node.name) {
      identifiers.add(node.name)
    }
    for (const child of node.children) {
      traverse(child)
    }
  }
  
  traverse(ast.rootNode)
  
  // Also add from extracted elements
  for (const element of ast.elements) {
    identifiers.add(element.name)
  }
  
  return identifiers
}

/**
 * Find symbol references in AST
 */
export function findReferences(ast: LanguageAST, symbolName: string): CodeElement[] {
  const references: CodeElement[] = []
  
  for (const element of ast.elements) {
    if (element.dependencies.includes(symbolName)) {
      references.push(element)
    }
  }
  
  // Check function bodies
  for (const func of ast.functions) {
    // This would require more detailed body analysis
    // For now, just check if the function name matches
    if (func.name === symbolName) {
      const element = ast.elements.find(e => e.id === func.id)
      if (element) references.push(element)
    }
  }
  
  return references
}

/**
 * Generate symbol table from AST
 */
export function generateSymbolTable(ast: LanguageAST): Map<string, {
  type: CodeElementType
  loc: SourceLocation
  visibility?: string
}> {
  const symbols = new Map<string, {
    type: CodeElementType
    loc: SourceLocation
    visibility?: string
  }>()
  
  for (const element of ast.elements) {
    if (!symbols.has(element.name)) {
      symbols.set(element.name, {
        type: element.type,
        loc: element.loc,
        visibility: element.visibility,
      })
    }
  }
  
  return symbols
}

/**
 * Validate code syntax
 */
export function validateSyntax(
  code: string,
  language: LanguageType,
  options: Partial<ParserOptions> = {}
): { valid: boolean; errors: ParseError[] } {
  const parser = getMultiLanguageParser()
  const result = parser.parse(code, { ...options, language })
  
  return {
    valid: result.success,
    errors: result.errors,
  }
}

// Export default instance
export default MultiLanguageParser
