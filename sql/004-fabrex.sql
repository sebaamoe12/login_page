-- ============================================================
-- 004-fabrex.sql — Module Fabrex (Injection Plastique)
-- Production tracking: raw materials, finished products,
-- machines, production orders, sales, expenses.
-- Exécuter après 001-base.sql. Idempotent.
-- ============================================================

-- 1. Enums
DO $$ BEGIN
  CREATE TYPE "FabrexMachineStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "FabrexProductionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "FabrexSaleStatus" AS ENUM ('COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Tables
CREATE TABLE IF NOT EXISTS "FabrexSupplier" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'LOCAL',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "FabrexRawMaterial" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  "purchasePrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "supplierId" TEXT REFERENCES "FabrexSupplier"(id),
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "FabrexProduct" (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Autres',
  "sellingPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "FabrexClient" (
  id TEXT PRIMARY KEY,
  "companyName" TEXT NOT NULL,
  "companyActivity" TEXT NOT NULL DEFAULT '',
  "RC" TEXT NOT NULL DEFAULT '',
  "NIF" TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  fax TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  banque TEXT NOT NULL DEFAULT '',
  "numCompteBancaire" TEXT NOT NULL DEFAULT '',
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "FabrexMachine" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT '',
  status "FabrexMachineStatus" NOT NULL DEFAULT 'ACTIVE',
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "FabrexProductionOrder" (
  id TEXT PRIMARY KEY,
  "productId" TEXT NOT NULL REFERENCES "FabrexProduct"(id),
  "machineId" TEXT REFERENCES "FabrexMachine"(id),
  "operatorName" TEXT NOT NULL DEFAULT '',
  "plannedQuantity" INTEGER NOT NULL DEFAULT 0,
  "completedQuantity" INTEGER NOT NULL DEFAULT 0,
  "wasteQuantity" INTEGER NOT NULL DEFAULT 0,
  "startDate" TIMESTAMPTZ,
  "endDate" TIMESTAMPTZ,
  status "FabrexProductionStatus" NOT NULL DEFAULT 'PLANNED',
  notes TEXT NOT NULL DEFAULT '',
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "FabrexProdOrderMaterial" (
  id TEXT PRIMARY KEY,
  "productionOrderId" TEXT NOT NULL REFERENCES "FabrexProductionOrder"(id),
  "rawMaterialId" TEXT NOT NULL REFERENCES "FabrexRawMaterial"(id),
  "quantityUsed" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "companyId" TEXT NOT NULL REFERENCES "Company"(id)
);

CREATE TABLE IF NOT EXISTS "FabrexSale" (
  id TEXT PRIMARY KEY,
  "clientId" TEXT REFERENCES "FabrexClient"(id),
  "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  status "FabrexSaleStatus" NOT NULL DEFAULT 'COMPLETED',
  "invoiceNumber" TEXT NOT NULL DEFAULT '',
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "FabrexSaleItem" (
  id TEXT PRIMARY KEY,
  "saleId" TEXT NOT NULL REFERENCES "FabrexSale"(id),
  "productId" TEXT NOT NULL REFERENCES "FabrexProduct"(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "companyId" TEXT NOT NULL REFERENCES "Company"(id)
);

CREATE TABLE IF NOT EXISTS "FabrexExpense" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Migrations for existing databases
DO $$ BEGIN
  ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT '';
  ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';
  ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "RC" TEXT NOT NULL DEFAULT '';
  ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "NIF" TEXT NOT NULL DEFAULT '';
  ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "FabrexClient" RENAME COLUMN name TO "companyName";
EXCEPTION WHEN undefined_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "FabrexClient" ADD COLUMN IF NOT EXISTS "companyActivity" TEXT NOT NULL DEFAULT '';
  ALTER TABLE "FabrexClient" ADD COLUMN IF NOT EXISTS "RC" TEXT NOT NULL DEFAULT '';
  ALTER TABLE "FabrexClient" ADD COLUMN IF NOT EXISTS "NIF" TEXT NOT NULL DEFAULT '';
  ALTER TABLE "FabrexClient" ADD COLUMN IF NOT EXISTS fax TEXT NOT NULL DEFAULT '';
  ALTER TABLE "FabrexClient" ADD COLUMN IF NOT EXISTS banque TEXT NOT NULL DEFAULT '';
  ALTER TABLE "FabrexClient" ADD COLUMN IF NOT EXISTS "numCompteBancaire" TEXT NOT NULL DEFAULT '';
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "FabrexSale" ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT NOT NULL DEFAULT '';
EXCEPTION WHEN others THEN null;
END $$;

-- 4. Row Level Security
ALTER TABLE "FabrexSupplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FabrexRawMaterial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FabrexProduct" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FabrexClient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FabrexMachine" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FabrexProductionOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FabrexProdOrderMaterial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FabrexSale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FabrexSaleItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FabrexExpense" ENABLE ROW LEVEL SECURITY;

-- FabrexSupplier
DO $$ BEGIN CREATE POLICY "fabrexsupplier_select" ON "FabrexSupplier" FOR SELECT USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexsupplier_insert" ON "FabrexSupplier" FOR INSERT WITH CHECK ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexsupplier_update" ON "FabrexSupplier" FOR UPDATE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexsupplier_delete" ON "FabrexSupplier" FOR DELETE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- FabrexRawMaterial
DO $$ BEGIN CREATE POLICY "fabrexrawmaterial_select" ON "FabrexRawMaterial" FOR SELECT USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexrawmaterial_insert" ON "FabrexRawMaterial" FOR INSERT WITH CHECK ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexrawmaterial_update" ON "FabrexRawMaterial" FOR UPDATE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexrawmaterial_delete" ON "FabrexRawMaterial" FOR DELETE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- FabrexProduct
DO $$ BEGIN CREATE POLICY "fabrexproduct_select" ON "FabrexProduct" FOR SELECT USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexproduct_insert" ON "FabrexProduct" FOR INSERT WITH CHECK ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexproduct_update" ON "FabrexProduct" FOR UPDATE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexproduct_delete" ON "FabrexProduct" FOR DELETE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- FabrexClient
DO $$ BEGIN CREATE POLICY "fabrexclient_select" ON "FabrexClient" FOR SELECT USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexclient_insert" ON "FabrexClient" FOR INSERT WITH CHECK ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexclient_update" ON "FabrexClient" FOR UPDATE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexclient_delete" ON "FabrexClient" FOR DELETE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- FabrexMachine
DO $$ BEGIN CREATE POLICY "fabrexmachine_select" ON "FabrexMachine" FOR SELECT USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexmachine_insert" ON "FabrexMachine" FOR INSERT WITH CHECK ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexmachine_update" ON "FabrexMachine" FOR UPDATE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexmachine_delete" ON "FabrexMachine" FOR DELETE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- FabrexProductionOrder
DO $$ BEGIN CREATE POLICY "fabrexproductionorder_select" ON "FabrexProductionOrder" FOR SELECT USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexproductionorder_insert" ON "FabrexProductionOrder" FOR INSERT WITH CHECK ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexproductionorder_update" ON "FabrexProductionOrder" FOR UPDATE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexproductionorder_delete" ON "FabrexProductionOrder" FOR DELETE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- FabrexProdOrderMaterial
DO $$ BEGIN CREATE POLICY "fabrexprodordermaterial_select" ON "FabrexProdOrderMaterial" FOR SELECT USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexprodordermaterial_insert" ON "FabrexProdOrderMaterial" FOR INSERT WITH CHECK ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexprodordermaterial_update" ON "FabrexProdOrderMaterial" FOR UPDATE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexprodordermaterial_delete" ON "FabrexProduct" FOR DELETE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- FabrexSale
DO $$ BEGIN CREATE POLICY "fabrexsale_select" ON "FabrexSale" FOR SELECT USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexsale_insert" ON "FabrexSale" FOR INSERT WITH CHECK ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexsale_update" ON "FabrexSale" FOR UPDATE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexsale_delete" ON "FabrexSale" FOR DELETE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- FabrexSaleItem
DO $$ BEGIN CREATE POLICY "fabrexsaleitem_select" ON "FabrexSaleItem" FOR SELECT USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexsaleitem_insert" ON "FabrexSaleItem" FOR INSERT WITH CHECK ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexsaleitem_update" ON "FabrexSaleItem" FOR UPDATE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexsaleitem_delete" ON "FabrexSaleItem" FOR DELETE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- FabrexExpense
DO $$ BEGIN CREATE POLICY "fabrexexpense_select" ON "FabrexExpense" FOR SELECT USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexexpense_insert" ON "FabrexExpense" FOR INSERT WITH CHECK ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexexpense_update" ON "FabrexExpense" FOR UPDATE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "fabrexexpense_delete" ON "FabrexExpense" FOR DELETE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
