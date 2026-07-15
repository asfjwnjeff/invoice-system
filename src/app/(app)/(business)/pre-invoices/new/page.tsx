"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEntitySelect } from "@/lib/hooks/use-entity-select";

const invoiceCategoryLabels: Record<string, string> = {
  DIGITAL_SPECIAL: "数电专票", DIGITAL_NORMAL: "数电普票",
  VAT_SPECIAL: "增值税专票", VAT_NORMAL: "增值税普票", E_NORMAL: "电子普票",
};

interface Item {
  appItemId?: string;
  itemName: string;
  taxClassificationCode: string;
  taxCodeId: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

const defaultItem: Item = {
  itemName: "", taxClassificationCode: "", taxCodeId: "",
  quantity: 1, unitPrice: 0, amount: 0, taxRate: 6, taxAmount: 0, totalAmount: 0,
};

export default function PreInvoiceNewPage() {
  const router = useRouter();
  const { data: applications } = useEntitySelect("/api/applications/select");
  const { data: customers } = useEntitySelect("/api/customers/select");
  const { data: taxSubjects } = useEntitySelect("/api/tax-subjects/select");
  const { data: taxCodes } = useEntitySelect("/api/tax-codes/select");

  const [f, setF] = useState({
    applicationId: "", invoiceCategory: "DIGITAL_SPECIAL", taxSubjectId: "",
    customerId: "", buyerName: "", buyerTaxNo: "", buyerAddress: "",
    buyerPhone: "", buyerBankName: "", buyerBankAccount: "",
    sellerName: "", sellerTaxNo: "", remark: "",
    amountWithoutTax: 0, taxAmount: 0, amountWithTax: 0,
  });

  const [items, setItems] = useState<Item[]>([{ ...defaultItem }]);

  const addItem = () => setItems([...items, { ...defaultItem }]);

  const updateItem = (i: number, field: keyof Item, val: string | number) => {
    const next = [...items];
    const it = { ...next[i]!, [field]: val };
    it.amount = +(it.quantity * it.unitPrice).toFixed(2);
    it.taxAmount = +(it.amount * it.taxRate / 100).toFixed(2);
    it.totalAmount = +(it.amount + it.taxAmount).toFixed(2);
    next[i] = it;
    setItems(next);
    const total = next.reduce((s, x) => s + x.amount, 0);
    const totalTax = next.reduce((s, x) => s + x.taxAmount, 0);
    setF(p => ({ ...p, amountWithoutTax: +total.toFixed(2), taxAmount: +totalTax.toFixed(2), amountWithTax: +(total + totalTax).toFixed(2) }));
  };

  const removeItem = (i: number) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };

  // Load application data when selected
  const loadApplication = async (appId: string) => {
    if (!appId) return;
    const r = await fetch(`/api/applications/${appId}`);
    const j = await r.json();
    if (j.success && j.data) {
      const app = j.data;
      setF(p => ({
        ...p, applicationId: appId, customerId: app.customerId || "",
        buyerName: app.buyerName || "", buyerTaxNo: app.buyerTaxNo || "",
        buyerAddress: app.buyerAddress || "", buyerPhone: app.buyerPhone || "",
        buyerBankName: app.buyerBankName || "", buyerBankAccount: app.buyerBankAccount || "",
        invoiceCategory: app.invoiceCategory || "DIGITAL_SPECIAL",
        remark: app.remark || "",
        amountWithoutTax: +app.amountWithoutTax || 0,
        taxAmount: +app.taxAmount || 0,
        amountWithTax: +app.amountWithTax || 0,
      }));
      if (app.items && app.items.length > 0) {
        setItems(app.items.map((item: Record<string, unknown>) => ({
          appItemId: item.id as string,
          itemName: (item.itemName as string) || "",
          taxClassificationCode: (item.taxClassificationCode as string) || "",
          taxCodeId: "",
          quantity: +(item.quantity || 1),
          unitPrice: +(item.unitPrice || 0),
          amount: +(item.amount || 0),
          taxRate: +(item.taxRate || 6),
          taxAmount: +(item.taxAmount || 0),
          totalAmount: +(item.totalAmount || 0),
        })));
      }
    }
  };

