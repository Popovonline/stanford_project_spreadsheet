# QA Engineer Review — SheetForge PRD v1.4.0

> **⚠️ Historical Document:** This review was conducted pre-build against PRD v1.4.0 (2026-02-11). Many of the identified gaps have since been addressed through expanded test coverage (15 test files, 500+ test cases) and PRD updates to v2.1.0. This document is preserved as a quality assurance decision record.

## Document Control

| Field | Value |
|-------|-------|
| **Reviewer** | QA Engineer |
| **Standard** | ISTQB Foundation · IEEE 829 · OWASP |
| **PRD Version Reviewed** | 1.4.0 (current PRD: v2.1.0) |
| **Date** | 2026-02-11 |
| **Status** | ✅ Substantially Resolved — Test suite expanded to 15 files, 500+ cases |

---

## Resolution Summary

The test suite has been expanded significantly since this review:
- **Unit tests:** 11 files covering formula engine (4 suites), helpers (3 suites), and state reducer (4 suites, including Stage 4–6 features)
- **E2E tests:** 4 Playwright suites covering features, grid selection, edge cases, and comprehensive cross-stage scenarios
- **PRD updates:** Corner cases expanded to 38+ (CC-001→CC-612), test cases expanded to 100+ (TC-001→TC-614) in PRD v2.1.0

---

## Executive Summary

The PRD testing plan (Section 11) covers **32 test cases** across 3 stages with a basic traceability matrix. This is a solid foundation. However, applying the QA Engineer's ISTQB test-design techniques — **Equivalence Partitioning, Boundary Value Analysis, Decision Tables, and State Transition** — reveals **42 missing test scenarios**, **9 untested corner cases**, and **6 traceability gaps** that, if unaddressed, will allow defects to ship undetected. Below is the full audit.

---

## Part I — MVP (Stage 0) Gap Analysis

### Current Coverage: 10 test cases (TC-001 → TC-010)

### 🔴 Missing Test Scenarios

| # | Gap | Missing Scenario | Technique | Severity |
|---|-----|-----------------|-----------|----------|
| M-01 | **Arrow key boundary — last column** | Press Right arrow at column Z, row 50 | BVA | Medium |
| M-02 | **Arrow key boundary — last row** | Press Down arrow at row 100 | BVA | Medium |
| M-03 | **Enter at last row** | Press Enter at row 100 — should stay or wrap? | BVA | Medium |
| M-04 | **Tab at Z100 (absolute boundary)** | Press Tab at cell Z100 — wrap to A1 or no-op? | BVA | Medium |
| M-05 | **Double-click to edit** | Double-click on cell to enter edit mode | Use Case | Low |
| M-06 | **Overwrite vs. append** | Select cell with data, start typing — replaces or appends? | Decision Table | High |
| M-07 | **Special characters** | Enter `<script>alert(1)</script>` in a cell | Security | High |
| M-08 | **Cell with only numeric 0** | Enter `0` — should display 0, not empty | EP | Medium |
| M-09 | **Leading/trailing spaces** | Enter `"  hello  "` — preserve or trim? | EP | Low |
| M-10 | **Very long single word** | Enter 200-character string without spaces — horizontal overflow? | BVA | Medium |
| M-11 | **Multi-line paste** | Paste text with newlines into a single cell | EP | Medium |
| M-12 | **Click on row/column header** | Click on "A" column header or "1" row header — any selection behavior? | Use Case | Low |
| M-13 | **Browser Back button** | Press browser Back during editing — data lost? | Use Case | Medium |
| M-14 | **Multiple rapid clicks** | Click 5 cells rapidly — last click wins without error? | Stress | Low |

### 🟡 Corner Case Gaps (Not in Section 5.1)

| # | Feature | Missing Corner Case | Expected Behavior | Severity |
|---|---------|--------------------|--------------------|----------|
| CCX-01 | Grid Render | App loads with existing localStorage data from a previous session | Grid populates from saved data (but MVP uses sessionStorage per CC-007?) | High |
| CCX-02 | Text Entry | User enters a formula string `=SUM(A1:A3)` during MVP (before formula engine exists) | Display as plain text `=SUM(A1:A3)`, not evaluate | High |
| CCX-03 | Cell Navigation | User holds Shift+Arrow — any selection behavior in MVP? | Specification gap — should be no-op or start range selection? | Medium |

