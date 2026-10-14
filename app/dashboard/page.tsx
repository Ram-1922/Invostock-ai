"use client";

import { useEffect, useState } from "react";
import { useApiClient } from "@/hooks/useApiClient";
import InvoiceTable from "@/components/InvoiceTable";
import InvoiceCardGrid from "@/components/ui/InvoiceCardGrid";
import { Package, AlertTriangle, FileText, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const api = useApiClient();

  useEffect(() => {
    const cached = sessionStorage.getItem("dashboardData");
    if (cached) {
      try {
        setData(JSON.parse(cached));
      } catch {
        sessionStorage.removeItem("dashboardData");
      }
    }

    api.get("/api/dashboard")
      .then((res) => {
        if (api.signal.aborted) return;
        setData(res.data);
        sessionStorage.setItem("dashboardData", JSON.stringify(res.data));
      })
      .catch((err) => {
        if (!api.isAbortError(err)) console.error(err);
      });
  }, []);

  const recentInvoices: any[] = data?.recentInvoices ?? [];

  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-7xl mx-auto p-4 sm:p-6 xl:p-8 max-md:pb-24">
      <h1 className="text-3xl max-xl:text-2xl font-black text-zinc-900 dark:text-zinc-50 mb-8 max-xl:mb-5 tracking-tight">
        Dashboard Overview
      </h1>

      {data ? (
        <div className="grid grid-cols-1 gap-6 max-xl:gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Stat cards: 1 col on phones, 2 on sm, 3 on xl */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 max-xl:gap-3">

            <div className="min-w-0 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5 max-xl:gap-3 p-6 max-xl:p-4 glass-card xl:hover:scale-[1.02] transition-transform">
              <div className="p-4 max-xl:p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm">
                <Package className="w-8 h-8 max-xl:w-6 max-xl:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs max-xl:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 max-xl:mb-0.5">
                  Total Products
                </p>
                <p className="text-3xl max-xl:text-2xl font-black text-zinc-900 dark:text-white truncate">
                  {data.totalProducts}
                </p>
              </div>
            </div>

            <div className="min-w-0 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5 max-xl:gap-3 p-6 max-xl:p-4 glass-card xl:hover:scale-[1.02] transition-transform">
              <div className="p-4 max-xl:p-2.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl shadow-sm">
                <AlertTriangle className="w-8 h-8 max-xl:w-6 max-xl:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs max-xl:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 max-xl:mb-0.5">
                  Low Stock Alerts
                </p>
                <p className="text-3xl max-xl:text-2xl font-black text-red-600 dark:text-red-400 truncate">
                  {data.lowStockProducts}
                </p>
              </div>
            </div>

            <div className="min-w-0 sm:col-span-2 xl:col-span-1 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5 max-xl:gap-3 p-6 max-xl:p-4 glass-card xl:hover:scale-[1.02] transition-transform">
              <div className="p-4 max-xl:p-2.5 bg-primary-500/10 text-primary-500 rounded-2xl shadow-sm">
                <FileText className="w-8 h-8 max-xl:w-6 max-xl:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs max-xl:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 max-xl:mb-0.5">
                  Total Invoices
                </p>
                <p className="text-3xl max-xl:text-2xl font-black text-zinc-900 dark:text-white truncate">
                  {data.totalInvoices}
                </p>
              </div>
            </div>

          </div>

          {/* Recent Invoices */}
          <section className="grid grid-cols-1 gap-3 sm:gap-4 mt-4 max-xl:mt-0">
            <h2 className="text-xl max-xl:text-lg font-bold text-zinc-900 dark:text-white">
              Recent Invoices
            </h2>

            {/* Table only on xl+ screens */}
            <div className="max-xl:hidden">
              <InvoiceTable invoices={recentInvoices} />
            </div>

            {/* Card grid on phones and tablets */}
            <div className="xl:hidden">
              <InvoiceCardGrid invoices={recentInvoices} />
            </div>
          </section>
        </div>
      ) : (
        <div className="grid place-items-center py-16 sm:py-24 xl:py-32 text-center px-4">
          <div className="grid justify-items-center gap-4">
            <Loader2 className="w-10 h-10 max-xl:w-8 max-xl:h-8 text-primary-500 animate-spin" />
            <p className="text-base max-xl:text-sm text-zinc-500 dark:text-zinc-400 font-bold">
              Loading dashboard metrics...
            </p>
          </div>
        </div>
      )}
    </main>
  );
}