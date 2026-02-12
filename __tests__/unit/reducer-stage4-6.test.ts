/**
 * Unit Tests for Stage 4-6 Reducer Actions
 *
 * Covers: INSERT_ROW, DELETE_ROW, INSERT_COL, DELETE_COL,
 *         SORT_COLUMN, MERGE_CELLS, UNMERGE_CELLS, FILL_RANGE,
 *         TOGGLE_FILTER, SET_COLUMN_FILTER, CLEAR_ALL_FILTERS,
 *         SET_VALIDATION, REMOVE_VALIDATION,
 *         SET_COMMENT, DELETE_COMMENT,
 *         ADD_NAMED_RANGE, UPDATE_NAMED_RANGE, DELETE_NAMED_RANGE
 */
import { describe, it, expect } from 'vitest';
import { spreadsheetReducer, createInitialState } from '@/state/spreadsheet-context';
import { type SpreadsheetState, type SpreadsheetAction, cellKey } from '@/types/spreadsheet';

// Helper to set up state with some cell values
function stateWith(
    cells: Record<string, { value: string | number | null; formula?: string; dataType?: string }>,
    activeCol = 0,
    activeRow = 0,
): SpreadsheetState {
    const state = createInitialState();
    const sheet = state.workbook.sheets[0];
    const newCells: Record<string, any> = {};
    for (const [key, val] of Object.entries(cells)) {
        newCells[key] = { dataType: val.dataType || 'number', ...val };
    }
    const updated: SpreadsheetState = {
        ...state,
        workbook: {
            ...state.workbook,
            sheets: [{ ...sheet, cells: newCells }],
        },
        activeCell: { ...state.activeCell, col: activeCol, row: activeRow },
    };
    return updated;
}

function dispatch(state: SpreadsheetState, action: SpreadsheetAction): SpreadsheetState {
    return spreadsheetReducer(state, action);
}

function getCell(state: SpreadsheetState, col: number, row: number) {
    const sheet = state.workbook.sheets.find(s => s.id === state.workbook.activeSheetId)!;
    return sheet.cells[cellKey(col, row)];
}

// ═══════════════════════════════════════════════════════════════════
// STAGE 4: Grid Power
// ═══════════════════════════════════════════════════════════════════

describe('INSERT_ROW', () => {
    it('inserts row above — shifts cells down', () => {
        const state = stateWith({
            [cellKey(0, 0)]: { value: 'A', dataType: 'text' },
            [cellKey(0, 1)]: { value: 'B', dataType: 'text' },
            [cellKey(0, 2)]: { value: 'C', dataType: 'text' },
        }, 0, 1);

        const result = dispatch(state, { type: 'INSERT_ROW', position: 'above' });
        // Row 1 onwards shifts down by 1
        expect(getCell(result, 0, 0)?.value).toBe('A'); // row 0 unchanged
        expect(getCell(result, 0, 1)).toBeUndefined();    // newly inserted blank row
        expect(getCell(result, 0, 2)?.value).toBe('B'); // old row 1 → row 2
        expect(getCell(result, 0, 3)?.value).toBe('C'); // old row 2 → row 3
    });

    it('inserts row below — shifts cells after active row', () => {
        const state = stateWith({
            [cellKey(0, 0)]: { value: 'A', dataType: 'text' },
            [cellKey(0, 1)]: { value: 'B', dataType: 'text' },
        }, 0, 0);

        const result = dispatch(state, { type: 'INSERT_ROW', position: 'below' });
        expect(getCell(result, 0, 0)?.value).toBe('A');
        expect(getCell(result, 0, 1)).toBeUndefined();    // inserted
        expect(getCell(result, 0, 2)?.value).toBe('B');   // shifted
    });

    it('pushes undo entry', () => {
        const state = stateWith({ [cellKey(0, 0)]: { value: 1 } });
        const result = dispatch(state, { type: 'INSERT_ROW', position: 'above' });
        expect(result.undoStack.length).toBe(1);
    });
});

describe('DELETE_ROW', () => {
    it('deletes active row and shifts cells up', () => {
        const state = stateWith({
            [cellKey(0, 0)]: { value: 'A', dataType: 'text' },
            [cellKey(0, 1)]: { value: 'B', dataType: 'text' },
            [cellKey(0, 2)]: { value: 'C', dataType: 'text' },
        }, 0, 1);

        const result = dispatch(state, { type: 'DELETE_ROW' });
        expect(getCell(result, 0, 0)?.value).toBe('A');
        expect(getCell(result, 0, 1)?.value).toBe('C'); // shifted up
        expect(getCell(result, 0, 2)).toBeUndefined();   // gone
    });

    it('pushes undo entry', () => {
        const state = stateWith({ [cellKey(0, 0)]: { value: 1 } });
        const result = dispatch(state, { type: 'DELETE_ROW' });
        expect(result.undoStack.length).toBe(1);
    });
});

