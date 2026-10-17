import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}): Promise<Metadata> {
  const { invoiceId } = await params;
  return {
    title: `Invoice Details (${invoiceId})`,
    description: `Inspect extracted supplier invoice data, line items, and totals on InvoStock AI.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function InvoiceDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
