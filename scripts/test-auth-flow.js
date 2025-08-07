#!/usr/bin/env node

/**
 * Test du parcours d'authentification complet
 * Inscription → Connexion → Accès Dashboard
 */

import fetch from 'node-fetch';

class AuthFlowTester {
  constructor() {
    this.baseUrl = 'http://localhost:3002';
    this.testUser = {
      name: 'Test User',
      email: `test-${Date.now()}@voicecoop.com`,
      password: 'password123'
    };
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

  async testRegistration() {
    this.log('\n🔐 TEST INSCRIPTION', 'info');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.testUser),
      });

      const data = await response.json();
      
      if (response.ok) {
        this.log(`✅ Inscription réussie: ${data.user.email}`, 'success');
        return true;
      } else {
        this.log(`❌ Échec inscription: ${data.error}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ Erreur inscription: ${error.message}`, 'error');
      return false;
    }
  }

  async testLogin() {
    this.log('\n🔑 TEST CONNEXION', 'info');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.testUser.email,
          password: this.testUser.password,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        this.log(`✅ Connexion réussie: ${data.email}`, 'success');
        return true;
      } else {
        this.log(`❌ Échec connexion: ${data.error}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ Erreur connexion: ${error.message}`, 'error');
      return false;
    }
  }

  async testDashboardAccess() {
    this.log('\n📊 TEST ACCÈS DASHBOARD', 'info');
    
    try {
      const response = await fetch(`${this.baseUrl}/dashboard`);
      
      if (response.ok) {
        this.log('✅ Dashboard accessible', 'success');
        return true;
      } else {
        this.log(`❌ Dashboard inaccessible: ${response.status}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ Erreur accès dashboard: ${error.message}`, 'error');
      return false;
    }
  }

  async run() {
    this.log('🚀 DÉMARRAGE TEST PARCOURS AUTHENTIFICATION', 'info');
    this.log(`Email de test: ${this.testUser.email}`, 'info');
    
    let results = {
      registration: false,
      login: false,
      dashboard: false
    };

    // Test 1: Inscription
    results.registration = await this.testRegistration();
    
    // Test 2: Connexion (seulement si inscription réussie)
    if (results.registration) {
      results.login = await this.testLogin();
    }
    
    // Test 3: Accès dashboard
    results.dashboard = await this.testDashboardAccess();
    
    // Rapport final
    this.generateReport(results);
  }

  generateReport(results) {
    this.log('\n' + '='.repeat(50), 'info');
    this.log('📊 RAPPORT PARCOURS AUTHENTIFICATION', 'info');
    this.log('='.repeat(50), 'info');
    
    const tests = [
      { name: 'Inscription', result: results.registration },
      { name: 'Connexion', result: results.login },
      { name: 'Accès Dashboard', result: results.dashboard }
    ];
    
    let passed = 0;
    tests.forEach(test => {
      const status = test.result ? '✅' : '❌';
      const color = test.result ? 'success' : 'error';
      this.log(`${status} ${test.name}`, color);
      if (test.result) passed++;
    });
    
    const percentage = Math.round((passed / tests.length) * 100);
    this.log(`\n🎯 Résultat: ${passed}/${tests.length} (${percentage}%)`, 
      percentage >= 80 ? 'success' : percentage >= 60 ? 'warning' : 'error');
    
    if (percentage === 100) {
      this.log('🎉 PARCOURS AUTHENTIFICATION PARFAIT !', 'success');
    } else if (percentage >= 80) {
      this.log('✅ Parcours authentification fonctionnel', 'success');
    } else {
      this.log('⚠️  Corrections nécessaires', 'warning');
    }
    
    this.log('\n💡 Instructions pour test manuel:', 'info');
    this.log(`1. Aller sur: ${this.baseUrl}/auth/register`, 'info');
    this.log(`2. S'inscrire avec: ${this.testUser.email}`, 'info');
    this.log(`3. Se connecter avec le même email/mot de passe`, 'info');
    this.log(`4. Vérifier l'accès au dashboard`, 'info');
    
    this.log('='.repeat(50), 'info');
  }
}

// Exécution directe
const tester = new AuthFlowTester();
tester.run();
