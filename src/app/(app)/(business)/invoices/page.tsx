"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RefreshCw, Mail, Archive } from "lucide-react";

interface T { id: string; invoiceNo: string; invoiceCode: string|null; invoiceCategory: string; sellerName: string; buyerName: string; amountWithoutTax: number; taxAmount: number; amountWithTax: number; taxRates: number[]; issueDate: string|null; deliveryStatus: string; verifyStatus: string; usageStatus: string; pushToCBMSStatus: string; emailDeliveryStatus: string; entryMethod: string; isFromTaxAuthority: boolean; invoicePool: string; applicationId: string|null; application?: { applicationNo: string }|null; createdAt: string; }

const catLabels: Record<string,string> = { DIGITAL_SPECIAL:"数电专票", DIGITAL_NORMAL:"数电普票", VAT_SPECIAL:"增值税专票", VAT_NORMAL:"增值税普票", E_NORMAL:"电子普票" };
const emLabels: Record<string,string> = { MANUAL:"手工录入", OCR:"OCR识别", IMPORT:"批量导入", SYSTEM:"系统生成" };
const verifyLabels: Record<string,string> = { VERIFIED:"已查验", PENDING:"待查验", VERIFY_FAILED:"查验失败" };
const deliveryLabels: Record<string,string> = { DELIVERED:"已交付", PENDING:"待交付", FAILED:"交付失败" };
const usageLabels: Record<string,string> = { UNUSED:"未使用", USED:"已使用", RED_FLUSHED:"已红冲", VOIDED:"已作废", ARCHIVED:"已归档" };
const sv = (s:string):"success"|"warning"|"danger"|"neutral" => s==="DELIVERED"||s==="VERIFIED"?"success":s==="FAILED"?"danger":s==="PENDING"?"warning":"neutral";

