// Central registry of all admin-editable site content.
// Adding a key here will make it appear in /admin/content automatically.

export type ContentItem = {
  key: string;
  label: string;
  defaultValue: string;
  type?: "text" | "longtext" | "image";
  page: string;
};

export const CONTENT_REGISTRY: ContentItem[] = [
  // ============= HOME PAGE =============
  { page: "হোম", key: "home.hero.title", label: "হিরো শিরোনাম", defaultValue: "দক্ষতার বিকল্প নেই!" },
  { page: "হোম", key: "home.hero.subtitle", label: "হিরো সাবটাইটেল", defaultValue: "দক্ষতা অর্জন করুন, নিজের ক্যারিয়ার গড়ুন", type: "longtext" },
  { page: "হোম", key: "home.hero.cta", label: "হিরো বাটন টেক্সট", defaultValue: "বান্ডেল সিডিল কোর্স" },
  { page: "হোম", key: "home.hero.image", label: "হিরো ছবি", defaultValue: "", type: "image" },
  { page: "হোম", key: "home.hero.image_overlay", label: "হিরো ছবির উপরের টেক্সট", defaultValue: "শিখুন ইন্ডাস্ট্রি\nএক্সপার্টদের সাথে", type: "longtext" },

  { page: "হোম", key: "home.latest.title", label: "সর্বশেষ কোর্স সেকশন শিরোনাম", defaultValue: "সর্বশেষ কোর্স সমূহ" },
  { page: "হোম", key: "home.latest.subtitle", label: "সর্বশেষ কোর্স সেকশন সাবটাইটেল", defaultValue: "Zero Space Architect এ সর্বশেষ প্রকাশিত কোর্সগুলো থেকে পছন্দের কোর্সটি কিনুন", type: "longtext" },

  { page: "হোম", key: "home.bestseller.title", label: "সর্বাধিক বিক্রি সেকশন শিরোনাম", defaultValue: "সর্বাধিক বিক্রি হওয়া কোর্স সমূহ" },
  { page: "হোম", key: "home.bestseller.subtitle", label: "সর্বাধিক বিক্রি সেকশন সাবটাইটেল", defaultValue: "সকলের জন্য প্রয়োজনীয় কোর্সগুলো থেকে পছন্দের কোর্সটি এনরোল করুন", type: "longtext" },

  { page: "হোম", key: "home.stats.1.value", label: "স্ট্যাট ১: সংখ্যা", defaultValue: "18,022+" },
  { page: "হোম", key: "home.stats.1.label", label: "স্ট্যাট ১: লেবেল", defaultValue: "নিবন্ধিত শিক্ষার্থী" },
  { page: "হোম", key: "home.stats.2.value", label: "স্ট্যাট ২: সংখ্যা", defaultValue: "115,889+" },
  { page: "হোম", key: "home.stats.2.label", label: "স্ট্যাট ২: লেবেল", defaultValue: "মোট ভিজিটর" },
  { page: "হোম", key: "home.stats.3.value", label: "স্ট্যাট ৩: সংখ্যা", defaultValue: "16+" },
  { page: "হোম", key: "home.stats.3.label", label: "স্ট্যাট ৩: লেবেল", defaultValue: "নিবন্ধিত শিক্ষক" },

  { page: "হোম", key: "home.why.title", label: "কেন সেরা শিরোনাম", defaultValue: "আমরা কেনো সেরা?" },
  { page: "হোম", key: "home.why.subtitle", label: "কেন সেরা সাবটাইটেল", defaultValue: "শত শত প্রতিষ্ঠানের ভিড়ে Zero Space Architect অন্যদের থেকে আলাদা হওয়ার কারণ", type: "longtext" },
  { page: "হোম", key: "home.why.1.title", label: "ফিচার ১: শিরোনাম", defaultValue: "যেকোনো সময়ে শিখুন" },
  { page: "হোম", key: "home.why.1.desc", label: "ফিচার ১: বর্ণনা", defaultValue: "দিন রাত ২৪ ঘন্টার মধ্যে আপনার সুবিধামত সময়ে কোর্সগুলো দেখতে পারবেন", type: "longtext" },
  { page: "হোম", key: "home.why.2.title", label: "ফিচার ২: শিরোনাম", defaultValue: "যেকোনো জায়গা থেকে শিখুন" },
  { page: "হোম", key: "home.why.2.desc", label: "ফিচার ২: বর্ণনা", defaultValue: "বাংলাদেশ কিংবা অন্যদেশ থেকে আপনার মোবাইল, কম্পিউটার বা ট্যাব দিয়ে কোর্সগুলো দেখতে পারবেন।", type: "longtext" },
  { page: "হোম", key: "home.why.3.title", label: "ফিচার ৩: শিরোনাম", defaultValue: "এক্সপার্ট ট্রেইনার" },
  { page: "হোম", key: "home.why.3.desc", label: "ফিচার ৩: বর্ণনা", defaultValue: "প্রতিটি বিষয়ের উপরে এক্সপার্ট ট্রেইনার দিয়ে ক্লাস পরিচালনা করা হয়।", type: "longtext" },

  { page: "হোম", key: "home.call.title", label: "কল CTA শিরোনাম", defaultValue: "কোর্স সম্পর্কিত যেকোন তথ্যের জন্য কল করুন" },
  { page: "হোম", key: "home.call.subtitle", label: "কল CTA সাবটাইটেল", defaultValue: "সকাল ০৯ টা থেকে রাত ১০ টা" },
  { page: "হোম", key: "home.call.phone", label: "কল CTA ফোন নম্বর", defaultValue: "+8801521-113539" },

  { page: "হোম", key: "home.instructor.title", label: "ইন্সট্রাকটর CTA শিরোনাম", defaultValue: "স্কিলকে সকলের মাঝে ছড়িয়ে দিয়ে অধিক ইনকামের সুযোগ", type: "longtext" },
  { page: "হোম", key: "home.instructor.subtitle", label: "ইন্সট্রাকটর CTA সাবটাইটেল", defaultValue: "Zero Space Architect এ ইন্সট্রাকটর হিসাবে যোগ দিন" },
  { page: "হোম", key: "home.instructor.cta", label: "ইন্সট্রাকটর CTA বাটন", defaultValue: "বিস্তারিত জানুন" },
  { page: "হোম", key: "home.instructor.image", label: "ইন্সট্রাকটর CTA ছবি", defaultValue: "", type: "image" },

  { page: "হোম", key: "home.newsletter.title", label: "নিউজলেটার শিরোনাম", defaultValue: "নতুন কোর্স এবং বিভিন্ন অফার জানতে ইমেইল টি দিন" },
  { page: "হোম", key: "home.newsletter.placeholder", label: "নিউজলেটার প্লেসহোল্ডার", defaultValue: "আপনার ই-মেইলটি লিখুন" },
  { page: "হোম", key: "home.newsletter.cta", label: "নিউজলেটার বাটন", defaultValue: "Subscribe" },

  { page: "হোম", key: "home.testimonials.title", label: "টেস্টিমোনিয়াল শিরোনাম", defaultValue: "আমাদের শিক্ষার্থীরা যা বলছেন" },

  // ============= COURSES PAGE =============
  { page: "কোর্স", key: "courses.title", label: "পেজ শিরোনাম", defaultValue: "সব কোর্স" },
  { page: "কোর্স", key: "courses.search.placeholder", label: "সার্চ প্লেসহোল্ডার", defaultValue: "কোর্স খুঁজুন..." },
  { page: "কোর্স", key: "courses.all", label: "সব ক্যাটাগরি বাটন", defaultValue: "সব" },
  { page: "কোর্স", key: "courses.empty", label: "কোর্স নেই মেসেজ", defaultValue: "কোনো কোর্স পাওয়া যায়নি।" },

  // ============= BOOKS PAGE =============
  { page: "বই", key: "books.hero.title", label: "হিরো শিরোনাম", defaultValue: "আমাদের বইসমূহ" },
  { page: "বই", key: "books.hero.subtitle", label: "হিরো সাবটাইটেল", defaultValue: "আর্কিটেকচার, ডিজাইন ও কনস্ট্রাকশন বিষয়ক সেরা বইসমূহ এখন অনলাইনে অর্ডার করুন। ক্যাশ অন ডেলিভারি সুবিধা আছে।", type: "longtext" },
  { page: "বই", key: "books.order.cta", label: "কিনুন বাটন", defaultValue: "কিনুন" },
  { page: "বই", key: "books.order.title", label: "অর্ডার ডায়লগ শিরোনাম", defaultValue: "বই অর্ডার করুন" },
  { page: "বই", key: "books.order.submit", label: "অর্ডার বাটন", defaultValue: "অর্ডার নিশ্চিত করুন" },

  // ============= SERVICES PAGE =============
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.hero.title", label: "হিরো শিরোনাম", defaultValue: "ডিজাইন অ্যান্ড কনসালটেন্ট সেবা সমূহ" },
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.hero.subtitle", label: "হিরো সাবটাইটেল", defaultValue: "আপনার স্বপ্নের প্রজেক্টকে বাস্তবে রূপ দিতে ZeroSpace Architect-এর অভিজ্ঞ টিম পেশাদার ডিজাইন ও কনসালটেন্সি সেবা প্রদান করে।", type: "longtext" },
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.list.title", label: "সেবা সমূহ শিরোনাম", defaultValue: "আমাদের সেবা সমূহ" },
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.1.title", label: "সেবা ১ শিরোনাম", defaultValue: "আর্কিটেকচারাল ডিজাইন" },
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.1.desc", label: "সেবা ১ বর্ণনা", defaultValue: "আবাসিক, বাণিজ্যিক ও ইন্ডাস্ট্রিয়াল ভবনের সম্পূর্ণ ডিজাইন।", type: "longtext" },
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.2.title", label: "সেবা ২ শিরোনাম", defaultValue: "ইন্টেরিয়র ডিজাইন" },
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.2.desc", label: "সেবা ২ বর্ণনা", defaultValue: "আধুনিক ও কার্যকরী ইন্টেরিয়র সলিউশন।", type: "longtext" },
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.3.title", label: "সেবা ৩ শিরোনাম", defaultValue: "স্ট্রাকচারাল কনসালটেন্সি" },
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.3.desc", label: "সেবা ৩ বর্ণনা", defaultValue: "নিরাপদ ও টেকসই স্ট্রাকচারাল ডিজাইন ও অ্যানালাইসিস।", type: "longtext" },
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.4.title", label: "সেবা ৪ শিরোনাম", defaultValue: "সাইট প্ল্যানিং" },
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.4.desc", label: "সেবা ৪ বর্ণনা", defaultValue: "প্রজেক্টের জন্য পরিকল্পিত সাইট লেআউট ও মাস্টারপ্ল্যান।", type: "longtext" },
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.5.title", label: "সেবা ৫ শিরোনাম", defaultValue: "ল্যান্ডস্কেপ ডিজাইন" },
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.5.desc", label: "সেবা ৫ বর্ণনা", defaultValue: "সবুজ ও সৌন্দর্যমণ্ডিত আউটডোর স্পেস ডিজাইন।", type: "longtext" },
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.6.title", label: "সেবা ৬ শিরোনাম", defaultValue: "কনস্ট্রাকশন সুপারভিশন" },
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.6.desc", label: "সেবা ৬ বর্ণনা", defaultValue: "নির্মাণ কাজের পেশাদার তত্ত্বাবধান ও মান নিয়ন্ত্রণ।", type: "longtext" },
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.why.title", label: "কেন আমাদের শিরোনাম", defaultValue: "কেন আমাদের বেছে নিবেন?" },
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.why.1", label: "কেন আমাদের ১", defaultValue: "১৫+ বছরের অভিজ্ঞতা" },
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.why.2", label: "কেন আমাদের ২", defaultValue: "লাইসেন্সপ্রাপ্ত পেশাদার টিম" },
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.why.3", label: "কেন আমাদের ৩", defaultValue: "সাশ্রয়ী মূল্য" },
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.why.4", label: "কেন আমাদের ৪", defaultValue: "সময়মত ডেলিভারি" },
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.form.title", label: "ফর্ম শিরোনাম", defaultValue: "সেবার জন্য রেজিস্ট্রেশন করুন" },
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.form.subtitle", label: "ফর্ম সাবটাইটেল", defaultValue: "ফর্মটি পূরণ করুন, আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।", type: "longtext" },
  { page: "ডিজাইন ও কনসালটেন্সি", key: "services.form.submit", label: "ফর্ম বাটন", defaultValue: "রেজিস্ট্রেশন করুন" },

  // ============= SUPPORT PAGE =============
  { page: "সাপোর্ট", key: "support.hero.title", label: "হিরো শিরোনাম", defaultValue: "যেকোনো প্রয়োজনে ZeroSpace এর সাথে যোগাযোগ" },
  { page: "সাপোর্ট", key: "support.phone.title", label: "ফোন কার্ড শিরোনাম", defaultValue: "ফোনের মাধ্যমে যোগাযোগ করুন" },
  { page: "সাপোর্ট", key: "support.phone.number", label: "ফোন নম্বর", defaultValue: "01521-113539" },
  { page: "সাপোর্ট", key: "support.email.title", label: "ইমেইল কার্ড শিরোনাম", defaultValue: "ই-মেইলের মাধ্যমে যোগাযোগ করুন" },
  { page: "সাপোর্ট", key: "support.email.1", label: "ইমেইল ১", defaultValue: "info@zerospacearchitect.com" },
  { page: "সাপোর্ট", key: "support.email.2", label: "ইমেইল ২", defaultValue: "admin@zerospacearchitect.com" },
  { page: "সাপোর্ট", key: "support.agent.image", label: "সাপোর্ট এজেন্ট ছবি", defaultValue: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=320&h=280&fit=crop", type: "image" },
  { page: "সাপোর্ট", key: "support.chat.cta", label: "চ্যাট বাটন", defaultValue: "সরাসরি ZeroSpace এ কথা বলুন" },
  { page: "সাপোর্ট", key: "support.tutorial.1.title", label: "টিউটোরিয়াল ১ শিরোনাম", defaultValue: "নতুন একাউন্ট যেভাবে তৈরি করবেন" },
  { page: "সাপোর্ট", key: "support.tutorial.1.video", label: "টিউটোরিয়াল ১ ইউটিউব URL", defaultValue: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { page: "সাপোর্ট", key: "support.tutorial.2.title", label: "টিউটোরিয়াল ২ শিরোনাম", defaultValue: "ফ্রি কোর্স যেভাবে এনরোল করবেন" },
  { page: "সাপোর্ট", key: "support.tutorial.2.video", label: "টিউটোরিয়াল ২ ইউটিউব URL", defaultValue: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
];

export const REGISTRY_BY_KEY: Record<string, ContentItem> = Object.fromEntries(
  CONTENT_REGISTRY.map((i) => [i.key, i])
);