describe('INSERT_COL', () => {
    it('inserts column to the left — shifts cells right', () => {
        const state = stateWith({
            [cellKey(0, 0)]: { value: 'A', dataType: 'text' },
            [cellKey(1, 0)]: { value: 'B', dataType: 'text' },
            [cellKey(2, 0)]: { value: 'C', dataType: 'text' },
        }, 1, 0);

        const result = dispatch(state, { type: 'INSERT_COL', position: 'left' });
        expect(getCell(result, 0, 0)?.value).toBe('A');
        expect(getCell(result, 1, 0)).toBeUndefined();    // inserted
        expect(getCell(result, 2, 0)?.value).toBe('B');   // shifted
        expect(getCell(result, 3, 0)?.value).toBe('C');   // shifted
    });

    it('inserts column to the right', () => {
        const state = stateWith({
            [cellKey(0, 0)]: { value: 'A', dataType: 'text' },
            [cellKey(1, 0)]: { value: 'B', dataType: 'text' },
        }, 0, 0);

        const result = dispatch(state, { type: 'INSERT_COL', position: 'right' });
        expect(getCell(result, 0, 0)?.value).toBe('A');
        expect(getCell(result, 1, 0)).toBeUndefined();
        expect(getCell(result, 2, 0)?.value).toBe('B');
    });
});

describe('DELETE_COL', () => {
    it('deletes active column and shifts cells left', () => {
        const state = stateWith({
            [cellKey(0, 0)]: { value: 'A', dataType: 'text' },
            [cellKey(1, 0)]: { value: 'B', dataType: 'text' },
            [cellKey(2, 0)]: { value: 'C', dataType: 'text' },
        }, 1, 0);

        const result = dispatch(state, { type: 'DELETE_COL' });
        expect(getCell(result, 0, 0)?.value).toBe('A');
        expect(getCell(result, 1, 0)?.value).toBe('C'); // shifted left
        expect(getCell(result, 2, 0)).toBeUndefined();
    });
});

describe('SORT_COLUMN', () => {
    it('sorts data ascending (treats row 0 as header)', () => {
        const state = stateWith({
            [cellKey(0, 0)]: { value: 'Name', dataType: 'text' },
            [cellKey(0, 1)]: { value: 3 },
            [cellKey(0, 2)]: { value: 1 },
            [cellKey(0, 3)]: { value: 2 },
        });

        const result = dispatch(state, { type: 'SORT_COLUMN', col: 0, direction: 'asc' });
        expect(getCell(result, 0, 0)?.value).toBe('Name'); // header unchanged
        expect(getCell(result, 0, 1)?.value).toBe(1);
        expect(getCell(result, 0, 2)?.value).toBe(2);
        expect(getCell(result, 0, 3)?.value).toBe(3);
    });

    it('sorts data descending', () => {
        const state = stateWith({
            [cellKey(0, 0)]: { value: 'Name', dataType: 'text' },
            [cellKey(0, 1)]: { value: 1 },
            [cellKey(0, 2)]: { value: 3 },
            [cellKey(0, 3)]: { value: 2 },
        });

        const result = dispatch(state, { type: 'SORT_COLUMN', col: 0, direction: 'desc' });
        expect(getCell(result, 0, 0)?.value).toBe('Name');
        expect(getCell(result, 0, 1)?.value).toBe(3);
        expect(getCell(result, 0, 2)?.value).toBe(2);
        expect(getCell(result, 0, 3)?.value).toBe(1);
    });

    it('records sort state on sheet', () => {
        const state = stateWith({
            [cellKey(0, 0)]: { value: 'H', dataType: 'text' },
            [cellKey(0, 1)]: { value: 1 },
        });
        const result = dispatch(state, { type: 'SORT_COLUMN', col: 0, direction: 'asc' });
        const sheet = result.workbook.sheets[0];
        expect(sheet.sortColumn).toBe(0);
        expect(sheet.sortDirection).toBe('asc');
    });

    it('returns state unchanged when no data rows exist', () => {
        const state = stateWith({});
        const result = dispatch(state, { type: 'SORT_COLUMN', col: 0, direction: 'asc' });
        expect(result).toBe(state);
    });
});

