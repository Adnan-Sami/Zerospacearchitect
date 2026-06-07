"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

type Book = {
  id: string;
  title: string;
  author: string;
  price: number;
  original_price?: number | null;
  rating: number;
  slug: string;
  cover_url: string;
  description: string;
};

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "free" | "paid">("all");

  useEffect(() => {
    supabase
      .from("books")
      .select("*")
      .eq("is_published", true)
      .order("sort_order")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setBooks((data ?? []) as Book[]);
        setBooksLoading(false);
      });
  }, []);

  const filteredBooks = books.filter((b) => {
    if (filter === "free") return Number(b.price) === 0;
    if (filter === "paid") return Number(b.price) > 0;
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        {/* Header */}
        <section className="bg-[#f0f7ff] py-10">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h1 className="mb-3 text-4xl font-black text-foreground md:text-5xl">বইগুলি</h1>
            <p className="text-base text-muted-foreground">
              Zero Space Architect এর লাইব্রেরি থেকে আপনার পছন্দের বইটি সংগ্রহ করুন
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-7xl px-4 py-10">
          {/* Filter bar */}
          <div className="mb-6 space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm font-semibold text-foreground">
                {filteredBooks.length} টি বই পাওয়া গেছে
              </p>
              <div className="flex gap-2">
                {[
                  { v: "all" as const, l: "সব" },
                  { v: "free" as const, l: "ফ্রি" },
                  { v: "paid" as const, l: "পেইড" },
                ].map((f) => (
                  <Button
                    key={f.v}
                    size="sm"
                    variant={filter === f.v ? "default" : "outline"}
                    className={filter === f.v ? "bg-sky-600 hover:bg-sky-700" : ""}
                    onClick={() => setFilter(f.v)}
                  >
                    {f.l}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid */}
          {booksLoading ? (
            <p className="py-16 text-center text-muted-foreground">লোড হচ্ছে...</p>
          ) : filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-lg"
                >
                  {/* Cover */}
                  <Link href={`/books/${book.slug || book.id}`} className="block">
                    <div className="relative aspect-[4/3] overflow-hidden bg-sky-50">
                      {book.cover_url ? (
                        <Image
                          src={book.cover_url}
                          alt={book.title}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <BookOpen className="h-12 w-12 text-sky-200" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-3 md:p-4">
                    <h3 className="mb-0.5 line-clamp-1 text-sm font-bold text-foreground">
                      {book.title}
                    </h3>
                    {book.author && (
                      <p className="mb-2 text-xs text-muted-foreground">By {book.author}</p>
                    )}

                    {/* Price + Details button */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-extrabold text-sky-600">
                          ৳{Number(book.price).toLocaleString("bn-BD")}
                        </span>
                        {book.original_price && Number(book.original_price) > Number(book.price) && (
                          <span className="text-xs text-muted-foreground line-through">
                            ৳{Number(book.original_price).toLocaleString("bn-BD")}
                          </span>
                        )}
                      </div>
                      <Link href={`/books/${book.slug || book.id}`}>
                        <Button size="sm" className="h-7 rounded-full bg-sky-600 px-3 text-xs hover:bg-sky-700">
                          Details <Eye className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-16 text-center text-muted-foreground">কোনো বই পাওয়া যায়নি।</p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
