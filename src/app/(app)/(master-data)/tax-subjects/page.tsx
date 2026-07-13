"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface T { id: string; name: string; taxNo: string; isDefault: boolean; }
const E = "tax-subjects";

export default function Page() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [f, setF] = useState({ name: "", taxNo: "", isDefault: false });
  const { data } = useQuery({ queryKey: [E], queryFn: async () => { const r = await fetch(`/api/${E}`); return (await r.json()).data as { items: T[] }; } });
  const sm = useMutation({ mutationFn: async () => { const m = editId ? "PUT" : "POST"; const u = editId ? `/api/${E}/${editId}` : `/api/${E}`; const r = await fetch(u, { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success(editId ? "已更新" : "已创建"); setOpen(false); reset(); qc.invalidateQueries({ queryKey: [E] }); } else toast.error(r.error ?? "失败"); } });
  const dm = useMutation({ mutationFn: (id: string) => fetch(`/api/${E}/${id}`, { method: "DELETE" }), onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({ queryKey: [E] }); } });
  const reset = () => { setEditId(null); setF({ name: "", taxNo: "", isDefault: false }); };
  const cols: ColumnDef<T>[] = [
    { accessorKey: "name", header: "名称", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: "taxNo", header: "税号" },
    { accessorKey: "isDefault", header: "默认", cell: ({ row }) => row.original.isDefault ? "是" : "否" },
    { id: "act", header: "操作", cell: ({ row }) => (<div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditId(row.original.id); setF({ name: row.original.name, taxNo: row.original.taxNo, isDefault: row.original.isDefault }); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div>) },
  ];
  return (
    <div>
      <PageHeader title="税号管理" description="管理各开票主体的税号信息" actionLabel="新增税号" onAction={() => { reset(); setOpen(true); }} />
      <DataTable columns={cols} data={data?.items ?? []} searchKey="name" />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editId ? "编辑" : "新增"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="col-span-2 space-y-2"><Label>名称 *</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="col-span-2 space-y-2"><Label>税号 *</Label><Input value={f.taxNo} onChange={(e) => setF({ ...f, taxNo: e.target.value })} /></div>
          <div className="flex items-center space-x-2"><Checkbox id="def" checked={f.isDefault} onCheckedChange={(v) => setF({ ...f, isDefault: !!v })} /><Label htmlFor="def">设为默认</Label></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>取消</Button><Button onClick={() => sm.mutate()}>{sm.isPending ? "保存中..." : "保存"}</Button></DialogFooter>
      </DialogContent></Dialog>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="确认删除"
        description="确认要删除吗？此操作不可撤销。"
        confirmLabel="删除"
        variant="danger"
        loading={dm.isPending}
        onConfirm={() => deleteId && dm.mutate(deleteId)}
      />
    </div>
  );
}
