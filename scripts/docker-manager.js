#!/usr/bin/env node

/**
 * 🐳 Docker Manager pour VoiceCoop
 * Script utilitaire pour gérer les environnements Docker
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ENVIRONMENTS = {
  dev: {
    name: 'Développement',
    file: 'docker-compose.dev.yml',
    description: 'PostgreSQL + Redis + Outils de dev'
  },
  local: {
    name: 'Local complet',
    file: 'docker-compose.yml',
    description: 'Application + PostgreSQL + Redis'
  },
  monitoring: {
    name: 'Avec monitoring',
    file: 'docker-compose.yml',
    profile: 'monitoring',
    description: 'Application + Prometheus + Grafana'
  },
  production: {
    name: 'Production',
    file: 'docker-compose.yml',
    profile: 'production',
    description: 'Application + Nginx + Monitoring'
  }
};

function showHelp() {
  console.log(`
🐳 Docker Manager VoiceCoop

Usage: node scripts/docker-manager.js <command> [environment]

Commands:
  start <env>     Démarrer un environnement
  stop <env>      Arrêter un environnement
  restart <env>   Redémarrer un environnement
  logs <env>      Voir les logs
  status          Voir le statut des conteneurs
  clean           Nettoyer tous les conteneurs et volumes
  help            Afficher cette aide

Environnements disponibles:
${Object.entries(ENVIRONMENTS).map(([key, env]) => 
  `  ${key.padEnd(12)} ${env.name} - ${env.description}`
).join('\n')}

Exemples:
  node scripts/docker-manager.js start dev
  node scripts/docker-manager.js logs local
  node scripts/docker-manager.js clean
`);
}

function executeCommand(command, options = {}) {
  try {
    console.log(`🔧 Exécution: ${command}`);
    const result = execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8'
    });
    return result;
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    process.exit(1);
  }
}

function buildDockerCommand(action, environment) {
  const env = ENVIRONMENTS[environment];
  if (!env) {
    console.error(`❌ Environnement '${environment}' non reconnu`);
    showHelp();
    process.exit(1);
  }

  let command = `docker-compose -f ${env.file}`;
  
  if (env.profile) {
    command += ` --profile ${env.profile}`;
  }
  
  command += ` ${action}`;
  
  return command;
}

function startEnvironment(environment) {
  console.log(`🚀 Démarrage de l'environnement: ${ENVIRONMENTS[environment].name}`);
  
  // Vérifier que le fichier .env.local existe
  if (!fs.existsSync('.env.local')) {
    console.log('⚠️  Fichier .env.local non trouvé');
    console.log('📋 Copie du template...');
    if (fs.existsSync('.env.example')) {
      fs.copyFileSync('.env.example', '.env.local');
      console.log('✅ Fichier .env.local créé depuis .env.example');
      console.log('🔧 Modifiez .env.local avec vos vraies valeurs');
    }
  }
  
  const command = buildDockerCommand('up -d', environment);
  executeCommand(command);
  
  console.log(`✅ Environnement ${ENVIRONMENTS[environment].name} démarré`);
  
  // Afficher les services disponibles
  if (environment === 'dev') {
    console.log(`
📊 Services de développement disponibles:
  🗄️  PostgreSQL:      localhost:5433
  🗄️  Redis:           localhost:6380
  🔍 Adminer (DB):     http://localhost:8080
  📊 Redis Commander: http://localhost:8081
  📧 MailHog (Email):  http://localhost:8025
`);
  }
}

function stopEnvironment(environment) {
  console.log(`🛑 Arrêt de l'environnement: ${ENVIRONMENTS[environment].name}`);
  const command = buildDockerCommand('down', environment);
  executeCommand(command);
  console.log(`✅ Environnement ${ENVIRONMENTS[environment].name} arrêté`);
}

function restartEnvironment(environment) {
  console.log(`🔄 Redémarrage de l'environnement: ${ENVIRONMENTS[environment].name}`);
  stopEnvironment(environment);
  startEnvironment(environment);
}

function showLogs(environment) {
  console.log(`📋 Logs de l'environnement: ${ENVIRONMENTS[environment].name}`);
  const command = buildDockerCommand('logs -f', environment);
  executeCommand(command);
}

function showStatus() {
  console.log('📊 Statut des conteneurs Docker:');
  executeCommand('docker ps -a --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"');
}

function cleanAll() {
  console.log('🧹 Nettoyage complet des conteneurs et volumes...');
  
  // Arrêter tous les conteneurs VoiceCoop
  try {
    executeCommand('docker stop $(docker ps -q --filter "name=voicecoop")', { silent: true });
  } catch (error) {
    // Ignorer si aucun conteneur à arrêter
  }
  
  // Supprimer tous les conteneurs VoiceCoop
  try {
    executeCommand('docker rm $(docker ps -aq --filter "name=voicecoop")', { silent: true });
  } catch (error) {
    // Ignorer si aucun conteneur à supprimer
  }
  
  // Supprimer les volumes
  try {
    executeCommand('docker volume rm $(docker volume ls -q --filter "name=voicecoop")', { silent: true });
  } catch (error) {
    // Ignorer si aucun volume à supprimer
  }
  
  // Nettoyer les images non utilisées
  executeCommand('docker system prune -f');
  
  console.log('✅ Nettoyage terminé');
}

// Main
const [,, command, environment] = process.argv;

if (!command) {
  showHelp();
  process.exit(0);
}

switch (command) {
  case 'start':
    if (!environment) {
      console.error('❌ Environnement requis pour la commande start');
      showHelp();
      process.exit(1);
    }
    startEnvironment(environment);
    break;
    
  case 'stop':
    if (!environment) {
      console.error('❌ Environnement requis pour la commande stop');
      showHelp();
      process.exit(1);
    }
    stopEnvironment(environment);
    break;
    
  case 'restart':
    if (!environment) {
      console.error('❌ Environnement requis pour la commande restart');
      showHelp();
      process.exit(1);
    }
    restartEnvironment(environment);
    break;
    
  case 'logs':
    if (!environment) {
      console.error('❌ Environnement requis pour la commande logs');
      showHelp();
      process.exit(1);
    }
    showLogs(environment);
    break;
    
  case 'status':
    showStatus();
    break;
    
  case 'clean':
    cleanAll();
    break;
    
  case 'help':
    showHelp();
    break;
    
  default:
    console.error(`❌ Commande '${command}' non reconnue`);
    showHelp();
    process.exit(1);
}

export default { ENVIRONMENTS };
