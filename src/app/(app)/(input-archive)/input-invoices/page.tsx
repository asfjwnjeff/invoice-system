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
import { Trash2, Upload, FileCheck } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useEntitySelect } from "@/lib/hooks/use-entity-select";
import Link from "next/link";

interface T { id: string; invoiceNo: string; invoiceCategory: string; sellerName: string; amountWithTax: number; issueDate: string|null; verifyStatus: string; deductStatus: string; headerValidationStatus: string; usageStatus: string; entryMethod: string; isFromTaxAuthority: boolean; invoicePool: string; createdAt: string; businessOrderId: string|null; businessOrder?:{orderNo:string}; supplier?:{name:string}; costCenter?:{name:string}; }

const E = "input-invoices";
const catLabels: Record<string, string> = { DIGITAL_SPECIAL: "数电专票", DIGITAL_NORMAL: "数电普票", VAT_SPECIAL: "增值税专票", VAT_NORMAL: "增值税普票" };
const verifyLabels: Record<string, string> = { VERIFIED: "已查验", PENDING: "待查验", VERIFY_FAILED: "查验失败" };
const deductLabels: Record<string, string> = { DEDUCTED: "已认证", PENDING: "待认证", NOT_APPLICABLE: "不适用" };
const headerLabels: Record<string, string> = { VALIDATED: "已校验", PENDING: "待校验", FAILED: "校验失败" };
const emLabels: Record<string, string> = { MANUAL: "手工录入", OCR: "OCR识别", IMPORT: "批量导入", TAX_AUTHORITY: "税局同步" };

