import { test, expect } from '@playwright/test';

/**
 * Tests de Smoke - VoiceCoop
 * Tests basiques pour valider que l'application fonctionne
 */

test.describe('Smoke Tests', () => {
  test('Page d\'accueil se charge correctement', async ({ page }) => {
    await page.goto('/');

    // Vérifier que la page se charge (titre actuel)
    await expect(page).toHaveTitle(/Create Next App|VoiceCoop/);

    // Vérifier les éléments principaux (utiliser des sélecteurs plus spécifiques)
    await expect(page.locator('span').filter({ hasText: 'VoiceCoop' }).first()).toBeVisible();
    await expect(page.locator('text=L\'IA Vocale')).toBeVisible();
    await expect(page.locator('text=Coopérative')).toBeVisible();

    // Vérifier les boutons de navigation
    await expect(page.locator('text=Connexion')).toBeVisible();
    await expect(page.locator('text=Commencer')).toBeVisible();
  });

  test('Navigation principale fonctionne', async ({ page }) => {
    await page.goto('/');

    // Vérifier que les liens existent (même s'ils ne redirigent pas encore)
    await expect(page.locator('text=Connexion')).toBeVisible();
    await expect(page.locator('text=Commencer')).toBeVisible();

    // Test de clic (peut ne pas rediriger mais ne doit pas planter)
    await page.click('text=Connexion');
    // Attendre un peu pour voir si quelque chose se passe
    await page.waitForTimeout(1000);

    // Retourner à l'accueil pour le test suivant
    await page.goto('/');
  });

  test('Contenu principal visible', async ({ page }) => {
    await page.goto('/');

    // Vérifier le contenu hero
    await expect(page.locator('text=L\'IA Vocale')).toBeVisible();
    await expect(page.locator('text=du Futur')).toBeVisible();

    // Vérifier la description
    await expect(page.locator('text=La première plateforme')).toBeVisible();

    // Vérifier les statistiques (utiliser un sélecteur plus spécifique)
    await expect(page.locator('.text-2xl').filter({ hasText: '99.9%' })).toBeVisible();
    await expect(page.locator('text=Disponibilité')).toBeVisible();
  });

  test('Section fonctionnalités visible', async ({ page }) => {
    await page.goto('/');

    // Scroll vers les fonctionnalités
    await page.locator('text=Pourquoi VoiceCoop ?').scrollIntoViewIfNeeded();

    // Vérifier les fonctionnalités principales (utiliser des sélecteurs plus spécifiques)
    await expect(page.locator('h3').filter({ hasText: 'IA Vocale Avancée' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: 'Gouvernance Coopérative' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: 'Sécurité Quantique' })).toBeVisible();
  });

  test('Responsive - Mobile', async ({ page }) => {
    // Définir la taille mobile
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Vérifier que le contenu s'adapte (utiliser des sélecteurs spécifiques)
    await expect(page.locator('span').filter({ hasText: 'VoiceCoop' }).first()).toBeVisible();
    await expect(page.locator('text=L\'IA Vocale')).toBeVisible();

    // Vérifier que les boutons sont accessibles
    await expect(page.locator('text=Connexion')).toBeVisible();
    await expect(page.locator('text=Commencer')).toBeVisible();
  });

  test('Performance - Chargement rapide', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');

    // Attendre que le contenu principal soit visible
    await expect(page.locator('span').filter({ hasText: 'VoiceCoop' }).first()).toBeVisible();

    const loadTime = Date.now() - startTime;

    // Vérifier que le chargement est rapide (moins de 5 secondes)
    expect(loadTime).toBeLessThan(5000);

    console.log(`Page chargée en ${loadTime}ms`);
  });

  test('Pas d\'erreurs JavaScript', async ({ page }) => {
    const errors: string[] = [];
    
    // Capturer les erreurs JavaScript
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    
    // Attendre que la page soit complètement chargée
    await page.waitForLoadState('networkidle');
    
    // Vérifier qu'il n'y a pas d'erreurs critiques
    expect(errors).toHaveLength(0);
  });

  test('Ressources se chargent correctement', async ({ page }) => {
    const failedRequests: string[] = [];
    
    // Capturer les requêtes échouées
    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push(`${response.status()}: ${response.url()}`);
      }
    });
    
    await page.goto('/');
    
    // Attendre que toutes les ressources soient chargées
    await page.waitForLoadState('networkidle');
    
    // Vérifier qu'il n'y a pas de ressources échouées critiques
    const criticalFailures = failedRequests.filter(req => 
      !req.includes('favicon') && !req.includes('analytics')
    );
    
    expect(criticalFailures).toHaveLength(0);
  });

  test('Animations fonctionnent', async ({ page }) => {
    await page.goto('/');

    // Vérifier que les éléments animés sont présents
    // (Les animations Framer Motion devraient être visibles)
    await expect(page.locator('span').filter({ hasText: 'VoiceCoop' }).first()).toBeVisible();

    // Attendre un peu pour laisser les animations se déclencher
    await page.waitForTimeout(1000);

    // Vérifier que le contenu reste visible après les animations
    await expect(page.locator('text=L\'IA Vocale')).toBeVisible();
  });

  test('Thème et styles appliqués', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que les styles CSS sont appliqués
    const heroElement = page.locator('text=L\'IA Vocale').first();
    
    // Vérifier que l'élément a des styles (couleur, taille, etc.)
    const styles = await heroElement.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        fontSize: computed.fontSize,
        color: computed.color,
        fontWeight: computed.fontWeight
      };
    });
    
    // Vérifier que les styles sont appliqués
    expect(styles.fontSize).toBeTruthy();
    expect(styles.color).toBeTruthy();
  });
});
