'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useSpreadsheet } from '@/state/spreadsheet-context';
import {
    TOTAL_COLUMNS,
    TOTAL_ROWS,
    DEFAULT_COLUMN_WIDTH,
    DEFAULT_ROW_HEIGHT,
    MIN_COLUMN_WIDTH,
    MIN_ROW_HEIGHT,
    colIndexToLetter,
    cellKey,
    getCellDisplayValue,
    isCellInSelection,
    normalizeSelection,
    isCellError,
} from '@/types/spreadsheet';
import { extractReferences, formulaTooltip, isFormulaError } from '@/lib/formula-engine';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import FormulaAutocomplete from './FormulaAutocomplete';
import GridContextMenu from './GridContextMenu';
import type { Cell, ConditionalRule } from '@/types/spreadsheet';

// ─── Conditional Format Evaluator ───────────────────────────────────
function evaluateCondition(rule: ConditionalRule, cell: Cell | undefined): boolean {
    if (!cell || cell.value === null || cell.value === undefined) return false;
    const numVal = typeof cell.value === 'number' ? cell.value : parseFloat(String(cell.value));
    const threshold = parseFloat(rule.value1);

    switch (rule.condition) {
        case 'greater': return !isNaN(numVal) && numVal > threshold;
        case 'less': return !isNaN(numVal) && numVal < threshold;
        case 'equal': return String(cell.value) === rule.value1 || (!isNaN(numVal) && numVal === threshold);
        case 'not_equal': return String(cell.value) !== rule.value1 && (isNaN(numVal) || numVal !== threshold);
        case 'between': {
            const upper = parseFloat(rule.value2 || '0');
            return !isNaN(numVal) && numVal >= threshold && numVal <= upper;
        }
        case 'text_contains': return String(cell.value).toLowerCase().includes(rule.value1.toLowerCase());
        default: return false;
    }
}

// ─── Sparkline SVG ──────────────────────────────────────────────────
function SparklineSVG({ values }: { values: number[] }) {
    if (values.length < 2) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const w = 80;
    const h = 20;
    const points = values.map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 2) - 1;
        return `${x},${y}`;
    });
    const areaPoints = [...points, `${w},${h}`, `0,${h}`];
    return (
        <div className="sf-sparkline">
            <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
                <polygon className="sf-sparkline__area" points={areaPoints.join(' ')} />
                <polyline className="sf-sparkline__line" points={points.join(' ')} />
            </svg>
        </div>
    );
}

// ─── BarChart SVG (FR-603) ──────────────────────────────────────────
const BAR_COLORS_FALLBACK = ['#4285f4', '#ea4335', '#34a853', '#fbbc04', '#9334e6', '#e040fb', '#00bcd4', '#ff7043'];
function getChartColors(): string[] {
    if (typeof window === 'undefined') return BAR_COLORS_FALLBACK;
    const root = document.documentElement;
    const style = getComputedStyle(root);
    return BAR_COLORS_FALLBACK.map((fallback, i) => {
        const v = style.getPropertyValue(`--sf-chart-${i + 1}`).trim();
        return v || fallback;
    });
}
const BAR_COLORS = typeof window !== 'undefined' ? getChartColors() : BAR_COLORS_FALLBACK;
function BarChartSVG({ values }: { values: number[] }) {
    if (values.length === 0) return null;
    const max = Math.max(...values, 1);
    const w = 80;
    const h = 22;
    const barW = Math.max(2, (w - (values.length - 1) * 1) / values.length);
    return (
        <div className="sf-chart sf-chart--bar">
            <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
                {values.map((v, i) => {
                    const barH = (v / max) * (h - 2);
                    const x = i * (barW + 1);
                    return (
                        <rect
                            key={i}
                            x={x}
                            y={h - barH}
                            width={barW}
                            height={barH}
                            fill={BAR_COLORS[i % BAR_COLORS.length]}
                            rx={1}
                        />
                    );
                })}
            </svg>
        </div>
    );
}

