"use client";

import { useMemo, memo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutDashboard, Package, FileText } from "lucide-react";
import { cn } from "@/_lib/utils";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { name: "Inventory", icon: Package, path: "/inventory" },
  { name: "Invoices", icon: FileText, path: "/invoices" },
];

const NavigationMenu = () => {
  const pathname = usePathname();

  const renderedLinks = useMemo(() => {
    return menuItems.map((item) => {
      const isActive = pathname.startsWith(item.path);
      const Icon = item.icon;

      return (
        <Link key={item.name} href={item.path} className="relative block">
          <span className={cn(
            "relative z-10 flex items-center gap-3 px-4 py-3 font-semibold text-sm transition-colors rounded-xl",
            isActive ? "text-primary-700 dark:text-primary-300" : "text-zinc-500 hover:text-foreground hover:bg-zinc-500/5"
          )}>
            <Icon className={cn("w-5 h-5", isActive && "text-primary-500")} />
            {item.name}
          </span>
          
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute inset-0 bg-primary-500/10 dark:bg-primary-500/20 border border-primary-500/20 rounded-xl"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
        </Link>
      );
    });
  }, [pathname]);

  return <nav className="space-y-2">{renderedLinks}</nav>;
};

const Sidebar = memo(function Sidebar() {
  return (
    <aside className="w-64 h-screen hidden lg:flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/50 backdrop-blur-2xl transition-colors z-20">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Package className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-foreground to-zinc-500">
            InvoStock
          </span>
        </div>

        <NavigationMenu />
      </div>

      <div className="mt-auto p-6">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary-500/10 to-teal-500/5 border border-primary-500/20">
          <h4 className="text-sm font-bold text-foreground mb-1">Pro Plan Active</h4>
          <p className="text-xs text-zinc-500 mb-3">You have 840 invoice scans remaining.</p>
          <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "65%" }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-primary-500 rounded-full"
            />
          </div>
        </div>
      </div>
    </aside>
  );
});

export default Sidebar;