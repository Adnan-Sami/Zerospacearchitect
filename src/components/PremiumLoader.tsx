"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function PremiumLoader({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),    // Blueprint grid
      setTimeout(() => setPhase(2), 1800),   // Floor plan draw
      setTimeout(() => setPhase(3), 4000),   // Structure build
      setTimeout(() => setPhase(4), 5200),   // Logo reveal
      setTimeout(() => onComplete(), 6200),  // Fade out
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-white"
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {/* Clean white background */}
      <div className="absolute inset-0 bg-white" />

      {/* Center Content */}
      <div className="relative flex flex-col items-center">
        {/* Architectural Floor Plan SVG Animation */}
        <motion.svg
          width="200"
          height="160"
          viewBox="0 0 200 160"
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 1 ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Floor plan outline - draws like a pen */}
          <motion.path
            d="M 30 20 L 170 20 L 170 140 L 30 140 Z"
            fill="none"
            stroke="#0EA5E9"
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: phase >= 1 ? 1 : 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          {/* Interior walls */}
          <motion.path
            d="M 100 20 L 100 90 M 30 80 L 100 80 M 100 90 L 170 90"
            fill="none"
            stroke="#0EA5E9"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: phase >= 1 ? 1 : 0 }}
            transition={{ duration: 1.8, delay: 0.6, ease: "easeInOut" }}
          />
          {/* Room divisions */}
          <motion.path
            d="M 65 80 L 65 140 M 135 90 L 135 140"
            fill="none"
            stroke="#0EA5E9"
            strokeWidth="0.8"
            opacity={0.7}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: phase >= 1 ? 1 : 0 }}
            transition={{ duration: 1.5, delay: 1.2, ease: "easeInOut" }}
          />

          {/* Columns - snap in like CAD */}
          {[[30, 20], [100, 20], [170, 20], [30, 80], [100, 80], [170, 90], [30, 140], [100, 140], [170, 140]].map(([cx, cy], i) => (
            <motion.rect
              key={i}
              x={cx - 3}
              y={cy - 3}
              width="6"
              height="6"
              fill="#1E293B"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: phase >= 2 ? 1 : 0, opacity: phase >= 2 ? 1 : 0 }}
              transition={{ duration: 0.25, delay: i * 0.1, ease: "easeOut" }}
            />
          ))}

          {/* Beams connecting columns */}
          <motion.path
            d="M 30 20 L 170 20 M 30 80 L 100 80 M 100 90 L 170 90 M 30 140 L 170 140"
            fill="none"
            stroke="#1E293B"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: phase >= 2 ? 1 : 0, opacity: phase >= 2 ? 0.8 : 0 }}
            transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
          />

          {/* Slab fill */}
          <motion.rect
            x="31" y="21" width="138" height="118"
            fill="#0EA5E9"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 3 ? 0.04 : 0 }}
            transition={{ duration: 0.5 }}
          />
        </motion.svg>

        {/* Logo Reveal */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: phase >= 3 ? 1 : 0, scale: phase >= 3 ? 1 : 0.9 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="relative">
            <img
              src="/logo.png"
              alt="Zero Space Architect"
              className="h-14 w-auto md:h-16"
            />
            {/* Glow effect */}
            <motion.div
              className="absolute -inset-4 -z-10 rounded-2xl bg-sky-400/10 blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase >= 3 ? 1 : 0 }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          className="mt-8 flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 1 ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-xs font-medium text-[#1E293B]/60">
            আপনার শেখার যাত্রা প্রস্তুত হচ্ছে...
          </p>
          <div className="h-[2px] w-48 overflow-hidden rounded-full bg-sky-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#0EA5E9] to-sky-400"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 5.5, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
