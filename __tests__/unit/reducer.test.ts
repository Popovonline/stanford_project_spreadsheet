import { describe, it, expect, beforeEach } from 'vitest';
import {
    spreadsheetReducer,
    createInitialState,
    determineCellDataType,
    parseCSV,
    parseTSV,
} from '@/state/spreadsheet-context';
import {
    type SpreadsheetState,
    type SpreadsheetAction,
    type ConditionalRule,
    cellKey,
    TOTAL_COLUMNS,
    TOTAL_ROWS,
    MAX_CELL_CHARS,
    MAX_UNDO_STACK,

} from '@/types/spreadsheet';

// ─── Test Helpers ──────────────────────────────────────────────────
function dispatch(state: SpreadsheetState, action: SpreadsheetAction): SpreadsheetState {
    return spreadsheetReducer(state, action);
}

function dispatchMany(state: SpreadsheetState, actions: SpreadsheetAction[]): SpreadsheetState {
    return actions.reduce((s, a) => spreadsheetReducer(s, a), state);
}

function getActiveSheet(state: SpreadsheetState) {
    return state.workbook.sheets.find(s => s.id === state.workbook.activeSheetId)!;
}

function setCell(state: SpreadsheetState, col: number, row: number, value: string): SpreadsheetState {
    let s = dispatch(state, { type: 'SELECT_CELL', col, row });
    s = dispatch(s, { type: 'START_EDITING', initialValue: value });
    s = dispatch(s, { type: 'UPDATE_EDIT_BUFFER', value });
    s = dispatch(s, { type: 'COMMIT_EDIT' });
    return s;
}

// ═══════════════════════════════════════════════════════════════════
// SELECT_CELL
// ═══════════════════════════════════════════════════════════════════
describe('Reducer — SELECT_CELL', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('selects cell A1 (0,0)', () => {
        const s = dispatch(state, { type: 'SELECT_CELL', col: 0, row: 0 });
        expect(s.activeCell.col).toBe(0);
        expect(s.activeCell.row).toBe(0);
        expect(s.mode).toBe('VIEWING');
    });

    it('selects cell Z100 (last cell)', () => {
        const s = dispatch(state, { type: 'SELECT_CELL', col: 25, row: 99 });
        expect(s.activeCell.col).toBe(25);
        expect(s.activeCell.row).toBe(99);
    });

    it('clamps out-of-bounds col to max', () => {
        const s = dispatch(state, { type: 'SELECT_CELL', col: 100, row: 0 });
        expect(s.activeCell.col).toBe(TOTAL_COLUMNS - 1);
    });

    it('clamps out-of-bounds row to max', () => {
        const s = dispatch(state, { type: 'SELECT_CELL', col: 0, row: 500 });
        expect(s.activeCell.row).toBe(TOTAL_ROWS - 1);
    });

    it('clamps negative col to 0', () => {
        const s = dispatch(state, { type: 'SELECT_CELL', col: -5, row: 0 });
        expect(s.activeCell.col).toBe(0);
    });

    it('clamps negative row to 0', () => {
        const s = dispatch(state, { type: 'SELECT_CELL', col: 0, row: -10 });
        expect(s.activeCell.row).toBe(0);
    });

    it('commits pending edit when selecting new cell', () => {
        let s = dispatch(state, { type: 'START_EDITING', initialValue: 'test' });
        s = dispatch(s, { type: 'UPDATE_EDIT_BUFFER', value: 'hello' });
        s = dispatch(s, { type: 'SELECT_CELL', col: 1, row: 0 });
        expect(s.mode).toBe('VIEWING');
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(0, 0)];
        expect(cell).toBeDefined();
        expect(cell.value).toBe('hello');
    });

    it('clears selection when selecting a cell', () => {
        let s = dispatch(state, {
            type: 'SET_SELECTION',
            range: { startCol: 0, startRow: 0, endCol: 2, endRow: 2 },
        });
        s = dispatch(s, { type: 'SELECT_CELL', col: 0, row: 0 });
        expect(s.selection).toBeNull();
    });

    // FR-116: Point-and-click formula entry
    it('inserts cell reference when clicking during formula editing (FR-116)', () => {
        let s = dispatch(state, { type: 'START_EDITING', initialValue: '=' });
        s = dispatch(s, { type: 'UPDATE_EDIT_BUFFER', value: '=' });
        s = dispatch(s, { type: 'SELECT_CELL', col: 1, row: 1 }); // click B2
        expect(s.mode).toBe('EDITING');
        expect(s.editBuffer).toBe('=B2');
    });

    it('appends cell reference to partial formula on click (FR-116)', () => {
        let s = dispatch(state, { type: 'START_EDITING', initialValue: '=A1+' });
        s = dispatch(s, { type: 'UPDATE_EDIT_BUFFER', value: '=A1+' });
        s = dispatch(s, { type: 'SELECT_CELL', col: 1, row: 0 }); // click B1
        expect(s.mode).toBe('EDITING');
        expect(s.editBuffer).toBe('=A1+B1');
    });

    it('commits plain text when clicking during non-formula editing (CC-123 regression)', () => {
        let s = dispatch(state, { type: 'START_EDITING', initialValue: 'hello' });
        s = dispatch(s, { type: 'UPDATE_EDIT_BUFFER', value: 'hello' });
        s = dispatch(s, { type: 'SELECT_CELL', col: 1, row: 0 });
        expect(s.mode).toBe('VIEWING');
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(0, 0)];
        expect(cell).toBeDefined();
        expect(cell.value).toBe('hello');
    });
});

