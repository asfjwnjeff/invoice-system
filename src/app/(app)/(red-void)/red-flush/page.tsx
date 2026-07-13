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
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface T { id: string; appNo: string; originalInvoiceId: string; redFlushType: string; redFlushReason: string; amountWithTax: number; status: string; needsReissue: boolean; }

export default function Page() {
  const qc = useQueryClient(); const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [f, setF] = useState({ appNo:"RF-"+Date.now(), originalInvoiceId:"", redFlushType:"FULL", redFlushReason:"SALES_RETURN", reasonDetail:"", amountWithoutTax:0, taxAmount:0, amountWithTax:0, needsReissue:false });
  const { data } = useQuery({ queryKey:["red-flush"], queryFn: async () => { const r = await fetch("/api/red-flush"); return (await r.json()).data as { items: T[] }; } });
  const sm = useMutation({ mutationFn: async () => { const r = await fetch("/api/red-flush", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(f) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success("已创建"); setOpen(false); qc.invalidateQueries({ queryKey:["red-flush"] }); } else toast.error(r.error ?? "失败"); } });
  const dm = useMutation({ mutationFn: (id: string) => fetch(`/api/red-flush/${id}`, { method:"DELETE" }), onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({ queryKey:["red-flush"] }); } });
  const rfTypeLabels: Record<string, string> = { FULL: "全额红冲", PARTIAL: "部分红冲", REISSUE: "错票重开" };
const rfReasonLabels: Record<string, string> = { SALES_RETURN: "销售退回", INVOICE_ERROR: "开票有误", AMOUNT_DISCOUNT: "销售折让", SERVICE_TERMINATION: "服务中止", OTHER: "其他" };
const rfStatusLabels: Record<string, string> = { DRAFT: "草稿", PENDING_APPROVAL: "待审批", APPROVED: "已审批", REJECTED: "已驳回", COMPLETED: "已完成", CANCELLED: "已取消" };
const sv = (s: string): "success"|"warning"|"danger"|"neutral" => s==="COMPLETED"?"success":s==="REJECTED"?"danger":"warning";
  const cols: ColumnDef<T>[] = [
    { accessorKey:"appNo", header:"申请号", cell:({ row }) => <span className="font-medium tabular-nums">{row.original.appNo}</span> },
    { accessorKey:"redFlushType", header:"红冲类型", cell:({ row }) => rfTypeLabels[row.original.redFlushType] ?? row.original.redFlushType },
    { accessorKey:"redFlushReason", header:"原因", cell:({ row }) => rfReasonLabels[row.original.redFlushReason] ?? row.original.redFlushReason },
    { accessorKey:"amountWithTax", header:"金额", cell:({ row }) => <span className="tabular-nums">¥{row.original.amountWithTax.toLocaleString()}</span> },
    { accessorKey:"status", header:"状态", cell:({ row }) => <StatusBadge status={rfStatusLabels[row.original.status] ?? row.original.status} variant={sv(row.original.status)} /> },
    { id:"act", header:"操作", cell:({ row }) => <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button> },
  ];
  return (
    <div>
      <PageHeader title="红冲管理" description="管理蓝字发票的红冲申请与确认单流程" actionLabel="新建红冲" onAction={() => setOpen(true)} />
      <DataTable columns={cols} data={data?.items ?? []} searchKey="appNo" />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>新建红冲申请</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2"><Label>申请号 *</Label><Input value={f.appNo} onChange={e => setF({...f, appNo: e.target.value})} /></div>
          <div className="space-y-2"><Label>原发票ID *</Label><Input value={f.originalInvoiceId} onChange={e => setF({...f, originalInvoiceId: e.target.value})} /></div>
          <div className="space-y-2"><Label>红冲类型</Label><Select value={f.redFlushType} onValueChange={v => setF({...f, redFlushType: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="FULL">全额红冲</SelectItem><SelectItem value="PARTIAL">部分红冲</SelectItem><SelectItem value="REISSUE">错票重开</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>原因</Label><Select value={f.redFlushReason} onValueChange={v => setF({...f, redFlushReason: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SALES_RETURN">销售退回</SelectItem><SelectItem value="INVOICE_ERROR">开票有误</SelectItem><SelectItem value="AMOUNT_DISCOUNT">销售折让</SelectItem><SelectItem value="SERVICE_TERMINATION">服务中止</SelectItem><SelectItem value="OTHER">其他</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>不含税金额</Label><Input type="number" value={f.amountWithoutTax} onChange={e => setF({...f, amountWithoutTax: +e.target.value})} /></div>
          <div className="space-y-2"><Label>税额</Label><Input type="number" value={f.taxAmount} onChange={e => setF({...f, taxAmount: +e.target.value, amountWithTax: f.amountWithoutTax + +e.target.value})} /></div>
          <div className="space-y-2"><Label>价税合计</Label><Input type="number" value={f.amountWithTax} disabled className="bg-muted" /></div>
          <div className="col-span-2 space-y-2"><Label>原因说明</Label><Input value={f.reasonDetail} onChange={e => setF({...f, reasonDetail: e.target.value})} /></div>
          <div className="flex items-center space-x-2"><Checkbox id="ri" checked={f.needsReissue} onCheckedChange={v => setF({...f, needsReissue: !!v})} /><Label htmlFor="ri">需要重开蓝票</Label></div>
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
