"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
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

interface T { id: string; orderNo: string; title: string; orderType: string; status: string; totalAdvanceAmount: number; totalRevenueAmount: number; invoicedAmount: number; currency: string; startDate: string|null; endDate: string|null; customer?: { name: string }; }
const E = "business-orders";
const statusLabels: Record<string, string> = { DRAFT: "草稿", ACTIVE: "执行中", COMPLETED: "已完成", CANCELLED: "已取消" };
const orderTypeLabels: Record<string, string> = { COMPREHENSIVE: "综合服务", ADVANCE_ONLY: "代垫专项", REVENUE_ONLY: "收入专项", COST_ONLY: "成本专项" };

export default function Page() {
  const qc = useQueryClient(); const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const customerSelect = useEntitySelect("/api/customers/select");
  const [f, setF] = useState({ orderNo: "", orderType: "COMPREHENSIVE", title: "", customerId: "", status: "DRAFT", totalAdvanceAmount: 0, totalRevenueAmount: 0, invoicedAmount: 0, currency: "CNY", startDate: "", endDate: "", remark: "" });
  const { data } = useQuery({ queryKey: [E], queryFn: async () => { const r = await fetch(`/api/${E}`); return (await r.json()).data as { items: T[] }; } });
  const sm = useMutation({ mutationFn: async () => { const m = editId ? "PUT" : "POST"; const u = editId ? `/api/${E}/${editId}` : `/api/${E}`; const r = await fetch(u, { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success(editId ? "已更新" : "已创建"); setOpen(false); reset(); qc.invalidateQueries({ queryKey: [E] }); } else toast.error(r.error ?? "失败"); } });
  const dm = useMutation({ mutationFn: (id: string) => fetch(`/api/${E}/${id}`, { method: "DELETE" }), onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({ queryKey: [E] }); } });
  const reset = () => { setEditId(null); setF({ orderNo: "", orderType: "COMPREHENSIVE", title: "", customerId: "", status: "DRAFT", totalAdvanceAmount: 0, totalRevenueAmount: 0, invoicedAmount: 0, currency: "CNY", startDate: "", endDate: "", remark: "" }); };
  const statusVariant = (s: string) => (s === "ACTIVE" || s === "COMPLETED" ? "success" : s === "CANCELLED" ? "warning" : "neutral") as "success" | "warning" | "neutral";
  const cols: ColumnDef<T>[] = [
    { accessorKey: "orderNo", header: "订单号", cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.orderNo}</span> },
    { accessorKey: "title", header: "标题" },
    { accessorKey: "orderType", header: "类型", cell: ({ row }) => orderTypeLabels[row.original.orderType] ?? row.original.orderType },
    { accessorKey: "customer.name", header: "客户", cell: ({ row }) => row.original.customer?.name || "-" },
    { accessorKey: "totalAdvanceAmount", header: "代垫总额", cell: ({ row }) => <span className="tabular-nums">¥{row.original.totalAdvanceAmount?.toLocaleString() ?? 0}</span> },
    { accessorKey: "totalRevenueAmount", header: "收入总额", cell: ({ row }) => <span className="tabular-nums">¥{row.original.totalRevenueAmount?.toLocaleString() ?? 0}</span> },
    { accessorKey: "invoicedAmount", header: "已开票", cell: ({ row }) => <span className="tabular-nums">¥{row.original.invoicedAmount?.toLocaleString() ?? 0}</span> },
    { accessorKey: "currency", header: "币种" },
    { accessorKey: "status", header: "状态", cell: ({ row }) => <StatusBadge status={statusLabels[row.original.status] ?? row.original.status} variant={statusVariant(row.original.status)} /> },
    { id: "act", header: "操作", cell: ({ row }) => (<div className="flex gap-1"><Link href={`/business-orders/${row.original.id}/edit`}><Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button></Link><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div>) },
  ];
  return (
    <div>
      <PageHeader title="业务订单" description="管理供应链综合服务订单（代垫/收入/成本的锚点）" actionLabel="新增订单" onAction={() => { reset(); setOpen(true); }} />
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground">状态:</span>
        <Button variant={!statusFilter?"default":"outline"} size="sm" className="h-7 text-xs" onClick={()=>setStatusFilter("")}>全部</Button>
        <Button variant={statusFilter==="ACTIVE"?"default":"outline"} size="sm" className="h-7 text-xs" onClick={()=>setStatusFilter("ACTIVE")}>执行中</Button>
        <Button variant={statusFilter==="DRAFT"?"default":"outline"} size="sm" className="h-7 text-xs" onClick={()=>setStatusFilter("DRAFT")}>草稿</Button>
        <Button variant={statusFilter==="COMPLETED"?"default":"outline"} size="sm" className="h-7 text-xs" onClick={()=>setStatusFilter("COMPLETED")}>已完成</Button>
        <Button variant={statusFilter==="CANCELLED"?"default":"outline"} size="sm" className="h-7 text-xs" onClick={()=>setStatusFilter("CANCELLED")}>已取消</Button>
        {statusFilter && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={()=>setStatusFilter("")}>清除</Button>}
      </div>
      <DataTable columns={cols} data={(data?.items??[]).filter(i => !statusFilter || i.status===statusFilter)} searchKey="orderNo" searchPlaceholder="搜索订单号..." />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>{editId ? "编辑" : "新增"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2"><Label>订单号 *</Label><Input value={f.orderNo} onChange={(e) => setF({ ...f, orderNo: e.target.value })} /></div>
          <div className="space-y-2"><Label>类型 *</Label><Select value={f.orderType} onValueChange={(v) => setF({ ...f, orderType: v })}><SelectTrigger className="w-full" /><SelectContent>{Object.entries(orderTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
          <div className="col-span-2 space-y-2"><Label>标题 *</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div className="space-y-2"><Label>客户</Label><Select value={f.customerId} onValueChange={(v) => setF({ ...f, customerId: v })}><SelectTrigger className="w-full" /><SelectContent>{(customerSelect.data ?? []).map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>状态</Label><Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}><SelectTrigger className="w-full" /><SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>代垫总额</Label><Input type="number" value={f.totalAdvanceAmount} onChange={(e) => setF({ ...f, totalAdvanceAmount: +e.target.value })} /></div>
          <div className="space-y-2"><Label>收入总额</Label><Input type="number" value={f.totalRevenueAmount} onChange={(e) => setF({ ...f, totalRevenueAmount: +e.target.value })} /></div>
          <div className="space-y-2"><Label>已开票金额</Label><Input type="number" value={f.invoicedAmount} onChange={(e) => setF({ ...f, invoicedAmount: +e.target.value })} /></div>
          <div className="space-y-2"><Label>币种</Label><Select value={f.currency} onValueChange={(v) => setF({ ...f, currency: v })}><SelectTrigger className="w-full" /><SelectContent><SelectItem value="CNY">人民币</SelectItem><SelectItem value="USD">美元</SelectItem><SelectItem value="HKD">港币</SelectItem><SelectItem value="EUR">欧元</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>开始日期</Label><Input type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} /></div>
          <div className="space-y-2"><Label>结束日期</Label><Input type="date" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} /></div>
          <div className="col-span-2 space-y-2"><Label>备注</Label><Input value={f.remark} onChange={(e) => setF({ ...f, remark: e.target.value })} /></div>
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
