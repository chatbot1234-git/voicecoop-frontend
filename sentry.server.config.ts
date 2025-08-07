import * as Sentry from '@sentry/nextjs';

/**
 * Configuration Sentry pour le serveur (Node.js)
 * Monitoring des erreurs et performance côté serveur
 */

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Configuration de base
  environment: process.env.NODE_ENV || 'development',
  release: process.env.APP_VERSION || '1.0.0',
  
  // Taux d'échantillonnage des erreurs (100% en production)
  sampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0.1,
  
  // Taux d'échantillonnage des performances
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.01,
  
  // Configuration des intégrations serveur
  integrations: [
    // Tracer les requêtes HTTP
    new Sentry.Integrations.Http({ tracing: true }),
    
    // Tracer les requêtes de base de données
    new Sentry.Integrations.Prisma({ client: undefined }), // À configurer avec Prisma
  ],
  
  // Filtrer les erreurs non critiques
  beforeSend(event, hint) {
    // Ignorer les erreurs de santé check
    if (event.request?.url?.includes('/api/health')) {
      return null;
    }
    
    // Ignorer les erreurs 404 sur les assets
    if (event.request?.url?.includes('/favicon.ico') ||
        event.request?.url?.includes('/.well-known/')) {
      return null;
    }
    
    return event;
  },
  
  // Configuration des tags par défaut
  initialScope: {
    tags: {
      component: 'server',
      platform: 'node'
    },
  },
  
  // Désactiver en développement local
  enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true',
});
