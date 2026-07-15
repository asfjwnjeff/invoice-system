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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useEntitySelect } from "@/lib/hooks/use-entity-select";

interface T { id: string; entryNo: string; costType: string; description: string; amount: number; f01Status: string; c01Status: string; status: string; businessOrder?: { orderNo: string }; supplier?: { name: string }; costCenter?: { name: string }; createdAt: string; }

const f01Labels: Record<string, string> = { PENDING: "待上传", UPLOADED: "已上传" };
const c01Labels: Record<string, string> = { PENDING: "待登记", REGISTERED: "已登记" };
const statusLabels: Record<string, string> = { DRAFT: "草稿", INVOICE_UPLOADED: "已上传发票", REGISTERED: "已登记", COMPLETED: "已完成" };

export default function CostEntryPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [f, setF] = useState({ businessOrderId: "", supplierId: "", costCenterId: "", costType: "", description: "", amount: 0, currency: "CNY", occurredDate: "", remark: "" });
  const boSelect = useEntitySelect("/api/business-orders/select");
  const supplierSelect = useEntitySelect("/api/suppliers/select");
  const costCenterSelect = useEntitySelect("/api/cost-centers/select");

  const { data } = useQuery({ queryKey: ["cost-entries"], queryFn: async () => { const r = await fetch("/api/cost-entries"); return (await r.json()).data as { items: T[] }; } });

  const sm = useMutation({
    mutationFn: async () => {
      const m = editId ? "PUT" : "POST";
      const u = editId ? `/api/cost-entries/${editId}` : "/api/cost-entries";
      const r = await fetch(u, { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      return r.json();
    },
    onSuccess: (r) => { if (r.success) { toast.success(editId ? "已更新" : "已创建"); setOpen(false); reset(); qc.invalidateQueries({ queryKey: ["cost-entries"] }); } else toast.error(r.error ?? "失败"); },
  });

  const dm = useMutation({ mutationFn: (id: string) => fetch(`/api/cost-entries/${id}`, { method: "DELETE" }), onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({ queryKey: ["cost-entries"] }); } });

  // F01: Upload invoice (simulated)
  const f01Mut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/cost-entries/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ f01Status: "UPLOADED" }) });
      return r.json();
    },
    onSuccess: () => { toast.success("F01: 发票已上传"); qc.invalidateQueries({ queryKey: ["cost-entries"] }); },
  });

  // C01: Register invoice (simulated)
  const c01Mut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/cost-entries/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ c01Status: "REGISTERED" }) });
      return r.json();
    },
    onSuccess: () => { toast.success("C01: 发票已登记"); qc.invalidateQueries({ queryKey: ["cost-entries"] }); },
  });

  const reset = () => { setEditId(null); setF({ businessOrderId: "", supplierId: "", costCenterId: "", costType: "", description: "", amount: 0, currency: "CNY", occurredDate: "", remark: "" }); };

  const sv = (s: string): "success" | "warning" | "danger" | "neutral" => s === "COMPLETED" || s === "REGISTERED" ? "success" : s === "INVOICE_UPLOADED" ? "warning" : "neutral";

  const cols: ColumnDef<T>[] = [
    { accessorKey: "entryNo", header: "成本编号", cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.entryNo}</span> },
    { accessorKey: "businessOrder.orderNo", header: "业务订单", cell: ({ row }) => row.original.businessOrder?.orderNo || "-" },
    { accessorKey: "supplier.name", header: "供应商", cell: ({ row }) => row.original.supplier?.name || "-" },
    { accessorKey: "costCenter.name", header: "成本中心", cell: ({ row }) => row.original.costCenter?.name || "-" },
    { accessorKey: "costType", header: "成本类型" },
    { accessorKey: "description", header: "描述" },
    { accessorKey: "amount", header: "金额", cell: ({ row }) => <span className="tabular-nums">¥{row.original.amount.toLocaleString()}</span> },
    { accessorKey: "f01Status", header: "F01", cell: ({ row }) => <StatusBadge status={f01Labels[row.original.f01Status] || row.original.f01Status} variant={row.original.f01Status === "UPLOADED" ? "success" : "warning"} /> },
    { accessorKey: "c01Status", header: "C01", cell: ({ row }) => <StatusBadge status={c01Labels[row.original.c01Status] || row.original.c01Status} variant={row.original.c01Status === "REGISTERED" ? "success" : "warning"} /> },
    { accessorKey: "status", header: "状态", cell: ({ row }) => <StatusBadge status={statusLabels[row.original.status] || row.original.status} variant={sv(row.original.status)} /> },
    {
      id: "act", header: "操作",
      cell: ({ row }) => (
        <div className="flex gap-1 flex-wrap">
          {row.original.f01Status === "PENDING" && <Button variant="ghost" size="sm" className="h-8 text-accent" onClick={() => f01Mut.mutate(row.original.id)}>F01上传发票</Button>}
          {row.original.f01Status === "UPLOADED" && row.original.c01Status === "PENDING" && <Button variant="ghost" size="sm" className="h-8 text-accent" onClick={() => c01Mut.mutate(row.original.id)}>C01登记发票</Button>}
          <Button variant="ghost" size="sm" className="h-8 text-destructive" onClick={() => setDeleteId(row.original.id)}>删除</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="成本录入" description="F01录入成本并上传发票 → C01登记发票 → 完成成本录入" actionLabel="新增成本" onAction={() => { reset(); setOpen(true); }} />
      <DataTable columns={cols} data={data?.items ?? []} searchKey="description" searchPlaceholder="搜索描述..." />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl"><DialogHeader><DialogTitle>{editId ? "编辑" : "新增成本录入"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2"><Label>业务订单 *</Label>
              <Select value={f.businessOrderId} onValueChange={(v) => setF({ ...f, businessOrderId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(boSelect.data ?? []).map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>供应商</Label>
              <Select value={f.supplierId} onValueChange={(v) => setF({ ...f, supplierId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(supplierSelect.data ?? []).map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>成本中心</Label>
              <Select value={f.costCenterId} onValueChange={(v) => setF({ ...f, costCenterId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(costCenterSelect.data ?? []).map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>成本类型</Label><Input value={f.costType} onChange={(e) => setF({ ...f, costType: e.target.value })} placeholder="如: 运输费、仓储费" /></div>
            <div className="col-span-2 space-y-2"><Label>描述</Label><Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
            <div className="space-y-2"><Label>金额</Label><Input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: +e.target.value })} /></div>
            <div className="space-y-2"><Label>日期</Label><Input type="date" value={f.occurredDate} onChange={(e) => setF({ ...f, occurredDate: e.target.value })} /></div>
            <div className="col-span-2 space-y-2"><Label>备注</Label><Input value={f.remark} onChange={(e) => setF({ ...f, remark: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>取消</Button><Button onClick={() => sm.mutate()}>{sm.isPending ? "保存中..." : "保存"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="确认删除" description="确认删除此成本记录？" confirmLabel="删除" variant="danger" loading={dm.isPending} onConfirm={() => deleteId && dm.mutate(deleteId)} />
    </div>
  );
}
