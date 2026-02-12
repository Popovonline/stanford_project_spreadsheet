---
description: How to use Shadcn UI in this project
---

# Shadcn UI Workflow

Shadcn UI is the **component library** for this project. Always use it for UI components instead of building custom ones from scratch.

> **Key Concept:** Shadcn is NOT a traditional npm dependency — components are **copied directly** into `@/components/ui/` and become part of your source code. This means they are fully customizable.

---

## Project Configuration

This project's `components.json` is already initialized with:

| Setting        | Value         |
|----------------|---------------|
| Style          | `new-york`    |
| RSC            | `true`        |
| TSX            | `true`        |
| Icon Library   | `lucide`      |
| Base Color     | `neutral`     |
| CSS Variables  | `true`        |
| CSS File       | `app/globals.css` |
| UI Path        | `@/components/ui` |
| Utils Path     | `@/lib/utils` |
| Hooks Path     | `@/hooks`     |

---

## Installation Commands

### Initialize (for new projects only)

// turbo
```bash
npx -y shadcn@latest init --defaults --yes
```

### Add a Single Component

// turbo
```bash
npx -y shadcn@latest add <component-name>
```

### Add Multiple Components at Once

// turbo
```bash
npx -y shadcn@latest add button card input label dialog table select tabs sheet sonner tooltip popover dropdown-menu context-menu separator badge checkbox
```

### Update an Existing Component

// turbo
```bash
npx -y shadcn@latest add <component-name> --overwrite
```

---

## Core Usage Rules

1. **Always prefer Shadcn components** over custom implementations.
2. **Import from** `@/components/ui/<component>` — never from `node_modules`.
3. **Use `cn()`** from `@/lib/utils` for conditional class merging:
   ```tsx
   import { cn } from "@/lib/utils"

   <div className={cn("base-class", isActive && "active-class")} />
   ```
4. **Use Lucide icons** (configured in `components.json`):
   ```tsx
   import { PlusIcon, TrashIcon } from "lucide-react"
   ```
5. **Mark components `"use client"`** when they use React hooks, event handlers, or browser APIs. Shadcn components using Radix primitives generally need this.

---

## Complete Component Catalog

### Layout & Structure

| Component         | Install Name       | Use For |
|-------------------|--------------------|---------|
| **Card**          | `card`             | Content containers, panels, info sections |
| **Separator**     | `separator`        | Visual dividers between sections |
| **Resizable**     | `resizable`        | Resizable panel layouts (sidebars, split views) |
| **Scroll Area**   | `scroll-area`      | Custom scrollable containers |
| **Collapsible**   | `collapsible`      | Expandable/collapsible content sections |
| **Aspect Ratio**  | `aspect-ratio`     | Maintaining width:height ratios |
| **Sidebar**       | `sidebar`          | Application sidebar navigation |

### Navigation

| Component             | Install Name        | Use For |
|-----------------------|---------------------|---------|
| **Tabs**              | `tabs`              | Switching between views/panels |
| **Navigation Menu**   | `navigation-menu`   | Top-level app navigation |
| **Breadcrumb**        | `breadcrumb`        | Hierarchical location indicators |
| **Pagination**        | `pagination`        | Page-based navigation controls |
| **Menubar**           | `menubar`           | Application menu bars (File, Edit, View…) |

### Forms & Inputs

| Component           | Install Name      | Use For |
|---------------------|-------------------|---------|
| **Button**          | `button`          | All clickable actions |
| **Input**           | `input`           | Text input fields |
| **Textarea**        | `textarea`        | Multi-line text input |
| **Label**           | `label`           | Form field labels |
| **Checkbox**        | `checkbox`        | Boolean toggles |
| **Radio Group**     | `radio-group`     | Single-choice selection |
| **Select**          | `select`          | Dropdown selection |
| **Native Select**   | `native-select`   | Browser-native select (mobile-friendly) |
| **Switch**          | `switch`          | On/off toggles |
| **Slider**          | `slider`          | Range value input |
| **Toggle**          | `toggle`          | Stateful on/off button |
| **Toggle Group**    | `toggle-group`    | Group of toggles (e.g., bold/italic/underline) |
| **Input OTP**       | `input-otp`       | One-time password fields |
| **Calendar**        | `calendar`        | Date picker calendar |
| **Date Picker**     | `date-picker`     | Date selection with popover |
| **Combobox**        | `combobox`        | Searchable select (autocomplete) |
| **Form**            | `form`            | Form wrapper with validation (react-hook-form + zod) |
| **Field**           | `field`           | Form field container with label/description/errors |
| **Input Group**     | `input-group`     | Input with prefix/suffix addons |
| **Button Group**    | `button-group`    | Grouped related buttons |

