"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  width?: "lg" | "xl" | "2xl" | "3xl";
  loading?: boolean;
  submitLabel?: string;
  onSubmit: () => void;
  children: ReactNode;
}

const widthClasses: Record<string, string> = {
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
};

export function FormDialog({
  open, onOpenChange, title, description,
  width = "2xl", loading, submitLabel = "保存", onSubmit,
  children,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={widthClasses[width] ?? widthClasses["2xl"]}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          {children}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading ? "保存中..." : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Form field wrapper with label */
export function FormField({
  label, required, children, fullWidth,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "col-span-2 space-y-1.5" : "space-y-1.5"}>
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {required && <span className="text-destructive mr-0.5">*</span>}
        {label}
      </label>
      {children}
    </div>
  );
}