// ═══════════════════════════════════════════════════════════════════
// START_EDITING
// ═══════════════════════════════════════════════════════════════════
describe('Reducer — START_EDITING', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('starts editing empty cell with empty buffer', () => {
        const s = dispatch(state, { type: 'START_EDITING' });
        expect(s.mode).toBe('EDITING');
        expect(s.editBuffer).toBe('');
    });

    it('starts editing cell with existing value', () => {
        let s = setCell(state, 0, 0, 'Hello');
        s = dispatch(s, { type: 'SELECT_CELL', col: 0, row: 0 });
        s = dispatch(s, { type: 'START_EDITING' });
        expect(s.mode).toBe('EDITING');
        expect(s.editBuffer).toBe('Hello');
    });

    it('starts editing cell with formula (loads formula string)', () => {
        let s = setCell(state, 0, 0, '=1+1');
        s = dispatch(s, { type: 'SELECT_CELL', col: 0, row: 0 });
        s = dispatch(s, { type: 'START_EDITING' });
        expect(s.editBuffer).toBe('=1+1');
    });

    it('uses explicit initialValue when provided', () => {
        const s = dispatch(state, { type: 'START_EDITING', initialValue: 'abc' });
        expect(s.editBuffer).toBe('abc');
    });
});

// ═══════════════════════════════════════════════════════════════════
// UPDATE_EDIT_BUFFER
// ═══════════════════════════════════════════════════════════════════
describe('Reducer — UPDATE_EDIT_BUFFER', () => {
    let state: SpreadsheetState;
    beforeEach(() => {
        state = createInitialState();
        state = dispatch(state, { type: 'START_EDITING' });
    });

    it('updates the edit buffer', () => {
        const s = dispatch(state, { type: 'UPDATE_EDIT_BUFFER', value: 'testing' });
        expect(s.editBuffer).toBe('testing');
    });

    it('truncates at MAX_CELL_CHARS (5000)', () => {
        const longStr = 'x'.repeat(MAX_CELL_CHARS + 500);
        const s = dispatch(state, { type: 'UPDATE_EDIT_BUFFER', value: longStr });
        expect(s.editBuffer.length).toBe(MAX_CELL_CHARS);
    });
});

// ═══════════════════════════════════════════════════════════════════
// COMMIT_EDIT
// ═══════════════════════════════════════════════════════════════════
describe('Reducer — COMMIT_EDIT', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('commits plain text', () => {
        const s = setCell(state, 0, 0, 'Hello');
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(0, 0)];
        expect(cell.value).toBe('Hello');
        expect(cell.dataType).toBe('text');
    });

    it('commits number', () => {
        const s = setCell(state, 0, 0, '42');
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(0, 0)];
        expect(cell.value).toBe(42);
        expect(cell.dataType).toBe('number');
    });

    it('commits currency "$100"', () => {
        const s = setCell(state, 0, 0, '$100');
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(0, 0)];
        expect(cell.dataType).toBe('currency');
    });

    it('commits percentage "50%"', () => {
        const s = setCell(state, 0, 0, '50%');
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(0, 0)];
        expect(cell.dataType).toBe('percentage');
    });

    it('commits date "2025-01-01"', () => {
        const s = setCell(state, 0, 0, '2025-01-01');
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(0, 0)];
        expect(cell.dataType).toBe('date');
    });

    it('clears cell when committing empty string', () => {
        let s = setCell(state, 0, 0, 'data');
        s = setCell(s, 0, 0, '');
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(0, 0)]).toBeUndefined();
    });

    it('evaluates formula =1+1 to 2', () => {
        const s = setCell(state, 0, 0, '=1+1');
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(0, 0)];
        expect(cell.displayValue).toBe('2');
        expect(cell.formula).toBe('=1+1');
    });

    it('returns to VIEWING mode after commit', () => {
        const s = setCell(state, 0, 0, 'test');
        expect(s.mode).toBe('VIEWING');
        expect(s.editBuffer).toBe('');
    });
});

// ═══════════════════════════════════════════════════════════════════
// CANCEL_EDITING
// ═══════════════════════════════════════════════════════════════════
describe('Reducer — CANCEL_EDITING', () => {
    it('returns to VIEWING mode and clears buffer', () => {
        let state = createInitialState();
        state = dispatch(state, { type: 'START_EDITING', initialValue: 'test' });
        state = dispatch(state, { type: 'CANCEL_EDITING' });
        expect(state.mode).toBe('VIEWING');
        expect(state.editBuffer).toBe('');
    });
});

// ═══════════════════════════════════════════════════════════════════
// NAVIGATE
// ═══════════════════════════════════════════════════════════════════
describe('Reducer — NAVIGATE', () => {
    let state: SpreadsheetState;
    beforeEach(() => {
        state = createInitialState();
        state = dispatch(state, { type: 'SELECT_CELL', col: 5, row: 5 });
    });

    it('moves up', () => {
        const s = dispatch(state, { type: 'NAVIGATE', direction: 'up' });
        expect(s.activeCell.row).toBe(4);
    });

    it('moves down', () => {
        const s = dispatch(state, { type: 'NAVIGATE', direction: 'down' });
        expect(s.activeCell.row).toBe(6);
    });

    it('moves left', () => {
        const s = dispatch(state, { type: 'NAVIGATE', direction: 'left' });
        expect(s.activeCell.col).toBe(4);
    });

    it('moves right', () => {
        const s = dispatch(state, { type: 'NAVIGATE', direction: 'right' });
        expect(s.activeCell.col).toBe(6);
    });

    it('stays at row 0 when navigating up', () => {
        let s = dispatch(state, { type: 'SELECT_CELL', col: 0, row: 0 });
        s = dispatch(s, { type: 'NAVIGATE', direction: 'up' });
        expect(s.activeCell.row).toBe(0);
    });

    it('stays at last row when navigating down', () => {
        let s = dispatch(state, { type: 'SELECT_CELL', col: 0, row: TOTAL_ROWS - 1 });
        s = dispatch(s, { type: 'NAVIGATE', direction: 'down' });
        expect(s.activeCell.row).toBe(TOTAL_ROWS - 1);
    });

    it('stays at col 0 when navigating left', () => {
        let s = dispatch(state, { type: 'SELECT_CELL', col: 0, row: 0 });
        s = dispatch(s, { type: 'NAVIGATE', direction: 'left' });
        expect(s.activeCell.col).toBe(0);
    });

    it('stays at last col when navigating right', () => {
        let s = dispatch(state, { type: 'SELECT_CELL', col: TOTAL_COLUMNS - 1, row: 0 });
        s = dispatch(s, { type: 'NAVIGATE', direction: 'right' });
        expect(s.activeCell.col).toBe(TOTAL_COLUMNS - 1);
    });

    it('is blocked while editing', () => {
        let s = dispatch(state, { type: 'START_EDITING' });
        const before = { ...s.activeCell };
        s = dispatch(s, { type: 'NAVIGATE', direction: 'down' });
        expect(s.activeCell.col).toBe(before.col);
        expect(s.activeCell.row).toBe(before.row);
    });

    it('clears selection on navigate', () => {
        let s = dispatch(state, {
            type: 'SET_SELECTION',
            range: { startCol: 0, startRow: 0, endCol: 2, endRow: 2 },
        });
        s = dispatch(s, { type: 'NAVIGATE', direction: 'down' });
        expect(s.selection).toBeNull();
    });
});

