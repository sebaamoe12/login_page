"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { m } from "@/shared/messages";
import { formatCurrency, FABREX_CATEGORIES } from "@/shared/constants";
import type { FabrexProductType } from "@/shared/types";

export function ProductsClient({ products }: { products: FabrexProductType[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<FabrexProductType | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<FabrexProductType | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ sku: "", name: "", category: "Autres", sellingPrice: "", stock: "0" });

  const supabaseCall = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  };

  const resetForm = () => setForm({ sku: "", name: "", category: "Autres", sellingPrice: "", stock: "0" });

  const openEdit = (p: FabrexProductType) => {
    setEditProduct(p);
    setForm({ sku: p.sku, name: p.name, category: p.category, sellingPrice: p.sellingPrice, stock: String(p.stock) });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = await supabaseCall();
    const payload = { sku: form.sku, name: form.name, category: form.category, sellingPrice: parseFloat(form.sellingPrice) || 0, stock: parseInt(form.stock) || 0 };

    if (editProduct) {
      const { error } = await supabase.from("FabrexProduct").update(payload).eq("id", editProduct.id);
      if (error) { toast(error.message, "error"); setLoading(false); return; }
      toast(m.fabr.editSuccess);
    } else {
      const { error } = await supabase.from("FabrexProduct").insert({ id: crypto.randomUUID(), ...payload, companyId: "seed-company-001" });
      if (error) { toast(error.message, "error"); setLoading(false); return; }
      toast(m.fabr.addSuccess);
    }
    setShowForm(false); setEditProduct(null); resetForm(); setLoading(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    const supabase = await supabaseCall();
    await supabase.from("FabrexProduct").delete().eq("id", deleteProduct.id);
    setDeleteProduct(null);
    toast(m.fabr.deleteSuccess);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditProduct(null); resetForm(); setShowForm(true); }} className="btn-primary"><Plus className="h-4 w-4" /> {m.fabr.addProduct}</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{m.fabr.sku}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.name}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.category}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.sellingPrice}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.stock}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.actions}</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-400">{m.fabr.empty}</td></tr>}
            {products.map((p) => (
              <tr key={p.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">{p.sku}</td>
                <td className="px-4 py-3 text-zinc-600">{p.name}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600">{p.category}</span></td>
                <td className="px-4 py-3 text-zinc-600">{formatCurrency(p.sellingPrice)}</td>
                <td className="px-4 py-3"><span className={`font-medium ${p.stock === 0 ? "font-bold text-red-600" : p.stock < 5 ? "text-red-600" : "text-zinc-900"}`}>{p.stock === 0 ? "Rupture" : p.stock}</span></td>
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
        <Modal open={true} title={editProduct ? m.fabr.edit : m.fabr.addProduct} onClose={() => { setShowForm(false); setEditProduct(null); resetForm(); }}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.sku}</label><input className="input" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.name}</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.category}</label><select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{FABREX_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.sellingPrice} (DA)</label><input className="input" type="number" min="0" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.stock}</label><input className="input" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditProduct(null); resetForm(); }} className="btn-secondary">{m.common.cancel}</button>
              <button type="submit" disabled={loading} className="btn-primary">{loading ? m.common.loading : m.common.save}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteProduct && (
        <Modal open={true} title={m.fabr.confirmDelete} onClose={() => setDeleteProduct(null)}>
          <p className="text-sm text-zinc-600 mb-4">Supprimer ce produit ?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteProduct(null)} className="btn-secondary">{m.common.cancel}</button>
            <button onClick={handleDelete} className="btn-danger">{m.common.confirm}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
