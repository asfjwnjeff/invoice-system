"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";

const catLabels: Record<string, string> = { DIGITAL_SPECIAL: "数电专票", DIGITAL_NORMAL: "数电普票", VAT_SPECIAL: "增值税专票", VAT_NORMAL: "增值税普票", E_NORMAL: "电子普票" };
const appStatusLabels: Record<string, string> = { DRAFT: "草稿", PENDING_APPROVAL: "待审批", APPROVED: "已审批", REJECTED: "已驳回", ISSUED: "已开票", CONVERTED: "已制单" };
const currencyLabels: Record<string, string> = { CNY: "人民币", USD: "美元", HKD: "港币", EUR: "欧元" };

const Field = ({ label, value }: { label: string; value: string }) => (
  <div><span className="text-xs text-muted-foreground">{label}</span><p className="text-sm">{value || "-"}</p></div>
);

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({ queryKey: ["application", id], queryFn: async () => { const r = await fetch(`/api/applications/${id}`); return (await r.json()).data as Record<string, unknown>; } });

  if (isLoading) return <div className="p-6 text-muted-foreground">加载中...</div>;
  if (!data) return <div className="p-6 text-muted-foreground">未找到申请</div>;

  const sv = (s: string): "success" | "warning" | "danger" | "neutral" => s === "ISSUED" || s === "APPROVED" ? "success" : s === "PENDING_APPROVAL" ? "warning" : s === "REJECTED" ? "danger" : "neutral";
  const S = (v: unknown) => String(v ?? "");
  const N = (v: unknown) => Number(v ?? 0);
  const items = (data.items as Record<string, unknown>[]) ?? [];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-3"><Link href="/applications"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link><div className="flex-1"><h1 className="text-xl font-semibold">开票申请详情</h1><p className="text-sm text-muted-foreground">{S(data.applicationNo)}</p></div><StatusBadge status={appStatusLabels[S(data.status)] ?? S(data.status)} variant={sv(S(data.status))} />{data.status === "DRAFT" && <Link href={`/applications/${id}/edit`}><Button variant="outline" size="sm"><Pencil className="h-3.5 w-3.5 mr-1" />编辑</Button></Link>}</div>

      {/* Row 1: 发票信息 */}
      <Card><CardHeader className="pb-3"><CardTitle className="text-base">发票信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-4 gap-4 text-sm">
          <Field label="申请号" value={S(data.applicationNo)} />
          <Field label="发票类型" value={catLabels[S(data.invoiceCategory)] ?? S(data.invoiceCategory)} />
          <Field label="记账币种" value={currencyLabels[S(data.currency)] ?? S(data.currency)} />
          <Field label="状态" value={appStatusLabels[S(data.status)] ?? S(data.status)} />
        </CardContent>
      </Card>

      {/* Row 2: 购方信息 + 金额汇总 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3"><CardHeader className="pb-3"><CardTitle className="text-base">购方信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <Field label="购方名称" value={S(data.buyerName)} />
            <Field label="购方纳税人识别号" value={S(data.buyerTaxNo)} />
            <div className="col-span-2"><span className="text-xs text-muted-foreground">购方地址电话</span><p className="text-sm">{S(data.buyerAddress) || "-"}</p></div>
            <div className="col-span-2"><span className="text-xs text-muted-foreground">购方银行账号</span><p className="text-sm">{[S(data.buyerBankName), S(data.buyerBankAccount)].filter(Boolean).join(" / ") || "-"}</p></div>
          </CardContent>
        </Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">金额汇总</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">未税合计</span><strong className="tabular-nums">¥{N(data.amountWithoutTax).toLocaleString()}</strong></div><div className="flex justify-between"><span className="text-muted-foreground">税额合计</span><strong className="tabular-nums">¥{N(data.taxAmount).toLocaleString()}</strong></div><div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">价税合计</span><strong className="tabular-nums text-base">¥{N(data.amountWithTax).toLocaleString()}</strong></div></div>
            <div className="mt-4"><span className="text-xs text-muted-foreground">记账金额（未税）</span><p className="text-sm tabular-nums">¥{N(data.amountWithoutTax).toLocaleString()}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: 项目明细 */}
      <Card><CardHeader className="pb-3"><CardTitle className="text-base">项目明细</CardTitle></CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm"><thead><tr className="border-b text-xs text-muted-foreground"><th className="text-left py-2 px-2">#</th><th className="text-left py-2 px-2">项目名称</th><th className="text-left py-2 px-2">规格型号</th><th className="text-left py-2 px-2">单位</th><th className="text-right py-2 px-2">数量</th><th className="text-right py-2 px-2">含税单价</th><th className="text-right py-2 px-2">未税金额</th><th className="text-right py-2 px-2">税率</th><th className="text-right py-2 px-2">税额</th></tr></thead>
                <tbody>{items.map((it: Record<string, unknown>, i: number) => (<tr key={S(it.id) || i} className="border-b last:border-0"><td className="py-2 px-2">{i + 1}</td><td className="py-2 px-2 font-medium">{S(it.itemName)}</td><td className="py-2 px-2">{S(it.spec) || "-"}</td><td className="py-2 px-2">{S(it.unit) || "-"}</td><td className="py-2 px-2 text-right tabular-nums">{N(it.quantity)}</td><td className="py-2 px-2 text-right tabular-nums">¥{N(it.unitPrice).toLocaleString()}</td><td className="py-2 px-2 text-right tabular-nums">¥{N(it.amount).toLocaleString()}</td><td className="py-2 px-2 text-right tabular-nums">{N(it.taxRate)}%</td><td className="py-2 px-2 text-right tabular-nums">¥{N(it.taxAmount).toLocaleString()}</td></tr>))}</tbody></table>
            </div>
          ) : <p className="text-sm text-muted-foreground py-4 text-center">暂无开票明细</p>}
          <div className="flex justify-end gap-6 text-sm pt-3 border-t mt-3"><span>未税合计: <strong className="tabular-nums">¥{N(data.amountWithoutTax).toLocaleString()}</strong></span><span>税额合计: <strong className="tabular-nums">¥{N(data.taxAmount).toLocaleString()}</strong></span><span>价税合计: <strong className="tabular-nums">¥{N(data.amountWithTax).toLocaleString()}</strong></span></div>
        </CardContent>
      </Card>

      {/* Row 4: 销方信息 + 人员信息 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3"><CardHeader className="pb-3"><CardTitle className="text-base">销方信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <Field label="销方名称" value={S(data.sellerName) || S((data.taxSubject as Record<string, unknown>)?.name)} />
            <Field label="销方纳税人识别号" value={S(data.sellerTaxNo) || S((data.taxSubject as Record<string, unknown>)?.taxNo)} />
            <div className="col-span-2"><span className="text-xs text-muted-foreground">销方地址电话</span><p className="text-sm">{S(data.sellerAddress) || S((data.taxSubject as Record<string, unknown>)?.address) || "-"}</p></div>
            <div className="col-span-2"><span className="text-xs text-muted-foreground">销方银行账号</span><p className="text-sm">{[S(data.sellerBankName), S(data.sellerBankAccount)].filter(Boolean).join(" / ") || "-"}</p></div>
          </CardContent>
        </Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">人员信息</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Field label="收款人" value={S(data.cashierName)} />
            <Field label="复核人" value={S(data.reviewerName)} />
            <Field label="开票人" value={S(data.drawerName)} />
          </CardContent>
        </Card>
      </div>

      {/* Row 5: 备注 + 来源/时间 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!!data.remark && <Card><CardHeader className="pb-3"><CardTitle className="text-base">备注</CardTitle></CardHeader><CardContent><p className="text-sm">{S(data.remark)}</p></CardContent></Card>}
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">来源与时间</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Field label="来源类型" value={S(data.sourceType) || "手工"} />
            {!!data.revenueOrder && <Field label="收入订单" value={S((data.revenueOrder as Record<string, unknown>)?.orderNo)} />}
            <Field label="创建时间" value={data.createdAt ? new Date(S(data.createdAt)).toLocaleString("zh-CN") : "-"} />
            <Field label="更新时间" value={data.updatedAt ? new Date(S(data.updatedAt)).toLocaleString("zh-CN") : "-"} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
