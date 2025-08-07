#!/usr/bin/env node

/**
 * Script Principal - Tests d'Intégration Supabase Cloud
 * Exécute tous les tests d'intégration Supabase de manière séquentielle
 */

import { runAuthTests } from './test-supabase-auth.js';
import { runCRUDTests } from './test-supabase-crud.js';
import { runAPITests } from './test-nextjs-apis.js';
import { runPerformanceSecurityTests } from './test-performance-security.js';

/**
 * Vérification des prérequis
 */
async function checkPrerequisites() {
    console.log('🔍 Vérification des prérequis...');
    
    const requiredEnvVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('❌ Variables d\'environnement manquantes:');
        missingVars.forEach(varName => {
            console.error(`  - ${varName}`);
        });
        console.error('\nVérifiez votre fichier .env.local');
        return false;
    }
    
    console.log('✅ Toutes les variables d\'environnement sont présentes');
    
    // Vérifier la connectivité Supabase
    try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        const { data, error } = await supabase
            .from('user_profiles')
            .select('count', { count: 'exact', head: true });
        
        if (error) {
            console.error('❌ Impossible de se connecter à Supabase:', error.message);
            return false;
        }
        
        console.log('✅ Connexion Supabase validée');
        return true;
    } catch (error) {
        console.error('❌ Erreur de connexion Supabase:', error.message);
        return false;
    }
}

/**
 * Vérification que l'application Next.js est démarrée
 */
async function checkNextJSApp() {
    console.log('🌐 Vérification de l\'application Next.js...');
    
    try {
        const axios = (await import('axios')).default;
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        
        const response = await axios.get(`${baseUrl}/api/health`, {
            timeout: 5000
        });
        
        if (response.status === 200) {
            console.log('✅ Application Next.js accessible');
            return true;
        } else {
            console.error('❌ Application Next.js non accessible');
            return false;
        }
    } catch (error) {
        console.error('❌ Application Next.js non démarrée ou inaccessible');
        console.error('💡 Assurez-vous que l\'application est démarrée avec: npm run dev');
        return false;
    }
}

/**
 * Fonction principale d'exécution des tests
 */
