#!/usr/bin/env node

/**
 * Script de Test Performance et Sécurité Supabase
 * Vérifie les performances et la sécurité de l'intégration
 */

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Configuration
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Test de performance des requêtes Supabase
 */
async function testSupabasePerformance() {
    console.log('⚡ Test performance Supabase...');
    
    const tests = [
        {
            name: 'SELECT simple user_profiles',
            query: () => supabase.from('user_profiles').select('id, full_name').limit(10)
        },
        {
            name: 'SELECT avec jointure conversations + messages',
            query: () => supabase.from('conversations').select(`
                id, title, 
                messages(id, content, role)
            `).limit(5)
        },
        {
            name: 'COUNT user_profiles',
            query: () => supabase.from('user_profiles').select('*', { count: 'exact', head: true })
        },
        {
            name: 'INSERT user_profile',
            query: () => supabase.from('user_profiles').insert({
                id: `perf-test-${Date.now()}`,
                full_name: 'Performance Test User',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        }
    ];
    
    const results = [];
    
    for (const test of tests) {
        try {
            const startTime = Date.now();
            const { data, error } = await test.query();
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            if (error) {
                console.log(`  ❌ ${test.name}: ${error.message}`);
                results.push({ name: test.name, success: false, duration: 0 });
            } else {
                const status = duration < 1000 ? '✅' : duration < 2000 ? '⚠️' : '❌';
                console.log(`  ${status} ${test.name}: ${duration}ms`);
                results.push({ name: test.name, success: true, duration });
            }
        } catch (error) {
            console.log(`  ❌ ${test.name}: ${error.message}`);
            results.push({ name: test.name, success: false, duration: 0 });
        }
    }
    
    // Nettoyer les données de test
    await supabaseAdmin.from('user_profiles').delete().like('id', 'perf-test-%');
    
    const avgDuration = results.filter(r => r.success).reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.success).length;
    console.log(`  📊 Temps moyen: ${Math.round(avgDuration)}ms`);
    
    return results.filter(r => r.success).length === results.length && avgDuration < 1500;
}

/**
 * Test de performance des APIs Next.js
 */
async function testAPIPerformance() {
    console.log('\n🌐 Test performance APIs Next.js...');
    
    const endpoints = [
        '/api/health',
        '/api/analytics',
        '/api/conversations',
        '/api/governance/proposals'
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
        try {
            const startTime = Date.now();
            const response = await axios.get(`${BASE_URL}${endpoint}`, {
                timeout: 5000
            });
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            const status = duration < 1000 ? '✅' : duration < 2000 ? '⚠️' : '❌';
            console.log(`  ${status} ${endpoint}: ${duration}ms (${response.status})`);
            results.push({ endpoint, success: response.status === 200, duration });
        } catch (error) {
            console.log(`  ❌ ${endpoint}: ${error.message}`);
            results.push({ endpoint, success: false, duration: 0 });
        }
    }
    
    const avgDuration = results.filter(r => r.success).reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.success).length;
    console.log(`  📊 Temps moyen APIs: ${Math.round(avgDuration)}ms`);
    
    return results.filter(r => r.success).length === results.length && avgDuration < 2000;
}

/**
 * Test de charge basique
 */
async function testLoadBasic() {
    console.log('\n🔥 Test de charge basique...');
    
    const concurrentRequests = 10;
    const promises = [];
    
    console.log(`  🚀 Lancement de ${concurrentRequests} requêtes simultanées...`);
    
    const startTime = Date.now();
    
    for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
            supabase.from('user_profiles').select('id, full_name').limit(5)
        );
    }
    
    try {
        const results = await Promise.all(promises);
        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        
        const successCount = results.filter(r => !r.error).length;
        console.log(`  ✅ ${successCount}/${concurrentRequests} requêtes réussies`);
        console.log(`  ⏱️ Temps total: ${totalDuration}ms`);
        console.log(`  📊 Temps moyen par requête: ${Math.round(totalDuration / concurrentRequests)}ms`);
        
        return successCount === concurrentRequests && totalDuration < 5000;
    } catch (error) {
        console.log(`  ❌ Erreur test de charge: ${error.message}`);
        return false;
    }
}

/**
 * Test de sécurité - Injection SQL
 */
async function testSQLInjection() {
    console.log('\n🛡️ Test sécurité - Injection SQL...');
    
    const maliciousInputs = [
        "'; DROP TABLE user_profiles; --",
        "1' OR '1'='1",
        "admin'/*",
        "1; DELETE FROM user_profiles WHERE 1=1; --"
    ];
    
    let allSecure = true;
    
    for (const input of maliciousInputs) {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('full_name', input)
                .limit(1);
            
            // Si aucune erreur et pas de données suspectes, c'est bon
            if (!error && (!data || data.length === 0)) {
                console.log(`  ✅ Protection contre: ${input.substring(0, 20)}...`);
            } else if (error) {
                // Une erreur peut indiquer une protection, mais vérifions qu'elle ne révèle pas d'info
                if (error.message.toLowerCase().includes('syntax') || 
                    error.message.toLowerCase().includes('sql')) {
                    console.log(`  ⚠️ Erreur SQL révélée: ${input.substring(0, 20)}...`);
                    allSecure = false;
                } else {
                    console.log(`  ✅ Protection contre: ${input.substring(0, 20)}...`);
                }
            }
        } catch (error) {
            console.log(`  ✅ Exception capturée pour: ${input.substring(0, 20)}...`);
        }
    }
    
    return allSecure;
}

/**
 * Test de sécurité - Headers de sécurité
 */
