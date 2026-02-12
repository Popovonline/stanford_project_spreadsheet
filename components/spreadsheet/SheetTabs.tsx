'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSpreadsheet } from '@/state/spreadsheet-context';
import { X, Plus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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

export default function SheetTabs() {
    const { state, dispatch } = useSpreadsheet();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [deleteSheetId, setDeleteSheetId] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingId]);

    const handleDoubleClick = (sheetId: string, currentName: string) => {
        setEditingId(sheetId);
        setEditName(currentName);
    };

    const handleRenameCommit = (sheetId: string) => {
        const trimmed = editName.trim();
        if (trimmed) {
            dispatch({ type: 'RENAME_SHEET', sheetId, name: trimmed });
        }
        setEditingId(null);
        setEditName('');
    };

    const handleKeyDown = (e: React.KeyboardEvent, sheetId: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleRenameCommit(sheetId);
        } else if (e.key === 'Escape') {
            setEditingId(null);
            setEditName('');
        }
    };

    const sheetToDelete = state.workbook.sheets.find(s => s.id === deleteSheetId);

    return (
        <div className="sf-sheet-tabs">
            <Tabs
                value={state.workbook.activeSheetId}
                onValueChange={(sheetId) => dispatch({ type: 'SWITCH_SHEET', sheetId })}
            >
                <TabsList className="sf-sheet-tabs__list h-auto gap-0.5 rounded-none bg-transparent p-1">
                    {state.workbook.sheets.map(sheet => (
                        <TabsTrigger
                            key={sheet.id}
                            value={sheet.id}
                            className="sf-sheet-tab relative gap-1.5 rounded-md px-3 py-1.5 transition-colors"
                            onDoubleClick={() => handleDoubleClick(sheet.id, sheet.name)}
                        >
                            {editingId === sheet.id ? (
                                <Input
                                    ref={inputRef}
                                    className="sf-sheet-tab__name h-6 w-24 px-1 py-0 text-xs"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    onBlur={() => handleRenameCommit(sheet.id)}
                                    onKeyDown={e => handleKeyDown(e, sheet.id)}
                                    onClick={e => e.stopPropagation()}
                                />
                            ) : (
                                <span className="sf-sheet-tab__name">{sheet.name}</span>
                            )}
                            {state.workbook.sheets.length > 1 && (
                                <span
                                    role="button"
                                    tabIndex={-1}
                                    className="sf-sheet-tab__delete inline-flex size-4 items-center justify-center rounded-sm p-0 opacity-50 hover:opacity-100"
                                    onClick={e => {
                                        e.stopPropagation();
                                        setDeleteSheetId(sheet.id);
                                    }}
                                    aria-label={`Delete ${sheet.name}`}
                                >
                                    <X className="size-3" />
                                </span>
                            )}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
            <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => dispatch({ type: 'ADD_SHEET' })}
                aria-label="Add sheet"
            >
                <Plus className="size-4" />
            </Button>

            {/* AlertDialog moved outside TabsTrigger to avoid button-in-button nesting */}
            <AlertDialog open={deleteSheetId !== null} onOpenChange={(open) => { if (!open) setDeleteSheetId(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Sheet</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &ldquo;{sheetToDelete?.name}&rdquo;? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={() => {
                                if (deleteSheetId) {
                                    dispatch({ type: 'DELETE_SHEET', sheetId: deleteSheetId });
                                }
                                setDeleteSheetId(null);
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
