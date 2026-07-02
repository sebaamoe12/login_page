import type { ReactNode } from "react";

const colorMap: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  APPROVED: "bg-blue-100 text-blue-700 border-blue-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
  PAID: "bg-green-100 text-green-700 border-green-200",
  DRAFT: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  INACTIVE: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

export function Badge({ status, children }: { status?: string; children?: ReactNode }) {
  const key = status || (typeof children === "string" ? children : "");
  const colors = colorMap[key] || "bg-zinc-100 text-zinc-600 border-zinc-200";

  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors}`}>
      {children || status}
    </span>
  );
}
