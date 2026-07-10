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

interface T { id: string; advanceNo: string; feeType: string; baseCurrencyAmount: number; payerType: string; status: string; collectionStatus: string; customer?: { name: string }; businessOrder?: { orderNo: string }; }
const E = "advance-payments";

const feeTypes = ["CUSTOMS_DUTY","IMPORT_VAT","INSPECTION_FEE","PORT_FEE","INSURANCE","EXPRESS_FEE","OTHER_ADVANCE"];
const statusV = (s: string): "success"|"warning"|"danger"|"neutral" => s === "COLLECTED"||s==="WRITTEN_OFF" ? "success" : s === "DRAFT"||s==="PENDING_CONFIRM" ? "neutral" : "warning";

export default function Page() {
  const qc = useQueryClient(); const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState({ advanceNo: "ADV-"+Date.now(), customerId: "", businessOrderId: "", feeType: "CUSTOMS_DUTY", occurredDate: new Date().toISOString().slice(0,10), currency: "CNY", originalAmount: 0, exchangeRate: 1, baseCurrencyAmount: 0, payerType: "COMPANY", invoiceStrategy: "NO_INVOICE", remark: "" });
  const { data } = useQuery({ queryKey: [E], queryFn: async () => { const r = await fetch(`/api/${E}`); return (await r.json()).data as { items: T[] }; } });
  const sm = useMutation({ mutationFn: async () => { const m = editId ? "PUT" : "POST"; const u = editId ? `/api/${E}/${editId}` : `/api/${E}`; const r = await fetch(u, { method: m, headers: { "Content-Type":"application/json" }, body: JSON.stringify(f) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success(editId?"已更新":"已创建"); setOpen(false); reset(); qc.invalidateQueries({ queryKey: [E] }); } else toast.error(r.error ?? "失败"); } });
  const dm = useMutation({ mutationFn: (id: string) => fetch(`/api/${E}/${id}`, { method:"DELETE" }), onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({ queryKey:[E] }); } });
  const reset = () => { setEditId(null); setF({ advanceNo:"ADV-"+Date.now(), customerId:"", businessOrderId:"", feeType:"CUSTOMS_DUTY", occurredDate:new Date().toISOString().slice(0,10), currency:"CNY", originalAmount:0, exchangeRate:1, baseCurrencyAmount:0, payerType:"COMPANY", invoiceStrategy:"NO_INVOICE", remark:"" }); };
  const cols: ColumnDef<T>[] = [
    { accessorKey: "advanceNo", header: "代垫单号", cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.advanceNo}</span> },
    { accessorKey: "customer.name", header: "客户", cell: ({ row }) => row.original.customer?.name || "-" },
    { accessorKey: "feeType", header: "费用类型" },
    { accessorKey: "baseCurrencyAmount", header: "金额", cell: ({ row }) => <span className="tabular-nums">¥{row.original.baseCurrencyAmount.toLocaleString()}</span> },
    { accessorKey: "collectionStatus", header: "收款状态", cell: ({ row }) => <StatusBadge status={row.original.collectionStatus} variant={row.original.collectionStatus==="COLLECTED"?"success":"warning"} /> },
    { accessorKey: "status", header: "状态", cell: ({ row }) => <StatusBadge status={row.original.status} variant={statusV(row.original.status)} /> },
    { id: "act", header: "操作", cell: ({ row }) => (<div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditId(row.original.id); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => dm.mutate(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div>) },
  ];
  return (
    <div>
      <PageHeader title="代垫管理" description="管理公司为客户代垫的税费、关税、运杂费等" actionLabel="新增代垫" onAction={() => { reset(); setOpen(true); }} />
      <DataTable columns={cols} data={data?.items ?? []} searchKey="advanceNo" />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>{editId ? "编辑代垫" : "新增代垫"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2"><Label>代垫单号 *</Label><Input value={f.advanceNo} onChange={e => setF({...f, advanceNo: e.target.value})} /></div>
          <div className="space-y-2"><Label>客户ID *</Label><Input value={f.customerId} onChange={e => setF({...f, customerId: e.target.value})} /></div>
          <div className="space-y-2"><Label>业务订单ID *</Label><Input value={f.businessOrderId} onChange={e => setF({...f, businessOrderId: e.target.value})} /></div>
          <div className="space-y-2"><Label>费用类型</Label>
            <Select value={f.feeType} onValueChange={v => setF({...f, feeType: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{feeTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>原币金额</Label><Input type="number" value={f.originalAmount} onChange={e => setF({...f, originalAmount: +e.target.value, baseCurrencyAmount: +e.target.value * f.exchangeRate})} /></div>
          <div className="space-y-2"><Label>汇率</Label><Input type="number" value={f.exchangeRate} onChange={e => setF({...f, exchangeRate: +e.target.value, baseCurrencyAmount: f.originalAmount * +e.target.value})} /></div>
          <div className="space-y-2"><Label>本位币金额</Label><Input type="number" value={f.baseCurrencyAmount} disabled className="bg-muted" /></div>
          <div className="space-y-2"><Label>币种</Label><Select value={f.currency} onValueChange={v => setF({...f, currency: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CNY">CNY</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="HKD">HKD</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>付款方</Label><Select value={f.payerType} onValueChange={v => setF({...f, payerType: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="COMPANY">公司</SelectItem><SelectItem value="CUSTOMER">客户</SelectItem><SelectItem value="THIRD_PARTY">第三方</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>开票策略</Label><Select value={f.invoiceStrategy} onValueChange={v => setF({...f, invoiceStrategy: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NO_INVOICE">不开票</SelectItem><SelectItem value="SEPARATE_INVOICE">代垫单独开票</SelectItem><SelectItem value="MERGE_WITH_SERVICE">与服务费合并</SelectItem><SelectItem value="SERVICE_ONLY">仅服务费</SelectItem><SelectItem value="NET_AMOUNT">差额开票</SelectItem><SelectItem value="MANUAL">手工指定</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>发生日期</Label><Input type="date" value={f.occurredDate} onChange={e => setF({...f, occurredDate: e.target.value})} /></div>
          <div className="col-span-2 space-y-2"><Label>备注</Label><Input value={f.remark} onChange={e => setF({...f, remark: e.target.value})} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>取消</Button><Button onClick={() => sm.mutate()}>{sm.isPending ? "保存中..." : "保存"}</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}
