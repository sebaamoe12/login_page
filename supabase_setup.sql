-- Paste this entire file into your Supabase SQL Editor and run it.
-- It is idempotent — safe to run multiple times.

-- 1. Enums
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'VIEWER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

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
  CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'APPROVED', 'PAID', 'PENDING');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PayrollRecordStatus" AS ENUM ('PENDING', 'PAID');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Tables
CREATE TABLE IF NOT EXISTS "Company" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  "stripeCustomerId" TEXT,
  "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role "Role" NOT NULL DEFAULT 'VIEWER',
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- Migrate existing tables: drop unused columns, add missing columns, add position constraint
ALTER TABLE "Employee" DROP COLUMN IF EXISTS email;
ALTER TABLE "Employee" DROP COLUMN IF EXISTS phone;
ALTER TABLE "Employee" DROP COLUMN IF EXISTS password;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "monthlyAdvanceLimit" DECIMAL(10,2) NOT NULL DEFAULT 100000;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "payDay" INTEGER NOT NULL DEFAULT 1;
DO $$ BEGIN
  ALTER TABLE "Employee" ADD CONSTRAINT "Employee_position_check"
    CHECK (position IN ('vendeur', 'operateur'));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

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

-- Main payroll table: one row per employee per month
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

-- Legacy tables from NextAuth.js (unused with Supabase auth, kept for migration safety)
CREATE TABLE IF NOT EXISTS "Account" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT
);

CREATE TABLE IF NOT EXISTS "Session" (
  id TEXT PRIMARY KEY,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS "VerificationToken" (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires TIMESTAMPTZ NOT NULL
);

-- 3. Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"(provider, "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"(identifier, token);
CREATE UNIQUE INDEX IF NOT EXISTS "EmployeePayroll_employeeId_periodMonth_periodYear_key" ON "EmployeePayroll"("employeeId", "periodMonth", "periodYear");

-- 4. Foreign key for SalaryAdvance → EmployeePayroll (when advance is applied to payroll)
DO $$ BEGIN
  ALTER TABLE "SalaryAdvance" ADD CONSTRAINT "SalaryAdvance_appliedInEmployeePayrollId_fkey"
    FOREIGN KEY ("appliedInEmployeePayrollId") REFERENCES "EmployeePayroll"(id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 5. Seed company (used as default for new users)
INSERT INTO "Company" (id, name, slug, "subscriptionStatus", "createdAt")
VALUES ('seed-company-001', 'My Company', 'my-company', 'active', NOW())
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  "subscriptionStatus" = EXCLUDED."subscriptionStatus";

-- 6. Seed employees
INSERT INTO "Employee" (id, "firstName", "lastName", position, "baseSalary", status, "startDate", "monthlyAdvanceLimit", "payDay", "companyId")
VALUES
  ('emp-001', 'Ahmed', 'Benali', 'vendeur', 60000, 'ACTIVE', '2024-01-15', 100000, 5, 'seed-company-001'),
  ('emp-002', 'Fatima', 'Zahra', 'operateur', 45000, 'ACTIVE', '2024-03-01', 80000, 10, 'seed-company-001'),
  ('emp-003', 'Karim', 'Mansouri', 'vendeur', 55000, 'ACTIVE', '2024-06-01', 90000, 5, 'seed-company-001'),
  ('emp-004', 'Lamia', 'Said', 'operateur', 40000, 'ACTIVE', '2025-01-01', 70000, 15, 'seed-company-001'),
  ('emp-005', 'Sofiane', 'Taleb', 'vendeur', 52000, 'INACTIVE', '2024-02-01', 85000, 5, 'seed-company-001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "SalaryAdvance" (id, amount, reason, date, type, status, "employeeId", "companyId")
VALUES
  ('adv-001', 10000, 'Urgent famille', NOW(), 'SALARY', 'PENDING', 'emp-001', 'seed-company-001'),
  ('adv-002', 5000, 'Médical', NOW(), 'MEDICAL', 'APPROVED', 'emp-002', 'seed-company-001'),
  ('adv-003', 8000, NULL, NOW(), 'SALARY', 'PAID', 'emp-003', 'seed-company-001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "EmployeePayroll" (id, "employeeId", "companyId", "periodMonth", "periodYear", "baseSalary", "totalAdvances", "netSalary", deductions, status)
VALUES
  ('pay-001', 'emp-001', 'seed-company-001', EXTRACT(MONTH FROM NOW()), EXTRACT(YEAR FROM NOW()), 60000, 10000, 50000, 10000, 'PENDING'),
  ('pay-002', 'emp-002', 'seed-company-001', EXTRACT(MONTH FROM NOW()), EXTRACT(YEAR FROM NOW()), 45000, 5000, 40000, 5000, 'PAID'),
  ('pay-003', 'emp-003', 'seed-company-001', EXTRACT(MONTH FROM NOW()), EXTRACT(YEAR FROM NOW()), 55000, 8000, 47000, 8000, 'PAID')
ON CONFLICT (id) DO NOTHING;

-- 7. Trigger: auto-create User record when someone signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" (id, email, name, role, "companyId")
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'ADMIN',
    'seed-company-001'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Enable Row Level Security and add policies
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Employee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SalaryAdvance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmployeePayroll" ENABLE ROW LEVEL SECURITY;

-- Helper: company ID of the current user
CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS TEXT LANGUAGE SQL STABLE AS $$
  SELECT "companyId" FROM "User" WHERE id = auth.uid()::text LIMIT 1;
$$;

-- Company
DO $$ BEGIN CREATE POLICY "company_select" ON "Company" FOR SELECT USING (id = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;

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
