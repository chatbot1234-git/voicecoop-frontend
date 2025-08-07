/**
 * Service d'Analytics Personnalisé pour VoiceCoop
 * Collecte et analyse des métriques utilisateur
 */

import * as Sentry from '@sentry/nextjs';

// Types pour les événements analytics
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: Date;
}

export interface UserMetrics {
  userId: string;
  sessionId: string;
  pageViews: number;
  timeSpent: number;
  interactions: number;
  errors: number;
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  renderTime: number;
  memoryUsage?: number;
}

class AnalyticsService {
  private isEnabled: boolean;
  private sessionId: string;
  private userId?: string;
  private startTime: number;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production' || 
                    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    
    if (typeof window !== 'undefined') {
      this.initializeClientAnalytics();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeClientAnalytics() {
    // Écouter les événements de performance
    if ('performance' in window) {
      window.addEventListener('load', () => {
        this.trackPerformance();
      });
    }

    // Écouter les erreurs non capturées
    window.addEventListener('error', (event) => {
      this.trackError('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Écouter les rejets de promesses
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError('unhandled_promise_rejection', {
        reason: event.reason?.toString()
      });
    });
  }

  // Identifier l'utilisateur
  identify(userId: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    this.userId = userId;
    
    // Configurer Sentry
    Sentry.setUser({
      id: userId,
      ...properties
    });

    this.track('user_identified', {
      userId,
      ...properties
    });
  }

  // Tracker un événement
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        sessionId: this.sessionId,
        userId: this.userId,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        ...properties
      },
      timestamp: new Date()
    };

    // Envoyer à notre API analytics
    this.sendToAPI(event);

    // Envoyer à Sentry comme breadcrumb
    Sentry.addBreadcrumb({
      message: eventName,
      category: 'analytics',
      data: properties,
      level: 'info'
    });

    console.log('📊 Analytics Event:', event);
  }

  // Tracker les pages vues
  trackPageView(page: string, properties?: Record<string, any>) {
    this.track('page_view', {
      page,
      ...properties
    });
  }

  // Tracker les erreurs
  trackError(errorType: string, errorData: Record<string, any>) {
    if (!this.isEnabled) return;

    this.track('error_occurred', {
      errorType,
      ...errorData
    });

    // Envoyer à Sentry
    Sentry.captureException(new Error(`${errorType}: ${JSON.stringify(errorData)}`));
  }

  // Tracker les performances
  trackPerformance() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      const metrics: PerformanceMetrics = {
        pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
        apiResponseTime: navigation.responseEnd - navigation.requestStart,
        renderTime: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
      };

      // Ajouter l'usage mémoire si disponible
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        metrics.memoryUsage = memory.usedJSHeapSize;
      }

      this.track('performance_metrics', metrics);
    }
  }

  // Tracker les interactions utilisateur
  trackInteraction(interactionType: string, element?: string, properties?: Record<string, any>) {
    this.track('user_interaction', {
      interactionType,
      element,
      ...properties
    });
  }

  // Tracker les conversions
  trackConversion(conversionType: string, value?: number, properties?: Record<string, any>) {
    this.track('conversion', {
      conversionType,
      value,
      ...properties
    });
  }

  // Envoyer les données à notre API
  private async sendToAPI(event: AnalyticsEvent) {
    if (typeof window === 'undefined') return;

    try {
      await fetch('/api/analytics/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.warn('Failed to send analytics event:', error);
    }
  }

  // Obtenir les métriques de session
  getSessionMetrics(): UserMetrics {
    return {
      userId: this.userId || 'anonymous',
      sessionId: this.sessionId,
      pageViews: 0, // À implémenter avec un compteur
      timeSpent: Date.now() - this.startTime,
      interactions: 0, // À implémenter avec un compteur
      errors: 0 // À implémenter avec un compteur
    };
  }

  // Nettoyer avant la fermeture
  cleanup() {
    if (typeof window !== 'undefined') {
      const metrics = this.getSessionMetrics();
      this.track('session_end', metrics);
    }
  }
}

// Instance singleton
export const analytics = new AnalyticsService();

// Hooks React pour l'analytics
export const useAnalytics = () => {
  return {
    track: analytics.track.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackInteraction: analytics.trackInteraction.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
    identify: analytics.identify.bind(analytics)
  };
};

// Nettoyer avant la fermeture de la page
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    analytics.cleanup();
  });
}

export default analytics;
