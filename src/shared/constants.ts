export const POSITIONS = ["vendeur", "operateur"] as const;
export type Position = (typeof POSITIONS)[number];

export const ADVANCE_TYPES = ["SALARY", "EMERGENCY", "MEDICAL", "OTHER"] as const;
export type AdvanceType = (typeof ADVANCE_TYPES)[number];

export const ADVANCE_STATUSES = ["PENDING", "APPROVED", "REJECTED", "PAID"] as const;
export type AdvanceStatus = (typeof ADVANCE_STATUSES)[number];

export const POURELLE_CATEGORIES = ["Baskets", "Sandales", "Chaussures Ville", "Bottes", "Escarpins", "Mocassins", "Sports", "Autres"] as const;
export type PourelleCategory = (typeof POURELLE_CATEGORIES)[number];

export const POURELLE_SALE_TYPES = ["IN_STORE", "DELIVERY", "DELIVERY_COMPANY"] as const;
export type PourelleSaleType = (typeof POURELLE_SALE_TYPES)[number];

export const POURELLE_SALE_STATUSES = ["COMPLETED", "CANCELLED", "PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"] as const;
export type PourelleSaleStatus = (typeof POURELLE_SALE_STATUSES)[number];

export const DELIVERY_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"] as const;

export const FABREX_CATEGORIES = ["Automobile", "Électroménager", "Emballage", "Jouet", "Mobilier", "Construction", "Autres"] as const;

export const FABREX_MACHINE_STATUSES = ["ACTIVE", "MAINTENANCE", "INACTIVE"] as const;

export const FABREX_PRODUCTION_STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export const FABREX_SALE_STATUSES = ["COMPLETED", "CANCELLED"] as const;

export const MONTH_NAMES_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
export const MONTH_NAMES_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${num.toLocaleString("fr-DZ")} DA`;
}

export function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}
