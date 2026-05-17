import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-sm border border-hairline bg-surface-soft px-3 py-2 text-base text-ink file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-mute focus-visible:outline-none focus-visible:bg-canvas focus-visible:border-ink disabled:cursor-not-allowed disabled:bg-surface-card disabled:text-ash transition-none",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
