"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const bookTypeLabels: Record<string, string> = { IMPORT_VAT_PAYMENT: "进口增值税缴款书", CUSTOMS_DUTY_PAYMENT: "关税缴款书", OTHER_TAX: "其他税单" };
const taxTypeLabels: Record<string, string> = { CUSTOMS_DUTY: "关税", IMPORT_VAT: "进口增值税", OTHER: "其他" };
const deductLabels: Record<string, string> = { DEDUCTED: "已抵扣", PENDING: "待抵扣" };
const accountLabels: Record<string, string> = { UNACCOUNTED: "未入账", ACCOUNTED: "已入账" };
const archiveLabels: Record<string, string> = { UNARCHIVED: "未归档", ARCHIVED: "已归档" };

export default function CustomsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: cpb, isLoading } = useQuery({
    queryKey: ["customs-payment-book", id],
    queryFn: async () => { const r = await fetch(`/api/customs-payment-books/${id}`); const j = await r.json(); return j.data; },
  });
  if (isLoading) return <div className="p-8 text-muted-foreground">加载中...</div>;
  if (!cpb) return <div className="p-8 text-destructive">海关票据不存在</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/customs-payment-books"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3"><h1 className="text-xl font-semibold">{cpb.bookNo}</h1><StatusBadge status={deductLabels[cpb.deductStatus] ?? cpb.deductStatus} variant={cpb.deductStatus === "DEDUCTED" ? "success" : "warning"} /></div>
          <p className="text-sm text-muted-foreground">{bookTypeLabels[cpb.bookType] ?? cpb.bookType} · {taxTypeLabels[cpb.taxType] ?? cpb.taxType}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle className="text-base">票据信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">票据编号</span><p className="font-medium">{cpb.bookNo}</p></div>
            <div><span className="text-muted-foreground">票据类型</span><p>{bookTypeLabels[cpb.bookType] ?? cpb.bookType}</p></div>
            <div><span className="text-muted-foreground">税种</span><p>{taxTypeLabels[cpb.taxType] ?? cpb.taxType}</p></div>
            <div><span className="text-muted-foreground">缴款书号</span><p>{cpb.paymentNo || "-"}</p></div>
            <div className="col-span-2"><span className="text-muted-foreground">报关单号</span><p>{cpb.customsDeclarationNo}</p></div>
            <div><span className="text-muted-foreground">进口口岸</span><p>{cpb.importPort || "-"}</p></div>
            <div><span className="text-muted-foreground">申报单位</span><p>{cpb.declarationUnit || "-"}</p></div>
            <div><span className="text-muted-foreground">消费使用单位</span><p>{cpb.consumerUnit || "-"}</p></div>
            <div className="col-span-2"><span className="text-muted-foreground">纳税单位</span><p>{cpb.taxpayerName}</p></div>
            <div><span className="text-muted-foreground">纳税人税号</span><p>{cpb.taxpayerTaxNo || "-"}</p></div>
            <div><span className="text-muted-foreground">缴款日期</span><p>{cpb.paymentDate?.slice(0, 10) ?? "-"}</p></div>
            <div><span className="text-muted-foreground">币种</span><p>{cpb.currency === "CNY" ? "人民币" : cpb.currency}</p></div>
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="text-base">金额与状态</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 text-sm">
            <div className="text-center"><span className="text-muted-foreground">税额</span><p className="text-2xl font-semibold tabular-nums">¥{cpb.taxAmount?.toLocaleString() ?? "0"}</p></div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-muted-foreground">是否代垫</span><p>{cpb.isAdvance ? "是" : "否"}</p></div>
              <div><span className="text-muted-foreground">抵扣状态</span><p><StatusBadge status={deductLabels[cpb.deductStatus] ?? cpb.deductStatus} variant={cpb.deductStatus === "DEDUCTED" ? "success" : "warning"} /></p></div>
              <div><span className="text-muted-foreground">入账状态</span><p>{accountLabels[cpb.accountStatus] ?? cpb.accountStatus}</p></div>
              <div><span className="text-muted-foreground">归档状态</span><p>{archiveLabels[cpb.archiveStatus] ?? cpb.archiveStatus}</p></div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">时间信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">创建时间</span><p>{cpb.createdAt ? new Date(cpb.createdAt).toLocaleString("zh-CN") : "-"}</p></div>
            <div><span className="text-muted-foreground">更新时间</span><p>{cpb.updatedAt ? new Date(cpb.updatedAt).toLocaleString("zh-CN") : "-"}</p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
