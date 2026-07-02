"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Users, Wallet, Banknote, BarChart3, Menu, LogOut } from "lucide-react";
import { ToastProvider } from "@/components/ui/toast";
import SignOutButton from "./sign-out-button";
import { m } from "@/shared/messages";

const navItems = [
  { href: "/dashboard", label: m.nav.dashboard, icon: LayoutDashboard },
  { href: "/dashboard/employees", label: m.nav.employees, icon: Users },
  { href: "/dashboard/payroll", label: m.nav.payroll, icon: Wallet },
  { href: "/dashboard/advances", label: m.nav.advances, icon: Banknote },
  { href: "/dashboard/reports", label: m.nav.reports, icon: BarChart3 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="flex h-full flex-1 overflow-hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-50 rounded-lg border border-zinc-700 bg-sidebar p-2 shadow-sm md:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5 text-white" />
        </button>

        <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-sidebar transition-transform md:static md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">P</div>
              <span className="text-lg font-semibold text-white">Payroll Pro</span>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
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
          <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 bg-surface overflow-y-auto px-6 py-8 md:px-10 md:py-10">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