### Overlays & Modals

| Component           | Install Name      | Use For |
|---------------------|-------------------|---------|
| **Dialog**          | `dialog`          | Modal windows, confirmations |
| **Alert Dialog**    | `alert-dialog`    | Confirmation before destructive actions |
| **Sheet**           | `sheet`           | Slide-in panels (settings, detail views) |
| **Drawer**          | `drawer`          | Bottom/side drawers (mobile-friendly) |
| **Popover**         | `popover`         | Rich floating content (formatting panels) |
| **Hover Card**      | `hover-card`      | Preview content on hover |
| **Tooltip**         | `tooltip`         | Small text hints on hover/focus |

### Menus

| Component           | Install Name      | Use For |
|---------------------|-------------------|---------|
| **Dropdown Menu**   | `dropdown-menu`   | Actions triggered by a button click |
| **Context Menu**    | `context-menu`    | Right-click context actions |
| **Command**         | `command`         | Command palette / searchable action lists |

### Data Display

| Component     | Install Name | Use For |
|---------------|--------------|---------|
| **Table**     | `table`      | Static data tables |
| **Data Table**| `data-table` | Advanced tables with TanStack (sort, filter, paginate) |
| **Badge**     | `badge`      | Status labels, tags, counts |
| **Avatar**    | `avatar`     | User profile images |
| **Skeleton**  | `skeleton`   | Loading state placeholders |
| **Spinner**   | `spinner`    | Loading indicators |
| **Empty**     | `empty`      | Empty state illustrations |
| **Chart**     | `chart`      | Data visualization (Recharts wrapper) |
| **Carousel**  | `carousel`   | Swipeable content slides |
| **Typography**| `typography`  | Pre-styled heading/paragraph elements |
| **Kbd**       | `kbd`        | Keyboard shortcut display |
| **Item**      | `item`       | Reusable list items |

### Feedback

| Component     | Install Name | Use For |
|---------------|--------------|---------|
| **Sonner**    | `sonner`     | Toast notifications (preferred over Toast) |
| **Toast**     | `toast`      | Toast notifications (legacy) |
| **Alert**     | `alert`      | Inline warning/info/error messages |
| **Progress**  | `progress`   | Progress bars |

---

## Component Usage Patterns & Code Examples

### Button

```tsx
import { Button } from "@/components/ui/button"

// Variants: default | destructive | outline | secondary | ghost | link
// Sizes: default | sm | lg | icon
<Button variant="outline" size="sm">Save</Button>

// With icon — use data-icon attribute for correct spacing
<Button>
  <PlusIcon data-icon="inline-start" />
  Add Row
</Button>

// Icon-only button
<Button variant="ghost" size="icon">
  <TrashIcon />
</Button>

// As a link using asChild
<Button asChild>
  <Link href="/settings">Settings</Link>
</Button>

// Loading state with Spinner
<Button disabled>
  <Spinner data-icon="inline-start" />
  Saving...
</Button>
```

### Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Edit Cell Format</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Cell Formatting</DialogTitle>
      <DialogDescription>
        Configure how this cell displays its data.
      </DialogDescription>
    </DialogHeader>
    {/* Form content here */}
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button>Apply</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Context Menu (right-click)

```tsx
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

<ContextMenu>
  <ContextMenuTrigger className="w-full h-full">
    {/* Spreadsheet cell or region */}
  </ContextMenuTrigger>
  <ContextMenuContent className="w-56">
    <ContextMenuItem>
      Cut <ContextMenuShortcut>⌘X</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>
      Copy <ContextMenuShortcut>⌘C</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>
      Paste <ContextMenuShortcut>⌘V</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem>Insert Row Above</ContextMenuItem>
    <ContextMenuItem>Insert Row Below</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">Delete Row</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

### Dropdown Menu

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Format</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuGroup>
      <DropdownMenuLabel>Cell Format</DropdownMenuLabel>
      <DropdownMenuItem>Bold <DropdownMenuShortcut>⌘B</DropdownMenuShortcut></DropdownMenuItem>
      <DropdownMenuItem>Italic <DropdownMenuShortcut>⌘I</DropdownMenuShortcut></DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuCheckboxItem checked={wordWrap} onCheckedChange={setWordWrap}>
      Word Wrap
    </DropdownMenuCheckboxItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Tooltip

> **⚠️ Setup Required:** Wrap your root layout with `<TooltipProvider>`.

```tsx
// In layout.tsx:
import { TooltipProvider } from "@/components/ui/tooltip"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}

