"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, AlertTriangle, FileCheck, ChevronRight, FileEdit } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session } = useSession();

  const { data: appCount } = useQuery({
    queryKey: ["dashboard", "apps"],
    queryFn: async () => { const r = await fetch("/api/applications"); return (await r.json()).data?.items?.filter((i: Record<string, unknown>) => i.status === "PENDING_APPROVAL").length ?? 0; },
  });
  const { data: preInvCount } = useQuery({
    queryKey: ["dashboard", "pre-invoices"],
    queryFn: async () => { const r = await fetch("/api/pre-invoices?status=PENDING_FIRST"); return (await r.json()).data?.items?.length ?? 0; },
  });
  const { data: pendingRedFlush } = useQuery({
    queryKey: ["dashboard", "red-flush"],
    queryFn: async () => { const r = await fetch("/api/red-flush"); return (await r.json()).data?.items?.filter((i: Record<string, unknown>) => i.status === "PENDING_APPROVAL").length ?? 0; },
  });
  const { data: pendingVerify } = useQuery({
    queryKey: ["dashboard", "verify"],
    queryFn: async () => { const r = await fetch("/api/input-invoices"); return (await r.json()).data?.items?.filter((i: Record<string, unknown>) => i.verifyStatus === "PENDING").length ?? 0; },
  });

  const stats = [
    { key: "pending_apps", title: "待审批申请", value: appCount ?? 0, icon: FileText, href: "/approvals" },
    { key: "pre_inv", title: "待一审预制发票", value: preInvCount ?? 0, icon: FileEdit, href: "/pre-invoices" },
    { key: "red", title: "待红冲", value: pendingRedFlush ?? 0, icon: AlertTriangle, href: "/red-flush" },
    { key: "verify", title: "待查验进项", value: pendingVerify ?? 0, icon: FileCheck, href: "/input-invoices" },
  ];

  const shortcuts = [
    { label: "录入收入订单", href: "/revenue-orders" },
    { label: "新建开票申请", href: "/applications/new" },
    { label: "生成预制发票", href: "/pre-invoices/new" },
    { label: "查看销项发票", href: "/invoices" },
    { label: "录入进项发票", href: "/input-invoices" },
    { label: "成本录入", href: "/cost-entry" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">工作台</h1>
        <p className="text-sm text-muted-foreground mt-1">欢迎回来，{session?.user?.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.key} href={stat.href}>
              <Card className="border hover:border-accent/50 transition-colors cursor-pointer">
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
            </Link>
          );
        })}
      </div>

      {/* Full flow guide */}
      <Card className="border">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-4">完整开票流程</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <Link href="/revenue-orders" className="px-3 py-1.5 rounded-sm bg-muted hover:bg-accent/20 transition-colors font-medium text-foreground">① 录入收入</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/applications" className="px-3 py-1.5 rounded-sm bg-muted hover:bg-accent/20 transition-colors font-medium text-foreground">② 制单申请</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/approvals" className="px-3 py-1.5 rounded-sm bg-muted hover:bg-accent/20 transition-colors font-medium text-foreground">③ 审批</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/pre-invoices" className="px-3 py-1.5 rounded-sm bg-muted hover:bg-accent/20 transition-colors font-medium text-foreground">④ 预制发票</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="px-3 py-1.5 rounded-sm bg-muted">⑤ 两次审核</span>
            <ChevronRight className="h-3 w-3" />
            <span className="px-3 py-1.5 rounded-sm bg-muted">⑥ 推送税局</span>
            <ChevronRight className="h-3 w-3" />
            <Link href="/invoices" className="px-3 py-1.5 rounded-sm bg-accent/20 hover:bg-accent/30 transition-colors font-medium text-foreground">⑦ 推送发票</Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <Card className="border">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold text-sm">其他功能</h3>
            <Link href="/red-flush" className="flex items-center justify-between rounded-sm px-3 py-2 hover:bg-muted transition-colors">
              <span className="text-sm">红冲管理</span><ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link href="/cost-entry" className="flex items-center justify-between rounded-sm px-3 py-2 hover:bg-muted transition-colors">
              <span className="text-sm">成本录入（F01/C01）</span><ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link href="/input-invoices" className="flex items-center justify-between rounded-sm px-3 py-2 hover:bg-muted transition-colors">
              <span className="text-sm">进项发票</span><ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
