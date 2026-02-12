// ════════════════════════════════════════════════════════════════════
// SheetForge — Formula Engine (PRD §FR-101, NFR-S01)
// Pure-function formula parser + evaluator
// ════════════════════════════════════════════════════════════════════

import { type Cell, type Sheet, cellKey } from '@/types/spreadsheet';

// ─── Error Constants ────────────────────────────────────────────────
export const FORMULA_ERRORS = {
    ERROR: '#ERROR!',
    DIV_ZERO: '#DIV/0!',
    NAME: '#NAME?',
    REF: '#REF!',
    CIRCULAR: '#CIRCULAR!',
} as const;

export type FormulaError = typeof FORMULA_ERRORS[keyof typeof FORMULA_ERRORS];

export function isFormulaError(value: unknown): value is FormulaError {
    return typeof value === 'string' && Object.values(FORMULA_ERRORS).includes(value as FormulaError);
}

// ─── Cell Reference Parsing ─────────────────────────────────────────
export interface CellRef {
    col: number;
    row: number;
    absCol?: boolean; // $A
    absRow?: boolean; // $1
}

export interface RangeRef {
    start: CellRef;
    end: CellRef;
}

/** Parse a column letter (A-Z) to 0-indexed number. Case-insensitive. */
function colLetterToIndex(letter: string): number {
    return letter.toUpperCase().charCodeAt(0) - 65;
}

/** Parse a cell reference like "A1", "$A$1", "a1" */
export function parseCellRef(ref: string): CellRef | null {
    const match = ref.match(/^(\$?)([A-Za-z])(\$?)(\d+)$/);
    if (!match) return null;
    const absCol = match[1] === '$';
    const col = colLetterToIndex(match[2]);
    const absRow = match[3] === '$';
    const row = parseInt(match[4], 10) - 1; // Convert to 0-indexed
    if (col < 0 || col > 25 || row < 0 || row > 99) return null;
    return { col, row, absCol, absRow };
}

/** Shift a cell reference by offset (for copy/paste relative adjustment) */
export function shiftCellRef(ref: CellRef, colOffset: number, rowOffset: number): CellRef {
    return {
        col: ref.absCol ? ref.col : ref.col + colOffset,
        row: ref.absRow ? ref.row : ref.row + rowOffset,
        absCol: ref.absCol,
        absRow: ref.absRow,
    };
}

/** Convert a CellRef back to string like "A1" or "$A$1" */
export function cellRefToString(ref: CellRef): string {
    const colStr = (ref.absCol ? '$' : '') + String.fromCharCode(65 + ref.col);
    const rowStr = (ref.absRow ? '$' : '') + String(ref.row + 1);
    return colStr + rowStr;
}

// ─── Tokenizer ──────────────────────────────────────────────────────
type TokenType =
    | 'NUMBER'
    | 'STRING'
    | 'CELL_REF'
    | 'SHEET_REF'  // SheetName!CellRef (FR-203)
    | 'SHEET_RANGE' // SheetName!A1:B2 (FR-203)
    | 'RANGE'
    | 'FUNCTION'
    | 'LPAREN'
    | 'RPAREN'
    | 'COMMA'
    | 'PLUS'
    | 'MINUS'
    | 'MULTIPLY'
    | 'DIVIDE'
    | 'COLON'
    | 'GREATER'
    | 'LESS'
    | 'GREATER_EQ'
    | 'LESS_EQ'
    | 'EQUAL'
    | 'NOT_EQUAL'
    | 'AMPERSAND'
    | 'EOF';

interface Token {
    type: TokenType;
    value: string;
    numValue?: number;
}

