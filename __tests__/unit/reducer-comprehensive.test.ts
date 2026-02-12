// ════════════════════════════════════════════════════════════════════
// Reducer — Comprehensive Tests
// Covers SET_SAVE_STATUS, formula recalc cascade, sheet name gaps,
// DELETE_SHEET last-sheet guard, IMPORT_CSV clears cells,
// TOGGLE_FREEZE_ROW toggle, SET_FORMAT on empty cell,
// conditional formatting, undo/redo mixed ops, and more
// ════════════════════════════════════════════════════════════════════

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
    return actions.reduce((s, a) => spreadsheetReducer(s, a), s);
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
// SET_SAVE_STATUS
// ═══════════════════════════════════════════════════════════════════

describe('Reducer — SET_SAVE_STATUS', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('sets status to saving', () => {
        const s = dispatch(state, { type: 'SET_SAVE_STATUS', status: 'saving' });
        expect(s.saveStatus).toBe('saving');
    });

    it('sets status to saved and updates lastSavedAt', () => {
        const before = Date.now();
        const s = dispatch(state, { type: 'SET_SAVE_STATUS', status: 'saved' });
        expect(s.saveStatus).toBe('saved');
        expect(s.lastSavedAt).toBeGreaterThanOrEqual(before);
    });

    it('sets status to error without changing lastSavedAt', () => {
        let s = dispatch(state, { type: 'SET_SAVE_STATUS', status: 'saved' });
        const savedAt = s.lastSavedAt;
        s = dispatch(s, { type: 'SET_SAVE_STATUS', status: 'error' });
        expect(s.saveStatus).toBe('error');
        expect(s.lastSavedAt).toBe(savedAt);
    });

    it('initial saveStatus is idle', () => {
        expect(state.saveStatus).toBe('idle');
        expect(state.lastSavedAt).toBeNull();
    });
});

// ═══════════════════════════════════════════════════════════════════
// COMMIT_EDIT — Formula Recalculation Cascade
// ═══════════════════════════════════════════════════════════════════

describe('Reducer — Formula Recalculation Cascade', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('changing a cell value triggers recalculation of dependent formulas', () => {
        // Set A1 = 10, A2 = =A1*2
        let s = setCell(state, 0, 0, '10');
        s = setCell(s, 0, 1, '=A1*2');
        let sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(0, 1)]?.displayValue).toBe('20');

        // Now change A1 to 5 via SET_CELL_VALUE
        s = dispatch(s, { type: 'SET_CELL_VALUE', col: 0, row: 0, value: '5' });
        sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(0, 1)]?.displayValue).toBe('10');
    });

    it('formula with SUM recalculates when underlying cells change', () => {
        let s = setCell(state, 0, 0, '1');
        s = setCell(s, 0, 1, '2');
        s = setCell(s, 0, 2, '=SUM(A1:A2)');
        let sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(0, 2)]?.displayValue).toBe('3');

        // Change A1 to 10
        s = dispatch(s, { type: 'SET_CELL_VALUE', col: 0, row: 0, value: '10' });
        sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(0, 2)]?.displayValue).toBe('12');
    });

    it('committing a formula evaluates it immediately', () => {
        let s = setCell(state, 0, 0, '42');
        s = setCell(s, 1, 0, '=A1+8');
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(1, 0)];
        expect(cell?.formula).toBe('=A1+8');
        expect(cell?.displayValue).toBe('50');
    });
});

// ═══════════════════════════════════════════════════════════════════
// ADD_SHEET — Gap-Filling Name Generation
// ═══════════════════════════════════════════════════════════════════

