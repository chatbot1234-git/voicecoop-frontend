# 🎭 Tests E2E avec Playwright - VoiceCoop

Guide complet des tests end-to-end pour valider les parcours utilisateur de l'application VoiceCoop.

## 📋 Vue d'Ensemble

Les tests E2E couvrent 4 domaines principaux :

1. **🔐 Authentification** - Connexion, déconnexion, gestion de session
2. **💬 Conversation IA** - Interface de chat, vocal, historique
3. **🏛️ Gouvernance** - Propositions, votes, participation
4. **⚡ Performance & Responsive** - Performance, mobile, accessibilité

## 🚀 Installation et Configuration

### Prérequis

```bash
# Installer Playwright
npm install --save-dev @playwright/test

# Installer les navigateurs
npx playwright install
```

### Configuration

Le fichier `playwright.config.ts` configure :
- **Multi-navigateurs** : Chrome, Firefox, Safari
- **Multi-devices** : Desktop, Mobile, Tablette
- **Rapports** : HTML, JSON, JUnit
- **Captures** : Screenshots, vidéos, traces

## 🎯 Exécution des Tests

### Tests Complets

```bash
# Tous les tests E2E
npm run test:e2e

# Interface graphique
npm run test:e2e-ui

# Mode debug
npm run test:e2e-debug

# Avec navigateur visible
npm run test:e2e-headed
```

### Tests par Domaine

```bash
# Tests d'authentification
npm run test:e2e-auth

# Tests de conversation
npm run test:e2e-conversation

# Tests de gouvernance
npm run test:e2e-governance

# Tests de performance
npm run test:e2e-performance
```

### Tests par Navigateur

```bash
# Chrome uniquement
npx playwright test --project=chromium

# Firefox uniquement
npx playwright test --project=firefox

# Safari uniquement
npx playwright test --project=webkit

# Mobile Chrome
npx playwright test --project="Mobile Chrome"
```

## 📊 Tests d'Authentification

### Fonctionnalités Testées

- ✅ Affichage page d'accueil
- ✅ Navigation vers connexion
- ✅ Connexion OAuth GitHub
- ✅ Gestion des erreurs
- ✅ Redirection après connexion
- ✅ Déconnexion
- ✅ Protection pages privées
- ✅ Persistance de session
- ✅ Tokens expirés
- ✅ Interface mobile

### Exemple de Test

```typescript
test('Connexion avec GitHub OAuth', async ({ page }) => {
  await page.goto('/auth/signin');
  
  const githubButton = page.locator('[data-testid="github-signin-button"]');
  await expect(githubButton).toBeVisible();
  
  await githubButton.click();
  await expect(page).toHaveURL(/.*github\.com.*|.*\/auth\/callback.*/);
});
```

## 💬 Tests de Conversation IA

### Fonctionnalités Testées

- ✅ Création nouvelle conversation
- ✅ Envoi messages texte
- ✅ Interface vocale
- ✅ Historique conversations
- ✅ Suppression conversations
- ✅ Recherche dans conversations
- ✅ Paramètres conversation
- ✅ Gestion erreurs réseau
- ✅ Interface responsive
- ✅ Performance
- ✅ Accessibilité

### Exemple de Test

```typescript
test('Envoi d\'un message texte', async ({ page }) => {
  await page.goto('/chat');
  
  const messageInput = page.locator('[data-testid="message-input"]');
  await messageInput.fill('Bonjour, comment allez-vous ?');
  
  await page.click('[data-testid="send-button"]');
  
  await expect(page.locator('[data-testid="user-message"]').last())
    .toContainText('Bonjour, comment allez-vous ?');
});
```

## 🏛️ Tests de Gouvernance

### Fonctionnalités Testées

- ✅ Accès page gouvernance
- ✅ Liste des propositions
- ✅ Création proposition
- ✅ Validation formulaire
- ✅ Consultation proposition
- ✅ Vote pour/contre
- ✅ Changement de vote
- ✅ Commentaires
- ✅ Filtrage propositions
- ✅ Recherche propositions
- ✅ Statistiques
- ✅ Historique votes
- ✅ Notifications