function tokenize(formula: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    const s = formula;

    while (i < s.length) {
        // Skip whitespace
        if (s[i] === ' ' || s[i] === '\t') { i++; continue; }

        // String literal (double-quoted)
        if (s[i] === '"') {
            i++; // skip opening quote
            let str = '';
            while (i < s.length && s[i] !== '"') {
                if (s[i] === '\\' && i + 1 < s.length && s[i + 1] === '"') {
                    str += '"'; i += 2;
                } else {
                    str += s[i]; i++;
                }
            }
            if (i < s.length) i++; // skip closing quote
            tokens.push({ type: 'STRING', value: str });
            continue;
        }

        // Number (integer or decimal)
        if (/[0-9]/.test(s[i]) || (s[i] === '.' && i + 1 < s.length && /[0-9]/.test(s[i + 1]))) {
            let num = '';
            while (i < s.length && (/[0-9]/.test(s[i]) || s[i] === '.')) {
                num += s[i]; i++;
            }
            tokens.push({ type: 'NUMBER', value: num, numValue: parseFloat(num) });
            continue;
        }

        // Cell ref or function name (starts with letter or $)
        if (/[A-Za-z$]/.test(s[i])) {
            let word = '';
            const start = i;
            // Collect $, letters, digits
            while (i < s.length && /[A-Za-z0-9$]/.test(s[i])) {
                word += s[i]; i++;
            }

            // Check if it's a cell reference (possibly with $)
            const cellRef = parseCellRef(word);
            if (cellRef) {
                // Check for range (A1:B5)
                if (i < s.length && s[i] === ':') {
                    i++; // skip ':'
                    let word2 = '';
                    while (i < s.length && /[A-Za-z0-9$]/.test(s[i])) {
                        word2 += s[i]; i++;
                    }
                    const cellRef2 = parseCellRef(word2);
                    if (cellRef2) {
                        tokens.push({ type: 'RANGE', value: word + ':' + word2 });
                        continue;
                    } else {
                        // Malformed range
                        throw new Error('Invalid range reference');
                    }
                }
                tokens.push({ type: 'CELL_REF', value: word });
                continue;
            }

            // Check for cross-sheet reference: SheetName!CellRef or SheetName!A1:B2 (FR-203)
            if (i < s.length && s[i] === '!') {
                const sheetName = word;
                i++; // skip '!'
                let refPart = '';
                while (i < s.length && /[A-Za-z0-9$]/.test(s[i])) {
                    refPart += s[i]; i++;
                }
                const sheetCellRef = parseCellRef(refPart);
                if (sheetCellRef) {
                    // Check for range (Sheet2!A1:B5)
                    if (i < s.length && s[i] === ':') {
                        i++; // skip ':'
                        let refPart2 = '';
                        while (i < s.length && /[A-Za-z0-9$]/.test(s[i])) {
                            refPart2 += s[i]; i++;
                        }
                        const sheetCellRef2 = parseCellRef(refPart2);
                        if (sheetCellRef2) {
                            tokens.push({ type: 'SHEET_RANGE', value: sheetName + '!' + refPart + ':' + refPart2 });
                            continue;
                        } else {
                            throw new Error('Invalid cross-sheet range reference');
                        }
                    }
                    tokens.push({ type: 'SHEET_REF', value: sheetName + '!' + refPart });
                    continue;
                } else {
                    throw new Error('Invalid cross-sheet cell reference');
                }
            }

            // Otherwise it's a function name
            tokens.push({ type: 'FUNCTION', value: word.toUpperCase() });
            continue;
        }

        // Comparison operators (multi-char first)
        if (s[i] === '>' && i + 1 < s.length && s[i + 1] === '=') {
            tokens.push({ type: 'GREATER_EQ', value: '>=' }); i += 2; continue;
        }
        if (s[i] === '<' && i + 1 < s.length && s[i + 1] === '=') {
            tokens.push({ type: 'LESS_EQ', value: '<=' }); i += 2; continue;
        }
        if (s[i] === '<' && i + 1 < s.length && s[i + 1] === '>') {
            tokens.push({ type: 'NOT_EQUAL', value: '<>' }); i += 2; continue;
        }

        // Single-character tokens
        switch (s[i]) {
            case '(': tokens.push({ type: 'LPAREN', value: '(' }); i++; continue;
            case ')': tokens.push({ type: 'RPAREN', value: ')' }); i++; continue;
            case ',': tokens.push({ type: 'COMMA', value: ',' }); i++; continue;
            case '+': tokens.push({ type: 'PLUS', value: '+' }); i++; continue;
            case '-': tokens.push({ type: 'MINUS', value: '-' }); i++; continue;
            case '*': tokens.push({ type: 'MULTIPLY', value: '*' }); i++; continue;
            case '/': tokens.push({ type: 'DIVIDE', value: '/' }); i++; continue;
            case ':': tokens.push({ type: 'COLON', value: ':' }); i++; continue;
            case '>': tokens.push({ type: 'GREATER', value: '>' }); i++; continue;
            case '<': tokens.push({ type: 'LESS', value: '<' }); i++; continue;
            case '=': tokens.push({ type: 'EQUAL', value: '=' }); i++; continue;
            case '&': tokens.push({ type: 'AMPERSAND', value: '&' }); i++; continue;
            default: throw new Error(`Unexpected character: ${s[i]}`);
        }
    }

    tokens.push({ type: 'EOF', value: '' });
    return tokens;
}

// ─── AST Nodes ──────────────────────────────────────────────────────
type ASTNode =
    | { type: 'number'; value: number }
    | { type: 'string'; value: string }
    | { type: 'cellRef'; ref: CellRef }
    | { type: 'sheetCellRef'; sheetName: string; ref: CellRef }
    | { type: 'rangeRef'; start: CellRef; end: CellRef }
    | { type: 'sheetRangeRef'; sheetName: string; start: CellRef; end: CellRef }
    | { type: 'functionCall'; name: string; args: ASTNode[] }
    | { type: 'binaryOp'; op: string; left: ASTNode; right: ASTNode }
    | { type: 'unaryMinus'; operand: ASTNode };

// ─── Parser (Recursive Descent) ─────────────────────────────────────
class Parser {
    private tokens: Token[];
    private pos: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    private peek(): Token {
        return this.tokens[this.pos];
    }

    private consume(type?: TokenType): Token {
        const token = this.tokens[this.pos];
        if (type && token.type !== type) {
            throw new Error(`Expected ${type}, got ${token.type}`);
        }
        this.pos++;
        return token;
    }

    parse(): ASTNode {
        const result = this.parseComparison();
        if (this.peek().type !== 'EOF') {
            throw new Error('Unexpected tokens after expression');
        }
        return result;
    }

    // comparison = concat (('>' | '<' | '>=' | '<=' | '=' | '<>') concat)?
    private parseComparison(): ASTNode {
        let left = this.parseConcat();
        const t = this.peek().type;
        if (t === 'GREATER' || t === 'LESS' || t === 'GREATER_EQ' ||
            t === 'LESS_EQ' || t === 'EQUAL' || t === 'NOT_EQUAL') {
            const op = this.consume();
            const right = this.parseConcat();
            left = { type: 'binaryOp', op: op.value, left, right };
        }
        return left;
    }

