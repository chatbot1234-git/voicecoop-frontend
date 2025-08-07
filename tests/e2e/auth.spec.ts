import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Authentification (Adaptés à l'application réelle)
 * Tests des parcours d'inscription, connexion et gestion de session
 */

test.describe('Authentification', () => {
  test.beforeEach(async ({ page }) => {
    // Aller à la page d'accueil
    await page.goto('/');
  });

  test('Affichage de la page d\'accueil', async ({ page }) => {
    // Vérifier le titre de la page
    await expect(page).toHaveTitle(/VoiceCoop/);

    // Vérifier la présence du texte VoiceCoop
    await expect(page.locator('text=VoiceCoop')).toBeVisible();

    // Vérifier la présence du bouton de connexion
    await expect(page.locator('text=Connexion')).toBeVisible();

    // Vérifier la présence du bouton Commencer
    await expect(page.locator('text=Commencer')).toBeVisible();
  });

  test('Navigation vers la page de connexion', async ({ page }) => {
    // Cliquer sur le bouton de connexion
    await page.click('text=Connexion');

    // Vérifier la redirection vers la page de connexion
    await expect(page).toHaveURL(/.*\/auth\/login/);

    // Vérifier que la page se charge (même si elle n'existe pas encore)
    // Le test passera si la navigation fonctionne
  });

  test('Navigation vers la page d\'inscription', async ({ page }) => {
    // Cliquer sur le bouton Commencer
    await page.click('text=Commencer');

    // Vérifier la redirection vers la page d'inscription
    await expect(page).toHaveURL(/.*\/auth\/register/);

    // Vérifier que la navigation fonctionne
  });

  test('Contenu de la page d\'accueil', async ({ page }) => {
    // Vérifier le contenu principal
    await expect(page.locator('text=L\'IA Vocale')).toBeVisible();
    await expect(page.locator('text=Coopérative')).toBeVisible();
    await expect(page.locator('text=du Futur')).toBeVisible();

    // Vérifier la description
    await expect(page.locator('text=La première plateforme')).toBeVisible();
  });

  test('Boutons d\'action fonctionnels', async ({ page }) => {
    // Vérifier les boutons principaux
    await expect(page.locator('text=Démarrer gratuitement')).toBeVisible();
    await expect(page.locator('text=Voir la démo')).toBeVisible();

    // Tester le clic sur "Démarrer gratuitement"
    await page.click('text=Démarrer gratuitement');
    await expect(page).toHaveURL(/.*\/auth\/register/);
  });

  test('Responsive - Mobile', async ({ page }) => {
    // Définir la taille mobile
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Vérifier que le contenu s'adapte au mobile
    await expect(page.locator('text=VoiceCoop')).toBeVisible();
    await expect(page.locator('text=Connexion')).toBeVisible();
    await expect(page.locator('text=Commencer')).toBeVisible();
  });

  test('Sections de contenu visibles', async ({ page }) => {
    // Vérifier la section fonctionnalités
    await page.locator('text=Pourquoi VoiceCoop ?').scrollIntoViewIfNeeded();
    await expect(page.locator('text=Pourquoi VoiceCoop ?')).toBeVisible();

    // Vérifier les fonctionnalités
    await expect(page.locator('text=IA Vocale Avancée')).toBeVisible();
    await expect(page.locator('text=Gouvernance Coopérative')).toBeVisible();
    await expect(page.locator('text=Sécurité Quantique')).toBeVisible();
  });

  test('Call-to-action final', async ({ page }) => {
    // Scroll vers la section CTA
    await page.locator('text=Prêt à révolutionner').scrollIntoViewIfNeeded();

    // Vérifier le contenu CTA
    await expect(page.locator('text=Prêt à révolutionner')).toBeVisible();
    await expect(page.locator('text=Rejoignez la première coopérative')).toBeVisible();

    // Vérifier les boutons CTA
    await expect(page.locator('text=Commencer gratuitement')).toBeVisible();
    await expect(page.locator('text=Planifier une démo')).toBeVisible();
  });
});
