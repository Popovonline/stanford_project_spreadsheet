import { describe, it, expect } from 'vitest';
import {
    evaluateFormula,
    adjustFormulaReferences,
    parseCellRef,
    cellRefToString,
    shiftCellRef,
    isFormulaError,
    formulaTooltip,
    FORMULA_ERRORS,
} from '@/lib/formula-engine';
import { cellKey, type Cell } from '@/types/spreadsheet';

// Helper to create a cells record with numeric values
function makeCells(entries: Record<string, number | string>): Record<string, Cell> {
    const cells: Record<string, Cell> = {};
    for (const [ref, val] of Object.entries(entries)) {
        // ref is like "A1", convert to col,row key
        const match = ref.match(/^([A-Z])(\d+)$/i);
        if (!match) continue;
        const col = match[1].toUpperCase().charCodeAt(0) - 65;
        const row = parseInt(match[2], 10) - 1;
        const key = cellKey(col, row);
        if (typeof val === 'number') {
            cells[key] = { value: val, dataType: 'number' };
        } else {
            cells[key] = { value: val, dataType: 'text' };
        }
    }
    return cells;
}

// ─── Arithmetic ──────────────────────────────────────────────────────
describe('Formula Engine — Arithmetic', () => {
    it('evaluates simple addition =1+2', () => {
        const result = evaluateFormula('=1+2', {}, 0, 0);
        expect(result.value).toBe(3);
        expect(result.error).toBeFalsy();
    });

    it('evaluates subtraction =5-3', () => {
        const result = evaluateFormula('=5-3', {}, 0, 0);
        expect(result.value).toBe(2);
    });

    it('evaluates multiplication =3*4', () => {
        const result = evaluateFormula('=3*4', {}, 0, 0);
        expect(result.value).toBe(12);
    });

    it('evaluates division =10/2', () => {
        const result = evaluateFormula('=10/2', {}, 0, 0);
        expect(result.value).toBe(5);
    });

    it('returns #DIV/0! for division by zero', () => {
        const result = evaluateFormula('=1/0', {}, 0, 0);
        expect(result.value).toBe(FORMULA_ERRORS.DIV_ZERO);
        expect(result.error).toBeTruthy();
    });

    it('evaluates nested parentheses =(1+2)*3', () => {
        const result = evaluateFormula('=(1+2)*3', {}, 0, 0);
        expect(result.value).toBe(9);
    });

    it('evaluates unary minus =-5', () => {
        const result = evaluateFormula('=-5', {}, 0, 0);
        expect(result.value).toBe(-5);
    });

    it('evaluates complex expression =(10-2)*(3+1)/4', () => {
        const result = evaluateFormula('=(10-2)*(3+1)/4', {}, 0, 0);
        expect(result.value).toBe(8);
    });

    it('handles just "=" with no expression', () => {
        const result = evaluateFormula('=', {}, 0, 0);
        // Should be an error or 0
        expect(result.error).toBeTruthy();
    });
});

// ─── Cell References ────────────────────────────────────────────────
describe('Formula Engine — Cell References', () => {
    it('evaluates =A1 with value', () => {
        const cells = makeCells({ A1: 42 });
        const result = evaluateFormula('=A1', cells, 1, 0); // From B1
        expect(result.value).toBe(42);
    });

    it('evaluates =A1 referencing empty cell returns 0', () => {
        const result = evaluateFormula('=A1', {}, 1, 0);
        expect(result.value).toBe(0);
    });

    it('evaluates =A1+A2 with both values', () => {
        const cells = makeCells({ A1: 10, A2: 20 });
        const result = evaluateFormula('=A1+A2', cells, 2, 0);
        expect(result.value).toBe(30);
    });

    it('evaluates case-insensitive cell refs =a1', () => {
        const cells = makeCells({ A1: 7 });
        const result = evaluateFormula('=a1', cells, 1, 0);
        expect(result.value).toBe(7);
    });
});

