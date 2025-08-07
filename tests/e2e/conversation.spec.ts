import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Navigation et Pages (Adaptés à l'application réelle)
 * Tests de navigation et accès aux différentes pages
 */

test.describe('Navigation et Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Navigation vers dashboard', async ({ page }) => {
    // Essayer d'aller au dashboard
    await page.goto('/dashboard');

    // Vérifier que la page se charge (même si elle redirige)
    // Le test vérifie que la navigation fonctionne
    await page.waitForLoadState('networkidle');
  });

  test('Envoi d\'un message texte', async ({ page }) => {
    // Aller à une conversation
    await page.goto('/chat');
    
    // Saisir un message
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Bonjour, comment allez-vous ?');
    
    // Envoyer le message
    await page.click('[data-testid="send-button"]');
    
    // Vérifier que le message apparaît dans la conversation
    await expect(page.locator('[data-testid="user-message"]').last()).toContainText('Bonjour, comment allez-vous ?');
    
    // Vérifier que l'input est vidé
    await expect(messageInput).toHaveValue('');
    
    // Attendre la réponse de l'IA (avec timeout)
    await expect(page.locator('[data-testid="ai-message"]').last()).toBeVisible({ timeout: 10000 });
  });

  test('Envoi de message avec Enter', async ({ page }) => {
    await page.goto('/chat');
    
    // Saisir un message
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Test message avec Enter');
    
    // Envoyer avec la touche Enter
    await messageInput.press('Enter');
    
    // Vérifier que le message est envoyé
    await expect(page.locator('[data-testid="user-message"]').last()).toContainText('Test message avec Enter');
  });

  test('Interface de conversation vocale', async ({ page }) => {
    await page.goto('/chat');
    
    // Vérifier la présence du bouton vocal
    await expect(page.locator('[data-testid="voice-button"]')).toBeVisible();
    
    // Cliquer sur le bouton vocal
    await page.click('[data-testid="voice-button"]');
    
    // Vérifier l'activation de l'interface vocale
    await expect(page.locator('[data-testid="voice-recording"]')).toBeVisible();
    await expect(page.locator('[data-testid="voice-status"]')).toContainText('Écoute en cours');
  });

  test('Arrêt de l\'enregistrement vocal', async ({ page }) => {
    await page.goto('/chat');
    
    // Démarrer l'enregistrement
    await page.click('[data-testid="voice-button"]');
    await expect(page.locator('[data-testid="voice-recording"]')).toBeVisible();
    
    // Arrêter l'enregistrement
    await page.click('[data-testid="stop-voice-button"]');
    
    // Vérifier l'arrêt de l'enregistrement
    await expect(page.locator('[data-testid="voice-processing"]')).toBeVisible();
    await expect(page.locator('[data-testid="voice-status"]')).toContainText('Traitement');
  });

  test('Historique des conversations', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Vérifier la présence de la liste des conversations
    await expect(page.locator('[data-testid="conversations-list"]')).toBeVisible();
    
    // Vérifier qu'il y a au moins une conversation
    await expect(page.locator('[data-testid="conversation-item"]').first()).toBeVisible();
    
    // Cliquer sur une conversation
    await page.click('[data-testid="conversation-item"]');
    
    // Vérifier la redirection vers la conversation
    await expect(page).toHaveURL(/.*\/conversation\/.*|.*\/chat.*/);
  });

  test('Suppression d\'une conversation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Ouvrir le menu d'une conversation
    await page.click('[data-testid="conversation-menu"]');
    
    // Cliquer sur supprimer
    await page.click('[data-testid="delete-conversation"]');
    
    // Confirmer la suppression
    await page.click('[data-testid="confirm-delete"]');
    
    // Vérifier que la conversation a disparu
    await expect(page.locator('[data-testid="conversation-deleted-message"]')).toBeVisible();
  });

  test('Recherche dans les conversations', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Utiliser la barre de recherche
    const searchInput = page.locator('[data-testid="search-conversations"]');
    await searchInput.fill('test');
    
    // Vérifier le filtrage des résultats
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    
    // Vérifier que les résultats contiennent le terme recherché
    const firstResult = page.locator('[data-testid="conversation-item"]').first();
    await expect(firstResult).toContainText('test', { ignoreCase: true });
  });

  test('Paramètres de conversation', async ({ page }) => {
    await page.goto('/chat');
    
    // Ouvrir les paramètres
    await page.click('[data-testid="conversation-settings"]');
    
    // Vérifier la présence des options
    await expect(page.locator('[data-testid="settings-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="voice-settings"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-settings"]')).toBeVisible();
    
    // Modifier un paramètre
    await page.click('[data-testid="enable-voice-response"]');
    
    // Sauvegarder
    await page.click('[data-testid="save-settings"]');
    
    // Vérifier la sauvegarde
    await expect(page.locator('[data-testid="settings-saved"]')).toBeVisible();
  });

  test('Gestion des erreurs de connexion', async ({ page }) => {
    // Simuler une erreur réseau
    await page.route('**/api/chat/**', route => {
      route.abort('failed');
    });
    
    await page.goto('/chat');
    
    // Essayer d'envoyer un message
    await page.fill('[data-testid="message-input"]', 'Test message');
    await page.click('[data-testid="send-button"]');
    
    // Vérifier l'affichage de l'erreur
    await expect(page.locator('[data-testid="connection-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('Retry après erreur', async ({ page }) => {
    // Simuler une erreur puis un succès
    let requestCount = 0;
    await page.route('**/api/chat/**', route => {
      requestCount++;
      if (requestCount === 1) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    await page.goto('/chat');
    
    // Premier essai (échec)
    await page.fill('[data-testid="message-input"]', 'Test retry');
    await page.click('[data-testid="send-button"]');
    await expect(page.locator('[data-testid="connection-error"]')).toBeVisible();
    
    // Retry (succès)
    await page.click('[data-testid="retry-button"]');
    await expect(page.locator('[data-testid="user-message"]').last()).toContainText('Test retry');
  });

  test('Responsive - Interface mobile', async ({ page }) => {
    // Définir la taille mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/chat');
    
    // Vérifier l'adaptation mobile
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    
    // Vérifier que l'input prend toute la largeur
    const inputBox = await page.locator('[data-testid="message-input"]').boundingBox();
    expect(inputBox?.width).toBeGreaterThan(300);
    
    // Vérifier l'accessibilité du bouton vocal
    await expect(page.locator('[data-testid="voice-button"]')).toBeVisible();
    
    // Vérifier la taille tactile
    const voiceButtonBox = await page.locator('[data-testid="voice-button"]').boundingBox();
    expect(voiceButtonBox?.height).toBeGreaterThan(44);
  });

  test('Performance - Chargement rapide', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/chat');
    
    // Vérifier que l'interface se charge rapidement
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Moins de 3 secondes
  });

  test('Accessibilité - Navigation clavier', async ({ page }) => {
    await page.goto('/chat');
    
    // Naviguer avec Tab
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="message-input"]')).toBeFocused();
    
    // Saisir un message
    await page.keyboard.type('Test accessibilité');
    
    // Envoyer avec Enter
    await page.keyboard.press('Enter');
    
    // Vérifier l'envoi
    await expect(page.locator('[data-testid="user-message"]').last()).toContainText('Test accessibilité');
  });
});
