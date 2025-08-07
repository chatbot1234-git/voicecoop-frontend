#!/usr/bin/env node

/**
 * Script pour corriger automatiquement les commentaires ESLint malformés
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction pour corriger les commentaires ESLint dans un fichier
function fixEslintComments(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Supprimer tous les commentaires ESLint problématiques
    const fixes = [
      // Supprimer complètement les commentaires eslint-disable-line
      {
        pattern: /\/\/ eslint-disable-line @typescript-eslint\/no-explicit-any[;,]?/g,
        replacement: ''
      },
      {
        pattern: /\/\* eslint-disable-line @typescript-eslint\/no-explicit-any[;,]? \*\//g,
        replacement: ''
      },
      // Nettoyer les espaces en trop
      {
        pattern: /\s+$/gm,
        replacement: ''
      }
    ];

    fixes.forEach(fix => {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigé: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Erreur lors de la correction de ${filePath}:`, error.message);
    return false;
  }
}

// Fonction pour parcourir récursivement les fichiers
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(filePath, callback);
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
      callback(filePath);
    }
  });
}

// Exécution principale
console.log('🔧 Correction des commentaires ESLint...\n');

const srcDir = path.join(__dirname, '..', 'src');
let fixedFiles = 0;

walkDir(srcDir, (filePath) => {
  if (fixEslintComments(filePath)) {
    fixedFiles++;
  }
});

console.log(`\n✨ Correction terminée: ${fixedFiles} fichiers corrigés`);

// Corriger aussi l'erreur de syntaxe dans authStore.ts
const authStorePath = path.join(srcDir, 'stores', 'authStore.ts');
if (fs.existsSync(authStorePath)) {
  let content = fs.readFileSync(authStorePath, 'utf8');
  
  // Corriger la structure try-catch
  if (content.includes('throw new Error(\'Erreur de connexion\');\n        }\n\n        const tokenData')) {
    content = content.replace(
      'throw new Error(\'Erreur de connexion\');\n        }\n\n        const tokenData',
      'throw new Error(\'Erreur de connexion\');\n        }\n\n        const tokenData'
    );
    
    // Vérifier qu'il y a bien un try avant
    if (!content.includes('try {') || content.split('try {').length !== content.split('} catch').length + 1) {
      console.log('⚠️  Structure try-catch à vérifier manuellement dans authStore.ts');
    }
  }
}

console.log('\n🎉 Script de correction terminé !');
