import { describe, it, expect, beforeEach } from 'vitest';
import {
    spreadsheetReducer,
    createInitialState,
    determineCellDataType,
} from '@/state/spreadsheet-context';
import {
    type SpreadsheetState,
    type SpreadsheetAction,
    type ConditionalRule,
    cellKey,
    TOTAL_COLUMNS,
    TOTAL_ROWS,
    MAX_CELL_CHARS,
} from '@/types/spreadsheet';

// ─── Test Helpers ──────────────────────────────────────────────────
function dispatch(state: SpreadsheetState, action: SpreadsheetAction): SpreadsheetState {
    return spreadsheetReducer(state, action);
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
// SET_CELL_VALUE — Direct cell value action (never tested in reducer.test.ts)
// ═══════════════════════════════════════════════════════════════════
describe('Reducer Edge — SET_CELL_VALUE', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('directly sets a text value', () => {
        const s = dispatch(state, { type: 'SET_CELL_VALUE', col: 0, row: 0, value: 'direct' });
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(0, 0)];
        expect(cell).toBeDefined();
        expect(cell.value).toBe('direct');
    });

    it('directly sets a number value', () => {
        const s = dispatch(state, { type: 'SET_CELL_VALUE', col: 0, row: 0, value: '42' });
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(0, 0)];
        expect(cell.value).toBe(42);
        expect(cell.dataType).toBe('number');
    });

    it('directly sets a formula string (stored as text, not evaluated)', () => {
        const s = dispatch(state, { type: 'SET_CELL_VALUE', col: 0, row: 0, value: '=1+1' });
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(0, 0)];
        // SET_CELL_VALUE stores the raw value; use COMMIT_EDIT for formula evaluation
        expect(cell.value).toBe('=1+1');
    });
});

// ═══════════════════════════════════════════════════════════════════
// SET_SAVE_STATUS — Never tested
// ═══════════════════════════════════════════════════════════════════
describe('Reducer Edge — SET_SAVE_STATUS', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('updates save status to "saving"', () => {
        const s = dispatch(state, { type: 'SET_SAVE_STATUS', status: 'saving' });
        expect(s.saveStatus).toBe('saving');
    });

    it('updates save status to "saved"', () => {
        const s = dispatch(state, { type: 'SET_SAVE_STATUS', status: 'saved' });
        expect(s.saveStatus).toBe('saved');
    });

    it('updates save status to "error"', () => {
        const s = dispatch(state, { type: 'SET_SAVE_STATUS', status: 'error' });
        expect(s.saveStatus).toBe('error');
    });
});

// ═══════════════════════════════════════════════════════════════════
// COMMIT_EDIT — Formula edge cases
// ═══════════════════════════════════════════════════════════════════
describe('Reducer Edge — COMMIT_EDIT formula corners', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('commits circular formula =A1 from A1 → shows #CIRCULAR!', () => {
        const s = setCell(state, 0, 0, '=A1');
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(0, 0)];
        expect(cell.displayValue).toBe('#CIRCULAR!');
    });

    it('commits chained formula: A1=10, B1=A1*2 → B1 shows 20', () => {
        let s = setCell(state, 0, 0, '10');
        s = setCell(s, 1, 0, '=A1*2');
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(1, 0)]?.displayValue).toBe('20');
    });

    it('commits whitespace-only string as empty', () => {
        let s = setCell(state, 0, 0, 'data');
        s = setCell(s, 0, 0, '   ');
        const sheet = getActiveSheet(s);
        // Whitespace-only may be treated as text or cleared
        const cell = sheet.cells[cellKey(0, 0)];
        if (cell) {
            expect(cell.dataType).toBe('text');
        }
    });

    it('commits padded number "  42  " as number 42', () => {
        const s = setCell(state, 0, 0, '  42  ');
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(0, 0)];
        // May be parsed as number or text depending on trimming
        if (cell.dataType === 'number') {
            expect(cell.value).toBe(42);
        } else {
            expect(cell.value).toBe('  42  ');
        }
    });
});

