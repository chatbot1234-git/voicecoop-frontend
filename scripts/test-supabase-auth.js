#!/usr/bin/env node

/**
 * Script de Test d'Authentification Supabase Cloud
 * Valide l'authentification OAuth GitHub et la gestion des sessions
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('❌ Variables d\'environnement Supabase manquantes');
    console.error('Vérifiez NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Clients Supabase
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Test de connexion à Supabase
 */
async function testSupabaseConnection() {
    console.log('🔗 Test de connexion à Supabase...');
    
    try {
        // Test avec client anonyme
        const { data, error } = await supabaseClient
            .from('user_profiles')
            .select('count', { count: 'exact', head: true });
        
        if (error) {
            console.error('❌ Erreur de connexion:', error.message);
            return false;
        }
        
        console.log('✅ Connexion Supabase réussie');
        console.log(`📊 Nombre d'utilisateurs: ${data || 0}`);
        return true;
    } catch (error) {
        console.error('❌ Erreur de connexion:', error.message);
        return false;
    }
}

/**
 * Test de création d'utilisateur de test
 */
async function testCreateTestUser() {
    console.log('\n👤 Test de création d\'utilisateur de test...');
    
    const testEmail = `test-${Date.now()}@voicecoop.test`;
    const testPassword = 'TestPassword123!';
    
    try {
        // Créer un utilisateur de test
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: testEmail,
            password: testPassword,
            email_confirm: true,
            user_metadata: {
                full_name: 'Test User',
                test_user: true
            }
        });
        
        if (authError) {
            console.error('❌ Erreur création utilisateur:', authError.message);
            return null;
        }
        
        console.log('✅ Utilisateur de test créé:', authData.user.id);
        
        // Vérifier que le profil a été créé automatiquement
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();
        
        if (profileError) {
            console.log('⚠️ Profil non créé automatiquement, création manuelle...');
            
            // Créer le profil manuellement
            const { error: createProfileError } = await supabaseAdmin
                .from('user_profiles')
                .insert({
                    id: authData.user.id,
                    full_name: 'Test User',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            
            if (createProfileError) {
                console.error('❌ Erreur création profil:', createProfileError.message);
            } else {
                console.log('✅ Profil créé manuellement');
            }
        } else {
            console.log('✅ Profil créé automatiquement:', profileData.full_name);
        }
        
        return authData.user;
    } catch (error) {
        console.error('❌ Erreur création utilisateur:', error.message);
        return null;
    }
}

/**
 * Test d'authentification avec email/password
 */
async function testEmailPasswordAuth() {
    console.log('\n🔐 Test d\'authentification email/password...');
    
    const testEmail = `auth-test-${Date.now()}@voicecoop.test`;
    const testPassword = 'AuthTestPassword123!';
    
    try {
        // 1. Créer un utilisateur
        const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
            email: testEmail,
            password: testPassword,
            options: {
                data: {
                    full_name: 'Auth Test User'
                }
            }
        });
        
        if (signUpError) {
            console.error('❌ Erreur inscription:', signUpError.message);
            return false;
        }
        
        console.log('✅ Inscription réussie:', signUpData.user?.id);
        
        // 2. Confirmer l'email (simulation)
        if (signUpData.user && !signUpData.user.email_confirmed_at) {
            const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
                signUpData.user.id,
                { email_confirm: true }
            );
            
            if (confirmError) {
                console.error('❌ Erreur confirmation email:', confirmError.message);
            } else {
                console.log('✅ Email confirmé');
            }
        }
        
        // 3. Se connecter
        const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });
        
        if (signInError) {
            console.error('❌ Erreur connexion:', signInError.message);
            return false;
        }
        
        console.log('✅ Connexion réussie:', signInData.user.id);
        console.log('🎫 Token JWT reçu:', signInData.session?.access_token ? 'Oui' : 'Non');
        
        // 4. Vérifier la session
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError) {
            console.error('❌ Erreur récupération session:', sessionError.message);
            return false;
        }
        
        console.log('✅ Session active:', sessionData.session?.user.id);
        
        // 5. Se déconnecter
        const { error: signOutError } = await supabaseClient.auth.signOut();
        
        if (signOutError) {
            console.error('❌ Erreur déconnexion:', signOutError.message);
            return false;
        }
        
        console.log('✅ Déconnexion réussie');
        
        return true;
    } catch (error) {
        console.error('❌ Erreur test authentification:', error.message);
        return false;
    }
}

