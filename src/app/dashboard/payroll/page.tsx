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
    .select("id, firstName, lastName, position, baseSalary, payDay")
    .eq("status", "ACTIVE");

  const { data: payrolls, error } = await supabase
    .from("EmployeePayroll")
    .select("*, Employee(firstName, lastName, position, payDay)")
    .order("periodYear", { ascending: false })
    .order("periodMonth", { ascending: false });

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
        payrolls={payrolls ?? []}
      />
    </div>
  );
}
