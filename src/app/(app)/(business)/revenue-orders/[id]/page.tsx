"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const invLabels: Record<string, string> = { NOT_INVOICED: "未开票", PARTIALLY: "部分开票", INVOICED: "已开票" };
const currencyLabels: Record<string, string> = { CNY: "人民币", USD: "美元", HKD: "港币" };

export default function RevenueOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: ro, isLoading } = useQuery({
    queryKey: ["revenue-order", id],
    queryFn: async () => { const r = await fetch(`/api/revenue-orders/${id}`); const j = await r.json(); return j.data; },
  });
  if (isLoading) return <div className="p-8 text-muted-foreground">加载中...</div>;
  if (!ro) return <div className="p-8 text-destructive">收入订单不存在</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/revenue-orders"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3"><h1 className="text-xl font-semibold">{ro.orderNo}</h1><StatusBadge status={invLabels[ro.invoiceStatus] ?? ro.invoiceStatus} variant={ro.invoiceStatus === "INVOICED" ? "success" : "warning"} /></div>
          <p className="text-sm text-muted-foreground">{ro.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle className="text-base">基本信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2"><span className="text-muted-foreground">订单号</span><p className="font-medium">{ro.orderNo}</p></div>
            <div className="col-span-2"><span className="text-muted-foreground">标题</span><p>{ro.title}</p></div>
            <div><span className="text-muted-foreground">关联业务订单</span><p>{ro.businessOrder?.orderNo ? <Link href={`/business-orders/${ro.businessOrderId}`} className="text-accent hover:underline">{ro.businessOrder.orderNo}</Link> : "-"}</p></div>
            <div><span className="text-muted-foreground">客户</span><p>{ro.customer?.name ?? "-"}</p></div>
            <div><span className="text-muted-foreground">币种</span><p>{currencyLabels[ro.currency] ?? ro.currency}</p></div>
            <div><span className="text-muted-foreground">开始日期</span><p>{ro.startDate?.slice(0, 10) ?? "-"}</p></div>
            <div><span className="text-muted-foreground">结束日期</span><p>{ro.endDate?.slice(0, 10) ?? "-"}</p></div>
            {ro.remark && <div className="col-span-2"><span className="text-muted-foreground">备注</span><p>{ro.remark}</p></div>}
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="text-base">金额信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 text-sm">
            <div className="text-center"><span className="text-muted-foreground">收入总额</span><p className="text-2xl font-semibold tabular-nums">¥{ro.totalRevenueAmount?.toLocaleString() ?? "0"}</p></div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-muted-foreground">已开票金额</span><p className="tabular-nums">¥{ro.invoicedAmount?.toLocaleString() ?? "0"}</p></div>
              <div><span className="text-muted-foreground">可开票余额</span><p className="tabular-nums text-accent">¥{ro.availableAmount?.toLocaleString() ?? "0"}</p></div>
            </div>
            <div><span className="text-muted-foreground">开票状态</span><p><StatusBadge status={invLabels[ro.invoiceStatus] ?? ro.invoiceStatus} variant={ro.invoiceStatus === "INVOICED" ? "success" : "warning"} /></p></div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">时间信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">创建时间</span><p>{ro.createdAt ? new Date(ro.createdAt).toLocaleString("zh-CN") : "-"}</p></div>
            <div><span className="text-muted-foreground">更新时间</span><p>{ro.updatedAt ? new Date(ro.updatedAt).toLocaleString("zh-CN") : "-"}</p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
