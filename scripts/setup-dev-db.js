#!/usr/bin/env node

/**
 * Script de configuration de la base de données de développement
 * Utilise SQLite pour simplifier le développement
 */

const fs = require('fs');
const path = require('path');

// Configuration pour SQLite en développement
const sqliteConfig = `
# Base de données SQLite pour le développement
DATABASE_URL="file:./dev.db"

# Services simulés pour le développement
GOOGLE_GEMINI_API_KEY="dev-mock-key"
ULTRAVOX_API_KEY="dev-mock-key"
ULTRAVOX_API_URL="http://localhost:3001/api/mock/ultravox"

# AWS simulé
AWS_ACCESS_KEY_ID="dev-mock-key"
AWS_SECRET_ACCESS_KEY="dev-mock-secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="voicecoop-dev"

# Redis simulé
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_SECRET="dev-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3001"

# Notifications simulées
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="dev@voicecoop.com"
SMTP_PASS="dev-password"

# Monitoring simulé
SENTRY_DSN=""
NEXT_PUBLIC_MIXPANEL_TOKEN=""
NEXT_PUBLIC_POSTHOG_KEY=""
`;

function setupDevEnvironment() {
  console.log('🔧 Configuration de l\'environnement de développement...');
  
  // Créer le fichier .env.local s'il n'existe pas
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, sqliteConfig.trim());
    console.log('✅ Fichier .env.local créé avec configuration SQLite');
  } else {
    console.log('⚠️  Fichier .env.local existe déjà');
    
    // Vérifier si DATABASE_URL est configuré
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (!envContent.includes('DATABASE_URL')) {
      fs.appendFileSync(envPath, '\n# Base de données SQLite\nDATABASE_URL="file:./dev.db"\n');
      console.log('✅ DATABASE_URL ajouté au .env.local');
    }
  }
  
  console.log('🎯 Prochaines étapes:');
  console.log('1. npm run db:generate - Générer le client Prisma');
  console.log('2. npm run db:push - Créer la base de données');
  console.log('3. npm run dev - Redémarrer l\'application');
}

if (require.main === module) {
  setupDevEnvironment();
}

module.exports = { setupDevEnvironment };
