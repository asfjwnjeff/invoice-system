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

interface T { id: string; invoiceNo: string; invoiceType: string; sellerName: string; amountWithTax: number; issueDate: string; verifyStatus: string; deductStatus: string; status: string; }
const E = "input-invoices";

export default function Page() {
  const qc = useQueryClient(); const [open, setOpen] = useState(false);
  const [f, setF] = useState({ invoiceNo: "", invoiceType: "VAT_SPECIAL", sellerName: "", sellerTaxNo: "", buyerName: "", buyerTaxNo: "", issueDate: new Date().toISOString().slice(0,10), amountWithoutTax: 0, taxAmount: 0, amountWithTax: 0, taxRate: 13 });
  const { data } = useQuery({ queryKey:[E], queryFn: async () => { const r = await fetch(`/api/${E}`); return (await r.json()).data as { items: T[] }; } });
  const sm = useMutation({ mutationFn: async () => { const r = await fetch(`/api/${E}`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(f) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success("已录入"); setOpen(false); reset(); qc.invalidateQueries({ queryKey:[E] }); } else toast.error(r.error??"失败"); } });
  const dm = useMutation({ mutationFn: (id: string) => fetch(`/api/${E}/${id}`, { method:"DELETE" }), onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({ queryKey:[E] }); } });
  const reset = () => setF({ invoiceNo:"", invoiceType:"VAT_SPECIAL", sellerName:"", sellerTaxNo:"", buyerName:"", buyerTaxNo:"", issueDate:new Date().toISOString().slice(0,10), amountWithoutTax:0, taxAmount:0, amountWithTax:0, taxRate:13 });
  const vs = (s: string):"success"|"warning"|"danger"|"neutral" => s==="VERIFIED"||s==="DEDUCTED"?"success":s==="VERIFY_FAILED"?"danger":"warning";
  const cols: ColumnDef<T>[] = [
    { accessorKey:"invoiceNo", header:"发票号码", cell:({ row }) => <span className="font-medium tabular-nums">{row.original.invoiceNo}</span> },
    { accessorKey:"sellerName", header:"销售方" },
    { accessorKey:"invoiceType", header:"类型" },
    { accessorKey:"amountWithTax", header:"价税合计", cell:({ row }) => <span className="tabular-nums">¥{row.original.amountWithTax.toLocaleString()}</span> },
    { accessorKey:"verifyStatus", header:"查验", cell:({ row }) => <StatusBadge status={row.original.verifyStatus} variant={vs(row.original.verifyStatus)} /> },
    { accessorKey:"deductStatus", header:"认证", cell:({ row }) => <StatusBadge status={row.original.deductStatus} variant={vs(row.original.deductStatus)} /> },
    { id:"act", header:"操作", cell:({ row }) => <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => dm.mutate(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button> },
  ];
  return (
    <div>
      <PageHeader title="进项发票" description="管理供应商开给公司的发票，含查验认证状态" actionLabel="录入发票" onAction={() => { reset(); setOpen(true); }} />
      <DataTable columns={cols} data={data?.items ?? []} searchKey="sellerName" searchPlaceholder="搜索销售方..." />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>录入进项发票</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2"><Label>发票号码 *</Label><Input value={f.invoiceNo} onChange={e => setF({...f, invoiceNo: e.target.value})} /></div>
          <div className="space-y-2"><Label>发票类型</Label><Select value={f.invoiceType} onValueChange={v => setF({...f, invoiceType: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="VAT_SPECIAL">增值税专票</SelectItem><SelectItem value="VAT_NORMAL">增值税普票</SelectItem><SelectItem value="DIGITAL_SPECIAL">数电专票</SelectItem><SelectItem value="DIGITAL_NORMAL">数电普票</SelectItem><SelectItem value="TRANSPORT">运输票</SelectItem><SelectItem value="WAREHOUSE">仓储票</SelectItem></SelectContent></Select></div>
          <div className="col-span-2 space-y-2"><Label>销售方名称 *</Label><Input value={f.sellerName} onChange={e => setF({...f, sellerName: e.target.value})} /></div>
          <div className="space-y-2"><Label>销售方税号</Label><Input value={f.sellerTaxNo} onChange={e => setF({...f, sellerTaxNo: e.target.value})} /></div>
          <div className="space-y-2"><Label>购买方税号</Label><Input value={f.buyerTaxNo} onChange={e => setF({...f, buyerTaxNo: e.target.value})} /></div>
          <div className="space-y-2"><Label>开票日期</Label><Input type="date" value={f.issueDate} onChange={e => setF({...f, issueDate: e.target.value})} /></div>
          <div className="space-y-2"><Label>税率%</Label><Input type="number" value={f.taxRate} onChange={e => setF({...f, taxRate: +e.target.value})} /></div>
          <div className="space-y-2"><Label>不含税金额</Label><Input type="number" value={f.amountWithoutTax} onChange={e => setF({...f, amountWithoutTax: +e.target.value, taxAmount: +(+e.target.value * f.taxRate / 100).toFixed(2), amountWithTax: +(+e.target.value * (1 + f.taxRate/100)).toFixed(2)})} /></div>
          <div className="space-y-2"><Label>税额</Label><Input type="number" value={f.taxAmount} disabled className="bg-muted" /></div>
          <div className="space-y-2"><Label>价税合计</Label><Input type="number" value={f.amountWithTax} disabled className="bg-muted" /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>取消</Button><Button onClick={() => sm.mutate()}>{sm.isPending ? "保存中..." : "保存"}</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}
