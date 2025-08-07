import { AppConfig } from '@/types';
// Configuration de l'application Next-Gen
export const config: AppConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  wsBaseUrl: process.env.NEXT_PUBLIC_WS_BASE_URL || 'ws://localhost:8002',
  features: {
    voiceEnabled: process.env.NEXT_PUBLIC_VOICE_ENABLED !== 'false',
    governanceEnabled: process.env.NEXT_PUBLIC_GOVERNANCE_ENABLED !== 'false',
    analyticsEnabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'false',
  },
};
// URLs des services backend
export const API_ENDPOINTS = {
  // Service Auth
  auth: {
    base: 'http://localhost:8000',
    register: '/users/',
    login: '/token',
    me: '/users/me',
  },
  // Service Profile
  profile: {
    base: 'http://localhost:8001',
    profiles: '/profiles',
    byId: (id: number) => `/profiles/${id}`,
  },
  // Service Voice
  voice: {
    base: 'http://localhost:8002',
    ws: 'ws://localhost:8002/ws',
    stats: '/stats',
    sessions: '/sessions',
    health: '/health',
  },
  // Service Conversation
  conversation: {
    base: 'http://localhost:8003',
    chat: '/chat',
    history: (userId: number) => `/history/${userId}`,
    context: (userId: number) => `/context/${userId}`,
    stats: '/stats',
  },
  // Service Governance
  governance: {
    base: 'http://localhost:8005',
    proposals: '/proposals',
    votes: '/votes',
    stats: '/stats',
    health: '/health',
  },
};
// Configuration des WebSockets
export const WS_CONFIG = {
  reconnectAttempts: 5,
  reconnectInterval: 3000,
  heartbeatInterval: 30000,
};
// Configuration audio
export const AUDIO_CONFIG = {
  sampleRate: 16000,
  channels: 1,
  bitsPerSample: 16,
  chunkSize: 1024,
  maxRecordingTime: 300000, // 5 minutes
};
// Configuration des animations
export const ANIMATION_CONFIG = {
  duration: {
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
  },
  easing: {
    easeOut: [0.0, 0.0, 0.2, 1],
    easeIn: [0.4, 0.0, 1, 1],
    easeInOut: [0.4, 0.0, 0.2, 1],
  },
};
// Configuration des toasts
export const TOAST_CONFIG = {
  duration: {
    short: 3000,
    medium: 5000,
    long: 8000,
  },
  position: 'top-right' as const,
};
// Configuration de la pagination
export const PAGINATION_CONFIG = {
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
};
// Configuration des validations
export const VALIDATION_CONFIG = {
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  profile: {
    maxSkills: 10,
    maxInterests: 10,
    maxBioLength: 500,
  },
  conversation: {
    maxMessageLength: 2000,
    maxHistorySize: 100,
  },
};
// Thème par défaut
export const DEFAULT_THEME = {
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#10b981',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b',
  },
  fonts: {
    sans: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
    display: 'Poppins, system-ui, sans-serif',
  },
};
// Configuration des fonctionnalités par environnement
export const FEATURE_FLAGS = {
  development: {
    debugMode: true,
    mockData: true,
    devTools: true,
  },
  production: {
    debugMode: false,
    mockData: false,
    devTools: false,
  },
};
// Configuration actuelle basée sur l'environnement
export const currentFeatures = FEATURE_FLAGS[
  process.env.NODE_ENV as keyof typeof FEATURE_FLAGS
] || FEATURE_FLAGS.development;
// Utilitaires de configuration
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';
// Configuration des logs
export const LOG_CONFIG = {
  level: isDevelopment ? 'debug' : 'info',
  enableConsole: isDevelopment,
  enableRemote: isProduction,
};
// Configuration de sécurité
export const SECURITY_CONFIG = {
  tokenStorageKey: 'voice_coop_token',
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 heures
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
};
// Configuration des métriques
export const METRICS_CONFIG = {
  enableTracking: isProduction,
  batchSize: 10,
  flushInterval: 30000, // 30 secondes
};
export default config;