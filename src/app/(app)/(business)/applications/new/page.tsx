"use client";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEntitySelect } from "@/lib/hooks/use-entity-select";

const invoiceCategoryLabels: Record<string, string> = { DIGITAL_SPECIAL: "数电专票", DIGITAL_NORMAL: "数电普票", VAT_SPECIAL: "增值税专票", VAT_NORMAL: "增值税普票", E_NORMAL: "电子普票" };
const currencyLabels: Record<string, string> = { CNY: "人民币", USD: "美元", HKD: "港币", EUR: "欧元" };
const defaultTaxRateByCategory: Record<string, number> = { DIGITAL_SPECIAL: 6, DIGITAL_NORMAL: 6, VAT_SPECIAL: 13, VAT_NORMAL: 6, E_NORMAL: 6 };

interface Item { itemName: string; taxClassificationCode: string; spec: string; unit: string; quantity: number; unitPriceWithTax: number; amount: number; taxRate: number; taxAmount: number; }
const defaultItem: Item = { itemName: "", taxClassificationCode: "", spec: "", unit: "月", quantity: 1, unitPriceWithTax: 0, amount: 0, taxRate: 6, taxAmount: 0 };

function Field({ label, value, onChange, disabled, type, placeholder }: { label: string; value?: string | number; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled?: boolean; type?: string; placeholder?: string }) {
  return <div className="space-y-1.5"><Label>{label}</Label><Input type={type} value={value ?? ""} onChange={onChange} disabled={disabled} className={disabled ? "bg-muted" : ""} placeholder={placeholder} /></div>;
}

