"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Pencil } from "lucide-react";

const currencyLabels: Record<string, string> = { CNY: "人民币", USD: "美元", HKD: "港币", EUR: "欧元" };
const emLabels: Record<string, string> = { MANUAL: "手工录入", OCR: "OCR识别", IMPORT: "批量导入" };
const statusLabels: Record<string, string> = { DELIVERED: "已交付", PENDING: "待处理", FAILED: "失败", VERIFIED: "已查验", VERIFY_FAILED: "查验失败", VALIDATED: "已校验", UNUSED: "未使用", USED: "已使用", RED_FLUSHED: "已红冲", VOIDED: "已作废", ARCHIVED: "已归档", PUSHED: "已推送", DEDUCTED: "已抵扣", UNACCOUNTED: "未入账", ACCOUNTED: "已入账", UNARCHIVED: "未归档" };
const voidLabels: Record<string, string> = { PENDING: "待作废", VOIDED: "已作废" };
const catLabels: Record<string, string> = { DIGITAL_SPECIAL: "数电专票", DIGITAL_NORMAL: "数电普票", VAT_SPECIAL: "增值税专票", VAT_NORMAL: "增值税普票", E_NORMAL: "电子普票" };

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: inv, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => { const r = await fetch(`/api/invoices/${id}`); const j = await r.json(); return j.data; },
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">加载中...</div>;
  if (!inv) return <div className="p-8 text-muted-foreground">未找到发票</div>;

  const sv = (s: string): "success" | "warning" | "danger" | "neutral" => s === "DELIVERED" || s === "VERIFIED" || s === "DEDUCTED" || s === "ARCHIVED" || s === "ACCOUNTED" ? "success" : s === "FAILED" || s === "VOIDED" ? "danger" : "warning";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/invoices"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1"><h1 className="text-xl font-semibold">销项发票详情</h1><p className="text-sm text-muted-foreground">{inv.invoiceNo}</p></div>
        <StatusBadge status={statusLabels[inv.deliveryStatus] ?? inv.deliveryStatus ?? "待处理"} variant={sv(inv.deliveryStatus)} />
        <Link href={`/invoices/${id}/edit`}><Button variant="outline" size="sm"><Pencil className="h-3.5 w-3.5 mr-1" />编辑</Button></Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">发票信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">发票号码</span><p className="font-medium tabular-nums">{inv.invoiceNo}</p></div>
            <div><span className="text-muted-foreground">发票代码</span><p>{inv.invoiceCode || "-"}</p></div>
            <div><span className="text-muted-foreground">票种</span><p>{catLabels[inv.invoiceCategory] ?? inv.invoiceCategory}</p></div>
            <div><span className="text-muted-foreground">所属票池</span><p>{inv.invoicePool || "-"}</p></div>
            <div><span className="text-muted-foreground">销售方</span><p>{inv.sellerName}</p></div>
            <div><span className="text-muted-foreground">销售方税号</span><p>{inv.sellerTaxNo}</p></div>
            <div className="col-span-2"><span className="text-muted-foreground">购买方</span><p>{inv.buyerName}</p></div>
            <div><span className="text-muted-foreground">购买方税号</span><p>{inv.buyerTaxNo || "-"}</p></div>
            <div><span className="text-muted-foreground">购买方地址</span><p>{inv.buyerAddress || "-"}</p></div>
            <div><span className="text-muted-foreground">开票日期</span><p>{inv.issueDate?.slice(0, 10) ?? "-"}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">金额信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">不含税金额</span><p className="tabular-nums">¥{(inv.amountWithoutTax ?? 0).toLocaleString()}</p></div>
            <div><span className="text-muted-foreground">税额</span><p className="tabular-nums">¥{(inv.taxAmount ?? 0).toLocaleString()}</p></div>
            <div className="col-span-2"><span className="text-muted-foreground">价税合计</span><p className="text-lg font-semibold tabular-nums">¥{(inv.amountWithTax ?? 0).toLocaleString()}</p></div>
            <div><span className="text-muted-foreground">币种</span><p>{currencyLabels[inv.currency] ?? inv.currency ?? "人民币"}</p></div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">状态信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">交付状态</span><p><StatusBadge status={statusLabels[inv.deliveryStatus] ?? inv.deliveryStatus ?? "待处理"} variant={sv(inv.deliveryStatus)} /></p></div>
            <div><span className="text-muted-foreground">查验状态</span><p><StatusBadge status={statusLabels[inv.verifyStatus] ?? inv.verifyStatus ?? "待处理"} variant={sv(inv.verifyStatus)} /></p></div>
            <div><span className="text-muted-foreground">抬头校验</span><p><StatusBadge status={statusLabels[inv.headerValidationStatus] ?? inv.headerValidationStatus ?? "待处理"} variant={sv(inv.headerValidationStatus)} /></p></div>
            <div><span className="text-muted-foreground">使用状态</span><p><StatusBadge status={statusLabels[inv.usageStatus] ?? inv.usageStatus ?? "未使用"} variant={inv.usageStatus === "UNUSED" ? "neutral" : inv.usageStatus === "RED_FLUSHED" ? "danger" : "success"} /></p></div>
            <div><span className="text-muted-foreground">税局来源</span><p>{inv.isFromTaxAuthority ? "是" : "否"}</p></div>
            <div><span className="text-muted-foreground">录入方式</span><p>{emLabels[inv.entryMethod] ?? inv.entryMethod ?? "-"}</p></div>
            <div><span className="text-muted-foreground">推送状态</span><p><StatusBadge status={statusLabels[inv.pushStatus] ?? inv.pushStatus ?? "待处理"} variant={inv.pushStatus === "PUSHED" ? "success" : "warning"} /></p></div>
            <div><span className="text-muted-foreground">红冲状态</span><p>{inv.redFlushStatus || "正常"}</p></div>
            <div><span className="text-muted-foreground">入账状态</span><p><StatusBadge status={statusLabels[inv.accountStatus] ?? inv.accountStatus ?? "未入账"} variant={sv(inv.accountStatus)} /></p></div>
            <div><span className="text-muted-foreground">归档状态</span><p><StatusBadge status={statusLabels[inv.archiveStatus] ?? inv.archiveStatus ?? "未归档"} variant={sv(inv.archiveStatus)} /></p></div>
            <div><span className="text-muted-foreground">作废状态</span><p>{inv.voidStatus == null ? "正常" : <StatusBadge status={voidLabels[inv.voidStatus] ?? inv.voidStatus} variant={sv(inv.voidStatus)} />}</p></div>
          </CardContent>
        </Card>

        {inv.items?.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">发票明细</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>项目名称</TableHead><TableHead className="text-right">数量</TableHead><TableHead className="text-right">单价</TableHead><TableHead className="text-right">金额</TableHead><TableHead className="text-right">税率</TableHead><TableHead className="text-right">税额</TableHead></TableRow></TableHeader>
                <TableBody>
                  {inv.items.map((item: Record<string, unknown>, i: number) => (
                    <TableRow key={i}>
                      <TableCell>{item.itemName as string}</TableCell>
                      <TableCell className="text-right tabular-nums">{String(item.quantity ?? 1)}</TableCell>
                      <TableCell className="text-right tabular-nums">¥{Number(item.unitPrice ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">¥{Number(item.amount ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">{String(item.taxRate ?? 0)}%</TableCell>
                      <TableCell className="text-right tabular-nums">¥{Number(item.taxAmount ?? 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">时间信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">创建时间</span><p>{inv.createdAt ? new Date(inv.createdAt).toLocaleString("zh-CN") : "-"}</p></div>
            <div><span className="text-muted-foreground">更新时间</span><p>{inv.updatedAt ? new Date(inv.updatedAt).toLocaleString("zh-CN") : "-"}</p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
