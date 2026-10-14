"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Hourglass, AlertOctagon, Lock, X } from "lucide-react";

interface RateLimitModalProps {
  isOpen: boolean;
  retryAfterSeconds: number;
  action: string;
  onClose: () => void;
}

const FEATURE_NAMES: Record<string, string> = {
  auth: "Login & Registration",
  ai_extraction: "AI Invoice Extraction",
  invoices: "Invoices",
  inventory: "Inventory",
  search: "Search & Filtering",
  db_write: "Saving Changes",
  db_read: "Loading Data",
};

// Full class strings so Tailwind can see them at build time.
const THEMES = {
  auth: {
    border: "border-rose-500/20",
    bar: "from-rose-500 to-red-600",
    glow: "bg-rose-500/10",
    iconWrap:
      "bg-rose-100 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-500",
    timerIcon: "text-rose-500",
    progress: "bg-rose-500",
    Icon: Lock,
    title: "Access Temporarily Locked",
    cooldownLabel: "Security Lockout",
  },
  default: {
    border: "border-amber-500/20",
    bar: "from-amber-400 to-orange-500",
    glow: "bg-amber-500/10",
    iconWrap:
      "bg-amber-100 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-500",
    timerIcon: "text-amber-500",
    progress: "bg-amber-500",
    Icon: ShieldAlert,
    title: "Slow Down a Little",
    cooldownLabel: "Cooldown Period",
  },
} as const;

const pad = (n: number) => n.toString().padStart(2, "0");

export default function RateLimitModal({
  isOpen,
  retryAfterSeconds,
  action,
  onClose,
}: RateLimitModalProps) {
  const [timeLeft, setTimeLeft] = useState(retryAfterSeconds);
  const [retryAt, setRetryAt] = useState<Date | null>(null);

  const isAuth = action === "auth";
  const theme = isAuth ? THEMES.auth : THEMES.default;
  const featureName = FEATURE_NAMES[action] ?? "System API";

  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(retryAfterSeconds);
    setRetryAt(new Date(Date.now() + retryAfterSeconds * 1000));
    const id = setInterval(() => setTimeLeft((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(id);
  }, [isOpen, retryAfterSeconds]);

  const progress =
    retryAfterSeconds > 0 ? Math.min(100, (timeLeft / retryAfterSeconds) * 100) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`w-full sm:max-w-md bg-white dark:bg-zinc-950 border ${theme.border} shadow-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden relative`}
          >
            {/* Auth lockouts are long, so always allow dismissing the dialog */}
            {isAuth && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 z-10 p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="p-6 sm:p-8 text-center relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${theme.bar}`} />
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 ${theme.glow} blur-[50px] rounded-full pointer-events-none`} />

              <div className={`w-16 h-16 mx-auto border ${theme.iconWrap} rounded-2xl flex items-center justify-center mb-5 ${isAuth ? "" : "rotate-3"}`}>
                <theme.Icon className="w-8 h-8" />
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight mb-2">
                {theme.title}
              </h3>

              {isAuth ? (
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Too many login or registration attempts. For your security, this is paused for a few minutes.
                </p>
              ) : (
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  You have made too many requests for{" "}
                  <strong className="text-zinc-900 dark:text-zinc-200">{featureName}</strong>. Try again in a moment.
                </p>
              )}
            </div>

            <div className="px-6 sm:px-8 pb-8">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Hourglass className={`w-5 h-5 ${timeLeft > 0 ? `${theme.timerIcon} animate-pulse` : "text-emerald-500"}`} />
                    <span className="font-bold text-zinc-700 dark:text-zinc-300 text-sm">
                      {theme.cooldownLabel}
                    </span>
                  </div>
                  <div className="font-mono font-black text-lg text-zinc-900 dark:text-white">
                    {pad(Math.floor(timeLeft / 60))}:{pad(timeLeft % 60)}
                  </div>
                </div>

                <div className="mt-3 h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${theme.progress} transition-[width] duration-1000 ease-linear`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {isAuth && retryAt && (
                  <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 text-left">
                    You can try again at{" "}
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {retryAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </p>
                )}
              </div>

              <button
                onClick={onClose}
                disabled={timeLeft > 0}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-zinc-200 dark:border-zinc-800"
              >
                {timeLeft > 0 ? (
                  <><AlertOctagon className="w-4 h-4" /> Please Wait...</>
                ) : isAuth ? (
                  "Try Again"
                ) : (
                  "Acknowledge & Close"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}