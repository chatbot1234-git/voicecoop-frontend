# 🚀 **Déploiement Rapide VoiceCoop**

Guide express pour déployer VoiceCoop en 5 minutes.

## 🎯 **Déploiement Staging (Netlify)**

### **1. Préparation (1 min)**

```bash
# Vérifications automatiques
npm run deploy:check
```

### **2. Déploiement Automatique (2 min)**

```bash
# Déploiement complet
npm run deploy:staging
```

### **3. Configuration Variables (2 min)**

Sur [app.netlify.com](https://app.netlify.com) → Site Settings → Environment Variables :

```bash
NEXTAUTH_URL=https://votre-site.netlify.app
NEXTAUTH_SECRET=votre-secret-staging
NEXT_PUBLIC_SUPABASE_URL=votre-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
```

## 🏭 **Déploiement Production (Elest.io)**

### **1. Préparation (1 min)**

```bash
# Tests complets
npm run deploy:prepare
```

### **2. Déploiement Automatique (3 min)**

```bash
# Déploiement production
npm run deploy:production
```

### **3. Configuration Variables (1 min)**

Sur [elest.io/dashboard](https://elest.io/dashboard) → Variables d'environnement :

```bash
NEXTAUTH_URL=https://voicecoop.com
NEXTAUTH_SECRET=votre-secret-production
NEXT_PUBLIC_SUPABASE_URL=votre-supabase-production-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-supabase-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-production-key
```

## ✅ **Vérification Post-Déploiement**

### **Tests Rapides**

```bash
# Health check
curl https://votre-site.com/api/health

# Test page d'accueil
curl -I https://votre-site.com
```

### **Checklist Express**

- [ ] ✅ Site accessible
- [ ] ✅ HTTPS actif
- [ ] ✅ Page d'accueil se charge
- [ ] ✅ API Health répond
- [ ] ✅ Variables d'environnement configurées

## 🚨 **Dépannage Express**

### **Erreur de Build**
```bash
npm run build  # Tester localement
```

### **Variables Manquantes**
```bash
# Netlify
netlify env:list

# Elest.io
elest apps env list votre-app
```

### **SSL/HTTPS**
- Attendre 5-10 minutes pour la propagation
- Vérifier la configuration DNS

## 📞 **Support Rapide**

- **Build Failed** → Vérifier `npm run build`
- **404 Errors** → Vérifier les redirections
- **API Errors** → Vérifier les variables d'environnement
- **SSL Issues** → Attendre la propagation DNS

---

## 🎊 **C'est Déployé !**

**Staging** : https://voicecoop-staging.netlify.app  
**Production** : https://voicecoop.com

**Temps total : 5-10 minutes** ⚡
