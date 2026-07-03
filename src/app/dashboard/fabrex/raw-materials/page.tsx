import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { m } from "@/shared/messages";
import { RawMaterialsClient } from "./raw-materials-client";

export default async function FabrexRawMaterialsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: materials } = await supabase
    .from("FabrexRawMaterial")
    .select("*, Supplier:FabrexSupplier(name)")
    .order("createdAt", { ascending: false });

  const { data: suppliers } = await supabase
    .from("FabrexSupplier")
    .select("id, name")
    .order("name");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900">{m.fabr.rawMaterials}</h1>
      <RawMaterialsClient materials={materials || []} suppliers={suppliers || []} />
    </div>
  );
}
