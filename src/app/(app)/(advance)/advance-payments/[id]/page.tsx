"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";

const feeTypeLabels: Record<string, string> = { CUSTOMS_DUTY: "关税", IMPORT_VAT: "进口增值税", INSPECTION_FEE: "商检费", PORT_FEE: "港口费", INSURANCE: "保险费", EXPRESS_FEE: "快递费", OTHER_ADVANCE: "其他" };
const payerLabels: Record<string, string> = { COMPANY: "公司", CUSTOMER: "客户", THIRD_PARTY: "第三方" };
const invStratLabels: Record<string, string> = { NO_INVOICE: "不开票", SEPARATE_INVOICE: "代垫单独开票", MERGE_WITH_SERVICE: "与服务费合并", SERVICE_ONLY: "仅服务费", NET_AMOUNT: "差额开票", MANUAL: "手工指定" };
const collLabels: Record<string, string> = { COLLECTED: "已收款", PARTIALLY_COLLECTED: "部分收款", PENDING: "待收款" };
const woLabels: Record<string, string> = { WRITTEN_OFF: "已核销", PARTIALLY_WRITTEN: "部分核销", PENDING: "待核销" };
const currencyLabels: Record<string, string> = { CNY: "人民币", USD: "美元", HKD: "港币" };

export default function AdvancePaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: adv, isLoading } = useQuery({
    queryKey: ["advance-payment", id],
    queryFn: async () => { const r = await fetch(`/api/advance-payments/${id}`); const j = await r.json(); return j.data; },
  });
  if (isLoading) return <div className="p-8 text-muted-foreground">加载中...</div>;
  if (!adv) return <div className="p-8 text-destructive">代垫单不存在</div>;

  const sv = (s: string): "success"|"warning"|"danger"|"neutral" =>
    s === "COLLECTED" || s === "WRITTEN_OFF" ? "success" : s === "PARTIALLY_COLLECTED" || s === "PARTIALLY_WRITTEN" ? "warning" : "neutral";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/advance-payments"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3"><h1 className="text-xl font-semibold">{adv.advanceNo}</h1><StatusBadge status={collLabels[adv.collectionStatus] ?? adv.collectionStatus} variant={sv(adv.collectionStatus)} /></div>
          <p className="text-sm text-muted-foreground">{feeTypeLabels[adv.feeType] ?? adv.feeType}</p>
        </div>
        <Link href={`/advance-payments/${adv.id}/edit`}><Button variant="outline" size="sm"><Pencil className="h-3.5 w-3.5 mr-1" />编辑</Button></Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle className="text-base">基本信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">代垫单号</span><p className="font-medium">{adv.advanceNo}</p></div>
            <div><span className="text-muted-foreground">费用类型</span><p>{feeTypeLabels[adv.feeType] ?? adv.feeType}</p></div>
            <div><span className="text-muted-foreground">客户</span><p>{adv.customer?.name ? <Link href={`/customers`} className="text-accent hover:underline">{adv.customer.name}</Link> : "-"}</p></div>
            <div><span className="text-muted-foreground">关联业务订单</span><p>{adv.businessOrder?.orderNo ? <Link href={`/business-orders/${adv.businessOrderId}`} className="text-accent hover:underline">{adv.businessOrder.orderNo}</Link> : "-"}</p></div>
            <div><span className="text-muted-foreground">发生日期</span><p>{adv.occurredDate?.slice(0, 10) ?? "-"}</p></div>
            <div><span className="text-muted-foreground">币种</span><p>{currencyLabels[adv.currency] ?? adv.currency}</p></div>
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="text-base">金额信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">原币金额</span><p className="tabular-nums font-medium">¥{adv.originalAmount?.toLocaleString() ?? "0"}</p></div>
            <div><span className="text-muted-foreground">汇率</span><p>{adv.exchangeRate ?? "1"}</p></div>
            <div><span className="text-muted-foreground">本位币金额</span><p className="tabular-nums">¥{adv.baseCurrencyAmount?.toLocaleString() ?? "0"}</p></div>
            <div><span className="text-muted-foreground">已收金额</span><p className="tabular-nums">¥{adv.collectedAmount?.toLocaleString() ?? "0"}</p></div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">代垫状态</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">付款方</span><p>{payerLabels[adv.payerType] ?? adv.payerType}</p></div>
            <div><span className="text-muted-foreground">开票策略</span><p>{invStratLabels[adv.invoiceStrategy] ?? adv.invoiceStrategy}</p></div>
            <div><span className="text-muted-foreground">收款状态</span><p><StatusBadge status={collLabels[adv.collectionStatus] ?? adv.collectionStatus} variant={sv(adv.collectionStatus)} /></p></div>
            <div><span className="text-muted-foreground">核销状态</span><p><StatusBadge status={woLabels[adv.writeOffStatus] ?? adv.writeOffStatus} variant={sv(adv.writeOffStatus)} /></p></div>
            <div><span className="text-muted-foreground">已开票</span><p>{adv.isInvoiced ? "是" : "否"}</p></div>
            <div><span className="text-muted-foreground">已入结算</span><p>{adv.isInSettlement ? "是" : "否"}</p></div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">关联信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">报关单号</span><p>{adv.customsDeclarationId || "-"}</p></div>
            <div><span className="text-muted-foreground">关联发票</span><p>{adv.relatedInvoiceId || "-"}</p></div>
            <div className="col-span-2"><span className="text-muted-foreground">备注</span><p>{adv.remark || "-"}</p></div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">时间信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">创建时间</span><p>{adv.createdAt ? new Date(adv.createdAt).toLocaleString("zh-CN") : "-"}</p></div>
            <div><span className="text-muted-foreground">更新时间</span><p>{adv.updatedAt ? new Date(adv.updatedAt).toLocaleString("zh-CN") : "-"}</p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