describe('MERGE_CELLS', () => {
    it('merges with selection — clears non-anchor cells', () => {
        const state = stateWith({
            [cellKey(0, 0)]: { value: 'Keep', dataType: 'text' },
            [cellKey(1, 0)]: { value: 'Remove', dataType: 'text' },
            [cellKey(0, 1)]: { value: 'Also Remove', dataType: 'text' },
        });
        const withSelection = {
            ...state,
            selection: { startCol: 0, startRow: 0, endCol: 1, endRow: 1 },
        };

        const result = dispatch(withSelection, { type: 'MERGE_CELLS' });
        const sheet = result.workbook.sheets[0];
        expect(sheet.mergedRegions?.length).toBe(1);
        expect(sheet.mergedRegions![0]).toEqual({
            startCol: 0, startRow: 0, endCol: 1, endRow: 1,
        });
        expect(getCell(result, 0, 0)?.value).toBe('Keep');
        expect(getCell(result, 1, 0)).toBeUndefined(); // cleared
        expect(getCell(result, 0, 1)).toBeUndefined(); // cleared
    });

    it('does nothing without selection', () => {
        const state = stateWith({});
        const result = dispatch(state, { type: 'MERGE_CELLS' });
        expect(result).toBe(state);
    });

    it('does nothing for single-cell selection', () => {
        const state = {
            ...stateWith({}),
            selection: { startCol: 0, startRow: 0, endCol: 0, endRow: 0 },
        };
        const result = dispatch(state, { type: 'MERGE_CELLS' });
        expect(result).toBe(state);
    });
});

describe('UNMERGE_CELLS', () => {
    it('removes merge region containing active cell', () => {
        const state = stateWith({});
        // Manually add a merged region
        const merged = {
            ...state,
            workbook: {
                ...state.workbook,
                sheets: state.workbook.sheets.map(s => ({
                    ...s,
                    mergedRegions: [{ startCol: 0, startRow: 0, endCol: 2, endRow: 2 }],
                })),
            },
            activeCell: { ...state.activeCell, col: 1, row: 1 },
        };

        const result = dispatch(merged, { type: 'UNMERGE_CELLS' });
        expect(result.workbook.sheets[0].mergedRegions?.length).toBe(0);
    });
});

describe('FILL_RANGE', () => {
    it('fills numeric sequence (increments)', () => {
        const state = stateWith({
            [cellKey(0, 0)]: { value: 1 },
        });

        const result = dispatch(state, {
            type: 'FILL_RANGE',
            sourceCol: 0,
            sourceRow: 0,
            targetRange: { startCol: 0, startRow: 0, endCol: 0, endRow: 3 },
        });

        expect(getCell(result, 0, 0)?.value).toBe(1); // source unchanged
        expect(getCell(result, 0, 1)?.value).toBe(2);
        expect(getCell(result, 0, 2)?.value).toBe(3);
        expect(getCell(result, 0, 3)?.value).toBe(4);
    });

    it('fills text (copies)', () => {
        const state = stateWith({
            [cellKey(0, 0)]: { value: 'hello', dataType: 'text' },
        });

        const result = dispatch(state, {
            type: 'FILL_RANGE',
            sourceCol: 0,
            sourceRow: 0,
            targetRange: { startCol: 0, startRow: 0, endCol: 0, endRow: 2 },
        });

        expect(getCell(result, 0, 1)?.value).toBe('hello');
        expect(getCell(result, 0, 2)?.value).toBe('hello');
    });

    it('returns state when source cell is empty', () => {
        const state = stateWith({});
        const result = dispatch(state, {
            type: 'FILL_RANGE',
            sourceCol: 0,
            sourceRow: 0,
            targetRange: { startCol: 0, startRow: 0, endCol: 0, endRow: 2 },
        });
        expect(result).toBe(state);
    });
});

// ═══════════════════════════════════════════════════════════════════
// STAGE 5: Data Intelligence
// ═══════════════════════════════════════════════════════════════════

describe('TOGGLE_FILTER', () => {
    it('toggles filter active state on', () => {
        const state = stateWith({});
        const result = dispatch(state, { type: 'TOGGLE_FILTER' });
        expect(result.workbook.sheets[0].filterActive).toBe(true);
    });

    it('toggles filter off and clears filters', () => {
        const state = stateWith({});
        // Enable filter first
        let result = dispatch(state, { type: 'TOGGLE_FILTER' });
        // Add a filter
        result = dispatch(result, { type: 'SET_COLUMN_FILTER', col: 0, values: ['yes'] });
        // Toggle off
        result = dispatch(result, { type: 'TOGGLE_FILTER' });
        expect(result.workbook.sheets[0].filterActive).toBe(false);
        expect(result.workbook.sheets[0].filters?.length).toBe(0);
    });
});

