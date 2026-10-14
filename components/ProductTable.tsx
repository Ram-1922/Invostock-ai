"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lowStockAlert: number;
}

interface ProductTableProps {
  products: Product[];
  onBulkDelete?: (ids: string[]) => void;
  onRowClick?: (productId: string) => void;
}

export default function ProductTable({ products, onBulkDelete, onRowClick }: ProductTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(products.map(p => p.id)));
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
  if (products.length === 0) {
    return <div className="p-8 sm:p-12 text-center text-zinc-500 dark:text-zinc-400 glass-card text-sm sm:text-base">No products found in inventory.</div>;
  }

  return (
    <div className="glass-card overflow-hidden">
      {selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-8 py-4 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-900/30 transition-all duration-300">
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{selectedIds.size} products selected</span>
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
        <table className="w-full text-sm text-left text-zinc-600 dark:text-zinc-300 min-w-[700px]">
          <thead className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-50/80 dark:bg-zinc-900/80 border-b border-zinc-200/80 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3 sm:px-6 sm:py-4 w-12 text-center whitespace-nowrap">
                <input type="checkbox" checked={selectedIds.size === products.length && products.length > 0} onChange={toggleSelectAll} className="w-4 h-4 accent-primary-500 cursor-pointer" />
              </th>
              <th className="px-3 py-3 sm:px-4 sm:py-4 font-bold tracking-wider text-center w-16 whitespace-nowrap">S.No</th>
              <th className="px-4 py-3 sm:px-8 sm:py-4 font-bold tracking-wider whitespace-nowrap">Product Name</th>
              <th className="px-4 py-3 sm:px-8 sm:py-4 font-bold tracking-wider whitespace-nowrap">SKU</th>
              <th className="px-4 py-3 sm:px-8 sm:py-4 font-bold tracking-wider whitespace-nowrap">Stock Level</th>
              <th className="px-4 py-3 sm:px-8 sm:py-4 font-bold tracking-wider whitespace-nowrap">Unit Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
            {products.map((product, index) => (
              <tr 
                key={product.id} 
                onClick={() => onRowClick && onRowClick(product.id)}
                className={`transition-colors cursor-pointer group ${selectedIds.has(product.id) ? "bg-primary-500/5 dark:bg-primary-500/10" : "hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"}`}
              >
                <td className="px-4 py-4 sm:px-6 sm:py-5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedIds.has(product.id)} onChange={() => toggleSelect(product.id)} className="w-4 h-4 accent-primary-500 cursor-pointer" />
                </td>
                <td className="px-3 py-4 sm:px-4 sm:py-5 text-center font-bold text-zinc-400 dark:text-zinc-500 whitespace-nowrap">{index + 1}</td>
                <td className="px-4 py-4 sm:px-8 sm:py-5 font-bold text-zinc-900 dark:text-white whitespace-nowrap">{product.name}</td>
                <td className="px-4 py-4 sm:px-8 sm:py-5 text-zinc-500 dark:text-zinc-400 font-mono whitespace-nowrap">{product.sku}</td>
                <td className="px-4 py-4 sm:px-8 sm:py-5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 sm:px-3 py-1 rounded-full font-bold text-[10px] sm:text-xs ${product.quantity <= product.lowStockAlert ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-primary-500/10 text-primary-500"}`}>
                      {product.quantity} Units
                    </span>
                    {product.quantity <= product.lowStockAlert && (
                      <span title="Low stock alert" className="flex items-center animate-pulse">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 sm:px-8 sm:py-5 font-semibold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">{Number(product.unitPrice).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}