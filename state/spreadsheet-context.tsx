'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, type ReactNode } from 'react';
import {
    type SpreadsheetState,
    type SpreadsheetAction,
    type Workbook,
    type Sheet,
    type Cell,
    type CellFormat,
    type UndoEntry,
    type SelectionRange,
    type ClipboardData,
    type FindReplaceState,
    TOTAL_COLUMNS,
    TOTAL_ROWS,
    DEFAULT_COLUMN_WIDTH,
    DEFAULT_ROW_HEIGHT,
    MIN_COLUMN_WIDTH,
    MIN_ROW_HEIGHT,
    MAX_CELL_CHARS,
    MAX_UNDO_STACK,

    AUTO_SAVE_DELAY,
    LOCAL_STORAGE_KEY,
    cellKey,
    colIndexToLetter,
    normalizeSelection,
} from '@/types/spreadsheet';
import { evaluateFormula, adjustFormulaReferences } from '@/lib/formula-engine';

// ─── Factory ────────────────────────────────────────────────────────
function generateId(): string {
    return Math.random().toString(36).substring(2, 10);
}

function createDefaultSheet(name?: string): Sheet {
    const id = generateId();
    return {
        id,
        name: name || 'Sheet1',
        cells: {},
        columnWidths: Object.fromEntries(
            Array.from({ length: TOTAL_COLUMNS }, (_, i) => [i, DEFAULT_COLUMN_WIDTH])
        ),
        rowHeights: Object.fromEntries(
            Array.from({ length: TOTAL_ROWS }, (_, i) => [i, DEFAULT_ROW_HEIGHT])
        ),
        conditionalRules: [],
        frozenRows: 0,
    };
}

function createDefaultWorkbook(): Workbook {
    const sheet = createDefaultSheet();
    return {
        sheets: [sheet],
        activeSheetId: sheet.id,
        settings: { theme: 'light' },
    };
}

const defaultFindReplace: FindReplaceState = {
    isOpen: false,
    searchTerm: '',
    replaceTerm: '',
    matches: [],
    activeMatchIndex: -1,
};

export function createInitialState(): SpreadsheetState {
    const workbook = createDefaultWorkbook();
    return {
        workbook,
        activeCell: { sheetId: workbook.activeSheetId, col: 0, row: 0 },
        mode: 'VIEWING',
        editBuffer: '',
        selection: null,
        undoStack: [],
        redoStack: [],
        clipboard: null,
        saveStatus: 'idle',
        lastSavedAt: null,
        findReplace: { ...defaultFindReplace },
        showCondFormatDialog: false,
        namedRanges: [],
    };
}

// ─── Helpers ────────────────────────────────────────────────────────
function getActiveSheet(state: SpreadsheetState): Sheet {
    return state.workbook.sheets.find(s => s.id === state.workbook.activeSheetId)!;
}

function updateActiveSheet(
    state: SpreadsheetState,
    updater: (sheet: Sheet) => Sheet
): SpreadsheetState {
    const sheets = state.workbook.sheets.map(sheet => {
        if (sheet.id !== state.workbook.activeSheetId) return sheet;
        return updater(sheet);
    });
    return { ...state, workbook: { ...state.workbook, sheets } };
}

function updateActiveSheetCells(
    state: SpreadsheetState,
    updater: (cells: Record<string, Cell>) => Record<string, Cell>
): SpreadsheetState {
    return updateActiveSheet(state, sheet => ({
        ...sheet,
        cells: updater({ ...sheet.cells }),
    }));
}

// ─── Cell Type Detection (FR-108) ───────────────────────────────────
export function determineCellDataType(value: string): Cell['dataType'] {
    if (value === '') return 'empty';
    if (/^[$€£¥]\s*[\d,]+\.?\d*$/.test(value) || /^[\d,]+\.?\d*\s*[$€£¥]$/.test(value)) return 'currency';
    if (/^-?\d+\.?\d*\s*%$/.test(value)) return 'percentage';
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value) || /^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date';
    if (!isNaN(Number(value)) && value.trim() !== '') return 'number';
    return 'text';
}

function formatDisplayValue(value: string, dataType: Cell['dataType']): string | undefined {
    if (dataType === 'date') {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d.toLocaleDateString();
    }
    return undefined;
}

function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
}

// ─── Undo Helpers ───────────────────────────────────────────────────
function captureUndoEntry(sheet: Sheet): UndoEntry {
    return {
        cells: JSON.parse(JSON.stringify(sheet.cells)),
        columnWidths: { ...sheet.columnWidths },
        rowHeights: { ...sheet.rowHeights },
    };
}

function pushUndo(state: SpreadsheetState): SpreadsheetState {
    const sheet = getActiveSheet(state);
    const entry = captureUndoEntry(sheet);
    const undoStack = [...state.undoStack, entry].slice(-MAX_UNDO_STACK);
    return { ...state, undoStack, redoStack: [] };
}

// ─── Formula Recalculation ──────────────────────────────────────────
function recalculateFormulas(cells: Record<string, Cell>, allSheets?: Sheet[], namedRanges?: Array<{ name: string; range: string; sheetId: string }>): Record<string, Cell> {
    const newCells = { ...cells };
    for (const key of Object.keys(newCells)) {
        const cell = newCells[key];
        if (cell?.formula) {
            const [colStr, rowStr] = key.split(',');
            const col = parseInt(colStr, 10);
            const row = parseInt(rowStr, 10);
            const result = evaluateFormula(cell.formula, newCells, col, row, allSheets, namedRanges);
            newCells[key] = {
                ...cell,
                value: typeof result.value === 'number' ? result.value : null,
                displayValue: String(result.value),
                dataType: result.error ? 'text' : 'number',
            };
        }
    }
    return newCells;
}

