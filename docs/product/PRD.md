# Product Requirements Document (PRD)

## Document Control

| Field | Value |
|-------|-------|
| **Product Name** | SheetForge |
| **Subtitle** | AI-Built Spreadsheet Clone |
| **Version** | 2.1.0 |
| **Author** | Product Manager Agent (01-product-manager) |
| **Last Updated** | 2026-02-12 |
| **Status** | Approved — All stages audit-complete (Stages 0–6) |
| **Assignment** | Stanford TECH 42: Vibe Coding — Assignment 2: The Clone |
| **Platform** | Google Antigravity IDE (Web) |

### Agent Review Chain

| Role | Contribution | Status |
|------|-------------|--------|
| Business Analyst | JTBD, personas, corner-case discovery | ✅ |
| Product Manager | PRD authorship, RICE, Kano, roadmap | ✅ |
| UX/UI Designer | Design constraints, heuristics | ✅ |
| Technical Architect | IDE constraints, architecture decisions | ✅ |
| QA Engineer | Per-phase testing plan | ✅ |
| Documentation Evaluator | 5-dimension quality scoring | ✅ |
| Systems Auditor | Cross-document consistency | ✅ |

---

## 1. Executive Summary

### 1.1 Purpose

SheetForge is a web-based spreadsheet application built entirely through AI-assisted development using Google Antigravity IDE. The product replicates core spreadsheet functionality — editable grids, formula evaluation, formatting, and multi-sheet management — as a vehicle for learning effective AI-pair-programming techniques. This PRD defines the complete feature set across three implementation stages, ensuring strategic sequencing of features from simplest (grid) to most complex (cross-sheet references, CSV import/export).

### 1.2 Objectives & Key Results (OKRs)

**Objective:** Deliver a functional, polished spreadsheet that demonstrates mastery of AI-assisted development.

| Key Result | Baseline | Target | Measurement Method |
|------------|----------|--------|-------------------|
| KR1: Core grid renders and accepts input | 0 | 100% pass rate on 10 smoke tests | Manual QA |
| KR2: ≥ 5 working formulas (SUM, AVERAGE, MIN, MAX, COUNT) | 0 | 5 formulas | Unit tests per formula |
| KR3: Assignment submission complete with Loom video | 0 | 1 submission | Canvas LMS |
| KR4: All Stage 0 + Stage 1 features functional | 0 | 100% | Feature checklist |
| KR5: All Stage 4 features pass acceptance criteria (insert/delete, sort, fill, merge) | 0 | 100% | Automated test suite |
| KR6: ≥ 6 advanced formulas functional (IF, VLOOKUP, COUNTIF, SUMIF, AND, OR) | 0 | 6 formulas | Unit tests per formula |
| KR7: Named ranges usable in formulas with autocomplete | 0 | ≥ 1 named range in demo | E2E test |

---

## 2. Jobs to Be Done (JTBD)

> **Standard:** 3-5 JTBD per user type (AIPMM / PM Agent Mandatory Output).  
> **Formula:** When [situation], I want to [job], so that I can [outcome], and feel [emotion], without [pain].  
> **Scoring Methodology:** Importance and Satisfaction scores in §2.5 are expert-estimated by the Product Manager Agent based on competitive gap analysis (vs. Google Sheets baseline) and assignment context. They are not based on primary user research.

### 2.1 Job Performers

| Segment | Description | Priority |
|---------|-------------|----------|
| **Student Builder** | CS student building the app as an assignment. Needs clear structure to implement features incrementally. | Primary |
| **End User (Classmate)** | Fellow student evaluating the spreadsheet. Expects familiar spreadsheet UX patterns. | Primary |
| **Instructor / Reviewer** | Faculty reviewing the submission. Evaluates feature depth and code quality. | Secondary |

### 2.2 Student Builder JTBD (4 Jobs)

#### JTBD-SB1: Functional

```
When I'm starting Assignment 2 with a blank IDE,
I want to scaffold the grid and navigation from a clear specification,
so that I can make incremental progress without rework,
and feel in control of the project scope,
without wasting hours debugging AI-generated boilerplate.
```

#### JTBD-SB2: Functional

```
When my formula engine breaks after adding a formatting feature,
I want to isolate the formula module from other feature code,
so that I can fix bugs in one area without cascading regressions,
and feel confident each feature stands on its own,
without starting over from scratch.
```

#### JTBD-SB3: Emotional

```
When I'm 3 hours into development and features keep conflicting,
I want to trust that my phased architecture will hold together,
so that I can push through the remaining features calmly,
and feel confident rather than panicked,
without abandoning stretch goals to play it safe.
```

#### JTBD-SB4: Social

```
When I present my Loom video in class show-and-tell,
I want to demonstrate professional-grade planning and depth,
so that I can be recognized for rigorous engineering,
and feel proud of my submission,
without being seen as someone who just got lucky with AI output.
```

### 2.3 End User / Classmate JTBD (4 Jobs)

#### JTBD-EU1: Functional

```
When I open a classmate's spreadsheet for the first time,
I want to enter data into cells without reading any instructions,
so that I can start working immediately like in Google Sheets,
and feel that the interface is intuitive and familiar,
without hunting for hidden controls or non-standard UX patterns.
```

#### JTBD-EU2: Functional

```
When I need to compute a total from a column of numbers,
I want to type a formula and see the result instantly,
so that I can trust the calculation without manual checking,
and feel that the tool is reliable for real data work,
without worrying about silent errors or wrong results.
```

#### JTBD-EU3: Emotional

```
When I'm evaluating a classmate's project for peer review,
I want the app to respond smoothly and never glitch,
so that I can judge the work fairly based on features,
and feel respectful of their effort,
without frustration from lag, crashes, or broken UI.
```

#### JTBD-EU4: Avoidance

```
When I accidentally close the browser tab during testing,
I want my data to survive without manual save actions,
so that I can resume exactly where I left off,
and feel safe experimenting,
without the anxiety of losing all entered data.
```

### 2.4 Instructor / Reviewer JTBD (3 Jobs)

#### JTBD-IR1: Functional

```
When I'm grading 30+ spreadsheet submissions in a row,
I want to quickly identify the depth and complexity of features,
so that I can assign fair, consistent grades efficiently,
and feel confident in my evaluation process,
without spending more than 5 minutes per submission.
```

#### JTBD-IR2: Functional

```
When I'm watching a student's Loom demo video,
I want to see edge cases handled gracefully on screen,
so that I can assess the student's planning rigor and AI collaboration quality,
and feel the assignment achieved its learning objectives,
without having to run the code myself to discover issues.
```

#### JTBD-IR3: Social

```
When I share exceptional submissions as class examples,
I want the work to represent high standards of AI-assisted development,
so that I can inspire other students and validate the curriculum,
and feel that the assignment elevates the program's reputation,
without caveats about the quality being "just AI-generated."
```

### 2.5 Desired Outcomes (Per-Persona)

#### Student Builder Outcomes

| Outcome | JTBD Ref | Importance | Satisfaction | Opportunity Score |
|---------|----------|:--:|:--:|:--:|
| Minimize rework from unclear specifications | SB1 | 10 | 3 | 17 🟢 |
| Minimize regression bugs between features | SB2 | 9 | 3 | 15 🟢 |
| Reduce panic during time-pressured development | SB3 | 8 | 3 | 13 🟢 |
| Maximize perceived quality in class demo | SB4 | 8 | 4 | 12 🟡 |

#### End User / Classmate Outcomes

| Outcome | JTBD Ref | Importance | Satisfaction | Opportunity Score |
|---------|----------|:--:|:--:|:--:|
| Minimize time to enter and organize data in cells | EU1 | 10 | 3 | 17 🟢 |
| Minimize effort to compute derived values (formulas) | EU2 | 9 | 3 | 15 🟢 |
| Minimize frustration during peer evaluation | EU3 | 9 | 4 | 14 🟢 |
| Reduce likelihood of losing data during edits | EU4 | 8 | 2 | 14 🟢 |

#### Instructor / Reviewer Outcomes

| Outcome | JTBD Ref | Importance | Satisfaction | Opportunity Score |
|---------|----------|:--:|:--:|:--:|
| Minimize grading time per submission | IR1 | 9 | 4 | 14 🟢 |
| Maximize confidence in edge-case coverage | IR2 | 8 | 3 | 13 🟢 |
| Increase shareability of exemplary work | IR3 | 7 | 4 | 10 🟡 |

### 2.6 Emotional & Social Jobs Summary

| Persona | Personal (Emotional) | Social |
|---------|---------------------|--------|
| **Student Builder** | "I want to feel confident my phased architecture works under deadline pressure." (SB3) | "I want to be recognized for depth and planning, not just feature count." (SB4) |
| **End User** | "I want to feel safe experimenting without fear of data loss." (EU4) | "I want to evaluate fairly without frustration biasing my judgment." (EU3) |
| **Instructor** | "I want to feel the assignment achieved its learning objectives." (IR2) | "I want to showcase work that elevates the program's reputation." (IR3) |

---

## 3. User Stories

### 3.1 Epics

| Epic | Stage | Description |
|------|-------|-------------|
| E-01 | MVP | Core Grid Experience |
| E-02 | Stage 1 | Formula Engine & Formatting |
| E-03 | Stage 2 | Advanced Features & Data Portability |
| E-04 | Stage 3 | Guided Onboarding & Feature Discovery |
| E-05 | Stage 4 | Grid Power — Insert/Delete, Sorting, Fill, Merge |
| E-06 | Stage 5 | Data Intelligence — Filtering, Advanced Formulas, Validation, Comments |
| E-07 | Stage 6 | Polish & Power — Named Ranges, Mini Charts, Print/PDF |

### 3.2 User Stories by Stage

#### MVP (Stage 0) — Minimum Viable

| ID | User Story | Priority | Points |
|----|-----------|----------|--------|
| US-001 | As a user, I want to see a grid of cells so that I have a visual workspace for data entry | Must | S |
| US-002 | As a user, I want to click on a cell to select it so that I know which cell I'm editing | Must | S |
| US-003 | As a user, I want to type text or numbers into a selected cell so that I can enter data | Must | S |
| US-004 | As a user, I want to press Tab to move to the next cell and Enter to move down so that I can navigate efficiently | Must | S |
| US-005 | As a user, I want to use arrow keys to move between cells so that I can navigate without a mouse | Must | S |
| US-006 | As a user, I want to see row numbers and column letters so that I can identify cell positions | Must | S |
| US-007 | As a user, I want to press Escape to cancel an edit so that I can revert mistakes | Must | S |
| US-008 | As a user, I want cells to auto-size vertically if text wraps so that content is always visible | Should | M |

#### Stage 1 — Stretch Goals

| ID | User Story | Priority | Points |
|----|-----------|----------|--------|
| US-101 | As a user, I want to type `=SUM(A1:A5)` and see the computed result so that I can aggregate data | Must | L |
| US-102 | As a user, I want to type `=AVERAGE(B1:B10)` to compute the mean so that I can analyze trends | Must | M |
| US-103 | As a user, I want to drag a column border to resize it so that I can fit content | Should | M |
| US-104 | As a user, I want to drag a row border to resize it so that tall content fits | Should | M |
| US-105 | As a user, I want to bold text in a cell so that I can emphasize headers | Should | S |
| US-106 | As a user, I want to change cell background color so that I can categorize data visually | Should | S |
| US-107 | As a user, I want to change font color so that I can differentiate text | Could | S |
| US-108 | As a user, I want basic formulas MIN, MAX, COUNT so that I have essential analytics | Should | M |
| US-109 | As a user, I want to copy and paste cells so that I can duplicate data quickly | Should | M |
| US-110 | As a user, I want Undo (Ctrl+Z) and Redo (Ctrl+Y) to revert or re-apply up to 5 operations at once so that I can efficiently navigate my edit history | Should | M |
| US-111 | As a user, I want numbers, dates, and currencies auto-detected and right-aligned so that I don't have to format manually | Should | S |
| US-112 | As a user, I want to see Count, Sum, and Average in a status bar when I select multiple cells so that I get instant insights | Should | S |
| US-113 | As a user, I want formula autocomplete suggestions when I type `=` so that I don't have to memorize syntax | Should | M |
| US-114 | As a user, I want referenced cells highlighted with a colored border when editing a formula, and I want to select any formula cell to trace its precedents so that I can debug dependencies | Should | M |
| US-115 | As a user, I want my data auto-saved to localStorage so that it survives page refresh and I never lose work | Must | M |
| US-116 | As a user, I want to hover over a formula cell and see a plain-English tooltip explaining what it does so that I understand formulas without memorizing syntax | Should | S |

| US-117 | As a user, I want a modern, premium visual design (Notion/Linear aesthetic) with smooth colors, subtle borders, and refined typography so that the app feels professional | Should | M |
| US-118 | As a user, I want a dark mode toggle so that I can work comfortably in any lighting | Should | S |
| US-119 | As a user, I want to click a cell while editing a formula to insert its reference, so that I can build formulas visually (Excel-style point-and-click) | Should | M |

#### Stage 2 — High Ceiling

| ID | User Story | Priority | Points |
|----|-----------|----------|--------|
| US-201 | As a user, I want a formula bar above the grid showing the active cell's formula, editable in real-time and synchronized with in-cell editing, so that I can edit complex formulas | Could | M |
| US-202 | As a user, I want to add, rename, and delete sheet tabs so that I can organize data across sheets | Could | L |
| US-203 | As a user, I want to reference cells in other sheets (e.g., `=Sheet2!A1`) so that I can build cross-sheet models | Could | XL |
| US-204 | As a user, I want conditional formatting rules (e.g., "if value > 100, color red") so that data anomalies are visible | Could | L |
| US-205 | As a user, I want to import a CSV file into the grid so that I can work with existing data | Could | M |
| US-206 | As a user, I want to export the grid as a CSV file so that I can share data externally | Could | M |
| US-207 | As a user, I want to select a range of cells (click + drag) so that I can perform bulk operations | Could | M |
| US-208 | As a user, I want to freeze header rows so that they stay visible while scrolling | Could | M |
| US-209 | As a user, I want to paste tab-delimited data from Excel or Google Sheets and have it spread across cells automatically | Should | M |
| US-211 | As a user, I want to use Ctrl+F to find and optionally replace text across the grid | Could | M |
| US-212 | As a user, I want `=SPARKLINE(A1:A10)` to render a mini chart inline in a cell for quick data visualization | Should | L |

#### Stage 3 — Guided Onboarding Tour

> **Design Constraint:** Stage 3 is **additive-only** — zero changes to existing UI. All onboarding elements are overlay components using shadcn/ui primitives (`Dialog`, `Popover`, `Button`, `Kbd`, `Badge`).

| ID | User Story | Priority | Points |
|----|-----------|----------|--------|
| US-301 | As a first-time user, I want a welcome splash so that I know the app is ready and can choose to take a tour | Should | S |
| US-302 | As a first-time user, I want a step-by-step tooltip walkthrough highlighting one UI area at a time | Should | L |
| US-303 | As a user, I want to skip the tour at any point | Must | S |
| US-304 | As a user, I want to re-launch the tour from the toolbar ❓ icon | Should | S |
| US-305 | As a user, I want a progress indicator (X of 7) during the tour | Should | S |
| US-306 | As a first-time user, I want the tour to teach formulas with a live example | Should | M |
| US-307 | As a first-time user, I want to learn keyboard shortcuts during the tour | Should | S |
| US-308 | As a user, I want onboarding state to persist across page refreshes | Must | S |

