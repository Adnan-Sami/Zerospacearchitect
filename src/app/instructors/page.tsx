"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Facebook, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

type Instructor = {
  id: string;
  name: string;
  title: string;
  designation: string;
  image_url: string;
  facebook_url: string | null;
  youtube_url: string | null;
  total_courses: number;
  total_students: number;
};

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  useEffect(() => {
    supabase
      .from("public_instructors")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setInstructors((data as Instructor[]) ?? []);
      });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 px-4 py-16 text-white md:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-[400px] w-[400px] animate-pulse rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] animate-pulse rounded-full bg-blue-500/10 blur-3xl [animation-delay:1s]" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm backdrop-blur-sm">
            <Award className="h-4 w-4 text-sky-400" />
            <span className="text-white/80">অভিজ্ঞ ও দক্ষ শিক্ষকমণ্ডলী</span>
          </div>
          <h1 className="mb-4 text-3xl font-black leading-tight md:text-5xl">
            আমাদের প্রশিক্ষকবৃন্দ
          </h1>
          <p className="mx-auto max-w-2xl text-base text-white/60 md:text-lg">
            দেশের সেরা প্রশিক্ষকদের কাছ থেকে শিখুন। প্রতিটি কোর্স তৈরি করেছেন অভিজ্ঞ পেশাদাররা।
          </p>
        </div>
      </section>

      {/* Instructors Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        {instructors.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">প্রশিক্ষক তথ্য শীঘ্রই আসছে...</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {instructors.map((instructor) => (
              <div
                key={instructor.id}
                className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Image */}
                <div className="relative mx-auto mt-6 h-48 w-48 overflow-hidden rounded-full bg-gradient-to-br from-sky-100 to-blue-50">
                  {instructor.image_url ? (
                    <Image
                      src={instructor.image_url}
                      alt={instructor.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-sky-300">
                      {instructor.name?.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5 text-center">
                  <h3 className="mb-1 text-lg font-bold text-gray-900">{instructor.name}</h3>
                  {instructor.title && (
                    <p className="mb-3 text-sm text-muted-foreground">{instructor.title}</p>
                  )}

                  {/* Social Links */}
                  <div className="mb-4 flex items-center justify-center gap-3">
                    {instructor.facebook_url && (
                      <a href={instructor.facebook_url} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white transition-transform hover:scale-110" onClick={(e) => e.stopPropagation()}>
                        <Facebook className="h-4 w-4 fill-current" />
                      </a>
                    )}
                    {instructor.youtube_url && (
                      <a href={instructor.youtube_url} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white transition-transform hover:scale-110" onClick={(e) => e.stopPropagation()}>
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      </a>
                    )}
                  </div>

                  {/* Detail Button - links to detail page */}
                  <Link href={`/instructors/${instructor.id}`}>
                    <Button
                      variant="outline"
                      className="w-full rounded-full border-sky-200 text-sky-700 transition-all hover:bg-sky-50"
                    >
                      বিস্তারিত জানুন
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
