"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
  orientation: "horizontal" | "vertical"
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabs() {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("Tabs components must be used within <Tabs>")
  return context
}

interface TabsProps extends React.ComponentProps<"div"> {
  value: string
  onValueChange: (value: string) => void
  orientation?: "horizontal" | "vertical"
}

function Tabs({
  className,
  orientation = "horizontal",
  value,
  onValueChange,
  ...props
}: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange, orientation }}>
      <div
        data-slot="tabs"
        data-orientation={orientation}
        className={cn(
          "group/tabs flex gap-2",
          orientation === "horizontal" ? "flex-col" : "",
          className
        )}
        {...props}
      />
    </TabsContext.Provider>
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
      orientation: {
        horizontal: "h-8",
        vertical: "h-fit flex-col",
      },
    },
    defaultVariants: {
      variant: "default",
      orientation: "horizontal",
    },
  }
)

interface TabsListProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof tabsListVariants> {}

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsListProps) {
  const { orientation } = useTabs()
  return (
    <div
      role="tablist"
      data-slot="tabs-list"
      data-variant={variant}
      data-orientation={orientation}
      className={cn(tabsListVariants({ variant, orientation }), className)}
      {...props}
    />
  )
}

interface TabsTriggerProps extends React.ComponentProps<"button"> {
  triggerValue: string
}

function TabsTrigger({ className, triggerValue, ...props }: TabsTriggerProps) {
  const { value, onValueChange } = useTabs()
  const isActive = value === triggerValue

  return (
    <button
      type="button"
      role="tab"
      data-slot="tabs-trigger"
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap transition-all hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        isActive
          ? "bg-background text-foreground shadow-sm dark:border-input dark:bg-input/30 dark:text-foreground"
          : "text-foreground/60 dark:text-muted-foreground dark:hover:text-foreground",
        className
      )}
      onClick={() => onValueChange(triggerValue)}
      {...props}
    />
  )
}

interface TabsContentProps extends React.ComponentProps<"div"> {
  contentValue: string
}

function TabsContent({ className, contentValue, ...props }: TabsContentProps) {
  const { value } = useTabs()
  if (value !== contentValue) return null

  return (
    <div
      role="tabpanel"
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
