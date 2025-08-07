#!/usr/bin/env node

/**
 * Script de Test CRUD Supabase Cloud
 * Teste les opérations Create, Read, Update, Delete sur les tables
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables d\'environnement Supabase manquantes');
    process.exit(1);
}

// Client Supabase Admin (pour bypasser RLS dans les tests)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Test CRUD sur la table user_profiles
 */
async function testUserProfilesCRUD() {
    console.log('👤 Test CRUD user_profiles...');
    
    const testUserId = `test-user-${Date.now()}`;
    const testData = {
        id: testUserId,
        full_name: 'Test User CRUD',
        bio: 'Utilisateur de test pour CRUD',
        preferences: { theme: 'dark', language: 'fr' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    try {
        // CREATE - Créer un profil utilisateur
        console.log('  📝 CREATE...');
        const { data: createData, error: createError } = await supabase
            .from('user_profiles')
            .insert(testData)
            .select()
            .single();
        
        if (createError) {
            console.error('  ❌ Erreur CREATE:', createError.message);
            return false;
        }
        console.log('  ✅ CREATE réussi:', createData.id);
        
        // READ - Lire le profil créé
        console.log('  📖 READ...');
        const { data: readData, error: readError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', testUserId)
            .single();
        
        if (readError) {
            console.error('  ❌ Erreur READ:', readError.message);
            return false;
        }
        console.log('  ✅ READ réussi:', readData.full_name);
        
        // UPDATE - Mettre à jour le profil
        console.log('  ✏️ UPDATE...');
        const updatedData = {
            full_name: 'Test User CRUD Updated',
            bio: 'Bio mise à jour',
            preferences: { theme: 'light', language: 'en' },
            updated_at: new Date().toISOString()
        };
        
        const { data: updateData, error: updateError } = await supabase
            .from('user_profiles')
            .update(updatedData)
            .eq('id', testUserId)
            .select()
            .single();
        
        if (updateError) {
            console.error('  ❌ Erreur UPDATE:', updateError.message);
            return false;
        }
        console.log('  ✅ UPDATE réussi:', updateData.full_name);
        
        // DELETE - Supprimer le profil
        console.log('  🗑️ DELETE...');
        const { error: deleteError } = await supabase
            .from('user_profiles')
            .delete()
            .eq('id', testUserId);
        
        if (deleteError) {
            console.error('  ❌ Erreur DELETE:', deleteError.message);
            return false;
        }
        console.log('  ✅ DELETE réussi');
        
        return true;
    } catch (error) {
        console.error('  ❌ Erreur CRUD user_profiles:', error.message);
        return false;
    }
}

/**
 * Test CRUD sur la table conversations
 */
async function testConversationsCRUD() {
    console.log('\n💬 Test CRUD conversations...');
    
    // Créer d'abord un utilisateur de test
    const testUserId = `conv-user-${Date.now()}`;
    await supabase.from('user_profiles').insert({
        id: testUserId,
        full_name: 'Conversation Test User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });
    
    const testConvId = `conv-${Date.now()}`;
    const testData = {
        id: testConvId,
        user_id: testUserId,
        title: 'Test Conversation',
        description: 'Conversation de test pour CRUD',
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    try {
        // CREATE
        console.log('  📝 CREATE...');
        const { data: createData, error: createError } = await supabase
            .from('conversations')
            .insert(testData)
            .select()
            .single();
        
        if (createError) {
            console.error('  ❌ Erreur CREATE:', createError.message);
            return false;
        }
        console.log('  ✅ CREATE réussi:', createData.title);
        
        // READ
        console.log('  📖 READ...');
        const { data: readData, error: readError } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', testConvId)
            .single();
        
        if (readError) {
            console.error('  ❌ Erreur READ:', readError.message);
            return false;
        }
        console.log('  ✅ READ réussi:', readData.title);
        
        // UPDATE
        console.log('  ✏️ UPDATE...');
        const { data: updateData, error: updateError } = await supabase
            .from('conversations')
            .update({
                title: 'Test Conversation Updated',
                description: 'Description mise à jour',
                updated_at: new Date().toISOString()
            })
            .eq('id', testConvId)
            .select()
            .single();
        
        if (updateError) {
            console.error('  ❌ Erreur UPDATE:', updateError.message);
            return false;
        }
        console.log('  ✅ UPDATE réussi:', updateData.title);
        
        // DELETE
        console.log('  🗑️ DELETE...');
        const { error: deleteError } = await supabase
            .from('conversations')
            .delete()
            .eq('id', testConvId);
        
        if (deleteError) {
            console.error('  ❌ Erreur DELETE:', deleteError.message);
            return false;
        }
        console.log('  ✅ DELETE réussi');
        
        // Nettoyer l'utilisateur de test
        await supabase.from('user_profiles').delete().eq('id', testUserId);
        
        return true;
    } catch (error) {
        console.error('  ❌ Erreur CRUD conversations:', error.message);
        return false;
    }
}

/**
 * Test CRUD sur la table messages
 */
async function testMessagesCRUD() {
    console.log('\n📨 Test CRUD messages...');
    
    // Créer les données de test nécessaires
    const testUserId = `msg-user-${Date.now()}`;
    const testConvId = `msg-conv-${Date.now()}`;
    
    // Créer utilisateur et conversation de test
    await supabase.from('user_profiles').insert({
        id: testUserId,
        full_name: 'Message Test User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });
    
    await supabase.from('conversations').insert({
        id: testConvId,
        user_id: testUserId,
        title: 'Test Conversation for Messages',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });
    
    const testMsgId = `msg-${Date.now()}`;
    const testData = {
        id: testMsgId,
        conversation_id: testConvId,
        user_id: testUserId,
        content: 'Message de test pour CRUD',
        role: 'user',
        created_at: new Date().toISOString()
    };
    
    try {
        // CREATE
        console.log('  📝 CREATE...');
        const { data: createData, error: createError } = await supabase
            .from('messages')
            .insert(testData)
            .select()
            .single();
        
        if (createError) {
            console.error('  ❌ Erreur CREATE:', createError.message);
            return false;
        }
        console.log('  ✅ CREATE réussi:', createData.content.substring(0, 30) + '...');
        
        // READ
        console.log('  📖 READ...');
        const { data: readData, error: readError } = await supabase
            .from('messages')
            .select('*')
            .eq('id', testMsgId)
            .single();
        
        if (readError) {
            console.error('  ❌ Erreur READ:', readError.message);
            return false;
        }
        console.log('  ✅ READ réussi:', readData.role);
        
        // UPDATE
        console.log('  ✏️ UPDATE...');
        const { data: updateData, error: updateError } = await supabase
            .from('messages')
            .update({
                content: 'Message de test mis à jour',
                role: 'assistant'
            })
            .eq('id', testMsgId)
            .select()
            .single();
        
        if (updateError) {
            console.error('  ❌ Erreur UPDATE:', updateError.message);
            return false;
        }
        console.log('  ✅ UPDATE réussi:', updateData.role);
        
        // DELETE
        console.log('  🗑️ DELETE...');
        const { error: deleteError } = await supabase
            .from('messages')
            .delete()
            .eq('id', testMsgId);
        
        if (deleteError) {
            console.error('  ❌ Erreur DELETE:', deleteError.message);
            return false;
        }
        console.log('  ✅ DELETE réussi');
        
        // Nettoyer les données de test
        await supabase.from('conversations').delete().eq('id', testConvId);
        await supabase.from('user_profiles').delete().eq('id', testUserId);
        
        return true;
    } catch (error) {
        console.error('  ❌ Erreur CRUD messages:', error.message);
        return false;
    }
}

/**
 * Test des requêtes complexes avec jointures
 */
async function testComplexQueries() {
    console.log('\n🔍 Test requêtes complexes...');
    
    try {
        // Test jointure conversations + messages
        console.log('  🔗 Test jointure conversations + messages...');
        const { data: joinData, error: joinError } = await supabase
            .from('conversations')
            .select(`
                id,
                title,
                user_id,
                messages (
                    id,
                    content,
                    role,
                    created_at
                )
            `)
            .limit(5);
        
        if (joinError) {
            console.error('  ❌ Erreur jointure:', joinError.message);
            return false;
        }
        console.log(`  ✅ Jointure réussie: ${joinData.length} conversations récupérées`);
        
        // Test agrégation
        console.log('  📊 Test agrégation...');
        const { data: countData, error: countError } = await supabase
            .from('user_profiles')
            .select('*', { count: 'exact', head: true });
        
        if (countError) {
            console.error('  ❌ Erreur agrégation:', countError.message);
            return false;
        }
        console.log(`  ✅ Agrégation réussie: ${countData} utilisateurs`);
        
        // Test filtrage avancé
        console.log('  🎯 Test filtrage avancé...');
        const { data: filterData, error: filterError } = await supabase
            .from('conversations')
            .select('*')
            .eq('is_archived', false)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (filterError) {
            console.error('  ❌ Erreur filtrage:', filterError.message);
            return false;
        }
        console.log(`  ✅ Filtrage réussi: ${filterData.length} conversations actives`);
        
        return true;
    } catch (error) {
        console.error('  ❌ Erreur requêtes complexes:', error.message);
        return false;
    }
}

/**
 * Fonction principale de test CRUD
 */
async function runCRUDTests() {
    console.log('🗄️ Tests CRUD Supabase Cloud');
    console.log('============================\n');
    
    const results = {
        userProfiles: false,
        conversations: false,
        messages: false,
        complexQueries: false
    };
    
    // Test CRUD user_profiles
    results.userProfiles = await testUserProfilesCRUD();
    
    // Test CRUD conversations
    results.conversations = await testConversationsCRUD();
    
    // Test CRUD messages
    results.messages = await testMessagesCRUD();
    
    // Test requêtes complexes
    results.complexQueries = await testComplexQueries();
    
    // Rapport final
    console.log('\n📊 Rapport des Tests CRUD');
    console.log('=========================');
    console.log(`👤 User Profiles: ${results.userProfiles ? '✅' : '❌'}`);
    console.log(`💬 Conversations: ${results.conversations ? '✅' : '❌'}`);
    console.log(`📨 Messages: ${results.messages ? '✅' : '❌'}`);
    console.log(`🔍 Requêtes Complexes: ${results.complexQueries ? '✅' : '❌'}`);
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Résultat: ${successCount}/${totalTests} tests réussis (${Math.round(successCount/totalTests*100)}%)`);
    
    if (successCount === totalTests) {
        console.log('🎉 Tous les tests CRUD sont réussis !');
        return true;
    } else {
        console.log('⚠️ Certains tests ont échoué. Vérifiez la configuration.');
        return false;
    }
}

// Exécuter les tests si le script est appelé directement
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
    runCRUDTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Erreur fatale:', error);
            process.exit(1);
        });
}

export { runCRUDTests };
