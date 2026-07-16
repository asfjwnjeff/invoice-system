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

interface T { id: string; advanceNo: string; businessOrder?: { orderNo: string }; customer?: { name: string }; feeType: string; currency: string; originalAmount: number; baseCurrencyAmount: number; collectionStatus: string; writeOffStatus: string; status: string; isInvoiced: boolean; }

const E = "advance-payments";
const feeTypeLabels: Record<string, string> = { CUSTOMS_DUTY: "关税", IMPORT_VAT: "进口增值税", PORT_FEE: "港口费用", TRANSPORT: "运输", WAREHOUSE: "仓储", CUSTOMS_AGENCY: "报关代理", INSURANCE: "保险", OTHER: "其他" };
const collectionLabels: Record<string, string> = { PENDING: "待收款", PARTIALLY: "部分收款", COLLECTED: "已收款", WRITTEN_OFF: "已核销" };
const statusLabels: Record<string, string> = { DRAFT: "草稿", PENDING_CONFIRM: "待确认", CONFIRMED: "已确认", PENDING_COLLECTION: "待收款", PARTIALLY_COLLECTED: "部分收款", COLLECTED: "已收款", WRITTEN_OFF: "已核销", DISPUTED: "争议" };
const payerLabels: Record<string, string> = { COMPANY: "公司垫付", CUSTOMER: "客户自付" };
const strategyLabels: Record<string, string> = { NO_INVOICE: "不开票", SEPARATE_INVOICE: "单独开票", MERGE_WITH_SERVICE: "合并服务费开票", SERVICE_ONLY: "仅服务费开票", NET_AMOUNT_INVOICE: "净额开票", MANUAL: "人工处理" };

