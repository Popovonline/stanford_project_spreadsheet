# SheetForge — Visual Design Specification (Stages 4–6)

> **Version:** 2.1.0 · **Date:** 2026-02-12 · **Design System:** Shadcn UI + `--sf-*` tokens
> **Follows:** [PRD.md](PRD.md) §4.1 FR-401→FR-607

---

## Design Principles

| Principle | How Applied |
|-----------|-------------|
| **Shadcn UI First** | All new components use Shadcn primitives: `Dialog`, `Popover`, `DropdownMenu`, `Select`, `Button`, `Badge`, `Tooltip` |
| **Dark Mode Native** | All mockups designed in dark theme (oklch tokens from `globals.css`); light mode via token swap only |
| **Indigo Accent** | Primary: `oklch(0.702 0.183 281)` — used for selection borders, active states, fill handles |
| **Minimal Chrome** | Components float above grid with shadow/glow; no heavy window decorations |
| **WCAG 2.1 AA** | Touch targets ≥ 44×44px hit area, contrast ratios ≥ 4.5:1 for text |

---

## Current UI Baseline

The existing SheetForge interface as captured:

<!-- Design mockup: Current SheetForge UI — dark theme with toolbar, grid, sheet tabs -->
> *Mockup: Dark theme UI showing SF logo toolbar, Name Box, undo/redo, formatting icons, Import/Export, search field, and formula bar above the grid. Indigo selection border on active cell, right-aligned numbers, sheet tabs at bottom.*

**Key design characteristics:**
- Dark background (`oklch(0.145 0 0)`) with subtle grid lines
- Toolbar: SF logo, Name Box, undo/redo, formatting icons, Import/Export, search, formula bar
- Grid: indigo selection border on active cell, right-aligned numbers
- Sheet tabs at bottom with `+` add button
- Status bar: muted text, aggregate hints

---

## Stage 4 — Grid Power

### 4.1 Context Menu (FR-411)

<!-- Design mockup: Context menu with keyboard shortcuts -->
> *Mockup: Right-click context menu with Insert Row Above/Below, Insert Column Left/Right, Delete Row/Column, Sort A→Z / Z→A, Add Comment — each with keyboard shortcut labels.*

| Property | Value |
|----------|-------|
| **Component** | Shadcn `DropdownMenu` (right-click trigger) |
| **Background** | `--popover` oklch(0.205 0 0) |
| **Border radius** | `--radius-md` (6px) |
| **Shadow** | `0 4px 16px oklch(0 0 0 / 40%)` |
| **Keyboard shortcuts** | Right-aligned, `--muted-foreground` color, Geist Mono font |
| **Destructive items** | `--destructive` oklch(0.704 0.191 22) red text |
| **Disabled items** | 40% opacity, no pointer cursor |
| **Separator** | 1px `--border` horizontal rule |

**Menu items:** Insert Row Above · Insert Row Below · ─ · Delete Row · ─ · Sort A→Z ↑ · Sort Z→A ↓ · ─ · Add Comment

---

### 4.2 Fill Handle & Drag-Fill (FR-407, FR-408)

<!-- Design mockup: Fill handle with drag preview and annotations -->
> *Mockup: Blue fill handle square (6×6px visible, 44×44px hit area) at bottom-right of selection, with drag preview tooltip showing pattern values and dashed outline over target cells.*

| Element | Specification |
|---------|---------------|
| **Fill handle** | 6×6px indigo square at bottom-right of selection |
| **Hit area** | 44×44px invisible touch target (WCAG) centered on handle |
| **Cursor** | `crosshair` on hover over hit area |
| **Drag preview** | Dashed indigo border on target range; light indigo fill `oklch(0.702 0.183 281 / 10%)` |
| **Preview tooltip** | Shadcn `Tooltip` pill showing next value; positioned near cursor |
| **Direction** | Supports all 4 directions (down, up, right, left) |

---

### 4.3 Merge & Sort (FR-404, FR-409, FR-410)

<!-- Design mockup: Cell merge and column sort features -->
> *Mockup: Merged cell spanning B2:D2 with centered title, sort indicator arrows in column headers (▲ for ascending), and Merge/Unmerge toggle button in toolbar.*

