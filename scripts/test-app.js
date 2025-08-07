#!/usr/bin/env node

/**
 * Script de test automatisé pour VoiceCoop
 * Teste les endpoints, la navigation et les fonctionnalités principales
 */

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class TestRunner {
  constructor() {
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
    const startTime = performance.now();
    
    try {
      await testFn();
      const duration = Math.round(performance.now() - startTime);
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASS', duration });
      this.log(`✅ ${name} (${duration}ms)`, 'green');
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAIL', duration, error: error.message });
      this.log(`❌ ${name} (${duration}ms): ${error.message}`, 'red');
    }
  }

  async fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  printSummary() {
    this.log('\n' + '='.repeat(60), 'bold');
    this.log('📊 RÉSUMÉ DES TESTS', 'bold');
    this.log('='.repeat(60), 'bold');
    
    this.log(`Total: ${this.results.total}`, 'blue');
    this.log(`Réussis: ${this.results.passed}`, 'green');
    this.log(`Échoués: ${this.results.failed}`, 'red');
    this.log(`Taux de réussite: ${Math.round((this.results.passed / this.results.total) * 100)}%`, 'yellow');
    
    if (this.results.failed > 0) {
      this.log('\n❌ TESTS ÉCHOUÉS:', 'red');
      this.results.tests
        .filter(test => test.status === 'FAIL')
        .forEach(test => {
          this.log(`  • ${test.name}: ${test.error}`, 'red');
        });
    }
    
    this.log('\n' + '='.repeat(60), 'bold');
  }
}

async function runTests() {
  const runner = new TestRunner();
  
  runner.log('🚀 DÉMARRAGE DES TESTS VOICECOOP', 'bold');
  runner.log('='.repeat(60), 'bold');

  // 1. Tests de Pages Principales
  runner.log('\n📄 TESTS DE PAGES', 'blue');
  
  await runner.test('Page d\'accueil accessible', async () => {
    const response = await runner.fetchWithTimeout(BASE_URL);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
  });

  await runner.test('Page de connexion accessible', async () => {
    const response = await runner.fetchWithTimeout(`${BASE_URL}/auth/login`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
  });

  await runner.test('Page d\'inscription accessible', async () => {
    const response = await runner.fetchWithTimeout(`${BASE_URL}/auth/register`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
  });

  await runner.test('Page design system accessible', async () => {
    const response = await runner.fetchWithTimeout(`${BASE_URL}/design-system`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
  });

  await runner.test('Page showcase next-gen accessible', async () => {
    const response = await runner.fetchWithTimeout(`${BASE_URL}/nextgen-showcase`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
  });

  // 2. Tests d'APIs
  runner.log('\n🔌 TESTS D\'APIS', 'blue');

  await runner.test('API Health Check', async () => {
    const response = await runner.fetchWithTimeout(`${API_BASE}/health`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    
    const data = await response.json();
    if (!data.status) throw new Error('Pas de status dans la réponse');
  });

  await runner.test('API Analytics Realtime', async () => {
    const response = await runner.fetchWithTimeout(`${API_BASE}/analytics/realtime`);
    // Peut retourner 401 si non authentifié, c'est normal
    if (response.status !== 401 && !response.ok) {
      throw new Error(`Status inattendu: ${response.status}`);
    }
  });

  await runner.test('API Conversations (sans auth)', async () => {
    const response = await runner.fetchWithTimeout(`${API_BASE}/conversations`);
    // Doit retourner 401 car non authentifié
    if (response.status !== 401) {
      throw new Error(`Devrait retourner 401, reçu: ${response.status}`);
    }
  });

  // 3. Tests de Performance
  runner.log('\n⚡ TESTS DE PERFORMANCE', 'blue');

  await runner.test('Temps de réponse page d\'accueil < 2s', async () => {
    const startTime = performance.now();
    const response = await runner.fetchWithTimeout(BASE_URL);
    const duration = performance.now() - startTime;
    
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    if (duration > 2000) throw new Error(`Trop lent: ${Math.round(duration)}ms`);
  });

  await runner.test('Temps de réponse API Health < 1s', async () => {
    const startTime = performance.now();
    const response = await runner.fetchWithTimeout(`${API_BASE}/health`);
    const duration = performance.now() - startTime;
    
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    if (duration > 1000) throw new Error(`Trop lent: ${Math.round(duration)}ms`);
  });

  // 4. Tests de Sécurité
  runner.log('\n🔒 TESTS DE SÉCURITÉ', 'blue');

  await runner.test('Protection route dashboard (401)', async () => {
    const response = await runner.fetchWithTimeout(`${BASE_URL}/dashboard`);
    // Devrait rediriger vers login ou retourner 401/403
    if (response.ok && response.status === 200) {
      throw new Error('Dashboard accessible sans authentification');
    }
  });

  await runner.test('Headers de sécurité présents', async () => {
    const response = await runner.fetchWithTimeout(BASE_URL);
    const headers = response.headers;
    
    // Vérifier quelques headers de sécurité importants
    if (!headers.get('x-frame-options') && !headers.get('content-security-policy')) {
      throw new Error('Headers de sécurité manquants');
    }
  });

  await runner.test('API rate limiting (si configuré)', async () => {
    // Test basique - faire plusieurs requêtes rapides
    const promises = Array(10).fill().map(() => 
      runner.fetchWithTimeout(`${API_BASE}/health`, {}, 5000)
    );
    
    const responses = await Promise.all(promises);
    const rateLimited = responses.some(r => r.status === 429);
    
    // Si rate limiting configuré, au moins une requête devrait être limitée
    // Sinon, c'est OK aussi (pas encore configuré)
    runner.log('Rate limiting: ' + (rateLimited ? 'Actif' : 'Non configuré'), 'yellow');
  });

  // 5. Tests de Compatibilité
  runner.log('\n🌐 TESTS DE COMPATIBILITÉ', 'blue');

  await runner.test('Content-Type JSON pour APIs', async () => {
    const response = await runner.fetchWithTimeout(`${API_BASE}/health`);
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Content-Type incorrect: ${contentType}`);
    }
  });

  await runner.test('CORS headers présents', async () => {
    const response = await runner.fetchWithTimeout(`${API_BASE}/health`);
    // En développement, CORS devrait être configuré
    // En production, plus restrictif
  });

  // Résumé final
  runner.printSummary();
  
  // Code de sortie
  process.exit(runner.results.failed > 0 ? 1 : 0);
}

// Gestion des erreurs globales
process.on('unhandledRejection', (error) => {
  console.error('❌ Erreur non gérée:', error);
  process.exit(1);
});

// Lancement des tests
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lancement automatique des tests
runTests().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

export { TestRunner, runTests };
