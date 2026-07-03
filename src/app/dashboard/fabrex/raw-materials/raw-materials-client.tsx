"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, PackagePlus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { m } from "@/shared/messages";
import { formatCurrency } from "@/shared/constants";
import type { FabrexRawMaterialType } from "@/shared/types";

export function RawMaterialsClient({ materials, suppliers }: { materials: FabrexRawMaterialType[]; suppliers: { id: string; name: string }[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [showStock, setShowStock] = useState<FabrexRawMaterialType | null>(null);
  const [editMaterial, setEditMaterial] = useState<FabrexRawMaterialType | null>(null);
  const [deleteMaterial, setDeleteMaterial] = useState<FabrexRawMaterialType | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", sku: "", unit: "kg", stock: "0", purchasePrice: "", supplierId: "" });
  const [stockQty, setStockQty] = useState("1");

  const supabaseCall = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  };

  const resetForm = () => setForm({ name: "", sku: "", unit: "kg", stock: "0", purchasePrice: "", supplierId: "" });

  const openEdit = (m: FabrexRawMaterialType) => {
    setEditMaterial(m);
    setForm({ name: m.name, sku: m.sku, unit: m.unit, stock: m.stock, purchasePrice: m.purchasePrice, supplierId: m.supplierId || "" });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = await supabaseCall();
    const payload: Record<string, any> = { name: form.name, sku: form.sku, unit: form.unit, stock: parseFloat(form.stock) || 0, purchasePrice: parseFloat(form.purchasePrice) || 0 };
    if (form.supplierId) payload.supplierId = form.supplierId;
    else payload.supplierId = null;

    if (editMaterial) {
      const { error } = await supabase.from("FabrexRawMaterial").update(payload).eq("id", editMaterial.id);
      if (error) { toast(error.message, "error"); setLoading(false); return; }
      toast(m.fabr.editSuccess);
    } else {
      const { error } = await supabase.from("FabrexRawMaterial").insert({ id: crypto.randomUUID(), ...payload, companyId: "seed-company-001" });
      if (error) { toast(error.message, "error"); setLoading(false); return; }
      toast(m.fabr.addSuccess);
    }
    setShowForm(false); setEditMaterial(null); resetForm(); setLoading(false);
    router.refresh();
  };

  const handleAddStock = async () => {
    if (!showStock) return;
    setLoading(true);
    const supabase = await supabaseCall();
    const qty = parseFloat(stockQty) || 1;
    const { error } = await supabase.from("FabrexRawMaterial").update({ stock: parseFloat(showStock.stock) + qty }).eq("id", showStock.id);
    if (error) { toast(error.message, "error"); setLoading(false); return; }
    setShowStock(null); setStockQty("1"); setLoading(false);
    toast(m.fabr.stockAdded);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteMaterial) return;
    const supabase = await supabaseCall();
    await supabase.from("FabrexRawMaterial").delete().eq("id", deleteMaterial.id);
    setDeleteMaterial(null);
    toast(m.fabr.deleteSuccess);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditMaterial(null); resetForm(); setShowForm(true); }} className="btn-primary"><Plus className="h-4 w-4" /> {m.fabr.addRawMaterial}</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{m.fabr.name}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.sku}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.unit}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.stock}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.purchasePrice}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.supplier}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.actions}</th>
            </tr>
          </thead>
          <tbody>
            {materials.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-400">{m.fabr.empty}</td></tr>}
            {materials.map((mat) => (
              <tr key={mat.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">{mat.name}</td>
                <td className="px-4 py-3 text-zinc-600">{mat.sku}</td>
                <td className="px-4 py-3 text-zinc-600">{mat.unit}</td>
                <td className="px-4 py-3"><span className={`font-medium ${parseFloat(mat.stock) === 0 ? "text-red-600" : "text-zinc-900"}`}>{mat.stock} {mat.unit}</span></td>
                <td className="px-4 py-3 text-zinc-600">{formatCurrency(mat.purchasePrice)}</td>
                <td className="px-4 py-3 text-zinc-600">{(mat as any).Supplier?.name || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(mat)} className="btn-ghost btn-sm"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { setShowStock(mat); setStockQty("1"); }} className="btn-ghost btn-sm text-emerald-600"><PackagePlus className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteMaterial(mat)} className="btn-ghost btn-sm text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal open={true} title={editMaterial ? m.fabr.edit : m.fabr.addRawMaterial} onClose={() => { setShowForm(false); setEditMaterial(null); resetForm(); }}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.name}</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.sku}</label><input className="input" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.unit}</label><input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="kg, g, L..." /></div>
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.stock}</label><input className="input" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.purchasePrice} (DA)</label><input className="input" type="number" min="0" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.supplier}</label><select className="input" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}><option value="">{m.fabr.selectSupplier}</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditMaterial(null); resetForm(); }} className="btn-secondary">{m.common.cancel}</button>
              <button type="submit" disabled={loading} className="btn-primary">{loading ? m.common.loading : m.common.save}</button>
            </div>
          </form>
        </Modal>
      )}

      {showStock && (
        <Modal open={true} title={`${m.fabr.addStock} — ${showStock.name}`} onClose={() => { setShowStock(null); setStockQty("1"); }}>
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">Stock actuel : <strong>{showStock.stock} {showStock.unit}</strong></p>
            <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.stockToAdd}</label><input className="input" type="number" min="0" value={stockQty} onChange={(e) => setStockQty(e.target.value)} /></div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setShowStock(null); setStockQty("1"); }} className="btn-secondary">{m.common.cancel}</button>
              <button onClick={handleAddStock} disabled={loading} className="btn-primary">{loading ? m.common.loading : m.fabr.addStock}</button>
            </div>
          </div>
        </Modal>
      )}

      {deleteMaterial && (
        <Modal open={true} title={m.fabr.confirmDelete} onClose={() => setDeleteMaterial(null)}>
          <p className="text-sm text-zinc-600 mb-4">Supprimer cette matière première ?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteMaterial(null)} className="btn-secondary">{m.common.cancel}</button>
            <button onClick={handleDelete} className="btn-danger">{m.common.confirm}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
