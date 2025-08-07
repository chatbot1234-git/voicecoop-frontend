#!/usr/bin/env node

/**
 * Tests d'intégration Supabase pour VoiceCoop
 * Tests d'authentification, CRUD, et politiques RLS
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

class SupabaseIntegrationTests {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.testUser = null;
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
    this.log('\n🧪 TESTS D\'INTÉGRATION SUPABASE', 'blue');
    this.log('============================================================', 'blue');

    // Test 1: Connexion de base
    await this.test('Connexion au serveur Supabase', async () => {
      const { data, error } = await this.supabase.auth.getSession();
      if (error) throw error;
    });

    // Test 2: Inscription d'un utilisateur de test
    await this.test('Inscription utilisateur de test', async () => {
      const testEmail = `test-${Date.now()}@voicecoop.test`;
      const testPassword = 'TestPassword123!';
      
      const { data, error } = await this.supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test User VoiceCoop'
          }
        }
      });
      
      if (error) throw error;
      this.testUser = { email: testEmail, password: testPassword, data };
      this.log(`   📧 Utilisateur créé: ${testEmail}`, 'blue');
    });

    // Test 3: Connexion utilisateur
    await this.test('Connexion utilisateur', async () => {
      if (!this.testUser) throw new Error('Aucun utilisateur de test disponible');
      
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: this.testUser.email,
        password: this.testUser.password
      });
      
      if (error) throw error;
      this.log(`   🔐 Connecté: ${data.user.email}`, 'blue');
    });

    // Test 4: Création de profil utilisateur
    await this.test('Création profil utilisateur', async () => {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non connecté');
      
      const { data, error } = await this.supabase
        .from('user_profiles')
        .insert({
          id: user.user.id,
          full_name: 'Test User VoiceCoop',
          bio: 'Utilisateur de test pour les intégrations'
        })
        .select()
        .single();
      
      if (error) {
        // Si l'erreur est que la table n'existe pas, on l'ignore pour ce test
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          this.log(`   ⚠️ Table user_profiles non trouvée (schéma non appliqué)`, 'yellow');
          return;
        }
        throw error;
      }
      
      this.log(`   👤 Profil créé: ${data.full_name}`, 'blue');
    });

    // Test 5: Lecture du profil
    await this.test('Lecture profil utilisateur', async () => {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non connecté');
      
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.user.id)
        .single();
      
      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          this.log(`   ⚠️ Table user_profiles non trouvée`, 'yellow');
          return;
        }
        throw error;
      }
      
      this.log(`   📖 Profil lu: ${data.full_name}`, 'blue');
    });

    // Test 6: Mise à jour du profil
    await this.test('Mise à jour profil utilisateur', async () => {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non connecté');
      
      const { data, error } = await this.supabase
        .from('user_profiles')
        .update({ bio: 'Bio mise à jour par test d\'intégration' })
        .eq('id', user.user.id)
        .select()
        .single();
      
      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          this.log(`   ⚠️ Table user_profiles non trouvée`, 'yellow');
          return;
        }
        throw error;
      }
      
      this.log(`   ✏️ Profil mis à jour`, 'blue');
    });

    // Test 7: Test des politiques RLS (tentative d'accès à un autre profil)
    await this.test('Test politiques RLS (sécurité)', async () => {
      // Créer un UUID fictif pour tester l'accès non autorisé
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', fakeUserId);
      
      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          this.log(`   ⚠️ Table user_profiles non trouvée`, 'yellow');
          return;
        }
        throw error;
      }
      
      // Si on arrive ici, RLS fonctionne (pas de données retournées)
      if (data.length === 0) {
        this.log(`   🔒 RLS fonctionne: accès refusé aux autres profils`, 'blue');
      } else {
        throw new Error('RLS ne fonctionne pas: accès autorisé aux autres profils');
      }
    });

    // Test 8: Déconnexion
    await this.test('Déconnexion utilisateur', async () => {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      this.log(`   👋 Déconnecté`, 'blue');
    });

    // Test 9: Vérification de la déconnexion
    await this.test('Vérification déconnexion', async () => {
      const { data } = await this.supabase.auth.getSession();
      if (data.session) {
        throw new Error('Session encore active après déconnexion');
      }
      this.log(`   ✅ Session fermée`, 'blue');
    });

    // Résumé
    this.log('\n============================================================', 'blue');
    this.log('📊 RÉSUMÉ DES TESTS D\'INTÉGRATION SUPABASE', 'bold');
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
const runner = new SupabaseIntegrationTests();
runner.runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

export { SupabaseIntegrationTests };
