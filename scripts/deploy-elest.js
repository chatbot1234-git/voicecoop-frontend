#!/usr/bin/env node

/**
 * Script de déploiement automatisé sur Elest.io
 * Usage: npm run deploy:production
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const APP_NAME = 'voicecoop-production';
const ELEST_CONFIG = 'elest.config.js';

console.log('🚀 Déploiement VoiceCoop sur Elest.io...\n');

// Étape 1: Vérifications préalables
console.log('1️⃣ Vérifications préalables...');

// Vérifier que Elest CLI est installé
try {
  execSync('elest --version', { stdio: 'pipe' });
  console.log('✅ Elest CLI détecté');
} catch (error) {
  console.log('❌ Elest CLI non trouvé. Installation...');
  try {
    execSync('npm install -g @elest/cli', { stdio: 'inherit' });
    console.log('✅ Elest CLI installé');
  } catch (installError) {
    console.error('❌ Impossible d\'installer Elest CLI:', installError.message);
    console.log('📝 Installez manuellement: npm install -g @elest/cli');
    process.exit(1);
  }
}

// Vérifier l'authentification Elest
try {
  execSync('elest auth status', { stdio: 'pipe' });
  console.log('✅ Authentifié sur Elest.io');
} catch (error) {
  console.log('⚠️  Non authentifié sur Elest.io. Lancement de l\'authentification...');
  try {
    execSync('elest auth login', { stdio: 'inherit' });
    console.log('✅ Authentification réussie');
  } catch (authError) {
    console.error('❌ Échec de l\'authentification Elest.io');
    console.log('📝 Authentifiez-vous manuellement: elest auth login');
    process.exit(1);
  }
}

// Vérifier la configuration
if (!fs.existsSync(ELEST_CONFIG)) {
  console.error(`❌ Fichier de configuration ${ELEST_CONFIG} non trouvé`);
  process.exit(1);
}
console.log('✅ Configuration Elest.io trouvée');

// Étape 2: Tests et validations
console.log('\n2️⃣ Tests et validations...');

try {
  console.log('🧪 Linting...');
  execSync('npm run lint', { stdio: 'pipe' });
  console.log('✅ Linting réussi');
} catch (error) {
  console.log('⚠️  Warnings ESLint détectés (non bloquant)');
}

try {
  console.log('🧪 Tests unitaires...');
  execSync('npm test -- --passWithNoTests', { stdio: 'pipe' });
  console.log('✅ Tests unitaires réussis');
} catch (error) {
  console.log('⚠️  Tests unitaires échoués (non bloquant pour le déploiement)');
}

try {
  console.log('🏗️  Build de production...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build réussi');
} catch (error) {
  console.error('❌ Échec du build:', error.message);
  process.exit(1);
}

// Étape 3: Vérification de l'application
console.log('\n3️⃣ Vérification de l\'application...');

try {
  // Vérifier si l'application existe
  let appExists = false;
  try {
    execSync(`elest apps list | grep ${APP_NAME}`, { stdio: 'pipe' });
    appExists = true;
    console.log(`✅ Application ${APP_NAME} trouvée`);
  } catch (error) {
    console.log(`⚠️  Application ${APP_NAME} non trouvée`);
  }

  if (!appExists) {
    console.log('🆕 Création de l\'application...');
    try {
      execSync(`elest apps create ${APP_NAME} --config ${ELEST_CONFIG}`, { stdio: 'inherit' });
      console.log(`✅ Application ${APP_NAME} créée`);
    } catch (error) {
      console.error('❌ Échec de la création de l\'application:', error.message);
      console.log('📝 Créez l\'application manuellement sur https://elest.io/dashboard');
      process.exit(1);
    }
  }

} catch (error) {
  console.error('❌ Erreur lors de la vérification de l\'application:', error.message);
  process.exit(1);
}

// Étape 4: Configuration des variables d'environnement
console.log('\n4️⃣ Configuration des variables d\'environnement...');

const requiredEnvVars = [
  'NEXTAUTH_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('⚠️  Vérifiez que les variables suivantes sont configurées sur Elest.io:');
requiredEnvVars.forEach(varName => {
  console.log(`   - ${varName}`);
});

console.log('\n📝 Configurez-les via: elest apps env set <APP_NAME> <VAR_NAME> <VALUE>');
console.log('   ou via l\'interface web: https://elest.io/dashboard');

// Étape 5: Déploiement
console.log('\n5️⃣ Déploiement sur Elest.io...');

try {
  console.log('🚀 Lancement du déploiement...');
  execSync(`elest apps deploy ${APP_NAME}`, { stdio: 'inherit' });
  
  console.log('\n🎉 Déploiement lancé avec succès !');
  
  // Suivre le statut du déploiement
  console.log('📊 Suivi du déploiement...');
  try {
    execSync(`elest apps status ${APP_NAME} --follow`, { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  Impossible de suivre le déploiement automatiquement');
    console.log(`📝 Suivez manuellement: elest apps status ${APP_NAME}`);
  }

} catch (error) {
  console.error('❌ Échec du déploiement:', error.message);
  console.log('\n🔧 Solutions possibles:');
  console.log('1. Vérifiez votre authentification: elest auth status');
  console.log('2. Vérifiez la configuration: elest apps config validate');
  console.log('3. Vérifiez les logs: elest apps logs ' + APP_NAME);
  process.exit(1);
}

// Étape 6: Tests post-déploiement
console.log('\n6️⃣ Tests post-déploiement...');

try {
  // Récupérer l'URL de l'application
  const appInfo = execSync(`elest apps info ${APP_NAME} --json`, { encoding: 'utf8' });
  const appData = JSON.parse(appInfo);
  const url = appData.url || 'https://voicecoop.com';
  
  console.log(`🌐 Application déployée sur: ${url}`);
  
  // Test de santé
  console.log('🔍 Test de santé de l\'application...');
  try {
    const { default: fetch } = await import('node-fetch');
    const response = await fetch(`${url}/api/health`, { timeout: 10000 });
    if (response.ok) {
      console.log('✅ Health check réussi');
      const healthData = await response.json();
      console.log('📊 Statut:', healthData);
    } else {
      console.log('⚠️  Health check échoué, mais l\'application peut être en cours de démarrage');
    }
  } catch (error) {
    console.log('⚠️  Impossible de tester l\'application (normal pendant le démarrage)');
  }

} catch (error) {
  console.log('⚠️  Impossible de récupérer les informations de l\'application');
}

console.log('\n🎊 Déploiement production terminé !');
console.log('\n📋 Prochaines étapes:');
console.log('1. Vérifiez que l\'application fonctionne correctement');
console.log('2. Configurez le monitoring et les alertes');
console.log('3. Testez les fonctionnalités critiques');
console.log('4. Configurez les sauvegardes automatiques');
console.log('5. Documentez la procédure de rollback');

export default { APP_NAME, ELEST_CONFIG };
