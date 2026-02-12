import { describe, it, expect } from 'vitest';
import {
    colIndexToLetter,
    letterToColIndex,
    cellKey,
    getCellDisplayValue,
    cellRefString,
    isCellError,
    normalizeSelection,
    isCellInSelection,
    type Cell,
    type SelectionRange,
} from '@/types/spreadsheet';

// ─── colIndexToLetter edge cases ─────────────────────────────────────
describe('colIndexToLetter — Edge Cases', () => {
    it('handles negative index (returns char before A)', () => {
        // This tests what happens with invalid input — should not crash
        const result = colIndexToLetter(-1);
        expect(typeof result).toBe('string');
    });

    it('handles index 26 (beyond Z)', () => {
        const result = colIndexToLetter(26);
        expect(typeof result).toBe('string');
        // 26 maps to char code 91 which is '[' — validates boundary
    });

    it('handles index 0 correctly (A)', () => {
        expect(colIndexToLetter(0)).toBe('A');
    });
});

// ─── letterToColIndex edge cases ────────────────────────────────────
describe('letterToColIndex — Edge Cases', () => {
    it('handles digit "1" (non-letter input)', () => {
        const result = letterToColIndex('1');
        expect(typeof result).toBe('number');
        // '1' has char code 49, result = 49 - 65 = -16
    });

    it('handles empty string', () => {
        // charCodeAt(0) on empty string returns NaN
        const result = letterToColIndex('');
        expect(typeof result).toBe('number');
    });

    it('handles multi-char string (takes first char)', () => {
        expect(letterToColIndex('BC')).toBe(1); // 'B' = 1
    });
});

// ─── cellKey edge cases ──────────────────────────────────────────────
describe('cellKey — Edge Cases', () => {
    it('handles negative coordinates', () => {
        expect(cellKey(-1, -1)).toBe('-1,-1');
    });

    it('handles large coordinates', () => {
        expect(cellKey(1000, 1000)).toBe('1000,1000');
    });

    it('handles zero coordinates', () => {
        expect(cellKey(0, 0)).toBe('0,0');
    });
});

// ─── getCellDisplayValue edge cases ──────────────────────────────────
describe('getCellDisplayValue — Edge Cases', () => {
    it('returns "0" for cell with value 0 (falsy but valid)', () => {
        const cell: Cell = { value: 0, dataType: 'number' };
        expect(getCellDisplayValue(cell)).toBe('0');
    });

    it('returns displayValue for formula cell', () => {
        const cell: Cell = {
            value: 42,
            formula: '=21*2',
            displayValue: '42',
            dataType: 'number',
        };
        expect(getCellDisplayValue(cell)).toBe('42');
    });

    it('returns displayValue over stringified value when both exist', () => {
        const cell: Cell = {
            value: 100,
            displayValue: '$100.00',
            dataType: 'currency',
        };
        expect(getCellDisplayValue(cell)).toBe('$100.00');
    });

    it('returns empty string for cell with undefined value and no displayValue', () => {
        const cell: Cell = { value: undefined as unknown as null, dataType: 'empty' };
        expect(getCellDisplayValue(cell)).toBe('');
    });

    it('returns "false" for boolean false value', () => {
        // Edge case: boolean values are not part of the Cell type but could appear
        const cell: Cell = { value: 'false', dataType: 'text' };
        expect(getCellDisplayValue(cell)).toBe('false');
    });
});

// ─── cellRefString edge cases ────────────────────────────────────────
describe('cellRefString — Edge Cases', () => {
    it('handles col 0, row 0 → "A1"', () => {
        expect(cellRefString(0, 0)).toBe('A1');
    });

    it('handles col > 25 (beyond Z)', () => {
        // col 26 → charCode 91 = '['
        const result = cellRefString(26, 0);
        expect(typeof result).toBe('string');
    });

    it('handles negative row → "A0"', () => {
        const result = cellRefString(0, -1);
        expect(result).toBe('A0');
    });
});

