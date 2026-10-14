import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scan & Upload Invoice",
  description:
    "Upload supplier invoices to extract line items with Qwen Vision AI and sync inventory stock automatically.",
  alternates: {
    canonical: "/invoices/upload",
  },
  openGraph: {
    title: "Scan & Upload Invoice | InvoStock AI",
    description:
      "Upload supplier invoices to extract line items with AI and sync inventory automatically.",
    url: "/invoices/upload",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function UploadInvoiceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