export default function InvoicesPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [verifyFilter, setVerifyFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [confirmAction, setConfirmAction] = useState<"notify" | null>(null);

  const { data } = useQuery({ queryKey:["invoices"], queryFn:async () => { const r = await fetch("/api/invoices"); return (await r.json()).data as { items: T[] }; } });

  // Sync from tax bureau: pull newly issued invoices into the system
  const syncTaxMut = useMutation({
    mutationFn: async () => { const r = await fetch("/api/invoices/sync-from-tax", { method:"POST" }); if (!r.ok) throw new Error("请求失败"); return r.json(); },
    onSuccess: (r) => { if (r.success) { toast.success(`已从税局拉取 ${r.data?.count ?? 0} 张新发票`); qc.invalidateQueries({queryKey:["invoices"]}); } else { toast.error(r.error ?? "拉取失败"); } },
    onError: () => toast.error("同步税局发票失败，请重试"),
  });

  // Batch archive
  const archMut = useMutation({
    mutationFn: async () => { const r = await fetch("/api/invoices/batch-archive", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({invoiceIds:selected}) }); if (!r.ok) throw new Error("请求失败"); return r.json(); },
    onSuccess: (r) => { if (r.success) { toast.success(`已归档 ${r.data?.archived ?? 0} 张发票`); setSelected([]); qc.invalidateQueries({queryKey:["invoices"]}); } else { toast.error(r.error ?? "归档失败"); } },
    onError: () => toast.error("批量归档失败，请重试"),
  });

  // Batch notify
  const notifyMut = useMutation({
    mutationFn: async () => { const r = await fetch("/api/invoices/batch-notify", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ids:selected}) }); if (!r.ok) throw new Error("请求失败"); return r.json(); },
    onSuccess: (r) => { if (r.success) { toast.success(r.data?.message ?? "通知已发送"); setSelected([]); qc.invalidateQueries({queryKey:["invoices"]}); } else { toast.error(r.error ?? "通知失败"); } },
    onError: () => toast.error("通知发送失败，请重试"),
    onSettled: () => setConfirmAction(null),
  });

  const cols: ColumnDef<T>[] = [
    { accessorKey:"invoiceNo", header:"发票号码", cell:({row}) => <span className="font-medium tabular-nums">{row.original.invoiceNo}</span> },
    { accessorKey:"application?.applicationNo", header:"开票申请号", cell:({row}) => row.original.application?.applicationNo ? <Link href={`/applications/${row.original.applicationId}`} className="text-accent hover:underline tabular-nums">{row.original.application.applicationNo}</Link> : "-" },
    { accessorKey:"invoiceCategory", header:"票种", cell:({row}) => catLabels[row.original.invoiceCategory] ?? row.original.invoiceCategory },
    { accessorKey:"buyerName", header:"购买方" },
    { accessorKey:"sellerName", header:"销售方", cell:({row}) => row.original.sellerName||"-" },
    { accessorKey:"amountWithTax", header:"价税合计", cell:({row}) => <span className="tabular-nums">¥{row.original.amountWithTax.toLocaleString()}</span> },
    { accessorKey:"amountWithoutTax", header:"不含税金额", cell:({row}) => <span className="tabular-nums">¥{(row.original.amountWithoutTax ?? 0).toLocaleString()}</span> },
    { accessorKey:"taxAmount", header:"税额", cell:({row}) => <span className="tabular-nums">¥{(row.original.taxAmount ?? 0).toLocaleString()}</span> },
    { accessorKey:"taxRates", header:"税率", cell:({row}) => <span className="tabular-nums">{(row.original.taxRates??[]).length > 0 ? row.original.taxRates.map(r => `${r}%`).join(" / ") : "-"}</span> },
    { accessorKey:"issueDate", header:"开票日期", cell:({row}) => row.original.issueDate?.slice(0,10) ?? "-" },
    { accessorKey:"entryMethod", header:"来源", cell:({row}) => row.original.isFromTaxAuthority ? <span className="text-emerald-600 text-xs font-medium">税局推送</span> : emLabels[row.original.entryMethod] ?? row.original.entryMethod },
    { accessorKey:"verifyStatus", header:"查验", cell:({row}) => <StatusBadge status={verifyLabels[row.original.verifyStatus] ?? row.original.verifyStatus} variant={sv(row.original.verifyStatus)} /> },
    { accessorKey:"deliveryStatus", header:"交付", cell:({row}) => <StatusBadge status={deliveryLabels[row.original.deliveryStatus] ?? row.original.deliveryStatus} variant={sv(row.original.deliveryStatus)} /> },

    { accessorKey:"emailDeliveryStatus", header:"邮件", cell:({row}) => <StatusBadge status={row.original.emailDeliveryStatus==="SENT"?"已发送":"待发送"} variant={row.original.emailDeliveryStatus==="SENT"?"success":"warning"} /> },
    { accessorKey:"usageStatus", header:"使用", cell:({row}) => <StatusBadge status={usageLabels[row.original.usageStatus]??row.original.usageStatus} variant={row.original.usageStatus==="UNUSED"?"neutral":row.original.usageStatus==="RED_FLUSHED"?"danger":"success"} /> },
    { accessorKey:"createdAt", header:"录入时间", cell:({row}) => new Date(row.original.createdAt).toLocaleDateString("zh-CN") },
    { id:"act", header:"操作", cell:({row}) => <div className="flex gap-1"><Link href={`/invoices/${row.original.id}`}><Button variant="ghost" size="sm" className="h-8">查看</Button></Link></div> },
  ];

  const filtered = (data?.items??[]).filter(i => {
    if (verifyFilter && i.verifyStatus!==verifyFilter) return false;
    if (catFilter && i.invoiceCategory!==catFilter) return false;
    return true;
  });

  return (<div>
    <PageHeader title="销项发票管理" description="承接税局开票结果，展示已开具的销项发票及推送状态" />

    {/* Action toolbar — always visible */}
    <div className="flex items-center gap-2 mb-3 flex-wrap">
      <Button size="sm" onClick={() => syncTaxMut.mutate()} disabled={syncTaxMut.isPending} className="bg-accent hover:bg-accent/90">
        <RefreshCw className={`h-3.5 w-3.5 mr-1 ${syncTaxMut.isPending ? "animate-spin" : ""}`} />
        {syncTaxMut.isPending ? "拉取中..." : "同步税局发票"}
      </Button>
      <Button size="sm" variant="outline" onClick={() => setConfirmAction("notify")} disabled={selected.length === 0}>
        <Mail className="h-3.5 w-3.5 mr-1" />通知开票人{selected.length > 0 ? ` (${selected.length})` : ""}
      </Button>
      <Button size="sm" variant="outline" onClick={() => archMut.mutate()} disabled={selected.length === 0 || archMut.isPending}>
        <Archive className="h-3.5 w-3.5 mr-1" />批量归档{selected.length > 0 ? ` (${selected.length})` : ""}
      </Button>
      <span className="flex-1" />
      <span className="text-xs text-muted-foreground">查验:</span>
      {["全部","已查验","待查验","查验失败"].map(s => (
        <Button key={s} variant={(s==="全部"&&!verifyFilter)||verifyFilter===s?"default":"outline"} size="sm" className="h-7 text-xs" onClick={()=>setVerifyFilter(s==="全部"?"":s)}>{s}</Button>
      ))}
      <span className="text-xs text-muted-foreground ml-2">票种:</span>
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

    <DataTable columns={cols} data={filtered} searchKey="buyerName" searchPlaceholder="搜索购买方..." stickyRightColumns={["act"]} selectable selectedIds={selected} onSelectionChange={setSelected} />

    <ConfirmDialog
      open={!!confirmAction}
      onOpenChange={() => setConfirmAction(null)}
      title="通知开票申请人"
      description={`确认通知选中的 ${selected.length} 张发票的开票申请人？将发送邮件通知。`}
      confirmLabel="确认发送"
      loading={notifyMut.isPending}
      onConfirm={() => notifyMut.mutate()}
    />
  </div>);
}