    // concat = expression ('&' expression)*
    private parseConcat(): ASTNode {
        let left = this.parseExpression();
        while (this.peek().type === 'AMPERSAND') {
            const op = this.consume();
            const right = this.parseExpression();
            left = { type: 'binaryOp', op: op.value, left, right };
        }
        return left;
    }

    // expression = term (('+' | '-') term)*
    private parseExpression(): ASTNode {
        let left = this.parseTerm();
        while (this.peek().type === 'PLUS' || this.peek().type === 'MINUS') {
            const op = this.consume();
            const right = this.parseTerm();
            left = { type: 'binaryOp', op: op.value, left, right };
        }
        return left;
    }

    // term = factor (('*' | '/') factor)*
    private parseTerm(): ASTNode {
        let left = this.parseFactor();
        while (this.peek().type === 'MULTIPLY' || this.peek().type === 'DIVIDE') {
            const op = this.consume();
            const right = this.parseFactor();
            left = { type: 'binaryOp', op: op.value, left, right };
        }
        return left;
    }

    // factor = NUMBER | CELL_REF | RANGE | FUNCTION '(' args ')' | '(' expression ')' | '-' factor
    private parseFactor(): ASTNode {
        const token = this.peek();

        // Unary minus
        if (token.type === 'MINUS') {
            this.consume();
            const operand = this.parseFactor();
            return { type: 'unaryMinus', operand };
        }

        // Number literal
        if (token.type === 'NUMBER') {
            this.consume();
            return { type: 'number', value: token.numValue! };
        }

        // String literal
        if (token.type === 'STRING') {
            this.consume();
            return { type: 'string', value: token.value };
        }

        // Range reference (already tokenized as RANGE)
        if (token.type === 'RANGE') {
            this.consume();
            const parts = token.value.split(':');
            const start = parseCellRef(parts[0])!;
            const end = parseCellRef(parts[1])!;
            return { type: 'rangeRef', start, end };
        }

        // Cell reference
        if (token.type === 'CELL_REF') {
            this.consume();
            const ref = parseCellRef(token.value)!;
            return { type: 'cellRef', ref };
        }

        // Cross-sheet cell reference (FR-203)
        if (token.type === 'SHEET_REF') {
            this.consume();
            const [sheetName, refStr] = token.value.split('!');
            const ref = parseCellRef(refStr)!;
            return { type: 'sheetCellRef', sheetName, ref };
        }

        // Cross-sheet range reference (FR-203)
        if (token.type === 'SHEET_RANGE') {
            this.consume();
            const [sheetName, rangeStr] = token.value.split('!');
            const parts = rangeStr.split(':');
            const start = parseCellRef(parts[0])!;
            const end = parseCellRef(parts[1])!;
            return { type: 'sheetRangeRef', sheetName, start, end };
        }

        // Function call
        if (token.type === 'FUNCTION') {
            const funcName = this.consume().value;
            this.consume('LPAREN');
            const args: ASTNode[] = [];
            if (this.peek().type !== 'RPAREN') {
                args.push(this.parseComparison());
                while (this.peek().type === 'COMMA') {
                    this.consume();
                    args.push(this.parseComparison());
                }
            }
            this.consume('RPAREN');
            return { type: 'functionCall', name: funcName, args };
        }

        // Parenthesized expression
        if (token.type === 'LPAREN') {
            this.consume();
            const expr = this.parseComparison();
            this.consume('RPAREN');
            return expr;
        }

        throw new Error(`Unexpected token: ${token.type}`);
    }
}

// ─── Whitelisted Functions (NFR-S01) ────────────────────────────────
const ALLOWED_FUNCTIONS = new Set([
    'SUM', 'AVERAGE', 'MIN', 'MAX', 'COUNT', 'SPARKLINE',
    // Stage 5 functions
    'IF', 'AND', 'OR', 'NOT', 'VLOOKUP', 'COUNTIF', 'SUMIF', 'TRIM', 'CONCATENATE',
    // Stage 5 text/math functions
    'LEFT', 'RIGHT', 'LEN', 'ROUND',
    // Stage 6 chart functions
    'BARCHART', 'PIECHART',
]);

// ─── Evaluator ──────────────────────────────────────────────────────
type CellLookup = (col: number, row: number) => number | string | null;
/** Lookup cells from another sheet by name (FR-203) */
type SheetLookup = (sheetName: string, col: number, row: number) => number | string | null;

/** Expand a range into an array of numeric values (ignoring text/empty/errors) */
function expandRange(start: CellRef, end: CellRef, lookup: CellLookup): number[] {
    const values: number[] = [];
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);

    for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
            const val = lookup(c, r);
            if (typeof val === 'number') {
                values.push(val);
            }
            // CC-101: Ignore text cells, skip errors
        }
    }
    return values;
}

/** Evaluate a single argument, which could be a range or a single value */
function evalArg(node: ASTNode, lookup: CellLookup, sheetLookup?: SheetLookup): number[] {
    if (node.type === 'rangeRef') {
        return expandRange(node.start, node.end, lookup);
    }
    if (node.type === 'sheetRangeRef' && sheetLookup) {
        const sLookup: CellLookup = (col, row) => sheetLookup(node.sheetName, col, row);
        return expandRange(node.start, node.end, sLookup);
    }
    const val = evaluate(node, lookup, sheetLookup);
    if (typeof val === 'number') return [val];
    if (typeof val === 'string' && !isFormulaError(val)) {
        const num = parseFloat(val);
        if (!isNaN(num)) return [num];
    }
    return [];
}

