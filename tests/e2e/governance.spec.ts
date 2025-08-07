import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Gouvernance
 * Tests de création de propositions, votes et participation
 */

test.describe('Gouvernance', () => {
  test.beforeEach(async ({ page }) => {
    // Simuler un utilisateur connecté
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('test-auth', 'true');
      localStorage.setItem('test-user', JSON.stringify({
        id: 'test-user-123',
        name: 'Test User',
        email: 'test@voicecoop.com'
      }));
    });
  });

  test('Accès à la page de gouvernance', async ({ page }) => {
    // Aller à la page de gouvernance
    await page.goto('/governance');
    
    // Vérifier le titre de la page
    await expect(page).toHaveTitle(/.*Gouvernance.*|.*VoiceCoop.*/);
    
    // Vérifier la présence des éléments principaux
    await expect(page.locator('[data-testid="governance-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="proposals-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-proposal-button"]')).toBeVisible();
  });

  test('Affichage de la liste des propositions', async ({ page }) => {
    await page.goto('/governance');
    
    // Vérifier la présence de propositions
    await expect(page.locator('[data-testid="proposal-item"]').first()).toBeVisible();
    
    // Vérifier les informations d'une proposition
    const firstProposal = page.locator('[data-testid="proposal-item"]').first();
    await expect(firstProposal.locator('[data-testid="proposal-title"]')).toBeVisible();
    await expect(firstProposal.locator('[data-testid="proposal-status"]')).toBeVisible();
    await expect(firstProposal.locator('[data-testid="proposal-votes"]')).toBeVisible();
  });

  test('Création d\'une nouvelle proposition', async ({ page }) => {
    await page.goto('/governance');
    
    // Cliquer sur "Créer une proposition"
    await page.click('[data-testid="create-proposal-button"]');
    
    // Vérifier l'ouverture du formulaire
    await expect(page.locator('[data-testid="proposal-form"]')).toBeVisible();
    
    // Remplir le formulaire
    await page.fill('[data-testid="proposal-title"]', 'Amélioration de l\'interface utilisateur');
    await page.fill('[data-testid="proposal-description"]', 'Proposition pour améliorer l\'ergonomie de l\'application');
    
    // Sélectionner le type
    await page.selectOption('[data-testid="proposal-type"]', 'feature');
    
    // Soumettre la proposition
    await page.click('[data-testid="submit-proposal"]');
    
    // Vérifier la création
    await expect(page.locator('[data-testid="proposal-created"]')).toBeVisible();
    
    // Vérifier la redirection vers la proposition
    await expect(page).toHaveURL(/.*\/governance\/proposal\/.*/);
  });

  test('Validation du formulaire de proposition', async ({ page }) => {
    await page.goto('/governance');
    await page.click('[data-testid="create-proposal-button"]');
    
    // Essayer de soumettre sans remplir
    await page.click('[data-testid="submit-proposal"]');
    
    // Vérifier les messages d'erreur
    await expect(page.locator('[data-testid="title-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="description-error"]')).toBeVisible();
    
    // Remplir partiellement
    await page.fill('[data-testid="proposal-title"]', 'Test');
    
    // Vérifier que l'erreur de titre disparaît
    await expect(page.locator('[data-testid="title-error"]')).not.toBeVisible();
    
    // Vérifier que l'erreur de description reste
    await expect(page.locator('[data-testid="description-error"]')).toBeVisible();
  });

  test('Consultation d\'une proposition', async ({ page }) => {
    await page.goto('/governance');
    
    // Cliquer sur une proposition
    await page.click('[data-testid="proposal-item"]');
    
    // Vérifier la page de détail
    await expect(page).toHaveURL(/.*\/governance\/proposal\/.*/);
    await expect(page.locator('[data-testid="proposal-detail"]')).toBeVisible();
    
    // Vérifier les éléments de la proposition
    await expect(page.locator('[data-testid="proposal-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="proposal-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="proposal-author"]')).toBeVisible();
    await expect(page.locator('[data-testid="proposal-date"]')).toBeVisible();
  });

  test('Vote pour une proposition', async ({ page }) => {
    // Aller à une proposition spécifique
    await page.goto('/governance/proposal/test-proposal-123');
    
    // Vérifier la présence des boutons de vote
    await expect(page.locator('[data-testid="vote-for"]')).toBeVisible();
    await expect(page.locator('[data-testid="vote-against"]')).toBeVisible();
    
    // Voter pour
    await page.click('[data-testid="vote-for"]');
    
    // Vérifier la confirmation
    await expect(page.locator('[data-testid="vote-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="vote-confirmation"]')).toContainText('pour');
    
    // Vérifier la mise à jour des compteurs
    await expect(page.locator('[data-testid="votes-for"]')).toContainText(/\d+/);
  });

  test('Changement de vote', async ({ page }) => {
    await page.goto('/governance/proposal/test-proposal-123');
    
    // Voter pour d'abord
    await page.click('[data-testid="vote-for"]');
    await expect(page.locator('[data-testid="vote-confirmation"]')).toBeVisible();
    
    // Changer pour voter contre
    await page.click('[data-testid="vote-against"]');
    
    // Vérifier la confirmation du changement
    await expect(page.locator('[data-testid="vote-changed"]')).toBeVisible();
    await expect(page.locator('[data-testid="vote-confirmation"]')).toContainText('contre');
  });

  test('Commentaires sur une proposition', async ({ page }) => {
    await page.goto('/governance/proposal/test-proposal-123');
    
    // Vérifier la section commentaires
    await expect(page.locator('[data-testid="comments-section"]')).toBeVisible();
    
    // Ajouter un commentaire
    await page.fill('[data-testid="comment-input"]', 'Excellente proposition ! Je soutiens cette initiative.');
    await page.click('[data-testid="submit-comment"]');
    
    // Vérifier l'ajout du commentaire
    await expect(page.locator('[data-testid="comment-item"]').last()).toContainText('Excellente proposition');
    
    // Vérifier les informations du commentaire
    const lastComment = page.locator('[data-testid="comment-item"]').last();
    await expect(lastComment.locator('[data-testid="comment-author"]')).toBeVisible();
    await expect(lastComment.locator('[data-testid="comment-date"]')).toBeVisible();
  });

  test('Filtrage des propositions', async ({ page }) => {
    await page.goto('/governance');
    
    // Utiliser le filtre par statut
    await page.selectOption('[data-testid="status-filter"]', 'active');
    
    // Vérifier le filtrage
    await expect(page.locator('[data-testid="proposal-item"]')).toHaveCount(1, { timeout: 5000 });
    
    // Changer le filtre
    await page.selectOption('[data-testid="status-filter"]', 'all');
    
    // Vérifier que plus de propositions apparaissent
    await expect(page.locator('[data-testid="proposal-item"]')).toHaveCount(3, { timeout: 5000 });
  });

  test('Recherche de propositions', async ({ page }) => {
    await page.goto('/governance');
    
    // Utiliser la barre de recherche
    await page.fill('[data-testid="search-proposals"]', 'interface');
    
    // Vérifier les résultats de recherche
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    
    // Vérifier que les résultats contiennent le terme
    const firstResult = page.locator('[data-testid="proposal-item"]').first();
    await expect(firstResult).toContainText('interface', { ignoreCase: true });
  });

  test('Statistiques de gouvernance', async ({ page }) => {
    await page.goto('/governance');
    
    // Vérifier la présence des statistiques
    await expect(page.locator('[data-testid="governance-stats"]')).toBeVisible();
    
    // Vérifier les métriques
    await expect(page.locator('[data-testid="total-proposals"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-proposals"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-votes"]')).toBeVisible();
    await expect(page.locator('[data-testid="participation-rate"]')).toBeVisible();
  });

  test('Historique des votes utilisateur', async ({ page }) => {
    await page.goto('/governance/my-votes');
    
    // Vérifier la page d'historique
    await expect(page.locator('[data-testid="vote-history"]')).toBeVisible();
    
    // Vérifier la présence des votes
    await expect(page.locator('[data-testid="vote-item"]').first()).toBeVisible();
    
    // Vérifier les informations d'un vote
    const firstVote = page.locator('[data-testid="vote-item"]').first();
    await expect(firstVote.locator('[data-testid="vote-proposal"]')).toBeVisible();
    await expect(firstVote.locator('[data-testid="vote-choice"]')).toBeVisible();
    await expect(firstVote.locator('[data-testid="vote-date"]')).toBeVisible();
  });

  test('Notifications de gouvernance', async ({ page }) => {
    await page.goto('/governance');
    
    // Vérifier la présence de notifications
    await expect(page.locator('[data-testid="notifications"]')).toBeVisible();
    
    // Cliquer sur une notification
    await page.click('[data-testid="notification-item"]');
    
    // Vérifier la redirection vers la proposition concernée
    await expect(page).toHaveURL(/.*\/governance\/proposal\/.*/);
  });

  test('Responsive - Gouvernance mobile', async ({ page }) => {
    // Définir la taille mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/governance');
    
    // Vérifier l'adaptation mobile
    await expect(page.locator('[data-testid="governance-header"]')).toBeVisible();
    
    // Vérifier que les propositions s'affichent en liste
    await expect(page.locator('[data-testid="proposals-list"]')).toBeVisible();
    
    // Vérifier l'accessibilité du bouton de création
    await expect(page.locator('[data-testid="create-proposal-button"]')).toBeVisible();
    
    // Vérifier la taille tactile
    const buttonBox = await page.locator('[data-testid="create-proposal-button"]').boundingBox();
    expect(buttonBox?.height).toBeGreaterThan(44);
  });

  test('Accessibilité - Navigation clavier gouvernance', async ({ page }) => {
    await page.goto('/governance');
    
    // Naviguer avec Tab
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="create-proposal-button"]')).toBeFocused();
    
    // Continuer la navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="search-proposals"]')).toBeFocused();
    
    // Utiliser la recherche au clavier
    await page.keyboard.type('test');
    await page.keyboard.press('Enter');
    
    // Vérifier les résultats
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test('Performance - Chargement gouvernance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/governance');
    
    // Vérifier que la page se charge rapidement
    await expect(page.locator('[data-testid="governance-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="proposals-list"]')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Moins de 3 secondes
  });
});
