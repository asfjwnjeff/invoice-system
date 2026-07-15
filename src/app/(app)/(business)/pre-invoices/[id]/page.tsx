"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/status-badge";
import { ArrowLeft, Check, X, Send } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const invoiceCategoryLabels: Record<string, string> = {
  DIGITAL_SPECIAL: "数电专票", DIGITAL_NORMAL: "数电普票",
  VAT_SPECIAL: "增值税专票", VAT_NORMAL: "增值税普票", E_NORMAL: "电子普票",
};

const reviewStatusLabels: Record<string, string> = {
  DRAFT: "草稿", PENDING_FIRST: "待一审", FIRST_APPROVED: "一审通过",
  PENDING_SECOND: "待二审", APPROVED: "已审批", REJECTED: "已驳回",
};

const reviewSv = (s: string): "success" | "warning" | "danger" | "neutral" =>
  s === "APPROVED" || s === "FIRST_APPROVED" ? "success" : s === "REJECTED" ? "danger" :
  s === "DRAFT" ? "neutral" : "warning";

export default function PreInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [comment, setComment] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["pre-invoice", id],
    queryFn: async () => { const r = await fetch(`/api/pre-invoices/${id}`); return (await r.json()).data as Record<string, unknown>; },
    enabled: !!id,
  });

  const reviewMut = useMutation({
    mutationFn: async (action: string) => {
      const r = await fetch(`/api/pre-invoices/${id}/review`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment }),
      });
      return r.json();
    },
    onSuccess: (r) => {
      if (r.success) {
        toast.success("操作成功");
        setComment("");
        qc.invalidateQueries({ queryKey: ["pre-invoice", id] });
        qc.invalidateQueries({ queryKey: ["pre-invoices"] });
      } else toast.error(r.error ?? "操作失败");
    },
  });

  const pushTaxMut = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/pre-invoices/${id}/push-tax`, { method: "POST" });
      return r.json();
    },
    onSuccess: (r) => {
      if (r.success) { toast.success("已推送税局: " + r.data.invoiceNo); qc.invalidateQueries({ queryKey: ["pre-invoice", id] }); }
      else toast.error(r.error ?? "推送失败");
    },
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">加载中...</div>;
  if (!data) return <div className="p-8 text-destructive">预制发票不存在</div>;

  const pi = data as Record<string, unknown>;
  const items = (pi.items as Record<string, unknown>[]) || [];
  const rs = String(pi.reviewStatus || "");
  const getStr = (v: unknown) => (v as string) || "";

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/pre-invoices"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-xl font-semibold flex-1">{pi.preInvoiceNo as string}</h1>
        <StatusBadge status={reviewStatusLabels[rs] || rs} variant={reviewSv(rs)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Review Actions */}
          <Card>
            <CardHeader><CardTitle className="text-base">审核操作</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">审核状态：</span><StatusBadge status={reviewStatusLabels[rs] || rs} variant={reviewSv(rs)} /></div>
                  <div><span className="text-muted-foreground">税局推送：</span><StatusBadge status={(pi.taxPushStatus as string) === "PUSHED" ? "已推送" : "待推送"} variant={(pi.taxPushStatus as string) === "PUSHED" ? "success" : "neutral"} /></div>
                  {Boolean(pi.firstReviewedAt) && <div><span className="text-muted-foreground">一审时间：</span>{new Date(getStr(pi.firstReviewedAt)).toLocaleString("zh-CN")}</div>}
                  {Boolean(pi.secondReviewedAt) && <div><span className="text-muted-foreground">二审时间：</span>{new Date(getStr(pi.secondReviewedAt)).toLocaleString("zh-CN")}</div>}
                  {Boolean(pi.firstReviewComment) && <div className="col-span-2"><span className="text-muted-foreground">一审意见：</span>{getStr(pi.firstReviewComment)}</div>}
                  {Boolean(pi.secondReviewComment) && <div className="col-span-2"><span className="text-muted-foreground">二审意见：</span>{getStr(pi.secondReviewComment)}</div>}
                </div>

                {rs !== "APPROVED" && rs !== "REJECTED" ? (
                  <>
                    <div className="space-y-2"><Label>审核意见</Label><Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="输入审核意见..." rows={3} /></div>
                    <div className="flex gap-2 flex-wrap">
                      {rs === "DRAFT" && (
                        <Button onClick={() => reviewMut.mutate("submit_first")} disabled={reviewMut.isPending} className="bg-accent">
                          <Send className="h-4 w-4 mr-2" />提交一审
                        </Button>
                      )}
                      {rs === "PENDING_FIRST" && (
                        <>
                          <Button onClick={() => reviewMut.mutate("first_approve")} disabled={reviewMut.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                            <Check className="h-4 w-4 mr-2" />一审通过
                          </Button>
                          <Button onClick={() => reviewMut.mutate("first_reject")} disabled={reviewMut.isPending} variant="destructive">
                            <X className="h-4 w-4 mr-2" />一审驳回
                          </Button>
                        </>
                      )}
                      {rs === "FIRST_APPROVED" && (
                        <Button onClick={() => reviewMut.mutate("submit_second")} disabled={reviewMut.isPending} className="bg-accent">
                          <Send className="h-4 w-4 mr-2" />提交二审
                        </Button>
                      )}
                      {rs === "PENDING_SECOND" && (
                        <>
                          <Button onClick={() => reviewMut.mutate("second_approve")} disabled={reviewMut.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                            <Check className="h-4 w-4 mr-2" />二审通过
                          </Button>
                          <Button onClick={() => reviewMut.mutate("second_reject")} disabled={reviewMut.isPending} variant="destructive">
                            <X className="h-4 w-4 mr-2" />二审驳回
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                ) : rs === "APPROVED" ? (
                  <div className="space-y-2">
                    <p className="text-sm text-emerald-600 font-medium">两次审核已通过，可以推送税局</p>
                    <Button onClick={() => pushTaxMut.mutate()} disabled={pushTaxMut.isPending || (pi.taxPushStatus as string) === "PUSHED"} className="bg-accent">
                      <Send className="h-4 w-4 mr-2" />{(pi.taxPushStatus as string) === "PUSHED" ? "已推送税局" : "推送税局"}
                    </Button>
                    {(pi.taxPushStatus as string) === "PUSHED" && Boolean(pi.outputInvoiceId) && (
                      <Link href={`/invoices/${pi.outputInvoiceId}`} className="block mt-2">
                        <Button variant="outline" size="sm">查看已开具发票 →</Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-destructive font-medium">审核已驳回</p>
                    <Button onClick={() => reviewMut.mutate("submit_first")} disabled={reviewMut.isPending} variant="outline">重新提交一审</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader><CardTitle className="text-base">开票明细</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-muted-foreground text-xs">
                    <th className="text-left py-2 px-2">#</th><th className="text-left py-2 px-2">项目名称</th><th className="text-left py-2 px-2">税编</th><th className="text-right py-2 px-2">数量</th><th className="text-right py-2 px-2">单价</th><th className="text-right py-2 px-2">金额</th><th className="text-right py-2 px-2">税率</th><th className="text-right py-2 px-2">税额</th><th className="text-right py-2 px-2">合计</th>
                  </tr></thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-2 px-2">{idx + 1}</td>
                        <td className="py-2 px-2 font-medium">{item.itemName as string}</td>
                        <td className="py-2 px-2 text-xs">{item.taxClassificationCode as string || "-"}</td>
                        <td className="py-2 px-2 text-right">{item.quantity as number}</td>
                        <td className="py-2 px-2 text-right">¥{(item.unitPrice as number)?.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right tabular-nums">¥{(item.amount as number)?.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right">{item.taxRate as number}%</td>
                        <td className="py-2 px-2 text-right tabular-nums">¥{(item.taxAmount as number)?.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right tabular-nums font-medium">¥{(item.totalAmount as number)?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-6 text-sm pt-3 border-t mt-3">
                <span>不含税: <strong className="tabular-nums">¥{(pi.amountWithoutTax as number)?.toLocaleString()}</strong></span>
                <span>税额: <strong className="tabular-nums">¥{(pi.taxAmount as number)?.toLocaleString()}</strong></span>
                <span>价税合计: <strong className="tabular-nums">¥{(pi.amountWithTax as number)?.toLocaleString()}</strong></span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Buyer Info */}
          <Card>
            <CardHeader><CardTitle className="text-base">购买方信息</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">名称：</span>{String(pi.buyerName || "")}</div>
              {Boolean(pi.buyerTaxNo) && <div><span className="text-muted-foreground">税号：</span>{String(pi.buyerTaxNo)}</div>}
              {Boolean(pi.buyerAddress) && <div><span className="text-muted-foreground">地址：</span>{String(pi.buyerAddress)}</div>}
              {Boolean(pi.buyerPhone) && <div><span className="text-muted-foreground">电话：</span>{String(pi.buyerPhone)}</div>}
              {Boolean(pi.buyerBankName) && <div><span className="text-muted-foreground">开户行：</span>{String(pi.buyerBankName)}</div>}
              {Boolean(pi.buyerBankAccount) && <div><span className="text-muted-foreground">账号：</span>{String(pi.buyerBankAccount)}</div>}
            </CardContent>
          </Card>

          {/* Invoice Info */}
          <Card>
            <CardHeader><CardTitle className="text-base">发票信息</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">票种：</span>{invoiceCategoryLabels[String(pi.invoiceCategory || "")] || String(pi.invoiceCategory || "")}</div>
              {Boolean(pi.sellerName) && <div><span className="text-muted-foreground">销售方：</span>{String(pi.sellerName)}</div>}
              {Boolean(pi.sellerTaxNo) && <div><span className="text-muted-foreground">销售方税号：</span>{String(pi.sellerTaxNo)}</div>}
              <div><span className="text-muted-foreground">客户：</span>{String(((pi.customer as Record<string, unknown>)?.name) || "-")}</div>
            </CardContent>
          </Card>

          {/* Remarks */}
          {Boolean(pi.remark) && (
            <Card>
              <CardHeader><CardTitle className="text-base">发票备注</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{String(pi.remark || "")}</p></CardContent>
            </Card>
          )}

          {/* Source Info */}
          {Boolean(pi.application) && (
            <Card>
              <CardHeader><CardTitle className="text-base">来源信息</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">来源申请：</span>
                  <Link href={`/applications/${(pi.application as Record<string, unknown>).id}`} className="text-accent hover:underline">
                    {(pi.application as Record<string, unknown>).applicationNo as string}
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Output Invoice Link */}
          {Boolean(pi.outputInvoiceId) && (
            <Card className="border-emerald-200">
              <CardHeader><CardTitle className="text-base text-emerald-700">已开具发票</CardTitle></CardHeader>
              <CardContent>
                <Link href={`/invoices/${pi.outputInvoiceId}`} className="text-accent hover:underline text-sm">
                  查看销项发票 →
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
