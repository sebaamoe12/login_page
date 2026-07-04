"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { m } from "@/shared/messages";

export function CompanySettingsClient({ company }: { company: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: company?.name || "",
    address: company?.address || "",
    phone: company?.phone || "",
    RC: company?.RC || "",
    NIF: company?.NIF || "",
    email: company?.email || "",
  });

  const supabaseCall = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = await supabaseCall();
    const { error } = await supabase.from("Company").update(form).eq("id", company?.id);
    if (error) { toast(error.message, "error"); } else { toast(m.fabr.editSuccess); }
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="card max-w-2xl p-6">
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.companyName}</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.phone}</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="col-span-2"><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.address}</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.RC}</label><input className="input" value={form.RC} onChange={(e) => setForm({ ...form, RC: e.target.value })} /></div>
          <div><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.NIF}</label><input className="input" value={form.NIF} onChange={(e) => setForm({ ...form, NIF: e.target.value })} /></div>
          <div className="col-span-2"><label className="mb-1 block text-sm font-medium text-zinc-700">{m.fabr.email}</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        </div>
        <div className="flex justify-end pt-2">
          <button type="submit" disabled={loading} className="btn-primary">{loading ? m.common.loading : m.common.save}</button>
        </div>
      </form>
    </div>
  );
}
