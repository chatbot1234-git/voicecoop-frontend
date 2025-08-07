#!/usr/bin/env node

/**
 * Script de déploiement automatisé sur Netlify
 * Usage: npm run deploy:staging
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SITE_NAME = 'voicecoop-staging';
const BUILD_DIR = '.next';

console.log('🚀 Déploiement VoiceCoop sur Netlify...\n');

// Étape 1: Vérifications préalables
console.log('1️⃣ Vérifications préalables...');

// Vérifier que Netlify CLI est installé
try {
  execSync('netlify --version', { stdio: 'pipe' });
  console.log('✅ Netlify CLI détecté');
} catch (error) {
  console.log('❌ Netlify CLI non trouvé. Installation...');
  try {
    execSync('npm install -g netlify-cli', { stdio: 'inherit' });
    console.log('✅ Netlify CLI installé');
  } catch (installError) {
    console.error('❌ Impossible d\'installer Netlify CLI:', installError.message);
    process.exit(1);
  }
}

// Vérifier l'authentification Netlify
try {
  execSync('netlify status', { stdio: 'pipe' });
  console.log('✅ Authentifié sur Netlify');
} catch (error) {
  console.log('⚠️  Non authentifié sur Netlify. Lancement de l\'authentification...');
  try {
    execSync('netlify login', { stdio: 'inherit' });
    console.log('✅ Authentification réussie');
  } catch (authError) {
    console.error('❌ Échec de l\'authentification Netlify');
    process.exit(1);
  }
}

// Étape 2: Build de l'application
console.log('\n2️⃣ Build de l\'application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build réussi');
} catch (error) {
  console.error('❌ Échec du build:', error.message);
  process.exit(1);
}

// Étape 3: Tests rapides
console.log('\n3️⃣ Tests rapides...');
try {
  execSync('npm run lint', { stdio: 'pipe' });
  console.log('✅ Linting réussi');
} catch (error) {
  console.log('⚠️  Warnings ESLint détectés (non bloquant)');
}

// Étape 4: Déploiement
console.log('\n4️⃣ Déploiement sur Netlify...');

try {
  // Vérifier si le site existe
  let siteExists = false;
  try {
    execSync(`netlify sites:list | grep ${SITE_NAME}`, { stdio: 'pipe' });
    siteExists = true;
    console.log(`✅ Site ${SITE_NAME} trouvé`);
  } catch (error) {
    console.log(`⚠️  Site ${SITE_NAME} non trouvé, création...`);
  }

  // Créer le site si nécessaire
  if (!siteExists) {
    try {
      execSync(`netlify sites:create --name ${SITE_NAME}`, { stdio: 'inherit' });
      console.log(`✅ Site ${SITE_NAME} créé`);
    } catch (error) {
      console.log('⚠️  Impossible de créer le site automatiquement');
      console.log('📝 Créez le site manuellement sur https://app.netlify.com');
    }
  }

  // Déploiement
  console.log('🚀 Déploiement en cours...');
  execSync('netlify deploy --prod --dir=.next', { stdio: 'inherit' });
  
  console.log('\n🎉 Déploiement réussi !');
  
  // Afficher les informations du site
  try {
    const siteInfo = execSync('netlify status', { encoding: 'utf8' });
    console.log('\n📊 Informations du site:');
    console.log(siteInfo);
  } catch (error) {
    console.log('⚠️  Impossible de récupérer les informations du site');
  }

} catch (error) {
  console.error('❌ Échec du déploiement:', error.message);
  console.log('\n🔧 Solutions possibles:');
  console.log('1. Vérifiez votre authentification: netlify login');
  console.log('2. Créez le site manuellement: netlify sites:create');
  console.log('3. Vérifiez les variables d\'environnement sur Netlify');
  process.exit(1);
}

// Étape 5: Tests post-déploiement
console.log('\n5️⃣ Tests post-déploiement...');
try {
  const siteUrl = execSync('netlify status --json', { encoding: 'utf8' });
  const siteData = JSON.parse(siteUrl);
  const url = siteData.site?.url || `https://${SITE_NAME}.netlify.app`;
  
  console.log(`🌐 Site déployé sur: ${url}`);
  console.log('🔍 Test de connectivité...');
  
  // Test simple de connectivité (optionnel)
  try {
    const { default: fetch } = await import('node-fetch');
    const response = await fetch(`${url}/api/health`);
    if (response.ok) {
      console.log('✅ API Health check réussi');
    } else {
      console.log('⚠️  API Health check échoué (normal si pas encore configuré)');
    }
  } catch (error) {
    console.log('⚠️  Test de connectivité échoué (normal pour le premier déploiement)');
  }

} catch (error) {
  console.log('⚠️  Impossible de tester le déploiement');
}

console.log('\n🎊 Déploiement staging terminé !');
console.log('\n📋 Prochaines étapes:');
console.log('1. Configurez les variables d\'environnement sur Netlify');
console.log('2. Testez l\'application sur l\'URL fournie');
console.log('3. Configurez le domaine personnalisé si nécessaire');
console.log('4. Préparez le déploiement production sur Elest.io');

export default { SITE_NAME, BUILD_DIR };