// Usage:
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon">
      <BoldIcon />
    </Button>
  </TooltipTrigger>
  <TooltipContent>
    <p>Bold (⌘B)</p>
  </TooltipContent>
</Tooltip>
```

### Popover

```tsx
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Cell Color</Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-3" align="start">
    {/* Color picker grid content */}
  </PopoverContent>
</Popover>
```

### Sonner (Toast Notifications) — Preferred

> **⚠️ Setup Required:** Add `<Toaster />` to your root layout.

```tsx
// In layout.tsx:
import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  )
}

// Usage — import from "sonner" directly, NOT from UI:
import { toast } from "sonner"

// Simple
toast("Spreadsheet saved.")

// Success
toast.success("Changes saved successfully.")

// Error
toast.error("Failed to save. Please try again.")

// With description
toast("Row deleted", {
  description: "Undo within 5 seconds.",
  action: {
    label: "Undo",
    onClick: () => handleUndo(),
  },
})

// Promise-based
toast.promise(saveSpreadsheet(), {
  loading: "Saving...",
  success: "Saved!",
  error: "Save failed.",
})
```

### Menubar (File/Edit/View app menus)

```tsx
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  MenubarCheckboxItem,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
} from "@/components/ui/menubar"

<Menubar>
  <MenubarMenu>
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>New <MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
      <MenubarItem>Open <MenubarShortcut>⌘O</MenubarShortcut></MenubarItem>
      <MenubarSeparator />
      <MenubarItem>Save <MenubarShortcut>⌘S</MenubarShortcut></MenubarItem>
      <MenubarItem>Export as CSV</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu>
    <MenubarTrigger>Edit</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Undo <MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
      <MenubarItem>Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut></MenubarItem>
      <MenubarSeparator />
      <MenubarItem>Cut <MenubarShortcut>⌘X</MenubarShortcut></MenubarItem>
      <MenubarItem>Copy <MenubarShortcut>⌘C</MenubarShortcut></MenubarItem>
      <MenubarItem>Paste <MenubarShortcut>⌘V</MenubarShortcut></MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>
```

### Tabs

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="sheet1">
  <TabsList>
    <TabsTrigger value="sheet1">Sheet 1</TabsTrigger>
    <TabsTrigger value="sheet2">Sheet 2</TabsTrigger>
  </TabsList>
  <TabsContent value="sheet1">{/* Grid */}</TabsContent>
  <TabsContent value="sheet2">{/* Grid */}</TabsContent>
</Tabs>
```

### Select

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<Select defaultValue="general">
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Format" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="general">General</SelectItem>
    <SelectItem value="number">Number</SelectItem>
    <SelectItem value="currency">Currency</SelectItem>
    <SelectItem value="percentage">Percentage</SelectItem>
    <SelectItem value="date">Date</SelectItem>
    <SelectItem value="text">Text</SelectItem>
  </SelectContent>
</Select>
```

### Toggle Group (Formatting toolbar)

```tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react"

<ToggleGroup type="multiple" value={formatting} onValueChange={setFormatting}>
  <ToggleGroupItem value="bold" aria-label="Toggle bold">
    <BoldIcon />
  </ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Toggle italic">
    <ItalicIcon />
  </ToggleGroupItem>
  <ToggleGroupItem value="underline" aria-label="Toggle underline">
    <UnderlineIcon />
  </ToggleGroupItem>
</ToggleGroup>
```

### Kbd (Keyboard Shortcut Display)

```tsx
import { Kbd } from "@/components/ui/kbd"

