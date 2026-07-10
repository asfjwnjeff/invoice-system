"use client";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface T { id: string; invoiceNo: string; invoiceCode: string|null; invoiceCategory: string; sellerName: string; buyerName: string; amountWithTax: number; issueDate: string|null; deliveryStatus: string; verifyStatus: string; headerValidationStatus: string; usageStatus: string; pushStatus: string; entryMethod: string; isFromTaxAuthority: boolean; invoicePool: string; createdAt: string; }

export default function InvoicesPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const { data } = useQuery({ queryKey: ["invoices"], queryFn: async () => { const r = await fetch("/api/invoices"); return (await r.json()).data as { items: T[] }; } });
  const archMut = useMutation({ mutationFn: async () => { const r = await fetch("/api/invoices/batch-archive", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({invoiceIds:selected}) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success(`已归档${r.data.archived}张发票`); setSelected([]); qc.invalidateQueries({queryKey:["invoices"]}); } else toast.error(r.error??"失败"); } });
  const sv = (s: string): "success"|"warning"|"danger"|"neutral" => s==="DELIVERED"||s==="VERIFIED"||s==="DEDUCTED"?"success":s==="FAILED"?"danger":s==="PENDING"?"warning":"neutral";
  const cols: ColumnDef<T>[] = [
    { accessorKey:"invoiceNo", header:"发票号码", cell:({row}) => <span className="font-medium tabular-nums">{row.original.invoiceNo}</span> },
    { accessorKey:"invoiceCategory", header:"票种" },
    { accessorKey:"sellerName", header:"销售方", cell:({row}) => row.original.sellerName||"-" },
    { accessorKey:"buyerName", header:"购买方" },
    { accessorKey:"amountWithTax", header:"票面金额(元)", cell:({row}) => <span className="tabular-nums">¥{row.original.amountWithTax.toLocaleString()}</span> },
    { accessorKey:"issueDate", header:"开票日期", cell:({row}) => row.original.issueDate?.slice(0,10) ?? "-" },
    { accessorKey:"invoicePool", header:"所属票池" },
    { accessorKey:"verifyStatus", header:"查验状态", cell:({row}) => <StatusBadge status={row.original.verifyStatus} variant={sv(row.original.verifyStatus)} /> },
    { accessorKey:"headerValidationStatus", header:"抬头校验", cell:({row}) => <StatusBadge status={row.original.headerValidationStatus} variant={sv(row.original.headerValidationStatus)} /> },
    { accessorKey:"deliveryStatus", header:"交付状态", cell:({row}) => <StatusBadge status={row.original.deliveryStatus} variant={sv(row.original.deliveryStatus)} /> },
    { accessorKey:"usageStatus", header:"使用状态", cell:({row}) => <StatusBadge status={row.original.usageStatus} variant={row.original.usageStatus==="UNUSED"?"neutral":row.original.usageStatus==="RED_FLUSHED"?"danger":"success"} /> },
    { accessorKey:"entryMethod", header:"录入方式" },
    { accessorKey:"createdAt", header:"录入时间", cell:({row}) => new Date(row.original.createdAt).toLocaleDateString("zh-CN") },
    { id:"act", header:"操作", cell:({row}) => <Link href={`/invoices/${row.original.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button></Link> },
  ];
  return (<div><PageHeader title="销项发票" description="所有已开具的销项发票" /><DataTable columns={cols} data={data?.items??[]} searchKey="buyerName" selectable selectedIds={selected} onSelectionChange={setSelected} batchBar={<Button size="sm" onClick={() => archMut.mutate()} disabled={archMut.isPending}>批量归档</Button>} /></div>);
}
