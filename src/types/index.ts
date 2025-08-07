// Types de base pour l'interface Next-Gen
import React from 'react';
export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}
export interface UserProfile {
  id: number;
  user_id: number;
  full_name: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  skills: string[];
  interests: string[];
  ai_interaction_style: 'formal' | 'casual' | 'balanced';
  location?: string;
  title?: string;
  completion_score: number;
  created_at: string;
  updated_at: string;
}
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  context?: Record<string, any>;
  tokens_used?: number;
  confidence?: number;
}
export interface VoiceSession {
  session_id: string;
  user_id: number;
  status: 'created' | 'connected' | 'disconnected' | 'closed';
  connected_at: string;
  audio_chunks: AudioChunk[];
  transcriptions: Transcription[];
  metadata: {
    total_chunks: number;
    total_transcriptions: number;
    last_activity: string;
  };
}
export interface AudioChunk {
  chunk_id: number;
  timestamp: string;
  size: number;
}
export interface Transcription {
  text: string;
  timestamp: string;
  chunk_id: number;
  confidence: number;
}
export interface GovernanceProposal {
  id: number;
  title: string;
  description: string;
  author_id: number;
  status: 'draft' | 'active' | 'passed' | 'rejected';
  votes_for: number;
  votes_against: number;
  votes_abstain: number;
  created_at: string;
  voting_deadline: string;
}
export interface Vote {
  id: number;
  proposal_id: number;
  user_id: number;
  vote_type: 'for' | 'against' | 'abstain';
  created_at: string;
}
export interface ServiceStats {
  active_connections: number;
  total_sessions: number;
  active_users: number;
  service_version: string;
}
export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  service: string;
  version: string;
  features?: Record<string, boolean>;
}
// Types pour les API responses
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
export interface AuthTokens {
  access_token: string;
  token_type: string;
}
// Types pour les formulaires
export interface LoginForm {
  email: string;
  password: string;
}
export interface RegisterForm {
  email: string;
  password: string;
  full_name: string;
}
export interface ProfileForm {
  full_name: string;
  display_name?: string;
  bio?: string;
  skills: string[];
  interests: string[];
  ai_interaction_style: 'formal' | 'casual' | 'balanced';
  location?: string;
  title?: string;
}
export interface ChatRequest {
  message: string;
  user_id: number;
  context?: Record<string, any>;
  user_profile?: Partial<UserProfile>;
}
// Types pour les stores Zustand
export interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterForm) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}
export interface ProfileStore {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  fetchProfile: (userId: number) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  setProfile: (profile: UserProfile) => void;
}
export interface ConversationStore {
  messages: ConversationMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (message: string, context?: Record<string, any>) => Promise<void>;
  clearMessages: () => void;
  loadHistory: (userId: number) => Promise<void>;
}
export interface VoiceStore {
  currentSession: VoiceSession | null;
  isRecording: boolean;
  isConnected: boolean;
  error: string | null;
  startSession: (userId: number) => Promise<void>;
  stopSession: () => Promise<void>;
  startRecording: () => void;
  stopRecording: () => void;
}
// Types pour les composants
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
export interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onClose: () => void;
}
// Types pour les animations
export interface AnimationVariants {
  initial: Record<string, any>;
  animate: Record<string, any>;
  exit?: Record<string, any>;
}
// Types pour les configurations
export interface AppConfig {
  apiBaseUrl: string;
  wsBaseUrl: string;
  features: {
    voiceEnabled: boolean;
    governanceEnabled: boolean;
    analyticsEnabled: boolean;
  };
}
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
  fonts: {
    sans: string;
    mono: string;
    display: string;
  };
}