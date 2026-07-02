export const POSITIONS = ["vendeur", "operateur"] as const;
export type Position = (typeof POSITIONS)[number];

export const ADVANCE_TYPES = ["SALARY", "EMERGENCY", "MEDICAL", "OTHER"] as const;
export type AdvanceType = (typeof ADVANCE_TYPES)[number];

export const ADVANCE_STATUSES = ["PENDING", "APPROVED", "REJECTED", "PAID"] as const;
export type AdvanceStatus = (typeof ADVANCE_STATUSES)[number];

export const MONTH_NAMES_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
export const MONTH_NAMES_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${num.toLocaleString("fr-DZ")} DA`;
}

export function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}