// ═══════════════════════════════════════════════════════════════════
// TAB_NAVIGATE
// ═══════════════════════════════════════════════════════════════════
describe('Reducer — TAB_NAVIGATE', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('Tab moves right by one column', () => {
        let s = dispatch(state, { type: 'SELECT_CELL', col: 3, row: 0 });
        s = dispatch(s, { type: 'TAB_NAVIGATE' });
        expect(s.activeCell.col).toBe(4);
        expect(s.activeCell.row).toBe(0);
    });

    it('Tab wraps to next row from last column', () => {
        let s = dispatch(state, { type: 'SELECT_CELL', col: TOTAL_COLUMNS - 1, row: 0 });
        s = dispatch(s, { type: 'TAB_NAVIGATE' });
        expect(s.activeCell.col).toBe(0);
        expect(s.activeCell.row).toBe(1);
    });

    it('Shift+Tab moves left by one column', () => {
        let s = dispatch(state, { type: 'SELECT_CELL', col: 3, row: 0 });
        s = dispatch(s, { type: 'TAB_NAVIGATE', shift: true });
        expect(s.activeCell.col).toBe(2);
    });

    it('Shift+Tab wraps to prev row from col 0', () => {
        let s = dispatch(state, { type: 'SELECT_CELL', col: 0, row: 2 });
        s = dispatch(s, { type: 'TAB_NAVIGATE', shift: true });
        expect(s.activeCell.col).toBe(TOTAL_COLUMNS - 1);
        expect(s.activeCell.row).toBe(1);
    });

    it('Shift+Tab at A1 stays at A1', () => {
        let s = dispatch(state, { type: 'SELECT_CELL', col: 0, row: 0 });
        s = dispatch(s, { type: 'TAB_NAVIGATE', shift: true });
        expect(s.activeCell.col).toBe(0);
        expect(s.activeCell.row).toBe(0);
    });

    it('clears selection and returns to VIEWING', () => {
        let s = dispatch(state, {
            type: 'SET_SELECTION',
            range: { startCol: 0, startRow: 0, endCol: 2, endRow: 2 },
        });
        s = dispatch(s, { type: 'TAB_NAVIGATE' });
        expect(s.selection).toBeNull();
        expect(s.mode).toBe('VIEWING');
    });
});

// ═══════════════════════════════════════════════════════════════════
// SET_SELECTION
// ═══════════════════════════════════════════════════════════════════
describe('Reducer — SET_SELECTION', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('sets selection range and mode to SELECTING', () => {
        const range = { startCol: 0, startRow: 0, endCol: 3, endRow: 5 };
        const s = dispatch(state, { type: 'SET_SELECTION', range });
        expect(s.selection).toEqual(range);
        expect(s.mode).toBe('SELECTING');
    });

    it('clears selection with null and mode to VIEWING', () => {
        let s = dispatch(state, {
            type: 'SET_SELECTION',
            range: { startCol: 0, startRow: 0, endCol: 2, endRow: 2 },
        });
        s = dispatch(s, { type: 'SET_SELECTION', range: null });
        expect(s.selection).toBeNull();
        expect(s.mode).toBe('VIEWING');
    });
});

// ═══════════════════════════════════════════════════════════════════
// SET_FORMAT
// ═══════════════════════════════════════════════════════════════════
describe('Reducer — SET_FORMAT', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('sets bold on single cell', () => {
        const s = dispatch(state, { type: 'SET_FORMAT', format: { bold: true } });
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(0, 0)];
        expect(cell.format?.bold).toBe(true);
    });

    it('sets font color on cell', () => {
        const s = dispatch(state, { type: 'SET_FORMAT', format: { fontColor: '#ff0000' } });
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(0, 0)];
        expect(cell.format?.fontColor).toBe('#ff0000');
    });

    it('sets background color on cell', () => {
        const s = dispatch(state, { type: 'SET_FORMAT', format: { backgroundColor: '#00ff00' } });
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(0, 0)];
        expect(cell.format?.backgroundColor).toBe('#00ff00');
    });

    it('sets alignment on cell', () => {
        const s = dispatch(state, { type: 'SET_FORMAT', format: { alignment: 'center' } });
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(0, 0)];
        expect(cell.format?.alignment).toBe('center');
    });

    it('applies format to multi-cell selection', () => {
        let s = dispatch(state, {
            type: 'SET_SELECTION',
            range: { startCol: 0, startRow: 0, endCol: 2, endRow: 2 },
        });
        s = dispatch(s, { type: 'SET_FORMAT', format: { bold: true } });
        const sheet = getActiveSheet(s);
        // Check all 9 cells
        for (let r = 0; r <= 2; r++) {
            for (let c = 0; c <= 2; c++) {
                expect(sheet.cells[cellKey(c, r)]?.format?.bold).toBe(true);
            }
        }
    });

    it('preserves existing format properties when adding new ones', () => {
        let s = dispatch(state, { type: 'SET_FORMAT', format: { bold: true } });
        s = dispatch(s, { type: 'SET_FORMAT', format: { fontColor: '#ff0000' } });
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(0, 0)];
        expect(cell.format?.bold).toBe(true);
        expect(cell.format?.fontColor).toBe('#ff0000');
    });

    it('pushes undo entry', () => {
        const s = dispatch(state, { type: 'SET_FORMAT', format: { bold: true } });
        expect(s.undoStack.length).toBe(1);
    });
});

