"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormDialog, FormField } from "@/components/shared/form-dialog";
import { SelectSearch } from "@/components/ui/select-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FilterPanel } from "@/components/shared/filter-panel";
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

const FEE_TYPE_OPTIONS = ["搬运费","装卸费","KJ3税金","机场提货费","海关监管仓储费","仓储费","磁检费","港杂费","检验证书费","品质鉴定报告费","保险费","宽带网络费","换单费","空运费"];

const CURRENCY_OPTIONS = ["CNY","USD","HKD","JPY","EUR","AUD","GBP","SGD"];
const CURRENCY_LABELS: Record<string,string> = { CNY:"人民币", USD:"美元", HKD:"港币", JPY:"日元", EUR:"欧元", AUD:"澳大利亚元", GBP:"英镑", SGD:"新加坡元" };

const COLLECTION_LABELS: Record<string, string> = { PENDING: "待收款", PARTIALLY: "部分收款", COLLECTED: "已收款", WRITTEN_OFF: "已核销" };
const STATUS_TABS = [
  { key: "", label: "全部" },
  { key: "COLLECTED", label: "付款" },
  { key: "WRITTEN_OFF", label: "核销" },
];

interface T { id: string; advanceNo: string; organization?: { name: string } | null; zone: string | null; supplier?: { name: string } | null; feeType: string; currency: string; originalAmount: number; businessOrderNo: string | null; mawbNo: string | null; collectionStatus: string; createdAt: string; }

const E = "advance-payments";
const dt = () => new Date().toISOString().slice(0, 10);
const empty = () => ({ advanceNo:"", organizationId:"", zone:"", supplierId:"", bankAccountNo:"", feeType:"", occurredDate:dt(), currency:"CNY", originalAmount:0, businessOrderNo:"", mawbNo:"", remark:"" });


