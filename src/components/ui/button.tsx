import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.4),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_8px_32px_hsl(var(--primary)/0.55),inset_0_1px_0_rgba(255,255,255,0.3)] hover:-translate-y-0.5 active:scale-[0.97] active:translate-y-0 shine-effect",
        destructive:
          "bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground shadow-[0_4px_20px_hsl(var(--destructive)/0.35)] hover:shadow-[0_8px_28px_hsl(var(--destructive)/0.5)] hover:-translate-y-0.5 active:scale-[0.97]",
        outline:
          "border border-[var(--glass-border)] bg-[var(--glass-bg)] text-foreground backdrop-blur-sm shadow-[var(--glass-shadow)] hover:border-[hsl(var(--primary)/0.4)] hover:bg-[var(--glass-bg-strong)] hover:shadow-[0_6px_24px_hsl(var(--primary)/0.18)] hover:-translate-y-0.5 active:scale-[0.97]",
        secondary:
          "bg-secondary/80 backdrop-blur-sm text-secondary-foreground border border-border/40 hover:bg-secondary hover:-translate-y-0.5 active:scale-[0.97]",
        ghost:
          "hover:bg-[var(--glass-bg)] hover:backdrop-blur-sm hover:border-[var(--glass-border-subtle)] hover:border active:scale-[0.97]",
        link:
          "text-primary underline-offset-4 hover:underline",
        accent:
          "bg-gradient-to-r from-accent to-accent-hover text-accent-foreground shadow-[0_4px_20px_hsl(var(--accent)/0.4)] hover:shadow-[0_8px_32px_hsl(var(--accent)/0.55)] hover:-translate-y-0.5 active:scale-[0.97] shine-effect",
        success:
          "bg-gradient-to-r from-success to-success/80 text-success-foreground shadow-[0_4px_20px_hsl(var(--success)/0.35)] hover:shadow-[0_8px_28px_hsl(var(--success)/0.5)] hover:-translate-y-0.5 active:scale-[0.97]",
        glass:
          "btn-glass text-foreground hover:text-primary shine-effect",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm:      "h-9 rounded-lg px-4 text-xs",
        lg:      "h-12 rounded-xl px-8 text-base",
        xl:      "h-14 rounded-2xl px-10 text-base",
        icon:    "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size:    "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
