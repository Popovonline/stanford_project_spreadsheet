import { test, expect, type Page } from '@playwright/test';

async function goToApp(page: Page) {
    // Dismiss onboarding overlay so it doesn't block interactions
    await page.addInitScript(() => {
        localStorage.setItem('onboarding_completed', 'true');
    });
    await page.goto('/');
    await page.waitForSelector('[data-testid="spreadsheet-grid"], .grid-table, table', { timeout: 10000 });
    // Hide Next.js dev overlay that can intercept pointer events on bottom elements
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
}

async function clickCell(page: Page, col: number, row: number) {
    await page.click(`[data-col="${col}"][data-row="${row}"]`);
}

// ─── Sheet Tabs ────────────────────────────────────────────────────
test.describe('Sheet Tabs', () => {
    test.beforeEach(async ({ page }) => {
        await goToApp(page);
    });

    test('add new sheet tab', async ({ page }) => {
        const addBtn = page.locator('button[aria-label="Add sheet"]');
        await addBtn.click();
        const tabs = page.locator('.sf-sheet-tab');
        await expect(tabs).toHaveCount(2);
    });

    test('new sheet gets incremented name "Sheet2"', async ({ page }) => {
        const addBtn = page.locator('button[aria-label="Add sheet"]');
        await addBtn.click();
        await expect(page.locator('text=Sheet2')).toBeVisible();
    });

    test('switch between sheets preserves data', async ({ page }) => {
        // Enter data in Sheet1
        await clickCell(page, 0, 0);
        await page.keyboard.type('Sheet1Data');
        await page.keyboard.press('Enter');

        // Add Sheet2
        const addBtn = page.locator('button[aria-label="Add sheet"]');
        await addBtn.click();

        // Switch back to Sheet1
        await page.locator('.sf-sheet-tab__name', { hasText: 'Sheet1' }).click({ force: true });
        const cell = page.locator('[data-col="0"][data-row="0"]');
        await expect(cell).toContainText('Sheet1Data');
    });

    test('data isolation between sheets', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.type('OnlyInSheet1');
        await page.keyboard.press('Enter');

        const addBtn = page.locator('button[aria-label="Add sheet"]');
        await addBtn.click();

        const cell = page.locator('[data-col="0"][data-row="0"]');
        await expect(cell).not.toContainText('OnlyInSheet1');
    });

    test('rename sheet via double-click', async ({ page }) => {
        const tab = page.locator('.sf-sheet-tab').first();
        await tab.dblclick({ force: true });
        await page.keyboard.press('Control+a');
        await page.keyboard.type('My Sheet');
        await page.keyboard.press('Enter');
        await expect(page.locator('text=My Sheet')).toBeVisible();
    });
});

// ─── Find & Replace ────────────────────────────────────────────────
test.describe('Find & Replace', () => {
    test.beforeEach(async ({ page }) => {
        await goToApp(page);
        // Enter some data
        await clickCell(page, 0, 0);
        await page.keyboard.type('apple');
        await page.keyboard.press('Enter');
        await clickCell(page, 1, 0);
        await page.keyboard.type('banana');
        await page.keyboard.press('Enter');
        await clickCell(page, 0, 1);
        await page.keyboard.type('apple pie');
        await page.keyboard.press('Enter');
    });

    test('Ctrl+F opens find dialog', async ({ page }) => {
        await page.keyboard.press('Control+f');
        const dialog = page.locator('#find-input');
        await expect(dialog).toBeVisible();
    });

    test('search finds matching cells', async ({ page }) => {
        await page.keyboard.press('Control+f');
        const searchInput = page.locator('#find-input');
        await searchInput.fill('apple');
        // Should show match count
        await expect(page.locator('text=/\\d+.*of.*\\d+|\\d+ match/')).toBeVisible({ timeout: 3000 });
    });

    test('replace current replaces one match', async ({ page }) => {
        await page.keyboard.press('Control+f');
        const searchInput = page.locator('#find-input');
        await searchInput.fill('banana');
        const replaceInput = page.locator('#replace-input');
        await replaceInput.fill('orange');
        const replaceBtn = page.locator('button:has-text("Replace")').first();
        await replaceBtn.click();
        const cell = page.locator('[data-col="1"][data-row="0"]');
        await expect(cell).toContainText('orange');
    });
});