describe('SET_COLUMN_FILTER', () => {
    it('adds a column filter', () => {
        const state = stateWith({});
        const result = dispatch(state, { type: 'SET_COLUMN_FILTER', col: 2, values: ['A', 'B'] });
        const filters = result.workbook.sheets[0].filters!;
        expect(filters.length).toBe(1);
        expect(filters[0].column).toBe(2);
        expect(filters[0].values).toEqual(['A', 'B']);
        expect(filters[0].active).toBe(true);
    });

    it('replaces existing column filter', () => {
        const state = stateWith({});
        let result = dispatch(state, { type: 'SET_COLUMN_FILTER', col: 1, values: ['X'] });
        result = dispatch(result, { type: 'SET_COLUMN_FILTER', col: 1, values: ['Y', 'Z'] });
        const filters = result.workbook.sheets[0].filters!;
        expect(filters.length).toBe(1);
        expect(filters[0].values).toEqual(['Y', 'Z']);
    });

    it('marks filter inactive when values are empty', () => {
        const state = stateWith({});
        const result = dispatch(state, { type: 'SET_COLUMN_FILTER', col: 0, values: [] });
        expect(result.workbook.sheets[0].filters![0].active).toBe(false);
    });
});

describe('CLEAR_ALL_FILTERS', () => {
    it('clears all filters and deactivates', () => {
        let state = stateWith({});
        state = dispatch(state, { type: 'TOGGLE_FILTER' });
        state = dispatch(state, { type: 'SET_COLUMN_FILTER', col: 0, values: ['A'] });
        state = dispatch(state, { type: 'SET_COLUMN_FILTER', col: 1, values: ['B'] });

        const result = dispatch(state, { type: 'CLEAR_ALL_FILTERS' });
        expect(result.workbook.sheets[0].filters).toEqual([]);
        expect(result.workbook.sheets[0].filterActive).toBe(false);
    });
});

describe('SET_VALIDATION', () => {
    it('adds validation rule to a cell', () => {
        const state = stateWith({});
        const result = dispatch(state, {
            type: 'SET_VALIDATION',
            col: 0,
            row: 0,
            rule: { type: 'list', values: ['Yes', 'No'] },
        });
        const cell = getCell(result, 0, 0);
        expect(cell?.validation).toEqual({ type: 'list', values: ['Yes', 'No'] });
    });

    it('adds validation to cell with existing value', () => {
        const state = stateWith({ [cellKey(0, 0)]: { value: 42 } });
        const result = dispatch(state, {
            type: 'SET_VALIDATION',
            col: 0,
            row: 0,
            rule: { type: 'number', min: 0, max: 100 },
        });
        const cell = getCell(result, 0, 0);
        expect(cell?.value).toBe(42);
        expect(cell?.validation?.type).toBe('number');
        expect(cell?.validation?.min).toBe(0);
    });
});

describe('REMOVE_VALIDATION', () => {
    it('removes validation from cell', () => {
        let state = stateWith({ [cellKey(0, 0)]: { value: 'Yes', dataType: 'text' } });
        state = dispatch(state, {
            type: 'SET_VALIDATION',
            col: 0,
            row: 0,
            rule: { type: 'list', values: ['Yes', 'No'] },
        });
        expect(getCell(state, 0, 0)?.validation).toBeDefined();

        const result = dispatch(state, { type: 'REMOVE_VALIDATION', col: 0, row: 0 });
        expect(getCell(result, 0, 0)?.validation).toBeUndefined();
        expect(getCell(result, 0, 0)?.value).toBe('Yes'); // value preserved
    });
});

describe('SET_COMMENT', () => {
    it('adds a comment to an empty cell', () => {
        const state = stateWith({});
        const result = dispatch(state, {
            type: 'SET_COMMENT',
            col: 0,
            row: 0,
            text: 'This is important',
            author: 'user',
        });
        const cell = getCell(result, 0, 0);
        expect(cell?.comment?.text).toBe('This is important');
        expect(cell?.comment?.author).toBe('user');
        expect(cell?.comment?.timestamp).toBeGreaterThan(0);
    });

    it('adds comment to cell with existing value', () => {
        const state = stateWith({ [cellKey(0, 0)]: { value: 100 } });
        const result = dispatch(state, {
            type: 'SET_COMMENT',
            col: 0,
            row: 0,
            text: 'Review this',
            author: 'manager',
        });
        const cell = getCell(result, 0, 0);
        expect(cell?.value).toBe(100);
        expect(cell?.comment?.text).toBe('Review this');
    });
});

