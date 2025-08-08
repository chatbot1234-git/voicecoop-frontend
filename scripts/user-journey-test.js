#!/usr/bin/env node

/**
 * 🧪 USER JOURNEY TEST 360° - VoiceCoop
 * 
 * Test complet du parcours utilisateur :
 * - Navigation homepage
 * - Inscription/Connexion
 * - Dashboard access
 * - Fonctionnalités principales
 * - Responsive design
 */

import { chromium } from 'playwright';

class UserJourneyTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = process.env.TEST_URL || 'https://voicecoop.netlify.app';
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  /**
   * Lance tous les tests
   */
  async runAllTests() {
    console.log('🧪 DÉMARRAGE DES TESTS PARCOURS UTILISATEUR 360°\n');
    console.log(`🌐 URL de test: ${this.baseUrl}\n`);
    
    try {
      await this.setupBrowser();
      
      // Tests par ordre de priorité
      await this.testHomepageLoad();
      await this.testHomepageButtons();
      await this.testResponsiveDesign();
      await this.testRegistrationFlow();
      await this.testLoginFlow();
      await this.testDashboardAccess();
      await this.testSecurityHeaders();
      await this.testPerformance();
      
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Erreur lors des tests:', error);
      this.results.failed.push(`Erreur critique: ${error.message}`);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Configuration du navigateur
   */
  async setupBrowser() {
    console.log('🚀 Configuration du navigateur...');
    
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Configuration des timeouts
    this.page.setDefaultTimeout(30000);
    this.page.setDefaultNavigationTimeout(30000);
    
    // Écouter les erreurs console
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.results.warnings.push(`Console Error: ${msg.text()}`);
      }
    });
    
    // Écouter les erreurs de réseau
    this.page.on('response', response => {
      if (response.status() >= 400) {
        this.results.warnings.push(`HTTP ${response.status()}: ${response.url()}`);
      }
    });
  }

  /**
   * Test de chargement de la homepage
   */
  async testHomepageLoad() {
    console.log('🏠 Test de chargement de la homepage...');
    
    try {
      const startTime = Date.now();
      await this.page.goto(this.baseUrl);
      const loadTime = Date.now() - startTime;
      
      // Vérifier le titre
      const title = await this.page.title();
      if (title.includes('VoiceCoop') || title.includes('Create Next App')) {
        this.results.passed.push('✅ Homepage chargée avec titre correct');
      } else {
        this.results.failed.push(`❌ Titre incorrect: ${title}`);
      }
      
      // Vérifier le temps de chargement
      if (loadTime < 5000) {
        this.results.passed.push(`✅ Temps de chargement acceptable: ${loadTime}ms`);
      } else {
        this.results.warnings.push(`⚠️ Temps de chargement lent: ${loadTime}ms`);
      }
      
      // Vérifier la présence d'éléments clés
      const heroTitle = await this.page.locator('h1').first().isVisible();
      if (heroTitle) {
        this.results.passed.push('✅ Titre principal visible');
      } else {
        this.results.failed.push('❌ Titre principal manquant');
      }
      
    } catch (error) {
      this.results.failed.push(`❌ Erreur chargement homepage: ${error.message}`);
    }
  }

  /**
   * Test des boutons de la homepage
   */
  async testHomepageButtons() {
    console.log('🔘 Test des boutons de la homepage...');
    
    try {
      // Test bouton "Commencer" dans le header
      const headerButton = this.page.locator('header').locator('text=Commencer').first();
      if (await headerButton.isVisible()) {
        this.results.passed.push('✅ Bouton "Commencer" header visible');
        
        // Vérifier le lien
        const href = await headerButton.getAttribute('href');
        if (href && href.includes('/auth/register')) {
          this.results.passed.push('✅ Bouton "Commencer" header bien configuré');
        } else {
          this.results.failed.push('❌ Bouton "Commencer" header mal configuré');
        }
      } else {
        this.results.failed.push('❌ Bouton "Commencer" header manquant');
      }
      
      // Test bouton "Connexion"
      const loginButton = this.page.locator('text=Connexion').first();
      if (await loginButton.isVisible()) {
        this.results.passed.push('✅ Bouton "Connexion" visible');
      } else {
        this.results.failed.push('❌ Bouton "Connexion" manquant');
      }
      
      // Test bouton "Voir la démo"
      const demoButton = this.page.locator('text=Voir la démo').first();
      if (await demoButton.isVisible()) {
        this.results.passed.push('✅ Bouton "Voir la démo" visible');
      } else {
        this.results.failed.push('❌ Bouton "Voir la démo" manquant');
      }
      
    } catch (error) {
      this.results.failed.push(`❌ Erreur test boutons: ${error.message}`);
    }
  }

  /**
   * Test du design responsive
   */
  async testResponsiveDesign() {
    console.log('📱 Test du design responsive...');
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      try {
        await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
        await this.page.waitForTimeout(1000);
        
        // Vérifier que le contenu est visible
        const heroVisible = await this.page.locator('h1').first().isVisible();
        if (heroVisible) {
          this.results.passed.push(`✅ ${viewport.name} (${viewport.width}px): Contenu visible`);
        } else {
          this.results.failed.push(`❌ ${viewport.name}: Contenu non visible`);
        }
        
        // Vérifier l'absence de scroll horizontal
        const bodyWidth = await this.page.evaluate(() => document.body.scrollWidth);
        if (bodyWidth <= viewport.width + 20) { // Marge de 20px
          this.results.passed.push(`✅ ${viewport.name}: Pas de scroll horizontal`);
        } else {
          this.results.warnings.push(`⚠️ ${viewport.name}: Scroll horizontal détecté`);
        }
        
      } catch (error) {
        this.results.failed.push(`❌ Erreur responsive ${viewport.name}: ${error.message}`);
      }
    }
    
    // Remettre en desktop
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  /**
   * Test du flow d'inscription
   */
  async testRegistrationFlow() {
    console.log('📝 Test du flow d\'inscription...');
    
    try {
      // Naviguer vers la page d'inscription
      await this.page.goto(`${this.baseUrl}/auth/register`);
      
      // Vérifier que la page se charge
      const pageTitle = await this.page.locator('h1, h2').first().textContent();
      if (pageTitle && (pageTitle.includes('Inscription') || pageTitle.includes('Register') || pageTitle.includes('Créer'))) {
        this.results.passed.push('✅ Page d\'inscription accessible');
      } else {
        this.results.failed.push('❌ Page d\'inscription non accessible ou mal configurée');
        return;
      }
      
      // Vérifier la présence du formulaire
      const emailField = this.page.locator('input[type="email"], input[name="email"]').first();
      const passwordField = this.page.locator('input[type="password"], input[name="password"]').first();
      const submitButton = this.page.locator('button[type="submit"], button:has-text("Inscription"), button:has-text("S\'inscrire")').first();
      
      if (await emailField.isVisible()) {
        this.results.passed.push('✅ Champ email présent');
      } else {
        this.results.failed.push('❌ Champ email manquant');
      }
      
      if (await passwordField.isVisible()) {
        this.results.passed.push('✅ Champ mot de passe présent');
      } else {
        this.results.failed.push('❌ Champ mot de passe manquant');
      }
      
      if (await submitButton.isVisible()) {
        this.results.passed.push('✅ Bouton de soumission présent');
      } else {
        this.results.failed.push('❌ Bouton de soumission manquant');
      }
      
    } catch (error) {
      this.results.failed.push(`❌ Erreur test inscription: ${error.message}`);
    }
  }

  /**
   * Test du flow de connexion
   */
  async testLoginFlow() {
    console.log('🔐 Test du flow de connexion...');
    
    try {
      await this.page.goto(`${this.baseUrl}/auth/login`);
      
      // Vérifier que la page se charge
      const pageTitle = await this.page.locator('h1, h2').first().textContent();
      if (pageTitle && (pageTitle.includes('Connexion') || pageTitle.includes('Login') || pageTitle.includes('Se connecter'))) {
        this.results.passed.push('✅ Page de connexion accessible');
      } else {
        this.results.failed.push('❌ Page de connexion non accessible');
      }
      
    } catch (error) {
      this.results.failed.push(`❌ Erreur test connexion: ${error.message}`);
    }
  }

  /**
   * Test d'accès au dashboard
   */
  async testDashboardAccess() {
    console.log('📊 Test d\'accès au dashboard...');
    
    try {
      await this.page.goto(`${this.baseUrl}/dashboard`);
      
      // Le dashboard devrait rediriger vers login si non connecté
      await this.page.waitForTimeout(2000);
      const currentUrl = this.page.url();
      
      if (currentUrl.includes('/auth/login') || currentUrl.includes('/auth/')) {
        this.results.passed.push('✅ Dashboard protégé - redirection vers login');
      } else if (currentUrl.includes('/dashboard')) {
        this.results.warnings.push('⚠️ Dashboard accessible sans authentification');
      } else {
        this.results.failed.push('❌ Comportement inattendu pour l\'accès dashboard');
      }
      
    } catch (error) {
      this.results.failed.push(`❌ Erreur test dashboard: ${error.message}`);
    }
  }

  /**
   * Test des headers de sécurité
   */
  async testSecurityHeaders() {
    console.log('🛡️ Test des headers de sécurité...');
    
    try {
      const response = await this.page.goto(this.baseUrl);
      const headers = response.headers();
      
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        'referrer-policy'
      ];
      
      for (const header of securityHeaders) {
        if (headers[header]) {
          this.results.passed.push(`✅ Header de sécurité présent: ${header}`);
        } else {
          this.results.warnings.push(`⚠️ Header de sécurité manquant: ${header}`);
        }
      }
      
    } catch (error) {
      this.results.failed.push(`❌ Erreur test headers: ${error.message}`);
    }
  }

  /**
   * Test de performance
   */
  async testPerformance() {
    console.log('⚡ Test de performance...');
    
    try {
      const startTime = Date.now();
      await this.page.goto(this.baseUrl);
      await this.page.waitForLoadState('networkidle');
      const totalTime = Date.now() - startTime;
      
      if (totalTime < 3000) {
        this.results.passed.push(`✅ Performance excellente: ${totalTime}ms`);
      } else if (totalTime < 5000) {
        this.results.warnings.push(`⚠️ Performance acceptable: ${totalTime}ms`);
      } else {
        this.results.failed.push(`❌ Performance lente: ${totalTime}ms`);
      }
      
    } catch (error) {
      this.results.failed.push(`❌ Erreur test performance: ${error.message}`);
    }
  }

  /**
   * Génère le rapport final
   */
  async generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPPORT DE TEST PARCOURS UTILISATEUR 360°');
    console.log('='.repeat(60));
    
    console.log(`\n✅ TESTS RÉUSSIS (${this.results.passed.length}):`);
    this.results.passed.forEach(test => console.log(test));
    
    console.log(`\n❌ TESTS ÉCHOUÉS (${this.results.failed.length}):`);
    this.results.failed.forEach(test => console.log(test));
    
    console.log(`\n⚠️ AVERTISSEMENTS (${this.results.warnings.length}):`);
    this.results.warnings.forEach(warning => console.log(warning));
    
    // Score global
    const totalTests = this.results.passed.length + this.results.failed.length;
    const successRate = totalTests > 0 ? Math.round((this.results.passed.length / totalTests) * 100) : 0;
    
    console.log(`\n🎯 TAUX DE RÉUSSITE: ${successRate}%`);
    
    if (this.results.failed.length === 0) {
      console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !');
      process.exit(0);
    } else {
      console.log('\n❌ CERTAINS TESTS ONT ÉCHOUÉ');
      process.exit(1);
    }
  }

  /**
   * Nettoyage
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Exécution des tests
const tester = new UserJourneyTester();
tester.runAllTests().catch(console.error);

export default UserJourneyTester;
