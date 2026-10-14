"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowUpRight, Trash2 } from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  supplier: string;
  invoiceDate: Date | string;
  totalAmount: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
}

export default function InvoiceTable({ invoices, onBulkDelete }: { invoices: Invoice[], onBulkDelete?: (ids: string[]) => void }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectAll = () => {
    if (selectedIds.size === invoices.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(invoices.map(i => i.id)));
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  if (invoices.length === 0) {
    return <div className="p-8 sm:p-12 text-center text-zinc-500 dark:text-zinc-400 glass-card text-sm sm:text-base">No invoices recorded yet.</div>;
  }

  return (
    <div className="glass-card overflow-hidden">
      {selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-8 py-4 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-900/30 transition-all duration-300">
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{selectedIds.size} invoices selected</span>
          <button 
            onClick={handleDelete} 
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shadow-sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected
          </button>
        </div>
      )}

      {/* Horizontal scroll wrapper for mobile */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-zinc-600 dark:text-zinc-300 min-w-[800px]">
          <thead className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-50/80 dark:bg-zinc-900/80 border-b border-zinc-200/80 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3 sm:px-6 sm:py-4 w-12 text-center whitespace-nowrap">
                <input type="checkbox" checked={selectedIds.size === invoices.length && invoices.length > 0} onChange={toggleSelectAll} className="w-4 h-4 accent-primary-500 cursor-pointer" />
              </th>
              <th className="px-3 py-3 sm:px-4 sm:py-4 font-bold tracking-wider text-center w-16 whitespace-nowrap">S.No</th>
              <th className="px-4 py-3 sm:px-8 sm:py-4 font-bold tracking-wider whitespace-nowrap">Date</th>
              <th className="px-4 py-3 sm:px-8 sm:py-4 font-bold tracking-wider whitespace-nowrap">Invoice #</th>
              <th className="px-4 py-3 sm:px-8 sm:py-4 font-bold tracking-wider whitespace-nowrap">Supplier</th>
              <th className="px-4 py-3 sm:px-8 sm:py-4 font-bold tracking-wider whitespace-nowrap">Total</th>
              <th className="px-4 py-3 sm:px-8 sm:py-4 font-bold tracking-wider whitespace-nowrap">Status</th>
              <th className="px-4 py-3 sm:px-8 sm:py-4 font-bold tracking-wider text-right whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
            {invoices.map((invoice, index) => (
              <tr key={invoice.id} className={`transition-colors group ${selectedIds.has(invoice.id) ? "bg-primary-500/5 dark:bg-primary-500/10" : "hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"}`}>
                <td className="px-4 py-4 sm:px-6 sm:py-5 text-center whitespace-nowrap">
                  <input type="checkbox" checked={selectedIds.has(invoice.id)} onChange={() => toggleSelect(invoice.id)} className="w-4 h-4 accent-primary-500 cursor-pointer" />
                </td>
                <td className="px-3 py-4 sm:px-4 sm:py-5 text-center font-bold text-zinc-400 dark:text-zinc-500 whitespace-nowrap">{index + 1}</td>
                <td className="px-4 py-4 sm:px-8 sm:py-5 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{format(new Date(invoice.invoiceDate), "MMM dd, yyyy")}</td>
                <td className="px-4 py-4 sm:px-8 sm:py-5 font-bold text-zinc-900 dark:text-white whitespace-nowrap">{invoice.invoiceNumber}</td>
                <td className="px-4 py-4 sm:px-8 sm:py-5 font-medium whitespace-nowrap">{invoice.supplier}</td>
                <td className="px-4 py-4 sm:px-8 sm:py-5 font-bold text-zinc-700 dark:text-zinc-200 whitespace-nowrap">{Number(invoice.totalAmount).toFixed(2)}</td>
                <td className="px-4 py-4 sm:px-8 sm:py-5 whitespace-nowrap">
                  <span className={`px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-bold rounded-full border ${
                    invoice.status === "CONFIRMED" ? "bg-primary-500/10 text-primary-500 border-primary-500/20" :
                    invoice.status === "PENDING" ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400" :
                    "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-4 py-4 sm:px-8 sm:py-5 text-right whitespace-nowrap">
                  <Link href={`/invoices/${invoice.id}`} title="View Details" className="inline-flex items-center justify-center p-2 rounded-full text-zinc-400 hover:text-primary-500 hover:bg-primary-500/10 transition-colors">
                    <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}