// ═══════════════════════════════════════════════════════════════════
// UNDO / REDO (single-step: one entry per action, like Excel)
// ═══════════════════════════════════════════════════════════════════
describe('Reducer — UNDO/REDO (single-step)', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('single undo reverts exactly one edit', () => {
        let s = state;
        // Make 3 edits
        for (let i = 0; i < 3; i++) {
            s = setCell(s, 0, 0, `value${i}`);
        }
        expect(s.undoStack.length).toBe(3);
        // One undo action should revert 1 step
        s = dispatch(s, { type: 'UNDO' });
        expect(s.undoStack.length).toBe(2);
        expect(s.redoStack.length).toBe(1);
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(0, 0)]?.value).toBe('value1');
    });

    it('undo three edits one at a time', () => {
        let s = setCell(state, 0, 0, 'A');
        s = setCell(s, 0, 0, 'B');
        s = setCell(s, 0, 0, 'C');
        expect(s.undoStack.length).toBe(3);
        s = dispatch(s, { type: 'UNDO' });
        expect(s.undoStack.length).toBe(2);
        expect(getActiveSheet(s).cells[cellKey(0, 0)]?.value).toBe('B');
        s = dispatch(s, { type: 'UNDO' });
        expect(s.undoStack.length).toBe(1);
        expect(getActiveSheet(s).cells[cellKey(0, 0)]?.value).toBe('A');
        s = dispatch(s, { type: 'UNDO' });
        expect(s.undoStack.length).toBe(0);
        expect(s.redoStack.length).toBe(3);
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(0, 0)]).toBeUndefined();
    });

    it('ten undos revert 10 edits completely', () => {
        let s = state;
        for (let i = 0; i < 10; i++) {
            s = setCell(s, 0, 0, `v${i}`);
        }
        for (let i = 0; i < 10; i++) {
            s = dispatch(s, { type: 'UNDO' });
        }
        expect(s.undoStack.length).toBe(0);
        expect(s.redoStack.length).toBe(10);
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(0, 0)]).toBeUndefined();
    });

    it('redo restores exactly one step', () => {
        let s = state;
        for (let i = 0; i < 3; i++) {
            s = setCell(s, 0, 0, `v${i}`);
        }
        // Undo all 3
        s = dispatch(s, { type: 'UNDO' });
        s = dispatch(s, { type: 'UNDO' });
        s = dispatch(s, { type: 'UNDO' });
        expect(s.undoStack.length).toBe(0);
        // Redo 1
        s = dispatch(s, { type: 'REDO' });
        expect(s.undoStack.length).toBe(1);
        expect(s.redoStack.length).toBe(2);
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(0, 0)]?.value).toBe('v0');
    });

    it('undo with empty stack is no-op', () => {
        const s = dispatch(state, { type: 'UNDO' });
        expect(s).toBe(state);
    });

    it('redo with empty stack is no-op', () => {
        const s = dispatch(state, { type: 'REDO' });
        expect(s).toBe(state);
    });

    it('undo stack capped at MAX_UNDO_STACK (50)', () => {
        let s = state;
        for (let i = 0; i < MAX_UNDO_STACK + 10; i++) {
            s = setCell(s, 0, 0, `value${i}`);
        }
        expect(s.undoStack.length).toBeLessThanOrEqual(MAX_UNDO_STACK);
    });

    it('redo stack cleared after new edit', () => {
        let s = setCell(state, 0, 0, 'A');
        s = setCell(s, 0, 0, 'B');
        s = dispatch(s, { type: 'UNDO' });
        expect(s.redoStack.length).toBeGreaterThan(0);
        s = setCell(s, 0, 0, 'C');
        expect(s.redoStack.length).toBe(0);
    });

    it('undo restores column widths', () => {
        let s = dispatch(state, { type: 'RESIZE_COLUMN', col: 0, width: 200 });
        const sheet1 = getActiveSheet(s);
        expect(sheet1.columnWidths[0]).toBe(200);
        s = dispatch(s, { type: 'UNDO' });
        const sheet2 = getActiveSheet(s);
        expect(sheet2.columnWidths[0]).toBe(100); // DEFAULT_COLUMN_WIDTH
    });

    it('undo restores row heights', () => {
        let s = dispatch(state, { type: 'RESIZE_ROW', row: 0, height: 50 });
        s = dispatch(s, { type: 'UNDO' });
        const sheet = getActiveSheet(s);
        expect(sheet.rowHeights[0]).toBe(28); // DEFAULT_ROW_HEIGHT
    });
});

