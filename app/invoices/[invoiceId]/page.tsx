"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useApiClient } from "@/hooks/useApiClient";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

function InvoiceDetailContent({ params }: { params: Promise<{ invoiceId: string }> }) {
  const resolvedParams = use(params);
  const invoiceId = resolvedParams.invoiceId;

  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const api = useApiClient();

  useEffect(() => {
    if (!invoiceId) {
      setError("Invalid invoice ID in the URL.");
      setIsLoading(false);
      return;
    }

    api.get(`/api/invoices/${invoiceId}`)
      .then((res) => {
        if (api.signal.aborted) return;
        setInvoice(res.data);
        setError(null);
      })
      .catch((err) => {
        if (api.isAbortError(err)) return;
        if (err.response?.status === 404) {
          notFound();
        }
        setError(err.response?.data?.error || "Failed to load invoice details.");
      })
      .finally(() => {
        if (!api.signal.aborted) setIsLoading(false);
      });
  }, [invoiceId]);

  if (isLoading) {
    return (
      <main className="p-4 sm:p-6 xl:p-8 grid place-items-center flex-1">
        <div className="grid justify-items-center">
          <div className="w-10 h-10 border-4 border-[#10b983] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-center">Loading invoice details...</p>
        </div>
      </main>
    );
  }

  if (error || !invoice) {
    return (
      <main className="p-4 sm:p-6 xl:p-8 grid place-items-center flex-1">
        <div className="grid justify-items-center max-w-md text-center glass-card p-10 max-xl:p-6">
          <AlertCircle className="w-16 h-16 max-xl:w-12 max-xl:h-12 text-red-500 mb-4" />
          <h2 className="text-xl max-xl:text-lg font-bold text-slate-800 dark:text-white mb-2">Oops! Something went wrong</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-xl:text-sm break-words">{error}</p>
          <Link href="/invoices" className="btn-secondary inline-flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Invoices
          </Link>
        </div>
      </main>
    );
  }

  const dynamicFields = invoice.dynamicFields ? (invoice.dynamicFields as Record<string, string>) : {};
  const hasDynamicFields = Object.keys(dynamicFields).length > 0;
  const items: any[] = invoice.items ?? [];

  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 xl:p-8 max-md:pb-24 max-w-5xl mx-auto w-full">
      {/* Header: back button + title */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 max-xl:gap-3 mb-6 max-xl:mb-4">
        <Link
          href="/invoices"
          aria-label="Back to invoices"
          className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors inline-flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Link>
        <h1 className="text-xl sm:text-2xl xl:text-3xl font-black text-slate-800 dark:text-white break-words">
          Invoice: {invoice.invoiceNumber}
        </h1>
      </div>

      {/* Summary card: 2 columns on phones, 4 from md up */}
      <div className="glass-card p-6 max-xl:p-4 mb-8 max-xl:mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-xl:gap-4">
          <div className="col-span-2 md:col-span-1 min-w-0">
            <p className="text-sm max-xl:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Supplier</p>
            <p className="font-bold text-slate-900 dark:text-white text-lg max-xl:text-base break-words">{invoice.supplier}</p>
          </div>
          <div className="min-w-0">
            <p className="text-sm max-xl:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Amount</p>
            <p className="font-bold text-[#10b983] text-lg max-xl:text-base">{Number(invoice.totalAmount).toFixed(2)}</p>
          </div>
          <div className="min-w-0">
            <p className="text-sm max-xl:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Date</p>
            <p className="font-bold text-slate-900 dark:text-white text-lg max-xl:text-base">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
          </div>
          <div className="col-span-2 md:col-span-1 min-w-0">
            <p className="text-sm max-xl:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Status</p>
            <span className="inline-block px-3 py-1 bg-[#10b983]/10 text-[#10b983] font-bold text-sm rounded-full border border-[#10b983]/20 mt-1">
              {invoice.status}
            </span>
          </div>
        </div>

        {hasDynamicFields && (
          <div className="mt-6 pt-6 max-xl:mt-4 max-xl:pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm max-xl:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 max-xl:mb-3">Additional Information</h3>
            {/* 1 column on phones, 2 on sm, 4 on lg */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-xl:gap-3">
              {Object.entries(dynamicFields).map(([key, value]) => (
                <div key={key} className="min-w-0 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate mb-0.5" title={key}>{key}</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm break-words sm:truncate" title={value as string}>{value as string}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <h2 className="text-xl max-xl:text-lg font-bold text-slate-800 dark:text-white mb-4 max-xl:mb-3">Line Items</h2>

      {/* Table from md up */}
      <div className="glass-card overflow-hidden max-md:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 uppercase text-xs text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-8 max-xl:px-4 py-4 font-bold tracking-wider w-16 text-center">S.No</th>
                <th className="px-8 max-xl:px-4 py-4 font-bold tracking-wider">Product</th>
                <th className="px-8 max-xl:px-4 py-4 font-bold tracking-wider text-center">Quantity</th>
                <th className="px-8 max-xl:px-4 py-4 font-bold tracking-wider text-right">Unit Price</th>
                <th className="px-8 max-xl:px-4 py-4 font-bold tracking-wider text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
              {items.map((item: any, index: number) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-8 max-xl:px-4 py-4 text-center font-bold text-slate-400 dark:text-slate-500">{index + 1}</td>
                  <td className="px-8 max-xl:px-4 py-4 font-bold text-slate-900 dark:text-white">{item.productName}</td>
                  <td className="px-8 max-xl:px-4 py-4 text-center font-semibold">
                    <span className="bg-[#10b983]/10 text-[#10b983] px-3 py-1 rounded-full">{item.quantity}</span>
                  </td>
                  <td className="px-8 max-xl:px-4 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">{Number(item.unitPrice).toFixed(2)}</td>
                  <td className="px-8 max-xl:px-4 py-4 font-bold text-slate-900 dark:text-white text-right">{Number(item.lineTotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card grid on phones: 1 column, 2 on sm */}
      <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item: any, index: number) => (
          <div key={item.id} className="glass-card p-4 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-3">
            <span className="w-7 h-7 grid place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
              {index + 1}
            </span>
            <p className="font-bold text-slate-900 dark:text-white break-words">{item.productName}</p>

            <div className="col-span-full grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-[11px] font-bold text-slate-400 mb-1">Qty</p>
                <span className="inline-block bg-[#10b983]/10 text-[#10b983] text-sm font-semibold px-2.5 py-0.5 rounded-full">{item.quantity}</span>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-slate-400 mb-1">Unit price</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{Number(item.unitPrice).toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-slate-400 mb-1">Total</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{Number(item.lineTotal).toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="glass-card p-8 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
          This invoice has no line items.
        </div>
      )}
    </main>
  );
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  return (
    <Suspense fallback={
      <div className="grid h-screen w-full place-items-center bg-transparent">
        <div className="grid justify-items-center">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
          <p className="text-slate-500 font-bold">Loading Invoice Details...</p>
        </div>
      </div>
    }>
      <InvoiceDetailContent params={params} />
    </Suspense>
  );
}