/** Count all cells in range (including empty/text for COUNT) */
function countRange(node: ASTNode, lookup: CellLookup, sheetLookup?: SheetLookup): number {
    if (node.type === 'rangeRef' || node.type === 'sheetRangeRef') {
        const { start, end } = node;
        const effectiveLookup: CellLookup = node.type === 'sheetRangeRef' && sheetLookup
            ? (col, row) => sheetLookup(node.sheetName, col, row)
            : lookup;
        const minCol = Math.min(start.col, end.col);
        const maxCol = Math.max(start.col, end.col);
        const minRow = Math.min(start.row, end.row);
        const maxRow = Math.max(start.row, end.row);
        let count = 0;
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                const val = effectiveLookup(c, r);
                if (val !== null && val !== undefined && val !== '') {
                    count++;
                }
            }
        }
        return count;
    }
    // Single value
    const val = evaluate(node, lookup, sheetLookup);
    return (val !== null && val !== undefined && val !== '') ? 1 : 0;
}

/** Get raw cell value (not coerced to number) for string-aware functions */
function getRawCellValue(node: ASTNode, lookup: CellLookup, sheetLookup?: SheetLookup): number | string {
    if (node.type === 'cellRef') {
        const val = lookup(node.ref.col, node.ref.row);
        if (val === null || val === undefined) return '';
        if (typeof val === 'string' && isFormulaError(val)) return val;
        return val;
    }
    if (node.type === 'sheetCellRef') {
        if (!sheetLookup) return FORMULA_ERRORS.REF;
        const val = sheetLookup(node.sheetName, node.ref.col, node.ref.row);
        if (val === null || val === undefined) return '';
        if (typeof val === 'string' && isFormulaError(val)) return val;
        return val;
    }
    return evaluate(node, lookup, sheetLookup);
}

/** Parse SUMIF criterion string like ">5", "<10", "=text", "<>0" */
function parseCriterion(criterion: string): (val: number | string | null) => boolean {
    if (!criterion) return () => false;
    // Comparison operators
    const compMatch = criterion.match(/^(>=|<=|<>|>|<|=)(.*)$/);
    if (compMatch) {
        const op = compMatch[1];
        const target = compMatch[2];
        const targetNum = parseFloat(target);
        return (val) => {
            if (val === null || val === undefined) return false;
            const numVal = typeof val === 'number' ? val : parseFloat(String(val));
            const useNum = !isNaN(numVal) && !isNaN(targetNum);
            switch (op) {
                case '>': return useNum && numVal > targetNum;
                case '<': return useNum && numVal < targetNum;
                case '>=': return useNum && numVal >= targetNum;
                case '<=': return useNum && numVal <= targetNum;
                case '<>': return useNum ? numVal !== targetNum : String(val) !== target;
                case '=': return useNum ? numVal === targetNum : String(val).toLowerCase() === target.toLowerCase();
                default: return false;
            }
        };
    }
    // Plain text match
    return (val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase() === criterion.toLowerCase();
    };
}

