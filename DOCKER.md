# 🐳 **Guide Docker VoiceCoop**

Guide complet pour utiliser Docker avec VoiceCoop dans différents environnements.

## 📋 **Vue d'Ensemble**

VoiceCoop utilise **Supabase Cloud** en production, mais Docker peut être utilisé pour :
- **Développement local** avec PostgreSQL et Redis
- **Tests d'intégration** avec base de données isolée
- **Déploiement on-premise** si nécessaire

## 🚀 **Démarrage Rapide**

### **1. Environnement de Développement**
```bash
# Démarrer les services de développement
npm run docker:dev

# Services disponibles:
# - PostgreSQL: localhost:5433
# - Redis: localhost:6380
# - Adminer (DB UI): http://localhost:8080
# - Redis Commander: http://localhost:8081
# - MailHog (Email): http://localhost:8025
```

### **2. Application Complète Locale**
```bash
# Démarrer l'application complète
npm run docker:local

# Services:
# - Application: http://localhost:3000
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
```

## 🛠️ **Environnements Disponibles**

### **🔧 Développement (`docker:dev`)**
- **PostgreSQL** sur port 5433
- **Redis** sur port 6380
- **Outils de développement** (Adminer, Redis Commander, MailHog)
- **Idéal pour** : Développement local, tests de base de données

### **🏠 Local Complet (`docker:local`)**
- **Application Next.js** sur port 3000
- **PostgreSQL** sur port 5432
- **Redis** sur port 6379
- **Idéal pour** : Tests d'intégration, démonstrations

### **📊 Avec Monitoring**
```bash
# Démarrer avec Prometheus et Grafana
docker-compose --profile monitoring up -d

# Services additionnels:
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3001
```

### **🚀 Production**
```bash
# Démarrer avec Nginx et monitoring
docker-compose --profile production up -d

# Services:
# - Nginx: http://localhost:80
# - Application: http://localhost:3000
# - Monitoring complet
```

## 📊 **Scripts NPM Disponibles**

```bash
# Gestion des environnements
npm run docker:dev          # Démarrer environnement de développement
npm run docker:local        # Démarrer application complète
npm run docker:stop         # Arrêter tous les services
npm run docker:clean        # Nettoyer conteneurs et volumes
npm run docker:status       # Voir le statut des conteneurs
npm run docker:logs         # Voir les logs en temps réel

# Script avancé
node scripts/docker-manager.js help    # Aide complète
```

## 🔧 **Configuration**

### **Variables d'Environnement**

Le fichier `.env.local` est automatiquement créé depuis `.env.example` au premier démarrage.

**Pour PostgreSQL local :**
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5433/voicecoop_dev"
```

**Pour Redis local :**
```bash
REDIS_URL="redis://localhost:6380"
```

**Pour MailHog (tests email) :**
```bash
SMTP_HOST="localhost"
SMTP_PORT="1025"
```

### **Ports Utilisés**

| Service | Port Dev | Port Local | Description |
|---------|----------|------------|-------------|
| Application | - | 3000 | Interface Next.js |
| PostgreSQL | 5433 | 5432 | Base de données |
| Redis | 6380 | 6379 | Cache et sessions |
| Adminer | 8080 | - | Interface DB |
| Redis Commander | 8081 | - | Interface Redis |
| MailHog | 8025 | - | Interface email |
| Prometheus | - | 9090 | Métriques |
| Grafana | - | 3001 | Dashboards |

## 🗄️ **Base de Données**

### **Supabase Cloud (Recommandé)**
```bash
# Configuration dans .env.local
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### **PostgreSQL Local (Développement)**
```bash
# Démarrer PostgreSQL local
npm run docker:dev

# Se connecter via Adminer
# URL: http://localhost:8080
# Serveur: postgres-dev
# Utilisateur: postgres
# Mot de passe: password
# Base: voicecoop_dev
```

## 🧹 **Maintenance**

### **Nettoyage**
```bash
# Nettoyer tout
npm run docker:clean

# Nettoyer manuellement
docker-compose down -v --remove-orphans
docker system prune -f
```

### **Logs et Debug**
```bash
# Logs en temps réel
npm run docker:logs

# Logs d'un service spécifique
docker-compose logs -f voicecoop-app

# Entrer dans un conteneur
docker exec -it voicecoop-postgres-dev psql -U postgres -d voicecoop_dev
```

### **Mise à Jour**
```bash
# Reconstruire les images
docker-compose build --no-cache

# Redémarrer avec nouvelles images
npm run docker:stop
npm run docker:local
```

## 🚨 **Dépannage**

### **Problèmes Courants**

**Port déjà utilisé :**
```bash
# Vérifier les ports
netstat -tulpn | grep :3000

# Arrêter les services
npm run docker:stop
```

**Base de données non accessible :**
```bash
# Vérifier le statut
npm run docker:status

# Redémarrer PostgreSQL
docker-compose restart postgres-dev
```

**Volumes corrompus :**
```bash
# Nettoyer et redémarrer
npm run docker:clean
npm run docker:dev
```

## 🎯 **Recommandations**

### **Pour le Développement**
- Utilisez `npm run docker:dev` pour les services uniquement
- Lancez l'application Next.js avec `npm run dev` en local
- Utilisez Supabase Cloud pour les tests réalistes

### **Pour les Tests**
- Utilisez `npm run docker:local` pour l'environnement complet
- PostgreSQL local pour les tests d'intégration
- MailHog pour tester les emails

### **Pour la Production**
- **Utilisez Supabase Cloud** (recommandé)
- Docker seulement si déploiement on-premise requis
- Monitoring avec Sentry en production

---

## 🎉 **C'est Prêt !**

Votre environnement Docker VoiceCoop est configuré et prêt à l'emploi ! 🚀
