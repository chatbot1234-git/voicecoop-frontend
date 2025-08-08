#!/usr/bin/env node

/**
 * 🔒 SECURITY AUDIT SCRIPT - VoiceCoop
 * 
 * Audit complet de sécurité pour détecter :
 * - Fichiers sensibles exposés
 * - Clés hardcodées
 * - Vulnérabilités de configuration
 * - Headers de sécurité manquants
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SecurityAuditor {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.info = [];
    
    // Patterns de détection de secrets
    this.secretPatterns = [
      { name: 'API Key', pattern: /api[_-]?key[_-]?[=:]\s*['"]\w{20,}['"]/ },
      { name: 'Secret Key', pattern: /secret[_-]?key[_-]?[=:]\s*['"]\w{20,}['"]/ },
      { name: 'JWT Secret', pattern: /jwt[_-]?secret[_-]?[=:]\s*['"]\w{20,}['"]/ },
      { name: 'Database URL', pattern: /database[_-]?url[_-]?[=:]\s*['"][\w\-\.]+:\/\/[\w\-\.]+:[\w\-\.]+@/ },
      { name: 'Private Key', pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/ },
      { name: 'AWS Key', pattern: /AKIA[0-9A-Z]{16}/ },
      { name: 'GitHub Token', pattern: /ghp_[a-zA-Z0-9]{36}/ },
      { name: 'Supabase Key', pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/ }
    ];
    
    // Fichiers à exclure de l'audit
    this.excludePatterns = [
      /node_modules/,
      /\.git/,
      /\.next/,
      /build/,
      /dist/,
      /coverage/,
      /\.log$/,
      /\.cache/
    ];
  }

  /**
   * Lance l'audit complet
   */
  async runAudit() {
    console.log('🔒 DÉMARRAGE DE L\'AUDIT DE SÉCURITÉ VOICECOOP\n');
    
    await this.checkFilePermissions();
    await this.scanForSecrets();
    await this.checkGitignore();
    await this.checkSecurityHeaders();
    await this.checkDependencies();
    await this.checkEnvironmentFiles();
    
    this.generateReport();
  }

  /**
   * Vérifie les permissions des fichiers
   */
  async checkFilePermissions() {
    console.log('📁 Vérification des permissions de fichiers...');
    
    const sensitiveFiles = [
      '.env',
      '.env.local',
      '.env.production',
      'package.json',
      'next.config.js',
      'middleware.ts'
    ];
    
    for (const file of sensitiveFiles) {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        const mode = stats.mode & parseInt('777', 8);
        
        if (mode & parseInt('044', 8)) {
          this.issues.push(`❌ ${file} est lisible par d'autres utilisateurs (${mode.toString(8)})`);
        } else {
          this.info.push(`✅ ${file} a des permissions sécurisées`);
        }
      }
    }
  }

  /**
   * Scanne les fichiers à la recherche de secrets
   */
  async scanForSecrets() {
    console.log('🔍 Scan des secrets hardcodés...');
    
    const files = this.getAllFiles('.');
    
    for (const file of files) {
      if (this.shouldExcludeFile(file)) continue;
      
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        for (const { name, pattern } of this.secretPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            this.issues.push(`🚨 ${name} détecté dans ${file}: ${matches[0].substring(0, 50)}...`);
          }
        }
        
        // Vérifier les TODO de sécurité
        if (content.includes('TODO') && content.toLowerCase().includes('security')) {
          this.warnings.push(`⚠️ TODO de sécurité trouvé dans ${file}`);
        }
        
      } catch (error) {
        // Ignorer les erreurs de lecture de fichiers binaires
      }
    }
  }

  /**
   * Vérifie la configuration .gitignore
   */
  async checkGitignore() {
    console.log('📝 Vérification du .gitignore...');
    
    if (!fs.existsSync('.gitignore')) {
      this.issues.push('❌ Fichier .gitignore manquant');
      return;
    }
    
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    const requiredPatterns = [
      '.env*',
      '*.key',
      '*.pem',
      'node_modules',
      '.next'
    ];
    
    for (const pattern of requiredPatterns) {
      if (!gitignore.includes(pattern)) {
        this.warnings.push(`⚠️ Pattern manquant dans .gitignore: ${pattern}`);
      } else {
        this.info.push(`✅ Pattern protégé: ${pattern}`);
      }
    }
  }

  /**
   * Vérifie les headers de sécurité
   */
  async checkSecurityHeaders() {
    console.log('🛡️ Vérification des headers de sécurité...');
    
    const middlewareFile = 'src/middleware.ts';
    if (!fs.existsSync(middlewareFile)) {
      this.issues.push('❌ Middleware de sécurité manquant');
      return;
    }
    
    const middleware = fs.readFileSync(middlewareFile, 'utf8');
    const requiredHeaders = [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'X-XSS-Protection',
      'Content-Security-Policy',
      'Strict-Transport-Security'
    ];
    
    for (const header of requiredHeaders) {
      if (middleware.includes(header)) {
        this.info.push(`✅ Header de sécurité configuré: ${header}`);
      } else {
        this.warnings.push(`⚠️ Header de sécurité manquant: ${header}`);
      }
    }
  }

  /**
   * Vérifie les dépendances
   */
  async checkDependencies() {
    console.log('📦 Vérification des dépendances...');
    
    if (!fs.existsSync('package.json')) {
      this.issues.push('❌ package.json manquant');
      return;
    }
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Vérifier les dépendances de sécurité
    const securityDeps = ['helmet', 'bcryptjs', 'jsonwebtoken'];
    const installedSecurityDeps = [];
    
    for (const dep of securityDeps) {
      if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
        installedSecurityDeps.push(dep);
        this.info.push(`✅ Dépendance de sécurité installée: ${dep}`);
      }
    }
    
    if (installedSecurityDeps.length === 0) {
      this.warnings.push('⚠️ Aucune dépendance de sécurité explicite détectée');
    }
  }

  /**
   * Vérifie les fichiers d'environnement
   */
  async checkEnvironmentFiles() {
    console.log('🌍 Vérification des fichiers d\'environnement...');
    
    const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
    
    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        this.issues.push(`🚨 Fichier d'environnement trouvé: ${envFile} (ne devrait pas être commité)`);
      }
    }
    
    if (fs.existsSync('.env.example')) {
      this.info.push('✅ Template .env.example trouvé');
    } else {
      this.warnings.push('⚠️ Template .env.example manquant');
    }
  }

  /**
   * Récupère tous les fichiers du projet
   */
  getAllFiles(dir) {
    const files = [];
    
    const walk = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !this.shouldExcludeFile(fullPath)) {
          walk(fullPath);
        } else if (stat.isFile()) {
          files.push(fullPath);
        }
      }
    };
    
    walk(dir);
    return files;
  }

  /**
   * Vérifie si un fichier doit être exclu
   */
  shouldExcludeFile(file) {
    return this.excludePatterns.some(pattern => pattern.test(file));
  }

  /**
   * Génère le rapport final
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPPORT D\'AUDIT DE SÉCURITÉ VOICECOOP');
    console.log('='.repeat(60));
    
    console.log(`\n🚨 PROBLÈMES CRITIQUES (${this.issues.length}):`);
    this.issues.forEach(issue => console.log(issue));
    
    console.log(`\n⚠️ AVERTISSEMENTS (${this.warnings.length}):`);
    this.warnings.forEach(warning => console.log(warning));
    
    console.log(`\n✅ POINTS POSITIFS (${this.info.length}):`);
    this.info.forEach(info => console.log(info));
    
    // Score de sécurité
    const totalChecks = this.issues.length + this.warnings.length + this.info.length;
    const securityScore = Math.round((this.info.length / totalChecks) * 100);
    
    console.log(`\n🎯 SCORE DE SÉCURITÉ: ${securityScore}%`);
    
    if (this.issues.length > 0) {
      console.log('\n❌ AUDIT ÉCHOUÉ - Problèmes critiques détectés');
      process.exit(1);
    } else if (this.warnings.length > 5) {
      console.log('\n⚠️ AUDIT PARTIELLEMENT RÉUSSI - Améliorations recommandées');
      process.exit(0);
    } else {
      console.log('\n✅ AUDIT RÉUSSI - Sécurité satisfaisante');
      process.exit(0);
    }
  }
}

// Exécution de l'audit
const auditor = new SecurityAuditor();
auditor.runAudit().catch(console.error);

export default SecurityAuditor;