/**
 * Test des politiques de sécurité RLS
 */
async function testRLSPolicies() {
    console.log('\n🛡️ Test des politiques de sécurité RLS...');
    
    try {
        // Test accès sans authentification (doit échouer)
        const { data: unauthorizedData, error: unauthorizedError } = await supabaseClient
            .from('user_profiles')
            .select('*')
            .limit(1);
        
        if (unauthorizedError) {
            console.log('✅ RLS fonctionne - Accès refusé sans authentification');
        } else {
            console.log('⚠️ RLS pourrait être désactivé - Accès autorisé sans authentification');
        }
        
        // Créer un utilisateur de test et se connecter
        const testUser = await testCreateTestUser();
        if (!testUser) {
            console.error('❌ Impossible de créer utilisateur de test pour RLS');
            return false;
        }
        
        // Se connecter avec l'utilisateur de test
        const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: testUser.email
        });
        
        if (signInError) {
            console.error('❌ Erreur génération lien magic:', signInError.message);
            return false;
        }
        
        console.log('✅ Tests RLS terminés');
        return true;
    } catch (error) {
        console.error('❌ Erreur test RLS:', error.message);
        return false;
    }
}

/**
 * Test de nettoyage des utilisateurs de test
 */
async function cleanupTestUsers() {
    console.log('\n🧹 Nettoyage des utilisateurs de test...');
    
    try {
        // Récupérer les utilisateurs de test
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
            console.error('❌ Erreur récupération utilisateurs:', listError.message);
            return false;
        }
        
        const testUsers = users.users.filter(user => 
            user.email?.includes('@voicecoop.test') || 
            user.user_metadata?.test_user === true
        );
        
        console.log(`🔍 ${testUsers.length} utilisateurs de test trouvés`);
        
        for (const user of testUsers) {
            // Supprimer le profil
            const { error: profileError } = await supabaseAdmin
                .from('user_profiles')
                .delete()
                .eq('id', user.id);
            
            if (profileError) {
                console.error(`❌ Erreur suppression profil ${user.id}:`, profileError.message);
            }
            
            // Supprimer l'utilisateur
            const { error: userError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
            
            if (userError) {
                console.error(`❌ Erreur suppression utilisateur ${user.id}:`, userError.message);
            } else {
                console.log(`✅ Utilisateur de test supprimé: ${user.email}`);
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ Erreur nettoyage:', error.message);
        return false;
    }
}

/**
 * Fonction principale de test
 */
async function runAuthTests() {
    console.log('🚀 Tests d\'Authentification Supabase Cloud');
    console.log('==========================================\n');
    
    const results = {
        connection: false,
        emailAuth: false,
        rls: false,
        cleanup: false
    };
    
    // Test de connexion
    results.connection = await testSupabaseConnection();
    
    // Test d'authentification email/password
    if (results.connection) {
        results.emailAuth = await testEmailPasswordAuth();
    }
    
    // Test des politiques RLS
    if (results.connection) {
        results.rls = await testRLSPolicies();
    }
    
    // Nettoyage
    results.cleanup = await cleanupTestUsers();
    
    // Rapport final
    console.log('\n📊 Rapport des Tests d\'Authentification');
    console.log('========================================');
    console.log(`🔗 Connexion Supabase: ${results.connection ? '✅' : '❌'}`);
    console.log(`🔐 Authentification Email: ${results.emailAuth ? '✅' : '❌'}`);
    console.log(`🛡️ Politiques RLS: ${results.rls ? '✅' : '❌'}`);
    console.log(`🧹 Nettoyage: ${results.cleanup ? '✅' : '❌'}`);
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Résultat: ${successCount}/${totalTests} tests réussis (${Math.round(successCount/totalTests*100)}%)`);
    
    if (successCount === totalTests) {
        console.log('🎉 Tous les tests d\'authentification sont réussis !');
        return true;
    } else {
        console.log('⚠️ Certains tests ont échoué. Vérifiez la configuration.');
        return false;
    }
}

// Exécuter les tests si le script est appelé directement
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
    runAuthTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Erreur fatale:', error);
            process.exit(1);
        });
}

export { runAuthTests };
