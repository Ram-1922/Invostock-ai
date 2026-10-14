import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";
import AppShell from "@/components/AppShell";
import CookieConsent from "@/components/CookieConsent";
import TrackingMechanisms from "@/components/TrackingMechanisms";
import RateLimitListener from "@/components/RateLimitListener";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://invostock.ai";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "InvoStock AI - Intelligent Invoice Scanning & Stock Automation",
    template: "%s | InvoStock AI",
  },
  description: "Automate stock tracking and digitize supplier invoices in seconds with AI OCR extraction. Secure zero-trust inventory management.",
  applicationName: "InvoStock AI",
  authors: [{ name: "InvoStock AI" }],
  generator: "Next.js",
  keywords: [
    "invoice scanning",
    "AI OCR",
    "inventory management",
    "stock automation",
    "invoice digitization",
    "InvoStock",
  ],
  creator: "InvoStock AI",
  publisher: "InvoStock AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "InvoStock AI",
    title: "InvoStock AI - Intelligent Invoice Scanning & Stock Automation",
    description: "Automate stock tracking and digitize supplier invoices in seconds with AI OCR extraction.",
  },
  twitter: {
    card: "summary_large_image",
    title: "InvoStock AI - Intelligent Invoice Scanning & Stock Automation",
    description: "Automate stock tracking and digitize supplier invoices in seconds with AI OCR extraction.",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* h-screen is the fallback; browsers that support dvh use it so mobile address bars don't clip the page */}
      <body className="flex h-screen supports-[height:100dvh]:h-[100dvh] bg-background text-foreground overflow-hidden">

        {/* Instantly apply dark mode on page load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />

        {/* Sidebar + Navbar are shown for app pages and skipped on the landing page */}
        <Suspense fallback={null}>
          <AppShell>{children}</AppShell>
        </Suspense>

        <Suspense fallback={null}>
          <TrackingMechanisms />
        </Suspense>

        <CookieConsent />
        <RateLimitListener />
      </body>
    </html>
  );
}