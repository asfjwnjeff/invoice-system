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
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useEntitySelect } from "@/lib/hooks/use-entity-select";

interface T { id: string; applicationNo: string; invoice?: { invoiceNo: string } | null; voidCategory: string; voidReason: string; status: string; createdAt: string; }

const E = "void-applications";
const categoryLabels: Record<string, string> = { APPLICATION_CANCEL: "申请作废", LEGACY_VOID: "历史发票作废", AGENCY_VOID: "代办发票作废" };
const reasonLabels: Record<string, string> = { SALES_RETURN: "销货退回", SERVICE_CANCEL: "服务取消", AMOUNT_ERROR: "金额错误", CUSTOMER_NAME_ERROR: "购方名称错误", TAX_NO_ERROR: "税号错误", INVOICE_DAMAGED: "发票损坏", DUPLICATE: "重复开票", OTHER: "其他" };
const statusLabels: Record<string, string> = { DRAFT: "草稿", PENDING_APPROVAL: "待审批", APPROVED: "已批准", REJECTED: "已驳回", EXECUTED: "已执行" };

export default function Page() {
  const qc = useQueryClient(); const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const invoiceSelect = useEntitySelect("/api/output-invoices/select");
  const [f, setF] = useState({ applicationNo: "", invoiceId: "", voidCategory: "LEGACY_VOID", voidReason: "OTHER", reasonDetail: "", status: "DRAFT" });
  const { data } = useQuery({ queryKey: [E], queryFn: async () => { const r = await fetch(`/api/${E}`); return (await r.json()).data as { items: T[] }; } });
  const sm = useMutation({ mutationFn: async () => { const m = editId ? "PUT" : "POST"; const u = editId ? `/api/${E}/${editId}` : `/api/${E}`; const r = await fetch(u, { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success(editId ? "已更新" : "已创建"); setOpen(false); reset(); qc.invalidateQueries({ queryKey: [E] }); } else toast.error(r.error ?? "失败"); } });
  const dm = useMutation({ mutationFn: (id: string) => fetch(`/api/${E}/${id}`, { method: "DELETE" }), onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({ queryKey: [E] }); } });
  const reset = () => { setEditId(null); setF({ applicationNo: "", invoiceId: "", voidCategory: "LEGACY_VOID", voidReason: "OTHER", reasonDetail: "", status: "DRAFT" }); };

  const sv = (s: string): "success" | "warning" | "danger" | "neutral" => s === "APPROVED" || s === "EXECUTED" ? "success" : s === "PENDING_APPROVAL" ? "warning" : s === "REJECTED" ? "danger" : "neutral";

  const cols: ColumnDef<T>[] = [
    { accessorKey: "applicationNo", header: "作废编号", cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.applicationNo}</span> },
    { accessorKey: "invoice.invoiceNo", header: "关联发票", cell: ({ row }) => row.original.invoice?.invoiceNo ?? "-" },
    { accessorKey: "voidCategory", header: "作废类别", cell: ({ row }) => categoryLabels[row.original.voidCategory] ?? row.original.voidCategory },
    { accessorKey: "voidReason", header: "作废原因", cell: ({ row }) => reasonLabels[row.original.voidReason] ?? row.original.voidReason },
    { accessorKey: "status", header: "状态", cell: ({ row }) => <StatusBadge status={statusLabels[row.original.status] ?? row.original.status} variant={sv(row.original.status)} /> },
    { accessorKey: "createdAt", header: "申请时间", cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("zh-CN") },
    { id: "act", header: "操作", cell: ({ row }) => (<div className="flex gap-1"><Button variant="ghost" size="sm" className="h-8" onClick={() => { setEditId(row.original.id); setF({ applicationNo: row.original.applicationNo, invoiceId: row.original.invoice?.invoiceNo ? row.original.id : "", voidCategory: row.original.voidCategory, voidReason: row.original.voidReason, reasonDetail: "", status: row.original.status }); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div>) },
  ];

  return (
    <div>
      <PageHeader title="作废管理" description="发票作废申请与审批管理" actionLabel="新增作废申请" onAction={() => { reset(); setOpen(true); }} />
      <DataTable columns={cols} data={data?.items ?? []} searchKey="applicationNo" searchPlaceholder="搜索作废编号..." />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editId ? "编辑作废申请" : "新增作废申请"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2"><Label>作废编号</Label><Input value={f.applicationNo} onChange={(e) => setF({ ...f, applicationNo: e.target.value })} placeholder="自动生成" /></div>
          <div className="space-y-2"><Label>作废类别</Label><Select value={f.voidCategory} onValueChange={(v) => setF({ ...f, voidCategory: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>作废原因</Label><Select value={f.voidReason} onValueChange={(v) => setF({ ...f, voidReason: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(reasonLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>状态</Label><Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>关联发票</Label><Select value={f.invoiceId} onValueChange={(v) => setF({ ...f, invoiceId: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(invoiceSelect.data ?? []).map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="col-span-2 space-y-2"><Label>详细说明</Label><Input value={f.reasonDetail} onChange={(e) => setF({ ...f, reasonDetail: e.target.value })} /></div>
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
