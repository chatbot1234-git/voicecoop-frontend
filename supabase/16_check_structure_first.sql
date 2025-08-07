-- =====================================================
-- SCRIPT 16 - VERIFICATION DE STRUCTURE D'ABORD
-- =====================================================
-- Voir exactement quelles colonnes existent avant de corriger

-- =====================================================
-- 1. VERIFICATION COMPLETE DE LA STRUCTURE
-- =====================================================

-- Voir toutes les tables du schéma public
SELECT 
    'Tables disponibles:' as info,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Voir les colonnes de user_profiles (si elle existe)
SELECT 
    'Colonnes de user_profiles:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Voir les colonnes de conversations (pour référence)
SELECT 
    'Colonnes de conversations:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'conversations'
ORDER BY ordinal_position;

-- Voir les colonnes de messages (pour référence)
SELECT 
    'Colonnes de messages:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'messages'
ORDER BY ordinal_position;

-- Voir les colonnes de proposals (pour référence)
SELECT 
    'Colonnes de proposals:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'proposals'
ORDER BY ordinal_position;

-- Voir les colonnes de votes (pour référence)
SELECT 
    'Colonnes de votes:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'votes'
ORDER BY ordinal_position;

-- =====================================================
-- 2. VERIFICATION DES FONCTIONS EXISTANTES
-- =====================================================

-- Lister toutes les fonctions SECURITY DEFINER problématiques
SELECT 
    'Fonctions SECURITY DEFINER sans search_path:' as status,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as definition_preview
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

-- =====================================================
-- 3. VERIFICATION DES VUES MATERIALISEES
-- =====================================================

-- Voir les vues matérialisées existantes
SELECT 
    'Vues matérialisées existantes:' as info,
    matviewname as view_name,
    definition
FROM pg_matviews 
WHERE schemaname = 'public'
ORDER BY matviewname;

SELECT 'Vérification terminée ! Analysez les résultats avant de continuer.' as message;
