-- =====================================================
-- SCRIPT 14 - CORRECTION FINALE ULTRA-SAFE
-- =====================================================
-- Correction des derniers avertissements avec vérification de structure

-- =====================================================
-- 1. VERIFICATION DE LA STRUCTURE DES TABLES
-- =====================================================

-- Vérifier les colonnes de user_profiles
SELECT 
    'Structure de user_profiles' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- =====================================================
-- 2. CORRECTION DES FONCTIONS TRIGGER RESTANTES
-- =====================================================

-- Corriger trigger_refresh_user_stats
DROP FUNCTION IF EXISTS public.trigger_refresh_user_stats() CASCADE;

CREATE OR REPLACE FUNCTION public.trigger_refresh_user_stats()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Programmer un rafraîchissement asynchrone des vues matérialisées
    PERFORM pg_notify('refresh_materialized_views', 'user_activity_stats');
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Corriger update_proposal_vote_count
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

-- Corriger create_user_profile
DROP FUNCTION IF EXISTS public.create_user_profile() CASCADE;

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

-- =====================================================
-- 3. CORRECTION DES VUES MATERIALISEES AVEC VERIFICATION
-- =====================================================

-- Supprimer les vues matérialisées existantes
DROP MATERIALIZED VIEW IF EXISTS public.user_activity_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.proposal_trends CASCADE;

-- Créer user_activity_stats avec les colonnes qui existent vraiment
DO $$
DECLARE
    has_username BOOLEAN;
    has_display_name BOOLEAN;
    sql_query TEXT;
BEGIN
    -- Vérifier si la colonne username existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
            AND table_name = 'user_profiles' 
            AND column_name = 'username'
    ) INTO has_username;
    
    -- Vérifier si la colonne display_name existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
            AND table_name = 'user_profiles' 
            AND column_name = 'display_name'
    ) INTO has_display_name;
    
    -- Construire la requête selon les colonnes disponibles
    sql_query := 'CREATE MATERIALIZED VIEW public.user_activity_stats AS SELECT up.id as user_id, up.email';
    
    IF has_username THEN
        sql_query := sql_query || ', up.username';
    ELSIF has_display_name THEN
        sql_query := sql_query || ', up.display_name as username';
    ELSE
        sql_query := sql_query || ', up.email as username';
    END IF;
    
    sql_query := sql_query || ', COUNT(DISTINCT c.id) as conversation_count, COUNT(DISTINCT m.id) as message_count, COUNT(DISTINCT p.id) as proposal_count, COUNT(DISTINCT v.id) as vote_count, MAX(m.created_at) as last_activity FROM user_profiles up LEFT JOIN conversations c ON up.id = c.user_id LEFT JOIN messages m ON up.id = m.user_id LEFT JOIN proposals p ON up.id = p.author_id LEFT JOIN votes v ON up.id = v.user_id GROUP BY up.id, up.email';
    
    IF has_username THEN
        sql_query := sql_query || ', up.username';
    ELSIF has_display_name THEN
        sql_query := sql_query || ', up.display_name';
    END IF;
    
    -- Exécuter la requête
    EXECUTE sql_query;
    
    RAISE NOTICE 'Vue user_activity_stats créée avec les colonnes disponibles';
END $$;

-- Index pour user_activity_stats
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_activity_stats_user_id ON user_activity_stats(user_id);

-- Créer proposal_trends (plus simple, pas de dépendance sur les colonnes)
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

-- Index pour proposal_trends
CREATE UNIQUE INDEX IF NOT EXISTS idx_proposal_trends_date ON proposal_trends(date);

-- Permissions sur les vues matérialisées
GRANT SELECT ON public.user_activity_stats TO authenticated;
GRANT SELECT ON public.proposal_trends TO authenticated;

-- =====================================================
-- 4. VERIFICATION FINALE
-- =====================================================

-- Vérifier les fonctions corrigées
SELECT 
    'Fonctions trigger corrigées' as status,
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
    'Vues matérialisées' as status,
    matviewname as view_name,
    '✅ Créée' as security_status
FROM pg_matviews 
WHERE schemaname = 'public' 
    AND matviewname IN ('user_activity_stats', 'proposal_trends');

-- Compter les fonctions encore problématiques
SELECT 
    'Fonctions encore problématiques' as status,
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

SELECT 'Script 14 - Correction finale ultra-safe terminée !' as final_status;
SELECT 'Vérifiez le conseiller en sécurité maintenant !' as next_step;
