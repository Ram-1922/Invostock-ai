import type { Metadata } from "next";
import LandingPageContent from "./LandingPageContent";

export const metadata: Metadata = {
  title: "InvoStock AI - Intelligent Invoice Scanning & Stock Automation",
  description:
    "Upload invoices, extract line items with AI, and sync your inventory in seconds. Enterprise-grade security with AES-256-GCM encryption.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "InvoStock AI - Intelligent Invoice Scanning & Stock Automation",
    description:
      "Upload invoices, extract line items with AI, and sync your inventory in seconds with Qwen Vision AI.",
    url: "/",
    siteName: "InvoStock AI",
    type: "website",
  },
};

export default function LandingPage() {
  return <LandingPageContent />;
}