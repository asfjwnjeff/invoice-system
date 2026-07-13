"use client";
import { useState } from "react";
import Link from "next/link";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface T { id: string; settlementNo: string; settlementType: string; totalAmount: number; invoicedAmount: number; receivedAmount: number; status: string; customer?: { name: string }; }
const E = "settlements";
const statusLabels: Record<string, string> = { DRAFT: "草稿", CONFIRMED: "已确认", SETTLED: "已结算" };

export default function Page() {
  const qc = useQueryClient(); const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [f, setF] = useState({ settlementNo: "", settlementType: "CUSTOMER_RECEIVABLE", customerId: "", revenueOrderId: "", totalAmount: 0, invoicedAmount: 0, receivedAmount: 0 });
  const { data } = useQuery({ queryKey: [E], queryFn: async () => { const r = await fetch(`/api/${E}`); return (await r.json()).data as { items: T[] }; } });
  const sm = useMutation({ mutationFn: async () => { const m = editId ? "PUT" : "POST"; const u = editId ? `/api/${E}/${editId}` : `/api/${E}`; const r = await fetch(u, { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success(editId ? "已更新" : "已创建"); setOpen(false); reset(); qc.invalidateQueries({ queryKey: [E] }); } else toast.error(r.error ?? "失败"); } });
  const dm = useMutation({ mutationFn: (id: string) => fetch(`/api/${E}/${id}`, { method: "DELETE" }), onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({ queryKey: [E] }); } });
  const batchMut = useMutation({ mutationFn: async () => { const r = await fetch("/api/settlements/batch-invoice", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({settlementIds:selected}) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success(`已生成${r.data.created}张开票申请`); setSelected([]); qc.invalidateQueries({queryKey:["settlements","applications"]}); } else toast.error(r.error??"失败"); } });
  const reset = () => { setEditId(null); setF({ settlementNo: "", settlementType: "CUSTOMER_RECEIVABLE", customerId: "", revenueOrderId: "", totalAmount: 0, invoicedAmount: 0, receivedAmount: 0 }); };
  const statusVariant = (s: string) => (s === "CONFIRMED" ? "success" : s === "DRAFT" ? "neutral" : "warning") as "success" | "warning" | "neutral";
  const cols: ColumnDef<T>[] = [
    { accessorKey: "settlementNo", header: "结算单号", cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.settlementNo}</span> },
    { accessorKey: "customer.name", header: "客户", cell: ({ row }) => row.original.customer?.name || "-" },
    { accessorKey: "totalAmount", header: "结算总额", cell: ({ row }) => <span className="tabular-nums">¥{row.original.totalAmount.toLocaleString()}</span> },
    { accessorKey: "invoicedAmount", header: "已开票", cell: ({ row }) => <span className="tabular-nums">¥{row.original.invoicedAmount.toLocaleString()}</span> },
    { accessorKey: "receivedAmount", header: "已收款", cell: ({ row }) => <span className="tabular-nums font-medium">¥{row.original.receivedAmount.toLocaleString()}</span> },
    { accessorKey: "status", header: "状态", cell: ({ row }) => <StatusBadge status={statusLabels[row.original.status] ?? row.original.status} variant={statusVariant(row.original.status)} /> },
    { id: "act", header: "操作", cell: ({ row }) => (<div className="flex gap-1"><Link href={`/customer-settlements/${row.original.id}`}><Button variant="ghost" size="sm" className="h-8">查看</Button></Link><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditId(row.original.id); setF({ settlementNo: row.original.settlementNo, settlementType: row.original.settlementType, customerId: "", revenueOrderId: "", totalAmount: row.original.totalAmount, invoicedAmount: row.original.invoicedAmount, receivedAmount: row.original.receivedAmount }); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div>) },
  ];
  return (
    <div>
      <PageHeader title="客户结算" description="客户应收结算单管理（结算驱动开票）" actionLabel="新增结算单" onAction={() => { reset(); setOpen(true); }} />
      <DataTable columns={cols} data={data?.items ?? []} searchKey="settlementNo" selectable selectedIds={selected} onSelectionChange={setSelected} batchBar={<Button size="sm" onClick={() => batchMut.mutate()} disabled={batchMut.isPending}>批量生成开票申请</Button>} />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editId ? "编辑" : "新增"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4"><div className="space-y-2"><Label>结算单号 *</Label><Input value={f.settlementNo} onChange={(e) => setF({ ...f, settlementNo: e.target.value })} /></div><div className="space-y-2"><Label>类型</Label><Input value={f.settlementType} onChange={(e) => setF({ ...f, settlementType: e.target.value })} /></div><div className="space-y-2"><Label>结算总额</Label><Input type="number" value={f.totalAmount} onChange={(e) => setF({ ...f, totalAmount: +e.target.value })} /></div><div className="space-y-2"><Label>已开票金额</Label><Input type="number" value={f.invoicedAmount} onChange={(e) => setF({ ...f, invoicedAmount: +e.target.value })} /></div><div className="col-span-2 space-y-2"><Label>已收款金额</Label><Input type="number" value={f.receivedAmount} onChange={(e) => setF({ ...f, receivedAmount: +e.target.value })} /></div></div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>取消</Button><Button onClick={() => sm.mutate()}>{sm.isPending ? "保存中..." : "保存"}</Button></DialogFooter>
      </DialogContent></Dialog>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="确认删除"
        description="确认要删除吗？此操作不可撤销。"
        confirmLabel="删除"
        variant="danger"
        loading={dm.isPending}
        onConfirm={() => deleteId && dm.mutate(deleteId)}
      />
    </div>
  );
}
