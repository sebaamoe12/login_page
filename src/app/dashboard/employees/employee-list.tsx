"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  baseSalary: string;
  startDate: string;
  status: string;
}

const positions = ["vendeur", "operateur"];

export function EmployeeList({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    position: "",
    startDate: "",
    baseSalary: "",
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
      position: form.position,
      baseSalary: parseFloat(form.baseSalary),
      startDate: new Date(form.startDate).toISOString(),
      companyId: "seed-company-001",
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setShowForm(false);
    setForm({ firstName: "", lastName: "", position: "", startDate: "", baseSalary: "" });
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
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Prénom</label>
              <input placeholder="Prénom" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Nom</label>
              <input placeholder="Nom" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Poste</label>
              <select required value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                <option value="">Sélectionner un poste</option>
                {positions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Date d&apos;embauche</label>
              <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Salaire (DA)</label>
              <input placeholder="Salaire" type="number" required value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
            {loading ? "Ajout..." : "Ajouter"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Nom</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Poste</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Date embauche</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Salaire</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Statut</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                </td>
                <td className="px-4 py-3 text-zinc-600">{emp.position}</td>
                <td className="px-4 py-3 text-zinc-600">{new Date(emp.startDate).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium">{Number(emp.baseSalary).toLocaleString()} DA</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    emp.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
                  }`}>
                    {emp.status === "ACTIVE" ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleToggleStatus(emp)}
                    className="text-xs text-zinc-500 hover:text-zinc-900 underline"
                  >
                    {emp.status === "ACTIVE" ? "Désactiver" : "Activer"}
                  </button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-400">
                  Aucun employé pour le moment
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
