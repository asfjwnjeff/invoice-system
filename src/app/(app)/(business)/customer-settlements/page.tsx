"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface T { id: string; settlementNo: string; settlementType: string; amountWithoutTax: number; taxAmount: number; amountWithTax: number; status: string; customer?: { name: string }; }
const E = "settlements";

export default function Page() {
  const qc = useQueryClient(); const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState({ settlementNo: "", settlementType: "CUSTOMER_RECEIVABLE", customerId: "", revenueOrderId: "", amountWithoutTax: 0, taxAmount: 0, amountWithTax: 0 });
  const { data } = useQuery({ queryKey: [E], queryFn: async () => { const r = await fetch(`/api/${E}`); return (await r.json()).data as { items: T[] }; } });
  const sm = useMutation({ mutationFn: async () => { const m = editId ? "PUT" : "POST"; const u = editId ? `/api/${E}/${editId}` : `/api/${E}`; const r = await fetch(u, { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success(editId ? "已更新" : "已创建"); setOpen(false); reset(); qc.invalidateQueries({ queryKey: [E] }); } else toast.error(r.error ?? "失败"); } });
  const dm = useMutation({ mutationFn: (id: string) => fetch(`/api/${E}/${id}`, { method: "DELETE" }), onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({ queryKey: [E] }); } });
  const reset = () => { setEditId(null); setF({ settlementNo: "", settlementType: "CUSTOMER_RECEIVABLE", customerId: "", revenueOrderId: "", amountWithoutTax: 0, taxAmount: 0, amountWithTax: 0 }); };
  const statusVariant = (s: string) => (s === "CONFIRMED" ? "success" : s === "DRAFT" ? "neutral" : "warning") as "success" | "warning" | "neutral";
  const cols: ColumnDef<T>[] = [
    { accessorKey: "settlementNo", header: "结算单号", cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.settlementNo}</span> },
    { accessorKey: "customer.name", header: "客户", cell: ({ row }) => row.original.customer?.name || "-" },
    { accessorKey: "amountWithoutTax", header: "不含税金额", cell: ({ row }) => <span className="tabular-nums">¥{row.original.amountWithoutTax.toLocaleString()}</span> },
    { accessorKey: "taxAmount", header: "税额", cell: ({ row }) => <span className="tabular-nums">¥{row.original.taxAmount.toLocaleString()}</span> },
    { accessorKey: "amountWithTax", header: "价税合计", cell: ({ row }) => <span className="tabular-nums font-medium">¥{row.original.amountWithTax.toLocaleString()}</span> },
    { accessorKey: "status", header: "状态", cell: ({ row }) => <StatusBadge status={row.original.status} variant={statusVariant(row.original.status)} /> },
    { id: "act", header: "操作", cell: ({ row }) => (<div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditId(row.original.id); setF({ settlementNo: row.original.settlementNo, settlementType: row.original.settlementType, customerId: "", revenueOrderId: "", amountWithoutTax: row.original.amountWithoutTax, taxAmount: row.original.taxAmount, amountWithTax: row.original.amountWithTax }); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => dm.mutate(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div>) },
  ];
  return (
    <div>
      <PageHeader title="客户结算" description="客户应收结算单管理（结算驱动开票）" actionLabel="新增结算单" onAction={() => { reset(); setOpen(true); }} />
      <DataTable columns={cols} data={data?.items ?? []} searchKey="settlementNo" />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editId ? "编辑" : "新增"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4"><div className="space-y-2"><Label>结算单号 *</Label><Input value={f.settlementNo} onChange={(e) => setF({ ...f, settlementNo: e.target.value })} /></div><div className="space-y-2"><Label>类型</Label><Input value={f.settlementType} onChange={(e) => setF({ ...f, settlementType: e.target.value })} /></div><div className="space-y-2"><Label>不含税金额</Label><Input type="number" value={f.amountWithoutTax} onChange={(e) => setF({ ...f, amountWithoutTax: +e.target.value })} /></div><div className="space-y-2"><Label>税额</Label><Input type="number" value={f.taxAmount} onChange={(e) => setF({ ...f, taxAmount: +e.target.value })} /></div><div className="col-span-2 space-y-2"><Label>价税合计</Label><Input type="number" value={f.amountWithTax} onChange={(e) => setF({ ...f, amountWithTax: +e.target.value })} /></div></div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>取消</Button><Button onClick={() => sm.mutate()}>{sm.isPending ? "保存中..." : "保存"}</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}
