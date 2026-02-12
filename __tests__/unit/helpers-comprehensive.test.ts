// ════════════════════════════════════════════════════════════════════
// Helpers — Comprehensive Tests
// Covers parseCSV, parseTSV, getCellDisplayValue, cellRefString,
// isCellError, colIndexToLetter, letterToColIndex, cellKey,
// normalizeSelection, isCellInSelection, and determineCellDataType
// ════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
    parseCSV,
    parseTSV,
    determineCellDataType,
} from '@/state/spreadsheet-context';
import {
    cellKey,
    colIndexToLetter,
    letterToColIndex,
    normalizeSelection,
    isCellInSelection,
    getCellDisplayValue,
    cellRefString,
    isCellError,
    type Cell,
    type SelectionRange,
} from '@/types/spreadsheet';

// ═══════════════════════════════════════════════════════════════════
// parseCSV — RFC 4180 Compliance
// ═══════════════════════════════════════════════════════════════════

describe('parseCSV — RFC 4180 Compliance', () => {
    it('parses simple CSV', () => {
        const result = parseCSV('A,B,C\n1,2,3');
        expect(result).toEqual([['A', 'B', 'C'], ['1', '2', '3']]);
    });

    it('handles quoted fields with commas', () => {
        const result = parseCSV('"hello, world",B\n1,2');
        expect(result[0][0]).toBe('hello, world');
    });

    it('handles escaped double quotes', () => {
        const result = parseCSV('"say ""hello""",B');
        expect(result[0][0]).toBe('say "hello"');
    });

    it('handles CRLF line endings', () => {
        const result = parseCSV('A,B\r\n1,2\r\n3,4');
        expect(result).toEqual([['A', 'B'], ['1', '2'], ['3', '4']]);
    });

    it('handles empty fields', () => {
        const result = parseCSV('A,,C\n,2,');
        expect(result[0]).toEqual(['A', '', 'C']);
        expect(result[1]).toEqual(['', '2', '']);
    });

    it('handles single column CSV', () => {
        const result = parseCSV('A\n1\n2\n3');
        expect(result).toEqual([['A'], ['1'], ['2'], ['3']]);
    });

    it('handles empty input', () => {
        const result = parseCSV('');
        expect(result).toEqual([]);
    });

    it('handles single value', () => {
        const result = parseCSV('hello');
        expect(result).toEqual([['hello']]);
    });

    it('handles quoted field with newline inside', () => {
        const result = parseCSV('"line1\nline2",B');
        expect(result[0][0]).toBe('line1\nline2');
    });

    it('handles trailing newline', () => {
        const result = parseCSV('A,B\n1,2\n');
        // Trailing newline should not create an extra row with data
        const lastRow = result[result.length - 1];
        // Either the result has 2 rows or 3 rows with the last being empty
        expect(result.length).toBeGreaterThanOrEqual(2);
        if (result.length > 2) {
            expect(lastRow.join('')).toBe('');
        }
    });

    it('handles mixed quoted and unquoted fields', () => {
        const result = parseCSV('plain,"quoted",plain2');
        expect(result[0]).toEqual(['plain', 'quoted', 'plain2']);
    });

    it('handles large CSV with many columns', () => {
        const cols = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
        const csv = cols.join(',');
        const result = parseCSV(csv);
        expect(result[0].length).toBe(26);
    });
});

// ═══════════════════════════════════════════════════════════════════
// parseTSV
// ═══════════════════════════════════════════════════════════════════

describe('parseTSV', () => {
    it('parses tab-separated values', () => {
        const result = parseTSV('A\tB\tC\n1\t2\t3');
        expect(result).toEqual([['A', 'B', 'C'], ['1', '2', '3']]);
    });

    it('handles single column (no tabs)', () => {
        const result = parseTSV('A\nB\nC');
        expect(result).toEqual([['A'], ['B'], ['C']]);
    });

    it('handles trailing tabs (empty cells)', () => {
        const result = parseTSV('A\t\t\n1\t2\t');
        expect(result[0]).toEqual(['A', '', '']);
        expect(result[1]).toEqual(['1', '2', '']);
    });

    it('handles empty input', () => {
        const result = parseTSV('');
        expect(result).toEqual([]);
    });

    it('filters out completely empty lines', () => {
        const result = parseTSV('A\tB\n\n1\t2');
        expect(result).toEqual([['A', 'B'], ['1', '2']]);
    });

    it('single value', () => {
        const result = parseTSV('hello');
        expect(result).toEqual([['hello']]);
    });
});

