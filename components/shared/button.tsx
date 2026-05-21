"use client"

import { forwardRef } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "success"
  | "warning"
  | "gold"

type Size = "sm" | "md" | "lg" | "icon"

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?:   Variant
  size?:      Size
  icon?:      React.ReactNode
  iconRight?: React.ReactNode
  loading?:   boolean
  type?:      "button" | "submit" | "reset"
}

const sizeClasses: Record<Size, string> = {
  sm:   "h-8  px-3 text-xs gap-1.5",
  md:   "h-10 px-4 text-sm gap-2",
  lg:   "h-11 px-5 text-sm gap-2",
  icon: "h-9  w-9 p-0",
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-muted/50",
  ghost:
    "bg-transparent text-foreground hover:bg-muted/50",
  destructive:
    "bg-destructive/10 text-destructive hover:bg-destructive/20",
  success:
    "bg-success text-success-foreground hover:bg-success/90",
  warning:
    "bg-warning text-warning-foreground hover:bg-warning/90",
  gold:
    "text-[#060e1f] font-bold uppercase tracking-[0.18em] " +
    "bg-[linear-gradient(135deg,#b8902a_0%,#e8c76d_45%,#c9a84c_75%,#a87d28_100%)] " +
    "shadow-[0_4px_24px_rgba(201,168,76,0.22),inset_0_1px_0_rgba(255,255,255,0.15)] " +
    "hover:shadow-[0_6px_32px_rgba(201,168,76,0.35),inset_0_1px_0_rgba(255,255,255,0.15)] " +
    "hover:-translate-y-px",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant   = "primary",
    size      = "md",
    icon,
    iconRight,
    loading   = false,
    disabled,
    type      = "button",
    className = "",
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium",
        "transition-all duration-150 outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        "disabled:opacity-55 disabled:cursor-not-allowed disabled:pointer-events-none",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {loading
        ? <Loader2 className="h-4 w-4 animate-spin" />
        : icon
      }
      {children}
      {!loading && iconRight}
    </button>
  )
})
