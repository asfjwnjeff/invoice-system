"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Building2, Receipt, Tags, FileText, ChevronLeft, FileClock, Coins, Landmark, Calculator, FileSpreadsheet, Files, CreditCard, ScrollText, RotateCcw, Ban, ArrowDownToLine, Archive, ShieldAlert, BarChart3, ClipboardCheck } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "工作台", icon: LayoutDashboard, section: "概览" },
  { href: "/approvals", label: "审批中心", icon: ClipboardCheck, section: "概览" },
  { href: "/business-orders", label: "业务订单", icon: FileClock, section: "业务管理" },
  { href: "/fee-items", label: "费用管理", icon: Coins, section: "业务管理" },
  { href: "/revenue-orders", label: "收入订单", icon: Landmark, section: "业务管理" },
  { href: "/customer-settlements", label: "客户结算", icon: Calculator, section: "业务管理" },
  { href: "/advance-payments", label: "代垫管理", icon: CreditCard, section: "代垫关务" },
  { href: "/customs-payment-books", label: "海关票据", icon: ScrollText, section: "代垫关务" },
  { href: "/red-flush", label: "红冲管理", icon: RotateCcw, section: "红冲作废" },
  { href: "/void-applications", label: "作废管理", icon: Ban, section: "红冲作废" },
  { href: "/applications", label: "开票申请", icon: FileSpreadsheet, section: "销项发票" },
  { href: "/invoices", label: "销项发票", icon: Files, section: "销项发票" },
  { href: "/input-invoices", label: "进项发票", icon: ArrowDownToLine, section: "进项归档" },
  { href: "/payment-applications", label: "付款申请", icon: CreditCard, section: "进项归档" },
  { href: "/archive-records", label: "电子档案", icon: Archive, section: "进项归档" },
  { href: "/customers", label: "客户管理", icon: Users, section: "基础资料" },
  { href: "/suppliers", label: "供应商管理", icon: Building2, section: "基础资料" },
  { href: "/organizations", label: "公司主体", icon: Building2, section: "基础资料" },
  { href: "/tax-subjects", label: "税号管理", icon: Receipt, section: "基础资料" },
  { href: "/invoice-items", label: "服务项目", icon: Tags, section: "基础资料" },
  { href: "/tax-codes", label: "税收分类编码", icon: FileText, section: "基础资料" },
  { href: "/risk-results", label: "风控中心", icon: ShieldAlert, section: "风控报表" },
  { href: "/reports", label: "报表分析", icon: BarChart3, section: "风控报表" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const sections = [...new Set(navItems.map((i) => i.section))];

  return (
    <aside className={cn("flex flex-col border-r bg-card h-screen sticky top-0 transition-all duration-200", collapsed ? "w-[60px]" : "w-[220px]")}>
      <div className="flex h-14 items-center justify-between px-4 border-b">
        {!collapsed && <span className="font-semibold text-sm tracking-tight">发票中台</span>}
        <Button variant="ghost" size="icon" className={cn("h-7 w-7", collapsed && "mx-auto")} onClick={() => setCollapsed(!collapsed)}>
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {sections.map((section) => (
          <div key={section}>
            {!collapsed && <p className="px-3 mb-1 text-[0.6875rem] font-medium tracking-widest uppercase text-muted-foreground">{section}</p>}
            <div className="space-y-0.5">
              {navItems.filter((item) => item.section === section).map((item) => (
                <Link key={item.href} href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors",
                    pathname === item.href || pathname.startsWith(item.href + "/")
                      ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-2"
                  )}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
