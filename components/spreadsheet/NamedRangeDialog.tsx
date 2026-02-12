'use client';

import React, { useState } from 'react';
import { useSpreadsheet } from '@/state/spreadsheet-context';
import { Pencil, Trash2, Plus, Bookmark } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

// FR-601: Named range name validation regex
const NAMED_RANGE_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]{0,254}$/;
// Cell reference pattern to reject names that look like cell refs (e.g., "A1", "Z99")
const CELL_REF_PATTERN = /^[A-Za-z]{1,2}\d{1,3}$/;
// Function names that cannot be used as named range names
const RESERVED_NAMES = new Set([
    'SUM', 'AVERAGE', 'MIN', 'MAX', 'COUNT', 'IF', 'AND', 'OR', 'NOT',
    'VLOOKUP', 'COUNTIF', 'SUMIF', 'TRIM', 'CONCATENATE', 'LEFT', 'RIGHT',
    'LEN', 'ROUND', 'SPARKLINE', 'BARCHART', 'PIECHART',
]);

interface NamedRangeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function NamedRangeDialog({ open, onOpenChange }: NamedRangeDialogProps) {
    const { state, dispatch } = useSpreadsheet();
    const [newName, setNewName] = useState('');
    const [newRange, setNewRange] = useState('');
    const [editingName, setEditingName] = useState<string | null>(null);
    const [editRange, setEditRange] = useState('');
    const [editSheet, setEditSheet] = useState('');

    const activeSheet = state.workbook.sheets.find(s => s.id === state.workbook.activeSheetId);
    const activeSheetId = activeSheet?.id ?? '';

    function validateName(name: string): string | null {
        if (!NAMED_RANGE_REGEX.test(name)) {
            return 'Name must start with a letter or underscore and contain only letters, numbers, and underscores.';
        }
        if (CELL_REF_PATTERN.test(name)) {
            return 'Name cannot look like a cell reference (e.g., A1, B10).';
        }
        if (RESERVED_NAMES.has(name.toUpperCase())) {
            return `"${name}" is a reserved function name.`;
        }
        return null;
    }

    function handleAdd() {
        const trimmedName = newName.trim();
        const trimmedRange = newRange.trim().toUpperCase();

        if (!trimmedName || !trimmedRange) {
            toast.error('Please enter both a name and a range.');
            return;
        }

        const error = validateName(trimmedName);
        if (error) {
            toast.error(error);
            return;
        }

        // Check for duplicates
        if (state.namedRanges.some(nr => nr.name.toLowerCase() === trimmedName.toLowerCase())) {
            toast.error(`"${trimmedName}" already exists.`);
            return;
        }

        dispatch({
            type: 'ADD_NAMED_RANGE',
            name: trimmedName,
            range: trimmedRange,
            sheetId: activeSheetId,
        });
        toast.success(`Named range "${trimmedName}" added.`);
        setNewName('');
        setNewRange('');
    }

    function handleDelete(name: string) {
        dispatch({ type: 'DELETE_NAMED_RANGE', name });
        toast.success(`Named range "${name}" deleted.`);
    }

    function handleStartEdit(name: string) {
        const nr = state.namedRanges.find(n => n.name === name);
        if (!nr) return;
        setEditingName(name);
        setEditRange(nr.range);
        setEditSheet(nr.sheetId);
    }

    function handleSaveEdit(name: string) {
        const trimmedRange = editRange.trim().toUpperCase();
        if (!trimmedRange) {
            toast.error('Range cannot be empty.');
            return;
        }
        dispatch({
            type: 'UPDATE_NAMED_RANGE',
            name,
            range: trimmedRange,
            sheetId: editSheet || activeSheetId,
        });
        toast.success(`Named range "${name}" updated.`);
        setEditingName(null);
    }

    function getSheetName(sheetId: string): string {
        const sheet = state.workbook.sheets.find(s => s.id === sheetId);
        return sheet?.name ?? 'Unknown';
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bookmark className="h-5 w-5" />
                        Named Ranges
                    </DialogTitle>
                    <DialogDescription>
                        Define named ranges to use in formulas (e.g., =SUM(Revenue))
                    </DialogDescription>
                </DialogHeader>

                {/* Existing named ranges table */}
                {state.namedRanges.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Range</TableHead>
                                    <TableHead>Sheet</TableHead>
                                    <TableHead className="text-right w-20">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {state.namedRanges.map((nr) => (
                                    <TableRow key={nr.name}>
                                        <TableCell className="font-mono text-xs">{nr.name}</TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {editingName === nr.name ? (
                                                <Input
                                                    value={editRange}
                                                    onChange={(e) => setEditRange(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(nr.name)}
                                                    className="h-7 text-xs"
                                                    autoFocus
                                                />
                                            ) : (
                                                nr.range
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {getSheetName(nr.sheetId)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {editingName === nr.name ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-green-500 hover:text-green-400"
                                                        onClick={() => handleSaveEdit(nr.name)}
                                                        title="Save"
                                                    >
                                                        ✓
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => handleStartEdit(nr.name)}
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(nr.name)}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center text-sm text-muted-foreground py-6 border rounded-md">
                        No named ranges defined yet.
                    </div>
                )}

                {/* Add new range form */}
                <div className="space-y-3 pt-2">
                    <Label className="text-sm font-medium">Add New Range</Label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Name (e.g., Revenue)"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="flex-1"
                        />
                        <Input
                            placeholder="Range (e.g., A1:A10)"
                            value={newRange}
                            onChange={(e) => setNewRange(e.target.value)}
                            className="flex-1"
                        />
                        <Button onClick={handleAdd} size="sm" className="gap-1">
                            <Plus className="h-4 w-4" />
                            Add
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