export default function Page() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [orgF, setOrgF] = useState(""); const [zoneF, setZoneF] = useState(""); const [feeF, setFeeF] = useState(""); const [statusF, setStatusF] = useState("");
  const [applied, setApplied] = useState({ org:"", zone:"", fee:"", status:"" });
  const [filterOrder, setFilterOrder] = useState<string[]>(["company","zone","fee","status"]);
  const [f, setF] = useState(empty());
  const supplierItems = useEntitySelect("/api/suppliers/select");
  const supplierOptions = (supplierItems.data ?? []) as { id: string; label: string }[];

  const { data } = useQuery({ queryKey:[E], queryFn: async () => { const r = await fetch(`/api/${E}`); const j = await r.json(); return j.data as { items: T[] }; } });
  const sm = useMutation({ mutationFn: async () => { const m = editId ? "PUT" : "POST"; const u = editId ? `/api/${E}/${editId}` : `/api/${E}`; const r = await fetch(u, { method:m, headers:{"Content-Type":"application/json"}, body:JSON.stringify(f) }); return r.json(); }, onSuccess: (r) => { if (r.success) { toast.success(editId ? "已更新" : "已创建"); setOpen(false); setF(empty()); setEditId(null); qc.invalidateQueries({queryKey:[E]}); } else toast.error(r.error ?? "失败"); } });
  const dm = useMutation({ mutationFn: (id: string) => fetch(`/api/${E}/${id}`, { method:"DELETE" }), onSuccess: () => { toast.success("已删除"); qc.invalidateQueries({queryKey:[E]}); } });
  const sv = (s: string): "success"|"warning"|"danger"|"neutral" => s==="COLLECTED"||s==="APPROVED"?"success":s==="PARTIALLY"||s==="PENDING_COLLECTION"?"warning":"neutral";

  const cols: ColumnDef<T>[] = [
    { accessorKey:"advanceNo", header:"预付款单号", cell:({row}) => <span className="font-medium tabular-nums">{row.original.advanceNo}</span> },
    { accessorKey:"collectionStatus", header:"状态", cell:({row}) => <StatusBadge status={COLLECTION_LABELS[row.original.collectionStatus] ?? row.original.collectionStatus} variant={sv(row.original.collectionStatus)} /> },
    { accessorKey:"organization.name", header:"预付款公司", cell:({row}) => row.original.organization?.name ?? "-" },
    { accessorKey:"zone", header:"区域" },
    { accessorKey:"supplier.name", header:"供应商", cell:({row}) => row.original.supplier?.name ?? "-" },
    { accessorKey:"feeType", header:"费用项目" },
    { accessorKey:"currency", header:"币种", cell:({row}) => CURRENCY_LABELS[row.original.currency] ?? row.original.currency },
    { accessorKey:"originalAmount", header:"金额", cell:({row}) => <span className="tabular-nums">¥{row.original.originalAmount.toLocaleString()}</span> },
    { accessorKey:"businessOrderNo", header:"业务编号", cell:({row}) => row.original.businessOrderNo ?? "-" },
    { accessorKey:"mawbNo", header:"提单号", cell:({row}) => row.original.mawbNo ?? "-" },
    { accessorKey:"createdAt", header:"创建时间", cell:({row}) => new Date(row.original.createdAt).toLocaleDateString("zh-CN") },
    { id:"act", header:"操作", meta: { headerClassName: "text-center" }, cell:({row}) => {
      const load = () => setF({ advanceNo:row.original.advanceNo, organizationId:row.original.organization?.name ? COMPANY_OPTIONS.find(c=>c.label===row.original.organization?.name)?.value??"" : "", zone:row.original.zone??"", supplierId:row.original.supplier?.name ? (supplierOptions.find(s=>s.label===row.original.supplier?.name)?.id??"") : "", bankAccountNo:"", feeType:row.original.feeType, occurredDate:"", currency:row.original.currency, originalAmount:row.original.originalAmount, businessOrderNo:row.original.businessOrderNo??"", mawbNo:row.original.mawbNo??"", remark:"" });
      return (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" className="h-8" onClick={() => { setEditId(row.original.id); load(); setViewMode(true); setOpen(true); }}>查看</Button>
        <Button variant="ghost" size="sm" className="h-8" onClick={() => { setEditId(row.original.id); load(); setViewMode(false); setOpen(true); }}><Pencil className="h-3.5 w-3.5 mr-1" />编辑</Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    ); } },
  ];

  return (
    <div>
      <PageHeader title="预付款登记" description="C11 预付款登记" actionLabel="新增" onAction={() => { setEditId(null); setViewMode(false); setF(empty()); setOpen(true); }} />
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <FilterPanel
          fields={[
            {key:"company",label:"预付款公司"},{key:"zone",label:"区域"},
            {key:"fee",label:"费用项目"},{key:"status",label:"状态"},
            {key:"keyword",label:"预付款单号"},{key:"supplier",label:"供应商"},
            {key:"currency",label:"币种"},{key:"bizNo",label:"业务编号"},
            {key:"mawb",label:"提单号"},
          ]}
          storageKey="advance-filter-order"
          onOrderChange={setFilterOrder}
        />
        {filterOrder.includes("company") && <><span className="text-sm text-muted-foreground">预付款公司</span>
        <SelectSearch value={orgF} onValueChange={v => setOrgF(v)} options={[{value:"",label:"全部"},...COMPANY_OPTIONS]} placeholder="全部" className="w-[240px]" /></>}
        {filterOrder.includes("zone") && <><span className="text-sm text-muted-foreground">区域</span>
        <SelectSearch value={zoneF} onValueChange={v => setZoneF(v)} options={[{value:"",label:"全部"},...ZONE_OPTIONS.map(z=>({value:z,label:z}))]} placeholder="全部" className="w-[120px]" /></>}
        {filterOrder.includes("fee") && <><span className="text-sm text-muted-foreground">费用项目</span>
        <SelectSearch value={feeF} onValueChange={v => setFeeF(v)} options={[{value:"",label:"全部"},...FEE_TYPE_OPTIONS.map(o=>({value:o,label:o}))]} placeholder="全部" className="w-[170px]" /></>}
        {filterOrder.includes("status") && <><span className="text-sm text-muted-foreground">状态</span>
        <SelectSearch value={statusF} onValueChange={v => setStatusF(v)} options={[{value:"",label:"全部"},...STATUS_TABS.filter(t=>t.key).map(t=>({value:t.key,label:t.label}))]} placeholder="全部" className="w-[110px]" /></>}
        <span className="border-l border-border h-5 mx-1" />
        <Button size="sm" className="h-8 text-xs" onClick={() => setApplied({ org:orgF, zone:zoneF, fee:feeF, status:statusF })}>查询</Button>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setOrgF(""); setZoneF(""); setFeeF(""); setStatusF(""); setApplied({ org:"", zone:"", fee:"", status:"" }); }}>重置</Button>
      </div>
      <DataTable columns={cols} data={(data?.items??[]).filter(i => {
        if (applied.org && i.organization?.name !== COMPANY_OPTIONS.find(c=>c.value===applied.org)?.label) return false;
        if (applied.zone && i.zone !== applied.zone) return false;
        if (applied.fee && i.feeType !== applied.fee) return false;
        if (applied.status && i.collectionStatus !== applied.status) return false;
        return true;
      })} searchKey="advanceNo" searchPlaceholder="搜索预付款单号..." selectable selectedIds={selected} onSelectionChange={setSelected} stickyRightColumns={["act"]} />

      <FormDialog open={open} onOpenChange={v => { setOpen(v); if (!v) setViewMode(false); }} title={viewMode ? "查看预付款" : editId ? "编辑预付款" : "新增预付款"} width="2xl" loading={!viewMode && sm.isPending} onSubmit={() => !viewMode && sm.mutate()}>
        <fieldset disabled={viewMode} className="contents">
        <FormField label="预付款公司" required>
          <Select value={f.organizationId} onValueChange={v => setF({...f, organizationId:v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{COMPANY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </FormField>
        <FormField label="预付款区域" required>
          <Select value={f.zone} onValueChange={v => setF({...f, zone:v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{ZONE_OPTIONS.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
          </Select>
        </FormField>
        <FormField label="单据日期" required>
          <Input type="date" value={f.occurredDate} onChange={e => setF({...f, occurredDate:e.target.value})} />
        </FormField>
        <FormField label="供应商" required>
          <SelectSearch
            value={f.supplierId}
            onValueChange={v => setF({...f, supplierId:v})}
            options={supplierOptions.map(o => ({ value: o.id, label: o.label }))}
            placeholder="搜索供应商..."
          />
        </FormField>
        <FormField label="费用项目" required>
          <Select value={f.feeType} onValueChange={v => setF({...f, feeType:v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{FEE_TYPE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </FormField>
        <FormField label="币种" required>
          <Select value={f.currency} onValueChange={v => setF({...f, currency:v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CURRENCY_OPTIONS.map(c => <SelectItem key={c} value={c}>{CURRENCY_LABELS[c] ?? c}</SelectItem>)}</SelectContent>
          </Select>
        </FormField>
        <FormField label="收款账号" required>
          <Input value={f.bankAccountNo} onChange={e => setF({...f, bankAccountNo:e.target.value})} placeholder="选供应商后填入" />
        </FormField>
        <FormField label="金额" required>
          <Input type="number" value={f.originalAmount} onChange={e => setF({...f, originalAmount:+e.target.value})} />
        </FormField>
        <FormField label="预付款单号">
          <Input value={f.advanceNo} onChange={e => setF({...f, advanceNo:e.target.value})} placeholder="自动生成" />
        </FormField>
        <FormField label="业务编号">
          <Input value={f.businessOrderNo} onChange={e => setF({...f, businessOrderNo:e.target.value})} />
        </FormField>
        <FormField label="提单号">
          <Input value={f.mawbNo} onChange={e => setF({...f, mawbNo:e.target.value})} />
        </FormField>
        <FormField label="备注" fullWidth>
          <Input value={f.remark} onChange={e => setF({...f, remark:e.target.value})} />
        </FormField>
        </fieldset>
      </FormDialog>

      <ConfirmDialog
        open={!!deleteId} onOpenChange={() => setDeleteId(null)}
        title="确认删除" description="确认要删除吗？此操作不可撤销。"
        confirmLabel="删除" variant="danger" loading={dm.isPending}
        onConfirm={() => deleteId && dm.mutate(deleteId)}
      />
    </div>
  );
}
