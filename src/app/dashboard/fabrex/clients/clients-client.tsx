"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { m } from "@/shared/messages";

export function ClientsClient({ clients }: { clients: any[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState<any>(null);
  const [deleteClient, setDeleteClient] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ companyName: "", companyActivity: "", RC: "", NIF: "", phone: "", fax: "", email: "", address: "", banque: "", numCompteBancaire: "" });

  const supabaseCall = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  };

  const resetForm = () => setForm({ companyName: "", companyActivity: "", RC: "", NIF: "", phone: "", fax: "", email: "", address: "", banque: "", numCompteBancaire: "" });

  const openEdit = (c: any) => {
    setEditClient(c);
    setForm({ companyName: c.companyName, companyActivity: c.companyActivity || "", RC: c.RC || "", NIF: c.NIF || "", phone: c.phone || "", fax: c.fax || "", email: c.email || "", address: c.address || "", banque: c.banque || "", numCompteBancaire: c.numCompteBancaire || "" });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = await supabaseCall();

    if (editClient) {
      const { error } = await supabase.from("FabrexClient").update(form).eq("id", editClient.id);
      if (error) { toast(error.message, "error"); setLoading(false); return; }
      toast(m.fabr.editSuccess);
    } else {
      const { error } = await supabase.from("FabrexClient").insert({ id: crypto.randomUUID(), ...form, companyId: "seed-company-001" });
      if (error) { toast(error.message, "error"); setLoading(false); return; }
      toast(m.fabr.addSuccess);
    }
    setShowForm(false); setEditClient(null); resetForm(); setLoading(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteClient) return;
    const supabase = await supabaseCall();
    await supabase.from("FabrexClient").delete().eq("id", deleteClient.id);
    setDeleteClient(null);
    toast(m.fabr.deleteSuccess);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditClient(null); resetForm(); setShowForm(true); }} className="btn-primary"><Plus className="h-4 w-4" /> {m.fabr.addClient}</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{m.fabr.companyName}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.RC}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.NIF}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.phone}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.email}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.actions}</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-400">{m.fabr.empty}</td></tr>}
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">{c.companyName}</td>
                <td className="px-4 py-3 text-zinc-600">{c.RC || "—"}</td>
                <td className="px-4 py-3 text-zinc-600">{c.NIF || "—"}</td>
                <td className="px-4 py-3 text-zinc-600">{c.phone || "—"}</td>
                <td className="px-4 py-3 text-zinc-600">{c.email || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(c)} className="btn-ghost btn-sm"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteClient(c)} className="btn-ghost btn-sm text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal open={true} title={editClient ? m.fabr.edit : m.fabr.addClient} onClose={() => { setShowForm(false); setEditClient(null); resetForm(); }}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.companyName}</label><input className="input" required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.companyActivity}</label><input className="input" value={form.companyActivity} onChange={(e) => setForm({ ...form, companyActivity: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.RC}</label><input className="input" value={form.RC} onChange={(e) => setForm({ ...form, RC: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.NIF}</label><input className="input" value={form.NIF} onChange={(e) => setForm({ ...form, NIF: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.phone}</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.fax}</label><input className="input" value={form.fax} onChange={(e) => setForm({ ...form, fax: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.email}</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="col-span-2"><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.address}</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.banque}</label><input className="input" value={form.banque} onChange={(e) => setForm({ ...form, banque: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.numCompteBancaire}</label><input className="input" value={form.numCompteBancaire} onChange={(e) => setForm({ ...form, numCompteBancaire: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditClient(null); resetForm(); }} className="btn-secondary">{m.common.cancel}</button>
              <button type="submit" disabled={loading} className="btn-primary">{loading ? m.common.loading : m.common.save}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteClient && (
        <Modal open={true} title={m.fabr.confirmDelete} onClose={() => setDeleteClient(null)}>
          <p className="text-sm text-zinc-600 mb-4">Supprimer ce client ?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteClient(null)} className="btn-secondary">{m.common.cancel}</button>
            <button onClick={handleDelete} className="btn-danger">{m.common.confirm}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
