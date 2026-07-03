"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { m } from "@/shared/messages";
import { formatCurrency, POURELLE_CATEGORIES } from "@/shared/constants";
import type { PourelleProductType } from "@/shared/types";

export function ProductsClient({ products }: { products: PourelleProductType[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<PourelleProductType | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<PourelleProductType | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", sku: "", category: "Autres", brand: "", purchasePrice: "", sellingPrice: "", stock: "0" });

  const supabaseCall = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => setForm({ name: "", sku: "", category: "Autres", brand: "", purchasePrice: "", sellingPrice: "", stock: "0" });

  const openEdit = (p: PourelleProductType) => {
    setEditProduct(p);
    setForm({ name: p.name, sku: p.sku, category: p.category, brand: p.brand, purchasePrice: p.purchasePrice, sellingPrice: p.sellingPrice, stock: String(p.stock) });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = await supabaseCall();
    const payload = {
      name: form.name, sku: form.sku, category: form.category, brand: form.brand,
      purchasePrice: parseFloat(form.purchasePrice) || 0,
      sellingPrice: parseFloat(form.sellingPrice) || 0,
      stock: parseInt(form.stock) || 0,
    };

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input className="input pl-9" placeholder={m.pour.search} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button onClick={() => { setEditProduct(null); resetForm(); setShowForm(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> {m.pour.addProduct}
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{m.pour.name}</th>
              <th className="px-4 py-3 font-medium">{m.pour.sku}</th>
              <th className="px-4 py-3 font-medium">{m.pour.category}</th>
              <th className="px-4 py-3 font-medium">{m.pour.brand}</th>
              <th className="px-4 py-3 font-medium">{m.pour.purchasePrice}</th>
              <th className="px-4 py-3 font-medium">{m.pour.sellingPrice}</th>
              <th className="px-4 py-3 font-medium">{m.pour.stock}</th>
              <th className="px-4 py-3 font-medium">{m.pour.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-zinc-400">{m.pour.empty}</td></tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">{p.name}</td>
                <td className="px-4 py-3 text-zinc-600">{p.sku}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600">{p.category}</span></td>
                <td className="px-4 py-3 text-zinc-600">{p.brand}</td>
                <td className="px-4 py-3 text-zinc-600">{formatCurrency(p.purchasePrice)}</td>
                <td className="px-4 py-3 text-zinc-600">{formatCurrency(p.sellingPrice)}</td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${p.stock < 5 ? "text-red-600" : "text-zinc-900"}`}>{p.stock}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="btn-ghost btn-sm"><Pencil className="h-3.5 w-3.5" /></button>
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
                <label className="mb-1 block text-sm font-medium text-zinc-700">{m.pour.name}</label>
                <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
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
