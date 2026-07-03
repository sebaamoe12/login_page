import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { m } from "@/shared/messages";
import { MachinesClient } from "./machines-client";

export default async function FabrexMachinesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: machines } = await supabase
    .from("FabrexMachine")
    .select("*")
    .order("createdAt", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900">{m.fabr.machines}</h1>
      <MachinesClient machines={machines || []} />
    </div>
  );
}
