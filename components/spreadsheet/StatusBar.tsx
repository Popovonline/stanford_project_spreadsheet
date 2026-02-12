'use client';

import React, { useMemo } from 'react';
import { useSpreadsheet } from '@/state/spreadsheet-context';
import { cellKey, normalizeSelection } from '@/types/spreadsheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function StatusBar() {
    const { state } = useSpreadsheet();
    const sheet = state.workbook.sheets.find(s => s.id === state.workbook.activeSheetId)!;

    const aggregates = useMemo(() => {
        // Get the effective selection — either the explicit selection or just the active cell
        const sel = state.selection
            ? normalizeSelection(state.selection)
            : null;

        // Need at least 2 cells selected to show aggregates
        if (!sel) return null;
        const cellCount = (sel.endCol - sel.startCol + 1) * (sel.endRow - sel.startRow + 1);
        if (cellCount <= 1) return null;

        let count = 0;
        let sum = 0;
        let numericCount = 0;

        for (let r = sel.startRow; r <= sel.endRow; r++) {
            for (let c = sel.startCol; c <= sel.endCol; c++) {
                const cell = sheet.cells[cellKey(c, r)];
                if (cell && cell.value !== null && cell.value !== undefined) {
                    count++;
                    if (typeof cell.value === 'number') {
                        sum += cell.value;
                        numericCount++;
                    } else if (typeof cell.value === 'string') {
                        const num = parseFloat(cell.value);
                        if (!isNaN(num)) {
                            sum += num;
                            numericCount++;
                        }
                    }
                }
            }
        }

        const avg = numericCount > 0 ? Math.round((sum / numericCount) * 1000) / 1000 : 0;

        return { count: cellCount, sum: Math.round(sum * 1000) / 1000, avg, numericCount };
    }, [state.selection, sheet.cells]);

    return (
        <div className="sf-status-bar">
            {aggregates && aggregates.count > 1 ? (
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-normal">Count: {aggregates.count}</Badge>
                    {aggregates.numericCount > 0 && (
                        <>
                            <Separator orientation="vertical" className="h-3.5" />
                            <Badge variant="secondary" className="text-xs font-normal">Sum: {aggregates.sum}</Badge>
                            <Separator orientation="vertical" className="h-3.5" />
                            <Badge variant="secondary" className="text-xs font-normal">Avg: {aggregates.avg}</Badge>
                        </>
                    )}
                </div>
            ) : (
                <span className="text-xs text-muted-foreground">
                    Select multiple cells to see aggregates
                </span>
            )}
        </div>
    );
}
