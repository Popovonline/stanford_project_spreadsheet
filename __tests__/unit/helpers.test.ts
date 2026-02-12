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

// ─── colIndexToLetter ─────────────────────────────────────────────────
describe('colIndexToLetter', () => {
    it('converts 0 to "A"', () => {
        expect(colIndexToLetter(0)).toBe('A');
    });

    it('converts 25 to "Z"', () => {
        expect(colIndexToLetter(25)).toBe('Z');
    });

    it('converts 12 to "M"', () => {
        expect(colIndexToLetter(12)).toBe('M');
    });
});

// ─── letterToColIndex ──────────────────────────────────────────────────
describe('letterToColIndex', () => {
    it('converts "A" to 0', () => {
        expect(letterToColIndex('A')).toBe(0);
    });

    it('converts "Z" to 25', () => {
        expect(letterToColIndex('Z')).toBe(25);
    });

    it('converts lowercase "a" to 0', () => {
        expect(letterToColIndex('a')).toBe(0);
    });

    it('converts "M" to 12', () => {
        expect(letterToColIndex('M')).toBe(12);
    });
});

// ─── cellKey ──────────────────────────────────────────────────────────
describe('cellKey', () => {
    it('returns "0,0" for A1', () => {
        expect(cellKey(0, 0)).toBe('0,0');
    });

    it('returns "25,99" for Z100', () => {
        expect(cellKey(25, 99)).toBe('25,99');
    });

    it('returns "5,10" for F11', () => {
        expect(cellKey(5, 10)).toBe('5,10');
    });
});

// ─── getCellDisplayValue ─────────────────────────────────────────────
describe('getCellDisplayValue', () => {
    it('returns empty string for undefined cell', () => {
        expect(getCellDisplayValue(undefined)).toBe('');
    });

    it('returns displayValue when present', () => {
        const cell: Cell = { value: 42, dataType: 'number', displayValue: '$42.00' };
        expect(getCellDisplayValue(cell)).toBe('$42.00');
    });

    it('returns stringified value when no displayValue', () => {
        const cell: Cell = { value: 100, dataType: 'number' };
        expect(getCellDisplayValue(cell)).toBe('100');
    });

    it('returns empty string for null value', () => {
        const cell: Cell = { value: null, dataType: 'empty' };
        expect(getCellDisplayValue(cell)).toBe('');
    });

    it('returns string value as-is', () => {
        const cell: Cell = { value: 'Hello', dataType: 'text' };
        expect(getCellDisplayValue(cell)).toBe('Hello');
    });
});

// ─── cellRefString ────────────────────────────────────────────────────
describe('cellRefString', () => {
    it('returns "A1" for (0,0)', () => {
        expect(cellRefString(0, 0)).toBe('A1');
    });

    it('returns "Z100" for (25,99)', () => {
        expect(cellRefString(25, 99)).toBe('Z100');
    });

    it('returns "C5" for (2,4)', () => {
        expect(cellRefString(2, 4)).toBe('C5');
    });
});

// ─── isCellError ───────────────────────────────────────────────────────
describe('isCellError', () => {
    it('returns true for #DIV/0!', () => {
        const cell: Cell = { value: null, dataType: 'text', displayValue: '#DIV/0!' };
        expect(isCellError(cell)).toBe(true);
    });

    it('returns true for #ERROR!', () => {
        const cell: Cell = { value: null, dataType: 'text', displayValue: '#ERROR!' };
        expect(isCellError(cell)).toBe(true);
    });

    it('returns true for #NAME?', () => {
        const cell: Cell = { value: null, dataType: 'text', displayValue: '#NAME?' };
        expect(isCellError(cell)).toBe(true);
    });

    it('returns true for #REF!', () => {
        const cell: Cell = { value: null, dataType: 'text', displayValue: '#REF!' };
        expect(isCellError(cell)).toBe(true);
    });

    it('returns true for #CIRCULAR!', () => {
        const cell: Cell = { value: null, dataType: 'text', displayValue: '#CIRCULAR!' };
        expect(isCellError(cell)).toBe(true);
    });

    it('returns false for normal text', () => {
        const cell: Cell = { value: 'hello', dataType: 'text' };
        expect(isCellError(cell)).toBe(false);
    });

    it('returns false for undefined cell', () => {
        expect(isCellError(undefined)).toBe(false);
    });

    it('returns false for number cell', () => {
        const cell: Cell = { value: 42, dataType: 'number' };
        expect(isCellError(cell)).toBe(false);
    });
});

// ─── normalizeSelection ────────────────────────────────────────────────
describe('normalizeSelection', () => {
    it('keeps already-normalized selection unchanged', () => {
        const sel: SelectionRange = { startCol: 0, startRow: 0, endCol: 3, endRow: 5 };
        expect(normalizeSelection(sel)).toEqual(sel);
    });

    it('normalizes reversed column selection (right to left)', () => {
        const sel: SelectionRange = { startCol: 5, startRow: 0, endCol: 2, endRow: 0 };
        expect(normalizeSelection(sel)).toEqual({
            startCol: 2, startRow: 0, endCol: 5, endRow: 0,
        });
    });

    it('normalizes reversed row selection (bottom to top)', () => {
        const sel: SelectionRange = { startCol: 0, startRow: 8, endCol: 0, endRow: 2 };
        expect(normalizeSelection(sel)).toEqual({
            startCol: 0, startRow: 2, endCol: 0, endRow: 8,
        });
    });

    it('normalizes fully reversed diagonal selection', () => {
        const sel: SelectionRange = { startCol: 5, startRow: 10, endCol: 1, endRow: 3 };
        expect(normalizeSelection(sel)).toEqual({
            startCol: 1, startRow: 3, endCol: 5, endRow: 10,
        });
    });

    it('handles single-cell selection', () => {
        const sel: SelectionRange = { startCol: 3, startRow: 3, endCol: 3, endRow: 3 };
        expect(normalizeSelection(sel)).toEqual(sel);
    });
});

// ─── isCellInSelection ──────────────────────────────────────────────────
describe('isCellInSelection', () => {
    const sel: SelectionRange = { startCol: 1, startRow: 1, endCol: 3, endRow: 5 };

    it('returns true for cell inside selection', () => {
        expect(isCellInSelection(2, 3, sel)).toBe(true);
    });

    it('returns true for cell at top-left corner', () => {
        expect(isCellInSelection(1, 1, sel)).toBe(true);
    });

    it('returns true for cell at bottom-right corner', () => {
        expect(isCellInSelection(3, 5, sel)).toBe(true);
    });

    it('returns false for cell outside selection (above)', () => {
        expect(isCellInSelection(2, 0, sel)).toBe(false);
    });

    it('returns false for cell outside selection (left)', () => {
        expect(isCellInSelection(0, 3, sel)).toBe(false);
    });

    it('returns false for cell outside selection (right)', () => {
        expect(isCellInSelection(4, 3, sel)).toBe(false);
    });

    it('returns false for cell outside selection (below)', () => {
        expect(isCellInSelection(2, 6, sel)).toBe(false);
    });

    it('returns false for null selection', () => {
        expect(isCellInSelection(0, 0, null)).toBe(false);
    });

    it('handles reversed selection via normalizeSelection internally', () => {
        const reversed: SelectionRange = { startCol: 3, startRow: 5, endCol: 1, endRow: 1 };
        expect(isCellInSelection(2, 3, reversed)).toBe(true);
    });
});