// ─── PieChart SVG (FR-604) ──────────────────────────────────────────
function PieChartSVG({ values }: { values: number[] }) {
    if (values.length === 0) return null;
    const total = values.reduce((a, b) => a + b, 0) || 1;
    const r = 10;
    const cx = 11;
    const cy = 11;
    let cumAngle = -Math.PI / 2; // Start from top
    const slices = values.map((v, i) => {
        const angle = (v / total) * 2 * Math.PI;
        const x1 = cx + r * Math.cos(cumAngle);
        const y1 = cy + r * Math.sin(cumAngle);
        cumAngle += angle;
        const x2 = cx + r * Math.cos(cumAngle);
        const y2 = cy + r * Math.sin(cumAngle);
        const largeArc = angle > Math.PI ? 1 : 0;
        const d = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
        return <path key={i} d={d} fill={BAR_COLORS[i % BAR_COLORS.length]} />;
    });
    return (
        <div className="sf-chart sf-chart--pie">
            <svg viewBox="0 0 22 22">
                {slices}
            </svg>
        </div>
    );
}


// ─── SpreadsheetCell ────────────────────────────────────────────────
interface CellProps {
    col: number;
    row: number;
    isActive: boolean;
    isEditing: boolean;
    isSelected: boolean;
    isRangeHighlighted: boolean;
    rangeColor?: string;
    isTracePrecedent: boolean;
    traceColor?: string;
    width: number;
    height: number;
    selEdgeTop: boolean;
    selEdgeBottom: boolean;
    selEdgeLeft: boolean;
    selEdgeRight: boolean;
    isFindMatch?: boolean;
    isFindActive?: boolean;
    condFormat?: { backgroundColor?: string; fontColor?: string };
    sparklineValues?: number[];
    chartType?: 'bar' | 'pie';
    chartValues?: number[];
    cell: Cell | undefined;
    editBuffer: string;
    dispatch: React.Dispatch<any>;
    activeCellCol: number;
    activeCellRow: number;
    isFormulaEditing: boolean;
}

