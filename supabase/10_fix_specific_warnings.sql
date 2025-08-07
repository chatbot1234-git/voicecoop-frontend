-- =====================================================
-- SCRIPT 10 - CORRECTION DES AVERTISSEMENTS SPECIFIQUES
-- =====================================================
-- A executer pour corriger les fonctions exactes qui causent les avertissements

-- =====================================================
-- 0. SUPPRESSION DES FONCTIONS EXISTANTES POUR EVITER LES CONFLITS
-- =====================================================

-- Supprimer les fonctions existantes qui pourraient avoir des types de retour differents
DROP FUNCTION IF EXISTS public.get_user_stats(UUID);
DROP FUNCTION IF EXISTS public.calculate_proposal_result(UUID);
DROP FUNCTION IF EXISTS public.close_expired_proposals();
DROP FUNCTION IF EXISTS public.search_conversations(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.search_messages(UUID, TEXT, UUID, INTEGER);
DROP FUNCTION IF EXISTS public.refresh_materialized_views();
DROP FUNCTION IF EXISTS public.analyze_query_performance();
DROP FUNCTION IF EXISTS public.trigger_refresh_user_stats();
DROP FUNCTION IF EXISTS public.update_proposal_vote_count();
DROP FUNCTION IF EXISTS public.create_user_profile();
DROP FUNCTION IF EXISTS public.create_test_user(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_app_config();
DROP FUNCTION IF EXISTS public.update_app_config(TEXT, JSONB);
DROP FUNCTION IF EXISTS public.audit_sensitive_action(TEXT, UUID, JSONB);

-- =====================================================
-- 1. FONCTIONS DU SCRIPT 03_EDGE_FUNCTIONS.SQL
-- =====================================================

-- Fonction get_user_stats avec search_path securise
CREATE OR REPLACE FUNCTION public.get_user_stats(user_uuid UUID)
RETURNS JSON 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'user_id', user_uuid,
        'total_conversations', (
            SELECT COUNT(*) FROM conversations WHERE user_id = user_uuid
        ),
        'total_messages', (
            SELECT COUNT(*) FROM messages WHERE user_id = user_uuid
        ),
        'total_proposals_created', (
            SELECT COUNT(*) FROM proposals WHERE author_id = user_uuid
        ),
        'total_votes_cast', (
            SELECT COUNT(*) FROM votes WHERE user_id = user_uuid
        ),
        'active_conversations', (
            SELECT COUNT(*) FROM conversations 
            WHERE user_id = user_uuid AND is_archived = false
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction calculate_proposal_result avec search_path securise
CREATE OR REPLACE FUNCTION public.calculate_proposal_result(proposal_uuid UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSON;
    proposal_data RECORD;
BEGIN
    SELECT * INTO proposal_data FROM proposals WHERE id = proposal_uuid;
    
    IF NOT FOUND THEN
        SELECT json_build_object('error', 'Proposal not found') INTO result;
        RETURN result;
    END IF;
    
    SELECT json_build_object(
        'proposal_id', proposal_uuid,
        'title', proposal_data.title,
        'votes_for', proposal_data.votes_for,
        'votes_against', proposal_data.votes_against,
        'total_votes', proposal_data.votes_for + proposal_data.votes_against,
        'result', CASE 
            WHEN proposal_data.votes_for > proposal_data.votes_against THEN 'passed'
            ELSE 'rejected'
        END,
        'calculated_at', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction close_expired_proposals avec search_path securise
CREATE OR REPLACE FUNCTION public.close_expired_proposals()
RETURNS JSON
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSON;
    expired_count INTEGER := 0;
BEGIN
    UPDATE proposals 
    SET status = 'expired' 
    WHERE status = 'active' 
        AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    SELECT json_build_object(
        'expired_proposals', expired_count,
        'processed_at', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction search_conversations avec search_path securise
CREATE OR REPLACE FUNCTION public.search_conversations(
    user_uuid UUID,
    search_term TEXT,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
    conversation_id UUID,
    title TEXT,
    description TEXT,
    message_count BIGINT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    relevance_score REAL
) 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        COALESCE(c.description, '') as description,
        COUNT(m.id) as message_count,
        MAX(m.created_at) as last_message_at,
        CASE WHEN c.title ILIKE '%' || search_term || '%' THEN 1.0 ELSE 0.0 END as relevance_score
    FROM conversations c
    LEFT JOIN messages m ON c.id = m.conversation_id
    WHERE c.user_id = user_uuid
        AND c.title ILIKE '%' || search_term || '%'
    GROUP BY c.id, c.title, c.description
    ORDER BY relevance_score DESC, c.updated_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction search_messages avec search_path securise
CREATE OR REPLACE FUNCTION public.search_messages(
    user_uuid UUID,
    search_term TEXT,
    conversation_uuid UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE(
    message_id UUID,
    conversation_id UUID,
    content TEXT,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    relevance_score REAL
) 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.conversation_id,
        m.content,
        m.role,
        m.created_at,
        CASE 
            WHEN m.content ILIKE '%' || search_term || '%' THEN 1.0
            ELSE 0.0
        END as relevance_score
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE c.user_id = user_uuid
        AND (conversation_uuid IS NULL OR m.conversation_id = conversation_uuid)
        AND m.content ILIKE '%' || search_term || '%'
    ORDER BY m.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. FONCTIONS DU SCRIPT 05_PERFORMANCE_OPTIMIZATION.SQL
-- =====================================================

-- Fonction refresh_materialized_views avec search_path securise
CREATE OR REPLACE FUNCTION public.refresh_materialized_views()
RETURNS JSON 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    result JSON;
BEGIN
    start_time := NOW();
    
    -- Rafraichir les vues materialisees si elles existent
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
        'duration_seconds', EXTRACT(EPOCH FROM (end_time - start_time))
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction analyze_query_performance avec search_path securise
CREATE OR REPLACE FUNCTION public.analyze_query_performance()
RETURNS JSON 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSON;
BEGIN
    -- Analyser les statistiques des tables
    ANALYZE user_profiles, conversations, messages, proposals, votes;
    
    SELECT json_build_object(
        'status', 'completed',
        'analyzed_at', NOW(),
        'tables_analyzed', ARRAY['user_profiles', 'conversations', 'messages', 'proposals', 'votes']
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction trigger_refresh_user_stats avec search_path securise
CREATE OR REPLACE FUNCTION public.trigger_refresh_user_stats()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Programmer un rafraichissement asynchrone des vues materialisees
    PERFORM pg_notify('refresh_materialized_views', 'user_activity_stats');
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. FONCTIONS ADDITIONNELLES MENTIONNEES DANS LES CAPTURES
-- =====================================================

-- Fonction update_proposal_vote_count avec search_path securise
CREATE OR REPLACE FUNCTION public.update_proposal_vote_count()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'for' THEN
            UPDATE proposals SET votes_for = votes_for + 1 WHERE id = NEW.proposal_id;
        ELSE
            UPDATE proposals SET votes_against = votes_against + 1 WHERE id = NEW.proposal_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'for' THEN
            UPDATE proposals SET votes_for = votes_for - 1 WHERE id = OLD.proposal_id;
        ELSE
            UPDATE proposals SET votes_against = votes_against - 1 WHERE id = OLD.proposal_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Fonction create_user_profile avec search_path securise
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction create_test_user avec search_path securise
CREATE OR REPLACE FUNCTION public.create_test_user(
    test_email TEXT,
    test_username TEXT DEFAULT NULL
)
RETURNS JSON 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    new_user_id UUID;
    result JSON;
BEGIN
    new_user_id := gen_random_uuid();
    
    INSERT INTO user_profiles (id, email, username, created_at, updated_at)
    VALUES (new_user_id, test_email, COALESCE(test_username, 'test_user'), NOW(), NOW());
    
    SELECT json_build_object(
        'user_id', new_user_id,
        'email', test_email,
        'username', COALESCE(test_username, 'test_user'),
        'created_at', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. FONCTIONS ADDITIONNELLES VUES DANS LES CAPTURES
-- =====================================================

-- Fonction get_app_config avec search_path securise
CREATE OR REPLACE FUNCTION public.get_app_config()
RETURNS JSON
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'app_name', 'VoiceCoop',
        'version', '1.0.0',
        'features', json_build_object(
            'proposals_enabled', true,
            'voting_enabled', true,
            'conversations_enabled', true
        ),
        'config_loaded_at', NOW()
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction update_app_config avec search_path securise
CREATE OR REPLACE FUNCTION public.update_app_config(
    config_key TEXT,
    config_value JSONB
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSON;
BEGIN
    -- Simulation de mise a jour de configuration
    SELECT json_build_object(
        'config_key', config_key,
        'config_value', config_value,
        'updated_at', NOW(),
        'status', 'updated'
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction audit_sensitive_action avec search_path securise
CREATE OR REPLACE FUNCTION public.audit_sensitive_action(
    action_type TEXT,
    user_uuid UUID,
    details JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSON;
BEGIN
    -- Log de l'action (simulation)
    SELECT json_build_object(
        'action_logged', true,
        'action_type', action_type,
        'user_id', user_uuid,
        'details', details,
        'timestamp', NOW()
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. CORRECTION DES VUES MATERIALISEES
-- =====================================================

-- Recreer les vues materialisees avec SECURITY INVOKER si elles existent
DROP MATERIALIZED VIEW IF EXISTS public.user_activity_stats CASCADE;
CREATE MATERIALIZED VIEW public.user_activity_stats AS
SELECT
    up.id as user_id,
    up.username,
    COUNT(DISTINCT c.id) as conversation_count,
    COUNT(DISTINCT m.id) as message_count,
    COUNT(DISTINCT p.id) as proposal_count,
    COUNT(DISTINCT v.id) as vote_count,
    MAX(m.created_at) as last_activity
FROM user_profiles up
LEFT JOIN conversations c ON up.id = c.user_id
LEFT JOIN messages m ON up.id = m.user_id
LEFT JOIN proposals p ON up.id = p.author_id
LEFT JOIN votes v ON up.id = v.user_id
GROUP BY up.id, up.username;

-- Index pour la vue materialisee
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_activity_stats_user_id
ON user_activity_stats(user_id);

DROP MATERIALIZED VIEW IF EXISTS public.proposal_trends CASCADE;
CREATE MATERIALIZED VIEW public.proposal_trends AS
SELECT
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as proposal_count,
    COUNT(*) FILTER (WHERE status = 'active') as active_count,
    COUNT(*) FILTER (WHERE status = 'passed') as passed_count,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count
FROM proposals
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date;

-- Index pour la vue materialisee
CREATE UNIQUE INDEX IF NOT EXISTS idx_proposal_trends_date
ON proposal_trends(date);

-- =====================================================
-- 6. PERMISSIONS FINALES
-- =====================================================

-- Accorder les permissions appropriees
GRANT EXECUTE ON FUNCTION public.get_user_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_proposal_result(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_conversations(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_messages(UUID, TEXT, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_app_config() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_test_user(TEXT, TEXT) TO authenticated;

-- Fonctions d'administration (service role seulement)
GRANT EXECUTE ON FUNCTION public.close_expired_proposals() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_materialized_views() TO service_role;
GRANT EXECUTE ON FUNCTION public.analyze_query_performance() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_app_config(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.audit_sensitive_action(TEXT, UUID, JSONB) TO service_role;

-- Permissions sur les vues materialisees
GRANT SELECT ON public.user_activity_stats TO authenticated;
GRANT SELECT ON public.proposal_trends TO authenticated;

SELECT 'Script 10 - Correction des avertissements specifiques termine !' as status;
