"use client";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface T { id: string; invoiceNo: string; invoiceCode: string|null; invoiceCategory: string; sellerName: string; buyerName: string; amountWithTax: number; issueDate: string|null; deliveryStatus: string; verifyStatus: string; headerValidationStatus: string; usageStatus: string; pushStatus: string; entryMethod: string; isFromTaxAuthority: boolean; invoicePool: string; createdAt: string; recordedBy: string|null; }

export default function InvoicesPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [verifyFilter, setVerifyFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const { data } = useQuery({ queryKey: ["invoices"], queryFn: async () => { const r = await fetch("/api/invoices"); return (await r.json()).data as { items: T[] }; } });
  const archMut = useMutation({ mutationFn: async () => { const r = await fetch("/api/invoices/batch-archive", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({invoiceIds:selected}) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success(`已归档${r.data.archived}张发票`); setSelected([]); qc.invalidateQueries({queryKey:["invoices"]}); } else toast.error(r.error??"失败"); } });
  const catLabels: Record<string, string> = { DIGITAL_SPECIAL: "数电专票", DIGITAL_NORMAL: "数电普票", VAT_SPECIAL: "增值税专票", VAT_NORMAL: "增值税普票", E_NORMAL: "电子普票" };
const emLabels: Record<string, string> = { MANUAL: "手工录入", OCR: "OCR识别", IMPORT: "批量导入" };
const verifyLabels: Record<string, string> = { VERIFIED: "已查验", PENDING: "待查验", VERIFY_FAILED: "查验失败" };
const deliveryLabels: Record<string, string> = { DELIVERED: "已交付", PENDING: "待交付", FAILED: "交付失败" };
const headerLabels: Record<string, string> = { VALIDATED: "已校验", PENDING: "待校验", FAILED: "校验失败" };
const usageLabels: Record<string, string> = { UNUSED: "未使用", USED: "已使用", RED_FLUSHED: "已红冲", VOIDED: "已作废", ARCHIVED: "已归档" };
const sv = (s: string): "success"|"warning"|"danger"|"neutral" => s==="DELIVERED"||s==="VERIFIED"||s==="DEDUCTED"?"success":s==="FAILED"?"danger":s==="PENDING"?"warning":"neutral";
  const cols: ColumnDef<T>[] = [
    { accessorKey:"invoiceCode", header:"发票代码", cell:({row}) => row.original.invoiceCode||"-" },
    { accessorKey:"invoiceNo", header:"发票号码", cell:({row}) => <span className="font-medium tabular-nums">{row.original.invoiceNo}</span> },
    { accessorKey:"invoiceCategory", header:"票种", cell:({row}) => catLabels[row.original.invoiceCategory] ?? row.original.invoiceCategory },
    { accessorKey:"sellerName", header:"销售方", cell:({row}) => row.original.sellerName||"-" },
    { accessorKey:"buyerName", header:"购买方" },
    { accessorKey:"amountWithTax", header:"票面金额(元)", cell:({row}) => <span className="tabular-nums">¥{row.original.amountWithTax.toLocaleString()}</span> },
    { accessorKey:"issueDate", header:"开票日期", cell:({row}) => row.original.issueDate?.slice(0,10) ?? "-" },
    { accessorKey:"invoicePool", header:"所属票池" },
    { accessorKey:"verifyStatus", header:"查验状态", cell:({row}) => <StatusBadge status={verifyLabels[row.original.verifyStatus] ?? row.original.verifyStatus} variant={sv(row.original.verifyStatus)} /> },
    { accessorKey:"deliveryStatus", header:"交付状态", cell:({row}) => <StatusBadge status={deliveryLabels[row.original.deliveryStatus] ?? row.original.deliveryStatus} variant={sv(row.original.deliveryStatus)} /> },
    { accessorKey:"usageStatus", header:"使用状态", cell:({row}) => <StatusBadge status={usageLabels[row.original.usageStatus] ?? row.original.usageStatus} variant={row.original.usageStatus==="UNUSED"?"neutral":row.original.usageStatus==="RED_FLUSHED"?"danger":"success"} /> },
    { accessorKey:"entryMethod", header:"录入方式", cell:({row}) => emLabels[row.original.entryMethod] ?? row.original.entryMethod },
    { accessorKey:"recordedBy", header:"录入人", cell:({row}) => row.original.recordedBy||"-" },
    { accessorKey:"isFromTaxAuthority", header:"税局来源", cell:({row}) => row.original.isFromTaxAuthority?"是":"否" },
    { accessorKey:"createdAt", header:"录入时间", cell:({row}) => new Date(row.original.createdAt).toLocaleDateString("zh-CN") },
    { id:"act", header:"操作", cell:({row}) => <div className="flex gap-1"><Link href={`/invoices/${row.original.id}`}><Button variant="ghost" size="sm" className="h-8">查看</Button></Link><Link href={`/invoices/${row.original.id}/edit`}><Button variant="ghost" size="sm" className="h-8">编辑</Button></Link></div> },
  ];
  const filtered = (data?.items ?? []).filter(i => {
    if (verifyFilter && i.verifyStatus !== verifyFilter) return false;
    if (catFilter && i.invoiceCategory !== catFilter) return false;
    return true;
  });
  return (<div><PageHeader title="销项发票" description="所有已开具的销项发票" actionLabel="新增发票" onAction={() => router.push("/invoices/new")} />
    <div className="flex items-center gap-2 mb-3 flex-wrap">
      <span className="text-xs text-muted-foreground">查验:</span>
      {["全部","已查验","待查验","查验失败"].map(s => (
        <Button key={s} variant={(s==="全部"&&!verifyFilter)||verifyFilter===s?"default":"outline"} size="sm" className="h-7 text-xs" onClick={()=>setVerifyFilter(s==="全部"?"":s)}>{s}</Button>
      ))}
      <span className="text-xs text-muted-foreground ml-3">票种:</span>
      <Select value={catFilter} onValueChange={setCatFilter}>
        <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="全部">全部</SelectItem>
          <SelectItem value="DIGITAL_SPECIAL">数电专票</SelectItem>
          <SelectItem value="DIGITAL_NORMAL">数电普票</SelectItem>
          <SelectItem value="VAT_SPECIAL">增值税专票</SelectItem>
          <SelectItem value="VAT_NORMAL">增值税普票</SelectItem>
        </SelectContent>
      </Select>
      {(verifyFilter||catFilter) && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={()=>{setVerifyFilter("");setCatFilter("")}}>清除</Button>}
    </div>
    <DataTable columns={cols} data={filtered} searchKey="buyerName" selectable selectedIds={selected} onSelectionChange={setSelected} batchBar={<Button size="sm" onClick={() => archMut.mutate()} disabled={archMut.isPending}>批量归档</Button>} /></div>);
}
