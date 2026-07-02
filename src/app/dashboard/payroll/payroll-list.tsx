"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PayrollRun {
  id: string;
  periodMonth: number;
  periodYear: number;
  status: string;
  totalAmount: string;
  createdAt: string;
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function PayrollList({ runs }: { runs: PayrollRun[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const exists = runs.find((r) => r.periodMonth === month && r.periodYear === year);
    if (exists) {
      alert("A payroll run already exists for this month.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("PayrollRun").insert({
      id: crypto.randomUUID(),
      companyId: "seed-company-001",
      periodMonth: month,
      periodYear: year,
      status: "DRAFT",
      totalAmount: 0,
    });

    if (!error) {
      setShowForm(false);
      router.refresh();
    }
    setLoading(false);
  };

  const statusColors: Record<string, string> = {
    DRAFT: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-blue-100 text-blue-700",
    PAID: "bg-green-100 text-green-700",
    PENDING: "bg-zinc-100 text-zinc-600",
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm(!showForm)}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        {showForm ? "Cancel" : "Create Payroll Run"}
      </button>

      {showForm && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-600 mb-3">
            Create a new payroll run for <strong>{monthNames[new Date().getMonth()]} {new Date().getFullYear()}</strong>
          </p>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Confirm"}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Period</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Total</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {runs.map((run) => (
              <tr key={run.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium">{monthNames[run.periodMonth - 1]} {run.periodYear}</td>
                <td className="px-4 py-3">{Number(run.totalAmount).toLocaleString()} CFA</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[run.status] || ""}`}>
                    {run.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500">{new Date(run.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-400">
                  No payroll runs yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
