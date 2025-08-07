-- VoiceCoop Supabase Schema
-- Migration complète de SQLite vers PostgreSQL avec fonctionnalités avancées

-- =====================================================
-- 1. PROFILS UTILISATEURS
-- =====================================================

-- Table pour les données étendues des utilisateurs
-- (auth.users est géré automatiquement par Supabase)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) pour user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger pour mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. CONVERSATIONS IA
-- =====================================================

-- Table des conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  model_config JSONB DEFAULT '{"model": "gemini-pro", "temperature": 0.7}',
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  audio_url TEXT,
  metadata JSONB DEFAULT '{}',
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- RLS pour conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Politiques conversations
CREATE POLICY "Users can manage own conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own messages" ON messages
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT user_id FROM conversations WHERE id = messages.conversation_id
    )
  );

-- Triggers pour conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. GOUVERNANCE COOPÉRATIVE
-- =====================================================

-- Table des propositions
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'technical', 'governance', 'feature')),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'passed', 'rejected', 'expired')),
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  quorum_required INTEGER DEFAULT 10,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  executed_at TIMESTAMP WITH TIME ZONE
);

-- Table des votes
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('for', 'against', 'abstain')),
  comment TEXT,
  weight INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(proposal_id, user_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_proposal_id ON votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);

-- RLS pour gouvernance
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Politiques propositions
CREATE POLICY "Anyone can view active proposals" ON proposals
  FOR SELECT TO authenticated USING (status IN ('active', 'passed', 'rejected'));

CREATE POLICY "Users can create proposals" ON proposals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own proposals" ON proposals
  FOR UPDATE TO authenticated USING (auth.uid() = author_id AND status = 'draft');

-- Politiques votes
CREATE POLICY "Users can view votes on active proposals" ON votes
  FOR SELECT TO authenticated USING (
    proposal_id IN (SELECT id FROM proposals WHERE status IN ('active', 'passed', 'rejected'))
  );

CREATE POLICY "Users can vote on active proposals" ON votes
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND
    proposal_id IN (SELECT id FROM proposals WHERE status = 'active' AND expires_at > NOW())
  );

CREATE POLICY "Users can update own votes" ON votes
  FOR UPDATE TO authenticated USING (
    auth.uid() = user_id AND
    proposal_id IN (SELECT id FROM proposals WHERE status = 'active' AND expires_at > NOW())
  );

-- =====================================================
-- 4. FONCTIONS ET TRIGGERS AVANCÉS
-- =====================================================

-- Fonction pour mettre à jour les compteurs de votes
CREATE OR REPLACE FUNCTION update_proposal_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer les votes pour la proposition
  UPDATE proposals SET
    votes_for = (
      SELECT COUNT(*) FROM votes 
      WHERE proposal_id = COALESCE(NEW.proposal_id, OLD.proposal_id) 
      AND vote_type = 'for'
    ),
    votes_against = (
      SELECT COUNT(*) FROM votes 
      WHERE proposal_id = COALESCE(NEW.proposal_id, OLD.proposal_id) 
      AND vote_type = 'against'
    )
  WHERE id = COALESCE(NEW.proposal_id, OLD.proposal_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mise à jour automatique des compteurs
CREATE TRIGGER update_vote_counts_on_insert
  AFTER INSERT ON votes
  FOR EACH ROW EXECUTE FUNCTION update_proposal_vote_counts();

CREATE TRIGGER update_vote_counts_on_update
  AFTER UPDATE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_proposal_vote_counts();

CREATE TRIGGER update_vote_counts_on_delete
  AFTER DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_proposal_vote_counts();

-- Fonction pour créer automatiquement un profil utilisateur
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour création automatique du profil
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- =====================================================
-- 5. VUES UTILES
-- =====================================================

-- Vue pour les statistiques des propositions
CREATE OR REPLACE VIEW proposal_stats AS
SELECT 
  p.*,
  up.full_name as author_name,
  up.avatar_url as author_avatar,
  (p.votes_for + p.votes_against) as total_votes,
  CASE 
    WHEN (p.votes_for + p.votes_against) >= p.quorum_required THEN true
    ELSE false
  END as quorum_met,
  CASE
    WHEN p.expires_at < NOW() THEN 'expired'
    ELSE p.status
  END as effective_status
FROM proposals p
LEFT JOIN user_profiles up ON p.author_id = up.id;

-- Vue pour les conversations avec derniers messages
CREATE OR REPLACE VIEW conversation_summaries AS
SELECT 
  c.*,
  up.full_name as user_name,
  up.avatar_url as user_avatar,
  m.content as last_message,
  m.created_at as last_message_at,
  (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
FROM conversations c
LEFT JOIN user_profiles up ON c.user_id = up.id
LEFT JOIN LATERAL (
  SELECT content, created_at 
  FROM messages 
  WHERE conversation_id = c.id 
  ORDER BY created_at DESC 
  LIMIT 1
) m ON true;

-- =====================================================
-- 6. STORAGE BUCKETS
-- =====================================================

-- Bucket pour les fichiers audio
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio-files', 'audio-files', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket pour les avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques de storage pour audio
CREATE POLICY "Users can upload audio files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'audio-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view audio files" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'audio-files');

-- Politiques de storage pour avatars
CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- =====================================================
-- 7. DONNÉES DE TEST (OPTIONNEL)
-- =====================================================

-- Insérer quelques propositions de test (à supprimer en production)
-- INSERT INTO proposals (title, description, author_id, category) VALUES
-- ('Améliorer l''interface utilisateur', 'Proposition pour moderniser le design de l''application', auth.uid(), 'feature'),
-- ('Politique de modération', 'Définir les règles de modération de la communauté', auth.uid(), 'governance');

-- =====================================================
-- NOTES DE MIGRATION
-- =====================================================

/*
ÉTAPES POUR UTILISER CE SCHÉMA :

1. Créer un projet Supabase sur https://supabase.com
2. Aller dans SQL Editor
3. Exécuter ce script complet
4. Configurer les variables d'environnement :
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
5. Activer l'authentification par email dans Auth > Settings
6. Configurer les providers OAuth si nécessaire (GitHub, Google)

FONCTIONNALITÉS INCLUSES :
✅ Authentification complète avec RLS
✅ Profils utilisateurs automatiques
✅ Conversations IA avec métadonnées
✅ Gouvernance coopérative avancée
✅ Storage pour audio et avatars
✅ Triggers et fonctions automatiques
✅ Vues optimisées pour l'UI
✅ Index pour performance
✅ Politiques de sécurité granulaires
*/
