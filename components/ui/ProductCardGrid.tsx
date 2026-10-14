"use client";

import { useEffect, useState } from "react";
import { Check, Trash2 } from "lucide-react";

interface ProductCardGridProps {
  products: any[];
  onBulkDelete?: (ids: string[]) => void;
  onRowClick?: (id: string) => void;
}

const formatMoney = (value: unknown) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function ProductCardGrid({ products, onBulkDelete, onRowClick }: ProductCardGridProps) {
  const selectable = Boolean(onBulkDelete);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Drop selections for products that no longer exist (e.g. after a delete or filter change)
  useEffect(() => {
    const ids = new Set(products.map((p) => p.id));
    setSelected((prev) => {
      const next = Array.from(prev).filter((id) => ids.has(id));
      return next.length === prev.size ? prev : new Set(next);
    });
  }, [products]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = products.length > 0 && selected.size === products.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(products.map((p) => p.id)));

  if (products.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-sm font-bold text-zinc-500 dark:text-zinc-400">
        No products match your filters.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {selectable && (
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-1">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
            {selected.size} / {products.length} selected
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
        {products.map((p) => {
          const isSelected = selected.has(p.id);
          const isLow = Number(p.quantity) <= Number(p.lowStockAlert);
          return (
            <div
              key={p.id}
              onClick={() => onRowClick?.(p.id)}
              className={`glass-card p-4 grid gap-x-3 gap-y-3 items-start border transition-colors ${
                onRowClick ? "cursor-pointer" : ""
              } ${selectable ? "grid-cols-[auto_minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)_auto]"} ${
                isSelected ? "border-emerald-500/40 bg-emerald-500/5" : "border-transparent"
              }`}
            >
              {selectable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(p.id);
                  }}
                  aria-label={`Select ${p.name}`}
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
                <p className="font-black text-zinc-900 dark:text-zinc-50 truncate">{p.name}</p>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 truncate">SKU: {p.sku}</p>
              </div>

              {isLow && (
                <span className="px-2 py-1 rounded-lg text-[10px] font-bold tracking-wide bg-red-500/10 text-red-600 dark:text-red-400">
                  Low stock
                </span>
              )}

              <div className="col-span-full grid grid-cols-2 gap-3 pt-3 border-t border-zinc-200/70 dark:border-zinc-800/70">
                <div>
                  <p className="text-[11px] font-bold text-zinc-400 mb-0.5">In stock</p>
                  <p
                    className={`text-sm font-black ${
                      isLow ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {p.quantity} units
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-zinc-400 mb-0.5">Unit price</p>
                  <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">{formatMoney(p.unitPrice)}</p>
                </div>
              </div>
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