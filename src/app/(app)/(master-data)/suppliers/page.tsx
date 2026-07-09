"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface T { id: string; name: string; taxNo: string | null; contactPerson: string | null; contactPhone: string | null; supplierType: string | null; isBlacklisted: boolean; }
const E = "suppliers"; const TITLE = "供应商管理"; const DESC = "管理仓储、运输、报关、代理等供应商";

export default function Page() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState({ name: "", taxNo: "", contactPerson: "", contactPhone: "", supplierType: "" });
  const { data } = useQuery({ queryKey: [E], queryFn: async () => { const r = await fetch(`/api/${E}`); return (await r.json()).data as { items: T[] }; } });
  const sm = useMutation({ mutationFn: async () => { const m = editId ? "PUT" : "POST"; const u = editId ? `/api/${E}/${editId}` : `/api/${E}`; await fetch(u, { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); }, onSuccess: () => { toast.success(editId ? "已更新" : "已创建"); setOpen(false); reset(); qc.invalidateQueries({ queryKey: [E] }); } });
  const dm = useMutation({ mutationFn: (id: string) => fetch(`/api/${E}/${id}`, { method: "DELETE" }), onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({ queryKey: [E] }); } });
  const reset = () => { setEditId(null); setF({ name: "", taxNo: "", contactPerson: "", contactPhone: "", supplierType: "" }); };

  const cols: ColumnDef<T>[] = [
    { accessorKey: "name", header: "名称", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: "taxNo", header: "税号", cell: ({ row }) => row.original.taxNo || "-" },
    { accessorKey: "supplierType", header: "类型", cell: ({ row }) => row.original.supplierType || "-" },
    { accessorKey: "contactPerson", header: "联系人", cell: ({ row }) => row.original.contactPerson || "-" },
    { id: "act", header: "操作", cell: ({ row }) => (<div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditId(row.original.id); setF({ name: row.original.name, taxNo: row.original.taxNo ?? "", contactPerson: row.original.contactPerson ?? "", contactPhone: row.original.contactPhone ?? "", supplierType: row.original.supplierType ?? "" }); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => dm.mutate(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div>) },
  ];

  return (
    <div>
      <PageHeader title={TITLE} description={DESC} actionLabel="新增供应商" onAction={() => { reset(); setOpen(true); }} />
      <DataTable columns={cols} data={data?.items ?? []} searchKey="name" />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editId ? "编辑" : "新增"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="col-span-2 space-y-2"><Label>名称 *</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-2"><Label>税号</Label><Input value={f.taxNo} onChange={(e) => setF({ ...f, taxNo: e.target.value })} /></div>
          <div className="space-y-2"><Label>类型</Label><Input value={f.supplierType} onChange={(e) => setF({ ...f, supplierType: e.target.value })} placeholder="transport/warehouse/customs" /></div>
          <div className="space-y-2"><Label>联系人</Label><Input value={f.contactPerson} onChange={(e) => setF({ ...f, contactPerson: e.target.value })} /></div>
          <div className="space-y-2"><Label>电话</Label><Input value={f.contactPhone} onChange={(e) => setF({ ...f, contactPhone: e.target.value })} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>取消</Button><Button onClick={() => sm.mutate()}>{sm.isPending ? "保存中..." : "保存"}</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}
