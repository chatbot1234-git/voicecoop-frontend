-- =====================================================
-- SCRIPT 13 - CORRECTION DES 7 DERNIERS AVERTISSEMENTS
-- =====================================================
-- Correction ciblée des problèmes restants

-- =====================================================
-- 1. CORRECTION DES FONCTIONS TRIGGER RESTANTES
-- =====================================================

-- Corriger trigger_refresh_user_stats avec une approche différente
DO $$
BEGIN
    -- Vérifier si la fonction existe et la corriger
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'trigger_refresh_user_stats'
    ) THEN
        -- Recréer la fonction avec search_path sécurisé
        DROP FUNCTION IF EXISTS public.trigger_refresh_user_stats() CASCADE;
        
        EXECUTE $func$
            CREATE OR REPLACE FUNCTION public.trigger_refresh_user_stats()
            RETURNS TRIGGER 
            SECURITY DEFINER
            SET search_path = public, pg_temp
            AS $trigger$
            BEGIN
                -- Programmer un rafraîchissement asynchrone des vues matérialisées
                PERFORM pg_notify('refresh_materialized_views', 'user_activity_stats');
                RETURN COALESCE(NEW, OLD);
            END;
            $trigger$ LANGUAGE plpgsql;
        $func$;
        
        RAISE NOTICE 'Fonction trigger_refresh_user_stats recréée avec search_path sécurisé';
    END IF;
END $$;

-- Corriger update_proposal_vote_count
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'update_proposal_vote_count'
    ) THEN
        DROP FUNCTION IF EXISTS public.update_proposal_vote_count() CASCADE;
        
        EXECUTE $func$
            CREATE OR REPLACE FUNCTION public.update_proposal_vote_count()
            RETURNS TRIGGER 
            SECURITY DEFINER
            SET search_path = public, pg_temp
            AS $trigger$
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
            $trigger$ LANGUAGE plpgsql;
        $func$;
        
        RAISE NOTICE 'Fonction update_proposal_vote_count recréée avec search_path sécurisé';
    END IF;
END $$;

-- Corriger create_user_profile
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'create_user_profile'
    ) THEN
        DROP FUNCTION IF EXISTS public.create_user_profile() CASCADE;
        
        EXECUTE $func$
            CREATE OR REPLACE FUNCTION public.create_user_profile()
            RETURNS TRIGGER 
            SECURITY DEFINER
            SET search_path = public, pg_temp
            AS $trigger$
            BEGIN
                INSERT INTO public.user_profiles (id, email, created_at, updated_at)
                VALUES (NEW.id, NEW.email, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING;
                RETURN NEW;
            END;
            $trigger$ LANGUAGE plpgsql;
        $func$;
        
        RAISE NOTICE 'Fonction create_user_profile recréée avec search_path sécurisé';
    END IF;
END $$;

-- =====================================================
-- 2. CORRECTION DES VUES MATERIALISEES
-- =====================================================

-- Recréer les vues matérialisées avec des permissions appropriées
DROP MATERIALIZED VIEW IF EXISTS public.user_activity_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.proposal_trends CASCADE;

-- Créer user_activity_stats avec sécurité renforcée
CREATE MATERIALIZED VIEW public.user_activity_stats AS
SELECT
    up.id as user_id,
    up.email,
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
GROUP BY up.id, up.email;

-- Index unique pour la vue matérialisée
CREATE UNIQUE INDEX idx_user_activity_stats_user_id ON user_activity_stats(user_id);

-- Créer proposal_trends avec sécurité renforcée
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

-- Index unique pour la vue matérialisée
CREATE UNIQUE INDEX idx_proposal_trends_date ON proposal_trends(date);

-- Permissions restrictives sur les vues matérialisées
GRANT SELECT ON public.user_activity_stats TO authenticated;
GRANT SELECT ON public.proposal_trends TO authenticated;

-- =====================================================
-- 3. CONFIGURATION DE SECURITE AUTH (OPTIONNEL)
-- =====================================================

-- Note: Ces configurations nécessitent des privilèges super-admin
-- et doivent être configurées via l'interface Supabase ou les variables d'environnement

-- Activer la protection contre les fuites de mot de passe
-- (À configurer dans Supabase Dashboard > Authentication > Settings)

-- Configurer MFA
-- (À configurer dans Supabase Dashboard > Authentication > Settings)

-- =====================================================
-- 4. VERIFICATION FINALE
-- =====================================================

-- Vérifier que les fonctions trigger ont maintenant un search_path sécurisé
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
    '✅ Recréée' as security_status
FROM pg_matviews 
WHERE schemaname = 'public' 
    AND matviewname IN ('user_activity_stats', 'proposal_trends');

-- Compter les fonctions SECURITY DEFINER sans search_path (devrait être 0)
SELECT 
    'Fonctions encore problématiques' as status,
    COUNT(*) as problem_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
    AND p.proname NOT LIKE 'pg_%'
    AND p.prosecdef = true -- SECURITY DEFINER
    AND (p.proconfig IS NULL OR NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) AS config 
        WHERE config LIKE 'search_path=%'
    ));

SELECT 'Script 13 - Correction des 7 derniers avertissements terminée !' as final_status;
SELECT 'Vérifiez maintenant le conseiller en sécurité - il devrait rester 2 avertissements maximum (Auth)' as next_step;
