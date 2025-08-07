#!/usr/bin/env node

/**
 * Tests End-to-End Complets - Parcours Utilisateur 360°
 * Valide tous les parcours critiques avant déploiement
 */

import fetch from 'node-fetch';
import { execSync } from 'child_process';

class E2ETestSuite {
  constructor() {
    this.baseUrl = 'http://localhost:3002';
    this.results = {
      navigation: [],
      apis: [],
      performance: [],
      security: [],
      userJourney: []
    };
    this.totalTests = 0;
    this.passedTests = 0;
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  async test(name, testFn) {
    this.totalTests++;
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.passedTests++;
      this.log(`✅ ${name} (${duration}ms)`, 'success');
      return { name, status: 'PASS', duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(`❌ ${name} (${duration}ms): ${error.message}`, 'error');
      return { name, status: 'FAIL', duration, error: error.message };
    }
  }

  async checkServerRunning() {
    try {
      const response = await fetch(this.baseUrl, { timeout: 5000 });
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      return true;
    } catch (error) {
      throw new Error(`Server not running on ${this.baseUrl}. Please start with 'npm run dev'`);
    }
  }

  // 🏠 Tests de Navigation
  async testNavigation() {
    this.log('\n🏠 TESTS DE NAVIGATION', 'info');
    
    const pages = [
      { path: '/', name: 'Page d\'accueil' },
      { path: '/auth/login', name: 'Page de connexion' },
      { path: '/auth/register', name: 'Page d\'inscription' },
      { path: '/design-system', name: 'Design System' },
      { path: '/nextgen-showcase', name: 'Showcase Next-Gen' },
      { path: '/dashboard', name: 'Dashboard (redirect)' },
      { path: '/dashboard/conversation', name: 'Conversations' },
      { path: '/dashboard/governance', name: 'Gouvernance' },
      { path: '/dashboard/monitoring', name: 'Monitoring' },
      { path: '/dashboard/profile', name: 'Profil' }
    ];

    for (const page of pages) {
      const result = await this.test(`Navigation ${page.name}`, async () => {
        const response = await fetch(`${this.baseUrl}${page.path}`, { timeout: 10000 });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const html = await response.text();
        if (!html.includes('<!DOCTYPE html>')) {
          throw new Error('Invalid HTML response');
        }
        
        // Vérifier que la page contient du contenu
        if (html.length < 1000) {
          throw new Error('Page content too short');
        }
      });
      
      this.results.navigation.push(result);
    }
  }

  // 🔌 Tests d'APIs
  async testAPIs() {
    this.log('\n🔌 TESTS D\'APIS', 'info');
    
    const apis = [
      { path: '/api/health', name: 'Health Check', method: 'GET' },
      { path: '/api/analytics/realtime', name: 'Analytics Realtime', method: 'GET' },
      { path: '/api/conversations', name: 'Conversations List', method: 'GET' }
    ];

    for (const api of apis) {
      const result = await this.test(`API ${api.name}`, async () => {
        const response = await fetch(`${this.baseUrl}${api.path}`, {
          method: api.method,
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok && response.status !== 401) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid content-type');
        }
        
        const data = await response.json();
        if (!data) {
          throw new Error('Empty response');
        }
      });
      
      this.results.apis.push(result);
    }
  }

  // ⚡ Tests de Performance
  async testPerformance() {
    this.log('\n⚡ TESTS DE PERFORMANCE', 'info');
    
    const performanceTests = [
      {
        name: 'Page d\'accueil < 3s',
        test: async () => {
          const start = Date.now();
          const response = await fetch(this.baseUrl, { timeout: 15000 });
          const duration = Date.now() - start;
          
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          if (duration > 3000) throw new Error(`Too slow: ${duration}ms`);
          
          return duration;
        }
      },
      {
        name: 'API Health < 1s',
        test: async () => {
          const start = Date.now();
          const response = await fetch(`${this.baseUrl}/api/health`, { timeout: 5000 });
          const duration = Date.now() - start;
          
          if (duration > 1000) throw new Error(`Too slow: ${duration}ms`);
          
          return duration;
        }
      },
      {
        name: 'Bundle size check',
        test: async () => {
          const response = await fetch(this.baseUrl);
          const html = await response.text();
          
          // Vérifier que les bundles sont optimisés
          const scriptTags = html.match(/<script[^>]*src="[^"]*"[^>]*>/g) || [];
          if (scriptTags.length > 10) {
            throw new Error(`Too many script tags: ${scriptTags.length}`);
          }
          
          return scriptTags.length;
        }
      }
    ];

    for (const perfTest of performanceTests) {
      const result = await this.test(perfTest.name, perfTest.test);
      this.results.performance.push(result);
    }
  }

  // 🔒 Tests de Sécurité
  async testSecurity() {
    this.log('\n🔒 TESTS DE SÉCURITÉ', 'info');
    
    const securityTests = [
      {
        name: 'Headers de sécurité présents',
        test: async () => {
          const response = await fetch(this.baseUrl);
          const headers = response.headers;
          
          const requiredHeaders = [
            'x-frame-options',
            'x-content-type-options',
            'referrer-policy'
          ];
          
          for (const header of requiredHeaders) {
            if (!headers.get(header)) {
              throw new Error(`Missing header: ${header}`);
            }
          }
        }
      },
      {
        name: 'Protection routes dashboard',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/dashboard/conversation`, {
            redirect: 'manual'
          });
          
          // Doit rediriger vers login ou retourner 401
          if (response.status !== 302 && response.status !== 401) {
            throw new Error(`Dashboard not protected: ${response.status}`);
          }
        }
      },
      {
        name: 'CORS configuré',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/health`);
          const corsHeader = response.headers.get('access-control-allow-origin');
          
          if (!corsHeader) {
            throw new Error('CORS not configured');
          }
        }
      }
    ];

