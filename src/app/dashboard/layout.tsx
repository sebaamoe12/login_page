"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Users, Wallet, Banknote, BarChart3, Menu, LogOut, ChevronDown, Store, Shirt, Building2, Receipt, Factory, Package, Box, UserCircle, Cpu, ClipboardList, DollarSign, Settings } from "lucide-react";
import { ToastProvider } from "@/components/ui/toast";
import SignOutButton from "./sign-out-button";
import { m } from "@/shared/messages";

interface NavItem {
  label: string;
  href?: string;
  icon?: any;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: m.nav.dashboard, icon: LayoutDashboard },
  {
    label: "Pourelle", icon: Store, children: [
      { href: "/dashboard/pourelle", label: m.pour.hub, icon: LayoutDashboard },
      { href: "/dashboard/pourelle/products", label: m.pour.products, icon: Shirt },
      { href: "/dashboard/pourelle/suppliers", label: m.pour.suppliers, icon: Building2 },
      { href: "/dashboard/pourelle/sales", label: m.pour.sales, icon: Receipt },
    ],
  },
  {
    label: "Fabrex", icon: Factory, children: [
      { href: "/dashboard/fabrex", label: m.fabr.hub, icon: LayoutDashboard },
      { href: "/dashboard/fabrex/products", label: m.fabr.products, icon: Package },
      { href: "/dashboard/fabrex/raw-materials", label: m.fabr.rawMaterials, icon: Box },
      { href: "/dashboard/fabrex/suppliers", label: m.fabr.suppliers, icon: Building2 },
      { href: "/dashboard/fabrex/clients", label: m.fabr.clients, icon: UserCircle },
      { href: "/dashboard/fabrex/machines", label: m.fabr.machines, icon: Cpu },
      { href: "/dashboard/fabrex/production-orders", label: m.fabr.productionOrders, icon: ClipboardList },
      { href: "/dashboard/fabrex/sales", label: m.fabr.sales, icon: Receipt },
      { href: "/dashboard/fabrex/expenses", label: m.fabr.frais, icon: DollarSign },
      { href: "/dashboard/fabrex/company-settings", label: m.fabr.companySettings, icon: Settings },
    ],
  },
  {
    label: m.nav.payroll, icon: Wallet, children: [
      { href: "/dashboard/employees", label: m.nav.employees, icon: Users },
      { href: "/dashboard/payroll", label: m.nav.payroll, icon: Wallet },
      { href: "/dashboard/advances", label: m.nav.advances, icon: Banknote },
    ],
  },
  { href: "/dashboard/reports", label: m.nav.reports, icon: BarChart3 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (label: string) => {
    setExpanded(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const isChildActive = (children: NavItem[]): boolean => {
    return children.some(c => c.href === pathname);
  };

  return (
    <ToastProvider>
      <div className="flex h-full flex-1 overflow-hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-50 flex items-center justify-center rounded-lg border border-zinc-700 bg-sidebar p-2.5 shadow-sm md:hidden hover:bg-white/10 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5 text-white" />
        </button>

        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-sidebar overflow-y-auto transition-all duration-300 ease-in-out md:static md:translate-x-0 md:transition-none ${sidebarOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"}`}>
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">P</div>
              <span className="text-lg font-semibold text-white">Payroll Pro</span>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
              {navItems.map((item) => {
                if (item.children) {
                  const childActive = isChildActive(item.children);
                  const isExpanded = expanded[item.label] !== undefined ? expanded[item.label] : childActive;
                  const Icon = item.icon;
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => toggleExpand(item.label)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          childActive ? "text-white" : "text-zinc-400 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"}`} />
                      </button>
                      {isExpanded && (
                        <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-3">
                          {item.children.map((child) => {
                            const isActive = pathname === child.href;
                            const ChildIcon = child.icon;
                            return (
                              <Link
                                key={child.href}
                                href={child.href!}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                  isActive ? "bg-primary text-white" : "text-zinc-400 hover:bg-white/10 hover:text-white"
                                }`}
                              >
                                <ChildIcon className="h-4 w-4" />
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? "bg-primary text-white" : "text-zinc-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-white/10 px-6 py-4">
              <SignOutButton />
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/60 md:hidden transition-opacity duration-300" onClick={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 bg-surface overflow-y-auto px-4 pt-16 pb-8 md:px-10 md:pt-10 md:pb-10">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
