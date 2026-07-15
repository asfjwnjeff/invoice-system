"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowLeft, Eye } from "lucide-react";
import { InvoicePreviewDrawer } from "@/components/shared/invoice-preview-drawer";

const catLabels: Record<string, string> = { DIGITAL_SPECIAL: "数电专票", DIGITAL_NORMAL: "数电普票", VAT_SPECIAL: "增值税专票", VAT_NORMAL: "增值税普票", E_NORMAL: "电子普票" };
const currencyLabels: Record<string, string> = { CNY: "人民币", USD: "美元", HKD: "港币", EUR: "欧元" };
const emLabels: Record<string, string> = { MANUAL: "手工录入", OCR: "OCR识别", IMPORT: "批量导入", SYSTEM: "系统生成", PC_UPLOAD: "PC端上传" };
const verifyLabels: Record<string, string> = { VERIFIED: "已查验", PENDING: "待查验", VERIFY_FAILED: "查验失败" };
const delLabels: Record<string, string> = { DELIVERED: "已交付", PENDING: "待交付", FAILED: "交付失败" };
const usageLabels: Record<string, string> = { UNUSED: "未使用", USED: "已使用", RED_FLUSHED: "已红冲", VOIDED: "已作废", ARCHIVED: "已归档" };

const Field = ({ label, value }: { label: string; value: string }) => (
  <div><span className="text-xs text-muted-foreground">{label}</span><p className="text-sm">{value || "-"}</p></div>
);

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const { data: inv, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => { const r = await fetch(`/api/invoices/${id}`); const j = await r.json(); return j.data as Record<string, unknown>; },
  });

  if (isLoading) return <div className="p-6 text-muted-foreground">加载中...</div>;
  if (!inv) return <div className="p-6 text-muted-foreground">未找到发票</div>;

  const S = (v: unknown) => String(v ?? "");
  const N = (v: unknown) => Number(v ?? 0);
  const sv = (s: string): "success" | "warning" | "danger" | "neutral" =>
    s === "DELIVERED" || s === "VERIFIED" || s === "PUSHED" ? "success" : s === "FAILED" ? "danger" : "warning";
  const items = (inv.items as Record<string, unknown>[]) ?? [];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/invoices"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{S(inv.invoiceNo)}</h1>
          <p className="text-sm text-muted-foreground">
            {catLabels[S(inv.invoiceCategory)] ?? S(inv.invoiceCategory)} · {S(inv.sellerName)}
            {inv.invoiceCode ? ` · 代码: ${S(inv.invoiceCode)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={verifyLabels[S(inv.verifyStatus)] ?? S(inv.verifyStatus)} variant={sv(S(inv.verifyStatus))} />
          <StatusBadge status={delLabels[S(inv.deliveryStatus)] ?? S(inv.deliveryStatus)} variant={sv(S(inv.deliveryStatus))} />
          <StatusBadge status={usageLabels[S(inv.usageStatus)] ?? S(inv.usageStatus)} variant={S(inv.usageStatus) === "UNUSED" ? "neutral" : S(inv.usageStatus) === "RED_FLUSHED" ? "danger" : "success"} />
        </div>
        <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}><Eye className="h-3.5 w-3.5 mr-1" />查看原件</Button>
        <Link href={`/invoices/${inv.id}/edit`}><Button variant="outline" size="sm">编辑</Button></Link>
      </div>

      {/* Row 1: 发票信息 + 金额汇总 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3"><CardHeader className="pb-3"><CardTitle className="text-base">发票信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Field label="发票号码" value={S(inv.invoiceNo)} />
            <Field label="发票代码" value={S(inv.invoiceCode)} />
            <Field label="票种" value={catLabels[S(inv.invoiceCategory)] ?? S(inv.invoiceCategory)} />
            <Field label="所属票池" value={S(inv.invoicePool)} />
            <Field label="开票日期" value={inv.issueDate ? S(inv.issueDate).slice(0, 10) : "-"} />
            <Field label="不含税金额" value={`¥${N(inv.amountWithoutTax).toLocaleString()}`} />
            <Field label="税额" value={`¥${N(inv.taxAmount).toLocaleString()}`} />
            <Field label="价税合计" value={`¥${N(inv.amountWithTax).toLocaleString()}`} />
            <Field label="录入方式" value={emLabels[S(inv.entryMethod)] ?? S(inv.entryMethod)} />
            <Field label="录入人" value={S(inv.recordedBy)} />
            <Field label="录入时间" value={inv.createdAt ? new Date(S(inv.createdAt)).toLocaleDateString("zh-CN") : "-"} />
            {!!inv.remark && <Field label="备注" value={S(inv.remark)} />}
          </CardContent>
        </Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">金额汇总</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div><span className="text-xs text-muted-foreground">币种</span><p>{currencyLabels[S(inv.currency)] ?? S(inv.currency)}</p></div>
              {items.length > 0 && (() => { const rates = [...new Set(items.map((it: Record<string,unknown>) => N(it.taxRate)))]; return <div><span className="text-xs text-muted-foreground">税率</span><p>{rates.map(r => `${r}%`).join(" / ")}</p></div>; })()}
              <div className="flex justify-between"><span className="text-muted-foreground">票面金额</span><strong className="tabular-nums text-base">¥{N(inv.amountWithTax).toLocaleString()}</strong></div>
              <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">不含税金额</span><strong className="tabular-nums">¥{N(inv.amountWithoutTax).toLocaleString()}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">税额</span><strong className="tabular-nums">¥{N(inv.taxAmount).toLocaleString()}</strong></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: 销售方 + 购买方 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">销售方信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2"><Field label="名称" value={S(inv.sellerName)} /></div>
            <div className="col-span-2"><Field label="纳税人识别号" value={S(inv.sellerTaxNo)} /></div>
            <div className="col-span-2"><Field label="地址、电话" value={[S(inv.sellerAddress), S(inv.sellerPhone)].filter(Boolean).join(" / ")} /></div>
            <div className="col-span-2"><Field label="开户行、账号" value={[S(inv.sellerBankName), S(inv.sellerBankAccount)].filter(Boolean).join(" / ")} /></div>
          </CardContent>
        </Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">购买方信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2"><Field label="名称" value={S(inv.buyerName)} /></div>
            <div className="col-span-2"><Field label="纳税人识别号" value={S(inv.buyerTaxNo)} /></div>
            <div className="col-span-2"><Field label="地址、电话" value={[S(inv.buyerAddress), S(inv.buyerPhone)].filter(Boolean).join(" / ")} /></div>
            <div className="col-span-2"><Field label="开户行、账号" value={[S(inv.buyerBankName), S(inv.buyerBankAccount)].filter(Boolean).join(" / ")} /></div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: 发票明细 */}
      {items.length > 0 && (
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">发票明细</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm"><thead><tr className="border-b text-xs text-muted-foreground"><th className="text-left py-2 px-2">#</th><th className="text-left py-2 px-2">项目名称</th><th className="text-left py-2 px-2">规格型号</th><th className="text-right py-2 px-2">数量</th><th className="text-right py-2 px-2">单价</th><th className="text-right py-2 px-2">金额</th><th className="text-right py-2 px-2">税率</th><th className="text-right py-2 px-2">税额</th></tr></thead>
                <tbody>{items.map((it: Record<string, unknown>, i: number) => (<tr key={i} className="border-b last:border-0"><td className="py-2 px-2">{i + 1}</td><td className="py-2 px-2 font-medium">{S(it.itemName)}</td><td className="py-2 px-2">{S(it.spec) || "-"}</td><td className="py-2 px-2 text-right tabular-nums">{N(it.quantity)}</td><td className="py-2 px-2 text-right tabular-nums">¥{N(it.unitPrice).toLocaleString()}</td><td className="py-2 px-2 text-right tabular-nums">¥{N(it.amount).toLocaleString()}</td><td className="py-2 px-2 text-right tabular-nums">{N(it.taxRate)}%</td><td className="py-2 px-2 text-right tabular-nums">¥{N(it.taxAmount).toLocaleString()}</td></tr>))}</tbody></table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Row 4: 来源关联 + 状态 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {inv.application && (
          <Card><CardHeader className="pb-3"><CardTitle className="text-base">来源关联</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Field label="开票申请号" value={S((inv.application as Record<string, unknown>).applicationNo)} />
              <Field label="购买方" value={S((inv.application as Record<string, unknown>).buyerName)} />
              {!!inv.remark && <Field label="备注" value={S(inv.remark)} />}
            </CardContent>
          </Card>
        )}
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">状态信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-xs text-muted-foreground">查验结果</span><p><StatusBadge status={verifyLabels[S(inv.verifyStatus)] ?? S(inv.verifyStatus)} variant={sv(S(inv.verifyStatus))} /></p></div>
            <div><span className="text-xs text-muted-foreground">交付状态</span><p><StatusBadge status={delLabels[S(inv.deliveryStatus)] ?? S(inv.deliveryStatus)} variant={sv(S(inv.deliveryStatus))} /></p></div>
            <div><span className="text-xs text-muted-foreground">邮件送达</span><p><StatusBadge status={S(inv.emailDeliveryStatus) === "SENT" ? "已发送" : "待发送"} variant={S(inv.emailDeliveryStatus) === "SENT" ? "success" : "warning"} /></p></div>
            <div><span className="text-xs text-muted-foreground">使用状态</span><p><StatusBadge status={usageLabels[S(inv.usageStatus)] ?? S(inv.usageStatus)} variant={S(inv.usageStatus) === "UNUSED" ? "neutral" : S(inv.usageStatus) === "RED_FLUSHED" ? "danger" : "success"} /></p></div>
          </CardContent>
        </Card>
      </div>

      <InvoicePreviewDrawer open={previewOpen} onClose={() => setPreviewOpen(false)}
        files={(inv.invoiceFiles as { fileName: string; fileType: string; fileUrl?: string }[]) ?? [
          { fileName: S(inv.uploadFilename) || `${S(inv.invoiceNo)}.pdf`, fileType: "PDF" },
          { fileName: `${S(inv.invoiceNo)}.ofd`, fileType: "OFD" }, { fileName: `${S(inv.invoiceNo)}.xml`, fileType: "XML" },
        ]}
        recordedBy={S(inv.recordedBy)} uploadFilename={S(inv.uploadFilename)} createdAt={S(inv.createdAt)}
      />
    </div>
  );
}
