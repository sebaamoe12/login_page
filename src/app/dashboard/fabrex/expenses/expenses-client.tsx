"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { m } from "@/shared/messages";
import { formatCurrency } from "@/shared/constants";
import type { FabrexExpenseType } from "@/shared/types";

export function ExpensesClient({ expenses }: { expenses: FabrexExpenseType[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState<FabrexExpenseType | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<FabrexExpenseType | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", date: new Date().toISOString().slice(0, 10) });

  const supabaseCall = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  };

  const resetForm = () => setForm({ name: "", amount: "", date: new Date().toISOString().slice(0, 10) });

  const openEdit = (e: FabrexExpenseType) => {
    setEditExpense(e);
    setForm({ name: e.name, amount: e.amount, date: e.date.slice(0, 10) });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = await supabaseCall();
    const payload = { name: form.name, amount: parseFloat(form.amount) || 0, date: new Date(form.date).toISOString() };

    if (editExpense) {
      const { error } = await supabase.from("FabrexExpense").update(payload).eq("id", editExpense.id);
      if (error) { toast(error.message, "error"); setLoading(false); return; }
      toast(m.fabr.editSuccess);
    } else {
      const { error } = await supabase.from("FabrexExpense").insert({ id: crypto.randomUUID(), ...payload, companyId: "seed-company-001" });
      if (error) { toast(error.message, "error"); setLoading(false); return; }
      toast(m.fabr.addSuccess);
    }
    setShowForm(false); setEditExpense(null); resetForm(); setLoading(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteExpense) return;
    const supabase = await supabaseCall();
    await supabase.from("FabrexExpense").delete().eq("id", deleteExpense.id);
    setDeleteExpense(null);
    toast(m.fabr.deleteSuccess);
    router.refresh();
  };

  const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{m.fabr.saleTotal} : <span className="font-semibold text-zinc-900">{formatCurrency(total)}</span></p>
        <button onClick={() => { setEditExpense(null); resetForm(); setShowForm(true); }} className="btn-primary"><Plus className="h-4 w-4" /> {m.fabr.addExpense}</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{m.fabr.expenseName}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.expenseAmount}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.expenseDate}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.actions}</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 && <tr><td colSpan={4} className="px-4 py-12 text-center text-zinc-400">{m.fabr.empty}</td></tr>}
            {expenses.map((e) => (
              <tr key={e.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">{e.name}</td>
                <td className="px-4 py-3 text-zinc-600">{formatCurrency(e.amount)}</td>
                <td className="px-4 py-3 text-zinc-600">{new Date(e.date).toLocaleDateString("fr-DZ")}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(e)} className="btn-ghost btn-sm"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteExpense(e)} className="btn-ghost btn-sm text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal open={true} title={editExpense ? m.fabr.edit : m.fabr.addExpense} onClose={() => { setShowForm(false); setEditExpense(null); resetForm(); }}>
          <form onSubmit={handleSave} className="space-y-4">
            <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.expenseName}</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.expenseAmount} (DA)</label><input className="input" type="number" min="0" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.expenseDate}</label><input className="input" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditExpense(null); resetForm(); }} className="btn-secondary">{m.common.cancel}</button>
              <button type="submit" disabled={loading} className="btn-primary">{loading ? m.common.loading : m.common.save}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteExpense && (
        <Modal open={true} title={m.fabr.confirmDelete} onClose={() => setDeleteExpense(null)}>
          <p className="text-sm text-zinc-600 mb-4">Supprimer ce frais ?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteExpense(null)} className="btn-secondary">{m.common.cancel}</button>
            <button onClick={handleDelete} className="btn-danger">{m.common.confirm}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
