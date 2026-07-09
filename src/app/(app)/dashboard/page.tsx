"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CreditCard, AlertTriangle, FileCheck, Archive, ChevronRight } from "lucide-react";
import Link from "next/link";

const stats = [
  { key: "pending_apps", title: "待开票", value: 0, icon: FileText, href: "/applications" },
  { key: "advance", title: "代垫待收", value: 0, icon: CreditCard, href: "/advance-payments" },
  { key: "red", title: "待红冲", value: 0, icon: AlertTriangle, href: "/red-flush" },
  { key: "verify", title: "待查验", value: 0, icon: FileCheck, href: "/input-invoices" },
  { key: "archive", title: "待归档", value: 0, icon: Archive, href: "/archive" },
  { key: "risks", title: "高风险事项", value: 0, icon: AlertTriangle, href: "/risk" },
];

const pendingItems = [
  { label: "待审批开票申请", count: 0, href: "/applications", variant: "default" },
  { label: "待确认代垫单", count: 0, href: "/advance-payments", variant: "warning" },
  { label: "待处理高风险", count: 0, href: "/risk", variant: "danger" },
  { label: "待归档发票", count: 0, href: "/archive", variant: "default" },
];

const shortcuts = [
  { label: "新建开票申请", href: "/applications/new" },
  { label: "新建代垫单", href: "/advance-payments/new" },
  { label: "录入进项发票", href: "/input-invoices/collection" },
  { label: "录入海关缴款书", href: "/customs-payment-books/new" },
];

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">工作台</h1>
        <p className="text-sm text-muted-foreground mt-1">欢迎回来，{session?.user?.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.key} className="border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-semibold tabular-nums tracking-tight">{stat.value.toLocaleString()}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold text-sm">待办事项</h3>
            {pendingItems.map((item) => (
              <Link key={item.label} href={item.href}
                className="flex items-center justify-between rounded-sm px-3 py-2 hover:bg-muted transition-colors">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums bg-muted text-muted-foreground">
                  {item.count}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold text-sm">快捷入口</h3>
            {shortcuts.map((item) => (
              <Link key={item.label} href={item.href}
                className="flex items-center justify-between rounded-sm px-3 py-2 hover:bg-muted transition-colors">
                <span className="text-sm">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
