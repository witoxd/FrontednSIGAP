"use client"

import { forwardRef, useId } from "react"
import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:     string
  hint?:      string
  error?:     string
  icon?:      React.ReactNode
  iconRight?: React.ReactNode
  /** Estilo "marine" para superficies tipo login. Si no, estilo app por defecto. */
  marine?:    boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    icon,
    iconRight,
    marine    = false,
    className = "",
    id,
    ...props
  },
  ref,
) {
  const autoId   = useId()
  const inputId  = id ?? autoId

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            "text-[10px] font-semibold uppercase tracking-[0.16em]",
            marine ? "text-[#3d5a80]" : "text-muted-foreground",
          )}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span
            className={cn(
              "absolute top-1/2 -translate-y-1/2 pointer-events-none",
              marine ? "left-3.5 text-[#3d5a80]" : "left-3 text-muted-foreground",
            )}
          >
            {icon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            "w-full rounded-lg outline-none transition-colors box-border",
            "font-[inherit] text-sm",
            marine
              ? [
                  "h-11 bg-[#030a18] text-[#b8cce0]",
                  "border border-[rgba(50,80,130,0.35)]",
                  icon ? "pl-10" : "pl-4",
                  iconRight ? "pr-11" : "pr-4",
                  "focus:border-[rgba(201,168,76,0.5)]",
                  "focus:shadow-[0_0_0_3px_rgba(201,168,76,0.07)]",
                ].join(" ")
              : [
                  "h-10 bg-card text-foreground",
                  "border border-border",
                  icon ? "pl-9" : "pl-3",
                  iconRight ? "pr-9" : "pr-3",
                  "focus:ring-2 focus:ring-ring",
                  error && "border-destructive focus:ring-destructive",
                ].filter(Boolean).join(" "),
            className,
          )}
          {...props}
        />

        {iconRight && (
          <span
            className={cn(
              "absolute top-1/2 -translate-y-1/2",
              marine ? "right-3" : "right-3 text-muted-foreground",
            )}
          >
            {iconRight}
          </span>
        )}
      </div>

      {error
        ? <p id={`${inputId}-err`}  className="text-xs text-destructive">{error}</p>
        : hint
          ? <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">{hint}</p>
          : null
      }
    </div>
  )
})
