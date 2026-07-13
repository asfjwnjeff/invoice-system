"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const invoiceCategoryLabels: Record<string, string> = {
  DIGITAL_SPECIAL: "数电专票",
  DIGITAL_NORMAL: "数电普票",
  VAT_SPECIAL: "增值税专票",
  VAT_NORMAL: "增值税普票",
  E_NORMAL: "电子普票",
};

const invoicePoolLabels: Record<string, string> = {
  OUTPUT: "销项",
  INPUT: "进项",
};

const currencyLabels: Record<string, string> = {
  CNY: "人民币",
  USD: "美元",
  HKD: "港币",
};

const deliveryStatusLabels: Record<string, string> = {
  PENDING: "待交付",
  DELIVERED: "已交付",
};

const verifyStatusLabels: Record<string, string> = {
  PENDING: "待查验",
  VERIFIED: "已查验",
};

const entryMethodLabels: Record<string, string> = {
  MANUAL: "手工录入",
  OCR: "OCR识别",
  IMPORT: "批量导入",
};

export default function InvoiceNewPage() {
  const router = useRouter();

  const [f, setF] = useState({
    invoiceNo: "",
    invoiceCode: "",
    invoiceCategory: "DIGITAL_SPECIAL",
    invoicePool: "OUTPUT",
    sellerName: "",
    sellerTaxNo: "",
    issueDate: "",
    buyerName: "",
    buyerTaxNo: "",
    buyerAddress: "",
    buyerPhone: "",
    buyerBankName: "",
    buyerBankAccount: "",
    amountWithoutTax: 0,
    taxRate: 13,
    taxAmount: 0,
    amountWithTax: 0,
    currency: "CNY",
    deliveryStatus: "PENDING",
    verifyStatus: "PENDING",
    entryMethod: "MANUAL",
  });

  const updateAmount = (amt: number, rate: number) => {
    setF((prev) => ({
      ...prev,
      amountWithoutTax: amt,
      taxRate: rate,
      taxAmount: +(amt * rate / 100).toFixed(2),
      amountWithTax: +(amt * (1 + rate / 100)).toFixed(2),
    }));
  };

  const mut = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      return r.json();
    },
    onSuccess: (r) => {
      if (r.success) {
        toast.success("发票已创建");
        router.push("/invoices");
      } else {
        toast.error(r.error ?? "创建失败");
      }
    },
    onError: () => toast.error("网络错误，请重试"),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <Link href="/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold flex-1">新增发票</h1>
        <Link href="/invoices">
          <Button variant="outline">取消</Button>
        </Link>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {mut.isPending ? "保存中..." : "保存"}
        </Button>
      </div>

      {/* 发票信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">发票信息</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>发票号码 *</Label>
            <Input
              value={f.invoiceNo}
              onChange={(e) => setF({ ...f, invoiceNo: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>发票代码</Label>
            <Input
              value={f.invoiceCode}
              onChange={(e) => setF({ ...f, invoiceCode: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>票种</Label>
            <Select
              value={f.invoiceCategory}
              onValueChange={(v) => setF({ ...f, invoiceCategory: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(invoiceCategoryLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>所属票池</Label>
            <Select
              value={f.invoicePool}
              onValueChange={(v) => setF({ ...f, invoicePool: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(invoicePoolLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>销售方名称</Label>
            <Input
              value={f.sellerName}
              onChange={(e) => setF({ ...f, sellerName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>销售方税号</Label>
            <Input
              value={f.sellerTaxNo}
              onChange={(e) => setF({ ...f, sellerTaxNo: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>开票日期</Label>
            <Input
              type="date"
              value={f.issueDate}
              onChange={(e) => setF({ ...f, issueDate: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* 购买方 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">购买方</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>购买方名称 *</Label>
            <Input
              value={f.buyerName}
              onChange={(e) => setF({ ...f, buyerName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>购买方税号</Label>
            <Input
              value={f.buyerTaxNo}
              onChange={(e) => setF({ ...f, buyerTaxNo: e.target.value })}
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>地址</Label>
            <Input
              value={f.buyerAddress}
              onChange={(e) => setF({ ...f, buyerAddress: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>电话</Label>
            <Input
              value={f.buyerPhone}
              onChange={(e) => setF({ ...f, buyerPhone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>开户银行</Label>
            <Input
              value={f.buyerBankName}
              onChange={(e) =>
                setF({ ...f, buyerBankName: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>银行账号</Label>
            <Input
              value={f.buyerBankAccount}
              onChange={(e) =>
                setF({ ...f, buyerBankAccount: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 金额 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">金额</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>不含税金额</Label>
            <Input
              type="number"
              value={f.amountWithoutTax}
              onChange={(e) => updateAmount(+e.target.value, f.taxRate)}
            />
          </div>
          <div className="space-y-2">
            <Label>税率 %</Label>
            <Input
              type="number"
              value={f.taxRate}
              onChange={(e) =>
                updateAmount(f.amountWithoutTax, +e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>税额</Label>
            <Input
              type="number"
              value={f.taxAmount}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label>价税合计</Label>
            <Input
              type="number"
              value={f.amountWithTax}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label>币种</Label>
            <Select
              value={f.currency}
              onValueChange={(v) => setF({ ...f, currency: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(currencyLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">状态</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>交付状态</Label>
            <Select
              value={f.deliveryStatus}
              onValueChange={(v) => setF({ ...f, deliveryStatus: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(deliveryStatusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>查验状态</Label>
            <Select
              value={f.verifyStatus}
              onValueChange={(v) => setF({ ...f, verifyStatus: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(verifyStatusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>录入方式</Label>
            <Select
              value={f.entryMethod}
              onValueChange={(v) => setF({ ...f, entryMethod: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(entryMethodLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
