"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
      
      {/* Background glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/10 dark:bg-primary-500/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg p-8 sm:p-12 glass-card bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl text-center flex flex-col items-center"
      >
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl flex items-center justify-center mb-6 sm:mb-8 shadow-inner rotate-3">
          <FileQuestion className="w-10 h-10 sm:w-12 sm:h-12 text-zinc-400 dark:text-zinc-500" />
        </div>
        
        <h1 className="text-6xl sm:text-7xl font-black text-zinc-900 dark:text-white tracking-tighter mb-2 sm:mb-4">
          404
        </h1>
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-700 dark:text-zinc-200 mb-3 sm:mb-4">
          Page Not Found
        </h2>
        <p className="text-sm sm:text-base font-medium text-zinc-500 dark:text-zinc-400 mb-8 sm:mb-10 max-w-sm mx-auto">
          We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in the first place.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full">
          <button 
            onClick={() => router.back()}
            className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          
          <Link 
            href="/dashboard"
            className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/25 transition-all"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}