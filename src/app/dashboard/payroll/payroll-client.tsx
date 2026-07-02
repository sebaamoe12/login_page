"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, ChevronRight, DollarSign, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useToast } from "@/components/ui/toast";
import { m } from "@/shared/messages";
import { formatCurrency, MONTH_NAMES_FR, getMonthKey } from "@/shared/constants";
import type { EmployeePayrollType } from "@/shared/types";

type Employee = { id: string; firstName: string; lastName: string; position: string; baseSalary: string; payDay: number };
type PayrollRow = EmployeePayrollType & { Employee: { firstName: string; lastName: string; position: string; payDay: number } | null };

export function PayrollClient({ employees, payrolls: initial }: { employees: Employee[]; payrolls: PayrollRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const supabaseCall = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  };

  // Group payrolls by employee
  const byEmployee = useMemo(() => {
    const map = new Map<string, PayrollRow[]>();
    initial.forEach((p) => {
      const list = map.get(p.employeeId) || [];
      list.push(p);
      map.set(p.employeeId, list);
    });
    return map;
  }, [initial]);

  const filteredEmployees = employees.filter(
    (e) => `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const pendingTotal = initial.filter((p) => p.status === "PENDING").reduce((s, p) => s + Number(p.netSalary), 0);
  const paidTotal = initial.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.netSalary), 0);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const payNow = async (payrollId: string) => {
    const supabase = await supabaseCall();
    await supabase.from("EmployeePayroll").update({ status: "PAID" }).eq("id", payrollId);
    toast(m.pay.paySuccess); router.refresh();
  };

  const payEmployeeAll = async (employeeId: string) => {
    const supabase = await supabaseCall();
    await supabase.from("EmployeePayroll").update({ status: "PAID" }).eq("employeeId", employeeId).eq("status", "PENDING");
    toast(m.pay.paySuccess); router.refresh();
  };

  const payAll = async () => {
    const supabase = await supabaseCall();
    await supabase.from("EmployeePayroll").update({ status: "PAID" }).eq("status", "PENDING");
    toast(m.pay.payAllSuccess); router.refresh();
  };

  // Compute summary per employee
  const employeeSummaries = useMemo(() => {
    return filteredEmployees.map((emp) => {
      const records = byEmployee.get(emp.id) || [];
      const pending = records.filter((r) => r.status === "PENDING");
      const paid = records.filter((r) => r.status === "PAID");
      const pendingAmount = pending.reduce((s, r) => s + Number(r.netSalary), 0);
      const paidAmount = paid.reduce((s, r) => s + Number(r.netSalary), 0);
      const total = pendingAmount + paidAmount;
      return { ...emp, records, pending, paid, pendingAmount, paidAmount, total, monthCount: records.length };
    });
  }, [filteredEmployees, byEmployee]);

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
        <button onClick={payAll} disabled={pendingTotal === 0} className="btn-primary flex items-center gap-2 ml-auto">
          <CreditCard className="h-4 w-4" /> {m.pay.payAll} ({initial.filter((p) => p.status === "PENDING").length})
        </button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={m.pay.search} className="input pl-9 w-48" />
        </div>
      </div>

      {/* Employee cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {employeeSummaries.map((emp) => (
          <div key={emp.id} className="card overflow-hidden">
            <button onClick={() => toggleExpand(emp.id)} className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors">
              <div className="text-left">
                <p className="font-medium text-zinc-900">{emp.firstName} {emp.lastName}</p>
                <p className="text-xs text-zinc-500">{emp.position} — {m.pay.payDay}: {emp.payDay}</p>
                <p className="text-xs text-zinc-400">{emp.monthCount} {m.pay.months}</p>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="text-sm font-semibold text-green-600">{formatCurrency(emp.paidAmount)}</p>
                  <p className="text-xs font-medium text-red-500">{formatCurrency(emp.pendingAmount)}</p>
                </div>
                {expanded.has(emp.id) ? <ChevronDown className="h-4 w-4 text-zinc-400" /> : <ChevronRight className="h-4 w-4 text-zinc-400" />}
              </div>
            </button>

            {expanded.has(emp.id) && (
              <div className="border-t border-zinc-100">
                <div className="px-4 py-3">
                  <ProgressBar value={emp.paidAmount} max={emp.total || 1} className="mb-3" />
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">{formatCurrency(emp.paidAmount)} {m.pay.paid}</span>
                    <span className="text-red-500">{formatCurrency(emp.pendingAmount)} {m.pay.pending}</span>
                  </div>
                </div>

                <div className="border-t border-zinc-100 divide-y divide-zinc-100">
                  {emp.records.map((pr) => (
                    <div key={pr.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <div>
                        <span className="text-zinc-900 font-medium">{MONTH_NAMES_FR[pr.periodMonth - 1]} {pr.periodYear}</span>
                        <span className="text-zinc-400 ml-2 text-xs">J{emp.payDay}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500 text-xs">{formatCurrency(pr.baseSalary)} - {formatCurrency(pr.totalAdvances)} = </span>
                        <span className="font-semibold text-zinc-900">{formatCurrency(pr.netSalary)}</span>
                        <Badge status={pr.status}>{m.pay[pr.status.toLowerCase() as keyof typeof m.pay] || pr.status}</Badge>
                        {pr.status === "PENDING" && (
                          <button onClick={() => payNow(pr.id)} className="btn-sm btn-primary flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> {m.pay.payNow}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="px-4 py-2.5 border-t border-zinc-100">
                    <button onClick={() => payEmployeeAll(emp.id)} disabled={emp.pendingAmount === 0} className="btn-sm btn-primary">
                      {m.pay.payEmployeeAll} {emp.firstName}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {employeeSummaries.length === 0 && (
        <div className="card px-6 py-12 text-center text-sm text-zinc-400">{m.pay.allPaid}</div>
      )}
    </div>
  );
}
