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
import { toast } from "sonner";

interface T { id: string; payAppNo: string; supplierName: string; amount: number; status: string; createdAt: string; }

export default function Page() {
  const qc = useQueryClient(); const [open, setOpen] = useState(false);
  const [f, setF] = useState({ payAppNo:"PAY-"+Date.now(), supplierId:"", supplierName:"", invoiceIds:"", amount:0, remark:"" });
  const { data } = useQuery({ queryKey:["payment-apps"], queryFn: async () => { const r = await fetch("/api/payment-applications"); return (await r.json()).data as { items: T[] }; } });
  const sm = useMutation({ mutationFn: async () => { const r = await fetch("/api/payment-applications", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(f) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success("付款申请已创建"); setOpen(false); qc.invalidateQueries({queryKey:["payment-apps"]}); } else toast.error(r.error??"失败"); } });
  const payStatusLabels: Record<string, string> = { PAID: "已付款", PENDING: "待付款", APPROVED: "已审批", REJECTED: "已驳回" };
const sv = (s:string):"success"|"warning"|"danger"|"neutral" => s==="PAID"?"success":s==="PENDING"?"warning":"neutral";
  const cols: ColumnDef<T>[] = [
    { accessorKey:"payAppNo", header:"申请号", cell:({row}) => <span className="font-medium">{row.original.payAppNo}</span> },
    { accessorKey:"supplierName", header:"供应商" },
    { accessorKey:"amount", header:"金额", cell:({row}) => <span className="tabular-nums">¥{row.original.amount.toLocaleString()}</span> },
    { accessorKey:"status", header:"状态", cell:({row}) => <StatusBadge status={payStatusLabels[row.original.status] ?? row.original.status} variant={sv(row.original.status)} /> },
    { accessorKey:"createdAt", header:"创建时间", cell:({row}) => new Date(row.original.createdAt).toLocaleDateString("zh-CN") },
  ];
  return (
    <div>
      <PageHeader title="付款申请" description="供应商付款申请管理" actionLabel="新建申请" onAction={() => setOpen(true)} />
      <DataTable columns={cols} data={data?.items??[]} searchKey="supplierName" />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>新建付款申请</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2"><Label>申请号</Label><Input value={f.payAppNo} onChange={e => setF({...f, payAppNo:e.target.value})} /></div>
          <div className="space-y-2"><Label>供应商</Label><Input value={f.supplierName} onChange={e => setF({...f, supplierName:e.target.value})} /></div>
          <div className="space-y-2"><Label>金额</Label><Input type="number" value={f.amount} onChange={e => setF({...f, amount:+e.target.value})} /></div>
          <div className="space-y-2"><Label>关联发票ID</Label><Input value={f.invoiceIds} onChange={e => setF({...f, invoiceIds:e.target.value})} placeholder="逗号分隔" /></div>
          <div className="col-span-2 space-y-2"><Label>备注</Label><Input value={f.remark} onChange={e => setF({...f, remark:e.target.value})} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>取消</Button><Button onClick={() => sm.mutate()}>{sm.isPending?"保存中...":"提交"}</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}
