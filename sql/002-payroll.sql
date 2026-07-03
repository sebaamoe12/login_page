-- ============================================================
-- 002-payroll.sql — Module Paie (Employee, SalaryAdvance,
--                   EmployeePayroll)
-- Exécuter après 001-base.sql. Idempotent.
-- ============================================================

-- 1. Enums
DO $$ BEGIN
  CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AdvanceType" AS ENUM ('SALARY', 'EMERGENCY', 'MEDICAL', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AdvanceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PayrollRecordStatus" AS ENUM ('PENDING', 'PAID');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Tables
CREATE TABLE IF NOT EXISTS "Employee" (
  id TEXT PRIMARY KEY,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  position TEXT NOT NULL,
  "baseSalary" DECIMAL(10,2) NOT NULL,
  status "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
  "startDate" TIMESTAMPTZ NOT NULL,
  "monthlyAdvanceLimit" DECIMAL(10,2) NOT NULL DEFAULT 100000,
  "payDay" INTEGER NOT NULL DEFAULT 1,
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SalaryAdvance" (
  id TEXT PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  date TIMESTAMPTZ NOT NULL,
  type "AdvanceType" NOT NULL DEFAULT 'SALARY',
  status "AdvanceStatus" NOT NULL DEFAULT 'PENDING',
  "employeeId" TEXT NOT NULL REFERENCES "Employee"(id),
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  "approvedById" TEXT REFERENCES "User"(id),
  "approvedAt" TIMESTAMPTZ,
  "appliedInEmployeePayrollId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "EmployeePayroll" (
  id TEXT PRIMARY KEY,
  "employeeId" TEXT NOT NULL REFERENCES "Employee"(id),
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  "periodMonth" INTEGER NOT NULL,
  "periodYear" INTEGER NOT NULL,
  "baseSalary" DECIMAL(10,2) NOT NULL,
  "totalAdvances" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "netSalary" DECIMAL(10,2) NOT NULL,
  deductions DECIMAL(10,2) NOT NULL DEFAULT 0,
  status "PayrollRecordStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "EmployeePayroll_employeeId_periodMonth_periodYear_key"
  ON "EmployeePayroll"("employeeId", "periodMonth", "periodYear");

-- 4. Foreign key for SalaryAdvance → EmployeePayroll
DO $$ BEGIN
  ALTER TABLE "SalaryAdvance" ADD CONSTRAINT "SalaryAdvance_appliedInEmployeePayrollId_fkey"
    FOREIGN KEY ("appliedInEmployeePayrollId") REFERENCES "EmployeePayroll"(id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 5. Row Level Security
ALTER TABLE "Employee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SalaryAdvance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmployeePayroll" ENABLE ROW LEVEL SECURITY;

-- Employee
DO $$ BEGIN CREATE POLICY "employee_select" ON "Employee" FOR SELECT USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "employee_insert" ON "Employee" FOR INSERT WITH CHECK ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "employee_update" ON "Employee" FOR UPDATE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "employee_delete" ON "Employee" FOR DELETE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- SalaryAdvance
DO $$ BEGIN CREATE POLICY "advance_select" ON "SalaryAdvance" FOR SELECT USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "advance_insert" ON "SalaryAdvance" FOR INSERT WITH CHECK ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "advance_update" ON "SalaryAdvance" FOR UPDATE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "advance_delete" ON "SalaryAdvance" FOR DELETE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- EmployeePayroll
DO $$ BEGIN CREATE POLICY "employeepayroll_select" ON "EmployeePayroll" FOR SELECT USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "employeepayroll_insert" ON "EmployeePayroll" FOR INSERT WITH CHECK ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "employeepayroll_update" ON "EmployeePayroll" FOR UPDATE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "employeepayroll_delete" ON "EmployeePayroll" FOR DELETE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