#### Stage 4 — Grid Power

| ID | User Story | Priority | Points |
|----|-----------|----------|--------|
| US-401 | As a user, I want to insert a row above or below the selected cell so that I can expand my data layout without recreating content | Must | L |
| US-402 | As a user, I want to insert a column to the left or right of the selected cell so that I can add new data fields dynamically | Must | L |
| US-403 | As a user, I want to delete a row or column so that I can clean up my data structure | Must | L |
| US-404 | As a user, I want to sort a column ascending (A→Z) or descending (Z→A) so that I can organize data without manual reordering | Must | M |
| US-405 | As a user, I want a multi-level custom sort dialog so that I can sort by multiple columns at once (e.g., by department then by salary) | Should | L |
| US-406 | As a user, I want a drag-fill handle at the bottom-right corner of the selected cell so that I can quickly replicate values, formulas, or auto-fill number/date series | Must | L |
| US-407 | As a user, I want to merge selected cells into one spanning cell so that I can create headers and organize table layouts | Should | M |
| US-408 | As a user, I want to unmerge a previously merged cell back to individual cells so that I can restore fine-grained data entry | Should | S |

#### Stage 5 — Data Intelligence

| ID | User Story | Priority | Points |
|----|-----------|----------|--------|
| US-501 | As a user, I want auto-filter dropdowns on each column header so that I can filter rows by specific values | Must | L |
| US-502 | As a user, I want to filter by text search within the filter dropdown so that I can quickly find values in large datasets | Should | M |
| US-503 | As a user, I want to use `=IF(condition, true_val, false_val)` so that I can build conditional logic | Must | L |
| US-504 | As a user, I want to use `=VLOOKUP(key, range, col, sorted)` so that I can look up values in a table | Must | XL |
| US-505 | As a user, I want to use `=COUNTIF(range, criterion)` and `=SUMIF(range, criterion, sum_range)` so that I can compute conditional aggregates | Must | L |
| US-506 | As a user, I want text functions (`CONCATENATE`, `LEFT`, `RIGHT`, `LEN`, `ROUND`) so that I can manipulate and format text data | Should | M |
| US-507 | As a user, I want to set data validation rules on cells (dropdown lists, number ranges, text length) so that I can enforce data quality | Should | L |
| US-508 | As a user, I want dropdown-type validated cells to show a select menu when clicked so that I can pick from allowed values | Should | M |
| US-509 | As a user, I want to attach a comment/note to any cell so that I can add context without altering cell data | Should | M |
| US-510 | As a user, I want to see a visual indicator on cells with comments and hover to read them so that I can quickly spot annotated cells | Should | S |

#### Stage 6 — Polish & Power

| ID | User Story | Priority | Points |
|----|-----------|----------|--------|
| US-601 | As a user, I want to name a cell range (e.g., "Revenue" = B2:B10) and use it in formulas (`=SUM(Revenue)`) so that my formulas are self-documenting | Should | L |
| US-602 | As a user, I want a Named Range Manager dialog to view, create, edit, and delete named ranges so that I can manage all range names in one place | Should | M |
| US-603 | As a user, I want in-cell mini charts (`=BARCHART(range)`, `=PIECHART(range)`) so that I can visualize data patterns inline without a separate chart area | Should | XL |
| US-604 | As a user, I want to print the current sheet or export it to PDF with proper page layout so that I can share and archive my work offline | Should | M |
| US-605 | As a user, I want print/PDF options for orientation, paper size, and selected range so that I can customize the output for different uses | Could | M |

---

## 4. Requirements (MoSCoW)

### 4.1 Functional Requirements

#### Must Have (P0) — MVP

| ID | Requirement | Acceptance Criteria |
|----|------------|---------------------|
| FR-001 | Render an editable grid (min 26 columns × 100 rows) | Given the app loads, then a grid with labeled columns A-Z and rows 1-100 is visible |
| FR-002 | Single-cell selection via click | Given a cell is clicked, then it shows a selected state (border highlight) |
| FR-003 | Inline text entry in selected cell | Given a cell is selected, when the user types, then text appears in the cell |
| FR-004 | Keyboard navigation (Arrow, Tab, Enter, Escape) | Given a cell is selected, when Tab is pressed, then the next cell is selected |
| FR-005 | Row/column headers (A-Z, 1-100) | Given the grid renders, then row numbers and column letters are visible and fixed |
| FR-006 | Data persistence within session | Given data is entered, when the user scrolls away and back, then data is retained |

#### Should Have (P1) — Stage 1

| ID | Requirement | Acceptance Criteria |
|----|------------|---------------------|
| FR-101 | Formula evaluation: SUM, AVERAGE, MIN, MAX, COUNT; basic arithmetic (`+`, `-`, `*`, `/`); case-insensitive function names and cell references | Given `=SUM(A1:A3)` is entered in A4 where A1=1, A2=2, A3=3, then A4 displays 6; given `=A1+A2` where A1=3, A2=4, then displays 7; given `=sum(a1:a3)` then behaves identically to `=SUM(A1:A3)` |
| FR-102 | Column resize via drag | Given the user drags a column border, then the column width changes in real-time |
| FR-103 | Row resize via drag | Given the user drags a row border, then the row height changes in real-time |
| FR-104 | Bold formatting toggle | Given a cell is selected and Bold is clicked, then cell text renders in bold |
| FR-105 | Background color picker | Given a cell is selected and a color is chosen, then the cell background changes |
| FR-106 | Undo/Redo stack (≥20 operations, 5-step batches) | Given 10 edits are made and Ctrl+Z is pressed twice, then all edits are reversed (5 per press); tooltip shows number of steps available |
| FR-107 | Copy/Paste (single cell and range) with relative reference adjustment | Given cells A1:A3 are copied, when pasted at B1, then B1:B3 contain the same values; given A4 contains `=SUM(A1:A3)` and is copied to B4, then B4 contains `=SUM(B1:B3)` (relative reference shift); absolute references (`$A$1`) are not adjusted |
| FR-108 | Auto-detect cell data type (number, date, currency, %) | Given "42.5" is entered, then cell content is right-aligned; given "$100" entered, then displayed with currency format |
| FR-109 | Status bar aggregate display (Count, Sum, Average) | Given cells A1:A5 are selected, then status bar shows Count, Sum, and Average of selected values |
| FR-110 | Formula autocomplete suggestions | Given `=SU` is typed, then a dropdown shows `SUM` with syntax hint `SUM(range)` |
| FR-111 | Formula range highlighting + Trace Precedents | Given `=SUM(A1:A5)` is being edited, then cells A1:A5 show a colored overlay/border; given a formula cell is selected (not editing), then its referenced cells are highlighted with directional arrows |
| FR-112 | Auto-save to localStorage with visual indicator | Given data is entered, then within 5s it is persisted to localStorage; given page refresh, then data restores; status indicator shows "Saved ✓" |
| FR-113 | Formula Helper Tooltip | Given the user hovers over a cell containing a formula, then a tooltip displays a plain-English explanation (e.g., `=SUM(A1:A5)` → "Adds up all values from A1 to A5") |
| FR-114 | Visual Design System v3 | Given the app loads, then: toolbar uses premium SF monogram + geometric wordmark typography; grid background is pure white (light) or zinc-950 (dark); gridlines are ultra-subtle; active cell has indigo border with glow; errors display in soft rose; all colors use CSS variable tokens |
| FR-115 | Dark Mode Toggle | Given the user clicks the dark mode toggle, then all surfaces, text, and accents switch to dark tokens; toolbar has gradient surface with indigo glow border to separate from grid; preference persists across sessions |
| FR-116 | Point-and-click formula entry | Given the user is in EDITING mode with an edit buffer starting with `=`, when the user clicks another cell, then the clicked cell's reference (e.g., `A1`) is appended to the edit buffer instead of committing and navigating away; the cell remains in EDITING mode; given the edit buffer does NOT start with `=`, then existing CC-009 auto-commit behavior is preserved |

#### Could Have (P2) — Stage 2

| ID | Requirement | Acceptance Criteria |
|----|------------|---------------------|
| FR-201 | Formula bar displaying active cell content | Given cell A1 contains `=SUM(B1:B3)`, when A1 is selected, then the formula bar shows the formula |
| FR-202 | Multi-sheet tabs (add, rename, delete, switch) | Given the user clicks "+", then a new sheet tab appears and the grid switches to it |
| FR-203 | Cross-sheet cell references | Given `=Sheet2!A1` is entered, then the value from Sheet2 cell A1 is displayed |
| FR-204 | Conditional formatting rules | Given a rule "value > 100 → red background" is set, then cells with values > 100 turn red |
| FR-205 | CSV import (file picker → grid) | Given a CSV file is uploaded, then its contents populate the grid correctly |
| FR-206 | CSV export (grid → file download) | Given the user clicks "Export CSV", then a .csv file downloads with grid data |

#### Should Have (P1) — Stage 3 (Additive Overlay Only)

| ID | Requirement | Acceptance Criteria |
|----|------------|---------------------|
| FR-301 | Welcome splash on first visit | No `onboarding_completed` in localStorage → centered `Dialog` modal over dark overlay |
| FR-302 | 7-step tooltip overlay walkthrough | "Start Tour" triggers: Welcome → Toolbar → Cell → Formulas → Shortcuts → Tabs → Completion |
| FR-303 | Skip tour at any step | `Button variant="ghost"` "Skip tour" on every step; sets `onboarding_completed = true` |
| FR-304 | Re-launch from toolbar | `CircleHelp` icon in toolbar re-launches tour |
| FR-305 | Step progress indicator | Each tooltip shows "X of 7" + 7 dot indicators |
| FR-306 | Element spotlight highlighting | Target element gets `--sf-selection` glow; backdrop `bg-black/55` with CSS cutout |
| FR-307 | State persistence | `onboarding_completed` saved to localStorage on skip/complete |
| FR-308 | Tooltip positioning | `PopoverContent` uses Radix `side`/`align` props; viewport collision avoidance |

#### Stage 4 — Grid Power (Must / Should)

> **Implementation Order:** Insert/Delete → Sort → Drag-Fill → Merge. Each builds on the prior; fill needs insert/delete reference adjustment; merge needs all others stable.

| ID | Requirement | Acceptance Criteria |
|----|------------|---------------------|
| FR-401 | Insert row above / below | Right-click context menu → "Insert row above" / "Insert row below" or keyboard shortcut `Ctrl+Shift+=` inserts a new row; all cell keys below shift by +1; formulas referencing shifted cells are adjusted (including cross-sheet references like `=Sheet2!A5`); undo reverts the insert as a single undo step |
| FR-402 | Insert column left / right | Context menu → "Insert column left" / "Insert column right"; cell keys to the right shift by +1; formula column references (e.g., B→C) are adjusted; columns cannot exceed Z (26 max) — insert button/menu item is **disabled** (not just toast-on-click) when at limit |
| FR-403 | Delete row / column | Context menu → "Delete row" / "Delete column" or `Ctrl+-`; dependent formula references show `#REF!`; undo restores the deleted row/column with original data as a single undo step |
| FR-404 | Sort column ascending | Column header context menu → "Sort A→Z": reorders all rows by selected column values (alphabetical for text, numerical for numbers); preserves row data integrity across all columns; **stable sort** (rows with equal values maintain relative order); sort is a single undo step |
| FR-405 | Sort column descending | Column header context menu → "Sort Z→A": reverse of FR-404; same stability and undo guarantees |
| FR-406 | Multi-level custom sort | SortDialog supports adding multiple sort levels (column + direction pairs); sorts applied sequentially; drag to reorder sort priority |
| FR-407 | Drag-fill handle | Active cell shows a 6×6px indigo square at bottom-right corner; invisible hit area is 44×44px for WCAG touch target compliance; cursor changes to crosshair; drag down/right to fill; drag up/left for reverse fill |
| FR-408 | Auto-fill pattern detection | Fill detects: arithmetic number sequences (1,2→3,4,5), date day-increments, and formula relative reference adjustment; plain text and formatting are copied verbatim; single value = copy (no sequence); during drag, a tooltip shows the preview value for the last cell in the fill range |
| FR-409 | Cell merge | Selection ≥ 2 cells → Toolbar "Merge" button merges into single `<td>` with `colSpan`/`rowSpan`; only top-left cell's value kept; warning toast if data in other cells; merge stored in `Sheet.mergedRegions` |
| FR-410 | Cell unmerge | Merged cell → Toolbar "Unmerge" restores individual cells; original value stays in top-left cell; other cells become empty |
| FR-411 | Grid context menu | Right-click on cell/row/column header shows context menu with: Insert row above/below, Insert column left/right, Delete row, Delete column, Sort A→Z, Sort Z→A (on column headers only), Add comment (Stage 5); keyboard shortcut alternatives shown in menu; disabled items greyed out |

#### Stage 5 — Data Intelligence (Must / Should)

> **Implementation Order:** Filter → Advanced Formulas (IF, VLOOKUP, COUNTIF, SUMIF, AND, OR, NOT) → Data Validation → Comments. Filter infrastructure enables sort-filter interaction tests; formulas needed before validation can reference them.

| ID | Requirement | Acceptance Criteria |
|----|------------|---------------------|
| FR-501 | Auto-filter toggle | Toolbar filter button (funnel icon) enables filter mode: each column header shows a ▼ dropdown arrow; clicking opens `FilterDropdown` popover; **filled funnel icon** when any column has active filter; status bar shows "Showing X of Y rows" |
| FR-502 | Filter by value | FilterDropdown shows scrollable checkbox list of unique values in the column + "Select All" / "Clear"; unchecked values hide their rows; "Clear" resets column to show all rows and reverts funnel icon to outline |
| FR-503 | Filter by text search | FilterDropdown includes a search input at the top; typing filters the checkbox list in real-time; supports case-insensitive partial matching |
| FR-504 | Advanced formula: IF | `=IF(condition, true_value, false_value)` — evaluates condition using comparison operators (`>`, `<`, `=`, `<>`, `>=`, `<=`); supports nesting up to **7 levels deep** (deeper nesting returns `#ERROR!`); returns true_value or false_value |
| FR-505 | Advanced formula: VLOOKUP | `=VLOOKUP(search_key, range, col_index, [is_sorted])` — searches first column of range for key; returns value from col_index; `#N/A` if not found; `#REF!` if col_index exceeds range width; **default `is_sorted` = FALSE** (exact match) |
| FR-506 | Advanced formula: COUNTIF / SUMIF | `=COUNTIF(range, criterion)` counts matching cells; `=SUMIF(criteria_range, criterion, [sum_range])` sums values where criterion matches; criterion supports: plain text match, numeric comparison (`">5"`, `"<>0"`), wildcard (`"app*"`); text criteria are case-insensitive |
| FR-507 | Text formulas | `CONCATENATE(a, b, ...)` or `&` operator joins strings; `LEFT(text, n)` / `RIGHT(text, n)` extract characters; `LEN(text)` returns length; `ROUND(num, decimals)` rounds; `TRIM(text)` removes leading/trailing whitespace |
| FR-508 | Data validation rules | Cell/range can have a `ValidationRule` with type (`list`, `number`, `textLength`, `date`); on `COMMIT_EDIT`, invalid input shows error toast (red border + shake animation) and optionally rejects per `rejectInvalid` flag |
| FR-509 | Dropdown validation UI | Cells with `type: 'list'` validation show a chevron icon; clicking opens a Select popover with allowed values |
| FR-510 | Cell comments | Right-click → "Add comment" or `Ctrl+Shift+M` opens inline textarea popover; comment stored in `Cell.comment` property with `{ text, createdAt }` timestamp; edit and delete via comment popover actions |
| FR-511 | Comment indicators | Cells with comments show a small orange triangle in top-right corner; hovering shows comment text + creation timestamp in a popover |
| FR-512 | Logical formulas: AND / OR / NOT | `=AND(cond1, cond2, ...)` returns TRUE if all conditions true; `=OR(cond1, cond2, ...)` returns TRUE if any condition true; `=NOT(condition)` inverts boolean; commonly nested inside IF: `=IF(AND(A1>0, B1>0), "Both", "Not")` |
| FR-513 | Text formula: TRIM | `=TRIM(text)` removes leading, trailing, and excess interior whitespace; `=TRIM("  hello   world  ")` → `"hello world"` |

