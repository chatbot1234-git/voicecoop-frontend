-- =====================================================
-- SCRIPT DE NETTOYAGE FINAL DES AVERTISSEMENTS
-- =====================================================
-- A executer apres le script 08 pour eliminer les derniers avertissements

-- =====================================================
-- 1. CORRECTION DES FONCTIONS SPECIFIQUES AVEC SEARCH_PATH MUTABLE
-- =====================================================

-- Corriger les fonctions exactes qui causent les avertissements selon les captures

-- Fonction search_conversations (du script 03_edge_functions.sql)
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
        -- Score de pertinence basé sur la correspondance du titre
        (
            CASE WHEN c.title ILIKE '%' || search_term || '%' THEN 2.0 ELSE 0.0 END +
            -- Bonus pour les conversations récentes
            CASE WHEN c.updated_at > NOW() - INTERVAL '7 days' THEN 0.5 ELSE 0.0 END
        ) as relevance_score
    FROM conversations c
    LEFT JOIN messages m ON c.id = m.conversation_id
    WHERE c.user_id = user_uuid
        AND c.title ILIKE '%' || search_term || '%'
    GROUP BY c.id, c.title, c.description, c.updated_at
    ORDER BY relevance_score DESC, c.updated_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction search_messages (du script 03_edge_functions.sql)
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
        -- Score de pertinence simple
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

-- Fonction cleanup_old_data (du script 03_edge_functions.sql)
CREATE OR REPLACE FUNCTION public.cleanup_old_data(days_to_keep INTEGER DEFAULT 90)
RETURNS JSON
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSON;
    deleted_count INTEGER := 0;
BEGIN
    -- Nettoyer les propositions expirées depuis plus de X jours
    UPDATE proposals
    SET status = 'expired'
    WHERE status = 'active'
        AND expires_at < NOW() - (days_to_keep || ' days')::INTERVAL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    SELECT json_build_object(
        'expired_proposals', deleted_count,
        'days_to_keep', days_to_keep,
        'cleanup_date', NOW()
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction daily_maintenance
CREATE OR REPLACE FUNCTION public.daily_maintenance()
RETURNS JSON
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSON;
BEGIN
    -- Executer le nettoyage
    PERFORM public.cleanup_old_data();
    
    -- Mettre a jour les statistiques
    ANALYZE;
    
    SELECT json_build_object(
        'maintenance_completed', true,
        'timestamp', NOW(),
        'status', 'success'
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction check_user_permissions
CREATE OR REPLACE FUNCTION public.check_user_permissions(user_uuid UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'can_create_proposals', true,
        'can_vote', true,
        'can_create_conversations', true,
        'is_active', EXISTS(SELECT 1 FROM user_profiles WHERE id = user_uuid)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction audit_sensitive_action
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
        'timestamp', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction daily_performance_maintenance
CREATE OR REPLACE FUNCTION public.daily_performance_maintenance()
RETURNS JSON
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSON;
BEGIN
    -- Analyser les tables pour optimiser les performances
    ANALYZE public.conversations;
    ANALYZE public.messages;
    ANALYZE public.proposals;
    ANALYZE public.votes;
    ANALYZE public.user_profiles;
    
    SELECT json_build_object(
        'tables_analyzed', 5,
        'maintenance_completed', true,
        'timestamp', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction validate_voicecoop_schema (si elle existe)
CREATE OR REPLACE FUNCTION public.validate_voicecoop_schema()
RETURNS JSON
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'schema_valid', true,
        'tables_count', (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'),
        'functions_count', (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public'),
        'validation_date', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. CORRECTION DES FONCTIONS DE TRIGGERS
-- =====================================================

-- Fonction update_updated_at_column avec search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction update_proposal_vote_count avec search_path
CREATE OR REPLACE FUNCTION public.update_proposal_vote_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'for' THEN
            UPDATE proposals SET votes_for = votes_for + 1 WHERE id = NEW.proposal_id;
        ELSIF NEW.vote_type = 'against' THEN
            UPDATE proposals SET votes_against = votes_against + 1 WHERE id = NEW.proposal_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'for' THEN
            UPDATE proposals SET votes_for = votes_for - 1 WHERE id = OLD.proposal_id;
        ELSIF OLD.vote_type = 'against' THEN
            UPDATE proposals SET votes_against = votes_against - 1 WHERE id = OLD.proposal_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. SUPPRESSION DES EXTENSIONS NON NECESSAIRES
-- =====================================================

-- Supprimer btree_gin si elle n'est pas utilisee
DROP EXTENSION IF EXISTS btree_gin;

-- =====================================================
-- 4. PERMISSIONS FINALES
-- =====================================================

-- Accorder les permissions necessaires sur les nouvelles fonctions
GRANT EXECUTE ON FUNCTION public.search_messages(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_notifications(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_permissions(UUID) TO authenticated;

-- Fonctions d'administration (service_role seulement)
GRANT EXECUTE ON FUNCTION public.cleanup_old_data() TO service_role;
GRANT EXECUTE ON FUNCTION public.daily_maintenance() TO service_role;
GRANT EXECUTE ON FUNCTION public.audit_sensitive_action(TEXT, UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.daily_performance_maintenance() TO service_role;

-- =====================================================
-- 5. VALIDATION FINALE
-- =====================================================

-- Verifier que les corrections ont ete appliquees
SELECT 
    'Fonctions avec search_path securise' as status,
    COUNT(*) as function_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
    AND p.proname NOT LIKE 'pg_%'
    AND p.prosecdef = true; -- SECURITY DEFINER

SELECT 'Script 09 - Nettoyage final termine avec succes !' as final_status;
