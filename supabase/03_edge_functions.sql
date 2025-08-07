-- =====================================================
-- EDGE FUNCTIONS ET FONCTIONS AVANCÉES SUPABASE
-- =====================================================
-- Fonctions PostgreSQL avancées pour VoiceCoop

-- =====================================================
-- 1. FONCTIONS DE STATISTIQUES
-- =====================================================

-- Fonction pour obtenir les statistiques utilisateur
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
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
        ),
        'last_activity', (
            SELECT MAX(created_at) FROM (
                SELECT created_at FROM messages WHERE user_id = user_uuid
                UNION ALL
                SELECT created_at FROM proposals WHERE author_id = user_uuid
                UNION ALL
                SELECT created_at FROM votes WHERE user_id = user_uuid
            ) activities
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques globales de la plateforme
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM auth.users),
        'active_users_last_30_days', (
            SELECT COUNT(DISTINCT user_id) FROM (
                SELECT user_id FROM messages WHERE created_at > NOW() - INTERVAL '30 days'
                UNION
                SELECT author_id as user_id FROM proposals WHERE created_at > NOW() - INTERVAL '30 days'
                UNION
                SELECT user_id FROM votes WHERE created_at > NOW() - INTERVAL '30 days'
            ) active_users
        ),
        'total_conversations', (SELECT COUNT(*) FROM conversations),
        'total_messages', (SELECT COUNT(*) FROM messages),
        'active_proposals', (SELECT COUNT(*) FROM proposals WHERE status = 'active'),
        'total_votes', (SELECT COUNT(*) FROM votes),
        'storage_usage', json_build_object(
            'audio_files', (
                SELECT COALESCE(SUM(metadata->>'size')::bigint, 0) 
                FROM storage.objects 
                WHERE bucket_id = 'audio-files'
            ),
            'avatars', (
                SELECT COALESCE(SUM(metadata->>'size')::bigint, 0) 
                FROM storage.objects 
                WHERE bucket_id = 'avatars'
            )
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. FONCTIONS DE GOUVERNANCE AVANCÉES
-- =====================================================

-- Fonction pour calculer le résultat d'une proposition
CREATE OR REPLACE FUNCTION calculate_proposal_result(proposal_uuid UUID)
RETURNS JSON AS $$
DECLARE
    proposal_record proposals%ROWTYPE;
    result JSON;
    total_votes INTEGER;
    participation_rate DECIMAL;
    total_eligible_voters INTEGER;
BEGIN
    -- Récupérer la proposition
    SELECT * INTO proposal_record FROM proposals WHERE id = proposal_uuid;
    
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Proposition non trouvée');
    END IF;
    
    -- Calculer les statistiques
    total_votes := proposal_record.votes_for + proposal_record.votes_against;
    
    -- Nombre total d'utilisateurs éligibles (inscrits avant la création de la proposition)
    SELECT COUNT(*) INTO total_eligible_voters 
    FROM auth.users 
    WHERE created_at < proposal_record.created_at;
    
    participation_rate := CASE 
        WHEN total_eligible_voters > 0 THEN (total_votes::DECIMAL / total_eligible_voters) * 100
        ELSE 0
    END;
    
    SELECT json_build_object(
        'proposal_id', proposal_uuid,
        'title', proposal_record.title,
        'status', proposal_record.status,
        'votes_for', proposal_record.votes_for,
        'votes_against', proposal_record.votes_against,
        'total_votes', total_votes,
        'quorum_required', proposal_record.quorum_required,
        'quorum_met', total_votes >= proposal_record.quorum_required,
        'participation_rate', ROUND(participation_rate, 2),
        'approval_rate', CASE 
            WHEN total_votes > 0 THEN ROUND((proposal_record.votes_for::DECIMAL / total_votes) * 100, 2)
            ELSE 0
        END,
        'expires_at', proposal_record.expires_at,
        'is_expired', proposal_record.expires_at < NOW(),
        'recommendation', CASE
            WHEN total_votes < proposal_record.quorum_required THEN 'Quorum non atteint'
            WHEN proposal_record.votes_for > proposal_record.votes_against THEN 'Approuvée'
            WHEN proposal_record.votes_for < proposal_record.votes_against THEN 'Rejetée'
            ELSE 'Égalité'
        END
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour clôturer automatiquement les propositions expirées
CREATE OR REPLACE FUNCTION close_expired_proposals()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Mettre à jour les propositions expirées
    UPDATE proposals 
    SET status = CASE
        WHEN votes_for > votes_against AND (votes_for + votes_against) >= quorum_required THEN 'passed'
        WHEN votes_for <= votes_against AND (votes_for + votes_against) >= quorum_required THEN 'rejected'
        ELSE 'expired'
    END
    WHERE status = 'active' 
        AND expires_at < NOW();
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. FONCTIONS DE RECHERCHE ET FILTRAGE
-- =====================================================

-- Fonction de recherche dans les conversations
CREATE OR REPLACE FUNCTION search_conversations(
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
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.description,
        COUNT(m.id) as message_count,
        MAX(m.created_at) as last_message_at,
        -- Score de pertinence basé sur la correspondance du titre et de la description
        (
            CASE WHEN c.title ILIKE '%' || search_term || '%' THEN 2.0 ELSE 0.0 END +
            CASE WHEN c.description ILIKE '%' || search_term || '%' THEN 1.0 ELSE 0.0 END +
            -- Bonus pour les conversations récentes
            CASE WHEN c.updated_at > NOW() - INTERVAL '7 days' THEN 0.5 ELSE 0.0 END
        ) as relevance_score
    FROM conversations c
    LEFT JOIN messages m ON c.id = m.conversation_id
    WHERE c.user_id = user_uuid
        AND (
            c.title ILIKE '%' || search_term || '%' 
            OR c.description ILIKE '%' || search_term || '%'
        )
    GROUP BY c.id, c.title, c.description, c.updated_at
    ORDER BY relevance_score DESC, c.updated_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction de recherche dans les messages
CREATE OR REPLACE FUNCTION search_messages(
    user_uuid UUID,
    search_term TEXT,
    conversation_uuid UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE(
    message_id UUID,
    conversation_id UUID,
    conversation_title TEXT,
    content TEXT,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    relevance_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.conversation_id,
        c.title,
        m.content,
        m.role,
        m.created_at,
        -- Score de pertinence basé sur la correspondance du contenu
        (
            CASE WHEN m.content ILIKE '%' || search_term || '%' THEN 1.0 ELSE 0.0 END +
            -- Bonus pour les messages récents
            CASE WHEN m.created_at > NOW() - INTERVAL '7 days' THEN 0.3 ELSE 0.0 END +
            -- Bonus pour les messages utilisateur (plus pertinents que les réponses IA)
            CASE WHEN m.role = 'user' THEN 0.2 ELSE 0.0 END
        ) as relevance_score
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE c.user_id = user_uuid
        AND m.content ILIKE '%' || search_term || '%'
        AND (conversation_uuid IS NULL OR m.conversation_id = conversation_uuid)
    ORDER BY relevance_score DESC, m.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. FONCTIONS DE NETTOYAGE ET MAINTENANCE
-- =====================================================

-- Fonction pour nettoyer les anciennes données
CREATE OR REPLACE FUNCTION cleanup_old_data(days_to_keep INTEGER DEFAULT 90)
RETURNS JSON AS $$
DECLARE
    deleted_messages INTEGER;
    deleted_conversations INTEGER;
    deleted_proposals INTEGER;
    result JSON;
BEGIN
    -- Supprimer les anciens messages des conversations archivées
    DELETE FROM messages 
    WHERE conversation_id IN (
        SELECT id FROM conversations 
        WHERE is_archived = true 
        AND updated_at < NOW() - INTERVAL '1 day' * days_to_keep
    );
    GET DIAGNOSTICS deleted_messages = ROW_COUNT;
    
    -- Supprimer les anciennes conversations archivées
    DELETE FROM conversations 
    WHERE is_archived = true 
    AND updated_at < NOW() - INTERVAL '1 day' * days_to_keep;
    GET DIAGNOSTICS deleted_conversations = ROW_COUNT;
    
    -- Supprimer les anciennes propositions expirées/rejetées
    DELETE FROM proposals 
    WHERE status IN ('expired', 'rejected') 
    AND created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    GET DIAGNOSTICS deleted_proposals = ROW_COUNT;
    
    SELECT json_build_object(
        'deleted_messages', deleted_messages,
        'deleted_conversations', deleted_conversations,
        'deleted_proposals', deleted_proposals,
        'cleanup_date', NOW(),
        'days_kept', days_to_keep
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. FONCTIONS DE NOTIFICATION
-- =====================================================

-- Fonction pour obtenir les notifications d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_notifications(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'new_proposals', (
            SELECT json_agg(json_build_object(
                'id', id,
                'title', title,
                'category', category,
                'created_at', created_at
            ))
            FROM proposals 
            WHERE status = 'active' 
            AND created_at > NOW() - INTERVAL '7 days'
            AND author_id != user_uuid
        ),
        'proposal_results', (
            SELECT json_agg(json_build_object(
                'id', p.id,
                'title', p.title,
                'status', p.status,
                'votes_for', p.votes_for,
                'votes_against', p.votes_against
            ))
            FROM proposals p
            JOIN votes v ON p.id = v.proposal_id
            WHERE v.user_id = user_uuid
            AND p.status IN ('passed', 'rejected', 'expired')
            AND p.updated_at > NOW() - INTERVAL '7 days'
        ),
        'conversation_activity', (
            SELECT COUNT(*)
            FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE c.user_id = user_uuid
            AND m.role = 'assistant'
            AND m.created_at > NOW() - INTERVAL '24 hours'
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. TÂCHES AUTOMATISÉES (CRON JOBS)
-- =====================================================

-- Note: Ces fonctions peuvent être appelées par des Edge Functions ou des cron jobs

-- Fonction pour les tâches quotidiennes
CREATE OR REPLACE FUNCTION daily_maintenance()
RETURNS JSON AS $$
DECLARE
    closed_proposals INTEGER;
    cleanup_result JSON;
    result JSON;
BEGIN
    -- Clôturer les propositions expirées
    SELECT close_expired_proposals() INTO closed_proposals;
    
    -- Nettoyer les anciennes données (garder 90 jours)
    SELECT cleanup_old_data(90) INTO cleanup_result;
    
    SELECT json_build_object(
        'maintenance_date', NOW(),
        'closed_proposals', closed_proposals,
        'cleanup_result', cleanup_result,
        'status', 'completed'
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. PERMISSIONS ET SÉCURITÉ
-- =====================================================

-- Accorder les permissions appropriées
GRANT EXECUTE ON FUNCTION get_user_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_proposal_result(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_conversations(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION search_messages(UUID, TEXT, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notifications(UUID) TO authenticated;

-- Fonctions d'administration (service role seulement)
GRANT EXECUTE ON FUNCTION close_expired_proposals() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_data(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION daily_maintenance() TO service_role;

-- =====================================================
-- VÉRIFICATION DES FONCTIONS CRÉÉES
-- =====================================================

SELECT 'Edge Functions créées avec succès !' as status;

SELECT 
    'Fonctions disponibles:' as section,
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND proname IN (
        'get_user_stats',
        'get_platform_stats', 
        'calculate_proposal_result',
        'close_expired_proposals',
        'search_conversations',
        'search_messages',
        'cleanup_old_data',
        'get_user_notifications',
        'daily_maintenance'
    )
ORDER BY proname;

-- INSTRUCTIONS FINALES
/*
🎯 EDGE FUNCTIONS CRÉÉES AVEC SUCCÈS !

Ces fonctions avancées permettent :
✅ Statistiques utilisateur et plateforme
✅ Calculs de gouvernance automatisés
✅ Recherche intelligente dans les données
✅ Maintenance automatique
✅ Système de notifications

🔧 UTILISATION :
- Appelez ces fonctions depuis votre frontend
- Configurez des cron jobs pour la maintenance
- Utilisez les fonctions de recherche pour l'UX

🔄 PROCHAINE ÉTAPE :
Exécuter 04_security_policies.sql pour renforcer la sécurité
*/
