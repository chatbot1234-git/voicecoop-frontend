#!/usr/bin/env node

/**
 * 🔒 SSL CERTIFICATE CHECKER - VoiceCoop
 * 
 * Vérifie le statut du certificat SSL et la sécurité HTTPS
 */

import https from 'https';
import { URL } from 'url';

class SSLChecker {
  constructor() {
    this.domain = 'voicecoop.netlify.app';
    this.url = `https://${this.domain}`;
  }

  async checkSSL() {
    console.log('🔒 VÉRIFICATION SSL - VoiceCoop\n');
    console.log(`🌐 Domaine: ${this.domain}`);
    console.log(`🔗 URL: ${this.url}\n`);

    try {
      await this.checkCertificate();
      await this.checkHTTPS();
      await this.checkSecurityHeaders();
      
      console.log('\n✅ VÉRIFICATION SSL TERMINÉE');
      
    } catch (error) {
      console.error('\n❌ ERREUR SSL CRITIQUE:', error.message);
      process.exit(1);
    }
  }

  async checkCertificate() {
    console.log('📜 Vérification du certificat SSL...');
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.domain,
        port: 443,
        path: '/',
        method: 'GET',
        rejectUnauthorized: true
      };

      const req = https.request(options, (res) => {
        const cert = res.socket.getPeerCertificate();
        
        if (cert && Object.keys(cert).length > 0) {
          console.log(`✅ Certificat SSL valide`);
          console.log(`   Émetteur: ${cert.issuer?.CN || 'N/A'}`);
          console.log(`   Sujet: ${cert.subject?.CN || 'N/A'}`);
          console.log(`   Expire le: ${new Date(cert.valid_to)}`);
          
          // Vérifier l'expiration
          const expiryDate = new Date(cert.valid_to);
          const now = new Date();
          const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry < 30) {
            console.log(`⚠️  Certificat expire dans ${daysUntilExpiry} jours`);
          } else {
            console.log(`✅ Certificat valide pour ${daysUntilExpiry} jours`);
          }
          
          resolve();
        } else {
          reject(new Error('Certificat SSL non trouvé'));
        }
      });

      req.on('error', (error) => {
        if (error.code === 'CERT_AUTHORITY_INVALID') {
          reject(new Error('Certificat SSL invalide - Autorité de certification non reconnue'));
        } else if (error.code === 'ENOTFOUND') {
          reject(new Error('Domaine non trouvé'));
        } else {
          reject(new Error(`Erreur SSL: ${error.message}`));
        }
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Timeout lors de la vérification SSL'));
      });

      req.end();
    });
  }

  async checkHTTPS() {
    console.log('\n🔐 Vérification HTTPS...');
    
    try {
      const response = await fetch(this.url, {
        method: 'HEAD',
        redirect: 'manual'
      });
      
      if (response.status === 200) {
        console.log('✅ HTTPS fonctionne correctement');
      } else {
        console.log(`⚠️  Status HTTPS: ${response.status}`);
      }
      
    } catch (error) {
      throw new Error(`Erreur HTTPS: ${error.message}`);
    }
  }

  async checkSecurityHeaders() {
    console.log('\n🛡️ Vérification des headers de sécurité...');
    
    try {
      const response = await fetch(this.url);
      const headers = response.headers;
      
      const securityHeaders = [
        'strict-transport-security',
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        'referrer-policy'
      ];
      
      let secureHeaders = 0;
      
      for (const header of securityHeaders) {
        if (headers.get(header)) {
          console.log(`✅ ${header}: ${headers.get(header)}`);
          secureHeaders++;
        } else {
          console.log(`❌ ${header}: Manquant`);
        }
      }
      
      const securityScore = Math.round((secureHeaders / securityHeaders.length) * 100);
      console.log(`\n🎯 Score de sécurité: ${securityScore}%`);
      
      if (securityScore < 80) {
        console.log('⚠️  Score de sécurité faible - Améliorations recommandées');
      }
      
    } catch (error) {
      throw new Error(`Erreur vérification headers: ${error.message}`);
    }
  }

  async checkHTTPRedirect() {
    console.log('\n🔄 Vérification redirection HTTP → HTTPS...');
    
    try {
      const httpUrl = `http://${this.domain}`;
      const response = await fetch(httpUrl, {
        method: 'HEAD',
        redirect: 'manual'
      });
      
      if (response.status === 301 || response.status === 302) {
        const location = response.headers.get('location');
        if (location && location.startsWith('https://')) {
          console.log('✅ Redirection HTTP → HTTPS configurée');
        } else {
          console.log('❌ Redirection HTTP incorrecte');
        }
      } else {
        console.log('❌ Pas de redirection HTTP → HTTPS');
      }
      
    } catch (error) {
      console.log(`⚠️  Erreur test redirection: ${error.message}`);
    }
  }
}

// Exécution
const checker = new SSLChecker();
checker.checkSSL().catch(console.error);
