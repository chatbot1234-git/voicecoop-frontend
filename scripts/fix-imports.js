#!/usr/bin/env node

/**
 * Script simple pour corriger les imports cassés par le script précédent
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixImports() {
  console.log('🔧 Correction des imports cassés...');
  
  const srcDir = path.join(process.cwd(), 'src');
  let fixedFiles = 0;
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        // Corriger les imports cassés
        content = content.replace(/&apos;/g, "'");
        content = content.replace(/&quot;/g, '"');
        content = content.replace(/&amp;/g, '&');
        content = content.replace(/&lt;/g, '<');
        content = content.replace(/&gt;/g, '>');
        
        if (content !== originalContent) {
          fs.writeFileSync(filePath, content);
          fixedFiles++;
          console.log(`✅ Corrigé: ${path.relative(process.cwd(), filePath)}`);
        }
      }
    }
  }
  
  walkDir(srcDir);
  console.log(`🎉 ${fixedFiles} fichiers corrigés !`);
}

fixImports();
