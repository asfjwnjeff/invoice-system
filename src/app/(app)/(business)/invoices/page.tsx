"use client";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface T { id: string; invoiceNo: string; buyerName: string; invoiceType: string; amountWithTax: number; issueDate: string; deliveryStatus: string; }

export default function InvoicesPage() {
  const { data } = useQuery({ queryKey: ["invoices"], queryFn: async () => { const r = await fetch("/api/invoices"); return (await r.json()).data as { items: T[] }; } });

  const cols: ColumnDef<T>[] = [
    { accessorKey: "invoiceNo", header: "发票号码", cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.invoiceNo}</span> },
    { accessorKey: "buyerName", header: "购买方" },
    { accessorKey: "invoiceType", header: "类型" },
    { accessorKey: "amountWithTax", header: "价税合计", cell: ({ row }) => <span className="tabular-nums">¥{row.original.amountWithTax.toLocaleString()}</span> },
    { accessorKey: "issueDate", header: "开票日期", cell: ({ row }) => row.original.issueDate ? new Date(row.original.issueDate).toLocaleDateString("zh-CN") : "-" },
    { accessorKey: "deliveryStatus", header: "交付状态", cell: ({ row }) => <StatusBadge status={row.original.deliveryStatus} variant={row.original.deliveryStatus === "DELIVERED" ? "success" : "warning"} /> },
    { id: "act", header: "操作", cell: ({ row }) => <Link href={`/invoices/${row.original.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button></Link> },
  ];

  return (
    <div>
      <PageHeader title="销项发票" description="所有已开具和交付的销项发票" />
      <DataTable columns={cols} data={data?.items ?? []} searchKey="buyerName" />
    </div>
  );
}
