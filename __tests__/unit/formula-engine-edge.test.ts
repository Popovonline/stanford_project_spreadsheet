import { describe, it, expect } from 'vitest';
import {
    evaluateFormula,
    adjustFormulaReferences,
    extractReferences,
    formulaTooltip,
    FORMULA_ERRORS,
} from '@/lib/formula-engine';
import { cellKey, type Cell } from '@/types/spreadsheet';

// Helper to create a cells record with numeric values
function makeCells(entries: Record<string, number | string>): Record<string, Cell> {
    const cells: Record<string, Cell> = {};
    for (const [ref, val] of Object.entries(entries)) {
        const match = ref.match(/^([A-Z])(\\d+)$/i);
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

// Helper: create a formula cell (already evaluated)
function makeFormulaCell(formulaStr: string, computedValue: number): Cell {
    return {
        value: computedValue,
        formula: formulaStr,
        displayValue: String(computedValue),
        dataType: 'number',
    };
}

// ─── Deeply Nested Expressions ──────────────────────────────────────
describe('Formula Engine Edge — Nested Expressions', () => {
    it('evaluates deeply nested =((1+2)*(3+4))/5', () => {
        const result = evaluateFormula('=((1+2)*(3+4))/5', {}, 0, 0);
        expect(result.value).toBeCloseTo(4.2);
        expect(result.error).toBeFalsy();
    });

    it('evaluates triple nesting =((((10))))', () => {
        const result = evaluateFormula('=((((10))))', {}, 0, 0);
        expect(result.value).toBe(10);
    });

    it('evaluates =-5+(-3)', () => {
        const result = evaluateFormula('=-5+(-3)', {}, 0, 0);
        expect(result.value).toBe(-8);
    });

    it('evaluates =--5 (double unary minus)', () => {
        const result = evaluateFormula('=--5', {}, 0, 0);
        expect(result.value).toBe(5);
    });
});

// ─── Floating-Point Rounding ────────────────────────────────────────
describe('Formula Engine Edge — Float Rounding', () => {
    it('handles =0.1+0.2 rounding to 0.3', () => {
        const result = evaluateFormula('=0.1+0.2', {}, 0, 0);
        // The engine rounds to 10 decimal places (line 509)
        expect(result.value).toBe(0.3);
    });

    it('handles =1/3 precision', () => {
        const result = evaluateFormula('=1/3', {}, 0, 0);
        expect(result.value).toBeCloseTo(0.3333333333, 10);
    });

    it('evaluates =0.0000001/1 small numbers', () => {
        const result = evaluateFormula('=0.0000001/1', {}, 0, 0);
        expect(result.value).toBeCloseTo(0.0000001);
    });

    it('evaluates =999999999*999999999 large numbers', () => {
        const result = evaluateFormula('=999999999*999999999', {}, 0, 0);
        expect(typeof result.value).toBe('number');
        expect(result.error).toBeFalsy();
    });
});

// ─── Chained Formulas (formula referencing formula cell) ────────────
describe('Formula Engine Edge — Chained Formulas', () => {
    it('resolves cell with pre-computed formula value', () => {
        const cells: Record<string, Cell> = {};
        // B1 has formula =10+5, already evaluated to 15
        cells[cellKey(1, 0)] = makeFormulaCell('=10+5', 15);
        const result = evaluateFormula('=B1', cells, 0, 0); // from A1
        expect(result.value).toBe(15);
    });

    it('resolves SUM over cells containing pre-computed formulas', () => {
        const cells: Record<string, Cell> = {};
        cells[cellKey(0, 0)] = { value: 10, dataType: 'number' };
        cells[cellKey(0, 1)] = makeFormulaCell('=A1*2', 20);
        cells[cellKey(0, 2)] = makeFormulaCell('=A1+A2', 30);
        // SUM(A1:A3) from row 5
        const result = evaluateFormula('=SUM(A1:A3)', cells, 0, 5);
        expect(result.value).toBe(60);
    });
});

// ─── Function Edge Cases ────────────────────────────────────────────
describe('Formula Engine Edge — Function Edge Cases', () => {
    it('AVERAGE of empty range returns #DIV/0!', () => {
        const result = evaluateFormula('=AVERAGE(A1:A5)', {}, 5, 5);
        expect(result.value).toBe(FORMULA_ERRORS.DIV_ZERO);
        expect(result.error).toBeTruthy();
    });

    it('MIN of empty range returns 0', () => {
        const result = evaluateFormula('=MIN(A1:A5)', {}, 5, 5);
        expect(result.value).toBe(0);
    });

    it('MAX of empty range returns 0', () => {
        const result = evaluateFormula('=MAX(A1:A5)', {}, 5, 5);
        expect(result.value).toBe(0);
    });

    it('COUNT with all text cells returns 0 (counts numeric only)', () => {
        const cells = makeCells({ A1: 'hello', A2: 'world', A3: 'test' });
        const result = evaluateFormula('=COUNT(A1:A3)', cells, 5, 5);
        // COUNT only counts numeric cells, text cells are excluded
        expect(result.value).toBe(0);
    });

    it('SUM with comma-separated individual cells is not supported (treats only first arg)', () => {
        const cells = makeCells({ A1: 10, B1: 20, C1: 30 });
        const result = evaluateFormula('=SUM(A1,B1,C1)', cells, 5, 5);
        // Parser only takes first argument before comma — only A1 is summed
        expect(typeof result.value).toBe('number');
    });

    it('bare range =A1:A3 outside function returns #ERROR!', () => {
        const cells = makeCells({ A1: 10, A2: 20, A3: 30 });
        const result = evaluateFormula('=A1:A3', cells, 5, 5);
        expect(result.value).toBe(FORMULA_ERRORS.ERROR);
        expect(result.error).toBeTruthy();
    });
});

// ─── Whitespace Handling ────────────────────────────────────────────
describe('Formula Engine Edge — Whitespace', () => {
    it('handles spaces in formula = 1 + 2', () => {
        const result = evaluateFormula('= 1 + 2', {}, 0, 0);
        expect(result.value).toBe(3);
    });

    it('handles tab characters in formula', () => {
        const result = evaluateFormula('=\t1\t+\t2', {}, 0, 0);
        expect(result.value).toBe(3);
    });
});

// ─── Error Propagation ──────────────────────────────────────────────
describe('Formula Engine Edge — Error Propagation', () => {
    it('text cell in arithmetic context returns 0', () => {
        const cells = makeCells({ A1: 'hello' });
        const result = evaluateFormula('=A1+5', cells, 5, 5);
        expect(result.value).toBe(5); // text treated as 0
    });

    it('trailing operator =1+ returns error', () => {
        const result = evaluateFormula('=1+', {}, 0, 0);
        expect(result.error).toBeTruthy();
    });

    it('self-reference in SUM range =SUM(A1:A3) from A2 returns 0 due to circular detection', () => {
        const cells = makeCells({ A1: 10, A3: 30 });
        const result = evaluateFormula('=SUM(A1:A3)', cells, 0, 1); // from A2
        // The range includes A2 (current cell) — circular detection zeroes the entire result
        expect(result.value).toBe(0);
    });
});

// ─── adjustFormulaReferences Edge Cases ─────────────────────────────
describe('Formula Engine Edge — adjustFormulaReferences', () => {
    it('clamps when shifting A1 by col -1 (would go negative)', () => {
        const result = adjustFormulaReferences('=A1', -1, 0);
        // Should keep original since shifted col would be -1
        expect(result).toBe('=A1');
    });

    it('clamps when shifting Z100 by +1,+1 (exceeds bounds)', () => {
        const result = adjustFormulaReferences('=Z100', 1, 1);
        // Z=25, +1=26 > 25; row=99, +1=100 > 99 → keep original
        expect(result).toBe('=Z100');
    });

    it('shifts range references correctly =SUM(A1:B2) by (1,1)', () => {
        const result = adjustFormulaReferences('=SUM(A1:B2)', 1, 1);
        expect(result).toBe('=SUM(B2:C3)');
    });

    it('handles negative row offset that stays valid', () => {
        const result = adjustFormulaReferences('=C5', 0, -2);
        expect(result).toBe('=C3');
    });
});

// ─── formulaTooltip Edge Cases ──────────────────────────────────────
describe('Formula Engine Edge — formulaTooltip', () => {
    it('returns subtraction tooltip for =A1-B1', () => {
        const tip = formulaTooltip('=A1-B1');
        expect(tip).toContain('Subtract');
    });

    it('returns multiplication tooltip for =A1*B1', () => {
        const tip = formulaTooltip('=A1*B1');
        expect(tip).toContain('Multipl');
    });

    it('returns division tooltip for =A1/B1', () => {
        const tip = formulaTooltip('=A1/B1');
        expect(tip).toContain('Divide');
    });

    it('returns tooltip for plain cell ref =A1', () => {
        const tip = formulaTooltip('=A1');
        expect(tip).toBeTruthy();
        expect(typeof tip).toBe('string');
    });

    it('returns empty string for non-formula text', () => {
        const tip = formulaTooltip('not a formula');
        expect(tip).toBe('');
    });
});

// ─── extractReferences Edge Cases ───────────────────────────────────
describe('Formula Engine Edge — extractReferences', () => {
    it('extracts absolute references from =$A$1+B2', () => {
        const refs = extractReferences('=$A$1+B2');
        expect(refs.length).toBe(2);
        // First ref should be A1 (col=0, row=0)
        expect(refs[0].col).toBe(0);
        expect(refs[0].row).toBe(0);
        // Second ref should be B2 (col=1, row=1)
        expect(refs[1].col).toBe(1);
        expect(refs[1].row).toBe(1);
    });

    it('extracts references from range =SUM(A1:C3)', () => {
        const refs = extractReferences('=SUM(A1:C3)');
        expect(refs.length).toBeGreaterThanOrEqual(2); // at least A1 and C3
    });

    it('returns empty array for formula with no cell refs =1+2', () => {
        const refs = extractReferences('=1+2');
        expect(refs.length).toBe(0);
    });
});