  const mut = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/pre-invoices", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, items }),
      });
      return r.json();
    },
    onSuccess: (r) => {
      if (r.success) { toast.success("预制发票已创建"); router.push("/pre-invoices"); }
      else toast.error(r.error ?? "创建失败");
    },
    onError: () => toast.error("网络错误"),
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/pre-invoices"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-xl font-semibold flex-1">生成预制发票</h1>
        <Link href="/pre-invoices"><Button variant="outline">取消</Button></Link>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending}><Save className="h-4 w-4 mr-2" />{mut.isPending ? "保存中..." : "保存"}</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Source Application */}
          <Card>
            <CardHeader><CardTitle className="text-base">导入开票申请</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>选择已审批的开票申请</Label>
                <Select value={f.applicationId} onValueChange={(v) => { setF({ ...f, applicationId: v }); loadApplication(v); }}>
                  <SelectTrigger><SelectValue>选择开票申请...</SelectValue></SelectTrigger>
                  <SelectContent>
                    {(applications ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">选择开票申请后，自动带入购买方信息和开票明细</p>
              </div>
            </CardContent>
          </Card>

          {/* Basic & Buyer Info */}
          <Card>
            <CardHeader><CardTitle className="text-base">基本信息与购买方</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>发票类型</Label>
                <Select value={f.invoiceCategory} onValueChange={(v) => setF({ ...f, invoiceCategory: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(invoiceCategoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>客户 *</Label>
                <Select value={f.customerId} onValueChange={(v) => setF({ ...f, customerId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(customers ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>税号主体</Label>
                <Select value={f.taxSubjectId} onValueChange={(v) => setF({ ...f, taxSubjectId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(taxSubjects ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>销售方名称</Label><Input value={f.sellerName} onChange={(e) => setF({ ...f, sellerName: e.target.value })} /></div>
              <div className="space-y-2"><Label>销售方税号</Label><Input value={f.sellerTaxNo} onChange={(e) => setF({ ...f, sellerTaxNo: e.target.value })} /></div>
              <div className="space-y-2"><Label>购买方名称 *</Label><Input value={f.buyerName} onChange={(e) => setF({ ...f, buyerName: e.target.value })} /></div>
              <div className="space-y-2"><Label>购买方税号</Label><Input value={f.buyerTaxNo} onChange={(e) => setF({ ...f, buyerTaxNo: e.target.value })} /></div>
              <div className="space-y-2"><Label>地址</Label><Input value={f.buyerAddress} onChange={(e) => setF({ ...f, buyerAddress: e.target.value })} /></div>
              <div className="space-y-2"><Label>电话</Label><Input value={f.buyerPhone} onChange={(e) => setF({ ...f, buyerPhone: e.target.value })} /></div>
              <div className="space-y-2"><Label>开户银行</Label><Input value={f.buyerBankName} onChange={(e) => setF({ ...f, buyerBankName: e.target.value })} /></div>
              <div className="space-y-2"><Label>银行账号</Label><Input value={f.buyerBankAccount} onChange={(e) => setF({ ...f, buyerBankAccount: e.target.value })} /></div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">开票明细</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-3.5 w-3.5 mr-1" />添加行</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-12 gap-2 px-3 py-1.5 text-xs text-muted-foreground font-medium">
                <div className="col-span-3">项目名称</div>
                <div className="col-span-2">税编/税率</div>
                <div className="col-span-1">数量</div>
                <div className="col-span-1">单价</div>
                <div className="col-span-2">金额</div>
                <div className="col-span-2">税额</div>
                <div className="col-span-1">操作</div>
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 p-3 border rounded-sm bg-muted/50 items-center">
                  <div className="col-span-3"><Input placeholder="项目名称" value={item.itemName} onChange={(e) => updateItem(i, "itemName", e.target.value)} /></div>
                  <div className="col-span-2">
                    <Select value={item.taxCodeId} onValueChange={(v) => { const tc = (taxCodes ?? []).find(t => t.id === v); updateItem(i, "taxCodeId", v); if (tc) { const m = tc.label.match(/[\d.]+/); updateItem(i, "taxRate", m ? +m[0] : 6); } }}>
                      <SelectTrigger className="text-xs"><SelectValue>选择税编</SelectValue></SelectTrigger>
                      <SelectContent>{(taxCodes ?? []).map((tc) => <SelectItem key={tc.id} value={tc.id}>{tc.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Input type="number" placeholder="数量" value={item.quantity} onChange={(e) => updateItem(i, "quantity", +e.target.value)} className="col-span-1" />
                  <Input type="number" placeholder="单价" value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", +e.target.value)} className="col-span-1" />
                  <div className="col-span-2 text-sm tabular-nums text-right px-1">¥{item.amount.toLocaleString()}</div>
                  <div className="col-span-2 text-sm tabular-nums text-right px-1">¥{item.taxAmount.toLocaleString()}</div>
                  <div className="col-span-1 flex justify-end"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(i)} disabled={items.length <= 1}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></div>
                </div>
              ))}
              <div className="flex justify-end gap-6 text-sm pt-2 border-t">
                <span>不含税: <strong className="tabular-nums">¥{f.amountWithoutTax.toLocaleString()}</strong></span>
                <span>税额: <strong className="tabular-nums">¥{f.taxAmount.toLocaleString()}</strong></span>
                <span>价税合计: <strong className="tabular-nums">¥{f.amountWithTax.toLocaleString()}</strong></span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">发票备注</CardTitle></CardHeader>
            <CardContent>
              <Textarea placeholder="按客户要求填写发票备注..." value={f.remark} onChange={(e) => setF({ ...f, remark: e.target.value })} rows={6} />
              <p className="text-xs text-muted-foreground mt-2">备注内容应在提交审核前完成核对，确保符合客户要求。</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">流程提示</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>1. 保存后预制发票状态为 <strong>草稿</strong></p>
              <p>2. 在列表页点击 <strong>提交一审</strong> 进入审核流程</p>
              <p>3. 第一次审核：仅支持 <strong>单票审核</strong></p>
              <p>4. 第二次审核：支持 <strong>批量审核</strong></p>
              <p>5. 两次审核均通过后可 <strong>推送税局</strong></p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
