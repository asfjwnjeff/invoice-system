import { Inbox } from "lucide-react";

interface EmptyStateProps { title?: string; description?: string; action?: React.ReactNode; }

export function EmptyState({ title = "暂无数据", description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted mb-4">
        <Inbox className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
