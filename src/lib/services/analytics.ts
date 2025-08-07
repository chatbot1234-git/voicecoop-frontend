// Service d'analytics avancées pour métriques temps réel
import { track } from '@vercel/analytics';
export interface AnalyticsConfig {
  mixpanel?: {
    token: string;
    debug?: boolean;
  };
  posthog?: {
    apiKey: string;
    apiHost?: string;
  };
  custom?: {
    endpoint: string;
    apiKey: string;
  };
}
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: Date;
  sessionId?: string;
}
export interface UserProperties {
  userId: string;
  email?: string;
  name?: string;
  plan?: string;
  signupDate?: Date;
  lastActive?: Date;
  totalConversations?: number;
  totalMessages?: number;
  [key: string]: any
}
export interface ConversationMetrics {
  conversationId: string;
  userId: string;
  duration: number;
  messageCount: number;
  audioUsed: boolean;
  aiResponseTime: number;
  satisfaction?: number;
}
export interface GovernanceMetrics {
  proposalId: string;
  userId: string;
  action: 'view' | 'vote' | 'create' | 'comment';
  voteType?: 'for' | 'against' | 'abstain';
  timeSpent?: number;
}
export class AnalyticsService {
  private config: AnalyticsConfig;
  private mixpanel: any = null
  private posthog: any = null
  private sessionId: string;
  private userId: string | null = null;
  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.initializeProviders();
  }
  /**
   * Initialise les providers d'analytics
   */
  private async initializeProviders(): Promise<void> {
    try {
      // Mixpanel
      if (this.config.mixpanel?.token) {
        const mixpanel = await import('mixpanel-browser');
        mixpanel.default.init(this.config.mixpanel.token, {
          debug: this.config.mixpanel.debug || false,
          track_pageview: true,
          persistence: 'localStorage',
        });
        this.mixpanel = mixpanel.default;
      }
      // PostHog
      if (this.config.posthog?.apiKey) {
        const posthog = await import('posthog-js');
        posthog.default.init(this.config.posthog.apiKey, {
          api_host: this.config.posthog.apiHost || 'https://app.posthog.com',
          capture_pageview: true,
          capture_pageleave: true,
        });
        this.posthog = posthog.default;
      }
    } catch (error) {
      console.error('Erreur initialisation analytics:', error);
    }
  }
  /**
   * Identifie un utilisateur
   */
  identify(userId: string, properties?: UserProperties): void {
    this.userId = userId;
    try {
      // Vercel Analytics
      track('user_identified', { userId, ...properties });
      // Mixpanel
      if (this.mixpanel) {
        this.mixpanel.identify(userId);
        if (properties) {
          this.mixpanel.people.set(properties);
        }
      }
      // PostHog
      if (this.posthog) {
        this.posthog.identify(userId, properties);
      }
      // Analytics custom
      this.trackCustom('user_identified', { userId, ...properties });
    } catch (error) {
      console.error('Erreur identification utilisateur:', error);
    }
  }
  /**
   * Track un événement
   */
  track(event: AnalyticsEvent): void {
    try {
      const eventData = {
        ...event.properties,
        userId: event.userId || this.userId,
        sessionId: this.sessionId,
        timestamp: event.timestamp || new Date(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      };
      // Vercel Analytics
      track(event.name, eventData);
      // Mixpanel
      if (this.mixpanel) {
        this.mixpanel.track(event.name, eventData);
      }
      // PostHog
      if (this.posthog) {
        this.posthog.capture(event.name, eventData);
      }
      // Analytics custom
      this.trackCustom(event.name, eventData);
      // Stocker en base pour analytics internes
      this.storeInternalAnalytics(event.name, eventData);
    } catch (error) {
      console.error('Erreur tracking événement:', error);
    }
  }
  /**
   * Track les métriques de conversation
   */
  trackConversation(metrics: ConversationMetrics): void {
    this.track({
      name: 'conversation_completed',
      properties: {
        conversationId: metrics.conversationId,
        duration: metrics.duration,
        messageCount: metrics.messageCount,
        audioUsed: metrics.audioUsed,
        aiResponseTime: metrics.aiResponseTime,
        satisfaction: metrics.satisfaction,
        messagesPerMinute: metrics.messageCount / (metrics.duration / 60),
      },
      userId: metrics.userId,
    });
  }
  /**
   * Track les métriques de gouvernance
   */
  trackGovernance(metrics: GovernanceMetrics): void {
    this.track({
      name: 'governance_action',
      properties: {
        proposalId: metrics.proposalId,
        action: metrics.action,
        voteType: metrics.voteType,
        timeSpent: metrics.timeSpent,
      },
      userId: metrics.userId,
    });
  }
  /**
   * Track les performances de l'application
   */
  trackPerformance(metrics: {
    pageLoadTime?: number;
    apiResponseTime?: number;
    errorRate?: number;
    memoryUsage?: number;
  }): void {
    this.track({
      name: 'performance_metrics',
      properties: metrics,
    });
  }
  /**
   * Track les erreurs
   */
  trackError(error: Error, context?: Record<string, any>): void {
    this.track({
      name: 'error_occurred',
      properties: {
        errorMessage: error.message,
        errorStack: error.stack,
        errorName: error.name,
        context,
      },
    });
  }
  /**
   * Track les événements business
   */
  trackBusiness(eventName: string, properties: Record<string, any>): void {
    this.track({
      name: `business_${eventName}`,
      properties: {
        ...properties,
        category: 'business',
      },
    });
  }
  /**
   * Obtient les métriques en temps réel
   */
  async getRealTimeMetrics(): Promise<{
    activeUsers: number;
    conversationsToday: number;
    messagesPerHour: number;
    errorRate: number;
  }> {
    try {
      const response = await fetch('/api/analytics/realtime', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Erreur récupération métriques');
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur métriques temps réel:', error);
      return {
        activeUsers: 0,
        conversationsToday: 0,
        messagesPerHour: 0,
        errorRate: 0,
      };
    }
  }
  /**
   * Génère un rapport d'analytics
   */
  async generateReport(
    startDate: Date,
    endDate: Date,
    metrics: string[]
  ): Promise<any> {
    try {
      const response = await fetch('/api/analytics/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          metrics,
        }),
      });
      if (!response.ok) {
        throw new Error('Erreur génération rapport');
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur génération rapport:', error);
      throw error;
    }
  }
  /**
   * Track custom analytics
   */
  private async trackCustom(eventName: string, data: any): Promise<void> {
    if (!this.config.custom?.endpoint) return;
    try {
      await fetch(this.config.custom.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.custom.apiKey}`,
        },
        body: JSON.stringify({
          event: eventName,
          data,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Erreur analytics custom:', error);
    }
  }
  /**
   * Stocke les analytics en base interne
   */
  private async storeInternalAnalytics(eventName: string, data: any): Promise<void> {
    try {
      await fetch('/api/analytics/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: eventName,
          eventData: data,
          userId: this.userId,
          sessionId: this.sessionId,
        }),
      });
    } catch (error) {
      // Fail silently pour ne pas impacter l'UX
      console.debug('Erreur stockage analytics interne:', error);
    }
  }
  /**
   * Génère un ID de session unique
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Nettoie les ressources
   */
  cleanup(): void {
    try {
      if (this.posthog) {
        this.posthog.reset();
      }
      if (this.mixpanel) {
        this.mixpanel.reset();
      }
    } catch (error) {
      console.error('Erreur cleanup analytics:', error);
    }
  }
}
// Factory function
export function createAnalyticsService(): AnalyticsService {
  const config: AnalyticsConfig = {
    mixpanel: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN ? {
      token: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
      debug: process.env.NODE_ENV === 'development',
    } : undefined,
    posthog: process.env.NEXT_PUBLIC_POSTHOG_KEY ? {
      apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      apiHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    } : undefined,
    custom: process.env.ANALYTICS_ENDPOINT ? {
      endpoint: process.env.ANALYTICS_ENDPOINT,
      apiKey: process.env.ANALYTICS_API_KEY || '',
    } : undefined,
  };
  return new AnalyticsService(config);
}
// Service de simulation pour le développement
export class MockAnalyticsService {
  identify(): void {
    console.log('📊 [MOCK] Utilisateur identifié');
  }
  track(event: AnalyticsEvent): void {
    console.log(`📊 [MOCK] Événement tracké: ${event.name}`, event.properties);
  }
  trackConversation(): void {
    console.log('📊 [MOCK] Métriques conversation trackées');
  }
  trackGovernance(): void {
    console.log('📊 [MOCK] Métriques gouvernance trackées');
  }
  trackPerformance(): void {
    console.log('📊 [MOCK] Métriques performance trackées');
  }
  trackError(): void {
    console.log('📊 [MOCK] Erreur trackée');
  }
  async getRealTimeMetrics() {
    return {
      activeUsers: 42,
      conversationsToday: 156,
      messagesPerHour: 89,
      errorRate: 0.02,
    };
  }
}
// Instance singleton
export const analyticsService = typeof window !== 'undefined' &&
  (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || process.env.NEXT_PUBLIC_POSTHOG_KEY)
  ? createAnalyticsService()
  : new MockAnalyticsService() as any;
// Types d'export
export type {
  AnalyticsConfig,
  AnalyticsEvent,
  UserProperties,
  ConversationMetrics,
  GovernanceMetrics,
};