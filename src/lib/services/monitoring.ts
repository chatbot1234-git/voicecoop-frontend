// Service de monitoring et alertes pour la production
import * as Sentry from '@sentry/nextjs';
export interface MonitoringConfig {
  sentry: {
    dsn: string;
    environment: string;
    tracesSampleRate: number;
    profilesSampleRate: number;
  };
  alerts: {
    webhookUrl?: string;
    emailRecipients?: string[];
    slackWebhook?: string;
  };
  healthChecks: {
    interval: number;
    timeout: number;
    endpoints: string[];
  };
}
export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  error?: string;
  timestamp: Date;
}
export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    incoming: number;
    outgoing: number;
  };
  database: {
    connections: number;
    queryTime: number;
  };
  cache: {
    hitRate: number;
    memory: number;
  };
}
export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'critical';
  title: string;
  message: string;
  service: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: Record<string, any>;
}
export class MonitoringService {
  private config: MonitoringConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private alerts: Alert[] = [];
  constructor(config: MonitoringConfig) {
    this.config = config;
    this.initializeSentry();
    this.startHealthChecks();
  }
  /**
   * Initialise Sentry pour le monitoring d'erreurs
   */
  private initializeSentry(): void {
    if (this.config.sentry.dsn) {
      Sentry.init({
        dsn: this.config.sentry.dsn,
        environment: this.config.sentry.environment,
        tracesSampleRate: this.config.sentry.tracesSampleRate,
        profilesSampleRate: this.config.sentry.profilesSampleRate,
        beforeSend(event) {
          // Filtrer les erreurs non critiques en développement
          if (process.env.NODE_ENV === 'development') {
            return null;
          }
          return event;
        },
        integrations: [
          new Sentry.BrowserTracing({
            tracePropagationTargets: ['localhost', /^https:\/\/yourapi\.domain\.com\/api/],
          }),
        ],
      });
    }
  }
  /**
   * Capture une erreur avec contexte
   */
  captureError(error: Error, context?: Record<string, any>): void {
    try {
      // Sentry
      Sentry.withScope((scope) => {
        if (context) {
          Object.keys(context).forEach(key => {
            scope.setTag(key, context[key]);
          });
        }
        Sentry.captureException(error);
      });
      // Créer une alerte
      this.createAlert({
        type: 'error',
        title: 'Erreur Application',
        message: error.message,
        service: 'frontend',
        metadata: {
          stack: error.stack,
          ...context,
        },
      });
      console.error('Erreur capturée:', error, context);
    } catch (monitoringError) {
      console.error('Erreur monitoring:', monitoringError);
    }
  }
  /**
   * Capture un message personnalisé
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>): void {
    try {
      Sentry.withScope((scope) => {
        scope.setLevel(level);
        if (context) {
          Object.keys(context).forEach(key => {
            scope.setTag(key, context[key]);
          });
        }
        Sentry.captureMessage(message);
      });
      if (level === 'error' || level === 'warning') {
        this.createAlert({
          type: level,
          title: `Message ${level}`,
          message,
          service: 'frontend',
          metadata: context,
        });
      }
    } catch (error) {
      console.error('Erreur capture message:', error);
    }
  }
  /**
   * Démarre une transaction de performance
   */
  startTransaction(name: string, operation: string): any {
    try {
      return Sentry.startTransaction({
        name,
        op: operation,
      });
    } catch (error) {
      console.error('Erreur démarrage transaction:', error);
      return null;
    }
  }
  /**
   * Mesure les performances d'une fonction
   */
  async measurePerformance<T>(
    name: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const transaction = this.startTransaction(name, operation);
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      // Alerter si la performance est dégradée
      if (duration > 5000) { // Plus de 5 secondes
        this.createAlert({
          type: 'warning',
          title: 'Performance Dégradée',
          message: `${name} a pris ${duration}ms à s'exécuter`,
          service: 'performance',
          metadata: { operation, duration },
        });
      }
      return result;
    } catch (error) {
      this.captureError(error as Error, { operation, name });
      throw error;
    } finally {
      if (transaction) {
        transaction.finish();
      }
    }
  }
  /**
   * Vérifie la santé des services
   */
  async performHealthCheck(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    for (const endpoint of this.config.healthChecks.endpoints) {
      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.healthChecks.timeout);
        const response = await fetch(endpoint, {
          signal: controller.signal,
          method: 'GET',
        });
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        results.push({
          service: endpoint,
          status: response.ok ? 'healthy' : 'degraded',
          responseTime,
          timestamp: new Date(),
        });
        // Alerter si le service est down
        if (!response.ok) {
          this.createAlert({
            type: 'error',
            title: 'Service Indisponible',
            message: `${endpoint} retourne ${response.status}`,
            service: 'healthcheck',
            metadata: { endpoint, status: response.status, responseTime },
          });
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;
        results.push({
          service: endpoint,
          status: 'unhealthy',
          responseTime,
          error: (error as Error).message,
          timestamp: new Date(),
        });
        this.createAlert({
          type: 'critical',
          title: 'Service Critique',
          message: `${endpoint} est inaccessible: ${(error as Error).message}`,
          service: 'healthcheck',
          metadata: { endpoint, error: (error as Error).message },
        });
      }
    }
    return results;
  }
  /**
   * Obtient les métriques système
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const response = await fetch('/api/monitoring/metrics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Erreur récupération métriques système');
      }
      return await response.json();
    } catch (error) {
      this.captureError(error as Error, { context: 'system_metrics' });
      // Retourner des métriques par défaut
      return {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: { incoming: 0, outgoing: 0 },
        database: { connections: 0, queryTime: 0 },
        cache: { hitRate: 0, memory: 0 },
      };
    }
  }
  /**
   * Crée une alerte
   */
  private createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData,
    };
    this.alerts.push(alert);
    // Envoyer l'alerte
    this.sendAlert(alert);
    // Nettoyer les anciennes alertes (garder seulement les 100 dernières)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }
  /**
   * Envoie une alerte via les canaux configurés
   */
  private async sendAlert(alert: Alert): Promise<void> {
    try {
      // Webhook générique
      if (this.config.alerts.webhookUrl) {
        await fetch(this.config.alerts.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(alert),
        });
      }
      // Slack
      if (this.config.alerts.slackWebhook) {
        const slackMessage = {
          text: `🚨 ${alert.title}`,
          attachments: [
            {
              color: this.getAlertColor(alert.type),
              fields: [
                {
                  title: 'Service',
                  value: alert.service,
                  short: true,
                },
                {
                  title: 'Type',
                  value: alert.type,
                  short: true,
                },
                {
                  title: 'Message',
                  value: alert.message,
                  short: false,
                },
              ],
              ts: Math.floor(alert.timestamp.getTime() / 1000),
            },
          ],
        };
        await fetch(this.config.alerts.slackWebhook, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(slackMessage),
        });
      }
      // Email (via service de notifications)
      if (this.config.alerts.emailRecipients?.length) {
        const { notificationService } = await import('./notifications');
        for (const email of this.config.alerts.emailRecipients) {
          await notificationService.sendEmail(
            email,
            'alert',
            {
              alert,
              severity: alert.type,
              timestamp: alert.timestamp.toISOString(),
            }
          );
        }
      }
    } catch (error) {
      console.error('Erreur envoi alerte:', error);
    }
  }
  /**
   * Obtient la couleur Slack pour un type d'alerte
   */
  private getAlertColor(type: Alert['type']): string {
    switch (type) {
      case 'critical': return 'danger';
      case 'error': return 'warning';
      case 'warning': return '#ff9500';
      case 'info': return 'good';
      default: return '#cccccc';
    }
  }
  /**
   * Démarre les vérifications de santé périodiques
   */
  private startHealthChecks(): void {
    if (this.config.healthChecks.interval > 0) {
      this.healthCheckInterval = setInterval(async () => {
        try {
          await this.performHealthCheck();
        } catch (error) {
          console.error('Erreur health check:', error);
        }
      }, this.config.healthChecks.interval);
    }
  }
  /**
   * Obtient toutes les alertes
   */
  getAlerts(resolved?: boolean): Alert[] {
    if (resolved !== undefined) {
      return this.alerts.filter(alert => alert.resolved === resolved);
    }
    return [...this.alerts];
  }
  /**
   * Marque une alerte comme résolue
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }
  /**
   * Nettoie les ressources
   */
  cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}
