import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmployeeList } from "./employee-list";

export default async function EmployeesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: employees, error } = await supabase
    .from("Employee")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error && error.code === "42P01") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-8 text-center">
        <h2 className="text-lg font-semibold text-amber-800">Database not set up</h2>
        <p className="mt-2 text-sm text-amber-700">
          Run <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">supabase_setup.sql</code> in Supabase SQL Editor first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employees</h1>
      </div>
      <EmployeeList employees={employees ?? []} />
    </div>
  );
}
