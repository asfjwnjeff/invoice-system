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
  return (
    <Select value={{ open, setOpen, value, onValueChange }}>
      {children}
    </Select>
  )
}

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  const { open, setOpen, value } = useSelect()
  return (
    <button
      type="button"
      data-slot="select-trigger"
      className={cn(
        "flex h-8 w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      <span className="flex flex-1 text-left line-clamp-1 items-center gap-1.5">
        {value || <span className="text-muted-foreground">Select...</span>}
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
  const { open } = useSelect()
  if (!open) return null

  return createPortal(
    <div
      data-slot="select-content"
      className={cn(
        "relative z-50 min-w-36 overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10",
        className
      )}
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
  itemValue: string
}

function SelectItem({
  className,
  children,
  itemValue,
  ...props
}: SelectItemProps) {
  const { onValueChange, setOpen, value } = useSelect()
  const isSelected = value === itemValue

  return (
    <button
      type="button"
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      onClick={() => {
        onValueChange(itemValue)
        setOpen(false)
      }}
      {...props}
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