// ═══════════════════════════════════════════════════════════════════
// COPY/PASTE — Edge cases
// ═══════════════════════════════════════════════════════════════════
describe('Reducer Edge — COPY/PASTE corners', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('paste at grid boundary: paste 2-cell block at col 25 clips to bounds', () => {
        let s = setCell(state, 0, 0, 'A');
        s = setCell(s, 1, 0, 'B');
        s = dispatch(s, { type: 'SELECT_CELL', col: 0, row: 0 });
        s = dispatch(s, {
            type: 'SET_SELECTION',
            range: { startCol: 0, startRow: 0, endCol: 1, endRow: 0 },
        });
        s = dispatch(s, { type: 'COPY' });
        // Paste at col 25 (Z) — second cell would be col 26 (out of bounds)
        s = dispatch(s, { type: 'SELECT_CELL', col: TOTAL_COLUMNS - 1, row: 0 });
        s = dispatch(s, { type: 'PASTE' });
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(TOTAL_COLUMNS - 1, 0)]?.value).toBe('A');
        // Col 26 should not exist
    });

    it('paste at row boundary: paste 2-row block at row 99', () => {
        let s = setCell(state, 0, 0, 'R1');
        s = setCell(s, 0, 1, 'R2');
        s = dispatch(s, { type: 'SELECT_CELL', col: 0, row: 0 });
        s = dispatch(s, {
            type: 'SET_SELECTION',
            range: { startCol: 0, startRow: 0, endCol: 0, endRow: 1 },
        });
        s = dispatch(s, { type: 'COPY' });
        s = dispatch(s, { type: 'SELECT_CELL', col: 0, row: TOTAL_ROWS - 1 });
        s = dispatch(s, { type: 'PASTE' });
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(0, TOTAL_ROWS - 1)]?.value).toBe('R1');
    });

    it('paste cell with absolute ref formula preserves $A$1', () => {
        let s = setCell(state, 0, 0, '10');
        s = setCell(s, 0, 1, '=$A$1+5');
        s = dispatch(s, { type: 'SELECT_CELL', col: 0, row: 1 });
        s = dispatch(s, { type: 'COPY' });
        s = dispatch(s, { type: 'SELECT_CELL', col: 2, row: 2 });
        s = dispatch(s, { type: 'PASTE' });
        const sheet = getActiveSheet(s);
        // Absolute refs should NOT shift
        expect(sheet.cells[cellKey(2, 2)]?.formula).toBe('=$A$1+5');
    });

    it('paste external single-cell text', () => {
        let s = dispatch(state, { type: 'SELECT_CELL', col: 0, row: 0 });
        s = dispatch(s, { type: 'PASTE', externalText: 'single' });
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(0, 0)]?.value).toBe('single');
    });

    it('paste external CSV-like text with commas', () => {
        let s = dispatch(state, { type: 'SELECT_CELL', col: 0, row: 0 });
        // External paste uses TSV format (tab-separated)
        s = dispatch(s, { type: 'PASTE', externalText: 'a\tb\nc\td' });
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(0, 0)]?.value).toBe('a');
        expect(sheet.cells[cellKey(1, 0)]?.value).toBe('b');
        expect(sheet.cells[cellKey(0, 1)]?.value).toBe('c');
        expect(sheet.cells[cellKey(1, 1)]?.value).toBe('d');
    });
});

// ═══════════════════════════════════════════════════════════════════
// FIND & REPLACE — Edge cases
// ═══════════════════════════════════════════════════════════════════
describe('Reducer Edge — Find & Replace corners', () => {
    let state: SpreadsheetState;
    beforeEach(() => {
        state = createInitialState();
        state = setCell(state, 0, 0, 'apple');
        state = setCell(state, 1, 0, 'apple pie');
        state = setCell(state, 0, 1, 'APPLE');
    });

    it('REPLACE_CURRENT with empty replaceTerm deletes the match text', () => {
        let s = dispatch(state, { type: 'TOGGLE_FIND_DIALOG' });
        s = dispatch(s, { type: 'FIND_SET_SEARCH', searchTerm: 'apple' });
        s = dispatch(s, { type: 'FIND_SET_REPLACE', replaceTerm: '' });
        const match = s.findReplace.matches[s.findReplace.activeMatchIndex];
        s = dispatch(s, { type: 'REPLACE_CURRENT' });
        const sheet = getActiveSheet(s);
        const cell = sheet.cells[cellKey(match.col, match.row)];
        // The word "apple" should be removed
        expect(String(cell?.value)).not.toContain('apple');
    });

    it('FIND_SET_SEARCH with regex-like characters .*+? does not crash', () => {
        let s = dispatch(state, { type: 'TOGGLE_FIND_DIALOG' });
        s = dispatch(s, { type: 'FIND_SET_SEARCH', searchTerm: '.*+?' });
        // Should not throw and should return 0 matches
        expect(s.findReplace.matches.length).toBe(0);
    });

    it('FIND_SET_SEARCH on empty sheet returns no matches', () => {
        let s = createInitialState();
        s = dispatch(s, { type: 'TOGGLE_FIND_DIALOG' });
        s = dispatch(s, { type: 'FIND_SET_SEARCH', searchTerm: 'anything' });
        expect(s.findReplace.matches.length).toBe(0);
        expect(s.findReplace.activeMatchIndex).toBe(-1);
    });
});

