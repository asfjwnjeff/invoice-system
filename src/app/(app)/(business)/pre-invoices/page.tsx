"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface T { id: string; preInvoiceNo: string; buyerName: string; invoiceCategory: string; amountWithTax: number; reviewStatus: string; taxPushStatus: string; deliveryStatus: string; customer?: { name: string }; createdAt: string; }

const invoiceCategoryLabels: Record<string, string> = {
  DIGITAL_SPECIAL: "数电专票", DIGITAL_NORMAL: "数电普票",
  VAT_SPECIAL: "增值税专票", VAT_NORMAL: "增值税普票", E_NORMAL: "电子普票",
};

const reviewStatusLabels: Record<string, string> = {
  DRAFT: "草稿", PENDING_FIRST: "待一审", FIRST_APPROVED: "一审通过",
  PENDING_SECOND: "待二审", APPROVED: "已审批", REJECTED: "已驳回",
};

const taxPushLabels: Record<string, string> = {
  PENDING: "待推送", PUSHED: "已推送", FAILED: "推送失败",
};

const deliveryLabels: Record<string, string> = {
  PENDING: "待交付", DELIVERED: "已交付",
};

const reviewSv = (s: string): "success" | "warning" | "danger" | "neutral" =>
  s === "APPROVED" ? "success" : s === "REJECTED" ? "danger" :
  s === "DRAFT" ? "neutral" : "warning";

