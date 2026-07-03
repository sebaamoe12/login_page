import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, Banknote, Wallet, DollarSign } from "lucide-react";
import { m } from "@/shared/messages";
import { formatCurrency } from "@/shared/constants";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { count: employeeCount } = await supabase.from("Employee").select("*", { count: "exact", head: true });
  const { count: activeCount } = await supabase.from("Employee").select("*", { count: "exact", head: true }).eq("status", "ACTIVE");
  const { count: pendingAdvances } = await supabase.from("SalaryAdvance").select("*", { count: "exact", head: true }).eq("status", "PENDING");

  const { data: allPayrolls } = await supabase
    .from("EmployeePayroll")
    .select("netSalary, status");

  const pendingTotal = allPayrolls?.filter((p) => p.status === "PENDING").reduce((s, p) => s + Number(p.netSalary), 0) || 0;
  const totalPayments = allPayrolls?.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.netSalary), 0) || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{m.nav.dashboard}</h1>
        <p className="mt-1 text-zinc-500">{m.dash.welcome}, {user.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-indigo-600">
            <Users className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.dash.totalEmployees}</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{employeeCount}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-green-600">
            <Users className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.dash.activeEmployees}</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{activeCount}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-amber-600">
            <Banknote className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.dash.pendingAdvances}</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{pendingAdvances}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-indigo-600">
            <Wallet className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.dash.currentPayroll}</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{pendingTotal > 0 ? formatCurrency(pendingTotal) : "—"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-green-600">
            <DollarSign className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.dash.totalPayments}</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{formatCurrency(totalPayments)}</p>
        </div>
        <a href="/dashboard/employees" className="card p-5 transition-colors hover:border-indigo-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600"><Users className="h-5 w-5" /></div>
            <div><h3 className="font-semibold text-zinc-900">{m.dash.manageEmployees}</h3><p className="text-sm text-zinc-500">{m.dash.manageEmployeesDesc}</p></div>
          </div>
        </a>
        <a href="/dashboard/advances" className="card p-5 transition-colors hover:border-indigo-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600"><Banknote className="h-5 w-5" /></div>
            <div><h3 className="font-semibold text-zinc-900">{m.dash.salaryAdvances}</h3><p className="text-sm text-zinc-500">{m.dash.salaryAdvancesDesc}</p></div>
          </div>
        </a>
        <a href="/dashboard/payroll" className="card p-5 transition-colors hover:border-indigo-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600"><Wallet className="h-5 w-5" /></div>
            <div><h3 className="font-semibold text-zinc-900">{m.dash.payrollRuns}</h3><p className="text-sm text-zinc-500">{m.dash.payrollRunsDesc}</p></div>
          </div>
        </a>
      </div>
    </div>
  );
}
