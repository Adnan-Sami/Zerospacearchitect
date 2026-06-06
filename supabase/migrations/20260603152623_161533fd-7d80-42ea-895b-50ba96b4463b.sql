
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS certificate_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS certificate_title TEXT DEFAULT 'কোর্স সমাপ্তি সার্টিফিকেট',
  ADD COLUMN IF NOT EXISTS certificate_body TEXT DEFAULT 'সফলভাবে নিম্নলিখিত কোর্সটি সম্পন্ন করার জন্য:',
  ADD COLUMN IF NOT EXISTS certificate_signature TEXT DEFAULT '';
