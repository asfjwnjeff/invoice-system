"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface T { id: string; name: string; taxCode: string | null; unit: string | null; feeType: string | null; }
const E = "invoice-items";

export default function Page() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState({ name: "", taxCode: "", unit: "", feeType: "" });
  const { data } = useQuery({ queryKey: [E], queryFn: async () => { const r = await fetch(`/api/${E}`); return (await r.json()).data as { items: T[] }; } });
  const sm = useMutation({ mutationFn: async () => { const m = editId ? "PUT" : "POST"; const u = editId ? `/api/${E}/${editId}` : `/api/${E}`; const r = await fetch(u, { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success(editId ? "已更新" : "已创建"); setOpen(false); reset(); qc.invalidateQueries({ queryKey: [E] }); } else toast.error(r.error ?? "失败"); } });
  const dm = useMutation({ mutationFn: (id: string) => fetch(`/api/${E}/${id}`, { method: "DELETE" }), onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({ queryKey: [E] }); } });
  const reset = () => { setEditId(null); setF({ name: "", taxCode: "", unit: "", feeType: "" }); };
  const cols: ColumnDef<T>[] = [
    { accessorKey: "name", header: "项目名称", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: "taxCode", header: "税收编码", cell: ({ row }) => row.original.taxCode || "-" },
    { accessorKey: "unit", header: "单位", cell: ({ row }) => row.original.unit || "-" },
    { accessorKey: "feeType", header: "费用类型", cell: ({ row }) => row.original.feeType || "-" },
    { id: "act", header: "操作", cell: ({ row }) => (<div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditId(row.original.id); setF({ name: row.original.name, taxCode: row.original.taxCode ?? "", unit: row.original.unit ?? "", feeType: row.original.feeType ?? "" }); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => dm.mutate(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div>) },
  ];
  return (
    <div>
      <PageHeader title="服务项目管理" description="管理开票项目及对应税收分类编码" actionLabel="新增项目" onAction={() => { reset(); setOpen(true); }} />
      <DataTable columns={cols} data={data?.items ?? []} searchKey="name" />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editId ? "编辑" : "新增"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="col-span-2 space-y-2"><Label>名称 *</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-2"><Label>税收编码</Label><Input value={f.taxCode} onChange={(e) => setF({ ...f, taxCode: e.target.value })} /></div>
          <div className="space-y-2"><Label>单位</Label><Input value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} /></div>
          <div className="col-span-2 space-y-2"><Label>费用类型</Label><Input value={f.feeType} onChange={(e) => setF({ ...f, feeType: e.target.value })} placeholder="CUSTOMS_SERVICE等" /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>取消</Button><Button onClick={() => sm.mutate()}>{sm.isPending ? "保存中..." : "保存"}</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}
