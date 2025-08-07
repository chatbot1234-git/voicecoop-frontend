-- =====================================================
-- POLITIQUES DE SÉCURITÉ AVANCÉES SUPABASE
-- =====================================================
-- Renforcement de la sécurité avec RLS granulaire

-- =====================================================
-- 1. POLITIQUES AVANCÉES POUR USER_PROFILES
-- =====================================================

-- Supprimer les anciennes politiques pour les recréer
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Politique de lecture : utilisateurs peuvent voir leur profil + profils publics
CREATE POLICY "Users can view profiles" ON user_profiles
    FOR SELECT TO authenticated
    USING (
        auth.uid() = id OR 
        -- Permettre la lecture des profils publics (pour les auteurs de propositions, etc.)
        id IN (
            SELECT DISTINCT author_id FROM proposals WHERE status IN ('active', 'passed')
            UNION
            SELECT DISTINCT user_id FROM votes
        )
    );

-- Politique de mise à jour : seulement son propre profil
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Politique d'insertion : seulement son propre profil
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- Politique de suppression : seulement son propre profil
CREATE POLICY "Users can delete own profile" ON user_profiles
    FOR DELETE TO authenticated
    USING (auth.uid() = id);

-- =====================================================
-- 2. POLITIQUES AVANCÉES POUR CONVERSATIONS
-- =====================================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can manage own conversations" ON conversations;

-- Politique de lecture : seulement ses propres conversations
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Politique d'insertion : créer des conversations pour soi-même
CREATE POLICY "Users can create own conversations" ON conversations
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Politique de mise à jour : modifier ses propres conversations
CREATE POLICY "Users can update own conversations" ON conversations
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Politique de suppression : supprimer ses propres conversations
CREATE POLICY "Users can delete own conversations" ON conversations
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- =====================================================
-- 3. POLITIQUES AVANCÉES POUR MESSAGES
-- =====================================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can manage own messages" ON messages;

-- Politique de lecture : messages de ses conversations
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT TO authenticated
    USING (
        -- Messages de ses propres conversations
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    );

-- Politique d'insertion : ajouter des messages à ses conversations
CREATE POLICY "Users can create messages in own conversations" ON messages
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Vérifier que la conversation appartient à l'utilisateur
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        ) AND
        -- L'utilisateur peut créer des messages utilisateur ou système peut créer des messages assistant
        (user_id = auth.uid() OR (user_id IS NULL AND role = 'assistant'))
    );

-- Politique de mise à jour : modifier ses propres messages (pas les messages IA)
CREATE POLICY "Users can update own messages" ON messages
    FOR UPDATE TO authenticated
    USING (
        user_id = auth.uid() AND
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        user_id = auth.uid() AND
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    );

-- Politique de suppression : supprimer ses propres messages
CREATE POLICY "Users can delete own messages" ON messages
    FOR DELETE TO authenticated
    USING (
        user_id = auth.uid() AND
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- 4. POLITIQUES AVANCÉES POUR PROPOSALS
-- =====================================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Anyone can view active proposals" ON proposals;
DROP POLICY IF EXISTS "Users can create proposals" ON proposals;
DROP POLICY IF EXISTS "Authors can update own proposals" ON proposals;

-- Politique de lecture : propositions publiques selon leur statut
CREATE POLICY "Users can view public proposals" ON proposals
    FOR SELECT TO authenticated
    USING (
        -- Propositions actives visibles par tous
        status = 'active' OR
        -- Propositions terminées visibles par tous
        status IN ('passed', 'rejected', 'expired') OR
        -- Brouillons visibles seulement par l'auteur
        (status = 'draft' AND author_id = auth.uid())
    );

-- Politique d'insertion : créer des propositions
CREATE POLICY "Users can create proposals" ON proposals
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = author_id AND
        -- Limiter le nombre de propositions actives par utilisateur
        (
            SELECT COUNT(*) 
            FROM proposals 
            WHERE author_id = auth.uid() AND status IN ('active', 'draft')
        ) < 5
    );

