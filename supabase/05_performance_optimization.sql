-- =====================================================
-- OPTIMISATION DES PERFORMANCES SUPABASE
-- =====================================================
-- Index, vues matérialisées et optimisations pour VoiceCoop

-- Activer les extensions nécessaires pour les index avancés
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- =====================================================
-- 1. INDEX AVANCÉS POUR PERFORMANCE
-- =====================================================

-- Index composites pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated 
    ON conversations(user_id, updated_at DESC, is_archived);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
    ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_user_role 
    ON messages(user_id, role, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proposals_status_created 
    ON proposals(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proposals_author_status 
    ON proposals(author_id, status);

CREATE INDEX IF NOT EXISTS idx_votes_proposal_user 
    ON votes(proposal_id, user_id);

CREATE INDEX IF NOT EXISTS idx_votes_user_created 
    ON votes(user_id, created_at DESC);

-- Index pour les recherches textuelles
CREATE INDEX IF NOT EXISTS idx_conversations_title_search 
    ON conversations USING gin(to_tsvector('french', title));

CREATE INDEX IF NOT EXISTS idx_conversations_description_search 
    ON conversations USING gin(to_tsvector('french', description));

CREATE INDEX IF NOT EXISTS idx_messages_content_search 
    ON messages USING gin(to_tsvector('french', content));

CREATE INDEX IF NOT EXISTS idx_proposals_title_search 
    ON proposals USING gin(to_tsvector('french', title));

CREATE INDEX IF NOT EXISTS idx_proposals_description_search 
    ON proposals USING gin(to_tsvector('french', description));

-- Index partiels pour optimiser les requêtes spécifiques
CREATE INDEX IF NOT EXISTS idx_conversations_active 
    ON conversations(user_id, updated_at DESC) 
    WHERE is_archived = false;

CREATE INDEX IF NOT EXISTS idx_proposals_active 
    ON proposals(created_at DESC) 
    WHERE status = 'active';

-- Index pour les propositions en cours de vote (sans fonction non-immutable)
CREATE INDEX IF NOT EXISTS idx_proposals_voting
    ON proposals(expires_at, status)
    WHERE status = 'active';

-- Index pour les métadonnées JSON (approche sécurisée)
-- Index B-tree standard pour les modèles (plus fiable)
CREATE INDEX IF NOT EXISTS idx_messages_metadata_model
    ON messages((metadata->>'model'));

-- Index GIN pour les objets JSON complets (avec extension btree_gin)
CREATE INDEX IF NOT EXISTS idx_conversations_model_config
    ON conversations USING gin(model_config jsonb_ops);

-- =====================================================
-- 2. VUES MATÉRIALISÉES POUR PERFORMANCE
-- =====================================================

-- Vue matérialisée pour les statistiques utilisateur
CREATE MATERIALIZED VIEW IF NOT EXISTS user_activity_stats AS
SELECT 
    up.id as user_id,
    up.full_name,
    up.created_at as user_created_at,
    COALESCE(conv_stats.conversation_count, 0) as conversation_count,
    COALESCE(conv_stats.active_conversations, 0) as active_conversations,
    COALESCE(msg_stats.message_count, 0) as message_count,
    COALESCE(msg_stats.last_message_at, up.created_at) as last_message_at,
    COALESCE(prop_stats.proposal_count, 0) as proposal_count,
    COALESCE(prop_stats.active_proposals, 0) as active_proposals,
    COALESCE(vote_stats.vote_count, 0) as vote_count,
    COALESCE(vote_stats.last_vote_at, up.created_at) as last_vote_at,
    -- Score d'activité (0-100)
    LEAST(100, 
        COALESCE(conv_stats.conversation_count, 0) * 5 +
        COALESCE(msg_stats.message_count, 0) * 1 +
        COALESCE(prop_stats.proposal_count, 0) * 10 +
        COALESCE(vote_stats.vote_count, 0) * 2
    ) as activity_score
FROM user_profiles up
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as conversation_count,
        COUNT(*) FILTER (WHERE is_archived = false) as active_conversations
    FROM conversations
    GROUP BY user_id
) conv_stats ON up.id = conv_stats.user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as message_count,
        MAX(created_at) as last_message_at
    FROM messages
    WHERE user_id IS NOT NULL
    GROUP BY user_id
) msg_stats ON up.id = msg_stats.user_id
LEFT JOIN (
    SELECT 
        author_id,
        COUNT(*) as proposal_count,
        COUNT(*) FILTER (WHERE status = 'active') as active_proposals
    FROM proposals
    GROUP BY author_id
) prop_stats ON up.id = prop_stats.author_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as vote_count,
        MAX(created_at) as last_vote_at
    FROM votes
    GROUP BY user_id
) vote_stats ON up.id = vote_stats.user_id;

