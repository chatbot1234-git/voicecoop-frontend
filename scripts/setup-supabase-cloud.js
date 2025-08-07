#!/usr/bin/env node

/**
 * Script de configuration rapide Supabase Cloud
 * Exécute tous les scripts SQL dans l'ordre
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SupabaseCloudSetup {
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

  readSQLScript(filename) {
    const scriptPath = path.join(this.supabaseDir, filename);
    if (fs.existsSync(scriptPath)) {
      return fs.readFileSync(scriptPath, 'utf8');
    }
    return null;
  }

  displayScript(filename, content) {
    this.log(`\n${'='.repeat(60)}`, 'info');
    this.log(`📄 SCRIPT: ${filename}`, 'success');
    this.log(`${'='.repeat(60)}`, 'info');
    
    // Afficher les premières lignes pour identification
    const lines = content.split('\n');
    const description = lines.slice(0, 10).join('\n');
    
    console.log(description);
    this.log(`\n... (${lines.length} lignes au total)`, 'info');
    this.log(`${'='.repeat(60)}`, 'info');
  }

  async run() {
    this.log('🚀 CONFIGURATION SUPABASE CLOUD POUR VOICECOOP', 'success');
    this.log('', 'info');
    
    const scripts = [
      {
        file: 'schema.sql',
        name: 'Schéma de Base',
        description: 'Tables, fonctions et politiques principales'
      },
      {
        file: '01_verify_schema.sql',
        name: 'Vérification du Schéma',
        description: 'Validation que tout est créé correctement'
      },
      {
        file: '02_sample_data.sql',
        name: 'Données de Test',
        description: 'Utilisateurs et conversations d\'exemple'
      },
      {
        file: '03_edge_functions.sql',
        name: 'Fonctions Avancées',
        description: 'Statistiques et fonctions de gouvernance'
      },
      {
        file: '04_security_policies.sql',
        name: 'Sécurité Renforcée',
        description: 'Politiques RLS granulaires'
      },
      {
        file: '05_performance_optimization.sql',
        name: 'Optimisations Performance',
        description: 'Index et vues matérialisées'
      },
      {
        file: '06_final_configuration.sql',
        name: 'Configuration Finale',
        description: 'Validation et configuration système'
      }
    ];

    this.log('📋 SCRIPTS À EXÉCUTER DANS SUPABASE DASHBOARD :', 'info');
    this.log('', 'info');

    scripts.forEach((script, index) => {
      this.log(`${index + 1}. ${script.name} (${script.file})`, 'warning');
      this.log(`   ${script.description}`, 'info');
    });

    this.log('\n🎯 INSTRUCTIONS D\'EXÉCUTION :', 'success');
    this.log('', 'info');
    this.log('1. Aller sur https://supabase.com/dashboard', 'info');
    this.log('2. Sélectionner votre projet VoiceCoop', 'info');
    this.log('3. Aller dans SQL Editor', 'info');
    this.log('4. Exécuter chaque script dans l\'ordre ci-dessous', 'info');
    this.log('', 'info');

    // Afficher chaque script
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      const content = this.readSQLScript(script.file);
      
      if (content) {
        this.log(`\n🔄 ÉTAPE ${i + 1}/${scripts.length} : ${script.name}`, 'warning');
        this.log(`📁 Fichier: supabase/${script.file}`, 'info');
        this.log(`📝 Description: ${script.description}`, 'info');
        this.log('', 'info');
        this.log('👆 COPIEZ ET COLLEZ CE SCRIPT DANS SUPABASE SQL EDITOR :', 'success');
        this.log('', 'info');
        
        // Afficher le contenu complet pour copier-coller
        console.log('```sql');
        console.log(content);
        console.log('```');
        
        this.log('\n✅ Après exécution, passez au script suivant', 'success');
        this.log('⏳ Attendez la confirmation avant de continuer', 'warning');
        
        if (i < scripts.length - 1) {
          this.log('\n' + '─'.repeat(60), 'info');
        }
      } else {
        this.log(`❌ Script ${script.file} non trouvé`, 'error');
      }
    }

    this.log('\n🎉 CONFIGURATION TERMINÉE !', 'success');
    this.log('', 'info');
    this.log('Après avoir exécuté tous les scripts :', 'info');
    this.log('✅ Votre base de données sera complètement configurée', 'success');
    this.log('✅ Toutes les fonctionnalités VoiceCoop seront disponibles', 'success');
    this.log('✅ Vous pourrez utiliser MCP pour interagir avec la DB', 'success');
    this.log('✅ L\'application sera prête pour la production', 'success');
    this.log('', 'info');
    this.log('🔄 N\'oubliez pas de mettre à jour vos variables d\'environnement !', 'warning');
    this.log('', 'info');
    this.log('📋 VARIABLES À CONFIGURER DANS .env.local :', 'warning');
    this.log('NEXT_PUBLIC_SUPABASE_URL="https://votre-project-id.supabase.co"', 'info');
    this.log('NEXT_PUBLIC_SUPABASE_ANON_KEY="votre-anon-key"', 'info');
    this.log('SUPABASE_SERVICE_ROLE_KEY="votre-service-role-key"', 'info');
  }
}

// Exécution
const setup = new SupabaseCloudSetup();
setup.run();
