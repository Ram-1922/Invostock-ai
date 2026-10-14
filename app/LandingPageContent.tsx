"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { ArrowRight, Package, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const FEATURES = [
  { title: "AI OCR Scanning", desc: "Instantly digitize supplier invoices using Qwen Vision AI.", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
  { title: "Smart Inventory", desc: "Real-time stock tracking with automated low-stock alerts.", icon: Package, color: "text-primary-500", bg: "bg-primary-500/10" },
  { title: "Zero-Trust Security", desc: "End-to-end encrypted payloads keeping your data locked.", icon: ShieldCheck, color: "text-indigo-500", bg: "bg-indigo-500/10" },
];

export default function LandingPageContent() {
  // Explicitly typed variants for strict TypeScript
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    // Row 1 = top bar, row 2 = content (centered when short, scrolls when tall)
    <div className="min-h-screen supports-[height:100dvh]:min-h-[100dvh] grid grid-rows-[auto_1fr] relative overflow-x-hidden bg-transparent">

      {/* Minimal top bar (part of the page flow, so it never overlaps the hero on small screens) */}
      <motion.nav
        aria-label="Main navigation"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-7xl mx-auto grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-4 sm:px-6 sm:py-6 xl:px-8"
      >
        <div className="grid grid-flow-col auto-cols-max items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">InvoStock</span>
        </div>
        <Link
          href="/login"
          className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:text-foreground hover:bg-slate-500/10 transition-colors"
        >
          Sign In
        </Link>
      </motion.nav>

      {/* Content */}
      <div className="grid content-center justify-items-center gap-12 sm:gap-16 px-4 sm:px-6 xl:px-8 pt-4 pb-12 sm:pb-16 xl:pb-20">

        {/* Hero Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-4xl mx-auto text-center z-10"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-600 dark:text-primary-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-6 sm:mb-8"
          >
            <Zap className="w-3.5 h-3.5" /> Next-Gen Inventory AI
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight text-foreground mb-5 sm:mb-6 leading-[1.1]"
          >
            Automate Stock with <br className="max-sm:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-teal-500">Intelligent Extraction.</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg lg:text-xl text-slate-500 dark:text-slate-400 mb-8 sm:mb-10 max-w-2xl mx-auto font-medium"
          >
            Upload invoices, extract line items with AI, and sync your inventory in seconds. Enterprise-grade security with AES-256-GCM encryption.
          </motion.p>

          {/* Buttons: stacked and full width on phones, side by side from sm up */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 sm:grid-flow-col sm:auto-cols-max justify-center gap-1 sm:gap-4 max-w-sm mx-auto"
          >
            <Link href="/register" className="block">
              <Button className="px-6 py-3 text-base rounded-2xl w-full sm:w-auto sm:h-auto h-15">
                Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login" className="block">
              <Button variant="secondary" className="px-6 py-3 h-15 sm:h-auto text-base rounded-2xl w-full sm:w-auto">
                Login to Dashboard
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature Cards: 1 column on phones, 2 on sm, 3 on lg */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-5xl z-10"
        >
          {FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className={i === FEATURES.length - 1 ? "sm:col-span-2 lg:col-span-1" : ""}
            >
              <Card interactive className="p-5 sm:p-6 text-left h-full border border-border/50 bg-surface/50">
                {/* Icon beside the text on phones, stacked above it from sm up */}
                <div className="grid grid-cols-[auto_minmax(0,1fr)] sm:grid-cols-1 items-start gap-4 sm:gap-0">
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center sm:mb-4 ${feature.bg} ${feature.color}`}>
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-foreground mb-1 sm:mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{feature.desc}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