function evaluate(node: ASTNode, lookup: CellLookup, sheetLookup?: SheetLookup): number | string {
    switch (node.type) {
        case 'number':
            return node.value;

        case 'string':
            return node.value;

        case 'cellRef': {
            const val = lookup(node.ref.col, node.ref.row);
            if (val === null || val === undefined) return 0; // Empty cells = 0 in formulas
            if (typeof val === 'string' && isFormulaError(val)) return val;
            if (typeof val === 'number') return val;
            const num = parseFloat(val);
            return isNaN(num) ? val : num; // Return string if not parseable as number
        }

        case 'sheetCellRef': {
            if (!sheetLookup) return FORMULA_ERRORS.REF;
            const val = sheetLookup(node.sheetName, node.ref.col, node.ref.row);
            if (val === null || val === undefined) return 0;
            if (typeof val === 'string' && isFormulaError(val)) return val;
            if (typeof val === 'number') return val;
            const num = parseFloat(val);
            return isNaN(num) ? val : num;
        }

        case 'rangeRef':
        case 'sheetRangeRef':
            // Range used outside a function context — treat as error
            return FORMULA_ERRORS.ERROR;

        case 'unaryMinus': {
            const operand = evaluate(node.operand, lookup, sheetLookup);
            if (typeof operand === 'string') return operand; // propagate errors
            return -operand;
        }

        case 'binaryOp': {
            const left = evaluate(node.left, lookup, sheetLookup);
            const right = evaluate(node.right, lookup, sheetLookup);

            // Propagate errors
            if (typeof left === 'string' && isFormulaError(left)) return left;
            if (typeof right === 'string' && isFormulaError(right)) return right;

            // String concatenation with &
            if (node.op === '&') {
                return String(left) + String(right);
            }

            // Comparison operators — return 1 (true) or 0 (false)
            if (['>', '<', '>=', '<=', '=', '<>'].includes(node.op)) {
                const bothNumeric = typeof left === 'number' && typeof right === 'number';
                switch (node.op) {
                    case '>': return bothNumeric && left > right ? 1 : 0;
                    case '<': return bothNumeric && left < right ? 1 : 0;
                    case '>=': return bothNumeric && left >= right ? 1 : 0;
                    case '<=': return bothNumeric && left <= right ? 1 : 0;
                    case '=':
                        if (bothNumeric) return left === right ? 1 : 0;
                        return String(left).toLowerCase() === String(right).toLowerCase() ? 1 : 0;
                    case '<>':
                        if (bothNumeric) return left !== right ? 1 : 0;
                        return String(left).toLowerCase() !== String(right).toLowerCase() ? 1 : 0;
                    default: return 0;
                }
            }

            // Arithmetic — coerce strings to numbers
            const numLeft = typeof left === 'number' ? left : parseFloat(String(left));
            const numRight = typeof right === 'number' ? right : parseFloat(String(right));
            if (isNaN(numLeft) || isNaN(numRight)) return FORMULA_ERRORS.ERROR;

            switch (node.op) {
                case '+': return numLeft + numRight;
                case '-': return numLeft - numRight;
                case '*': return numLeft * numRight;
                case '/':
                    if (numRight === 0) return FORMULA_ERRORS.DIV_ZERO; // CC-104
                    return numLeft / numRight;
                default: return FORMULA_ERRORS.ERROR;
            }
        }

        case 'functionCall': {
            const name = node.name;

            // NFR-S01: function whitelist
            if (!ALLOWED_FUNCTIONS.has(name)) {
                return FORMULA_ERRORS.NAME; // #NAME? for unknown functions
            }

            switch (name) {
                case 'SUM': {
                    const values: number[] = [];
                    for (const arg of node.args) {
                        values.push(...evalArg(arg, lookup, sheetLookup));
                    }
                    return values.reduce((a, b) => a + b, 0); // CC-102: empty = 0
                }
                case 'AVERAGE': {
                    const values: number[] = [];
                    for (const arg of node.args) {
                        values.push(...evalArg(arg, lookup, sheetLookup));
                    }
                    if (values.length === 0) return FORMULA_ERRORS.DIV_ZERO;
                    return values.reduce((a, b) => a + b, 0) / values.length;
                }
                case 'MIN': {
                    const values: number[] = [];
                    for (const arg of node.args) {
                        values.push(...evalArg(arg, lookup, sheetLookup));
                    }
                    if (values.length === 0) return 0;
                    return Math.min(...values);
                }
                case 'MAX': {
                    const values: number[] = [];
                    for (const arg of node.args) {
                        values.push(...evalArg(arg, lookup, sheetLookup));
                    }
                    if (values.length === 0) return 0;
                    return Math.max(...values);
                }
                case 'COUNT': {
                    let total = 0;
                    for (const arg of node.args) {
                        total += countRange(arg, lookup, sheetLookup);
                    }
                    return total;
                }
                case 'SPARKLINE':
                case 'BARCHART':
                case 'PIECHART': {
                    // Charts are rendered visually by Grid.tsx; the formula engine
                    // returns 0 as a sentinel so it doesn't produce #NAME? (FR-209, FR-603)
                    return 0;
                }

                // ─── Stage 5 Logical Functions ───────────────────────────
                case 'IF': {
                    // IF(condition, value_if_true, value_if_false)
                    if (node.args.length < 2) return FORMULA_ERRORS.ERROR;
                    const condition = evaluate(node.args[0], lookup, sheetLookup);
                    if (typeof condition === 'string' && isFormulaError(condition)) return condition;
                    const isTruthy = typeof condition === 'number' ? condition !== 0 : condition !== '';
                    if (isTruthy) {
                        return evaluate(node.args[1], lookup, sheetLookup);
                    }
                    return node.args.length >= 3
                        ? evaluate(node.args[2], lookup, sheetLookup)
                        : 0; // Default false branch = 0
                }
                case 'AND': {
                    // AND(val1, val2, ...) — returns 1 if all are truthy
                    if (node.args.length === 0) return FORMULA_ERRORS.ERROR;
                    for (const arg of node.args) {
                        const val = evaluate(arg, lookup, sheetLookup);
                        if (typeof val === 'string' && isFormulaError(val)) return val;
                        const truthy = typeof val === 'number' ? val !== 0 : val !== '';
                        if (!truthy) return 0;
                    }
                    return 1;
                }
                case 'OR': {
                    // OR(val1, val2, ...) — returns 1 if any is truthy
                    if (node.args.length === 0) return FORMULA_ERRORS.ERROR;
                    for (const arg of node.args) {
                        const val = evaluate(arg, lookup, sheetLookup);
                        if (typeof val === 'string' && isFormulaError(val)) return val;
                        const truthy = typeof val === 'number' ? val !== 0 : val !== '';
                        if (truthy) return 1;
                    }
                    return 0;
                }
                case 'NOT': {
                    // NOT(val) — returns 1 if val is falsy
                    if (node.args.length !== 1) return FORMULA_ERRORS.ERROR;
                    const val = evaluate(node.args[0], lookup, sheetLookup);
                    if (typeof val === 'string' && isFormulaError(val)) return val;
                    const truthy = typeof val === 'number' ? val !== 0 : val !== '';
                    return truthy ? 0 : 1;
                }

                // ─── Stage 5 Lookup / Math Functions ────────────────────
                case 'VLOOKUP': {
                    // VLOOKUP(search_key, range, col_index, [is_sorted])
                    if (node.args.length < 3) return FORMULA_ERRORS.ERROR;
                    const searchKey = evaluate(node.args[0], lookup, sheetLookup);
                    if (typeof searchKey === 'string' && isFormulaError(searchKey)) return searchKey;

                    const rangeNode = node.args[1];
                    if (rangeNode.type !== 'rangeRef' && rangeNode.type !== 'sheetRangeRef') {
                        return FORMULA_ERRORS.ERROR;
                    }
                    const { start, end } = rangeNode;
                    const effectiveLookup: CellLookup = rangeNode.type === 'sheetRangeRef' && sheetLookup
                        ? (col, row) => sheetLookup(rangeNode.sheetName, col, row)
                        : lookup;

                    const colIndexVal = evaluate(node.args[2], lookup, sheetLookup);
                    if (typeof colIndexVal === 'string') return FORMULA_ERRORS.ERROR;
                    const colIndex = Math.floor(colIndexVal);
                    if (colIndex < 1) return FORMULA_ERRORS.ERROR;

                    const minCol = Math.min(start.col, end.col);
                    const maxCol = Math.max(start.col, end.col);
                    const minRow = Math.min(start.row, end.row);
                    const maxRow = Math.max(start.row, end.row);

                    if (minCol + colIndex - 1 > maxCol) return FORMULA_ERRORS.REF;

                    // Search first column for matching value
                    for (let r = minRow; r <= maxRow; r++) {
                        const cellVal = effectiveLookup(minCol, r);
                        const cv = cellVal === null ? '' : cellVal;
                        const matches = typeof searchKey === 'number' && typeof cv === 'number'
                            ? cv === searchKey
                            : String(cv).toLowerCase() === String(searchKey).toLowerCase();
                        if (matches) {
                            const resultVal = effectiveLookup(minCol + colIndex - 1, r);
                            if (resultVal === null || resultVal === undefined) return 0;
                            return resultVal;
                        }
                    }
                    return FORMULA_ERRORS.ERROR; // Not found
                }

                case 'SUMIF': {
                    // SUMIF(criteria_range, criterion, [sum_range])
                    if (node.args.length < 2) return FORMULA_ERRORS.ERROR;

                    const criteriaRangeNode = node.args[0];
                    if (criteriaRangeNode.type !== 'rangeRef' && criteriaRangeNode.type !== 'sheetRangeRef') {
                        return FORMULA_ERRORS.ERROR;
                    }

                    const criterionVal = evaluate(node.args[1], lookup, sheetLookup);
                    const criterionStr = String(criterionVal);
                    const testFn = parseCriterion(criterionStr);

                    const { start: cStart, end: cEnd } = criteriaRangeNode;
                    const cMinCol = Math.min(cStart.col, cEnd.col);
                    const cMaxCol = Math.max(cStart.col, cEnd.col);
                    const cMinRow = Math.min(cStart.row, cEnd.row);
                    const cMaxRow = Math.max(cStart.row, cEnd.row);

                    // Determine sum range (defaults to criteria range)
                    let sMinCol = cMinCol, sMinRow = cMinRow;
                    if (node.args.length >= 3) {
                        const sumRangeNode = node.args[2];
                        if (sumRangeNode.type === 'rangeRef' || sumRangeNode.type === 'sheetRangeRef') {
                            sMinCol = Math.min(sumRangeNode.start.col, sumRangeNode.end.col);
                            sMinRow = Math.min(sumRangeNode.start.row, sumRangeNode.end.row);
                        }
                    }

                    let sum = 0;
                    let idx = 0;
                    for (let r = cMinRow; r <= cMaxRow; r++) {
                        for (let c = cMinCol; c <= cMaxCol; c++) {
                            const cellVal = lookup(c, r);
                            if (testFn(cellVal)) {
                                // Map to sum_range cell at same offset
                                const sr = sMinRow + (r - cMinRow);
                                const sc = sMinCol + (c - cMinCol);
                                const sumVal = lookup(sc, sr);
                                if (typeof sumVal === 'number') sum += sumVal;
                                else if (typeof sumVal === 'string') {
                                    const n = parseFloat(sumVal);
                                    if (!isNaN(n)) sum += n;
                                }
                            }
                            idx++;
                        }
                    }
                    return sum;
                }

                // ─── Stage 5 COUNTIF ─────────────────────────────────────
                case 'COUNTIF': {
                    // COUNTIF(criteria_range, criterion) — FR-506
                    if (node.args.length < 2) return FORMULA_ERRORS.ERROR;

                    const countifRangeNode = node.args[0];
                    if (countifRangeNode.type !== 'rangeRef' && countifRangeNode.type !== 'sheetRangeRef') {
                        return FORMULA_ERRORS.ERROR;
                    }

                    const countifCriterionVal = evaluate(node.args[1], lookup, sheetLookup);
                    const countifCriterionStr = String(countifCriterionVal);
                    const countifTestFn = parseCriterion(countifCriterionStr);

                    const { start: ciStart, end: ciEnd } = countifRangeNode;
                    const ciMinCol = Math.min(ciStart.col, ciEnd.col);
                    const ciMaxCol = Math.max(ciStart.col, ciEnd.col);
                    const ciMinRow = Math.min(ciStart.row, ciEnd.row);
                    const ciMaxRow = Math.max(ciStart.row, ciEnd.row);

                    let countifTotal = 0;
                    for (let r = ciMinRow; r <= ciMaxRow; r++) {
                        for (let c = ciMinCol; c <= ciMaxCol; c++) {
                            const cellVal = lookup(c, r);
                            if (countifTestFn(cellVal)) {
                                countifTotal++;
                            }
                        }
                    }
                    return countifTotal;
                }

                // ─── Stage 5 Text Functions ──────────────────────────────
                case 'TRIM': {
                    if (node.args.length !== 1) return FORMULA_ERRORS.ERROR;
                    const val = getRawCellValue(node.args[0], lookup, sheetLookup);
                    if (typeof val === 'string' && isFormulaError(val)) return val;
                    return String(val).trim();
                }
                case 'CONCATENATE': {
                    if (node.args.length === 0) return FORMULA_ERRORS.ERROR;
                    let result = '';
                    for (const arg of node.args) {
                        const val = getRawCellValue(arg, lookup, sheetLookup);
                        if (typeof val === 'string' && isFormulaError(val)) return val;
                        result += String(val);
                    }
                    return result;
                }
                case 'LEFT': {
                    // LEFT(text, [num_chars]) — defaults to 1
                    if (node.args.length < 1) return FORMULA_ERRORS.ERROR;
                    const leftVal = getRawCellValue(node.args[0], lookup, sheetLookup);
                    if (typeof leftVal === 'string' && isFormulaError(leftVal)) return leftVal;
                    const leftStr = String(leftVal);
                    const leftN = node.args.length >= 2
                        ? Math.floor(Number(evaluate(node.args[1], lookup, sheetLookup)))
                        : 1;
                    if (isNaN(leftN) || leftN < 0) return FORMULA_ERRORS.ERROR;
                    return leftStr.substring(0, leftN);
                }
                case 'RIGHT': {
                    // RIGHT(text, [num_chars]) — defaults to 1
                    if (node.args.length < 1) return FORMULA_ERRORS.ERROR;
                    const rightVal = getRawCellValue(node.args[0], lookup, sheetLookup);
                    if (typeof rightVal === 'string' && isFormulaError(rightVal)) return rightVal;
                    const rightStr = String(rightVal);
                    const rightN = node.args.length >= 2
                        ? Math.floor(Number(evaluate(node.args[1], lookup, sheetLookup)))
                        : 1;
                    if (isNaN(rightN) || rightN < 0) return FORMULA_ERRORS.ERROR;
                    return rightStr.substring(Math.max(0, rightStr.length - rightN));
                }
                case 'LEN': {
                    // LEN(text)
                    if (node.args.length !== 1) return FORMULA_ERRORS.ERROR;
                    const lenVal = getRawCellValue(node.args[0], lookup, sheetLookup);
                    if (typeof lenVal === 'string' && isFormulaError(lenVal)) return lenVal;
                    return String(lenVal).length;
                }
                case 'ROUND': {
                    // ROUND(number, num_digits)
                    if (node.args.length < 2) return FORMULA_ERRORS.ERROR;
                    const roundVal = evaluate(node.args[0], lookup, sheetLookup);
                    if (typeof roundVal === 'string') return FORMULA_ERRORS.ERROR;
                    const roundDigits = evaluate(node.args[1], lookup, sheetLookup);
                    if (typeof roundDigits === 'string') return FORMULA_ERRORS.ERROR;
                    const factor = Math.pow(10, Math.floor(roundDigits));
                    return Math.round(roundVal * factor) / factor;
                }

                default:
                    return FORMULA_ERRORS.NAME;
            }
        }

        default:
            return FORMULA_ERRORS.ERROR;
    }
}

