import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { m } from "@/shared/messages";
import { PurchasesClient } from "./purchases-client";

export default async function PurchasesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: orders } = await supabase
    .from("PourellePurchaseOrder")
    .select("*, Supplier:supplierId(name)")
    .order("createdAt", { ascending: false });

  const { data: items } = await supabase
    .from("PourellePurchaseOrderItem")
    .select("*, Product:productId(name, sku)");

  const { data: suppliers } = await supabase
    .from("PourelleSupplier")
    .select("id, name")
    .order("name");

  const { data: products } = await supabase
    .from("PourelleProduct")
    .select("id, name, sku, purchasePrice, sellingPrice, stock")
    .order("name");

  const itemsByOrderId: Record<string, any[]> = {};
  (items ?? []).forEach((item) => {
    if (!itemsByOrderId[item.purchaseOrderId]) itemsByOrderId[item.purchaseOrderId] = [];
    itemsByOrderId[item.purchaseOrderId].push(item);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">{m.pour.purchases}</h1>
      <PurchasesClient
        orders={orders ?? []}
        itemsByOrderId={itemsByOrderId}
        suppliers={suppliers ?? []}
        products={products ?? []}
      />
    </div>
  );
}
