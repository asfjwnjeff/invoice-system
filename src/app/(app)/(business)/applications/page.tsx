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
import { Plus, Trash2, Eye, Play, FileText } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Item { itemName: string; taxCode: string; quantity: number; unitPrice: number; amount: number; taxRate: number; taxAmount: number; }
interface T { id: string; appNo: string; buyerName: string; invoiceType: string; amountWithTax: number; status: string; createdAt: string; }

const invoiceTypes = ["DIGITAL_SPECIAL","DIGITAL_NORMAL","VAT_SPECIAL","VAT_NORMAL","E_NORMAL"];

export default function ApplicationsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ appNo: "APP-"+Date.now(), sourceType: "MANUAL", buyerName: "", buyerTaxNo: "", invoiceType: "DIGITAL_SPECIAL", sellerOrgId: "org-default", sellerTaxNo: "", customerId: "", revenueOrderId: "", amountWithoutTax: 0, taxAmount: 0, amountWithTax: 0, remark: "" });
  const [items, setItems] = useState<Item[]>([{ itemName: "", taxCode: "", quantity: 1, unitPrice: 0, amount: 0, taxRate: 6, taxAmount: 0 }]);

  const { data } = useQuery({ queryKey: ["applications"], queryFn: async () => { const r = await fetch("/api/applications"); return (await r.json()).data as { items: T[] }; } });

  const addItem = () => setItems([...items, { itemName: "", taxCode: "", quantity: 1, unitPrice: 0, amount: 0, taxRate: 6, taxAmount: 0 }]);
  const updateItem = (i: number, field: keyof Item, val: string | number) => {
    const next = [...items];
    const it = { ...next[i]!, [field]: val };
    it.amount = +(it.quantity * it.unitPrice).toFixed(2);
    it.taxAmount = +(it.amount * it.taxRate / 100).toFixed(2);
    next[i] = it;
    setItems(next);
    const totalAmount = next.reduce((s, x) => s + x.amount, 0);
    const totalTax = next.reduce((s, x) => s + x.taxAmount, 0);
    setF({ ...f, amountWithoutTax: +totalAmount.toFixed(2), taxAmount: +totalTax.toFixed(2), amountWithTax: +(totalAmount + totalTax).toFixed(2) });
  };
  const removeItem = (i: number) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };

  const sm = useMutation({ mutationFn: async () => { const r = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, items }) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success("开票申请已创建"); setOpen(false); qc.invalidateQueries({ queryKey: ["applications"] }); } else toast.error(r.error ?? "失败"); } });

  const issueMut = useMutation({ mutationFn: async (id: string) => { const r = await fetch(`/api/applications/${id}/issue`, { method: "POST" }); return r.json(); }, onSuccess: (r) => { if (r.success) toast.success(`模拟开票成功: ${r.data.invoiceNo}`); else toast.error(r.error ?? "开票失败"); qc.invalidateQueries({ queryKey: ["applications"] }); } });

  const statusVariant = (s: string): "success"|"warning"|"danger"|"neutral" => s === "ISSUED" ? "success" : s === "PENDING_APPROVAL" ? "warning" : s === "REJECTED" ? "danger" : "neutral";

  const cols: ColumnDef<T>[] = [
    { accessorKey: "appNo", header: "申请号", cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.appNo}</span> },
    { accessorKey: "buyerName", header: "购买方" },
    { accessorKey: "invoiceType", header: "发票类型" },
    { accessorKey: "amountWithTax", header: "价税合计", cell: ({ row }) => <span className="tabular-nums">¥{row.original.amountWithTax.toLocaleString()}</span> },
    { accessorKey: "status", header: "状态", cell: ({ row }) => <StatusBadge status={row.original.status} variant={statusVariant(row.original.status)} /> },
    { accessorKey: "createdAt", header: "创建时间", cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("zh-CN") },
    { id: "act", header: "操作", cell: ({ row }) => (<div className="flex gap-1"><Link href={`/applications/${row.original.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button></Link><Button variant="ghost" size="icon" className="h-8 w-8 text-accent" disabled={row.original.status !== "DRAFT"} onClick={() => issueMut.mutate(row.original.id)}><Play className="h-3.5 w-3.5" /></Button></div>) },
  ];

  return (
    <div>
      <PageHeader title="开票申请" description="由结算单或业务单据生成的开票请求" actionLabel="新建申请" onAction={() => setOpen(true)} />
      <DataTable columns={cols} data={data?.items ?? []} searchKey="buyerName" searchPlaceholder="搜索购买方..." />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>新建开票申请</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>购买方名称 *</Label><Input value={f.buyerName} onChange={(e) => setF({ ...f, buyerName: e.target.value })} /></div>
              <div className="space-y-2"><Label>购买方税号</Label><Input value={f.buyerTaxNo} onChange={(e) => setF({ ...f, buyerTaxNo: e.target.value })} /></div>
              <div className="space-y-2"><Label>发票类型</Label>
                <Select value={f.invoiceType} onValueChange={(v) => setF({ ...f, invoiceType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{invoiceTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>备注</Label><Input value={f.remark} onChange={(e) => setF({ ...f, remark: e.target.value })} /></div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label className="font-medium">开票明细</Label><Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-3.5 w-3.5 mr-1" />添加行</Button></div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-6 gap-2 p-3 border rounded-sm bg-muted/50">
                  <div className="col-span-2"><Input placeholder="项目名称" value={item.itemName} onChange={(e) => updateItem(i, "itemName", e.target.value)} /></div>
                  <Input placeholder="税编" value={item.taxCode} onChange={(e) => updateItem(i, "taxCode", e.target.value)} />
                  <Input type="number" placeholder="数量" value={item.quantity} onChange={(e) => updateItem(i, "quantity", +e.target.value)} />
                  <Input type="number" placeholder="单价" value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", +e.target.value)} />
                  <div className="flex items-center gap-1">
                    <Input type="number" placeholder="税率%" value={item.taxRate} onChange={(e) => updateItem(i, "taxRate", +e.target.value)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeItem(i)} disabled={items.length <= 1}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </div>
              ))}
              <div className="flex justify-end gap-6 text-sm">
                <span>不含税: <strong className="tabular-nums">¥{f.amountWithoutTax.toLocaleString()}</strong></span>
                <span>税额: <strong className="tabular-nums">¥{f.taxAmount.toLocaleString()}</strong></span>
                <span>价税合计: <strong className="tabular-nums">¥{f.amountWithTax.toLocaleString()}</strong></span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={() => sm.mutate()} disabled={sm.isPending}>{sm.isPending ? "提交中..." : "提交申请"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