<Kbd>⌘C</Kbd>  // Displays styled keyboard shortcut
```

---

## SheetForge-Specific Component Map

Use this table to decide which Shadcn component maps to each SheetForge feature:

| SheetForge Feature            | Shadcn Component(s)                   | Status      |
|-------------------------------|---------------------------------------|-------------|
| Toolbar buttons (undo/redo)   | `Button` (ghost, icon-sm)             | ✅ Done      |
| Bold toggle                   | `Button` (ghost/secondary, icon-sm)   | ✅ Done      |
| Color pickers (font/bg)       | `Popover`, `Button`                   | ✅ Done      |
| Toolbar separators            | `Separator` (vertical)                | ✅ Done      |
| Toolbar tooltips              | `Tooltip`, `TooltipContent`           | ✅ Done      |
| Status bar aggregates         | `Separator` (vertical)                | ✅ Done      |
| Save status indicators        | Lucide icons (Check, Loader2, Alert)  | ✅ Done      |
| Formula bar icon              | Lucide `FunctionSquare`               | ✅ Done      |
| Cell right-click menu         | `ContextMenu`                         | 🔲 Planned   |
| File / Edit / View menus      | `Menubar`                             | 🔲 Planned   |
| Sheet tabs                    | `Tabs`                                | 🔲 Planned   |
| Formula autocomplete          | `Command` or `Combobox`               | 🔲 Planned   |
| Cell format dialog            | `Dialog`, `Select`, `Input`, `Label`  | 🔲 Planned   |
| Settings panel                | `Sheet` or `Dialog`                   | 🔲 Planned   |
| Notifications (save, error)   | `Sonner`                              | 🔲 Planned   |
| Delete/overwrite confirmation | `AlertDialog`                         | 🔲 Planned   |
| Keyboard shortcut hints       | `Tooltip`, `Kbd`                      | 🔲 Planned   |

---

## SheetForge Design System v3

> **Approved visual direction:** Notion / Linear / Airtable — smooth, minimal, premium.
> All new UI work MUST follow these tokens. Do NOT use hardcoded hex colors.

### Brand Identity

| Element | Specification |
|---------|---------------|
| **SF Monogram** | Overlapping "S" + "F" inside a rounded-square, gradient from indigo `#6366F1` to violet `#8B5CF6`. Used as app icon. |
| **Wordmark Font** | Geometric bold sans-serif (Outfit 700 or Geist 700), letter-spacing `-0.03em`, size `20px` |
| **Wordmark Color** | Charcoal `#18181B` (light mode) / White `#FAFAFA` (dark mode) |
| **Accent Color** | Light: `#6366F1` (indigo-500) / Dark: `#818CF8` (indigo-400) |

### Surface Tokens

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--sf-bg` | `#FFFFFF` | `#09090B` | Page / grid background |
| `--sf-toolbar` | `#FAFAF9` | `#18181B → #1F1F23` gradient | Toolbar surface |
| `--sf-toolbar-shadow` | `0 1px 3px rgba(0,0,0,0.05)` | `0 1px 0 rgba(99,102,241,0.15)` | Toolbar bottom edge |
| `--sf-header-row` | transparent | `#111113` | Column/row header surface |
| `--sf-input` | `#F4F4F5` (zinc-100) | `#27272A` (zinc-800) | Formula bar, cell ref pill |
| `--sf-gridline` | `#EFEFEF` | `#27272A` | Cell borders (ultra-subtle) |
| `--sf-separator` | `#E4E4E7` | `#3F3F46` | Toolbar vertical dividers |

### Text Hierarchy

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--sf-text-primary` | `#18181B` | `#FAFAFA` | Cell content, wordmark |
| `--sf-text-muted` | `#71717A` | `#71717A` | Icons, doc title, secondary labels |
| `--sf-text-placeholder` | `#A1A1AA` | `#52525B` | Formula bar placeholder, status bar |
| `--sf-text-error` | `#F43F5E` (rose-500) | `#FDA4AF` (rose-300) | Formula errors |
| `--sf-text-success` | `#22C55E` (green-500) | `#4ADE80` (green-400) | Save indicator dot |

### Selection & Focus

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--sf-selection` | `#6366F1` | `#818CF8` | Active cell border (2px) |
| `--sf-selection-glow` | `0 0 0 2px rgba(99,102,241,0.15)` | `0 0 8px rgba(129,140,248,0.3)` | Active cell glow |
| `--sf-focus-ring` | `0 0 0 2px #6366F1` | `0 0 0 2px #818CF8` | Input/button focus ring |
| `--sf-hover` | `#F4F4F5` | `#27272A` | Button hover background |
| `--sf-active` | `#EEF2FF` (indigo-50) | `rgba(99,102,241,0.15)` | Active/pressed button bg |

### Font Stack

