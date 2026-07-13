"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useEntitySelect } from "@/lib/hooks/use-entity-select";

const orderTypeLabels: Record<string, string> = { COMPREHENSIVE: "综合服务", ADVANCE_ONLY: "代垫专项", REVENUE_ONLY: "收入专项", COST_ONLY: "成本专项" };
const statusLabels: Record<string, string> = { DRAFT: "草稿", ACTIVE: "执行中", COMPLETED: "已完成", CANCELLED: "已取消" };

interface OrderData {
  orderNo: string; orderType: string; title: string; customerId: string; status: string;
  totalAdvanceAmount: number; collectedAdvanceAmount: number;
  totalRevenueAmount: number; invoicedAmount: number;
  currency: string; startDate: string; endDate: string; remark: string;
  revenueOrders?: unknown[]; advancePayments?: unknown[]; feeItems?: unknown[]; inputInvoices?: unknown[];
}

export default function BusinessOrderEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: customers } = useEntitySelect("/api/customers/select");

  const [f, setF] = useState({
    orderNo: "", orderType: "COMPREHENSIVE", title: "", customerId: "", status: "DRAFT",
    totalAdvanceAmount: 0, collectedAdvanceAmount: 0, totalRevenueAmount: 0, invoicedAmount: 0,
    currency: "CNY", startDate: "", endDate: "", remark: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: order, isLoading } = useQuery({
    queryKey: ["business-order", id],
    queryFn: async () => { const r = await fetch(`/api/business-orders/${id}`); const j = await r.json(); return j.data as OrderData; },
  });

  useEffect(() => {
    if (order) {
      setF({
        orderNo: order.orderNo ?? "", orderType: order.orderType ?? "COMPREHENSIVE", title: order.title ?? "",
        customerId: order.customerId ?? "", status: order.status ?? "DRAFT",
        totalAdvanceAmount: Number(order.totalAdvanceAmount ?? 0), collectedAdvanceAmount: Number(order.collectedAdvanceAmount ?? 0),
        totalRevenueAmount: Number(order.totalRevenueAmount ?? 0), invoicedAmount: Number(order.invoicedAmount ?? 0),
        currency: order.currency ?? "CNY", startDate: order.startDate?.slice(0, 10) ?? "", endDate: order.endDate?.slice(0, 10) ?? "", remark: order.remark ?? "",
      });
    }
  }, [order]);

  const mut = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/business-orders/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      return r.json();
    },
    onSuccess: (r) => {
      if (r.success) { toast.success("已保存"); qc.invalidateQueries({ queryKey: ["business-order"] }); qc.invalidateQueries({ queryKey: ["business-orders"] }); router.push(`/business-orders/${id}`); }
      else toast.error(r.error ?? "保存失败");
    },
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!f.orderNo.trim()) e.orderNo = "订单号不能为空";
    if (!f.title.trim()) e.title = "标题不能为空";
    if (!f.customerId) e.customerId = "请选择客户";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => { if (validate()) mut.mutate(); };

  const revCount = order?.revenueOrders?.length ?? 0;
  const advCount = order?.advancePayments?.length ?? 0;
  const feeCount = order?.feeItems?.length ?? 0;
  const invCount = order?.inputInvoices?.length ?? 0;

  if (isLoading) return <div className="p-8 text-muted-foreground">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/business-orders/${id}`}><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-semibold tracking-tight flex-1">编辑业务订单</h1>
        <Link href={`/business-orders/${id}`}><Button variant="outline"><X className="h-4 w-4 mr-2" />取消</Button></Link>
        <Button onClick={handleSave} disabled={mut.isPending}><Save className="h-4 w-4 mr-2" />{mut.isPending ? "保存中..." : "保存"}</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader><CardTitle className="text-base">基本信息</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>订单号 *</Label>
                <Input value={f.orderNo} onChange={e => setF({ ...f, orderNo: e.target.value })} />
                {errors.orderNo && <p className="text-xs text-destructive">{errors.orderNo}</p>}
              </div>
              <div className="space-y-2">
                <Label>类型</Label>
                <Select value={f.orderType} onValueChange={v => setF({ ...f, orderType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(orderTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>标题 *</Label>
                <Input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
              </div>
              <div className="space-y-2">
                <Label>客户 *</Label>
                <Select value={f.customerId} onValueChange={v => setF({ ...f, customerId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(customers ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
                {errors.customerId && <p className="text-xs text-destructive">{errors.customerId}</p>}
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <Select value={f.status} onValueChange={v => setF({ ...f, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>币种</Label>
                <Select value={f.currency} onValueChange={v => setF({ ...f, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="CNY">人民币</SelectItem><SelectItem value="USD">美元</SelectItem><SelectItem value="HKD">港币</SelectItem><SelectItem value="EUR">欧元</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>开始日期</Label>
                <Input type="date" value={f.startDate} onChange={e => setF({ ...f, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>结束日期</Label>
                <Input type="date" value={f.endDate} onChange={e => setF({ ...f, endDate: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          {/* Amount Info */}
          <Card>
            <CardHeader><CardTitle className="text-base">金额信息</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="col-span-2 border-b pb-2 mb-1"><span className="text-xs text-muted-foreground uppercase tracking-wider">代垫相关</span></div>
              <div className="space-y-2">
                <Label>代垫总额</Label>
                <Input type="number" value={f.totalAdvanceAmount} onChange={e => setF({ ...f, totalAdvanceAmount: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>已收取代垫</Label>
                <Input type="number" value={f.collectedAdvanceAmount} onChange={e => setF({ ...f, collectedAdvanceAmount: +e.target.value })} />
              </div>
              <div className="col-span-2 border-b pb-2 mb-1"><span className="text-xs text-muted-foreground uppercase tracking-wider">收入相关</span></div>
              <div className="space-y-2">
                <Label>收入总额</Label>
                <Input type="number" value={f.totalRevenueAmount} onChange={e => setF({ ...f, totalRevenueAmount: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>已开票金额</Label>
                <Input type="number" value={f.invoicedAmount} onChange={e => setF({ ...f, invoicedAmount: +e.target.value })} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>备注</Label>
                <Textarea value={f.remark} onChange={e => setF({ ...f, remark: e.target.value })} rows={3} placeholder="合同条款、特殊要求等" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">关联数据预览</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <Link href={`/business-orders/${id}?tab=related`} className="text-muted-foreground hover:text-foreground">收入订单</Link>
                <span className="font-medium">{revCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <Link href={`/business-orders/${id}?tab=related`} className="text-muted-foreground hover:text-foreground">代垫单</Link>
                <span className="font-medium">{advCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <Link href={`/business-orders/${id}?tab=related`} className="text-muted-foreground hover:text-foreground">进项发票</Link>
                <span className="font-medium">{invCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <Link href={`/business-orders/${id}?tab=related`} className="text-muted-foreground hover:text-foreground">费用明细</Link>
                <span className="font-medium">{feeCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">变更摘要</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>保存后生效。修改订单信息不会影响已创建的关联单据，仅更新订单本身的基础字段和金额汇总。</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
