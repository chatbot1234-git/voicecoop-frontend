-- =====================================================
-- SCRIPT 11 - CORRECTION SIMPLE DES SEARCH_PATH
-- =====================================================
-- Correction uniquement des search_path sans changer les signatures

-- =====================================================
-- 1. CORRECTION DES FONCTIONS EXISTANTES
-- =====================================================

-- Fonction get_user_stats - ajout du SET search_path
ALTER FUNCTION public.get_user_stats(UUID) SET search_path = public, pg_temp;

-- Fonction calculate_proposal_result - ajout du SET search_path  
ALTER FUNCTION public.calculate_proposal_result(UUID) SET search_path = public, pg_temp;

-- Fonction close_expired_proposals - ajout du SET search_path
ALTER FUNCTION public.close_expired_proposals() SET search_path = public, pg_temp;

-- Fonction search_conversations - ajout du SET search_path
ALTER FUNCTION public.search_conversations(UUID, TEXT, INTEGER) SET search_path = public, pg_temp;

-- Fonction search_messages - ajout du SET search_path
ALTER FUNCTION public.search_messages(UUID, TEXT, UUID, INTEGER) SET search_path = public, pg_temp;

-- Fonction refresh_materialized_views - ajout du SET search_path
ALTER FUNCTION public.refresh_materialized_views() SET search_path = public, pg_temp;

-- Fonction analyze_query_performance - ajout du SET search_path
ALTER FUNCTION public.analyze_query_performance() SET search_path = public, pg_temp;

-- Fonction trigger_refresh_user_stats - ajout du SET search_path
ALTER FUNCTION public.trigger_refresh_user_stats() SET search_path = public, pg_temp;

-- Fonction update_proposal_vote_count - ajout du SET search_path
ALTER FUNCTION public.update_proposal_vote_count() SET search_path = public, pg_temp;

-- Fonction create_user_profile - ajout du SET search_path
ALTER FUNCTION public.create_user_profile() SET search_path = public, pg_temp;

-- Fonction create_test_user - ajout du SET search_path (si elle existe avec cette signature)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'create_test_user'
        AND pg_get_function_arguments(p.oid) = 'test_email text, test_username text DEFAULT NULL::text'
    ) THEN
        ALTER FUNCTION public.create_test_user(TEXT, TEXT) SET search_path = public, pg_temp;
    END IF;
END $$;

-- Fonction get_app_config - ajout du SET search_path (si elle existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_app_config') THEN
        ALTER FUNCTION public.get_app_config() SET search_path = public, pg_temp;
    END IF;
END $$;

-- Fonction update_app_config - ajout du SET search_path (si elle existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_app_config') THEN
        ALTER FUNCTION public.update_app_config(TEXT, JSONB) SET search_path = public, pg_temp;
    END IF;
END $$;

-- Fonction audit_sensitive_action - ajout du SET search_path (si elle existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'audit_sensitive_action') THEN
        ALTER FUNCTION public.audit_sensitive_action(TEXT, UUID, JSONB) SET search_path = public, pg_temp;
    END IF;
END $$;

-- Fonction cleanup_old_data - ajout du SET search_path (si elle existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_old_data') THEN
        ALTER FUNCTION public.cleanup_old_data(INTEGER) SET search_path = public, pg_temp;
    END IF;
END $$;

-- Fonction daily_maintenance - ajout du SET search_path (si elle existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'daily_maintenance') THEN
        ALTER FUNCTION public.daily_maintenance() SET search_path = public, pg_temp;
    END IF;
END $$;

-- Fonction check_user_permissions - ajout du SET search_path (si elle existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_user_permissions') THEN
        ALTER FUNCTION public.check_user_permissions(UUID) SET search_path = public, pg_temp;
    END IF;
END $$;

-- =====================================================
-- 2. VERIFICATION DES CORRECTIONS
-- =====================================================

-- Verifier que les fonctions ont maintenant un search_path securise
SELECT 
    'Fonctions avec search_path securise' as status,
    COUNT(*) as function_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
    AND p.proname IN (
        'get_user_stats',
        'calculate_proposal_result', 
        'close_expired_proposals',
        'search_conversations',
        'search_messages',
        'refresh_materialized_views',
        'analyze_query_performance',
        'trigger_refresh_user_stats',
        'update_proposal_vote_count',
        'create_user_profile',
        'cleanup_old_data',
        'daily_maintenance',
        'check_user_permissions'
    )
    AND p.prosecdef = true -- SECURITY DEFINER
    AND p.proconfig IS NOT NULL; -- A un SET search_path

-- Lister les fonctions qui ont encore des problemes
SELECT 
    'Fonctions sans search_path securise' as warning,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
    AND p.proname NOT LIKE 'pg_%'
    AND p.prosecdef = true -- SECURITY DEFINER
    AND (p.proconfig IS NULL OR NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) AS config 
        WHERE config LIKE 'search_path=%'
    ))
ORDER BY p.proname;

SELECT 'Script 11 - Correction simple des search_path termine !' as final_status;