export default function Page() {
  const qc = useQueryClient(); const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const customerSelect = useEntitySelect("/api/customers/select");
  const boSelect = useEntitySelect("/api/business-orders/select");
  const [f, setF] = useState({ advanceNo: "", customerId: "", businessOrderId: "", feeType: "", currency: "CNY", originalAmount: 0, exchangeRate: 1, baseCurrencyAmount: 0, payerType: "COMPANY", invoiceStrategy: "NO_INVOICE", collectionStatus: "PENDING", writeOffStatus: "PENDING", status: "DRAFT", remark: "" });
  const { data } = useQuery({ queryKey: [E], queryFn: async () => { const r = await fetch(`/api/${E}`); return (await r.json()).data as { items: T[] }; } });
  const sm = useMutation({ mutationFn: async () => { const m = editId ? "PUT" : "POST"; const u = editId ? `/api/${E}/${editId}` : `/api/${E}`; const r = await fetch(u, { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, occurredDate: new Date().toISOString() }) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success(editId ? "已更新" : "已创建"); setOpen(false); reset(); qc.invalidateQueries({ queryKey: [E] }); } else toast.error(r.error ?? "失败"); } });
  const dm = useMutation({ mutationFn: (id: string) => fetch(`/api/${E}/${id}`, { method: "DELETE" }), onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({ queryKey: [E] }); } });
  const reset = () => { setEditId(null); setF({ advanceNo: "", customerId: "", businessOrderId: "", feeType: "", currency: "CNY", originalAmount: 0, exchangeRate: 1, baseCurrencyAmount: 0, payerType: "COMPANY", invoiceStrategy: "NO_INVOICE", collectionStatus: "PENDING", writeOffStatus: "PENDING", status: "DRAFT", remark: "" }); };

  const sv = (s: string): "success" | "warning" | "danger" | "neutral" => s === "COLLECTED" || s === "CONFIRMED" ? "success" : s === "PARTIALLY" || s === "PENDING_COLLECTION" ? "warning" : s === "DISPUTED" ? "danger" : "neutral";

  const cols: ColumnDef<T>[] = [
    { accessorKey: "advanceNo", header: "代垫编号", cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.advanceNo}</span> },
    { accessorKey: "customer.name", header: "客户", cell: ({ row }) => row.original.customer?.name ?? "-" },
    { accessorKey: "businessOrder.orderNo", header: "业务订单", cell: ({ row }) => row.original.businessOrder?.orderNo ?? "-" },
    { accessorKey: "feeType", header: "费用类型", cell: ({ row }) => feeTypeLabels[row.original.feeType] ?? row.original.feeType },
    { accessorKey: "currency", header: "币种" },
    { accessorKey: "originalAmount", header: "金额", cell: ({ row }) => <span className="tabular-nums">¥{row.original.originalAmount.toLocaleString()}</span> },
    { accessorKey: "collectionStatus", header: "收款状态", cell: ({ row }) => <StatusBadge status={collectionLabels[row.original.collectionStatus] ?? row.original.collectionStatus} variant={sv(row.original.collectionStatus)} /> },
    { accessorKey: "isInvoiced", header: "开票", cell: ({ row }) => row.original.isInvoiced ? <span className="text-success text-xs font-medium">已开票</span> : <span className="text-muted-foreground text-xs">未开票</span> },
    { id: "act", header: "操作", cell: ({ row }) => (<div className="flex gap-1"><Button variant="ghost" size="sm" className="h-8" onClick={() => { setEditId(row.original.id); setF({ advanceNo: row.original.advanceNo, customerId: "", businessOrderId: "", feeType: row.original.feeType, currency: row.original.currency, originalAmount: row.original.originalAmount, exchangeRate: 1, baseCurrencyAmount: row.original.baseCurrencyAmount, payerType: "COMPANY", invoiceStrategy: "NO_INVOICE", collectionStatus: row.original.collectionStatus, writeOffStatus: row.original.writeOffStatus, status: row.original.status, remark: "" }); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div>) },
  ];

  return (
    <div>
      <PageHeader title="代垫管理" description="客户代垫费用管理与收款核销追踪" actionLabel="新增代垫" onAction={() => { reset(); setOpen(true); }} />
      <DataTable columns={cols} data={data?.items ?? []} searchKey="advanceNo" searchPlaceholder="搜索代垫编号..." />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>{editId ? "编辑代垫" : "新增代垫"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2"><Label>代垫编号 *</Label><Input value={f.advanceNo} onChange={(e) => setF({ ...f, advanceNo: e.target.value })} placeholder="ADV-YYYYMMDD-XXXXXX" /></div>
          <div className="space-y-2"><Label>费用类型</Label><Select value={f.feeType} onValueChange={(v) => setF({ ...f, feeType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(feeTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>客户 *</Label><Select value={f.customerId} onValueChange={(v) => setF({ ...f, customerId: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(customerSelect.data ?? []).map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>业务订单 *</Label><Select value={f.businessOrderId} onValueChange={(v) => setF({ ...f, businessOrderId: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(boSelect.data ?? []).map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>币种</Label><Select value={f.currency} onValueChange={(v) => setF({ ...f, currency: v, baseCurrencyAmount: f.originalAmount * f.exchangeRate })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CNY">人民币</SelectItem><SelectItem value="USD">美元</SelectItem><SelectItem value="HKD">港币</SelectItem><SelectItem value="EUR">欧元</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>金额</Label><Input type="number" value={f.originalAmount} onChange={(e) => { const a = +e.target.value; setF({ ...f, originalAmount: a, baseCurrencyAmount: a * f.exchangeRate }); }} /></div>
          <div className="space-y-2"><Label>汇率</Label><Input type="number" value={f.exchangeRate} onChange={(e) => { const r = +e.target.value; setF({ ...f, exchangeRate: r, baseCurrencyAmount: f.originalAmount * r }); }} /></div>
          <div className="space-y-2"><Label>本位币金额</Label><Input type="number" value={f.baseCurrencyAmount} disabled className="bg-muted" /></div>
          <div className="space-y-2"><Label>付款方</Label><Select value={f.payerType} onValueChange={(v) => setF({ ...f, payerType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(payerLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>开票策略</Label><Select value={f.invoiceStrategy} onValueChange={(v) => setF({ ...f, invoiceStrategy: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(strategyLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>状态</Label><Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
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
