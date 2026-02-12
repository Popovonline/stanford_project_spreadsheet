'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSpreadsheet } from '@/state/spreadsheet-context';
import { cellKey, colIndexToLetter, normalizeSelection } from '@/types/spreadsheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Undo2, Redo2, Bold, FunctionSquare, Check, Loader2, AlertCircle, Sun, Moon, Upload, Download, Search, Palette, HelpCircle, Bookmark, Printer } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import ColorPicker from './ColorPicker';
import NamedRangeDialog from './NamedRangeDialog';

export default function Toolbar() {
    const { state, dispatch } = useSpreadsheet();
    const { theme, setTheme } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mounted, setMounted] = useState(false);
    const [namedRangeOpen, setNamedRangeOpen] = useState(false);
    const [importAlertOpen, setImportAlertOpen] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    useEffect(() => { setMounted(true); }, []);
    const sheet = state.workbook.sheets.find(s => s.id === state.workbook.activeSheetId)!;

    // Show range reference for multi-cell selection
    const cellRef = (() => {
        if (state.selection) {
            const ns = normalizeSelection(state.selection);
            const isMultiCell = ns.startCol !== ns.endCol || ns.startRow !== ns.endRow;
            if (isMultiCell) {
                return `${colIndexToLetter(ns.startCol)}${ns.startRow + 1}:${colIndexToLetter(ns.endCol)}${ns.endRow + 1}`;
            }
        }
        return `${colIndexToLetter(state.activeCell.col)}${state.activeCell.row + 1}`;
    })();

    const key = cellKey(state.activeCell.col, state.activeCell.row);
    const activeCell = sheet.cells[key];
    const isBold = activeCell?.format?.bold ?? false;

    // Formula bar: show edit buffer when editing, else formula or value
    const formulaBarValue =
        state.mode === 'EDITING'
            ? state.editBuffer
            : activeCell
                ? (activeCell.formula ?? String(activeCell.value ?? ''))
                : '';

    // Editable formula bar: start editing on focus, sync on change
    const handleFormulaBarFocus = () => {
        if (state.mode !== 'EDITING') {
            dispatch({ type: 'START_EDITING', initialValue: formulaBarValue });
        }
    };

    const handleFormulaBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch({ type: 'UPDATE_EDIT_BUFFER', value: e.target.value });
    };

    const handleFormulaBarKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            dispatch({ type: 'COMMIT_EDIT' });
        } else if (e.key === 'Escape') {
            e.preventDefault();
            dispatch({ type: 'CANCEL_EDITING' });
        }
    };

    // CSV Import
    const processImport = (file: File) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            if (text) {
                dispatch({ type: 'IMPORT_CSV', csv: text });
                toast.success('CSV imported successfully');
            }
        };
        reader.readAsText(file);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setPendingFile(file);
            setImportAlertOpen(true);
        } else {
            processImport(file);
        }
        e.target.value = '';
    };

    // CSV Export
    const handleExport = () => {
        const rows: string[] = [];
        const maxRow = 99;
        const maxCol = 25;
        // Find actual data range
        let lastRow = 0;
        let lastCol = 0;
        for (const k of Object.keys(sheet.cells)) {
            const [c, r] = k.split(',').map(Number);
            const cell = sheet.cells[k];
            if (cell && (cell.value !== null && cell.value !== undefined && cell.value !== '')) {
                lastRow = Math.max(lastRow, r);
                lastCol = Math.max(lastCol, c);
            }
        }
        for (let r = 0; r <= lastRow; r++) {
            const cols: string[] = [];
            for (let c = 0; c <= lastCol; c++) {
                const cell = sheet.cells[cellKey(c, r)];
                let val = '';
                if (cell) {
                    val = cell.displayValue ?? String(cell.value ?? '');
                }
                // Escape CSV
                if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                    val = '"' + val.replace(/"/g, '""') + '"';
                }
                cols.push(val);
            }
            rows.push(cols.join(','));
        }
        const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sheet.name || 'sheet'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${sheet.name || 'sheet'}.csv`);
    };

    return (
        <div className="sf-toolbar">
            <div className="sf-toolbar__left">
                {/* SF Monogram + Wordmark */}
                <div className="sf-toolbar__logo">
                    <div className="sf-toolbar__monogram">SF</div>
                    <span className="sf-toolbar__wordmark">SheetForge</span>
                </div>
                <Badge variant="secondary" className="sf-toolbar__cell-ref font-mono">{cellRef}</Badge>
            </div>

            <div className="sf-toolbar__controls">
                {/* Undo */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => dispatch({ type: 'UNDO' })}
                            disabled={state.undoStack.length === 0}
                            aria-label="Undo (Ctrl+Z)"
                        >
                            <Undo2 className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
                </Tooltip>

                {/* Redo */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => dispatch({ type: 'REDO' })}
                            disabled={state.redoStack.length === 0}
                            aria-label="Redo (Ctrl+Y)"
                        >
                            <Redo2 className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="mx-1 h-6" />

                {/* Bold */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={isBold ? 'secondary' : 'ghost'}
                            size="icon-sm"
                            onClick={() => dispatch({ type: 'SET_FORMAT', format: { bold: !isBold } })}
                            aria-label="Bold (Ctrl+B)"
                            aria-pressed={isBold}
                        >
                            <Bold className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Bold (Ctrl+B)</TooltipContent>
                </Tooltip>

                {/* Font Color */}
                <ColorPicker
                    currentColor={activeCell?.format?.fontColor}
                    onColorChange={color => dispatch({ type: 'SET_FORMAT', format: { fontColor: color || undefined } })}
                    label="Font color"
                    iconType="font"
                />

                {/* Background Color */}
                <ColorPicker
                    currentColor={activeCell?.format?.backgroundColor}
                    onColorChange={color => dispatch({ type: 'SET_FORMAT', format: { backgroundColor: color || undefined } })}
                    label="Background color"
                    iconType="fill"
                />

                <Separator orientation="vertical" className="mx-1 h-6" />

                {/* Conditional Formatting */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => dispatch({ type: 'TOGGLE_COND_FORMAT_DIALOG' })}
                            aria-label="Conditional formatting"
                        >
                            <Palette className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Conditional Formatting</TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="mx-1 h-6" />

                {/* CSV Import */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                            <Download className="size-3.5" /> Import
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.tsv,.txt"
                                onChange={handleImport}
                                style={{ display: 'none' }}
                            />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Import CSV</TooltipContent>
                </Tooltip>

                {/* CSV Export */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={handleExport}>
                            <Upload className="size-3.5" /> Export
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Export CSV</TooltipContent>
                </Tooltip>

                {/* Print / PDF (FR-606) */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => window.print()}
                            aria-label="Print or export PDF"
                        >
                            <Printer className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Print / Export PDF</TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="mx-1 h-6" />

                {/* Find & Replace */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => dispatch({ type: 'TOGGLE_FIND_DIALOG' })}
                            aria-label="Find & Replace (Ctrl+F)"
                        >
                            <Search className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Find & Replace (Ctrl+F)</TooltipContent>
                </Tooltip>

                {/* Named Ranges (FR-601/FR-602) */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setNamedRangeOpen(true)}
                            aria-label="Named ranges"
                        >
                            <Bookmark className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Named Ranges</TooltipContent>
                </Tooltip>
                <NamedRangeDialog open={namedRangeOpen} onOpenChange={setNamedRangeOpen} />
            </div>

            <div className="sf-toolbar__formula-bar">
                <FunctionSquare className="sf-toolbar__fx size-4" />
                <Input
                    className="sf-toolbar__formula-input h-7 rounded-sm border-0 bg-transparent shadow-none focus-visible:ring-1"
                    value={formulaBarValue}
                    onFocus={handleFormulaBarFocus}
                    onChange={handleFormulaBarChange}
                    onKeyDown={handleFormulaBarKeyDown}
                    aria-label="Formula bar"
                />
            </div>

            <div className="sf-toolbar__right">
                {state.saveStatus === 'saved' && (
                    <Badge variant="outline" className="sf-toolbar__save-status gap-1 text-green-600 border-green-200 dark:text-green-400 dark:border-green-800">
                        <Check className="size-3" /> Saved
                    </Badge>
                )}
                {state.saveStatus === 'saving' && (
                    <Badge variant="secondary" className="sf-toolbar__save-status gap-1">
                        <Loader2 className="size-3 animate-spin" /> Saving…
                    </Badge>
                )}
                {state.saveStatus === 'error' && (
                    <Badge variant="destructive" className="sf-toolbar__save-status gap-1">
                        <AlertCircle className="size-3" /> Save failed!
                    </Badge>
                )}

                {/* Help / Re-launch Tour (FR-304) */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => window.dispatchEvent(new Event('onboarding-relaunch'))}
                            aria-label="Restart onboarding tour"
                        >
                            <HelpCircle className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Restart Tour</TooltipContent>
                </Tooltip>

                {/* Dark Mode Toggle */}
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    aria-label="Toggle dark mode"
                >
                    {mounted && theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </Button>
            </div>

            {/* Large file import confirmation */}
            <AlertDialog open={importAlertOpen} onOpenChange={setImportAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Large File Warning</AlertDialogTitle>
                        <AlertDialogDescription>
                            This file is larger than 5 MB. Importing it may affect performance. Do you want to continue?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPendingFile(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            if (pendingFile) processImport(pendingFile);
                            setPendingFile(null);
                        }}>Continue Import</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
