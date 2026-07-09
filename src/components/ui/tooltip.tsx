"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

interface TooltipContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null)

function useTooltip() {
  const context = React.useContext(TooltipContext)
  if (!context) throw new Error("Tooltip components must be used within <Tooltip>")
  return context
}

function TooltipProvider({ children, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="tooltip-provider" {...props}>{children}</div>
}

interface TooltipProps {
  children: React.ReactNode
}

function Tooltip({ children }: TooltipProps) {
  const [open, setOpen] = React.useState(false)
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      {children}
    </TooltipContext.Provider>
  )
}

function TooltipTrigger({ children, ...props }: React.ComponentProps<"span">) {
  const { setOpen } = useTooltip()
  return (
    <span
      data-slot="tooltip-trigger"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      {...props}
    >
      {children}
    </span>
  )
}

interface TooltipContentProps extends React.ComponentProps<"div"> {
  side?: "top" | "right" | "bottom" | "left"
  sideOffset?: number
  align?: "start" | "center" | "end"
  alignOffset?: number
}

function TooltipContent({
  className,
  children,
  ...props
}: TooltipContentProps) {
  const { open } = useTooltip()
  if (!open) return null

  return createPortal(
    <div
      role="tooltip"
      data-slot="tooltip-content"
      className={cn(
        "z-50 inline-flex w-fit max-w-xs items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background",
        className
      )}
      {...props}
    >
      {children}
    </div>,
    document.body
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
