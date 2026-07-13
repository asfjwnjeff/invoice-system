"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { useEntitySelect } from "@/lib/hooks/use-entity-select";

const catLabels: Record<string, string> = { VAT_SPECIAL: "增值税专票", VAT_NORMAL: "增值税普票", DIGITAL_SPECIAL: "数电专票", DIGITAL_NORMAL: "数电普票" };

export default function InputInvoiceEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: bizOrders } = useEntitySelect("/api/business-orders/select");
  const { data: suppliers } = useEntitySelect("/api/suppliers/select");
  const { data: costCenters } = useEntitySelect("/api/cost-centers/select");

  const [f, setF] = useState({
    invoiceNo: "", invoiceCategory: "VAT_SPECIAL", sellerName: "", sellerTaxNo: "",
    buyerName: "", buyerTaxNo: "", issueDate: "", amountWithoutTax: 0, taxAmount: 0, amountWithTax: 0,
    taxRate: 13, entryMethod: "MANUAL", isFromTaxAuthority: false, invoicePool: "INPUT", businessOrderId: "",
    supplierId: "", costCenterId: "", costType: "", costAllocationRatio: 100, isAdvanceCost: false, remark: "",
  });

  const { data: inv, isLoading } = useQuery({
    queryKey: ["input-invoice", id],
    queryFn: async () => { const r = await fetch(`/api/input-invoices/${id}`); const j = await r.json(); return j.data; },
  });

  useEffect(() => {
    if (inv) {
      setF({
        invoiceNo: inv.invoiceNo ?? "", invoiceCategory: inv.invoiceCategory ?? "VAT_SPECIAL",
        sellerName: inv.sellerName ?? "", sellerTaxNo: inv.sellerTaxNo ?? "",
        buyerName: inv.buyerName ?? "", buyerTaxNo: inv.buyerTaxNo ?? "",
        issueDate: inv.issueDate?.slice(0, 10) ?? "", amountWithoutTax: Number(inv.amountWithoutTax ?? 0),
        taxAmount: Number(inv.taxAmount ?? 0), amountWithTax: Number(inv.amountWithTax ?? 0),
        taxRate: Number(inv.taxRate ?? 13), entryMethod: inv.entryMethod ?? "MANUAL",
        isFromTaxAuthority: inv.isFromTaxAuthority ?? false, invoicePool: inv.invoicePool ?? "INPUT",
        businessOrderId: inv.businessOrderId ?? "",
        supplierId: inv.supplierId ?? "", costCenterId: inv.costCenterId ?? "",
        costType: inv.costType ?? "", costAllocationRatio: Number(inv.costAllocationRatio ?? 100),
        isAdvanceCost: inv.isAdvanceCost ?? false, remark: inv.remark ?? "",
      });
    }
  }, [inv]);

  const updateAmount = (amt: number, rate: number) => {
    setF(prev => ({ ...prev, amountWithoutTax: amt, taxRate: rate, taxAmount: +(amt * rate / 100).toFixed(2), amountWithTax: +(amt * (1 + rate / 100)).toFixed(2) }));
  };

  const mut = useMutation({
    mutationFn: async () => { const r = await fetch(`/api/input-invoices/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); return r.json(); },
    onSuccess: (r) => { if (r.success) { toast.success("已保存"); qc.invalidateQueries({ queryKey: ["input-invoice"] }); qc.invalidateQueries({ queryKey: ["input-invoices"] }); router.push("/input-invoices"); } else toast.error(r.error ?? "保存失败"); },
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">加载中...</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/input-invoices"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-xl font-semibold flex-1">编辑进项发票</h1>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending}><Save className="h-4 w-4 mr-2" />{mut.isPending ? "保存中..." : "保存"}</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">发票信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>发票号码 *</Label><Input value={f.invoiceNo} onChange={e => setF({ ...f, invoiceNo: e.target.value })} /></div>
          <div className="space-y-2"><Label>票种</Label>
            <Select value={f.invoiceCategory} onValueChange={v => setF({ ...f, invoiceCategory: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(catLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-2"><Label>销售方名称 *</Label><Input value={f.sellerName} onChange={e => setF({ ...f, sellerName: e.target.value })} /></div>
          <div className="space-y-2"><Label>销售方税号</Label><Input value={f.sellerTaxNo} onChange={e => setF({ ...f, sellerTaxNo: e.target.value })} /></div>
          <div className="space-y-2"><Label>购买方名称</Label><Input value={f.buyerName} onChange={e => setF({ ...f, buyerName: e.target.value })} /></div>
          <div className="space-y-2"><Label>购买方税号</Label><Input value={f.buyerTaxNo} onChange={e => setF({ ...f, buyerTaxNo: e.target.value })} /></div>
          <div className="space-y-2"><Label>开票日期</Label><Input type="date" value={f.issueDate} onChange={e => setF({ ...f, issueDate: e.target.value })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">金额信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>不含税金额</Label><Input type="number" value={f.amountWithoutTax} onChange={e => updateAmount(+e.target.value, f.taxRate)} /></div>
          <div className="space-y-2"><Label>税率 %</Label><Input type="number" value={f.taxRate} onChange={e => updateAmount(f.amountWithoutTax, +e.target.value)} /></div>
          <div className="space-y-2"><Label>税额</Label><Input type="number" value={f.taxAmount} disabled className="bg-muted" /></div>
          <div className="space-y-2"><Label>价税合计</Label><Input type="number" value={f.amountWithTax} disabled className="bg-muted" /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">关联信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>关联业务订单</Label>
            <Select value={f.businessOrderId} onValueChange={v => setF({ ...f, businessOrderId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(bizOrders ?? []).map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>录入方式</Label>
            <Select value={f.entryMethod} onValueChange={v => setF({ ...f, entryMethod: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="MANUAL">手工录入</SelectItem><SelectItem value="OCR">OCR识别</SelectItem><SelectItem value="IMPORT">批量导入</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-2"><Label>备注</Label><Input value={f.remark} onChange={e => setF({ ...f, remark: e.target.value })} /></div>
          <div className="flex items-center space-x-2"><Checkbox id="tax" checked={f.isFromTaxAuthority} onCheckedChange={v => setF({ ...f, isFromTaxAuthority: !!v })} /><Label htmlFor="tax">税局来源</Label></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">成本归集</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>供应商</Label>
            <Select value={f.supplierId} onValueChange={v => setF({ ...f, supplierId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(suppliers ?? []).map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>成本中心</Label>
            <Select value={f.costCenterId} onValueChange={v => setF({ ...f, costCenterId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(costCenters ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>成本类型</Label>
            <Select value={f.costType} onValueChange={v => setF({ ...f, costType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TRANSPORT">运输成本</SelectItem>
                <SelectItem value="WAREHOUSE">仓储成本</SelectItem>
                <SelectItem value="CUSTOMS">关务成本</SelectItem>
                <SelectItem value="AGENCY">代理成本</SelectItem>
                <SelectItem value="INSURANCE">保险费</SelectItem>
                <SelectItem value="OTHER">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>分摊比例(%)</Label><Input type="number" value={f.costAllocationRatio} onChange={e => setF({ ...f, costAllocationRatio: +e.target.value })} /></div>
          <div className="flex items-center space-x-2"><Checkbox id="adv" checked={f.isAdvanceCost} onCheckedChange={v => setF({ ...f, isAdvanceCost: !!v })} /><Label htmlFor="adv">代垫成本</Label></div>
        </CardContent>
      </Card>
    </div>
  );
}
