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

CREATE TABLE IF NOT EXISTS "FabrexDriver" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  vehicle TEXT NOT NULL DEFAULT '',
  matricule TEXT NOT NULL DEFAULT '',
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

DO $$ BEGIN
  ALTER TABLE "FabrexSaleItem" ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT NULL;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "FabrexSale" ADD COLUMN IF NOT EXISTS "moyen_livraison" JSONB DEFAULT NULL;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "FabrexSaleItem" ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT NULL;
EXCEPTION WHEN others THEN null;
END $$;


