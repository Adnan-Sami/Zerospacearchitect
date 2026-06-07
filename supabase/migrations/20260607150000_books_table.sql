CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  author TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  original_price NUMERIC(10,2),
  cover_url TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT '',
  rating INT NOT NULL DEFAULT 5 CHECK (rating >= 0 AND rating <= 5),
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published books viewable"
  ON public.books FOR SELECT
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins manage books"
  ON public.books FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

GRANT SELECT ON public.books TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.books (
  title,
  slug,
  author,
  price,
  original_price,
  cover_url,
  description,
  details,
  rating,
  sort_order,
  is_published
)
VALUES
  (
    'আর্কিটেকচারাল ডিজাইন বেসিকস',
    'architectural-design-basics',
    'ইঞ্জি. রফিকুল ইসলাম',
    650,
    850,
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop',
    'আর্কিটেকচারাল ডিজাইনের মৌলিক ধারণা, স্কেচ এবং প্ল্যানিং নিয়ে বিস্তারিত গাইডবুক।',
    'এই বইটিতে আর্কিটেকচারাল ডিজাইনের বেসিক, প্রজেক্ট কনসেপ্ট, স্কেচিং, প্ল্যান রিডিং এবং প্র্যাকটিক্যাল ডিজাইন প্রসেস ধাপে ধাপে ব্যাখ্যা করা হয়েছে।',
    5,
    1,
    true
  ),
  (
    'ইন্টেরিয়র ডিজাইন গাইড',
    'interior-design-guide',
    'স্থপতি নুসরাত জাহান',
    550,
    700,
    'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=400&h=600&fit=crop',
    'আধুনিক ইন্টেরিয়র ডিজাইনের কৌশল, কালার থিওরি এবং স্পেস প্ল্যানিং।',
    'রেসিডেনশিয়াল ও কমার্শিয়াল স্পেসের জন্য লে-আউট, ফার্নিচার প্লেসমেন্ট, লাইটিং, ম্যাটেরিয়াল সিলেকশন এবং কালার কম্বিনেশন নিয়ে ব্যবহারিক দিকনির্দেশনা।',
    4,
    2,
    true
  ),
  (
    'স্ট্রাকচারাল ইঞ্জিনিয়ারিং হ্যান্ডবুক',
    'structural-engineering-handbook',
    'প্রফেসর কামরুল হাসান',
    950,
    1200,
    'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=600&fit=crop',
    'RCC, স্টিল স্ট্রাকচার এবং ফাউন্ডেশন ডিজাইন সম্পর্কিত সম্পূর্ণ রেফারেন্স।',
    'লোড ক্যালকুলেশন, RCC এলিমেন্ট, স্টিল সেকশন, ফাউন্ডেশন ডিজাইন এবং প্র্যাকটিক্যাল স্ট্রাকচারাল গাইডলাইন নিয়ে সমৃদ্ধ রেফারেন্স বুক।',
    5,
    3,
    true
  ),
  (
    'অটোক্যাড মাস্টারক্লাস',
    'autocad-masterclass',
    'ইঞ্জি. সাজ্জাদ হোসেন',
    450,
    600,
    'https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?w=400&h=600&fit=crop',
    'অটোক্যাড 2D এবং 3D ডিজাইনের সম্পূর্ণ বাংলা টিউটোরিয়াল বই।',
    'অটোক্যাডের টুল, কমান্ড, ড্রাফটিং স্ট্যান্ডার্ড এবং 2D/3D ড্রয়িং ওয়ার্কফ্লো সহজ ভাষায় শেখানো হয়েছে।',
    4,
    4,
    true
  ),
  (
    'গ্রিন বিল্ডিং ডিজাইন',
    'green-building-design',
    'স্থপতি তানভীর আহমেদ',
    750,
    NULL,
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop',
    'পরিবেশবান্ধব ও টেকসই ভবন নির্মাণের আধুনিক পদ্ধতি।',
    'সাসটেইনেবল ম্যাটেরিয়াল, এনার্জি এফিশিয়েন্সি, প্যাসিভ ডিজাইন এবং গ্রিন বিল্ডিং সার্টিফিকেশন সম্পর্কিত ধারণা।',
    5,
    5,
    true
  ),
  (
    'ল্যান্ডস্কেপ ডিজাইন প্রিন্সিপলস',
    'landscape-design-principles',
    'ইঞ্জি. মাহফুজা আক্তার',
    600,
    800,
    'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&h=600&fit=crop',
    'আউটডোর স্পেস, বাগান ও পার্ক ডিজাইনের কৌশল ও আইডিয়া।',
    'ল্যান্ডস্কেপ প্ল্যানিং, প্ল্যান্ট সিলেকশন, হার্ডস্কেপ, ওয়াটার ফিচার এবং পাবলিক স্পেস ডিজাইনের রূপরেখা।',
    4,
    6,
    true
  )
ON CONFLICT (slug) DO NOTHING;
