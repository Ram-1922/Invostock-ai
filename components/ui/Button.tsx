"use client";

import React from "react";
import { HTMLMotionProps, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/_lib/utils";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "ghost";
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function Button({ children, className, variant = "primary", isLoading, ...props }: ButtonProps) {
  const baseStyles = "relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 disabled:opacity-50 overflow-hidden";
  
  const variants = {
    primary: "bg-primary-500 text-white shadow-lg shadow-primary-500/25 hover:bg-primary-600",
    secondary: "bg-white dark:bg-slate-900 border border-border text-slate-700 dark:text-slate-200 hover:border-primary-500/50 hover:bg-primary-50/50 dark:hover:bg-primary-950/50",
    ghost: "bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      className={cn(baseStyles, variants[variant], className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
      
      {variant === "primary" && (
        <motion.div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
          whileHover={{ translateX: "100%" }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        />
      )}
    </motion.button>
  );
}