// ═══════════════════════════════════════════════════════════════════
// getCellDisplayValue — Edge Cases
// ═══════════════════════════════════════════════════════════════════

describe('getCellDisplayValue — Edge Cases', () => {
    it('returns empty string for undefined cell', () => {
        expect(getCellDisplayValue(undefined)).toBe('');
    });

    it('returns displayValue when defined', () => {
        const cell: Cell = { value: 42, displayValue: '1/1/2025', dataType: 'date' };
        expect(getCellDisplayValue(cell)).toBe('1/1/2025');
    });

    it('returns value as string for number', () => {
        const cell: Cell = { value: 42, dataType: 'number' };
        expect(getCellDisplayValue(cell)).toBe('42');
    });

    it('returns empty string for null value', () => {
        const cell: Cell = { value: null, dataType: 'empty' };
        expect(getCellDisplayValue(cell)).toBe('');
    });

    it('returns value for text cell', () => {
        const cell: Cell = { value: 'hello', dataType: 'text' };
        expect(getCellDisplayValue(cell)).toBe('hello');
    });

    it('returns 0 as "0"', () => {
        const cell: Cell = { value: 0, dataType: 'number' };
        expect(getCellDisplayValue(cell)).toBe('0');
    });
});

// ═══════════════════════════════════════════════════════════════════
// cellRefString — Edge Cases
// ═══════════════════════════════════════════════════════════════════

describe('cellRefString — Edge Cases', () => {
    it('A1 → (0, 0)', () => {
        expect(cellRefString(0, 0)).toBe('A1');
    });

    it('Z100 → (25, 99)', () => {
        expect(cellRefString(25, 99)).toBe('Z100');
    });

    it('B5 → (1, 4)', () => {
        expect(cellRefString(1, 4)).toBe('B5');
    });
});

// ═══════════════════════════════════════════════════════════════════
// isCellError — Comprehensive
// ═══════════════════════════════════════════════════════════════════

