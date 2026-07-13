"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { InvoicePreviewDrawer } from "@/components/shared/invoice-preview-drawer";
import { toast } from "sonner";
import { useEntitySelect } from "@/lib/hooks/use-entity-select";

const catLabels: Record<string, string> = { VAT_SPECIAL: "增值税专票", VAT_NORMAL: "增值税普票", DIGITAL_SPECIAL: "数电专票", DIGITAL_NORMAL: "数电普票" };

export default function InputInvoiceEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [previewOpen, setPreviewOpen] = useState(false);
  const { data: bizOrders } = useEntitySelect("/api/business-orders/select");
  const { data: suppliers } = useEntitySelect("/api/suppliers/select");
  const { data: costCenters } = useEntitySelect("/api/cost-centers/select");

  const [f, setF] = useState({
    invoiceNo: "", invoiceCode: "", invoiceCategory: "VAT_SPECIAL", invoicePool: "INPUT",
    sellerName: "", sellerTaxNo: "", sellerAddress: "", sellerPhone: "", sellerBankName: "", sellerBankAccount: "",
    buyerName: "", buyerTaxNo: "", buyerAddress: "", buyerPhone: "", buyerBankName: "", buyerBankAccount: "",
    issueDate: "", businessDate: "", businessDescription: "", travelServiceProvider: "",
    amountWithoutTax: 0, taxAmount: 0, amountWithTax: 0, taxRate: 13, currency: "CNY",
    entryMethod: "MANUAL", recordedBy: "", uploadFilename: "", isFromTaxAuthority: false,
    verifyStatus: "PENDING", verifiedBy: "", verifyTime: "",
    headerValidationStatus: "PENDING", headerValidationMessage: "",
    deductSelectionStatus: "UNSELECTED", deductStatus: "PENDING", nonDeductReason: "",
    voucherDate: "", voucherNo: "", deductibleAmount: "" as string | number,
    businessOrderId: "", supplierId: "", costCenterId: "", costType: "", costAllocationRatio: 100,
    isAdvanceCost: false, remark: "",
  });

  const { data: inv, isLoading } = useQuery({
    queryKey: ["input-invoice", id],
    queryFn: async () => { const r = await fetch(`/api/input-invoices/${id}`); const j = await r.json(); return j.data; },
  });

  useEffect(() => {
    if (!inv) return;
    setF({
      invoiceNo: inv.invoiceNo ?? "", invoiceCode: inv.invoiceCode ?? "",
      invoiceCategory: inv.invoiceCategory ?? "VAT_SPECIAL", invoicePool: inv.invoicePool ?? "INPUT",
      sellerName: inv.sellerName ?? "", sellerTaxNo: inv.sellerTaxNo ?? "",
      sellerAddress: inv.sellerAddress ?? "", sellerPhone: inv.sellerPhone ?? "",
      sellerBankName: inv.sellerBankName ?? "", sellerBankAccount: inv.sellerBankAccount ?? "",
      buyerName: inv.buyerName ?? "", buyerTaxNo: inv.buyerTaxNo ?? "",
      buyerAddress: inv.buyerAddress ?? "", buyerPhone: inv.buyerPhone ?? "",
      buyerBankName: inv.buyerBankName ?? "", buyerBankAccount: inv.buyerBankAccount ?? "",
      issueDate: inv.issueDate?.slice(0, 10) ?? "", businessDate: inv.businessDate?.slice(0, 10) ?? "",
      businessDescription: inv.businessDescription ?? "", travelServiceProvider: inv.travelServiceProvider ?? "",
      amountWithoutTax: Number(inv.amountWithoutTax ?? 0), taxAmount: Number(inv.taxAmount ?? 0),
      amountWithTax: Number(inv.amountWithTax ?? 0), taxRate: Number(inv.taxRate ?? 13), currency: inv.currency ?? "CNY",
      entryMethod: inv.entryMethod ?? "MANUAL", recordedBy: inv.recordedBy ?? "", uploadFilename: inv.uploadFilename ?? "",
      isFromTaxAuthority: inv.isFromTaxAuthority ?? false,
      verifyStatus: inv.verifyStatus ?? "PENDING", verifiedBy: inv.verifiedBy ?? "",
      verifyTime: inv.verifyTime?.slice(0, 16) ?? "",
      headerValidationStatus: inv.headerValidationStatus ?? "PENDING", headerValidationMessage: inv.headerValidationMessage ?? "",
      deductSelectionStatus: inv.deductSelectionStatus ?? "UNSELECTED", deductStatus: inv.deductStatus ?? "PENDING",
      nonDeductReason: inv.nonDeductReason ?? "", voucherDate: inv.voucherDate?.slice(0, 10) ?? "",
      voucherNo: inv.voucherNo ?? "", deductibleAmount: inv.deductibleAmount != null ? String(inv.deductibleAmount) : "",
      businessOrderId: inv.businessOrderId ?? "", supplierId: inv.supplierId ?? "", costCenterId: inv.costCenterId ?? "",
      costType: inv.costType ?? "", costAllocationRatio: Number(inv.costAllocationRatio ?? 100),
      isAdvanceCost: inv.isAdvanceCost ?? false, remark: inv.remark ?? "",
    });
  }, [inv]);

  const updateAmount = (amt: number, rate: number) => {
    setF(prev => ({ ...prev, amountWithoutTax: amt, taxRate: rate, taxAmount: +(amt * rate / 100).toFixed(2), amountWithTax: +(amt * (1 + rate / 100)).toFixed(2) }));
  };

  const mut = useMutation({
    mutationFn: async () => {
      const body = { ...f, deductibleAmount: f.deductibleAmount ? Number(f.deductibleAmount) : null };
      const r = await fetch(`/api/input-invoices/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return r.json();
    },
    onSuccess: (r) => { if (r.success) { toast.success("已保存"); qc.invalidateQueries({ queryKey: ["input-invoice"] }); qc.invalidateQueries({ queryKey: ["input-invoices"] }); router.push(`/input-invoices/${id}`); } else toast.error(r.error ?? "保存失败"); },
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">加载中...</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href={`/input-invoices/${id}`}><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-xl font-semibold flex-1">编辑进项发票</h1>
        <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}><Eye className="h-3.5 w-3.5 mr-1" />查看原件</Button>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending}><Save className="h-4 w-4 mr-2" />{mut.isPending ? "保存中..." : "保存"}</Button>
      </div>

      {/* 发票信息 */}
      <Card>
        <CardHeader><CardTitle className="text-base">发票信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2"><Label>发票代码</Label><Input value={f.invoiceCode} onChange={e => setF({...f, invoiceCode: e.target.value})} /></div>
          <div className="space-y-2"><Label>发票号码 *</Label><Input value={f.invoiceNo} onChange={e => setF({...f, invoiceNo: e.target.value})} /></div>
          <div className="space-y-2"><Label>票种</Label>
            <Select value={f.invoiceCategory} onValueChange={v => setF({...f, invoiceCategory: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(catLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>所属票池</Label>
            <Select value={f.invoicePool} onValueChange={v => setF({...f, invoicePool: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="INPUT">INPUT</SelectItem><SelectItem value="OUTPUT">OUTPUT</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>开票日期</Label><Input type="date" value={f.issueDate} onChange={e => setF({...f, issueDate: e.target.value})} /></div>
          <div className="space-y-2"><Label>录入方式</Label>
            <Select value={f.entryMethod} onValueChange={v => setF({...f, entryMethod: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MANUAL">手工录入</SelectItem><SelectItem value="OCR">OCR识别</SelectItem>
                <SelectItem value="IMPORT">批量导入</SelectItem><SelectItem value="PC_UPLOAD">PC端上传</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>录入人</Label><Input value={f.recordedBy} onChange={e => setF({...f, recordedBy: e.target.value})} /></div>
          <div className="col-span-2 space-y-2"><Label>上传文件名</Label><Input value={f.uploadFilename} onChange={e => setF({...f, uploadFilename: e.target.value})} /></div>
        </CardContent>
      </Card>

      {/* 业务信息 */}
      <Card>
        <CardHeader><CardTitle className="text-base">业务信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>业务发生日期</Label><Input type="date" value={f.businessDate} onChange={e => setF({...f, businessDate: e.target.value})} /></div>
          <div className="space-y-2"><Label>商旅服务商</Label><Input value={f.travelServiceProvider} onChange={e => setF({...f, travelServiceProvider: e.target.value})} /></div>
          <div className="col-span-2 space-y-2"><Label>业务说明</Label><Input value={f.businessDescription} onChange={e => setF({...f, businessDescription: e.target.value})} /></div>
        </CardContent>
      </Card>

      {/* 金额信息 */}
      <Card>
        <CardHeader><CardTitle className="text-base">金额信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>不含税金额</Label><Input type="number" value={f.amountWithoutTax} onChange={e => updateAmount(+e.target.value, f.taxRate)} /></div>
          <div className="space-y-2"><Label>税率 %</Label><Input type="number" value={f.taxRate} onChange={e => updateAmount(f.amountWithoutTax, +e.target.value)} /></div>
          <div className="space-y-2"><Label>税额</Label><Input type="number" value={f.taxAmount} disabled className="bg-muted" /></div>
          <div className="space-y-2"><Label>价税合计</Label><Input type="number" value={f.amountWithTax} disabled className="bg-muted" /></div>
          <div className="space-y-2"><Label>币种</Label>
            <Select value={f.currency} onValueChange={v => setF({...f, currency: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="CNY">人民币</SelectItem><SelectItem value="USD">美元</SelectItem><SelectItem value="HKD">港币</SelectItem></SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 销售方信息 */}
      <Card>
        <CardHeader><CardTitle className="text-base">销售方信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>销售方名称 *</Label><Input value={f.sellerName} onChange={e => setF({...f, sellerName: e.target.value})} /></div>
          <div className="space-y-2"><Label>纳税人识别号</Label><Input value={f.sellerTaxNo} onChange={e => setF({...f, sellerTaxNo: e.target.value})} /></div>
          <div className="space-y-2"><Label>地址</Label><Input value={f.sellerAddress} onChange={e => setF({...f, sellerAddress: e.target.value})} /></div>
          <div className="space-y-2"><Label>电话</Label><Input value={f.sellerPhone} onChange={e => setF({...f, sellerPhone: e.target.value})} /></div>
          <div className="space-y-2"><Label>开户行</Label><Input value={f.sellerBankName} onChange={e => setF({...f, sellerBankName: e.target.value})} /></div>
          <div className="space-y-2"><Label>银行账号</Label><Input value={f.sellerBankAccount} onChange={e => setF({...f, sellerBankAccount: e.target.value})} /></div>
        </CardContent>
      </Card>

      {/* 购买方信息 */}
      <Card>
        <CardHeader><CardTitle className="text-base">购买方信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>购买方名称</Label><Input value={f.buyerName} onChange={e => setF({...f, buyerName: e.target.value})} /></div>
          <div className="space-y-2"><Label>纳税人识别号</Label><Input value={f.buyerTaxNo} onChange={e => setF({...f, buyerTaxNo: e.target.value})} /></div>
          <div className="space-y-2"><Label>地址</Label><Input value={f.buyerAddress} onChange={e => setF({...f, buyerAddress: e.target.value})} /></div>
          <div className="space-y-2"><Label>电话</Label><Input value={f.buyerPhone} onChange={e => setF({...f, buyerPhone: e.target.value})} /></div>
          <div className="space-y-2"><Label>开户行</Label><Input value={f.buyerBankName} onChange={e => setF({...f, buyerBankName: e.target.value})} /></div>
          <div className="space-y-2"><Label>银行账号</Label><Input value={f.buyerBankAccount} onChange={e => setF({...f, buyerBankAccount: e.target.value})} /></div>
        </CardContent>
      </Card>

      {/* 风控状态 */}
      <Card>
        <CardHeader><CardTitle className="text-base">发票风控</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2"><Label>查验状态</Label>
            <Select value={f.verifyStatus} onValueChange={v => setF({...f, verifyStatus: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="PENDING">待查验</SelectItem><SelectItem value="VERIFIED">验证成功</SelectItem><SelectItem value="VERIFY_FAILED">查验失败</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>抬头校验</Label>
            <Select value={f.headerValidationStatus} onValueChange={v => setF({...f, headerValidationStatus: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="PENDING">待校验</SelectItem><SelectItem value="VALIDATED">已校验</SelectItem><SelectItem value="FAILED">校验失败</SelectItem><SelectItem value="NOT_EXIST">抬头不存在</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>查验人</Label><Input value={f.verifiedBy} onChange={e => setF({...f, verifiedBy: e.target.value})} /></div>
          <div className="space-y-2"><Label>查验时间</Label><Input type="datetime-local" value={f.verifyTime} onChange={e => setF({...f, verifyTime: e.target.value})} /></div>
          <div className="col-span-4 space-y-2"><Label>异常描述</Label><Input value={f.headerValidationMessage} onChange={e => setF({...f, headerValidationMessage: e.target.value})} /></div>
        </CardContent>
      </Card>

      {/* 记账凭证 */}
      <Card>
        <CardHeader><CardTitle className="text-base">记账凭证</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2"><Label>勾选状态</Label>
            <Select value={f.deductSelectionStatus} onValueChange={v => setF({...f, deductSelectionStatus: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="UNSELECTED">未选择</SelectItem><SelectItem value="SELECTED">已勾选</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>认证状态</Label>
            <Select value={f.deductStatus} onValueChange={v => setF({...f, deductStatus: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="PENDING">待认证</SelectItem><SelectItem value="DEDUCTED">已认证</SelectItem><SelectItem value="NOT_APPLICABLE">不适用</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-2"><Label>不抵扣原因</Label><Input value={f.nonDeductReason} onChange={e => setF({...f, nonDeductReason: e.target.value})} /></div>
          <div className="space-y-2"><Label>凭证日期</Label><Input type="date" value={f.voucherDate} onChange={e => setF({...f, voucherDate: e.target.value})} /></div>
          <div className="space-y-2"><Label>凭证号</Label><Input value={f.voucherNo} onChange={e => setF({...f, voucherNo: e.target.value})} /></div>
          <div className="space-y-2"><Label>可抵扣金额</Label><Input type="number" value={f.deductibleAmount} onChange={e => setF({...f, deductibleAmount: e.target.value})} /></div>
        </CardContent>
      </Card>

      {/* 关联信息 */}
      <Card>
        <CardHeader><CardTitle className="text-base">关联信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>关联业务订单</Label>
            <Select value={f.businessOrderId} onValueChange={v => setF({...f, businessOrderId: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(bizOrders ?? []).map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 pt-8"><Checkbox id="tax" checked={f.isFromTaxAuthority} onCheckedChange={v => setF({...f, isFromTaxAuthority: !!v})} /><Label htmlFor="tax">税局来源</Label></div>
          <div className="col-span-2 space-y-2"><Label>备注</Label><Input value={f.remark} onChange={e => setF({...f, remark: e.target.value})} /></div>
        </CardContent>
      </Card>

      {/* 成本归集 */}
      <Card>
        <CardHeader><CardTitle className="text-base">成本归集</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>供应商</Label>
            <Select value={f.supplierId} onValueChange={v => setF({...f, supplierId: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(suppliers ?? []).map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>成本中心</Label>
            <Select value={f.costCenterId} onValueChange={v => setF({...f, costCenterId: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(costCenters ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>成本类型</Label>
            <Select value={f.costType} onValueChange={v => setF({...f, costType: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TRANSPORT">运输成本</SelectItem><SelectItem value="WAREHOUSE">仓储成本</SelectItem>
                <SelectItem value="CUSTOMS">关务成本</SelectItem><SelectItem value="AGENCY">代理成本</SelectItem>
                <SelectItem value="INSURANCE">保险费</SelectItem><SelectItem value="OTHER">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>分摊比例(%)</Label><Input type="number" value={f.costAllocationRatio} onChange={e => setF({...f, costAllocationRatio: +e.target.value})} /></div>
          <div className="flex items-center space-x-2"><Checkbox id="adv" checked={f.isAdvanceCost} onCheckedChange={v => setF({...f, isAdvanceCost: !!v})} /><Label htmlFor="adv">代垫成本</Label></div>
        </CardContent>
      </Card>

      <InvoicePreviewDrawer
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        files={(inv?.invoiceFiles as { fileName: string; fileType: string; fileUrl?: string }[]) ?? [
          { fileName: inv?.uploadFilename ?? `${inv?.invoiceNo ?? "?"}.pdf`, fileType: "PDF" },
          { fileName: `${inv?.invoiceNo ?? "?"}.ofd`, fileType: "OFD" },
          { fileName: `${inv?.invoiceNo ?? "?"}.xml`, fileType: "XML" },
        ]}
        recordedBy={inv?.recordedBy}
        uploadFilename={inv?.uploadFilename}
        createdAt={inv?.createdAt}
      />
    </div>
  );
}
