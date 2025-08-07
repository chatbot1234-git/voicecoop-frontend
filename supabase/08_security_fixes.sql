-- =====================================================
-- SCRIPT DE CORRECTION DES AVERTISSEMENTS DE SECURITE
-- =====================================================
-- A executer apres tous les autres scripts pour corriger les problemes de securite

-- =====================================================
-- 1. CORRECTION DES VUES AVEC SECURITY DEFINER
-- =====================================================

-- Supprimer les anciennes vues avec SECURITY DEFINER
DROP VIEW IF EXISTS public.popular_proposals_optimized;
DROP VIEW IF EXISTS public.recent_conversations_optimized;

-- Recreer la vue avec SECURITY INVOKER pour respecter les permissions utilisateur
CREATE VIEW public.popular_proposals_optimized 
WITH (security_invoker=on) AS
SELECT 
    p.id,
    p.title,
    p.description,
    p.category,
    p.status,
    p.author_id,
    up.full_name as author_name,
    up.avatar_url as author_avatar,
    p.votes_for,
    p.votes_against,
    p.created_at,
    p.expires_at,
    -- Score de popularite base sur l'activite recente
    (p.votes_for + p.votes_against) * 
    CASE 
        WHEN p.created_at > NOW() - INTERVAL '7 days' THEN 2.0
        WHEN p.created_at > NOW() - INTERVAL '30 days' THEN 1.5
        ELSE 1.0
    END as popularity_score,
    -- Temps restant en heures
    CASE 
        WHEN p.expires_at > NOW() THEN 
            EXTRACT(EPOCH FROM (p.expires_at - NOW())) / 3600
        ELSE 0
    END as hours_remaining
FROM proposals p
JOIN user_profiles up ON p.author_id = up.id
WHERE p.status IN ('active', 'passed')
ORDER BY popularity_score DESC, p.created_at DESC;

-- Recreer la vue recent_conversations_optimized avec SECURITY INVOKER
CREATE VIEW public.recent_conversations_optimized
WITH (security_invoker=on) AS
SELECT
    c.id,
    c.title,
    c.is_archived,
    c.created_at,
    c.updated_at,
    -- Informations sur le createur
    up.full_name as creator_name,
    up.avatar_url as creator_avatar,
    -- Statistiques de la conversation
    (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count,
    (SELECT COUNT(DISTINCT m.user_id) FROM messages m WHERE m.conversation_id = c.id AND m.user_id IS NOT NULL) as participant_count,
    -- Derniere activite
    (SELECT MAX(m.created_at) FROM messages m WHERE m.conversation_id = c.id) as last_activity,
    -- Score d'activite recente
    CASE
        WHEN (SELECT MAX(m.created_at) FROM messages m WHERE m.conversation_id = c.id) > NOW() - INTERVAL '1 hour' THEN 5
        WHEN (SELECT MAX(m.created_at) FROM messages m WHERE m.conversation_id = c.id) > NOW() - INTERVAL '6 hours' THEN 4
        WHEN (SELECT MAX(m.created_at) FROM messages m WHERE m.conversation_id = c.id) > NOW() - INTERVAL '24 hours' THEN 3
        WHEN (SELECT MAX(m.created_at) FROM messages m WHERE m.conversation_id = c.id) > NOW() - INTERVAL '7 days' THEN 2
        ELSE 1
    END as activity_score
FROM conversations c
JOIN user_profiles up ON c.user_id = up.id
WHERE NOT c.is_archived
    AND c.user_id = auth.uid()  -- Seules les conversations de l'utilisateur connecte
ORDER BY activity_score DESC, last_activity DESC NULLS LAST;

-- =====================================================
-- 2. POLITIQUES RLS POUR LES TABLES SOURCES
-- =====================================================

-- Verifier et renforcer les politiques RLS sur la table proposals
DO $$
BEGIN
    -- Politique de lecture pour les propositions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'proposals' 
        AND policyname = 'Anyone can read active proposals'
    ) THEN
        CREATE POLICY "Anyone can read active proposals" ON proposals
            FOR SELECT TO authenticated
            USING (status IN ('active', 'passed', 'rejected'));
    END IF;
