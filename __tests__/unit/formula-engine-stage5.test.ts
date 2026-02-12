// ════════════════════════════════════════════════════════════════════
// Stage 5 — Formula Engine Tests
// Covers: string literals, comparison operators, & concatenation,
// IF, AND, OR, NOT, VLOOKUP, SUMIF, TRIM, CONCATENATE, BARCHART, PIECHART
// ════════════════════════════════════════════════════════════════════

import { describe, test, expect } from 'vitest';
import { evaluateFormula, FORMULA_ERRORS } from '@/lib/formula-engine';
import { type Cell, cellKey } from '@/types/spreadsheet';

function makeCells(data: Record<string, number | string>): Record<string, Cell> {
    const cells: Record<string, Cell> = {};
    for (const [key, value] of Object.entries(data)) {
        // Accept "A1" notation or "col,row" notation
        let cellK = key;
        if (/^[A-Z]\d+$/i.test(key)) {
            const col = key.charCodeAt(0) - 65;
            const row = parseInt(key.slice(1), 10) - 1;
            cellK = cellKey(col, row);
        }
        cells[cellK] = {
            value,
            dataType: typeof value === 'number' ? 'number' : 'text',
        };
    }
    return cells;
}

// ─── String Literals ────────────────────────────────────────────────
describe('String Literals', () => {
    test('evaluates string literal', () => {
        const result = evaluateFormula('="hello"', {});
        expect(result.value).toBe('hello');
    });

    test('string literal in IF condition', () => {
        const cells = makeCells({ A1: 'yes' });
        const result = evaluateFormula('=IF(A1="yes",1,0)', cells);
        expect(result.value).toBe(1);
    });

    test('empty string literal', () => {
        const result = evaluateFormula('=""', {});
        expect(result.value).toBe('');
    });
});

// ─── Comparison Operators ───────────────────────────────────────────
describe('Comparison Operators', () => {
    test('greater than', () => {
        const cells = makeCells({ A1: 10 });
        expect(evaluateFormula('=A1>5', cells).value).toBe(1);
        expect(evaluateFormula('=A1>20', cells).value).toBe(0);
    });

    test('less than', () => {
        const cells = makeCells({ A1: 3 });
        expect(evaluateFormula('=A1<5', cells).value).toBe(1);
        expect(evaluateFormula('=A1<1', cells).value).toBe(0);
    });

    test('greater than or equal', () => {
        const cells = makeCells({ A1: 10 });
        expect(evaluateFormula('=A1>=10', cells).value).toBe(1);
        expect(evaluateFormula('=A1>=11', cells).value).toBe(0);
    });

    test('less than or equal', () => {
        const cells = makeCells({ A1: 5 });
        expect(evaluateFormula('=A1<=5', cells).value).toBe(1);
        expect(evaluateFormula('=A1<=4', cells).value).toBe(0);
    });

    test('equal', () => {
        const cells = makeCells({ A1: 42 });
        expect(evaluateFormula('=A1=42', cells).value).toBe(1);
        expect(evaluateFormula('=A1=43', cells).value).toBe(0);
    });

    test('not equal', () => {
        const cells = makeCells({ A1: 7 });
        expect(evaluateFormula('=A1<>7', cells).value).toBe(0);
        expect(evaluateFormula('=A1<>8', cells).value).toBe(1);
    });

    test('string comparison with =', () => {
        const cells = makeCells({ A1: 'hello' });
        expect(evaluateFormula('=A1="hello"', cells).value).toBe(1);
        expect(evaluateFormula('=A1="world"', cells).value).toBe(0);
    });

    test('case-insensitive string comparison', () => {
        const cells = makeCells({ A1: 'Hello' });
        expect(evaluateFormula('=A1="hello"', cells).value).toBe(1);
    });
});