describe('DELETE_COMMENT', () => {
    it('removes comment from cell', () => {
        let state = stateWith({ [cellKey(0, 0)]: { value: 'data', dataType: 'text' } });
        state = dispatch(state, { type: 'SET_COMMENT', col: 0, row: 0, text: 'note', author: 'me' });
        expect(getCell(state, 0, 0)?.comment).toBeDefined();

        const result = dispatch(state, { type: 'DELETE_COMMENT', col: 0, row: 0 });
        expect(getCell(result, 0, 0)?.comment).toBeUndefined();
        expect(getCell(result, 0, 0)?.value).toBe('data'); // value preserved
    });
});

// ═══════════════════════════════════════════════════════════════════
// STAGE 6: Polish & Power
// ═══════════════════════════════════════════════════════════════════

describe('ADD_NAMED_RANGE', () => {
    it('adds a named range', () => {
        const state = createInitialState();
        const result = dispatch(state, {
            type: 'ADD_NAMED_RANGE',
            name: 'Revenue',
            range: 'A1:A10',
            sheetId: state.workbook.activeSheetId,
        });
        expect(result.namedRanges.length).toBe(1);
        expect(result.namedRanges[0].name).toBe('Revenue');
        expect(result.namedRanges[0].range).toBe('A1:A10');
    });

    it('rejects duplicate name (case-insensitive)', () => {
        let state = createInitialState();
        state = dispatch(state, { type: 'ADD_NAMED_RANGE', name: 'Tax', range: 'B1:B5', sheetId: 'x' });
        const result = dispatch(state, { type: 'ADD_NAMED_RANGE', name: 'tax', range: 'C1:C5', sheetId: 'x' });
        expect(result.namedRanges.length).toBe(1); // no duplicate added
    });

    it('rejects names that look like cell references', () => {
        const state = createInitialState();
        const result = dispatch(state, { type: 'ADD_NAMED_RANGE', name: 'A1', range: 'B1:B5', sheetId: 'x' });
        expect(result.namedRanges.length).toBe(0);
    });

    it('rejects names with spaces', () => {
        const state = createInitialState();
        const result = dispatch(state, { type: 'ADD_NAMED_RANGE', name: 'My Range', range: 'A1:A5', sheetId: 'x' });
        expect(result.namedRanges.length).toBe(0);
    });

    it('allows underscore names', () => {
        const state = createInitialState();
        const result = dispatch(state, { type: 'ADD_NAMED_RANGE', name: '_total', range: 'A1:A5', sheetId: 'x' });
        expect(result.namedRanges.length).toBe(1);
    });
});

describe('UPDATE_NAMED_RANGE', () => {
    it('updates existing named range', () => {
        let state = createInitialState();
        state = dispatch(state, { type: 'ADD_NAMED_RANGE', name: 'Sales', range: 'A1:A5', sheetId: 'x' });
        const result = dispatch(state, { type: 'UPDATE_NAMED_RANGE', name: 'Sales', range: 'B1:B10', sheetId: 'y' });
        expect(result.namedRanges[0].range).toBe('B1:B10');
        expect(result.namedRanges[0].sheetId).toBe('y');
    });

    it('does nothing if name not found', () => {
        let state = createInitialState();
        state = dispatch(state, { type: 'ADD_NAMED_RANGE', name: 'Sales', range: 'A1:A5', sheetId: 'x' });
        const result = dispatch(state, { type: 'UPDATE_NAMED_RANGE', name: 'Expenses', range: 'C1:C5', sheetId: 'z' });
        expect(result.namedRanges.length).toBe(1);
        expect(result.namedRanges[0].name).toBe('Sales');
    });
});

describe('DELETE_NAMED_RANGE', () => {
    it('deletes a named range', () => {
        let state = createInitialState();
        state = dispatch(state, { type: 'ADD_NAMED_RANGE', name: 'A', range: 'A1:A5', sheetId: 'x' });
        state = dispatch(state, { type: 'ADD_NAMED_RANGE', name: 'B', range: 'B1:B5', sheetId: 'x' });
        expect(state.namedRanges.length).toBe(2);

        const result = dispatch(state, { type: 'DELETE_NAMED_RANGE', name: 'A' });
        expect(result.namedRanges.length).toBe(1);
        expect(result.namedRanges[0].name).toBe('B');
    });

    it('does nothing if name not found', () => {
        let state = createInitialState();
        state = dispatch(state, { type: 'ADD_NAMED_RANGE', name: 'X', range: 'A1', sheetId: 'x' });
        const result = dispatch(state, { type: 'DELETE_NAMED_RANGE', name: 'Y' });
        expect(result.namedRanges.length).toBe(1);
    });
});
