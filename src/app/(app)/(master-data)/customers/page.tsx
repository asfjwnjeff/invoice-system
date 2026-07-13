"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Customer { id: string; name: string; shortName: string | null; taxNo: string | null; address: string | null; contactPerson: string | null; contactPhone: string | null; contactEmail: string | null; invoiceStrategy: string; isBlacklisted: boolean; }

const invoiceStrategyLabels: Record<string, string> = {
  NO_INVOICE: "不开票",
  SEPARATE_INVOICE: "代垫单独开票",
  MERGE_WITH_SERVICE: "与服务费合并",
  SERVICE_ONLY: "仅服务费",
  NET_AMOUNT: "差额开票",
  MANUAL: "手工指定",
};

const emptyForm = { name: "", shortName: "", taxNo: "", address: "", contactPerson: "", contactPhone: "", contactEmail: "", invoiceStrategy: "NO_INVOICE", isBlacklisted: false };

export default function CustomersPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => { const res = await fetch("/api/customers"); const j = await res.json(); return j.data as { items: Customer[]; total: number }; },
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const url = editingId ? `/api/customers/${editingId}` : "/api/customers";
      const res = await fetch(url, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      return res.json();
    },
    onSuccess: (r) => {
      if (r.success) { toast.success(editingId ? "已更新" : "已创建"); setDialogOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["customers"] }); }
      else toast.error(r.error ?? "操作失败");
    },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => fetch(`/api/customers/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast.success("已删除"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["customers"] }); },
  });

  const resetForm = () => { setEditingId(null); setForm(emptyForm); };

  const openEdit = (c: Customer) => {
    setEditingId(c.id);
    setForm({ name: c.name, shortName: c.shortName ?? "", taxNo: c.taxNo ?? "", address: c.address ?? "", contactPerson: c.contactPerson ?? "", contactPhone: c.contactPhone ?? "", contactEmail: c.contactEmail ?? "", invoiceStrategy: c.invoiceStrategy, isBlacklisted: c.isBlacklisted });
    setDialogOpen(true);
  };

  const columns: ColumnDef<Customer>[] = [
    { accessorKey: "name", header: "客户名称", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: "shortName", header: "简称", cell: ({ row }) => row.original.shortName || "-" },
    { accessorKey: "taxNo", header: "税号", cell: ({ row }) => row.original.taxNo || "-" },
    { accessorKey: "address", header: "地址", cell: ({ row }) => row.original.address || "-" },
    { accessorKey: "contactPerson", header: "联系人", cell: ({ row }) => row.original.contactPerson || "-" },
    { accessorKey: "contactPhone", header: "电话", cell: ({ row }) => row.original.contactPhone || "-" },
    { accessorKey: "contactEmail", header: "邮箱", cell: ({ row }) => row.original.contactEmail || "-" },
    { accessorKey: "invoiceStrategy", header: "开票策略", cell: ({ row }) => invoiceStrategyLabels[row.original.invoiceStrategy] ?? row.original.invoiceStrategy },
    { accessorKey: "isBlacklisted", header: "状态", cell: ({ row }) => row.original.isBlacklisted ? <StatusBadge status="黑名单" variant="danger" /> : <StatusBadge status="正常" variant="success" /> },
    { id: "actions", header: "操作", cell: ({ row }) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row.original)}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="客户管理" description="管理委托公司提供供应链服务的客户" actionLabel="新增客户" onAction={() => { resetForm(); setDialogOpen(true); }} />
      <DataTable columns={columns} data={data?.items ?? []} searchKey="name" searchPlaceholder="搜索客户名称或税号..." />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "编辑客户" : "新增客户"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2"><Label>客户名称 *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>简称</Label><Input value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} /></div>
            <div className="space-y-2"><Label>税号</Label><Input value={form.taxNo} onChange={(e) => setForm({ ...form, taxNo: e.target.value })} /></div>
            <div className="col-span-2 space-y-2"><Label>地址</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="space-y-2"><Label>联系人</Label><Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div>
            <div className="space-y-2"><Label>电话</Label><Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></div>
            <div className="space-y-2"><Label>邮箱</Label><Input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>开票策略</Label>
              <Select value={form.invoiceStrategy} onValueChange={(v) => setForm({ ...form, invoiceStrategy: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO_INVOICE">不开票</SelectItem>
                  <SelectItem value="SEPARATE_INVOICE">代垫单独开票</SelectItem>
                  <SelectItem value="MERGE_WITH_SERVICE">与服务费合并</SelectItem>
                  <SelectItem value="SERVICE_ONLY">仅服务费</SelectItem>
                  <SelectItem value="NET_AMOUNT">差额开票</SelectItem>
                  <SelectItem value="MANUAL">手工指定</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2"><Checkbox id="bl" checked={form.isBlacklisted} onCheckedChange={(v) => setForm({ ...form, isBlacklisted: !!v })} /><Label htmlFor="bl">黑名单</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>{saveMut.isPending ? "保存中..." : "保存"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="删除客户" description="确认删除？此操作不可撤销。" confirmLabel="删除" variant="danger" loading={delMut.isPending} onConfirm={() => deleteId && delMut.mutate(deleteId)} />
    </div>
  );
}
