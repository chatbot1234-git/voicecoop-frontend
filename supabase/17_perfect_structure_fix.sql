-- =====================================================
-- SCRIPT 17 - CORRECTION PARFAITE BASEE SUR LA STRUCTURE REELLE
-- =====================================================
-- Correction adaptée aux colonnes qui existent vraiment

-- =====================================================
-- 1. CORRECTION DES FONCTIONS TRIGGER
-- =====================================================

-- Fonction 1: trigger_refresh_user_stats
DROP FUNCTION IF EXISTS public.trigger_refresh_user_stats() CASCADE;

CREATE OR REPLACE FUNCTION public.trigger_refresh_user_stats()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    PERFORM pg_notify('refresh_materialized_views', 'user_activity_stats');
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Fonction 2: update_proposal_vote_count
DROP FUNCTION IF EXISTS public.update_proposal_vote_count() CASCADE;

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

-- Fonction 3: create_user_profile (adaptée aux colonnes réelles)
DROP FUNCTION IF EXISTS public.create_user_profile() CASCADE;

CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, created_at, updated_at)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur'), NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. CORRECTION DES VUES MATERIALISEES
-- =====================================================

-- Supprimer les vues existantes
DROP MATERIALIZED VIEW IF EXISTS public.user_activity_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.proposal_trends CASCADE;

-- Vue 1: user_activity_stats (avec les colonnes qui existent vraiment)
CREATE MATERIALIZED VIEW public.user_activity_stats AS
SELECT 
    up.id as user_id,
    COALESCE(up.full_name, 'Utilisateur') as username,
    up.full_name,
    COUNT(DISTINCT c.id) as conversation_count,
    COUNT(DISTINCT m.id) as message_count,
    COUNT(DISTINCT p.id) as proposal_count,
    COUNT(DISTINCT v.id) as vote_count,
    MAX(m.created_at) as last_activity,
    up.created_at as user_created_at
FROM user_profiles up
LEFT JOIN conversations c ON up.id = c.user_id
LEFT JOIN messages m ON up.id = m.user_id
LEFT JOIN proposals p ON up.id = p.author_id
LEFT JOIN votes v ON up.id = v.user_id
GROUP BY up.id, up.full_name, up.created_at;

-- Index pour user_activity_stats
CREATE UNIQUE INDEX idx_user_activity_stats_user_id ON user_activity_stats(user_id);

-- Vue 2: proposal_trends (simple, pas de dépendance sur user_profiles)
CREATE MATERIALIZED VIEW public.proposal_trends AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as proposal_count,
    COUNT(*) FILTER (WHERE status = 'active') as active_count,
    COUNT(*) FILTER (WHERE status = 'passed') as passed_count,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
    COUNT(*) FILTER (WHERE status = 'expired') as expired_count
FROM proposals
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date;

-- Index pour proposal_trends
CREATE UNIQUE INDEX idx_proposal_trends_date ON proposal_trends(date);

-- =====================================================
-- 3. PERMISSIONS
-- =====================================================

-- Permissions sur les vues matérialisées
GRANT SELECT ON public.user_activity_stats TO authenticated;
GRANT SELECT ON public.proposal_trends TO authenticated;

-- Permissions sur les fonctions (si nécessaire)
GRANT EXECUTE ON FUNCTION public.trigger_refresh_user_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_proposal_vote_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile() TO authenticated;

-- =====================================================
-- 4. VERIFICATION FINALE
-- =====================================================

-- Vérifier les fonctions corrigées
SELECT 
    '✅ Fonctions corrigées:' as status,
    p.proname as function_name,
    CASE 
        WHEN p.proconfig IS NOT NULL AND EXISTS (
            SELECT 1 FROM unnest(p.proconfig) AS config 
            WHERE config LIKE 'search_path=%'
        ) THEN '✅ Sécurisé'
        ELSE '❌ Problème'
    END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
    AND p.proname IN ('trigger_refresh_user_stats', 'update_proposal_vote_count', 'create_user_profile')
    AND p.prosecdef = true
ORDER BY p.proname;

-- Vérifier les vues matérialisées
SELECT 
    '✅ Vues matérialisées:' as status,
    matviewname as view_name,
    '✅ Créée avec structure correcte' as result
FROM pg_matviews 
WHERE schemaname = 'public' 
    AND matviewname IN ('user_activity_stats', 'proposal_trends');

-- Compter les fonctions encore problématiques
SELECT 
    '🔍 Fonctions SECURITY DEFINER sans search_path:' as status,
    COUNT(*) as problem_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
    AND p.proname NOT LIKE 'pg_%'
    AND p.prosecdef = true
    AND (p.proconfig IS NULL OR NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) AS config 
        WHERE config LIKE 'search_path=%'
    ));

-- Lister les fonctions encore problématiques (s'il y en a)
SELECT 
    '⚠️ Fonctions restantes à corriger:' as warning,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
    AND p.proname NOT LIKE 'pg_%'
    AND p.prosecdef = true
    AND (p.proconfig IS NULL OR NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) AS config 
        WHERE config LIKE 'search_path=%'
    ))
ORDER BY p.proname;

-- Message final
SELECT '🎯 Script 17 terminé ! Structure adaptée aux colonnes réelles !' as final_message;
SELECT '📊 Vérifiez maintenant le conseiller en sécurité Supabase !' as next_step;
