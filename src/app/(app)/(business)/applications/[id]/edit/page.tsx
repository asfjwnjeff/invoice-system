"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEntitySelect } from "@/lib/hooks/use-entity-select";

interface Item { itemName: string; taxCode: string; quantity: number; unitPrice: number; amount: number; taxRate: number; taxAmount: number; }
const invoiceTypes = ["DIGITAL_SPECIAL","DIGITAL_NORMAL","VAT_SPECIAL","VAT_NORMAL","E_NORMAL"];
const catLabels: Record<string, string> = { DIGITAL_SPECIAL:"数电专票", DIGITAL_NORMAL:"数电普票", VAT_SPECIAL:"增值税专票", VAT_NORMAL:"增值税普票", E_NORMAL:"电子普票" };
const defaultItem: Item = { itemName: "", taxCode: "", quantity: 1, unitPrice: 0, amount: 0, taxRate: 6, taxAmount: 0 };

export default function ApplicationEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [f, setF] = useState({ applicationNo: "", buyerName: "", buyerTaxNo: "", invoiceCategory: "DIGITAL_SPECIAL", revenueOrderId: "", settlementId: "", remark: "", amountWithoutTax: 0, taxAmount: 0, amountWithTax: 0, customerId: "", buyerAddress: "", buyerPhone: "", buyerBankName: "", buyerBankAccount: "", currency: "人民币", deliveryMethod: "EMAIL", recipientEmail: "" });
  const [items, setItems] = useState<Item[]>([{ ...defaultItem }]);

  const { data: revenueOrders } = useEntitySelect("/api/revenue-orders/select");
  const { data: settlements } = useEntitySelect("/api/settlements/select");
  const { data: customers } = useEntitySelect("/api/customers/select");

  const { data: app, isLoading } = useQuery({
    queryKey: ["application", id],
    queryFn: async () => { const r = await fetch(`/api/applications/${id}`); const j = await r.json(); return j.data; },
  });

  useEffect(() => {
    if (app) {
      setF({
        applicationNo: app.applicationNo ?? app.appNo ?? "", buyerName: app.buyerName ?? "", buyerTaxNo: app.buyerTaxNo ?? "",
        invoiceCategory: app.invoiceCategory ?? app.invoiceType ?? "DIGITAL_SPECIAL", remark: app.remark ?? "",
        revenueOrderId: app.revenueOrderId ?? "", settlementId: app.settlementId ?? "",
        amountWithoutTax: Number(app.amountWithoutTax ?? 0), taxAmount: Number(app.taxAmount ?? 0), amountWithTax: Number(app.amountWithTax ?? 0),
        customerId: app.customerId ?? "", buyerAddress: app.buyerAddress ?? "", buyerPhone: app.buyerPhone ?? "",
        buyerBankName: app.buyerBankName ?? "", buyerBankAccount: app.buyerBankAccount ?? "",
        currency: app.currency ?? "人民币", deliveryMethod: app.deliveryMethod ?? "EMAIL", recipientEmail: app.recipientEmail ?? "",
      });
      if (app.items?.length > 0) {
        setItems(app.items.map((it: Record<string, unknown>) => ({
          itemName: (it.itemName as string) ?? "", taxCode: (it.taxClassificationCode as string) ?? (it.taxCode as string) ?? "",
          quantity: Number(it.quantity ?? 1), unitPrice: Number(it.unitPrice ?? 0), amount: Number(it.amount ?? 0),
          taxRate: Number(it.taxRate ?? 6), taxAmount: Number(it.taxAmount ?? 0),
        })));
      }
    }
  }, [app]);

  const addItem = () => setItems([...items, { ...defaultItem }]);
  const updateItem = (i: number, field: keyof Item, val: string | number) => {
    const next = [...items];
    const it = { ...next[i]!, [field]: val };
    it.amount = +(it.quantity * it.unitPrice).toFixed(2);
    it.taxAmount = +(it.amount * it.taxRate / 100).toFixed(2);
    next[i] = it;
    setItems(next);
    const total = next.reduce((s, x) => s + x.amount, 0);
    const totalTax = next.reduce((s, x) => s + x.taxAmount, 0);
    setF(prev => ({ ...prev, amountWithoutTax: +total.toFixed(2), taxAmount: +totalTax.toFixed(2), amountWithTax: +(total + totalTax).toFixed(2) }));
  };
  const removeItem = (i: number) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };

  const mut = useMutation({
    mutationFn: async () => { const r = await fetch(`/api/applications/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, items }) }); return r.json(); },
    onSuccess: (r) => { if (r.success) { toast.success("已保存"); qc.invalidateQueries({ queryKey: ["application"] }); qc.invalidateQueries({ queryKey: ["applications"] }); router.push(`/applications/${id}`); } else toast.error(r.error ?? "保存失败"); },
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">加载中...</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href={`/applications/${id}`}><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-xl font-semibold flex-1">编辑开票申请</h1>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending}><Save className="h-4 w-4 mr-2" />{mut.isPending ? "保存中..." : "保存"}</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">基本信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>申请号</Label><Input value={f.applicationNo} onChange={e => setF({ ...f, applicationNo: e.target.value })} /></div>
          <div className="space-y-2"><Label>发票类型</Label>
            <Select value={f.invoiceCategory} onValueChange={v => setF({ ...f, invoiceCategory: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{invoiceTypes.map(t => <SelectItem key={t} value={t}>{catLabels[t]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>购买方名称 *</Label><Input value={f.buyerName} onChange={e => setF({ ...f, buyerName: e.target.value })} /></div>
          <div className="space-y-2"><Label>购买方税号</Label><Input value={f.buyerTaxNo} onChange={e => setF({ ...f, buyerTaxNo: e.target.value })} /></div>
          <div className="space-y-2"><Label>关联客户</Label>
            <Select value={f.customerId} onValueChange={v => setF({ ...f, customerId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(customers ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>币种</Label>
            <Select value={f.currency} onValueChange={v => setF({ ...f, currency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="人民币">人民币</SelectItem>
                <SelectItem value="美元">美元</SelectItem>
                <SelectItem value="港币">港币</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-2"><Label>备注</Label><Input value={f.remark} onChange={e => setF({ ...f, remark: e.target.value })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">来源关联</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>来源收入订单</Label>
            <Select value={f.revenueOrderId} onValueChange={v => setF({ ...f, revenueOrderId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(revenueOrders ?? []).map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>来源结算单</Label>
            <Select value={f.settlementId} onValueChange={v => setF({ ...f, settlementId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(settlements ?? []).map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">购买方信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>地址</Label><Input value={f.buyerAddress} onChange={e => setF({ ...f, buyerAddress: e.target.value })} /></div>
          <div className="space-y-2"><Label>电话</Label><Input value={f.buyerPhone} onChange={e => setF({ ...f, buyerPhone: e.target.value })} /></div>
          <div className="space-y-2"><Label>开户行</Label><Input value={f.buyerBankName} onChange={e => setF({ ...f, buyerBankName: e.target.value })} /></div>
          <div className="space-y-2"><Label>银行账号</Label><Input value={f.buyerBankAccount} onChange={e => setF({ ...f, buyerBankAccount: e.target.value })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">交付信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>交付方式</Label>
            <Select value={f.deliveryMethod} onValueChange={v => setF({ ...f, deliveryMethod: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EMAIL">邮件</SelectItem>
                <SelectItem value="DOWNLOAD">下载</SelectItem>
                <SelectItem value="API">接口</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>收件邮箱</Label><Input value={f.recipientEmail} onChange={e => setF({ ...f, recipientEmail: e.target.value })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">开票明细</CardTitle><Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-3.5 w-3.5 mr-1" />添加行</Button></CardHeader>
        <CardContent className="space-y-3">
          {/* 表头 */}
          <div className="grid grid-cols-12 gap-2 px-3 py-1.5 text-xs text-muted-foreground font-medium">
            <div className="col-span-3">项目名称</div>
            <div className="col-span-2">税收编码</div>
            <div>数量</div>
            <div>单价</div>
            <div>税率</div>
            <div className="col-span-4">金额</div>
          </div>
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 p-3 border rounded-md bg-muted/30 items-center">
              <div className="col-span-3"><Input placeholder="项目名称" value={item.itemName} onChange={e => updateItem(i, "itemName", e.target.value)} /></div>
              <Input className="col-span-2" placeholder="税收编码" value={item.taxCode} onChange={e => updateItem(i, "taxCode", e.target.value)} />
              <Input type="number" placeholder="数量" value={item.quantity} onChange={e => updateItem(i, "quantity", +e.target.value)} />
              <Input type="number" placeholder="单价" value={item.unitPrice} onChange={e => updateItem(i, "unitPrice", +e.target.value)} />
              <Input type="number" placeholder="税率%" value={item.taxRate} onChange={e => updateItem(i, "taxRate", +e.target.value)} />
              <div className="col-span-4 flex items-center gap-2">
                <span className="text-sm tabular-nums text-muted-foreground min-w-[60px]">¥{item.amount.toLocaleString()}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeItem(i)} disabled={items.length <= 1}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-6 text-sm pt-2 border-t">
            <span>不含税: <strong className="tabular-nums">¥{f.amountWithoutTax.toLocaleString()}</strong></span>
            <span>税额: <strong className="tabular-nums">¥{f.taxAmount.toLocaleString()}</strong></span>
            <span>价税合计: <strong className="tabular-nums text-base">¥{f.amountWithTax.toLocaleString()}</strong></span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
