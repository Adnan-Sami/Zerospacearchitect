"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Youtube, Phone, Mail, MapPin, ArrowUpRight } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";

const quickLinks = [
  { label: "আমাদের প্রশিক্ষক", href: "/instructors" },
  { label: "শিক্ষক হিসেবে যোগ দিন", href: "/become-instructor" },
  { label: "সার্টিফিকেট চেক করুন", href: "/verify" },
  { label: "সেমিনারে যোগ দিন", href: "/seminars" },
  { label: "যোগাযোগ করুন", href: "/support" },
  { label: "রিফান্ড পলিসি", href: "/" },
];

export function Footer() {
  const settings = useSiteSettings();
  return (
    <footer className="bg-gradient-to-b from-[#0b1623] to-[#060d16] text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand & Contact */}
          <div>
            <Image
              src="/logo-footer.png"
              alt={settings.site_name || "ZeroSpace Architect"}
              width={140}
              height={80}
              className="mb-4 h-16 w-auto"
            />
            <p className="mb-4 max-w-xs text-sm leading-relaxed text-gray-400">
              বাংলাদেশের সেরা অনলাইন লার্নিং ও আর্কিটেকচারাল কনসালটেন্সি প্ল্যাটফর্ম।
            </p>

            {/* Contact */}
            <div className="space-y-2.5">
              <a href="tel:+8801521113539" className="flex items-center gap-2.5 text-sm transition-colors hover:text-sky-400">
                <Phone className="h-4 w-4 text-sky-500" />01521-113539
              </a>
              <a href="mailto:zerospace.arc@gmail.com" className="flex items-center gap-2.5 text-sm transition-colors hover:text-sky-400">
                <Mail className="h-4 w-4 text-sky-500" />zerospace.arc@gmail.com
              </a>
            </div>

            {/* Social */}
            <div className="mt-5 flex items-center gap-2.5">
              <a href="https://www.facebook.com/share/1A2LiqRPFy/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-gray-300 ring-1 ring-white/10 transition-all hover:bg-blue-600 hover:text-white hover:ring-blue-600">
                <Facebook className="h-4 w-4 fill-current" />
              </a>
              <a href="#" aria-label="YouTube" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-gray-300 ring-1 ring-white/10 transition-all hover:bg-red-600 hover:text-white hover:ring-red-600">
                <Youtube className="h-4 w-4 fill-current" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Quick Links</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-1.5 text-sm text-gray-400 transition-all duration-200 hover:text-sky-400 hover:translate-x-1">
                    <ArrowUpRight className="h-3 w-3 text-sky-500/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-sky-400" />
                    <span className="border-b border-transparent group-hover:border-sky-400/50">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Our Offices</h4>
            <div className="space-y-4">
              <div className="flex gap-2.5 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                <div>
                  <p className="font-medium text-gray-200">নওগাঁ</p>
                  <p className="text-xs text-gray-500">Zilla Park-Small Gate, Park View, Flat-5A, Naogaon-6500</p>
                </div>
              </div>
              <div className="flex gap-2.5 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                <div>
                  <p className="font-medium text-gray-200">ঢাকা</p>
                  <p className="text-xs text-gray-500">RMST Tower, 3rd Floor, Baipail, Ashulia, Savar, Dhaka</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 sm:flex-row">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} ZeroSpace Architect. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            {settings.footer_text || "Designed & Developed by ZeroSpace Team"}
          </p>
        </div>
      </div>
    </footer>
  );
}
