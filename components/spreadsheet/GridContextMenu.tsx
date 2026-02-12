'use client';

import React from 'react';
import { useSpreadsheet } from '@/state/spreadsheet-context';
import { cellKey, colIndexToLetter } from '@/types/spreadsheet';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Copy, Scissors, ClipboardPaste, Trash2, Bold } from 'lucide-react';
import { toast } from 'sonner';

export default function GridContextMenu({ children }: { children: React.ReactNode }) {
    const { state, dispatch } = useSpreadsheet();
    const sheet = state.workbook.sheets.find(s => s.id === state.workbook.activeSheetId)!;

    const handleCopy = () => {
        dispatch({ type: 'COPY' });
        toast('Copied to clipboard');
    };

    const handleCut = () => {
        dispatch({ type: 'COPY', isCut: true });
        toast('Cut to clipboard');
    };

    const handlePaste = () => {
        navigator.clipboard.readText().then(text => {
            if (text && !state.clipboard) {
                dispatch({ type: 'PASTE', externalText: text });
            } else {
                dispatch({ type: 'PASTE' });
            }
        }).catch(() => {
            dispatch({ type: 'PASTE' });
        });
    };

    const handleDelete = () => {
        dispatch({
            type: 'SET_CELL_VALUE',
            col: state.activeCell.col,
            row: state.activeCell.row,
            value: '',
        });
    };

    const handleToggleBold = () => {
        const key = cellKey(state.activeCell.col, state.activeCell.row);
        const cell = sheet.cells[key];
        dispatch({ type: 'SET_FORMAT', format: { bold: !(cell?.format?.bold) } });
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                {children}
            </ContextMenuTrigger>
            <ContextMenuContent className="w-56">
                <ContextMenuItem onClick={handleCopy}>
                    <Copy className="size-4" />
                    Copy
                    <ContextMenuShortcut>⌘C</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onClick={handleCut}>
                    <Scissors className="size-4" />
                    Cut
                    <ContextMenuShortcut>⌘X</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onClick={handlePaste}>
                    <ClipboardPaste className="size-4" />
                    Paste
                    <ContextMenuShortcut>⌘V</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={handleDelete}>
                    <Trash2 className="size-4" />
                    Delete
                    <ContextMenuShortcut>Del</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={handleToggleBold}>
                    <Bold className="size-4" />
                    Toggle Bold
                    <ContextMenuShortcut>⌘B</ContextMenuShortcut>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
