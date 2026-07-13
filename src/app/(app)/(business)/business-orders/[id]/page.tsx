"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "sonner";

const orderTypeLabels: Record<string, string> = { COMPREHENSIVE: "综合服务", ADVANCE_ONLY: "代垫专项", REVENUE_ONLY: "收入专项", COST_ONLY: "成本专项" };
const statusLabels: Record<string, string> = { DRAFT: "草稿", ACTIVE: "执行中", COMPLETED: "已完成", CANCELLED: "已取消" };
const invoiceStatusLabels: Record<string, string> = { NOT_INVOICED: "未开票", PARTIALLY: "部分开票", INVOICED: "已开票" };
const feeTypeLabels: Record<string, string> = { CUSTOMS_DUTY: "关税", IMPORT_VAT: "进口增值税", INSPECTION_FEE: "商检费", PORT_FEE: "港口费", INSURANCE: "保险费", EXPRESS_FEE: "快递费", CUSTOMS_SERVICE: "关务服务", WAREHOUSE_SERVICE: "仓储服务", TRANSPORT_SERVICE: "运输服务", AGENCY_SERVICE: "代理服务", OTHER_ADVANCE: "其他" };
const currencyLabels: Record<string, string> = { CNY: "人民币", USD: "美元", HKD: "港币", EUR: "欧元" };
const advStatusLabels: Record<string, string> = { COLLECTED: "已收款", PARTIALLY_COLLECTED: "部分收款", PENDING: "未收款" };
const deductStatusLabels: Record<string, string> = { DEDUCTED: "已抵扣", PENDING: "未抵扣", FAILED: "抵扣失败" };

interface T {
  id: string; orderNo: string; orderType: string; title: string; status: string;
  totalAdvanceAmount: number; collectedAdvanceAmount: number; uncollectedAdvanceAmount: number;
  totalRevenueAmount: number; invoicedAmount: number; availableAmount: number;
  currency: string; startDate: string; endDate: string; remark: string;
  customer?: { id: string; name: string; shortName: string };
  revenueOrders?: { id: string; orderNo: string; title: string; totalRevenueAmount: number; invoiceStatus: string }[];
  advancePayments?: { id: string; advanceNo: string; feeType: string; originalAmount: number; currency: string; collectionStatus: string }[];
  feeItems?: { id: string; feeNo: string; description: string; amount: number; feeType: string; isInvoiced: boolean }[];
  inputInvoices?: { id: string; invoiceNo: string; supplier?: { name: string } | null; amountWithTax: number; costCenter?: { name: string } | null; deductStatus: string }[];
  createdAt: string; updatedAt: string;
}

