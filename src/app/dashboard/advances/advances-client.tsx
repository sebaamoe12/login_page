"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useToast } from "@/components/ui/toast";
import { m } from "@/shared/messages";
import { formatCurrency, MONTH_NAMES_FR, ADVANCE_TYPES } from "@/shared/constants";

type Advance = {
  id: string; amount: string; reason: string | null; date: string; type: string; status: string;
  employeeId: string; appliedInEmployeePayrollId: string | null;
  Employee: { firstName: string; lastName: string } | null;
};

type Employee = { id: string; firstName: string; lastName: string; baseSalary: string; monthlyAdvanceLimit: string };

const filters = ["ALL", "PENDING", "APPROVED", "REJECTED", "PAID"] as const;

export function AdvancesClient({ advances, employees }: { advances: Advance[]; employees: Employee[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editAdvance, setEditAdvance] = useState<Advance | null>(null);
  const [deleteAdvance, setDeleteAdvance] = useState<Advance | null>(null);
  const [form, setForm] = useState({ employeeId: "", amount: "", type: "SALARY", reason: "" });
  const [loading, setLoading] = useState(false);

  const filtered = advances.filter((a) => filter === "ALL" || a.status === filter);

  const now = new Date();
  const employeeBalances = useMemo(() => {
    return employees.map((emp) => {
      const monthlyUsed = advances
        .filter((a) => {
          const d = new Date(a.date);
          return a.employeeId === emp.id && a.status !== "REJECTED" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((s, a) => s + Number(a.amount), 0);
      const salary = Number(emp.baseSalary);
      return { ...emp, used: monthlyUsed, remaining: Math.max(salary - monthlyUsed, 0), salary };
    });
  }, [employees, advances, now]);

  const supabaseCall = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  };

  const syncPayrollAdvances = async (supabase: Awaited<ReturnType<typeof supabaseCall>>, employeeId: string) => {
    const now = new Date();
    const periodMonth = now.getMonth() + 1;
    const periodYear = now.getFullYear();

    const { data: emp } = await supabase
      .from("Employee")
      .select("baseSalary")
      .eq("id", employeeId)
      .single();

    if (!emp) return;

    const baseSalary = Number(emp.baseSalary);

    // Get or create PENDING EmployeePayroll for this month
    let { data: payroll } = await supabase
      .from("EmployeePayroll")
      .select("id")
      .eq("employeeId", employeeId)
      .eq("periodMonth", periodMonth)
      .eq("periodYear", periodYear)
      .eq("status", "PENDING")
      .maybeSingle();

    if (!payroll) {
      const payrollId = crypto.randomUUID();
      await supabase.from("EmployeePayroll").insert({
        id: payrollId,
        employeeId,
        companyId: "seed-company-001",
        periodMonth,
        periodYear,
        baseSalary: baseSalary.toString(),
        totalAdvances: "0",
        deductions: "0",
        netSalary: baseSalary.toString(),
        status: "PENDING",
      });
      payroll = { id: payrollId };
    }

    // Link all non-rejected advances to this payroll
    const { data: unlinked } = await supabase
      .from("SalaryAdvance")
      .select("id, amount")
      .eq("employeeId", employeeId)
      .eq("companyId", "seed-company-001")
      .neq("status", "REJECTED")
      .is("appliedInEmployeePayrollId", null);

    const unlinkedIds = unlinked?.map((a) => a.id) || [];
    if (unlinkedIds.length > 0) {
      await supabase
        .from("SalaryAdvance")
        .update({ appliedInEmployeePayrollId: payroll.id })
        .in("id", unlinkedIds);
    }

    // Recalculate total from all linked advances
    const { data: allLinked } = await supabase
      .from("SalaryAdvance")
      .select("amount")
      .eq("employeeId", employeeId)
      .eq("appliedInEmployeePayrollId", payroll.id);

    const sum = allLinked?.reduce((s, a) => s + Number(a.amount), 0) || 0;
    const netSalary = Math.max(baseSalary - sum, 0);

    await supabase
      .from("EmployeePayroll")
      .update({ totalAdvances: sum.toString(), deductions: sum.toString(), netSalary: netSalary.toString() })
      .eq("id", payroll.id);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = await supabaseCall();
    const employeeId = form.employeeId;
    const { error } = await supabase.from("SalaryAdvance").insert({
      id: crypto.randomUUID(), employeeId, amount: parseFloat(form.amount),
      reason: form.reason || null, type: form.type, status: "PENDING", date: new Date().toISOString(), companyId: "seed-company-001",
    });
    if (error) { toast(error.message, "error"); setLoading(false); return; }
    await syncPayrollAdvances(supabase, employeeId);
    setShowForm(false); setForm({ employeeId: "", amount: "", type: "SALARY", reason: "" }); setLoading(false);
    toast(m.adv.addSuccess); router.refresh();
  };

  const handleApprove = async (id: string) => {
    const supabase = await supabaseCall();
    await supabase.from("SalaryAdvance").update({ status: "APPROVED" }).eq("id", id);
    const { data: adv } = await supabase.from("SalaryAdvance").select("employeeId").eq("id", id).single();
    if (adv) await syncPayrollAdvances(supabase, adv.employeeId);
    toast(m.adv.approveSuccess); router.refresh();
  };

  const handleReject = async (id: string) => {
    const supabase = await supabaseCall();
    const { data: adv } = await supabase.from("SalaryAdvance").select("employeeId, appliedInEmployeePayrollId").eq("id", id).single();
    await supabase.from("SalaryAdvance").update({ status: "REJECTED" }).eq("id", id);
    if (adv?.appliedInEmployeePayrollId) await syncPayrollAdvances(supabase, adv.employeeId);
    toast(m.adv.rejectSuccess); router.refresh();
  };

  const handleMarkPaid = async (id: string) => {
    const supabase = await supabaseCall();
    await supabase.from("SalaryAdvance").update({ status: "PAID" }).eq("id", id);
    const { data: adv } = await supabase.from("SalaryAdvance").select("employeeId").eq("id", id).single();
    if (adv) await syncPayrollAdvances(supabase, adv.employeeId);
    toast(m.adv.paySuccess); router.refresh();
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editAdvance) return;
    setLoading(true);
    const supabase = await supabaseCall();
    const { error } = await supabase.from("SalaryAdvance").update({ amount: parseFloat(form.amount), reason: form.reason, type: form.type }).eq("id", editAdvance.id);
    if (error) { toast(error.message, "error"); setLoading(false); return; }
    await syncPayrollAdvances(supabase, editAdvance.employeeId);
    setEditAdvance(null); setLoading(false); toast(m.adv.editSuccess); router.refresh();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteAdvance) return;
    const supabase = await supabaseCall();
    const adv = deleteAdvance;
    await supabase.from("SalaryAdvance").delete().eq("id", adv.id);
    if (adv.appliedInEmployeePayrollId) await syncPayrollAdvances(supabase, adv.employeeId);
    setDeleteAdvance(null); toast(m.adv.deleteSuccess); router.refresh();
  };

  const openEdit = (adv: Advance) => {
    setForm({ employeeId: adv.employeeId, amount: adv.amount, type: adv.type, reason: adv.reason || "" });
    setEditAdvance(adv);
  };

  return (
    <div className="space-y-6">
      {/* Balance cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {employeeBalances.map((emp) => (
          <div key={emp.id} className="card p-4 space-y-2">
            <p className="font-medium text-sm text-zinc-900">{emp.firstName} {emp.lastName}</p>
            <p className="text-xs text-zinc-500">{m.adv.baseSalary}: {formatCurrency(emp.salary)}</p>
            <div className="flex justify-between text-xs">
              <span className="text-red-500">{m.adv.used}: {formatCurrency(emp.used)}</span>
              <span className="text-green-600">{m.adv.remainingBalance}: {formatCurrency(emp.remaining)}</span>
            </div>
            <ProgressBar value={emp.used} max={emp.salary} />
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> {m.adv.newAdvance}
        </button>
        <div className="flex gap-1 rounded-lg border border-zinc-200 p-1">
          {filters.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filter === f ? "bg-primary text-white" : "text-zinc-500 hover:text-zinc-900"}`}>
              {m.adv.all === "Toutes" && f === "ALL" ? "Toutes" : m.adv[f.toLowerCase() as keyof typeof m.adv] || f}
            </button>
          ))}
        </div>
      </div>

      {/* New advance form */}
      {showForm && (
        <form onSubmit={handleAdd} className="card p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-4">
            <select required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="input">
              <option value="">{m.adv.employee}</option>
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
            </select>
            <input type="number" required placeholder={m.adv.amount} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input">
              {ADVANCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input placeholder={m.adv.reason} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="input" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? m.adv.submitting : m.adv.submit}</button>
        </form>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">{m.adv.employee}</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">{m.adv.amount}</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">{m.adv.type}</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">{m.adv.date}</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">{m.adv.reason}</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">{m.adv.status}</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">{m.adv.remaining}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {filtered.map((adv) => {
              const bal = employeeBalances.find((b) => b.id === adv.employeeId);
              return (
                <tr key={adv.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {adv.Employee ? `${adv.Employee.firstName} ${adv.Employee.lastName}` : "—"}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(adv.amount)}</td>
                  <td className="px-4 py-3 text-zinc-600">{adv.type}</td>
                  <td className="px-4 py-3 text-zinc-500">{new Date(adv.date).toLocaleDateString("fr-DZ")}</td>
                  <td className="px-4 py-3 text-zinc-500 max-w-[120px] truncate">{adv.reason || "—"}</td>
                  <td className="px-4 py-3"><Badge status={adv.status}>{m.adv[adv.status.toLowerCase() as keyof typeof m.adv] as string || adv.status}</Badge></td>
                  <td className="px-4 py-3 text-zinc-600">{bal ? formatCurrency(Math.max(bal.remaining, 0)) : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {adv.appliedInEmployeePayrollId ? (
                      <span className="text-xs text-zinc-400 italic">{m.adv.appliedToPayroll}</span>
                    ) : (
                      <div className="flex gap-1 justify-end">
                        {adv.status === "PENDING" && (
                          <>
                            <button onClick={() => handleApprove(adv.id)} className="btn-sm btn-ghost text-green-600" title={m.adv.approve}><CheckCircle className="h-3.5 w-3.5" /></button>
                            <button onClick={() => handleReject(adv.id)} className="btn-sm btn-ghost text-red-600" title={m.adv.reject}><XCircle className="h-3.5 w-3.5" /></button>
                          </>
                        )}
                        {adv.status === "APPROVED" && (
                          <button onClick={() => handleMarkPaid(adv.id)} className="btn-sm btn-ghost text-green-600" title={m.adv.markPaid}><DollarSign className="h-3.5 w-3.5" /></button>
                        )}
                        <button onClick={() => openEdit(adv)} className="btn-sm btn-ghost" title={m.adv.edit}><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteAdvance(adv)} className="btn-sm btn-ghost text-red-600" title={m.adv.delete}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-zinc-400">{m.adv.empty}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      <Modal open={!!editAdvance} onClose={() => setEditAdvance(null)} title={m.adv.editTitle}>
        <form onSubmit={handleEditSave} className="space-y-3">
          <input type="number" required placeholder={m.adv.amount} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input" />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input">
            {ADVANCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input placeholder={m.adv.reason} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="input" />
          <button type="submit" disabled={loading} className="btn-primary w-full">{m.common.save}</button>
        </form>
      </Modal>

      {/* Delete modal */}
      <Modal open={!!deleteAdvance} onClose={() => setDeleteAdvance(null)} title={m.adv.deleteTitle}>
        <p className="text-sm text-zinc-600 mb-4">{m.adv.deleteConfirm}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteAdvance(null)} className="btn-secondary">{m.common.cancel}</button>
          <button onClick={handleDeleteConfirm} className="btn-danger">{m.common.confirm}</button>
        </div>
      </Modal>
    </div>
  );
}
