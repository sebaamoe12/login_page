"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, CreditCard, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { m } from "@/shared/messages";
import { formatCurrency, MONTH_NAMES_FR } from "@/shared/constants";

type Employee = { id: string; firstName: string; lastName: string; position: string; baseSalary: string; payDay: number };

type PayrollRecord = {
  id: string; employeeId: string; periodMonth: number; periodYear: number;
  baseSalary: string; totalAdvances: string; netSalary: string; status: string;
  Employee: { firstName: string; lastName: string; position: string; payDay: number } | null;
};

export function PayrollClient({ employees, payrolls: initial }: { employees: Employee[]; payrolls: PayrollRecord[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const supabaseCall = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  };

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const filteredEmployees = employees.filter(
    (e) => `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const pendingTotal = initial.filter((p) => p.status === "PENDING").reduce((s, p) => s + Number(p.netSalary), 0);
  const paidTotal = initial.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.netSalary), 0);

  const hasExistingLine = (empId: string) =>
    initial.some((p) => p.employeeId === empId && p.periodMonth === currentMonth && p.periodYear === currentYear);

  const handleAddLine = async () => {
    if (!selectedId) return;
    setLoading(true);
    const emp = employees.find((e) => e.id === selectedId);
    if (!emp) return;

    const { data: advances } = await (await supabaseCall())
      .from("SalaryAdvance")
      .select("amount, status")
      .eq("employeeId", selectedId)
      .eq("companyId", "seed-company-001")
      .is("appliedInEmployeePayrollId", null)
      .neq("status", "REJECTED");

    const totalAdvances = advances?.reduce((s, a) => s + Number(a.amount), 0) || 0;
    const netSalary = Math.max(Number(emp.baseSalary) - totalAdvances, 0);

    const { error } = await (await supabaseCall())
      .from("EmployeePayroll")
      .insert({
        id: crypto.randomUUID(),
        employeeId: selectedId,
        companyId: "seed-company-001",
        periodMonth: currentMonth,
        periodYear: currentYear,
        baseSalary: emp.baseSalary,
        totalAdvances: totalAdvances.toString(),
        deductions: totalAdvances.toString(),
        netSalary: netSalary.toString(),
        status: "PENDING",
      });

    if (error) { toast(error.message, "error"); setLoading(false); return; }

    toast(m.pay.addLineSuccess);
    setLoading(false);
    router.refresh();
  };

  const handleConfirm = async (recordId: string) => {
    setConfirmLoading(recordId);
    await (await supabaseCall())
      .from("EmployeePayroll")
      .update({ status: "PAID" })
      .eq("id", recordId);

    toast(m.pay.confirmSuccess);
    setConfirmLoading(null);
    router.refresh();
  };

  const handlePayAll = async () => {
    setLoading(true);
    await (await supabaseCall())
      .from("EmployeePayroll")
      .update({ status: "PAID" })
      .eq("status", "PENDING");
    toast(m.pay.payAllSuccess);
    setLoading(false);
    router.refresh();
  };

  const sortedRecords = useMemo(() => {
    return [...initial].sort((a, b) => {
      if (a.periodYear !== b.periodYear) return b.periodYear - a.periodYear;
      return b.periodMonth - a.periodMonth;
    });
  }, [initial]);

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="card px-4 py-3">
          <p className="text-xs text-zinc-500">{m.pay.totalPending}</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(pendingTotal)}</p>
        </div>
        <div className="card px-4 py-3">
          <p className="text-xs text-zinc-500">{m.pay.totalPaid}</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(paidTotal)}</p>
        </div>
        <button onClick={handlePayAll} disabled={pendingTotal === 0 || loading} className="btn-primary ml-auto">
          <CreditCard className="h-4 w-4" /> {m.pay.payAll} ({initial.filter((p) => p.status === "PENDING").length})
        </button>
      </div>

      {/* Add payroll line */}
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-zinc-500 mb-1">{m.pay.employee}</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="input"
            >
              <option value="">{m.pay.selectEmployee}</option>
              {filteredEmployees.map((emp) => (
                <option key={emp.id} value={emp.id} disabled={hasExistingLine(emp.id)}>
                  {emp.firstName} {emp.lastName} — {emp.position}
                  {hasExistingLine(emp.id) ? ` (${m.pay.lineExists})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-zinc-500 mb-1">{m.pay.period}</label>
            <input
              readOnly
              value={`${MONTH_NAMES_FR[currentMonth - 1]} ${currentYear}`}
              className="input bg-zinc-50 text-zinc-600"
            />
          </div>
          <button
            onClick={handleAddLine}
            disabled={!selectedId || hasExistingLine(selectedId) || loading}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" /> {loading ? m.pay.adding : m.pay.addPayrollLine}
          </button>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={m.pay.search}
            className="input pl-9"
          />
        </div>
      </div>

      {/* Records table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">{m.pay.employee}</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">{m.pay.period}</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">{m.pay.baseSalary}</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">{m.pay.advances}</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">{m.pay.netSalary}</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">{m.pay.status}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {sortedRecords.map((rec) => {
              const emp = Array.isArray(rec.Employee) ? rec.Employee[0] : rec.Employee;
              return (
                <tr key={rec.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {emp ? `${emp.firstName} ${emp.lastName}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {MONTH_NAMES_FR[rec.periodMonth - 1]} {rec.periodYear}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(rec.baseSalary)}</td>
                  <td className="px-4 py-3">
                    {Number(rec.totalAdvances) > 0
                      ? formatCurrency(rec.totalAdvances)
                      : <span className="text-zinc-400">{m.pay.noAdvances}</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-zinc-900">{formatCurrency(rec.netSalary)}</td>
                  <td className="px-4 py-3"><Badge status={rec.status}>{m.pay[rec.status.toLowerCase() as keyof typeof m.pay] || rec.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    {rec.status === "PENDING" && (
                      <button
                        onClick={() => handleConfirm(rec.id)}
                        disabled={confirmLoading === rec.id}
                        className="btn-sm flex items-center gap-1 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" /> {m.pay.confirmPayment}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {sortedRecords.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-400">{m.pay.allPaid}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}