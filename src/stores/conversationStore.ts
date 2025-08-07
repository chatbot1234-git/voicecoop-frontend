import { create } from 'zustand';
import { ConversationMessage, ConversationStore, VoiceSession } from '@/types';
import { API_ENDPOINTS } from '@/lib/config';
import { authenticatedFetch } from './authStore';
interface ConversationState extends ConversationStore {
  // Voice session state
  currentSession: VoiceSession | null;
  isRecording: boolean;
  isConnected: boolean;
  audioLevel: number;
  transcriptionBuffer: string;
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addMessage: (message: ConversationMessage) => void;
  updateLastMessage: (content: string) => void;
  setCurrentSession: (session: VoiceSession | null) => void;
  setRecording: (recording: boolean) => void;
  setConnected: (connected: boolean) => void;
  setAudioLevel: (level: number) => void;
  setTranscriptionBuffer: (text: string) => void;
  appendTranscription: (text: string) => void;
}
export const useConversationStore = create<ConversationState>((set, get) => ({
  // Initial state
  messages: [],
  loading: false,
  error: null,
  currentSession: null,
  isRecording: false,
  isConnected: false,
  audioLevel: 0,
  transcriptionBuffer: '',
  // Basic actions
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  setCurrentSession: (session: VoiceSession | null) => set({ currentSession: session }),
  setRecording: (recording: boolean) => set({ isRecording: recording }),
  setConnected: (connected: boolean) => set({ isConnected: connected }),
  setAudioLevel: (level: number) => set({ audioLevel: level }),
  setTranscriptionBuffer: (text: string) => set({ transcriptionBuffer: text }),
  // Message management
  addMessage: (message: ConversationMessage) => {
    set(state => ({
      messages: [...state.messages, message]
    }));
  },
  updateLastMessage: (content: string) => {
    set(state => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content,
          timestamp: new Date().toISOString(),
        };
      }
      return { messages };
    });
  },
  appendTranscription: (text: string) => {
    set(state => ({
      transcriptionBuffer: state.transcriptionBuffer + text
    }));
  },
  // Clear messages
  clearMessages: () => {
    set({
      messages: [],
      transcriptionBuffer: '',
      error: null
    });
  },
  // Send message to AI
  sendMessage: async (message: string, context?: Record<string, any>) => {
    const { setLoading, setError, addMessage } = get();
    try {
      setLoading(true);
      setError(null);
      // Add user message
      const userMessage: ConversationMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        context,
      };
      addMessage(userMessage);
      // Mode développement - simulation
      if (process.env.NODE_ENV === 'development') {
        // Simuler un délai d'API
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        // Réponse simulée intelligente
        const aiResponse = simulateAIResponse(message, context);
        const assistantMessage: ConversationMessage = {
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date().toISOString(),
          tokens_used: Math.floor(Math.random() * 100) + 50,
          confidence: 0.85 + Math.random() * 0.1,
        };
        addMessage(assistantMessage);
        return;
      }
      // Mode production - vraie API
      const response = await authenticatedFetch(
        `${API_ENDPOINTS.conversation.base}${API_ENDPOINTS.conversation.chat}`,
        {
          method: 'POST',
          body: JSON.stringify({
            message,
            user_id: 1, // TODO: Get from auth store
            context,
          }),
        }
      );
      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message');
      }
      const result = await response.json();
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: result.data.response,
        timestamp: new Date().toISOString(),
        tokens_used: result.data.tokens_used,
        confidence: result.data.confidence,
      };
      addMessage(assistantMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de conversation';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  },
  // Load conversation history
  loadHistory: async (userId: number) => {
    const { setLoading, setError } = get();
    try {
      setLoading(true);
      setError(null);
      // Mode développement - simulation
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockHistory: ConversationMessage[] = [
          {
            role: 'assistant',
            content: 'Bonjour ! Je suis votre assistant IA vocale. Comment puis-je vous aider aujourd\'hui ?',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            confidence: 0.95,
          },
          {
            role: 'user',
            content: 'Peux-tu m\'expliquer comment fonctionne cette plateforme ?',
            timestamp: new Date(Date.now() - 3500000).toISOString(),
          },
          {
            role: 'assistant',
            content: 'Bien sûr ! VoiceCoop est une plateforme d\'IA vocale coopérative qui combine reconnaissance vocale avancée, intelligence artificielle contextuelle et gouvernance transparente. Vous pouvez avoir des conversations naturelles, participer aux décisions de la plateforme et bénéficier d\'une expérience personnalisée.',
            timestamp: new Date(Date.now() - 3400000).toISOString(),
            tokens_used: 87,
            confidence: 0.92,
          },
        ];
        set({ messages: mockHistory });
        return;
      }
      // Mode production - vraie API
      const response = await authenticatedFetch(
        `${API_ENDPOINTS.conversation.base}${API_ENDPOINTS.conversation.history(userId)}`
      );
      if (!response.ok) {
        throw new Error('Erreur lors du chargement de l\'historique');
      }
      const result = await response.json();
      set({ messages: result.data.history || [] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de chargement';
      setError(message);
    } finally {
      setLoading(false);
    }
  },
}));
// Fonction de simulation de réponse IA
function simulateAIResponse(message: string, context?: Record<string, any>): string {
  const messageLower = message.toLowerCase();
  // Réponses contextuelles
  if (messageLower.includes('bonjour') || messageLower.includes('salut')) {
    return 'Bonjour ! Ravi de vous retrouver sur VoiceCoop. Comment puis-je vous assister aujourd\'hui ?';
  }
  if (messageLower.includes('comment') && messageLower.includes('ça va')) {
    return 'Je vais très bien, merci ! Mes systèmes fonctionnent parfaitement et je suis prêt à vous aider. Et vous, comment allez-vous ?';
  }
  if (messageLower.includes('voicecoop') || messageLower.includes('plateforme')) {
    return 'VoiceCoop est révolutionnaire ! C\'est la première plateforme d\'IA vocale avec gouvernance coopérative. Vous participez aux décisions, bénéficiez de la transparence totale et d\'une IA qui s\'adapte à vos besoins. Que souhaitez-vous découvrir en particulier ?';
  }
  if (messageLower.includes('vocal') || messageLower.includes('voice')) {
    return 'Nos capacités vocales sont exceptionnelles ! Reconnaissance en temps réel, transcription précise, et adaptation à votre style de communication. Voulez-vous tester une session vocale ?';
  }
  if (messageLower.includes('gouvernance') || messageLower.includes('coopérative')) {
    return 'La gouvernance coopérative est notre force ! Chaque membre peut proposer des améliorations, voter sur les décisions importantes et voir exactement comment la plateforme évolue. C\'est la démocratie appliquée à l\'IA !';
  }
  if (messageLower.includes('aide') || messageLower.includes('help')) {
    return 'Je suis là pour vous aider ! Vous pouvez me poser des questions sur VoiceCoop, tester les fonctionnalités vocales, ou explorer les différentes sections du dashboard. Que voulez-vous découvrir ?';
  }
  // Réponse générale intelligente
  const responses = [
    'C\'est une excellente question ! Basé sur votre profil et nos conversations précédentes, je pense que vous apprécierez particulièrement nos fonctionnalités de personnalisation avancée.',
    'Intéressant ! Cette question touche à l\'un des aspects les plus innovants de VoiceCoop. Laissez-moi vous expliquer en détail...',
    'Parfait ! Vous explorez exactement les bonnes fonctionnalités. VoiceCoop est conçu pour s\'adapter à votre façon de travailler et de communiquer.',
    'Excellente observation ! C\'est précisément ce qui différencie VoiceCoop des autres plateformes. Notre approche coopérative change tout.',
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}
export default useConversationStore;