import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0 cursor-pointer text-white dark:text-black ",
  {
    variants: {
      variant: {
        // ✅ PRIMARY BUTTON (main CTA)
        default:
          "bg-primary hover:bg-primary/90",

        // ✅ DANGER BUTTON
        destructive:
          "bg-destructive text-black hover:bg-destructive/90",

        // Second secondary btn
        outline:
          "border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground",

        // ✅ SECONDARY
        secondary:
          "bg-secondary hover:bg-secondary/80",

        // ✅ GHOST (minimal)
        ghost:
          " hover:bg-accent hover:text-accent-foreground",

        // ✅ LINK
        link:
          "underline-offset-4 hover:underline",
      },

      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6",
        icon: "h-10 w-10",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }