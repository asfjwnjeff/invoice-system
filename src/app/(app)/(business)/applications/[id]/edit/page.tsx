"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/shared/form-dialog";
import { SelectSearch } from "@/components/ui/select-search";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEntitySelect } from "@/lib/hooks/use-entity-select";

const invoiceCategoryLabels: Record<string, string> = {
  DIGITAL_SPECIAL: "增值税专用发票(数电)",
  DIGITAL_NORMAL: "增值税普通发票(数电)",
  VAT_SPECIAL: "INVOICE发票",
};
const currencyLabels: Record<string, string> = {
  CNY: "人民币", AUD: "澳大利亚元", EUR: "欧元", USD: "美元", HKD: "港币", JPY: "日元", GBP: "英镑",
};
const taxRateOptions = ["0", "6", "9", "13"];
const defaultTaxRateByCategory: Record<string, number> = {
  DIGITAL_SPECIAL: 13, DIGITAL_NORMAL: 6, VAT_SPECIAL: 0,
};

interface Item {
  itemName: string; taxClassificationCode: string; spec: string; unit: string;
  quantity: number; unitPriceWithTax: number; amount: number; taxRate: number; taxAmount: number;
}
const defaultItem: Item = {
  itemName: "", taxClassificationCode: "", spec: "", unit: "月",
  quantity: 1, unitPriceWithTax: 0, amount: 0, taxRate: 6, taxAmount: 0,
};

interface FormState {
  applicationNo: string; invoiceCategory: string; taxRate: number;
  customerId: string; buyerName: string; buyerTaxNo: string; buyerAddressPhone: string; buyerBankName: string; buyerBankAccount: string;
  taxSubjectId: string; sellerName: string; sellerTaxNo: string; sellerAddressPhone: string; sellerBankName: string; sellerBankAccount: string;
  currency: string; cashierName: string; reviewerName: string; drawerName: string; remark: string;
  amountWithoutTax: number; taxAmount: number; amountWithTax: number;
}

const emptyForm = (): FormState => ({
  applicationNo: "", invoiceCategory: "DIGITAL_SPECIAL", taxRate: 13,
  customerId: "", buyerName: "", buyerTaxNo: "", buyerAddressPhone: "", buyerBankName: "", buyerBankAccount: "",
  taxSubjectId: "", sellerName: "", sellerTaxNo: "", sellerAddressPhone: "", sellerBankName: "", sellerBankAccount: "",
  currency: "CNY", cashierName: "", reviewerName: "", drawerName: "", remark: "",
  amountWithoutTax: 0, taxAmount: 0, amountWithTax: 0,
});

interface BankAccount { id: string; label: string; bankName: string; bankAccount: string; isDefault: boolean; }

