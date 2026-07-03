import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Store, DollarSign, Shirt, AlertTriangle } from "lucide-react";
import { m } from "@/shared/messages";
import { formatCurrency } from "@/shared/constants";
import Link from "next/link";

export default async function PourelleHub() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const { data: products } = await supabase
    .from("PourelleProduct")
    .select("id, stock");

  const { data: salesToday } = await supabase
    .from("PourelleSale")
    .select("totalAmount")
    .gte("createdAt", todayStart)
    .eq("status", "COMPLETED");

  const totalProducts = products?.length || 0;
  const lowStock = products?.filter((p) => p.stock < 5).length || 0;
  const revenueToday = salesToday?.reduce((s, sale) => s + Number(sale.totalAmount), 0) || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">{m.pour.hub} — Pourelle</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">{m.pour.revenueToday}</p>
              <p className="text-2xl font-bold text-zinc-900 mt-1">{formatCurrency(revenueToday)}</p>
            </div>
            <div className="rounded-lg bg-emerald-100 p-3"><DollarSign className="h-6 w-6 text-emerald-600" /></div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">{m.pour.productsInStock}</p>
              <p className="text-2xl font-bold text-zinc-900 mt-1">{totalProducts}</p>
            </div>
            <div className="rounded-lg bg-blue-100 p-3"><Shirt className="h-6 w-6 text-blue-600" /></div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">{m.pour.lowStock}</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{lowStock}</p>
              <p className="text-xs text-zinc-400">{m.pour.lowStockDesc}</p>
            </div>
            <div className="rounded-lg bg-red-100 p-3"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/pourelle/products" className="card p-5 hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="rounded-lg bg-indigo-100 p-3"><Shirt className="h-5 w-5 text-indigo-600" /></div>
          <div><p className="font-semibold text-zinc-900">{m.pour.products}</p><p className="text-sm text-zinc-500">{totalProducts} articles</p></div>
        </Link>
        <Link href="/dashboard/pourelle/suppliers" className="card p-5 hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="rounded-lg bg-indigo-100 p-3"><Store className="h-5 w-5 text-indigo-600" /></div>
          <div><p className="font-semibold text-zinc-900">{m.pour.suppliers}</p><p className="text-sm text-zinc-500">Fournisseurs</p></div>
        </Link>
        <Link href="/dashboard/pourelle/sales" className="card p-5 hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="rounded-lg bg-indigo-100 p-3"><DollarSign className="h-5 w-5 text-indigo-600" /></div>
          <div><p className="font-semibold text-zinc-900">{m.pour.sales}</p><p className="text-sm text-zinc-500">{formatCurrency(revenueToday)} aujourd'hui</p></div>
        </Link>
      </div>
    </div>
  );
}
