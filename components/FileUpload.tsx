"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, X } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
}

export default function FileUpload({ onFileSelect, accept = "application/pdf,image/*" }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large. Max size is 10MB.");
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  };

  if (selectedFile) {
    return (
      <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-primary-500/10 to-emerald-50/50 dark:from-primary-500/20 dark:to-zinc-900/80 border border-primary-500/20 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
          <div className="shrink-0 p-2.5 sm:p-3 bg-white dark:bg-zinc-950 rounded-xl shadow-sm">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" />
          </div>
          <div className="overflow-hidden">
            <span className="block text-sm font-bold text-zinc-900 dark:text-white truncate max-w-[150px] sm:max-w-xs">
              {selectedFile.name}
            </span>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        </div>
        <button 
          onClick={() => setSelectedFile(null)} 
          className="shrink-0 p-2 bg-white dark:bg-zinc-900 text-zinc-400 hover:text-red-500 rounded-full shadow-sm hover:shadow transition-all ml-2"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-8 sm:p-14 border-2 border-dashed rounded-3xl transition-all duration-300 cursor-pointer text-center ${
        dragActive 
          ? "border-primary-500 bg-primary-500/5 scale-[1.01]" 
          : "border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/80 hover:border-primary-500/50 dark:hover:border-primary-500/50"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" className="hidden" accept={accept} onChange={handleChange} />
      <div className={`p-3 sm:p-4 mb-3 sm:mb-4 rounded-full transition-colors duration-300 ${dragActive ? "bg-primary-500/10 text-primary-500" : "bg-white dark:bg-zinc-950 text-zinc-400 shadow-sm"}`}>
        <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10" />
      </div>
      <p className="text-sm sm:text-base font-bold text-zinc-700 dark:text-zinc-200 px-4">
        Click to upload or drag and drop
      </p>
      <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-2">
        Supports PDF, PNG, JPG (Max 10MB)
      </p>
    </div>
  );
}