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
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface T { id: string; taxBillNo: string; customsDeclNo: string; type: string; taxType: string; taxAmount: number; isAdvance: boolean; paymentDate: string; }
const E = "customs-payment-books";

export default function Page() {
  const qc = useQueryClient(); const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState({ taxBillNo: "", customsDeclNo: "", type: "IMPORT_VAT_PAYMENT", taxType: "IMPORT_VAT", taxAmount: 0, paymentDate: new Date().toISOString().slice(0,10), taxpayer: "", isAdvance: false });
  const { data } = useQuery({ queryKey: [E], queryFn: async () => { const r = await fetch(`/api/${E}`); return (await r.json()).data as { items: T[] }; } });
  const sm = useMutation({ mutationFn: async () => { const m = editId ? "PUT" : "POST"; const u = editId ? `/api/${E}/${editId}` : `/api/${E}`; const r = await fetch(u, { method: m, headers:{"Content-Type":"application/json"}, body: JSON.stringify(f) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success(editId?"已更新":"已创建"); setOpen(false); reset(); qc.invalidateQueries({ queryKey:[E] }); } else toast.error(r.error ?? "失败"); } });
  const dm = useMutation({ mutationFn: (id: string) => fetch(`/api/${E}/${id}`, { method:"DELETE" }), onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({ queryKey:[E] }); } });
  const reset = () => { setEditId(null); setF({ taxBillNo: "", customsDeclNo: "", type: "IMPORT_VAT_PAYMENT", taxType: "IMPORT_VAT", taxAmount: 0, paymentDate: new Date().toISOString().slice(0,10), taxpayer: "", isAdvance: false }); };
  const cols: ColumnDef<T>[] = [
    { accessorKey: "taxBillNo", header: "税单号", cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.taxBillNo}</span> },
    { accessorKey: "customsDeclNo", header: "报关单号" },
    { accessorKey: "type", header: "票据类型" },
    { accessorKey: "taxType", header: "税种" },
    { accessorKey: "taxAmount", header: "税额", cell: ({ row }) => <span className="tabular-nums">¥{row.original.taxAmount.toLocaleString()}</span> },
    { accessorKey: "isAdvance", header: "代垫", cell: ({ row }) => row.original.isAdvance ? <StatusBadge status="是" variant="warning" /> : "否" },
    { accessorKey: "paymentDate", header: "缴款日期", cell: ({ row }) => row.original.paymentDate?.slice(0,10) ?? "-" },
    { id: "act", header: "操作", cell: ({ row }) => (<div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditId(row.original.id); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => dm.mutate(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div>) },
  ];
  return (
    <div>
      <PageHeader title="海关票据" description="管理海关进口增值税专用缴款书、关税缴款书等" actionLabel="新增缴款书" onAction={() => { reset(); setOpen(true); }} />
      <DataTable columns={cols} data={data?.items ?? []} searchKey="customsDeclNo" searchPlaceholder="搜索报关单号..." />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editId ? "编辑" : "新增"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2"><Label>税单号 *</Label><Input value={f.taxBillNo} onChange={e => setF({...f, taxBillNo: e.target.value})} /></div>
          <div className="space-y-2"><Label>报关单号 *</Label><Input value={f.customsDeclNo} onChange={e => setF({...f, customsDeclNo: e.target.value})} /></div>
          <div className="space-y-2"><Label>票据类型</Label><Select value={f.type} onValueChange={v => setF({...f, type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="IMPORT_VAT_PAYMENT">进口增值税</SelectItem><SelectItem value="CUSTOMS_DUTY_PAYMENT">关税</SelectItem><SelectItem value="OTHER_TAX">其他</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>税种</Label><Select value={f.taxType} onValueChange={v => setF({...f, taxType: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CUSTOMS_DUTY">关税</SelectItem><SelectItem value="IMPORT_VAT">进口增值税</SelectItem><SelectItem value="OTHER">其他</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>税额 *</Label><Input type="number" value={f.taxAmount} onChange={e => setF({...f, taxAmount: +e.target.value})} /></div>
          <div className="space-y-2"><Label>缴款日期 *</Label><Input type="date" value={f.paymentDate} onChange={e => setF({...f, paymentDate: e.target.value})} /></div>
          <div className="space-y-2"><Label>纳税单位 *</Label><Input value={f.taxpayer} onChange={e => setF({...f, taxpayer: e.target.value})} /></div>
          <div className="flex items-center space-x-2"><Checkbox id="adv" checked={f.isAdvance} onCheckedChange={v => setF({...f, isAdvance: !!v})} /><Label htmlFor="adv">是否代垫</Label></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>取消</Button><Button onClick={() => sm.mutate()}>{sm.isPending ? "保存中..." : "保存"}</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}