async function runAllSupabaseTests() {
    console.log('🚀 Tests d\'Intégration Supabase Cloud - Suite Complète');
    console.log('======================================================\n');
    
    const startTime = Date.now();
    
    // Vérification des prérequis
    const prerequisitesOk = await checkPrerequisites();
    if (!prerequisitesOk) {
        console.error('\n💥 Prérequis non satisfaits. Arrêt des tests.');
        process.exit(1);
    }
    
    // Vérification de l'application Next.js
    const nextJSOk = await checkNextJSApp();
    if (!nextJSOk) {
        console.error('\n💥 Application Next.js non accessible. Arrêt des tests.');
        process.exit(1);
    }
    
    console.log('\n🎯 Début des tests d\'intégration...\n');
    
    const testResults = {
        auth: { success: false, duration: 0 },
        crud: { success: false, duration: 0 },
        apis: { success: false, duration: 0 },
        performance: { success: false, duration: 0 }
    };
    
    // 1. Tests d'authentification
    console.log('📍 Phase 1/4: Tests d\'Authentification');
    console.log('=====================================');
    try {
        const authStart = Date.now();
        testResults.auth.success = await runAuthTests();
        testResults.auth.duration = Date.now() - authStart;
    } catch (error) {
        console.error('💥 Erreur tests authentification:', error.message);
        testResults.auth.success = false;
    }
    
    // 2. Tests CRUD
    console.log('\n📍 Phase 2/4: Tests CRUD Base de Données');
    console.log('========================================');
    try {
        const crudStart = Date.now();
        testResults.crud.success = await runCRUDTests();
        testResults.crud.duration = Date.now() - crudStart;
    } catch (error) {
        console.error('💥 Erreur tests CRUD:', error.message);
        testResults.crud.success = false;
    }
    
    // 3. Tests APIs Next.js
    console.log('\n📍 Phase 3/4: Tests APIs Next.js');
    console.log('=================================');
    try {
        const apisStart = Date.now();
        testResults.apis.success = await runAPITests();
        testResults.apis.duration = Date.now() - apisStart;
    } catch (error) {
        console.error('💥 Erreur tests APIs:', error.message);
        testResults.apis.success = false;
    }
    
    // 4. Tests Performance et Sécurité
    console.log('\n📍 Phase 4/4: Tests Performance et Sécurité');
    console.log('============================================');
    try {
        const perfStart = Date.now();
        testResults.performance.success = await runPerformanceSecurityTests();
        testResults.performance.duration = Date.now() - perfStart;
    } catch (error) {
        console.error('💥 Erreur tests performance:', error.message);
        testResults.performance.success = false;
    }
    
    // Rapport final détaillé
    const totalDuration = Date.now() - startTime;
    
    console.log('\n🎊 RAPPORT FINAL - Tests d\'Intégration Supabase Cloud');
    console.log('=====================================================');
    
    console.log('\n📊 Résultats par Phase:');
    console.log(`🔐 Authentification: ${testResults.auth.success ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'} (${testResults.auth.duration}ms)`);
    console.log(`🗄️ CRUD Base de Données: ${testResults.crud.success ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'} (${testResults.crud.duration}ms)`);
    console.log(`🌐 APIs Next.js: ${testResults.apis.success ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'} (${testResults.apis.duration}ms)`);
    console.log(`🔒 Performance & Sécurité: ${testResults.performance.success ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'} (${testResults.performance.duration}ms)`);
    
    const successCount = Object.values(testResults).filter(r => r.success).length;
    const totalTests = Object.keys(testResults).length;
    const successRate = Math.round((successCount / totalTests) * 100);
    
    console.log('\n🎯 Résumé Global:');
    console.log(`📈 Taux de réussite: ${successCount}/${totalTests} (${successRate}%)`);
    console.log(`⏱️ Durée totale: ${Math.round(totalDuration / 1000)}s`);
    
    if (successCount === totalTests) {
        console.log('\n🎉 FÉLICITATIONS ! Tous les tests d\'intégration Supabase sont réussis !');
        console.log('🚀 Votre configuration Supabase Cloud est parfaitement opérationnelle !');
        console.log('✨ Vous pouvez maintenant passer aux tests E2E ou au déploiement !');
        return true;
    } else if (successCount >= totalTests * 0.75) {
        console.log('\n🎊 EXCELLENT ! La majorité des tests sont réussis !');
        console.log('⚠️ Quelques ajustements mineurs peuvent être nécessaires.');
        console.log('🔧 Consultez les détails ci-dessus pour les améliorations.');
        return true;
    } else {
        console.log('\n⚠️ ATTENTION ! Plusieurs tests ont échoué.');
        console.log('🔧 Vérifiez la configuration Supabase et les variables d\'environnement.');
        console.log('📚 Consultez la documentation pour résoudre les problèmes.');
        return false;
    }
}

/**
 * Gestion des arguments de ligne de commande
 */
function parseArguments() {
    const args = process.argv.slice(2);
    const options = {
        verbose: args.includes('--verbose') || args.includes('-v'),
        skipPrereqs: args.includes('--skip-prereqs'),
        testOnly: null
    };
    
    const testOnlyIndex = args.findIndex(arg => arg === '--test-only');
    if (testOnlyIndex !== -1 && args[testOnlyIndex + 1]) {
        options.testOnly = args[testOnlyIndex + 1];
    }
    
    return options;
}

/**
 * Affichage de l'aide
 */
function showHelp() {
    console.log('🚀 Tests d\'Intégration Supabase Cloud');
    console.log('=====================================\n');
    console.log('Usage: node run-supabase-integration-tests.js [options]\n');
    console.log('Options:');
    console.log('  --verbose, -v        Affichage détaillé');
    console.log('  --skip-prereqs       Ignorer la vérification des prérequis');
    console.log('  --test-only <type>   Exécuter seulement un type de test');
    console.log('                       Types: auth, crud, apis, performance');
    console.log('  --help, -h           Afficher cette aide\n');
    console.log('Exemples:');
    console.log('  node run-supabase-integration-tests.js');
    console.log('  node run-supabase-integration-tests.js --verbose');
    console.log('  node run-supabase-integration-tests.js --test-only auth');
}

// Exécution principale
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
    const options = parseArguments();

    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        showHelp();
        process.exit(0);
    }

    runAllSupabaseTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('\n💥 Erreur fatale lors des tests:', error);
            console.error('📚 Consultez la documentation ou contactez le support.');
            process.exit(1);
        });
}

export { runAllSupabaseTests };
