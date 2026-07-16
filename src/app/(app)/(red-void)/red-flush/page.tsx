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
import { Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useEntitySelect } from "@/lib/hooks/use-entity-select";

interface T { id: string; appNo: string; originalInvoiceId: string; redFlushType: string; redFlushReason: string; amountWithTax: number; status: string; needsReissue: boolean; verifyCheckStatus?: string; bizStatusCheck?: string; }

export default function Page() {
  const qc = useQueryClient(); const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [f, setF] = useState({ appNo:"", originalInvoiceId:"", redFlushType:"FULL", redFlushReason:"SALES_RETURN", reasonDetail:"", amountWithoutTax:0, taxAmount:0, amountWithTax:0, needsReissue:false });
  const [validation, setValidation] = useState<{ verifyStatus: string; usageStatus: string; canProceed: boolean; message: string }>({ verifyStatus: "", usageStatus: "", canProceed: false, message: "" });
  const invoiceSelect = useEntitySelect("/api/output-invoices/select" as string);
  const { data } = useQuery({ queryKey:["red-flush"], queryFn: async () => { const r = await fetch("/api/red-flush"); return (await r.json()).data as { items: T[] }; } });
  const sm = useMutation({ mutationFn: async () => { const r = await fetch("/api/red-flush", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(f) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success("已创建"); setOpen(false); qc.invalidateQueries({ queryKey:["red-flush"] }); } else toast.error(r.error ?? "失败"); } });
  const dm = useMutation({ mutationFn: (id: string) => fetch(`/api/red-flush/${id}`, { method:"DELETE" }), onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({ queryKey:["red-flush"] }); } });

  // Load invoice data and validate
  const loadInvoice = async (invoiceId: string) => {
    if (!invoiceId) { setValidation({ verifyStatus: "", usageStatus: "", canProceed: false, message: "" }); return; }
    setF(p => ({ ...p, originalInvoiceId: invoiceId }));
    try {
      const r = await fetch(`/api/invoices/${invoiceId}`);
      const j = await r.json();
      if (j.success && j.data) {
        const inv = j.data;
        setF(p => ({ ...p, amountWithoutTax: +inv.amountWithoutTax || 0, taxAmount: +inv.taxAmount || 0, amountWithTax: +inv.amountWithTax || 0 }));
        // Validate: inspect result = "查验成功" AND usageStatus ∈ {作废, 红冲, 验证成功}
        const verifyOk = inv.verifyStatus === "VERIFIED";
        const usageOk = ["VOIDED", "RED_FLUSHED", "UNUSED"].includes(inv.usageStatus);
        const canProceed = verifyOk && usageOk;
        setValidation({
          verifyStatus: verifyOk ? "查验成功 ✓" : `查验状态: ${inv.verifyStatus || "未知"} ✗`,
          usageStatus: usageOk ? `业务状态符合 ✓` : `业务状态: ${inv.usageStatus || "未知"} ✗`,
          canProceed,
          message: canProceed ? "准入条件满足，可以发起红冲" : "不满足红冲准入条件：" + (!verifyOk ? "查验结果非成功 " : "") + (!usageOk ? "业务状态不符合要求" : ""),
        });
      }
    } catch { setValidation({ verifyStatus: "加载失败", usageStatus: "加载失败", canProceed: false, message: "无法获取发票信息" }); }
  };
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
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>新建红冲申请（红字发票确认单）</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>申请号 *</Label><Input value={f.appNo} onChange={e => setF({...f, appNo: e.target.value})} /></div>
            <div className="space-y-2"><Label>选择蓝字发票 *</Label>
              <Select value={f.originalInvoiceId} onValueChange={(v) => { setF({...f, originalInvoiceId: v}); loadInvoice(v); }}>
                <SelectTrigger><SelectValue>搜索选择发票...</SelectValue></SelectTrigger>
                <SelectContent>
                  {(invoiceSelect.data ?? []).map((inv) => <SelectItem key={inv.id} value={inv.id}>{inv.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>红冲类型</Label><Select value={f.redFlushType} onValueChange={v => setF({...f, redFlushType: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="FULL">全额红冲</SelectItem><SelectItem value="PARTIAL">部分红冲</SelectItem><SelectItem value="REISSUE">错票重开</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>原因</Label><Select value={f.redFlushReason} onValueChange={v => setF({...f, redFlushReason: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SALES_RETURN">销售退回</SelectItem><SelectItem value="INVOICE_ERROR">开票有误</SelectItem><SelectItem value="AMOUNT_DISCOUNT">销售折让</SelectItem><SelectItem value="SERVICE_TERMINATION">服务中止</SelectItem><SelectItem value="OTHER">其他</SelectItem></SelectContent></Select></div>
          </div>

          {/* 准入校验面板 */}
          {f.originalInvoiceId && (
            <div className={`p-4 rounded-sm border ${validation.canProceed ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}`}>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                {validation.canProceed ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />}
                红冲准入校验
              </h4>
              <div className="space-y-1 text-sm">
                <p className={validation.verifyStatus.includes("✓") ? "text-emerald-700" : "text-red-700"}>① 查验结果：{validation.verifyStatus}</p>
                <p className={validation.usageStatus.includes("✓") ? "text-emerald-700" : "text-red-700"}>② 业务状态：{validation.usageStatus}</p>
                <p className={`text-xs mt-2 font-medium ${validation.canProceed ? "text-emerald-600" : "text-red-600"}`}>{validation.message}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>不含税金额</Label><Input type="number" value={f.amountWithoutTax} onChange={e => setF({...f, amountWithoutTax: +e.target.value})} /></div>
            <div className="space-y-2"><Label>税额</Label><Input type="number" value={f.taxAmount} onChange={e => setF({...f, taxAmount: +e.target.value, amountWithTax: f.amountWithoutTax + +e.target.value})} /></div>
            <div className="space-y-2"><Label>价税合计</Label><Input type="number" value={f.amountWithTax} disabled className="bg-muted" /></div>
          </div>
          <div className="space-y-2"><Label>原因说明</Label><Input value={f.reasonDetail} onChange={e => setF({...f, reasonDetail: e.target.value})} /></div>
          <div className="flex items-center space-x-2"><Checkbox id="ri" checked={f.needsReissue} onCheckedChange={v => setF({...f, needsReissue: !!v})} /><Label htmlFor="ri">需要重开蓝票</Label></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>取消</Button><Button onClick={() => sm.mutate()} disabled={!validation.canProceed && !!f.originalInvoiceId || sm.isPending}>{sm.isPending ? "提交中..." : "提交"}</Button></DialogFooter>
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
