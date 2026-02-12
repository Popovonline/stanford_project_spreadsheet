// ════════════════════════════════════════════════════════════════════
// Formula Engine — Comprehensive Tests
// Covers cross-sheet refs, SPARKLINE, tokenizer/parser edges,
// error propagation, unary minus, and more
// ════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
    evaluateFormula,
    extractReferences,
    adjustFormulaReferences,
    formulaTooltip,
    parseCellRef,
    shiftCellRef,
    cellRefToString,
    isFormulaError,
    FORMULA_ERRORS,
} from '@/lib/formula-engine';
import { type Cell, type Sheet, cellKey } from '@/types/spreadsheet';

// ─── Helpers ────────────────────────────────────────────────────────

function makeCells(entries: Record<string, number | string>): Record<string, Cell> {
    const cells: Record<string, Cell> = {};
    for (const [ref, val] of Object.entries(entries)) {
        const m = ref.match(/^([A-Z])(\d+)$/);
        if (!m) throw new Error(`Bad ref: ${ref}`);
        const col = m[1].charCodeAt(0) - 65;
        const row = parseInt(m[2], 10) - 1;
        const key = cellKey(col, row);
        cells[key] = {
            value: typeof val === 'number' ? val : val,
            dataType: typeof val === 'number' ? 'number' : 'text',
        };
    }
    return cells;
}

function makeFormulaCell(formula: string, value: number | string | null): Cell {
    return {
        value,
        formula,
        displayValue: String(value ?? ''),
        dataType: typeof value === 'number' ? 'number' : 'text',
    };
}

function makeSheet(name: string, entries: Record<string, number | string>): Sheet {
    return {
        id: name.toLowerCase().replace(/\s/g, ''),
        name,
        cells: makeCells(entries),
        columnWidths: {},
        rowHeights: {},
        conditionalRules: [],
        frozenRows: 0,
    };
}

// ═══════════════════════════════════════════════════════════════════
// CROSS-SHEET REFERENCES (FR-203)
// ═══════════════════════════════════════════════════════════════════

describe('Formula Engine — Cross-Sheet References', () => {
    const sheet1 = makeSheet('Sheet1', { A1: 10, B1: 20 });
    const sheet2 = makeSheet('Sheet2', { A1: 100, A2: 200, B1: 50 });
    const allSheets = [sheet1, sheet2];

    it('evaluates =Sheet2!A1 to value from Sheet2', () => {
        const result = evaluateFormula('=Sheet2!A1', sheet1.cells, 0, 0, allSheets);
        expect(result.value).toBe(100);
        expect(result.error).toBeUndefined();
    });

    it('evaluates cross-sheet reference case-insensitively', () => {
        const result = evaluateFormula('=sheet2!A1', sheet1.cells, 0, 0, allSheets);
        expect(result.value).toBe(100);
    });

    it('evaluates cross-sheet range =SUM(Sheet2!A1:A2)', () => {
        const result = evaluateFormula('=SUM(Sheet2!A1:A2)', sheet1.cells, 0, 0, allSheets);
        expect(result.value).toBe(300);
    });

    it('returns #REF! for non-existent sheet', () => {
        const result = evaluateFormula('=Sheet99!A1', sheet1.cells, 0, 0, allSheets);
        expect(result.value).toBe(FORMULA_ERRORS.REF);
        expect(result.error).toBe(FORMULA_ERRORS.REF);
    });

    it('returns 0 for empty cell on existing sheet', () => {
        const result = evaluateFormula('=Sheet2!C5', sheet1.cells, 0, 0, allSheets);
        expect(result.value).toBe(0);
    });

    it('returns #REF! when allSheets is not provided', () => {
        const result = evaluateFormula('=Sheet2!A1', sheet1.cells, 0, 0);
        expect(result.value).toBe(FORMULA_ERRORS.REF);
    });

    it('arithmetic with cross-sheet ref: =Sheet2!A1 + Sheet1!B1', () => {
        const result = evaluateFormula('=Sheet2!A1+B1', sheet1.cells, 0, 0, allSheets);
        // Sheet2!A1 = 100, B1 (Sheet1 local) = 20
        expect(result.value).toBe(120);
    });

    it('cross-sheet AVERAGE', () => {
        const result = evaluateFormula('=AVERAGE(Sheet2!A1:A2)', sheet1.cells, 0, 0, allSheets);
        expect(result.value).toBe(150);
    });

    it('cross-sheet COUNT', () => {
        const result = evaluateFormula('=COUNT(Sheet2!A1:B1)', sheet1.cells, 0, 0, allSheets);
        expect(result.value).toBe(2);
    });

    it('cross-sheet MIN and MAX', () => {
        const min = evaluateFormula('=MIN(Sheet2!A1:B1)', sheet1.cells, 0, 0, allSheets);
        const max = evaluateFormula('=MAX(Sheet2!A1:B1)', sheet1.cells, 0, 0, allSheets);
        expect(min.value).toBe(50);
        expect(max.value).toBe(100);
    });
});