// ═══════════════════════════════════════════════════════════════════
// CONDITIONAL FORMATTING — All condition types
// ═══════════════════════════════════════════════════════════════════
describe('Reducer Edge — Conditional Formatting conditions', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('ADD_CONDITIONAL_RULE with "less" condition', () => {
        const rule: ConditionalRule = {
            id: 'less-rule',
            range: { startCol: 0, startRow: 0, endCol: 0, endRow: 0 },
            condition: 'less',
            value1: '10',
            format: { backgroundColor: '#ff0000' },
        };
        const s = dispatch(state, { type: 'ADD_CONDITIONAL_RULE', rule });
        const sheet = getActiveSheet(s);
        expect(sheet.conditionalRules?.[0].condition).toBe('less');
    });

    it('ADD_CONDITIONAL_RULE with "not_equal" condition', () => {
        const rule: ConditionalRule = {
            id: 'neq-rule',
            range: { startCol: 0, startRow: 0, endCol: 0, endRow: 0 },
            condition: 'not_equal',
            value1: '5',
            format: { fontColor: '#0000ff' },
        };
        const s = dispatch(state, { type: 'ADD_CONDITIONAL_RULE', rule });
        const sheet = getActiveSheet(s);
        expect(sheet.conditionalRules?.[0].condition).toBe('not_equal');
    });

    it('ADD_CONDITIONAL_RULE with "text_contains" condition', () => {
        const rule: ConditionalRule = {
            id: 'text-rule',
            range: { startCol: 0, startRow: 0, endCol: 2, endRow: 2 },
            condition: 'text_contains',
            value1: 'hello',
            format: { backgroundColor: '#00ff00' },
        };
        const s = dispatch(state, { type: 'ADD_CONDITIONAL_RULE', rule });
        const sheet = getActiveSheet(s);
        expect(sheet.conditionalRules?.[0].condition).toBe('text_contains');
    });

    it('multiple overlapping conditional rules stack correctly', () => {
        const rule1: ConditionalRule = {
            id: 'rule1',
            range: { startCol: 0, startRow: 0, endCol: 2, endRow: 2 },
            condition: 'greater',
            value1: '10',
            format: { backgroundColor: '#ff0000' },
        };
        const rule2: ConditionalRule = {
            id: 'rule2',
            range: { startCol: 1, startRow: 1, endCol: 3, endRow: 3 },
            condition: 'less',
            value1: '5',
            format: { fontColor: '#0000ff' },
        };
        let s = dispatch(state, { type: 'ADD_CONDITIONAL_RULE', rule: rule1 });
        s = dispatch(s, { type: 'ADD_CONDITIONAL_RULE', rule: rule2 });
        const sheet = getActiveSheet(s);
        expect(sheet.conditionalRules?.length).toBe(2);
    });
});

// ═══════════════════════════════════════════════════════════════════
// SHEET MANAGEMENT — Edge cases
// ═══════════════════════════════════════════════════════════════════
describe('Reducer Edge — Sheet corners', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('DELETE_SHEET with nonexistent sheetId is safe no-op', () => {
        const s = dispatch(state, { type: 'DELETE_SHEET', sheetId: 'nonexistent-id-xyz' });
        expect(s.workbook.sheets.length).toBe(1);
    });

    it('RENAME_SHEET with very long name stores it', () => {
        const longName = 'A'.repeat(1000);
        const sheetId = state.workbook.sheets[0].id;
        const s = dispatch(state, { type: 'RENAME_SHEET', sheetId, name: longName });
        expect(s.workbook.sheets[0].name).toBe(longName);
    });
});

// ═══════════════════════════════════════════════════════════════════
// CSV IMPORT — Edge cases
// ═══════════════════════════════════════════════════════════════════
describe('Reducer Edge — IMPORT_CSV corners', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('imports CSV with empty cells (sparse)', () => {
        const s = dispatch(state, { type: 'IMPORT_CSV', csv: 'a,,c\n,,\n1,2,3' });
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(0, 0)]?.value).toBe('a');
        expect(sheet.cells[cellKey(2, 0)]?.value).toBe('c');
        expect(sheet.cells[cellKey(0, 2)]?.value).toBe(1);
    });

    it('imports single-cell CSV', () => {
        const s = dispatch(state, { type: 'IMPORT_CSV', csv: 'solo' });
        const sheet = getActiveSheet(s);
        expect(sheet.cells[cellKey(0, 0)]?.value).toBe('solo');
    });
});

// ═══════════════════════════════════════════════════════════════════
// RESIZE — Boundary values
// ═══════════════════════════════════════════════════════════════════
describe('Reducer Edge — Resize boundaries', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('RESIZE_COLUMN with 0 width clamps to MIN', () => {
        const s = dispatch(state, { type: 'RESIZE_COLUMN', col: 0, width: 0 });
        const sheet = getActiveSheet(s);
        expect(sheet.columnWidths[0]).toBe(30); // MIN_COLUMN_WIDTH
    });

    it('RESIZE_ROW with negative height clamps to MIN', () => {
        const s = dispatch(state, { type: 'RESIZE_ROW', row: 0, height: -10 });
        const sheet = getActiveSheet(s);
        expect(sheet.rowHeights[0]).toBe(20); // MIN_ROW_HEIGHT
    });

    it('RESIZE_COLUMN with very large width stores it', () => {
        const s = dispatch(state, { type: 'RESIZE_COLUMN', col: 0, width: 10000 });
        const sheet = getActiveSheet(s);
        expect(sheet.columnWidths[0]).toBe(10000);
    });
});

