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

interface T { id: string; orderNo: string; title: string; orderType: string; status: string; customer?: { name: string }; }
const E = "business-orders";

export default function Page() {
  const qc = useQueryClient(); const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState({ orderNo: "", orderType: "COMPREHENSIVE", title: "", customerId: "" });
  const { data } = useQuery({ queryKey: [E], queryFn: async () => { const r = await fetch(`/api/${E}`); return (await r.json()).data as { items: T[] }; } });
  const sm = useMutation({ mutationFn: async () => { const m = editId ? "PUT" : "POST"; const u = editId ? `/api/${E}/${editId}` : `/api/${E}`; const r = await fetch(u, { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success(editId ? "已更新" : "已创建"); setOpen(false); reset(); qc.invalidateQueries({ queryKey: [E] }); } else toast.error(r.error ?? "失败"); } });
  const dm = useMutation({ mutationFn: (id: string) => fetch(`/api/${E}/${id}`, { method: "DELETE" }), onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({ queryKey: [E] }); } });
  const reset = () => { setEditId(null); setF({ orderNo: "", orderType: "COMPREHENSIVE", title: "", customerId: "" }); };
  const cols: ColumnDef<T>[] = [
    { accessorKey: "orderNo", header: "订单号", cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.orderNo}</span> },
    { accessorKey: "title", header: "标题" },
    { accessorKey: "orderType", header: "类型" },
    { accessorKey: "customer.name", header: "客户", cell: ({ row }) => row.original.customer?.name || "-" },
    { accessorKey: "status", header: "状态", cell: ({ row }) => <StatusBadge status={row.original.status} variant={row.original.status === "ACTIVE" ? "success" : "neutral"} /> },
    { id: "act", header: "操作", cell: ({ row }) => (<div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditId(row.original.id); setF({ orderNo: row.original.orderNo, orderType: row.original.orderType, title: row.original.title, customerId: "" }); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => dm.mutate(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div>) },
  ];
  return (
    <div>
      <PageHeader title="业务订单" description="管理供应链综合服务订单（代垫/收入/成本的锚点）" actionLabel="新增订单" onAction={() => { reset(); setOpen(true); }} />
      <DataTable columns={cols} data={data?.items ?? []} searchKey="orderNo" searchPlaceholder="搜索订单号..." />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editId ? "编辑" : "新增"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4"><div className="space-y-2"><Label>订单号 *</Label><Input value={f.orderNo} onChange={(e) => setF({ ...f, orderNo: e.target.value })} /></div><div className="space-y-2"><Label>类型 *</Label><Input value={f.orderType} onChange={(e) => setF({ ...f, orderType: e.target.value })} /></div><div className="col-span-2 space-y-2"><Label>标题 *</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div></div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>取消</Button><Button onClick={() => sm.mutate()}>{sm.isPending ? "保存中..." : "保存"}</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}
