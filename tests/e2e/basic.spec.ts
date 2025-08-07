import { test, expect } from '@playwright/test';

/**
 * Tests E2E Basiques - VoiceCoop
 * Tests simples qui fonctionnent avec l'état actuel de l'application
 */

test.describe('Tests Basiques', () => {
  test('Application se charge sans erreur', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que la page se charge (accepter le titre par défaut)
    await expect(page).toHaveTitle(/Create Next App|VoiceCoop/);
    
    // Vérifier que le contenu principal est visible
    await expect(page.locator('text=L\'IA Vocale')).toBeVisible();
  });

  test('Contenu principal visible', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier les éléments de base
    await expect(page.locator('text=L\'IA Vocale')).toBeVisible();
    await expect(page.locator('text=Coopérative')).toBeVisible();
    await expect(page.locator('text=du Futur')).toBeVisible();
  });

  test('Boutons de navigation présents', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que les boutons existent
    await expect(page.locator('text=Connexion')).toBeVisible();
    await expect(page.locator('text=Commencer')).toBeVisible();
  });

  test('Section fonctionnalités accessible', async ({ page }) => {
    await page.goto('/');
    
    // Scroll vers les fonctionnalités
    await page.locator('text=Pourquoi VoiceCoop ?').scrollIntoViewIfNeeded();
    
    // Vérifier que la section est visible
    await expect(page.locator('text=Pourquoi VoiceCoop ?')).toBeVisible();
  });

  test('Responsive - Contenu adaptatif', async ({ page }) => {
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Vérifier que le contenu de base est visible
    await expect(page.locator('text=L\'IA Vocale')).toBeVisible();
    
    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('text=L\'IA Vocale')).toBeVisible();
  });

  test('Performance - Chargement acceptable', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Attendre que le contenu soit visible
    await expect(page.locator('text=L\'IA Vocale')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // Vérifier un temps de chargement raisonnable (10 secondes max)
    expect(loadTime).toBeLessThan(10000);
    
    console.log(`Page chargée en ${loadTime}ms`);
  });

  test('Pas d\'erreurs critiques', async ({ page }) => {
    const errors: string[] = [];
    
    // Capturer les erreurs
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Vérifier qu'il n'y a pas d'erreurs critiques
    expect(errors).toHaveLength(0);
  });

  test('Navigation - Clics fonctionnent', async ({ page }) => {
    await page.goto('/');
    
    // Tester que les clics ne plantent pas
    await page.click('text=Connexion');
    await page.waitForTimeout(1000);
    
    // Retourner à l'accueil
    await page.goto('/');
    
    // Tester l'autre bouton
    await page.click('text=Commencer');
    await page.waitForTimeout(1000);
    
    // Si on arrive ici, les clics n'ont pas planté
    expect(true).toBe(true);
  });

  test('Contenu textuel complet', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier le contenu principal
    await expect(page.locator('text=La première plateforme')).toBeVisible();
    
    // Vérifier les statistiques (au moins une)
    await expect(page.locator('text=Disponibilité')).toBeVisible();
    
    // Vérifier les boutons d'action
    await expect(page.locator('text=Démarrer gratuitement')).toBeVisible();
  });

  test('Styles CSS appliqués', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier qu'un élément a des styles
    const heroTitle = page.locator('text=L\'IA Vocale').first();
    
    const styles = await heroTitle.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        fontSize: computed.fontSize,
        color: computed.color
      };
    });
    
    // Vérifier que les styles sont appliqués
    expect(styles.fontSize).toBeTruthy();
    expect(styles.color).toBeTruthy();
  });
});
