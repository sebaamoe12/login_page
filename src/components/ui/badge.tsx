import type { ReactNode } from "react";

const colorMap: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  APPROVED: "bg-blue-100 text-blue-700 border-blue-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
  PAID: "bg-green-100 text-green-700 border-green-200",
  DRAFT: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  INACTIVE: "bg-zinc-100 text-zinc-500 border-zinc-200",
  RECEIVED: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
  COMPLETED: "bg-green-100 text-green-700 border-green-200",
  DELIVERING: "bg-blue-100 text-blue-700 border-blue-200",
  IN_STORE: "bg-indigo-100 text-indigo-700 border-indigo-200",
  DELIVERY: "bg-purple-100 text-purple-700 border-purple-200",
};

const variantMap: Record<string, string> = {
  warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
  success: "bg-green-100 text-green-700 border-green-200",
  error: "bg-red-100 text-red-700 border-red-200",
  default: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

export function Badge({ status, variant, children }: { status?: string; variant?: string; children?: ReactNode }) {
  const key = status || (typeof children === "string" ? children : "");
  const colors = colorMap[key] || variantMap[variant || ""] || "bg-zinc-100 text-zinc-600 border-zinc-200";

  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors}`}>
      {children || status}
    </span>
  );
}
