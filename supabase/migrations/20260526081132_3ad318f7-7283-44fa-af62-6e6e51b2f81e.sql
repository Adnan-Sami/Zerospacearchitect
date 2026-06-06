ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS lesson_type text NOT NULL DEFAULT 'lesson';