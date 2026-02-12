'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Type, Paintbrush } from 'lucide-react';

interface ColorPickerProps {
    currentColor?: string;
    onColorChange: (color: string) => void;
    label: string;
    iconType: 'font' | 'fill';
}

const CURATED_COLORS = [
    // Row 1: Neutrals
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
    // Row 2: Bold colors
    '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
    // Row 3: Soft colors
    '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
];

export default function ColorPicker({ currentColor, onColorChange, label, iconType }: ColorPickerProps) {
    const Icon = iconType === 'font' ? Type : Paintbrush;

    return (
        <Popover>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={label}
                            className="relative"
                            style={currentColor ? { borderBottom: `3px solid ${currentColor}` } : undefined}
                        >
                            <Icon
                                className="size-4"
                                style={iconType === 'font' && currentColor ? { color: currentColor } : undefined}
                            />
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-auto p-3" align="start">
                <ToggleGroup
                    type="single"
                    value={currentColor ?? ''}
                    onValueChange={(value) => { if (value !== undefined) onColorChange(value); }}
                    className="sf-color-picker__grid"
                >
                    {CURATED_COLORS.map(color => (
                        <ToggleGroupItem
                            key={color}
                            value={color}
                            className="sf-color-picker__swatch size-6 rounded-md border border-border p-0 data-[state=on]:ring-2 data-[state=on]:ring-primary"
                            style={{ backgroundColor: color }}
                            aria-label={`Color ${color}`}
                            title={color}
                        />
                    ))}
                </ToggleGroup>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => onColorChange('')}
                >
                    Clear
                </Button>
            </PopoverContent>
        </Popover>
    );
}
