"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

interface Step { step: number; role: string; label: string; status: string; assigneeName: string|null; comment: string|null; timestamp: string|null; }
interface T { id: string; entityType: string; entityTitle: string|null; totalSteps: number; currentStep: number; status: string; stepsData: string; createdAt: string; }

const labels: Record<string,string> = { APPLICATION:"开票申请", RED_FLUSH:"红冲申请", VOID:"作废申请", ADVANCE:"代垫确认" };
const apprStatusLabels: Record<string, string> = { DRAFT: "草稿", IN_PROGRESS: "审批中", APPROVED: "已通过", REJECTED: "已驳回" };

export default function ApprovalsPage() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const [selected, setSelected] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve"|"reject">("approve");
  const [selectedId, setSelectedId] = useState<string>("");
  const [comment, setComment] = useState("");

  const { data } = useQuery({ queryKey:["approvals"], queryFn: async () => { const r = await fetch("/api/approvals"); return (await r.json()).data as { items: T[] }; } });

  const actMut = useMutation({ mutationFn: async () => { const r = await fetch(`/api/approvals/${selectedId}`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action: actionType, comment }) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success(r.data?.message ?? "操作成功"); setDialogOpen(false); setComment(""); qc.invalidateQueries({queryKey:["approvals"]}); } else toast.error(r.error??"失败"); } });
  const batchApprove = useMutation({ mutationFn: async () => { const r = await fetch("/api/approvals/batch", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"approve", ids:selected}) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success(`已批量通过${r.data.count}条`); setSelected([]); qc.invalidateQueries({queryKey:["approvals"]}); } else toast.error(r.error??"失败"); } });

  const sv = (s:string):"success"|"warning"|"danger"|"neutral" => s==="APPROVED"?"success":s==="REJECTED"?"danger":s==="IN_PROGRESS"?"warning":"neutral";

  const cols: ColumnDef<T>[] = [
    { accessorKey:"entityTitle", header:"审批事项", cell:({row}) => <div><span className="font-medium">{row.original.entityTitle||"-"}</span><p className="text-xs text-muted-foreground">{labels[row.original.entityType]??row.original.entityType}</p></div> },
    { accessorKey:"currentStep", header:"当前节点", cell:({row}) => { const sd = JSON.parse(row.original.stepsData||"[]") as Step[]; const cur = sd[row.original.currentStep]; return <span>{cur?.label??"-"} ({row.original.currentStep+1}/{row.original.totalSteps})</span>; } },
    { accessorKey:"status", header:"状态", cell:({row}) => <StatusBadge status={apprStatusLabels[row.original.status] ?? row.original.status} variant={sv(row.original.status)} /> },
    { accessorKey:"createdAt", header:"提交时间", cell:({row}) => new Date(row.original.createdAt).toLocaleDateString("zh-CN") },
    { id:"timeline", header:"审批记录", cell:({row}) => { const sd = JSON.parse(row.original.stepsData||"[]") as Step[]; return <div className="flex items-center gap-1">{sd.map((s,i) => <span key={i} className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-medium ${s.status==="APPROVED"?"bg-emerald-100 text-success":s.status==="PENDING"?"bg-amber-100 text-warning":s.status==="REJECTED"?"bg-red-100 text-danger":"bg-muted text-muted-foreground"}`}>{i+1}</span>)}</div>; } },
    { id:"act", header:"操作", cell:({row}) => { if (row.original.status!=="IN_PROGRESS") return <span className="text-xs text-muted-foreground">已完成</span>; const sd = JSON.parse(row.original.stepsData||"[]") as Step[]; const cur = sd[row.original.currentStep]; const canApprove = cur?.role === session?.user?.role; return canApprove ? (<div className="flex gap-1"><Button size="sm" className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => { setSelectedId(row.original.id); setActionType("approve"); setDialogOpen(true); }}><Check className="h-3 w-3 mr-1"/>通过</Button><Button size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => { setSelectedId(row.original.id); setActionType("reject"); setDialogOpen(true); }}><X className="h-3 w-3 mr-1"/>驳回</Button></div>) : <span className="text-xs text-muted-foreground">待{cur?.label}</span>; } },
  ];

  return (
    <div>
      <PageHeader title="审批中心" description="管理所有审批流程与审批历史" />
      <DataTable columns={cols} data={data?.items??[]} searchKey="entityTitle" searchPlaceholder="搜索审批事项..." selectable selectedIds={selected} onSelectionChange={setSelected} batchBar={<Button size="sm" variant="default" onClick={() => batchApprove.mutate()} disabled={batchApprove.isPending} className="bg-emerald-600 hover:bg-emerald-700">批量通过</Button>} />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{actionType==="approve"?"审批通过":"审批驳回"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4"><div className="space-y-2"><Label>审批意见</Label><Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder={actionType==="approve"?"同意":"请填写驳回原因"} rows={3} /></div></div>
        <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button><Button variant={actionType==="approve"?"default":"destructive"} onClick={() => actMut.mutate()}>{actMut.isPending?"提交中...":actionType==="approve"?"确认通过":"确认驳回"}</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}
