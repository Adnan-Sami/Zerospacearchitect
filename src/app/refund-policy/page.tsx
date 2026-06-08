"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

export default function RefundPolicyPage() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("রিফান্ড নীতিমালা");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: titleData } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "refund_policy_title")
        .maybeSingle();
      if (titleData?.value) setTitle(titleData.value);

      const { data: contentData } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "refund_policy_content")
        .maybeSingle();
      if (contentData?.value) setContent(contentData.value);

      const { data: imageData } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "refund_policy_image")
        .maybeSingle();
      if (imageData?.value) setImageUrl(imageData.value);
    };
    load();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-r from-sky-50 to-blue-50 px-4 py-10">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-2xl font-black text-sky-700 md:text-3xl lg:text-4xl">{title}</h1>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-4xl px-4 py-10">
        {content ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm md:p-10">
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="mb-6 w-full rounded-xl object-cover" />
            )}
            <div className="whitespace-pre-line text-sm leading-relaxed text-gray-700 md:text-base">
              {content}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-white p-10 text-center text-muted-foreground shadow-sm">
            রিফান্ড নীতিমালা শীঘ্রই আপডেট করা হবে।
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
