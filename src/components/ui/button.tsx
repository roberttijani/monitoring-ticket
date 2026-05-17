import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "outline" | "ghost" | "glass" | "danger"
    size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-sm text-base font-medium transition-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink disabled:pointer-events-none disabled:bg-surface-card disabled:text-ash disabled:border-none disabled:shadow-none",
                    {
                        "bg-primary text-on-primary hover:bg-ink-deep": variant === "default",
                        "border border-hairline-strong bg-canvas hover:bg-surface-soft text-ink": variant === "outline",
                        "hover:bg-surface-soft text-ink": variant === "ghost",
                        "border border-hairline bg-surface-soft text-ink hover:bg-canvas": variant === "glass",
                        "bg-danger text-on-primary hover:bg-danger-hover": variant === "danger",
                        "h-9 px-5 py-1": size === "default",
                        "h-8 px-3 text-sm": size === "sm",
                        "h-10 px-6": size === "lg",
                        "h-9 w-9": size === "icon",
                    },
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