#### Stage 6 — Polish & Power (Should / Could)

> **Implementation Order:** Named Ranges → Mini Charts (Bar first, then Pie) → Print/PDF. Named ranges needed first as chart formulas may reference them; print is standalone.

| ID | Requirement | Acceptance Criteria |
|----|------------|---------------------|
| FR-601 | Named ranges | `Workbook.namedRanges` stores name → `NamedRange` mapping; names must match regex `/^[a-zA-Z_][a-zA-Z0-9_]{0,254}$/`; names cannot conflict with function names, cell references (e.g., "A1"), or reserved words; formula engine tokenizer resolves named ranges; `=SUM(Revenue)` evaluates to sum of named range cells |
| FR-602 | Named range manager | Dialog with table showing all named ranges (name, range, sheet); supports add/edit/delete; Name Box dropdown shows defined names; formula autocomplete suggests named ranges with distinct `📌` icon below function suggestions |
| FR-603 | Mini charts: bar | `=BARCHART(range)` renders inline SVG horizontal bar chart in cell; auto-sizes to cell dimensions; 6-color HSL palette; **reactively updates** when source data changes; below minimum cell size (30×20px), chart replaced with `[📊]` icon placeholder |
| FR-604 | Mini charts: pie | `=PIECHART(range)` renders inline SVG pie chart; max 7 segments (remainder grouped as "Other"); hover shows segment value + percentage tooltip; reactively updates on data change; same min-size fallback as FR-603 |
| FR-605 | Print stylesheet | `@media print` CSS hides toolbar, tabs, status bar; adds gridlines; forces light background regardless of active theme; scales columns to fit page width |
| FR-606 | Print/Export to PDF | Toolbar printer icon opens browser's `window.print()` directly (no custom dialog); browser's native print preview serves as dialog for orientation/paper/range selection; "Selected range only" option via pre-print range selection |
| FR-607 | Print headers/footers | Printed pages show sheet name (top-left), page number (bottom-center) via `@page` CSS |

#### Won’t Have (This Release)

| ID | Requirement | Rationale |
|----|------------|-----------|
| FR-X01 | Real-time collaboration (multi-user) | Beyond assignment scope; requires WebSocket infrastructure |
| FR-X02 | Full chart module (standalone chart area) | In-cell mini charts (FR-603/FR-604) cover inline visualization; full chart editor deferred |
| FR-X03 | Cloud persistence (database) | Local/session persistence sufficient for demo |
| FR-X04 | Macro/scripting support | Out of scope for the learning objectives |

### 4.2 Non-Functional Requirements

#### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial Load Time | < 2s on 4G | Lighthouse audit |
| Cell Edit Latency | < 50ms | Manual timing (no perceptible lag) |
| Grid Scroll FPS | ≥ 30 FPS with 100 rows | Chrome DevTools Performance panel |
| Formula Recalculation | < 200ms for 1,000 cells | Console timer |

#### Accessibility

- [ ] Keyboard-only navigation for all grid operations
- [ ] ARIA roles on grid cells (`role="gridcell"`, `aria-colindex`, `aria-rowindex`, `aria-selected`)
- [ ] Minimum contrast ratio 4.5:1 (WCAG AA)
- [ ] Focus indicators visible on all interactive elements
- [ ] Touch targets ≥ 44×44px on toolbar buttons (WCAG 2.5.5)
- [ ] Screen reader announcements on cell selection changes (`aria-live` region)
- [ ] Error cells (`#DIV/0!`, `#REF!`, `#ERROR!`) associated via `aria-describedby`
- [ ] `prefers-reduced-motion` respected for all animations
- [ ] Formula error values displayed in soft rose text (`--sf-text-error`) to visually distinguish from normal content

#### Visual Design System

- [ ] All UI chrome colors use `--sf-*` CSS variable tokens (no hardcoded hex)
- [ ] SF gradient monogram (indigo→violet) + geometric bold wordmark (Outfit/Geist 700, -0.03em)
- [ ] Toolbar: 2 rows (header + controls), floats above grid via subtle shadow
- [ ] Light mode: pure white (`#FFFFFF`) grid background, toolbar warm tint (`#FAFAF9`)
- [ ] Dark mode: zinc-950 grid, toolbar gradient surface (`#18181B → #1F1F23`) + indigo glow border
- [ ] Ultra-subtle gridlines (`--sf-gridline`), soft indigo selection border + glow
- [ ] Font stack: Outfit (wordmark), Geist Sans (UI), Geist Mono (formulas/cells)
- [ ] Error cells: soft rose text + optional ⚠ icon, not harsh red
- [ ] Interactive elements: borderless buttons with subtle hover/active states

#### Browser Compatibility

- [ ] Chrome 120+ (primary)
- [ ] Safari 17+ (secondary)
- [ ] Firefox 120+ (secondary)

#### Security

> Source: Architecture Review TA-07

| ID | Requirement | Acceptance Criteria |
|----|------------|---------------------|
| NFR-S01 | Formula parser must use a function whitelist | Given an unknown function `=IMPORTRANGE(...)` is entered, then the cell displays `#NAME?` error; whitelisted functions: SUM, AVERAGE, MIN, MAX, COUNT, SPARKLINE, IF, AND, OR, NOT, VLOOKUP, COUNTIF, SUMIF, CONCATENATE, LEFT, RIGHT, LEN, ROUND, TRIM, BARCHART, PIECHART |
| NFR-S02 | CSV import must treat cell values as text literals | Given a CSV cell starting with `=` or `+` or `-` or `@`, then the value is imported as plain text, not auto-evaluated as a formula |
| NFR-S03 | External paste must sanitize HTML | Given HTML content is pasted from an external source, then the app parses `text/plain` only; no raw HTML is rendered |

#### Keyboard Mode Machine

> Source: Architecture Review TA-08

The grid operates in exactly **3 mutually exclusive modes**. Each mode has its own keyboard handler. A central dispatcher routes events to the active mode.

| Mode | Entry Trigger | Active Behavior | Visual Indicator | Exit Trigger |
|------|--------------|----------------|------------------|--------------|
| **VIEWING** | Default state; also entered on Escape / Enter / Tab from EDITING | Arrow keys navigate cells; Ctrl+C copies cell; Ctrl+Z undoes; Ctrl+F opens find | Solid 2px blue border on selected cell | Click or Enter on a cell → EDITING; Double-click → EDITING (cursor positioned in text); Click+drag → SELECTING |
| **EDITING** | Click or Enter on a cell; typing any character; double-click positions cursor inside existing text | Keystrokes modify cell content; formula autocomplete active; range highlighting active; Ctrl+B toggles bold | Blinking text cursor inside cell; cell border changes to input-style | Escape (cancel) / Enter (commit down) / Tab (commit right) → VIEWING |
| **SELECTING** | Click+drag on cells | Mouse movement extends selection range; status bar shows aggregates for selection | Light blue fill on selected range; marching-ants border on range boundary | Mouse up → VIEWING (with selection retained) |

#### Auto-Save Serialization Strategy

> Source: Architecture Review SA-05

| Parameter | Requirement |
|-----------|------------|
| **What to serialize** | Cell data only (value, formula, format, dataType). Exclude derived values (displayValue), undo stack, and UI state (scroll position, selection). |
| **Format** | `JSON.stringify` of the Workbook → Sheets → Cells tree |
| **Trigger** | Debounced 2-second timer after last edit (not per-keystroke) |
| **Size guard** | Before each write, check `JSON.stringify(data).length`. If > 4MB, show non-blocking warning. If > 4.5MB, offer to clear undo history. |
| **Restore** | On page load, check `localStorage` for saved workbook. If found, deserialize and populate state. If corrupted, start fresh with warning. |
| **Fallback (Stage 2)** | If localStorage quota is exceeded, fall back to IndexedDB for larger datasets. |

### 4.3 Technical Constraints

> Source: Architecture Review TA-01, TA-03

#### Technology Stack

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Framework** | Next.js 16 (App Router) + React 19 | Already scaffolded; Google Antigravity IDE default |
| **Language** | TypeScript (strict mode) | Type safety critical for Cell/Formula types |
| **UI Components** | shadcn/ui (toolbar buttons, dialogs, all chrome) | Already installed; consistent styling; design token support |
| **CSS** | CSS with design tokens (`--sf-*` variables) + Shadcn HSL variables | Grid has unique layout needs; design tokens enable dark/light mode theming |
| **State Management** | React `useReducer` + `useContext` | Single source of truth without external dependencies |
| **Testing** | Vitest | Formula engine, DAG, and type detection are pure functions — ideal for unit tests |
| **Build Tool** | Vite (via Next.js) | Default bundler |

#### Grid Rendering — Architecture Decision Record

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **HTML `<table>`** | Semantic, accessible (free ARIA `gridcell`), native clipboard, DOM events | Slower at 10k+ cells; CSS resize is complex | ✅ **Selected** |
| CSS Grid | Flexible layout, modern CSS | Same DOM node count problem, no cell semantics, worse a11y | ❌ Rejected |
| Canvas | Fastest rendering, virtual scrolling trivial | No DOM = no ARIA, no native clipboard, no text input | ❌ Rejected — overkill for 26×100 |

**Implementation Notes:**
- Use HTML `<table>` with ARIA `role="grid"` on the table and `role="gridcell"` on each `<td>`.
- Start with full rendering (all 2,600 cells). Add virtual row rendering (only visible rows + 10-row buffer) in Stage 1 **only if** scroll FPS drops below 30.
- The Grid component must accept a `rowRange` prop to enable virtual scrolling without rewriting.

#### Internal vs. External Clipboard Detection

> Source: Architecture Review SA-06

| Operation | Clipboard Format | Detection |
|-----------|-----------------|----------|
| Internal copy (Ctrl+C within SheetForge) | Custom MIME `application/x-sheetforge` + `text/plain` (TSV) | On paste: check for `application/x-sheetforge` first |
| External paste (from Excel/Google Sheets) | `text/plain` (tab-delimited) | Fallback: parse as TSV if custom MIME is absent |
| Cut (Ctrl+X) | Same as copy + "pending cut" flag | On paste: clear source cells; if no paste occurs, keep source |

### 4.4 Data Model

> Source: Architecture Review SA-01, SA-07

All data structures are defined here to ensure schema stability across stages. Stage 2 fields are present from day one as `optional` to avoid breaking migrations.

#### Cell Address (Composite Key)

```typescript
interface CellAddress {
  sheetId: string;   // UUID — defaults to active sheet in MVP
  col: number;       // 0-indexed (A=0, B=1, ... Z=25)
  row: number;       // 0-indexed (row 1 = 0)
}
```

#### Cell

```typescript
interface Cell {
  // Core (MVP)
  value: string | number | null;          // Raw user input or computed result
  formula?: string;                        // Raw formula string (e.g., "=SUM(A1:A5)")
  displayValue?: string;                   // Formatted display (e.g., "$1,234.56")
  dataType: 'text' | 'number' | 'date' | 'currency' | 'percentage' | 'empty';

  // Formatting (Stage 1)
  format?: {
    bold?: boolean;
    fontColor?: string;                    // Hex color
    backgroundColor?: string;              // Hex color
    alignment?: 'left' | 'center' | 'right';
  };

  // Stage 2 (optional, pre-allocated)
  sparkline?: SparklineValue;              // For =SPARKLINE() results

  // Stage 4 (optional)
  mergedWith?: CellAddress;                // Points to anchor cell of merge group (null = not merged)

  // Stage 5 (optional)
  comment?: { text: string; createdAt: string };  // Cell annotation (FR-510)
  validationRule?: ValidationRule;         // Data entry constraint (FR-508)
}
```

#### Sheet

```typescript
interface Sheet {
  id: string;                              // UUID
  name: string;                            // "Sheet1", user-renameable
  cells: Record<string, Cell>;             // Key = "col,row" (e.g., "0,0" for A1)
  columnWidths: Record<number, number>;    // Col index → width in px (default: 100)
  rowHeights: Record<number, number>;      // Row index → height in px (default: 28)

  // Stage 2 (optional)
  conditionalRules?: ConditionalRule[];     // Ordered array; last rule wins

  // Stage 4 (optional)
  mergedRegions?: MergedRegion[];           // Active merged cell spans (FR-409)

  // Stage 5 (runtime-only, not serialized)
  filterState?: FilterState;               // Column filter config (FR-501–503)
  sortState?: SortState;                   // Last applied sort for undo (FR-404–406)
}
```

#### Workbook (Root)

```typescript
interface Workbook {
  sheets: Sheet[];                         // Ordered array of sheets
  activeSheetId: string;                   // ID of currently displayed sheet
  settings: {
    theme: 'light' | 'dark';              // Dark mode toggle
  };

  // Stage 6 (optional)
  namedRanges?: Record<string, NamedRange>; // Name → range mapping (FR-601)
}
```

#### Stage 4–6 Types (pre-allocated)

```typescript
// Stage 4 — Merge
interface MergedRegion {
  anchorRow: number;                       // Top-left row (0-indexed)
  anchorCol: number;                       // Top-left col (0-indexed)
  rowSpan: number;                         // Number of rows spanned
  colSpan: number;                         // Number of cols spanned
}

interface SortState {
  column: number;                          // Column index that was sorted
  direction: 'asc' | 'desc';              // Sort direction
  previousOrder: string[];                 // Row keys pre-sort (for undo)
}

// Stage 5 — Filter & Validation
interface FilterState {
  enabled: boolean;                        // Whether filter mode is active
  columns: Record<number, ColumnFilter>;   // Col index → filter config
}

interface ColumnFilter {
  selectedValues: Set<string>;             // Checked values in dropdown
  searchText: string;                      // Search input text
}

interface ValidationRule {
  type: 'list' | 'number' | 'textLength' | 'date';
  allowedValues?: string[];                // For type 'list'
  min?: number;                            // For type 'number' or 'textLength'
  max?: number;                            // For type 'number' or 'textLength'
  minDate?: string;                        // For type 'date' (ISO format)
  maxDate?: string;                        // For type 'date' (ISO format)
  rejectInvalid: boolean;                  // true = block entry; false = show warning only
}

// Stage 6 — Named Ranges
interface NamedRange {
  name: string;                            // Must match: /^[a-zA-Z_][a-zA-Z0-9_]{0,254}$/
  sheetId: string;                         // Target sheet UUID
  startCol: number;
  startRow: number;
  endCol: number;
  endRow: number;
}
```

