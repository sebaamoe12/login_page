import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { m } from "@/shared/messages";
import { SuppliersClient } from "./suppliers-client";

export default async function SuppliersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: suppliers } = await supabase
    .from("PourelleSupplier")
    .select("*")
    .order("createdAt", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">{m.pour.suppliers}</h1>
      <SuppliersClient suppliers={suppliers ?? []} />
    </div>
  );
}
