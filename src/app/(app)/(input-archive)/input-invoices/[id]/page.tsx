"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";

const catLabels: Record<string, string> = { VAT_SPECIAL: "增值税专票", VAT_NORMAL: "增值税普票", DIGITAL_SPECIAL: "数电专票", DIGITAL_NORMAL: "数电普票" };
const verifyLabels: Record<string, string> = { VERIFIED: "已查验", PENDING: "待查验", VERIFY_FAILED: "查验失败" };
const deductLabels: Record<string, string> = { DEDUCTED: "已抵扣", PENDING: "待认证" };
const emLabels: Record<string, string> = { MANUAL: "手工录入", OCR: "OCR识别", IMPORT: "批量导入" };
const costTypeLabels: Record<string, string> = { TRANSPORT: "运输成本", WAREHOUSE: "仓储成本", CUSTOMS: "关务成本", AGENCY: "代理成本", INSURANCE: "保险费", OTHER: "其他" };

export default function InputInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: inv, isLoading } = useQuery({
    queryKey: ["input-invoice", id],
    queryFn: async () => { const r = await fetch(`/api/input-invoices/${id}`); const j = await r.json(); return j.data; },
  });
  if (isLoading) return <div className="p-8 text-muted-foreground">加载中...</div>;
  if (!inv) return <div className="p-8 text-destructive">进项发票不存在</div>;

  const sv = (s: string): "success"|"warning"|"danger"|"neutral" =>
    s === "VERIFIED" || s === "DEDUCTED" ? "success" : s === "VERIFY_FAILED" ? "danger" : "warning";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/input-invoices"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3"><h1 className="text-xl font-semibold">{inv.invoiceNo}</h1><StatusBadge status={verifyLabels[inv.verifyStatus] ?? inv.verifyStatus} variant={sv(inv.verifyStatus)} /></div>
          <p className="text-sm text-muted-foreground">{catLabels[inv.invoiceCategory] ?? inv.invoiceCategory} · {inv.sellerName}</p>
        </div>
        <Link href={`/input-invoices/${inv.id}/edit`}><Button variant="outline" size="sm"><Pencil className="h-3.5 w-3.5 mr-1" />编辑</Button></Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle className="text-base">发票信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">发票号码</span><p className="font-medium">{inv.invoiceNo}</p></div>
            <div><span className="text-muted-foreground">票种</span><p>{catLabels[inv.invoiceCategory] ?? inv.invoiceCategory}</p></div>
            <div className="col-span-2"><span className="text-muted-foreground">销售方</span><p>{inv.sellerName}</p></div>
            <div><span className="text-muted-foreground">销售方税号</span><p>{inv.sellerTaxNo || "-"}</p></div>
            <div><span className="text-muted-foreground">购买方</span><p>{inv.buyerName || "-"}</p></div>
            <div><span className="text-muted-foreground">购买方税号</span><p>{inv.buyerTaxNo || "-"}</p></div>
            <div><span className="text-muted-foreground">开票日期</span><p>{inv.issueDate?.slice(0, 10) ?? "-"}</p></div>
            <div><span className="text-muted-foreground">录入方式</span><p>{emLabels[inv.entryMethod] ?? inv.entryMethod}</p></div>
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="text-base">金额信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 text-sm">
            <div className="text-center"><span className="text-muted-foreground">价税合计</span><p className="text-2xl font-semibold tabular-nums">¥{inv.amountWithTax?.toLocaleString() ?? "0"}</p></div>
            <div className="grid grid-cols-3 gap-4">
              <div><span className="text-muted-foreground">不含税</span><p className="tabular-nums">¥{inv.amountWithoutTax?.toLocaleString() ?? "0"}</p></div>
              <div><span className="text-muted-foreground">税率</span><p>{inv.taxRate ?? "-"}%</p></div>
              <div><span className="text-muted-foreground">税额</span><p className="tabular-nums">¥{inv.taxAmount?.toLocaleString() ?? "0"}</p></div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">状态信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">查验状态</span><p><StatusBadge status={verifyLabels[inv.verifyStatus] ?? inv.verifyStatus} variant={sv(inv.verifyStatus)} /></p></div>
            <div><span className="text-muted-foreground">认证状态</span><p><StatusBadge status={deductLabels[inv.deductStatus] ?? inv.deductStatus} variant={inv.deductStatus === "DEDUCTED" ? "success" : "warning"} /></p></div>
            <div><span className="text-muted-foreground">抬头校验</span><p>{inv.headerValidationStatus || "-"}</p></div>
            <div><span className="text-muted-foreground">税局来源</span><p>{inv.isFromTaxAuthority ? "是" : "否"}</p></div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">成本归集与关联</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><span className="text-muted-foreground">关联业务订单</span><p>{inv.businessOrder?.orderNo ? <Link href={`/business-orders/${inv.businessOrderId}`} className="text-accent hover:underline">{inv.businessOrder.orderNo}</Link> : "-"}</p></div>
            <div><span className="text-muted-foreground">供应商</span><p>{inv.supplier?.name ?? "-"}</p></div>
            <div><span className="text-muted-foreground">成本中心</span><p>{inv.costCenter?.name ?? "-"}</p></div>
            <div><span className="text-muted-foreground">成本类型</span><p>{(costTypeLabels[inv.costType] ?? inv.costType) || "-"}</p></div>
            <div><span className="text-muted-foreground">分摊比例</span><p>{inv.costAllocationRatio ?? "100"}%</p></div>
            <div><span className="text-muted-foreground">代垫成本</span><p>{inv.isAdvanceCost ? "是" : "否"}</p></div>
            {inv.remark && <div className="col-span-3"><span className="text-muted-foreground">备注</span><p>{inv.remark}</p></div>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">时间信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">创建时间</span><p>{inv.createdAt ? new Date(inv.createdAt).toLocaleString("zh-CN") : "-"}</p></div>
            <div><span className="text-muted-foreground">更新时间</span><p>{inv.updatedAt ? new Date(inv.updatedAt).toLocaleString("zh-CN") : "-"}</p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
