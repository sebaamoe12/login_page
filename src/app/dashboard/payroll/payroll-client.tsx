"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, CreditCard, Check, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { m } from "@/shared/messages";
import { formatCurrency, MONTH_NAMES_FR } from "@/shared/constants";

type Employee = { id: string; firstName: string; lastName: string; position: string; baseSalary: string; payDay: number; startDate: string };

type PayrollRecord = {
  id: string; employeeId: string; periodMonth: number; periodYear: number;
  baseSalary: string; totalAdvances: string; netSalary: string; status: string;
  Employee: { firstName: string; lastName: string; position: string; payDay: number } | null;
};

export function PayrollClient({ employees, payrolls: initial, advancesByPayroll }: {
  employees: Employee[];
  payrolls: PayrollRecord[];
  advancesByPayroll: Record<string, { id: string; amount: string; reason: string | null }[]>;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [selectedId, setSelectedId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [loading, setLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PayrollRecord | null>(null);
  const [employeeFilter, setEmployeeFilter] = useState("");

  const supabaseCall = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  };

  const selectedEmployee = employees.find((e) => e.id === selectedId);

  const availableMonths = useMemo(() => {
    if (!selectedEmployee) return [];
    const start = new Date(selectedEmployee.startDate);
    const startM = start.getMonth() + 1;
    const startY = start.getFullYear();
    const months: { month: number; year: number; label: string }[] = [];
    let y = startY, m = startM;
    while (y < currentYear || (y === currentYear && m <= currentMonth)) {
      months.push({ month: m, year: y, label: `${MONTH_NAMES_FR[m - 1]} ${y}` });
      m++;
      if (m > 12) { m = 1; y++; }
    }
    return months;
  }, [selectedEmployee, currentMonth, currentYear]);

  const getAvailableMonths = (emp: Employee | undefined, year: number) => {
    if (!emp) return [];
    const start = new Date(emp.startDate);
    const sm = start.getMonth() + 1, sy = start.getFullYear();
    let from = 1, to = 12;
    if (year === sy && year === currentYear) { from = sm; to = currentMonth; }
    else if (year === sy) { from = sm; }
    else if (year === currentYear) { to = currentMonth; }
    const months: number[] = [];
    for (let m = from; m <= to; m++) months.push(m);
    return months;
  };

  // Reset month/year when employee changes
  const handleEmployeeChange = (id: string) => {
    setSelectedId(id);
    const emp = employees.find((e) => e.id === id);
    if (emp) {
      const start = new Date(emp.startDate);
      if (currentYear > start.getFullYear() || (currentYear === start.getFullYear() && currentMonth >= start.getMonth() + 1)) {
        setSelectedMonth(currentMonth);
        setSelectedYear(currentYear);
      } else {
        setSelectedMonth(start.getMonth() + 1);
        setSelectedYear(start.getFullYear());
      }
    }
  };

  const filteredEmployees = employees;

  const filteredRecords = useMemo(() => {
    if (!employeeFilter) return initial;
    return initial.filter((p) => p.employeeId === employeeFilter);
  }, [initial, employeeFilter]);

  const pendingTotal = filteredRecords.filter((p) => p.status === "PENDING").reduce((s, p) => s + Number(p.netSalary), 0);
  const paidTotal = filteredRecords.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.netSalary), 0);
  const pendingCount = filteredRecords.filter((p) => p.status === "PENDING").length;

  const hasExistingLine = (empId: string, month: number, year: number) =>
    initial.some((p) => p.employeeId === empId && p.periodMonth === month && p.periodYear === year);

  const handleAddLine = async () => {
    if (!selectedId) return;
    setLoading(true);
    const emp = selectedEmployee;
    if (!emp) return;

    const { data: advances } = await (await supabaseCall())
      .from("SalaryAdvance")
      .select("id, amount")
      .eq("employeeId", selectedId)
      .eq("companyId", "seed-company-001")
      .is("appliedInEmployeePayrollId", null)
      .eq("status", "PAID");

    const totalAdvances = advances?.reduce((s, a) => s + Number(a.amount), 0) || 0;
    const netSalary = Math.max(Number(emp.baseSalary) - totalAdvances, 0);

    const payrollId = crypto.randomUUID();
    const { error } = await (await supabaseCall())
      .from("EmployeePayroll")
      .insert({
        id: payrollId,
        employeeId: selectedId,
        companyId: "seed-company-001",
        periodMonth: selectedMonth,
        periodYear: selectedYear,
        baseSalary: emp.baseSalary,
        totalAdvances: totalAdvances.toString(),
        deductions: totalAdvances.toString(),
        netSalary: netSalary.toString(),
        status: "PENDING",
      });

    if (error) { toast(error.message, "error"); setLoading(false); return; }

    // Link deducted advances to this payroll line
    const advanceIds = advances?.map((a: { id: string }) => a.id) || [];
    if (advanceIds.length > 0) {
      await (await supabaseCall())
        .from("SalaryAdvance")
        .update({ appliedInEmployeePayrollId: payrollId })
        .in("id", advanceIds);
    }

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await (await supabaseCall())
      .from("EmployeePayroll")
      .delete()
      .eq("id", deleteTarget.id);
    setDeleteTarget(null);
    toast(m.pay.deleteSuccess);
    router.refresh();
  };

  const handlePayAll = async () => {
    setLoading(true);
    const q = (await supabaseCall()).from("EmployeePayroll").update({ status: "PAID" }).eq("status", "PENDING");
    if (employeeFilter) q.eq("employeeId", employeeFilter);
    await q;
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
      {/* Filter + Summary bar */}
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={employeeFilter}
          onChange={(e) => setEmployeeFilter(e.target.value)}
          className="input w-auto min-w-[180px]"
        >
          <option value="">{m.pay.allEmployees}</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
          ))}
        </select>
        <div className="card px-4 py-3">
          <p className="text-xs text-zinc-500">{m.pay.totalPending}</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(pendingTotal)}</p>
        </div>
        <div className="card px-4 py-3">
          <p className="text-xs text-zinc-500">{m.pay.totalPaid}</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(paidTotal)}</p>
        </div>
        <button onClick={handlePayAll} disabled={pendingTotal === 0 || loading} className="btn-primary ml-auto">
          <CreditCard className="h-4 w-4" /> {m.pay.payAll} ({pendingCount})
        </button>
      </div>

      {/* Add payroll line */}
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-zinc-500 mb-1">{m.pay.employee}</label>
            <select
              value={selectedId}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className="input"
            >
              <option value="">{m.pay.selectEmployee}</option>
              {filteredEmployees.map((emp) => {
                const existing = hasExistingLine(emp.id, selectedMonth, selectedYear);
                return (
                  <option key={emp.id} value={emp.id} disabled={existing}>
                    {emp.firstName} {emp.lastName} — {emp.position}
                    {existing ? ` (${m.pay.lineExists})` : ""}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-zinc-500 mb-1">{m.pay.period}</label>
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="input"
              >
                {getAvailableMonths(selectedEmployee, selectedYear).map((m) => (
                  <option key={m} value={m}>{MONTH_NAMES_FR[m - 1]}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => { setSelectedYear(Number(e.target.value)); setSelectedMonth(getAvailableMonths(selectedEmployee, Number(e.target.value))[0] || 1); }}
                className="input"
              >
                {(() => {
                  const years: number[] = [];
                  if (selectedEmployee) {
                    const sy = new Date(selectedEmployee.startDate).getFullYear();
                    for (let y = sy; y <= currentYear; y++) years.push(y);
                  } else { years.push(currentYear); }
                  return years.map((y) => <option key={y} value={y}>{y}</option>);
                })()}
              </select>
            </div>
          </div>
          <button
            onClick={handleAddLine}
            disabled={!selectedId || hasExistingLine(selectedId, selectedMonth, selectedYear) || loading}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" /> {loading ? m.pay.adding : m.pay.addPayrollLine}
          </button>
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
            {filteredRecords.map((rec) => {
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
                    {(() => {
                      const linked = advancesByPayroll?.[rec.id];
                      if (!linked || linked.length === 0) return <span className="text-zinc-400">{m.pay.noAdvances}</span>;
                      return (
                        <div className="space-y-0.5">
                          {linked.map((a) => (
                            <div key={a.id} className="text-xs text-zinc-700">
                              {formatCurrency(a.amount)}{a.reason ? ` — ${a.reason}` : ""}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-zinc-900">{formatCurrency(rec.netSalary)}</td>
                  <td className="px-4 py-3"><Badge status={rec.status}>{m.pay[rec.status.toLowerCase() as keyof typeof m.pay] || rec.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {rec.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleConfirm(rec.id)}
                            disabled={confirmLoading === rec.id}
                            className="btn-sm flex items-center gap-1 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" /> {m.pay.confirmPayment}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(rec)}
                            className="btn-sm btn-ghost text-red-600"
                            title={m.pay.deleteLine}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-400">{m.pay.allPaid}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={m.pay.deleteLine}>
        <p className="text-sm text-zinc-600 mb-4">{m.pay.deleteConfirm}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary">{m.common.cancel}</button>
          <button onClick={handleDelete} className="btn-danger">{m.common.confirm}</button>
        </div>
      </Modal>
    </div>
  );
}