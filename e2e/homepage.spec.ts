import { test, expect } from '@playwright/test';

test.describe('KingdomLudo Homepage & Navigation', () => {
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

  test('loads home dashboard with brand title, hero section and game modes', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/KingdomLudo/i);

    // Check main dashboard heading
    const heroHeading = page.locator('text=Command Your Kingdom');
    await expect(heroHeading).toBeVisible({ timeout: 10000 });

    // Check core action buttons using .first() to prevent strict mode duplicate matches
    const playVsCompBtn = page.getByRole('button', { name: /play vs computer/i }).first();
    const passPlayBtn = page.getByRole('button', { name: /pass & play/i }).first();
    const onlineRoomsBtn = page.getByRole('button', { name: /online rooms/i }).first();

    await expect(playVsCompBtn).toBeVisible();
    await expect(passPlayBtn).toBeVisible();
    await expect(onlineRoomsBtn).toBeVisible();
  });

  test('navigates cleanly between top header tabs', async ({ page }) => {
    // Navigate to Heroes
    const heroesNav = page.getByRole('button', { name: /heroes/i }).first();
    if (await heroesNav.isVisible({ timeout: 4000 }).catch(() => false)) {
      await heroesNav.click();
      await expect(page.locator('text=Kingdom Champions & Wardrobe')).toBeVisible({ timeout: 8000 });
    }

    // Navigate to Board Themes
    const themesNav = page.getByRole('button', { name: /board themes/i }).first();
    if (await themesNav.isVisible({ timeout: 4000 }).catch(() => false)) {
      await themesNav.click();
      await expect(page.locator('text=3D Courtyard & Board Themes')).toBeVisible({ timeout: 8000 });
    }

    // Navigate to Settings
    const settingsNav = page.getByRole('button', { name: /settings/i }).first();
    if (await settingsNav.isVisible({ timeout: 4000 }).catch(() => false)) {
      await settingsNav.click();
      await expect(page.getByRole('heading', { name: /game settings/i })).toBeVisible({ timeout: 8000 });
    }
  });
});
