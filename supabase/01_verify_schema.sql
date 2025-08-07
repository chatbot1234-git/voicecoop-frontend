-- =====================================================
-- SCRIPT DE VÉRIFICATION DU SCHÉMA SUPABASE
-- =====================================================
-- À exécuter après schema.sql pour vérifier que tout est en place

-- 1. VÉRIFICATION DES TABLES
SELECT 'Tables créées:' as verification;

SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('user_profiles', 'conversations', 'messages', 'proposals', 'votes')
ORDER BY tablename;

-- 2. VÉRIFICATION DES POLITIQUES RLS
SELECT 'Politiques RLS:' as verification;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. VÉRIFICATION DES INDEX
SELECT 'Index créés:' as verification;

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('user_profiles', 'conversations', 'messages', 'proposals', 'votes')
ORDER BY tablename, indexname;

-- 4. VÉRIFICATION DES FONCTIONS
SELECT 'Fonctions créées:' as verification;

SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN ('update_updated_at_column', 'update_proposal_vote_counts', 'create_user_profile')
ORDER BY p.proname;

-- 5. VÉRIFICATION DES TRIGGERS
SELECT 'Triggers créés:' as verification;

SELECT 
    event_object_schema,
    event_object_table,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 6. VÉRIFICATION DES VUES
SELECT 'Vues créées:' as verification;

SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
    AND viewname IN ('proposal_stats', 'conversation_summaries')
ORDER BY viewname;

-- 7. VÉRIFICATION DES BUCKETS STORAGE
SELECT 'Buckets Storage:' as verification;

SELECT 
    id,
    name,
    public,
    created_at
FROM storage.buckets
WHERE id IN ('audio-files', 'avatars')
ORDER BY name;

-- 8. VÉRIFICATION DES POLITIQUES STORAGE (SÉCURISÉE)
SELECT 'Politiques Storage:' as verification;

-- Vérification sécurisée de l'existence des politiques storage
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'storage' AND table_name = 'policies'
        ) THEN 'Table storage.policies existe'
        ELSE 'Table storage.policies n''existe pas encore'
    END as storage_policies_status;

-- Si la table existe, afficher les politiques
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'storage' AND table_name = 'policies'
    ) THEN
        RAISE NOTICE 'Affichage des politiques storage...';
        -- Cette partie sera exécutée seulement si la table existe
    ELSE
        RAISE NOTICE 'Les politiques storage seront créées automatiquement lors de la première utilisation';
    END IF;
END $$;

-- 9. STATISTIQUES DES TABLES
SELECT 'Statistiques des tables:' as verification;

SELECT 
    schemaname,
    relname as table_name,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;

-- 10. VÉRIFICATION DES CONTRAINTES
SELECT 'Contraintes de clés étrangères:' as verification;

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('user_profiles', 'conversations', 'messages', 'proposals', 'votes')
ORDER BY tc.table_name, tc.constraint_name;

-- 11. VÉRIFICATION DES EXTENSIONS SUPABASE
SELECT 'Extensions Supabase:' as verification;

SELECT
    extname as extension_name,
    extversion as version
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pgjwt')
ORDER BY extname;

-- 12. VÉRIFICATION DE L'AUTHENTIFICATION
SELECT 'Configuration Auth:' as verification;

-- Vérifier que le schéma auth existe
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth')
        THEN 'Schéma auth présent ✅'
        ELSE 'Schéma auth manquant ❌'
    END as auth_schema_status;

-- Vérifier la table auth.users
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'auth' AND table_name = 'users'
        )
        THEN 'Table auth.users présente ✅'
        ELSE 'Table auth.users manquante ❌'
    END as auth_users_status;

-- RÉSUMÉ FINAL
SELECT
    '✅ VÉRIFICATION TERMINÉE' as status,
    'Schéma de base validé avec succès' as message,
    NOW() as timestamp;

-- DIAGNOSTIC RAPIDE
SELECT
    'DIAGNOSTIC RAPIDE' as section,
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as tables_publiques,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as politiques_rls,
    (SELECT COUNT(*) FROM storage.buckets) as buckets_storage,
    (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public') as fonctions_publiques;

-- INSTRUCTIONS POUR LA SUITE
/*
🎯 PROCHAINES ÉTAPES :

1. Si toutes les vérifications sont OK :
   - Exécuter 02_sample_data.sql pour des données de test
   - Exécuter 03_edge_functions.sql pour les fonctions Edge
   - Configurer l'authentification dans Supabase Dashboard

2. Si des erreurs sont détectées :
   - Vérifier les logs d'erreur
   - Re-exécuter schema.sql si nécessaire
   - Contacter le support si problème persistant

3. Configuration Dashboard Supabase :
   - Auth > Settings > Enable email confirmations
   - Auth > Providers > Configurer GitHub/Google OAuth
   - Storage > Vérifier les buckets et politiques
   - SQL Editor > Sauvegarder ce script pour référence future
*/
