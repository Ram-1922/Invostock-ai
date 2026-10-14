import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Overview - Real-Time Metrics & Low Stock Alerts",
  description:
    "Monitor live stock levels, recent supplier invoices, and inventory metrics in real-time with InvoStock AI.",
  keywords: [
    "inventory dashboard",
    "stock overview",
    "low stock alert",
    "invoice metrics",
    "inventory analytics",
    "InvoStock AI",
  ],
  alternates: {
    canonical: "/dashboard",
  },
  openGraph: {
    title: "Dashboard Overview - Real-Time Metrics | InvoStock AI",
    description:
      "Monitor live stock levels, recent supplier invoices, and inventory metrics in real-time with InvoStock AI.",
    url: "/dashboard",
    siteName: "InvoStock AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dashboard Overview | InvoStock AI",
    description:
      "Monitor live stock levels, recent supplier invoices, and inventory metrics in real-time.",
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
