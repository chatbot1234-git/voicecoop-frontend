#!/usr/bin/env node

/**
 * Script de Test APIs Next.js avec Supabase
 * Teste les endpoints API Next.js qui utilisent Supabase comme backend
 */

import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Configuration
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

/**
 * Utilitaire pour faire des requêtes HTTP
 */
async function makeRequest(method, endpoint, data = null, headers = {}) {
    try {
        const config = {
            method,
            url: `${API_BASE}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status || 500
        };
    }
}

/**
 * Test de l'API Health Check
 */
async function testHealthAPI() {
    console.log('🏥 Test API Health Check...');
    
    try {
        const result = await makeRequest('GET', '/health');
        
        if (result.success) {
            console.log('  ✅ Health Check réussi');
            console.log(`  📊 Status: ${result.data.status}`);
            console.log(`  🕐 Timestamp: ${result.data.timestamp}`);
            return true;
        } else {
            console.error('  ❌ Health Check échoué:', result.error);
            return false;
        }
    } catch (error) {
        console.error('  ❌ Erreur Health Check:', error.message);
        return false;
    }
}

/**
 * Test de l'API Analytics
 */
async function testAnalyticsAPI() {
    console.log('\n📊 Test API Analytics...');
    
    try {
        const result = await makeRequest('GET', '/analytics');
        
        if (result.success) {
            console.log('  ✅ Analytics réussi');
            console.log(`  👥 Utilisateurs: ${result.data.users || 0}`);
            console.log(`  💬 Conversations: ${result.data.conversations || 0}`);
            console.log(`  📨 Messages: ${result.data.messages || 0}`);
            return true;
        } else {
            console.error('  ❌ Analytics échoué:', result.error);
            return false;
        }
    } catch (error) {
        console.error('  ❌ Erreur Analytics:', error.message);
        return false;
    }
}

/**
 * Test de l'API Conversations
 */
async function testConversationsAPI() {
    console.log('\n💬 Test API Conversations...');
    
    try {
        // Test GET conversations
        console.log('  📖 Test GET conversations...');
        const getResult = await makeRequest('GET', '/conversations');
        
        if (getResult.success) {
            console.log(`  ✅ GET conversations réussi: ${getResult.data.length || 0} conversations`);
        } else {
            console.error('  ❌ GET conversations échoué:', getResult.error);
            return false;
        }
        
        // Test POST conversation (création)
        console.log('  📝 Test POST conversation...');
        const testConversation = {
            title: 'Test Conversation API',
            description: 'Conversation créée par test API'
        };
        
        const postResult = await makeRequest('POST', '/conversations', testConversation);
        
        if (postResult.success) {
            console.log('  ✅ POST conversation réussi');
            console.log(`  🆔 ID: ${postResult.data.id}`);
            
            // Test GET conversation spécifique
            console.log('  🔍 Test GET conversation spécifique...');
            const getOneResult = await makeRequest('GET', `/conversations/${postResult.data.id}`);
            
            if (getOneResult.success) {
                console.log('  ✅ GET conversation spécifique réussi');
            } else {
                console.error('  ❌ GET conversation spécifique échoué:', getOneResult.error);
            }
            
            return true;
        } else {
            console.error('  ❌ POST conversation échoué:', postResult.error);
            return false;
        }
    } catch (error) {
        console.error('  ❌ Erreur Conversations API:', error.message);
        return false;
    }
}

/**
 * Test de l'API Messages
 */
async function testMessagesAPI() {
    console.log('\n📨 Test API Messages...');
    
    try {
        // Créer d'abord une conversation pour les tests
        const conversationData = {
            title: 'Test Conversation for Messages',
            description: 'Conversation pour tester les messages'
        };
        
        const convResult = await makeRequest('POST', '/conversations', conversationData);
        
        if (!convResult.success) {
            console.error('  ❌ Impossible de créer conversation pour test messages');
            return false;
        }
        
        const conversationId = convResult.data.id;
        console.log(`  📝 Conversation créée: ${conversationId}`);
        
        // Test POST message
        console.log('  📤 Test POST message...');
        const testMessage = {
            conversation_id: conversationId,
            content: 'Message de test via API',
            role: 'user'
        };
        
        const postResult = await makeRequest('POST', '/messages', testMessage);
        
        if (postResult.success) {
            console.log('  ✅ POST message réussi');
            console.log(`  🆔 Message ID: ${postResult.data.id}`);
            
            // Test GET messages de la conversation
            console.log('  📖 Test GET messages...');
            const getResult = await makeRequest('GET', `/conversations/${conversationId}/messages`);
            
            if (getResult.success) {
                console.log(`  ✅ GET messages réussi: ${getResult.data.length || 0} messages`);
            } else {
                console.error('  ❌ GET messages échoué:', getResult.error);
            }
            
            return true;
        } else {
            console.error('  ❌ POST message échoué:', postResult.error);
            return false;
        }
    } catch (error) {
        console.error('  ❌ Erreur Messages API:', error.message);
        return false;
    }
}

/**
 * Test de l'API Governance
 */
async function testGovernanceAPI() {
    console.log('\n🏛️ Test API Governance...');
    
    try {
        // Test GET proposals
        console.log('  📋 Test GET proposals...');
        const getResult = await makeRequest('GET', '/governance/proposals');
        
        if (getResult.success) {
            console.log(`  ✅ GET proposals réussi: ${getResult.data.length || 0} propositions`);
        } else {
            console.error('  ❌ GET proposals échoué:', getResult.error);
            return false;
        }
        
        // Test POST proposal
        console.log('  📝 Test POST proposal...');
        const testProposal = {
            title: 'Proposition de Test API',
            description: 'Proposition créée par test API',
            type: 'feature'
        };
        
        const postResult = await makeRequest('POST', '/governance/proposals', testProposal);
        
        if (postResult.success) {
            console.log('  ✅ POST proposal réussi');
            console.log(`  🆔 Proposal ID: ${postResult.data.id}`);
            
            // Test GET metrics
            console.log('  📊 Test GET metrics...');
            const metricsResult = await makeRequest('GET', '/governance/metrics');
            
            if (metricsResult.success) {
                console.log('  ✅ GET metrics réussi');
                console.log(`  📈 Total proposals: ${metricsResult.data.totalProposals || 0}`);
            } else {
                console.error('  ❌ GET metrics échoué:', metricsResult.error);
            }
            
            return true;
        } else {
            console.error('  ❌ POST proposal échoué:', postResult.error);
            return false;
        }
    } catch (error) {
        console.error('  ❌ Erreur Governance API:', error.message);
        return false;
    }
}

/**
 * Test de gestion d'erreurs et codes de statut
 */
async function testErrorHandling() {
    console.log('\n🚨 Test gestion d\'erreurs...');
    
    try {
        // Test endpoint inexistant
        console.log('  🔍 Test endpoint inexistant...');
        const notFoundResult = await makeRequest('GET', '/nonexistent');
        
        if (notFoundResult.status === 404) {
            console.log('  ✅ 404 correctement retourné pour endpoint inexistant');
        } else {
            console.log(`  ⚠️ Status inattendu: ${notFoundResult.status}`);
        }
        
        // Test méthode non autorisée
        console.log('  🚫 Test méthode non autorisée...');
        const methodResult = await makeRequest('DELETE', '/health');
        
        if (methodResult.status === 405 || methodResult.status === 404) {
            console.log('  ✅ Méthode non autorisée correctement gérée');
        } else {
            console.log(`  ⚠️ Status inattendu pour méthode: ${methodResult.status}`);
        }
        
        // Test données invalides
        console.log('  📝 Test données invalides...');
        const invalidResult = await makeRequest('POST', '/conversations', { invalid: 'data' });
        
        if (invalidResult.status >= 400 && invalidResult.status < 500) {
            console.log('  ✅ Données invalides correctement rejetées');
        } else {
            console.log(`  ⚠️ Status inattendu pour données invalides: ${invalidResult.status}`);
        }
        
        return true;
    } catch (error) {
        console.error('  ❌ Erreur test gestion d\'erreurs:', error.message);
        return false;
    }
}

/**
 * Fonction principale de test des APIs
 */
async function runAPITests() {
    console.log('🌐 Tests APIs Next.js avec Supabase');
    console.log('===================================\n');
    
    const results = {
        health: false,
        analytics: false,
        conversations: false,
        messages: false,
        governance: false,
        errorHandling: false
    };
    
    // Test Health API
    results.health = await testHealthAPI();
    
    // Test Analytics API
    results.analytics = await testAnalyticsAPI();
    
    // Test Conversations API
    results.conversations = await testConversationsAPI();
    
    // Test Messages API
    results.messages = await testMessagesAPI();
    
    // Test Governance API
    results.governance = await testGovernanceAPI();
    
    // Test gestion d'erreurs
    results.errorHandling = await testErrorHandling();
    
    // Rapport final
    console.log('\n📊 Rapport des Tests APIs');
    console.log('=========================');
    console.log(`🏥 Health: ${results.health ? '✅' : '❌'}`);
    console.log(`📊 Analytics: ${results.analytics ? '✅' : '❌'}`);
    console.log(`💬 Conversations: ${results.conversations ? '✅' : '❌'}`);
    console.log(`📨 Messages: ${results.messages ? '✅' : '❌'}`);
    console.log(`🏛️ Governance: ${results.governance ? '✅' : '❌'}`);
    console.log(`🚨 Error Handling: ${results.errorHandling ? '✅' : '❌'}`);
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Résultat: ${successCount}/${totalTests} tests réussis (${Math.round(successCount/totalTests*100)}%)`);
    
    if (successCount === totalTests) {
        console.log('🎉 Tous les tests APIs sont réussis !');
        return true;
    } else {
        console.log('⚠️ Certains tests ont échoué. Vérifiez que l\'application Next.js est démarrée.');
        return false;
    }
}

// Exécuter les tests si le script est appelé directement
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
    runAPITests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Erreur fatale:', error);
            process.exit(1);
        });
}

export { runAPITests };
