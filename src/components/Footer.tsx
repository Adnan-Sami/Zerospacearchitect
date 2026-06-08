"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, ExternalLink, Facebook, Youtube } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";

const usefulLinks = [
  { label: "আমাদের প্রশিক্ষক", href: "/instructors" },
  { label: "শিক্ষক হিসেবে যোগ দিন", href: "/become-instructor" },
  { label: "সার্টিফিকেট চেক করুন", href: "/verify" },
];

const aboutLinks = [
  { label: "যোগাযোগ করুন", href: "/" },
  { label: "এফিলিয়েট", href: "/" },
  { label: "রিফান্ড পলিসি", href: "/" },
  { label: "সেমিনারে যোগ দিন", href: "/seminars" },
];

export function Footer() {
  const settings = useSiteSettings();
  return (
    <footer className="bg-[#0a1420] text-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <Image
                src="/logo-footer.png"
                alt={settings.site_name || "ZeroSpace Architect"}
                width={160}
                height={96}
                className="h-24 w-auto"
              />
            </div>
            <p className="mb-5 text-sm leading-relaxed text-gray-400">
              <strong className="block text-gray-200">নওগাঁ লোকেশন:</strong>
              Naogaon Zilla Park-Small Gate # House Name- Park view # Flat-5A # Lift-4, Naogaon, Bangladesh, 6500
            </p>
            <p className="mb-5 text-sm leading-relaxed text-gray-400">
              <strong className="block text-gray-200">ঢাকা লোকেশন:</strong>
              RMST Tower # 3rd Floor # Baipail # Ashulia # Savar # Dhaka
            </p>
            <h4 className="mb-3 font-semibold text-white">Follow Us:</h4>
            <div className="flex items-center gap-3">
              <a href="https://www.facebook.com/share/1A2LiqRPFy/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white transition-opacity hover:opacity-90">
                <Facebook className="h-4 w-4 fill-current" />
              </a>
              <a href="#" aria-label="YouTube" className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white transition-opacity hover:opacity-90">
                <Youtube className="h-4 w-4 fill-current" />
              </a>
            </div>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="mb-5 text-lg font-bold text-white">Useful Links</h3>
            <ul className="space-y-3">
              {usefulLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-sky-400">
                    <ExternalLink className="h-4 w-4 text-sky-400" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="mb-5 text-lg font-bold text-white">About Zero Space</h3>
            <ul className="space-y-3">
              {aboutLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-sky-400">
                    <ExternalLink className="h-4 w-4 text-sky-400" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-5 text-lg font-bold text-white">Support</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li>01521-113539 (Call &amp; WhatsApp)</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-gray-400">
          {settings.footer_text || "Level 15-A, Saiham Sky View Tower, 45 Bijoy Nagar Road, Dhaka - 1000"}
        </div>
      </div>
    </footer>
  );
}
