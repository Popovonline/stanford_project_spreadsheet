// SheetForge Data Model — PRD §4.4
// All Stage 2 fields are pre-allocated as optional to avoid future migrations.

export interface CellAddress {
    sheetId: string;
    col: number; // 0-indexed (A=0, B=1, ... Z=25)
    row: number; // 0-indexed (row 1 = 0)
}

export interface CellFormat {
    bold?: boolean;
    fontColor?: string;       // Hex color
    backgroundColor?: string; // Hex color
    alignment?: 'left' | 'center' | 'right';
}

export interface Cell {
    // Core (MVP)
    value: string | number | null;
    formula?: string;
    displayValue?: string;
    dataType: 'text' | 'number' | 'date' | 'currency' | 'percentage' | 'empty';

    // Formatting (Stage 1)
    format?: CellFormat;

    // Stage 5
    comment?: Comment;
    validation?: ValidationRule;
}

// Stage 4: Merged cell region
export interface MergedRegion {
    startCol: number;
    startRow: number;
    endCol: number;
    endRow: number;
}

// Stage 5: Filter state per column
export interface FilterState {
    column: number;
    values: string[];    // allowed values (whitelist)
    active: boolean;
}

// Stage 5: Data validation rule
export interface ValidationRule {
    type: 'list' | 'number' | 'text_length';
    values?: string[];   // for 'list' type
    min?: number;        // for 'number' / 'text_length'
    max?: number;
    errorMessage?: string;
}

// Stage 5: Cell comment
export interface Comment {
    text: string;
    author: string;
    timestamp: number;
}

// Stage 6: Named range
export interface NamedRange {
    name: string;       // e.g. "Revenue"
    range: string;      // e.g. "A1:A10"
    sheetId: string;
}

// Conditional formatting rule (FR-204)
export interface ConditionalRule {
    id: string;
    range: { startCol: number; startRow: number; endCol: number; endRow: number };
    condition: 'greater' | 'less' | 'equal' | 'not_equal' | 'between' | 'text_contains';
    value1: string;
    value2?: string; // for 'between'
    format: { backgroundColor?: string; fontColor?: string };
}

export interface Sheet {
    id: string;
    name: string;
    cells: Record<string, Cell>; // Key = "col,row" (e.g., "0,0" for A1)
    columnWidths: Record<number, number>;
    rowHeights: Record<number, number>;
    conditionalRules?: ConditionalRule[]; // FR-204
    frozenRows?: number; // US-208: number of frozen rows (0 = none)
    // Stage 4
    mergedRegions?: MergedRegion[];
    sortColumn?: number;       // currently sorted column (-1 = none)
    sortDirection?: 'asc' | 'desc';
    // Stage 5
    filters?: FilterState[];
    filterActive?: boolean;
}

export interface Workbook {
    sheets: Sheet[];
    activeSheetId: string;
    settings: {
        theme: 'light' | 'dark';
    };
}

// Grid mode state machine — PRD §4.2
export type GridMode = 'VIEWING' | 'EDITING' | 'SELECTING';

// Selection range for multi-cell select
export interface SelectionRange {
    startCol: number;
    startRow: number;
    endCol: number;
    endRow: number;
}

// Clipboard data for internal copy/paste
export interface ClipboardData {
    cells: Record<string, Cell>;
    range: SelectionRange;
    isCut?: boolean;
}

// Undo history entry
export interface UndoEntry {
    cells: Record<string, Cell>;
    columnWidths: Record<number, number>;
    rowHeights: Record<number, number>;
}

// Find & replace state (US-211)
export interface FindReplaceState {
    isOpen: boolean;
    searchTerm: string;
    replaceTerm: string;
    matches: { col: number; row: number }[];
    activeMatchIndex: number;
}

export interface SpreadsheetState {
    workbook: Workbook;
    activeCell: CellAddress;
    mode: GridMode;
    editBuffer: string;
    selection: SelectionRange | null;
    undoStack: UndoEntry[];
    redoStack: UndoEntry[];
    clipboard: ClipboardData | null;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    lastSavedAt: number | null;
    findReplace: FindReplaceState;
    showCondFormatDialog: boolean;
    // Stage 6
    namedRanges: NamedRange[];
}

