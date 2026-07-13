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
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface T { id: string; appNo: string; voidCategory: string; voidReason: string; targetType: string; status: string; }

export default function Page() {
  const qc = useQueryClient(); const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [f, setF] = useState({ appNo:"VOID-"+Date.now(), targetType:"INVOICE", targetId:"", voidCategory:"LEGACY_INVOICE_VOID", voidReason:"AMOUNT_ERROR", reasonDetail:"" });
  const { data } = useQuery({ queryKey:["void"], queryFn: async () => { const r = await fetch("/api/void"); return (await r.json()).data as { items: T[] }; } });
  const sm = useMutation({ mutationFn: async () => { const r = await fetch("/api/void", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(f) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success("已创建"); setOpen(false); qc.invalidateQueries({ queryKey:["void"] }); } else toast.error(r.error??"失败"); } });
  const dm = useMutation({ mutationFn: (id: string) => fetch(`/api/void/${id}`, { method:"DELETE" }), onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({ queryKey:["void"] }); } });
  const voidStatusLabels: Record<string, string> = { DRAFT: "草稿", APPROVED: "已审批", REJECTED: "已驳回", EXECUTED: "已执行" };
const voidCategoryLabels: Record<string, string> = { APPLICATION_CANCEL: "开票申请取消", LEGACY_INVOICE_VOID: "传统票据作废", AGENCY_INVOICE_VOID: "代开发票作废" };
const voidReasonLabels: Record<string, string> = { AMOUNT_ERROR: "金额错误", TAX_RATE_ERROR: "税率错误", BUYER_INFO_ERROR: "抬头错误", DUPLICATE_ISSUE: "重复开票", OTHER: "其他" };
const targetTypeLabels: Record<string, string> = { INVOICE: "发票", APPLICATION: "开票申请" };
const sv = (s: string): "success"|"warning"|"danger"|"neutral" => s==="EXECUTED"?"success":s==="REJECTED"?"danger":"warning";
  const cols: ColumnDef<T>[] = [
    { accessorKey:"appNo", header:"作废单号", cell:({ row }) => <span className="font-medium tabular-nums">{row.original.appNo}</span> },
    { accessorKey:"voidCategory", header:"作废类别", cell:({ row }) => voidCategoryLabels[row.original.voidCategory] ?? row.original.voidCategory },
    { accessorKey:"voidReason", header:"原因", cell:({ row }) => voidReasonLabels[row.original.voidReason] ?? row.original.voidReason },
    { accessorKey:"targetType", header:"目标类型", cell:({ row }) => targetTypeLabels[row.original.targetType] ?? row.original.targetType },
    { accessorKey:"status", header:"状态", cell:({ row }) => <StatusBadge status={voidStatusLabels[row.original.status] ?? row.original.status} variant={sv(row.original.status)} /> },
    { id:"act", header:"操作", cell:({ row }) => <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button> },
  ];
  return (
    <div>
      <PageHeader title="作废管理" description="管理开票申请取消、传统票据作废、代开发票作废" actionLabel="新建作废" onAction={() => setOpen(true)} />
      <DataTable columns={cols} data={data?.items ?? []} searchKey="appNo" />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>新建作废申请</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2"><Label>申请号 *</Label><Input value={f.appNo} onChange={e => setF({...f, appNo: e.target.value})} /></div>
          <div className="space-y-2"><Label>目标ID *</Label><Input value={f.targetId} onChange={e => setF({...f, targetId: e.target.value})} /></div>
          <div className="space-y-2"><Label>类别</Label><Select value={f.voidCategory} onValueChange={v => setF({...f, voidCategory: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="APPLICATION_CANCEL">开票申请取消</SelectItem><SelectItem value="LEGACY_INVOICE_VOID">传统票据作废</SelectItem><SelectItem value="AGENCY_INVOICE_VOID">代开发票作废</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>原因</Label><Select value={f.voidReason} onValueChange={v => setF({...f, voidReason: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="AMOUNT_ERROR">金额错误</SelectItem><SelectItem value="TAX_RATE_ERROR">税率错误</SelectItem><SelectItem value="BUYER_INFO_ERROR">抬头错误</SelectItem><SelectItem value="DUPLICATE_ISSUE">重复开票</SelectItem><SelectItem value="OTHER">其他</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>目标类型</Label><Select value={f.targetType} onValueChange={v => setF({...f, targetType: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INVOICE">发票</SelectItem><SelectItem value="APPLICATION">开票申请</SelectItem></SelectContent></Select></div>
          <div className="col-span-2 space-y-2"><Label>原因说明</Label><Input value={f.reasonDetail} onChange={e => setF({...f, reasonDetail: e.target.value})} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>取消</Button><Button onClick={() => sm.mutate()}>{sm.isPending ? "提交中..." : "提交"}</Button></DialogFooter>
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
