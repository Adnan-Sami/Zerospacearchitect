-- Create public bucket for course thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-thumbnails', 'course-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Course thumbnails are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-thumbnails');

-- Admins can upload
CREATE POLICY "Admins can upload course thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'course-thumbnails' AND public.has_role(auth.uid(), 'admin'));

-- Admins can update
CREATE POLICY "Admins can update course thumbnails"
ON storage.objects FOR UPDATE
USING (bucket_id = 'course-thumbnails' AND public.has_role(auth.uid(), 'admin'));

-- Admins can delete
CREATE POLICY "Admins can delete course thumbnails"
ON storage.objects FOR DELETE
USING (bucket_id = 'course-thumbnails' AND public.has_role(auth.uid(), 'admin'));