// ─── Copy/Paste Helpers ─────────────────────────────────────────────
function getEffectiveSelection(state: SpreadsheetState): SelectionRange {
    if (state.selection) return normalizeSelection(state.selection);
    return {
        startCol: state.activeCell.col,
        startRow: state.activeCell.row,
        endCol: state.activeCell.col,
        endRow: state.activeCell.row,
    };
}

export function parseTSV(text: string): string[][] {
    return text.split('\n').filter(line => line.length > 0).map(line => line.split('\t'));
}

// ─── Find Matches ───────────────────────────────────────────────────
function computeMatches(cells: Record<string, Cell>, searchTerm: string): { col: number; row: number }[] {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    const matches: { col: number; row: number }[] = [];
    for (const key of Object.keys(cells)) {
        const cell = cells[key];
        if (!cell) continue;
        const val = (cell.displayValue ?? String(cell.value ?? '')).toLowerCase();
        const formula = (cell.formula ?? '').toLowerCase();
        if (val.includes(term) || formula.includes(term)) {
            const [c, r] = key.split(',').map(Number);
            matches.push({ col: c, row: r });
        }
    }
    // Sort by row, then column
    matches.sort((a, b) => a.row - b.row || a.col - b.col);
    return matches;
}

// ─── CSV Parse ──────────────────────────────────────────────────────
export function parseCSV(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const next = text[i + 1];

        if (inQuotes) {
            if (ch === '"' && next === '"') {
                field += '"';
                i++;
            } else if (ch === '"') {
                inQuotes = false;
            } else {
                field += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                row.push(field);
                field = '';
            } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
                row.push(field);
                rows.push(row);
                row = [];
                field = '';
                if (ch === '\r') i++;
            } else {
                field += ch;
            }
        }
    }
    // Last field/row
    if (field || row.length > 0) {
        row.push(field);
        rows.push(row);
    }
    return rows;
}

// ─── Commit Helper ──────────────────────────────────────────────────
function commitEditBuffer(state: SpreadsheetState): SpreadsheetState {
    let newState = pushUndo(state);
    const trimmed = newState.editBuffer.trim();
    const rawValue = trimmed === '' ? '' : newState.editBuffer;

    if (rawValue.startsWith('=') && rawValue.length > 1) {
        const sheet = getActiveSheet(newState);
        const col = newState.activeCell.col;
        const row = newState.activeCell.row;
        const result = evaluateFormula(rawValue, sheet.cells, col, row, newState.workbook.sheets, newState.namedRanges);

        newState = updateActiveSheetCells(newState, cells => {
            const key = cellKey(col, row);
            cells[key] = {
                formula: rawValue,
                value: result.error ? null : (typeof result.value === 'number' ? result.value : null),
                displayValue: String(result.value),
                dataType: result.error ? 'text' : 'number',
            };
            return cells;
        });

        const updatedSheet = getActiveSheet(newState);
        const recalculated = recalculateFormulas(updatedSheet.cells, newState.workbook.sheets, newState.namedRanges);
        newState = updateActiveSheetCells(newState, () => recalculated);
    } else {
        const dataType = determineCellDataType(rawValue);
        const cellValue: string | number | null =
            rawValue === '' ? null : dataType === 'number' ? Number(rawValue) : rawValue;
        const displayVal = formatDisplayValue(rawValue, dataType);

        newState = updateActiveSheetCells(newState, cells => {
            const key = cellKey(newState.activeCell.col, newState.activeCell.row);
            if (cellValue === null) {
                const { [key]: _, ...rest } = cells;
                return rest;
            }
            const existingCell = cells[key];
            cells[key] = {
                value: cellValue,
                dataType,
                ...(displayVal ? { displayValue: displayVal } : {}),
                ...(existingCell?.format ? { format: existingCell.format } : {}),
            };
            return cells;
        });

        const updatedSheet = getActiveSheet(newState);
        const recalculated = recalculateFormulas(updatedSheet.cells, newState.workbook.sheets, newState.namedRanges);
        newState = updateActiveSheetCells(newState, () => recalculated);
    }

    return newState;
}

