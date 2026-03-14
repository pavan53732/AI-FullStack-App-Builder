/**
 * Code Cache Manager
 * Intelligent caching system for code analysis, embeddings, and metadata
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: number;
  size: number; // in bytes
  tags: string[];
  metadata: Record<string, unknown>;
  checksum: string;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  avgAccessTime: number;
  oldestEntry: number;
  newestEntry: number;
  evictions: number;
  tagDistribution: Map<string, number>;
}

export interface CachePolicy {
  name: string;
  maxSize: number; // Max cache size in bytes
  maxEntries: number;
  defaultTTL: number; // Default TTL in milliseconds
  evictionPolicy: 'lru' | 'lfu' | 'fifo' | 'ttl';
  compression: boolean;
  persistence: boolean;
}

export interface CacheQuery {
  keys?: string[];
  tags?: string[];
  minAccessCount?: number;
  maxAge?: number;
  predicate?: <T>(entry: CacheEntry<T>) => boolean;
}

export interface CacheInvalidationRule {
  id: string;
  pattern: string; // Glob pattern or regex
  type: 'key' | 'tag' | 'dependency';
  action: 'invalidate' | 'refresh' | 'update';
  priority: number;
  enabled: boolean;
}

export interface CacheDependency {
  sourceKey: string;
  dependentKeys: string[];
  dependencyType: 'strong' | 'weak';
}

// ============================================================================
// Default Cache Policy
// ============================================================================

const DEFAULT_POLICY: CachePolicy = {
  name: 'default',
  maxSize: 100 * 1024 * 1024, // 100 MB
  maxEntries: 10000,
  defaultTTL: 60 * 60 * 1000, // 1 hour
  evictionPolicy: 'lru',
  compression: false,
  persistence: false
};

// ============================================================================
// Code Cache Manager Class
// ============================================================================

export class CodeCacheManager<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private policy: CachePolicy;
  private stats: {
    hits: number;
    misses: number;
    evictions: number;
    totalAccessTime: number;
    accessCount: number;
  };
  private invalidationRules: Map<string, CacheInvalidationRule> = new Map();
  private dependencies: Map<string, CacheDependency> = new Map();
  private persistencePath?: string;

  constructor(policy?: Partial<CachePolicy>) {
    this.policy = { ...DEFAULT_POLICY, ...policy };
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalAccessTime: 0,
      accessCount: 0
    };
  }

  // --------------------------------------------------------------------------
  // Core Cache Operations
  // --------------------------------------------------------------------------

  set(
    key: string,
    value: T,
    options?: {
      ttl?: number;
      tags?: string[];
      metadata?: Record<string, unknown>;
    }
  ): boolean {
    const startTime = Date.now();

    // Check if we need to evict entries first
    this.ensureCapacity();

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: startTime,
      ttl: options?.ttl || this.policy.defaultTTL,
      accessCount: 0,
      lastAccessed: startTime,
      size: this.calculateSize(value),
      tags: options?.tags || [],
      metadata: options?.metadata || {},
      checksum: this.calculateChecksum(value)
    };

    // Check if entry already exists and update stats
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      entry.accessCount = existing.accessCount;
    }

    this.cache.set(key, entry);

    // Apply compression if enabled
    if (this.policy.compression && entry.size > 1024) {
      // In a real implementation, would compress here
    }

    // Persist if enabled
    if (this.policy.persistence && this.persistencePath) {
      this.persistEntry(entry);
    }

    return true;
  }

  get(key: string): T | undefined {
    const startTime = Date.now();
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return undefined;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = startTime;

    // Update global stats
    this.stats.hits++;
    this.stats.totalAccessTime += Date.now() - startTime;
    this.stats.accessCount++;

    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    // Also remove dependent entries
    const deps = this.dependencies.get(key);
    if (deps) {
      for (const depKey of deps.dependentKeys) {
        this.cache.delete(depKey);
      }
      this.dependencies.delete(key);
    }

    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.dependencies.clear();
  }

  // --------------------------------------------------------------------------
  // Batch Operations
  // --------------------------------------------------------------------------

  mset(entries: Array<{ key: string; value: T; options?: Parameters<typeof this.set>[2] }>): void {
    for (const entry of entries) {
      this.set(entry.key, entry.value, entry.options);
    }
  }

  mget(keys: string[]): Map<string, T> {
    const result = new Map<string, T>();
    for (const key of keys) {
      const value = this.get(key);
      if (value !== undefined) {
        result.set(key, value);
      }
    }
    return result;
  }

  mdelete(keys: string[]): number {
    let deleted = 0;
    for (const key of keys) {
      if (this.delete(key)) deleted++;
    }
    return deleted;
  }

  // --------------------------------------------------------------------------
  // Query Operations
  // --------------------------------------------------------------------------

  query(query: CacheQuery): CacheEntry<T>[] {
    const results: CacheEntry<T>[] = [];

    for (const entry of this.cache.values()) {
      // Skip expired entries
      if (this.isExpired(entry)) continue;

      // Filter by keys
      if (query.keys && !query.keys.includes(entry.key)) continue;

      // Filter by tags
      if (query.tags && !query.tags.some(tag => entry.tags.includes(tag))) continue;

      // Filter by access count
      if (query.minAccessCount && entry.accessCount < query.minAccessCount) continue;

      // Filter by age
      if (query.maxAge && Date.now() - entry.timestamp > query.maxAge) continue;

      // Custom predicate
      if (query.predicate && !query.predicate(entry)) continue;

      results.push(entry);
    }

    return results;
  }

  getByTag(tag: string): CacheEntry<T>[] {
    return this.query({ tags: [tag] });
  }

  getKeysByPattern(pattern: string): string[] {
    const regex = this.patternToRegex(pattern);
    const keys: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keys.push(key);
      }
    }

    return keys;
  }

  // --------------------------------------------------------------------------
  // Invalidation
  // --------------------------------------------------------------------------

  invalidate(key: string): boolean {
    return this.delete(key);
  }

  invalidateByTag(tag: string): number {
    const entries = this.getByTag(tag);
    let invalidated = 0;

    for (const entry of entries) {
      if (this.delete(entry.key)) invalidated++;
    }

    return invalidated;
  }

  invalidateByPattern(pattern: string): number {
    const keys = this.getKeysByPattern(pattern);
    return this.mdelete(keys);
  }

  addInvalidationRule(rule: CacheInvalidationRule): void {
    this.invalidationRules.set(rule.id, rule);
  }

  removeInvalidationRule(id: string): boolean {
    return this.invalidationRules.delete(id);
  }

  applyInvalidationRules(trigger: string): number {
    let totalInvalidated = 0;

    for (const rule of this.invalidationRules.values()) {
      if (!rule.enabled) continue;

      let invalidated = 0;
      switch (rule.type) {
        case 'key':
          invalidated = this.invalidateByPattern(rule.pattern);
          break;
        case 'tag':
          invalidated = this.invalidateByTag(rule.pattern);
          break;
        case 'dependency':
          const deps = this.dependencies.get(rule.pattern);
          if (deps) {
            invalidated = this.mdelete(deps.dependentKeys);
          }
          break;
      }

      totalInvalidated += invalidated;
    }

    return totalInvalidated;
  }

  // --------------------------------------------------------------------------
  // Dependencies
  // --------------------------------------------------------------------------

  addDependency(sourceKey: string, dependentKeys: string[], type: 'strong' | 'weak' = 'strong'): void {
    this.dependencies.set(sourceKey, {
      sourceKey,
      dependentKeys,
      dependencyType: type
    });
  }

  removeDependency(sourceKey: string): boolean {
    return this.dependencies.delete(sourceKey);
  }

  getDependencies(key: string): string[] {
    return this.dependencies.get(key)?.dependentKeys || [];
  }

  // --------------------------------------------------------------------------
  // Statistics
  // --------------------------------------------------------------------------

  getStats(): CacheStats {
    let totalSize = 0;
    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;
    const tagDistribution = new Map<string, number>();

    for (const entry of this.cache.values()) {
      totalSize += entry.size;
      oldestTimestamp = Math.min(oldestTimestamp, entry.timestamp);
      newestTimestamp = Math.max(newestTimestamp, entry.timestamp);

      for (const tag of entry.tags) {
        tagDistribution.set(tag, (tagDistribution.get(tag) || 0) + 1);
      }
    }

    const totalRequests = this.stats.hits + this.stats.misses;

    return {
      totalEntries: this.cache.size,
      totalSize,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.stats.misses / totalRequests : 0,
      avgAccessTime: this.stats.accessCount > 0 
        ? this.stats.totalAccessTime / this.stats.accessCount 
        : 0,
      oldestEntry: oldestTimestamp === Date.now() ? 0 : oldestTimestamp,
      newestEntry: newestTimestamp,
      evictions: this.stats.evictions,
      tagDistribution
    };
  }

  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalAccessTime: 0,
      accessCount: 0
    };
  }

  // --------------------------------------------------------------------------
  // Policy Management
  // --------------------------------------------------------------------------

  setPolicy(policy: Partial<CachePolicy>): void {
    this.policy = { ...this.policy, ...policy };
    
    // Apply new policy immediately
    if (this.cache.size > this.policy.maxEntries || 
        this.getTotalSize() > this.policy.maxSize) {
      this.evict();
    }
  }

  getPolicy(): CachePolicy {
    return { ...this.policy };
  }

  // --------------------------------------------------------------------------
  // Persistence
  // --------------------------------------------------------------------------

  setPersistencePath(path: string): void {
    this.persistencePath = path;
  }

  // --------------------------------------------------------------------------
  // Private Helper Methods
  // --------------------------------------------------------------------------

  private ensureCapacity(): void {
    while (
      this.cache.size >= this.policy.maxEntries ||
      this.getTotalSize() >= this.policy.maxSize
    ) {
      this.evict();
    }
  }

  private evict(): void {
    if (this.cache.size === 0) return;

    let keyToEvict: string | null = null;

    switch (this.policy.evictionPolicy) {
      case 'lru':
        keyToEvict = this.findLRUKey();
        break;
      case 'lfu':
        keyToEvict = this.findLFUKey();
        break;
      case 'fifo':
        keyToEvict = this.findOldestKey();
        break;
      case 'ttl':
        keyToEvict = this.findExpiredKey() || this.findLRUKey();
        break;
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict);
      this.stats.evictions++;
    }
  }

  private findLRUKey(): string {
    let oldestAccess = Date.now();
    let oldestKey = '';

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private findLFUKey(): string {
    let lowestCount = Infinity;
    let lowestKey = '';

    for (const [key, entry] of this.cache) {
      if (entry.accessCount < lowestCount) {
        lowestCount = entry.accessCount;
        lowestKey = key;
      }
    }

    return lowestKey;
  }

  private findOldestKey(): string {
    let oldestTimestamp = Date.now();
    let oldestKey = '';

    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private findExpiredKey(): string | null {
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        return key;
      }
    }
    return null;
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private getTotalSize(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      total += entry.size;
    }
    return total;
  }

  private calculateSize(value: T): number {
    // Rough estimation of object size
    const str = JSON.stringify(value);
    return str.length * 2; // UTF-16 characters
  }

  private calculateChecksum(value: T): string {
    // Simple hash function for checksum
    const str = JSON.stringify(value);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private patternToRegex(pattern: string): RegExp {
    // Convert glob pattern to regex
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`);
  }

  private persistEntry(entry: CacheEntry<T>): void {
    // In a real implementation, would write to disk
    // For now, just a placeholder
    console.log(`Persisting cache entry: ${entry.key}`);
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  export(): { entries: CacheEntry<T>[]; policy: CachePolicy } {
    return {
      entries: Array.from(this.cache.values()),
      policy: this.policy
    };
  }

  import(data: { entries: CacheEntry<T>[]; policy?: CachePolicy }): number {
    if (data.policy) {
      this.policy = data.policy;
    }

    let imported = 0;
    for (const entry of data.entries) {
      if (!this.isExpired(entry)) {
        this.cache.set(entry.key, entry);
        imported++;
      }
    }

    return imported;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  values(): T[] {
    return Array.from(this.cache.values()).map(e => e.value);
  }

  entries(): Array<[string, CacheEntry<T>]> {
    return Array.from(this.cache.entries());
  }

  size(): number {
    return this.cache.size;
  }
}

// ============================================================================
// Specialized Cache Types
// ============================================================================

export class CodeAnalysisCache extends CodeCacheManager<{
  ast: unknown;
  symbols: Array<{ name: string; type: string; line: number }>;
  complexity: number;
  dependencies: string[];
}> {
  constructor() {
    super({
      name: 'code-analysis',
      maxSize: 200 * 1024 * 1024, // 200 MB
      maxEntries: 5000,
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      evictionPolicy: 'lru'
    });
  }

  cacheFile(filePath: string, analysis: Parameters<typeof this.set>[1]): void {
    this.set(`file:${filePath}`, analysis, {
      tags: ['file', ...filePath.split('/')]
    });
  }

  getFileAnalysis(filePath: string): ReturnType<typeof this.get> {
    return this.get(`file:${filePath}`);
  }
}

export class EmbeddingCache extends CodeCacheManager<number[]> {
  constructor() {
    super({
      name: 'embeddings',
      maxSize: 500 * 1024 * 1024, // 500 MB
      maxEntries: 10000,
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      evictionPolicy: 'lfu'
    });
  }

  cacheEmbedding(key: string, embedding: number[]): void {
    this.set(`emb:${key}`, embedding, {
      tags: ['embedding']
    });
  }

  getEmbedding(key: string): number[] | undefined {
    return this.get(`emb:${key}`);
  }

  findSimilar(target: number[], threshold: number = 0.8): Array<{ key: string; similarity: number }> {
    const results: Array<{ key: string; similarity: number }> = [];

    for (const entry of this.query({ tags: ['embedding'] })) {
      const similarity = this.cosineSimilarity(target, entry.value);
      if (similarity >= threshold) {
        results.push({ key: entry.key, similarity });
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createCacheManager<T>(policy?: Partial<CachePolicy>): CodeCacheManager<T> {
  return new CodeCacheManager<T>(policy);
}

export function createCodeAnalysisCache(): CodeAnalysisCache {
  return new CodeAnalysisCache();
}

export function createEmbeddingCache(): EmbeddingCache {
  return new EmbeddingCache();
}
