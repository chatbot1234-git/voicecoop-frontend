import { createClient } from '@supabase/supabase-js';
import { createBrowserClient, createServerClient } from '@supabase/ssr';
// Types pour la base de données
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string | null;
          content: string;
          role: 'user' | 'assistant';
          audio_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id?: string | null;
          content: string;
          role: 'user' | 'assistant';
          audio_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string | null;
          content?: string;
          role?: 'user' | 'assistant';
          audio_url?: string | null;
          created_at?: string;
        };
      };
      proposals: {
        Row: {
          id: string;
          title: string;
          description: string;
          author_id: string;
          status: 'active' | 'passed' | 'rejected';
          votes_for: number;
          votes_against: number;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          author_id: string;
          status?: 'active' | 'passed' | 'rejected';
          votes_for?: number;
          votes_against?: number;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          author_id?: string;
          status?: 'active' | 'passed' | 'rejected';
          votes_for?: number;
          votes_against?: number;
          created_at?: string;
          expires_at?: string | null;
        };
      };
      votes: {
        Row: {
          id: string;
          proposal_id: string;
          user_id: string;
          vote_type: 'for' | 'against';
          created_at: string;
        };
        Insert: {
          id?: string;
          proposal_id: string;
          user_id: string;
          vote_type: 'for' | 'against';
          created_at?: string;
        };
        Update: {
          id?: string;
          proposal_id?: string;
          user_id?: string;
          vote_type?: 'for' | 'against';
          created_at?: string;
        };
      };
    };
  };
}
// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Client pour le navigateur
export const createSupabaseBrowserClient = () =>
  createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
// Note: createSupabaseServerClient est maintenant dans supabase-server.ts
// Client simple pour usage général (backward compatibility)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
// Export des types
export type { Database };
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Proposal = Database['public']['Tables']['proposals']['Row'];
export type Vote = Database['public']['Tables']['votes']['Row'];