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
  companyId: string;
  createdAt: string;
  items?: PourelleSaleItemType[];
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
