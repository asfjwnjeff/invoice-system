"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean; onOpenChange: (open: boolean) => void;
  title: string; description: string; confirmLabel?: string;
  variant?: "default" | "danger"; onConfirm: () => void; loading?: boolean;
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "确认", variant = "default", onConfirm, loading }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>取消</Button>
          <Button onClick={onConfirm} disabled={loading} variant={variant === "danger" ? "destructive" : "default"}>
            {loading ? "处理中..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
