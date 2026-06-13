ALTER TABLE public.site_settings
ADD COLUMN commission_percentage INTEGER NOT NULL DEFAULT 40;

COMMENT ON COLUMN public.site_settings.commission_percentage IS 'Instructor commission percentage (e.g. 40 = 40%)';