> **Note:** The undo stack, selection state, scroll position, and auto-save timer are **runtime-only state** — not part of the serialized data model.

---

## 5. Corner Cases & Edge Scenarios

> Authored by: **Business Analyst** (BACH framework) + **Product Manager** (CBESP framework)

### 5.1 MVP Corner Cases

| ID | Feature | Scenario | Expected Behavior | Severity |
|----|---------|----------|-------------------|----------|
| CC-001 | Cell Navigation | User presses Tab at the last column (Z) | Wrap to column A of the next row | Medium |
| CC-002 | Cell Navigation | User presses Up arrow at row 1 | Stay at row 1, no error | Low |
| CC-003 | Text Entry | User pastes 10,000 characters into one cell | Truncate at 5,000 chars with warning | Medium |
| CC-004 | Text Entry | User enters only whitespace | Store as empty string, display as empty | Low |
| CC-005 | Text Entry | User enters emoji (🎉📊) | Render correctly in cell | Medium |
| CC-006 | Grid Render | Browser window resized to < 400px | Grid becomes horizontally scrollable | Medium |
| CC-007 | Data Persistence | User refreshes the page during MVP | Data persists in memory within session; page refresh clears data (MVP). Full localStorage auto-save is Stage 1 (FR-112). | High |
| CC-008 | Text Entry | User types `=SUM(A1:A3)` during MVP (before formula engine exists) | Display as plain text `=SUM(A1:A3)`, do not evaluate | High |
| CC-009 | Mode Transition | User is EDITING cell A1, clicks cell B2 without pressing Enter | A1 value auto-committed before B2 is selected (Excel-like behavior); no data loss | High |
| CC-010 | Selection Edge | User selects range A1:C3 by dragging bottom-right to top-left (reverse direction) | Selection border renders identically to top-left → bottom-right (normalizeSelection ensures consistent edges) | Medium |
| CC-011 | Mode Transition | User presses F2 on a cell with no content | Cell enters EDITING mode with empty edit buffer; cursor appears in empty cell | Low |
| CC-012 | Keyboard | User is in EDITING mode and presses Arrow keys | Arrow keys move cursor within cell text, do NOT navigate to adjacent cells | High |
| CC-013 | Cell Entry | User types a single printable character in VIEWING mode | Cell enters EDITING mode with that character as initial content; character not doubled | High |
| CC-014 | Tab Wrapping | User presses Shift+Tab at cell A1 (top-left corner) | No movement, stays at A1 (boundary clamp) | Low |
| CC-015 | Display | User enters `0` (zero) in a cell | Cell displays `0`, right-aligned (detected as number), not treated as empty | Medium |

### 5.2 Stage 1 Corner Cases

| ID | Feature | Scenario | Expected Behavior | Severity |
|----|---------|----------|-------------------|----------|
| CC-101 | Formula (SUM) | Range includes text cells: `=SUM(A1:A3)` where A2="hello" | Ignore text cells, sum only numbers | High |
| CC-102 | Formula (SUM) | Range is empty: `=SUM(A1:A3)` with all empty | Display 0 | Medium |
| CC-103 | Formula | Syntax error: `=SUM(A1:` (incomplete) | Display `#ERROR!` in cell | High |
| CC-104 | Formula | Division by zero: `=A1/A2` where A2=0 | Display `#DIV/0!` | High |
| CC-105 | Formatting | Apply bold + color, then Undo — which reverts? | Undo reverses the last formatting action only | Medium |
| CC-106 | Resize | User drags column width to 0px | Enforce minimum width of 30px | Medium |
| CC-107 | Copy/Paste | Paste from external source (Excel, Google Sheets) | Parse tab-delimited text into grid cells | High |
| CC-108 | Undo | User presses Ctrl+Z beyond undo history | No-op after stack is exhausted, no error; each press undoes up to 5 steps |
| CC-109 | Auto-Detect | User enters "12/25/2026" — date or text? | Detect as date, store as ISO, display in locale format | Medium |
| CC-110 | Formula Autocomplete | User types `=` then immediately presses Escape | Dropdown dismissed, cell edit cancelled cleanly | Low |
| CC-111 | Auto-Save | localStorage quota exceeded (5MB limit) | Show non-blocking warning, continue working without save | Medium |
| CC-112 | Formula Tooltip | Cell contains plain text (not a formula) — user hovers | No tooltip shown; tooltip only appears for formula cells | Low |
| CC-113 | Trace Precedents | Formula references a deleted/empty cell | Arrow still drawn to the cell position; cell shows as empty | Medium |
| CC-114 | Formula Bar | User is in EDITING mode — formula bar shows edit buffer live | Formula bar updates in real-time as user types in cell; shows raw formula if formula cell | High |
| CC-115 | Name Box | User selects range A1:C3 — check name box | Name box shows `A1:C3` (full range reference), not just active cell | Medium |
| CC-116 | Bold Toggle | User selects bold cell, checks Bold toolbar button | Button has `variant="secondary"` (pressed/active visual state) + `aria-pressed="true"` | Medium |
| CC-117 | Cut vs Copy | User does Ctrl+X on A1, then Ctrl+V on B1 | A1 is cleared after paste (source cells deleted); clipboard is invalidated after cut-paste | High |
| CC-118 | Format Preservation | User applies bold+fontColor to cell, then edits the value and commits | Existing format (bold, fontColor) preserved after editing; only value changes | High |
| CC-119 | Autocomplete Keyboard | User types `=SU` (autocomplete showing), presses ArrowDown | ArrowDown navigates autocomplete dropdown, not grid cells; event delegation active | Medium |
| CC-120 | Data Type Alignment | User enters `$42.50` (currency) or `45%` (percentage) | Cell right-aligned (like numbers); dataType detected as `currency` / `percentage` | Medium |
| CC-121 | Point-and-Click Formula | User types `=` then clicks cell A1, types `+`, clicks cell B1 | Edit buffer becomes `=A1+B1`; cell stays in EDITING mode; formula not committed until Enter | High |
| CC-122 | Point-and-Click Formula | User types `=SUM(` then clicks A1, types `:`, clicks A5, types `)` | Edit buffer becomes `=SUM(A1:A5)`; pressing Enter commits and evaluates | High |
| CC-123 | Point-and-Click Formula (negative) | User is editing plain text (no `=` prefix), clicks another cell | Existing CC-009 auto-commit behavior: current cell committed, clicked cell selected | High |

### 5.3 Stage 2 Corner Cases

| ID | Feature | Scenario | Expected Behavior | Severity |
|----|---------|----------|-------------------|----------|
| CC-201 | Formulas | Circular reference: `A1=B1`, `B1=A1` | Detect cycle, display `#CIRCULAR!`, stop recalc | Critical |
| CC-202 | Multi-Sheet | Delete sheet that is referenced by another sheet | Display `#REF!` in all dependent cells | Critical |
| CC-203 | Multi-Sheet | Rename sheet — do references update? | References update automatically (e.g., `=OldName!A1` → `=NewName!A1`) | High |
| CC-204 | CSV Import | CSV with mismatched column counts per row | Pad shorter rows with empty cells | Medium |
| CC-205 | CSV Import | CSV file > 5MB | Show warning, allow or decline import | Medium |
| CC-206 | CSV Export | Grid contains formulas — export values or formulas? | Export computed values (not raw formulas) | High |
| CC-207 | Cross-Sheet Ref | Reference to non-existent sheet: `=Sheet99!A1` | Display `#REF!` | High |
| CC-208 | Conditional Formatting | Conflicting rules on same cell (rule A: red, rule B: green) | Last rule wins (rule priority order) | Medium |

### 5.4 Stage 3 Corner Cases (Onboarding)

| ID | Feature | Scenario | Expected Behavior | Severity |
|----|---------|----------|-------------------|----------|
| CC-301 | Persistence | User clears localStorage | Tour reappears on next visit | Low |
| CC-302 | Tooltip | Browser resize during tour | Tooltip repositions via Radix collision detection | Medium |
| CC-303 | Overlay | Click on dark overlay area | No action; overlay blocks grid interaction | High |
| CC-304 | Navigation | Press Escape during tour | Tour dismissed, `onboarding_completed = true` | Medium |
| CC-305 | Spotlight | Target element missing (e.g., removed tab) | Skip step automatically | Medium |
| CC-306 | Re-launch | Re-launch help while editing cell | Auto-commit cell, then start tour | Medium |
| CC-307 | Theme | Dark/light mode switch during tour | Overlay + tooltips respect current theme tokens | Low |
| CC-308 | Keyboard | Keyboard shortcuts during tour | Blocked by overlay event capture | High |
| CC-309 | Persistence | Corrupted localStorage flag | Treat as `false`, show welcome | Low |
| CC-310 | Multi-Sheet | Sheet tab switch during tour | Tour step anchored; step 6 allows it | Medium |
| CC-311 | Re-launch | Returning user with cleared flag | Show standard welcome (no "welcome back" distinction) | Low |
| CC-312 | Viewport | Viewport < 768px | Tooltip → centered modal fallback | Medium |

### 5.5 Stage 4 Corner Cases (Grid Power)

| ID | Feature | Scenario | Expected Behavior | Severity |
|----|---------|----------|-------------------|----------|
| CC-401 | Insert Row | Insert row when cells below contain formulas referencing other cells | All formula cell references below insertion point shift by +1 row; formulas above are unchanged | Critical |
| CC-402 | Insert Column | Attempt to insert a column when 26 columns (A–Z) already exist | Show toast warning: "Maximum 26 columns reached"; insertion blocked | High |
| CC-403 | Delete Row | Delete a row referenced by formulas in other cells | Dependent cells show `#REF!`; undo restores row and fixes references | Critical |
| CC-404 | Delete Column | Delete column with merged cells spanning it | Merge is broken; remaining cells become individual cells | High |
| CC-405 | Sort | Sort column containing mixed types (numbers + text + empty) | Numbers sorted numerically first, then text alphabetically, empty cells last | High |
| CC-406 | Sort | Sort with merged cells in the sort range | Sort is blocked; toast warning: "Cannot sort range with merged cells" | Medium |
| CC-407 | Sort | Undo after multi-column sort | All rows revert to pre-sort positions in a single undo step | High |
| CC-408 | Drag-Fill | Drag fill a cell containing a formula `=A1+B1` downward 3 rows | Formulas adjust relatively: `=A2+B2`, `=A3+B3`, `=A4+B4` | Critical |
| CC-409 | Drag-Fill | Drag fill a single number (e.g., "5") with no pattern | Value is copied verbatim to all filled cells (no sequence detection for single value) | Medium |
| CC-410 | Drag-Fill | Drag fill two numbers (3, 6) to detect arithmetic sequence | Filled cells: 9, 12, 15 (increment of 3 detected) | High |
| CC-411 | Merge | Merge cells where some contain data | Only top-left cell value is kept; toast warning: "Data in X cells will be lost" | High |
| CC-412 | Merge | Copy/paste a merged cell to a new location | Paste creates a merged cell of same span at destination; existing data in destination span is overwritten | Medium |
| CC-413 | Insert Row | Insert row inside a vertically merged cell span | Merged cell span increases by 1 row (rowSpan += 1) | Medium |

### 5.6 Stage 5 Corner Cases (Data Intelligence)

| ID | Feature | Scenario | Expected Behavior | Severity |
|----|---------|----------|-------------------|----------|
| CC-501 | Filter | Filter a column then sort | Sort applies only to visible (non-filtered) rows; hidden rows stay in place | High |
| CC-502 | Filter | All values unchecked in filter dropdown | All rows hidden; status bar shows "Showing 0 of N rows" | Medium |
| CC-503 | Filter | Delete a row that is currently hidden by filter | Row is removed; filter recalculates visible set | Medium |
| CC-504 | IF Formula | Nested IF: `=IF(A1>10, IF(A1>20, "High", "Med"), "Low")` | Evaluates correctly with two nesting levels; deeper nesting returns `#ERROR!` at level 4+ | High |
| CC-505 | VLOOKUP | `=VLOOKUP("xyz", A1:B10, 2, FALSE)` — key not found | Returns `#N/A` error | High |
| CC-506 | VLOOKUP | `=VLOOKUP("abc", A1:B10, 5, FALSE)` — col_index exceeds range width | Returns `#REF!` error | High |
| CC-507 | COUNTIF | `=COUNTIF(A1:A10, ">5")` with text and empty cells in range | Counts only numeric cells matching criterion; text/empty cells ignored | Medium |
| CC-508 | Data Validation | User pastes data into a validated cell that violates the rule | Paste proceeds; validation warning shown as toast (non-blocking) | High |
| CC-509 | Data Validation | Delete a cell's validation rule while cell contains valid data | Data is preserved; validation indicator (green triangle) removed | Low |
| CC-510 | Comments | User adds a comment to a merged cell | Comment attaches to the anchor (top-left) cell of the merge | Medium |
| CC-511 | Comments | Import CSV into a sheet with comments | Comments are not included in CSV format; existing comments on overwritten cells are removed | Medium |
| CC-512 | Text Functions | `=LEFT("", 5)` or `=RIGHT("", 3)` — empty string input | Returns empty string, no error | Low |

### 5.7 Stage 6 Corner Cases (Polish & Power)

| ID | Feature | Scenario | Expected Behavior | Severity |
|----|---------|----------|-------------------|----------|
| CC-601 | Named Ranges | User creates a named range "SUM" (same as function name) | Rejected with toast: "Name conflicts with built-in function" | High |
| CC-602 | Named Ranges | Named range references a deleted sheet | Range becomes invalid; formulas using it show `#REF!` | High |
| CC-603 | Named Ranges | User types `=SUM(Revenue)` where "Revenue" is a named range | Formula engine resolves "Revenue" to its cell range and computes SUM | Critical |
| CC-604 | Mini Charts | `=BARCHART(A1:A5)` where all values are 0 | Renders empty/flat bar chart, no error | Medium |
| CC-605 | Mini Charts | `=PIECHART(A1:A10)` with more than 8 data points | First 7 segments rendered individually; remaining grouped as "Other" segment | Medium |
| CC-606 | Mini Charts | Cell containing chart is resized very small (30×20px) | Chart scales down; below minimum threshold, chart replaced with `[📊]` icon | Medium |
| CC-607 | Print | Print with active filters | Only visible (non-filtered) rows are printed | High |
| CC-608 | Print | Print with merged cells spanning page break | Merged cell content appears on the page where the anchor cell falls | Medium |
| CC-609 | Print | Dark mode active during print | Print stylesheet forces light background regardless of theme | Medium |
| CC-610 | Named Ranges | Named range with spaces in name: "Total Revenue" | Rejected; names must be alphanumeric + underscores only | Low |
| CC-611 | Print | Sheet has no data — user clicks Print | Print dialog opens with empty grid; single page with headers only | Low |
| CC-612 | Named Ranges | Formula autocomplete suggests named ranges | Named ranges appear in autocomplete dropdown below function suggestions, with distinct icon | Medium |

