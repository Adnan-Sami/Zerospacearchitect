import type { Metadata } from "next";
import "./globals.css";
import { FloatingButtons } from "@/components/FloatingButtons";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Toaster } from "sonner";
import { SchemaMarkup } from "./schema";

export const metadata: Metadata = {
  title: "Zero Space Architect | Best Architecture Firm in Bangladesh | Architectural Consultancy",
  description:
    "Zero Space Architect - Best Architecture Firm in Bangladesh. We offer Architectural Consultancy, Interior Design, Residential & Commercial Design services in Dhaka and Naogaon. Expert architects for modern, sustainable building design solutions.",
  keywords: [
    "Architecture Firm Bangladesh",
    "Best Architect in Bangladesh",
    "Architectural Consultancy Dhaka",
    "Interior Design Bangladesh",
    "Residential Design Dhaka",
    "Commercial Design Bangladesh",
    "Zero Space Architect",
    "ZeroSpace Architect",
    "Architect Naogaon",
    "Architect Dhaka",
    "Building Design Bangladesh",
    "House Design Bangladesh",
    "Sustainable Architecture Bangladesh",
    "Modern Architecture Dhaka",
    "বাংলাদেশ আর্কিটেক্ট",
    "স্থাপত্য নকশা",
    "ইন্টেরিয়র ডিজাইন",
  ],
  authors: [{ name: "Zero Space Architect" }],
  creator: "Zero Space Architect",
  publisher: "Zero Space Architect",
  metadataBase: new URL("https://zerospacearchitect.com"),
  alternates: {
    canonical: "https://zerospacearchitect.com",
  },
  openGraph: {
    title: "Zero Space Architect | Best Architecture Firm in Bangladesh",
    description:
      "Best Architecture Firm in Bangladesh offering Architectural Consultancy, Interior Design, Residential & Commercial Design services in Dhaka and Naogaon.",
    url: "https://zerospacearchitect.com",
    siteName: "Zero Space Architect",
    locale: "bn_BD",
    type: "website",
    images: [
      {
        url: "https://zerospacearchitect.com/logo.png",
        width: 1200,
        height: 630,
        alt: "Zero Space Architect - Best Architecture Firm in Bangladesh",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zero Space Architect | Best Architecture Firm in Bangladesh",
    description:
      "Best Architecture Firm in Bangladesh offering Architectural Consultancy, Interior Design, Residential & Commercial Design services in Dhaka and Naogaon.",
    images: ["https://zerospacearchitect.com/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "YOUR_GOOGLE_VERIFICATION_CODE",
    // yandex: "YOUR_YANDEX_VERIFICATION_CODE",
    // yahoo: "YOUR_YAHOO_VERIFICATION_CODE",
  },
  category: "Architecture",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo-footer.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0EA5E9" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ZeroSpace" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <SchemaMarkup />
      </head>
      <body className="font-[\'Hind_Siliguri\',sans-serif]" suppressHydrationWarning>
        <ScrollToTop />
        {children}
        <FloatingButtons />
        <Toaster richColors />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