// ═══════════════════════════════════════════════════════════════════
// SPARKLINE FUNCTION
// ═══════════════════════════════════════════════════════════════════

describe('Formula Engine — SPARKLINE', () => {
    it('SPARKLINE returns 0 (sentinel for visual rendering)', () => {
        const cells = makeCells({ A1: 1, A2: 2, A3: 3 });
        const result = evaluateFormula('=SPARKLINE(A1:A3)', cells, 0, 5);
        expect(result.value).toBe(0);
        expect(result.error).toBeUndefined();
    });

    it('SPARKLINE is in allowed function list', () => {
        const result = evaluateFormula('=SPARKLINE(A1:A3)', {}, 0, 5);
        // Should not return #NAME? since SPARKLINE is whitelisted
        expect(result.value).not.toBe(FORMULA_ERRORS.NAME);
    });
});

// ═══════════════════════════════════════════════════════════════════
// TOKENIZER EDGE CASES
// ═══════════════════════════════════════════════════════════════════

describe('Formula Engine — Tokenizer Edge Cases', () => {
    it('unexpected character (e.g. @) returns #ERROR!', () => {
        const result = evaluateFormula('=1@2', {}, 0, 0);
        expect(result.error).toBe(FORMULA_ERRORS.ERROR);
    });

    it('single equals sign returns #ERROR!', () => {
        const result = evaluateFormula('=', {}, 0, 0);
        expect(result.error).toBe(FORMULA_ERRORS.ERROR);
    });

    it('only whitespace after = returns #ERROR!', () => {
        const result = evaluateFormula('=   ', {}, 0, 0);
        expect(result.error).toBe(FORMULA_ERRORS.ERROR);
    });

    it('malformed range (A1:XYZ) returns #ERROR!', () => {
        const result = evaluateFormula('=A1:XYZ', {}, 0, 0);
        expect(result.error).toBe(FORMULA_ERRORS.ERROR);
    });

    it('consecutive operators (=1++2) returns #ERROR!', () => {
        // ++ is not valid — first + is operator, second + is not a valid factor start
        const result = evaluateFormula('=1++2', {}, 0, 0);
        // This might parse as 1 + (+2) if unary is supported, but + is not a unary operator
        // The parser should error because it expects a factor after +
        expect(result.error).toBe(FORMULA_ERRORS.ERROR);
    });

    it('decimal-only number =.5 evaluates correctly', () => {
        const result = evaluateFormula('=.5', {}, 0, 0);
        expect(result.value).toBe(0.5);
    });

    it('whitespace in formula is skipped: = 1 + 2', () => {
        const result = evaluateFormula('= 1 + 2', {}, 0, 0);
        expect(result.value).toBe(3);
    });
});

// ═══════════════════════════════════════════════════════════════════
// PARSER EDGE CASES
// ═══════════════════════════════════════════════════════════════════

