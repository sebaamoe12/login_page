-- ============================================================
-- 003-pourelle.sql — Module Magasin de chaussures (Pourelle)
-- Exécuter après 001-base.sql. Idempotent.
-- ============================================================

-- 1. Tables
CREATE TABLE IF NOT EXISTS "PourelleSupplier" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'LOCAL',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "PourelleProduct" (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Autres',
  brand TEXT NOT NULL DEFAULT '',
  "purchasePrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "sellingPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  "supplierId" TEXT REFERENCES "PourelleSupplier"(id),
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "PourelleSale" (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'IN_STORE',
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "clientName" TEXT NOT NULL DEFAULT '',
  "clientPhone" TEXT NOT NULL DEFAULT '',
  "deliveryAddress" TEXT NOT NULL DEFAULT '',
  tracking TEXT NOT NULL DEFAULT '',
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "PourelleSaleItem" (
  id TEXT PRIMARY KEY,
  "saleId" TEXT NOT NULL REFERENCES "PourelleSale"(id),
  "productId" TEXT NOT NULL REFERENCES "PourelleProduct"(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "companyId" TEXT NOT NULL REFERENCES "Company"(id)
);

-- 2. Row Level Security
ALTER TABLE "PourelleSupplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PourelleProduct" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PourelleSale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PourelleSaleItem" ENABLE ROW LEVEL SECURITY;

-- PourelleSupplier
DO $$ BEGIN CREATE POLICY "pourellesupplier_select" ON "PourelleSupplier" FOR SELECT USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "pourellesupplier_insert" ON "PourelleSupplier" FOR INSERT WITH CHECK ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "pourellesupplier_update" ON "PourelleSupplier" FOR UPDATE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "pourellesupplier_delete" ON "PourelleSupplier" FOR DELETE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- PourelleProduct
DO $$ BEGIN CREATE POLICY "pourelleproduct_select" ON "PourelleProduct" FOR SELECT USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "pourelleproduct_insert" ON "PourelleProduct" FOR INSERT WITH CHECK ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "pourelleproduct_update" ON "PourelleProduct" FOR UPDATE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "pourelleproduct_delete" ON "PourelleProduct" FOR DELETE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- PourelleSale
DO $$ BEGIN CREATE POLICY "pourellesale_select" ON "PourelleSale" FOR SELECT USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "pourellesale_insert" ON "PourelleSale" FOR INSERT WITH CHECK ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "pourellesale_update" ON "PourelleSale" FOR UPDATE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "pourellesale_delete" ON "PourelleSale" FOR DELETE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- PourelleSaleItem
DO $$ BEGIN CREATE POLICY "pourellesaleitem_select" ON "PourelleSaleItem" FOR SELECT USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "pourellesaleitem_insert" ON "PourelleSaleItem" FOR INSERT WITH CHECK ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "pourellesaleitem_update" ON "PourelleSaleItem" FOR UPDATE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "pourellesaleitem_delete" ON "PourelleSaleItem" FOR DELETE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
