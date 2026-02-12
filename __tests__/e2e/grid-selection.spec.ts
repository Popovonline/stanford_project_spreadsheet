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
    const selector = `[data-col="${col}"][data-row="${row}"]`;
    await page.click(selector);
}

async function doubleClickCell(page: Page, col: number, row: number) {
    const selector = `[data-col="${col}"][data-row="${row}"]`;
    await page.dblclick(selector);
}

async function typeInCell(page: Page, text: string) {
    await page.keyboard.type(text);
}

// ─── Cell Selection ────────────────────────────────────────────────
test.describe('Grid — Cell Selection', () => {
    test.beforeEach(async ({ page }) => {
        await goToApp(page);
    });

    test('click cell selects it with active border', async ({ page }) => {
        await clickCell(page, 0, 0);
        const cell = page.locator('[data-col="0"][data-row="0"]');
        await expect(cell).toHaveClass(/active|selected/i);
    });

    test('click cell updates name box to "A1"', async ({ page }) => {
        await clickCell(page, 0, 0);
        const nameBox = page.locator('.sf-toolbar__cell-ref');
        await expect(nameBox).toHaveText('A1');
    });

    test('click different cell updates active cell', async ({ page }) => {
        await clickCell(page, 2, 3);
        const nameBox = page.locator('.sf-toolbar__cell-ref');
        await expect(nameBox).toHaveText('C4');
    });

    test('arrow key down moves selection', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.press('ArrowDown');
        const nameBox = page.locator('.sf-toolbar__cell-ref');
        await expect(nameBox).toHaveText('A2');
    });

    test('arrow key right moves selection', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.press('ArrowRight');
        const nameBox = page.locator('.sf-toolbar__cell-ref');
        await expect(nameBox).toHaveText('B1');
    });

    test('arrow key up at row 0 stays', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.press('ArrowUp');
        const nameBox = page.locator('.sf-toolbar__cell-ref');
        await expect(nameBox).toHaveText('A1');
    });

    test('arrow key left at col 0 stays', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.press('ArrowLeft');
        const nameBox = page.locator('.sf-toolbar__cell-ref');
        await expect(nameBox).toHaveText('A1');
    });
});

// ─── Cell Editing ────────────────────────────────────────────────
test.describe('Grid — Cell Editing', () => {
    test.beforeEach(async ({ page }) => {
        await goToApp(page);
    });

    test('double-click enters edit mode', async ({ page }) => {
        await doubleClickCell(page, 0, 0);
        const input = page.locator('[data-col="0"][data-row="0"] input, [data-col="0"][data-row="0"] textarea');
        await expect(input).toBeVisible();
    });

    test('type directly into cell shows text', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.type('Hello');
        await page.keyboard.press('Enter');
        const cell = page.locator('[data-col="0"][data-row="0"]');
        await expect(cell).toContainText('Hello');
    });

    test('Enter commits and moves down', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.type('test');
        await page.keyboard.press('Enter');
        const nameBox = page.locator('.sf-toolbar__cell-ref');
        await expect(nameBox).toHaveText('A2');
    });

    test('Escape cancels edit', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.type('test');
        await page.keyboard.press('Enter');
        // Now A1 has "test", go back and try to edit then cancel
        await clickCell(page, 0, 0);
        await page.keyboard.press('F2');
        await page.keyboard.type(' modified');
        await page.keyboard.press('Escape');
        const cell = page.locator('[data-col="0"][data-row="0"]');
        await expect(cell).toContainText('test');
    });

    test('Tab commits and moves right', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.type('data');
        await page.keyboard.press('Tab');
        const nameBox = page.locator('.sf-toolbar__cell-ref');
        await expect(nameBox).toHaveText('B1');
    });

    test('Delete key clears cell content', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.type('data');
        await page.keyboard.press('Enter');
        await clickCell(page, 0, 0);
        await page.keyboard.press('Delete');
        const cell = page.locator('[data-col="0"][data-row="0"]');
        await expect(cell).not.toContainText('data');
    });
});

// ─── Formulas ────────────────────────────────────────────────────
test.describe('Grid — Formulas', () => {
    test.beforeEach(async ({ page }) => {
        await goToApp(page);
    });

    test('enter =1+1, see "2"', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.type('=1+1');
        await page.keyboard.press('Enter');
        await clickCell(page, 0, 0);
        const cell = page.locator('[data-col="0"][data-row="0"]');
        await expect(cell).toContainText('2');
    });

    test('formula with cell references', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.type('10');
        await page.keyboard.press('Enter');
        await clickCell(page, 0, 1);
        await page.keyboard.type('20');
        await page.keyboard.press('Enter');
        await clickCell(page, 0, 2);
        await page.keyboard.type('=A1+A2');
        await page.keyboard.press('Enter');
        await clickCell(page, 0, 2);
        const cell = page.locator('[data-col="0"][data-row="2"]');
        await expect(cell).toContainText('30');
    });

    test('SUM formula', async ({ page }) => {
        for (let i = 0; i < 3; i++) {
            await clickCell(page, 0, i);
            await page.keyboard.type(String((i + 1) * 10));
            await page.keyboard.press('Enter');
        }
        await clickCell(page, 0, 3);
        await page.keyboard.type('=SUM(A1:A3)');
        await page.keyboard.press('Enter');
        await clickCell(page, 0, 3);
        const cell = page.locator('[data-col="0"][data-row="3"]');
        await expect(cell).toContainText('60');
    });

    test('change referenced cell updates dependent', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.type('5');
        await page.keyboard.press('Enter');
        await clickCell(page, 0, 1);
        await page.keyboard.type('=A1*2');
        await page.keyboard.press('Enter');
        // Now update A1
        await clickCell(page, 0, 0);
        await page.keyboard.type('10');
        await page.keyboard.press('Enter');
        await clickCell(page, 0, 1);
        const cell = page.locator('[data-col="0"][data-row="1"]');
        await expect(cell).toContainText('20');
    });

    test('invalid function shows error', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.type('=INVALID()');
        await page.keyboard.press('Enter');
        const cell = page.locator('[data-col="0"][data-row="0"]');
        await expect(cell).toContainText('#');
    });
});
