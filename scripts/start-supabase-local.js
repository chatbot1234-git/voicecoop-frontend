#!/usr/bin/env node

/**
 * Script de démarrage Supabase Local pour VoiceCoop
 * Initialise et configure l'environnement Supabase complet en local
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SupabaseLocalManager {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.supabaseDir = path.join(this.projectRoot, 'supabase');
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

  async checkPrerequisites() {
    this.log('🔍 Vérification des prérequis...', 'info');
    
    try {
      // Vérifier Docker
      execSync('docker --version', { stdio: 'pipe' });
      this.log('✅ Docker installé', 'success');
    } catch (error) {
      this.log('❌ Docker non installé ou non démarré', 'error');
      return false;
    }

    try {
      // Vérifier Docker Compose
      execSync('docker compose version', { stdio: 'pipe' });
      this.log('✅ Docker Compose disponible', 'success');
    } catch (error) {
      try {
        execSync('docker-compose --version', { stdio: 'pipe' });
        this.log('✅ Docker Compose (legacy) disponible', 'success');
      } catch (error2) {
        this.log('❌ Docker Compose non disponible', 'error');
        return false;
      }
    }

    return true;
  }

  async installSupabaseCLI() {
    this.log('📦 Installation de Supabase CLI...', 'info');
    
    try {
      // Vérifier si déjà installé
      execSync('supabase --version', { stdio: 'pipe' });
      this.log('✅ Supabase CLI déjà installé', 'success');
      return true;
    } catch (error) {
      // Installer via npm
      try {
        this.log('📥 Installation via npm...', 'info');
        execSync('npm install -g supabase', { stdio: 'inherit' });
        this.log('✅ Supabase CLI installé avec succès', 'success');
        return true;
      } catch (installError) {
        this.log('❌ Échec installation Supabase CLI', 'error');
        return false;
      }
    }
  }

  async initializeProject() {
    this.log('🏗️ Initialisation du projet Supabase...', 'info');
    
    try {
      // Vérifier si déjà initialisé
      if (fs.existsSync(path.join(this.supabaseDir, 'config.toml'))) {
        this.log('✅ Projet Supabase déjà initialisé', 'success');
        return true;
      }

      // Initialiser le projet
      process.chdir(this.projectRoot);
      execSync('supabase init', { stdio: 'inherit' });
      
      this.log('✅ Projet Supabase initialisé', 'success');
      return true;
    } catch (error) {
      this.log('❌ Échec initialisation projet', 'error');
      return false;
    }
  }

  async startSupabase() {
    this.log('🚀 Démarrage de Supabase Local...', 'info');
    
    try {
      process.chdir(this.projectRoot);
      
      // Démarrer Supabase (peut prendre quelques minutes la première fois)
      this.log('⏳ Téléchargement et démarrage des conteneurs Docker...', 'warning');
      this.log('   (Cela peut prendre 5-10 minutes la première fois)', 'warning');
      
      execSync('supabase start', { stdio: 'inherit' });
      
      this.log('✅ Supabase Local démarré avec succès !', 'success');
      return true;
    } catch (error) {
      this.log('❌ Échec démarrage Supabase', 'error');
      return false;
    }
  }

  async getLocalCredentials() {
    this.log('🔑 Récupération des credentials locaux...', 'info');
    
    try {
      const status = execSync('supabase status', { encoding: 'utf8' });
      
      // Parser les informations importantes
      const lines = status.split('\n');
      const credentials = {};
      
      lines.forEach(line => {
        if (line.includes('API URL:')) {
          credentials.url = line.split(':').slice(1).join(':').trim();
        }
        if (line.includes('anon key:')) {
          credentials.anonKey = line.split(':')[1].trim();
        }
        if (line.includes('service_role key:')) {
          credentials.serviceKey = line.split(':')[1].trim();
        }
        if (line.includes('DB URL:')) {
          credentials.dbUrl = line.split(':').slice(1).join(':').trim();
        }
      });

      this.log('✅ Credentials récupérés', 'success');
      return credentials;
    } catch (error) {
      this.log('❌ Échec récupération credentials', 'error');
      return null;
    }
  }

  async updateEnvFile(credentials) {
    this.log('📝 Mise à jour du fichier .env.local...', 'info');
    
    try {
      const envPath = path.join(this.projectRoot, '.env.local');
      let envContent = '';
      
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }

      // Remplacer ou ajouter les variables Supabase
      const supabaseVars = `
# Supabase Local Configuration (Auto-generated)
NEXT_PUBLIC_SUPABASE_URL="${credentials.url}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${credentials.anonKey}"
SUPABASE_SERVICE_ROLE_KEY="${credentials.serviceKey}"
SUPABASE_DB_URL="${credentials.dbUrl}"
`;

      // Supprimer les anciennes variables Supabase
      envContent = envContent.replace(/# Supabase.*?\n(.*\n)*/gm, '');
      
      // Ajouter les nouvelles variables
      envContent += supabaseVars;
      
      fs.writeFileSync(envPath, envContent);
      this.log('✅ Fichier .env.local mis à jour', 'success');
      return true;
    } catch (error) {
      this.log('❌ Échec mise à jour .env.local', 'error');
      return false;
    }
  }

  async applySQLScripts() {
    this.log('📊 Application des scripts SQL...', 'info');
    
    const scripts = [
      '01_verify_schema.sql',
      '02_sample_data.sql',
      '03_edge_functions.sql',
      '04_security_policies.sql',
      '05_performance_optimization.sql',
      '06_final_configuration.sql'
    ];

    try {
      for (const script of scripts) {
        const scriptPath = path.join(this.supabaseDir, script);
        
        if (fs.existsSync(scriptPath)) {
          this.log(`📄 Exécution de ${script}...`, 'info');
          
          // Exécuter le script via psql
          const dbUrl = await this.getDbUrl();
          execSync(`psql "${dbUrl}" -f "${scriptPath}"`, { stdio: 'inherit' });
          
          this.log(`✅ ${script} exécuté avec succès`, 'success');
        } else {
          this.log(`⚠️ Script ${script} non trouvé`, 'warning');
        }
      }
      
      this.log('✅ Tous les scripts SQL appliqués', 'success');
      return true;
    } catch (error) {
      this.log('❌ Erreur lors de l\'exécution des scripts', 'error');
      return false;
    }
  }

  async getDbUrl() {
    try {
      const status = execSync('supabase status', { encoding: 'utf8' });
      const dbUrlLine = status.split('\n').find(line => line.includes('DB URL:'));
      return dbUrlLine.split(':').slice(1).join(':').trim();
    } catch (error) {
      return 'postgresql://postgres:postgres@localhost:54322/postgres';
    }
  }

  async showFinalInstructions(credentials) {
    this.log('\n' + '='.repeat(60), 'info');
    this.log('🎉 SUPABASE LOCAL CONFIGURÉ AVEC SUCCÈS !', 'success');
    this.log('='.repeat(60), 'info');
    
    this.log('\n📊 INFORMATIONS DE CONNEXION :', 'info');
    this.log(`🔗 API URL: ${credentials.url}`, 'info');
    this.log(`🔑 Anon Key: ${credentials.anonKey.substring(0, 20)}...`, 'info');
    this.log(`🔐 Service Key: ${credentials.serviceKey.substring(0, 20)}...`, 'info');
    this.log(`🗄️ DB URL: ${credentials.dbUrl}`, 'info');
    
    this.log('\n🌐 INTERFACES DISPONIBLES :', 'info');
    this.log('📊 Supabase Studio: http://localhost:54323', 'info');
    this.log('🔐 Auth Admin: http://localhost:54324', 'info');
    this.log('📁 Storage: http://localhost:54325', 'info');
    this.log('⚡ Functions: http://localhost:54326', 'info');
    
    this.log('\n🔄 COMMANDES UTILES :', 'info');
    this.log('📊 Statut: supabase status', 'info');
    this.log('🛑 Arrêter: supabase stop', 'info');
    this.log('🔄 Redémarrer: supabase restart', 'info');
    this.log('📋 Logs: supabase logs', 'info');
    
    this.log('\n🎯 PROCHAINES ÉTAPES :', 'info');
    this.log('1. Ouvrir Supabase Studio: http://localhost:54323', 'info');
    this.log('2. Vérifier que les tables sont créées', 'info');
    this.log('3. Tester l\'authentification', 'info');
    this.log('4. Configurer votre frontend pour utiliser Supabase local', 'info');
    
    this.log('\n🎊 VoiceCoop est maintenant prêt avec Supabase Local !', 'success');
    this.log('='.repeat(60), 'info');
  }

  async run() {
    this.log('🚀 DÉMARRAGE CONFIGURATION SUPABASE LOCAL', 'info');
    
    // Vérifier les prérequis
    if (!(await this.checkPrerequisites())) {
      process.exit(1);
    }

    // Installer Supabase CLI
    if (!(await this.installSupabaseCLI())) {
      process.exit(1);
    }

    // Initialiser le projet
    if (!(await this.initializeProject())) {
      process.exit(1);
    }

    // Démarrer Supabase
    if (!(await this.startSupabase())) {
      process.exit(1);
    }

    // Récupérer les credentials
    const credentials = await this.getLocalCredentials();
    if (!credentials) {
      process.exit(1);
    }

    // Mettre à jour .env.local
    await this.updateEnvFile(credentials);

    // Appliquer les scripts SQL
    await this.applySQLScripts();

    // Afficher les instructions finales
    await this.showFinalInstructions(credentials);
  }
}

// Exécution directe
const manager = new SupabaseLocalManager();
manager.run().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

export default SupabaseLocalManager;