---

## 6. RICE Prioritization

> Scored via `calculate-rice` MCP tool. Effort in person-months.

| Feature | Reach | Impact | Confidence | Effort | RICE Score | Stage |
|---------|:-----:|:------:|:----------:|:------:|:----------:|:-----:|
| Editable Grid | 1,000 | 3.0 | 95% | 1.0 | **2,850** | MVP |
| Auto-Save with Indicator | 1,000 | 2.0 | 90% | 0.5 | **3,600** | S1 |
| Cell Type Detection | 900 | 1.0 | 85% | 0.5 | **1,530** | S1 |
| Status Bar Aggregates | 800 | 1.0 | 90% | 0.5 | **1,440** | S1 |
| Range Highlighting | 750 | 1.0 | 80% | 0.5 | **1,200** | S1 |
| CSV Import/Export | 700 | 2.0 | 85% | 1.5 | **793** | S2 |
| Basic Formulas (SUM, AVERAGE) | 900 | 2.0 | 85% | 2.0 | **765** | S1 |
| Column/Row Resizing | 800 | 1.0 | 90% | 1.0 | **720** | S1 |
| Formula Helper Tooltip | 900 | 1.0 | 85% | 0.5 | **1,530** | S1 |
| Formula Autocomplete | 700 | 1.0 | 75% | 1.0 | **525** | S1 |
| Cell Formatting (Bold, Color) | 850 | 1.0 | 90% | 1.5 | **510** | S1 |
| Sparkline Mini-Charts | 600 | 2.0 | 65% | 2.0 | **390** | S2 |
| Formula Bar UI | 700 | 1.0 | 80% | 1.5 | **373** | S2 |
| Multi-Sheet Tabs | 600 | 2.0 | 70% | 3.0 | **280** | S2 |
| Conditional Formatting | 550 | 1.0 | 75% | 2.0 | **206** | S2 |
| Cross-Sheet References | 500 | 2.0 | 60% | 3.0 | **200** | S2 |
| Welcome Splash Screen | 1,000 | 1.0 | 90% | 0.5 | **1,800** | S3 |
| Guided Onboarding Tour | 1,000 | 2.0 | 80% | 2.0 | **800** | S3 |
| Contextual Feature Tooltips | 800 | 1.0 | 85% | 1.0 | **680** | S3 |
| Progress Checklist | 700 | 0.5 | 75% | 1.0 | **263** | S3 |
| Insert / Delete Rows & Columns | 950 | 3.0 | 95% | 1.5 | **1,805** | S4 |
| Data Sorting (A-Z, Z-A) | 900 | 2.0 | 90% | 1.5 | **1,080** | S4 |
| Drag-Fill / Auto-Fill Handle | 900 | 2.0 | 85% | 2.0 | **765** | S4 |
| Cell Merge & Split | 800 | 2.0 | 80% | 2.0 | **640** | S4 |
| Data Filtering (Auto-Filter) | 850 | 2.0 | 85% | 2.0 | **723** | S5 |
| Cell Comments / Notes | 700 | 1.0 | 90% | 1.0 | **630** | S5 |
| Advanced Formulas (IF, VLOOKUP, COUNTIF, SUMIF, AND, OR, NOT) | 800 | 2.0 | 90% | 2.5 | **576** | S5 |
| Data Validation (Dropdowns, Number Limits) | 700 | 2.0 | 80% | 2.5 | **448** | S5 |
| Named Ranges | 500 | 1.0 | 85% | 1.5 | **283** | S6 |
| Mini Charts (Bar, Pie) | 600 | 2.0 | 70% | 3.0 | **280** | S6 |
| Print / Export to PDF | 600 | 1.0 | 80% | 1.5 | **320** | S6 |

---

## 7. Opportunity Scoring

> Scored via `calculate-opportunity-score` MCP tool. Score = Importance + (Importance − Satisfaction).

| Opportunity | Importance | Satisfaction | Score | Status |
|-------------|:----------:|:------------:|:-----:|--------|
| Editable Grid | 10 | 3 | **17** | 🟢 Underserved |
| Text Entry | 10 | 5 | **15** | 🟢 Underserved |
| Basic Formulas (SUM, AVERAGE) | 9 | 3 | **15** | 🟢 Underserved |
| Cell Navigation (keyboard) | 9 | 4 | **14** | 🟢 Underserved |
| Multi-Sheet Tabs | 8 | 2 | **14** | 🟢 Underserved |
| Auto-Save (never lose data) | 8 | 2 | **14** | 🟢 Underserved |
| CSV Import/Export | 8 | 3 | **13** | 🟢 Underserved |
| Cross-Sheet References | 7 | 2 | **12** | 🟡 Appropriately Served |
| Status Bar Aggregates | 7 | 2 | **12** | 🟡 Appropriately Served |
| Cell Formatting (Bold, Color) | 7 | 4 | **10** | 🟡 Appropriately Served |
| Formula Autocomplete | 6 | 2 | **10** | 🟡 Appropriately Served |
| Range Highlighting + Trace Precedents | 7 | 2 | **12** | 🟡 Appropriately Served |
| Formula Helper Tooltip | 7 | 2 | **12** | 🟡 Appropriately Served |
| Column/Row Resizing | 7 | 5 | 9 | 🔴 Overserved |
| Formula Bar UI | 6 | 3 | 9 | 🔴 Overserved |
| Conditional Formatting | 5 | 3 | 7 | 🔴 Overserved |
| First-time user discoverability | 9 | 2 | **16** | 🟢 Underserved |
| Understanding formula syntax | 8 | 3 | **13** | 🟢 Underserved |
| Discovering multi-sheet | 7 | 2 | **12** | 🟡 Appropriately Served |
| Learning keyboard shortcuts | 7 | 3 | **11** | 🟡 Appropriately Served |
| Import/export awareness | 6 | 2 | **10** | 🟡 Appropriately Served |
| Formatting options | 6 | 4 | **8** | 🔴 Overserved |
| Insert / Delete Rows & Columns | 10 | 1 | **19** | 🟢 Underserved |
| Data Sorting (A-Z, Z-A, Custom) | 9 | 1 | **17** | 🟢 Underserved |
| Data Filtering (Auto-Filter) | 9 | 1 | **17** | 🟢 Underserved |
| Drag-Fill / Auto-Fill Handle | 9 | 1 | **17** | 🟢 Underserved |
| Cell Merge & Split | 8 | 1 | **15** | 🟢 Underserved |
| Advanced Formulas (IF, VLOOKUP, COUNTIF, SUMIF) | 9 | 3 | **15** | 🟢 Underserved |
| Data Validation (Dropdowns, Limits) | 8 | 1 | **15** | 🟢 Underserved |
| Mini Charts (Bar, Line, Pie) | 8 | 2 | **14** | 🟢 Underserved |
| Cell Comments / Notes | 7 | 1 | **13** | 🟢 Underserved |
| Named Ranges | 7 | 1 | **13** | 🟢 Underserved |
| Print / Export to PDF | 7 | 1 | **13** | 🟢 Underserved |

**Insight:** The 9 underserved opportunities now include first-time user discoverability (16) and understanding formula syntax (13), confirming Stage 3 onboarding as a high-impact addition. Stages 4–6 add 11 new underserved opportunities (all scoring ≥ 13), with Insert/Delete Rows & Columns (19) as the most critically underserved feature. Auto-Save remains a Must-Have.

---

## 8. Kano Model Analysis

| Feature | Category | Rationale |
|---------|----------|-----------|
| Editable Grid | **Must-Be (Basic)** | Without it, there is no product. Expected by every user. |
| Cell Navigation (keyboard) | **Must-Be (Basic)** | Tab/Enter/Arrow navigation is a baseline expectation. |
| Text Entry | **Must-Be (Basic)** | Inability to type data = product failure. |
| Row/Column Headers | **Must-Be (Basic)** | Users expect A-Z / 1-100 labeling. |
| Auto-Save | **Must-Be (Basic)** | Users expect data survival; its absence = product failure. |
| Basic Formulas (SUM, AVERAGE) | **One-Dimensional (Performance)** | More formulas = more satisfaction, linearly. |
| Column/Row Resizing | **One-Dimensional (Performance)** | Better resizing = better UX, proportionally. |
| Cell Formatting (Bold, Color) | **One-Dimensional (Performance)** | More formatting options = more polished feel. |
| Undo/Redo | **One-Dimensional (Performance)** | Deeper undo stack = more confidence. |
| Cell Type Detection | **One-Dimensional (Performance)** | More accurate auto-detection = less manual formatting. |
| Formula Bar UI | **Attractive (Delighter)** | Not expected at this scope; impresses if present. |
| Multi-Sheet Tabs | **Attractive (Delighter)** | Unexpected depth that demonstrates mastery. |
| CSV Import/Export | **Attractive (Delighter)** | Practical utility that sets submission apart. |
| Conditional Formatting | **Attractive (Delighter)** | Visual polish that surprises reviewers. |
| Cross-Sheet References | **Attractive (Delighter)** | Advanced functionality, impressive if it works. |
| Status Bar Aggregates | **Attractive (Delighter)** | Not expected in a student project; impresses reviewers with professional polish. |
| Formula Autocomplete | **Attractive (Delighter)** | Unexpected polish; feels like a commercial product. |
| Range Highlighting + Trace Precedents | **Attractive (Delighter)** | Visual debugging that demonstrates deep attention to detail; extends range highlighting into a debug tool. |
| Formula Helper Tooltip | **Attractive (Delighter)** | Plain-English explanations feel AI-native; leverages the "AI-Built" subtitle. |
| Sparkline Mini-Charts | **Attractive (Delighter)** | Transforms product perception from "grid" to "analysis tool"; high demo impact. |
| Dark Mode | **One-Dimensional (Performance)** | Promoted to Stage 1; essential for professional polish and Loom demo impact. Design tokens already support it. |
| Welcome Splash Screen | **Attractive (Delighter)** | First-time experience that creates a premium feel; not expected in student projects. |
| Guided Onboarding Tour | **Must-Be (Basic)** | Without onboarding, first-time discoverability (score: 16) is critically underserved. |
| Contextual Feature Tooltips | **One-Dimensional (Performance)** | More guided tips = better discoverability, linearly. |
| Progress Checklist | **Attractive (Delighter)** | Visual completion feedback; unexpected polish. |
| Insert / Delete Rows & Columns | **Must-Be (Basic)** | Fundamental spreadsheet operation; its absence feels like a broken product. |
| Data Sorting | **One-Dimensional (Performance)** | More sort options = more data organization power, linearly. |
| Drag-Fill / Auto-Fill Handle | **One-Dimensional (Performance)** | Faster data entry = higher productivity, proportionally. |
| Cell Merge & Split | **Attractive (Delighter)** | Not expected at assignment scope; impresses with layout polish. |
| Data Filtering | **One-Dimensional (Performance)** | Better filtering = more data analysis power, linearly. |
| Advanced Formulas (IF, VLOOKUP) | **One-Dimensional (Performance)** | More formula functions = more analytical capability. |
| Data Validation | **Attractive (Delighter)** | Not expected; demonstrates data integrity awareness. |
| Cell Comments / Notes | **Attractive (Delighter)** | Adds annotation capability; unexpected for a student project. |
| Named Ranges | **Attractive (Delighter)** | Self-documenting formulas; advanced feature that impresses. |
| Mini Charts (Bar, Line, Pie) | **Attractive (Delighter)** | Extends Sparkline concept; transforms grid into analysis tool. |
| Print / Export to PDF | **Attractive (Delighter)** | Practical utility for offline sharing; professional touch. |

---

## 9. Value Proposition Canvas

### Customer Profile

**Jobs (by persona):**

*Student Builder (JTBD-SB1–SB4):*
- Scaffold the grid from a clear spec without rework (SB1)
- Isolate features to prevent cascading regressions (SB2)
- Trust phased architecture under deadline pressure (SB3)
- Demonstrate professional-grade planning in Loom demo (SB4)

*End User (JTBD-EU1–EU4):*
- Enter data immediately without instructions (EU1)
- Compute formulas reliably (EU2)
- Evaluate peer work without frustration (EU3)
- Recover from accidental tab close (EU4)

*Instructor (JTBD-IR1–IR3):*
- Grade submissions quickly and consistently (IR1)
- Assess planning rigor from video (IR2)
- Showcase exemplary work as class examples (IR3)

**Pains:**
- AI generates code that looks right but has subtle bugs (e.g., off-by-one in formulas)
- Hard to describe spreadsheet behavior precisely to AI (gap between "knowing" and "specifying")
- Features break each other when added incrementally
- Running out of time before reaching stretch goals

**Gains:**
- A working demo that impresses during Loom video and show-and-tell
- Learning how to effectively communicate requirements to AI coding partners
- Building something complex enough to feel proud of

### Value Map

**Products & Services:**
- Web-based spreadsheet with editable grid, formulas, and formatting
- Three-tier feature architecture (MVP → Stretch → High Ceiling)

**Pain Relievers:**
- Phased implementation reduces risk of cascading breakage
- Corner-case analysis prevents "it worked in the demo but broke on edge input" situations
- Formula error display (`#DIV/0!`, `#REF!`) gives clear feedback instead of silent failures

**Gain Creators:**
- Multi-sheet tabs and CSV import/export elevate submission beyond baseline
- Professional UI (formula bar, conditional formatting) creates "wow" during demo
- Keyboard navigation makes the app feel like a real tool, not a toy

---

## 10. Phased Roadmap

> Generated via `create-roadmap` MCP tool.

### Q1 2026 — MVP (Stage 0)

| Feature | Priority | Status |
|---------|----------|--------|
| 🔄 Editable Grid (Cells + Navigation) | 🔴 High | Active |
| 🔄 Text Entry & Data Types | 🔴 High | Active |
| 🔄 Cell Selection & Multi-select | 🔴 High | Active |
| 🔄 Basic Keyboard Navigation | 🔴 High | Active |
| 📋 Undo/Redo | 🟡 Medium | Planned |

### Q2 2026 — Stage 1 (Stretch Goals)

| Feature | Priority | Status |
|---------|----------|--------|
| 📋 Basic Formulas (SUM, AVERAGE, MIN, MAX, COUNT) | 🔴 High | Planned |
| 📋 Column/Row Resizing | 🟡 Medium | Planned |
| 📋 Cell Formatting (Bold, Color) | 🟡 Medium | Planned |
| 📋 Copy/Paste Support | 🟡 Medium | Planned |

### Q3 2026 — Stage 2 (High Ceiling)

| Feature | Priority | Status |
|---------|----------|--------|
| 📋 Multi-Sheet Tabs | 🔴 High | Planned |
| 📋 CSV Import/Export | 🔴 High | Planned |
| 📋 Formula Bar UI | 🟡 Medium | Planned |
| 📋 Cross-Sheet References | 🟡 Medium | Planned |
| 📋 Conditional Formatting | 🟢 Low | Planned |

