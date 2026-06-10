"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

function renderContent(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      // Headings
      if (line.startsWith("## ")) return `<h3 class="text-lg font-bold text-gray-900 mt-4 mb-2">${line.slice(3)}</h3>`;
      // Bullet points
      if (line.startsWith("• ")) return `<li class="ml-4 list-disc">${formatInline(line.slice(2))}</li>`;
      // Numbered list
      if (/^\d+\.\s/.test(line)) return `<li class="ml-4 list-decimal">${formatInline(line.replace(/^\d+\.\s/, ""))}</li>`;
      // Empty line
      if (!line.trim()) return `<br/>`;
      // Regular paragraph
      return `<p>${formatInline(line)}</p>`;
    })
    .join("");
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<u>$1</u>');
}

export default function RefundPolicyPage() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("রিফান্ড নীতিমালা");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlign, setImageAlign] = useState("full");

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

      const { data: alignData } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "refund_policy_image_align")
        .maybeSingle();
      if (alignData?.value) setImageAlign(alignData.value);
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
              <img src={imageUrl} alt="" className={`mb-6 rounded-xl object-cover ${imageAlign === "full" ? "w-full" : imageAlign === "center" ? "mx-auto max-w-lg" : imageAlign === "left" ? "float-left mr-4 max-w-sm" : "float-right ml-4 max-w-sm"}`} />
            )}
            <div className="text-sm leading-relaxed text-gray-700 md:text-base refund-content" dangerouslySetInnerHTML={{ __html: renderContent(content) }} />
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