describe('Reducer — ADD_SHEET Name Gap-Filling', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('with Sheet1, adding a sheet creates Sheet2', () => {
        const s = dispatch(state, { type: 'ADD_SHEET' });
        expect(s.workbook.sheets[1].name).toBe('Sheet2');
    });

    it('Sheet1+Sheet3 → adds Sheet2 (fills gap)', () => {
        let s = dispatch(state, { type: 'ADD_SHEET' }); // Sheet2
        // Rename Sheet2 to Sheet3
        const sheet2Id = s.workbook.sheets[1].id;
        s = dispatch(s, { type: 'RENAME_SHEET', sheetId: sheet2Id, name: 'Sheet3' });
        // Now add another sheet — should create Sheet2 (fills the gap)
        s = dispatch(s, { type: 'ADD_SHEET' });
        const newSheet = s.workbook.sheets[2];
        expect(newSheet.name).toBe('Sheet2');
    });

    it('Sheet1+Sheet2+Sheet3 → adds Sheet4', () => {
        let s = dispatch(state, { type: 'ADD_SHEET' }); // Sheet2
        s = dispatch(s, { type: 'ADD_SHEET' }); // Sheet3
        s = dispatch(s, { type: 'ADD_SHEET' }); // Sheet4
        const newSheet = s.workbook.sheets[3];
        expect(newSheet.name).toBe('Sheet4');
    });
});

// ═══════════════════════════════════════════════════════════════════
// DELETE_SHEET — Last Sheet Guard
// ═══════════════════════════════════════════════════════════════════

describe('Reducer — DELETE_SHEET Last-Sheet Guard', () => {
    it('deleting the only sheet is a no-op', () => {
        const state = createInitialState();
        const sheetId = state.workbook.sheets[0].id;
        const s = dispatch(state, { type: 'DELETE_SHEET', sheetId });
        expect(s.workbook.sheets.length).toBe(1);
        expect(s).toBe(state); // Same reference = true no-op
    });
});

// ═══════════════════════════════════════════════════════════════════
// RENAME_SHEET — Edge Cases
// ═══════════════════════════════════════════════════════════════════

describe('Reducer — RENAME_SHEET Edge Cases', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('empty name preserves existing name', () => {
        const sheetId = state.workbook.sheets[0].id;
        const s = dispatch(state, { type: 'RENAME_SHEET', sheetId, name: '' });
        expect(s.workbook.sheets[0].name).toBe('Sheet1');
    });

    it('whitespace-only name is preserved (not treated as empty)', () => {
        const sheetId = state.workbook.sheets[0].id;
        const s = dispatch(state, { type: 'RENAME_SHEET', sheetId, name: '   ' });
        // The reducer checks `action.name || s.name`, so '   ' is truthy
        expect(s.workbook.sheets[0].name).toBe('   ');
    });

    it('renaming non-existent sheet changes nothing', () => {
        const s = dispatch(state, { type: 'RENAME_SHEET', sheetId: 'nonexistent', name: 'New Name' });
        expect(s.workbook.sheets[0].name).toBe('Sheet1');
    });
});

// ═══════════════════════════════════════════════════════════════════
// IMPORT_CSV — Clears Existing Data
// ═══════════════════════════════════════════════════════════════════

describe('Reducer — IMPORT_CSV', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('imports CSV and replaces existing cells', () => {
        let s = setCell(state, 0, 0, 'old data');
        s = setCell(s, 5, 5, 'also old');
        s = dispatch(s, { type: 'IMPORT_CSV', csv: 'A,B\n1,2' });
        const sheet = getActiveSheet(s);
        // Old data should be gone
        expect(sheet.cells[cellKey(5, 5)]).toBeUndefined();
        // New data should be present
        expect(sheet.cells[cellKey(0, 0)]?.value).toBe('A');
        expect(sheet.cells[cellKey(1, 0)]?.value).toBe('B');
        expect(sheet.cells[cellKey(0, 1)]?.value).toBe(1);
        expect(sheet.cells[cellKey(1, 1)]?.value).toBe(2);
    });

    it('empty CSV clears all cells', () => {
        let s = setCell(state, 0, 0, 'data');
        s = dispatch(s, { type: 'IMPORT_CSV', csv: '' });
        const sheet = getActiveSheet(s);
        expect(Object.keys(sheet.cells).length).toBe(0);
    });

    it('CSV with quoted fields', () => {
        const csv = '"hello, world","test"\n"escaped ""quotes""",value2';
        let s = dispatch(state, { type: 'IMPORT_CSV', csv });
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(0, 0)]?.value).toBe('hello, world');
        expect(sheet.cells[cellKey(0, 1)]?.value).toBe('escaped "quotes"');
    });

    it('IMPORT_CSV pushes undo entry', () => {
        const s = dispatch(state, { type: 'IMPORT_CSV', csv: 'A,B\n1,2' });
        expect(s.undoStack.length).toBe(1);
    });
});

