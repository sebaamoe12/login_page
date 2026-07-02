import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdvancesList } from "./advances-list";

export default async function AdvancesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: advances, error } = await supabase
    .from("SalaryAdvance")
    .select("*, Employee(firstName, lastName)")
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
      <h1 className="text-2xl font-bold">Salary Advances</h1>
      <AdvancesList advances={advances ?? []} />
    </div>
  );
}
