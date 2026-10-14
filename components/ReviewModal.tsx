"use client";

import { useState, useEffect } from "react";
import { Check, Trash2, RefreshCw, Save, X } from "lucide-react";

interface InvoiceItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  sku: string;
}

interface InvoiceData {
  invoiceNumber: string;
  supplier: string;
  invoiceDate: string;
  totalAmount: number;
  dynamicFields?: Record<string, string>;
  items: InvoiceItem[];
}

interface ReviewModalProps {
  initialData: InvoiceData;
  onSave: (confirmedData: InvoiceData) => void;
  onRescan: () => void;
  onClose: () => void;
}

type MainField = "invoiceNumber" | "supplier" | "invoiceDate" | "totalAmount";

// Values a small model often writes when it has nothing real to put in a field
const PLACEHOLDERS = new Set([
  "",
  "n/a",
  "na",
  "null",
  "none",
  "undefined",
  "nil",
  "unknown",
  "not available",
  "not found",
  "not specified",
  "not provided",
  "-",
  "--",
  "—",
]);

const isEmptyValue = (v: unknown): boolean =>
  v === null ||
  v === undefined ||
  PLACEHOLDERS.has(String(v).trim().toLowerCase());

// Cleans any invoice data (fresh scan OR a saved draft) so empty fields never reach the UI
function sanitizeInvoice(data: InvoiceData): InvoiceData {
  const dynamicFields: Record<string, string> = {};
  for (const [key, value] of Object.entries(data.dynamicFields ?? {})) {
    if (!isEmptyValue(key) && !isEmptyValue(value)) {
      dynamicFields[key.trim()] = String(value).trim();
    }
  }

  const items = (Array.isArray(data.items) ? data.items : [])
    .filter((item) => !isEmptyValue(item?.productName) && Number(item?.quantity) > 0)
    .map((item) => ({
      productName: String(item.productName).trim(),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice) || 0,
      sku: isEmptyValue(item.sku) ? "" : String(item.sku).trim(),
    }));

  return {
    ...data,
    invoiceNumber: isEmptyValue(data.invoiceNumber) ? "" : String(data.invoiceNumber).trim(),
    supplier: isEmptyValue(data.supplier) ? "" : String(data.supplier).trim(),
    invoiceDate: /^\d{4}-\d{2}-\d{2}$/.test(String(data.invoiceDate ?? "").trim())
      ? String(data.invoiceDate).trim()
      : "",
    totalAmount: Number(data.totalAmount) > 0 ? Number(data.totalAmount) : 0,
    dynamicFields,
    items,
  };
}

// Decided once at load, so a box doesn't vanish while the user is typing/clearing it
function getVisibleMainFields(data: InvoiceData): Set<MainField> {
  const visible = new Set<MainField>();
  if (data.invoiceNumber) visible.add("invoiceNumber");
  if (data.supplier) visible.add("supplier");
  if (data.invoiceDate) visible.add("invoiceDate");
  if (data.totalAmount > 0) visible.add("totalAmount");
  return visible;
}

