import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

interface PageHeaderProps { title: string; description?: string; actionLabel?: string; actionHref?: string; onAction?: () => void; }

export function PageHeader({ title, description, actionLabel, actionHref, onAction }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actionLabel && (
        actionHref
          ? <Link href={actionHref}><Button><Plus className="h-4 w-4 mr-2" />{actionLabel}</Button></Link>
          : <Button onClick={onAction}><Plus className="h-4 w-4 mr-2" />{actionLabel}</Button>
      )}
    </div>
  );
}