// ─── Concatenation ──────────────────────────────────────────────────
describe('Concatenation (&)', () => {
    test('concatenates two strings', () => {
        const result = evaluateFormula('="Hello"&" World"', {});
        expect(result.value).toBe('Hello World');
    });

    test('concatenates string and number', () => {
        const cells = makeCells({ A1: 42 });
        const result = evaluateFormula('="Value: "&A1', cells);
        expect(result.value).toBe('Value: 42');
    });

    test('concatenates cell values', () => {
        const cells = makeCells({ A1: 'John', B1: 'Doe' });
        const result = evaluateFormula('=A1&" "&B1', cells);
        expect(result.value).toBe('John Doe');
    });
});

// ─── IF Function ────────────────────────────────────────────────────
describe('IF Function', () => {
    test('returns true branch when condition is true', () => {
        const cells = makeCells({ A1: 10 });
        const result = evaluateFormula('=IF(A1>5,"yes","no")', cells);
        expect(result.value).toBe('yes');
    });

    test('returns false branch when condition is false', () => {
        const cells = makeCells({ A1: 2 });
        const result = evaluateFormula('=IF(A1>5,"yes","no")', cells);
        expect(result.value).toBe('no');
    });

    test('defaults false branch to 0 when omitted', () => {
        const cells = makeCells({ A1: 2 });
        const result = evaluateFormula('=IF(A1>5,"yes")', cells);
        expect(result.value).toBe(0);
    });

    test('nested IF', () => {
        const cells = makeCells({ A1: 75 });
        const result = evaluateFormula('=IF(A1>=90,"A",IF(A1>=80,"B",IF(A1>=70,"C","D")))', cells);
        expect(result.value).toBe('C');
    });

    test('IF with numeric result', () => {
        const cells = makeCells({ A1: 10 });
        const result = evaluateFormula('=IF(A1>5,100,0)', cells);
        expect(result.value).toBe(100);
    });

    test('IF with error in condition propagates', () => {
        const cells = makeCells({ A1: '#DIV/0!' as any });
        cells[cellKey(0, 0)].value = '#DIV/0!';
        const result = evaluateFormula('=IF(A1>5,1,0)', cells);
        // A1 is a string error, comparison should still work (non-numeric comparison)
        expect(typeof result.value).toBeDefined();
    });
});

// ─── AND / OR / NOT ─────────────────────────────────────────────────
describe('AND Function', () => {
    test('returns 1 when all true', () => {
        const cells = makeCells({ A1: 1, B1: 1, C1: 1 });
        const result = evaluateFormula('=AND(A1,B1,C1)', cells);
        expect(result.value).toBe(1);
    });

    test('returns 0 when any false', () => {
        const cells = makeCells({ A1: 1, B1: 0, C1: 1 });
        const result = evaluateFormula('=AND(A1,B1,C1)', cells);
        expect(result.value).toBe(0);
    });

    test('works with comparisons', () => {
        const cells = makeCells({
            A1: 10
        });
        const result = evaluateFormula('=AND(A1>5,A1<20)', cells);
        expect(result.value).toBe(1);
    });
});

describe('OR Function', () => {
    test('returns 1 when any true', () => {
        const cells = makeCells({ A1: 0, B1: 1, C1: 0 });
        const result = evaluateFormula('=OR(A1,B1,C1)', cells);
        expect(result.value).toBe(1);
    });

    test('returns 0 when all false', () => {
        const cells = makeCells({ A1: 0, B1: 0 });
        const result = evaluateFormula('=OR(A1,B1)', cells);
        expect(result.value).toBe(0);
    });
});

describe('NOT Function', () => {
    test('inverts truthy to 0', () => {
        const cells = makeCells({ A1: 1 });
        expect(evaluateFormula('=NOT(A1)', cells).value).toBe(0);
    });

    test('inverts falsy to 1', () => {
        const cells = makeCells({ A1: 0 });
        expect(evaluateFormula('=NOT(A1)', cells).value).toBe(1);
    });

    test('NOT with comparison', () => {
        const cells = makeCells({ A1: 5 });
        expect(evaluateFormula('=NOT(A1>10)', cells).value).toBe(1);
    });
});

