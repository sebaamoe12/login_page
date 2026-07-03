import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { m } from "@/shared/messages";
import { SalesClient } from "./sales-client";

export default async function SalesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sales } = await supabase
    .from("PourelleSale")
    .select("*")
    .order("createdAt", { ascending: false });

  const { data: items } = await supabase
    .from("PourelleSaleItem")
    .select("*, Product:productId(name, sku)");

  const { data: products } = await supabase
    .from("PourelleProduct")
    .select("id, name, sku, sellingPrice, stock")
    .order("name");

  const itemsBySaleId: Record<string, any[]> = {};
  (items ?? []).forEach((item) => {
    if (!itemsBySaleId[item.saleId]) itemsBySaleId[item.saleId] = [];
    itemsBySaleId[item.saleId].push(item);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">{m.pour.sales}</h1>
      <SalesClient sales={sales ?? []} itemsBySaleId={itemsBySaleId} products={products ?? []} />
    </div>
  );
}