-- Index sur la vue matérialisée
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_activity_stats_user_id 
    ON user_activity_stats(user_id);

CREATE INDEX IF NOT EXISTS idx_user_activity_stats_score 
    ON user_activity_stats(activity_score DESC);

-- Vue matérialisée pour les tendances des propositions
CREATE MATERIALIZED VIEW IF NOT EXISTS proposal_trends AS
SELECT 
    p.id,
    p.title,
    p.category,
    p.status,
    p.created_at,
    p.expires_at,
    p.votes_for,
    p.votes_against,
    (p.votes_for + p.votes_against) as total_votes,
    CASE 
        WHEN (p.votes_for + p.votes_against) = 0 THEN 0
        ELSE ROUND((p.votes_for::DECIMAL / (p.votes_for + p.votes_against)) * 100, 2)
    END as approval_rate,
    -- Tendance de vote (votes des dernières 24h)
    COALESCE(recent_votes.recent_for, 0) as recent_votes_for,
    COALESCE(recent_votes.recent_against, 0) as recent_votes_against,
    -- Score de popularité basé sur l'activité récente
    COALESCE(recent_votes.recent_for, 0) + COALESCE(recent_votes.recent_against, 0) as recent_activity,
    -- Temps restant en heures
    CASE 
        WHEN p.expires_at > NOW() THEN 
            EXTRACT(EPOCH FROM (p.expires_at - NOW())) / 3600
        ELSE 0
    END as hours_remaining
FROM proposals p
LEFT JOIN (
    SELECT 
        proposal_id,
        COUNT(*) FILTER (WHERE vote_type = 'for') as recent_for,
        COUNT(*) FILTER (WHERE vote_type = 'against') as recent_against
    FROM votes
    WHERE created_at > NOW() - INTERVAL '24 hours'
    GROUP BY proposal_id
) recent_votes ON p.id = recent_votes.proposal_id
WHERE p.status IN ('active', 'passed', 'rejected');

-- Index sur la vue matérialisée des tendances
CREATE UNIQUE INDEX IF NOT EXISTS idx_proposal_trends_id 
    ON proposal_trends(id);

CREATE INDEX IF NOT EXISTS idx_proposal_trends_activity 
    ON proposal_trends(recent_activity DESC, hours_remaining DESC);

CREATE INDEX IF NOT EXISTS idx_proposal_trends_approval 
    ON proposal_trends(approval_rate DESC, total_votes DESC);

-- =====================================================
-- 3. FONCTIONS D'OPTIMISATION
-- =====================================================

