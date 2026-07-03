"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { m } from "@/shared/messages";
import type { PourelleSupplierType } from "@/shared/types";

export function SuppliersClient({ suppliers }: { suppliers: PourelleSupplierType[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState<PourelleSupplierType | null>(null);
  const [deleteSupplier, setDeleteSupplier] = useState<PourelleSupplierType | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", address: "" });

  const supabaseCall = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  };

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => setForm({ name: "", contact: "", address: "" });

  const openEdit = (s: PourelleSupplierType) => {
    setEditSupplier(s);
    setForm({ name: s.name, contact: s.contact, address: s.address });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = await supabaseCall();
    const payload = { name: form.name, contact: form.contact, address: form.address };

    if (editSupplier) {
      const { error } = await supabase.from("PourelleSupplier").update(payload).eq("id", editSupplier.id);
      if (error) { toast(error.message, "error"); setLoading(false); return; }
      toast(m.pour.editSuccess);
    } else {
      const { error } = await supabase.from("PourelleSupplier").insert({
        id: crypto.randomUUID(), ...payload, companyId: "seed-company-001",
      });
      if (error) { toast(error.message, "error"); setLoading(false); return; }
      toast(m.pour.addSuccess);
    }
    setShowForm(false); setEditSupplier(null); resetForm(); setLoading(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteSupplier) return;
    const supabase = await supabaseCall();
    await supabase.from("PourelleSupplier").delete().eq("id", deleteSupplier.id);
    setDeleteSupplier(null);
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
        <button onClick={() => { setEditSupplier(null); resetForm(); setShowForm(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> {m.pour.addSupplier}
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{m.pour.name}</th>
              <th className="px-4 py-3 font-medium">{m.pour.contact}</th>
              <th className="px-4 py-3 font-medium">{m.pour.address}</th>
              <th className="px-4 py-3 font-medium">{m.pour.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-zinc-400">{m.pour.empty}</td></tr>
            )}
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">{s.name}</td>
                <td className="px-4 py-3 text-zinc-600">{s.contact}</td>
                <td className="px-4 py-3 text-zinc-600">{s.address}</td>
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
        <Modal open={true} title={editSupplier ? m.pour.edit : m.pour.addSupplier} onClose={() => { setShowForm(false); setEditSupplier(null); resetForm(); }}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">{m.pour.name}</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">{m.pour.contact}</label>
              <input className="input" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">{m.pour.address}</label>
              <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditSupplier(null); resetForm(); }} className="btn-secondary">{m.common.cancel}</button>
              <button type="submit" disabled={loading} className="btn-primary">{loading ? m.common.loading : m.common.save}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteSupplier && (
        <Modal open={true} title={m.pour.confirmDelete} onClose={() => setDeleteSupplier(null)}>
          <p className="text-sm text-zinc-600 mb-4">{m.adv.deleteConfirm}</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteSupplier(null)} className="btn-secondary">{m.common.cancel}</button>
            <button onClick={handleDelete} className="btn-danger">{m.common.confirm}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
