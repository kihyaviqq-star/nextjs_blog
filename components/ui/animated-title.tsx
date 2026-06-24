"use client";

import { motion } from "framer-motion";

export function AnimatedTitle({ text }: { text: string }) {
  const letters = Array.from(text);

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.2 },
    },
  };

  const child = {
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 150,
      },
    }),
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.9,
      filter: "blur(12px)",
    },
  };

  return (
    <div className="relative flex justify-center w-full mb-6 mt-2">
      {/* Background glow that pulsates */}
      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [0.9, 1.1, 0.9],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 bg-primary/20 blur-[60px] -z-10 rounded-full"
      />
      
      <motion.h1
        className="text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter flex justify-center leading-normal pb-4"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {letters.map((letter, index) => {
          const isDot = letter === ".";
          // If we have "Softo.ru", the indices for ".ru" are 5, 6, 7.
          // Let's generalize: find the last dot index
          const lastDotIndex = text.lastIndexOf(".");
          const isTld = lastDotIndex !== -1 && index > lastDotIndex;
          
          let letterClass = "inline-block text-foreground transition-colors hover:text-primary cursor-default";
          
          if (isDot) {
            letterClass = "inline-block text-primary transition-colors cursor-default";
          } else if (isTld) {
            // Outline effect for TLD (.ru)
            letterClass = "inline-block text-transparent bg-clip-text bg-gradient-to-br from-foreground/80 to-foreground/40 transition-colors cursor-default font-light tracking-normal";
          }

          return (
          <motion.span
            key={index}
            variants={child}
            custom={index}
            initial="hidden"
            animate="visible"
            whileInView={{
              y: [0, -8, 0],
              textShadow: [
                "0 4px 10px rgba(0,0,0,0.1)",
                "0 15px 35px rgba(139, 92, 246, 0.6)",
                "0 4px 10px rgba(0,0,0,0.1)"
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.15, // Wave effect delay
            }}
            className={letterClass}
          >
            {letter === " " ? "\u00A0" : letter}
          </motion.span>
          );
        })}
      </motion.h1>
    </div>
  );
}
