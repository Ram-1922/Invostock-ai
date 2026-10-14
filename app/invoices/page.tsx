"use client";

import { useEffect, useState, useMemo } from "react";
import { useApiClient } from "@/hooks/useApiClient";
import InvoiceTable from "@/components/InvoiceTable";
import InvoiceCardGrid from "@/components/ui/InvoiceCardGrid";
import FileUpload from "@/components/FileUpload";
import ReviewModal from "@/components/ReviewModal";
import { Plus, ArrowLeft, AlertCircle, Loader2, Search, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function InvoicesPage() {
  const [activeView, setActiveView] = useState<"list" | "upload">("list");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [extractedData, setExtractedData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOption, setSortOption] = useState("date_desc");

  const api = useApiClient();

  useEffect(() => {
    const savedFilters = sessionStorage.getItem("invoiceFilters");
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        setSearchQuery(parsed.searchQuery || "");
        setStatusFilter(parsed.statusFilter || "ALL");
        setSortOption(parsed.sortOption || "date_desc");
      } catch { }
    }
    setIsLoaded(true);
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem("invoiceFilters", JSON.stringify({ searchQuery, statusFilter, sortOption }));
    }
  }, [searchQuery, statusFilter, sortOption, isLoaded]);

  const fetchInvoices = () => {
    api.get("/api/invoices")
      .then((res) => {
        if (api.signal.aborted) return;
        setInvoices(res.data);
      })
      .catch((err) => {
        if (!api.isAbortError(err)) console.error(err);
      });
  };

  const processedInvoices = useMemo(() => {
    let result = [...invoices];
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(i => i.invoiceNumber.toLowerCase().includes(lower) || i.supplier.toLowerCase().includes(lower));
    }
    if (statusFilter !== "ALL") result = result.filter(i => i.status === statusFilter);

    result.sort((a, b) => {
      switch (sortOption) {
        case "date_desc": return new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime();
        case "date_asc": return new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime();
        case "amount_desc": return Number(b.totalAmount) - Number(a.totalAmount);
        case "amount_asc": return Number(a.totalAmount) - Number(b.totalAmount);
        default: return 0;
      }
    });
    return result;
  }, [invoices, searchQuery, statusFilter, sortOption]);

  // Sequential bulk delete — one at a time through the queue
  const handleBulkDelete = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} selected invoice(s)?`)) return;
    try {
      for (const id of ids) {
        if (api.signal.aborted) return;
        await api.del(`/api/invoices/${id}`);
      }
      if (!api.signal.aborted) {
        setInvoices((prev) => prev.filter(inv => !ids.includes(inv.id)));
      }
    } catch (error) {
      if (!api.isAbortError(error)) alert("Failed to delete");
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/api/invoices/extract", formData);
      if (api.signal.aborted) return;
      setExtractedData(res.data);
    } catch (error: any) {
      if (api.isAbortError(error)) return;
      setErrorMessage(error.response?.data?.error || "Failed to extract invoice data.");
    } finally {
      if (!api.signal.aborted) setIsProcessing(false);
    }
  };

  const handleConfirmSave = async (confirmedData: any) => {
    try {
      await api.post("/api/invoices", confirmedData);
      if (api.signal.aborted) return;
      setExtractedData(null);
      setActiveView("list");
      fetchInvoices();
    } catch (error: any) {
      if (api.isAbortError(error)) return;
      setErrorMessage(error.response?.data?.error || "Failed to save the invoice.");
      setExtractedData(null);
    }
  };

  // text-base on mobile stops iOS from zooming in when a field is focused
  const selectClass =
    "w-full min-w-0 bg-slate-50/50 dark:bg-slate-900/50 border border-border text-sm max-md:text-base font-semibold rounded-xl px-3 max-md:px-2.5 py-2.5 focus:outline-none focus:border-primary-500 cursor-pointer";

  return (
    // overflow-x-hidden keeps the slide transitions from causing sideways scroll on phones
    <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 xl:p-8 max-md:pb-24 relative">
      <AnimatePresence mode="wait">
        {activeView === "list" ? (
          <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>

            {/* Header: title on the left, scan button on the right (shortened on phones) */}
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 mb-8 max-xl:mb-5">
              <div className="min-w-0">
                <h1 className="text-3xl max-xl:text-2xl font-black text-foreground">Invoices</h1>
                <p className="text-base max-xl:text-sm text-slate-500 font-medium">Process and track supplier invoices.</p>
              </div>
              <Button onClick={() => setActiveView("upload")} variant="primary">
                <Plus className="w-5 h-5 mr-2 max-sm:mr-1.5" />
                <span className="sm:hidden">Scan</span>
                <span className="max-sm:hidden">Scan Invoice</span>
              </Button>
            </div>

            {/* Search + filters: stacked on phones, side by side from md up */}
            <Card
              delay={0.1}
              className="grid grid-cols-1 md:grid-cols-[minmax(0,24rem)_auto] md:justify-between md:items-center gap-4 max-xl:gap-3 p-4 max-xl:p-3 mb-8 max-xl:mb-5"
            >
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search supplier or invoice no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-border rounded-xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm max-md:text-base"
                />
              </div>

              {/* 2 equal columns on phones, inline row from md up */}
              <div className="grid grid-cols-2 md:grid-cols-[auto_auto_auto] items-center gap-2 md:gap-4">
                <Filter className="w-4 h-4 text-slate-400 max-md:hidden" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={selectClass}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PENDING">Pending</option>
                </select>

                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className={selectClass}
                >
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="amount_desc">Amount (High-Low)</option>
                  <option value="amount_asc">Amount (Low-High)</option>
                </select>
              </div>
            </Card>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              {/* Table only on xl+ screens */}
              <div className="max-xl:hidden">
                <InvoiceTable invoices={processedInvoices} onBulkDelete={handleBulkDelete} />
              </div>

              {/* Card grid on phones and tablets */}
              <div className="xl:hidden">
                <InvoiceCardGrid invoices={processedInvoices} onBulkDelete={handleBulkDelete} />
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="upload" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 max-w-3xl mx-auto">
            <button
              onClick={() => { setActiveView("list"); setErrorMessage(null); }}
              className="justify-self-start flex items-center text-sm font-bold text-slate-500 hover:text-primary-500 transition-colors mb-6 max-xl:mb-4 py-2 group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Invoices
            </button>

            <h1 className="text-3xl max-xl:text-2xl font-black text-foreground mb-2">Scan Invoice</h1>
            <p className="text-base max-xl:text-sm text-slate-500 mb-8 max-xl:mb-5 font-medium">Upload a supplier invoice to automatically extract and update inventory stock.</p>

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 p-4 max-xl:p-3 mb-6 max-xl:mb-5 bg-red-500/10 border border-red-500/20 rounded-2xl"
              >
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-red-500">Processing Failed</h3>
                  <p className="text-sm text-red-500/80 mt-1 break-words">{errorMessage}</p>
                </div>
              </motion.div>
            )}

            <Card className="p-8 max-xl:p-4 border-primary-500/20 shadow-primary-500/5">
              {isProcessing ? (
                <div className="grid justify-items-center py-16 max-xl:py-10 text-center">
                  <div className="relative mb-6 max-xl:mb-5">
                    <div className="absolute inset-0 bg-primary-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                    <Loader2 className="w-12 h-12 max-xl:w-10 max-xl:h-10 text-primary-500 animate-spin relative z-10" />
                  </div>
                  <h3 className="text-xl max-xl:text-lg font-bold text-foreground mb-2">Extracting AI Data...</h3>
                  <p className="text-base max-xl:text-sm text-slate-500 max-w-sm">Reading text via OCR and using Qwen AI to structure your invoice. This may take a moment.</p>
                </div>
              ) : (
                <FileUpload onFileSelect={handleFileUpload} />
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      {extractedData && (
        <ReviewModal
          initialData={extractedData}
          onSave={handleConfirmSave}
          onRescan={() => { setExtractedData(null); setErrorMessage(null); }}
          onClose={() => setExtractedData(null)}
        />
      )}
    </main>
  );
}