// Actions for useReducer
export type SpreadsheetAction =
    | { type: 'SELECT_CELL'; col: number; row: number }
    | { type: 'START_EDITING'; initialValue?: string }
    | { type: 'UPDATE_EDIT_BUFFER'; value: string }
    | { type: 'COMMIT_EDIT' }
    | { type: 'CANCEL_EDITING' }
    | { type: 'NAVIGATE'; direction: 'up' | 'down' | 'left' | 'right' }
    | { type: 'TAB_NAVIGATE'; shift?: boolean }
    | { type: 'SET_CELL_VALUE'; col: number; row: number; value: string }
    | { type: 'UNDO' }
    | { type: 'REDO' }
    | { type: 'SET_SELECTION'; range: SelectionRange | null }
    | { type: 'SET_FORMAT'; format: Partial<CellFormat> }
    | { type: 'RESIZE_COLUMN'; col: number; width: number }
    | { type: 'RESIZE_ROW'; row: number; height: number }
    | { type: 'COPY'; isCut?: boolean }
    | { type: 'PASTE'; externalText?: string }
    | { type: 'RESTORE_WORKBOOK'; workbook: Workbook }
    | { type: 'SET_SAVE_STATUS'; status: SpreadsheetState['saveStatus'] }
    // Stage 2: Sheets
    | { type: 'ADD_SHEET' }
    | { type: 'DELETE_SHEET'; sheetId: string }
    | { type: 'RENAME_SHEET'; sheetId: string; name: string }
    | { type: 'SWITCH_SHEET'; sheetId: string }
    // Stage 2: CSV
    | { type: 'IMPORT_CSV'; csv: string }
    // Stage 2: Find & Replace
    | { type: 'TOGGLE_FIND_DIALOG' }
    | { type: 'FIND_SET_SEARCH'; searchTerm: string }
    | { type: 'FIND_SET_REPLACE'; replaceTerm: string }
    | { type: 'FIND_NEXT' }
    | { type: 'FIND_PREV' }
    | { type: 'REPLACE_CURRENT' }
    | { type: 'REPLACE_ALL' }
    // Stage 2: Conditional Formatting
    | { type: 'TOGGLE_COND_FORMAT_DIALOG' }
    | { type: 'ADD_CONDITIONAL_RULE'; rule: ConditionalRule }
    | { type: 'DELETE_CONDITIONAL_RULE'; ruleId: string }
    // Stage 2: Freeze Rows
    | { type: 'TOGGLE_FREEZE_ROW' }
    // Stage 4: Grid Power
    | { type: 'INSERT_ROW'; position: 'above' | 'below' }
    | { type: 'DELETE_ROW' }
    | { type: 'INSERT_COL'; position: 'left' | 'right' }
    | { type: 'DELETE_COL' }
    | { type: 'SORT_COLUMN'; col: number; direction: 'asc' | 'desc' }
    | { type: 'MERGE_CELLS' }
    | { type: 'UNMERGE_CELLS' }
    | { type: 'FILL_RANGE'; sourceCol: number; sourceRow: number; targetRange: SelectionRange }
    // Stage 5: Data Intelligence
    | { type: 'TOGGLE_FILTER' }
    | { type: 'SET_COLUMN_FILTER'; col: number; values: string[] }
    | { type: 'CLEAR_ALL_FILTERS' }
    | { type: 'SET_VALIDATION'; col: number; row: number; rule: ValidationRule }
    | { type: 'REMOVE_VALIDATION'; col: number; row: number }
    | { type: 'SET_COMMENT'; col: number; row: number; text: string; author: string }
    | { type: 'DELETE_COMMENT'; col: number; row: number }
    // Stage 6: Polish & Power
    | { type: 'ADD_NAMED_RANGE'; name: string; range: string; sheetId: string }
    | { type: 'UPDATE_NAMED_RANGE'; name: string; range: string; sheetId: string }
    | { type: 'DELETE_NAMED_RANGE'; name: string };

// Constants
export const TOTAL_COLUMNS = 26; // A-Z
export const TOTAL_ROWS = 100;
export const DEFAULT_COLUMN_WIDTH = 100;
export const DEFAULT_ROW_HEIGHT = 28;
export const MIN_COLUMN_WIDTH = 30;  // CC-106
export const MIN_ROW_HEIGHT = 20;
export const MAX_CELL_CHARS = 5000;
export const MAX_UNDO_STACK = 50;
export const AUTO_SAVE_DELAY = 2000; // 2 seconds debounce
export const LOCAL_STORAGE_KEY = 'sheetforge_workbook';

// Helpers
export function colIndexToLetter(col: number): string {
    return String.fromCharCode(65 + col);
}

export function letterToColIndex(letter: string): number {
    return letter.toUpperCase().charCodeAt(0) - 65;
}

export function cellKey(col: number, row: number): string {
    return `${col},${row}`;
}

export function getCellDisplayValue(cell: Cell | undefined): string {
    if (!cell) return '';
    // Show formula errors or display value
    if (cell.displayValue !== undefined) return cell.displayValue;
    if (cell.value === null || cell.value === undefined) return '';
    return String(cell.value);
}

/** Get cell reference string like "A1" */
export function cellRefString(col: number, row: number): string {
    return `${colIndexToLetter(col)}${row + 1}`;
}

/** Check if a cell value is a formula error */
export function isCellError(cell: Cell | undefined): boolean {
    if (!cell) return false;
    const dv = cell.displayValue ?? '';
    return dv.startsWith('#') && dv.endsWith('!') || dv === '#NAME?';
}

/** Normalize selection so start <= end */
export function normalizeSelection(sel: SelectionRange): SelectionRange {
    return {
        startCol: Math.min(sel.startCol, sel.endCol),
        startRow: Math.min(sel.startRow, sel.endRow),
        endCol: Math.max(sel.startCol, sel.endCol),
        endRow: Math.max(sel.startRow, sel.endRow),
    };
}

/** Check if a cell is within a selection range */
export function isCellInSelection(col: number, row: number, sel: SelectionRange | null): boolean {
    if (!sel) return false;
    const n = normalizeSelection(sel);
    return col >= n.startCol && col <= n.endCol && row >= n.startRow && row <= n.endRow;
}
