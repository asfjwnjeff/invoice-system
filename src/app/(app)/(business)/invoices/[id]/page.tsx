"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { ArrowLeft, Pencil, File, Eye } from "lucide-react";
import { InvoicePreviewDrawer } from "@/components/shared/invoice-preview-drawer";

const catLabels: Record<string, string> = { DIGITAL_SPECIAL: "数电专票", DIGITAL_NORMAL: "数电普票", VAT_SPECIAL: "增值税专票", VAT_NORMAL: "增值税普票", E_NORMAL: "电子普票" };
const currencyLabels: Record<string, string> = { CNY: "人民币", USD: "美元", HKD: "港币", EUR: "欧元" };
const emLabels: Record<string, string> = { MANUAL: "手工录入", OCR: "OCR识别", IMPORT: "批量导入", SYSTEM: "系统生成", PC_UPLOAD: "PC端上传" };
const verifyLabels: Record<string, string> = { VERIFIED: "验证成功", PENDING: "待查验", VERIFY_FAILED: "查验失败" };
const headerLabels: Record<string, string> = { VALIDATED: "已校验", PENDING: "待校验", FAILED: "校验失败", NOT_EXIST: "抬头不存在" };
const delLabels: Record<string, string> = { DELIVERED: "已交付", PENDING: "待交付", FAILED: "交付失败" };
const usageLabels: Record<string, string> = { UNUSED: "未使用", USED: "已使用", RED_FLUSHED: "已红冲", VOIDED: "已作废", ARCHIVED: "已归档" };
const pushLabels: Record<string, string> = { PUSHED: "已推送", PENDING: "待推送" };
const accountLabels: Record<string, string> = { UNACCOUNTED: "未入账", ACCOUNTED: "已入账" };
const archiveLabels: Record<string, string> = { UNARCHIVED: "未归档", ARCHIVED: "已归档" };
const voidLabels: Record<string, string> = { PENDING: "待作废", VOIDED: "已作废" };

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const { data: inv, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => { const r = await fetch(`/api/invoices/${id}`); const j = await r.json(); return j.data; },
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">加载中...</div>;
  if (!inv) return <div className="p-8 text-muted-foreground">未找到发票</div>;

  const sv = (s: string): "success" | "warning" | "danger" | "neutral" =>
    s === "DELIVERED" || s === "VERIFIED" || s === "VALIDATED" || s === "PUSHED" || s === "ACCOUNTED" || s === "ARCHIVED" ? "success" :
    s === "FAILED" || s === "VERIFY_FAILED" || s === "VOIDED" || s === "NOT_EXIST" ? "danger" : "warning";

  const items = (inv.items as Record<string, unknown>[]) ?? (inv.application?.items as Record<string, unknown>[]) ?? [];

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-center gap-3">
        <Link href="/invoices"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{inv.invoiceNo}</h1>
            <StatusBadge status={delLabels[inv.deliveryStatus] ?? inv.deliveryStatus} variant={sv(inv.deliveryStatus)} />
            <StatusBadge status={verifyLabels[inv.verifyStatus] ?? inv.verifyStatus} variant={sv(inv.verifyStatus)} />
            <StatusBadge status={usageLabels[inv.usageStatus] ?? inv.usageStatus} variant={inv.usageStatus === "UNUSED" ? "neutral" : inv.usageStatus === "RED_FLUSHED" ? "danger" : "success"} />
          </div>
          <p className="text-sm text-muted-foreground">
            {catLabels[inv.invoiceCategory] ?? inv.invoiceCategory} · {inv.sellerName}
            {inv.invoiceCode && <span className="ml-3">代码: {inv.invoiceCode}</span>}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}><Eye className="h-3.5 w-3.5 mr-1" />查看原件</Button>
        <Link href={`/invoices/${inv.id}/edit`}><Button variant="outline" size="sm"><Pencil className="h-3.5 w-3.5 mr-1" />编辑</Button></Link>
      </div>

      {/* 发票信息 */}
      <Card><CardHeader><CardTitle className="text-base">发票信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-muted-foreground">发票代码</span><p>{inv.invoiceCode || "-"}</p></div>
          <div><span className="text-muted-foreground">发票号码</span><p className="font-medium">{inv.invoiceNo}</p></div>
          <div><span className="text-muted-foreground">票种</span><p>{catLabels[inv.invoiceCategory] ?? inv.invoiceCategory}</p></div>
          <div><span className="text-muted-foreground">所属票池</span><p>{inv.invoicePool || "-"}</p></div>
          <div><span className="text-muted-foreground">开票日期</span><p>{inv.issueDate?.slice(0, 10) ?? "-"}</p></div>
          <div><span className="text-muted-foreground">录入方式</span><p>{emLabels[inv.entryMethod] ?? inv.entryMethod}</p></div>
          <div><span className="text-muted-foreground">录入人</span><p>{inv.recordedBy || "-"}</p></div>
          <div><span className="text-muted-foreground">录入时间</span><p>{inv.createdAt ? new Date(inv.createdAt).toLocaleString("zh-CN") : "-"}</p></div>
          <div className="col-span-2"><span className="text-muted-foreground">上传文件名</span><p>{inv.uploadFilename || "-"}</p></div>
        </CardContent>
      </Card>

      {/* 业务信息 */}
      <Card><CardHeader><CardTitle className="text-base">业务信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-muted-foreground">发票类别</span><p>销项票</p></div>
          <div><span className="text-muted-foreground">业务发生日期</span><p>{inv.businessDate?.slice(0, 10) ?? "-"}</p></div>
          <div className="col-span-2"><span className="text-muted-foreground">业务说明</span><p>{inv.businessDescription || "-"}</p></div>
          <div><span className="text-muted-foreground">附件</span><p>{inv.attachments && inv.attachments !== "[]" ? `${JSON.parse(inv.attachments as string).length}个文件` : "未上传附件"}</p></div>
        </CardContent>
      </Card>

      {/* 金额信息 */}
      <Card><CardHeader><CardTitle className="text-base">金额信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm">
          <div className="text-center">
            <span className="text-muted-foreground">票面金额</span>
            <p className="text-2xl font-semibold tabular-nums">¥{(inv.amountWithTax ?? 0).toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div><span className="text-muted-foreground">不含税金额</span><p className="tabular-nums">¥{(inv.amountWithoutTax ?? 0).toLocaleString()}</p></div>
            <div><span className="text-muted-foreground">税额</span><p className="tabular-nums">¥{(inv.taxAmount ?? 0).toLocaleString()}</p></div>
            <div><span className="text-muted-foreground">币种</span><p>{currencyLabels[inv.currency] ?? inv.currency}</p></div>
            <div><span className="text-muted-foreground"></span><p></p></div>
          </div>
        </CardContent>
      </Card>

      {/* 销售方信息 */}
      <Card><CardHeader><CardTitle className="text-base">销售方信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="col-span-2"><span className="text-muted-foreground">销售方名称</span><p>{inv.sellerName || "-"}</p></div>
          <div className="col-span-2"><span className="text-muted-foreground">纳税人识别号</span><p>{inv.sellerTaxNo || "-"}</p></div>
          <div className="col-span-2"><span className="text-muted-foreground">地址、电话</span><p>{[inv.sellerAddress, inv.sellerPhone].filter(Boolean).join(" / ") || "-"}</p></div>
          <div className="col-span-2"><span className="text-muted-foreground">开户行、账号</span><p>{[inv.sellerBankName, inv.sellerBankAccount].filter(Boolean).join(" / ") || "-"}</p></div>
        </CardContent>
      </Card>

      {/* 购买方信息 */}
      <Card><CardHeader><CardTitle className="text-base">购买方信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="col-span-2"><span className="text-muted-foreground">购买方名称</span><p>{inv.buyerName || "-"}</p></div>
          <div className="col-span-2"><span className="text-muted-foreground">纳税人识别号</span><p>{inv.buyerTaxNo || "-"}</p></div>
          <div className="col-span-2"><span className="text-muted-foreground">地址、电话</span><p>{[inv.buyerAddress, inv.buyerPhone].filter(Boolean).join(" / ") || "-"}</p></div>
          <div className="col-span-2"><span className="text-muted-foreground">开户行、账号</span><p>{[inv.buyerBankName, inv.buyerBankAccount].filter(Boolean).join(" / ") || "-"}</p></div>
        </CardContent>
      </Card>

      {/* 发票风控雷达 */}
      <Card><CardHeader><CardTitle className="text-base">发票风控雷达</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-muted-foreground">抬头校验结果</span><p><StatusBadge status={headerLabels[inv.headerValidationStatus] ?? inv.headerValidationStatus ?? "待校验"} variant={sv(inv.headerValidationStatus)} /></p></div>
          <div className="col-span-3"><span className="text-muted-foreground">异常描述</span><p className="text-destructive">{inv.headerValidationMessage || "无异常"}</p></div>
          <div><span className="text-muted-foreground">税局查验结果</span><p><StatusBadge status={verifyLabels[inv.verifyStatus] ?? inv.verifyStatus} variant={sv(inv.verifyStatus)} /></p></div>
          <div><span className="text-muted-foreground">查验人</span><p>{inv.verifiedBy || "-"}</p></div>
          <div><span className="text-muted-foreground">查验时间</span><p>{inv.verifyTime ? new Date(inv.verifyTime).toLocaleString("zh-CN") : "-"}</p></div>
          <div className="col-span-2"><span className="text-muted-foreground">发票原文件</span>
            <p className="flex gap-2 flex-wrap">
              {inv.invoiceFiles?.length > 0
                ? inv.invoiceFiles.map((f: { id: string; fileName: string; fileUrl: string; fileType: string }) => (
                    <span key={f.id} className="inline-flex items-center gap-1 text-primary"><File className="h-3.5 w-3.5" />{f.fileName || f.fileType}</span>
                  ))
                : <><span className="text-muted-foreground">PDF文件：</span>--<span className="text-muted-foreground ml-3">OFD文件：</span>--<span className="text-muted-foreground ml-3">XML文件：</span>--</>
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 状态信息 */}
      <Card><CardHeader><CardTitle className="text-base">状态信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-muted-foreground">交付状态</span><p><StatusBadge status={delLabels[inv.deliveryStatus] ?? inv.deliveryStatus} variant={sv(inv.deliveryStatus)} /></p></div>
          <div><span className="text-muted-foreground">使用状态</span><p><StatusBadge status={usageLabels[inv.usageStatus] ?? inv.usageStatus} variant={inv.usageStatus === "UNUSED" ? "neutral" : inv.usageStatus === "RED_FLUSHED" ? "danger" : "success"} /></p></div>
          <div><span className="text-muted-foreground">推送状态</span><p><StatusBadge status={pushLabels[inv.pushStatus] ?? inv.pushStatus} variant={inv.pushStatus === "PUSHED" ? "success" : "warning"} /></p></div>
          <div><span className="text-muted-foreground">入账状态</span><p><StatusBadge status={accountLabels[inv.accountStatus] ?? inv.accountStatus} variant={sv(inv.accountStatus)} /></p></div>
          <div><span className="text-muted-foreground">归档状态</span><p><StatusBadge status={archiveLabels[inv.archiveStatus] ?? inv.archiveStatus} variant={sv(inv.archiveStatus)} /></p></div>
          <div><span className="text-muted-foreground">红冲状态</span><p>{inv.redFlushStatus || "正常"}</p></div>
          <div><span className="text-muted-foreground">作废状态</span><p>{inv.voidStatus == null ? "正常" : <StatusBadge status={voidLabels[inv.voidStatus] ?? inv.voidStatus} variant={sv(inv.voidStatus)} />}</p></div>
          <div><span className="text-muted-foreground">税局来源</span><p>{inv.isFromTaxAuthority ? "是" : "否"}</p></div>
        </CardContent>
      </Card>

      {/* 发票备注 */}
      {inv.remark && (
        <Card><CardHeader><CardTitle className="text-base">发票备注</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{inv.remark}</p></CardContent>
        </Card>
      )}

      {/* 发票明细 */}
      {items.length > 0 && (
        <Card><CardHeader><CardTitle className="text-base">发票明细</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>项目名称</TableHead><TableHead className="text-right">数量</TableHead><TableHead className="text-right">单价</TableHead><TableHead className="text-right">金额</TableHead><TableHead className="text-right">税率</TableHead><TableHead className="text-right">税额</TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((item: Record<string, unknown>, i: number) => (
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

      {/* 来源关联 */}
      {inv.application && (
        <Card><CardHeader><CardTitle className="text-base">来源关联</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">关联开票申请</span><p><Link href={`/applications/${inv.applicationId}`} className="text-primary hover:underline">{inv.application.applicationNo ?? inv.application.appNo}</Link></p></div>
            <div><span className="text-muted-foreground">购买方</span><p>{inv.application.buyerName}</p></div>
          </CardContent>
        </Card>
      )}

      {/* 时间信息 */}
      <Card><CardHeader><CardTitle className="text-base">时间信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">创建时间</span><p>{inv.createdAt ? new Date(inv.createdAt).toLocaleString("zh-CN") : "-"}</p></div>
          <div><span className="text-muted-foreground">更新时间</span><p>{inv.updatedAt ? new Date(inv.updatedAt).toLocaleString("zh-CN") : "-"}</p></div>
        </CardContent>
      </Card>

      <InvoicePreviewDrawer
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        files={(inv.invoiceFiles as { fileName: string; fileType: string; fileUrl?: string }[]) ?? [
          { fileName: inv.uploadFilename ?? `${inv.invoiceNo}.pdf`, fileType: "PDF" },
          { fileName: `${inv.invoiceNo}.ofd`, fileType: "OFD" },
          { fileName: `${inv.invoiceNo}.xml`, fileType: "XML" },
        ]}
        recordedBy={inv.recordedBy}
        uploadFilename={inv.uploadFilename}
        createdAt={inv.createdAt}
      />
    </div>
  );
}
