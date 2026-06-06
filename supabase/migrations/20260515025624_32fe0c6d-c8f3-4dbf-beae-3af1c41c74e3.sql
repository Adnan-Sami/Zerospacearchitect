ALTER TABLE public.courses 
  ADD COLUMN IF NOT EXISTS original_price numeric,
  ADD COLUMN IF NOT EXISTS duration_text text,
  ADD COLUMN IF NOT EXISTS enrollment_count integer DEFAULT 0;