// ─── Functions ──────────────────────────────────────────────────────
describe('Formula Engine — Functions', () => {
    it('evaluates SUM(A1:A3)', () => {
        const cells = makeCells({ A1: 10, A2: 20, A3: 30 });
        const result = evaluateFormula('=SUM(A1:A3)', cells, 5, 0);
        expect(result.value).toBe(60);
    });

    it('SUM ignores empty cells in range', () => {
        const cells = makeCells({ A1: 10, A3: 30 }); // A2 is empty
        const result = evaluateFormula('=SUM(A1:A3)', cells, 5, 0);
        expect(result.value).toBe(40);
    });

    it('SUM ignores text cells', () => {
        const cells = makeCells({ A1: 10, A2: 'hello', A3: 30 });
        const result = evaluateFormula('=SUM(A1:A3)', cells, 5, 0);
        expect(result.value).toBe(40);
    });

    it('evaluates AVERAGE(A1:A3)', () => {
        const cells = makeCells({ A1: 10, A2: 20, A3: 30 });
        const result = evaluateFormula('=AVERAGE(A1:A3)', cells, 5, 0);
        expect(result.value).toBe(20);
    });

    it('evaluates MIN(A1:A5)', () => {
        const cells = makeCells({ A1: 50, A2: 10, A3: 30, A4: 40, A5: 20 });
        const result = evaluateFormula('=MIN(A1:A5)', cells, 5, 0);
        expect(result.value).toBe(10);
    });

    it('evaluates MAX(A1:A5)', () => {
        const cells = makeCells({ A1: 50, A2: 10, A3: 30, A4: 40, A5: 20 });
        const result = evaluateFormula('=MAX(A1:A5)', cells, 5, 0);
        expect(result.value).toBe(50);
    });

    it('evaluates COUNT(A1:A5)', () => {
        const cells = makeCells({ A1: 50, A2: 10, A3: 30 }); // A4, A5 empty
        const result = evaluateFormula('=COUNT(A1:A5)', cells, 5, 0);
        expect(result.value).toBe(3);
    });

    it('evaluates case-insensitive function =sum(A1:A3)', () => {
        const cells = makeCells({ A1: 1, A2: 2, A3: 3 });
        const result = evaluateFormula('=sum(A1:A3)', cells, 5, 0);
        expect(result.value).toBe(6);
    });

    it('returns #NAME? for unknown function =FOO(A1)', () => {
        const cells = makeCells({ A1: 10 });
        const result = evaluateFormula('=FOO(A1)', cells, 5, 0);
        expect(result.value).toBe(FORMULA_ERRORS.NAME);
        expect(result.error).toBeTruthy();
    });

    it('evaluates nested expression =SUM(A1,A2)+1', () => {
        const cells = makeCells({ A1: 10, A2: 20 });
        const result = evaluateFormula('=SUM(A1,A2)+1', cells, 5, 0);
        // SUM(A1,A2) should treat individual cells as args
        expect(result.value).toBe(31);
    });
});

// ─── Error Handling ─────────────────────────────────────────────────
describe('Formula Engine — Error Handling', () => {
    it('returns error for invalid formula =+++', () => {
        const result = evaluateFormula('=+++', {}, 0, 0);
        expect(result.error).toBeTruthy();
    });

    it('returns error for mismatched parentheses =(1+2', () => {
        const result = evaluateFormula('=(1+2', {}, 0, 0);
        expect(result.error).toBeTruthy();
    });

    it('detects circular reference (self-reference)', () => {
        // =A1 evaluated from cell A1 (col=0, row=0)
        const result = evaluateFormula('=A1', {}, 0, 0);
        expect(result.value).toBe(FORMULA_ERRORS.CIRCULAR);
        expect(result.error).toBeTruthy();
    });
});