### 🔴 Inaccuracy Found

> **CC-007 vs. FR-112 conflict:** CC-007 says "Session data preserved (sessionStorage)" but FR-112 says "Auto-save to localStorage." Section 4.2 Auto-Save strategy says localStorage with debounce. **CC-007 should say `localStorage`**, not `sessionStorage`. Additionally, CC-007 is MVP but FR-112 and US-115 (Auto-Save with Indicator) are Stage 1. **Which stage does data persistence actually belong to?**
>
> - FR-006 (MVP) says "Data persistence within session" — this implies sessionStorage or in-memory only.
> - FR-112 (Stage 1) says "Auto-save to localStorage with visual indicator."
> - **Resolution needed:** MVP should have in-memory/sessionStorage persistence (FR-006). Full localStorage auto-save is Stage 1 (FR-112). CC-007 should be reworded to match FR-006.

---

## Part II — Stage 1 Gap Analysis

### Current Coverage: 12 test cases (TC-101 → TC-112)

### 🔴 Missing Test Scenarios

| # | Gap | Missing Scenario | Technique | Severity |
|---|-----|-----------------|-----------|----------|
| S1-01 | **COUNT formula** | `=COUNT(A1:A5)` with A1=1, A2="text", A3=3, A4="", A5=5 — returns 3 (numbers only) | EP | High |
| S1-02 | **MIN/MAX with negative numbers** | `=MIN(A1:A3)` where A1=-5, A2=0, A3=5 — returns -5 | EP | Medium |
| S1-03 | **Formula referencing itself** | `=SUM(A1)` entered in A1 — self-reference | BVA | High |
| S1-04 | **Nested formula** | `=SUM(A1, MAX(B1:B3))` | EP | High |
| S1-05 | **Formula with single cell ref** | `=SUM(A1)` — just one cell, not a range | BVA | Low |
| S1-06 | **Formula with hardcoded value** | `=SUM(A1:A3, 10)` — range + literal mix | EP | Medium |
| S1-07 | **Case insensitivity** | `=sum(A1:A3)` vs `=SUM(A1:A3)` — same result? | EP | Medium |
| S1-08 | **Cell reference case** | `=SUM(a1:a3)` — lowercase cell reference | EP | Low |
| S1-09 | **Empty formula** | Type `=` then Enter — what happens? | BVA | Medium |
| S1-10 | **Formula with spaces** | `= SUM( A1 : A3 )` — spaces in formula | EP | Low |
| S1-11 | **Font color toggle** | Change font color → verify → Undo → verify restored | Functional | Medium |
| S1-12 | **Copy formula cell** | Copy cell with `=SUM(A1:A3)` to B4 — relative reference adjustment? | Decision Table | Critical |
| S1-13 | **Paste over existing data** | Paste range over cells that already have data — overwrite warning? | Use Case | Medium |
| S1-14 | **Undo after copy-paste** | Ctrl+C, Ctrl+V, then Ctrl+Z — reverts paste only | State Transition | Medium |
| S1-15 | **Status bar with mixed types** | Select A1:A5 where 2 cells have text, 3 have numbers — Count=5 or Count=3? | Decision Table | Medium |
| S1-16 | **Autocomplete selection** | Type `=S`, see suggestions, press Down+Enter to select SUM | Use Case | Medium |
| S1-17 | **Autocomplete with unknown function** | Type `=VLOOKUP(` — should show no suggestion, not crash | BVA | Medium |
| S1-18 | **Range highlighting color** | Edit `=SUM(A1:A3) + B5` — A1:A3 and B5 should have different highlight colors | Visual | Medium |
| S1-19 | **Auto-save timing** | Edit cell, wait 2s, check localStorage — saved? | Timing | High |
| S1-20 | **Auto-save restore** | Save data, refresh page — all data, formulas, and formatting restored? | Integration | Critical |
| S1-21 | **Auto-save size warning** | Fill 2,000+ cells with data to approach 4MB — warning appears? | BVA | Medium |
| S1-22 | **Formula tooltip on non-formula** | Hover on cell with plain text — no tooltip | Negative | Low |
| S1-23 | **Formula tooltip content accuracy** | `=AVERAGE(B1:B10)` → tooltip says "Calculates the average of B1 through B10" | Functional | Medium |
| S1-24 | **Trace precedents on chain** | A1 has `=B1`, B1 has `=C1` — tracing A1 shows B1, tracing B1 shows C1 (not transitive) | Decision Table | Medium |
| S1-25 | **Cell type — percentage** | Enter `50%` — auto-detected as percentage, stored as 0.5? | EP | Medium |
| S1-26 | **Cell type — currency variants** | Enter `€100` or `£50` — only `$` detected? | EP | Medium |