// ─── Reducer ────────────────────────────────────────────────────────
export function spreadsheetReducer(
    state: SpreadsheetState,
    action: SpreadsheetAction
): SpreadsheetState {
    switch (action.type) {
        case 'SELECT_CELL': {
            const col = clamp(action.col, 0, TOTAL_COLUMNS - 1);
            const row = clamp(action.row, 0, TOTAL_ROWS - 1);

            // Point-and-click formula entry (FR-116): if editing a formula AND
            // the buffer ends with an operator/open-paren/comma/equals, append
            // the clicked cell reference. Otherwise commit the formula.
            if (state.mode === 'EDITING' && state.editBuffer.startsWith('=')) {
                const buf = state.editBuffer;
                const lastChar = buf[buf.length - 1];
                const expectsRef = '=+-*/^(,'.includes(lastChar);
                if (expectsRef) {
                    const ref = colIndexToLetter(col) + (row + 1);
                    return { ...state, editBuffer: buf + ref };
                }
                // Formula is complete — fall through to commit + navigate
            }

            let intermediate = state;
            if (state.mode === 'EDITING' && state.editBuffer !== '') {
                intermediate = commitEditBuffer(state);
            }
            return {
                ...intermediate,
                activeCell: { ...intermediate.activeCell, col, row },
                mode: 'VIEWING',
                editBuffer: '',
                selection: null,
            };
        }

        case 'START_EDITING': {
            const sheet = getActiveSheet(state);
            const key = cellKey(state.activeCell.col, state.activeCell.row);
            const cell = sheet.cells[key];
            const initialValue =
                action.initialValue !== undefined
                    ? action.initialValue
                    : cell
                        ? (cell.formula ?? String(cell.value ?? ''))
                        : '';
            return { ...state, mode: 'EDITING', editBuffer: initialValue };
        }

        case 'UPDATE_EDIT_BUFFER': {
            const value = action.value.length > MAX_CELL_CHARS
                ? action.value.slice(0, MAX_CELL_CHARS)
                : action.value;
            return { ...state, editBuffer: value };
        }

        case 'COMMIT_EDIT': {
            const newState = commitEditBuffer(state);
            return { ...newState, mode: 'VIEWING', editBuffer: '' };
        }

        case 'CANCEL_EDITING':
            return { ...state, mode: 'VIEWING', editBuffer: '' };

        case 'NAVIGATE': {
            if (state.mode === 'EDITING') return state;
            const { col, row } = state.activeCell;
            let newCol = col, newRow = row;
            switch (action.direction) {
                case 'up': newRow = Math.max(0, row - 1); break;
                case 'down': newRow = Math.min(TOTAL_ROWS - 1, row + 1); break;
                case 'left': newCol = Math.max(0, col - 1); break;
                case 'right': newCol = Math.min(TOTAL_COLUMNS - 1, col + 1); break;
            }
            return { ...state, activeCell: { ...state.activeCell, col: newCol, row: newRow }, selection: null };
        }

        case 'TAB_NAVIGATE': {
            const { col, row } = state.activeCell;
            let newCol: number, newRow: number;
            if (action.shift) {
                if (col === 0) {
                    if (row === 0) { newCol = 0; newRow = 0; }
                    else { newCol = TOTAL_COLUMNS - 1; newRow = row - 1; }
                } else { newCol = col - 1; newRow = row; }
            } else {
                if (col === TOTAL_COLUMNS - 1) {
                    newCol = 0;
                    newRow = Math.min(TOTAL_ROWS - 1, row + 1);
                } else { newCol = col + 1; newRow = row; }
            }
            return { ...state, activeCell: { ...state.activeCell, col: newCol, row: newRow }, mode: 'VIEWING', editBuffer: '', selection: null };
        }

        case 'SET_CELL_VALUE': {
            let newState = pushUndo(state);
            const dataType = determineCellDataType(action.value);
            const cellValue: string | number | null =
                action.value === '' ? null : dataType === 'number' ? Number(action.value) : action.value;

            newState = updateActiveSheetCells(newState, cells => {
                const key = cellKey(action.col, action.row);
                if (cellValue === null) {
                    const { [key]: _, ...rest } = cells;
                    return rest;
                }
                cells[key] = { value: cellValue, dataType };
                return cells;
            });
            const updatedSheet = getActiveSheet(newState);
            const recalculated = recalculateFormulas(updatedSheet.cells, newState.workbook.sheets, newState.namedRanges);
            return updateActiveSheetCells(newState, () => recalculated);
        }

        case 'UNDO': {
            if (state.undoStack.length === 0) return state;
            const undoStack = [...state.undoStack];
            const redoStack = [...state.redoStack];
            const entry = undoStack.pop()!;
            const sheet = getActiveSheet(state);
            redoStack.push(captureUndoEntry(sheet));
            const current = updateActiveSheet(state, s => ({
                ...s, cells: entry.cells, columnWidths: entry.columnWidths, rowHeights: entry.rowHeights,
            }));
            return { ...current, undoStack, redoStack };
        }

        case 'REDO': {
            if (state.redoStack.length === 0) return state;
            const redoStack = [...state.redoStack];
            const undoStack = [...state.undoStack];
            const entry = redoStack.pop()!;
            const sheet = getActiveSheet(state);
            undoStack.push(captureUndoEntry(sheet));
            const current = updateActiveSheet(state, s => ({
                ...s, cells: entry.cells, columnWidths: entry.columnWidths, rowHeights: entry.rowHeights,
            }));
            return { ...current, undoStack, redoStack };
        }

        case 'SET_SELECTION':
            return { ...state, selection: action.range, mode: action.range ? 'SELECTING' : 'VIEWING' };

        case 'SET_FORMAT': {
            let newState = pushUndo(state);
            const sel = getEffectiveSelection(newState);
            const norm = normalizeSelection(sel);
            newState = updateActiveSheetCells(newState, cells => {
                for (let r = norm.startRow; r <= norm.endRow; r++) {
                    for (let c = norm.startCol; c <= norm.endCol; c++) {
                        const key = cellKey(c, r);
                        const existing = cells[key] || { value: null, dataType: 'empty' as const };
                        cells[key] = { ...existing, format: { ...(existing.format || {}), ...action.format } };
                    }
                }
                return cells;
            });
            return newState;
        }

        case 'RESIZE_COLUMN': {
            let newState = pushUndo(state);
            const width = Math.max(MIN_COLUMN_WIDTH, action.width);
            return updateActiveSheet(newState, sheet => ({
                ...sheet, columnWidths: { ...sheet.columnWidths, [action.col]: width },
            }));
        }

        case 'RESIZE_ROW': {
            let newState = pushUndo(state);
            const height = Math.max(MIN_ROW_HEIGHT, action.height);
            return updateActiveSheet(newState, sheet => ({
                ...sheet, rowHeights: { ...sheet.rowHeights, [action.row]: height },
            }));
        }

        case 'COPY': {
            const sheet = getActiveSheet(state);
            const sel = getEffectiveSelection(state);
            const norm = normalizeSelection(sel);
            const copiedCells: Record<string, Cell> = {};
            for (let r = norm.startRow; r <= norm.endRow; r++) {
                for (let c = norm.startCol; c <= norm.endCol; c++) {
                    const key = cellKey(c, r);
                    if (sheet.cells[key]) copiedCells[key] = { ...sheet.cells[key] };
                }
            }
            return { ...state, clipboard: { cells: copiedCells, range: norm, isCut: action.isCut } };
        }

        case 'PASTE': {
            let newState = pushUndo(state);
            if (action.externalText) {
                const rows = parseTSV(action.externalText);
                const startCol = newState.activeCell.col;
                const startRow = newState.activeCell.row;
                newState = updateActiveSheetCells(newState, cells => {
                    rows.forEach((rowData, ri) => {
                        rowData.forEach((cellVal, ci) => {
                            const c = startCol + ci;
                            const r = startRow + ri;
                            if (c < TOTAL_COLUMNS && r < TOTAL_ROWS) {
                                const key = cellKey(c, r);
                                const trimmed = cellVal.trim();
                                const dataType = determineCellDataType(trimmed);
                                const value: string | number | null = trimmed === '' ? null : (dataType === 'number' ? Number(trimmed) : trimmed);
                                if (value === null) delete cells[key];
                                else cells[key] = { value, dataType };
                            }
                        });
                    });
                    return cells;
                });
                const sheet = getActiveSheet(newState);
                return updateActiveSheetCells(newState, () => recalculateFormulas(sheet.cells, newState.workbook.sheets, newState.namedRanges));
            }

            if (!state.clipboard) return state;
            const { cells: copiedCells, range: srcRange, isCut } = state.clipboard;
            const destCol = newState.activeCell.col;
            const destRow = newState.activeCell.row;
            const colOffset = destCol - srcRange.startCol;
            const rowOffset = destRow - srcRange.startRow;

            newState = updateActiveSheetCells(newState, cells => {
                if (isCut) {
                    for (let r = srcRange.startRow; r <= srcRange.endRow; r++) {
                        for (let c = srcRange.startCol; c <= srcRange.endCol; c++) {
                            delete cells[cellKey(c, r)];
                        }
                    }
                }
                for (const [key, cell] of Object.entries(copiedCells)) {
                    const [colStr, rowStr] = key.split(',');
                    const srcCol = parseInt(colStr, 10);
                    const srcRow = parseInt(rowStr, 10);
                    const newCol = srcCol + colOffset;
                    const newRow = srcRow + rowOffset;
                    if (newCol >= 0 && newCol < TOTAL_COLUMNS && newRow >= 0 && newRow < TOTAL_ROWS) {
                        const destKey = cellKey(newCol, newRow);
                        if (cell.formula) {
                            const adjustedFormula = adjustFormulaReferences(cell.formula, colOffset, rowOffset);
                            cells[destKey] = { ...cell, formula: adjustedFormula };
                        } else {
                            cells[destKey] = { ...cell };
                        }
                    }
                }
                return cells;
            });

            const sheet = getActiveSheet(newState);
            newState = updateActiveSheetCells(newState, () => recalculateFormulas(sheet.cells, newState.workbook.sheets, newState.namedRanges));
            if (isCut) newState = { ...newState, clipboard: null };
            return newState;
        }

        case 'RESTORE_WORKBOOK': {
            // Ensure restored workbook has new fields
            const wb = action.workbook;
            const sheets = wb.sheets.map(s => ({
                ...s,
                conditionalRules: s.conditionalRules ?? [],
                frozenRows: s.frozenRows ?? 0,
                mergedRegions: s.mergedRegions ?? [],
                sortColumn: s.sortColumn ?? undefined,
                sortDirection: s.sortDirection ?? undefined,
                filters: s.filters ?? [],
                filterActive: s.filterActive ?? false,
            }));
            return {
                ...state,
                workbook: { ...wb, sheets },
                activeCell: { sheetId: wb.activeSheetId, col: 0, row: 0 },
                mode: 'VIEWING',
                editBuffer: '',
                selection: null,
                saveStatus: 'saved',
            };
        }

        case 'SET_SAVE_STATUS':
            return { ...state, saveStatus: action.status, lastSavedAt: action.status === 'saved' ? Date.now() : state.lastSavedAt };

        // ─── Stage 2: Sheet Management ──────────────────────────────
        case 'ADD_SHEET': {
            // Find the next available sheet number by checking existing names
            const existingNames = new Set(state.workbook.sheets.map(s => s.name));
            let count = 1;
            while (existingNames.has(`Sheet${count}`)) count++;
            const newSheet = createDefaultSheet(`Sheet${count}`);
            return {
                ...state,
                workbook: {
                    ...state.workbook,
                    sheets: [...state.workbook.sheets, newSheet],
                    activeSheetId: newSheet.id,
                },
                activeCell: { sheetId: newSheet.id, col: 0, row: 0 },
                mode: 'VIEWING',
                editBuffer: '',
                selection: null,
                undoStack: [],
                redoStack: [],
            };
        }

        case 'DELETE_SHEET': {
            if (state.workbook.sheets.length <= 1) return state; // Can't delete last sheet
            const remaining = state.workbook.sheets.filter(s => s.id !== action.sheetId);
            const newActiveId = action.sheetId === state.workbook.activeSheetId
                ? remaining[0].id
                : state.workbook.activeSheetId;
            return {
                ...state,
                workbook: { ...state.workbook, sheets: remaining, activeSheetId: newActiveId },
                activeCell: { sheetId: newActiveId, col: 0, row: 0 },
                mode: 'VIEWING',
                editBuffer: '',
                selection: null,
                undoStack: [],
                redoStack: [],
            };
        }

        case 'RENAME_SHEET': {
            const sheets = state.workbook.sheets.map(s =>
                s.id === action.sheetId ? { ...s, name: action.name || s.name } : s
            );
            return { ...state, workbook: { ...state.workbook, sheets } };
        }

        case 'SWITCH_SHEET': {
            if (action.sheetId === state.workbook.activeSheetId) return state;
            return {
                ...state,
                workbook: { ...state.workbook, activeSheetId: action.sheetId },
                activeCell: { sheetId: action.sheetId, col: 0, row: 0 },
                mode: 'VIEWING',
                editBuffer: '',
                selection: null,
                undoStack: [],
                redoStack: [],
            };
        }

        // ─── Stage 2: CSV Import ────────────────────────────────────
        case 'IMPORT_CSV': {
            let newState = pushUndo(state);
            const csvRows = parseCSV(action.csv);
            newState = updateActiveSheetCells(newState, cells => {
                // Clear existing cells
                const newCells: Record<string, Cell> = {};
                csvRows.forEach((row, ri) => {
                    row.forEach((val, ci) => {
                        if (ci < TOTAL_COLUMNS && ri < TOTAL_ROWS) {
                            const trimmed = val.trim();
                            if (trimmed !== '') {
                                const dataType = determineCellDataType(trimmed);
                                const value: string | number = dataType === 'number' ? Number(trimmed) : trimmed;
                                newCells[cellKey(ci, ri)] = { value, dataType };
                            }
                        }
                    });
                });
                return newCells;
            });
            const sheet = getActiveSheet(newState);
            return updateActiveSheetCells(newState, () => recalculateFormulas(sheet.cells, newState.workbook.sheets, newState.namedRanges));
        }

        // ─── Stage 2: Find & Replace ────────────────────────────────
        case 'TOGGLE_FIND_DIALOG':
            return {
                ...state,
                findReplace: state.findReplace.isOpen
                    ? { ...defaultFindReplace }
                    : { ...defaultFindReplace, isOpen: true },
            };

        case 'FIND_SET_SEARCH': {
            const sheet = getActiveSheet(state);
            const matches = computeMatches(sheet.cells, action.searchTerm);
            return {
                ...state,
                findReplace: {
                    ...state.findReplace,
                    searchTerm: action.searchTerm,
                    matches,
                    activeMatchIndex: matches.length > 0 ? 0 : -1,
                },
            };
        }

        case 'FIND_SET_REPLACE':
            return { ...state, findReplace: { ...state.findReplace, replaceTerm: action.replaceTerm } };

        case 'FIND_NEXT': {
            const fr = state.findReplace;
            if (fr.matches.length === 0) return state;
            const nextIdx = (fr.activeMatchIndex + 1) % fr.matches.length;
            const match = fr.matches[nextIdx];
            return {
                ...state,
                findReplace: { ...fr, activeMatchIndex: nextIdx },
                activeCell: { ...state.activeCell, col: match.col, row: match.row },
                selection: null,
            };
        }

        case 'FIND_PREV': {
            const fr = state.findReplace;
            if (fr.matches.length === 0) return state;
            const prevIdx = (fr.activeMatchIndex - 1 + fr.matches.length) % fr.matches.length;
            const match = fr.matches[prevIdx];
            return {
                ...state,
                findReplace: { ...fr, activeMatchIndex: prevIdx },
                activeCell: { ...state.activeCell, col: match.col, row: match.row },
                selection: null,
            };
        }

        case 'REPLACE_CURRENT': {
            const fr = state.findReplace;
            if (fr.activeMatchIndex < 0 || !fr.matches[fr.activeMatchIndex]) return state;
            let newState = pushUndo(state);
            const match = fr.matches[fr.activeMatchIndex];
            newState = updateActiveSheetCells(newState, cells => {
                const key = cellKey(match.col, match.row);
                const cell = cells[key];
                if (cell) {
                    const strVal = String(cell.value ?? '');
                    const newVal = strVal.replace(new RegExp(fr.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), fr.replaceTerm);
                    const dataType = determineCellDataType(newVal);
                    cells[key] = { ...cell, value: dataType === 'number' ? Number(newVal) : newVal, dataType };
                }
                return cells;
            });
            // Recompute matches
            const sheet = getActiveSheet(newState);
            const recalculated = recalculateFormulas(sheet.cells, newState.workbook.sheets, newState.namedRanges);
            newState = updateActiveSheetCells(newState, () => recalculated);
            const updatedSheet = getActiveSheet(newState);
            const newMatches = computeMatches(updatedSheet.cells, fr.searchTerm);
            const newIdx = Math.min(fr.activeMatchIndex, newMatches.length - 1);
            return {
                ...newState,
                findReplace: { ...fr, matches: newMatches, activeMatchIndex: newIdx >= 0 ? newIdx : -1 },
            };
        }

        case 'REPLACE_ALL': {
            const fr = state.findReplace;
            if (fr.matches.length === 0) return state;
            let newState = pushUndo(state);
            newState = updateActiveSheetCells(newState, cells => {
                for (const match of fr.matches) {
                    const key = cellKey(match.col, match.row);
                    const cell = cells[key];
                    if (cell) {
                        const strVal = String(cell.value ?? '');
                        const newVal = strVal.replace(new RegExp(fr.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), fr.replaceTerm);
                        const dataType = determineCellDataType(newVal);
                        cells[key] = { ...cell, value: dataType === 'number' ? Number(newVal) : newVal, dataType };
                    }
                }
                return cells;
            });
            const sheet = getActiveSheet(newState);
            const recalculated = recalculateFormulas(sheet.cells, newState.workbook.sheets, newState.namedRanges);
            newState = updateActiveSheetCells(newState, () => recalculated);
            return {
                ...newState,
                findReplace: { ...fr, matches: [], activeMatchIndex: -1 },
            };
        }

        // ─── Stage 2: Conditional Formatting ────────────────────────
        case 'TOGGLE_COND_FORMAT_DIALOG':
            return { ...state, showCondFormatDialog: !state.showCondFormatDialog };

        case 'ADD_CONDITIONAL_RULE': {
            return updateActiveSheet(state, sheet => ({
                ...sheet,
                conditionalRules: [...(sheet.conditionalRules || []), action.rule],
            }));
        }

        case 'DELETE_CONDITIONAL_RULE': {
            return updateActiveSheet(state, sheet => ({
                ...sheet,
                conditionalRules: (sheet.conditionalRules || []).filter(r => r.id !== action.ruleId),
            }));
        }

        // ─── Stage 2: Freeze Rows ──────────────────────────────────
        case 'TOGGLE_FREEZE_ROW': {
            const sheet = getActiveSheet(state);
            const currentFrozen = sheet.frozenRows || 0;
            const newFrozen = currentFrozen > 0 ? 0 : state.activeCell.row + 1;
            return updateActiveSheet(state, s => ({ ...s, frozenRows: newFrozen }));
        }

        // ─── Stage 4: Grid Power ────────────────────────────────────
        case 'INSERT_ROW': {
            let newState = pushUndo(state);
            const insertRow = action.position === 'above'
                ? state.activeCell.row
                : state.activeCell.row + 1;

            newState = updateActiveSheetCells(newState, cells => {
                const newCells: Record<string, Cell> = {};
                for (const [key, cell] of Object.entries(cells)) {
                    const [c, r] = key.split(',').map(Number);
                    if (r >= insertRow) {
                        newCells[cellKey(c, r + 1)] = cell.formula
                            ? { ...cell, formula: adjustFormulaReferences(cell.formula, 0, 1) }
                            : cell;
                    } else {
                        newCells[key] = cell;
                    }
                }
                return newCells;
            });
            const sheet = getActiveSheet(newState);
            return updateActiveSheetCells(newState, () => recalculateFormulas(sheet.cells, newState.workbook.sheets, newState.namedRanges));
        }

        case 'DELETE_ROW': {
            let newState = pushUndo(state);
            const deleteRow = state.activeCell.row;

            newState = updateActiveSheetCells(newState, cells => {
                const newCells: Record<string, Cell> = {};
                for (const [key, cell] of Object.entries(cells)) {
                    const [c, r] = key.split(',').map(Number);
                    if (r === deleteRow) continue; // skip deleted row
                    if (r > deleteRow) {
                        newCells[cellKey(c, r - 1)] = cell.formula
                            ? { ...cell, formula: adjustFormulaReferences(cell.formula, 0, -1) }
                            : cell;
                    } else {
                        newCells[key] = cell;
                    }
                }
                return newCells;
            });
            const sheet = getActiveSheet(newState);
            return updateActiveSheetCells(newState, () => recalculateFormulas(sheet.cells, newState.workbook.sheets, newState.namedRanges));
        }

        case 'INSERT_COL': {
            let newState = pushUndo(state);
            const insertCol = action.position === 'left'
                ? state.activeCell.col
                : state.activeCell.col + 1;

            newState = updateActiveSheetCells(newState, cells => {
                const newCells: Record<string, Cell> = {};
                for (const [key, cell] of Object.entries(cells)) {
                    const [c, r] = key.split(',').map(Number);
                    if (c >= insertCol) {
                        newCells[cellKey(c + 1, r)] = cell.formula
                            ? { ...cell, formula: adjustFormulaReferences(cell.formula, 1, 0) }
                            : cell;
                    } else {
                        newCells[key] = cell;
                    }
                }
                return newCells;
            });
            const sheet = getActiveSheet(newState);
            return updateActiveSheetCells(newState, () => recalculateFormulas(sheet.cells, newState.workbook.sheets, newState.namedRanges));
        }

        case 'DELETE_COL': {
            let newState = pushUndo(state);
            const deleteCol = state.activeCell.col;

            newState = updateActiveSheetCells(newState, cells => {
                const newCells: Record<string, Cell> = {};
                for (const [key, cell] of Object.entries(cells)) {
                    const [c, r] = key.split(',').map(Number);
                    if (c === deleteCol) continue;
                    if (c > deleteCol) {
                        newCells[cellKey(c - 1, r)] = cell.formula
                            ? { ...cell, formula: adjustFormulaReferences(cell.formula, -1, 0) }
                            : cell;
                    } else {
                        newCells[key] = cell;
                    }
                }
                return newCells;
            });
            const sheet = getActiveSheet(newState);
            return updateActiveSheetCells(newState, () => recalculateFormulas(sheet.cells, newState.workbook.sheets, newState.namedRanges));
        }

        case 'SORT_COLUMN': {
            let newState = pushUndo(state);
            const sheet = getActiveSheet(newState);
            const col = action.col;
            const dir = action.direction;

            // Collect rows that have data
            const rowIndices = new Set<number>();
            for (const key of Object.keys(sheet.cells)) {
                const r = parseInt(key.split(',')[1], 10);
                rowIndices.add(r);
            }
            const rows = Array.from(rowIndices).sort((a, b) => a - b);
            if (rows.length === 0) return state;

            // Skip row 0 (treat as header)
            const dataRows = rows.filter(r => r > 0);
            if (dataRows.length === 0) return state;

            // Build row data for sorting
            const rowData = dataRows.map(r => {
                const key = cellKey(col, r);
                const cell = sheet.cells[key];
                const val = cell ? (cell.value ?? '') : '';
                return { row: r, sortVal: val };
            });

            rowData.sort((a, b) => {
                const aVal = a.sortVal;
                const bVal = b.sortVal;
                const aNum = typeof aVal === 'number' ? aVal : parseFloat(String(aVal));
                const bNum = typeof bVal === 'number' ? bVal : parseFloat(String(bVal));

                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return dir === 'asc' ? aNum - bNum : bNum - aNum;
                }
                const cmp = String(aVal).localeCompare(String(bVal));
                return dir === 'asc' ? cmp : -cmp;
            });

            // Build new cells by remapping rows
            const oldRowOrder = dataRows;
            const newRowOrder = rowData.map(d => d.row);

            newState = updateActiveSheetCells(newState, cells => {
                const newCells: Record<string, Cell> = {};
                // Keep header row (row 0) and non-data rows
                for (const [key, cell] of Object.entries(cells)) {
                    const r = parseInt(key.split(',')[1], 10);
                    if (!dataRows.includes(r)) {
                        newCells[key] = cell;
                    }
                }
                // Remap data rows
                for (let i = 0; i < newRowOrder.length; i++) {
                    const srcRow = newRowOrder[i];
                    const destRow = oldRowOrder[i];
                    for (let c = 0; c < TOTAL_COLUMNS; c++) {
                        const srcKey = cellKey(c, srcRow);
                        if (cells[srcKey]) {
                            newCells[cellKey(c, destRow)] = cells[srcKey];
                        }
                    }
                }
                return newCells;
            });

            newState = updateActiveSheet(newState, s => ({
                ...s, sortColumn: col, sortDirection: dir,
            }));
            const updatedSheet = getActiveSheet(newState);
            return updateActiveSheetCells(newState, () => recalculateFormulas(updatedSheet.cells, newState.workbook.sheets, newState.namedRanges));
        }

        case 'MERGE_CELLS': {
            const sel = state.selection;
            if (!sel) return state;
            const norm = normalizeSelection(sel);
            // Must be more than one cell
            if (norm.startCol === norm.endCol && norm.startRow === norm.endRow) return state;

            let newState = pushUndo(state);
            const region = {
                startCol: norm.startCol, startRow: norm.startRow,
                endCol: norm.endCol, endRow: norm.endRow,
            };

            // Keep only the top-left cell value, clear the rest
            newState = updateActiveSheetCells(newState, cells => {
                for (let r = norm.startRow; r <= norm.endRow; r++) {
                    for (let c = norm.startCol; c <= norm.endCol; c++) {
                        if (r === norm.startRow && c === norm.startCol) continue;
                        delete cells[cellKey(c, r)];
                    }
                }
                return cells;
            });

            return updateActiveSheet(newState, s => ({
                ...s,
                mergedRegions: [...(s.mergedRegions || []), region],
            }));
        }

        case 'UNMERGE_CELLS': {
            const { col, row } = state.activeCell;
            return updateActiveSheet(state, s => ({
                ...s,
                mergedRegions: (s.mergedRegions || []).filter(
                    r => !(col >= r.startCol && col <= r.endCol && row >= r.startRow && row <= r.endRow)
                ),
            }));
        }

        case 'FILL_RANGE': {
            let newState = pushUndo(state);
            const { sourceCol, sourceRow, targetRange } = action;
            const norm = normalizeSelection(targetRange);
            const sheet = getActiveSheet(newState);
            const sourceKey = cellKey(sourceCol, sourceRow);
            const sourceCell = sheet.cells[sourceKey];
            if (!sourceCell) return state;

            const sourceVal = sourceCell.value;
            const isNumeric = typeof sourceVal === 'number';

            newState = updateActiveSheetCells(newState, cells => {
                let step = 0;
                for (let r = norm.startRow; r <= norm.endRow; r++) {
                    for (let c = norm.startCol; c <= norm.endCol; c++) {
                        if (c === sourceCol && r === sourceRow) { step++; continue; }
                        const key = cellKey(c, r);
                        if (isNumeric) {
                            // Numeric fill: increment by 1 for each step
                            cells[key] = {
                                value: (sourceVal as number) + step,
                                dataType: 'number',
                            };
                        } else if (sourceCell.formula) {
                            // Formula fill: adjust references
                            const colOff = c - sourceCol;
                            const rowOff = r - sourceRow;
                            const adjusted = adjustFormulaReferences(sourceCell.formula, colOff, rowOff);
                            cells[key] = {
                                ...sourceCell,
                                formula: adjusted,
                            };
                        } else {
                            // Copy value
                            cells[key] = { ...sourceCell };
                        }
                        step++;
                    }
                }
                return cells;
            });

            const updatedSheet = getActiveSheet(newState);
            return updateActiveSheetCells(newState, () => recalculateFormulas(updatedSheet.cells, newState.workbook.sheets, newState.namedRanges));
        }

        // ─── Stage 5: Data Intelligence ──────────────────────────────
        case 'TOGGLE_FILTER': {
            const sheet = getActiveSheet(state);
            const newActive = !sheet.filterActive;
            return updateActiveSheet(state, s => ({
                ...s,
                filterActive: newActive,
                filters: newActive ? (s.filters || []) : [], // clear filters when deactivating
            }));
        }

        case 'SET_COLUMN_FILTER': {
            return updateActiveSheet(state, s => {
                const filters = [...(s.filters || [])];
                const existing = filters.findIndex(f => f.column === action.col);
                const newFilter = { column: action.col, values: action.values, active: action.values.length > 0 };
                if (existing >= 0) {
                    filters[existing] = newFilter;
                } else {
                    filters.push(newFilter);
                }
                return { ...s, filters };
            });
        }

        case 'CLEAR_ALL_FILTERS': {
            return updateActiveSheet(state, s => ({
                ...s, filters: [], filterActive: false,
            }));
        }

        case 'SET_VALIDATION': {
            return updateActiveSheetCells(state, cells => {
                const key = cellKey(action.col, action.row);
                const existing = cells[key] || { value: null, dataType: 'empty' as const };
                cells[key] = { ...existing, validation: action.rule };
                return cells;
            });
        }

        case 'REMOVE_VALIDATION': {
            return updateActiveSheetCells(state, cells => {
                const key = cellKey(action.col, action.row);
                const existing = cells[key];
                if (existing) {
                    const { validation: _, ...rest } = existing;
                    cells[key] = rest as Cell;
                }
                return cells;
            });
        }

        case 'SET_COMMENT': {
            return updateActiveSheetCells(state, cells => {
                const key = cellKey(action.col, action.row);
                const existing = cells[key] || { value: null, dataType: 'empty' as const };
                cells[key] = {
                    ...existing,
                    comment: { text: action.text, author: action.author, timestamp: Date.now() },
                };
                return cells;
            });
        }

        case 'DELETE_COMMENT': {
            return updateActiveSheetCells(state, cells => {
                const key = cellKey(action.col, action.row);
                const existing = cells[key];
                if (existing) {
                    const { comment: _, ...rest } = existing;
                    cells[key] = rest as Cell;
                }
                return cells;
            });
        }

        // ─── Stage 6: Polish & Power ────────────────────────────────
        case 'ADD_NAMED_RANGE': {
            // Validate: name must start with letter/underscore, no spaces
            if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(action.name)) return state;
            // Can't duplicate
            if (state.namedRanges.some(nr => nr.name.toLowerCase() === action.name.toLowerCase())) return state;
            // Can't be a cell reference like A1, B2 etc.
            if (/^[A-Z]\d+$/i.test(action.name)) return state;
            return {
                ...state,
                namedRanges: [...state.namedRanges, { name: action.name, range: action.range, sheetId: action.sheetId }],
            };
        }

        case 'UPDATE_NAMED_RANGE': {
            return {
                ...state,
                namedRanges: state.namedRanges.map(nr =>
                    nr.name === action.name ? { ...nr, range: action.range, sheetId: action.sheetId } : nr
                ),
            };
        }

        case 'DELETE_NAMED_RANGE': {
            return {
                ...state,
                namedRanges: state.namedRanges.filter(nr => nr.name !== action.name),
            };
        }

        default:
            return state;
    }
}

