"use client";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";

interface T { id: string; ruleCode: string; ruleName: string; entityType: string; riskLevel: string; description: string; isResolved: boolean; }

const riskLevelLabels: Record<string, string> = { LOW: "低风险", MEDIUM: "中风险", HIGH: "高风险", CRITICAL: "严重风险" };

export default function Page() {
  const { data } = useQuery({ queryKey:["risk"], queryFn: async () => { const r = await fetch("/api/risk-results"); return (await r.json()).data as { items: T[] }; } });
  const lv = (l: string): "success"|"warning"|"danger"|"neutral" => l==="LOW"?"neutral":l==="MEDIUM"?"warning":l==="HIGH"?"danger":"danger";
  const cols: ColumnDef<T>[] = [
    { accessorKey:"ruleCode", header:"规则编码" },
    { accessorKey:"ruleName", header:"规则名称" },
    { accessorKey:"entityType", header:"关联实体" },
    { accessorKey:"riskLevel", header:"风险等级", cell:({ row }) => <StatusBadge status={riskLevelLabels[row.original.riskLevel] ?? row.original.riskLevel} variant={lv(row.original.riskLevel)} /> },
    { accessorKey:"description", header:"描述" },
    { accessorKey:"isResolved", header:"状态", cell:({ row }) => <StatusBadge status={row.original.isResolved?"已处理":"未处理"} variant={row.original.isResolved?"success":"warning"} /> },
  ];
  return (
    <div>
      <PageHeader title="风控中心" description="发票真实性、重复风险、抬头风险、金额风险等自动检测结果" />
      <DataTable columns={cols} data={data?.items ?? []} searchKey="ruleName" />
    </div>
  );
}
