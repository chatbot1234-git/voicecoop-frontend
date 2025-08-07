import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, type UserProfile } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
interface AuthState {
  // État
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: 'github' | 'google') => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}
export const useSupabaseAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      // État initial
      user: null,
      profile: null,
      session: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      // Initialisation - Récupérer la session existante
      initialize: async () => {
        try {
          set({ loading: true, error: null });
          // Récupérer la session actuelle
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            throw sessionError;
          }
          if (session?.user) {
            // Récupérer le profil utilisateur
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            if (profileError && profileError.code !== 'PGRST116') {
              console.warn('Erreur récupération profil:', profileError);
            }
            set({
              user: session.user,
              profile: profile || null,
              session,
              isAuthenticated: true,
              loading: false
            });
            console.log('✅ Session Supabase initialisée:', session.user.email);
          } else {
            set({
              user: null,
              profile: null,
              session: null,
              isAuthenticated: false,
              loading: false
            });
          }
          // Écouter les changements d'authentification
          supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔄 Auth state change:', event, session?.user?.email);
            if (session?.user) {
              // Récupérer le profil
              const { data: profile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              set({
                user: session.user,
                profile: profile || null,
                session,
                isAuthenticated: true,
                loading: false
              });
            } else {
              set({
                user: null,
                profile: null,
                session: null,
                isAuthenticated: false,
                loading: false
              });
            }
          });
        } catch (error) {
          console.error('❌ Erreur initialisation auth:', error);
          set({
            error: error instanceof Error ? error.message : 'Erreur d\'initialisation',
            loading: false
          });
        }
      },
      // Inscription
      signUp: async (email: string, password: string, fullName: string) => {
        try {
          set({ loading: true, error: null });
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
              }
            }
          });
          if (error) {
            throw error;
          }
          if (data.user) {
            console.log('✅ Inscription Supabase réussie:', email);
            // Le profil sera créé automatiquement par le trigger
            // Pas besoin de connexion automatique, Supabase gère cela
          }
          set({ loading: false });
        } catch (error) {
          console.error('❌ Erreur inscription:', error);
          set({
            error: error instanceof Error ? error.message : 'Erreur d\'inscription',
            loading: false
          });
          throw error;
        }
      },
      // Connexion
      signIn: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (error) {
            throw error;
          }
          if (data.user) {
            console.log('✅ Connexion Supabase réussie:', email);
            // L'état sera mis à jour par onAuthStateChange
          }
          set({ loading: false });
        } catch (error) {
          console.error('❌ Erreur connexion:', error);
          set({
            error: error instanceof Error ? error.message : 'Email ou mot de passe incorrect',
            loading: false
          });
          throw error;
        }
      },
      // Connexion avec provider OAuth
      signInWithProvider: async (provider: 'github' | 'google') => {
        try {
          set({ loading: true, error: null });
          const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: `${window.location.origin}/dashboard`
            }
          });
          if (error) {
            throw error;
          }
          // La redirection se fait automatiquement
          console.log(`✅ Connexion ${provider} initiée`);
        } catch (error) {
          console.error(`❌ Erreur connexion ${provider}:`, error);
          set({
            error: error instanceof Error ? error.message : `Erreur de connexion ${provider}`,
            loading: false
          });
          throw error;
        }
      },
      // Déconnexion
      signOut: async () => {
        try {
          set({ loading: true, error: null });
          const { error } = await supabase.auth.signOut();
          if (error) {
            throw error;
          }
          console.log('✅ Déconnexion Supabase réussie');
          // L'état sera mis à jour par onAuthStateChange
          set({ loading: false });
        } catch (error) {
          console.error('❌ Erreur déconnexion:', error);
          set({
            error: error instanceof Error ? error.message : 'Erreur de déconnexion',
            loading: false
          });
        }
      },
      // Mise à jour du profil
      updateProfile: async (updates: Partial<UserProfile>) => {
        try {
          const { user } = get();
          if (!user) {
            throw new Error('Utilisateur non connecté');
          }
          set({ loading: true, error: null });
          const { data, error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();
          if (error) {
            throw error;
          }
          set({
            profile: data,
            loading: false
          });
          console.log('✅ Profil mis à jour:', data);
        } catch (error) {
          console.error('❌ Erreur mise à jour profil:', error);
          set({
            error: error instanceof Error ? error.message : 'Erreur de mise à jour',
            loading: false
          });
          throw error;
        }
      },
      // Actions utilitaires
      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ loading }),
    }),
    {
      name: 'supabase-auth-storage',
      partialize: (state) => ({
        // Ne persister que les données essentielles
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);