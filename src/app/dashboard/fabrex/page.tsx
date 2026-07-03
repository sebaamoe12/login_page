import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Factory, Package, Box, Cpu, ClipboardList, DollarSign, AlertTriangle } from "lucide-react";
import { m } from "@/shared/messages";
import { formatCurrency } from "@/shared/constants";
import Link from "next/link";

export default async function FabrexHub() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const { count: productCount } = await supabase.from("FabrexProduct").select("*", { count: "exact", head: true });
  const { count: rawMaterialCount } = await supabase.from("FabrexRawMaterial").select("*", { count: "exact", head: true });
  const { count: machineCount } = await supabase.from("FabrexMachine").select("*", { count: "exact", head: true }).eq("status", "ACTIVE");
  const { count: prodOrderCount } = await supabase.from("FabrexProductionOrder").select("*", { count: "exact", head: true });
  const { count: inProgressCount } = await supabase.from("FabrexProductionOrder").select("*", { count: "exact", head: true }).eq("status", "IN_PROGRESS");
  const { data: salesToday } = await supabase.from("FabrexSale").select("totalAmount").gte("createdAt", todayStart).eq("status", "COMPLETED");
  const revenueToday = salesToday?.reduce((s, sale) => s + Number(sale.totalAmount), 0) || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">{m.fabr.hub} — Fabrex</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">{m.fabr.productsInStock}</p>
              <p className="text-2xl font-bold text-zinc-900 mt-1">{productCount || 0}</p>
            </div>
            <div className="rounded-lg bg-blue-100 p-3"><Package className="h-6 w-6 text-blue-600" /></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">{m.fabr.rawMaterialStock}</p>
              <p className="text-2xl font-bold text-zinc-900 mt-1">{rawMaterialCount || 0}</p>
            </div>
            <div className="rounded-lg bg-amber-100 p-3"><Box className="h-6 w-6 text-amber-600" /></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">{m.fabr.activeMachines}</p>
              <p className="text-2xl font-bold text-zinc-900 mt-1">{machineCount || 0}</p>
            </div>
            <div className="rounded-lg bg-emerald-100 p-3"><Cpu className="h-6 w-6 text-emerald-600" /></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">{m.fabr.totalProductionOrders}</p>
              <p className="text-2xl font-bold text-zinc-900 mt-1">{prodOrderCount || 0}</p>
              {inProgressCount ? <p className="text-xs text-amber-600">{inProgressCount} en cours</p> : null}
            </div>
            <div className="rounded-lg bg-purple-100 p-3"><ClipboardList className="h-6 w-6 text-purple-600" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/fabrex/products" className="card p-5 hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="rounded-lg bg-indigo-100 p-3"><Package className="h-5 w-5 text-indigo-600" /></div>
          <div><p className="font-semibold text-zinc-900">{m.fabr.products}</p><p className="text-sm text-zinc-500">{productCount || 0} articles</p></div>
        </Link>
        <Link href="/dashboard/fabrex/raw-materials" className="card p-5 hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="rounded-lg bg-indigo-100 p-3"><Box className="h-5 w-5 text-indigo-600" /></div>
          <div><p className="font-semibold text-zinc-900">{m.fabr.rawMaterials}</p><p className="text-sm text-zinc-500">{rawMaterialCount || 0} matières</p></div>
        </Link>
        <Link href="/dashboard/fabrex/machines" className="card p-5 hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="rounded-lg bg-indigo-100 p-3"><Cpu className="h-5 w-5 text-indigo-600" /></div>
          <div><p className="font-semibold text-zinc-900">{m.fabr.machines}</p><p className="text-sm text-zinc-500">{machineCount || 0} actives</p></div>
        </Link>
        <Link href="/dashboard/fabrex/sales" className="card p-5 hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="rounded-lg bg-indigo-100 p-3"><DollarSign className="h-5 w-5 text-indigo-600" /></div>
          <div><p className="font-semibold text-zinc-900">{m.fabr.sales}</p><p className="text-sm text-zinc-500">{formatCurrency(revenueToday)} aujourd'hui</p></div>
        </Link>
      </div>
    </div>
  );
}