const SpreadsheetCell = React.memo(function SpreadsheetCell({
    col,
    row,
    isActive,
    isEditing,
    isSelected,
    isRangeHighlighted,
    rangeColor,
    isTracePrecedent,
    traceColor,
    width,
    height,
    selEdgeTop,
    selEdgeBottom,
    selEdgeLeft,
    selEdgeRight,
    isFindMatch,
    isFindActive,
    condFormat,
    sparklineValues,
    chartType,
    chartValues,
    cell,
    editBuffer,
    dispatch,
    activeCellCol,
    activeCellRow,
    isFormulaEditing,
}: CellProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const cellRef = useRef<HTMLTableCellElement>(null);

    const displayValue = getCellDisplayValue(cell);
    const isError = isCellError(cell);
    const hasFormula = !!cell?.formula;
    const tooltip = hasFormula ? formulaTooltip(cell!.formula!) : '';

    // Focus input when editing (also re-focus after point-and-click formula appends)
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            // Place cursor at end
            const len = inputRef.current.value.length;
            inputRef.current.setSelectionRange(len, len);
        }
    }, [isEditing, editBuffer || '']);

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (e.shiftKey && !isEditing) {
            // Extend selection
            dispatch({
                type: 'SET_SELECTION',
                range: {
                    startCol: activeCellCol,
                    startRow: activeCellRow,
                    endCol: col,
                    endRow: row,
                },
            });
        } else {
            dispatch({ type: 'SELECT_CELL', col, row });
        }
    }, [col, row, dispatch, isEditing, activeCellCol, activeCellRow]);

    const handleDoubleClick = useCallback(() => {
        dispatch({ type: 'START_EDITING' });
    }, [dispatch]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return; // Left click only
        if (isEditing) return;
        // During formula editing, let handleClick handle SELECT_CELL
        // to avoid dispatching twice (FR-116)
        if (isFormulaEditing) return;
        // When Shift is held, let handleClick create the selection range
        if (e.shiftKey) return;

        // Start selection drag
        dispatch({ type: 'SELECT_CELL', col, row });

        const handleMouseMove = (me: MouseEvent) => {
            // Find which cell we're over
            const target = document.elementFromPoint(me.clientX, me.clientY);
            if (!target) return;
            const td = target.closest('td[data-col][data-row]') as HTMLElement | null;
            if (!td) return;
            const endCol = parseInt(td.dataset.col!, 10);
            const endRow = parseInt(td.dataset.row!, 10);

            dispatch({
                type: 'SET_SELECTION',
                range: {
                    startCol: col,
                    startRow: row,
                    endCol,
                    endRow,
                },
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [col, row, dispatch, isEditing, isFormulaEditing]);

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            dispatch({ type: 'UPDATE_EDIT_BUFFER', value: e.target.value });
        },
        [dispatch]
    );

    const handleInputKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                dispatch({ type: 'COMMIT_EDIT' });
                dispatch({ type: 'NAVIGATE', direction: 'down' });
            } else if (e.key === 'Escape') {
                e.preventDefault();
                dispatch({ type: 'CANCEL_EDITING' });
            } else if (e.key === 'Tab') {
                e.preventDefault();
                dispatch({ type: 'COMMIT_EDIT' });
                dispatch({ type: 'TAB_NAVIGATE', shift: e.shiftKey });
            }
        },
        [dispatch]
    );

    // Determine text alignment based on data type
    const textAlign = cell?.dataType === 'number' || cell?.dataType === 'currency' ||
        cell?.dataType === 'percentage' || cell?.dataType === 'date'
        ? 'right' : 'left';

    // Build inline style from cell format
    // Note: width/height are NOT set here — table-layout:fixed derives column
    // widths from the <th> headers and row heights from the <tr> elements.
    const cellStyle: React.CSSProperties = {
        textAlign,
        ...(cell?.format?.bold ? { fontWeight: 700 } : {}),
        ...(cell?.format?.fontColor ? { color: cell.format.fontColor } : {}),
        ...(cell?.format?.backgroundColor ? { backgroundColor: cell.format.backgroundColor } : {}),
        ...(condFormat?.backgroundColor && !cell?.format?.backgroundColor ? { backgroundColor: condFormat.backgroundColor } : {}),
        ...(condFormat?.fontColor && !cell?.format?.fontColor ? { color: condFormat.fontColor } : {}),
        ...(isRangeHighlighted && rangeColor && !isSelected ? { outline: `2px solid ${rangeColor}`, outlineOffset: '-1px', zIndex: 2 } : {}),
        ...(isTracePrecedent && traceColor && !isSelected && !isRangeHighlighted ? { outline: `2px dashed ${traceColor}`, outlineOffset: '-1px', zIndex: 2 } : {}),
    };

    const errorId = isError ? `sf-error-${col}-${row}` : undefined;

    const cellClassName = cn(
        'sf-cell',
        isActive && 'sf-cell--active',
        isEditing && 'sf-cell--editing',
        isSelected && 'sf-cell--selected',
        isError && 'sf-cell--error',
        hasFormula && 'sf-cell--formula',
        isTracePrecedent && 'sf-cell--trace-precedent',
        selEdgeTop && 'sf-cell--sel-top',
        selEdgeBottom && 'sf-cell--sel-bottom',
        selEdgeLeft && 'sf-cell--sel-left',
        selEdgeRight && 'sf-cell--sel-right',
        isFindMatch && 'sf-cell--find-match',
        isFindActive && 'sf-cell--find-active',
    );

    return (
        <td
            ref={cellRef}
            className={cellClassName}
            style={cellStyle}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onMouseDown={handleMouseDown}
            data-col={col}
            data-row={row}
            role="gridcell"
            aria-selected={isActive}
            aria-readonly={!isEditing}
            aria-describedby={errorId}
            title={tooltip || undefined}
        >
            {isEditing ? (
                <Input
                    ref={inputRef}
                    className="sf-cell__input"
                    value={editBuffer}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    aria-label={`Edit cell ${colIndexToLetter(col)}${row + 1}`}
                />
            ) : sparklineValues ? (
                <SparklineSVG values={sparklineValues} />
            ) : chartValues && chartType === 'bar' ? (
                <BarChartSVG values={chartValues} />
            ) : chartValues && chartType === 'pie' ? (
                <PieChartSVG values={chartValues} />
            ) : (
                <span className="sf-cell__text">
                    {isError && <AlertTriangle className="inline-block size-3 mr-1 align-text-bottom" />}
                    {displayValue}
                </span>
            )}
            {isError && (
                <span id={errorId} className="sr-only">
                    Cell contains error: {displayValue}
                </span>
            )}
        </td>
    );
});

