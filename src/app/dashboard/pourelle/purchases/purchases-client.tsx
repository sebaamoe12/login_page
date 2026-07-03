"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, PackageCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { m } from "@/shared/messages";
import { formatCurrency } from "@/shared/constants";
import type { PourellePurchaseOrderType, PourelleProductType, PourelleSupplierType } from "@/shared/types";

export function PurchasesClient({
  orders, itemsByOrderId, suppliers, products,
}: {
  orders: PourellePurchaseOrderType[];
  itemsByOrderId: Record<string, any[]>;
  suppliers: { id: string; name: string }[];
  products: { id: string; name: string; sku: string; purchasePrice: string; stock: number }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState<{ productId: string; quantity: number; unitPrice: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const supabaseCall = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  };

  const total = lines.reduce((s, l) => s + (parseFloat(l.unitPrice) || 0) * (l.quantity || 0), 0);

  const addLine = () => setLines([...lines, { productId: "", quantity: 1, unitPrice: "0" }]);

  const updateLine = (i: number, field: string, value: string | number) => {
    const newLines = [...lines];
    (newLines[i] as any)[field] = value;
    if (field === "productId") {
      const product = products.find((p) => p.id === value);
      if (product) newLines[i].unitPrice = product.purchasePrice;
    }
    setLines(newLines);
  };

  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));

  const resetForm = () => { setSupplierId(""); setLines([]); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || lines.length === 0) return;
    setLoading(true);
    const supabase = await supabaseCall();
    const orderId = crypto.randomUUID();
    const orderTotal = lines.reduce((s, l) => s + (parseFloat(l.unitPrice) || 0) * (l.quantity || 0), 0);

    const { error: orderError } = await supabase.from("PourellePurchaseOrder").insert({
      id: orderId, supplierId, status: "PENDING", totalAmount: orderTotal, companyId: "seed-company-001",
    });
    if (orderError) { toast(orderError.message, "error"); setLoading(false); return; }

    const { error: itemsError } = await supabase.from("PourellePurchaseOrderItem").insert(
      lines.map((l) => ({
        id: crypto.randomUUID(), purchaseOrderId: orderId, productId: l.productId,
        quantity: l.quantity, unitPrice: parseFloat(l.unitPrice) || 0, companyId: "seed-company-001",
      }))
    );
    if (itemsError) { toast(itemsError.message, "error"); setLoading(false); return; }

    setShowForm(false); resetForm(); setLoading(false);
    toast(m.pour.addSuccess);
    router.refresh();
  };

  const handleReceive = async (orderId: string) => {
    const supabase = await supabaseCall();
    const orderItems = itemsByOrderId[orderId] || [];
    for (const item of orderItems) {
      const { data: product } = await supabase.from("PourelleProduct").select("stock").eq("id", item.productId).single();
      if (product) {
        await supabase.from("PourelleProduct").update({ stock: product.stock + item.quantity }).eq("id", item.productId);
      }
    }
    await supabase.from("PourellePurchaseOrder").update({ status: "RECEIVED" }).eq("id", orderId);
    toast(m.pour.receiveSuccess);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> {m.pour.addPurchase}
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{m.pour.supplier}</th>
              <th className="px-4 py-3 font-medium">{m.pour.status}</th>
              <th className="px-4 py-3 font-medium">{m.pour.total}</th>
              <th className="px-4 py-3 font-medium">{m.pour.date}</th>
              <th className="px-4 py-3 font-medium">{m.pour.actions}</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-zinc-400">{m.pour.empty}</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">{o.Supplier?.name || "-"}</td>
                <td className="px-4 py-3"><Badge status={o.status}>{o.status === "PENDING" ? m.pour.pending : o.status === "RECEIVED" ? m.pour.received : m.pour.cancelled}</Badge></td>
                <td className="px-4 py-3 text-zinc-900 font-medium">{formatCurrency(o.totalAmount)}</td>
                <td className="px-4 py-3 text-zinc-600">{new Date(o.createdAt).toLocaleDateString("fr-DZ")}</td>
                <td className="px-4 py-3">
                  {o.status === "PENDING" && (
                    <button onClick={() => handleReceive(o.id)} className="btn-ghost btn-sm text-emerald-600">
                      <PackageCheck className="h-3.5 w-3.5" /> {m.pour.receive}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal open={true} title={m.pour.addPurchase} onClose={() => { setShowForm(false); resetForm(); }}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">{m.pour.supplier}</label>
              <select className="input" required value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">{m.pour.selectSupplier}</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-zinc-700">{m.pour.lines}</label>
                <button type="button" onClick={addLine} className="btn-ghost btn-sm text-primary"><Plus className="h-3.5 w-3.5" /> {m.pour.addLine}</button>
              </div>
              {lines.map((line, i) => (
                <div key={i} className="flex gap-2 mb-2 items-end">
                  <div className="flex-1">
                    <select className="input text-sm" value={line.productId} onChange={(e) => updateLine(i, "productId", e.target.value)}>
                      <option value="">{m.pour.selectProduct}</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                  </div>
                  <div className="w-20">
                    <input className="input text-sm" type="number" min="1" placeholder={m.pour.qty} value={line.quantity} onChange={(e) => updateLine(i, "quantity", parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="w-28">
                    <input className="input text-sm" type="number" min="0" placeholder={m.pour.unitPrice} value={line.unitPrice} onChange={(e) => updateLine(i, "unitPrice", e.target.value)} />
                  </div>
                  <button type="button" onClick={() => removeLine(i)} className="btn-ghost btn-sm text-red-500 mb-0.5"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>

            <div className="text-right text-sm font-semibold text-zinc-900">
              {m.pour.orderTotal} : {formatCurrency(total)}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary">{m.common.cancel}</button>
              <button type="submit" disabled={loading || !supplierId || lines.length === 0} className="btn-primary">{loading ? m.common.loading : m.common.save}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