### Exemple de Test

```typescript
test('Vote pour une proposition', async ({ page }) => {
  await page.goto('/governance/proposal/test-proposal-123');
  
  await page.click('[data-testid="vote-for"]');
  
  await expect(page.locator('[data-testid="vote-confirmation"]'))
    .toContainText('pour');
});
```

## ⚡ Tests de Performance & Responsive

### Tests de Performance

- ✅ Chargement pages (< 3s)
- ✅ Navigation entre pages (< 1.5s)
- ✅ Ressources réseau
- ✅ Utilisation mémoire
- ✅ Gestion erreurs réseau

### Tests Responsive

- ✅ Mobile (375px)
- ✅ Tablette (768px)
- ✅ Desktop (1920px)
- ✅ Navigation hamburger
- ✅ Formulaires tactiles
- ✅ Orientation portrait/paysage

### Tests Accessibilité

- ✅ Contraste et lisibilité
- ✅ Navigation clavier
- ✅ Lecteurs d'écran
- ✅ Attributs ARIA
- ✅ Landmarks

### Exemple de Test

```typescript
test('Performance - Chargement page d\'accueil', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('/');
  await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
  
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(2000);
});
```

## 📈 Rapports et Analyse

### Génération des Rapports

```bash
# Exécuter les tests et générer le rapport
npm run test:e2e

# Voir le rapport HTML
npm run test:e2e-report
```

### Types de Rapports

- **HTML** : Rapport interactif avec captures
- **JSON** : Données pour intégration CI/CD
- **JUnit** : Compatible avec outils de CI
- **Console** : Résultats en temps réel

### Captures et Traces

- **Screenshots** : En cas d'échec uniquement
- **Vidéos** : Enregistrement des échecs
- **Traces** : Debug détaillé avec timeline

## 🔧 Configuration Avancée

### Variables d'Environnement

```env
# URL de base de l'application
NEXTAUTH_URL=http://localhost:3000

# Configuration Supabase pour les tests
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Sélecteurs de Test

Utilisez des `data-testid` pour des sélecteurs stables :

```html
<button data-testid="login-button">Se connecter</button>
<div data-testid="user-message">Message utilisateur</div>
<form data-testid="proposal-form">Formulaire</form>
```

### Simulation d'États

```typescript
// Simuler un utilisateur connecté
await page.evaluate(() => {
  localStorage.setItem('test-auth', 'true');
  localStorage.setItem('test-user', JSON.stringify({
    id: 'test-user-123',
    name: 'Test User'
  }));
});
```

## 🚨 Résolution des Problèmes

### Tests qui Échouent

1. **Vérifiez l'application** : `npm run dev`
2. **Vérifiez les sélecteurs** : `data-testid` présents
3. **Vérifiez les timeouts** : Augmentez si nécessaire
4. **Mode debug** : `npm run test:e2e-debug`

### Performance Lente

1. **Parallélisation** : Configurée dans `playwright.config.ts`
2. **Navigateurs** : Testez un seul navigateur
3. **Tests spécifiques** : Exécutez par domaine

### Problèmes Mobile

1. **Viewport** : Vérifiez `setViewportSize()`
2. **Éléments tactiles** : Taille minimale 44px
3. **Navigation** : Menu hamburger fonctionnel

## 📚 Ressources

- [Documentation Playwright](https://playwright.dev/)
- [Sélecteurs Playwright](https://playwright.dev/docs/selectors)
- [Assertions Playwright](https://playwright.dev/docs/test-assertions)
- [Configuration Playwright](https://playwright.dev/docs/test-configuration)

## 🎯 Prochaines Étapes

Après des tests E2E réussis :

1. **Intégration CI/CD** - Tests automatiques
2. **Tests de charge** - Performance sous charge
3. **Tests utilisateurs** - Feedback réel
4. **Monitoring** - Surveillance production

---

**🎉 Bonne chance avec vos tests E2E !**
