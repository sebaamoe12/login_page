import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { m } from "@/shared/messages";
import { SuppliersClient } from "./suppliers-client";

export default async function FabrexSuppliersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: suppliers } = await supabase
    .from("FabrexSupplier")
    .select("*")
    .order("createdAt", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900">{m.fabr.suppliers}</h1>
      <SuppliersClient suppliers={suppliers || []} />
    </div>
  );
}
