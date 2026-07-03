import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Factory } from "lucide-react";

export default async function FabrexHub() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="card px-6 py-16 text-center">
      <Factory className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
      <h2 className="text-lg font-semibold text-zinc-700">Fabrex</h2>
      <p className="mt-2 text-sm text-zinc-400">Module en cours de développement</p>
    </div>
  );
}