-- Politique de mise à jour : modifier ses propres propositions
CREATE POLICY "Authors can update own proposals" ON proposals
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = author_id AND
        -- Seulement les brouillons et propositions actives peuvent être modifiés par l'auteur
        status IN ('draft', 'active')
    )
    WITH CHECK (
        auth.uid() = author_id AND
        -- Permettre les transitions de statut logiques
        status IN ('draft', 'active', 'passed', 'rejected', 'expired')
    );

-- Politique de suppression : supprimer ses brouillons seulement
CREATE POLICY "Authors can delete own drafts" ON proposals
    FOR DELETE TO authenticated
    USING (
        auth.uid() = author_id AND
        status = 'draft'
    );

-- =====================================================
-- 5. POLITIQUES AVANCÉES POUR VOTES
-- =====================================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view votes on active proposals" ON votes;
DROP POLICY IF EXISTS "Users can vote on active proposals" ON votes;
DROP POLICY IF EXISTS "Users can update own votes" ON votes;

-- Politique de lecture : votes sur propositions publiques
CREATE POLICY "Users can view public votes" ON votes
    FOR SELECT TO authenticated
    USING (
        -- Votes sur propositions actives ou terminées
        proposal_id IN (
            SELECT id FROM proposals 
            WHERE status IN ('active', 'passed', 'rejected', 'expired')
        )
    );

-- Politique d'insertion : voter sur propositions actives
CREATE POLICY "Users can vote on active proposals" ON votes
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        -- Seulement sur propositions actives et non expirées
        proposal_id IN (
            SELECT id FROM proposals 
            WHERE status = 'active' 
            AND expires_at > NOW()
            AND author_id != auth.uid()  -- Pas voter sur ses propres propositions
        ) AND
        -- Limiter à un vote par proposition par utilisateur (géré par contrainte unique aussi)
        NOT EXISTS (
            SELECT 1 FROM votes 
            WHERE proposal_id = votes.proposal_id 
            AND user_id = auth.uid()
        )
    );

-- Politique de mise à jour : modifier son vote sur propositions actives
CREATE POLICY "Users can update own votes" ON votes
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = user_id AND
        proposal_id IN (
            SELECT id FROM proposals 
            WHERE status = 'active' 
            AND expires_at > NOW()
        )
    )
    WITH CHECK (
        auth.uid() = user_id AND
        proposal_id IN (
            SELECT id FROM proposals 
            WHERE status = 'active' 
            AND expires_at > NOW()
        )
    );

-- Politique de suppression : retirer son vote sur propositions actives
CREATE POLICY "Users can delete own votes" ON votes
    FOR DELETE TO authenticated
    USING (
        auth.uid() = user_id AND
        proposal_id IN (
            SELECT id FROM proposals 
            WHERE status = 'active' 
            AND expires_at > NOW()
        )
    );

-- =====================================================
-- 6. POLITIQUES DE STORAGE
-- =====================================================

-- Supprimer les anciennes politiques de storage
DROP POLICY IF EXISTS "Users can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Politiques pour audio-files
CREATE POLICY "Users can upload own audio files" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'audio-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
        -- Note: La limitation de taille sera gérée côté application
    );

CREATE POLICY "Users can view own audio files" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'audio-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own audio files" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'audio-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own audio files" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'audio-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Politiques pour avatars
CREATE POLICY "Users can upload own avatars" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
        -- Note: La limitation de taille sera gérée côté application
    );

CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT TO authenticated USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatars" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own avatars" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- 7. FONCTIONS DE SÉCURITÉ SUPPLÉMENTAIRES
-- =====================================================