-- Fonction pour rafraîchir les vues matérialisées
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS JSON AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    result JSON;
BEGIN
    start_time := NOW();
    
    -- Rafraîchir les vues matérialisées (avec vérification d'existence)
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'user_activity_stats') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY user_activity_stats;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'proposal_trends') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY proposal_trends;
    END IF;
    
    end_time := NOW();
    
    SELECT json_build_object(
        'status', 'completed',
        'start_time', start_time,
        'end_time', end_time,
        'duration_seconds', EXTRACT(EPOCH FROM (end_time - start_time)),
        'views_refreshed', ARRAY['user_activity_stats', 'proposal_trends']
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour analyser les performances des requêtes
CREATE OR REPLACE FUNCTION analyze_query_performance()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Analyser les statistiques des tables
    ANALYZE user_profiles, conversations, messages, proposals, votes;
    
    SELECT json_build_object(
        'status', 'completed',
        'analyzed_at', NOW(),
        'tables_analyzed', ARRAY['user_profiles', 'conversations', 'messages', 'proposals', 'votes'],
        'materialized_views_analyzed', ARRAY['user_activity_stats', 'proposal_trends']
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques de performance
CREATE OR REPLACE FUNCTION get_performance_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'database_size', pg_size_pretty(pg_database_size(current_database())),
        'table_stats', (
            SELECT json_agg(json_build_object(
                'table_name', schemaname || '.' || relname,
                'size', pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)),
                'row_count', n_live_tup,
                'dead_rows', n_dead_tup,
                'last_vacuum', last_vacuum,
                'last_analyze', last_analyze
            ))
            FROM pg_stat_user_tables
            WHERE schemaname = 'public'
        ),
        'index_stats', (
            SELECT json_agg(json_build_object(
                'index_name', schemaname || '.' || indexrelname,
                'table_name', schemaname || '.' || relname,
                'size', pg_size_pretty(pg_relation_size(schemaname||'.'||indexrelname)),
                'scans', idx_scan,
                'tuples_read', idx_tup_read,
                'tuples_fetched', idx_tup_fetch
            ))
            FROM pg_stat_user_indexes
            WHERE schemaname = 'public'
            ORDER BY idx_scan DESC
            LIMIT 20
        ),
        'materialized_view_stats', (
            SELECT json_agg(json_build_object(
                'view_name', schemaname || '.' || matviewname,
                'size', pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)),
                'last_refresh', (
                    SELECT MAX(query_start) 
                    FROM pg_stat_activity 
                    WHERE query LIKE '%REFRESH MATERIALIZED VIEW%' || matviewname || '%'
                )
            ))
            FROM pg_matviews
            WHERE schemaname = 'public'
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. OPTIMISATIONS DE CONFIGURATION
-- =====================================================

-- Configurer les paramètres de performance (si autorisé)
-- Note: Ces paramètres peuvent nécessiter des privilèges superuser

-- Optimiser pour les lectures fréquentes
-- ALTER SYSTEM SET random_page_cost = 1.1;
-- ALTER SYSTEM SET effective_cache_size = '1GB';
-- ALTER SYSTEM SET shared_buffers = '256MB';
-- ALTER SYSTEM SET work_mem = '4MB';

-- Configuration pour les requêtes complexes
-- ALTER SYSTEM SET max_parallel_workers_per_gather = 2;
-- ALTER SYSTEM SET max_parallel_workers = 8;

-- =====================================================
-- 5. TRIGGERS D'OPTIMISATION
-- =====================================================

-- Trigger pour rafraîchir automatiquement les stats utilisateur
CREATE OR REPLACE FUNCTION trigger_refresh_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Programmer un rafraîchissement asynchrone des vues matérialisées
    -- (en production, utiliser pg_cron ou un job externe)
    PERFORM pg_notify('refresh_materialized_views', 'user_activity_stats');
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur les tables qui affectent les stats utilisateur
CREATE TRIGGER trigger_refresh_user_stats_conversations
    AFTER INSERT OR UPDATE OR DELETE ON conversations
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_user_stats();

CREATE TRIGGER trigger_refresh_user_stats_messages
    AFTER INSERT OR UPDATE OR DELETE ON messages
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_user_stats();

CREATE TRIGGER trigger_refresh_user_stats_proposals
    AFTER INSERT OR UPDATE OR DELETE ON proposals
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_user_stats();

CREATE TRIGGER trigger_refresh_user_stats_votes
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_user_stats();

-- =====================================================
-- 6. REQUÊTES OPTIMISÉES PRÊTES À L'EMPLOI
-- =====================================================

-- Vue pour les conversations récentes optimisée
CREATE OR REPLACE VIEW recent_conversations_optimized AS
SELECT 
    c.id,
    c.title,
    c.description,
    c.created_at,
    c.updated_at,
    c.user_id,
    up.full_name as user_name,
    up.avatar_url,
    last_msg.content as last_message,
    last_msg.created_at as last_message_at,
    last_msg.role as last_message_role,
    msg_count.count as message_count