// ═══════════════════════════════════════════════════════════════════
// TOGGLE_FREEZE_ROW
// ═══════════════════════════════════════════════════════════════════

describe('Reducer — TOGGLE_FREEZE_ROW', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('freezes at active row + 1', () => {
        let s = dispatch(state, { type: 'SELECT_CELL', col: 0, row: 2 });
        s = dispatch(s, { type: 'TOGGLE_FREEZE_ROW' });
        const sheet = getActiveSheet(s);
        expect(sheet.frozenRows).toBe(3); // row index 2 + 1
    });

    it('unfreezes when already frozen', () => {
        let s = dispatch(state, { type: 'SELECT_CELL', col: 0, row: 2 });
        s = dispatch(s, { type: 'TOGGLE_FREEZE_ROW' }); // freeze
        s = dispatch(s, { type: 'TOGGLE_FREEZE_ROW' }); // unfreeze
        const sheet = getActiveSheet(s);
        expect(sheet.frozenRows).toBe(0);
    });

    it('freezing at row 0 sets frozenRows to 1', () => {
        const s = dispatch(state, { type: 'TOGGLE_FREEZE_ROW' });
        const sheet = getActiveSheet(s);
        expect(sheet.frozenRows).toBe(1);
    });
});

// ═══════════════════════════════════════════════════════════════════
// SET_FORMAT — Empty Cell
// ═══════════════════════════════════════════════════════════════════

describe('Reducer — SET_FORMAT on Empty Cell', () => {
    it('creates cell with dataType empty and format', () => {
        const state = createInitialState();
        const s = dispatch(state, { type: 'SET_FORMAT', format: { bold: true } });
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(0, 0)];
        expect(cell).toBeDefined();
        expect(cell.format?.bold).toBe(true);
        expect(cell.dataType).toBe('empty');
        expect(cell.value).toBeNull();
    });

    it('preserves existing cell value when adding format', () => {
        let state = createInitialState();
        let s = setCell(state, 0, 0, '42');
        s = dispatch(s, { type: 'SELECT_CELL', col: 0, row: 0 });
        s = dispatch(s, { type: 'SET_FORMAT', format: { bold: true } });
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(0, 0)];
        expect(cell.value).toBe(42);
        expect(cell.format?.bold).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════
// PASTE — Formula Reference Adjustment
// ═══════════════════════════════════════════════════════════════════

describe('Reducer — PASTE Formula Reference Adjustment', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('paste formula =A1 from (0,0) to (1,1) becomes =B2', () => {
        let s = setCell(state, 0, 0, '=A1');
        s = dispatch(s, { type: 'SELECT_CELL', col: 0, row: 0 });
        s = dispatch(s, { type: 'COPY' });
        s = dispatch(s, { type: 'SELECT_CELL', col: 1, row: 1 });
        s = dispatch(s, { type: 'PASTE' });
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(1, 1)]?.formula).toBe('=B2');
    });

    it('paste absolute formula =$A$1 stays unchanged', () => {
        let s = setCell(state, 0, 0, '=$A$1');
        s = dispatch(s, { type: 'SELECT_CELL', col: 0, row: 0 });
        s = dispatch(s, { type: 'COPY' });
        s = dispatch(s, { type: 'SELECT_CELL', col: 3, row: 3 });
        s = dispatch(s, { type: 'PASTE' });
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(3, 3)]?.formula).toBe('=$A$1');
    });

    it('paste SUM formula adjusts range references', () => {
        let s = setCell(state, 0, 0, '=SUM(A1:A5)');
        s = dispatch(s, { type: 'SELECT_CELL', col: 0, row: 0 });
        s = dispatch(s, { type: 'COPY' });
        s = dispatch(s, { type: 'SELECT_CELL', col: 1, row: 0 });
        s = dispatch(s, { type: 'PASTE' });
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(1, 0)]?.formula).toBe('=SUM(B1:B5)');
    });
});

