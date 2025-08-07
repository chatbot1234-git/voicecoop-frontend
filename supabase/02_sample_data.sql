-- =====================================================
-- DONNÉES DE TEST POUR VOICECOOP
-- =====================================================
-- À exécuter après avoir vérifié que le schéma est correct
-- ATTENTION: Ne pas exécuter en production !

-- Vérification que nous sommes bien en développement
DO $$
BEGIN
    -- Vérification de sécurité pour éviter l'exécution en production
    RAISE NOTICE '⚠️  ATTENTION: Insertion de données de test pour VoiceCoop...';
    RAISE NOTICE '⚠️  Ne pas exécuter ce script en production !';
    RAISE NOTICE '✅ Continuons avec l''insertion des données de test...';
END $$;

-- =====================================================
-- 1. FONCTION DE CRÉATION D'UTILISATEURS DE TEST
-- =====================================================

-- Fonction pour créer des utilisateurs de test de manière sécurisée
CREATE OR REPLACE FUNCTION public.create_test_user(
    email text,
    password text,
    full_name text DEFAULT NULL,
    user_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
    user_id uuid;
    encrypted_pw text;
BEGIN
    user_id := gen_random_uuid();
    encrypted_pw := crypt(password, gen_salt('bf'));

    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        user_id,
        'authenticated',
        'authenticated',
        email,
        encrypted_pw,
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        user_metadata,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );

    INSERT INTO auth.identities (
        provider_id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        user_id,
        user_id,
        format('{"sub":"%s","email":"%s"}', user_id::text, email)::jsonb,
        'email',
        NOW(),
        NOW(),
        NOW()
    );

    RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. CRÉATION DES UTILISATEURS DE TEST
-- =====================================================

-- Créer les utilisateurs de test avec la fonction
DO $$
DECLARE
    alice_id uuid;
    bob_id uuid;
    charlie_id uuid;
    diana_id uuid;
