-- Run this SQL in Supabase Dashboard > SQL Editor > New Query
-- This creates the table for instructor self-submitted profiles

CREATE TABLE IF NOT EXISTS instructor_profile_details (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  title text DEFAULT '',
  designation text DEFAULT '',
  bio text DEFAULT '',
  image_url text DEFAULT '',
  facebook_url text,
  youtube_url text,
  phone text DEFAULT '',
  email text DEFAULT '',
  is_seen boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE instructor_profile_details ENABLE ROW LEVEL SECURITY;

-- Instructors can view and edit their own profile
CREATE POLICY "Instructors can view own profile"
  ON instructor_profile_details FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Instructors can insert own profile"
  ON instructor_profile_details FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Instructors can update own profile"
  ON instructor_profile_details FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all instructor profiles"
  ON instructor_profile_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Admins full access
CREATE POLICY "Admins full access to instructor profiles"
  ON instructor_profile_details FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