```css
/* Display / Wordmark */
font-family: 'Outfit', var(--font-geist-sans), system-ui, sans-serif;
font-weight: 700;
letter-spacing: -0.03em;

/* UI Text */
font-family: var(--font-geist-sans), system-ui, sans-serif;
font-weight: 400–500;

/* Code / Formulas / Cell Data */
font-family: var(--font-geist-mono), 'SF Mono', monospace;
font-weight: 400;
```

### Toolbar Layout

```
Row 1 (48px): [SF icon + WordMark] [•] [Document Title] ---- [● Saved]
Row 2 (44px): [A1 pill] [|] [↶ ↷] [|] [B A◆ ◆] [gap] [fx input]
```

- Cell ref pill: `rounded-full`, zinc-100 bg, 12px text
- Icon buttons: 32×32px, no visible border, `--sf-hover` on hover, `--sf-active` when pressed
- Formula input: `rounded-lg` (8px), `--sf-input` bg, no visible border, `--sf-focus-ring` on focus
- Separators: 1px wide, 20px tall, `--sf-separator` color

### Error Display

Formula errors (`#DIV/0!`, `#NAME?`, `#CIRCULAR!`, `#ERROR!`) render as:
- Soft rose text (`--sf-text-error`) — NOT harsh red
- Optional: small `⚠` triangle icon prefix (Lucide `AlertTriangle`, 12px)
- Should look like gentle inline status labels, not system errors

### Grid Styling Rules

| Element | Specification |
|---------|---------------|
| Gridlines | `--sf-gridline`, 1px — barely visible |
| Column headers | Small muted text (`--sf-text-placeholder`), no bg fill, subtle bottom border |
| Row numbers | Muted text (`--sf-text-placeholder`), left-aligned |
| Active cell | `--sf-selection` 2px border + `--sf-selection-glow` |
| Cell fill (user-applied) | Pastel palette only — e.g., `#FEF9C3` (yellow), `#DBEAFE` (blue) |

> **Rule:** Grid cell logic, selection mechanics, keyboard nav, and formula evaluation are NEVER modified by design changes. Only visual properties (colors, borders, fonts, shadows) change.

---

## Migration Status

The following components have been migrated from custom HTML/CSS to Shadcn UI:

| File | What Changed |
|------|-------------|
| `components/ui/tooltip.tsx` | **Created** — Shadcn Tooltip using Radix `Tooltip` primitive |
| `components/ui/popover.tsx` | **Created** — Shadcn Popover using Radix `Popover` primitive |
| `components/ui/separator.tsx` | **Created** — Shadcn Separator |
| `app/layout.tsx` | Added `<TooltipProvider>` wrapper |
| `components/spreadsheet/Toolbar.tsx` | Custom `<button>` → Shadcn `<Button>`, Unicode icons → Lucide, `title` → `<Tooltip>`, custom separator → `<Separator>` |
| `components/spreadsheet/ColorPicker.tsx` | Custom popover div → Shadcn `<Popover>`, manual outside-click removed, emoji → Lucide `Type`/`Paintbrush` |
| `components/spreadsheet/StatusBar.tsx` | Added Shadcn `<Separator>`, removed duplicate save status (Toolbar handles it) |
| `app/spreadsheet.css` | 25+ hardcoded hex colors → CSS variable tokens, removed obsolete BEM button/separator styles |

### Pending Migration (Design System v3)

| Item | Target | Status |
|------|--------|--------|
| CSS hex colors → v3 design tokens | `app/spreadsheet.css`, `app/globals.css` | 🔲 Planned |
| SF monogram + wordmark typography | `components/spreadsheet/Toolbar.tsx` | 🔲 Planned |
| Toolbar 2-row layout | `components/spreadsheet/Toolbar.tsx` | 🔲 Planned |
| Formula bar → Shadcn `Input` | `components/spreadsheet/Toolbar.tsx` | 🔲 Planned |
| Cell ref → Shadcn `Badge` (pill) | `components/spreadsheet/Toolbar.tsx` | 🔲 Planned |
| FormulaAutocomplete → Shadcn `Command` | `components/spreadsheet/FormulaAutocomplete.tsx` | 🔲 Planned |
| Error display → soft rose + ⚠ icon | `components/spreadsheet/Grid.tsx` (CSS only) | 🔲 Planned |
| Grid subtle gridlines | `app/spreadsheet.css` | 🔲 Planned |
| Font migration → Geist + Outfit | `app/layout.tsx`, `app/globals.css` | 🔲 Planned |
| Dark mode toggle | `components/spreadsheet/Toolbar.tsx` | 🔲 Planned |