// ─── Column Resize Handle ───────────────────────────────────────────
function ColumnResizeHandle({ col }: { col: number }) {
    const { state, dispatch } = useSpreadsheet();
    const sheet = state.workbook.sheets.find(s => s.id === state.workbook.activeSheetId)!;

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const startX = e.clientX;
            const startWidth = sheet.columnWidths[col] || DEFAULT_COLUMN_WIDTH;

            const handleMove = (me: MouseEvent) => {
                const delta = me.clientX - startX;
                dispatch({ type: 'RESIZE_COLUMN', col, width: startWidth + delta });
            };

            const handleUp = () => {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
                document.body.style.cursor = '';
            };

            document.body.style.cursor = 'col-resize';
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);
        },
        [col, sheet.columnWidths, dispatch]
    );

    return (
        <div
            className="sf-resize-handle sf-resize-handle--col"
            onMouseDown={handleMouseDown}
            role="separator"
            aria-orientation="vertical"
            aria-label={`Resize column ${colIndexToLetter(col)}`}
        />
    );
}

// ─── Row Resize Handle ─────────────────────────────────────────────
function RowResizeHandle({ row }: { row: number }) {
    const { state, dispatch } = useSpreadsheet();
    const sheet = state.workbook.sheets.find(s => s.id === state.workbook.activeSheetId)!;

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const startY = e.clientY;
            const startHeight = sheet.rowHeights[row] || DEFAULT_ROW_HEIGHT;

            const handleMove = (me: MouseEvent) => {
                const delta = me.clientY - startY;
                dispatch({ type: 'RESIZE_ROW', row, height: startHeight + delta });
            };

            const handleUp = () => {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
                document.body.style.cursor = '';
            };

            document.body.style.cursor = 'row-resize';
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);
        },
        [row, sheet.rowHeights, dispatch]
    );

    return (
        <div
            className="sf-resize-handle sf-resize-handle--row"
            onMouseDown={handleMouseDown}
            role="separator"
            aria-orientation="horizontal"
            aria-label={`Resize row ${row + 1}`}
        />
    );
}

