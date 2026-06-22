"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function HeroBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-background/50 backdrop-blur-3xl">
      {/* Soft gradient background - Apple Style (Siri / Apple Intelligence inspired) */}
      <div className="absolute inset-0 opacity-40 dark:opacity-20 mix-blend-normal">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            x: ["-10%", "10%", "-10%"],
            y: ["-10%", "10%", "-10%"],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-r from-blue-300 to-indigo-400 dark:from-blue-600 dark:to-indigo-800 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: ["10%", "-10%", "10%"],
            y: ["10%", "-10%", "10%"],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-r from-purple-300 to-pink-400 dark:from-purple-600 dark:to-pink-800 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: ["0%", "20%", "0%"],
            y: ["20%", "0%", "20%"],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[20%] left-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-r from-cyan-300 to-blue-300 dark:from-cyan-700 dark:to-blue-700 blur-[140px] opacity-70"
        />
      </div>

      {/* Subtle overlay for better text contrast */}
      <div className="absolute inset-0 bg-background/40 backdrop-blur-[50px] mask-image-radial-gradient" />
    </div>
  );
}
