import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { m } from "@/shared/messages";
import { SalesClient } from "./sales-client";

export default async function FabrexSalesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sales } = await supabase
    .from("FabrexSale")
    .select("*, Client:clientId(companyName, companyActivity, RC, NIF, phone, fax, address, banque, numCompteBancaire)")
    .order("createdAt", { ascending: false });

  const { data: saleItems } = await supabase
    .from("FabrexSaleItem")
    .select("*, Product:productId(sku, name, id)");

  const { data: products } = await supabase
    .from("FabrexProduct")
    .select("id, sku, name, sellingPrice, stock");

  const { data: clients } = await supabase
    .from("FabrexClient")
    .select("id, companyName, companyActivity, RC, NIF, phone, fax, address, banque, numCompteBancaire");

  const itemsBySaleId: Record<string, any[]> = {};
  (saleItems || []).forEach((item) => {
    if (!itemsBySaleId[item.saleId]) itemsBySaleId[item.saleId] = [];
    itemsBySaleId[item.saleId].push(item);
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900">{m.fabr.sales}</h1>
      <SalesClient
        sales={sales || []}
        itemsBySaleId={itemsBySaleId}
        products={products || []}
        clients={clients || []}
      />
    </div>
  );
}