-- Fonction pour vérifier les permissions d'accès
CREATE OR REPLACE FUNCTION check_user_permissions(
    user_uuid UUID,
    resource_type TEXT,
    resource_id UUID,
    action TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    CASE resource_type
        WHEN 'conversation' THEN
            RETURN EXISTS (
                SELECT 1 FROM conversations 
                WHERE id = resource_id AND user_id = user_uuid
            );
        WHEN 'proposal' THEN
            CASE action
                WHEN 'read' THEN
                    RETURN EXISTS (
                        SELECT 1 FROM proposals 
                        WHERE id = resource_id 
                        AND (status IN ('active', 'passed', 'rejected', 'expired') OR author_id = user_uuid)
                    );
                WHEN 'write' THEN
                    RETURN EXISTS (
                        SELECT 1 FROM proposals 
                        WHERE id = resource_id AND author_id = user_uuid
                    );
                ELSE
                    RETURN FALSE;
            END CASE;
        WHEN 'vote' THEN
            RETURN EXISTS (
                SELECT 1 FROM votes 
                WHERE id = resource_id AND user_id = user_uuid
            );
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour auditer les actions sensibles
CREATE OR REPLACE FUNCTION audit_sensitive_action(
    user_uuid UUID,
    action_type TEXT,
    resource_type TEXT,
    resource_id UUID,
    details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
    -- Log dans une table d'audit (à créer si nécessaire)
    -- Pour l'instant, on utilise les logs PostgreSQL
    RAISE LOG 'AUDIT: User % performed % on % % with details %', 
        user_uuid, action_type, resource_type, resource_id, details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. CONTRAINTES DE SÉCURITÉ SUPPLÉMENTAIRES
-- =====================================================

-- Note: Contrainte de limitation des conversations gérée par l'application
-- ALTER TABLE conversations ADD CONSTRAINT check_max_conversations_per_user
--     CHECK (
--         (SELECT COUNT(*) FROM conversations WHERE user_id = conversations.user_id AND NOT is_archived) <= 100
--     ) NOT VALID;
-- Cette contrainte est commentée car elle peut causer des problèmes de performance

-- Limiter la longueur des messages (avec vérification d'existence)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'check_message_length'
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE messages ADD CONSTRAINT check_message_length
            CHECK (length(content) <= 10000);
    END IF;
END $$;

-- Limiter la longueur des propositions (avec vérification d'existence)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'check_proposal_title_length'
        AND table_name = 'proposals'
    ) THEN
        ALTER TABLE proposals ADD CONSTRAINT check_proposal_title_length
            CHECK (length(title) <= 200);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'check_proposal_description_length'
        AND table_name = 'proposals'
    ) THEN
        ALTER TABLE proposals ADD CONSTRAINT check_proposal_description_length
            CHECK (length(description) <= 5000);
    END IF;
END $$;

-- Vérifier que les dates d'expiration sont dans le futur
ALTER TABLE proposals ADD CONSTRAINT check_expires_at_future
    CHECK (expires_at > created_at);

-- =====================================================
-- VÉRIFICATION DES POLITIQUES DE SÉCURITÉ
-- =====================================================

SELECT 'Politiques de sécurité avancées créées avec succès !' as status;

-- Compter les politiques par table
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Vérifier les contraintes de sécurité
SELECT 
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
    AND constraint_type = 'CHECK'
    AND table_name IN ('conversations', 'messages', 'proposals', 'votes')
ORDER BY table_name, constraint_name;

-- INSTRUCTIONS FINALES
/*
🔒 SÉCURITÉ AVANCÉE CONFIGURÉE AVEC SUCCÈS !

Protections mises en place :
✅ RLS granulaire sur toutes les tables
✅ Politiques de storage sécurisées
✅ Contraintes de validation des données
✅ Fonctions d'audit et de permissions
✅ Limites de ressources par utilisateur

🛡️ SÉCURITÉ RENFORCÉE :
- Accès strict aux données personnelles
- Validation des permissions en temps réel
- Audit des actions sensibles
- Protection contre les abus

🔄 PROCHAINE ÉTAPE :
Exécuter 05_performance_optimization.sql pour optimiser les performances
*/
