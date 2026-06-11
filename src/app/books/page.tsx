"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [searchTerm, setSearchTerm] = useState("");

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
  }).filter((b) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.title?.toLowerCase().includes(term) ||
      b.author?.toLowerCase().includes(term) ||
      b.description?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-foreground">সকল বই</h1>

        {/* Filter Section */}
        <div className="mb-6 space-y-4 rounded-2xl border bg-card p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="বই খুঁজুন (নাম, লেখক)..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBooks.map((book) => (
              <Link key={book.id} href={`/books/${book.slug || book.id}`}>
                <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-lg">
                  {/* Cover */}
                  <div className="aspect-video overflow-hidden bg-muted">
                    {book.cover_url ? (
                      <Image
                        src={book.cover_url}
                        alt={book.title}
                        width={400}
                        height={225}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <BookOpen className="h-12 w-12 text-sky-200" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="mb-1 line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-foreground">
                      {book.title}
                    </h3>
                    <p className="mb-2 text-xs text-muted-foreground">{book.author || "—"}</p>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <p className="text-base font-bold text-primary">
                        {Number(book.price) === 0 ? "ফ্রি" : `৳${Number(book.price).toLocaleString("bn-BD")}`}
                        {book.original_price && Number(book.original_price) > Number(book.price) && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground line-through">
                            ৳{Number(book.original_price).toLocaleString("bn-BD")}
                          </span>
                        )}
                      </p>
                      <Button size="sm" className="h-7 rounded-full bg-sky-600 px-3 text-xs hover:bg-sky-700">
                        বিস্তারিত
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-muted-foreground">কোনো বই পাওয়া যায়নি।</p>
        )}
      </div>
      <Footer />
    </div>
  );
}
