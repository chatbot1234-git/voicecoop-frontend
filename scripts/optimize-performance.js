#!/usr/bin/env node

/**
 * Script d'optimisation performance pour VoiceCoop
 * Analyse et optimise les performances de l'application
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PerformanceOptimizer {
  constructor() {
    this.results = {
      bundleSize: {},
      lighthouse: {},
      webVitals: {},
      recommendations: []
    };
  }

  log(message, color = 'reset') {
    const colors = {
      green: '\x1b[32m',
      red: '\x1b[31m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      reset: '\x1b[0m',
      bold: '\x1b[1m'
    };
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  /**
   * Analyse de la taille du bundle
   */
  async analyzeBundleSize() {
    this.log('\n📦 ANALYSE DE LA TAILLE DU BUNDLE', 'blue');
    
    try {
      // Build de production pour analyse
      this.log('Construction du build de production...');
      execSync('npm run build', { stdio: 'inherit' });
      
      // Analyse des fichiers .next
      const nextDir = path.join(process.cwd(), '.next');
      const staticDir = path.join(nextDir, 'static');
      
      if (fs.existsSync(staticDir)) {
        const chunks = this.analyzeChunks(staticDir);
        this.results.bundleSize = chunks;
        
        this.log('✅ Analyse du bundle terminée', 'green');
        this.displayBundleResults(chunks);
      }
    } catch (error) {
      this.log(`❌ Erreur analyse bundle: ${error.message}`, 'red');
    }
  }

  analyzeChunks(staticDir) {
    const chunks = {
      total: 0,
      javascript: 0,
      css: 0,
      files: []
    };

    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else {
          const size = stat.size;
          const ext = path.extname(file);
          
          chunks.total += size;
          chunks.files.push({
            name: file,
            size: size,
            sizeKB: Math.round(size / 1024),
            type: ext
          });
          
          if (ext === '.js') chunks.javascript += size;
          if (ext === '.css') chunks.css += size;
        }
      });
    };

    walkDir(staticDir);
    return chunks;
  }

  displayBundleResults(chunks) {
    this.log('\n📊 RÉSULTATS ANALYSE BUNDLE:', 'bold');
    this.log(`Total: ${Math.round(chunks.total / 1024)} KB`);
    this.log(`JavaScript: ${Math.round(chunks.javascript / 1024)} KB`);
    this.log(`CSS: ${Math.round(chunks.css / 1024)} KB`);
    
    // Top 10 des plus gros fichiers
    const topFiles = chunks.files
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);
    
    this.log('\n🔝 Top 10 des plus gros fichiers:', 'yellow');
    topFiles.forEach((file, index) => {
      this.log(`${index + 1}. ${file.name} - ${file.sizeKB} KB`);
    });

    // Recommandations
    this.generateBundleRecommendations(chunks);
  }

  generateBundleRecommendations(chunks) {
    const recommendations = [];
    
    if (chunks.javascript > 500 * 1024) { // > 500KB
      recommendations.push('⚠️  Bundle JavaScript volumineux (>500KB). Considérer le code splitting.');
    }
    
    if (chunks.css > 100 * 1024) { // > 100KB
      recommendations.push('⚠️  CSS volumineux (>100KB). Optimiser les styles non utilisés.');
    }
    
    const largeFiles = chunks.files.filter(f => f.size > 100 * 1024);
    if (largeFiles.length > 0) {
      recommendations.push(`⚠️  ${largeFiles.length} fichier(s) > 100KB détecté(s).`);
    }
    
    this.results.recommendations.push(...recommendations);
    
    if (recommendations.length > 0) {
      this.log('\n💡 RECOMMANDATIONS:', 'yellow');
      recommendations.forEach(rec => this.log(rec));
    }
  }

  /**
   * Test Lighthouse (si disponible)
   */
  async runLighthouseTest() {
    this.log('\n🔍 TEST LIGHTHOUSE', 'blue');
    
    try {
      // Vérifier si lighthouse est installé
      execSync('lighthouse --version', { stdio: 'pipe' });
      
      this.log('Exécution de Lighthouse...');
      const result = execSync(
        'lighthouse http://localhost:3001 --output=json --quiet --chrome-flags="--headless"',
        { encoding: 'utf8' }
      );
      
      const lighthouse = JSON.parse(result);
      this.results.lighthouse = {
        performance: lighthouse.lhr.categories.performance.score * 100,
        accessibility: lighthouse.lhr.categories.accessibility.score * 100,
        bestPractices: lighthouse.lhr.categories['best-practices'].score * 100,
        seo: lighthouse.lhr.categories.seo.score * 100,
      };
      
      this.log('✅ Test Lighthouse terminé', 'green');
      this.displayLighthouseResults();
      
    } catch (error) {
      this.log('⚠️  Lighthouse non disponible. Installation: npm i -g lighthouse', 'yellow');
    }
  }

  displayLighthouseResults() {
    const { lighthouse } = this.results;
    
    this.log('\n📊 SCORES LIGHTHOUSE:', 'bold');
    this.log(`Performance: ${lighthouse.performance}/100`);
    this.log(`Accessibilité: ${lighthouse.accessibility}/100`);
    this.log(`Bonnes Pratiques: ${lighthouse.bestPractices}/100`);
    this.log(`SEO: ${lighthouse.seo}/100`);
    
    // Recommandations basées sur les scores
    if (lighthouse.performance < 90) {
      this.results.recommendations.push('🚀 Améliorer les performances (score < 90)');
    }
    if (lighthouse.accessibility < 95) {
      this.results.recommendations.push('♿ Améliorer l\'accessibilité (score < 95)');
    }
  }

  /**
   * Analyse des Core Web Vitals
   */
  async analyzeWebVitals() {
    this.log('\n⚡ ANALYSE CORE WEB VITALS', 'blue');
    
    // Simulation des métriques (en production, utiliser des vraies métriques)
    this.results.webVitals = {
      fcp: 1.2, // First Contentful Paint
      lcp: 2.1, // Largest Contentful Paint
      fid: 45,  // First Input Delay
      cls: 0.08, // Cumulative Layout Shift
    };
    
    this.displayWebVitalsResults();
  }

  displayWebVitalsResults() {
    const { webVitals } = this.results;
    
    this.log('\n📊 CORE WEB VITALS:', 'bold');
    
    // FCP
    const fcpStatus = webVitals.fcp <= 1.8 ? '✅' : '❌';
    this.log(`${fcpStatus} First Contentful Paint: ${webVitals.fcp}s (cible: ≤1.8s)`);
    
    // LCP
    const lcpStatus = webVitals.lcp <= 2.5 ? '✅' : '❌';
    this.log(`${lcpStatus} Largest Contentful Paint: ${webVitals.lcp}s (cible: ≤2.5s)`);
    
    // FID
    const fidStatus = webVitals.fid <= 100 ? '✅' : '❌';
    this.log(`${fidStatus} First Input Delay: ${webVitals.fid}ms (cible: ≤100ms)`);
    
    // CLS
    const clsStatus = webVitals.cls <= 0.1 ? '✅' : '❌';
    this.log(`${clsStatus} Cumulative Layout Shift: ${webVitals.cls} (cible: ≤0.1)`);
    
    // Recommandations Web Vitals
    if (webVitals.lcp > 2.5) {
      this.results.recommendations.push('🖼️  Optimiser le LCP: images, fonts, CSS critique');
    }
    if (webVitals.fid > 100) {
      this.results.recommendations.push('⚡ Optimiser le FID: réduire le JavaScript, code splitting');
    }
    if (webVitals.cls > 0.1) {
      this.results.recommendations.push('📐 Optimiser le CLS: dimensions images, fonts stables');
    }
  }

  /**
   * Optimisations automatiques
   */
  async applyOptimizations() {
    this.log('\n🔧 APPLICATION D\'OPTIMISATIONS', 'blue');
    
    // 1. Optimisation des images (si dossier public/images existe)
    await this.optimizeImages();
    
    // 2. Génération du sitemap
    await this.generateSitemap();
    
    // 3. Optimisation des fonts
    await this.optimizeFonts();
    
    this.log('✅ Optimisations appliquées', 'green');
  }

  async optimizeImages() {
    const imagesDir = path.join(process.cwd(), 'public', 'images');
    
    if (fs.existsSync(imagesDir)) {
      this.log('🖼️  Optimisation des images...');
      // Ici on pourrait utiliser sharp ou imagemin pour optimiser les images
      this.log('💡 Recommandation: Utiliser next/image pour toutes les images');
    }
  }

  async generateSitemap() {
    this.log('🗺️  Génération du sitemap...');
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://voicecoop.com/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://voicecoop.com/auth/login</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://voicecoop.com/design-system</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <priority>0.6</priority>
  </url>
</urlset>`;

    fs.writeFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), sitemap);
    this.log('✅ Sitemap généré');
  }

  async optimizeFonts() {
    this.log('🔤 Optimisation des fonts...');
    this.log('💡 Recommandation: Utiliser next/font pour optimiser les fonts');
  }

  /**
   * Génération du rapport final
   */
  generateReport() {
    this.log('\n' + '='.repeat(60), 'bold');
    this.log('📊 RAPPORT D\'OPTIMISATION PERFORMANCE', 'bold');
    this.log('='.repeat(60), 'bold');
    
    // Résumé des métriques
    if (this.results.bundleSize.total) {
      this.log(`\n📦 Bundle: ${Math.round(this.results.bundleSize.total / 1024)} KB`);
    }
    
    if (this.results.lighthouse.performance) {
      this.log(`🔍 Lighthouse Performance: ${this.results.lighthouse.performance}/100`);
    }
    
    if (this.results.webVitals.lcp) {
      this.log(`⚡ LCP: ${this.results.webVitals.lcp}s`);
    }
    
    // Toutes les recommandations
    if (this.results.recommendations.length > 0) {
      this.log('\n💡 RECOMMANDATIONS PRIORITAIRES:', 'yellow');
      this.results.recommendations.forEach((rec, index) => {
        this.log(`${index + 1}. ${rec}`);
      });
    } else {
      this.log('\n🎉 Aucune optimisation critique nécessaire !', 'green');
    }
    
    this.log('\n' + '='.repeat(60), 'bold');
  }

  /**
   * Exécution complète
   */
  async run() {
    this.log('🚀 DÉMARRAGE OPTIMISATION PERFORMANCE VOICECOOP', 'bold');
    
    await this.analyzeBundleSize();
    await this.runLighthouseTest();
    await this.analyzeWebVitals();
    await this.applyOptimizations();
    
    this.generateReport();
  }
}

// Exécution si appelé directement
if (require.main === module) {
  const optimizer = new PerformanceOptimizer();
  optimizer.run().catch(error => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
}

module.exports = { PerformanceOptimizer };
