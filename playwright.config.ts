import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour VoiceCoop
 * Tests E2E complets avec support multi-navigateurs
 */
export default defineConfig({
  // Répertoire des tests
  testDir: './tests/e2e',
  
  // Timeout global pour les tests
  timeout: 30000,
  
  // Timeout pour les assertions
  expect: {
    timeout: 5000,
  },
  
  // Configuration des tests
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Configuration des rapports
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],
  
  // Configuration globale
  use: {
    // URL de base de l'application
    baseURL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    
    // Capture d'écran en cas d'échec
    screenshot: 'only-on-failure',
    
    // Enregistrement vidéo en cas d'échec
    video: 'retain-on-failure',
    
    // Trace en cas d'échec
    trace: 'on-first-retry',
    
    // Headers par défaut
    extraHTTPHeaders: {
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    },
  },

  // Configuration des projets (navigateurs)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Tests mobiles
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Serveur de développement
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