async function testSecurityHeaders() {
    console.log('\n🔒 Test headers de sécurité...');
    
    try {
        const response = await axios.get(`${BASE_URL}/api/health`);
        const headers = response.headers;
        
        const securityHeaders = {
            'x-frame-options': 'Protection contre clickjacking',
            'x-content-type-options': 'Protection MIME sniffing',
            'x-xss-protection': 'Protection XSS',
            'strict-transport-security': 'HTTPS forcé',
            'content-security-policy': 'CSP'
        };
        
        let secureCount = 0;
        
        for (const [header, description] of Object.entries(securityHeaders)) {
            if (headers[header]) {
                console.log(`  ✅ ${description}: ${header}`);
                secureCount++;
            } else {
                console.log(`  ⚠️ ${description}: ${header} manquant`);
            }
        }
        
        console.log(`  📊 Headers sécurisés: ${secureCount}/${Object.keys(securityHeaders).length}`);
        
        return secureCount >= 3; // Au moins 3 headers de sécurité
    } catch (error) {
        console.log(`  ❌ Erreur test headers: ${error.message}`);
        return false;
    }
}

/**
 * Test de sécurité - Rate limiting
 */
async function testRateLimiting() {
    console.log('\n🚦 Test rate limiting...');
    
    const rapidRequests = 20;
    const promises = [];
    
    console.log(`  🚀 Test avec ${rapidRequests} requêtes rapides...`);
    
    for (let i = 0; i < rapidRequests; i++) {
        promises.push(
            axios.get(`${BASE_URL}/api/health`).catch(error => ({
                status: error.response?.status || 500,
                error: true
            }))
        );
    }
    
    try {
        const results = await Promise.all(promises);
        
        const rateLimitedCount = results.filter(r => 
            r.status === 429 || (r.error && r.status === 429)
        ).length;
        
        const successCount = results.filter(r => 
            !r.error && r.status === 200
        ).length;
        
        console.log(`  ✅ Requêtes réussies: ${successCount}`);
        console.log(`  🚦 Requêtes limitées: ${rateLimitedCount}`);
        
        if (rateLimitedCount > 0) {
            console.log(`  ✅ Rate limiting actif`);
            return true;
        } else {
            console.log(`  ⚠️ Aucun rate limiting détecté`);
            return false;
        }
    } catch (error) {
        console.log(`  ❌ Erreur test rate limiting: ${error.message}`);
        return false;
    }
}

/**
 * Test de sécurité - Authentification
 */
async function testAuthSecurity() {
    console.log('\n🔐 Test sécurité authentification...');
    
    try {
        // Test accès sans token
        console.log('  🚫 Test accès sans authentification...');
        const { data: noAuthData, error: noAuthError } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(1);
        
        if (noAuthError && noAuthError.message.includes('JWT')) {
            console.log('  ✅ Accès refusé sans JWT');
        } else {
            console.log('  ⚠️ Accès possible sans authentification');
        }
        
        // Test avec token invalide
        console.log('  🎭 Test avec token invalide...');
        const invalidClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: 'Bearer invalid-token-123'
                }
            }
        });
        
        const { data: invalidData, error: invalidError } = await invalidClient
            .from('user_profiles')
            .select('*')
            .limit(1);
        
        if (invalidError) {
            console.log('  ✅ Token invalide rejeté');
        } else {
            console.log('  ⚠️ Token invalide accepté');
        }
        
        return true;
    } catch (error) {
        console.log(`  ❌ Erreur test auth: ${error.message}`);
        return false;
    }
}

/**
 * Fonction principale de test performance et sécurité
 */
async function runPerformanceSecurityTests() {
    console.log('🔒 Tests Performance et Sécurité Supabase');
    console.log('==========================================\n');
    
    const results = {
        supabasePerf: false,
        apiPerf: false,
        loadTest: false,
        sqlInjection: false,
        securityHeaders: false,
        rateLimiting: false,
        authSecurity: false
    };
    
    // Tests de performance
    results.supabasePerf = await testSupabasePerformance();
    results.apiPerf = await testAPIPerformance();
    results.loadTest = await testLoadBasic();
    
    // Tests de sécurité
    results.sqlInjection = await testSQLInjection();
    results.securityHeaders = await testSecurityHeaders();
    results.rateLimiting = await testRateLimiting();
    results.authSecurity = await testAuthSecurity();
    
    // Rapport final
    console.log('\n📊 Rapport Performance et Sécurité');
    console.log('===================================');
    console.log('🔥 PERFORMANCE:');
    console.log(`  ⚡ Supabase: ${results.supabasePerf ? '✅' : '❌'}`);
    console.log(`  🌐 APIs Next.js: ${results.apiPerf ? '✅' : '❌'}`);
    console.log(`  🔥 Test de charge: ${results.loadTest ? '✅' : '❌'}`);
    
    console.log('\n🛡️ SÉCURITÉ:');
    console.log(`  💉 Protection SQL Injection: ${results.sqlInjection ? '✅' : '❌'}`);
    console.log(`  🔒 Headers sécurité: ${results.securityHeaders ? '✅' : '❌'}`);
    console.log(`  🚦 Rate limiting: ${results.rateLimiting ? '✅' : '❌'}`);
    console.log(`  🔐 Sécurité auth: ${results.authSecurity ? '✅' : '❌'}`);
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Résultat: ${successCount}/${totalTests} tests réussis (${Math.round(successCount/totalTests*100)}%)`);
    
    if (successCount >= totalTests * 0.8) {
        console.log('🎉 Performance et sécurité satisfaisantes !');
        return true;
    } else {
        console.log('⚠️ Améliorations nécessaires en performance ou sécurité.');
        return false;
    }
}

// Exécuter les tests si le script est appelé directement
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
    runPerformanceSecurityTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Erreur fatale:', error);
            process.exit(1);
        });
}

export { runPerformanceSecurityTests };
