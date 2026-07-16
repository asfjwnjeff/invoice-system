"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, ChevronLeft, ChevronDown, FileClock, Coins, Landmark, Calculator, FileSpreadsheet, Files, FileEdit, RotateCcw, ArrowDownToLine, ClipboardCheck, Receipt, Ban } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "工作台", icon: LayoutDashboard, section: "概览" },
  { href: "/approvals", label: "审批中心", icon: ClipboardCheck, section: "概览" },
  { href: "/revenue-orders", label: "收入订单", icon: Landmark, section: "业务管理" },
  { href: "/business-orders", label: "业务订单", icon: FileClock, section: "业务管理" },
  { href: "/fee-items", label: "费用管理", icon: Coins, section: "业务管理" },
  { href: "/customer-settlements", label: "客户结算", icon: Calculator, section: "业务管理" },
  { href: "/applications", label: "开票申请", icon: FileSpreadsheet, section: "销项发票" },
  { href: "/pre-invoices", label: "预制发票", icon: FileEdit, section: "销项发票" },
  { href: "/invoices", label: "销项发票管理", icon: Files, section: "销项发票" },
  { href: "/advance-payments", label: "代垫管理", icon: Receipt, section: "预付款" },
  { href: "/red-flush", label: "红冲管理", icon: RotateCcw, section: "红冲作废" },
  { href: "/void-applications", label: "作废管理", icon: Ban, section: "红冲作废" },
  { href: "/input-invoices", label: "进项发票", icon: ArrowDownToLine, section: "进项归档" },
  { href: "/cost-entry", label: "成本录入", icon: Calculator, section: "进项归档" },
];

const sections = [...new Set(navItems.map((i) => i.section))];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const defaultOpen = (() => {
    const currentItem = navItems.find(item => pathname === item.href || pathname.startsWith(item.href + "/"));
    return currentItem ? currentItem.section : "";
  })();

  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set(sections));

  useEffect(() => {
    if (defaultOpen) {
      setOpenSections(prev => { const next = new Set(prev); next.add(defaultOpen); return next; });
    }
  }, [defaultOpen]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section); else next.add(section);
      return next;
    });
  };

  return (
    <aside className={cn("flex flex-col border-r border-sidebar-border bg-sidebar h-screen sticky top-0 transition-all duration-200", collapsed ? "w-[60px]" : "w-[220px]")}>
      {/* Header — title never shrinks */}
      <div className={cn("flex items-center justify-between px-4 border-b border-sidebar-border shrink-0", collapsed ? "h-14 flex-col justify-center gap-0.5" : "h-14")}>
        {!collapsed ? (
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm tracking-tight text-sidebar-foreground truncate">发票模块</span>
            <span className="text-[0.625rem] text-sidebar-foreground/35 leading-none mt-0.5">v2.0</span>
          </div>
        ) : (
          <span className="text-[0.625rem] text-sidebar-foreground/35 leading-none">v2.0</span>
        )}
        <Button variant="ghost" size="icon" className={cn("h-7 w-7 text-sidebar-foreground hover:bg-sidebar-accent shrink-0", collapsed && "mt-0.5")} onClick={() => setCollapsed(!collapsed)}>
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 no-scrollbar">
        {sections.map((section, sectionIdx) => {
          const sectionItems = navItems.filter((item) => item.section === section);
          const isOpen = openSections.has(section);
          const isActive = sectionItems.some(item => pathname === item.href || pathname.startsWith(item.href + "/"));

          return (
            <div key={section}>
              {sectionIdx > 0 && (
                <div className={cn("mx-3 my-2.5 h-px bg-sidebar-border", collapsed && "mx-2")} />
              )}

              {!collapsed ? (
                <button
                  onClick={() => toggleSection(section)}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-1.5 text-[0.6875rem] font-medium tracking-widest uppercase transition-colors rounded-sm",
                    isActive ? "text-sidebar-foreground" : "text-sidebar-foreground/40 hover:text-sidebar-foreground/60"
                  )}
                >
                  <span>{section}</span>
                  <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
                </button>
              ) : (
                <div className="px-1 py-1 flex justify-center">
                  <div className="w-6 h-0.5 rounded bg-sidebar-foreground/20" />
                </div>
              )}

              {(!collapsed ? isOpen : true) && (
                <div className={cn("space-y-0.5", !collapsed && "mt-0.5")}>
                  {sectionItems.map((item) => (
                    <Link key={item.href} href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors",
                        pathname === item.href || pathname.startsWith(item.href + "/")
                          ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        collapsed && "justify-center px-2"
                      )}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
