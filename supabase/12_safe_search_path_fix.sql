-- =====================================================
-- SCRIPT 12 - CORRECTION ULTRA-SAFE DES SEARCH_PATH
-- =====================================================
-- Correction uniquement des fonctions qui existent vraiment

-- =====================================================
-- 1. DETECTION ET CORRECTION AUTOMATIQUE
-- =====================================================

-- Corriger automatiquement toutes les fonctions SECURITY DEFINER sans search_path
DO $$
DECLARE
    func_record RECORD;
    sql_command TEXT;
BEGIN
    -- Parcourir toutes les fonctions SECURITY DEFINER sans search_path securise
    FOR func_record IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as function_args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
            AND p.proname NOT LIKE 'pg_%'
            AND p.prosecdef = true -- SECURITY DEFINER
            AND (p.proconfig IS NULL OR NOT EXISTS (
                SELECT 1 FROM unnest(p.proconfig) AS config 
                WHERE config LIKE 'search_path=%'
            ))
    LOOP
        -- Construire la commande ALTER FUNCTION
        sql_command := format(
            'ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
            func_record.schema_name,
            func_record.function_name,
            func_record.function_args
        );
        
        -- Executer la commande avec gestion d'erreur
        BEGIN
            EXECUTE sql_command;
            RAISE NOTICE 'Corrigé: %.%(%)', 
                func_record.schema_name, 
                func_record.function_name, 
                func_record.function_args;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erreur pour %.%(%): %', 
                func_record.schema_name, 
                func_record.function_name, 
                func_record.function_args,
                SQLERRM;
        END;
    END LOOP;
END $$;

-- =====================================================
-- 2. VERIFICATION DES RESULTATS
-- =====================================================

-- Compter les fonctions corrigees
SELECT 
    'Fonctions avec search_path securise' as status,
    COUNT(*) as function_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
    AND p.proname NOT LIKE 'pg_%'
    AND p.prosecdef = true -- SECURITY DEFINER
    AND p.proconfig IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM unnest(p.proconfig) AS config 
        WHERE config LIKE 'search_path=%'
    );

-- Lister les fonctions encore problematiques
SELECT 
    'Fonctions encore sans search_path' as warning,
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

-- Afficher un resume des fonctions corrigees
SELECT 
    'Resume des corrections' as section,
    p.proname as function_name,
    CASE 
        WHEN p.proconfig IS NOT NULL AND EXISTS (
            SELECT 1 FROM unnest(p.proconfig) AS config 
            WHERE config LIKE 'search_path=%'
        ) THEN '✅ Corrigé'
        ELSE '❌ Problème'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
    AND p.proname NOT LIKE 'pg_%'
    AND p.prosecdef = true -- SECURITY DEFINER
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
        'check_user_permissions',
        'get_app_config',
        'update_app_config',
        'audit_sensitive_action'
    )
ORDER BY p.proname;

SELECT 'Script 12 - Correction ultra-safe des search_path termine !' as final_status;
