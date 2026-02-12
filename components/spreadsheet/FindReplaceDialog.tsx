'use client';

import React, { useRef, useEffect } from 'react';
import { useSpreadsheet } from '@/state/spreadsheet-context';
import { ChevronUp, ChevronDown } from 'lucide-react';
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

export default function FindReplaceDialog() {
    const { state, dispatch } = useSpreadsheet();
    const { findReplace } = state;
    const searchRef = useRef<HTMLInputElement>(null);

    // Auto-focus the search input when dialog opens
    useEffect(() => {
        if (findReplace.isOpen && searchRef.current) {
            // Small delay to ensure the dialog animation completes
            const timer = setTimeout(() => searchRef.current?.focus(), 100);
            return () => clearTimeout(timer);
        }
    }, [findReplace.isOpen]);

    // Global Ctrl+F handler
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                dispatch({ type: 'TOGGLE_FIND_DIALOG' });
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [dispatch]);

    return (
        <Dialog
            open={findReplace.isOpen}
            onOpenChange={(open) => {
                if (!open) dispatch({ type: 'TOGGLE_FIND_DIALOG' });
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Find & Replace</DialogTitle>
                    <DialogDescription className="sr-only">
                        Search for text in the spreadsheet and optionally replace it
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="find-input">Find</Label>
                        <Input
                            id="find-input"
                            ref={searchRef}
                            placeholder="Find…"
                            value={findReplace.searchTerm}
                            onChange={e => dispatch({ type: 'FIND_SET_SEARCH', searchTerm: e.target.value })}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    dispatch({ type: e.shiftKey ? 'FIND_PREV' : 'FIND_NEXT' });
                                } else if (e.key === 'Escape') {
                                    dispatch({ type: 'TOGGLE_FIND_DIALOG' });
                                }
                            }}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="replace-input">Replace with</Label>
                        <Input
                            id="replace-input"
                            placeholder="Replace with…"
                            value={findReplace.replaceTerm}
                            onChange={e => dispatch({ type: 'FIND_SET_REPLACE', replaceTerm: e.target.value })}
                            onKeyDown={e => {
                                if (e.key === 'Escape') dispatch({ type: 'TOGGLE_FIND_DIALOG' });
                            }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                    <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => dispatch({ type: 'FIND_PREV' })}
                        aria-label="Previous match"
                        disabled={findReplace.matches.length === 0}
                    >
                        <ChevronUp className="size-3.5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => dispatch({ type: 'FIND_NEXT' })}
                        aria-label="Next match"
                        disabled={findReplace.matches.length === 0}
                    >
                        <ChevronDown className="size-3.5" />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => dispatch({ type: 'REPLACE_CURRENT' })}
                        disabled={findReplace.matches.length === 0}
                    >
                        Replace
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => dispatch({ type: 'REPLACE_ALL' })}
                        disabled={findReplace.matches.length === 0}
                    >
                        Replace All
                    </Button>

                    <span className="ml-auto text-sm text-muted-foreground">
                        {findReplace.matches.length > 0
                            ? `${findReplace.activeMatchIndex + 1} of ${findReplace.matches.length}`
                            : findReplace.searchTerm ? 'No matches' : ''}
                    </span>
                </div>
            </DialogContent>
        </Dialog>
    );
}
