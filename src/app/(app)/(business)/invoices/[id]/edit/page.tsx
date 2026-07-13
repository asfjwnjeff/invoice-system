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

const catOptions = ["DIGITAL_SPECIAL","DIGITAL_NORMAL","VAT_SPECIAL","VAT_NORMAL","E_NORMAL"];
const catLabels: Record<string, string> = { DIGITAL_SPECIAL:"数电专票", DIGITAL_NORMAL:"数电普票", VAT_SPECIAL:"增值税专票", VAT_NORMAL:"增值税普票", E_NORMAL:"电子普票" };
const poolOptions = ["OUTPUT","INPUT"];

export default function InvoiceEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [f, setF] = useState({
    invoiceNo: "", invoiceCode: "", invoiceCategory: "DIGITAL_SPECIAL", invoicePool: "OUTPUT",
    sellerName: "", sellerTaxNo: "", buyerName: "", buyerTaxNo: "",
    buyerAddress: "", buyerPhone: "", buyerBankName: "", buyerBankAccount: "",
    issueDate: "", amountWithoutTax: 0, taxAmount: 0, amountWithTax: 0,
    currency: "CNY", remark: "",
    deliveryStatus: "PENDING", verifyStatus: "PENDING", usageStatus: "UNUSED",
    pushStatus: "PENDING", headerValidationStatus: "PENDING",
    accountStatus: "UNACCOUNTED", archiveStatus: "UNARCHIVED",
    entryMethod: "MANUAL", isFromTaxAuthority: false,
  });

  const { data: inv, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => { const r = await fetch(`/api/invoices/${id}`); const j = await r.json(); return j.data; },
  });

  useEffect(() => {
    if (!inv) return;
    setF({
      invoiceNo: inv.invoiceNo ?? "", invoiceCode: inv.invoiceCode ?? "",
      invoiceCategory: inv.invoiceCategory ?? "DIGITAL_SPECIAL", invoicePool: inv.invoicePool ?? "OUTPUT",
      sellerName: inv.sellerName ?? "", sellerTaxNo: inv.sellerTaxNo ?? "",
      buyerName: inv.buyerName ?? "", buyerTaxNo: inv.buyerTaxNo ?? "",
      buyerAddress: inv.buyerAddress ?? "", buyerPhone: inv.buyerPhone ?? "",
      buyerBankName: inv.buyerBankName ?? "", buyerBankAccount: inv.buyerBankAccount ?? "",
      issueDate: inv.issueDate?.slice(0, 10) ?? "",
      amountWithoutTax: Number(inv.amountWithoutTax ?? 0), taxAmount: Number(inv.taxAmount ?? 0),
      amountWithTax: Number(inv.amountWithTax ?? 0), currency: inv.currency ?? "CNY",
      remark: inv.remark ?? "",
      deliveryStatus: inv.deliveryStatus ?? "PENDING", verifyStatus: inv.verifyStatus ?? "PENDING",
      usageStatus: inv.usageStatus ?? "UNUSED", pushStatus: inv.pushStatus ?? "PENDING",
      headerValidationStatus: inv.headerValidationStatus ?? "PENDING",
      accountStatus: inv.accountStatus ?? "UNACCOUNTED", archiveStatus: inv.archiveStatus ?? "UNARCHIVED",
      entryMethod: inv.entryMethod ?? "MANUAL", isFromTaxAuthority: inv.isFromTaxAuthority ?? false,
    });
  }, [inv]);

  const mut = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/invoices/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, issueDate: f.issueDate ? new Date(f.issueDate).toISOString() : null }) });
      return r.json();
    },
    onSuccess: (r) => {
      if (r.success) { toast.success("已保存"); qc.invalidateQueries({ queryKey: ["invoice"] }); qc.invalidateQueries({ queryKey: ["invoices"] }); router.push(`/invoices/${id}`); }
      else toast.error(r.error ?? "保存失败");
    },
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">加载中...</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 页头 */}
      <div className="flex items-center gap-3">
        <Link href={`/invoices/${id}`}><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-xl font-semibold flex-1">编辑销项发票</h1>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending}><Save className="h-4 w-4 mr-2" />{mut.isPending ? "保存中..." : "保存"}</Button>
      </div>

      {/* 发票信息 */}
      <Card>
        <CardHeader><CardTitle className="text-base">发票信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>发票号码 *</Label><Input value={f.invoiceNo} onChange={e => setF({...f, invoiceNo: e.target.value})} /></div>
          <div className="space-y-2"><Label>发票代码</Label><Input value={f.invoiceCode} onChange={e => setF({...f, invoiceCode: e.target.value})} /></div>
          <div className="space-y-2"><Label>票种</Label>
            <Select value={f.invoiceCategory} onValueChange={v => setF({...f, invoiceCategory: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{catOptions.map(t => <SelectItem key={t} value={t}>{catLabels[t]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>所属票池</Label>
            <Select value={f.invoicePool} onValueChange={v => setF({...f, invoicePool: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{poolOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>销售方名称 *</Label><Input value={f.sellerName} onChange={e => setF({...f, sellerName: e.target.value})} /></div>
          <div className="space-y-2"><Label>销售方税号 *</Label><Input value={f.sellerTaxNo} onChange={e => setF({...f, sellerTaxNo: e.target.value})} /></div>
          <div className="space-y-2"><Label>开票日期</Label><Input type="date" value={f.issueDate} onChange={e => setF({...f, issueDate: e.target.value})} /></div>
          <div className="space-y-2"><Label>录入方式</Label>
            <Select value={f.entryMethod} onValueChange={v => setF({...f, entryMethod: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MANUAL">手工录入</SelectItem>
                <SelectItem value="OCR">OCR识别</SelectItem>
                <SelectItem value="IMPORT">批量导入</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Checkbox id="isTax" checked={f.isFromTaxAuthority} onCheckedChange={v => setF({...f, isFromTaxAuthority: !!v})} />
            <Label htmlFor="isTax" className="cursor-pointer">税局来源</Label>
          </div>
        </CardContent>
      </Card>

      {/* 购买方信息 */}
      <Card>
        <CardHeader><CardTitle className="text-base">购买方信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>购买方名称 *</Label><Input value={f.buyerName} onChange={e => setF({...f, buyerName: e.target.value})} /></div>
          <div className="space-y-2"><Label>购买方税号</Label><Input value={f.buyerTaxNo} onChange={e => setF({...f, buyerTaxNo: e.target.value})} /></div>
          <div className="space-y-2"><Label>地址</Label><Input value={f.buyerAddress} onChange={e => setF({...f, buyerAddress: e.target.value})} /></div>
          <div className="space-y-2"><Label>电话</Label><Input value={f.buyerPhone} onChange={e => setF({...f, buyerPhone: e.target.value})} /></div>
          <div className="space-y-2"><Label>开户行</Label><Input value={f.buyerBankName} onChange={e => setF({...f, buyerBankName: e.target.value})} /></div>
          <div className="space-y-2"><Label>银行账号</Label><Input value={f.buyerBankAccount} onChange={e => setF({...f, buyerBankAccount: e.target.value})} /></div>
        </CardContent>
      </Card>

      {/* 金额信息 */}
      <Card>
        <CardHeader><CardTitle className="text-base">金额信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>不含税金额</Label><Input type="number" value={f.amountWithoutTax} onChange={e => setF({...f, amountWithoutTax: +e.target.value})} /></div>
          <div className="space-y-2"><Label>税额</Label><Input type="number" value={f.taxAmount} onChange={e => setF({...f, taxAmount: +e.target.value})} /></div>
          <div className="space-y-2"><Label>价税合计</Label><Input type="number" value={f.amountWithTax} onChange={e => setF({...f, amountWithTax: +e.target.value})} /></div>
          <div className="space-y-2"><Label>币种</Label>
            <Select value={f.currency} onValueChange={v => setF({...f, currency: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CNY">人民币</SelectItem>
                <SelectItem value="USD">美元</SelectItem>
                <SelectItem value="HKD">港币</SelectItem>
                <SelectItem value="EUR">欧元</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-2"><Label>备注</Label><Input value={f.remark} onChange={e => setF({...f, remark: e.target.value})} /></div>
        </CardContent>
      </Card>

      {/* 状态配置 */}
      <Card>
        <CardHeader><CardTitle className="text-base">状态配置</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2"><Label>交付状态</Label>
            <Select value={f.deliveryStatus} onValueChange={v => setF({...f, deliveryStatus: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">待交付</SelectItem>
                <SelectItem value="DELIVERED">已交付</SelectItem>
                <SelectItem value="FAILED">交付失败</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>查验状态</Label>
            <Select value={f.verifyStatus} onValueChange={v => setF({...f, verifyStatus: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">待查验</SelectItem>
                <SelectItem value="VERIFIED">已查验</SelectItem>
                <SelectItem value="VERIFY_FAILED">查验失败</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>使用状态</Label>
            <Select value={f.usageStatus} onValueChange={v => setF({...f, usageStatus: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="UNUSED">未使用</SelectItem>
                <SelectItem value="USED">已使用</SelectItem>
                <SelectItem value="RED_FLUSHED">已红冲</SelectItem>
                <SelectItem value="VOIDED">已作废</SelectItem>
                <SelectItem value="ARCHIVED">已归档</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>推送状态</Label>
            <Select value={f.pushStatus} onValueChange={v => setF({...f, pushStatus: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">待推送</SelectItem>
                <SelectItem value="PUSHED">已推送</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>抬头校验</Label>
            <Select value={f.headerValidationStatus} onValueChange={v => setF({...f, headerValidationStatus: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">待校验</SelectItem>
                <SelectItem value="VALIDATED">已校验</SelectItem>
                <SelectItem value="FAILED">校验失败</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>入账状态</Label>
            <Select value={f.accountStatus} onValueChange={v => setF({...f, accountStatus: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="UNACCOUNTED">未入账</SelectItem>
                <SelectItem value="ACCOUNTED">已入账</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>归档状态</Label>
            <Select value={f.archiveStatus} onValueChange={v => setF({...f, archiveStatus: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="UNARCHIVED">未归档</SelectItem>
                <SelectItem value="ARCHIVED">已归档</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