// ─── Cell Ref Parsing ───────────────────────────────────────────────
describe('parseCellRef', () => {
    it('parses "A1" correctly', () => {
        const ref = parseCellRef('A1');
        expect(ref).not.toBeNull();
        expect(ref!.col).toBe(0);
        expect(ref!.row).toBe(0);
        expect(ref!.absCol).toBeFalsy();
        expect(ref!.absRow).toBeFalsy();
    });

    it('parses "$A$1" as absolute', () => {
        const ref = parseCellRef('$A$1');
        expect(ref).not.toBeNull();
        expect(ref!.col).toBe(0);
        expect(ref!.row).toBe(0);
        expect(ref!.absCol).toBe(true);
        expect(ref!.absRow).toBe(true);
    });

    it('parses "Z100" correctly', () => {
        const ref = parseCellRef('Z100');
        expect(ref).not.toBeNull();
        expect(ref!.col).toBe(25);
        expect(ref!.row).toBe(99);
    });

    it('returns null for invalid ref', () => {
        expect(parseCellRef('invalid')).toBeNull();
    });
});

// ─── Shift Cell Ref ──────────────────────────────────────────────────
describe('shiftCellRef', () => {
    it('shifts relative reference by offset', () => {
        const ref = parseCellRef('A1')!;
        const shifted = shiftCellRef(ref, 1, 1);
        expect(shifted.col).toBe(1);
        expect(shifted.row).toBe(1);
    });

    it('does not shift absolute column', () => {
        const ref = parseCellRef('$A1')!;
        const shifted = shiftCellRef(ref, 5, 0);
        expect(shifted.col).toBe(0); // stays at A
    });

    it('does not shift absolute row', () => {
        const ref = parseCellRef('A$1')!;
        const shifted = shiftCellRef(ref, 0, 5);
        expect(shifted.row).toBe(0); // stays at row 0
    });
});

// ─── cellRefToString ────────────────────────────────────────────────
describe('cellRefToString', () => {
    it('converts simple ref back to string', () => {
        const ref = parseCellRef('B5')!;
        expect(cellRefToString(ref)).toBe('B5');
    });

    it('converts absolute ref back with $ signs', () => {
        const ref = parseCellRef('$C$10')!;
        expect(cellRefToString(ref)).toBe('$C$10');
    });
});

// ─── adjustFormulaReferences ────────────────────────────────────────
describe('adjustFormulaReferences', () => {
    it('shifts relative references', () => {
        const result = adjustFormulaReferences('=A1+B2', 1, 1);
        expect(result).toBe('=B2+C3');
    });

    it('keeps absolute references unchanged', () => {
        const result = adjustFormulaReferences('=$A$1+B2', 1, 1);
        expect(result).toBe('=$A$1+C3');
    });

    it('handles range references', () => {
        const result = adjustFormulaReferences('=SUM(A1:A3)', 1, 0);
        expect(result).toBe('=SUM(B1:B3)');
    });

    it('handles mixed absolute/relative', () => {
        const result = adjustFormulaReferences('=$A1', 1, 1);
        expect(result).toBe('=$A2');
    });
});

// ─── isFormulaError ──────────────────────────────────────────────────
describe('isFormulaError', () => {
    it('identifies #ERROR!', () => {
        expect(isFormulaError(FORMULA_ERRORS.ERROR)).toBe(true);
    });

    it('identifies #DIV/0!', () => {
        expect(isFormulaError(FORMULA_ERRORS.DIV_ZERO)).toBe(true);
    });

    it('identifies #NAME?', () => {
        expect(isFormulaError(FORMULA_ERRORS.NAME)).toBe(true);
    });

    it('does not identify normal string', () => {
        expect(isFormulaError('hello')).toBe(false);
    });

    it('does not identify number', () => {
        expect(isFormulaError(42)).toBe(false);
    });
});

// ─── formulaTooltip ─────────────────────────────────────────────────
describe('formulaTooltip', () => {
    it('returns a tooltip string for known functions', () => {
        const tip = formulaTooltip('=SUM(A1:A3)');
        expect(tip).toBeTruthy();
        expect(typeof tip).toBe('string');
    });
});
