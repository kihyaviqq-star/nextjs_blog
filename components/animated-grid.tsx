"use client";

import { motion } from "framer-motion";
import React, { ReactNode } from "react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function AnimatedGrid({ children, className }: { children: ReactNode, className?: string }) {
  // Ensure children is treated as an array of elements
  const childArray = React.Children.toArray(children);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      viewport={{ once: true, margin: "-50px" }}
      whileInView="show"
      className={className}
    >
      {childArray.map((child, i) => (
        <motion.div key={i} variants={item} className="h-full">
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