// ─── Public API ─────────────────────────────────────────────────────

export interface FormulaResult {
    value: number | string;
    referencedCells: HighlightRef[];
    error?: FormulaError;
}

/** A cell reference with a range group index for highlight coloring */
export interface HighlightRef {
    col: number;
    row: number;
    rangeIndex: number; // cells sharing the same rangeIndex share the same highlight color
}

/** Extract all cell references from a formula string, expanding ranges into all contained cells.
 *  Each range or standalone ref gets a unique rangeIndex so the caller can color them.
 *  Note: Cross-sheet references (SheetName!A1) are skipped since they reference other sheets. */
export function extractReferences(formula: string): HighlightRef[] {
    const refs: HighlightRef[] = [];
    // Match ranges first (e.g. D2:D4, $A$1:$B$5), then standalone cell refs
    // Skip cross-sheet references (preceded by word chars + !)
    const pattern = /(?:[A-Za-z0-9]+!)?((\$?[A-Za-z]\$?\d+):(\$?[A-Za-z]\$?\d+)|\$?[A-Za-z]\$?\d+)/g;
    let match;
    let rangeIndex = 0;

    while ((match = pattern.exec(formula)) !== null) {
        // Skip cross-sheet references
        if (match[0].includes('!')) continue;

        if (match[2] && match[3]) {
            // Range reference — expand to all cells in the rectangle
            const start = parseCellRef(match[2]);
            const end = parseCellRef(match[3]);
            if (start && end) {
                const minCol = Math.min(start.col, end.col);
                const maxCol = Math.max(start.col, end.col);
                const minRow = Math.min(start.row, end.row);
                const maxRow = Math.max(start.row, end.row);
                for (let r = minRow; r <= maxRow; r++) {
                    for (let c = minCol; c <= maxCol; c++) {
                        refs.push({ col: c, row: r, rangeIndex });
                    }
                }
                rangeIndex++;
            }
        } else {
            // Standalone cell reference
            const ref = parseCellRef(match[0]);
            if (ref) {
                refs.push({ col: ref.col, row: ref.row, rangeIndex });
                rangeIndex++;
            }
        }
    }
    return refs;
}

