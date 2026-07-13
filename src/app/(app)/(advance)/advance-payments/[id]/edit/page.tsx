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
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { useEntitySelect } from "@/lib/hooks/use-entity-select";

const feeTypeLabels: Record<string, string> = { CUSTOMS_DUTY: "关税", IMPORT_VAT: "进口增值税", INSPECTION_FEE: "商检费", PORT_FEE: "港口费", INSURANCE: "保险费", EXPRESS_FEE: "快递费", OTHER_ADVANCE: "其他" };
const payerLabels: Record<string, string> = { COMPANY: "公司", CUSTOMER: "客户", THIRD_PARTY: "第三方" };
const invStratLabels: Record<string, string> = { NO_INVOICE: "不开票", SEPARATE_INVOICE: "代垫单独开票", MERGE_WITH_SERVICE: "与服务费合并", SERVICE_ONLY: "仅服务费", NET_AMOUNT: "差额开票", MANUAL: "手工指定" };
const collLabels: Record<string, string> = { COLLECTED: "已收款", PARTIALLY_COLLECTED: "部分收款", PENDING: "待收款" };
const woLabels: Record<string, string> = { WRITTEN_OFF: "已核销", PARTIALLY_WRITTEN: "部分核销", PENDING: "待核销" };
const advStatusLabels: Record<string, string> = { DRAFT: "草稿", PENDING_CONFIRM: "待确认", CONFIRMED: "已确认" };

export default function AdvancePaymentEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: customers } = useEntitySelect("/api/customers/select");
  const { data: bizOrders } = useEntitySelect("/api/business-orders/select");

  const [f, setF] = useState({
    advanceNo: "", customerId: "", businessOrderId: "", feeType: "CUSTOMS_DUTY", occurredDate: "", remark: "",
    originalAmount: 0, exchangeRate: 1, baseCurrencyAmount: 0, collectedAmount: 0, currency: "CNY",
    payerType: "COMPANY", invoiceStrategy: "NO_INVOICE", collectionStatus: "PENDING", writeOffStatus: "PENDING", status: "DRAFT",
    customsDeclarationId: "",
  });

  const { data: adv, isLoading } = useQuery({
    queryKey: ["advance-payment", id],
    queryFn: async () => { const r = await fetch(`/api/advance-payments/${id}`); const j = await r.json(); return j.data; },
  });

  useEffect(() => {
    if (adv) {
      setF({
        advanceNo: adv.advanceNo ?? "", customerId: adv.customerId ?? "", businessOrderId: adv.businessOrderId ?? "",
        feeType: adv.feeType ?? "CUSTOMS_DUTY", occurredDate: adv.occurredDate?.slice(0, 10) ?? "", remark: adv.remark ?? "",
        originalAmount: Number(adv.originalAmount ?? 0), exchangeRate: Number(adv.exchangeRate ?? 1),
        baseCurrencyAmount: Number(adv.baseCurrencyAmount ?? 0), collectedAmount: Number(adv.collectedAmount ?? 0),
        currency: adv.currency ?? "CNY", payerType: adv.payerType ?? "COMPANY", invoiceStrategy: adv.invoiceStrategy ?? "NO_INVOICE",
        collectionStatus: adv.collectionStatus ?? "PENDING", writeOffStatus: adv.writeOffStatus ?? "PENDING",
        status: adv.status ?? "DRAFT", customsDeclarationId: adv.customsDeclarationId ?? "",
      });
    }
  }, [adv]);

  const updateExchange = (orig: number, rate: number) => {
    setF(prev => ({ ...prev, originalAmount: orig, exchangeRate: rate, baseCurrencyAmount: +(orig * rate).toFixed(2) }));
  };

  const mut = useMutation({
    mutationFn: async () => { const r = await fetch(`/api/advance-payments/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); return r.json(); },
    onSuccess: (r) => { if (r.success) { toast.success("已保存"); qc.invalidateQueries({ queryKey: ["advance-payment"] }); qc.invalidateQueries({ queryKey: ["advance-payments"] }); router.push(`/advance-payments/${id}`); } else toast.error(r.error ?? "保存失败"); },
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">加载中...</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href={`/advance-payments/${id}`}><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-xl font-semibold flex-1">编辑代垫单</h1>
        <Link href={`/advance-payments/${id}`}><Button variant="outline">取消</Button></Link>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending}><Save className="h-4 w-4 mr-2" />{mut.isPending ? "保存中..." : "保存"}</Button>
      </div>

      <Card><CardHeader><CardTitle className="text-base">基本信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>代垫单号</Label><Input value={f.advanceNo} onChange={e => setF({ ...f, advanceNo: e.target.value })} /></div>
          <div className="space-y-2"><Label>费用类型</Label>
            <Select value={f.feeType} onValueChange={v => setF({ ...f, feeType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(feeTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>客户</Label>
            <Select value={f.customerId} onValueChange={v => setF({ ...f, customerId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(customers ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>关联业务订单</Label>
            <Select value={f.businessOrderId} onValueChange={v => setF({ ...f, businessOrderId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(bizOrders ?? []).map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>发生日期</Label><Input type="date" value={f.occurredDate} onChange={e => setF({ ...f, occurredDate: e.target.value })} /></div>
          <div className="col-span-2 space-y-2"><Label>备注</Label><Input value={f.remark} onChange={e => setF({ ...f, remark: e.target.value })} /></div>
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="text-base">金额信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>原币金额</Label><Input type="number" value={f.originalAmount} onChange={e => updateExchange(+e.target.value, f.exchangeRate)} /></div>
          <div className="space-y-2"><Label>汇率</Label><Input type="number" value={f.exchangeRate} onChange={e => updateExchange(f.originalAmount, +e.target.value)} /></div>
          <div className="space-y-2"><Label>本位币金额</Label><Input type="number" value={f.baseCurrencyAmount} disabled className="bg-muted" /></div>
          <div className="space-y-2"><Label>币种</Label>
            <Select value={f.currency} onValueChange={v => setF({ ...f, currency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="CNY">人民币</SelectItem><SelectItem value="USD">美元</SelectItem><SelectItem value="HKD">港币</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>已收金额</Label><Input type="number" value={f.collectedAmount} onChange={e => setF({ ...f, collectedAmount: +e.target.value })} /></div>
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="text-base">状态配置</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>付款方</Label>
            <Select value={f.payerType} onValueChange={v => setF({ ...f, payerType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(payerLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>开票策略</Label>
            <Select value={f.invoiceStrategy} onValueChange={v => setF({ ...f, invoiceStrategy: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(invStratLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>状态</Label>
            <Select value={f.status} onValueChange={v => setF({ ...f, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(advStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>收款状态</Label>
            <Select value={f.collectionStatus} onValueChange={v => setF({ ...f, collectionStatus: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(collLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>核销状态</Label>
            <Select value={f.writeOffStatus} onValueChange={v => setF({ ...f, writeOffStatus: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(woLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>报关单号</Label><Input value={f.customsDeclarationId} onChange={e => setF({ ...f, customsDeclarationId: e.target.value })} /></div>
        </CardContent>
      </Card>
    </div>
  );
}
