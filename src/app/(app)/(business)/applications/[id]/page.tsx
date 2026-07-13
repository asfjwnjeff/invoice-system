"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Pencil } from "lucide-react";

const invoiceCategoryLabels: Record<string, string> = { DIGITAL_SPECIAL: "数电专票", DIGITAL_NORMAL: "数电普票", VAT_SPECIAL: "增值税专票", VAT_NORMAL: "增值税普票", E_NORMAL: "电子普票" };
const appStatusLabels: Record<string, string> = { DRAFT: "草稿", PENDING_APPROVAL: "待审批", APPROVED: "已审批", REJECTED: "已驳回", ISSUED: "已开票" };
const delLabels: Record<string, string> = { EMAIL: "邮件", DOWNLOAD: "下载", API: "接口" };
const sourceLabels: Record<string, string> = { SETTLEMENT: "结算单", REVENUE_ORDER: "收入订单", MANUAL: "手工", DIRECT: "直接开票" };

export default function ApplicationDetailPage() {
  const params = useParams();
  const { data, isLoading } = useQuery({ queryKey: ["application", params.id], queryFn: async () => { const r = await fetch(`/api/applications/${params.id}`); return (await r.json()).data; } });

  if (isLoading) return <div className="p-6 text-muted-foreground">加载中...</div>;
  if (!data) return <div className="p-6 text-muted-foreground">未找到申请</div>;

  const statusVariant = (s: string): "success"|"warning"|"danger"|"neutral" => s === "ISSUED" ? "success" : s === "PENDING_APPROVAL" ? "warning" : s === "REJECTED" ? "danger" : "neutral";
  const items = (data.items as Record<string, unknown>[]) ?? [];

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-center gap-3">
        <Link href="/applications"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1"><h1 className="text-xl font-semibold">开票申请详情</h1><p className="text-sm text-muted-foreground">{data.applicationNo ?? data.appNo}</p></div>
        <StatusBadge status={appStatusLabels[data.status] ?? data.status} variant={statusVariant(data.status)} />
        {data.status === "DRAFT" && <Link href={`/applications/${params.id}/edit`}><Button variant="outline" size="sm"><Pencil className="h-3.5 w-3.5 mr-1" />编辑</Button></Link>}
      </div>

      {/* 基本信息 */}
      <Card><CardHeader><CardTitle className="text-base">基本信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">申请号</span><p className="font-medium">{data.applicationNo ?? data.appNo}</p></div>
          <div><span className="text-muted-foreground">发票类型</span><p>{invoiceCategoryLabels[data.invoiceCategory ?? data.invoiceType] ?? data.invoiceType}</p></div>
          <div><span className="text-muted-foreground">购买方名称</span><p>{data.buyerName}</p></div>
          <div><span className="text-muted-foreground">购买方税号</span><p>{data.buyerTaxNo || "-"}</p></div>
          <div><span className="text-muted-foreground">关联客户</span><p>{data.customer ? `${data.customer.name}${data.customer.shortName ? ` (${data.customer.shortName})` : ""}` : "-"}</p></div>
          <div><span className="text-muted-foreground">币种</span><p>{data.currency || "-"}</p></div>
          <div className="col-span-2 grid grid-cols-3 gap-4 pt-2 border-t">
            <div><span className="text-muted-foreground">不含税金额</span><p className="tabular-nums">¥{(data.amountWithoutTax ?? 0).toLocaleString()}</p></div>
            <div><span className="text-muted-foreground">税额</span><p className="tabular-nums">¥{(data.taxAmount ?? 0).toLocaleString()}</p></div>
            <div><span className="text-muted-foreground">价税合计</span><p className="font-semibold tabular-nums">¥{(data.amountWithTax ?? 0).toLocaleString()}</p></div>
          </div>
          <div><span className="text-muted-foreground">发票号码</span><p>{data.invoiceNo || <span className="text-muted-foreground">未开具</span>}</p></div>
          <div><span className="text-muted-foreground">税务流水号</span><p>{data.taxFlowNo || "-"}</p></div>
          {data.remark && <div className="col-span-2"><span className="text-muted-foreground">备注</span><p>{data.remark}</p></div>}
        </CardContent>
      </Card>

      {/* 来源追溯 */}
      <Card><CardHeader><CardTitle className="text-base">来源追溯</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">来源类型</span><p>{sourceLabels[data.sourceType] ?? data.sourceType ?? "-"}</p></div>
          <div><span className="text-muted-foreground">收入订单</span><p>{data.revenueOrderId ? <Link href={`/revenue-orders/${data.revenueOrderId}`} className="text-primary hover:underline">{data.revenueOrder ? `${data.revenueOrder.orderNo} ${data.revenueOrder.title ?? ""}` : data.revenueOrderId}</Link> : "-"}</p></div>
          <div className="col-span-2"><span className="text-muted-foreground">结算单</span><p>{data.settlementId ? <Link href={`/customer-settlements/${data.settlementId}`} className="text-primary hover:underline">{data.settlement ? `${data.settlement.settlementNo} ${data.settlement.title ?? ""}` : data.settlementId}</Link> : "-"}</p></div>
        </CardContent>
      </Card>

      {/* 购买方信息 */}
      <Card><CardHeader><CardTitle className="text-base">购买方信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">地址</span><p>{data.buyerAddress || "-"}</p></div>
          <div><span className="text-muted-foreground">电话</span><p>{data.buyerPhone || "-"}</p></div>
          <div><span className="text-muted-foreground">开户行</span><p>{data.buyerBankName || "-"}</p></div>
          <div><span className="text-muted-foreground">银行账号</span><p>{data.buyerBankAccount || "-"}</p></div>
        </CardContent>
      </Card>

      {/* 交付信息 */}
      <Card><CardHeader><CardTitle className="text-base">交付信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">交付方式</span><p>{(delLabels[data.deliveryMethod] ?? data.deliveryMethod) || "-"}</p></div>
          <div><span className="text-muted-foreground">收件邮箱</span><p>{data.recipientEmail || "-"}</p></div>
        </CardContent>
      </Card>

      {/* 开票明细 */}
      <Card><CardHeader><CardTitle className="text-base">开票明细</CardTitle></CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <Table>
              <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="h-10 text-xs">项目名称</TableHead><TableHead className="h-10 text-xs text-right">数量</TableHead><TableHead className="h-10 text-xs text-right">单价</TableHead><TableHead className="h-10 text-xs text-right">金额</TableHead><TableHead className="h-10 text-xs text-right">税率</TableHead><TableHead className="h-10 text-xs text-right">税额</TableHead></TableRow></TableHeader>
              <TableBody>{items.map((item: Record<string, unknown>, i: number) => (
                <TableRow key={(item.id as string) ?? i} className="h-11">
                  <TableCell className="font-medium">{item.itemName as string}</TableCell>
                  <TableCell className="text-right tabular-nums">{item.quantity as number}</TableCell>
                  <TableCell className="text-right tabular-nums">¥{(item.unitPrice as number)?.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">¥{(item.amount as number)?.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{item.taxRate as number}%</TableCell>
                  <TableCell className="text-right tabular-nums">¥{(item.taxAmount as number)?.toLocaleString()}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">暂无开票明细</p>
          )}
        </CardContent>
      </Card>

      {/* 时间信息 */}
      <Card><CardHeader><CardTitle className="text-base">时间信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">创建时间</span><p>{data.createdAt ? new Date(data.createdAt).toLocaleString("zh-CN") : "-"}</p></div>
          <div><span className="text-muted-foreground">更新时间</span><p>{data.updatedAt ? new Date(data.updatedAt).toLocaleString("zh-CN") : "-"}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
