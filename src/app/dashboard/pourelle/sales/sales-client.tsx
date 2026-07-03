"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { m } from "@/shared/messages";
import { formatCurrency, POURELLE_SALE_TYPES } from "@/shared/constants";

const typeLabels: Record<string, string> = { IN_STORE: m.pour.inStore, DELIVERY: m.pour.delivery };

export function SalesClient({
  sales, itemsBySaleId, products,
}: {
  sales: any[];
  itemsBySaleId: Record<string, any[]>;
  products: { id: string; sku: string; sellingPrice: string; stock: number }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [saleType, setSaleType] = useState("IN_STORE");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
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
      if (product) newLines[i].unitPrice = product.sellingPrice;
    }
    setLines(newLines);
  };

  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));

  const resetForm = () => {
    setSaleType("IN_STORE"); setClientName(""); setClientPhone(""); setDeliveryAddress(""); setLines([]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) return;
    setLoading(true);
    const supabase = await supabaseCall();
    const saleId = crypto.randomUUID();

    const { error: saleError } = await supabase.from("PourelleSale").insert({
      id: saleId, type: saleType,
      status: saleType === "IN_STORE" ? "COMPLETED" : "DELIVERING",
      totalAmount: total,
      clientName: saleType === "DELIVERY" ? clientName : "",
      clientPhone: saleType === "DELIVERY" ? clientPhone : "",
      deliveryAddress: saleType === "DELIVERY" ? deliveryAddress : "",
      companyId: "seed-company-001",
    });
    if (saleError) { toast(saleError.message, "error"); setLoading(false); return; }

    const { error: itemsError } = await supabase.from("PourelleSaleItem").insert(
      lines.map((l) => ({
        id: crypto.randomUUID(), saleId, productId: l.productId,
        quantity: l.quantity, unitPrice: parseFloat(l.unitPrice) || 0, companyId: "seed-company-001",
      }))
    );
    if (itemsError) { toast(itemsError.message, "error"); setLoading(false); return; }

    for (const l of lines) {
      await supabase.from("PourelleProduct").update({
        stock: (products.find((p) => p.id === l.productId)?.stock || 0) - l.quantity,
      }).eq("id", l.productId);
    }

    setShowForm(false); resetForm(); setLoading(false);
    toast(m.pour.addSuccess);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> {m.pour.addSale}
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{m.pour.saleType}</th>
              <th className="px-4 py-3 font-medium">{m.pour.status}</th>
              <th className="px-4 py-3 font-medium">{m.pour.clientName}</th>
              <th className="px-4 py-3 font-medium">{m.pour.total}</th>
              <th className="px-4 py-3 font-medium">{m.pour.date}</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-zinc-400">{m.pour.empty}</td></tr>
            )}
            {sales.map((s) => (
              <tr key={s.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600">
                    {typeLabels[s.type] || s.type}
                  </span>
                </td>
                <td className="px-4 py-3"><Badge status={s.status}>{s.status === "COMPLETED" ? m.pour.completed : s.status === "DELIVERING" ? m.pour.delivering : m.pour.cancelled}</Badge></td>
                <td className="px-4 py-3 text-zinc-600">{s.clientName || "-"}</td>
                <td className="px-4 py-3 font-medium text-zinc-900">{formatCurrency(s.totalAmount)}</td>
                <td className="px-4 py-3 text-zinc-600">{new Date(s.createdAt).toLocaleDateString("fr-DZ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal open={true} title={m.pour.addSale} onClose={() => { setShowForm(false); resetForm(); }}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">{m.pour.saleType}</label>
              <div className="flex gap-4">
                {POURELLE_SALE_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="saleType" value={t} checked={saleType === t} onChange={(e) => setSaleType(e.target.value)} className="accent-primary" />
                    {typeLabels[t]}
                  </label>
                ))}
              </div>
            </div>

            {saleType === "DELIVERY" && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">{m.pour.clientName}</label>
                  <input className="input" required value={clientName} onChange={(e) => setClientName(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">{m.pour.clientPhone}</label>
                  <input className="input" required value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">{m.pour.deliveryAddress}</label>
                  <input className="input" required value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-zinc-700">{m.pour.saleItems}</label>
                <button type="button" onClick={addLine} className="btn-ghost btn-sm text-primary"><Plus className="h-3.5 w-3.5" /> {m.pour.addLine}</button>
              </div>
              {lines.map((line, i) => (
                <div key={i} className="flex gap-2 mb-2 items-end">
                  <div className="flex-[2]">
                    <select className="input text-sm" value={line.productId} onChange={(e) => updateLine(i, "productId", e.target.value)}>
                      <option value="">{m.pour.selectProduct}</option>
                      {products.filter((p) => p.stock > 0).map((p) => (
                        <option key={p.id} value={p.id}>{p.sku} — {formatCurrency(p.sellingPrice)} — stock: {p.stock}</option>
                      ))}
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

            <div className="text-right text-lg font-bold text-zinc-900">
              {m.pour.saleTotal} : {formatCurrency(total)}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary">{m.common.cancel}</button>
              <button type="submit" disabled={loading || lines.length === 0} className="btn-primary">{loading ? m.common.loading : m.common.save}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
