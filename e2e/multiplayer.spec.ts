import { test, expect } from '@playwright/test';

test.describe('KingdomLudo Online Multiplayer View', () => {
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

  test('opens online multiplayer lobby and validates room controls', async ({ page }) => {
    const onlineRoomsBtn = page.getByRole('button', { name: /online rooms/i }).first();
    await expect(onlineRoomsBtn).toBeVisible({ timeout: 10000 });
    await onlineRoomsBtn.click();

    // Check heading for Online Multiplayer
    await expect(page.locator('text=Online Multiplayer Rooms & Matchmaking')).toBeVisible({ timeout: 10000 });

    // Check Create Private Room, Join Private Room, and Matchmaking sections
    await expect(page.locator('text=Create Private Room')).toBeVisible();
    await expect(page.locator('text=Join Private Room')).toBeVisible();
    await expect(page.locator('text=Public Matchmaking')).toBeVisible();

    // Check Host Private Room button
    const hostBtn = page.getByRole('button', { name: /host private room/i });
    await expect(hostBtn).toBeVisible();
  });
});
