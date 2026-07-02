"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  position: string;
  baseSalary: string;
  status: string;
  phone: string | null;
  monthlyAdvanceLimit: string;
}

export function EmployeeList({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    position: "",
    baseSalary: "",
    phone: "",
    monthlyAdvanceLimit: "50000",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const id = crypto.randomUUID();
    const { error: err } = await supabase.from("Employee").insert({
      id,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email || null,
      position: form.position,
      baseSalary: parseFloat(form.baseSalary),
      phone: form.phone || null,
      monthlyAdvanceLimit: parseFloat(form.monthlyAdvanceLimit),
      startDate: new Date().toISOString(),
      payDay: 1,
      companyId: "seed-company-001",
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setShowForm(false);
    setForm({ firstName: "", lastName: "", email: "", position: "", baseSalary: "", phone: "", monthlyAdvanceLimit: "50000" });
    setLoading(false);
    router.refresh();
  };

  const handleToggleStatus = async (employee: Employee) => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const newStatus = employee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await supabase.from("Employee").update({ status: newStatus }).eq("id", employee.id);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm(!showForm)}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        {showForm ? "Cancel" : "Add Employee"}
      </button>

      {showForm && (
        <form onSubmit={handleAdd} className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="First name" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <input placeholder="Last name" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <input placeholder="Position" required value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <input placeholder="Base salary" type="number" required value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <input placeholder="Monthly advance limit" type="number" value={form.monthlyAdvanceLimit} onChange={(e) => setForm({ ...form, monthlyAdvanceLimit: e.target.value })} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
            {loading ? "Adding..." : "Add Employee"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Position</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Salary</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                  {emp.email && <div className="text-xs text-zinc-400">{emp.email}</div>}
                </td>
                <td className="px-4 py-3 text-zinc-600">{emp.position}</td>
                <td className="px-4 py-3 font-medium">{Number(emp.baseSalary).toLocaleString()} CFA</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    emp.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
                  }`}>
                    {emp.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleToggleStatus(emp)}
                    className="text-xs text-zinc-500 hover:text-zinc-900 underline"
                  >
                    {emp.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-400">
                  No employees yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
