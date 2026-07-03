"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, PackagePlus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { m } from "@/shared/messages";
import { formatCurrency, POURELLE_CATEGORIES } from "@/shared/constants";
import type { PourelleProductType } from "@/shared/types";

interface SupplierOption {
  id: string;
  name: string;
  type: string;
}

export function ProductsClient({ products, suppliers }: { products: PourelleProductType[]; suppliers: SupplierOption[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [showStock, setShowStock] = useState<PourelleProductType | null>(null);
  const [editProduct, setEditProduct] = useState<PourelleProductType | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<PourelleProductType | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ sku: "", category: "Autres", brand: "", purchasePrice: "", sellingPrice: "", stock: "0", supplierId: "" });
  const [stockQty, setStockQty] = useState("1");
  const [stockPurchasePrice, setStockPurchasePrice] = useState("");
  const [stockSellingPrice, setStockSellingPrice] = useState("");

  const supabaseCall = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  };

  const resetForm = () => setForm({ sku: "", category: "Autres", brand: "", purchasePrice: "", sellingPrice: "", stock: "0", supplierId: "" });

  const openEdit = (p: PourelleProductType) => {
    setEditProduct(p);
    setForm({ sku: p.sku, category: p.category, brand: p.brand, purchasePrice: p.purchasePrice, sellingPrice: p.sellingPrice, stock: String(p.stock), supplierId: p.supplierId || "" });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = await supabaseCall();
    const payload: Record<string, any> = {
      sku: form.sku, category: form.category, brand: form.brand,
      purchasePrice: parseFloat(form.purchasePrice) || 0,
      sellingPrice: parseFloat(form.sellingPrice) || 0,
      stock: parseInt(form.stock) || 0,
    };
    if (form.supplierId) payload.supplierId = form.supplierId;
    else payload.supplierId = null;

    if (editProduct) {
      const { error } = await supabase.from("PourelleProduct").update(payload).eq("id", editProduct.id);
      if (error) { toast(error.message, "error"); setLoading(false); return; }
      toast(m.pour.editSuccess);
    } else {
      const { error } = await supabase.from("PourelleProduct").insert({
        id: crypto.randomUUID(), ...payload, companyId: "seed-company-001",
      });
      if (error) { toast(error.message, "error"); setLoading(false); return; }
      toast(m.pour.addSuccess);
    }
    setShowForm(false); setEditProduct(null); resetForm(); setLoading(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    const supabase = await supabaseCall();
    await supabase.from("PourelleProduct").delete().eq("id", deleteProduct.id);
    setDeleteProduct(null);
    toast(m.pour.deleteSuccess);
    router.refresh();
  };

  const handleAddStock = async () => {
    if (!showStock) return;
    setLoading(true);
    const supabase = await supabaseCall();
    const qty = parseInt(stockQty) || 1;
    const update: Record<string, any> = { stock: showStock.stock + qty };
    const pp = parseFloat(stockPurchasePrice);
    const sp = parseFloat(stockSellingPrice);
    if (!isNaN(pp) && pp > 0) update.purchasePrice = pp;
    if (!isNaN(sp) && sp > 0) update.sellingPrice = sp;
    const { error } = await supabase.from("PourelleProduct").update(update).eq("id", showStock.id);
    if (error) { toast(error.message, "error"); setLoading(false); return; }
    setShowStock(null); setStockQty("1"); setStockPurchasePrice(""); setStockSellingPrice("");
    setLoading(false);
    toast(m.pour.stockAdded);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditProduct(null); resetForm(); setShowForm(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> {m.pour.addProduct}
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{m.pour.sku}</th>
              <th className="px-4 py-3 font-medium">{m.pour.category}</th>
              <th className="px-4 py-3 font-medium">{m.pour.brand}</th>
              <th className="px-4 py-3 font-medium">{m.pour.supplier}</th>
              <th className="px-4 py-3 font-medium">{m.pour.purchasePrice}</th>
              <th className="px-4 py-3 font-medium">{m.pour.sellingPrice}</th>
              <th className="px-4 py-3 font-medium">{m.pour.stock}</th>
              <th className="px-4 py-3 font-medium">{m.pour.actions}</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-zinc-400">{m.pour.empty}</td></tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">{p.sku}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600">{p.category}</span></td>
                <td className="px-4 py-3 text-zinc-600">{p.brand}</td>
                <td className="px-4 py-3 text-zinc-600">{p.Supplier?.name || "—"}</td>
                <td className="px-4 py-3 text-zinc-600">{formatCurrency(p.purchasePrice)}</td>
                <td className="px-4 py-3 text-zinc-600">{formatCurrency(p.sellingPrice)}</td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${p.stock < 5 ? "text-red-600" : "text-zinc-900"}`}>{p.stock}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="btn-ghost btn-sm"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { setShowStock(p); setStockQty("1"); setStockPurchasePrice(""); setStockSellingPrice(""); }} className="btn-ghost btn-sm text-emerald-600"><PackagePlus className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteProduct(p)} className="btn-ghost btn-sm text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal open={true} title={editProduct ? m.pour.edit : m.pour.addProduct} onClose={() => { setShowForm(false); setEditProduct(null); resetForm(); }}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">{m.pour.sku}</label>
                <input className="input" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">{m.pour.category}</label>
                <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {POURELLE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">{m.pour.brand}</label>
                <input className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">{m.pour.supplier}</label>
                <select className="input" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                  <option value="">{m.pour.selectSupplier}</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">{m.pour.purchasePrice} (DA)</label>
                <input className="input" type="number" min="0" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">{m.pour.sellingPrice} (DA)</label>
                <input className="input" type="number" min="0" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">{m.pour.stock}</label>
                <input className="input" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditProduct(null); resetForm(); }} className="btn-secondary">{m.common.cancel}</button>
              <button type="submit" disabled={loading} className="btn-primary">{loading ? m.common.loading : m.common.save}</button>
            </div>
          </form>
        </Modal>
      )}

      {showStock && (
        <Modal open={true} title={`${m.pour.addStock} — ${showStock.sku}`} onClose={() => { setShowStock(null); setStockQty("1"); }}>
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">Stock actuel : <strong>{showStock.stock}</strong></p>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">{m.pour.stockToAdd}</label>
              <input className="input" type="number" min="1" value={stockQty} onChange={(e) => setStockQty(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">{m.pour.newPurchasePrice}</label>
              <input className="input" type="number" min="0" placeholder={`Actuel: ${formatCurrency(showStock.purchasePrice)}`} value={stockPurchasePrice} onChange={(e) => setStockPurchasePrice(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">{m.pour.newSellingPrice}</label>
              <input className="input" type="number" min="0" placeholder={`Actuel: ${formatCurrency(showStock.sellingPrice)}`} value={stockSellingPrice} onChange={(e) => setStockSellingPrice(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setShowStock(null); setStockQty("1"); }} className="btn-secondary">{m.common.cancel}</button>
              <button onClick={handleAddStock} disabled={loading} className="btn-primary">{loading ? m.common.loading : m.pour.addStock}</button>
            </div>
          </div>
        </Modal>
      )}

      {deleteProduct && (
        <Modal open={true} title={m.pour.confirmDelete} onClose={() => setDeleteProduct(null)}>
          <p className="text-sm text-zinc-600 mb-4">{m.adv.deleteConfirm}</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteProduct(null)} className="btn-secondary">{m.common.cancel}</button>
            <button onClick={handleDelete} className="btn-danger">{m.common.confirm}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
