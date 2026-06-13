-- Add image_url field to support_replies table
ALTER TABLE public.support_replies 
ADD COLUMN IF NOT EXISTS image_url text DEFAULT '';
