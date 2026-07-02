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
  password TEXT,
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
  "appliedInPayrollId" TEXT,
  "appliedInEmployeePayrollId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "PayrollRun" (
  id TEXT PRIMARY KEY,
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  "periodMonth" INTEGER NOT NULL,
  "periodYear" INTEGER NOT NULL,
  status "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
  "totalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "processedBy" TEXT REFERENCES "User"(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "PayrollRecord" (
  id TEXT PRIMARY KEY,
  "payrollRunId" TEXT NOT NULL REFERENCES "PayrollRun"(id),
  "employeeId" TEXT NOT NULL REFERENCES "Employee"(id),
  "baseSalary" DECIMAL(10,2) NOT NULL,
  "totalAdvances" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "netSalary" DECIMAL(10,2) NOT NULL,
  deductions DECIMAL(10,2) NOT NULL DEFAULT 0,
  status "PayrollRecordStatus" NOT NULL DEFAULT 'PENDING',
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
  "paidById" TEXT REFERENCES "User"(id),
  "paidAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- 4. Circular foreign keys for SalaryAdvance
DO $$ BEGIN
  ALTER TABLE "SalaryAdvance" ADD CONSTRAINT "SalaryAdvance_appliedInPayrollId_fkey"
    FOREIGN KEY ("appliedInPayrollId") REFERENCES "PayrollRun"(id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

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

-- 6. Trigger: auto-create User record when someone signs up via Supabase Auth
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

-- 7. Enable Row Level Security and add policies
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Employee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SalaryAdvance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PayrollRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PayrollRecord" ENABLE ROW LEVEL SECURITY;
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

-- PayrollRun
DO $$ BEGIN CREATE POLICY "payrollrun_select" ON "PayrollRun" FOR SELECT USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- EmployeePayroll
DO $$ BEGIN CREATE POLICY "employeepayroll_select" ON "EmployeePayroll" FOR SELECT USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "employeepayroll_insert" ON "EmployeePayroll" FOR INSERT WITH CHECK ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "employeepayroll_update" ON "EmployeePayroll" FOR UPDATE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