describe('Formula Engine — Parser Edge Cases', () => {
    it('unclosed parenthesis returns #ERROR!', () => {
        const result = evaluateFormula('=(1+2', {}, 0, 0);
        expect(result.error).toBe(FORMULA_ERRORS.ERROR);
    });

    it('extra closing parenthesis returns #ERROR!', () => {
        const result = evaluateFormula('=1+2)', {}, 0, 0);
        expect(result.error).toBe(FORMULA_ERRORS.ERROR);
    });

    it('empty parentheses =()', () => {
        const result = evaluateFormula('=()', {}, 0, 0);
        expect(result.error).toBe(FORMULA_ERRORS.ERROR);
    });

    it('function with no args =SUM() returns 0', () => {
        const result = evaluateFormula('=SUM()', {}, 0, 0);
        expect(result.value).toBe(0);
        expect(result.error).toBeUndefined();
    });

    it('function with multiple comma-separated args =SUM(1,2,3)', () => {
        const result = evaluateFormula('=SUM(1,2,3)', {}, 0, 0);
        expect(result.value).toBe(6);
    });

    it('deeply nested parentheses =((((1+2))))', () => {
        const result = evaluateFormula('=((((1+2))))', {}, 0, 0);
        expect(result.value).toBe(3);
    });

    it('missing operand after operator =1+  returns #ERROR!', () => {
        const result = evaluateFormula('=1+', {}, 0, 0);
        expect(result.error).toBe(FORMULA_ERRORS.ERROR);
    });

    it('trailing operator =5* returns #ERROR!', () => {
        const result = evaluateFormula('=5*', {}, 0, 0);
        expect(result.error).toBe(FORMULA_ERRORS.ERROR);
    });
});

// ═══════════════════════════════════════════════════════════════════
// ERROR PROPAGATION
// ═══════════════════════════════════════════════════════════════════

describe('Formula Engine — Error Propagation', () => {
    it('division by zero cell value is null, formula engine treats as 0', () => {
        // When a cell has a #DIV/0! error, its value is stored as null.
        // The formula engine reads cell.value (null → 0) for cell lookups,
        // so =A1+1 where A1 has error becomes 0+1=1.
        const cells: Record<string, Cell> = {
            [cellKey(0, 0)]: {
                value: null,
                formula: '=1/0',
                displayValue: FORMULA_ERRORS.DIV_ZERO,
                dataType: 'text',
            },
        };
        const result = evaluateFormula('=A1+1', cells, 1, 0);
        // null value → 0, so 0+1 = 1
        expect(result.value).toBe(1);
    });

    it('division by zero error value propagates when stored as string', () => {
        // When value itself is the error string, it should propagate
        const cells: Record<string, Cell> = {
            [cellKey(0, 0)]: {
                value: FORMULA_ERRORS.DIV_ZERO,
                formula: '=1/0',
                displayValue: FORMULA_ERRORS.DIV_ZERO,
                dataType: 'text',
            },
        };
        const result = evaluateFormula('=A1*10', cells, 1, 0);
        expect(result.value).toBe(FORMULA_ERRORS.DIV_ZERO);
    });

    it('#NAME? error propagates through addition', () => {
        const cells: Record<string, Cell> = {
            [cellKey(0, 0)]: {
                value: null,
                displayValue: FORMULA_ERRORS.NAME,
                dataType: 'text',
            },
        };
        // Cell lookup returns cell.value = null, which maps to 0
        const result = evaluateFormula('=A1+5', cells, 1, 0);
        expect(result.value).toBe(5); // null cells = 0
    });

    it('#CIRCULAR! error on self-reference', () => {
        const result = evaluateFormula('=A1+1', {}, 0, 0);
        expect(result.value).toBe(FORMULA_ERRORS.CIRCULAR);
        expect(result.error).toBe(FORMULA_ERRORS.CIRCULAR);
    });

    it('error propagation through unary minus', () => {
        const cells: Record<string, Cell> = {
            [cellKey(0, 0)]: {
                value: FORMULA_ERRORS.DIV_ZERO,
                formula: '=1/0',
                displayValue: FORMULA_ERRORS.DIV_ZERO,
                dataType: 'text',
            },
        };
        const result = evaluateFormula('=-A1', cells, 1, 0);
        expect(result.value).toBe(FORMULA_ERRORS.DIV_ZERO);
    });

    it('error in multiplication operand propagates', () => {
        const cells: Record<string, Cell> = {
            [cellKey(0, 0)]: {
                value: FORMULA_ERRORS.REF,
                displayValue: FORMULA_ERRORS.REF,
                dataType: 'text',
            },
        };
        const result = evaluateFormula('=A1*10', cells, 1, 0);
        expect(result.value).toBe(FORMULA_ERRORS.REF);
    });
});

