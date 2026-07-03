import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { m } from "@/shared/messages";
import { ProductionOrdersClient } from "./production-orders-client";

export default async function FabrexProductionOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: orders } = await supabase
    .from("FabrexProductionOrder")
    .select("*, Product:productId(sku, name), Machine:machineId(name), materials:FabrexProdOrderMaterial!productionOrderId(*, RawMaterial:rawMaterialId(name, sku, unit))")
    .order("createdAt", { ascending: false });

  const { data: products } = await supabase
    .from("FabrexProduct")
    .select("id, sku, name")
    .order("name");

  const { data: machines } = await supabase
    .from("FabrexMachine")
    .select("id, name")
    .order("name");

  const { data: rawMaterials } = await supabase
    .from("FabrexRawMaterial")
    .select("id, name, sku, unit")
    .order("name");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900">{m.fabr.productionOrders}</h1>
      <ProductionOrdersClient
        orders={orders || []}
        products={products || []}
        machines={machines || []}
        rawMaterials={rawMaterials || []}
      />
    </div>
  );
}
