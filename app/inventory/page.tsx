"use client";

import { useEffect, useState, useMemo } from "react";
import { useApiClient } from "@/hooks/useApiClient";
import ProductTable from "@/components/ProductTable";
import ProductCardGrid from "@/components/ui/ProductCardGrid";
import { Search, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("name_asc");
  const [showLowStock, setShowLowStock] = useState(false);

  const api = useApiClient();

  useEffect(() => {
    const savedFilters = sessionStorage.getItem("inventoryFilters");
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        setSearchQuery(parsed.searchQuery || "");
        setSortOption(parsed.sortOption || "name_asc");
        setShowLowStock(parsed.showLowStock || false);
      } catch { }
    }
    setIsLoaded(true);

    api.get("/api/inventory")
      .then((res) => {
        if (api.signal.aborted) return;
        setProducts(res.data);
      })
      .catch((err) => {
        if (!api.isAbortError(err)) console.error(err);
      });
  }, []);

  useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem("inventoryFilters", JSON.stringify({ searchQuery, sortOption, showLowStock }));
    }
  }, [searchQuery, sortOption, showLowStock, isLoaded]);

  const processedProducts = useMemo(() => {
    let result = [...products];
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(lowerQuery) || p.sku.toLowerCase().includes(lowerQuery));
    }
    if (showLowStock) result = result.filter(p => p.quantity <= p.lowStockAlert);

    result.sort((a, b) => {
      switch (sortOption) {
        case "name_asc": return a.name.localeCompare(b.name);
        case "name_desc": return b.name.localeCompare(a.name);
        case "stock_asc": return a.quantity - b.quantity;
        case "stock_desc": return b.quantity - a.quantity;
        case "price_asc": return Number(a.unitPrice) - Number(b.unitPrice);
        case "price_desc": return Number(b.unitPrice) - Number(a.unitPrice);
        default: return 0;
      }
    });
    return result;
  }, [products, searchQuery, sortOption, showLowStock]);

  const handleProductClick = (productId: string) => {
    localStorage.setItem("recentlyViewedProductId", productId);
  };

  // Sequential bulk delete — one at a time through the queue
  const handleBulkDelete = async (ids: string[]) => {
    if (!confirm(`Are you sure you want to delete ${ids.length} selected product(s)?`)) return;
    try {
      for (const id of ids) {
        if (api.signal.aborted) return;
        await api.del(`/api/inventory/${id}`);
      }
      if (!api.signal.aborted) {
        setProducts((prev) => prev.filter(p => !ids.includes(p.id)));
      }
    } catch (error) {
      if (!api.isAbortError(error)) alert("Failed to delete selected products");
    }
  };

  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 xl:p-8 max-md:pb-24">

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 gap-1 mb-8 max-xl:mb-5"
      >
        <h1 className="text-3xl max-xl:text-2xl font-black text-foreground">Inventory</h1>
        <p className="text-base max-xl:text-sm text-slate-500 font-medium">Manage your product catalog and stock levels.</p>
      </motion.div>

      {/* Search + filters: stacked on phones, side by side from md up */}
      <Card
        delay={0.1}
        className="grid grid-cols-1 md:grid-cols-[minmax(0,24rem)_auto] md:justify-between md:items-center gap-4 max-xl:gap-3 p-4 max-xl:p-3 mb-8 max-xl:mb-5"
      >
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            // text-base on mobile stops iOS from zooming in when the field is focused
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-border rounded-xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm max-md:text-base"
          />
        </div>

        <div className="grid grid-cols-[auto_minmax(0,1fr)] md:grid-cols-[auto_auto] items-center gap-4 xl:gap-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:text-foreground transition-colors whitespace-nowrap py-1">
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
              className="w-4 h-4 accent-red-500 rounded border-border"
            />
            Low Stock Only
          </label>

          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full min-w-0 bg-slate-50/50 dark:bg-slate-900/50 border border-border text-sm max-md:text-base font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary-500 cursor-pointer transition-all"
            >
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="stock_asc">Stock (Low-High)</option>
              <option value="stock_desc">Stock (High-Low)</option>
              <option value="price_asc">Price (Low-High)</option>
              <option value="price_desc">Price (High-Low)</option>
            </select>
          </div>
        </div>
      </Card>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        {/* Table only on xl+ screens */}
        <div className="max-xl:hidden">
          <ProductTable products={processedProducts} onBulkDelete={handleBulkDelete} onRowClick={handleProductClick} />
        </div>

        {/* Card grid on phones and tablets */}
        <div className="xl:hidden">
          <ProductCardGrid products={processedProducts} onBulkDelete={handleBulkDelete} onRowClick={handleProductClick} />
        </div>
      </motion.div>
    </main>
  );
}