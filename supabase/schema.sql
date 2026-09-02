-- ============================================================================
-- DRESS RENTAL MANAGEMENT & AVAILABILITY WEB APP — DATABASE SCHEMA
-- Safe & Idempotent SQL script (can be run multiple times safely)
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. Custom Enum Types (Wrapped in duplicate_object exception handlers)
DO $$ BEGIN
  CREATE TYPE dress_operational_status AS ENUM (
    'available',
    'reserved',
    'on_rent',
    'cleaning',
    'inspection',
    'preparing',
    'repair',
    'unavailable',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE rental_order_status AS ENUM (
    'pending',
    'confirmed',
    'reserved',
    'on_rent',
    'returned',
    'completed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE deposit_status_enum AS ENUM (
    'pending',
    'held',
    'eligible_for_return',
    'returned',
    'retained',
    'partially_retained'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE fulfillment_type_enum AS ENUM (
    'pickup',
    'delivery'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE financial_transaction_type AS ENUM (
    'income',
    'deposit_received',
    'deposit_returned',
    'deposit_retained'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. User Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'staff', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Dresses Table
CREATE TABLE IF NOT EXISTS public.dresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  default_price NUMERIC(10, 2) NOT NULL CHECK (default_price >= 0),
  default_deposit NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (default_deposit >= 0),
  main_photo_path TEXT,
  operational_status dress_operational_status NOT NULL DEFAULT 'available',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- If cost column exists from previous version, drop it safely
ALTER TABLE public.dresses DROP COLUMN IF EXISTS cost;

-- 5. Dress Photos Table
CREATE TABLE IF NOT EXISTS public.dress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dress_id UUID NOT NULL REFERENCES public.dresses(id) ON DELETE CASCADE,
  photo_path TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Customers Table (CRM with Address)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  address TEXT,
  facebook_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS address TEXT;

-- 7. Rentals / Orders Table (With Deposit Fields & Fulfillment)
CREATE TABLE IF NOT EXISTS public.rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  dress_id UUID NOT NULL REFERENCES public.dresses(id) ON DELETE RESTRICT,
  rental_start_date DATE NOT NULL,
  rental_end_date DATE NOT NULL,
  rental_price NUMERIC(10, 2) NOT NULL CHECK (rental_price >= 0),
  additional_charges NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (additional_charges >= 0),
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
  deposit_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (deposit_amount >= 0),
  deposit_status deposit_status_enum NOT NULL DEFAULT 'held',
  deposit_returned_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (deposit_returned_amount >= 0),
  deposit_retained_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (deposit_retained_amount >= 0),
  deposit_retention_reason TEXT,
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
  status rental_order_status NOT NULL DEFAULT 'pending',
  fulfillment_type fulfillment_type_enum NOT NULL DEFAULT 'pickup',
  delivery_address TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_rental_dates CHECK (rental_end_date >= rental_start_date),
  CONSTRAINT check_deposit_amounts CHECK (deposit_returned_amount + deposit_retained_amount <= deposit_amount)
);

ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS fulfillment_type fulfillment_type_enum NOT NULL DEFAULT 'pickup';
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- Safely drop old expenses table if exists
DROP TABLE IF EXISTS public.expenses CASCADE;

-- 8. Normalized Financial Transactions Audit Table
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type financial_transaction_type NOT NULL,
  category TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Dress Status History Table
CREATE TABLE IF NOT EXISTS public.dress_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dress_id UUID NOT NULL REFERENCES public.dresses(id) ON DELETE CASCADE,
  old_status dress_operational_status,
  new_status dress_operational_status NOT NULL,
  reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CONSTRAINTS & INDEXES
-- ============================================================================

ALTER TABLE public.rentals
  DROP CONSTRAINT IF EXISTS prevent_overlapping_rentals;

ALTER TABLE public.rentals
  ADD CONSTRAINT prevent_overlapping_rentals
  EXCLUDE USING gist (
    dress_id WITH =,
    daterange(rental_start_date, rental_end_date, '[]') WITH &&
  )
  WHERE (status NOT IN ('cancelled'));

CREATE INDEX IF NOT EXISTS idx_dresses_operational_status ON public.dresses(operational_status);
CREATE INDEX IF NOT EXISTS idx_rentals_dress_id ON public.rentals(dress_id);
CREATE INDEX IF NOT EXISTS idx_rentals_customer_id ON public.rentals(customer_id);
CREATE INDEX IF NOT EXISTS idx_rentals_dates ON public.rentals(rental_start_date, rental_end_date);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON public.rentals(status);
CREATE INDEX IF NOT EXISTS idx_rentals_deposit_status ON public.rentals(deposit_status);
CREATE INDEX IF NOT EXISTS idx_customers_contact_number ON public.customers(contact_number);
CREATE INDEX IF NOT EXISTS idx_fin_tx_date ON public.financial_transactions(transaction_date);

-- ============================================================================
-- AUTOMATIC TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Admin User'),
    'admin'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_dresses_modtime ON public.dresses;
CREATE TRIGGER update_dresses_modtime BEFORE UPDATE ON public.dresses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_customers_modtime ON public.customers;
CREATE TRIGGER update_customers_modtime BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_rentals_modtime ON public.rentals;
CREATE TRIGGER update_rentals_modtime BEFORE UPDATE ON public.rentals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- SECURE PUBLIC AVAILABILITY RPC FUNCTION
-- Checks operational status AND active rentals to prevent dresses on rent from showing available
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_public_dress_availability(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_color TEXT DEFAULT NULL,
  p_size TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  color TEXT,
  size TEXT,
  default_price NUMERIC,
  main_photo_path TEXT,
  operational_status dress_operational_status,
  is_available BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.name,
    d.color,
    d.size,
    d.default_price,
    d.main_photo_path,
    d.operational_status,
    CASE
      -- Explicitly unavailable status
      WHEN d.operational_status IN ('on_rent', 'reserved', 'cleaning', 'repair', 'unavailable', 'archived') THEN FALSE
      -- If specific date range supplied
      WHEN p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
        NOT EXISTS (
          SELECT 1
          FROM public.rentals r
          WHERE r.dress_id = d.id
            AND r.status NOT IN ('cancelled')
            AND daterange(r.rental_start_date, r.rental_end_date, '[]') && daterange(p_start_date, p_end_date, '[]')
        )
      -- If no dates supplied, check if dress currently has an active rental covering TODAY
      ELSE
        NOT EXISTS (
          SELECT 1
          FROM public.rentals r
          WHERE r.dress_id = d.id
            AND r.status IN ('confirmed', 'reserved', 'on_rent')
            AND CURRENT_DATE BETWEEN r.rental_start_date AND r.rental_end_date
        )
    END AS is_available
  FROM public.dresses d
  WHERE d.operational_status != 'archived'
    AND (p_search IS NULL OR d.name ILIKE '%' || p_search || '%')
    AND (p_color IS NULL OR d.color ILIKE p_color)
    AND (p_size IS NULL OR d.size ILIKE p_size)
  ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_public_dress_availability(DATE, DATE, TEXT, TEXT, TEXT) TO anon, authenticated;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dress_status_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admins profiles management" ON public.profiles FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can view dress metadata" ON public.dresses FOR SELECT USING (operational_status != 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins dresses management" ON public.dresses FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Public view dress photos" ON public.dress_photos FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins dress photos management" ON public.dress_photos FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins customers management" ON public.customers FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins rentals management" ON public.rentals FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins financial transactions management" ON public.financial_transactions FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins status history management" ON public.dress_status_history FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Storage Bucket Policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('dress-images', 'dress-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$ BEGIN
  CREATE POLICY "Public read access to dress images" ON storage.objects FOR SELECT USING (bucket_id = 'dress-images');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated admin upload dress images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'dress-images' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated admin update dress images" ON storage.objects FOR UPDATE USING (bucket_id = 'dress-images' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated admin delete dress images" ON storage.objects FOR DELETE USING (bucket_id = 'dress-images' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;
