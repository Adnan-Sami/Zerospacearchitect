import type { Metadata } from "next";
import "./globals.css";
import { FloatingButtons } from "@/components/FloatingButtons";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "ZeroSpace Architect - বাংলাদেশের সেরা অনলাইন লার্নিং প্ল্যাটফর্ম",
  description:
    "ঘরে বসে শিখুন সেরা ইন্সট্রাক্টরদের কাছ থেকে। কোর্স কিনুন, ভিডিও দেখুন, সার্টিফিকেট পান।",
  authors: [{ name: "ZeroSpace Architect" }],
  openGraph: {
    title: "ZeroSpace Architect",
    description: "বাংলাদেশের সেরা অনলাইন লার্নিং প্ল্যাটফর্ম",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ZeroSpace Architect",
    description: "বাংলাদেশের সেরা অনলাইন লার্নিং প্ল্যাটফর্ম",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <FloatingButtons />
        <Toaster richColors />
      </body>
    </html>
  );
}
