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
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Upload, Search, FileCheck } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface T { id: string; invoiceNo: string; invoiceCategory: string; sellerName: string; amountWithTax: number; issueDate: string|null; verifyStatus: string; deductStatus: string; headerValidationStatus: string; usageStatus: string; entryMethod: string; isFromTaxAuthority: boolean; invoicePool: string; createdAt: string; businessOrderId: string|null; businessOrder?:{orderNo:string}; }

const E = "input-invoices";

export default function Page() {
  const qc = useQueryClient(); const [open, setOpen] = useState(false); const [ocrOpen, setOcrOpen] = useState(false); const [selected, setSelected] = useState<string[]>([]);
  const [f, setF] = useState({ invoiceNo:"", invoiceCategory:"VAT_SPECIAL", sellerName:"", sellerTaxNo:"", buyerName:"", buyerTaxNo:"", issueDate:new Date().toISOString().slice(0,10), amountWithoutTax:0, taxAmount:0, amountWithTax:0, taxRate:13, entryMethod:"MANUAL", isFromTaxAuthority:false, invoicePool:"INPUT", businessOrderId:"" });
  const { data } = useQuery({ queryKey:[E], queryFn: async () => { const r = await fetch(`/api/${E}`); return (await r.json()).data as { items: T[] }; } });
  const sm = useMutation({ mutationFn: async () => { const r = await fetch(`/api/${E}`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(f) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success("已录入"); setOpen(false); reset(); qc.invalidateQueries({ queryKey:[E] }); } else toast.error(r.error??"失败"); } });
  const dm = useMutation({ mutationFn: (id: string) => fetch(`/api/${E}/${id}`, { method:"DELETE" }), onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({ queryKey:[E] }); } });
  const bvMut = useMutation({ mutationFn: async () => { const r = await fetch(`/api/${E}/batch-verify`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ids:selected}) }); return r.json(); }, onSuccess: (r) => { toast.success(`查验完成: 通过${r.data?.passed??0}, 失败${r.data?.failed??0}`); setSelected([]); qc.invalidateQueries({ queryKey:[E] }); } });
  const reset = () => setF({ invoiceNo:"", invoiceCategory:"VAT_SPECIAL", sellerName:"", sellerTaxNo:"", buyerName:"", buyerTaxNo:"", issueDate:new Date().toISOString().slice(0,10), amountWithoutTax:0, taxAmount:0, amountWithTax:0, taxRate:13, entryMethod:"MANUAL", isFromTaxAuthority:false, invoicePool:"INPUT", businessOrderId:"" });
  const sv = (s: string):"success"|"warning"|"danger"|"neutral" => s==="VERIFIED"||s==="DEDUCTED"?"success":s==="VERIFY_FAILED"?"danger":"warning";

  const cols: ColumnDef<T>[] = [
    { id:"sel", header: ({table}) => <Checkbox checked={table.getIsAllRowsSelected()} onCheckedChange={v => { if(v){setSelected(data?.items.map(i=>i.id)??[]); table.toggleAllRowsSelected(true); }else{setSelected([]); table.toggleAllRowsSelected(false); }}} />, cell: ({row}) => <Checkbox checked={selected.includes(row.original.id)} onCheckedChange={v => { setSelected(v ? [...selected, row.original.id] : selected.filter(x=>x!==row.original.id)); row.toggleSelected(!!v); }} /> },
    { accessorKey:"invoiceNo", header:"发票号码", cell:({row}) => <span className="font-medium tabular-nums">{row.original.invoiceNo}</span> },
    { accessorKey:"invoiceCategory", header:"票种" },
    { accessorKey:"sellerName", header:"销售方" },
    { accessorKey:"amountWithTax", header:"票面金额(元)", cell:({row}) => <span className="tabular-nums">¥{row.original.amountWithTax.toLocaleString()}</span> },
    { accessorKey:"issueDate", header:"开票日期", cell:({row}) => row.original.issueDate?.slice(0,10)??"-" },
    { accessorKey:"verifyStatus", header:"查验状态", cell:({row}) => <StatusBadge status={row.original.verifyStatus} variant={sv(row.original.verifyStatus)} /> },
    { accessorKey:"deductStatus", header:"认证状态", cell:({row}) => <StatusBadge status={row.original.deductStatus} variant={sv(row.original.deductStatus)} /> },
    { accessorKey:"headerValidationStatus", header:"抬头校验" },
    { accessorKey:"isFromTaxAuthority", header:"税局来源", cell:({row}) => row.original.isFromTaxAuthority ? "是":"否" },
    { accessorKey:"businessOrder.orderNo", header:"匹配订单", cell:({row}) => row.original.businessOrder?.orderNo||"-" },
    { accessorKey:"entryMethod", header:"录入方式" },
    { accessorKey:"createdAt", header:"录入时间", cell:({row}) => new Date(row.original.createdAt).toLocaleDateString("zh-CN") },
    { id:"act", header:"操作", cell:({row}) => <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => dm.mutate(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button> },
  ];
  return (
    <div>
      <PageHeader title="进项发票" description="供应商发票管理与查验认证" />
      <div className="flex gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={() => { reset(); setOpen(true); }}>手工录入</Button>
        <Link href="/input-invoices/ocr"><Button variant="outline" size="sm"><Upload className="h-3.5 w-3.5 mr-1" />OCR上传</Button></Link>
        <Button variant="outline" size="sm" disabled={selected.length===0} onClick={() => bvMut.mutate()}><FileCheck className="h-3.5 w-3.5 mr-1" />批量查验({selected.length})</Button>
      </div>
      <DataTable columns={cols} data={data?.items??[]} searchKey="sellerName" searchPlaceholder="搜索销售方..." />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>手工录入进项发票</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2"><Label>发票号码 *</Label><Input value={f.invoiceNo} onChange={e => setF({...f, invoiceNo:e.target.value})} /></div>
          <div className="space-y-2"><Label>票种</Label><Select value={f.invoiceCategory} onValueChange={v => setF({...f, invoiceCategory:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="VAT_SPECIAL">增值税专票</SelectItem><SelectItem value="VAT_NORMAL">增值税普票</SelectItem><SelectItem value="DIGITAL_SPECIAL">数电专票</SelectItem><SelectItem value="DIGITAL_NORMAL">数电普票</SelectItem></SelectContent></Select></div>
          <div className="col-span-2 space-y-2"><Label>销售方名称 *</Label><Input value={f.sellerName} onChange={e => setF({...f, sellerName:e.target.value})} /></div>
          <div className="space-y-2"><Label>销售方税号</Label><Input value={f.sellerTaxNo} onChange={e => setF({...f, sellerTaxNo:e.target.value})} /></div>
          <div className="space-y-2"><Label>开票日期</Label><Input type="date" value={f.issueDate} onChange={e => setF({...f, issueDate:e.target.value})} /></div>
          <div className="space-y-2"><Label>不含税金额</Label><Input type="number" value={f.amountWithoutTax} onChange={e => {const a=+e.target.value; setF({...f, amountWithoutTax:a, taxAmount:+(a*f.taxRate/100).toFixed(2), amountWithTax:+(a*(1+f.taxRate/100)).toFixed(2)})}} /></div>
          <div className="space-y-2"><Label>税率%</Label><Input type="number" value={f.taxRate} onChange={e => {const r=+e.target.value; setF({...f, taxRate:r, taxAmount:+(f.amountWithoutTax*r/100).toFixed(2), amountWithTax:+(f.amountWithoutTax*(1+r/100)).toFixed(2)})}} /></div>
          <div className="space-y-2"><Label>税额</Label><Input type="number" value={f.taxAmount} disabled className="bg-muted" /></div>
          <div className="space-y-2"><Label>价税合计</Label><Input type="number" value={f.amountWithTax} disabled className="bg-muted" /></div>
          <div className="space-y-2"><Label>关联业务订单ID</Label><Input value={f.businessOrderId} onChange={e => setF({...f, businessOrderId:e.target.value})} placeholder="进项成本锚点" /></div>
          <div className="flex items-center space-x-2"><Checkbox id="tax" checked={f.isFromTaxAuthority} onCheckedChange={v => setF({...f, isFromTaxAuthority:!!v})} /><Label htmlFor="tax">来自税局</Label></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>取消</Button><Button onClick={() => sm.mutate()}>{sm.isPending?"保存中...":"保存"}</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}
