import * as Sentry from '@sentry/nextjs';

/**
 * Configuration Sentry pour le client (navigateur)
 * Monitoring des erreurs et performance côté client
 */

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Configuration de base
  environment: process.env.NODE_ENV || 'development',
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Taux d'échantillonnage des erreurs (100% en production)
  sampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0.1,
  
  // Taux d'échantillonnage des performances
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.01,
  
  // Configuration des performances
  integrations: [
    new Sentry.BrowserTracing({
      // Tracer les navigations automatiquement
      routingInstrumentation: Sentry.nextRouterInstrumentation,
      
      // Tracer les requêtes fetch/XHR
      traceFetch: true,
      traceXHR: true,
      
      // Tracer les interactions utilisateur
      enableUserInteractionTracing: true,
    }),
  ],
  
  // Filtrer les erreurs non critiques
  beforeSend(event, hint) {
    // Ignorer les erreurs de réseau communes
    if (event.exception) {
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'message' in error) {
        const message = error.message as string;
        
        // Ignorer les erreurs de connexion réseau
        if (message.includes('NetworkError') || 
            message.includes('Failed to fetch') ||
            message.includes('Load failed')) {
          return null;
        }
        
        // Ignorer les erreurs d'extension de navigateur
        if (message.includes('Extension context invalidated') ||
            message.includes('chrome-extension://')) {
          return null;
        }
      }
    }
    
    return event;
  },
  
  // Configuration des tags par défaut
  initialScope: {
    tags: {
      component: 'client',
      platform: 'web'
    },
  },
  
  // Désactiver en développement local
  enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true',
});
