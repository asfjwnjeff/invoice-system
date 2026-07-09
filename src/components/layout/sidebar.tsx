"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Building2, Receipt, Tags, FileText, ChevronLeft } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "工作台", icon: LayoutDashboard, section: "概览" },
  { href: "/customers", label: "客户管理", icon: Users, section: "基础资料" },
  { href: "/suppliers", label: "供应商管理", icon: Building2, section: "基础资料" },
  { href: "/organizations", label: "公司主体", icon: Building2, section: "基础资料" },
  { href: "/tax-subjects", label: "税号管理", icon: Receipt, section: "基础资料" },
  { href: "/invoice-items", label: "服务项目", icon: Tags, section: "基础资料" },
  { href: "/tax-codes", label: "税收分类编码", icon: FileText, section: "基础资料" },
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