// ═══════════════════════════════════════════════════════════════════
// COPY / PASTE / CUT
// ═══════════════════════════════════════════════════════════════════
describe('Reducer — COPY/PASTE/CUT', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('copy single cell stores clipboard', () => {
        let s = setCell(state, 0, 0, 'hello');
        s = dispatch(s, { type: 'SELECT_CELL', col: 0, row: 0 });
        s = dispatch(s, { type: 'COPY' });
        expect(s.clipboard).not.toBeNull();
        expect(s.clipboard!.cells[cellKey(0, 0)]?.value).toBe('hello');
    });

    it('copy multi-cell selection stores range', () => {
        let s = setCell(state, 0, 0, 'A');
        s = setCell(s, 1, 0, 'B');
        s = dispatch(s, { type: 'SELECT_CELL', col: 0, row: 0 });
        s = dispatch(s, {
            type: 'SET_SELECTION',
            range: { startCol: 0, startRow: 0, endCol: 1, endRow: 0 },
        });
        s = dispatch(s, { type: 'COPY' });
        expect(s.clipboard!.range).toEqual({ startCol: 0, startRow: 0, endCol: 1, endRow: 0 });
    });

    it('paste single cell at target', () => {
        let s = setCell(state, 0, 0, 'hello');
        s = dispatch(s, { type: 'SELECT_CELL', col: 0, row: 0 });
        s = dispatch(s, { type: 'COPY' });
        s = dispatch(s, { type: 'SELECT_CELL', col: 2, row: 2 });
        s = dispatch(s, { type: 'PASTE' });
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(2, 2)]?.value).toBe('hello');
    });

    it('cut clears source cells', () => {
        let s = setCell(state, 0, 0, 'hello');
        s = dispatch(s, { type: 'SELECT_CELL', col: 0, row: 0 });
        s = dispatch(s, { type: 'COPY', isCut: true });
        s = dispatch(s, { type: 'SELECT_CELL', col: 2, row: 2 });
        s = dispatch(s, { type: 'PASTE' });
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(0, 0)]).toBeUndefined();
        expect(sheet.cells[cellKey(2, 2)]?.value).toBe('hello');
    });

    it('cut + paste clears clipboard', () => {
        let s = setCell(state, 0, 0, 'hello');
        s = dispatch(s, { type: 'SELECT_CELL', col: 0, row: 0 });
        s = dispatch(s, { type: 'COPY', isCut: true });
        s = dispatch(s, { type: 'SELECT_CELL', col: 2, row: 2 });
        s = dispatch(s, { type: 'PASTE' });
        expect(s.clipboard).toBeNull();
    });

    it('paste with no clipboard is no-op', () => {
        const s = dispatch(state, { type: 'PASTE' });
        expect(s).toBe(state);
    });

    it('paste external TSV text', () => {
        let s = dispatch(state, { type: 'SELECT_CELL', col: 0, row: 0 });
        s = dispatch(s, { type: 'PASTE', externalText: 'A\tB\n1\t2' });
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(0, 0)]?.value).toBe('A');
        expect(sheet.cells[cellKey(1, 0)]?.value).toBe('B');
        expect(sheet.cells[cellKey(0, 1)]?.value).toBe(1);
        expect(sheet.cells[cellKey(1, 1)]?.value).toBe(2);
    });

    it('paste formula adjusts references', () => {
        let s = setCell(state, 0, 0, '10');
        s = setCell(s, 0, 1, '=A1');
        s = dispatch(s, { type: 'SELECT_CELL', col: 0, row: 1 });
        s = dispatch(s, { type: 'COPY' });
        s = dispatch(s, { type: 'SELECT_CELL', col: 1, row: 1 });
        s = dispatch(s, { type: 'PASTE' });
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(1, 1)]?.formula).toBe('=B1');
    });
});

// ═══════════════════════════════════════════════════════════════════
// RESIZE_COLUMN / RESIZE_ROW
// ═══════════════════════════════════════════════════════════════════
describe('Reducer — RESIZE', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('resizes column to 200px', () => {
        const s = dispatch(state, { type: 'RESIZE_COLUMN', col: 0, width: 200 });
        const sheet = getActiveSheet(s);
        expect(sheet.columnWidths[0]).toBe(200);
    });

    it('clamps column width to MIN_COLUMN_WIDTH (30)', () => {
        const s = dispatch(state, { type: 'RESIZE_COLUMN', col: 0, width: 10 });
        const sheet = getActiveSheet(s);
        expect(sheet.columnWidths[0]).toBe(30);
    });

    it('resizes row to 50px', () => {
        const s = dispatch(state, { type: 'RESIZE_ROW', row: 0, height: 50 });
        const sheet = getActiveSheet(s);
        expect(sheet.rowHeights[0]).toBe(50);
    });

    it('clamps row height to MIN_ROW_HEIGHT (20)', () => {
        const s = dispatch(state, { type: 'RESIZE_ROW', row: 0, height: 5 });
        const sheet = getActiveSheet(s);
        expect(sheet.rowHeights[0]).toBe(20);
    });

    it('resize pushes undo entry', () => {
        const s = dispatch(state, { type: 'RESIZE_COLUMN', col: 0, width: 200 });
        expect(s.undoStack.length).toBe(1);
    });
});