### 🟡 Corner Case Gaps (Not in Section 5.2)

| # | Feature | Missing Corner Case | Expected Behavior | Severity |
|---|---------|--------------------|--------------------|----------|
| CCX-11 | Formula | `=SUM()` — function with no arguments | Display `#ERROR!` | Medium |
| CCX-12 | Formula | `=SUM(A1:A1000)` — range exceeding grid (100 rows) | Either `#REF!` or sum only existing rows | High |
| CCX-13 | Copy/Paste | Cut (Ctrl+X) cell, then Ctrl+Z — source cell restored? | Undo restores cut source | Medium |
| CCX-14 | Formatting | Apply formatting to a cell, delete cell content — formatting persists? | Format should survive content deletion (Excel behavior) | Medium |
| CCX-15 | Auto-Save | Corrupted localStorage data on load | Start fresh with warning toast, don't crash | High |
| CCX-16 | Auto-Detect | Enter `1e10` (scientific notation) — number or text? | Should detect as number (10000000000) | Medium |

### 🔴 Traceability Gaps (Section 11.4)

The traceability matrix in the PRD is incomplete. Here are the unmapped requirements:

| Requirement | Description | Test Cases | Status |
|-------------|-------------|------------|--------|
| FR-104 | Bold formatting toggle | TC-110, TC-111 | ✅ Mapped |
| FR-105 | Background color picker | — | ❌ **No test case** |
| FR-106 | Undo/Redo stack (≥20 ops) | TC-111 (partial) | ⚠️ **Only tests bold undo; no test for 20-operation depth** |
| FR-107 | Copy/Paste | TC-112 | ✅ Mapped |
| FR-108 | Auto-detect cell data type | — | ❌ **No test case** |
| FR-109 | Status bar aggregates | — | ❌ **No test case** |
| FR-110 | Formula autocomplete | — | ❌ **No test case** |
| FR-111 | Range highlighting + Trace Precedents | — | ❌ **No test case** |
| FR-112 | Auto-save with indicator | — | ❌ **No test case** |
| FR-113 | Formula Helper Tooltip | — | ❌ **No test case** |

> **6 of 13 Stage 1 functional requirements have ZERO test cases.** This is a critical coverage gap. Per the QA Engineer test-planning standard (SKILL.md Step 5): *"Every FR-xxx must have ≥1 test case. Unmapped requirements = test gap."*

---

## Part III — Stage 2 Gap Analysis

### Current Coverage: 10 test cases (TC-201 → TC-210)

### 🔴 Missing Test Scenarios

