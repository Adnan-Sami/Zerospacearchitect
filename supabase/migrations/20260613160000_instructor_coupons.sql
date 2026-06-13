-- Instructor-scoped coupons with approval workflow

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'fixed',
  discount_value numeric NOT NULL,
  max_uses integer,
  per_user_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'global';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS instructor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS applies_to_courses boolean NOT NULL DEFAULT true;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS applies_to_books boolean NOT NULL DEFAULT true;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS all_courses boolean NOT NULL DEFAULT true;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS all_books boolean NOT NULL DEFAULT true;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.coupons
SET
  scope = COALESCE(scope, 'global'),
  approval_status = COALESCE(approval_status, 'approved'),
  applies_to_courses = COALESCE(applies_to_courses, true),
  applies_to_books = COALESCE(applies_to_books, true),
  all_courses = COALESCE(all_courses, true),
  all_books = COALESCE(all_books, true)
WHERE true;

CREATE TABLE IF NOT EXISTS public.coupon_allowed_courses (
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  PRIMARY KEY (coupon_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.coupon_allowed_books (
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  PRIMARY KEY (coupon_id, book_id)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_allowed_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_allowed_books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active approved coupons viewable" ON public.coupons;
CREATE POLICY "Active approved coupons viewable"
  ON public.coupons FOR SELECT
  USING (
    (is_active = true AND approval_status = 'approved')
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (instructor_id = auth.uid())
    OR (created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Admins manage coupons" ON public.coupons;
CREATE POLICY "Admins manage coupons"
  ON public.coupons FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Instructors manage own coupons" ON public.coupons;
CREATE POLICY "Instructors manage own coupons"
  ON public.coupons FOR ALL
  USING (instructor_id = auth.uid() AND scope = 'instructor')
  WITH CHECK (instructor_id = auth.uid() AND scope = 'instructor');

DROP POLICY IF EXISTS "Coupon courses viewable" ON public.coupon_allowed_courses;
CREATE POLICY "Coupon courses viewable"
  ON public.coupon_allowed_courses FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage coupon courses" ON public.coupon_allowed_courses;
CREATE POLICY "Admins manage coupon courses"
  ON public.coupon_allowed_courses FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Instructors manage own coupon courses" ON public.coupon_allowed_courses;
CREATE POLICY "Instructors manage own coupon courses"
  ON public.coupon_allowed_courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.coupons c
      WHERE c.id = coupon_id AND c.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.coupons c
      WHERE c.id = coupon_id AND c.instructor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coupon books viewable" ON public.coupon_allowed_books;
CREATE POLICY "Coupon books viewable"
  ON public.coupon_allowed_books FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage coupon books" ON public.coupon_allowed_books;
CREATE POLICY "Admins manage coupon books"
  ON public.coupon_allowed_books FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Instructors manage own coupon books" ON public.coupon_allowed_books;
CREATE POLICY "Instructors manage own coupon books"
  ON public.coupon_allowed_books FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.coupons c
      WHERE c.id = coupon_id AND c.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.coupons c
      WHERE c.id = coupon_id AND c.instructor_id = auth.uid()
    )
  );

GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT SELECT ON public.coupon_allowed_courses TO anon, authenticated;
GRANT SELECT ON public.coupon_allowed_books TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coupon_allowed_courses TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coupon_allowed_books TO authenticated;
GRANT ALL ON public.coupons TO service_role;
GRANT ALL ON public.coupon_allowed_courses TO service_role;
GRANT ALL ON public.coupon_allowed_books TO service_role;
