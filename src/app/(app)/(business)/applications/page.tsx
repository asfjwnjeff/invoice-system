"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface T { id: string; applicationNo: string; buyerName: string; buyerTaxNo: string; invoiceCategory: string; amountWithoutTax: number; taxAmount: number; amountWithTax: number; status: string; cashierName: string | null; drawerName: string | null; sellerName: string | null; taxSubject?: { name: string; taxNo: string } | null; createdAt: string; }

const appStatusLabels: Record<string, string> = { DRAFT: "草稿", PENDING_APPROVAL: "待审批", APPROVED: "已审批", REJECTED: "已驳回", ISSUED: "已开票", CONVERTED: "已制单" };
const invoiceCategoryLabels: Record<string, string> = { DIGITAL_SPECIAL: "数电专票", DIGITAL_NORMAL: "数电普票", VAT_SPECIAL: "增值税专票", VAT_NORMAL: "增值税普票", E_NORMAL: "电子普票" };

export default function ApplicationsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("");

  const { data } = useQuery({ queryKey: ["applications"], queryFn: async () => { const r = await fetch("/api/applications"); return (await r.json()).data as { items: T[] }; } });

  const sv = (s: string): "success" | "warning" | "danger" | "neutral" => s === "ISSUED" || s === "APPROVED" ? "success" : s === "PENDING_APPROVAL" ? "warning" : s === "REJECTED" ? "danger" : "neutral";

  const cols: ColumnDef<T>[] = [
    { accessorKey: "applicationNo", header: "申请号", cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.applicationNo}</span> },
    { accessorKey: "buyerName", header: "购买方", cell: ({ row }) => <div><span>{row.original.buyerName}</span>{row.original.buyerTaxNo && <p className="text-xs text-muted-foreground">{row.original.buyerTaxNo}</p>}</div> },
    { accessorKey: "invoiceCategory", header: "发票类型", cell: ({ row }) => invoiceCategoryLabels[row.original.invoiceCategory] || row.original.invoiceCategory },
    { accessorKey: "amountWithoutTax", header: "未税金额", cell: ({ row }) => <span className="tabular-nums">¥{(row.original.amountWithoutTax ?? 0).toLocaleString()}</span> },
    { accessorKey: "taxAmount", header: "税额", cell: ({ row }) => <span className="tabular-nums">¥{(row.original.taxAmount ?? 0).toLocaleString()}</span> },
    { accessorKey: "amountWithTax", header: "价税合计", cell: ({ row }) => <span className="tabular-nums">¥{(row.original.amountWithTax ?? 0).toLocaleString()}</span> },
    { accessorKey: "sellerName", header: "销方", cell: ({ row }) => row.original.sellerName || row.original.taxSubject?.name || "-" },
    { accessorKey: "drawerName", header: "开票人", cell: ({ row }) => row.original.drawerName || "-" },
    { accessorKey: "status", header: "状态", cell: ({ row }) => <StatusBadge status={appStatusLabels[row.original.status] ?? row.original.status} variant={sv(row.original.status)} /> },
    { accessorKey: "createdAt", header: "创建时间", cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("zh-CN") },
    {
      id: "act", header: "操作",
      cell: ({ row }) => (
        <div className="flex gap-1 flex-wrap">
          <Link href={"/applications/" + row.original.id}><Button variant="ghost" size="sm" className="h-8">查看</Button></Link>
          {row.original.status === "DRAFT" && <>
            <Button variant="ghost" size="sm" className="h-8 text-accent" onClick={async () => {
              const r = await fetch("/api/approvals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "submit", entityType: "APPLICATION", entityId: row.original.id, entityTitle: row.original.applicationNo }) });
              const j = await r.json();
              if (j.success) toast.success("已提交审批"); else toast.error(j.error || "失败");
              qc.invalidateQueries({ queryKey: ["applications"] });
            }}>提交审核</Button>
            <Link href={`/applications/${row.original.id}/edit`}><Button variant="ghost" size="sm" className="h-8">编辑</Button></Link>
          </>}
          {row.original.status === "APPROVED" && <Link href={`/pre-invoices/new?appId=${row.original.id}`}><Button variant="ghost" size="sm" className="h-8 text-accent">生成预制发票</Button></Link>}
        </div>
      ),
    },
  ];

  const filtered = statusFilter ? (data?.items ?? []).filter(i => appStatusLabels[i.status] === statusFilter) : (data?.items ?? []);

  return (
    <div>
      <PageHeader title="开票申请" description="由收入订单生成的正式开票请求单据" actionLabel="新建申请" onAction={() => router.push("/applications/new")} />
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground">状态:</span>
        {["全部", "草稿", "待审批", "已审批", "已开票", "已驳回"].map(s => (
          <Button key={s} variant={statusFilter === s || (s === "全部" && !statusFilter) ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setStatusFilter(s === "全部" ? "" : s)}>{s}</Button>
        ))}
      </div>
      <DataTable columns={cols} data={filtered} searchKey="buyerName" searchPlaceholder="搜索购买方..." />
    </div>
  );
}