// ═══════════════════════════════════════════════════════════════════
// SHEET MANAGEMENT
// ═══════════════════════════════════════════════════════════════════
describe('Reducer — Sheet Management', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('ADD_SHEET creates a new sheet', () => {
        const s = dispatch(state, { type: 'ADD_SHEET' });
        expect(s.workbook.sheets.length).toBe(2);
    });

    it('ADD_SHEET names sheet with incremented number', () => {
        const s = dispatch(state, { type: 'ADD_SHEET' });
        const newSheet = s.workbook.sheets[1];
        expect(newSheet.name).toBe('Sheet2');
    });

    it('ADD_SHEET switches to new sheet', () => {
        const s = dispatch(state, { type: 'ADD_SHEET' });
        expect(s.workbook.activeSheetId).toBe(s.workbook.sheets[1].id);
    });

    it('ADD_SHEET resets undo/redo stacks', () => {
        let s = setCell(state, 0, 0, 'data');
        expect(s.undoStack.length).toBeGreaterThan(0);
        s = dispatch(s, { type: 'ADD_SHEET' });
        expect(s.undoStack.length).toBe(0);
        expect(s.redoStack.length).toBe(0);
    });

    it('ADD_SHEET resets active cell to A1', () => {
        let s = dispatch(state, { type: 'SELECT_CELL', col: 5, row: 5 });
        s = dispatch(s, { type: 'ADD_SHEET' });
        expect(s.activeCell.col).toBe(0);
        expect(s.activeCell.row).toBe(0);
    });

    it('DELETE_SHEET removes sheet', () => {
        let s = dispatch(state, { type: 'ADD_SHEET' });
        const sheetToDelete = s.workbook.sheets[0].id;
        s = dispatch(s, { type: 'DELETE_SHEET', sheetId: sheetToDelete });
        expect(s.workbook.sheets.length).toBe(1);
    });

    it('DELETE_SHEET cannot delete last sheet', () => {
        const sheetId = state.workbook.sheets[0].id;
        const s = dispatch(state, { type: 'DELETE_SHEET', sheetId });
        expect(s.workbook.sheets.length).toBe(1);
    });

    it('DELETE_SHEET active sheet switches to first remaining', () => {
        let s = dispatch(state, { type: 'ADD_SHEET' });
        const activeId = s.workbook.activeSheetId;
        s = dispatch(s, { type: 'DELETE_SHEET', sheetId: activeId });
        expect(s.workbook.activeSheetId).toBe(s.workbook.sheets[0].id);
    });

    it('DELETE_SHEET non-active sheet keeps current active', () => {
        let s = dispatch(state, { type: 'ADD_SHEET' });
        const firstSheetId = s.workbook.sheets[0].id;
        const activeId = s.workbook.activeSheetId;
        s = dispatch(s, { type: 'DELETE_SHEET', sheetId: firstSheetId });
        expect(s.workbook.activeSheetId).toBe(activeId);
    });

    it('RENAME_SHEET updates the name', () => {
        const sheetId = state.workbook.sheets[0].id;
        const s = dispatch(state, { type: 'RENAME_SHEET', sheetId, name: 'My Data' });
        expect(s.workbook.sheets[0].name).toBe('My Data');
    });

    it('RENAME_SHEET with empty string preserves old name', () => {
        const sheetId = state.workbook.sheets[0].id;
        const s = dispatch(state, { type: 'RENAME_SHEET', sheetId, name: '' });
        expect(s.workbook.sheets[0].name).toBe('Sheet1');
    });

    it('SWITCH_SHEET changes active sheet', () => {
        let s = dispatch(state, { type: 'ADD_SHEET' });
        const firstId = s.workbook.sheets[0].id;
        s = dispatch(s, { type: 'SWITCH_SHEET', sheetId: firstId });
        expect(s.workbook.activeSheetId).toBe(firstId);
    });

    it('SWITCH_SHEET to already active is no-op', () => {
        const activeId = state.workbook.activeSheetId;
        const s = dispatch(state, { type: 'SWITCH_SHEET', sheetId: activeId });
        expect(s).toBe(state);
    });

    it('SWITCH_SHEET resets selection and mode', () => {
        let s = dispatch(state, { type: 'ADD_SHEET' });
        s = dispatch(s, {
            type: 'SET_SELECTION',
            range: { startCol: 0, startRow: 0, endCol: 3, endRow: 3 },
        });
        s = dispatch(s, { type: 'SWITCH_SHEET', sheetId: s.workbook.sheets[0].id });
        expect(s.selection).toBeNull();
        expect(s.mode).toBe('VIEWING');
    });

    it('Add → Delete → Add renumbering: Sheet2 deleted, new sheet named Sheet2', () => {
        let s = dispatch(state, { type: 'ADD_SHEET' }); // Sheet2
        expect(s.workbook.sheets[1].name).toBe('Sheet2');
        const sheet2Id = s.workbook.sheets[1].id;
        s = dispatch(s, { type: 'DELETE_SHEET', sheetId: sheet2Id });
        s = dispatch(s, { type: 'ADD_SHEET' }); // Should be Sheet2 again (count = 1 + 1)
        expect(s.workbook.sheets[1].name).toBe('Sheet2');
    });

    it('data isolation between sheets', () => {
        let s = setCell(state, 0, 0, 'Sheet1Data');
        s = dispatch(s, { type: 'ADD_SHEET' });
        const sheet2 = getActiveSheet(s);
        expect(sheet2.cells[cellKey(0, 0)]).toBeUndefined();
    });
});

