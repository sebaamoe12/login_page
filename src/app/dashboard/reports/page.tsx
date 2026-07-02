import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { m } from "@/shared/messages";
import { formatCurrency, MONTH_NAMES_FR } from "@/shared/constants";
import { BarChart3, Users, Wallet } from "lucide-react";
import { ReportsChart } from "./reports-chart";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { count: activeEmployees } = await supabase.from("Employee").select("*", { count: "exact", head: true }).eq("status", "ACTIVE");

  const now = new Date();
  const { data: currentPayrolls } = await supabase
    .from("EmployeePayroll")
    .select("netSalary, status")
    .eq("periodMonth", now.getMonth() + 1)
    .eq("periodYear", now.getFullYear());
  const currentMonthTotal = currentPayrolls?.reduce((s, p) => s + Number(p.netSalary), 0) || 0;

  const { data: allPayrolls, error } = await supabase
    .from("EmployeePayroll")
    .select("periodMonth, periodYear, netSalary, status, Employee(firstName, lastName)")
    .order("periodYear", { ascending: false })
    .order("periodMonth", { ascending: false });

  const historyTotal = allPayrolls?.reduce((s, p) => s + Number(p.netSalary), 0) || 0;

  // Group by period
  const byPeriod = new Map<string, { count: number; total: number; paid: number }>();
  allPayrolls?.forEach((p) => {
    const key = `${p.periodYear}-${String(p.periodMonth).padStart(2, "0")}`;
    const entry = byPeriod.get(key) || { count: 0, total: 0, paid: 0 };
    entry.count++;
    entry.total += Number(p.netSalary);
    if (p.status === "PAID") entry.paid++;
    byPeriod.set(key, entry);
  });

  // Group by employee
  const byEmployee = new Map<string, { firstName: string; lastName: string; count: number; total: number }>();
  allPayrolls?.forEach((p) => {
    const emp = Array.isArray(p.Employee) ? p.Employee[0] : p.Employee;
    const name = emp ? `${emp.firstName} ${emp.lastName}` : "—";
    const entry = byEmployee.get(name) || { firstName: emp?.firstName || "", lastName: emp?.lastName || "", count: 0, total: 0 };
    entry.count++;
    entry.total += Number(p.netSalary);
    byEmployee.set(name, entry);
  });

  if (error && error.code === "42P01") {
    return (
      <div className="card px-6 py-12 text-center">
        <h2 className="text-lg font-semibold text-amber-800">{m.dash.notSetUp}</h2>
        <p className="mt-2 text-sm text-amber-700">{m.dash.notSetUpDesc}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-zinc-900">{m.rep.title}</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-indigo-600">
            <Users className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.rep.totalEmployees}</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{activeEmployees}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-indigo-600">
            <Wallet className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.rep.currentMonth}</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{formatCurrency(currentMonthTotal)}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-indigo-600">
            <BarChart3 className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.rep.historyTotal}</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{formatCurrency(historyTotal)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly overview table */}
        <div className="card">
          <div className="px-5 py-4 border-b border-zinc-200">
            <h2 className="font-semibold text-zinc-900">{m.rep.monthlyOverview}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.rep.period}</th>
                  <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.rep.employees}</th>
                  <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.rep.totalAmount}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {Array.from(byPeriod.entries()).map(([key, val]) => {
                  const [year, month] = key.split("-");
                  return (
                    <tr key={key} className="hover:bg-zinc-50">
                      <td className="px-5 py-3 font-medium text-zinc-900">{MONTH_NAMES_FR[parseInt(month) - 1]} {year}</td>
                      <td className="px-5 py-3 text-zinc-600">{val.count}</td>
                      <td className="px-5 py-3">{formatCurrency(val.total)}</td>
                    </tr>
                  );
                })}
                {byPeriod.size === 0 && (
                  <tr><td colSpan={3} className="px-5 py-12 text-center text-sm text-zinc-400">{m.rep.empty}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart */}
        <div className="card p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-zinc-900">{m.rep.monthlyOverview}</h2>
          </div>
          <ReportsChart data={Array.from(byPeriod.entries()).map(([key, val]) => ({
            period: key, total: val.total,
          }))} />
        </div>
      </div>

      {/* Employee history table */}
      <div className="card">
        <div className="px-5 py-4 border-b border-zinc-200">
          <h2 className="font-semibold text-zinc-900">{m.rep.employeeHistory}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.adv.employee}</th>
                <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.pay.months}</th>
                <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.rep.totalAmount}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {Array.from(byEmployee.entries()).map(([name, val]) => (
                <tr key={name} className="hover:bg-zinc-50">
                  <td className="px-5 py-3 font-medium text-zinc-900">{name}</td>
                  <td className="px-5 py-3 text-zinc-600">{val.count}</td>
                  <td className="px-5 py-3">{formatCurrency(val.total)}</td>
                </tr>
              ))}
              {byEmployee.size === 0 && (
                <tr><td colSpan={3} className="px-5 py-12 text-center text-sm text-zinc-400">{m.rep.empty}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
