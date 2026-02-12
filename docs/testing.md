# SheetForge — Auto-Test Documentation

> **Living document.** Update this file whenever you add, modify, or remove tests.
> Last updated: 2026-02-12

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [NPM Scripts](#npm-scripts)
5. [Unit Tests (Vitest)](#unit-tests-vitest)
6. [E2E Tests (Playwright)](#e2e-tests-playwright)
7. [Test Coverage Map](#test-coverage-map)
8. [Mandatory Checklist — Adding a New Feature](#mandatory-checklist--adding-a-new-feature)
9. [Writing Good Tests — Conventions](#writing-good-tests--conventions)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# Run all unit tests once
npm test

# Run unit tests in watch mode (re-run on save)
npm run test:watch

# Run unit tests with coverage report
npm run test:coverage

# Run E2E tests (starts dev server automatically)
npm run test:e2e

# Run everything — unit + E2E
npm run test:all
```

---

## Technology Stack

| Layer | Tool | Version | Purpose |
|-------|------|---------|---------|
| **Unit tests** | [Vitest](https://vitest.dev/) | ^3.2.4 | Fast, Vite-native test runner |
| **DOM environment** | jsdom | ^25.0.0 | Simulates browser DOM for unit tests |
| **Assertions** | `@testing-library/jest-dom` | ^6.6.0 | Extra DOM matchers (`toBeVisible`, `toHaveText`, …) |
| **React testing** | `@testing-library/react` | ^16.0.0 | React component rendering/queries |
| **E2E tests** | [Playwright](https://playwright.dev/) | ^1.50.0 | Real browser automation (Chromium) |
| **Coverage** | Vitest v8 provider | built-in | Code coverage reporting |

---

## Project Structure

```
__tests__/
├── setup.ts                                # Global test setup (localStorage mock, jest-dom)
├── unit/                                   # 11 unit test files
│   ├── helpers.test.ts                     # Utility functions (colIndexToLetter, cellKey, etc.)
│   ├── helpers-edge.test.ts                # Edge cases for utility functions
│   ├── helpers-comprehensive.test.ts       # Extended utility function coverage
│   ├── reducer.test.ts                     # Spreadsheet reducer — all core actions
│   ├── reducer-edge.test.ts                # Reducer edge cases (SET_CELL_VALUE, COPY/PASTE, etc.)
│   ├── reducer-comprehensive.test.ts       # Extended reducer action coverage
│   ├── reducer-stage4-6.test.ts            # Stage 4–6 features (insert/delete, sort, fill, merge, etc.)
│   ├── formula-engine.test.ts              # Formula engine — arithmetic, refs, functions, errors
│   ├── formula-engine-edge.test.ts         # Formula edge cases (nesting, floats, chained, etc.)
│   ├── formula-engine-comprehensive.test.ts # Full formula coverage: all functions & operators
│   └── formula-engine-stage5.test.ts       # Stage 5 formulas (IF, VLOOKUP, COUNTIF, SUMIF, etc.)
└── e2e/                                    # 4 E2E test files
    ├── grid-selection.spec.ts              # Cell selection, editing, navigation, formulas
    ├── features.spec.ts                    # Sheet tabs, find/replace, formatting, toolbar, status bar
    ├── edge-cases.spec.ts                  # Copy/paste, bulk delete, undo/redo, long text, errors
    └── comprehensive.spec.ts              # Full feature E2E across all stages
```

### Configuration Files

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Vitest config: jsdom env, globals, setup file, coverage targets |
| `playwright.config.ts` | Playwright config: Chromium, baseURL `localhost:3000`, web server |
| `__tests__/setup.ts` | Mocks `localStorage` for jsdom; imports `@testing-library/jest-dom` |

---

## NPM Scripts

| Script | Command | What It Does |
|--------|---------|--------------|
| `npm test` | `vitest run` | Run all unit tests once |
| `npm run test:watch` | `vitest` | Run unit tests in watch mode |
| `npm run test:coverage` | `vitest run --coverage` | Unit tests + v8 coverage report |
| `npm run test:e2e` | `npx playwright test` | Run E2E tests (auto-starts dev server) |
| `npm run test:all` | `vitest run && npx playwright test` | Full suite: unit + E2E |

---

## Unit Tests (Vitest)

### Source Modules Under Test

Unit tests cover three core modules:

| Module | File | Functions Tested |
|--------|------|------------------|
| **Helpers** | `types/spreadsheet.ts` | `colIndexToLetter`, `letterToColIndex`, `cellKey`, `getCellDisplayValue`, `cellRefString`, `isCellError`, `normalizeSelection`, `isCellInSelection` |
| **Reducer** | `state/spreadsheet-context.tsx` | `spreadsheetReducer`, `createInitialState`, `determineCellDataType`, `parseCSV`, `parseTSV` |
| **Formula Engine** | `lib/formula-engine.ts` | `evaluateFormula`, `adjustFormulaReferences`, `parseCellRef`, `cellRefToString`, `shiftCellRef`, `isFormulaError`, `formulaTooltip`, `extractReferences` |

### Test File Details

#### `helpers.test.ts` — Utility Functions (9 describe blocks, ~40 tests)

| Describe Block | What It Covers |
|----------------|----------------|
| `colIndexToLetter` | A=0, Z=25, middle letters |
| `letterToColIndex` | Reverse mapping, case-insensitive |
| `cellKey` | String key generation (`"col,row"`) |
| `getCellDisplayValue` | Undefined cell, displayValue, raw value, null |
| `cellRefString` | Coordinate → `"A1"` style reference |
| `isCellError` | `#DIV/0!`, `#ERROR!`, `#NAME?`, non-errors |
| `normalizeSelection` | Already-normalized, reversed, single-cell |
| `isCellInSelection` | Inside, outside, boundary, reversed |

#### `helpers-edge.test.ts` — Edge Cases (~25 tests)

Covers: non-letter input to `letterToColIndex`, falsy-but-valid values (`0`, empty string), negative coordinates, large coordinate values, single-cell and large-range selections.

#### `reducer.test.ts` — Core State Actions (56 outline items, ~180 tests)

| Describe Block | Actions Tested |
|----------------|----------------|
| `SELECT_CELL` | Basic select, boundary clamp, edit commit on select, formula reference click |
| `START_EDITING` | Empty cell, pre-filled cell, formula cell |
| `UPDATE_EDIT_BUFFER` | Buffer updates, mode check |
| `COMMIT_EDIT` | Plain text, number, date, currency, formula, empty clears cell |
| `CANCEL_EDITING` | Restore original, return to VIEWING |
| `NAVIGATE` | Arrow keys: up/down/left/right, boundary clamping, commit on navigate |
| `TAB_NAVIGATE` | Tab forward, Shift+Tab backward |
| `SET_FORMAT` | Bold toggle, font color, background color, alignment |
| `RESIZE_COLUMN` / `RESIZE_ROW` | Width/height enforcement, min constraints |
| `UNDO` / `REDO` | Single undo, multi-step, stack management |
| `COPY` / `PASTE` | Single cell, multi-cell range, formula adjustment, external paste |
| `ADD_SHEET` / `DELETE_SHEET` / `RENAME_SHEET` / `SWITCH_SHEET` | Sheet management |
| `IMPORT_CSV` | CSV parsing and cell population |
| `FIND_*` / `REPLACE_*` | Search, next/prev navigation, replace one, replace all |
| `ADD_CONDITIONAL_RULE` / `DELETE_CONDITIONAL_RULE` | Rule CRUD |
| `TOGGLE_FREEZE_ROW` | Row freezing toggle |

#### `reducer-edge.test.ts` — Reducer Edge Cases (~50 tests)

| Describe Block | What It Covers |
|----------------|----------------|
| `SET_CELL_VALUE` | Direct value set (bypassing edit flow) |
| `SET_SAVE_STATUS` | Save status transitions |
| `COMMIT_EDIT formula corners` | Circular formula, whitespace-only, padded numbers |
| `COPY/PASTE corners` | Paste at grid boundary, absolute ref preservation, external text paste |
| `Find & Replace corners` | Replace-all count, regex special chars, case sensitivity |
| `UNDO edge cases` | Undo on empty stack, max stack overflow |
| `determineCellDataType` | Numbers, dates, currency, percentage, text, empty |

#### `formula-engine.test.ts` — Core Formula Logic (~45 tests)

| Describe Block | What It Covers |
|----------------|----------------|
| `Arithmetic` | `+`, `-`, `*`, `/`, parentheses, unary minus, complex expressions |
| `Cell References` | `=A1`, `=A1+B1`, computed values |
| `Functions` | `SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT` with ranges |
| `Error Handling` | Division by zero, unknown function, bare `=` |
| `parseCellRef` | A1, absolute refs ($A$1), invalid input |
| `shiftCellRef` | Relative offset, absolute skip |
| `cellRefToString` | Reconstruct string from `CellRef` |
| `adjustFormulaReferences` | Shift relative, keep absolute, mixed refs |
| `isFormulaError` | Identifies error strings |
| `formulaTooltip` | Tooltip generation for known functions |

#### `formula-engine-edge.test.ts` — Formula Edge Cases (~30 tests)

| Describe Block | What It Covers |
|----------------|----------------|
| `Nested Expressions` | Deep parenthesization `((((1+2)*3)-4)/5)` |
| `Float Rounding` | `0.1+0.2`, large numbers |
| `Chained Formulas` | Formula referencing pre-computed formula cell |
| `Function Edge Cases` | AVERAGE of empty range, COUNT with text, empty range SUM, comma args |
| `Whitespace` | Spaces in formula `= 1 + 2` |
| `Error Propagation` | Text in arithmetic context, error value propagation |
| `adjustFormulaReferences` | Negative clamp, double shift |
| `formulaTooltip` | Subtraction, multiplication, unknown ops |
| `extractReferences` | Absolute refs, range refs, no refs |

#### `formula-engine-comprehensive.test.ts` — Full Formula Coverage (~60 tests)

Covers all formula functions and operators with comprehensive input permutations: complete arithmetic operator matrix, all 20+ built-in functions (SUM through TRIM), nested function calls, multi-range references, cross-sheet reference evaluation, error propagation chains, and boundary values (empty cells, very large numbers, special characters in text functions).

#### `formula-engine-stage5.test.ts` — Stage 5 Advanced Formulas (~40 tests)

| Describe Block | What It Covers |
|----------------|----------------|
| `IF` | True/false branches, nested IF (up to 7 levels), non-boolean conditions |
| `VLOOKUP` | Exact match (FALSE), approximate match, column index out of range, not found |
| `COUNTIF` | Numeric criteria, text criteria, wildcard `*` and `?`, empty range |
| `SUMIF` | Numeric criteria, comparison operators (`>`, `<`, `>=`), sum range offset |
| `AND / OR / NOT` | Multi-argument boolean logic, short-circuit behavior |
| `Text Functions` | `CONCATENATE`, `LEFT`, `RIGHT`, `LEN`, `TRIM` with various inputs |

#### `helpers-comprehensive.test.ts` — Extended Helper Coverage (~50 tests)

Expanded coverage for all utility functions including: multi-column letter conversion (AA, AZ, BA), complex selection normalization across sheet boundaries, `getCellDisplayValue` with formula errors and special types, and comprehensive `isCellInSelection` tests with merged cell regions.

#### `reducer-comprehensive.test.ts` — Extended Reducer Coverage (~80 tests)

Broad coverage of all reducer actions with focus on interaction combinations: sequential multi-action workflows (edit → format → copy → paste → undo), concurrent sheet operations, undo/redo stack integrity under rapid actions, and save status transitions during batch operations.

#### `reducer-stage4-6.test.ts` — Stage 4–6 Feature Actions (~60 tests)

| Describe Block | What It Covers |
|----------------|----------------|
| `INSERT_ROW / DELETE_ROW` | Single/multi row, formula reference adjustment, undo |
| `INSERT_COLUMN / DELETE_COLUMN` | Single/multi column, cross-sheet ref adjustment |
| `SORT_COLUMN` | Ascending/descending, stable sort, numeric vs. text, undo |
| `DRAG_FILL` | Number sequences, date patterns, formula fill with ref adjustment |
| `MERGE_CELLS / UNMERGE_CELLS` | Range merge, value preservation, overlap prevention |
| `TOGGLE_FILTER / SET_FILTER` | Column filter toggle, value inclusion/exclusion |
| `SET_VALIDATION` | List, number, text-length rules; dropdown values |
| `ADD_COMMENT / EDIT_COMMENT / DELETE_COMMENT` | Comment CRUD with timestamps |
| `ADD_NAMED_RANGE / DELETE_NAMED_RANGE` | Named range management and formula integration |

---

## E2E Tests (Playwright)

### Configuration

- **Browser**: Chromium (Desktop Chrome viewport)
- **Base URL**: `http://localhost:3000`
- **Timeout**: 30 seconds per test
- **Dev Server**: Auto-starts `npm run dev`, waits up to 120s
- **Retries**: 2 on CI, 0 locally
- **Workers**: 1 on CI, auto locally
- **Traces**: On first retry
- **Screenshots**: On failure only

### Test File Details

#### `grid-selection.spec.ts` — Core Grid Interactions (~15 tests)

| Describe Block | What It Covers |
|----------------|----------------|
| `Cell Selection` | Click selects with active border, arrow key navigation, boundary clamping |
| `Cell Editing` | Double-click edit mode, type + Enter commits, Escape cancels, Delete clears |
| `Formulas` | `=1+1` displays `2`, cell reference formula `=A1+A2`, SUM function, reactive update, invalid function error |

#### `features.spec.ts` — Feature Tests (~12 tests)

| Describe Block | What It Covers |
|----------------|----------------|
| `Sheet Tabs` | Add new sheet, switch between sheets (data isolation), rename sheet tab |
| `Find & Replace` | Ctrl+F opens search, match count display, replace current match |
| `Formatting` | Bold button toggles font-weight ≥ 700, undo reverts formatting |
| `Toolbar` | Ctrl+Z triggers undo, theme toggle changes HTML class |
| `Status Bar` | Multi-cell selection shows Sum/Average aggregates |

#### `edge-cases.spec.ts` — Edge Case Scenarios (~10 tests)

| Describe Block | What It Covers |
|----------------|----------------|
| `Formula Bar` | Clicking formula cell shows raw formula (e.g., `=1+1`) in formula bar |
| `Keyboard Copy/Paste` | Ctrl+C then Ctrl+V copies cell value to new position |
| `Bulk Delete` | Delete key on multi-cell Shift+Click selection clears all cells |
| `Rapid Entry` | Fast Tab-key entry across cells preserves all values |
| `Shift+Click` | Creates multi-cell selection, updates name box |
| `Multi-Step Undo/Redo` | Undo 2×, redo 2× restores correct data |
| `Long Text` | 500+ character entry is preserved |
| `Error Display` | `=1/0` → `#DIV/0!`, `=NOTAFUNCTION()` → `#NAME?` |
| `Edit Cancel` | Double-click → type → Escape preserves original value |

#### `comprehensive.spec.ts` — Full Feature E2E (~20 tests)

End-to-end tests that exercise complete user workflows spanning multiple stages: data entry → formula computation → formatting → copy/paste → undo/redo, multi-sheet workflows with cross-sheet references, and Stage 4–6 features (insert/delete rows, sorting, drag-fill, merge, filter, comments, named ranges, and charts).

---

## Test Coverage Map

This matrix shows which features are covered by which test type. Use it to identify gaps.

| Feature Area | Unit Tests | E2E Tests | Notes |
|---|---|---|---|
| **Cell Selection & Navigation** | `reducer.test.ts` (SELECT_CELL, NAVIGATE) | `grid-selection.spec.ts` | ✅ Full |
| **Cell Editing (type, commit, cancel)** | `reducer.test.ts` (START/COMMIT/CANCEL) | `grid-selection.spec.ts` | ✅ Full |
| **Formulas — Arithmetic** | `formula-engine.test.ts`, `*-comprehensive` | `grid-selection.spec.ts` | ✅ Full |
| **Formulas — Functions (SUM, AVG…)** | `formula-engine.test.ts`, `*-comprehensive` | `grid-selection.spec.ts` | ✅ Full |
| **Formulas — Cell References** | `formula-engine.test.ts` | `grid-selection.spec.ts` | ✅ Full |
| **Formulas — Cross-Sheet Refs** | `formula-engine-comprehensive.test.ts` | `comprehensive.spec.ts` | ✅ Full |
| **Formulas — Advanced (IF, VLOOKUP…)** | `formula-engine-stage5.test.ts` | `comprehensive.spec.ts` | ✅ Full |
| **Formula Errors** | `formula-engine.test.ts` | `edge-cases.spec.ts` | ✅ Full |
| **Copy / Paste** | `reducer.test.ts`, `reducer-edge.test.ts` | `edge-cases.spec.ts` | ✅ Full |
| **Undo / Redo** | `reducer.test.ts` | `edge-cases.spec.ts` | ✅ Full |
| **Find & Replace** | `reducer.test.ts`, `reducer-edge.test.ts` | `features.spec.ts` | ✅ Full |
| **Formatting (bold, color, align)** | `reducer.test.ts` (SET_FORMAT) | `features.spec.ts` | ✅ Full |
| **Sheet Tabs (add, delete, rename, switch)** | `reducer.test.ts` | `features.spec.ts` | ✅ Full |
| **Insert/Delete Rows & Columns** | `reducer-stage4-6.test.ts` | `comprehensive.spec.ts` | ✅ Full |
| **Column Sorting** | `reducer-stage4-6.test.ts` | `comprehensive.spec.ts` | ✅ Full |
| **Drag-Fill** | `reducer-stage4-6.test.ts` | `comprehensive.spec.ts` | ✅ Full |
| **Cell Merge/Unmerge** | `reducer-stage4-6.test.ts` | `comprehensive.spec.ts` | ✅ Full |
| **Data Filtering** | `reducer-stage4-6.test.ts` | `comprehensive.spec.ts` | ✅ Full |
| **Data Validation** | `reducer-stage4-6.test.ts` | `comprehensive.spec.ts` | ✅ Full |
| **Cell Comments** | `reducer-stage4-6.test.ts` | `comprehensive.spec.ts` | ✅ Full |
| **Named Ranges** | `reducer-stage4-6.test.ts` | `comprehensive.spec.ts` | ✅ Full |
| **CSV Import** | `reducer.test.ts` (IMPORT_CSV) | — | ⚠️ **Gap**: no E2E test |
| **Conditional Formatting** | `reducer-edge.test.ts` | — | ⚠️ **Gap**: no E2E test |
| **Freeze Rows** | `reducer.test.ts` | — | ⚠️ **Gap**: no E2E test |
| **Column/Row Resize** | `reducer.test.ts` | — | ⚠️ **Gap**: no E2E test |
| **Status Bar Aggregates** | — | `features.spec.ts` | Unit test missing |
| **Theme Toggle** | — | `features.spec.ts` | Unit test N/A |
| **Auto-Save (localStorage)** | — | — | ⚠️ **Gap**: needs tests |
| **Context Menu** | — | — | ⚠️ **Gap**: needs tests |
| **Onboarding Tour** | — | — | ⚠️ **Gap**: needs tests |
| **Formula Autocomplete** | — | — | ⚠️ **Gap**: needs tests |
| **Inline Charts (Bar/Pie)** | — | — | ⚠️ **Gap**: needs tests |
| **Print/PDF** | — | — | ⚠️ **Gap**: needs tests |

---

## Mandatory Checklist — Adding a New Feature

> **⚠️ RULE: No feature is complete without tests.** Use this checklist every time.

### Step 1: Plan Your Tests

Before writing any code, identify what tests are needed:

- [ ] Does the feature add a **new reducer action**? → Unit test in `reducer.test.ts` or `reducer-edge.test.ts`
- [ ] Does the feature modify the **formula engine**? → Unit test in `formula-engine.test.ts` or `formula-engine-edge.test.ts`
- [ ] Does the feature add/modify **utility functions**? → Unit test in `helpers.test.ts` or `helpers-edge.test.ts`
- [ ] Is there a **user-visible UI interaction**? → E2E test in appropriate spec file
- [ ] Does it affect an **existing feature**? → Verify existing tests still pass

### Step 2: Write Unit Tests

Add tests to the appropriate `__tests__/unit/` file:

```typescript
// Pattern: test the reducer action
describe('Reducer — YOUR_NEW_ACTION', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('does the expected thing', () => {
        const s = dispatch(state, { type: 'YOUR_NEW_ACTION', /* params */ });
        expect(/* assertion */).toBe(/* expected */);
    });

    it('handles edge case: empty input', () => {
        // ...
    });

    it('handles edge case: boundary values', () => {
        // ...
    });
});
```

### Step 3: Write E2E Tests

Add tests to the appropriate `__tests__/e2e/` spec file:

```typescript
// Pattern: test user interaction
test.describe('Feature Name', () => {
    test.beforeEach(async ({ page }) => {
        await goToApp(page);
    });

    test('user can perform the action', async ({ page }) => {
        // 1. Setup: enter data, navigate to state
        await clickCell(page, 0, 0);
        await page.keyboard.type('data');
        await page.keyboard.press('Enter');

        // 2. Action: perform the feature action
        await page.locator('button[aria-label="Feature"]').click();

        // 3. Assert: verify the result
        await expect(page.locator('[data-col="0"][data-row="0"]'))
            .toContainText('expected');
    });
});
```

### Step 4: Run Tests

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run everything
npm run test:all
```

### Step 5: Update This Documentation

- [ ] Add the new test to the appropriate section in [Unit Tests](#unit-tests-vitest) or [E2E Tests](#e2e-tests-playwright)
- [ ] Update the [Test Coverage Map](#test-coverage-map) — mark any gaps as filled
- [ ] If you created a new test file, add it to the [Project Structure](#project-structure) tree

---

## Writing Good Tests — Conventions

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| **Describe block** | `Module — Feature` | `Reducer — COPY/PASTE corners` |
| **Test name** | `{verb}s {thing} {condition}` | `commits plain text`, `clamps negative row to 0` |
| **Edge test file** | `{module}-edge.test.ts` | `formula-engine-edge.test.ts` |
| **E2E file** | `{feature-area}.spec.ts` | `grid-selection.spec.ts` |

### Test Helpers

Reusable helpers are already defined in the test files. Use them:

```typescript
// Unit test helpers (in reducer tests)
function dispatch(state: SpreadsheetState, action: SpreadsheetAction): SpreadsheetState
function dispatchMany(state: SpreadsheetState, actions: SpreadsheetAction[]): SpreadsheetState
function getActiveSheet(state: SpreadsheetState): Sheet
function setCell(state: SpreadsheetState, col: number, row: number, value: string): SpreadsheetState

// Formula test helper
function makeCells(entries: Record<string, number | string>): Record<string, Cell>

// E2E test helpers
async function goToApp(page: Page): Promise<void>     // navigates + waits for grid
async function clickCell(page: Page, col: number, row: number): Promise<void>
async function doubleClickCell(page: Page, col: number, row: number): Promise<void>
async function typeInCell(page: Page, text: string): Promise<void>
```

### Selector Conventions (E2E)

| Element | Selector Pattern |
|---------|-----------------|
| Grid cell | `[data-col="0"][data-row="0"]` |
| Name box | `.sf-toolbar__cell-ref` |
| Formula bar | `#formula-bar-input` |
| Find input | `#find-input` |
| Status bar | `.sf-status-bar` |
| Sheet tab | `.sf-sheet-tab__name` |
| Toolbar buttons | `button[aria-label="..."]` |

### Rules of Thumb

1. **Test behavior, not implementation** — test what the user sees, not internal state shape
2. **One assertion focus per test** — multiple `expect()` is OK, but keep the test focused on one behavior
3. **Edge cases go in `*-edge` files** — keep core tests clean; put boundary/corner cases separately
4. **Always use `beforeEach`** — never let test state leak between tests
5. **E2E tests should be independent** — each test can run in isolation
6. **Use `data-*` attributes for E2E selectors** — never rely on CSS class names for visual styling

---

## Troubleshooting

### Unit tests fail with module import errors

Make sure path aliases resolve correctly. Check `vitest.config.ts`:
```typescript
resolve: {
    alias: {
        '@': path.resolve(__dirname, '.'),
    },
},
```

### E2E tests time out

1. Ensure the dev server is running (or `reuseExistingServer` is enabled)
2. Check that `localhost:3000` is reachable
3. Increase timeout in `playwright.config.ts` if the server is slow to boot
4. Look for the Next.js dev overlay (`<nextjs-portal>`) intercepting clicks — use `{ force: true }` on `click()` if needed

### E2E tests fail on CI but pass locally

- CI uses `retries: 2` and `workers: 1` (sequential execution)
- CI sets `reuseExistingServer: false` — fresh server per run
- Check for hardcoded waits vs. proper `await expect().toBeVisible()` patterns

### Coverage report doesn't include a file

Add the file path to `vitest.config.ts` → `test.coverage.include`:
```typescript
coverage: {
    provider: 'v8',
    include: [
        'state/spreadsheet-context.tsx',
        'lib/formula-engine.ts',
        'types/spreadsheet.ts',
        // Add your new file here
    ],
},
```
