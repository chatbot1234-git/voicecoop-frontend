#!/usr/bin/env node

/**
 * Script de test de connexion Supabase
 * Vérifie la configuration et teste les fonctionnalités de base
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class SupabaseTestRunner {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      tests: []
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async test(name, testFn) {
    this.results.total++;
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.log(`✅ ${name} (${duration}ms)`, 'green');
      this.results.passed++;
      this.results.tests.push({ name, status: 'passed', duration });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(`❌ ${name} (${duration}ms): ${error.message}`, 'red');
      this.results.failed++;
      this.results.tests.push({ name, status: 'failed', duration, error: error.message });
    }
  }

  async runTests() {
    this.log('\n🚀 TESTS DE CONNEXION SUPABASE', 'blue');
    this.log('============================================================', 'blue');

    // Test 1: Configuration des variables d'environnement
    await this.test('Configuration des variables d\'environnement', async () => {
      if (!this.supabaseUrl || this.supabaseUrl.includes('VOTRE-PROJECT-ID')) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL non configurée');
      }
      if (!this.supabaseKey || this.supabaseKey.includes('VOTRE-ANON-KEY')) {
        throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY non configurée');
      }
    });

    // Si la configuration est manquante, proposer une solution
    if (this.results.failed > 0) {
      this.log('\n⚠️  Configuration Supabase manquante', 'yellow');
      this.log('Options disponibles:', 'yellow');
      this.log('1. Configurer un projet Supabase Cloud', 'yellow');
      this.log('2. Utiliser Supabase Local (recommandé pour dev)', 'yellow');
      this.log('\nPour Supabase Local:', 'yellow');
      this.log('npm run supabase:setup', 'yellow');
      return;
    }

    // Créer le client Supabase
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    // Test 2: Connexion de base
    await this.test('Connexion au serveur Supabase', async () => {
      const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
      if (error && !error.message.includes('relation "public.user_profiles" does not exist')) {
        throw error;
      }
    });

    // Test 3: Authentification (test de création d'utilisateur temporaire)
    await this.test('Service d\'authentification', async () => {
      // Test simple de l'API auth sans créer d'utilisateur
      const { data, error } = await supabase.auth.getSession();
      // Pas d'erreur attendue, même si pas de session
    });

    // Test 4: Vérification du schéma (si les tables existent)
    await this.test('Vérification du schéma de base', async () => {
      const tables = ['user_profiles', 'conversations', 'messages', 'proposals', 'votes'];
      let existingTables = 0;
      
      for (const table of tables) {
        try {
          const { error } = await supabase.from(table).select('count').limit(1);
          if (!error) existingTables++;
        } catch (e) {
          // Table n'existe pas, c'est OK
        }
      }
      
      if (existingTables === 0) {
        throw new Error('Aucune table trouvée - schéma non initialisé');
      }
      
      this.log(`   📊 ${existingTables}/${tables.length} tables trouvées`, 'blue');
    });

    // Résumé
    this.log('\n============================================================', 'blue');
    this.log('📊 RÉSUMÉ DES TESTS SUPABASE', 'bold');
    this.log('============================================================', 'blue');
    this.log(`Total: ${this.results.total}`);
    this.log(`Réussis: ${this.results.passed}`, 'green');
    this.log(`Échoués: ${this.results.failed}`, this.results.failed > 0 ? 'red' : 'green');
    this.log(`Taux de réussite: ${Math.round((this.results.passed / this.results.total) * 100)}%`);

    if (this.results.failed > 0) {
      this.log('\n❌ TESTS ÉCHOUÉS:', 'red');
      this.results.tests
        .filter(test => test.status === 'failed')
        .forEach(test => {
          this.log(`  • ${test.name}: ${test.error}`, 'red');
        });
    }

    this.log('\n============================================================', 'blue');
    
    return this.results.failed === 0;
  }
}

// Lancement automatique des tests
const runner = new SupabaseTestRunner();
runner.runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

export { SupabaseTestRunner };
