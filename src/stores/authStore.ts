import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthStore, User, RegisterForm } from '@/types';
import { API_ENDPOINTS, SECURITY_CONFIG } from '@/lib/config';
import { storage } from '@/lib/utils';
interface AuthState extends AuthStore {
  loading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // État initial
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      // Actions
      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
      setUser: (user: User) => set({ user, isAuthenticated: true }),
      setToken: (token: string) => {
        set({ token });
        // Sauvegarder le token dans localStorage
        storage.set(SECURITY_CONFIG.tokenStorageKey, token);
      },
      login: async (email: string, password: string) => {
        const { setLoading, setError, setUser, setToken } = get();
        try {
          setLoading(true);
          setError(null);
          // Utiliser NextAuth pour la connexion
          const { signIn } = await import('next-auth/react');
          const result = await signIn('credentials', {
            email,
            password,
            redirect: false,
          });
          if (result?.error) {
            throw new Error('Email ou mot de passe incorrect');
          }
          if (result?.ok) {
            // Récupérer les informations de session
            const { getSession } = await import('next-auth/react');
            const session = await getSession();
            if (session?.user) {
              const user: User = {
                id: parseInt(session.user.id || '1'),
                email: session.user.email || email,
                full_name: session.user.name || 'Utilisateur',
                is_active: true,
                created_at: new Date().toISOString(),
              };
              setUser(user);
              setToken('nextauth-session');
              set({ isAuthenticated: true });
              console.log('✅ Connexion réussie via NextAuth');
              return;
            }
          }
          throw new Error('Erreur de connexion');
        } catch (error) {
          console.error('❌ Erreur de connexion:', error);
          setError(error instanceof Error ? error.message : 'Erreur de connexion');
        } finally {
          setLoading(false);
        }
      },
      register: async (data: RegisterForm) => {
        const { setLoading, setError, login } = get();
        try {
          setLoading(true);
          setError(null);
          // Appel à notre API d'inscription
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: data.full_name,
              email: data.email,
              password: data.password,
            }),
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Erreur lors de l\'inscription');
          }
          const result = await response.json();
          console.log('✅ Inscription réussie:', result);
          // Connexion automatique après inscription réussie
          await login(data.email, data.password);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Erreur lors de l\'inscription';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },
      logout: () => {
        // Nettoyer le state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
        // Nettoyer le localStorage
        storage.remove(SECURITY_CONFIG.tokenStorageKey);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
// Hook pour vérifier l'authentification avec NextAuth
export const useAuth = () => {
  const store = useAuthStore();
  // Vérifier si le token est expiré (optionnel)
  const checkTokenExpiry = () => {
    if (store.token) {
      try {
        // Décoder le JWT pour vérifier l'expiration
        const payload = JSON.parse(atob(store.token.split('.')[1]));
        const now = Date.now() / 1000;
        if (payload.exp && payload.exp < now) {
          store.logout();
          return false;
        }
        return true;
      } catch {
        // Token invalide
        store.logout();
        return false;
      }
    }
    return false;
  };
  return {
    ...store,
    checkTokenExpiry,
  };
};
// Hook pour les headers d'authentification
export const useAuthHeaders = () => {
  const { token } = useAuthStore();
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
};
// Middleware pour les requêtes authentifiées
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const { token } = useAuthStore.getState();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  const response = await fetch(url, {
    ...options,
    headers,
  });
  // Si le token est expiré, déconnecter l'utilisateur
  if (response.status === 401) {
    useAuthStore.getState().logout();
  }
  return response;
};
export default useAuthStore;