export default function ApplicationEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter(); const qc = useQueryClient();
  const { data: customersData } = useEntitySelect("/api/customers/select");
  const { data: taxSubjectsData } = useEntitySelect("/api/tax-subjects/select");
  const { data: taxCodesData } = useEntitySelect("/api/tax-codes/select");
  const customerOptions = (customersData ?? []) as { id: string; label: string }[];
  const taxSubjectOptions = (taxSubjectsData ?? []) as { id: string; label: string }[];
  const taxCodeOptions = (taxCodesData ?? []) as { id: string; label: string }[];

  const [f, setF] = useState<FormState>(emptyForm());
  const [items, setItems] = useState<Item[]>([{ ...defaultItem, taxRate: 13 }]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  const { data: app, isLoading } = useQuery({
    queryKey: ["application", id],
    queryFn: async () => { const r = await fetch(`/api/applications/${id}`); const j = await r.json(); return j.data as Record<string, unknown>; },
  });

  useEffect(() => {
    if (!app) return;
    setF({
      applicationNo: String(app.applicationNo ?? ""), invoiceCategory: String(app.invoiceCategory ?? "DIGITAL_SPECIAL"),
      taxRate: +(((app.items as Record<string, unknown>[])?.[0]?.taxRate) || 13),
      customerId: String(app.customerId ?? ""), buyerName: String(app.buyerName ?? ""), buyerTaxNo: String(app.buyerTaxNo ?? ""),
      buyerAddressPhone: String(app.buyerAddress ?? ""), buyerBankName: String(app.buyerBankName ?? ""), buyerBankAccount: String(app.buyerBankAccount ?? ""),
      taxSubjectId: String(app.taxSubjectId ?? ""), sellerName: String(app.sellerName ?? ""), sellerTaxNo: String(app.sellerTaxNo ?? ""),
      sellerAddressPhone: String(app.sellerAddress ?? ""), sellerBankName: String(app.sellerBankName ?? ""), sellerBankAccount: String(app.sellerBankAccount ?? ""),
      currency: String(app.currency ?? "CNY"),
      cashierName: String(app.cashierName ?? ""), reviewerName: String(app.reviewerName ?? ""),
      drawerName: String(app.drawerName ?? ""), remark: String(app.remark ?? ""),
      amountWithoutTax: Number(app.amountWithoutTax ?? 0), taxAmount: Number(app.taxAmount ?? 0), amountWithTax: Number(app.amountWithTax ?? 0),
    });
    const appItems = (app.items as Record<string, unknown>[]) ?? [];
    if (appItems.length > 0) {
      setItems(appItems.map((it: Record<string, unknown>) => ({
        itemName: String(it.itemName ?? ""), taxClassificationCode: String(it.taxClassificationCode ?? ""),
        spec: String(it.spec ?? ""), unit: String(it.unit ?? "月"), quantity: Number(it.quantity ?? 1),
        unitPriceWithTax: Number(it.unitPrice ?? 0), amount: Number(it.amount ?? 0),
        taxRate: Number(it.taxRate ?? 6), taxAmount: Number(it.taxAmount ?? 0),
      })));
    }
    const tsId = String(app.taxSubjectId ?? "");
    if (tsId) {
      fetch(`/api/tax-subjects/${tsId}/bank-accounts`).then(r => r.json()).then(j => {
        if (j.success && j.data?.items) {
          const baItems = j.data.items as BankAccount[];
          setBankAccounts(baItems);
          const saved = baItems.find(ba => ba.bankName === String(app.sellerBankName ?? "") && ba.bankAccount === String(app.sellerBankAccount ?? ""));
          if (saved) setF(p => ({ ...p, sellerBankName: saved.bankName, sellerBankAccount: saved.bankAccount }));
        }
      });
    }
  }, [app]);

  const addItem = () => setItems([...items, { ...defaultItem, taxRate: f.taxRate }]);
  const removeItem = (i: number) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };

  const recalcTotals = (its: Item[]) => {
    const totalAmount = its.reduce((s, x) => s + x.amount, 0);
    const totalTax = its.reduce((s, x) => s + x.taxAmount, 0);
    setF(p => ({ ...p, amountWithoutTax: +totalAmount.toFixed(2), taxAmount: +totalTax.toFixed(2), amountWithTax: +(totalAmount + totalTax).toFixed(2) }));
  };

  const updateItem = (i: number, field: keyof Item, val: string | number) => {
    const next = [...items];
    const it = { ...next[i]!, [field]: val };
    it.amount = +((+it.unitPriceWithTax * +it.quantity) / (1 + +it.taxRate / 100)).toFixed(2);
    it.taxAmount = +(it.amount * +it.taxRate / 100).toFixed(2);
    next[i] = it;
    setItems(next);
    recalcTotals(next);
  };

  const selectTaxCode = (i: number, codeId: string) => {
    const next = [...items];
    const tc = taxCodeOptions.find(o => o.id === codeId);
    if (tc) {
      const parts = tc.label.split(" — ");
      const name = parts[1]?.replace(/\s*\(\d+%\)$/, "") ?? "";
      const rate = +((parts[1]?.match(/\((\d+)%\)/) ?? [])[1] ?? next[i]!.taxRate);
      next[i] = { ...next[i]!, taxClassificationCode: parts[0] ?? "", itemName: name, taxRate: rate };
    }
    setItems(next);
    recalcTotals(next);
  };

  const loadCustomer = async (cid: string) => {
    setF(p => ({ ...p, customerId: cid }));
    if (!cid) return;
    const r = await fetch(`/api/customers/${cid}`);
    const j = await r.json();
    if (j.success && j.data) {
      const c = j.data as Record<string, unknown>;
      setF(p => ({ ...p, buyerName: String(c.name ?? ""), buyerTaxNo: String(c.taxNo ?? ""), buyerAddressPhone: [String(c.address ?? ""), String(c.phone ?? "")].filter(Boolean).join(" "), buyerBankName: String(c.bankName ?? ""), buyerBankAccount: String(c.bankAccount ?? "") }));
    }
  };

  const loadTaxSubject = async (tsid: string) => {
    setF(p => ({ ...p, taxSubjectId: tsid }));
    setBankAccounts([]);
    if (!tsid) return;
    const r = await fetch(`/api/tax-subjects/${tsid}`);
    const j = await r.json();
    if (j.success && j.data) {
      const ts = j.data as Record<string, unknown>;
      setF(p => ({ ...p, sellerName: String(ts.name ?? ""), sellerTaxNo: String(ts.taxNo ?? ""), sellerAddressPhone: [String(ts.address ?? ""), String(ts.phone ?? "")].filter(Boolean).join(" ") }));
    }
    const br = await fetch(`/api/tax-subjects/${tsid}/bank-accounts`);
    const bj = await br.json();
    if (bj.success && bj.data?.items) {
      const items = bj.data.items as BankAccount[];
      setBankAccounts(items);
      const def = items.find(ba => ba.isDefault);
      if (def) setF(p => ({ ...p, sellerBankName: def.bankName, sellerBankAccount: def.bankAccount }));
    }
  };

  const setCategory = (cat: string) => {
    const rate = defaultTaxRateByCategory[cat] ?? 6;
    setF(p => ({ ...p, invoiceCategory: cat, taxRate: rate }));
    setItems(prev => { const next = prev.map(it => ({ ...it, taxRate: rate })); recalcTotals(next); return next; });
  };

  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        applicationNo: f.applicationNo, invoiceCategory: f.invoiceCategory,
        customerId: f.customerId, buyerName: f.buyerName, buyerTaxNo: f.buyerTaxNo, buyerAddress: f.buyerAddressPhone,
        buyerBankName: f.buyerBankName, buyerBankAccount: f.buyerBankAccount,
        taxSubjectId: f.taxSubjectId, sellerName: f.sellerName, sellerTaxNo: f.sellerTaxNo, sellerAddress: f.sellerAddressPhone,
        sellerBankName: f.sellerBankName, sellerBankAccount: f.sellerBankAccount,
        currency: f.currency, cashierName: f.cashierName, reviewerName: f.reviewerName, drawerName: f.drawerName, remark: f.remark,
        amountWithoutTax: f.amountWithoutTax, taxAmount: f.taxAmount, amountWithTax: f.amountWithTax,
        items: items.map(it => ({
          itemName: it.itemName, taxClassificationCode: it.taxClassificationCode,
          spec: it.spec, unit: it.unit, quantity: it.quantity, unitPrice: it.unitPriceWithTax,
          amount: it.amount, taxRate: it.taxRate, taxAmount: it.taxAmount,
        })),
      };
      const r = await fetch(`/api/applications/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.error || "保存失败");
      return j;
    },
    onSuccess: () => { toast.success("已保存"); qc.invalidateQueries({ queryKey: ["application"] }); qc.invalidateQueries({ queryKey: ["applications"] }); router.push(`/applications/${id}`); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "网络错误"),
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">加载中...</div>;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <Link href={`/applications/${id}`}><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-xl font-semibold flex-1">编辑开票申请</h1>
        <Link href={`/applications/${id}`}><Button variant="outline">取消</Button></Link>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending}><Save className="h-4 w-4 mr-2" />{mut.isPending ? "保存中..." : "保存"}</Button>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">发票信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-4 gap-x-8 gap-y-6">
          <FormField label="发票类型" required>
            <Select value={f.invoiceCategory} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(invoiceCategoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="发票税率" required>
            <Select value={String(f.taxRate)} onValueChange={v => {
              const r = +v;
              setF(p => ({ ...p, taxRate: r }));
              setItems(prev => { const next = prev.map(it => ({ ...it, taxRate: r })); recalcTotals(next); return next; });
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{taxRateOptions.map(v => <SelectItem key={v} value={v}>{v}%</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="记账币种" required>
            <Select value={f.currency} onValueChange={v => setF({ ...f, currency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(currencyLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">购方信息</CardTitle>
            <SelectSearch value={f.customerId} onValueChange={loadCustomer} options={customerOptions.map(o => ({ value: o.id, label: o.label }))} placeholder="选择客户..." className="w-[200px]" />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-8 gap-y-6">
            <FormField label="购方名称" required fullWidth>
              <Input value={f.buyerName} onChange={e => setF({ ...f, buyerName: e.target.value })} />
            </FormField>
            <FormField label="纳税人识别号" fullWidth>
              <Input value={f.buyerTaxNo} onChange={e => setF({ ...f, buyerTaxNo: e.target.value })} />
            </FormField>
            <FormField label="购方地址电话" fullWidth>
              <Input value={f.buyerAddressPhone} onChange={e => setF({ ...f, buyerAddressPhone: e.target.value })} placeholder="地址、电话" />
            </FormField>
            <FormField label="购方银行帐号" fullWidth>
              <Input value={`${f.buyerBankName} ${f.buyerBankAccount}`.trim()} onChange={e => { const parts = e.target.value.split(" "); setF({ ...f, buyerBankName: parts[0] ?? "", buyerBankAccount: parts.slice(1).join(" ") }); }} placeholder="开户行 账号" />
            </FormField>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">金额汇总</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">未税合计</span><strong className="tabular-nums">¥{f.amountWithoutTax.toLocaleString()}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">税额合计</span><strong className="tabular-nums">¥{f.taxAmount.toLocaleString()}</strong></div>
              <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">价税合计</span><strong className="tabular-nums text-base">¥{f.amountWithTax.toLocaleString()}</strong></div>
            </div>
            <div className="mt-4">
              <FormField label="记账金额">
                <Input value={f.amountWithoutTax} disabled className="bg-muted tabular-nums" />
              </FormField>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-visible">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">项目明细</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-3.5 w-3.5 mr-1" />添加行</Button>
        </CardHeader>
        <CardContent className="space-y-3 overflow-visible">
          <div className="grid grid-cols-12 gap-2 px-3 py-1 text-xs text-muted-foreground font-medium">
            <div className="col-span-3">项目名称</div>
            <div>规格型号</div>
            <div>单位</div>
            <div>数量</div>
            <div className="col-span-2">含税单价</div>
            <div>税率%</div>
            <div>未税金额</div>
            <div>税额</div>
          </div>
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 p-3 border rounded-sm bg-muted/50 items-center">
              <div className="col-span-3">
                <SelectSearch
                  value={item.taxClassificationCode ? taxCodeOptions.find(o => o.label.startsWith(item.taxClassificationCode))?.id ?? "" : ""}
                  onValueChange={v => selectTaxCode(i, v)}
                  options={taxCodeOptions.map(o => ({ value: o.id, label: o.label }))}
                  placeholder="搜索编码或项目名称..."
                />
              </div>
              <Input placeholder="规格型号" value={item.spec} onChange={e => updateItem(i, "spec", e.target.value)} />
              <Input placeholder="单位" value={item.unit} onChange={e => updateItem(i, "unit", e.target.value)} />
              <Input type="number" value={item.quantity} onChange={e => updateItem(i, "quantity", +e.target.value)} />
              <div className="col-span-2"><Input type="number" step="0.01" value={item.unitPriceWithTax || ""} onChange={e => updateItem(i, "unitPriceWithTax", +e.target.value)} /></div>
              <Input type="number" step="0.01" value={item.taxRate} onChange={e => updateItem(i, "taxRate", +e.target.value)} />
              <span className="text-sm tabular-nums text-right">¥{item.amount.toLocaleString()}</span>
              <div className="flex items-center gap-1">
                <span className="text-sm tabular-nums w-20 text-right">¥{item.taxAmount.toLocaleString()}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeItem(i)} disabled={items.length <= 1}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-6 text-sm pt-2 border-t">
            <span>未税合计: <strong className="tabular-nums">¥{f.amountWithoutTax.toLocaleString()}</strong></span>
            <span>税额合计: <strong className="tabular-nums">¥{f.taxAmount.toLocaleString()}</strong></span>
            <span>价税合计: <strong className="tabular-nums">¥{f.amountWithTax.toLocaleString()}</strong></span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3"><CardTitle className="text-base">销方信息</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="销方名称（搜索选择）" required>
              <SelectSearch value={f.taxSubjectId} onValueChange={loadTaxSubject} options={taxSubjectOptions.map(o => ({ value: o.id, label: o.label }))} placeholder="搜索选择税号主体..." />
            </FormField>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <FormField label="销方名称">
                <Input value={f.sellerName} disabled className="bg-muted" />
              </FormField>
              <FormField label="纳税人识别号">
                <Input value={f.sellerTaxNo} disabled className="bg-muted" />
              </FormField>
              <FormField label="销方地址电话" fullWidth>
                <Input value={f.sellerAddressPhone} disabled className="bg-muted" />
              </FormField>
              <FormField label="销方银行帐号" fullWidth>
                <Select value={`${f.sellerBankName} ${f.sellerBankAccount}`.trim()} onValueChange={v => {
                  const ba = bankAccounts.find(b => `${b.bankName} ${b.bankAccount}` === v);
                  if (ba) setF(p => ({ ...p, sellerBankName: ba.bankName, sellerBankAccount: ba.bankAccount }));
                }}>
                  <SelectTrigger><SelectValue>{bankAccounts.length === 0 ? "请先选择税号主体" : "选择银行账号..."}</SelectValue></SelectTrigger>
                  <SelectContent>{bankAccounts.map(ba => <SelectItem key={ba.id} value={`${ba.bankName} ${ba.bankAccount}`}>{ba.label}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">人员信息</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="收款人">
              <Input value={f.cashierName} onChange={e => setF({ ...f, cashierName: e.target.value })} />
            </FormField>
            <FormField label="复核人">
              <Input value={f.reviewerName} onChange={e => setF({ ...f, reviewerName: e.target.value })} />
            </FormField>
            <FormField label="开票人">
              <Input value={f.drawerName} onChange={e => setF({ ...f, drawerName: e.target.value })} />
            </FormField>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">备注</CardTitle></CardHeader>
          <CardContent>
            <Input value={f.remark} onChange={e => setF({ ...f, remark: e.target.value })} placeholder="备注信息" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">开票申请号</CardTitle></CardHeader>
          <CardContent>
            <Input value={f.applicationNo} disabled className="bg-muted" placeholder="自动生成" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