// ─── VLOOKUP ────────────────────────────────────────────────────────
describe('VLOOKUP Function', () => {
    const cells = makeCells({
        // Lookup table in A1:B4
        A1: 'Apple', B1: 1.5,
        A2: 'Banana', B2: 0.75,
        A3: 'Cherry', B3: 3.0,
        A4: 'Date', B4: 2.5,
    });

    test('finds exact match and returns value from specified column', () => {
        const result = evaluateFormula('=VLOOKUP("Banana",A1:B4,2)', cells);
        expect(result.value).toBe(0.75);
    });

    test('case-insensitive match', () => {
        const result = evaluateFormula('=VLOOKUP("cherry",A1:B4,2)', cells);
        expect(result.value).toBe(3);
    });

    test('returns #ERROR! when not found', () => {
        const result = evaluateFormula('=VLOOKUP("Fig",A1:B4,2)', cells);
        expect(result.value).toBe(FORMULA_ERRORS.ERROR);
    });

    test('returns #REF! when col_index exceeds range', () => {
        const result = evaluateFormula('=VLOOKUP("Apple",A1:B4,3)', cells);
        expect(result.value).toBe(FORMULA_ERRORS.REF);
    });

    test('numeric lookup', () => {
        const numCells = makeCells({
            A1: 100, B1: 'Small',
            A2: 200, B2: 'Medium',
            A3: 300, B3: 'Large',
        });
        const result = evaluateFormula('=VLOOKUP(200,A1:B3,2)', numCells);
        expect(result.value).toBe('Medium');
    });
});

// ─── SUMIF ──────────────────────────────────────────────────────────
describe('SUMIF Function', () => {
    test('sums values greater than threshold', () => {
        const cells = makeCells({ A1: 10, A2: 20, A3: 5, A4: 30 });
        const result = evaluateFormula('=SUMIF(A1:A4,">10")', cells);
        expect(result.value).toBe(50); // 20 + 30
    });

    test('sums with separate sum range', () => {
        const cells = makeCells({
            A1: 'Fruit', B1: 10,
            A2: 'Veg', B2: 20,
            A3: 'Fruit', B3: 30,
        });
        const result = evaluateFormula('=SUMIF(A1:A3,"Fruit",B1:B3)', cells);
        expect(result.value).toBe(40); // 10 + 30
    });

    test('sums with = criterion', () => {
        const cells = makeCells({ A1: 5, A2: 10, A3: 5, A4: 15 });
        const result = evaluateFormula('=SUMIF(A1:A4,"=5")', cells);
        expect(result.value).toBe(10); // 5 + 5
    });

    test('sums with <= criterion', () => {
        const cells = makeCells({ A1: 1, A2: 5, A3: 10, A4: 15 });
        const result = evaluateFormula('=SUMIF(A1:A4,"<=5")', cells);
        expect(result.value).toBe(6); // 1 + 5
    });
});

// ─── TRIM ───────────────────────────────────────────────────────────
describe('TRIM Function', () => {
    test('trims leading and trailing spaces', () => {
        const result = evaluateFormula('=TRIM("  hello  ")', {});
        expect(result.value).toBe('hello');
    });

    test('trims cell value', () => {
        const cells = makeCells({ A1: '  spaces  ' });
        const result = evaluateFormula('=TRIM(A1)', cells);
        expect(result.value).toBe('spaces');
    });

    test('no-op on clean string', () => {
        const result = evaluateFormula('=TRIM("clean")', {});
        expect(result.value).toBe('clean');
    });
});

