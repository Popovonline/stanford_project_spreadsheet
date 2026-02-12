import * as React from "react"

import { cn } from "@/lib/utils"

const Kbd = React.forwardRef<
    HTMLElement,
    React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
    <kbd
        ref={ref}
        className={cn(
            "inline-flex items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.7rem] font-medium text-muted-foreground shadow-sm",
            className
        )}
        {...props}
    />
))
Kbd.displayName = "Kbd"

export { Kbd }
