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
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useEntitySelect } from "@/lib/hooks/use-entity-select";

interface T { id: string; orderNo: string; title: string; totalRevenueAmount: number; invoicedAmount: number; availableAmount: number; invoiceStatus: string; customer?: { name: string }; }
const E = "revenue-orders";
const invoiceStatusLabels: Record<string, string> = { NOT_INVOICED: "未开票", PARTIALLY: "部分开票", INVOICED: "已开票" };

export default function Page() {
  const qc = useQueryClient(); const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const boSelect = useEntitySelect("/api/business-orders/select");
  const customerSelect = useEntitySelect("/api/customers/select");
  const [f, setF] = useState({ orderNo: "", title: "", businessOrderId: "", customerId: "", totalRevenueAmount: 0, invoicedAmount: 0, availableAmount: 0, startDate: "", endDate: "", remark: "" });
  const { data } = useQuery({ queryKey: [E], queryFn: async () => { const r = await fetch(`/api/${E}`); return (await r.json()).data as { items: T[] }; } });
  const sm = useMutation({ mutationFn: async () => { const m = editId ? "PUT" : "POST"; const u = editId ? `/api/${E}/${editId}` : `/api/${E}`; const r = await fetch(u, { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success(editId ? "已更新" : "已创建"); setOpen(false); reset(); qc.invalidateQueries({ queryKey: [E] }); } else toast.error(r.error ?? "失败"); } });
  const dm = useMutation({ mutationFn: (id: string) => fetch(`/api/${E}/${id}`, { method: "DELETE" }), onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({ queryKey: [E] }); } });
  const reset = () => { setEditId(null); setF({ orderNo: "", title: "", businessOrderId: "", customerId: "", totalRevenueAmount: 0, invoicedAmount: 0, availableAmount: 0, startDate: "", endDate: "", remark: "" }); };
  const cols: ColumnDef<T>[] = [
    { accessorKey: "orderNo", header: "订单号", cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.orderNo}</span> },
    { accessorKey: "title", header: "标题" },
    { accessorKey: "customer.name", header: "客户", cell: ({ row }) => row.original.customer?.name || "-" },
    { accessorKey: "totalRevenueAmount", header: "收入总额", cell: ({ row }) => <span className="tabular-nums">¥{row.original.totalRevenueAmount.toLocaleString()}</span> },
    { accessorKey: "invoicedAmount", header: "已开票", cell: ({ row }) => <span className="tabular-nums">¥{row.original.invoicedAmount?.toLocaleString() ?? "-"}</span> },
    { accessorKey: "availableAmount", header: "可开票余额", cell: ({ row }) => <span className="tabular-nums">¥{row.original.availableAmount.toLocaleString()}</span> },
    { accessorKey: "invoiceStatus", header: "开票状态", cell: ({ row }) => <StatusBadge status={invoiceStatusLabels[row.original.invoiceStatus] ?? row.original.invoiceStatus} variant={row.original.invoiceStatus === "INVOICED" ? "success" : "warning"} /> },
    { id: "act", header: "操作", cell: ({ row }) => (<div className="flex gap-1"><Link href={`/revenue-orders/${row.original.id}`}><Button variant="ghost" size="sm" className="h-8">查看</Button></Link><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditId(row.original.id); setF({ orderNo: row.original.orderNo, title: row.original.title, businessOrderId: "", customerId: "", totalRevenueAmount: row.original.totalRevenueAmount, invoicedAmount: row.original.invoicedAmount ?? 0, availableAmount: row.original.availableAmount ?? 0, startDate: "", endDate: "", remark: "" }); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div>) },
  ];
  return (
    <div>
      <PageHeader title="收入订单" description="销项发票的可开票池（收入锚点）" actionLabel="新增收入订单" onAction={() => { reset(); setOpen(true); }} />
      <DataTable columns={cols} data={data?.items ?? []} searchKey="orderNo" />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>{editId ? "编辑" : "新增"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2"><Label>订单号 *</Label><Input value={f.orderNo} onChange={(e) => setF({ ...f, orderNo: e.target.value })} /></div>
          <div className="space-y-2"><Label>标题 *</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div className="space-y-2"><Label>收入总额</Label><Input type="number" value={f.totalRevenueAmount} onChange={(e) => setF({ ...f, totalRevenueAmount: +e.target.value, availableAmount: +e.target.value - f.invoicedAmount })} /></div>
          <div className="space-y-2"><Label>已开票金额</Label><Input type="number" value={f.invoicedAmount} onChange={(e) => setF({ ...f, invoicedAmount: +e.target.value, availableAmount: f.totalRevenueAmount - +e.target.value })} /></div>
          <div className="space-y-2"><Label>可开票余额</Label><Input type="number" value={f.availableAmount} readOnly className="bg-muted" /></div>
          <div className="space-y-2"><Label>开始日期</Label><Input type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} /></div>
          <div className="space-y-2"><Label>结束日期</Label><Input type="date" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} /></div>
          <div className="space-y-2"><Label>备注</Label><Input value={f.remark} onChange={(e) => setF({ ...f, remark: e.target.value })} /></div>
          <div className="space-y-2"><Label>关联业务订单</Label><Select value={f.businessOrderId} onValueChange={(v) => setF({ ...f, businessOrderId: v })}><SelectTrigger className="w-full" /><SelectContent>{(boSelect.data ?? []).map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>客户</Label><Select value={f.customerId} onValueChange={(v) => setF({ ...f, customerId: v })}><SelectTrigger className="w-full" /><SelectContent>{(customerSelect.data ?? []).map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></div>
        </div>
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
