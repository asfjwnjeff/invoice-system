"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface T { id: string; name: string; amount: number; feeType: string; taxCode: string | null; businessOrder?: { orderNo: string }; }
const E = "fee-items";
const feeTypeLabels: Record<string, string> = { CUSTOMS_SERVICE: "关务服务", CUSTOMS_DUTY: "关税", IMPORT_VAT: "进口增值税", INSPECTION_FEE: "商检费", PORT_FEE: "港口费", INSURANCE: "保险费", EXPRESS_FEE: "快递费", WAREHOUSE_SERVICE: "仓储服务", TRANSPORT_SERVICE: "运输服务", AGENCY_SERVICE: "代理服务", OTHER_ADVANCE: "其他" };

export default function Page() {
  const qc = useQueryClient(); const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [f, setF] = useState({ name: "", amount: 0, feeType: "CUSTOMS_SERVICE", businessOrderId: "", taxCode: "" });
  const { data } = useQuery({ queryKey: [E], queryFn: async () => { const r = await fetch(`/api/${E}`); return (await r.json()).data as { items: T[] }; } });
  const sm = useMutation({ mutationFn: async () => { const m = editId ? "PUT" : "POST"; const u = editId ? `/api/${E}/${editId}` : `/api/${E}`; const r = await fetch(u, { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success(editId ? "已更新" : "已创建"); setOpen(false); reset(); qc.invalidateQueries({ queryKey: [E] }); } else toast.error(r.error ?? "失败"); } });
  const dm = useMutation({ mutationFn: (id: string) => fetch(`/api/${E}/${id}`, { method: "DELETE" }), onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({ queryKey: [E] }); } });
  const reset = () => { setEditId(null); setF({ name: "", amount: 0, feeType: "CUSTOMS_SERVICE", businessOrderId: "", taxCode: "" }); };
  const cols: ColumnDef<T>[] = [
    { accessorKey: "name", header: "费用名称", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: "amount", header: "金额", cell: ({ row }) => <span className="tabular-nums">{row.original.amount.toLocaleString()}</span> },
    { accessorKey: "feeType", header: "费用类型", cell: ({ row }) => feeTypeLabels[row.original.feeType] ?? row.original.feeType },
    { accessorKey: "taxCode", header: "税收编码", cell: ({ row }) => row.original.taxCode || "-" },
    { accessorKey: "businessOrder.orderNo", header: "关联订单", cell: ({ row }) => row.original.businessOrder?.orderNo || "-" },
    { id: "act", header: "操作", cell: ({ row }) => (<div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditId(row.original.id); setF({ name: row.original.name, amount: row.original.amount, feeType: row.original.feeType, businessOrderId: "", taxCode: row.original.taxCode ?? "" }); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div>) },
  ];
  return (
    <div>
      <PageHeader title="费用管理" description="管理业务订单产生的费用明细" actionLabel="新增费用" onAction={() => { reset(); setOpen(true); }} />
      <DataTable columns={cols} data={data?.items ?? []} searchKey="name" />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editId ? "编辑" : "新增"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4"><div className="col-span-2 space-y-2"><Label>名称 *</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div><div className="space-y-2"><Label>金额 *</Label><Input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: +e.target.value })} /></div><div className="space-y-2"><Label>费用类型</Label><Input value={f.feeType} onChange={(e) => setF({ ...f, feeType: e.target.value })} /></div><div className="space-y-2"><Label>订单ID</Label><Input value={f.businessOrderId} onChange={(e) => setF({ ...f, businessOrderId: e.target.value })} /></div></div>
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