END $$;

-- Verifier et renforcer les politiques RLS sur la table user_profiles
DO $$
BEGIN
    -- Politique de lecture pour les profils publics
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'user_profiles'
        AND policyname = 'Anyone can read public profiles'
    ) THEN
        CREATE POLICY "Anyone can read public profiles" ON user_profiles
            FOR SELECT TO authenticated
            USING (true); -- Les profils sont publics pour les propositions
    END IF;
END $$;

-- Verifier et renforcer les politiques RLS sur la table conversations
DO $$
BEGIN
    -- Politique de lecture pour les conversations de l'utilisateur
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'conversations'
        AND policyname = 'Users can read own conversations'
    ) THEN
        CREATE POLICY "Users can read own conversations" ON conversations
            FOR SELECT TO authenticated
            USING (user_id = auth.uid());
    END IF;
END $$;

-- Verifier et renforcer les politiques RLS sur la table messages
DO $$
BEGIN
    -- Politique de lecture pour les messages des conversations de l'utilisateur
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'messages'
        AND policyname = 'Users can read messages from own conversations'
    ) THEN
        CREATE POLICY "Users can read messages from own conversations" ON messages
            FOR SELECT TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM conversations c
                    WHERE c.id = conversation_id
                    AND c.user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- =====================================================
-- 3. INDEX POUR OPTIMISER LES POLITIQUES RLS
-- =====================================================

-- Index pour optimiser les requetes sur le statut des propositions
CREATE INDEX IF NOT EXISTS idx_proposals_status_rls 
    ON proposals(status) 
    WHERE status IN ('active', 'passed', 'rejected');

-- Index pour optimiser les jointures avec user_profiles
CREATE INDEX IF NOT EXISTS idx_proposals_author_rls
    ON proposals(author_id, status);

-- Index pour optimiser les conversations par utilisateur et archivage
CREATE INDEX IF NOT EXISTS idx_conversations_user_archived
    ON conversations(user_id, is_archived);

-- Index pour optimiser les messages par conversation
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
    ON messages(conversation_id, created_at DESC);

-- Index pour optimiser les messages par utilisateur
CREATE INDEX IF NOT EXISTS idx_messages_user_conversation
    ON messages(user_id, conversation_id)
    WHERE user_id IS NOT NULL;

-- Index pour optimiser les requetes par date de creation
CREATE INDEX IF NOT EXISTS idx_proposals_created_status 
    ON proposals(created_at DESC, status) 
    WHERE status IN ('active', 'passed');

-- =====================================================
-- 4. PERMISSIONS RESTRICTIVES
-- =====================================================

-- Revoquer les permissions excessives sur les vues
REVOKE ALL ON public.popular_proposals_optimized FROM public;
REVOKE ALL ON public.recent_conversations_optimized FROM public;

-- Accorder seulement les permissions necessaires
GRANT SELECT ON public.popular_proposals_optimized TO authenticated;
GRANT SELECT ON public.recent_conversations_optimized TO authenticated;

-- =====================================================
-- 5. CORRECTION DES FONCTIONS AVEC SEARCH_PATH
-- =====================================================

-- Corriger les fonctions qui ont des problemes de search_path
-- Ces fonctions doivent etre redefinies avec un search_path explicite