### Q4 2026 — Stage 3 (Guided Onboarding Tour)

| Feature | Priority | Status |
|---------|----------|--------|
| 📋 Welcome Splash Screen | 🔴 High | Planned |
| 📋 7-Step Guided Tour (Tooltip Overlay) | 🔴 High | Planned |
| 📋 Element Spotlight & Overlay | 🟡 Medium | Planned |
| 📋 Re-launch Tour (Toolbar ❓) | 🟡 Medium | Planned |
| 📋 Onboarding State Persistence | 🟢 Low | Planned |

### Q1 2027 — Stage 4 (Grid Power)

| Feature | Priority | Status |
|---------|----------|--------|
| 📋 Insert / Delete Rows & Columns | 🔴 High | Planned |
| 📋 Data Sorting (A→Z, Z→A, Custom) | 🔴 High | Planned |
| 📋 Drag-Fill / Auto-Fill Handle | 🔴 High | Planned |
| 📋 Cell Merge & Split | 🟡 Medium | Planned |

### Q2 2027 — Stage 5 (Data Intelligence)

| Feature | Priority | Status |
|---------|----------|--------|
| 📋 Data Filtering (Auto-Filter per Column) | 🔴 High | Planned |
| 📋 Advanced Formulas (IF, VLOOKUP, COUNTIF, SUMIF) | 🔴 High | Planned |
| 📋 Data Validation (Dropdowns, Number Limits) | 🟡 Medium | Planned |
| 📋 Cell Comments / Notes | 🟡 Medium | Planned |

### Q3 2027 — Stage 6 (Polish & Power)

| Feature | Priority | Status |
|---------|----------|--------|
| 📋 Named Ranges | 🟡 Medium | Planned |
| 📋 Mini Charts (Bar, Line, Pie in Cell) | 🔴 High | Planned |
| 📋 Print / Export to PDF | 🟡 Medium | Planned |

---

## 11. Testing Plan per Phase

> Authored by: **QA Engineer** (ISTQB Foundation + IEEE 829)

### 11.1 MVP Testing Plan

**Entry Criteria:** Grid renders, cells accept input.
**Exit Criteria:** All MVP tests pass, zero Critical bugs.

| Test ID | Type | Scenario | Expected Result |
|---------|------|----------|-----------------|
| TC-001 | Smoke | App loads in Chrome | Grid visible with headers A-Z, 1-100 |
| TC-002 | Functional | Click cell B3 | B3 shows selected state |
| TC-003 | Functional | Type "Hello" into B3 | Text "Hello" visible in cell B3 |
| TC-004 | Functional | Press Tab from B3 | Cell C3 selected |
| TC-005 | Functional | Press Enter from C3 | Cell C4 selected |
| TC-006 | Functional | Press Escape during edit | Edit cancelled, previous value restored |
| TC-007 | Boundary | Press Arrow Up at row 1 | No movement, no error |
| TC-008 | Boundary | Press Tab at column Z | Wraps to column A, next row |
| TC-009 | Boundary | Paste 10,000 chars | Truncated at limit with warning |
| TC-010 | Regression | Scroll down 50 rows, scroll back | Previous data intact |
| TC-011 | Boundary | Press Right Arrow at column Z, row 50 | No movement or wrap to next row (match Tab behavior) |
| TC-012 | Boundary | Press Down Arrow at row 100 | No movement, no error |
| TC-013 | Functional | Select cell with data, start typing | Replaces existing content (not append) |
| TC-014 | Security | Enter `<script>alert(1)</script>` in a cell | Rendered as plain text, no script execution |
| TC-015 | Boundary | Enter `0` in a cell | Cell displays `0`, not empty |
| TC-016 | Functional | Double-click a cell with existing text "Hello World" | Cursor positioned inside text (EDITING mode); user can click to place cursor mid-word; arrow keys move within text, not between cells |
| TC-017 | State | While editing A1 with "Hello", click cell B2 | A1 auto-commits "Hello"; B2 becomes active cell (CC-009 auto-commit) |
| TC-018 | Boundary | Press F2 on empty cell | EDITING mode entered; empty input with cursor; Escape returns to VIEWING with no value |
| TC-019 | State | In VIEWING mode, type single char "x" | Cell enters EDITING mode with "x" as content; character appears exactly once (CC-013, no doubling) |
| TC-020 | Boundary | Press Shift+Tab at A1 | No movement, cell stays at A1 (CC-014) |
| TC-021 | Functional | Select range A1:C3 by dragging from C3 to A1 (reverse) | Selection perimeter border identical to A1→C3 drag (CC-010 normalization) |

### 11.2 Stage 1 Testing Plan

**Entry Criteria:** All MVP tests pass. Formula engine integrated.
**Exit Criteria:** All Stage 1 tests pass, MVP regression suite still green.

| Test ID | Type | Scenario | Expected Result |
|---------|------|----------|-----------------|
| TC-101 | Functional | `=SUM(A1:A3)` with A1=1, A2=2, A3=3 | Cell shows 6 |
| TC-102 | Functional | `=AVERAGE(A1:A3)` with A1=1, A2=2, A3=3 | Cell shows 2 |
| TC-103 | Functional | `=MIN(A1:A3)` with A1=1, A2=2, A3=3 | Cell shows 1 |
| TC-104 | Functional | `=MAX(A1:A3)` with A1=1, A2=2, A3=3 | Cell shows 3 |
| TC-105 | Boundary | `=SUM(A1:A3)` with A2="text" | Returns sum of numeric cells only (ignoring A2 = 4) |
| TC-106 | Error | `=SUM(A1:` (incomplete formula) | Displays `#ERROR!` |
| TC-107 | Error | `=A1/B1` where B1=0 | Displays `#DIV/0!` |
| TC-108 | Functional | Drag column B border to widen | Column B width increases |
| TC-109 | Boundary | Drag column to 0px width | Enforces minimum 30px |
| TC-110 | Functional | Select cell, click Bold | Text renders bold |
| TC-111 | Functional | Make 10 edits, press Ctrl+Z twice | All 10 edits reversed (5 steps per undo action) |
| TC-112 | Functional | Ctrl+C on A1:A3, Ctrl+V at B1 | B1:B3 contain A1:A3 values |
| TC-113 | Functional | Select cell, choose background color via picker | Cell background changes to selected color (FR-105) |
| TC-114 | Functional | `=A1+A2` where A1=3, A2=4 | Cell shows 7 (basic arithmetic, FR-101) |
| TC-115 | Functional | `=sum(a1:a3)` (lowercase function and refs) | Cell shows 6, same as uppercase (FR-101 case-insensitivity) |
| TC-116 | Functional | Type `=SU`, see autocomplete, press Down+Enter | SUM inserted into formula (FR-110) |
| TC-117 | Functional | `=VLOOKUP(` — unknown function autocomplete | No suggestion shown, no crash (FR-110 negative) |
| TC-118 | Functional | Enter `42.5` in cell | Right-aligned, detected as number (FR-108) |
| TC-119 | Functional | Select A1:A5 with 3 numbers, 2 text | Status bar shows Count=5, Sum=numeric sum, Avg=numeric average (FR-109) |
| TC-120 | Functional | Edit `=SUM(A1:A3)` — cells A1:A3 highlighted | A1:A3 show colored overlay/border (FR-111) |
| TC-121 | Functional | Select formula cell (not editing) — trace precedents | Referenced cells highlighted with directional indicators (FR-111) |
| TC-122 | Functional | Edit cell, wait 2s, check localStorage | Data saved; "Saved ✓" indicator shown (FR-112) |
| TC-123 | Integration | Save data, refresh page | All data, formulas, and formatting restored (FR-112) |
| TC-124 | Functional | Hover over cell with `=SUM(A1:A5)` | Tooltip: "Adds up all values from A1 to A5" (FR-113) |
| TC-125 | Functional | Copy cell with `=SUM(A1:A3)` from A4, paste to B4 | B4 contains `=SUM(B1:B3)` (relative reference shift, FR-107) |
| TC-126 | Security | Enter `=IMPORTRANGE(...)` in a cell | Displays `#NAME?` error (NFR-S01) |
| TC-127 | Security | Import CSV containing cell `=CMD(...)` | Cell stored as plain text, not evaluated (NFR-S02) |
| TC-128 | Security | Paste `<img onerror=alert(1)>` from external source | Rendered as plain text, no script execution (NFR-S03) |
| TC-129 | State | Click cell → type → Arrow keys | Arrow keys move cursor within cell text (EDITING mode), not navigate grid |
| TC-130 | State | Click+drag cells A1:C3 | Selection range highlighted with light blue fill; marching-ants border on range boundary; status bar shows aggregates (SELECTING mode) |
| TC-131 | State | Release mouse after drag selection | Returns to VIEWING mode with selection retained |
| TC-132 | Functional | Select cell with text, press Ctrl+B | Text renders bold; pressing Ctrl+B again removes bold (toggle behavior) |
| TC-133 | Visual | Enter `=SUM(A1:` (incomplete) — observe error display | `#ERROR!` displayed in soft rose text (`--sf-text-error`), visually distinct from normal cell content |
| TC-134 | Visual | Enter `=A1/B1` where B1=0 — observe `#DIV/0!` | Error displayed in soft rose text, consistent with TC-133 styling |
| TC-135 | State | In VIEWING mode, verify selected cell appearance | Cell shows solid 2px indigo border (`--sf-selection`) with glow (Visual Indicator per §4.2) |
| TC-136 | State | Enter EDITING mode by clicking cell — verify visual change | Cell border changes to input-style; blinking text cursor visible inside cell |
| TC-137 | Functional | Formula bar shows edit buffer live while typing `=SUM(A1:A3)` in cell | Formula bar value matches edit buffer in real-time (CC-114) |
| TC-138 | Functional | Click cell A1, then Shift+Click cell C5 | Selection extends from A1 to C5; name box shows `A1:C5`; status bar shows aggregates (CC-115) |
| TC-139 | Visual | Select cell with bold formatting, inspect Bold toolbar button | Button has `variant="secondary"` (visually pressed); `aria-pressed="true"` attribute present (CC-116) |
| TC-140 | Functional | Select cell without bold, inspect Bold toolbar button | Button has `variant="ghost"` (not pressed); `aria-pressed="false"` (CC-116 inverse) |
| TC-141 | Functional | Put "5" in A1, Ctrl+X A1, select B1, Ctrl+V | B1 shows "5"; A1 is now empty (cleared by cut); clipboard invalidated after cut-paste (CC-117) |
| TC-142 | Functional | Put "5" in A1, Ctrl+C A1, select B1, Ctrl+V, select C1, Ctrl+V | B1 shows "5", C1 shows "5" — copy (not cut) allows multiple pastes |
| TC-143 | Functional | Apply bold + red font color to A1 with value "Hello", edit A1 to "World", commit | A1 shows "World" with bold + red font color preserved (CC-118 format preservation) |
| TC-144 | Functional | Apply bg color yellow to A1, press Delete to clear | A1 cleared (value=null), cell removed from cells map; format also removed |
| TC-145 | Visual | Enter `$42.50` in cell | Cell right-aligned; detected as `currency` dataType (CC-120) |
| TC-146 | Visual | Enter `85%` in cell | Cell right-aligned; detected as `percentage` dataType (CC-120) |
| TC-147 | Visual | Enter `12/25/2026` in cell | Cell right-aligned; detected as `date` dataType; displayed in locale format (CC-109) |
| TC-148 | Functional | Type `=SU` in cell, autocomplete shows SUM; press ArrowDown | Autocomplete selection moves down; grid does not navigate (CC-119) |
| TC-149 | Functional | Type `=SUM` exactly — autocomplete dismissed (exact match) | Autocomplete hides when typed text exactly matches a single function name |
| TC-150 | Functional | Drag column resize handle on column A | Column width changes; undo (Ctrl+Z) reverts width back to original |
| TC-151 | Functional | Drag row resize handle on row 5 to increase height | Row 5 height increases; other row heights unchanged; value persists after save/restore |
| TC-152 | Boundary | Resize column to below 30px minimum | Column width clamped at 30px minimum (CC-106) |
| TC-153 | Functional | Type `=` in empty cell, click A1, type `+`, click B1, press Enter | Formula `=A1+B1` committed; cell shows computed result (FR-116, CC-121) |
| TC-154 | Regression | Type `hello` in cell, click another cell | `hello` committed in original cell; clicked cell selected in VIEWING mode (CC-123, CC-009) |

### 11.3 Stage 2 Testing Plan

**Entry Criteria:** All MVP + S1 tests pass. Multi-sheet engine integrated.
**Exit Criteria:** All Stage 2 tests pass, full regression suite green.

| Test ID | Type | Scenario | Expected Result |
|---------|------|----------|-----------------|
| TC-201 | Functional | Click "+" to add sheet | New sheet tab appears, grid switches |
| TC-202 | Functional | Right-click tab → Rename | Tab shows new name |
| TC-203 | Functional | Delete sheet with data | Confirmation dialog, sheet removed |
| TC-204 | Critical | `A1=B1, B1=A1` circular reference | Displays `#CIRCULAR!`, no infinite loop |
| TC-205 | Critical | Delete Sheet2, Sheet1 has `=Sheet2!A1` | Shows `#REF!` in dependent cells |
| TC-206 | Functional | Import CSV (100 rows × 10 cols) | Grid populated correctly |
| TC-207 | Boundary | Import CSV > 5MB | Warning shown, user can accept or cancel |
| TC-208 | Functional | Export grid as CSV | Downloaded file matches grid data |
| TC-209 | Functional | Conditional rule: value > 100 → red | Cells with values > 100 turn red |
| TC-210 | Regression | Full regression after all Stage 2 features | All MVP + S1 + S2 tests pass (covers: multi-sheet, CSV, conditional formatting, formula bar, range selection, freeze, dark mode, find/replace, sparklines) |
| TC-211 | Functional | Click cell A1 with formula, check formula bar | Formula bar shows raw formula; click B1 with value, formula bar shows value (FR-201) |
| TC-212 | Functional | Click+drag A1:C5, Ctrl+C, click D1, Ctrl+V | D1:F5 contains the copied range (US-207) |
| TC-213 | Functional | Freeze row 1, scroll down 50 rows | Row 1 headers remain visible at top (US-208) |
| TC-214 | Functional | Toggle dark mode, refresh page | Dark mode persists after refresh (US-210) |
| TC-215 | Functional | `=SPARKLINE(A1:A5)` with numeric data | Inline SVG mini-chart rendered in cell (US-212) |
| TC-216 | Functional | Click cell with `=SUM(A1:A3)`, edit formula in formula bar to `=SUM(A1:A5)`, press Enter | Cell updates to new formula result; cell and formula bar are synchronized (FR-201 editability) |
| TC-217 | Functional | Click cell, begin typing in formula bar, check cell simultaneously | Cell shows real-time updates matching formula bar input (FR-201 sync) |
| TC-218 | Functional | Click cell, begin editing in-cell, check formula bar simultaneously | Formula bar shows real-time updates matching in-cell input (FR-201 bidirectional sync) |

### 11.4 Stage 3 Testing Plan (Onboarding)

