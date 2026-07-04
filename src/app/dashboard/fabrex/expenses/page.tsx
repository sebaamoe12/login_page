import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { m } from "@/shared/messages";
import { ExpensesClient } from "./expenses-client";

export default async function FabrexExpensesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: expenses } = await supabase
    .from("FabrexExpense")
    .select("*")
    .order("date", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900">{m.fabr.frais}</h1>
      <ExpensesClient expenses={expenses || []} />
    </div>
  );
}
