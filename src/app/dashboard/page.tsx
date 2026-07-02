import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SignOutButton from "./sign-out-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-zinc-500">
          Signed in as <span className="font-medium text-zinc-900">{user.email}</span>
        </p>
        <SignOutButton />
      </div>
    </div>
  );
}