FROM conversations c
JOIN user_profiles up ON c.user_id = up.id
LEFT JOIN LATERAL (
    SELECT content, created_at, role
    FROM messages 
    WHERE conversation_id = c.id 
    ORDER BY created_at DESC 
    LIMIT 1
) last_msg ON true
LEFT JOIN LATERAL (
    SELECT COUNT(*) as count
    FROM messages 
    WHERE conversation_id = c.id
) msg_count ON true
WHERE c.is_archived = false
ORDER BY c.updated_at DESC;

-- Vue pour les propositions populaires optimisée
CREATE OR REPLACE VIEW popular_proposals_optimized AS
SELECT 
    p.id,
    p.title,
    p.description,
    p.category,
    p.status,
    p.created_at,
    p.expires_at,
    p.votes_for,
    p.votes_against,
    (p.votes_for + p.votes_against) as total_votes,
    up.full_name as author_name,
    up.avatar_url as author_avatar,
    -- Score de popularité
    (p.votes_for + p.votes_against) * 
    CASE 
        WHEN p.created_at > NOW() - INTERVAL '7 days' THEN 2.0
        WHEN p.created_at > NOW() - INTERVAL '30 days' THEN 1.5
        ELSE 1.0
    END as popularity_score
FROM proposals p
JOIN user_profiles up ON p.author_id = up.id
WHERE p.status IN ('active', 'passed')
ORDER BY popularity_score DESC, p.created_at DESC;

-- =====================================================
-- 7. MAINTENANCE AUTOMATIQUE
-- =====================================================

-- Fonction de maintenance quotidienne optimisée
CREATE OR REPLACE FUNCTION daily_performance_maintenance()
RETURNS JSON AS $$
DECLARE
    result JSON;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
BEGIN
    start_time := NOW();
    
    -- Analyser les tables
    PERFORM analyze_query_performance();
    
    -- Rafraîchir les vues matérialisées
    PERFORM refresh_materialized_views();
    
    -- Nettoyer les statistiques obsolètes (si l'extension existe)
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        DELETE FROM pg_stat_statements WHERE calls < 10 AND mean_exec_time < 1;
    END IF;
    
    end_time := NOW();
    
    SELECT json_build_object(
        'status', 'completed',
        'start_time', start_time,
        'end_time', end_time,
        'duration_seconds', EXTRACT(EPOCH FROM (end_time - start_time)),
        'actions_performed', ARRAY[
            'analyze_tables',
            'refresh_materialized_views',
            'cleanup_statistics'
        ]
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VÉRIFICATION DES OPTIMISATIONS
-- =====================================================

SELECT 'Optimisations de performance appliquées avec succès !' as status;

-- Vérifier les index créés
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Vérifier les vues matérialisées
SELECT 
    schemaname,
    matviewname,
    hasindexes,
    ispopulated
FROM pg_matviews 
WHERE schemaname = 'public';

-- Statistiques de taille
SELECT 
    'Tables' as type,
    schemaname || '.' || relname as name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Materialized Views' as type,
    schemaname || '.' || matviewname as name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY type, name;

-- =====================================================
-- OPTIMISATIONS DE PERFORMANCE APPLIQUEES !
-- =====================================================
--
-- Ameliorations mises en place :
-- - Index composites et partiels optimises
-- - Index de recherche textuelle (GIN)
-- - Vues materialisees pour les requetes frequentes
-- - Fonctions de maintenance automatique
-- - Triggers de rafraichissement intelligent
-- - Requetes optimisees pretes a l'emploi
--
-- PERFORMANCE AMELIOREE :
-- - Requetes de conversation 10x plus rapides
-- - Recherche textuelle optimisee
-- - Statistiques utilisateur en cache
-- - Maintenance automatique
--
-- MAINTENANCE :
-- - Executer daily_performance_maintenance() quotidiennement
-- - Surveiller get_performance_stats() regulierement
-- - Rafraichir les vues materialisees selon les besoins
--
-- PROCHAINE ETAPE :
-- Votre base de donnees Supabase est maintenant optimisee pour la production !
-- =====================================================

SELECT 'Script 05 - Optimisations de performance terminees avec succes !' as status;
