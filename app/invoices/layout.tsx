import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoices & AI Data Extraction",
  description:
    "Upload, process, and review supplier invoices with AI OCR vision extraction. Automate line-item synchronization with inventory.",
  keywords: [
    "invoice processing",
    "AI OCR scanner",
    "supplier invoices",
    "invoice digitization",
    "invoice management",
    "InvoStock AI",
  ],
  alternates: {
    canonical: "/invoices",
  },
  openGraph: {
    title: "Invoices & AI Data Extraction | InvoStock AI",
    description:
      "Upload, process, and review supplier invoices with AI OCR vision extraction.",
    url: "/invoices",
    siteName: "InvoStock AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Invoices & AI Data Extraction | InvoStock AI",
    description:
      "Upload, process, and review supplier invoices with AI OCR vision extraction.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function InvoicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