| Feature | UI Specification |
|---------|-----------------|
| **Merge button** | Toolbar toggle: "Merge Cells" / "Unmerge" — active state uses `--primary` background |
| **Merged cell** | Spans multiple rows/cols; content centered; indigo selection border on entire merged area |
| **Sort indicator** | Column header shows ↑ (ascending) or ↓ (descending) arrow appended to letter |
| **Sort toast** | Bottom notification: "Sorted by column B (A→Z)" with dismiss ✕ |
| **Sort algorithm** | Stable sort; numbers → text → empty (ascending); single undo step |

---

## Stage 5 — Data Intelligence

### 5.1 Filter Dropdown (FR-501, FR-502, FR-503)

<!-- Design mockup: Auto-filter with dropdown popover -->
> *Mockup: Filter dropdown anchored to column header ▼ arrow, showing text search input, Select All/Clear All buttons, and checkbox list of unique column values with scrollable container.*

| Element | Specification |
|---------|---------------|
| **Filter toggle** | Toolbar funnel icon: outline (inactive) → filled indigo (active) |
| **Column indicators** | ▼ arrows in each column header when filter mode is on |
| **FilterDropdown** | Shadcn `Popover` anchored below column header ▼ |
| **Search input** | Top of dropdown; magnifying glass icon; real-time filtering of checkbox list |
| **Checkbox list** | Scrollable; "Select All" at top; each unique value as checkbox item |
| **Action buttons** | "Clear" (outline) + "Apply" (primary) at bottom |
| **Status bar** | Shows "Showing X of Y rows" when filter active |
| **Hidden rows** | Row numbers skip (e.g., 1, 3, 4, 6) to indicate filtered rows |

---

### 5.2 Comments & Data Validation (FR-508, FR-509, FR-510, FR-511)

<!-- Design mockup: Comments popover and validation dropdown -->
> *Mockup: Orange triangle indicator in cell corner, comment popover with author/timestamp, edit/delete buttons. Adjacent: validation dropdown showing allowed list values with chevron icon.*

| Feature | UI Specification |
|---------|-----------------|
| **Comment indicator** | Small orange triangle (4×4px) in top-right corner of cell |
| **Comment popover** | Shadcn `Popover` on hover: comment text, timestamp (`muted-foreground`), edit ✏️ / delete 🗑 icons |
| **Comment trigger** | Right-click → "Add Comment" or `Ctrl+Shift+M` |
| **Validation chevron** | Small ▼ on right edge of cells with `list` validation |
| **Validation dropdown** | Shadcn `Select` popover with allowed values; optional color dots per value |
| **Validation error** | Red border + shake animation on cell; Sonner error toast at bottom |

---

### 5.3 Advanced Formulas & Autocomplete (FR-504, FR-512)

<!-- Design mockup: Formula autocomplete with IF/AND/OR and Named Ranges -->
> *Mockup: Formula bar showing `=SUM(Rev` with autocomplete dropdown listing matching functions (SUM, SUMIF) and named ranges (Revenue) with syntax hints.*

| Element | Specification |
|---------|---------------|
| **Formula bar** | Shows full formula with syntax coloring: functions in blue, strings in green, numbers in white |
| **Autocomplete** | Shadcn dark `Card` positioned below formula bar; max 6 items |
| **Function icon** | `ƒ` symbol in `--primary` color for functions |
| **Named range icon** | `📌` pin icon to distinguish from functions |
| **Highlighted item** | Slightly lighter background (`--accent`) on keyboard-selected item |
| **Signature hint** | Muted gray text showing `(condition, true, false)` parameter names |
| **New functions** | IF, AND, OR, NOT, VLOOKUP, COUNTIF, SUMIF, CONCATENATE, LEFT, RIGHT, LEN, ROUND, TRIM |

---

## Stage 6 — Polish & Power

### 6.1 Named Range Manager (FR-601, FR-602)

<!-- Design mockup: Named Range Manager dialog and Name Box dropdown -->
> *Mockup: Shadcn Dialog with table listing named ranges (Name, Range, Scope columns), Add/Edit/Delete buttons. Name Box shows dropdown of defined names on click.*

