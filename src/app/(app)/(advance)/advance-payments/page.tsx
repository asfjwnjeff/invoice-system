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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useEntitySelect } from "@/lib/hooks/use-entity-select";

const COMPANY_OPTIONS = [
  { value: "HMG", label: "[HMG]泓明供应链" }, { value: "HMGHY", label: "[HMGHY]泓明国际货运" }, { value: "HMGYL", label: "[HMGYL]泓明医疗" },
  { value: "SHYMT", label: "[SHYMT]泓明数科" }, { value: "WXHMG", label: "[WXHMG]无锡泓明" }, { value: "HMGWX", label: "[HMGWX]泓明无锡分公司" },
  { value: "SZHMG", label: "[SZHMG]深圳泓明" }, { value: "FJHMG", label: "[FJHMG]福建泓明" }, { value: "XAHMG", label: "[XAHMG]西安泓志" },
  { value: "SXHMG", label: "[SXHMG]陕西泓明" }, { value: "BJHMG", label: "[BJHMG]北京泓明" }, { value: "HFMHG", label: "[HFMHG]合肥泓明" },
  { value: "CDHMG", label: "[CDHMG]成都泓明" }, { value: "WHHMG", label: "[WHHMG]武汉泓明" }, { value: "DLHMG", label: "[DLHMG]大连泓明" },
  { value: "NJHMG", label: "[NJHMG]南京泓明" }, { value: "HFBHMG", label: "[HFBHMG]合肥B保泓明" }, { value: "WMRO", label: "[WMRO]WMRO" },
  { value: "HMJCK", label: "[HMJCK]泓明进出口" }, { value: "SHXF", label: "[SHXF]芯丰" }, { value: "HFPHMG", label: "[HFPHMG]合肥中外运" },
  { value: "SHXHM", label: "[SHXHM]绍兴泓明" }, { value: "WHHMGB", label: "[WHHMGB]武汉泓明供应链" }, { value: "CANHM", label: "[CANHM]广州泓明" },
  { value: "HMGYT", label: "[HMGYT]香港运通" }, { value: "JSHM", label: "[JSHM]江苏泓明" }, { value: "HZHMG", label: "[HZHMG]杭州泓明" },
  { value: "SHGC", label: "[SHGC]国创供应链" }, { value: "CDHMGB", label: "[CDHMGB]成都泓明供应链" }, { value: "JNHMG", label: "[JNHMG]济南泓明" },
  { value: "BJHMGB", label: "[BJHMGB]北京泓明物流" }, { value: "HMHMG", label: "[HMHMG]航贸" }, { value: "BJYC", label: "[BJYC]北京予创" },
  { value: "SZXHMHMG", label: "[SZXHMHMG]深圳航贸" },
];

const ZONE_OPTIONS = ["HFE","NKG","WUX","ZHJ","XMN","WUH","PSZ","HFB","WGQ","BJS","SZX","SIA","XIY","GDW","DLC","CTU","HXQ","SZF","PVG","HEQ","HFP","SIS","SEA","QIP","JID","DTM","HQC","QPA","SHX","CAN","HQD","PMD","GQA","TZA","LGS","TAO","TNA","HGH","QPB","CDB","PAD","PAC","EHU","PEK"];

const FEE_TYPE_OPTIONS = [
  { value: "搬运费", label: "搬运费" }, { value: "装卸费", label: "装卸费" }, { value: "KJ3税金", label: "KJ3税金" },
  { value: "机场提货费", label: "机场提货费" }, { value: "海关监管仓储费", label: "海关监管仓储费" }, { value: "仓储费", label: "仓储费" },
  { value: "磁检费", label: "磁检费" }, { value: "港杂费", label: "港杂费" }, { value: "检验证书费", label: "检验证书费" },
  { value: "品质鉴定报告费", label: "品质鉴定报告费" }, { value: "保险费", label: "保险费" }, { value: "宽带网络费", label: "宽带网络费" },
  { value: "换单费", label: "换单费" }, { value: "空运费", label: "空运费" },
];

