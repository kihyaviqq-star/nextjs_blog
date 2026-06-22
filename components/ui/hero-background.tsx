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
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-50 bg-background transition-colors duration-500">
      {/* Soft gradient background - Apple Style */}
      <div className="absolute inset-0 opacity-60 dark:opacity-25 mix-blend-normal">
        {/* Top left blue/indigo */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: ["-10%", "15%", "-10%"],
            y: ["-10%", "15%", "-10%"],
            rotate: [0, 45, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vh] rounded-full bg-gradient-to-br from-blue-300/80 to-indigo-400/80 dark:from-blue-600/50 dark:to-indigo-800/50 blur-[120px]"
        />
        {/* Right purple/pink */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: ["10%", "-15%", "10%"],
            y: ["10%", "-15%", "10%"],
            rotate: [0, -45, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] -right-[10%] w-[50vw] h-[70vh] rounded-full bg-gradient-to-bl from-purple-300/80 to-pink-400/80 dark:from-purple-600/50 dark:to-pink-800/50 blur-[130px]"
        />
        {/* Bottom cyan/blue */}
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            x: ["0%", "10%", "-10%", "0%"],
            y: ["10%", "-10%", "10%", "10%"],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[20%] left-[10%] w-[80vw] h-[60vh] rounded-full bg-gradient-to-tr from-cyan-200/80 to-blue-300/80 dark:from-cyan-700/50 dark:to-blue-800/50 blur-[150px] opacity-80"
        />
      </div>

      {/* Very subtle noise overlay for texture (Apple style glass texture) */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      />
    </div>
  );
}
