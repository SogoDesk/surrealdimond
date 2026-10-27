import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";
import InvoiceDocument from "@/components/dashboard/InvoiceDocument";

export const metadata: Metadata = { title: "Invoice | Retailer Dashboard | Surreal Diamond", robots: { index: false } };

export default function Page() {
  return (
    <DashboardShell>
      <InvoiceDocument />
    </DashboardShell>
  );
}
