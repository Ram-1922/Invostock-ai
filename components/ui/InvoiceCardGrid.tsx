"use client";

import { useEffect, useState } from "react";
import { Check, ChevronRight, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface InvoiceCardGridProps {
  invoices: any[];
  /** Pass this to turn on checkboxes + the bulk delete bar. Leave it out for a read-only list. */
  onBulkDelete?: (ids: string[]) => void;
}

const formatDate = (value: string) => {
  const d = new Date(value);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatMoney = (value: unknown) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const statusStyles: Record<string, string> = {
  CONFIRMED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export default function InvoiceCardGrid({ invoices, onBulkDelete }: InvoiceCardGridProps) {
  const router = useRouter();
  const selectable = Boolean(onBulkDelete);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Drop selections for invoices that no longer exist (e.g. after a delete or filter change)
  useEffect(() => {
    const ids = new Set(invoices.map((i) => i.id));
    setSelected((prev) => {
      const next = Array.from(prev).filter((id) => ids.has(id));
      return next.length === prev.size ? prev : new Set(next);
    });
  }, [invoices]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Opens the invoice detail page (app/invoices/[invoiceId])
  const openInvoice = (id: string) => router.push(`/invoices/${id}`);

  const allSelected = invoices.length > 0 && selected.size === invoices.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(invoices.map((i) => i.id)));

  if (invoices.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-sm font-bold text-zinc-500 dark:text-zinc-400">
        No invoices found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {selectable && (
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-1">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
            {selected.size} / {invoices.length} selected
          </span>
          <button
            type="button"
            onClick={toggleAll}
            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-md transition-colors"
          >
            {allSelected ? "Clear" : "Select All"}
          </button>
        </div>
      )}

      {/* 1 column on phones, 2 on sm, 3 on lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {invoices.map((inv) => {
          const isSelected = selected.has(inv.id);
          return (
            <div
              key={inv.id}
              role="link"
              tabIndex={0}
              aria-label={`Open invoice ${inv.invoiceNumber}`}
              onClick={() => openInvoice(inv.id)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openInvoice(inv.id);
                }
              }}
              className={`glass-card p-4 grid gap-x-3 gap-y-3 items-start border transition-colors cursor-pointer hover:border-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                selectable ? "grid-cols-[auto_minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)_auto]"
              } ${isSelected ? "border-emerald-500/40 bg-emerald-500/5" : "border-transparent"}`}
            >
              {selectable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(inv.id);
                  }}
                  aria-label={`Select invoice ${inv.invoiceNumber}`}
                  className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-emerald-500 border-emerald-500"
                      : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </button>
              )}

              <div className="min-w-0">
                <Link
                  href={`/invoices/${inv.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-black text-zinc-900 dark:text-zinc-50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate block"
                >
                  {inv.invoiceNumber}
                </Link>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 truncate">{inv.supplier}</p>
              </div>

              {inv.status && (
                <span
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-wide ${
                    statusStyles[inv.status] ?? "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  {inv.status}
                </span>
              )}

              <div className="col-span-full grid grid-cols-2 gap-3 pt-3 border-t border-zinc-200/70 dark:border-zinc-800/70">
                <div>
                  <p className="text-[11px] font-bold text-zinc-400 mb-0.5">Date</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{formatDate(inv.invoiceDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-zinc-400 mb-0.5">Total</p>
                  <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">{formatMoney(inv.totalAmount)}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openInvoice(inv.id);
                }}
                className="col-span-full inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
              >
                View details
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {selectable && selected.size > 0 && (
        <div className="sticky bottom-3 z-10 grid grid-cols-[1fr_auto] items-center gap-3 p-3 glass-card border border-red-500/20 shadow-lg">
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{selected.size} selected</span>
          <button
            type="button"
            onClick={() => onBulkDelete?.(Array.from(selected))}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}