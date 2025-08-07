/**
 * Configuration Elest.io pour VoiceCoop Production
 * Documentation: https://elest.io/docs
 */

export default {
  // Configuration de base
  name: 'voicecoop-production',
  description: 'VoiceCoop - Plateforme IA Vocale Coopérative',
  
  // Configuration du runtime
  runtime: {
    type: 'nodejs',
    version: '18',
    framework: 'nextjs',
    buildCommand: 'npm run build',
    startCommand: 'npm start',
    installCommand: 'npm ci',
  },

  // Configuration des ressources
  resources: {
    cpu: '2 cores',
    memory: '4GB',
    storage: '20GB',
    bandwidth: 'unlimited',
  },

  // Configuration réseau
  network: {
    domains: [
      'voicecoop.com',
      'www.voicecoop.com'
    ],
    ssl: {
      enabled: true,
      autoRenew: true,
      provider: 'letsencrypt'
    },
    cdn: {
      enabled: true,
      regions: ['europe', 'america', 'asia']
    }
  },

  // Variables d'environnement (à configurer via l'interface Elest.io)
  environment: {
    NODE_ENV: 'production',
    NEXTAUTH_URL: 'https://voicecoop.com',
    // Les autres variables seront configurées via l'interface sécurisée
    // NEXTAUTH_SECRET: '***'
    // NEXT_PUBLIC_SUPABASE_URL: '***'
    // NEXT_PUBLIC_SUPABASE_ANON_KEY: '***'
    // SUPABASE_SERVICE_ROLE_KEY: '***'
    // DATABASE_URL: '***'
    // REDIS_URL: '***'
  },

  // Configuration de la base de données
  database: {
    type: 'postgresql',
    version: '15',
    size: 'small', // small, medium, large
    backup: {
      enabled: true,
      frequency: 'daily',
      retention: '30 days'
    }
  },

  // Configuration Redis
  cache: {
    type: 'redis',
    version: '7',
    size: 'small',
    persistence: true
  },

  // Configuration de monitoring
  monitoring: {
    enabled: true,
    alerts: {
      email: ['admin@voicecoop.com'],
      slack: {
        webhook: process.env.SLACK_WEBHOOK_URL
      }
    },
    metrics: [
      'cpu_usage',
      'memory_usage',
      'response_time',
      'error_rate',
      'database_connections'
    ]
  },

  // Configuration de sécurité
  security: {
    firewall: {
      enabled: true,
      rules: [
        {
          type: 'allow',
          port: 80,
          source: 'anywhere'
        },
        {
          type: 'allow',
          port: 443,
          source: 'anywhere'
        },
        {
          type: 'deny',
          port: 'all',
          source: 'anywhere'
        }
      ]
    },
    ddos: {
      enabled: true,
      threshold: 1000 // requests per minute
    },
    waf: {
      enabled: true,
      rules: ['owasp-top-10', 'sql-injection', 'xss']
    }
  },

  // Configuration de sauvegarde
  backup: {
    enabled: true,
    schedule: '0 2 * * *', // Tous les jours à 2h du matin
    retention: '30 days',
    destinations: [
      {
        type: 's3',
        bucket: 'voicecoop-backups',
        region: 'eu-west-1'
      }
    ]
  },

  // Configuration de déploiement
  deployment: {
    strategy: 'blue-green',
    healthCheck: {
      path: '/api/health',
      timeout: 30,
      interval: 10,
      retries: 3
    },
    rollback: {
      enabled: true,
      automatic: true,
      conditions: ['health_check_failed', 'error_rate_high']
    }
  },

  // Configuration de scaling
  scaling: {
    enabled: true,
    min: 1,
    max: 5,
    metrics: [
      {
        type: 'cpu',
        threshold: 70,
        action: 'scale_up'
      },
      {
        type: 'memory',
        threshold: 80,
        action: 'scale_up'
      },
      {
        type: 'response_time',
        threshold: 2000,
        action: 'scale_up'
      }
    ]
  },

  // Configuration des logs
  logging: {
    enabled: true,
    level: 'info',
    retention: '30 days',
    destinations: [
      {
        type: 'elasticsearch',
        index: 'voicecoop-logs'
      }
    ]
  }
};