| # | Gap | Missing Scenario | Technique | Severity |
|---|-----|-----------------|-----------|----------|
| S2-01 | **Formula bar editing** | Edit a formula in the formula bar (not inline) — commit with Enter | Functional | Medium |
| S2-02 | **Formula bar sync** | Click cell A1 (has formula), formula bar shows formula; click B1 (no formula), formula bar shows value | State Transition | Medium |
| S2-03 | **Sheet tab limit** | Add 20+ sheets — any limit? Performance? | BVA | Low |
| S2-04 | **Delete last remaining sheet** | Only Sheet1 exists — delete it | BVA | High |
| S2-05 | **Sheet name with special chars** | Rename sheet to `Sheet/1` or `Sheet!1` — conflicts with reference syntax? | Security | High |
| S2-06 | **Cross-sheet formula update** | Change value in Sheet2!A1 — formula `=Sheet2!A1` in Sheet1 recalculates | Integration | Critical |
| S2-07 | **Cross-sheet circular ref** | Sheet1!A1 = `=Sheet2!A1`, Sheet2!A1 = `=Sheet1!A1` | BVA | Critical |
| S2-08 | **CSV import with formulas** | CSV cell contains `=SUM(A1:A3)` — imported as text or formula? | Security (NFR-S02) | High |
| S2-09 | **CSV import with Unicode** | CSV with non-ASCII characters (日本語, émojis) | EP | Medium |
| S2-10 | **CSV import with quoted fields** | CSV field `"Hello, World"` — comma inside quotes handled correctly | EP | High |
| S2-11 | **CSV export with commas** | Cell contains `Hello, World` — exported with proper quoting | EP | High |
| S2-12 | **CSV export formulas** | CC-206 says export values, but no test validates this | Regression | High |
| S2-13 | **Range selection (drag)** | Select A1:C5, then Ctrl+C — copies entire range | Functional | Medium |
| S2-14 | **Freeze rows + scroll** | Freeze row 1, scroll down 50 rows — row 1 still visible | Functional | Medium |
| S2-15 | **Find & Replace** | Ctrl+F, search "hello", replace with "world" across entire grid | Functional | Medium |
| S2-16 | **Find across sheets** | Ctrl+F in Sheet1 — does it search Sheet2 too? | Decision Table | Medium |
| S2-17 | **Dark mode persistence** | Toggle dark mode, refresh page — dark mode still active? | Integration | Low |
| S2-18 | **Sparkline with non-numeric data** | `=SPARKLINE(A1:A5)` where A3="text" — skip text? #ERROR!? | EP | Medium |
| S2-19 | **Conditional format + dark mode** | Rule says "red background" — in dark mode, is contrast sufficient? | Accessibility | Low |

### 🟡 Corner Case Gaps (Not in Section 5.3)

| # | Feature | Missing Corner Case | Expected Behavior | Severity |
|---|---------|--------------------|--------------------|----------|
| CCX-21 | Multi-Sheet | Switch to Sheet2, add data, switch to Sheet1 — Sheet2 data preserved | Data persists across sheet switches | High |
| CCX-22 | CSV Import | Import CSV with 0 rows (empty file) | Show "empty file" warning, no crash | Medium |
| CCX-23 | CSV Import | Import CSV with 1,000+ columns (exceeds A-Z grid) | Truncate or expand columns? | High |
| CCX-24 | Conditional Format | Rule referencing a cell that gets deleted | Rule should become invalid/removable | Medium |

### 🔴 Traceability Gaps (Section 11.4)

| Requirement | Description | Test Case | Status |
|-------------|-------------|-----------|--------|
| FR-201 | Formula bar | — | ❌ **No test case** |
| FR-204 | Conditional formatting | TC-209 | ✅ Mapped |
| FR-205 | CSV import | TC-206, TC-207 | ✅ Mapped |
| FR-206 | CSV export | TC-208 | ✅ Mapped |
| US-207 | Range selection (drag) | — | ❌ **No test case** |
| US-208 | Freeze header rows | — | ❌ **No test case** |
| US-209 | External paste (TSV) | — | ❌ **No test case** (related to CC-107 but no S2 test) |
| US-210 | Dark mode toggle | — | ❌ **No test case** |
| US-211 | Find & Replace | — | ❌ **No test case** |
| US-212 | Sparkline | — | ❌ **No test case** |

> **6 of 12 Stage 2 user stories/requirements have ZERO test cases.** The Stage 2 testing plan is biased toward multi-sheet and CSV features, completely missing formula bar, range selection, freeze rows, dark mode, find/replace, and sparklines.

