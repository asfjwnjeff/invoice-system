"use client";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";

interface T { id: string; entityType: string; archiveNo: string; archiveStatus: string; archivedAt: string; }

const archiveStatusLabels: Record<string, string> = { ARCHIVED: "已归档", PENDING: "待归档", FAILED: "归档失败" };
const entityTypeLabels: Record<string, string> = { INVOICE: "发票", APPLICATION: "开票申请", INPUT_INVOICE: "进项发票", ADVANCE: "代垫单", SETTLEMENT: "结算单", FEE_ITEM: "费用项", CUSTOMS_BOOK: "海关票据" };

export default function Page() {
  const { data } = useQuery({ queryKey:["archive"], queryFn: async () => { const r = await fetch("/api/archive-records"); return (await r.json()).data as { items: T[] }; } });
  const cols: ColumnDef<T>[] = [
    { accessorKey:"archiveNo", header:"归档编号", cell:({ row }) => <span className="font-medium tabular-nums">{row.original.archiveNo}</span> },
    { accessorKey:"entityType", header:"档案类型", cell:({row}) => entityTypeLabels[row.original.entityType] ?? row.original.entityType },
    { accessorKey:"archiveStatus", header:"归档状态", cell:({ row }) => <StatusBadge status={archiveStatusLabels[row.original.archiveStatus] ?? row.original.archiveStatus} variant={row.original.archiveStatus==="ARCHIVED"?"success":"warning"} /> },
    { accessorKey:"archivedAt", header:"归档时间", cell:({ row }) => row.original.archivedAt?.slice(0,10) ?? "-" },
  ];
  return (
    <div>
      <PageHeader title="电子档案" description="发票、单据、附件、日志的归档记录集合" />
      <DataTable columns={cols} data={data?.items ?? []} searchKey="entityType" />
    </div>
  );
}
