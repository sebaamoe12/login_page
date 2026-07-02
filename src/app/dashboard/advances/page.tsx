import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { m } from "@/shared/messages";
import { AdvancesClient } from "./advances-client";

export default async function AdvancesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: advances, error } = await supabase
    .from("SalaryAdvance")
    .select("*, Employee(firstName, lastName)")
    .order("createdAt", { ascending: false });

  const { data: employees } = await supabase
    .from("Employee")
    .select("id, firstName, lastName, baseSalary, monthlyAdvanceLimit")
    .eq("status", "ACTIVE");

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
      <h1 className="text-2xl font-bold text-zinc-900">{m.adv.title}</h1>
      <AdvancesClient advances={advances ?? []} employees={employees ?? []} />
    </div>
  );
}