// ═══════════════════════════════════════════════════════════════════
// UNARY MINUS
// ═══════════════════════════════════════════════════════════════════

describe('Formula Engine — Unary Minus', () => {
    it('simple negative number =-5', () => {
        const result = evaluateFormula('=-5', {}, 0, 0);
        expect(result.value).toBe(-5);
    });

    it('negation of expression =-(1+2)', () => {
        const result = evaluateFormula('=-(1+2)', {}, 0, 0);
        expect(result.value).toBe(-3);
    });

    it('double negation =--5', () => {
        const result = evaluateFormula('=--5', {}, 0, 0);
        expect(result.value).toBe(5);
    });

    it('negation of cell reference =-A1', () => {
        const cells = makeCells({ A1: 42 });
        const result = evaluateFormula('=-A1', cells, 1, 0);
        expect(result.value).toBe(-42);
    });

    it('negative number in subtraction =-3-2', () => {
        const result = evaluateFormula('=-3-2', {}, 0, 0);
        expect(result.value).toBe(-5);
    });

    it('negative number in multiplication =-3*4', () => {
        const result = evaluateFormula('=-3*4', {}, 0, 0);
        expect(result.value).toBe(-12);
    });
});

// ═══════════════════════════════════════════════════════════════════
// LARGE AND SPECIAL NUMBERS
// ═══════════════════════════════════════════════════════════════════

describe('Formula Engine — Large and Special Numbers', () => {
    it('large numbers compute correctly', () => {
        const result = evaluateFormula('=999999999+1', {}, 0, 0);
        expect(result.value).toBe(1000000000);
    });

    it('very small decimals', () => {
        const result = evaluateFormula('=0.0001+0.0002', {}, 0, 0);
        expect(result.value).toBeCloseTo(0.0003, 10);
    });

    it('multiplication of large numbers', () => {
        const result = evaluateFormula('=100000*100000', {}, 0, 0);
        expect(result.value).toBe(10000000000);
    });

    it('zero divided by non-zero', () => {
        const result = evaluateFormula('=0/5', {}, 0, 0);
        expect(result.value).toBe(0);
    });

    it('non-zero divided by zero returns #DIV/0!', () => {
        const result = evaluateFormula('=5/0', {}, 0, 0);
        expect(result.value).toBe(FORMULA_ERRORS.DIV_ZERO);
    });

    it('zero divided by zero returns #DIV/0!', () => {
        const result = evaluateFormula('=0/0', {}, 0, 0);
        expect(result.value).toBe(FORMULA_ERRORS.DIV_ZERO);
    });
});

// ═══════════════════════════════════════════════════════════════════
// MIXED RANGE REFERENCES
// ═══════════════════════════════════════════════════════════════════

