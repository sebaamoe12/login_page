"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Advance {
  id: string;
  amount: string;
  reason: string | null;
  type: string;
  status: string;
  date: string;
  createdAt: string;
  Employee: { firstName: string; lastName: string } | null;
}

export function AdvancesList({ advances }: { advances: Advance[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: "", amount: "", reason: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleApprove = async (id: string) => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("SalaryAdvance").update({ status: "APPROVED" }).eq("id", id);
    router.refresh();
  };

  const handleReject = async (id: string) => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("SalaryAdvance").update({ status: "REJECTED" }).eq("id", id);
    router.refresh();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const { error: err } = await supabase.from("SalaryAdvance").insert({
      id: crypto.randomUUID(),
      employeeId: form.employeeId,
      amount: parseFloat(form.amount),
      reason: form.reason || null,
      type: "SALARY",
      status: "PENDING",
      date: new Date().toISOString(),
      companyId: "seed-company-001",
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setShowForm(false);
    setForm({ employeeId: "", amount: "", reason: "" });
    setLoading(false);
    router.refresh();
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-blue-100 text-blue-700",
    REJECTED: "bg-red-100 text-red-700",
    PAID: "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm(!showForm)}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        {showForm ? "Cancel" : "Request Advance"}
      </button>

      {showForm && (
        <form onSubmit={handleAdd} className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
          <input
            placeholder="Employee ID"
            required
            value={form.employeeId}
            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Amount"
            type="number"
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Reason (optional)"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Employee</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Reason</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {advances.map((adv) => (
              <tr key={adv.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium">
                  {adv.Employee ? `${adv.Employee.firstName} ${adv.Employee.lastName}` : "Unknown"}
                </td>
                <td className="px-4 py-3">{Number(adv.amount).toLocaleString()} CFA</td>
                <td className="px-4 py-3 text-zinc-500">{adv.reason || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[adv.status] || ""}`}>
                    {adv.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500">{new Date(adv.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  {adv.status === "PENDING" && (
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleApprove(adv.id)} className="text-xs font-medium text-green-600 hover:text-green-800 underline">Approve</button>
                      <button onClick={() => handleReject(adv.id)} className="text-xs font-medium text-red-600 hover:text-red-800 underline">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {advances.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-400">
                  No advances yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
