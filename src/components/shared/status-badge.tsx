import { cn } from "@/lib/utils";

const variants = {
  success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  danger: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  info: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  neutral: "bg-muted text-muted-foreground",
} as const;

interface StatusBadgeProps { status: string; variant?: keyof typeof variants; className?: string; }

export function StatusBadge({ status, variant = "neutral", className }: StatusBadgeProps) {
  return <span className={cn("inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium", variants[variant], className)}>{status}</span>;
}