---

## Part IV — Cross-Stage Concerns

### 🔴 State Transition Testing Gap

The ARCHITECTURE_REVIEW.md defines 3 mutually exclusive keyboard modes (VIEWING → EDITING → SELECTING). The PRD incorporates this (Section 4.2, Keyboard Mode Machine). However, **no test case validates mode transitions.**

| # | Transition | Test Missing |
|---|-----------|-------------|
| ST-01 | VIEWING → EDITING (Click on cell) | TC-002 tests selection but not edit mode entry |
| ST-02 | EDITING → VIEWING (Escape) | TC-006 tests Escape but doesn't validate mode |
| ST-03 | EDITING → VIEWING (Enter commit) | Not tested explicitly |
| ST-04 | VIEWING → SELECTING (Click+drag) | No test case exists |
| ST-05 | SELECTING → VIEWING (Mouse up) | No test case exists |
| ST-06 | EDITING mode keyboard (Arrow keys type characters, not navigate) | No test case — this is a common bug source |

### 🔴 Security Testing Gap

The PRD defines 3 Security NFRs (NFR-S01, S02, S03) but Section 11 has **zero security test cases.**

| NFR | Description | Required Test |
|-----|-------------|---------------|
| NFR-S01 | Formula parser whitelist | Enter `=IMPORTRANGE(...)` → shows `#NAME?` |
| NFR-S02 | CSV import treats `=` values as text | Import CSV with `=CMD` cell → stored as text |
| NFR-S03 | External paste sanitizes HTML | Paste `<script>alert(1)</script>` → rendered as plain text |

### 🟡 Accessibility Testing Gap

Section 4.2 lists 4 accessibility requirements (ARIA roles, contrast, focus indicators, keyboard-only). **No test case validates any of them.**

| # | A11y Requirement | Required Test |
|---|-----------------|---------------|
| A-01 | `role="gridcell"` on cells | Inspect DOM — all `<td>` have `role="gridcell"` |
| A-02 | Contrast ≥ 4.5:1 | Lighthouse or axe-core audit |
| A-03 | Focus indicators | Tab through grid — visible focus ring on every cell |
| A-04 | Keyboard-only navigation | Complete all MVP tasks without mouse |

### 🟡 Performance Testing Gap

Section 4.2 defines 4 performance targets. **No test case validates any of them.**

| # | Target | Required Test |
|---|--------|---------------|
| P-01 | Initial load < 2s | Lighthouse audit on production build |
| P-02 | Cell edit latency < 50ms | Console.time around cell commit |
| P-03 | Scroll ≥ 30 FPS | Chrome DevTools Performance panel during scroll |
| P-04 | Formula recalc < 200ms for 1,000 cells | Fill 1,000 formula cells, change source, measure recalc |

---

## Part V — Inaccuracies & Inconsistencies

| # | Location | Issue | Recommended Fix |
|---|----------|-------|-----------------|
| I-01 | **CC-007** | Says "sessionStorage" but FR-112 and Auto-Save strategy say "localStorage" | Change CC-007 to: "Data persists in memory within session (MVP). Full localStorage auto-save in Stage 1." |
| I-02 | **TC-105** | Says `=SUM(A1:A3)` with A2="text" returns "sum of numeric cells only (4)" — but A1=1, A3=3 → 1+3=4 ✅ | Value is correct, but the description should explicitly state "ignores A2, sums A1+A3" for clarity |
| I-03 | **Traceability Matrix** | FR-201 is listed as `→ TC-206, TC-207, TC-208` but FR-201 is "Formula bar displaying active cell content" while TC-206-208 are CSV tests | FR-201 should map to a formula bar test case (currently missing). The matrix should read: `FR-205 → TC-206, TC-207` and `FR-206 → TC-208` |
| I-04 | **Roadmap (Sec 10)** | MVP lists "Undo/Redo" as Planned, but Undo/Redo is FR-106 (Stage 1, Should Have) | Remove Undo/Redo from MVP roadmap or clarify it's preliminary |
| I-05 | **Stage 2 tests** | TC-210 says "Full regression after all Stage 2 features — All MVP + S1 + S2 tests pass" but doesn't list which S2 features are in scope | Enumerate the S2 features covered by regression, or add individual tests for untested features |
| I-06 | **Open Questions** | Q1 asks "Should the grid use HTML table or CSS Grid/Canvas?" but Section 4.3 already resolves this as HTML `<table>` | Close Q1 as Resolved, reference Section 4.3 |
| I-07 | **Open Questions** | Q3 asks about formula syntax, but Section 4.3 already specifies Vitest testing with recursive-descent parser | Close Q3 as Resolved — standard `=FUNCTION(range)` syntax adopted |
| I-08 | **CC-104** | `=A1/A2` is listed but simple arithmetic (`=A1+A2`, `=A1*A2`) is never specified as a supported feature | Clarify whether basic arithmetic operators (+, -, *, /) are supported alongside named functions. If yes, add to FR-101. If no, `=A1/A2` in CC-104 is testing an unsupported feature. |

