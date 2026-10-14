import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inventory Catalog & Stock Control",
  description:
    "Organize, filter, and track warehouse stock levels, SKUs, and product pricing with real-time automated updates.",
  keywords: [
    "inventory management",
    "stock control",
    "product catalog",
    "SKU tracking",
    "warehouse inventory",
    "InvoStock AI",
  ],
  alternates: {
    canonical: "/inventory",
  },
  openGraph: {
    title: "Inventory Catalog & Stock Control | InvoStock AI",
    description:
      "Organize, filter, and track warehouse stock levels, SKUs, and product pricing with real-time automated updates.",
    url: "/inventory",
    siteName: "InvoStock AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inventory Catalog & Stock Control | InvoStock AI",
    description:
      "Organize, filter, and track warehouse stock levels, SKUs, and product pricing.",
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

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