/** Evaluate a formula string. Returns computed value + referenced cells.
 *  optionally accepts allSheets for cross-sheet reference resolution (FR-203).
 *  optionally accepts namedRanges for named range resolution (FR-601). */
export function evaluateFormula(
    formulaStr: string,
    cells: Record<string, Cell>,
    currentCol?: number,
    currentRow?: number,
    allSheets?: Sheet[],
    namedRanges?: Array<{ name: string; range: string; sheetId: string }>,
): FormulaResult {
    // Remove leading '='
    let expr = formulaStr.startsWith('=') ? formulaStr.slice(1) : formulaStr;

    // FR-601: Resolve named ranges before tokenization
    if (namedRanges && namedRanges.length > 0) {
        // Sort by name length descending to match longer names first
        const sorted = [...namedRanges].sort((a, b) => b.name.length - a.name.length);
        for (const nr of sorted) {
            // Replace named range identifiers (case-insensitive, whole-word)
            // Must not be preceded/followed by alphanumerics or $ to avoid partial matches
            const pattern = new RegExp(`(?<![A-Za-z0-9_$])${nr.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9_$])`, 'gi');
            expr = expr.replace(pattern, nr.range);
        }
    }

    const referencedCells = extractReferences(expr);

    // Cell lookup function
    const lookup: CellLookup = (col, row) => {
        // Prevent self-reference (basic circular detection)
        if (currentCol !== undefined && currentRow !== undefined && col === currentCol && row === currentRow) {
            return FORMULA_ERRORS.CIRCULAR;
        }
        const cell = cells[cellKey(col, row)];
        if (!cell) return null;
        // If it's a formula cell, use its computed value
        if (cell.formula) {
            return cell.value;
        }
        return cell.value;
    };

    // Cross-sheet lookup (FR-203)
    const sheetLookup: SheetLookup | undefined = allSheets ? (sheetName, col, row) => {
        const targetSheet = allSheets.find(s => s.name.toLowerCase() === sheetName.toLowerCase());
        if (!targetSheet) return FORMULA_ERRORS.REF; // #REF! for missing sheet
        const cell = targetSheet.cells[cellKey(col, row)];
        if (!cell) return null;
        return cell.value;
    } : undefined;

    try {
        const tokens = tokenize(expr);
        const parser = new Parser(tokens);
        const ast = parser.parse();
        const result = evaluate(ast, lookup, sheetLookup);

        if (typeof result === 'string' && isFormulaError(result)) {
            return { value: result, referencedCells, error: result };
        }

        // Round to avoid floating-point display issues
        const numResult = typeof result === 'number'
            ? Math.round(result * 1e10) / 1e10
            : result;

        return { value: numResult, referencedCells };
    } catch {
        return { value: FORMULA_ERRORS.ERROR, referencedCells, error: FORMULA_ERRORS.ERROR };
    }
}

