#!/usr/bin/env node

/**
 * Script pour exécuter tous les tests VoiceCoop
 * - Tests unitaires Jest
 * - Tests d'intégration de l'application
 * - Rapport de couverture
 */

import { spawn } from 'child_process';
import { performance } from 'perf_hooks';

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
      unitTests: null,
      integrationTests: null,
      totalTime: 0
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        ...options
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  async runUnitTests() {
    this.log('\n🧪 EXÉCUTION DES TESTS UNITAIRES', 'blue');
    this.log('============================================================', 'blue');
    
    const startTime = performance.now();
    
    try {
      await this.runCommand('npm', ['test', 'src/__tests__/basic.test.ts']);
      const duration = performance.now() - startTime;
      
      this.results.unitTests = {
        success: true,
        duration: Math.round(duration)
      };
      
      this.log(`✅ Tests unitaires réussis (${this.results.unitTests.duration}ms)`, 'green');
      return true;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.results.unitTests = {
        success: false,
        duration: Math.round(duration),
        error: error.message
      };
      
      this.log(`❌ Tests unitaires échoués (${this.results.unitTests.duration}ms)`, 'red');
      return false;
    }
  }

  async runIntegrationTests() {
    this.log('\n🔗 EXÉCUTION DES TESTS D\'INTÉGRATION', 'blue');
    this.log('============================================================', 'blue');
    
    const startTime = performance.now();
    
    try {
      await this.runCommand('npm', ['run', 'test:app']);
      const duration = performance.now() - startTime;
      
      this.results.integrationTests = {
        success: true,
        duration: Math.round(duration)
      };
      
      this.log(`✅ Tests d'intégration réussis (${this.results.integrationTests.duration}ms)`, 'green');
      return true;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.results.integrationTests = {
        success: false,
        duration: Math.round(duration),
        error: error.message
      };
      
      this.log(`❌ Tests d'intégration échoués (${this.results.integrationTests.duration}ms)`, 'red');
      return false;
    }
  }

  async runCoverageReport() {
    this.log('\n📊 GÉNÉRATION DU RAPPORT DE COUVERTURE', 'blue');
    this.log('============================================================', 'blue');
    
    try {
      await this.runCommand('npm', ['run', 'test:coverage', '--', '--testPathPattern=src/__tests__/basic.test.ts']);
      this.log('✅ Rapport de couverture généré', 'green');
      return true;
    } catch (error) {
      this.log('⚠️ Impossible de générer le rapport de couverture', 'yellow');
      return false;
    }
  }

  generateSummary() {
    this.log('\n============================================================', 'blue');
    this.log('📋 RÉSUMÉ DES TESTS VOICECOOP', 'bold');
    this.log('============================================================', 'blue');

    const totalTests = 2;
    let passedTests = 0;
    let failedTests = 0;

    // Tests unitaires
    if (this.results.unitTests) {
      if (this.results.unitTests.success) {
        this.log(`✅ Tests unitaires : RÉUSSIS (${this.results.unitTests.duration}ms)`, 'green');
        passedTests++;
      } else {
        this.log(`❌ Tests unitaires : ÉCHOUÉS (${this.results.unitTests.duration}ms)`, 'red');
        failedTests++;
      }
    }

    // Tests d'intégration
    if (this.results.integrationTests) {
      if (this.results.integrationTests.success) {
        this.log(`✅ Tests d'intégration : RÉUSSIS (${this.results.integrationTests.duration}ms)`, 'green');
        passedTests++;
      } else {
        this.log(`❌ Tests d'intégration : ÉCHOUÉS (${this.results.integrationTests.duration}ms)`, 'red');
        failedTests++;
      }
    }

    this.log('\n📊 STATISTIQUES GLOBALES', 'bold');
    this.log(`Total des suites de tests : ${totalTests}`);
    this.log(`Réussies : ${passedTests}`, passedTests > 0 ? 'green' : 'reset');
    this.log(`Échouées : ${failedTests}`, failedTests > 0 ? 'red' : 'reset');
    this.log(`Taux de réussite : ${Math.round((passedTests / totalTests) * 100)}%`);
    this.log(`Temps total : ${Math.round(this.results.totalTime)}ms`);

    if (failedTests > 0) {
      this.log('\n❌ ERREURS DÉTECTÉES :', 'red');
      if (this.results.unitTests && !this.results.unitTests.success) {
        this.log(`  • Tests unitaires : ${this.results.unitTests.error}`, 'red');
      }
      if (this.results.integrationTests && !this.results.integrationTests.success) {
        this.log(`  • Tests d'intégration : ${this.results.integrationTests.error}`, 'red');
      }
    }

    this.log('\n============================================================', 'blue');
    
    return failedTests === 0;
  }

  async runAllTests() {
    const startTime = performance.now();
    
    this.log('🚀 DÉMARRAGE DE LA SUITE DE TESTS COMPLÈTE VOICECOOP', 'blue');
    this.log('============================================================', 'blue');

    // Exécuter les tests unitaires
    const unitTestsSuccess = await this.runUnitTests();
    
    // Exécuter les tests d'intégration
    const integrationTestsSuccess = await this.runIntegrationTests();
    
    // Générer le rapport de couverture si les tests unitaires ont réussi
    if (unitTestsSuccess) {
      await this.runCoverageReport();
    }

    this.results.totalTime = performance.now() - startTime;
    
    // Générer le résumé
    const allTestsSuccess = this.generateSummary();
    
    return allTestsSuccess;
  }
}

// Exécution du script
const runner = new TestRunner();
runner.runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Erreur fatale lors de l\'exécution des tests:', error);
  process.exit(1);
});

export { TestRunner };
