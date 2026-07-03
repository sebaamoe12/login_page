import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, Wallet, DollarSign, Store, Factory, ShoppingBag, Banknote, AlertTriangle, BarChart3 } from "lucide-react";
import { m } from "@/shared/messages";
import { formatCurrency, MONTH_NAMES_SHORT } from "@/shared/constants";
import { EvolutionChart } from "./evolution-chart";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Payroll stats
  const { data: allPayrolls } = await supabase
    .from("EmployeePayroll")
    .select("netSalary, status, periodMonth, periodYear");

  const pendingTotal = allPayrolls?.filter((p) => p.status === "PENDING").reduce((s, p) => s + Number(p.netSalary), 0) || 0;
  const paidCount = allPayrolls?.filter((p) => p.status === "PAID").length || 0;

  // Employee stats
  const { count: activeCount } = await supabase.from("Employee").select("*", { count: "exact", head: true }).eq("status", "ACTIVE");
  const { count: pendingAdvances } = await supabase.from("SalaryAdvance").select("*", { count: "exact", head: true }).eq("status", "PENDING");

  // Pourelle sales
  const { data: allSales } = await supabase
    .from("PourelleSale")
    .select("totalAmount, createdAt")
    .eq("status", "COMPLETED");

  const totalSalesAmount = allSales?.reduce((s, sale) => s + Number(sale.totalAmount), 0) || 0;
  const totalSalesCount = allSales?.length || 0;

  // Pourelle products
  const { data: products } = await supabase
    .from("PourelleProduct")
    .select("id, stock, name, sku");

  const lowStockCount = products?.filter((p) => p.stock < 5).length || 0;
  const totalProducts = products?.length || 0;

  // Monthly sales evolution (last 12 months)
  const now = new Date();
  const salesByMonth: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    salesByMonth[key] = 0;
  }
  allSales?.forEach((sale) => {
    const d = new Date(sale.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (key in salesByMonth) salesByMonth[key] += Number(sale.totalAmount);
  });

  const salesChartData = Object.entries(salesByMonth).map(([key, val]) => {
    const [year, month] = key.split("-").map(Number);
    return { label: `${MONTH_NAMES_SHORT[month]} ${year}`, value: val };
  });

  // Monthly payroll evolution (last 12 months)
  const payrollByMonth: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    payrollByMonth[key] = 0;
  }
  allPayrolls?.forEach((p) => {
    const key = `${p.periodYear}-${(p.periodMonth - 1)}`;
    if (key in payrollByMonth) payrollByMonth[key] += Number(p.netSalary);
  });

  const payrollChartData = Object.entries(payrollByMonth).map(([key, val]) => {
    const [year, month] = key.split("-").map(Number);
    return { label: `${MONTH_NAMES_SHORT[month]} ${year}`, value: val };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{m.nav.dashboard}</h1>
        <p className="mt-1 text-zinc-500">{m.dash.welcome}, {user.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-red-600">
            <Wallet className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.dash.totalUnpaid}</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{pendingTotal > 0 ? formatCurrency(pendingTotal) : "—"}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-emerald-600">
            <DollarSign className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.dash.paidEmployees}</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{paidCount}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-blue-600">
            <Users className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.dash.activeEmployees}</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{activeCount}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-indigo-600">
            <ShoppingBag className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.dash.salesAmount}</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{formatCurrency(totalSalesAmount)}</p>
          <p className="text-xs text-zinc-400 mt-1">{totalSalesCount} {m.dash.salesCount}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-indigo-600 mb-3">
            <ShoppingBag className="h-4 w-4" />
            <h2 className="font-semibold text-zinc-900">{m.dash.salesEvolution}</h2>
          </div>
          <EvolutionChart data={salesChartData} color="#4f46e5" />
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-emerald-600 mb-3">
            <Wallet className="h-4 w-4" />
            <h2 className="font-semibold text-zinc-900">{m.dash.payrollEvolution}</h2>
          </div>
          <EvolutionChart data={payrollChartData} color="#10b981" />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">{m.dash.entities}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a href="/dashboard/pourelle" className="card p-5 transition-colors hover:border-indigo-200 hover:shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600"><Store className="h-5 w-5" /></div>
              <div><h3 className="font-semibold text-zinc-900">🏪 Pourelle</h3><p className="text-sm text-zinc-500">Magasin de chaussures</p></div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-zinc-400">CA total</span><p className="font-medium text-zinc-900">{formatCurrency(totalSalesAmount)}</p></div>
              <div><span className="text-zinc-400">Stock</span><p className="font-medium text-zinc-900">{totalProducts} articles</p></div>
              {lowStockCount > 0 && (
                <div className="col-span-2 flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="h-3 w-3" />{lowStockCount} {m.pour.lowStockDesc}</div>
              )}
            </div>
          </a>
          <a href="/dashboard/fabrex" className="card p-5 transition-colors hover:border-indigo-200 hover:shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600"><Factory className="h-5 w-5" /></div>
              <div><h3 className="font-semibold text-zinc-900">🏭 Fabrex</h3><p className="text-sm text-zinc-500">Injection plastique</p></div>
            </div>
            <p className="text-sm text-zinc-400">Module en cours de développement</p>
          </a>
          <a href="/dashboard/payroll" className="card p-5 transition-colors hover:border-indigo-200 hover:shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600"><Wallet className="h-5 w-5" /></div>
              <div><h3 className="font-semibold text-zinc-900">💰 Paie</h3><p className="text-sm text-zinc-500">Gestion des salaires</p></div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-zinc-400">Impayé</span><p className="font-medium text-red-600">{pendingTotal > 0 ? formatCurrency(pendingTotal) : "—"}</p></div>
              <div><span className="text-zinc-400">Payés</span><p className="font-medium text-zinc-900">{paidCount}</p></div>
              <div><span className="text-zinc-400">Avances</span><p className="font-medium text-amber-600">{pendingAdvances}</p></div>
              <div><span className="text-zinc-400">Actifs</span><p className="font-medium text-zinc-900">{activeCount}</p></div>
            </div>
          </a>
          <a href="/dashboard/reports" className="card p-5 transition-colors hover:border-indigo-200 hover:shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600"><BarChart3 className="h-5 w-5" /></div>
              <div><h3 className="font-semibold text-zinc-900">📊 Rapports</h3><p className="text-sm text-zinc-500">Performance globale</p></div>
            </div>
            <p className="text-sm text-zinc-400">Ventes, paie, analyses</p>
          </a>
        </div>
      </div>
    </div>
  );
}