export default function Page() {
  const qc = useQueryClient(); const [open, setOpen] = useState(false); const [selected, setSelected] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const { data: supplierOptions } = useEntitySelect("/api/suppliers/select");
  const { data: costCenterOptions } = useEntitySelect("/api/cost-centers/select");
  const [f, setF] = useState({ invoiceNo:"", invoiceCategory:"VAT_SPECIAL", sellerName:"", sellerTaxNo:"", buyerName:"", buyerTaxNo:"", issueDate:new Date().toISOString().slice(0,10), amountWithoutTax:0, taxAmount:0, amountWithTax:0, taxRate:13, entryMethod:"MANUAL", isFromTaxAuthority:false, invoicePool:"INPUT", businessOrderId:"", supplierId:"", costCenterId:"", costType:"", costAllocationRatio:100, isAdvanceCost:false, remark:"" });
  const { data } = useQuery({ queryKey:[E], queryFn: async () => { const r = await fetch(`/api/${E}`); return (await r.json()).data as { items: T[] }; } });
  const sm = useMutation({ mutationFn: async () => { const r = await fetch(`/api/${E}`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(f) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success("已录入"); setOpen(false); reset(); qc.invalidateQueries({ queryKey:[E] }); } else toast.error(r.error??"失败"); } });
  const dm = useMutation({ mutationFn: (id: string) => fetch(`/api/${E}/${id}`, { method:"DELETE" }), onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({ queryKey:[E] }); } });
  const bvMut = useMutation({ mutationFn: async () => { const r = await fetch(`/api/${E}/batch-verify`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ids:selected}) }); return r.json(); }, onSuccess: (r) => { toast.success(`查验完成: 通过${r.data?.passed??0}, 失败${r.data?.failed??0}`); setSelected([]); qc.invalidateQueries({ queryKey:[E] }); } });
  const reset = () => setF({ invoiceNo:"", invoiceCategory:"VAT_SPECIAL", sellerName:"", sellerTaxNo:"", buyerName:"", buyerTaxNo:"", issueDate:new Date().toISOString().slice(0,10), amountWithoutTax:0, taxAmount:0, amountWithTax:0, taxRate:13, entryMethod:"MANUAL", isFromTaxAuthority:false, invoicePool:"INPUT", businessOrderId:"", supplierId:"", costCenterId:"", costType:"", costAllocationRatio:100, isAdvanceCost:false, remark:"" });
  const sv = (s: string):"success"|"warning"|"danger"|"neutral" => s==="VERIFIED"||s==="DEDUCTED"?"success":s==="VERIFY_FAILED"?"danger":"warning";

  const cols: ColumnDef<T>[] = [
    { id:"sel", header: ({table}) => <Checkbox checked={table.getIsAllRowsSelected()} onCheckedChange={v => { if(v){setSelected(data?.items.map(i=>i.id)??[]); table.toggleAllRowsSelected(true); }else{setSelected([]); table.toggleAllRowsSelected(false); }}} />, cell: ({row}) => <Checkbox checked={selected.includes(row.original.id)} onCheckedChange={v => { setSelected(v ? [...selected, row.original.id] : selected.filter(x=>x!==row.original.id)); row.toggleSelected(!!v); }} /> },
    { accessorKey:"invoiceNo", header:"发票号码", cell:({row}) => <span className="font-medium tabular-nums">{row.original.invoiceNo}</span> },
    { accessorKey:"invoiceCategory", header:"票种", cell:({row}) => catLabels[row.original.invoiceCategory] ?? row.original.invoiceCategory },
    { accessorKey:"sellerName", header:"销售方" },
    { accessorKey:"amountWithTax", header:"票面金额(元)", cell:({row}) => <span className="tabular-nums">¥{row.original.amountWithTax.toLocaleString()}</span> },
    { accessorKey:"issueDate", header:"开票日期", cell:({row}) => row.original.issueDate?.slice(0,10)??"-" },
    { accessorKey:"verifyStatus", header:"查验状态", cell:({row}) => <StatusBadge status={verifyLabels[row.original.verifyStatus] ?? row.original.verifyStatus} variant={sv(row.original.verifyStatus)} /> },
    { accessorKey:"deductStatus", header:"认证状态", cell:({row}) => <StatusBadge status={deductLabels[row.original.deductStatus] ?? row.original.deductStatus} variant={sv(row.original.deductStatus)} /> },
    { accessorKey:"supplier.name", header:"供应商", cell:({row}) => row.original.supplier?.name??"-" },
    { accessorKey:"costCenter.name", header:"成本中心", cell:({row}) => row.original.costCenter?.name??"-" },
    { accessorKey:"headerValidationStatus", header:"抬头校验", cell:({row}) => <StatusBadge status={headerLabels[row.original.headerValidationStatus] ?? row.original.headerValidationStatus} variant="neutral" /> },
    { accessorKey:"isFromTaxAuthority", header:"税局来源", cell:({row}) => row.original.isFromTaxAuthority ? "是":"否" },
    { accessorKey:"businessOrder.orderNo", header:"匹配订单", cell:({row}) => row.original.businessOrder?.orderNo||"-" },
    { accessorKey:"entryMethod", header:"录入方式", cell:({row}) => emLabels[row.original.entryMethod] ?? row.original.entryMethod },
    { accessorKey:"createdAt", header:"录入时间", cell:({row}) => new Date(row.original.createdAt).toLocaleDateString("zh-CN") },
    { id:"act", header:"操作", cell:({row}) => <div className="flex gap-1"><Link href={`/input-invoices/${row.original.id}`}><Button variant="ghost" size="sm" className="h-8">查看</Button></Link><Link href={`/input-invoices/${row.original.id}/edit`}><Button variant="ghost" size="sm" className="h-8">编辑</Button></Link><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div> },
  ];
  return (
    <div>
      <PageHeader title="进项发票" description="供应商发票管理与查验认证" />
      <div className="flex gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={() => { reset(); setOpen(true); }}>手工录入</Button>
        <Link href="/input-invoices/ocr"><Button variant="outline" size="sm"><Upload className="h-3.5 w-3.5 mr-1" />OCR上传</Button></Link>
        <Button variant="outline" size="sm" disabled={selected.length===0} onClick={() => bvMut.mutate()}><FileCheck className="h-3.5 w-3.5 mr-1" />批量查验({selected.length})</Button>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground">状态:</span>
        <Button variant={!statusFilter?"default":"outline"} size="sm" className="h-7 text-xs" onClick={()=>setStatusFilter("")}>全部</Button>
        <Button variant={statusFilter==="VERIFIED"?"default":"outline"} size="sm" className="h-7 text-xs" onClick={()=>setStatusFilter("VERIFIED")}>已查验</Button>
        <Button variant={statusFilter==="PENDING_VERIFY"?"default":"outline"} size="sm" className="h-7 text-xs" onClick={()=>setStatusFilter("PENDING_VERIFY")}>待查验</Button>
        <Button variant={statusFilter==="VERIFY_FAILED"?"default":"outline"} size="sm" className="h-7 text-xs" onClick={()=>setStatusFilter("VERIFY_FAILED")}>查验失败</Button>
        <Button variant={statusFilter==="DEDUCTED"?"default":"outline"} size="sm" className="h-7 text-xs" onClick={()=>setStatusFilter("DEDUCTED")}>已抵扣</Button>
        <Button variant={statusFilter==="PENDING_DEDUCT"?"default":"outline"} size="sm" className="h-7 text-xs" onClick={()=>setStatusFilter("PENDING_DEDUCT")}>待认证</Button>
        {statusFilter && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={()=>setStatusFilter("")}>清除</Button>}
      </div>
      <DataTable columns={cols} data={(data?.items??[]).filter(i => {
        if (!statusFilter) return true;
        if (statusFilter === "VERIFIED") return i.verifyStatus === "VERIFIED";
        if (statusFilter === "PENDING_VERIFY") return i.verifyStatus === "PENDING";
        if (statusFilter === "VERIFY_FAILED") return i.verifyStatus === "VERIFY_FAILED";
        if (statusFilter === "DEDUCTED") return i.deductStatus === "DEDUCTED";
        if (statusFilter === "PENDING_DEDUCT") return i.deductStatus === "PENDING";
        return true;
      })} searchKey="sellerName" searchPlaceholder="搜索销售方..." />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>手工录入进项发票</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2"><Label>发票号码 *</Label><Input value={f.invoiceNo} onChange={e => setF({...f, invoiceNo:e.target.value})} /></div>
          <div className="space-y-2"><Label>票种</Label><Select value={f.invoiceCategory} onValueChange={v => setF({...f, invoiceCategory:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="VAT_SPECIAL">增值税专票</SelectItem><SelectItem value="VAT_NORMAL">增值税普票</SelectItem><SelectItem value="DIGITAL_SPECIAL">数电专票</SelectItem><SelectItem value="DIGITAL_NORMAL">数电普票</SelectItem></SelectContent></Select></div>
          <div className="col-span-2 space-y-2"><Label>销售方名称 *</Label><Input value={f.sellerName} onChange={e => setF({...f, sellerName:e.target.value})} /></div>
          <div className="space-y-2"><Label>销售方税号</Label><Input value={f.sellerTaxNo} onChange={e => setF({...f, sellerTaxNo:e.target.value})} /></div>
          <div className="space-y-2"><Label>开票日期</Label><Input type="date" value={f.issueDate} onChange={e => setF({...f, issueDate:e.target.value})} /></div>
          <div className="space-y-2"><Label>购买方名称</Label><Input value={f.buyerName} onChange={e => setF({...f, buyerName:e.target.value})} /></div>
          <div className="space-y-2"><Label>购买方税号</Label><Input value={f.buyerTaxNo} onChange={e => setF({...f, buyerTaxNo:e.target.value})} /></div>
          <div className="space-y-2"><Label>不含税金额</Label><Input type="number" value={f.amountWithoutTax} onChange={e => {const a=+e.target.value; setF({...f, amountWithoutTax:a, taxAmount:+(a*f.taxRate/100).toFixed(2), amountWithTax:+(a*(1+f.taxRate/100)).toFixed(2)})}} /></div>
          <div className="space-y-2"><Label>税率%</Label><Input type="number" value={f.taxRate} onChange={e => {const r=+e.target.value; setF({...f, taxRate:r, taxAmount:+(f.amountWithoutTax*r/100).toFixed(2), amountWithTax:+(f.amountWithoutTax*(1+r/100)).toFixed(2)})}} /></div>
          <div className="space-y-2"><Label>税额</Label><Input type="number" value={f.taxAmount} disabled className="bg-muted" /></div>
          <div className="space-y-2"><Label>价税合计</Label><Input type="number" value={f.amountWithTax} disabled className="bg-muted" /></div>
          <div className="space-y-2"><Label>关联业务订单ID</Label><Input value={f.businessOrderId} onChange={e => setF({...f, businessOrderId:e.target.value})} placeholder="进项成本锚点" /></div>
          <div className="space-y-2"><Label>供应商</Label><Select value={f.supplierId} onValueChange={v => setF({...f, supplierId:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{(supplierOptions??[]).map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>成本中心</Label><Select value={f.costCenterId} onValueChange={v => setF({...f, costCenterId:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{(costCenterOptions??[]).map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>成本类型</Label><Select value={f.costType} onValueChange={v => setF({...f, costType:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="TRANSPORT">运输成本</SelectItem><SelectItem value="WAREHOUSE">仓储成本</SelectItem><SelectItem value="CUSTOMS">关务成本</SelectItem><SelectItem value="AGENCY">代理成本</SelectItem><SelectItem value="INSURANCE">保险费</SelectItem><SelectItem value="OTHER">其他</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>分摊比例(%)</Label><Input type="number" value={f.costAllocationRatio} onChange={e => setF({...f, costAllocationRatio:+e.target.value})} /></div>
          <div className="flex items-center space-x-2"><Checkbox id="advcost" checked={f.isAdvanceCost} onCheckedChange={v => setF({...f, isAdvanceCost:!!v})} /><Label htmlFor="advcost">代垫成本</Label></div>
          <div className="col-span-2 space-y-2"><Label>备注</Label><Input value={f.remark} onChange={e => setF({...f, remark:e.target.value})} /></div>
          <div className="flex items-center space-x-2"><Checkbox id="tax" checked={f.isFromTaxAuthority} onCheckedChange={v => setF({...f, isFromTaxAuthority:!!v})} /><Label htmlFor="tax">来自税局</Label></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>取消</Button><Button onClick={() => sm.mutate()}>{sm.isPending?"保存中...":"保存"}</Button></DialogFooter>
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
