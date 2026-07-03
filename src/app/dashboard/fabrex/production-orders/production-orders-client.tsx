"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Plus, X, Pencil, Trash2, Box } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { m } from "@/shared/messages";
import { FABREX_PRODUCTION_STATUSES, formatCurrency } from "@/shared/constants";

const statusLabels: Record<string, string> = {
  PLANNED: m.fabr.planned,
  IN_PROGRESS: m.fabr.inProgress,
  COMPLETED: m.fabr.completed,
  CANCELLED: m.fabr.cancelled,
};

const statusColors: Record<string, string> = {
  PLANNED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export function ProductionOrdersClient({
  orders, products, machines, rawMaterials,
}: {
  orders: any[];
  products: { id: string; sku: string; name: string }[];
  machines: { id: string; name: string }[];
  rawMaterials: { id: string; name: string; sku: string; unit: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editOrder, setEditOrder] = useState<any>(null);
  const [deleteOrder, setDeleteOrder] = useState<any>(null);
  const [statusModal, setStatusModal] = useState<{ id: string; status: string } | null>(null);
  const [completeModal, setCompleteModal] = useState<{ id: string } | null>(null);
  const [materialModal, setMaterialModal] = useState<{ productionOrderId: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ productId: "", machineId: "", operatorName: "", plannedQuantity: 0, startDate: "", notes: "" });
  const [completeForm, setCompleteForm] = useState({ completedQuantity: 0, wasteQuantity: 0 });
  const [materialForm, setMaterialForm] = useState({ rawMaterialId: "", quantityUsed: 0 });

  const supabaseCall = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  };

  const resetForm = () => setForm({ productId: "", machineId: "", operatorName: "", plannedQuantity: 0, startDate: "", notes: "" });
  const resetCompleteForm = () => setCompleteForm({ completedQuantity: 0, wasteQuantity: 0 });
  const resetMaterialForm = () => setMaterialForm({ rawMaterialId: "", quantityUsed: 0 });

  const openEdit = (order: any) => {
    setEditOrder(order);
    setForm({
      productId: order.productId,
      machineId: order.machineId || "",
      operatorName: order.operatorName,
      plannedQuantity: order.plannedQuantity,
      startDate: order.startDate ? order.startDate.slice(0, 10) : "",
      notes: order.notes || "",
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = await supabaseCall();
    const payload = {
      productId: form.productId,
      machineId: form.machineId || null,
      operatorName: form.operatorName,
      plannedQuantity: Number(form.plannedQuantity),
      startDate: form.startDate || null,
      notes: form.notes,
    };

    if (editOrder) {
      const { error } = await supabase.from("FabrexProductionOrder").update(payload).eq("id", editOrder.id);
      if (error) { toast(error.message, "error"); setLoading(false); return; }
      toast(m.fabr.editSuccess);
    } else {
      const { error } = await supabase.from("FabrexProductionOrder").insert({
        id: crypto.randomUUID(),
        ...payload,
        completedQuantity: 0,
        wasteQuantity: 0,
        status: "PLANNED",
        companyId: "seed-company-001",
      });
      if (error) { toast(error.message, "error"); setLoading(false); return; }
      toast(m.fabr.addSuccess);
    }
    setShowForm(false);
    setEditOrder(null);
    resetForm();
    setLoading(false);
    router.refresh();
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === "COMPLETED") {
      if (statusModal) {
        const order = orders.find((o: any) => o.id === statusModal.id);
        if (order) {
          setCompleteForm({ completedQuantity: order.plannedQuantity, wasteQuantity: 0 });
        }
        setCompleteModal({ id: statusModal.id });
      }
      return;
    }
    setLoading(true);
    const supabase = await supabaseCall();
    const update: any = { status: newStatus };
    if (newStatus === "IN_PROGRESS") {
      update.startDate = new Date().toISOString();
    }
    const { error } = await supabase.from("FabrexProductionOrder").update(update).eq("id", statusModal!.id);
    if (error) { toast(error.message, "error"); setLoading(false); return; }
    setStatusModal(null);
    setLoading(false);
    toast(m.fabr.editSuccess);
    router.refresh();
  };

  const handleComplete = async () => {
    if (!completeModal) return;
    setLoading(true);
    const supabase = await supabaseCall();
    const orderId = completeModal.id;
    const completedQty = Number(completeForm.completedQuantity);
    const wasteQty = Number(completeForm.wasteQuantity);

    const { data: orderData } = await supabase.from("FabrexProductionOrder").select("productId, plannedQuantity").eq("id", orderId).single();
    if (!orderData) { toast("Order not found", "error"); setLoading(false); return; }

    const { error: updateError } = await supabase.from("FabrexProductionOrder").update({
      completedQuantity: completedQty,
      wasteQuantity: wasteQty,
      status: "COMPLETED",
      endDate: new Date().toISOString(),
    }).eq("id", orderId);
    if (updateError) { toast(updateError.message, "error"); setLoading(false); return; }

    const { data: productData } = await supabase.from("FabrexProduct").select("stock").eq("id", orderData.productId).single();
    if (productData) {
      const currentStock = Number(productData.stock) || 0;
      await supabase.from("FabrexProduct").update({ stock: currentStock + completedQty }).eq("id", orderData.productId);
    }

    const { data: materials } = await supabase.from("FabrexProdOrderMaterial").select("*, RawMaterial:rawMaterialId(stock)").eq("productionOrderId", orderId);
    if (materials) {
      for (const mat of materials) {
        const qtyUsed = Number(mat.quantityUsed) || 0;
        const currentRawStock = Number(mat.RawMaterial?.stock) || 0;
        await supabase.from("FabrexRawMaterial").update({ stock: Math.max(0, currentRawStock - qtyUsed) }).eq("id", mat.rawMaterialId);
      }
    }

    setCompleteModal(null);
    resetCompleteForm();
    setLoading(false);
    toast(m.fabr.editSuccess);
    router.refresh();
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialModal || !materialForm.rawMaterialId) return;
    setLoading(true);
    const supabase = await supabaseCall();
    const { error } = await supabase.from("FabrexProdOrderMaterial").insert({
      id: crypto.randomUUID(),
      productionOrderId: materialModal.productionOrderId,
      rawMaterialId: materialForm.rawMaterialId,
      quantityUsed: Number(materialForm.quantityUsed),
      companyId: "seed-company-001",
    });
    if (error) { toast(error.message, "error"); setLoading(false); return; }
    resetMaterialForm();
    setLoading(false);
    toast(m.fabr.addSuccess);
    router.refresh();
  };

  const handleDeleteMaterial = async (id: string) => {
    const supabase = await supabaseCall();
    await supabase.from("FabrexProdOrderMaterial").delete().eq("id", id);
    toast(m.fabr.deleteSuccess);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteOrder) return;
    const supabase = await supabaseCall();
    await supabase.from("FabrexProdOrderMaterial").delete().eq("productionOrderId", deleteOrder.id);
    await supabase.from("FabrexProductionOrder").delete().eq("id", deleteOrder.id);
    setDeleteOrder(null);
    toast(m.fabr.deleteSuccess);
    router.refresh();
  };

  const currentOrderMaterials = materialModal
    ? orders.find((o: any) => o.id === materialModal.productionOrderId)?.materials || []
    : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditOrder(null); resetForm(); setShowForm(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> Nouvel ordre
        </button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{m.fabr.product}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.machine}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.operator}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.plannedQty}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.completedQty}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.status}</th>
              <th className="px-4 py-3 font-medium">{m.fabr.actions}</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-400">{m.fabr.empty}</td></tr>
            )}
            {orders.map((order: any) => (
              <tr key={order.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {order.Product ? `${order.Product.sku} (${order.Product.name})` : "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600">{order.Machine?.name || "—"}</td>
                <td className="px-4 py-3 text-zinc-600">{order.operatorName || "—"}</td>
                <td className="px-4 py-3 text-zinc-600">{order.plannedQuantity}</td>
                <td className="px-4 py-3 text-zinc-600">{order.completedQuantity || 0}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[order.status] || ""}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(order)} className="btn-ghost btn-sm" title={m.fabr.edit}>
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                      <button onClick={() => setStatusModal({ id: order.id, status: order.status })} className="btn-ghost btn-sm" title={m.fabr.productionStatus}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => setDeleteOrder(order)} className="btn-ghost btn-sm text-red-500" title={m.fabr.delete}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal open={true} title={editOrder ? m.fabr.edit : m.fabr.addProductionOrder} onClose={() => { setShowForm(false); setEditOrder(null); resetForm(); }}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.product}</label>
              <select className="input" required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                <option value="">{m.fabr.selectProduct}</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.machine}</label>
              <select className="input" value={form.machineId} onChange={(e) => setForm({ ...form, machineId: e.target.value })}>
                <option value="">{m.fabr.selectMachine}</option>
                {machines.map((mch) => <option key={mch.id} value={mch.id}>{mch.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.operator}</label>
              <input className="input" required value={form.operatorName} onChange={(e) => setForm({ ...form, operatorName: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.plannedQty}</label>
              <input className="input" type="number" min="1" required value={form.plannedQuantity} onChange={(e) => setForm({ ...form, plannedQuantity: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.startDate}</label>
              <input className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.notes}</label>
              <textarea className="input" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditOrder(null); resetForm(); }} className="btn-secondary">{m.common.cancel}</button>
              <button type="submit" disabled={loading} className="btn-primary">{loading ? m.common.loading : m.common.save}</button>
            </div>
          </form>
        </Modal>
      )}

      {statusModal && !completeModal && (
        <Modal open={true} title={m.fabr.productionStatus} onClose={() => setStatusModal(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">{m.fabr.status} :</span>
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[statusModal.status] || ""}`}>
                {statusLabels[statusModal.status] || statusModal.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {FABREX_PRODUCTION_STATUSES.map((st) => (
                <button
                  key={st}
                  disabled={st === statusModal.status || loading}
                  onClick={() => handleStatusChange(st)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium border transition-colors ${
                    st === statusModal.status
                      ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed"
                      : `${statusColors[st]} border-transparent hover:opacity-80`
                  }`}
                >
                  {statusLabels[st] || st}
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setStatusModal(null)} className="btn-secondary">{m.common.cancel}</button>
            </div>
          </div>
        </Modal>
      )}

      {completeModal && (
        <Modal open={true} title="Terminer la production" onClose={() => { setCompleteModal(null); resetCompleteForm(); }}>
          <form onSubmit={(e) => { e.preventDefault(); handleComplete(); }} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.completedQty}</label>
              <input className="input" type="number" min="0" required value={completeForm.completedQuantity}
                onChange={(e) => setCompleteForm({ ...completeForm, completedQuantity: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.wasteQty}</label>
              <input className="input" type="number" min="0" value={completeForm.wasteQuantity}
                onChange={(e) => setCompleteForm({ ...completeForm, wasteQuantity: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setCompleteModal(null); resetCompleteForm(); }} className="btn-secondary">{m.common.cancel}</button>
              <button type="submit" disabled={loading} className="btn-primary">{loading ? m.common.loading : m.common.confirm}</button>
            </div>
          </form>
        </Modal>
      )}

      {materialModal && (
        <Modal open={true} title="Matières consommées" onClose={() => setMaterialModal(null)}>
          <div className="space-y-4">
            {currentOrderMaterials.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-zinc-500">
                    <th className="pb-2 font-medium">{m.fabr.rawMaterials}</th>
                    <th className="pb-2 font-medium">{m.fabr.qtyUsed}</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrderMaterials.map((mat: any) => (
                    <tr key={mat.id} className="border-b border-zinc-100">
                      <td className="py-2 text-zinc-900">{mat.RawMaterial?.name || "—"}</td>
                      <td className="py-2 text-zinc-600">{mat.quantityUsed} {mat.RawMaterial?.unit || ""}</td>
                      <td className="py-2">
                        <button onClick={() => handleDeleteMaterial(mat.id)} className="btn-ghost btn-sm text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {currentOrderMaterials.length === 0 && (
              <p className="text-sm text-zinc-400">Aucune matière consommée</p>
            )}
            <form onSubmit={handleAddMaterial} className="flex items-end gap-2 pt-2 border-t border-zinc-200">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-zinc-500">{m.fabr.selectRawMaterial}</label>
                <select className="input text-sm" value={materialForm.rawMaterialId} onChange={(e) => setMaterialForm({ ...materialForm, rawMaterialId: e.target.value })}>
                  <option value="">{m.fabr.selectRawMaterial}</option>
                  {rawMaterials.map((rm) => <option key={rm.id} value={rm.id}>{rm.name} ({rm.sku})</option>)}
                </select>
              </div>
              <div className="w-24">
                <label className="mb-1 block text-xs font-medium text-zinc-500">{m.fabr.qtyUsed}</label>
                <input className="input text-sm" type="number" min="0" step="0.01" value={materialForm.quantityUsed}
                  onChange={(e) => setMaterialForm({ ...materialForm, quantityUsed: parseFloat(e.target.value) || 0 })} />
              </div>
              <button type="submit" disabled={loading || !materialForm.rawMaterialId} className="btn-primary btn-sm whitespace-nowrap">
                Ajouter matière
              </button>
            </form>
            <div className="flex justify-end pt-2">
              <button onClick={() => setMaterialModal(null)} className="btn-secondary">{m.common.close}</button>
            </div>
          </div>
        </Modal>
      )}

      {deleteOrder && (
        <Modal open={true} title={m.fabr.confirmDelete} onClose={() => setDeleteOrder(null)}>
          <p className="text-sm text-zinc-600 mb-4">Supprimer cet ordre de production ?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteOrder(null)} className="btn-secondary">{m.common.cancel}</button>
            <button onClick={handleDelete} className="btn-danger">{m.common.confirm}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