// ═══════════════════════════════════════════════════════════════════
// UPDATE_EDIT_BUFFER — Truncation
// ═══════════════════════════════════════════════════════════════════

describe('Reducer — UPDATE_EDIT_BUFFER Truncation', () => {
    it('truncates input at MAX_CELL_CHARS boundary', () => {
        let state = createInitialState();
        state = dispatch(state, { type: 'START_EDITING' });
        const longStr = 'a'.repeat(MAX_CELL_CHARS + 100);
        const s = dispatch(state, { type: 'UPDATE_EDIT_BUFFER', value: longStr });
        expect(s.editBuffer.length).toBe(MAX_CELL_CHARS);
    });

    it('allows input exactly at MAX_CELL_CHARS', () => {
        let state = createInitialState();
        state = dispatch(state, { type: 'START_EDITING' });
        const exactStr = 'b'.repeat(MAX_CELL_CHARS);
        const s = dispatch(state, { type: 'UPDATE_EDIT_BUFFER', value: exactStr });
        expect(s.editBuffer.length).toBe(MAX_CELL_CHARS);
    });
});

// ═══════════════════════════════════════════════════════════════════
// UNDO/REDO — Mixed Operations
// ═══════════════════════════════════════════════════════════════════

describe('Reducer — UNDO/REDO Mixed Operations', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('undo format then redo format', () => {
        let s = dispatch(state, { type: 'SET_FORMAT', format: { bold: true } });
        const sheet1 = getActiveSheet(s);
        expect(sheet1.cells[cellKey(0, 0)]?.format?.bold).toBe(true);

        s = dispatch(s, { type: 'UNDO' });
        const sheet2 = getActiveSheet(s);
        expect(sheet2.cells[cellKey(0, 0)]).toBeUndefined();

        s = dispatch(s, { type: 'REDO' });
        const sheet3 = getActiveSheet(s);
        expect(sheet3.cells[cellKey(0, 0)]?.format?.bold).toBe(true);
    });

    it('undo edit + undo format in sequence', () => {
        let s = setCell(state, 0, 0, 'hello'); // undo entry 1
        s = dispatch(s, { type: 'SET_FORMAT', format: { bold: true } }); // undo entry 2

        s = dispatch(s, { type: 'UNDO' }); // undo format
        const sheet1 = getActiveSheet(s);
        // Cell should have value but no bold format
        expect(sheet1.cells[cellKey(0, 0)]?.value).toBe('hello');
        // After undo, format should be gone (reverted to before SET_FORMAT)
        expect(sheet1.cells[cellKey(0, 0)]?.format?.bold).toBeUndefined();

        s = dispatch(s, { type: 'UNDO' }); // undo edit
        const sheet2 = getActiveSheet(s);
        expect(sheet2.cells[cellKey(0, 0)]).toBeUndefined();
    });

    it('undo resize then redo resize', () => {
        let s = dispatch(state, { type: 'RESIZE_COLUMN', col: 0, width: 250 });
        expect(getActiveSheet(s).columnWidths[0]).toBe(250);

        s = dispatch(s, { type: 'UNDO' });
        expect(getActiveSheet(s).columnWidths[0]).toBe(100);

        s = dispatch(s, { type: 'REDO' });
        expect(getActiveSheet(s).columnWidths[0]).toBe(250);
    });
});