/** Adjust formula references when copying/pasting (FR-107) */
export function adjustFormulaReferences(formula: string, colOffset: number, rowOffset: number): string {
    if (!formula.startsWith('=')) return formula;

    // Match cell references with optional $ markers
    return formula.replace(/(\$?)([A-Za-z])(\$?)(\d+)/g, (match, absColMark, colLetter, absRowMark, rowNum) => {
        const ref = parseCellRef(match);
        if (!ref) return match;
        const shifted = shiftCellRef(ref, colOffset, rowOffset);
        // Clamp to valid range
        if (shifted.col < 0 || shifted.col > 25 || shifted.row < 0 || shifted.row > 99) {
            return match; // Keep original if out of bounds
        }
        return cellRefToString(shifted);
    });
}

/** Generate a plain-English tooltip for a formula (FR-113) */
export function formulaTooltip(formula: string): string {
    if (!formula.startsWith('=')) return '';
    const expr = formula.slice(1).trim();

    // Match function calls like SUM(A1:A5)
    const funcMatch = expr.match(/^([A-Za-z]+)\((.+)\)$/);
    if (funcMatch) {
        const func = funcMatch[1].toUpperCase();
        const args = funcMatch[2];
        switch (func) {
            case 'SUM': return `Adds up all values from ${args}`;
            case 'AVERAGE': return `Calculates the average of ${args}`;
            case 'MIN': return `Finds the minimum value in ${args}`;
            case 'MAX': return `Finds the maximum value in ${args}`;
            case 'COUNT': return `Counts non-empty cells in ${args}`;
            case 'IF': return `Returns one value if condition is true, another if false`;
            case 'AND': return `Returns TRUE if all arguments are true`;
            case 'OR': return `Returns TRUE if any argument is true`;
            case 'NOT': return `Reverses the logical value`;
            case 'VLOOKUP': return `Searches for a value in the first column and returns a value in the same row`;
            case 'SUMIF': return `Sums cells that meet a criterion`;
            case 'TRIM': return `Removes leading and trailing spaces`;
            case 'CONCATENATE': return `Joins text strings together`;
            case 'BARCHART': return `Renders an inline bar chart from ${args}`;
            case 'PIECHART': return `Renders an inline pie chart from ${args}`;
            default: return `Calculates ${func}(${args})`;
        }
    }

    // Simple arithmetic
    if (expr.includes('+')) return `Adds ${expr.replace(/\+/g, ' and ')}`;
    if (expr.includes('-')) return `Subtracts values: ${expr}`;
    if (expr.includes('*')) return `Multiplies ${expr.replace(/\*/g, ' by ')}`;
    if (expr.includes('/')) return `Divides ${expr.replace(/\//g, ' by ')}`;

    return `Calculates: ${expr}`;
}
