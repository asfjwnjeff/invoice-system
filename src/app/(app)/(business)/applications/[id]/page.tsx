"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ApplicationDetailPage() {
  const params = useParams();
  const { data, isLoading } = useQuery({ queryKey: ["application", params.id], queryFn: async () => { const r = await fetch(`/api/applications/${params.id}`); return (await r.json()).data; } });

  if (isLoading) return <div className="p-6 text-muted-foreground">加载中...</div>;
  if (!data) return <div className="p-6 text-muted-foreground">未找到申请</div>;

  const statusVariant = (s: string): "success"|"warning"|"danger"|"neutral" => s === "ISSUED" ? "success" : s === "PENDING_APPROVAL" ? "warning" : s === "REJECTED" ? "danger" : "neutral";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-semibold">开票申请详情</h1><p className="text-sm text-muted-foreground">{data.appNo}</p></div>
        <StatusBadge status={data.status} variant={statusVariant(data.status)} />
      </div>

      <Card><CardHeader><CardTitle className="text-base">基本信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">购买方:</span> {data.buyerName}</div>
          <div><span className="text-muted-foreground">购买方税号:</span> {data.buyerTaxNo || "-"}</div>
          <div><span className="text-muted-foreground">发票类型:</span> {data.invoiceType}</div>
          <div><span className="text-muted-foreground">不含税金额:</span> ¥{(data.amountWithoutTax ?? 0).toLocaleString()}</div>
          <div><span className="text-muted-foreground">税额:</span> ¥{(data.taxAmount ?? 0).toLocaleString()}</div>
          <div><span className="text-muted-foreground">价税合计:</span> <strong>¥{(data.amountWithTax ?? 0).toLocaleString()}</strong></div>
          <div><span className="text-muted-foreground">发票号码:</span> {data.invoiceNo || "未开具"}</div>
          <div><span className="text-muted-foreground">税务流水号:</span> {data.taxFlowNo || "-"}</div>
        </CardContent>
      </Card>

      {data.items?.length > 0 && (
        <Card><CardHeader><CardTitle className="text-base">开票明细</CardTitle></CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow className="hover:bg-transparent"><TableHead className="h-10 text-xs uppercase">项目</TableHead><TableHead className="h-10 text-xs uppercase text-right">数量</TableHead><TableHead className="h-10 text-xs uppercase text-right">单价</TableHead><TableHead className="h-10 text-xs uppercase text-right">金额</TableHead><TableHead className="h-10 text-xs uppercase text-right">税率</TableHead><TableHead className="h-10 text-xs uppercase text-right">税额</TableHead></TableRow></TableHeader>
              <TableBody>{data.items.map((item: { id: string; itemName: string; quantity: number; unitPrice: number; amount: number; taxRate: number; taxAmount: number }) => (
                <TableRow key={item.id} className="h-11"><TableCell>{item.itemName}</TableCell><TableCell className="text-right tabular-nums">{item.quantity}</TableCell><TableCell className="text-right tabular-nums">¥{item.unitPrice.toLocaleString()}</TableCell><TableCell className="text-right tabular-nums">¥{item.amount.toLocaleString()}</TableCell><TableCell className="text-right tabular-nums">{item.taxRate}%</TableCell><TableCell className="text-right tabular-nums">¥{item.taxAmount.toLocaleString()}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