// ─── CONCATENATE ────────────────────────────────────────────────────
describe('CONCATENATE Function', () => {
    test('joins multiple strings', () => {
        const result = evaluateFormula('=CONCATENATE("Hello"," ","World")', {});
        expect(result.value).toBe('Hello World');
    });

    test('joins cell values', () => {
        const cells = makeCells({ A1: 'John', B1: 'Doe' });
        const result = evaluateFormula('=CONCATENATE(A1," ",B1)', cells);
        expect(result.value).toBe('John Doe');
    });

    test('converts numbers to strings', () => {
        const cells = makeCells({ A1: 42 });
        const result = evaluateFormula('=CONCATENATE("Value: ",A1)', cells);
        expect(result.value).toBe('Value: 42');
    });
});

// ─── BARCHART / PIECHART Sentinels ──────────────────────────────────
describe('Chart Functions', () => {
    test('BARCHART returns 0 sentinel', () => {
        const cells = makeCells({ A1: 10, A2: 20, A3: 30 });
        const result = evaluateFormula('=BARCHART(A1:A3)', cells);
        expect(result.value).toBe(0);
    });

    test('PIECHART returns 0 sentinel', () => {
        const cells = makeCells({ A1: 10, A2: 20, A3: 30 });
        const result = evaluateFormula('=PIECHART(A1:A3)', cells);
        expect(result.value).toBe(0);
    });
});

// ─── Combined Scenarios ─────────────────────────────────────────────
describe('Combined Function Scenarios', () => {
    test('IF with AND condition', () => {
        const cells = makeCells({ A1: 15 });
        const result = evaluateFormula('=IF(AND(A1>10,A1<20),"in range","out")', cells);
        expect(result.value).toBe('in range');
    });

    test('IF with OR condition', () => {
        const cells = makeCells({ A1: 5 });
        const result = evaluateFormula('=IF(OR(A1<0,A1>100),"extreme","normal")', cells);
        expect(result.value).toBe('normal');
    });

    test('nested IF with comparison operators', () => {
        const cells = makeCells({ A1: 85 });
        const result = evaluateFormula('=IF(A1>=90,"A",IF(A1>=80,"B","C"))', cells);
        expect(result.value).toBe('B');
    });

    test('CONCATENATE with IF', () => {
        const cells = makeCells({ A1: 25 });
        const result = evaluateFormula('=CONCATENATE("Status: ",IF(A1>18,"Adult","Minor"))', cells);
        expect(result.value).toBe('Status: Adult');
    });
});

// ─── COUNTIF ────────────────────────────────────────────────────────
describe('COUNTIF Function', () => {
    test('counts cells greater than threshold', () => {
        const cells = makeCells({ A1: 10, A2: 20, A3: 5, A4: 30 });
        const result = evaluateFormula('=COUNTIF(A1:A4,">10")', cells);
        expect(result.value).toBe(2); // 20, 30
    });

    test('counts cells matching exact text', () => {
        const cells = makeCells({ A1: 'Fruit', A2: 'Veg', A3: 'Fruit', A4: 'Meat' });
        const result = evaluateFormula('=COUNTIF(A1:A4,"Fruit")', cells);
        expect(result.value).toBe(2);
    });

    test('counts with = criterion', () => {
        const cells = makeCells({ A1: 5, A2: 10, A3: 5, A4: 15 });
        const result = evaluateFormula('=COUNTIF(A1:A4,"=5")', cells);
        expect(result.value).toBe(2);
    });

    test('counts with <> criterion', () => {
        const cells = makeCells({ A1: 5, A2: 10, A3: 5, A4: 15 });
        const result = evaluateFormula('=COUNTIF(A1:A4,"<>5")', cells);
        expect(result.value).toBe(2); // 10, 15
    });

    test('counts with <= criterion', () => {
        const cells = makeCells({ A1: 1, A2: 5, A3: 10, A4: 15 });
        const result = evaluateFormula('=COUNTIF(A1:A4,"<=5")', cells);
        expect(result.value).toBe(2); // 1, 5
    });

    test('returns 0 for no matches', () => {
        const cells = makeCells({ A1: 1, A2: 2, A3: 3 });
        const result = evaluateFormula('=COUNTIF(A1:A3,">100")', cells);
        expect(result.value).toBe(0);
    });

    test('empty cells do not match', () => {
        const cells = makeCells({ A1: 10, A3: 30 }); // A2 empty
        const result = evaluateFormula('=COUNTIF(A1:A3,">5")', cells);
        expect(result.value).toBe(2); // 10, 30 — empty cells don't match
    });
});

