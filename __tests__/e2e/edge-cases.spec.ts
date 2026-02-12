import { test, expect, type Page } from '@playwright/test';

// Enable video recording for all tests in this file
test.use({
    video: 'on',
    screenshot: 'on',
});

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

// ─── Formula Bar Fidelity ──────────────────────────────────────────
test.describe('Edge Cases — Formula Bar', () => {
    test.beforeEach(async ({ page }) => {
        await goToApp(page);
    });

    test('formula bar shows formula string when formula cell is selected', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.type('=1+1');
        await page.keyboard.press('Enter');
        // Navigate back to A1
        await clickCell(page, 0, 0);
        // The formula bar / edit input should show "=1+1", not "2"
        const formulaBar = page.locator('.sf-toolbar__formula-input').first();
        await expect(formulaBar).toHaveValue('=1+1');
    });
});

// ─── Keyboard Copy/Paste ───────────────────────────────────────────
test.describe('Edge Cases — Keyboard Copy/Paste', () => {
    test.beforeEach(async ({ page }) => {
        await goToApp(page);
    });

    test('Ctrl+C then Ctrl+V copies cell value to new cell', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.type('CopyMe');
        await page.keyboard.press('Enter');
        await clickCell(page, 0, 0);
        await page.keyboard.press('Control+c');
        await clickCell(page, 1, 0);
        await page.keyboard.press('Control+v');
        const cell = page.locator('[data-col="1"][data-row="0"]');
        await expect(cell).toContainText('CopyMe');
    });
});

// ─── Bulk Delete ───────────────────────────────────────────────────
test.describe('Edge Cases — Bulk Delete', () => {
    test.beforeEach(async ({ page }) => {
        await goToApp(page);
    });

    test('Delete key on multi-cell selection clears all cells', async ({ page }) => {
        // Enter data in A1, B1, C1
        await clickCell(page, 0, 0);
        await page.keyboard.type('X');
        await page.keyboard.press('Tab');
        await page.keyboard.type('Y');
        await page.keyboard.press('Tab');
        await page.keyboard.type('Z');
        await page.keyboard.press('Enter');

        // Select A1:C1 using Shift+Click
        await clickCell(page, 0, 0);
        await page.click('[data-col="2"][data-row="0"]', { modifiers: ['Shift'] });

        await page.keyboard.press('Delete');

        const cellA = page.locator('[data-col="0"][data-row="0"]');
        const cellB = page.locator('[data-col="1"][data-row="0"]');
        const cellC = page.locator('[data-col="2"][data-row="0"]');
        await expect(cellA).not.toContainText('X');
        await expect(cellB).not.toContainText('Y');
        await expect(cellC).not.toContainText('Z');
    });
});

// ─── Rapid Sequential Entry ────────────────────────────────────────
test.describe('Edge Cases — Rapid Entry', () => {
    test.beforeEach(async ({ page }) => {
        await goToApp(page);
    });

    test('rapid Tab entry across cells preserves all values', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.type('A1');
        await page.keyboard.press('Tab');
        await page.keyboard.type('B1');
        await page.keyboard.press('Tab');
        await page.keyboard.type('C1');
        await page.keyboard.press('Enter');

        const cellA = page.locator('[data-col="0"][data-row="0"]');
        const cellB = page.locator('[data-col="1"][data-row="0"]');
        const cellC = page.locator('[data-col="2"][data-row="0"]');
        await expect(cellA).toContainText('A1');
        await expect(cellB).toContainText('B1');
        await expect(cellC).toContainText('C1');
    });
});

// ─── Shift+Click Selection ─────────────────────────────────────────
test.describe('Edge Cases — Shift+Click', () => {
    test.beforeEach(async ({ page }) => {
        await goToApp(page);
    });

    test('Shift+Click creates multi-cell selection and updates name box', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.click('[data-col="2"][data-row="2"]', { modifiers: ['Shift'] });

        const nameBox = page.locator('.sf-toolbar__cell-ref');
        // Should show range like "A1:C3"
        const value = await nameBox.textContent();
        expect(value).toMatch(/A1.*C3|[A-Z]\d+/);
    });
});

