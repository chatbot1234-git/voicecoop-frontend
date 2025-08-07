import { create } from 'zustand';
// Types pour les conversations avec API
export interface ConversationData {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}
export interface MessageData {
  id: string;
  conversation_id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  created_at: string;
  audio_url?: string;
  audio_duration?: number;
  confidence?: number;
  model_used?: string;
}
interface ConversationsState {
  // State
  conversations: ConversationData[];
  currentConversation: ConversationData | null;
  messages: MessageData[];
  loading: boolean;
  error: string | null;
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentConversation: (conversation: ConversationData | null) => void;
  // API Actions
  fetchConversations: () => Promise<void>;
  createConversation: (title?: string, initialMessage?: string) => Promise<ConversationData | null>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, audioUrl?: string, audioDuration?: number) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
}
export const useConversationsStore = create<ConversationsState>((set, get) => ({
  // Initial state
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,
  // Basic actions
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  setCurrentConversation: (conversation: ConversationData | null) => set({ currentConversation: conversation }),
  // Fetch conversations avec API réelle
  fetchConversations: async () => {
    const { setLoading, setError } = get();
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/conversations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des conversations');
      }
      const result = await response.json();
      if (result.success) {
        // Transformer les données Prisma en format attendu
        const conversations: ConversationData[] = result.data.map((conv: any) => ({
          id: conv.id,
          title: conv.title || 'Conversation sans titre',
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          message_count: conv._count?.messages || conv.messages?.length || 0,
        }));
        set({ conversations });
      } else {
        throw new Error(result.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Erreur fetch conversations:', error);
      const message = error instanceof Error ? error.message : 'Erreur de chargement';
      setError(message);
      // Fallback en mode développement
      if (process.env.NODE_ENV === 'development') {
        const mockConversations: ConversationData[] = [
          {
            id: '1',
            title: 'Discussion sur l\'IA vocale',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            message_count: 12,
          },
          {
            id: '2',
            title: 'Questions sur la gouvernance',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            message_count: 8,
          },
        ];
        set({ conversations: mockConversations });
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  },
  // Créer une nouvelle conversation
  createConversation: async (title?: string, initialMessage?: string) => {
    const { setLoading, setError, fetchConversations } = get();
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title || 'Nouvelle conversation',
          initialMessage,
        }),
      });
      if (!response.ok) {
        throw new Error('Erreur lors de la création de la conversation');
      }
      const result = await response.json();
      if (result.success) {
        const conversation: ConversationData = {
          id: result.data.id,
          title: result.data.title,
          created_at: result.data.created_at,
          updated_at: result.data.updated_at,
          message_count: result.data.messages?.length || 0,
        };
        // Rafraîchir la liste des conversations
        await fetchConversations();
        return conversation;
      } else {
        throw new Error(result.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Erreur création conversation:', error);
      const message = error instanceof Error ? error.message : 'Erreur de création';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  },
  // Récupérer les messages d'une conversation
  fetchMessages: async (conversationId: string) => {
    const { setLoading, setError } = get();
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des messages');
      }
      const result = await response.json();
      if (result.success) {
        const messages: MessageData[] = result.data.map((msg: any) => ({
          id: msg.id,
          conversation_id: msg.conversation_id,
          content: msg.content,
          role: msg.role,
          created_at: msg.created_at,
          audio_url: msg.audio_url,
          audio_duration: msg.audio_duration,
          confidence: msg.confidence,
          model_used: msg.model_used,
        }));
        set({ messages });
      } else {
        throw new Error(result.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Erreur fetch messages:', error);
      const message = error instanceof Error ? error.message : 'Erreur de chargement';
      setError(message);
    } finally {
      setLoading(false);
    }
  },
  // Envoyer un message
  sendMessage: async (conversationId: string, content: string, audioUrl?: string, audioDuration?: number) => {
    const { setLoading, setError, fetchMessages } = get();
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          audioUrl,
          audioDuration,
        }),
      });
      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message');
      }
      const result = await response.json();
      if (result.success) {
        // Rafraîchir les messages pour inclure la réponse IA
        await fetchMessages(conversationId);
      } else {
        throw new Error(result.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      const message = error instanceof Error ? error.message : 'Erreur d\'envoi';
      setError(message);
    } finally {
      setLoading(false);
    }
  },
  // Supprimer une conversation
  deleteConversation: async (conversationId: string) => {
    const { setLoading, setError, fetchConversations } = get();
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }
      const result = await response.json();
      if (result.success) {
        // Rafraîchir la liste des conversations
        await fetchConversations();
        // Si c'était la conversation courante, la désélectionner
        const { currentConversation } = get();
        if (currentConversation?.id === conversationId) {
          set({ currentConversation: null, messages: [] });
        }
      } else {
        throw new Error(result.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Erreur suppression conversation:', error);
      const message = error instanceof Error ? error.message : 'Erreur de suppression';
      setError(message);
    } finally {
      setLoading(false);
    }
  },
}));
export default useConversationsStore;