// ─── Context ────────────────────────────────────────────────────────
interface SpreadsheetContextValue {
    state: SpreadsheetState;
    dispatch: React.Dispatch<SpreadsheetAction>;
}

const SpreadsheetContext = createContext<SpreadsheetContextValue | null>(null);

// ─── Auto-Save Hook ─────────────────────────────────────────────────
function useAutoSave(state: SpreadsheetState, dispatch: React.Dispatch<SpreadsheetAction>) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSerializedRef = useRef<string>('');

    const save = useCallback(() => {
        try {
            const data = JSON.stringify(state.workbook);
            if (data.length > 4.5 * 1024 * 1024) {
                console.warn('SheetForge: Data exceeds 4.5MB');
                dispatch({ type: 'SET_SAVE_STATUS', status: 'error' });
                return;
            }
            localStorage.setItem(LOCAL_STORAGE_KEY, data);
            lastSerializedRef.current = data;
            dispatch({ type: 'SET_SAVE_STATUS', status: 'saved' });
        } catch (e) {
            console.warn('SheetForge: Failed to save —', e);
            dispatch({ type: 'SET_SAVE_STATUS', status: 'error' });
        }
    }, [state.workbook, dispatch]);

    useEffect(() => {
        const currentData = JSON.stringify(state.workbook);
        if (currentData === lastSerializedRef.current) return;
        dispatch({ type: 'SET_SAVE_STATUS', status: 'saving' });
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(save, AUTO_SAVE_DELAY);
        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }, [state.workbook, save, dispatch]);
}

// ─── Provider ───────────────────────────────────────────────────────
export function SpreadsheetProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(spreadsheetReducer, null, createInitialState);
    const [mounted, setMounted] = React.useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) {
                const workbook = JSON.parse(saved) as Workbook;
                if (workbook && workbook.sheets && workbook.sheets.length > 0) {
                    dispatch({ type: 'RESTORE_WORKBOOK', workbook });
                }
            }
        } catch (e) {
            console.warn('SheetForge: Could not restore saved data —', e);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
        setMounted(true);
    }, []);

    useAutoSave(state, dispatch);

    // Defer rendering children until after client mount to prevent hydration
    // mismatches caused by random sheet IDs generated by createInitialState().
    if (!mounted) return null;

    return (
        <SpreadsheetContext.Provider value={{ state, dispatch }}>
            {children}
        </SpreadsheetContext.Provider>
    );
}

export function useSpreadsheet(): SpreadsheetContextValue {
    const ctx = useContext(SpreadsheetContext);
    if (!ctx) throw new Error('useSpreadsheet must be used within SpreadsheetProvider');
    return ctx;
}