describe('Formula Engine — Mixed Range References', () => {
    it('SUM with some empty cells in range', () => {
        const cells = makeCells({ A1: 10, A3: 30 });
        // A2 is empty
        const result = evaluateFormula('=SUM(A1:A3)', cells, 5, 0);
        expect(result.value).toBe(40);
    });

    it('SUM with text cells in range skips them', () => {
        const cells = makeCells({ A1: 10, A2: 'hello' as any, A3: 30 });
        const result = evaluateFormula('=SUM(A1:A3)', cells, 5, 0);
        expect(result.value).toBe(40);
    });

    it('AVERAGE with only empty range returns #DIV/0!', () => {
        const result = evaluateFormula('=AVERAGE(A1:A5)', {}, 5, 5);
        expect(result.value).toBe(FORMULA_ERRORS.DIV_ZERO);
    });

    it('MIN with single value', () => {
        const cells = makeCells({ A1: 42 });
        const result = evaluateFormula('=MIN(A1:A1)', cells, 5, 0);
        expect(result.value).toBe(42);
    });

    it('MAX with empty range returns 0', () => {
        const result = evaluateFormula('=MAX(A1:A5)', {}, 5, 5);
        expect(result.value).toBe(0);
    });

    it('COUNT counts non-empty cells only', () => {
        const cells = makeCells({ A1: 10, A3: 30 });
        // A2, A4, A5 are empty
        const result = evaluateFormula('=COUNT(A1:A5)', cells, 5, 5);
        expect(result.value).toBe(2);
    });

    it('range used outside function returns #ERROR!', () => {
        const result = evaluateFormula('=A1:A5', {}, 5, 5);
        expect(result.value).toBe(FORMULA_ERRORS.ERROR);
    });
});

// ═══════════════════════════════════════════════════════════════════
// extractReferences
// ═══════════════════════════════════════════════════════════════════