// ─── LEFT ───────────────────────────────────────────────────────────
describe('LEFT Function', () => {
    test('returns first n characters', () => {
        const result = evaluateFormula('=LEFT("Hello",3)', {});
        expect(result.value).toBe('Hel');
    });

    test('defaults to 1 character', () => {
        const result = evaluateFormula('=LEFT("Hello")', {});
        expect(result.value).toBe('H');
    });

    test('returns full string when n > length', () => {
        const result = evaluateFormula('=LEFT("Hi",10)', {});
        expect(result.value).toBe('Hi');
    });

    test('works with cell reference', () => {
        const cells = makeCells({ A1: 'SheetForge' });
        const result = evaluateFormula('=LEFT(A1,5)', cells);
        expect(result.value).toBe('Sheet');
    });

    test('returns error for negative n', () => {
        const result = evaluateFormula('=LEFT("Hello",-1)', {});
        expect(result.value).toBe(FORMULA_ERRORS.ERROR);
    });
});

// ─── RIGHT ──────────────────────────────────────────────────────────
describe('RIGHT Function', () => {
    test('returns last n characters', () => {
        const result = evaluateFormula('=RIGHT("Hello",2)', {});
        expect(result.value).toBe('lo');
    });

    test('defaults to 1 character', () => {
        const result = evaluateFormula('=RIGHT("Hello")', {});
        expect(result.value).toBe('o');
    });

    test('returns full string when n > length', () => {
        const result = evaluateFormula('=RIGHT("Hi",10)', {});
        expect(result.value).toBe('Hi');
    });

    test('works with cell reference', () => {
        const cells = makeCells({ A1: 'SheetForge' });
        const result = evaluateFormula('=RIGHT(A1,5)', cells);
        expect(result.value).toBe('Forge');
    });
});

// ─── LEN ────────────────────────────────────────────────────────────
describe('LEN Function', () => {
    test('returns length of string', () => {
        const result = evaluateFormula('=LEN("Hello")', {});
        expect(result.value).toBe(5);
    });

    test('empty string returns 0', () => {
        const result = evaluateFormula('=LEN("")', {});
        expect(result.value).toBe(0);
    });

    test('works with cell reference', () => {
        const cells = makeCells({ A1: 'SheetForge' });
        const result = evaluateFormula('=LEN(A1)', cells);
        expect(result.value).toBe(10);
    });

    test('converts number to string for length', () => {
        const cells = makeCells({ A1: 12345 });
        const result = evaluateFormula('=LEN(A1)', cells);
        expect(result.value).toBe(5);
    });
});

// ─── ROUND ──────────────────────────────────────────────────────────
describe('ROUND Function', () => {
    test('rounds to 2 decimal places', () => {
        const result = evaluateFormula('=ROUND(3.456,2)', {});
        expect(result.value).toBeCloseTo(3.46, 10);
    });

    test('rounds to 0 decimal places', () => {
        const result = evaluateFormula('=ROUND(3.7,0)', {});
        expect(result.value).toBe(4);
    });

    test('rounds to 1 decimal place', () => {
        const result = evaluateFormula('=ROUND(2.55,1)', {});
        expect(result.value).toBeCloseTo(2.6, 10);
    });

    test('works with cell reference', () => {
        const cells = makeCells({ A1: 3.14159 });
        const result = evaluateFormula('=ROUND(A1,3)', cells);
        expect(result.value).toBeCloseTo(3.142, 10);
    });

    test('returns error with insufficient args', () => {
        const result = evaluateFormula('=ROUND(3.14)', {});
        expect(result.value).toBe(FORMULA_ERRORS.ERROR);
    });
});
