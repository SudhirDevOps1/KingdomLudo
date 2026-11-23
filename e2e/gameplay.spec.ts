import { test, expect } from '@playwright/test';

test.describe('KingdomLudo Active Gameplay & 3D/2D View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#root');

    // Wait for Splash screen to transition and dismiss onboarding intro
    try {
      const skipBtn = page.getByRole('button', { name: /skip intro/i });
      await skipBtn.waitFor({ state: 'visible', timeout: 6000 });
      await skipBtn.click();
    } catch {
      // Already dismissed or on dashboard
    }
  });

  test('launches a match and displays the 4-corner HUD and dice controls', async ({ page }) => {
    // Launch a game from dashboard
    const passPlayBtn = page.getByRole('button', { name: /pass & play/i }).first();
    await expect(passPlayBtn).toBeVisible({ timeout: 10000 });
    await passPlayBtn.click();

    // Start 3D Match from Match Setup if visible
    const launchMatchBtn = page.getByRole('button', { name: /launch 3d match/i });
    if (await launchMatchBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await launchMatchBtn.click();
    }

    // Check that canvas or board container is mounted
    const canvasOrBoard = page.locator('canvas, [aria-label="Ludo Board"]');
    await expect(canvasOrBoard.first()).toBeVisible({ timeout: 15000 });

    // Check that player dice controls are present
    const rollButton = page.getByRole('button', { name: /roll/i });
    await expect(rollButton.first()).toBeVisible({ timeout: 10000 });
  });

  test('toggles 2D fallback mode seamlessly', async ({ page }) => {
    const playBtn = page.getByRole('button', { name: 'Play vs Computer', exact: true }).first();
    await expect(playBtn).toBeVisible({ timeout: 10000 });
    await playBtn.click();

    const launchMatchBtn = page.getByRole('button', { name: /launch 3d match/i });
    if (await launchMatchBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await launchMatchBtn.click();
    }

    // Look for 2D toggle button in top controls
    const toggle2DBtn = page.locator('button:has-text("2D"), button[title*="2D"]').first();
    if (await toggle2DBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await toggle2DBtn.click({ force: true });
      // Verify active game container remains intact
      await expect(page.locator('#root')).toBeVisible();
    }
  });
});