export default function ApplicationNewPage() {
  const router = useRouter();
  const { data: customers } = useEntitySelect("/api/customers/select");
  const { data: taxSubjects } = useEntitySelect("/api/tax-subjects/select");

  const [appNo] = useState(() => "APP-" + Date.now());
  const [f, setF] = useState({ applicationNo: appNo, invoiceCategory: "DIGITAL_SPECIAL", taxRate: 6, customerId: "", buyerName: "", buyerTaxNo: "", buyerAddressPhone: "", buyerBankName: "", buyerBankAccount: "", taxSubjectId: "", sellerName: "", sellerTaxNo: "", sellerAddressPhone: "", sellerBankName: "", sellerBankAccount: "", currency: "CNY", cashierName: "", reviewerName: "", drawerName: "", remark: "", amountWithoutTax: 0, taxAmount: 0, amountWithTax: 0 });
  const [items, setItems] = useState<Item[]>([{ ...defaultItem }]);
  const [bankAccounts, setBankAccounts] = useState<{ id: string; label: string; bankName: string; bankAccount: string }[]>([]);

  const addItem = () => setItems([...items, { ...defaultItem, taxRate: f.taxRate }]);
  const removeItem = (i: number) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };

  const recalcTotals = (its: Item[]) => { const totalAmount = its.reduce((s, x) => s + x.amount, 0); const totalTax = its.reduce((s, x) => s + x.taxAmount, 0); setF(p => ({ ...p, amountWithoutTax: +totalAmount.toFixed(2), taxAmount: +totalTax.toFixed(2), amountWithTax: +(totalAmount + totalTax).toFixed(2) })); };

  const updateItem = (i: number, field: keyof Item, val: string | number) => {
    const next = [...items]; const it = { ...next[i]!, [field]: val };
    it.amount = +((+it.unitPriceWithTax * +it.quantity) / (1 + +it.taxRate / 100)).toFixed(2);
    it.taxAmount = +(it.amount * +it.taxRate / 100).toFixed(2);
    next[i] = it; setItems(next); recalcTotals(next);
  };

  const loadCustomer = async (id: string) => { setF(p => ({ ...p, customerId: id })); if (!id) return; const r = await fetch(`/api/customers/${id}`); const j = await r.json(); if (j.success && j.data) { const c = j.data; setF(p => ({ ...p, buyerName: c.name || "", buyerTaxNo: c.taxNo || "", buyerAddressPhone: [c.address, c.phone].filter(Boolean).join(" "), buyerBankName: c.bankName || "", buyerBankAccount: c.bankAccount || "" })); } };

  const loadTaxSubject = async (id: string) => { setF(p => ({ ...p, taxSubjectId: id })); setBankAccounts([]); if (!id) return; const r = await fetch(`/api/tax-subjects/${id}`); const j = await r.json(); if (j.success && j.data) { const ts = j.data; setF(p => ({ ...p, sellerName: ts.name || "", sellerTaxNo: ts.taxNo || "", sellerAddressPhone: [ts.address, ts.phone].filter(Boolean).join(" ") })); } const br = await fetch(`/api/tax-subjects/${id}/bank-accounts`); const bj = await br.json(); if (bj.success && bj.data?.items) { setBankAccounts(bj.data.items); const def = bj.data.items.find((ba: { isDefault: boolean }) => ba.isDefault); if (def) setF(p => ({ ...p, sellerBankName: def.bankName, sellerBankAccount: def.bankAccount })); } };

  const setCategory = (cat: string) => { const rate = defaultTaxRateByCategory[cat] ?? 6; setF(p => ({ ...p, invoiceCategory: cat, taxRate: rate })); setItems(prev => { const next = prev.map(it => ({ ...it, taxRate: rate })); recalcTotals(next); return next; }); };

  const mut = useMutation({ mutationFn: async () => { const payload = { applicationNo: f.applicationNo, invoiceCategory: f.invoiceCategory, customerId: f.customerId, buyerName: f.buyerName, buyerTaxNo: f.buyerTaxNo, buyerAddress: f.buyerAddressPhone, buyerBankName: f.buyerBankName, buyerBankAccount: f.buyerBankAccount, taxSubjectId: f.taxSubjectId, sellerName: f.sellerName, sellerTaxNo: f.sellerTaxNo, sellerAddress: f.sellerAddressPhone, sellerBankName: f.sellerBankName, sellerBankAccount: f.sellerBankAccount, currency: f.currency, cashierName: f.cashierName, reviewerName: f.reviewerName, drawerName: f.drawerName, remark: f.remark, amountWithoutTax: f.amountWithoutTax, taxAmount: f.taxAmount, amountWithTax: f.amountWithTax, items: items.map(it => ({ itemName: it.itemName, taxClassificationCode: it.taxClassificationCode, spec: it.spec, unit: it.unit, quantity: it.quantity, unitPrice: it.unitPriceWithTax, amount: it.amount, taxRate: it.taxRate, taxAmount: it.taxAmount })) }; const r = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const j = await r.json(); if (!r.ok || !j.success) throw new Error(j.error || "创建失败"); return j; }, onSuccess: () => { toast.success("开票申请已创建"); router.push("/applications"); }, onError: (e) => toast.error(e instanceof Error ? e.message : "网络错误") });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-3"><Link href="/applications"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link><h1 className="text-xl font-semibold flex-1">新建开票申请</h1><Link href="/applications"><Button variant="outline">取消</Button></Link><Button onClick={() => mut.mutate()} disabled={mut.isPending}><Save className="h-4 w-4 mr-2" />{mut.isPending ? "保存中..." : "保存"}</Button></div>

      <Card><CardHeader className="pb-3"><CardTitle className="text-base">发票信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-4 gap-4">
          <div className="space-y-1.5"><Label>发票类型</Label><Select value={f.invoiceCategory} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(invoiceCategoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>发票税率</Label><Input type="number" step="0.01" value={f.taxRate} onChange={e => { const r = +e.target.value; setF(p => ({ ...p, taxRate: r })); setItems(prev => { const next = prev.map(it => ({ ...it, taxRate: r })); recalcTotals(next); return next; }); }} /></div>
          <div className="space-y-1.5"><Label>记账币种</Label><Select value={f.currency} onValueChange={v => setF({ ...f, currency: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(currencyLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>开票申请号</Label><Input value={f.applicationNo} disabled className="bg-muted" /></div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3"><CardHeader className="pb-3 flex flex-row items-center justify-between"><CardTitle className="text-base">购方信息</CardTitle><Select value={f.customerId} onValueChange={loadCustomer}><SelectTrigger className="w-44"><SelectValue>选择客户...</SelectValue></SelectTrigger><SelectContent>{(customers ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent></Select></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Field label="购方名称 *" value={f.buyerName} onChange={e => setF({ ...f, buyerName: e.target.value })} /></div>
            <div className="col-span-2"><Field label="购方纳税人识别号" value={f.buyerTaxNo} onChange={e => setF({ ...f, buyerTaxNo: e.target.value })} /></div>
            <div className="col-span-2"><Field label="购方地址电话" value={f.buyerAddressPhone} onChange={e => setF({ ...f, buyerAddressPhone: e.target.value })} placeholder="地址、电话" /></div>
            <Field label="购方开户行" value={f.buyerBankName} onChange={e => setF({ ...f, buyerBankName: e.target.value })} placeholder="开户行" />
            <Field label="购方银行账号" value={f.buyerBankAccount} onChange={e => setF({ ...f, buyerBankAccount: e.target.value })} placeholder="银行账号" />
          </CardContent>
        </Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">金额汇总</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">未税合计</span><strong className="tabular-nums">¥{f.amountWithoutTax.toLocaleString()}</strong></div><div className="flex justify-between"><span className="text-muted-foreground">税额合计</span><strong className="tabular-nums">¥{f.taxAmount.toLocaleString()}</strong></div><div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">价税合计</span><strong className="tabular-nums text-base">¥{f.amountWithTax.toLocaleString()}</strong></div></div>
            <div className="mt-4 space-y-1.5"><Label>记账金额（未税）</Label><Input value={f.amountWithoutTax} disabled className="bg-muted tabular-nums" /></div>
          </CardContent>
        </Card>
      </div>

      <Card><CardHeader className="pb-3 flex flex-row items-center justify-between"><CardTitle className="text-base">项目明细</CardTitle><Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-3.5 w-3.5 mr-1" />添加行</Button></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-12 gap-2 px-3 py-1 text-xs text-muted-foreground font-medium"><div className="col-span-3">项目名称</div><div className="col-span-2">规格型号</div><div>单位</div><div>数量</div><div className="col-span-2">含税单价</div><div className="col-span-2">未税金额</div><div>税额</div></div>
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 p-3 border rounded-sm bg-muted/50 items-center">
              <div className="col-span-3"><Input placeholder="项目名称" value={item.itemName} onChange={e => updateItem(i, "itemName", e.target.value)} /></div>
              <div className="col-span-2"><Input placeholder="规格型号" value={item.spec} onChange={e => updateItem(i, "spec", e.target.value)} /></div>
              <Input placeholder="单位" value={item.unit} onChange={e => updateItem(i, "unit", e.target.value)} />
              <Input type="number" value={item.quantity} onChange={e => updateItem(i, "quantity", +e.target.value)} />
              <div className="col-span-2"><Input type="number" step="0.01" value={item.unitPriceWithTax || ""} onChange={e => updateItem(i, "unitPriceWithTax", +e.target.value)} /></div>
              <div className="col-span-2 text-sm tabular-nums text-right px-1">¥{item.amount.toLocaleString()}</div>
              <div className="flex items-center gap-1"><span className="text-sm tabular-nums">¥{item.taxAmount.toLocaleString()}</span><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeItem(i)} disabled={items.length <= 1}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></div>
            </div>
          ))}
          <div className="flex justify-end gap-6 text-sm pt-2 border-t"><span>未税合计: <strong className="tabular-nums">¥{f.amountWithoutTax.toLocaleString()}</strong></span><span>税额合计: <strong className="tabular-nums">¥{f.taxAmount.toLocaleString()}</strong></span><span>价税合计: <strong className="tabular-nums">¥{f.amountWithTax.toLocaleString()}</strong></span></div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3"><CardHeader className="pb-3"><CardTitle className="text-base">销方信息</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5"><Label>销方名称（搜索选择）</Label><Select value={f.taxSubjectId} onValueChange={loadTaxSubject}><SelectTrigger><SelectValue>搜索选择税号主体...</SelectValue></SelectTrigger><SelectContent>{(taxSubjects ?? []).map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="销方名称" value={f.sellerName} disabled />
              <Field label="销方纳税人识别号" value={f.sellerTaxNo} disabled />
              <div className="col-span-2"><Field label="销方地址电话" value={f.sellerAddressPhone} disabled /></div>
              <div className="col-span-2">
                <div className="space-y-1.5"><Label>销方银行账号（下拉选择）</Label>
                  <Select value={`${f.sellerBankName} ${f.sellerBankAccount}`.trim()} onValueChange={v => { const ba = bankAccounts.find(b => `${b.bankName} ${b.bankAccount}` === v); if (ba) setF(p => ({ ...p, sellerBankName: ba.bankName, sellerBankAccount: ba.bankAccount })); }}>
                    <SelectTrigger><SelectValue>{bankAccounts.length === 0 ? "请先选择税号主体" : "选择银行账号..."}</SelectValue></SelectTrigger>
                    <SelectContent>{bankAccounts.map(ba => <SelectItem key={ba.id} value={`${ba.bankName} ${ba.bankAccount}`}>{ba.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">人员信息</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="收款人" value={f.cashierName} onChange={e => setF({ ...f, cashierName: e.target.value })} />
            <Field label="复核人" value={f.reviewerName} onChange={e => setF({ ...f, reviewerName: e.target.value })} />
            <Field label="开票人" value={f.drawerName} onChange={e => setF({ ...f, drawerName: e.target.value })} />
          </CardContent>
        </Card>
      </div>

      <Card><CardHeader className="pb-3"><CardTitle className="text-base">备注</CardTitle></CardHeader><CardContent><Input value={f.remark} onChange={e => setF({ ...f, remark: e.target.value })} placeholder="备注信息" /></CardContent></Card>
    </div>
  );
}