// ─── Main Grid Component ────────────────────────────────────────────
export default function Grid() {
    const { state, dispatch } = useSpreadsheet();
    const tableRef = useRef<HTMLTableElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const sheet = state.workbook.sheets.find(s => s.id === state.workbook.activeSheetId)!;
    const frozenRows = sheet.frozenRows || 0;
    const condRules = sheet.conditionalRules || [];

    // Range highlighting colors (for formula editing)
    const RANGE_COLORS = ['#4285f4', '#ea4335', '#34a853', '#fbbc04', '#9334e6', '#e040fb'];

    // Conditional formatting map
    const condFormatMap = useMemo(() => {
        const map = new Map<string, { backgroundColor?: string; fontColor?: string }>();
        for (const rule of condRules) {
            for (let r = rule.range.startRow; r <= rule.range.endRow; r++) {
                for (let c = rule.range.startCol; c <= rule.range.endCol; c++) {
                    const key = cellKey(c, r);
                    const cell = sheet.cells[key];
                    if (evaluateCondition(rule, cell)) {
                        map.set(key, rule.format);
                    }
                }
            }
        }
        return map;
    }, [condRules, sheet.cells]);

    // Sparkline detection
    const sparklineMap = useMemo(() => {
        const map = new Map<string, number[]>();
        for (const [key, cell] of Object.entries(sheet.cells)) {
            if (cell?.formula && /^=SPARKLINE\(/i.test(cell.formula)) {
                // Parse =SPARKLINE(A1:A10)
                const rangeMatch = cell.formula.match(/SPARKLINE\(([A-Z])(\d+):([A-Z])(\d+)\)/i);
                if (rangeMatch) {
                    const sc = rangeMatch[1].toUpperCase().charCodeAt(0) - 65;
                    const sr = parseInt(rangeMatch[2], 10) - 1;
                    const ec = rangeMatch[3].toUpperCase().charCodeAt(0) - 65;
                    const er = parseInt(rangeMatch[4], 10) - 1;
                    const values: number[] = [];
                    for (let r = sr; r <= er; r++) {
                        for (let c = sc; c <= ec; c++) {
                            const v = sheet.cells[cellKey(c, r)];
                            const num = v ? Number(v.value) : NaN;
                            if (!isNaN(num)) values.push(num);
                        }
                    }
                    if (values.length >= 2) map.set(key, values);
                }
            }
        }
        return map;
    }, [sheet.cells]);

    // Chart detection (FR-603, FR-604): BARCHART / PIECHART
    const chartMap = useMemo(() => {
        const map = new Map<string, { type: 'bar' | 'pie'; values: number[] }>();
        for (const [key, cell] of Object.entries(sheet.cells)) {
            if (!cell?.formula) continue;
            const chartMatch = cell.formula.match(/^=(BARCHART|PIECHART)\(([A-Z])(\d+):([A-Z])(\d+)\)/i);
            if (chartMatch) {
                const type = chartMatch[1].toUpperCase() === 'BARCHART' ? 'bar' as const : 'pie' as const;
                const sc = chartMatch[2].toUpperCase().charCodeAt(0) - 65;
                const sr = parseInt(chartMatch[3], 10) - 1;
                const ec = chartMatch[4].toUpperCase().charCodeAt(0) - 65;
                const er = parseInt(chartMatch[5], 10) - 1;
                const values: number[] = [];
                for (let r = sr; r <= er; r++) {
                    for (let c = sc; c <= ec; c++) {
                        const v = sheet.cells[cellKey(c, r)];
                        const num = v ? Number(v.value) : NaN;
                        if (!isNaN(num)) values.push(num);
                    }
                }
                if (values.length > 0) map.set(key, { type, values });
            }
        }
        return map;
    }, [sheet.cells]);

    // Find match set
    const findMatchSet = useMemo(() => {
        const set = new Set<string>();
        for (const m of state.findReplace.matches) {
            set.add(cellKey(m.col, m.row));
        }
        return set;
    }, [state.findReplace.matches]);

    const findActiveKey = useMemo(() => {
        const fr = state.findReplace;
        if (fr.activeMatchIndex >= 0 && fr.matches[fr.activeMatchIndex]) {
            const m = fr.matches[fr.activeMatchIndex];
            return cellKey(m.col, m.row);
        }
        return '';
    }, [state.findReplace]);

    // Compute which cells should be range-highlighted (only during active formula editing, like Excel)
    const rangeHighlightMap = useMemo(() => {
        const map = new Map<string, string>(); // key → color

        // Only highlight formula references when actively editing a formula (F2 / double-click)
        if (state.mode === 'EDITING' && state.editBuffer.startsWith('=')) {
            const refs = extractReferences(state.editBuffer);
            refs.forEach((ref) => {
                const color = RANGE_COLORS[ref.rangeIndex % RANGE_COLORS.length];
                map.set(cellKey(ref.col, ref.row), color);
            });
        }

        return map;
    }, [state.mode, state.editBuffer]);

    // Trace precedents: highlight referenced cells when VIEWING a formula cell
    const tracePrecedentMap = useMemo(() => {
        const map = new Map<string, string>(); // key → color
        if (state.mode !== 'EDITING') {
            const ck = cellKey(state.activeCell.col, state.activeCell.row);
            const cell = sheet.cells[ck];
            if (cell?.formula) {
                const refs = extractReferences(cell.formula.slice(1));
                refs.forEach((ref) => {
                    const color = RANGE_COLORS[ref.rangeIndex % RANGE_COLORS.length];
                    map.set(cellKey(ref.col, ref.row), color);
                });
            }
        }
        return map;
    }, [state.mode, state.activeCell.col, state.activeCell.row, sheet.cells, RANGE_COLORS]);

    // aria-live announcements for screen readers
    const [liveAnnouncement, setLiveAnnouncement] = useState('');
    useEffect(() => {
        const ref = colIndexToLetter(state.activeCell.col) + (state.activeCell.row + 1);
        const ck = cellKey(state.activeCell.col, state.activeCell.row);
        const cell = sheet.cells[ck];
        const val = cell ? getCellDisplayValue(cell) : '';
        const msg = val ? `Cell ${ref}: ${val}` : `Cell ${ref} selected`;
        setLiveAnnouncement(msg);
    }, [state.activeCell.col, state.activeCell.row, sheet.cells]);

    // Autocomplete state
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [autocompletePos, setAutocompletePos] = useState({ top: 0, left: 0 });

    // Stable ref to latest state for use in callbacks without recreating them
    const stateRef = useRef(state);
    stateRef.current = state;
    const sheetRef = useRef(sheet);
    sheetRef.current = sheet;

    // Show/hide autocomplete based on edit buffer
    useEffect(() => {
        if (state.mode === 'EDITING' && state.editBuffer.startsWith('=')) {
            const partial = state.editBuffer.slice(1);
            if (/[A-Za-z]+$/.test(partial) && !/\)/.test(partial)) {
                setShowAutocomplete(true);
                // Position near active cell
                const td = document.querySelector(
                    `td[data-col="${state.activeCell.col}"][data-row="${state.activeCell.row}"]`
                ) as HTMLElement | null;
                if (td) {
                    const rect = td.getBoundingClientRect();
                    const containerRect = containerRef.current?.getBoundingClientRect();
                    if (containerRect) {
                        setAutocompletePos({
                            top: rect.bottom - containerRect.top,
                            left: rect.left - containerRect.left,
                        });
                    }
                }
            } else {
                setShowAutocomplete(false);
            }
        } else {
            setShowAutocomplete(false);
        }
    }, [state.mode, state.editBuffer, state.activeCell.col, state.activeCell.row]);

    const handleAutocompleteSelect = useCallback(
        (funcName: string) => {
            // Replace the partial function name in the edit buffer
            const buffer = stateRef.current.editBuffer;
            const match = buffer.match(/([A-Za-z]+)$/);
            if (match) {
                const newBuffer = buffer.slice(0, buffer.length - match[1].length) + funcName + '(';
                dispatch({ type: 'UPDATE_EDIT_BUFFER', value: newBuffer });
            }
            setShowAutocomplete(false);
        },
        [dispatch]
    );

    // Global key handling — uses stateRef to avoid re-creating on every state change
    const showAutocompleteRef = useRef(showAutocomplete);
    showAutocompleteRef.current = showAutocomplete;

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            const s = stateRef.current;
            const currentSheet = sheetRef.current;
            // Ctrl/Cmd shortcuts (work in all modes)
            const isMod = e.metaKey || e.ctrlKey;

            if (isMod) {
                switch (e.key.toLowerCase()) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            dispatch({ type: 'REDO' });
                        } else {
                            dispatch({ type: 'UNDO' });
                        }
                        return;
                    case 'y':
                        e.preventDefault();
                        dispatch({ type: 'REDO' });
                        return;
                    case 'b':
                        e.preventDefault();
                        dispatch({ type: 'SET_FORMAT', format: { bold: !(currentSheet.cells[cellKey(s.activeCell.col, s.activeCell.row)]?.format?.bold) } });
                        return;
                    case 'c':
                        if (s.mode !== 'EDITING') {
                            e.preventDefault();
                            dispatch({ type: 'COPY' });
                            toast('Copied to clipboard');
                        }
                        return;
                    case 'x':
                        if (s.mode !== 'EDITING') {
                            e.preventDefault();
                            dispatch({ type: 'COPY', isCut: true });
                            toast('Cut to clipboard');
                        }
                        return;
                    case 'v':
                        if (s.mode !== 'EDITING') {
                            e.preventDefault();
                            // Prioritize internal clipboard (sync) over system clipboard (async)
                            if (stateRef.current.clipboard) {
                                dispatch({ type: 'PASTE' });
                            } else {
                                navigator.clipboard.readText().then(text => {
                                    if (text) {
                                        dispatch({ type: 'PASTE', externalText: text });
                                    }
                                }).catch(() => {
                                    // Clipboard API not available — no-op
                                });
                            }
                        }
                        return;
                }
            }

            // Autocomplete keyboard
            if (showAutocompleteRef.current && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Tab')) {
                // Let the autocomplete handle these
                return;
            }

            // Edit mode — most keys are handled by the input
            if (s.mode === 'EDITING') return;

            // Navigation keys
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    dispatch({ type: 'NAVIGATE', direction: 'up' });
                    return;
                case 'ArrowDown':
                    e.preventDefault();
                    dispatch({ type: 'NAVIGATE', direction: 'down' });
                    return;
                case 'ArrowLeft':
                    e.preventDefault();
                    dispatch({ type: 'NAVIGATE', direction: 'left' });
                    return;
                case 'ArrowRight':
                    e.preventDefault();
                    dispatch({ type: 'NAVIGATE', direction: 'right' });
                    return;
                case 'Tab':
                    e.preventDefault();
                    dispatch({ type: 'TAB_NAVIGATE', shift: e.shiftKey });
                    return;
                case 'Enter':
                    e.preventDefault();
                    dispatch({ type: 'START_EDITING' });
                    return;
                case 'F2':
                    e.preventDefault();
                    dispatch({ type: 'START_EDITING' });
                    return;
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    if (s.selection) {
                        // Clear all cells in selection range
                        const ns = normalizeSelection(s.selection);
                        for (let r = ns.startRow; r <= ns.endRow; r++) {
                            for (let c = ns.startCol; c <= ns.endCol; c++) {
                                dispatch({
                                    type: 'SET_CELL_VALUE',
                                    col: c,
                                    row: r,
                                    value: '',
                                });
                            }
                        }
                    } else {
                        dispatch({
                            type: 'SET_CELL_VALUE',
                            col: s.activeCell.col,
                            row: s.activeCell.row,
                            value: '',
                        });
                    }
                    return;
                case 'Escape':
                    if (s.selection) {
                        dispatch({ type: 'SET_SELECTION', range: null });
                    }
                    return;
                default:
                    // Start editing with the typed character (single printable)
                    if (e.key.length === 1 && !isMod) {
                        e.preventDefault();
                        dispatch({ type: 'START_EDITING', initialValue: e.key });
                    }
            }
        },
        [dispatch]
    );

    // Keep table focused
    useEffect(() => {
        if (state.mode !== 'EDITING') {
            tableRef.current?.focus();
        }
    }, [state.activeCell, state.mode]);

    // Column headers
    const colHeaders = useMemo(
        () => Array.from({ length: TOTAL_COLUMNS }, (_, i) => colIndexToLetter(i)),
        []
    );

    return (
        <GridContextMenu>
            <div className="sf-grid-container" ref={containerRef}>
                <div aria-live="polite" className="sr-only" role="status">
                    {liveAnnouncement}
                </div>
                <table
                    ref={tableRef}
                    className="sf-grid"
                    role="grid"
                    aria-label="Spreadsheet grid"
                    tabIndex={0}
                    onKeyDown={handleKeyDown}
                >
                    <thead>
                        <tr>
                            <th className="sf-corner-header" />
                            {colHeaders.map((letter, ci) => (
                                <th
                                    key={ci}
                                    className="sf-col-header"
                                    style={{ width: sheet.columnWidths[ci] || DEFAULT_COLUMN_WIDTH }}
                                >
                                    {letter}
                                    <ColumnResizeHandle col={ci} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: TOTAL_ROWS }, (_, ri) => {
                            const isFrozen = ri < frozenRows;
                            const isLastFrozen = ri === frozenRows - 1;
                            return (
                                <tr
                                    key={ri}
                                    className={isFrozen ? 'sf-row--frozen' : ''}
                                    style={{
                                        height: sheet.rowHeights[ri] || DEFAULT_ROW_HEIGHT,
                                        ...(isFrozen ? { top: Array.from({ length: ri }, (_, i) => sheet.rowHeights[i] || DEFAULT_ROW_HEIGHT).reduce((a, b) => a + b, 24) } : {}),
                                    }}
                                >
                                    <th className={`sf-row-header ${isLastFrozen ? 'sf-row-header--freeze-border' : ''}`}>
                                        {ri + 1}
                                        <RowResizeHandle row={ri} />
                                    </th>
                                    {colHeaders.map((_, ci) => {
                                        const ck = cellKey(ci, ri);
                                        const isActive = state.activeCell.col === ci && state.activeCell.row === ri;
                                        const isEditing = isActive && state.mode === 'EDITING';
                                        const isSelected = isCellInSelection(ci, ri, state.selection);
                                        const highlightInfo = rangeHighlightMap.get(ck);
                                        const traceInfo = tracePrecedentMap.get(ck);

                                        let selEdgeTop = false, selEdgeBottom = false, selEdgeLeft = false, selEdgeRight = false;
                                        if (isSelected && state.selection) {
                                            const ns = normalizeSelection(state.selection);
                                            selEdgeTop = ri === ns.startRow;
                                            selEdgeBottom = ri === ns.endRow;
                                            selEdgeLeft = ci === ns.startCol;
                                            selEdgeRight = ci === ns.endCol;
                                        }

                                        return (
                                            <SpreadsheetCell
                                                key={ck}
                                                col={ci}
                                                row={ri}
                                                isActive={isActive}
                                                isEditing={isEditing}
                                                isFormulaEditing={state.mode === 'EDITING' && state.editBuffer.startsWith('=')}
                                                isSelected={isSelected}
                                                isRangeHighlighted={!!highlightInfo}
                                                rangeColor={highlightInfo}
                                                isTracePrecedent={!!traceInfo}
                                                traceColor={traceInfo}
                                                width={sheet.columnWidths[ci] || DEFAULT_COLUMN_WIDTH}
                                                height={sheet.rowHeights[ri] || DEFAULT_ROW_HEIGHT}
                                                selEdgeTop={selEdgeTop}
                                                selEdgeBottom={selEdgeBottom}
                                                selEdgeLeft={selEdgeLeft}
                                                selEdgeRight={selEdgeRight}
                                                isFindMatch={findMatchSet.has(ck)}
                                                isFindActive={ck === findActiveKey}
                                                condFormat={condFormatMap.get(ck)}
                                                sparklineValues={sparklineMap.get(ck)}
                                                chartType={chartMap.get(ck)?.type}
                                                chartValues={chartMap.get(ck)?.values}
                                                cell={sheet.cells[ck]}
                                                editBuffer={isEditing ? state.editBuffer : ''}
                                                dispatch={dispatch}
                                                activeCellCol={state.activeCell.col}
                                                activeCellRow={state.activeCell.row}
                                            />
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {showAutocomplete && (
                    <FormulaAutocomplete
                        editBuffer={state.editBuffer}
                        onSelect={handleAutocompleteSelect}
                        position={autocompletePos}
                        namedRanges={state.namedRanges}
                    />
                )}
            </div>
        </GridContextMenu>
    );
}
