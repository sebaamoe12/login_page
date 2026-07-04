import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { m } from "@/shared/messages";
import { formatCurrency, MONTH_NAMES_FR, MONTH_NAMES_SHORT } from "@/shared/constants";
import { BarChart3, Users, Wallet, Store, ShoppingBag, DollarSign, Package, Factory, Cpu } from "lucide-react";
import { ReportsChart } from "./reports-chart";
import { PourelleSalesChart } from "./reports-pourelle";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Payroll section ──
  const { count: activeEmployees } = await supabase.from("Employee").select("*", { count: "exact", head: true }).eq("status", "ACTIVE");
  const now = new Date();

  const { data: currentPayrolls } = await supabase
    .from("EmployeePayroll")
    .select("netSalary")
    .eq("periodMonth", now.getMonth() + 1)
    .eq("periodYear", now.getFullYear());
  const currentMonthTotal = currentPayrolls?.reduce((s, p) => s + Number(p.netSalary), 0) || 0;

  const { data: allPayrolls, error } = await supabase
    .from("EmployeePayroll")
    .select("periodMonth, periodYear, netSalary, status, Employee(firstName, lastName)")
    .order("periodYear", { ascending: false })
    .order("periodMonth", { ascending: false });

  const historyTotal = allPayrolls?.reduce((s, p) => s + Number(p.netSalary), 0) || 0;

  const byPeriod = new Map<string, { count: number; total: number; paid: number }>();
  allPayrolls?.forEach((p) => {
    const key = `${p.periodYear}-${String(p.periodMonth).padStart(2, "0")}`;
    const entry = byPeriod.get(key) || { count: 0, total: 0, paid: 0 };
    entry.count++; entry.total += Number(p.netSalary);
    if (p.status === "PAID") entry.paid++;
    byPeriod.set(key, entry);
  });

  const byEmployee = new Map<string, { firstName: string; lastName: string; count: number; total: number }>();
  allPayrolls?.forEach((p) => {
    const emp = Array.isArray(p.Employee) ? p.Employee[0] : p.Employee;
    const name = emp ? `${emp.firstName} ${emp.lastName}` : "—";
    const entry = byEmployee.get(name) || { firstName: emp?.firstName || "", lastName: emp?.lastName || "", count: 0, total: 0 };
    entry.count++; entry.total += Number(p.netSalary);
    byEmployee.set(name, entry);
  });

  // ── Pourelle section ──
  const { data: allSales } = await supabase
    .from("PourelleSale")
    .select("id, totalAmount, createdAt")
    .in("status", ["COMPLETED", "DELIVERED"]);

  const completedSaleIds = allSales?.map((s) => s.id) || [];

  const totalSalesAmount = allSales?.reduce((s, sale) => s + Number(sale.totalAmount), 0) || 0;
  const totalSalesCount = allSales?.length || 0;

  // Sales by month (last 12)
  const salesByMonth: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    salesByMonth[`${d.getFullYear()}-${d.getMonth()}`] = 0;
  }
  allSales?.forEach((sale) => {
    const d = new Date(sale.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (key in salesByMonth) salesByMonth[key] += Number(sale.totalAmount);
  });
  const salesChartData = Object.entries(salesByMonth).map(([key, val]) => {
    const [year, month] = key.split("-").map(Number);
    return { label: `${MONTH_NAMES_SHORT[month]} ${year}`, value: val };
  });

  // Top products
  const { data: saleItems } = await supabase
    .from("PourelleSaleItem")
    .select("productId, quantity, unitPrice, Product:productId(sku, purchasePrice)")
    .in("saleId", completedSaleIds);

  const byProduct = new Map<string, { name: string; sku: string; qty: number; revenue: number; profit: number }>();
  saleItems?.forEach((item) => {
    const prod = Array.isArray(item.Product) ? item.Product[0] : item.Product;
    const name = prod?.sku || "—";
    const sku = prod?.sku || "";
    const purchasePrice = prod ? Number((prod as any).purchasePrice) : 0;
    const entry = byProduct.get(item.productId) || { name, sku, qty: 0, revenue: 0, profit: 0 };
    entry.qty += item.quantity;
    entry.revenue += item.quantity * Number(item.unitPrice);
    entry.profit += item.quantity * (Number(item.unitPrice) - purchasePrice);
    byProduct.set(item.productId, entry);
  });
  const topProducts = Array.from(byProduct.entries())
    .map(([id, val]) => ({ id, ...val }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  // Stock value
  const { data: products } = await supabase.from("PourelleProduct").select("id, sku, purchasePrice, sellingPrice, stock");
  const stockValue = products?.reduce((s, p) => s + Number(p.purchasePrice) * p.stock, 0) || 0;
  const lowStockItems = products?.filter((p) => p.stock > 0 && p.stock < 5) || [];

  // ── Fabrex section ──
  const { data: fabrexSales } = await supabase
    .from("FabrexSale")
    .select("id, totalAmount, createdAt")
    .eq("status", "COMPLETED");

  const fabrexSalesAmount = fabrexSales?.reduce((s, sale) => s + Number(sale.totalAmount), 0) || 0;
  const fabrexSalesCount = fabrexSales?.length || 0;

  const fabrexSalesIds = fabrexSales?.map((s) => s.id) || [];

  // Filter items belonging to completed sales
  const { data: fabrexItemsFiltered } = await supabase
    .from("FabrexSaleItem")
    .select("productId, quantity, unitPrice, Product:productId(sku, name)")
    .in("saleId", fabrexSalesIds);

  const fabrexByProduct = new Map<string, { name: string; sku: string; qty: number; revenue: number }>();
  fabrexItemsFiltered?.forEach((item) => {
    const prod = Array.isArray(item.Product) ? item.Product[0] : item.Product;
    const name = prod?.name || "—";
    const sku = prod?.sku || "";
    const entry = fabrexByProduct.get(item.productId) || { name, sku, qty: 0, revenue: 0 };
    entry.qty += item.quantity;
    entry.revenue += item.quantity * Number(item.unitPrice);
    fabrexByProduct.set(item.productId, entry);
  });
  const fabrexTopProducts = Array.from(fabrexByProduct.entries())
    .map(([id, val]) => ({ id, ...val }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  const { data: fabrexExpenses } = await supabase
    .from("FabrexExpense")
    .select("amount, date");
  const fabrexExpensesTotal = fabrexExpenses?.reduce((s, e) => s + Number(e.amount), 0) || 0;

  // Fabrex sales by month
  const fabrexSalesByMonth: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    fabrexSalesByMonth[`${d.getFullYear()}-${d.getMonth()}`] = 0;
  }
  fabrexSales?.forEach((sale) => {
    const d = new Date(sale.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (key in fabrexSalesByMonth) fabrexSalesByMonth[key] += Number(sale.totalAmount);
  });
  const fabrexSalesChartData = Object.entries(fabrexSalesByMonth).map(([key, val]) => {
    const [year, month] = key.split("-").map(Number);
    return { label: `${MONTH_NAMES_SHORT[month]} ${year}`, value: val };
  });

  // Fabrex expenses by month
  const fabrexExpensesByMonth: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    fabrexExpensesByMonth[`${d.getFullYear()}-${d.getMonth()}`] = 0;
  }
  fabrexExpenses?.forEach((exp) => {
    const d = new Date(exp.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (key in fabrexExpensesByMonth) fabrexExpensesByMonth[key] += Number(exp.amount);
  });
  const fabrexExpensesChartData = Object.entries(fabrexExpensesByMonth).map(([key, val]) => {
    const [year, month] = key.split("-").map(Number);
    return { label: `${MONTH_NAMES_SHORT[month]} ${year}`, value: val };
  });

  const { count: fabrexProductCount } = await supabase.from("FabrexProduct").select("*", { count: "exact", head: true });
  const { count: fabrexMachineCount } = await supabase.from("FabrexMachine").select("*", { count: "exact", head: true }).eq("status", "ACTIVE");
  const grossMargin = topProducts.reduce((s, p) => s + p.profit, 0);

  if (error && error.code === "42P01") {
    return (
      <div className="card px-6 py-12 text-center">
        <h2 className="text-lg font-semibold text-amber-800">{m.dash.notSetUp}</h2>
        <p className="mt-2 text-sm text-amber-700">{m.dash.notSetUpDesc}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-zinc-900">{m.rep.title}</h1>

      {/* ========== PAYROLL SECTION ========== */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-zinc-900">{m.rep.payroll}</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="card p-5">
            <div className="flex items-center gap-2 text-indigo-600">
              <Users className="h-4 w-4" />
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.rep.totalEmployees}</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-zinc-900">{activeEmployees}</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 text-indigo-600">
              <Wallet className="h-4 w-4" />
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.rep.currentMonth}</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-zinc-900">{formatCurrency(currentMonthTotal)}</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 text-indigo-600">
              <BarChart3 className="h-4 w-4" />
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.rep.historyTotal}</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-zinc-900">{formatCurrency(historyTotal)}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <div className="card">
            <div className="px-5 py-4 border-b border-zinc-200">
              <h2 className="font-semibold text-zinc-900">{m.rep.monthlyOverview}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.rep.period}</th>
                    <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.rep.employees}</th>
                    <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.rep.totalAmount}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {Array.from(byPeriod.entries()).map(([key, val]) => {
                    const [year, month] = key.split("-");
                    return (
                      <tr key={key} className="hover:bg-zinc-50">
                        <td className="px-5 py-3 font-medium text-zinc-900">{MONTH_NAMES_FR[parseInt(month) - 1]} {year}</td>
                        <td className="px-5 py-3 text-zinc-600">{val.count}</td>
                        <td className="px-5 py-3">{formatCurrency(val.total)}</td>
                      </tr>
                    );
                  })}
                  {byPeriod.size === 0 && (
                    <tr><td colSpan={3} className="px-5 py-12 text-center text-sm text-zinc-400">{m.rep.empty}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card p-5">
            <div className="mb-4"><h2 className="font-semibold text-zinc-900">{m.rep.monthlyOverview}</h2></div>
            <ReportsChart data={Array.from(byPeriod.entries()).map(([key, val]) => ({ period: key, total: val.total }))} />
          </div>
        </div>

        <div className="card">
          <div className="px-5 py-4 border-b border-zinc-200">
            <h2 className="font-semibold text-zinc-900">{m.rep.employeeHistory}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.adv.employee}</th>
                  <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.pay.months}</th>
                  <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.rep.totalAmount}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {Array.from(byEmployee.entries()).map(([name, val]) => (
                  <tr key={name} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 font-medium text-zinc-900">{name}</td>
                    <td className="px-5 py-3 text-zinc-600">{val.count}</td>
                    <td className="px-5 py-3">{formatCurrency(val.total)}</td>
                  </tr>
                ))}
                {byEmployee.size === 0 && (
                  <tr><td colSpan={3} className="px-5 py-12 text-center text-sm text-zinc-400">{m.rep.empty}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========== POURELLE SECTION ========== */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Store className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-zinc-900">{m.pour.rep.title}</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          <div className="card p-5">
            <div className="flex items-center gap-2 text-amber-600">
              <ShoppingBag className="h-4 w-4" />
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.pour.rep.totalSales}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{formatCurrency(totalSalesAmount)}</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 text-indigo-600">
              <BarChart3 className="h-4 w-4" />
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.pour.rep.salesCount}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{totalSalesCount}</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 text-emerald-600">
              <DollarSign className="h-4 w-4" />
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.pour.rep.grossMargin}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{formatCurrency(grossMargin)}</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 text-blue-600">
              <Package className="h-4 w-4" />
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.pour.rep.stockValue}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{formatCurrency(stockValue)}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <div className="card p-5">
            <div className="mb-3"><h2 className="font-semibold text-zinc-900">{m.pour.rep.salesByMonth}</h2></div>
            <PourelleSalesChart data={salesChartData} />
          </div>

          <div className="card">
            <div className="px-5 py-4 border-b border-zinc-200">
              <h2 className="font-semibold text-zinc-900">{m.pour.rep.topProducts}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.pour.rep.product}</th>
                    <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.pour.rep.qtySold}</th>
                    <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.pour.rep.revenue}</th>
                    <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.pour.rep.profit}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {topProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3 font-medium text-zinc-900">{p.name}</td>
                      <td className="px-5 py-3 text-zinc-600">{p.qty}</td>
                      <td className="px-5 py-3">{formatCurrency(p.revenue)}</td>
                      <td className="px-5 py-3 text-emerald-600">{formatCurrency(p.profit)}</td>
                    </tr>
                  ))}
                  {topProducts.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-zinc-400">{m.rep.empty}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <div className="px-5 py-4 border-b border-zinc-200">
              <h2 className="font-semibold text-zinc-900">{m.pour.rep.lowStock}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.pour.rep.product}</th>
                    <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.pour.sku}</th>
                    <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.pour.stock}</th>
                    <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.pour.sellingPrice}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {lowStockItems.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3 font-medium text-zinc-900">{p.sku}</td>
                      <td className="px-5 py-3 text-zinc-600">{p.sku}</td>
                      <td className="px-5 py-3"><span className="font-medium text-red-600">{p.stock}</span></td>
                      <td className="px-5 py-3">{formatCurrency(p.sellingPrice)}</td>
                    </tr>
                  ))}
                  {lowStockItems.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-zinc-400">{m.pour.empty}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card p-5">
            <div className="mb-3"><h2 className="font-semibold text-zinc-900">{m.pour.rep.stockValue}</h2></div>
            <p className="text-3xl font-bold text-zinc-900">{formatCurrency(stockValue)}</p>
            <p className="text-sm text-zinc-500 mt-1">{products?.length || 0} produits en stock</p>
          </div>
        </div>
      </div>

      {/* ========== FABREX SECTION ========== */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Factory className="h-5 w-5 text-cyan-600" />
          <h2 className="text-lg font-semibold text-zinc-900">{m.rep.fabrex}</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          <div className="card p-5">
            <div className="flex items-center gap-2 text-cyan-600">
              <ShoppingBag className="h-4 w-4" />
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.rep.fabrexSales}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{formatCurrency(fabrexSalesAmount)}</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 text-indigo-600">
              <BarChart3 className="h-4 w-4" />
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.rep.fabrexSalesCount}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{fabrexSalesCount}</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 text-red-600">
              <DollarSign className="h-4 w-4" />
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.rep.fabrexExpenses}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{formatCurrency(fabrexExpensesTotal)}</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 text-blue-600">
              <Package className="h-4 w-4" />
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.rep.fabrexProducts}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{fabrexProductCount}</p>
            <p className="text-xs text-zinc-400 mt-1">{fabrexMachineCount} machines actives</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <div className="card p-5">
            <div className="mb-3"><h2 className="font-semibold text-zinc-900">{m.rep.fabrexSalesByMonth}</h2></div>
            <PourelleSalesChart data={fabrexSalesChartData} />
          </div>

          <div className="card">
            <div className="px-5 py-4 border-b border-zinc-200">
              <h2 className="font-semibold text-zinc-900">{m.rep.fabrexTopProducts}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.fabr.sku}</th>
                    <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.fabr.product}</th>
                    <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.pour.rep.qtySold}</th>
                    <th className="px-5 py-3 text-left font-medium text-zinc-500">{m.pour.rep.revenue}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {fabrexTopProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3 font-mono text-xs text-zinc-600">{p.sku}</td>
                      <td className="px-5 py-3 font-medium text-zinc-900">{p.name}</td>
                      <td className="px-5 py-3 text-zinc-600">{p.qty}</td>
                      <td className="px-5 py-3">{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                  {fabrexTopProducts.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-zinc-400">{m.rep.empty}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-3"><h2 className="font-semibold text-zinc-900">{m.rep.fabrexExpensesByMonth}</h2></div>
          <PourelleSalesChart data={fabrexExpensesChartData} />
        </div>
      </div>
    </div>
  );
}