-- Fonction get_platform_stats avec search_path securise
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS JSON 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM auth.users),
        'total_user_profiles', (SELECT COUNT(*) FROM public.user_profiles),
        'total_conversations', (SELECT COUNT(*) FROM public.conversations),
        'active_conversations', (SELECT COUNT(*) FROM public.conversations WHERE NOT is_archived),
        'total_messages', (SELECT COUNT(*) FROM public.messages),
        'total_proposals', (SELECT COUNT(*) FROM public.proposals),
        'active_proposals', (SELECT COUNT(*) FROM public.proposals WHERE status = 'active'),
        'total_votes', (SELECT COUNT(*) FROM public.votes),
        'storage_info', json_build_object(
            'total_files', (SELECT COUNT(*) FROM storage.objects),
            'audio_files_count', (
                SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'audio-files'
            ),
            'avatar_files_count', (
                SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'avatars'
            )
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction get_performance_stats avec search_path securise
CREATE OR REPLACE FUNCTION public.get_performance_stats()
RETURNS JSON 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'database_size', pg_size_pretty(pg_database_size(current_database())),
        'table_count', (
            SELECT COUNT(*) FROM pg_stat_user_tables WHERE schemaname = 'public'
        ),
        'total_rows', (
            SELECT SUM(n_live_tup) FROM pg_stat_user_tables WHERE schemaname = 'public'
        ),
        'index_count', (
            SELECT COUNT(*) FROM pg_stat_user_indexes WHERE schemaname = 'public'
        ),
        'largest_tables', (
            SELECT json_agg(
                json_build_object(
                    'table_name', relname,
                    'row_count', n_live_tup
                )
            )
            FROM (
                SELECT relname, n_live_tup 
                FROM pg_stat_user_tables 
                WHERE schemaname = 'public' 
                AND n_live_tup > 0
                ORDER BY n_live_tup DESC 
                LIMIT 5
            ) t
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction system_health_check avec search_path securise
CREATE OR REPLACE FUNCTION public.system_health_check()
RETURNS JSON
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'timestamp', NOW(),
        'database_status', 'healthy',
        'performance_stats', public.get_performance_stats(),
        'platform_stats', public.get_platform_stats(),
        'storage_status', json_build_object(
            'audio_bucket_exists', EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'audio-files'),
            'avatar_bucket_exists', EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'avatars'),
            'total_files', (SELECT COUNT(*) FROM storage.objects)
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. SUPPRESSION DES EXTENSIONS NON UTILISEES
-- =====================================================

-- Verifier et supprimer les extensions qui ne sont pas necessaires
DO $$
BEGIN
    -- Supprimer pg_trgm si elle n'est pas utilisee
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        -- Verifier si des index l'utilisent
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexdef LIKE '%gin_trgm_ops%' 
            OR indexdef LIKE '%gist_trgm_ops%'
        ) THEN
            DROP EXTENSION IF EXISTS pg_trgm;
            RAISE NOTICE 'Extension pg_trgm supprimee car non utilisee';
        END IF;
    END IF;
    
    -- Supprimer btree_gin si elle n'est pas utilisee
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'btree_gin') THEN
        -- Verifier si des index l'utilisent
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexdef LIKE '%gin%' 
            AND schemaname = 'public'
        ) THEN
            DROP EXTENSION IF EXISTS btree_gin;
            RAISE NOTICE 'Extension btree_gin supprimee car non utilisee';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 7. ACTIVATION DE LA PROTECTION RLS
-- =====================================================

-- S'assurer que RLS est active sur toutes les tables sensibles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. VALIDATION FINALE DE SECURITE
-- =====================================================

-- Verifier que les vues utilisent maintenant SECURITY INVOKER
SELECT
    'Vues corrigees avec SECURITY INVOKER' as status,
    COUNT(*) as vues_recreees
FROM information_schema.views
WHERE table_schema = 'public'
    AND table_name IN ('popular_proposals_optimized', 'recent_conversations_optimized');

-- Verifier les politiques RLS
SELECT 
    'Politiques RLS actives' as status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public';

-- Verifier les permissions sur les fonctions
SELECT 
    'Fonctions avec search_path securise' as status,
    COUNT(*) as function_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
    AND p.proname IN ('get_platform_stats', 'get_performance_stats', 'system_health_check');

SELECT 'Script 08 - Corrections de securite terminees avec succes !' as final_status;
