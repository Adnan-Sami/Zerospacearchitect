-- Run this SQL in Supabase Dashboard > SQL Editor > New Query

-- 1. Create the public_instructors table
CREATE TABLE IF NOT EXISTS public_instructors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  title text DEFAULT '',
  designation text DEFAULT '',
  bio text DEFAULT '',
  image_url text DEFAULT '',
  facebook_url text,
  youtube_url text,
  total_courses integer DEFAULT 0,
  total_students integer DEFAULT 0,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public_instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active instructors"
  ON public_instructors FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins full access to instructors"
  ON public_instructors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- 2. Create the instructor_assigned_courses junction table
CREATE TABLE IF NOT EXISTS instructor_assigned_courses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id uuid NOT NULL REFERENCES public_instructors(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(instructor_id, course_id)
);

ALTER TABLE instructor_assigned_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view assigned courses"
  ON instructor_assigned_courses FOR SELECT
  USING (true);

CREATE POLICY "Admins full access to assigned courses"
  ON instructor_assigned_courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
