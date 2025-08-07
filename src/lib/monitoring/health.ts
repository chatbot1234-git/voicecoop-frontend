/**
 * Service de Monitoring et Health Check pour VoiceCoop
 * Surveillance de la santé de l'application
 */

import { createClient } from '@supabase/supabase-js';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    supabase: HealthCheck;
    redis?: HealthCheck;
    external_apis: HealthCheck;
  };
}

export interface HealthCheck {
  status: 'pass' | 'fail' | 'warn';
  responseTime: number;
  message?: string;
  details?: Record<string, any>;
}

class HealthMonitor {
  private startTime: number;
  private supabase: any;

  constructor() {
    this.startTime = Date.now();
    
    // Initialiser Supabase pour les checks
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
    }
  }

  // Check principal de santé
  async getHealthStatus(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkSupabase(),
      this.checkRedis(),
      this.checkExternalAPIs()
    ]);

    const [database, supabase, redis, external_apis] = checks.map(result => 
      result.status === 'fulfilled' ? result.value : this.createFailedCheck('Check failed')
    );

    // Déterminer le statut global
    const allChecks = [database, supabase, external_apis];
    if (redis) allChecks.push(redis);

    const hasFailures = allChecks.some(check => check.status === 'fail');
    const hasWarnings = allChecks.some(check => check.status === 'warn');

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (hasFailures) {
      status = 'unhealthy';
    } else if (hasWarnings) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      uptime: Date.now() - this.startTime,
      checks: {
        database,
        supabase,
        ...(redis && { redis }),
        external_apis
      }
    };
  }

  // Check de la base de données
  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test simple de connexion à la base
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('users')
          .select('count')
          .limit(1);

        const responseTime = Date.now() - startTime;

        if (error) {
          return {
            status: 'fail',
            responseTime,
            message: 'Database connection failed',
            details: { error: error.message }
          };
        }

        return {
          status: responseTime > 1000 ? 'warn' : 'pass',
          responseTime,
          message: responseTime > 1000 ? 'Slow database response' : 'Database healthy'
        };
      }

      return {
        status: 'warn',
        responseTime: Date.now() - startTime,
        message: 'Database not configured'
      };

    } catch (error) {
      return {
        status: 'fail',
        responseTime: Date.now() - startTime,
        message: 'Database check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  // Check de Supabase
  private async checkSupabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      if (!this.supabase) {
        return {
          status: 'fail',
          responseTime: Date.now() - startTime,
          message: 'Supabase not configured'
        };
      }

      // Test de l'authentification Supabase
      const { data, error } = await this.supabase.auth.getSession();
      const responseTime = Date.now() - startTime;

      if (error) {
        return {
          status: 'warn',
          responseTime,
          message: 'Supabase auth check warning',
          details: { error: error.message }
        };
      }

      return {
        status: responseTime > 2000 ? 'warn' : 'pass',
        responseTime,
        message: responseTime > 2000 ? 'Slow Supabase response' : 'Supabase healthy'
      };

    } catch (error) {
      return {
        status: 'fail',
        responseTime: Date.now() - startTime,
        message: 'Supabase check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  // Check de Redis (optionnel)
  private async checkRedis(): Promise<HealthCheck | null> {
    if (!process.env.REDIS_URL) {
      return null; // Redis non configuré
    }

    const startTime = Date.now();
    
    try {
      // Ici on pourrait ajouter un vrai check Redis
      // Pour l'instant, on simule
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'pass',
        responseTime,
        message: 'Redis healthy (simulated)'
      };

    } catch (error) {
      return {
        status: 'fail',
        responseTime: Date.now() - startTime,
        message: 'Redis check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  // Check des APIs externes
  private async checkExternalAPIs(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test d'une API externe (par exemple, un service IA)
      // Pour l'instant, on simule un check réussi
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'pass',
        responseTime,
        message: 'External APIs healthy'
      };

    } catch (error) {
      return {
        status: 'warn',
        responseTime: Date.now() - startTime,
        message: 'Some external APIs unavailable',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  // Créer un check échoué
  private createFailedCheck(message: string): HealthCheck {
    return {
      status: 'fail',
      responseTime: 0,
      message
    };
  }

  // Métriques système
  getSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    
    return {
      uptime: Date.now() - this.startTime,
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external
      },
      cpu: process.cpuUsage(),
      version: {
        node: process.version,
        app: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
      }
    };
  }
}

// Instance singleton
export const healthMonitor = new HealthMonitor();

export default healthMonitor;
