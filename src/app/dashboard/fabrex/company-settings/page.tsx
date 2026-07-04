import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { m } from "@/shared/messages";
import { CompanySettingsClient } from "./company-settings-client";

export default async function FabrexCompanySettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: company } = await supabase
    .from("Company")
    .select("*")
    .single();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900">{m.fabr.companySettings}</h1>
      <CompanySettingsClient company={company} />
    </div>
  );
}
