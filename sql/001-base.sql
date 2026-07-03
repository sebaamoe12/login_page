-- ============================================================
-- 001-base.sql — Socle commun (Company, User, auth, trigger)
-- Exécuter en premier. Idempotent.
-- ============================================================

-- 1. Enum
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'VIEWER');
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

-- 3. Indexes

-- 4. Helper function for RLS policies (used by all entity modules)
CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS TEXT LANGUAGE SQL STABLE AS $$
  SELECT "companyId" FROM "User" WHERE id = auth.uid()::text LIMIT 1;
$$;

-- 5. Trigger: auto-create User record when someone signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id TEXT;
BEGIN
  -- Use company from metadata, or create a new one
  v_company_id := COALESCE(
    NEW.raw_user_meta_data->>'companyId',
    'company-' || replace(gen_random_uuid()::text, '-', '')
  );

  INSERT INTO public."Company" (id, name, slug, "createdAt")
  VALUES (v_company_id, 'My Company', 'company-' || NEW.id, NOW())
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public."User" (id, email, name, role, "companyId")
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'ADMIN',
    v_company_id
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Row Level Security
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Company policies
DO $$ BEGIN CREATE POLICY "company_select" ON "Company" FOR SELECT USING (id = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- User policies
DO $$ BEGIN CREATE POLICY "user_select" ON "User" FOR SELECT USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "user_insert" ON "User" FOR INSERT WITH CHECK ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "user_update" ON "User" FOR UPDATE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "user_delete" ON "User" FOR DELETE USING ("companyId" = user_company_id()); EXCEPTION WHEN duplicate_object THEN null; END $$;