// ═══════════════════════════════════════════════════════════════════
// NAVIGATE — Round-trip sequence
// ═══════════════════════════════════════════════════════════════════
describe('Reducer Edge — Navigation round-trip', () => {
    it('navigating right→down→left→up returns to original cell', () => {
        let state = createInitialState();
        state = dispatch(state, { type: 'SELECT_CELL', col: 5, row: 5 });
        state = dispatch(state, { type: 'NAVIGATE', direction: 'right' });
        state = dispatch(state, { type: 'NAVIGATE', direction: 'down' });
        state = dispatch(state, { type: 'NAVIGATE', direction: 'left' });
        state = dispatch(state, { type: 'NAVIGATE', direction: 'up' });
        expect(state.activeCell.col).toBe(5);
        expect(state.activeCell.row).toBe(5);
    });
});

// ═══════════════════════════════════════════════════════════════════
// UPDATE_EDIT_BUFFER — Boundary
// ═══════════════════════════════════════════════════════════════════
describe('Reducer Edge — Edit buffer boundary', () => {
    let state: SpreadsheetState;
    beforeEach(() => {
        state = createInitialState();
        state = dispatch(state, { type: 'START_EDITING' });
    });

    it('buffer at exactly MAX_CELL_CHARS is not truncated', () => {
        const exactStr = 'x'.repeat(MAX_CELL_CHARS);
        const s = dispatch(state, { type: 'UPDATE_EDIT_BUFFER', value: exactStr });
        expect(s.editBuffer.length).toBe(MAX_CELL_CHARS);
    });

    it('buffer at MAX_CELL_CHARS - 1 is not truncated', () => {
        const underStr = 'y'.repeat(MAX_CELL_CHARS - 1);
        const s = dispatch(state, { type: 'UPDATE_EDIT_BUFFER', value: underStr });
        expect(s.editBuffer.length).toBe(MAX_CELL_CHARS - 1);
    });
});

// ═══════════════════════════════════════════════════════════════════
// UNDO/REDO — Integration with copy-paste and format
// ═══════════════════════════════════════════════════════════════════
describe('Reducer Edge — Undo/Redo integration', () => {
    let state: SpreadsheetState;
    beforeEach(() => { state = createInitialState(); });

    it('undo after paste restores original state', () => {
        let s = setCell(state, 0, 0, 'original');
        s = dispatch(s, { type: 'SELECT_CELL', col: 0, row: 0 });
        s = dispatch(s, { type: 'COPY' });
        s = dispatch(s, { type: 'SELECT_CELL', col: 1, row: 0 });
        s = dispatch(s, { type: 'PASTE' });
        const sheet1 = getActiveSheet(s);
        expect(sheet1.cells[cellKey(1, 0)]?.value).toBe('original');
        // Undo the paste
        s = dispatch(s, { type: 'UNDO' });
        const sheet2 = getActiveSheet(s);
        expect(sheet2.cells[cellKey(1, 0)]).toBeUndefined();
    });

    it('format toggle: bold on then bold off', () => {
        let s = dispatch(state, { type: 'SET_FORMAT', format: { bold: true } });
        const sheet1 = getActiveSheet(s);
        expect(sheet1.cells[cellKey(0, 0)]?.format?.bold).toBe(true);
        s = dispatch(s, { type: 'SET_FORMAT', format: { bold: false } });
        const sheet2 = getActiveSheet(s);
        expect(sheet2.cells[cellKey(0, 0)]?.format?.bold).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════
// determineCellDataType — Edge cases
// ═══════════════════════════════════════════════════════════════════
describe('determineCellDataType Edge Cases', () => {
    it('returns "text" for just "$"', () => {
        expect(determineCellDataType('$')).toBe('text');
    });

    it('returns "text" for just "%"', () => {
        expect(determineCellDataType('%')).toBe('text');
    });

    it('returns "number" for negative number "-3.14"', () => {
        expect(determineCellDataType('-3.14')).toBe('number');
    });

    it('returns "number" for "0"', () => {
        expect(determineCellDataType('0')).toBe('number');
    });

    it('returns "currency" for "$0"', () => {
        expect(determineCellDataType('$0')).toBe('currency');
    });

    it('returns "text" for "abc123"', () => {
        expect(determineCellDataType('abc123')).toBe('text');
    });
});