**Entry Criteria:** All MVP + S1 + S2 tests pass. Onboarding overlay implemented.
**Exit Criteria:** All Stage 3 tests pass, full regression suite green.

| Test ID | Type | Scenario | Expected Result |
|---------|------|----------|-----------------|
| TC-301 | Functional | First visit, clean localStorage | Welcome `Dialog` appears |
| TC-302 | Functional | Click "Start Tour" | Tour → Step 2 (Toolbar `Popover`) |
| TC-303 | Functional | Click "Next" 7 times | All steps complete sequentially |
| TC-304 | Functional | "Skip tour" at Step 3 | Overlay removed, localStorage set |
| TC-305 | Functional | "Skip" on welcome | No tour shown, localStorage set |
| TC-306 | Functional | After completion, find ❓ icon | `CircleHelp` button visible in toolbar |
| TC-307 | Visual | Step 2, inspect overlay | Dark backdrop + toolbar spotlight |
| TC-308 | Visual | Step 4, progress dots | 4th of 7 dots filled |
| TC-309 | Persistence | Complete, refresh | No welcome splash |
| TC-310 | Persistence | Clear localStorage, refresh | Welcome reappears |
| TC-311 | Boundary | Resize < 768px during tour | Tooltip stays visible |
| TC-312 | State | Escape during Step 5 | Tour dismissed |
| TC-313 | State | Ctrl+Z during tour | No undo; keyboard captured by overlay |
| TC-314 | Regression | After tour, enter data + formula | All grid features work |
| TC-315 | Regression | Full regression suite | MVP + S1 + S2 + S3 pass |
| TC-316 | Accessibility | Tab through tooltip | Focus trapped in tooltip |

### 11.5 Stage 4 Testing Plan (Grid Power)

**Entry Criteria:** All MVP + S1 + S2 + S3 tests pass. Insert/delete, sort, fill, merge implemented.
**Exit Criteria:** All Stage 4 tests pass, full regression suite green.

| Test ID | Type | Scenario | Expected Result |
|---------|------|----------|-----------------|
| TC-401 | Functional | Right-click row 3 → "Insert row above" | New row at position 3; previous row 3 becomes row 4; all data shifts down |
| TC-402 | Functional | Right-click row 3 → "Insert row below" | New row at position 4; row 3 unchanged |
| TC-403 | Functional | Right-click column B → "Insert column left" | New column B (empty); previous B becomes C; headers update |
| TC-404 | Functional | Right-click row 5 → "Delete row" | Row 5 removed; rows below shift up; data intact |
| TC-405 | Critical | Insert row above row 3; cell A5 has `=SUM(A1:A3)` | Formula adjusts to `=SUM(A1:A4)` (range expanded by insertion) |
| TC-406 | Critical | Delete row 2; cell A4 has `=A2+A3` | Formula shows `#REF!` for deleted reference |
| TC-407 | Functional | Undo after insert row | Inserted row removed; data restored to original layout |
| TC-408 | Boundary | Insert column at Z (column 26 already exists) | Toast: "Maximum 26 columns reached"; no insertion |
| TC-409 | Functional | Click column B header → Sort A→Z | All rows reorder by column B values (ascending) |
| TC-410 | Functional | Click column B header → Sort Z→A | All rows reorder by column B values (descending) |
| TC-411 | Functional | Sort column with mixed types (numbers, text, empty) | Numbers first (ascending), then text (alphabetical), then empty rows |
| TC-412 | Functional | Undo after sort | Rows revert to pre-sort order |
| TC-413 | Functional | Active cell shows fill handle (blue square at bottom-right) | 6×6px square visible; cursor becomes crosshair on hover |
| TC-414 | Functional | Fill handle drag: A1=1, A2=2 → drag down to A5 | A3=3, A4=4, A5=5 (arithmetic sequence detected) |
| TC-415 | Functional | Fill handle drag: A1="Hello" → drag down to A3 | A2="Hello", A3="Hello" (text copied verbatim) |
| TC-416 | Critical | Fill handle drag: A1=`=B1*2` → drag down to A3 | A2=`=B2*2`, A3=`=B3*2` (relative reference adjustment) |
| TC-417 | Functional | Select A1:C3, click Merge in toolbar | Single merged cell spans 3 cols × 3 rows; only A1 value visible |
| TC-418 | Functional | Click merged cell, click Unmerge | Cell splits back to 9 individual cells; A1 value stays; others empty |

### 11.6 Stage 5 Testing Plan (Data Intelligence)

**Entry Criteria:** All MVP + S1 + S2 + S3 + S4 tests pass. Filtering, advanced formulas, validation, comments implemented.
**Exit Criteria:** All Stage 5 tests pass, full regression suite green.

| Test ID | Type | Scenario | Expected Result |
|---------|------|----------|-----------------|
| TC-501 | Functional | Click Filter button (funnel icon) in toolbar | Column headers show ▼ dropdown arrows |
| TC-502 | Functional | Click ▼ on column B; uncheck "Apple" | Rows with "Apple" in column B are hidden |
| TC-503 | Functional | Type "Ban" in filter search input | Checkbox list filters to show only "Banana" |
| TC-504 | Functional | Click "Clear" in filter dropdown | All rows visible again; funnel icon returns to outline style |
| TC-505 | Functional | Status bar with active filter | Shows "Showing X of Y rows" |
| TC-506 | Functional | `=IF(A1>10, "High", "Low")` with A1=15 | Cell shows "High" |
| TC-507 | Functional | `=IF(A1>10, "High", "Low")` with A1=5 | Cell shows "Low" |
| TC-508 | Functional | `=VLOOKUP("Bob", A1:C5, 3, FALSE)` with A2="Bob", C2=85 | Cell shows 85 |
| TC-509 | Error | `=VLOOKUP("Zoe", A1:C5, 3, FALSE)` — not found | Cell shows `#N/A` |
| TC-510 | Error | `=VLOOKUP("Bob", A1:C5, 7, FALSE)` — col out of range | Cell shows `#REF!` |
| TC-511 | Functional | `=COUNTIF(A1:A10, ">5")` with 4 cells > 5 | Cell shows 4 |
| TC-512 | Functional | `=SUMIF(A1:A10, ">5", B1:B10)` | Cell shows sum of B values where A > 5 |
| TC-513 | Functional | `=CONCATENATE("Hello", " ", "World")` | Cell shows "Hello World" |
| TC-514 | Functional | `=LEFT("SheetForge", 5)` | Cell shows "Sheet" |
| TC-515 | Functional | `=LEN("Hello")` | Cell shows 5 |
| TC-516 | Functional | `=ROUND(3.14159, 2)` | Cell shows 3.14 |
| TC-517 | Functional | Set validation rule on A1: list ["Red", "Green", "Blue"] | A1 shows chevron; clicking opens dropdown with 3 options |
| TC-518 | Functional | Type "Purple" in validated cell A1 | Error toast: "Value must be one of: Red, Green, Blue" |
| TC-519 | Functional | Right-click A1 → "Add comment", type "Review this" | Orange triangle in A1 corner; hover shows "Review this" popover |
| TC-520 | Functional | Right-click commented cell → "Delete comment" | Orange triangle removed; hover shows nothing |
| TC-521 | Functional | `=AND(TRUE, TRUE, TRUE)` | Cell shows TRUE |
| TC-522 | Functional | `=OR(FALSE, FALSE, TRUE)` | Cell shows TRUE |
| TC-523 | Functional | `=IF(AND(A1>0, B1>0), "Both positive", "Not both")` with A1=5, B1=3 | Cell shows "Both positive" |
| TC-524 | Functional | `=TRIM("  hello   world  ")` | Cell shows "hello world" |
| TC-525 | Functional | `=NOT(TRUE)` | Cell shows FALSE |

### 11.7 Stage 6 Testing Plan (Polish & Power)

**Entry Criteria:** All MVP + S1 + S2 + S3 + S4 + S5 tests pass. Named ranges, mini charts, print implemented.
**Exit Criteria:** All Stage 6 tests pass, full regression suite green.

| Test ID | Type | Scenario | Expected Result |
|---------|------|----------|-----------------|
| TC-601 | Functional | Open Named Range Manager, add "Revenue" = B2:B10 | Named range appears in manager list |
| TC-602 | Functional | Type `=SUM(Revenue)` in cell | Cell shows sum of B2:B10 |
| TC-603 | Functional | Click Name Box dropdown | Shows list of named ranges; clicking one selects the range |
| TC-604 | Functional | Delete named range "Revenue"; cell has `=SUM(Revenue)` | Cell shows `#REF!` |
| TC-605 | Boundary | Create named range "SUM" | Toast: "Name conflicts with built-in function"; creation blocked |
| TC-606 | Boundary | Create named range "Total Revenue" (with space) | Toast: "Names must be alphanumeric + underscores only"; creation blocked |
| TC-607 | Functional | `=BARCHART(A1:A5)` with A1=10, A2=20, A3=30, A4=15, A5=25 | Inline SVG bar chart rendered in cell |
| TC-608 | Functional | `=PIECHART(A1:A5)` with 5 numeric values | Inline SVG pie chart with 5 colored segments |
| TC-609 | Visual | Hover over pie chart segment | Tooltip shows segment value and percentage |
| TC-610 | Boundary | `=BARCHART(A1:A5)` with all values = 0 | Flat/empty bar chart rendered, no error |
| TC-611 | Functional | Click Print button (printer icon) in toolbar | Print options dialog opens (orientation, paper size, range) |
| TC-612 | Functional | Select "Portrait" + "A4", click Print | Browser print dialog opens with formatted grid |
| TC-613 | Visual | Print preview: toolbar, tabs, status bar | All hidden in print view; only grid and headers visible |
| TC-614 | Regression | Full regression suite | MVP + S1 + S2 + S3 + S4 + S5 + S6 pass |

### 11.8 Cross-Stage Testing

> Source: QA Review — State Transition, A11y, Performance

| Test ID | Type | Scenario | Expected Result |
|---------|------|----------|-----------------|
| TC-A01 | Accessibility | Inspect DOM — all `<td>` elements | Each has `role="gridcell"` |
| TC-A02 | Accessibility | Run Lighthouse or axe-core | Contrast ratio ≥ 4.5:1 |
| TC-A03 | Accessibility | Tab through grid | Visible focus ring on every interactive element |
| TC-A04 | Accessibility | Inspect DOM — selected cell `<td>` | Has `aria-selected="true"`; other cells have `aria-selected="false"` or attribute absent |
| TC-A05 | Accessibility | Inspect DOM — `<td>` elements | Each has `aria-colindex` and `aria-rowindex` matching grid position |
| TC-A06 | Accessibility | Navigate cells with screen reader (VoiceOver/NVDA) | Cell selection changes announced via `aria-live` region (e.g., "Cell B3 selected") |
| TC-A07 | Accessibility | Enter `=SUM(A1:` — screen reader focus on error cell | Error message associated via `aria-describedby`; screen reader reads error type |
| TC-A08 | Accessibility | Measure toolbar buttons | All toolbar buttons ≥ 44×44px touch target (WCAG 2.5.5) |
| TC-A09 | Accessibility | Set `prefers-reduced-motion: reduce` in OS settings, trigger save animation | Animation is suppressed or replaced with instant transition |
| TC-P01 | Performance | Lighthouse audit on production build | Initial load < 2s |
| TC-P02 | Performance | Console.time around cell commit | Cell edit latency < 50ms |
| TC-P03 | Performance | Chrome DevTools during scroll | ≥ 30 FPS with 100 rows |
| TC-P04 | Performance | Fill 1,000 formula cells, change source | Recalc completes in < 200ms |

### Traceability Matrix (Summary)

```
MVP:
FR-001 → TC-001, TC-002, TC-003
FR-002 → TC-002, TC-016
FR-004 → TC-004, TC-005, TC-007, TC-008, TC-011, TC-012
FR-006 → TC-010

Stage 1:
FR-101 → TC-101, TC-102, TC-103, TC-104, TC-105, TC-106, TC-114, TC-115
FR-102 → TC-108
FR-103 → TC-109
FR-104 → TC-110, TC-111, TC-132
FR-105 → TC-113
FR-106 → TC-111
FR-107 → TC-112, TC-125
FR-108 → TC-118
FR-109 → TC-119
FR-110 → TC-116, TC-117
FR-111 → TC-120, TC-121
FR-112 → TC-122, TC-123
FR-113 → TC-124
NFR-S01 → TC-126
NFR-S02 → TC-127
NFR-S03 → TC-014, TC-128
Error Styling → TC-133, TC-134
Mode Indicators → TC-135, TC-136
Formula Bar Sync → TC-137 (CC-114)
Shift+Click Selection → TC-138 (CC-115)
Bold Visual State → TC-139, TC-140 (CC-116)
Cut/Paste → TC-141, TC-142 (CC-117)
Format Preservation → TC-143, TC-144 (CC-118)
Data Type Alignment → TC-145, TC-146, TC-147 (CC-120)
Autocomplete → TC-148, TC-149 (CC-119)
Resize Undo → TC-150, TC-151, TC-152 (CC-106)
Auto-Commit → TC-017 (CC-009)
Selection Normalization → TC-021 (CC-010)
F2 Editing → TC-018 (CC-011)
Printable Key Entry → TC-019 (CC-013)
Shift+Tab Boundary → TC-020 (CC-014)

Stage 2:
FR-201 → TC-211, TC-216, TC-217, TC-218
FR-202 → TC-201, TC-202, TC-203
FR-203 → TC-204, TC-205
FR-205 → TC-206, TC-207
FR-206 → TC-208
US-207 → TC-212
US-208 → TC-213
US-210 → TC-214
US-212 → TC-215

Stage 4:
FR-401 → TC-401, TC-402, TC-405, TC-407
FR-402 → TC-403, TC-408
FR-403 → TC-404, TC-406
FR-404 → TC-409
FR-405 → TC-410
FR-406 → TC-411, TC-412
FR-407 → TC-413
FR-408 → TC-414, TC-415, TC-416
FR-409 → TC-417
FR-410 → TC-418

Stage 5:
FR-501 → TC-501, TC-505
FR-502 → TC-502, TC-504
FR-503 → TC-503
FR-504 → TC-506, TC-507
FR-505 → TC-508, TC-509, TC-510
FR-506 → TC-511, TC-512
FR-507 → TC-513, TC-514, TC-515, TC-516
FR-508 → TC-517, TC-518
FR-510 → TC-519
FR-511 → TC-520
FR-512 → TC-521, TC-522, TC-523, TC-525
FR-513 → TC-524

Stage 6:
FR-601 → TC-601, TC-602, TC-604, TC-605, TC-606
FR-602 → TC-603
FR-603 → TC-607, TC-610
FR-604 → TC-608, TC-609
FR-606 → TC-611, TC-612
FR-605 → TC-613
FR-607 → (no dedicated test; verified via TC-613 print output)

Stage 4 (new):
FR-411 → (context menu tested implicitly via TC-401–TC-404, TC-409–TC-410, TC-519)

Cross-Stage Accessibility:
ARIA roles → TC-A01, TC-A04, TC-A05
ARIA live → TC-A06
ARIA describedby → TC-A07
WCAG touch targets → TC-A08
Reduced motion → TC-A09
Contrast → TC-A02
Focus → TC-A03
```