// ═══════════════════════════════════════════════════════════════════
// COMMIT_EDIT — Whitespace Edge Cases
// ═══════════════════════════════════════════════════════════════════

describe('Reducer — COMMIT_EDIT Whitespace', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('whitespace-only input treated as empty cell', () => {
        const s = setCell(state, 0, 0, '   ');
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(0, 0)]).toBeUndefined();
    });

    it('tabs-only input treated as empty cell', () => {
        const s = setCell(state, 0, 0, '\t\t');
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(0, 0)]).toBeUndefined();
    });
});

// ═══════════════════════════════════════════════════════════════════
// SET_CELL_VALUE with Formula Recalc
// ═══════════════════════════════════════════════════════════════════

describe('Reducer — SET_CELL_VALUE triggers recalculation', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('updating cell referenced by formula recalculates formula', () => {
        let s = setCell(state, 0, 0, '10');
        s = setCell(s, 1, 0, '=A1+5');
        let sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(1, 0)]?.displayValue).toBe('15');

        // Update A1 via SET_CELL_VALUE
        s = dispatch(s, { type: 'SET_CELL_VALUE', col: 0, row: 0, value: '20' });
        sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(1, 0)]?.displayValue).toBe('25');
    });

    it('clearing a cell via SET_CELL_VALUE triggers recalc', () => {
        let s = setCell(state, 0, 0, '100');
        s = setCell(s, 1, 0, '=A1');
        let sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(1, 0)]?.displayValue).toBe('100');

        // Clear A1
        s = dispatch(s, { type: 'SET_CELL_VALUE', col: 0, row: 0, value: '' });
        sheet = getActiveSheet(s);
        // Formula referencing empty cell returns 0
        expect(sheet.cells[cellKey(1, 0)]?.displayValue).toBe('0');
    });
});

// ═══════════════════════════════════════════════════════════════════
// CONDITIONAL FORMATTING
// ═══════════════════════════════════════════════════════════════════

