"use client";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";

interface T { id: string; entityType: string; archiveNo: string; archiveStatus: string; archivedAt: string; }

export default function Page() {
  const { data } = useQuery({ queryKey:["archive"], queryFn: async () => { const r = await fetch("/api/archive-records"); return (await r.json()).data as { items: T[] }; } });
  const cols: ColumnDef<T>[] = [
    { accessorKey:"archiveNo", header:"归档编号", cell:({ row }) => <span className="font-medium tabular-nums">{row.original.archiveNo}</span> },
    { accessorKey:"entityType", header:"档案类型" },
    { accessorKey:"archiveStatus", header:"归档状态", cell:({ row }) => <StatusBadge status={row.original.archiveStatus} variant={row.original.archiveStatus==="ARCHIVED"?"success":"warning"} /> },
    { accessorKey:"archivedAt", header:"归档时间", cell:({ row }) => row.original.archivedAt?.slice(0,10) ?? "-" },
  ];
  return (
    <div>
      <PageHeader title="电子档案" description="发票、单据、附件、日志的归档记录集合" />
      <DataTable columns={cols} data={data?.items ?? []} searchKey="entityType" />
    </div>
  );
}
