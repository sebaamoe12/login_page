"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Trash2, Info, Printer, ToggleLeft, ToggleRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { m } from "@/shared/messages";
import { formatCurrency } from "@/shared/constants";

export function SalesClient({
  sales,
  itemsBySaleId,
  products,
  clients,
}: {
  sales: any[];
  itemsBySaleId: Record<string, any[]>;
  products: { id: string; sku: string; name: string; sellingPrice: string; stock: number }[];
  clients: { id: string; companyName: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [deleteSale, setDeleteSale] = useState<any>(null);
  const [infoSale, setInfoSale] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState("");
  const [driverName, setDriverName] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [matricule, setMatricule] = useState("");
  const [lines, setLines] = useState<{ productId: string; quantity: number; unitPrice: string; useSizes: boolean; sizes: { pts: number; qty: number }[] }[]>([]);

  const resetForm = () => {
    setClientId("");
    setDriverName("");
    setVehicle("");
    setMatricule("");
    setLines([]);
  };

  const supabaseCall = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  };

  const addSize = (i: number) => {
    setLines(lines.map((line, idx) => {
      if (idx !== i) return line;
      return { ...line, sizes: [...line.sizes, { pts: 0, qty: 1 }] };
    }));
  };

  const updateSize = (lineI: number, sizeI: number, field: string, value: string) => {
    setLines(lines.map((line, idx) => {
      if (idx !== lineI) return line;
      const newSizes = line.sizes.map((s, si) => {
        if (si !== sizeI) return s;
        return { ...s, [field]: field === "pts" || field === "qty" ? parseInt(value) || 0 : value };
      });
      const totalQty = newSizes.reduce((acc, s) => acc + s.qty, 0);
      return { ...line, sizes: newSizes, quantity: totalQty };
    }));
  };

  const removeSize = (lineI: number, sizeI: number) => {
    setLines(lines.map((line, idx) => {
      if (idx !== lineI) return line;
      const newSizes = line.sizes.filter((_, si) => si !== sizeI);
      return { ...line, sizes: newSizes, quantity: newSizes.reduce((acc, s) => acc + s.qty, 0) };
    }));
  };

  const addLine = () => {
    setLines([...lines, { productId: "", quantity: 1, unitPrice: "", useSizes: false, sizes: [] }]);
  };

  const updateLine = (i: number, field: string, value: string) => {
    const updated = lines.map((line, idx) => {
      if (idx !== i) return line;
      const newLine = { ...line, [field]: field === "quantity" ? parseInt(value) || 0 : value };
      if (field === "productId") {
        const product = products.find((p) => p.id === value);
        newLine.unitPrice = product ? product.sellingPrice : "";
      }
      return newLine;
    });
    setLines(updated);
  };

  const toggleSizes = (i: number) => {
    setLines(lines.map((line, idx) => {
      if (idx !== i) return line;
      const use = !line.useSizes;
      return { ...line, useSizes: use, sizes: use ? [{ pts: 0, qty: 1 }] : [] };
    }));
  };

  const removeLine = (i: number) => {
    setLines(lines.filter((_, idx) => idx !== i));
  };

  const total = lines.reduce((sum, ln) => {
    const qty = ln.useSizes ? ln.sizes.reduce((s, z) => s + z.qty, 0) : ln.quantity;
    return sum + qty * (parseFloat(ln.unitPrice) || 0);
  }, 0);

  const generateInvoiceNumber = async (supabase: any): Promise<string> => {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from("FabrexSale")
      .select("*", { count: "exact", head: true });
    return `FAC-${year}-${String((count || 0) + 1).padStart(4, "0")}`;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = await supabaseCall();
    const saleId = crypto.randomUUID();
    const totalAmount = total;
    const invoiceNumber = await generateInvoiceNumber(supabase);

    const moyen_livraison = driverName || vehicle || matricule
      ? { chauffeur: driverName, vehicule: vehicle, matricule }
      : null;

    const { error: sErr } = await supabase.from("FabrexSale").insert({
      id: saleId, clientId: clientId || null, totalAmount,
      status: "COMPLETED", invoiceNumber, companyId: "seed-company-001",
      moyen_livraison: moyen_livraison ? JSON.stringify(moyen_livraison) : null,
    });
    if (sErr) { toast(sErr.message, "error"); setLoading(false); return; }

    for (const line of lines) {
      const qty = line.useSizes ? line.sizes.reduce((s, z) => s + z.qty, 0) : line.quantity;

      let sizesJson = null;
      if (line.useSizes) {
        const obj: Record<string, number> = {};
        for (const s of line.sizes) {
          if (s.pts && s.qty) obj[String(s.pts)] = s.qty;
        }
        if (Object.keys(obj).length > 0) {
          sizesJson = obj;
        }
      }

      const { error: iErr } = await supabase.from("FabrexSaleItem").insert({
        id: crypto.randomUUID(), saleId, productId: line.productId,
        quantity: qty, unitPrice: parseFloat(line.unitPrice) || 0,
        sizes: sizesJson ? JSON.stringify(sizesJson) : null,
        companyId: "seed-company-001",
      });
      if (iErr) { toast(iErr.message, "error"); break; }

      const { data: product } = await supabase
        .from("FabrexProduct")
        .select("stock")
        .eq("id", line.productId)
        .single();
      if (product) {
        await supabase
          .from("FabrexProduct")
          .update({ stock: product.stock - qty })
          .eq("id", line.productId);
      }
    }

    toast(m.fabr.addSuccess);
    resetForm();
    setLoading(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteSale) return;
    const supabase = await supabaseCall();
    const items = itemsBySaleId[deleteSale.id] || [];

    for (const item of items) {
      const { data: product } = await supabase
        .from("FabrexProduct")
        .select("stock")
        .eq("id", item.productId)
        .single();
      if (product) {
        await supabase
          .from("FabrexProduct")
          .update({ stock: product.stock + item.quantity })
          .eq("id", item.productId);
      }
    }

    await supabase.from("FabrexSaleItem").delete().eq("saleId", deleteSale.id);
    await supabase.from("FabrexSale").delete().eq("id", deleteSale.id);
    setDeleteSale(null);
    toast(m.fabr.deleteSuccess);
    router.refresh();
  };

  const statusLabels: Record<string, string> = {
    COMPLETED: m.fabr.completed,
    CANCELLED: m.fabr.cancelled,
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> {m.fabr.addSale}
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{m.fabr.invoiceNumber}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.client}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.total}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.status}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.date}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.actions}</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-400">
                  {m.fabr.empty}
                </td>
              </tr>
            )}
            {sales.map((s) => (
              <tr key={s.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                  {s.invoiceNumber || "—"}
                </td>
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {s.Client?.companyName || "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatCurrency(s.totalAmount)}
                </td>
                <td className="px-4 py-3">
                  <Badge status={s.status}>
                    {statusLabels[s.status] || s.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {new Date(s.createdAt).toLocaleDateString("fr-DZ")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => setInfoSale(s)} className="btn-ghost btn-sm" title={m.fabr.invoice}>
                      <Info className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => window.open("/invoice/" + s.id, "_blank")} className="btn-ghost btn-sm" title={m.fabr.print}>
                      <Printer className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteSale(s)} className="btn-ghost btn-sm text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {infoSale && (
        <Modal open={true} title={m.fabr.invoice} onClose={() => setInfoSale(null)}>
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              <span className="font-medium text-zinc-900">{m.fabr.invoiceNumber} :</span>{" "}
              {infoSale.invoiceNumber || "—"}
            </p>
            <p className="text-sm text-zinc-600">
              <span className="font-medium text-zinc-900">{m.fabr.client} :</span>{" "}
              {infoSale.Client?.companyName || "—"}
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-500">
                  <th className="px-3 py-2 font-medium">{m.fabr.saleItems}</th>
                  <th className="px-3 py-2 font-medium">Pointure / Qté</th>
                  <th className="px-3 py-2 font-medium">Qté totale</th>
                  <th className="px-3 py-2 font-medium">Prix unitaire</th>
                  <th className="px-3 py-2 font-medium">{m.fabr.total}</th>
                </tr>
              </thead>
              <tbody>
                {(itemsBySaleId[infoSale.id] || []).map((item: any) => {
                  let szEntries: [string, number][] = [];
                  if (item.sizes) {
                    let sizes = item.sizes;
                    if (typeof sizes === 'string') {
                      try { sizes = JSON.parse(sizes); } catch {}
                    }
                    if (typeof sizes === 'object' && !Array.isArray(sizes)) {
                      szEntries = Object.entries(sizes);
                    }
                  }
                  return (
                    <tr key={item.id} className="border-b border-zinc-100">
                      <td className="px-3 py-2 text-zinc-600">{item.Product?.name || "—"}</td>
                      <td className="px-3 py-2 text-zinc-600">
                        {szEntries.length > 0
                          ? szEntries.map(([sz, qty], i) => <div key={i}>{sz} x {qty}{i < szEntries.length - 1 ? "," : ""}</div>)
                          : <div>{item.quantity} x</div>}
                      </td>
                      <td className="px-3 py-2 text-zinc-600">{item.quantity}</td>
                      <td className="px-3 py-2 text-zinc-600">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-3 py-2 text-zinc-600">{formatCurrency(item.quantity * item.unitPrice)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex justify-end pt-2">
              <button onClick={() => setInfoSale(null)} className="btn-primary">
                {m.common.close}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showForm && (
        <Modal open={true} title={m.fabr.addSale} onClose={() => { setShowForm(false); resetForm(); }}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.client}</label>
              <select className="input" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">{m.fabr.selectClient}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
            </div>

            <div className="border border-zinc-200 rounded-lg p-3 space-y-2">
              <label className="block text-sm font-medium text-zinc-700">Livraison (optionnel)</label>
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Nom du chauffeur" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
                <input className="input flex-1" placeholder="Véhicule" value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
                <input className="input flex-1" placeholder="Matricule" value={matricule} onChange={(e) => setMatricule(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.saleItems}</label>
              {lines.map((line, i) => (
                <div key={i} className="space-y-2 p-2 border border-zinc-200 rounded-lg">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <select className="input" value={line.productId} onChange={(e) => updateLine(i, "productId", e.target.value)} required>
                        <option value="">{m.fabr.selectProduct}</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.sku} - {p.name} ({m.fabr.stock}: {p.stock})</option>
                        ))}
                      </select>
                    </div>
                    {!line.useSizes && (
                      <div className="w-20">
                        <input className="input" type="number" min="1" value={line.quantity} onChange={(e) => updateLine(i, "quantity", e.target.value)} required />
                      </div>
                    )}
                    <div className="w-28">
                      <input className="input" type="number" min="0" step="0.01" value={line.unitPrice} onChange={(e) => updateLine(i, "unitPrice", e.target.value)} required />
                    </div>
                    <button type="button" onClick={() => toggleSizes(i)} className="btn-ghost btn-sm" title={line.useSizes ? "Mode simple" : "Mode pointure"}>
                      {line.useSizes ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4 text-zinc-400" />}
                    </button>
                    <button type="button" onClick={() => removeLine(i)} className="btn-ghost btn-sm text-red-500 mb-0.5">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {line.useSizes && (
                    <div className="space-y-1 ml-2">
                      {line.sizes.map((sz, si) => (
                        <div key={si} className="flex gap-2 items-center">
                          <input className="input w-20" type="number" min="1" placeholder="Pointure" value={sz.pts || ""} onChange={(e) => updateSize(i, si, "pts", e.target.value)} />
                          <input className="input w-20" type="number" min="1" placeholder="Qté" value={sz.qty || ""} onChange={(e) => updateSize(i, si, "qty", e.target.value)} />
                          <button type="button" onClick={() => removeSize(i, si)} className="btn-ghost btn-sm text-red-500"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addSize(i)} className="btn-secondary btn-xs"><Plus className="h-3 w-3" /> Ajouter pointure</button>
                    </div>
                  )}
                </div>
              ))}
              <button type="button" onClick={addLine} className="btn-secondary btn-sm">
                <Plus className="h-3.5 w-3.5" /> {m.fabr.addLine}
              </button>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="font-medium text-zinc-900">
                {m.fabr.saleTotal} : {formatCurrency(total)}
              </span>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary">{m.common.cancel}</button>
                <button type="submit" disabled={loading || lines.length === 0} className="btn-primary">{loading ? m.common.loading : m.common.save}</button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {deleteSale && (
        <Modal open={true} title={m.fabr.confirmDelete} onClose={() => setDeleteSale(null)}>
          <p className="text-sm text-zinc-600 mb-4">Supprimer cette vente ?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteSale(null)} className="btn-secondary">{m.common.cancel}</button>
            <button onClick={handleDelete} className="btn-danger">{m.common.confirm}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
