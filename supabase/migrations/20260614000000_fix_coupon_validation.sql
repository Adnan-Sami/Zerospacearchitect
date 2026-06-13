-- Fix: instructor-scoped coupon validation
-- 1. Add coupon_code columns to orders / book_orders so they can be stored and
--    counted for per-user limits.
-- 2. Grant regular users SELECT on instructor_courses so the client-side admin
--    portal can still read the table.  (The core validation itself now runs
--    server-side via /api/validate-coupon using supabaseAdmin, so this is a
--    belt-and-suspenders fix.)

-- ── orders ────────────────────────────────────────────────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code text;

-- ── book_orders ───────────────────────────────────────────────────────────────
-- Create the table if it was never migrated (it may have been made in Supabase UI)
CREATE TABLE IF NOT EXISTS public.book_orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id          uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  full_name        text NOT NULL DEFAULT '',
  phone            text NOT NULL DEFAULT '',
  email            text DEFAULT '',
  address          text DEFAULT '',
  order_note       text,
  invoice_number   text,
  amount           numeric(10,2) NOT NULL DEFAULT 0,
  payment_method   text NOT NULL DEFAULT 'bkash',
  transaction_id   text DEFAULT '',
  coupon_code      text,
  status           text NOT NULL DEFAULT 'pending',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- If the table already existed, just add the coupon_code column
ALTER TABLE public.book_orders
  ADD COLUMN IF NOT EXISTS coupon_code text;

-- Enable RLS on book_orders (idempotent)
ALTER TABLE public.book_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users create book orders"  ON public.book_orders;
DROP POLICY IF EXISTS "Users view own book orders" ON public.book_orders;
DROP POLICY IF EXISTS "Admins manage book orders"  ON public.book_orders;

CREATE POLICY "Users create book orders"
  ON public.book_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own book orders"
  ON public.book_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage book orders"
  ON public.book_orders FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

GRANT SELECT, INSERT, UPDATE ON public.book_orders TO authenticated;
GRANT ALL ON public.book_orders TO service_role;

-- ── instructor_courses: allow all authenticated users to SELECT ───────────────
-- The table was likely created via the Supabase UI; its RLS status is unknown.
-- We ensure RLS is on and add a permissive SELECT policy so that:
--   • admin portal reads work for non-admin instructor accounts
--   • future client-side reads (if any) succeed for all logged-in users
ALTER TABLE public.instructor_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Instructor courses viewable by authenticated" ON public.instructor_courses;
CREATE POLICY "Instructor courses viewable by authenticated"
  ON public.instructor_courses FOR SELECT
  TO authenticated
  USING (true);
