"use client";

import Image from "next/image";
import { useState } from "react";
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
  originalPrice?: number;
  rating: number;
  cover: string;
  description: string;
};

const books: Book[] = [
  {
    id: "b1",
    title: "আর্কিটেকচারাল ডিজাইন বেসিকস",
    author: "ইঞ্জি. রফিকুল ইসলাম",
    price: 650,
    originalPrice: 850,
    rating: 5,
    cover:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop",
    description:
      "আর্কিটেকচারাল ডিজাইনের মৌলিক ধারণা, স্কেচ এবং প্ল্যানিং নিয়ে বিস্তারিত গাইডবুক।",
  },
  {
    id: "b2",
    title: "ইন্টেরিয়র ডিজাইন গাইড",
    author: "স্থপতি নুসরাত জাহান",
    price: 550,
    originalPrice: 700,
    rating: 4,
    cover:
      "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=400&h=600&fit=crop",
    description: "আধুনিক ইন্টেরিয়র ডিজাইনের কৌশল, কালার থিওরি এবং স্পেস প্ল্যানিং।",
  },
  {
    id: "b3",
    title: "স্ট্রাকচারাল ইঞ্জিনিয়ারিং হ্যান্ডবুক",
    author: "প্রফেসর কামরুল হাসান",
    price: 950,
    originalPrice: 1200,
    rating: 5,
    cover:
      "https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=600&fit=crop",
    description:
      "RCC, স্টিল স্ট্রাকচার এবং ফাউন্ডেশন ডিজাইন সম্পর্কিত সম্পূর্ণ রেফারেন্স।",
  },
  {
    id: "b4",
    title: "অটোক্যাড মাস্টারক্লাস",
    author: "ইঞ্জি. সাজ্জাদ হোসেন",
    price: 450,
    originalPrice: 600,
    rating: 4,
    cover:
      "https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?w=400&h=600&fit=crop",
    description: "অটোক্যাড 2D এবং 3D ডিজাইনের সম্পূর্ণ বাংলা টিউটোরিয়াল বই।",
  },
  {
    id: "b5",
    title: "গ্রিন বিল্ডিং ডিজাইন",
    author: "স্থপতি তানভীর আহমেদ",
    price: 750,
    rating: 5,
    cover:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
    description: "পরিবেশবান্ধব ও টেকসই ভবন নির্মাণের আধুনিক পদ্ধতি।",
  },
  {
    id: "b6",
    title: "ল্যান্ডস্কেপ ডিজাইন প্রিন্সিপলস",
    author: "ইঞ্জি. মাহফুজা আক্তার",
    price: 600,
    originalPrice: 800,
    rating: 4,
    cover:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&h=600&fit=crop",
    description:
      "আউটডোর স্পেস, বাগান ও পার্ক ডিজাইনের কৌশল ও আইডিয়া।",
  },
];

export default function BooksPage() {
  const heroTitle = useSiteContent("books.hero.title");
  const heroSubtitle = useSiteContent("books.hero.subtitle");
  const orderCta = useSiteContent("books.order.cta");
  const orderTitle = useSiteContent("books.order.title");
  const orderSubmit = useSiteContent("books.order.submit");
  const [selected, setSelected] = useState<Book | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    project_location: "",
    message: "",
  });

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
        <section className="bg-gradient-to-b from-primary/10 to-background py-16">
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <Card
                key={book.id}
                className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg"
              >
                <div className="aspect-[3/4] overflow-hidden bg-muted">
                  <Image
                    src={book.cover}
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
                <CardFooter className="flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-primary">
                      ৳{book.price}
                    </span>
                    {book.originalPrice && (
                      <span className="ml-2 text-sm text-muted-foreground line-through">
                        ৳{book.originalPrice}
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
        </section>
      </main>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{orderTitle}</DialogTitle>
            <DialogDescription>
              {selected && `${selected.title} - ৳${selected.price}`}
            </DialogDescription>
          </DialogHeader>
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