---

## Theming & Customization

### CSS Variables

All theming is done via CSS variables in `app/globals.css`. The Shadcn base tokens use HSL format. SheetForge design tokens (`--sf-*`) use hex for precision and are layered on top.

```css
:root {
  /* Shadcn base tokens */
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 239 84% 67%;        /* indigo-500 for SheetForge accent */
  --primary-foreground: 0 0% 98%;
  --muted: 240 5% 96%;
  --muted-foreground: 240 4% 46%;
  --destructive: 350 89% 60%;    /* rose-500 for errors */
  --border: 0 0% 93.7%;          /* ultra-subtle gridlines */
  --input: 240 5% 96%;
  --ring: 239 84% 67%;           /* indigo focus ring */
  --radius: 0.5rem;

  /* SheetForge design tokens (v3) */
  --sf-bg: #FFFFFF;
  --sf-toolbar: #FAFAF9;
  --sf-toolbar-shadow: 0 1px 3px rgba(0,0,0,0.05);
  --sf-input: #F4F4F5;
  --sf-gridline: #EFEFEF;
  --sf-selection: #6366F1;
  --sf-text-error: #F43F5E;
  --sf-text-success: #22C55E;
}

.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 234 89% 74%;        /* indigo-400 */
  --destructive: 0 91% 71%;     /* rose-300 */
  --border: 240 6% 10%;

  /* SheetForge dark tokens */
  --sf-bg: #09090B;
  --sf-toolbar: linear-gradient(180deg, #18181B, #1F1F23);
  --sf-toolbar-shadow: 0 1px 0 rgba(99,102,241,0.15);
  --sf-input: #27272A;
  --sf-gridline: #27272A;
  --sf-selection: #818CF8;
  --sf-text-error: #FDA4AF;
  --sf-text-success: #4ADE80;
}
```

### Customizing Components

Since components live in `@/components/ui/`, you can edit them directly:

```tsx
// Example: Customize button.tsx to add a new variant
const buttonVariants = cva("...", {
  variants: {
    variant: {
      // ... existing variants
      toolbar: "h-8 px-2 bg-transparent hover:bg-accent text-muted-foreground",
    },
  },
})
```

### Dark Mode

Use the existing `theme-provider.tsx` (already in this project) with `next-themes`:

```tsx
import { useTheme } from "next-themes"

const { theme, setTheme } = useTheme()
setTheme("dark") // or "light" or "system"
```

---

## Best Practices

1. **Composition over customization** — Combine small Shadcn primitives to build complex UI. Don't modify base components unless necessary.
2. **Use `asChild`** — When you want a Shadcn component's styling on a different element (e.g., `<Button asChild><Link>...</Link></Button>`).
3. **Accessibility is built in** — Shadcn components based on Radix already handle focus management, keyboard navigation, ARIA attributes, and screen readers. Don't override these.
4. **Don't install react-icons** — Use `lucide-react` (already configured). Browse icons at https://lucide.dev/icons
5. **One toast system** — Use Sonner (`sonner`), not the legacy Toast component. Never mix both.
6. **Check for global providers** — Components like `Tooltip` and `Sonner` require providers/wrappers at the layout level.
7. **Use `"use client"` directive** — All interactive components need this in Next.js App Router.

---

## Quick Reference: Frequently Needed Install Commands

// turbo
```bash
# Core layout & actions
npx -y shadcn@latest add button card separator badge skeleton spinner

# Menus & navigation
npx -y shadcn@latest add menubar dropdown-menu context-menu tabs

# Forms & inputs
npx -y shadcn@latest add input label select checkbox toggle toggle-group textarea

# Overlays & feedback
npx -y shadcn@latest add dialog alert-dialog sheet popover tooltip sonner

# Data & utilities
npx -y shadcn@latest add table scroll-area command combobox kbd
```

---

## Reference

- **Full Component List:** https://ui.shadcn.com/docs/components
- **Community Registry:** https://ui.shadcn.com/docs/directory
- **Lucide Icons:** https://lucide.dev/icons
- **Theming Guide:** https://ui.shadcn.com/docs/theming
- **CLI Reference:** https://ui.shadcn.com/docs/cli
