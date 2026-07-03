import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { m } from "@/shared/messages";
import { ProductsClient } from "./products-client";

export default async function FabrexProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: products } = await supabase
    .from("FabrexProduct")
    .select("*")
    .order("createdAt", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900">{m.fabr.products}</h1>
      <ProductsClient products={products || []} />
    </div>
  );
}