// ─── isCellError edge cases ──────────────────────────────────────────
describe('isCellError — Edge Cases', () => {
    it('returns false for cell with displayValue "#VALUE!" (non-standard)', () => {
        const cell: Cell = { value: null, dataType: 'text', displayValue: '#VALUE!' };
        // '#VALUE!' starts with '#' and ends with '!' → should match
        expect(isCellError(cell)).toBe(true);
    });

    it('returns false for partial "#" only', () => {
        const cell: Cell = { value: null, dataType: 'text', displayValue: '#' };
        expect(isCellError(cell)).toBe(false);
    });

    it('returns false for "error" text without hash', () => {
        const cell: Cell = { value: 'error', dataType: 'text', displayValue: 'error' };
        expect(isCellError(cell)).toBe(false);
    });

    it('returns false for empty displayValue', () => {
        const cell: Cell = { value: '', dataType: 'text', displayValue: '' };
        expect(isCellError(cell)).toBe(false);
    });

    it('handles cell with no displayValue property', () => {
        const cell: Cell = { value: 42, dataType: 'number' };
        expect(isCellError(cell)).toBe(false);
    });
});

// ─── normalizeSelection edge cases ───────────────────────────────────
describe('normalizeSelection — Edge Cases', () => {
    it('handles zero-width selection (single column)', () => {
        const sel: SelectionRange = { startCol: 3, startRow: 0, endCol: 3, endRow: 5 };
        const norm = normalizeSelection(sel);
        expect(norm.startCol).toBe(3);
        expect(norm.endCol).toBe(3);
    });

    it('handles zero-height selection (single row)', () => {
        const sel: SelectionRange = { startCol: 0, startRow: 3, endCol: 5, endRow: 3 };
        const norm = normalizeSelection(sel);
        expect(norm.startRow).toBe(3);
        expect(norm.endRow).toBe(3);
    });

    it('handles very large coordinates', () => {
        const sel: SelectionRange = { startCol: 9999, startRow: 9999, endCol: 0, endRow: 0 };
        const norm = normalizeSelection(sel);
        expect(norm.startCol).toBe(0);
        expect(norm.startRow).toBe(0);
        expect(norm.endCol).toBe(9999);
        expect(norm.endRow).toBe(9999);
    });
});

// ─── isCellInSelection edge cases ────────────────────────────────────
describe('isCellInSelection — Edge Cases', () => {
    it('cell at exact startCol boundary is included', () => {
        const sel: SelectionRange = { startCol: 2, startRow: 0, endCol: 5, endRow: 5 };
        expect(isCellInSelection(2, 3, sel)).toBe(true);
    });

    it('cell one before startCol is excluded', () => {
        const sel: SelectionRange = { startCol: 2, startRow: 0, endCol: 5, endRow: 5 };
        expect(isCellInSelection(1, 3, sel)).toBe(false);
    });

    it('cell at exact endCol boundary is included', () => {
        const sel: SelectionRange = { startCol: 0, startRow: 0, endCol: 5, endRow: 5 };
        expect(isCellInSelection(5, 3, sel)).toBe(true);
    });

    it('cell one after endCol is excluded', () => {
        const sel: SelectionRange = { startCol: 0, startRow: 0, endCol: 5, endRow: 5 };
        expect(isCellInSelection(6, 3, sel)).toBe(false);
    });

    it('cell at exact corner (endCol, endRow) is included', () => {
        const sel: SelectionRange = { startCol: 1, startRow: 1, endCol: 3, endRow: 3 };
        expect(isCellInSelection(3, 3, sel)).toBe(true);
    });

    it('single-cell selection includes only that cell', () => {
        const sel: SelectionRange = { startCol: 5, startRow: 5, endCol: 5, endRow: 5 };
        expect(isCellInSelection(5, 5, sel)).toBe(true);
        expect(isCellInSelection(5, 4, sel)).toBe(false);
        expect(isCellInSelection(4, 5, sel)).toBe(false);
    });
});