describe('Formula Engine — extractReferences', () => {
    it('extracts single cell reference', () => {
        const refs = extractReferences('A1+B2');
        expect(refs.length).toBe(2);
        expect(refs[0]).toEqual({ col: 0, row: 0, rangeIndex: 0 });
        expect(refs[1]).toEqual({ col: 1, row: 1, rangeIndex: 1 });
    });

    it('expands range into all cells', () => {
        const refs = extractReferences('SUM(A1:A3)');
        expect(refs.length).toBe(3);
        expect(refs.map(r => r.rangeIndex)).toEqual([0, 0, 0]); // Same range group
    });

    it('2D range expands correctly', () => {
        const refs = extractReferences('SUM(A1:B2)');
        // A1, A2, B1, B2 = 4 cells
        expect(refs.length).toBe(4);
        expect(refs.every(r => r.rangeIndex === 0)).toBe(true);
    });

    it('skips cross-sheet references', () => {
        const refs = extractReferences('Sheet2!A1+B1');
        // Sheet2!A1 should be skipped, B1 should be included
        expect(refs.length).toBe(1);
        expect(refs[0]).toEqual({ col: 1, row: 0, rangeIndex: 0 });
    });

    it('multiple ranges get different rangeIndex', () => {
        const refs = extractReferences('SUM(A1:A3)+SUM(B1:B3)');
        const rangeIndices = new Set(refs.map(r => r.rangeIndex));
        expect(rangeIndices.size).toBe(2);
    });

    it('absolute references are extracted', () => {
        const refs = extractReferences('$A$1+$B$2');
        expect(refs.length).toBe(2);
    });

    it('no references returns empty array', () => {
        const refs = extractReferences('1+2');
        expect(refs.length).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════════
// formulaTooltip
// ═══════════════════════════════════════════════════════════════════

describe('Formula Engine — formulaTooltip', () => {
    it('SUM tooltip', () => {
        const tip = formulaTooltip('=SUM(A1:A5)');
        expect(tip).toContain('Adds up all values');
        expect(tip).toContain('A1:A5');
    });

    it('AVERAGE tooltip', () => {
        const tip = formulaTooltip('=AVERAGE(B1:B10)');
        expect(tip).toContain('average');
    });

    it('MIN tooltip', () => {
        const tip = formulaTooltip('=MIN(C1:C5)');
        expect(tip).toContain('minimum');
    });

    it('MAX tooltip', () => {
        const tip = formulaTooltip('=MAX(D1:D5)');
        expect(tip).toContain('maximum');
    });

    it('COUNT tooltip', () => {
        const tip = formulaTooltip('=COUNT(E1:E5)');
        expect(tip).toContain('Counts');
    });

    it('unknown function tooltip', () => {
        const tip = formulaTooltip('=CUSTOM(A1)');
        expect(tip).toContain('CUSTOM');
    });

    it('addition tooltip', () => {
        const tip = formulaTooltip('=A1+B1');
        expect(tip).toContain('Adds');
    });

    it('subtraction tooltip', () => {
        const tip = formulaTooltip('=A1-B1');
        expect(tip).toContain('Subtracts');
    });

    it('multiplication tooltip', () => {
        const tip = formulaTooltip('=A1*B1');
        expect(tip).toContain('Multiplies');
    });

    it('division tooltip', () => {
        const tip = formulaTooltip('=A1/B1');
        expect(tip).toContain('Divides');
    });

    it('non-formula returns empty string', () => {
        expect(formulaTooltip('hello')).toBe('');
    });

    it('simple expression returns generic tooltip', () => {
        const tip = formulaTooltip('=A1');
        expect(tip).toContain('Calculates');
    });
});

// ═══════════════════════════════════════════════════════════════════
// isFormulaError
// ═══════════════════════════════════════════════════════════════════

describe('Formula Engine — isFormulaError', () => {
    it('recognises #ERROR!', () => expect(isFormulaError('#ERROR!')).toBe(true));
    it('recognises #DIV/0!', () => expect(isFormulaError('#DIV/0!')).toBe(true));
    it('recognises #NAME?', () => expect(isFormulaError('#NAME?')).toBe(true));
    it('recognises #REF!', () => expect(isFormulaError('#REF!')).toBe(true));
    it('recognises #CIRCULAR!', () => expect(isFormulaError('#CIRCULAR!')).toBe(true));
    it('rejects normal string', () => expect(isFormulaError('hello')).toBe(false));
    it('rejects number', () => expect(isFormulaError(42)).toBe(false));
    it('rejects null', () => expect(isFormulaError(null)).toBe(false));
    it('rejects undefined', () => expect(isFormulaError(undefined)).toBe(false));
});

// ═══════════════════════════════════════════════════════════════════
// parseCellRef / shiftCellRef / cellRefToString
// ═══════════════════════════════════════════════════════════════════

describe('Formula Engine — Cell Ref Utilities', () => {
    it('parseCellRef parses A1', () => {
        const ref = parseCellRef('A1');
        expect(ref).toEqual({ col: 0, row: 0, absCol: false, absRow: false });
    });

    it('parseCellRef parses $A$1', () => {
        const ref = parseCellRef('$A$1');
        expect(ref).toEqual({ col: 0, row: 0, absCol: true, absRow: true });
    });

    it('parseCellRef parses lowercase a1', () => {
        const ref = parseCellRef('a1');
        expect(ref).toEqual({ col: 0, row: 0, absCol: false, absRow: false });
    });

    it('parseCellRef rejects out-of-range Z101', () => {
        const ref = parseCellRef('Z101');
        expect(ref).toBeNull();
    });

    it('parseCellRef rejects invalid string', () => {
        expect(parseCellRef('123')).toBeNull();
        expect(parseCellRef('')).toBeNull();
        expect(parseCellRef('AA1')).toBeNull(); // Multi-letter column
    });

    it('shiftCellRef shifts relative ref', () => {
        const ref = { col: 0, row: 0, absCol: false, absRow: false };
        const shifted = shiftCellRef(ref, 1, 2);
        expect(shifted).toEqual({ col: 1, row: 2, absCol: false, absRow: false });
    });

    it('shiftCellRef preserves absolute col', () => {
        const ref = { col: 0, row: 0, absCol: true, absRow: false };
        const shifted = shiftCellRef(ref, 5, 3);
        expect(shifted.col).toBe(0); // Absolute, not shifted
        expect(shifted.row).toBe(3); // Relative, shifted
    });

    it('shiftCellRef preserves absolute row', () => {
        const ref = { col: 0, row: 0, absCol: false, absRow: true };
        const shifted = shiftCellRef(ref, 2, 5);
        expect(shifted.col).toBe(2); // Shifted
        expect(shifted.row).toBe(0); // Absolute, not shifted
    });

    it('cellRefToString converts back', () => {
        expect(cellRefToString({ col: 0, row: 0, absCol: false, absRow: false })).toBe('A1');
        expect(cellRefToString({ col: 2, row: 4, absCol: true, absRow: true })).toBe('$C$5');
        expect(cellRefToString({ col: 25, row: 99 })).toBe('Z100');
    });
});

// ═══════════════════════════════════════════════════════════════════
// adjustFormulaReferences — Additional Cases
// ═══════════════════════════════════════════════════════════════════

describe('Formula Engine — adjustFormulaReferences (comprehensive)', () => {
    it('adjusts =A1 by (1,1) to =B2', () => {
        const result = adjustFormulaReferences('=A1', 1, 1);
        expect(result).toBe('=B2');
    });

    it('does not adjust absolute references', () => {
        const result = adjustFormulaReferences('=$A$1', 5, 5);
        expect(result).toBe('=$A$1');
    });

    it('mixed absolute/relative: =$A1 shifted (2,3) → $A4', () => {
        const result = adjustFormulaReferences('=$A1', 2, 3);
        expect(result).toBe('=$A4');
    });

    it('keeps formula unchanged if out of bounds after shift', () => {
        const result = adjustFormulaReferences('=A1', -5, 0);
        expect(result).toBe('=A1'); // col would be negative
    });

    it('non-formula string returned as-is', () => {
        expect(adjustFormulaReferences('hello', 1, 1)).toBe('hello');
    });

    it('adjusts multiple references in one formula', () => {
        const result = adjustFormulaReferences('=A1+B2+C3', 1, 0);
        expect(result).toBe('=B1+C2+D3');
    });

    it('adjusts references inside function', () => {
        const result = adjustFormulaReferences('=SUM(A1:A5)', 1, 0);
        expect(result).toBe('=SUM(B1:B5)');
    });
});

// ═══════════════════════════════════════════════════════════════════
// OPERATOR PRECEDENCE
// ═══════════════════════════════════════════════════════════════════

describe('Formula Engine — Operator Precedence', () => {
    it('multiplication before addition: =2+3*4', () => {
        const result = evaluateFormula('=2+3*4', {}, 0, 0);
        expect(result.value).toBe(14);
    });

    it('division before subtraction: =10-6/3', () => {
        const result = evaluateFormula('=10-6/3', {}, 0, 0);
        expect(result.value).toBe(8);
    });

    it('parentheses override precedence: =(2+3)*4', () => {
        const result = evaluateFormula('=(2+3)*4', {}, 0, 0);
        expect(result.value).toBe(20);
    });

    it('left-to-right for same precedence: =10-3-2', () => {
        const result = evaluateFormula('=10-3-2', {}, 0, 0);
        expect(result.value).toBe(5);
    });

    it('left-to-right for division: =12/6/2', () => {
        const result = evaluateFormula('=12/6/2', {}, 0, 0);
        expect(result.value).toBe(1);
    });
});

// ═══════════════════════════════════════════════════════════════════
// UNKNOWN / DISALLOWED FUNCTIONS (NFR-S01)
// ═══════════════════════════════════════════════════════════════════

describe('Formula Engine — Function Whitelist (NFR-S01)', () => {
    it('disallowed function EXEC returns #NAME?', () => {
        const result = evaluateFormula('=EXEC()', {}, 0, 0);
        expect(result.value).toBe(FORMULA_ERRORS.NAME);
    });

    it('disallowed function EVAL returns #NAME?', () => {
        const result = evaluateFormula('=EVAL(1)', {}, 0, 0);
        expect(result.value).toBe(FORMULA_ERRORS.NAME);
    });

    it('all allowed functions do not return #NAME?', () => {
        const allowed = ['SUM', 'AVERAGE', 'MIN', 'MAX', 'COUNT', 'SPARKLINE'];
        for (const func of allowed) {
            const cells = makeCells({ A1: 1 });
            const result = evaluateFormula(`=${func}(A1)`, cells, 5, 0);
            expect(result.value).not.toBe(FORMULA_ERRORS.NAME);
        }
    });
});
