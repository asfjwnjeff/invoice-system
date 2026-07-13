"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const typeLabels: Record<string, string> = { CUSTOMER_RECEIVABLE: "应收结算", SUPPLIER_PAYABLE: "应付结算" };
const statusLabels: Record<string, string> = { DRAFT: "草稿", CONFIRMED: "已确认", SETTLED: "已结清" };

export default function SettlementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: stl, isLoading } = useQuery({
    queryKey: ["settlement", id],
    queryFn: async () => { const r = await fetch(`/api/settlements/${id}`); const j = await r.json(); return j.data; },
  });
  if (isLoading) return <div className="p-8 text-muted-foreground">加载中...</div>;
  if (!stl) return <div className="p-8 text-destructive">结算单不存在</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/customer-settlements"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3"><h1 className="text-xl font-semibold">{stl.settlementNo}</h1><StatusBadge status={statusLabels[stl.status] ?? stl.status} variant={stl.status === "SETTLED" || stl.status === "CONFIRMED" ? "success" : "neutral"} /></div>
          <p className="text-sm text-muted-foreground">{stl.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle className="text-base">基本信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">结算单号</span><p className="font-medium">{stl.settlementNo}</p></div>
            <div><span className="text-muted-foreground">类型</span><p>{typeLabels[stl.settlementType] ?? stl.settlementType}</p></div>
            <div className="col-span-2"><span className="text-muted-foreground">标题</span><p>{stl.title}</p></div>
            <div><span className="text-muted-foreground">客户</span><p>{stl.customer?.name ?? "-"}</p></div>
            <div><span className="text-muted-foreground">关联收入订单</span><p>{stl.revenueOrder?.orderNo ? <Link href={`/revenue-orders/${stl.revenueOrderId}`} className="text-accent hover:underline">{stl.revenueOrder.orderNo}</Link> : "-"}</p></div>
            <div><span className="text-muted-foreground">期间开始</span><p>{stl.periodStart?.slice(0, 10) ?? "-"}</p></div>
            <div><span className="text-muted-foreground">期间结束</span><p>{stl.periodEnd?.slice(0, 10) ?? "-"}</p></div>
            {stl.remark && <div className="col-span-2"><span className="text-muted-foreground">备注</span><p>{stl.remark}</p></div>}
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="text-base">金额信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 text-sm">
            <div className="text-center"><span className="text-muted-foreground">结算总额</span><p className="text-2xl font-semibold tabular-nums">¥{stl.totalAmount?.toLocaleString() ?? "0"}</p></div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-muted-foreground">已开票</span><p className="tabular-nums">¥{stl.invoicedAmount?.toLocaleString() ?? "0"}</p></div>
              <div><span className="text-muted-foreground">已收款</span><p className="tabular-nums">¥{stl.receivedAmount?.toLocaleString() ?? "0"}</p></div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">时间信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">创建时间</span><p>{stl.createdAt ? new Date(stl.createdAt).toLocaleString("zh-CN") : "-"}</p></div>
            <div><span className="text-muted-foreground">更新时间</span><p>{stl.updatedAt ? new Date(stl.updatedAt).toLocaleString("zh-CN") : "-"}</p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
