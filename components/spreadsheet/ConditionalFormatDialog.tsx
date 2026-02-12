'use client';

import React, { useState } from 'react';
import { useSpreadsheet } from '@/state/spreadsheet-context';
import { type ConditionalRule, normalizeSelection } from '@/types/spreadsheet';
import { Plus, Trash2 } from 'lucide-react';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const CONDITIONS = [
    { value: 'greater', label: '>' },
    { value: 'less', label: '<' },
    { value: 'equal', label: '=' },
    { value: 'not_equal', label: '≠' },
    { value: 'between', label: 'Between' },
    { value: 'text_contains', label: 'Contains' },
] as const;

const PRESET_COLORS = [
    { bg: '#DCFCE7', fg: '#166534' }, // Green
    { bg: '#FEF9C3', fg: '#854D0E' }, // Yellow
    { bg: '#FEE2E2', fg: '#991B1B' }, // Red
    { bg: '#DBEAFE', fg: '#1E40AF' }, // Blue
    { bg: '#F3E8FF', fg: '#6B21A8' }, // Purple
];

export default function ConditionalFormatDialog() {
    const { state, dispatch } = useSpreadsheet();
    const sheet = state.workbook.sheets.find(s => s.id === state.workbook.activeSheetId)!;
    const rules = sheet.conditionalRules || [];

    const [condition, setCondition] = useState<ConditionalRule['condition']>('greater');
    const [value1, setValue1] = useState('');
    const [value2, setValue2] = useState('');
    const [presetIdx, setPresetIdx] = useState(0);

    const handleAdd = () => {
        if (!value1.trim()) return;
        const sel = state.selection
            ? normalizeSelection(state.selection)
            : { startCol: state.activeCell.col, startRow: state.activeCell.row, endCol: state.activeCell.col, endRow: state.activeCell.row };

        const rule: ConditionalRule = {
            id: Math.random().toString(36).substring(2, 10),
            range: sel,
            condition,
            value1: value1.trim(),
            value2: condition === 'between' ? value2.trim() : undefined,
            format: {
                backgroundColor: PRESET_COLORS[presetIdx].bg,
                fontColor: PRESET_COLORS[presetIdx].fg,
            },
        };
        dispatch({ type: 'ADD_CONDITIONAL_RULE', rule });
        setValue1('');
        setValue2('');
    };

    return (
        <Dialog
            open={state.showCondFormatDialog}
            onOpenChange={(open) => {
                if (!open) dispatch({ type: 'TOGGLE_COND_FORMAT_DIALOG' });
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Conditional Formatting</DialogTitle>
                    <DialogDescription className="sr-only">
                        Add rules to format cells based on their values
                    </DialogDescription>
                </DialogHeader>

                {/* Existing rules */}
                {rules.length > 0 && (
                    <div className="flex flex-col gap-2">
                        {rules.map(rule => (
                            <div key={rule.id} className="flex items-center gap-2 rounded-md border px-3 py-2">
                                <span className="text-xs text-muted-foreground">
                                    {CONDITIONS.find(c => c.value === rule.condition)?.label} {rule.value1}
                                    {rule.condition === 'between' ? ` – ${rule.value2}` : ''}
                                </span>
                                <div
                                    className="flex size-6 items-center justify-center rounded text-xs font-bold"
                                    style={{ backgroundColor: rule.format.backgroundColor, color: rule.format.fontColor }}
                                >
                                    A
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="ml-auto"
                                    onClick={() => dispatch({ type: 'DELETE_CONDITIONAL_RULE', ruleId: rule.id })}
                                    aria-label="Delete rule"
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add new rule */}
                <div className="flex flex-col gap-3 border-t pt-3">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="cond-condition" className="sr-only">Condition</Label>
                        <Select
                            value={condition}
                            onValueChange={v => setCondition(v as ConditionalRule['condition'])}
                        >
                            <SelectTrigger className="w-[120px]" id="cond-condition">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CONDITIONS.map(c => (
                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            placeholder="Value"
                            value={value1}
                            onChange={e => setValue1(e.target.value)}
                            className="flex-1"
                        />
                        {condition === 'between' && (
                            <Input
                                placeholder="To"
                                value={value2}
                                onChange={e => setValue2(e.target.value)}
                                className="flex-1"
                            />
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Style:</Label>
                        <ToggleGroup
                            type="single"
                            value={String(presetIdx)}
                            onValueChange={(v) => { if (v !== '') setPresetIdx(Number(v)); }}
                            spacing={1}
                        >
                            {PRESET_COLORS.map((color, i) => (
                                <ToggleGroupItem
                                    key={i}
                                    value={String(i)}
                                    className="flex size-7 items-center justify-center rounded text-xs font-bold p-0"
                                    style={{
                                        backgroundColor: color.bg,
                                        color: color.fg,
                                    }}
                                    aria-label={`Color preset ${i + 1}`}
                                >
                                    A
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </div>

                    <Button onClick={handleAdd} className="w-full">
                        <Plus className="size-3.5" /> Add Rule
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