// ═══════════════════════════════════════════════════════════════════
// FIND & REPLACE
// ═══════════════════════════════════════════════════════════════════
describe('Reducer — Find & Replace', () => {
    let state: SpreadsheetState;
    beforeEach(() => {
        state = createInitialState();
        state = setCell(state, 0, 0, 'hello');
        state = setCell(state, 1, 0, 'world');
        state = setCell(state, 0, 1, 'hello world');
        state = setCell(state, 1, 1, 'HELLO');
    });

    it('TOGGLE_FIND_DIALOG opens dialog', () => {
        const s = dispatch(state, { type: 'TOGGLE_FIND_DIALOG' });
        expect(s.findReplace.isOpen).toBe(true);
    });

    it('TOGGLE_FIND_DIALOG closes and resets', () => {
        let s = dispatch(state, { type: 'TOGGLE_FIND_DIALOG' });
        s = dispatch(s, { type: 'FIND_SET_SEARCH', searchTerm: 'test' });
        s = dispatch(s, { type: 'TOGGLE_FIND_DIALOG' });
        expect(s.findReplace.isOpen).toBe(false);
        expect(s.findReplace.searchTerm).toBe('');
    });

    it('FIND_SET_SEARCH finds matching cells', () => {
        let s = dispatch(state, { type: 'TOGGLE_FIND_DIALOG' });
        s = dispatch(s, { type: 'FIND_SET_SEARCH', searchTerm: 'hello' });
        // Should match: hello, hello world, HELLO (case-insensitive)
        expect(s.findReplace.matches.length).toBe(3);
    });

    it('search is case-insensitive', () => {
        let s = dispatch(state, { type: 'TOGGLE_FIND_DIALOG' });
        s = dispatch(s, { type: 'FIND_SET_SEARCH', searchTerm: 'HELLO' });
        expect(s.findReplace.matches.length).toBe(3);
    });

    it('search with no results', () => {
        let s = dispatch(state, { type: 'TOGGLE_FIND_DIALOG' });
        s = dispatch(s, { type: 'FIND_SET_SEARCH', searchTerm: 'zzzzz' });
        expect(s.findReplace.matches.length).toBe(0);
        expect(s.findReplace.activeMatchIndex).toBe(-1);
    });

    it('FIND_NEXT advances to next match', () => {
        let s = dispatch(state, { type: 'TOGGLE_FIND_DIALOG' });
        s = dispatch(s, { type: 'FIND_SET_SEARCH', searchTerm: 'hello' });
        const idx0 = s.findReplace.activeMatchIndex;
        s = dispatch(s, { type: 'FIND_NEXT' });
        expect(s.findReplace.activeMatchIndex).toBe(idx0 + 1);
    });

    it('FIND_NEXT wraps around', () => {
        let s = dispatch(state, { type: 'TOGGLE_FIND_DIALOG' });
        s = dispatch(s, { type: 'FIND_SET_SEARCH', searchTerm: 'hello' });
        const count = s.findReplace.matches.length;
        for (let i = 0; i < count; i++) {
            s = dispatch(s, { type: 'FIND_NEXT' });
        }
        expect(s.findReplace.activeMatchIndex).toBe(0);
    });

    it('FIND_PREV goes backward', () => {
        let s = dispatch(state, { type: 'TOGGLE_FIND_DIALOG' });
        s = dispatch(s, { type: 'FIND_SET_SEARCH', searchTerm: 'hello' });
        s = dispatch(s, { type: 'FIND_NEXT' });
        s = dispatch(s, { type: 'FIND_NEXT' });
        s = dispatch(s, { type: 'FIND_PREV' });
        expect(s.findReplace.activeMatchIndex).toBe(1);
    });

    it('FIND_PREV wraps around', () => {
        let s = dispatch(state, { type: 'TOGGLE_FIND_DIALOG' });
        s = dispatch(s, { type: 'FIND_SET_SEARCH', searchTerm: 'hello' });
        // activeMatchIndex starts at 0, going prev should wrap to last
        s = dispatch(s, { type: 'FIND_PREV' });
        expect(s.findReplace.activeMatchIndex).toBe(s.findReplace.matches.length - 1);
    });

    it('REPLACE_CURRENT replaces the active match', () => {
        let s = dispatch(state, { type: 'TOGGLE_FIND_DIALOG' });
        s = dispatch(s, { type: 'FIND_SET_SEARCH', searchTerm: 'hello' });
        s = dispatch(s, { type: 'FIND_SET_REPLACE', replaceTerm: 'hi' });
        const match = s.findReplace.matches[s.findReplace.activeMatchIndex];
        s = dispatch(s, { type: 'REPLACE_CURRENT' });
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(match.col, match.row)];
        expect(String(cell?.value)).toContain('hi');
    });

    it('REPLACE_ALL replaces all matches', () => {
        let s = dispatch(state, { type: 'TOGGLE_FIND_DIALOG' });
        s = dispatch(s, { type: 'FIND_SET_SEARCH', searchTerm: 'world' });
        s = dispatch(s, { type: 'FIND_SET_REPLACE', replaceTerm: 'earth' });
        s = dispatch(s, { type: 'REPLACE_ALL' });
        expect(s.findReplace.matches.length).toBe(0);
    });

    it('REPLACE_ALL with no matches is no-op', () => {
        let s = dispatch(state, { type: 'TOGGLE_FIND_DIALOG' });
        s = dispatch(s, { type: 'FIND_SET_SEARCH', searchTerm: 'zzzzz' });
        const before = s;
        s = dispatch(s, { type: 'REPLACE_ALL' });
        expect(s).toBe(before);
    });

    it('FIND_NEXT with no matches is no-op', () => {
        let s = dispatch(state, { type: 'TOGGLE_FIND_DIALOG' });
        s = dispatch(s, { type: 'FIND_SET_SEARCH', searchTerm: 'zzzzz' });
        const before = s;
        s = dispatch(s, { type: 'FIND_NEXT' });
        expect(s).toBe(before);
    });
});

// ═══════════════════════════════════════════════════════════════════
// CONDITIONAL FORMATTING
// ═══════════════════════════════════════════════════════════════════
describe('Reducer — Conditional Formatting', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('TOGGLE_COND_FORMAT_DIALOG toggles flag', () => {
        let s = dispatch(state, { type: 'TOGGLE_COND_FORMAT_DIALOG' });
        expect(s.showCondFormatDialog).toBe(true);
        s = dispatch(s, { type: 'TOGGLE_COND_FORMAT_DIALOG' });
        expect(s.showCondFormatDialog).toBe(false);
    });

    it('ADD_CONDITIONAL_RULE adds rule to sheet', () => {
        const rule: ConditionalRule = {
            id: 'test-rule',
            range: { startCol: 0, startRow: 0, endCol: 2, endRow: 2 },
            condition: 'greater',
            value1: '10',
            format: { backgroundColor: '#ff0000' },
        };
        const s = dispatch(state, { type: 'ADD_CONDITIONAL_RULE', rule });
        const sheet = getActiveSheet(s);
        expect(sheet.conditionalRules?.length).toBe(1);
        expect(sheet.conditionalRules?.[0].id).toBe('test-rule');
    });

    it('ADD_CONDITIONAL_RULE "between" includes value2', () => {
        const rule: ConditionalRule = {
            id: 'between-rule',
            range: { startCol: 0, startRow: 0, endCol: 0, endRow: 0 },
            condition: 'between',
            value1: '5',
            value2: '15',
            format: { backgroundColor: '#00ff00' },
        };
        const s = dispatch(state, { type: 'ADD_CONDITIONAL_RULE', rule });
        const sheet = getActiveSheet(s);
        expect(sheet.conditionalRules?.[0].value2).toBe('15');
    });

    it('DELETE_CONDITIONAL_RULE removes rule by ID', () => {
        const rule: ConditionalRule = {
            id: 'to-delete',
            range: { startCol: 0, startRow: 0, endCol: 0, endRow: 0 },
            condition: 'equal',
            value1: '5',
            format: { fontColor: '#000000' },
        };
        let s = dispatch(state, { type: 'ADD_CONDITIONAL_RULE', rule });
        s = dispatch(s, { type: 'DELETE_CONDITIONAL_RULE', ruleId: 'to-delete' });
        const sheet = getActiveSheet(s);
        expect(sheet.conditionalRules?.length).toBe(0);
    });

    it('DELETE_CONDITIONAL_RULE with non-existent ID is safe', () => {
        const s = dispatch(state, { type: 'DELETE_CONDITIONAL_RULE', ruleId: 'nonexistent' });
        const sheet = getActiveSheet(s);
        expect(sheet.conditionalRules?.length).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════════
// CSV IMPORT
// ═══════════════════════════════════════════════════════════════════
describe('Reducer — IMPORT_CSV', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('imports simple CSV', () => {
        const s = dispatch(state, { type: 'IMPORT_CSV', csv: 'A,B,C\n1,2,3' });
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(0, 0)]?.value).toBe('A');
        expect(sheet.cells[cellKey(1, 0)]?.value).toBe('B');
        expect(sheet.cells[cellKey(0, 1)]?.value).toBe(1);
    });

    it('imports CSV with quoted fields', () => {
        const s = dispatch(state, { type: 'IMPORT_CSV', csv: '"Hello, world",B\n1,2' });
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(0, 0)]?.value).toBe('Hello, world');
    });

    it('import clears existing data', () => {
        let s = setCell(state, 5, 5, 'old data');
        s = dispatch(s, { type: 'IMPORT_CSV', csv: 'new' });
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(5, 5)]).toBeUndefined();
        expect(sheet.cells[cellKey(0, 0)]?.value).toBe('new');
    });
});