export default function ReviewModal({ initialData, onSave, onRescan, onClose }: ReviewModalProps) {
  // 1. Initialize & sanitize data (works for both a restored draft and a fresh scan)
  const [formData, setFormData] = useState<InvoiceData>(() => {
    if (typeof window !== "undefined") {
      const draft = sessionStorage.getItem("unsavedInvoiceDraft");
      if (draft) {
        try {
          return sanitizeInvoice(JSON.parse(draft));
        } catch {}
      }
    }
    return sanitizeInvoice(initialData);
  });

  // Which top-level fields actually have a value (only these get an input box)
  const [visibleMainFields] = useState<Set<MainField>>(() => getVisibleMainFields(formData));

  const [selectedItems, setSelectedItems] = useState<Set<number>>(
    new Set(formData.items.map((_, i) => i))
  );

  const [selectedDynamicFields, setSelectedDynamicFields] = useState<Set<string>>(
    new Set(Object.keys(formData.dynamicFields || {}))
  );

  useEffect(() => {
    sessionStorage.setItem("unsavedInvoiceDraft", JSON.stringify(formData));
  }, [formData]);

  const updateField = <K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateDynamicField = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      dynamicFields: { ...prev.dynamicFields, [key]: value },
    }));
  };

  const updateItem = (index: number, patch: Partial<InvoiceItem>) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };

  // Toggle individual item
  const toggleItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) newSelected.delete(index);
    else newSelected.add(index);
    setSelectedItems(newSelected);
  };

  // Master Select All / Deselect All
  const handleSelectAll = () => {
    if (selectedItems.size === formData.items.length) {
      setSelectedItems(new Set()); // Deselect all
    } else {
      setSelectedItems(new Set(formData.items.map((_, i) => i))); // Select all
    }
  };

  const toggleDynamicField = (key: string) => {
    const newSelected = new Set(selectedDynamicFields);
    if (newSelected.has(key)) newSelected.delete(key);
    else newSelected.add(key);
    setSelectedDynamicFields(newSelected);
  };

  const handleSave = () => {
    const confirmedDynamicFields: Record<string, string> = {};
    if (formData.dynamicFields) {
      Object.keys(formData.dynamicFields).forEach((key) => {
        const value = formData.dynamicFields![key];
        // Never save a field that is deselected or ended up empty
        if (selectedDynamicFields.has(key) && !isEmptyValue(value)) {
          confirmedDynamicFields[key] = value;
        }
      });
    }

    const confirmedData = {
      ...formData,
      dynamicFields: confirmedDynamicFields,
      items: formData.items.filter((_, i) => selectedItems.has(i)),
    };

    sessionStorage.removeItem("unsavedInvoiceDraft");
    onSave(confirmedData);
  };

  const handleRescan = () => {
    sessionStorage.removeItem("unsavedInvoiceDraft");
    onRescan();
  };

  const labelClass =
    "block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1";
  const mainInputClass =
    "w-full bg-transparent font-bold text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-b-2 focus:border-emerald-500 rounded-none py-1 text-sm sm:text-base";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      {/* Resized from max-w-4xl to max-w-3xl for a more compact UI */}
      <div className="w-full sm:max-w-3xl max-h-[75vh] sm:max-h-[70vh] flex flex-col bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300">

        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              Review Invoice Data
            </h2>
            <p className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
              Verify details before adding to inventory
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* Main Key Details Grid (only fields that have a value) */}
          {visibleMainFields.size > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl">
              {visibleMainFields.has("invoiceNumber") && (
                <div className="col-span-2 md:col-span-1">
                  <label className={labelClass}>Invoice Number</label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => updateField("invoiceNumber", e.target.value)}
                    className={mainInputClass}
                  />
                </div>
              )}
              {visibleMainFields.has("supplier") && (
                <div className="col-span-2 md:col-span-1">
                  <label className={labelClass}>Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => updateField("supplier", e.target.value)}
                    className={mainInputClass}
                  />
                </div>
              )}
              {visibleMainFields.has("invoiceDate") && (
                <div>
                  <label className={labelClass}>Date</label>
                  <input
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => updateField("invoiceDate", e.target.value)}
                    className={mainInputClass}
                  />
                </div>
              )}
              {visibleMainFields.has("totalAmount") && (
                <div>
                  <label className={labelClass}>Total Amount</label>
                  <input
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => updateField("totalAmount", parseFloat(e.target.value) || 0)}
                    className={mainInputClass}
                  />
                </div>
              )}
            </div>
          )}

          {/* Dynamic Extracted Fields (only fields that have a value) */}
          {formData.dynamicFields && Object.keys(formData.dynamicFields).length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3">
                Additional Extracted Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.entries(formData.dynamicFields).map(([key, value]) => {
                  const isSelected = selectedDynamicFields.has(key);
                  return (
                    <div key={key} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${isSelected ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30" : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 opacity-60"}`}>
                      <button type="button" onClick={() => toggleDynamicField(key)} className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? "bg-emerald-500 border-emerald-500" : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"}`}>
                        {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </button>
                      <div className="flex-1 overflow-hidden flex items-center justify-between gap-2">
                        <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 truncate w-1/3">
                          {key}
                        </label>
                        <input
                          type="text"
                          value={value}
                          disabled={!isSelected}
                          onChange={(e) => updateDynamicField(key, e.target.value)}
                          className="w-2/3 bg-transparent font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-b-2 focus:border-emerald-500 disabled:text-zinc-400 text-sm truncate text-right"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scanned Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Scanned Products
                </h3>
                {/* SELECT ALL BUTTON */}
                <button
                  onClick={handleSelectAll}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 bg-emerald-500/10 px-2 py-1 rounded-md transition-colors"
                >
                  {selectedItems.size === formData.items.length ? "Deselect All" : "Select All"}
                </button>
              </div>
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                {selectedItems.size} / {formData.items.length} selected
              </span>
            </div>

            <div className="space-y-3">
              {formData.items.length === 0 ? (
                <div className="p-8 text-center text-sm font-bold text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl">
                  No valid products were extracted from this invoice.
                </div>
              ) : (
                formData.items.map((item, index) => {
                  const isSelected = selectedItems.has(index);
                  return (
                    <div key={index} className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 ${isSelected ? "bg-white dark:bg-zinc-900/80 border-emerald-500/30 shadow-sm" : "bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800/80 opacity-50"}`}>

                      {/* Checkbox Header */}
                      <div className="flex items-center justify-between sm:justify-start gap-3">
                        <button type="button" onClick={() => toggleItem(index)} className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? "bg-emerald-500 border-emerald-500" : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"}`}>
                          {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                        </button>
                        <button type="button" onClick={() => toggleItem(index)} className="sm:hidden p-1 text-zinc-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Inputs Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 flex-1">
                        <div className="sm:col-span-6">
                          <input
                            type="text"
                            value={item.productName}
                            onChange={(e) => updateItem(index, { productName: e.target.value })}
                            disabled={!isSelected}
                            placeholder="Product Name"
                            className="w-full bg-transparent font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-b-2 focus:border-emerald-500 disabled:text-zinc-400 text-sm"
                          />
                        </div>

                        <div className="sm:col-span-3 flex items-center gap-2">
                          <span className="text-[11px] font-bold text-zinc-400 sm:hidden">Qty:</span>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, { quantity: parseInt(e.target.value) || 0 })}
                            disabled={!isSelected}
                            className="w-16 bg-zinc-100 dark:bg-zinc-800 sm:bg-transparent rounded px-2 py-1 sm:p-0 font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-b-2 focus:border-emerald-500 disabled:text-zinc-400 text-sm"
                          />
                          <span className="text-[11px] font-bold text-zinc-400">Units</span>
                        </div>

                        <div className="sm:col-span-3 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-zinc-400">₹</span>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                              disabled={!isSelected}
                              className="w-20 bg-zinc-100 dark:bg-zinc-800 sm:bg-transparent rounded px-2 py-1 sm:p-0 font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-b-2 focus:border-emerald-500 disabled:text-zinc-400 text-sm"
                            />
                          </div>

                          <button type="button" onClick={() => toggleItem(index)} className="hidden sm:inline-flex p-1 text-zinc-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="shrink-0 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 px-5 sm:px-6 py-4 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={handleRescan}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800"
          >
            <RefreshCw className="w-4 h-4 text-zinc-500" />
            Discard & Rescan
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={selectedItems.size === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Save className="w-4 h-4" />
            Save to Inventory ({selectedItems.size})
          </button>
        </div>
      </div>
    </div>
  );
}