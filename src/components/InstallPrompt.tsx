"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed recently
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (sessionStorage.getItem("install-dismissed")) return;

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // For iOS, show banner after 3 seconds (no beforeinstallprompt on iOS)
    if (ios) {
      const isInStandalone = (navigator as any).standalone;
      if (!isInStandalone) {
        setTimeout(() => setShowBanner(true), 3000);
      }
      return;
    }

    // For Android/Desktop Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem("install-dismissed", "1");
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9998] animate-in slide-in-from-bottom duration-500 p-4 md:bottom-6 md:left-auto md:right-6 md:max-w-sm md:p-0">
      <div className="relative overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-2xl shadow-sky-500/10">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 p-4">
          {/* App icon */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 shadow-sm">
            <img src="/icon-192.png" alt="" className="h-9 w-9 rounded-lg" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <h3 className="font-bold text-foreground text-sm">Zero Space Architect</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isIOS
                ? "Share → 'Add to Home Screen' চাপুন"
                : "অ্যাপটি ইনস্টল করুন — দ্রুত অ্যাক্সেস পান"}
            </p>
          </div>
        </div>

        {/* Action */}
        <div className="border-t px-4 py-3">
          {isIOS ? (
            <p className="text-center text-xs text-muted-foreground">
              Safari-এ <span className="inline-flex items-center gap-0.5 font-medium text-sky-600">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Share
              </span> → <span className="font-medium">&ldquo;Add to Home Screen&rdquo;</span> চাপুন
            </p>
          ) : (
            <Button
              onClick={handleInstall}
              className="w-full rounded-full bg-sky-600 text-sm font-semibold hover:bg-sky-700"
            >
              <Download className="mr-2 h-4 w-4" />
              ইনস্টল করুন
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
