# Next.js + TypeScript + Tailwind CSS Coding Conventions

> Supplementary rules covering coding standards, patterns, and best practices that complement the shadcn/ui workflow in `.agent/workflows/shadcn-ui.md`.

---

## TypeScript Conventions

### General Style
- Write concise, technical TypeScript — avoid verbose code.
- Use **functional, declarative** programming. Avoid classes.
- Prefer **iteration and modularization** over code duplication.
- Use `function` keyword for pure functions. Omit semicolons.
- Prefer `interface` over `type` for object shapes. Avoid `enum` — use `const` maps instead.

### Naming Conventions
- **Directories**: lowercase with dashes (e.g., `components/auth-wizard/`).
- **Variables**: descriptive names with auxiliary verbs (e.g., `isLoading`, `hasError`, `canSubmit`).
- **Components**: PascalCase, favor **named exports** over default exports.
- **Files**: kebab-case for component files (e.g., `data-table.tsx`), matching the component name.

### File Structure (per component file)
1. Exported component
2. Subcomponents
3. Helper functions
4. Static content / constants
5. TypeScript interfaces and types (at bottom)

### Pattern: Receive an Object, Return an Object (RORO)
```tsx
// ✅ CORRECT: RORO pattern
function createUser({ name, email, role }: CreateUserInput): CreateUserResult {
  // ...
  return { user, token }
}

// ❌ WRONG: Positional parameters
function createUser(name: string, email: string, role: string) { ... }
```

---

## Error Handling & Validation

### Guard Clause Pattern
```tsx
// ✅ CORRECT: Guard clauses with early returns
function processOrder(order: Order | null) {
  if (!order) return { error: "Order not found" }
  if (!order.items.length) return { error: "Empty order" }
  if (!order.paymentMethod) return { error: "No payment method" }

  // Happy path last
  return { data: calculateTotal(order) }
}

// ❌ WRONG: Deeply nested conditionals
function processOrder(order: Order | null) {
  if (order) {
    if (order.items.length) {
      if (order.paymentMethod) {
        return { data: calculateTotal(order) }
      }
    }
  }
}
```

### Error Boundaries
- Use `error.tsx` files for route-level error boundaries.
- Use `global-error.tsx` for the root error boundary.
- Model **expected errors** as return values (not try/catch).
- Use **error boundaries** for unexpected/runtime errors.

### Form Validation with Zod
```tsx
import { z } from "zod"

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
})

type FormValues = z.infer<typeof formSchema>
```

---

## Next.js App Router Best Practices

### Server vs Client Components
- **Default to Server Components** — no directive needed.
- Add `"use client"` only when you need:
  - `useState`, `useEffect`, `useReducer`
  - Event handlers (`onClick`, `onChange`, etc.)
  - Browser APIs (`window`, `document`, `localStorage`)
- Keep client components **small and leaf-level**.
- Never use `"use client"` for data fetching or state management — use server-side patterns.

### Data Fetching
```tsx
// ✅ Server Component — fetch directly
async function UserProfile({ userId }: { userId: string }) {
  const user = await getUser(userId)
  return <div>{user.name}</div>
}

// ❌ WRONG: useEffect for data fetching in App Router
"use client"
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null)
  useEffect(() => { fetch(`/api/users/${userId}`).then(/* ... */) }, [])
}
```

### Loading & Suspense
```tsx
// Use loading.tsx for route-level loading states
// Wrap client components in Suspense with fallback
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

<Suspense fallback={<Skeleton className="h-20 w-full" />}>
  <AsyncComponent />
</Suspense>
```

### Dynamic Imports
```tsx
// Use for non-critical, heavy components
import dynamic from "next/dynamic"

const HeavyChart = dynamic(() => import("@/components/chart"), {
  loading: () => <Skeleton className="h-64 w-full" />,
  ssr: false, // Only if component uses browser APIs
})
```

### Server Actions
```tsx
// ✅ Define in a separate file or inline
"use server"

import { z } from "zod"

const schema = z.object({ email: z.string().email() })

export async function subscribeAction(formData: FormData) {
  const parsed = schema.safeParse({
    email: formData.get("email"),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Perform action
  return { success: true }
}
```

---

## Performance Optimization

### Core Web Vitals Focus
- **LCP** (Largest Contentful Paint): Prioritize above-the-fold content.
- **CLS** (Cumulative Layout Shift): Always set `width` and `height` on images.
- **INP** (Interaction to Next Paint): Keep client-side JS minimal.

### Image Optimization
```tsx
import Image from "next/image"

// ✅ CORRECT: Next.js Image with dimensions
<Image
  src="/hero.webp"
  alt="Hero image"
  width={1200}
  height={630}
  priority          // For above-the-fold images
  className="rounded-lg"
/>

// ❌ WRONG: Plain img tag
<img src="/hero.png" alt="Hero" />
```

### Rules
- Use **WebP** format for images where possible.
- Add `priority` prop to above-the-fold images.
- Use `loading="lazy"` for below-the-fold images (default behavior in Next.js `Image`).
- Minimize bundle size — avoid importing entire libraries.
- Use `next/font` for font optimization (already configured with Geist).

---

## Accessibility (a11y)

- Use semantic HTML elements (`<nav>`, `<main>`, `<section>`, `<article>`).
- All interactive elements must be keyboard-accessible.
- Images must have descriptive `alt` text.
- Use `aria-label` for icon-only buttons.
- Ensure sufficient color contrast (WCAG 2.1 AA).
- shadcn/ui components are built on **Radix UI** which handles much of this — do not override accessibility attributes.

```tsx
// ✅ Icon button with aria-label
<Button variant="ghost" size="icon" aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>
```

---

## State Management

- **URL state**: Use `searchParams` and `useSearchParams` for shareable state.
- **Server state**: Fetch on the server, pass as props.
- **Form state**: Use `useActionState` (React 19) for server action forms.
- **Local UI state**: Use `useState` sparingly, keep client components small.
- **Complex state**: Use Zustand or React Context for app-wide client state (only if needed).

---

## Project Conventions Summary

| Convention | Rule |
|---|---|
| Styling | Tailwind CSS + shadcn CSS variables only |
| Components | shadcn/ui primitives + custom compositions |
| Icons | Lucide React only |
| Forms | Zod validation + `useActionState` |
| Data fetching | Server Components + Server Actions |
| Error handling | Guard clauses + error boundaries |
| Images | `next/image` with WebP, dimensions, `priority` |
| Naming | kebab-case files, PascalCase components, camelCase variables |
| Exports | Named exports, no default exports |
| State | Minimize client state, prefer URL/server state |