// Factory function
export function createMonitoringService(): MonitoringService {
  const config: MonitoringConfig = {
    sentry: {
      dsn: process.env.SENTRY_DSN || '',
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
    },
    alerts: {
      webhookUrl: process.env.ALERT_WEBHOOK_URL,
      emailRecipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(','),
      slackWebhook: process.env.SLACK_WEBHOOK_URL,
    },
    healthChecks: {
      interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '300000', 10), // 5 minutes
      timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '10000', 10), // 10 secondes
      endpoints: [
        '/api/health',
        '/api/conversations',
        ...(process.env.HEALTH_CHECK_ENDPOINTS?.split(',') || []),
      ],
    },
  };
  return new MonitoringService(config);
}
// Service de simulation pour le développement
export class MockMonitoringService {
  captureError(error: Error): void {
    console.log('🔍 [MOCK] Erreur capturée:', error.message);
  }
  captureMessage(message: string): void {
    console.log('🔍 [MOCK] Message capturé:', message);
  }
  startTransaction(): any {
    return { finish: () => {} };
  }
  async measurePerformance<T>(name: string, operation: string, fn: () => Promise<T>): Promise<T> {
    console.log(`🔍 [MOCK] Mesure performance: ${name} (${operation})`);
    return await fn();
  }
  async performHealthCheck(): Promise<HealthCheckResult[]> {
    return [
      {
        service: '/api/health',
        status: 'healthy',
        responseTime: 150,
        timestamp: new Date(),
      },
    ];
  }
  async getSystemMetrics(): Promise<SystemMetrics> {
    return {
      cpu: 45,
      memory: 60,
      disk: 30,
      network: { incoming: 1024, outgoing: 512 },
      database: { connections: 5, queryTime: 25 },
      cache: { hitRate: 85, memory: 40 },
    };
  }
}
// Instance singleton
export const monitoringService = process.env.SENTRY_DSN
  ? createMonitoringService()
  : new MockMonitoringService() as any;
// Types d'export
export type {
  MonitoringConfig,
  HealthCheckResult,
  SystemMetrics,
  Alert,
};