const CURRENCY_OPTIONS = [
  { value: "CNY", label: "人民币" }, { value: "USD", label: "美元" }, { value: "HKD", label: "港币" },
  { value: "JPY", label: "日元" }, { value: "EUR", label: "欧元" }, { value: "AUD", label: "澳大利亚元" },
  { value: "GBP", label: "英镑" }, { value: "SGD", label: "新加坡元" },
];

const COLLECTION_LABELS: Record<string, string> = { PENDING: "待收款", PARTIALLY: "部分收款", COLLECTED: "已收款", WRITTEN_OFF: "已核销" };

interface T { id: string; advanceNo: string; organization?: { name: string } | null; zone: string | null; supplier?: { name: string } | null; feeType: string; currency: string; originalAmount: number; businessOrderNo: string | null; mawbNo: string | null; status: string; collectionStatus: string; createdAt: string; }

const E = "advance-payments";

export default function Page() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const supplierSelect = useEntitySelect("/api/suppliers/select");
  const [f, setF] = useState({ advanceNo:"", organizationId:"", zone:"", supplierId:"", bankAccountNo:"", feeType:"", occurredDate:new Date().toISOString().slice(0,10), currency:"CNY", originalAmount:0, businessOrderNo:"", mawbNo:"", remark:"" });

  const { data } = useQuery({ queryKey:[E], queryFn: async () => { const r = await fetch(`/api/${E}`); const j = await r.json(); return j.data as { items: T[] }; } });
  const sm = useMutation({ mutationFn: async () => { const m = editId ? "PUT" : "POST"; const u = editId ? `/api/${E}/${editId}` : `/api/${E}`; const r = await fetch(u, { method:m, headers:{"Content-Type":"application/json"}, body:JSON.stringify(f) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success(editId ? "已更新" : "已创建"); setOpen(false); reset(); qc.invalidateQueries({queryKey:[E]}); } else toast.error(r.error ?? "失败"); } });
  const dm = useMutation({ mutationFn: (id: string) => fetch(`/api/${E}/${id}`, { method:"DELETE" }), onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({queryKey:[E]}); } });
  const reset = () => { setEditId(null); setF({ advanceNo:"", organizationId:"", zone:"", supplierId:"", bankAccountNo:"", feeType:"", occurredDate:new Date().toISOString().slice(0,10), currency:"CNY", originalAmount:0, businessOrderNo:"", mawbNo:"", remark:"" }); };

  const sv = (s: string): "success"|"warning"|"danger"|"neutral" => s==="COLLECTED"||s==="APPROVED"?"success":s==="PARTIALLY"||s==="PENDING_COLLECTION"?"warning":s==="DISPUTED"?"danger":"neutral";

  const cols: ColumnDef<T>[] = [
    { accessorKey:"advanceNo", header:"预付款单号", cell:({row}) => <span className="font-medium tabular-nums">{row.original.advanceNo}</span> },
    { accessorKey:"collectionStatus", header:"状态", cell:({row}) => <StatusBadge status={COLLECTION_LABELS[row.original.collectionStatus] ?? row.original.collectionStatus} variant={sv(row.original.collectionStatus)} /> },
    { accessorKey:"organization.name", header:"预付款公司", cell:({row}) => row.original.organization?.name ?? "-" },
    { accessorKey:"zone", header:"区域" },
    { accessorKey:"supplier.name", header:"供应商", cell:({row}) => row.original.supplier?.name ?? "-" },
    { accessorKey:"feeType", header:"费用项目" },
    { accessorKey:"currency", header:"币种" },
    { accessorKey:"originalAmount", header:"金额", cell:({row}) => <span className="tabular-nums">¥{row.original.originalAmount.toLocaleString()}</span> },
    { accessorKey:"businessOrderNo", header:"业务编号", cell:({row}) => row.original.businessOrderNo ?? "-" },
    { accessorKey:"mawbNo", header:"提单号", cell:({row}) => row.original.mawbNo ?? "-" },
    { accessorKey:"createdAt", header:"创建时间", cell:({row}) => new Date(row.original.createdAt).toLocaleDateString("zh-CN") },
    { id:"act", header:"操作", cell:({row}) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" className="h-8" onClick={() => { setEditId(row.original.id); setF({ advanceNo:row.original.advanceNo, organizationId:"", zone:row.original.zone??"", supplierId:"", bankAccountNo:"", feeType:row.original.feeType, occurredDate:"", currency:row.original.currency, originalAmount:row.original.originalAmount, businessOrderNo:row.original.businessOrderNo??"", mawbNo:row.original.mawbNo??"", remark:"" }); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="预付款登记" description="C11 预付款登记 — 公司/区域/供应商/费用/币种/金额" actionLabel="新增" onAction={() => { reset(); setOpen(true); }} />
      <DataTable columns={cols} data={data?.items??[]} searchKey="advanceNo" searchPlaceholder="搜索预付款单号..." />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editId ? "编辑预付款" : "新增预付款"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Row 1: 预付款单号 + 预付款公司 */}
            <div className="space-y-2"><Label>预付款单号</Label><Input value={f.advanceNo} onChange={e => setF({...f, advanceNo:e.target.value})} placeholder="自动生成" /></div>
            <div className="space-y-2"><Label>预付款公司 *</Label>
              <Select value={f.organizationId} onValueChange={v => setF({...f, organizationId:v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COMPANY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Row 2: 预付款区域 + 单据日期 */}
            <div className="space-y-2"><Label>预付款区域 *</Label>
              <Select value={f.zone} onValueChange={v => setF({...f, zone:v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ZONE_OPTIONS.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>单据日期 *</Label><Input type="date" value={f.occurredDate} onChange={e => setF({...f, occurredDate:e.target.value})} /></div>
            {/* Row 3: 费用项目 + 供应商 */}
            <div className="space-y-2"><Label>费用项目 *</Label>
              <Select value={f.feeType} onValueChange={v => setF({...f, feeType:v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FEE_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>供应商 *</Label>
              <Select value={f.supplierId} onValueChange={v => setF({...f, supplierId:v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(supplierSelect.data??[]).map((s: {id:string;label:string}) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Row 4: 收款账号 + 币种 */}
            <div className="space-y-2"><Label>收款账号 *</Label><Input value={f.bankAccountNo} onChange={e => setF({...f, bankAccountNo:e.target.value})} placeholder="选供应商后填入" /></div>
            <div className="space-y-2"><Label>币种 *</Label>
              <Select value={f.currency} onValueChange={v => setF({...f, currency:v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Row 5: 金额 */}
            <div className="space-y-2"><Label>金额 *</Label><Input type="number" value={f.originalAmount} onChange={e => setF({...f, originalAmount:+e.target.value})} /></div>
            {/* Row 6: 业务编号 + 提单号 */}
            <div className="space-y-2"><Label>业务编号</Label><Input value={f.businessOrderNo} onChange={e => setF({...f, businessOrderNo:e.target.value})} /></div>
            <div className="space-y-2"><Label>提单号</Label><Input value={f.mawbNo} onChange={e => setF({...f, mawbNo:e.target.value})} /></div>
            {/* Row 7: 备注 */}
            <div className="col-span-2 space-y-2"><Label>备注</Label><Input value={f.remark} onChange={e => setF({...f, remark:e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>取消</Button><Button onClick={() => sm.mutate()}>{sm.isPending?"保存中...":"保存"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleteId} onOpenChange={() => setDeleteId(null)}
        title="确认删除" description="确认要删除吗？此操作不可撤销。"
        confirmLabel="删除" variant="danger" loading={dm.isPending}
        onConfirm={() => deleteId && dm.mutate(deleteId)}
      />
    </div>
  );
}
