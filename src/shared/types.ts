export interface EmployeeType {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  baseSalary: string;
  startDate: string;
  status: string;
  monthlyAdvanceLimit: string;
  companyId: string;
  createdAt: string;
}

export interface SalaryAdvanceType {
  id: string;
  amount: string;
  reason: string | null;
  date: string;
  type: string;
  status: string;
  employeeId: string;
  companyId: string;
  approvedById: string | null;
  approvedAt: string | null;
  appliedInEmployeePayrollId: string | null;
  createdAt: string;
  Employee?: { firstName: string; lastName: string } | null;
}

export interface EmployeePayrollType {
  id: string;
  employeeId: string;
  companyId: string;
  periodMonth: number;
  periodYear: number;
  baseSalary: string;
  totalAdvances: string;
  netSalary: string;
  deductions: string;
  status: string;
  paidById: string | null;
  paidAt: string | null;
  createdAt: string;
  Employee?: { firstName: string; lastName: string; position: string; payDay: number } | null;
}

export interface AdvanceWithBalance extends SalaryAdvanceType {
  usedInMonth: number;
  limit: number;
  remaining: number;
}

export interface PourelleProductType {
  id: string;
  sku: string;
  category: string;
  brand: string;
  purchasePrice: string;
  sellingPrice: string;
  stock: number;
  supplierId: string | null;
  companyId: string;
  createdAt: string;
  Supplier?: { name: string; type: string } | null;
}

export interface PourelleSupplierType {
  id: string;
  name: string;
  type: string;
  phone: string;
  address: string;
  email: string;
  companyId: string;
  createdAt: string;
}

export interface PourelleSaleType {
  id: string;
  type: string;
  status: string;
  totalAmount: string;
  clientName: string;
  clientPhone: string;
  deliveryAddress: string;
  tracking: string;
  companyId: string;
  createdAt: string;
  items?: PourelleSaleItemType[];
}

export interface FabrexSupplierType {
  id: string;
  name: string;
  type: string;
  phone: string;
  email: string;
  address: string;
  companyId: string;
  createdAt: string;
}

export interface FabrexRawMaterialType {
  id: string;
  name: string;
  sku: string;
  unit: string;
  stock: string;
  purchasePrice: string;
  supplierId: string | null;
  companyId: string;
  createdAt: string;
  Supplier?: { name: string } | null;
}

export interface FabrexProductType {
  id: string;
  sku: string;
  name: string;
  category: string;
  sellingPrice: string;
  stock: number;
  companyId: string;
  createdAt: string;
}

export interface FabrexClientType {
  id: string;
  companyName: string;
  companyActivity: string;
  RC: string;
  NIF: string;
  phone: string;
  fax: string;
  email: string;
  address: string;
  banque: string;
  numCompteBancaire: string;
  companyId: string;
  createdAt: string;
}

export interface FabrexMachineType {
  id: string;
  name: string;
  model: string;
  status: string;
  companyId: string;
  createdAt: string;
}

export interface FabrexProductionOrderType {
  id: string;
  productId: string;
  machineId: string | null;
  operatorName: string;
  plannedQuantity: number;
  completedQuantity: number;
  wasteQuantity: number;
  startDate: string | null;
  endDate: string | null;
  status: string;
  notes: string;
  companyId: string;
  createdAt: string;
  Product?: { sku: string; name: string } | null;
  Machine?: { name: string } | null;
  materials?: FabrexProdOrderMaterialType[];
}

export interface FabrexProdOrderMaterialType {
  id: string;
  productionOrderId: string;
  rawMaterialId: string;
  quantityUsed: string;
  companyId: string;
  RawMaterial?: { name: string; sku: string; unit: string } | null;
}

export interface FabrexSaleType {
  id: string;
  clientId: string | null;
  totalAmount: string;
  status: string;
  invoiceNumber: string;
  companyId: string;
  createdAt: string;
  moyen_livraison?: Record<string, string> | null;
  Client?: { companyName: string; RC: string; NIF: string; address: string } | null;
  items?: FabrexSaleItemType[];
}

export interface FabrexSaleItemType {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  sizes: Record<string, number> | null;
  companyId: string;
  Product?: { sku: string; name: string } | null;
}

export interface FabrexDriverType {
  id: string;
  name: string;
  vehicle: string;
  matricule: string;
  companyId: string;
  createdAt: string;
}

export interface FabrexExpenseType {
  id: string;
  name: string;
  amount: string;
  date: string;
  companyId: string;
  createdAt: string;
}

export interface PourelleSaleItemType {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  companyId: string;
  Product?: { sku: string } | null;
}