describe('isCellError — Comprehensive', () => {
    it('recognizes #ERROR!', () => {
        const cell: Cell = { value: null, dataType: 'text', displayValue: '#ERROR!' };
        expect(isCellError(cell)).toBe(true);
    });

    it('recognizes #DIV/0!', () => {
        const cell: Cell = { value: null, dataType: 'text', displayValue: '#DIV/0!' };
        expect(isCellError(cell)).toBe(true);
    });

    it('recognizes #NAME?', () => {
        const cell: Cell = { value: null, dataType: 'text', displayValue: '#NAME?' };
        expect(isCellError(cell)).toBe(true);
    });

    it('recognizes #REF!', () => {
        const cell: Cell = { value: null, dataType: 'text', displayValue: '#REF!' };
        expect(isCellError(cell)).toBe(true);
    });

    it('recognizes #CIRCULAR!', () => {
        const cell: Cell = { value: null, dataType: 'text', displayValue: '#CIRCULAR!' };
        expect(isCellError(cell)).toBe(true);
    });

    it('rejects normal text cell', () => {
        const cell: Cell = { value: 'hello', dataType: 'text' };
        expect(isCellError(cell)).toBe(false);
    });

    it('rejects undefined cell', () => {
        expect(isCellError(undefined)).toBe(false);
    });

    it('rejects number cell', () => {
        const cell: Cell = { value: 42, dataType: 'number' };
        expect(isCellError(cell)).toBe(false);
    });

    it('rejects empty cell', () => {
        const cell: Cell = { value: null, dataType: 'empty' };
        expect(isCellError(cell)).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════
// colIndexToLetter / letterToColIndex — Roundtrip
// ═══════════════════════════════════════════════════════════════════

describe('colIndexToLetter / letterToColIndex — Roundtrip', () => {
    it('converts 0 → A and back', () => {
        expect(colIndexToLetter(0)).toBe('A');
        expect(letterToColIndex('A')).toBe(0);
    });

    it('converts 25 → Z and back', () => {
        expect(colIndexToLetter(25)).toBe('Z');
        expect(letterToColIndex('Z')).toBe(25);
    });

    it('roundtrips all columns', () => {
        for (let i = 0; i < 26; i++) {
            const letter = colIndexToLetter(i);
            expect(letterToColIndex(letter)).toBe(i);
        }
    });

    it('letterToColIndex is case-insensitive', () => {
        expect(letterToColIndex('a')).toBe(0);
        expect(letterToColIndex('z')).toBe(25);
    });
});

// ═══════════════════════════════════════════════════════════════════
// cellKey — Comprehensive
// ═══════════════════════════════════════════════════════════════════

describe('cellKey — Comprehensive', () => {
    it('(0,0) → "0,0"', () => expect(cellKey(0, 0)).toBe('0,0'));
    it('(25,99) → "25,99"', () => expect(cellKey(25, 99)).toBe('25,99'));
    it('different cells produce different keys', () => {
        expect(cellKey(0, 1)).not.toBe(cellKey(1, 0));
    });
});

// ═══════════════════════════════════════════════════════════════════
// normalizeSelection — Additional Cases
// ═══════════════════════════════════════════════════════════════════

describe('normalizeSelection — Additional Cases', () => {
    it('normalizes reversed selection (bottom-right to top-left)', () => {
        const sel: SelectionRange = { startCol: 5, startRow: 8, endCol: 2, endRow: 3 };
        const norm = normalizeSelection(sel);
        expect(norm.startCol).toBe(2);
        expect(norm.startRow).toBe(3);
        expect(norm.endCol).toBe(5);
        expect(norm.endRow).toBe(8);
    });

    it('single cell selection is normalized unchanged', () => {
        const sel: SelectionRange = { startCol: 3, startRow: 3, endCol: 3, endRow: 3 };
        const norm = normalizeSelection(sel);
        expect(norm).toEqual(sel);
    });

    it('partially reversed selection normalizes correctly', () => {
        const sel: SelectionRange = { startCol: 5, startRow: 2, endCol: 1, endRow: 7 };
        const norm = normalizeSelection(sel);
        expect(norm.startCol).toBe(1);
        expect(norm.endCol).toBe(5);
        expect(norm.startRow).toBe(2);
        expect(norm.endRow).toBe(7);
    });
});

// ═══════════════════════════════════════════════════════════════════
// isCellInSelection — Boundary Tests
// ═══════════════════════════════════════════════════════════════════

describe('isCellInSelection — Boundary Tests', () => {
    const sel: SelectionRange = { startCol: 2, startRow: 3, endCol: 5, endRow: 8 };

    it('cell at top-left corner is inside', () => {
        expect(isCellInSelection(2, 3, sel)).toBe(true);
    });

    it('cell at bottom-right corner is inside', () => {
        expect(isCellInSelection(5, 8, sel)).toBe(true);
    });

    it('cell just outside left edge', () => {
        expect(isCellInSelection(1, 5, sel)).toBe(false);
    });

    it('cell just outside right edge', () => {
        expect(isCellInSelection(6, 5, sel)).toBe(false);
    });

    it('cell just above top edge', () => {
        expect(isCellInSelection(3, 2, sel)).toBe(false);
    });

    it('cell just below bottom edge', () => {
        expect(isCellInSelection(3, 9, sel)).toBe(false);
    });

    it('cell in center is inside', () => {
        expect(isCellInSelection(3, 5, sel)).toBe(true);
    });

    it('null selection returns false', () => {
        expect(isCellInSelection(0, 0, null)).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════
// determineCellDataType — Comprehensive
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
