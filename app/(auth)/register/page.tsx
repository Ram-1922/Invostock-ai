import type { Metadata } from "next";
import RegisterContent from "./RegisterContent";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create an InvoStock AI account to start automating your inventory and invoice processing.",
  alternates: {
    canonical: "/register",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RegisterPage() {
  return <RegisterContent />;
}