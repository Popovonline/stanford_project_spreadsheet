'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from '@/components/ui/command';

// Supported formula functions with syntax hints & categories
const FORMULA_FUNCTIONS = [
    // Math
    { name: 'SUM', syntax: 'SUM(range)', description: 'Adds all values in range', category: 'Math' },
    { name: 'AVERAGE', syntax: 'AVERAGE(range)', description: 'Average of values in range', category: 'Math' },
    { name: 'MIN', syntax: 'MIN(range)', description: 'Minimum value in range', category: 'Math' },
    { name: 'MAX', syntax: 'MAX(range)', description: 'Maximum value in range', category: 'Math' },
    { name: 'COUNT', syntax: 'COUNT(range)', description: 'Count non-empty cells', category: 'Math' },
    { name: 'SUMIF', syntax: 'SUMIF(range, criterion)', description: 'Sum cells matching criterion', category: 'Math' },
    { name: 'COUNTIF', syntax: 'COUNTIF(range, criterion)', description: 'Count cells matching criterion', category: 'Math' },
    { name: 'ROUND', syntax: 'ROUND(number, digits)', description: 'Round to n decimal places', category: 'Math' },
    // Logical
    { name: 'IF', syntax: 'IF(cond, true, false)', description: 'Returns value based on condition', category: 'Logical' },
    { name: 'AND', syntax: 'AND(val1, val2, ...)', description: 'TRUE if all args are true', category: 'Logical' },
    { name: 'OR', syntax: 'OR(val1, val2, ...)', description: 'TRUE if any arg is true', category: 'Logical' },
    { name: 'NOT', syntax: 'NOT(value)', description: 'Reverses logical value', category: 'Logical' },
    // Lookup
    { name: 'VLOOKUP', syntax: 'VLOOKUP(key, range, col)', description: 'Vertical lookup in range', category: 'Lookup' },
    // Text
    { name: 'TRIM', syntax: 'TRIM(text)', description: 'Remove leading/trailing spaces', category: 'Text' },
    { name: 'CONCATENATE', syntax: 'CONCATENATE(a, b)', description: 'Join text strings', category: 'Text' },
    { name: 'LEFT', syntax: 'LEFT(text, n)', description: 'First n characters', category: 'Text' },
    { name: 'RIGHT', syntax: 'RIGHT(text, n)', description: 'Last n characters', category: 'Text' },
    { name: 'LEN', syntax: 'LEN(text)', description: 'Length of text string', category: 'Text' },
];

interface FormulaAutocompleteProps {
    editBuffer: string;
    onSelect: (funcName: string) => void;
    position: { top: number; left: number };
    namedRanges?: Array<{ name: string; range: string }>;
}

export default function FormulaAutocomplete({ editBuffer, onSelect, position, namedRanges = [] }: FormulaAutocompleteProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Extract the partial function name being typed after '='
    const partial = useMemo(() => {
        if (!editBuffer.startsWith('=')) return '';
        const afterEq = editBuffer.slice(1);
        // Get the last function-like token
        const match = afterEq.match(/([A-Za-z]+)$/);
        return match ? match[1].toUpperCase() : '';
    }, [editBuffer]);

    // Filter matching functions
    const matches = useMemo(() => {
        if (!partial) return [];
        const allSuggestions = [
            ...FORMULA_FUNCTIONS,
            ...namedRanges.map(nr => ({
                name: nr.name,
                syntax: nr.range,
                description: `Named range → ${nr.range}`,
                category: 'Named Ranges' as const,
            })),
        ];
        return allSuggestions.filter(f => f.name.toUpperCase().startsWith(partial));
    }, [partial, namedRanges]);

    // Group matches by category
    const grouped = useMemo(() => {
        const groups: Record<string, typeof matches> = {};
        for (const m of matches) {
            const cat = m.category || 'Other';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(m);
        }
        return groups;
    }, [matches]);

    // Reset selection when matches change
    useEffect(() => {
        setSelectedIndex(0);
    }, [matches.length]);

    // Don't show if no matches or exact match already typed
    if (matches.length === 0) return null;
    if (matches.length === 1 && matches[0].name === partial) return null;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, matches.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            onSelect(matches[selectedIndex].name);
        } else if (e.key === 'Escape') {
            // CC-110: Dismiss on Escape — handled by parent
        }
    };

    return (
        <Command
            className="sf-autocomplete border shadow-md"
            style={{ top: position.top, left: position.left }}
            onKeyDown={handleKeyDown}
            aria-label="Formula autocomplete"
            shouldFilter={false}
        >
            <CommandList>
                <CommandEmpty>No matching functions</CommandEmpty>
                {Object.entries(grouped).map(([category, items]) => (
                    <CommandGroup key={category} heading={category}>
                        {items.map((func) => {
                            const globalIdx = matches.indexOf(func);
                            return (
                                <CommandItem
                                    key={func.name}
                                    onSelect={() => onSelect(func.name)}
                                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                                    className={globalIdx === selectedIndex ? 'bg-accent' : ''}
                                    data-selected={globalIdx === selectedIndex}
                                >
                                    <span className="font-mono font-semibold text-sm">{func.name}</span>
                                    <span className="text-muted-foreground text-xs ml-2">{func.syntax}</span>
                                </CommandItem>
                            );
                        })}
                    </CommandGroup>
                ))}
            </CommandList>
        </Command>
    );
}

// Export for use in Grid
export { FORMULA_FUNCTIONS };