---

## Part VI — Recommendations Summary

### Priority Actions (Before Build)

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 1 | **Fix CC-007 persistence terminology** (sessionStorage → in-memory for MVP) | Removes spec confusion | 5 min |
| 2 | **Add test cases for 6 unmapped Stage 1 FRs** (FR-105, 108, 109, 110, 111, 112, 113) | Closes critical traceability gap | 30 min |
| 3 | **Add test cases for 6 unmapped Stage 2 features** (formula bar, range selection, freeze, dark mode, find/replace, sparklines) | Closes coverage gap | 30 min |
| 4 | **Add 3 security test cases** for NFR-S01, S02, S03 | Prevents formula injection, CSV injection, XSS | 15 min |
| 5 | **Fix traceability matrix** (FR-201 mislinked to CSV tests) | Prevents test audit failure | 5 min |
| 6 | **Close resolved Open Questions** (Q1 and Q3 are answered in §4.3) | Reduces confusion for developers | 5 min |
| 7 | **Clarify arithmetic operator support** (CC-104 tests `=A1/A2` but no FR covers it) | Spec gap | 10 min |
| 8 | **Add state transition tests** for keyboard mode machine | Prevents mode-confusion bugs | 20 min |

### Test Case Count After Fixes

| Stage | Current | Missing | Target |
|-------|:-------:|:-------:|:------:|
| MVP | 10 | +14 | **24** |
| Stage 1 | 12 | +26 | **38** |
| Stage 2 | 10 | +19 | **29** |
| Cross-Stage (Security, A11y, Performance, State) | 0 | +13 | **13** |
| **Total** | **32** | **+72** | **104** |

---

## Verdict

| Dimension | Score | Comment |
|-----------|:-----:|---------|
| Happy-path coverage | 7/10 | Core flows covered; some formula variants and new Stage 1 features lack tests |
| Negative/error-path coverage | 6/10 | `#ERROR!`, `#DIV/0!` covered; missing `#NAME?`, self-reference, empty formula |
| Boundary value coverage | 5/10 | Some boundaries tested (row 1, column Z); many missing (row 100, column A, Z100, 0px width) |
| Traceability | 4/10 | 12 of 25 FRs/USs have no mapped test case; matrix has one incorrect mapping |
| Security testing | 1/10 | 3 NFRs defined, 0 test cases |
| Accessibility testing | 0/10 | 4 requirements defined, 0 test cases |
| Performance testing | 0/10 | 4 targets defined, 0 test cases |
| State transition testing | 0/10 | 3-mode machine defined, 0 transition tests |
| **Overall Readiness** | **3.5/10** | **Not ready for build without test plan expansion** |

> **Bottom Line:** The PRD's feature specification is excellent (9.4/10 per DocEval). The testing plan is a good starting skeleton but covers only ~30% of what a QA Engineer would require for a Go decision. The 8 priority actions above would raise coverage to ~85% and make the testing plan build-ready.

---

*Reviewed by: QA Engineer — ISTQB Foundation · IEEE 829*
