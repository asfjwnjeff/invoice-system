"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"

interface SelectContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  value: string
  onValueChange: (value: string) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
  labels: Record<string, React.ReactNode>
  registerLabel: (value: string, label: React.ReactNode) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function useSelect() {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("Select components must be used within <Select>")
  return context
}

const Select = SelectContext.Provider

function SelectRoot({
  value,
  onValueChange,
  children,
}: {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [labels, setLabels] = React.useState<Record<string, React.ReactNode>>({})

  const registerLabel = React.useCallback((value: string, label: React.ReactNode) => {
    setLabels(prev => {
      // Only update if label actually changed for this value
      if (prev[value] === label) return prev
      return { ...prev, [value]: label }
    })
  }, [])

  React.useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (contentRef.current?.contains(target)) return
      if (rootRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <Select value={{ open, setOpen, value, onValueChange, triggerRef, contentRef, labels, registerLabel }}>
      <div ref={rootRef} className="relative inline-block">
        {children}
      </div>
    </Select>
  )
}

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  const { open, setOpen, value, triggerRef, labels } = useSelect()
  const displayLabel = value ? labels[value] : null
  return (
    <button
      ref={triggerRef}
      type="button"
      data-slot="select-trigger"
      {...props}
      className={cn(
        "flex h-8 min-w-[120px] items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      onClick={() => setOpen(!open)}
    >
      <span className="flex flex-1 text-left line-clamp-1 items-center gap-1.5">
        {displayLabel || value || <span className="text-muted-foreground">选择...</span>}
      </span>
      <ChevronDownIcon className="size-4 text-muted-foreground" />
    </button>
  )
}

function SelectContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { open, triggerRef, contentRef } = useSelect()
  const [pos, setPos] = React.useState<{ top: number; left: number; width: number } | null>(null)

  React.useEffect(() => {
    if (!triggerRef.current) return
    function calc() {
      const rect = triggerRef.current!.getBoundingClientRect()
      const top = rect.bottom + 4
      const left = rect.left
      const width = rect.width
      // Adjust if dropdown would go below viewport
      const estimatedHeight = 240
      if (top + estimatedHeight > window.innerHeight) {
        setPos({ top: rect.top - estimatedHeight - 4, left, width: Math.max(width, 144) })
      } else {
        setPos({ top, left, width: Math.max(width, 144) })
      }
    }
    calc()
    window.addEventListener("scroll", calc, true)
    window.addEventListener("resize", calc)
    return () => {
      window.removeEventListener("scroll", calc, true)
      window.removeEventListener("resize", calc)
    }
  }, [open, triggerRef])

  if (!pos) return null

  return createPortal(
    <div
      ref={contentRef}
      data-slot="select-content"
      className={cn(
        "fixed z-50 overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 transition-opacity",
        open ? "visible opacity-100" : "invisible opacity-0 pointer-events-none",
        className
      )}
      style={{ top: pos.top, left: pos.left, minWidth: pos.width, maxHeight: 240 }}
      {...props}
    >
      {children}
    </div>,
    document.body
  )
}

function SelectGroup({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="select-group" className={cn("p-1", className)} {...props}>
      {children}
    </div>
  )
}

function SelectLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-label"
      className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

interface SelectItemProps extends React.ComponentProps<"button"> {
  value: string
}

function SelectItem({
  className,
  children,
  value: itemValue,
  ...props
}: SelectItemProps) {
  const { onValueChange, setOpen, value, registerLabel } = useSelect()
  const isSelected = value === itemValue

  React.useEffect(() => {
    registerLabel(itemValue, children)
  }, [itemValue, children, registerLabel])

  return (
    <button
      type="button"
      data-slot="select-item"
      {...props}
      className={cn(
        "relative flex w-full cursor-pointer items-center gap-1.5 rounded-md py-1.5 pr-8 pl-2 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      onClick={() => {
        onValueChange(itemValue)
        setOpen(false)
      }}
    >
      {children}
      {isSelected && (
        <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
          <CheckIcon className="size-4" />
        </span>
      )}
    </button>
  )
}

function SelectValue({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <span data-slot="select-value" className={cn("flex flex-1 text-left", className)}>{children}</span>
}

function SelectSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full items-center justify-center bg-popover py-1", className)}>
      <ChevronUpIcon className="size-4" />
    </div>
  )
}

function SelectScrollDownButton({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full items-center justify-center bg-popover py-1", className)}>
      <ChevronDownIcon className="size-4" />
    </div>
  )
}

export {
  SelectRoot as Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