describe('Reducer — Conditional Formatting', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('ADD_CONDITIONAL_RULE adds rule to active sheet', () => {
        const rule: ConditionalRule = {
            id: 'rule1',
            range: { startCol: 0, startRow: 0, endCol: 5, endRow: 5 },
            condition: 'greaterThan',
            value: '10',
            format: { backgroundColor: '#ff0000' },
        };
        const s = dispatch(state, { type: 'ADD_CONDITIONAL_RULE', rule });
        const sheet = getActiveSheet(s);
        expect(sheet.conditionalRules.length).toBe(1);
        expect(sheet.conditionalRules[0].id).toBe('rule1');
    });

    it('DELETE_CONDITIONAL_RULE removes rule by ID', () => {
        const rule: ConditionalRule = {
            id: 'rule1',
            range: { startCol: 0, startRow: 0, endCol: 5, endRow: 5 },
            condition: 'greaterThan',
            value: '10',
            format: { backgroundColor: '#ff0000' },
        };
        let s = dispatch(state, { type: 'ADD_CONDITIONAL_RULE', rule });
        s = dispatch(s, { type: 'DELETE_CONDITIONAL_RULE', ruleId: 'rule1' });
        const sheet = getActiveSheet(s);
        expect(sheet.conditionalRules.length).toBe(0);
    });

    it('deleting non-existent rule is safe', () => {
        const s = dispatch(state, { type: 'DELETE_CONDITIONAL_RULE', ruleId: 'nonexistent' });
        const sheet = getActiveSheet(s);
        expect(sheet.conditionalRules.length).toBe(0);
    });

    it('TOGGLE_COND_FORMAT_DIALOG toggles the dialog', () => {
        expect(state.showCondFormatDialog).toBe(false);
        let s = dispatch(state, { type: 'TOGGLE_COND_FORMAT_DIALOG' });
        expect(s.showCondFormatDialog).toBe(true);
        s = dispatch(s, { type: 'TOGGLE_COND_FORMAT_DIALOG' });
        expect(s.showCondFormatDialog).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════
// SWITCH_SHEET — Edge Cases
// ═══════════════════════════════════════════════════════════════════

describe('Reducer — SWITCH_SHEET Edge Cases', () => {
    it('switching to same sheet is no-op', () => {
        const state = createInitialState();
        const activeId = state.workbook.activeSheetId;
        const s = dispatch(state, { type: 'SWITCH_SHEET', sheetId: activeId });
        expect(s).toBe(state);
    });

    it('switching sheet resets active cell to A1', () => {
        let state = createInitialState();
        let s = dispatch(state, { type: 'SELECT_CELL', col: 5, row: 5 });
        s = dispatch(s, { type: 'ADD_SHEET' });
        const firstSheetId = s.workbook.sheets[0].id;
        s = dispatch(s, { type: 'SWITCH_SHEET', sheetId: firstSheetId });
        expect(s.activeCell.col).toBe(0);
        expect(s.activeCell.row).toBe(0);
    });

    it('switching sheet clears undo/redo stacks', () => {
        let state = createInitialState();
        let s = setCell(state, 0, 0, 'data');
        expect(s.undoStack.length).toBeGreaterThan(0);
        s = dispatch(s, { type: 'ADD_SHEET' });
        const firstSheetId = s.workbook.sheets[0].id;
        s = dispatch(s, { type: 'SWITCH_SHEET', sheetId: firstSheetId });
        expect(s.undoStack.length).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════════
// FIND/REPLACE — Additional Edge Cases
// ═══════════════════════════════════════════════════════════════════

describe('Reducer — Find/Replace Comprehensive', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('TOGGLE_FIND_DIALOG opens and closes', () => {
        let s = dispatch(state, { type: 'TOGGLE_FIND_DIALOG' });
        expect(s.findReplace.isOpen).toBe(true);
        s = dispatch(s, { type: 'TOGGLE_FIND_DIALOG' });
        expect(s.findReplace.isOpen).toBe(false);
    });

    it('closing dialog resets search state', () => {
        let s = dispatch(state, { type: 'TOGGLE_FIND_DIALOG' });
        s = dispatch(s, { type: 'FIND_SET_SEARCH', searchTerm: 'test' });
        s = dispatch(s, { type: 'TOGGLE_FIND_DIALOG' }); // close
        expect(s.findReplace.searchTerm).toBe('');
        expect(s.findReplace.matches.length).toBe(0);
    });

    it('FIND_NEXT wraps around matches', () => {
        let s = setCell(state, 0, 0, 'test');
        s = setCell(s, 0, 1, 'test');
        s = dispatch(s, { type: 'TOGGLE_FIND_DIALOG' });
        s = dispatch(s, { type: 'FIND_SET_SEARCH', searchTerm: 'test' });
        expect(s.findReplace.matches.length).toBe(2);
        expect(s.findReplace.activeMatchIndex).toBe(0);

        s = dispatch(s, { type: 'FIND_NEXT' });
        expect(s.findReplace.activeMatchIndex).toBe(1);

        s = dispatch(s, { type: 'FIND_NEXT' }); // wraps
        expect(s.findReplace.activeMatchIndex).toBe(0);
    });

    it('FIND_PREV wraps around', () => {
        let s = setCell(state, 0, 0, 'test');
        s = setCell(s, 0, 1, 'test');
        s = dispatch(s, { type: 'TOGGLE_FIND_DIALOG' });
        s = dispatch(s, { type: 'FIND_SET_SEARCH', searchTerm: 'test' });

        s = dispatch(s, { type: 'FIND_PREV' }); // wraps to last
        expect(s.findReplace.activeMatchIndex).toBe(1);
    });

    it('REPLACE_ALL replaces all occurrences', () => {
        let s = setCell(state, 0, 0, 'hello');
        s = setCell(s, 1, 0, 'hello world');
        s = dispatch(s, { type: 'TOGGLE_FIND_DIALOG' });
        s = dispatch(s, { type: 'FIND_SET_SEARCH', searchTerm: 'hello' });
        s = dispatch(s, { type: 'FIND_SET_REPLACE', replaceTerm: 'bye' });
        s = dispatch(s, { type: 'REPLACE_ALL' });

        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(0, 0)]?.value).toBe('bye');
        expect(sheet.cells[cellKey(1, 0)]?.value).toBe('bye world');
    });

    it('FIND_NEXT with no matches is no-op', () => {
        let s = dispatch(state, { type: 'TOGGLE_FIND_DIALOG' });
        s = dispatch(s, { type: 'FIND_SET_SEARCH', searchTerm: 'nonexistent' });
        const before = { ...s.findReplace };
        s = dispatch(s, { type: 'FIND_NEXT' });
        expect(s.findReplace.activeMatchIndex).toBe(before.activeMatchIndex);
    });
});

// ═══════════════════════════════════════════════════════════════════
// RESTORE_WORKBOOK
// ═══════════════════════════════════════════════════════════════════

describe('Reducer — RESTORE_WORKBOOK', () => {
    it('restores workbook and resets to A1 in VIEWING mode', () => {
        let state = createInitialState();
        const workbook = createInitialState().workbook;
        let s = dispatch(state, { type: 'SELECT_CELL', col: 5, row: 5 });
        s = dispatch(s, { type: 'RESTORE_WORKBOOK', workbook });
        expect(s.activeCell.col).toBe(0);
        expect(s.activeCell.row).toBe(0);
        expect(s.mode).toBe('VIEWING');
        expect(s.saveStatus).toBe('saved');
    });

    it('ensures restored sheets have conditionalRules and frozenRows', () => {
        const state = createInitialState();
        const workbook = {
            ...state.workbook,
            sheets: state.workbook.sheets.map(s => {
                const { conditionalRules, frozenRows, ...rest } = s;
                return rest as any;
            }),
        };
        const s = dispatch(state, { type: 'RESTORE_WORKBOOK', workbook });
        const sheet = getActiveSheet(s);
        expect(sheet.conditionalRules).toEqual([]);
        expect(sheet.frozenRows).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════════
// determineCellDataType — Additional Cases
// ═══════════════════════════════════════════════════════════════════

describe('determineCellDataType — Comprehensive', () => {
    it('empty string → empty', () => expect(determineCellDataType('')).toBe('empty'));
    it('plain text → text', () => expect(determineCellDataType('hello')).toBe('text'));
    it('integer → number', () => expect(determineCellDataType('42')).toBe('number'));
    it('negative number → number', () => expect(determineCellDataType('-3.14')).toBe('number'));
    it('decimal → number', () => expect(determineCellDataType('0.5')).toBe('number'));
    it('USD currency → currency', () => expect(determineCellDataType('$100')).toBe('currency'));
    it('EUR currency → currency', () => expect(determineCellDataType('€50')).toBe('currency'));
    it('GBP currency → currency', () => expect(determineCellDataType('£75')).toBe('currency'));
    it('JPY currency → currency', () => expect(determineCellDataType('¥1000')).toBe('currency'));
    it('trailing currency → currency', () => expect(determineCellDataType('100$')).toBe('currency'));
    it('percentage → percentage', () => expect(determineCellDataType('50%')).toBe('percentage'));
    it('negative percentage → percentage', () => expect(determineCellDataType('-25%')).toBe('percentage'));
    it('decimal percentage → percentage', () => expect(determineCellDataType('3.5%')).toBe('percentage'));
    it('ISO date → date', () => expect(determineCellDataType('2025-01-01')).toBe('date'));
    it('US date → date', () => expect(determineCellDataType('1/15/2025')).toBe('date'));
    it('short US date → date', () => expect(determineCellDataType('1/1/2025')).toBe('date'));
    it('whitespace number → number', () => expect(determineCellDataType(' 42 ')).toBe('number'));
    it('number with leading zeros → number', () => expect(determineCellDataType('007')).toBe('number'));
});
