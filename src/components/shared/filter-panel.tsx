"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings2, ChevronUp, ChevronDown, GripVertical } from "lucide-react";

interface FilterField {
  key: string;
  label: string;
}

interface FilterPanelProps {
  fields: FilterField[];
  storageKey: string;
  onOrderChange: (orderedKeys: string[]) => void;
}

export function FilterPanel({ fields, storageKey, onOrderChange }: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<string[]>(() => fields.map(f => f.key));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        const valid = parsed.filter((k: string) => fields.some(f => f.key === k));
        if (valid.length > 0) setOrder(valid);
      }
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(storageKey, JSON.stringify(order));
    onOrderChange(order);
  }, [order, storageKey, onOrderChange, mounted]);

  const toggle = (key: string) => {
    setOrder(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const moveUp = (i: number) => {
    if (i <= 0) return;
    setOrder(prev => { const n = [...prev]; [n[i-1], n[i]] = [n[i]!, n[i-1]!]; return n; });
  };

  const moveDown = (i: number) => {
    if (i >= order.length - 1) return;
    setOrder(prev => { const n = [...prev]; [n[i], n[i+1]] = [n[i+1]!, n[i]!]; return n; });
  };

  const visibleCount = order.filter(k => fields.some(f => f.key === k)).length;

  return (
    <div className="relative inline-block">
      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setOpen(!open)}>
        <Settings2 className="h-3.5 w-3.5" />
        筛选设置 {visibleCount > 0 && <span className="text-muted-foreground">({visibleCount})</span>}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 w-52 rounded-lg border bg-popover p-2 shadow-md">
            <div className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">筛选字段</div>
            {fields.map((f) => {
              const idx = order.indexOf(f.key);
              const isVisible = idx !== -1;
              return (
                <div key={f.key} className="flex items-center gap-1.5 rounded-md px-1 py-1 hover:bg-accent/50">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0 cursor-grab" />
                  <Checkbox checked={isVisible} onCheckedChange={() => toggle(f.key)} className="shrink-0" />
                  <span className="flex-1 text-sm cursor-pointer select-none" onClick={() => toggle(f.key)}>{f.label}</span>
                  <div className="flex flex-col shrink-0">
                    <button className="h-3 w-3 flex items-center justify-center hover:text-foreground text-muted-foreground disabled:opacity-30" disabled={!isVisible || idx <= 0} onClick={() => moveUp(idx)}>
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button className="h-3 w-3 flex items-center justify-center hover:text-foreground text-muted-foreground disabled:opacity-30" disabled={!isVisible || idx >= order.length - 1} onClick={() => moveDown(idx)}>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