export default function BusinessOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"detail" | "related" | "log">("detail");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ["business-order", id],
    queryFn: async () => {
      const r = await fetch(`/api/business-orders/${id}`);
      const j = await r.json();
      return j.data as T;
    },
  });

  const dm = useMutation({
    mutationFn: async (orderId: string) => {
      const r = await fetch(`/api/business-orders/${orderId}`, { method: "DELETE" });
      return r.json();
    },
    onSuccess: (r) => {
      if (r.success) { toast.success("已删除"); qc.invalidateQueries({ queryKey: ["business-orders"] }); router.push("/business-orders"); }
      else toast.error(r.error ?? "删除失败");
    },
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">加载中...</div>;
  if (!order) return <div className="p-8 text-destructive">订单不存在</div>;

  const statusV = (s: string): "success" | "warning" | "danger" | "neutral" =>
    s === "ACTIVE" ? "success" : s === "COMPLETED" ? "neutral" : s === "CANCELLED" ? "danger" : "neutral";

  const dedV = (s: string): "success" | "warning" | "danger" | "neutral" =>
    s === "DEDUCTED" ? "success" : s === "FAILED" ? "danger" : "warning";

  const totalRelated = (order.revenueOrders?.length ?? 0) + (order.advancePayments?.length ?? 0) + (order.inputInvoices?.length ?? 0) + (order.feeItems?.length ?? 0);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center gap-4">
        <Link href="/business-orders"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{order.orderNo}</h1>
            <StatusBadge status={statusLabels[order.status] ?? order.status} variant={statusV(order.status)} />
          </div>
          <p className="text-muted-foreground mt-1">{order.title}</p>
        </div>
        <Link href={`/business-orders/${order.id}/edit`}><Button variant="outline"><Pencil className="h-4 w-4 mr-2" />编辑</Button></Link>
        <Button variant="destructive" onClick={() => setDeleteId(order.id)}><Trash2 className="h-4 w-4 mr-2" />删除</Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b gap-0">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "detail" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("detail")}
        >详情</button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "related" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("related")}
        >关联数据 ({totalRelated})</button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "log" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("log")}
        >操作日志</button>
      </div>

      {/* Tab: Detail */}
      {activeTab === "detail" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">基本信息</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">订单号</span><p className="font-medium">{order.orderNo}</p></div>
                <div><span className="text-muted-foreground">类型</span><p>{orderTypeLabels[order.orderType] ?? order.orderType}</p></div>
                <div><span className="text-muted-foreground">客户</span><p><Link href="/customers" className="text-primary hover:underline">{order.customer?.name ?? "-"}{order.customer?.shortName ? ` (${order.customer.shortName})` : ""}</Link></p></div>
                <div><span className="text-muted-foreground">币种</span><p>{currencyLabels[order.currency] ?? order.currency}</p></div>
                <div><span className="text-muted-foreground">开始日期</span><p>{order.startDate?.slice(0, 10) ?? "-"}</p></div>
                <div><span className="text-muted-foreground">结束日期</span><p>{order.endDate?.slice(0, 10) ?? "-"}</p></div>
                <div className="col-span-2"><span className="text-muted-foreground">备注</span><p>{order.remark || "-"}</p></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">金额信息</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-4 text-sm">
                <div className="col-span-3 border-b pb-2 mb-1"><span className="text-xs text-muted-foreground uppercase tracking-wider">代垫相关</span></div>
                <div><span className="text-muted-foreground">代垫总额</span><p className="font-medium tabular-nums">¥{order.totalAdvanceAmount.toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">已收回</span><p className="tabular-nums">¥{order.collectedAdvanceAmount.toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">未收回</span><p className="tabular-nums text-warning">¥{order.uncollectedAdvanceAmount.toLocaleString()}</p></div>
                <div className="col-span-3 border-b pb-2 mb-1"><span className="text-xs text-muted-foreground uppercase tracking-wider">收入相关</span></div>
                <div><span className="text-muted-foreground">收入总额</span><p className="font-medium tabular-nums">¥{order.totalRevenueAmount.toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">已开票</span><p className="tabular-nums">¥{order.invoicedAmount.toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">可开票余额</span><p className="tabular-nums">¥{order.availableAmount.toLocaleString()}</p></div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">金额汇总</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">代垫总额</span>
                    <span className="font-medium tabular-nums">¥{order.totalAdvanceAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs bg-emerald-50 text-emerald-600">已收回 {order.totalAdvanceAmount > 0 ? Math.round((order.collectedAdvanceAmount / order.totalAdvanceAmount) * 100) : 0}%</span>
                    <span className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs bg-amber-50 text-amber-600">未收回 {order.totalAdvanceAmount > 0 ? Math.round((order.uncollectedAdvanceAmount / order.totalAdvanceAmount) * 100) : 0}%</span>
                  </div>
                </div>
                <div className="border-t pt-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">收入总额</span>
                    <span className="font-medium tabular-nums">¥{order.totalRevenueAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs bg-blue-50 text-blue-600">已开票 {order.totalRevenueAmount > 0 ? Math.round((order.invoicedAmount / order.totalRevenueAmount) * 100) : 0}%</span>
                    <span className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs bg-purple-50 text-purple-600">可开票 {order.totalRevenueAmount > 0 ? Math.round((order.availableAmount / order.totalRevenueAmount) * 100) : 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">快捷操作</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Link href="/revenue-orders" className="block"><Button variant="outline" className="w-full justify-start text-sm">收入订单</Button></Link>
                <Link href="/advance-payments" className="block"><Button variant="outline" className="w-full justify-start text-sm">代垫管理</Button></Link>
                <Link href="/input-invoices" className="block"><Button variant="outline" className="w-full justify-start text-sm">进项发票</Button></Link>
                <Link href="/customer-settlements" className="block"><Button variant="outline" className="w-full justify-start text-sm">客户结算</Button></Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab: Related */}
      {activeTab === "related" && (
        <div className="space-y-6">
          {/* Revenue Orders */}
          {order.revenueOrders && order.revenueOrders.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">关联收入订单 ({order.revenueOrders.length})</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>订单号</TableHead><TableHead>标题</TableHead><TableHead>收入总额</TableHead><TableHead>开票状态</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {order.revenueOrders.map(ro => (
                      <TableRow key={ro.id}>
                        <TableCell className="font-medium tabular-nums">{ro.orderNo}</TableCell>
                        <TableCell>{ro.title}</TableCell>
                        <TableCell className="tabular-nums">¥{ro.totalRevenueAmount.toLocaleString()}</TableCell>
                        <TableCell><StatusBadge status={invoiceStatusLabels[ro.invoiceStatus] ?? ro.invoiceStatus} variant={ro.invoiceStatus === "INVOICED" ? "success" : "warning"} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Advance Payments */}
          {order.advancePayments && order.advancePayments.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">关联代垫 ({order.advancePayments.length})</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>代垫单号</TableHead><TableHead>费用类型</TableHead><TableHead>原币金额</TableHead><TableHead>币种</TableHead><TableHead>收款状态</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {order.advancePayments.map(ap => (
                      <TableRow key={ap.id}>
                        <TableCell className="font-medium tabular-nums">{ap.advanceNo}</TableCell>
                        <TableCell>{feeTypeLabels[ap.feeType] ?? ap.feeType}</TableCell>
                        <TableCell className="tabular-nums">¥{ap.originalAmount.toLocaleString()}</TableCell>
                        <TableCell>{ap.currency}</TableCell>
                        <TableCell><StatusBadge status={advStatusLabels[ap.collectionStatus] ?? ap.collectionStatus} variant={ap.collectionStatus === "COLLECTED" ? "success" : "warning"} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Input Invoices (NEW) */}
          {order.inputInvoices && order.inputInvoices.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">关联进项发票 ({order.inputInvoices.length})</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>发票号</TableHead><TableHead>供应商</TableHead><TableHead>含税金额</TableHead><TableHead>成本中心</TableHead><TableHead>抵扣状态</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {order.inputInvoices.map(inv => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium tabular-nums">{inv.invoiceNo}</TableCell>
                        <TableCell>{inv.supplier?.name ?? "-"}</TableCell>
                        <TableCell className="tabular-nums">¥{Number(inv.amountWithTax).toLocaleString()}</TableCell>
                        <TableCell>{inv.costCenter?.name ?? "-"}</TableCell>
                        <TableCell><StatusBadge status={deductStatusLabels[inv.deductStatus] ?? inv.deductStatus} variant={dedV(inv.deductStatus)} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Fee Items (NEW) */}
          {order.feeItems && order.feeItems.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">费用明细 ({order.feeItems.length})</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>费用单号</TableHead><TableHead>描述</TableHead><TableHead>费用类型</TableHead><TableHead>金额</TableHead><TableHead>开票状态</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {order.feeItems.map(fi => (
                      <TableRow key={fi.id}>
                        <TableCell className="font-medium tabular-nums">{fi.feeNo}</TableCell>
                        <TableCell>{fi.description ?? "-"}</TableCell>
                        <TableCell>{feeTypeLabels[fi.feeType] ?? fi.feeType}</TableCell>
                        <TableCell className="tabular-nums">¥{Number(fi.amount).toLocaleString()}</TableCell>
                        <TableCell><StatusBadge status={fi.isInvoiced ? "已开票" : "未开票"} variant={fi.isInvoiced ? "success" : "warning"} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {totalRelated === 0 && (
            <Card><CardContent className="py-8 text-center text-muted-foreground">暂无关联数据</CardContent></Card>
          )}
        </div>
      )}

      {/* Tab: Log (placeholder) */}
      {activeTab === "log" && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">操作日志功能开发中...</CardContent></Card>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="确认删除"
        description="确认要删除此业务订单吗？此操作不可撤销。"
        confirmLabel="删除"
        variant="danger"
        loading={dm.isPending}
        onConfirm={() => deleteId && dm.mutate(deleteId)}
      />
    </div>
  );
}
