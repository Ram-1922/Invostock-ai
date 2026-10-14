"use client";

import { useState, useEffect } from "react";
import {
  LogOut, User, Moon, Sun, Mail, Phone, MapPin, Fingerprint, Edit, Globe,
  LayoutDashboard, Package, FileText,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useApiClient } from "@/hooks/useApiClient";
import EditProfileModal from "./EditProfileModal";
import { cn } from "@/_lib/utils";

const NAV_ITEMS = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Inventory", path: "/inventory", icon: Package },
  { name: "Invoices", path: "/invoices", icon: FileText },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [localLanguage, setLocalLanguage] = useState("English");

  const api = useApiClient();

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark" || (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    }

    const cachedLang = localStorage.getItem("languagePreference");
    if (cachedLang) setLocalLanguage(cachedLang);
    else localStorage.setItem("languagePreference", "English");

    api.get("/api/auth/me")
      .then((res) => {
        if (api.signal.aborted) return;
        setUserProfile(res.data);
      })
      .catch((err) => {
        if (api.isAbortError(err)) return;
        // If unauthorized, silently redirect to login instead of crashing
        if (err.response?.status === 401) {
          sessionStorage.clear();
          router.push("/login");
        } else {
          console.error("Failed to load profile", err);
        }
      });
  }, [router]);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  };

  const handleLogout = async () => {
    try {
      sessionStorage.clear();
      await api.post("/api/auth/logout");
      if (api.signal.aborted) return;
      router.push("/");
      router.refresh();
    } catch (error) {
      if (api.isAbortError(error)) return;
      console.error("Logout failed", error);
    }
  };

  const handleProfileUpdated = (updatedData: any) => {
    setUserProfile(updatedData);
    setLocalLanguage(localStorage.getItem("languagePreference") || "English");
    setIsEditModalOpen(false);
  };

  return (
    <>
      {/* Click-away layer. Kept outside the header so it covers the whole screen, not just the header. */}
      {isDropdownOpen && <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)} />}

      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-6 py-4 mx-4 mt-4 max-xl:px-4 max-xl:py-3 max-md:mx-2 max-md:mt-2 bg-white/70 dark:bg-zinc-950/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm"
      >
        {/* Left: logo + desktop links (links are replaced by the bottom bar below md) */}
        <div className="grid grid-flow-col auto-cols-max items-center gap-8 max-xl:gap-4">
          <h2 className="text-xl max-sm:text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-teal-600">
            InvoStock AI
          </h2>

          <nav className="max-md:hidden grid grid-flow-col auto-cols-max items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.path);
              return (
                <Link key={item.name} href={item.path} className="relative px-4 max-xl:px-3 py-2 text-sm font-semibold transition-colors">
                  <span className={cn("relative z-10", isActive ? "text-primary-700 dark:text-primary-300" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white")}>
                    {item.name}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-primary-500/10 dark:bg-primary-500/20 rounded-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: theme toggle + profile */}
        <div className="grid grid-flow-col auto-cols-max items-center gap-3 max-sm:gap-1.5 relative z-40">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label="Open profile menu"
              className="grid grid-flow-col auto-cols-max items-center gap-2 px-3 py-1.5 max-sm:p-1.5 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700 transition-colors"
            >
              <div className="p-1 bg-primary-500/20 text-primary-500 rounded-full">
                <User className="w-4 h-4" />
              </div>
              {/* Name is hidden on phones to save space */}
              <span className="max-sm:hidden max-w-[10rem] truncate text-sm font-semibold text-zinc-700 dark:text-zinc-200 mr-1">
                {userProfile?.name || "Loading..."}
              </span>
            </button>

            {isDropdownOpen && userProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-72 max-sm:w-[calc(100vw-2.5rem)] max-h-[80vh] overflow-y-auto glass-card bg-white/95 dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-800"
              >
                <div className="p-4 bg-gradient-to-br from-primary-500/10 to-teal-500/5 border-b border-zinc-200 dark:border-zinc-800 relative">
                  <button
                    onClick={() => { setIsDropdownOpen(false); setIsEditModalOpen(true); }}
                    className="absolute top-4 right-4 p-1.5 bg-white dark:bg-zinc-800 text-zinc-500 hover:text-primary-500 rounded-full shadow-sm transition-colors"
                    title="Edit Account"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <p className="font-bold text-foreground text-lg pr-8 truncate">{userProfile.name}</p>
                  <div className="flex items-center text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-1">
                    <Fingerprint className="w-3 h-3 mr-1" />
                    ID: {userProfile.id.split("-")[0]}...
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 p-4">
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 text-sm">
                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg text-zinc-400"><Mail className="w-4 h-4" /></div>
                    <div className="text-zinc-600 dark:text-zinc-300">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Email</p>
                      <p className="font-medium truncate">{userProfile.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 text-sm">
                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg text-zinc-400"><Phone className="w-4 h-4" /></div>
                    <div className="text-zinc-600 dark:text-zinc-300">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Phone</p>
                      <p className="font-medium">{userProfile.phone}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 text-sm">
                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg text-zinc-400"><MapPin className="w-4 h-4" /></div>
                    <div className="text-zinc-600 dark:text-zinc-300">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Location</p>
                      <p className="font-medium">{userProfile.city} - {userProfile.pincode}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 text-sm pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg text-zinc-400"><Globe className="w-4 h-4" /></div>
                    <div className="text-zinc-600 dark:text-zinc-300">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">App Language</p>
                      <p className="font-medium">{localLanguage}</p>
                    </div>
                  </div>
                </div>

                <div className="p-2 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-bold text-red-500 hover:text-white bg-transparent hover:bg-red-500 rounded-xl transition-all duration-300"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.header>

      {/* Mobile navigation buttons: floating bottom bar, shown only below md */}
      <nav
        aria-label="Primary"
        className="md:hidden fixed inset-x-3 z-40 grid grid-cols-3 gap-1 p-1.5 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-lg"
        style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.path}
              aria-current={isActive ? "page" : undefined}
              className="relative grid justify-items-center gap-0.5 py-2 rounded-xl text-[11px] font-semibold transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute inset-0 bg-primary-500/10 dark:bg-primary-500/20 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon
                className={cn(
                  "relative z-10 w-5 h-5",
                  isActive ? "text-primary-700 dark:text-primary-300" : "text-zinc-500"
                )}
              />
              <span
                className={cn(
                  "relative z-10",
                  isActive ? "text-primary-700 dark:text-primary-300" : "text-zinc-500"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {isEditModalOpen && (
        <EditProfileModal
          initialData={userProfile}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleProfileUpdated}
        />
      )}
    </>
  );
}