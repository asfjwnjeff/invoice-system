import { LayoutDashboard, ClipboardCheck, FileClock, Coins, Landmark, Calculator, FileSpreadsheet, Files, FileEdit, RotateCcw, ArrowDownToLine, Receipt, Ban } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  section: string;
}

export const navItems: NavItem[] = [
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

/** All unique section names, in display order */
export const navSections = [...new Set(navItems.map((i) => i.section))];

/** Given a pathname, return the matching section name */
export function getSectionByPath(pathname: string): string {
  const item = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );
  return item?.section ?? "";
}
