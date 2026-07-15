"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, File, Eye } from "lucide-react";
import { InvoicePreviewDrawer } from "@/components/shared/invoice-preview-drawer";
import { useState } from "react";

const catLabels: Record<string, string> = { VAT_SPECIAL: "增值税专票", VAT_NORMAL: "增值税普票", DIGITAL_SPECIAL: "数电专票", DIGITAL_NORMAL: "数电普票" };
const verifyLabels: Record<string, string> = { VERIFIED: "验证成功", PENDING: "待查验", VERIFY_FAILED: "查验失败" };
const deductLabels: Record<string, string> = { DEDUCTED: "已认证", PENDING: "待认证", NOT_APPLICABLE: "不适用" };
const headerLabels: Record<string, string> = { VALIDATED: "已校验", PENDING: "待校验", FAILED: "校验失败", NOT_EXIST: "抬头不存在" };
const emLabels: Record<string, string> = { MANUAL: "手工录入", OCR: "OCR识别", IMPORT: "批量导入", PC_UPLOAD: "PC端上传" };
const costTypeLabels: Record<string, string> = { TRANSPORT: "运输成本", WAREHOUSE: "仓储成本", CUSTOMS: "关务成本", AGENCY: "代理成本", INSURANCE: "保险费", OTHER: "其他" };
const deductSelLabels: Record<string, string> = { SELECTED: "已勾选", UNSELECTED: "未选择" };

export default function InputInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const { data: inv, isLoading } = useQuery({
    queryKey: ["input-invoice", id],
    queryFn: async () => { const r = await fetch(`/api/input-invoices/${id}`); const j = await r.json(); return j.data; },
  });
  if (isLoading) return <div className="p-8 text-muted-foreground">加载中...</div>;
  if (!inv) return <div className="p-8 text-destructive">进项发票不存在</div>;

  const sv = (s: string): "success" | "warning" | "danger" | "neutral" =>
    s === "VERIFIED" || s === "DEDUCTED" || s === "VALIDATED" ? "success" :
    s === "VERIFY_FAILED" || s === "FAILED" || s === "NOT_EXIST" ? "danger" : "warning";

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-center gap-3">
        <Link href="/input-invoices"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{inv.invoiceNo}</h1>
            <StatusBadge status={verifyLabels[inv.verifyStatus] ?? inv.verifyStatus} variant={sv(inv.verifyStatus)} />
          </div>
          <p className="text-sm text-muted-foreground">
            {catLabels[inv.invoiceCategory] ?? inv.invoiceCategory} · {inv.sellerName}
            {inv.invoiceCode && <span className="ml-3">代码: {inv.invoiceCode}</span>}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}><Eye className="h-3.5 w-3.5 mr-1" />查看原件</Button>
        <Link href={`/input-invoices/${inv.id}/edit`}><Button variant="outline" size="sm"><Pencil className="h-3.5 w-3.5 mr-1" />编辑</Button></Link>
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
          <div><span className="text-muted-foreground">发票类别</span><p>{catLabels[inv.invoiceCategory] ?? inv.invoiceCategory}</p></div>
          <div><span className="text-muted-foreground">业务发生日期</span><p>{inv.businessDate?.slice(0, 10) ?? "-"}</p></div>
          <div className="col-span-2"><span className="text-muted-foreground">业务说明</span><p>{inv.businessDescription || "-"}</p></div>
          <div><span className="text-muted-foreground">商旅服务商</span><p>{inv.travelServiceProvider || "-"}</p></div>
          <div><span className="text-muted-foreground">附件</span><p>{inv.attachments && inv.attachments !== "[]" ? `${JSON.parse(inv.attachments).length}个文件` : "未上传附件"}</p></div>
        </CardContent>
      </Card>

      {/* 金额信息 */}
      <Card><CardHeader><CardTitle className="text-base">金额信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm">
          <div className="text-center">
            <span className="text-muted-foreground">价税合计</span>
            <p className="text-2xl font-semibold tabular-nums">¥{(inv.amountWithTax ?? 0).toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div><span className="text-muted-foreground">不含税金额</span><p className="tabular-nums">¥{(inv.amountWithoutTax ?? 0).toLocaleString()}</p></div>
            <div><span className="text-muted-foreground">税率</span><p>{inv.taxRate ?? "-"}%</p></div>
            <div><span className="text-muted-foreground">税额</span><p className="tabular-nums">¥{(inv.taxAmount ?? 0).toLocaleString()}</p></div>
            <div><span className="text-muted-foreground">币种</span><p>{inv.currency || "CNY"}</p></div>
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

      {/* 发票备注 */}
      {inv.remark && (
        <Card><CardHeader><CardTitle className="text-base">发票备注</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{inv.remark}</p></CardContent>
        </Card>
      )}

      {/* 记账凭证信息 */}
      <Card><CardHeader><CardTitle className="text-base">记账凭证信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-muted-foreground">勾选状态</span><p>{(deductSelLabels[inv.deductSelectionStatus] ?? inv.deductSelectionStatus) || "未选择"}</p></div>
          <div><span className="text-muted-foreground">认证状态</span><p><StatusBadge status={deductLabels[inv.deductStatus] ?? inv.deductStatus} variant={inv.deductStatus === "DEDUCTED" ? "success" : "warning"} /></p></div>
          <div className="col-span-2"><span className="text-muted-foreground">不抵扣原因</span><p>{inv.nonDeductReason || "-"}</p></div>
          <div><span className="text-muted-foreground">凭证日期</span><p>{inv.voucherDate?.slice(0, 10) ?? "-"}</p></div>
          <div><span className="text-muted-foreground">凭证号</span><p>{inv.voucherNo || "-"}</p></div>
          <div className="col-span-2"><span className="text-muted-foreground">可抵扣金额</span><p className="tabular-nums font-medium">{inv.deductibleAmount != null ? `¥${Number(inv.deductibleAmount).toLocaleString()}` : "-"}</p></div>
        </CardContent>
      </Card>

      {/* 成本归集与关联 */}
      <Card><CardHeader><CardTitle className="text-base">成本归集与关联</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><span className="text-muted-foreground">关联业务订单</span><p>{inv.businessOrder?.orderNo ? <Link href={`/business-orders/${inv.businessOrderId}`} className="text-primary hover:underline">{inv.businessOrder.orderNo} {inv.businessOrder.title}</Link> : "-"}</p></div>
          <div><span className="text-muted-foreground">供应商</span><p>{inv.supplier?.name ?? "-"}</p></div>
          <div><span className="text-muted-foreground">成本中心</span><p>{inv.costCenter?.name ?? "-"}</p></div>
          <div><span className="text-muted-foreground">成本类型</span><p>{(costTypeLabels[inv.costType] ?? inv.costType) || "-"}</p></div>
          <div><span className="text-muted-foreground">分摊比例</span><p>{inv.costAllocationRatio ?? "100"}%</p></div>
          <div><span className="text-muted-foreground">代垫成本</span><p>{inv.isAdvanceCost ? "是" : "否"}</p></div>
          <div className="col-span-3"><span className="text-muted-foreground">备注</span><p>{inv.remark || "-"}</p></div>
        </CardContent>
      </Card>

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