// ─── Formatting ────────────────────────────────────────────────────
test.describe('Formatting', () => {
    test.beforeEach(async ({ page }) => {
        await goToApp(page);
    });

    test('bold button toggles bold', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.type('Bold text');
        await page.keyboard.press('Enter');
        await clickCell(page, 0, 0);
        const boldBtn = page.locator('button[aria-label="Bold (Ctrl+B)"]');
        await boldBtn.click();
        const cell = page.locator('[data-col="0"][data-row="0"]');
        const fontWeight = await cell.evaluate(el => {
            const span = el.querySelector('span, div') || el;
            return window.getComputedStyle(span).fontWeight;
        });
        expect(parseInt(fontWeight)).toBeGreaterThanOrEqual(700);
    });

    test('undo reverts formatting', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.type('test');
        await page.keyboard.press('Enter');
        await clickCell(page, 0, 0);
        // Apply bold using keyboard shortcut (keeps focus on grid)
        await page.keyboard.press('Control+b');
        // Verify bold was applied
        const cell = page.locator('[data-col="0"][data-row="0"]');
        const boldWeight = await cell.evaluate(el => {
            const span = el.querySelector('span, div') || el;
            return window.getComputedStyle(span).fontWeight;
        });
        expect(parseInt(boldWeight)).toBeGreaterThanOrEqual(700);
        // Undo
        await page.keyboard.press('Control+z');
        const fontWeight = await cell.evaluate(el => {
            const span = el.querySelector('span, div') || el;
            return window.getComputedStyle(span).fontWeight;
        });
        expect(parseInt(fontWeight)).toBeLessThan(700);
    });
});

// ─── Toolbar ────────────────────────────────────────────────────
test.describe('Toolbar', () => {
    test.beforeEach(async ({ page }) => {
        await goToApp(page);
    });

    test('Ctrl+Z triggers undo', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.type('test');
        await page.keyboard.press('Enter');
        await page.keyboard.press('Control+z');
        const cell = page.locator('[data-col="0"][data-row="0"]');
        await expect(cell).not.toContainText('test');
    });

    test('Ctrl+Z then Ctrl+Y triggers redo', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.type('test');
        await page.keyboard.press('Enter');
        await page.keyboard.press('Control+z');
        await page.keyboard.press('Control+y');
        const cell = page.locator('[data-col="0"][data-row="0"]');
        await expect(cell).toContainText('test');
    });

    test('dark mode toggle switches theme', async ({ page }) => {
        const themeBtn = page.locator('button[aria-label="Toggle dark mode"]');
        const htmlBefore = await page.locator('html').getAttribute('class');
        await themeBtn.first().click();
        const htmlAfter = await page.locator('html').getAttribute('class');
        expect(htmlBefore).not.toBe(htmlAfter);
    });
});

// ─── Status Bar ────────────────────────────────────────────────────
test.describe('Status Bar', () => {
    test.beforeEach(async ({ page }) => {
        await goToApp(page);
    });

    test('select numeric cells shows Sum & Average', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.type('10');
        await page.keyboard.press('Tab');
        await page.keyboard.type('20');
        await page.keyboard.press('Tab');
        await page.keyboard.type('30');
        await page.keyboard.press('Enter');

        // Select A1:C1 using Shift+Click
        await clickCell(page, 0, 0);
        await page.click('[data-col="2"][data-row="0"]', { modifiers: ['Shift'] });

        const statusBar = page.locator('.sf-status-bar');
        await expect(statusBar).toContainText(/Sum|SUM/i);
        await expect(statusBar).toContainText('60');
    });
});