| Element | Specification |
|---------|---------------|
| **Dialog** | Shadcn `Dialog` — title "Named Range Manager", centered modal with backdrop dimming |
| **Table** | 4 columns: Name · Range · Sheet · Actions (edit ✏️ / delete 🗑 icon buttons) |
| **Add button** | Full-width `--primary` indigo button: "+ Add Named Range" |
| **Name Box** | Existing Name Box (top-left, shows "A1") gains dropdown showing all defined names |
| **Naming rules** | Regex: `/^[a-zA-Z_][a-zA-Z0-9_]{0,254}$/` — validated inline with error state |
| **Conflicts** | Names matching function names or cell references show error: "Name conflicts with built-in function" |

---

### 6.2 Mini Charts & Print Preview (FR-603, FR-604, FR-605, FR-606)

<!-- Design mockup: Mini charts (bar + pie) and print preview -->
> *Mockup: Cell containing inline SVG bar chart (6-color HSL palette) and adjacent cell with pie chart (7-segment max). Print preview shown in forced light mode with hidden toolbar/tabs.*

| Feature | Specification |
|---------|---------------|
| **BARCHART** | `=BARCHART(range)` — inline SVG horizontal bars; 6-color HSL palette; auto-sizes to cell |
| **PIECHART** | `=PIECHART(range)` — inline SVG pie; max 7 segments; remainder grouped as "Other" |
| **Chart colors** | HSL palette: `hsl(210,80%,60%)`, `hsl(160,70%,50%)`, `hsl(45,90%,55%)`, `hsl(340,75%,55%)`, `hsl(280,65%,60%)`, `hsl(120,60%,45%)` |
| **Hover tooltip** | Shadcn `Tooltip` showing value + percentage (e.g., "80 (31%)") |
| **Reactive updates** | Charts re-render when source range data changes |
| **Min-size fallback** | Below 30×20px cell, chart replaced with `[📊]` placeholder icon |
| **Print** | `window.print()` with `@media print` stylesheet: light bg forced, gridlines added, toolbar hidden |
| **Print header** | Sheet name top-left via `@page` CSS; page number bottom-center |

---

## Shadcn UI Component Mapping

| Feature | Shadcn Component | Stage |
|---------|-----------------|-------|
| Context Menu | `DropdownMenu` | 4 |
| Fill Preview Tooltip | `Tooltip` | 4 |
| Merge/Unmerge | `Button` (toggle variant) | 4 |
| Sort Toast | Sonner `toast` | 4 |
| Filter Dropdown | `Popover` + `Checkbox` + `Input` | 5 |
| Validation Dropdown | `Select` | 5 |
| Comment Popover | `Popover` | 5 |
| Formula Autocomplete | `Card` (floating) | 5 |
| Named Range Manager | `Dialog` + `Table` | 6 |
| Chart Tooltip | `Tooltip` | 6 |

---

## Color Tokens (Dark Mode)

```css
/* Core surfaces */
--background:        oklch(0.145 0 0);       /* Grid background */
--card:              oklch(0.205 0 0);       /* Popovers, dialogs */
--popover:           oklch(0.205 0 0);       /* Dropdowns, menus */

/* Accents */
--primary:           oklch(0.702 0.183 281); /* Indigo — selection, buttons */
--destructive:       oklch(0.704 0.191 22);  /* Red — delete, errors */
--muted-foreground:  oklch(0.708 0 0);       /* Shortcuts, timestamps */

/* Borders */
--border:            oklch(1 0 0 / 10%);     /* Grid lines, separators */
--ring:              oklch(0.702 0.183 281); /* Focus ring */

/* Charts (6-color HSL palette) */
--chart-1: hsl(210, 80%, 60%);  /* Blue */
--chart-2: hsl(160, 70%, 50%);  /* Teal */
--chart-3: hsl(45,  90%, 55%);  /* Amber */
--chart-4: hsl(340, 75%, 55%);  /* Pink */
--chart-5: hsl(280, 65%, 60%);  /* Purple */
--chart-6: hsl(120, 60%, 45%);  /* Green */
```