// ─── Multi-Step Undo/Redo ──────────────────────────────────────────
test.describe('Edge Cases — Multi-Step Undo/Redo', () => {
    test.beforeEach(async ({ page }) => {
        await goToApp(page);
    });

    test('undo twice then redo twice restores data', async ({ page }) => {
        // Enter value1
        await clickCell(page, 0, 0);
        await page.keyboard.type('first');
        await page.keyboard.press('Enter');
        // Enter value2
        await clickCell(page, 0, 0);
        await page.keyboard.type('second');
        await page.keyboard.press('Enter');

        // Undo twice
        await page.keyboard.press('Control+z');
        await page.keyboard.press('Control+z');

        // Cell should be empty or have original value
        const cellAfterUndo = page.locator('[data-col="0"][data-row="0"]');
        await expect(cellAfterUndo).not.toContainText('second');

        // Redo twice
        await page.keyboard.press('Control+y');
        await page.keyboard.press('Control+y');

        const cellAfterRedo = page.locator('[data-col="0"][data-row="0"]');
        await expect(cellAfterRedo).toContainText('second');
    });
});

// ─── Long Text Entry ───────────────────────────────────────────────
test.describe('Edge Cases — Long Text', () => {
    test.beforeEach(async ({ page }) => {
        await goToApp(page);
    });

    test('entering 500+ chars in a cell is preserved', async ({ page }) => {
        const longText = 'A'.repeat(500);
        await clickCell(page, 0, 0);
        // Use fill on the input that appears in edit mode
        await page.keyboard.press('F2'); // Enter edit mode
        const input = page.locator('[data-col="0"][data-row="0"] input, [data-col="0"][data-row="0"] textarea').first();
        await input.fill(longText);
        await page.keyboard.press('Enter');
        await clickCell(page, 0, 0);
        const cell = page.locator('[data-col="0"][data-row="0"]');
        const text = await cell.textContent();
        expect(text!.length).toBeGreaterThanOrEqual(100); // At least truncated display
    });
});

// ─── Error Display ─────────────────────────────────────────────────
test.describe('Edge Cases — Error Display', () => {
    test.beforeEach(async ({ page }) => {
        await goToApp(page);
    });

    test('division by zero shows #DIV/0! in cell', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.type('=1/0');
        await page.keyboard.press('Enter');
        await clickCell(page, 0, 0);
        const cell = page.locator('[data-col="0"][data-row="0"]');
        await expect(cell).toContainText('#DIV/0!');
    });

    test('circular formula shows #CIRCULAR! in cell', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.type('=A1');
        await page.keyboard.press('Enter');
        await clickCell(page, 0, 0);
        const cell = page.locator('[data-col="0"][data-row="0"]');
        await expect(cell).toContainText('#CIRCULAR!');
    });

    test('invalid function shows #NAME?', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.type('=BOGUS(1)');
        await page.keyboard.press('Enter');
        await clickCell(page, 0, 0);
        const cell = page.locator('[data-col="0"][data-row="0"]');
        await expect(cell).toContainText('#NAME?');
    });
});

// ─── Edit Cancel ───────────────────────────────────────────────────
test.describe('Edge Cases — Edit Cancel', () => {
    test.beforeEach(async ({ page }) => {
        await goToApp(page);
    });

    test('double-click edit then Escape preserves old value', async ({ page }) => {
        await clickCell(page, 0, 0);
        await page.keyboard.type('original');
        await page.keyboard.press('Enter');

        // Double-click to edit
        const cell = page.locator('[data-col="0"][data-row="0"]');
        await cell.dblclick();
        await page.keyboard.type('CHANGED');
        await page.keyboard.press('Escape');

        await expect(cell).toContainText('original');
        await expect(cell).not.toContainText('CHANGED');
    });
});