// ═══════════════════════════════════════════════════════════════════
// FREEZE ROWS
// ═══════════════════════════════════════════════════════════════════
describe('Reducer — TOGGLE_FREEZE_ROW', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('freezes from row 0 sets frozenRows to 1', () => {
        const s = dispatch(state, { type: 'TOGGLE_FREEZE_ROW' });
        const sheet = getActiveSheet(s);
        expect(sheet.frozenRows).toBe(1);
    });

    it('freezes from row 5 sets frozenRows to 6', () => {
        let s = dispatch(state, { type: 'SELECT_CELL', col: 0, row: 5 });
        s = dispatch(s, { type: 'TOGGLE_FREEZE_ROW' });
        const sheet = getActiveSheet(s);
        expect(sheet.frozenRows).toBe(6);
    });

    it('toggle freeze off', () => {
        let s = dispatch(state, { type: 'TOGGLE_FREEZE_ROW' });
        s = dispatch(s, { type: 'TOGGLE_FREEZE_ROW' });
        const sheet = getActiveSheet(s);
        expect(sheet.frozenRows).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════════
// RESTORE_WORKBOOK
// ═══════════════════════════════════════════════════════════════════
describe('Reducer — RESTORE_WORKBOOK', () => {
    it('restores workbook and resets UI state', () => {
        const state = createInitialState();
        const workbook = {
            sheets: [{ id: 'restored', name: 'Restored', cells: {}, columnWidths: {}, rowHeights: {} }],
            activeSheetId: 'restored',
            settings: { theme: 'dark' as const },
        };
        const s = dispatch(state, { type: 'RESTORE_WORKBOOK', workbook });
        expect(s.workbook.sheets[0].name).toBe('Restored');
        expect(s.mode).toBe('VIEWING');
        expect(s.selection).toBeNull();
        expect(s.saveStatus).toBe('saved');
    });

    it('ensures conditionalRules and frozenRows default values', () => {
        const state = createInitialState();
        const workbook = {
            sheets: [{ id: 'r', name: 'R', cells: {}, columnWidths: {}, rowHeights: {} }],
            activeSheetId: 'r',
            settings: { theme: 'light' as const },
        };
        const s = dispatch(state, { type: 'RESTORE_WORKBOOK', workbook });
        const sheet = getActiveSheet(s);
        expect(sheet.conditionalRules).toEqual([]);
        expect(sheet.frozenRows).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════════
// determineCellDataType
// ═══════════════════════════════════════════════════════════════════
describe('determineCellDataType', () => {
    it('returns "empty" for empty string', () => {
        expect(determineCellDataType('')).toBe('empty');
    });

    it('returns "text" for plain text', () => {
        expect(determineCellDataType('hello')).toBe('text');
    });

    it('returns "number" for integer', () => {
        expect(determineCellDataType('42')).toBe('number');
    });

    it('returns "number" for decimal', () => {
        expect(determineCellDataType('3.14')).toBe('number');
    });

    it('returns "currency" for $100', () => {
        expect(determineCellDataType('$100')).toBe('currency');
    });

    it('returns "currency" for €50', () => {
        expect(determineCellDataType('€50')).toBe('currency');
    });

    it('returns "currency" for £25', () => {
        expect(determineCellDataType('£25')).toBe('currency');
    });

    it('returns "percentage" for 50%', () => {
        expect(determineCellDataType('50%')).toBe('percentage');
    });

    it('returns "percentage" for -25%', () => {
        expect(determineCellDataType('-25%')).toBe('percentage');
    });

    it('returns "date" for 2025-01-01', () => {
        expect(determineCellDataType('2025-01-01')).toBe('date');
    });

    it('returns "date" for 01/15/2025', () => {
        expect(determineCellDataType('01/15/2025')).toBe('date');
    });
});

// ═══════════════════════════════════════════════════════════════════
// parseCSV / parseTSV
// ═══════════════════════════════════════════════════════════════════
describe('parseCSV', () => {
    it('parses simple rows', () => {
        expect(parseCSV('a,b,c\n1,2,3')).toEqual([['a', 'b', 'c'], ['1', '2', '3']]);
    });

    it('handles quoted fields with commas', () => {
        expect(parseCSV('"Hello, world",B')).toEqual([['Hello, world', 'B']]);
    });

    it('handles escaped quotes ""', () => {
        expect(parseCSV('"He said ""hi""",B')).toEqual([['He said "hi"', 'B']]);
    });

    it('handles CRLF line endings', () => {
        const result = parseCSV('a,b\r\n1,2');
        expect(result).toEqual([['a', 'b'], ['1', '2']]);
    });

    it('handles empty input', () => {
        expect(parseCSV('')).toEqual([]);
    });
});

describe('parseTSV', () => {
    it('parses tab-separated values', () => {
        expect(parseTSV('a\tb\n1\t2')).toEqual([['a', 'b'], ['1', '2']]);
    });

    it('filters empty lines', () => {
        expect(parseTSV('a\tb\n\n1\t2')).toEqual([['a', 'b'], ['1', '2']]);
    });
});
