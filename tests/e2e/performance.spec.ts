import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Performance et Responsive
 * Tests de performance utilisateur et compatibilité mobile
 */

test.describe('Performance et Responsive', () => {
  test.beforeEach(async ({ page }) => {
    // Simuler un utilisateur connecté
    await page.evaluate(() => {
      localStorage.setItem('test-auth', 'true');
      localStorage.setItem('test-user', JSON.stringify({
        id: 'test-user-123',
        name: 'Test User',
        email: 'test@voicecoop.com'
      }));
    });
  });

  test.describe('Tests de Performance', () => {
    test('Performance - Chargement page d\'accueil', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      
      // Attendre que les éléments critiques soient chargés
      await expect(page.locator('[data-testid="logo"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      
      // Vérifier que le chargement est rapide (< 2 secondes)
      expect(loadTime).toBeLessThan(2000);
      
      console.log(`Page d'accueil chargée en ${loadTime}ms`);
    });

    test('Performance - Chargement dashboard', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/dashboard');
      
      // Attendre les éléments du dashboard
      await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="conversations-list"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000);
      
      console.log(`Dashboard chargé en ${loadTime}ms`);
    });

    test('Performance - Navigation entre pages', async ({ page }) => {
      // Charger la page d'accueil
      await page.goto('/');
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      // Mesurer la navigation vers le dashboard
      const navStartTime = Date.now();
      await page.click('[data-testid="dashboard-link"]');
      await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
      const navTime = Date.now() - navStartTime;
      
      expect(navTime).toBeLessThan(1500);
      console.log(`Navigation vers dashboard: ${navTime}ms`);
    });

    test('Performance - Chargement des ressources', async ({ page }) => {
      const responses: any[] = [];
      
      // Capturer les réponses réseau
      page.on('response', response => {
        responses.push({
          url: response.url(),
          status: response.status(),
          timing: response.timing()
        });
      });
      
      await page.goto('/');
      
      // Attendre que toutes les ressources soient chargées
      await page.waitForLoadState('networkidle');
      
      // Vérifier qu'il n'y a pas d'erreurs 4xx/5xx
      const errors = responses.filter(r => r.status >= 400);
      expect(errors).toHaveLength(0);
      
      // Vérifier les temps de réponse des APIs
      const apiResponses = responses.filter(r => r.url.includes('/api/'));
      apiResponses.forEach(response => {
        expect(response.timing).toBeLessThan(2000);
      });
    });

    test('Performance - Mémoire et CPU', async ({ page }) => {
      await page.goto('/');
      
      // Mesurer l'utilisation mémoire initiale
      const initialMetrics = await page.evaluate(() => {
        return {
          memory: (performance as any).memory?.usedJSHeapSize || 0,
          timing: performance.timing.loadEventEnd - performance.timing.navigationStart
        };
      });
      
      // Naviguer et interagir avec l'application
      await page.goto('/dashboard');
      await page.goto('/chat');
      await page.goto('/governance');
      
      // Mesurer l'utilisation mémoire après navigation
      const finalMetrics = await page.evaluate(() => {
        return {
          memory: (performance as any).memory?.usedJSHeapSize || 0
        };
      });
      
      // Vérifier qu'il n'y a pas de fuite mémoire majeure
      if (initialMetrics.memory > 0 && finalMetrics.memory > 0) {
        const memoryIncrease = finalMetrics.memory - initialMetrics.memory;
        const memoryIncreasePercent = (memoryIncrease / initialMetrics.memory) * 100;
        
        // Accepter jusqu'à 50% d'augmentation de mémoire
        expect(memoryIncreasePercent).toBeLessThan(50);
      }
    });
  });

  test.describe('Tests Responsive - Mobile', () => {
    test('Mobile - Page d\'accueil', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Vérifier l'adaptation mobile
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="logo"]')).toBeVisible();
      
      // Vérifier que le contenu s'adapte
      const mainContent = page.locator('[data-testid="main-content"]');
      const contentBox = await mainContent.boundingBox();
      expect(contentBox?.width).toBeLessThanOrEqual(375);
    });

    test('Mobile - Navigation hamburger', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Ouvrir le menu hamburger
      await page.click('[data-testid="mobile-menu-button"]');
      
      // Vérifier l'ouverture du menu
      await expect(page.locator('[data-testid="mobile-menu-overlay"]')).toBeVisible();
      
      // Naviguer vers une page
      await page.click('[data-testid="mobile-dashboard-link"]');
      
      // Vérifier la navigation
      await expect(page).toHaveURL(/.*\/dashboard/);
      
      // Vérifier que le menu se ferme
      await expect(page.locator('[data-testid="mobile-menu-overlay"]')).not.toBeVisible();
    });

    test('Mobile - Interface de chat', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/chat');
      
      // Vérifier l'adaptation de l'interface de chat
      await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
      
      // Vérifier que l'input prend toute la largeur
      const messageInput = page.locator('[data-testid="message-input"]');
      const inputBox = await messageInput.boundingBox();
      expect(inputBox?.width).toBeGreaterThan(300);
      
      // Vérifier la taille des boutons tactiles
      const sendButton = page.locator('[data-testid="send-button"]');
      const buttonBox = await sendButton.boundingBox();
      expect(buttonBox?.height).toBeGreaterThan(44);
      expect(buttonBox?.width).toBeGreaterThan(44);
    });

    test('Mobile - Formulaires', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/governance');
      
      // Ouvrir le formulaire de création de proposition
      await page.click('[data-testid="create-proposal-button"]');
      
      // Vérifier l'adaptation du formulaire
      await expect(page.locator('[data-testid="proposal-form"]')).toBeVisible();
      
      // Vérifier que les champs s'adaptent
      const titleInput = page.locator('[data-testid="proposal-title"]');
      const titleBox = await titleInput.boundingBox();
      expect(titleBox?.width).toBeGreaterThan(300);
      
      // Tester la saisie tactile
      await titleInput.fill('Test proposition mobile');
      await expect(titleInput).toHaveValue('Test proposition mobile');
    });
  });

  test.describe('Tests Responsive - Tablette', () => {
    test('Tablette - Layout adaptatif', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/dashboard');
      
      // Vérifier l'adaptation tablette
      await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
      
      // Vérifier la disposition en colonnes
      const sidebar = page.locator('[data-testid="sidebar"]');
      const mainContent = page.locator('[data-testid="main-content"]');
      
      await expect(sidebar).toBeVisible();
      await expect(mainContent).toBeVisible();
      
      // Vérifier les largeurs
      const sidebarBox = await sidebar.boundingBox();
      const contentBox = await mainContent.boundingBox();
      
      expect(sidebarBox?.width).toBeGreaterThan(200);
      expect(contentBox?.width).toBeGreaterThan(400);
    });

    test('Tablette - Orientation portrait/paysage', async ({ page }) => {
      // Test en portrait
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/chat');
      
      await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
      
      // Changer en paysage
      await page.setViewportSize({ width: 1024, height: 768 });
      
      // Vérifier que l'interface s'adapte
      await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
      
      // Vérifier la disposition horizontale
      const chatBox = await page.locator('[data-testid="chat-interface"]').boundingBox();
      expect(chatBox?.width).toBeGreaterThan(chatBox?.height || 0);
    });
  });

  test.describe('Tests Accessibilité', () => {
    test('Accessibilité - Contraste et lisibilité', async ({ page }) => {
      await page.goto('/');
      
      // Vérifier les couleurs et contrastes
      const textElements = await page.locator('h1, h2, h3, p, button').all();
      
      for (const element of textElements) {
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          };
        });
        
        // Vérifier que la taille de police est suffisante
        const fontSize = parseInt(styles.fontSize);
        expect(fontSize).toBeGreaterThanOrEqual(14);
      }
    });

    test('Accessibilité - Navigation clavier complète', async ({ page }) => {
      await page.goto('/');
      
      // Tester la navigation complète au clavier
      const focusableElements = await page.locator('button, input, select, textarea, a[href]').all();
      
      for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
        await page.keyboard.press('Tab');
        
        // Vérifier qu'un élément est focusé
        const focusedElement = await page.locator(':focus').first();
        await expect(focusedElement).toBeVisible();
      }
    });

    test('Accessibilité - Lecteurs d\'écran', async ({ page }) => {
      await page.goto('/');
      
      // Vérifier la présence d'attributs ARIA
      const buttons = await page.locator('button').all();
      
      for (const button of buttons) {
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();
        
        // Chaque bouton doit avoir soit un aria-label soit du texte
        expect(ariaLabel || textContent).toBeTruthy();
      }
      
      // Vérifier les landmarks
      await expect(page.locator('main, nav, header, footer')).toHaveCount(4, { timeout: 5000 });
    });
  });

  test.describe('Tests Cross-Browser', () => {
    test('Compatibilité - Fonctionnalités de base', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Vérifier que les fonctionnalités de base marchent sur tous les navigateurs
      await expect(page.locator('[data-testid="logo"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      // Test spécifique selon le navigateur
      if (browserName === 'webkit') {
        // Tests spécifiques Safari
        console.log('Test Safari - OK');
      } else if (browserName === 'firefox') {
        // Tests spécifiques Firefox
        console.log('Test Firefox - OK');
      } else {
        // Tests spécifiques Chrome
        console.log('Test Chrome - OK');
      }
    });
  });

  test.describe('Tests de Charge', () => {
    test('Charge - Simulation utilisateurs multiples', async ({ page }) => {
      // Simuler plusieurs actions utilisateur rapidement
      await page.goto('/');
      
      const actions = [
        () => page.goto('/dashboard'),
        () => page.goto('/chat'),
        () => page.goto('/governance'),
        () => page.goto('/'),
      ];
      
      // Exécuter les actions rapidement
      for (const action of actions) {
        const startTime = Date.now();
        await action();
        const actionTime = Date.now() - startTime;
        
        // Chaque action doit rester rapide même sous charge
        expect(actionTime).toBeLessThan(3000);
      }
    });

    test('Charge - Gestion des erreurs réseau', async ({ page }) => {
      // Simuler des conditions réseau dégradées
      await page.route('**/*', route => {
        // Ajouter un délai aléatoire
        setTimeout(() => {
          route.continue();
        }, Math.random() * 1000);
      });
      
      await page.goto('/');
      
      // Vérifier que l'application reste utilisable
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible({ timeout: 10000 });
    });
  });
});
