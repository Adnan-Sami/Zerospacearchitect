"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";

export function ScrollToTop() {
  const pathname = usePathname();

  // Use layoutEffect to scroll before paint
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  // Fallback
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