BEGIN
    -- Créer Alice
    alice_id := public.create_test_user(
        'alice@voicecoop.test',
        'password123',
        'Alice Développeuse',
        '{"full_name": "Alice Développeuse"}'::jsonb
    );

    -- Créer Bob
    bob_id := public.create_test_user(
        'bob@voicecoop.test',
        'password123',
        'Bob Designer',
        '{"full_name": "Bob Designer"}'::jsonb
    );

    -- Créer Charlie
    charlie_id := public.create_test_user(
        'charlie@voicecoop.test',
        'password123',
        'Charlie Data Scientist',
        '{"full_name": "Charlie Data Scientist"}'::jsonb
    );

    -- Créer Diana
    diana_id := public.create_test_user(
        'diana@voicecoop.test',
        'password123',
        'Diana Community Manager',
        '{"full_name": "Diana Community Manager"}'::jsonb
    );

    -- Insérer les profils étendus
    INSERT INTO public.user_profiles (id, full_name, bio, preferences, avatar_url) VALUES
    (
        alice_id,
        'Alice Développeuse',
        'Développeuse Full-Stack passionnée par l''IA vocale et la gouvernance coopérative.',
        '{"theme": "dark", "language": "fr", "notifications": true, "voice_model": "gemini-pro"}',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'
    ),
    (
        bob_id,
        'Bob Designer',
        'Designer UX/UI spécialisé dans les interfaces conversationnelles.',
        '{"theme": "light", "language": "fr", "notifications": false, "voice_model": "ultravox"}',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'
    ),
    (
        charlie_id,
        'Charlie Data Scientist',
        'Expert en machine learning et traitement du langage naturel.',
        '{"theme": "auto", "language": "en", "notifications": true, "voice_model": "gemini-pro"}',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie'
    ),
    (
        diana_id,
        'Diana Community Manager',
        'Responsable communauté et gouvernance participative.',
        '{"theme": "dark", "language": "fr", "notifications": true, "voice_model": "ultravox"}',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana'
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Utilisateurs de test créés avec succès !';
    RAISE NOTICE 'Alice ID: %', alice_id;
    RAISE NOTICE 'Bob ID: %', bob_id;
    RAISE NOTICE 'Charlie ID: %', charlie_id;
    RAISE NOTICE 'Diana ID: %', diana_id;
    RAISE NOTICE 'Mot de passe pour tous: password123';
END $$;

-- =====================================================
-- 3. CONVERSATIONS DE TEST
-- =====================================================

-- Note: Nous utilisons des UUIDs génériques pour les conversations
-- En production, utilisez gen_random_uuid() ou laissez PostgreSQL générer les UUIDs

INSERT INTO public.conversations (user_id, title, description, model_config, is_archived)
SELECT
    up.id as user_id,
    conv.title,
    conv.description,
    conv.model_config::jsonb,
    conv.is_archived
FROM user_profiles up
CROSS JOIN (
    VALUES
    ('Alice Développeuse', 'Première conversation avec l''IA', 'Test initial des capacités conversationnelles', '{"model": "gemini-pro", "temperature": 0.7, "max_tokens": 2048}', false),
    ('Alice Développeuse', 'Développement de fonctionnalités', 'Discussion sur les nouvelles fonctionnalités à implémenter', '{"model": "gemini-pro", "temperature": 0.5, "max_tokens": 4096}', false),
    ('Bob Designer', 'Design de l''interface vocale', 'Brainstorming sur l''expérience utilisateur vocale', '{"model": "ultravox", "temperature": 0.8, "max_tokens": 2048}', false),
    ('Charlie Data Scientist', 'Analyse des données conversationnelles', 'Étude des patterns dans les conversations utilisateurs', '{"model": "gemini-pro", "temperature": 0.3, "max_tokens": 8192}', true)
) AS conv(user_name, title, description, model_config, is_archived)
WHERE up.full_name = conv.user_name;

-- =====================================================
-- 4. MESSAGES DE TEST
-- =====================================================

-- Insérer des messages de test pour les conversations créées
INSERT INTO public.messages (conversation_id, user_id, content, role, metadata, tokens_used)
SELECT
    c.id as conversation_id,
    CASE
        WHEN msg.role = 'user' THEN c.user_id
        ELSE NULL
    END as user_id,
    msg.content,
    msg.role,
    msg.metadata::jsonb,
    msg.tokens_used
FROM conversations c
JOIN user_profiles up ON c.user_id = up.id
CROSS JOIN (
    VALUES
    ('Première conversation avec l''IA', 'Bonjour ! Je teste VoiceCoop pour la première fois.', 'user', '{"timestamp": "2024-01-15T10:00:00Z", "client": "web"}', 12),
    ('Première conversation avec l''IA', 'Bonjour ! Bienvenue sur VoiceCoop. Je suis votre assistant IA coopératif. Comment puis-je vous aider aujourd''hui ?', 'assistant', '{"model": "gemini-pro", "confidence": 0.95, "processing_time": 1.2}', 28),
    ('Première conversation avec l''IA', 'Peux-tu m''expliquer le concept de gouvernance coopérative ?', 'user', '{"timestamp": "2024-01-15T10:01:30Z", "client": "web"}', 15),
    ('Première conversation avec l''IA', 'La gouvernance coopérative est un modèle de prise de décision démocratique où tous les membres participent aux choix stratégiques. Dans VoiceCoop, cela signifie que vous pouvez proposer des améliorations, voter sur les orientations, et participer aux bénéfices générés par la plateforme.', 'assistant', '{"model": "gemini-pro", "confidence": 0.92, "processing_time": 2.1}', 67),

    ('Développement de fonctionnalités', 'J''aimerais proposer une nouvelle fonctionnalité : la synthèse vocale en temps réel.', 'user', '{"timestamp": "2024-01-16T14:30:00Z", "client": "web"}', 18),
    ('Développement de fonctionnalités', 'Excellente idée ! La synthèse vocale en temps réel améliorerait considérablement l''expérience utilisateur. Voulez-vous que je vous aide à rédiger une proposition formelle pour la soumettre au vote de la communauté ?', 'assistant', '{"model": "gemini-pro", "confidence": 0.88, "processing_time": 1.8}', 45),

    ('Design de l''interface vocale', 'Comment optimiser l''interface pour les interactions vocales ?', 'user', '{"timestamp": "2024-01-17T09:15:00Z", "client": "mobile"}', 13),
    ('Design de l''interface vocale', 'Pour optimiser l''interface vocale, je recommande : 1) Feedback visuel en temps réel, 2) Boutons d''action vocale proéminents, 3) Indicateurs de statut audio clairs, 4) Raccourcis gestuels pour les commandes fréquentes.', 'assistant', '{"model": "ultravox", "confidence": 0.91, "processing_time": 2.5}', 52)
) AS msg(conversation_title, content, role, metadata, tokens_used)
WHERE c.title = msg.conversation_title;

-- =====================================================
-- 5. PROPOSITIONS DE GOUVERNANCE DE TEST
-- =====================================================

-- Insérer des propositions de test avec les vrais UUIDs des utilisateurs
INSERT INTO public.proposals (title, description, category, author_id, status, quorum_required, metadata)
SELECT
    prop.title,
    prop.description,
    prop.category,
    up.id as author_id,
    prop.status,
    prop.quorum_required,
    prop.metadata::jsonb
FROM user_profiles up
CROSS JOIN (
    VALUES
    ('Bob Designer', 'Amélioration de l''interface utilisateur', 'Proposition pour moderniser le design de l''application avec un thème sombre par défaut, des animations fluides et une meilleure accessibilité.', 'feature', 'active', 15, '{"priority": "high", "estimated_effort": "2 weeks", "impact": "user_experience"}'),
    ('Diana Community Manager', 'Politique de modération communautaire', 'Définir les règles de modération de la communauté, les sanctions applicables et le processus d''appel.', 'governance', 'active', 20, '{"priority": "medium", "estimated_effort": "1 week", "impact": "community"}'),
    ('Charlie Data Scientist', 'Intégration de nouveaux modèles IA', 'Ajouter le support pour GPT-4, Claude-3 et d''autres modèles de langage avancés.', 'technical', 'active', 10, '{"priority": "high", "estimated_effort": "3 weeks", "impact": "functionality"}'),
    ('Alice Développeuse', 'Programme de récompenses pour contributeurs', 'Mettre en place un système de tokens pour récompenser les contributions actives à la plateforme.', 'governance', 'passed', 12, '{"priority": "medium", "estimated_effort": "4 weeks", "impact": "incentives"}')
) AS prop(author_name, title, description, category, status, quorum_required, metadata)
WHERE up.full_name = prop.author_name;

-- =====================================================
-- 6. VOTES DE TEST
-- =====================================================

-- Insérer des votes de test avec les vrais UUIDs
INSERT INTO public.votes (proposal_id, user_id, vote_type, comment, weight)
SELECT
    p.id as proposal_id,
    up.id as user_id,
    vote.vote_type,
    vote.comment,
    vote.weight
FROM proposals p
CROSS JOIN user_profiles up
CROSS JOIN (
    VALUES
    ('Amélioration de l''interface utilisateur', 'Alice Développeuse', 'for', 'Excellente idée, l''interface actuelle a besoin d''une modernisation.', 1),
    ('Amélioration de l''interface utilisateur', 'Charlie Data Scientist', 'for', 'Je soutiens cette proposition, surtout pour l''accessibilité.', 1),
    ('Amélioration de l''interface utilisateur', 'Diana Community Manager', 'for', 'Le thème sombre sera très apprécié par la communauté.', 1),

    ('Politique de modération communautaire', 'Alice Développeuse', 'for', 'Nécessaire pour maintenir un environnement sain.', 1),
    ('Politique de modération communautaire', 'Bob Designer', 'for', 'Important pour la croissance de la communauté.', 1),
    ('Politique de modération communautaire', 'Charlie Data Scientist', 'abstain', 'Je préfère voir plus de détails avant de voter.', 1),

    ('Intégration de nouveaux modèles IA', 'Alice Développeuse', 'for', 'GPT-4 apporterait de grandes améliorations.', 1),
    ('Intégration de nouveaux modèles IA', 'Bob Designer', 'for', 'Claude-3 est excellent pour les tâches créatives.', 1),
    ('Intégration de nouveaux modèles IA', 'Diana Community Manager', 'against', 'Les coûts pourraient être trop élevés pour le moment.', 1),

    ('Programme de récompenses pour contributeurs', 'Alice Développeuse', 'for', 'Motivera les contributeurs actifs.', 1),
    ('Programme de récompenses pour contributeurs', 'Bob Designer', 'for', 'Système équitable et transparent.', 1),
    ('Programme de récompenses pour contributeurs', 'Charlie Data Scientist', 'for', 'Encouragera l''innovation.', 1),
    ('Programme de récompenses pour contributeurs', 'Diana Community Manager', 'for', 'Excellente initiative pour la coopérative.', 1)
) AS vote(proposal_title, user_name, vote_type, comment, weight)
WHERE p.title = vote.proposal_title AND up.full_name = vote.user_name
ON CONFLICT (proposal_id, user_id) DO NOTHING;

-- =====================================================
-- 6. MISE À JOUR DES COMPTEURS DE VOTES
-- =====================================================

-- Les compteurs seront mis à jour automatiquement par les triggers
-- Mais on peut forcer une mise à jour pour s'assurer que tout est correct

UPDATE proposals SET
    votes_for = (SELECT COUNT(*) FROM votes WHERE proposal_id = proposals.id AND vote_type = 'for'),
    votes_against = (SELECT COUNT(*) FROM votes WHERE proposal_id = proposals.id AND vote_type = 'against')
WHERE id IN (
    '20000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000004'
);

-- =====================================================
-- 7. VÉRIFICATION DES DONNÉES INSÉRÉES
-- =====================================================

SELECT 'Données de test insérées avec succès !' as status;

SELECT 'Profils utilisateurs:' as section, COUNT(*) as count FROM user_profiles
UNION ALL
SELECT 'Conversations:', COUNT(*) FROM conversations
UNION ALL
SELECT 'Messages:', COUNT(*) FROM messages
UNION ALL
SELECT 'Propositions:', COUNT(*) FROM proposals
UNION ALL
SELECT 'Votes:', COUNT(*) FROM votes;

-- Afficher un résumé des propositions avec leurs votes
SELECT 
    p.title,
    p.category,
    p.status,
    p.votes_for,
    p.votes_against,
    (p.votes_for + p.votes_against) as total_votes,
    CASE 
        WHEN (p.votes_for + p.votes_against) >= p.quorum_required THEN 'Quorum atteint'
        ELSE 'Quorum non atteint'
    END as quorum_status
FROM proposals p
ORDER BY p.created_at DESC;

-- INSTRUCTIONS FINALES
/*
🎯 DONNÉES DE TEST CRÉÉES AVEC SUCCÈS !

Ces données vous permettent de :
✅ Tester l'authentification avec des profils existants
✅ Voir des conversations d'exemple
✅ Tester le système de gouvernance
✅ Valider les fonctionnalités de vote

⚠️ IMPORTANT :
- Ces données sont uniquement pour le développement
- Ne jamais exécuter ce script en production
- Supprimer ces données avant le déploiement final

🔄 PROCHAINE ÉTAPE :
Exécuter 03_edge_functions.sql pour les fonctions avancées
*/
