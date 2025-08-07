// Service de cache Redis pour la performance et les sessions
import Redis from 'ioredis';
export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
}
export interface CacheOptions {
  ttl?: number; // Time to live en secondes
  compress?: boolean;
}
export class CacheService {
  private redis: Redis;
  private config: CacheConfig;
  constructor(config: CacheConfig) {
    this.config = config;
    this.redis = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db || 0,
      keyPrefix: config.keyPrefix || 'voicecoop:',
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    // Gestion des événements Redis
    this.redis.on('connect', () => {
      console.log('Redis connecté');
    });
    this.redis.on('error', (error) => {
      console.error('Erreur Redis:', error);
    });
    this.redis.on('close', () => {
      console.log('Connexion Redis fermée');
    });
  }
  /**
   * Stocke une valeur dans le cache
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (options?.ttl) {
        await this.redis.setex(key, options.ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
    } catch (error) {
      console.error('Erreur cache set:', error);
      throw new Error('Erreur lors de la mise en cache');
    }
  }
  /**
   * Récupère une valeur du cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (value === null) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Erreur cache get:', error);
      return null;
    }
  }
  /**
   * Supprime une clé du cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      console.error('Erreur cache delete:', error);
      return false;
    }
  }
  /**
   * Vérifie si une clé existe
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Erreur cache exists:', error);
      return false;
    }
  }
  /**
   * Définit un TTL sur une clé existante
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, seconds);
      return result === 1;
    } catch (error) {
      console.error('Erreur cache expire:', error);
      return false;
    }
  }
  /**
   * Cache avec fonction de fallback
   */
  async getOrSet<T>(
    key: string,
    fallbackFn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    try {
      // Essayer de récupérer depuis le cache
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
      // Si pas en cache, exécuter la fonction fallback
      const value = await fallbackFn();
      // Mettre en cache le résultat
      await this.set(key, value, options);
      return value;
    } catch (error) {
      console.error('Erreur cache getOrSet:', error);
      // En cas d'erreur, exécuter quand même le fallback
      return await fallbackFn();
    }
  }
  /**
   * Cache spécialisé pour les sessions utilisateur
   */
  async setUserSession(userId: string, sessionData: any, ttl: number = 3600): Promise<void> {
    const key = `session:${userId}`;
    await this.set(key, sessionData, { ttl });
  }
  /**
   * Récupère une session utilisateur
   */
  async getUserSession(userId: string): Promise<any | null> {
    const key = `session:${userId}`;
    return await this.get(key);
  }
  /**
   * Supprime une session utilisateur
   */
  async deleteUserSession(userId: string): Promise<boolean> {
    const key = `session:${userId}`;
    return await this.delete(key);
  }
  /**
   * Cache pour les conversations récentes
   */
  async cacheConversation(conversationId: string, data: any, ttl: number = 1800): Promise<void> {
    const key = `conversation:${conversationId}`;
    await this.set(key, data, { ttl });
  }
  /**
   * Récupère une conversation du cache
   */
  async getCachedConversation(conversationId: string): Promise<any | null> {
    const key = `conversation:${conversationId}`;
    return await this.get(key);
  }
  /**
   * Cache pour les réponses IA fréquentes
   */
  async cacheAIResponse(prompt: string, response: any, ttl: number = 7200): Promise<void> {
    // Créer une clé basée sur le hash du prompt
    const key = `ai:${this.hashString(prompt)}`;
    await this.set(key, response, { ttl });
  }
  /**
   * Récupère une réponse IA du cache
   */
  async getCachedAIResponse(prompt: string): Promise<any | null> {
    const key = `ai:${this.hashString(prompt)}`;
    return await this.get(key);
  }
  /**
   * Rate limiting
   */
  async checkRateLimit(
    identifier: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const key = `ratelimit:${identifier}`;
      const current = await this.redis.get(key);
      if (current === null) {
        // Première requête dans la fenêtre
        await this.redis.setex(key, windowSeconds, '1');
        return {
          allowed: true,
          remaining: maxRequests - 1,
          resetTime: Date.now() + (windowSeconds * 1000),
        };
      }
      const count = parseInt(current, 10);
      if (count >= maxRequests) {
        const ttl = await this.redis.ttl(key);
        return {
          allowed: false,
          remaining: 0,
          resetTime: Date.now() + (ttl * 1000),
        };
      }
      // Incrémenter le compteur
      await this.redis.incr(key);
      const ttl = await this.redis.ttl(key);
      return {
        allowed: true,
        remaining: maxRequests - count - 1,
        resetTime: Date.now() + (ttl * 1000),
      };
    } catch (error) {
      console.error('Erreur rate limiting:', error);
      // En cas d'erreur, autoriser la requête
      return {
        allowed: true,
        remaining: maxRequests,
        resetTime: Date.now() + (windowSeconds * 1000),
      };
    }
  }
  /**
   * Nettoie le cache (supprime les clés expirées)
   */
  async cleanup(): Promise<number> {
    try {
      // Cette opération peut être coûteuse, à utiliser avec parcimonie
      const keys = await this.redis.keys('*');
      let cleaned = 0;
      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) { // Clé sans expiration
          // Optionnel : définir une expiration par défaut
          await this.redis.expire(key, 86400); // 24h
          cleaned++;
        }
      }
      return cleaned;
    } catch (error) {
      console.error('Erreur cleanup cache:', error);
      return 0;
    }
  }
  /**
   * Obtient des statistiques du cache
   */
  async getStats(): Promise<{
    memory: string;
    keys: number;
    hits: number;
    misses: number;
  }> {
    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      const stats = await this.redis.info('stats');
      return {
        memory: this.extractInfoValue(info, 'used_memory_human'),
        keys: parseInt(this.extractInfoValue(keyspace, 'keys'), 10) || 0,
        hits: parseInt(this.extractInfoValue(stats, 'keyspace_hits'), 10) || 0,
        misses: parseInt(this.extractInfoValue(stats, 'keyspace_misses'), 10) || 0,
      };
    } catch (error) {
      console.error('Erreur stats cache:', error);
      return { memory: '0B', keys: 0, hits: 0, misses: 0 };
    }
  }
  /**
   * Ferme la connexion Redis
   */
  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
  /**
   * Hash simple d'une chaîne
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en 32bit
    }
    return Math.abs(hash).toString(36);
  }
  /**
   * Extrait une valeur des infos Redis
   */
  private extractInfoValue(info: string, key: string): string {
    const match = info.match(new RegExp(`${key}:([^\\r\\n]+)`));
    return match ? match[1] : '0';
  }
}
// Factory function
export function createCacheService(): CacheService {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const url = new URL(redisUrl);
  const config: CacheConfig = {
    host: url.hostname,
    port: parseInt(url.port, 10) || 6379,
    password: url.password || undefined,
    keyPrefix: 'voicecoop:',
  };
  return new CacheService(config);
}
// Service de simulation pour le développement
export class MockCacheService {
  private cache = new Map<string, { value: any; expires?: number }>();
  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    const expires = options?.ttl ? Date.now() + (options.ttl * 1000) : undefined;
    this.cache.set(key, { value, expires });
  }
  async get<T = any>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }
  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }
  async getOrSet<T>(key: string, fallbackFn: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await fallbackFn();
    await this.set(key, value);
    return value;
  }
}
// Instance singleton
export const cacheService = process.env.NODE_ENV === 'development' && !process.env.REDIS_URL
  ? new MockCacheService() as any
  : createCacheService();
// Types d'export
export type {
  CacheConfig,
  CacheOptions,
};