---

## 12. Assumptions & Hypotheses

| ID | Hypothesis | Validation Method | Status |
|----|-----------|-------------------|--------|
| H1 | We believe building the grid first provides a stable foundation for all subsequent features | Incremental feature testing after MVP | Untested |
| H2 | We believe AI-pair-programming produces working formula evaluation on first attempt for SUM/AVERAGE | Build formula engine, run test suite | Untested |
| H3 | We believe Google Antigravity IDE's web preview is sufficient for testing all features without separate deployment | Manual testing during development | Untested |
| H4 | We believe 3-5 hours is sufficient for MVP + at least 2 Stage 1 features | Time tracking during build | Untested |
| H5 | We believe copy/paste from external sources (Excel) will be the hardest corner case to handle | Test with clipboard data from Excel and Google Sheets | Untested |

---

## 13. Success Metrics

### North Star Metric

**Feature Completion Rate** — percentage of planned features that are fully functional at submission time.

### Supporting Metrics

| Metric | Definition | Baseline | Target | Tracking |
|--------|-----------|----------|--------|----------|
| Test Pass Rate | % of test cases passing | 0% | ≥ 95% | Manual QA |
| Corner Case Coverage | % of documented CCs with handling code | 0% | ≥ 80% for P0, ≥ 60% for P1 | Code review |
| Formula Accuracy | % of formula test cases returning correct value | 0% | 100% | Unit tests |
| Build Stability | Number of features that break previously working features | 0 | ≤ 1 regression per stage | Regression suite |

### Counter Metrics

| Counter Metric | Threshold | Alert If |
|---------------|-----------|----------|
| Time Spent | ≤ 5 hours total | Exceeds 6 hours (diminishing returns) |
| AI Iteration Loops | ≤ 5 prompts per feature | Feature taking > 10 prompts (start new chat) |

---

## 14. Timeline & Milestones

| Milestone | Target | Deliverables | Dependencies |
|-----------|--------|-------------|-------------|
| MVP Complete | Hour 1-2 | Working grid, navigation, text entry | None |
| Stage 1 Complete | Hour 2-4 | Formulas, resizing, formatting | MVP stable |
| Stage 2 (partial) | Hour 4-5 | Formula bar, multi-sheet OR CSV | Stage 1 stable |
| Loom Video Recorded | Hour 5 | 2-3 min video covering 4 sections | Working product |
| Submission | Before Week 3 class | Google Antigravity IDE link + Loom URL | All above |

---

## 15. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|:-----------:|:------:|-----------|
| AI generates subtly broken formula logic | High | High | Write explicit test cases per formula; test before moving on |
| Features break each other (regression) | Medium | High | Test after each feature addition; maintain undo capability |
| Google Antigravity IDE limitations (e.g., missing APIs) | Medium | Medium | Have fallback to pure HTML/JS/CSS approach |
| Time runs out before Stage 1 | Medium | Medium | Prioritize SUM formula over formatting (higher RICE score) |
| Circular formula reference causes infinite loop | Low | Critical | Implement cycle detection before any cross-reference feature |
| CSS breaks grid layout on resize | Medium | Medium | Test at multiple viewport sizes before proceeding |

---

## 16. Open Questions

| # | Question | Owner | Due Date | Status |
|---|---------|-------|----------|--------|
| 1 | ~~Should the grid use HTML `<table>` or CSS Grid / Canvas?~~ | Architect | Pre-build | ✅ Resolved — HTML `<table>` selected (§4.3 Grid Rendering ADR) |
| 2 | Does Google Antigravity IDE support clipboard API for paste? | Developer | Sprint 1 | Open |
| 3 | ~~What formula syntax does the instructor expect?~~ | PM | Pre-build | ✅ Resolved — Standard `=FUNCTION(range)` syntax with recursive-descent parser; case-insensitive (FR-101) |
| 4 | Should multi-sheet data persist across sessions? | PM | Sprint 2 | Open |

---

## 17. Handoff Notes

### To System Analyst (SRS)

| PRD Section | SA Action | SRS Section |
|-------------|-----------|-------------|
| User Stories (Sec 3) | Expand to functional specs | IEEE 830 Sec 3.2 |
| Non-Functional Req (Sec 4.2) | Add technical specs | SRS Sec 3.3-3.5 |
| Corner Cases (Sec 5) | Formalize as negative test specs | SRS Appendix |
| Success Metrics (Sec 13) | Define data collection | SRS Sec 3.1 |

### To Technical Architect

- Google Antigravity IDE constraints (runtime, available APIs, deployment model)
- Performance budget (cell edit < 50ms, formula recalc < 200ms)
- Browser compatibility matrix (Chrome primary, Safari/Firefox secondary)

### To UX/UI Designer

- Grid layout patterns (fixed headers, scroll behavior)
- Formatting toolbar placement (above grid vs. context menu)
- Color picker component (recommend: inline popover with curated 20-30 color swatches)
- Visual mode indicators per Keyboard Mode Machine (§4.2) — border styles, cursor states, selection highlights
- Empty state design (new workbook appearance)
- Error state styling (`#ERROR!`, `#REF!`, `#DIV/0!` — red text, icon treatment)
- Loading state (skeleton loader for initial grid render)
- Conditional formatting rule builder dialog design (§FR-204)
- Formula autocomplete dropdown behavior (position, max items, animation)
- Tooltip design (Formula Helper, toolbar button labels)
- Right-click context menu consideration (copy, paste, format actions)
- Typography recommendation (UI font + monospace for cell data)
- Dark mode as intentional design (separate color tokens, not CSS invert)
- **Design System v3:** Follow `--sf-*` token system documented in `.agent/workflows/shadcn-ui.md` §Design System v3
- **Brand:** SF gradient monogram + geometric wordmark (Outfit 700, -0.03em tracking)
- **Surfaces:** Pure white grid (light), zinc-950 grid (dark), floating toolbar with shadow/glow
- **Visual mockups:** See `visual_design_spec.md` for approved Figma-style layouts

**Stage 4–6 Handoff Items:**
- Context menu design (right-click on cells, rows, columns) with keyboard shortcut labels
- Filter dropdown component (checkbox list, search input, clear/select-all)
- Data validation dialog and dropdown chevron styling
- Comment popover design (add/edit/delete, timestamp, orange triangle indicator)
- Named range manager dialog layout
- Mini chart color palette (6-color HSL for bar, 7-segment max for pie)
- Print preview: light-mode-only forced theme

**→ Frontend Developer:**
- Component architecture: `ContextMenu`, `FilterDropdown`, `ValidationDropdown`, `CommentPopover`, `NamedRangeManager`, `FillHandle`
- Fill handle interaction spec (44×44px invisible hit area, preview tooltip, reverse fill)
- Filter dropdown positioning (anchored to column header ▼ arrow)
- Comment popover positioning relative to cell corner triangle
- Merge/unmerge toolbar button state management

**→ Backend Developer / Formula Engine:**
- IF/AND/OR/NOT/VLOOKUP/COUNTIF/SUMIF/CONCATENATE/LEFT/RIGHT/LEN/ROUND/TRIM implementation contract
- Named range resolution in formula tokenizer (must differentiate from cell refs and function names)
- BARCHART/PIECHART SVG rendering pipeline (reactive to data changes)
- Sort algorithm: stable sort with undo (store `previousOrder` in `SortState`)
- Insert/delete row/column: formula reference adjustment engine (including cross-sheet refs)

**PRD Review Status:** ☑ Approved after Multi-Agent Audit (v2.1.0)

---

## 18. DocEval Self-Assessment

> Scored against the 5-dimension PRD checklist (standard v1.0.0, IEEE 830 / INVEST).

| Dimension | Score | Status | Evidence |
|-----------|:-----:|:------:|----------|
| Problem Statement | 9/10 | 🟢 | Clear purpose (Sec 1), impact quantified via OKRs (KR1–KR7), urgency from deadline |
| User Needs | 10/10 | 🟢 | 3 personas (Sec 2.1), 11 JTBD (3-5 per type) with advanced formula, 11 outcomes per-persona, emotional/social summary |
| Requirements Quality (INVEST) | 10/10 | 🟢 | 47 user stories across 7 stages with acceptance criteria, MoSCoW prioritized, RICE scored; 26 FRs with testable criteria (+FR-411, FR-512, FR-513); 7 new data model types |
| Scope Definition | 10/10 | 🟢 | In-scope (6 stages + MVP), out-of-scope (4 items), 38 corner cases (Stages 4–6), implementation order defined per stage |
| Success Metrics | 9/10 | 🟢 | NSM defined, 4 supporting metrics with targets, 2 counter metrics |
| **OVERALL** | **9.6/10** | 🟢 | |

**Publication Status:** ☑ Approved — Audit-complete, all P0 fixes applied (v2.1.0)

---

## Appendix

### A. Glossary

| Term | Definition |
|------|-----------|
| **Google Antigravity IDE** | Google's AI-powered cloud IDE for building web/mobile apps |
| **JTBD** | Jobs to Be Done — framework for understanding user motivation |
| **RICE** | Reach × Impact × Confidence ÷ Effort — prioritization framework |
| **Kano Model** | Feature classification by satisfaction/dissatisfaction impact |
| **MoSCoW** | Must / Should / Could / Won't — priority ranking |
| **NSM** | North Star Metric — single KPI indicating value delivery |
| **INVEST** | Independent, Negotiable, Valuable, Estimable, Small, Testable |

### B. References

- Stanford TECH 42: Vibe Coding — Assignment 2: The Clone (ASSIGNMENT.md)
- Product Manager PRD Template (internal agent reference)
- Documentation Evaluation Checklist (internal agent reference)
- QA Test Planning Framework (internal agent reference)
- Corner-Case Analysis Framework (internal agent reference)

### C. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.1.0 | 2026-02-12 | Product Manager Agent | **Multi-Agent Audit Integration** — NFR-S01 whitelist expanded (+15 functions: IF, AND, OR, NOT, VLOOKUP, COUNTIF, SUMIF, CONCATENATE, LEFT, RIGHT, LEN, ROUND, TRIM, BARCHART, PIECHART). Data model extended (+7 types: MergedRegion, SortState, FilterState, ColumnFilter, ValidationRule, NamedRange, Cell.comment). RICE fix: Data Filtering moved S4→S5. Stage 4 FRs: +FR-411 context menu, keyboard shortcuts, undo-as-single-step, sort stability, fill WCAG 44×44px hit area, fill preview tooltip, reverse fill, cross-sheet ref adjustment. Stage 5 FRs: +FR-512 AND/OR/NOT, +FR-513 TRIM, IF nesting ↑7, VLOOKUP default FALSE, SUMIF wildcard/criterion, filter visual indicators, comment timestamps. Stage 6 FRs: named range regex, named range autocomplete, chart reactive updates, chart min-size fallback, print simplified to window.print(). KR5–KR7 added. Implementation order defined per stage. Handoff notes expanded for all roles. |
| 2.0.0 | 2026-02-12 | Product Manager Agent | **Stages 4–6 Killer Features** — New Epics E-05/E-06/E-07, +23 user stories (US-401→US-605), +22 functional requirements (FR-401→FR-608), +38 corner cases (CC-401→CC-612), +52 test cases (TC-401→TC-614), +11 RICE scores (top: Insert/Delete=1,805), +11 opportunity scores (all 🟢 Underserved, top: 19), +11 Kano entries, Q1–Q3 2027 roadmap. Won’t Have FR-X02 updated (mini charts now in-scope). Traceability matrix extended for all new stages. |
| 1.9.0 | 2026-02-11 | Product Manager Agent | Stage 3 Guided Onboarding Tour — New Epic E-04, +8 user stories (US-301→US-308), +8 functional requirements (FR-301→FR-308), +12 corner cases (CC-301→CC-312), +16 test cases (TC-301→TC-316), +4 RICE scores, +6 opportunity scores, +4 Kano entries, Q4 2026 roadmap block. Additive-only overlay design using shadcn/ui primitives (Dialog, Popover, Button, Kbd, Badge). Single new UI element: toolbar ❓ re-launch button |
| 1.8.0 | 2026-02-11 | QA Engineer | UI Corner Case Hardening — +7 MVP corner cases (CC-009→CC-015: auto-commit, selection normalization, F2, EDITING arrow keys, printable-key entry, Shift+Tab boundary, zero display), +7 Stage 1 corner cases (CC-114→CC-120: formula bar sync, name box range, bold visual state, cut vs copy, format preservation, autocomplete keyboard, data type alignment), +5 MVP test cases (TC-017→TC-021), +16 Stage 1 test cases (TC-137→TC-152), error display updated to soft rose tokens, selection border updated to indigo, traceability matrix expanded |
| 1.7.0 | 2026-02-11 | Product Manager Agent | Design System v3 — Visual identity (SF gradient monogram, geometric wordmark, Outfit/Geist fonts), `--sf-*` CSS token system (surfaces, text, selection, errors), dark/light mode tokens, toolbar 2-row layout spec, dark mode promoted from Stage 2 Could to Stage 1 Should (FR-115, US-118), Visual Design System NFR section added, UX/UI handoff updated with mockup references |
| 1.6.0 | 2026-02-11 | Product Manager Agent | UX Review Integration — Accessibility expanded (+5 WCAG items, +6 a11y tests), Keyboard Mode Machine gains Visual Indicator column + double-click behavior + Ctrl+B, US-201 clarified as editable formula bar (+3 sync tests), Dark Mode Kano corrected, UX/UI Designer handoff expanded (3→13 items), satisfaction score methodology disclosed, formula errors styled red (+2 visual tests), mode indicator tests (+2), double-click test (+1), renamed Firebase Studio → Google Antigravity IDE (×10) |
| 1.5.0 | 2026-02-11 | Product Manager Agent | QA Hardening — FR-101 expanded (arithmetic, case-insensitive), FR-107 expanded (relative refs), CC-007 fixed, CC-008 added, +24 test cases (15→31 S1, 10→15 S2, +7 cross-stage), traceability matrix complete, Open Questions Q1/Q3 closed |
| 1.4.0 | 2026-02-11 | Product Manager Agent | JTBD Expansion — 11 jobs (SB×4, EU×4, IR×3) using advanced formula, per-persona Desired Outcomes, emotional/social summary, Value Proposition Canvas refresh, DocEval User Needs 10/10 |
| 1.3.0 | 2026-02-11 | Product Manager Agent | Architecture Review Integration — §4.3 Technical Constraints (stack, grid ADR, clipboard), §4.4 Data Model (Cell/Sheet/Workbook schema), §4.2 expanded with security/keyboard/auto-save NFRs |
| 1.2.0 | 2026-02-11 | Product Manager Agent | Reviewer Feedback — Formula Helper Tooltip (S1), Sparkline promotion (Should), Trace Precedents extension, 2 new corner cases |
| 1.1.0 | 2026-02-11 | Product Manager Agent | Killer Features Update — 9 new user stories, 5 new FRs, 3 new corner cases, RICE/Opportunity/Kano extended |
| 1.0.0 | 2026-02-11 | Product Manager Agent | Initial version — 18 sections, 3 stages, 7-agent chain |
