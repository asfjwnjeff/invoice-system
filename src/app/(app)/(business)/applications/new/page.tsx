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
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEntitySelect } from "@/lib/hooks/use-entity-select";

const invoiceCategoryLabels: Record<string, string> = {
  DIGITAL_SPECIAL: "数电专票",
  DIGITAL_NORMAL: "数电普票",
  VAT_SPECIAL: "增值税专票",
  VAT_NORMAL: "增值税普票",
  E_NORMAL: "电子普票",
};

const currencyLabels: Record<string, string> = {
  CNY: "人民币",
  USD: "美元",
  HKD: "港币",
};

const deliveryLabels: Record<string, string> = {
  EMAIL: "邮件",
  DOWNLOAD: "下载",
  API: "接口",
};

interface Item {
  itemName: string;
  taxCode: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
}

const defaultItem: Item = {
  itemName: "",
  taxCode: "",
  quantity: 1,
  unitPrice: 0,
  amount: 0,
  taxRate: 6,
  taxAmount: 0,
};

export default function ApplicationNewPage() {
  const router = useRouter();
  const { data: customers } = useEntitySelect("/api/customers/select");
  const { data: revenueOrders } = useEntitySelect("/api/revenue-orders/select");
  const { data: settlements } = useEntitySelect("/api/settlements/select");

  const [f, setF] = useState({
    applicationNo: "APP-" + Date.now(),
    invoiceCategory: "DIGITAL_SPECIAL",
    customerId: "",
    revenueOrderId: "",
    settlementId: "",
    buyerName: "",
    buyerTaxNo: "",
    buyerAddress: "",
    buyerPhone: "",
    buyerBankName: "",
    buyerBankAccount: "",
    deliveryMethod: "EMAIL",
    recipientEmail: "",
    currency: "CNY",
    remark: "",
    amountWithoutTax: 0,
    taxAmount: 0,
    amountWithTax: 0,
  });

  const [items, setItems] = useState<Item[]>([{ ...defaultItem }]);

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
    setF((prev) => ({
      ...prev,
      amountWithoutTax: +total.toFixed(2),
      taxAmount: +totalTax.toFixed(2),
      amountWithTax: +(total + totalTax).toFixed(2),
    }));
  };

  const removeItem = (i: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, idx) => idx !== i));
    }
  };

  const mut = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, items }),
      });
      return r.json();
    },
    onSuccess: (r) => {
      if (r.success) {
        toast.success("开票申请已创建");
        router.push("/applications");
      } else {
        toast.error(r.error ?? "创建失败");
      }
    },
    onError: () => toast.error("网络错误，请重试"),
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <Link href="/applications">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold flex-1">新建开票申请</h1>
        <Link href="/applications">
          <Button variant="outline">取消</Button>
        </Link>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {mut.isPending ? "保存中..." : "保存"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>申请号</Label>
                <Input value={f.applicationNo} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>发票类型</Label>
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
                <Label>客户</Label>
                <Select
                  value={f.customerId}
                  onValueChange={(v) => setF({ ...f, customerId: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(customers ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>来源收入订单</Label>
                <Select
                  value={f.revenueOrderId}
                  onValueChange={(v) => setF({ ...f, revenueOrderId: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(revenueOrders ?? []).map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>来源结算单</Label>
                <Select
                  value={f.settlementId}
                  onValueChange={(v) => setF({ ...f, settlementId: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(settlements ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <div className="space-y-2">
                <Label>备注</Label>
                <Input
                  value={f.remark}
                  onChange={(e) => setF({ ...f, remark: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* 购买方信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">购买方信息</CardTitle>
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
                  onChange={(e) =>
                    setF({ ...f, buyerAddress: e.target.value })
                  }
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

          {/* 开票明细 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">开票明细</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                添加行
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 表头 */}
              <div className="grid grid-cols-12 gap-2 px-3 py-1.5 text-xs text-muted-foreground font-medium">
                <div className="col-span-3">项目名称</div>
                <div className="col-span-2">税收编码</div>
                <div className="col-span-1">数量</div>
                <div className="col-span-2">单价</div>
                <div className="col-span-1">税率</div>
                <div className="col-span-2">金额</div>
                <div className="col-span-1">操作</div>
              </div>
              {items.map((item, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-2 p-3 border rounded-sm bg-muted/50 items-center"
                >
                  <div className="col-span-3">
                    <Input
                      placeholder="项目名称"
                      value={item.itemName}
                      onChange={(e) =>
                        updateItem(i, "itemName", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="税编"
                      value={item.taxCode}
                      onChange={(e) =>
                        updateItem(i, "taxCode", e.target.value)
                      }
                    />
                  </div>
                  <Input
                    type="number"
                    placeholder="数量"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(i, "quantity", +e.target.value)
                    }
                    className="col-span-1"
                  />
                  <Input
                    type="number"
                    placeholder="单价"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(i, "unitPrice", +e.target.value)
                    }
                    className="col-span-2"
                  />
                  <div className="col-span-1">
                    <Input
                      type="number"
                      placeholder="税率%"
                      value={item.taxRate}
                      onChange={(e) =>
                        updateItem(i, "taxRate", +e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-2 text-sm tabular-nums text-right px-1">
                    ¥{item.amount.toLocaleString()}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeItem(i)}
                      disabled={items.length <= 1}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {/* Totals bar */}
              <div className="flex justify-end gap-6 text-sm pt-2 border-t">
                <span>
                  不含税:{" "}
                  <strong className="tabular-nums">
                    ¥{f.amountWithoutTax.toLocaleString()}
                  </strong>
                </span>
                <span>
                  税额:{" "}
                  <strong className="tabular-nums">
                    ¥{f.taxAmount.toLocaleString()}
                  </strong>
                </span>
                <span>
                  价税合计:{" "}
                  <strong className="tabular-nums">
                    ¥{f.amountWithTax.toLocaleString()}
                  </strong>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side column */}
        <div className="space-y-6">
          {/* 交付信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">交付信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>交付方式</Label>
                <Select
                  value={f.deliveryMethod}
                  onValueChange={(v) =>
                    setF({ ...f, deliveryMethod: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(deliveryLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>收件邮箱</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={f.recipientEmail}
                  onChange={(e) =>
                    setF({ ...f, recipientEmail: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* 快捷操作 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/applications" className="block">
                <Button variant="outline" className="w-full justify-start">
                  从结算单生成
                </Button>
              </Link>
              <Link href="/applications" className="block">
                <Button variant="outline" className="w-full justify-start">
                  从收入订单生成
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
