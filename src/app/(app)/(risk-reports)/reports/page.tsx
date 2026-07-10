"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { FileText, CreditCard, RotateCcw, AlertTriangle } from "lucide-react";

const reportCards = [
  { title:"销项发票台账", desc:"按客户、期间、业务类型统计", icon: FileText },
  { title:"进项发票台账", desc:"按供应商、期间、认证状态统计", icon: FileText },
  { title:"代垫费用明细", desc:"按客户、报关单、费用类型统计", icon: CreditCard },
  { title:"红冲明细表", desc:"原蓝票、红票、原因追溯", icon: RotateCcw },
  { title:"海关票据台账", desc:"报关单、税单、抵扣状态", icon: FileText },
  { title:"发票风险报表", desc:"风险类型、等级、处理状态", icon: AlertTriangle },
];

export default function Page() {
  return (
    <div>
      <PageHeader title="报表分析" description="发票业务数据统计与报表看板" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCards.map((rc) => (
          <Card key={rc.title} className="border hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><rc.icon className="h-4 w-4 text-muted-foreground" />{rc.title}</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{rc.desc}</p></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
