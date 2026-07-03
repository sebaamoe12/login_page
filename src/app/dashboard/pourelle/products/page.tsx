import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { m } from "@/shared/messages";
import { ProductsClient } from "./products-client";

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: products } = await supabase
    .from("PourelleProduct")
    .select("*, Supplier:supplierId(name, type)")
    .order("createdAt", { ascending: false });

  const { data: suppliers } = await supabase
    .from("PourelleSupplier")
    .select("id, name, type")
    .order("name");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">{m.pour.products}</h1>
      <ProductsClient products={products ?? []} suppliers={suppliers ?? []} />
    </div>
  );
}
