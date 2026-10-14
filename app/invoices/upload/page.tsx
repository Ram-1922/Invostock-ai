"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApiClient } from "@/hooks/useApiClient";
import FileUpload from "@/components/FileUpload";
import ReviewModal from "@/components/ReviewModal";
import { AlertCircle, Loader2 } from "lucide-react";

export default function UploadInvoicePage() {
  const router = useRouter();
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const api = useApiClient();

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null); // Clear previous errors

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/api/invoices/extract", formData);
      if (api.signal.aborted) return;
      setExtractedData(res.data);
    } catch (error: any) {
      if (api.isAbortError(error)) return;
      // Set the dynamic error message from the backend (e.g. "Not a valid invoice")
      setErrorMessage(
        error.response?.data?.error || "An unexpected error occurred while processing the file."
      );
    } finally {
      if (!api.signal.aborted) setIsProcessing(false);
    }
  };

  const handleConfirm = async (confirmedData: any) => {
    try {
      await api.post("/api/invoices", confirmedData);
      if (api.signal.aborted) return;
      router.push("/invoices");
    } catch (error) {
      if (api.isAbortError(error)) return;
      setErrorMessage("Failed to save the invoice to the database.");
    }
  };

  return (
    // max-md:pb-24 leaves room for the mobile bottom navigation bar
    <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 xl:p-8 max-md:pb-24">
      <div className="grid grid-cols-1 max-w-3xl mx-auto">
        <h1 className="text-2xl xl:text-3xl font-black text-slate-800 dark:text-white mb-2">Scan Invoice</h1>
        <p className="text-sm xl:text-base text-slate-500 mb-8 max-xl:mb-5 font-medium">
          Upload a supplier invoice to automatically extract and update inventory stock.
        </p>

        {/* Dynamic Error Banner */}
        {errorMessage && (
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 p-4 max-xl:p-3 mb-6 max-xl:mb-5 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl animate-in slide-in-from-top-4 fade-in duration-300">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-red-800 dark:text-red-400">Processing Failed</h3>
              <p className="text-sm text-red-600 dark:text-red-400/80 mt-1 break-words">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="glass-card p-8 max-xl:p-4">
          {isProcessing ? (
            <div className="grid justify-items-center py-16 max-xl:py-10 text-center">
              <div className="relative mb-6 max-xl:mb-5">
                <div className="absolute inset-0 bg-[#10b983] rounded-full blur-xl opacity-20 animate-pulse"></div>
                <Loader2 className="w-12 h-12 max-xl:w-10 max-xl:h-10 text-[#10b983] animate-spin relative z-10" />
              </div>
              <h3 className="text-xl max-xl:text-lg font-bold text-slate-800 dark:text-white mb-2">Extracting AI Data...</h3>
              <p className="text-base max-xl:text-sm text-slate-500 max-w-sm">
                Reading text via OCR and using Gemini AI to structure your invoice line items. This usually takes 3-5 seconds.
              </p>
            </div>
          ) : (
            <FileUpload onFileSelect={handleFileUpload} />
          )}
        </div>
      </div>
      {extractedData && (
        <ReviewModal
          initialData={extractedData}
          onSave={handleConfirm}
          onRescan={() => {
            setExtractedData(null);
            setErrorMessage(null);
          }}
          onClose={() => setExtractedData(null)}
        />
      )}
    </main>
  );
}