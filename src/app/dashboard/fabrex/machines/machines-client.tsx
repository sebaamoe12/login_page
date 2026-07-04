"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { m } from "@/shared/messages";
import { FABREX_MACHINE_STATUSES } from "@/shared/constants";

const statusLabels: Record<string, string> = { ACTIVE: m.fabr.active, MAINTENANCE: m.fabr.maintenanceUrgent, INACTIVE: m.fabr.inactive };
const statusColors: Record<string, string> = { ACTIVE: "bg-green-100 text-green-700", MAINTENANCE: "bg-red-100 text-red-700 animate-pulse", INACTIVE: "bg-zinc-100 text-zinc-500" };

export function MachinesClient({ machines }: { machines: any[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editMachine, setEditMachine] = useState<any>(null);
  const [deleteMachine, setDeleteMachine] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", model: "", status: "ACTIVE" });
  const maintenanceCount = machines.filter((m) => m.status === "MAINTENANCE").length;

  const supabaseCall = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  };

  const resetForm = () => setForm({ name: "", model: "", status: "ACTIVE" });

  const openEdit = (m: any) => {
    setEditMachine(m);
    setForm({ name: m.name, model: m.model, status: m.status });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = await supabaseCall();

    if (editMachine) {
      const { error } = await supabase.from("FabrexMachine").update(form).eq("id", editMachine.id);
      if (error) { toast(error.message, "error"); setLoading(false); return; }
      toast(m.fabr.editSuccess);
    } else {
      const { error } = await supabase.from("FabrexMachine").insert({ id: crypto.randomUUID(), ...form, companyId: "seed-company-001" });
      if (error) { toast(error.message, "error"); setLoading(false); return; }
      toast(m.fabr.addSuccess);
    }
    setShowForm(false); setEditMachine(null); resetForm(); setLoading(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteMachine) return;
    const supabase = await supabaseCall();
    await supabase.from("FabrexMachine").delete().eq("id", deleteMachine.id);
    setDeleteMachine(null);
    toast(m.fabr.deleteSuccess);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {maintenanceCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-red-600 font-medium animate-pulse">
            ⚠ {maintenanceCount} machine{maintenanceCount > 1 ? "s" : ""} en maintenance urgente
          </div>
        )}
        <div className="flex-1" />
        <button onClick={() => { setEditMachine(null); resetForm(); setShowForm(true); }} className="btn-primary"><Plus className="h-4 w-4" /> {m.fabr.addMachine}</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{m.fabr.name}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.model}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.status}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.actions}</th>
            </tr>
          </thead>
          <tbody>
            {machines.length === 0 && <tr><td colSpan={4} className="px-4 py-12 text-center text-zinc-400">{m.fabr.empty}</td></tr>}
            {machines.map((m) => (
              <tr key={m.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">{m.name}</td>
                <td className="px-4 py-3 text-zinc-600">{m.model || "—"}</td>
                <td className="px-4 py-3"><span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[m.status] || ""}`}>{statusLabels[m.status] || m.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(m)} className="btn-ghost btn-sm"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteMachine(m)} className="btn-ghost btn-sm text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal open={true} title={editMachine ? m.fabr.edit : m.fabr.addMachine} onClose={() => { setShowForm(false); setEditMachine(null); resetForm(); }}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.name}</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.model}</label><input className="input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.status}</label><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{FABREX_MACHINE_STATUSES.map((st) => <option key={st} value={st}>{statusLabels[st]}</option>)}</select></div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditMachine(null); resetForm(); }} className="btn-secondary">{m.common.cancel}</button>
              <button type="submit" disabled={loading} className="btn-primary">{loading ? m.common.loading : m.common.save}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteMachine && (
        <Modal open={true} title={m.fabr.confirmDelete} onClose={() => setDeleteMachine(null)}>
          <p className="text-sm text-zinc-600 mb-4">Supprimer cette machine ?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteMachine(null)} className="btn-secondary">{m.common.cancel}</button>
            <button onClick={handleDelete} className="btn-danger">{m.common.confirm}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
