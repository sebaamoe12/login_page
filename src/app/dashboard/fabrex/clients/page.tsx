import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { m } from "@/shared/messages";
import { ClientsClient } from "./clients-client";

export default async function FabrexClientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: clients } = await supabase
    .from("FabrexClient")
    .select("*")
    .order("createdAt", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900">{m.fabr.clients}</h1>
      <ClientsClient clients={clients || []} />
    </div>
  );
}
