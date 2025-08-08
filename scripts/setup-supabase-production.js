#!/usr/bin/env node

/**
 * 🚀 SETUP SUPABASE PRODUCTION - VoiceCoop
 * 
 * Configure la base de données Supabase pour la production
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://omtcukbtdnbvdrhlwhri.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGN1a2J0ZG5idmRyaGx3aHJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDUzMTI2MiwiZXhwIjoyMDcwMTA3MjYyfQ.9RTNsQg_cefDbKTjArRiBvn6zRxH0tiYMRT4cOgO6BY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class SupabaseSetup {
  async setupDatabase() {
    console.log('🚀 Configuration de la base de données Supabase...\n');
    
    try {
      // 1. Créer la table users
      await this.createUsersTable();
      
      // 2. Créer la table conversations
      await this.createConversationsTable();
      
      // 3. Créer la table messages
      await this.createMessagesTable();
      
      // 4. Configurer les politiques RLS
      await this.setupRLS();
      
      // 5. Tester la connexion
      await this.testConnection();
      
      console.log('\n✅ Configuration Supabase terminée avec succès !');
      
    } catch (error) {
      console.error('❌ Erreur lors de la configuration:', error);
      process.exit(1);
    }
  }

  async createUsersTable() {
    console.log('📝 Création de la table users...');
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          email TEXT UNIQUE NOT NULL,
          full_name TEXT,
          avatar_url TEXT,
          provider TEXT DEFAULT 'credentials',
          provider_id TEXT,
          password_hash TEXT,
          email_verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_login TIMESTAMP WITH TIME ZONE
        );
        
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      `
    });
    
    if (error) {
      console.error('❌ Erreur création table users:', error);
      throw error;
    }
    
    console.log('✅ Table users créée');
  }

  async createConversationsTable() {
    console.log('📝 Création de la table conversations...');
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS conversations (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          status TEXT DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
      `
    });
    
    if (error) {
      console.error('❌ Erreur création table conversations:', error);
      throw error;
    }
    
    console.log('✅ Table conversations créée');
  }

  async createMessagesTable() {
    console.log('📝 Création de la table messages...');
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
      `
    });
    
    if (error) {
      console.error('❌ Erreur création table messages:', error);
      throw error;
    }
    
    console.log('✅ Table messages créée');
  }

  async setupRLS() {
    console.log('🔒 Configuration des politiques RLS...');
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
        
        -- Policies for users
        CREATE POLICY IF NOT EXISTS "Users can view own profile" ON users
          FOR SELECT USING (auth.uid()::text = id);
          
        CREATE POLICY IF NOT EXISTS "Users can update own profile" ON users
          FOR UPDATE USING (auth.uid()::text = id);
        
        -- Policies for conversations
        CREATE POLICY IF NOT EXISTS "Users can view own conversations" ON conversations
          FOR SELECT USING (auth.uid()::text = user_id);
          
        CREATE POLICY IF NOT EXISTS "Users can create own conversations" ON conversations
          FOR INSERT WITH CHECK (auth.uid()::text = user_id);
          
        CREATE POLICY IF NOT EXISTS "Users can update own conversations" ON conversations
          FOR UPDATE USING (auth.uid()::text = user_id);
        
        -- Policies for messages
        CREATE POLICY IF NOT EXISTS "Users can view messages in own conversations" ON messages
          FOR SELECT USING (
            conversation_id IN (
              SELECT id FROM conversations WHERE user_id = auth.uid()::text
            )
          );
          
        CREATE POLICY IF NOT EXISTS "Users can create messages in own conversations" ON messages
          FOR INSERT WITH CHECK (
            conversation_id IN (
              SELECT id FROM conversations WHERE user_id = auth.uid()::text
            )
          );
      `
    });
    
    if (error) {
      console.error('❌ Erreur configuration RLS:', error);
      throw error;
    }
    
    console.log('✅ Politiques RLS configurées');
  }

  async testConnection() {
    console.log('🧪 Test de connexion...');
    
    const { data, error } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('❌ Erreur test connexion:', error);
      throw error;
    }
    
    console.log('✅ Connexion Supabase fonctionnelle');
  }
}

// Exécution
const setup = new SupabaseSetup();
setup.setupDatabase().catch(console.error);
