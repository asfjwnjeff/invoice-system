"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FilterPanel } from "@/components/shared/filter-panel";
import { SelectSearch } from "@/components/ui/select-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEntitySelect } from "@/lib/hooks/use-entity-select";

interface T { id: string; applicationNo: string; buyerName: string; buyerTaxNo: string; invoiceCategory: string; amountWithoutTax: number; taxAmount: number; amountWithTax: number; status: string; sellerName: string | null; drawerName: string | null; taxSubject?: { name: string } | null; createdAt: string; }

const appStatusLabels: Record<string, string> = { DRAFT: "草稿", PENDING_APPROVAL: "待审批", APPROVED: "已审批", REJECTED: "已驳回", ISSUED: "已开票", CONVERTED: "已制单" };
const invoiceCategoryLabels: Record<string, string> = { DIGITAL_SPECIAL: "数电专票", DIGITAL_NORMAL: "数电普票", VAT_SPECIAL: "增值税专票", VAT_NORMAL: "增值税普票", E_NORMAL: "电子普票" };

const E = "applications";

export default function ApplicationsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusF, setStatusF] = useState("");
  const [categoryF, setCategoryF] = useState("");
  const [buyerF, setBuyerF] = useState("");
  const [sellerF, setSellerF] = useState("");
  const [appNoF, setAppNoF] = useState("");
  const [applied, setApplied] = useState({ status: "", category: "", buyer: "", seller: "", appNo: "" });
  const [filterOrder, setFilterOrder] = useState<string[]>(["status", "category"]);

  const { data } = useQuery({
    queryKey: [E],
    queryFn: async () => { const r = await fetch(`/api/${E}`); const j = await r.json(); return j.data as { items: T[] }; },
  });

  const { data: customerOptions } = useEntitySelect("/api/customers/select");
  const { data: taxSubjectOptions } = useEntitySelect("/api/tax-subjects/select");

  const dm = useMutation({
    mutationFn: (id: string) => fetch(`/api/${E}/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({ queryKey: [E] }); },
    onError: () => toast.error("删除失败"),
  });

  const submitApproval = async (entityId: string, entityTitle: string) => {
    const r = await fetch("/api/approvals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "submit", entityType: "APPLICATION", entityId, entityTitle }) });
    const j = await r.json();
    if (j.success) toast.success("已提交审批"); else toast.error(j.error || "失败");
    qc.invalidateQueries({ queryKey: [E] });
  };

  const sv = (s: string): "success" | "warning" | "danger" | "neutral" =>
    s === "ISSUED" || s === "APPROVED" ? "success" : s === "PENDING_APPROVAL" ? "warning" : s === "REJECTED" ? "danger" : "neutral";

  const cols: ColumnDef<T>[] = [
    { accessorKey: "applicationNo", header: "申请号", cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.applicationNo}</span> },
    { accessorKey: "status", header: "状态", cell: ({ row }) => <StatusBadge status={appStatusLabels[row.original.status] ?? row.original.status} variant={sv(row.original.status)} /> },
    { accessorKey: "invoiceCategory", header: "发票类型", cell: ({ row }) => invoiceCategoryLabels[row.original.invoiceCategory] || row.original.invoiceCategory },
    { accessorKey: "buyerName", header: "购买方", cell: ({ row }) => <div><span>{row.original.buyerName}</span>{row.original.buyerTaxNo && <p className="text-xs text-muted-foreground">{row.original.buyerTaxNo}</p>}</div> },
    { accessorKey: "sellerName", header: "销方", cell: ({ row }) => row.original.sellerName || row.original.taxSubject?.name || "-" },
    { accessorKey: "amountWithoutTax", header: "未税金额", cell: ({ row }) => <span className="tabular-nums">¥{(row.original.amountWithoutTax ?? 0).toLocaleString()}</span> },
    { accessorKey: "taxAmount", header: "税额", cell: ({ row }) => <span className="tabular-nums">¥{(row.original.taxAmount ?? 0).toLocaleString()}</span> },
    { accessorKey: "amountWithTax", header: "价税合计", cell: ({ row }) => <span className="tabular-nums">¥{(row.original.amountWithTax ?? 0).toLocaleString()}</span> },
    { accessorKey: "drawerName", header: "开票人", cell: ({ row }) => row.original.drawerName || "-" },
    { accessorKey: "createdAt", header: "创建时间", cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("zh-CN") },
    { id: "act", header: "操作", meta: { headerClassName: "text-center" },
      cell: ({ row }) => {
        const s = row.original.status;
        const canEdit = s === "DRAFT" || s === "REJECTED";
        return (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-8" onClick={() => router.push(`/applications/${row.original.id}`)}>查看</Button>
            {canEdit && (
              <Button variant="ghost" size="sm" className="h-8" onClick={() => router.push(`/applications/${row.original.id}/edit`)}>
                <Pencil className="h-3.5 w-3.5 mr-1" />编辑
              </Button>
            )}
            {s === "DRAFT" && (
              <Button variant="ghost" size="sm" className="h-8 text-accent" onClick={() => submitApproval(row.original.id, row.original.applicationNo)}>提交审核</Button>
            )}
            {s === "APPROVED" && (
              <Button variant="ghost" size="sm" className="h-8 text-accent" onClick={() => router.push(`/pre-invoices/new?appId=${row.original.id}`)}>生成预制发票</Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(row.original.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  const filtered = (data?.items ?? []).filter(i => {
    if (applied.status && i.status !== Object.keys(appStatusLabels).find(k => appStatusLabels[k] === applied.status)) return false;
    if (applied.category && i.invoiceCategory !== applied.category) return false;
    if (applied.buyer && i.buyerName !== applied.buyer) return false;
    if (applied.seller && i.sellerName !== applied.seller) return false;
    if (applied.appNo && !i.applicationNo.toLowerCase().includes(applied.appNo.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <PageHeader title="开票申请" description="由收入订单生成的正式开票请求单据" actionLabel="新建申请" onAction={() => router.push("/applications/new")} />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <FilterPanel
          fields={[
            { key: "status", label: "状态" },
            { key: "category", label: "发票类型" },
            { key: "buyerName", label: "购买方" },
            { key: "sellerName", label: "销方" },
            { key: "applicationNo", label: "申请号" },
          ]}
          storageKey="application-filter-order"
          onOrderChange={setFilterOrder}
        />
        {filterOrder.includes("status") && (
          <>
            <span className="text-sm text-muted-foreground">状态</span>
            <SelectSearch
              value={Object.keys(appStatusLabels).find(k => appStatusLabels[k] === statusF) ?? ""}
              onValueChange={v => setStatusF(v ? appStatusLabels[v] ?? v : "")}
              options={[{ value: "", label: "全部" }, ...Object.entries(appStatusLabels).map(([k, v]) => ({ value: k, label: v }))]}
              placeholder="全部"
              className="w-[120px]"
            />
          </>
        )}
        {filterOrder.includes("category") && (
          <>
            <span className="text-sm text-muted-foreground">发票类型</span>
            <SelectSearch
              value={categoryF}
              onValueChange={v => setCategoryF(v)}
              options={[{ value: "", label: "全部" }, ...Object.entries(invoiceCategoryLabels).map(([k, v]) => ({ value: k, label: v }))]}
              placeholder="全部"
              className="w-[140px]"
            />
          </>
        )}
        {filterOrder.includes("buyerName") && (
          <>
            <span className="text-sm text-muted-foreground">购买方</span>
            <SelectSearch
              value={buyerF}
              onValueChange={v => setBuyerF(v)}
              options={[{ value: "", label: "全部" }, ...((customerOptions ?? []) as { id: string; label: string }[]).map(o => ({ value: o.label, label: o.label }))]}
              placeholder="全部"
              className="w-[200px]"
            />
          </>
        )}
        {filterOrder.includes("sellerName") && (
          <>
            <span className="text-sm text-muted-foreground">销方</span>
            <SelectSearch
              value={sellerF}
              onValueChange={v => setSellerF(v)}
              options={[{ value: "", label: "全部" }, ...((taxSubjectOptions ?? []) as { id: string; label: string }[]).map(o => ({ value: o.label, label: o.label }))]}
              placeholder="全部"
              className="w-[200px]"
            />
          </>
        )}
        {filterOrder.includes("applicationNo") && (
          <>
            <span className="text-sm text-muted-foreground">申请号</span>
            <Input
              value={appNoF}
              onChange={e => setAppNoF(e.target.value)}
              placeholder="输入申请号..."
              className="w-[180px] h-8"
            />
          </>
        )}
        <span className="border-l border-border h-5 mx-1" />
        <Button size="sm" className="h-8 text-xs" onClick={() => setApplied({ status: statusF, category: categoryF, buyer: buyerF, seller: sellerF, appNo: appNoF })}>查询</Button>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setStatusF(""); setCategoryF(""); setBuyerF(""); setSellerF(""); setAppNoF(""); setApplied({ status: "", category: "", buyer: "", seller: "", appNo: "" }); }}>重置</Button>
      </div>

      <DataTable
        columns={cols}
        data={filtered}
        searchKey="buyerName"
        searchPlaceholder="搜索购买方..."
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        stickyRightColumns={["act"]}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="确认删除"
        description="确认要删除此开票申请吗？此操作不可撤销。"
        confirmLabel="删除"
        variant="danger"
        loading={dm.isPending}
        onConfirm={() => deleteId && dm.mutate(deleteId)}
      />
    </div>
  );
}
