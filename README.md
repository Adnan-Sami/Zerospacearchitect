# Zero Space Architect

বাংলাদেশের আর্কিটেকচার ও সিভিল ইঞ্জিনিয়ারিং বিষয়ক ই-লার্নিং প্ল্যাটফর্ম।

## Features

- **কোর্স মার্কেটপ্লেস** — ভিডিও কোর্স কেনা, মডিউল ভিত্তিক লেসন, কুইজ, সার্টিফিকেট
- **বই স্টোর** — হার্ডকপি ও PDF বই অর্ডার
- **ডিজাইন ও কনসালটেন্সি** — আর্কিটেকচারাল সার্ভিস বুকিং
- **ইন্সট্রাক্টর প্যানেল** — কোর্স আপলোড, আয় ট্র্যাকিং, কমিশন সিস্টেম (৪০%)
- **অ্যাডমিন প্যানেল** — কোর্স/বই/অর্ডার/স্টুডেন্ট ম্যানেজমেন্ট, কুপন সিস্টেম, সাইট কন্টেন্ট এডিটর
- **ম্যানুয়াল পেমেন্ট** — বিকাশ/নগদ/রকেট পেমেন্ট ভেরিফিকেশন
- **সম্পূর্ণ বাংলা ইন্টারফেস**

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Database & Auth:** Supabase (PostgreSQL + Row Level Security)
- **Deployment:** Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Add your Supabase keys to .env.local

# Run development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── admin/        # Admin panel (dashboard, courses, orders, settings)
│   ├── api/          # Server API routes
│   ├── books/        # Book store pages
│   ├── checkout/     # Payment checkout
│   ├── courses/      # Course listing & details
│   ├── instructor/   # Instructor panel
│   ├── learn/        # Course player
│   ├── services/     # Consultancy booking
│   └── support/      # Support page
├── components/       # Reusable UI components
├── content/          # CMS content registry
├── hooks/            # Custom React hooks
└── integrations/     # Supabase client config
```

## Deployment

Deploy directly to Vercel:

1. Push to GitHub
2. Import repo in Vercel
3. Add environment variables
4. Deploy

All API routes work as serverless functions on Vercel automatically.
