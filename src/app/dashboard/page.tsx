import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { count: employeeCount } = await supabase
    .from("Employee")
    .select("*", { count: "exact", head: true });

  const { count: activeCount } = await supabase
    .from("Employee")
    .select("*", { count: "exact", head: true })
    .eq("status", "ACTIVE");

  const { count: pendingAdvances } = await supabase
    .from("SalaryAdvance")
    .select("*", { count: "exact", head: true })
    .eq("status", "PENDING");

  const now = new Date();
  const { data: currentRun } = await supabase
    .from("PayrollRun")
    .select("totalAmount, status")
    .eq("periodMonth", now.getMonth() + 1)
    .eq("periodYear", now.getFullYear())
    .single();

  const stats = [
    { label: "Total Employees", value: employeeCount ?? 0 },
    { label: "Active Employees", value: activeCount ?? 0 },
    { label: "Pending Advances", value: pendingAdvances ?? 0 },
    { label: "Current Payroll", value: currentRun ? `${Number(currentRun.totalAmount).toLocaleString()} CFA` : "Not started", status: currentRun?.status },
  ];

  const tablesExist = employeeCount !== null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-zinc-500">Welcome back, {user.email}</p>
      </div>

      {!tablesExist ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-8 text-center">
          <h2 className="text-lg font-semibold text-amber-800">Database not set up</h2>
          <p className="mt-2 text-sm text-amber-700">
            Run the <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">supabase_setup.sql</code> in your Supabase SQL Editor first.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-zinc-200 bg-white p-5">
                <p className="text-sm text-zinc-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold">
                  {stat.value}
                  {stat.status && (
                    <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      stat.status === "PAID" ? "bg-green-100 text-green-700" :
                      stat.status === "DRAFT" ? "bg-yellow-100 text-yellow-700" :
                      "bg-zinc-100 text-zinc-600"
                    }`}>
                      {stat.status}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <a href="/dashboard/employees" className="rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-900">
              <h3 className="font-semibold">Manage Employees</h3>
              <p className="mt-1 text-sm text-zinc-500">Add, edit, or view employees</p>
            </a>
            <a href="/dashboard/advances" className="rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-900">
              <h3 className="font-semibold">Salary Advances</h3>
              <p className="mt-1 text-sm text-zinc-500">Review and approve advance requests</p>
            </a>
            <a href="/dashboard/payroll" className="rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-900">
              <h3 className="font-semibold">Payroll Runs</h3>
              <p className="mt-1 text-sm text-zinc-500">Create and manage payroll periods</p>
            </a>
          </div>
        </>
      )}
    </div>
  );
}