    for (const secTest of securityTests) {
      const result = await this.test(secTest.name, secTest.test);
      this.results.security.push(result);
    }
  }

  // 👤 Tests de Parcours Utilisateur
  async testUserJourney() {
    this.log('\n👤 TESTS DE PARCOURS UTILISATEUR', 'info');
    
    const journeyTests = [
      {
        name: 'Parcours découverte',
        test: async () => {
          // 1. Page d'accueil
          let response = await fetch(this.baseUrl);
          if (!response.ok) throw new Error('Homepage failed');
          
          // 2. Design system
          response = await fetch(`${this.baseUrl}/design-system`);
          if (!response.ok) throw new Error('Design system failed');
          
          // 3. Showcase
          response = await fetch(`${this.baseUrl}/nextgen-showcase`);
          if (!response.ok) throw new Error('Showcase failed');
        }
      },
      {
        name: 'Parcours authentification',
        test: async () => {
          // 1. Page de login
          let response = await fetch(`${this.baseUrl}/auth/login`);
          if (!response.ok) throw new Error('Login page failed');
          
          // 2. Page de register
          response = await fetch(`${this.baseUrl}/auth/register`);
          if (!response.ok) throw new Error('Register page failed');
          
          // 3. Tentative d'accès dashboard (doit rediriger)
          response = await fetch(`${this.baseUrl}/dashboard`, { redirect: 'manual' });
          if (response.status !== 302 && response.status !== 401) {
            throw new Error('Dashboard access not protected');
          }
        }
      },
      {
        name: 'Parcours APIs',
        test: async () => {
          // 1. Health check
          let response = await fetch(`${this.baseUrl}/api/health`);
          if (!response.ok) throw new Error('Health API failed');
          
          // 2. Analytics (peut être protégé)
          response = await fetch(`${this.baseUrl}/api/analytics/realtime`);
          if (!response.ok && response.status !== 401) {
            throw new Error('Analytics API failed');
          }
          
          // 3. Conversations (peut être protégé)
          response = await fetch(`${this.baseUrl}/api/conversations`);
          if (!response.ok && response.status !== 401) {
            throw new Error('Conversations API failed');
          }
        }
      }
    ];

    for (const journeyTest of journeyTests) {
      const result = await this.test(journeyTest.name, journeyTest.test);
      this.results.userJourney.push(result);
    }
  }

  // 📊 Génération du rapport
  generateReport() {
    this.log('\n' + '='.repeat(60), 'info');
    this.log('📊 RAPPORT DE TESTS END-TO-END COMPLETS', 'info');
    this.log('='.repeat(60), 'info');
    
    const successRate = Math.round((this.passedTests / this.totalTests) * 100);
    
    this.log(`\n🎯 RÉSULTATS GLOBAUX:`, 'info');
    this.log(`Total: ${this.totalTests} tests`);
    this.log(`Réussis: ${this.passedTests}`, 'success');
    this.log(`Échoués: ${this.totalTests - this.passedTests}`, 'error');
    this.log(`Taux de réussite: ${successRate}%`, successRate >= 80 ? 'success' : 'warning');
    
    // Détail par catégorie
    const categories = [
      { name: 'Navigation', results: this.results.navigation },
      { name: 'APIs', results: this.results.apis },
      { name: 'Performance', results: this.results.performance },
      { name: 'Sécurité', results: this.results.security },
      { name: 'Parcours Utilisateur', results: this.results.userJourney }
    ];
    
    for (const category of categories) {
      const passed = category.results.filter(r => r.status === 'PASS').length;
      const total = category.results.length;
      const rate = total > 0 ? Math.round((passed / total) * 100) : 0;
      
      this.log(`\n📋 ${category.name}: ${passed}/${total} (${rate}%)`, 
        rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'error');
      
      // Afficher les échecs
      const failures = category.results.filter(r => r.status === 'FAIL');
      for (const failure of failures) {
        this.log(`  ❌ ${failure.name}: ${failure.error}`, 'error');
      }
    }
    
    // Recommandations
    this.log('\n💡 RECOMMANDATIONS:', 'info');
    if (successRate >= 90) {
      this.log('🎉 Excellent ! Application prête pour le déploiement.', 'success');
    } else if (successRate >= 80) {
      this.log('✅ Bon niveau. Quelques corrections mineures recommandées.', 'warning');
    } else if (successRate >= 60) {
      this.log('⚠️  Corrections nécessaires avant déploiement.', 'warning');
    } else {
      this.log('🚨 Corrections critiques requises.', 'error');
    }
    
    this.log('\n' + '='.repeat(60), 'info');
    
    return successRate;
  }

  // 🚀 Exécution complète
  async run() {
    this.log('🚀 DÉMARRAGE TESTS END-TO-END COMPLETS', 'info');
    this.log('Validation parcours utilisateur 360°\n', 'info');
    
    try {
      // Vérifier que le serveur tourne
      await this.checkServerRunning();
      this.log('✅ Serveur détecté et accessible\n', 'success');
      
      // Exécuter tous les tests
      await this.testNavigation();
      await this.testAPIs();
      await this.testPerformance();
      await this.testSecurity();
      await this.testUserJourney();
      
      // Générer le rapport
      const successRate = this.generateReport();
      
      // Code de sortie basé sur le taux de réussite
      process.exit(successRate >= 80 ? 0 : 1);
      
    } catch (error) {
      this.log(`\n🚨 ERREUR CRITIQUE: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Exécution directe
const testSuite = new E2ETestSuite();
testSuite.run();
