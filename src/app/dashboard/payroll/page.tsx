import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { m } from "@/shared/messages";
import { PayrollClient } from "./payroll-client";

export default async function PayrollPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: employees } = await supabase
    .from("Employee")
    .select("id, firstName, lastName, position, baseSalary, payDay, startDate")
    .eq("status", "ACTIVE");

  const { data: payrolls, error } = await supabase
    .from("EmployeePayroll")
    .select("*, Employee(firstName, lastName, position, payDay)")
    .order("periodYear", { ascending: false })
    .order("periodMonth", { ascending: false });

  // Recalculate netSalary for all pending payrolls on every page load
  if (payrolls) {
    const pending = payrolls.filter((p) => p.status === "PENDING");
    const empMap = new Map((employees || []).map((e) => [e.id, Number(e.baseSalary)]));

    for (const rec of pending) {
      const baseSalary = empMap.get(rec.employeeId);
      if (baseSalary == null) continue;

      const { data: advances } = await supabase
        .from("SalaryAdvance")
        .select("amount")
        .eq("employeeId", rec.employeeId)
        .eq("appliedInEmployeePayrollId", rec.id)
        .neq("status", "REJECTED");

      const sum = advances?.reduce((s, a) => s + Number(a.amount), 0) || 0;
      const netSalary = Math.max(baseSalary - sum, 0);

      if (Number(rec.netSalary) !== netSalary || Number(rec.totalAdvances) !== sum) {
        await supabase
          .from("EmployeePayroll")
          .update({ totalAdvances: sum.toString(), deductions: sum.toString(), netSalary: netSalary.toString() })
          .eq("id", rec.id);
      }
    }
  }

  // Re-fetch after corrections
  const { data: payrollsCorrected } = await supabase
    .from("EmployeePayroll")
    .select("*, Employee(firstName, lastName, position, payDay)")
    .order("periodYear", { ascending: false })
    .order("periodMonth", { ascending: false });

  const { data: advanceLinks } = await supabase
    .from("SalaryAdvance")
    .select("id, amount, reason, appliedInEmployeePayrollId")
    .not("appliedInEmployeePayrollId", "is", null);

  // Group advances by payroll record
  const advancesByPayroll: Record<string, { id: string; amount: string; reason: string | null }[]> = {};
  advanceLinks?.forEach((a) => {
    const key = a.appliedInEmployeePayrollId!;
    if (!advancesByPayroll[key]) advancesByPayroll[key] = [];
    advancesByPayroll[key].push({ id: a.id, amount: a.amount, reason: a.reason });
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">{m.pay.payroll}</h1>
      <PayrollClient
        employees={employees ?? []}
        payrolls={payrollsCorrected ?? []}
        advancesByPayroll={advancesByPayroll}
      />
    </div>
  );
}