export default function PreInvoicesPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("");

  const { data } = useQuery({
    queryKey: ["pre-invoices", statusFilter],
    queryFn: async () => {
      const url = statusFilter ? `/api/pre-invoices?status=${statusFilter}` : "/api/pre-invoices";
      const r = await fetch(url); return (await r.json()).data as { items: T[] };
    },
  });

  // Batch second review
  const batchReview = useMutation({
    mutationFn: async () => {
      const results = [];
      for (const id of selected) {
        const r = await fetch(`/api/pre-invoices/${id}/review`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "second_approve", comment: "批量审核通过" }),
        });
        results.push(await r.json());
      }
      return results;
    },
    onSuccess: () => {
      toast.success(`已批量通过${selected.length}条二审`);
      setSelected([]);
      qc.invalidateQueries({ queryKey: ["pre-invoices"] });
    },
    onError: () => toast.error("批量审核失败"),
  });

  // Batch push to tax bureau
  const batchPushTax = useMutation({
    mutationFn: async () => {
      const results = [];
      for (const id of selected) {
        const r = await fetch(`/api/pre-invoices/${id}/push-tax`, { method: "POST" });
        results.push(await r.json());
      }
      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter((r: Record<string, unknown>) => r.success).length;
      toast.success(`已推送${successCount}条至税局`);
      setSelected([]);
      qc.invalidateQueries({ queryKey: ["pre-invoices"] });
    },
    onError: () => toast.error("推送失败"),
  });

  const cols: ColumnDef<T>[] = [
    { accessorKey: "preInvoiceNo", header: "预制发票号", cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.preInvoiceNo}</span> },
    { accessorKey: "buyerName", header: "购买方", cell: ({ row }) => <div><span>{row.original.buyerName}</span><p className="text-xs text-muted-foreground">{row.original.customer?.name || ""}</p></div> },
    { accessorKey: "invoiceCategory", header: "发票类型", cell: ({ row }) => invoiceCategoryLabels[row.original.invoiceCategory] || row.original.invoiceCategory },
    { accessorKey: "amountWithTax", header: "价税合计", cell: ({ row }) => <span className="tabular-nums">¥{row.original.amountWithTax.toLocaleString()}</span> },
    { accessorKey: "reviewStatus", header: "审核状态", cell: ({ row }) => <StatusBadge status={reviewStatusLabels[row.original.reviewStatus] || row.original.reviewStatus} variant={reviewSv(row.original.reviewStatus)} /> },
    { accessorKey: "taxPushStatus", header: "税局推送", cell: ({ row }) => <StatusBadge status={taxPushLabels[row.original.taxPushStatus] || row.original.taxPushStatus} variant={row.original.taxPushStatus === "PUSHED" ? "success" : "neutral"} /> },
    { accessorKey: "deliveryStatus", header: "交付状态", cell: ({ row }) => <StatusBadge status={deliveryLabels[row.original.deliveryStatus] || row.original.deliveryStatus} variant={row.original.deliveryStatus === "DELIVERED" ? "success" : "warning"} /> },
    { accessorKey: "createdAt", header: "创建时间", cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("zh-CN") },
    {
      id: "act", header: "操作",
      cell: ({ row }) => {
        const s = row.original.reviewStatus;
        return (
          <div className="flex gap-1 flex-wrap">
            <Link href={`/pre-invoices/${row.original.id}`}><Button variant="ghost" size="sm" className="h-8">查看</Button></Link>
            {s === "DRAFT" && <Button variant="ghost" size="sm" className="h-8 text-accent" onClick={async () => {
              const r = await fetch(`/api/pre-invoices/${row.original.id}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "submit_first" }) });
              const j = await r.json();
              if (j.success) { toast.success("已提交一审"); qc.invalidateQueries({ queryKey: ["pre-invoices"] }); } else toast.error(j.error || "失败");
            }}>提交一审</Button>}
            {s === "PENDING_FIRST" && <Button variant="ghost" size="sm" className="h-8 text-accent" onClick={async () => {
              const r = await fetch(`/api/pre-invoices/${row.original.id}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "first_approve", comment: "审核通过" }) });
              const j = await r.json();
              if (j.success) { toast.success("一审已通过"); qc.invalidateQueries({ queryKey: ["pre-invoices"] }); } else toast.error(j.error || "失败");
            }}>一审通过</Button>}
            {s === "FIRST_APPROVED" && <Button variant="ghost" size="sm" className="h-8 text-accent" onClick={async () => {
              const r = await fetch(`/api/pre-invoices/${row.original.id}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "submit_second" }) });
              const j = await r.json();
              if (j.success) { toast.success("已提交二审"); qc.invalidateQueries({ queryKey: ["pre-invoices"] }); } else toast.error(j.error || "失败");
            }}>提交二审</Button>}
            {s === "PENDING_SECOND" && <Button variant="ghost" size="sm" className="h-8 text-accent" onClick={async () => {
              const r = await fetch(`/api/pre-invoices/${row.original.id}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "second_approve", comment: "审核通过" }) });
              const j = await r.json();
              if (j.success) { toast.success("二审已通过"); qc.invalidateQueries({ queryKey: ["pre-invoices"] }); } else toast.error(j.error || "失败");
            }}>二审通过</Button>}
            {s === "APPROVED" && row.original.taxPushStatus === "PENDING" && <Button variant="ghost" size="sm" className="h-8 text-accent" onClick={async () => {
              const r = await fetch(`/api/pre-invoices/${row.original.id}/push-tax`, { method: "POST" });
              const j = await r.json();
              if (j.success) { toast.success("已推送税局: " + j.data.invoiceNo); qc.invalidateQueries({ queryKey: ["pre-invoices"] }); } else toast.error(j.error || "推送失败");
            }}>推送税局</Button>}
          </div>
        );
      },
    },
  ];

  const filtered = data?.items ?? [];
  const canBatchReview = selected.length > 0 && selected.every(id => {
    const item = filtered.find(i => i.id === id);
    return item?.reviewStatus === "PENDING_SECOND";
  });
  const canBatchPushTax = selected.length > 0 && selected.every(id => {
    const item = filtered.find(i => i.id === id);
    return item?.reviewStatus === "APPROVED" && item?.taxPushStatus === "PENDING";
  });

  return (
    <div>
      <PageHeader title="预制发票" description="从已审批的开票申请生成，经过两次审核后推送税局" actionLabel="生成预制发票" onAction={() => router.push("/pre-invoices/new")} />
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs text-muted-foreground">审核状态:</span>
        {["全部", "草稿", "待一审", "一审通过", "待二审", "已审批", "已驳回"].map(s => {
          const val = s === "全部" ? "" : s === "草稿" ? "DRAFT" : s === "待一审" ? "PENDING_FIRST" : s === "一审通过" ? "FIRST_APPROVED" : s === "待二审" ? "PENDING_SECOND" : s === "已审批" ? "APPROVED" : "REJECTED";
          return (
            <Button key={s} variant={statusFilter === val || (s === "全部" && !statusFilter) ? "default" : "outline"} size="sm" className="h-7 text-xs"
              onClick={() => setStatusFilter(s === "全部" ? "" : val)}>{s}</Button>
          );
        })}
      </div>
      <DataTable columns={cols} data={filtered} searchKey="buyerName" searchPlaceholder="搜索购买方..."
        selectable selectedIds={selected} onSelectionChange={setSelected}
        batchBar={
          <div className="flex gap-2">
            {canBatchReview && <Button size="sm" onClick={() => batchReview.mutate()} disabled={batchReview.isPending} className="bg-emerald-600 hover:bg-emerald-700">批量二审通过({selected.length})</Button>}
            {canBatchPushTax && <Button size="sm" onClick={() => batchPushTax.mutate()} disabled={batchPushTax.isPending}>批量推送税局({selected.length})</Button>}
          </div>
        }
      />
    </div>
  );
}
