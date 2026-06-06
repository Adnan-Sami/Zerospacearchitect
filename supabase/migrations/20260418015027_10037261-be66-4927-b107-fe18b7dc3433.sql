-- Site settings (single-row config)
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT DEFAULT '',
  site_name TEXT NOT NULL DEFAULT 'শিক্ষা',
  footer_text TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings viewable" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON public.site_settings FOR ALL USING (has_role(auth.uid(), 'admin'));
INSERT INTO public.site_settings (site_name, footer_text) VALUES ('শিক্ষা', '© ২০২৫ সকল অধিকার সংরক্ষিত');

-- Menu items
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Menu viewable" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Admins manage menu" ON public.menu_items FOR ALL USING (has_role(auth.uid(), 'admin'));
INSERT INTO public.menu_items (label, url, sort_order) VALUES
  ('হোম', '/', 0),
  ('কোর্সসমূহ', '/courses', 1);

-- Custom pages
CREATE TABLE public.custom_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published pages viewable" ON public.custom_pages FOR SELECT USING (is_published = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage pages" ON public.custom_pages FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_pages_updated BEFORE UPDATE ON public.custom_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add ban flag to profiles
ALTER TABLE public.profiles ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT false;
CREATE POLICY "Admins update any profile" ON public.profiles FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Logos storage bucket (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Logos public read" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Admins upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update logos" ON storage.objects FOR UPDATE USING (bucket_id = 'logos' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete logos" ON storage.objects FOR DELETE USING (bucket_id = 'logos' AND has_role(auth.uid(), 'admin'));