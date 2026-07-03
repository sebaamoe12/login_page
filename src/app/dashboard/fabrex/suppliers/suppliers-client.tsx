"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { m } from "@/shared/messages";

export function SuppliersClient({ suppliers }: { suppliers: any[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any>(null);
  const [deleteSupplier, setDeleteSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", type: "LOCAL", phone: "", email: "", address: "" });

  const supabaseCall = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  };

  const resetForm = () => setForm({ name: "", type: "LOCAL", phone: "", email: "", address: "" });

  const openEdit = (s: any) => {
    setEditSupplier(s);
    setForm({ name: s.name, type: s.type, phone: s.phone, email: s.email, address: s.address });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = await supabaseCall();
    const payload = { name: form.name, type: form.type, phone: form.phone, email: form.email, address: form.address };

    if (editSupplier) {
      const { error } = await supabase.from("FabrexSupplier").update(payload).eq("id", editSupplier.id);
      if (error) { toast(error.message, "error"); setLoading(false); return; }
      toast(m.fabr.editSuccess);
    } else {
      const { error } = await supabase.from("FabrexSupplier").insert({ id: crypto.randomUUID(), ...payload, companyId: "seed-company-001" });
      if (error) { toast(error.message, "error"); setLoading(false); return; }
      toast(m.fabr.addSuccess);
    }
    setShowForm(false); setEditSupplier(null); resetForm(); setLoading(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteSupplier) return;
    const supabase = await supabaseCall();
    await supabase.from("FabrexSupplier").delete().eq("id", deleteSupplier.id);
    setDeleteSupplier(null);
    toast(m.fabr.deleteSuccess);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditSupplier(null); resetForm(); setShowForm(true); }} className="btn-primary"><Plus className="h-4 w-4" /> {m.fabr.addSupplier}</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{m.fabr.name}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.type}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.phone}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.email}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.address}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.actions}</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-400">{m.fabr.empty}</td></tr>}
            {suppliers.map((s) => (
              <tr key={s.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">{s.name}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600">{s.type === "LOCAL" ? m.fabr.local : m.fabr.foreign}</span></td>
                <td className="px-4 py-3 text-zinc-600">{s.phone || "—"}</td>
                <td className="px-4 py-3 text-zinc-600">{s.email || "—"}</td>
                <td className="px-4 py-3 text-zinc-600">{s.address || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="btn-ghost btn-sm"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteSupplier(s)} className="btn-ghost btn-sm text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal open={true} title={editSupplier ? m.fabr.edit : m.fabr.addSupplier} onClose={() => { setShowForm(false); setEditSupplier(null); resetForm(); }}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.name}</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.type}</label><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="LOCAL">{m.fabr.local}</option><option value="FOREIGN">{m.fabr.foreign}</option></select></div>
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.phone}</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.email}</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="col-span-2"><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.address}</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditSupplier(null); resetForm(); }} className="btn-secondary">{m.common.cancel}</button>
              <button type="submit" disabled={loading} className="btn-primary">{loading ? m.common.loading : m.common.save}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteSupplier && (
        <Modal open={true} title={m.fabr.confirmDelete} onClose={() => setDeleteSupplier(null)}>
          <p className="text-sm text-zinc-600 mb-4">Supprimer ce fournisseur ?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteSupplier(null)} className="btn-secondary">{m.common.cancel}</button>
            <button onClick={handleDelete} className="btn-danger">{m.common.confirm}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
