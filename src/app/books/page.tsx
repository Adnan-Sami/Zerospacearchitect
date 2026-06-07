"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BookOpen, ShoppingCart, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteContent } from "@/hooks/use-site-content";
import { toast } from "sonner";

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
  details: string;
};

export default function BooksPage() {
  const heroTitle = useSiteContent("books.hero.title");
  const heroSubtitle = useSiteContent("books.hero.subtitle");
  const orderCta = useSiteContent("books.order.cta");
  const orderTitle = useSiteContent("books.order.title");
  const orderSubmit = useSiteContent("books.order.submit");
  const [books, setBooks] = useState<Book[]>([]);
  const [selected, setSelected] = useState<Book | null>(null);
  const [loading, setLoading] = useState(false);
  const [booksLoading, setBooksLoading] = useState(true);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    project_location: "",
    message: "",
  });

  useEffect(() => {
    const loadBooks = async () => {
      const { data } = await supabase
        .from("books")
        .select("*")
        .eq("is_published", true)
        .order("sort_order")
        .order("created_at", { ascending: false });
      setBooks((data ?? []) as Book[]);
      setBooksLoading(false);
    };

    loadBooks();
  }, []);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    const { error } = await supabase.from("service_requests").insert([
      {
        full_name: form.full_name,
        phone: form.phone,
        email: form.email || null,
        project_location: form.project_location || null,
        service_type: `বই অর্ডার: ${selected.title}`,
        message: `বই: ${selected.title} | দাম: ৳${selected.price}\n${form.message}`,
      },
    ]);
    setLoading(false);
    if (error) {
      toast.error("অর্ডার ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    } else {
      toast.success("অর্ডার সফল হয়েছে! আমরা শীঘ্রই যোগাযোগ করব।");
      setForm({
        full_name: "",
        phone: "",
        email: "",
        project_location: "",
        message: "",
      });
      setSelected(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-linear-to-b from-primary/10 to-background py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-3 text-4xl font-bold">{heroTitle}</h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              {heroSubtitle}
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          {booksLoading ? (
            <p className="py-16 text-center text-muted-foreground">লোড হচ্ছে...</p>
          ) : books.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {books.map((book) => (
                <Card
                  key={book.id}
                  className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg"
                >
                  <Link href={`/books/${book.slug}`} className="block">
                    <div className="aspect-3/4 overflow-hidden bg-muted">
                      <Image
                        src={book.cover_url}
                        alt={book.title}
                        width={400}
                        height={600}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-2 text-lg">
                        {book.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        লেখক: {book.author}
                      </p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < book.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {book.description}
                      </p>
                    </CardContent>
                  </Link>
                  <CardFooter className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold text-primary">
                        ৳{Number(book.price).toLocaleString("bn-BD")}
                      </span>
                      {book.original_price && (
                        <span className="ml-2 text-sm text-muted-foreground line-through">
                          ৳{Number(book.original_price).toLocaleString("bn-BD")}
                        </span>
                      )}
                    </div>
                    <Button onClick={() => setSelected(book)} size="sm">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {orderCta}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="py-16 text-center text-muted-foreground">এখনও কোনো বই যোগ করা হয়নি।</p>
          )}
        </section>
      </main>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{orderTitle}</DialogTitle>
            <DialogDescription>
              {selected && `${selected.title} - ৳${Number(selected.price).toLocaleString("bn-BD")}`}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="mb-4 rounded-2xl border bg-muted/40 p-4">
              <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-start">
                <div className="overflow-hidden rounded-xl bg-muted">
                  <Image src={selected.cover_url} alt={selected.title} width={280} height={360} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">লেখক: {selected.author || "—"}</p>
                  <p className="mt-2 text-sm leading-7 text-foreground">{selected.description}</p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{selected.details}</p>
                </div>
              </div>
            </div>
          )}
          <form onSubmit={handleOrder} className="space-y-4">
            <div>
              <Label htmlFor="full_name">পূর্ণ নাম *</Label>
              <Input
                id="full_name"
                required
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="phone">মোবাইল নম্বর *</Label>
              <Input
                id="phone"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">ইমেইল</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="project_location">ডেলিভারি ঠিকানা</Label>
              <Input
                id="project_location"
                value={form.project_location}
                onChange={(e) =>
                  setForm({ ...form, project_location: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="message">বার্তা</Label>
              <Textarea
                id="message"
                value={form.message}
                onChange={(e) =>
                  setForm({ ...form, message: e.target.value })
                }
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "অর্ডার হচ্ছে..." : orderSubmit}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
