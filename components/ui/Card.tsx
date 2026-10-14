"use client";

import React from "react";
import { HTMLMotionProps, motion } from "framer-motion";
import { cn } from "@/_lib/utils";

interface CardProps extends HTMLMotionProps<"div"> {
  delay?: number;
  interactive?: boolean;
  children?: React.ReactNode;
}

export function Card({ children, className, delay = 0, interactive = false, ...props }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={interactive ? { y: -4, boxShadow: "0 20px 40px -10px rgba(16,185,131,0.15)" } : {}}
      className={cn("glass-card p-6", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}